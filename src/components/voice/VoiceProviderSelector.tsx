import { useState, useRef } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Cloud, Loader2 } from 'lucide-react';
import { OpenAISettingsPanel } from './OpenAISettingsPanel';
import {
  VoiceProvider,
  OpenAIVoice,
  OpenAIVoiceSettings,
  DEFAULT_OPENAI_SETTINGS,
  providerInfo,
} from './voiceTypes';

// Re-export types for backwards compatibility
export type {
  VoiceProvider,
  OpenAIVoice,
  OpenAIVoiceSettings,
  ConnectionPhase,
  ToolExecution,
} from './voiceTypes';

export type { OpenAISettingsPreset } from './voiceTypes';

export {
  OPENAI_PRESETS,
  DEFAULT_OPENAI_SETTINGS,
} from './voiceTypes';

// Re-export hook for backwards compatibility
export { useVoiceProviderPreference } from '@/hooks/useVoiceProviderPreference';

interface VoiceProviderSelectorProps {
  value: VoiceProvider;
  onChange: (provider: VoiceProvider) => void;
  openaiVoice: OpenAIVoice;
  onOpenAIVoiceChange: (voice: OpenAIVoice) => void;
  openaiSettings: OpenAIVoiceSettings;
  onOpenAISettingsChange: (settings: OpenAIVoiceSettings) => void;
  systemPrompt: string;
  onSystemPromptChange: (prompt: string) => void;
  disabled?: boolean;
  isAuthenticated?: boolean;
}

export function VoiceProviderSelector({
  value,
  onChange,
  openaiVoice,
  onOpenAIVoiceChange,
  openaiSettings,
  onOpenAISettingsChange,
  systemPrompt,
  onSystemPromptChange,
  disabled = false,
  isAuthenticated = false,
}: VoiceProviderSelectorProps) {
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const withSync = async (fn: () => Promise<void>) => {
    if (!isAuthenticated) {
      await fn();
      return;
    }
    setSyncing(true);
    try {
      await fn();
      
      // Debounce toast to avoid spam on rapid changes
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
      toastTimeoutRef.current = setTimeout(() => {
        toast({
          description: "Settings synced to cloud",
          duration: 2000,
        });
      }, 500);
    } finally {
      setSyncing(false);
    }
  };

  const handleProviderChange = async (newProvider: VoiceProvider) => {
    onChange(newProvider);
    
    if (!isAuthenticated) return;
    
    setSaving(true);
    setSyncing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      await supabase
        .from('profiles')
        .update({ voice_provider: newProvider })
        .eq('id', user.id);
      
      // Debounce toast for provider change too
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
      toastTimeoutRef.current = setTimeout(() => {
        toast({
          description: "Settings synced to cloud",
          duration: 2000,
        });
      }, 500);
    } catch (error) {
      console.error('Error saving voice provider preference:', error);
    } finally {
      setSaving(false);
      setSyncing(false);
    }
  };

  const handleOpenAIVoiceChange = async (newVoice: OpenAIVoice) => {
    onOpenAIVoiceChange(newVoice);
    localStorage.setItem('openai_voice', newVoice);
    
    await withSync(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').update({ openai_voice: newVoice }).eq('id', user.id);
      }
    });
  };

  const handleOpenAISettingChange = async <K extends keyof OpenAIVoiceSettings>(
    key: K,
    settingValue: OpenAIVoiceSettings[K]
  ) => {
    const newSettings = { ...openaiSettings, [key]: settingValue };
    onOpenAISettingsChange(newSettings);
    localStorage.setItem('openai_settings', JSON.stringify(newSettings));
    
    await withSync(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').update({ openai_settings: newSettings }).eq('id', user.id);
      }
    });
  };

  const handleResetOpenAISettings = async () => {
    onOpenAIVoiceChange('alloy');
    onOpenAISettingsChange(DEFAULT_OPENAI_SETTINGS);
    localStorage.setItem('openai_voice', 'alloy');
    localStorage.setItem('openai_settings', JSON.stringify(DEFAULT_OPENAI_SETTINGS));
    
    await withSync(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').update({ 
          openai_voice: 'alloy', 
          openai_settings: JSON.parse(JSON.stringify(DEFAULT_OPENAI_SETTINGS))
        }).eq('id', user.id);
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Provider Selection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="voice-provider" className="text-sm font-medium">
            Voice Provider
          </Label>
          {isAuthenticated && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {syncing ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Syncing...</span>
                </>
              ) : (
                <>
                  <Cloud className="h-3 w-3" />
                  <span>Synced</span>
                </>
              )}
            </div>
          )}
        </div>
        <Select
          value={value}
          onValueChange={(v) => handleProviderChange(v as VoiceProvider)}
          disabled={disabled || saving}
        >
          <SelectTrigger id="voice-provider" className="w-full">
            <SelectValue placeholder="Select voice provider" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(providerInfo).map(([key, info]) => (
              <SelectItem key={key} value={key}>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{info.name}</span>
                  <span className="text-xs text-muted-foreground">
                    - {info.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Feature badges */}
        <div className="flex flex-wrap gap-1">
          {providerInfo[value].features.map((feature) => (
            <Badge key={feature} variant="secondary" className="text-xs">
              {feature}
            </Badge>
          ))}
        </div>
      </div>

      {/* OpenAI Settings - Only show when OpenAI is selected */}
      {value === 'openai' && (
        <OpenAISettingsPanel
          openaiVoice={openaiVoice}
          onOpenAIVoiceChange={handleOpenAIVoiceChange}
          openaiSettings={openaiSettings}
          onOpenAISettingsChange={onOpenAISettingsChange}
          onOpenAISettingChange={handleOpenAISettingChange}
          onResetSettings={handleResetOpenAISettings}
          systemPrompt={systemPrompt}
          onSystemPromptChange={onSystemPromptChange}
          disabled={disabled}
        />
      )}
    </div>
  );
}
