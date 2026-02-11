import { PageWrapper } from '@/components/layout/PageWrapper';
import { YouTubePlayerCard } from '@/components/showcase/YouTubePlayerCard';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function YouTubePlayer() {
  const navigate = useNavigate();

  return (
    <PageWrapper
      title="YouTube Player - ƷBI Voice"
      description="High-fidelity YouTube player with custom transport controls"
      className="dark"
    >
      <div className="container max-w-3xl mx-auto px-4 py-10">
        <Button
          variant="ghost"
          size="sm"
          className="mb-6 text-muted-foreground"
          onClick={() => navigate('/showcase')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Showcase
        </Button>

        <YouTubePlayerCard />
      </div>
    </PageWrapper>
  );
}
