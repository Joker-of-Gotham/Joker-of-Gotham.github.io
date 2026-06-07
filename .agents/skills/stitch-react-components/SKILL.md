---
name: stitch-react-components
description: 'Convert Stitch screen designs into React component systems with proper design token validation and shadcn-compatible patterns. Use when implementing Stitch designs in React + Tailwind. Requires Stitch MCP. Source: google-labs-code/stitch-skills.'
compatibility: Requires Stitch MCP server configured and authenticated.
---

# Stitch React Components

Convert Stitch screen designs into a structured React component system with validated design tokens.

## Prerequisites

- Stitch MCP server enabled
- React project with Tailwind CSS (shadcn/ui preferred)
- `DESIGN.md` or Stitch project reference
- Read Stitch MCP tool schemas before calling

## When to Use

- Implementing Stitch designs in React
- Converting Stitch screens to reusable component libraries
- Building mobile or web app UI from Stitch prototypes
- After `stitch-design-md` or `stitch-taste-design` documentation exists

---

## Workflow

```
Fetch Stitch screens → Extract tokens → Validate tokens →
Define component hierarchy → Implement components → Compose pages → Verify
```

### Step 1: Fetch Stitch Screens

Via Stitch MCP:
- List project screens
- Fetch each target screen's layout, styles, components
- Download assets (icons, images)

Prioritize screens sharing components (design system extraction first).

### Step 2: Extract Tokens

From Stitch data, build token file:

```css
/* design-system/tokens.css */
:root {
  --color-background: #fafafa;
  --color-foreground: #171717;
  --color-primary: #2563eb;
  --color-primary-foreground: #ffffff;
  --color-muted: #f4f4f5;
  --color-muted-foreground: #71717a;
  --color-border: #e4e4e7;
  --radius-md: 0.5rem;
  --font-sans: 'Inter', system-ui, sans-serif;
}
```

Map to Tailwind v4 `@theme` or v3 `tailwind.config` extension.

### Step 3: Validate Tokens

Before implementing components, verify:

| Check | Rule |
|-------|------|
| Naming | Semantic roles, not hex-based names |
| Pairs | Every `background` has `foreground` |
| Consistency | Same token for same purpose across screens |
| Contrast | Text pairs ≥ 4.5:1 (AA) |
| Completeness | primary, secondary, muted, border, destructive defined |

```ts
// scripts/validate-tokens.ts (conceptual)
const required = ['background', 'foreground', 'primary', 'muted', 'border'];
required.forEach(token => assertDefined(`--color-${token}`));
```

Fix token conflicts before writing components.

### Step 4: Component Hierarchy

Decompose screens bottom-up:

```
Atoms:       Button, Input, Badge, Avatar, Icon
Molecules:   FormField, SearchBar, NavItem, StatCard
Organisms:   Header, Sidebar, DataTable, FeatureGrid
Templates:   DashboardLayout, AuthLayout, SettingsLayout
Pages:       DashboardPage, SettingsPage
```

**Naming:** PascalCase, one component per file, colocate styles via Tailwind.

**File structure:**
```
src/
  components/
    ui/           # shadcn primitives
    blocks/       # Stitch-derived composites
    layouts/      # page shells
  pages/          # route-level composition
  design-system/
    tokens.css
```

### Step 5: Implement Components

**Pattern: CVA variants for Stitch-matched components**

```tsx
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border border-border bg-background hover:bg-muted",
      },
      size: { sm: "h-8 px-3", md: "h-10 px-4", lg: "h-11 px-6" },
    },
    defaultVariants: { variant: "default", size: "md" },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
```

**Implementation rules:**
- Use shadcn/ui primitives when available — extend, don't duplicate
- Token classes only (`bg-primary`, not `bg-blue-600`)
- Props for variants matching Stitch component states
- `cn()` for class merging
- TypeScript interfaces for all props
- `aria-*` attributes for interactive elements

### Step 6: Compose Pages

```tsx
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { StatsRow } from "@/components/blocks/stats-row";
import { RecentActivity } from "@/components/blocks/recent-activity";

export function DashboardPage() {
  return (
    <DashboardLayout>
      <StatsRow />
      <RecentActivity />
    </DashboardLayout>
  );
}
```

Map each Stitch screen → one page component composing blocks.

### Step 7: Verify

- [ ] Visual match to Stitch screens (desktop + mobile)
- [ ] All tokens validated and consistent
- [ ] Components reusable across screens
- [ ] No duplicate component logic
- [ ] TypeScript compiles without errors
- [ ] Storybook or visual check per component (if project uses it)

---

## Stitch → React Mapping

| Stitch Element | React Implementation |
|----------------|---------------------|
| Frame with auto-layout | `flex` + `gap-*` |
| Text layer | Semantic HTML (`h1`, `p`, `span`) + type utilities |
| Component instance | Project component with variants |
| Image | `<img>` or `next/image` with Stitch asset |
| Icon | Lucide or downloaded SVG component |
| Repeat grid | `.map()` over data array |

## Constraints

- Stitch MCP required for design source — don't invent layouts
- Validate tokens before components
- One source of truth: `tokens.css` + `@theme`
- Don't hardcode Stitch hex in components after token extraction
- Match existing project patterns (imports, aliases, file structure)

## Output Format

```markdown
# Stitch → React Component System

## Source
- Stitch project: [ID]
- Screens implemented: [list]

## Token File
`design-system/tokens.css` — [validation status]

## Component Inventory
| Component | Type | Stitch Source | Path |
| Button | Atom | All screens | components/ui/button.tsx |
| StatsRow | Organism | Dashboard | components/blocks/stats-row.tsx |

## Page Mapping
| Stitch Screen | React Page | Components Used |

## Dependencies
- shadcn components installed: [list]

## Validation
- [x] Token validation passed
- [x] Visual parity (desktop)
- [x] Visual parity (mobile)
- [x] TypeScript build
```
