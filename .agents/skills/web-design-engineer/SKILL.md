---
name: web-design-engineer
description: 'Build polished visual web artifacts with HTML/CSS/JavaScript/React. Covers pages, dashboards, prototypes, slide decks, animations, UI mockups, and data visualizations. Includes 25 style recipes, brand asset protocol, and 5-dimension critique. Use for any standalone visual web deliverable. Source: ConardLi/garden-skills.'
---

# Web Design Engineer

Build polished, top-tier visual web artifacts. Output is always working HTML/React code.

## Workflow

### Step 0: Fact Verification

Before designing anything with specific claims (company info, product features, statistics), verify facts via web search. Never invent data.

### Step 1: Contextual Questions

Ask 2-3 targeted questions based on the request type. Not a mechanical checklist -- understand what matters for this specific deliverable.

### Step 2: Design Context Priority

Source visual direction in this order:
1. **User-provided assets** (logos, screenshots, brand guides) -- highest priority
2. **Codebase signals** (existing tokens, components, theme)
3. **Reference URLs** mentioned by user
4. **Style recipes** (see references/style-recipes/)

### Step 2b: Brand Asset Protocol

When the user provides brand assets:
- Logo/product images > color extraction > typography inference
- Never contradict provided assets with recipe defaults
- Build color palette from logo's dominant + complement colors

### Step 3: Design System Declaration

Before coding, declare:
- Color palette (background, surface, text, primary, accent)
- Typography (headline font, body font, mono font if needed)
- Spacing rhythm (base unit)
- Border radius scale
- Motion approach

### Step 3a: Four Positioning Questions

For ambitious projects, answer internally:
1. **Narrative**: What story does this page tell?
2. **Distance**: How intimate or formal is the tone?
3. **Temperature**: Warm/cool/neutral?
4. **Capacity**: Dense information or spacious breathing room?

### Step 4: Early Draft (v0)

Build a rough first version quickly. Ship imperfect, then refine.

### Step 5: Full Build

Complete implementation with all sections, responsive behavior, and interactions.

### Step 6: Pre-Delivery Checklist

- [ ] All text is real content (no lorem ipsum)
- [ ] Responsive at 320px, 768px, 1280px+
- [ ] Interactive states (hover, active, focus)
- [ ] Motion is smooth and purposeful
- [ ] Contrast passes WCAG AA
- [ ] No orphaned headings or dead-end sections

### Step 7: Five-Dimension Critique

Self-assess on 5 axes (1-10):
1. **Visual Impact**: Would this stop someone scrolling?
2. **Craft**: Are details polished (spacing, alignment, transitions)?
3. **Clarity**: Is the message immediately understood?
4. **Cohesion**: Does everything feel like one system?
5. **Memorability**: Would someone remember this tomorrow?

If any dimension scores below 6, revise before delivering.

---

## Design Direction Advisor

When the user has no clear direction, offer 3 options from distinct schools:

| School | Character |
|--------|-----------|
| Swiss Modernist | Grid precision, helvetica, bold color blocks |
| Editorial | Serif headlines, generous whitespace, magazine feel |
| Geometric Minimal | One accent, simple shapes, stark contrast |
| Retro-Future | Dark base, neon accents, tech typography |
| Organic Natural | Earth tones, rounded forms, texture |
| Luxury Refined | Thin serifs, dark backgrounds, gold/cream accents |

Pick 3 that fit the product type. Describe each in one sentence + one reference product.

---

## Technical Rules

### React Output

- Use React with Babel standalone for single-file demos
- Tailwind CSS via CDN for rapid prototyping
- All state managed with hooks (useState, useEffect)
- No external dependencies beyond React + Tailwind unless user specifies

### CSS Best Practices

- OKLCH for color definitions when possible
- Container queries for component-level responsiveness
- CSS custom properties for theming
- `clamp()` for fluid typography
- Logical properties (`margin-inline`, `padding-block`)

---

## Anti-Cliché Table

| Cliché | Replace With |
|--------|-------------|
| Gradient mesh hero background | Photography, illustration, or solid color with strong type |
| "Unlock your potential" headline | Specific value proposition in plain language |
| 3-column feature grid with icons | Visual hierarchy based on actual feature importance |
| Floating phone mockup | Real product screenshot or interactive demo |
| "Built for teams" generic copy | Specific user story or use case |
| Purple-blue gradient buttons | Brand-derived accent color |

---

## Style Recipes

See `references/style-recipes/` for 25 anchored visual directions with specific tokens, fonts, and color schemes derived from real products (Linear, Aesop, Bloomberg, Apple, Stripe, etc.).

Each recipe provides:
- Color palette (exact values)
- Font pairing
- Spacing/radius conventions
- Motion approach
- Reference screenshot

---

## Constraints

- Output must be working, runnable code
- Never use placeholder images (use gradients, shapes, or real content)
- Never ship without responsive behavior
- Never produce generic AI aesthetic (see Anti-Cliché Table)
- Facts must be verified before inclusion
