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
    const XAI_API_KEY = Deno.env.get('XAI_API_KEY');
    
    if (!XAI_API_KEY) {
      throw new Error('Grok voice service not configured');
    }

    console.log('Generating Grok voice session config');

    // Parse request body for optional configuration
    let config: { voice?: string; language?: string } = {};
    try {
      const body = await req.json();
      config = body || {};
    } catch {
      // No body provided, use defaults
    }

    // Return configuration for Grok WebSocket connection
    const sessionConfig = {
      apiKey: XAI_API_KEY,
      wsUrl: 'wss://api.x.ai/v1/realtime',
      voice: config.voice || 'Ara', // Default voice: Ara (warm, friendly)
      language: config.language || null, // Auto-detect by default
      audioFormat: {
        input: 'pcm16',
        output: 'pcm16',
        sampleRate: 24000,
      },
      vad: {
        enabled: true,
        silenceThresholdMs: 500,
      },
      tools: [
        {
          type: 'web_search',
          enabled: true,
        },
        {
          type: 'x_search', 
          enabled: true,
        },
      ],
    };

    console.log('Grok voice session config generated successfully');

    return new Response(JSON.stringify(sessionConfig), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating Grok voice session:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
