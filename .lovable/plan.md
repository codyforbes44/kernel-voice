## Goal

Replace Lovable AI Gateway and direct OpenAI text/embedding calls with **direct Gemini API** calls using the new `GEMINI_API_KEY`. Keep OpenAI in place **only** as a voice provider (Realtime API via `openai-realtime-token` + `useOpenAIConversation`).

## What changes

### Edge functions to refactor (Lovable Gateway → Gemini direct)

1. **`supabase/functions/chat/index.ts`** — currently calls `ai.gateway.lovable.dev` with `google/gemini-2.5-flash`. Rewrite to call `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent` directly using `GEMINI_API_KEY`. Convert OpenAI-style SSE the frontend expects: re-emit Gemini stream chunks as `data: {choices:[{delta:{content}}]}` SSE so existing client streaming parser keeps working with no frontend changes.
2. **`supabase/functions/brand-og-image/index.ts`** — currently uses Lovable Gateway with `google/gemini-3-pro-image-preview`. Rewrite to call Gemini image generation directly (`gemini-2.5-flash-image` REST endpoint), returning the same base64 response shape.

### Edge functions to refactor (OpenAI → Gemini)

3. **`supabase/functions/generate-embeddings/index.ts`** — switch from `text-embedding-3-small` (1536-dim) to Gemini `text-embedding-004` (768-dim) via `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent` (and `:batchEmbedContents` for arrays). DB column is already `vector(768)` and contains 0 rows, so this is dimension-compatible.
4. **`supabase/functions/kb-search/index.ts`** — same switch: generate query embedding via Gemini `text-embedding-004` instead of OpenAI. Replace the `OPENAI_API_KEY` gating with `GEMINI_API_KEY` gating.
5. **`supabase/functions/widget-chat/index.ts`** — currently prefers Anthropic, falls back to OpenAI chat completions, and uses OpenAI for KB embeddings. Refactor:
   - Replace OpenAI chat fallback with Gemini (`gemini-2.5-flash:generateContent`).
   - Replace OpenAI embedding call with Gemini `text-embedding-004`.
   - Keep Anthropic (Claude) path intact since `ANTHROPIC_API_KEY` is still configured and unrelated to this refactor.

### Functions left untouched (intentional)

- `openai-realtime-token` — OpenAI voice provider, keep as-is.
- `gemini-chat`, `gemini-live-token`, `analyze-document`, `generate-content` — already use `GEMINI_API_KEY` directly, no changes needed.
- `claude-reason`, `elevenlabs-*`, `vapi-session`, `voice-session`, `widget-tts`, `search`, `process-email-queue`, `stripe-*`, `data-lifecycle`, `admin-operations`, `customer-portal`, `create-checkout`, `send-password-reset`, `check-subscription` — no AI gateway / OpenAI text usage.
- `useOpenAIConversation.ts` and `useVoiceAssistant.ts` — voice client, untouched.

## Frontend impact

None. The `chat` function continues to emit OpenAI-compatible SSE (`data: {choices:[{delta:{content}}]}\n\n` + final `data: [DONE]\n\n`) so any existing streaming consumer keeps working unchanged.

## Technical notes

- **Gemini streaming** uses `:streamGenerateContent?alt=sse&key=...` and emits SSE chunks shaped like `{candidates:[{content:{parts:[{text:"..."}]}}]}`. We translate each chunk's `parts[0].text` into an OpenAI-style delta on the wire.
- **Rate-limit handling**: map Gemini `429` → 429 with `RATE_LIMIT` code, and any auth/quota error → 402 with `PAYMENT_REQUIRED`, preserving the existing toast behavior referenced in `mem://integration/lovable-ai-migration`.
- **System prompts** stay server-side (unchanged behavior); Gemini receives them via `systemInstruction` field.
- **Embedding dimension** stays 768; `match_knowledge_chunks` SQL function is dimension-agnostic and continues to work.
- No DB migrations, no secret changes, no config.toml changes required.

## Memory updates after build

- Update `mem://integration/lovable-ai-migration` → rename/replace with a "Gemini direct" note (Lovable Gateway no longer used for text; OpenAI retained only for Realtime voice).
- Update `mem://features/knowledge-base-system` → embedding model is now `text-embedding-004` (768-dim).