import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Pencil, Lock, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { DraggableSection } from '@/components/showcase/DraggableSection';
import { renderCard } from '@/components/showcase/ShowcaseCardRegistry';
import { useShowcaseLayout } from '@/hooks/useShowcaseLayout';
import logo from '@/assets/logo.png';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

export default function Showcase() {
  const { sections, editMode, toggleEditMode, moveCard, moveSection, resetLayout } =
    useShowcaseLayout();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const sectionIds = sections.map((s) => s.id);
  const allCardIds = sections.flatMap((s) => s.cards);
  const isCardDrag = activeId ? allCardIds.includes(activeId) : false;

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      if (!over || active.id === over.id) return;

      const activeStr = String(active.id);
      const overStr = String(over.id);

      // Check if it's a section drag
      if (sectionIds.includes(activeStr) && sectionIds.includes(overStr)) {
        moveSection(activeStr, overStr);
      } else {
        moveCard(activeStr, overStr);
      }
    },
    [sectionIds, moveCard, moveSection],
  );

  return (
    <PageWrapper
      title="ƷBI Voice Playground"
      description="Interactive playground of voice AI components powered by Gemini and ElevenLabs"
      showHeader={false}
      className="dark"
    >
      <div className="px-4 pt-6 sm:pt-10 pb-24 safe-area-inset">
        {/* Hero strip */}
        <div className="mx-auto max-w-7xl flex items-center justify-between gap-3 mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <img src={logo} alt="ƷBI Voice" className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg" />
            <div>
              <h1 className="text-lg sm:text-xl font-display font-bold text-gradient">
                ƷBI Voice Playground
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Interactive voice AI components
              </p>
            </div>
          </div>

          {/* Edit controls */}
          <div className="flex items-center gap-2">
            {editMode && (
              <Button
                size="sm"
                variant="ghost"
                onClick={resetLayout}
                className="text-xs gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </Button>
            )}
            <Button
              size="sm"
              variant={editMode ? 'default' : 'outline'}
              onClick={toggleEditMode}
              className="gap-1.5 text-xs"
            >
              {editMode ? (
                <>
                  <Lock className="h-3.5 w-3.5" />
                  Lock
                </>
              ) : (
                <>
                  <Pencil className="h-3.5 w-3.5" />
                  Customize
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Card grid */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
              className="mx-auto max-w-7xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5"
            >
              {sections.map((section) => (
                <DraggableSection
                  key={section.id}
                  section={section}
                  editMode={editMode}
                  isSectionSortable
                />
              ))}
            </motion.div>
          </SortableContext>

          <DragOverlay dropAnimation={null}>
            {activeId && isCardDrag ? (
              <div className="rounded-2xl shadow-2xl ring-2 ring-primary/50 opacity-80 pointer-events-none max-w-sm">
                {renderCard(activeId)}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </PageWrapper>
  );
}
