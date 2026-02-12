import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Trash2, X, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';

export interface SessionStats {
  messageCount: number;
  conversationId: string;
  conversationTitle: string;
  duration: number; // seconds
  timestamp: string;
}

interface ConversationReceiptProps {
  stats: SessionStats;
  onDismiss: () => void;
}

export function ConversationReceipt({ stats, onDismiss }: ConversationReceiptProps) {
  const [deleting, setDeleting] = useState(false);

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const handleDownloadTranscript = async () => {
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('role, content, created_at')
        .eq('conversation_id', stats.conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (!messages || messages.length === 0) {
        toast.info('No messages to download');
        return;
      }

      const lines = messages.map(m => 
        `[${new Date(m.created_at).toLocaleTimeString()}] ${m.role.toUpperCase()}: ${m.content}`
      );
      const text = `Conversation: ${stats.conversationTitle}\nDate: ${new Date(stats.timestamp).toLocaleString()}\nDuration: ${formatDuration(stats.duration)}\n\n${lines.join('\n\n')}`;

      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transcript-${stats.conversationId.slice(0, 8)}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Transcript downloaded');
    } catch {
      toast.error('Failed to download transcript');
    }
  };

  const handleDeleteConversation = async () => {
    setDeleting(true);
    try {
      // Delete messages first, then conversation
      await supabase.from('messages').delete().eq('conversation_id', stats.conversationId);
      await supabase.from('conversations').delete().eq('id', stats.conversationId);
      toast.success('Conversation deleted');
      onDismiss();
    } catch {
      toast.error('Failed to delete conversation');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-primary/5 mt-4">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-primary" />
          Session Saved
        </CardTitle>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDismiss}>
          <X className="h-3 w-3" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Messages</span>
            <p className="font-medium">{stats.messageCount}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Duration</span>
            <p className="font-medium">{formatDuration(stats.duration)}</p>
          </div>
          <div className="col-span-2">
            <span className="text-muted-foreground">Title</span>
            <p className="font-medium truncate">{stats.conversationTitle}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={handleDownloadTranscript}>
            <Download className="h-3 w-3 mr-1" /> Transcript
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 text-destructive hover:text-destructive" 
            onClick={handleDeleteConversation}
            disabled={deleting}
          >
            <Trash2 className="h-3 w-3 mr-1" /> Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
