---
name: vercel-web-design-guidelines
description: >-
  Review UI code against 100+ Web Interface Guidelines from Vercel. Covers
  accessibility, focus states, forms, animation, typography, performance,
  navigation, touch, safe areas, dark mode, i18n, hydration, and anti-patterns.
  Outputs terse file:line findings. Use when reviewing React/Next.js UI, web
  components, or when the user asks for Vercel-style interface guidelines review.
  Source: vercel-labs/agent-skills.
---

# Vercel Web Design Guidelines Review

Systematic UI code review against Vercel's Web Interface Guidelines — 100+ rules organized into actionable categories. Optimized for terse, location-specific findings.

## When to Use

- PR review of UI components or pages
- Pre-launch web interface audit
- Next.js / React component quality check
- Complementing visual review with code-level guideline checks

---

## Review Workflow

```
1. Identify files in scope (components, pages, styles, layouts)
2. Read code — do not rely on assumptions
3. Evaluate each applicable category below
4. Record violations as file:line findings
5. Group by category in output
6. Skip N/A rules — only report actual violations
```

Prioritize **Accessibility**, **Focus States**, and **Hydration Safety** first — these have the highest user impact.

---

## Guideline Categories

### Accessibility

- Semantic HTML (`button` not `div` for actions, `nav`, `main`, `article`)
- ARIA only when HTML semantics are insufficient
- Alt text on meaningful images; decorative images use `alt=""`
- Color is not the only indicator of state
- `prefers-reduced-motion` respected
- Skip links for keyboard users
- Heading hierarchy is logical (no skipped levels)

### Focus States

- Visible focus ring on all interactive elements
- `:focus-visible` preferred over bare `:focus`
- Focus trap in modals/dialogs with escape to close
- Focus restored after modal close
- No `outline: none` without replacement indicator

### Forms

- Labels associated with inputs (`htmlFor` / `for`)
- Error messages linked via `aria-describedby`
- Autocomplete attributes where applicable
- Submit on Enter; explicit submit buttons
- Disabled submit during async operations
- Input types match data (`email`, `tel`, `url`)

### Animation

- Animations under 300ms for micro-interactions
- `prefers-reduced-motion: reduce` disables non-essential motion
- No layout-triggering animations (prefer `transform`, `opacity`)
- Loading states for async operations

### Typography

- `font-display: swap` or `optional` for web fonts
- `text-wrap: balance` on headings where supported
- Minimum 16px body text on mobile
- Line length 45–75 characters for readability
- `…` not `...`; curly quotes in user-facing copy

### Content Handling

- Truncation with tooltip or expand for critical content
- Empty states with guidance
- Skeleton loaders match final layout
- Long content scrolls; no fixed-height text clipping

### Images

- Explicit `width` and `height` to prevent CLS
- `loading="lazy"` below fold
- `fetchpriority="high"` for LCP image
- Responsive images with `srcset` / `sizes`
- Modern formats (WebP/AVIF) with fallbacks

### Performance

- No render-blocking scripts without `defer`/`async`
- Code-split heavy components
- Avoid layout thrashing in effects
- Minimize client-side JavaScript for static content

### Navigation & State

- URL reflects navigable state (filters, tabs, pagination)
- Back button works predictably
- Loading indicators for route transitions
- Breadcrumbs on deep hierarchies

### Touch & Interaction

- Minimum 44×44px touch targets
- Adequate spacing between adjacent tap targets
- No hover-only critical functionality
- `touch-action` set appropriately for custom gestures

### Safe Areas

- `env(safe-area-inset-*)` on fixed/sticky elements
- Content not hidden behind notches or home indicators

### Dark Mode

- `color-scheme` meta or CSS property set
- Images/icons adapt or have dark variants
- Elevation via borders/surface tokens, not just shadow

### Locale / i18n

- `lang` attribute on `<html>`
- No hardcoded strings in components (use i18n keys)
- RTL layout support where required
- Locale-aware date/number formatting

### Hydration Safety

- No `window`/`document` access during SSR without guards
- `suppressHydrationWarning` only when intentional
- Client-only components marked explicitly
- Random IDs stable across server/client renders

### Hover States

- Hover styles on interactive elements only
- Hover supplements, never replaces, visible state
- Touch devices: no sticky hover states

### Anti-patterns

- `user-scalable=no` or `maximum-scale=1` (accessibility violation)
- `onClick` on non-interactive elements without keyboard support
- Inline `style` for responsive layout (use CSS/Tailwind)
- `key={index}` on dynamic lists
- Portal modals without focus management
- Autoplay video with sound
- `target="_blank"` without `rel="noopener noreferrer"`

---

## Output Format

Terse findings only. No preamble essays.

```
## vercel-web-design-guidelines

### Accessibility
src/components/Card.tsx:42 - div with onClick, use button element
src/app/page.tsx:18 - img missing alt attribute

### Focus States
src/components/Modal.tsx:67 - outline: none without focus-visible replacement

### Forms
src/components/LoginForm.tsx:23 - input missing associated label

### Animation
src/components/Hero.tsx:91 - no prefers-reduced-motion media query

### [Category]
path/file.ext:line - terse violation description
```

**Rules:**
- One finding per line
- Format: `path:line - description`
- Description ≤ 15 words
- Only report violations, not passes
- Use project-relative paths
- Omit empty categories

---

## Severity Guidance (Optional Annotation)

Append severity when user requests prioritized output:

- `[critical]` — accessibility blockers, hydration crashes, security
- `[high]` — focus, forms, performance regressions
- `[medium]` — typography, animation, touch targets
- `[low]` — polish, anti-pattern style issues

Default output is category-grouped file:line only.

---

## Constraints

- Read actual source files — never hallucinate line numbers
- Report only confirmed violations
- Skip framework-internal files unless user includes them
- Tailwind/class-based styles: cite the file containing the class usage
- Pair with visual review for issues code cannot detect (subjective hierarchy, brand alignment)
- Do not refactor code unless user requests fixes — review only by default

---

## Source

Adapted from **vercel-labs/agent-skills** Web Interface Guidelines. Categories and rules reflect Vercel's interface engineering standards for production web applications.
