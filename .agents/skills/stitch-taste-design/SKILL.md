---
name: stitch-taste-design
description: 'Generate premium, anti-generic DESIGN.md files with refined typography, calibrated colors, and distinctive visual direction for Stitch projects. Use when default Stitch output feels generic or the user wants elevated design taste. Requires Stitch MCP. Source: google-labs-code/stitch-skills.'
compatibility: Requires Stitch MCP server configured and authenticated.
---

# Stitch Taste Design

Elevate Stitch design documentation beyond generic AI aesthetics — produce `DESIGN.md` with intentional typography, calibrated color systems, and a distinctive visual direction.

## When to Use

- Stitch designs look templated or "AI slop"
- User asks for premium, editorial, or brand-distinctive direction
- Before generating Stitch screens — to set taste constraints upfront
- Complementing `stitch-design-md` with aesthetic refinement layer

---

## Workflow

```
Define taste brief → Audit Stitch project → Calibrate tokens →
Articulate visual direction → Write premium DESIGN.md → Taste checklist
```

### Step 1: Taste Brief

Extract or ask:

| Dimension | Question |
|-----------|----------|
| Industry | Fintech, creative tool, health, devtools? |
| Tone | Editorial, brutalist, warm, technical, luxury? |
| Audience | Developers, executives, consumers? |
| Anti-patterns | What to avoid (purple gradients, Inter+purple, etc.)? |
| Reference | 1–2 sites or brands as north star (not to copy) |

### Step 2: Audit via Stitch MCP

Fetch project screens. Score each against taste rubric:

- **Typography**: Distinctive pairing or generic system font?
- **Color**: Intentional palette or default blue/purple?
- **Layout**: Compositional tension or centered card stack?
- **Detail**: Micro-interactions, borders, texture, or flat boxes?
- **Copy tone**: Specific or lorem/generic?

### Step 3: Calibrate Tokens

**Typography refinement**
- Pair display + body fonts with contrast (e.g., serif display + geometric sans)
- Define scale with intentional jumps — not uniform steps
- Set `letter-spacing` and `line-height` per role, not defaults

```markdown
| Role | Font | Size | Tracking | Leading |
| Display | Fraunces | clamp(2.5rem, 5vw, 4rem) | -0.02em | 1.1 |
| Body | DM Sans | 1rem | 0 | 1.6 |
| Mono | JetBrains Mono | 0.875rem | 0 | 1.5 |
```

**Color calibration**
- Anchor on one dominant hue + one accent — not rainbow
- Use OKLCH for perceptual consistency
- Define semantic roles with explicit contrast ratios
- Include surface elevation (not just background/card)

```css
--color-surface-0: oklch(0.98 0.01 90);   /* page */
--color-surface-1: oklch(1 0 0);          /* card */
--color-surface-2: oklch(0.96 0.02 90);   /* inset */
--color-ink: oklch(0.2 0.03 270);
--color-ink-muted: oklch(0.5 0.02 270);
--color-accent: oklch(0.55 0.15 145);
```

### Step 4: Visual Direction Narrative

Write 2–3 paragraphs covering:
- **Concept metaphor** (e.g., "ledger precision meets warm craft")
- **Spatial logic** (asymmetric hero, generous margins, rule-of-thirds)
- **Material language** (hairline borders, soft shadows, grain texture)
- **Motion philosophy** (staggered reveals, 200ms ease-out, no bounce)

### Step 5: Premium DESIGN.md

Merge calibrated tokens + direction narrative + Stitch screen inventory.

### Step 6: Taste Checklist

- [ ] No Inter + purple gradient combo unless explicitly requested
- [ ] Display font is distinctive, not system default
- [ ] Color palette has ≤3 hue families
- [ ] At least one compositional choice breaks symmetry
- [ ] Copy examples are specific to the product domain
- [ ] Dark mode feels designed, not inverted

---

## Anti-Generic Rules

| Avoid | Prefer |
|-------|--------|
| Centered hero + 3 feature cards | Asymmetric layout, editorial type |
| `bg-gradient-to-r from-purple-500` | Solid surfaces + single accent |
| Stock illustration placeholders | Abstract geometry, typography-as-image |
| 16px everything | Intentional type scale with display moment |
| Generic "Welcome to our platform" | Domain-specific headline with proof point |
| Identical card grids | Mixed density, featured + supporting |

## Constraints

- Refine — do not replace user's brand colors without consent
- Document rationale for each taste decision
- Stitch MCP required for screen references; taste layer is additive
- Keep tokens implementable (real font files, valid CSS)

## Output Format

```markdown
# Design Direction: [Project Name]

## Taste Brief
[Industry, tone, audience, anti-patterns]

## Visual Concept
[2–3 paragraph narrative]

## Typography System
[Refined scale with pairing rationale]

## Color System
[OKLCH tokens with semantic roles + contrast notes]

## Spatial & Composition
[Layout principles, grid, whitespace rules]

## Material & Detail
[Borders, shadows, texture, icons]

## Motion
[Timing, easing, entrance patterns]

## Screen-Specific Notes
| Screen | Taste adjustment |

## Do / Don't
| Do | Don't |

## Implementation Priority
1. Typography + color tokens
2. Layout shell
3. Component polish
```
