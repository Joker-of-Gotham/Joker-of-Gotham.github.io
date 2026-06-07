---
name: frontend-redesign-orchestrator
description: 'Full-flow orchestrator for frontend design work. Chains design-brief-gate → visual-direction-picker → design-system-governor → implementation skill → ui-review-gate → fix → report. Use when starting a redesign, new UI, or multi-step frontend project. Requires explicit invocation only.'
disable-model-invocation: true
---

# Frontend Redesign Orchestrator

End-to-end pipeline for approved frontend design work. This skill coordinates other skills — it does not implement UI directly.

## Trigger

Invoke explicitly when:
- User requests full redesign or new UI from scratch
- Multi-step project needs gated design workflow
- User says "run the design pipeline" or "orchestrate the frontend work"

Do NOT auto-invoke. User or parent agent must name this skill.

---

## Pipeline Overview

```
┌─────────────────┐
│ design-brief-   │  Gate: confirm 8 brief items
│ gate            │  → Design Brief summary + user approval
└────────┬────────┘
         ▼
┌─────────────────┐
│ visual-direction│  If direction vague: 3 options → user picks
│ -picker         │  If direction clear: skip
└────────┬────────┘
         ▼
┌─────────────────┐
│ design-system-  │  Ensure DESIGN.md + tokens exist
│ governor        │  Create / extend / enforce mode
└────────┬────────┘
         ▼
┌─────────────────┐
│ Implementation  │  Select by deliverable type (see below)
│ skill           │
└────────┬────────┘
         ▼
┌─────────────────┐
│ ui-review-gate  │  Audit → file:line findings
└────────┬────────┘
         ▼
┌─────────────────┐
│ Fix loop        │  Resolve CRITICAL + HIGH findings
└────────┬────────┘
         ▼
┌─────────────────┐
│ Report          │  Structured delivery report
└─────────────────┘
```

---

## Phase 1: Design Brief Gate

**Skill:** `design-brief-gate`

1. Verify 8 required items (product, users, context, direction, brand, references, stack, freedom)
2. If 3+ missing → ask 2–3 targeted questions
3. If "you decide" → hand off to `visual-direction-picker` before proceeding
4. Output Design Brief; **stop until user confirms**

**Exit criteria:** User-approved Design Brief document.

---

## Phase 2: Visual Direction Picker

**Skill:** `visual-direction-picker`

**Skip when:** Brief includes explicit aesthetic direction + user confirmation.

**Run when:** Direction missing, vague, or user delegated choice.

1. Propose Direction A (safe), B (expressive), C (experimental)
2. User selects or explicitly authorizes autonomous pick
3. Record chosen direction in Design Brief

**Exit criteria:** Confirmed visual direction recorded.

---

## Phase 3: Design System Governor

**Skill:** `design-system-governor`

1. Scan for `DESIGN.md`, `design-system/MASTER.md`, tokens, shadcn config
2. Select mode: **Create** | **Extend** | **Enforce**
3. Generate or update:
   - `DESIGN.md` (12 sections)
   - `design-system/MASTER.md`
   - CSS custom properties + Tailwind `@theme` if applicable
4. Verify contrast, fluid type, dark mode tokens

**Exit criteria:** Token system exists; no unapproved hardcoded values in new work.

---

## Phase 4: Implementation Skill Selection

Select **one primary** implementation skill based on deliverable type. Combine with secondary skills only when brief requires.

| Deliverable Type | Primary Skill | Secondary (optional) |
|------------------|---------------|----------------------|
| **HTML artifact** (static page, email, prototype) | `html-effectiveness` | `anthropic-frontend-design`, `web-design-engineer` |
| **Presentation / deck** | `frontend-slides` | `visual-direction-picker` (if not run) |
| **Product site** (landing, marketing, homepage) | `web-design-engineer` | `shadcn-blocks`, `site-design-loop` |
| **React app** (SaaS, dashboard, admin) | `frontend-ui-engineering` | `shadcn-official`, `product-design-intake` |
| **Figma** (design files, tokens, components) | `figma-design-system-rules` | `figma-implement-design` (if code export needed) |
| **Stitch** (Google Stitch UI) | `stitch-enhance-prompt` → `stitch-react-components` | `stitch-design-md`, `stitch-taste-design` |

### Selection Logic

```
IF deliverable == "presentation" OR "slides" OR "deck"
  → frontend-slides

ELSE IF deliverable == "figma" OR output == "design file only"
  → figma-design-system-rules

ELSE IF deliverable == "stitch" OR tool == "google stitch"
  → stitch-enhance-prompt then stitch-react-components

ELSE IF stack includes React/Next AND (dashboard OR app OR SaaS OR admin)
  → frontend-ui-engineering + shadcn-official

ELSE IF stack includes React/Next AND (landing OR marketing OR homepage)
  → web-design-engineer OR site-design-loop

ELSE IF stack == HTML/CSS OR static OR email
  → html-effectiveness

ELSE IF product complexity high (IA, permissions, data density)
  → product-design-intake FIRST, then frontend-ui-engineering

ELSE
  → web-design-engineer (default)
```

### Implementation Rules

- Read `DESIGN.md` and `design-system/MASTER.md` before writing code
- Use existing tokens — never invent colors/spacing in components
- Use shadcn MCP for React component scaffolding when stack includes shadcn
- Implement all required interaction states (see `ui-review-gate/references/checklist-states.md`)

**Exit criteria:** Deliverable implemented per brief and design system.

---

## Phase 5: UI Review Gate

**Skill:** `ui-review-gate`

1. Run all four reference checklists:
   - `checklist-visual.md`
   - `checklist-a11y.md`
   - `checklist-responsive.md`
   - `checklist-states.md`
2. Output findings as `file:line - [SEVERITY] description`
3. Browser screenshot verification when tools available

**Exit criteria:** Zero CRITICAL findings; HIGH findings addressed or documented.

---

## Phase 6: Fix Loop

1. Fix all CRITICAL findings
2. Fix all HIGH findings (or document accepted exceptions in report)
3. Re-run `ui-review-gate` on changed files
4. Max 3 fix iterations — escalate unresolved CRITICAL to user

**Do not skip:** Accessibility and focus-visible fixes.

---

## Phase 7: Delivery Report

Output:

```markdown
## Frontend Redesign Report

### Summary
[1–2 sentences: what was built and for whom]

### Design Brief
[Link or inline approved brief]

### Visual Direction
[Chosen direction + key decisions]

### Design System
- DESIGN.md: [created | updated | existing]
- Tokens: [list key files]
- Mode: [create | extend | enforce]

### Implementation
- Skill used: [primary skill name]
- Files changed: [count + key paths]
- Components added/modified: [list]

### Review Results
- CRITICAL fixed: [n]
- HIGH fixed: [n]
- MEDIUM deferred: [n] (with rationale)
- LOW deferred: [n]

### Verification
- [ ] Breakpoints tested: 320 / 768 / 1280 / 1920
- [ ] Keyboard navigation verified
- [ ] WCAG 2.2 AA checklist passed
- [ ] All interaction states present
- [ ] Token compliance confirmed

### Known Limitations
[Anything deferred or out of scope]

### Next Steps
[Recommended follow-ups]
```

---

## Hard Stops

Never proceed without:
1. Approved Design Brief (Phase 1)
2. Confirmed visual direction when vague (Phase 2)
3. DESIGN.md existence for non-trivial UI (Phase 3)

Never ship with:
- Unresolved CRITICAL review findings
- Unapproved brand/color/typography decisions

---

## Skill Invocation Map

| Phase | Skill | Required |
|-------|-------|----------|
| 1 | `design-brief-gate` | Always |
| 2 | `visual-direction-picker` | If direction unclear |
| 3 | `design-system-governor` | Always |
| 4 | Implementation (see table) | Always |
| 5 | `ui-review-gate` | Always |
| 6 | Fix (manual) | If findings exist |
| 7 | Report (this skill) | Always |

---

## Constraints

- Orchestrator does not write UI code — delegates to implementation skills
- Each phase logs completion before next phase starts
- User may skip Phase 2 if brief is complete
- Small scoped changes (single button color) → use `design-brief-gate` judgment; do not force full pipeline
