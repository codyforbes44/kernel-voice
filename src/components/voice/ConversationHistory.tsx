import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SkeletonList } from '@/components/ui/skeleton-list';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

interface ConversationHistoryProps {
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onConversationCreated?: () => void;
}

function relativeTimeShort(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const ConversationHistory = ({ 
  currentConversationId, 
  onSelectConversation,
  onConversationCreated 
}: ConversationHistoryProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    loadConversations();

    const channelName = `conversations-${user?.id ?? 'anon'}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        loadConversations();
      })
      .subscribe();

    channelRef.current = channel;
    return () => { channel.unsubscribe(); };
  }, [user?.id]);

  const loadConversations = async () => {
    if (!user) { setLoading(false); return; }
    const { data, error } = await supabase
      .from('conversations')
      .select('id, title, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(20);

    if (error) console.error('Error loading conversations:', error);
    else setConversations(data || []);
    setLoading(false);
  };

  const createNewConversation = async () => {
    if (!user) {
      toast({ title: 'Authentication Required', description: 'Please sign in to create conversations', variant: 'destructive' });
      return;
    }
    const { data, error } = await supabase.from('conversations').insert({ user_id: user.id }).select().single();
    if (error) { toast({ title: 'Error', description: 'Failed to create conversation', variant: 'destructive' }); return; }
    setConversations([data, ...conversations]);
    onSelectConversation(data.id);
    onConversationCreated?.();
  };

  const deleteConversation = async (id: string) => {
    await supabase.from('messages').delete().eq('conversation_id', id);
    const { error } = await supabase.from('conversations').delete().eq('id', id);
    if (error) { toast({ title: 'Error', description: 'Failed to delete conversation', variant: 'destructive' }); return; }
    setConversations(conversations.filter(conv => conv.id !== id));
    if (currentConversationId === id) onSelectConversation(conversations[0]?.id || '');
    toast({ title: 'Deleted', description: 'Conversation deleted successfully' });
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversationToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (conversationToDelete) deleteConversation(conversationToDelete);
    setDeleteDialogOpen(false);
    setConversationToDelete(null);
  };

  return (
    <div className="rounded-xl bg-card border border-border p-3 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold flex items-center gap-2 text-sm">
          <MessageSquare className="h-4 w-4" />
          Conversations
        </h3>
        <Button onClick={createNewConversation} size="sm" variant="outline" className="h-9 w-9 min-h-[36px] min-w-[36px] p-0">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 scrollbar-hide">
        {loading ? (
          <SkeletonList count={4} variant="conversation" />
        ) : (
          <div className="space-y-1">
            {conversations.length === 0 ? (
              <p className="text-center text-muted-foreground text-xs py-4">No conversations yet</p>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`
                    relative group rounded-lg transition-colors
                    ${currentConversationId === conv.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-muted'
                    }
                  `}
                >
                  <button
                    onClick={() => onSelectConversation(conv.id)}
                    className="w-full text-left p-2.5 pr-12 min-h-[48px]"
                  >
                    <p className="font-medium truncate text-sm">{conv.title}</p>
                    <p className="text-xs opacity-70">
                      {relativeTimeShort(conv.updated_at)}
                    </p>
                  </button>
                  <button
                    onClick={(e) => handleDeleteClick(conv.id, e)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-70 md:opacity-0 md:group-hover:opacity-100 transition-opacity p-2 hover:bg-destructive/20 rounded min-w-[40px] min-h-[40px] flex items-center justify-center"
                    aria-label="Delete conversation"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </ScrollArea>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this conversation and all its messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 min-h-[44px]">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ConversationHistory;
