import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings as SettingsIcon, Save, RotateCcw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Setting {
  key: string;
  value: any;
  description: string | null;
}

export const KBSettings = () => {
  const [settings, setSettings] = useState<Record<string, any>>({
    chunk_size: 1000,
    chunk_overlap: 100,
    max_file_size: 10485760,
    allowed_formats: ['txt', 'md', 'pdf', 'doc', 'docx', 'csv', 'json'],
    auto_process: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('knowledge_base_settings')
        .select('*');

      if (error) throw error;

      const settingsMap: Record<string, any> = {};
      data?.forEach((setting: Setting) => {
        settingsMap[setting.key] = setting.value;
      });

      setSettings(settingsMap);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({ title: 'Error', description: 'Failed to load settings', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('knowledge_base_settings')
          .update({ value: update.value })
          .eq('key', update.key);

        if (error) throw error;
      }

      toast({ title: 'Success', description: 'Settings saved' });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
    }
  };

  const resetSettings = () => {
    setSettings({
      chunk_size: 1000,
      chunk_overlap: 100,
      max_file_size: 10485760,
      allowed_formats: ['txt', 'md', 'pdf', 'doc', 'docx', 'csv', 'json'],
      auto_process: true,
    });
  };

  const formatBytes = (bytes: number) => {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/40 bg-card/50 backdrop-blur">
        <CardHeader>
          <div className="flex items-center gap-3">
            <SettingsIcon className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Processing Settings</CardTitle>
              <CardDescription>Configure document processing parameters</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="chunk_size">Chunk Size (characters)</Label>
              <Input
                id="chunk_size"
                type="number"
                value={settings.chunk_size}
                onChange={(e) => setSettings({ ...settings, chunk_size: parseInt(e.target.value) })}
              />
              <p className="text-sm text-muted-foreground">
                Number of characters per text chunk
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="chunk_overlap">Chunk Overlap (characters)</Label>
              <Input
                id="chunk_overlap"
                type="number"
                value={settings.chunk_overlap}
                onChange={(e) => setSettings({ ...settings, chunk_overlap: parseInt(e.target.value) })}
              />
              <p className="text-sm text-muted-foreground">
                Overlap between consecutive chunks
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_file_size">Max File Size</Label>
              <Input
                id="max_file_size"
                type="number"
                value={settings.max_file_size}
                onChange={(e) => setSettings({ ...settings, max_file_size: parseInt(e.target.value) })}
              />
              <p className="text-sm text-muted-foreground">
                Current: {formatBytes(settings.max_file_size)}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="allowed_formats">Allowed Formats</Label>
              <Input
                id="allowed_formats"
                value={Array.isArray(settings.allowed_formats) ? settings.allowed_formats.join(', ') : ''}
                onChange={(e) => setSettings({
                  ...settings,
                  allowed_formats: e.target.value.split(',').map(f => f.trim())
                })}
              />
              <p className="text-sm text-muted-foreground">
                Comma-separated file extensions
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="space-y-1">
              <Label htmlFor="auto_process">Auto-process uploads</Label>
              <p className="text-sm text-muted-foreground">
                Automatically chunk and process uploaded documents
              </p>
            </div>
            <Switch
              id="auto_process"
              checked={settings.auto_process}
              onCheckedChange={(checked) => setSettings({ ...settings, auto_process: checked })}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={resetSettings} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Reset to Defaults
            </Button>
            <Button onClick={saveSettings} className="gap-2">
              <Save className="h-4 w-4" />
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
