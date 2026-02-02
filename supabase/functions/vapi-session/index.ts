import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const VAPI_API_KEY = Deno.env.get('VAPI_API_KEY');
    if (!VAPI_API_KEY) {
      console.error('[vapi-session] VAPI_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'VAPI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate JWT for authenticated users (optional - allows guest access too)
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    
    if (authHeader?.startsWith('Bearer ')) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authHeader } } }
      );
      
      const token = authHeader.replace('Bearer ', '');
      const { data, error } = await supabase.auth.getClaims(token);
      
      if (!error && data?.claims) {
        userId = data.claims.sub as string;
        console.log('[vapi-session] Authenticated user:', userId);
        
        // Check if user has vapi_voice feature
        const { data: featureData } = await supabase
          .from('user_features')
          .select('enabled')
          .eq('user_id', userId)
          .eq('feature_key', 'vapi_voice')
          .maybeSingle();
        
        const hasVapiFeature = featureData?.enabled === true;
        
        // Also check if user is subscribed (Pro tier gets all premium providers)
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .maybeSingle();
        
        // For now, allow Pro subscribers access (they have elevenlabs_voice feature)
        const { data: elevenLabsFeature } = await supabase
          .from('user_features')
          .select('enabled')
          .eq('user_id', userId)
          .eq('feature_key', 'elevenlabs_voice')
          .maybeSingle();
        
        const isProSubscriber = elevenLabsFeature?.enabled === true;
        
        if (!hasVapiFeature && !isProSubscriber) {
          console.log('[vapi-session] User does not have VAPI access');
          return new Response(
            JSON.stringify({ error: 'VAPI access requires Kernel Pro subscription' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    const body = await req.json().catch(() => ({}));
    const { assistantId, customPrompt, firstMessage } = body;

    console.log('[vapi-session] Creating VAPI session', {
      hasAssistantId: !!assistantId,
      hasCustomPrompt: !!customPrompt,
      hasFirstMessage: !!firstMessage,
    });

    // Return the API key and configuration for client-side VAPI SDK
    // VAPI uses client-side SDK that needs the public key
    const response = {
      apiKey: VAPI_API_KEY,
      assistantId: assistantId || null,
      config: {
        customPrompt: customPrompt || null,
        firstMessage: firstMessage || 'Hello! How can I help you today?',
      },
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[vapi-session] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
