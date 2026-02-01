import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  type OpenAIVoiceSettings, 
  DEFAULT_OPENAI_SETTINGS, 
  type OpenAIVoice,
  type ConnectionPhase,
  type ToolExecution,
} from '@/components/voice/voiceTypes';
import { getVoiceToolsConfig } from '@/lib/voiceToolDefinitions';

export type { OpenAIVoice } from '@/components/voice/voiceTypes';

interface OpenAIConversationOptions {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onMessage?: (message: OpenAIMessage) => void;
  onError?: (error: Error) => void;
  onTranscript?: (transcript: { role: 'user' | 'assistant'; text: string }) => void;
  clientTools?: Record<string, (params: any) => Promise<string>>;
  voice?: OpenAIVoice;
  instructions?: string;
  settings?: OpenAIVoiceSettings;
}

interface OpenAIMessage {
  type: string;
  [key: string]: any;
}

const BUILD_VERSION = '2024-12-22-v1';

export function useOpenAIConversation(options: OpenAIConversationOptions = {}) {
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [inputAudioLevel, setInputAudioLevel] = useState(0);
  const [outputAudioLevel, setOutputAudioLevel] = useState(0);
  const [connectionPhase, setConnectionPhase] = useState<ConnectionPhase>('idle');
  const [activeToolCall, setActiveToolCall] = useState<ToolExecution | null>(null);
  
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const levelIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track accumulated function call arguments
  const functionCallArgsRef = useRef<Map<string, { name: string; call_id: string; args: string }>>(new Map());

  const cleanup = useCallback(() => {
    console.log('[OpenAI] Cleaning up resources...');
    
    if (levelIntervalRef.current) {
      clearInterval(levelIntervalRef.current);
      levelIntervalRef.current = null;
    }
    
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (dcRef.current) {
      dcRef.current.close();
      dcRef.current = null;
    }
    
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    
    if (audioElRef.current) {
      audioElRef.current.srcObject = null;
      audioElRef.current = null;
    }
    
    setInputAudioLevel(0);
    setOutputAudioLevel(0);
    setIsSpeaking(false);
    functionCallArgsRef.current.clear();
  }, []);

  const handleDataChannelMessage = useCallback(async (event: MessageEvent) => {
    try {
      const message: OpenAIMessage = JSON.parse(event.data);
      console.log('[OpenAI] Message:', message.type);
      options.onMessage?.(message);
      
      switch (message.type) {
        case 'session.created':
          console.log('[OpenAI] Session created');
          setConnectionPhase('ready');
          setStatus('connected');
          options.onConnect?.();
          break;
          
        case 'session.updated':
          console.log('[OpenAI] Session updated');
          break;
          
        case 'input_audio_buffer.speech_started':
          console.log('[OpenAI] User started speaking');
          break;
          
        case 'input_audio_buffer.speech_stopped':
          console.log('[OpenAI] User stopped speaking');
          break;
          
        case 'conversation.item.input_audio_transcription.completed':
          if (message.transcript) {
            console.log('[OpenAI] User transcript:', message.transcript);
            options.onTranscript?.({ role: 'user', text: message.transcript });
          }
          break;
          
        case 'response.audio_transcript.delta':
          if (message.delta) {
            options.onTranscript?.({ role: 'assistant', text: message.delta });
          }
          break;
          
        case 'response.audio.delta':
          setIsSpeaking(true);
          setOutputAudioLevel(0.4 + Math.random() * 0.5);
          break;
          
        case 'response.audio.done':
          setIsSpeaking(false);
          setOutputAudioLevel(0);
          break;
          
        case 'response.function_call_arguments.delta':
          // Accumulate function call arguments
          if (message.call_id) {
            const existing = functionCallArgsRef.current.get(message.call_id);
            if (existing) {
              existing.args += message.delta || '';
            } else {
              functionCallArgsRef.current.set(message.call_id, {
                name: message.name || '',
                call_id: message.call_id,
                args: message.delta || ''
              });
            }
          }
          break;
          
        case 'response.function_call_arguments.done':
          if (message.call_id && message.name && options.clientTools?.[message.name]) {
            console.log('[OpenAI] Executing tool:', message.name);
            setActiveToolCall({ name: message.name, status: 'executing', startedAt: new Date() });
            
            try {
              const args = JSON.parse(message.arguments || '{}');
              console.log('[OpenAI] Tool arguments:', args);
              const result = await options.clientTools[message.name](args);
              console.log('[OpenAI] Tool result:', result);
              
              setActiveToolCall(prev => prev ? { ...prev, status: 'completed' } : null);
              
              // Send function output back
              if (dcRef.current?.readyState === 'open') {
                dcRef.current.send(JSON.stringify({
                  type: 'conversation.item.create',
                  item: {
                    type: 'function_call_output',
                    call_id: message.call_id,
                    output: result,
                  },
                }));
                
                dcRef.current.send(JSON.stringify({
                  type: 'response.create',
                }));
              }
              
              setTimeout(() => setActiveToolCall(null), 1500);
            } catch (error) {
              console.error('[OpenAI] Tool error:', error);
              setActiveToolCall(prev => prev ? { ...prev, status: 'error' } : null);
              setTimeout(() => setActiveToolCall(null), 2000);
            }
            
            // Cleanup accumulated args
            functionCallArgsRef.current.delete(message.call_id);
          }
          break;
          
        case 'error':
          console.error('[OpenAI] Error:', message);
          options.onError?.(new Error(message.error?.message || 'OpenAI error'));
          break;
      }
    } catch (error) {
      console.error('[OpenAI] Error parsing message:', error);
    }
  }, [options]);

  const startSession = useCallback(async () => {
    try {
      console.log('[OpenAI] ====== Starting WebRTC connection ======');
      console.log('[OpenAI] Build version:', BUILD_VERSION);
      console.log('[OpenAI] Timestamp:', new Date().toISOString());
      
      cleanup();
      setConnectionError(null);
      setStatus('connecting');
      setConnectionPhase('getting_token');
      
      const voiceSetting = options.voice || 'alloy';
      const voiceSettings = options.settings || DEFAULT_OPENAI_SETTINGS;
      console.log('[OpenAI] Voice:', voiceSetting);
      console.log('[OpenAI] Settings:', voiceSettings);
      console.log('[OpenAI] Has instructions:', !!options.instructions);
      
      // Step 1: Get ephemeral token
      console.log('[OpenAI] Step 1: Getting ephemeral token...');
      const { data: tokenData, error: tokenError } = await supabase.functions.invoke('openai-realtime-token', {
        body: {
          voice: voiceSetting,
          instructions: options.instructions,
          temperature: voiceSettings.temperature,
          vadThreshold: voiceSettings.vadThreshold,
          silenceDuration: voiceSettings.silenceDuration,
        },
      });

      if (tokenError || !tokenData?.client_secret?.value) {
        const errorMsg = tokenError?.message || tokenData?.error || 'Failed to get session token';
        console.error('[OpenAI] Token error:', errorMsg);
        throw new Error(errorMsg);
      }

      const ephemeralToken = tokenData.client_secret.value;
      console.log('[OpenAI] Got token, expires at:', new Date(tokenData.client_secret.expires_at * 1000).toISOString());
      
      setConnectionPhase('connecting_webrtc');
      
      // Step 2: Set up WebRTC
      console.log('[OpenAI] Step 2: Setting up WebRTC...');
      
      // Create audio element for playback
      audioElRef.current = document.createElement('audio');
      audioElRef.current.autoplay = true;
      
      // Create peer connection
      const pc = new RTCPeerConnection();
      pcRef.current = pc;
      
      // Handle remote audio
      pc.ontrack = (e) => {
        console.log('[OpenAI] Received remote audio track');
        if (audioElRef.current) {
          audioElRef.current.srcObject = e.streams[0];
        }
      };
      
      // Get user media and add track
      console.log('[OpenAI] Requesting microphone access...');
      const ms = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 24000,
        } 
      });
      mediaStreamRef.current = ms;
      pc.addTrack(ms.getTracks()[0]);
      
      // Set up audio level monitoring
      audioContextRef.current = new AudioContext();
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
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i] * dataArray[i];
          }
          const rms = Math.sqrt(sum / dataArray.length) / 255;
          setInputAudioLevel(Math.min(1, rms * 2));
        }
      }, 50);
      
      // Set up data channel for events
      console.log('[OpenAI] Creating data channel...');
      const dc = pc.createDataChannel('oai-events');
      dcRef.current = dc;
      
      dc.addEventListener('open', () => {
        console.log('[OpenAI] Data channel opened');
        setConnectionPhase('configuring');
        
        // Send session update with tools
        const toolsConfig = getVoiceToolsConfig(options.clientTools, false);
        
        const sessionUpdate = {
          type: 'session.update',
          session: {
            input_audio_transcription: {
              model: 'whisper-1'
            },
            ...(toolsConfig && {
              tools: toolsConfig,
              tool_choice: 'auto'
            })
          }
        };
        
        console.log('[OpenAI] Sending session update...');
        dc.send(JSON.stringify(sessionUpdate));
      });
      
      dc.addEventListener('message', handleDataChannelMessage);
      
      dc.addEventListener('close', () => {
        console.log('[OpenAI] Data channel closed');
        setStatus('disconnected');
        setConnectionPhase('idle');
        options.onDisconnect?.();
      });
      
      dc.addEventListener('error', (e) => {
        console.error('[OpenAI] Data channel error:', e);
      });
      
      // Create and set local description
      console.log('[OpenAI] Creating offer...');
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      // Connect to OpenAI's Realtime API
      console.log('[OpenAI] Sending offer to OpenAI...');
      const baseUrl = 'https://api.openai.com/v1/realtime';
      const model = 'gpt-4o-realtime-preview-2024-12-17';
      
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: 'POST',
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${ephemeralToken}`,
          'Content-Type': 'application/sdp',
        },
      });
      
      if (!sdpResponse.ok) {
        const errorText = await sdpResponse.text();
        console.error('[OpenAI] SDP response error:', sdpResponse.status, errorText);
        throw new Error(`WebRTC connection failed: ${sdpResponse.status}`);
      }
      
      const answerSdp = await sdpResponse.text();
      console.log('[OpenAI] Received SDP answer');
      
      await pc.setRemoteDescription({
        type: 'answer',
        sdp: answerSdp,
      });
      
      console.log('[OpenAI] WebRTC connection established!');
      
    } catch (error) {
      console.error('[OpenAI] Connection error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect';
      setConnectionError(errorMessage);
      setConnectionPhase('error');
      setStatus('disconnected');
      options.onError?.(error instanceof Error ? error : new Error(errorMessage));
      cleanup();
    }
  }, [options, cleanup, handleDataChannelMessage]);

  const endSession = useCallback(async () => {
    console.log('[OpenAI] Ending session...');
    cleanup();
    setStatus('disconnected');
    setConnectionPhase('idle');
    options.onDisconnect?.();
  }, [cleanup, options]);

  const sendTextMessage = useCallback(async (text: string) => {
    if (!dcRef.current || dcRef.current.readyState !== 'open') {
      console.error('[OpenAI] Data channel not ready');
      return;
    }
    
    console.log('[OpenAI] Sending text message:', text);
    
    dcRef.current.send(JSON.stringify({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: text,
          }
        ]
      }
    }));
    
    dcRef.current.send(JSON.stringify({
      type: 'response.create',
    }));
  }, []);

  const clearError = useCallback(() => {
    setConnectionError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
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
    connectionInfo: { tokenParam: 'ephemeral' },
    isFallbackMode: false,
  };
}
