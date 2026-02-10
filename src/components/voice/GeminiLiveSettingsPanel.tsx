import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type GeminiLiveSettings, type GeminiLiveVoice, geminiLiveVoices } from './voiceTypes';

interface GeminiLiveSettingsPanelProps {
  settings: GeminiLiveSettings;
  onSettingsChange: (settings: GeminiLiveSettings) => void;
  systemPrompt: string;
  onSystemPromptChange: (prompt: string) => void;
  disabled?: boolean;
}

export function GeminiLiveSettingsPanel({
  settings,
  onSettingsChange,
  disabled = false,
}: GeminiLiveSettingsPanelProps) {
  return (
    <div className="space-y-4">
      {/* Voice Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Voice</Label>
        <Select
          value={settings.voice}
          onValueChange={(v) => onSettingsChange({ ...settings, voice: v as GeminiLiveVoice })}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {geminiLiveVoices.map((voice) => (
              <SelectItem key={voice.id} value={voice.id}>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{voice.name}</span>
                  <span className="text-xs text-muted-foreground">— {voice.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
