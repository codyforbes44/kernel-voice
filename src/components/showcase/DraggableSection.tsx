import { useDroppable } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripHorizontal, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { DraggableCard } from './DraggableCard';
import type { ShowcaseSection, CardSize } from '@/hooks/useShowcaseLayout';

interface DraggableSectionProps {
  section: ShowcaseSection;
  editMode: boolean;
  isSectionSortable?: boolean;
  getCardSize: (id: string) => CardSize;
  onCardSizeChange: (id: string, size: CardSize) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

function SectionLabel({ title, editMode, dragProps, collapsed, onToggle }: { title: string; editMode: boolean; dragProps?: any; collapsed?: boolean; onToggle?: () => void }) {
  return (
    <div className="col-span-full flex items-center gap-3 pt-6 first:pt-0">
      <div className="h-px flex-1 bg-gradient-to-r from-primary/30 via-primary/10 to-transparent" />
      <div className="flex items-center gap-2 shrink-0">
        {editMode && dragProps && (
          <button
            {...dragProps}
            className="p-1 rounded-md bg-muted/80 backdrop-blur border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-grab active:cursor-grabbing"
            aria-label="Drag to reorder section"
          >
            <GripHorizontal className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={onToggle}
          className="flex items-center gap-1.5 group cursor-pointer"
          aria-label={collapsed ? `Expand ${title}` : `Collapse ${title}`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-widest text-primary/60 group-hover:text-primary/80 transition-colors">
            {title}
          </p>
          <ChevronDown className={`h-3.5 w-3.5 text-primary/40 group-hover:text-primary/60 transition-all duration-200 ${collapsed ? '-rotate-90' : ''}`} />
        </button>
      </div>
      <div className="h-px flex-1 bg-gradient-to-l from-primary/30 via-primary/10 to-transparent" />
    </div>
  );
}

export function DraggableSection({ section, editMode, isSectionSortable, getCardSize, onCardSizeChange, collapsed, onToggleCollapse }: DraggableSectionProps) {
  const sortable = useSortable({
    id: section.id,
    disabled: !editMode || !isSectionSortable,
  });

  const { setNodeRef: setDroppableRef } = useDroppable({ id: section.id });

  const style = isSectionSortable
    ? {
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition,
        opacity: sortable.isDragging ? 0.4 : 1,
      }
    : undefined;

  const dragHandleProps = isSectionSortable
    ? { ...sortable.attributes, ...sortable.listeners }
    : undefined;

  return (
    <div
      ref={(node) => {
        if (isSectionSortable) sortable.setNodeRef(node);
        setDroppableRef(node);
      }}
      style={style}
      className="contents"
    >
      <SectionLabel title={section.title} editMode={editMode} dragProps={dragHandleProps} collapsed={collapsed} onToggle={onToggleCollapse} />
      <AnimatePresence initial={false}>
        {!collapsed && (
          <SortableContext items={section.cards} strategy={rectSortingStrategy}>
            {section.cards.map((cardId) => (
              <motion.div
                key={cardId}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={getCardSize(cardId) === 'lg' ? 'sm:col-span-2' : ''}
              >
                <DraggableCard
                  id={cardId}
                  editMode={editMode}
                  size={getCardSize(cardId)}
                  onSizeChange={onCardSizeChange}
                />
              </motion.div>
            ))}
          </SortableContext>
        )}
      </AnimatePresence>
    </div>
  );
}
