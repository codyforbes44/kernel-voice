

## Drag-and-Drop Customizable Showcase Grid

Transform the Showcase page into a fully modular, user-customizable dashboard where cards can be dragged to reorder and sections can be rearranged. Layout preferences persist in localStorage.

---

### What You'll Get

- **Drag-and-drop cards**: Grab any card and drag it to a new position within or across sections
- **Reorderable sections**: Drag entire section headers to rearrange groups
- **Persistent layout**: Your custom arrangement saves automatically and loads on return
- **Reset button**: One-click restore to the default layout
- **Edit mode toggle**: A lock/unlock button so drag handles only appear when you want to customize
- **Smooth animations**: Cards animate into place during and after drag with visual drag overlay

---

### Technical Details

**New dependency:**
- `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` -- the standard React drag-and-drop library, lightweight and accessible

**New files:**

1. `src/hooks/useShowcaseLayout.ts`
   - Custom hook managing the layout state as an array of sections, each containing ordered card IDs
   - Reads/writes to `localStorage` key `showcase-layout`
   - Provides `moveCard(activeId, overId)`, `moveSection(activeId, overId)`, and `resetLayout()` functions
   - Default layout mirrors the current hardcoded order

2. `src/components/showcase/ShowcaseCardRegistry.tsx`
   - A registry mapping string IDs (e.g., `"agent-orbs"`, `"particle-field"`) to their React components
   - Single source of truth so the layout hook only stores IDs, not components

3. `src/components/showcase/DraggableCard.tsx`
   - Wrapper using `useSortable` from dnd-kit
   - Renders drag handle (grip icon) in top-right corner when edit mode is active
   - Applies transform/transition styles from dnd-kit
   - Keeps existing hover scale and glow effects

4. `src/components/showcase/DraggableSection.tsx`
   - Wraps each section (label + its cards) as a sortable group
   - Section header gets a drag handle when in edit mode
   - Contains a nested `SortableContext` for its cards

**Modified files:**

5. `src/pages/Showcase.tsx`
   - Replace hardcoded card grid with data-driven rendering from `useShowcaseLayout`
   - Wrap grid in `DndContext` with collision detection strategy
   - Add toolbar row in hero strip with:
     - Edit mode toggle button (Pencil/Lock icon)
     - Reset layout button (visible only in edit mode)
   - Cards rendered by iterating sections and looking up components from the registry
   - `onDragEnd` handler calls the hook's move functions

**Layout data structure:**
```text
[
  {
    id: "voice-agents",
    title: "Voice Agents",
    cards: ["agent-orbs", "openai-realtime", "voice-chat"]
  },
  {
    id: "text-conversations",
    title: "Text Conversations",
    cards: ["chat-conversation", "web-search", "claude-reasoning", "widget-chat"]
  },
  ...
]
```

**Drag behavior:**
- Cards can be reordered within their section or moved between sections
- Sections can be reordered relative to each other
- A semi-transparent drag overlay shows the card being moved
- Drop targets highlight with a primary-colored border pulse

**Persistence:**
- On every `onDragEnd`, the new layout array is serialized to `localStorage`
- On mount, the hook checks localStorage and falls back to the default layout
- If new cards are added in future updates, the hook merges them into the layout automatically (appended to the last section)

