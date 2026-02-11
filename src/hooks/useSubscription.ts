import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PAID_PRODUCT_IDS, getTierName, type TierName } from '@/lib/stripe';

interface SubscriptionData {
  subscribed: boolean;
  product_id: string | null;
  subscription_end: string | null;
}

export interface UseSubscriptionReturn {
  isSubscribed: boolean;
  isLoading: boolean;
  productId: string | null;
  tierName: TierName | null;
  subscriptionEnd: string | null;
  refetch: () => void;
  createCheckout: (priceId: string) => Promise<{ url?: string; error?: string }>;
  openCustomerPortal: () => Promise<{ url?: string; error?: string }>;
}

export function useSubscription(): UseSubscriptionReturn {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async (): Promise<SubscriptionData> => {
      if (!user || !session) {
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
    enabled: !!user,
    staleTime: 1000 * 60,
    refetchInterval: 1000 * 60,
    refetchOnWindowFocus: true,
  });

  const createCheckout = useCallback(async (priceId: string): Promise<{ url?: string; error?: string }> => {
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
  }, [session]);

  const openCustomerPortal = useCallback(async (): Promise<{ url?: string; error?: string }> => {
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
  }, [session]);

  const isPaidSubscribed = data?.subscribed && 
    data.product_id && 
    PAID_PRODUCT_IDS.includes(data.product_id as typeof PAID_PRODUCT_IDS[number]);

  return {
    isSubscribed: isPaidSubscribed || false,
    isLoading,
    productId: data?.product_id || null,
    tierName: getTierName(data?.product_id || null),
    subscriptionEnd: data?.subscription_end || null,
    refetch: () => refetch(),
    createCheckout,
    openCustomerPortal,
  };
}
