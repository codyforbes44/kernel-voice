import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AgentPersonalitySelector, PERSONALITY_PRESETS } from './AgentPersonalitySelector';
import type { ElevenLabsSettings, ElevenLabsLanguage, AgentPersonality } from './voiceTypes';

// Re-export for backwards compatibility
export type { ElevenLabsLanguage, ElevenLabsSettings } from './voiceTypes';
export { DEFAULT_ELEVENLABS_SETTINGS } from './voiceTypes';

const LANGUAGE_OPTIONS: { id: ElevenLabsLanguage; name: string; native: string }[] = [
  { id: 'auto', name: 'Auto-detect', native: '🌍 Automatic' },
  { id: 'en', name: 'English', native: 'English' },
  { id: 'es', name: 'Spanish', native: 'Español' },
  { id: 'fr', name: 'French', native: 'Français' },
  { id: 'de', name: 'German', native: 'Deutsch' },
  { id: 'it', name: 'Italian', native: 'Italiano' },
  { id: 'pt', name: 'Portuguese', native: 'Português' },
  { id: 'pl', name: 'Polish', native: 'Polski' },
  { id: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { id: 'ar', name: 'Arabic', native: 'العربية' },
  { id: 'zh', name: 'Chinese', native: '中文' },
  { id: 'ja', name: 'Japanese', native: '日本語' },
  { id: 'ko', name: 'Korean', native: '한국어' },
];

interface ElevenLabsSettingsPanelProps {
  settings: ElevenLabsSettings;
  onSettingsChange: (settings: ElevenLabsSettings) => void;
  systemPrompt: string;
  onSystemPromptChange: (prompt: string) => void;
  disabled?: boolean;
}

export function ElevenLabsSettingsPanel({
  settings,
  onSettingsChange,
  systemPrompt,
  onSystemPromptChange,
  disabled = false,
}: ElevenLabsSettingsPanelProps) {
  const handleSettingChange = <K extends keyof ElevenLabsSettings>(
    key: K,
    value: ElevenLabsSettings[K]
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const handlePersonalityChange = (personality: AgentPersonality) => {
    const preset = PERSONALITY_PRESETS.find((p) => p.id === personality);
    onSettingsChange({
      ...settings,
      personality,
      // Initialize custom fields with preset values for easier customization
      customPrompt: preset?.systemPrompt || settings.customPrompt,
      customFirstMessage: preset?.firstMessage || settings.customFirstMessage,
    });
  };

  // Get the effective system prompt based on personality selection
  const getEffectivePrompt = (): string => {
    if (settings.personality === 'custom') {
      return settings.customPrompt;
    }
    const preset = PERSONALITY_PRESETS.find((p) => p.id === settings.personality);
    return preset?.systemPrompt || '';
  };

  // Sync to parent when effective prompt changes
  const effectivePrompt = getEffectivePrompt();
  if (effectivePrompt && effectivePrompt !== systemPrompt) {
    onSystemPromptChange(effectivePrompt);
  }

  return (
    <div className="space-y-4 pt-2 border-t border-border">
      {/* Agent Personality - Primary section */}
      <AgentPersonalitySelector
        selectedPersonality={settings.personality || 'friendly'}
        onPersonalityChange={handlePersonalityChange}
        customPrompt={settings.customPrompt || ''}
        onCustomPromptChange={(prompt) => handleSettingChange('customPrompt', prompt)}
        customFirstMessage={settings.customFirstMessage || ''}
        onCustomFirstMessageChange={(msg) => handleSettingChange('customFirstMessage', msg)}
        disabled={disabled}
      />

      {/* Advanced Settings in Accordion */}
      <Accordion type="single" collapsible className="pt-2 border-t border-border">
        <AccordionItem value="advanced" className="border-none">
          <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline">
            Advanced Settings
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            {/* Language Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="elevenlabs-language" className="text-sm font-medium">
                  Language
                </Label>
                {settings.autoLanguageDetection && (
                  <Badge variant="secondary" className="text-xs">
                    Auto-detect enabled
                  </Badge>
                )}
              </div>
              <Select
                value={settings.autoLanguageDetection ? 'auto' : settings.language}
                onValueChange={(v) => {
                  if (v === 'auto') {
                    handleSettingChange('autoLanguageDetection', true);
                  } else {
                    handleSettingChange('autoLanguageDetection', false);
                    handleSettingChange('language', v as ElevenLabsLanguage);
                  }
                }}
                disabled={disabled}
              >
                <SelectTrigger id="elevenlabs-language" className="w-full">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <SelectItem key={lang.id} value={lang.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{lang.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {lang.native}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {settings.autoLanguageDetection
                  ? 'The assistant will detect and respond in your language'
                  : `Conversations will be in ${LANGUAGE_OPTIONS.find(l => l.id === settings.language)?.name}`}
              </p>
            </div>

            {/* RAG Toggle */}
            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <Label htmlFor="enable-rag" className="text-sm font-medium">
                  Knowledge Base
                </Label>
                <p className="text-xs text-muted-foreground">
                  Search uploaded documents for answers
                </p>
              </div>
              <Switch
                id="enable-rag"
                checked={settings.enableRAG}
                onCheckedChange={(checked) => handleSettingChange('enableRAG', checked)}
                disabled={disabled}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
