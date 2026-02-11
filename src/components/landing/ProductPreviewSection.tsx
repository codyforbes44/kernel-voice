import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Mic, Brain, Volume2 } from 'lucide-react';

const orbStates = [
  { label: 'Listening', icon: Mic, color: 'from-primary to-primary-glow' },
  { label: 'Thinking', icon: Brain, color: 'from-secondary to-primary' },
  { label: 'Speaking', icon: Volume2, color: 'from-primary-glow to-secondary' },
];

export const ProductPreviewSection = () => {
  const animation = useScrollAnimation({ threshold: 0.15 });

  return (
    <section id="product-preview" ref={animation.ref} className="py-20 md:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.05),transparent_70%)]" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className={`max-w-4xl mx-auto transition-all duration-700 ${animation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          
          {/* Stylized product mockup */}
          <div className="relative rounded-2xl border border-border bg-card p-6 md:p-10 card-elevated glow-border">
            {/* Fake window chrome */}
            <div className="flex items-center gap-2 mb-6">
              <div className="w-3 h-3 rounded-full bg-destructive/60" />
              <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
              <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
              <span className="ml-3 text-xs text-muted-foreground font-body">ƷBI Voice — Assistant</span>
            </div>

            {/* Central orb mockup */}
            <div className="flex flex-col items-center gap-6 py-8">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl scale-[2.5]" />
                <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-primary to-secondary animate-glow-pulse" />
              </div>
              
              {/* Simulated waveform */}
              <div className="flex items-center gap-1 h-8">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1 rounded-full bg-primary/60"
                    style={{
                      height: `${12 + Math.sin(i * 0.8) * 16}px`,
                      animationDelay: `${i * 50}ms`,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Orb state strip */}
            <div className="flex items-center justify-center gap-6 md:gap-10 pt-4 border-t border-border">
              {orbStates.map(({ label, icon: Icon, color }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${color} flex items-center justify-center`}>
                    <Icon className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span className="text-sm text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Copy */}
          <p className={`text-center text-lg md:text-xl text-muted-foreground mt-8 max-w-2xl mx-auto transition-all duration-700 delay-200 ${animation.isVisible ? 'opacity-100' : 'opacity-0'}`}>
            Real-time voice conversations with an AI that listens, thinks, and speaks naturally.
          </p>
        </div>
      </div>
    </section>
  );
};
