import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestResult {
  success: boolean;
  metrics: {
    totalTimeMs: number;
    connectTimeMs: number | null;
    configureTimeMs: number | null;
    responseTimeMs: number | null;
  };
  events: string[];
  logs: string[];
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const voice = url.searchParams.get('voice') || 'Ara';
  const simulateFailure = url.searchParams.get('simulate_failure') === 'true';
  const direct = url.searchParams.get('direct') === 'true';
  const timeoutMs = parseInt(url.searchParams.get('timeout') || '15000', 10);

  const XAI_API_KEY = Deno.env.get('XAI_API_KEY');
  const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');

  const logs: string[] = [];
  const events: string[] = [];
  const startTime = Date.now();
  let connectTime: number | null = null;
  let configureTime: number | null = null;
  let responseTime: number | null = null;
  let success = false;
  let errorMessage: string | undefined;

  const log = (msg: string) => {
    const ts = new Date().toISOString();
    const entry = `[${ts}] ${msg}`;
    logs.push(entry);
    console.log(`[test-xai] ${msg}`);
  };

  log(`Starting test - voice: ${voice}, direct: ${direct}, simulate_failure: ${simulateFailure}, timeout: ${timeoutMs}ms`);

  if (!XAI_API_KEY) {
    return new Response(JSON.stringify({
      success: false,
      metrics: { totalTimeMs: Date.now() - startTime, connectTimeMs: null, configureTimeMs: null, responseTimeMs: null },
      events: [],
      logs: [...logs, 'ERROR: XAI_API_KEY not configured'],
      error: 'XAI_API_KEY not configured'
    } as TestResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Simulate failure for fallback testing
  if (simulateFailure) {
    log('Simulating xAI failure for fallback testing');
    
    if (!ELEVENLABS_API_KEY) {
      return new Response(JSON.stringify({
        success: false,
        metrics: { totalTimeMs: Date.now() - startTime, connectTimeMs: null, configureTimeMs: null, responseTimeMs: null },
        events: [],
        logs: [...logs, 'ERROR: ELEVENLABS_API_KEY not configured for fallback test'],
        error: 'ELEVENLABS_API_KEY not configured for fallback test'
      } as TestResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Test ElevenLabs fallback
    try {
      log('Testing ElevenLabs fallback connection...');
      const elVoiceId = "EXAVITQu4vr4xnSDxMaL"; // Sarah voice
      const elUrl = `https://api.elevenlabs.io/v1/text-to-speech/${elVoiceId}/stream-input?model_id=eleven_turbo_v2_5&optimize_streaming_latency=3`;
      
      const elResponse = await fetch(elUrl, {
        method: "GET",
        headers: {
          "Upgrade": "websocket",
          "Connection": "Upgrade",
          "xi-api-key": ELEVENLABS_API_KEY,
        },
      });

      if (elResponse.status === 101) {
        connectTime = Date.now() - startTime;
        log(`ElevenLabs connection successful (${connectTime}ms)`);
        events.push('elevenlabs.connected');
        
        const ws = (elResponse as any).webSocket;
        if (ws) {
          ws.accept();
          ws.close(1000, 'Test complete');
        }
        
        success = true;
        log('Fallback test passed');
      } else {
        log(`ElevenLabs connection failed: ${elResponse.status}`);
        errorMessage = `ElevenLabs returned status ${elResponse.status}`;
      }
    } catch (error) {
      log(`ElevenLabs error: ${error instanceof Error ? error.message : 'Unknown'}`);
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
    }

    return new Response(JSON.stringify({
      success,
      metrics: { totalTimeMs: Date.now() - startTime, connectTimeMs: connectTime, configureTimeMs: null, responseTimeMs: null },
      events,
      logs,
      error: errorMessage
    } as TestResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Test xAI connection
  // Note: Deno edge functions have limited WebSocket support for outgoing connections
  // The actual relay uses fetch upgrade which may work differently in serve() context
  try {
    if (!direct) {
      log('Note: Relay testing must be done from browser client. Testing direct xAI API instead.');
    }
    
    log('Phase: testing_api_access');
    
    // First, verify we can reach xAI's API with a simple HTTP request
    // This confirms network connectivity and API key validity
    log('Testing xAI API accessibility...');
    
    const testHttpUrl = 'https://api.x.ai/v1/models';
    const httpResponse = await fetch(testHttpUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${XAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    
    connectTime = Date.now() - startTime;
    log(`HTTP API response: ${httpResponse.status} (${connectTime}ms)`);
    
    if (httpResponse.status === 200) {
      events.push('api_accessible');
      log('✓ xAI API is accessible and API key is valid');
      
      const models = await httpResponse.json().catch(() => null);
      if (models) {
        log(`Available models: ${JSON.stringify(models).substring(0, 200)}`);
        events.push('models_retrieved');
      }
      
      // Now try the WebSocket connection with fetch upgrade
      log('Testing WebSocket endpoint via fetch upgrade...');
      log('Phase: connecting_websocket');
      
      try {
        const wsUrl = 'https://api.x.ai/v1/realtime';
        const wsResponse = await fetch(wsUrl, {
          method: 'GET',
          headers: {
            'Upgrade': 'websocket',
            'Connection': 'Upgrade',
            'Authorization': `Bearer ${XAI_API_KEY}`,
          },
        });
        
        log(`WebSocket upgrade response: ${wsResponse.status}`);
        
        if (wsResponse.status === 101) {
          const ws = (wsResponse as any).webSocket;
          if (ws) {
            ws.accept();
            configureTime = Date.now() - startTime;
            log(`✓ WebSocket connected (${configureTime}ms)`);
            events.push('websocket_connected');
            
            // Wait briefly for session.created
            await new Promise<void>((resolve) => {
              const wsTimeout = setTimeout(() => {
                log('WebSocket session timeout - closing');
                ws.close();
                resolve();
              }, 5000);
              
              ws.addEventListener('message', (event: MessageEvent) => {
                try {
                  const data = JSON.parse(event.data);
                  log(`Event: ${data.type}`);
                  events.push(data.type);
                  
                  if (data.type === 'session.created') {
                    responseTime = Date.now() - startTime;
                    log(`✓ Session created (${responseTime}ms)`);
                    success = true;
                    clearTimeout(wsTimeout);
                    ws.close(1000, 'Test complete');
                    resolve();
                  } else if (data.type === 'error') {
                    log(`Error: ${JSON.stringify(data.error || data)}`);
                    clearTimeout(wsTimeout);
                    ws.close();
                    resolve();
                  }
                } catch (e) {
                  log(`Parse error: ${e}`);
                }
              });
              
              ws.addEventListener('error', () => {
                clearTimeout(wsTimeout);
                resolve();
              });
              
              ws.addEventListener('close', () => {
                clearTimeout(wsTimeout);
                resolve();
              });
            });
          } else {
            log('No WebSocket object in response');
            events.push('ws_object_missing');
          }
        } else {
          const errorText = await wsResponse.text().catch(() => '');
          log(`WebSocket upgrade failed: ${wsResponse.status} - ${errorText}`);
          events.push(`ws_upgrade_failed_${wsResponse.status}`);
          
          // Even if WS fails, HTTP worked so partial success
          success = true;
          errorMessage = `WebSocket upgrade returned ${wsResponse.status}, but HTTP API works`;
        }
      } catch (wsError) {
        const wsErrMsg = wsError instanceof Error ? wsError.message : 'Unknown';
        log(`WebSocket error: ${wsErrMsg}`);
        events.push('websocket_error');
        
        // HTTP worked, WS had issues (common in Deno edge)
        success = true;
        errorMessage = `WebSocket connection limited in test env: ${wsErrMsg}. HTTP API works.`;
      }
      
    } else if (httpResponse.status === 401 || httpResponse.status === 403) {
      log('API key is invalid or unauthorized');
      events.push('auth_failed');
      errorMessage = 'xAI API key is invalid or unauthorized';
    } else if (httpResponse.status === 429) {
      log('Rate limited');
      events.push('rate_limited');
      errorMessage = 'xAI API rate limited - try again later';
    } else {
      const errorText = await httpResponse.text().catch(() => '');
      log(`API error: ${httpResponse.status} - ${errorText}`);
      events.push(`api_error_${httpResponse.status}`);
      errorMessage = `xAI API returned ${httpResponse.status}`;
    }
    
  } catch (error) {
    log(`Error: ${error instanceof Error ? error.message : 'Unknown'}`);
    errorMessage = error instanceof Error ? error.message : 'Unknown error';
  }

  const result: TestResult = {
    success,
    metrics: {
      totalTimeMs: Date.now() - startTime,
      connectTimeMs: connectTime,
      configureTimeMs: configureTime,
      responseTimeMs: responseTime,
    },
    events,
    logs,
    error: errorMessage
  };

  log(`Test complete - success: ${success}, totalTime: ${result.metrics.totalTimeMs}ms`);

  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
