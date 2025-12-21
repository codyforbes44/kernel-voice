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

export type VoiceProvider = 'elevenlabs' | 'grok';

interface VoiceProviderSelectorProps {
  value: VoiceProvider;
  onChange: (provider: VoiceProvider) => void;
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
};

export function VoiceProviderSelector({
  value,
  onChange,
  disabled = false,
  isAuthenticated = false,
}: VoiceProviderSelectorProps) {
  const [saving, setSaving] = useState(false);

  // Save preference to profile when authenticated
  const handleChange = async (newProvider: VoiceProvider) => {
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

  return (
    <div className="space-y-2">
      <Label htmlFor="voice-provider" className="text-sm font-medium">
        Voice Provider
      </Label>
      <Select
        value={value}
        onValueChange={(v) => handleChange(v as VoiceProvider)}
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
      <div className="flex flex-wrap gap-1 mt-2">
        {providerInfo[value].features.map((feature) => (
          <Badge key={feature} variant="secondary" className="text-xs">
            {feature}
          </Badge>
        ))}
      </div>
    </div>
  );
}

// Hook to load saved preference
export function useVoiceProviderPreference(isAuthenticated: boolean) {
  const [provider, setProvider] = useState<VoiceProvider>('elevenlabs');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPreference = async () => {
      if (!isAuthenticated) {
        // Check localStorage for guests
        const saved = localStorage.getItem('voice_provider') as VoiceProvider | null;
        if (saved && (saved === 'elevenlabs' || saved === 'grok')) {
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
    // Save to localStorage for guests
    if (!isAuthenticated) {
      localStorage.setItem('voice_provider', newProvider);
    }
  };

  return { provider, setProvider: updateProvider, loading };
}
