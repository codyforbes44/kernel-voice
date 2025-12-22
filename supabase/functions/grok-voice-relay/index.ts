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
    const instructions = customInstructions || defaultInstructions;

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

    // Connect to xAI using direct API key authentication
    // For server-side relays, we use the API key directly in the URL
    const connectToXai = () => {
      // Encode the API key to handle any special characters
      const encodedKey = encodeURIComponent(XAI_API_KEY);
      const xaiWsUrl = `wss://api.x.ai/v1/realtime?model=grok-2-public&api_key=${encodedKey}`;
      
      console.log('[grok-relay] ====== Connecting to xAI ======');
      console.log('[grok-relay] Using direct API key authentication');
      console.log('[grok-relay] Model: grok-2-public');
      
      const connectStartTime = Date.now();
      
      try {
        xaiSocket = new WebSocket(xaiWsUrl);
      } catch (error) {
        console.error('[grok-relay] Failed to create WebSocket:', error);
        if (clientSocket.readyState === WebSocket.OPEN) {
          clientSocket.send(JSON.stringify({
            type: 'error',
            error: { message: 'Failed to create connection to Grok service' }
          }));
          clientSocket.close(1011, 'WebSocket creation failed');
        }
        return;
      }
      
      xaiSocket.onopen = () => {
        const elapsed = Date.now() - connectStartTime;
        if (connectionTimeout) {
          clearTimeout(connectionTimeout);
          connectionTimeout = null;
        }
        console.log(`[grok-relay] ✓ Connected to xAI Realtime API (${elapsed}ms)`);
        isXaiConnected = true;
        
        // Notify client that connection is ready
        if (clientSocket.readyState === WebSocket.OPEN) {
          clientSocket.send(JSON.stringify({
            type: 'relay.connected',
            message: 'Connected to Grok voice service'
          }));
        }
      };

      xaiSocket.onmessage = (event) => {
        const data = event.data;
        try {
          const message = JSON.parse(data);
          console.log('[grok-relay] ← xAI:', message.type);
          
          // When session is created, send configuration
          if (message.type === 'session.created' && !sessionConfigured) {
            console.log('[grok-relay] Session created, configuring...');
            sessionConfigured = true;
            
            const sessionUpdate = {
              type: 'session.update',
              session: {
                voice: voice,
                instructions: instructions,
                input_audio_format: 'pcm16',
                output_audio_format: 'pcm16',
                turn_detection: { type: 'server_vad' },
              },
            };
            
            console.log('[grok-relay] → xAI: session.update (voice:', voice + ')');
            xaiSocket?.send(JSON.stringify(sessionUpdate));
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

      xaiSocket.onerror = (error: Event) => {
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

      xaiSocket.onclose = (event) => {
        console.log('[grok-relay] xAI WebSocket closed');
        console.log('[grok-relay] Close code:', event.code);
        console.log('[grok-relay] Close reason:', event.reason || '(none)');
        console.log('[grok-relay] Was connected:', isXaiConnected);
        
        const wasConnected = isXaiConnected;
        isXaiConnected = false;
        
        if (isClientConnected && clientSocket.readyState === WebSocket.OPEN) {
          // Provide more helpful error messages based on close code
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
      
      // Set connection timeout (15 seconds for initial connection)
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
    };

    // Handle client connection open
    clientSocket.onopen = () => {
      console.log('[grok-relay] Client WebSocket connected');
      console.log('[grok-relay] Initiating connection to xAI...');
      
      // Connect directly to xAI using API key
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
