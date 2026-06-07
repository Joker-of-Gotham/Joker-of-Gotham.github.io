---
name: tailwind-design-system
description: 'Build Tailwind CSS v4 design systems with @theme, OKLCH colors, semantic tokens, CSS-variable dark mode, and CVA component variants. Use when creating or migrating design tokens, theme files, or component variant architecture. Includes v3-to-v4 migration. Source: wshobson/agents (adapted).'
---

# Tailwind Design System (v4)

Build production design systems on Tailwind CSS v4 using `@theme`, OKLCH color spaces, semantic tokens, and class-variance-authority (CVA) for component variants.

## When to Use

- Greenfield Tailwind v4 theme setup
- Migrating `tailwind.config.js` (v3) to CSS-first v4 `@theme`
- Defining semantic color/spacing/typography tokens
- Implementing dark mode via CSS variables
- Structuring button, badge, input variants with CVA

## Authority Hierarchy

1. Existing project tokens and patterns
2. User explicit instructions
3. This skill's defaults

---

## Workflow

```
Audit existing theme → Define primitive tokens → Map semantic tokens →
Implement @theme → Wire dark mode → Build CVA components → Validate
```

### Step 1: Audit

- Check for `tailwind.config.*` (v3 legacy) or `@import "tailwindcss"` + `@theme` (v4)
- Inventory CSS variables in `:root` / `.dark`
- List components using hardcoded colors vs token classes

### Step 2: Primitive Tokens (OKLCH)

Define raw palette in OKLCH for perceptual uniformity:

```css
@import "tailwindcss";

@theme {
  /* Primitives — never use directly in components */
  --color-slate-50: oklch(0.984 0.003 247.858);
  --color-slate-900: oklch(0.208 0.042 265.755);
  --color-brand-500: oklch(0.62 0.19 255);
  --color-brand-600: oklch(0.55 0.2 255);

  /* Semantic aliases */
  --color-background: var(--color-slate-50);
  --color-foreground: var(--color-slate-900);
  --color-primary: var(--color-brand-600);
  --color-primary-foreground: oklch(0.985 0 0);
  --color-muted: oklch(0.96 0.01 247);
  --color-muted-foreground: oklch(0.45 0.02 257);
  --color-border: oklch(0.9 0.01 247);
  --color-ring: var(--color-brand-500);
  --color-destructive: oklch(0.55 0.22 25);

  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
}
```

### Step 3: Semantic Token Rules

| Layer | Purpose | Usage |
|-------|---------|-------|
| Primitive | Raw palette scale | Only in `@theme` definitions |
| Semantic | Role-based (`primary`, `muted`) | Components and utilities |
| Component | Scoped overrides | Rare; prefer semantic |

**Rule:** Components reference semantic tokens only (`bg-primary`, `text-muted-foreground`). Never `bg-brand-600` in JSX.

### Step 4: Dark Mode via CSS Variables

```css
:root {
  --color-background: oklch(0.985 0.002 247);
  --color-foreground: oklch(0.18 0.03 265);
  --color-border: oklch(0.88 0.01 247);
}

.dark {
  --color-background: oklch(0.16 0.02 265);
  --color-foreground: oklch(0.95 0.01 247);
  --color-border: oklch(0.28 0.02 265);
  --color-muted: oklch(0.22 0.02 265);
}
```

Toggle with `class="dark"` on `<html>` or `data-theme="dark"`. Do not duplicate component styles for dark mode — remap variables only.

### Step 5: CVA Component Architecture

```ts
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border border-border bg-background hover:bg-muted",
        ghost: "hover:bg-muted hover:text-foreground",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4",
        lg: "h-11 px-6",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  }
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;
```

**CVA rules:**
- Base string = shared layout, focus, disabled
- Variants map to semantic Tailwind utilities
- Export `VariantProps` for typing
- Merge with `cn()` for consumer overrides

### Step 6: Validate

- [ ] No primitive color classes in components
- [ ] Dark mode works by variable swap only
- [ ] Focus rings use `--color-ring`
- [ ] All interactive states defined (hover, active, disabled)
- [ ] Contrast meets WCAG AA for text pairs

---

## v3 → v4 Migration

| v3 Pattern | v4 Equivalent |
|------------|---------------|
| `tailwind.config.js` `theme.extend.colors` | `@theme { --color-* }` in CSS |
| `darkMode: 'class'` | `.dark { }` variable overrides |
| `plugins: [require('@tailwindcss/forms')]` | `@plugin "@tailwindcss/forms"` |
| `@apply` in many files | Prefer utilities; limit `@apply` to primitives |
| `content: ['./src/**/*']` | Automatic in v4 with `@source` if needed |

Migration checklist:

1. Create `app.css` with `@import "tailwindcss"` and `@theme` block
2. Move `theme.extend` values to CSS custom properties
3. Convert hex colors to OKLCH (`oklch()` in DevTools or culori)
4. Replace config plugins with `@plugin` directives
5. Delete or slim `tailwind.config.js` to v4-compatible format
6. Run build; fix any deprecated utility renames

---

## Constraints

- Prefer OKLCH over HSL/hex for new palettes
- One source of truth: `@theme` + `:root` variables
- No inline hex/rgb in components
- Variant APIs must use `variant` and `size` props, not ad-hoc class strings
- Document token additions in `DESIGN.md` or `design-system/MASTER.md`

## Output Format

When generating a theme deliverable:

```markdown
# Design Token System

## Primitives
[OKLCH scale table]

## Semantic Mapping
| Token | Light | Dark | Usage |

## @theme Block
[CSS snippet]

## Component Variants
[CVA definitions per component]

## Migration Notes
[v3 remnants to remove]
```
