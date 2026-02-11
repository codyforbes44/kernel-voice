import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSystemPromptPreference } from '@/components/voice/SystemPromptEditor';
import { useUserFeatures } from '@/hooks/useUserFeatures';
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
  VALID_OPENAI_VOICES,
  VALID_PROVIDERS,
} from '@/components/voice/voiceTypes';

export function useVoiceProviderPreference(isAuthenticated: boolean) {
  const [provider, setProvider] = useState<VoiceProvider>('openai');
  const [openaiVoice, setOpenAIVoice] = useState<OpenAIVoice>('alloy');
  const [openaiSettings, setOpenAISettings] = useState<OpenAIVoiceSettings>(DEFAULT_OPENAI_SETTINGS);
  const [elevenlabsSettings, setElevenLabsSettings] = useState<ElevenLabsSettings>(DEFAULT_ELEVENLABS_SETTINGS);
  const [vapiSettings, setVapiSettings] = useState<VAPISettings>(DEFAULT_VAPI_SETTINGS);
  const [geminiLiveSettings, setGeminiLiveSettings] = useState<GeminiLiveSettings>(DEFAULT_GEMINI_LIVE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const { systemPrompt, setSystemPrompt, loading: promptLoading } = useSystemPromptPreference();
  const { hasFeature, loading: featuresLoading } = useUserFeatures();

  useEffect(() => {
    const loadPreference = async () => {
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

      // Load ElevenLabs settings from localStorage
      const savedElevenLabsSettings = localStorage.getItem('elevenlabs_settings');
      if (savedElevenLabsSettings) {
        try {
          const parsed = JSON.parse(savedElevenLabsSettings);
          // Merge with defaults to ensure new fields are present
          setElevenLabsSettings({ 
            ...DEFAULT_ELEVENLABS_SETTINGS, 
            ...parsed,
            // Ensure personality fields exist
            personality: parsed.personality || 'friendly',
            customPrompt: parsed.customPrompt || '',
            customFirstMessage: parsed.customFirstMessage || '',
          });
        } catch (e) {
          console.error('Error parsing ElevenLabs settings:', e);
        }
      }

      // Load VAPI settings from localStorage
      const savedVapiSettings = localStorage.getItem('vapi_settings');
      if (savedVapiSettings) {
        try {
          const parsed = JSON.parse(savedVapiSettings);
          setVapiSettings({ ...DEFAULT_VAPI_SETTINGS, ...parsed });
        } catch (e) {
          console.error('Error parsing VAPI settings:', e);
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
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user;
        if (!currentUser) {
          setLoading(false);
          return;
        }

        const { data } = await supabase
          .from('profiles')
          .select('voice_provider, openai_voice, openai_settings')
          .eq('id', currentUser.id)
          .maybeSingle();

        if (data) {
          if (data.voice_provider && VALID_PROVIDERS.includes(data.voice_provider as VoiceProvider)) {
            setProvider(data.voice_provider as VoiceProvider);
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

  // Fallback to 3ʙɪ if user loses premium access
  useEffect(() => {
    if (!featuresLoading) {
      const isPremiumProvider = provider === 'elevenlabs' || provider === 'vapi';
      const hasPremiumAccess = hasFeature('elevenlabs_voice'); // Pro tier grants all premium
      
      if (isPremiumProvider && !hasPremiumAccess) {
        console.log('User does not have premium access, falling back to 3ʙɪ');
        setProvider('openai');
        if (!isAuthenticated) {
          localStorage.setItem('voice_provider', 'openai');
        }
      }
    }
  }, [featuresLoading, provider, hasFeature, isAuthenticated]);

  const updateProvider = useCallback((newProvider: VoiceProvider) => {
    // Validate access before switching to premium provider
    const isPremiumProvider = newProvider === 'elevenlabs' || newProvider === 'vapi';
    const hasPremiumAccess = hasFeature('elevenlabs_voice'); // Pro tier grants all premium
    
    if (isPremiumProvider && !hasPremiumAccess) {
      console.warn('User does not have access to premium providers');
      return;
    }
    
    setProvider(newProvider);
    if (!isAuthenticated) {
      localStorage.setItem('voice_provider', newProvider);
    }
  }, [hasFeature, isAuthenticated]);

  const updateOpenAIVoice = (newVoice: OpenAIVoice) => {
    setOpenAIVoice(newVoice);
    localStorage.setItem('openai_voice', newVoice);
  };

  const updateOpenAISettings = (newSettings: OpenAIVoiceSettings) => {
    setOpenAISettings(newSettings);
    localStorage.setItem('openai_settings', JSON.stringify(newSettings));
  };

  const updateVapiSettings = (newSettings: VAPISettings) => {
    setVapiSettings(newSettings);
    localStorage.setItem('vapi_settings', JSON.stringify(newSettings));
  };

  const updateElevenLabsSettings = (newSettings: ElevenLabsSettings) => {
    setElevenLabsSettings(newSettings);
    localStorage.setItem('elevenlabs_settings', JSON.stringify(newSettings));
  };

  const updateGeminiLiveSettings = (newSettings: GeminiLiveSettings) => {
    setGeminiLiveSettings(newSettings);
    localStorage.setItem('gemini_live_settings', JSON.stringify(newSettings));
  };

  return {
    provider, 
    setProvider: updateProvider, 
    openaiVoice,
    setOpenAIVoice: updateOpenAIVoice,
    openaiSettings,
    setOpenAISettings: updateOpenAISettings,
    elevenlabsSettings,
    setElevenLabsSettings: updateElevenLabsSettings,
    vapiSettings,
    setVapiSettings: updateVapiSettings,
    geminiLiveSettings,
    setGeminiLiveSettings: updateGeminiLiveSettings,
    systemPrompt,
    setSystemPrompt,
    loading: loading || promptLoading || featuresLoading,
    hasElevenLabsAccess: hasFeature('elevenlabs_voice'),
  };
}
