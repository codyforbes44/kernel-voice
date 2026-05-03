import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import {
  Mic,
  Home,
  CreditCard,
  User,
  LayoutDashboard,
  Shield,
  FileText,
  LogIn,
  LogOut,
  Search,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from 'next-themes';

interface Props {
  /** Render style of the trigger button. */
  triggerVariant?: 'pill' | 'icon';
}

/**
 * Global command palette + trigger.
 * - ⌘K / Ctrl+K toggles open from anywhere.
 * - Trigger doubles as the only navigation control in the header.
 */
export const GlobalCommandPalette = ({ triggerVariant = 'pill' }: Props) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const run = useCallback((fn: () => void) => {
    setOpen(false);
    // Defer so the dialog can close before route/state change.
    requestAnimationFrame(fn);
  }, []);

  const go = (path: string) => run(() => navigate(path));

  const handleSignOut = () =>
    run(async () => {
      await supabase.auth.signOut();
      navigate('/');
    });

  return (
    <>
      {triggerVariant === 'pill' ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          aria-label="Open command palette"
          className="h-9 gap-2 px-3 text-muted-foreground hover:text-foreground min-w-[160px] justify-between"
        >
          <span className="flex items-center gap-2">
            <Search className="h-4 w-4" aria-hidden="true" />
            <span className="text-sm">Search…</span>
          </span>
          <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
          aria-label="Open command palette"
          className="min-h-[44px] min-w-[44px]"
        >
          <Search className="h-5 w-5" aria-hidden="true" />
        </Button>
      )}

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search pages, actions…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Navigate">
            <CommandItem onSelect={() => go('/')}>
              <Home className="mr-2 h-4 w-4" />
              <span>Home</span>
            </CommandItem>
            <CommandItem onSelect={() => go('/assistant')}>
              <Mic className="mr-2 h-4 w-4" />
              <span>Assistant</span>
            </CommandItem>
            <CommandItem onSelect={() => go('/pricing')}>
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Pricing</span>
            </CommandItem>
            {user && (
              <CommandItem onSelect={() => go('/profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </CommandItem>
            )}
            {user && isAdmin && (
              <CommandItem onSelect={() => go('/admin')}>
                <LayoutDashboard className="mr-2 h-4 w-4" />
                <span>Admin Dashboard</span>
              </CommandItem>
            )}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Preferences">
            <CommandItem
              onSelect={() => run(() => setTheme(theme === 'dark' ? 'light' : 'dark'))}
            >
              {theme === 'dark' ? (
                <Sun className="mr-2 h-4 w-4" />
              ) : (
                <Moon className="mr-2 h-4 w-4" />
              )}
              <span>Toggle theme</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Legal">
            <CommandItem onSelect={() => go('/privacy')}>
              <Shield className="mr-2 h-4 w-4" />
              <span>Privacy Policy</span>
            </CommandItem>
            <CommandItem onSelect={() => go('/terms')}>
              <FileText className="mr-2 h-4 w-4" />
              <span>Terms of Service</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Account">
            {user ? (
              <CommandItem onSelect={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </CommandItem>
            ) : (
              <CommandItem onSelect={() => go('/auth')}>
                <LogIn className="mr-2 h-4 w-4" />
                <span>Sign in</span>
                <CommandShortcut>↵</CommandShortcut>
              </CommandItem>
            )}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
};
