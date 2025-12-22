// ARCHIVED: Original landing page preserved for future use
// This was the homepage before making VoiceAssistantMobile the main entry point

import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Mic, Search, FileText, Smartphone, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import SEO from '@/components/SEO';
import { Header } from '@/components/layout/Header';

const LandingPageArchived = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <>
      <SEO 
        title="Kernel - Premium Conversational AI"
        description="Experience the future of AI interaction with real-time voice conversations, intelligent web search, and advanced document analysis."
        image="/og-home.png"
        keywords={["AI voice assistant", "voice AI", "real-time conversation", "document analysis", "web search AI"]}
      />
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <h1 className="text-6xl md:text-7xl font-display font-bold tracking-tight">
              <span className="text-gradient">AI Voice</span>
              <br />
              <span className="text-foreground">Assistant</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Experience real-time voice conversations, intelligent web search, 
              and advanced document analysis powered by cutting-edge AI.
            </p>

            <div className="flex items-center justify-center gap-4 pt-4 flex-wrap">
              <Button
                onClick={() => navigate('/assistant')}
                size="lg"
                className="px-8 py-6 text-lg font-semibold glow-primary"
              >
                <Mic className="mr-2 h-5 w-5" />
                Launch Assistant
              </Button>
              <Button
                onClick={() => navigate('/')}
                size="lg"
                variant="secondary"
                className="px-8 py-6 text-lg font-semibold"
              >
                <Smartphone className="mr-2 h-5 w-5" />
                Mobile Version
              </Button>
              <Button
                onClick={() => navigate('/install')}
                size="lg"
                variant="outline"
                className="px-8 py-6 text-lg font-semibold"
              >
                <Download className="mr-2 h-5 w-5" />
                Install App
              </Button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 pt-16">
            <div className="p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-lg hover:glow-primary">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Mic className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-2">Real-Time Voice</h3>
              <p className="text-muted-foreground">
                Natural, fluid conversations with advanced conversational AI
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border hover:border-secondary/50 transition-all hover:shadow-lg hover:glow-accent">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-4">
                <Search className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-2">Web Search</h3>
              <p className="text-muted-foreground">
                Access current information instantly with integrated search capabilities
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-lg hover:glow-primary">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-2">Document Analysis</h3>
              <p className="text-muted-foreground">
                Upload and analyze documents with AI-powered insights and Q&A
              </p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default LandingPageArchived;
