# Reading and navigation repair — 2026-09-08

| Work object | Risk | Quality | Maturity | Owner / DRI |
| --- | --- | --- | --- | --- |
| Local UI repair and documentation | S2: reversible renderer/navigation changes | QA-L2: static, unit, browser and visual checks | M5 implementation; validation pending | Site owner / Codex implementation |

Authorization: user's requested local fixes and README screenshots. No publication or repository metadata mutation. No new external art. Authored article content is excluded from edits.

Decision: retain one WebGL canvas through Astro navigation, dormant on detail pages. Direct detail visits must allocate no renderer. Dispose at document lifetime end. This avoids synchronous GPU teardown/recreation in the navigation critical path. Reading pages use the existing solid reading background.

Confirmed defect: old fallback WebP screenshots contain homepage title/links. Parent visibility hiding did not override descendants with explicit visibility. Regenerate from live scene with all content descendants hidden and version filenames.

Mermaid: lazy sequential rendering, route cancellation guards, theme-aware palettes, authored-node contrast correction and ELK flowchart layout. Reading media receives a keyboard-accessible zoom/pan dialog. No alteration of authored diagram sources.

Special reviews: local lifecycle/accessibility/visual review required. No separate RFC, security, privacy or embodied-control review: no new privileged action, data flow or physical control. This record is the local decision source; no release claim.

## Validation and limits

M6 locally verified; not deployed. Owner review remains the normal next release step.

- `npm run check`: 0 errors, 0 warnings, 3 existing hints.
- `npm run test`: 65 tests / 13 files passed.
- `npm run build`: passed, including Pagefind indexing.
- Browser regression batch: 35 passed (archive, six-scene DOM motion, outline, route scenes, reading media). Two additional WebGL/reduced-motion fallback checks passed.
- Two screenshot capture checks passed. Nine README images total 639,648 bytes. All local README links resolve; English and Chinese versions have matching sections and image sets.
- The reported PROV diagram has zero overlapping edge-label rectangles in both themes. Pastel node labels resolve to `rgb(23, 18, 29)`; the second, clustered diagram also renders successfully. Theme changes rerender visible diagrams.
- Viewer: diagram, table, inline image, full-resolution cover, mobile controls, zoom, pan, Escape, and focus return verified. Native dialog was visually inspected in the in-app browser.
- Three navigation cycles reused the identical canvas and scene generation; article RAF inactive, list RAF resumed. Direct article visits did not request the controller module. Timings are local automation samples, not production latency or a cross-device FPS guarantee (`artifacts/tsukuyomi-v14-2026-09-08/navigation-cycles.json`).
- New avatar is a byte-for-byte copy of the user-supplied JPEG; moon/star favicon is original SVG. Mobile avatar decode and favicon reference checks passed. The settled sidebar was visually checked in the in-app browser.
- Authored Agent Orchestration Markdown remains at its preexisting 0 additions / 147 deletions; this task did not change it.

The WebGL low tier retains its deliberate 30 FPS cap; faster route switching is achieved through renderer reuse, paused hidden work, removal of duplicate diagram enhancement passes, and shorter transitions. No universal frame-rate claim is made.

Evidence: `artifacts/v14-{check,unit,build,browser,fallback}.log`, `docs/screenshots/manifest.json`, and `docs/research/tsukuyomi-poster-manifest.json`. Implementation verification preceded publication; GitHub About/Topics were not changed.

## Publication authorization — 2026-09-08

The owner explicitly requested add, commit, and push to `main`. This authorizes delivery through the existing GitHub Pages workflow. Publication scope is the accumulated site changes, documentation, runtime assets, and existing article revision, with the article recorded separately. Temporary `artifacts/` captures and logs remain local; README screenshots and their manifest are included. Risk remains S2 / QA-L2 with local M6 validation above; no separate RFC or specialized review is required for this authorized delivery. The Git commits and remote branch are the delivery record; successful push alone is not proof of completed Pages deployment.
