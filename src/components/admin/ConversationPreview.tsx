import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Bot, 
  Calendar, 
  MessageSquare, 
  Download, 
  Trash2,
  Volume2
} from 'lucide-react';
import { format } from 'date-fns';

interface Message {
  id: string;
  role: string;
  content: string;
  created_at: string;
  audio_url?: string;
}

interface ConversationDetail {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  user_email: string;
}

interface ConversationPreviewProps {
  conversationId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: (conversationId: string) => void;
}

export const ConversationPreview = ({ 
  conversationId, 
  open, 
  onOpenChange,
  onDelete
}: ConversationPreviewProps) => {
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (conversationId && open) {
      fetchConversationDetails();
    }
  }, [conversationId, open]);

  const fetchConversationDetails = async () => {
    if (!conversationId) return;
    
    setLoading(true);
    try {
      // Fetch conversation
      const { data: convData } = await supabase
        .from('conversations')
        .select('*, user_id')
        .eq('id', conversationId)
        .single();

      if (convData) {
        // Fetch user email
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', convData.user_id)
          .single();

        setConversation({
          ...convData,
          user_email: profile?.email || 'Unknown',
        });
      }

      // Fetch messages
      const { data: msgData } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      setMessages(msgData || []);
    } catch (error) {
      console.error('Failed to fetch conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!conversation || messages.length === 0) return;

    const transcript = messages
      .map(msg => `[${msg.role.toUpperCase()}] ${format(new Date(msg.created_at), 'HH:mm:ss')}\n${msg.content}`)
      .join('\n\n---\n\n');

    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-${conversation.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = () => {
    if (conversationId && onDelete) {
      onDelete(conversationId);
      onOpenChange(false);
    }
  };

  if (!conversationId) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-hidden flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Conversation Details
          </SheetTitle>
          <SheetDescription>
            View conversation transcript and metadata
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="space-y-4 mt-6 flex-1">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : conversation ? (
          <div className="flex flex-col flex-1 overflow-hidden mt-6">
            {/* Conversation Info */}
            <div className="space-y-3 pb-4">
              <h3 className="font-semibold">{conversation.title}</h3>
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {conversation.user_email}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(conversation.created_at), 'MMM d, yyyy HH:mm')}
                </span>
                <Badge variant="secondary">
                  {messages.length} messages
                </Badge>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                {onDelete && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleDelete}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            {/* Messages */}
            <ScrollArea className="flex-1 mt-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  No messages in this conversation
                </div>
              ) : (
                <div className="space-y-4 pr-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.role === 'assistant' ? 'flex-row' : 'flex-row-reverse'
                      }`}
                    >
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          message.role === 'assistant'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted'
                        }`}
                      >
                        {message.role === 'assistant' ? (
                          <Bot className="h-4 w-4" />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                      </div>
                      <div
                        className={`flex-1 rounded-lg p-3 ${
                          message.role === 'assistant'
                            ? 'bg-muted/50'
                            : 'bg-primary/5'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium capitalize">
                            {message.role}
                          </span>
                          <div className="flex items-center gap-2">
                            {message.audio_url && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => {
                                  const audio = new Audio(message.audio_url);
                                  audio.play();
                                }}
                              >
                                <Volume2 className="h-3 w-3" />
                              </Button>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(message.created_at), 'HH:mm:ss')}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Conversation not found
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};