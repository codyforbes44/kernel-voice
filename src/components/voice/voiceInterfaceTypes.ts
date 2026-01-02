import { type InputMode } from '@/components/voice/InputModeSelector';
import { type VoiceProvider, type GrokVoice, type OpenAIVoice, type OpenAIVoiceSettings, type GrokVoiceSettings } from '@/components/voice/VoiceProviderSelector';
import { type ConnectionPhase, type ToolExecution } from '@/hooks/useGrokConversation';

/**
 * Voice settings props - controls voice provider and voice configurations
 */
export interface VoiceSettingsProps {
  voiceProvider: VoiceProvider;
  setVoiceProvider: (provider: VoiceProvider) => void;
  grokVoice: GrokVoice;
  setGrokVoice: (voice: GrokVoice) => void;
  grokSettings: GrokVoiceSettings;
  setGrokSettings: (settings: GrokVoiceSettings) => void;
  openaiVoice: OpenAIVoice;
  setOpenAIVoice: (voice: OpenAIVoice) => void;
  openaiSettings: OpenAIVoiceSettings;
  setOpenAISettings: (settings: OpenAIVoiceSettings) => void;
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
  isFallbackMode: boolean;
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
}
