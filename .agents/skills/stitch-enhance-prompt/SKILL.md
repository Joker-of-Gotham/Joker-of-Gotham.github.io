---
name: stitch-enhance-prompt
description: 'Transform vague UI requests into professional, detailed UI/UX prompts optimized for Stitch design generation. Use when the user says "make a settings page", "build a dashboard", or other underspecified UI tasks. Source: google-labs-code/stitch-skills.'
---

# Stitch Enhance Prompt

Transform vague UI requests into structured, professional UI/UX prompts ready for Stitch or similar design generation tools.

## When to Use

- User request lacks layout, content, or interaction detail
- Preparing prompts for Stitch screen generation
- Scoping mobile app screens, dashboards, or marketing pages
- User says "make a [page]" without specifications

---

## Workflow

```
Parse vague input → Identify gaps → Apply enhancement framework →
Generate structured prompt → Offer variants → Confirm with user
```

### Step 1: Parse Input

Extract what exists:
- **Page type**: settings, dashboard, onboarding, pricing, etc.
- **Platform**: web, mobile, tablet
- **Hints**: brand, colors, features mentioned
- **Missing**: layout, users, data, states, tone

### Step 2: Gap Analysis

Checklist — fill every item before output:

- [ ] Target user and job-to-be-done
- [ ] Primary action (one CTA per view)
- [ ] Information hierarchy (what's above the fold)
- [ ] Navigation context (where user came from)
- [ ] Content sections with real copy direction
- [ ] Component inventory
- [ ] States: empty, loading, error, success
- [ ] Responsive behavior
- [ ] Visual tone (3 adjectives)
- [ ] Accessibility notes

### Step 3: Enhancement Framework

Expand using the **SCOPE** model:

| Letter | Dimension | Example |
|--------|-----------|---------|
| **S** | Structure | "Left sidebar nav + main content area with sticky header" |
| **C** | Content | "Account email, 2FA toggle, connected apps list" |
| **O** | Outcomes | "User updates password without leaving page" |
| **P** | Patterns | "Progressive disclosure for advanced settings" |
| **E** | Edge cases | "Empty state when no connected apps" |

### Step 4: Generate Prompt

Produce a single, copy-paste-ready prompt block.

### Step 5: Variants (Optional)

Offer 2–3 direction variants when taste is unspecified:
- **Minimal**: clean, whitespace, subtle borders
- **Dense**: data-rich, compact, power-user
- **Expressive**: bold type, accent color, editorial

---

## Enhancement Rules

- Replace "modern" with specific adjectives (refined, utilitarian, warm)
- Replace "user-friendly" with concrete interaction patterns
- Include realistic placeholder copy, not lorem ipsum instructions
- Specify component names (toggle, segmented control, data table)
- One primary action per screen — demote others to secondary
- Always include mobile consideration for app screens

## Constraints

- Do not invent brand assets the user didn't provide — use placeholders
- Keep prompts under 400 words unless complexity demands more
- Ask one clarifying question only if blocking (platform or user type)
- Match product domain language (fintech ≠ gaming ≠ healthcare)

## Output Format

```markdown
## Enhanced UI Prompt

**Original request:** "[user's words]"

**Platform:** Web responsive | iOS mobile | Android mobile

---

### Design Prompt (copy to Stitch)

Design a [platform] [page type] for [product/user].

**Context:** [Who uses this and why now]

**Layout:**
- [Structure description with regions]
- [Navigation placement]
- [Content hierarchy top to bottom]

**Sections:**
1. **[Section name]** — [content, components, behavior]
2. **[Section name]** — ...

**Components:**
- [Component]: [variants, states]
- ...

**States to show:**
- Default: [description]
- Empty: [description]
- Loading: [skeleton pattern]
- Error: [inline alert pattern]

**Visual direction:**
- Tone: [3 adjectives]
- Typography: [display + body direction]
- Color: [palette direction — not hex unless provided]
- Spacing: [airy | compact | balanced]

**Accessibility:**
- [Focus order, contrast, touch targets]

**Do not include:**
- [Anti-patterns for this screen]

---

### Variant Options

**A — Minimal:** [one line]
**B — Dense:** [one line]
**C — Expressive:** [one line]
```

## Examples

**Input:** "make a settings page"

**Enhanced excerpt:**
> Design a web settings page for a B2B project management SaaS used by team leads.
>
> Layout: Left sidebar (240px) with Settings sub-nav; main panel max-width 720px.
>
> Sections: Profile (avatar upload, name, email read-only), Security (password change inline, 2FA toggle with setup modal), Notifications (channel matrix: email/push per event type), Connected Apps (list with revoke action).
>
> Primary action: Save changes (sticky footer bar, only enabled when dirty).
>
> States: 2FA disabled shows benefits callout; connected apps empty shows OAuth CTA.

**Input:** "pricing page"

**Enhanced excerpt:**
> Design a marketing pricing page for a developer API product.
>
> Layout: Centered hero with annual/monthly toggle; 3-tier comparison table; FAQ accordion; enterprise CTA band.
>
> Tiers: Free (10k requests), Pro ($49, 100k), Enterprise (custom).
>
> Highlight Pro as recommended with subtle border accent.
>
> Include feature comparison checkmarks, rate-limit callouts, and trust badges row.
