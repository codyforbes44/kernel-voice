import SEO from '@/components/SEO';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/landing/HeroSection';
import { ProductPreviewSection } from '@/components/landing/ProductPreviewSection';
import { PlatformCapabilitiesSection } from '@/components/landing/PlatformCapabilitiesSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { ShowcaseTeaserSection } from '@/components/landing/ShowcaseTeaserSection';
import { PricingTeaserSection } from '@/components/landing/PricingTeaserSection';

const LandingPage = () => {
  return (
    <>
      <SEO 
        title="ƷBI Voice - Your AI, Your Voice"
        description="Multi-provider real-time voice & text AI conversations. Build custom agents, embed widgets, and power your platform with ElevenLabs, Gemini, OpenAI, and VAPI."
        image="/og-home.png"
        keywords={["AI voice assistant", "voice AI", "real-time conversation", "embeddable widget", "custom AI agent", "ElevenLabs", "knowledge base"]}
      />
      
      <div className="min-h-screen bg-background">
        <Header />
        <HeroSection />
        <ProductPreviewSection />
        <PlatformCapabilitiesSection />
        <HowItWorksSection />
        <ShowcaseTeaserSection />
        <PricingTeaserSection />
        <Footer />
      </div>
    </>
  );
};

export default LandingPage;
