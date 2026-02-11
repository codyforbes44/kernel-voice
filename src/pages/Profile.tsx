import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Loader2, Save, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/layout/Header';
import { InputModeSelector, type InputMode } from '@/components/voice/InputModeSelector';
import SEO from '@/components/SEO';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface ProfileData {
  display_name: string | null;
  avatar_url: string | null;
  input_mode: string | null;
}

const Profile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>('combined');

  useEffect(() => {
    if (!user) return;
    const loadProfile = async () => {
      const { data: profile } = await supabase
        .from('profiles').select('display_name, avatar_url, input_mode').eq('id', user.id).single();
      if (profile) {
        setDisplayName(profile.display_name || '');
        setAvatarUrl(profile.avatar_url);
        if (profile.input_mode && ['voice', 'text', 'combined'].includes(profile.input_mode)) {
          setInputMode(profile.input_mode as InputMode);
        }
      }
      setLoading(false);
    };
    loadProfile();
  }, [user]);

  const handleAvatarClick = () => { fileInputRef.current?.click(); };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be less than 2MB'); return; }
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const urlWithCacheBuster = `${publicUrl}?t=${Date.now()}`;
      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: urlWithCacheBuster }).eq('id', user.id);
      if (updateError) throw updateError;
      setAvatarUrl(urlWithCacheBuster);
      toast.success('Avatar updated successfully');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    } finally { setUploading(false); }
  };

  const handleSave = async () => {
    if (!user) return;
    if (displayName.length > 50) { toast.error('Display name must be 50 characters or less'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({ display_name: displayName.trim() || null, input_mode: inputMode }).eq('id', user.id);
      if (error) throw error;
      localStorage.setItem('input_mode', inputMode);
      toast.success('Profile saved successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    } finally { setSaving(false); }
  };

  const getInitials = (name: string | null, email: string | null) => {
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    return email?.charAt(0).toUpperCase() || 'U';
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <SEO title="Profile Settings" description="Manage your profile settings, avatar, and preferences" />
      <div className="min-h-[100dvh] bg-background">
        <Header />
        <main id="main-content" className="container max-w-2xl mx-auto py-6 md:py-8 px-4">
          <Button variant="ghost" onClick={() => navigate('/assistant')} className="mb-4 min-h-[44px]">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Assistant
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>Manage your profile information and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Avatar Section - mobile-friendly */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Avatar className="h-24 w-24 border-2 border-border">
                    <AvatarImage src={avatarUrl || undefined} alt="Profile avatar" />
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                      {getInitials(displayName, user?.email || null)}
                    </AvatarFallback>
                  </Avatar>
                  {/* Always-visible overlay on mobile, hover on desktop */}
                  <button
                    onClick={handleAvatarClick}
                    disabled={uploading}
                    className="absolute inset-0 flex items-center justify-center bg-background/60 md:bg-background/80 opacity-60 md:opacity-0 md:group-hover:opacity-100 hover:opacity-100 transition-opacity rounded-full cursor-pointer"
                    aria-label="Change avatar"
                  >
                    {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Camera className="h-6 w-6" />}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </div>
                <Button variant="outline" size="sm" onClick={handleAvatarClick} disabled={uploading} className="min-h-[44px] md:hidden">
                  {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Camera className="h-4 w-4 mr-2" />}
                  Change Photo
                </Button>
              </div>

              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Enter your display name" maxLength={50} className="min-h-[44px]" />
                <p className="text-xs text-muted-foreground flex justify-between">
                  <span>This name will be shown instead of your email</span>
                  <span className="tabular-nums">{displayName.length}/50</span>
                </p>
              </div>

              {/* Email (Read-only) */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user?.email || ''} disabled className="bg-muted min-h-[44px]" />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>

              {/* Input Mode Preference */}
              <div className="space-y-3">
                <Label>Preferred Input Mode</Label>
                <p className="text-sm text-muted-foreground">Choose how you prefer to interact with the assistant</p>
                <InputModeSelector value={inputMode} onChange={setInputMode} className="w-full justify-center" />
              </div>

              {/* Save Button */}
              <Button onClick={handleSave} disabled={saving} className="w-full min-h-[48px]">
                {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : <><Save className="h-4 w-4 mr-2" />Save Changes</>}
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
};

export default Profile;
