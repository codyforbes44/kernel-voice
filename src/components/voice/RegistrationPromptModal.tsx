import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Save, Shield, History, Sparkles } from 'lucide-react';
import { useState } from 'react';

interface RegistrationPromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DISMISS_KEY = 'zbi_registration_prompt_dismissed';

const RegistrationPromptModal = ({ open, onOpenChange }: RegistrationPromptModalProps) => {
  const navigate = useNavigate();
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // If dismissed in session, don't show
  const isDismissed = sessionStorage.getItem(DISMISS_KEY) === 'true';
  const effectiveOpen = open && !isDismissed;

  const handleCreateAccount = () => {
    navigate('/auth');
  };

  const handleContinueAsGuest = () => {
    if (dontShowAgain) {
      sessionStorage.setItem(DISMISS_KEY, 'true');
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={effectiveOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            You're Having a Great Conversation
          </DialogTitle>
          <DialogDescription className="text-base">
            Create an account to save this session and unlock the full experience.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Save className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Save Conversation History</p>
                <p className="text-sm text-muted-foreground">Access your conversations anytime, anywhere</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MessageSquare className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Upload & Analyze Documents</p>
                <p className="text-sm text-muted-foreground">Store files and query them with AI</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <History className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Resume Conversations</p>
                <p className="text-sm text-muted-foreground">Pick up right where you left off</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Advanced Features</p>
                <p className="text-sm text-muted-foreground">Unlock full ƷBI capabilities</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Privacy First</p>
                <p className="text-sm text-muted-foreground">Your data is encrypted and secure</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={handleCreateAccount}
            className="w-full h-12 text-base font-semibold"
          >
            Create Account
          </Button>
          <Button 
            onClick={handleContinueAsGuest}
            variant="outline"
            className="w-full h-12"
          >
            Continue as Guest
          </Button>
          <label className="flex items-center gap-2 cursor-pointer justify-center text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="rounded border-muted-foreground/40"
            />
            Don't show this again
          </label>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RegistrationPromptModal;
