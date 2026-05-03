import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { LogOut, Mic, Shield, UserCircle, Home, CreditCard, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';

interface UserMenuProps {
  user: User;
}

export const UserMenu = ({ user }: UserMenuProps) => {
  const navigate = useNavigate();
  const { isAdmin } = useUserRole();
  const [profile, setProfile] = useState<{ display_name: string | null; avatar_url: string | null } | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', user.id)
        .single();
      
      if (data) {
        setProfile(data);
      }
    };

    loadProfile();
  }, [user.id]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Failed to sign out');
    } else {
      toast.success('Signed out successfully');
      navigate('/auth');
    }
  };

  const getInitials = (name: string | null, email: string | null) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email?.charAt(0).toUpperCase() || 'U';
  };

  const displayName = profile?.display_name || user.email;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus:outline-none">
        <Avatar className="h-8 w-8 border border-border cursor-pointer hover:border-primary transition-colors">
          <AvatarImage src={profile?.avatar_url || undefined} alt="Profile" />
          <AvatarFallback className="bg-primary/10 text-primary">
            {getInitials(profile?.display_name || null, user.email || null)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{displayName}</p>
            {profile?.display_name && (
              <p className="text-xs text-muted-foreground">{user.email}</p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
          <UserCircle className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/assistant')} className="cursor-pointer">
          <Mic className="mr-2 h-4 w-4" />
          <span>Assistant</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/')} className="cursor-pointer">
          <Home className="mr-2 h-4 w-4" />
          <span>Home</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/pricing')} className="cursor-pointer">
          <CreditCard className="mr-2 h-4 w-4" />
          <span>Pricing</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/faq')} className="cursor-pointer">
          <HelpCircle className="mr-2 h-4 w-4" />
          <span>FAQ</span>
        </DropdownMenuItem>
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/admin')} className="cursor-pointer">
              <Shield className="mr-2 h-4 w-4" />
              <span>Admin Dashboard</span>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
