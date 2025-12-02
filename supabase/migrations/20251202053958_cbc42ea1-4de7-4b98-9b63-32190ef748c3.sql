-- Create knowledge base categories table
CREATE TABLE public.knowledge_base_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT DEFAULT 'folder',
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create knowledge base documents table
CREATE TABLE public.knowledge_base_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_path TEXT,
  mime_type TEXT,
  file_size INTEGER,
  category_id UUID REFERENCES knowledge_base_categories(id) ON DELETE SET NULL,
  content TEXT,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  chunk_count INTEGER DEFAULT 0,
  uploaded_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create knowledge base chunks table
CREATE TABLE public.knowledge_base_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES knowledge_base_documents(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  token_count INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create knowledge base settings table
CREATE TABLE public.knowledge_base_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default settings
INSERT INTO knowledge_base_settings (key, value, description) VALUES
  ('chunk_size', '1000', 'Characters per chunk'),
  ('chunk_overlap', '100', 'Overlap between chunks'),
  ('max_file_size', '10485760', 'Maximum file size in bytes (10MB)'),
  ('allowed_formats', '["txt","md","pdf","doc","docx","csv","json"]', 'Allowed file formats'),
  ('auto_process', 'true', 'Automatically process uploaded documents');

-- Enable RLS
ALTER TABLE public.knowledge_base_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories
CREATE POLICY "Admins can manage categories"
ON public.knowledge_base_categories
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view categories"
ON public.knowledge_base_categories
FOR SELECT
TO authenticated
USING (true);

-- RLS Policies for documents
CREATE POLICY "Admins can manage documents"
ON public.knowledge_base_documents
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view active documents"
ON public.knowledge_base_documents
FOR SELECT
TO authenticated
USING (is_active = true);

-- RLS Policies for chunks
CREATE POLICY "Admins can manage chunks"
ON public.knowledge_base_chunks
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view chunks from active documents"
ON public.knowledge_base_chunks
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM knowledge_base_documents
    WHERE knowledge_base_documents.id = knowledge_base_chunks.document_id
    AND knowledge_base_documents.is_active = true
  )
);

-- RLS Policies for settings
CREATE POLICY "Admins can manage settings"
ON public.knowledge_base_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view settings"
ON public.knowledge_base_settings
FOR SELECT
TO authenticated
USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_knowledge_base_categories_updated_at
  BEFORE UPDATE ON public.knowledge_base_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_base_documents_updated_at
  BEFORE UPDATE ON public.knowledge_base_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_base_settings_updated_at
  BEFORE UPDATE ON public.knowledge_base_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories
INSERT INTO knowledge_base_categories (name, description, icon, color) VALUES
  ('General', 'General knowledge and documentation', 'book', '#6366f1'),
  ('Technical', 'Technical documentation and guides', 'code', '#8b5cf6'),
  ('FAQs', 'Frequently asked questions', 'help-circle', '#ec4899'),
  ('Policies', 'Company policies and procedures', 'shield', '#f59e0b');