import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

interface GrokSessionConfig {
  wsUrl: string;
  voice: string;
  language: string | null;
  instructions: string;
  audio: {
    input: { format: { type: string; rate: number } };
    output: { format: { type: string; rate: number } };
  };
}

export function useGrokConversation(options: GrokConversationOptions = {}) {
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioQueueRef = useRef<Blob[]>([]);
  const isPlayingRef = useRef(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const configRef = useRef<GrokSessionConfig | null>(null);
  const sessionCreatedRef = useRef(false);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const playNextAudio = useCallback(async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;
    
    isPlayingRef.current = true;
    setIsSpeaking(true);
    
    const blob = audioQueueRef.current.shift();
    if (!blob) {
      isPlayingRef.current = false;
      setIsSpeaking(false);
      return;
    }
    
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    currentAudioRef.current = audio;
    
    audio.onended = () => {
      URL.revokeObjectURL(url);
      isPlayingRef.current = false;
      currentAudioRef.current = null;
      
      if (audioQueueRef.current.length > 0) {
        playNextAudio();
      } else {
        setIsSpeaking(false);
      }
    };
    
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      isPlayingRef.current = false;
      currentAudioRef.current = null;
      setIsSpeaking(false);
    };
    
    try {
      await audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      isPlayingRef.current = false;
      setIsSpeaking(false);
    }
  }, []);

  const sendSessionUpdate = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !configRef.current) {
      console.error('Cannot send session update: WebSocket not ready');
      return;
    }

    const config = configRef.current;
    console.log('Sending session.update with config:', config.voice);

    // xAI Realtime API session.update format - uses nested audio object
    const sessionUpdate = {
      type: 'session.update',
      session: {
        voice: config.voice,
        instructions: config.instructions,
        audio: config.audio,
        turn_detection: { type: 'server_vad' },
        tools: options.clientTools ? Object.keys(options.clientTools).map(name => ({
          type: 'function',
          name,
          description: `Client tool: ${name}`,
          parameters: {
            type: 'object',
            properties: {},
          },
        })) : [],
      },
    };
    
    console.log('Sending session.update:', JSON.stringify(sessionUpdate, null, 2));
    wsRef.current.send(JSON.stringify(sessionUpdate));
  }, [options.clientTools]);

  const handleWebSocketMessage = useCallback(async (event: MessageEvent) => {
    try {
      const message: GrokMessage = JSON.parse(event.data);
      console.log('Grok message received:', message.type);
      options.onMessage?.(message);
      
      switch (message.type) {
        case 'session.created':
          console.log('Grok session created, sending session.update...');
          sessionCreatedRef.current = true;
          // Send session configuration AFTER receiving session.created
          sendSessionUpdate();
          break;

        case 'session.updated':
          console.log('Grok session updated successfully');
          setStatus('connected');
          options.onConnect?.();
          // Start recording after session is fully configured
          if (configRef.current) {
            startRecording(configRef.current.audio.input.format.rate);
          }
          break;
          
        case 'input_audio_buffer.speech_started':
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
          // User speech transcribed
          if (message.transcript) {
            options.onTranscript?.({ role: 'user', text: message.transcript });
          }
          break;
          
        case 'response.audio.delta':
          // Received audio chunk from Grok
          if (message.delta) {
            const wavBlob = pcm16ToWavBlob(message.delta, configRef.current?.audio.output.format.rate || 24000);
            audioQueueRef.current.push(wavBlob);
            playNextAudio();
          }
          break;
          
        case 'response.text.delta':
          // Text response chunk
          if (message.delta) {
            options.onTranscript?.({ role: 'assistant', text: message.delta });
          }
          break;
          
        case 'response.function_call_arguments.done':
          // Handle tool calls
          if (message.name && options.clientTools?.[message.name]) {
            try {
              const args = JSON.parse(message.arguments || '{}');
              const result = await options.clientTools[message.name](args);
              
              // Send tool result back
              wsRef.current?.send(JSON.stringify({
                type: 'conversation.item.create',
                item: {
                  type: 'function_call_output',
                  call_id: message.call_id,
                  output: result,
                },
              }));
              
              // Request response generation
              wsRef.current?.send(JSON.stringify({
                type: 'response.create',
              }));
            } catch (error) {
              console.error('Error executing tool:', error);
            }
          }
          break;
          
        case 'error':
          console.error('Grok error:', message);
          options.onError?.(new Error(message.message || message.error?.message || 'Grok error'));
          break;
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }, [options, playNextAudio, sendSessionUpdate]);

  const startRecording = useCallback(async (sampleRate: number) => {
    try {
      console.log('Starting audio recording at sample rate:', sampleRate);
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
      
      // Use ScriptProcessorNode for audio processing
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      
      processor.onaudioprocess = (e) => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Resample from 48kHz to target sample rate
        const resampled = resampleAudio(inputData, 48000, sampleRate);
        const pcmData = floatTo16BitPCM(resampled);
        const base64Audio = arrayBufferToBase64(pcmData);
        
        wsRef.current.send(JSON.stringify({
          type: 'input_audio_buffer.append',
          audio: base64Audio,
        }));
      };
      
      source.connect(processor);
      processor.connect(audioContextRef.current.destination);
      console.log('Audio recording started successfully');
      
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (processorRef.current) {
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

  const startSession = useCallback(async () => {
    try {
      console.log('Starting Grok session...');
      setConnectionError(null);
      setStatus('connecting');
      sessionCreatedRef.current = false;
      
      // Set connection timeout (15 seconds)
      connectionTimeoutRef.current = setTimeout(() => {
        if (status === 'connecting') {
          const error = new Error('Connection timeout - please try again');
          setConnectionError(error.message);
          setStatus('disconnected');
          options.onError?.(error);
          // Clean up WebSocket if exists
          if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
          }
          stopRecording();
        }
      }, 15000);
      
      // Get session config from edge function (includes ephemeral token in URL)
      const { data, error } = await supabase.functions.invoke('grok-voice-session', {
        body: { 
          voice: options.voice || 'Ara',
          instructions: options.instructions,
        },
      });
      
      if (error) {
        console.error('Edge function error:', error);
        const errorMsg = error.message || 'Failed to get Grok session config';
        setConnectionError(errorMsg);
        setStatus('disconnected');
        throw new Error(errorMsg);
      }
      
      if (!data?.wsUrl) {
        console.error('Invalid session config:', data);
        const errorMsg = 'Failed to get Grok session config: missing wsUrl';
        setConnectionError(errorMsg);
        setStatus('disconnected');
        throw new Error(errorMsg);
      }
      
      console.log('Got session config, connecting to WebSocket...');
      console.log('WebSocket URL:', data.wsUrl);
      configRef.current = data;
      
      // Connect to Grok WebSocket - URL already includes the ephemeral token
      // Use 'realtime' subprotocol as required by xAI
      const ws = new WebSocket(data.wsUrl, ['realtime']);
      wsRef.current = ws;
      
      ws.onopen = () => {
        console.log('Grok WebSocket connected, waiting for session.created...');
        // Clear timeout on successful connection
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
        // Don't send anything here - wait for session.created event
      };
      
      ws.onmessage = handleWebSocketMessage;
      
      ws.onerror = (error) => {
        console.error('Grok WebSocket error:', error);
        console.error('WebSocket readyState:', ws.readyState);
        const errorMsg = 'WebSocket connection error - check your network';
        setConnectionError(errorMsg);
        setStatus('disconnected');
        options.onError?.(new Error(errorMsg));
      };
      
      ws.onclose = (event) => {
        console.log('Grok WebSocket closed - code:', event.code, 'reason:', event.reason, 'wasClean:', event.wasClean);
        
        // Clear timeout
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
        
        // Provide helpful error messages based on close code
        if (event.code !== 1000 && event.code !== 1005) {
          let errorMsg = `Connection closed unexpectedly (code: ${event.code})`;
          if (event.code === 1006) {
            errorMsg = 'Connection lost - please check your network and try again';
          } else if (event.code === 1008) {
            errorMsg = 'Policy violation - please try again';
          } else if (event.code === 1011) {
            errorMsg = 'Server error - please try again later';
          } else if (event.reason) {
            errorMsg = event.reason;
          }
          setConnectionError(errorMsg);
        }
        
        stopRecording();
        setStatus('disconnected');
        options.onDisconnect?.();
      };
      
    } catch (error) {
      console.error('Error starting Grok session:', error);
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      setStatus('disconnected');
      throw error;
    }
  }, [options, handleWebSocketMessage, stopRecording, status]);

  const endSession = useCallback(async () => {
    // Clear connection timeout
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    
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
      wsRef.current.close();
      wsRef.current = null;
    }
    
    configRef.current = null;
    setStatus('disconnected');
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
      endSession();
    };
  }, [endSession]);

  return {
    status,
    isSpeaking,
    connectionError,
    startSession,
    endSession,
    clearError,
  };
}
