import { useState, useCallback, useRef, useEffect } from 'react';

// Web Speech API type declarations (inline to avoid global conflicts)
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
  };
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((ev: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((ev: SpeechRecognitionEvent) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

// Get Speech Recognition constructor with proper typing
function getSpeechRecognition(): (new () => SpeechRecognitionInstance) | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

interface UseWidgetVoiceOptions {
  onTranscript: (text: string) => void;
  onError?: (error: string) => void;
}

interface UseWidgetVoiceReturn {
  isListening: boolean;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
}

// Check if Web Speech API is available
const isSpeechRecognitionSupported = (): boolean => {
  return getSpeechRecognition() !== null;
};

export function useWidgetVoice({
  onTranscript,
  onError,
}: UseWidgetVoiceOptions): UseWidgetVoiceReturn {
  const [isListening, setIsListening] = useState(false);
  const [isSupported] = useState(isSpeechRecognitionSupported);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const transcriptRef = useRef<string>('');

  // Initialize speech recognition
  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognitionClass = getSpeechRecognition();

    if (!SpeechRecognitionClass) return;

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      transcriptRef.current = '';
    };

    recognition.onend = () => {
      setIsListening(false);
      // If we have accumulated transcript, send it
      if (transcriptRef.current.trim()) {
        onTranscript(transcriptRef.current.trim());
        transcriptRef.current = '';
      }
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      const errorMessages: Record<string, string> = {
        'no-speech': 'No speech detected. Please try again.',
        'audio-capture': 'Microphone not available. Please check permissions.',
        'not-allowed': 'Microphone access denied. Please enable microphone permissions.',
        'network': 'Network error. Please check your connection.',
        'aborted': 'Voice input cancelled.',
      };
      const message = errorMessages[event.error] || `Voice error: ${event.error}`;
      onError?.(message);
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      // Accumulate final transcripts
      if (finalTranscript) {
        transcriptRef.current += finalTranscript;
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, [isSupported, onTranscript, onError]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return;

    try {
      // Request microphone permission first
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then(() => {
          transcriptRef.current = '';
          recognitionRef.current?.start();
        })
        .catch(() => {
          onError?.('Microphone access denied. Please enable microphone permissions.');
        });
    } catch (error) {
      onError?.('Failed to start voice input.');
    }
  }, [isListening, onError]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) return;
    recognitionRef.current.stop();
  }, [isListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
  };
}
