import { useState, useEffect, useCallback } from 'react';
import { useConversation } from '@11labs/react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2, VolumeX, LogIn, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import ConversationHistory from '@/components/voice/ConversationHistory';
import DocumentUpload from '@/components/voice/DocumentUpload';
import MessageHistory from '@/components/voice/MessageHistory';
import SEO from '@/components/SEO';
import { Header } from '@/components/layout/Header';
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarContent, 
  SidebarTrigger,
  SidebarInset 
} from '@/components/ui/sidebar';
import RegistrationPromptModal from '@/components/voice/RegistrationPromptModal';
import { useMicrophonePermission } from '@/hooks/useMicrophonePermission';
import MicrophonePermissionRequest from '@/components/voice/MicrophonePermissionRequest';
import { VoiceProviderSelector, useVoiceProviderPreference, type VoiceProvider } from '@/components/voice/VoiceProviderSelector';
import { useGrokConversation } from '@/hooks/useGrokConversation';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const VoiceAssistant = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationTitle, setConversationTitle] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [guestMessages, setGuestMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [showRegistrationPrompt, setShowRegistrationPrompt] = useState(false);
  const { permissionState, requestPermission, isReady } = useMicrophonePermission();
  
  // Voice provider state
  const { provider: voiceProvider, setProvider: setVoiceProvider, grokVoice, setGrokVoice, loading: providerLoading } = useVoiceProviderPreference(isAuthenticated);

  // Authentication check (non-blocking)
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
      
      // Get most recent conversation
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
      toast({
        title: 'Connected',
        description: 'Voice assistant is ready (ElevenLabs)',
      });
    },
    onDisconnect: () => {
      console.log('Disconnected from ElevenLabs voice service');
    },
    onMessage: (message) => {
      console.log('ElevenLabs message received:', message);
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
    clientTools,
    voice: grokVoice,
  });

  // Use the selected provider's conversation
  const conversation = voiceProvider === 'elevenlabs' ? elevenlabsConversation : grokConversation;
  const isConnected = conversation.status === 'connected';

  const startConversation = async () => {
    try {
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
        title: 'Error',
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

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <>
      <SEO 
        title="Voice Assistant"
        description="Start a real-time voice conversation with AI. Natural, fluid interactions with intelligent web search and advanced document analysis capabilities."
        image="/og-assistant.png"
        keywords={["voice conversation", "AI chat", "voice control", "hands-free AI", "conversational AI"]}
      />
      <div className="min-h-screen bg-background">
        <Header />
        <SidebarProvider defaultOpen={isAuthenticated}>
        <div className="flex w-full">
          {isAuthenticated && (
            <Sidebar collapsible="offcanvas">
              <SidebarContent className="p-4 space-y-6">
                <ConversationHistory 
                  currentConversationId={conversationId}
                  onSelectConversation={setConversationId}
                  onConversationCreated={() => {}}
                />
                <DocumentUpload conversationId={conversationId} />
              </SidebarContent>
            </Sidebar>
          )}

          <SidebarInset>
            <div className="container mx-auto px-4 py-8">
              {!isAuthenticated && (
                <div className="mb-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-medium">Guest Mode - Conversations won't be saved</p>
                    <Button 
                      variant="outline"
                      onClick={() => navigate('/auth')}
                    >
                      <LogIn className="h-4 w-4 mr-2" />
                      Sign In to Save
                    </Button>
                  </div>
                </div>
              )}

              {isAuthenticated && conversationTitle && (
                <div className="mb-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Continuing conversation:</p>
                      <p className="font-medium">{conversationTitle}</p>
                    </div>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setConversationId(null);
                        setConversationTitle(null);
                      }}
                    >
                      New Conversation
                    </Button>
                  </div>
                </div>
              )}
              
              {isAuthenticated && (
                <div className="mb-4">
                  <SidebarTrigger />
                </div>
              )}

              <div className="rounded-2xl bg-card border border-border p-8 shadow-2xl mb-6">
                {/* Header with Settings */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex-1" />
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    AI Intelligence
                  </h1>
                  <div className="flex-1 flex justify-end">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={isConnected}>
                          <Settings className="h-5 w-5" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80" align="end">
                        <div className="space-y-4">
                          <h4 className="font-medium">Voice Settings</h4>
                          <VoiceProviderSelector
                            value={voiceProvider}
                            onChange={setVoiceProvider}
                            grokVoice={grokVoice}
                            onGrokVoiceChange={setGrokVoice}
                            disabled={isConnected || providerLoading}
                            isAuthenticated={isAuthenticated}
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {!isReady && (
                  <MicrophonePermissionRequest 
                    permissionState={permissionState}
                    onRequestPermission={requestPermission}
                  />
                )}

                <div className="flex items-center justify-center mb-8">
                  <div className={`
                    relative w-32 h-32 rounded-full flex items-center justify-center
                    ${isConnected 
                      ? 'bg-gradient-to-br from-primary to-primary/50' 
                      : 'bg-gradient-to-br from-muted to-muted-foreground/20'
                    }
                    ${conversation.isSpeaking ? 'animate-pulse' : ''}
                    transition-all duration-300 shadow-lg
                  `}>
                    <Mic className="w-12 h-12 text-primary-foreground" />
                    {isConnected && (
                      <div className="absolute inset-0 rounded-full border-4 border-primary/30 animate-ping" />
                    )}
                  </div>
                </div>

                <div className="text-center mb-8">
                  <p className="text-lg font-medium">
                    {isConnected 
                      ? conversation.isSpeaking 
                        ? '🗣️ Speaking...' 
                        : '👂 Listening...'
                      : 'Ready to connect'
                    }
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Using {voiceProvider === 'elevenlabs' ? 'ElevenLabs' : 'Grok'}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-4">
                  {!isConnected ? (
                    <Button
                      onClick={startConversation}
                      size="lg"
                      className="px-8 py-6 text-lg"
                      disabled={!isReady || providerLoading}
                    >
                      <Mic className="mr-2 h-5 w-5" />
                      Start Conversation
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={endConversation}
                        variant="destructive"
                        size="lg"
                      >
                        Continue Later
                      </Button>
                      
                      <Button
                        onClick={toggleMute}
                        variant="outline"
                        size="lg"
                      >
                        {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                      </Button>

                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => setVolume(volume > 0 ? 0 : 1)}
                          variant="outline"
                          size="lg"
                        >
                          {volume > 0 ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <MessageHistory conversationId={conversationId} />
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
      </div>
      
      <RegistrationPromptModal 
        open={showRegistrationPrompt}
        onOpenChange={setShowRegistrationPrompt}
        messageCount={guestMessages.length / 2}
      />
    </>
  );
};

export default VoiceAssistant;
