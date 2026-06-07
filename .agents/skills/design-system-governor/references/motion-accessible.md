# Motion & Accessibility Reference

## CSS View Transitions API

### Same-Page (SPA)

```javascript
document.startViewTransition(() => {
  updateDOM(); // synchronous DOM update
});
```

```css
::view-transition-old(root) {
  animation: fade-out 200ms ease-out;
}
::view-transition-new(root) {
  animation: fade-in 200ms ease-in;
}
```

### Cross-Page (MPA)

```css
@view-transition {
  navigation: auto;
}
```

### Named Elements

```css
.hero-image {
  view-transition-name: hero;
}
::view-transition-group(hero) {
  animation-duration: 300ms;
}
```

## @starting-style (Entry Animations)

Animate elements appearing from `display: none`:

```css
.dialog {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 300ms, transform 300ms, display 300ms allow-discrete;
}

@starting-style {
  .dialog {
    opacity: 0;
    transform: translateY(8px);
  }
}

.dialog[hidden] {
  opacity: 0;
  transform: translateY(8px);
  display: none;
}
```

Requires `transition-behavior: allow-discrete` for discrete properties.

## Duration & Easing Tokens

```css
:root {
  --duration-instant: 0ms;
  --duration-fast: 100ms;
  --duration-normal: 200ms;
  --duration-slow: 350ms;
  --duration-slower: 500ms;

  --ease-out: cubic-bezier(0.2, 0, 0, 1);
  --ease-in: cubic-bezier(0.7, 0, 1, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-spring: cubic-bezier(0.2, 1.2, 0.4, 1);
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

### When to Use

| Duration | Use Case |
|----------|----------|
| instant | State toggles (checkbox, radio) |
| fast | Hover states, tooltips |
| normal | Modals, dropdowns, focus |
| slow | Page transitions, reveals |
| slower | Complex orchestrated sequences |

## Framer Motion / Motion React

```tsx
import { MotionConfig } from "motion/react";

function App() {
  return (
    <MotionConfig reducedMotion="user">
      <YourApp />
    </MotionConfig>
  );
}
```

- `reducedMotion="user"`: respects OS preference automatically
- Disables transform/layout animations; keeps opacity/color
- Use `"use client"` directive in Next.js App Router

### LazyMotion for Bundle Size

```tsx
import { LazyMotion, domAnimation } from "motion/react";

function App() {
  return (
    <LazyMotion features={domAnimation}>
      {/* 4.6KB instead of 34KB */}
    </LazyMotion>
  );
}
```

## Reduced Motion (Mandatory)

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation-duration: 0s !important;
  }
}
```

### Safe vs Problematic

| Safe (keep in reduced-motion) | Problematic (remove) |
|------|------|
| Opacity fades | Large translations (> 20px) |
| Color changes | Parallax effects |
| Small scale (< 1.05) | Rotation |
| Instant state swaps | Complex sequences |
| | Flashing (> 3/second) |

## Rules

1. Every animation must have `prefers-reduced-motion` alternative
2. Duration tokens used -- no magic numbers
3. Prefer CSS (View Transitions, @starting-style) before JS libraries
4. Motion must serve purpose: guide attention, show relationships, provide feedback
5. React apps wrapped in `MotionConfig reducedMotion="user"`
6. No motion that triggers vestibular issues (parallax, zoom, rotation)
