// Voice Provider Types and Constants

export interface OpenAIVoiceSettings {
  temperature: number;      // 0.6-1.2, controls response creativity
  vadThreshold: number;     // 0.0-1.0, voice activity detection sensitivity
  silenceDuration: number;  // 200-2000ms, silence before response
  firstMessage: string;     // Initial greeting spoken when connection is established
}

export type ElevenLabsLanguage = 'auto' | 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'pl' | 'hi' | 'ar' | 'zh' | 'ja' | 'ko' | 'nl' | 'sv' | 'no' | 'da' | 'fi' | 'cs' | 'ro' | 'hu' | 'tr' | 'uk' | 'el' | 'th' | 'vi' | 'id' | 'ms' | 'fil' | 'bn' | 'ta' | 'he' | 'sw' | 'ru';

export type AgentPersonality = 'friendly' | 'professional' | 'technical' | 'empathetic' | 'custom';

export interface ElevenLabsSettings {
  language: ElevenLabsLanguage;
  autoLanguageDetection: boolean;
  enableRAG: boolean;
  personality: AgentPersonality;
  customPrompt: string;
  customFirstMessage: string;
  elevenlabsAgentId?: string;
  voiceId?: string;
}

export const DEFAULT_ELEVENLABS_SETTINGS: ElevenLabsSettings = {
  language: 'en',
  autoLanguageDetection: true,
  enableRAG: true,
  personality: 'friendly',
  customPrompt: '',
  customFirstMessage: '',
};

export type OpenAISettingsPreset = 'fast' | 'balanced' | 'relaxed' | 'custom';

export type VoiceProvider = 'elevenlabs' | 'openai' | 'vapi' | 'gemini';
export type OpenAIVoice = 'alloy' | 'ash' | 'ballad' | 'coral' | 'echo' | 'sage' | 'shimmer' | 'verse' | 'cedar' | 'marin';

// Gemini Live types
export type GeminiLiveVoice = 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Aoede' | 'Leda' | 'Orus' | 'Zephyr';

export interface GeminiLiveSettings {
  voice: GeminiLiveVoice;
  model: string;
  customPrompt: string;
  customFirstMessage: string;
  audioGateThreshold: number; // 0.005–0.05, RMS noise gate
}

export const DEFAULT_GEMINI_LIVE_SETTINGS: GeminiLiveSettings = {
  voice: 'Puck',
  model: 'gemini-2.5-flash-native-audio-preview-12-2025',
  customPrompt: '',
  customFirstMessage: '',
  audioGateThreshold: 0.01,
};

export const geminiLiveVoices: { id: GeminiLiveVoice; name: string; description: string }[] = [
  { id: 'Puck', name: 'Puck', description: 'Playful and energetic' },
  { id: 'Charon', name: 'Charon', description: 'Deep and authoritative' },
  { id: 'Kore', name: 'Kore', description: 'Warm and natural' },
  { id: 'Fenrir', name: 'Fenrir', description: 'Bold and confident' },
  { id: 'Aoede', name: 'Aoede', description: 'Melodic and expressive' },
  { id: 'Leda', name: 'Leda', description: 'Clear and articulate' },
  { id: 'Orus', name: 'Orus', description: 'Calm and measured' },
  { id: 'Zephyr', name: 'Zephyr', description: 'Light and breezy' },
];

// VAPI Settings
export interface VAPISettings {
  assistantId: string;
  enableRecording: boolean;
  hipaaEnabled: boolean;
  backgroundDenoisingEnabled: boolean;
}

export const DEFAULT_VAPI_SETTINGS: VAPISettings = {
  assistantId: '',
  enableRecording: false,
  hipaaEnabled: false,
  backgroundDenoisingEnabled: true,
};

// Connection phase type (used by OpenAI and Gemini)
export type ConnectionPhase = 'idle' | 'getting_token' | 'connecting_webrtc' | 'configuring' | 'ready' | 'error';

// Tool execution type
export interface ToolExecution {
  name: string;
  status: 'calling' | 'executing' | 'completed' | 'error';
  startedAt: Date;
}

// Presets optimized for gpt-4o-realtime-preview-2025-06-03
// Base settings without firstMessage (used for presets comparison)
export interface OpenAIPresetSettings {
  temperature: number;
  vadThreshold: number;
  silenceDuration: number;
}

export const OPENAI_PRESETS: Record<Exclude<OpenAISettingsPreset, 'custom'>, { settings: OpenAIPresetSettings; label: string; description: string }> = {
  fast: {
    label: 'Snappy',
    description: 'Quick back-and-forth',
    settings: { temperature: 0.6, vadThreshold: 0.45, silenceDuration: 400 },
  },
  balanced: {
    label: 'Natural',
    description: 'Conversational flow',
    settings: { temperature: 0.8, vadThreshold: 0.55, silenceDuration: 600 },
  },
  relaxed: {
    label: 'Thoughtful',
    description: 'Patient, detailed responses',
    settings: { temperature: 1.0, vadThreshold: 0.7, silenceDuration: 1000 },
  },
};

// Default settings
export const DEFAULT_OPENAI_SETTINGS: OpenAIVoiceSettings = {
  ...OPENAI_PRESETS.balanced.settings,
  firstMessage: "Hello! How can I help you today?",
};

// Provider info
export const providerInfo: Record<VoiceProvider, {
  name: string;
  description: string;
  features: string[];
  isPremium: boolean;
}> = {
  openai: {
    name: '3ʙɪ',
    description: 'Realtime AI, low latency',
    features: ['WebRTC', 'Fast response', 'Tool calling'],
    isPremium: false,
  },
  elevenlabs: {
    name: 'ElevenLabs',
    description: 'Premium voices, auto-language',
    features: ['29+ Languages', 'Auto-detect', 'Knowledge Base'],
    isPremium: true,
  },
  vapi: {
    name: 'VAPI',
    description: 'Voice agents, phone calling',
    features: ['Phone Integration', '20+ Languages', 'Tool calling'],
    isPremium: true,
  },
  gemini: {
    name: 'Gemini Live',
    description: 'Native audio, 30 HD voices',
    features: ['WebSocket', '24 Languages', 'Native Audio'],
    isPremium: true,
  },
};

// Voice options - organized by category
export const openaiVoices: { id: OpenAIVoice; name: string; type: string; tone: string; description: string; isNew?: boolean }[] = [
  // New voices (2025)
  { id: 'cedar', name: 'Cedar', type: 'Male', tone: 'Grounded, steady', description: 'Calm and reassuring presence', isNew: true },
  { id: 'marin', name: 'Marin', type: 'Female', tone: 'Warm, articulate', description: 'Clear and engaging delivery', isNew: true },
  // Original voices
  { id: 'alloy', name: 'Alloy', type: 'Neutral', tone: 'Balanced, clear', description: 'Default versatile voice' },
  { id: 'ash', name: 'Ash', type: 'Male', tone: 'Warm, confident', description: 'Professional and engaging' },
  { id: 'ballad', name: 'Ballad', type: 'Neutral', tone: 'Soft, melodic', description: 'Gentle and soothing' },
  { id: 'coral', name: 'Coral', type: 'Female', tone: 'Friendly, warm', description: 'Approachable and natural' },
  { id: 'echo', name: 'Echo', type: 'Male', tone: 'Clear, direct', description: 'Crisp and articulate' },
  { id: 'sage', name: 'Sage', type: 'Female', tone: 'Calm, wise', description: 'Thoughtful and measured' },
  { id: 'shimmer', name: 'Shimmer', type: 'Female', tone: 'Bright, energetic', description: 'Upbeat and cheerful' },
  { id: 'verse', name: 'Verse', type: 'Neutral', tone: 'Expressive, dynamic', description: 'Versatile and emotive' },
];

// Required Questions type
export interface RequiredQuestion {
  id: string;
  question: string;
  type: 'text' | 'email' | 'phone' | 'number' | 'yes_no';
  required: boolean;
}

// Valid voice values for validation
export const VALID_OPENAI_VOICES: OpenAIVoice[] = ['alloy', 'ash', 'ballad', 'coral', 'echo', 'sage', 'shimmer', 'verse', 'cedar', 'marin'];
export const VALID_PROVIDERS: VoiceProvider[] = ['elevenlabs', 'openai', 'vapi', 'gemini'];
