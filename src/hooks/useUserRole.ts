import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'moderator' | 'user' | null;

export const useUserRole = () => {
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setRole(null);
          setLoading(false);
          return;
        }

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
        setRole('user');
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, []);

  const hasRole = (requiredRole: 'admin' | 'moderator' | 'user') => {
    if (!role) return false;
    if (requiredRole === 'user') return true;
    if (requiredRole === 'moderator') return role === 'admin' || role === 'moderator';
    if (requiredRole === 'admin') return role === 'admin';
    return false;
  };

  return { role, loading, hasRole, isAdmin: role === 'admin' };
};
