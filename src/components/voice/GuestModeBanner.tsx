import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GuestModeBannerProps {
  variant?: 'compact' | 'full';
  className?: string;
}

export const GuestModeBanner = ({ variant = 'full', className = '' }: GuestModeBannerProps) => {
  const navigate = useNavigate();

  if (variant === 'compact') {
    return (
      <div className={`p-3 rounded-lg bg-primary/10 border border-primary/20 ${className}`}>
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">Guest Mode</p>
          <Button 
            size="sm" 
            variant="outline" 
            className="h-9 min-h-[44px]"
            onClick={() => navigate('/auth')}
          >
            <LogIn className="h-3 w-3 mr-1" />
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg bg-primary/10 border border-primary/20 ${className}`}>
      <div className="flex items-center justify-between gap-4">
        <p className="font-medium">Guest Mode - Conversations won't be saved</p>
        <Button 
          variant="outline"
          onClick={() => navigate('/auth')}
          className="min-h-[44px]"
        >
          <LogIn className="h-4 w-4 mr-2" />
          Sign In to Save
        </Button>
      </div>
    </div>
  );
};
