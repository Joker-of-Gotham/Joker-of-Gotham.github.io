# Responsive Design Checklist

Verify at **320px**, **768px**, **1280px**, **1920px** minimum. Test portrait + landscape on mobile/tablet. Mark Pass / Fail / N/A.

---

## Container Queries

| Check | Pass | Fail |
|-------|------|------|
| Component-level responsiveness | Cards, tables, sidebars adapt via `@container` when parent width matters | Only viewport media queries for card internals |
| Container defined | Parent has `container-type: inline-size` (or `size`) | `@container` rules never fire |
| Named containers | Complex layouts use `container-name` for targeted queries | Global container query side effects |
| Fallback present | Components degrade gracefully without container query support | Broken layout in older browsers |
| Query units | Uses `cqw`/`cqi` for fluid component typography/spacing | Hard breakpoint jumps inside components |

**When to use:** Card grids, sidebar collapse, data tables, dashboard widgets — anywhere component width ≠ viewport width.

**When NOT to use:** Page-level layout shifts (use media queries).

---

## Media Queries — Layout Only

| Check | Pass | Fail |
|-------|------|------|
| MQ for macro layout | Grid columns, nav pattern, sidebar visibility use `min-width` MQ | MQ changes font-size per breakpoint |
| Mobile-first | Base styles = mobile; `min-width` adds complexity | Desktop-first `max-width` overrides |
| Breakpoint tokens | Breakpoints match DESIGN.md (`sm/md/lg/xl`) | Random 767px/1023px values |
| No component styling in MQ | Button/card styles constant across breakpoints | Button padding changes at 768px |
| Print stylesheet | Critical pages have `@media print` rules | Print layout broken |

---

## Touch Targets

| Check | Pass | Fail |
|-------|------|------|
| Mobile ≥ 44×44 CSS px | Tap targets on touch viewports meet 44px minimum | 32px icon buttons on mobile |
| Spacing between targets | ≥ 8px gap between adjacent 44px targets | Touch targets overlap hit areas |
| Desktop may be smaller | 24×24 WCAG minimum acceptable with mouse (document) | — |
| Hit area expansion | Small icons wrapped in padded `<button>` | SVG alone is clickable |
| Table row actions | Row menus/delete buttons meet touch size on mobile | Hover-only row actions on touch |

---

## Safe Area Insets

| Check | Pass | Fail |
|-------|------|------|
| `env(safe-area-inset-*)` | Fixed headers/footers respect notch/home indicator | Content under iPhone notch |
| `viewport-fit=cover` | Set when edge-to-edge layout intended | Missing on PWA/fullscreen |
| Bottom nav padding | `padding-bottom: env(safe-area-inset-bottom)` | FAB clipped by home bar |
| Horizontal insets | Side content respects `safe-area-inset-left/right` in landscape | Text under rounded corners |

```css
padding-bottom: max(var(--spacing-4), env(safe-area-inset-bottom));
```

---

## Logical Properties

| Check | Pass | Fail |
|-------|------|------|
| Use logical axes | `margin-inline`, `padding-block`, `inset-inline-start` | `margin-left`/`padding-right` only |
| RTL support | Layout mirrors in `dir="rtl"` without overrides | Fixed left/right positioning breaks RTL |
| `text-align: start/end` | Not hardcoded `left`/`right` | — |
| Border logical | `border-inline-start` for accent bars | `border-left` only |
| Size logical | `inline-size`/`block-size` where direction-aware | — |

---

## Fluid Typography

| Check | Pass | Fail |
|-------|------|------|
| `clamp()` scale | Headings/body use fluid type tokens from DESIGN.md | Fixed `px` font sizes per breakpoint |
| No MQ font jumps | Typography scales smoothly | H1 is 24px mobile, 48px desktop with no intermediate |
| Line length | `max-width: 65ch` on prose | Full-width paragraphs on 1920px |
| Line height scales | Display headings tighter; body 1.5–1.6 | Same line-height at all sizes |
| Minimum readable | Body never below 16px equivalent at 320px | 12px body text on mobile |

**Verify:** Resize 320→1920 — text scales without layout break or overflow.

---

## Breakpoint Testing Matrix

| Viewport | Width | Must Verify |
|----------|-------|-------------|
| Mobile S | 320px | No horizontal scroll; nav accessible; forms stack |
| Tablet | 768px | 2-col where intended; sidebar behavior |
| Desktop | 1280px | Max-width container; full nav |
| Wide | 1920px | Content not overstretched; gutters balanced |

### Per Breakpoint Checks

- [ ] No unintended horizontal scrollbar
- [ ] Primary CTA visible without scroll (landing/key flows)
- [ ] Navigation pattern correct (hamburger ↔ full nav)
- [ ] Images use `srcset`/`sizes` or responsive containers
- [ ] Tables: scroll, stack, or card-transform — not clipped
- [ ] Modals fit viewport with margin
- [ ] Typography readable without zoom

---

## Orientation Handling

| Check | Pass | Fail |
|-------|------|------|
| Landscape mobile | Content usable; nav not taller than 40% viewport | Keyboard + nav consume all space |
| Portrait tablet | Layout uses available height | Desktop layout squeezed |
| `orientation` only when needed | Used for gallery/hero/video — not general layout | Entire layout swaps on rotate |
| No orientation lock required | App usable both orientations unless media app | — |

---

## Content Reflow at 400% Zoom

WCAG 1.4.10 Reflow — content usable at 400% zoom (≈1280px viewport equivalent at 320px CSS width).

| Check | Pass | Fail |
|-------|------|------|
| No 2D scroll at 400% | Single-axis scroll only (vertical) | Horizontal scroll required to read |
| No content loss | All info still available | Text clipped with `overflow: hidden` |
| Sticky UI proportionate | Fixed chrome doesn't cover majority of viewport | Sticky header > 50% height at zoom |
| Modals reflow | Dialog content scrolls inside viewport | Modal taller than viewport, clipped |
| Side-by-side → stack | Multi-column becomes single column | Columns too narrow to read |

**Test:** Browser zoom 400% at 1280px window, OR 320px viewport with text scaling.

---

## Subgrid Alignment

| Check | Pass | Fail |
|-------|------|------|
| Card grid alignment | Sibling cards share row heights via `grid`/`subgrid` | Misaligned card footers/actions |
| Form label alignment | Labels in multi-column forms align across rows | Ragged label widths |
| `display: subgrid` | Nested grid inherits parent tracks where supported | Manual margin hacks per card |
| Fallback grid | `@supports not (grid-template-columns: subgrid)` alternative | Broken in non-subgrid browsers |
| Table ↔ card consistency | Card view mirrors table column priority | Different info order mobile vs desktop |

```css
.card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
.card { display: grid; grid-template-rows: subgrid; grid-row: span 3; }
```

---

## Additional Responsive Checks

- [ ] `prefers-reduced-motion` honored
- [ ] `prefers-color-scheme` dark mode functional
- [ ] Viewport meta: `width=device-width, initial-scale=1`
- [ ] No `user-scalable=no` (blocks zoom — WCAG fail)
- [ ] `dvh`/`svh` for full-height mobile (not `100vh` under address bar)
- [ ] Responsive images: `width/height` attributes prevent CLS
- [ ] Hover states don't gate critical functionality on touch

---

## Severity Guide

| Issue | Severity |
|-------|----------|
| Horizontal scroll at 320px | HIGH |
| Touch target < 44px on mobile | HIGH |
| 400% zoom requires 2D scroll | CRITICAL |
| Content under safe area/notch | HIGH |
| No RTL/logical property support (RTL product) | HIGH |
| Fluid type missing (minor) | MEDIUM |
| Subgrid misalignment (cosmetic) | LOW |
