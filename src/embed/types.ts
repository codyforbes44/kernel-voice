// Widget configuration types for embeddable chat widget

export interface KernelWidgetConfig {
  // Required
  apiKey: string;

  // Branding
  brandName?: string;
  brandLogo?: string;
  brandColor?: string;
  accentColor?: string;
  textColor?: string;
  backgroundColor?: string;

  // Behavior
  position?: 'bottom-right' | 'bottom-left';
  greeting?: string;
  placeholder?: string;
  systemPrompt?: string;

  // Features
  enableVoice?: boolean;
  enableKB?: boolean;
  kbDocumentIds?: string[];

  // Analytics callbacks
  onConversationStart?: () => void;
  onMessageSent?: (message: string) => void;
  onError?: (error: Error) => void;
}

export interface WidgetMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface WidgetState {
  isOpen: boolean;
  isLoading: boolean;
  messages: WidgetMessage[];
  sessionId: string;
  error: string | null;
}

export interface WidgetThemeValues {
  primaryColor: string;
  accentColor: string;
  textColor: string;
  backgroundColor: string;
  borderRadius: string;
}

// Default configuration values
export const DEFAULT_CONFIG: Partial<KernelWidgetConfig> = {
  brandName: 'AI Assistant',
  brandColor: '#00CED1',
  accentColor: '#00B4D8',
  textColor: '#1a1a1a',
  backgroundColor: '#ffffff',
  position: 'bottom-right',
  greeting: 'Hi! How can I help you today?',
  placeholder: 'Type your message...',
  enableVoice: false,
  enableKB: false,
};

// Generate a unique session ID
export function generateSessionId(): string {
  return `ws_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}
