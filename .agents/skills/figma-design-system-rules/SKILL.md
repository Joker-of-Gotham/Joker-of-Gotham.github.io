---
name: figma-design-system-rules
description: 'Generate agent-readable design system rules from Figma files for CLAUDE.md, AGENTS.md, or .cursor/rules/. Use when setting up design governance, onboarding agents to a Figma design system, or creating implementation constraints. Requires Figma MCP. Source: figma/mcp-server-guide.'
compatibility: Requires Figma MCP server configured and authenticated.
---

# Figma Design System Rules

Extract design system rules from Figma files and output agent-readable governance documents for `CLAUDE.md`, `AGENTS.md`, or `.cursor/rules/`.

## Prerequisites

- Figma MCP server enabled
- Figma design system file URL (variables, components, styles)
- Target output location from user (or default to `.cursor/rules/design-system.mdc`)

## When to Use

- Setting up agent design governance for a team
- Onboarding coding agents to an existing Figma design system
- Creating implementation rules from Figma variables and components
- Generating `.cursor/rules/` from design source of truth

---

## Workflow

```
Identify DS file → Extract variables & styles → Extract components →
Map to code conventions → Write rules document → Place in target location
```

### Step 1: Identify Design System File

Confirm the Figma file contains:
- **Variables** (color, spacing, typography, radius)
- **Component library** (buttons, inputs, cards, etc.)
- **Text styles** and **effect styles**
- **Documentation pages** (if present)

Parse file key and relevant page/node IDs from URL.

### Step 2: Extract via Figma MCP

Fetch systematically:

| Figma Source | Extract |
|--------------|---------|
| Color variables | Primitive + semantic names, light/dark modes |
| Spacing variables | Scale steps, usage descriptions |
| Typography variables | Font, size, weight, line height per role |
| Radius/effects | Corner radii, shadow definitions |
| Components | Names, variants, properties, anatomy |
| Text styles | Mapped to typography roles |
| Grid/layout | Column count, gutter, margins |

Call MCP tools per schema. Prefer variable collections over inspecting individual frames.

### Step 3: Map to Code Conventions

Align Figma naming to project code:

| Figma | Code |
|-------|------|
| `color/primary/default` | `--color-primary` / `bg-primary` |
| `spacing/4` | `--spacing-4` / `p-4` |
| `radius/md` | `--radius-md` / `rounded-md` |
| `Button/Primary/Large` | `<Button variant="primary" size="lg">` |

Detect project stack:
- Tailwind v3/v4 → map to `@theme` or `tailwind.config`
- CSS modules → map to custom properties
- shadcn/ui → map to component variants

### Step 4: Write Rules Document

Structure for agent consumption — imperative rules, not prose documentation.

### Step 5: Place Output

| Target | When |
|--------|------|
| `.cursor/rules/design-system.mdc` | Cursor agent rules |
| `AGENTS.md` | Multi-agent repo governance |
| `CLAUDE.md` | Claude Code project context |
| `design-system/RULES.md` | Standalone reference |

Ask user preference if not specified. Default: `.cursor/rules/design-system.mdc`.

---

## Rules Generation Principles

- **Imperative mood**: "Use `bg-primary` for CTAs" not "Primary is used for..."
- **Constraints over suggestions**: "Never use primitive colors in components"
- **Include don'ts**: Explicit anti-patterns from Figma misuse
- **Variant tables**: Map Figma component properties to code props
- **Token tables**: Figma variable → CSS variable → utility class
- **Keep under 200 lines** for the rules file — link to full token export for details

## Constraints

- Rules reflect Figma source of truth — don't invent tokens
- Flag Figma inconsistencies (duplicate variables, naming conflicts)
- Separate **rules** (agent must follow) from **reference** (lookup tables)
- Include file key and last-sync date for traceability
- Re-sync when Figma variables change significantly

## Output Format

### `.cursor/rules/design-system.mdc` template

```markdown
---
description: Design system rules extracted from Figma. Apply to all frontend UI work.
globs: ["**/*.{tsx,jsx,vue,css}"]
---

# Design System Rules

> Source: Figma file `[name]` ([fileKey]). Last synced: [date].

## Stack
- Framework: [React + Tailwind v4]
- Components: [shadcn/ui]
- Token file: [path]

## Token Rules

1. Use semantic tokens only — never primitive palette values in components.
2. Dark mode via CSS variable swap on `.dark` class.
3. Spacing uses the 4px base scale from Figma variables.

### Color Mapping
| Figma Variable | CSS Variable | Tailwind Class | Usage |
|----------------|--------------|----------------|-------|
| color/primary | --color-primary | bg-primary | CTAs, links |

### Typography Mapping
| Figma Style | Size | Weight | Class |
|-------------|------|--------|-------|
| Heading/H1 | 36px | 600 | text-4xl font-semibold |

## Component Rules

### Button
- Figma: `Button/[Variant]/[Size]`
- Code: `<Button variant="..." size="...">`
- Variants: default, outline, ghost, destructive
- Always include focus-visible ring
- Icon-only buttons require aria-label

### Input
- Figma: `Input/Default`
- Code: `<Input />` from `@/components/ui/input`
- Never use raw `<input>` outside form system

## Layout Rules
- Max content width: [value] (Figma: `layout/max-width`)
- Grid: [columns] columns, [gutter] gutter
- Section padding: [value]

## Don'ts
- Do not use colors outside the variable collection
- Do not create one-off font sizes — use the type scale
- Do not mix border radii — use `radius-sm|md|lg` tokens
- Do not implement custom shadows — use `shadow-sm|md|lg`

## Sync Notes
- [Figma inconsistencies found]
- [Variables without code mapping]
```

### Supplementary `design-system/figma-tokens.json`

Optional machine-readable export for token pipeline tools.

```markdown
## Deliverables
1. Rules file at [path]
2. Token mapping table
3. Component variant mapping table
4. List of unresolved Figma → code gaps
```
