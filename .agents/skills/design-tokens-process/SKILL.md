---
name: design-tokens-process
description: 'Generate light and dark design token systems from an aesthetic philosophy through palette, semantic roles, CSS variables, and Tailwind theme. Use when building a token system from scratch or rebranding. Source: julianoczkowski/designer-skills (adapted).'
---

# Design Tokens Process

Systematic pipeline: aesthetic philosophy → palette → semantic roles → CSS variables → Tailwind theme.

## When to Use

- Greenfield design system token generation
- Rebranding or visual refresh
- Converting mood boards or briefs into implementable tokens
- Creating paired light/dark themes with semantic consistency

---

## Workflow

```
Define philosophy → Generate palette → Assign semantic roles →
Build CSS variables → Map Tailwind theme → Document → Validate
```

### Phase 1: Aesthetic Philosophy

Capture in a short brief:

```markdown
## Philosophy
- **Essence:** [one sentence — e.g., "Calm precision for financial clarity"]
- **Keywords:** [3–5 adjectives]
- **Material:** [flat | layered | glass | brutalist]
- **Temperature:** [cool | neutral | warm]
- **Density:** [airy | balanced | compact]
- **Motion:** [static | subtle | expressive]
```

Derive constraints:
- Cool + layered → blue-gray surfaces, soft shadows
- Warm + airy → cream backgrounds, terracotta accent
- Brutalist → high contrast, sharp radius, mono accent

### Phase 2: Palette Generation

Build **5–7 primitive hues** in OKLCH:

| Scale | Steps | Example |
|-------|-------|---------|
| Neutral | 50–950 (11 steps) | Slate, stone, or custom gray |
| Brand | 50–950 | Primary brand hue |
| Accent | 3–5 steps | Secondary emphasis (optional) |
| Status | 4 hues | success, warning, error, info |

**Palette rules:**
- Neutral carries 80% of UI surfaces
- Brand hue saturation peaks at 500–600
- Test neutral undertone matches philosophy temperature
- Document OKLCH values for perceptual editing

```css
/* Example primitives */
--palette-neutral-50: oklch(0.98 0.005 250);
--palette-neutral-900: oklch(0.2 0.02 250);
--palette-brand-500: oklch(0.58 0.18 250);
--palette-brand-600: oklch(0.5 0.19 250);
```

### Phase 3: Semantic Roles

Map primitives to **purpose**, not appearance:

| Category | Tokens |
|----------|--------|
| Surface | `background`, `foreground`, `card`, `popover`, `muted` |
| Interactive | `primary`, `secondary`, `accent`, `destructive` |
| Each interactive | paired `*-foreground` |
| Border | `border`, `input`, `ring` |
| Status | `success`, `warning`, `error`, `info` (+ foregrounds) |
| Typography | `font-sans`, `font-display`, `font-mono` |
| Radius | `radius-sm`, `radius-md`, `radius-lg` |
| Shadow | `shadow-sm`, `shadow-md`, `shadow-lg` |

**Assignment logic:**
- `background` ← neutral 50 (light) / neutral 900 (dark)
- `primary` ← brand 600 (light) / brand 400 (dark)
- `muted` ← neutral 100 / neutral 800
- `border` ← neutral 200 / neutral 700

### Phase 4: CSS Variables

```css
:root {
  color-scheme: light;

  --background: var(--palette-neutral-50);
  --foreground: var(--palette-neutral-900);
  --card: oklch(1 0 0);
  --card-foreground: var(--foreground);
  --primary: var(--palette-brand-600);
  --primary-foreground: oklch(0.98 0 0);
  --secondary: var(--palette-neutral-100);
  --secondary-foreground: var(--palette-neutral-900);
  --muted: var(--palette-neutral-100);
  --muted-foreground: var(--palette-neutral-500);
  --accent: var(--palette-neutral-100);
  --accent-foreground: var(--palette-neutral-900);
  --destructive: oklch(0.55 0.22 25);
  --destructive-foreground: oklch(0.98 0 0);
  --border: var(--palette-neutral-200);
  --input: var(--palette-neutral-200);
  --ring: var(--palette-brand-500);

  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
}

.dark {
  color-scheme: dark;

  --background: var(--palette-neutral-900);
  --foreground: var(--palette-neutral-50);
  --card: var(--palette-neutral-800);
  --primary: var(--palette-brand-400);
  --secondary: var(--palette-neutral-800);
  --muted: var(--palette-neutral-800);
  --muted-foreground: var(--palette-neutral-400);
  --border: var(--palette-neutral-700);
  --input: var(--palette-neutral-700);
  --ring: var(--palette-brand-400);
}
```

### Phase 5: Tailwind Theme

Tailwind v4:

```css
@theme {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --color-ring: var(--ring);
  --color-destructive: var(--destructive);
  --radius-sm: var(--radius-sm);
  --radius-md: var(--radius-md);
  --radius-lg: var(--radius-lg);
}
```

Tailwind v3 (HSL pattern):

```js
colors: {
  background: 'hsl(var(--background))',
  foreground: 'hsl(var(--foreground))',
  primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
}
```

### Phase 6: Validate

- [ ] All text/background pairs pass WCAG AA (4.5:1 body, 3:1 large)
- [ ] Dark mode is remapped, not filtered/inverted
- [ ] Semantic names used in components, not primitives
- [ ] Philosophy keywords reflected in choices (document how)
- [ ] Token file is single source of truth

---

## Constraints

- Philosophy drives every decision — document the "why"
- Never skip semantic layer (no primitive colors in components)
- Light and dark must be designed together, not afterthought
- Limit palette complexity: 1 brand hue + 1 neutral + status colors
- Output must be copy-paste implementable

## Output Format

```markdown
# Design Tokens: [Project Name]

## Philosophy
[Essence, keywords, constraints]

## Primitive Palette
### Neutral
| Step | OKLCH |
### Brand
| Step | OKLCH |

## Semantic Mapping
| Token | Light Source | Dark Source | Usage |

## CSS Variables
[Full :root + .dark blocks]

## Tailwind Theme
[@theme or config snippet]

## Usage Examples
[3 component examples with token classes]

## Contrast Report
| Pair | Ratio | Pass |
```
