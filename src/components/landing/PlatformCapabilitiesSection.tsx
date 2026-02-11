import { Mic, Bot, Code2, FileSearch, Keyboard, Palette } from 'lucide-react';
import { useStaggeredAnimation } from '@/hooks/useScrollAnimation';

const features = [
  {
    icon: Mic,
    title: 'Multi-Provider Voice',
    description: 'Choose from ElevenLabs, Gemini, OpenAI, or VAPI for the perfect voice experience.',
  },
  {
    icon: Bot,
    title: 'Custom AI Agents',
    description: 'Create, save, and switch between personalized AI assistants with unique personalities.',
  },
  {
    icon: Code2,
    title: 'Embeddable Widgets',
    description: 'Deploy AI chat and voice widgets on any website with full visual customization.',
  },
  {
    icon: FileSearch,
    title: 'Knowledge Base',
    description: 'Upload documents and build a searchable knowledge base your AI can reference.',
  },
  {
    icon: Keyboard,
    title: 'Voice, Text, or Both',
    description: 'Seamlessly switch between voice, text, and combined input modes.',
  },
  {
    icon: Palette,
    title: 'Widget Studio',
    description: 'Customize colors, dark mode, header styles, bubble shapes, and brand identity.',
  },
];

export const PlatformCapabilitiesSection = () => {
  const animation = useStaggeredAnimation(6, { threshold: 0.1 });

  return (
    <section ref={animation.ref} className="py-20 md:py-28 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-16 transition-all duration-700 ${animation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Platform Capabilities
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to build, customize, and deploy AI-powered voice and chat experiences.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`group p-6 md:p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-500 card-elevated glow-hover ${animation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
              style={animation.getItemDelay(index)}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
