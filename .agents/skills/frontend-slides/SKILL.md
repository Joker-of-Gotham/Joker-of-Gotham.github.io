---
name: frontend-slides
description: >-
  Create stunning HTML presentations as single self-contained files. Modes: new
  deck, PPT convert, enhance existing. Fixed 16:9 viewport (1920×1080). Includes
  3-preview style discovery and STYLE_PRESETS reference. Zero dependencies.
  Use when building slide decks, converting presentations, or enhancing HTML
  slides. Source: zarazhangrui/frontend-slides.
---

# Frontend Slides

Generate beautiful, zero-dependency HTML presentations in a fixed 16:9 viewport. Output is always a single `.html` file — no build step, no CDN, no npm.

## Modes

| Mode | Trigger | Workflow |
|------|---------|----------|
| **New deck** | "Create slides about…" | Style discovery → build from scratch |
| **PPT convert** | User provides .pptx or slide outline | Extract structure → apply style → HTML |
| **Enhance existing** | User has HTML slides | Audit → improve visuals, motion, typography |

---

## Fixed Viewport

All decks use a **1920×1080** (16:9) canvas:

```css
.slide {
  width: 1920px;
  height: 1080px;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  position: relative;
}
```

Scale for display with CSS transform or viewport wrapper — design at native 1920×1080.

```css
.deck-viewport {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0a0a0a;
}
.deck-viewport .deck {
  transform: scale(min(100vw / 1920, 100vh / 1080));
  transform-origin: center center;
}
```

---

## New Deck Workflow

```
1. Gather content (topic, audience, slide count, key messages)
2. Style discovery — generate 3 style previews (see below)
3. User picks style (or agent picks if unspecified)
4. Build single HTML file with all slides
5. Add keyboard navigation (arrows, space, touch swipe)
6. Verify at 1920×1080 in browser
```

### 3-Preview Style Discovery

Before building the full deck, present **3 distinct style directions** as mini HTML previews (1 slide each):

1. **Direction A** — e.g., bold editorial, high contrast
2. **Direction B** — e.g., minimal technical, monospace accents
3. **Direction C** — e.g., warm gradient, soft geometry

Each preview is a self-contained snippet showing: typography, color palette, layout rhythm, and one sample slide. User selects one direction before full build.

If user provides explicit style references, skip discovery and match their direction.

---

## PPT Convert Workflow

```
1. Extract slide titles, body text, and image placeholders from source
2. Map each slide to HTML slide component
3. Apply selected STYLE_PRESET
4. Rebuild visuals — do not paste Office styling verbatim
5. Add navigation and presenter notes (HTML comments or hidden div)
6. Output single HTML file
```

When .pptx parsing is unavailable, ask user for slide outline (title + bullets per slide).

---

## Enhance Existing Workflow

```
1. Read current HTML slides file
2. Audit: typography, color, spacing, transitions, navigation
3. Preserve content structure — improve craft
4. Fix viewport scaling if broken
5. Add missing keyboard/touch navigation
6. Output enhanced single HTML file
```

---

## STYLE_PRESETS Reference

Use as starting points — customize per deck topic.

### `editorial-dark`

- Background: `#0d0d0d` with subtle grain
- Type: Serif display (e.g., Playfair Display) + sans body (e.g., Source Sans 3)
- Accent: warm gold `#c9a227`
- Layout: asymmetric, large type, generous margins

### `tech-minimal`

- Background: `#fafafa` / `#111` alternating slides
- Type: Monospace accents (JetBrains Mono) + geometric sans (DM Sans)
- Accent: electric blue `#0066ff`
- Layout: grid-aligned, code-block aesthetic

### `gradient-bold`

- Background: diagonal gradients (deep purple → coral)
- Type: heavy sans (Outfit, 800 weight headlines)
- Accent: white / neon yellow highlights
- Layout: centered hero statements, full-bleed color blocks

### `corporate-clean`

- Background: white with navy `#1a2744` header bars
- Type: Inter-like neutral sans (use distinctive alternative: IBM Plex Sans)
- Accent: brand blue `#2563eb`
- Layout: title left, content right, consistent footer

### `playful-rounded`

- Background: soft pastels, rounded rectangles
- Type: rounded sans (Nunito, Quicksand)
- Accent: coral `#ff6b6b`, mint `#4ecdc4`
- Layout: card-based slides, icon bullets

---

## Slide Structure Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Deck Title</title>
  <style>
    /* All CSS inlined — fonts via @font-face or system stack */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    /* .deck-viewport, .slide, .slide.active, transitions, typography */
  </style>
</head>
<body>
  <div class="deck-viewport">
    <div class="deck" id="deck">
      <section class="slide active" data-slide="1"><!-- content --></section>
      <section class="slide" data-slide="2"><!-- content --></section>
    </div>
  </div>
  <script>
    /* Inline JS: keyboard nav, touch swipe, slide counter */
  </script>
</body>
</html>
```

---

## Navigation Requirements

- **Keyboard:** `→` / `Space` next, `←` previous, `Home`/`End` first/last
- **Touch:** swipe left/right on mobile
- **Visible:** slide number indicator (e.g., `3 / 12`)
- **URL hash:** optional `#slide-3` for deep linking

---

## Output Format

Deliver:

1. **Single HTML file** — `[deck-name].html`
2. **Brief manifest** (in chat or comment block):

```markdown
# Deck: [Title]
- **Mode:** new | convert | enhance
- **Style preset:** editorial-dark | custom
- **Slides:** 12
- **Viewport:** 1920×1080
- **Navigation:** keyboard + touch
```

---

## Constraints

- **Zero dependencies** — no npm, no CDN links, no external JS/CSS
- **Single file output** — all assets inlined or data URIs
- **1920×1080 design canvas** — always
- Fonts: prefer system font stacks or inlined `@font-face` with base64 WOFF2
- No placeholder lorem — use real content from user brief
- Animations respect `prefers-reduced-motion`
- Maximum ~30 slides per file without user approval for larger decks
- Style discovery (3 previews) required for new decks unless style is specified

---

## Source

From **zarazhangrui/frontend-slides**. Zero-dependency HTML presentation generator with style discovery workflow.
