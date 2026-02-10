import { useState } from 'react';
import { lovable } from '@/integrations/lovable/index';
import { useToast } from '@/hooks/use-toast';

export type OAuthProvider = 'google' | 'apple';

export const useOAuthSignIn = () => {
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null);
  const { toast } = useToast();

  const signInWithOAuth = async (provider: OAuthProvider) => {
    setLoadingProvider(provider);

    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });

      if (result.error) throw result.error;
    } catch (error: any) {
      toast({
        title: 'Authentication Error',
        description: error.message || `Failed to sign in with ${provider}`,
        variant: 'destructive',
      });
      setLoadingProvider(null);
    }
  };

  return {
    signInWithOAuth,
    loadingProvider,
    isLoading: loadingProvider !== null,
  };
};
