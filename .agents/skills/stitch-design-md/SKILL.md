---
name: stitch-design-md
description: 'Analyze Google Stitch projects and generate comprehensive DESIGN.md files documenting tokens, typography, components, and patterns. Use when onboarding to a Stitch design or exporting design context for implementation. Requires Stitch MCP. Source: google-labs-code/stitch-skills.'
compatibility: Requires Stitch MCP server configured and authenticated.
---

# Stitch Design MD

Analyze Stitch design projects and produce comprehensive `DESIGN.md` documentation for agent and developer consumption.

## Prerequisites

- Stitch MCP server enabled (`mcp_auth` if needed)
- Stitch project ID or URL from the user
- Read MCP tool schemas before calling any Stitch tool

## When to Use

- User shares a Stitch project link or ID
- Starting implementation from an existing Stitch design
- Documenting design decisions for a team or agent handoff
- Generating `DESIGN.md` as part of project init

---

## Workflow

```
Parse project reference → Fetch project via Stitch MCP → Extract design signals →
Synthesize DESIGN.md → Validate completeness
```

### Step 1: Parse Project Reference

Accept formats:
- Stitch project URL
- Project ID string
- User description + project name (search via MCP)

Record: project name, screens included, last updated if available.

### Step 2: Fetch via Stitch MCP

Inspect available Stitch MCP tools (typical operations):

| Goal | MCP Action |
|------|------------|
| List projects | Search/list projects |
| Get project details | Fetch project metadata |
| Get screens | List screens with IDs |
| Get screen design | Fetch layout, styles, components per screen |
| Get assets | Download icons, images, fonts |

Call tools per schema. Batch screen fetches when independent.

### Step 3: Extract Design Signals

For each screen and global project settings, capture:

**Colors**
- Primary, secondary, accent, background, surface, text, border, status colors
- Format as hex, OKLCH, or CSS variables — note source

**Typography**
- Font families, weights, sizes, line heights, letter spacing
- Heading hierarchy (h1–h6 mapping)

**Spacing & Layout**
- Grid columns, gutters, max widths
- Padding/margin patterns
- Breakpoints or responsive behavior notes

**Components**
- Buttons (variants, sizes, states)
- Inputs, selects, checkboxes
- Cards, modals, navigation
- Tables, badges, avatars

**Motion** (if defined)
- Transition durations, easing curves
- Animation patterns

**Iconography & Imagery**
- Icon set, stroke width, sizes
- Image treatment (radius, aspect ratios)

### Step 4: Synthesize DESIGN.md

Use the output template below. Cross-reference screens for consistency; flag conflicts.

### Step 5: Validate

- [ ] All screens accounted for
- [ ] Token values consistent across screens
- [ ] Component inventory complete
- [ ] Implementation notes for framework (if known)
- [ ] Open questions listed explicitly

---

## Rules & Constraints

- Document what Stitch shows — do not invent tokens not in the design
- Flag inconsistencies between screens (e.g., two different primary blues)
- Prefer CSS custom property naming for implementation handoff
- Include source screen names for traceability
- If MCP unavailable, stop and report — do not hallucinate project data

## Output Format

Write `DESIGN.md` to project root or `design-system/DESIGN.md`:

```markdown
# Design System: [Project Name]

> Generated from Stitch project `[ID]`. Last analyzed: [date].

## Overview
[1–2 paragraphs: product type, visual tone, target platform]

## Design Principles
- [Principle 1]
- [Principle 2]

## Color Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | #... | CTAs, links |
| `--color-background` | #... | Page background |

### Dark Mode
[Token overrides or "not defined in Stitch"]

## Typography

| Role | Font | Size | Weight | Line Height |
|------|------|------|--------|-------------|
| Display | ... | ... | ... | ... |
| Body | ... | ... | ... | ... |

## Spacing & Layout

- Grid: [columns, gutter]
- Max content width: [value]
- Section spacing: [pattern]

## Border Radius & Shadows

| Token | Value |
|-------|-------|
| `--radius-sm` | ... |

## Components

### Button
- Variants: primary, secondary, ghost
- Sizes: sm, md, lg
- States: default, hover, disabled
- Source screens: [names]

### [Component N]
...

## Screen Inventory

| Screen | Purpose | Key Patterns |
|--------|---------|--------------|
| Home | ... | hero, feature grid |

## Assets

- Fonts: [URLs or files]
- Icons: [set name]
- Images: [notes]

## Implementation Notes

- Recommended stack: [React + Tailwind, etc.]
- Token file location: `design-system/tokens.css`
- Known gaps: [list]

## Open Questions

- [ ] ...
```
