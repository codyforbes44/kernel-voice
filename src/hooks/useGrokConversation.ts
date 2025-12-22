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
  const [inputAudioLevel, setInputAudioLevel] = useState(0);
  const [outputAudioLevel, setOutputAudioLevel] = useState(0);
  const [connectionInfo, setConnectionInfo] = useState<{ tokenParam?: string } | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioQueueRef = useRef<Blob[]>([]);
  const isPlayingRef = useRef(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const configRef = useRef<GrokSessionConfig | null>(null);
  const sessionCreatedRef = useRef(false);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const levelIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
        // Create natural-looking level variations
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
          // Calculate RMS level
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i] * dataArray[i];
          }
          const rms = Math.sqrt(sum / dataArray.length) / 255;
          setInputAudioLevel(Math.min(1, rms * 2)); // Amplify for better visualization
        }
      }, 50);
      
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
    // Stop level monitoring
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
      console.log('Starting Grok session via WebSocket relay...');
      setConnectionError(null);
      setStatus('connecting');
      sessionCreatedRef.current = false;
      
      // Set connection timeout (20 seconds for relay connection)
      connectionTimeoutRef.current = setTimeout(() => {
        if (status === 'connecting') {
          const error = new Error('Connection timeout - please try again');
          setConnectionError(error.message);
          setStatus('disconnected');
          options.onError?.(error);
          if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
          }
          stopRecording();
        }
      }, 20000);
      
      // Store config for audio settings
      configRef.current = {
        wsUrl: '', // Will be set by relay
        voice: options.voice || 'Ara',
        language: null,
        instructions: options.instructions || '',
        audio: {
          input: { format: { type: 'audio/pcm', rate: 24000 } },
          output: { format: { type: 'audio/pcm', rate: 24000 } },
        },
      };
      
      // Connect to our WebSocket relay edge function
      // The relay handles xAI authentication server-side
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const wsProtocol = supabaseUrl.startsWith('https') ? 'wss' : 'ws';
      const wsHost = supabaseUrl.replace(/^https?:\/\//, '');
      
      const voice = encodeURIComponent(options.voice || 'Ara');
      const instructions = options.instructions ? encodeURIComponent(options.instructions) : '';
      
      const relayUrl = `${wsProtocol}://${wsHost}/functions/v1/grok-voice-relay?voice=${voice}${instructions ? `&instructions=${instructions}` : ''}`;
      
      console.log('Connecting to relay:', relayUrl.substring(0, 100) + '...');
      
      const ws = new WebSocket(relayUrl);
      wsRef.current = ws;
      
      ws.onopen = () => {
        console.log('Connected to Grok voice relay, waiting for xAI connection...');
      };
      
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('Relay message:', message.type);
          
          // Handle relay-specific messages
          if (message.type === 'relay.connected') {
            console.log('Relay connected to xAI:', message.message);
            if (message.tokenParam) {
              console.log('Successfully connected using token param:', message.tokenParam);
              setConnectionInfo({ tokenParam: message.tokenParam });
            }
            // Clear timeout on relay connection
            if (connectionTimeoutRef.current) {
              clearTimeout(connectionTimeoutRef.current);
              connectionTimeoutRef.current = null;
            }
            return;
          }
          
          if (message.type === 'relay.disconnected') {
            console.log('Relay disconnected from xAI:', message.reason);
            const errorMsg = message.reason || 'Disconnected from Grok service';
            setConnectionError(errorMsg);
            setStatus('disconnected');
            stopRecording();
            options.onDisconnect?.();
            return;
          }
          
          // Forward all other messages to the normal handler
          handleWebSocketMessage(event);
          
        } catch (error) {
          // Non-JSON message, pass to handler
          handleWebSocketMessage(event);
        }
      };
      
      ws.onerror = (error) => {
        console.error('Relay WebSocket error:', error);
        console.error('WebSocket readyState:', ws.readyState);
        const errorMsg = 'Failed to connect to voice service - please try again';
        setConnectionError(errorMsg);
        setStatus('disconnected');
        options.onError?.(new Error(errorMsg));
      };
      
      ws.onclose = (event) => {
        console.log('Relay WebSocket closed - code:', event.code, 'reason:', event.reason, 'wasClean:', event.wasClean);
        
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
        
        // Provide helpful error messages based on close code
        if (event.code !== 1000 && event.code !== 1005) {
          let errorMsg = `Connection closed unexpectedly (code: ${event.code})`;
          if (event.code === 1006) {
            errorMsg = 'Connection lost - the voice service may be unavailable';
          } else if (event.code === 1008) {
            errorMsg = 'Authentication error - please try again';
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

  // Send a text message via WebSocket
  const sendTextMessage = useCallback((text: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('Cannot send text message: WebSocket not connected');
      return false;
    }

    // Create a conversation item with text input
    wsRef.current.send(JSON.stringify({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text }],
      },
    }));

    // Trigger response generation
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
    inputAudioLevel,
    outputAudioLevel,
    startSession,
    endSession,
    clearError,
    sendTextMessage,
  };
}
