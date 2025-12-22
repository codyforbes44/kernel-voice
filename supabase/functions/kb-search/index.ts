import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, limit = 5 } = await req.json();
    
    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[kb-search] Searching knowledge base for:', query);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Search in knowledge base chunks using text search
    // For now, we'll use simple ILIKE matching; for production, consider full-text search or embeddings
    const searchTerms = query.toLowerCase().split(' ').filter((t: string) => t.length > 2);
    
    // Build a simple search query matching any of the terms
    const { data: chunks, error: chunksError } = await supabase
      .from('knowledge_base_chunks')
      .select(`
        id,
        content,
        chunk_index,
        token_count,
        document_id,
        knowledge_base_documents!inner (
          id,
          filename,
          original_filename,
          is_active,
          tags
        )
      `)
      .eq('knowledge_base_documents.is_active', true)
      .limit(50); // Get more to filter

    if (chunksError) {
      console.error('[kb-search] Database error:', chunksError);
      return new Response(
        JSON.stringify({ error: 'Failed to search knowledge base' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!chunks || chunks.length === 0) {
      console.log('[kb-search] No documents found in knowledge base');
      return new Response(
        JSON.stringify({ 
          query,
          results: [],
          message: 'No documents found in the knowledge base'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Score and rank chunks based on query match
    const scoredChunks = chunks.map((chunk: any) => {
      const contentLower = chunk.content.toLowerCase();
      let score = 0;
      
      // Score based on term matches
      for (const term of searchTerms) {
        if (contentLower.includes(term)) {
          // Count occurrences
          const matches = (contentLower.match(new RegExp(term, 'g')) || []).length;
          score += matches * 10;
        }
      }
      
      // Bonus for exact phrase match
      if (contentLower.includes(query.toLowerCase())) {
        score += 50;
      }
      
      return { ...chunk, score };
    })
    .filter((c: any) => c.score > 0)
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, limit);

    console.log(`[kb-search] Found ${scoredChunks.length} relevant chunks`);

    // Format results for voice response
    const results = scoredChunks.map((chunk: any) => ({
      documentName: chunk.knowledge_base_documents?.original_filename || chunk.knowledge_base_documents?.filename,
      documentId: chunk.document_id,
      chunkIndex: chunk.chunk_index,
      content: chunk.content,
      score: chunk.score,
      tags: chunk.knowledge_base_documents?.tags || []
    }));

    // Create a summary for the voice assistant
    let summary = '';
    if (results.length === 0) {
      summary = `I couldn't find any information about "${query}" in the knowledge base.`;
    } else {
      summary = `I found ${results.length} relevant section${results.length > 1 ? 's' : ''} in the knowledge base. `;
      summary += `The most relevant is from "${results[0].documentName}": ${results[0].content.substring(0, 500)}${results[0].content.length > 500 ? '...' : ''}`;
    }

    return new Response(
      JSON.stringify({
        query,
        summary,
        results,
        resultCount: results.length,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[kb-search] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
