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
      const elUrl = `wss://api.elevenlabs.io/v1/text-to-speech/${elVoiceId}/stream-input?model_id=eleven_turbo_v2_5&optimize_streaming_latency=3`;
      
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

  // Direct xAI test or via relay
  try {
    let testUrl: string;
    
    if (direct) {
      testUrl = 'wss://api.x.ai/v1/realtime';
      log(`Testing DIRECT connection to xAI: ${testUrl}`);
    } else {
      if (!SUPABASE_URL) {
        throw new Error('SUPABASE_URL not configured for relay test');
      }
      testUrl = `${SUPABASE_URL.replace('https://', 'wss://')}/functions/v1/grok-voice-relay?voice=${voice}&debug=basic`;
      log(`Testing via RELAY: ${testUrl}`);
    }

    log('Phase: connecting');
    
    const headers: Record<string, string> = direct ? {
      "Upgrade": "websocket",
      "Connection": "Upgrade",
      "Authorization": `Bearer ${XAI_API_KEY}`,
    } : {
      "Upgrade": "websocket",
      "Connection": "Upgrade",
    };

    log(`Initiating fetch with upgrade headers`);
    const response = await fetch(testUrl, { method: 'GET', headers });
    
    log(`Response status: ${response.status}`);
    
    if (response.status !== 101) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`WebSocket upgrade failed: ${response.status} - ${errorText}`);
    }

    const ws = (response as any).webSocket;
    if (!ws) {
      throw new Error('No WebSocket in upgrade response');
    }

    ws.accept();
    connectTime = Date.now() - startTime;
    log(`Connected (${connectTime}ms)`);
    events.push('connected');

    // Wait for session events with timeout
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        log('Test timeout reached');
        ws.close();
        reject(new Error(`Test timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      ws.addEventListener('message', (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          log(`Event: ${data.type}`);
          events.push(data.type);

          if (data.type === 'session.created') {
            log('Phase: configuring');
            
            // Send session.update
            const sessionUpdate = {
              type: 'session.update',
              session: {
                voice: voice,
                instructions: 'You are a test assistant. Respond with "Test successful" to any input.',
                audio: {
                  input: { format: { type: 'audio/pcm', rate: 24000 } },
                  output: { format: { type: 'audio/pcm', rate: 24000 } }
                },
                turn_detection: { type: 'server_vad' },
              },
            };
            
            log('Sending session.update');
            ws.send(JSON.stringify(sessionUpdate));
          } else if (data.type === 'session.updated') {
            configureTime = Date.now() - startTime;
            log(`Session configured (${configureTime}ms)`);
            log('Phase: ready');
            
            // Send a test audio buffer commit to trigger a response
            log('Sending test input_audio_buffer.commit');
            ws.send(JSON.stringify({ type: 'input_audio_buffer.commit' }));
            
            // Also try a text message for more reliable response
            log('Sending test conversation.item.create');
            ws.send(JSON.stringify({
              type: 'conversation.item.create',
              item: {
                type: 'message',
                role: 'user',
                content: [{ type: 'input_text', text: 'Hello' }],
              },
            }));
            ws.send(JSON.stringify({ type: 'response.create' }));
          } else if (data.type === 'response.audio.delta' || data.type === 'response.text.delta') {
            responseTime = Date.now() - startTime;
            log(`Response received (${responseTime}ms)`);
            success = true;
            clearTimeout(timeout);
            ws.close(1000, 'Test complete');
            resolve();
          } else if (data.type === 'error') {
            log(`Error from API: ${JSON.stringify(data.error || data)}`);
            clearTimeout(timeout);
            reject(new Error(data.error?.message || 'API error'));
          } else if (data.type === 'relay.connected') {
            log('Relay connected to xAI');
          } else if (data.type === 'response.done') {
            // If we got response.done without audio.delta, still count as success
            if (!success) {
              responseTime = Date.now() - startTime;
              log(`Response completed (${responseTime}ms)`);
              success = true;
              clearTimeout(timeout);
              ws.close(1000, 'Test complete');
              resolve();
            }
          }
        } catch (e) {
          log(`Parse error: ${e instanceof Error ? e.message : 'Unknown'}`);
        }
      });

      ws.addEventListener('error', (event: Event) => {
        log(`WebSocket error: ${(event as ErrorEvent).message || 'Unknown'}`);
        clearTimeout(timeout);
        reject(new Error('WebSocket error'));
      });

      ws.addEventListener('close', (event: CloseEvent) => {
        log(`WebSocket closed: ${event.code} ${event.reason || ''}`);
        clearTimeout(timeout);
        if (!success) {
          reject(new Error(`Connection closed: ${event.code}`));
        }
      });
    });

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
