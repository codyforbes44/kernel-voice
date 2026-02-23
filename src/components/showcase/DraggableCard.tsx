import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { renderCard } from './ShowcaseCardRegistry';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

interface DraggableCardProps {
  id: string;
  editMode: boolean;
  className?: string;
}

export function DraggableCard({ id, editMode, className = '' }: DraggableCardProps) {
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
      className={`relative transition-transform duration-300 hover:scale-[1.02] hover:shadow-glow-subtle ${className}`}
    >
      {editMode && (
        <button
          {...attributes}
          {...listeners}
          className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-muted/80 backdrop-blur border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-grab active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}
      {renderCard(id)}
    </motion.div>
  );
}
