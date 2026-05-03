import { ReactNode, useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminCommandPalette } from '@/components/admin/AdminCommandPalette';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, Command } from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Load sidebar state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('admin-sidebar-collapsed');
    if (saved !== null) setSidebarCollapsed(JSON.parse(saved));
  }, []);

  const handleCollapsedChange = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
    localStorage.setItem('admin-sidebar-collapsed', JSON.stringify(collapsed));
  };

  return (
    <TooltipProvider>
      <div className="min-h-dvh bg-background flex flex-col">
        <Header />

        {/* Mobile admin toolbar */}
        <div className="lg:hidden sticky top-12 z-30 flex items-center gap-2 border-b bg-background/95 backdrop-blur px-3 py-2">
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="tap-target" aria-label="Open admin navigation">
                <Menu className="h-5 w-5" aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="px-4 pt-4 pb-2 border-b">
                <SheetTitle>Admin</SheetTitle>
              </SheetHeader>
              <div className="h-[calc(100dvh-3.5rem)]">
                <AdminSidebar
                  collapsed={false}
                  onCollapsedChange={() => {}}
                  onNavigate={() => setMobileNavOpen(false)}
                />
              </div>
            </SheetContent>
          </Sheet>
          <span className="text-sm font-semibold flex-1">Admin</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCommandPaletteOpen(true)}
            className="tap-target gap-2"
            aria-label="Open command palette"
          >
            <Command className="h-4 w-4" aria-hidden />
            <span className="hidden xs:inline">Search</span>
          </Button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="hidden lg:block">
            <AdminSidebar
              collapsed={sidebarCollapsed}
              onCollapsedChange={handleCollapsedChange}
              onOpenCommandPalette={() => setCommandPaletteOpen(true)}
            />
          </div>

          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-7xl">
              {children}
            </div>
          </main>
        </div>

        <AdminCommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
      </div>
    </TooltipProvider>
  );
};
