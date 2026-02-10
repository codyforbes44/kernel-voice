

# Conversation/Transcript Review + Custom Required Questions

## Review Findings

### Working Well
- **Conversation History**: Lists conversations with realtime updates, create/delete with confirmation, auto-loads last conversation on return
- **Message History**: Loads full message thread with realtime INSERT subscription, auto-scrolls to latest
- **Live Transcripts**: Real-time partial transcript display with role-based styling
- **Transcript Manager**: Handles partial transcript merging for streaming assistant responses

### Bug Found: Chat Edge Function Crash
The `chat` edge function references `MAX_CONTEXT_MESSAGES` on lines 33 and 44, but this constant is **never defined**. This means the text-mode chat will throw a runtime error whenever it tries to load conversation context or send messages. This needs to be fixed by defining the constant (e.g., `const MAX_CONTEXT_MESSAGES = 50;`).

## New Feature: Custom Required Questions

Allow users to define a set of questions that the AI assistant **must** ask and collect valid answers for during a conversation. This is useful for intake forms, lead qualification, customer onboarding, or any structured data collection scenario.

### How It Works

1. Users configure required questions in the agent settings (via SaveAgentDialog or a dedicated section in the SystemPromptEditor)
2. Each question has: the question text, expected answer type (text/email/phone/number/yes-no), and whether it's required
3. When a conversation starts, the questions are injected into the system prompt as structured instructions telling the AI to collect these answers naturally
4. The collected answers are displayed in a summary panel after the conversation

### Database Changes

Add a `required_questions` JSONB column to the `saved_agents` table:

```sql
ALTER TABLE public.saved_agents 
ADD COLUMN required_questions jsonb DEFAULT '[]'::jsonb;
```

The JSONB structure:
```json
[
  {
    "id": "q1",
    "question": "What is your full name?",
    "type": "text",
    "required": true
  },
  {
    "id": "q2", 
    "question": "What is your email address?",
    "type": "email",
    "required": true
  },
  {
    "id": "q3",
    "question": "How many employees does your company have?",
    "type": "number",
    "required": false
  }
]
```

### UI Components

**RequiredQuestionsEditor** (new component)
- Rendered inside the SaveAgentDialog (below description field)
- "Add Question" button to append a new row
- Each row: question text input, answer type dropdown (text/email/phone/number/yes-no), required toggle, delete button
- Drag to reorder (optional, can use up/down buttons)
- Max 10 questions

**Integration with System Prompt**
- When starting a conversation with an agent that has required questions, they are appended to the system prompt as structured instructions:
  ```
  IMPORTANT: You must collect answers to the following required questions during this conversation. 
  Ask them naturally in the flow of conversation. Do not skip required questions.
  
  Questions to collect:
  1. [Required] What is your full name? (expect: text)
  2. [Required] What is your email address? (expect: email)
  3. [Optional] How many employees does your company have? (expect: number)
  ```

### Files

**New Files**
- `src/components/voice/RequiredQuestionsEditor.tsx` -- Editor UI for adding/editing/removing questions

**Modified Files**
- `supabase/functions/chat/index.ts` -- Fix undefined `MAX_CONTEXT_MESSAGES` (set to 50)
- `src/hooks/useSavedAgents.ts` -- Add `required_questions` to SavedAgent type and CreateAgentInput
- `src/components/voice/SaveAgentDialog.tsx` -- Add RequiredQuestionsEditor section
- `src/pages/VoiceAssistant.tsx` -- When loading an agent with required questions, append them to the system prompt sent to the voice provider
- `src/components/voice/voiceTypes.ts` -- Add `RequiredQuestion` type interface

### Technical Details

**RequiredQuestion type:**
```typescript
export interface RequiredQuestion {
  id: string;
  question: string;
  type: 'text' | 'email' | 'phone' | 'number' | 'yes_no';
  required: boolean;
}
```

**System prompt injection** (in handleLoadAgent):
When an agent with `required_questions` is loaded, the questions are formatted and appended to `system_prompt` before passing it to `setSystemPrompt()`. This keeps the feature transparent to all voice providers -- no provider-specific changes needed.

**SaveAgentDialog changes:**
- State: `requiredQuestions` array managed alongside name/description/icon
- On save: include `required_questions` in the agent payload
- On edit: pre-populate from `editingAgent.required_questions`

**RequiredQuestionsEditor component:**
- Props: `questions: RequiredQuestion[]`, `onChange: (questions: RequiredQuestion[]) => void`, `disabled?: boolean`
- Each question row: Input for question text, Select for answer type, Switch for required, X button to delete
- "Add Question" button at bottom (disabled if 10 questions already)
- Generates unique IDs via `crypto.randomUUID()` or timestamp-based

