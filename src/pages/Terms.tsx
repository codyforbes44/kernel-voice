import { PageWrapper } from '@/components/layout/PageWrapper';

const Terms = () => {
  return (
    <PageWrapper
      title="Terms of Service - ƷBI Voice"
      description="Read ƷBI Voice's terms of service and usage guidelines."
      showFooter
    >
      <main id="main-content" className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-3xl mx-auto prose dark:prose-invert">
          <h1>Terms of Service</h1>
          <p className="lead text-muted-foreground">
            Last updated: February 23, 2026
          </p>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using ƷBI Voice, you agree to be bound by these Terms of Service. 
            If you do not agree to these terms, please do not use our services.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            ƷBI Voice is an AI-powered voice and text assistant that provides:
          </p>
          <ul>
            <li>Real-time voice conversations</li>
            <li>Text-based chat interactions</li>
            <li>Document analysis and search</li>
            <li>Web search integration</li>
          </ul>

          <h2>3. User Accounts</h2>
          <p>
            To use certain features, you must create an account. You are responsible for:
          </p>
          <ul>
            <li>Maintaining the confidentiality of your account</li>
            <li>All activities that occur under your account</li>
            <li>Notifying us of any unauthorized use</li>
          </ul>

          <h2>4. Acceptable Use</h2>
          <p>You agree not to use ƷBI Voice to:</p>
          <ul>
            <li>Violate any applicable laws or regulations</li>
            <li>Infringe on intellectual property rights</li>
            <li>Transmit harmful or malicious content</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Harass, abuse, or harm others</li>
          </ul>

          <h2>5. Content and Data</h2>
          <p>
            You retain ownership of content you create or upload. By using our service, 
            you grant us a license to process your content to provide the service.
          </p>

          <h2>6. AI-Generated Content</h2>
          <p>
            AI responses are generated automatically and may not always be accurate. 
            You should verify important information independently. We are not responsible 
            for decisions made based on AI-generated content.
          </p>

          <h2>7. Service Availability</h2>
          <p>
            We strive to maintain high availability but do not guarantee uninterrupted 
            service. We may modify, suspend, or discontinue features at any time.
          </p>

          <h2>8. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, ƷBI Voice shall not be liable for any 
            indirect, incidental, special, consequential, or punitive damages arising 
            from your use of the service.
          </p>

          <h2>9. Changes to Terms</h2>
          <p>
            We may update these terms from time to time. Continued use of the service 
            after changes constitutes acceptance of the new terms.
          </p>

          <h2>10. Contact</h2>
          <p>
            For questions about these Terms of Service, please contact us through 
            the application.
          </p>
        </div>
      </main>
    </PageWrapper>
  );
};

export default Terms;
