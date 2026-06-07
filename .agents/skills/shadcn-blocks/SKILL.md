---
name: shadcn-blocks
description: 'Browse and integrate 1338+ Shadcnblocks layouts and 1189 components for landing pages, dashboards, pricing, e-commerce, and more. Use when building marketing or app UI with pre-built shadcn-compatible blocks. Requires ShadcnBlocks API key. Source: masonjames/Shadcnblocks-Skill.'
compatibility: Requires SHADCNBLOCKS_API_KEY environment variable or user-provided API key.
---

# Shadcn Blocks

Access Shadcnblocks library — 1338+ blocks and 1189 components for landing pages, dashboards, pricing, e-commerce, auth, and more.

## Prerequisites

- ShadcnBlocks API key: `SHADCNBLOCKS_API_KEY` env var or user-provided key
- Project with shadcn/ui initialized (`components.json` present)
- React + Tailwind CSS

## When to Use

- Building landing pages, marketing sections, or full page layouts
- Need pre-built dashboard, pricing, testimonial, or hero sections
- User mentions Shadcnblocks or wants shadcn-compatible block library
- Accelerating UI build without designing from scratch

---

## Workflow

```
Verify API key → Search blocks by category → Preview candidates →
Install selected blocks → Adapt to project tokens → Verify render
```

### Step 1: Verify Setup

```bash
# Confirm API key is set
echo $SHADCNBLOCKS_API_KEY   # Unix
$env:SHADCNBLOCKS_API_KEY    # PowerShell
```

Read `components.json` for:
- Style variant (`new-york` | `default`)
- Tailwind config path
- Component aliases (`@/components`)

If no API key, stop and ask user to obtain one from [shadcnblocks.com](https://www.shadcnblocks.com).

### Step 2: Search Blocks

Query by category and intent:

| Category | Use Cases |
|----------|-----------|
| `hero` | Landing page headers |
| `features` | Product capability grids |
| `pricing` | Tier comparison tables |
| `testimonials` | Social proof sections |
| `cta` | Conversion bands |
| `navbar` / `footer` | Site chrome |
| `dashboard` | Admin panels, stats, tables |
| `auth` | Login, signup, forgot password |
| `ecommerce` | Product grids, carts, checkout |
| `blog` | Article lists, post layouts |
| `team` | About page grids |
| `faq` | Accordion sections |
| `contact` | Forms, maps |
| `stats` | KPI displays |
| `logo-cloud` | Client logos |

Search API (typical pattern):

```bash
curl -H "Authorization: Bearer $SHADCNBLOCKS_API_KEY" \
  "https://api.shadcnblocks.com/v1/blocks?category=pricing&query=saas"
```

Or use Shadcnblocks MCP/CLI if configured in the project.

### Step 3: Preview & Select

For each candidate block, evaluate:
- Matches project's shadcn style variant
- Component dependencies (all installable via shadcn CLI)
- Responsive behavior
- Accessibility (heading hierarchy, alt text, focus states)

Present top 3 options to user when taste is unspecified.

### Step 4: Install

```bash
# Typical install pattern (adjust per API response)
npx shadcn@latest add https://shadcnblocks.com/r/[block-id]

# Install block dependencies first
npx shadcn@latest add button card badge
```

**Install rules:**
- Use official shadcn CLI — never hand-copy without checking registry
- Install all dependent shadcn components before the block
- Place blocks in `components/blocks/` or project convention

### Step 5: Adapt to Project Tokens

After install:
- Replace hardcoded colors with project semantic tokens
- Swap placeholder copy with domain-specific content
- Adjust spacing to match project scale
- Wire images to project asset paths
- Connect CTAs to real routes

### Step 6: Verify

- [ ] Block renders without import errors
- [ ] Responsive at mobile, tablet, desktop
- [ ] Dark mode compatible (if project supports it)
- [ ] No missing shadcn dependencies
- [ ] Lighthouse accessibility ≥ 90 for the section

---

## Block Composition Patterns

**Landing page stack:**
```
Navbar → Hero → Logo Cloud → Features → Testimonials → Pricing → FAQ → CTA → Footer
```

**Dashboard shell:**
```
Sidebar + Header → Stats Row → Main Chart → Recent Activity Table
```

**E-commerce:**
```
Navbar → Category Filter → Product Grid → Cart Drawer
```

Mix blocks from same style variant for visual consistency.

## Constraints

- API key required — never scrape blocks without authorization
- Blocks are starting points — customize copy, tokens, and imagery
- Respect Shadcnblocks license terms for commercial use
- Do not mix `default` and `new-york` style blocks in one page
- Install dependencies before block code

## Output Format

When delivering block integration:

```markdown
# Shadcnblocks Integration

## Selected Blocks
| Block | Category | ID | Dependencies |

## Install Commands
[Ordered CLI commands]

## Adaptations Made
- [Token swaps]
- [Copy changes]
- [Route wiring]

## Page Composition
[Block order with file paths]

## Remaining Manual Steps
- [ ] ...
```
