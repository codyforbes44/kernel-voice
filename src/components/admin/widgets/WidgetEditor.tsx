import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { WidgetPreview } from './WidgetPreview';

interface WidgetConfig {
  id: string;
  user_id: string;
  api_key: string;
  name: string;
  config: Record<string, unknown>;
  allowed_domains: string[];
  is_active: boolean;
}

interface WidgetEditorProps {
  widget: WidgetConfig | null;
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'wk_';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function WidgetEditor({ widget, open, onClose, onSave }: WidgetEditorProps) {
  const [name, setName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [brandLogo, setBrandLogo] = useState('');
  const [brandColor, setBrandColor] = useState('#00CED1');
  const [accentColor, setAccentColor] = useState('#00B4D8');
  const [greeting, setGreeting] = useState('Hi! How can I help you today?');
  const [placeholder, setPlaceholder] = useState('Type your message...');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [allowedDomains, setAllowedDomains] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [enableKB, setEnableKB] = useState(false);
  const [enableVoice, setEnableVoice] = useState(false);
  const [position, setPosition] = useState<'bottom-right' | 'bottom-left'>('bottom-right');

  useEffect(() => {
    if (widget) {
      setName(widget.name);
      const config = widget.config as Record<string, unknown>;
      setBrandName((config.brandName as string) || '');
      setBrandLogo((config.brandLogo as string) || '');
      setBrandColor((config.brandColor as string) || '#00CED1');
      setAccentColor((config.accentColor as string) || '#00B4D8');
      setGreeting((config.greeting as string) || 'Hi! How can I help you today?');
      setPlaceholder((config.placeholder as string) || 'Type your message...');
      setSystemPrompt((config.systemPrompt as string) || '');
      setAllowedDomains(widget.allowed_domains.join(', '));
      setIsActive(widget.is_active);
      setEnableKB((config.enableKB as boolean) || false);
      setEnableVoice((config.enableVoice as boolean) || false);
      setPosition((config.position as 'bottom-right' | 'bottom-left') || 'bottom-right');
    } else {
      // Reset for new widget
      setName('');
      setBrandName('');
      setBrandLogo('');
      setBrandColor('#00CED1');
      setAccentColor('#00B4D8');
      setGreeting('Hi! How can I help you today?');
      setPlaceholder('Type your message...');
      setSystemPrompt('');
      setAllowedDomains('');
      setIsActive(true);
      setEnableKB(false);
      setEnableVoice(false);
      setPosition('bottom-right');
    }
  }, [widget, open]);

  const saveWidget = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const config = {
        brandName: brandName || name,
        brandLogo,
        brandColor,
        accentColor,
        greeting,
        placeholder,
        systemPrompt,
        enableKB,
        enableVoice,
        position,
      };

      const domains = allowedDomains
        .split(',')
        .map(d => d.trim())
        .filter(d => d.length > 0);

      if (widget) {
        // Update existing
        const { error } = await supabase
          .from('widget_configs')
          .update({
            name,
            config,
            allowed_domains: domains,
            is_active: isActive,
          })
          .eq('id', widget.id);
        
        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('widget_configs')
          .insert({
            user_id: user.id,
            api_key: generateApiKey(),
            name,
            config,
            allowed_domains: domains,
            is_active: isActive,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(widget ? 'Widget updated' : 'Widget created');
      onSave();
    },
    onError: (error) => {
      toast.error('Failed to save widget: ' + error.message);
    },
  });

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {widget ? 'Edit Widget' : 'Create New Widget'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          {/* Settings Panel */}
          <div>

        <Tabs defaultValue="general" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="behavior">Behavior</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Widget Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Main Website Chat"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="domains">Allowed Domains</Label>
              <Input
                id="domains"
                value={allowedDomains}
                onChange={(e) => setAllowedDomains(e.target.value)}
                placeholder="example.com, app.example.com (leave empty for all)"
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated list of domains that can embed this widget
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Widget Active</Label>
                <p className="text-xs text-muted-foreground">
                  Disable to temporarily stop the widget from working
                </p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Knowledge Base</Label>
                <p className="text-xs text-muted-foreground">
                  Use your knowledge base documents for context
                </p>
              </div>
              <Switch checked={enableKB} onCheckedChange={setEnableKB} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Voice Input</Label>
                <p className="text-xs text-muted-foreground">
                  Allow users to speak instead of typing (browser speech recognition)
                </p>
              </div>
              <Switch checked={enableVoice} onCheckedChange={setEnableVoice} />
            </div>
          </TabsContent>

          <TabsContent value="branding" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="brandName">Brand Name</Label>
              <Input
                id="brandName"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Displayed in the widget header"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brandLogo">Brand Logo URL</Label>
              <Input
                id="brandLogo"
                value={brandLogo}
                onChange={(e) => setBrandLogo(e.target.value)}
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brandColor">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    id="brandColor"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    placeholder="#00CED1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accentColor">Accent Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    id="accentColor"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    placeholder="#00B4D8"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Widget Position</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={position === 'bottom-right' ? 'default' : 'outline'}
                  onClick={() => setPosition('bottom-right')}
                  className="flex-1"
                >
                  Bottom Right
                </Button>
                <Button
                  type="button"
                  variant={position === 'bottom-left' ? 'default' : 'outline'}
                  onClick={() => setPosition('bottom-left')}
                  className="flex-1"
                >
                  Bottom Left
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="behavior" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="greeting">Greeting Message</Label>
              <Input
                id="greeting"
                value={greeting}
                onChange={(e) => setGreeting(e.target.value)}
                placeholder="Hi! How can I help you today?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="placeholder">Input Placeholder</Label>
              <Input
                id="placeholder"
                value={placeholder}
                onChange={(e) => setPlaceholder(e.target.value)}
                placeholder="Type your message..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="systemPrompt">System Prompt</Label>
              <Textarea
                id="systemPrompt"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="You are a helpful AI assistant..."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Instructions for the AI on how to respond
              </p>
            </div>
          </TabsContent>
        </Tabs>

          </div>

          {/* Preview Panel */}
          <div className="hidden lg:block">
            <WidgetPreview
              brandName={brandName || name}
              brandLogo={brandLogo}
              brandColor={brandColor}
              accentColor={accentColor}
              greeting={greeting}
              placeholder={placeholder}
              position={position}
              enableVoice={enableVoice}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={() => saveWidget.mutate()} 
            disabled={!name.trim() || saveWidget.isPending}
          >
            {saveWidget.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {widget ? 'Save Changes' : 'Create Widget'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
