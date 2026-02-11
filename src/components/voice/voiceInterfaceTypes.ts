import { type InputMode } from '@/components/voice/InputModeSelector';
import { type VoiceProvider, type OpenAIVoice, type OpenAIVoiceSettings, type ElevenLabsSettings, type VAPISettings, type GeminiLiveSettings, type ConnectionPhase, type ToolExecution } from '@/components/voice/voiceTypes';

/**
 * Voice settings props - controls voice provider and voice configurations
 */
export interface VoiceSettingsProps {
  voiceProvider: VoiceProvider;
  setVoiceProvider: (provider: VoiceProvider) => void;
  openaiVoice: OpenAIVoice;
  setOpenAIVoice: (voice: OpenAIVoice) => void;
  openaiSettings: OpenAIVoiceSettings;
  setOpenAISettings: (settings: OpenAIVoiceSettings) => void;
  elevenlabsSettings: ElevenLabsSettings;
  setElevenLabsSettings: (settings: ElevenLabsSettings) => void;
  vapiSettings?: VAPISettings;
  setVapiSettings?: (settings: VAPISettings) => void;
  geminiLiveSettings?: GeminiLiveSettings;
  setGeminiLiveSettings?: (settings: GeminiLiveSettings) => void;
  systemPrompt: string;
  setSystemPrompt: (prompt: string) => void;
  providerLoading: boolean;
}

/**
 * Connection state props - status, errors, and connection details
 */
export interface ConnectionStateProps {
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  connectionAuthMethod: string | undefined;
  connectionPhase: ConnectionPhase | undefined;
  isSpeaking: boolean;
  inputAudioLevel: number;
  outputAudioLevel: number;
}

/**
 * Controls props - user interaction controls
 */
export interface ControlsProps {
  isMuted: boolean;
  toggleMute: () => void;
  volume: number;
  setVolume: (v: number) => void;
  inputMode: InputMode;
  setInputMode: (mode: InputMode) => void;
}

/**
 * Actions props - conversation lifecycle actions
 */
export interface ActionsProps {
  startConversation: () => Promise<void>;
  endConversation: () => Promise<void>;
  retryConnection: () => Promise<void>;
  clearConnectionError: () => void;
  sendTextMessage: (text: string) => Promise<void>;
  isProcessingText: boolean;
}

/**
 * Microphone permission props
 */
export interface MicrophonePermissionProps {
  permissionState: 'checking' | 'granted' | 'denied' | 'prompt';
  requestPermission: () => Promise<boolean>;
  isReady: boolean;
}

/**
 * Wake word detection props
 */
export interface WakeWordProps {
  isWakeWordListening: boolean;
  isWakeWordSupported: boolean;
  wakeWordLastHeard: string | null;
}

/**
 * Complete props interface for VoiceInterfaceCard using grouped interfaces
 */
export interface VoiceInterfaceCardProps 
  extends VoiceSettingsProps,
    ConnectionStateProps,
    ControlsProps,
    ActionsProps,
    MicrophonePermissionProps,
    WakeWordProps {
  activeToolCall: ToolExecution | null;
  isAuthenticated: boolean;
  isMobile: boolean;
  isPaused: boolean;
  onResume: () => void;
  onSaveAgent?: () => void;
}
