import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export interface SavedAgent {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  icon: string;
  voice_provider: string;
  voice_id: string | null;
  provider_settings: Json;
  system_prompt: string;
  first_message: string | null;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAgentInput {
  name: string;
  description?: string;
  icon?: string;
  voice_provider: string;
  voice_id?: string;
  provider_settings?: Json;
  system_prompt: string;
  first_message?: string;
  is_shared?: boolean;
}

export interface UpdateAgentInput extends Partial<CreateAgentInput> {
  id: string;
}

export function useSavedAgents() {
  const queryClient = useQueryClient();

  const { data: agents = [], isLoading, error } = useQuery({
    queryKey: ['saved-agents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_agents')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as SavedAgent[];
    },
  });

  const createAgent = useMutation({
    mutationFn: async (input: CreateAgentInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('saved_agents')
        .insert({
          user_id: user.id,
          name: input.name,
          description: input.description || null,
          icon: input.icon || '🤖',
          voice_provider: input.voice_provider,
          voice_id: input.voice_id || null,
          provider_settings: input.provider_settings || {},
          system_prompt: input.system_prompt,
          first_message: input.first_message || null,
          is_shared: input.is_shared ?? false,
        })
        .select()
        .single();

      if (error) throw error;
      return data as SavedAgent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-agents'] });
      toast.success('Agent saved');
    },
    onError: (error) => {
      toast.error('Failed to save agent: ' + error.message);
    },
  });

  const updateAgent = useMutation({
    mutationFn: async (input: UpdateAgentInput) => {
      const { id, ...updates } = input;
      const { data, error } = await supabase
        .from('saved_agents')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as SavedAgent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-agents'] });
      toast.success('Agent updated');
    },
    onError: (error) => {
      toast.error('Failed to update agent: ' + error.message);
    },
  });

  const deleteAgent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('saved_agents')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-agents'] });
      toast.success('Agent deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete agent: ' + error.message);
    },
  });

  const duplicateAgent = useCallback(async (agent: SavedAgent) => {
    await createAgent.mutateAsync({
      name: `${agent.name} (copy)`,
      description: agent.description || undefined,
      icon: agent.icon,
      voice_provider: agent.voice_provider,
      voice_id: agent.voice_id || undefined,
      provider_settings: agent.provider_settings,
      system_prompt: agent.system_prompt,
      first_message: agent.first_message || undefined,
      is_shared: false,
    });
  }, [createAgent]);

  return {
    agents,
    isLoading,
    error,
    createAgent,
    updateAgent,
    deleteAgent,
    duplicateAgent,
  };
}
