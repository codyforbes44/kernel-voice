import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator, SelectGroup, SelectLabel } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Sparkles, Wand2, Save, Users, Palette, MessageSquare, Volume2, Shield, Settings2, Play, Square } from 'lucide-react';
import { WidgetPreview } from './WidgetPreview';
import { SavePresetDialog } from './SavePresetDialog';
import { useCustomPromptPresets } from '@/hooks/useCustomPromptPresets';

const SYSTEM_PROMPT_PRESETS = [
  {
    id: 'friendly-support',
    name: 'Friendly Support',
    prompt: `You are a friendly and helpful customer support assistant. Your personality is warm, professional, and concise.\n\nGuidelines:\n- Keep responses brief and conversational (1-3 sentences when possible)\n- Use natural, spoken language—avoid bullet points and markdown\n- If you don't know something, say so and offer to help find the answer\n- Be helpful, not robotic`,
  },
  {
    id: 'sales-assistant',
    name: 'Sales Assistant',
    prompt: `You are a knowledgeable sales assistant helping customers find the right products or services.\n\nGuidelines:\n- Ask clarifying questions to understand customer needs\n- Highlight benefits and value, not just features\n- Be consultative rather than pushy\n- Guide customers toward solutions that fit their requirements\n- Keep responses conversational and natural`,
  },
  {
    id: 'technical-expert',
    name: 'Technical Expert',
    prompt: `You are a technical support specialist with deep product knowledge.\n\nGuidelines:\n- Provide clear, step-by-step instructions when troubleshooting\n- Use simple language to explain technical concepts\n- Ask diagnostic questions to identify the root cause\n- Offer alternative solutions when the first approach doesn't work\n- Confirm the issue is resolved before ending the conversation`,
  },
  {
    id: 'concierge',
    name: 'Concierge',
    prompt: `You are an elegant, professional concierge assistant. Your tone is refined yet approachable.\n\nGuidelines:\n- Anticipate needs and offer proactive suggestions\n- Provide personalized recommendations based on preferences\n- Maintain a sophisticated but warm demeanor\n- Handle requests with discretion and efficiency\n- Make every interaction feel special and exclusive`,
  },
];

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
  for (let i = 0; i < 32; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

export function WidgetEditor({ widget, open, onClose, onSave }: WidgetEditorProps) {
  // Identity
  const [name, setName] = useState('');
  const [allowedDomains, setAllowedDomains] = useState('');
  const [isActive, setIsActive] = useState(true);
  // Appearance
  const [brandName, setBrandName] = useState('');
  const [brandLogo, setBrandLogo] = useState('');
  const [brandColor, setBrandColor] = useState('#00CED1');
  const [accentColor, setAccentColor] = useState('#00B4D8');
  const [position, setPosition] = useState<'bottom-right' | 'bottom-left'>('bottom-right');
  const [darkMode, setDarkMode] = useState(false);
  const [borderRadius, setBorderRadius] = useState<'sharp' | 'rounded' | 'pill'>('rounded');
  const [headerStyle, setHeaderStyle] = useState<'gradient' | 'solid' | 'minimal'>('gradient');
  const [bubbleStyle, setBubbleStyle] = useState<'rounded' | 'sharp' | 'pill'>('rounded');
  // Behavior
  const [greeting, setGreeting] = useState('Hi! How can I help you today?');
  const [placeholder, setPlaceholder] = useState('Type your message...');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [enableKB, setEnableKB] = useState(false);
  // Voice & Audio
  const [enableVoice, setEnableVoice] = useState(false);
  const [voiceProvider, setVoiceProvider] = useState<'native' | 'elevenlabs'>('native');
  const [waveformStyle, setWaveformStyle] = useState<'bars' | 'wave' | 'circular'>('bars');
  const [enableVoiceConversation, setEnableVoiceConversation] = useState(false);
  const [autoListen, setAutoListen] = useState(true);
  const [enableTTS, setEnableTTS] = useState(false);
  const [ttsVoiceId, setTtsVoiceId] = useState('EXAVITQu4vr4xnSDxMaL');
  // Limits
  const [rateLimitPerMinute, setRateLimitPerMinute] = useState(10);
  const [rateLimitPerHour, setRateLimitPerHour] = useState(100);
  // Dialogs
  const [showSavePresetDialog, setShowSavePresetDialog] = useState(false);
  // TTS Preview
  const [ttsPreviewLoading, setTtsPreviewLoading] = useState(false);
  const [ttsPreviewPlaying, setTtsPreviewPlaying] = useState(false);
  const ttsAudioRef = { current: null as HTMLAudioElement | null };

  const playTtsPreview = async () => {
    if (ttsPreviewPlaying && ttsAudioRef.current) {
      ttsAudioRef.current.pause();
      ttsAudioRef.current = null;
      setTtsPreviewPlaying(false);
      return;
    }
    setTtsPreviewLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const sampleText = greeting || 'Hi! How can I help you today? I\'m your AI assistant and I\'m here to answer any questions you might have.';
      const res = await fetch(`${supabaseUrl}/functions/v1/widget-tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
        body: JSON.stringify({ text: sampleText, voiceId: ttsVoiceId }),
      });
      if (!res.ok) throw new Error(`TTS failed: ${res.status}`);
      const data = await res.json();
      if (!data.audioContent) throw new Error('No audio returned');
      const audio = new Audio(`data:audio/mpeg;base64,${data.audioContent}`);
      ttsAudioRef.current = audio;
      setTtsPreviewPlaying(true);
      audio.onended = () => { ttsAudioRef.current = null; setTtsPreviewPlaying(false); };
      audio.onerror = () => { ttsAudioRef.current = null; setTtsPreviewPlaying(false); };
      await audio.play();
    } catch (err) {
      toast.error('Voice preview failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setTtsPreviewLoading(false);
    }
  };

  const { presets: customPresets, createPreset } = useCustomPromptPresets();

  useEffect(() => {
    if (widget) {
      const c = widget.config as Record<string, unknown>;
      setName(widget.name);
      setAllowedDomains(widget.allowed_domains.join(', '));
      setIsActive(widget.is_active);
      setBrandName((c.brandName as string) || '');
      setBrandLogo((c.brandLogo as string) || '');
      setBrandColor((c.brandColor as string) || '#00CED1');
      setAccentColor((c.accentColor as string) || '#00B4D8');
      setPosition((c.position as 'bottom-right' | 'bottom-left') || 'bottom-right');
      setDarkMode((c.darkMode as boolean) || false);
      setBorderRadius((c.borderRadius as 'sharp' | 'rounded' | 'pill') || 'rounded');
      setHeaderStyle((c.headerStyle as 'gradient' | 'solid' | 'minimal') || 'gradient');
      setBubbleStyle((c.bubbleStyle as 'rounded' | 'sharp' | 'pill') || 'rounded');
      setGreeting((c.greeting as string) || 'Hi! How can I help you today?');
      setPlaceholder((c.placeholder as string) || 'Type your message...');
      setSystemPrompt((c.systemPrompt as string) || '');
      setEnableKB((c.enableKB as boolean) || false);
      setEnableVoice((c.enableVoice as boolean) || false);
      setVoiceProvider((c.voiceProvider as 'native' | 'elevenlabs') || 'native');
      setWaveformStyle((c.waveformStyle as 'bars' | 'wave' | 'circular') || 'bars');
      setEnableVoiceConversation((c.enableVoiceConversation as boolean) || false);
      setAutoListen((c.autoListen as boolean) ?? true);
      setEnableTTS((c.enableTTS as boolean) || false);
      setTtsVoiceId((c.ttsVoiceId as string) || 'EXAVITQu4vr4xnSDxMaL');
      const rl = c.rateLimit as { messagesPerMinute?: number; messagesPerHour?: number } | undefined;
      setRateLimitPerMinute(rl?.messagesPerMinute ?? 10);
      setRateLimitPerHour(rl?.messagesPerHour ?? 100);
    } else {
      setName(''); setAllowedDomains(''); setIsActive(true);
      setBrandName(''); setBrandLogo(''); setBrandColor('#00CED1'); setAccentColor('#00B4D8');
      setPosition('bottom-right'); setDarkMode(false); setBorderRadius('rounded');
      setHeaderStyle('gradient'); setBubbleStyle('rounded');
      setGreeting('Hi! How can I help you today?'); setPlaceholder('Type your message...');
      setSystemPrompt(''); setEnableKB(false);
      setEnableVoice(false); setVoiceProvider('native'); setWaveformStyle('bars');
      setEnableVoiceConversation(false); setAutoListen(true);
      setEnableTTS(false); setTtsVoiceId('EXAVITQu4vr4xnSDxMaL');
      setRateLimitPerMinute(10); setRateLimitPerHour(100);
    }
  }, [widget, open]);

  const saveWidget = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const config = {
        brandName: brandName || name, brandLogo, brandColor, accentColor, position,
        darkMode, borderRadius, headerStyle, bubbleStyle,
        greeting, placeholder, systemPrompt, enableKB,
        enableVoice, voiceProvider, waveformStyle,
        enableVoiceConversation, autoListen,
        enableTTS, ttsVoiceId,
        rateLimit: { messagesPerMinute: rateLimitPerMinute, messagesPerHour: rateLimitPerHour },
      };

      const domains = allowedDomains.split(',').map(d => d.trim()).filter(d => d.length > 0);

      if (widget) {
        const { error } = await supabase.from('widget_configs').update({ name, config, allowed_domains: domains, is_active: isActive }).eq('id', widget.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('widget_configs').insert({ user_id: user.id, api_key: generateApiKey(), name, config, allowed_domains: domains, is_active: isActive });
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success(widget ? 'Widget updated' : 'Widget created'); onSave(); },
    onError: (error) => { toast.error('Failed to save widget: ' + error.message); },
  });

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{widget ? 'Edit Widget' : 'Create New Widget'}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          <div>
            <Tabs defaultValue="identity" className="mt-2">
              <TabsList className="grid w-full grid-cols-5 h-auto">
                <TabsTrigger value="identity" className="flex flex-col gap-0.5 py-1.5 text-xs"><Settings2 className="h-3.5 w-3.5" />Identity</TabsTrigger>
                <TabsTrigger value="appearance" className="flex flex-col gap-0.5 py-1.5 text-xs"><Palette className="h-3.5 w-3.5" />Appearance</TabsTrigger>
                <TabsTrigger value="behavior" className="flex flex-col gap-0.5 py-1.5 text-xs"><MessageSquare className="h-3.5 w-3.5" />Behavior</TabsTrigger>
                <TabsTrigger value="voice" className="flex flex-col gap-0.5 py-1.5 text-xs"><Volume2 className="h-3.5 w-3.5" />Voice</TabsTrigger>
                <TabsTrigger value="limits" className="flex flex-col gap-0.5 py-1.5 text-xs"><Shield className="h-3.5 w-3.5" />Limits</TabsTrigger>
              </TabsList>

              {/* IDENTITY TAB */}
              <TabsContent value="identity" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Widget Name *</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Main Website Chat" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="domains">Allowed Domains</Label>
                  <Input id="domains" value={allowedDomains} onChange={(e) => setAllowedDomains(e.target.value)} placeholder="example.com, app.example.com" />
                  <p className="text-xs text-muted-foreground">Comma-separated. Leave empty for all domains.</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Widget Active</Label>
                    <p className="text-xs text-muted-foreground">Disable to stop the widget temporarily</p>
                  </div>
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Knowledge Base</Label>
                    <p className="text-xs text-muted-foreground">Use KB documents for context</p>
                  </div>
                  <Switch checked={enableKB} onCheckedChange={setEnableKB} />
                </div>
              </TabsContent>

              {/* APPEARANCE TAB */}
              <TabsContent value="appearance" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Brand Name</Label>
                  <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="Displayed in header" />
                </div>
                <div className="space-y-2">
                  <Label>Brand Logo URL</Label>
                  <Input value={brandLogo} onChange={(e) => setBrandLogo(e.target.value)} placeholder="https://example.com/logo.png" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Primary Color</Label>
                    <div className="flex gap-2">
                      <Input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="w-12 h-10 p-1 cursor-pointer" />
                      <Input value={brandColor} onChange={(e) => setBrandColor(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Accent Color</Label>
                    <div className="flex gap-2">
                      <Input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="w-12 h-10 p-1 cursor-pointer" />
                      <Input value={accentColor} onChange={(e) => setAccentColor(e.target.value)} />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Position</Label>
                  <div className="flex gap-2">
                    <Button type="button" variant={position === 'bottom-right' ? 'default' : 'outline'} onClick={() => setPosition('bottom-right')} className="flex-1">Bottom Right</Button>
                    <Button type="button" variant={position === 'bottom-left' ? 'default' : 'outline'} onClick={() => setPosition('bottom-left')} className="flex-1">Bottom Left</Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Dark Mode</Label>
                    <p className="text-xs text-muted-foreground">Dark theme for the widget</p>
                  </div>
                  <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                </div>
                <div className="space-y-2">
                  <Label>Header Style</Label>
                  <div className="flex gap-2">
                    {(['gradient', 'solid', 'minimal'] as const).map(s => (
                      <Button key={s} type="button" variant={headerStyle === s ? 'default' : 'outline'} onClick={() => setHeaderStyle(s)} className="flex-1 capitalize">{s}</Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Corner Radius</Label>
                  <div className="flex gap-2">
                    {(['sharp', 'rounded', 'pill'] as const).map(s => (
                      <Button key={s} type="button" variant={borderRadius === s ? 'default' : 'outline'} onClick={() => setBorderRadius(s)} className="flex-1 capitalize">{s}</Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Bubble Style</Label>
                  <div className="flex gap-2">
                    {(['rounded', 'sharp', 'pill'] as const).map(s => (
                      <Button key={s} type="button" variant={bubbleStyle === s ? 'default' : 'outline'} onClick={() => setBubbleStyle(s)} className="flex-1 capitalize">{s}</Button>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* BEHAVIOR TAB */}
              <TabsContent value="behavior" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Greeting Message</Label>
                  <Input value={greeting} onChange={(e) => setGreeting(e.target.value)} placeholder="Hi! How can I help you today?" />
                </div>
                <div className="space-y-2">
                  <Label>Input Placeholder</Label>
                  <Input value={placeholder} onChange={(e) => setPlaceholder(e.target.value)} placeholder="Type your message..." />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      AI Personality & Instructions
                    </Label>
                    <div className="flex items-center gap-2">
                      <Select value="" onValueChange={(value) => {
                        const bp = SYSTEM_PROMPT_PRESETS.find(p => p.id === value);
                        if (bp) { setSystemPrompt(bp.prompt); toast.success(`Applied "${bp.name}"`); return; }
                        const cp = customPresets.find(p => p.id === value);
                        if (cp) { setSystemPrompt(cp.system_prompt); if (cp.first_message) setGreeting(cp.first_message); toast.success(`Applied "${cp.name}"`); }
                      }}>
                        <SelectTrigger className="w-[160px] h-8">
                          <div className="flex items-center gap-2"><Wand2 className="h-3.5 w-3.5" /><span className="text-sm">Preset</span></div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Built-in</SelectLabel>
                            {SYSTEM_PROMPT_PRESETS.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                          </SelectGroup>
                          {customPresets.length > 0 && (<><SelectSeparator /><SelectGroup><SelectLabel className="flex items-center gap-1"><Save className="h-3 w-3" />Saved</SelectLabel>{customPresets.map(p => <SelectItem key={p.id} value={p.id}><div className="flex items-center gap-2"><span>{p.name}</span>{p.is_shared && <Users className="h-3 w-3 text-muted-foreground" />}</div></SelectItem>)}</SelectGroup></>)}
                        </SelectContent>
                      </Select>
                      <Button type="button" variant="outline" size="sm" onClick={() => setShowSavePresetDialog(true)} disabled={!systemPrompt.trim()} className="h-8">
                        <Save className="h-3.5 w-3.5 mr-1.5" />Save
                      </Button>
                    </div>
                  </div>
                  <div className="relative">
                    <Textarea value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} placeholder="Define your widget's personality, tone, and instructions..." rows={6} className="font-mono text-sm pb-8" />
                    <div className="absolute bottom-2 right-2 text-xs">
                      {(() => {
                        const c = systemPrompt.length; const t = Math.ceil(c / 4);
                        const s = c > 2000 ? 'text-destructive' : c > 1500 ? 'text-amber-500' : 'text-muted-foreground';
                        return <span className={s}>{c.toLocaleString()} chars · ~{t.toLocaleString()} tokens</span>;
                      })()}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* VOICE & AUDIO TAB */}
              <TabsContent value="voice" className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Voice Input (Dictation)</Label>
                    <p className="text-xs text-muted-foreground">Allow users to speak instead of typing</p>
                  </div>
                  <Switch checked={enableVoice} onCheckedChange={setEnableVoice} />
                </div>
                {enableVoice && (
                  <div className="space-y-4 pl-4 border-l-2 border-muted">
                    <div className="space-y-2">
                      <Label>Voice Provider</Label>
                      <Select value={voiceProvider} onValueChange={(v) => setVoiceProvider(v as any)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="native">Browser Native (Free)</SelectItem>
                          <SelectItem value="elevenlabs">ElevenLabs (Better Accuracy)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Waveform Style</Label>
                      <Select value={waveformStyle} onValueChange={(v) => setWaveformStyle(v as any)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bars">Bars (Classic)</SelectItem>
                          <SelectItem value="wave">Wave (Flowing)</SelectItem>
                          <SelectItem value="circular">Circular (Compact)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Voice Conversation Mode</Label>
                      <p className="text-xs text-muted-foreground">Full voice interaction with animated orb UI</p>
                    </div>
                    <Switch checked={enableVoiceConversation} onCheckedChange={setEnableVoiceConversation} />
                  </div>
                </div>
                {enableVoiceConversation && (
                  <div className="pl-4 border-l-2 border-muted">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Auto-Listen</Label>
                        <p className="text-xs text-muted-foreground">Resume listening after AI finishes speaking</p>
                      </div>
                      <Switch checked={autoListen} onCheckedChange={setAutoListen} />
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Text-to-Speech</Label>
                      <p className="text-xs text-muted-foreground">Speak AI responses aloud</p>
                    </div>
                    <Switch checked={enableTTS} onCheckedChange={setEnableTTS} />
                  </div>
                </div>
                {enableTTS && (
                  <div className="space-y-3 pl-4 border-l-2 border-muted">
                    <div className="space-y-2">
                      <Label>Voice</Label>
                      <Select value={ttsVoiceId} onValueChange={setTtsVoiceId}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EXAVITQu4vr4xnSDxMaL">Sarah (Warm, Conversational)</SelectItem>
                          <SelectItem value="JBFqnCBsd6RMkjVDRZzb">George (British, Authoritative)</SelectItem>
                          <SelectItem value="onwK4e9ZLuTAKqWW03F9">Daniel (Deep, Friendly)</SelectItem>
                          <SelectItem value="pFZP5JQG7iQjIQuC4Bku">Lily (Young, Cheerful)</SelectItem>
                          <SelectItem value="TX3LPaxmHKxFdv7VOQHJ">Liam (American, Professional)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Preview Voice</Label>
                      <p className="text-xs text-muted-foreground">Listen to a sample using your greeting message</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={playTtsPreview}
                        disabled={ttsPreviewLoading}
                        className="w-full"
                      >
                        {ttsPreviewLoading ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating…</>
                        ) : ttsPreviewPlaying ? (
                          <><Square className="h-4 w-4 mr-2" />Stop Preview</>
                        ) : (
                          <><Play className="h-4 w-4 mr-2" />Play Voice Sample</>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* LIMITS TAB */}
              <TabsContent value="limits" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Messages per Minute</Label>
                  <Input type="number" min={1} max={100} value={rateLimitPerMinute} onChange={(e) => setRateLimitPerMinute(Math.max(1, parseInt(e.target.value) || 10))} />
                  <p className="text-xs text-muted-foreground">Maximum messages per minute (1-100)</p>
                </div>
                <div className="space-y-2">
                  <Label>Messages per Hour</Label>
                  <Input type="number" min={1} max={1000} value={rateLimitPerHour} onChange={(e) => setRateLimitPerHour(Math.max(1, parseInt(e.target.value) || 100))} />
                  <p className="text-xs text-muted-foreground">Maximum messages per hour (1-1000)</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Current Limits</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-muted-foreground">Per Minute:</span> <span className="font-medium">{rateLimitPerMinute}</span></div>
                    <div><span className="text-muted-foreground">Per Hour:</span> <span className="font-medium">{rateLimitPerHour}</span></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Rate limits help prevent abuse and control costs.</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>

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
              waveformStyle={waveformStyle}
              enableTTS={enableTTS}
              darkMode={darkMode}
              headerStyle={headerStyle}
              borderRadius={borderRadius}
              bubbleStyle={bubbleStyle}
              enableVoiceConversation={enableVoiceConversation}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => saveWidget.mutate()} disabled={!name.trim() || saveWidget.isPending}>
            {saveWidget.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {widget ? 'Save Changes' : 'Create Widget'}
          </Button>
        </div>

        <SavePresetDialog
          open={showSavePresetDialog}
          onClose={() => setShowSavePresetDialog(false)}
          onSave={async ({ name, description, isShared }) => {
            await createPreset.mutateAsync({ name, description, system_prompt: systemPrompt, first_message: greeting, is_shared: isShared });
          }}
          systemPrompt={systemPrompt}
          firstMessage={greeting}
          isLoading={createPreset.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}
