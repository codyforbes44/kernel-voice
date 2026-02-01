import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import SEO from '@/components/SEO';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Mic, 
  Bot, 
  Settings as SettingsIcon, 
  Save, 
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

interface AdminSettings {
  voice_providers: {
    default: string;
    enabled: string[];
  };
  ai_models: {
    default: string;
    enabled: string[];
  };
  feature_flags: {
    guest_mode: boolean;
    voice_assistant: boolean;
    knowledge_base: boolean;
  };
  maintenance_mode: {
    enabled: boolean;
    message: string;
  };
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<AdminSettings>({
    voice_providers: { default: 'elevenlabs', enabled: ['elevenlabs', 'openai'] },
    ai_models: { default: 'gpt-4o-mini', enabled: ['gpt-4o', 'gpt-4o-mini'] },
    feature_flags: { guest_mode: true, voice_assistant: true, knowledge_base: true },
    maintenance_mode: { enabled: false, message: 'System is under maintenance' },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('admin_settings')
        .select('key, value');

      if (data) {
        const settingsMap: Partial<AdminSettings> = {};
        data.forEach(item => {
          (settingsMap as Record<string, unknown>)[item.key] = item.value;
        });
        setSettings(prev => ({ ...prev, ...settingsMap }));
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const saveSetting = async (key: string, value: unknown) => {
    setSaving(true);
    try {
      // First try to update, if it doesn't exist, insert
      const { data: existing } = await supabase
        .from('admin_settings')
        .select('id')
        .eq('key', key)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('admin_settings')
          .update({ value: JSON.parse(JSON.stringify(value)), updated_at: new Date().toISOString() })
          .eq('key', key);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('admin_settings')
          .insert([{ key, value: JSON.parse(JSON.stringify(value)) }]);
        if (error) throw error;
      }

      toast.success('Setting saved successfully');
    } catch (error) {
      console.error('Failed to save setting:', error);
      toast.error('Failed to save setting');
    } finally {
      setSaving(false);
    }
  };

  const handleFeatureFlagChange = async (flag: keyof AdminSettings['feature_flags'], enabled: boolean) => {
    const newFlags = { ...settings.feature_flags, [flag]: enabled };
    setSettings(prev => ({ ...prev, feature_flags: newFlags }));
    await saveSetting('feature_flags', newFlags);
  };

  const handleMaintenanceModeChange = async (enabled: boolean) => {
    const newMaintenance = { ...settings.maintenance_mode, enabled };
    setSettings(prev => ({ ...prev, maintenance_mode: newMaintenance }));
    await saveSetting('maintenance_mode', newMaintenance);
  };

  const handleMaintenanceMessageChange = async () => {
    await saveSetting('maintenance_mode', settings.maintenance_mode);
  };

  return (
    <AdminGuard>
      <AdminLayout>
        <SEO title="System Settings" description="Configure platform settings" />
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
              <p className="text-muted-foreground mt-2">
                Configure platform-wide settings and feature flags
              </p>
            </div>
            <Button variant="outline" onClick={fetchSettings} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Voice Provider Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-5 w-5" />
                  Voice Providers
                </CardTitle>
                <CardDescription>
                  Configure available voice providers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Default Provider</Label>
                  <div className="flex gap-2">
                    <Badge variant={settings.voice_providers.default === 'elevenlabs' ? 'default' : 'outline'}>
                      ElevenLabs
                    </Badge>
                    <Badge variant={settings.voice_providers.default === 'openai' ? 'default' : 'outline'}>
                      OpenAI
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Enabled Providers</Label>
                  <div className="flex flex-wrap gap-2">
                    {settings.voice_providers.enabled.map(provider => (
                      <Badge key={provider} variant="secondary">
                        {provider}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Model Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  AI Models
                </CardTitle>
                <CardDescription>
                  Configure available AI models
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Default Model</Label>
                  <Badge variant="default">{settings.ai_models.default}</Badge>
                </div>
                <div className="space-y-2">
                  <Label>Enabled Models</Label>
                  <div className="flex flex-wrap gap-2">
                    {settings.ai_models.enabled.map(model => (
                      <Badge key={model} variant="secondary">
                        {model}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feature Flags */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5" />
                  Feature Flags
                </CardTitle>
                <CardDescription>
                  Toggle platform features on or off
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Guest Mode</Label>
                    <p className="text-xs text-muted-foreground">
                      Allow unauthenticated users to try the assistant
                    </p>
                  </div>
                  <Switch
                    checked={settings.feature_flags.guest_mode}
                    onCheckedChange={(checked) => handleFeatureFlagChange('guest_mode', checked)}
                    disabled={saving}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Voice Assistant</Label>
                    <p className="text-xs text-muted-foreground">
                      Enable the voice assistant feature
                    </p>
                  </div>
                  <Switch
                    checked={settings.feature_flags.voice_assistant}
                    onCheckedChange={(checked) => handleFeatureFlagChange('voice_assistant', checked)}
                    disabled={saving}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Knowledge Base</Label>
                    <p className="text-xs text-muted-foreground">
                      Enable knowledge base integration
                    </p>
                  </div>
                  <Switch
                    checked={settings.feature_flags.knowledge_base}
                    onCheckedChange={(checked) => handleFeatureFlagChange('knowledge_base', checked)}
                    disabled={saving}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Maintenance Mode */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Maintenance Mode
                </CardTitle>
                <CardDescription>
                  Temporarily disable the platform for maintenance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Maintenance Mode</Label>
                    <p className="text-xs text-muted-foreground">
                      Show maintenance message to all users
                    </p>
                  </div>
                  <Switch
                    checked={settings.maintenance_mode.enabled}
                    onCheckedChange={handleMaintenanceModeChange}
                    disabled={saving}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Maintenance Message</Label>
                  <div className="flex gap-2">
                    <Input
                      value={settings.maintenance_mode.message}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        maintenance_mode: { ...prev.maintenance_mode, message: e.target.value }
                      }))}
                      placeholder="Enter maintenance message..."
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={handleMaintenanceMessageChange}
                      disabled={saving}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}