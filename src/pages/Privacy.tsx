import SEO from '@/components/SEO';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const Privacy = () => {
  return (
    <>
      <SEO 
        title="Privacy Policy - Kernel"
        description="Learn how Kernel protects your privacy and handles your data."
      />
      
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        
        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-3xl mx-auto prose dark:prose-invert">
            <h1>Privacy Policy</h1>
            <p className="lead text-muted-foreground">
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>

            <h2>1. Information We Collect</h2>
            <p>
              We collect information you provide directly to us, such as when you create an account, 
              use our voice assistant, or contact us for support.
            </p>
            <ul>
              <li><strong>Account Information:</strong> Email address and display name</li>
              <li><strong>Conversation Data:</strong> Voice and text conversations with the AI assistant</li>
              <li><strong>Documents:</strong> Files you upload for analysis</li>
              <li><strong>Usage Data:</strong> How you interact with our services</li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide, maintain, and improve our services</li>
              <li>Process and store your conversations</li>
              <li>Respond to your requests and support needs</li>
              <li>Protect against fraud and abuse</li>
            </ul>

            <h2>3. Data Security</h2>
            <p>
              We implement appropriate security measures to protect your personal information. 
              Your data is encrypted in transit and at rest. We use industry-standard security 
              practices to safeguard your information.
            </p>

            <h2>4. Data Retention</h2>
            <p>
              We retain your information for as long as your account is active or as needed to 
              provide you services. You can delete your account and associated data at any time 
              through your profile settings.
            </p>

            <h2>5. Third-Party Services</h2>
            <p>
              We use trusted third-party services to help deliver our product, including:
            </p>
            <ul>
              <li>Authentication providers (Google, GitHub)</li>
              <li>AI model providers for voice and text processing</li>
              <li>Cloud infrastructure for data storage</li>
            </ul>

            <h2>6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your account and data</li>
              <li>Export your data</li>
            </ul>

            <h2>7. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us through 
              the application.
            </p>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Privacy;
