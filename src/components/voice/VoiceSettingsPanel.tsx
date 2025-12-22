import { VoiceProviderSelector, type VoiceProvider, type GrokVoice } from './VoiceProviderSelector';
import { InputModeSelector, type InputMode } from './InputModeSelector';
import { ConnectionTestPanel } from './ConnectionTestPanel';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface VoiceSettingsPanelProps {
  voiceProvider: VoiceProvider;
  onVoiceProviderChange: (value: VoiceProvider) => void;
  grokVoice: GrokVoice;
  onGrokVoiceChange: (value: GrokVoice) => void;
  systemPrompt: string;
  onSystemPromptChange: (value: string) => void;
  inputMode: InputMode;
  onInputModeChange: (value: InputMode) => void;
  isConnected: boolean;
  providerLoading: boolean;
  isAuthenticated: boolean;
}

export const VoiceSettingsPanel = ({
  voiceProvider,
  onVoiceProviderChange,
  grokVoice,
  onGrokVoiceChange,
  systemPrompt,
  onSystemPromptChange,
  inputMode,
  onInputModeChange,
  isConnected,
  providerLoading,
  isAuthenticated,
}: VoiceSettingsPanelProps) => {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h4 className="font-medium text-lg">Voice Settings</h4>
        <VoiceProviderSelector
          value={voiceProvider}
          onChange={onVoiceProviderChange}
          grokVoice={grokVoice}
          onGrokVoiceChange={onGrokVoiceChange}
          systemPrompt={systemPrompt}
          onSystemPromptChange={onSystemPromptChange}
          disabled={isConnected || providerLoading}
          isAuthenticated={isAuthenticated}
        />
      </div>
      
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
      {voiceProvider === 'grok' && (
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
