-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to knowledge_base_chunks
ALTER TABLE public.knowledge_base_chunks 
ADD COLUMN IF NOT EXISTS embedding vector(768);

-- Create index for fast similarity search
CREATE INDEX IF NOT EXISTS knowledge_base_chunks_embedding_idx 
ON public.knowledge_base_chunks 
USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- Create function for semantic search
CREATE OR REPLACE FUNCTION public.match_knowledge_chunks(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  content text,
  chunk_index int,
  token_count int,
  metadata jsonb,
  similarity float
)
LANGUAGE sql STABLE
SET search_path = public
AS $$
  SELECT
    kbc.id,
    kbc.document_id,
    kbc.content,
    kbc.chunk_index,
    kbc.token_count,
    kbc.metadata,
    1 - (kbc.embedding <=> query_embedding) as similarity
  FROM knowledge_base_chunks kbc
  JOIN knowledge_base_documents kbd ON kbd.id = kbc.document_id
  WHERE kbd.is_active = true
    AND kbc.embedding IS NOT NULL
    AND 1 - (kbc.embedding <=> query_embedding) > match_threshold
  ORDER BY kbc.embedding <=> query_embedding
  LIMIT match_count;
$$;