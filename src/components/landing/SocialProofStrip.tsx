import { motion } from 'framer-motion';

const providers = ['ElevenLabs', 'Gemini Live', 'OpenAI Realtime', 'VAPI'];

export const SocialProofStrip = () => {
  return (
    <section
      aria-label="Supported voice providers"
      className="border-y border-border/50 bg-muted/30"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-8 text-xs sm:text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="uppercase tracking-wider text-[10px] sm:text-xs font-medium">
            Powered by
          </span>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 sm:gap-x-8">
            {providers.map((p) => (
              <span key={p} className="font-medium text-foreground/80">
                {p}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
