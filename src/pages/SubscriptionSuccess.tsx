import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Sparkles, ArrowRight } from 'lucide-react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSubscription } from '@/hooks/useSubscription';
import SEO from '@/components/SEO';

export default function SubscriptionSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refetch } = useSubscription();

  useEffect(() => {
    // Refresh subscription status when landing on success page
    refetch();
  }, [refetch]);

  const sessionId = searchParams.get('session_id');

  return (
    <PageWrapper>
      <SEO 
        title="Welcome to Kernel Pro!" 
        description="Your subscription is now active. Enjoy premium voice features."
      />
      
      <div className="container max-w-2xl mx-auto px-4 py-16">
        <Card className="text-center">
          <CardHeader className="pb-4">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Welcome to Kernel Pro!</CardTitle>
            <CardDescription className="text-lg">
              Your subscription is now active
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-6">
              <h3 className="font-semibold mb-4 flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                What's Unlocked
              </h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>✓ Premium ElevenLabs voices</li>
                <li>✓ Advanced voice customization</li>
                <li>✓ Priority response quality</li>
                <li>✓ Extended conversation history</li>
                <li>✓ Priority support</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => navigate('/assistant')} className="gap-2">
                Try Premium Voices
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => navigate('/profile')}>
                View Your Profile
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              A confirmation email has been sent to your registered email address.
            </p>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
