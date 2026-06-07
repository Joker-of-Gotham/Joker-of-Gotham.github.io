# WCAG 2.2 AA Accessibility Checklist

Audit against Level AA. WCAG 2.2 adds 9 new success criteria — verify all. Mark Pass / Fail / N/A per page/view.

**Contrast targets:** 4.5:1 normal text, 3:1 large text (18pt+ / 14pt bold), 3:1 UI components and graphics.

---

## WCAG 2.2 — New Success Criteria

### 2.4.11 Focus Not Obscured (Minimum) — Level AA

| Check | Pass | Fail |
|-------|------|------|
| Focused element visible | When any component receives focus, it is not entirely hidden by author-created content (sticky headers, footers, drawers) | Focused button/link fully covered by fixed bar |
| Partial visibility OK | At least part of focused control remains visible | Focus scrolls under opaque overlay with no scroll-into-view |

**Fix:** `scroll-padding` on scroll container; `scroll-margin` on focusable elements; reduce sticky height; auto-scroll focused element into view.

---

### 2.4.12 Focus Not Obscured (Enhanced) — Level AAA (aspirational)

| Check | Pass | Fail |
|-------|------|------|
| Full focus visibility | Entire focused component visible in viewport | Any pixel of focus ring clipped by sticky UI |

**Fix:** Reserve space for focus ring; use `scroll-padding-top/bottom` equal to sticky height + focus offset.

---

### 2.4.13 Focus Appearance — Level AAA (aspirational)

| Check | Pass | Fail |
|-------|------|------|
| Focus indicator area | Focus ring area ≥ perimeter × 2 CSS px (or equivalent) | 1px outline only |
| Focus contrast | Focus indicator contrast ≥ 3:1 against adjacent colors | Focus ring invisible on colored backgrounds |
| Not color-only | Focus uses outline/offset/shadow, not hue change alone | Only background color shift on focus |

**Fix:** `outline: 2px solid` + `outline-offset: 2px` or equivalent `box-shadow` ring using `--ring` token.

---

### 2.5.7 Dragging Movements — Level AA

| Check | Pass | Fail |
|-------|------|------|
| Single-pointer alternative | Drag-and-drop, sliders, sortable lists have click/tap alternative | Reorder only via drag handle |
| No path-based gesture required | No required precise dragging path | Signature canvas with no type/upload fallback |

**Fix:** Add move-up/move-down buttons, keyboard reorder, numeric input, or tap-to-select destination.

---

### 2.5.8 Target Size (Minimum) — Level AA

| Check | Pass | Fail |
|-------|------|------|
| Minimum 24×24 CSS px | All pointer targets ≥ 24×24 px OR have 24×24 px hit area | Icon button 16×16 with no padding |
| Spacing exception | Undersized targets spaced so 24×24 circles don't overlap | Tightly packed 20px icons |

**Note:** Best practice for touch remains 44×44 px (see responsive checklist). 24×24 is WCAG minimum.

**Fix:** Increase `min-width`/`min-height` or invisible `::before` hit area. Add gap between adjacent targets.

---

### 3.2.6 Consistent Help — Level A

| Check | Pass | Fail |
|-------|------|------|
| Help mechanism placement | Help (link, icon, chat) appears in same relative order across pages | Help in header on one page, footer on another |
| Consistent labeling | Same help type uses same label ("Help", not "Support" / "?" / "Assist") | Inconsistent help affordances |

**Fix:** Define help placement in nav/layout component. Use one label and one icon.

---

### 3.3.7 Redundant Entry — Level A

| Check | Pass | Fail |
|-------|------|------|
| No re-entry of same data | Info entered earlier in multi-step flow is auto-filled or selectable | User re-types email/address on step 3 |
| Security exception documented | Password re-entry allowed where necessary | — |

**Fix:** Pass state via form/session; offer "Use shipping address as billing."

---

### 3.3.8 Accessible Authentication (Minimum) — Level AA

| Check | Pass | Fail |
|-------|------|------|
| No cognitive function test | Login does not require remembering/transcribing/rotating puzzles | "Type the 3rd character of your password" |
| Object recognition allowed | CAPTCHA with alternative (audio, token) or not required | Image-only CAPTCHA with no fallback |
| Password managers supported | `autocomplete` correct; paste allowed; no `readonly` tricks | `autocomplete="off"` on login fields |

**Fix:** WebAuthn/passkeys, magic links, OAuth; hCaptcha/reCAPTCHA with audio fallback.

---

### 3.3.9 Accessible Authentication (Enhanced) — Level AAA (aspirational)

| Check | Pass | Fail |
|-------|------|------|
| No cognitive test at all | No CAPTCHA, no puzzle | Any human-verification puzzle |

---

## Essential Existing Criteria

### 1.4.3 Contrast (Minimum) — AA

- [ ] Body text ≥ 4.5:1 against background
- [ ] Large text ≥ 3:1
- [ ] UI component boundaries and icons ≥ 3:1
- [ ] Disabled text still readable (not relied on for critical info alone)
- [ ] Placeholder text not sole label (contrast often fails — use visible labels)

### 1.4.11 Non-text Contrast — AA

- [ ] Form input borders ≥ 3:1
- [ ] Focus rings ≥ 3:1 against adjacent colors
- [ ] Chart/graphical elements conveying info ≥ 3:1

### 1.4.1 Use of Color — A

- [ ] Status (error/success/warning) not conveyed by color alone — add icon/text/pattern
- [ ] Required fields marked with text/asterisk + legend, not red border only
- [ ] Links distinguishable without color (underline or weight)

### 2.1.1 Keyboard — A

- [ ] All functionality operable via keyboard (no mouse-only paths)
- [ ] No keyboard trap (except intentional modal with Escape exit)
- [ ] Tab order follows visual/logical order
- [ ] Skip link to main content on multi-region pages

### 2.1.2 No Keyboard Trap — A

- [ ] Modals: Escape closes; focus returns to trigger
- [ ] Drawers/sheets: focus trapped inside while open

### 2.4.3 Focus Order — A

- [ ] Tab sequence matches reading order (LTR top-to-bottom)
- [ ] Off-screen elements not in tab order (`tabindex="-1"` or `hidden`)

### 2.4.7 Focus Visible — AA

- [ ] `:focus-visible` styles on all interactive elements
- [ ] Focus not removed (`outline: none` without replacement)

### 2.4.11 Focus Not Obscured — AA

- [ ] See WCAG 2.2 section above

### 4.1.2 Name, Role, Value — A

- [ ] Custom widgets have correct ARIA role
- [ ] State changes announced (`aria-expanded`, `aria-checked`, `aria-selected`)
- [ ] Live regions for dynamic updates (`aria-live="polite"` for toasts)

### ARIA Patterns

| Component | Required ARIA |
|-----------|---------------|
| Modal dialog | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` |
| Tabs | `role="tablist/tab/tabpanel"`, `aria-selected`, roving tabindex |
| Combobox | `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant` |
| Toast | `role="status"` or `role="alert"`, `aria-live` |
| Disclosure | `aria-expanded` on trigger |
| Menu | `role="menu/menuitem"`, arrow key navigation |

**Anti-patterns:** `role="button"` on `<div>` without keyboard handlers; redundant `aria-label` on visible text; `aria-hidden` on focusable children.

### Semantic HTML

- [ ] `<button>` for actions, `<a href>` for navigation (not swapped)
- [ ] `<nav>`, `<main>`, `<header>`, `<footer>`, `<aside>` landmarks present
- [ ] Single `<h1>` per page; heading levels not skipped
- [ ] `<ul>/<ol>` for lists; `<table>` with `<th scope>` for tabular data
- [ ] `<label for>` associated with every input
- [ ] Fieldsets + legends for radio/checkbox groups
- [ ] Native `<dialog>` or focus-managed equivalent

### Images

- [ ] Meaningful images: descriptive `alt` text
- [ ] Decorative images: `alt=""` or `aria-hidden="true"`
- [ ] Complex images: long description nearby or `aria-describedby`
- [ ] Icons with meaning: `aria-label` or visible text (not `title` alone)

### Forms

- [ ] Every input has visible `<label>`
- [ ] Errors linked via `aria-describedby` + `aria-invalid="true"`
- [ ] Error summary at form top for multiple errors
- [ ] Required fields: `required` + visual + text indicator
- [ ] `autocomplete` attributes set correctly
- [ ] Input `type` appropriate (`email`, `tel`, `url`)

### Links

- [ ] Link text describes destination ("View pricing", not "Click here")
- [ ] External links: indication (icon/text) + `rel="noopener"` on `target="_blank"`
- [ ] Links vs buttons visually and semantically distinct

### Headings

- [ ] One H1 per page/view
- [ ] Logical nesting (H2 → H3, no H2 → H4 skip)
- [ ] Headings describe section content (not styled divs)

### Motion & Sensory

- [ ] `prefers-reduced-motion: reduce` disables non-essential animation
- [ ] No auto-playing video/audio > 3s without user control
- [ ] No flashing content > 3 times per second

---

## Severity Mapping

| Violation | Severity |
|-----------|----------|
| Keyboard trap, no focus visible, missing form labels | CRITICAL |
| Contrast failure on primary content | CRITICAL |
| Focus obscured by sticky UI (2.4.11) | HIGH |
| Target < 24×24 px (2.5.8) | HIGH |
| Drag-only interaction (2.5.7) | HIGH |
| Missing alt on informative image | HIGH |
| Inconsistent help (3.2.6) | MEDIUM |
| Redundant entry (3.3.7) | MEDIUM |
| ARIA redundancy/incorrect role | MEDIUM |
| AAA-only gaps (2.4.12, 2.4.13, 3.3.9) | LOW (document) |
