import { useEffect, useCallback } from 'react';

export interface KeyboardShortcutOptions {
  onMuteToggle?: () => void;
  onEndConversation?: () => void;
  onStartConversation?: () => void;
  isConnected?: boolean;
  isReady?: boolean;
  enabled?: boolean;
}

/**
 * Hook for keyboard shortcuts in the voice assistant.
 * 
 * Shortcuts:
 * - Ctrl/Cmd + M: Toggle mute
 * - Escape: End conversation (when connected)
 * - Enter: Start conversation (when ready and not connected)
 */
export function useKeyboardShortcuts(options: KeyboardShortcutOptions) {
  const {
    onMuteToggle,
    onEndConversation,
    onStartConversation,
    isConnected = false,
    isReady = false,
    enabled = true,
  } = options;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;
    
    // Ignore if user is typing in an input field
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      // Allow Escape to work even in inputs
      if (event.key !== 'Escape') {
        return;
      }
    }

    // Ctrl/Cmd + M: Toggle mute
    if ((event.ctrlKey || event.metaKey) && event.key === 'm') {
      event.preventDefault();
      if (isConnected) {
        onMuteToggle?.();
      }
      return;
    }

    // Escape: End conversation
    if (event.key === 'Escape') {
      event.preventDefault();
      if (isConnected) {
        onEndConversation?.();
      }
      return;
    }

    // Enter: Start conversation (only when not in an input and ready)
    if (event.key === 'Enter' && !event.shiftKey) {
      if (!isConnected && isReady) {
        event.preventDefault();
        onStartConversation?.();
      }
      return;
    }
  }, [enabled, isConnected, isReady, onMuteToggle, onEndConversation, onStartConversation]);

  useEffect(() => {
    if (!enabled) return;
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleKeyDown]);
}

export default useKeyboardShortcuts;
