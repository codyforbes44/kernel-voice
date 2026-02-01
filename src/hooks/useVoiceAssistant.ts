import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useConversation } from '@11labs/react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMicrophonePermission } from '@/hooks/useMicrophonePermission';
import { useVoiceProviderPreference } from '@/hooks/useVoiceProviderPreference';
import { type VoiceProvider, type OpenAIVoice, type OpenAIVoiceSettings, type ConnectionPhase, type ToolExecution } from '@/components/voice/voiceTypes';
import { useOpenAIConversation } from '@/hooks/useOpenAIConversation';
import { type InputMode } from '@/components/voice/InputModeSelector';
import { useInputModePreference } from '@/hooks/useInputModePreference';
import { useTranscriptManager } from '@/hooks/useTranscriptManager';
import { createVoiceClientTools } from '@/lib/voiceClientTools';
import { type LiveTranscript } from '@/components/voice/LiveTranscripts';

/**
 * Return type for the useVoiceAssistant hook.
 * Provides comprehensive state and actions for voice assistant functionality.
 */
interface UseVoiceAssistantReturn {
  // Auth state
  isAuthenticated: boolean;
  
  // Conversation state
  conversationId: string | null;
  setConversationId: (id: string | null) => void;
  conversationTitle: string | null;
  setConversationTitle: (title: string | null) => void;
  
  // Voice state
  voiceProvider: VoiceProvider;
  setVoiceProvider: (provider: VoiceProvider) => void;
  openaiVoice: OpenAIVoice;
  setOpenAIVoice: (voice: OpenAIVoice) => void;
  openaiSettings: OpenAIVoiceSettings;
  setOpenAISettings: (settings: OpenAIVoiceSettings) => void;
  systemPrompt: string;
  setSystemPrompt: (prompt: string) => void;
  providerLoading: boolean;
  
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  connectionAuthMethod: string | undefined;
  connectionPhase: ConnectionPhase | undefined;
  isSpeaking: boolean;
  inputAudioLevel: number;
  outputAudioLevel: number;
  
  // Controls
  isMuted: boolean;
  toggleMute: () => void;
  volume: number;
  setVolume: (v: number) => void;
  inputMode: InputMode;
  setInputMode: (mode: InputMode) => void;
  
  // Actions
  startConversation: () => Promise<void>;
  endConversation: () => Promise<void>;
  retryConnection: () => Promise<void>;
  clearConnectionError: () => void;
  sendTextMessage: (text: string) => Promise<void>;
  isProcessingText: boolean;
  
  // Tool execution
  activeToolCall: ToolExecution | null;
  
  // Transcripts
  liveTranscripts: LiveTranscript[];
  
  // Microphone permission
  permissionState: 'checking' | 'granted' | 'denied' | 'prompt';
  requestPermission: () => Promise<boolean>;
  isReady: boolean;
  
  // Guest mode
  guestMessages: Array<{ role: string; content: string }>;
  showRegistrationPrompt: boolean;
  setShowRegistrationPrompt: (show: boolean) => void;
}

export function useVoiceAssistant(): UseVoiceAssistantReturn {
  const { toast } = useToast();
  
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Conversation state
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationTitle, setConversationTitle] = useState<string | null>(null);
  
  // Controls
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  
  // Guest mode
  const [guestMessages, setGuestMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [showRegistrationPrompt, setShowRegistrationPrompt] = useState(false);
  
  // Microphone permission
  const { permissionState, requestPermission, isReady } = useMicrophonePermission();
  
  // Input mode preference (persisted)
  const { inputMode, setInputMode, loading: inputModeLoading } = useInputModePreference(isAuthenticated);
  
  // Voice provider state
  const { 
    provider: voiceProvider, 
    setProvider: setVoiceProvider, 
    openaiVoice,
    setOpenAIVoice,
    openaiSettings,
    setOpenAISettings,
    systemPrompt,
    setSystemPrompt,
    loading: providerLoading 
  } = useVoiceProviderPreference(isAuthenticated);

  // Transcript manager hook
  const { 
    liveTranscripts, 
    addTranscript, 
    clearTranscripts, 
    updateLastAssistantTranscript 
  } = useTranscriptManager();

  // Authentication check
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Session error:', error);
        setIsAuthenticated(false);
        return;
      }
      setIsAuthenticated(!!session);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED') {
        console.log('Session refreshed successfully');
      }
      if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setGuestMessages([]);
      }
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Auto-load last conversation for authenticated users
  useEffect(() => {
    const loadLastConversation = async () => {
      if (!isAuthenticated) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: lastConv } = await supabase
        .from('conversations')
        .select('id, title')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (lastConv) {
        setConversationId(lastConv.id);
        setConversationTitle(lastConv.title);
      }
    };
    
    loadLastConversation();
  }, [isAuthenticated]);

  // Use refs for mutable state that clientTools needs access to
  const guestMessagesRef = useRef(guestMessages);
  const conversationIdRef = useRef(conversationId);
  useEffect(() => {
    guestMessagesRef.current = guestMessages;
  }, [guestMessages]);
  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  // Create client tools using factory function
  const clientTools = useMemo(() => createVoiceClientTools({
    onGuestMessage: (message) => setGuestMessages(prev => [...prev, message]),
    getGuestMessages: () => guestMessagesRef.current,
    getConversationId: () => conversationIdRef.current,
    setConversationId,
    onRateLimitError: () => {
      toast({
        title: 'Rate Limit Exceeded',
        description: 'Too many requests. Please wait a moment and try again.',
        variant: 'destructive',
      });
    },
    onCreditsError: () => {
      toast({
        title: 'Credits Exhausted',
        description: 'AI credits have been exhausted. Please add more credits.',
        variant: 'destructive',
      });
    },
  }), [toast, setConversationId]);

  // ElevenLabs conversation hook
  const elevenlabsConversation = useConversation({
    onConnect: () => {
      console.log('Connected to ElevenLabs voice service');
      clearTranscripts();
      toast({
        title: 'Connected',
        description: 'Voice assistant is ready (ElevenLabs)',
      });
    },
    onDisconnect: () => {
      console.log('Disconnected from ElevenLabs voice service');
    },
    onMessage: (message: any) => {
      console.log('ElevenLabs message received:', message);
      
      if (message.type === 'user_transcript' && message.user_transcription_event?.user_transcript) {
        addTranscript('user', message.user_transcription_event.user_transcript);
      } else if (message.type === 'agent_response' && message.agent_response_event?.agent_response) {
        addTranscript('assistant', message.agent_response_event.agent_response);
      } else if (message.type === 'agent_response_correction' && message.agent_response_correction_event?.corrected_agent_response) {
        updateLastAssistantTranscript(message.agent_response_correction_event.corrected_agent_response, false);
      }
    },
    onError: (error) => {
      console.error('ElevenLabs voice service error:', error);
      toast({
        title: 'Error',
        description: 'Voice connection error',
        variant: 'destructive',
      });
    },
    clientTools,
  });

  // OpenAI conversation hook
  const openaiConversation = useOpenAIConversation({
    onConnect: () => {
      console.log('Connected to OpenAI Realtime voice service');
      clearTranscripts();
      toast({
        title: 'Connected',
        description: 'Voice assistant is ready (OpenAI)',
      });
    },
    onDisconnect: () => {
      console.log('Disconnected from OpenAI voice service');
    },
    onMessage: (message) => {
      console.log('OpenAI message received:', message);
    },
    onError: (error) => {
      console.error('OpenAI voice service error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Voice connection error',
        variant: 'destructive',
      });
    },
    onTranscript: (transcript) => {
      console.log('OpenAI transcript:', transcript);
      if (transcript.role === 'assistant') {
        addTranscript('assistant', transcript.text, true);
      } else {
        addTranscript('user', transcript.text);
      }
    },
    clientTools,
    voice: openaiVoice,
    instructions: systemPrompt,
    settings: openaiSettings,
  });

  // Use the selected provider's conversation
  const conversation = voiceProvider === 'elevenlabs' 
    ? elevenlabsConversation 
    : openaiConversation;
  const isConnected = conversation.status === 'connected';
  const isConnecting = voiceProvider === 'openai' 
    ? openaiConversation.status === 'connecting' 
    : false;
  const connectionError = voiceProvider === 'openai' 
    ? openaiConversation.connectionError 
    : null;
  const connectionAuthMethod = voiceProvider === 'openai'
    ? openaiConversation.connectionInfo?.tokenParam 
    : undefined;
  const connectionPhase = voiceProvider === 'openai' 
    ? openaiConversation.connectionPhase 
    : undefined;
  const inputAudioLevel = voiceProvider === 'openai'
    ? openaiConversation.inputAudioLevel 
    : 0;
  const outputAudioLevel = voiceProvider === 'openai'
    ? openaiConversation.outputAudioLevel 
    : 0;

  // Use refs to stabilize the startConversation callback
  const voiceProviderRef = useRef(voiceProvider);
  const elevenlabsConversationRef = useRef(elevenlabsConversation);
  const openaiConversationRef = useRef(openaiConversation);
  
  useEffect(() => {
    voiceProviderRef.current = voiceProvider;
  }, [voiceProvider]);
  useEffect(() => {
    elevenlabsConversationRef.current = elevenlabsConversation;
  }, [elevenlabsConversation]);
  useEffect(() => {
    openaiConversationRef.current = openaiConversation;
  }, [openaiConversation]);

  // Ref to track if a start is in progress
  const isStartingConversationRef = useRef(false);

  const startConversation = useCallback(async () => {
    // Guard: prevent concurrent start attempts
    if (isStartingConversationRef.current) {
      console.log('[VoiceAssistant] startConversation blocked - already starting');
      return;
    }
    
    isStartingConversationRef.current = true;
    
    try {
      clearTranscripts();
      
      if (voiceProviderRef.current === 'elevenlabs') {
        const { data, error } = await supabase.functions.invoke('voice-session');
        
        if (error || !data?.signedUrl) {
          throw new Error(error?.message || 'Failed to get session URL');
        }

        console.log('Starting ElevenLabs voice session');
        await elevenlabsConversationRef.current.startSession({ 
          signedUrl: data.signedUrl 
        });
      } else {
        console.log('Starting OpenAI Realtime voice session');
        await openaiConversationRef.current.startSession();
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        title: 'Connection Failed',
        description: error instanceof Error ? error.message : 'Failed to start conversation',
        variant: 'destructive',
      });
    } finally {
      isStartingConversationRef.current = false;
    }
  }, [toast, clearTranscripts]);

  const endConversation = async () => {
    if (voiceProvider === 'elevenlabs') {
      await elevenlabsConversation.endSession();
    } else {
      await openaiConversation.endSession();
    }
    
    if (!isAuthenticated && guestMessages.length > 0) {
      setShowRegistrationPrompt(true);
    }
  };

  const retryConnection = async () => {
    if (voiceProvider === 'openai') {
      openaiConversation.clearError();
    }
    await startConversation();
  };

  const clearConnectionError = () => {
    if (voiceProvider === 'openai') {
      openaiConversation.clearError();
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Text message state
  const [isProcessingText, setIsProcessingText] = useState(false);

  // Send text message function
  const sendTextMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;
    
    // Add user message to transcripts immediately
    addTranscript('user', text);
    setIsProcessingText(true);
    
    try {
      // If connected to OpenAI and it's the active provider, send via data channel
      if (voiceProvider === 'openai' && isConnected && openaiConversation.sendTextMessage) {
        openaiConversation.sendTextMessage(text);
        setIsProcessingText(false);
        return;
      }
      
      // Otherwise, use the chat function
      const response = await clientTools.chat({ message: text });
      const parsed = JSON.parse(response);
      
      if (parsed.response) {
        addTranscript('assistant', parsed.response);
      } else if (parsed.error) {
        addTranscript('assistant', 'Sorry, I encountered an error processing your message.');
      }
    } catch (error) {
      console.error('Error sending text message:', error);
      addTranscript('assistant', 'Sorry, something went wrong. Please try again.');
    } finally {
      setIsProcessingText(false);
    }
  }, [voiceProvider, isConnected, openaiConversation, addTranscript, clientTools]);

  return {
    // Auth state
    isAuthenticated,
    
    // Conversation state
    conversationId,
    setConversationId,
    conversationTitle,
    setConversationTitle,
    
    // Voice state
    voiceProvider,
    setVoiceProvider,
    openaiVoice,
    setOpenAIVoice,
    openaiSettings,
    setOpenAISettings,
    systemPrompt,
    setSystemPrompt,
    providerLoading,
    
    // Connection state
    isConnected,
    isConnecting,
    connectionError,
    connectionAuthMethod,
    connectionPhase,
    isSpeaking: conversation.isSpeaking,
    inputAudioLevel,
    outputAudioLevel,
    
    // Controls
    isMuted,
    toggleMute,
    volume,
    setVolume,
    inputMode,
    setInputMode,
    
    // Actions
    startConversation,
    endConversation,
    retryConnection,
    clearConnectionError,
    sendTextMessage,
    isProcessingText,
    
    // Tool execution
    activeToolCall: voiceProvider === 'openai' 
      ? openaiConversation.activeToolCall 
      : null,
    
    // Transcripts
    liveTranscripts,
    
    // Microphone permission
    permissionState,
    requestPermission,
    isReady,
    
    // Guest mode
    guestMessages,
    showRegistrationPrompt,
    setShowRegistrationPrompt,
  };
}
