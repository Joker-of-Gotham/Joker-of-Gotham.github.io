# Tsukuyomi v11 — visible life and a usable long outline

| Work | Risk / QA | Maturity | Owner / DRI |
| --- | --- | --- | --- |
| Local visual and reading-interaction feature | S2 / QA-L2: reversible scene and DOM changes, no new permissions | M6 local verification complete | Site owner / Codex |

The user authorized the revision. No publication, architecture migration, new sensitive data or permission surface is involved; no new RFC, ADR or specialized security review is required. This file records design and verification. Preserve the existing authored Markdown diff.

The previous life objects were too small and partly buried in the quay or hidden below building eaves. Widen the inner promenade, ground pedestrians and wheels correctly, enlarge readable silhouettes, illuminate the market, and aim selected low camera compositions at street activity. Weather must occupy a visible near/middle distance with clear clouds, mist banks, rain streaks and ripples. Fireworks must remain in the camera's field of view and recur often enough to observe during a normal visit.

Home entries become a vertical staggered stack. Chapters use different approach vectors, curved movement and independent card depth while retaining one camera/DOM director. Native semantic links and static/reduced-motion fallback remain.

Replace the clipped outline dock with native details/summary: a height-bounded compressed minimap when closed and a keyboard-accessible internally scrolling complete heading list when open. No fixed minimum row size in the compressed view, no document scroll interception, and no repeated forced scrolling while the reader browses the outline.

Verification: actual rendered life/atmosphere compositions, camera clearance, seeded animation/resource bounds, vertical card geometry and reverse movement, both themes/mobile fallback, long outline visibility at varied heights, wheel/keyboard scrolling to its final item, resize/collapse behavior, errors and frame budget. Native browser zoom/physical-phone performance remain outside available verification.

## Implementation and evidence

- Scene v11: broader noise-shaped clouds; 22 world-sized mist ribbons; 2,600 close/middle-distance rain streaks (1,100 in low tier); stronger expanding water rings; 550 fireflies (240 in low tier); five interleaved fireworks with 1,500 sparks (750 in low tier), placed behind the final district inside the forward view. Distant cloud illumination is a broad 16-second pulse, not a rapid strobe.
- The inner promenade is 12 units wide. 48 articulated walkers and eight warm-colored four-wheel carts occupy clear lanes; wheels meet the 0.6-unit deck. Striped market awnings, counters and goods sit forward of the main architecture. People/carts detour around bridge ends; stalls leave the approaches open. Two lower diagonal camera stops reveal street activity.
- Home entries form a single vertical stack with a small alternating inset. The article and work stops face opposite sides; curved parent transforms and staggered card depth follow the same rendered camera progress. Mobile and shallow-height rules retain all links within the screen.
- Reading outline renders all document heading levels, including levels 4–6. Native details/summary makes disclosure work without JavaScript. The closed map distributes marks into available height; the open list has its own keyboard/wheel scroll region and Escape closes it. Active-heading tracking does not continually override reader scrolling.
- 62 unit tests passed, including 501 camera-clearance samples, grounded cart wheels, at least three legible projected walkers at the market shot, bounded weather and exactly-once GPU resource disposal.
- Full 44-test Playwright run passed: archive layouts, article media, accessibility, both themes, camera/DOM reverse travel, vertical cards at 1440×900, 390×844 and 960×480, and scene/fallback coverage. Outline was exercised on the real 92-heading Vue article at 900/480-pixel heights and 390-pixel width; keyboard and wheel reached the last item without moving the body; no-JavaScript disclosure passed.
- After the final bridge detour and portable shader edge adjustment, the affected eight scene/fallback tests passed in a separate final run.
- `npm run check`: 0 errors, 0 warnings, 3 pre-existing hints. Production build: 57 pages plus Pagefind. `git diff --check`: clean. Existing content diff remains 0 insertions / 147 deletions in the Agent Orchestration Markdown.

Visual evidence is in `artifacts/tsukuyomi-v11-2026-09-08/`: all six chapters at five theme/viewport profiles, plus world-only fallback captures. Desktop and portrait market, rain, finale, and light rain screenshots were inspected; the 92-item outline was also opened in the in-app browser. These are desktop-browser viewport checks, not physical-device or native browser-zoom performance claims.

Implementation references checked: [Three.js InstancedMesh](https://threejs.org/docs/#api/en/objects/InstancedMesh) for shared geometry/instance lifecycle, and [MDN details](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details) for native disclosure behavior. No external reference imagery or new third-party runtime assets were introduced.

Final scene regression: 8/8 passed. All five profiles report no scene runtime errors; maximum draw calls were 139 (budget <160). Worst sampled median frame time per profile: desktop 17.9 ms, day 17.5 ms, tablet 17.9 ms, phone viewport 35.6 ms, phone-day viewport 35.1 ms. Quality reduction remains active for the narrow profiles. Six fallback WebPs were regenerated from the final v11 render captures, with hashes in the poster manifest. No deployment or publication was performed.

After regenerating posters: production rebuild completed and all 3 affected fallback/no-JavaScript checks passed.
