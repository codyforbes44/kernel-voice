import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/hooks/useSubscription';

export type FeatureKey = 'elevenlabs_voice';

interface UserFeature {
  id: string;
  user_id: string;
  feature_key: string;
  enabled: boolean;
  granted_by: string | null;
  granted_at: string;
  revoked_at: string | null;
  metadata: Record<string, unknown>;
}

export function useUserFeatures() {
  const [userId, setUserId] = useState<string | null>(null);
  const { isSubscribed, isLoading: subscriptionLoading } = useSubscription();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const { data: features = [], isLoading, refetch } = useQuery({
    queryKey: ['user-features', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('user_features')
        .select('*')
        .eq('user_id', userId)
        .eq('enabled', true)
        .is('revoked_at', null);

      if (error) {
        console.error('Failed to fetch user features:', error);
        return [];
      }

      return (data || []) as UserFeature[];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const hasFeature = useCallback((featureKey: FeatureKey): boolean => {
    // Pro subscribers get all premium features
    if (isSubscribed) {
      return true;
    }
    // Otherwise check admin-granted features
    return features.some(f => f.feature_key === featureKey && f.enabled);
  }, [features, isSubscribed]);

  return {
    features,
    hasFeature,
    loading: isLoading || subscriptionLoading,
    refetch,
    isAuthenticated: !!userId,
    isSubscribed,
  };
}

// Hook for admin to fetch features for a specific user
export function useUserFeaturesAdmin(targetUserId: string | null) {
  const { data: features = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-user-features', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-operations`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            action: 'listUserFeatures',
            targetUserId,
          }),
        }
      );

      if (!response.ok) {
        console.error('Failed to fetch user features');
        return [];
      }

      const result = await response.json();
      return result.features || [];
    },
    enabled: !!targetUserId,
  });

  return {
    features,
    loading: isLoading,
    refetch,
  };
}
