import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [voiceProvider, setVoiceProvider] = useState<'native' | 'elevenlabs'>('native');
  const [waveformStyle, setWaveformStyle] = useState<'bars' | 'wave' | 'circular'>('bars');
  const [position, setPosition] = useState<'bottom-right' | 'bottom-left'>('bottom-right');
  const [enableTTS, setEnableTTS] = useState(false);
  const [ttsVoiceId, setTtsVoiceId] = useState('EXAVITQu4vr4xnSDxMaL');
  const [rateLimitPerMinute, setRateLimitPerMinute] = useState(10);
  const [rateLimitPerHour, setRateLimitPerHour] = useState(100);

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
      setVoiceProvider((config.voiceProvider as 'native' | 'elevenlabs') || 'native');
      setWaveformStyle((config.waveformStyle as 'bars' | 'wave' | 'circular') || 'bars');
      setPosition((config.position as 'bottom-right' | 'bottom-left') || 'bottom-right');
      setEnableTTS((config.enableTTS as boolean) || false);
      setTtsVoiceId((config.ttsVoiceId as string) || 'EXAVITQu4vr4xnSDxMaL');
      const rateLimit = config.rateLimit as { messagesPerMinute?: number; messagesPerHour?: number } | undefined;
      setRateLimitPerMinute(rateLimit?.messagesPerMinute ?? 10);
      setRateLimitPerHour(rateLimit?.messagesPerHour ?? 100);
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
      setVoiceProvider('native');
      setWaveformStyle('bars');
      setPosition('bottom-right');
      setEnableTTS(false);
      setTtsVoiceId('EXAVITQu4vr4xnSDxMaL');
      setRateLimitPerMinute(10);
      setRateLimitPerHour(100);
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
        voiceProvider,
        waveformStyle,
        position,
        enableTTS,
        ttsVoiceId,
        rateLimit: {
          messagesPerMinute: rateLimitPerMinute,
          messagesPerHour: rateLimitPerHour,
        },
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="behavior">Behavior</TabsTrigger>
            <TabsTrigger value="limits">Limits</TabsTrigger>
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
                  Allow users to speak instead of typing
                </p>
              </div>
              <Switch checked={enableVoice} onCheckedChange={setEnableVoice} />
            </div>

            {enableVoice && (
              <>
                <div className="space-y-2 pl-4 border-l-2 border-muted">
                  <Label>Voice Provider</Label>
                  <Select value={voiceProvider} onValueChange={(v) => setVoiceProvider(v as 'native' | 'elevenlabs')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="native">Browser Native (Free)</SelectItem>
                      <SelectItem value="elevenlabs">ElevenLabs (Better Accuracy)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {voiceProvider === 'elevenlabs' 
                      ? 'Uses ElevenLabs Scribe for higher accuracy transcription'
                      : 'Uses browser\'s built-in speech recognition (may vary by browser)'}
                  </p>
                </div>

                <div className="space-y-2 pl-4 border-l-2 border-muted">
                  <Label>Waveform Style</Label>
                  <Select value={waveformStyle} onValueChange={(v) => setWaveformStyle(v as 'bars' | 'wave' | 'circular')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bars">Bars (Classic)</SelectItem>
                      <SelectItem value="wave">Wave (Flowing)</SelectItem>
                      <SelectItem value="circular">Circular (Compact)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Visual style for the audio level indicator while recording
                  </p>
                </div>
              </>
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Text-to-Speech</Label>
                <p className="text-xs text-muted-foreground">
                  Speak AI responses aloud using ElevenLabs
                </p>
              </div>
              <Switch checked={enableTTS} onCheckedChange={setEnableTTS} />
            </div>

            {enableTTS && (
              <div className="space-y-2 pl-4 border-l-2 border-muted">
                <Label>Voice</Label>
                <Select value={ttsVoiceId} onValueChange={setTtsVoiceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select voice" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EXAVITQu4vr4xnSDxMaL">Sarah (Warm, Conversational)</SelectItem>
                    <SelectItem value="JBFqnCBsd6RMkjVDRZzb">George (British, Authoritative)</SelectItem>
                    <SelectItem value="onwK4e9ZLuTAKqWW03F9">Daniel (Deep, Friendly)</SelectItem>
                    <SelectItem value="pFZP5JQG7iQjIQuC4Bku">Lily (Young, Cheerful)</SelectItem>
                    <SelectItem value="TX3LPaxmHKxFdv7VOQHJ">Liam (American, Professional)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose the voice for speaking AI responses
                </p>
              </div>
            )}
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

          <TabsContent value="limits" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="rateLimitPerMinute">Messages per Minute</Label>
              <Input
                id="rateLimitPerMinute"
                type="number"
                min={1}
                max={100}
                value={rateLimitPerMinute}
                onChange={(e) => setRateLimitPerMinute(Math.max(1, parseInt(e.target.value) || 10))}
              />
              <p className="text-xs text-muted-foreground">
                Maximum messages a user can send per minute (1-100)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rateLimitPerHour">Messages per Hour</Label>
              <Input
                id="rateLimitPerHour"
                type="number"
                min={1}
                max={1000}
                value={rateLimitPerHour}
                onChange={(e) => setRateLimitPerHour(Math.max(1, parseInt(e.target.value) || 100))}
              />
              <p className="text-xs text-muted-foreground">
                Maximum messages a user can send per hour (1-1000)
              </p>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Current Limits</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Per Minute:</span>{' '}
                  <span className="font-medium">{rateLimitPerMinute}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Per Hour:</span>{' '}
                  <span className="font-medium">{rateLimitPerHour}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Rate limits help prevent abuse and control API usage costs.
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
              voiceProvider={voiceProvider}
              enableTTS={enableTTS}
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
