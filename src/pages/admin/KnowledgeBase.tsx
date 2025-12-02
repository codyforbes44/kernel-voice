import { useState } from 'react';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import SEO from '@/components/SEO';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KBOverview } from '@/components/admin/knowledge-base/KBOverview';
import { KBDocuments } from '@/components/admin/knowledge-base/KBDocuments';
import { KBCategories } from '@/components/admin/knowledge-base/KBCategories';
import { KBChunkInspector } from '@/components/admin/knowledge-base/KBChunkInspector';
import { KBSettings } from '@/components/admin/knowledge-base/KBSettings';
import { BookOpen } from 'lucide-react';

const AdminKnowledgeBase = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <AdminGuard>
      <SEO
        title="Knowledge Base Management"
        description="Manage knowledge base documents, categories, and settings"
      />
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Knowledge Base</h1>
              <p className="text-muted-foreground">
                Manage documents, categories, chunks, and processing settings
              </p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-card border border-border">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="chunks">Chunk Inspector</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <KBOverview />
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              <KBDocuments />
            </TabsContent>

            <TabsContent value="categories" className="space-y-4">
              <KBCategories />
            </TabsContent>

            <TabsContent value="chunks" className="space-y-4">
              <KBChunkInspector />
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <KBSettings />
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
};

export default AdminKnowledgeBase;
