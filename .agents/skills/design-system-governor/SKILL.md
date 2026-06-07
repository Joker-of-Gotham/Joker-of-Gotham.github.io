---
name: design-system-governor
description: 'Enforce design token discipline across frontend projects. Generates DESIGN.md, CSS custom properties, and Tailwind v4 @theme configurations. Ensures all colors, fonts, spacing, radius, shadows, and motion values enter the token system before use. Use when creating or modifying design systems, or when a project lacks DESIGN.md. Prevents hardcoded visual values in components.'
---

# Design System Governor

Ensure all visual values flow through a token system. No hardcoded colors, fonts, spacing, or shadows in components.

## Trigger

- New project without DESIGN.md
- User requests design system creation or modification
- `design-brief-gate` has produced a confirmed brief
- Detected hardcoded visual values in component code

## Workflow

### Step 1: Detect Existing System

Scan the project for design signals:
- `DESIGN.md` or `design-system/MASTER.md`
- `tailwind.config.*` or CSS `@theme` block
- CSS files with `:root` custom properties
- `tokens.json` or design token files
- `components.json` (shadcn configuration)

### Step 2: Mode Selection

- **Create**: No system exists → generate from brief
- **Extend**: Partial system → add missing layers
- **Enforce**: System exists → audit compliance

### Step 3: Token Architecture

Three-layer model (always):

```
┌─────────────────────────────────┐
│ Layer 1: Base Tokens (raw)      │  OKLCH values, font names, px values
├─────────────────────────────────┤
│ Layer 2: Semantic Tokens (role) │  --color-background, --color-primary
├─────────────────────────────────┤
│ Layer 3: Component Tokens       │  --button-bg, --card-border
└─────────────────────────────────┘
```

### Step 4: Generate DESIGN.md

Follow Google DESIGN.md spec (8 core sections + 4 extended):

1. Overview (brand + style philosophy)
2. Colors (OKLCH base + semantic mapping)
3. Typography (fonts + fluid scale)
4. Layout (grid + spacing + density)
5. Elevation & Depth (shadows + layers)
6. Shapes (radius scale)
7. Components (button/card/form/nav rules)
8. Do's and Don'ts

Extended sections:
9. Motion & Transitions
10. Responsive Behavior
11. Dark Mode Strategy
12. Agent Prompt Guide

### Step 5: Generate Token Files

Output CSS custom properties + Tailwind v4 `@theme`:

```css
@import "tailwindcss";

@theme {
  --color-background: oklch(0.98 0.01 264);
  --color-foreground: oklch(0.15 0.02 264);
  --color-primary: oklch(0.55 0.20 264);
  --color-primary-foreground: oklch(0.98 0.01 264);
  --color-muted: oklch(0.92 0.01 264);
  --color-border: oklch(0.88 0.02 264);
  --color-accent: oklch(0.60 0.22 30);

  --font-sans: "Inter Variable", system-ui, sans-serif;
  --font-mono: "JetBrains Mono Variable", monospace;

  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;

  --spacing-unit: 0.25rem;
}
```

## Hard Rules

1. **No raw hex/rgb in components** -- every color must reference a token
2. **No arbitrary font-size** -- use the type scale
3. **No magic number spacing** -- use the spacing scale
4. **No unregistered shadows** -- define levels in tokens
5. **New values require DESIGN.md update first**
6. **Dark mode = remap semantic tokens, not duplicate components**

## Priority Order

1. User confirmation (highest)
2. DESIGN.md
3. design-system/MASTER.md
4. design-system/pages/*.md (overrides)
5. Existing component conventions
6. This skill's defaults (lowest)

## Verification

After generating or updating:
- [ ] All semantic tokens have both light and dark values
- [ ] Contrast ratios pass WCAG AA (4.5:1 text, 3:1 UI)
- [ ] Type scale is fluid (uses clamp())
- [ ] Spacing scale is consistent (base-unit multiples)
- [ ] Motion tokens include reduced-motion alternatives

## References

For detailed specifications, see:
- [token-schema.md](references/token-schema.md) -- DTCG 2025.10 format + Tailwind v4 mapping
- [color-oklch.md](references/color-oklch.md) -- OKLCH color system + P3 strategy
- [typography-fluid.md](references/typography-fluid.md) -- Variable fonts + fluid scale
- [motion-accessible.md](references/motion-accessible.md) -- View Transitions + reduced-motion
