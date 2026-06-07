---
name: shadcn-official
description: 'Add, search, fix, debug, style, and compose shadcn/ui components correctly. Use when working with shadcn/ui in React/Next.js/Tailwind projects. Reads components.json, project config, and installed components to provide accurate guidance. Source: shadcn-ui/ui.'
---

# shadcn/ui Official Skill

Use shadcn/ui components correctly in React + Tailwind CSS projects.

## Before Any Component Work

1. Read `components.json` to understand project configuration (style, rsc, aliases, tailwind config path)
2. Check which components are already installed: scan `src/components/ui/` or configured path
3. Use shadcn MCP (if available) to browse and install components from the registry

## Adding Components

```bash
npx shadcn@latest add <component-name>
npx shadcn@latest add button card dialog input
```

Always use the CLI to add components. Never manually copy component code from docs.

## Component Patterns

### Buttons

```tsx
<Button variant="default" size="default">Primary Action</Button>
<Button variant="outline" size="sm">Secondary</Button>
<Button variant="ghost" size="icon"><Icon /></Button>
<Button disabled>Disabled</Button>
<Button asChild><Link href="/page">Nav Link</Link></Button>
```

- Use `variant` and `size` props -- never override with arbitrary Tailwind classes for these
- Use `asChild` for polymorphic rendering (Link, anchor)
- Icon-only buttons: `size="icon"` + `aria-label`

### Forms

```tsx
<Form>
  <FormField control={form.control} name="email" render={({ field }) => (
    <FormItem>
      <FormLabel>Email</FormLabel>
      <FormControl><Input {...field} /></FormControl>
      <FormDescription>Your work email</FormDescription>
      <FormMessage />
    </FormItem>
  )} />
</Form>
```

- Always use `FormField` + `FormItem` + `FormLabel` + `FormControl` + `FormMessage`
- Never use bare `<input>` outside the form system
- Connect to react-hook-form via `useForm` + zodResolver

### Dialogs & Sheets

```tsx
<Dialog>
  <DialogTrigger asChild><Button>Open</Button></DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    {/* content */}
    <DialogFooter><Button>Confirm</Button></DialogFooter>
  </DialogContent>
</Dialog>
```

- Always include `DialogTitle` and `DialogDescription` (accessibility)
- Use `asChild` on triggers
- Footer for actions

### Data Tables

- Use `@tanstack/react-table` with shadcn DataTable pattern
- Column definitions as typed array
- Include sorting, filtering, pagination as needed
- Row selection with checkbox column

## Styling Rules

- Use CSS variables from the theme, not hardcoded colors
- Extend components with `className` prop + `cn()` utility
- Never modify files in `components/ui/` directly for project-specific styling
- Create wrapper components for project-specific variants

```tsx
// Good: wrapper component
function PrimaryCard({ children, className }) {
  return <Card className={cn("border-primary/20", className)}>{children}</Card>
}

// Bad: modifying ui/card.tsx directly
```

## Semantic Tokens

shadcn uses HSL-based semantic tokens:

```css
--background, --foreground
--card, --card-foreground
--primary, --primary-foreground
--secondary, --secondary-foreground
--muted, --muted-foreground
--accent, --accent-foreground
--destructive, --destructive-foreground
--border, --input, --ring
--radius
```

Always reference these in custom components. Never use arbitrary Tailwind colors (`bg-blue-500`) when a semantic token exists.

## MCP Integration

If shadcn MCP is configured, use it to:
- Browse available components before building custom ones
- Search for specific UI patterns
- Install components with correct dependencies
- Check component documentation and props

## Constraints

- Never guess component APIs -- check docs or installed source
- Never add components manually without the CLI (dependencies may be missed)
- Never override semantic tokens with hardcoded values in components
- Always handle loading, error, and empty states in data-driven components
- Always include proper ARIA attributes (shadcn components include these by default)
