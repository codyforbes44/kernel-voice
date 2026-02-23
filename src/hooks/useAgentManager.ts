import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useSavedAgents, type SavedAgent } from '@/hooks/useSavedAgents';
import type { Json } from '@/integrations/supabase/types';

interface AgentManagerDeps {
  voiceProvider: string;
  openaiVoice: string;
  openaiSettings: Record<string, any>;
  elevenlabsSettings: Record<string, any>;
  vapiSettings: Record<string, any> | null;
  geminiLiveSettings: Record<string, any> | null;
  systemPrompt: string;
  setVoiceProvider: (p: any) => void;
  setOpenAIVoice: (v: any) => void;
  setOpenAISettings: (s: any) => void;
  setElevenLabsSettings: (s: any) => void;
  setVapiSettings?: (s: any) => void;
  setGeminiLiveSettings?: (s: any) => void;
  setSystemPrompt: (s: string) => void;
}

export function useAgentManager(deps: AgentManagerDeps) {
  const { agents, isLoading: agentsLoading, createAgent, updateAgent, deleteAgent, duplicateAgent } = useSavedAgents();
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<SavedAgent | null>(null);

  const getCurrentConfig = useCallback(() => {
    let voiceId = '';
    let providerSettings: Json = {};
    let firstMessage = '';
    if (deps.voiceProvider === 'openai') {
      voiceId = deps.openaiVoice;
      providerSettings = deps.openaiSettings as unknown as Json;
      firstMessage = deps.openaiSettings.firstMessage || '';
    } else if (deps.voiceProvider === 'elevenlabs') {
      providerSettings = deps.elevenlabsSettings as unknown as Json;
      firstMessage = deps.elevenlabsSettings.customFirstMessage || '';
    } else if (deps.voiceProvider === 'vapi' && deps.vapiSettings) {
      providerSettings = deps.vapiSettings as unknown as Json;
    } else if (deps.voiceProvider === 'gemini' && deps.geminiLiveSettings) {
      voiceId = deps.geminiLiveSettings.voice;
      providerSettings = deps.geminiLiveSettings as unknown as Json;
      firstMessage = deps.geminiLiveSettings.customFirstMessage || '';
    }
    return { voiceProvider: deps.voiceProvider, voiceId, providerSettings, systemPrompt: deps.systemPrompt, firstMessage };
  }, [deps.voiceProvider, deps.openaiVoice, deps.openaiSettings, deps.elevenlabsSettings, deps.vapiSettings, deps.geminiLiveSettings, deps.systemPrompt]);

  const handleLoadAgent = useCallback((agent: SavedAgent) => {
    deps.setVoiceProvider(agent.voice_provider as any);
    if (agent.voice_provider === 'openai' && agent.voice_id) {
      deps.setOpenAIVoice(agent.voice_id as any);
    }
    if (agent.provider_settings && typeof agent.provider_settings === 'object') {
      const settings = agent.provider_settings as Record<string, any>;
      if (agent.voice_provider === 'openai') deps.setOpenAISettings(settings as any);
      else if (agent.voice_provider === 'elevenlabs') deps.setElevenLabsSettings(settings as any);
      else if (agent.voice_provider === 'vapi') deps.setVapiSettings?.(settings as any);
      else if (agent.voice_provider === 'gemini') deps.setGeminiLiveSettings?.(settings as any);
    }

    let prompt = agent.system_prompt;
    const rq = agent.required_questions;
    if (rq && rq.length > 0) {
      const lines = rq.map((q, i) => {
        const tag = q.required ? '[Required]' : '[Optional]';
        return `${i + 1}. ${tag} ${q.question} (expect: ${q.type.replace('_', '/')})`;
      });
      prompt += `\n\nIMPORTANT: You must collect answers to the following questions during this conversation. Ask them naturally in the flow of conversation. Do not skip required questions.\n\nQuestions to collect:\n${lines.join('\n')}`;
    }

    deps.setSystemPrompt(prompt);
    setActiveAgentId(agent.id);
    toast.success(`Loaded agent: ${agent.name}`);
  }, [deps]);

  const handleSaveAgent = useCallback(async (input: Parameters<typeof createAgent.mutateAsync>[0]) => {
    await createAgent.mutateAsync(input);
  }, [createAgent]);

  const handleUpdateAgent = useCallback(async (id: string, input: Record<string, any>) => {
    await updateAgent.mutateAsync({ id, ...input });
  }, [updateAgent]);

  const handleEditAgent = useCallback((agent: SavedAgent) => {
    setEditingAgent(agent);
    setSaveDialogOpen(true);
  }, []);

  const handleDeleteAgent = useCallback((id: string) => {
    deleteAgent.mutate(id);
    if (activeAgentId === id) setActiveAgentId(null);
  }, [deleteAgent, activeAgentId]);

  const openSaveDialog = useCallback(() => {
    setEditingAgent(null);
    setSaveDialogOpen(true);
  }, []);

  return {
    agents,
    agentsLoading,
    activeAgentId,
    saveDialogOpen,
    setSaveDialogOpen,
    editingAgent,
    getCurrentConfig,
    handleLoadAgent,
    handleSaveAgent,
    handleUpdateAgent,
    handleEditAgent,
    handleDeleteAgent,
    duplicateAgent,
    openSaveDialog,
    createAgent,
    updateAgent,
  };
}
