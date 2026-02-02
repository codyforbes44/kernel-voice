import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Copy, Trash2, Settings, BarChart3, Check, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { WidgetEditor } from '@/components/admin/widgets/WidgetEditor';
import { WidgetCodeSnippet } from '@/components/admin/widgets/WidgetCodeSnippet';
import { WidgetAnalytics } from '@/components/admin/widgets/WidgetAnalytics';

interface WidgetConfig {
  id: string;
  user_id: string;
  api_key: string;
  name: string;
  config: Record<string, unknown>;
  allowed_domains: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminWidgets() {
  const queryClient = useQueryClient();
  const [selectedWidget, setSelectedWidget] = useState<WidgetConfig | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showCodeSnippet, setShowCodeSnippet] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: widgets, isLoading } = useQuery({
    queryKey: ['admin-widgets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('widget_configs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as WidgetConfig[];
    },
  });

  const deleteWidget = useMutation({
    mutationFn: async (widgetId: string) => {
      const { error } = await supabase
        .from('widget_configs')
        .delete()
        .eq('id', widgetId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-widgets'] });
      toast.success('Widget deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete widget: ' + error.message);
    },
  });

  const copyApiKey = async (apiKey: string, widgetId: string) => {
    await navigator.clipboard.writeText(apiKey);
    setCopiedId(widgetId);
    toast.success('API key copied');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateNew = () => {
    setSelectedWidget(null);
    setShowEditor(true);
  };

  const handleEdit = (widget: WidgetConfig) => {
    setSelectedWidget(widget);
    setShowEditor(true);
  };

  const handleShowCode = (widget: WidgetConfig) => {
    setSelectedWidget(widget);
    setShowCodeSnippet(true);
  };

  const handleShowAnalytics = (widget: WidgetConfig) => {
    setSelectedWidget(widget);
    setShowAnalytics(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Embeddable Widgets</h1>
            <p className="text-muted-foreground">
              Create and manage AI chat widgets for external websites
            </p>
          </div>
          <Button onClick={handleCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Create Widget
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="space-y-2">
                  <div className="h-5 bg-muted rounded w-1/2" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : widgets?.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-muted-foreground mb-4">
                No widgets created yet. Create your first widget to embed AI chat on external websites.
              </p>
              <Button onClick={handleCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Widget
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {widgets?.map((widget) => (
              <Card key={widget.id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{widget.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {widget.allowed_domains.length > 0 
                          ? widget.allowed_domains.join(', ')
                          : 'All domains allowed'}
                      </CardDescription>
                    </div>
                    <Badge variant={widget.is_active ? 'default' : 'secondary'}>
                      {widget.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Input 
                      value={widget.api_key} 
                      readOnly 
                      className="font-mono text-xs"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => copyApiKey(widget.api_key, widget.id)}
                    >
                      {copiedId === widget.id ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(widget)}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Configure
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleShowCode(widget)}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Embed Code
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleShowAnalytics(widget)}
                    >
                      <BarChart3 className="h-4 w-4 mr-1" />
                      Analytics
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteWidget.mutate(widget.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {showEditor && (
        <WidgetEditor
          widget={selectedWidget}
          open={showEditor}
          onClose={() => setShowEditor(false)}
          onSave={() => {
            setShowEditor(false);
            queryClient.invalidateQueries({ queryKey: ['admin-widgets'] });
          }}
        />
      )}

      {showCodeSnippet && selectedWidget && (
        <WidgetCodeSnippet
          widget={selectedWidget}
          open={showCodeSnippet}
          onClose={() => setShowCodeSnippet(false)}
        />
      )}

      {showAnalytics && selectedWidget && (
        <WidgetAnalytics
          widget={selectedWidget}
          open={showAnalytics}
          onClose={() => setShowAnalytics(false)}
        />
      )}
    </AdminLayout>
  );
}
