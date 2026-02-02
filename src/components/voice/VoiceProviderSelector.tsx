import { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Button } from '@/components/ui/button';
import { Cloud, Loader2, Sparkles, Crown } from 'lucide-react';
import { OpenAISettingsPanel } from './OpenAISettingsPanel';
import { ElevenLabsSettingsPanel } from './ElevenLabsSettingsPanel';
import { VAPISettingsPanel } from './VAPISettingsPanel';
import {
  VoiceProvider,
  OpenAIVoice,
  OpenAIVoiceSettings,
  ElevenLabsSettings,
  VAPISettings,
  DEFAULT_OPENAI_SETTINGS,
  DEFAULT_ELEVENLABS_SETTINGS,
  DEFAULT_VAPI_SETTINGS,
  providerInfo,
} from './voiceTypes';
import { useUserFeatures } from '@/hooks/useUserFeatures';

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
  systemPrompt,
  onSystemPromptChange,
  disabled = false,
  isAuthenticated = false,
}: VoiceProviderSelectorProps) {
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { hasFeature, loading: featuresLoading, isSubscribed } = useUserFeatures();
  const navigate = useNavigate();

  // Determine available providers based on user features
  const availableProviders = useMemo(() => {
    const providers: VoiceProvider[] = ['openai'];
    
    // Add premium providers if user has the feature (Pro tier grants access to all)
    if (hasFeature('elevenlabs_voice')) {
      providers.push('elevenlabs');
      providers.push('vapi');
    }
    
    return providers;
  }, [hasFeature]);

  const hasPremiumAccess = hasFeature('elevenlabs_voice');

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

  const handleVapiSettingsChange = async (newSettings: VAPISettings) => {
    onVapiSettingsChange?.(newSettings);
    localStorage.setItem('vapi_settings', JSON.stringify(newSettings));
  };

  const handleElevenLabsSettingsChange = async (newSettings: ElevenLabsSettings) => {
    onElevenLabsSettingsChange(newSettings);
    localStorage.setItem('elevenlabs_settings', JSON.stringify(newSettings));
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
          disabled={disabled || saving || featuresLoading}
        >
          <SelectTrigger id="voice-provider" className="w-full">
            <SelectValue placeholder="Select voice provider" />
          </SelectTrigger>
          <SelectContent>
            {availableProviders.map((key) => {
              const info = providerInfo[key];
              return (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{info.name}</span>
                    <span className="text-xs text-muted-foreground">
                      - {info.description}
                    </span>
                    {info.isPremium && (
                      <Badge variant="secondary" className="text-xs ml-1">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Premium
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        
        {/* Show upgrade prompt if premium providers are not available */}
        {!hasPremiumAccess && isAuthenticated && (
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground flex items-center">
              <Crown className="h-3 w-3 mr-1 text-primary" />
              Premium voices available with Kernel Pro
            </p>
            <Button 
              variant="link" 
              size="sm" 
              className="h-auto p-0 text-xs"
              onClick={() => navigate('/pricing')}
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Upgrade
            </Button>
          </div>
        )}
        
        {/* Feature badges */}
        <div className="flex flex-wrap gap-1">
          {providerInfo[value].features.map((feature) => (
            <Badge key={feature} variant="secondary" className="text-xs">
              {feature}
            </Badge>
          ))}
        </div>
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
    </div>
  );
}
