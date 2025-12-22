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

    console.log('WebSocket upgrade request received, voice:', voice);

    // Upgrade client connection to WebSocket
    const { socket: clientSocket, response } = Deno.upgradeWebSocket(req);
    
    // Connect to xAI Realtime API with proper authentication
    // xAI uses Bearer token in headers for WebSocket authentication
    const xaiWsUrl = 'wss://api.x.ai/v1/realtime?model=grok-2-public';
    
    console.log('Connecting to xAI WebSocket:', xaiWsUrl);
    
    let xaiSocket: WebSocket | null = null;
    let isClientConnected = true;
    let isXaiConnected = false;
    let sessionConfigured = false;

    // Handle client connection open
    clientSocket.onopen = () => {
      console.log('Client WebSocket connected');
      
      // Connect to xAI
      try {
        xaiSocket = new WebSocket(xaiWsUrl, {
          headers: {
            'Authorization': `Bearer ${XAI_API_KEY}`,
            'Content-Type': 'application/json',
          }
        } as any);

        xaiSocket.onopen = () => {
          console.log('Connected to xAI Realtime API');
          isXaiConnected = true;
          
          // Notify client that connection is ready
          clientSocket.send(JSON.stringify({
            type: 'relay.connected',
            message: 'Connected to Grok voice service'
          }));
        };

        xaiSocket.onmessage = (event) => {
          const data = event.data;
          console.log('xAI message received:', typeof data === 'string' ? data.substring(0, 100) : 'binary');
          
          try {
            const message = JSON.parse(data);
            
            // When session is created, send configuration
            if (message.type === 'session.created' && !sessionConfigured) {
              console.log('Session created, sending configuration...');
              sessionConfigured = true;
              
              const sessionUpdate = {
                type: 'session.update',
                session: {
                  voice: voice,
                  instructions: instructions,
                  audio: {
                    input: { format: { type: 'audio/pcm', rate: 24000 } },
                    output: { format: { type: 'audio/pcm', rate: 24000 } },
                  },
                  turn_detection: { type: 'server_vad' },
                },
              };
              
              xaiSocket?.send(JSON.stringify(sessionUpdate));
            }
            
            // Forward all messages to client
            if (isClientConnected && clientSocket.readyState === WebSocket.OPEN) {
              clientSocket.send(data);
            }
          } catch (error) {
            // Binary data or parse error - forward as-is
            if (isClientConnected && clientSocket.readyState === WebSocket.OPEN) {
              clientSocket.send(data);
            }
          }
        };

        xaiSocket.onerror = (error) => {
          console.error('xAI WebSocket error:', error);
          if (isClientConnected && clientSocket.readyState === WebSocket.OPEN) {
            clientSocket.send(JSON.stringify({
              type: 'error',
              error: { message: 'Connection to Grok service failed' }
            }));
          }
        };

        xaiSocket.onclose = (event) => {
          console.log('xAI WebSocket closed:', event.code, event.reason);
          isXaiConnected = false;
          
          if (isClientConnected && clientSocket.readyState === WebSocket.OPEN) {
            clientSocket.send(JSON.stringify({
              type: 'relay.disconnected',
              code: event.code,
              reason: event.reason || 'Grok service disconnected'
            }));
            clientSocket.close(1000, 'xAI connection closed');
          }
        };
      } catch (error) {
        console.error('Error connecting to xAI:', error);
        clientSocket.send(JSON.stringify({
          type: 'error',
          error: { message: 'Failed to connect to Grok service' }
        }));
        clientSocket.close(1011, 'Failed to connect to xAI');
      }
    };

    // Forward client messages to xAI
    clientSocket.onmessage = (event) => {
      const data = event.data;
      console.log('Client message received:', typeof data === 'string' ? data.substring(0, 100) : 'binary');
      
      if (isXaiConnected && xaiSocket?.readyState === WebSocket.OPEN) {
        xaiSocket.send(data);
      } else {
        console.warn('Cannot forward message - xAI not connected');
      }
    };

    clientSocket.onerror = (error) => {
      console.error('Client WebSocket error:', error);
    };

    clientSocket.onclose = (event) => {
      console.log('Client WebSocket closed:', event.code, event.reason);
      isClientConnected = false;
      
      // Close xAI connection when client disconnects
      if (xaiSocket?.readyState === WebSocket.OPEN) {
        xaiSocket.close(1000, 'Client disconnected');
      }
    };

    return response;

  } catch (error) {
    console.error('Error in grok-voice-relay:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
