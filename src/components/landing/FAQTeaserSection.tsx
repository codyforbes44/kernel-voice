import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { SectionWrapper } from '@/components/shared/SectionWrapper';
import { SectionHeading } from '@/components/shared/SectionHeading';

const faqs = [
  {
    q: 'Do I need an account to try ƷBI?',
    a: 'No. You can start a voice conversation as a guest and create an account when you want to save it.',
  },
  {
    q: 'Which voice providers can I choose from?',
    a: 'ƷBI ships with ElevenLabs, Gemini Live, OpenAI Realtime and VAPI — all available on every paid tier.',
  },
  {
    q: "What's the difference between Personal and Builder?",
    a: 'Personal is for talking to ƷBI yourself. Builder adds embeddable widgets, a knowledge base and API access for shipping AI in your product.',
  },
];

export const FAQTeaserSection = () => {
  const navigate = useNavigate();

  return (
    <SectionWrapper>
      <SectionHeading title="Common questions" subtitle="Everything you might be wondering, in one place." />

      <motion.div
        className="max-w-3xl mx-auto grid gap-4 sm:gap-6"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6 }}
      >
        {faqs.map(({ q, a }) => (
          <article key={q} className="rounded-xl border border-border bg-card p-5 sm:p-6">
            <h3 className="font-semibold text-base sm:text-lg mb-2 tracking-tight">{q}</h3>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{a}</p>
          </article>
        ))}
      </motion.div>

      <div className="text-center mt-8">
        <Button variant="outline" onClick={() => navigate('/pricing')} className="min-h-[44px]">
          See all pricing details
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </SectionWrapper>
  );
};
