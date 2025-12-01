import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, conversationId, userId } = await req.json();
    
    const XAI_API_KEY = Deno.env.get('XAI_API_KEY');
    if (!XAI_API_KEY) {
      throw new Error('XAI_API_KEY not configured');
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
        .limit(20);

      if (previousMessages) {
        conversationContext = previousMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));
      }
    }

    // Combine context with new messages
    const allMessages = [...conversationContext, ...messages];

    console.log('Calling xAI Grok API with messages:', allMessages.length);

    // Call xAI Grok API
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${XAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-2-latest',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful, intelligent AI assistant powered by xAI Grok. You provide accurate, thoughtful responses and can help with a wide variety of tasks. When you need current information, you can use the web_search tool. When asked about documents, you can use the query_document tool.'
          },
          ...allMessages
        ],
        temperature: 0.7,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('xAI API error:', errorText);
      throw new Error(`xAI API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    console.log('Got response from xAI:', assistantMessage.substring(0, 100));

    // Save message to database if conversationId and userId provided
    if (conversationId && userId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Save user message
      if (messages.length > 0 && messages[messages.length - 1].role === 'user') {
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          role: 'user',
          content: messages[messages.length - 1].content
        });
      }

      // Save assistant message
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: assistantMessage
      });

      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);
    }

    return new Response(JSON.stringify({ 
      message: assistantMessage,
      model: 'grok-2-latest'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chat-with-grok:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
