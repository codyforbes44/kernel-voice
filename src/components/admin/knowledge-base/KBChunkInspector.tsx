import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Search, Eye, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Chunk {
  id: string;
  document_id: string;
  content: string;
  chunk_index: number;
  token_count: number | null;
  created_at: string;
}

export const KBChunkInspector = () => {
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChunk, setSelectedChunk] = useState<Chunk | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChunks();
  }, []);

  const fetchChunks = async () => {
    try {
      const { data, error } = await supabase
        .from('knowledge_base_chunks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setChunks(data || []);
    } catch (error) {
      console.error('Error fetching chunks:', error);
      toast({ title: 'Error', description: 'Failed to load chunks', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const deleteChunk = async (id: string) => {
    if (!confirm('Are you sure you want to delete this chunk?')) return;

    try {
      const { error } = await supabase
        .from('knowledge_base_chunks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Success', description: 'Chunk deleted' });
      fetchChunks();
    } catch (error) {
      console.error('Error deleting chunk:', error);
      toast({ title: 'Error', description: 'Failed to delete chunk', variant: 'destructive' });
    }
  };

  const searchChunks = async () => {
    if (!searchQuery.trim()) {
      fetchChunks();
      return;
    }

    try {
      const { data, error } = await supabase
        .from('knowledge_base_chunks')
        .select('*')
        .ilike('content', `%${searchQuery}%`)
        .limit(100);

      if (error) throw error;
      setChunks(data || []);
    } catch (error) {
      console.error('Error searching chunks:', error);
      toast({ title: 'Error', description: 'Search failed', variant: 'destructive' });
    }
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  };

  return (
    <>
      <Card className="border-border/40 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle>Chunk Inspector</CardTitle>
          <div className="flex items-center gap-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search chunk content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchChunks()}
                className="pl-9"
              />
            </div>
            <Button onClick={searchChunks}>Search</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Content Preview</TableHead>
                <TableHead>Index</TableHead>
                <TableHead>Tokens</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chunks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    {loading ? 'Loading...' : 'No chunks found'}
                  </TableCell>
                </TableRow>
              ) : (
                chunks.map((chunk) => (
                  <TableRow key={chunk.id}>
                    <TableCell className="max-w-md">
                      <p className="text-sm">{truncateContent(chunk.content)}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">#{chunk.chunk_index}</Badge>
                    </TableCell>
                    <TableCell>{chunk.token_count || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedChunk(chunk)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteChunk(chunk.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedChunk} onOpenChange={(open) => !open && setSelectedChunk(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chunk Details</DialogTitle>
            <DialogDescription>View chunk content and metadata</DialogDescription>
          </DialogHeader>
          {selectedChunk && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Content</h4>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{selectedChunk.content}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-1">Index</h4>
                  <Badge variant="outline">#{selectedChunk.chunk_index}</Badge>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Token Count</h4>
                  <Badge variant="outline">{selectedChunk.token_count || 'N/A'}</Badge>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
