import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { SystemPromptEditor } from './SystemPromptEditor';
import {
  GrokVoice,
  GrokVoiceSettings,
  GrokSettingsPreset,
  GROK_PRESETS,
  grokVoices,
} from './voiceTypes';

interface GrokSettingsPanelProps {
  grokVoice: GrokVoice;
  onGrokVoiceChange: (voice: GrokVoice) => void;
  grokSettings: GrokVoiceSettings;
  onGrokSettingsChange: (settings: GrokVoiceSettings) => void;
  onGrokSettingChange: <K extends keyof GrokVoiceSettings>(key: K, value: GrokVoiceSettings[K]) => void;
  onResetSettings: () => void;
  systemPrompt: string;
  onSystemPromptChange: (prompt: string) => void;
  disabled?: boolean;
}

export function GrokSettingsPanel({
  grokVoice,
  onGrokVoiceChange,
  grokSettings,
  onGrokSettingsChange,
  onGrokSettingChange,
  onResetSettings,
  systemPrompt,
  onSystemPromptChange,
  disabled = false,
}: GrokSettingsPanelProps) {
  const selectedGrokVoiceInfo = grokVoices.find(v => v.id === grokVoice);

  return (
    <div className="space-y-2 pt-2 border-t border-border">
      <Label htmlFor="grok-voice" className="text-sm font-medium">
        Grok Voice
      </Label>
      <Select
        value={grokVoice}
        onValueChange={(v) => onGrokVoiceChange(v as GrokVoice)}
        disabled={disabled}
      >
        <SelectTrigger id="grok-voice" className="w-full">
          <SelectValue placeholder="Select voice" />
        </SelectTrigger>
        <SelectContent>
          {grokVoices.map((voice) => (
            <SelectItem key={voice.id} value={voice.id}>
              <div className="flex items-center gap-2">
                <span className="font-medium">{voice.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({voice.type}) - {voice.tone}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {selectedGrokVoiceInfo && (
        <p className="text-xs text-muted-foreground">
          {selectedGrokVoiceInfo.description}
        </p>
      )}

      {/* Grok Voice Settings Controls */}
      <div className="space-y-4 pt-3 border-t border-border">
        {/* Preset Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Response Style</Label>
            <Badge variant="outline" className="text-xs">
              {(() => {
                const activePreset = (Object.entries(GROK_PRESETS) as [Exclude<GrokSettingsPreset, 'custom'>, typeof GROK_PRESETS['balanced']][]).find(([_, preset]) =>
                  grokSettings.vadThreshold === preset.settings.vadThreshold &&
                  grokSettings.silenceDuration === preset.settings.silenceDuration &&
                  grokSettings.prefixPadding === preset.settings.prefixPadding
                );
                return activePreset ? activePreset[1].label : 'Custom';
              })()}
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(Object.entries(GROK_PRESETS) as [Exclude<GrokSettingsPreset, 'custom'>, typeof GROK_PRESETS['balanced']][]).map(([key, preset]) => {
              const isActive = 
                grokSettings.vadThreshold === preset.settings.vadThreshold &&
                grokSettings.silenceDuration === preset.settings.silenceDuration &&
                grokSettings.prefixPadding === preset.settings.prefixPadding;
              
              return (
                <button
                  key={key}
                  onClick={() => onGrokSettingsChange(preset.settings)}
                  disabled={disabled}
                  className={`p-2 rounded-md border text-center transition-colors ${
                    isActive 
                      ? 'border-primary bg-primary/10 text-primary' 
                      : 'border-border hover:border-primary/50 hover:bg-muted'
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="text-sm font-medium">{preset.label}</div>
                  <div className="text-xs text-muted-foreground">{preset.description}</div>
                </button>
              );
            })}
          </div>
        </div>

        <Collapsible>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group">
            <span>Advanced Settings</span>
            <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">VAD Sensitivity</Label>
                <span className="text-xs text-muted-foreground">{(grokSettings.vadThreshold * 100).toFixed(0)}%</span>
              </div>
              <Slider
                value={[grokSettings.vadThreshold]}
                onValueChange={([v]) => onGrokSettingChange('vadThreshold', v)}
                min={0.1}
                max={0.9}
                step={0.05}
                disabled={disabled}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Voice detection threshold (lower = more sensitive)
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Response Delay</Label>
                <span className="text-xs text-muted-foreground">{grokSettings.silenceDuration}ms</span>
              </div>
              <Slider
                value={[grokSettings.silenceDuration]}
                onValueChange={([v]) => onGrokSettingChange('silenceDuration', v)}
                min={100}
                max={1000}
                step={50}
                disabled={disabled}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Silence before AI responds
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Prefix Padding</Label>
                <span className="text-xs text-muted-foreground">{grokSettings.prefixPadding}ms</span>
              </div>
              <Slider
                value={[grokSettings.prefixPadding]}
                onValueChange={([v]) => onGrokSettingChange('prefixPadding', v)}
                min={100}
                max={500}
                step={50}
                disabled={disabled}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Audio captured before speech detection
              </p>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                  className="w-full mt-2 text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="h-3 w-3 mr-2" />
                  Reset to Defaults
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset Grok Settings?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will reset your voice and all settings to their default values. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onResetSettings}>
                    Reset
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CollapsibleContent>
        </Collapsible>
      </div>

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
