import { lazy, Suspense } from 'react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { HeroSection } from '@/components/landing/HeroSection';
import { SocialProofStrip } from '@/components/landing/SocialProofStrip';
import { ProductPreviewSection } from '@/components/landing/ProductPreviewSection';

const TwoTracksSection = lazy(() =>
  import('@/components/landing/TwoTracksSection').then((m) => ({ default: m.TwoTracksSection }))
);
const PlatformCapabilitiesSection = lazy(() =>
  import('@/components/landing/PlatformCapabilitiesSection').then((m) => ({
    default: m.PlatformCapabilitiesSection,
  }))
);
const HowItWorksSection = lazy(() =>
  import('@/components/landing/HowItWorksSection').then((m) => ({ default: m.HowItWorksSection }))
);
const PricingTeaserSection = lazy(() =>
  import('@/components/landing/PricingTeaserSection').then((m) => ({ default: m.PricingTeaserSection }))
);
const FAQTeaserSection = lazy(() =>
  import('@/components/landing/FAQTeaserSection').then((m) => ({ default: m.FAQTeaserSection }))
);
const FinalCTASection = lazy(() =>
  import('@/components/landing/FinalCTASection').then((m) => ({ default: m.FinalCTASection }))
);

const LandingPage = () => {
  return (
    <PageWrapper
      title="ƷBI — Talk to AI. Or build with it."
      description="A real-time AI voice assistant you can use today and embed in your product tomorrow. Choose from ElevenLabs, Gemini Live, OpenAI Realtime and VAPI."
      image="/og-home.png"
      keywords={[
        'AI voice assistant',
        'voice AI platform',
        'embeddable AI widget',
        'custom AI agents',
        'ElevenLabs',
        'Gemini Live',
        'OpenAI Realtime',
        'VAPI',
      ]}
      showFooter
    >
      <main id="main-content">
        <HeroSection />
        <SocialProofStrip />
        <ProductPreviewSection />
        <Suspense fallback={null}>
          <TwoTracksSection />
          <PlatformCapabilitiesSection />
          <HowItWorksSection />
          <PricingTeaserSection />
          <FAQTeaserSection />
          <FinalCTASection />
        </Suspense>
      </main>
    </PageWrapper>
  );
};

export default LandingPage;
