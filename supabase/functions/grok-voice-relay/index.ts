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

// ElevenLabs voice ID for fallback (Sarah - natural sounding)
const ELEVENLABS_FALLBACK_VOICE = "EXAVITQu4vr4xnSDxMaL";

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
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    
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
    console.log('[grok-relay] ElevenLabs fallback available:', !!ELEVENLABS_API_KEY);

    // Upgrade client connection to WebSocket
    const { socket: clientSocket, response } = Deno.upgradeWebSocket(req);
    
    let xaiSocket: WebSocket | null = null;
    let elevenLabsWs: WebSocket | null = null;
    let isClientConnected = true;
    let isXaiConnected = false;
    let isFallbackMode = false;
    let sessionConfigured = false;
    let connectionTimeout: number | null = null;

    // ElevenLabs TTS fallback connection
    const connectToElevenLabs = async () => {
      if (!ELEVENLABS_API_KEY) {
        console.error('[grok-relay] ElevenLabs API key not available for fallback');
        return false;
      }

      console.log('[grok-relay] ====== Connecting to ElevenLabs TTS fallback ======');
      
      try {
        const elUrl = `wss://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_FALLBACK_VOICE}/stream-input?model_id=eleven_turbo_v2_5&optimize_streaming_latency=3`;
        
        const elResponse = await fetch(elUrl, {
          method: "GET",
          headers: {
            "Upgrade": "websocket",
            "Connection": "Upgrade",
            "xi-api-key": ELEVENLABS_API_KEY,
          },
        });

        if (elResponse.status !== 101) {
          console.error('[grok-relay] ElevenLabs upgrade failed:', elResponse.status);
          return false;
        }

        const ws = (elResponse as any).webSocket;
        if (!ws) {
          console.error('[grok-relay] No WebSocket in ElevenLabs response');
          return false;
        }

        ws.accept();
        elevenLabsWs = ws;
        isFallbackMode = true;

        console.log('[grok-relay] ✓ Connected to ElevenLabs TTS fallback');

        // Notify client about fallback mode
        if (clientSocket.readyState === WebSocket.OPEN) {
          clientSocket.send(JSON.stringify({
            type: 'fallback_active',
            message: 'Using ElevenLabs TTS fallback - voice-only mode',
            provider: 'elevenlabs'
          }));
          
          // Send simulated session events for client compatibility
          clientSocket.send(JSON.stringify({ type: 'session.created' }));
          clientSocket.send(JSON.stringify({ type: 'session.updated' }));
        }

        // Initialize ElevenLabs stream
        ws.send(JSON.stringify({
          text: " ",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.5,
            use_speaker_boost: true
          },
          generation_config: {
            chunk_length_schedule: [120, 160, 250, 290]
          }
        }));

        ws.onmessage = (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.audio) {
              // Forward audio to client in Grok-compatible format
              if (isClientConnected && clientSocket.readyState === WebSocket.OPEN) {
                clientSocket.send(JSON.stringify({
                  type: 'response.audio.delta',
                  delta: data.audio
                }));
              }
            }
            
            if (data.isFinal) {
              console.log('[grok-relay] ElevenLabs audio generation complete');
            }
          } catch (e) {
            // Binary audio data
            if (isClientConnected && clientSocket.readyState === WebSocket.OPEN) {
              clientSocket.send(event.data);
            }
          }
        };

        ws.onerror = (error: Event) => {
          console.error('[grok-relay] ElevenLabs error:', error);
        };

        ws.onclose = (event: CloseEvent) => {
          console.log('[grok-relay] ElevenLabs closed:', event.code);
          elevenLabsWs = null;
        };

        return true;
      } catch (error) {
        console.error('[grok-relay] ElevenLabs fallback error:', error);
        return false;
      }
    };

    // Connect to xAI using fetch with upgrade headers (proper Authorization header)
    const connectToXai = async () => {
      console.log('[grok-relay] ====== Connecting to xAI WebSocket ======');
      console.log('[grok-relay] Using fetch with upgrade headers for proper Authorization');
      
      try {
        const connectStartTime = Date.now();
        
        // Use fetch with upgrade headers to properly set Authorization
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
          
          // Provide user-friendly error messages
          let userMessage = 'Failed to connect to voice service';
          if (xaiResponse.status === 401 || xaiResponse.status === 403) {
            userMessage = 'Authentication failed - please check API configuration';
          } else if (xaiResponse.status === 429) {
            userMessage = 'Too many requests - please wait a moment and try again';
          } else if (xaiResponse.status === 402) {
            userMessage = 'Service quota exceeded - please check your xAI billing';
          } else if (xaiResponse.status >= 500) {
            userMessage = 'Voice service is temporarily unavailable';
          }
          
          // Try ElevenLabs fallback
          if (ELEVENLABS_API_KEY) {
            console.log('[grok-relay] Attempting ElevenLabs TTS fallback...');
            const fallbackSuccess = await connectToElevenLabs();
            if (fallbackSuccess) {
              return; // Fallback successful
            }
          }
          
          throw new Error(userMessage);
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

        ws.onclose = async (event: CloseEvent) => {
          console.log('[grok-relay] xAI WebSocket closed');
          console.log('[grok-relay] Close code:', event.code);
          console.log('[grok-relay] Close reason:', event.reason || '(none)');
          console.log('[grok-relay] Was connected:', isXaiConnected);
          
          const wasConnected = isXaiConnected;
          isXaiConnected = false;
          
          // If connection dropped unexpectedly, try fallback
          if (!isFallbackMode && event.code !== 1000 && ELEVENLABS_API_KEY) {
            console.log('[grok-relay] xAI connection lost, trying ElevenLabs fallback...');
            const fallbackSuccess = await connectToElevenLabs();
            if (fallbackSuccess) {
              return; // Don't close client connection
            }
          }
          
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
        
        // Try ElevenLabs fallback on connection error
        if (ELEVENLABS_API_KEY && !isFallbackMode) {
          console.log('[grok-relay] Primary connection failed, trying ElevenLabs fallback...');
          const fallbackSuccess = await connectToElevenLabs();
          if (fallbackSuccess) {
            return; // Fallback successful
          }
        }
        
        if (isClientConnected && clientSocket.readyState === WebSocket.OPEN) {
          clientSocket.send(JSON.stringify({
            type: 'error',
            error: { 
              message: 'Failed to initialize voice connection',
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
        if (!isXaiConnected && !isFallbackMode) {
          console.error('[grok-relay] ✗ Connection to xAI timed out after 15s');
          xaiSocket?.close();
          
          // Try fallback on timeout
          if (ELEVENLABS_API_KEY) {
            console.log('[grok-relay] Timeout reached, trying ElevenLabs fallback...');
            connectToElevenLabs().then(success => {
              if (!success && isClientConnected && clientSocket.readyState === WebSocket.OPEN) {
                clientSocket.send(JSON.stringify({
                  type: 'error',
                  error: { message: 'Connection to voice service timed out' }
                }));
                clientSocket.close(1011, 'Connection timeout');
              }
            });
          } else if (isClientConnected && clientSocket.readyState === WebSocket.OPEN) {
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

    // Forward client messages to xAI or handle in fallback mode
    clientSocket.onmessage = (event) => {
      const data = event.data;
      
      if (typeof data === 'string') {
        try {
          const parsed = JSON.parse(data);
          console.log('[grok-relay] → backend:', parsed.type || 'unknown', isFallbackMode ? '(fallback)' : '');
          
          // In fallback mode, handle text messages for TTS
          if (isFallbackMode && elevenLabsWs?.readyState === WebSocket.OPEN) {
            if (parsed.type === 'conversation.item.create' && parsed.item?.content) {
              // Extract text from user message and send to ElevenLabs
              const textContent = parsed.item.content.find((c: any) => c.type === 'input_text');
              if (textContent?.text) {
                console.log('[grok-relay] → ElevenLabs TTS:', textContent.text.substring(0, 50) + '...');
                elevenLabsWs.send(JSON.stringify({
                  text: textContent.text + " ",
                  flush: true
                }));
              }
            }
            return;
          }
        } catch {
          console.log('[grok-relay] → backend: text message');
        }
      } else {
        console.log('[grok-relay] → backend: audio data');
      }
      
      // Forward to xAI if connected
      if (isXaiConnected && xaiSocket?.readyState === WebSocket.OPEN) {
        xaiSocket.send(data);
      } else if (!isFallbackMode) {
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
      
      // Close ElevenLabs connection when client disconnects
      if (elevenLabsWs?.readyState === WebSocket.OPEN) {
        console.log('[grok-relay] Closing ElevenLabs connection...');
        elevenLabsWs.send(JSON.stringify({ text: "" })); // Close stream
        elevenLabsWs.close(1000, 'Client disconnected');
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
