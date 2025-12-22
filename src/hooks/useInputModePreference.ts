import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { type InputMode } from '@/components/voice/InputModeSelector';

export function useInputModePreference(isAuthenticated: boolean) {
  const [inputMode, setInputModeState] = useState<InputMode>('combined');
  const [loading, setLoading] = useState(true);

  // Load preference on mount
  useEffect(() => {
    const loadPreference = async () => {
      // First check localStorage for non-authenticated users or as fallback
      const savedMode = localStorage.getItem('input_mode') as InputMode | null;
      if (savedMode && ['voice', 'text', 'combined'].includes(savedMode)) {
        setInputModeState(savedMode);
      }

      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('input_mode')
          .eq('id', user.id)
          .single();

        if (profile?.input_mode && ['voice', 'text', 'combined'].includes(profile.input_mode)) {
          setInputModeState(profile.input_mode as InputMode);
          localStorage.setItem('input_mode', profile.input_mode);
        }
      } catch (error) {
        console.error('Error loading input mode preference:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPreference();
  }, [isAuthenticated]);

  // Save preference
  const setInputMode = useCallback(async (mode: InputMode) => {
    setInputModeState(mode);
    localStorage.setItem('input_mode', mode);

    if (!isAuthenticated) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('profiles')
        .update({ input_mode: mode })
        .eq('id', user.id);
    } catch (error) {
      console.error('Error saving input mode preference:', error);
    }
  }, [isAuthenticated]);

  return {
    inputMode,
    setInputMode,
    loading,
  };
}
