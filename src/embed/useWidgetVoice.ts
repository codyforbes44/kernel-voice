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
  audioLevel: number;
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
  const [audioLevel, setAudioLevel] = useState(0);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const transcriptRef = useRef<string>('');
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Cleanup audio analysis
  const cleanupAudioAnalysis = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevel(0);
  }, []);

  // Analyze audio levels
  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average volume level (0-1)
    const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
    const normalizedLevel = Math.min(average / 128, 1);
    
    setAudioLevel(normalizedLevel);

    if (isListening) {
      animationFrameRef.current = requestAnimationFrame(analyzeAudio);
    }
  }, [isListening]);

  // Setup audio analysis
  const setupAudioAnalysis = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      analyzeAudio();
    } catch (error) {
      console.error('Failed to setup audio analysis:', error);
    }
  }, [analyzeAudio]);

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
      cleanupAudioAnalysis();
      // If we have accumulated transcript, send it
      if (transcriptRef.current.trim()) {
        onTranscript(transcriptRef.current.trim());
        transcriptRef.current = '';
      }
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      cleanupAudioAnalysis();
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
      cleanupAudioAnalysis();
    };
  }, [isSupported, onTranscript, onError, cleanupAudioAnalysis]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return;

    try {
      // Request microphone permission and setup audio analysis
      setupAudioAnalysis()
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
  }, [isListening, onError, setupAudioAnalysis]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) return;
    recognitionRef.current.stop();
    cleanupAudioAnalysis();
  }, [isListening, cleanupAudioAnalysis]);

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
    audioLevel,
    startListening,
    stopListening,
    toggleListening,
  };
}
