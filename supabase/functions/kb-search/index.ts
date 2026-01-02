import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EMBEDDING_DIM = 768;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, limit = 5, threshold = 0.5 } = await req.json();
    
    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[kb-search] Semantic search for:', query);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    // Check if we have embeddings available
    const { count: embeddingCount } = await supabase
      .from('knowledge_base_chunks')
      .select('*', { count: 'exact', head: true })
      .not('embedding', 'is', null);

    const hasEmbeddings = (embeddingCount ?? 0) > 0 && OPENAI_API_KEY;

    if (hasEmbeddings) {
      // Generate embedding for the query
      console.log('[kb-search] Using semantic search with embeddings');
      
      const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: query,
          dimensions: EMBEDDING_DIM,
        }),
      });

      if (!embeddingResponse.ok) {
        console.error('[kb-search] Failed to generate query embedding, falling back to keyword search');
        return performKeywordSearch(supabase, query, limit);
      }

      const embeddingData = await embeddingResponse.json();
      const queryEmbedding = embeddingData.data[0].embedding;

      // Use the vector similarity function
      const { data: matches, error: matchError } = await supabase.rpc('match_knowledge_chunks', {
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_count: limit,
      });

      if (matchError) {
        console.error('[kb-search] Semantic search error:', matchError);
        return performKeywordSearch(supabase, query, limit);
      }

      if (!matches || matches.length === 0) {
        console.log('[kb-search] No semantic matches, trying keyword search');
        return performKeywordSearch(supabase, query, limit);
      }

      // Get document names for matches
      const documentIds = [...new Set(matches.map((m: any) => m.document_id))];
      const { data: documents } = await supabase
        .from('knowledge_base_documents')
        .select('id, filename, original_filename, tags')
        .in('id', documentIds);

      const docMap = new Map(documents?.map(d => [d.id, d]) || []);

      const results = matches.map((match: any) => {
        const doc = docMap.get(match.document_id);
        return {
          documentName: doc?.original_filename || doc?.filename || 'Unknown',
          documentId: match.document_id,
          chunkIndex: match.chunk_index,
          content: match.content,
          score: Math.round(match.similarity * 100),
          tags: doc?.tags || [],
          searchType: 'semantic',
        };
      });

      console.log(`[kb-search] Found ${results.length} semantic matches`);

      // Create summary for voice assistant
      let summary = '';
      if (results.length === 0) {
        summary = `I couldn't find any information about "${query}" in the knowledge base.`;
      } else {
        summary = `I found ${results.length} relevant section${results.length > 1 ? 's' : ''} in the knowledge base. `;
        summary += `The most relevant (${results[0].score}% match) is from "${results[0].documentName}": ${results[0].content.substring(0, 500)}${results[0].content.length > 500 ? '...' : ''}`;
      }

      return new Response(
        JSON.stringify({
          query,
          summary,
          results,
          resultCount: results.length,
          searchType: 'semantic',
          timestamp: new Date().toISOString(),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fallback to keyword search
    console.log('[kb-search] No embeddings available, using keyword search');
    return performKeywordSearch(supabase, query, limit);

  } catch (error) {
    console.error('[kb-search] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Fallback keyword search when embeddings aren't available
async function performKeywordSearch(supabase: any, query: string, limit: number) {
  console.log('[kb-search] Performing keyword search');
  
  const searchTerms = query.toLowerCase().split(' ').filter((t: string) => t.length > 2);
  
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
    .limit(50);

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
        summary: 'No documents found in the knowledge base.',
        results: [],
        resultCount: 0,
        searchType: 'keyword',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Score and rank chunks
  const scoredChunks = chunks.map((chunk: any) => {
    const contentLower = chunk.content.toLowerCase();
    let score = 0;
    
    for (const term of searchTerms) {
      if (contentLower.includes(term)) {
        const matches = (contentLower.match(new RegExp(term, 'g')) || []).length;
        score += matches * 10;
      }
    }
    
    if (contentLower.includes(query.toLowerCase())) {
      score += 50;
    }
    
    return { ...chunk, score };
  })
  .filter((c: any) => c.score > 0)
  .sort((a: any, b: any) => b.score - a.score)
  .slice(0, limit);

  console.log(`[kb-search] Found ${scoredChunks.length} keyword matches`);

  const results = scoredChunks.map((chunk: any) => ({
    documentName: chunk.knowledge_base_documents?.original_filename || chunk.knowledge_base_documents?.filename,
    documentId: chunk.document_id,
    chunkIndex: chunk.chunk_index,
    content: chunk.content,
    score: chunk.score,
    tags: chunk.knowledge_base_documents?.tags || [],
    searchType: 'keyword',
  }));

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
      searchType: 'keyword',
      timestamp: new Date().toISOString(),
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
