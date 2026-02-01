// Voice Provider Types and Constants

export interface OpenAIVoiceSettings {
  temperature: number;      // 0.6-1.2, controls response creativity
  vadThreshold: number;     // 0.0-1.0, voice activity detection sensitivity
  silenceDuration: number;  // 200-2000ms, silence before response
}

export type OpenAISettingsPreset = 'fast' | 'balanced' | 'relaxed' | 'custom';

export type VoiceProvider = 'elevenlabs' | 'openai';
export type OpenAIVoice = 'alloy' | 'ash' | 'ballad' | 'coral' | 'echo' | 'sage' | 'shimmer' | 'verse';

// Connection phase type (used by OpenAI)
export type ConnectionPhase = 'idle' | 'getting_token' | 'connecting_webrtc' | 'configuring' | 'ready' | 'error';

// Tool execution type
export interface ToolExecution {
  name: string;
  status: 'calling' | 'executing' | 'completed' | 'error';
  startedAt: Date;
}

// Presets
export const OPENAI_PRESETS: Record<Exclude<OpenAISettingsPreset, 'custom'>, { settings: OpenAIVoiceSettings; label: string; description: string }> = {
  fast: {
    label: 'Fast',
    description: 'Quick responses, may interrupt',
    settings: { temperature: 0.7, vadThreshold: 0.3, silenceDuration: 300 },
  },
  balanced: {
    label: 'Balanced',
    description: 'Good mix of speed and accuracy',
    settings: { temperature: 0.8, vadThreshold: 0.5, silenceDuration: 500 },
  },
  relaxed: {
    label: 'Relaxed',
    description: 'Waits longer, more creative',
    settings: { temperature: 1.0, vadThreshold: 0.6, silenceDuration: 1000 },
  },
};

// Default settings
export const DEFAULT_OPENAI_SETTINGS: OpenAIVoiceSettings = OPENAI_PRESETS.balanced.settings;

// Provider info
export const providerInfo = {
  elevenlabs: {
    name: 'ElevenLabs',
    description: 'Premium voice quality',
    features: ['Voice cloning', 'Natural prosody'],
  },
  openai: {
    name: 'OpenAI',
    description: 'GPT-4o Realtime, low latency',
    features: ['WebRTC', 'Fast response', 'Tool calling'],
  },
};

// Voice options
export const openaiVoices: { id: OpenAIVoice; name: string; type: string; tone: string; description: string }[] = [
  { id: 'alloy', name: 'Alloy', type: 'Neutral', tone: 'Balanced, clear', description: 'Default versatile voice' },
  { id: 'ash', name: 'Ash', type: 'Male', tone: 'Warm, confident', description: 'Professional and engaging' },
  { id: 'ballad', name: 'Ballad', type: 'Neutral', tone: 'Soft, melodic', description: 'Gentle and soothing' },
  { id: 'coral', name: 'Coral', type: 'Female', tone: 'Friendly, warm', description: 'Approachable and natural' },
  { id: 'echo', name: 'Echo', type: 'Male', tone: 'Clear, direct', description: 'Crisp and articulate' },
  { id: 'sage', name: 'Sage', type: 'Female', tone: 'Calm, wise', description: 'Thoughtful and measured' },
  { id: 'shimmer', name: 'Shimmer', type: 'Female', tone: 'Bright, energetic', description: 'Upbeat and cheerful' },
  { id: 'verse', name: 'Verse', type: 'Neutral', tone: 'Expressive, dynamic', description: 'Versatile and emotive' },
];

// Valid voice values for validation
export const VALID_OPENAI_VOICES: OpenAIVoice[] = ['alloy', 'ash', 'ballad', 'coral', 'echo', 'sage', 'shimmer', 'verse'];
export const VALID_PROVIDERS: VoiceProvider[] = ['elevenlabs', 'openai'];
