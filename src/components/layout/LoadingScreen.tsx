import { Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  showLogo?: boolean;
}

export const LoadingScreen = ({ message, showLogo = true }: LoadingScreenProps) => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      {showLogo && (
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl scale-150 animate-pulse" />
          <img 
            src="/logo.png" 
            alt="Kernel" 
            className="relative h-16 w-16 drop-shadow-lg animate-pulse"
          />
        </div>
      )}
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
};
