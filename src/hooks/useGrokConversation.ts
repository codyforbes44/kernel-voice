import { useState, useRef, useCallback, useEffect } from 'react';
import { floatTo16BitPCM, pcm16ToWavBlob, arrayBufferToBase64, resampleAudio } from '@/lib/audioUtils';

export type GrokVoice = 'Ara' | 'Rex' | 'Sal' | 'Eve' | 'Leo';

interface GrokConversationOptions {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onMessage?: (message: GrokMessage) => void;
  onError?: (error: Error) => void;
  onTranscript?: (transcript: { role: 'user' | 'assistant'; text: string }) => void;
  clientTools?: Record<string, (params: any) => Promise<string>>;
  voice?: GrokVoice;
  instructions?: string;
}

interface GrokMessage {
  type: string;
  [key: string]: any;
}

export type ConnectionPhase = 'idle' | 'connecting_relay' | 'connecting_xai' | 'configuring' | 'ready' | 'fallback' | 'error';

// Retry configuration
const MAX_RETRIES = 5;
const BASE_RETRY_DELAY_MS = 1000;

// Debug logging levels: 'off' (default), 'basic', 'verbose'
type DebugLevel = 'off' | 'basic' | 'verbose';

function getDebugLevel(): DebugLevel {
  if (typeof window === 'undefined') return 'off';
  const params = new URLSearchParams(window.location.search);
  const level = params.get('debug');
  if (level === 'basic' || level === 'verbose') return level;
  return 'off';
}

const debugLevel = getDebugLevel();

const log = {
  basic: (msg: string) => {
    if (debugLevel === 'off') return;
    console.log(`[Grok:BASIC] ${msg}`);
  },
  verbose: (msg: string, data?: unknown) => {
    if (debugLevel !== 'verbose') return;
    console.log(`[Grok:VERBOSE] ${msg}`, data ?? '');
  },
  always: (msg: string) => {
    console.log(`[Grok] ${msg}`);
  },
  error: (msg: string, data?: unknown) => {
    console.error(`[Grok] ${msg}`, data ?? '');
  }
};

export function useGrokConversation(options: GrokConversationOptions = {}) {
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [inputAudioLevel, setInputAudioLevel] = useState(0);
  const [outputAudioLevel, setOutputAudioLevel] = useState(0);
  const [connectionInfo, setConnectionInfo] = useState<{ tokenParam?: string } | null>(null);
  const [connectionPhase, setConnectionPhase] = useState<ConnectionPhase>('idle');
  const [retryCount, setRetryCount] = useState(0);
  const [isFallbackMode, setIsFallbackMode] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<AudioWorkletNode | ScriptProcessorNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioQueueRef = useRef<Blob[]>([]);
  const isPlayingRef = useRef(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const sessionCreatedRef = useRef(false);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const levelIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isRetryingRef = useRef(false);
  const isFallbackModeRef = useRef(false);
  
  // Audio config - fixed at 24kHz PCM16
  const audioConfigRef = useRef({
    inputRate: 24000,
    outputRate: 24000,
  });
  
  // Ref for startRecording to avoid callback ordering issues
  const startRecordingRef = useRef<((sampleRate: number) => Promise<void>) | null>(null);

  const playNextAudio = useCallback(async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;
    
    isPlayingRef.current = true;
    setIsSpeaking(true);
    
    const blob = audioQueueRef.current.shift();
    if (!blob) {
      isPlayingRef.current = false;
      setIsSpeaking(false);
      setOutputAudioLevel(0);
      return;
    }
    
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    currentAudioRef.current = audio;
    
    // Simulate output level while speaking
    const outputLevelInterval = setInterval(() => {
      if (isPlayingRef.current) {
        setOutputAudioLevel(0.4 + Math.random() * 0.5);
      }
    }, 100);
    
    audio.onended = () => {
      clearInterval(outputLevelInterval);
      URL.revokeObjectURL(url);
      isPlayingRef.current = false;
      currentAudioRef.current = null;
      setOutputAudioLevel(0);
      
      if (audioQueueRef.current.length > 0) {
        playNextAudio();
      } else {
        setIsSpeaking(false);
      }
    };
    
    audio.onerror = () => {
      clearInterval(outputLevelInterval);
      URL.revokeObjectURL(url);
      isPlayingRef.current = false;
      currentAudioRef.current = null;
      setIsSpeaking(false);
      setOutputAudioLevel(0);
    };
    
    try {
      await audio.play();
    } catch (error) {
      clearInterval(outputLevelInterval);
      console.error('Error playing audio:', error);
      isPlayingRef.current = false;
      setIsSpeaking(false);
      setOutputAudioLevel(0);
    }
  }, []);

  const handleWebSocketMessage = useCallback(async (event: MessageEvent) => {
    try {
      const message: GrokMessage = JSON.parse(event.data);
      log.basic(`Message received: ${message.type}`);
      log.verbose('Message data:', message);
      options.onMessage?.(message);
      
      switch (message.type) {
        case 'relay.connected':
          log.basic('Relay connected to xAI');
          setConnectionPhase('connecting_xai');
          break;
          
        case 'fallback_active':
          log.basic(`Fallback mode activated: ${message.provider}`);
          setIsFallbackMode(true);
          isFallbackModeRef.current = true;
          setConnectionPhase('fallback');
          setConnectionError('Using ElevenLabs TTS fallback - text input only');
          // Don't start audio recording in fallback mode
          break;
          
        case 'session.created':
          log.basic('Session created by xAI');
          sessionCreatedRef.current = true;
          setConnectionPhase('configuring');
          // Relay handles session.update automatically
          break;

        case 'session.updated':
          log.basic('Session updated successfully');
          setStatus('connected');
          if (!isFallbackModeRef.current) {
            setConnectionPhase('ready');
          }
          setRetryCount(0);
          options.onConnect?.();
          // Start recording after session is fully configured (only if not in fallback mode)
          if (!isFallbackModeRef.current) {
            // Use setTimeout to ensure startRecording is available
            setTimeout(() => {
              startRecordingRef.current?.(audioConfigRef.current.inputRate);
            }, 0);
          }
          break;
          
        case 'input_audio_buffer.speech_started':
          log.verbose('User started speaking - stopping playback');
          // User started speaking - stop any playing audio
          if (currentAudioRef.current) {
            currentAudioRef.current.pause();
            currentAudioRef.current = null;
          }
          audioQueueRef.current = [];
          isPlayingRef.current = false;
          setIsSpeaking(false);
          break;
          
        case 'conversation.item.input_audio_transcription.completed':
          if (message.transcript) {
            log.verbose(`User transcript: ${message.transcript}`);
            options.onTranscript?.({ role: 'user', text: message.transcript });
          }
          break;
          
        case 'response.audio.delta':
          if (message.delta) {
            log.verbose(`Audio delta received: ${message.delta.length} chars`);
            const wavBlob = pcm16ToWavBlob(message.delta, audioConfigRef.current.outputRate);
            audioQueueRef.current.push(wavBlob);
            playNextAudio();
          }
          break;
          
        case 'response.text.delta':
          if (message.delta) {
            log.verbose(`Text delta: ${message.delta}`);
            options.onTranscript?.({ role: 'assistant', text: message.delta });
          }
          break;
          
        case 'response.function_call_arguments.done':
          if (message.name && options.clientTools?.[message.name]) {
            log.basic(`Executing tool: ${message.name}`);
            try {
              const args = JSON.parse(message.arguments || '{}');
              log.verbose('Tool arguments:', args);
              const result = await options.clientTools[message.name](args);
              log.verbose('Tool result:', result);
              
              wsRef.current?.send(JSON.stringify({
                type: 'conversation.item.create',
                item: {
                  type: 'function_call_output',
                  call_id: message.call_id,
                  output: result,
                },
              }));
              
              wsRef.current?.send(JSON.stringify({
                type: 'response.create',
              }));
            } catch (error) {
              log.error('Error executing tool:', error);
            }
          }
          break;
          
        case 'relay.disconnected':
          log.basic(`Relay disconnected: ${message.reason}`);
          break;
          
        case 'error':
          log.error('Error from server:', message);
          options.onError?.(new Error(message.message || message.error?.message || 'Grok error'));
          break;
      }
    } catch (error) {
      log.error('Error parsing WebSocket message:', error);
    }
  }, [options, playNextAudio]);

  const startRecording = useCallback(async (targetSampleRate: number) => {
    try {
      console.log('[Grok] Starting audio recording at target sample rate:', targetSampleRate);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 48000,
        }
      });
      mediaStreamRef.current = stream;
      
      audioContextRef.current = new AudioContext({ sampleRate: 48000 });
      const source = audioContextRef.current.createMediaStreamSource(stream);
      
      // Create analyser for audio level visualization
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;
      source.connect(analyser);
      
      // Start level monitoring
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      levelIntervalRef.current = setInterval(() => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i] * dataArray[i];
          }
          const rms = Math.sqrt(sum / dataArray.length) / 255;
          setInputAudioLevel(Math.min(1, rms * 2));
        }
      }, 50);
      
      // Helper to send audio data
      const sendAudioData = (inputData: Float32Array) => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) return;
        
        // Resample from 48kHz to target sample rate
        const resampled = resampleAudio(inputData, 48000, targetSampleRate);
        const pcmData = floatTo16BitPCM(resampled);
        const base64Audio = arrayBufferToBase64(pcmData);
        
        wsRef.current.send(JSON.stringify({
          type: 'input_audio_buffer.append',
          audio: base64Audio,
        }));
      };
      
      // Try to use AudioWorklet (modern approach) with fallback to ScriptProcessorNode
      if (audioContextRef.current.audioWorklet) {
        try {
          console.log('[Grok] Using AudioWorklet for audio processing');
          await audioContextRef.current.audioWorklet.addModule('/audio-processor.js');
          
          const workletNode = new AudioWorkletNode(audioContextRef.current, 'voice-processor');
          processorRef.current = workletNode;
          
          workletNode.port.onmessage = (event) => {
            if (event.data.type === 'audio') {
              sendAudioData(event.data.data);
            }
          };
          
          source.connect(workletNode);
          workletNode.connect(audioContextRef.current.destination);
          console.log('[Grok] AudioWorklet audio recording started successfully');
        } catch (workletError) {
          console.warn('[Grok] AudioWorklet failed, falling back to ScriptProcessorNode:', workletError);
          // Fall through to ScriptProcessorNode
          setupScriptProcessor(source, sendAudioData);
        }
      } else {
        console.log('[Grok] AudioWorklet not supported, using ScriptProcessorNode');
        setupScriptProcessor(source, sendAudioData);
      }
      
      function setupScriptProcessor(source: MediaStreamAudioSourceNode, sendAudio: (data: Float32Array) => void) {
        const processor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;
        
        processor.onaudioprocess = (e) => {
          const inputData = e.inputBuffer.getChannelData(0);
          sendAudio(new Float32Array(inputData));
        };
        
        source.connect(processor);
        processor.connect(audioContextRef.current!.destination);
        console.log('[Grok] ScriptProcessorNode audio recording started successfully');
      }
      
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }, []);

  // Store startRecording in ref for callback access
  useEffect(() => {
    startRecordingRef.current = startRecording;
  }, [startRecording]);

  const stopRecording = useCallback(() => {
    if (levelIntervalRef.current) {
      clearInterval(levelIntervalRef.current);
      levelIntervalRef.current = null;
    }
    setInputAudioLevel(0);
    setOutputAudioLevel(0);
    
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    
    if (processorRef.current) {
      // Close port if AudioWorkletNode
      if ('port' in processorRef.current && processorRef.current.port) {
        processorRef.current.port.close();
      }
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  // Schedule retry with exponential backoff
  const scheduleRetry = useCallback(() => {
    if (retryCount >= MAX_RETRIES) {
      console.log('[Grok] Max retries reached, giving up');
      setConnectionError('Max connection retries reached. Please try again.');
      setConnectionPhase('error');
      return;
    }

    const delay = Math.min(BASE_RETRY_DELAY_MS * Math.pow(2, retryCount), 32000);
    const jitter = Math.random() * 1000;
    const totalDelay = delay + jitter;

    console.log(`[Grok] Scheduling retry ${retryCount + 1}/${MAX_RETRIES} in ${Math.round(totalDelay)}ms`);
    setConnectionError(`Reconnecting in ${Math.round(totalDelay / 1000)}s (attempt ${retryCount + 1}/${MAX_RETRIES})`);
    setRetryCount(prev => prev + 1);
    isRetryingRef.current = true;

    retryTimerRef.current = setTimeout(() => {
      isRetryingRef.current = false;
      startSessionInternal();
    }, totalDelay);
  }, [retryCount]);

  // Internal session start function
  const startSessionInternal = useCallback(async () => {
    try {
      console.log('[Grok] ====== Starting new session via relay ======');
      console.log('[Grok] Timestamp:', new Date().toISOString());
      setConnectionError(null);
      setStatus('connecting');
      sessionCreatedRef.current = false;
      setConnectionPhase('connecting_relay');
      
      // Set connection timeout (25 seconds total)
      connectionTimeoutRef.current = setTimeout(() => {
        if (status === 'connecting') {
          console.log('[Grok] Connection timeout after 25 seconds');
          const error = new Error('Connection timeout - please try again');
          setConnectionError(error.message);
          setConnectionPhase('error');
          setStatus('disconnected');
          options.onError?.(error);
          if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
          }
          stopRecording();
          if (!isRetryingRef.current) {
            scheduleRetry();
          }
        }
      }, 25000);
      
      const voiceSetting = options.voice || 'Ara';
      console.log('[Grok] Voice setting:', voiceSetting);
      console.log('[Grok] Has custom instructions:', !!options.instructions);
      
      // Build relay URL with voice and instructions as query params
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('Supabase URL not configured');
      }
      
      // Convert https:// to wss:// for WebSocket
      const wsBaseUrl = supabaseUrl.replace('https://', 'wss://');
      const relayUrl = new URL(`${wsBaseUrl}/functions/v1/grok-voice-relay`);
      relayUrl.searchParams.set('voice', voiceSetting);
      if (options.instructions) {
        relayUrl.searchParams.set('instructions', encodeURIComponent(options.instructions));
      }
      
      console.log('[Grok] Connecting to relay:', relayUrl.toString().replace(/instructions=[^&]+/, 'instructions=***'));
      
      // Connect to relay - no auth needed, relay handles xAI authentication
      const ws = new WebSocket(relayUrl.toString());
      wsRef.current = ws;
      
      ws.onopen = () => {
        console.log('[Grok] WebSocket connected to relay');
        setConnectionInfo({ tokenParam: 'relay' });
        
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
        
        setRetryCount(0);
        console.log('[Grok] Waiting for relay.connected and session.created...');
      };
      
      ws.onmessage = (event) => {
        handleWebSocketMessage(event);
      };
      
      ws.onerror = (error) => {
        console.error('[Grok] WebSocket error:', error);
        const errorMsg = 'Failed to connect to Grok voice service';
        setConnectionError(errorMsg);
        setConnectionPhase('error');
        setStatus('disconnected');
        options.onError?.(new Error(errorMsg));
      };
      
      ws.onclose = (event) => {
        console.log('[Grok] WebSocket closed - code:', event.code, 'reason:', event.reason);
        
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
        
        stopRecording();
        
        // Only retry on unexpected closes
        if (event.code !== 1000 && event.code !== 1005) {
          let errorMsg = `Connection closed (code: ${event.code})`;
          if (event.code === 1006) {
            errorMsg = 'Connection lost - the voice service may be unavailable';
          } else if (event.code === 1008 || event.code === 4001) {
            errorMsg = 'Authentication failed - please try again';
          } else if (event.code === 1011) {
            errorMsg = 'Server error - please try again later';
          } else if (event.reason) {
            errorMsg = event.reason;
          }
          setConnectionError(errorMsg);
          setConnectionPhase('error');
          
          if (!isRetryingRef.current) {
            scheduleRetry();
          }
        } else {
          setConnectionPhase('idle');
        }
        
        setStatus('disconnected');
        options.onDisconnect?.();
      };
      
    } catch (error) {
      console.error('[Grok] Error starting session:', error);
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      setStatus('disconnected');
      setConnectionPhase('error');
      setConnectionError((error as Error).message);
      
      if (!isRetryingRef.current) {
        scheduleRetry();
      }
    }
  }, [options, handleWebSocketMessage, stopRecording, status, scheduleRetry]);

  // Public startSession function (resets retry count)
  const startSession = useCallback(async () => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    isRetryingRef.current = false;
    setRetryCount(0);
    
    await startSessionInternal();
  }, [startSessionInternal]);

  const endSession = useCallback(async () => {
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    
    isRetryingRef.current = false;
    setRetryCount(0);
    
    stopRecording();
    
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    setIsSpeaking(false);
    setIsFallbackMode(false);
    isFallbackModeRef.current = false;
    sessionCreatedRef.current = false;
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'User ended session');
      wsRef.current = null;
    }
    
    setConnectionPhase('idle');
    setStatus('disconnected');
    setConnectionError(null);
  }, [stopRecording]);

  const clearError = useCallback(() => {
    setConnectionError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
      endSession();
    };
  }, [endSession]);

  // Send a text message via WebSocket
  const sendTextMessage = useCallback((text: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('Cannot send text message: WebSocket not connected');
      return false;
    }

    wsRef.current.send(JSON.stringify({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text }],
      },
    }));

    wsRef.current.send(JSON.stringify({
      type: 'response.create',
    }));

    return true;
  }, []);

  return {
    status,
    isSpeaking,
    connectionError,
    connectionInfo,
    connectionPhase,
    inputAudioLevel,
    outputAudioLevel,
    retryCount,
    isFallbackMode,
    startSession,
    endSession,
    clearError,
    sendTextMessage,
  };
}
