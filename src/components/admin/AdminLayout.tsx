import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, MessageSquare, FileText, Shield, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Header } from '@/components/layout/Header';

interface AdminLayoutProps {
  children: ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();

  const navItems = [
    { to: '/admin', label: 'Dashboard', icon: Shield },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/conversations', label: 'Conversations', icon: MessageSquare },
    { to: '/admin/documents', label: 'Documents', icon: FileText },
    { to: '/admin/knowledge-base', label: 'Knowledge Base', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className="md:w-64 space-y-2">
            <div className="mb-4">
              <Link to="/" className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <Home className="h-4 w-4" />
                <span>Back to App</span>
              </Link>
            </div>
            
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;
                
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      'flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};
