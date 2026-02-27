

## Replace Static Logo with Animated Gradient Border Logo

Replace all `logo.png` image references with a reusable `BrandLogo` component that wraps the existing logo image inside a continuously rotating conic gradient border using primary and gold colors.

---

### 1. Add `--gold` CSS Variable

Add a warm gold color to both light and dark themes in `src/index.css`:

- Light: `--gold: 45 93% 55%;`
- Dark: `--gold: 45 93% 58%;`

Also add a `gold` color entry in `tailwind.config.ts` so it's available as `text-gold`, `bg-gold`, etc.

---

### 2. Add Rotation Keyframe

Add a `spin-slow` keyframe and animation to `tailwind.config.ts`:

```text
keyframes:
  "logo-spin": { "0%": rotate(0deg), "100%": rotate(360deg) }

animation:
  "logo-spin": "logo-spin 4s linear infinite"
```

---

### 3. Create `BrandLogo` Component

New file: `src/components/BrandLogo.tsx`

A reusable component accepting `size` (sm, md, lg, xl) that renders:
- An outer wrapper with `overflow-hidden` and `rounded-xl`
- A rotating inner div with `conic-gradient(from 0deg, hsl(var(--primary)), hsl(var(--gold)), hsl(var(--primary)))` as background, using `animate-logo-spin`
- A centered `bg-background` inset with 1px gap (the border effect)
- The existing `logo.png` image centered inside

Size map:
- `sm`: 24x24px (header)
- `md`: 32x32px (footer, showcase)
- `lg`: 64x64px (loading screen)
- `xl`: 80x80px (if needed)

Accepts optional `className` for overrides and `animate` prop (default `true`) to disable rotation where needed (e.g., footer for performance).

---

### 4. Replace Logo Instances

| File | Current | Change |
|------|---------|--------|
| `Header.tsx` | `<img src="/logo.png" className="h-6 w-6 sm:h-7 sm:w-7">` | `<BrandLogo size="sm" />` |
| `Footer.tsx` | `<img src="/logo.png" className="h-8 w-8">` | `<BrandLogo size="md" animate={false} />` |
| `LoadingScreen.tsx` | `<img src="/logo.png" className="h-16 w-16">` with blur glow | `<BrandLogo size="lg" />` (remove the manual glow div) |
| `Showcase.tsx` | `<img src={logo} className="h-8 w-8 sm:h-10 sm:w-10">` | `<BrandLogo size="md" />` |

Widget-related logo references (`WidgetPreview`, `WidgetEditor`, `WidgetCodeSnippet`) will remain unchanged since those handle user-configurable brand logos, not the app's own branding.

---

### 5. Reduced Motion Support

The rotation animation will respect `prefers-reduced-motion: reduce` via the existing global CSS rule that sets all animation durations to near-zero. No additional work needed.

---

### Files Changed

| File | Action |
|------|--------|
| `src/index.css` | Add `--gold` variable to both themes |
| `tailwind.config.ts` | Add `gold` color + `logo-spin` keyframe/animation |
| `src/components/BrandLogo.tsx` | **New** - reusable gradient logo component |
| `src/components/layout/Header.tsx` | Replace img with BrandLogo |
| `src/components/layout/Footer.tsx` | Replace img with BrandLogo |
| `src/components/layout/LoadingScreen.tsx` | Replace img + glow with BrandLogo |
| `src/pages/Showcase.tsx` | Replace img with BrandLogo |

