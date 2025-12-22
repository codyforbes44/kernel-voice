import { useState, useEffect, useCallback } from 'react';
import { useConversation } from '@11labs/react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMicrophonePermission } from '@/hooks/useMicrophonePermission';
import { useVoiceProviderPreference, type VoiceProvider, type GrokVoice } from '@/components/voice/VoiceProviderSelector';
import { useGrokConversation } from '@/hooks/useGrokConversation';
import { type LiveTranscript } from '@/components/voice/LiveTranscripts';

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
  grokVoice: GrokVoice;
  setGrokVoice: (voice: GrokVoice) => void;
  systemPrompt: string;
  setSystemPrompt: (prompt: string) => void;
  providerLoading: boolean;
  
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  isSpeaking: boolean;
  
  // Controls
  isMuted: boolean;
  toggleMute: () => void;
  volume: number;
  setVolume: (v: number) => void;
  
  // Actions
  startConversation: () => Promise<void>;
  endConversation: () => Promise<void>;
  retryConnection: () => Promise<void>;
  clearConnectionError: () => void;
  
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
  
  // Voice provider state
  const { 
    provider: voiceProvider, 
    setProvider: setVoiceProvider, 
    grokVoice, 
    setGrokVoice,
    systemPrompt,
    setSystemPrompt,
    loading: providerLoading 
  } = useVoiceProviderPreference(isAuthenticated);

  // Live transcripts state
  const [liveTranscripts, setLiveTranscripts] = useState<LiveTranscript[]>([]);
  const [currentAssistantId, setCurrentAssistantId] = useState<string | null>(null);

  // Helper to add or update transcript
  const addTranscript = useCallback((role: 'user' | 'assistant', text: string, isPartial = false) => {
    const id = `${role}-${Date.now()}`;
    
    if (role === 'assistant' && isPartial) {
      setLiveTranscripts(prev => {
        const lastTranscript = prev[prev.length - 1];
        if (lastTranscript?.role === 'assistant' && lastTranscript?.isPartial) {
          return prev.map((t, i) => 
            i === prev.length - 1 
              ? { ...t, text: t.text + text }
              : t
          );
        }
        setCurrentAssistantId(id);
        return [...prev, { id, role, text, timestamp: new Date(), isPartial: true }];
      });
    } else if (role === 'assistant' && !isPartial && currentAssistantId) {
      setLiveTranscripts(prev => 
        prev.map(t => 
          t.id === currentAssistantId 
            ? { ...t, isPartial: false }
            : t
        )
      );
      setCurrentAssistantId(null);
    } else {
      setLiveTranscripts(prev => [...prev, { id, role, text, timestamp: new Date(), isPartial }]);
    }
  }, [currentAssistantId]);

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

  // Client tools shared by both providers
  const clientTools = {
    chat: async (parameters: { message: string }) => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setGuestMessages(prev => [...prev, { role: 'user', content: parameters.message }]);
          
          const { data, error } = await supabase.functions.invoke('chat', {
            body: {
              messages: [...guestMessages, { role: 'user', content: parameters.message }],
            },
          });

          if (error) throw error;
          
          setGuestMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
          return JSON.stringify({ response: data.message });
        }

        let currentConvId = conversationId;
        if (!currentConvId) {
          const { data: newConv } = await supabase
            .from('conversations')
            .insert({ user_id: user.id })
            .select()
            .single();
          
          if (newConv) {
            currentConvId = newConv.id;
            setConversationId(currentConvId);
          }
        }

        const { data, error } = await supabase.functions.invoke('chat', {
          body: {
            messages: [{ role: 'user', content: parameters.message }],
            conversationId: currentConvId,
            userId: user.id,
          },
        });

        if (error) throw error;

        return JSON.stringify({ response: data.message });
      } catch (error) {
        console.error('Error in conversation:', error);
        return JSON.stringify({ error: 'Failed to get response' });
      }
    },

    search: async (parameters: { query: string }) => {
      try {
        const { data, error } = await supabase.functions.invoke('search', {
          body: { query: parameters.query },
        });

        if (error) throw error;

        return JSON.stringify(data);
      } catch (error) {
        console.error('Error in search:', error);
        return JSON.stringify({ error: 'Search failed' });
      }
    },

    query_document: async (parameters: { documentId: string; query: string }) => {
      try {
        const { data } = await supabase
          .from('document_chunks')
          .select('content')
          .eq('document_id', parameters.documentId)
          .order('chunk_index');

        if (!data || data.length === 0) {
          return JSON.stringify({ error: 'Document not found' });
        }

        const fullContent = data.map(chunk => chunk.content).join('\n');
        
        const { data: response, error } = await supabase.functions.invoke('chat', {
          body: {
            messages: [
              { 
                role: 'system', 
                content: `You are analyzing a document. Here is the content:\n\n${fullContent}` 
              },
              { role: 'user', content: parameters.query }
            ],
          },
        });

        if (error) throw error;

        return JSON.stringify({ answer: response.message });
      } catch (error) {
        console.error('Error querying document:', error);
        return JSON.stringify({ error: 'Failed to query document' });
      }
    },
  };

  // ElevenLabs conversation hook
  const elevenlabsConversation = useConversation({
    onConnect: () => {
      console.log('Connected to ElevenLabs voice service');
      setLiveTranscripts([]);
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
        setLiveTranscripts(prev => {
          const lastAssistantIdx = [...prev].reverse().findIndex(t => t.role === 'assistant');
          if (lastAssistantIdx === -1) return prev;
          const actualIdx = prev.length - 1 - lastAssistantIdx;
          return prev.map((t, i) => 
            i === actualIdx 
              ? { ...t, text: message.agent_response_correction_event.corrected_agent_response, isPartial: false }
              : t
          );
        });
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

  // Grok conversation hook
  const grokConversation = useGrokConversation({
    onConnect: () => {
      console.log('Connected to Grok voice service');
      setLiveTranscripts([]);
      toast({
        title: 'Connected',
        description: 'Voice assistant is ready (Grok)',
      });
    },
    onDisconnect: () => {
      console.log('Disconnected from Grok voice service');
    },
    onMessage: (message) => {
      console.log('Grok message received:', message);
    },
    onError: (error) => {
      console.error('Grok voice service error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Voice connection error',
        variant: 'destructive',
      });
    },
    onTranscript: (transcript) => {
      console.log('Grok transcript:', transcript);
      if (transcript.role === 'assistant') {
        addTranscript('assistant', transcript.text, true);
      } else {
        addTranscript('user', transcript.text);
      }
    },
    clientTools,
    voice: grokVoice,
    instructions: systemPrompt,
  });

  // Use the selected provider's conversation
  const conversation = voiceProvider === 'elevenlabs' ? elevenlabsConversation : grokConversation;
  const isConnected = conversation.status === 'connected';
  const isConnecting = voiceProvider === 'grok' ? grokConversation.status === 'connecting' : false;
  const connectionError = voiceProvider === 'grok' ? grokConversation.connectionError : null;

  const startConversation = async () => {
    try {
      setLiveTranscripts([]);
      
      if (voiceProvider === 'elevenlabs') {
        const { data, error } = await supabase.functions.invoke('voice-session');
        
        if (error || !data?.signedUrl) {
          throw new Error(error?.message || 'Failed to get session URL');
        }

        console.log('Starting ElevenLabs voice session');
        await elevenlabsConversation.startSession({ 
          signedUrl: data.signedUrl 
        });
      } else {
        console.log('Starting Grok voice session');
        await grokConversation.startSession();
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        title: 'Connection Failed',
        description: error instanceof Error ? error.message : 'Failed to start conversation',
        variant: 'destructive',
      });
    }
  };

  const endConversation = async () => {
    if (voiceProvider === 'elevenlabs') {
      await elevenlabsConversation.endSession();
    } else {
      await grokConversation.endSession();
    }
    
    if (!isAuthenticated && guestMessages.length > 0) {
      setShowRegistrationPrompt(true);
    }
  };

  const retryConnection = async () => {
    if (voiceProvider === 'grok') {
      grokConversation.clearError();
    }
    await startConversation();
  };

  const clearConnectionError = () => {
    if (voiceProvider === 'grok') {
      grokConversation.clearError();
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

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
    grokVoice,
    setGrokVoice,
    systemPrompt,
    setSystemPrompt,
    providerLoading,
    
    // Connection state
    isConnected,
    isConnecting,
    connectionError,
    isSpeaking: conversation.isSpeaking,
    
    // Controls
    isMuted,
    toggleMute,
    volume,
    setVolume,
    
    // Actions
    startConversation,
    endConversation,
    retryConnection,
    clearConnectionError,
    
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
