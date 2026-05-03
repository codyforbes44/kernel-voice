import { useState, useEffect, useRef, useCallback } from 'react';

interface UseWakeWordDetectionOptions {
  wakeWords?: string[];
  onWakeWordDetected: () => void;
  enabled?: boolean;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
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

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export function useWakeWordDetection({
  wakeWords = ['hey 3bi', 'ok 3bi', '3bi'],
  onWakeWordDetected,
  enabled = true,
}: UseWakeWordDetectionOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [lastHeard, setLastHeard] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const restartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isStartingRef = useRef(false);
  const enabledRef = useRef(enabled);

  // Keep enabledRef in sync
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  // Check for browser support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
  }, []);

  const stopListening = useCallback(() => {
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // Ignore abort errors
      }
      recognitionRef.current = null;
    }
    
    isStartingRef.current = false;
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    // Prevent multiple simultaneous start attempts
    if (!isSupported || !enabledRef.current || isStartingRef.current) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    // Mark as starting to prevent race conditions
    isStartingRef.current = true;

    // Clean up any existing instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // Ignore abort errors
      }
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log('Wake word detection started');
      isStartingRef.current = false;
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const results = event.results;
      
      for (let i = event.resultIndex; i < results.length; i++) {
        const transcript = results[i][0].transcript.toLowerCase().trim();
        setLastHeard(transcript);
        
        // Check if any wake word is detected
        const detected = wakeWords.some(word => 
          transcript.includes(word.toLowerCase())
        );
        
        if (detected) {
          console.log('Wake word detected:', transcript);
          recognition.stop();
          onWakeWordDetected();
          return;
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.log('Speech recognition error:', event.error);
      isStartingRef.current = false;
      
      if (event.error === 'not-allowed') {
        setIsListening(false);
        return;
      }
      
      // Restart on other errors with debounce
      if (enabledRef.current) {
        restartTimeoutRef.current = setTimeout(() => {
          startListening();
        }, 1000);
      }
    };

    recognition.onend = () => {
      console.log('Wake word detection ended');
      isStartingRef.current = false;
      setIsListening(false);
      
      // Auto-restart if still enabled with longer debounce
      if (enabledRef.current) {
        restartTimeoutRef.current = setTimeout(() => {
          startListening();
        }, 500);
      }
    };

    recognitionRef.current = recognition;
    
    try {
      recognition.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      isStartingRef.current = false;
    }
  }, [isSupported, wakeWords, onWakeWordDetected]);

  // Start/stop based on enabled state
  useEffect(() => {
    if (enabled && isSupported) {
      // Debounce the initial start as well
      const timer = setTimeout(() => {
        startListening();
      }, 300);
      return () => {
        clearTimeout(timer);
        stopListening();
      };
    } else {
      stopListening();
    }
  }, [enabled, isSupported, startListening, stopListening]);

  return {
    isListening,
    isSupported,
    lastHeard,
    startListening,
    stopListening,
  };
}
