import { lazy, Suspense } from 'react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { HeroSection } from '@/components/landing/HeroSection';
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
      description="A real-time AI voice assistant you can use today and embed in your product tomorrow. Multi-engine voice, custom agents, knowledge base, and embeddable widgets."
      image="/og-home.png"
      keywords={[
        'AI voice assistant',
        'real-time voice AI',
        'voice AI platform',
        'embeddable AI widget',
        'custom AI agents',
        'multi-engine voice',
        'conversational AI',
      ]}
      showFooter
    >
      <main id="main-content">
        {/* Page-specific skip link: jump straight to the interactive demo. */}
        <a href="#product-preview" className="skip-to-content">
          Skip to interactive demo
        </a>
        <HeroSection />
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
