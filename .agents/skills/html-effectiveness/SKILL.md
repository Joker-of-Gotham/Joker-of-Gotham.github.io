---
name: html-effectiveness
description: >-
  Router skill that determines when HTML output beats markdown for a given task.
  Nine content types: explore, review, design, proto, diagram, slides, research,
  report, editor. Routes to appropriate template with single-file, zero-CDN,
  real-content constraints. Use when choosing output format for deliverables.
  Source: Azhi-ss/html-effectiveness (adapted).
---

# HTML Effectiveness Router

Decide whether the deliverable should be **HTML** (interactive, visual, self-contained) or **markdown** (text-first, diffable, repo-native). Route to the correct template when HTML wins.

## Decision Rule

Choose **HTML** when the output benefits from:
- Visual layout, color, typography, or spatial relationships
- Interaction (click, hover, navigate, edit)
- Side-by-side comparison or live preview
- Presentation at fixed viewport (slides, canvas)
- Rich media embedding (screenshots, diagrams with styling)

Choose **markdown** when the output is:
- Primarily prose documentation
- Version-controlled spec or plan
- CLI/terminal instructions
- API reference or changelog
- Content the user will edit heavily in an IDE

When uncertain, ask: *"Would the user need to open a browser to understand this?"* — if yes, use HTML.

---

## Nine Content Types

| Type | ID | HTML? | Template |
|------|-----|-------|----------|
| Exploration / brainstorm | `explore` | Often | `explore-board` |
| Code/design review | `review` | Yes | `review-report` |
| Visual design artifact | `design` | Yes | `design-canvas` |
| Interactive prototype | `proto` | Yes | `proto-shell` |
| Diagram / architecture | `diagram` | Yes | `diagram-page` |
| Presentation | `slides` | Yes | Route to `frontend-slides` skill |
| Research synthesis | `research` | Sometimes | `research-digest` |
| Formal report | `report` | Sometimes | `report-document` |
| Editable document | `editor` | Yes | `content-editor` |

---

## Routing Workflow

```
1. Parse user intent → classify content type
2. Apply decision rule (HTML vs markdown)
3. If HTML: select template from matrix
4. Apply global constraints (single-file, zero CDN, real content)
5. Generate output
6. If type is `slides` → delegate to frontend-slides skill
7. If type is `design` → consider claude-design-skill for fidelity
```

---

## Content Type Details

### `explore` — Exploration Board

**Use for:** Brainstorming layouts, comparing options, mood boards

**HTML wins when:** Showing 2+ visual directions side by side

**Template:** Grid of option cards with screenshots/mockups, pros/cons, selection CTA

### `review` — Review Report

**Use for:** Design review, audit findings, QA results

**HTML wins when:** Findings include severity colors, screenshots, annotated markup

**Template:** Collapsible sections, severity badges, screenshot embeds

### `design` — Design Canvas

**Use for:** High-fidelity mockups, landing page designs, component showcases

**HTML wins when:** Deliverable is the design itself

**Template:** Full-viewport design with CSS variables, responsive preview toggle

### `proto` — Interactive Prototype

**Use for:** Clickable flows, form interactions, state demonstrations

**HTML wins when:** User needs to click through a flow

**Template:** Multi-screen shell with JS state, no backend

### `diagram` — Architecture Diagram

**Use for:** System architecture, user flows, component trees

**HTML wins when:** Diagram needs styling, zoom, or collapsible nodes

**Template:** SVG or CSS-based diagram with legend and labels

### `slides` — Presentation

**Use for:** Decks, pitch slides, talk materials

**Delegate to:** `frontend-slides` skill (1920×1080, zero-deps)

### `research` — Research Digest

**Use for:** Competitive analysis, pattern libraries, trend summaries

**HTML when:** Image-heavy with categorized galleries

**Markdown when:** Text-heavy synthesis with citations

### `report` — Formal Report

**Use for:** Audit reports, project summaries, stakeholder updates

**HTML when:** Charts, scorecards, visual hierarchy matter

**Markdown when:** Long prose, git-tracked living doc

### `editor` — Content Editor

**Use for:** Editable copy decks, content matrices, localization tables

**HTML wins when:** User edits inline in browser

**Template:** `contenteditable` regions with export-to-markdown button

---

## Output Format Matrix

| Type | File | Structure |
|------|------|-----------|
| `explore-board` | `[topic]-explore.html` | Header + option grid + footer actions |
| `review-report` | `[target]-review.html` | Scorecard + findings list + screenshots |
| `design-canvas` | `[screen]-design.html` | Full-page design, no chrome |
| `proto-shell` | `[flow]-proto.html` | Nav shell + screen panels + state JS |
| `diagram-page` | `[system]-diagram.html` | Title + diagram + legend |
| `research-digest` | `[topic]-research.html` | Sections + image gallery + sources |
| `report-document` | `[project]-report.html` | Cover + sections + summary metrics |
| `content-editor` | `[doc]-editor.html` | Editable regions + export controls |

All HTML outputs: **single file**, styles and scripts inlined.

---

## Global Constraints

Apply to every HTML output regardless of type:

1. **Single-file** — one `.html` file, no external asset dependencies
2. **Zero CDN** — no Google Fonts CDN, no unpkg, no cdnjs links
3. **Real content** — no lorem ipsum; use user's actual copy or realistic placeholders labeled `[PLACEHOLDER: description]`
4. **Self-contained fonts** — system stacks or base64 `@font-face`
5. **Accessible baseline** — semantic HTML, alt text, keyboard nav where interactive
6. **Mobile-readable** — responsive or viewport-scaled unless fixed canvas (slides/design)
7. **`prefers-reduced-motion`** — respect in all animations

---

## Router Output (Meta)

When acting as router only (not generating), output:

```markdown
# HTML Effectiveness Routing

**Content type:** review
**Format:** HTML (review-report template)
**Rationale:** Findings include severity colors and screenshot annotations
**Delegate:** None
**Output file:** `dashboard-review.html`
```

---

## Constraints

- Router must classify before generating — do not default to markdown or HTML blindly
- `slides` always delegates to `frontend-slides`
- Do not produce HTML when markdown is clearly superior (API docs, git specs)
- Never violate single-file / zero-CDN rules for convenience
- Label placeholders explicitly — never fake content as final copy

---

## Source

Adapted from **Azhi-ss/html-effectiveness**. Nine-type content router with HTML-vs-markdown decision framework and template matrix.
