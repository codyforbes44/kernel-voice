import { useOAuthSignIn, OAuthProvider } from '@/hooks/useOAuthSignIn';
import { OAuthButton } from './OAuthButton';

const otherProviders: OAuthProvider[] = ['google', 'facebook', 'github', 'linkedin_oidc', 'apple'];

export const OAuthButtons = () => {
  const { signInWithOAuth, loadingProvider, isLoading } = useOAuthSignIn();

  return (
    <div className="space-y-4">
      {/* Featured X/Twitter button */}
      <OAuthButton
        provider="twitter"
        isLoading={loadingProvider === 'twitter'}
        disabled={isLoading}
        onClick={() => signInWithOAuth('twitter')}
        variant="featured"
      />

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">or</span>
        </div>
      </div>

      {/* Other providers grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {otherProviders.map((provider) => (
          <OAuthButton
            key={provider}
            provider={provider}
            isLoading={loadingProvider === provider}
            disabled={isLoading}
            onClick={() => signInWithOAuth(provider)}
          />
        ))}
      </div>

      {/* Divider before email/password */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">or continue with email</span>
        </div>
      </div>
    </div>
  );
};
