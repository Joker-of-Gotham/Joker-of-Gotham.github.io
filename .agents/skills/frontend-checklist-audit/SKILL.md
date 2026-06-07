---
name: frontend-checklist-audit
description: >-
  Pre-launch audit against 80 condensed frontend design rules from the Front-End
  Checklist. Categories: HTML, SEO, Performance, Accessibility, Typography,
  Images, CSS, JavaScript. Findings prioritized High/Medium/Low. Use before
  shipping a site, during launch readiness review, or when the user asks for a
  frontend checklist audit. Source: thedaviddias/Front-End-Checklist (adapted).
---

# Frontend Checklist Audit

Condensed pre-launch audit derived from the Front-End Checklist — 80 core rules across 8 categories. Designed for launch-readiness gates, not exhaustive compliance certification.

## When to Use

- Pre-launch / go-live readiness review
- New site or major release QA
- Complementing code review with production checklist
- Client handoff quality gate

---

## Audit Workflow

```
1. Identify project type (static site, SPA, SSR, etc.)
2. Gather artifacts (HTML, CSS, JS, config, sitemap, analytics)
3. Evaluate each category — mark Pass / Fail / N/A
4. Assign priority to every failure
5. Output checklist report with actionable fixes
```

Read actual project files. Mark **N/A** with justification for inapplicable rules.

---

## Category 1: HTML Basics (10 rules)

| # | Rule | Priority |
|---|------|----------|
| 1 | Valid HTML5 doctype | High |
| 2 | `lang` attribute on `<html>` | High |
| 3 | Semantic elements (`header`, `main`, `footer`, `nav`, `article`) | High |
| 4 | Logical heading hierarchy (single `h1`, no skipped levels) | High |
| 5 | Meta charset UTF-8 declared first in `<head>` | High |
| 6 | Viewport meta tag present | High |
| 7 | No inline styles for layout (use stylesheets) | Medium |
| 8 | Favicon and app icons linked | Medium |
| 9 | `rel="noopener noreferrer"` on `target="_blank"` links | High |
| 10 | No deprecated elements (`<center>`, `<font>`, etc.) | Medium |

---

## Category 2: SEO (10 rules)

| # | Rule | Priority |
|---|------|----------|
| 11 | Unique, descriptive `<title>` per page (50–60 chars) | High |
| 12 | Meta description per page (150–160 chars) | High |
| 13 | Canonical URLs set | High |
| 14 | `robots.txt` present and correct | Medium |
| 15 | XML sitemap submitted | Medium |
| 16 | Open Graph tags (`og:title`, `og:description`, `og:image`) | Medium |
| 17 | Structured data (JSON-LD) where applicable | Low |
| 18 | Clean, readable URLs (no session IDs) | Medium |
| 19 | `hreflang` for multilingual sites | High |
| 20 | No duplicate content without canonical | High |

---

## Category 3: Performance (10 rules)

| # | Rule | Priority |
|---|------|----------|
| 21 | LCP under 2.5s (lab or field estimate) | High |
| 22 | CLS under 0.1 | High |
| 23 | INP under 200ms | High |
| 24 | Minified CSS and JS in production | Medium |
| 25 | Gzip/Brotli compression enabled | High |
| 26 | HTTP/2 or HTTP/3 | Medium |
| 27 | Critical CSS inlined or prioritized | Medium |
| 28 | JS deferred or async where possible | High |
| 29 | CDN for static assets | Low |
| 30 | Resource hints (`preconnect`, `preload` for LCP) | Medium |

---

## Category 4: Accessibility (10 rules)

| # | Rule | Priority |
|---|------|----------|
| 31 | All images have appropriate `alt` text | High |
| 32 | Color contrast WCAG AA (4.5:1 text, 3:1 large) | High |
| 33 | Keyboard navigable — all interactive elements reachable | High |
| 34 | Visible focus indicators | High |
| 35 | Form labels associated with inputs | High |
| 36 | ARIA used correctly (not as HTML replacement) | Medium |
| 37 | Skip navigation link | Medium |
| 38 | No autoplaying media with sound | High |
| 39 | `prefers-reduced-motion` respected | Medium |
| 40 | Page tested with screen reader basics | Medium |

---

## Category 5: Typography (10 rules)

| # | Rule | Priority |
|---|------|----------|
| 41 | Minimum 16px body font on mobile | High |
| 42 | Maximum 2–3 font families | Medium |
| 43 | Web fonts use `font-display: swap` | High |
| 44 | Line height 1.4–1.6 for body text | Medium |
| 45 | Line length 45–75 characters | Medium |
| 46 | No more than 3 font weights in use | Low |
| 47 | System font fallback stack defined | Medium |
| 48 | Hyphenation or `text-wrap` for long headings | Low |
| 49 | Proper ellipsis (`…`) not three periods | Low |
| 50 | No justified text on narrow viewports | Medium |

---

## Category 6: Images (10 rules)

| # | Rule | Priority |
|---|------|----------|
| 51 | Explicit `width` and `height` on images | High |
| 52 | Responsive images (`srcset`, `sizes`) | High |
| 53 | Modern formats (WebP/AVIF) with fallback | Medium |
| 54 | Lazy loading below fold (`loading="lazy"`) | High |
| 55 | LCP image prioritized (`fetchpriority="high"`) | High |
| 56 | SVGs optimized (no embedded raster bloat) | Medium |
| 57 | Decorative images use `alt=""` | High |
| 58 | Icons have accessible labels when standalone | High |
| 59 | Retina assets at appropriate resolution (not oversized) | Medium |
| 60 | Sprite sheets or icon system for repeated icons | Low |

---

## Category 7: CSS (10 rules)

| # | Rule | Priority |
|---|------|----------|
| 61 | Mobile-first media queries | Medium |
| 62 | No `!important` abuse | Medium |
| 63 | CSS custom properties for theme values | Medium |
| 64 | Print stylesheet or `@media print` | Low |
| 65 | No universal selector performance traps | Low |
| 66 | Flexbox/Grid for layout (not float hacks) | Medium |
| 67 | `box-sizing: border-box` global | Medium |
| 68 | Vendor prefixes only where still needed | Low |
| 69 | Unused CSS removed in production | Medium |
| 70 | Dark mode styles if dark mode offered | Medium |

---

## Category 8: JavaScript (10 rules)

| # | Rule | Priority |
|---|------|----------|
| 71 | No console.log in production | Medium |
| 72 | Errors handled gracefully (try/catch, boundaries) | High |
| 73 | No render-blocking scripts in `<head>` without defer | High |
| 74 | Feature detection over browser sniffing | Medium |
| 75 | CSP headers configured | High |
| 76 | Third-party scripts audited and minimized | High |
| 77 | No document.write | High |
| 78 | Event listeners cleaned up on unmount | Medium |
| 79 | Bundle size reasonable (code splitting) | Medium |
| 80 | Progressive enhancement — core content without JS | Medium |

---

## Priority Definitions

| Priority | Meaning | Launch gate |
|----------|---------|-------------|
| **High** | Launch blocker or significant user/SEO/security impact | Must fix |
| **Medium** | Quality gap, fix before or shortly after launch | Should fix |
| **Low** | Polish, optimization opportunity | Nice to have |

---

## Output Format

```markdown
# Frontend Checklist Audit — [Project Name]

**Date:** YYYY-MM-DD
**Project type:** [static / SPA / SSR / etc.]
**Readiness:** 🟢 Ready / 🟡 Conditional / 🔴 Not ready

## Summary

| Category | Pass | Fail | N/A |
|----------|------|------|-----|
| HTML Basics | 8 | 2 | 0 |
| SEO | ... | ... | ... |
| ... | | | |

**Totals:** 62 Pass | 14 Fail | 4 N/A
**High priority failures:** 5

## Failures

### [HIGH] #31 — Images missing alt text
- **Category:** Accessibility
- **Location:** `src/components/Hero.tsx`, `public/index.html:45`
- **Fix:** Add descriptive alt to 3 images in hero and footer

### [MEDIUM] #64 — No print stylesheet
- **Category:** CSS
- **Fix:** Add `@media print` rules hiding nav and expanding content

## Launch Recommendation

[1-2 sentences: ready or blocked, top 3 fixes required]

## Passed Highlights

- [Optional: note strong areas]
```

---

## Constraints

- Audit against project reality — mark N/A with reason, not Fail
- High-priority failures block "Ready" status
- Cite file paths for every failure when possible
- This is a condensed 80-rule subset, not the full Front-End Checklist
- Do not claim Lighthouse scores without running or user-provided data — estimate with caveat
- Review only by default; fix only when user requests

---

## Source

Adapted from **thedaviddias/Front-End-Checklist**. Condensed to 80 core rules for agent-efficient pre-launch audits. Full checklist at [github.com/thedaviddias/Front-End-Checklist](https://github.com/thedaviddias/Front-End-Checklist).
