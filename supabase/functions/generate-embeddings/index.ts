import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EMBEDDING_DIM = 768;
const EMBEDDING_MODEL = 'text-embedding-004';

async function geminiBatchEmbed(apiKey: string, inputs: string[]): Promise<number[][]> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:batchEmbedContents?key=${apiKey}`;
  const body = {
    requests: inputs.map((text) => ({
      model: `models/${EMBEDDING_MODEL}`,
      content: { parts: [{ text }] },
    })),
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error('[generate-embeddings] Gemini error:', res.status, err);
    throw new Error(`Gemini embeddings error: ${res.status}`);
  }
  const data = await res.json();
  return (data.embeddings ?? []).map((e: { values: number[] }) => e.values);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, texts, documentId, chunkId } = await req.json();

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const inputTexts: string[] = texts || (text ? [text] : []);

    if (inputTexts.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No text provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    console.log(`[generate-embeddings] Generating ${inputTexts.length} embedding(s) via Gemini`);

    const embeddings = await geminiBatchEmbed(GEMINI_API_KEY, inputTexts);

    if (chunkId) {
      const { error: updateError } = await supabase
        .from('knowledge_base_chunks')
        .update({ embedding: embeddings[0] })
        .eq('id', chunkId);
      if (updateError) {
        console.error('[generate-embeddings] Update error:', updateError);
        throw new Error('Failed to update chunk embedding');
      }
      console.log(`[generate-embeddings] Updated chunk ${chunkId}`);
    }

    if (documentId && !chunkId) {
      const { data: chunks, error: fetchError } = await supabase
        .from('knowledge_base_chunks')
        .select('id, content')
        .eq('document_id', documentId)
        .order('chunk_index', { ascending: true });

      if (fetchError) throw new Error('Failed to fetch document chunks');

      if (chunks && chunks.length > 0) {
        console.log(`[generate-embeddings] Processing ${chunks.length} chunks for document ${documentId}`);
        const chunkEmbeddings = await geminiBatchEmbed(GEMINI_API_KEY, chunks.map((c) => c.content));
        for (let i = 0; i < chunks.length; i++) {
          const { error: chunkUpdateError } = await supabase
            .from('knowledge_base_chunks')
            .update({ embedding: chunkEmbeddings[i] })
            .eq('id', chunks[i].id);
          if (chunkUpdateError) {
            console.error(`[generate-embeddings] Failed to update chunk ${chunks[i].id}:`, chunkUpdateError);
          }
        }
        console.log(`[generate-embeddings] Updated ${chunks.length} chunks`);
      }
    }

    return new Response(
      JSON.stringify({ embeddings, count: embeddings.length, dimensions: EMBEDDING_DIM }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('[generate-embeddings] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
