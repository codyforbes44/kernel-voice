import { Mic, Brain, Volume2 } from 'lucide-react';
import { motion } from 'framer-motion';

const orbStates = [
  { label: 'Listening', icon: Mic, color: 'from-primary to-primary-glow' },
  { label: 'Thinking', icon: Brain, color: 'from-secondary to-primary' },
  { label: 'Speaking', icon: Volume2, color: 'from-primary-glow to-secondary' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export const ProductPreviewSection = () => {
  return (
    <section id="product-preview" className="py-12 sm:py-20 md:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.05),transparent_70%)]" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          className="max-w-4xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.7 }}
          variants={fadeUp}
        >
          {/* Stylized product mockup */}
          <div className="relative rounded-2xl border border-border bg-card p-4 sm:p-6 md:p-10 card-elevated glow-border">
            {/* Fake window chrome */}
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-destructive/60" />
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-muted-foreground/30" />
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-muted-foreground/30" />
              <span className="ml-2 sm:ml-3 text-xs text-muted-foreground font-body truncate">ƷBI Voice — Assistant</span>
            </div>

            {/* Central orb mockup */}
            <div className="flex flex-col items-center gap-4 sm:gap-6 py-6 sm:py-8">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl scale-[2.5]" />
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-primary to-secondary animate-glow-pulse" />
              </div>
              
              {/* Simulated waveform */}
              <div className="flex items-center gap-0.5 sm:gap-1 h-8">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-0.5 sm:w-1 rounded-full bg-primary/60"
                    style={{
                      height: `${12 + Math.sin(i * 0.8) * 16}px`,
                      animationDelay: `${i * 50}ms`,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Orb state strip */}
            <div className="flex items-center justify-center gap-4 sm:gap-6 md:gap-10 pt-4 border-t border-border">
              {orbStates.map(({ label, icon: Icon, color }) => (
                <div key={label} className="flex items-center gap-1.5 sm:gap-2">
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br ${color} flex items-center justify-center`}>
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-foreground" />
                  </div>
                  <span className="text-xs sm:text-sm text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Copy */}
          <motion.p
            className="text-center text-base sm:text-lg md:text-xl text-muted-foreground mt-6 sm:mt-8 max-w-2xl mx-auto px-2"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            Real-time voice conversations with an AI that listens, thinks, and speaks naturally.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
};
