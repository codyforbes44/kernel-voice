import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BrandLogo } from '@/components/BrandLogo';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { UserMenu } from './UserMenu';
import { GlobalCommandPalette } from './GlobalCommandPalette';

export const Header = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogoClick = (e: React.MouseEvent) => {
    if (location.pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <a href="#main-content" className="skip-to-content">Skip to content</a>
      <div className="container mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex h-12 sm:h-14 items-center justify-between gap-2">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center space-x-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
            onClick={handleLogoClick}
            aria-label="ƷBI home"
          >
            <BrandLogo size="sm" />
            <span className="font-bold text-base sm:text-lg hidden sm:inline-block">ƷBI</span>
          </Link>

          {/* Right Section */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Command palette: pill on desktop, icon on mobile */}
            <div className="hidden sm:block">
              <GlobalCommandPalette triggerVariant="pill" />
            </div>
            <div className="sm:hidden">
              <GlobalCommandPalette triggerVariant="icon" />
            </div>

            {user ? (
              <UserMenu user={user} />
            ) : (
              <Button
                onClick={() => navigate('/auth')}
                variant="default"
                size="sm"
                className="min-h-[44px] md:min-h-0"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
