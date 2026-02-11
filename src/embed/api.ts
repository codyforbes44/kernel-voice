// Widget-specific API calls

const SUPABASE_URL = (typeof window !== 'undefined' && (window as any).__KERNEL_SUPABASE_URL__) || 'https://kombipftuhjetrhnaklu.supabase.co';
const SUPABASE_ANON_KEY = (typeof window !== 'undefined' && (window as any).__KERNEL_SUPABASE_KEY__) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvbWJpcGZ0dWhqZXRyaG5ha2x1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NzU4NDEsImV4cCI6MjA4NjM1MTg0MX0.KtVyIyus4l17LNaHMBelVZ-ypYGY5dvRw1v-9441_BI';

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
