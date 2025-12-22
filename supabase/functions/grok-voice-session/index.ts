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

    console.log('Fetching ephemeral token from xAI...');

    // Parse request body for optional configuration
    let config: { voice?: string; language?: string; instructions?: string } = {};
    try {
      const body = await req.json();
      config = body || {};
    } catch {
      // No body provided, use defaults
    }

    // Default system instructions for the AI assistant
    const defaultInstructions = `You are a helpful, friendly AI voice assistant. 

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

    // Fetch ephemeral token from xAI's client_secrets endpoint
    const tokenResponse = await fetch('https://api.x.ai/v1/realtime/client_secrets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${XAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        expires_after: { seconds: 300 }, // 5 minute expiry
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Failed to get ephemeral token:', tokenResponse.status, errorText);
      throw new Error(`Failed to get ephemeral token: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    console.log('xAI response received:', JSON.stringify(tokenData, null, 2));

    // xAI returns { value, expires_at } directly (not nested under client_secret)
    const ephemeralToken = tokenData.value || tokenData.client_secret?.value;
    
    if (!ephemeralToken) {
      console.error('Token structure invalid. Expected value or client_secret.value');
      console.error('Received keys:', Object.keys(tokenData));
      console.error('Full response:', JSON.stringify(tokenData));
      throw new Error(`Invalid token response from xAI - missing token value. Got keys: ${Object.keys(tokenData).join(', ')}`);
    }

    console.log('Ephemeral token validated successfully, expires_at:', tokenData.expires_at);

    // Return configuration with ephemeral token and full WebSocket URL
    const sessionConfig = {
      wsUrl: `wss://api.x.ai/v1/realtime?model=grok-2-public&key=${ephemeralToken}`,
      voice: config.voice || 'Ara',
      language: config.language || null,
      instructions: instructions,
      audioFormat: {
        input: 'pcm16',
        output: 'pcm16',
        sampleRate: 24000,
      },
      vad: {
        enabled: true,
        silenceThresholdMs: 500,
      },
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
