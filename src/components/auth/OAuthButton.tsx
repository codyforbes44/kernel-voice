import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { OAuthProvider } from '@/hooks/useOAuthSignIn';
import {
  TwitterIcon,
  GoogleIcon,
  MetaIcon,
  GitHubIcon,
  LinkedInIcon,
  AppleIcon,
} from './OAuthIcons';
import { cn } from '@/lib/utils';

interface OAuthButtonProps {
  provider: OAuthProvider;
  isLoading: boolean;
  disabled: boolean;
  onClick: () => void;
  variant?: 'default' | 'featured';
}

const providerConfig: Record<OAuthProvider, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  twitter: { label: 'X', icon: TwitterIcon },
  google: { label: 'Google', icon: GoogleIcon },
  facebook: { label: 'Meta', icon: MetaIcon },
  github: { label: 'GitHub', icon: GitHubIcon },
  linkedin_oidc: { label: 'LinkedIn', icon: LinkedInIcon },
  apple: { label: 'Apple', icon: AppleIcon },
};

export const OAuthButton = ({
  provider,
  isLoading,
  disabled,
  onClick,
  variant = 'default',
}: OAuthButtonProps) => {
  const config = providerConfig[provider];
  const Icon = config.icon;

  const isFeatured = variant === 'featured';

  return (
    <Button
      type="button"
      variant="outline"
      className={cn(
        'min-h-[44px] gap-2 transition-all',
        isFeatured && 'w-full bg-foreground text-background hover:bg-foreground/90 hover:text-background border-foreground',
        !isFeatured && 'flex-1'
      )}
      onClick={onClick}
      disabled={disabled || isLoading}
      aria-label={`Sign in with ${config.label}`}
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Icon className={cn(isFeatured && 'text-background')} />
      )}
      <span className={cn(isFeatured ? 'block' : 'hidden sm:block')}>
        {isFeatured ? `Continue with ${config.label}` : config.label}
      </span>
    </Button>
  );
};
