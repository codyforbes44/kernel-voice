import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    
    if (!query) {
      throw new Error('Search query is required');
    }

    console.log('Performing web search for:', query);

    // Using a simple web search approach
    // In production, you might want to integrate with a proper search API
    const searchResponse = await fetch(
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
    );

    if (!searchResponse.ok) {
      throw new Error('Search failed');
    }

    // For now, return a structured response
    // In production, parse the HTML or use a proper search API
    const results = {
      query,
      results: [
        {
          title: 'Search results',
          snippet: `Performed search for: ${query}`,
          url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`
        }
      ],
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in web-search:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
