# Tsukuyomi v12 — settled compositions and an adaptive outline

| Work | Risk / QA | Maturity | Owner / DRI |
| --- | --- | --- | --- |
| Local scene and interaction revision | S2 / QA-L2, reversible UI changes | M6 local verification complete | Site owner / Codex |

User authorizes removing all pedestrians and carts, retaining and detailing market stalls, readable front-facing home stops, and fluid adaptive outline disclosure. No publication, new permissions, sensitive data or architectural migration. No additional RFC/ADR or specialized review is required. This document is the local decision and verification record. Existing authored Markdown changes are preserved.

- Remove street-person/cart geometry, animation loops and obsolete tests. Detail stalls using bowed fabric, valances, joined timber, trays, ceramics and warm lanterns; keep shared geometry/material batching.
- Use continuous wheel-to-route progress with one damped director shared by camera and DOM. No chapter thresholds, held camera intervals or per-chapter acceleration ramps. Reading poses stay exactly front-facing across an interval while the background continues moving. Align vertical cards and unify reading heights while retaining left/right compositions.
- Retain native details fallback, add interruptible disclosure animation, a borderless closed rail, adaptive heading spacing near the active section and viewport-aware expanded height. Long outlines keep wheel/keyboard scrolling. Resize and reduced-motion changes settle cleanly.

QA: unit/lifecycle/camera checks, continuous-wheel/neutral-pose assertions, rapid reverse transitions, long-outline morph/collapse/resize/last-link tests, reduced-motion/no-JS checks, both-theme scene screenshots and performance budgets.

User follow-up: both gates must be centered over the canal with symmetric foundations, and all six stops must have content: entry, right street, first bridge, left street, second bridge, exit. Move gate origins to x=0 and frame the two gate views on the same axis. Bridge stops gain concise research/about navigation. Remove the previous landscape-only pauses and validate six readable states in live/static modes. Bridge two camera moves forward to show its bridge at a useful distance; horizon roll is removed.

Latest interaction correction: the user rejected threshold-based camera holds. Camera progress now advances on every scroll increment, route interpolation is linear in chapter progress, and the first route anchor is the top of the first section so the opening has no dead scroll distance. Only the DOM reading plane has a neutral pose interval. Chapters use 130svh travel space. Real mouse-wheel regression checks every 100-pixel tick at five stops for immediate bounded progress.

Final layout steering: entry text centered at 58vh (54vh on narrow screens), first bridge at 43vh/42vh, second bridge at 57vh/56vh, exit at 71vh/70vh; street compositions retain their previous side/height. Closed desktop outline occupies the viewport from 6rem below its top to 3rem above its bottom regardless of heading count. Marks spread through that full rail with only a mild active-neighborhood weighting; short outlines no longer collapse into a dense central cluster.


## Verified outcome

- Final TypeScript/Astro check: zero errors and warnings, three existing unused-variable hints. Production build: 57 pages plus Pagefind. Unit suite: 64/64 passed, including continuous camera increments, mutually exclusive readable compositions, symmetric water-clear gate foundations and GPU disposal.
- A complete 46-case browser regression passed before the final scroll/layout steering. Current affected coverage was then rerun: six DOM/motion tests, eight scene/fallback tests and four outline tests. One final long-outline run detected a 3-pixel End-key offset while its height animation settled; that was fixed, and all four outline tests plus three regenerated-poster fallback tests passed in the subsequent run. Do not interpret the earlier failed attempt as a pass.
- Real 100-pixel wheel increments at each of the first five stops advance progress immediately without a threshold. At each reading stop, the DOM plane stays front-facing while the camera continues. Short and 92-item outlines were checked across 900/480-pixel heights and 390-pixel width, with End/Escape, wheel, interrupted morphs and no-JavaScript disclosure.
- Final screenshots for six stops in five viewport/theme profiles, three outline captures and fallback source captures are in `artifacts/tsukuyomi-v12-2026-09-08/`. The four centered text positions, gate symmetry, stalls and bridge compositions were visually inspected. Closed short-outline marks now span more than 600 pixels of a 900-pixel viewport.
- Maximum sampled draw calls: 135. Worst sampled median frame times: 16.7 ms for desktop/day/tablet, 33.3 ms for phone-width profiles on this desktop browser. No scene runtime errors. Physical-phone performance and native browser zoom are not claimed.
- Six fallback WebPs regenerated from final scene captures; manifest hashes updated. Existing authored Markdown diff retained at 0 additions / 147 deletions. No publication or deployment performed.

## Navigation and composition refinement — 2026-09-08

User-authorized local presentation update: S1 / QA-L1; site owner is Owner and Codex is implementation DRI. No architecture decision, additional RFC/ADR or specialized review is required. This supersedes the earlier four centered text heights above, while preserving the continuous camera/DOM progress and six reading stops.

- Entry moves to 68vh on desktop and 63vh on narrow screens, below the physical gate foundations. Short viewports use a bottom anchor and a smaller heading to keep the complete introduction visible. Its sole action is the centered `阅读文章` link. Centered frames override the inherited narrow-screen maximum width so intermediate widths retain symmetric left/right space.
- Research moves upward to 36vh / 35vh. About moves downward to 61vh on desktop and 73vh on narrow screens, where it also clears the bridge reflection. Street compositions are unchanged.
- Exit is anchored 4vh above the bottom with safe-area support. A centered GitHub profile link precedes four concise project links; narrow screens arrange the projects in two text columns. No cards or extra prose are introduced.
- Link labels were checked against the repositories on 2026-09-08: [VIREA](https://github.com/Moonweave-AI/virea) motion generation, [Zanao](https://github.com/Joker-of-Gotham/Zanao-LLM-Analyzer) campus marketplace analysis, [Governance](https://github.com/Moonweave-AI/governance) engineering governance, [Ontotect](https://github.com/Moonweave-AI/Ontotect) ontology engineering; [profile](https://github.com/Joker-of-Gotham). Repository contents were used only as source facts.

Verification: Astro check reports 0 errors, 0 warnings and 3 existing hints; production build emits 57 pages plus Pagefind. Three live six-scene browser profiles passed (1440×900 dark/light and 390×844 light), including a repeat after the bridge/reflection spacing refinement. Their screenshots were visually inspected. In-app browser DOM inspection at 518×911 confirmed the entry action is centered and all five final link addresses and bounds are correct. After short-viewport entry spacing was tightened, all six DOM/motion browser tests passed, including continuous wheel progress, reverse travel, static reading and 960×480 layout. Existing authored Markdown remains 0 additions / 147 deletions. No publication or deployment.
