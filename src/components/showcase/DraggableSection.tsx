import { useDroppable } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripHorizontal } from 'lucide-react';
import { DraggableCard } from './DraggableCard';
import type { ShowcaseSection } from '@/hooks/useShowcaseLayout';

interface DraggableSectionProps {
  section: ShowcaseSection;
  editMode: boolean;
  isSectionSortable?: boolean;
}

function SectionLabel({ title, editMode, dragProps }: { title: string; editMode: boolean; dragProps?: any }) {
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
        <p className="text-[11px] font-semibold uppercase tracking-widest text-primary/60">
          {title}
        </p>
      </div>
      <div className="h-px flex-1 bg-gradient-to-l from-primary/30 via-primary/10 to-transparent" />
    </div>
  );
}

export function DraggableSection({ section, editMode, isSectionSortable }: DraggableSectionProps) {
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
      <SectionLabel title={section.title} editMode={editMode} dragProps={dragHandleProps} />
      <SortableContext items={section.cards} strategy={rectSortingStrategy}>
        {section.cards.map((cardId) => (
          <DraggableCard
            key={cardId}
            id={cardId}
            editMode={editMode}
            className={cardId === 'agent-orbs' ? 'sm:col-span-2 lg:col-span-1' : ''}
          />
        ))}
      </SortableContext>
    </div>
  );
}
