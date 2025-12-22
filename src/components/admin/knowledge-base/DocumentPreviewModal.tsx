import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { FileText, Database, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';

interface Document {
  id: string;
  filename: string;
  original_filename: string;
  status: string;
  chunk_count: number;
  file_size: number;
  content: string | null;
  tags: string[];
  created_at: string;
}

interface DocumentPreviewModalProps {
  document: Document | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DocumentPreviewModal = ({ document, open, onOpenChange }: DocumentPreviewModalProps) => {
  const [chunks, setChunks] = useState<any[]>([]);

  useEffect(() => {
    if (document) {
      fetchChunks();
    }
  }, [document]);

  const fetchChunks = async () => {
    if (!document) return;

    try {
      const { data } = await supabase
        .from('knowledge_base_chunks')
        .select('*')
        .eq('document_id', document.id)
        .order('chunk_index');

      setChunks(data || []);
    } catch (error) {
      console.error('Error fetching chunks:', error);
    }
  };

  if (!document) return null;

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {document.filename}
          </DialogTitle>
          <DialogDescription>View document details and content preview</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <span className="font-medium">Chunks:</span> {document.chunk_count}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <span className="font-medium">Size:</span> {formatBytes(document.file_size)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <span className="font-medium">Created:</span> {format(new Date(document.created_at), 'MMM d, yyyy')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">
                <span className="font-medium">Status:</span>{' '}
                <Badge variant={document.status === 'ready' ? 'default' : 'outline'}>
                  {document.status}
                </Badge>
              </span>
            </div>
          </div>

          {/* Tags */}
          {document.tags && document.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">Tags:</span>
              {document.tags.map((tag, idx) => (
                <Badge key={idx} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <Separator />

          {/* Content Preview */}
          <div className="space-y-2">
            <h3 className="font-medium">Content Preview</h3>
            <ScrollArea className="h-64 w-full rounded-md border p-4 bg-background">
              <pre className="text-sm whitespace-pre-wrap">
                {document.content?.substring(0, 1000)}
                {document.content && document.content.length > 1000 && '...'}
              </pre>
            </ScrollArea>
          </div>

          {/* Chunks List */}
          {chunks.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">Chunks ({chunks.length})</h3>
              <ScrollArea className="h-40 w-full rounded-md border">
                <div className="p-4 space-y-2">
                  {chunks.map((chunk, idx) => (
                    <div key={chunk.id} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">Chunk #{chunk.chunk_index}</span>
                      <Badge variant="outline">{chunk.token_count || 'N/A'} tokens</Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
