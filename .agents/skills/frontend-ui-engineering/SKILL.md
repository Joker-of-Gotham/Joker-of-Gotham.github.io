---
name: frontend-ui-engineering
description: 'Build production-quality UI with proper component architecture, state management, design system adherence, accessibility, and responsive design. Use when building or modifying UI components, responsive layouts, interactivity, state management, or fixing visual/UX bugs. Source: addyosmani/agent-skills.'
---

# Frontend UI Engineering

Build production-quality user interfaces with proper architecture, state management, and design system compliance.

## Component Architecture

### Principles

- **Composition over inheritance**: Build from small, focused components
- **Container/Presentational split**: Separate data logic from visual rendering
- **Single responsibility**: Each component does one thing well
- **Props interface clarity**: Explicit, typed props with sensible defaults

### Component Structure

```
ComponentName/
├── index.ts          (public export)
├── ComponentName.tsx (main component)
├── variants.ts       (CVA or variant definitions)
├── hooks.ts          (component-specific hooks)
└── types.ts          (TypeScript interfaces)
```

### Anti-patterns

- God components (> 200 lines of JSX)
- Prop drilling beyond 2 levels (use context or composition)
- Inline styles for anything reusable
- Direct DOM manipulation in React components

---

## State Management Ladder

Use the simplest solution that fits:

1. **Local state** (`useState`) -- ephemeral UI state (open/closed, hover, input value)
2. **Derived state** (`useMemo`, computed) -- calculated from other state
3. **Shared state** (Context, Zustand, Jotai) -- multiple components need same data
4. **Server state** (React Query, SWR) -- data from API with caching/revalidation
5. **URL state** (searchParams, router) -- shareable, bookmarkable state
6. **Form state** (React Hook Form, Formik) -- complex validation, multi-step

Never skip levels. If `useState` works, do not reach for a global store.

---

## Design System Adherence

### Token Usage

- Always use semantic tokens over raw values: `var(--color-primary)` not `#3b82f6`
- Spacing: use the scale (`--space-1` through `--space-24`)
- Typography: use defined text styles, not arbitrary font-size
- Shadows/radius: use defined levels, not custom values

### AI Aesthetic Anti-patterns (Always Avoid)

| Anti-pattern | Instead |
|---|---|
| Purple/indigo everything | Use project's actual brand color |
| Excessive gradients | Solid colors with intentional accents |
| Rounded everything (16px+) | Match existing radius scale |
| Generic hero with abstract shapes | Content-driven, purposeful visuals |
| Stock card grid | Information hierarchy based on importance |
| Glassmorphism without purpose | Clean surfaces with clear hierarchy |

---

## Accessibility (WCAG 2.2 AA)

### Required

- **Keyboard navigation**: All interactive elements reachable and operable via keyboard
- **Focus indicators**: Visible, high-contrast focus rings (never `outline: none` without replacement)
- **ARIA**: Proper roles, labels, live regions for dynamic content
- **Color contrast**: 4.5:1 for normal text, 3:1 for large text and UI components
- **Motion**: Respect `prefers-reduced-motion`; provide instant alternatives
- **Touch targets**: Minimum 44x44px for mobile interactive elements

### Semantic HTML

```html
<!-- Good -->
<nav aria-label="Main"><ul>...</ul></nav>
<main><article><h1>...</h1></article></main>
<button type="button">Action</button>

<!-- Bad -->
<div class="nav"><div class="list">...</div></div>
<div class="main"><div class="article"><div class="title">...</div></div></div>
<div onclick="..." class="button">Action</div>
```

---

## Responsive Design

### Breakpoint Strategy

- Mobile-first: base styles are mobile, enhance upward
- Use container queries for component-level responsiveness
- Use media queries for page-level layout changes only
- Logical properties (`margin-inline`, `padding-block`) for RTL support

### Layout Patterns

| Pattern | Use Case |
|---|---|
| Stack (flexbox column) | Default mobile layout |
| Sidebar + main | Dashboard, settings |
| Grid auto-fill | Card collections |
| Container query adaptive | Reusable components |

---

## Interactive States

Every interactive component must handle:

| State | Visual |
|---|---|
| Default | Resting appearance |
| Hover | Subtle elevation or color shift |
| Active/Pressed | Compressed, darker |
| Focus-visible | High-contrast ring |
| Disabled | Reduced opacity (0.5), no pointer |
| Loading | Skeleton or spinner, aria-busy |
| Error | Red border/text, aria-invalid, error message |
| Success | Confirmation feedback |
| Empty | Helpful guidance, not blank |

---

## Performance

- Lazy load below-fold content and heavy components
- Use `loading="lazy"` for images below fold
- Prefer CSS animations over JS-driven animations
- Code-split routes and heavy dependencies
- Optimize re-renders: memoize expensive computations, avoid unnecessary context providers

---

## Constraints

- Never ship UI without handling loading, error, and empty states
- Never hardcode colors, spacing, or typography outside the token system
- Never break existing keyboard navigation when adding features
- Always test at mobile (320px), tablet (768px), and desktop (1280px) minimum
