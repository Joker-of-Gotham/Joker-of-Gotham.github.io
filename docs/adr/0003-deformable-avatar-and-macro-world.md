# ADR-0003: Deformable avatar and concrete macro-world

- **Status**: Superseded in part by ADR-0004
- **Decision date**: 2026-08-28
- **Owner**: Joker-of-Gotham
- **DRI**: Blog frontend upgrade task
- **Risk / quality**: S2 / target QA-L3
- **Supersedes**: ADR-0001 particle-avatar representation only
- **Related**: [`DESIGN.md`](../../DESIGN.md), [`ADR-0001`](./0001-lunar-observatory-rendering.md), [`ADR-0004`](./0004-continuous-world-and-multi-pose-actor.md), [`docs/asset-provenance.md`](../asset-provenance.md)

## Context

Visual review established that reconstructing the observatory character from sparse points sacrifices the face, uniform, silhouette, and emotional expression that make the character valuable. The owner therefore rejected particles as the character medium and requested a clear animated 3D or Live2D-like character plus a more concrete, monumental world comparable in spatial ambition—not copied assets or code—to cinematic WebGL portfolios.

The repository currently has two matched, transparent, original-direction raster masters, but it does not have a layered Cubism model, `.model3.json`, GLB rig, motion files, or reviewed runtime license for those ecosystems. Acquiring an unrelated third-party anime model would create identity and provenance drift and is outside the approved asset boundary.

## Decision

Use a project-authored **Three.js 2.5D deformable character rig** for the current implementation:

1. map the matched dark/light transparent artwork to aligned subdivided meshes;
2. deform vertices with bounded breathing, weight shift, hair/skirt lag, micro-turn and gaze fields;
3. cross-fade themes on the same anchor and pose instead of dissolving into points;
4. drive pose, position, scale and facing from the same six-chapter timeline as the camera;
5. retain responsive raster Posters when motion, data, GPU capability or context state requires fallback.

This is not Cubism Live2D and not a fully volumetric humanoid. Product copy and code comments must call it a 2.5D/deformable rig. A future legal, layered `.model3.json` or GLB asset may replace the rig behind the controller boundary after a separate dependency/provenance decision.

The shared world becomes a continuous concrete environment with procedural geometry only: lunar terrain, a distant planetary body, observatory architecture, orbital rings/megastucture, light transit paths and a cyber-geological canyon. Chapters interpolate visibility, material energy, fog, camera targets and character pose within one world; they do not mount separate renderers or hijack native scroll.

Environmental particles remain permitted at low density for air, dust and scale. They may not form the character.

## Content-plane decision

Closed cards are no longer the default spatial unit. Homepage and archive surfaces prefer open composition, shared backgrounds, partial rails, masks, typographic hierarchy and local edge light. Full borders remain only where an object needs explicit containment, scrolling, selection or dialog semantics. No view may contain more than three visually closed nested layers.

## Consequences and gates

- Character artwork remains legible and thematically consistent, but deformation cannot create genuinely new limb poses from a single flattened source.
- The world gains recognizable scale without new external model provenance; procedural geometry must stay within tier budgets.
- The renderer still initializes only after first-paint opportunity and must pause/dispose/recover exactly as ADR-0001 requires.
- Poster, reduced-motion, Save-Data, no-WebGL, context-loss and semantic DOM paths remain equivalent.
- True Live2D or authored GLB adoption requires model files, author/rightsholder evidence, runtime-license review, motion/accessibility review and a new or amended ADR.
- Release remains Stop-Ship for unresolved raster-source and anime-image provenance recorded in the asset ledger.

## Validation status

The decision is approved. Implementation and final visual/performance evidence are not complete until the verification report records actual results; unexecuted device behavior remains **unverified**.
