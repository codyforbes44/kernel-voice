import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare } from 'lucide-react';
import { SkeletonList } from '@/components/ui/skeleton-list';
import { EmptyState } from '@/components/ui/empty-state';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface MessageHistoryProps {
  conversationId: string | null;
}

const MessageHistory = ({ conversationId }: MessageHistoryProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversationId) {
      loadMessages();
      subscribeToMessages();
    } else {
      setMessages([]);
    }

    return () => {
      supabase.channel('messages').unsubscribe();
    };
  }, [conversationId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadMessages = async () => {
    if (!conversationId) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
    } else {
      setMessages((data || []) as Message[]);
    }
    setLoading(false);
  };

  const subscribeToMessages = () => {
    if (!conversationId) return;

    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  };

  if (!conversationId) {
    return (
      <div className="rounded-xl bg-card border border-border">
        <EmptyState
          icon={MessageSquare}
          title="No conversation selected"
          description="Select a conversation to view message history"
          className="py-8"
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-xl bg-card border border-border p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
          <MessageSquare className="h-4 w-4" />
          Conversation History
        </h3>
        <SkeletonList count={4} variant="message" />
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-card border border-border p-3 flex flex-col h-full">
      <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
        <MessageSquare className="h-4 w-4" />
        Conversation History
      </h3>
      
      <ScrollArea className="flex-1 pr-2 scrollbar-hide" ref={scrollRef}>
        <div className="space-y-2">
          {messages.length === 0 ? (
            <p className="text-center text-muted-foreground text-xs py-4">No messages yet</p>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`
                    max-w-[80%] rounded-lg p-2
                    ${message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                    }
                  `}
                >
                  <p className="text-xs whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  <p className="text-[10px] opacity-60 mt-1">
                    {new Date(message.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default MessageHistory;
