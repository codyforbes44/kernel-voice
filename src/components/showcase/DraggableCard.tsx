import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { renderCard } from './ShowcaseCardRegistry';
import { motion } from 'framer-motion';
import type { CardSize } from '@/hooks/useShowcaseLayout';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

const sizeClasses: Record<CardSize, string> = {
  sm: '',
  md: '',
  lg: 'sm:col-span-2',
};

const SIZE_OPTIONS: { value: CardSize; label: string }[] = [
  { value: 'sm', label: 'S' },
  { value: 'md', label: 'M' },
  { value: 'lg', label: 'L' },
];

interface DraggableCardProps {
  id: string;
  editMode: boolean;
  size: CardSize;
  onSizeChange?: (id: string, size: CardSize) => void;
}

export function DraggableCard({ id, editMode, size, onSizeChange }: DraggableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !editMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      variants={fadeUp}
      className={`relative transition-transform duration-300 hover:scale-[1.02] hover:shadow-glow-subtle ${sizeClasses[size]}`}
    >
      {editMode && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
          {/* Size picker */}
          <div className="flex rounded-lg overflow-hidden border border-border bg-muted/80 backdrop-blur">
            {SIZE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onSizeChange?.(id, opt.value)}
                className={`px-2 py-1 text-[10px] font-semibold transition-colors min-w-[24px] ${
                  size === opt.value
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
                aria-label={`Set card size to ${opt.label}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {/* Drag handle */}
          <button
            {...attributes}
            {...listeners}
            className="p-1.5 rounded-lg bg-muted/80 backdrop-blur border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-grab active:cursor-grabbing"
            aria-label="Drag to reorder"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        </div>
      )}
      {renderCard(id)}
    </motion.div>
  );
}
