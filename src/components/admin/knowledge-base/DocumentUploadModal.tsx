import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, File } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface DocumentUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const DocumentUploadModal = ({ open, onOpenChange, onSuccess }: DocumentUploadModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);

    // Read text content if it's a text file
    if (selectedFile.type.startsWith('text/') || selectedFile.name.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setContent(e.target?.result as string);
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file && !content) {
      toast({ title: 'Error', description: 'Please select a file or enter content', variant: 'destructive' });
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const docData = {
        filename: file?.name || 'manual-entry.txt',
        original_filename: file?.name || 'Manual Entry',
        mime_type: file?.type || 'text/plain',
        file_size: file?.size || content.length,
        content: content,
        status: 'ready',
        uploaded_by: user.id,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      };

      const { data, error } = await supabase
        .from('knowledge_base_documents')
        .insert([docData])
        .select()
        .single();

      if (error) throw error;

      // Create chunks
      const chunkSize = 1000;
      const chunks = [];
      for (let i = 0; i < content.length; i += chunkSize) {
        chunks.push({
          document_id: data.id,
          content: content.slice(i, i + chunkSize),
          chunk_index: Math.floor(i / chunkSize),
          token_count: Math.ceil(content.slice(i, i + chunkSize).length / 4),
        });
      }

      if (chunks.length > 0) {
        const { error: chunksError } = await supabase
          .from('knowledge_base_chunks')
          .insert(chunks);

        if (chunksError) throw chunksError;

        // Update chunk count
        await supabase
          .from('knowledge_base_documents')
          .update({ chunk_count: chunks.length })
          .eq('id', data.id);
      }

      toast({ title: 'Success', description: 'Document uploaded and processed' });
      onOpenChange(false);
      onSuccess();
      resetForm();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({ title: 'Error', description: 'Failed to upload document', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setContent('');
    setTags('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Knowledge Base Document</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">File Upload</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                accept=".txt,.md,.pdf,.doc,.docx,.csv,.json"
              />
              {file && <File className="h-5 w-5 text-primary" />}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Or paste content directly..."
              rows={10}
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., tutorial, api, reference"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={uploading} className="gap-2">
            <Upload className="h-4 w-4" />
            {uploading ? 'Uploading...' : 'Upload & Process'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
