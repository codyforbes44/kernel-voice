
## Fix: OpenAI (3BI) Agent First Message on Session Initiation

### Root Cause Analysis

There are three compounding bugs preventing the agent from speaking the first message:

**Bug 1 — Model mismatch between token creation and WebRTC connection**
The `openai-realtime-token` edge function creates a session with model `gpt-4o-realtime-preview-2025-06-03`, but the WebRTC SDP request in `useOpenAIConversation.ts` connects using the hardcoded model `gpt-4o-realtime-preview-2024-12-17`. OpenAI requires these to be identical — the mismatch causes silent session state inconsistencies.

**Bug 2 — First message sent too early (wrong event)**
The greeting is triggered on `session.created`, but at that point the session hasn't been fully configured yet. The data channel `open` handler (which runs before `session.created`) sends a `session.update` event (adding tools, transcription config, etc.). OpenAI then replies with `session.updated` to confirm everything is ready. The correct sequence is to send the first message **after `session.updated`**, not `session.created`.

**Bug 3 — Stale closure on `options` object**
`handleDataChannelMessage` has `[options]` in its dependency array. The entire `options` object is passed inline (a new object reference every render), which causes the `useCallback` to be recreated constantly and potentially capture stale values — particularly `firstMessage`. The fix is to store mutable values like `firstMessage` in a stable `useRef` that is always up-to-date.

---

### Fix Plan

#### 1. `supabase/functions/openai-realtime-token/index.ts`
- Change the model from `gpt-4o-realtime-preview-2025-06-03` to `gpt-4o-realtime-preview-2024-12-17` to match the WebRTC SDP connection model (or alternatively update both to the same 2025 model — we'll align both to the latest `gpt-4o-realtime-preview-2025-06-03`).

#### 2. `src/hooks/useOpenAIConversation.ts`

**Ref stabilization**: Create a `firstMessageRef` using `useRef` that is updated via `useEffect` whenever `options.firstMessage` changes. This decouples the `handleDataChannelMessage` callback from `options` and eliminates stale closures.

**Move greeting trigger from `session.created` to `session.updated`**: The `session.updated` event is the correct signal that the session is fully configured and ready to accept `conversation.item.create` and `response.create` messages. Add a `greetingSentRef` (a `useRef<boolean>`) flag to ensure the greeting is only sent once per session, even if multiple `session.updated` events are received.

**Updated event sequence**:
```text
dc.open
  └─> session.update (configure tools + transcription)
        └─> session.created  [set status=connected, call onConnect]
              └─> session.updated  [send firstMessage here, only once]
```

**Concrete changes to `handleDataChannelMessage`**:

- In `session.created`: Keep status/phase update and `onConnect` call. Remove first message injection.
- In `session.updated`: Add first message injection logic guarded by `greetingSentRef.current === false`. After sending, set `greetingSentRef.current = true`.

**Update `startSession`**: Reset `greetingSentRef.current = false` at the top of `startSession` (before `cleanup()`) so each new session starts fresh.

**Align WebRTC model**: Change the hardcoded model string from `gpt-4o-realtime-preview-2024-12-17` to `gpt-4o-realtime-preview-2025-06-03` to match the token creation model.

**Edge function model alignment**: Update `openai-realtime-token/index.ts` to use the same model `gpt-4o-realtime-preview-2025-06-03` (already set correctly there) — and update `useOpenAIConversation.ts` to match it.

---

### Files to Change

| File | Change |
|---|---|
| `supabase/functions/openai-realtime-token/index.ts` | Ensure model is `gpt-4o-realtime-preview-2025-06-03` (already correct) |
| `src/hooks/useOpenAIConversation.ts` | Fix model string; add `firstMessageRef` + `greetingSentRef`; move greeting from `session.created` to `session.updated` |

---

### Technical Details

The corrected first-message flow in `useOpenAIConversation.ts`:

```typescript
// Stable ref — always current, no stale closure
const firstMessageRef = useRef(options.firstMessage);
useEffect(() => { firstMessageRef.current = options.firstMessage; }, [options.firstMessage]);

// Guard: send greeting only once per session
const greetingSentRef = useRef(false);

// In handleDataChannelMessage (no longer depends on `options`):
case 'session.updated':
  console.log('[OpenAI] Session updated — ready');
  if (!greetingSentRef.current && firstMessageRef.current?.trim() && dcRef.current?.readyState === 'open') {
    greetingSentRef.current = true;
    console.log('[OpenAI] Sending first message greeting');
    dcRef.current.send(JSON.stringify({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text: `[System: Greet the user with: "${firstMessageRef.current}"]` }]
      }
    }));
    dcRef.current.send(JSON.stringify({ type: 'response.create' }));
  }
  break;

// In startSession, before cleanup():
greetingSentRef.current = false;
```

The `handleDataChannelMessage` dependency array changes from `[options]` to `[]` (using refs for all mutable values), making the callback stable across renders.
