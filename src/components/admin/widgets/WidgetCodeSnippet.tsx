import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Copy, Info } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface WidgetConfig {
  id: string;
  api_key: string;
  name: string;
  config: Record<string, unknown>;
}

interface WidgetCodeSnippetProps {
  widget: WidgetConfig;
  open: boolean;
  onClose: () => void;
}

export function WidgetCodeSnippet({ widget, open, onClose }: WidgetCodeSnippetProps) {
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  const config = widget.config as Record<string, unknown>;
  const baseUrl = 'https://kernel-voice.lovable.app';
  const supabaseUrl = 'https://kombipftuhjetrhnaklu.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvbWJpcGZ0dWhqZXRyaG5ha2x1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NzU4NDEsImV4cCI6MjA4NjM1MTg0MX0.KtVyIyus4l17LNaHMBelVZ-ypYGY5dvRw1v-9441_BI';
  
  const enableVoice = config.enableVoice === true;
  const voiceProvider = config.voiceProvider || 'native';
  const enableTTS = config.enableTTS === true;
  const ttsVoiceId = config.ttsVoiceId || 'EXAVITQu4vr4xnSDxMaL';
  const enableVoiceConversation = config.enableVoiceConversation === true;
  const elevenlabsAgentId = config.elevenlabsAgentId as string | undefined;
  const elevenlabsVoiceId = config.elevenlabsVoiceId as string | undefined;
  const needsSupabaseCredentials = (enableVoice && voiceProvider === 'elevenlabs') || enableTTS || enableVoiceConversation;

  const scriptEmbed = `<!-- ƷBI AI Widget -->
<script>
  window.KernelConfig = {
    apiKey: '${widget.api_key}',
    brandName: '${config.brandName || widget.name}',
    brandColor: '${config.brandColor || '#00CED1'}',
    accentColor: '${config.accentColor || '#00B4D8'}',
    greeting: '${config.greeting || 'Hi! How can I help you today?'}',
    position: '${config.position || 'bottom-right'}'${config.brandLogo ? `,
    brandLogo: '${config.brandLogo}'` : ''}${enableVoice ? `,
    enableVoice: true,
    voiceProvider: '${voiceProvider}'` : ''}${enableTTS ? `,
    enableTTS: true,
    ttsVoiceId: '${ttsVoiceId}'` : ''}${enableVoiceConversation ? `,
    enableVoiceConversation: true` : ''}${elevenlabsAgentId ? `,
    elevenlabsAgentId: '${elevenlabsAgentId}'` : ''}${elevenlabsVoiceId ? `,
    elevenlabsVoiceId: '${elevenlabsVoiceId}'` : ''}${needsSupabaseCredentials ? `,
    supabaseUrl: '${supabaseUrl}',
    supabaseKey: '${supabaseKey}'` : ''}
  };
</script>
<script src="${baseUrl}/embed.js" async></script>`;

  const iframeEmbed = `<!-- ƷBI AI Widget (iframe) -->
<iframe
  src="${baseUrl}/widget.html?apiKey=${widget.api_key}${enableVoice ? `&enableVoice=true&voiceProvider=${voiceProvider}` : ''}${enableTTS ? `&enableTTS=true&ttsVoiceId=${ttsVoiceId}` : ''}${enableVoiceConversation ? '&enableVoiceConversation=true' : ''}${elevenlabsAgentId ? `&elevenlabsAgentId=${encodeURIComponent(elevenlabsAgentId)}` : ''}${elevenlabsVoiceId ? `&elevenlabsVoiceId=${encodeURIComponent(elevenlabsVoiceId)}` : ''}${needsSupabaseCredentials ? `&supabaseUrl=${encodeURIComponent(supabaseUrl)}&supabaseKey=${encodeURIComponent(supabaseKey)}` : ''}"
  style="
    position: fixed;
    bottom: 20px;
    ${(config.position || 'bottom-right') === 'bottom-left' ? 'left' : 'right'}: 20px;
    width: 400px;
    height: 600px;
    border: none;
    z-index: 9999;
  "
  allow="microphone"
></iframe>`;

  const reactComponent = `import { useEffect } from 'react';

// Add widget to your React app
function App() {
  useEffect(() => {
    // Configure widget
    window.KernelConfig = {
      apiKey: '${widget.api_key}',
      brandName: '${config.brandName || widget.name}',
      brandColor: '${config.brandColor || '#00CED1'}',
      position: '${config.position || 'bottom-right'}'${enableVoice ? `,
      enableVoice: true,
      voiceProvider: '${voiceProvider}'` : ''}${enableTTS ? `,
      enableTTS: true,
      ttsVoiceId: '${ttsVoiceId}'` : ''}${enableVoiceConversation ? `,
      enableVoiceConversation: true` : ''}${elevenlabsAgentId ? `,
      elevenlabsAgentId: '${elevenlabsAgentId}'` : ''}${elevenlabsVoiceId ? `,
      elevenlabsVoiceId: '${elevenlabsVoiceId}'` : ''}${needsSupabaseCredentials ? `,
      supabaseUrl: '${supabaseUrl}',
      supabaseKey: '${supabaseKey}'` : ''}
    };

    // Load widget script
    const script = document.createElement('script');
    script.src = '${baseUrl}/embed.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      script.remove();
      window.KernelWidget?.destroy();
    };
  }, []);

  return <div>{/* Your app content */}</div>;
}`;

  const copyCode = async (code: string, tabName: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedTab(tabName);
    toast.success('Code copied to clipboard');
    setTimeout(() => setCopiedTab(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Embed Code for "{widget.name}"</DialogTitle>
        </DialogHeader>

        {needsSupabaseCredentials && (
          <Alert className="mt-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              This widget uses ElevenLabs for {enableTTS ? 'text-to-speech' : ''}{enableTTS && enableVoice && voiceProvider === 'elevenlabs' ? ' and ' : ''}{enableVoice && voiceProvider === 'elevenlabs' ? 'voice input' : ''}. The embed code includes the necessary API credentials.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="script" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="script">Script Tag</TabsTrigger>
            <TabsTrigger value="iframe">iFrame</TabsTrigger>
            <TabsTrigger value="react">React</TabsTrigger>
          </TabsList>

          <TabsContent value="script" className="mt-4">
            <p className="text-sm text-muted-foreground mb-3">
              Add this code to your website's HTML, just before the closing <code>&lt;/body&gt;</code> tag:
            </p>
            <div className="relative">
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                <code>{scriptEmbed}</code>
              </pre>
              <Button
                size="sm"
                variant="secondary"
                className="absolute top-2 right-2"
                onClick={() => copyCode(scriptEmbed, 'script')}
              >
                {copiedTab === 'script' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="iframe" className="mt-4">
            <p className="text-sm text-muted-foreground mb-3">
              Use an iframe for maximum isolation. Add this code to your HTML:
            </p>
            <div className="relative">
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                <code>{iframeEmbed}</code>
              </pre>
              <Button
                size="sm"
                variant="secondary"
                className="absolute top-2 right-2"
                onClick={() => copyCode(iframeEmbed, 'iframe')}
              >
                {copiedTab === 'iframe' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="react" className="mt-4">
            <p className="text-sm text-muted-foreground mb-3">
              For React applications, add this to your main component:
            </p>
            <div className="relative">
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                <code>{reactComponent}</code>
              </pre>
              <Button
                size="sm"
                variant="secondary"
                className="absolute top-2 right-2"
                onClick={() => copyCode(reactComponent, 'react')}
              >
                {copiedTab === 'react' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 pt-4 border-t">
          <h4 className="font-medium mb-2">Configuration Options</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <p><code>apiKey</code> - Your widget API key (required)</p>
            <p><code>brandName</code> - Name displayed in the header</p>
            <p><code>brandLogo</code> - URL to your logo image</p>
            <p><code>brandColor</code> - Primary color (hex)</p>
            <p><code>accentColor</code> - Secondary color (hex)</p>
            <p><code>greeting</code> - Initial message from the assistant</p>
            <p><code>position</code> - "bottom-right" or "bottom-left"</p>
            <p><code>enableVoice</code> - Enable voice input (true/false)</p>
            <p><code>voiceProvider</code> - "native" or "elevenlabs"</p>
            <p><code>enableVoiceConversation</code> - Full voice conversation mode (true/false)</p>
            <p><code>elevenlabsAgentId</code> - Custom ElevenLabs Agent ID</p>
            <p><code>elevenlabsVoiceId</code> - Custom ElevenLabs Voice ID</p>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
