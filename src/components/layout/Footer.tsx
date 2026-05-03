import { Link } from 'react-router-dom';
import { BrandLogo } from '@/components/BrandLogo';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="border-t border-border bg-background py-6"
      role="contentinfo"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
            aria-label="ƷBI home"
          >
            <BrandLogo size="sm" animate={false} />
            <span className="font-semibold text-sm tracking-tight">ƷBI</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              © {currentYear}
            </span>
          </Link>

          <nav aria-label="Legal" className="flex items-center gap-4 sm:gap-6">
            <Link
              to="/privacy"
              className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms
            </Link>
          </nav>
        </div>

        <p className="sm:hidden text-center text-xs text-muted-foreground mt-3">
          © {currentYear} ƷBI
        </p>
      </div>
    </footer>
  );
};
