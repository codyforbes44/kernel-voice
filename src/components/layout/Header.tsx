import { Link, useNavigate, useLocation } from 'react-router-dom';
import { BrandLogo } from '@/components/BrandLogo';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { UserMenu } from './UserMenu';
import { ThemePreview } from '@/components/ThemePreview';
import { useUserRole } from '@/hooks/useUserRole';
import { Mic, Download, LayoutDashboard, Menu, Gamepad2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useState } from 'react';

export const Header = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: '/assistant', label: 'Assistant', icon: Mic },
    { path: '/install', label: 'Install', icon: Download },
    { path: '/showcase', label: 'Playground', icon: Gamepad2, beta: true },
  ];

  const handleLogoClick = (e: React.MouseEvent) => {
    if (location.pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNavClick = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <a href="#main-content" className="skip-to-content">Skip to content</a>
      <div className="container mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex h-12 sm:h-14 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group" onClick={handleLogoClick}>
            <BrandLogo size="sm" />
            <span className="font-bold text-base sm:text-lg hidden sm:inline-block">ƷBI Voice</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1" aria-label="Main navigation">
            {navLinks.map(({ path, label, icon: Icon, beta }) => (
              <Button
                key={path}
                variant="ghost"
                size="sm"
                onClick={() => navigate(path)}
                className={`gap-2 relative ${isActive(path) ? 'text-primary' : ''}`}
                aria-current={isActive(path) ? 'page' : undefined}
              >
                <Icon className="h-4 w-4" />
                {label}
                {beta && <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-medium">Beta</Badge>}
                {isActive(path) && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full" />
                )}
              </Button>
            ))}
            {user && !roleLoading && isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin')}
                className={`gap-2 relative ${location.pathname.startsWith('/admin') ? 'text-primary' : ''}`}
                aria-current={location.pathname.startsWith('/admin') ? 'page' : undefined}
              >
                <LayoutDashboard className="h-4 w-4" />
                Admin
                {location.pathname.startsWith('/admin') && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full" />
                )}
              </Button>
            )}
          </nav>

          {/* Right Section */}
          <div className="flex items-center space-x-2">
            {/* Mobile Navigation - Sheet Drawer */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px]" aria-label="Open navigation menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SheetHeader className="px-4 pt-4 pb-2 border-b border-border">
                  <SheetTitle className="flex items-center gap-2">
                    <BrandLogo size="sm" animate={false} />
                    <span className="font-bold">ƷBI Voice</span>
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col p-2" aria-label="Mobile navigation">
                  {navLinks.map(({ path, label, icon: Icon, beta }) => (
                    <button
                      key={path}
                      onClick={() => handleNavClick(path)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors min-h-[48px] ${
                        isActive(path) 
                          ? 'bg-primary/10 text-primary' 
                          : 'text-foreground hover:bg-muted'
                      }`}
                      aria-current={isActive(path) ? 'page' : undefined}
                    >
                      <Icon className="h-5 w-5" />
                      {label}
                      {beta && <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-medium ml-auto">Beta</Badge>}
                    </button>
                  ))}
                  {user && !roleLoading && isAdmin && (
                    <button
                      onClick={() => handleNavClick('/admin')}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors min-h-[48px] ${
                        location.pathname.startsWith('/admin')
                          ? 'bg-primary/10 text-primary'
                          : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      <LayoutDashboard className="h-5 w-5" />
                      Admin
                    </button>
                  )}
                </nav>
              </SheetContent>
            </Sheet>

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
