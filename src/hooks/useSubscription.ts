import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PRO_PRODUCT_IDS } from '@/lib/stripe';

interface SubscriptionData {
  subscribed: boolean;
  product_id: string | null;
  subscription_end: string | null;
}

export interface UseSubscriptionReturn {
  isSubscribed: boolean;
  isLoading: boolean;
  productId: string | null;
  subscriptionEnd: string | null;
  refetch: () => void;
  createCheckout: (priceId: string) => Promise<{ url?: string; error?: string }>;
  openCustomerPortal: () => Promise<{ url?: string; error?: string }>;
}

export function useSubscription(): UseSubscriptionReturn {
  const [userId, setUserId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id || null);
      // Refetch subscription status on auth change
      if (session?.user?.id) {
        queryClient.invalidateQueries({ queryKey: ['subscription', session.user.id] });
      }
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['subscription', userId],
    queryFn: async (): Promise<SubscriptionData> => {
      if (!userId) {
        return { subscribed: false, product_id: null, subscription_end: null };
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { subscribed: false, product_id: null, subscription_end: null };
      }

      const response = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        console.error('Subscription check failed:', response.error);
        return { subscribed: false, product_id: null, subscription_end: null };
      }

      return response.data as SubscriptionData;
    },
    enabled: !!userId,
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 1000 * 60, // Auto-refresh every minute
    refetchOnWindowFocus: true,
  });

  const createCheckout = useCallback(async (priceId: string): Promise<{ url?: string; error?: string }> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { error: 'Please sign in to subscribe' };
    }

    const response = await supabase.functions.invoke('create-checkout', {
      body: { priceId },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (response.error) {
      return { error: response.error.message };
    }

    if (response.data.error) {
      return { error: response.data.error };
    }

    return { url: response.data.url };
  }, []);

  const openCustomerPortal = useCallback(async (): Promise<{ url?: string; error?: string }> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { error: 'Please sign in to manage your subscription' };
    }

    const response = await supabase.functions.invoke('customer-portal', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (response.error) {
      return { error: response.error.message };
    }

    if (response.data.error) {
      return { error: response.data.error };
    }

    return { url: response.data.url };
  }, []);

  // Check if the product is a Pro product
  const isProSubscribed = data?.subscribed && 
    data.product_id && 
    PRO_PRODUCT_IDS.includes(data.product_id as typeof PRO_PRODUCT_IDS[number]);

  return {
    isSubscribed: isProSubscribed || false,
    isLoading,
    productId: data?.product_id || null,
    subscriptionEnd: data?.subscription_end || null,
    refetch: () => refetch(),
    createCheckout,
    openCustomerPortal,
  };
}
