import { Link } from 'react-router-dom';
import { Mic, Download, Shield, FileText, Sparkles, CreditCard } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';

export const Footer = () => {
  const currentYear = new Date().getFullYear();
  const navLinks = [
    { path: '/assistant', label: 'Assistant', icon: Mic },
    { path: '/showcase', label: 'Playground', icon: Sparkles },
    { path: '/pricing', label: 'Pricing', icon: CreditCard },
    { path: '/install', label: 'Install', icon: Download },
  ];
  const legalLinks = [
    { path: '/privacy', label: 'Privacy Policy', icon: Shield },
    { path: '/terms', label: 'Terms of Service', icon: FileText },
  ];

  return (
    <footer className="py-8 sm:py-12 border-t border-border bg-background" role="contentinfo">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-10 mb-8 sm:mb-10">
          {/* Brand */}
          <div className="space-y-3 sm:space-y-4">
            <Link to="/" className="flex items-center space-x-2 group" aria-label="ƷBI Voice home">
              <BrandLogo size="md" animate={false} />
              <span className="font-bold text-lg font-display tracking-tight">ƷBI Voice</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Premium AI assistant with real-time voice conversations and intelligent document analysis.
            </p>
          </div>

          {/* Navigation */}
          <nav aria-label="Product links">
            <h4 className="font-semibold mb-3 sm:mb-4 text-sm uppercase tracking-wider text-muted-foreground">Product</h4>
            <ul className="space-y-1">
              {navLinks.map(({ path, label, icon: Icon }) => (
                <li key={path}>
                  <Link to={path} className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 py-1.5 min-h-[36px] sm:min-h-0">
                    <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Legal */}
          <nav aria-label="Legal links">
            <h4 className="font-semibold mb-3 sm:mb-4 text-sm uppercase tracking-wider text-muted-foreground">Legal</h4>
            <ul className="space-y-1">
              {legalLinks.map(({ path, label, icon: Icon }) => (
                <li key={path}>
                  <Link to={path} className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 py-1.5 min-h-[36px] sm:min-h-0">
                    <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Bottom */}
        <div className="pt-6 sm:pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs sm:text-sm text-muted-foreground">
            © {currentYear} ƷBI Voice. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground">Powered by ƷBI</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
