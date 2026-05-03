import { useState, useRef } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Cloud, Loader2, Check } from 'lucide-react';
import { OpenAISettingsPanel } from './OpenAISettingsPanel';
import { ElevenLabsSettingsPanel } from './ElevenLabsSettingsPanel';
import { VAPISettingsPanel } from './VAPISettingsPanel';
import { GeminiLiveSettingsPanel } from './GeminiLiveSettingsPanel';
import {
  VoiceProvider,
  OpenAIVoice,
  OpenAIVoiceSettings,
  ElevenLabsSettings,
  VAPISettings,
  GeminiLiveSettings,
  DEFAULT_OPENAI_SETTINGS,
  DEFAULT_ELEVENLABS_SETTINGS,
  DEFAULT_VAPI_SETTINGS,
  DEFAULT_GEMINI_LIVE_SETTINGS,
  providerInfo,
} from './voiceTypes';
import { cn } from '@/lib/utils';

// Re-export types for backwards compatibility
export type {
  VoiceProvider,
  OpenAIVoice,
  OpenAIVoiceSettings,
  ElevenLabsSettings,
  VAPISettings,
  ConnectionPhase,
  ToolExecution,
} from './voiceTypes';

export type { OpenAISettingsPreset } from './voiceTypes';

export {
  OPENAI_PRESETS,
  DEFAULT_OPENAI_SETTINGS,
  DEFAULT_ELEVENLABS_SETTINGS,
  DEFAULT_VAPI_SETTINGS,
  DEFAULT_GEMINI_LIVE_SETTINGS,
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
  elevenlabsSettings: ElevenLabsSettings;
  onElevenLabsSettingsChange: (settings: ElevenLabsSettings) => void;
  vapiSettings?: VAPISettings;
  onVapiSettingsChange?: (settings: VAPISettings) => void;
  geminiLiveSettings?: GeminiLiveSettings;
  onGeminiLiveSettingsChange?: (settings: GeminiLiveSettings) => void;
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
  elevenlabsSettings,
  onElevenLabsSettingsChange,
  vapiSettings,
  onVapiSettingsChange,
  geminiLiveSettings,
  onGeminiLiveSettingsChange,
  systemPrompt,
  onSystemPromptChange,
  disabled = false,
  isAuthenticated = false,
}: VoiceProviderSelectorProps) {
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const allProviders: VoiceProvider[] = ['openai', 'elevenlabs', 'vapi', 'gemini'];

  const withSync = async (fn: () => Promise<void>) => {
    if (!isAuthenticated) {
      await fn();
      return;
    }
    setSyncing(true);
    try {
      await fn();
      
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
    if (disabled || saving) return;
    
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

  const handleVapiSettingsChange = async (newSettings: VAPISettings) => {
    onVapiSettingsChange?.(newSettings);
    localStorage.setItem('vapi_settings', JSON.stringify(newSettings));
  };

  const handleElevenLabsSettingsChange = async (newSettings: ElevenLabsSettings) => {
    onElevenLabsSettingsChange(newSettings);
    localStorage.setItem('elevenlabs_settings', JSON.stringify(newSettings));
  };

  const handleGeminiLiveSettingsChange = async (newSettings: GeminiLiveSettings) => {
    onGeminiLiveSettingsChange?.(newSettings);
    localStorage.setItem('gemini_live_settings', JSON.stringify(newSettings));
  };

  return (
    <div className="space-y-3">
      {/* Sync indicator */}
      {isAuthenticated && (
        <div className="flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
          {syncing ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Syncing…</span>
            </>
          ) : (
            <>
              <Cloud className="h-3 w-3" />
              <span>Synced</span>
            </>
          )}
        </div>
      )}

      {/* Provider Tiles */}
      <div className="grid grid-cols-2 gap-1.5">
        {allProviders.map((key) => {
          const info = providerInfo[key];
          const isActive = value === key;

          return (
            <button
              key={key}
              onClick={() => handleProviderChange(key)}
              disabled={disabled || saving}
              className={cn(
                'relative flex flex-col items-start gap-0.5 rounded-lg border p-2.5 text-left transition-all',
                isActive
                  ? 'border-primary/50 bg-primary/8 ring-1 ring-primary/20'
                  : 'border-border hover:border-primary/30 hover:bg-muted/50 cursor-pointer',
                (disabled || saving) && 'opacity-50 cursor-not-allowed'
              )}
            >
              {isActive && (
                <div className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-2.5 w-2.5 text-primary-foreground" />
                </div>
              )}
              <span className="text-xs font-semibold leading-tight">{info.name}</span>
              <span className="text-[10px] text-muted-foreground leading-tight">{info.description}</span>
            </button>
          );
        })}
      </div>

      {/* Feature tags */}
      <div className="flex flex-wrap gap-1">
        {providerInfo[value].features.map((feature) => (
          <Badge key={feature} variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-normal">
            {feature}
          </Badge>
        ))}
      </div>

      {/* Provider-specific Settings */}
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
      
      {value === 'elevenlabs' && (
        <ElevenLabsSettingsPanel
          settings={elevenlabsSettings}
          onSettingsChange={handleElevenLabsSettingsChange}
          systemPrompt={systemPrompt}
          onSystemPromptChange={onSystemPromptChange}
          disabled={disabled}
        />
      )}
      
      {value === 'vapi' && vapiSettings && (
        <VAPISettingsPanel
          settings={vapiSettings}
          onSettingsChange={handleVapiSettingsChange}
          systemPrompt={systemPrompt}
          onSystemPromptChange={onSystemPromptChange}
          disabled={disabled}
        />
      )}
      
      {value === 'gemini' && geminiLiveSettings && (
        <GeminiLiveSettingsPanel
          settings={geminiLiveSettings}
          onSettingsChange={handleGeminiLiveSettingsChange}
          systemPrompt={systemPrompt}
          onSystemPromptChange={onSystemPromptChange}
          disabled={disabled}
        />
      )}
    </div>
  );
}
