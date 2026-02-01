import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  UserPlus, 
  MessageSquare, 
  FileText, 
  Shield, 
  Trash2, 
  RefreshCw 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  id: string;
  type: 'user_registered' | 'conversation_created' | 'document_uploaded' | 'role_changed' | 'item_deleted';
  description: string;
  timestamp: string;
  metadata?: {
    email?: string;
    title?: string;
    filename?: string;
    role?: string;
  };
}

export const ActivityFeed = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    setLoading(true);
    
    try {
      // Fetch recent profiles (new users)
      const { data: recentUsers } = await supabase
        .from('profiles')
        .select('id, email, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch recent conversations
      const { data: recentConversations } = await supabase
        .from('conversations')
        .select('id, title, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch recent audit logs
      const { data: recentAuditLogs } = await supabase
        .from('admin_audit_log')
        .select('id, action, created_at, metadata, target_user_id')
        .order('created_at', { ascending: false })
        .limit(10);

      const activityItems: ActivityItem[] = [];

      // Add user registrations
      recentUsers?.forEach(user => {
        activityItems.push({
          id: `user-${user.id}`,
          type: 'user_registered',
          description: `New user registered: ${user.email}`,
          timestamp: user.created_at,
          metadata: { email: user.email },
        });
      });

      // Add conversations
      recentConversations?.forEach(conv => {
        activityItems.push({
          id: `conv-${conv.id}`,
          type: 'conversation_created',
          description: `New conversation: ${conv.title}`,
          timestamp: conv.created_at,
          metadata: { title: conv.title },
        });
      });

      // Add audit log entries
      recentAuditLogs?.forEach(log => {
        const metadata = log.metadata as Record<string, unknown> | null;
        let description = log.action.replace(/_/g, ' ');
        let type: ActivityItem['type'] = 'item_deleted';

        if (log.action.includes('role')) {
          type = 'role_changed';
          description = `Role updated to ${metadata?.new_role || 'unknown'}`;
        } else if (log.action.includes('delete')) {
          type = 'item_deleted';
          description = `${log.action.replace(/_/g, ' ')}`;
        }

        activityItems.push({
          id: `audit-${log.id}`,
          type,
          description,
          timestamp: log.created_at,
          metadata: metadata as ActivityItem['metadata'],
        });
      });

      // Sort by timestamp
      activityItems.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setActivities(activityItems.slice(0, 15));
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, []);

  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'user_registered':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'conversation_created':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'document_uploaded':
        return <FileText className="h-4 w-4 text-purple-500" />;
      case 'role_changed':
        return <Shield className="h-4 w-4 text-yellow-500" />;
      case 'item_deleted':
        return <Trash2 className="h-4 w-4 text-red-500" />;
      default:
        return <MessageSquare className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getBadgeVariant = (type: ActivityItem['type']) => {
    switch (type) {
      case 'user_registered':
        return 'default';
      case 'conversation_created':
        return 'secondary';
      case 'role_changed':
        return 'outline';
      case 'item_deleted':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base">Recent Activity</CardTitle>
          <CardDescription>Latest platform events</CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchActivities} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[350px]">
          {loading && activities.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Loading activities...
            </div>
          ) : activities.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No recent activity
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="mt-0.5">{getIcon(activity.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                  <Badge variant={getBadgeVariant(activity.type)} className="text-xs shrink-0">
                    {activity.type.replace(/_/g, ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};