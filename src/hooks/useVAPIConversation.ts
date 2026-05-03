import { useState, useRef, useCallback, useEffect } from 'react';
import Vapi from '@vapi-ai/web';
import { supabase } from '@/integrations/supabase/client';
import { 
  type VAPISettings, 
  DEFAULT_VAPI_SETTINGS,
  type ConnectionPhase,
  type ToolExecution,
} from '@/components/voice/voiceTypes';

interface VAPIConversationOptions {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onMessage?: (message: VAPIMessage) => void;
  onError?: (error: Error) => void;
  onTranscript?: (transcript: { role: 'user' | 'assistant'; text: string }) => void;
  clientTools?: Record<string, (params: any) => Promise<string>>;
  settings?: VAPISettings;
  systemPrompt?: string;
  firstMessage?: string;
}

interface VAPIMessage {
  type: string;
  [key: string]: any;
}

export function useVAPIConversation(options: VAPIConversationOptions = {}) {
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [inputAudioLevel, setInputAudioLevel] = useState(0);
  const [outputAudioLevel, setOutputAudioLevel] = useState(0);
  const [connectionPhase, setConnectionPhase] = useState<ConnectionPhase>('idle');
  const [activeToolCall, setActiveToolCall] = useState<ToolExecution | null>(null);
  
  const vapiRef = useRef<Vapi | null>(null);
  const volumeIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    console.log('[VAPI] Cleaning up resources...');
    
    if (volumeIntervalRef.current) {
      clearInterval(volumeIntervalRef.current);
      volumeIntervalRef.current = null;
    }
    
    if (vapiRef.current) {
      vapiRef.current.stop();
      vapiRef.current = null;
    }
    
    setInputAudioLevel(0);
    setOutputAudioLevel(0);
    setIsSpeaking(false);
  }, []);

  const startSession = useCallback(async () => {
    try {
      console.log('[VAPI] ====== Starting VAPI connection ======');
      console.log('[VAPI] Timestamp:', new Date().toISOString());
      
      cleanup();
      setConnectionError(null);
      setStatus('connecting');
      setConnectionPhase('getting_token');
      
      const settings = options.settings || DEFAULT_VAPI_SETTINGS;
      console.log('[VAPI] Settings:', settings);
      
      // Get VAPI credentials from edge function
      const { data, error } = await supabase.functions.invoke('vapi-session', {
        body: {
          assistantId: settings.assistantId,
          customPrompt: options.systemPrompt,
          firstMessage: options.firstMessage,
        },
      });

      if (error || !data?.apiKey) {
        const errorMsg = error?.message || data?.error || 'Failed to get VAPI credentials';
        console.error('[VAPI] Session error:', errorMsg);
        throw new Error(errorMsg);
      }

      console.log('[VAPI] Got credentials, initializing SDK...');
      setConnectionPhase('connecting_webrtc');
      
      // Initialize VAPI client
      const vapi = new Vapi(data.apiKey);
      vapiRef.current = vapi;

      // Set up event handlers
      vapi.on('call-start', () => {
        console.log('[VAPI] Call started');
        setConnectionPhase('ready');
        setStatus('connected');
        options.onConnect?.();
      });

      vapi.on('call-end', () => {
        console.log('[VAPI] Call ended');
        setStatus('disconnected');
        setConnectionPhase('idle');
        options.onDisconnect?.();
      });

      vapi.on('speech-start', () => {
        console.log('[VAPI] Assistant speaking');
        setIsSpeaking(true);
      });

      vapi.on('speech-end', () => {
        console.log('[VAPI] Assistant stopped speaking');
        setIsSpeaking(false);
      });

      vapi.on('message', (message: VAPIMessage) => {
        console.log('[VAPI] Message:', message.type);
        options.onMessage?.(message);

        // Handle transcripts
        if (message.type === 'transcript') {
          if (message.transcriptType === 'partial' || message.transcriptType === 'final') {
            options.onTranscript?.({
              role: message.role === 'user' ? 'user' : 'assistant',
              text: message.transcript,
            });
          }
        }

        // Handle function calls
        if (message.type === 'function-call' && message.functionCall) {
          const { name, parameters } = message.functionCall;
          if (options.clientTools?.[name]) {
            console.log('[VAPI] Executing tool:', name);
            setActiveToolCall({ name, status: 'executing', startedAt: new Date() });
            
            options.clientTools[name](parameters)
              .then((result) => {
                console.log('[VAPI] Tool result:', result);
                setActiveToolCall(prev => prev ? { ...prev, status: 'completed' } : null);
                
                // Send function result back to VAPI
                vapi.send({
                  type: 'add-message',
                  message: {
                    role: 'function',
                    name,
                    content: result,
                  },
                });
                
                setTimeout(() => setActiveToolCall(null), 1500);
              })
              .catch((err) => {
                console.error('[VAPI] Tool error:', err);
                setActiveToolCall(prev => prev ? { ...prev, status: 'error' } : null);
                setTimeout(() => setActiveToolCall(null), 2000);
              });
          }
        }
      });

      vapi.on('volume-level', (volume: number) => {
        setInputAudioLevel(volume);
      });

      vapi.on('error', (error: Error) => {
        console.error('[VAPI] Error:', error);
        setConnectionError(error.message);
        setConnectionPhase('error');
        options.onError?.(error);
      });

      // Start the call
      console.log('[VAPI] Starting call...');
      setConnectionPhase('configuring');
      
      // Build assistant config
      const assistantConfig: any = {
        name: 'ƷBI',
        voice: {
          provider: 'openai',
          voiceId: 'alloy',
        },
        model: {
          provider: 'openai',
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: options.systemPrompt || 'You are a helpful voice assistant. Be concise and conversational.',
            },
          ],
        },
        firstMessage: data.config?.firstMessage || options.firstMessage || 'Hello! How can I help you today?',
        backgroundDenoisingEnabled: settings.backgroundDenoisingEnabled,
        recordingEnabled: settings.enableRecording,
        hipaaEnabled: settings.hipaaEnabled,
      };

      // Add tools if provided
      if (options.clientTools && Object.keys(options.clientTools).length > 0) {
        assistantConfig.model.tools = Object.keys(options.clientTools).map(name => ({
          type: 'function',
          function: {
            name,
            description: `Execute ${name} function`,
            parameters: {
              type: 'object',
              properties: {},
            },
          },
        }));
      }

      // Use assistantId if provided, otherwise use inline config
      if (settings.assistantId) {
        await vapi.start(settings.assistantId);
      } else {
        await vapi.start(assistantConfig);
      }

      console.log('[VAPI] Call started successfully');

    } catch (error) {
      console.error('[VAPI] Connection error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect';
      setConnectionError(errorMessage);
      setConnectionPhase('error');
      setStatus('disconnected');
      options.onError?.(error instanceof Error ? error : new Error(errorMessage));
      cleanup();
    }
  }, [options, cleanup]);

  const endSession = useCallback(async () => {
    console.log('[VAPI] Ending session...');
    if (vapiRef.current) {
      vapiRef.current.stop();
    }
    cleanup();
    setStatus('disconnected');
    setConnectionPhase('idle');
    options.onDisconnect?.();
  }, [cleanup, options]);

  const sendTextMessage = useCallback(async (text: string) => {
    if (!vapiRef.current) {
      console.error('[VAPI] Not connected');
      return;
    }
    
    console.log('[VAPI] Sending text message:', text);
    vapiRef.current.send({
      type: 'add-message',
      message: {
        role: 'user',
        content: text,
      },
    });
  }, []);

  const clearError = useCallback(() => {
    setConnectionError(null);
  }, []);

  // Hardware-level mic mute via VAPI SDK
  const setMicEnabled = useCallback((enabled: boolean) => {
    if (vapiRef.current) {
      vapiRef.current.setMuted(!enabled);
      console.log('[VAPI] Mic muted:', !enabled);
    }
  }, []);

  // Hardware-level output volume: VAPI doesn't expose a direct volume API,
  // but we can find and control the audio element it creates
  const setOutputVolume = useCallback((vol: number) => {
    // VAPI SDK creates an audio element internally; find it
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(el => {
      if (el.srcObject) {
        el.volume = Math.max(0, Math.min(1, vol));
      }
    });
    console.log('[VAPI] Output volume set to:', vol);
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
    setMicEnabled,
    setOutputVolume,
    connectionInfo: { tokenParam: 'vapi' },
    isFallbackMode: false,
  };
}
