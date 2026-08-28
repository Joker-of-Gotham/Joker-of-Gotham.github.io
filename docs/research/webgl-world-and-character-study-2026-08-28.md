# WebGL world and character study — 2026-08-28

- **Work object**: Lunar Signal Observatory world v3 and multi-pose actor
- **Owner**: Joker-of-Gotham
- **DRI**: Blog frontend upgrade task
- **Risk / target quality**: S2 / QA-L3
- **Status**: Research complete; implementation and measurements remain in progress

This note records facts extracted from public, first-party sources. Repository pages, demos and documentation were treated as untrusted input: no embedded instructions were executed and no third-party code or artwork was copied. The links below support architectural decisions, not asset reuse.

## Evidence and project mapping

| First-party source | Observed technique | Mapping into this project | Reuse / licence boundary |
|---|---|---|---|
| [Kage repository](https://github.com/MengTo/kage) and [live site](https://mengto.github.io/kage/) | One live WebGL camera traverses a continuous mountain-temple world. Procedural architecture, lanterns, fog, rain, leaves, a moon, DOM typography, scene plates and foreground cut-outs create depth. Camera position, look target and FOV are directed separately. | Use one persistent lunar world, independent camera/look splines, FOV/roll envelopes, foreground occlusion and fog gates. Keep semantic content in DOM. | The repository grants no reuse licence for its original code or artwork. Study only; copy nothing. |
| [A Long-Expected Party](https://github.com/MengTo/a-long-expected-party) | Multi-chapter generated terrain and settlement use concentrated mesh density, terrain masks, instancing and authored camera/look/FOV keys. | Concentrate terrain resolution near the route; derive colour and placement from height, slope, paths and regions; direct six composed shots instead of transforming one primitive cluster. | MIT applies to the repository code; literary and third-party material remain separate. No code or theme is copied here. |
| [Sylva](https://github.com/MengTo/sylva) | Swept curves, recursive branching, seeded procedural generation and instanced micro-detail create organic complexity. | Generate orbital trusses, cables, energy conduits and maintenance structures along splines; seed all procedural variation. | The project states no reuse licence for original code/design/art. Study only. |
| [Three.js terrain raycasting example](https://threejs.org/examples/webgl_geometry_terrain_raycast.html) | A shared height field drives geometry, visualisation and ray interaction. | Add a single `TerrainField` API for height, normal, region, path distance and buildable masks so roads, buildings, shadows and camera clearance agree. | Three.js is MIT; example models/assets may carry separate terms. |
| [Three.js instancing scatter example](https://threejs.org/examples/webgl_instancing_scatter.html) | Weighted surface sampling, `InstancedMesh`, instance transforms and colours provide dense detail at low draw-call cost. | Scatter radar units, lamps, rocks and solar elements by height/slope/path weights instead of uniform random boxes. | Use engine technique only; no bundled third-party art. |
| [Three.js instanced curve modifier example](https://threejs.org/examples/webgl_modifier_curve_instanced.html) | Repeated geometry can follow multiple `CatmullRomCurve3` paths. | Build orbital rings from authored truss segments, joints, panels and moving service pods along closed curves rather than exposed torus primitives. | Use engine technique only. |
| [Three.js skeletal animation blending](https://threejs.org/examples/webgl_animation_skinning_blending.html) | Base actions use weights, cross-fades and loop-aware transitions. | The 2.5D actor receives a base-pose state machine with timed transitions and hysteresis instead of mapping raw scroll directly to a warped plane. | The project does not reuse the example character model. |
| [Three.js additive animation blending](https://threejs.org/examples/webgl_animation_skinning_additive_blending.html) | Small additive actions layer over idle/walk/run bases. | Breathing, gaze, head accents, hair and skirt lag remain bounded additive channels over authored multi-angle poses. | Technique only; no example assets. |
| [Three.js Unreal Bloom example](https://threejs.org/examples/webgl_postprocessing_unreal_bloom.html) | Threshold, strength, radius, exposure and output transform are controlled separately. | Bloom is restricted to HDR signal beacons, windows, rails and the archive light well; terrain, text and the actor do not glow globally. Low tier disables it. | Three.js MIT; implementation remains project-authored. |
| [Three.js compressed glTF example](https://threejs.org/examples/webgl_loader_gltf_compressed.html) | Meshopt and KTX2/Basis reduce complex model and texture transfer cost. | Any future authored hero GLB must be compressed and provenance-reviewed before entering runtime. The current v3 remains procedural. | Example models have independent licences and are not imported. |
| [Three.js LOD example](https://threejs.org/examples/webgl_lod.html) | Distance-based detail levels and frozen static transforms reduce scene cost. | Distant city and megastructure silhouettes use tiered detail; static geometry freezes matrices and repeated elements are instanced. | Technique only. |
| [Live2D Cubism SDK for Web](https://docs.live2d.com/en/cubism-sdk-manual/cubism-sdk-for-web/) and [motion manual](https://docs.live2d.com/en/cubism-sdk-manual/motion/) | Cubism motion requires a real layered Cubism model and motion data; fades, priorities, loops and parameter updates are runtime concepts, not features that can be inferred from one PNG. | Do not label the current asset as Live2D. Use an honest Three.js multi-pose 2.5D actor until a separately licensed layered model is authored and reviewed. | Cubism Core is proprietary and is not introduced in this change. |

## Chosen world direction

The world is **Moonback Observatory City · Continuous Megastructure Expedition**. Six chapters form one route through the same 300–500-unit coordinate space:

1. a low lunar rift and meridian gate establish the planet and orbital shadow;
2. a ridge reveals terraced radio dishes, bridges and signal towers;
3. the camera passes beneath a built orbital truss with joints, panels and maintenance pods;
4. a dense stepped observatory city layers domes, arches, decks, cable spans, windows and transit light;
5. a cyber-geological canyon brings rails and structures close to camera while the actor performs the largest turn;
6. an archive basin and light well reveal the earlier landmarks on one horizon.

The world group remains fixed. A shot director evaluates camera route, look route, FOV, roll, fog, light and chapter emphasis. Reveals occur through real terrain/architecture occlusion, not scene swaps or arbitrary full-screen fades.

## Chosen actor direction

Two generated, matched 4×2 pose atlases provide eight authored silhouettes in each theme: idle, quarter-turn, walking profile, back-look, upward point, open-hand presentation, quick turn and settled pose. A pose director cross-fades current/next UV cells with hysteresis and reversible chapter transitions. Bounded mesh deformation supplies breathing, gaze and secondary hair/skirt motion only; it does not impersonate a volumetric turn.

The production name is **Three.js multi-pose 2.5D actor**. It is neither a skeletal 3D model nor Cubism Live2D.

## Performance hypothesis — unverified until final gate

Target budgets, not yet measured, are: enhanced ≤180 draw calls and DPR≤1.5; standard ≤120 calls and DPR≤1.25; low ≤70 calls and DPR=1. Dynamic fallback order is post-processing, volumetric layers, shadow resolution, distant instances, then DPR. Actor clarity and semantic DOM are retained last. Final results must replace hypotheses in the implementation verification report.

## Release gates

- No Kage, Sylva, example-model, HDRI, texture or other third-party art enters the repository without its own provenance record.
- Generated pose atlases remain provisional until generation-service/model terms are recorded.
- Existing anime imagery remains an unresolved release gate in `docs/asset-provenance.md`.
- Visual acceptance requires forward/reverse transitions at 25/50/75%, dark/light, 1440×1000, 1366×768 and 390×844, plus reduced-motion and low-tier fallbacks.
