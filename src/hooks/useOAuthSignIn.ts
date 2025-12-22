import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type OAuthProvider = 'twitter' | 'google' | 'facebook' | 'github' | 'linkedin_oidc' | 'apple';

export const useOAuthSignIn = () => {
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null);
  const { toast } = useToast();

  const signInWithOAuth = async (provider: OAuthProvider) => {
    setLoadingProvider(provider);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) throw error;
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
