import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CustomPromptPreset {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  system_prompt: string;
  first_message: string | null;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePresetInput {
  name: string;
  description?: string;
  system_prompt: string;
  first_message?: string;
  is_shared?: boolean;
}

export interface UpdatePresetInput extends Partial<CreatePresetInput> {
  id: string;
}

export function useCustomPromptPresets() {
  const queryClient = useQueryClient();

  // Fetch all accessible presets (own + shared)
  const { data: presets = [], isLoading, error, refetch } = useQuery({
    queryKey: ['custom-prompt-presets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_prompt_presets')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data as CustomPromptPreset[];
    },
  });

  // Create a new preset
  const createPreset = useMutation({
    mutationFn: async (input: CreatePresetInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('custom_prompt_presets')
        .insert({
          user_id: user.id,
          name: input.name,
          description: input.description || null,
          system_prompt: input.system_prompt,
          first_message: input.first_message || null,
          is_shared: input.is_shared ?? false,
        })
        .select()
        .single();

      if (error) throw error;
      return data as CustomPromptPreset;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-prompt-presets'] });
      toast.success('Preset saved successfully');
    },
    onError: (error) => {
      toast.error('Failed to save preset: ' + error.message);
    },
  });

  // Update an existing preset
  const updatePreset = useMutation({
    mutationFn: async (input: UpdatePresetInput) => {
      const { id, ...updates } = input;
      
      const { data, error } = await supabase
        .from('custom_prompt_presets')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as CustomPromptPreset;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-prompt-presets'] });
      toast.success('Preset updated');
    },
    onError: (error) => {
      toast.error('Failed to update preset: ' + error.message);
    },
  });

  // Delete a preset
  const deletePreset = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('custom_prompt_presets')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-prompt-presets'] });
      toast.success('Preset deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete preset: ' + error.message);
    },
  });

  // Get current user's presets vs shared presets
  const getOwnPresets = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    return presets.filter(p => p.user_id === user.id);
  }, [presets]);

  const sharedPresets = presets.filter(p => p.is_shared);
  
  return {
    presets,
    sharedPresets,
    isLoading,
    error,
    refetch,
    createPreset,
    updatePreset,
    deletePreset,
    getOwnPresets,
  };
}
