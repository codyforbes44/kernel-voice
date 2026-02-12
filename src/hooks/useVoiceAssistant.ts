import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useConversation } from '@11labs/react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMicrophonePermission } from '@/hooks/useMicrophonePermission';
import { useVoiceProviderPreference } from '@/hooks/useVoiceProviderPreference';
import { type VoiceProvider, type OpenAIVoice, type OpenAIVoiceSettings, type ElevenLabsSettings, type VAPISettings, type GeminiLiveSettings, type ConnectionPhase, type ToolExecution } from '@/components/voice/voiceTypes';
import { useOpenAIConversation } from '@/hooks/useOpenAIConversation';
import { useVAPIConversation } from '@/hooks/useVAPIConversation';
import { useGeminiLiveConversation } from '@/hooks/useGeminiLiveConversation';
import { type InputMode } from '@/components/voice/InputModeSelector';
import { useInputModePreference } from '@/hooks/useInputModePreference';
import { useTranscriptManager } from '@/hooks/useTranscriptManager';
import { createVoiceClientTools } from '@/lib/voiceClientTools';
import { type LiveTranscript } from '@/components/voice/LiveTranscripts';
import { useAuth } from '@/contexts/AuthContext';

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
  elevenlabsSettings: ElevenLabsSettings;
  setElevenLabsSettings: (settings: ElevenLabsSettings) => void;
  vapiSettings: VAPISettings;
  setVapiSettings: (settings: VAPISettings) => void;
  geminiLiveSettings: GeminiLiveSettings;
  setGeminiLiveSettings: (settings: GeminiLiveSettings) => void;
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
  
  // Pause/resume
  isPaused: boolean;
  pauseConversation: () => void;
  resumeConversation: () => void;

  // Guest mode
  guestMessages: Array<{ role: string; content: string }>;
  showRegistrationPrompt: boolean;
  setShowRegistrationPrompt: (show: boolean) => void;
}

export function useVoiceAssistant(): UseVoiceAssistantReturn {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  
  // Conversation state
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationTitle, setConversationTitle] = useState<string | null>(null);
  
  // Controls
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);

  // Pause/resume state
  const [isPaused, setIsPaused] = useState(false);
  const volumeBeforePauseRef = useRef(1);
  
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
    elevenlabsSettings,
    setElevenLabsSettings,
    vapiSettings,
    setVapiSettings,
    geminiLiveSettings,
    setGeminiLiveSettings,
    systemPrompt,
    setSystemPrompt,
    loading: providerLoading 
  } = useVoiceProviderPreference(isAuthenticated);

  // Transcript manager hook
  const { 
    liveTranscripts, 
    addTranscript, 
    clearTranscripts, 
    updateLastAssistantTranscript,
    getTranscriptsForSave,
  } = useTranscriptManager();

  // Auto-load last conversation for authenticated users
  useEffect(() => {
    const loadLastConversation = async () => {
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
  }, [user]);

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
      console.log('Connected to 3ʙɪ Realtime voice service');
      clearTranscripts();
      toast({
        title: 'Connected',
        description: 'Voice assistant is ready (3ʙɪ)',
      });
    },
    onDisconnect: () => {
      console.log('Disconnected from 3ʙɪ voice service');
    },
    onMessage: (message) => {
      console.log('3ʙɪ message received:', message);
    },
    onError: (error) => {
      console.error('3ʙɪ voice service error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Voice connection error',
        variant: 'destructive',
      });
    },
    onTranscript: (transcript) => {
      console.log('3ʙɪ transcript:', transcript);
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
    firstMessage: openaiSettings.firstMessage,
  });

  // VAPI conversation hook
  const vapiConversation = useVAPIConversation({
    onConnect: () => {
      console.log('Connected to VAPI voice service');
      clearTranscripts();
      toast({ title: 'Connected', description: 'Voice assistant is ready (VAPI)' });
    },
    onDisconnect: () => { console.log('Disconnected from VAPI voice service'); },
    onMessage: (message) => { console.log('VAPI message received:', message); },
    onError: (error) => {
      console.error('VAPI voice service error:', error);
      toast({ title: 'Error', description: error.message || 'Voice connection error', variant: 'destructive' });
    },
    onTranscript: (transcript) => {
      console.log('VAPI transcript:', transcript);
      if (transcript.role === 'assistant') {
        addTranscript('assistant', transcript.text, true);
      } else {
        addTranscript('user', transcript.text);
      }
    },
    clientTools,
    settings: vapiSettings,
    systemPrompt,
    firstMessage: openaiSettings.firstMessage,
  });

  // Gemini Live conversation hook
  const geminiConversation = useGeminiLiveConversation({
    onConnect: () => {
      console.log('Connected to Gemini Live voice service');
      clearTranscripts();
      toast({ title: 'Connected', description: 'Voice assistant is ready (Gemini Live)' });
    },
    onDisconnect: () => { console.log('Disconnected from Gemini Live voice service'); },
    onMessage: (message) => { console.log('Gemini Live message received:', message); },
    onError: (error) => {
      console.error('Gemini Live voice service error:', error);
      toast({ title: 'Error', description: error.message || 'Voice connection error', variant: 'destructive' });
    },
    onTranscript: (transcript) => {
      console.log('Gemini Live transcript:', transcript);
      if (transcript.role === 'assistant') {
        addTranscript('assistant', transcript.text, true);
      } else {
        addTranscript('user', transcript.text);
      }
    },
    clientTools,
    settings: geminiLiveSettings,
    systemPrompt,
  });

  // Get the active provider's conversation object — eliminates repeated ternary chains
  const providerConversations = useMemo(() => ({
    elevenlabs: elevenlabsConversation,
    openai: openaiConversation,
    vapi: vapiConversation,
    gemini: geminiConversation,
  }), [elevenlabsConversation, openaiConversation, vapiConversation, geminiConversation]);

  const conversation = providerConversations[voiceProvider];
  const isConnected = conversation.status === 'connected';
  const isConnecting = conversation.status === 'connecting';
  
  // These properties only exist on openai/vapi providers
  const activeProviderConv = voiceProvider !== 'elevenlabs' ? providerConversations[voiceProvider] : null;
  const connectionError = activeProviderConv?.connectionError ?? null;
  const connectionAuthMethod = activeProviderConv?.connectionInfo?.tokenParam;
  const connectionPhase = activeProviderConv?.connectionPhase;
  const inputAudioLevel = activeProviderConv?.inputAudioLevel ?? 0;
  const outputAudioLevel = activeProviderConv?.outputAudioLevel ?? 0;

  // Use refs to stabilize the startConversation callback
  const voiceProviderRef = useRef(voiceProvider);
  const elevenlabsSettingsRef = useRef(elevenlabsSettings);
  
  useEffect(() => { voiceProviderRef.current = voiceProvider; }, [voiceProvider]);
  useEffect(() => { elevenlabsSettingsRef.current = elevenlabsSettings; }, [elevenlabsSettings]);

  // Keep refs for conversation objects to avoid stale closures in startConversation
  const providerConversationsRef = useRef(providerConversations);
  useEffect(() => { providerConversationsRef.current = providerConversations; }, [providerConversations]);

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

      // Create a new conversation record for authenticated users
      if (user) {
        try {
          const title = `Voice Session - ${new Date().toLocaleString()}`;
          const { data: conv, error: convError } = await supabase
            .from('conversations')
            .insert({ user_id: user.id, title })
            .select('id, title')
            .single();
          
          if (!convError && conv) {
            setConversationId(conv.id);
            setConversationTitle(conv.title);
            console.log('[VoiceAssistant] Created conversation:', conv.id);
          } else {
            console.error('[VoiceAssistant] Failed to create conversation:', convError);
          }
        } catch (e) {
          console.error('[VoiceAssistant] Error creating conversation:', e);
        }
      }
      
      if (voiceProviderRef.current === 'elevenlabs') {
        const settings = elevenlabsSettingsRef.current;
        const { data, error } = await supabase.functions.invoke('voice-session', {
          body: {
            connectionType: 'webrtc',
            language: settings.autoLanguageDetection ? 'auto' : settings.language,
            ...(settings.elevenlabsAgentId && { agentId: settings.elevenlabsAgentId }),
            ...(settings.voiceId && { voiceId: settings.voiceId }),
          }
        });
        
        if (error || !data?.signedUrl) {
          throw new Error(error?.message || 'Failed to get session URL');
        }

        console.log('Starting ElevenLabs voice session with language:', settings.autoLanguageDetection ? 'auto' : settings.language);
        await providerConversationsRef.current.elevenlabs.startSession({ 
          signedUrl: data.signedUrl,
          ...(data.overrides && { overrides: data.overrides }),
        });
      } else if (voiceProviderRef.current === 'gemini') {
        console.log('Starting Gemini Live voice session');
        await providerConversationsRef.current.gemini.startSession();
      } else if (voiceProviderRef.current === 'vapi') {
        console.log('Starting VAPI voice session');
        await providerConversationsRef.current.vapi.startSession();
      } else {
        console.log('Starting 3ʙɪ Realtime voice session');
        await providerConversationsRef.current.openai.startSession();
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
  }, [toast, clearTranscripts, user, setConversationId, setConversationTitle]);

  // Helper to call setMicEnabled on the active provider (if available)
  const setProviderMicEnabled = useCallback((enabled: boolean) => {
    const provider = voiceProviderRef.current;
    const convs = providerConversationsRef.current;
    if (provider === 'elevenlabs') {
      // ElevenLabs doesn't expose mic control; we can't hardware-mute it
      // but setVolume(0) silences the agent output
      return;
    }
    const conv = convs[provider] as any;
    conv?.setMicEnabled?.(enabled);
  }, []);

  // Helper to call setOutputVolume on the active provider (if available)
  const setProviderOutputVolume = useCallback((vol: number) => {
    const provider = voiceProviderRef.current;
    const convs = providerConversationsRef.current;
    if (provider === 'elevenlabs') {
      convs.elevenlabs.setVolume({ volume: vol });
      return;
    }
    const conv = convs[provider] as any;
    conv?.setOutputVolume?.(vol);
  }, []);

  // Pause conversation - mute mic at hardware level, silence output, keep connection alive
  const pauseConversation = useCallback(() => {
    if (!isConnected || isPaused) return;
    volumeBeforePauseRef.current = volume;
    setIsMuted(true);
    setVolume(0);
    setIsPaused(true);
    // Hardware-level mute
    setProviderMicEnabled(false);
    setProviderOutputVolume(0);
    addTranscript('system', '⏸️ Conversation paused');
  }, [isConnected, isPaused, volume, addTranscript, setProviderMicEnabled, setProviderOutputVolume]);

  // Resume conversation - restore mic and volume at hardware level
  const resumeConversation = useCallback(() => {
    if (!isPaused) return;
    setIsMuted(false);
    setVolume(volumeBeforePauseRef.current);
    setIsPaused(false);
    // Hardware-level unmute
    setProviderMicEnabled(true);
    setProviderOutputVolume(volumeBeforePauseRef.current);
    addTranscript('system', '▶️ Conversation resumed');
  }, [isPaused, addTranscript, setProviderMicEnabled, setProviderOutputVolume]);

  // Detect "pause the conversation" in live transcripts
  useEffect(() => {
    if (!isConnected || isPaused || liveTranscripts.length === 0) return;
    const last = liveTranscripts[liveTranscripts.length - 1];
    if (last.role !== 'user') return;
    const text = last.text.toLowerCase();
    if (text.includes('pause the conversation') || text.includes('pause conversation')) {
      pauseConversation();
    }
  }, [liveTranscripts, isConnected, isPaused, pauseConversation]);

  const endConversation = async () => {
    // Save transcripts before ending
    const currentConvId = conversationIdRef.current;
    if (user && currentConvId) {
      try {
        const transcriptsToSave = getTranscriptsForSave();
        if (transcriptsToSave.length > 0) {
          const messages = transcriptsToSave.map(t => ({
            conversation_id: currentConvId,
            role: t.role,
            content: t.text,
          }));
          
          const { error: msgError } = await supabase
            .from('messages')
            .insert(messages);
          
          if (msgError) {
            console.error('[VoiceAssistant] Failed to save transcripts:', msgError);
          } else {
            console.log(`[VoiceAssistant] Saved ${messages.length} messages to conversation ${currentConvId}`);
          }

          // Update conversation title from first user message
          const firstUserMsg = transcriptsToSave.find(t => t.role === 'user');
          if (firstUserMsg) {
            const title = firstUserMsg.text.slice(0, 80) || 'Voice Session';
            await supabase
              .from('conversations')
              .update({ title, updated_at: new Date().toISOString() })
              .eq('id', currentConvId);
          }
        } else {
          // No messages — delete the empty conversation to avoid clutter
          await supabase.from('conversations').delete().eq('id', currentConvId);
          console.log('[VoiceAssistant] Deleted empty conversation:', currentConvId);
        }
      } catch (e) {
        console.error('[VoiceAssistant] Error saving voice transcripts:', e);
      }
    }

    await conversation.endSession();
    setIsPaused(false);
    
    if (!isAuthenticated && guestMessages.length > 0) {
      setShowRegistrationPrompt(true);
    }
  };

  const retryConnection = async () => {
    activeProviderConv?.clearError?.();
    await startConversation();
  };

  const clearConnectionError = () => {
    activeProviderConv?.clearError?.();
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    // Hardware-level mute/unmute
    setProviderMicEnabled(!newMuted);
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
      // If connected and provider supports text messages, send via data channel
      if (isConnected && activeProviderConv?.sendTextMessage) {
        activeProviderConv.sendTextMessage(text);
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
  }, [isConnected, activeProviderConv, addTranscript, clientTools]);

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
    elevenlabsSettings,
    setElevenLabsSettings,
    vapiSettings,
    setVapiSettings,
    geminiLiveSettings,
    setGeminiLiveSettings,
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
    activeToolCall: activeProviderConv?.activeToolCall ?? null,
    
    // Transcripts
    liveTranscripts,
    
    // Microphone permission
    permissionState,
    requestPermission,
    isReady,
    
    // Pause/resume
    isPaused,
    pauseConversation,
    resumeConversation,

    // Guest mode
    guestMessages,
    showRegistrationPrompt,
    setShowRegistrationPrompt,
  };
}
