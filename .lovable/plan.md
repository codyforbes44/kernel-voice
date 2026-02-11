
# Persist Voice Transcripts for Admin Visibility

## Problem
Voice conversations conducted over WebRTC (OpenAI Realtime, ElevenLabs, VAPI, Gemini Live) are never saved to the database. Transcripts exist only in React state and disappear when the session ends. Admins cannot review or manage voice interactions.

## Solution
Save voice transcripts to the existing `conversations` and `messages` tables when a voice session ends, reusing the same schema and admin UI that already works for text-based chat.

## How It Works

1. When a voice session starts, create a conversation record in the database (if authenticated)
2. When the session ends, batch-insert all accumulated transcripts as messages
3. Admins see voice conversations alongside text conversations in the existing admin panel -- no new admin UI needed

## Technical Changes

### 1. `src/hooks/useVoiceAssistant.ts` -- Save transcripts on session end

- On `startConversation`: if authenticated and no `conversationId` exists, create a new conversation record with a title like "Voice Session - [date]" and store the ID
- On `endConversation`: before clearing state, batch-insert all `liveTranscripts` (user + assistant messages, excluding system markers like pause/resume) into the `messages` table linked to the conversation ID
- Auto-generate a title from the first user transcript if the title is still the default
- Skip persistence entirely for unauthenticated (guest) users -- their data stays ephemeral

### 2. `src/hooks/useTranscriptManager.ts` -- Expose raw transcript data

- Add a `getTranscriptsForSave()` method that returns transcripts filtered to only `user` and `assistant` roles (excluding `system` entries like pause/resume markers)
- This keeps the save logic clean and avoids polluting the messages table with system metadata

### 3. `src/pages/VoiceAssistant.tsx` -- Wire up conversation creation

- Pass the `conversationId` and `setConversationId` to the voice assistant hook (already exposed)
- Ensure the ConversationHistory sidebar reflects voice sessions in real-time via the existing realtime subscription

### 4. No database changes needed

- The existing `conversations` and `messages` tables already support this use case
- RLS policies already allow users to insert into their own conversations and messages
- Admin RLS policies already grant SELECT on all conversations and messages

### 5. No admin UI changes needed

- The existing `/admin/conversations` page with ConversationPreview already displays all conversations and their messages
- Voice conversations will appear alongside text conversations with their full transcript history

## What Gets Saved

| Content | Saved? | Notes |
|---------|--------|-------|
| User speech transcripts | Yes | Stored as `role: 'user'` messages |
| Assistant responses | Yes | Stored as `role: 'assistant'` messages |
| System markers (pause/resume) | No | Filtered out before save |
| Guest conversations | No | Not authenticated, no persistence |
| Audio files | No | Only text transcripts are saved |

## Edge Cases

- If a session disconnects unexpectedly (browser crash, network loss), transcripts in memory are lost. A periodic auto-save (every N messages) will be added as a safeguard.
- Very short sessions (no user messages) will not create a conversation record to avoid clutter.
- The `updated_at` timestamp on the conversation will be set to the session end time.
