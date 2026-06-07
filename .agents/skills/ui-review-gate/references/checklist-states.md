# Interaction States Matrix

Every interactive component must implement applicable states. Mark ✅ Present / ❌ Missing / — N/A.

**Global rules:**
- Use `:focus-visible`, not `:focus` alone (avoid focus ring on mouse click)
- Disabled elements: `disabled` attribute + `aria-disabled="true"` + no pointer events
- Loading: `aria-busy="true"` on container; preserve layout (no shift)
- Error: `aria-invalid="true"` + `aria-describedby` → error message id
- Reduced motion: replace transitions with instant state change

---

## Button

| State | Required | Visual Indicator |
|-------|----------|------------------|
| Default | ✅ | Token bg/border/text; clear affordance |
| Hover | ✅ desktop | Slightly darker/lighter bg or border emphasis |
| Active/Pressed | ✅ | Scale 0.98 or darker bg; `transform` subtle |
| Focus-visible | ✅ | 2px ring, `outline-offset: 2px`, `--ring` token |
| Disabled | ✅ | 50% opacity or muted tokens; `cursor: not-allowed` |
| Loading | ✅ if async | Spinner inline; text "Loading…" or `aria-label`; width locked |
| Error | — | N/A (button triggers action; error shown elsewhere) |
| Success | contextual | Brief checkmark/color flash after submit |
| Selected | ✅ toggle buttons | `aria-pressed="true"`; filled vs outline variant |
| Empty | — | N/A |

**Variants:** primary, secondary, ghost, destructive — each needs full state set.

---

## Input (text, email, password, search, textarea)

| State | Required | Visual Indicator |
|-------|----------|------------------|
| Default | ✅ | Border `--input`; bg `--background` |
| Hover | optional | Border darkens slightly |
| Active/Focus | ✅ | Border `--ring`; ring glow |
| Focus-visible | ✅ | Same as focus; never `outline: none` |
| Disabled | ✅ | Muted bg; `cursor: not-allowed`; label also muted |
| Loading | ✅ if async validate | Inline spinner trailing; field remains editable or locked per UX |
| Error | ✅ | Border `--destructive`; error text below; `aria-invalid` |
| Success | contextual | Green border/check icon + `aria-describedby` success msg |
| Selected | — | N/A (cursor/caret = active) |
| Empty | ✅ | Placeholder muted; label always visible (not placeholder-only) |

---

## Link

| State | Required | Visual Indicator |
|-------|----------|------------------|
| Default | ✅ | Underline or distinct color `--primary` |
| Hover | ✅ | Underline thickens or color shift |
| Active | ✅ | Darker color momentarily |
| Focus-visible | ✅ | Ring or outline; underline remains |
| Disabled | ✅ if applicable | `aria-disabled`; no `href`; muted; no pointer |
| Loading | contextual | `aria-busy`; text "Loading…" |
| Error | — | N/A |
| Success | — | N/A |
| Selected | ✅ nav links | `aria-current="page"`; bold/indicator bar |
| Empty | — | N/A |

---

## Card (clickable / selectable)

| State | Required | Visual Indicator |
|-------|----------|------------------|
| Default | ✅ | Border `--border`; bg `--card` |
| Hover | ✅ if clickable | Border emphasis or subtle shadow lift |
| Active | ✅ if clickable | Pressed shadow reduction |
| Focus-visible | ✅ if clickable | Ring around entire card |
| Disabled | ✅ | Reduced opacity; `pointer-events: none` |
| Loading | ✅ if async | Skeleton inside card; `aria-busy` |
| Error | contextual | Border destructive; inline error message |
| Success | contextual | Border success; check badge |
| Selected | ✅ if selectable | Border `--primary` 2px; check icon corner; `aria-selected` |
| Empty | ✅ | Empty state illustration + CTA inside card frame |

---

## Toggle (switch)

| State | Required | Visual Indicator |
|-------|----------|------------------|
| Default (off) | ✅ | Track muted; thumb left |
| Default (on) | ✅ | Track `--primary`; thumb right |
| Hover | ✅ | Track lightens |
| Active | ✅ | Thumb scales slightly |
| Focus-visible | ✅ | Ring on switch container |
| Disabled | ✅ | Opacity 50%; `aria-disabled` |
| Loading | contextual | Thumb replaced by micro-spinner |
| Error | contextual | Red track border + message |
| Success | — | N/A |
| Selected | ✅ | Maps to on-state; `aria-checked="true"` |
| Empty | — | N/A |

---

## Select (native or custom combobox)

| State | Required | Visual Indicator |
|-------|----------|------------------|
| Default | ✅ | Chevron; border `--input` |
| Hover | ✅ | Border emphasis |
| Active/Open | ✅ | `aria-expanded="true"`; dropdown visible; chevron rotated |
| Focus-visible | ✅ | Ring on trigger |
| Disabled | ✅ | Muted; no open |
| Loading | ✅ if async options | Skeleton or spinner in list |
| Error | ✅ | Destructive border + message |
| Success | contextual | Check after valid selection |
| Selected | ✅ | Selected option label in trigger; check in list |
| Empty | ✅ | "No options" row in dropdown |

---

## Dialog (modal)

| State | Required | Visual Indicator |
|-------|----------|------------------|
| Default (open) | ✅ | Overlay `--background/80`; panel elevated |
| Hover | — | N/A on overlay |
| Active | — | N/A |
| Focus-visible | ✅ | Focus trapped inside; initial focus on primary action or title |
| Disabled | contextual | Primary action disabled until form valid |
| Loading | ✅ if async confirm | Primary button loading; overlay blocks close |
| Error | ✅ | Inline form errors; dialog stays open |
| Success | contextual | Success message then auto-close or confirm |
| Selected | — | N/A |
| Empty | contextual | "No items" state inside dialog body |

**Close:** Escape, overlay click (if allowed), visible close button with `aria-label="Close"`.

---

## Toast

| State | Required | Visual Indicator |
|-------|----------|------------------|
| Default | ✅ | Surface + icon by variant (info/success/warning/error) |
| Hover | optional | Pause auto-dismiss timer |
| Active | — | N/A |
| Focus-visible | ✅ | Focus on toast or action buttons inside |
| Disabled | — | N/A |
| Loading | contextual | Spinner + "Saving…" |
| Error | ✅ variant | Red/destructive styling + `role="alert"` |
| Success | ✅ variant | Green/success styling + `role="status"` |
| Selected | — | N/A |
| Empty | — | N/A |

**Dismiss:** Auto 5–8s + manual close button; `aria-live="polite"` (assertive for errors).

---

## Table Row

| State | Required | Visual Indicator |
|-------|----------|------------------|
| Default | ✅ | Zebra or border-bottom; readable row height |
| Hover | ✅ | Row bg `--muted/50` |
| Active | ✅ if clickable | Pressed bg |
| Focus-visible | ✅ if clickable | Row outline or left accent bar |
| Disabled | ✅ | Muted text; no row click |
| Loading | ✅ | Skeleton rows or row-level spinner |
| Error | contextual | Row border destructive; inline error cell |
| Success | contextual | Brief highlight flash on updated row |
| Selected | ✅ | `aria-selected`; bg `--accent`; checkbox checked |
| Empty | ✅ | Full-width empty row: "No results" + action |

---

## Nav Item

| State | Required | Visual Indicator |
|-------|----------|------------------|
| Default | ✅ | Muted text; icon + label |
| Hover | ✅ | Bg pill or text brighten |
| Active | ✅ | Pressed state on click |
| Focus-visible | ✅ | Ring on nav link |
| Disabled | ✅ | Muted; `aria-disabled` |
| Loading | contextual | Skeleton or spinner on badge |
| Error | contextual | Badge dot destructive (notification fail) |
| Success | — | N/A |
| Selected / Current | ✅ | `aria-current="page"`; bold; indicator bar; `--primary` |
| Empty | contextual | "No items" in nav section |

---

## State Coverage Audit Template

```
Component: [name]
File: [path]

| State          | Status | Notes |
|----------------|--------|-------|
| Default        |        |       |
| Hover          |        |       |
| Active         |        |       |
| Focus-visible  |        |       |
| Disabled       |        |       |
| Loading        |        |       |
| Error          |        |       |
| Success        |        |       |
| Selected       |        |       |
| Empty          |        |       |
```

## Severity

| Gap | Severity |
|-----|----------|
| Missing focus-visible | CRITICAL |
| Missing disabled on form controls | HIGH |
| Missing loading on async submit | HIGH |
| Missing error state on inputs | HIGH |
| Missing empty on data-driven lists | HIGH |
| Missing hover only | LOW (touch-first) |
