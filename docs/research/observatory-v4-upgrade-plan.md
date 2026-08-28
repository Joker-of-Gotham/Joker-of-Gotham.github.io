# Lunar Signal Observatory V4 — homepage upgrade blueprint

Date: 2026-08-28  
Design status: Approved baseline; implementation and verification in progress

## 1. North star

The homepage is not a themed hero with effects. It is one continuous lunar signal observatory in which the visitor travels from reception to observation, structure, orchestration, embodiment and archive afterlight.

The visual contract is:

> Monumental lunar engineering, quiet anime humanity, disciplined scientific instrumentation.

Realism comes from coherent scale, materials, lighting, depth and camera blocking—not from stacking bloom, glitch, noise and particles. The character supplies intimacy; the observatory supplies scale; the DOM supplies meaning.

## 2. System boundaries

| Layer | Owner | What it renders | What it must never own |
|---|---|---|---|
| Macro world | one Three.js renderer | sky, celestial body, lunar terrain, boulders, observatory structures, light route, fog, live guide | article text, navigation, SEO |
| Instrument layer | one lazy Canvas UI Magnify instance | local scanner/HUD over the primary signal window | full-page background, character, every card |
| Semantic layer | Astro/DOM | headings, links, project/archive data, audio/theme controls, captions | fake rasterized UI inside WebGL |
| Recovery layer | responsive images/CSS | loading, Reduced Motion, Save-Data, no-WebGL, context loss | live-ready visual detail |

## 3. Six-chapter shot design

| Chapter | Camera and reveal | World landmark | Guide choreography | Material/light cue |
|---|---|---|---|---|
| Signal Gate | low, slightly wide arrival shot; gate occludes the route before opening the vista | signal arch, beacon, near boulders | palm presentation, direct gaze | violet beacon against nearly black regolith |
| Observe | slower lateral drift; dish rim crosses foreground | hero radio dish and layered array | head/eye tracking, raised pointing hand | blue lunar key light, brushed metal, restrained signal rim |
| Structure | camera rises and lengthens focal distance | orbital lattice, maintenance pods, solar membrane field | profile step and upward indication | hard metal highlights, long structural shadows |
| Orchestrate | city terraces reveal in depth, not as card grid | observatory city, service bridge, window bands | open-arm presentation, weight shift | warmer gold service lights balanced by blue orbit light |
| Embodiment | camera compresses through a darker relay canyon | cable trunks, canyon infrastructure, near rock occlusion | quick turn, gait and hair/skirt lag | rose afterlight begins to enter, fog grows denser |
| Archive Afterlight | wide final basin, then quiet settle | archive dome, concourse ring and signal windows | shoulders settle, gaze returns to visitor | rose/gold afterlight, sparse bloom only on energy elements |

No chapter swaps the whole scene. Each chapter changes camera route, look target, FOV, roll, fog and authored intensity values inside one fixed world.

## 4. World construction

### 4.1 Sky and celestial anchor

- Use an opaque back-side sky dome so the live canvas is visually complete without a plate.
- Zenith, horizon, lunar limb and afterlight are shader uniforms driven by semantic palette tokens.
- The celestial body uses displaced sphere geometry with strata and crater bands, high roughness and a restrained emissive limb.
- Future authored upgrade: one self-owned 8–16K lunar albedo/normal/roughness set, transcoded to KTX2; never a full-screen background photograph.

### 4.2 Terrain and regolith

- One continuous 300–500 unit route with deterministic ridged FBM, crater depressions, canyon, path and platform masks.
- Opaque vertex-colored PBR terrain writes depth and receives the same world lights as structures and character.
- Instanced irregular boulders provide foreground occlusion and scale. Near-camera rocks should be larger, asymmetrical and partially cropped.
- Next realism pass: tileable self-authored regolith normal/roughness textures, triplanar projection, contact shadows and quality-tiered displacement.

### 4.3 Observatory kit

- Hero objects need recognizable silhouettes: dish bowl + receiver + tracking pivot; orbital ring + truss + maintenance pod; city terrace + mast + window band; archive dome + ribs + concourse.
- Primitive geometry is allowed only as a construction unit. A visible landmark must combine multiple parts and material roles.
- Repeated dishes, towers, boulders, trusses, windows and maintenance lights use instancing.
- Structural metal and solar membranes are opaque and depth-writing. Signal/afterlight surfaces are the exception and may glow.
- Future authored assets should be modular GLB kits, not one monolithic scene: `dish_hero`, `truss_module`, `city_terrace`, `relay_cable`, `archive_dome`, each with LOD0/1/2 and a provenance record.

### 4.4 Lighting and post-processing

- ACES Filmic tone mapping remains the color transform.
- Hemisphere fill establishes readable silhouettes; lunar directional light establishes form; localized point lights identify Signal Gate and Afterlight.
- Bloom is enhanced-tier only and limited to beacon, window bands, energy rails, orbital ridge and archive well.
- Do not add global chromatic aberration, depth of field, film grain and glitch simultaneously. The camera should feel expensive because the scene is blocked well, not because the image is degraded.

## 5. Volumetric guide

### 5.1 Identity

The guide remains the same clearly adult original woman: dark medium-long hair, feminine academy-inspired observatory uniform, short pleated skirt, near-knee stockings, leather shoes, crescent badge and a handheld signal orb. Dark and light themes change materials, not identity or body structure.

### 5.2 Current V2 construction

- Articulated joint hierarchy with actual shoulder/elbow/wrist and hip/knee/ankle pivots.
- Volumetric face, eyes, hair crown/locks/fringe, torso, collar, bow, skirt and pleats.
- Opaque PBR body surfaces; transparent/emissive treatment only for the halo, orbit and orb.
- Pointer input affects bounded head/eye aim. Scroll progress changes authored chapter poses. Breathing, gait and cloth/hair response remain secondary.
- Desktop live mode loads no character images. Portrait/static modes continue using the aligned atlas and poster.

### 5.3 V3 authored-character path

If a studio-quality model is commissioned, use this asset path:

1. Produce turnaround sheets from the existing identity: front, side, back, facial expressions, uniform detail and color keys.
2. Model in Blender with clean deformation topology; separate hair cards/locks and cloth where secondary motion is needed.
3. Rig humanoid skeleton plus hair/skirt spring chains; author idle, observe, point, present, turn, walk and settle clips.
4. Export glTF with meters, consistent forward axis and named animation clips.
5. Bake 1–2K albedo, normal, ORM and emissive textures; encode KTX2; apply Meshopt/Draco where visual QA permits.
6. Supply desktop LOD0/LOD1, low-tier LOD2 and poster renders from the same camera/identity.
7. Record author, license, source file, export settings, texture hashes and review status in the asset ledger.

Until that pipeline exists, V2 should be described as a procedural volumetric character, not a photoreal digital human.

## 6. Canvas UI usage

The official Vanilla Magnify component is suitable because it keeps the DOM interactive and its loop sleeps when settled. Its HTML-in-canvas path remains experimental, so the integration is deliberately narrow.

- One instance: the first Afterlight signal window.
- Lazy boundary: dynamic import only on first fine-pointer entry.
- No ripples and no scroll zoom; restrained reticle, grid, readout, aberration and haze.
- Disabled for Reduced Motion, Save-Data, coarse pointer and missing WebGL2.
- The signal image/link remains ordinary DOM in fallback browsers.
- No Canvas UI component may become a global wrapper until browser support and profiling prove it safe.

## 7. Rendering-stability design

The original “move once, refresh once” feeling was a composition problem, not an intentional page reload.

The stable pipeline is:

```text
scroll/pointer/resize input
        ↓
coalesce latest pointer sample / settle resize burst
        ↓
apply final resize on one RAF; update timeline, joints, palette and cached bounds
        ↓
render with the same scene, renderer, context and canvas
```

Required invariants:

- No scroll handler constructs or disposes renderer/world/character.
- No pointer event calls `getBoundingClientRect()` per event.
- No unchanged width/height/DPR calls `renderer.setSize()`.
- Automatic quality lowering must not resize the full-screen drawing buffer; a lower DPR cap is picked up by the next genuine viewport resize.
- One state writer owns active chapter in live mode.
- Ready state performs no full-screen plate transform/filter changes.
- WebGL context loss produces a static recovery surface, not a blank page.

## 8. Performance budgets

| Budget | Enhanced desktop | Standard desktop | Low/mobile live |
|---|---:|---:|---:|
| Target frame cadence | 60 fps | 45–60 fps | 30 fps |
| Capped DPR | ≤ 1.75 | ≤ 1.5 | ≤ 1.15 |
| Main world renderer | 1 | 1 | 1 |
| Additional WebGL contexts | 0 until lens interaction; then 1 local | same | 0 |
| Draw-call direction | < 120 | < 90 | < 65 |
| Character live textures | 0 | 0 | portrait fallback only |
| Continuous post-processing | selective bloom | off unless budget permits | off |
| Context/renderer recreation on scroll | 0 | 0 | 0 |

Automatic quality lowering stays valid when measured frame time degrades. It hides high-detail accessories and lowers instance counts before removing narrative landmarks.

## 9. Responsive and accessible equivalents

- Desktop/landscape: live macro world + volumetric guide.
- Portrait ≤ 820 px: live world where safe, in-flow pose stage for a guaranteed text-safe character silhouette.
- Reduced Motion and Save-Data: compact world plate, poster/in-flow guide, no controller and no Canvas UI context.
- No JavaScript: all six chapters, headings, links, captions and static visual hierarchy remain present.
- Canvas never contains the only copy of a label, link or action. Focus, captions, alt text, theme and audio state remain DOM semantics.

## 10. Next upgrade backlog

### P0 — release gate

- Verify dark/light live frames at 0/25/50/75/100% route progress.
- Inspect avatar silhouette, face, hand/orb placement and text collision at 1366×768, 1440×1000 and ultrawide.
- Confirm plate opacity is zero and no runtime atlas requests occur in desktop live mode.
- Record steady-state FPS, long tasks, context count and resize count on one integrated-GPU laptop and one mid-tier phone.

### P1 — realism

- Add self-authored regolith normal/roughness textures and triplanar terrain shading.
- Add contact shadow/decal treatment beneath guide, dishes and large boulders.
- Replace remaining generic tower blocks with three authored modular silhouettes.
- Add near-camera LOD rocks/cables specifically placed to hide chapter transition seams.

### P2 — authored assets

- Commission the Blender/glTF character package and animation set.
- Produce modular observatory GLBs with KTX2 and LODs.
- Add GPU timing/telemetry overlay behind a developer-only flag.
- Evaluate one more Canvas UI instrument only after the single-lens context and frame budget remain healthy.

## 11. Primary references

- Three.js examples: https://threejs.org/examples/
- Three.js glTF loader example: https://threejs.org/examples/#webgl_loader_gltf
- Three.js skinning/blending example: https://threejs.org/examples/#webgl_animation_skinning_blending
- Three.js Unreal Bloom example: https://threejs.org/examples/#webgl_postprocessing_unreal_bloom
- Canvas UI repository and license: https://github.com/DavidHDev/canvas-ui
- Canvas UI Magnify documentation: https://canvasui.dev/docs/components/magnify
