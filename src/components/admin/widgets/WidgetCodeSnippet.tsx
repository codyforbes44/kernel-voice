import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';

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
  const baseUrl = window.location.origin;

  const scriptEmbed = `<!-- Kernel AI Widget -->
<script>
  window.KernelConfig = {
    apiKey: '${widget.api_key}',
    brandName: '${config.brandName || widget.name}',
    brandColor: '${config.brandColor || '#00CED1'}',
    accentColor: '${config.accentColor || '#00B4D8'}',
    greeting: '${config.greeting || 'Hi! How can I help you today?'}',
    position: '${config.position || 'bottom-right'}'${config.brandLogo ? `,
    brandLogo: '${config.brandLogo}'` : ''}
  };
</script>
<script src="${baseUrl}/embed.js" async></script>`;

  const iframeEmbed = `<!-- Kernel AI Widget (iframe) -->
<iframe
  src="${baseUrl}/widget.html?apiKey=${widget.api_key}"
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
      position: '${config.position || 'bottom-right'}'
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
