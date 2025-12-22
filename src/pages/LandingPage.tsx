import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Mic, MessageSquare, FileSearch, Globe, Zap, Shield, ChevronRight } from 'lucide-react';
import SEO from '@/components/SEO';
import { Header } from '@/components/layout/Header';
import { useScrollAnimation, useStaggeredAnimation } from '@/hooks/useScrollAnimation';
import { AnimatedHeroBackground } from '@/components/landing/AnimatedHeroBackground';

const LandingPage = () => {
  const navigate = useNavigate();
  
  // Scroll animations for each section
  const heroAnimation = useScrollAnimation({ threshold: 0.1 });
  const featuresAnimation = useStaggeredAnimation(6, { threshold: 0.1 });
  const ctaAnimation = useScrollAnimation({ threshold: 0.2 });

  const features = [
    {
      icon: Mic,
      title: 'Voice Conversations',
      description: 'Natural, real-time voice interactions powered by advanced AI',
    },
    {
      icon: MessageSquare,
      title: 'Text Chat',
      description: 'Seamless text-based conversations with intelligent responses',
    },
    {
      icon: FileSearch,
      title: 'Document Analysis',
      description: 'Upload and analyze documents with AI-powered insights',
    },
    {
      icon: Globe,
      title: 'Web Search',
      description: 'Real-time web search integration for up-to-date information',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Sub-second response times for natural conversations',
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your data is encrypted and never shared with third parties',
    },
  ];

  return (
    <>
      <SEO 
        title="Kernel - Premium Real-Time Voice AI"
        description="Experience the future of AI interaction with real-time voice conversations, intelligent web search, and advanced document analysis."
        image="/og-home.png"
        keywords={["AI voice assistant", "voice AI", "real-time conversation", "document analysis", "web search AI"]}
      />
      
      <div className="min-h-screen bg-background">
        <Header />
        
        {/* Hero Section */}
        <section ref={heroAnimation.ref} className="relative overflow-hidden">
          {/* Animated Background */}
          <AnimatedHeroBackground />
          
          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.15),transparent_50%)]" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl animate-pulse" />
          
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 md:pt-24 md:pb-32 relative">
            <div className={`max-w-4xl mx-auto text-center transition-all duration-700 ${heroAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              {/* Logo */}
              <div className={`flex justify-center mb-8 transition-all duration-700 delay-100 ${heroAnimation.isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/30 rounded-full blur-2xl scale-150 animate-pulse" />
                  <img 
                    src="/logo.png" 
                    alt="Kernel" 
                    className="relative h-24 w-24 md:h-32 md:w-32 drop-shadow-2xl"
                  />
                </div>
              </div>
              
              {/* Headline */}
              <h1 className={`text-4xl sm:text-5xl md:text-7xl font-display font-bold mb-6 transition-all duration-700 delay-200 ${heroAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <span className="text-foreground">Meet </span>
                <span className="bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent">
                  Kernel
                </span>
              </h1>
              
              {/* Tagline */}
              <p className={`text-lg sm:text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto transition-all duration-700 delay-300 ${heroAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                Premium AI assistant with real-time voice conversations, 
                intelligent web search, and advanced document analysis.
              </p>
              
              {/* CTA Buttons */}
              <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-700 delay-400 ${heroAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <Button 
                  size="lg" 
                  className="px-8 py-6 text-lg glow-primary group"
                  onClick={() => navigate('/assistant')}
                >
                  <Mic className="mr-2 h-5 w-5" />
                  Start Talking
                  <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="px-8 py-6 text-lg"
                  onClick={() => navigate('/auth')}
                >
                  Sign Up Free
                </Button>
              </div>
              
              {/* Stats */}
              <div className={`flex flex-wrap items-center justify-center gap-8 md:gap-12 mt-16 transition-all duration-700 delay-500 ${heroAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-primary">&lt;1s</div>
                  <div className="text-sm text-muted-foreground">Response Time</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-primary">24/7</div>
                  <div className="text-sm text-muted-foreground">Availability</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-primary">100%</div>
                  <div className="text-sm text-muted-foreground">Private & Secure</div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section ref={featuresAnimation.ref} className="py-20 md:py-28 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className={`text-center mb-16 transition-all duration-700 ${featuresAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                Everything You Need
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Kernel combines cutting-edge AI capabilities into one seamless experience
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {features.map((feature, index) => (
                <div 
                  key={feature.title}
                  className={`group p-6 md:p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-500 hover:shadow-lg hover:shadow-primary/5 ${featuresAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
                  style={featuresAnimation.getItemDelay(index)}
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
        
        {/* CTA Section */}
        <section ref={ctaAnimation.ref} className="py-20 md:py-28 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,hsl(var(--primary)/0.1),transparent_50%)]" />
          
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className={`max-w-3xl mx-auto text-center transition-all duration-700 ${ctaAnimation.isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`}>
              <h2 className={`text-3xl md:text-5xl font-display font-bold mb-6 transition-all duration-700 delay-100 ${ctaAnimation.isVisible ? 'opacity-100' : 'opacity-0'}`}>
                Ready to Experience the Future?
              </h2>
              <p className={`text-lg text-muted-foreground mb-8 transition-all duration-700 delay-200 ${ctaAnimation.isVisible ? 'opacity-100' : 'opacity-0'}`}>
                Join thousands of users who are already using Kernel to enhance their productivity.
              </p>
              <Button 
                size="lg" 
                className={`px-10 py-6 text-lg glow-primary transition-all duration-700 delay-300 ${ctaAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                onClick={() => navigate('/assistant')}
              >
                Get Started Now
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>
        
        {/* Footer */}
        <footer className="py-8 border-t border-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-2">
                <img src="/logo.png" alt="Kernel" className="h-6 w-6" />
                <span className="font-semibold">Kernel</span>
              </div>
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} Kernel. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default LandingPage;
