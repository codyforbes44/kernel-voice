import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  User, 
  Mail, 
  Calendar, 
  MessageSquare, 
  FileText, 
  Shield, 
  Mic,
  Sparkles,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useUserFeaturesAdmin } from '@/hooks/useUserFeatures';

interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  voice_provider: string | null;
  openai_voice: string | null;
  input_mode: string | null;
}

interface UserStats {
  conversationCount: number;
  documentCount: number;
  messageCount: number;
}

interface UserDetailDrawerProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoleChange?: (userId: string, newRole: 'admin' | 'moderator' | 'user') => Promise<void>;
  currentRole?: 'admin' | 'moderator' | 'user';
}

export const UserDetailDrawer = ({ 
  userId, 
  open, 
  onOpenChange, 
  onRoleChange,
  currentRole = 'user'
}: UserDetailDrawerProps) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState(currentRole);
  const [togglingFeature, setTogglingFeature] = useState<string | null>(null);
  
  const { features, loading: featuresLoading, refetch: refetchFeatures } = useUserFeaturesAdmin(userId);

  useEffect(() => {
    if (userId && open) {
      fetchUserDetails();
    }
  }, [userId, open]);

  useEffect(() => {
    setRole(currentRole);
  }, [currentRole]);

  const fetchUserDetails = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Fetch stats in parallel
      const [convRes, docRes] = await Promise.all([
        supabase
          .from('conversations')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId),
        supabase
          .from('documents')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId),
      ]);

      // Get message count by first getting conversation IDs
      const { data: convIds } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', userId);

      let messageCount = 0;
      if (convIds && convIds.length > 0) {
        const { count } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .in('conversation_id', convIds.map(c => c.id));
        messageCount = count || 0;
      }

      setStats({
        conversationCount: convRes.count || 0,
        documentCount: docRes.count || 0,
        messageCount,
      });
    } catch (error) {
      console.error('Failed to fetch user details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (newRole: 'admin' | 'moderator' | 'user') => {
    if (userId && onRoleChange) {
      setRole(newRole);
      await onRoleChange(userId, newRole);
    }
  };

  const hasFeature = (featureKey: string) => {
    return features.some((f: { feature_key: string; enabled: boolean; revoked_at: string | null }) => 
      f.feature_key === featureKey && f.enabled && !f.revoked_at
    );
  };

  const handleFeatureToggle = async (featureKey: string, enabled: boolean) => {
    if (!userId) return;
    
    setTogglingFeature(featureKey);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Not authenticated');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-operations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: enabled ? 'grantFeature' : 'revokeFeature',
          targetUserId: userId,
          featureKey,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update feature');
      }

      toast.success(enabled ? 'Feature granted' : 'Feature revoked');
      refetchFeatures();
    } catch (error) {
      console.error('Feature toggle error:', error);
      toast.error('Failed to update feature');
    } finally {
      setTogglingFeature(null);
    }
  };

  if (!userId) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>User Details</SheetTitle>
          <SheetDescription>
            View and manage user profile information
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="space-y-4 mt-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : profile ? (
          <div className="space-y-6 mt-6">
            {/* Profile Header */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                {profile.avatar_url && <AvatarImage src={profile.avatar_url} />}
                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                  {profile.email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">
                  {profile.display_name || profile.email.split('@')[0]}
                </h3>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
                <Badge variant="outline" className="mt-1">
                  {role}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <MessageSquare className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                <p className="text-2xl font-semibold">{stats?.conversationCount || 0}</p>
                <p className="text-xs text-muted-foreground">Conversations</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <FileText className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                <p className="text-2xl font-semibold">{stats?.documentCount || 0}</p>
                <p className="text-xs text-muted-foreground">Documents</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <MessageSquare className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                <p className="text-2xl font-semibold">{stats?.messageCount || 0}</p>
                <p className="text-xs text-muted-foreground">Messages</p>
              </div>
            </div>

            <Separator />

            {/* User Details */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile Information
              </h4>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </span>
                  <span>{profile.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Joined
                  </span>
                  <span>{format(new Date(profile.created_at), 'MMM d, yyyy')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Last Active
                  </span>
                  <span>{format(new Date(profile.updated_at || profile.created_at), 'MMM d, yyyy')}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Voice Settings */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Mic className="h-4 w-4" />
                Voice Settings
              </h4>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Provider</span>
                  <Badge variant="secondary">{profile.voice_provider || 'OpenAI'}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Voice</span>
                  <span>{profile.openai_voice || 'Default'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Input Mode</span>
                  <span className="capitalize">{profile.input_mode || 'Combined'}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Feature Upgrades */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Feature Upgrades
              </h4>
              
              {featuresLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Mic className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <Label htmlFor="elevenlabs-toggle" className="font-medium">
                          Premium Voice (ElevenLabs)
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          29+ languages, auto-detection, knowledge base
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {togglingFeature === 'elevenlabs_voice' && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      <Switch
                        id="elevenlabs-toggle"
                        checked={hasFeature('elevenlabs_voice')}
                        onCheckedChange={(checked) => handleFeatureToggle('elevenlabs_voice', checked)}
                        disabled={togglingFeature === 'elevenlabs_voice'}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Role Management */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Role Management
              </h4>
              
              <div className="flex items-center gap-3">
                <Select value={role} onValueChange={handleRoleChange}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                Changing roles will update user permissions immediately.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            User not found
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
