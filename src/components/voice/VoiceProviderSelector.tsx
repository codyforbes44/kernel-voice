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
import { SystemPromptEditor, useSystemPromptPreference, DEFAULT_PROMPT } from './SystemPromptEditor';

export type VoiceProvider = 'elevenlabs' | 'grok' | 'openai';
export type GrokVoice = 'Charon' | 'Celeste' | 'Clio' | 'Zephyr' | 'Sol';
export type OpenAIVoice = 'alloy' | 'ash' | 'ballad' | 'coral' | 'echo' | 'sage' | 'shimmer' | 'verse';

interface VoiceProviderSelectorProps {
  value: VoiceProvider;
  onChange: (provider: VoiceProvider) => void;
  grokVoice: GrokVoice;
  onGrokVoiceChange: (voice: GrokVoice) => void;
  openaiVoice: OpenAIVoice;
  onOpenAIVoiceChange: (voice: OpenAIVoice) => void;
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

  return { 
    provider, 
    setProvider: updateProvider, 
    grokVoice, 
    setGrokVoice: updateGrokVoice,
    openaiVoice,
    setOpenAIVoice: updateOpenAIVoice,
    systemPrompt,
    setSystemPrompt,
    loading: loading || promptLoading,
  };
}
