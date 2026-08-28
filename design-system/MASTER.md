# Design System Master Specification

> Lunar Signal Observatory · implementation contract<br>
> Status: Active / M3 · Last updated: 2026-08-28

## 1. Authority and scope

This document translates [`/DESIGN.md`](../DESIGN.md) into implementation rules. Authority order is:

1. Explicit, approved user decision;
2. [`DESIGN.md`](../DESIGN.md);
3. This file;
4. Page-level specifications under `design-system/pages/` when they exist;
5. Existing component conventions;
6. Skill or framework defaults.

Runtime values live in [`src/styles/tokens.css`](../src/styles/tokens.css). [`docs/design-tokens.md`](../docs/design-tokens.md) is the human-readable registry. A conflict between the registry and CSS is a documentation defect; fix both in the same change. This specification covers the frontend presentation system only and does not authorize changes to Astro content schemas, CMS structure, dependencies, publishing, or asset rights.

## 2. System model

### 2.1 Brand layers

| Layer | Name | Owns | Must not own |
|---|---|---|---|
| B | Lunar Signal Observatory | First impression, spatial continuity, major achievements | Long-form text rendering or navigation semantics |
| A | Nocturne Research Archive | Reading, browsing, search, roadmap, code and data | Continuous high-intensity effects |
| C | Afterlight Band-Signal Theatre | Personal warmth, anime / band references, short Easter eggs | Primary hierarchy or critical actions |

A page may combine layers, but it needs one primary layer. The primary layer determines density and motion budget; secondary layers may accent it without changing its information architecture.

### 2.2 Three-layer token architecture

```text
Layer 1  --primitive-*    raw OKLCH, dimensions, font stacks, durations
             ↓
Layer 2  --color-*       semantic roles plus --font-*, --text-*, --layout-*, --motion-*
             ↓
Layer 3  --component-*   explicit contracts for button/card/nav/form/article/canvas/audio
             ↓
Legacy   --bg-*, --text-strong, --accent-*, etc. (temporary compatibility only)
```

Rules:

- Components must use Layer 3 when a contract exists; otherwise they may use Layer 2.
- Components must never reference `--primitive-*`.
- A theme remaps Layer 2 color roles only. Do not duplicate a component for light mode.
- A new raw value first enters Layer 1, receives a semantic role in Layer 2, then receives a component contract only when the component needs a stable override point.
- Tailwind is not installed in the repository. Do not emit runtime `@theme` rules until Tailwind is deliberately adopted; the same semantic names are reserved for a future one-to-one mapping.

## 3. Token naming and ownership

| Prefix | Owner / meaning | Example |
|---|---|---|
| `--primitive-color-*` | palette primitive | `--primitive-color-violet-500` |
| `--primitive-type-*` | fluid type primitive | `--primitive-type-3xl` |
| `--color-*` | theme-remappable semantic color | `--color-foreground-soft` |
| `--font-*`, `--text-*`, `--leading-*` | semantic typography | `--text-base` |
| `--layout-*` | semantic layout constraint | `--layout-reading-width` |
| `--motion-*` | effective motion value | `--motion-duration-normal` |
| `--scene-*` | semantic WebGL bridge | `--scene-signal-color` |
| `--component-*` | component contract | `--component-card-bg` |

Names describe purpose, not appearance. Reject names such as `--purple-button`, `--left-gap-18`, or `--pretty-shadow`. Numeric palette steps are allowed only in Layer 1. Component-local geometry that depends on its own content may remain local when it is not a reusable design decision.

## 4. Theme and mode contracts

### 4.1 Theme resolution

1. `html[data-theme="dark"]` uses the dark defaults.
2. `html[data-theme="light"]` explicitly remaps semantic colors.
3. Without `data-theme`, `prefers-color-scheme: light` selects Moon Paper Archive; otherwise Void Observatory is used.
4. Theme code must set the attribute before first paint when persistence is later implemented, to avoid a flash of the wrong theme.

The renderer reads `--scene-fog-color`, `--scene-signal-color`, `--scene-orbit-color`, `--scene-afterlight-color`, `--scene-metal-color`, and `--scene-particle-base` from computed styles. It must not duplicate literal palette values in JavaScript or shaders.

### 4.2 Reduced motion

Both `html[data-motion="reduced"]` and the OS media query collapse effective motion durations to `1ms`, distances to zero, and continuous-scene factors to zero. Runtime code must treat `--motion-continuous-enabled: 0` as an instruction to show a static Poster and stop requestAnimationFrame. The CSS animation safety net remains in `src/styles/animations.css`.

### 4.3 Audio

Audio is always opt-in. Theme and scene initialization cannot start playback, request audio permission, or fetch large audio files. The first explicit user action may load the selected ambience; the control must retain mute, loading, failure, volume, and stop states.

## 5. Component contracts

### 5.1 Global navigation

- Semantic HTML and keyboard order are authoritative; Canvas never implements navigation.
- Home navigation is floating and compact. Archive navigation may be persistent but must collapse without hiding critical actions.
- Current state uses label weight, position marker, and `--component-nav-active` together.
- No navigation action may exist only on hover.

### 5.2 Buttons and forms

- Primary: `--component-button-primary-*`; at most one primary action per scope.
- Secondary: `--component-button-secondary-*`; destructive actions use semantic danger roles.
- Controls expose default, hover, focus-visible, active, disabled, loading, success, and error as applicable.
- Minimum touch target is 44px. Labels remain visible or are programmatically associated.
- Error copy is adjacent to the field and announced; color is secondary evidence.

### 5.3 Cards and image windows

- Closed cards use `--component-card-*`, but they are reserved for explicitly contained/selected objects; hover translation cannot exceed `--motion-distance-sm`.
- Default content groupings use the open `--component-field-*` surface/edge contract, whitespace, and typographic hierarchy. Do not nest more than three visually closed layers.
- Media aspect ratio is selected by content type and remains consistent within one collection.
- Existing anime images are retained as signal windows / memory slices. They require alt text, focal-point cropping, and a quiet surrounding surface.
- Do not rasterize text into a cover. Do not recolor individual pages around each image.

### 5.4 Article surface

- The main body uses `--component-article-*`; code uses `--component-code-*`.
- Reading width is `--layout-reading-width`; figures may expand to the content width with an explicit caption.
- Selection, focus, heading hierarchy, tables, KaTeX, Mermaid, code overflow, and print output are release checks.
- Continuous particles are off by default while the user reads long-form content.

### 5.5 WebGL scene and articulated volume actor

- One shared Three.js renderer owns the fixed macro world, camera/look routes, fog, lighting, environmental fields, foreground observatory kit, and desktop articulated avatar. See [ADR-0005](../docs/adr/0005-full-realtime-world-and-volumetric-guide.md).
- DOM owns copy, links, controls, SEO, search, and accessibility.
- Canvas UI Particle Object is no longer the actor representation; environmental particles provide scale and atmosphere only.
- Desktop live mode uses one original adult observatory guide built as an articulated Three.js volume. Opaque PBR body surfaces consume semantic avatar tokens; chapter choreography drives joint pivots, gaze, breathing, hair, skirt and gait. No visible image plane or runtime atlas request is permitted in the desktop live path.
- The aligned pose atlas remains a portrait/static fallback only. It preserves identity and chapter silhouettes for Reduced Motion, Save-Data, no-WebGL and initialization-failure paths.
- Portrait viewports at or below 820 px keep the Three.js world but use in-flow pose stages sourced from the same atlas; the real-time actor is not initialized. Static portrait tiers use the poster and must not request the atlas.
- Every scene has Poster, loading, live, degraded, context-lost, and reduced-motion states.
- The poster/world plate is completely hidden after the first live frame. Canvas UI Magnify is permitted only as a lazy, single-instance signal-window instrument and never as a second full-page renderer.

## 6. Layout and responsive contracts

| Context | Width | Grid | Motion ceiling |
|---|---:|---:|---:|
| Reading | `44rem` | single column + optional notes | low |
| Standard | `75rem` | 12 / 8 / 4 responsive columns | medium |
| Cinematic | `100rem` | full-bleed scene + constrained DOM | high |

Use fluid page insets and section spacing from Layer 2. Media-query thresholds may be literal in CSS because custom properties cannot drive media conditions; their values still follow the ranges documented in `DESIGN.md`. Prefer container queries for reusable cards and panels. A breakpoint must solve a content collision, not target a device name.

## 7. Compatibility and migration

The current UI consumes historical aliases. They remain mapped in `tokens.css` during staged migration:

| Historical family | New destination | Migration rule |
|---|---|---|
| `--bg-*` | `--color-background*` / card contract | Replace when touching the component |
| `--text-*` color aliases | `--color-foreground*` | Do not confuse with fluid `--text-xs…5xl` |
| `--accent-cyan` | Orbit Blue semantic secondary | Historical name only; no cyan primitive is retained |
| `--accent-violet` | semantic primary | Preferred brand route |
| `--glass-*` | card/nav/form contracts | Keep only where real background depth exists |
| `--radius-*`, `--space-*` | primitive-backed aliases | Safe to use until component migration |
| `--duration-*`, `--ease-*` | `--motion-*` | New work uses semantic motion names |

Migration is opportunistic and file-scoped. Do not run a blind repository-wide replacement because `--text-*` includes both legacy color aliases and new type-scale names. Removing an alias requires an `rg` proof that no source consumer remains and a build/check run.

## 8. Change protocol

For every design-system change:

1. State the affected brand layer, page families, themes, and accessibility modes.
2. Update `DESIGN.md` when intent changes; update `tokens.css` when a value or role changes; update this file when an implementation contract changes.
3. Add or update the page specification before making a page-specific exception.
4. Record new asset origins in `docs/asset-provenance.md` before merging the asset.
5. Add an ADR for changes to renderer topology, content architecture, state ownership, or dependency strategy.
6. Verify at the risk-proportionate level and record only executed evidence.

### QA-L3 target matrix

| Dimension | Required evidence before release |
|---|---|
| Build / type | `npm run check` and production build |
| Themes | Dark and light screenshots at representative pages |
| Responsive | 375, 768, 1024, and 1440px visual checks |
| Accessibility | Keyboard route, focus visibility, landmarks, alt text, reduced motion, contrast |
| WebGL | live, low-power, no-WebGL, context loss, background-tab pause |
| Performance | LCP/CLS/INP plus frame-time and memory sampling on representative desktop/mobile |
| Audio | default muted, no prefetch before consent, stop/volume/error states |
| Provenance | all shipped imagery/audio/fonts/code have status other than Unresolved |

Current state is M3: direction and initial token foundation exist; component migration, renderer implementation, visual regression baselines, performance evidence, and release provenance are not yet complete.
