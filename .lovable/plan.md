

## Remove Logo Image from BrandLogo Component

Replace the logo.png image inside the animated gradient border with an empty/minimal center, keeping just the rotating conic gradient border as the brand mark.

### Changes

**`src/components/BrandLogo.tsx`**
- Remove the `<img>` element and the `imgPadding` map entirely
- Keep the outer container, rotating conic gradient layer, and inner `bg-background` inset
- The result: a rounded square with an animated cyan-to-gold gradient border and a solid background center

**No other files need changes** -- Header, Footer, LoadingScreen, and Showcase all use `<BrandLogo />` already.

### Technical Detail

The component will simplify to just two inner layers:
1. The rotating `conic-gradient` div (the border)
2. The `inset-[1px] bg-background` div (the center fill)

The `loading="lazy"` img removal also eliminates a potential broken-image flash if `logo.png` ever fails to load.

