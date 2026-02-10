import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Save } from 'lucide-react';
import { type SavedAgent, type CreateAgentInput } from '@/hooks/useSavedAgents';
import type { Json } from '@/integrations/supabase/types';
import type { RequiredQuestion } from '@/components/voice/voiceTypes';
import { RequiredQuestionsEditor } from '@/components/voice/RequiredQuestionsEditor';
import { ScrollArea } from '@/components/ui/scroll-area';

const EMOJI_OPTIONS = ['🤖', '🧠', '💡', '🎯', '🔧', '📚', '🎨', '🚀', '💬', '🌟', '⚡', '🎭'];

interface SaveAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (input: CreateAgentInput) => Promise<void>;
  onUpdate?: (id: string, input: Partial<CreateAgentInput>) => Promise<void>;
  editingAgent?: SavedAgent | null;
  currentConfig: {
    voiceProvider: string;
    voiceId: string;
    providerSettings: Json;
    systemPrompt: string;
    firstMessage: string;
  };
  saving?: boolean;
}

export function SaveAgentDialog({
  open, onOpenChange, onSave, onUpdate, editingAgent, currentConfig, saving,
}: SaveAgentDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🤖');
  const [requiredQuestions, setRequiredQuestions] = useState<RequiredQuestion[]>([]);

  useEffect(() => {
    if (editingAgent) {
      setName(editingAgent.name);
      setDescription(editingAgent.description || '');
      setIcon(editingAgent.icon);
      setRequiredQuestions(editingAgent.required_questions || []);
    } else {
      setName('');
      setDescription('');
      setIcon('🤖');
      setRequiredQuestions([]);
    }
  }, [editingAgent, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingAgent && onUpdate) {
      await onUpdate(editingAgent.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        icon,
        required_questions: requiredQuestions,
      });
    } else {
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        icon,
        voice_provider: currentConfig.voiceProvider,
        voice_id: currentConfig.voiceId,
        provider_settings: currentConfig.providerSettings,
        system_prompt: currentConfig.systemPrompt,
        first_message: currentConfig.firstMessage || undefined,
        required_questions: requiredQuestions,
      });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{editingAgent ? 'Edit Agent' : 'Save as AI Agent'}</DialogTitle>
          <DialogDescription>
            {editingAgent ? 'Update agent details.' : 'Save your current configuration as a reusable AI Agent.'}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-3">
          <form id="save-agent-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-2">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setIcon(emoji)}
                    className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center border-2 transition-colors ${
                      icon === emoji ? 'border-primary bg-primary/10' : 'border-transparent hover:bg-muted'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="agent-name">Name *</Label>
              <Input
                id="agent-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Technical Advisor"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agent-desc">Description</Label>
              <Textarea
                id="agent-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this agent do?"
                rows={2}
              />
            </div>

            <RequiredQuestionsEditor
              questions={requiredQuestions}
              onChange={setRequiredQuestions}
              disabled={saving}
            />
          </form>
        </ScrollArea>
        <DialogFooter className="pt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" form="save-agent-form" disabled={!name.trim() || saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            {editingAgent ? 'Update' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
