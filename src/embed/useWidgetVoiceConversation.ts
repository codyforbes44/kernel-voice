import { useState, useCallback, useRef, useEffect } from 'react';
import { sendWidgetMessage } from './api';
import { WidgetMessage } from './types';

export type VoiceConversationState = 'idle' | 'listening' | 'thinking' | 'speaking';

// Web Speech API types (inline)
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: { length: number; [index: number]: { isFinal: boolean; [index: number]: { transcript: string } } };
}
interface SpeechRecognitionErrorEvent { error: string }
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

function getSpeechRecognition(): (new () => SpeechRecognitionInstance) | null {
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

interface UseWidgetVoiceConversationOptions {
  apiKey: string;
  sessionId: string;
  systemPrompt?: string;
  enableKB?: boolean;
  kbDocumentIds?: string[];
  supabaseUrl: string;
  supabaseKey: string;
  ttsVoiceId?: string;
  autoListen?: boolean;
  onMessage: (message: WidgetMessage) => void;
  onError?: (error: string) => void;
}

interface UseWidgetVoiceConversationReturn {
  state: VoiceConversationState;
  audioLevel: number;
  partialTranscript: string;
  start: () => void;
  stop: () => void;
  togglePause: () => void;
}

export function useWidgetVoiceConversation({
  apiKey,
  sessionId,
  systemPrompt,
  enableKB,
  kbDocumentIds,
  supabaseUrl,
  supabaseKey,
  ttsVoiceId = 'EXAVITQu4vr4xnSDxMaL',
  autoListen = true,
  onMessage,
  onError,
}: UseWidgetVoiceConversationOptions): UseWidgetVoiceConversationReturn {
  const [state, setState] = useState<VoiceConversationState>('idle');
  const [audioLevel, setAudioLevel] = useState(0);
  const [partialTranscript, setPartialTranscript] = useState('');

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const activeRef = useRef(false);
  const transcriptRef = useRef('');

  const cleanupAudio = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = null;
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current?.state !== 'closed') {
      audioContextRef.current?.close();
    }
    audioContextRef.current = null;
    analyserRef.current = null;
    setAudioLevel(0);
  }, []);

  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current) return;
    const data = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(data);
    const avg = data.reduce((a, b) => a + b, 0) / data.length;
    setAudioLevel(Math.min(avg / 128, 1));
    animFrameRef.current = requestAnimationFrame(analyzeAudio);
  }, []);

  const speakResponse = useCallback(async (text: string): Promise<void> => {
    if (!supabaseUrl || !supabaseKey) return;
    setState('speaking');
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/widget-tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ text, voiceId: ttsVoiceId }),
      });
      if (!res.ok) throw new Error(`TTS failed: ${res.status}`);
      const data = await res.json();
      if (!data.audioContent) throw new Error('No audio');

      return new Promise((resolve) => {
        const audio = new Audio(`data:audio/mpeg;base64,${data.audioContent}`);
        audio.volume = 0.8;
        audioRef.current = audio;
        audio.onended = () => {
          audioRef.current = null;
          resolve();
        };
        audio.onerror = () => {
          audioRef.current = null;
          resolve();
        };
        audio.play().catch(() => resolve());
      });
    } catch (err) {
      console.error('[VoiceConversation] TTS error:', err);
    }
  }, [supabaseUrl, supabaseKey, ttsVoiceId]);

  const sendAndSpeak = useCallback(async (userText: string) => {
    // Add user message
    onMessage({
      id: `user_${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: new Date(),
    });

    setState('thinking');
    try {
      const result = await sendWidgetMessage({
        message: userText,
        apiKey,
        sessionId,
        systemPrompt,
        enableKB,
        kbDocumentIds,
      });

      if (result.error) throw new Error(result.error);

      onMessage({
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: result.response,
        timestamp: new Date(),
      });

      // Speak the response
      await speakResponse(result.response);

      // Auto-resume listening
      if (activeRef.current && autoListen) {
        startListening();
      } else if (activeRef.current) {
        setState('idle');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error';
      onError?.(msg);
      onMessage({
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: `Sorry, an error occurred: ${msg}`,
        timestamp: new Date(),
      });
      if (activeRef.current) setState('idle');
    }
  }, [apiKey, sessionId, systemPrompt, enableKB, kbDocumentIds, autoListen, onMessage, onError, speakResponse]);

  const startListening = useCallback(() => {
    const SRClass = getSpeechRecognition();
    if (!SRClass) {
      onError?.('Speech recognition not supported in this browser.');
      return;
    }

    // Setup mic for audio levels
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      mediaStreamRef.current = stream;
      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;
      ctx.createMediaStreamSource(stream).connect(analyser);
      animFrameRef.current = requestAnimationFrame(analyzeAudio);
    }).catch(() => {});

    const recognition = new SRClass();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = navigator.language || 'en-US';
    recognitionRef.current = recognition;
    transcriptRef.current = '';

    recognition.onstart = () => {
      setState('listening');
      setPartialTranscript('');
    };

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) final += r[0].transcript;
        else interim += r[0].transcript;
      }
      if (final) transcriptRef.current += final;
      setPartialTranscript(transcriptRef.current + interim);
    };

    recognition.onend = () => {
      cleanupAudio();
      const text = transcriptRef.current.trim();
      setPartialTranscript('');
      if (text && activeRef.current) {
        sendAndSpeak(text);
      } else if (activeRef.current) {
        setState('idle');
      }
    };

    recognition.onerror = (ev) => {
      cleanupAudio();
      if (ev.error !== 'aborted' && ev.error !== 'no-speech') {
        onError?.(`Voice error: ${ev.error}`);
      }
      if (activeRef.current) setState('idle');
    };

    try {
      recognition.start();
    } catch {
      onError?.('Failed to start voice input.');
    }
  }, [analyzeAudio, cleanupAudio, sendAndSpeak, onError]);

  const start = useCallback(() => {
    activeRef.current = true;
    startListening();
  }, [startListening]);

  const stop = useCallback(() => {
    activeRef.current = false;
    recognitionRef.current?.abort();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    cleanupAudio();
    setPartialTranscript('');
    setState('idle');
  }, [cleanupAudio]);

  const togglePause = useCallback(() => {
    if (state === 'listening') {
      recognitionRef.current?.stop();
    } else if (state === 'idle' && activeRef.current) {
      startListening();
    } else if (state === 'speaking') {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setState('idle');
    }
  }, [state, startListening]);

  // Cleanup on unmount
  useEffect(() => () => {
    activeRef.current = false;
    recognitionRef.current?.abort();
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    cleanupAudio();
  }, [cleanupAudio]);

  return { state, audioLevel, partialTranscript, start, stop, togglePause };
}
