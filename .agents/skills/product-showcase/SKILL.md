---
name: product-showcase
description: >-
  Generate marketing websites from live applications. Depth levels: quick,
  standard, thorough. Uses browser screenshots, GIF walkthroughs, and feature
  deep-dives via Cursor browser MCP tools. Use when building product landing
  pages, marketing sites, or app showcase pages from a running application.
  Source: jezweb/claude-skills (adapted).
---

# Product Showcase

Generate marketing websites that showcase a live application's features, UI, and value proposition. Capture real screenshots and interactions from the running app — never stock mockups.

## Depth Levels

| Level | Time budget | Deliverables | When to Use |
|-------|-------------|--------------|-------------|
| **Quick** | Minimal | Hero + 3 features + CTA, 3–5 screenshots | MVP launch, fast iteration |
| **Standard** | Moderate | Full landing page, feature sections, social proof placeholders | Typical product launch |
| **Thorough** | Comprehensive | Multi-section site, GIF walkthroughs, feature deep-dives, comparison table | Major launch, sales enablement |

Default to **Standard** unless user specifies otherwise.

---

## Workflow

```
1. Understand product (value prop, audience, key features)
2. Start or locate running application (dev server URL)
3. Capture assets via browser MCP (screenshots, optional GIF)
4. Map features to marketing sections
5. Build marketing site (HTML or project stack)
6. Verify screenshots render and copy matches actual UI
7. Deliver site + asset manifest
```

---

## Browser Capture Workflow (Cursor MCP)

Use **cursor-ide-browser** MCP tools:

### Setup

```
1. browser_tabs (action: list) — check for existing app tab
2. browser_navigate — open app URL (e.g., http://localhost:3000)
3. browser_lock (action: lock) — before automation sequence
4. browser_snapshot — understand page structure and refs
```

### Screenshots

```
browser_take_screenshot — capture at key views:
  - Hero/dashboard default state
  - Each major feature screen
  - Mobile viewport (resize or separate capture)
```

Save screenshots to `showcase/assets/` with descriptive names:
- `hero-dashboard.png`
- `feature-analytics.png`
- `feature-settings-mobile.png`

### GIF Walkthrough (Thorough depth)

For key user flows:

```
1. browser_navigate to flow start
2. browser_snapshot — identify interaction refs
3. browser_click / browser_type — perform flow steps
4. Capture frame sequence via repeated browser_take_screenshot
5. Assemble GIF or use CSS step-animation in HTML
```

Alternatively document flow as numbered screenshot sequence with captions.

### Cleanup

```
browser_lock (action: unlock) — when all browser work complete
```

---

## Section Templates by Depth

### Quick

1. **Hero** — headline, subhead, primary CTA, hero screenshot
2. **Features ×3** — icon/title/description + screenshot each
3. **CTA footer** — sign up / demo button

### Standard

1. Hero with app screenshot
2. Problem → Solution narrative
3. Features grid (4–6) with screenshots
4. How it works (3 steps)
5. Testimonials placeholder or social proof
6. Pricing teaser or CTA section
7. Footer

### Thorough

All Standard sections plus:

- **GIF/video walkthrough** of primary flow
- **Feature deep-dives** — one section per major feature with multiple screenshots
- **Before/after or comparison** table
- **FAQ** section
- **Technical highlights** (integrations, security, performance)
- **Multiple CTAs** throughout with tracking-ready attributes

---

## Content Rules

- **Screenshot authenticity** — every UI image captured from live app
- **Copy accuracy** — feature descriptions match actual app behavior
- **No fabricated metrics** — use `[PLACEHOLDER]` for stats/testimonials unless user provides
- **Consistent branding** — extract colors/fonts from app UI when possible
- **Accessible marketing** — alt text on all screenshots describing the feature shown

---

## Output Format

### Site deliverable

- HTML file or project pages per user stack
- Assets in `showcase/assets/` directory

### Manifest

```markdown
# Product Showcase Manifest

**Product:** [Name]
**Depth:** quick | standard | thorough
**App URL:** http://localhost:3000
**Generated:** YYYY-MM-DD

## Assets Captured

| File | Description | Viewport |
|------|-------------|----------|
| hero-dashboard.png | Main dashboard | 1440px |
| feature-analytics.png | Analytics panel | 1440px |
| walkthrough-flow.gif | Onboarding flow | 1440px |

## Sections Built

- [x] Hero
- [x] Features (6)
- [x] How it works
- [ ] FAQ (placeholder)

## Placeholders Requiring User Input

- Testimonial quotes
- Pricing numbers
- Customer logos
```

---

## Integration with Other Skills

| Need | Delegate to |
|------|-------------|
| Visual polish audit | `design-review-visual` |
| HTML vs markdown routing | `html-effectiveness` |
| High-fidelity design direction | `claude-design-skill` |
| Pre-launch checklist | `frontend-checklist-audit` |

---

## Constraints

- Must capture from live application — no fabricated UI screenshots
- Browser MCP required when app is runnable; ask user for URL if unknown
- Start dev server if needed and user approves
- Quick depth: max 5 screenshots; Thorough: min 10 screenshots or equivalent
- Do not screenshot pages requiring auth without user providing test credentials
- Marketing copy must not overclaim features not visible in captures
- Unlock browser when automation complete

---

## Source

Adapted from **jezweb/claude-skills** product showcase workflow. Browser capture steps adapted for Cursor IDE browser MCP tools.
