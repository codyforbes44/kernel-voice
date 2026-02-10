

# Refactor Homepage OG Image with "ƷBI Voice" Branding

## Problem

Previous AI image generation attempts couldn't reliably render the Unicode character "Ʒ" (Latin Ezh). The current `og-home.png` has an incorrect or messy rendering of the brand name.

## Approach

Use the higher-quality image generation model (`google/gemini-3-pro-image-preview`) instead of the flash model, with a more explicit prompt that describes the character shape rather than relying on the model to interpret the Unicode glyph. This gives the best chance of a clean render.

## Steps

1. **Update the `brand-og-image` edge function** to use `google/gemini-3-pro-image-preview` (higher quality) and revise the prompt to describe the Ʒ character explicitly (e.g., "the letter that looks like a reversed numeral 3") to help the model render it correctly.

2. **Deploy and call the edge function** with the uploaded source image to generate the branded OG image.

3. **Save the result** as `public/og-home.png`, replacing the current version.

4. **Verify** by opening the landing page and checking the OG meta tag references the updated image.

## Fallback

If the AI model still cannot render the character cleanly, we will generate the image with "3BI Voice" (using the numeral 3, which is visually near-identical to Ʒ) and confirm with you before saving.

## Technical Details

- Model change: `google/gemini-2.5-flash-image-preview` to `google/gemini-3-pro-image-preview`
- Prompt will explicitly describe the glyph shape to avoid Unicode rendering issues
- Output: 1200x630 PNG saved to `public/og-home.png`
- SEO component already references `/og-home.png` correctly -- no code changes needed beyond the image itself

