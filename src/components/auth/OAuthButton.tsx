import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { OAuthProvider } from '@/hooks/useOAuthSignIn';
import { GoogleIcon, AppleIcon } from './OAuthIcons';
import { cn } from '@/lib/utils';

interface OAuthButtonProps {
  provider: OAuthProvider;
  isLoading: boolean;
  disabled: boolean;
  onClick: () => void;
}

const providerConfig: Record<OAuthProvider, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  google: { label: 'Google', icon: GoogleIcon },
  apple: { label: 'Apple', icon: AppleIcon },
};

export const OAuthButton = ({
  provider,
  isLoading,
  disabled,
  onClick,
}: OAuthButtonProps) => {
  const config = providerConfig[provider];
  const Icon = config.icon;

  return (
    <Button
      type="button"
      variant="outline"
      className="min-h-[44px] gap-2 transition-all flex-1"
      onClick={onClick}
      disabled={disabled || isLoading}
      aria-label={`Sign in with ${config.label}`}
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Icon />
      )}
      <span>{config.label}</span>
    </Button>
  );
};
