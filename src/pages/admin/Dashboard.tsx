import { useEffect, useState } from 'react';
import { Users, MessageSquare, FileText, TrendingUp, BookOpen, Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatsCard } from '@/components/admin/StatsCard';
import SEO from '@/components/SEO';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalConversations: 0,
    totalDocuments: 0,
    activeToday: 0,
    kbDocuments: 0,
    kbChunks: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const [usersRes, conversationsRes, documentsRes, profilesRes, kbDocsRes, kbChunksRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('conversations').select('id', { count: 'exact', head: true }),
        supabase.from('documents').select('id', { count: 'exact', head: true }),
        supabase
          .from('profiles')
          .select('id')
          .gte('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('knowledge_base_documents').select('id', { count: 'exact', head: true }),
        supabase.from('knowledge_base_chunks').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        totalUsers: usersRes.count || 0,
        totalConversations: conversationsRes.count || 0,
        totalDocuments: documentsRes.count || 0,
        activeToday: profilesRes.data?.length || 0,
        kbDocuments: kbDocsRes.count || 0,
        kbChunks: kbChunksRes.count || 0,
      });
    };

    fetchStats();
  }, []);

  return (
    <AdminGuard>
      <AdminLayout>
        <SEO 
          title="Admin Dashboard"
          description="Super admin dashboard for managing users, conversations, and documents"
        />
        
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Manage your application and monitor key metrics
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <StatsCard
              title="Total Users"
              value={stats.totalUsers}
              icon={Users}
              description="Registered users"
            />
            <StatsCard
              title="Conversations"
              value={stats.totalConversations}
              icon={MessageSquare}
              description="Total conversations"
            />
            <StatsCard
              title="Documents"
              value={stats.totalDocuments}
              icon={FileText}
              description="Uploaded documents"
            />
            <StatsCard
              title="Active Today"
              value={stats.activeToday}
              icon={TrendingUp}
              description="Last 24 hours"
            />
            <StatsCard
              title="KB Documents"
              value={stats.kbDocuments}
              icon={BookOpen}
              description="Knowledge base docs"
            />
            <StatsCard
              title="KB Chunks"
              value={stats.kbChunks}
              icon={Database}
              description="Total text chunks"
            />
          </div>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
