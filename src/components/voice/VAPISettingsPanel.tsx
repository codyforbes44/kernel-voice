import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Phone, Shield, Mic, Volume2 } from 'lucide-react';
import { type VAPISettings, DEFAULT_VAPI_SETTINGS } from './voiceTypes';
import { SystemPromptEditor } from './SystemPromptEditor';

interface VAPISettingsPanelProps {
  settings: VAPISettings;
  onSettingsChange: (settings: VAPISettings) => void;
  systemPrompt: string;
  onSystemPromptChange: (prompt: string) => void;
  disabled?: boolean;
}

export function VAPISettingsPanel({
  settings,
  onSettingsChange,
  systemPrompt,
  onSystemPromptChange,
  disabled = false,
}: VAPISettingsPanelProps) {
  const updateSetting = <K extends keyof VAPISettings>(
    key: K,
    value: VAPISettings[K]
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="space-y-4 border-t pt-4">
      {/* Feature badges */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="text-xs flex items-center gap-1">
          <Phone className="h-3 w-3" />
          Phone Ready
        </Badge>
        <Badge variant="outline" className="text-xs flex items-center gap-1">
          <Shield className="h-3 w-3" />
          HIPAA Option
        </Badge>
        <Badge variant="outline" className="text-xs flex items-center gap-1">
          <Volume2 className="h-3 w-3" />
          Background Noise
        </Badge>
      </div>

      {/* Assistant ID (optional) */}
      <div className="space-y-2">
        <Label htmlFor="vapi-assistant-id" className="text-sm">
          Assistant ID <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="vapi-assistant-id"
          placeholder="Leave empty to use inline config"
          value={settings.assistantId}
          onChange={(e) => updateSetting('assistantId', e.target.value)}
          disabled={disabled}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Pre-configured VAPI assistant ID. Leave blank to use custom settings.
        </p>
      </div>

      {/* Toggle Settings */}
      <div className="space-y-3">
        {/* Background Denoising */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mic className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="vapi-denoising" className="text-sm cursor-pointer">
              Background Denoising
            </Label>
          </div>
          <Switch
            id="vapi-denoising"
            checked={settings.backgroundDenoisingEnabled}
            onCheckedChange={(checked) => updateSetting('backgroundDenoisingEnabled', checked)}
            disabled={disabled}
          />
        </div>

        {/* Recording */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="vapi-recording" className="text-sm cursor-pointer">
              Enable Recording
            </Label>
          </div>
          <Switch
            id="vapi-recording"
            checked={settings.enableRecording}
            onCheckedChange={(checked) => updateSetting('enableRecording', checked)}
            disabled={disabled}
          />
        </div>

        {/* HIPAA Mode */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <div>
              <Label htmlFor="vapi-hipaa" className="text-sm cursor-pointer">
                HIPAA Compliance
              </Label>
              <p className="text-xs text-muted-foreground">
                Enable for healthcare applications
              </p>
            </div>
          </div>
          <Switch
            id="vapi-hipaa"
            checked={settings.hipaaEnabled}
            onCheckedChange={(checked) => updateSetting('hipaaEnabled', checked)}
            disabled={disabled}
          />
        </div>
      </div>

      {/* System Prompt */}
      <SystemPromptEditor
        value={systemPrompt}
        onChange={onSystemPromptChange}
        disabled={disabled}
      />
    </div>
  );
}
