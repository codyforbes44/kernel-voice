import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
  OpenAIVoice,
  OpenAIVoiceSettings,
  OpenAISettingsPreset,
  OPENAI_PRESETS,
  openaiVoices,
} from './voiceTypes';

interface OpenAISettingsPanelProps {
  openaiVoice: OpenAIVoice;
  onOpenAIVoiceChange: (voice: OpenAIVoice) => void;
  openaiSettings: OpenAIVoiceSettings;
  onOpenAISettingsChange: (settings: OpenAIVoiceSettings) => void;
  onOpenAISettingChange: <K extends keyof OpenAIVoiceSettings>(key: K, value: OpenAIVoiceSettings[K]) => void;
  onResetSettings: () => void;
  systemPrompt: string;
  onSystemPromptChange: (prompt: string) => void;
  disabled?: boolean;
}

export function OpenAISettingsPanel({
  openaiVoice,
  onOpenAIVoiceChange,
  openaiSettings,
  onOpenAISettingsChange,
  onOpenAISettingChange,
  onResetSettings,
  systemPrompt,
  onSystemPromptChange,
  disabled = false,
}: OpenAISettingsPanelProps) {
  const selectedOpenAIVoiceInfo = openaiVoices.find(v => v.id === openaiVoice);

  return (
    <div className="space-y-2 pt-2 border-t border-border">
      <Label htmlFor="openai-voice" className="text-sm font-medium">
        3ʙɪ Voice
      </Label>
      <Select
        value={openaiVoice}
        onValueChange={(v) => onOpenAIVoiceChange(v as OpenAIVoice)}
        disabled={disabled}
      >
        <SelectTrigger id="openai-voice" className="w-full">
          <SelectValue placeholder="Select voice" />
        </SelectTrigger>
        <SelectContent>
          {openaiVoices.map((voice) => (
            <SelectItem key={voice.id} value={voice.id}>
              <div className="flex items-center gap-2">
                <span className="font-medium">{voice.name}</span>
                {voice.isNew && (
                  <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 bg-primary/20 text-primary">
                    New
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  ({voice.type}) - {voice.tone}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {selectedOpenAIVoiceInfo && (
        <p className="text-xs text-muted-foreground">
          {selectedOpenAIVoiceInfo.description}
        </p>
      )}

      {/* Voice Settings Controls */}
      <div className="space-y-4 pt-3 border-t border-border">
        {/* Preset Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Response Style</Label>
            <Badge variant="outline" className="text-xs">
              {(() => {
                const activePreset = (Object.entries(OPENAI_PRESETS) as [Exclude<OpenAISettingsPreset, 'custom'>, typeof OPENAI_PRESETS['balanced']][]).find(([_, preset]) =>
                  openaiSettings.temperature === preset.settings.temperature &&
                  openaiSettings.vadThreshold === preset.settings.vadThreshold &&
                  openaiSettings.silenceDuration === preset.settings.silenceDuration
                );
                return activePreset ? activePreset[1].label : 'Custom';
              })()}
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(Object.entries(OPENAI_PRESETS) as [Exclude<OpenAISettingsPreset, 'custom'>, typeof OPENAI_PRESETS['balanced']][]).map(([key, preset]) => {
              const isActive = 
                openaiSettings.temperature === preset.settings.temperature &&
                openaiSettings.vadThreshold === preset.settings.vadThreshold &&
                openaiSettings.silenceDuration === preset.settings.silenceDuration;
              
              return (
                <button
                  key={key}
                  onClick={() => onOpenAISettingsChange({
                    ...openaiSettings,
                    temperature: preset.settings.temperature,
                    vadThreshold: preset.settings.vadThreshold,
                    silenceDuration: preset.settings.silenceDuration,
                  })}
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
                <Label className="text-sm font-medium">Temperature</Label>
                <span className="text-xs text-muted-foreground">{openaiSettings.temperature.toFixed(1)}</span>
              </div>
              <Slider
                value={[openaiSettings.temperature]}
                onValueChange={([v]) => onOpenAISettingChange('temperature', v)}
                min={0.6}
                max={1.2}
                step={0.1}
                disabled={disabled}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Lower = more focused, Higher = more creative
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">VAD Sensitivity</Label>
                <span className="text-xs text-muted-foreground">{(openaiSettings.vadThreshold * 100).toFixed(0)}%</span>
              </div>
              <Slider
                value={[openaiSettings.vadThreshold]}
                onValueChange={([v]) => onOpenAISettingChange('vadThreshold', v)}
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
                <span className="text-xs text-muted-foreground">{openaiSettings.silenceDuration}ms</span>
              </div>
              <Slider
                value={[openaiSettings.silenceDuration]}
                onValueChange={([v]) => onOpenAISettingChange('silenceDuration', v)}
                min={200}
                max={2000}
                step={100}
                disabled={disabled}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Silence before AI responds (shorter = faster, may interrupt)
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
                  <AlertDialogTitle>Reset 3ʙɪ Settings?</AlertDialogTitle>
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

      {/* First Message (Greeting) */}
      <div className="space-y-2 pt-3 border-t border-border">
        <Label className="text-sm font-medium">First Message (Greeting)</Label>
        <Textarea
          value={openaiSettings.firstMessage}
          onChange={(e) => onOpenAISettingChange('firstMessage', e.target.value)}
          placeholder="Hello! How can I help you today?"
          className="min-h-[60px] resize-none text-sm"
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          Leave empty to skip automatic greeting
        </p>
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
