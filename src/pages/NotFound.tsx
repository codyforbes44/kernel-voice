import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Mic, HelpCircle } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const suggestions = [
    { path: '/assistant', label: 'Voice Assistant', icon: Mic },
    { path: '/', label: 'Home', icon: Home },
    { path: '/pricing', label: 'Pricing', icon: HelpCircle },
  ];

  return (
    <PageWrapper
      title="Page Not Found - 404"
      description="The page you're looking for doesn't exist."
      noIndex
      showFooter
    >
      <main id="main-content" className="flex-1 flex items-center justify-center py-16 px-4">
        <div className="text-center space-y-8 max-w-md">
          <div className="space-y-3">
            <h1 className="text-8xl font-bold text-gradient">404</h1>
            <h2 className="text-2xl font-semibold">Page Not Found</h2>
            <p className="text-muted-foreground">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>
          
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate(-1)} variant="outline" className="min-h-[44px]">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
            <Button onClick={() => navigate('/')} className="min-h-[44px]">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground mb-3">Or try one of these:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestions.map(({ path, label, icon: Icon }) => (
                <Button key={path} variant="ghost" size="sm" onClick={() => navigate(path)} className="gap-2 min-h-[44px]">
                  <Icon className="h-4 w-4" />
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </PageWrapper>
  );
};

export default NotFound;
