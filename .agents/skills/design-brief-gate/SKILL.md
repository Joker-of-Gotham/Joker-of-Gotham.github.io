---
name: design-brief-gate
description: 'Use before any major frontend, webpage, product UI, app UI, homepage, dashboard, landing page, visual redesign, typography, layout, color, or design-system task. Prevents unapproved aesthetic decisions by requiring a design brief before implementation. Forces clarification questions when information is insufficient.'
---

# Design Brief Gate

Before creating or rewriting any visual interface, do not immediately implement. Confirm the design brief is sufficient first.

## Trigger

Activate before any task involving:

- Frontend design or redesign
- Webpage or landing page creation
- Product UI or app UI design
- Homepage or dashboard design
- Layout, typography, or color redesign
- Component visual overhaul
- Design system creation or modification
- Visual polish or aesthetic improvement

## Required Information (8 Items)

Check whether the user has provided:

### 1. Product Type

Homepage, landing page, SaaS app, dashboard, admin panel, portfolio, e-commerce, blog, docs site, mobile app, desktop app, AI product interface, research platform, data platform, game UI.

### 2. Target Users

Developers, researchers, enterprise users, consumers, designers, investors, students, operators, data analysts, content creators, or specific industry users.

### 3. Usage Context

Marketing/conversion, reading/consumption, monitoring/analytics, control/operations, onboarding, checkout/purchase, creation/editing, collaboration, data exploration.

### 4. Aesthetic Direction

Minimal, editorial, luxury, cyberpunk, futuristic, Swiss grid, brutalist, soft pastel, industrial, Apple-like, Linear-like, Vercel-like, Raycast-like, Notion-like, game UI, anime-tech, retro-futuristic, organic, lo-fi, aurora maximalist.

### 5. Brand Constraints

Existing logo, colors, fonts, tone of voice, imagery style, existing design system, forbidden styles or colors.

### 6. Reference Products

What to learn from (and what not to copy). Specific URLs or product names.

### 7. Technical Stack

React, Next.js, Vue, Svelte, Astro, HTML/CSS, Tailwind, shadcn/ui, React Native, Flutter, SwiftUI, or other.

### 8. Design Freedom

- Conservative polish (minimal changes, keep existing direction)
- Moderate redesign (refresh within brand)
- Bold redesign (new direction, new personality)
- Experimental art direction (push boundaries)

## Decision Logic

### If 3+ items are missing:

Ask concise, conversational clarification questions. Not a full checklist dump -- ask the 2-3 most important missing items based on context.

Example: "What kind of product is this for, and who are the primary users? Do you have a visual direction in mind, or should I propose options?"

### If user says "just do it" / "you decide" / "your judgment":

Do NOT immediately implement. Instead:

1. Propose 3 visual directions:
   - **Direction A**: Safe, production-grade, professional
   - **Direction B**: Expressive, high-design, memorable
   - **Direction C**: Experimental, boundary-pushing, distinctive

2. Each direction includes: color strategy, typography personality, layout approach, motion level, one reference product.

3. Ask the user to choose (or authorize autonomous selection explicitly).

### If brief is complete:

Output a structured Design Brief summary, then hand off to implementation skills.

## Never Self-Decide Without Approval

These decisions require explicit user confirmation:

- Final brand color system
- Typography personality (font choices)
- Overall visual style direction
- Decorative/illustration style
- Animation intensity level
- Information architecture changes
- Major component structure decisions
- Replacing or creating a design system

## Output Format

Before any implementation skill runs, produce:

```
## Design Brief

1. Product: [type + name]
2. Users: [target audience]
3. Context: [primary use case]
4. Direction: [chosen aesthetic]
5. Colors: [strategy summary]
6. Typography: [font strategy]
7. Layout: [approach]
8. Components: [system to use]
9. Motion: [intensity + approach]
10. Constraints: [what will NOT change]
11. Freedom level: [conservative/moderate/bold/experimental]
```

Only after user confirms this brief may implementation skills proceed.

## Constraints

- This skill is always-on (implicit invocation allowed)
- It does not generate any UI code itself
- It only gates, questions, and documents
- If the user provides a complete, specific brief upfront, acknowledge it and proceed immediately without re-asking
- Never turn a simple "change the button color" request into a full design brief interrogation -- use judgment about scope
