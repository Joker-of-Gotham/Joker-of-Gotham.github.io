# ADR-0005: Full-realtime world and articulated volumetric guide

- Status: Accepted
- Date: 2026-08-28
- Supersedes the live-rendering parts of: ADR-0003 and ADR-0004

## Context

The observatory homepage already had one persistent Three.js renderer, a fixed-coordinate route and a multi-pose character atlas. In practice, however, the raster world plate still supplied most high-frequency depth, the desktop character remained a visible plane, and unguarded resize/chapter updates could look like a page refresh while the user moved or scrolled.

The new requirement is stricter: the ready state must be visually complete without a background image, the desktop guide must be real Three.js volume geometry, and pointer/scroll input must not recreate the canvas or drawing buffer. A real viewport change may resize the drawing buffer once, only after the resize burst has settled.

## Decision

### World ownership

`ObservatoryWorldV4FullRealtime` is the only live macro-world. It keeps one fixed coordinate system across all six chapters and declares `livePlateDependency: false`.

- The atmospheric sky shader writes an opaque final color behind the scene.
- Terrain, celestial body, debris, regolith boulders, observatory metal and solar membranes are opaque PBR/depth-writing geometry.
- Transparency is reserved for fog veils, stars, signal energy, halos and afterlight.
- The raster world plate remains in the DOM for static/loading/failure recovery, but its ready/suspended/degraded opacity is zero and it no longer transforms with live chapter changes.
- Enhanced quality may add Unreal Bloom through the existing single renderer/composer; lower tiers render directly.

### Character ownership

The desktop live guide is `ObservatoryVolumetricCharacterRigV2`, with representation `procedural-threejs-articulated-volume`.

The hierarchy is explicit:

```text
body root
└─ hips
   ├─ spine → chest → neck → head → eye aim
   ├─ left/right hip → knee → ankle
   └─ skirt + pleats

chest
├─ left/right shoulder → elbow → wrist
├─ collar + signal bow + crescent badge
└─ hair sway → side locks
```

Body surfaces use opaque `MeshStandardMaterial` and semantic palette roles. Chapter progress drives joint choreography, while pointer gaze, breath, hair/skirt lag and gait are bounded secondary motion. The desktop live constructor does not load either pose atlas. Portrait/static tiers retain the existing image assets as fallbacks.

This is a true procedural volumetric character, not a claim of a scanned human or authored skeletal GLB. A future asset-authored upgrade requires explicit provenance and a Blender/glTF compression pipeline.

### Rendering stability

- `ResizeObserver` and window resize share one trailing stability window; only its final dimensions are applied on the next animation frame.
- `renderer.setSize()` and composer resizing occur only when CSS width, height or capped DPR changes.
- Pointer events only replace one pending sample; layout bounds are cached and consumed in the render loop.
- Adaptive quality lowering changes scene detail, frame cadence and post-processing immediately, but defers its lower DPR cap until the next genuine viewport resize so it cannot flash the full-screen drawing buffer mid-session.
- The bootstrap chapter bridge owns static/loading states; the live controller owns ready/degraded/suspended states.
- The controller/renderer/canvas remain resident during pointer and scroll motion.

### Canvas UI

Canvas UI's official Vanilla Magnify source is vendored at a pinned upstream commit with its license. It is limited to the first Afterlight signal window.

- It dynamically imports after the first fine-pointer entry, not during homepage startup.
- It is not created for Reduced Motion, Save-Data, coarse pointers or missing WebGL2.
- It relies on Canvas UI's event-driven loop, which sleeps when settled or outside the viewport.
- DOM content remains the semantic and interactive source. Experimental HTML-in-canvas is an enhancement; the overlay fallback is acceptable.
- Canvas UI never owns navigation, article text, search, the character or the full-page world.

## Material roles

The character consumes `--scene-avatar-hair-color`, `--scene-avatar-skin-color`, `--scene-avatar-uniform-color`, `--scene-avatar-uniform-secondary-color`, `--scene-avatar-eye-color` and `--scene-avatar-shoe-color`, plus the existing Signal, Orbit, Afterlight and Metal roles. Both themes change the same material instances through the palette bridge.

## Verification contract

- Unit tests assert a minimum volumetric mesh inventory, named joint hierarchy, no visible plane, opaque/depth-writing body surfaces, semantic recoloring, joint motion, quality fallback and one-time resource disposal.
- Scheduler unit tests assert resize equality and pointer coalescing.
- E2E asserts one resident, nonblank canvas through motion, world version 4, volumetric representation, zero live plate opacity, no desktop runtime-atlas request and a lazy single Canvas UI lens.
- Reduced Motion, Save-Data, mobile, no-JavaScript and WCAG A/AA checks remain mandatory.

## Consequences

Positive:

- Live visual identity no longer depends on a raster background or flat desktop character.
- Depth, lighting and occlusion are internally coherent.
- Motion no longer reallocates the WebGL buffer for unchanged sizes.
- Canvas UI adds a real instrument interaction without entering the critical path.

Trade-offs:

- Procedural modeling is stylized, not the final ceiling of an authored Blender/glTF character.
- Opaque geometry increases fill and shading work compared with a mostly transparent plate overlay, so quality tiers and instance budgets remain necessary.
- The vendored Canvas UI source must be reviewed when updating its pinned commit and Commons Clause license.
