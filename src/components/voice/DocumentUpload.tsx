import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Upload, File } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DocumentUploadProps {
  conversationId: string | null;
}

const DocumentUpload = ({ conversationId }: DocumentUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to upload documents',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      // Read file content
      const text = await file.text();
      
      // Save document record
      const { data: doc, error: docError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          conversation_id: conversationId,
          filename: file.name,
          file_path: file.name,
          file_size: file.size,
          mime_type: file.type,
        })
        .select()
        .single();

      if (docError) throw docError;

      // Split content into chunks (simple implementation)
      const chunkSize = 1000;
      const chunks = [];
      for (let i = 0; i < text.length; i += chunkSize) {
        chunks.push(text.slice(i, i + chunkSize));
      }

      // Save chunks
      const chunksToInsert = chunks.map((content, index) => ({
        document_id: doc.id,
        content,
        chunk_index: index,
      }));

      const { error: chunksError } = await supabase
        .from('document_chunks')
        .insert(chunksToInsert);

      if (chunksError) throw chunksError;

      toast({
        title: 'Success',
        description: `Document "${file.name}" uploaded successfully`,
      });

    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload document',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-xl bg-card border border-border p-4">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <File className="h-4 w-4" />
        Documents
      </h3>
      
      <label className="cursor-pointer">
        <input
          type="file"
          onChange={handleFileUpload}
          disabled={uploading}
          className="hidden"
          accept=".txt,.md,.pdf,.doc,.docx"
        />
        <Button 
          variant="outline" 
          className="w-full" 
          disabled={uploading}
          asChild
        >
          <span>
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'Uploading...' : 'Upload Document'}
          </span>
        </Button>
      </label>
    </div>
  );
};

export default DocumentUpload;
