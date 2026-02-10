import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check premium access
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const adminClient = createClient(supabaseUrl, supabaseServiceKey);
      const userClient = createClient(supabaseUrl, supabaseServiceKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const { data: { user } } = await userClient.auth.getUser();

      if (user) {
        const { data: feature } = await adminClient
          .from('user_features')
          .select('enabled')
          .eq('user_id', user.id)
          .eq('feature_key', 'elevenlabs_voice')
          .eq('enabled', true)
          .is('revoked_at', null)
          .maybeSingle();

        if (!feature) {
          return new Response(
            JSON.stringify({ error: 'Gemini Live requires premium access' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    const body = await req.json().catch(() => ({}));
    const { voice = 'Puck', systemPrompt, model = 'gemini-2.5-flash-native-audio-preview-12-2025' } = body;

    console.log('[gemini-live-token] Creating session config', { voice, model, hasSystemPrompt: !!systemPrompt });

    // Return the API key and WebSocket config for the client
    // The client will establish the WebSocket connection directly
    const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${GEMINI_API_KEY}`;

    return new Response(
      JSON.stringify({
        wsUrl,
        model,
        voice,
        systemPrompt: systemPrompt || 'You are a helpful voice assistant. Be concise and conversational.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[gemini-live-token] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
