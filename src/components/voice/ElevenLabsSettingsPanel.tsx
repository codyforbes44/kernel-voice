import { useState, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AgentPersonalitySelector, PERSONALITY_PRESETS } from './AgentPersonalitySelector';
import type { ElevenLabsSettings, ElevenLabsLanguage, AgentPersonality } from './voiceTypes';
import { Search } from 'lucide-react';

// Re-export for backwards compatibility
export type { ElevenLabsLanguage, ElevenLabsSettings } from './voiceTypes';
export { DEFAULT_ELEVENLABS_SETTINGS } from './voiceTypes';

interface LanguageOption {
  id: ElevenLabsLanguage;
  name: string;
  native: string;
  region: string;
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  // Special
  { id: 'auto', name: 'Auto-detect', native: '🌍 Automatic', region: 'General' },
  // Americas / Global
  { id: 'en', name: 'English', native: 'English', region: 'Global' },
  { id: 'es', name: 'Spanish', native: 'Español', region: 'Global' },
  { id: 'fr', name: 'French', native: 'Français', region: 'Global' },
  { id: 'pt', name: 'Portuguese', native: 'Português', region: 'Global' },
  { id: 'ar', name: 'Arabic', native: 'العربية', region: 'Global' },
  // Europe
  { id: 'de', name: 'German', native: 'Deutsch', region: 'Europe' },
  { id: 'it', name: 'Italian', native: 'Italiano', region: 'Europe' },
  { id: 'pl', name: 'Polish', native: 'Polski', region: 'Europe' },
  { id: 'nl', name: 'Dutch', native: 'Nederlands', region: 'Europe' },
  { id: 'sv', name: 'Swedish', native: 'Svenska', region: 'Europe' },
  { id: 'no', name: 'Norwegian', native: 'Norsk', region: 'Europe' },
  { id: 'da', name: 'Danish', native: 'Dansk', region: 'Europe' },
  { id: 'fi', name: 'Finnish', native: 'Suomi', region: 'Europe' },
  { id: 'cs', name: 'Czech', native: 'Čeština', region: 'Europe' },
  { id: 'ro', name: 'Romanian', native: 'Română', region: 'Europe' },
  { id: 'hu', name: 'Hungarian', native: 'Magyar', region: 'Europe' },
  { id: 'tr', name: 'Turkish', native: 'Türkçe', region: 'Europe' },
  { id: 'uk', name: 'Ukrainian', native: 'Українська', region: 'Europe' },
  { id: 'el', name: 'Greek', native: 'Ελληνικά', region: 'Europe' },
  { id: 'ru', name: 'Russian', native: 'Русский', region: 'Europe' },
  // Asia
  { id: 'hi', name: 'Hindi', native: 'हिन्दी', region: 'Asia' },
  { id: 'zh', name: 'Chinese', native: '中文', region: 'Asia' },
  { id: 'ja', name: 'Japanese', native: '日本語', region: 'Asia' },
  { id: 'ko', name: 'Korean', native: '한국어', region: 'Asia' },
  { id: 'th', name: 'Thai', native: 'ไทย', region: 'Asia' },
  { id: 'vi', name: 'Vietnamese', native: 'Tiếng Việt', region: 'Asia' },
  { id: 'id', name: 'Indonesian', native: 'Bahasa Indonesia', region: 'Asia' },
  { id: 'ms', name: 'Malay', native: 'Bahasa Melayu', region: 'Asia' },
  { id: 'fil', name: 'Filipino', native: 'Filipino', region: 'Asia' },
  { id: 'bn', name: 'Bengali', native: 'বাংলা', region: 'Asia' },
  { id: 'ta', name: 'Tamil', native: 'தமிழ்', region: 'Asia' },
  // Middle East / Africa
  { id: 'he', name: 'Hebrew', native: 'עברית', region: 'Middle East & Africa' },
  { id: 'sw', name: 'Swahili', native: 'Kiswahili', region: 'Middle East & Africa' },
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
  const [langSearch, setLangSearch] = useState('');

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
      customPrompt: preset?.systemPrompt || settings.customPrompt,
      customFirstMessage: preset?.firstMessage || settings.customFirstMessage,
    });
  };

  const getEffectivePrompt = (): string => {
    if (settings.personality === 'custom') {
      return settings.customPrompt;
    }
    const preset = PERSONALITY_PRESETS.find((p) => p.id === settings.personality);
    return preset?.systemPrompt || '';
  };

  const effectivePrompt = getEffectivePrompt();
  if (effectivePrompt && effectivePrompt !== systemPrompt) {
    onSystemPromptChange(effectivePrompt);
  }

  // Filter languages by search
  const filteredBySearch = useMemo(() => {
    if (!langSearch.trim()) return LANGUAGE_OPTIONS;
    const q = langSearch.toLowerCase();
    return LANGUAGE_OPTIONS.filter(
      (l) => l.name.toLowerCase().includes(q) || l.native.toLowerCase().includes(q)
    );
  }, [langSearch]);

  // Group by region
  const grouped = useMemo(() => {
    const groups: Record<string, LanguageOption[]> = {};
    for (const lang of filteredBySearch) {
      if (!groups[lang.region]) groups[lang.region] = [];
      groups[lang.region].push(lang);
    }
    return groups;
  }, [filteredBySearch]);

  return (
    <div className="space-y-4 pt-2 border-t border-border">
      <AgentPersonalitySelector
        selectedPersonality={settings.personality || 'friendly'}
        onPersonalityChange={handlePersonalityChange}
        customPrompt={settings.customPrompt || ''}
        onCustomPromptChange={(prompt) => handleSettingChange('customPrompt', prompt)}
        customFirstMessage={settings.customFirstMessage || ''}
        onCustomFirstMessageChange={(msg) => handleSettingChange('customFirstMessage', msg)}
        disabled={disabled}
      />

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
                  {/* Search input */}
                  <div className="px-2 pb-2 pt-1">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        value={langSearch}
                        onChange={(e) => setLangSearch(e.target.value)}
                        placeholder="Search languages..."
                        className="h-8 pl-7 text-xs"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  {Object.entries(grouped).map(([region, langs]) => (
                    <SelectGroup key={region}>
                      <SelectLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {region}
                      </SelectLabel>
                      {langs.map((lang) => (
                        <SelectItem key={lang.id} value={lang.id}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{lang.name}</span>
                            <span className="text-xs text-muted-foreground">{lang.native}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {settings.autoLanguageDetection
                  ? 'The assistant will detect and respond in your language'
                  : `Conversations will be in ${LANGUAGE_OPTIONS.find(l => l.id === settings.language)?.name || settings.language}`}
              </p>
            </div>

            {/* Agent ID */}
            <div className="space-y-2">
              <Label htmlFor="elevenlabs-agent-id" className="text-sm font-medium">
                Agent ID
              </Label>
              <Input
                id="elevenlabs-agent-id"
                value={settings.elevenlabsAgentId || ''}
                onChange={(e) => handleSettingChange('elevenlabsAgentId', e.target.value || undefined)}
                placeholder="System default"
                disabled={disabled}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Override the default agent. Find your Agent ID in the ElevenLabs dashboard.
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
