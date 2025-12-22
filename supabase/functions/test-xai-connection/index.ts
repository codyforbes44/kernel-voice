import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced test result interface with connection method tracking
interface EnhancedTestResult {
  success: boolean;
  connectionMethod: 'subprotocol' | 'fetch_upgrade' | 'fallback' | null;
  phase: string;
  metrics: {
    totalTimeMs: number;
    keyValidationMs: number | null;
    subprotocolAttemptMs: number | null;
    fetchUpgradeMs: number | null;
    sessionCreatedMs: number | null;
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
  const debugLevel = url.searchParams.get('debug') || 'basic';
  const timeoutMs = parseInt(url.searchParams.get('timeout') || '15000', 10);

  const XAI_API_KEY = Deno.env.get('XAI_API_KEY');
  const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');

  const logs: string[] = [];
  const events: string[] = [];
  const startTime = Date.now();
  
  // Enhanced metrics
  let keyValidationMs: number | null = null;
  let subprotocolAttemptMs: number | null = null;
  let fetchUpgradeMs: number | null = null;
  let sessionCreatedMs: number | null = null;
  
  let success = false;
  let errorMessage: string | undefined;
  let connectionMethod: 'subprotocol' | 'fetch_upgrade' | 'fallback' | null = null;
  let phase = 'init';

  const log = (msg: string) => {
    const ts = new Date().toISOString();
    const entry = `[${ts}] ${msg}`;
    if (debugLevel !== 'off') {
      logs.push(entry);
    }
    console.log(`[test-xai] ${msg}`);
  };

  const verbose = (msg: string) => {
    if (debugLevel === 'verbose') {
      log(msg);
    } else {
      console.log(`[test-xai:verbose] ${msg}`);
    }
  };

  log(`Starting enhanced test - voice: ${voice}, simulate_failure: ${simulateFailure}, timeout: ${timeoutMs}ms, debug: ${debugLevel}`);

  if (!XAI_API_KEY) {
    return new Response(JSON.stringify({
      success: false,
      connectionMethod: null,
      phase: 'error',
      metrics: { totalTimeMs: Date.now() - startTime, keyValidationMs: null, subprotocolAttemptMs: null, fetchUpgradeMs: null, sessionCreatedMs: null },
      events: [],
      logs: [...logs, 'ERROR: XAI_API_KEY not configured'],
      error: 'XAI_API_KEY not configured'
    } as EnhancedTestResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Simulate failure for fallback testing
  if (simulateFailure) {
    log('Simulating xAI failure for fallback testing');
    phase = 'testing_fallback';
    
    if (!ELEVENLABS_API_KEY) {
      return new Response(JSON.stringify({
        success: false,
        connectionMethod: null,
        phase: 'error',
        metrics: { totalTimeMs: Date.now() - startTime, keyValidationMs: null, subprotocolAttemptMs: null, fetchUpgradeMs: null, sessionCreatedMs: null },
        events: [],
        logs: [...logs, 'ERROR: ELEVENLABS_API_KEY not configured for fallback test'],
        error: 'ELEVENLABS_API_KEY not configured for fallback test'
      } as EnhancedTestResult), {
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
        fetchUpgradeMs = Date.now() - startTime;
        log(`ElevenLabs connection successful (${fetchUpgradeMs}ms)`);
        events.push('elevenlabs.connected');
        connectionMethod = 'fallback';
        
        const ws = (elResponse as any).webSocket;
        if (ws) {
          ws.accept();
          ws.close(1000, 'Test complete');
        }
        
        success = true;
        phase = 'complete';
        log('Fallback test passed');
      } else {
        log(`ElevenLabs connection failed: ${elResponse.status}`);
        errorMessage = `ElevenLabs returned status ${elResponse.status}`;
        phase = 'error';
      }
    } catch (error) {
      log(`ElevenLabs error: ${error instanceof Error ? error.message : 'Unknown'}`);
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
      phase = 'error';
    }

    return new Response(JSON.stringify({
      success,
      connectionMethod,
      phase,
      metrics: { totalTimeMs: Date.now() - startTime, keyValidationMs: null, subprotocolAttemptMs: null, fetchUpgradeMs, sessionCreatedMs: null },
      events,
      logs,
      error: errorMessage
    } as EnhancedTestResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Test xAI connection with enhanced diagnostics
  try {
    // Phase 1: Validate API key with chat completions endpoint (per xAI recommendation)
    phase = 'validating_key';
    log('Phase: validating_key - Testing xAI API key with chat completions...');
    
    const testHttpUrl = 'https://api.x.ai/v1/chat/completions';
    const httpResponse = await fetch(testHttpUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${XAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-2-public',
        messages: [{ role: 'user', content: 'Test' }],
        max_tokens: 1
      }),
    });
    
    keyValidationMs = Date.now() - startTime;
    log(`Chat completions API response: ${httpResponse.status} (${keyValidationMs}ms)`);
    
    if (httpResponse.status !== 200) {
      if (httpResponse.status === 401 || httpResponse.status === 403) {
        log('API key is invalid or unauthorized');
        events.push('auth_failed');
        errorMessage = 'xAI API key is invalid or unauthorized';
        phase = 'error';
      } else if (httpResponse.status === 429) {
        log('Rate limited');
        events.push('rate_limited');
        errorMessage = 'xAI API rate limited - try again later';
        phase = 'error';
      } else {
        const errorText = await httpResponse.text().catch(() => '');
        log(`API error: ${httpResponse.status} - ${errorText}`);
        events.push(`api_error_${httpResponse.status}`);
        errorMessage = `xAI API returned ${httpResponse.status}`;
        phase = 'error';
      }
      
      return new Response(JSON.stringify({
        success: false,
        connectionMethod: null,
        phase,
        metrics: { totalTimeMs: Date.now() - startTime, keyValidationMs, subprotocolAttemptMs: null, fetchUpgradeMs: null, sessionCreatedMs: null },
        events,
        logs,
        error: errorMessage
      } as EnhancedTestResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    events.push('api_accessible');
    log('✓ xAI API is accessible and API key is valid');
    
    const models = await httpResponse.json().catch(() => null);
    if (models) {
      verbose(`Available models: ${JSON.stringify(models).substring(0, 200)}`);
      events.push('models_retrieved');
    }

    // Phase 2: Try subprotocol authentication first
    phase = 'trying_subprotocol';
    log('Phase: trying_subprotocol - Attempting WebSocket with subprotocol auth...');
    const subprotocolStartTime = Date.now();
    
    let wsConnected = false;
    
    try {
      // Note: In Deno edge functions, direct WebSocket with subprotocol may not work
      // This is more for documentation/testing if xAI supports it
      const subprotocolWs = new WebSocket('wss://api.x.ai/v1/realtime', [
        'realtime',
        `xai-api-key.${XAI_API_KEY}`,
      ]);
      
      // Give it a short timeout
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          subprotocolWs.close();
          reject(new Error('Subprotocol connection timeout'));
        }, 5000);
        
        subprotocolWs.onopen = () => {
          subprotocolAttemptMs = Date.now() - subprotocolStartTime;
          log(`✓ Subprotocol connection successful (${subprotocolAttemptMs}ms)`);
          events.push('subprotocol_connected');
          connectionMethod = 'subprotocol';
          wsConnected = true;
          clearTimeout(timeout);
          
          // Wait for session.created
          subprotocolWs.onmessage = (event: MessageEvent) => {
            try {
              const data = JSON.parse(event.data);
              verbose(`Event: ${data.type}`);
              events.push(data.type);
              
              if (data.type === 'session.created') {
                sessionCreatedMs = Date.now() - startTime;
                log(`✓ Session created (${sessionCreatedMs}ms)`);
                success = true;
                phase = 'ready';
                subprotocolWs.close(1000, 'Test complete');
                resolve();
              } else if (data.type === 'error') {
                log(`Error: ${JSON.stringify(data.error || data)}`);
                subprotocolWs.close();
                resolve();
              }
            } catch (e) {
              verbose(`Parse error: ${e}`);
            }
          };
        };
        
        subprotocolWs.onerror = (err) => {
          subprotocolAttemptMs = Date.now() - subprotocolStartTime;
          verbose(`Subprotocol error (${subprotocolAttemptMs}ms): ${err}`);
          events.push('subprotocol_error');
          clearTimeout(timeout);
          reject(new Error('Subprotocol connection failed'));
        };
        
        subprotocolWs.onclose = () => {
          if (!wsConnected) {
            clearTimeout(timeout);
            reject(new Error('Subprotocol connection closed'));
          }
        };
      });
      
    } catch (subprotocolError) {
      subprotocolAttemptMs = Date.now() - subprotocolStartTime;
      const errMsg = subprotocolError instanceof Error ? subprotocolError.message : 'Unknown';
      log(`Subprotocol auth failed (${subprotocolAttemptMs}ms): ${errMsg}`);
      events.push('subprotocol_failed');
      
      // Phase 3: Fallback to fetch upgrade
      phase = 'trying_fetch_upgrade';
      log('Phase: trying_fetch_upgrade - Attempting WebSocket via fetch upgrade...');
      const fetchUpgradeStartTime = Date.now();
      
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
        
        fetchUpgradeMs = Date.now() - fetchUpgradeStartTime;
        log(`WebSocket upgrade response: ${wsResponse.status} (${fetchUpgradeMs}ms)`);
        
        if (wsResponse.status === 101) {
          const ws = (wsResponse as any).webSocket;
          if (ws) {
            ws.accept();
            log(`✓ WebSocket connected via fetch upgrade`);
            events.push('websocket_connected');
            connectionMethod = 'fetch_upgrade';
            wsConnected = true;
            
            // Wait for session.created
            await new Promise<void>((resolve) => {
              const wsTimeout = setTimeout(() => {
                log('WebSocket session timeout - closing');
                ws.close();
                resolve();
              }, 5000);
              
              ws.addEventListener('message', (event: MessageEvent) => {
                try {
                  const data = JSON.parse(event.data);
                  verbose(`Event: ${data.type}`);
                  events.push(data.type);
                  
                  if (data.type === 'session.created') {
                    sessionCreatedMs = Date.now() - startTime;
                    log(`✓ Session created (${sessionCreatedMs}ms)`);
                    success = true;
                    phase = 'ready';
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
                  verbose(`Parse error: ${e}`);
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
          
          // HTTP API works even if WebSocket failed
          success = true;
          phase = 'partial';
          errorMessage = `WebSocket upgrade returned ${wsResponse.status}, but HTTP API works`;
        }
      } catch (wsError) {
        fetchUpgradeMs = Date.now() - fetchUpgradeStartTime;
        const wsErrMsg = wsError instanceof Error ? wsError.message : 'Unknown';
        log(`WebSocket fetch upgrade error (${fetchUpgradeMs}ms): ${wsErrMsg}`);
        events.push('websocket_error');
        
        // HTTP worked, WS had issues
        success = true;
        phase = 'partial';
        errorMessage = `WebSocket connection limited in test env: ${wsErrMsg}. HTTP API works.`;
      }
    }
    
  } catch (error) {
    log(`Error: ${error instanceof Error ? error.message : 'Unknown'}`);
    errorMessage = error instanceof Error ? error.message : 'Unknown error';
    phase = 'error';
  }

  const result: EnhancedTestResult = {
    success,
    connectionMethod,
    phase,
    metrics: {
      totalTimeMs: Date.now() - startTime,
      keyValidationMs,
      subprotocolAttemptMs,
      fetchUpgradeMs,
      sessionCreatedMs,
    },
    events,
    logs,
    error: errorMessage
  };

  log(`Test complete - success: ${success}, method: ${connectionMethod}, totalTime: ${result.metrics.totalTimeMs}ms`);

  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
