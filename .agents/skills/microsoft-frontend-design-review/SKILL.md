---
name: microsoft-frontend-design-review
description: >-
  Review frontend UI against Microsoft design quality pillars or generate creative
  frontend designs. Two modes: Design Review (findings with severity) and Creative
  Frontend Design. Covers frictionless insight-to-action, craft quality, and
  trustworthy building. Use when auditing Microsoft-style products, Copilot UIs,
  enterprise dashboards, or when the user asks for a Microsoft design review.
  Source: microsoft/skills.
---

# Microsoft Frontend Design Review

Dual-mode skill for evaluating existing UI or producing new creative frontend work aligned with Microsoft design quality standards.

## Modes

| Mode | When to Use | Output |
|------|-------------|--------|
| **Design Review** | Auditing existing UI, PR review, pre-launch QA | Findings with severity |
| **Creative Frontend Design** | Greenfield screens, redesigns, new flows | High-fidelity implementation |

Select mode from user intent. Default to **Design Review** when reviewing code or screenshots.

---

## Three Quality Pillars

### 1. Frictionless Insight-to-Action

Users should reach their goal in minimal steps with clear affordances.

- **≤3 interactions** from insight to primary action for core tasks
- **Single primary CTA** per view — one unmistakable next step
- Progressive disclosure for secondary actions
- Empty states guide users toward action, not dead ends
- Loading and skeleton states preserve context

**Review questions:**
- Can the user complete the primary task in ≤3 clicks/taps?
- Is there exactly one visually dominant primary action?
- Are secondary actions visually subordinate?

### 2. Quality is Craft

Pixel-level care, systematic tokens, and accessibility compliance.

- **Design tokens** — colors, spacing, typography, radii, shadows from a defined system
- **Figma match** — spacing, type scale, component states align with design specs
- **WCAG 2.1 Level A/AA** — contrast ratios, focus indicators, keyboard navigation, ARIA labels
- Consistent component states: default, hover, focus, active, disabled, error
- No magic numbers — values trace to tokens

**Review questions:**
- Do hardcoded values diverge from the design system?
- Do focus rings meet 3:1 contrast against adjacent colors?
- Are error and success states visually and semantically distinct?

### 3. Trustworthy Building

Especially critical for AI-assisted and data-driven interfaces.

- **AI disclaimers** — when output is generated, uncertain, or may be wrong
- **Actionable errors** — tell users what happened and how to fix it
- Confidence indicators for probabilistic content
- Source attribution where data is aggregated
- Undo/revert for destructive or AI-generated changes
- No blame language in error copy

**Review questions:**
- Does AI-generated content have appropriate disclaimers?
- Do error messages include a recovery path?
- Can users verify or correct AI suggestions?

---

## Design Review Workflow

```
1. Gather context (screenshots, code, Figma refs, user flows)
2. Map UI to the three pillars
3. Evaluate each pillar with checklist questions
4. Assign severity to every finding
5. Prioritize fixes (Critical → High → Medium → Low)
6. Output structured findings report
```

### Severity Levels

| Severity | Definition | Action |
|----------|------------|--------|
| **Critical** | Blocks task completion, WCAG failure, trust/safety risk | Must fix before ship |
| **High** | Violates pillar principle, significant UX friction | Fix in current sprint |
| **Medium** | Inconsistency, minor friction, token drift | Fix soon |
| **Low** | Polish, micro-copy, nice-to-have alignment | Backlog |

---

## Creative Frontend Design Workflow

```
1. Detect existing design system (tokens, components, patterns)
2. Define user goal and primary CTA (≤3 interaction path)
3. Apply design tokens — no orphan values
4. Build accessible components (WCAG 2.1 A/AA)
5. Add AI/trust patterns if applicable
6. Verify against all three pillars before delivery
```

When an existing design system is detected, extend it — do not override with greenfield aesthetics.

---

## Output Format (Design Review)

```markdown
# Microsoft Design Review — [Component/Page Name]

**Mode:** Design Review
**Reviewed:** [date or commit]
**Pillar summary:** Insight-to-Action [pass/issues] | Craft [pass/issues] | Trust [pass/issues]

## Findings

### [SEVERITY] Finding title
- **Pillar:** Frictionless Insight-to-Action | Quality is Craft | Trustworthy Building
- **Location:** `path/to/file:line` or screen/flow name
- **Issue:** [What is wrong]
- **Impact:** [Why it matters to users]
- **Recommendation:** [Specific fix]

### [SEVERITY] Finding title
...

## Summary
- Critical: N | High: N | Medium: N | Low: N
- Top 3 priorities: 1. ... 2. ... 3. ...
```

Severity tags: `[CRITICAL]`, `[HIGH]`, `[MEDIUM]`, `[LOW]`

---

## Output Format (Creative Frontend Design)

Deliver working code (HTML/CSS/JS or project stack) plus a brief design rationale:

```markdown
# Design Rationale — [Screen Name]

**Primary CTA:** [action]
**Interaction path:** [step 1 → step 2 → step 3]
**Tokens used:** [list key tokens]
**Accessibility:** [WCAG notes]
**Trust patterns:** [disclaimers, error handling, if applicable]
```

---

## Constraints

- Always evaluate all three pillars in Design Review mode
- Findings must include severity — never output undifferentiated bullet lists
- Creative mode must respect existing design systems when present
- WCAG 2.1 A/AA is mandatory, not optional
- AI-generated or probabilistic UI must include trust patterns
- Primary CTA rule applies per viewport/screen, not per component library
- Do not conflate aesthetic preference with pillar violations — tie findings to pillar criteria

---

## Acknowledgments

This skill adapts design quality principles from **microsoft/skills**. Quality pillars (Frictionless Insight-to-Action, Quality is Craft, Trustworthy Building) reflect Microsoft's frontend design review framework for enterprise and Copilot experiences.
