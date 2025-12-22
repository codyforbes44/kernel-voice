import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { UserMenu } from './UserMenu';
import { ThemePreview } from '@/components/ThemePreview';
import { useUserRole } from '@/hooks/useUserRole';
import { Mic, Download, LayoutDashboard, Menu } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const Header = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, loading: roleLoading } = useUserRole();

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

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: '/assistant', label: 'Assistant', icon: Mic },
    { path: '/install', label: 'Install', icon: Download },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex h-12 sm:h-14 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <img src="/logo.png" alt="Kernel" className="h-6 w-6 sm:h-7 sm:w-7" />
            <span className="font-bold text-base sm:text-lg hidden sm:inline-block">Kernel</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map(({ path, label, icon: Icon }) => (
              <Button
                key={path}
                variant={isActive(path) ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => navigate(path)}
                className="gap-2"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Button>
            ))}
            {user && !roleLoading && isAdmin && (
              <Button
                variant={location.pathname.startsWith('/admin') ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => navigate('/admin')}
                className="gap-2"
              >
                <LayoutDashboard className="h-4 w-4" />
                Admin
              </Button>
            )}
          </nav>

          {/* Right Section */}
          <div className="flex items-center space-x-2">
            {/* Mobile Navigation Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="min-h-[44px]">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {navLinks.map(({ path, label, icon: Icon }) => (
                  <DropdownMenuItem
                    key={path}
                    onClick={() => navigate(path)}
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </DropdownMenuItem>
                ))}
                {user && !roleLoading && isAdmin && (
                  <DropdownMenuItem
                    onClick={() => navigate('/admin')}
                    className="gap-2"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Admin
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <ThemePreview />
            
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
