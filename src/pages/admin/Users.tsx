import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { UserDetailDrawer } from '@/components/admin/UserDetailDrawer';
import { BulkActionToolbar } from '@/components/admin/BulkActionToolbar';
import SEO from '@/components/SEO';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, Trash2, Shield, Eye, ChevronLeft, ChevronRight, RefreshCw, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface UserFeature {
  user_id: string;
  feature_key: string;
  enabled: boolean;
  revoked_at: string | null;
}

interface UserWithRole {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
  updated_at: string | null;
  role: 'admin' | 'moderator' | 'user';
  hasElevenLabs?: boolean;
}

const PAGE_SIZE = 20;

export default function AdminUsers() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserRole, setSelectedUserRole] = useState<'admin' | 'moderator' | 'user'>('user');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data: profiles, count } = await supabase
        .from('profiles')
        .select('id, email, display_name, created_at, updated_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (profiles) {
        // Fetch all user features for the displayed users
        const userIds = profiles.map(p => p.id);
        const { data: allFeatures } = await supabase
          .from('user_features')
          .select('user_id, feature_key, enabled, revoked_at')
          .in('user_id', userIds)
          .eq('feature_key', 'elevenlabs_voice')
          .eq('enabled', true)
          .is('revoked_at', null);

        const featureMap = new Map<string, boolean>();
        (allFeatures || []).forEach((f: UserFeature) => {
          featureMap.set(f.user_id, true);
        });

        const usersWithRoles = await Promise.all(
          profiles.map(async (profile) => {
            const { data: roleData } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', profile.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            return {
              ...profile,
              role: (roleData?.role as 'admin' | 'moderator' | 'user') || 'user',
              hasElevenLabs: featureMap.get(profile.id) || false,
            };
          })
        );

        setUsers(usersWithRoles);
        setTotalCount(count || 0);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'moderator' | 'user') => {
    try {
      // Use edge function for secure role update
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
          action: 'updateUserRole',
          targetUserId: userId,
          newRole,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update role');
      }

      toast.success('Role updated successfully');
      fetchUsers();
    } catch (error) {
      console.error('Role update error:', error);
      toast.error('Failed to update role');
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserId) return;

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
          action: 'deleteUser',
          targetUserId: deleteUserId,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete user');
      }

      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      console.error('Delete user error:', error);
      toast.error('Failed to delete user');
    }
    setDeleteUserId(null);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

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
          action: 'bulkDelete',
          targetResourceIds: Array.from(selectedIds),
          resourceType: 'user',
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete users');
      }

      toast.success(`Deleted ${result.deleted} users`);
      setSelectedIds(new Set());
      fetchUsers();
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error('Failed to delete users');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredUsers.map(u => u.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedIds(newSelected);
  };

  const openUserDetail = (user: UserWithRole) => {
    setSelectedUserId(user.id);
    setSelectedUserRole(user.role);
    setDrawerOpen(true);
  };

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const getRoleBadgeVariant = (role: string): 'default' | 'secondary' | 'outline' => {
    switch (role) {
      case 'admin': return 'default';
      case 'moderator': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <AdminGuard>
      <AdminLayout>
        <SEO title="User Management" description="Manage users and roles" />
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
              <p className="text-muted-foreground mt-2">
                Manage user accounts and assign roles ({totalCount} total)
              </p>
            </div>
            <Button variant="outline" onClick={fetchUsers} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Bulk Actions */}
          <BulkActionToolbar
            selectedCount={selectedIds.size}
            onClearSelection={() => setSelectedIds(new Set())}
            onBulkDelete={handleBulkDelete}
            showRoleActions={true}
            resourceType="user"
          />

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by email or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Users Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedIds.size === filteredUsers.length && filteredUsers.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Features</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => {
                    const isRecent = user.updated_at && 
                      new Date(user.updated_at).getTime() > Date.now() - 24 * 60 * 60 * 1000;
                    
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(user.id)}
                            onCheckedChange={(checked) => handleSelectOne(user.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {user.email.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">
                              {user.display_name || user.email.split('@')[0]}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Select
                            value={user.role}
                            onValueChange={(value) =>
                              handleRoleChange(user.id, value as 'admin' | 'moderator' | 'user')
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="moderator">Moderator</SelectItem>
                              <SelectItem value="admin">
                                <div className="flex items-center">
                                  <Shield className="h-4 w-4 mr-2" />
                                  Admin
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {user.hasElevenLabs && (
                            <Badge variant="secondary" className="text-xs">
                              <Sparkles className="h-3 w-3 mr-1" />
                              Premium
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={isRecent ? 'default' : 'secondary'}>
                            {isRecent ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(user.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openUserDetail(user)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteUserId(user.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Showing {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* User Detail Drawer */}
        <UserDetailDrawer
          userId={selectedUserId}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          currentRole={selectedUserRole}
          onRoleChange={handleRoleChange}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the user account
                and all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AdminLayout>
    </AdminGuard>
  );
}