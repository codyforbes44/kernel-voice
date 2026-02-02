import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MessageSquare, Users, MousePointer, AlertCircle } from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';

interface WidgetConfig {
  id: string;
  name: string;
}

interface WidgetAnalyticsProps {
  widget: WidgetConfig;
  open: boolean;
  onClose: () => void;
}

interface AnalyticsEvent {
  id: string;
  widget_id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  referrer_domain: string | null;
  session_id: string | null;
  created_at: string;
}

const COLORS = ['#00CED1', '#00B4D8', '#0077B6', '#023E8A'];

export function WidgetAnalytics({ widget, open, onClose }: WidgetAnalyticsProps) {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['widget-analytics', widget.id],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      
      const { data, error } = await supabase
        .from('widget_analytics')
        .select('*')
        .eq('widget_id', widget.id)
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as AnalyticsEvent[];
    },
    enabled: open,
  });

  // Calculate stats
  const stats = analytics ? {
    totalSessions: new Set(analytics.filter(e => e.session_id).map(e => e.session_id)).size,
    totalMessages: analytics.filter(e => e.event_type === 'message').length,
    totalOpens: analytics.filter(e => e.event_type === 'open').length,
    totalErrors: analytics.filter(e => e.event_type === 'error').length,
  } : { totalSessions: 0, totalMessages: 0, totalOpens: 0, totalErrors: 0 };

  // Daily activity for the last 7 days
  const dailyActivity = analytics ? (() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return format(startOfDay(date), 'yyyy-MM-dd');
    });

    return days.map(day => {
      const dayEvents = analytics.filter(e => 
        format(new Date(e.created_at), 'yyyy-MM-dd') === day
      );
      return {
        date: format(new Date(day), 'MMM d'),
        messages: dayEvents.filter(e => e.event_type === 'message').length,
        sessions: new Set(dayEvents.filter(e => e.session_id).map(e => e.session_id)).size,
      };
    });
  })() : [];

  // Domain distribution
  const domainDistribution = analytics ? (() => {
    const domains: Record<string, number> = {};
    analytics.forEach(e => {
      const domain = e.referrer_domain || 'Unknown';
      domains[domain] = (domains[domain] || 0) + 1;
    });
    return Object.entries(domains)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  })() : [];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Analytics for "{widget.name}"</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="space-y-6 mt-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Sessions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalSessions}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Messages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalMessages}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <MousePointer className="h-4 w-4" />
                    Widget Opens
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalOpens}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Errors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalErrors}</div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Daily Activity Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Daily Activity (Last 7 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailyActivity}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis dataKey="date" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="messages" fill="#00CED1" name="Messages" />
                        <Bar dataKey="sessions" fill="#00B4D8" name="Sessions" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Domain Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Top Domains</CardTitle>
                </CardHeader>
                <CardContent>
                  {domainDistribution.length === 0 ? (
                    <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                      No domain data yet
                    </div>
                  ) : (
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={domainDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="value"
                            label={({ name }) => name}
                            labelLine={false}
                          >
                            {domainDistribution.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Events */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Recent Events</CardTitle>
              </CardHeader>
              <CardContent>
                {!analytics || analytics.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No events recorded yet
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {analytics.slice(0, 20).map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between py-2 border-b last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`
                            px-2 py-0.5 rounded text-xs font-medium
                            ${event.event_type === 'message' ? 'bg-primary/10 text-primary' : ''}
                            ${event.event_type === 'open' ? 'bg-green-500/10 text-green-600' : ''}
                            ${event.event_type === 'close' ? 'bg-muted text-muted-foreground' : ''}
                            ${event.event_type === 'error' ? 'bg-red-500/10 text-red-600' : ''}
                          `}>
                            {event.event_type}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {event.referrer_domain || 'Unknown domain'}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(event.created_at), 'MMM d, h:mm a')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
