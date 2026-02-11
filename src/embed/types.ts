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

  // Appearance
  darkMode?: boolean;
  borderRadius?: 'sharp' | 'rounded' | 'pill';
  headerStyle?: 'gradient' | 'solid' | 'minimal';
  bubbleStyle?: 'rounded' | 'sharp' | 'pill';

  // Features
  enableVoice?: boolean;
  voiceProvider?: 'native' | 'elevenlabs';
  waveformStyle?: 'bars' | 'wave' | 'circular';
  enableTTS?: boolean;
  ttsVoiceId?: string;
  enableKB?: boolean;
  kbDocumentIds?: string[];

  // Voice conversation mode
  enableVoiceConversation?: boolean;
  autoListen?: boolean;
  elevenlabsAgentId?: string;

  // Backend config (set automatically when embedding)
  supabaseUrl?: string;
  supabaseKey?: string;

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
  bubbleRadius: string;
  isDark: boolean;
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
  voiceProvider: 'native',
  waveformStyle: 'bars',
  enableTTS: false,
  ttsVoiceId: 'EXAVITQu4vr4xnSDxMaL', // Sarah voice
  enableKB: false,
  darkMode: false,
  borderRadius: 'rounded',
  headerStyle: 'gradient',
  bubbleStyle: 'rounded',
  enableVoiceConversation: false,
  autoListen: true,
};

// Generate a unique session ID
export function generateSessionId(): string {
  return `ws_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

// Helper to get border radius value from config
export function getBorderRadiusValue(style?: string): string {
  switch (style) {
    case 'sharp': return '4px';
    case 'pill': return '24px';
    case 'rounded':
    default: return '12px';
  }
}

// Helper to get bubble radius value from config
export function getBubbleRadiusValue(style?: string): string {
  switch (style) {
    case 'sharp': return '4px';
    case 'pill': return '20px';
    case 'rounded':
    default: return '16px';
  }
}
