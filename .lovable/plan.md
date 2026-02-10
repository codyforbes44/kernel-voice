

# Update OG Home Image: "Kernel Voice" to "ƷBI Voice"

## What

The uploaded OG image (`og-home.png`) still says "Kernel Voice". It needs to be regenerated with "ƷBI Voice" branding instead.

## Approach

Use the `brand-og-image` edge function (already exists) to regenerate the image via the AI image editing model. The function will take the uploaded image and apply the new "ƷBI Voice" text branding. The resulting image will replace `public/og-home.png`.

## Steps

1. Copy the uploaded image to the project as the base image
2. Update the `brand-og-image` edge function prompt to use "ƷBI Voice" instead of "Kernel Voice" (it was already partially updated but should be verified)
3. Call the edge function to generate the branded image
4. Save the result as `public/og-home.png`

Alternatively (simpler and more reliable): Use the AI image generation API directly from a small edge function call or inline to edit the image, replacing "Kernel Voice" text with "ƷBI Voice" while keeping everything else identical.

## Technical Details

- The `brand-og-image` edge function at `supabase/functions/brand-og-image/index.ts` already references "ƷBI Voice" in its prompt (updated in earlier refactoring)
- The image will be edited using the `google/gemini-2.5-flash-image-preview` model via the Lovable AI gateway
- Output dimensions: 1200x630 (standard OG image size)
- The generated base64 image will be decoded and saved to `public/og-home.png`

