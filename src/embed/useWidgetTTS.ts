import { useState, useRef, useCallback } from 'react';

interface UseWidgetTTSOptions {
  supabaseUrl: string;
  supabaseKey: string;
  voiceId?: string;
  onError?: (error: string) => void;
}

interface UseWidgetTTSReturn {
  isSpeaking: boolean;
  isLoading: boolean;
  speak: (text: string) => Promise<void>;
  stop: () => void;
  toggleEnabled: () => void;
  isEnabled: boolean;
}

export function useWidgetTTS({
  supabaseUrl,
  supabaseKey,
  voiceId = 'EXAVITQu4vr4xnSDxMaL', // Sarah - default voice
  onError,
}: UseWidgetTTSOptions): UseWidgetTTSReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsSpeaking(false);
    setIsLoading(false);
  }, []);

  const speak = useCallback(async (text: string) => {
    if (!isEnabled || !text.trim()) return;

    // Stop any current playback
    stop();
    setIsLoading(true);

    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/widget-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ text, voiceId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `TTS failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.audioContent) {
        throw new Error('No audio content received');
      }

      // Use data URI for playback
      const audioUrl = `data:audio/mpeg;base64,${data.audioContent}`;
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => {
        setIsLoading(false);
        setIsSpeaking(true);
      };

      audio.onended = () => {
        setIsSpeaking(false);
        audioRef.current = null;
      };

      audio.onerror = () => {
        setIsSpeaking(false);
        setIsLoading(false);
        onError?.('Failed to play audio');
      };

      await audio.play();
    } catch (error) {
      console.error('[Widget TTS] Error:', error);
      setIsLoading(false);
      setIsSpeaking(false);
      onError?.(error instanceof Error ? error.message : 'TTS failed');
    }
  }, [isEnabled, supabaseUrl, supabaseKey, voiceId, stop, onError]);

  const toggleEnabled = useCallback(() => {
    if (isSpeaking) {
      stop();
    }
    setIsEnabled(prev => !prev);
  }, [isSpeaking, stop]);

  return {
    isSpeaking,
    isLoading,
    speak,
    stop,
    toggleEnabled,
    isEnabled,
  };
}
