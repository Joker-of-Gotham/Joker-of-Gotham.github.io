---
name: design-review-visual
description: >-
  Visual QA across 7 dimensions: layout, typography, spacing, color, hierarchy,
  consistency, and interaction/responsive. Includes squint test, dark mode check,
  and semantic token audit. Outputs structured markdown artifact with severity
  levels. Use when reviewing UI screenshots, live pages, or design implementations
  for visual quality. Source: jezweb/claude-skills (adapted).
---

# Design Review — Visual QA

Seven-dimension visual quality assessment for implemented UI. Use browser screenshots or live page inspection when available.

## When to Use

- Post-implementation visual verification
- Comparing implementation to design specs
- Pre-launch visual polish audit
- Regression check after CSS/theme changes

---

## Review Workflow

```
1. Capture current state (screenshot at desktop + mobile breakpoints)
2. Run squint test on each viewport
3. Evaluate all 7 dimensions
4. Run dark mode check (if applicable)
5. Run semantic token audit
6. Assign severity per finding
7. Write structured .md artifact
```

Use Cursor browser MCP tools (`browser_navigate`, `browser_take_screenshot`, `browser_snapshot`) when reviewing live pages.

---

## Seven Dimensions

### 1. Layout

- Grid alignment — elements snap to consistent columns
- No orphaned elements floating without visual anchor
- Content density appropriate for viewport
- Fixed/sticky elements do not obscure content
- Scroll behavior is intentional (no horizontal scroll on mobile)

### 2. Typography

- Type scale is consistent (not arbitrary font sizes)
- Line height readable (1.4–1.6 for body)
- Font weights used purposefully (not more than 3 weights)
- No truncated headings mid-word without intent
- Letter-spacing appropriate for size and case

### 3. Spacing

- Spacing follows a scale (4px/8px base or design tokens)
- Related elements grouped with tighter spacing
- Sections separated with consistent rhythm
- Padding inside containers matches sibling containers
- No cramped or excessively loose areas

### 4. Color

- Sufficient contrast for text (WCAG AA: 4.5:1 body, 3:1 large)
- Accent color used sparingly and consistently
- Background/surface hierarchy is clear
- No clashing hues in adjacent elements
- State colors (error, success, warning) are distinct

### 5. Hierarchy

- One clear focal point per viewport
- Primary content visually dominant over chrome
- Secondary information appropriately subdued
- CTA buttons stand out from secondary actions
- Information order matches importance

### 6. Consistency

- Same component types look identical across pages
- Border radii, shadows, borders follow system
- Icon style uniform (stroke width, size, style)
- Interaction patterns repeat predictably
- Copy tone and casing consistent

### 7. Interaction & Responsive

- Hover/focus/active states visible and distinct
- Touch targets adequate on mobile (≥44px)
- Layout adapts gracefully at breakpoints
- No content overflow or broken layouts at 375px and 1440px
- Transitions feel intentional, not jarring

---

## Special Checks

### Squint Test

Blur vision or squint at the screenshot:

- Is hierarchy still obvious?
- Do related items cluster visually?
- Does anything compete with the primary focal point?

Fail squint test → at least one **High** finding on Hierarchy or Layout.

### Dark Mode Check

When dark mode exists:

- Surfaces have sufficient elevation distinction
- Text contrast maintained in dark palette
- Images/icons have appropriate dark variants
- Borders replace lost shadow definition
- No pure `#000`/`#fff` harsh extremes unless intentional

### Semantic Token Audit

Verify styles trace to semantic tokens, not raw values:

| Check | Pass | Fail |
|-------|------|------|
| Colors use `--color-*` or theme tokens | ✓ | Hardcoded hex scattered |
| Spacing uses scale tokens | ✓ | Random `margin: 13px` |
| Typography uses type tokens | ✓ | Inline `font-size: 17px` |
| Shadows/radii from system | ✓ | One-off `box-shadow` |

Report token drift as **Medium** or **High** depending on scope.

---

## Severity Levels

| Level | Criteria | Example |
|-------|----------|---------|
| **Critical** | Unusable, illegible, broken layout | Text unreadable, overlapping elements |
| **High** | Clear visual defect affecting UX | Wrong hierarchy, failed squint test |
| **Medium** | Inconsistency or polish gap | Token drift, uneven spacing |
| **Low** | Minor refinement | 2px misalignment, subtle color variance |

---

## Output Format

Write a structured markdown artifact (save as `design-review-[page]-[date].md` when file output is requested):

```markdown
# Visual Design Review — [Page/Component]

**Date:** YYYY-MM-DD
**Viewports reviewed:** Desktop (1440px), Mobile (375px)
**Dark mode:** Yes / No / N/A
**Squint test:** Pass / Fail

## Scorecard

| Dimension | Status | Severity |
|-----------|--------|----------|
| Layout | ⚠ Issues | High |
| Typography | ✓ Pass | — |
| Spacing | ⚠ Issues | Medium |
| Color | ✓ Pass | — |
| Hierarchy | ✗ Fail | High |
| Consistency | ⚠ Issues | Medium |
| Interaction & Responsive | ✓ Pass | — |

## Findings

### [HIGH] Primary CTA competes with hero image
- **Dimension:** Hierarchy
- **Location:** Hero section, desktop viewport
- **Observation:** CTA and hero illustration share visual weight
- **Recommendation:** Reduce illustration saturation or increase CTA contrast/size

### [MEDIUM] Inconsistent card padding
- **Dimension:** Spacing
- **Location:** Feature cards row 2
- **Observation:** 16px vs 24px padding between siblings
- **Recommendation:** Apply `spacing.card-padding` token uniformly

## Token Audit

| Token category | Status | Notes |
|----------------|--------|-------|
| Color | ⚠ Drift | 3 hardcoded hex values in hero |
| Spacing | ✓ | Consistent scale |
| Typography | ✓ | Type scale followed |

## Dark Mode (if applicable)

- [Finding or "No issues detected"]

## Priority Actions

1. [Highest impact fix]
2. [Second priority]
3. [Third priority]

## Summary

- Critical: 0 | High: 2 | Medium: 1 | Low: 0
- Overall: **Needs work** / **Acceptable** / **Polished**
```

---

## Constraints

- Base findings on observed evidence (screenshots, live page) — not assumptions
- Review at minimum two viewports: mobile (375px) and desktop (1440px)
- Separate aesthetic preference from measurable defects
- Every finding must map to one of the 7 dimensions
- Squint test and token audit are mandatory sections
- Do not mark **Polished** if any High or Critical findings remain open

---

## Source

Adapted from **jezweb/claude-skills** visual design review patterns. Seven-dimension framework and squint test methodology from jezweb's design QA workflow.
