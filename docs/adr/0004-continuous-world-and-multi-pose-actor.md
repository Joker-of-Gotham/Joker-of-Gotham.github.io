# ADR-0004: Continuous world route and multi-pose 2.5D actor

- **Status**: Accepted · implementation verified locally; release gated by asset provenance
- **Decision date**: 2026-08-28
- **Owner**: Joker-of-Gotham
- **DRI**: Blog frontend upgrade task
- **Risk / quality**: S2 / target QA-L3
- **Supersedes in part**: ADR-0003 single-image avatar and first macro-world implementation
- **Related**: [`DESIGN.md`](../../DESIGN.md), [`research study`](../research/webgl-world-and-character-study-2026-08-28.md), [`asset ledger`](../asset-provenance.md)

## Context

Visual review of world v2 found recognisable Three.js activity but not a convincing place: exposed boxes, cones and rings read as a geometric demo; chapter changes did not reveal a continuous large-scale world; one front-facing texture could not perform credible turns or limb gestures. The owner rejected that result and explicitly requested a more complex, monumental, beautiful world and character actions including turning and full limb movement.

Primary-source study confirms that scale is created by a fixed traversable world, independently directed camera/look paths, recognisable terrain and architecture, occlusion, atmosphere and restrained signal lighting. It also confirms that one flattened image cannot become real Live2D or skeletal motion.

## Decision

1. Build one fixed 300–500-unit lunar observatory world and move the camera through it using independent, arc-length-friendly Catmull–Rom camera and look routes plus authored FOV/roll/fog/light envelopes.
2. Introduce a deterministic `TerrainField` with height, normal, region, road/canyon distance and platform masks. All major placement and camera clearance query the same field.
3. Introduce an original procedural `ObservatoryKit`: dish assemblies, ribbed domes, stepped bases, arches, bridges, cables, window bands, solar membranes, truss sections, joints and maintenance pods. Primitives are construction inputs, not exposed hero silhouettes.
4. Keep world objects resident and instance repeated detail. Chapters change the shot, emphasis and local activity; they do not rebuild independent scenes or translate the world group.
5. Replace the single character image with matched dark/light 4×2 pose atlases and a reversible state machine. Eight authored poses provide real silhouettes for turns, walking and arm gestures; breathing, gaze and cloth/hair lag remain additive.
6. Name the result a **multi-pose 2.5D actor**. Do not claim Live2D, VRM or skeletal 3D. A true layered/rigged model requires a separate art, licence and dependency decision.
7. Preserve poster, reduced-motion, Save-Data, no-WebGL and context-loss paths. DOM content remains complete and interactive before the renderer exists.
8. Add an original, theme-matched cinematic far-world plate beneath the transparent WebGL canvas. It establishes detailed distant terrain and megastructure at low draw-call cost; Three.js still owns the route, parallax, foreground occlusion, atmospheric motion and actor. The raster contains no semantic content and may not replace the accessible DOM.
9. Treat portrait as a different composition rather than a smaller desktop shot. At 820 px or narrower in portrait orientation, retain the live Three.js world but skip real-time actor construction and show a complete chapter-specific atlas pose in an in-flow DOM stage. Reduced Motion and Save-Data reuse the poster instead of requesting an atlas. Crossing the portrait boundary remounts the renderer so landscape restores the real-time actor.

## Consequences

- The world becomes spatially legible and the actor can perform visible chapter-specific actions without misleading technical claims.
- Two compressed atlases replace sixteen independent resident textures; current and next pose are sampled from shared atlases.
- Cross-fades between widely different silhouettes may ghost. Large transitions must be timed behind a foreground pass, fog gate or directional wipe, and visual QA must inspect intermediate frames.
- Procedural density can increase CPU/GPU startup cost. Construction must be tiered, seeded and instanced, with optional post-processing removed before core world/actor clarity.
- A far-world plate greatly increases perceived detail without increasing geometry, but its viewpoint is finite. Chapter framing may use restrained scale/translation only; foreground 3D motion must preserve the illusion of one world rather than expose it as a slideshow.
- Generated pose identity and alpha edges require explicit technical and provenance checks. They remain provisional until generation terms are recorded.
- Portrait pages become roughly 18% longer because each chapter reserves a collision-free actor stage. This is accepted in exchange for complete, legible actions and a single current-theme atlas request instead of an overlaid character or duplicate CSS/TextureLoader transfers.

## Validation status

The direction, runtime integration and deterministic asset pipelines are complete. The 2026-08-28 local verification recorded in [`observatory-verification-2026-08-28.md`](../research/observatory-verification-2026-08-28.md) includes static analysis, unit/browser suites, production build, responsive visual review and a SwiftShader performance regression pass. Public release remains Stop-Ship for the unresolved source-rights entries in the asset ledger; local verification does not clear that gate.
