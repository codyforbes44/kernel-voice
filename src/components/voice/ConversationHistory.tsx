import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

interface ConversationHistoryProps {
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
}

const ConversationHistory = ({ currentConversationId, onSelectConversation }: ConversationHistoryProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('conversations')
      .select('id, title, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error loading conversations:', error);
      return;
    }

    setConversations(data || []);
  };

  const createNewConversation = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to create conversations',
        variant: 'destructive',
      });
      return;
    }

    const { data, error } = await supabase
      .from('conversations')
      .insert({ user_id: user.id })
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to create conversation',
        variant: 'destructive',
      });
      return;
    }

    setConversations([data, ...conversations]);
    onSelectConversation(data.id);
  };

  return (
    <div className="rounded-xl bg-card border border-border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Conversations
        </h3>
        <Button onClick={createNewConversation} size="sm" variant="outline">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="h-[400px]">
        <div className="space-y-2">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelectConversation(conv.id)}
              className={`
                w-full text-left p-3 rounded-lg transition-colors
                ${currentConversationId === conv.id 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-muted'
                }
              `}
            >
              <p className="font-medium truncate">{conv.title}</p>
              <p className="text-xs opacity-70">
                {new Date(conv.updated_at).toLocaleDateString()}
              </p>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ConversationHistory;
