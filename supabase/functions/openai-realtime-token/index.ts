const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    const { voice, instructions, temperature, vadThreshold, silenceDuration } = await req.json();
    
    console.log('Creating OpenAI Realtime session...');
    console.log('Voice:', voice || 'alloy');
    console.log('Temperature:', temperature ?? 0.8);
    console.log('VAD Threshold:', vadThreshold ?? 0.5);
    console.log('Silence Duration:', silenceDuration ?? 500);
    console.log('Has instructions:', !!instructions);

    // Request an ephemeral token from OpenAI
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2025-06-03",
        voice: voice || "alloy",
        instructions: instructions || "You are a helpful voice assistant. Be concise and conversational.",
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        temperature: temperature ?? 0.8,
        turn_detection: {
          type: "server_vad",
          threshold: vadThreshold ?? 0.6,
          prefix_padding_ms: 500,
          silence_duration_ms: silenceDuration ?? 600,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Session created successfully");
    console.log("Session ID:", data.id);
    console.log("Expires at:", data.client_secret?.expires_at);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error creating OpenAI realtime session:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
