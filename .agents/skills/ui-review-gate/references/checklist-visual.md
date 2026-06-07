# Visual Hierarchy Audit Checklist

Use during `ui-review-gate` Dimension 1 (Layout & Composition) and Dimension 4 (Hierarchy & Focus). Mark each item Pass / Fail / N/A. Failures need file:line citations.

---

## 1. Alignment Grid

| Check | Pass Criteria | Fail Signals |
|-------|---------------|--------------|
| Column grid defined | Layout uses consistent column count per breakpoint | Arbitrary widths, misaligned columns |
| Edge alignment | Text, icons, and controls align to shared left/right edges | Elements float off-grid |
| Baseline rhythm | Multi-line blocks share consistent vertical rhythm | Uneven line starts across columns |
| Optical alignment | Icons/chevrons optically centered with adjacent text | Mathematically centered but visually off |
| Nested alignment | Cards, forms, and tables inherit parent grid | Inner content breaks outer alignment |
| Full-bleed vs inset | Hero/media full-bleed; content inset consistently | Mixed bleed without intent |

**Action:** Snap misaligned elements to grid. Document intentional breaks in DESIGN.md.

---

## 2. Spacing Consistency

| Check | Pass Criteria | Fail Signals |
|-------|---------------|--------------|
| Token-only spacing | All margin/padding/gap use spacing scale tokens | Magic numbers (13px, 17px) |
| Section rhythm | Vertical section gaps follow 1–2 scale steps | Random large gaps between sections |
| Component internal padding | Same component type uses same padding | Button/card padding varies per instance |
| Stack vs cluster | Related items tight; unrelated groups separated | Everything same distance apart |
| Inline spacing | Icon–label, label–input gaps consistent | Ad-hoc gaps in repeated patterns |

**Action:** Replace raw values with nearest token. Group related content before adding outer gap.

---

## 3. Visual Weight

| Check | Pass Criteria | Fail Signals |
|-------|---------------|--------------|
| Primary emphasis | One dominant element per viewport section | Multiple competing bold elements |
| Type weight hierarchy | Headings > labels > body > captions by weight/size | Body text heavier than headings |
| Color weight | Primary actions use strongest chroma | Secondary actions equally saturated |
| Surface weight | Elevated surfaces draw attention intentionally | Every card has heavy shadow |
| Density weight | Data-heavy zones denser; marketing zones airier | Uniform density everywhere |

**Action:** Demote secondary elements (lighter weight, muted color, smaller size).

---

## 4. Focal Points

| Check | Pass Criteria | Fail Signals |
|-------|---------------|--------------|
| One focal point per section | Eye lands on headline + CTA or key metric first | No clear entry point |
| CTA visibility | Primary CTA visible without scroll on key screens | CTA buried below fold |
| Contrast focal | Focal element has highest contrast in its zone | Background competes with content |
| Motion focal | Animation draws eye once, not continuously | Looping distraction on non-critical UI |
| Empty space directs | Whitespace frames focal content | Dead zones with no purpose |

**Action:** Increase contrast/size/spacing around intended focal; reduce competing elements.

---

## 5. Squint Test

Blur eyes or apply 4px Gaussian blur screenshot. Hierarchy must remain readable.

| Check | Pass Criteria | Fail Signals |
|-------|---------------|--------------|
| Section boundaries visible | Major blocks still distinguishable | Everything merges into gray blob |
| Heading levels readable | H1/H2/H3 still separable by size/weight | Headings disappear into body |
| CTA still findable | Primary button shape/color survives blur | CTA indistinguishable from cards |
| Navigation scannable | Nav items form clear band | Nav blends into hero |
| Data tables legible | Row bands or zebra still visible | Table becomes uniform field |

**Action:** Increase size/weight/contrast delta between hierarchy levels until squint test passes.

---

## 6. Color Harmony

| Check | Pass Criteria | Fail Signals |
|-------|---------------|--------------|
| Palette discipline | ≤1 primary, 1 accent, neutrals from tokens | Random hex per component |
| Semantic mapping | Success/warning/error use semantic tokens | Red/green invented per file |
| Temperature consistency | Warm OR cool bias; neutrals match | Clashing warm/cool grays |
| Accent restraint | Accent on CTAs, badges, key metrics only | Accent on every icon |
| Background layering | 2–3 surface levels (base, raised, overlay) | Flat single background |
| Dark mode parity | Semantic roles preserved, not re-invented | Dark mode = inverted chaos |

**Action:** Map all colors to DESIGN.md tokens. Remove one-off hues.

---

## 7. Shadow & Elevation Consistency

| Check | Pass Criteria | Fail Signals |
|-------|---------------|--------------|
| Elevation scale | Shadows use defined levels (sm/md/lg) | Custom box-shadow per card |
| Purpose-matched elevation | Dropdowns > cards > base surface | Cards shadow heavier than modals |
| Border + shadow pairing | Same elevation = same border treatment | Mixed border-only and shadow-only |
| Dark mode shadows | Reduced opacity or border substitute | Same shadow values as light |
| No shadow on flat inputs | Inputs use border, not drop shadow | Text fields with heavy shadow |
| Sticky/fixed elevation | Sticky headers use designated level | Ad-hoc sticky shadow |

**Action:** Assign each surface to an elevation token. Never invent new shadow strings.

---

## 8. Whitespace Utilization

| Check | Pass Criteria | Fail Signals |
|-------|---------------|--------------|
| Intentional breathing room | Hero and key sections have generous padding | Cramped edge-to-edge content |
| No orphaned whitespace | Gaps group related content | Large gaps between related items |
| Max-width respected | Prose and dashboards cap readable width | 100% width paragraphs on desktop |
| Micro whitespace | List items, form fields have consistent internal gap | Text touching borders |
| Negative space as structure | Gutters and margins define layout | Whitespace feels accidental |

**Action:** Apply max-width + horizontal padding tokens. Tighten related groups; widen between sections.

---

## 9. Content Density Balance

| Check | Pass Criteria | Fail Signals |
|-------|---------------|--------------|
| Density matches context | Dashboards dense; marketing sparse | Dashboard with landing-page spacing |
| Scannable chunks | Lists/tables use grouping, dividers, headings | Wall of equal-weight rows |
| Progressive disclosure | Advanced detail behind expand/tabs/drawer | Everything visible at once |
| Empty vs full states | Empty states use space intentionally | Broken layout when no data |
| Mobile density shift | Mobile reduces columns, increases touch padding | Desktop density squeezed to 320px |
| Information priority | Primary metrics larger; metadata smaller/muted | All numbers same size |

**Action:** Match density to user task (monitoring = dense, onboarding = sparse). Use typography scale to tier information.

---

## Severity Guide

| Issue Type | Typical Severity |
|------------|------------------|
| No focal point / unreadable hierarchy | HIGH |
| Off-token spacing/colors breaking system | MEDIUM |
| Squint test failure on primary screen | HIGH |
| Inconsistent shadow/elevation | MEDIUM |
| Orphaned whitespace / cramped mobile | MEDIUM |
| Minor optical alignment (1–2px) | LOW |
