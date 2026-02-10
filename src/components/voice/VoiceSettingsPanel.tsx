import { VoiceProviderSelector, type VoiceProvider, type OpenAIVoice, type OpenAIVoiceSettings, type ElevenLabsSettings, type VAPISettings } from './VoiceProviderSelector';
import { type GeminiLiveSettings } from './voiceTypes';
import { InputModeSelector, type InputMode } from './InputModeSelector';
import { ConnectionTestPanel } from './ConnectionTestPanel';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

interface VoiceSettingsPanelProps {
  voiceProvider: VoiceProvider;
  onVoiceProviderChange: (value: VoiceProvider) => void;
  openaiVoice: OpenAIVoice;
  onOpenAIVoiceChange: (value: OpenAIVoice) => void;
  openaiSettings: OpenAIVoiceSettings;
  onOpenAISettingsChange: (value: OpenAIVoiceSettings) => void;
  elevenlabsSettings: ElevenLabsSettings;
  onElevenLabsSettingsChange: (value: ElevenLabsSettings) => void;
  vapiSettings?: VAPISettings;
  onVapiSettingsChange?: (value: VAPISettings) => void;
  geminiLiveSettings?: GeminiLiveSettings;
  onGeminiLiveSettingsChange?: (value: GeminiLiveSettings) => void;
  systemPrompt: string;
  onSystemPromptChange: (value: string) => void;
  inputMode: InputMode;
  onInputModeChange: (value: InputMode) => void;
  isConnected: boolean;
  providerLoading: boolean;
  isAuthenticated: boolean;
  onSaveAgent?: () => void;
}

export const VoiceSettingsPanel = ({
  voiceProvider,
  onVoiceProviderChange,
  openaiVoice,
  onOpenAIVoiceChange,
  openaiSettings,
  onOpenAISettingsChange,
  elevenlabsSettings,
  onElevenLabsSettingsChange,
  vapiSettings,
  onVapiSettingsChange,
  geminiLiveSettings,
  onGeminiLiveSettingsChange,
  systemPrompt,
  onSystemPromptChange,
  inputMode,
  onInputModeChange,
  isConnected,
  providerLoading,
  isAuthenticated,
  onSaveAgent,
}: VoiceSettingsPanelProps) => {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h4 className="font-medium text-lg">Voice Settings</h4>
        <VoiceProviderSelector
          value={voiceProvider}
          onChange={onVoiceProviderChange}
          openaiVoice={openaiVoice}
          onOpenAIVoiceChange={onOpenAIVoiceChange}
          openaiSettings={openaiSettings}
          onOpenAISettingsChange={onOpenAISettingsChange}
          elevenlabsSettings={elevenlabsSettings}
          onElevenLabsSettingsChange={onElevenLabsSettingsChange}
          vapiSettings={vapiSettings}
          onVapiSettingsChange={onVapiSettingsChange}
          geminiLiveSettings={geminiLiveSettings}
          onGeminiLiveSettingsChange={onGeminiLiveSettingsChange}
          systemPrompt={systemPrompt}
          onSystemPromptChange={onSystemPromptChange}
          disabled={isConnected || providerLoading}
          isAuthenticated={isAuthenticated}
        />
      </div>

      {/* Save as Agent */}
      {isAuthenticated && onSaveAgent && (
        <div className="pt-4 border-t border-border">
          <Button variant="outline" size="sm" className="w-full" onClick={onSaveAgent}>
            <Save className="h-4 w-4 mr-2" />
            Save as Agent
          </Button>
        </div>
      )}
      
      <div className="space-y-3 pt-4 border-t border-border">
        <h4 className="font-medium text-lg">Input Mode</h4>
        <p className="text-sm text-muted-foreground">
          Choose how you want to interact with the assistant
        </p>
        <InputModeSelector
          value={inputMode}
          onChange={onInputModeChange}
          disabled={isConnected}
          className="w-full justify-center"
        />
      </div>

      {/* Diagnostics Section */}
      {voiceProvider === 'openai' && (
        <Accordion type="single" collapsible className="pt-4 border-t border-border">
          <AccordionItem value="diagnostics" className="border-none">
            <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline">
              Diagnostics
            </AccordionTrigger>
            <AccordionContent>
              <ConnectionTestPanel className="border-0 shadow-none p-0" />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
};
