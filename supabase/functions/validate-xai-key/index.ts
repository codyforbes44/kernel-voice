import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

interface ValidationResult {
  success: boolean;
  message: string;
  model?: string;
  responseTimeMs: number;
  details?: {
    status?: number;
    error?: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const XAI_API_KEY = Deno.env.get('XAI_API_KEY');

  console.log('[validate-xai-key] Starting API key validation');

  if (!XAI_API_KEY) {
    console.log('[validate-xai-key] XAI_API_KEY not configured');
    return new Response(JSON.stringify({
      success: false,
      message: 'XAI_API_KEY not configured',
      responseTimeMs: Date.now() - startTime
    } as ValidationResult), { 
      status: 500, 
      headers: corsHeaders 
    });
  }

  try {
    // Test the API key with a minimal chat completion request
    console.log('[validate-xai-key] Testing API key with chat completions endpoint');
    
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${XAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-2-public',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 1,
      }),
    });

    const responseTimeMs = Date.now() - startTime;
    console.log(`[validate-xai-key] Response status: ${response.status} (${responseTimeMs}ms)`);

    if (response.status === 200) {
      const data = await response.json();
      console.log('[validate-xai-key] API key is valid');
      
      return new Response(JSON.stringify({
        success: true,
        message: 'API key is valid',
        model: data.model || 'grok-2-public',
        responseTimeMs,
      } as ValidationResult), { 
        status: 200, 
        headers: corsHeaders 
      });
    } else if (response.status === 401 || response.status === 403) {
      const errorText = await response.text().catch(() => 'Authentication failed');
      console.log(`[validate-xai-key] Invalid API key: ${response.status}`);
      
      return new Response(JSON.stringify({
        success: false,
        message: 'Invalid API key - authentication failed',
        responseTimeMs,
        details: {
          status: response.status,
          error: errorText.substring(0, 200),
        }
      } as ValidationResult), { 
        status: 401, 
        headers: corsHeaders 
      });
    } else if (response.status === 429) {
      console.log('[validate-xai-key] Rate limited');
      
      return new Response(JSON.stringify({
        success: false,
        message: 'Rate limited - please wait and try again',
        responseTimeMs,
        details: { status: 429 }
      } as ValidationResult), { 
        status: 429, 
        headers: corsHeaders 
      });
    } else if (response.status === 402) {
      console.log('[validate-xai-key] Quota exceeded');
      
      return new Response(JSON.stringify({
        success: false,
        message: 'Quota exceeded - please check your xAI billing',
        responseTimeMs,
        details: { status: 402 }
      } as ValidationResult), { 
        status: 402, 
        headers: corsHeaders 
      });
    } else {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.log(`[validate-xai-key] Unexpected status: ${response.status}`);
      
      return new Response(JSON.stringify({
        success: false,
        message: `Unexpected response: ${response.status}`,
        responseTimeMs,
        details: {
          status: response.status,
          error: errorText.substring(0, 200),
        }
      } as ValidationResult), { 
        status: response.status, 
        headers: corsHeaders 
      });
    }
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[validate-xai-key] Error: ${errorMessage}`);
    
    return new Response(JSON.stringify({
      success: false,
      message: `Connection error: ${errorMessage}`,
      responseTimeMs,
      details: { error: errorMessage }
    } as ValidationResult), { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});
