import { useState, useEffect } from 'react';
import { useConversation } from '@11labs/react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2, VolumeX, MessageSquare, Upload, LogIn, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import ConversationHistory from '@/components/voice/ConversationHistory';
import DocumentUpload from '@/components/voice/DocumentUpload';
import MessageHistory from '@/components/voice/MessageHistory';
import SEO from '@/components/SEO';
import { Header } from '@/components/layout/Header';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import RegistrationPromptModal from '@/components/voice/RegistrationPromptModal';
import { useMicrophonePermission } from '@/hooks/useMicrophonePermission';
import MicrophonePermissionRequest from '@/components/voice/MicrophonePermissionRequest';
import { VoiceProviderSelector, useVoiceProviderPreference } from '@/components/voice/VoiceProviderSelector';
import { useGrokConversation } from '@/hooks/useGrokConversation';

const VoiceAssistantMobile = () => {
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
        title="AI Intelligence - Premium Conversational AI"
        description="Experience the future of AI interaction with real-time voice conversations, intelligent web search, and advanced document analysis. OLED-optimized interface for immersive mobile experience."
        image="/og-home.png"
        keywords={["AI voice assistant", "voice AI", "real-time conversation", "document analysis", "web search AI", "mobile AI assistant", "OLED optimized"]}
      />
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <div className="flex-1 flex flex-col px-3 pt-2 pb-4">
        
        {/* Guest Banner */}
        {!isAuthenticated && (
          <div className="mb-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Guest Mode</p>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-8"
                onClick={() => navigate('/auth')}
              >
                <LogIn className="h-3 w-3 mr-1" />
                Sign In to Save
              </Button>
            </div>
          </div>
        )}

        {/* Current Conversation Banner */}
        {isAuthenticated && conversationTitle && (
          <div className="mb-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex flex-col gap-2">
              <div>
                <p className="text-xs text-muted-foreground">Continuing:</p>
                <p className="text-sm font-medium">{conversationTitle}</p>
              </div>
              <Button 
                size="sm"
                variant="outline"
                className="h-8"
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
        
        {/* Top Action Buttons */}
        <div className="flex justify-end gap-2 mb-2">
          {/* Settings Sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-10 w-10" disabled={isConnected}>
                <Settings className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto">
              <div className="pt-4 pb-8 space-y-4">
                <h4 className="font-medium text-lg">Voice Settings</h4>
                <VoiceProviderSelector
                  value={voiceProvider}
                  onChange={setVoiceProvider}
                  grokVoice={grokVoice}
                  onGrokVoiceChange={setGrokVoice}
                  disabled={isConnected || providerLoading}
                  isAuthenticated={isAuthenticated}
                />
              </div>
            </SheetContent>
          </Sheet>

          {isAuthenticated && (
            <>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="h-10 w-10">
                    <MessageSquare className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[85vw] flex flex-col scrollbar-hide">
                  <div className="flex-1 space-y-4 overflow-y-auto scrollbar-hide pt-12">
                    <ConversationHistory 
                      currentConversationId={conversationId}
                      onSelectConversation={setConversationId}
                      onConversationCreated={() => {}}
                    />
                    <MessageHistory conversationId={conversationId} />
                  </div>
                </SheetContent>
              </Sheet>

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="h-10 w-10">
                    <Upload className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[85vw] scrollbar-hide">
                  <div className="pt-12">
                    <DocumentUpload conversationId={conversationId} />
                  </div>
                </SheetContent>
              </Sheet>
            </>
          )}
        </div>

        {/* AI Voice Assistant - Main Card */}
        <div className="rounded-2xl bg-card border border-border p-4 shadow-xl">
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              AI Intelligence
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Using {voiceProvider === 'elevenlabs' ? 'ElevenLabs' : 'Grok'}
            </p>
          </div>

          {/* Microphone Permission Request */}
          {!isReady && (
            <MicrophonePermissionRequest 
              permissionState={permissionState}
              onRequestPermission={requestPermission}
            />
          )}

          {/* Status Indicator */}
          <div className="flex items-center justify-center mb-4">
            <div className={`
              relative w-28 h-28 rounded-full flex items-center justify-center
              ${isConnected 
                ? 'bg-gradient-to-br from-primary to-primary/50 shadow-glow-primary' 
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

          {/* Status Text */}
          <div className="text-center mb-4">
            <p className="text-lg font-medium">
              {isConnected 
                ? conversation.isSpeaking 
                  ? '🗣️ Speaking...' 
                  : '👂 Listening...'
                : 'Ready to connect'
              }
            </p>
          </div>

          {/* Controls */}
          <div className="space-y-2">
            {!isConnected ? (
              <Button
                onClick={startConversation}
                size="lg"
                className="w-full h-12 text-base font-semibold"
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
                  className="w-full h-12 text-base font-semibold"
                >
                  Continue Later
                </Button>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={toggleMute}
                    variant="outline"
                    size="lg"
                    className="h-12"
                  >
                    {isMuted ? (
                      <>
                        <MicOff className="h-5 w-5 mr-2" />
                        Muted
                      </>
                    ) : (
                      <>
                        <Mic className="h-5 w-5 mr-2" />
                        Mute
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={() => setVolume(volume > 0 ? 0 : 1)}
                    variant="outline"
                    size="lg"
                    className="h-12"
                  >
                    {volume > 0 ? (
                      <>
                        <Volume2 className="h-5 w-5 mr-2" />
                        Volume
                      </>
                    ) : (
                      <>
                        <VolumeX className="h-5 w-5 mr-2" />
                        Muted
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      </div>
      
      <RegistrationPromptModal 
        open={showRegistrationPrompt}
        onOpenChange={setShowRegistrationPrompt}
        messageCount={guestMessages.length / 2}
      />
    </>
  );
};

export default VoiceAssistantMobile;
