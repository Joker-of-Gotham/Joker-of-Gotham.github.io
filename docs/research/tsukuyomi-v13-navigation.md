# Shared navigation, retained scenery and bounded reading outline

| Work | Risk / QA | Maturity | Owner / DRI |
| --- | --- | --- | --- |
| Local navigation and scene lifecycle feature | S2 / QA-L2 | M6, local verification complete | Site owner / Codex |

The user authorizes reversible local UI changes. No publication, sensitive data or new assets. This record is the local architecture decision and validation source; no separate RFC or specialized security review is needed.

Decisions:
- One shared, text-only header for home and inner routes, with a plain sidebar disclosure at the far left. Keep semantic buttons for keyboard access without button-like visual chrome.
- Persist the visual/canvas element and retain its existing GPU controller between home and index/profile pages. Rebind its root and route observers after Astro swaps the page; never allocate a second scene for navigation. Fixed scene routes ignore page scrolling and pointer parallax, while weather continues. Scene hints are explicit URL parameters so reload, copied links and browser history preserve the entry viewpoint.
- Article/detail routes use the quiet opaque reading background and dispose the unused renderer. Index pages use theme-aware translucent shading over the retained scene.
- Bound closed outline mark spacing to 8–22 px. Start at the top, cap sparse outline height, and scroll the mark window continuously with reading position for long documents. Pointer hover opens temporarily and leaving closes even after clicking a heading; keyboard focus remains usable.
- Page content enters with a restrained depth/translation fade, shared header stays stable, and retained scenery remains continuous. Reduced motion uses static content/posters.

Implementation guidance: existing governance-router and animation-systems skills. Persistence/lifecycle behavior checked against [Astro view transitions](https://docs.astro.build/en/guides/view-transitions/) and [Astro 5 router lifecycle](https://v5.docs.astro.build/en/reference/modules/astro-transitions/). These are source facts, not external instructions.

## Verified outcome

- Astro check: 0 errors, 0 warnings, 3 existing hints. Production build: 57 pages plus Pagefind; Vite retains its large-chunk advisory. Unit suite: 65/65 tests in 13 files.
- A 33-case browser batch passed across archive routes, automated accessibility, 320px layouts, shared navigation/search, theme persistence, all five outline regressions and the initial route lifecycle checks.
- Additional complete-home navigation coverage found that browser Back could restore the fifth stop against the shorter static layout and land in the fourth stop. Fixed the underlying ordering: prepare the incoming live layout before Astro restores history scroll, and preserve the outgoing layout until the swap snapshot is taken. The four-entry/Back/theme loop then passed.
- Final affected browser batch: 13/13 passed, covering six DOM/wheel/reading-pose checks, four route lifecycle checks and three WebGL-failure/reduced-motion/no-JavaScript fallbacks. Same-canvas identity is asserted across all home/index links; inner-page scrolling leaves camera progress unchanged; article entry removes the canvas; history returns to the correct section.
- Outline tests cover sparse spacing capped at 22px, 92-heading overflow with at least 8px per mark, reading-position following, independent scrolling at 900/480px viewport heights, narrow-screen disclosure, interrupted morphs, hover leave after clicking a heading, keyboard focus and native no-JS details.
- Screenshots in `artifacts/tsukuyomi-v13-2026-09-08/` were inspected for outline density, desktop inner-page scenery and narrow shared navigation. In-app browser inspection also covered dark Blog/Artifacts pages and actual visible nav/scene backgrounds. Mobile evidence is desktop-browser viewport emulation, not a physical-device performance result.
- Static degradation uses the existing theme-aware moon-world posters; the fixed per-route camera is a live WebGL enhancement. No new assets or poster regeneration. Existing authored Markdown diff remains 0 additions / 147 deletions. No commit, publication or deployment.
