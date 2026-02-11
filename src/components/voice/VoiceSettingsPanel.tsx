import { VoiceProviderSelector } from './VoiceProviderSelector';
import { type VoiceProvider, type OpenAIVoice, type OpenAIVoiceSettings, type ElevenLabsSettings, type VAPISettings } from './voiceTypes';
import { type GeminiLiveSettings } from './voiceTypes';
import { type InputMode } from './InputModeSelector';
import { ConnectionTestPanel } from './ConnectionTestPanel';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Save, Activity, Mic, MessageSquare } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

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
    <div className="space-y-1">
      {/* ── Voice Provider & Settings ── */}
      <SettingsSection icon={<Activity className="h-4 w-4" />} title="Voice Engine">
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
      </SettingsSection>

      {/* ── Input Mode ── */}
      <SettingsSection icon={<MessageSquare className="h-4 w-4" />} title="Input Mode">
        <p className="text-xs text-muted-foreground mb-2">
          Choose how you interact with the assistant
        </p>
        <ToggleGroup
          type="single"
          value={inputMode}
          onValueChange={(v) => v && onInputModeChange(v as InputMode)}
          disabled={isConnected}
          className="w-full grid grid-cols-3 gap-1.5 bg-transparent p-0"
        >
          <InputModeTile value="voice" icon={<Mic className="h-4 w-4" />} label="Voice" />
          <InputModeTile
            value="combined"
            icon={
              <span className="flex items-center gap-0.5">
                <Mic className="h-3 w-3" />
                <span className="text-[10px] leading-none">+</span>
                <MessageSquare className="h-3 w-3" />
              </span>
            }
            label="Both"
          />
          <InputModeTile value="text" icon={<MessageSquare className="h-4 w-4" />} label="Text" />
        </ToggleGroup>
      </SettingsSection>

      {/* ── Save Agent ── */}
      {isAuthenticated && onSaveAgent && (
        <div className="px-1 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 h-9 text-xs font-medium border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5 transition-colors"
            onClick={onSaveAgent}
          >
            <Save className="h-3.5 w-3.5" />
            Save as Agent
          </Button>
        </div>
      )}

      {/* ── Diagnostics ── */}
      {voiceProvider === 'openai' && (
        <Accordion type="single" collapsible className="px-1">
          <AccordionItem value="diagnostics" className="border-none">
            <AccordionTrigger className="py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:no-underline">
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

/* ── Reusable section wrapper ── */
function SettingsSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg bg-muted/30 p-3 space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

/* ── Input mode tile ── */
function InputModeTile({
  value,
  icon,
  label,
}: {
  value: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <ToggleGroupItem
      value={value}
      aria-label={`${label} mode`}
      className="flex flex-col items-center gap-1 rounded-md border border-transparent px-2 py-2 text-muted-foreground transition-all
        data-[state=on]:bg-primary/10 data-[state=on]:text-primary data-[state=on]:border-primary/30
        hover:bg-muted hover:text-foreground"
    >
      {icon}
      <span className="text-[10px] font-medium leading-none">{label}</span>
    </ToggleGroupItem>
  );
}
