import { useEffect, useState, useMemo } from 'react';
import { Users, MessageSquare, FileText, TrendingUp, BookOpen, Database, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatsCard } from '@/components/admin/StatsCard';
import { DashboardCharts } from '@/components/admin/DashboardCharts';
import { ActivityFeed } from '@/components/admin/ActivityFeed';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import SEO from '@/components/SEO';
import { format, subDays } from 'date-fns';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalConversations: 0,
    totalDocuments: 0,
    activeToday: 0,
    kbDocuments: 0,
    kbChunks: 0,
  });
  const [recentUsers, setRecentUsers] = useState<Array<{
    id: string;
    email: string;
    display_name: string | null;
    created_at: string;
  }>>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    const [usersRes, conversationsRes, documentsRes, profilesRes, kbDocsRes, kbChunksRes, recentUsersRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('conversations').select('id', { count: 'exact', head: true }),
      supabase.from('documents').select('id', { count: 'exact', head: true }),
      supabase
        .from('profiles')
        .select('id')
        .gte('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      supabase.from('knowledge_base_documents').select('id', { count: 'exact', head: true }),
      supabase.from('knowledge_base_chunks').select('id', { count: 'exact', head: true }),
      supabase
        .from('profiles')
        .select('id, email, display_name, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    setStats({
      totalUsers: usersRes.count || 0,
      totalConversations: conversationsRes.count || 0,
      totalDocuments: documentsRes.count || 0,
      activeToday: profilesRes.data?.length || 0,
      kbDocuments: kbDocsRes.count || 0,
      kbChunks: kbChunksRes.count || 0,
    });

    setRecentUsers(recentUsersRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Generate sample chart data based on stats
  const chartData = useMemo(() => {
    const today = new Date();
    const userGrowth = Array.from({ length: 7 }, (_, i) => ({
      date: format(subDays(today, 6 - i), 'MMM d'),
      users: Math.floor(stats.totalUsers / 7 * (i + 1) + Math.random() * 3),
    }));

    const conversationVolume = Array.from({ length: 7 }, (_, i) => ({
      date: format(subDays(today, 6 - i), 'MMM d'),
      conversations: Math.floor(stats.totalConversations / 7 * (i + 1) + Math.random() * 5),
    }));

    const voiceProviderUsage = [
      { name: 'ElevenLabs', value: 65 },
      { name: 'OpenAI', value: 35 },
    ];

    const weeklyActivity = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
      day,
      active: Math.floor(Math.random() * 20) + 5,
      new: Math.floor(Math.random() * 5) + 1,
    }));

    return { userGrowth, conversationVolume, voiceProviderUsage, weeklyActivity };
  }, [stats]);

  return (
    <AdminGuard>
      <AdminLayout>
        <SEO 
          title="Admin Dashboard"
          description="Super admin dashboard for managing users, conversations, and documents"
        />
        
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
              <p className="text-muted-foreground mt-2">
                Manage your application and monitor key metrics
              </p>
            </div>
            <Button variant="outline" onClick={fetchStats} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
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

          {/* Charts */}
          <DashboardCharts data={chartData} />

          {/* Bottom Section: Activity Feed + Recent Users */}
          <div className="grid gap-6 md:grid-cols-2">
            <ActivityFeed />

            {/* Recent Users */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Registrations</CardTitle>
                <CardDescription>Newest platform users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentUsers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No users yet
                    </p>
                  ) : (
                    recentUsers.map((user) => (
                      <div key={user.id} className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {user.email.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {user.display_name || user.email.split('@')[0]}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {format(new Date(user.created_at), 'MMM d')}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}