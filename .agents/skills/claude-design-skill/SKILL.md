---
name: claude-design-skill
description: >-
  Produce high-fidelity HTML design artifacts with output format matrix
  (canvas/prototype/deck/timeline). Includes tweaks protocol for iterative
  refinement and Design Direction Advisor with 10 philosophies. Use when
  creating polished design deliverables, exploring visual directions, or
  refining HTML designs iteratively. Source: jiji262/claude-design-skill.
---

# Claude Design Skill

Produce high-fidelity HTML design artifacts with intentional visual direction. Supports multiple output formats, iterative tweaks, and philosophy-guided design exploration.

---

## Output Format Matrix

Select format based on deliverable intent:

| Format | ID | Use Case | Viewport | Structure |
|--------|-----|----------|----------|-----------|
| **Canvas** | `canvas` | Static high-fidelity mockup | Fluid / responsive | Single-page design, no chrome |
| **Prototype** | `prototype` | Clickable multi-screen flow | Fluid | Shell + screens + JS state |
| **Deck** | `deck` | Presentation slides | 1920×1080 fixed | Delegate to `frontend-slides` |
| **Timeline** | `timeline` | Chronological visual narrative | Fluid vertical | Sections as timeline nodes |

### Canvas

- Full visual design of one screen or scrollable page
- Production-quality CSS — tokens, hover states, responsive breakpoints
- No lorem — real or labeled placeholder content

### Prototype

- 2–6 connected screens with click navigation
- State indicators (active nav, form validation demo)
- Inline JS only — single HTML file

### Deck

- Route to `frontend-slides` skill for 16:9 zero-dependency slides

### Timeline

- Vertical narrative: product evolution, project milestones, process documentation
- Alternating left/right nodes or progressive scroll reveal
- Date markers, connector lines, media embeds

---

## Workflow

```
1. Classify output format (canvas / prototype / deck / timeline)
2. Run Design Direction Advisor if direction unclear
3. Detect existing design system — respect if present
4. Build high-fidelity HTML artifact
5. Present to user
6. Enter tweaks protocol if refinement requested
```

---

## Design Direction Advisor

When visual direction is unspecified, select or present one of **10 design philosophies**:

| # | Philosophy | Character | Palette mood | Typography |
|---|------------|-----------|--------------|------------|
| 1 | **Brutalist Web** | Raw, exposed structure, monospace | Black/white, red accent | Mono + system |
| 2 | **Editorial Elegance** | Magazine layout, serif headlines | Cream/black, gold accent | Serif display + sans body |
| 3 | **Swiss Modernism** | Grid-precise, rational | Primary colors on white | Helvetica-like geometric sans |
| 4 | **Soft Minimalism** | Generous whitespace, subtle shadows | Off-white, soft gray, one pastel | Light sans throughout |
| 5 | **Neon Cyberpunk** | Dark base, glowing accents | Black, cyan, magenta | Condensed display + mono |
| 6 | **Organic Natural** | Rounded forms, earthy textures | Greens, browns, terracotta | Humanist sans + soft serif |
| 7 | **Retro-Futurism** | 70s–80s optimism, gradients | Orange, avocado, mustard | Rounded display fonts |
| 8 | **Luxury Refinement** | High contrast, restrained motion | Black, champagne, deep navy | High-contrast serif + thin sans |
| 9 | **Playful Pop** | Bold color blocks, illustration-ready | Saturated primaries | Rounded, friendly sans |
| 10 | **Industrial Utilitarian** | Data-dense, functional beauty | Steel gray, safety orange | Mono data + compact sans |

### Advisor workflow

```
1. Ask user goal and audience (if not known)
2. Present 2–3 philosophy options with rationale
3. User selects (or agent picks best fit with explanation)
4. Apply philosophy consistently across all design decisions
```

Do not blend philosophies unless user explicitly requests hybrid.

---

## Tweaks Protocol

Iterative refinement without full rebuilds. User tweak requests map to scoped edits:

| Tweak type | Scope | Action |
|------------|-------|--------|
| **Color shift** | CSS variables only | Update `--color-*` tokens, preserve layout |
| **Type change** | Font families + scale | Swap fonts, adjust sizes, keep hierarchy |
| **Spacing tune** | Padding/margin tokens | Adjust `--spacing-*`, no structural change |
| **Component swap** | Single component | Replace one component pattern (card, button, nav) |
| **Layout pivot** | Section arrangement | Reorder or resize sections, keep content |
| **Motion adjust** | Transitions/animations | Change duration, easing, or remove |
| **Content update** | Copy only | Replace text, keep all styling |
| **Philosophy shift** | Full redesign | Re-run Advisor, rebuild with new philosophy |

### Tweaks rules

1. **Minimum diff** — change only what the tweak requires
2. **Name the tweak type** — confirm scope before editing
3. **Preserve tokens** — tweak values, not architecture, when possible
4. **Re-verify** — screenshot or describe result after each tweak round
5. **Cap rounds** — after 5 tweak rounds, suggest full rebuild if still unsatisfied

### Tweaks request format

User: *"Make it feel more luxurious"* → Map to **Philosophy shift** (#8 Luxury Refinement) or **Color shift** + **Type change** if minor.

Respond:

```markdown
**Tweak type:** Color shift + Type change
**Scope:** CSS variables and font imports only
**Applying:** Luxury Refinement palette (champagne accent, Cormorant Garamond)
```

---

## High-Fidelity Standards

Every artifact must meet:

- **CSS custom properties** for all theme values
- **Responsive** — mobile (375px) and desktop (1440px) unless fixed canvas
- **Interactive states** — hover, focus, active on clickable elements
- **Semantic HTML** — proper heading hierarchy, landmarks
- **Single file** — all CSS/JS inlined unless project conventions say otherwise
- **No generic AI slop** — distinctive typography, intentional color, no purple-gradient-on-white default

---

## Output Format

### Artifact delivery

- Primary: `[name]-[format].html` (e.g., `dashboard-canvas.html`)
- Assets inlined or data URIs

### Design document (accompanying)

```markdown
# Design Artifact — [Name]

**Format:** canvas | prototype | deck | timeline
**Philosophy:** Editorial Elegance (#2)
**Viewport:** Responsive | 1920×1080

## Design decisions
- **Type:** Playfair Display + Source Sans 3
- **Palette:** `--color-primary: #1a1a1a`, `--color-accent: #c9a227`
- **Layout:** Asymmetric hero, 12-column grid

## Tokens
| Token | Value |
|-------|-------|
| --font-display | 'Playfair Display', serif |
| --spacing-section | 6rem |

## Tweaks history
1. [Round 1]: Color shift — warmed background
2. [Round 2]: Spacing tune — increased section padding
```

---

## Constraints

- Select output format before building — do not mix canvas and prototype in one file
- Philosophy must be declared and applied consistently
- Tweaks protocol is mandatory for refinement requests — no full rebuilds for minor tweaks
- Deck format delegates to `frontend-slides`
- Respect existing project design systems over philosophy defaults
- No external CDN dependencies
- Real content or explicit `[PLACEHOLDER]` labels

---

## Source

From **jiji262/claude-design-skill**. Output format matrix, Design Direction Advisor (10 philosophies), and tweaks protocol for iterative high-fidelity HTML design.
