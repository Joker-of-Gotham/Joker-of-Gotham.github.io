---
name: minimal-design-system
description: 'Bootstrap clean SaaS UIs with minimalist shadcn-inspired HSL tokens, Inter font, and Tailwind CDN. Use for rapid prototypes, MVPs, or greenfield projects needing a polished base without heavy tooling. Source: holger1411 (adapted).'
---

# Minimal Design System

Minimalist shadcn-inspired design system using HSL CSS variables, Inter typography, and Tailwind CDN — optimized for fast, clean SaaS interfaces.

## When to Use

- Rapid prototypes or demos without build tooling
- Greenfield SaaS dashboards or marketing pages
- Projects needing shadcn-like aesthetics with minimal setup
- Base template before graduating to full Tailwind v4 pipeline

---

## Workflow

```
Copy base template → Customize HSL tokens → Apply component patterns →
Add pages → Verify contrast and spacing
```

### Step 1: Base HTML Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>App</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
          colors: {
            border: 'hsl(var(--border))',
            input: 'hsl(var(--input))',
            ring: 'hsl(var(--ring))',
            background: 'hsl(var(--background))',
            foreground: 'hsl(var(--foreground))',
            primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
            secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
            muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
            accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
            destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
            card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
          },
          borderRadius: {
            lg: 'var(--radius)',
            md: 'calc(var(--radius) - 2px)',
            sm: 'calc(var(--radius) - 4px)',
          },
        },
      },
    };
  </script>
  <style>
    :root {
      --background: 0 0% 100%;
      --foreground: 222.2 84% 4.9%;
      --card: 0 0% 100%;
      --card-foreground: 222.2 84% 4.9%;
      --primary: 222.2 47.4% 11.2%;
      --primary-foreground: 210 40% 98%;
      --secondary: 210 40% 96.1%;
      --secondary-foreground: 222.2 47.4% 11.2%;
      --muted: 210 40% 96.1%;
      --muted-foreground: 215.4 16.3% 46.9%;
      --accent: 210 40% 96.1%;
      --accent-foreground: 222.2 47.4% 11.2%;
      --destructive: 0 84.2% 60.2%;
      --destructive-foreground: 210 40% 98%;
      --border: 214.3 31.8% 91.4%;
      --input: 214.3 31.8% 91.4%;
      --ring: 222.2 84% 4.9%;
      --radius: 0.5rem;
    }
    .dark {
      --background: 222.2 84% 4.9%;
      --foreground: 210 40% 98%;
      --card: 222.2 84% 4.9%;
      --card-foreground: 210 40% 98%;
      --primary: 210 40% 98%;
      --primary-foreground: 222.2 47.4% 11.2%;
      --secondary: 217.2 32.6% 17.5%;
      --secondary-foreground: 210 40% 98%;
      --muted: 217.2 32.6% 17.5%;
      --muted-foreground: 215 20.2% 65.1%;
      --accent: 217.2 32.6% 17.5%;
      --accent-foreground: 210 40% 98%;
      --destructive: 0 62.8% 30.6%;
      --destructive-foreground: 210 40% 98%;
      --border: 217.2 32.6% 17.5%;
      --input: 217.2 32.6% 17.5%;
      --ring: 212.7 26.8% 83.9%;
    }
    * { border-color: hsl(var(--border)); }
    body {
      background-color: hsl(var(--background));
      color: hsl(var(--foreground));
      font-family: Inter, system-ui, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
  </style>
</head>
<body class="min-h-screen bg-background text-foreground antialiased">
  <!-- content -->
</body>
</html>
```

### Step 2: Component Patterns

**Button (primary)**
```html
<button class="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
  Continue
</button>
```

**Card**
```html
<div class="rounded-lg border bg-card text-card-foreground shadow-sm">
  <div class="flex flex-col space-y-1.5 p-6">
    <h3 class="text-lg font-semibold leading-none tracking-tight">Title</h3>
    <p class="text-sm text-muted-foreground">Description</p>
  </div>
  <div class="p-6 pt-0">Content</div>
</div>
```

**Input**
```html
<input class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
```

### Step 3: Page Shell (SaaS)

```html
<div class="flex min-h-screen">
  <aside class="hidden w-64 border-r bg-card md:block">
    <nav class="flex flex-col gap-1 p-4">...</nav>
  </aside>
  <main class="flex-1 p-6 md:p-8">
    <header class="mb-8">
      <h1 class="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p class="text-muted-foreground">Overview of your workspace</p>
    </header>
    <!-- content -->
  </main>
</div>
```

---

## Customization Rules

- Change brand by adjusting `--primary` HSL only; keep semantic structure
- One accent hue family; avoid rainbow palettes
- Radius: `--radius` 0.375rem (tight) to 0.75rem (soft)
- Spacing: stick to Tailwind scale (`p-4`, `p-6`, `gap-4`)
- Typography: Inter 400 body, 500 labels, 600 headings, 700 hero

## Constraints

- CDN Tailwind is for prototypes — migrate to build pipeline for production
- No custom colors outside HSL variable system
- No decorative gradients or glassmorphism by default
- White space is a feature — resist clutter
- Dark mode via `class="dark"` on `<html>`

## Output Format

Deliver:
1. Complete HTML template with tokens
2. Token table (light + dark HSL values)
3. 3–5 component snippets (button, card, input, nav, table)
4. One sample page layout

```markdown
# Minimal Design System

## Tokens
| Variable | Light HSL | Dark HSL |

## Base Template
[HTML file path or snippet]

## Components
[List with usage notes]
```
