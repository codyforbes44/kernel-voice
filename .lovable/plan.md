

# Save AI Agents Feature

## What This Does

Lets registered users save their current voice assistant configuration as a named "AI Agent" they can quickly switch between. For example, a user could save a "Technical Advisor" agent using Gemini Live with the Charon voice and a technical system prompt, and a "Creative Partner" using the default provider with a creative prompt -- then load either one with a single click.

## How It Works

1. A "Save as Agent" button appears in the voice settings panel (next to the provider selector)
2. Users give their agent a name, optional description, and optional icon/emoji
3. All current settings are captured: provider, voice, provider-specific settings, system prompt, and first message
4. A "My Agents" section appears above the provider selector showing saved agents as clickable cards
5. Clicking a saved agent loads all its settings at once
6. Users can edit, duplicate, or delete their saved agents

## Database

A new `saved_agents` table stores the full agent configuration:

| Column | Type | Description |
|---|---|---|
| id | uuid | Primary key |
| user_id | uuid | Owner (references auth.users) |
| name | text | Agent name (required) |
| description | text | Optional description |
| icon | text | Emoji or icon identifier |
| voice_provider | text | openai, elevenlabs, vapi, gemini |
| voice_id | text | Voice selection (e.g. "alloy", "Puck") |
| provider_settings | jsonb | Provider-specific settings (temperature, VAD, etc.) |
| system_prompt | text | The system prompt |
| first_message | text | Initial greeting |
| is_shared | boolean | Whether other users can see/use this agent |
| created_at | timestamptz | Auto-set |
| updated_at | timestamptz | Auto-set |

RLS policies:
- Users can CRUD their own agents
- Users can SELECT shared agents (read-only)
- Admins can manage all agents

## UI Components

### SaveAgentDialog
- Modal triggered by a "Save as Agent" button in the voice settings area
- Fields: name (required), description, icon picker (emoji grid)
- Captures current provider, voice, settings, and system prompt automatically
- "Save" creates the agent; "Update" overwrites an existing one

### SavedAgentsList
- Horizontal scrollable card list shown above the provider selector on the voice assistant page
- Each card shows: icon, name, provider badge
- Click to load all settings
- Overflow menu (three dots) for Edit, Duplicate, Delete
- Empty state: "Save your first AI Agent to quickly switch configurations"

### Integration Points
- VoiceAssistant page: Add SavedAgentsList above VoiceInterfaceCard
- VoiceProviderSelector: Add "Save as Agent" button at the bottom of settings

## Technical Details

### New Files
- `src/components/voice/SaveAgentDialog.tsx` -- Save/edit modal
- `src/components/voice/SavedAgentsList.tsx` -- Agent cards list
- `src/hooks/useSavedAgents.ts` -- CRUD hook (similar pattern to useCustomPromptPresets)

### Modified Files
- `src/pages/VoiceAssistant.tsx` -- Add SavedAgentsList to both mobile and desktop layouts
- `src/components/voice/VoiceProviderSelector.tsx` -- Add "Save as Agent" button
- `src/components/voice/VoiceInterfaceCard.tsx` -- Pass through onLoadAgent callback
- `src/components/voice/voiceInterfaceTypes.ts` -- Add agent-related props

### Database Migration
```sql
CREATE TABLE public.saved_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  icon text DEFAULT '🤖',
  voice_provider text NOT NULL DEFAULT 'openai',
  voice_id text,
  provider_settings jsonb DEFAULT '{}',
  system_prompt text NOT NULL DEFAULT '',
  first_message text,
  is_shared boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.saved_agents ENABLE ROW LEVEL SECURITY;

-- Users can manage their own agents
CREATE POLICY "Users can manage own agents"
  ON public.saved_agents FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can view shared agents
CREATE POLICY "Users can view shared agents"
  ON public.saved_agents FOR SELECT
  USING (is_shared = true);

-- Admins can manage all
CREATE POLICY "Admins can manage all agents"
  ON public.saved_agents FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Auto-update updated_at
CREATE TRIGGER update_saved_agents_updated_at
  BEFORE UPDATE ON public.saved_agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Loading an Agent
When a user clicks a saved agent card, the `onLoadAgent` callback:
1. Sets voice provider via `setVoiceProvider`
2. Sets voice via `setOpenAIVoice` (or equivalent for other providers)
3. Applies provider settings via `setOpenAISettings` / `setElevenLabsSettings` / etc.
4. Sets system prompt via `setSystemPrompt`
5. Shows a toast: "Loaded agent: {name}"

### Saving an Agent
Captures current state from the VoiceProviderSelector props:
- `voiceProvider` -> `voice_provider`
- `openaiVoice` / gemini voice / etc. -> `voice_id`
- `openaiSettings` / `elevenlabsSettings` / etc. -> `provider_settings`
- `systemPrompt` -> `system_prompt`
- `openaiSettings.firstMessage` / etc. -> `first_message`

