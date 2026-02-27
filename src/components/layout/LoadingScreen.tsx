import { Loader2 } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';

interface LoadingScreenProps {
  message?: string;
  showLogo?: boolean;
}

export const LoadingScreen = ({ message, showLogo = true }: LoadingScreenProps) => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      {showLogo && (
          <BrandLogo size="lg" />
      )}
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
};
