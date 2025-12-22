import { Link } from 'react-router-dom';
import { Mic, Download, Shield, FileText } from 'lucide-react';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  const navLinks = [
    { path: '/assistant', label: 'Assistant', icon: Mic },
    { path: '/install', label: 'Install', icon: Download },
  ];

  const legalLinks = [
    { path: '/privacy', label: 'Privacy', icon: Shield },
    { path: '/terms', label: 'Terms', icon: FileText },
  ];

  return (
    <footer className="py-8 border-t border-border bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <img src="/logo.png" alt="Kernel" className="h-8 w-8" />
              <span className="font-bold text-lg">Kernel</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              Premium AI assistant with real-time voice conversations and intelligent document analysis.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2">
              {navLinks.map(({ path, label, icon: Icon }) => (
                <li key={path}>
                  <Link 
                    to={path} 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              {legalLinks.map(({ path, label, icon: Icon }) => (
                <li key={path}>
                  <Link 
                    to={path} 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} Kernel. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground">
              Powered by Lovable AI
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
