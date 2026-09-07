# Selene Meridian reference study — 2026-08-29

## 1. Purpose and evidence rules

This study records what was **actually visible** in the captured reference pages and translates those observations into an original Selene Meridian design language. It is not a request to reproduce another studio's scene, layout, assets, typeface, shader, source code or narrative.

Evidence used:

- browser captures stored in [`artifacts/reference-study-2026-08-29`](../../artifacts/reference-study-2026-08-29/);
- the live public pages at [Garden Eight](https://garden-eight.com/), [Unseen Studio](https://unseen.co/), [Lusion](https://lusion.co/), [A Long-Expected Party](https://mengto.github.io/a-long-expected-party/) and [Kage](https://mengto.github.io/kage/);
- one Lusion image exposed by the site's public social-preview metadata. It is explicitly treated as a promotional still, not a browser or scroll capture.

Evidence confidence:

- **High** — 1280 × 720 browser captures from Garden Eight and Unseen, plus the Party entry and first chapter.
- **Medium** — Party later-state captures at 598 px width/height variants; they demonstrate a changed rendered state but do not prove desktop responsive composition.
- **Medium** — Kage captures at 583 × 839; they support portrait composition observations only.
- **Limited** — Lusion's in-app-browser canvas could not be captured after three attempts. The archived social preview supports colour, object-family and still-composition observations only. It does not support claims about camera motion, scrolling or page transitions.

## 2. Reference material table

### 2.1 Garden Eight

Representative capture:

![Garden Eight hero: ivory sculpture field behind oversized editorial type](../../artifacts/reference-study-2026-08-29/garden-eight-loaded.png)

| Dimension | Screenshot-grounded observation | Selene Meridian translation | Originality boundary |
| --- | --- | --- | --- |
| Pages / captures | [`garden-eight-loaded.png`](../../artifacts/reference-study-2026-08-29/garden-eight-loaded.png), [`garden-eight-mid.png`](../../artifacts/reference-study-2026-08-29/garden-eight-mid.png), [`garden-eight-deep.png`](../../artifacts/reference-study-2026-08-29/garden-eight-deep.png). `garden-eight-top.png` is a loader, not a designed content state. | Preserve separate loading evidence; judge the live Selene world only after assets and shaders report ready. | Do not use a loading frame as proof of the final visual result. |
| Scene construction | The hero uses many related ivory sculptural forms, cropped at the viewport edges and overlapped across depth. The middle capture deliberately releases almost the whole viewport into negative space while one fragment remains at the upper edge. The later capture replaces the large scene with an editorial field punctuated by small circular image windows. | Build Selene from a **family** of related observatory parts rather than unrelated boxes: repeated ribs, pressure collars, recessed windows, conduits and service fixtures, varied in scale/orientation and staged in foreground, district and horizon layers. Give at least one chapter a genuine low-density breathing shot instead of filling every frame equally. | Do not copy the animal/organic sculptures, circular case thumbnails, exact page sequence or their arrangement. |
| Light / material / colour | Visible palette is tightly constrained to warm ivory, soft beige shadow and near-black type. Broad soft shading and contact shadow reveal the forms even though their albedo is similar. | Use a narrow lunar material family: cool regolith, warm structural ceramic, graphite metal and one signal accent. Separate objects through roughness, normal detail, edge light and contact shadow rather than a new hue per mesh. | Do not reproduce the exact ivory treatment or imply access to Garden Eight's material/shader implementation. The screenshots show appearance, not implementation. |
| Camera / scroll | The captures show a designed alternation of full, cropped mass and almost empty field. The evidence does not establish the site's internal camera technique. | Author chapter shots by silhouette and occupancy: one dense entry, one lateral reveal, one negative-space observation deck, one deep infrastructural canyon, one intimate service court and one horizon release. | Do not claim a particular Garden Eight camera or WebGL method from still captures. |
| DOM text inside the world | Oversized custom display type is the primary foreground plane and intentionally overlaps the sculpture field. Small navigation remains quiet at the top edge. In the mid state, one short sentence occupies a large empty zone with no card. | Let Selene headings enter the render as an editorial depth plane. Use a bounded local gradient behind copy only where needed; remove large frosted rectangles that turn the world into wallpaper. Keep utility navigation compact and outside the dominant silhouette. | Do not copy the display typeface, wording, line breaks, navigation labels or exact typographic scale. |
| What makes it feel resolved | A small number of rules are repeated consistently: one object family, one colour family, decisive cropping, an extreme type hierarchy and intentional empty space. | Prefer coherent repetition and composition over adding disconnected “detail objects”. A detail is valid only if it belongs to the observatory construction system or improves depth/scale. | No extraction or reuse of imagery, models, CSS, fonts or source code. |

### 2.2 Unseen Studio

Representative capture:

![Unseen Studio hero: a pink flooded architectural room with arches, stairs, rocks and integrated headline](../../artifacts/reference-study-2026-08-29/unseen-scene-top.png)

| Dimension | Screenshot-grounded observation | Selene Meridian translation | Originality boundary |
| --- | --- | --- | --- |
| Pages / captures | [`unseen-top.png`](../../artifacts/reference-study-2026-08-29/unseen-top.png) is an audio-entry gate. [`unseen-scene-top.png`](../../artifacts/reference-study-2026-08-29/unseen-scene-top.png), [`unseen-mid.png`](../../artifacts/reference-study-2026-08-29/unseen-mid.png) and [`unseen-deep.png`](../../artifacts/reference-study-2026-08-29/unseen-deep.png) show the live hero. `unseen-projects.png` remained at the entry gate and is not evidence for the projects page. | Keep any Selene audio opt-in explicit and independent from world initialization. Do not count a blocked route as reviewed. | Do not infer pages or states that were not captured. |
| Scene construction | The visible room is geometrically simple but composed as a place: large arches, a stair, tall openings, a raised platform, a shallow flooded floor, three rocks and one sphere. Foreground water, middle architecture and exterior landscape create clear depth. | Replace isolated primitive monuments with functional ensembles: threshold + stair/ramp + recessed doorway + occupied interior light + service object + surrounding terrain. Add a restrained reflective or polished service surface only where it explains the facility, rather than covering every chapter in gloss. | Do not duplicate the flooded pink room, arch proportions, stair layout, rocks or sphere. |
| Light / material / colour | A pink-beige wash unifies wall, sky and water; blue/lilac highlights appear in openings and reflection. The water produces a second, moving image of the architecture. Rock roughness contrasts with smooth plaster and liquid. Visible grain/softness keeps the render from looking clinically synthetic. | Give each Selene shot one dominant temperature and one subordinate signal temperature. Use rough regolith against smoother pressure shells and reflective glazing. Reserve grain, bloom and chromatic softness for a subtle final layer, with text kept optically sharp. | Do not copy the exact pink palette or post-processing signature. A still cannot prove which effects or render passes were used. |
| Camera / scroll | The three live captures are materially similar; the capture session did not expose a reliable later scroll state. The hero camera is front-facing with strong one-point architectural depth and a low water foreground. | Use authored camera anchors that show a readable approach axis and clear foreground/middle/background separation. Do not cite Unseen as evidence for a specific scroll transition. | No unsupported claims about their scroll system. |
| DOM text inside the world | The centred headline mixes italic serif and sans, spanning the stair/sphere zone without an opaque card. A small eyebrow and compact pill CTA sit within the same composition. Navigation is pinned to clear wall/sky areas. | Combine Selene's chapter label, display line and technical metadata as one typographic composition. Allocate a “copy quiet zone” in each camera shot, then use only a soft local luminance scrim if contrast falls below target. | Do not reproduce the headline, mixed-font lockup, logo, button or exact centre placement. |
| What makes it feel resolved | The image is not detailed because of polygon count alone; it is resolved because architecture, natural objects, liquid, palette, reflections and type all support one visual premise. | Every Selene chapter should contain one structural landmark, one scale cue, one surface contrast, one environmental cue and one safe typographic zone. | No extraction or reuse of models, textures, shaders, audio or site code. |

### 2.3 Lusion

Evidence still:

![Lusion public social preview: a blue, black and white field of repeated pipe junctions](../../artifacts/reference-study-2026-08-29/lusion-official-social-preview.jpg)

| Dimension | Evidence-grounded observation | Selene Meridian translation | Originality boundary |
| --- | --- | --- | --- |
| Page / evidence type | The live page exposed a canvas-led structure and the headline “We create 3D visual storytelling…”, but its canvas failed in-app-browser screenshots on three attempts. [`lusion-official-social-preview.jpg`](../../artifacts/reference-study-2026-08-29/lusion-official-social-preview.jpg) is the page's public OG/social-preview image, **not** a live browser capture. | Keep Lusion out of scroll, motion and responsive scoring until a compatible browser capture or recording exists. | Never present the social preview as proof of live behaviour. |
| Still scene construction | The preview fills the frame with one repeated T-junction/tube family. Rotation, scale, cropping and occlusion create density; the frame has no unrelated decorative object vocabulary. | Derive Selene detail from a reusable industrial grammar—pressure junctions, collars, trusses and cable trunks—then vary scale and orientation. Dense areas should read as systems, not as a collection of novel primitives. | Do not copy the junction model, exact pile, crosshair marks or image composition. |
| Light / material / colour | The visible script is saturated electric blue, black, white and deep navy. Strong soft highlights describe rounded surfaces; near-black cavities give the objects internal depth. | Use Selene's accent colour in repeated, small service/signal components and interior recesses, while primary architecture stays in two restrained material families. Ensure windows and apertures have actual dark depth instead of a flat decal. | Do not reproduce Lusion blue/black/white values or their surface/shader recipe. |
| Camera / scroll | No valid capture. The social still supports only a tightly cropped, shallow layered composition. | No Selene motion decision is attributed to Lusion. A future reference pass must capture at least hero, one transition and one project state before any motion mapping. | No inference from a static OG image. |
| DOM text inside the world | In the preview, the central white wordmark sits over a relatively dark/blue safe zone and remains unboxed; four thin crosses are secondary. This is promotional-image composition, not confirmed live DOM. | Keep Selene's dominant title unboxed where the shot provides a luminance-safe zone; technical marks remain secondary and sparse. | Do not copy the wordmark treatment, cross marks or centred arrangement. |

### 2.4 A Long-Expected Party

Representative captures:

![A Long-Expected Party chapter frame: layered misty terrain and restrained title overlay](../../artifacts/reference-study-2026-08-29/party-chapter-1.png)

| Dimension | Screenshot-grounded observation | Selene Meridian translation | Originality boundary |
| --- | --- | --- | --- |
| Pages / captures | [`party-top.png`](../../artifacts/reference-study-2026-08-29/party-top.png), [`party-chapter-1.png`](../../artifacts/reference-study-2026-08-29/party-chapter-1.png), [`party-later-1.png`](../../artifacts/reference-study-2026-08-29/party-later-1.png), [`party-later-2.png`](../../artifacts/reference-study-2026-08-29/party-later-2.png). Later captures use a narrower 598 px viewport, so they prove a changed scene/time state but not desktop composition. | Capture Selene chapter anchors at one stable viewport for direct comparison, then run separate tablet/phone matrices. | Do not mix viewport changes with progress changes when claiming continuity. |
| Scene construction | Layered rolling terrain repeats a limited tree family with scale/spacing variation. Mist separates ridges. Tiny lights/particles create life and scale without competing with the terrain. Later states reveal warmer daylight and more saturated foliage over the same landscape language. | Shape Selene terrain as broad continuous masses with foreground berms, route cuts and distant ridges. Repeat a small number of infrastructure and rock families with deterministic variation. Make chapter change legible through viewpoint, lighting and district emphasis—not scene replacement. | Do not copy the Shire-like landscape, tree assets, story references, generated soundscape or exact terrain. |
| Light / material / colour | The first chapter uses cool desaturated blue-grey and fog; later captures shift towards peach sky, green terrain and warm canopy highlights. Atmospheric perspective is the main depth cue. | Build a restrained lunar time/weather arc: cold entry, signal-lit survey, warmer inhabited service zone, and quiet terminal horizon. Change fog colour/density and practical-light emphasis gradually while preserving the underlying world. | Do not reproduce the specific pastoral palette progression or cinematic grading. |
| Camera / scroll / time | The visible scene is letterboxed and treated like a procedural film. A bottom timeline, time readout and chapter label establish temporal progression. The camera looks across overlapping terrain rather than orbiting one centrepiece. | Direct Selene as a route through one campus: camera and look splines should reveal new occlusion layers. Progress UI may indicate chapter position, but it must not imitate the film-player chrome. | Do not copy the player controls, timeline design, chapter naming or soundtrack interaction. |
| DOM text inside the world | Entry and chapter titles use restrained serif type, small uppercase metadata and minimal italic copy. Text is centred over a low-detail mist field; no large panel blocks the render. Controls occupy the black letterbox, not the scenic image. | Place Selene text over authored quiet zones or dedicated edge bands. Move dense utility data away from landmark silhouettes; avoid a universal glass card. | Do not copy typefaces, literary wording, letterbox dimensions or title hierarchy verbatim. |
| What makes it feel resolved | Repeated vegetation, terrain undulation, fog layers, time-of-day change and a film-like interface turn a generated landscape into a continuous journey. | Continuity must be visible at chapter boundaries: a landmark from the previous shot should survive in the far or side plane of the next shot when feasible. | No reuse of copyrighted narrative setting, art, audio, models, textures or source implementation. |

### 2.5 Kage

Representative capture:

![Kage portrait capture: temple, moon, gate, vegetation, lanterns, red foliage and oversized title share one composition](../../artifacts/reference-study-2026-08-29/kage-chapter.png)

| Dimension | Screenshot-grounded observation | Selene Meridian translation | Originality boundary |
| --- | --- | --- | --- |
| Pages / captures | [`kage-top.png`](../../artifacts/reference-study-2026-08-29/kage-top.png), [`kage-mid-1.png`](../../artifacts/reference-study-2026-08-29/kage-mid-1.png), [`kage-mid-2.png`](../../artifacts/reference-study-2026-08-29/kage-mid-2.png), [`kage-chapter.png`](../../artifacts/reference-study-2026-08-29/kage-chapter.png), [`kage-after-page.png`](../../artifacts/reference-study-2026-08-29/kage-after-page.png). All are 583 × 839 portrait captures and remain near the opening composition; leaves/particles and some overlay state vary. | Treat the evidence as a portrait-layout study. Validate Selene desktop composition independently. | Do not claim later Kage chapters or desktop behaviour were reviewed. |
| Scene construction | The frame layers red leaves and dark vegetation in front, a gate/stair in the middle, a multi-tier temple and warm windows behind, then a large moon and black sky. Grass, lantern repetition, a path and architectural eaves supply scale and route. The scene is dense but the object families are coherent. | Give each Selene district: foreground terrain/equipment silhouette, a route threshold, a middle landmark, occupied light apertures and a distant celestial/horizon anchor. Repeat fixtures and rails to imply a maintained campus. Add details where construction logic demands them: joints, recesses, access, drainage, lighting and service paths. | Do not copy the Kyoto setting, temple, torii/gate, lanterns, moon placement, red foliage, title, Japanese labels or chapter taxonomy. |
| Light / material / colour | Visible palette is near-black/blue-black, warm amber windows, muted lunar red and sparse vivid leaf red. Grain is visibly present across the frame; it may be a render or page layer, but the capture does not reveal the implementation. | Use a Selene-specific triad: graphite/cold mineral base, warm inhabited apertures and one restrained signal accent. Keep bloom limited to emissive fixtures; use fine grain only if it survives readability and performance review. | Do not clone Kage's black/red/amber values, grain character or lighting ratios. |
| Camera / scroll | The captured composition reads as a deep frontal approach: stairs/gate establish a route to the temple, while moon and eaves make a strong vertical stack. Captures do not establish full scroll choreography. | Build a clear approach axis into selected Selene shots—ramp, bridge or trench leading towards a functional landmark—then vary direction in other chapters so the route does not become six frontal façades. | Do not infer or copy unseen transitions. |
| DOM text inside the world | Upper-left chapter text occupies a dark sky area; oversized “KAGE” crosses the architectural middle plane; vertical script uses the right margin; four small chapter summaries sit over the dark lower terrain. There is no opaque full-width card. Strong luminance separation keeps the composition legible despite overlap. | Define three z-like editorial planes for Selene: small metadata on quiet sky, chapter title across a controlled mid-plane, and supporting copy inside a bounded edge gradient. Allow intentional overlap only when the landmark silhouette and title remain independently readable. | Do not copy the title scale/placement, vertical Japanese typography or 01–04 grid. |
| What makes it feel resolved | Richness comes from layered depth, repeated vegetation/fixtures, a decisive route, warm signs of occupation, one colour script and typography composed with the scene—not from unrelated decorative geometry. | Replace “more primitives” with “more evidence of a lived observatory”: access doors, pressure seams, maintenance rails, lit interiors, conduits, antenna service equipment, regolith accumulation and route wear. | No reuse of Kage assets, code, shader logic, prompts, visual identity or narrative. |

## 3. Cross-site design grammar for Selene Meridian

The references differ stylistically, but the captures support a common construction grammar:

1. **One premise governs every layer.** Garden Eight has ivory sculpture/editorial type; Unseen has a flooded pink architectural room; Party has procedural terrain/film time; Kage has a nocturnal temple route; Lusion's preview has one repeated pipe family. Selene's premise is an inhabited lunar meridian observatory campus—not “a collection of sci-fi objects”.
2. **A coherent family beats an isolated hero primitive.** Repetition gains sophistication through scale, orientation, cropping, function and depth variation. Selene therefore repeats pressure collars, ribs, rails, windows, conduits and service lights as a construction grammar.
3. **Five spatial layers are the minimum useful shot model.** Foreground silhouette/terrain; near route or threshold; middle landmark; distant district/ridge; atmosphere/celestial field. Not every layer needs equal contrast.
4. **Material contrast carries detail before colour does.** Rough mineral, ceramic pressure shell, graphite structure, dark aperture and warm emissive interior should remain distinguishable in monochrome thumbnails.
5. **Colour is scripted, not accumulated.** Each shot uses one dominant base temperature, one supporting material family and one sparse signal/inhabited accent. Theme switching changes exposure and surface response without turning the scene into an unrelated palette.
6. **Typography is a scene layer.** Text belongs in an authored quiet zone, controlled overlap plane or edge band. A local transparent gradient may protect contrast; a large opaque/frosted card should be an exception, not the default.
7. **Density has rhythm.** Dense hero silhouettes need adjacent breathing space. Six equally busy shots read as a demo reel rather than a narrative route.
8. **Continuity must be visible, not merely asserted in code.** Terrain, route direction and recurring landmarks should persist across adjacent chapter shots while light, fog, camera and district emphasis evolve.
9. **Environmental cues make geometry believable.** Accumulated dust, route wear, reflective glazing, dark recesses, warm occupied windows, vapour and sparse particles explain scale and use. They must be deterministic and quality-tiered.
10. **Motion is subordinate to composition.** Scroll updates target state; a single RAF evaluates camera/world state. Atmospheric motion may continue gently, while reduced-motion and low tiers preserve the composed still rather than deleting the world identity.

## 4. Selene-specific visual rules resulting from this study

| System | Rule for this implementation | Failure pattern it prevents |
| --- | --- | --- |
| Architecture | Every chapter landmark must combine a primary mass, an approach/threshold, a recessed aperture, a structural rhythm and at least one service system. | Standalone boxes, cones and rings that look like a geometry demo. |
| Detail | Secondary details must answer “how is it entered, supported, powered, maintained or observed?” | Random greebles and disconnected decoration. |
| Composition | Each of the six camera anchors gets a named foreground, middle landmark, horizon anchor and copy-safe zone. Adjacent shots retain at least one continuity cue when composition permits. | Fragmented scenes that appear to be rebuilt each section. |
| Colour | Graphite/cold mineral base + warm inhabited aperture + restrained signal accent. No chapter-specific rainbow palettes. | Buildings that appear unrelated or visually abrupt. |
| Materials | PBR surface differences must remain visible without bloom: rough regolith, semi-matte shell, darker metal, glass/dark cavity and emissive fixture. | Flat colour primitives and bloom-dependent form. |
| Lighting | One celestial key establishes direction; practical lights explain doors, routes and occupied interiors; fill is restrained. | Uniform ambient wash or multiple unmotivated coloured lights. |
| Atmosphere | Fog separates distance layers; particles provide scale and weather, with count/draw range degradation by tier. | Noise layers that flatten the frame or overload low-end devices. |
| Editorial UI | No universal chapter card. Use transparent layout, bounded scrim and concise technical metadata; keep landmark and actor silhouettes out of primary copy zones. | Text pasted over the world or a large panel obscuring it. |
| Character | The approved two-tone raster poses remain an editorial foreground layer with chapter-specific action and shrink/swap/grow transitions. | Returning to an unapproved generic 3D character. |
| Motion / runtime | One persistent scene and canvas; scroll writes state only; RAF renders; offscreen/hidden pauses; resume does not recreate the world; unload fully disposes. | The reported “every movement refreshes once” failure. |

## 5. Verifiable acceptance items for this round

These are review gates, not assumed results:

### Visual composition

- Capture all six settled chapter anchors at a fixed 1440 × 900 desktop viewport, then capture representative tablet and phone states separately.
- At thumbnail size, every chapter must have a distinguishable silhouette and one identifiable functional landmark; no two chapters may read as the same box cluster from a slightly changed angle.
- In each desktop capture, verify foreground, middle and distant depth cues. At least four of six shots should show all five spatial layers; the remaining shots may deliberately use negative space.
- Verify that large copy uses a local transparent scrim or an authored quiet zone. Reject any opaque/frosted block that covers the central scenic image without a specific reason.
- Verify that warm practical lights are attached to visible apertures, routes or equipment—not floating ornaments.
- Verify light and dark themes independently; light theme must retain surface separation without becoming a low-contrast white wash.

### Continuity and motion

- Across a full-page scroll, `sceneId`, canvas generation and WebGL context identity stay unchanged through all six chapters.
- Scroll handlers only update target state; rendering and camera interpolation occur in RAF.
- Repeated transitions are reversible, with no visible scene flash, poster reappearance or chapter-specific world asset request.
- The character's current pose shrinks away before the next decoded pose grows in; no simultaneous double-exposure at the settled chapter anchor.
- Hidden/offscreen state pauses animation; visible state resumes the same scene. Reduced Motion and Save-Data keep semantic content and a composed visual fallback.

### Material and performance evidence

- Capture the ready state only after PBR texture and HDR environment diagnostics report their final state; record partial/fallback states separately.
- Report draw calls, triangles, texture memory/transfer, DPR, RAF frame cadence and long tasks for desktop, tablet and phone profiles.
- Tier changes must not compile a new material/light variant during active scroll. Particle and distant-detail degradation must use preallocated buffers/draw ranges or visibility/count changes.
- Treat a multi-second long task, repeated context/canvas generation, new chapter world-asset requests, or a scroll-coupled resize/rebuild as stop-ship.
- Publish remaining limitations explicitly. Lusion motion comparison remains a known research limitation until a valid live capture is available.

## 6. Decision summary

The target is not to make Selene “look like” any one reference. The actionable alignment is structural:

- Garden Eight contributes **family coherence, decisive typography and density/negative-space rhythm**.
- Unseen contributes **place-making through architecture + natural/surface contrast + unboxed copy**.
- Lusion's limited still contributes **object-family repetition, controlled tri-colour composition and aperture depth**, but no motion evidence.
- A Long-Expected Party contributes **persistent landscape continuity, atmospheric depth and a time-directed route**.
- Kage contributes **five-layer depth, signs of occupation, a strict accent script and typography composed as part of the scene**.

Selene Meridian should therefore become a continuous, inhabited lunar campus whose richness is legible through construction logic, material response, light motivation, route continuity and editorial composition. Merely increasing the number of primitives would not satisfy this study.
