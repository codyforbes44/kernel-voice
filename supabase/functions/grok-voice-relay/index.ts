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

// Fetch ephemeral token from xAI
async function fetchEphemeralToken(apiKey: string): Promise<string> {
  console.log('Fetching ephemeral token from xAI...');
  
  // Use the correct endpoint for client secrets
  const response = await fetch('https://api.x.ai/v1/realtime/client_secrets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'grok-2-public',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to get ephemeral token:', response.status, errorText);
    throw new Error(`Failed to get ephemeral token: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  console.log('Ephemeral token response:', JSON.stringify(data).substring(0, 200));
  
  // xAI returns the token in client_secret.value
  const token = data.client_secret?.value || data.value || data.token;
  if (!token) {
    console.error('No token found in response:', data);
    throw new Error('No ephemeral token in response');
  }
  
  console.log('Successfully obtained ephemeral token');
  return token;
}

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
    
    let xaiSocket: WebSocket | null = null;
    let isClientConnected = true;
    let isXaiConnected = false;
    let sessionConfigured = false;
    let connectionTimeout: number | null = null;

    // Connect to xAI with the ephemeral token
    const connectToXai = (ephemeralToken: string) => {
      // Use 'key' parameter as per xAI documentation
      const xaiWsUrl = `wss://api.x.ai/v1/realtime?model=grok-2-public&key=${ephemeralToken}`;
      
      console.log('Connecting to xAI Realtime API...');
      
      xaiSocket = new WebSocket(xaiWsUrl);
      
      xaiSocket.onopen = () => {
        if (connectionTimeout) {
          clearTimeout(connectionTimeout);
          connectionTimeout = null;
        }
        console.log('Connected to xAI Realtime API');
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
                input_audio_format: 'pcm16',
                output_audio_format: 'pcm16',
                turn_detection: { type: 'server_vad' },
              },
            };
            
            xaiSocket?.send(JSON.stringify(sessionUpdate));
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

      xaiSocket.onerror = (error) => {
        console.error('xAI WebSocket error:', error);
        
        if (!isXaiConnected && isClientConnected && clientSocket.readyState === WebSocket.OPEN) {
          clientSocket.send(JSON.stringify({
            type: 'error',
            error: { message: 'Failed to connect to Grok service' }
          }));
          clientSocket.close(1011, 'Failed to connect to xAI');
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
      
      // Set connection timeout
      connectionTimeout = setTimeout(() => {
        if (!isXaiConnected) {
          console.log('Connection to xAI timed out');
          xaiSocket?.close();
          if (isClientConnected && clientSocket.readyState === WebSocket.OPEN) {
            clientSocket.send(JSON.stringify({
              type: 'error',
              error: { message: 'Connection to Grok service timed out' }
            }));
            clientSocket.close(1011, 'Connection timeout');
          }
        }
      }, 10000) as unknown as number;
    };

    // Handle client connection open
    clientSocket.onopen = async () => {
      console.log('Client WebSocket connected');
      
      try {
        // Fetch ephemeral token first
        const ephemeralToken = await fetchEphemeralToken(XAI_API_KEY);
        
        // Connect to xAI with the token
        connectToXai(ephemeralToken);
        
      } catch (error) {
        console.error('Error getting ephemeral token:', error);
        if (clientSocket.readyState === WebSocket.OPEN) {
          clientSocket.send(JSON.stringify({
            type: 'error',
            error: { message: error instanceof Error ? error.message : 'Failed to initialize Grok service' }
          }));
          clientSocket.close(1011, 'Failed to get ephemeral token');
        }
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
      
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
      }
      
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
