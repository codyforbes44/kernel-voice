

# Customer-First Platform Enhancements

## Overview
Four improvements inspired by best-in-class customer-first principles: smarter registration prompts, richer analytics, transparent data receipts, and automatic data lifecycle management.

---

## 1. Value-Based Registration Prompt

**Current behavior:** The registration modal shows when a guest ends a conversation (any number of messages).

**New behavior:** Show the prompt after the guest has received 3 meaningful AI responses (not on conversation end), creating a "value-first" moment where the user has experienced enough to want to save their session.

### Changes
- **`src/hooks/useVoiceAssistant.ts`**: Track `guestAssistantResponseCount`. Increment when an assistant transcript or text response is added. When count reaches 3, set `showRegistrationPrompt = true` automatically (mid-conversation, not at the end). Remove the end-of-conversation trigger.
- **`src/components/voice/RegistrationPromptModal.tsx`**: Update copy from "You had X messages" to "You've had a great conversation so far" -- value-oriented framing. Add a "Don't show again" option that persists to sessionStorage so the modal doesn't re-appear if dismissed.

---

## 2. Enhanced Widget Analytics Dashboard

**Current state:** Tracks sessions, messages, opens, errors.

**New metrics to add (computed from existing data, no schema changes):**

### Changes
- **`src/components/admin/widgets/WidgetAnalytics.tsx`**:
  - Add **Completion Rate** stat card: % of sessions that had at least 2 messages (open + message events with matching session_id)
  - Add **Avg Messages/Session**: total messages / unique sessions
  - Add **Avg Session Duration**: difference between first and last event timestamp per session
  - Add **Engagement Rate**: sessions with 3+ messages / total sessions
  - Reorganize stats grid from 4 to 6 cards (3x2 on desktop)

---

## 3. Conversation Data Receipt

A new component shown at the end of voice sessions for authenticated users, summarizing what was captured.

### Changes
- **New file: `src/components/voice/ConversationReceipt.tsx`**:
  - A dismissible card shown after `endConversation` completes
  - Shows: number of messages saved, conversation title, timestamp, duration estimate
  - Includes a "Delete This Conversation" button that removes the conversation from the database
  - Includes a "Download Transcript" button that exports messages as a .txt file
- **`src/pages/VoiceAssistant.tsx`**: Add state `showReceipt` and render `ConversationReceipt` after conversation ends for authenticated users
- **`src/hooks/useVoiceAssistant.ts`**: Expose `lastSessionStats` (message count, duration, conversation ID) computed during `endConversation`

---

## 4. Automatic Data Anonymization (90-Day Cleanup)

A scheduled database function and edge function to anonymize old widget analytics and clean up stale guest data.

### Changes
- **Database migration**: Create a SQL function `anonymize_old_analytics()` that:
  - Updates `widget_analytics` rows older than 90 days: nullifies `session_id` and `referrer_domain`, keeps aggregate event type/count
  - Deletes conversations with no user_id (orphaned guest data) older than 30 days
- **New edge function: `supabase/functions/data-lifecycle/index.ts`**:
  - Invokes the `anonymize_old_analytics()` database function via RPC
  - Designed to be called via a cron job or manually from admin settings
  - Returns summary of rows affected
- **`src/pages/admin/Settings.tsx`**: Add a "Run Data Cleanup" button in admin settings that invokes the edge function on demand, with a last-run timestamp display

---

## Technical Details

### File Summary

| File | Action |
|------|--------|
| `src/hooks/useVoiceAssistant.ts` | Modify - value-based prompt trigger, expose lastSessionStats |
| `src/components/voice/RegistrationPromptModal.tsx` | Modify - value-oriented copy, "don't show again" |
| `src/components/admin/widgets/WidgetAnalytics.tsx` | Modify - add 4 new computed metrics |
| `src/components/voice/ConversationReceipt.tsx` | Create - post-session data receipt |
| `src/pages/VoiceAssistant.tsx` | Modify - render ConversationReceipt |
| `supabase/functions/data-lifecycle/index.ts` | Create - anonymization edge function |
| Database migration | Create `anonymize_old_analytics()` function |
| `src/pages/admin/Settings.tsx` | Modify - add cleanup trigger button |

### Sequencing
1. Database migration (anonymization function)
2. Edge function (data-lifecycle)
3. Frontend changes (all can be done in parallel)

