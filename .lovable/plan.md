
# Homepage Refactor -- Best-in-Class Landing Experience

## Problems with Current Homepage

1. **Generic feature list** -- shows 6 vague cards (Voice Conversations, Text Chat, Document Analysis, Web Search, Lightning Fast, Secure & Private) that don't reflect actual built features
2. **Fake stats** -- "<1s Response Time", "24/7 Availability", "100% Private" are filler content with no substance
3. **No product preview** -- users land on a marketing page with zero visual representation of the actual product
4. **Missing key features** -- no mention of embeddable widgets, custom agents, multi-provider voice (ElevenLabs, Gemini, OpenAI, VAPI), voice conversation mode, knowledge base, showcase, or the widget builder
5. **Two CTAs to the same thing** -- "Start Talking" and "Sign Up Free" are redundant
6. **No social proof or differentiation** -- nothing that distinguishes this from any other AI chatbot

## New Homepage Structure

### Section 1: Hero (Immersive, Product-Led)
- Keep the animated particle background (it's good)
- Replace the giant "Voice" text with a more descriptive headline: **"Your AI, Your Voice"** with a subline about multi-provider real-time conversations
- Add a **live mini-orb animation** (reusing the orb concept from VoiceControlPanel) that pulses gently to give a sense of the product being alive
- Two CTAs: **"Try It Now"** (goes to /assistant, primary) and **"See It In Action"** (smooth-scrolls to demo section)
- Replace fake stats with **real differentiators**: "4 Voice Providers", "Embeddable Widgets", "Custom Agents"

### Section 2: Live Product Preview (NEW)
- A visual showcase section with a stylized screenshot/mockup of the voice interface in action
- Show the agent state orb in its different states (listening, speaking, thinking) as a small animated strip
- Brief copy: "Real-time voice conversations with an AI that listens, thinks, and speaks naturally"

### Section 3: Platform Capabilities (Replaces generic features)
Replace the 6 generic cards with **actual platform features**:

| Card | Icon | Title | Description |
|------|------|-------|-------------|
| 1 | Mic + waveform | Multi-Provider Voice | Choose from ElevenLabs, Gemini, OpenAI, or VAPI for the perfect voice experience |
| 2 | Bot | Custom AI Agents | Create, save, and switch between personalized AI assistants with unique personalities |
| 3 | Code/Widget | Embeddable Widgets | Deploy AI chat and voice widgets on any website with full visual customization |
| 4 | FileSearch | Knowledge Base | Upload documents and build a searchable knowledge base your AI can reference |
| 5 | Keyboard + Mic | Voice, Text, or Both | Seamlessly switch between voice, text, and combined input modes |
| 6 | Palette | Widget Studio | Customize colors, dark mode, header styles, bubble shapes, and brand identity |

### Section 4: How It Works (Simplified)
Keep the 3-step flow but update the copy:
1. **Choose Your Mode** -- Voice, text, or combined. Pick from 4 AI providers.
2. **Customize Your Agent** -- Set personality, voice, and system prompt. Save it for later.
3. **Talk or Embed** -- Use it directly or deploy as a widget on your website.

### Section 5: Showcase Teaser (NEW)
- A horizontal scrolling strip showing 4-5 mini preview cards from the /showcase page
- "Explore the Showcase" CTA linking to /showcase
- Gives visitors a taste of the interactive components

### Section 6: Pricing Teaser (NEW, replaces old CTA)
- Brief comparison: Free vs Pro
- Single CTA: "View Plans" linking to /pricing
- Replaces the generic "Ready to Experience the Future?" section

### Section 7: Footer (unchanged)

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/LandingPage.tsx` | Full rewrite of sections: new hero, product preview, real feature cards, showcase teaser, pricing teaser |
| `src/components/landing/AnimatedHeroBackground.tsx` | No changes needed (keep as-is) |
| `src/components/layout/Footer.tsx` | Add Showcase and Pricing links to nav |

## Technical Notes

- No new dependencies needed -- uses existing Framer Motion, Lucide icons, and scroll animation hooks
- The mini-orb in the hero section is a pure CSS animation (gradient background with pulse), not a full VoiceControlPanel import
- Showcase teaser cards are static previews (screenshots/styled divs), not the actual interactive components -- keeps the landing page lightweight
- All sections use existing `useScrollAnimation` and `useStaggeredAnimation` hooks for reveal effects
- Mobile-first responsive: cards stack vertically, showcase strip becomes a 2-column grid on mobile
