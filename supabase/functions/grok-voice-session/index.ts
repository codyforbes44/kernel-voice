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
      console.error('XAI_API_KEY not configured');
      throw new Error('Grok voice service not configured');
    }

    console.log('====== Grok Voice Session Request ======');
    console.log('Timestamp:', new Date().toISOString());

    // Parse request body for optional configuration
    let config: { voice?: string; language?: string; instructions?: string } = {};
    try {
      const body = await req.json();
      config = body || {};
      console.log('Request config - voice:', config.voice, ', has instructions:', !!config.instructions);
    } catch {
      console.log('No body provided, using defaults');
    }

    // Default system instructions for the AI assistant
    const defaultInstructions = `You are Kernel, a helpful, friendly AI voice assistant. 

Your capabilities:
- Answer questions clearly and concisely
- Help with research and information lookup
- Assist with document analysis when documents are provided
- Engage in natural, conversational dialogue

Guidelines:
- Keep responses conversational and appropriate for voice interaction
- Be concise - avoid overly long responses that are hard to follow verbally
- Ask clarifying questions when needed
- Be helpful, honest, and harmless
- If you don't know something, say so rather than making things up`;

    const instructions = config.instructions || defaultInstructions;
    const voice = config.voice || 'Ara';

    console.log('Fetching ephemeral token from xAI...');
    console.log('Endpoint: https://api.x.ai/v1/realtime/client_secrets');

    // Fetch ephemeral token from xAI's client_secrets endpoint
    // Based on xAI docs: use expires_after format for ephemeral tokens
    const tokenResponse = await fetch('https://api.x.ai/v1/realtime/client_secrets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${XAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        expires_after: { seconds: 300 },
      }),
    });

    console.log('Token response status:', tokenResponse.status);

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Failed to get ephemeral token:', tokenResponse.status, errorText);
      throw new Error(`Failed to get ephemeral token: ${tokenResponse.status} - ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    console.log('xAI response keys:', Object.keys(tokenData));

    // OpenAI-compatible response format: { client_secret: { value, expires_at } }
    const ephemeralToken = tokenData.client_secret?.value || tokenData.value;
    const expiresAt = tokenData.client_secret?.expires_at || tokenData.expires_at;
    
    if (!ephemeralToken) {
      console.error('Token structure invalid. Full response:', JSON.stringify(tokenData, null, 2));
      throw new Error(`Invalid token response from xAI - missing token value. Got keys: ${Object.keys(tokenData).join(', ')}`);
    }

    console.log('Ephemeral token obtained successfully');
    console.log('Token expires at:', expiresAt);
    console.log('Token length:', ephemeralToken.length);

    // Return configuration with ephemeral token
    // Client will connect directly to xAI using this token
    const sessionConfig = {
      token: ephemeralToken,
      expiresAt: expiresAt,
      voice: voice,
      language: config.language || null,
      instructions: instructions,
      audio: {
        input: { format: { type: 'audio/pcm', rate: 24000 } },
        output: { format: { type: 'audio/pcm', rate: 24000 } },
      },
    };

    console.log('Session config generated successfully');
    console.log('======================================');

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
