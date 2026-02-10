import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const { prompt, type = 'general', tone = 'professional', maxLength = 1000 } = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'prompt is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const systemInstructions: Record<string, string> = {
      general: 'You are a professional content writer. Generate clear, engaging content based on the user\'s request.',
      blog: 'You are an expert blog writer. Write engaging, well-structured blog posts with headers, paragraphs, and a compelling narrative.',
      email: 'You are an email copywriting specialist. Write concise, effective emails with clear subject lines and calls to action.',
      marketing: 'You are a marketing copywriter. Create persuasive, attention-grabbing marketing copy that drives action.',
      social: 'You are a social media content creator. Write short, punchy, engaging posts optimized for social platforms.',
    };

    const systemPrompt = `${systemInstructions[type] || systemInstructions.general} Tone: ${tone}. Keep the response under ${maxLength} words.`;

    console.log(`[generate-content] Type: ${type}, Tone: ${tone}, Prompt length: ${prompt.length}`);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: `${systemPrompt}\n\n${prompt}` }] },
          ],
          generationConfig: {
            maxOutputTokens: Math.min(maxLength * 2, 8192),
            temperature: 0.8,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[generate-content] Gemini API error:', response.status, errorText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error('No content generated');
    }

    console.log('[generate-content] Content generated successfully');

    return new Response(JSON.stringify({
      content,
      type,
      tone,
      timestamp: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[generate-content] Error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
