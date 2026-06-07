---
name: visual-direction-picker
description: 'Use when the user has not specified a clear visual direction. Proposes 3 differentiated aesthetic directions with color, typography, layout, and motion strategies. Does not implement -- only proposes and waits for user selection. Works downstream of design-brief-gate.'
---

# Visual Direction Picker

When the user's aesthetic direction is missing or vague ("make it look good", "modern design", "professional"), propose 3 distinct visual directions instead of guessing.

## Trigger

- `design-brief-gate` identified "aesthetic direction" as missing or vague
- User said "you decide" or "your best judgment"
- User gave contradictory style signals

## Process

### Step 1: Analyze Context

From the design brief (or available context), identify:
- Product type and industry
- Target user sophistication level
- Emotional tone (trustworthy, playful, powerful, calm, bold)
- Technical constraints (framework, existing components)

### Step 2: Generate 3 Directions

Each direction must be **genuinely different** -- not three variations of the same safe choice.

#### Direction A: Production Safe

- Proven aesthetic that works for this product category
- Lower risk, higher immediate usability
- References: established products in the same space

#### Direction B: Expressive High-Design

- Pushes visual quality and craft significantly
- Distinctive typography and color choices
- References: design-award-winning products

#### Direction C: Experimental Memorable

- Unusual, boundary-pushing approach
- Strong personality that users will remember
- References: products known for distinctive identity

### Step 3: Present Each Direction

For each direction, provide:

```
### Direction [A/B/C]: [Name]

**Mood**: [one sentence]
**Reference**: [1-2 real products]

| Aspect | Choice |
|--------|--------|
| Colors | [palette description + 2-3 hex values] |
| Typography | [font pairing + personality] |
| Layout | [grid/composition approach] |
| Motion | [intensity + type] |
| Surface | [light/dark/mixed, texture] |

**Feels like**: [one-line emotional descriptor]
**Risk**: [what could go wrong]
```

### Step 4: Wait for Selection

Do not proceed until the user:
- Chooses a direction (A, B, or C)
- Asks for a mix ("A's colors with B's typography")
- Provides their own direction (supersedes all proposals)
- Explicitly authorizes autonomous choice ("pick your favorite")

## Direction Generation Guidelines

### By Product Type

| Product | Lean Toward |
|---------|-------------|
| Developer tool | Swiss/Industrial/Minimal |
| Consumer app | Organic/Playful/Warm |
| Enterprise SaaS | Professional/Structured/Trustworthy |
| Creative tool | Editorial/Expressive/Bold |
| Data platform | Dense/Functional/Industrial |
| Personal site | Distinctive/Memorable/Personality |
| E-commerce | Clean/Trustworthy with accent energy |

### Anchor Compatibility

Directions may reference anchors from `ilm-alan-frontend-design`:
- Swiss, Industrial, Brutalist, Aurora Maximalism, Retro-Futuristic, Organic, Lo-Fi

Or style recipes from `web-design-engineer`:
- Linear-like, Stripe-like, Apple-like, Bloomberg-like, etc.

## Constraints

- Never propose 3 directions that are all "safe neutral"
- Never propose without at least one bold/experimental option
- Never implement before user selects
- If user provides clear direction upfront, skip this skill entirely
- Keep presentations concise -- not essays, just enough to differentiate
