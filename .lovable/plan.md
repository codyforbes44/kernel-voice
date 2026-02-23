

# Fix OpenAI Voice Integration -- Complete Audio Resolution

## Root Cause Analysis

Two critical issues are preventing the OpenAI voice integration from working:

### Bug 1: Model Mismatch (Primary Issue)
The edge function (`openai-realtime-token`) creates an ephemeral session token using model `gpt-4o-realtime-preview-2025-06-03`, but the frontend WebRTC handshake (`useOpenAIConversation.ts`) connects with model `gpt-4o-realtime-preview-2024-12-17`. The ephemeral token is bound to the model it was created with -- the token simply won't work with a different model. This causes the WebRTC SDP exchange to fail or produce a non-functional session with no audio output.

### Bug 2: Missing Edge Function Config
The `openai-realtime-token` function has no entry in `supabase/config.toml`. Without an explicit `verify_jwt = false` entry, JWT verification behavior may be inconsistent.

### Bug 3: Incomplete CORS Headers
The edge function uses a minimal `Access-Control-Allow-Headers` list, missing several headers the client sends (e.g., `x-client-info`, `x-supabase-client-platform`). This can cause preflight failures in some browsers.

---

## Fix Plan

### 1. Align the model in `useOpenAIConversation.ts` (line 399)

Change:
```
const model = 'gpt-4o-realtime-preview-2024-12-17';
```
To:
```
const model = 'gpt-4o-realtime-preview-2025-06-03';
```

This ensures the frontend WebRTC handshake uses the same model the session token was created for.

### 2. Fix CORS headers in `supabase/functions/openai-realtime-token/index.ts`

Update the CORS headers to include all required client headers:
```
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};
```

### 3. Add edge function config to `supabase/config.toml`

Add:
```toml
[functions.openai-realtime-token]
verify_jwt = false
```

### 4. Add enhanced diagnostic logging in `useOpenAIConversation.ts`

Add logging around the SDP exchange to surface connection state changes and ICE failures:
- Log `pc.connectionState` changes via `onconnectionstatechange`
- Log `pc.iceConnectionState` changes via `oniceconnectionstatechange`
- Log when audio element `canplay` event fires to confirm the stream is playable
- Surface a user-visible toast if the SDP exchange returns an error (currently silent in some cases)

---

## Files Changed

| File | Change |
|------|--------|
| `src/hooks/useOpenAIConversation.ts` | Fix model string to `gpt-4o-realtime-preview-2025-06-03`, add WebRTC state logging |
| `supabase/functions/openai-realtime-token/index.ts` | Fix CORS headers |
| `supabase/config.toml` | Add `openai-realtime-token` function entry |

## Expected Outcome
After these fixes, the ephemeral token model and WebRTC model will match, CORS will pass correctly, and the WebRTC connection will establish a functional audio stream. The assistant's voice will be audible.

