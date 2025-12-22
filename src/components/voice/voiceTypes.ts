// Voice Provider Types and Constants

export interface OpenAIVoiceSettings {
  temperature: number;      // 0.6-1.2, controls response creativity
  vadThreshold: number;     // 0.0-1.0, voice activity detection sensitivity
  silenceDuration: number;  // 200-2000ms, silence before response
}

export interface GrokVoiceSettings {
  vadThreshold: number;     // 0.0-1.0, voice activity detection sensitivity
  silenceDuration: number;  // 100-1000ms, silence before response
  prefixPadding: number;    // 100-500ms, audio before speech detection
}

export type OpenAISettingsPreset = 'fast' | 'balanced' | 'relaxed' | 'custom';
export type GrokSettingsPreset = 'fast' | 'balanced' | 'relaxed' | 'custom';

export type VoiceProvider = 'elevenlabs' | 'grok' | 'openai';
export type GrokVoice = 'Charon' | 'Celeste' | 'Clio' | 'Zephyr' | 'Sol';
export type OpenAIVoice = 'alloy' | 'ash' | 'ballad' | 'coral' | 'echo' | 'sage' | 'shimmer' | 'verse';

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

export const GROK_PRESETS: Record<Exclude<GrokSettingsPreset, 'custom'>, { settings: GrokVoiceSettings; label: string; description: string }> = {
  fast: {
    label: 'Fast',
    description: 'Quick responses, responsive',
    settings: { vadThreshold: 0.3, silenceDuration: 100, prefixPadding: 200 },
  },
  balanced: {
    label: 'Balanced',
    description: 'Good mix of speed and accuracy',
    settings: { vadThreshold: 0.5, silenceDuration: 200, prefixPadding: 300 },
  },
  relaxed: {
    label: 'Relaxed',
    description: 'Waits longer before responding',
    settings: { vadThreshold: 0.6, silenceDuration: 400, prefixPadding: 400 },
  },
};

// Default settings
export const DEFAULT_OPENAI_SETTINGS: OpenAIVoiceSettings = OPENAI_PRESETS.balanced.settings;
export const DEFAULT_GROK_SETTINGS: GrokVoiceSettings = GROK_PRESETS.balanced.settings;

// Provider info
export const providerInfo = {
  elevenlabs: {
    name: 'ElevenLabs',
    description: 'Premium voice quality',
    features: ['Voice cloning', 'Natural prosody'],
  },
  grok: {
    name: 'Grok',
    description: '100+ languages, built-in search',
    features: ['Auto language detect', 'Web search', 'X search'],
  },
  openai: {
    name: 'OpenAI',
    description: 'GPT-4o Realtime, low latency',
    features: ['WebRTC', 'Fast response', 'Tool calling'],
  },
};

// Voice options
export const grokVoices: { id: GrokVoice; name: string; type: string; tone: string; description: string }[] = [
  { id: 'Charon', name: 'Charon', type: 'Male', tone: 'Deep, calming', description: 'Default voice, smooth and articulate' },
  { id: 'Celeste', name: 'Celeste', type: 'Female', tone: 'Warm, melodic', description: 'Friendly and expressive' },
  { id: 'Clio', name: 'Clio', type: 'Female', tone: 'Clear, professional', description: 'Articulate and precise' },
  { id: 'Zephyr', name: 'Zephyr', type: 'Neutral', tone: 'Light, airy', description: 'Gentle and versatile' },
  { id: 'Sol', name: 'Sol', type: 'Male', tone: 'Energetic, bright', description: 'Dynamic and engaging' },
];

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
export const VALID_GROK_VOICES: GrokVoice[] = ['Charon', 'Celeste', 'Clio', 'Zephyr', 'Sol'];
export const VALID_OPENAI_VOICES: OpenAIVoice[] = ['alloy', 'ash', 'ballad', 'coral', 'echo', 'sage', 'shimmer', 'verse'];
export const VALID_PROVIDERS: VoiceProvider[] = ['elevenlabs', 'grok', 'openai'];
