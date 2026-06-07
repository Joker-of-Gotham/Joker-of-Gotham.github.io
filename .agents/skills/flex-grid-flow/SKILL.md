---
name: flex-grid-flow
description: 'Implement framework-agnostic fluid responsive layouts with clamp() type scales, spacing formulas, layout primitives (stack/grid/reel/switcher/sidebar), container queries, and Tailwind v4 @theme mapping. Use when building responsive systems without breakpoint sprawl. Source: oerlellijk/design-system-skill (adapted).'
---

# Flex Grid Flow

Framework-agnostic fluid responsive design: mathematical type/spacing scales, composable layout primitives, container queries, and Tailwind v4 integration.

## When to Use

- Building responsive layouts without dozens of breakpoints
- Defining fluid typography and spacing systems
- Implementing Every Layout-style primitives
- Mapping fluid tokens to Tailwind v4 `@theme`

---

## Workflow

```
Define viewport bounds → Build type scale → Build spacing scale →
Choose layout primitives → Add container queries → Map to @theme → Verify
```

### Step 1: Viewport Bounds

Set design range (typically 320px–1440px):

```css
--fluid-min: 20rem;   /* 320px */
--fluid-max: 90rem;   /* 1440px */
```

### Step 2: Fluid Type Scale (clamp math)

Formula: `clamp(MIN, PREFERRED, MAX)`

```css
/* Preferred = MIN + (MAX - MIN) * ((100vw - MIN_VW) / (MAX_VW - MIN_VW)) */
--step--2: clamp(0.64rem, 0.6rem + 0.2vw, 0.75rem);
--step--1: clamp(0.8rem, 0.75rem + 0.25vw, 0.94rem);
--step-0:  clamp(1rem, 0.95rem + 0.3vw, 1.125rem);
--step-1:  clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem);
--step-2:  clamp(1.563rem, 1.4rem + 0.8vw, 2rem);
--step-3:  clamp(1.953rem, 1.7rem + 1.2vw, 2.5rem);
--step-4:  clamp(2.441rem, 2rem + 2vw, 3.5rem);
```

**Rule:** Use a modular ratio (1.25 minor third or 1.333 perfect fourth). Limit to 6–8 steps.

### Step 3: Fluid Spacing Scale

```css
--space-3xs: clamp(0.25rem, 0.2rem + 0.25vw, 0.5rem);
--space-2xs: clamp(0.5rem, 0.45rem + 0.25vw, 0.75rem);
--space-xs:  clamp(0.75rem, 0.65rem + 0.5vw, 1rem);
--space-s:   clamp(1rem, 0.9rem + 0.5vw, 1.5rem);
--space-m:   clamp(1.5rem, 1.25rem + 1.25vw, 2.5rem);
--space-l:   clamp(2rem, 1.5rem + 2.5vw, 4rem);
--space-xl:  clamp(3rem, 2rem + 5vw, 6rem);
```

Pair with `gap` on layout primitives — never margin-stack unless unavoidable.

---

## Layout Primitives

### Stack (vertical rhythm)

```css
.stack {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
}
.stack[data-space="l"] { gap: var(--space-l); }
```

### Grid (responsive columns)

```css
.grid-auto {
  display: grid;
  gap: var(--space-m);
  grid-template-columns: repeat(
    auto-fit,
    minmax(min(100%, var(--col-min, 16rem)), 1fr)
  );
}
```

### Reel (horizontal scroll)

```css
.reel {
  display: flex;
  gap: var(--space-s);
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
}
.reel > * { flex: 0 0 auto; scroll-snap-align: start; }
```

### Switcher (horizontal ↔ vertical)

```css
.switcher {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-s);
}
.switcher > * {
  flex-grow: 1;
  flex-basis: calc((var(--switch-threshold, 30rem) - 100%) * 999);
}
```

### Sidebar (main + aside)

```css
.sidebar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-m);
}
.sidebar > :first-child {
  flex-grow: 1;
  flex-basis: var(--sidebar-width, 20rem);
}
.sidebar > :last-child { flex-basis: 0; flex-grow: 999; min-width: 50%; }
```

---

## Container Queries

Prefer `@container` over viewport breakpoints for component-level responsiveness:

```css
.card-grid {
  container-type: inline-size;
  container-name: card-grid;
}

@container card-grid (min-width: 30rem) {
  .card-grid__inner {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

Tailwind v4:

```html
<div class="@container">
  <div class="@md:grid-cols-2 @lg:grid-cols-3 grid gap-4">...</div>
</div>
```

---

## Tailwind v4 @theme Mapping

```css
@theme {
  --text-step-0: var(--step-0);
  --text-step-1: var(--step-1);
  --text-step-2: var(--step-2);

  --spacing-3xs: var(--space-3xs);
  --spacing-s: var(--space-s);
  --spacing-m: var(--space-m);
  --spacing-l: var(--space-l);

  --container-sidebar: 20rem;
  --container-switch: 30rem;
}
```

Usage: `text-step-1`, `gap-s`, `p-m` — semantic, fluid, no magic pixel values.

---

## Constraints

- Max 2 viewport breakpoints for page-level changes; use container queries for components
- No fixed `px` font sizes in production CSS
- Layout primitives compose — don't create one-off flex hacks
- Gap over margin for sibling spacing
- Test at 320px, 768px, and 1440px minimum

## Output Format

```markdown
# Fluid Layout System

## Type Scale
| Step | clamp() | Usage |

## Spacing Scale
| Token | clamp() | Usage |

## Primitives Used
- Stack: [where]
- Grid: [where]
- Switcher: [where]

## Container Queries
| Container | Threshold | Behavior |

## @theme Snippet
[CSS]
```
