import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StatsCard } from '@/components/admin/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Database, FolderOpen, HardDrive, Upload, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface Stats {
  totalDocuments: number;
  totalChunks: number;
  totalCategories: number;
  storageUsed: number;
}

interface RecentDocument {
  id: string;
  filename: string;
  status: string;
  created_at: string;
  uploaded_by: string;
}

export const KBOverview = () => {
  const [stats, setStats] = useState<Stats>({
    totalDocuments: 0,
    totalChunks: 0,
    totalCategories: 0,
    storageUsed: 0,
  });
  const [recentDocs, setRecentDocs] = useState<RecentDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchRecentDocuments();
  }, []);

  const fetchStats = async () => {
    try {
      const [docsResult, chunksResult, categoriesResult] = await Promise.all([
        supabase.from('knowledge_base_documents').select('file_size', { count: 'exact' }),
        supabase.from('knowledge_base_chunks').select('*', { count: 'exact', head: true }),
        supabase.from('knowledge_base_categories').select('*', { count: 'exact', head: true }),
      ]);

      const storageUsed = docsResult.data?.reduce((sum, doc) => sum + (doc.file_size || 0), 0) || 0;

      setStats({
        totalDocuments: docsResult.count || 0,
        totalChunks: chunksResult.count || 0,
        totalCategories: categoriesResult.count || 0,
        storageUsed,
      });
    } catch (error) {
      console.error('Error fetching KB stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentDocuments = async () => {
    try {
      const { data } = await supabase
        .from('knowledge_base_documents')
        .select('id, filename, status, created_at, uploaded_by')
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentDocs(data || []);
    } catch (error) {
      console.error('Error fetching recent documents:', error);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'text-green-500';
      case 'processing': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Documents"
          value={stats.totalDocuments}
          icon={FileText}
          description="Knowledge base documents"
        />
        <StatsCard
          title="Total Chunks"
          value={stats.totalChunks}
          icon={Database}
          description="Processed text chunks"
        />
        <StatsCard
          title="Categories"
          value={stats.totalCategories}
          icon={FolderOpen}
          description="Document categories"
        />
        <StatsCard
          title="Storage Used"
          value={formatBytes(stats.storageUsed)}
          icon={HardDrive}
          description="Total file storage"
        />
      </div>

      <Card className="border-border/40 bg-card/50 backdrop-blur">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Recent Uploads
            </CardTitle>
            <Button size="sm" className="gap-2">
              <Upload className="h-4 w-4" />
              Upload New
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentDocs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No documents uploaded yet</p>
          ) : (
            <div className="space-y-3">
              {recentDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/40"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{doc.filename}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(doc.created_at), 'MMM d, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm font-medium capitalize ${getStatusColor(doc.status)}`}>
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
