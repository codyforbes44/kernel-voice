import { Mic, MessageSquare, MicIcon } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type InputMode = 'voice' | 'text' | 'combined';

interface InputModeSelectorProps {
  value: InputMode;
  onChange: (mode: InputMode) => void;
  disabled?: boolean;
  className?: string;
}

export function InputModeSelector({
  value,
  onChange,
  disabled = false,
  className = '',
}: InputModeSelectorProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as InputMode)}
      disabled={disabled}
      className={`bg-muted/50 p-1 rounded-lg ${className}`}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <ToggleGroupItem
            value="voice"
            aria-label="Voice only mode"
            className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground px-3"
          >
            <Mic className="h-4 w-4" />
          </ToggleGroupItem>
        </TooltipTrigger>
        <TooltipContent>Voice only</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <ToggleGroupItem
            value="combined"
            aria-label="Voice and text mode"
            className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground px-3"
          >
            <div className="flex items-center gap-1">
              <Mic className="h-3 w-3" />
              <span className="text-xs">+</span>
              <MessageSquare className="h-3 w-3" />
            </div>
          </ToggleGroupItem>
        </TooltipTrigger>
        <TooltipContent>Voice + Text</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <ToggleGroupItem
            value="text"
            aria-label="Text only mode"
            className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground px-3"
          >
            <MessageSquare className="h-4 w-4" />
          </ToggleGroupItem>
        </TooltipTrigger>
        <TooltipContent>Text only</TooltipContent>
      </Tooltip>
    </ToggleGroup>
  );
}
