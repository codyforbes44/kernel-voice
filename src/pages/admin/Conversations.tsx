import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import SEO from '@/components/SEO';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface ConversationWithUser {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  user_email: string;
  message_count: number;
}

export default function AdminConversations() {
  const [conversations, setConversations] = useState<ConversationWithUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConvId, setDeleteConvId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    setLoading(true);
    const { data: convData } = await supabase
      .from('conversations')
      .select('id, title, created_at, updated_at, user_id');

    if (convData) {
      const conversationsWithDetails = await Promise.all(
        convData.map(async (conv) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', conv.user_id)
            .single();

          const { count } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('conversation_id', conv.id);

          return {
            ...conv,
            user_email: profile?.email || 'Unknown',
            message_count: count || 0,
          };
        })
      );

      setConversations(conversationsWithDetails);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const handleDeleteConversation = async () => {
    if (!deleteConvId) return;

    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', deleteConvId);

    if (error) {
      toast.error('Failed to delete conversation');
    } else {
      toast.success('Conversation deleted successfully');
      fetchConversations();
    }
    setDeleteConvId(null);
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.user_email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminGuard>
      <AdminLayout>
        <SEO title="Conversation Management" description="Manage all user conversations" />
        
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Conversation Management</h1>
            <p className="text-muted-foreground mt-2">
              View and manage all user conversations
            </p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations by title or user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Conversations Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Messages</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Loading conversations...
                    </TableCell>
                  </TableRow>
                ) : filteredConversations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No conversations found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredConversations.map((conv) => (
                    <TableRow key={conv.id}>
                      <TableCell className="font-medium">{conv.title}</TableCell>
                      <TableCell>{conv.user_email}</TableCell>
                      <TableCell>{conv.message_count}</TableCell>
                      <TableCell>
                        {new Date(conv.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(conv.updated_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConvId(conv.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteConvId} onOpenChange={() => setDeleteConvId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the conversation
                and all associated messages.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConversation} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AdminLayout>
    </AdminGuard>
  );
}
