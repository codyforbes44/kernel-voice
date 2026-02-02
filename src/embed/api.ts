// Widget-specific API calls

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface ChatRequest {
  message: string;
  apiKey: string;
  sessionId: string;
  systemPrompt?: string;
  enableKB?: boolean;
  kbDocumentIds?: string[];
}

interface ChatResponse {
  response: string;
  error?: string;
}

export async function sendWidgetMessage(request: ChatRequest): Promise<ChatResponse> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/widget-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        message: request.message,
        apiKey: request.apiKey,
        sessionId: request.sessionId,
        systemPrompt: request.systemPrompt,
        enableKB: request.enableKB,
        kbDocumentIds: request.kbDocumentIds,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return { response: data.response };
  } catch (error) {
    console.error('Widget chat error:', error);
    return { 
      response: '', 
      error: error instanceof Error ? error.message : 'An error occurred' 
    };
  }
}

export async function trackWidgetEvent(
  apiKey: string,
  eventType: 'open' | 'message' | 'close' | 'error',
  eventData: Record<string, unknown> = {},
  sessionId?: string
): Promise<void> {
  try {
    await fetch(`${SUPABASE_URL}/functions/v1/widget-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        action: 'track',
        apiKey,
        eventType,
        eventData,
        sessionId,
        referrerDomain: window.location.hostname,
      }),
    });
  } catch (error) {
    console.error('Widget analytics error:', error);
  }
}
