import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Share2, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SEO from '@/components/SEO';

const Install = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Listen for beforeinstallprompt event (Android/Desktop)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    
    setDeferredPrompt(null);
  };

  return (
    <>
      <SEO 
        title="Install App"
        description="Install the AI Voice Assistant as a native app on your device. Works offline with faster performance, native notifications, and seamless experience across all platforms."
        image="/og-install.png"
        keywords={["install PWA", "voice assistant app", "offline AI", "progressive web app", "native app experience"]}
      />
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg border-border/50 bg-card/50 backdrop-blur-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center glow-primary">
            <Download className="w-10 h-10 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-3xl font-display mb-2">
              Install Voice AI
            </CardTitle>
            <CardDescription className="text-base">
              Get the full app experience with offline support
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {isInstalled ? (
            <div className="text-center space-y-4 py-6">
              <CheckCircle2 className="w-16 h-16 text-primary mx-auto" />
              <div>
                <h3 className="text-xl font-semibold mb-2">Already Installed!</h3>
                <p className="text-muted-foreground mb-6">
                  The app is installed and ready to use
                </p>
                <Button 
                  onClick={() => navigate('/assistant')}
                  className="w-full"
                  size="lg"
                >
                  Open Voice Assistant
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Android/Desktop Install */}
              {deferredPrompt && !isIOS && (
                <div className="space-y-4">
                  <Button 
                    onClick={handleInstall}
                    className="w-full"
                    size="lg"
                  >
                    <Download className="mr-2 h-5 w-5" />
                    Install Now
                  </Button>
                </div>
              )}

              {/* iOS Install Instructions */}
              {isIOS && (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Smartphone className="w-5 h-5 text-primary" />
                      iOS Installation Steps
                    </h3>
                    <ol className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex gap-2">
                        <span className="font-semibold text-foreground">1.</span>
                        <span>Tap the <Share2 className="inline w-4 h-4" /> Share button in Safari</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="font-semibold text-foreground">2.</span>
                        <span>Scroll down and tap "Add to Home Screen"</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="font-semibold text-foreground">3.</span>
                        <span>Tap "Add" to install the app</span>
                      </li>
                    </ol>
                  </div>
                </div>
              )}

              {/* Generic message if prompt not available */}
              {!deferredPrompt && !isIOS && (
                <div className="text-center text-muted-foreground p-4">
                  <p className="mb-4">
                    To install this app, look for the install option in your browser menu
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/')}
                  >
                    Go to Home
                  </Button>
                </div>
              )}

              {/* Benefits */}
              <div className="pt-4 border-t border-border/50">
                <h4 className="font-semibold mb-3 text-sm text-muted-foreground">
                  Why Install?
                </h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Works offline with cached conversations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Native app experience on your device</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Faster loading and better performance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Quick access from home screen</span>
                  </li>
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      </div>
    </>
  );
};

export default Install;
