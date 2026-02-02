import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WidgetConfig {
  id: string;
  user_id: string;
  api_key: string;
  name: string;
  config: {
    systemPrompt?: string;
    enableKB?: boolean;
    kbDocumentIds?: string[];
  };
  allowed_domains: string[];
  is_active: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { action, apiKey, eventType, eventData, sessionId, referrerDomain, message, systemPrompt, enableKB, kbDocumentIds } = body;

    // Validate API key and get widget config
    const { data: widget, error: widgetError } = await supabase
      .from('widget_configs')
      .select('*')
      .eq('api_key', apiKey)
      .eq('is_active', true)
      .single();

    if (widgetError || !widget) {
      return new Response(
        JSON.stringify({ error: 'Invalid or inactive widget API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const widgetConfig = widget as WidgetConfig;

    // Check domain allowlist if configured
    const origin = req.headers.get('origin') || '';
    const originDomain = origin ? new URL(origin).hostname : referrerDomain;
    
    if (widgetConfig.allowed_domains.length > 0 && originDomain) {
      const isAllowed = widgetConfig.allowed_domains.some(domain => 
        originDomain === domain || originDomain.endsWith(`.${domain}`)
      );
      
      if (!isAllowed) {
        return new Response(
          JSON.stringify({ error: 'Domain not allowed' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Handle analytics tracking
    if (action === 'track') {
      await supabase.from('widget_analytics').insert({
        widget_id: widgetConfig.id,
        event_type: eventType,
        event_data: eventData || {},
        referrer_domain: referrerDomain,
        session_id: sessionId,
      });

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle chat message
    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build system prompt
    const finalSystemPrompt = systemPrompt || widgetConfig.config.systemPrompt || 
      `You are a helpful AI assistant for ${widgetConfig.name}. Be friendly, concise, and helpful.`;

    // Optional: Search knowledge base
    let kbContext = '';
    const shouldUseKB = enableKB || widgetConfig.config.enableKB;
    
    if (shouldUseKB) {
      try {
        // Generate embedding for the query
        const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            input: message,
            model: 'text-embedding-3-small',
          }),
        });

        if (embeddingResponse.ok) {
          const embeddingData = await embeddingResponse.json();
          const embedding = embeddingData.data[0].embedding;

          // Search knowledge base
          const { data: chunks } = await supabase.rpc('match_knowledge_chunks', {
            query_embedding: embedding,
            match_threshold: 0.5,
            match_count: 3,
          });

          if (chunks && chunks.length > 0) {
            kbContext = '\n\nRelevant context from knowledge base:\n' + 
              chunks.map((c: { content: string }) => c.content).join('\n---\n');
          }
        }
      } catch (e) {
        console.error('KB search error:', e);
      }
    }

    // Call AI API (prefer Anthropic, fallback to OpenAI)
    let response: string;

    if (anthropicKey) {
      const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          system: finalSystemPrompt + kbContext,
          messages: [{ role: 'user', content: message }],
        }),
      });

      if (!anthropicResponse.ok) {
        throw new Error(`Anthropic API error: ${anthropicResponse.status}`);
      }

      const anthropicData = await anthropicResponse.json();
      response = anthropicData.content[0].text;
    } else if (openaiKey) {
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: finalSystemPrompt + kbContext },
            { role: 'user', content: message },
          ],
          max_tokens: 1024,
        }),
      });

      if (!openaiResponse.ok) {
        throw new Error(`OpenAI API error: ${openaiResponse.status}`);
      }

      const openaiData = await openaiResponse.json();
      response = openaiData.choices[0].message.content;
    } else {
      return new Response(
        JSON.stringify({ error: 'No AI API key configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Track message event
    await supabase.from('widget_analytics').insert({
      widget_id: widgetConfig.id,
      event_type: 'message',
      event_data: { role: 'assistant', tokens: response.length },
      referrer_domain: originDomain,
      session_id: sessionId,
    });

    return new Response(
      JSON.stringify({ response }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Widget chat error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
