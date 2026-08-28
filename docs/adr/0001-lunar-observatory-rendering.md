# ADR-0001: Lunar Observatory rendering architecture

- **Status**: Accepted
- **Decision date**: 2026-08-28
- **Owner**: Joker-of-Gotham
- **DRI**: Blog frontend upgrade task
- **Risk / quality**: S2 / target QA-L3
- **Related**: [`DESIGN.md`](../../DESIGN.md), [`design-system/MASTER.md`](../../design-system/MASTER.md), [`docs/asset-provenance.md`](../asset-provenance.md)

> Avatar representation and the concrete macro-world were amended by [ADR-0003](./0003-deformable-avatar-and-macro-world.md). The particle-avatar pipeline below is retained as decision history and is superseded for production.

## Context

The approved experience combines a cinematic Lunar Signal Observatory, a stable research archive, anime memory slices, an opt-in ambience layer, and a dual-theme particle avatar. It must remain an indexable Astro site with readable articles, Pagefind search, keyboard navigation, Mermaid, KaTeX, and graceful behavior on devices that cannot or should not run a continuous 3D scene.

The strongest visual request is a continuous Three.js / WebGL space. The avatar is intended to use the sampling and interaction ideas demonstrated by Canvas UI Particle Object. Running an independent renderer for every section or putting interface text into Canvas would make lifecycle, input, theme synchronization, accessibility, performance, and context recovery harder to control.

## Decision drivers

1. Preserve semantic HTML, SEO, selection, search, and accessibility.
2. Produce spatial continuity without multiple canvases competing for the GPU.
3. Keep dark/light avatar and scene transitions in one coordinate system.
4. Allow deterministic pause, degradation, and static fallback.
5. Prevent cinematic effects from degrading long-form reading.
6. Keep third-party code and asset provenance auditable.

## Considered options

### A. DOM/CSS only

Lowest runtime cost and simplest accessibility, but cannot deliver the requested particle reconstruction, depth, camera movement, and coherent 3D space. Rejected as the primary experience; retained as the fallback layer.

### B. A separate Canvas UI / Three.js renderer per section

Fast to prototype and keeps examples close to upstream APIs, but duplicates contexts, animation loops, pointer handling, theme state, and memory. Transitions between sections become compositing tricks rather than one spatial narrative. Rejected for production topology.

### C. One shared Three.js renderer with DOM overlays

One renderer owns camera, scene graph, fog, light, particles, and avatar states. Astro / DOM owns all copy and interaction. Section observers update scene state rather than mounting new renderers. Chosen.

### D. Pre-rendered video as the main background

Predictable art direction but poor theme responsiveness, large transfers, weak interaction, and limited accessibility adaptation. Rejected as the main system; short video or still sequences may be optional Posters if provenance and budgets permit.

## Decision

Adopt **one shared, lazily loaded Three.js renderer** for cinematic pages. Mount a single Canvas behind the semantic DOM and drive it through a small scene-state controller. Use Canvas UI Particle Object as a behavior reference or prototyping aid; for production, either integrate a pinned, license-reviewed package or adapt only the required sampling / spring / cursor concepts into the shared renderer. This ADR does not authorize copying upstream source without license and provenance review.

### Rendering boundary

| Concern | Owner |
|---|---|
| Headings, prose, navigation, search, forms, controls | Astro / DOM |
| Camera, fog, lights, spatial particles, avatar morph | shared Three.js renderer |
| Scene section state | DOM observers → typed scene-state bridge |
| Theme palette | CSS semantic tokens → computed-style bridge |
| Reduced motion / low power | CSS/media signals → quality governor |
| Audio consent and playback | DOM control; never the renderer |

The Canvas is decorative by default (`aria-hidden`) and cannot be the only representation of information. Any interactive 3D object needs an equivalent DOM control and accessible name.

### Lifecycle

1. Server-render the complete page and a static scene Poster.
2. Check reduced motion, WebGL capability, visibility, device memory/concurrency signals where available, and page intensity.
3. Lazy-import the renderer only on eligible cinematic pages.
4. Replace or fade the Poster only after the first valid frame.
5. Pause requestAnimationFrame, expensive observers, and ambience when the document is hidden.
6. Dispose page-specific geometries, textures, materials, and listeners on Astro navigation.
7. On `webglcontextlost`, keep DOM and Poster visible; attempt one bounded restore, then remain degraded.

### Scene structure

The scene is one world with reusable groups, not six isolated demos:

```text
World
├─ Atmosphere (fog, stars, distant moon)
├─ SignalField (low-cost ambient particles)
├─ NarrativeGroups
│  ├─ SignalGate
│  ├─ Observe
│  ├─ Structure
│  ├─ Orchestrate
│  ├─ Embodiment
│  └─ ArchiveAfterlight
├─ Avatar (dark/light point targets + transition state)
└─ CameraRig (scroll progress + bounded pointer offset)
```

Only the current and adjacent narrative groups may be fully active. Distant groups reduce draw frequency, material complexity, or visibility. Scroll changes a normalized scene state; it must not replace native scrolling or trap the user.

### Particle avatar pipeline

1. Start from the selected dark and light concept sources recorded in the asset ledger.
2. Produce clean transparent masters or verified alpha masks. The current generated concepts have RGB pixels with a baked checkerboard and cannot be sampled as transparency.
3. Normalize pose, crop, anchor point, perceived scale, and silhouette between variants.
4. Generate stable target-point datasets offline where practical; do not resample full raster images on every visit.
5. Preserve a stable particle identity map between themes to avoid random flicker during morphing.
6. Use bounded spring, drift, push, or swirl behaviors. Pointer forces apply only around the character and never capture page input.
7. In reduced motion, render a static optimized image or a non-moving point silhouette.

### Theme bridge

JavaScript and shaders read scene colors from the semantic CSS bridge tokens:

- `--scene-fog-color`
- `--scene-signal-color`
- `--scene-orbit-color`
- `--scene-afterlight-color`
- `--scene-metal-color`
- `--scene-particle-base`

No brand color literal may be duplicated in scene code. Theme changes interpolate the live scene only when motion is permitted; otherwise they swap immediately with the corresponding Poster / avatar source.

### Audio boundary

The scene never starts or loads ambience by itself. Audio remains muted until an explicit user action. It pauses when hidden, exposes volume and stop controls, and fails silently without blocking visuals or content. Mobile data-saving and reduced-motion modes default to no audio fetch.

## Quality tiers and target budgets

These are acceptance targets, not measured results:

| Tier | Typical condition | Scene policy |
|---|---|---|
| Poster | reduced motion, no WebGL, context failure | static responsive image; no RAF |
| Low | small/touch or constrained device | DPR ≤ 1, no postprocessing, low particle count, 30fps cap |
| Standard | capable laptop / desktop | DPR ≤ 1.5, bounded particles, target 60fps |
| Enhanced | explicit capability evidence | selective bloom / depth only if frame budget remains |

Additional targets:

- The Poster and semantic hero must participate in LCP; WebGL must not delay readable content.
- The renderer must not cause layout shift.
- Standard mode targets a median frame time under 16.7ms; Low targets under 33.3ms on representative hardware.
- First-route scene code and core runtime should be lazy and independently measurable; a concrete compressed-byte budget is set after the implementation bundle is profiled.
- Textures are resized to their actual display/sampling need; unused source-resolution imagery is not uploaded to the GPU.
- A background tab has no continuous animation loop or audible ambience.

## Consequences

### Positive

- One coordinate system enables true spatial continuity and reliable avatar morphing.
- A single quality governor can enforce performance and accessibility.
- DOM semantics remain intact and independently testable.
- Theme values stay synchronized through design tokens.
- Static fallback is a first-class mode rather than an emergency patch.

### Costs and risks

- The shared renderer needs explicit resource ownership and teardown discipline.
- A scene-state bridge and quality governor add architecture work before visual polish.
- Particle point datasets and theme morphs need asset preprocessing.
- WebGL behavior varies by browser/GPU; context loss and mobile thermal throttling require real-device evidence.
- Canvas UI version, API, license, and copied/adapted code remain unverified until a dependency decision is made.

## Release gates

- Renderer dependency versions and licenses recorded.
- Avatar masters have real transparency or verified masks; concept checkerboard is removed.
- Existing anime screenshot provenance is resolved or assets are excluded by an explicit release decision.
- Keyboard, screen-reader landmarks, reduced motion, no-WebGL, context loss, dark/light, touch, background-tab pause, and default-muted audio are tested.
- Performance targets are measured on representative desktop and mobile profiles.
- Build/check and visual regression results are recorded without fabrication.

## Validation status

This ADR records an approved architecture decision only. No renderer implementation, bundle profile, frame-time measurement, context-loss test, audio test, or device validation was executed as part of this document change; all such evidence is currently **unverified**.
