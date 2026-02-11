import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Mic, Music, MessageCircle, Radio, AudioWaveform } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { ChevronRight } from 'lucide-react';

const showcaseCards = [
  { title: 'Voice Chat', icon: Mic, gradient: 'from-primary to-secondary' },
  { title: 'Audio Player', icon: Music, gradient: 'from-secondary to-primary-glow' },
  { title: 'Chat Widget', icon: MessageCircle, gradient: 'from-primary-glow to-primary' },
  { title: 'Live Status', icon: Radio, gradient: 'from-primary to-primary-glow' },
  { title: 'Waveform', icon: AudioWaveform, gradient: 'from-secondary to-primary' },
];

export const ShowcaseTeaserSection = () => {
  const navigate = useNavigate();
  const animation = useScrollAnimation({ threshold: 0.15 });

  return (
    <section ref={animation.ref} className="py-20 md:py-28 bg-muted/30 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-12 transition-all duration-700 ${animation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Showcase</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore interactive components built with our platform.
          </p>
        </div>

        {/* Horizontal scrolling strip on desktop, 2-col grid on mobile */}
        <div className={`transition-all duration-700 delay-200 ${animation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="grid grid-cols-2 md:flex md:overflow-x-auto md:scrollbar-hide gap-4 md:gap-6 md:pb-4">
            {showcaseCards.map(({ title, icon: Icon, gradient }) => (
              <div
                key={title}
                className="flex-shrink-0 md:w-56 rounded-2xl border border-border bg-card p-6 card-elevated glow-hover transition-all duration-300 hover:scale-[1.03] cursor-pointer"
                onClick={() => navigate('/showcase')}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-sm">{title}</h3>
              </div>
            ))}
          </div>
        </div>

        <div className={`text-center mt-10 transition-all duration-700 delay-300 ${animation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <Button variant="outline" size="lg" onClick={() => navigate('/showcase')} className="px-8 py-6 text-lg">
            Explore the Showcase
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};
