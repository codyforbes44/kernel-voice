import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  type GeminiLiveSettings,
  DEFAULT_GEMINI_LIVE_SETTINGS,
  type ConnectionPhase,
  type ToolExecution,
} from '@/components/voice/voiceTypes';

interface GeminiLiveConversationOptions {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onMessage?: (message: any) => void;
  onError?: (error: Error) => void;
  onTranscript?: (transcript: { role: 'user' | 'assistant'; text: string }) => void;
  clientTools?: Record<string, (params: any) => Promise<string>>;
  settings?: GeminiLiveSettings;
  systemPrompt?: string;
}

export function useGeminiLiveConversation(options: GeminiLiveConversationOptions = {}) {
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [inputAudioLevel, setInputAudioLevel] = useState(0);
  const [outputAudioLevel, setOutputAudioLevel] = useState(0);
  const [connectionPhase, setConnectionPhase] = useState<ConnectionPhase>('idle');
  const [activeToolCall, setActiveToolCall] = useState<ToolExecution | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const levelIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const playbackContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  const cleanup = useCallback(() => {
    if (levelIntervalRef.current) {
      clearInterval(levelIntervalRef.current);
      levelIntervalRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (playbackContextRef.current) {
      playbackContextRef.current.close();
      playbackContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setInputAudioLevel(0);
    setOutputAudioLevel(0);
    setIsSpeaking(false);
  }, []);

  const startSession = useCallback(async () => {
    try {
      cleanup();
      setConnectionError(null);
      setStatus('connecting');
      setConnectionPhase('getting_token');

      const settings = options.settings || DEFAULT_GEMINI_LIVE_SETTINGS;

      // Get WebSocket URL from edge function
      const { data, error } = await supabase.functions.invoke('gemini-live-token', {
        body: {
          voice: settings.voice,
          model: settings.model,
          systemPrompt: options.systemPrompt || settings.customPrompt,
        },
      });

      if (error || !data?.wsUrl) {
        throw new Error(error?.message || 'Failed to get Gemini Live session');
      }

      setConnectionPhase('configuring');

      // Get microphone
      const ms = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 16000 },
      });
      mediaStreamRef.current = ms;

      // Set up audio level monitoring
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      const source = audioContextRef.current.createMediaStreamSource(ms);
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      levelIntervalRef.current = setInterval(() => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i] * dataArray[i];
          const rms = Math.sqrt(sum / dataArray.length) / 255;
          setInputAudioLevel(Math.min(1, rms * 2));
        }
      }, 50);

      // Set up audio capture processor for sending PCM to WebSocket
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      source.connect(processor);
      processor.connect(audioContextRef.current.destination);

      // Connect WebSocket
      const ws = new WebSocket(data.wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[GeminiLive] WebSocket connected');

        // Send setup message
        ws.send(JSON.stringify({
          setup: {
            model: `models/${data.model}`,
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: data.voice },
                },
              },
            },
            systemInstruction: {
              parts: [{ text: data.systemPrompt }],
            },
          },
        }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          options.onMessage?.(msg);

          if (msg.setupComplete) {
            console.log('[GeminiLive] Setup complete');
            setConnectionPhase('ready');
            setStatus('connected');
            options.onConnect?.();

            // Start sending audio
            processor.onaudioprocess = (e) => {
              if (wsRef.current?.readyState === WebSocket.OPEN) {
                const inputData = e.inputBuffer.getChannelData(0);
                // Convert Float32 to Int16 PCM
                const pcm16 = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) {
                  const s = Math.max(-1, Math.min(1, inputData[i]));
                  pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                }
                // Convert to base64
                const bytes = new Uint8Array(pcm16.buffer);
                let binary = '';
                const chunkSize = 8192;
                for (let i = 0; i < bytes.length; i += chunkSize) {
                  binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
                }
                const b64 = btoa(binary);

                wsRef.current.send(JSON.stringify({
                  realtimeInput: {
                    mediaChunks: [{ mimeType: 'audio/pcm;rate=16000', data: b64 }],
                  },
                }));
              }
            };
          }

          // Handle server content (audio/text responses)
          if (msg.serverContent) {
            const parts = msg.serverContent.modelTurn?.parts || [];
            for (const part of parts) {
              if (part.text) {
                options.onTranscript?.({ role: 'assistant', text: part.text });
              }
              if (part.inlineData?.data) {
                setIsSpeaking(true);
                setOutputAudioLevel(0.4 + Math.random() * 0.5);
                // Play audio via AudioContext
                playAudioChunk(part.inlineData.data);
              }
            }

            if (msg.serverContent.turnComplete) {
              setIsSpeaking(false);
              setOutputAudioLevel(0);
            }
          }

          // Handle tool calls
          if (msg.toolCall) {
            handleToolCall(msg.toolCall);
          }
        } catch (err) {
          console.error('[GeminiLive] Message parse error:', err);
        }
      };

      ws.onclose = () => {
        console.log('[GeminiLive] WebSocket closed');
        setStatus('disconnected');
        setConnectionPhase('idle');
        options.onDisconnect?.();
      };

      ws.onerror = (e) => {
        console.error('[GeminiLive] WebSocket error:', e);
        setConnectionError('WebSocket connection failed');
        setConnectionPhase('error');
        options.onError?.(new Error('WebSocket connection failed'));
      };

    } catch (error) {
      console.error('[GeminiLive] Connection error:', error);
      const msg = error instanceof Error ? error.message : 'Failed to connect';
      setConnectionError(msg);
      setConnectionPhase('error');
      setStatus('disconnected');
      options.onError?.(error instanceof Error ? error : new Error(msg));
      cleanup();
    }
  }, [options, cleanup]);

  const playAudioChunk = useCallback((base64Data: string) => {
    try {
      if (!playbackContextRef.current || playbackContextRef.current.state === 'closed') {
        playbackContextRef.current = new AudioContext({ sampleRate: 24000 });
      }
      const binaryStr = atob(base64Data);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

      // Decode as Int16 PCM
      const int16 = new Int16Array(bytes.buffer);
      const audioBuffer = playbackContextRef.current.createBuffer(1, int16.length, 24000);
      const channel = audioBuffer.getChannelData(0);
      for (let i = 0; i < int16.length; i++) {
        channel[i] = int16[i] / 32768;
      }

      const source = playbackContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(playbackContextRef.current.destination);
      source.start();
    } catch (err) {
      console.error('[GeminiLive] Audio playback error:', err);
    }
  }, []);

  const handleToolCall = useCallback(async (toolCall: any) => {
    if (!toolCall.functionCalls || !options.clientTools) return;

    for (const fc of toolCall.functionCalls) {
      if (options.clientTools[fc.name]) {
        console.log('[GeminiLive] Executing tool:', fc.name);
        setActiveToolCall({ name: fc.name, status: 'executing', startedAt: new Date() });

        try {
          const result = await options.clientTools[fc.name](fc.args || {});
          setActiveToolCall(prev => prev ? { ...prev, status: 'completed' } : null);

          // Send tool response
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              toolResponse: {
                functionResponses: [{
                  id: fc.id,
                  name: fc.name,
                  response: { result },
                }],
              },
            }));
          }
          setTimeout(() => setActiveToolCall(null), 1500);
        } catch (err) {
          console.error('[GeminiLive] Tool error:', err);
          setActiveToolCall(prev => prev ? { ...prev, status: 'error' } : null);
          setTimeout(() => setActiveToolCall(null), 2000);
        }
      }
    }
  }, [options.clientTools]);

  const endSession = useCallback(async () => {
    cleanup();
    setStatus('disconnected');
    setConnectionPhase('idle');
    options.onDisconnect?.();
  }, [cleanup, options]);

  const sendTextMessage = useCallback(async (text: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(JSON.stringify({
      clientContent: {
        turns: [{ role: 'user', parts: [{ text }] }],
        turnComplete: true,
      },
    }));
  }, []);

  const clearError = useCallback(() => {
    setConnectionError(null);
  }, []);

  useEffect(() => {
    return () => { cleanup(); };
  }, [cleanup]);

  return {
    status,
    isSpeaking,
    connectionError,
    connectionPhase,
    inputAudioLevel,
    outputAudioLevel,
    activeToolCall,
    startSession,
    endSession,
    sendTextMessage,
    clearError,
    connectionInfo: { tokenParam: 'gemini-ws' },
    isFallbackMode: false,
  };
}
