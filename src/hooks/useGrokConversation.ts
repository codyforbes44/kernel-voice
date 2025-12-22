import { useState, useRef, useCallback, useEffect } from 'react';
import { floatTo16BitPCM, pcm16ToWavBlob, arrayBufferToBase64, resampleAudio } from '@/lib/audioUtils';
import { supabase } from '@/integrations/supabase/client';
import { getVoiceToolsConfig } from '@/lib/voiceToolDefinitions';
import { type GrokVoiceSettings, DEFAULT_GROK_SETTINGS, type GrokVoice } from '@/components/voice/voiceTypes';

export type { GrokVoice } from '@/components/voice/voiceTypes';

interface GrokConversationOptions {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onMessage?: (message: GrokMessage) => void;
  onError?: (error: Error) => void;
  onTranscript?: (transcript: { role: 'user' | 'assistant'; text: string }) => void;
  clientTools?: Record<string, (params: any) => Promise<string>>;
  voice?: GrokVoice;
  instructions?: string;
  settings?: GrokVoiceSettings;
}

interface GrokMessage {
  type: string;
  [key: string]: any;
}

export type ConnectionPhase = 'idle' | 'getting_token' | 'connecting_xai' | 'connecting_webrtc' | 'configuring' | 'ready' | 'error';

// Retry configuration
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 1000;

// Debug logging levels
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

export interface ToolExecution {
  name: string;
  status: 'calling' | 'executing' | 'completed' | 'error';
  startedAt: Date;
}

export function useGrokConversation(options: GrokConversationOptions = {}) {
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [inputAudioLevel, setInputAudioLevel] = useState(0);
  const [outputAudioLevel, setOutputAudioLevel] = useState(0);
  const [connectionInfo, setConnectionInfo] = useState<{ tokenParam?: string } | null>(null);
  const [connectionPhase, setConnectionPhase] = useState<ConnectionPhase>('idle');
  const [retryCount, setRetryCount] = useState(0);
  const [isFallbackMode] = useState(false);
  const [activeToolCall, setActiveToolCall] = useState<ToolExecution | null>(null);
  
  // Use refs to stabilize options and prevent callback churn
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);
  
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
  
  // Audio config - fixed at 24kHz PCM16
  const audioConfigRef = useRef({
    inputRate: 24000,
    outputRate: 24000,
  });
  
  // Ref for startRecording
  const startRecordingRef = useRef<((sampleRate: number) => Promise<void>) | null>(null);

  // Safe send helper
  const safeSend = useCallback((data: string) => {
    try {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(data);
        return true;
      }
      log.verbose('Cannot send - WebSocket not open');
      return false;
    } catch (err) {
      log.error('WebSocket send failed', err);
      return false;
    }
  }, []);

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
      optionsRef.current.onMessage?.(message);
      
      switch (message.type) {
        case 'session.created':
          log.always('Session created by xAI');
          sessionCreatedRef.current = true;
          setConnectionPhase('configuring');
          setStatus('connected');
          setRetryCount(0);
          optionsRef.current.onConnect?.();
          
          // Send session.update with voice config and tools AFTER session.created
          const voiceSetting = optionsRef.current.voice || 'Charon';
          
          // Build tools array if clientTools are provided
          const toolsConfig = getVoiceToolsConfig(optionsRef.current.clientTools, true);
          
          const sessionUpdate: Record<string, unknown> = {
            type: 'session.update',
            session: {
              voice: voiceSetting,
              instructions: optionsRef.current.instructions || 'You are a helpful voice assistant. Be concise and conversational. You have access to tools for chatting, searching the web, and querying documents. Use them when appropriate.',
              audio: {
                input: { format: { type: 'audio/pcm', rate: 24000 } },
                output: { format: { type: 'audio/pcm', rate: 24000 } }
              },
              turn_detection: {
                type: 'server_vad',
                threshold: optionsRef.current.settings?.vadThreshold ?? DEFAULT_GROK_SETTINGS.vadThreshold,
                prefix_padding_ms: optionsRef.current.settings?.prefixPadding ?? DEFAULT_GROK_SETTINGS.prefixPadding,
                silence_duration_ms: optionsRef.current.settings?.silenceDuration ?? DEFAULT_GROK_SETTINGS.silenceDuration
              },
              ...(toolsConfig && { 
                tools: toolsConfig,
                tool_choice: 'auto'
              })
            }
          };
          log.verbose('Sending session.update:', sessionUpdate);
          log.basic(`Tools configured: ${toolsConfig ? toolsConfig.map(t => t.name).join(', ') : 'none'}`);
          safeSend(JSON.stringify(sessionUpdate));
          
          // Start recording after session is ready
          setTimeout(() => {
            startRecordingRef.current?.(audioConfigRef.current.inputRate);
          }, 100);
          break;

        case 'session.updated':
          log.basic('Session updated successfully');
          setConnectionPhase('ready');
          break;
          
        case 'input_audio_buffer.speech_started':
          log.verbose('User started speaking - stopping playback');
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
            optionsRef.current.onTranscript?.({ role: 'user', text: message.transcript });
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
            optionsRef.current.onTranscript?.({ role: 'assistant', text: message.delta });
          }
          break;
          
        case 'response.audio_transcript.delta':
          if (message.delta) {
            log.verbose(`Audio transcript delta: ${message.delta}`);
            optionsRef.current.onTranscript?.({ role: 'assistant', text: message.delta });
          }
          break;
          
        case 'response.function_call_arguments.done':
          if (message.name && optionsRef.current.clientTools?.[message.name]) {
            log.basic(`Executing tool: ${message.name}`);
            setActiveToolCall({ name: message.name, status: 'executing', startedAt: new Date() });
            
            try {
              const args = JSON.parse(message.arguments || '{}');
              log.verbose('Tool arguments:', args);
              const result = await optionsRef.current.clientTools![message.name](args);
              log.verbose('Tool result:', result);
              
              setActiveToolCall(prev => prev ? { ...prev, status: 'completed' } : null);
              
              safeSend(JSON.stringify({
                type: 'conversation.item.create',
                item: {
                  type: 'function_call_output',
                  call_id: message.call_id,
                  output: result,
                },
              }));
              
              safeSend(JSON.stringify({
                type: 'response.create',
              }));
              
              // Clear tool call after a short delay
              setTimeout(() => setActiveToolCall(null), 1500);
            } catch (error) {
              log.error('Error executing tool:', error);
              setActiveToolCall(prev => prev ? { ...prev, status: 'error' } : null);
              setTimeout(() => setActiveToolCall(null), 2000);
            }
          }
          break;
          
        case 'error':
          log.error('Error from xAI:', message);
          optionsRef.current.onError?.(new Error(message.message || message.error?.message || 'xAI error'));
          break;
      }
    } catch (error) {
      log.error('Error parsing WebSocket message:', error);
    }
  }, [playNextAudio, safeSend]);

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
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i] * dataArray[i];
          }
          const rms = Math.sqrt(sum / dataArray.length) / 255;
          setInputAudioLevel(Math.min(1, rms * 2));
        }
      }, 50);
      
      const sendAudioData = (inputData: Float32Array) => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) return;
        
        const resampled = resampleAudio(inputData, 48000, targetSampleRate);
        const pcmData = floatTo16BitPCM(resampled);
        const base64Audio = arrayBufferToBase64(pcmData);
        
        try {
          wsRef.current?.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: base64Audio,
          }));
        } catch (err) {
          log.error('Failed to send audio data', err);
        }
      };
      
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

  const scheduleRetry = useCallback(() => {
    if (retryCount >= MAX_RETRIES) {
      console.log('[Grok] Max retries reached, giving up');
      setConnectionError('Max connection retries reached. Please try again.');
      setConnectionPhase('error');
      return;
    }

    const delay = Math.min(BASE_RETRY_DELAY_MS * Math.pow(2, retryCount), 16000);
    const jitter = Math.random() * 500;
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

  // Internal session start - connects directly to xAI using ephemeral token
  // Build version marker for cache debugging
  const BUILD_VERSION = '2024-12-22-v2';
  
  const startSessionInternal = useCallback(async () => {
    try {
      console.log('[Grok] ====== Starting direct xAI connection ======');
      console.log('[Grok] Build version:', BUILD_VERSION);
      console.log('[Grok] Timestamp:', new Date().toISOString());
      console.log('[Grok] Code path: useGrokConversation.startSessionInternal');
      setConnectionError(null);
      setStatus('connecting');
      sessionCreatedRef.current = false;
      setConnectionPhase('getting_token');
      
      // Set connection timeout (30 seconds)
      connectionTimeoutRef.current = setTimeout(() => {
        if (status === 'connecting') {
          console.log('[Grok] Connection timeout after 30 seconds');
          const error = new Error('Connection timeout - please try again');
          setConnectionError(error.message);
          setConnectionPhase('error');
          setStatus('disconnected');
          optionsRef.current.onError?.(error);
          if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
          }
          stopRecording();
          if (!isRetryingRef.current) {
            scheduleRetry();
          }
        }
      }, 30000);
      
      const voiceSetting = optionsRef.current.voice || 'Charon';
      console.log('[Grok] Voice setting:', voiceSetting);
      console.log('[Grok] Has custom instructions:', !!optionsRef.current.instructions);
      
      // Step 1: Get ephemeral token from edge function
      console.log('[Grok] Step 1: Requesting ephemeral token from xai-session-token...');
      const { data: tokenData, error: tokenError } = await supabase.functions.invoke('xai-session-token', {
        body: {
          voice: voiceSetting,
          instructions: optionsRef.current.instructions,
        },
      });

      console.log('[Grok] Token response received:', {
        hasData: !!tokenData,
        hasError: !!tokenError,
        dataKeys: tokenData ? Object.keys(tokenData) : [],
        errorMessage: tokenError?.message,
      });

      if (tokenError || !tokenData?.client_secret?.value) {
        const errorMsg = tokenError?.message || tokenData?.error || 'Failed to get session token';
        console.error('[Grok] Token error:', errorMsg);
        console.error('[Grok] Full token data:', JSON.stringify(tokenData, null, 2));
        throw new Error(errorMsg);
      }

      const ephemeralToken = tokenData.client_secret.value;
      console.log('[Grok] Got ephemeral token, expires at:', new Date(tokenData.client_secret.expires_at * 1000).toISOString());
      
      setConnectionPhase('connecting_xai');
      setConnectionInfo({ tokenParam: 'ephemeral' });
      
      // Step 2: Connect directly to xAI WebSocket (hardcoded URL - no wsUrl from config)
      const xaiUrl = `wss://api.x.ai/v1/realtime?model=grok-2-public`;
      console.log('[Grok] Step 2: Connecting to xAI WebSocket:', xaiUrl);
      
      // Create WebSocket with authorization in subprotocol (xAI pattern)
      const ws = new WebSocket(xaiUrl, [
        'realtime',
        `openai-insecure-api-key.${ephemeralToken}`,
      ]);
      wsRef.current = ws;
      
      ws.onopen = () => {
        console.log('[Grok] WebSocket connected to xAI directly!');
        
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
        
        setRetryCount(0);
        console.log('[Grok] Waiting for session.created...');
      };
      
      ws.onmessage = (event) => {
        handleWebSocketMessage(event);
      };
      
      ws.onerror = (error) => {
        console.error('[Grok] WebSocket error:', error);
        const errorMsg = 'Failed to connect to xAI voice service';
        setConnectionError(errorMsg);
        setConnectionPhase('error');
        setStatus('disconnected');
        optionsRef.current.onError?.(new Error(errorMsg));
      };
      
      ws.onclose = (event) => {
        console.log('[Grok] WebSocket closed - code:', event.code, 'reason:', event.reason);
        
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
        
        stopRecording();
        
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
        optionsRef.current.onDisconnect?.();
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
  }, [handleWebSocketMessage, stopRecording, status, scheduleRetry]);

  // Ref to track if a start is in progress
  const isStartingRef = useRef(false);
  
  const startSession = useCallback(async () => {
    // Guard: prevent re-entry if already connecting or connected
    if (status === 'connecting' || status === 'connected') {
      log.basic(`startSession blocked - already ${status}`);
      return;
    }
    
    // Guard: prevent concurrent start attempts
    if (isStartingRef.current) {
      log.basic('startSession blocked - start already in progress');
      return;
    }
    
    isStartingRef.current = true;
    
    try {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      isRetryingRef.current = false;
      setRetryCount(0);
      
      await startSessionInternal();
    } finally {
      isStartingRef.current = false;
    }
  }, [startSessionInternal, status]);

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

  const sendTextMessage = useCallback((text: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('Cannot send text message: WebSocket not connected');
      return false;
    }

    const itemSent = safeSend(JSON.stringify({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text }],
      },
    }));

    if (itemSent) {
      safeSend(JSON.stringify({
        type: 'response.create',
      }));
    }

    return itemSent;
  }, [safeSend]);

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
    activeToolCall,
    startSession,
    endSession,
    clearError,
    sendTextMessage,
  };
}
