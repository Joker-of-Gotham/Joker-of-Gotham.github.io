# 月读夜游 — Tsukuyomi world V8

## Authorized direction

The user's 2026-09-07 correction supersedes the lunar sculpture concept entirely. Rebuild the background around the virtual Tsukuyomi world in **Cosmic Princess Kaguya! / 超かぐや姫！**. Use Kage for spatial pacing and layered atmosphere. Retain the personal site's semantic content, six chapter anchors and usable archive links.

## Visual evidence

Reviewed actual scene images downloaded into `artifacts/tsukuyomi-reference/` solely for research:

- `official-city.jpg`: [Twin Engine official press release](https://prtimes.jp/main/html/rd/p/000000082.000032680.html). Dense Kyoto-inspired roofscape, warm lantern strings, magenta/cyan digital signage, luminous fish.
- `cgworld-city.jpg`: [CG production breakdown](https://cgworld.jp/article/cgw331-chokaguyahime03.html). Black-blue curved tiled roofs, wooden balconies, bright window interiors and schools of glowing fish between buildings.
- `cgworld-torii.jpg`: same production breakdown. Monumental red torii, violet-pink cherry blossoms, gold/teal/white fish streams against indigo sky.
- [Production staff interview](https://cgworld.jp/article/cgw331-chokaguyahime01.html): the director and background team describe Kyoto-style city blocks with digital signs and the importance of luminous fish.

Scene images are references, not live background textures. Local procedural architecture and shaders reconstruct the requested subject; no screenshot plane substitutes for 3D. The site is a personal fan-inspired interpretation, not an official film experience.

## World bible

Travel through a lantern-lit canal city: a red gate frames the entrance, layered eaves and sakura lead to an arched bridge, then a waterside pavilion and moonlit festival stage.

One unit is approximately a metre. World length ~450 units. Canal at y=-1; waterfront decks y=0.4; buildings 8–28 high; temple eaves have an actual curved profile, thickness, tile ribs and decorative ridges. Torii use tapered posts, double beams and curved lintels, not rectangular gate boxes.

| Role | Dark palette | Light palette |
| --- | --- | --- |
| Sky / mist | Indigo `#10162e`, violet-blue `#303555` | Lavender dawn `#a8aac7` |
| Timber | Aubergine `#332034` | Warm brown `#614450` |
| Roof | Blue-black `#15263b`, turquoise edge `#336879` | Blue slate `#4e6479` |
| Gate | Lacquer red `#b44755`, vermilion highlight | Red lacquer retained |
| Practical light | Peach-gold `#ffd397` | Warm cream |
| Digital life | Mint `#82eadb`, pink `#f5a0d6` | Same identity, lower emission |
| Sakura | Dusty rose / lilac / pearl | Pale pink |

The first composition reserves left-side air for the personal heading; the principal gate and a tall pagoda occupy the center-right. The guide has a smaller footprint so architecture remains visible. Native scroll drives reversible camera state. Desktop FOV 43–47°, portrait widens and recenters on the scene's landmark. Camera roll is restrained. Fish swim along world-space trajectories; lantern halos, water ripples and drifting petals are slow and continuous.

## Six chapter ledger

| DOM chapter | World location | Landmark | Lighting / movement |
| --- | --- | --- | --- |
| signal-gate | Canal mouth | Grand torii + layered city skyline | Warm lanterns, cyan fish and moon |
| observe | Lantern quay | Timber terraces + sakura | Close parallax, local warm spill |
| structure | Canal crossing | Curved vermilion bridge | Real water reflection, roof rhythm |
| orchestrate | Festival district | Five-tier waterside pagoda | Dense windows, hanging light strings |
| embodiment | Sakura court | Moon-viewing pavilion | Petals and light fish |
| archive-afterlight | Quiet water stage | Open ceremonial gate | Warm afterlight over the canal |

## Architecture, materials, loading, performance

One renderer, one scene, one persistent city. Merge indexed static geometry by material within spatial districts, including lantern shells and roof details. Instance the fish and render the canopy as thousands of depth-tested five-petal sprites. Material families: timber, lacquer, tile, stone, glowing paper, digital accents. Procedural grain/ribs plus real medium-scale geometric detail establish material character. One key and hemisphere fill; two local lights move continuously along the route. Sprite halos supply the visible softness of lanterns without hundreds of point lights.

Reflections use a 768² offscreen target (384² and alternate frames on the low tier) with explicit disposal. Fish bodies/fins are meshes, grouped by color for instancing; sparse particles support the living-world effect. Visible draw budget: fewer than 130 including the actual reflected scene. Preserve first-paint priority, async shader warming, DPR caps, visibility suspension, static reduced-motion/data-saving fallback, context recovery and route cleanup. The first frame has no required network model/HDR/texture downloads. Posters are captures of the actual final scene, with separate desktop, smaller desktop and portrait exports for both themes.

## QA contract

Check all six compositions at 1440×900, 768×1024 and 390×844, plus light theme. Inspect clean world-only captures as well as content overlays. Test forward/reverse scroll, route navigation, resize without scene recreation, context failure, reduced motion and complete disposal. Record draw calls, triangles, frame intervals and first-frame timing in `artifacts/tsukuyomi-2026-09-07/`; report browser emulation separately from untested real phones.

## Verification — 2026-09-07

- `npm run check`: zero errors/warnings, three pre-existing hints in BaseLayout and similarity.
- `npm run test`: 59 tests across 10 files pass, including curved roof normals, persistent district identity, no scene fetches, and exactly-once disposal of geometry/materials/maps/instance buffers.
- `npm run build`: 57 pages built successfully; the Three/controller bundle is lazy, approximately 607 KB before compression.
- Existing observatory and DOM-motion browser suites: all 24 tests pass against the production preview. Includes normal/reverse chapter travel, resize churn, offscreen suspension/resume, navigation, keyboard controls, reduced motion, Save-Data, no JavaScript and automated WCAG A/AA checks.
- New city suite: all eight cases pass across the full run and focused rerun. An initial light-theme case reported an intermittent connection failure from the existing GitHub contribution API. The scene test now records that specific external origin separately, while retaining hard failures for local resource errors, JavaScript exceptions and shader errors. No scene errors were found.
- Five viewport/theme sets each have six chapter captures plus a clean world capture. Additional screenshots verify portrait static theme switching and no-JavaScript fallback. All image sources decode; production posters come from the final scene captures.

Production preview measurements, local Windows Chrome, fresh browser contexts over loopback (not a real-phone or network-throttled benchmark):

| Viewport / theme | First live frame | Chapter median frame interval | Draw calls, including reflection |
| --- | --- | --- | --- |
| 1440×900 dark | 1534 ms | 20.9–21.0 ms | 65–118 |
| 768×1024 dark | 1760 ms | 20.9–21.1 ms | 63–117 |
| 390×844 dark | 1834 ms | 34.7–34.8 ms | 32–58 sampled |
| 1440×900 light | 2228 ms | 21.0–21.1 ms | 65–118 |
| 390×844 light | 2855 ms | 34.7–34.8 ms | 40–115 sampled |

The low tier targets 30 fps and updates the reflection on alternate rendered frames, so sampled draw counts differ depending on the reflection phase. Desktop samples are approximately 48 fps in this test environment; 60 fps and real iOS/Android behavior are not asserted. No model/HDR/remote scene texture requests occurred. The six image exports total approximately 470 KB; only the relevant responsive/theme image is displayed. Exact per-file bytes/hashes are in `tsukuyomi-poster-manifest.json`.
