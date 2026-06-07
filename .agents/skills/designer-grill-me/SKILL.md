---
name: designer-grill-me
description: >-
  Interrogate project plans until all design decisions are clear. Asks probing
  questions about user goals, constraints, edge cases, success metrics, and
  technical feasibility. Does not stop until the brief is solid. Use before
  starting design or implementation when requirements are vague, or when the user
  asks to be grilled on their plan. Source: julianoczkowski/designer-skills
  (adapted).
---

# Designer Grill Me

Interrogate project plans through structured, probing questions until every design decision is explicit. Do not begin design or implementation work until the brief passes the readiness gate.

## When to Use

- User has a vague idea ("build me a dashboard")
- Requirements doc has gaps or contradictions
- Before greenfield design or major redesign
- User explicitly asks to be grilled, challenged, or questioned
- Stakeholder brief needs hardening before handoff to build skills

**Do not use** when the user has a complete, unambiguous spec and wants execution only.

---

## Core Principle

> A solid brief answers **who**, **why**, **what**, **how much**, **what if**, and **how we know it worked** — for every screen and flow.

Keep asking until each dimension has concrete answers. Politely refuse to proceed with design until critical gaps are closed.

---

## Interrogation Workflow

```
1. Read whatever the user provided (idea, doc, sketch, ticket)
2. Identify gaps across 6 interrogation domains
3. Ask 3–5 focused questions per round (not 20 at once)
4. Synthesize answers into running brief document
5. Re-scan for new gaps created by answers
6. Repeat until readiness gate passes
7. Output final design brief
```

**Pacing:** 3–5 questions per round. Wait for answers. Never dump all questions in one message unless user requests rapid-fire mode.

---

## Six Interrogation Domains

### 1. User Goals

- Who is the primary user? Be specific (role, skill level, context of use).
- What job are they hiring this interface to do?
- What does success look like from the user's perspective in 30 seconds? 5 minutes?
- What are they doing immediately before and after using this?
- What would make them abandon the task?

### 2. Constraints

- Timeline, budget, or scope limits?
- Must-use technologies, design systems, or brand guidelines?
- Accessibility requirements (WCAG level, audience with disabilities)?
- Supported devices, browsers, locales?
- Legal/compliance constraints (GDPR, HIPAA, COPPA)?
- Content constraints — who writes copy, who provides images?

### 3. Edge Cases

- Empty states — what shows when there's no data?
- Error states — what fails and how do we communicate it?
- Loading states — how long might users wait?
- Maximum data volume — 10 items or 10,000?
- Offline or poor connectivity behavior?
- Permission denied — what can partial-access users see?
- Concurrent editing or multi-user conflicts?

### 4. Success Metrics

- How will we measure if this design worked?
- Primary KPI (conversion, task completion, time-on-task, error rate)?
- Qualitative signals (user feedback, support tickets)?
- Baseline to beat — what's the current experience?
- Definition of "done" for v1 vs future iterations?

### 5. Technical Feasibility

- Existing codebase or greenfield?
- API/data availability — real, mocked, or TBD?
- Authentication/authorization model?
- Real-time requirements (WebSocket, polling)?
- Performance budgets (LCP, bundle size)?
- Who maintains this after launch?

### 6. Design Decisions (Explicit)

Force choices that are commonly left implicit:

- Information hierarchy — what's most important on each view?
- Primary action per screen — one CTA only
- Navigation model — tabs, sidebar, top nav, bottom nav?
- Density preference — data-dense vs spacious?
- Tone — formal, playful, technical, empathetic?
- Dark mode, responsive priority, animation appetite?

---

## Question Quality Rules

**Good questions:**
- Specific and answerable in 1–3 sentences
- Reveal a design decision hiding in ambiguity
- Offer options when helpful: "Is this more like Notion (flexible) or Trello (structured)?"

**Bad questions:**
- "Tell me more" (too vague)
- "What features do you want?" (unbounded)
- Questions already answered in provided materials

When user answers "I don't know":
- Offer 2–3 concrete options with tradeoffs
- Recommend a default with rationale
- Mark as `[ASSUMPTION]` in brief if user defers

---

## Readiness Gate

Brief is **solid** when all pass:

| Criterion | Required |
|-----------|----------|
| Primary user persona named | ✓ |
| Core user task defined (verb + object) | ✓ |
| Primary CTA per main view identified | ✓ |
| Empty, error, loading states addressed | ✓ |
| At least one success metric defined | ✓ |
| Technical context known (greenfield vs existing) | ✓ |
| Scope boundary for v1 explicit | ✓ |
| No unresolved contradictions in requirements | ✓ |

If any fail, continue interrogation.

---

## Output Format

### During interrogation (per round)

```markdown
## Grill Round [N]

**Gaps identified:** [1-line summary]

### Questions
1. [Question with context for why it matters]
2. [Question]
3. [Question]

### Running brief (in progress)
- **User:** [what we know so far]
- **Goal:** ...
- **Constraints:** ...
- **Open:** [still unresolved]
```

### Final brief (readiness gate passed)

```markdown
# Design Brief — [Project Name]

**Status:** Ready for design
**Grill rounds:** [N]

## User
- **Primary persona:** [specific description]
- **Context of use:** [when, where, device]
- **Core task:** [verb + object]

## Goals & Success
- **User success:** [30-second outcome]
- **Business metric:** [KPI]
- **Definition of done (v1):** [scope boundary]

## Constraints
- **Technical:** [stack, existing system, APIs]
- **Brand/a11y:** [guidelines, WCAG level]
- **Timeline:** [if known]

## Key Design Decisions
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Navigation | Sidebar | Many sections, desktop-first |
| Density | Spacious | Non-technical users |
| Primary CTA | "Create report" | Core task entry point |

## States & Edge Cases
- **Empty:** [behavior]
- **Error:** [behavior]
- **Loading:** [behavior]
- **Edge:** [notable edge cases]

## Assumptions
- [ASSUMPTION] items user deferred with your recommended default

## Out of Scope (v1)
- [Explicit exclusions]

## Recommended Next Skills
- `claude-design-skill` or `anthropic-frontend-design` for visual direction
- `site-design-loop` if multi-page
- `designer-grill-me` is complete — do not re-grill unless scope changes
```

---

## Constraints

- Do not start designing or coding until readiness gate passes
- Maximum 3–5 questions per round — respect cognitive load
- Track assumptions explicitly — never hide deferred decisions
- Challenge contradictions immediately when spotted
- If user insists on proceeding with gaps, document risks in brief and confirm waiver
- Synthesize — don't just collect answers; reflect understanding back each round
- Stop grilling when gate passes — transition to build skills, don't over-interrogate

---

## Source

Adapted from **julianoczkowski/designer-skills** designer interrogation methodology. Six-domain questioning framework for hardening project plans before design work.
