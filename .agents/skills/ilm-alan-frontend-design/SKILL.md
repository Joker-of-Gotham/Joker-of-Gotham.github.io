---
name: ilm-alan-frontend-design
description: 'Build frontend with a deliberate visual direction using 8 strict aesthetic anchors. Each anchor locks palette, typography, and texture tokens with hard "breaks if" rules. Use when the user wants a strong, memorable visual identity rather than generic design. Source: Ilm-Alan/frontend-design.'
---

# Frontend Design with Aesthetic Anchors

Build a frontend with a deliberate visual direction. Instead of vague vibes like "modern" or "clean", commit to one of 8 anchors. Each anchor is a strict CSS token contract.

## How to Use

1. Ask the user which anchor fits their project (or recommend based on product type).
2. Lock the anchor's tokens into the project's design system.
3. Never mix anchors. Never compromise toward "safe middle ground."
4. If the design "breaks if" rules are violated, the anchor is wrong -- pick a different one.

---

## The 8 Anchors

### 1. Swiss

- **Surface**: White or neutral gray only
- **Type**: Akzidenz-Grotesk, Helvetica Neue, Söhne, or similar neo-grotesque
- **Color**: Swiss Red, Orange, Klein Blue -- one at a time, never gradient
- **Layout**: Strict grid, asymmetric balance, generous whitespace
- **Breaks if**: warm paper tones, serif fonts, grain textures, rounded corners > 4px

### 2. Industrial

- **Surface**: Pure black or dark charcoal
- **Type**: IBM Plex Mono, JetBrains Mono, monospace only for data
- **Color**: One signal color (amber, red, or cyan) on black; everything else gray
- **Layout**: Flat 1px borders, no shadows, no radius
- **Breaks if**: serif fonts, drop shadows, border-radius > 2px, pastel colors

### 3. Brutalist

- **Surface**: Pure white or pure primaries
- **Type**: System fonts only (Times New Roman, Courier, Georgia, system-ui)
- **Color**: Pure RGB primaries, black, white -- no tints, no gradients
- **Layout**: Hard offset shadows (4-8px solid black), native HTML controls
- **Breaks if**: custom webfonts, soft shadows, smooth gradients, rounded > 0

### 4. Aurora Maximalism

- **Surface**: Dark saturated gradients (deep purple to midnight blue)
- **Type**: Oversized display (800+ weight), thin body
- **Color**: Neon pairs (cyan/magenta, lime/violet), mesh gradients, glow effects
- **Layout**: Layered depth, glass panels, spring motion
- **Breaks if**: restraint, monochrome, static layouts, system fonts

### 5. Chaotic Maximalism

- **Surface**: Clashing pastels and neons, busy patterns
- **Type**: 3+ typefaces intentionally colliding, rotated labels
- **Color**: No coherent palette -- intentional dissonance
- **Layout**: Overlapping elements, broken grids, pattern fills everywhere
- **Breaks if**: coherent palette, consistent spacing, clean alignment

### 6. Retro-Futuristic

- **Surface**: Dark navy or CRT-black with scanline overlays
- **Type**: VT323, Orbitron, Press Start 2P, Space Mono
- **Color**: Neon pairs on dark (green/amber terminal, cyan/magenta synthwave)
- **Layout**: Visible scan lines, terminal frames, pixelated borders
- **Breaks if**: flat modern sans-serif, white backgrounds, soft curves

### 7. Organic

- **Surface**: Earth tones (never use cream #F0+, use genuine ochre/terra)
- **Type**: Fraunces (allowed here only), serif display + clean sans body
- **Color**: Ochre, moss, terracotta, deep forest -- never pure black or white
- **Layout**: Rounded 16-32px, grain textures, soft shadows, natural asymmetry
- **Breaks if**: pure white/black, geometric precision, neon accents, monospace

### 8. Lo-Fi

- **Surface**: Paper-yellow (#FFFDE7 range) or kraft brown
- **Type**: Mixed system fonts, handwritten accents, inconsistent sizing
- **Color**: Muted primaries, halftone dots, Risograph offset printing effects
- **Layout**: Slight rotation (0.5-2deg), visible tape/staple metaphors, ruled lines
- **Breaks if**: pixel perfection, strict grids, professional polish, gradients

---

## Content Discipline (All Anchors)

- No fake telemetry numbers ("10,000+ users served")
- No `//` line comment kickers in UI copy
- No unicode glyph icons (→ ✦ ◆) as primary navigation
- No "Experience the seamless..." marketing fluff in product UI
- Every text element must have a real purpose

---

## Constraints

- One anchor per project. Never hybrid.
- Tokens must be declared in CSS custom properties before use.
- If the user's brand conflicts with an anchor's hard rules, pick a different anchor.
- The "breaks if" list is non-negotiable within the chosen anchor.

## Output

Declare the chosen anchor at the top of your implementation plan. Reference it in all design decisions.
