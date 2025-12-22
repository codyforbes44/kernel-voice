import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSystemPromptPreference } from '@/components/voice/SystemPromptEditor';
import {
  VoiceProvider,
  GrokVoice,
  OpenAIVoice,
  GrokVoiceSettings,
  OpenAIVoiceSettings,
  DEFAULT_GROK_SETTINGS,
  DEFAULT_OPENAI_SETTINGS,
  VALID_GROK_VOICES,
  VALID_OPENAI_VOICES,
  VALID_PROVIDERS,
} from '@/components/voice/voiceTypes';

export function useVoiceProviderPreference(isAuthenticated: boolean) {
  const [provider, setProvider] = useState<VoiceProvider>('elevenlabs');
  const [grokVoice, setGrokVoice] = useState<GrokVoice>('Charon');
  const [grokSettings, setGrokSettings] = useState<GrokVoiceSettings>(DEFAULT_GROK_SETTINGS);
  const [openaiVoice, setOpenAIVoice] = useState<OpenAIVoice>('alloy');
  const [openaiSettings, setOpenAISettings] = useState<OpenAIVoiceSettings>(DEFAULT_OPENAI_SETTINGS);
  const [loading, setLoading] = useState(true);
  const { systemPrompt, setSystemPrompt, loading: promptLoading } = useSystemPromptPreference();

  useEffect(() => {
    const loadPreference = async () => {
      // Load Grok voice from localStorage
      const savedGrokVoice = localStorage.getItem('grok_voice') as GrokVoice | null;
      if (savedGrokVoice && VALID_GROK_VOICES.includes(savedGrokVoice)) {
        setGrokVoice(savedGrokVoice);
      }

      // Load Grok settings from localStorage
      const savedGrokSettings = localStorage.getItem('grok_settings');
      if (savedGrokSettings) {
        try {
          const parsed = JSON.parse(savedGrokSettings);
          setGrokSettings({ ...DEFAULT_GROK_SETTINGS, ...parsed });
        } catch (e) {
          console.error('Error parsing Grok settings:', e);
        }
      }

      // Load OpenAI voice from localStorage
      const savedOpenAIVoice = localStorage.getItem('openai_voice') as OpenAIVoice | null;
      if (savedOpenAIVoice && VALID_OPENAI_VOICES.includes(savedOpenAIVoice)) {
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
        if (saved && VALID_PROVIDERS.includes(saved)) {
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
          .select('voice_provider, grok_voice, grok_settings, openai_voice, openai_settings')
          .eq('id', user.id)
          .maybeSingle();

        if (data) {
          if (data.voice_provider) {
            setProvider(data.voice_provider as VoiceProvider);
          }
          if (data.grok_voice) {
            setGrokVoice(data.grok_voice as GrokVoice);
          }
          if (data.grok_settings) {
            setGrokSettings({ ...DEFAULT_GROK_SETTINGS, ...(data.grok_settings as unknown as GrokVoiceSettings) });
          }
          if (data.openai_voice) {
            setOpenAIVoice(data.openai_voice as OpenAIVoice);
          }
          if (data.openai_settings) {
            setOpenAISettings({ ...DEFAULT_OPENAI_SETTINGS, ...(data.openai_settings as unknown as OpenAIVoiceSettings) });
          }
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

  const updateGrokSettings = (newSettings: GrokVoiceSettings) => {
    setGrokSettings(newSettings);
    localStorage.setItem('grok_settings', JSON.stringify(newSettings));
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
    grokSettings,
    setGrokSettings: updateGrokSettings,
    openaiVoice,
    setOpenAIVoice: updateOpenAIVoice,
    openaiSettings,
    setOpenAISettings: updateOpenAISettings,
    systemPrompt,
    setSystemPrompt,
    loading: loading || promptLoading,
  };
}
