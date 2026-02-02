
# Plan: Fix Audio Playback in 3ʙɪ Voice Assistant

## Problem Identified

The audio element for receiving AI voice responses is created in memory but **never attached to the DOM**. This causes audio playback to fail in many browsers, particularly on mobile devices that have stricter autoplay policies.

```typescript
// Current code (line 275-276 in useOpenAIConversation.ts)
audioElRef.current = document.createElement('audio');
audioElRef.current.autoplay = true;
// Audio element is NEVER added to the DOM
```

## Root Cause

Modern browsers require audio elements to be in the DOM for reliable playback. Additionally, autoplay is often blocked without user interaction, and an explicit `play()` call after setting `srcObject` helps ensure playback starts.

## Solution

Update `src/hooks/useOpenAIConversation.ts` to:

1. **Append the audio element to the document body** after creation
2. **Set additional properties** to improve compatibility (muted temporarily for autoplay, then unmute)
3. **Call `play()` explicitly** when the remote audio track is received
4. **Remove the audio element from the DOM** during cleanup

## Changes Required

### File: `src/hooks/useOpenAIConversation.ts`

#### 1. Audio Element Creation (lines 274-277)

**Current:**
```typescript
// Create audio element for playback
audioElRef.current = document.createElement('audio');
audioElRef.current.autoplay = true;
```

**Fixed:**
```typescript
// Create audio element for playback and append to DOM
audioElRef.current = document.createElement('audio');
audioElRef.current.autoplay = true;
audioElRef.current.playsInline = true; // Important for iOS
document.body.appendChild(audioElRef.current);
```

#### 2. Remote Audio Track Handler (lines 282-288)

**Current:**
```typescript
// Handle remote audio
pc.ontrack = (e) => {
  console.log('[OpenAI] Received remote audio track');
  if (audioElRef.current) {
    audioElRef.current.srcObject = e.streams[0];
  }
};
```

**Fixed:**
```typescript
// Handle remote audio
pc.ontrack = (e) => {
  console.log('[OpenAI] Received remote audio track');
  if (audioElRef.current) {
    audioElRef.current.srcObject = e.streams[0];
    // Explicitly call play() to ensure audio starts
    audioElRef.current.play().catch(err => {
      console.warn('[OpenAI] Audio autoplay blocked:', err);
    });
  }
};
```

#### 3. Cleanup Function (lines 87-90)

**Current:**
```typescript
if (audioElRef.current) {
  audioElRef.current.srcObject = null;
  audioElRef.current = null;
}
```

**Fixed:**
```typescript
if (audioElRef.current) {
  audioElRef.current.pause();
  audioElRef.current.srcObject = null;
  // Remove from DOM
  if (audioElRef.current.parentNode) {
    audioElRef.current.parentNode.removeChild(audioElRef.current);
  }
  audioElRef.current = null;
}
```

## Why This Fixes the Issue

| Problem | Solution |
|---------|----------|
| Audio element not in DOM | Append to `document.body` |
| Autoplay may be blocked | Call `play()` explicitly with error handling |
| iOS Safari compatibility | Add `playsInline = true` |
| Memory leak on cleanup | Remove element from DOM during cleanup |

## Testing After Implementation

1. Connect to the voice assistant
2. Verify the AI greeting ("Hello! How can I help you today?") is heard
3. Verify ongoing conversation audio works
4. Test on mobile devices (iOS Safari has strictest policies)
5. Verify no orphaned audio elements remain after disconnecting

## Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useOpenAIConversation.ts` | Modify | Fix audio element creation, playback, and cleanup |
