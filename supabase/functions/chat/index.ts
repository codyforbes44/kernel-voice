import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_CONTEXT_MESSAGES = 50;
const GEMINI_MODEL = 'gemini-2.5-flash';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, conversationId, userId, stream = false } = await req.json();

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('AI service not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Load prior conversation context
    let conversationContext: Array<{ role: string; content: string }> = [];
    if (conversationId) {
      const { data: previousMessages } = await supabase
        .from('messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(MAX_CONTEXT_MESSAGES);

      if (previousMessages) {
        conversationContext = previousMessages.map((m) => ({ role: m.role, content: m.content }));
      }
    }

    const allMessages = [...conversationContext, ...messages].slice(-MAX_CONTEXT_MESSAGES);
    const systemPrompt =
      'You are ƷBI, a helpful, intelligent AI assistant. You provide accurate, thoughtful responses and can help with a wide variety of tasks. Be concise but thorough in your responses.';

    // Convert OpenAI-style messages -> Gemini contents
    const contents = allMessages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const geminiBody = {
      contents,
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
    };

    console.log(`Processing chat with Gemini direct... (messages: ${allMessages.length}, streaming: ${stream})`);

    if (stream) {
      const upstream = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(geminiBody),
        },
      );

      if (upstream.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.', code: 'RATE_LIMIT' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      if (upstream.status === 402 || upstream.status === 403) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.', code: 'PAYMENT_REQUIRED' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      if (!upstream.ok || !upstream.body) {
        const errText = await upstream.text();
        console.error('Gemini stream error:', upstream.status, errText);
        throw new Error(`AI service error: ${upstream.status}`);
      }

      // Translate Gemini SSE -> OpenAI-compatible SSE for the client parser
      const reader = upstream.body.getReader();
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();
      let buffer = '';
      let assistantText = '';

      const readable = new ReadableStream({
        async start(controller) {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });

              let nl: number;
              while ((nl = buffer.indexOf('\n')) !== -1) {
                let line = buffer.slice(0, nl);
                buffer = buffer.slice(nl + 1);
                if (line.endsWith('\r')) line = line.slice(0, -1);
                if (!line.startsWith('data: ')) continue;
                const json = line.slice(6).trim();
                if (!json || json === '[DONE]') continue;
                try {
                  const parsed = JSON.parse(json);
                  const text = parsed?.candidates?.[0]?.content?.parts
                    ?.map((p: { text?: string }) => p.text || '')
                    .join('') ?? '';
                  if (text) {
                    assistantText += text;
                    const chunk = { choices: [{ delta: { content: text } }] };
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
                  }
                } catch (_e) {
                  // partial JSON; put the line back
                  buffer = line + '\n' + buffer;
                  break;
                }
              }
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();

            // Persist after stream ends
            if (conversationId && userId && assistantText) {
              await persistMessages(supabase, conversationId, messages, assistantText);
            }
          } catch (err) {
            console.error('Stream translation error:', err);
            controller.error(err);
          }
        },
      });

      return new Response(readable, {
        headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
      });
    }

    // Non-streaming
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiBody),
      },
    );

    if (response.status === 429) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.', code: 'RATE_LIMIT' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    if (response.status === 402 || response.status === 403) {
      return new Response(
        JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.', code: 'PAYMENT_REQUIRED' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini error:', response.status, errorText);
      throw new Error(`AI service error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage =
      data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || '').join('') ||
      'I apologize, but I was unable to generate a response.';

    if (conversationId && userId) {
      await persistMessages(supabase, conversationId, messages, assistantMessage);
    }

    return new Response(JSON.stringify({ message: assistantMessage, model: GEMINI_MODEL }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing conversation:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

async function persistMessages(
  supabase: ReturnType<typeof createClient>,
  conversationId: string,
  inboundMessages: Array<{ role: string; content: string }>,
  assistantMessage: string,
) {
  const lastUserMessage =
    inboundMessages.length > 0 && inboundMessages[inboundMessages.length - 1].role === 'user'
      ? inboundMessages[inboundMessages.length - 1].content
      : '';

  await supabase.from('messages').insert([
    ...(lastUserMessage
      ? [{ conversation_id: conversationId, role: 'user', content: lastUserMessage }]
      : []),
    { conversation_id: conversationId, role: 'assistant', content: assistantMessage },
  ]);

  const { data: conv } = await supabase
    .from('conversations')
    .select('title')
    .eq('id', conversationId)
    .single();

  if (conv?.title === 'New Conversation' && lastUserMessage) {
    const title = lastUserMessage.substring(0, 45) + (lastUserMessage.length > 45 ? '...' : '');
    await supabase
      .from('conversations')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', conversationId);
  } else {
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);
  }
}
