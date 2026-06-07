# OKLCH Color System Reference

## Why OKLCH

- Perceptually uniform: equal lightness steps look equal across hues
- Device-independent: browsers gamut-map to sRGB on older displays
- Tailwind v4 default palette uses OKLCH
- Easy contrast calculation via Lightness channel

## OKLCH Syntax

```css
color: oklch(L C H);
/* L = Lightness (0-1), C = Chroma (0-0.4+), H = Hue (0-360) */

/* Examples */
--color-primary: oklch(0.55 0.20 264);    /* vivid blue */
--color-danger: oklch(0.55 0.22 27);      /* strong red */
--color-success: oklch(0.65 0.18 145);    /* clear green */
--color-warning: oklch(0.75 0.18 80);     /* amber */
```

## Palette Generation

### Same-hue scale (for backgrounds/surfaces)

Keep Hue constant, vary Lightness and Chroma:

```css
--color-blue-50:  oklch(0.97 0.01 264);
--color-blue-100: oklch(0.93 0.03 264);
--color-blue-200: oklch(0.87 0.06 264);
--color-blue-300: oklch(0.78 0.10 264);
--color-blue-400: oklch(0.68 0.15 264);
--color-blue-500: oklch(0.55 0.20 264);
--color-blue-600: oklch(0.47 0.20 264);
--color-blue-700: oklch(0.39 0.18 264);
--color-blue-800: oklch(0.32 0.15 264);
--color-blue-900: oklch(0.25 0.10 264);
```

### Contrast calculation

For WCAG AA (4.5:1 for normal text):
- Background L > 0.85 → foreground needs L < 0.35
- Background L < 0.25 → foreground needs L > 0.75

Quick rule: |L_bg - L_text| > 0.50 usually passes AA.

## Display P3 Wide Gamut

```css
/* Provide sRGB fallback in cascade */
.hero-accent {
  color: oklch(0.65 0.25 145); /* sRGB-safe value */
}

@supports (color: color(display-p3 1 1 1)) {
  .hero-accent {
    color: oklch(0.65 0.32 145); /* wider gamut on P3 displays */
  }
}
```

Strategy: Design in P3 range, let browser gamut-map for sRGB. Always test that sRGB fallback looks acceptable.

## APCA Contrast (WCAG 3.0 Candidate)

| APCA Lc | Use |
|---------|-----|
| 90+ | Body text (12-16px) |
| 75+ | Large text (18px+) |
| 60+ | Sub-text, placeholders |
| 45+ | Large non-text elements |
| 30+ | Borders, dividers |

Use alongside WCAG 2.x (not as replacement until WCAG 3.0 is finalized).

## Semantic Color Roles

| Role | Purpose | Light | Dark |
|------|---------|-------|------|
| background | Page background | L: 0.97+ | L: 0.10-0.15 |
| foreground | Primary text | L: 0.10-0.20 | L: 0.90-0.97 |
| surface | Card/panel bg | L: 0.99 | L: 0.15-0.20 |
| muted | Secondary text | L: 0.45-0.55 | L: 0.55-0.65 |
| border | Dividers | L: 0.85-0.90 | L: 0.25-0.30 |
| primary | Brand/action | Per brand | Per brand |
| accent | Highlights | Per brand | Per brand |
| danger | Errors | H: 20-30 | H: 20-30 |
| success | Confirmation | H: 140-155 | H: 140-155 |
| warning | Caution | H: 75-90 | H: 75-90 |

## Rules

- All project colors defined in OKLCH
- Semantic roles mandatory (never use `--color-blue-500` in components)
- Dark mode = remap semantic assignments, not new palette
- Contrast verified at both semantic and component level
- No raw hex values in component files
