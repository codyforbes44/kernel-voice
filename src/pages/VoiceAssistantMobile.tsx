import { useState, useEffect } from 'react';
import { useConversation } from '@11labs/react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const VoiceAssistantMobile = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);

  // Authentication check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/auth');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected to ElevenLabs');
      toast({
        title: 'Connected',
        description: 'Voice assistant is ready',
      });
    },
    onDisconnect: () => {
      console.log('Disconnected from ElevenLabs');
    },
    onMessage: (message) => {
      console.log('Message received:', message);
    },
    onError: (error) => {
      console.error('ElevenLabs error:', error);
      toast({
        title: 'Error',
        description: 'Voice connection error',
        variant: 'destructive',
      });
    },
    clientTools: {
      // xAI Grok integration as a client tool
      chat_with_grok: async (parameters: { message: string }) => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          
          if (!user) {
            return JSON.stringify({ error: 'Not authenticated' });
          }

          // Create conversation if needed
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

          // Call xAI through edge function
          const { data, error } = await supabase.functions.invoke('chat-with-grok', {
            body: {
              messages: [{ role: 'user', content: parameters.message }],
              conversationId: currentConvId,
              userId: user.id,
            },
          });

          if (error) throw error;

          return JSON.stringify({ response: data.message });
        } catch (error) {
          console.error('Error calling Grok:', error);
          return JSON.stringify({ error: 'Failed to get response' });
        }
      },

      // Web search tool
      web_search: async (parameters: { query: string }) => {
        try {
          const { data, error } = await supabase.functions.invoke('web-search', {
            body: { query: parameters.query },
          });

          if (error) throw error;

          return JSON.stringify(data);
        } catch (error) {
          console.error('Error in web search:', error);
          return JSON.stringify({ error: 'Search failed' });
        }
      },

      // Document query tool
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
          
          // Use Grok to answer query about document
          const { data: response, error } = await supabase.functions.invoke('chat-with-grok', {
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
    },
  });

  const startConversation = async () => {
    try {
      // Get signed URL from backend
      const { data, error } = await supabase.functions.invoke('elevenlabs-session');
      
      if (error || !data?.signedUrl) {
        throw new Error(error?.message || 'Failed to get session URL');
      }

      console.log('Starting ElevenLabs session with signed URL');
      await conversation.startSession({ 
        signedUrl: data.signedUrl 
      });
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
    await conversation.endSession();
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // Implement actual mute functionality
  };

  return (
    <div className="min-h-screen h-[100dvh] bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center px-4 py-8 safe-area-inset">
      <div className="w-full max-w-md">
        <div className="rounded-3xl bg-card border border-border p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              AI Voice Assistant
            </h1>
            <p className="text-sm text-muted-foreground">
              Powered by xAI Grok & ElevenLabs
            </p>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className={`
              relative w-40 h-40 rounded-full flex items-center justify-center
              ${conversation.status === 'connected' 
                ? 'bg-gradient-to-br from-primary to-primary/50 shadow-glow-primary' 
                : 'bg-gradient-to-br from-muted to-muted-foreground/20'
              }
              ${conversation.isSpeaking ? 'animate-pulse' : ''}
              transition-all duration-300 shadow-xl
            `}>
              <Mic className="w-16 h-16 text-primary-foreground" />
              {conversation.status === 'connected' && (
                <div className="absolute inset-0 rounded-full border-4 border-primary/30 animate-ping" />
              )}
            </div>
          </div>

          {/* Status Text */}
          <div className="text-center mb-8">
            <p className="text-xl font-medium">
              {conversation.status === 'connected' 
                ? conversation.isSpeaking 
                  ? '🗣️ Speaking...' 
                  : '👂 Listening...'
                : 'Ready to connect'
              }
            </p>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {conversation.status !== 'connected' ? (
              <Button
                onClick={startConversation}
                size="lg"
                className="w-full h-14 text-lg font-semibold"
              >
                <Mic className="mr-2 h-6 w-6" />
                Start Conversation
              </Button>
            ) : (
              <>
                <Button
                  onClick={endConversation}
                  variant="destructive"
                  size="lg"
                  className="w-full h-14 text-lg font-semibold"
                >
                  End Call
                </Button>
                
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    onClick={toggleMute}
                    variant="outline"
                    size="lg"
                    className="h-14"
                  >
                    {isMuted ? (
                      <>
                        <MicOff className="h-6 w-6 mr-2" />
                        Muted
                      </>
                    ) : (
                      <>
                        <Mic className="h-6 w-6 mr-2" />
                        Mute
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={() => setVolume(volume > 0 ? 0 : 1)}
                    variant="outline"
                    size="lg"
                    className="h-14"
                  >
                    {volume > 0 ? (
                      <>
                        <Volume2 className="h-6 w-6 mr-2" />
                        Volume
                      </>
                    ) : (
                      <>
                        <VolumeX className="h-6 w-6 mr-2" />
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
  );
};

export default VoiceAssistantMobile;
