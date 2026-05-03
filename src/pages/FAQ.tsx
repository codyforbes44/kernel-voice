import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ChevronRight } from 'lucide-react';
import { PageWrapper } from '@/components/layout/PageWrapper';

interface FaqItem {
  q: string;
  a: string;
}

interface FaqGroup {
  title: string;
  items: FaqItem[];
}

const groups: FaqGroup[] = [
  {
    title: 'Plans & billing',
    items: [
      {
        q: 'How does the Free plan work?',
        a: 'Free includes the ƷBI voice assistant, 7-day conversation history and 1 saved agent. No credit card required — sign up and start talking.',
      },
      {
        q: "What's the difference between Personal and Builder?",
        a: 'Personal ($9/mo) is for people who want premium voices, longer history and more saved agents for their own use. Builder ($29/mo) is for makers shipping AI in their product — embeddable widgets, knowledge base, API access and unlimited custom agents.',
      },
      {
        q: 'When should I pick Team?',
        a: 'Team ($99/mo) suits small companies needing 5 widgets, 5 seats, priority support, SSO-readiness and early access to new features.',
      },
      {
        q: 'Do you offer annual billing?',
        a: 'Yes. Switching to annual on the pricing page saves roughly two months versus paying monthly.',
      },
      {
        q: 'Can I change or cancel my plan anytime?',
        a: 'Yes. Manage everything from the customer portal — upgrade, downgrade, change card or cancel. Cancellations stay active until the end of the billing period.',
      },
      {
        q: 'Do you offer refunds?',
        a: 'If something is wrong within the first 14 days of a paid subscription, contact us and we will refund the most recent charge.',
      },
    ],
  },
  {
    title: 'Features & limits',
    items: [
      {
        q: 'Which voice providers can I use?',
        a: 'ƷBI ships with ElevenLabs, Gemini Live, OpenAI Realtime and VAPI. All four are available on every paid tier — no provider gating.',
      },
      {
        q: 'What counts as a widget message?',
        a: 'Each completed user-assistant exchange on an embedded widget counts as one message. Builder includes 10k/mo, Team includes 100k/mo.',
      },
      {
        q: 'How big is the knowledge base?',
        a: 'Builder supports 100 documents; Team supports 1,000. We chunk and embed each document for semantic search with keyword fallback.',
      },
      {
        q: 'Is there an API?',
        a: 'Yes — Builder and Team include API access for programmatic use of agents and the knowledge base.',
      },
    ],
  },
  {
    title: 'Privacy & data',
    items: [
      {
        q: 'Who can see my conversations?',
        a: 'Only you. Conversations are stored under your account with row-level security so no other user — or the public — can access them.',
      },
      {
        q: 'How long do you keep my data?',
        a: 'Active conversations stay until you delete them. Anonymous analytics and orphaned guest sessions are anonymized or removed after 90 days.',
      },
      {
        q: 'Can I export or delete my data?',
        a: 'Yes. Export is available from your profile and account deletion removes all associated data permanently.',
      },
    ],
  },
];

const FAQ = () => {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: groups.flatMap((g) =>
      g.items.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    ),
  };

  return (
    <PageWrapper
      title="ƷBI Voice — Pricing FAQ"
      description="Answers to common questions about ƷBI Voice plans, billing, features, limits, privacy and data."
      keywords={['ƷBI', 'pricing', 'FAQ', 'voice AI', 'subscription']}
      showFooter
    >
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>

      <main className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 max-w-3xl">
        <header className="text-center mb-10 sm:mb-14">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
            Pricing FAQ
          </p>
          <h1 className="text-3xl sm:text-5xl font-display font-bold tracking-tight mb-4">
            Everything you need to know
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Plans, limits, privacy and how to get the most out of ƷBI.
          </p>
        </header>

        <div className="space-y-10">
          {groups.map((group) => (
            <section key={group.title} aria-labelledby={`faq-${group.title}`}>
              <h2
                id={`faq-${group.title}`}
                className="text-sm uppercase tracking-wider text-muted-foreground mb-3"
              >
                {group.title}
              </h2>
              <Accordion type="multiple" className="rounded-xl border border-border bg-card">
                {group.items.map((item, idx) => (
                  <AccordionItem
                    key={item.q}
                    value={`${group.title}-${idx}`}
                    className="px-4 sm:px-5 last:border-b-0"
                  >
                    <AccordionTrigger className="text-left text-base sm:text-lg font-semibold tracking-tight">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          ))}
        </div>

        <div className="mt-12 sm:mt-16 rounded-2xl border border-border bg-card p-6 sm:p-8 text-center">
          <h2 className="text-xl sm:text-2xl font-display font-bold tracking-tight mb-2">
            Still have questions?
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-5">
            Compare plans side-by-side or jump straight in.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="min-h-[48px]">
              <Link to="/pricing">
                Compare all plans
                <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="min-h-[48px]">
              <Link to="/">Try ƷBI free</Link>
            </Button>
          </div>
        </div>
      </main>
    </PageWrapper>
  );
};

export default FAQ;
