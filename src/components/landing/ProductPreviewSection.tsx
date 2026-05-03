import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Brain, Volume2, Sparkles, ChevronRight, Play, Pause } from 'lucide-react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { SectionWrapper } from '@/components/shared/SectionWrapper';
import { Button } from '@/components/ui/button';
import { LiveWaveformCanvas } from '@/components/voice/LiveWaveformCanvas';
import { cn } from '@/lib/utils';
import { track } from '@/lib/analytics';

const DEMO_SOURCE = 'landing_product_preview';

type DemoState = 'idle' | 'listening' | 'thinking' | 'speaking';

const stateMeta: Record<DemoState, { label: string; icon: typeof Mic; gradient: string; ring: string }> = {
  idle: {
    label: 'Idle',
    icon: Sparkles,
    gradient: 'from-muted-foreground/40 to-muted-foreground/20',
    ring: 'shadow-[0_0_0_1px_hsl(var(--border))]',
  },
  listening: {
    label: 'Listening',
    icon: Mic,
    gradient: 'from-primary to-primary-glow',
    ring: 'shadow-[0_0_60px_hsl(var(--primary)/0.55)]',
  },
  thinking: {
    label: 'Thinking',
    icon: Brain,
    gradient: 'from-secondary to-primary',
    ring: 'shadow-[0_0_60px_hsl(var(--secondary)/0.45)]',
  },
  speaking: {
    label: 'Speaking',
    icon: Volume2,
    gradient: 'from-primary-glow to-secondary',
    ring: 'shadow-[0_0_70px_hsl(var(--primary)/0.65)]',
  },
};

type Turn = { user: string; agent: string };

const SCRIPT: Turn[] = [
  {
    user: 'Hey ƷBI, what can you do for my business?',
    agent: 'I can answer customer questions, qualify leads and book meetings — live, in voice or text, on your site.',
  },
  {
    user: 'Can I embed you in my product?',
    agent: 'Yes. Drop in one script tag, customize the look, and your assistant is live with your knowledge base.',
  },
  {
    user: 'How fast does it actually feel?',
    agent: 'Sub-second responses. It listens, thinks, and speaks in real time — like a real conversation.',
  },
];

const PHASE = {
  listening: 2600,
  thinking: 1100,
  speaking: 4200,
  pause: 700,
} as const;

const STATE_PILLS: ReadonlyArray<Exclude<DemoState, 'idle'>> = ['listening', 'thinking', 'speaking'];

export const ProductPreviewSection = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { amount: 0.3 });

  const [paused, setPaused] = useState(false);
  const [turnIndex, setTurnIndex] = useState(0);
  const [state, setState] = useState<DemoState>('idle');
  const [userTyped, setUserTyped] = useState('');
  const [agentTyped, setAgentTyped] = useState('');
  const [level, setLevel] = useState(0);

  // Roving-tabindex focus index for the state-pill toolbar.
  const [pillFocusIndex, setPillFocusIndex] = useState(0);
  const pillRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const turn = SCRIPT[turnIndex];
  const meta = stateMeta[state];

  const isRunning = inView && !paused;

  // Fire `demo_viewed` once per mount when the demo first enters the viewport.
  const viewedRef = useRef(false);
  useEffect(() => {
    if (inView && !viewedRef.current) {
      viewedRef.current = true;
      track('demo_viewed', { source: DEMO_SOURCE });
    }
  }, [inView]);

  // Fire `demo_state_changed` on every state transition (auto or manual).
  const prevStateRef = useRef<DemoState>('idle');
  useEffect(() => {
    if (prevStateRef.current === state) return;
    track('demo_state_changed', {
      source: DEMO_SOURCE,
      from: prevStateRef.current,
      to: state,
      turn_index: turnIndex,
    });
    prevStateRef.current = state;
  }, [state, turnIndex]);

  // State machine + typing
  useEffect(() => {
    if (!isRunning) return;
    let cancelled = false;
    const timeouts: number[] = [];

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        const id = window.setTimeout(() => resolve(), ms);
        timeouts.push(id);
      });

    const typeText = async (full: string, setter: (s: string) => void, totalMs: number) => {
      const steps = Math.max(8, Math.min(full.length, 60));
      const stepMs = totalMs / steps;
      for (let i = 1; i <= steps; i++) {
        if (cancelled) return;
        const cut = Math.ceil((full.length * i) / steps);
        setter(full.slice(0, cut));
        await wait(stepMs);
      }
    };

    (async () => {
      setUserTyped('');
      setAgentTyped('');

      setState('listening');
      await typeText(turn.user, setUserTyped, PHASE.listening);
      if (cancelled) return;

      setState('thinking');
      await wait(PHASE.thinking);
      if (cancelled) return;

      setState('speaking');
      await typeText(turn.agent, setAgentTyped, PHASE.speaking);
      if (cancelled) return;

      setState('idle');
      await wait(PHASE.pause);
      if (cancelled) return;
      setTurnIndex((i) => (i + 1) % SCRIPT.length);
    })();

    return () => {
      cancelled = true;
      timeouts.forEach((id) => window.clearTimeout(id));
    };
  }, [isRunning, turnIndex, turn.user, turn.agent]);

  // Simulated audio level
  useEffect(() => {
    if (!isRunning) {
      setLevel(0);
      return;
    }
    let raf = 0;
    let t = 0;
    const tick = () => {
      t += 0.06;
      let v = 0;
      if (state === 'listening') {
        v = 0.35 + Math.abs(Math.sin(t * 1.7)) * 0.45 + (Math.random() - 0.5) * 0.1;
      } else if (state === 'speaking') {
        v = 0.45 + Math.abs(Math.sin(t * 2.4)) * 0.4 + Math.abs(Math.sin(t * 5.1)) * 0.15;
      } else if (state === 'thinking') {
        v = 0.12 + Math.abs(Math.sin(t * 0.9)) * 0.08;
      } else {
        v = 0.05;
      }
      setLevel(Math.max(0, Math.min(1, v)));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isRunning, state]);

  const handleStateClick = useCallback((next: Exclude<DemoState, 'idle'>) => {
    track('demo_state_pill_clicked', { source: DEMO_SOURCE, state: next });
    setPaused(false);
    setState(next);
    const idx = STATE_PILLS.indexOf(next);
    if (idx >= 0) setPillFocusIndex(idx);
  }, []);

  // Roving-tabindex arrow-key navigation for the state-pill toolbar.
  const handlePillKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
      const last = STATE_PILLS.length - 1;
      let next = idx;
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          next = idx === last ? 0 : idx + 1;
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          next = idx === 0 ? last : idx - 1;
          break;
        case 'Home':
          next = 0;
          break;
        case 'End':
          next = last;
          break;
        default:
          return;
      }
      e.preventDefault();
      setPillFocusIndex(next);
      pillRefs.current[next]?.focus();
    },
    [],
  );

  const handlePauseToggle = useCallback(() => {
    setPaused((p) => {
      const next = !p;
      track('demo_play_toggled', {
        source: DEMO_SOURCE,
        action: next ? 'pause' : 'play',
        state,
        turn_index: turnIndex,
      });
      return next;
    });
  }, [state, turnIndex]);

  const handleCtaClick = useCallback(() => {
    track('demo_cta_clicked', {
      source: DEMO_SOURCE,
      cta: 'try_it_for_real',
      state,
      turn_index: turnIndex,
    });
    navigate('/assistant');
  }, [navigate, state, turnIndex]);

  const orbScale = useMemo(() => (state === 'idle' ? 1 : 1 + level * 0.12), [state, level]);

  return (
    <SectionWrapper id="product-preview" glow="center">
      <motion.div
        ref={containerRef}
        className="max-w-4xl mx-auto"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.7 }}
      >
        <div
          role="region"
          aria-label="ƷBI Assistant interactive demo"
          className="relative rounded-2xl border border-border bg-card p-4 sm:p-6 md:p-10 card-elevated glow-border overflow-hidden focus-within:ring-2 focus-within:ring-primary/40 focus-within:ring-offset-2 focus-within:ring-offset-background"
          onKeyDown={(e) => {
            // Space or K toggles play/pause when focus is inside the demo,
            // unless the user is interacting with a button/link/input.
            const target = e.target as HTMLElement;
            const isInteractive = target.closest('button, a, input, textarea, select, [role="button"]');
            if (isInteractive) return;
            if (e.key === ' ' || e.key.toLowerCase() === 'k') {
              e.preventDefault();
              handlePauseToggle();
            }
          }}
          tabIndex={-1}
        >
          {/* Window chrome */}
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-destructive/60" aria-hidden="true" />
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-muted-foreground/30" aria-hidden="true" />
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-muted-foreground/30" aria-hidden="true" />
            <span className="ml-2 sm:ml-3 text-xs text-muted-foreground font-body truncate flex-1" aria-hidden="true">
              ƷBI Assistant
            </span>
            <button
              type="button"
              onClick={handlePauseToggle}
              className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] -m-2 p-2 rounded-md text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label={paused ? 'Play demo (Space or K)' : 'Pause demo (Space or K)'}
              aria-pressed={paused}
              title={paused ? 'Play demo' : 'Pause demo'}
            >
              {paused ? (
                <Play className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                <Pause className="w-3.5 h-3.5" aria-hidden="true" />
              )}
            </button>
          </div>

          {/* Transcript — live region announces new lines politely. */}
          <div
            role="log"
            aria-label="Demo conversation transcript"
            aria-live="polite"
            aria-atomic="false"
            aria-relevant="additions text"
            className="min-h-[120px] sm:min-h-[140px] mb-4 sm:mb-6 space-y-2.5"
          >
            <AnimatePresence mode="popLayout">
              {userTyped && (
                <motion.div
                  key={`user-${turnIndex}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="flex justify-end"
                >
                  <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary/15 border border-primary/25 px-3.5 py-2 text-sm sm:text-[0.95rem] text-foreground">
                    <span className="sr-only">You said: </span>
                    {userTyped}
                    {state === 'listening' && (
                      <span
                        className="inline-block w-1 h-3.5 bg-primary ml-0.5 align-middle animate-pulse"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                </motion.div>
              )}
              {agentTyped && (
                <motion.div
                  key={`agent-${turnIndex}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="flex justify-start"
                >
                  <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-muted/40 border border-border px-3.5 py-2 text-sm sm:text-[0.95rem] text-foreground">
                    <span className="sr-only">Assistant said: </span>
                    {agentTyped}
                    {state === 'speaking' && (
                      <span
                        className="inline-block w-1 h-3.5 bg-primary ml-0.5 align-middle animate-pulse"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                </motion.div>
              )}
              {!userTyped && !agentTyped && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center h-[120px] text-xs text-muted-foreground"
                >
                  {paused ? 'Paused — press play to continue' : 'Connecting…'}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Orb + waveform */}
          <div className="flex flex-col items-center gap-4 sm:gap-5 py-2 sm:py-4">
            <div className="relative">
              <motion.div
                className="absolute inset-0 bg-primary/25 rounded-full blur-3xl"
                animate={{
                  scale: 2 + level * 0.8,
                  opacity: state === 'idle' ? 0.3 : 0.6 + level * 0.3,
                }}
                transition={{ type: 'spring', stiffness: 60, damping: 14 }}
                aria-hidden="true"
              />
              <motion.div
                className={cn(
                  'relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br',
                  meta.gradient,
                  meta.ring,
                  'transition-shadow duration-500'
                )}
                animate={{
                  scale: orbScale,
                  rotate: state === 'thinking' ? 360 : 0,
                }}
                transition={{
                  scale: { type: 'spring', stiffness: 120, damping: 12 },
                  rotate:
                    state === 'thinking'
                      ? { duration: 2.2, repeat: Infinity, ease: 'linear' }
                      : { duration: 0.4 },
                }}
                aria-hidden="true"
              >
                {state === 'thinking' && (
                  <div
                    className="absolute inset-2 rounded-full border-2 border-dashed border-background/40"
                    aria-hidden="true"
                  />
                )}
              </motion.div>
              {/* Polite SR mirror of the assistant state. */}
              <div role="status" aria-live="polite" className="sr-only">
                Assistant is {meta.label.toLowerCase()}
              </div>
            </div>

            <div className="w-full max-w-md h-10 sm:h-12" aria-hidden="true">
              <LiveWaveformCanvas level={level} isActive={state !== 'idle'} barWidth={3} barGap={3} />
            </div>
          </div>

          {/* State pills — toolbar with roving tabindex + arrow-key navigation. */}
          <div
            role="toolbar"
            aria-label="Preview assistant state"
            aria-orientation="horizontal"
            className="flex items-center justify-center gap-2 sm:gap-3 pt-4 mt-2 border-t border-border flex-wrap"
          >
            {STATE_PILLS.map((s, idx) => {
              const m = stateMeta[s];
              const SIcon = m.icon;
              const active = state === s;
              const isFocusTarget = idx === pillFocusIndex;
              return (
                <button
                  key={s}
                  ref={(el) => {
                    pillRefs.current[idx] = el;
                  }}
                  type="button"
                  onClick={() => handleStateClick(s)}
                  onKeyDown={(e) => handlePillKeyDown(e, idx)}
                  onFocus={() => setPillFocusIndex(idx)}
                  tabIndex={isFocusTarget ? 0 : -1}
                  className={cn(
                    'flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full border text-xs sm:text-sm transition-all duration-300 min-h-[36px]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                    active
                      ? 'border-primary/60 bg-primary/15 text-foreground'
                      : 'border-border bg-card/40 text-muted-foreground hover:text-foreground hover:border-primary/30'
                  )}
                  aria-pressed={active}
                  aria-label={`Preview ${m.label.toLowerCase()} state`}
                >
                  <span
                    className={cn(
                      'w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br flex items-center justify-center transition-transform',
                      m.gradient,
                      active && 'scale-110'
                    )}
                    aria-hidden="true"
                  >
                    <SIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary-foreground" aria-hidden="true" />
                  </span>
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Copy + CTA */}
        <div className="text-center mt-6 sm:mt-8 px-2">
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Real-time voice conversations with an AI that listens, thinks, and speaks naturally.
          </p>
          <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              className="w-full sm:w-auto px-6 py-5 glow-primary group min-h-[48px] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              onClick={handleCtaClick}
              aria-label="Try the live ƷBI assistant — opens the assistant page"
            >
              <Mic className="mr-2 h-4 w-4" aria-hidden="true" />
              Try it for real
              <ChevronRight
                className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Button>
            <span className="text-xs text-muted-foreground">No sign-up required to start</span>
          </div>
        </div>
      </motion.div>
    </SectionWrapper>
  );
};
