# Design Token Schema Reference

## W3C Design Tokens Community Group (DTCG 2025.10)

The stable specification for cross-platform design token exchange.

### JSON Format

```json
{
  "$schema": "https://www.designtokens.org/schemas/2025.10/token.schema.json",
  "color": {
    "primary": {
      "$value": "oklch(0.55 0.20 264)",
      "$type": "color",
      "$description": "Primary brand color"
    },
    "background": {
      "$value": "{color.neutral.50}",
      "$type": "color"
    }
  },
  "spacing": {
    "base": { "$value": "0.25rem", "$type": "dimension" },
    "2": { "$value": "{spacing.base} * 2", "$type": "dimension" }
  }
}
```

### Key Rules

- `$value`: the token value (can reference other tokens with `{}`)
- `$type`: color, dimension, fontFamily, fontWeight, duration, cubicBezier, shadow
- Groups create namespace hierarchy: `color.primary`, `spacing.base`
- References use `{group.token}` syntax

## Tailwind v4 `@theme` Mapping

### Namespace Convention

| Token Category | Tailwind Namespace | CSS Variable |
|---|---|---|
| Colors | `--color-*` | `var(--color-primary)` |
| Fonts | `--font-*` | `var(--font-sans)` |
| Spacing | `--spacing-*` | Uses spacing scale |
| Radius | `--radius-*` | `var(--radius-md)` |
| Shadows | `--shadow-*` | `var(--shadow-md)` |
| Duration | `--duration-*` | `var(--duration-normal)` |
| Easing | `--ease-*` | `var(--ease-out)` |

### Three-Layer Implementation

```css
/* Layer 1: Base (raw OKLCH values) */
@theme {
  --color-blue-500: oklch(0.55 0.20 264);
  --color-amber-500: oklch(0.75 0.18 80);
  --color-neutral-50: oklch(0.98 0.005 264);
  --color-neutral-900: oklch(0.15 0.01 264);
}

/* Layer 2: Semantic (role assignment) */
:root {
  --color-background: var(--color-neutral-50);
  --color-foreground: var(--color-neutral-900);
  --color-primary: var(--color-blue-500);
  --color-accent: var(--color-amber-500);
}

/* Dark mode: remap semantics only */
.dark {
  --color-background: var(--color-neutral-900);
  --color-foreground: var(--color-neutral-50);
}

/* Layer 3: Component (specific overrides) */
.button-primary {
  background: var(--color-primary);
  color: var(--color-primary-foreground);
}
```

### Export Pipeline

```
DESIGN.md (source of truth)
  → tokens.json (DTCG format)
  → @theme block (Tailwind v4)
  → :root variables (vanilla CSS)
  → component tokens (as needed)
```

## Validation

- Every token in `@theme` must have a semantic role assigned
- No component should reference Layer 1 tokens directly
- Dark mode must only remap Layer 2 (semantic), never Layer 1 (base)
- All color values in OKLCH for perceptual uniformity
