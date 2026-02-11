import { Mic, MessageSquare } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();

  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as InputMode)}
      disabled={disabled}
      className={`bg-muted/50 p-1 rounded-lg ${className}`}
    >
      <ToggleGroupItem
        value="voice"
        aria-label="Voice only mode"
        className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground min-w-[48px] min-h-[48px] px-3 gap-1.5"
      >
        <Mic className="h-4 w-4" />
        {isMobile && <span className="text-xs">Voice</span>}
      </ToggleGroupItem>

      <ToggleGroupItem
        value="combined"
        aria-label="Voice and text mode"
        className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground min-w-[48px] min-h-[48px] px-3 gap-1.5"
      >
        <div className="flex items-center gap-1">
          <Mic className="h-3 w-3" />
          <span className="text-xs">+</span>
          <MessageSquare className="h-3 w-3" />
        </div>
        {isMobile && <span className="text-xs">Both</span>}
      </ToggleGroupItem>

      <ToggleGroupItem
        value="text"
        aria-label="Text only mode"
        className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground min-w-[48px] min-h-[48px] px-3 gap-1.5"
      >
        <MessageSquare className="h-4 w-4" />
        {isMobile && <span className="text-xs">Text</span>}
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
