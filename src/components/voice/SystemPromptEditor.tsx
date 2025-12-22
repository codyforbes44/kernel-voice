import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RotateCcw, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const DEFAULT_SYSTEM_PROMPT = `You are a helpful, friendly AI voice assistant. 

Your capabilities:
- Answer questions clearly and concisely
- Help with research and information lookup
- Assist with document analysis when documents are provided
- Engage in natural, conversational dialogue

Guidelines:
- Keep responses conversational and appropriate for voice interaction
- Be concise - avoid overly long responses that are hard to follow verbally
- Ask clarifying questions when needed
- Be helpful, honest, and harmless
- If you don't know something, say so rather than making things up`;

interface SystemPromptEditorProps {
  value: string;
  onChange: (prompt: string) => void;
  disabled?: boolean;
}

export function SystemPromptEditor({
  value,
  onChange,
  disabled = false,
}: SystemPromptEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    setLocalValue(value);
    setHasUnsavedChanges(false);
  }, [value]);

  const handleChange = (newValue: string) => {
    setLocalValue(newValue);
    setHasUnsavedChanges(newValue !== value);
  };

  const handleSave = () => {
    onChange(localValue);
    setHasUnsavedChanges(false);
  };

  const handleReset = () => {
    setLocalValue(DEFAULT_SYSTEM_PROMPT);
    setHasUnsavedChanges(DEFAULT_SYSTEM_PROMPT !== value);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
      <CollapsibleTrigger asChild>
        <Button 
          variant="ghost" 
          className="flex items-center justify-between w-full p-0 h-auto hover:bg-transparent"
          disabled={disabled}
        >
          <Label className="text-sm font-medium cursor-pointer">
            AI Personality
          </Label>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Customize how the AI assistant behaves and responds
        </p>
        
        <Textarea
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          disabled={disabled}
          placeholder="Enter system instructions for the AI..."
          className="min-h-[150px] text-sm resize-y"
        />
        
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={disabled || !hasUnsavedChanges}
            className="flex-1"
          >
            <Save className="h-3 w-3 mr-1" />
            Save
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={handleReset}
            disabled={disabled}
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
        </div>
        
        {hasUnsavedChanges && (
          <p className="text-xs text-amber-500">
            You have unsaved changes
          </p>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

export const DEFAULT_PROMPT = DEFAULT_SYSTEM_PROMPT;

// Hook to manage system prompt preference
export function useSystemPromptPreference() {
  const [systemPrompt, setSystemPrompt] = useState<string>(DEFAULT_SYSTEM_PROMPT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('grok_system_prompt');
    if (saved) {
      setSystemPrompt(saved);
    }
    setLoading(false);
  }, []);

  const updateSystemPrompt = (newPrompt: string) => {
    setSystemPrompt(newPrompt);
    localStorage.setItem('grok_system_prompt', newPrompt);
  };

  return {
    systemPrompt,
    setSystemPrompt: updateSystemPrompt,
    loading,
  };
}
