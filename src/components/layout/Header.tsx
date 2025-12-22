import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { UserMenu } from './UserMenu';
import { ThemeToggle } from '@/components/ThemeToggle';

export const Header = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Session error:', error);
        setUser(null);
        return;
      }
      setUser(session?.user ?? null);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED') {
        console.log('Session refreshed successfully');
      }
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex h-12 sm:h-14 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <img src="/logo.png" alt="Kernel" className="h-6 w-6 sm:h-7 sm:w-7" />
            <span className="font-bold text-base sm:text-lg hidden sm:inline-block">Kernel</span>
          </Link>

          {/* Auth Section */}
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            
            {user ? (
              <UserMenu user={user} />
            ) : (
              <Button onClick={() => navigate('/auth')} variant="default" size="sm" className="min-h-[44px] md:min-h-0">
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
