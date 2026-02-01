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
import { SystemPromptEditor } from './SystemPromptEditor';

export type ElevenLabsLanguage = 'auto' | 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'pl' | 'hi' | 'ar' | 'zh' | 'ja' | 'ko';

export interface ElevenLabsSettings {
  language: ElevenLabsLanguage;
  autoLanguageDetection: boolean;
  enableRAG: boolean;
}

export const DEFAULT_ELEVENLABS_SETTINGS: ElevenLabsSettings = {
  language: 'en',
  autoLanguageDetection: true,
  enableRAG: true,
};

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

  return (
    <div className="space-y-4 pt-2 border-t border-border">
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

      {/* System Prompt */}
      <div className="pt-3 border-t border-border">
        <SystemPromptEditor
          value={systemPrompt}
          onChange={onSystemPromptChange}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
