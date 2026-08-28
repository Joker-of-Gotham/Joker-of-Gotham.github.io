# Lunar Observatory v3 local verification record

- **Date:** 2026-08-28 (Asia/Shanghai)
- **Owner:** Joker-of-Gotham
- **DRI:** Blog frontend upgrade task
- **Governance routing:** Project work object · S2 · target QA-L3 · M3 at intake
- **Candidate:** production build completed at 18:57:55; browser suite completed afterward against that build
- **Release state:** Conditional Go for `origin/main` after Owner/DRI rights attestation recorded in `docs/asset-provenance.md`

This record contains only checks that were actually executed. It is not a Lighthouse report, a real-device field study, a remote-CI result, an independent legal validation of the Owner's rights statement, or proof that known dependency advisories are unexploitable.

## Delivered system under test

- Six-chapter Lunar Observatory home route with one fixed 459-unit Three.js world, independent camera/look splines, terrain field, instanced observatory kit, atmospheric contour layer and theme-matched cinematic far-world plates.
- Matched dark/light 4×2 pose atlases with eight authored silhouettes, reversible pose selection, shader-driven secondary motion and build-time silhouette-rim baking.
- Desktop and landscape use the real-time 2.5D WebGL actor. Portrait uses six content-flow stages sourced from the same pose atlas so actions remain legible without covering copy; static tiers reuse the poster and never request an atlas.
- Poster, no-JavaScript, Reduced Motion, Save-Data, no-WebGL and context-loss fallbacks; opt-in synthesized ambient audio remains muted until an explicit gesture.
- Unified archive, search, roadmap, artifact and article reading surfaces with responsive media, scroll-contained tables/code/formulas, accessible overflow regions and task controls.

## Deterministic verification

| Command | Actual result |
|---|---|
| `npm run assets:avatar-runtime` | 2 true-alpha 1536 × 1024 WebP runtime atlases and hash manifest generated |
| `npm run assets:world-variants` | 2 true-WebP 896 × 448 compact plates and hash manifest generated |
| `npm run check` | 0 errors, 0 warnings, 3 non-blocking hints |
| `npm run test` | 4 files, 27/27 tests passed |
| `npm run build` | static production build completed; 57 pages generated; Pagefind postbuild completed |
| `npx playwright test` | 30/30 tests passed |
| `git diff --check` | passed before staging; line-ending notices are repository/Windows conversion notices, not whitespace errors |

The three Astro hints are two inline-link handler inference hints in `BaseLayout.astro` and one pre-existing unused `cjkPattern` declaration. The production build also reports the existing >500 kB raw chunk warning for Three/Mermaid-related chunks; the observatory controller is dynamically loaded after first contentful paint.

## Browser and accessibility coverage

The Playwright suite verified:

- all six home chapters, theme persistence, explicit ambient-audio gesture, static/no-JavaScript behavior, Reduced Motion, Save-Data and chapter-navigation synchronization;
- no horizontal overflow at 320 × 800, 390 × 844, 768 × 1024, 844 × 390, 1280 × 800 and 1920 × 1080 representative viewports;
- six portrait actor stages with `present`, `point-up`, `walk-profile`, `quick-turn`, `back-look` and `settle` silhouettes;
- archive shells, command palette, responsive article media, locally scrollable code/tables/formulas, focusable math regions and contextual task-list labels;
- WCAG A/AA automated scans for the home route, all five archive/search/about surfaces, and three representative long-form articles at 320 px in both themes.

The final article scans reported zero automated WCAG A/AA violations after moving horizontal overflow from inner `.katex` nodes to their focusable `.katex-display` parent and increasing inline-code/YAML-comment contrast. Automated axe checks do not replace manual assistive-technology testing.

## Visual review

The final screenshot matrix covered both themes at 320 × 568 and 390 × 844 across all six chapter anchors, plus 1366 × 768, 1440 × 1000, wide desktop, mobile landscape and Reduced Motion samples.

Passed observations:

- chapter headings remain below the fixed navigation safe area; `active`, `aria-current` and the final Afterlight anchor stay synchronized;
- no exposed opaque primitive blobs remain in the Three.js foreground; translucent terrain, architecture, trusses and contour atmosphere blend with the authored far-world plate;
- desktop actor placement no longer covers Orchestrate entries, Embodiment copy or Afterlight headings;
- portrait stages show a complete, recognizable pose without intersecting headings, prose, entries or CTA controls;
- portrait Reduced Motion hides the free background poster actor and uses an in-flow poster stage, eliminating the previous full-height character/text collision;
- code blocks, images, tables, KaTeX and archive layouts stay contained at narrow widths.

Accepted P3 observations: the portrait stage clips roughly 1 px at the shoe edge because the illustrated foot sits on the stage baseline, and six in-flow stages increase the portrait home document height by about 18%. This is the deliberate tradeoff for legible, collision-free character actions rather than an overlaid cameo.

Known P2: during a small number of desktop scroll-transition intermediate frames, the Observe `quarter-turn` and Orchestrate `present` silhouettes can briefly enter the copy region. Every settled chapter anchor, heading, navigation control and primary action remains clear. Refining those transient timing envelopes is deferred; the exact 25%/50%/75% transition review remains open in the asset ledger and is not reported as complete.

## Performance regression evidence

Measurements used system Chrome Headless with ANGLE/SwiftShader, fresh contexts, blocked third-party requests, no CPU/network throttling, Resource Timing and in-memory WebGL draw instrumentation. These are local relative-regression measurements, not field performance scores.

### Desktop enhanced path

- 1600 × 1000: FCP/LCP 836 ms; controller request 1035 ms, 199 ms after FCP.
- Enhanced world: 47 draw calls and 100,418 triangles; `gl.getError() = 0`.
- Build-time rim baking removed sixteen neighbor texture fetches per fragment. Weak-GPU frame cadence improved from the rejected candidate's stable ~12 fps to repeated 20–29.9 fps enhanced samples.
- Time-window degradation begins after 0.9 s warmup plus a 2.2 s sample window: enhanced → standard observed at about 2.86 s, then low at about 5.09 s instead of roughly 11.9 s for the previous frame-count gate.

The final post-18:28 changes are portrait-only actor loading/composition and article CSS; the desktop renderer path was not structurally changed afterward.

### Final portrait low path

- 390 × 844 DPR2: 150 effective frames / 5 s; median 33.3 ms, P95 33.4 ms, approximately 30 fps.
- 40 draw calls, 33,356 triangles, `gl.getError() = 0`, no application/WebGL/shader error.
- Cold local transfer: 493,721 bytes.
- Exactly one runtime atlas request (current-theme dark atlas in the measured run, 165,318 transferred bytes). Portrait skips `createObservatoryAvatarRig`, preventing the previous concurrent CSS/TextureLoader duplicate and the unused opposite-theme download.
- Crossing the 820 px portrait media condition remounts the renderer so landscape restores the real-time actor.

### Static and constrained paths

- Reduced Motion and Save-Data: `static / poster`, no controller request, no runtime atlas request.
- Compact dark plate: 35,592 transferred bytes; measured total local transfer 170,834 bytes.
- Mobile/Reduced/Save-Data use the 896 × 448 far-world derivative; desktop retains the 1774 × 887 plate.

Known P2: renderer construction still produced a roughly 206–255 ms post-FCP long task in the local software-rendered measurements. Initialization remains deferred until after FCP and is absent from static tiers, but further worker/off-main-thread decomposition was not implemented in this scope.

## Dependency and release gates

`npm audit --json` on the verified lockfile reported 4 findings: 2 low and 2 high, all on the Astro 5 dependency path. The available automated remediation crosses to Astro 7. ADR-0002 keeps this static build on Astro 5 temporarily, prohibits the affected dynamic/server patterns, and requires a separately tested major migration. This is a documented risk acceptance boundary, not a claim of remediation.

## Release Quality Report

- **Decision:** Conditional Go for the current `main` push.
- **Approver:** Owner/DRI `Joker-of-Gotham`, 2026-08-28.
- **Rights decision:** the Owner explicitly confirmed that all release images have obtained authorization. The statement and its scope are recorded in `docs/asset-provenance.md`; underlying legal documents were not independently inspected by the agent.
- **Accepted technical risk:** the documented Astro 5 dependency advisories remain constrained to a static-only deployment boundary under ADR-0002; the transient actor-overlap P2 and post-FCP renderer-init long task remain non-blocking follow-up items.
- **Rollback:** revert the release commits with ordinary Git revert commits and allow the static Pages pipeline to redeploy the preceding known-good revision. No data migration or persistent server state is involved.
- **Staged rollout:** push `main`, confirm the remote branch SHA, observe the GitHub Pages workflow, then smoke-check the live homepage and a representative archive/article route in both responsive and static-fallback behavior where available.
- **Post-deploy status:** passed for the code-carrying release commit `51f1bc5cda520dd8f87603c26970a49de0bbc5c6`.
- **Remote verification:** `refs/heads/main` resolved to `51f1bc5cda520dd8f87603c26970a49de0bbc5c6` immediately after the push.
- **GitHub Pages:** workflow `Build and Deploy Astro site #198` completed with `Success` (`build` 52 s, `deploy` 16 s). The published `github-pages` artifact was 150 MB with digest `sha256:0a826f077bbfacb7907ad763bf3b24e5baca45c4e73eaba9873746eadd4f2d75`.
- **Live smoke checks:** cache-busted requests to `/`, `/blog/`, `/blog/2026-08-14-agent-orchestration/`, and the dark world WebP all returned HTTP 200. Headless Chrome confirmed the observatory, archive, and full-article containers were visible with zero document-level horizontal overflow at 320/390 px; Reduced Motion resolved to `poster / static`.
- **Release-control observation:** the direct Owner push bypassed repository rules requiring a pull request and the expected status check. The Pages workflow subsequently completed successfully, so the artifact was still built and deployed by the configured pipeline. Future releases should use the protected PR path unless an explicitly recorded emergency/Owner exception is required.
- **CI follow-up:** GitHub emitted two Node.js 20 deprecation warnings for the current official Actions versions, which were forced to Node.js 24 by the runner. Track compatible action upgrades; this did not fail the release.
