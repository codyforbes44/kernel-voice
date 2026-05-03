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
    rateLimit?: {
      messagesPerMinute?: number;
      messagesPerHour?: number;
    };
  };
  allowed_domains: string[];
  is_active: boolean;
}

// Rate limiting configuration
const DEFAULT_RATE_LIMITS = {
  messagesPerMinute: 10,
  messagesPerHour: 100,
};

// In-memory rate limit tracking
// Key format: `${widgetId}:${sessionId || ip}`
const rateLimitStore = new Map<string, { timestamps: number[] }>();

// Cleanup old entries periodically (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupRateLimitStore() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  
  lastCleanup = now;
  const oneHourAgo = now - 60 * 60 * 1000;
  
  for (const [key, data] of rateLimitStore.entries()) {
    // Remove timestamps older than 1 hour
    data.timestamps = data.timestamps.filter(ts => ts > oneHourAgo);
    // Remove entry if no recent timestamps
    if (data.timestamps.length === 0) {
      rateLimitStore.delete(key);
    }
  }
}

function checkRateLimit(
  widgetId: string,
  identifier: string,
  limits: { messagesPerMinute: number; messagesPerHour: number }
): { allowed: boolean; retryAfter?: number; reason?: string } {
  const key = `${widgetId}:${identifier}`;
  const now = Date.now();
  const oneMinuteAgo = now - 60 * 1000;
  const oneHourAgo = now - 60 * 60 * 1000;

  // Get or create rate limit entry
  let entry = rateLimitStore.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    rateLimitStore.set(key, entry);
  }

  // Clean old timestamps
  entry.timestamps = entry.timestamps.filter(ts => ts > oneHourAgo);

  // Count requests in last minute and hour
  const requestsLastMinute = entry.timestamps.filter(ts => ts > oneMinuteAgo).length;
  const requestsLastHour = entry.timestamps.length;

  // Check minute limit
  if (requestsLastMinute >= limits.messagesPerMinute) {
    const oldestInMinute = entry.timestamps.filter(ts => ts > oneMinuteAgo)[0];
    const retryAfter = Math.ceil((oldestInMinute + 60 * 1000 - now) / 1000);
    return {
      allowed: false,
      retryAfter,
      reason: `Rate limit exceeded: ${limits.messagesPerMinute} messages per minute`,
    };
  }

  // Check hour limit
  if (requestsLastHour >= limits.messagesPerHour) {
    const oldestInHour = entry.timestamps[0];
    const retryAfter = Math.ceil((oldestInHour + 60 * 60 * 1000 - now) / 1000);
    return {
      allowed: false,
      retryAfter,
      reason: `Rate limit exceeded: ${limits.messagesPerHour} messages per hour`,
    };
  }

  // Record this request
  entry.timestamps.push(now);

  return { allowed: true };
}

function getClientIdentifier(req: Request, sessionId?: string): string {
  // Prefer session ID, then forwarded IP, then connection info
  if (sessionId) return sessionId;
  
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp;
  
  // Fallback to a hash of user-agent + origin for some uniqueness
  const ua = req.headers.get('user-agent') || 'unknown';
  const origin = req.headers.get('origin') || 'unknown';
  return `${ua.slice(0, 50)}:${origin}`;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Periodic cleanup
  cleanupRateLimitStore();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminiKey = Deno.env.get('GEMINI_API_KEY');
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

    // Handle analytics tracking (no rate limit for tracking events)
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

    // Apply rate limiting for chat messages
    const clientIdentifier = getClientIdentifier(req, sessionId);
    const rateLimits = {
      messagesPerMinute: widgetConfig.config.rateLimit?.messagesPerMinute ?? DEFAULT_RATE_LIMITS.messagesPerMinute,
      messagesPerHour: widgetConfig.config.rateLimit?.messagesPerHour ?? DEFAULT_RATE_LIMITS.messagesPerHour,
    };

    const rateLimitResult = checkRateLimit(widgetConfig.id, clientIdentifier, rateLimits);

    if (!rateLimitResult.allowed) {
      // Track rate limit event
      await supabase.from('widget_analytics').insert({
        widget_id: widgetConfig.id,
        event_type: 'rate_limit',
        event_data: { reason: rateLimitResult.reason },
        referrer_domain: originDomain,
        session_id: sessionId,
      });

      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. Please slow down.',
          retryAfter: rateLimitResult.retryAfter,
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': String(rateLimitResult.retryAfter || 60),
          } 
        }
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
    
    if (shouldUseKB && geminiKey) {
      try {
        // Generate embedding for the query via Gemini
        const embeddingResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'models/text-embedding-004',
              content: { parts: [{ text: message }] },
            }),
          },
        );

        if (embeddingResponse.ok) {
          const embeddingData = await embeddingResponse.json();
          const embedding = embeddingData.embedding?.values;

          if (embedding) {
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
          model: 'claude-sonnet-4-20250514',
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
    } else if (geminiKey) {
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: finalSystemPrompt + kbContext }] },
            contents: [{ role: 'user', parts: [{ text: message }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
          }),
        },
      );

      if (!geminiResponse.ok) {
        const errText = await geminiResponse.text();
        console.error('Gemini API error:', geminiResponse.status, errText);
        throw new Error(`Gemini API error: ${geminiResponse.status}`);
      }

      const geminiData = await geminiResponse.json();
      response =
        geminiData?.candidates?.[0]?.content?.parts
          ?.map((p: { text?: string }) => p.text || '')
          .join('') || '';
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
