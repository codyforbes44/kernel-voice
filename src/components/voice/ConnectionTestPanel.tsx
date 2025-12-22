import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, XCircle, Loader2, Wifi, WifiOff, Play, Square, Key, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TestResult {
  phase: string;
  success: boolean;
  message: string;
  timeMs?: number;
}

interface ApiKeyValidationResult {
  success: boolean;
  message: string;
  model?: string;
  responseTimeMs: number;
}

interface ConnectionTestPanelProps {
  className?: string;
}

export function ConnectionTestPanel({ className }: ConnectionTestPanelProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [isValidatingKey, setIsValidatingKey] = useState(false);
  const [keyValidation, setKeyValidation] = useState<ApiKeyValidationResult | null>(null);
  const [results, setResults] = useState<TestResult[]>([]);
  const [currentPhase, setCurrentPhase] = useState<string | null>(null);
  const [connectionMethod, setConnectionMethod] = useState<string | null>(null);
  const [events, setEvents] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const startTimeRef = useRef<number>(0);

  const addResult = useCallback((result: TestResult) => {
    setResults(prev => [...prev, result]);
  }, []);

  const addEvent = useCallback((event: string) => {
    setEvents(prev => [...prev, `[${new Date().toISOString().split('T')[1].slice(0, 12)}] ${event}`]);
  }, []);

  // Validate API key separately before WebSocket test
  const validateApiKey = useCallback(async () => {
    setIsValidatingKey(true);
    setKeyValidation(null);
    addEvent('Validating xAI API key...');

    try {
      const { data, error } = await supabase.functions.invoke('validate-xai-key');
      
      if (error) {
        const result: ApiKeyValidationResult = {
          success: false,
          message: `Validation error: ${error.message}`,
          responseTimeMs: 0
        };
        setKeyValidation(result);
        addEvent(`API key validation failed: ${error.message}`);
      } else {
        setKeyValidation(data as ApiKeyValidationResult);
        addEvent(`API key validation: ${data.success ? 'Valid' : 'Invalid'} (${data.responseTimeMs}ms)`);
      }
    } catch (err) {
      const result: ApiKeyValidationResult = {
        success: false,
        message: err instanceof Error ? err.message : 'Unknown error',
        responseTimeMs: 0
      };
      setKeyValidation(result);
      addEvent(`API key validation error: ${result.message}`);
    } finally {
      setIsValidatingKey(false);
    }
  }, [addEvent]);

  // Test direct xAI connection with ephemeral token
  const runTest = useCallback(async () => {
    setIsRunning(true);
    setResults([]);
    setEvents([]);
    setCurrentPhase('init');
    setConnectionMethod(null);
    startTimeRef.current = Date.now();

    addResult({ phase: 'init', success: true, message: 'Starting direct xAI connection test' });
    addEvent('Starting connection test...');

    try {
      // Step 1: Get ephemeral token
      setCurrentPhase('fetching_token');
      addEvent('Fetching ephemeral token from edge function...');
      
      const { data: tokenData, error: tokenError } = await supabase.functions.invoke('xai-session-token', {
        body: {}
      });

      if (tokenError || !tokenData?.client_secret?.value) {
        const errorMsg = tokenError?.message || tokenData?.error || 'Failed to get session token';
        addResult({ phase: 'token', success: false, message: errorMsg });
        addEvent(`Token error: ${errorMsg}`);
        setIsRunning(false);
        return;
      }

      const token = tokenData.client_secret.value;
      const elapsed = Date.now() - startTimeRef.current;
      addResult({ phase: 'token', success: true, message: 'Ephemeral token received', timeMs: elapsed });
      addEvent(`Token fetched in ${elapsed}ms`);

      // Step 2: Connect directly to xAI WebSocket
      setCurrentPhase('connecting');
      const xaiUrl = 'wss://api.x.ai/v1/realtime?model=grok-2-public';
      addEvent(`Connecting to xAI: ${xaiUrl}`);

      const ws = new WebSocket(xaiUrl, [
        'realtime',
        `openai-insecure-api-key.${token}`,
      ]);
      wsRef.current = ws;

      const timeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          ws.close();
          addResult({ phase: 'connecting', success: false, message: 'Connection timeout (15s)' });
          setIsRunning(false);
        }
      }, 15000);

      ws.onopen = () => {
        const elapsed = Date.now() - startTimeRef.current;
        addResult({ phase: 'connecting', success: true, message: 'WebSocket connected to xAI', timeMs: elapsed });
        addEvent(`Connected to xAI in ${elapsed}ms`);
        setCurrentPhase('waiting_session');
        setConnectionMethod('direct_xai');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const elapsed = Date.now() - startTimeRef.current;
          addEvent(`Event: ${data.type}`);

          if (data.type === 'session.created') {
            addResult({ phase: 'session_created', success: true, message: 'Session created by xAI', timeMs: elapsed });
            setCurrentPhase('configuring');
            
            // Send session.update with voice config
            ws.send(JSON.stringify({
              type: 'session.update',
              session: {
                voice: 'Charon',
                instructions: 'You are a helpful assistant.',
                audio: {
                  input: { format: { type: 'audio/pcm', rate: 24000 } },
                  output: { format: { type: 'audio/pcm', rate: 24000 } }
                },
                turn_detection: {
                  type: 'server_vad',
                  threshold: 0.5,
                  prefix_padding_ms: 300,
                  silence_duration_ms: 200
                }
              }
            }));
            addEvent('Sent session.update with voice config');
            
          } else if (data.type === 'session.updated') {
            addResult({ phase: 'session_configured', success: true, message: 'Session configured', timeMs: elapsed });
            setCurrentPhase('ready');
            
            // Test sending a text message
            addEvent('Sending test message...');
            ws.send(JSON.stringify({
              type: 'conversation.item.create',
              item: {
                type: 'message',
                role: 'user',
                content: [{ type: 'input_text', text: 'Hello, this is a connection test. Reply with a single word.' }],
              },
            }));
            ws.send(JSON.stringify({ type: 'response.create' }));
            setCurrentPhase('awaiting_response');
            
          } else if (data.type === 'response.audio.delta' || data.type === 'response.text.delta' || data.type === 'response.audio_transcript.delta') {
            addResult({ phase: 'response', success: true, message: 'Received AI response', timeMs: elapsed });
            setCurrentPhase('complete');
            clearTimeout(timeout);
            
            // Close after successful response
            setTimeout(() => {
              ws.close(1000, 'Test complete');
              setIsRunning(false);
            }, 500);
            
          } else if (data.type === 'response.done') {
            if (currentPhase !== 'complete') {
              addResult({ phase: 'response', success: true, message: 'Response completed', timeMs: elapsed });
              setCurrentPhase('complete');
              clearTimeout(timeout);
              setTimeout(() => {
                ws.close(1000, 'Test complete');
                setIsRunning(false);
              }, 500);
            }
          } else if (data.type === 'error') {
            addResult({ phase: 'error', success: false, message: `xAI error: ${JSON.stringify(data.error || data)}` });
            clearTimeout(timeout);
            ws.close();
            setIsRunning(false);
          }
        } catch (e) {
          addEvent(`Parse error: ${e}`);
        }
      };

      ws.onerror = (error) => {
        addResult({ phase: 'error', success: false, message: 'WebSocket error occurred' });
        addEvent(`Error: ${error}`);
        clearTimeout(timeout);
        setIsRunning(false);
      };

      ws.onclose = (event) => {
        addEvent(`Connection closed: ${event.code} ${event.reason || ''}`);
        if (event.code !== 1000 && isRunning) {
          addResult({ phase: 'closed', success: false, message: `Unexpected close: ${event.code}` });
        }
        setIsRunning(false);
        wsRef.current = null;
      };

    } catch (error) {
      addResult({ phase: 'error', success: false, message: error instanceof Error ? error.message : 'Unknown error' });
      setIsRunning(false);
    }
  }, [addResult, addEvent, currentPhase]);

  const stopTest = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'User cancelled');
      wsRef.current = null;
    }
    setIsRunning(false);
    setCurrentPhase(null);
  }, []);

  const overallSuccess = results.length > 0 && results.every(r => r.success);
  const hasErrors = results.some(r => !r.success);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {isRunning ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : overallSuccess ? (
                <Wifi className="h-5 w-5 text-green-500" />
              ) : hasErrors ? (
                <WifiOff className="h-5 w-5 text-destructive" />
              ) : (
                <Wifi className="h-5 w-5 text-muted-foreground" />
              )}
              xAI Direct Connection Test
            </CardTitle>
            <CardDescription>
              Test ephemeral token + direct browser-to-xAI WebSocket
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={validateApiKey}
              disabled={isValidatingKey || isRunning}
            >
              {isValidatingKey ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Key className="h-4 w-4" />
              )}
            </Button>
            <Button
              size="sm"
              variant={isRunning ? "destructive" : "default"}
              onClick={isRunning ? stopTest : runTest}
            >
              {isRunning ? (
                <>
                  <Square className="h-4 w-4 mr-1" />
                  Stop
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-1" />
                  Run Test
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* API Key Validation Result */}
        {keyValidation && (
          <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
            {keyValidation.success ? (
              <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-destructive shrink-0" />
            )}
            <div className="flex-1 text-sm">
              <span className="font-medium">API Key:</span>{' '}
              <span className={keyValidation.success ? 'text-green-600' : 'text-destructive'}>
                {keyValidation.message}
              </span>
            </div>
            <Badge variant="secondary" className="text-xs">
              {keyValidation.responseTimeMs}ms
            </Badge>
          </div>
        )}

        {/* Current Phase & Connection Method */}
        {(currentPhase || connectionMethod) && (
          <div className="flex items-center gap-2 flex-wrap">
            {currentPhase && (
              <>
                <span className="text-sm text-muted-foreground">Phase:</span>
                <Badge variant="outline" className="capitalize">
                  {currentPhase.replace(/_/g, ' ')}
                </Badge>
              </>
            )}
            {connectionMethod && (
              <>
                <span className="text-sm text-muted-foreground ml-2">Method:</span>
                <Badge variant="secondary" className="capitalize flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  {connectionMethod.replace(/_/g, ' ')}
                </Badge>
              </>
            )}
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm font-medium">Results</span>
            <div className="space-y-1">
              {results.map((result, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  {result.success ? (
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive shrink-0" />
                  )}
                  <span className="text-muted-foreground capitalize">{result.phase.replace(/_/g, ' ')}:</span>
                  <span className={result.success ? 'text-foreground' : 'text-destructive'}>
                    {result.message}
                  </span>
                  {result.timeMs && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {result.timeMs}ms
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Event Log */}
        {events.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm font-medium">Event Log</span>
            <ScrollArea className="h-32 rounded border bg-muted/50 p-2">
              <div className="space-y-0.5 font-mono text-xs">
                {events.map((event, i) => (
                  <div key={i} className="text-muted-foreground">
                    {event}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Empty State */}
        {results.length === 0 && !isRunning && !keyValidation && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Click <Key className="inline h-3 w-3 mx-1" /> to validate API key, or "Run Test" to test direct xAI connection
          </p>
        )}
      </CardContent>
    </Card>
  );
}
