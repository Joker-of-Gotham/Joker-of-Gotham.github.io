---
name: figma-implement-design
description: 'Implement Figma designs in production code through a 7-step workflow: parse URL, get design context, screenshot, download assets, translate to framework, achieve 1:1 parity, validate. Use when converting Figma frames to code. Requires Figma MCP. Source: openai/skills.'
compatibility: Requires Figma MCP server configured and authenticated.
---

# Figma Implement Design

Seven-step workflow to translate Figma designs into production code with 1:1 visual parity.

## Prerequisites

- Figma MCP server enabled
- Figma file URL or node ID from user
- Target framework identified (React, Vue, HTML, etc.)
- Read Figma MCP tool schemas before calling

## When to Use

- User shares a Figma link and asks to implement
- Converting design frames to components
- Rebuilding a screen to match design specs
- Figma-to-code handoff tasks

---

## Workflow

```
1. Parse URL → 2. Get design context → 3. Screenshot →
4. Download assets → 5. Translate to framework → 6. Achieve parity → 7. Validate
```

Track progress:

```
- [ ] Step 1: Parse Figma URL
- [ ] Step 2: Get design context
- [ ] Step 3: Get screenshot
- [ ] Step 4: Download assets
- [ ] Step 5: Translate to project framework
- [ ] Step 6: Achieve 1:1 parity
- [ ] Step 7: Validate
```

### Step 1: Parse Figma URL

Extract from URL:
- `fileKey` — file identifier
- `nodeId` — specific frame/component (convert `-` to `:` in node ID)
- Page context if linked to a specific canvas

```
https://figma.com/design/:fileKey/:fileName?node-id=1-2
→ fileKey = :fileKey, nodeId = 1:2
```

Confirm with user which frame(s) to implement if multiple nodes.

### Step 2: Get Design Context

Call Figma MCP `get_design_context` (or equivalent):

- Layout tree (frames, groups, auto-layout)
- Typography (font family, size, weight, line height, letter spacing)
- Colors (fills, strokes, gradients)
- Spacing (padding, gap, item spacing)
- Border radius, shadows, effects
- Component instances and variants
- Responsive constraints if defined

Build an implementation spec table before writing code.

### Step 3: Get Screenshot

Call `get_screenshot` for the target node:

- Use as visual reference during implementation
- Compare against during parity check (Step 6)
- Capture at 1x and 2x if MCP supports scale parameter

Save screenshot locally for comparison if possible.

### Step 4: Download Assets

Call asset download tools for:
- Raster images (PNG, JPG, WebP)
- SVG icons and logos
- Export at correct resolution (@1x, @2x)

Organize assets:
```
public/assets/[feature]/
  icon-settings.svg
  hero-image@2x.webp
```

**Rules:**
- Prefer SVG for icons
- Use WebP for photos when supported
- Name files semantically, not `image-1.png`
- Record original Figma node name → file path mapping

### Step 5: Translate to Project Framework

Map Figma properties to project conventions:

| Figma | Implementation |
|-------|----------------|
| Auto-layout horizontal | `flex flex-row` or `display: flex` |
| Auto-layout vertical | `flex flex-col` |
| Gap | `gap-[Npx]` or token class |
| Fill | `bg-*` semantic token or exact value |
| Text style | Typography utility or component |
| Component instance | Project component or new component |
| Effects | `shadow-*`, `backdrop-blur` |

**Framework rules:**
- React: functional components, match existing file structure
- Use project's design tokens when available — exact hex only when no token match
- Extract repeating patterns into components
- Match naming conventions in codebase

### Step 6: Achieve 1:1 Parity

Compare implementation against Figma screenshot:

| Property | Tolerance |
|----------|-----------|
| Layout structure | Exact match |
| Spacing | ±2px acceptable |
| Typography | Exact font/size/weight |
| Colors | Exact or nearest token |
| Border radius | Exact |
| Shadows | Visual match |
| Icons/images | Correct asset, correct size |

Iterate: fix discrepancies, re-screenshot, compare again.

### Step 7: Validate

- [ ] Visual comparison passes at 1440px and 375px widths
- [ ] Interactive states implemented (hover, focus, disabled) if in design
- [ ] Text content matches design copy
- [ ] Assets load correctly
- [ ] No horizontal overflow on mobile
- [ ] Accessibility: semantic HTML, alt text, focus visible
- [ ] Lint/build passes

---

## Constraints

- Figma MCP required — do not guess design values
- Implement the specified node only — don't redesign
- Prefer project tokens over hardcoded Figma values
- Ask user when design is ambiguous (missing mobile frame, undefined states)
- Document any intentional deviations with rationale

## Output Format

```markdown
# Figma Implementation: [Frame Name]

## Source
- File: [name]
- Node ID: [id]
- URL: [link]

## Design Spec Summary
| Property | Value |
| Typography | ... |
| Colors | ... |
| Spacing | ... |

## Files Created/Modified
- `path/to/Component.tsx`
- `public/assets/...`

## Assets Downloaded
| Figma Node | Local Path |

## Parity Notes
| Element | Status | Notes |

## Deviations
- [Any intentional changes with rationale]

## Validation
- [x] Desktop parity
- [x] Mobile parity
- [x] Build passes
```
