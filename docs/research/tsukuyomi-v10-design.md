# Tsukuyomi v10 — living night and editorial reading

| Work object | Risk | QA | Maturity | Owner / DRI |
| --- | --- | --- | --- | --- |
| Feature: local visual/runtime revision | S2: reversible UI and procedural graphics; no new permissions | QA-L2 | M5 until browser evidence | Site owner / Codex |

The user authorized local implementation and reference research. No publication is included. No architecture or permission boundary changes require a new RFC, threat model, privacy or embodied-control review. This document records the design decision and local QA; the owner reviews aesthetic acceptance.

## Decisions

- Remove the inherited toolbar inset and blur; catalogue cards own media geometry. The newest three unfiltered entries form a magazine composition. Other entries use compact rows; filtered results reflow without empty featured slots.
- Near-black violet reading surfaces; warm windows against genuinely dark architecture. Light mode keeps its ivory/teal palette.
- Three-level article outline is relative to the document heading root. Shiki emits both theme palettes. Tables use horizontal rules, no enclosing frame or vertical grid; media receives deliberate vertical spacing.
- About-page copy sits over a continuous translucent image scrim, with no opaque text rectangle. Home chapters alternate positions and use camera-synchronized perspective motion, two actual cover cards, and unobstructed landscape stops.
- Living city: slowly moving layered clouds, ground mist, district rain and wind, restrained distant cloud illumination, fireflies and distant festival fireworks. Quay markets, walking figures, carts and moving boats inhabit the streets and canal. Effects are procedural and quality-tiered; no film assets or external image downloads.

## Reference research

- https://www.cho-kaguyahime.com/ — official film world/visual presentation.
- https://mengto.github.io/kage/ — spatial pacing and restrained foreground content.
- https://threejs.org/manual/en/fog.html — distance/fog behavior.
- https://threejs.org/examples/webgpu_compute_particles_rain — particle rain reference; this implementation remains WebGL-compatible.
- https://docs.astro.build/en/guides/syntax-highlighting/ and https://shiki.style/guide/dual-themes — generated dual-theme tokens, selected by CSS.

Public reference research is not full-film review. Screenshots supplied by the owner are defect evidence. Physical weather is an authored animation, not real meteorological data.

## Required verification

Typecheck/build, existing unit regressions plus weather/resource bounds, actual rendered catalogue geometry and table/code themes, complete relative outline, both home themes at desktop/tablet/phone, no-JS/reduced-motion fallback, forward/reverse travel, effect screenshots, page errors and measured frame/draw budgets. Preserve the existing user-authored Markdown diff.

## Verification results — 2026-09-08

- `npm run check`: 0 errors / 0 warnings. Three existing hints remain; the added unused callback parameter was removed.
- `npm run test`: 61/61 across 11 files. Includes bounded weather over 300 seconds and the complete camera-clearance/resource-disposal suite.
- Full browser suite: 40/40 passed after weather/rain-ripple and document-flow updates. Then the artifact grid regression was added and all 21 archive/editorial tests passed on the final layout. The additional four code/fallback checks passed after regenerating posters.
- Actual catalogue measurements passed at 320, 390, 768, 960, 1440 and 1920 CSS pixels. Row thumbnails retain 1.6 aspect ratio; search-to-first-card spacing stays 12–60px without blur. Artifact thumbnails and text alignment passed at 390, 768, 1440 and 1920px. This verifies viewport reflow; native browser zoom and physical-device pinch remain unverified in this environment.
- Thirty live home compositions cover five viewport/theme profiles. Median frame interval: desktop/tablet 16.7ms; phone viewport quality tier 33.3ms. Maximum observed draw calls: 137. No captured page/console errors. These are local browser measurements, not physical-phone benchmarks.
- Weather diagnostics at the rain chapter: 0.688–0.719 rain intensity; finale festival intensity 1.000. Scene/canvas generation stays 1 across forward and reverse travel.
- CUA inspected real browser views of both home themes, the magazine catalogue, corrected artifact list, About scrim and ruled article table. Code screenshots show distinct dark/light syntax palettes. The relative outline includes OpenInference, PROV, OCELs and IEEE XES as third-level entries.
- `npm run build`: 57 pages, Pagefind completed. The existing large JavaScript chunk advisories remain. Fallback WebPs were generated from this procedural scene, with source captures and SHA-256 hashes in `tsukuyomi-poster-manifest.json`.

Evidence directory: `../../artifacts/tsukuyomi-v10-2026-09-08/` (scene/editorial/code screenshots and five metrics files). The previous v9 evidence is retained.

The implementation remains local and reviewable. No commit, push or deployment. The user's existing article edit is unchanged (0 additions / 147 deletions relative to HEAD). Aesthetic approval and physical-device performance/zoom qualification are not claimed.
