import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type UserRole = 'admin' | 'moderator' | 'user' | null;

export const useUserRole = () => {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    const fetchUserRole = async () => {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error || !data) {
          setRole('user');
        } else {
          setRole(data.role as UserRole);
        }
      } catch (err) {
        console.error('Error fetching user role:', err);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user, authLoading]);

  const hasRole = (requiredRole: 'admin' | 'moderator' | 'user') => {
    if (!role) return false;
    if (requiredRole === 'user') return true;
    if (requiredRole === 'moderator') return role === 'admin' || role === 'moderator';
    if (requiredRole === 'admin') return role === 'admin';
    return false;
  };

  return { role, loading: loading || authLoading, hasRole, isAdmin: role === 'admin' };
};
