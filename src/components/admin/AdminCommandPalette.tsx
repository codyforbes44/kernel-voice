import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { 
  Shield, 
  Users, 
  MessageSquare, 
  FileText, 
  BookOpen, 
  Settings, 
  ClipboardList,
  Home,
  Search,
  UserPlus,
  Upload
} from 'lucide-react';

interface AdminCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const navigationItems = [
  { label: 'Dashboard', icon: Shield, path: '/admin' },
  { label: 'Users', icon: Users, path: '/admin/users' },
  { label: 'Conversations', icon: MessageSquare, path: '/admin/conversations' },
  { label: 'Documents', icon: FileText, path: '/admin/documents' },
  { label: 'Knowledge Base', icon: BookOpen, path: '/admin/knowledge-base' },
  { label: 'Audit Logs', icon: ClipboardList, path: '/admin/audit-logs' },
  { label: 'Settings', icon: Settings, path: '/admin/settings' },
  { label: 'Back to App', icon: Home, path: '/' },
];

const quickActions = [
  { label: 'Search Users', icon: Search, action: 'search-users' },
  { label: 'Add New User', icon: UserPlus, action: 'add-user' },
  { label: 'Upload KB Document', icon: Upload, action: 'upload-kb' },
];

export const AdminCommandPalette = ({ open, onOpenChange }: AdminCommandPaletteProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  const handleSelect = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };

  const handleAction = (action: string) => {
    switch (action) {
      case 'search-users':
        navigate('/admin/users');
        break;
      case 'add-user':
        navigate('/admin/users');
        break;
      case 'upload-kb':
        navigate('/admin/knowledge-base');
        break;
    }
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Navigation">
          {navigationItems.map((item) => (
            <CommandItem
              key={item.path}
              value={item.label}
              onSelect={() => handleSelect(item.path)}
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Quick Actions">
          {quickActions.map((item) => (
            <CommandItem
              key={item.action}
              value={item.label}
              onSelect={() => handleAction(item.action)}
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};