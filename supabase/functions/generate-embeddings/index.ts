import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Embedding dimension for the model we're using
const EMBEDDING_DIM = 768;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, texts, documentId, chunkId } = await req.json();
    
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle single text or batch
    const inputTexts = texts || (text ? [text] : []);
    
    if (inputTexts.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No text provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[generate-embeddings] Generating embeddings for ${inputTexts.length} text(s)`);

    // Call OpenAI embeddings API
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: inputTexts,
        dimensions: EMBEDDING_DIM,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[generate-embeddings] OpenAI error:', error);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const embeddings = data.data.map((item: { embedding: number[] }) => item.embedding);

    console.log(`[generate-embeddings] Generated ${embeddings.length} embeddings`);

    // If chunkId provided, update the chunk directly
    if (chunkId) {
      const { error: updateError } = await supabase
        .from('knowledge_base_chunks')
        .update({ embedding: embeddings[0] })
        .eq('id', chunkId);

      if (updateError) {
        console.error('[generate-embeddings] Update error:', updateError);
        throw new Error('Failed to update chunk embedding');
      }

      console.log(`[generate-embeddings] Updated chunk ${chunkId} with embedding`);
    }

    // If documentId provided, update all chunks for that document
    if (documentId && !chunkId) {
      const { data: chunks, error: fetchError } = await supabase
        .from('knowledge_base_chunks')
        .select('id, content')
        .eq('document_id', documentId)
        .order('chunk_index', { ascending: true });

      if (fetchError) {
        throw new Error('Failed to fetch document chunks');
      }

      if (chunks && chunks.length > 0) {
        console.log(`[generate-embeddings] Processing ${chunks.length} chunks for document ${documentId}`);
        
        // Generate embeddings for all chunks
        const chunkTexts = chunks.map(c => c.content);
        const chunkResponse = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'text-embedding-3-small',
            input: chunkTexts,
            dimensions: EMBEDDING_DIM,
          }),
        });

        if (!chunkResponse.ok) {
          throw new Error('Failed to generate chunk embeddings');
        }

        const chunkData = await chunkResponse.json();
        const chunkEmbeddings = chunkData.data.map((item: { embedding: number[] }) => item.embedding);

        // Update each chunk with its embedding
        for (let i = 0; i < chunks.length; i++) {
          const { error: chunkUpdateError } = await supabase
            .from('knowledge_base_chunks')
            .update({ embedding: chunkEmbeddings[i] })
            .eq('id', chunks[i].id);

          if (chunkUpdateError) {
            console.error(`[generate-embeddings] Failed to update chunk ${chunks[i].id}:`, chunkUpdateError);
          }
        }

        console.log(`[generate-embeddings] Updated ${chunks.length} chunks with embeddings`);
      }
    }

    return new Response(
      JSON.stringify({ 
        embeddings,
        count: embeddings.length,
        dimensions: EMBEDDING_DIM,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[generate-embeddings] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
