import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SessionTokenRequest {
  voice?: string;
  instructions?: string;
}

interface XAISessionResponse {
  client_secret: {
    value: string;
    expires_at: number;
  };
  modalities?: string[];
  model?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const XAI_API_KEY = Deno.env.get('XAI_API_KEY');
    if (!XAI_API_KEY) {
      console.error('[xai-session-token] XAI_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'xAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    let body: SessionTokenRequest = {};
    try {
      body = await req.json();
    } catch {
      // Empty body is fine, use defaults
    }

    const voice = body.voice || 'Charon';
    const instructions = body.instructions || 'You are a helpful voice assistant. Be concise and conversational.';

    console.log('[xai-session-token] Requesting ephemeral token from xAI...');
    console.log('[xai-session-token] Voice:', voice);
    console.log('[xai-session-token] Has custom instructions:', !!body.instructions);

    // Request ephemeral session token from xAI
    const response = await fetch('https://api.x.ai/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${XAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-2-public',
        voice: voice,
        instructions: instructions,
        modalities: ['text', 'audio'],
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: {
          model: 'whisper-large-v3-turbo',
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[xai-session-token] xAI API error:', response.status, errorText);
      
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: 'Invalid xAI API key' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limited - please try again later' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: `xAI API error: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sessionData: XAISessionResponse = await response.json();
    console.log('[xai-session-token] Session created successfully');
    console.log('[xai-session-token] Token expires at:', new Date(sessionData.client_secret.expires_at * 1000).toISOString());

    // Return the ephemeral token to the client
    return new Response(
      JSON.stringify({
        client_secret: sessionData.client_secret,
        model: sessionData.model || 'grok-2-public',
        modalities: sessionData.modalities || ['text', 'audio'],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[xai-session-token] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
