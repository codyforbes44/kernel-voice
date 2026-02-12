

# Fix ElevenLabs STT WebSocket URL in Widget

## Problem
The external widget's STT hook (`src/embed/useElevenLabsSTT.ts`) connects to:
```
wss://api.elevenlabs.io/v1/speech-to-text/streaming
```

But the correct endpoint is:
```
wss://api.elevenlabs.io/v1/speech-to-text/stream
```

The working implementation in `src/components/voice/TextMessageInput.tsx` uses the correct `/stream` path. The `/streaming` path does not exist, causing the WebSocket connection to fail immediately.

## Fix

### File: `src/embed/useElevenLabsSTT.ts`
- Change line ~148 from:
  `wss://api.elevenlabs.io/v1/speech-to-text/streaming?model_id=scribe_v2_realtime&token=${token}`
- To:
  `wss://api.elevenlabs.io/v1/speech-to-text/stream?model_id=scribe_v2_realtime&token=${token}`

This is a one-line URL fix. No other files need changes.

## Verification
After the fix, the widget's voice-to-text mic button should connect successfully to ElevenLabs Scribe and produce partial/committed transcripts.

