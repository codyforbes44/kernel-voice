import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RotateCcw, Save, ChevronDown, ChevronUp, Briefcase, Coffee, Palette, Code } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';

const DEFAULT_SYSTEM_PROMPT = `You are Kernel, a helpful, friendly AI voice assistant. 

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

const PERSONALITY_PRESETS = {
  professional: {
    name: 'Professional',
    icon: Briefcase,
    description: 'Formal and business-focused',
    prompt: `You are a professional AI business assistant.

Your tone:
- Formal yet approachable
- Clear and articulate
- Focused on efficiency and accuracy

Guidelines:
- Provide well-structured, actionable responses
- Use professional language appropriate for business settings
- Prioritize accuracy and cite sources when possible
- Keep responses concise and to the point
- Maintain a respectful, courteous demeanor
- If uncertain, acknowledge limitations professionally`,
  },
  casual: {
    name: 'Casual',
    icon: Coffee,
    description: 'Friendly and relaxed',
    prompt: `You are a friendly, casual AI companion.

Your tone:
- Warm and conversational
- Relaxed and approachable
- Like chatting with a knowledgeable friend

Guidelines:
- Keep things light and easy-going
- Use everyday language, avoid jargon
- Feel free to add a touch of humor when appropriate
- Be supportive and encouraging
- Share enthusiasm about interesting topics
- Keep responses brief and natural`,
  },
  creative: {
    name: 'Creative',
    icon: Palette,
    description: 'Imaginative and inspiring',
    prompt: `You are a creative AI muse and brainstorming partner.

Your tone:
- Imaginative and inspiring
- Open-minded and curious
- Enthusiastic about ideas

Guidelines:
- Encourage creative thinking and exploration
- Offer multiple perspectives and possibilities
- Use vivid, expressive language
- Embrace unconventional ideas
- Help develop and refine creative concepts
- Ask thought-provoking questions to spark inspiration`,
  },
  technical: {
    name: 'Technical',
    icon: Code,
    description: 'Precise and detailed',
    prompt: `You are a technical AI expert assistant.

Your expertise:
- Programming and software development
- Technical problem-solving
- System architecture and design

Guidelines:
- Provide precise, technically accurate information
- Use appropriate technical terminology
- Explain complex concepts clearly
- Offer code examples when relevant
- Consider edge cases and best practices
- Be thorough but concise in explanations`,
  },
};

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
  const [activePreset, setActivePreset] = useState<string | null>(null);

  useEffect(() => {
    setLocalValue(value);
    setHasUnsavedChanges(false);
    
    // Detect which preset is active
    const preset = Object.entries(PERSONALITY_PRESETS).find(
      ([_, p]) => p.prompt.trim() === value.trim()
    );
    setActivePreset(preset ? preset[0] : null);
  }, [value]);

  const handleChange = (newValue: string) => {
    setLocalValue(newValue);
    setHasUnsavedChanges(newValue !== value);
    setActivePreset(null);
  };

  const handleSave = () => {
    onChange(localValue);
    setHasUnsavedChanges(false);
  };

  const handleReset = () => {
    setLocalValue(DEFAULT_SYSTEM_PROMPT);
    setActivePreset(null);
    setHasUnsavedChanges(DEFAULT_SYSTEM_PROMPT !== value);
  };

  const handlePresetClick = (presetKey: string) => {
    const preset = PERSONALITY_PRESETS[presetKey as keyof typeof PERSONALITY_PRESETS];
    setLocalValue(preset.prompt);
    setActivePreset(presetKey);
    setHasUnsavedChanges(preset.prompt !== value);
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
          Choose a preset or customize how the AI responds
        </p>

        {/* Personality Presets */}
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(PERSONALITY_PRESETS).map(([key, preset]) => {
            const Icon = preset.icon;
            const isActive = activePreset === key;
            return (
              <Button
                key={key}
                variant={isActive ? "default" : "outline"}
                size="sm"
                className="flex flex-col items-center gap-1 h-auto py-2 px-2"
                onClick={() => handlePresetClick(key)}
                disabled={disabled}
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs font-medium">{preset.name}</span>
              </Button>
            );
          })}
        </div>

        {/* Active preset badge */}
        {activePreset && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {PERSONALITY_PRESETS[activePreset as keyof typeof PERSONALITY_PRESETS].name}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {PERSONALITY_PRESETS[activePreset as keyof typeof PERSONALITY_PRESETS].description}
            </span>
          </div>
        )}
        
        <Textarea
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          disabled={disabled}
          placeholder="Enter system instructions for the AI..."
          className="min-h-[120px] text-sm resize-y"
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
