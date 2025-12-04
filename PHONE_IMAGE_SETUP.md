# 📱 Phone Call Image Setup

## Quick Setup (2 steps):

### Step 1: Save the Image
Save your iPhone calling screen image as:
```
/public/aurora-call-screen.png
```

**Important**: The image should be named exactly `aurora-call-screen.png` and placed in the `public` folder.

### Step 2: Done! 
The script will automatically display your image with:
- ✨ Floating animation
- 🌟 Glowing effect around the phone
- 📱 Drop shadow for depth
- 🎨 Auto-scaled and responsive

## Current Setup:

The phone visual script (`/public/phone-ai-visual.js`) is already configured to:
1. Find the section with "How about a new image..." text
2. Replace it with your phone call screen image
3. Add beautiful animations and effects

## Fallback:

If the image is not found, a placeholder SVG will show with "Aurora AI" text.

## Testing:

1. Save your image to `/public/aurora-call-screen.png`
2. Refresh your landing page
3. Look for the section that previously had "How about a new image instead..."
4. You should see your animated phone call screen!

## Image Specifications:

- **Format**: PNG (preferred for transparency) or JPG
- **Recommended size**: 375x812px (iPhone aspect ratio)
- **File name**: `aurora-call-screen.png` (exact name)
- **Location**: `/public/` directory

## What's Included:

✅ Floating animation (3 second loop)
✅ Glow effect pulse 
✅ Professional drop shadow
✅ Responsive scaling
✅ Fallback placeholder if image missing
✅ Auto-detection of target section

## File Structure:
```
/public/
  ├── aurora-call-screen.png  ← Save your image here
  ├── phone-ai-visual.js      ← Animation script (already configured)
  └── index.html              ← Landing page (already updated)
```

That's it! Just save your iPhone screenshot as `aurora-call-screen.png` in the `public` folder and refresh! 🚀

