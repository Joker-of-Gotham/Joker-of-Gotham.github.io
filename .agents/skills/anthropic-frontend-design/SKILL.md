---
name: anthropic-frontend-design
description: 'Create distinctive, production-grade frontend interfaces that avoid generic AI aesthetics. Use for any frontend work: landing pages, web apps, dashboards, admin panels, components, interactive experiences. Covers composition, typography, color, motion, and copy. Source: anthropics/claude-code.'
---

# Frontend Design

Guide creation of distinctive, production-grade frontend interfaces that avoid generic AI aesthetics. This skill covers the full lifecycle: detect what exists, plan the design, build with intention, and verify visually.

## Authority Hierarchy

Every rule in this skill is a default, not a mandate.

1. **Existing design system / codebase patterns** -- highest priority, always respected
2. **User's explicit instructions** -- override skill defaults
3. **Skill defaults** -- apply in greenfield work or when the user asks for design guidance

## Workflow

```
Detect context -> Plan the design -> Build -> Verify visually
```

---

## Layer 0: Context Detection

Before any design work, examine the codebase for existing design signals.

### What to Look For

- **Design tokens / CSS variables**: `--color-*`, `--spacing-*`, `--font-*` custom properties, theme files
- **Component libraries**: shadcn/ui, Material UI, Chakra, Ant Design, Radix, or project-specific component directories
- **CSS frameworks**: `tailwind.config.*`, `styled-components` theme, Bootstrap imports
- **Typography**: Font imports, `@font-face` declarations, Google Fonts links
- **Color palette**: Defined color scales, brand color files, design token exports
- **Animation libraries**: Framer Motion, GSAP, anime.js, Motion One
- **Spacing / layout patterns**: Consistent spacing scale, grid systems, layout components

### Mode Classification

- **Existing system** (4+ signals): Defer to it. Structural guidance still applies.
- **Partial system** (1-3 signals): Follow what exists; apply skill defaults for gaps.
- **Greenfield** (no signals): Full skill guidance applies.
- **Ambiguous**: Ask the user before proceeding.

---

## Layer 1: Pre-Build Planning

Before writing code, write three short statements:

1. **Visual thesis** -- one sentence describing the mood, material, and energy
2. **Content plan** -- what goes on the page and in what order
3. **Interaction plan** -- 2-3 specific motion ideas that change the feel

---

## Layer 2: Design Guidance Core

### Typography

- Choose distinctive, characterful fonts. Avoid Inter, Roboto, Arial, system defaults in greenfield work.
- Two typefaces maximum without clear reason for more.
- Yields to existing font choices when detected.

### Color & Theme

- Commit to a cohesive palette using CSS variables. A dominant color with sharp accents outperforms timid, evenly-distributed palettes.
- No purple-on-white bias, no dark-mode bias.
- One accent color by default unless the product already has a multi-color system.

### Composition

- Start with composition, not components. Treat the first viewport as a poster.
- Use whitespace, alignment, scale, cropping, and contrast before adding chrome.
- Default to cardless layouts. Cards only when they serve as interaction containers.

### Motion

- Ship 2-3 intentional motions: one entrance, one scroll-linked or depth effect, one hover/reveal.
- Use the project's existing animation library if present.
- Framework defaults: CSS animations baseline, Framer Motion for React, Vue Transition for Vue, Svelte transitions for Svelte.

### Accessibility

- Semantic HTML by default: `nav`, `main`, `section`, `article`, `button`.
- Color contrast meeting WCAG AA minimum.
- Focus states on all interactive elements.

---

## Context Modules

### Module A: Landing Pages & Marketing (Greenfield)

1. Hero -- brand/product, promise, CTA, one dominant visual
2. Support -- one concrete feature, offer, or proof point
3. Detail -- atmosphere, workflow, product depth
4. Final CTA -- convert, start, visit, or contact

Hero rules: One composition, full-bleed. Brand first, headline second, body third, CTA fourth. No more than 6 sections total. One H1, one primary CTA above fold.

### Module B: Apps & Dashboards (Greenfield)

- Calm surface hierarchy, strong typography, few colors, dense but readable.
- Organize: primary workspace, navigation, secondary context, one accent for action/state.
- Cards only when the card is the interaction.

### Module C: Components & Features (Existing Apps)

- Match the existing visual language.
- Inherit spacing, border radius, color tokens, typography.
- Focus on interaction quality: clear states, smooth transitions, obvious affordances.

---

## Hard Rules & Anti-Patterns

### Default Against (Overridable)

- Generic SaaS card grid as first impression
- Purple-on-white color schemes, dark-mode bias
- Overused fonts (Inter, Roboto, Arial, Space Grotesk) in greenfield
- Hero sections cluttered with stats, pill clusters, logo clouds
- Decorative gradients standing in for real visual content
- Copy that sounds like design commentary

### Always Avoid (Quality Floor)

- Prompt language or AI commentary leaking into UI
- Broken contrast -- text unreadable over backgrounds
- Interactive elements without visible focus states
- Semantic div soup when proper HTML elements exist

---

## Litmus Checks

- Is the brand unmistakable in the first screen?
- Is there one strong visual anchor?
- Can the page be understood by scanning headlines only?
- Does each section have one job?
- Are cards actually necessary where used?
- Does motion improve hierarchy, or is it just there?
- Does the copy sound like the product, not a prompt?

---

## Visual Verification

After implementing, verify visually using available tools:

1. Existing project browser tooling (Playwright, Puppeteer, Cypress)
2. Browser MCP tools if available
3. Mental review with litmus checks if no browser access

Assess: Does it match the visual thesis? Any obvious visual problems? Does it look like the intended module?

---

## Creative Energy

For greenfield work, commit to a bold aesthetic direction. Consider: brutally minimal, maximalist, retro-futuristic, organic/natural, luxury/refined, playful, editorial, brutalist, art deco, soft/pastel, industrial.

Ask: what makes this unforgettable? What is the one thing someone will remember?

Match implementation complexity to aesthetic vision.
