

# Fix Widget for External Website Deployment

## Problem

The embeddable widget cannot work on any external website due to 4 critical issues:
1. No `embed.js` build artifact exists -- embed snippets reference a file that was never created
2. `api.ts` uses `import.meta.env` variables that are undefined outside the Vite dev server
3. `widget.html` iframe references raw `.tsx` source files
4. No standalone build pipeline produces a distributable widget bundle

The backend edge functions (`widget-chat`, `widget-tts`) are correctly configured with CORS and will work once the frontend is fixed.

## Solution

Create a standalone widget build that produces a single `embed.js` file. Hardcode the backend URL (since it's a public endpoint with API-key auth), and fix `widget.html` to reference the built output.

## Changes

### 1. Add a Vite library-mode config for the widget build

**New file: `vite.widget.config.ts`**

A separate Vite config that builds `src/embed/index.tsx` into a self-contained IIFE bundle at `public/embed.js`:
- Output format: IIFE (no module system required)
- Inlines React and all dependencies
- Minified for production
- Single file output, no code splitting

### 2. Hardcode the backend URL in the widget API layer

**File: `src/embed/api.ts`**

Replace `import.meta.env` references with the actual published backend function URL. Since the widget uses API-key authentication (not session auth), the endpoint URL is not a secret -- it's equivalent to any public API endpoint:

- `SUPABASE_URL` becomes the hardcoded project URL (from the published environment)
- `SUPABASE_ANON_KEY` becomes the hardcoded anon key

These are already public values (the anon key is in every client-side bundle and in the embed code snippets).

### 3. Fix `widget.html` to reference the built bundle

**File: `public/widget.html`**

Change `<script type="module" src="/src/embed/index.tsx">` to `<script src="/embed.js">` (the built output).

### 4. Add a build script for the widget

**File: `package.json`**

Add a `"build:widget"` script: `vite build --config vite.widget.config.ts`

Also add a `"build:all"` script that runs both the main build and the widget build.

### 5. Update embed code snippets to use correct paths

**File: `src/components/admin/widgets/WidgetCodeSnippet.tsx`**

- The script tag embed already references `${baseUrl}/embed.js` which will be correct once the file is built
- Ensure the iframe embed references `/widget.html` (already correct)
- No other changes needed here

### 6. Pre-build `embed.js` so it exists immediately

Run the widget build so `public/embed.js` is available as a static asset without requiring a separate build step on every deploy.

Alternatively, integrate the widget build into the main Vite config as a secondary entry point using `rollupOptions.input`.

## Technical Details

### Vite Widget Config (`vite.widget.config.ts`)

```text
Entry:     src/embed/index.tsx
Output:    public/embed.js
Format:    IIFE
Name:      KernelWidget (global variable)
Minify:    true
Externals: none (all deps inlined)
```

### API Layer Fix (`src/embed/api.ts`)

```text
Before:
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

After:
  const SUPABASE_URL = (window as any).__KERNEL_SUPABASE_URL__ || 'https://kombipftuhjetrhnaklu.supabase.co';
  const SUPABASE_ANON_KEY = (window as any).__KERNEL_SUPABASE_KEY__ || '<anon_key>';
```

This allows override via global variables but defaults to the production values. Both values are already public (present in every client bundle and in the generated embed snippets).

### Build Integration

The simplest approach: add the widget as a second Rollup input in the existing `vite.config.ts` under `build.rollupOptions.input`, outputting `embed.js` alongside the main app bundle. This avoids needing a separate config file and ensures the widget is always built on deploy.

## Files Summary

| File | Action |
|------|--------|
| `vite.config.ts` | Modify -- add widget entry point to rollupOptions |
| `src/embed/api.ts` | Modify -- replace import.meta.env with hardcoded public values |
| `public/widget.html` | Modify -- fix script src to `/embed.js` |
| `package.json` | Modify -- add `build:widget` script |

## What Already Works

- Edge functions (`widget-chat`, `widget-tts`) -- CORS, rate limiting, API key auth, domain allowlists all correct
- Widget UI components (`KernelWidget`, `WidgetChat`, `WidgetInput`, etc.) -- fully self-contained with inline styles
- Shadow DOM isolation -- prevents host site CSS conflicts
- Embed code generator (`WidgetCodeSnippet`) -- produces correct snippets (once `embed.js` exists)
