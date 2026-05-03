import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { OAuthButtons } from '@/components/auth/OAuthButtons';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';

const REMEMBERED_EMAIL_KEY = 'remembered_email';

function getPasswordStrength(password: string): { score: number; label: string } {
  let score = 0;
  if (password.length >= 6) score += 20;
  if (password.length >= 8) score += 20;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 20;
  if (/\d/.test(password)) score += 20;
  if (/[^a-zA-Z0-9]/.test(password)) score += 20;
  if (score <= 20) return { score, label: 'Weak' };
  if (score <= 40) return { score, label: 'Fair' };
  if (score <= 60) return { score, label: 'Good' };
  if (score <= 80) return { score, label: 'Strong' };
  return { score, label: 'Very Strong' };
}

interface PasswordInputProps {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  showStrength?: boolean;
  isLoading: boolean;
  showPassword: boolean;
  onToggleShow: () => void;
  strength?: { score: number; label: string };
}

const PasswordInput = ({
  id, value, onChange, placeholder = "••••••••", autoComplete = "current-password",
  showStrength = false, isLoading, showPassword, onToggleShow, strength,
}: PasswordInputProps) => (
  <div className="space-y-2">
    <div className="relative">
      <Input
        id={id}
        type={showPassword ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required disabled={isLoading} minLength={6}
        autoComplete={autoComplete}
        className="min-h-[44px] pr-10"
      />
      <button
        type="button"
        onClick={onToggleShow}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
        aria-label={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
    {showStrength && strength && value.length > 0 && (
      <div className="space-y-1">
        <Progress value={strength.score} className="h-1.5" />
        <p className="text-xs text-muted-foreground">
          Strength: <span className={strength.score >= 60 ? 'text-green-600 dark:text-green-400' : strength.score >= 40 ? 'text-yellow-600 dark:text-yellow-400' : 'text-destructive'}>{strength.label}</span>
        </p>
      </div>
    )}
  </div>
);

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showUpdatePassword, setShowUpdatePassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const rememberedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY);
    if (rememberedEmail) { setEmail(rememberedEmail); setRememberMe(true); }
    
    // Redirect if already authenticated
    if (isAuthenticated && !showUpdatePassword) navigate(redirectTo);
    
    // Listen for PASSWORD_RECOVERY event only
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') { setShowUpdatePassword(true); setShowResetPassword(false); }
    });
    // Auto-focus email
    setTimeout(() => emailRef.current?.focus(), 100);
    return () => subscription.unsubscribe();
  }, [navigate, showUpdatePassword, isAuthenticated, redirectTo]);

  const handleRememberMe = (checked: boolean) => {
    setRememberMe(checked);
    if (checked && email) localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
    else localStorage.removeItem(REMEMBERED_EMAIL_KEY);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' }); return; }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: `${window.location.origin}/`, data: { display_name: displayName || email.split('@')[0] } },
      });
      if (error) throw error;
      toast({ title: 'Check your email', description: 'We sent you a verification link. Please verify your email before signing in.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to create account', variant: 'destructive' });
    } finally { setIsLoading(false); }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (rememberMe) localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
      else localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      toast({ title: 'Welcome back!', description: 'You have successfully signed in.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to sign in', variant: 'destructive' });
    } finally { setIsLoading(false); }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' }); return; }
    if (password.length < 6) { toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' }); return; }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: 'Password updated!', description: 'Your password has been successfully updated.' });
      setShowUpdatePassword(false); setPassword(''); setConfirmPassword('');
      navigate('/');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to update password', variant: 'destructive' });
    } finally { setIsLoading(false); }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast({ title: 'Error', description: 'Please enter your email address', variant: 'destructive' }); return; }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth` });
      if (error) throw error;
      toast({ title: 'Check your email', description: 'We sent you a password reset link.' });
      setShowResetPassword(false);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to send reset email', variant: 'destructive' });
    } finally { setIsLoading(false); }
  };

  const passwordStrength = getPasswordStrength(password);

  const PasswordInput = ({ id, value, onChange, placeholder = "••••••••", autoComplete = "current-password", showStrength = false }: {
    id: string; value: string; onChange: (v: string) => void; placeholder?: string; autoComplete?: string; showStrength?: boolean;
  }) => (
    <div className="space-y-2">
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required disabled={isLoading} minLength={6}
          autoComplete={autoComplete}
          className="min-h-[44px] pr-10"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {showStrength && value.length > 0 && (
        <div className="space-y-1">
          <Progress value={passwordStrength.score} className="h-1.5" />
          <p className="text-xs text-muted-foreground">
            Strength: <span className={passwordStrength.score >= 60 ? 'text-green-600 dark:text-green-400' : passwordStrength.score >= 40 ? 'text-yellow-600 dark:text-yellow-400' : 'text-destructive'}>{passwordStrength.label}</span>
          </p>
        </div>
      )}
    </div>
  );

  return (
    <PageWrapper
      title="Sign In - ƷBI"
      description="Sign in or create an account to access ƷBI."
      image="/og-auth.png"
      noIndex
      showFooter
    >
      <main id="main-content" className="flex-1 flex items-center justify-center py-6 md:py-16 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">ƷBI</CardTitle>
            <CardDescription>
              {showUpdatePassword ? 'Enter your new password'
                : showResetPassword ? 'Enter your email to reset your password'
                : 'Sign in or create an account to get started'}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            {showUpdatePassword ? (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <PasswordInput id="new-password" value={password} onChange={setPassword} autoComplete="new-password" showStrength />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <PasswordInput id="confirm-password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />
                </div>
                <Button type="submit" className="w-full min-h-[44px]" disabled={isLoading}>
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating...</> : 'Update Password'}
                </Button>
              </form>
            ) : showResetPassword ? (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input id="reset-email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} autoComplete="email" className="min-h-[44px]" />
                </div>
                <Button type="submit" className="w-full min-h-[44px]" disabled={isLoading}>
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</> : 'Send Reset Link'}
                </Button>
                <Button type="button" variant="ghost" className="w-full min-h-[44px]" onClick={() => setShowResetPassword(false)}>Back to Sign In</Button>
              </form>
            ) : (
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="signin" className="space-y-4">
                  <OAuthButtons />
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input ref={emailRef} id="signin-email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} autoComplete="email" className="min-h-[44px]" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Password</Label>
                      <PasswordInput id="signin-password" value={password} onChange={setPassword} />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2">
                      <div className="flex items-center space-x-2 min-h-[44px]">
                        <Checkbox id="remember-me" checked={rememberMe} onCheckedChange={(checked) => handleRememberMe(checked === true)} className="h-5 w-5" />
                        <Label htmlFor="remember-me" className="text-sm font-normal cursor-pointer">Remember me</Label>
                      </div>
                      <Button type="button" variant="link" className="h-auto p-0 text-sm justify-start sm:justify-end min-h-[44px] sm:min-h-0" onClick={() => setShowResetPassword(true)}>Forgot password?</Button>
                    </div>
                    <Button type="submit" className="w-full min-h-[44px]" disabled={isLoading}>
                      {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</> : 'Sign In'}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup" className="space-y-4">
                  <OAuthButtons />
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-displayname">Display Name (Optional)</Label>
                      <Input id="signup-displayname" type="text" placeholder="Your Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} disabled={isLoading} autoComplete="name" className="min-h-[44px]" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input id="signup-email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} autoComplete="email" className="min-h-[44px]" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <PasswordInput id="signup-password" value={password} onChange={setPassword} autoComplete="new-password" showStrength />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                      <PasswordInput id="signup-confirm-password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />
                    </div>
                    <Button type="submit" className="w-full min-h-[44px]" disabled={isLoading}>
                      {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account...</> : 'Create Account'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </main>
    </PageWrapper>
  );
};

export default Auth;
