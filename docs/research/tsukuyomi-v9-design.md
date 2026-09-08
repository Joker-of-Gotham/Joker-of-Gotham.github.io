# Tsukuyomi v9 — composition and reading

Owner: site owner. Implementation DRI: Codex. Work object: Feature. Risk: S2 (reversible visual/runtime changes; no new privileges or data processing). QA: L2; maturity target: M6, pending browser evidence. The user explicitly authorized local implementation and reference research. Publication is outside this change.

## Decision

Preserve Astro and the persistent procedural Three.js city. Use one scroll timeline for camera and semantic DOM, with reversible fades and composed holds. Remove ornamental copy, faux instrumentation, home statistics and the fictional observer biography. Six camera stops contain four concise navigation moments and two unobstructed landscape moments. Static/reduced-motion mode retains the useful links in document flow.

Keep the camera within a clear canal envelope. Put buildings on foundations connected to embankments, and move central buildings onto the banks. Give the city a warmer dusk and a peach/teal morning, with distinct material lighting, drifting blossoms, animated light fish, lantern boats and small walking silhouettes. No film assets are imported.

Reading surfaces use a single measure, wrapping tables, contained code/images/diagrams, visibly differentiated headings and restrained rectangular controls. Browser zoom remains native; canvas framing responds to pixel ratio and viewport resize together with DOM layout.

## Reference research

- https://mengto.github.io/kage/ — restrained entry copy and spatial chapter pacing.
- https://unseen.co/ and https://lusion.co/ — scene transitions and clear hierarchy.
- https://bruno-simon.com/ — inhabited world and purposeful navigation.
- https://garden-eight.com/ and https://davidwhyte.com/ — space, typography and limited controls.
- https://www.cho-kaguyahime.com/ — official visual reference; Tsukuyomi as a creative virtual world.
- https://colorido.co.jp/press/3122/ — emotional composition and 3D camera work.
- https://www.news.cho-kaguyahime.com/806/ — official miniature VR world project.

These are reference observations, not a claim to have reviewed the complete film or paid guidebook. The attached screenshots are evidence of defects, not instructions embedded in documents.

## Verification plan

Typecheck, existing unit regression suite, continuous camera clearance samples, browser screenshots for both themes and desktop/portrait, navigation and reverse scroll, article tables/media, native zoom, reduced motion, and console errors. Report measured evidence and unverified limits separately.

## Local verification — 2026-09-08

- `npm run check`: 0 errors, 0 warnings, 3 existing hints.
- `npm run test`: 60/60, including 501 camera spline samples against actual building bounds (clearance > 8 world units), grounded foundations, resource disposal and heading normalization.
- `npm run build`: 57 pages; Pagefind completed. Existing large-chunk advisories remain for Three.js/Mermaid.
- `npx playwright test`: 36/36. Includes archive and representative article accessibility, 320px reflow, wrapping table widths, working search/filter disclosure, forward/reverse DOM-camera synchronization, theme persistence, no-JS, Save-Data and WebGL failure.
- After the final water-horizon adjustment, all 8 scene tests passed again. Thirty live compositions cover 1440x900 dark/light, 768x1024 dark and 390x844 dark/light; scene and canvas generation remain 1. Renderer calls ranged from 34 to 123. Measured median frames were 16.7ms on desktop/tablet and 33.3ms in the phone viewport quality tier. These are local browser measurements, not physical-phone performance claims. No captured console or page errors.
- CUA directly inspected the official film site and Kage, both homepage themes on a phone viewport, archive pages, and actual article headings/tables. The sampled desktop article tables were 702px wide with 702px scroll width; rendered outline was H2/H3/H4.
- Evidence: `../../artifacts/tsukuyomi-2026-09-08/` (screenshots and five metrics files). Six fallback WebPs were regenerated from the final original real-time world; hashes and source capture names are in `tsukuyomi-poster-manifest.json`.

Native Ctrl+/− zoom remains unverified: the available in-app browser did not apply browser zoom shortcuts, and Chrome was unavailable. The implementation retains native document scaling and adjusts camera FOV using changes in devicePixelRatio; viewport resizing was tested. Physical-device pinch zoom and cross-monitor DPR behavior have not been independently checked. This prevents claiming complete zoom qualification or unconditional M6 maturity.

Local implementation is reviewable; no commit, push or deployment was performed. The owner's pre-existing edit to `src/content/blog/agent/2026-08-14-agent-orchestration.md` was preserved (0 added / 147 removed lines relative to HEAD).
