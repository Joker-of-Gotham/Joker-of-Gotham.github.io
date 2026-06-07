---
name: site-design-loop
description: >-
  Autonomous multi-page site generation with baton handoff pattern. Seven-step
  loop: read baton, check DESIGN.md, generate page, integrate nav, verify,
  update docs, write next baton. Anti-drift rules for cross-page consistency.
  Use when building multi-page sites incrementally across agent sessions.
  Source: jezweb/claude-skills (adapted).
---

# Site Design Loop

Autonomous multi-page site generation using a **baton pattern** — each session reads state, builds one page, updates docs, and writes a baton for the next session. Designed for cross-session continuity without design drift.

## Prerequisites

Project should have (create if missing):

- `DESIGN.md` — design direction, tokens, typography, tone
- `design-system/MASTER.md` — component and token reference (optional)
- `baton.json` — session handoff state (created on first run)
- `site/` or agreed output directory for HTML pages

---

## The 7-Step Loop

```
┌─────────────────────────────────────────────────────────┐
│  1. Read baton    →  2. Check DESIGN.md                 │
│         ↓                    ↓                          │
│  3. Generate page →  4. Integrate nav                   │
│         ↓                    ↓                          │
│  5. Verify        →  6. Update docs                     │
│         ↓                                               │
│  7. Write next baton                                    │
└─────────────────────────────────────────────────────────┘
```

### Step 1: Read Baton

Load `baton.json`:

```json
{
  "version": 1,
  "site_name": "Acme Product",
  "pages_complete": ["index.html", "about.html"],
  "pages_remaining": ["features.html", "pricing.html", "contact.html"],
  "current_page": "features.html",
  "nav_structure": [
    { "label": "Home", "href": "index.html" },
    { "label": "About", "href": "about.html" },
    { "label": "Features", "href": "features.html" }
  ],
  "design_tokens_snapshot": {
    "primary": "#2563eb",
    "font_display": "Fraunces",
    "font_body": "Source Sans 3"
  },
  "anti_drift_notes": "Cards use 12px radius. Hero pattern is split layout.",
  "last_session": "2026-06-08",
  "blockers": []
}
```

If no baton exists, initialize from user brief + `DESIGN.md`.

### Step 2: Check DESIGN.md

Read `DESIGN.md` before writing any code:

- Visual thesis and mood
- Color palette and CSS variables
- Typography scale
- Layout patterns (grid, max-width, section rhythm)
- Component conventions
- Copy tone

**Do not improvise** values that contradict `DESIGN.md`.

### Step 3: Generate Page

Build **one page only** per loop iteration:

- Use tokens from `DESIGN.md` / baton snapshot
- Match layout patterns from completed pages
- Reuse header/footer structure exactly
- Real content — no lorem ipsum unless baton says otherwise

### Step 4: Integrate Nav

- Update navigation in **all existing pages** to include new page
- Ensure `href` paths are consistent (relative links)
- Active state on current page
- Mobile nav matches existing pattern

### Step 5: Verify

- Open page in browser (MCP screenshot if available)
- Check against anti-drift rules (below)
- Validate links between pages
- Confirm responsive at 375px and 1440px

### Step 6: Update Docs

Update as needed:

- `DESIGN.md` — append new patterns if introduced (with justification)
- `baton.json` — move page from remaining to complete
- Page manifest in baton or `site/README.md`

### Step 7: Write Next Baton

Advance baton for next session:

```json
{
  "current_page": "pricing.html",
  "pages_complete": ["index.html", "about.html", "features.html"],
  "pages_remaining": ["pricing.html", "contact.html"],
  "anti_drift_notes": "Added feature grid pattern — reuse on pricing tier cards",
  "blockers": []
}
```

If all pages complete, set `"status": "complete"` and write final summary.

---

## Anti-Drift Rules

Cross-page consistency is mandatory. Before finishing each loop:

| Rule | Check |
|------|-------|
| **Token fidelity** | Colors, spacing, radii match `DESIGN.md` and baton snapshot |
| **Header/footer** | Identical structure and classes across pages |
| **Typography** | Same font families, scale, weights |
| **Button styles** | Primary/secondary/ghost match existing pages |
| **Section rhythm** | Same padding scale between sections |
| **Card pattern** | Same border, shadow, radius as prior pages |
| **Link style** | Consistent underline/hover behavior |
| **Background** | Same base and surface colors |
| **Motion** | Same transition durations and easing |
| **Copy tone** | Same voice (formal/casual/technical) |

If a new pattern is required, document it in `anti_drift_notes` and `DESIGN.md` before using.

---

## Baton Initialization (First Session)

When starting a new multi-page site:

```
1. Gather user brief (site name, pages, audience)
2. Write or confirm DESIGN.md
3. Create baton.json with full page list
4. Generate index.html first (establishes patterns)
5. Write baton pointing to page 2
```

**Page order recommendation:** `index` → `about` → feature pages → `pricing` → `contact`

---

## Output Format

### Per-session summary

```markdown
# Site Design Loop — Session [N]

**Page built:** features.html
**Pages complete:** 3/5
**Nav updated:** index, about, features

## Anti-drift verification
- [x] Tokens match DESIGN.md
- [x] Header/footer identical
- [x] Button styles consistent

## Next baton
- **Target page:** pricing.html
- **Notes:** Reuse feature grid for pricing tiers

## Blockers
- None
```

### Final completion summary

```markdown
# Site Design Loop — Complete

**Site:** [Name]
**Pages:** 5/5
**Sessions:** 5

## Page index
| Page | Path | Status |
|------|------|--------|
| Home | index.html | ✓ |
| ... | | |

## Design patterns established
- [List reusable patterns for maintenance]
```

---

## Constraints

- **One page per session** — do not batch multiple pages unless user explicitly overrides
- **Always read baton first** — never assume page order or completed work
- **Nav integration is mandatory** — new page must appear in all pages' navigation
- **DESIGN.md is authoritative** — baton snapshot is secondary check
- **Anti-drift verification required** — skip no rules
- **Relative links only** — portable site structure
- **Update baton before ending session** — next session depends on it
- Do not delete completed pages or regress baton state

---

## Source

Adapted from **jezweb/claude-skills** autonomous site generation with baton handoff pattern. Seven-step loop and anti-drift rules from jezweb's multi-page site workflow.
