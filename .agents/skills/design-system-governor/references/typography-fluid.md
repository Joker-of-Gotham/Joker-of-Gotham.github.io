# Fluid Typography Reference

## Variable Fonts

Use variable fonts for weight/width flexibility without multiple file loads:

```css
@font-face {
  font-family: "Inter";
  src: url("/fonts/InterVariable.woff2") format("woff2-variations");
  font-weight: 100 900;
  font-display: swap;
}
```

### Recommended 2026 Stacks

| Purpose | Fonts |
|---------|-------|
| Display/Headlines | Fraunces, Instrument Serif, Playfair Display |
| Body (geometric) | Inter, Plus Jakarta Sans, Geist |
| Body (humanist) | Source Sans 3, Nunito Sans |
| Mono/Code | JetBrains Mono, Geist Mono, Fira Code |
| System fallback | system-ui, -apple-system, sans-serif |

## Fluid Type Scale with clamp()

Replace fixed breakpoint typography with fluid scaling:

```css
:root {
  --text-xs:   clamp(0.75rem, 0.7rem + 0.25vw, 0.8125rem);
  --text-sm:   clamp(0.8125rem, 0.775rem + 0.2vw, 0.875rem);
  --text-base: clamp(0.9375rem, 0.9rem + 0.2vw, 1rem);
  --text-lg:   clamp(1.0625rem, 1rem + 0.3vw, 1.125rem);
  --text-xl:   clamp(1.1875rem, 1.1rem + 0.45vw, 1.3125rem);
  --text-2xl:  clamp(1.4375rem, 1.3rem + 0.7vw, 1.625rem);
  --text-3xl:  clamp(1.75rem, 1.5rem + 1.25vw, 2.25rem);
  --text-4xl:  clamp(2.25rem, 1.8rem + 2.25vw, 3.5rem);
  --text-5xl:  clamp(3rem, 2.2rem + 4vw, 5rem);
}
```

### Formula

```
clamp(min, preferred, max)
preferred = min + (max - min) * ((100vw - min_viewport) / (max_viewport - min_viewport))
```

Simplified: `clamp(min_rem, base_rem + Xvw, max_rem)`

## CLS Prevention (font-display + Fallback Metrics)

```css
@font-face {
  font-family: "Inter Fallback";
  src: local("Arial");
  size-adjust: 107%;
  ascent-override: 90%;
  descent-override: 22%;
  line-height-override: 1.2;
}

body {
  font-family: "Inter", "Inter Fallback", system-ui, sans-serif;
}
```

## OpenType Features

```css
.tabular-numbers {
  font-feature-settings: "tnum" 1;  /* fixed-width digits for data */
}
.small-caps {
  font-feature-settings: "smcp" 1;
}
.stylistic-set-1 {
  font-feature-settings: "ss01" 1;  /* alternate glyphs */
}
```

Use `tnum` for: tables, prices, timers, analytics, dashboards.

## Weight Discipline

| Purpose | Weight | Size |
|---------|--------|------|
| Display headlines | 700-800 | text-4xl to text-5xl |
| Section headings | 600-700 | text-2xl to text-3xl |
| Subheadings | 500-600 | text-lg to text-xl |
| Body text | 400 | text-base |
| UI labels | 500 | text-sm |
| Captions/meta | 400 | text-xs |

Rule: Never use more than 3 distinct weights in a single viewport.

## Rules

- All font sizes use clamp() -- no fixed px breakpoints
- Variable fonts preferred for weight flexibility
- Font fallback metrics tuned to prevent CLS
- tnum for any numeric data display
- Maximum 2 font families + 1 mono per project
- font-display: swap for all custom fonts
