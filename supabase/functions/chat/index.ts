import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, conversationId, userId, stream = false } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('AI service not configured');
    }

    // Get conversation context if conversationId provided
    let conversationContext: Array<{ role: string; content: string }> = [];
    if (conversationId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: previousMessages } = await supabase
        .from('messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(MAX_CONTEXT_MESSAGES);

      if (previousMessages) {
        conversationContext = previousMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));
      }
    }

    // Combine context with new messages (truncate if too long)
    const allMessages = [...conversationContext, ...messages].slice(-MAX_CONTEXT_MESSAGES);

    console.log(`Processing conversation with Lovable AI... (messages: ${allMessages.length}, streaming: ${stream})`);

    const systemPrompt = 'You are ƷBI Voice, a helpful, intelligent AI assistant. You provide accurate, thoughtful responses and can help with a wide variety of tasks. Be concise but thorough in your responses.';

    // Call Lovable AI Gateway
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...allMessages.map(msg => ({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content
          }))
        ],
        stream,
      }),
    });

    // Handle rate limiting and payment errors
    if (response.status === 429) {
      console.error('Rate limit exceeded');
      return new Response(JSON.stringify({ 
        error: 'Rate limit exceeded. Please try again later.',
        code: 'RATE_LIMIT'
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (response.status === 402) {
      console.error('Payment required');
      return new Response(JSON.stringify({ 
        error: 'AI credits exhausted. Please add credits to continue.',
        code: 'PAYMENT_REQUIRED'
      }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI service error:', response.status, errorText);
      throw new Error(`AI service error: ${response.status}`);
    }

    // Handle streaming response
    if (stream) {
      console.log('Streaming response back to client');
      return new Response(response.body, {
        headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
      });
    }

    // Non-streaming response
    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content || 'I apologize, but I was unable to generate a response.';

    console.log('AI response generated successfully');

    // Save message to database if conversationId and userId provided
    if (conversationId && userId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabaseClient = createClient(supabaseUrl, supabaseKey);

      // Get the last user message
      const lastUserMessage = messages.length > 0 && messages[messages.length - 1].role === 'user'
        ? messages[messages.length - 1].content
        : '';

      // Save both user message and assistant response
      await supabaseClient
        .from('messages')
        .insert([
          ...(lastUserMessage ? [{
            conversation_id: conversationId,
            role: 'user',
            content: lastUserMessage,
          }] : []),
          {
            conversation_id: conversationId,
            role: 'assistant',
            content: assistantMessage,
          },
        ]);

      // Auto-generate title from first message if still default
      const { data: conv } = await supabaseClient
        .from('conversations')
        .select('title')
        .eq('id', conversationId)
        .single();

      if (conv?.title === 'New Conversation' && lastUserMessage) {
        const title = lastUserMessage.substring(0, 45) + (lastUserMessage.length > 45 ? '...' : '');
        await supabaseClient
          .from('conversations')
          .update({ 
            title,
            updated_at: new Date().toISOString() 
          })
          .eq('id', conversationId);
      } else {
        // Just update timestamp
        await supabaseClient
          .from('conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', conversationId);
      }
    }

    return new Response(JSON.stringify({ 
      message: assistantMessage,
      model: 'lovable-ai'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error processing conversation:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
