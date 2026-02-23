import { useState, useCallback, useEffect } from 'react';

export type CardSize = 'sm' | 'md' | 'lg';

export interface ShowcaseSection {
  id: string;
  title: string;
  cards: string[];
}

export type CardSizes = Record<string, CardSize>;

const DEFAULT_LAYOUT: ShowcaseSection[] = [
  {
    id: 'voice-agents',
    title: 'Voice Agents',
    cards: ['agent-orbs', 'openai-realtime', 'voice-chat'],
  },
  {
    id: 'text-conversations',
    title: 'Text Conversations',
    cards: ['chat-conversation', 'web-search', 'claude-reasoning', 'widget-chat'],
  },
  {
    id: 'voice-input',
    title: 'Voice Input',
    cards: ['voice-fill', 'character-select'],
  },
  {
    id: 'visualizations',
    title: 'Visualizations',
    cards: ['showcase-waveform', 'music-player', 'particle-field', 'live-status'],
  },
];

const STORAGE_KEY = 'showcase-layout';
const SIZES_KEY = 'showcase-card-sizes';

function getAllDefaultCardIds(): string[] {
  return DEFAULT_LAYOUT.flatMap((s) => s.cards);
}

function mergeNewCards(saved: ShowcaseSection[]): ShowcaseSection[] {
  const allDefault = getAllDefaultCardIds();
  const existing = new Set(saved.flatMap((s) => s.cards));
  const missing = allDefault.filter((id) => !existing.has(id));
  if (missing.length === 0) return saved;
  // Also remove cards that no longer exist in defaults
  const validIds = new Set(allDefault);
  const cleaned = saved.map((s) => ({
    ...s,
    cards: s.cards.filter((c) => validIds.has(c)),
  }));
  // Append missing to last section
  const last = cleaned[cleaned.length - 1];
  last.cards = [...last.cards, ...missing];
  return cleaned;
}

function loadLayout(): ShowcaseSection[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_LAYOUT;
    const parsed = JSON.parse(raw) as ShowcaseSection[];
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_LAYOUT;
    return mergeNewCards(parsed);
  } catch {
    return DEFAULT_LAYOUT;
  }
}

function loadSizes(): CardSizes {
  try {
    const raw = localStorage.getItem(SIZES_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as CardSizes;
  } catch {
    return {};
  }
}

export function useShowcaseLayout() {
  // Check URL params on init for shared layout
  const [sections, setSections] = useState<ShowcaseSection[]>(() => {
    const params = new URLSearchParams(window.location.search);
    const layoutParam = params.get('layout');
    if (layoutParam) {
      try {
        const decoded = JSON.parse(atob(layoutParam)) as { s: ShowcaseSection[]; z?: CardSizes };
        if (Array.isArray(decoded.s) && decoded.s.length > 0) {
          return mergeNewCards(decoded.s);
        }
      } catch { /* fall through */ }
    }
    return loadLayout();
  });
  const [editMode, setEditMode] = useState(false);
  const [cardSizes, setCardSizes] = useState<CardSizes>(() => {
    const params = new URLSearchParams(window.location.search);
    const layoutParam = params.get('layout');
    if (layoutParam) {
      try {
        const decoded = JSON.parse(atob(layoutParam)) as { s: ShowcaseSection[]; z?: CardSizes };
        if (decoded.z) return decoded.z;
      } catch { /* fall through */ }
    }
    return loadSizes();
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sections));
  }, [sections]);

  useEffect(() => {
    localStorage.setItem(SIZES_KEY, JSON.stringify(cardSizes));
  }, [cardSizes]);

  const getCardSize = useCallback(
    (cardId: string): CardSize => cardSizes[cardId] || 'md',
    [cardSizes],
  );

  const setCardSize = useCallback((cardId: string, size: CardSize) => {
    setCardSizes((prev) => ({ ...prev, [cardId]: size }));
  }, []);

  const findCardLocation = useCallback(
    (cardId: string) => {
      for (const section of sections) {
        const idx = section.cards.indexOf(cardId);
        if (idx !== -1) return { sectionId: section.id, index: idx };
      }
      return null;
    },
    [sections],
  );

  const moveCard = useCallback(
    (activeId: string, overId: string) => {
      setSections((prev) => {
        const next = prev.map((s) => ({ ...s, cards: [...s.cards] }));
        const activeLoc = (() => {
          for (const s of next) {
            const i = s.cards.indexOf(activeId);
            if (i !== -1) return { section: s, index: i };
          }
          return null;
        })();
        if (!activeLoc) return prev;

        const overSection = next.find((s) => s.id === overId);
        if (overSection) {
          activeLoc.section.cards.splice(activeLoc.index, 1);
          overSection.cards.push(activeId);
          return next;
        }

        const overLoc = (() => {
          for (const s of next) {
            const i = s.cards.indexOf(overId);
            if (i !== -1) return { section: s, index: i };
          }
          return null;
        })();
        if (!overLoc) return prev;

        activeLoc.section.cards.splice(activeLoc.index, 1);
        overLoc.section.cards.splice(overLoc.index, 0, activeId);
        return next;
      });
    },
    [],
  );

  const moveSection = useCallback((activeId: string, overId: string) => {
    setSections((prev) => {
      const oldIdx = prev.findIndex((s) => s.id === activeId);
      const newIdx = prev.findIndex((s) => s.id === overId);
      if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) return prev;
      const next = [...prev];
      const [moved] = next.splice(oldIdx, 1);
      next.splice(newIdx, 0, moved);
      return next;
    });
  }, []);

  const resetLayout = useCallback(() => {
    setSections(DEFAULT_LAYOUT);
    setCardSizes({});
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SIZES_KEY);
  }, []);

  const exportLayoutUrl = useCallback(() => {
    // Strip titles to keep URL compact — titles are restored from defaults on import
    const compact = sections.map((s) => ({ id: s.id, title: s.title, cards: s.cards }));
    const nonDefaultSizes = Object.fromEntries(
      Object.entries(cardSizes).filter(([, v]) => v !== 'md'),
    );
    const payload = { s: compact, ...(Object.keys(nonDefaultSizes).length > 0 ? { z: nonDefaultSizes } : {}) };
    const encoded = btoa(JSON.stringify(payload));
    const url = new URL(window.location.href);
    url.searchParams.set('layout', encoded);
    // Remove any hash or other noise
    return url.toString();
  }, [sections, cardSizes]);

  const toggleEditMode = useCallback(() => setEditMode((v) => !v), []);

  return {
    sections,
    editMode,
    toggleEditMode,
    moveCard,
    moveSection,
    resetLayout,
    findCardLocation,
    getCardSize,
    setCardSize,
    exportLayoutUrl,
  };
}
