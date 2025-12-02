import { useEffect, useState } from 'react';
import { Users, MessageSquare, FileText, TrendingUp } from 'lucide-react';
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
  });

  useEffect(() => {
    const fetchStats = async () => {
      const [usersRes, conversationsRes, documentsRes, profilesRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('conversations').select('id', { count: 'exact', head: true }),
        supabase.from('documents').select('id', { count: 'exact', head: true }),
        supabase
          .from('profiles')
          .select('id')
          .gte('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      ]);

      setStats({
        totalUsers: usersRes.count || 0,
        totalConversations: conversationsRes.count || 0,
        totalDocuments: documentsRes.count || 0,
        activeToday: profilesRes.data?.length || 0,
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
          </div>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
