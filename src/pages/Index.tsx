import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Mic, Search, FileText } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="inline-block">
              <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">
                  Powered by xAI Grok & ElevenLabs
                </span>
              </div>
            </div>

            <h1 className="text-6xl md:text-7xl font-display font-bold tracking-tight">
              <span className="text-gradient">Premium AI</span>
              <br />
              <span className="text-foreground">Voice Assistant</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Experience the future of AI interaction with real-time voice conversations, 
              intelligent web search, and advanced document analysis.
            </p>

            <div className="flex items-center justify-center gap-4 pt-4">
              <Button
                onClick={() => navigate('/assistant')}
                size="lg"
                className="px-8 py-6 text-lg font-semibold glow-primary"
              >
                <Mic className="mr-2 h-5 w-5" />
                Launch Assistant
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
                Natural, fluid conversations with advanced voice AI powered by ElevenLabs
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border hover:border-secondary/50 transition-all hover:shadow-lg hover:glow-accent">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-4">
                <Search className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-2">Web Search</h3>
              <p className="text-muted-foreground">
                Access current information instantly with integrated web search capabilities
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

          {/* Tech Stack */}
          <div className="pt-16 pb-8">
            <p className="text-sm text-muted-foreground mb-4">Built with premium AI technology</p>
            <div className="flex items-center justify-center gap-8 flex-wrap">
              <div className="text-lg font-display font-semibold text-primary">xAI Grok</div>
              <div className="w-px h-8 bg-border" />
              <div className="text-lg font-display font-semibold text-secondary">ElevenLabs</div>
              <div className="w-px h-8 bg-border" />
              <div className="text-lg font-display font-semibold text-primary">Lovable Cloud</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
