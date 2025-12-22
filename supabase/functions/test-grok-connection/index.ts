import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const logs: string[] = [];
  const log = (msg: string) => {
    const timestamp = new Date().toISOString();
    const entry = `[${timestamp}] ${msg}`;
    console.log(entry);
    logs.push(entry);
  };

  try {
    const XAI_API_KEY = Deno.env.get('XAI_API_KEY');
    
    if (!XAI_API_KEY) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'XAI_API_KEY not configured',
        logs 
      }), { status: 500, headers: corsHeaders });
    }

    log('Phase: connecting_xai');
    log('Using fetch with upgrade headers for Authorization');

    const xaiResponse = await fetch("wss://api.x.ai/v1/realtime", {
      method: "GET",
      headers: {
        "Upgrade": "websocket",
        "Connection": "Upgrade",
        "Authorization": `Bearer ${XAI_API_KEY}`,
      },
    });

    log(`Fetch response status: ${xaiResponse.status}`);

    if (xaiResponse.status !== 101) {
      const errorText = await xaiResponse.text().catch(() => 'Unknown error');
      log(`WebSocket upgrade failed: ${xaiResponse.status} - ${errorText}`);
      return new Response(JSON.stringify({ 
        success: false, 
        error: `WebSocket upgrade failed: ${xaiResponse.status}`,
        details: errorText,
        logs 
      }), { status: 400, headers: corsHeaders });
    }

    const ws = (xaiResponse as any).webSocket;
    if (!ws) {
      log('No WebSocket in upgrade response');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No WebSocket in upgrade response',
        logs 
      }), { status: 500, headers: corsHeaders });
    }

    ws.accept();
    log('Phase: connected_xai');
    log('✓ WebSocket connection established');

    // Wait for events with timeout
    const result = await new Promise<{ success: boolean; events: string[]; error?: string }>((resolve) => {
      const events: string[] = [];
      let sessionCreated = false;
      let sessionUpdated = false;

      const timeout = setTimeout(() => {
        ws.close();
        resolve({ 
          success: sessionCreated, 
          events,
          error: sessionUpdated ? undefined : 'Timeout waiting for session.updated'
        });
      }, 10000);

      ws.addEventListener('message', (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          const eventType = data.type || 'unknown';
          log(`← xAI event: ${eventType}`);
          events.push(eventType);

          if (data.type === 'session.created') {
            sessionCreated = true;
            log('Phase: configuring');
            
            // Send session.update
            const sessionUpdate = {
              type: 'session.update',
              session: {
                voice: 'Ara',
                instructions: 'Test: Respond with a short greeting.',
                audio: {
                  input: { format: { type: 'audio/pcm', rate: 24000 } },
                  output: { format: { type: 'audio/pcm', rate: 24000 } }
                },
                turn_detection: { type: 'server_vad' },
              },
            };
            log('→ xAI: session.update');
            ws.send(JSON.stringify(sessionUpdate));
          }

          if (data.type === 'session.updated') {
            sessionUpdated = true;
            log('Phase: ready');
            log('✓ Session configured successfully');
            clearTimeout(timeout);
            ws.close();
            resolve({ success: true, events });
          }

          if (data.type === 'error') {
            log(`✗ Error: ${JSON.stringify(data.error || data)}`);
            clearTimeout(timeout);
            ws.close();
            resolve({ success: false, events, error: data.error?.message || 'xAI error' });
          }
        } catch (e) {
          log(`Parse error: ${e}`);
        }
      });

      ws.addEventListener('error', (e: Event) => {
        log(`WebSocket error: ${(e as ErrorEvent).message || 'Unknown'}`);
        clearTimeout(timeout);
        resolve({ success: false, events, error: 'WebSocket error' });
      });

      ws.addEventListener('close', (e: CloseEvent) => {
        log(`WebSocket closed: ${e.code} ${e.reason || ''}`);
      });
    });

    logs.push(...result.events.map(e => `Event received: ${e}`));

    return new Response(JSON.stringify({ 
      success: result.success,
      error: result.error,
      events: result.events,
      logs 
    }), { 
      status: result.success ? 200 : 400, 
      headers: corsHeaders 
    });

  } catch (error) {
    log(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      logs 
    }), { status: 500, headers: corsHeaders });
  }
});
