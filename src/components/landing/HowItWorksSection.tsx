import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Settings2, Bot, Rocket, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const steps = [
  {
    icon: Settings2,
    title: 'Choose Your Mode',
    description: 'Voice, text, or combined. Pick from 4 AI providers.',
  },
  {
    icon: Bot,
    title: 'Customize Your Agent',
    description: 'Set personality, voice, and system prompt. Save it for later.',
  },
  {
    icon: Rocket,
    title: 'Talk or Embed',
    description: 'Use it directly or deploy as a widget on your website.',
  },
];

const stepVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
};

export const HowItWorksSection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-12 sm:py-20 md:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.05),transparent_70%)]" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          className="text-center mb-10 sm:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold mb-3 sm:mb-4">How It Works</h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">Get started in three simple steps</p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          transition={{ staggerChildren: 0.15 }}
        >
          <div className="hidden md:block absolute top-24 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              className="relative text-center"
              variants={stepVariants}
              transition={{ duration: 0.6 }}
            >
              <div className="relative inline-block mb-4 sm:mb-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-card border-2 border-primary/30 flex items-center justify-center mx-auto shadow-lg card-elevated dark:shadow-glow-subtle group hover:border-primary/60 transition-all duration-300 hover:scale-105">
                  <step.icon className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-primary" />
                </div>
                <div className="absolute -top-2 -right-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs sm:text-sm font-bold shadow-md">
                  {index + 1}
                </div>
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-semibold mb-2 sm:mb-3">{step.title}</h3>
              <p className="text-sm sm:text-base text-muted-foreground max-w-xs mx-auto">{step.description}</p>
              {index < steps.length - 1 && (
                <div className="md:hidden flex justify-center my-4 sm:my-6">
                  <ChevronRight className="w-6 h-6 text-primary/50 rotate-90" />
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="text-center mt-8 sm:mt-12 px-4 sm:px-0"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Button size="lg" onClick={() => navigate('/assistant')} className="w-full sm:w-auto px-8 py-6 text-lg glow-primary min-h-[48px]">
            Get Started Free
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};
