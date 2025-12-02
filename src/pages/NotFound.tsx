import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import SEO from "@/components/SEO";
import { Header } from "@/components/layout/Header";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <>
      <SEO 
        title="Page Not Found - 404"
        description="The page you're looking for doesn't exist."
        noIndex={true}
      />
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-16 px-4">
          <div className="text-center space-y-6 max-w-md">
            <div className="space-y-2">
              <h1 className="text-8xl font-bold text-gradient">404</h1>
              <h2 className="text-2xl font-semibold">Page Not Found</h2>
              <p className="text-muted-foreground">
                The page you're looking for doesn't exist or has been moved.
              </p>
            </div>
            
            <div className="flex gap-4 justify-center">
              <Button onClick={() => navigate(-1)} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
              <Button onClick={() => navigate('/')}>
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFound;
