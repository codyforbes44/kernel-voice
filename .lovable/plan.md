
# Embeddable AI Widget Plan

## Overview

Create a portable, brandable AI chat widget that external websites can embed via a simple script tag. The widget will provide text-based AI conversations with optional voice capabilities, full theming support, and analytics tracking.

---

## Current Architecture Analysis

### Existing Components (Reusable)
- `TextMessageInput.tsx` - Text input with submit handling
- `LiveTranscripts.tsx` - Message display component
- `voiceClientTools.ts` - API integration for chat/search/kb

### Backend Infrastructure (Ready)
- `chat` edge function - Handles AI conversations
- `search` edge function - Web search capability
- `kb-search` edge function - Knowledge base queries
- CORS headers already configured for `*` origin

### Key Considerations
- Widget must be self-contained (no React Router dependency)
- Must support custom theming (colors, fonts, branding)
- Should work without authentication for lead generation
- Needs to track widget usage for analytics

---

## Solution Architecture

### Delivery Methods

| Method | Use Case | Complexity |
|--------|----------|------------|
| **Script Embed** | Simple drop-in for any website | Low |
| **React Component** | For React-based external apps | Medium |
| **Iframe Embed** | Maximum isolation | Low |

We will implement the **Script Embed** approach as the primary method, with an iframe fallback for maximum compatibility.

---

## Implementation Details

### Phase 1: Widget Core Components

**1.1 New Files**

| File | Purpose |
|------|---------|
| `src/embed/KernelWidget.tsx` | Main widget component |
| `src/embed/WidgetChat.tsx` | Chat interface (stripped-down LiveTranscripts) |
| `src/embed/WidgetInput.tsx` | Message input component |
| `src/embed/WidgetHeader.tsx` | Collapsible header with branding |
| `src/embed/WidgetButton.tsx` | Floating trigger button |
| `src/embed/WidgetTheme.tsx` | Theme configuration provider |
| `src/embed/types.ts` | Widget configuration types |
| `src/embed/index.tsx` | Entry point for widget bundle |
| `public/widget.html` | Iframe embed page |

**1.2 Widget Configuration Interface**

```typescript
interface KernelWidgetConfig {
  // Required
  apiKey: string;           // Widget API key for tracking
  
  // Branding
  brandName?: string;       // "Acme Corp" - shown in header
  brandLogo?: string;       // URL to logo image
  brandColor?: string;      // Primary color (hex)
  accentColor?: string;     // Secondary color (hex)
  
  // Behavior
  position?: 'bottom-right' | 'bottom-left';
  greeting?: string;        // Initial greeting message
  placeholder?: string;     // Input placeholder text
  systemPrompt?: string;    // Custom AI personality
  
  // Features
  enableVoice?: boolean;    // Enable voice input (default: false)
  enableKB?: boolean;       // Enable knowledge base (default: false)
  kbDocumentIds?: string[]; // Specific KB docs to include
  
  // Analytics
  onConversationStart?: () => void;
  onMessageSent?: (message: string) => void;
  onError?: (error: Error) => void;
}
```

### Phase 2: Embed Script Generation

**2.1 Script Loader**

The embed script will be a minimal loader that:
1. Creates an iframe pointing to `/widget.html`
2. Passes configuration via postMessage
3. Handles communication between parent page and widget

**2.2 Usage Example**

```html
<!-- Drop-in embed code -->
<script>
  window.KernelConfig = {
    apiKey: 'wk_abc123',
    brandName: 'Acme Support',
    brandColor: '#00CED1',
    greeting: 'Hi! How can I help you today?',
    position: 'bottom-right'
  };
</script>
<script src="https://kernel-voice.lovable.app/embed.js" async></script>
```

### Phase 3: Widget API Key System

**3.1 Database Schema**

```sql
CREATE TABLE widget_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  api_key text UNIQUE NOT NULL,
  name text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}',
  allowed_domains text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE widget_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id uuid REFERENCES widget_configs(id) NOT NULL,
  event_type text NOT NULL, -- 'open', 'message', 'close', 'error'
  event_data jsonb DEFAULT '{}',
  referrer_domain text,
  created_at timestamptz DEFAULT now()
);

-- RLS policies
ALTER TABLE widget_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their widgets"
  ON widget_configs FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Users can view their widget analytics"
  ON widget_analytics FOR SELECT
  USING (widget_id IN (SELECT id FROM widget_configs WHERE user_id = auth.uid()));
```

**3.2 Edge Function: widget-chat**

New edge function specifically for widget requests:
- Validates widget API key
- Checks domain allowlist
- Applies widget-specific system prompt
- Logs analytics events
- Rate limiting per widget

### Phase 4: Widget UI Components

**4.1 Widget Structure**

```
┌─────────────────────────────────────┐
│ [Logo] Acme Support            [X] │  <- WidgetHeader
├─────────────────────────────────────┤
│                                     │
│   Hi! How can I help you today?     │
│                              [Bot]  │
│                                     │
│                    [User] Hi there  │
│                                     │
│   I'd be happy to help...     [Bot] │
│                                     │
├─────────────────────────────────────┤
│ [🎤] Type your message...    [Send] │  <- WidgetInput
└─────────────────────────────────────┘
        ↑
   WidgetChat
```

**4.2 Floating Button**

```
                    ┌──────────────────┐
                    │  💬  Chat with   │
                    │      Acme        │
                    └──────────────────┘
                           OR
                    ┌─────────┐
                    │   💬    │  <- Collapsed
                    └─────────┘
```

### Phase 5: Admin Widget Management

**5.1 New Admin Page: `/admin/widgets`**

- Create/edit widget configurations
- Generate embed code
- View analytics per widget
- Domain allowlist management
- Toggle widget active/inactive

**5.2 Widget Creation Flow**

1. Admin enters widget name and selects features
2. System generates unique API key (`wk_` prefix)
3. Admin customizes branding (colors, logo, greeting)
4. System generates embed code snippet
5. Admin copies snippet to their website

### Phase 6: Build Configuration

**6.1 Separate Vite Build for Widget**

Create a separate Vite entry point for the widget bundle:

```typescript
// vite.widget.config.ts
export default defineConfig({
  build: {
    lib: {
      entry: 'src/embed/index.tsx',
      name: 'KernelWidget',
      fileName: 'embed',
      formats: ['iife']
    },
    outDir: 'public',
    emptyOutDir: false,
  }
});
```

This produces:
- `public/embed.js` - The widget script
- `public/widget.html` - The iframe page

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/embed/KernelWidget.tsx` | Main widget component with state management |
| `src/embed/WidgetChat.tsx` | Message display area |
| `src/embed/WidgetInput.tsx` | Text/voice input |
| `src/embed/WidgetHeader.tsx` | Branding header |
| `src/embed/WidgetButton.tsx` | Floating trigger |
| `src/embed/WidgetTheme.tsx` | CSS variable injection |
| `src/embed/types.ts` | Configuration types |
| `src/embed/api.ts` | Widget-specific API calls |
| `src/embed/index.tsx` | Widget bundle entry |
| `public/widget.html` | Iframe host page |
| `supabase/functions/widget-chat/index.ts` | Widget API endpoint |
| `src/pages/admin/Widgets.tsx` | Admin widget management |
| `src/components/admin/WidgetEditor.tsx` | Widget configuration form |
| `src/components/admin/WidgetCodeSnippet.tsx` | Embed code generator |
| `src/components/admin/WidgetAnalytics.tsx` | Usage analytics display |
| `vite.widget.config.ts` | Widget build configuration |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add `/admin/widgets` route |
| `src/components/admin/AdminSidebar.tsx` | Add Widgets nav item |
| `package.json` | Add widget build script |
| `supabase/config.toml` | Add widget-chat function |

---

## Technical Considerations

### Security
- Widget API keys are non-reversible hashes
- Domain allowlist prevents unauthorized embedding
- Rate limiting prevents abuse
- No sensitive data exposed to widget

### Performance
- Widget bundle target: < 50KB gzipped
- Lazy load voice features only if enabled
- Use CSS-in-JS for theming (no external stylesheets)
- Minimal dependencies (no React Router, minimal UI lib)

### Compatibility
- Works on all modern browsers (ES2015+)
- Mobile-responsive design
- Respects `prefers-color-scheme` for auto dark mode
- Accessible (ARIA labels, keyboard navigation)

### Theming System

CSS variables injected at runtime:
```css
:root {
  --kernel-primary: var(--brand-color, #00CED1);
  --kernel-accent: var(--accent-color, #00B4D8);
  --kernel-bg: var(--bg-color, #ffffff);
  --kernel-text: var(--text-color, #1a1a1a);
  --kernel-radius: 12px;
}
```

---

## Implementation Priority

1. **Core Widget** - KernelWidget, WidgetChat, WidgetInput, WidgetButton
2. **Backend** - widget-chat edge function, database tables
3. **Admin UI** - Widget management page
4. **Build System** - Separate Vite config for widget bundle
5. **Analytics** - Event tracking and dashboard
6. **Voice Support** - Optional voice input integration

---

## Expected Outcomes

After implementation:
- External websites can embed Kernel AI chat with a single script tag
- Full branding customization (colors, logo, messaging)
- Analytics tracking for widget usage
- Secure API key system with domain restrictions
- Admin dashboard for managing multiple widget deployments
- Optional voice input for enhanced UX
- Knowledge base integration for product-specific AI responses
