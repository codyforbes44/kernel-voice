import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { UserMenu } from './UserMenu';
import { ThemeToggle } from '@/components/ThemeToggle';

export const Header = () => {
  const [user, setUser] = useState<User | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
            <Mic className="h-5 w-5 sm:h-6 sm:w-6 text-primary group-hover:text-primary/80 transition-colors" />
            <span className="font-bold text-base sm:text-lg hidden sm:inline-block">AI Intelligence</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/install" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Install
            </Link>
          </nav>

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

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-foreground p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 space-y-2 border-t border-border/40">
            <Link
              to="/install"
              className="block px-4 py-3 text-sm font-medium text-muted-foreground hover:text-primary transition-colors min-h-[44px] flex items-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              Install
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
};
