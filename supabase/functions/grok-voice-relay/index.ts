import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Debug logging levels: 'off' (default), 'basic', 'verbose'
type DebugLevel = 'off' | 'basic' | 'verbose';

// Get effective debug level from env var or query param
function getDebugLevel(url: URL): DebugLevel {
  const paramLevel = url.searchParams.get('debug');
  if (paramLevel === 'basic' || paramLevel === 'verbose') {
    return paramLevel;
  }
  const envLevel = Deno.env.get('DEBUG_LEVEL') || 'off';
  if (envLevel === 'basic' || envLevel === 'verbose') {
    return envLevel;
  }
  return 'off';
}

// Debug logging helper
function createLogger(debugLevel: DebugLevel) {
  return {
    basic: (msg: string) => {
      if (debugLevel === 'off') return;
      console.log(`[grok-relay:BASIC] ${msg}`);
    },
    verbose: (msg: string) => {
      if (debugLevel !== 'verbose') return;
      console.log(`[grok-relay:VERBOSE] ${msg}`);
    },
    error: (msg: string, data?: unknown) => {
      console.error(`[grok-relay:ERROR] ${msg}`, data ?? '');
    },
    always: (msg: string) => {
      console.log(`[grok-relay] ${msg}`);
    }
  };
}

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
    
    // Initialize debug logger
    const debugLevel = getDebugLevel(url);
    const log = createLogger(debugLevel);

    log.always('====== New WebSocket connection ======');
    log.always(`Timestamp: ${new Date().toISOString()}`);
    log.basic(`Debug level: ${debugLevel}`);
    log.basic(`Voice: ${voice}`);
    log.basic(`Has custom instructions: ${!!customInstructions}`);
    log.basic(`ElevenLabs fallback available: ${!!ELEVENLABS_API_KEY}`);
    log.verbose(`Full instructions: ${instructions.substring(0, 100)}...`);

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
        log.error('ElevenLabs API key not available for fallback');
        return false;
      }

      log.basic('====== Connecting to ElevenLabs TTS fallback ======');
      
      try {
        const elUrl = `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_FALLBACK_VOICE}/stream-input?model_id=eleven_turbo_v2_5&optimize_streaming_latency=3`;
        log.verbose(`ElevenLabs URL: ${elUrl}`);
        
        const elResponse = await fetch(elUrl, {
          method: "GET",
          headers: {
            "Upgrade": "websocket",
            "Connection": "Upgrade",
            "xi-api-key": ELEVENLABS_API_KEY,
          },
        });

        if (elResponse.status !== 101) {
          log.error(`ElevenLabs upgrade failed: ${elResponse.status}`);
          return false;
        }

        const ws = (elResponse as any).webSocket;
        if (!ws) {
          log.error('No WebSocket in ElevenLabs response');
          return false;
        }

        ws.accept();
        elevenLabsWs = ws;
        isFallbackMode = true;

        log.basic('✓ Connected to ElevenLabs TTS fallback');

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
            log.verbose(`← ElevenLabs: ${JSON.stringify(data).substring(0, 100)}`);
            
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
              log.basic('ElevenLabs audio generation complete');
            }
          } catch {
            // Binary audio data
            log.verbose('← ElevenLabs: binary audio data');
            if (isClientConnected && clientSocket.readyState === WebSocket.OPEN) {
              clientSocket.send(event.data);
            }
          }
        };

        ws.onerror = (error: Event) => {
          log.error('ElevenLabs error', error);
        };

        ws.onclose = (event: CloseEvent) => {
          log.basic(`ElevenLabs closed: ${event.code}`);
          elevenLabsWs = null;
        };

        return true;
      } catch (error) {
        log.error('ElevenLabs fallback error', error);
        return false;
      }
    };

    // Try to connect to xAI using subprotocol authentication (OpenAI-style)
    const connectToXaiWithSubprotocol = async (): Promise<WebSocket | null> => {
      log.basic('Trying subprotocol authentication...');
      
      try {
        const ws = new WebSocket('wss://api.x.ai/v1/realtime', [
          'realtime',
          `xai-api-key.${XAI_API_KEY}`,
        ]);
        
        // Wait for connection with timeout
        return await new Promise<WebSocket | null>((resolve) => {
          const timeout = setTimeout(() => {
            log.verbose('Subprotocol connection timeout');
            ws.close();
            resolve(null);
          }, 5000);
          
          ws.onopen = () => {
            log.basic('✓ Subprotocol connection successful');
            clearTimeout(timeout);
            resolve(ws);
          };
          
          ws.onerror = () => {
            log.verbose('Subprotocol connection error');
            clearTimeout(timeout);
            resolve(null);
          };
          
          ws.onclose = () => {
            clearTimeout(timeout);
            resolve(null);
          };
        });
      } catch (error) {
        log.verbose(`Subprotocol attempt failed: ${error instanceof Error ? error.message : 'Unknown'}`);
        return null;
      }
    };

    // Connect to xAI using fetch with upgrade headers (fallback method)
    const connectToXaiWithFetch = async (): Promise<WebSocket | null> => {
      log.basic('Trying fetch upgrade authentication...');
      
      try {
        const xaiResponse = await fetch("https://api.x.ai/v1/realtime", {
          method: "GET",
          headers: {
            "Upgrade": "websocket",
            "Connection": "Upgrade",
            "Authorization": `Bearer ${XAI_API_KEY}`,
          },
        });
        
        log.basic(`Fetch response status: ${xaiResponse.status}`);
        
        if (xaiResponse.status !== 101) {
          const errorText = await xaiResponse.text().catch(() => 'Unknown error');
          log.error(`WebSocket upgrade failed: ${xaiResponse.status}`, errorText);
          return null;
        }
        
        const ws = (xaiResponse as any).webSocket;
        if (!ws) {
          log.error('No WebSocket in upgrade response');
          return null;
        }
        
        ws.accept();
        log.basic('✓ Fetch upgrade connection successful');
        return ws;
      } catch (error) {
        log.error(`Fetch upgrade failed: ${error instanceof Error ? error.message : 'Unknown'}`);
        return null;
      }
    };

    // Main connection function - tries subprotocol first, then fetch upgrade, then fallback
    const connectToXai = async () => {
      log.basic('====== Connecting to xAI WebSocket ======');
      
      try {
        const connectStartTime = Date.now();
        let connectionMethod = '';
        
        // Strategy 1: Try subprotocol authentication first (if xAI supports it like OpenAI)
        log.verbose('Strategy 1: Attempting subprotocol authentication');
        let ws = await connectToXaiWithSubprotocol();
        
        if (ws) {
          connectionMethod = 'subprotocol';
        } else {
          // Strategy 2: Fall back to fetch upgrade with Authorization header
          log.verbose('Strategy 2: Falling back to fetch upgrade');
          ws = await connectToXaiWithFetch();
          
          if (ws) {
            connectionMethod = 'fetch_upgrade';
          }
        }
        
        if (!ws) {
          log.error('Both connection strategies failed');
          
          // Strategy 3: Try ElevenLabs fallback
          if (ELEVENLABS_API_KEY) {
            log.basic('Strategy 3: Attempting ElevenLabs TTS fallback...');
            const fallbackSuccess = await connectToElevenLabs();
            if (fallbackSuccess) {
              return; // Fallback successful
            }
          }
          
          throw new Error('Failed to connect to voice service');
        }
        
        xaiSocket = ws;
        const elapsed = Date.now() - connectStartTime;
        log.basic(`✓ Connected to xAI Realtime API via ${connectionMethod} (${elapsed}ms)`);
        isXaiConnected = true;
        
        if (connectionTimeout) {
          clearTimeout(connectionTimeout);
          connectionTimeout = null;
        }
        
        // Notify client that connection is ready (include connection method for diagnostics)
        if (clientSocket.readyState === WebSocket.OPEN) {
          clientSocket.send(JSON.stringify({
            type: 'relay.connected',
            message: 'Connected to Grok voice service',
            connectionMethod: connectionMethod
          }));
        }

        ws.onmessage = (event: MessageEvent) => {
          const data = event.data;
          try {
            const message = JSON.parse(data);
            log.basic(`← xAI: ${message.type}`);
            log.verbose(`← xAI full: ${JSON.stringify(message).substring(0, 500)}`);
            
            // When session is created, send configuration
            if (message.type === 'session.created' && !sessionConfigured) {
              log.basic('Session created, configuring...');
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
              
              log.basic(`→ xAI: session.update (voice: ${voice})`);
              log.verbose(`→ xAI: ${JSON.stringify(sessionUpdate)}`);
              ws.send(JSON.stringify(sessionUpdate));
            }
            
            if (message.type === 'session.updated') {
              log.basic('✓ Session configured successfully');
            }
            
            if (message.type === 'error') {
              log.error(`xAI error: ${JSON.stringify(message.error || message)}`);
            }
            
            // Forward all messages to client
            if (isClientConnected && clientSocket.readyState === WebSocket.OPEN) {
              clientSocket.send(data);
            }
          } catch {
            // Binary data or parse error - forward as-is
            log.verbose('← xAI: binary/unparseable data');
            if (isClientConnected && clientSocket.readyState === WebSocket.OPEN) {
              clientSocket.send(data);
            }
          }
        };

        ws.onerror = (error: Event) => {
          const errorEvent = error as ErrorEvent;
          log.error(`xAI WebSocket error - type: ${errorEvent.type}, message: ${errorEvent.message || 'Unknown'}, wasConnected: ${isXaiConnected}`);
          
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
          log.basic(`xAI WebSocket closed - code: ${event.code}, reason: ${event.reason || '(none)'}, wasConnected: ${isXaiConnected}`);
          
          const wasConnected = isXaiConnected;
          isXaiConnected = false;
          
          // If connection dropped unexpectedly, try fallback
          if (!isFallbackMode && event.code !== 1000 && ELEVENLABS_API_KEY) {
            log.basic('xAI connection lost, trying ElevenLabs fallback...');
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
        log.error('Connection error', error);
        
        // Try ElevenLabs fallback on connection error
        if (ELEVENLABS_API_KEY && !isFallbackMode) {
          log.basic('Primary connection failed, trying ElevenLabs fallback...');
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
      log.basic('Client WebSocket connected');
      log.basic('Initiating connection to xAI...');
      
      // Set connection timeout (15 seconds for WebSocket connection)
      connectionTimeout = setTimeout(() => {
        if (!isXaiConnected && !isFallbackMode) {
          log.error('Connection to xAI timed out after 15s');
          xaiSocket?.close();
          
          // Try fallback on timeout
          if (ELEVENLABS_API_KEY) {
            log.basic('Timeout reached, trying ElevenLabs fallback...');
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
          log.basic(`→ backend: ${parsed.type || 'unknown'}${isFallbackMode ? ' (fallback)' : ''}`);
          log.verbose(`→ backend full: ${data.substring(0, 300)}`);
          
          // In fallback mode, handle text messages for TTS
          if (isFallbackMode && elevenLabsWs?.readyState === WebSocket.OPEN) {
            if (parsed.type === 'conversation.item.create' && parsed.item?.content) {
              // Extract text from user message and send to ElevenLabs
              const textContent = parsed.item.content.find((c: any) => c.type === 'input_text');
              if (textContent?.text) {
                log.basic(`→ ElevenLabs TTS: ${textContent.text.substring(0, 50)}...`);
                elevenLabsWs.send(JSON.stringify({
                  text: textContent.text + " ",
                  flush: true
                }));
              }
            }
            return;
          }
        } catch {
          log.basic('→ backend: text message (parse failed)');
        }
      } else {
        log.verbose('→ backend: audio data');
      }
      
      // Forward to xAI if connected
      if (isXaiConnected && xaiSocket?.readyState === WebSocket.OPEN) {
        xaiSocket.send(data);
      } else if (!isFallbackMode) {
        log.error(`Cannot forward - xAI not connected (state: ${xaiSocket?.readyState})`);
      }
    };

    clientSocket.onerror = (error) => {
      log.error('Client WebSocket error', error);
    };

    clientSocket.onclose = (event) => {
      log.basic(`Client WebSocket closed: ${event.code} ${event.reason || '(no reason)'}`);
      isClientConnected = false;
      
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
      }
      
      // Close xAI connection when client disconnects
      if (xaiSocket?.readyState === WebSocket.OPEN) {
        log.basic('Closing xAI connection...');
        xaiSocket.close(1000, 'Client disconnected');
      }
      
      // Close ElevenLabs connection when client disconnects
      if (elevenLabsWs?.readyState === WebSocket.OPEN) {
        log.basic('Closing ElevenLabs connection...');
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
