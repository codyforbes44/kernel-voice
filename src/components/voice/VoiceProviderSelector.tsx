import { useState, useEffect } from 'react';
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
import { Slider } from '@/components/ui/slider';
import { SystemPromptEditor, useSystemPromptPreference, DEFAULT_PROMPT } from './SystemPromptEditor';

export interface OpenAIVoiceSettings {
  temperature: number;      // 0.6-1.2, controls response creativity
  vadThreshold: number;     // 0.0-1.0, voice activity detection sensitivity
  silenceDuration: number;  // 200-2000ms, silence before response
}

export type VoiceProvider = 'elevenlabs' | 'grok' | 'openai';
export type GrokVoice = 'Charon' | 'Celeste' | 'Clio' | 'Zephyr' | 'Sol';
export type OpenAIVoice = 'alloy' | 'ash' | 'ballad' | 'coral' | 'echo' | 'sage' | 'shimmer' | 'verse';

export const DEFAULT_OPENAI_SETTINGS: OpenAIVoiceSettings = {
  temperature: 0.8,
  vadThreshold: 0.5,
  silenceDuration: 500,
};

interface VoiceProviderSelectorProps {
  value: VoiceProvider;
  onChange: (provider: VoiceProvider) => void;
  grokVoice: GrokVoice;
  onGrokVoiceChange: (voice: GrokVoice) => void;
  openaiVoice: OpenAIVoice;
  onOpenAIVoiceChange: (voice: OpenAIVoice) => void;
  openaiSettings: OpenAIVoiceSettings;
  onOpenAISettingsChange: (settings: OpenAIVoiceSettings) => void;
  systemPrompt: string;
  onSystemPromptChange: (prompt: string) => void;
  disabled?: boolean;
  isAuthenticated?: boolean;
}

const providerInfo = {
  elevenlabs: {
    name: 'ElevenLabs',
    description: 'Premium voice quality',
    features: ['Voice cloning', 'Natural prosody'],
  },
  grok: {
    name: 'Grok',
    description: '100+ languages, built-in search',
    features: ['Auto language detect', 'Web search', 'X search'],
  },
  openai: {
    name: 'OpenAI',
    description: 'GPT-4o Realtime, low latency',
    features: ['WebRTC', 'Fast response', 'Tool calling'],
  },
};

const grokVoices: { id: GrokVoice; name: string; type: string; tone: string; description: string }[] = [
  { id: 'Charon', name: 'Charon', type: 'Male', tone: 'Deep, calming', description: 'Default voice, smooth and articulate' },
  { id: 'Celeste', name: 'Celeste', type: 'Female', tone: 'Warm, melodic', description: 'Friendly and expressive' },
  { id: 'Clio', name: 'Clio', type: 'Female', tone: 'Clear, professional', description: 'Articulate and precise' },
  { id: 'Zephyr', name: 'Zephyr', type: 'Neutral', tone: 'Light, airy', description: 'Gentle and versatile' },
  { id: 'Sol', name: 'Sol', type: 'Male', tone: 'Energetic, bright', description: 'Dynamic and engaging' },
];

const openaiVoices: { id: OpenAIVoice; name: string; type: string; tone: string; description: string }[] = [
  { id: 'alloy', name: 'Alloy', type: 'Neutral', tone: 'Balanced, clear', description: 'Default versatile voice' },
  { id: 'ash', name: 'Ash', type: 'Male', tone: 'Warm, confident', description: 'Professional and engaging' },
  { id: 'ballad', name: 'Ballad', type: 'Neutral', tone: 'Soft, melodic', description: 'Gentle and soothing' },
  { id: 'coral', name: 'Coral', type: 'Female', tone: 'Friendly, warm', description: 'Approachable and natural' },
  { id: 'echo', name: 'Echo', type: 'Male', tone: 'Clear, direct', description: 'Crisp and articulate' },
  { id: 'sage', name: 'Sage', type: 'Female', tone: 'Calm, wise', description: 'Thoughtful and measured' },
  { id: 'shimmer', name: 'Shimmer', type: 'Female', tone: 'Bright, energetic', description: 'Upbeat and cheerful' },
  { id: 'verse', name: 'Verse', type: 'Neutral', tone: 'Expressive, dynamic', description: 'Versatile and emotive' },
];

export function VoiceProviderSelector({
  value,
  onChange,
  grokVoice,
  onGrokVoiceChange,
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

  const handleProviderChange = async (newProvider: VoiceProvider) => {
    onChange(newProvider);
    
    if (!isAuthenticated) return;
    
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      await supabase
        .from('profiles')
        .update({ voice_provider: newProvider })
        .eq('id', user.id);
        
    } catch (error) {
      console.error('Error saving voice provider preference:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleGrokVoiceChange = (newVoice: GrokVoice) => {
    onGrokVoiceChange(newVoice);
    localStorage.setItem('grok_voice', newVoice);
  };

  const handleOpenAIVoiceChange = (newVoice: OpenAIVoice) => {
    onOpenAIVoiceChange(newVoice);
    localStorage.setItem('openai_voice', newVoice);
  };

  const handleOpenAISettingChange = <K extends keyof OpenAIVoiceSettings>(
    key: K,
    value: OpenAIVoiceSettings[K]
  ) => {
    const newSettings = { ...openaiSettings, [key]: value };
    onOpenAISettingsChange(newSettings);
    localStorage.setItem('openai_settings', JSON.stringify(newSettings));
  };

  const selectedGrokVoiceInfo = grokVoices.find(v => v.id === grokVoice);
  const selectedOpenAIVoiceInfo = openaiVoices.find(v => v.id === openaiVoice);

  return (
    <div className="space-y-4">
      {/* Provider Selection */}
      <div className="space-y-2">
        <Label htmlFor="voice-provider" className="text-sm font-medium">
          Voice Provider
        </Label>
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

      {/* Grok Voice Selection - Only show when Grok is selected */}
      {value === 'grok' && (
        <div className="space-y-2 pt-2 border-t border-border">
          <Label htmlFor="grok-voice" className="text-sm font-medium">
            Grok Voice
          </Label>
          <Select
            value={grokVoice}
            onValueChange={(v) => handleGrokVoiceChange(v as GrokVoice)}
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

          <div className="pt-3 border-t border-border">
            <SystemPromptEditor
              value={systemPrompt}
              onChange={onSystemPromptChange}
              disabled={disabled}
            />
          </div>
        </div>
      )}

      {/* OpenAI Voice Selection - Only show when OpenAI is selected */}
      {value === 'openai' && (
        <div className="space-y-2 pt-2 border-t border-border">
          <Label htmlFor="openai-voice" className="text-sm font-medium">
            OpenAI Voice
          </Label>
          <Select
            value={openaiVoice}
            onValueChange={(v) => handleOpenAIVoiceChange(v as OpenAIVoice)}
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
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Temperature</Label>
                <span className="text-xs text-muted-foreground">{openaiSettings.temperature.toFixed(1)}</span>
              </div>
              <Slider
                value={[openaiSettings.temperature]}
                onValueChange={([v]) => handleOpenAISettingChange('temperature', v)}
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
                onValueChange={([v]) => handleOpenAISettingChange('vadThreshold', v)}
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
                onValueChange={([v]) => handleOpenAISettingChange('silenceDuration', v)}
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
          </div>

          <div className="pt-3 border-t border-border">
            <SystemPromptEditor
              value={systemPrompt}
              onChange={onSystemPromptChange}
              disabled={disabled}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Hook to load saved preferences
export function useVoiceProviderPreference(isAuthenticated: boolean) {
  const [provider, setProvider] = useState<VoiceProvider>('elevenlabs');
  const [grokVoice, setGrokVoice] = useState<GrokVoice>('Charon');
  const [openaiVoice, setOpenAIVoice] = useState<OpenAIVoice>('alloy');
  const [openaiSettings, setOpenAISettings] = useState<OpenAIVoiceSettings>(DEFAULT_OPENAI_SETTINGS);
  const [loading, setLoading] = useState(true);
  const { systemPrompt, setSystemPrompt, loading: promptLoading } = useSystemPromptPreference();

  useEffect(() => {
    const loadPreference = async () => {
      // Load Grok voice from localStorage
      const savedGrokVoice = localStorage.getItem('grok_voice') as GrokVoice | null;
      if (savedGrokVoice && ['Charon', 'Celeste', 'Clio', 'Zephyr', 'Sol'].includes(savedGrokVoice)) {
        setGrokVoice(savedGrokVoice);
      }

      // Load OpenAI voice from localStorage
      const savedOpenAIVoice = localStorage.getItem('openai_voice') as OpenAIVoice | null;
      if (savedOpenAIVoice && ['alloy', 'ash', 'ballad', 'coral', 'echo', 'sage', 'shimmer', 'verse'].includes(savedOpenAIVoice)) {
        setOpenAIVoice(savedOpenAIVoice);
      }

      // Load OpenAI settings from localStorage
      const savedOpenAISettings = localStorage.getItem('openai_settings');
      if (savedOpenAISettings) {
        try {
          const parsed = JSON.parse(savedOpenAISettings);
          setOpenAISettings({ ...DEFAULT_OPENAI_SETTINGS, ...parsed });
        } catch (e) {
          console.error('Error parsing OpenAI settings:', e);
        }
      }

      if (!isAuthenticated) {
        const saved = localStorage.getItem('voice_provider') as VoiceProvider | null;
        if (saved && (saved === 'elevenlabs' || saved === 'grok' || saved === 'openai')) {
          setProvider(saved);
        }
        setLoading(false);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data } = await supabase
          .from('profiles')
          .select('voice_provider')
          .eq('id', user.id)
          .single();

        if (data?.voice_provider) {
          setProvider(data.voice_provider as VoiceProvider);
        }
      } catch (error) {
        console.error('Error loading voice provider preference:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPreference();
  }, [isAuthenticated]);

  const updateProvider = (newProvider: VoiceProvider) => {
    setProvider(newProvider);
    if (!isAuthenticated) {
      localStorage.setItem('voice_provider', newProvider);
    }
  };

  const updateGrokVoice = (newVoice: GrokVoice) => {
    setGrokVoice(newVoice);
    localStorage.setItem('grok_voice', newVoice);
  };

  const updateOpenAIVoice = (newVoice: OpenAIVoice) => {
    setOpenAIVoice(newVoice);
    localStorage.setItem('openai_voice', newVoice);
  };

  const updateOpenAISettings = (newSettings: OpenAIVoiceSettings) => {
    setOpenAISettings(newSettings);
    localStorage.setItem('openai_settings', JSON.stringify(newSettings));
  };

  return {
    provider, 
    setProvider: updateProvider, 
    grokVoice, 
    setGrokVoice: updateGrokVoice,
    openaiVoice,
    setOpenAIVoice: updateOpenAIVoice,
    openaiSettings,
    setOpenAISettings: updateOpenAISettings,
    systemPrompt,
    setSystemPrompt,
    loading: loading || promptLoading,
  };
}
