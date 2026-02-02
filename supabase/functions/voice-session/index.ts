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
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    const agentId = Deno.env.get('VITE_ELEVENLABS_AGENT_ID');
    
    if (!ELEVENLABS_API_KEY) {
      throw new Error('Voice service not configured');
    }

    if (!agentId) {
      throw new Error('Voice agent not configured');
    }

    // Parse request body for options
    let connectionType = 'webrtc'; // Default to WebRTC for lower latency
    let language = 'en'; // Default language
    let customPrompt: string | undefined;
    let firstMessage: string | undefined;
    let voiceId: string | undefined;

    if (req.method === 'POST') {
      try {
        const body = await req.json();
        connectionType = body.connectionType || 'webrtc';
        language = body.language || 'en';
        customPrompt = body.customPrompt;
        firstMessage = body.firstMessage;
        voiceId = body.voiceId;
      } catch {
        // Body parsing failed, use defaults
      }
    }

    console.log('Generating voice session:', { 
      connectionType, 
      language, 
      hasCustomPrompt: !!customPrompt,
      hasFirstMessage: !!firstMessage 
    });

    if (connectionType === 'webrtc') {
      // Get conversation token for WebRTC (recommended - lower latency)
      const response = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
        {
          method: 'GET',
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Voice service error:', errorText);
        throw new Error(`Voice service error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Voice session URL generated successfully (WebRTC)');

      // Build overrides for the client
      const overrides: Record<string, unknown> = {};
      
      if (language && language !== 'auto') {
        overrides.language = language;
      }
      
      if (customPrompt || firstMessage) {
        overrides.agent = {
          ...(customPrompt && { prompt: { prompt: customPrompt } }),
          ...(firstMessage && { first_message: firstMessage }),
        };
      }
      
      if (voiceId) {
        overrides.tts = { voiceId };
      }

      return new Response(JSON.stringify({ 
        signedUrl: data.signed_url,
        connectionType: 'webrtc',
        overrides: Object.keys(overrides).length > 0 ? overrides : undefined,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // Legacy: Get signed URL for WebSocket
      const response = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
        {
          method: 'GET',
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Voice service error:', errorText);
        throw new Error(`Voice service error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Voice session URL generated successfully (WebSocket)');

      return new Response(JSON.stringify({ 
        signedUrl: data.signed_url,
        connectionType: 'websocket',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error generating voice session:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
