

# Plan: Rename "Kernel" to "ƷBI Voice"

## Overview

Global rename of the brand name "Kernel" to "ƷBI Voice" across all user-facing text, metadata, SEO tags, PWA manifest, system prompts, edge functions, and widget embed code. Internal CSS variable names (e.g. `--kernel-primary`) and TypeScript interface names (e.g. `KernelWidgetConfig`) will be kept as-is to avoid breaking changes.

## Naming Conventions

| Current | New |
|---------|-----|
| Kernel | ƷBI Voice |
| Kernel Pro | ƷBI Voice Pro |
| Kernel Voice | ƷBI Voice |

## Files to Modify

### Core App Config
| File | Changes |
|------|---------|
| `index.html` | Title, meta tags, og:title, twitter:title, apple-mobile-web-app-title |
| `vite.config.ts` | PWA manifest `name` and `short_name` |
| `public/sitemap.xml` | Image titles |
| `public/widget.html` | Page title |

### SEO and Metadata
| File | Changes |
|------|---------|
| `src/components/SEO.tsx` | Default title, og:site_name, JSON-LD structured data |

### Layout Components
| File | Changes |
|------|---------|
| `src/components/layout/Header.tsx` | Logo alt text, brand label |
| `src/components/layout/Footer.tsx` | Logo alt text, brand label, description |
| `src/components/layout/LoadingScreen.tsx` | Logo alt text |

### Pages
| File | Changes |
|------|---------|
| `src/pages/LandingPage.tsx` | SEO title, hero heading, logo alt |
| `src/pages/Auth.tsx` | SEO title/desc, card title |
| `src/pages/Install.tsx` | SEO title/desc, card title |
| `src/pages/Pricing.tsx` | SEO title/desc, badges, plan names |
| `src/pages/Privacy.tsx` | SEO title/desc |
| `src/pages/Terms.tsx` | SEO title/desc, body text references |
| `src/pages/SubscriptionSuccess.tsx` | SEO title, card title |

### Voice Components
| File | Changes |
|------|---------|
| `src/components/voice/VoiceInterfaceCard.tsx` | Heading text |
| `src/components/voice/SystemPromptEditor.tsx` | Default system prompt |
| `src/components/voice/AgentPersonalitySelector.tsx` | All personality preset prompts and first messages |
| `src/components/voice/VoiceProviderSelector.tsx` | "Kernel Pro" label |
| `src/components/voice/RegistrationPromptModal.tsx` | "Kernel" references |

### Subscription Components
| File | Changes |
|------|---------|
| `src/components/subscription/UpgradeBanner.tsx` | "Kernel Pro" text |

### Wake Word Detection
| File | Changes |
|------|---------|
| `src/hooks/useWakeWordDetection.ts` | Wake words from "hey kernel" to "hey 3bi" |

### Edge Functions
| File | Changes |
|------|---------|
| `supabase/functions/chat/index.ts` | System prompt "You are Kernel" |
| `supabase/functions/vapi-session/index.ts` | Error message "Kernel Pro" |
| `supabase/functions/brand-og-image/index.ts` | "Kernel Voice" text |
| `supabase/functions/admin-operations/index.ts` | Redirect URL (unchanged, it's a domain) |

### Widget Embed (user-facing text only)
| File | Changes |
|------|---------|
| `src/components/admin/widgets/WidgetCodeSnippet.tsx` | HTML comment labels |

### Stripe Config (display names only)
| File | Changes |
|------|---------|
| `src/lib/stripe.ts` | Comment text only; variable names `KERNEL_PRO_*` kept for stability |

## What Will NOT Change

- **CSS variables**: `--kernel-primary`, `--kernel-radius`, etc. (internal, not user-facing)
- **TypeScript interfaces**: `KernelWidgetConfig`, `KernelWidgetProps`, `KernelWidget` component name
- **File names**: `KernelWidget.tsx` stays as-is
- **Published domain**: `kernel-voice.lovable.app` (cannot be changed here)
- **Window globals**: `window.KernelConfig`, `window.KernelWidget` (embed API contract)
- **Stripe product IDs**: `KERNEL_PRO_MONTHLY` variable names (code-internal)

## Estimated Scope

Approximately 28 files will be modified with straightforward text replacements. No logic changes, no new dependencies, no database changes.
