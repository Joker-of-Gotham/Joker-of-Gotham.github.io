---
name: ui-review-gate
description: 'Final verification gate after any UI implementation. Audits visual hierarchy, accessibility (WCAG 2.2 AA), responsive behavior, and interaction state completeness. Outputs IDE-clickable file:line findings with severity levels. Use after frontend-design-engine, frontend-ui-engineering, or any manual UI modification.'
---

# UI Review Gate

Post-implementation quality gate covering visual design, accessibility, responsiveness, and state completeness.

## Trigger

- Any UI implementation is complete
- After `frontend-design-engine`, `web-design-engineer`, or `frontend-ui-engineering`
- Before PR submission for UI changes
- User requests UI quality audit

## Three Quality Pillars

### 1. Frictionless Insight-to-Action

- Can the user accomplish their goal in ≤3 interactions?
- Is there a single, clear primary CTA per viewport?
- Is information hierarchy immediately scannable?

### 2. Quality is Craft

- Do visual details match design tokens (colors, spacing, radius)?
- Is typography consistent with the defined scale?
- Are surfaces, shadows, and borders from the token system?

### 3. Trustworthy Building

- Are error messages actionable (not just "Something went wrong")?
- Is AI-generated content disclaimed where needed?
- Are destructive actions confirmed?
- Is sensitive data handled with care (masking, confirmation)?

## Seven Audit Dimensions

### 1. Layout & Composition

- Grid alignment consistency
- Spacing rhythm (consistent with scale)
- Visual weight balance
- Content hierarchy (F-pattern or Z-pattern scannable)
- Maximum content width respected

### 2. Typography

- Type scale adherence (no arbitrary sizes)
- Heading hierarchy (one H1, logical nesting)
- Line length (45-75 characters for body)
- Line height (1.4-1.6 for body, 1.1-1.3 for headings)
- Font loading (no FOUT/FOIT issues)

### 3. Color & Contrast

- WCAG AA contrast ratios (4.5:1 text, 3:1 UI)
- Semantic color usage (no raw values in components)
- Dark mode functional (if applicable)
- Color not sole information carrier

### 4. Hierarchy & Focus

- Clear primary/secondary/tertiary visual hierarchy
- One focal point per section
- Squint test passes (blur eyes, hierarchy still visible)
- Negative space used intentionally

### 5. Components & Consistency

- All components from the design system
- Consistent border-radius, shadows, spacing
- No one-off component variations without tokens
- Pattern reuse (same problem = same solution)

### 6. Interaction & States

Required for every interactive element:

| State | Present? |
|-------|----------|
| Default | Required |
| Hover | Required (desktop) |
| Active/Pressed | Required |
| Focus-visible | Required |
| Disabled | Required |
| Loading | Required (async) |
| Empty | Required (data-driven) |
| Error | Required (input/async) |
| Success | Context-dependent |

### 7. Responsive & Accessibility

- Works at 320px, 768px, 1280px minimum
- Touch targets ≥ 44x44px on mobile
- Keyboard navigation complete (Tab, Enter, Escape, Arrow)
- Screen reader landmarks (nav, main, aside, footer)
- prefers-reduced-motion respected
- prefers-color-scheme supported (if dark mode)
- Focus not obscured by fixed elements (WCAG 2.2)

## Output Format

```
## [filename]

[file]:[line] - [CRITICAL] Finding description
[file]:[line] - [HIGH] Finding description
[file]:[line] - [MEDIUM] Finding description
[file]:[line] - [LOW] Finding description
```

### Severity Definitions

| Level | Meaning | Action |
|-------|---------|--------|
| CRITICAL | Unusable or inaccessible | Must fix before shipping |
| HIGH | Significantly degrades quality | Should fix before shipping |
| MEDIUM | Noticeable quality gap | Fix when possible |
| LOW | Minor polish opportunity | Nice to have |

## Verification Checklist

After review, confirm:
- [ ] No CRITICAL findings remain
- [ ] All HIGH findings addressed or documented
- [ ] Token compliance verified
- [ ] States coverage confirmed
- [ ] Responsive at 3 breakpoints
- [ ] Keyboard navigation tested
- [ ] Contrast ratios passing

## References

- [checklist-visual.md](references/checklist-visual.md) -- Visual hierarchy rules
- [checklist-a11y.md](references/checklist-a11y.md) -- WCAG 2.2 AA specifics
- [checklist-responsive.md](references/checklist-responsive.md) -- Container queries + responsive
- [checklist-states.md](references/checklist-states.md) -- Interaction state matrix

## Constraints

- This skill does not fix issues -- it identifies them
- Findings must be specific (file + line + what's wrong + why)
- Do not report style preferences as CRITICAL
- Accessibility violations are always HIGH or CRITICAL
- If no browser tools available, do litmus-check review from code alone
