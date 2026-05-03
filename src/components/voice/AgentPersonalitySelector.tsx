import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Sparkles, RotateCcw, User, Briefcase, Lightbulb, Heart, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AgentPersonality = 'friendly' | 'professional' | 'technical' | 'empathetic' | 'custom';

export interface PersonalityPreset {
  id: AgentPersonality;
  name: string;
  icon: React.ElementType;
  description: string;
  systemPrompt: string;
  firstMessage: string;
}

export const PERSONALITY_PRESETS: PersonalityPreset[] = [
  {
    id: 'friendly',
    name: 'Friendly Helper',
    icon: User,
    description: 'Warm, casual, and approachable',
    systemPrompt: `You are ƷBI, a warm and friendly AI voice assistant. You speak naturally and conversationally, like a helpful friend. Keep responses brief (1-3 sentences) and spoken-word appropriate—no markdown or special formatting. When using tools, briefly explain what you're doing. Be enthusiastic but not over the top.`,
    firstMessage: "Hey there! I'm ƷBI, your AI assistant. What can I help you with today?",
  },
  {
    id: 'professional',
    name: 'Professional',
    icon: Briefcase,
    description: 'Business-focused and efficient',
    systemPrompt: `You are ƷBI, a professional AI voice assistant. Maintain a courteous, business-appropriate tone while being clear and efficient. Keep responses concise (1-3 sentences) and actionable. No markdown or formatting—speak naturally. When using tools, provide brief status updates. Focus on delivering value and respecting the user's time.`,
    firstMessage: "Hello, I'm ƷBI. How may I assist you today?",
  },
  {
    id: 'technical',
    name: 'Technical Expert',
    icon: Lightbulb,
    description: 'Detail-oriented and precise',
    systemPrompt: `You are ƷBI, a technical AI voice assistant with expertise in explaining complex topics clearly. Be precise and thorough while keeping responses spoken-word friendly (1-3 sentences per turn). No markdown—use natural speech patterns. When using tools, explain your methodology. Break down technical concepts into understandable terms.`,
    firstMessage: "Hi, I'm ƷBI. I'm here to help with any technical questions or tasks. What would you like to explore?",
  },
  {
    id: 'empathetic',
    name: 'Empathetic Coach',
    icon: Heart,
    description: 'Supportive and understanding',
    systemPrompt: `You are ƷBI, an empathetic AI voice assistant who prioritizes understanding and support. Listen actively, acknowledge feelings, and respond with warmth. Keep responses natural and conversational (1-3 sentences). No markdown—speak as you would to a friend. When using tools, explain how they'll help. Be patient and encouraging.`,
    firstMessage: "Hi there, I'm ƷBI. I'm here to help however I can. What's on your mind?",
  },
  {
    id: 'custom',
    name: 'Custom',
    icon: Wand2,
    description: 'Define your own personality',
    systemPrompt: '',
    firstMessage: '',
  },
];

interface AgentPersonalitySelectorProps {
  selectedPersonality: AgentPersonality;
  onPersonalityChange: (personality: AgentPersonality) => void;
  customPrompt: string;
  onCustomPromptChange: (prompt: string) => void;
  customFirstMessage: string;
  onCustomFirstMessageChange: (message: string) => void;
  disabled?: boolean;
}

export function AgentPersonalitySelector({
  selectedPersonality,
  onPersonalityChange,
  customPrompt,
  onCustomPromptChange,
  customFirstMessage,
  onCustomFirstMessageChange,
  disabled = false,
}: AgentPersonalitySelectorProps) {
  const activePreset = PERSONALITY_PRESETS.find((p) => p.id === selectedPersonality);
  const isCustom = selectedPersonality === 'custom';

  const handlePresetSelect = (presetId: AgentPersonality) => {
    onPersonalityChange(presetId);
    
    // If selecting a non-custom preset, populate the custom fields with preset values
    // so they can be used as a starting point if switching to custom
    const preset = PERSONALITY_PRESETS.find((p) => p.id === presetId);
    if (preset && presetId !== 'custom') {
      onCustomPromptChange(preset.systemPrompt);
      onCustomFirstMessageChange(preset.firstMessage);
    }
  };

  const handleResetToPreset = () => {
    if (activePreset && !isCustom) {
      onCustomPromptChange(activePreset.systemPrompt);
      onCustomFirstMessageChange(activePreset.firstMessage);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <Label className="text-sm font-medium">Agent Personality</Label>
      </div>
      
      <RadioGroup
        value={selectedPersonality}
        onValueChange={(v) => handlePresetSelect(v as AgentPersonality)}
        disabled={disabled}
        className="grid grid-cols-2 gap-2"
      >
        {PERSONALITY_PRESETS.map((preset) => {
          const Icon = preset.icon;
          const isSelected = selectedPersonality === preset.id;
          
          return (
            <label
              key={preset.id}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                isSelected
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border hover:border-muted-foreground/30 hover:bg-muted/50",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <RadioGroupItem value={preset.id} className="mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium text-sm">{preset.name}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {preset.description}
                </p>
              </div>
            </label>
          );
        })}
      </RadioGroup>

      {/* Active personality indicator */}
      {activePreset && !isCustom && (
        <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
          <Badge variant="secondary" className="text-xs">
            {activePreset.name}
          </Badge>
          <span className="text-xs text-muted-foreground flex-1">
            First message: "{activePreset.firstMessage.slice(0, 40)}..."
          </span>
        </div>
      )}

      {/* Custom prompt editor - always visible for custom, or as override view */}
      <div className="space-y-3 pt-2 border-t border-border">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            {isCustom ? 'Custom System Prompt' : 'System Prompt Preview'}
          </Label>
          {!isCustom && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetToPreset}
              disabled={disabled}
              className="h-7 text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          )}
        </div>
        
        <Textarea
          value={isCustom ? customPrompt : activePreset?.systemPrompt || customPrompt}
          onChange={(e) => onCustomPromptChange(e.target.value)}
          placeholder="Define the agent's personality, tone, and behavior guidelines..."
          className="min-h-[100px] text-sm font-mono resize-none"
          disabled={disabled || !isCustom}
        />

        <div className="space-y-2">
          <Label className="text-sm font-medium">
            {isCustom ? 'Custom First Message' : 'First Message Preview'}
          </Label>
          <Textarea
            value={isCustom ? customFirstMessage : activePreset?.firstMessage || customFirstMessage}
            onChange={(e) => onCustomFirstMessageChange(e.target.value)}
            placeholder="The greeting the agent will use when starting a conversation..."
            className="min-h-[60px] text-sm resize-none"
            disabled={disabled || !isCustom}
          />
        </div>

        <p className="text-xs text-muted-foreground">
          {isCustom 
            ? "Define how the agent should behave and respond. These settings are sent to ElevenLabs when starting a conversation."
            : "Select 'Custom' to edit these values directly."}
        </p>
      </div>
    </div>
  );
}
