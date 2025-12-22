import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Default system instructions for the AI assistant
const defaultInstructions = `You are Kernel, a helpful, friendly AI voice assistant. 

Your capabilities:
- Answer questions clearly and concisely
- Help with research and information lookup
- Assist with document analysis when documents are provided
- Engage in natural, conversational dialogue

Guidelines:
- Keep responses conversational and appropriate for voice interaction
- Be concise - avoid overly long responses that are hard to follow verbally
- Ask clarifying questions when needed
- Be helpful, honest, and harmless
- If you don't know something, say so rather than making things up`;

serve(async (req) => {
  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Check if this is a WebSocket upgrade request
  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket upgrade", { 
      status: 400,
      headers: corsHeaders 
    });
  }

  try {
    const XAI_API_KEY = Deno.env.get('XAI_API_KEY');
    
    if (!XAI_API_KEY) {
      console.error('[grok-relay] XAI_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'Grok voice service not configured' }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse URL parameters for configuration
    const url = new URL(req.url);
    const voice = url.searchParams.get('voice') || 'Ara';
    const customInstructions = url.searchParams.get('instructions');
    const instructions = customInstructions ? decodeURIComponent(customInstructions) : defaultInstructions;

    console.log('[grok-relay] ====== New WebSocket connection ======');
    console.log('[grok-relay] Timestamp:', new Date().toISOString());
    console.log('[grok-relay] Voice:', voice);
    console.log('[grok-relay] Has custom instructions:', !!customInstructions);

    // Upgrade client connection to WebSocket
    const { socket: clientSocket, response } = Deno.upgradeWebSocket(req);
    
    let xaiSocket: WebSocket | null = null;
    let isClientConnected = true;
    let isXaiConnected = false;
    let sessionConfigured = false;
    let connectionTimeout: number | null = null;

    // Connect to xAI using fetch with upgrade headers (proper Authorization header)
    const connectToXai = async () => {
      console.log('[grok-relay] ====== Connecting to xAI WebSocket ======');
      console.log('[grok-relay] Using fetch with upgrade headers for proper Authorization');
      
      try {
        const connectStartTime = Date.now();
        
        // Use fetch with upgrade headers to properly set Authorization
        // This is the xAI-recommended approach that supports Bearer token auth
        const xaiResponse = await fetch("wss://api.x.ai/v1/realtime", {
          method: "GET",
          headers: {
            "Upgrade": "websocket",
            "Connection": "Upgrade",
            "Authorization": `Bearer ${XAI_API_KEY}`,
          },
        });
        
        console.log('[grok-relay] Fetch response status:', xaiResponse.status);
        
        // Check if upgrade was successful
        if (xaiResponse.status !== 101) {
          const errorText = await xaiResponse.text().catch(() => 'Unknown error');
          console.error('[grok-relay] WebSocket upgrade failed:', xaiResponse.status, errorText);
          throw new Error(`WebSocket upgrade failed: ${xaiResponse.status} - ${errorText}`);
        }
        
        // Get the WebSocket from the response (Deno-specific)
        const ws = (xaiResponse as any).webSocket;
        if (!ws) {
          throw new Error('No WebSocket in upgrade response');
        }
        
        ws.accept();
        xaiSocket = ws;
        
        const elapsed = Date.now() - connectStartTime;
        console.log(`[grok-relay] ✓ Connected to xAI Realtime API via fetch upgrade (${elapsed}ms)`);
        isXaiConnected = true;
        
        if (connectionTimeout) {
          clearTimeout(connectionTimeout);
          connectionTimeout = null;
        }
        
        // Notify client that connection is ready
        if (clientSocket.readyState === WebSocket.OPEN) {
          clientSocket.send(JSON.stringify({
            type: 'relay.connected',
            message: 'Connected to Grok voice service'
          }));
        }

        ws.onmessage = (event: MessageEvent) => {
          const data = event.data;
          try {
            const message = JSON.parse(data);
            console.log('[grok-relay] ← xAI:', message.type);
            
            // When session is created, send configuration
            if (message.type === 'session.created' && !sessionConfigured) {
              console.log('[grok-relay] Session created, configuring...');
              sessionConfigured = true;
              
              // xAI session.update format with nested audio object
              const sessionUpdate = {
                type: 'session.update',
                session: {
                  voice: voice,
                  instructions: instructions,
                  audio: {
                    input: { format: { type: 'audio/pcm', rate: 24000 } },
                    output: { format: { type: 'audio/pcm', rate: 24000 } }
                  },
                  turn_detection: {
                    type: 'server_vad',
                    threshold: 0.5,
                    prefix_padding_ms: 300,
                    silence_duration_ms: 200
                  },
                },
              };
              
              console.log('[grok-relay] → xAI: session.update (voice:', voice + ')');
              ws.send(JSON.stringify(sessionUpdate));
            }
            
            if (message.type === 'session.updated') {
              console.log('[grok-relay] ✓ Session configured successfully');
            }
            
            if (message.type === 'error') {
              console.error('[grok-relay] xAI error:', JSON.stringify(message.error || message));
            }
            
            // Forward all messages to client
            if (isClientConnected && clientSocket.readyState === WebSocket.OPEN) {
              clientSocket.send(data);
            }
          } catch {
            // Binary data or parse error - forward as-is
            if (isClientConnected && clientSocket.readyState === WebSocket.OPEN) {
              clientSocket.send(data);
            }
          }
        };

        ws.onerror = (error: Event) => {
          const errorEvent = error as ErrorEvent;
          console.error('[grok-relay] ✗ xAI WebSocket error');
          console.error('[grok-relay] Error type:', errorEvent.type);
          console.error('[grok-relay] Error message:', errorEvent.message || 'Unknown error');
          console.error('[grok-relay] Was connected:', isXaiConnected);
          
          if (!isXaiConnected && isClientConnected && clientSocket.readyState === WebSocket.OPEN) {
            clientSocket.send(JSON.stringify({
              type: 'error',
              error: { 
                message: 'Failed to connect to Grok service',
                details: errorEvent.message || 'Connection rejected'
              }
            }));
            clientSocket.close(1011, 'Failed to connect to xAI');
          }
        };

        ws.onclose = (event: CloseEvent) => {
          console.log('[grok-relay] xAI WebSocket closed');
          console.log('[grok-relay] Close code:', event.code);
          console.log('[grok-relay] Close reason:', event.reason || '(none)');
          console.log('[grok-relay] Was connected:', isXaiConnected);
          
          const wasConnected = isXaiConnected;
          isXaiConnected = false;
          
          if (isClientConnected && clientSocket.readyState === WebSocket.OPEN) {
            let message = event.reason || 'Grok service disconnected';
            if (event.code === 1000) {
              message = 'Session ended normally';
            } else if (event.code === 1006) {
              message = wasConnected ? 'Connection lost unexpectedly' : 'Could not establish connection to Grok';
            } else if (event.code === 1011) {
              message = 'Server error occurred';
            }
            
            clientSocket.send(JSON.stringify({
              type: 'relay.disconnected',
              code: event.code,
              reason: message,
              wasConnected: wasConnected
            }));
            clientSocket.close(1000, 'xAI connection closed');
          }
        };
        
      } catch (error) {
        console.error('[grok-relay] Connection error:', error);
        if (isClientConnected && clientSocket.readyState === WebSocket.OPEN) {
          clientSocket.send(JSON.stringify({
            type: 'error',
            error: { 
              message: 'Failed to initialize Grok connection',
              details: error instanceof Error ? error.message : 'Unknown error'
            }
          }));
          clientSocket.close(1011, 'Connection initialization failed');
        }
      }
    };

    // Handle client connection open
    clientSocket.onopen = () => {
      console.log('[grok-relay] Client WebSocket connected');
      console.log('[grok-relay] Initiating connection to xAI...');
      
      // Set connection timeout (15 seconds for WebSocket connection)
      connectionTimeout = setTimeout(() => {
        if (!isXaiConnected) {
          console.error('[grok-relay] ✗ Connection to xAI timed out after 15s');
          xaiSocket?.close();
          if (isClientConnected && clientSocket.readyState === WebSocket.OPEN) {
            clientSocket.send(JSON.stringify({
              type: 'error',
              error: { message: 'Connection to Grok service timed out' }
            }));
            clientSocket.close(1011, 'Connection timeout');
          }
        }
      }, 15000) as unknown as number;
      
      // Connect to xAI using fetch with proper Authorization header
      connectToXai();
    };

    // Forward client messages to xAI
    clientSocket.onmessage = (event) => {
      const data = event.data;
      
      if (typeof data === 'string') {
        try {
          const parsed = JSON.parse(data);
          console.log('[grok-relay] → xAI:', parsed.type || 'unknown');
        } catch {
          console.log('[grok-relay] → xAI: text message');
        }
      } else {
        console.log('[grok-relay] → xAI: audio data');
      }
      
      if (isXaiConnected && xaiSocket?.readyState === WebSocket.OPEN) {
        xaiSocket.send(data);
      } else {
        console.warn('[grok-relay] Cannot forward - xAI not connected (state:', xaiSocket?.readyState, ')');
      }
    };

    clientSocket.onerror = (error) => {
      console.error('[grok-relay] Client WebSocket error:', error);
    };

    clientSocket.onclose = (event) => {
      console.log('[grok-relay] Client WebSocket closed:', event.code, event.reason || '(no reason)');
      isClientConnected = false;
      
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
      }
      
      // Close xAI connection when client disconnects
      if (xaiSocket?.readyState === WebSocket.OPEN) {
        console.log('[grok-relay] Closing xAI connection...');
        xaiSocket.close(1000, 'Client disconnected');
      }
    };

    return response;

  } catch (error) {
    console.error('[grok-relay] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
