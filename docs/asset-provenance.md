# Asset provenance ledger

> Status: Conditional Go by Owner/DRI rights attestation · 2026-08-28<br>
> Owner: Joker-of-Gotham<br>
> Scope of this pass: generated observatory avatar concepts, original world plates, and existing anime hero / cover imagery

This ledger records where a visual came from, what rights evidence exists, how it was transformed, and whether it may ship. Keeping an asset in the design is not evidence that it is licensed. Repository filenames, web pages, comments, and model output are untrusted metadata until corroborated.

## Owner release authorization record

On 2026-08-28, Owner/DRI `Joker-of-Gotham` explicitly confirmed that all images in the release have obtained authorization and directed the release candidate to be pushed to `origin/main`. For this release, that attestation covers the generated avatar and world imagery, profile imagery, anime hero and cover imagery, roadmap/article imagery, legacy repository images, and their optimized derivatives. The silent `about-signal-loop.mp4` is treated as a motion derivative covered by the authorization for its source visual.

The underlying contracts, license files, purchase records, or rightsholder correspondence were not supplied to or independently inspected by the agent. They remain in the Owner's custody. The release decision is therefore `OWNER_ATTESTED`, not an independent legal conclusion. This record supersedes the earlier `PROVISIONAL` and `UNRESOLVED` release treatment for current visual assets while retaining the original audit rows below for traceability.

Release decision: **Conditional Go for the current `main` push**. The Owner accepts responsibility for the accuracy and scope of the rights statement and for satisfying any private attribution or use conditions. Any newly added visual requires a new provenance review.

## Status vocabulary

| Status | Meaning | Release treatment |
|---|---|---|
| `APPROVED` | Origin and applicable license / permission are recorded and compatible | May ship within the recorded scope |
| `OWNER_ATTESTED` | Owner/DRI confirms that required rights and permissions are held; underlying evidence remains outside the repository and was not independently inspected | May ship within the expressly approved scope; legal accuracy remains the Owner's responsibility |
| `PROVISIONAL` | Origin is known but production preparation or rights review remains | Prototype only; resolve listed conditions before release |
| `UNRESOLVED` | Origin, license, permission, or attribution is missing | **Stop-Ship for a release containing the asset** |
| `REJECTED` | Known to be incompatible, unsafe, or out of scope | Must not ship |
| `SUPERSEDED` | Historical iteration retained only for traceability | Must not ship |

Every new entry should record: stable asset ID, repository path, source URL or generation record, creator / rightsholder when known, license or permission evidence, acquisition date, transformation history, SHA-256, intended use, status, reviewer, and resolution action.

## Generated avatar concepts

### Authoritative character references and auxiliary turnaround

The two original character masters below remain the authoritative identity references for the homepage guide. The generated turnaround is retained only as a design aid for unseen side/back construction in a future asset pass; it is not a runtime asset and is not an independent identity source.

| Role | Repository path and SHA-256 | Use in the custom model | Status |
|---|---|---|---|
| Dark-form identity master | `public/assets/img/observatory/signal-guide-dark.png`<br>`66148657B089CF3445957381F406CD10CB25FCFE822E2E0EBD6D1E545A91D1D7` · 1,182,200 bytes · RGBA 1024 × 1536 | Primary authority for the shared face/silhouette and dark blue-black/violet hair, dark academy outfit, stockings and loafers | `OWNER_ATTESTED` for this site release; generation-service evidence remains as recorded under `avatar-dark-master-04` |
| Light-form identity master | `public/assets/img/observatory/signal-guide-light.png`<br>`FB4EE7DB2BD895982A26167504B4AB627CE2919BF9389064A7008F2BA82D1EEA` · 1,132,267 bytes · RGBA 1024 × 1536 | Primary authority for the same geometry/silhouette with silver-white hair and light academy outfit treatment | `OWNER_ATTESTED` for this site release; generation-service evidence remains as recorded under `avatar-light-master-04` |
| Dual-theme turnaround reference | `assets-src/observatory/reference/dual-theme-guide-turnaround-reference.png`<br>`C23E3F53C75DE6CC8D65647B3C1DA312D067E1291E9F1407391524455D5D36D3` · 2,084,931 bytes | AI-generated front/profile/back/three-quarter construction aid derived from both masters; retained for later asset exploration. Any conflict is resolved in favor of the two masters above | `PROVISIONAL` design aid; not an independent identity source and not a runtime asset |

The following source files were created in the local Codex generated-image area during the user-directed design session on 2026-08-28. The generation tool produced original concept candidates under human direction; the exact backend model/version and downstream rights terms were not included in the tool output. The Owner's release authorization above confirms that the resulting imagery is authorized for this site release, while the unavailable service record remains an audit limitation. Only production masters and optimized runtime derivatives are stored in the repository; generated chroma sources remain outside it and are identified by path and hash.

Inspection confirmed that the selected dark and light outputs are **RGB 1024 × 1536 files without an alpha channel and with the apparent checkerboard baked into the pixels**. They are concept sources, not transparent production assets and not valid direct inputs for alpha-based particle sampling.

| ID | Local source and SHA-256 | Description | Status / action |
|---|---|---|---|
| `avatar-iteration-neutral-01` | Local generation record `exec-d18c79e7-7145-4ed8-94f2-236b19414871.png`<br>`59C3CE57BBF2E2A7A175619B7E79BCFFD8FCE55E64A419972486680FFACDCB8F` · 1,497,386 bytes | Adult dual-theme observatory character in the earlier neutral technical outfit | `SUPERSEDED`; retain outside repo for audit history only |
| `avatar-iteration-academy-02` | Local generation record `exec-88b2d414-c9a7-4dc6-8075-4810e42b5934.png`<br>`C6773C8BF659FDBFCB1D0AE9FF558916F34819159AEB7FFF21659D4D1A714FDF` · 1,818,834 bytes | Dual-theme academy-uniform direction; intermediate review sheet | `SUPERSEDED`; retain outside repo for audit history only |
| `avatar-dark-concept-03` | Local generation record `exec-3104c447-19de-448e-8084-a0e837e56da4.png`<br>`DAB6277205C03E4092539DB967B0DC17924D96AFE0428056C391170761D8C9AD` · 1,264,666 bytes | Selected dark-form adult academy observatory character | `PROVISIONAL`; create a clean transparent master, review edges/anatomy/uniform consistency, record final generator/terms, then hash the production export |
| `avatar-light-concept-03` | Local generation record `exec-078676c4-53f0-4846-b7dd-c9f8300e685b.png`<br>`0C7794280CB92F66574B7A663B2138450343C8F47A6607E6F51014DF266441FB` · 1,245,260 bytes | Selected light-form adult academy observatory character | `PROVISIONAL`; create a clean transparent master, align pose/crop with dark form, record final generator/terms, then hash the production export |

### Production avatar exports and runtime samples

The selected direction was regenerated on a flat chroma background, then converted deterministically with `scripts/extract-chroma-key.mjs` (Sharp) into true RGBA masters. `scripts/prepare-observatory-assets.mjs` creates the smaller lossless WebP textures used by the deformable 2.5D character rig. Alpha presence, dimensions, file sizes, and hashes were verified locally on 2026-08-28. The files remain `PROVISIONAL` only because the generation-service terms/model record is still unavailable; their technical production criteria are satisfied.

| ID | Repository path and SHA-256 | Source / transformation | Status |
|---|---|---|---|
| `avatar-dark-master-04` | `public/assets/img/observatory/signal-guide-dark.png`<br>`66148657B089CF3445957381F406CD10CB25FCFE822E2E0EBD6D1E545A91D1D7` · 1,182,200 bytes · RGBA 1024 × 1536 | Chroma source `exec-52122afb-c744-45a9-8fba-f5c05ea25dde.png`, SHA-256 `0549094B0C14BE819FD0D7036471F20E54DCCA18A9FC81F6EF5A704CD47001B0`; deterministic chroma-key extraction | `PROVISIONAL`; generation terms review remains |
| `avatar-light-master-04` | `public/assets/img/observatory/signal-guide-light.png`<br>`FB4EE7DB2BD895982A26167504B4AB627CE2919BF9389064A7008F2BA82D1EEA` · 1,132,267 bytes · RGBA 1024 × 1536 | Chroma source `exec-70f65833-475d-492e-b536-577bb90d15b8.png`, SHA-256 `2780DA8B822E826FDC55BD279C067F580F9161D24E5FB790200509C28D1E0B0B`; deterministic chroma-key extraction | `PROVISIONAL`; generation terms review remains |
| `avatar-dark-particle-sample-04` | `public/assets/img/observatory/signal-guide-dark-sample.webp`<br>`868251425D2C378878210C086D6CF616E385CAA3145F8EA804F15CBD399D37CF` · 37,104 bytes · RGBA 480 × 720 | Lossless resized derivative of `avatar-dark-master-04`; historical ID retained, now used as the dark 2.5D mesh texture | `PROVISIONAL`; inherits master terms gate |
| `avatar-light-particle-sample-04` | `public/assets/img/observatory/signal-guide-light-sample.webp`<br>`250CA2A24CDE41DC32A2D44FEB0B93A03A0CE28C34703F81E433CA64EB7E4B0A` · 40,004 bytes · RGBA 480 × 720 | Lossless resized derivative of `avatar-light-master-04`; historical ID retained, now used as the light 2.5D mesh texture | `PROVISIONAL`; inherits master terms gate |
| `avatar-dark-poster-04` | `public/assets/img/observatory/signal-guide-dark-poster.webp`<br>`CCE322B27E757B53EE3F484FF1617B1A929AC2900D7FCC5145A01B4A79652D48` · 74,112 bytes · RGBA 768 × 1152 | WebP fallback derivative of `avatar-dark-master-04`; used before/without WebGL | `PROVISIONAL`; inherits master terms gate |
| `avatar-light-poster-04` | `public/assets/img/observatory/signal-guide-light-poster.webp`<br>`1CC3999B8B636DD9D53137FB370946931D75A6A6411061D6D5097C4097EC6F51` · 80,126 bytes · RGBA 768 × 1152 | WebP fallback derivative of `avatar-light-master-04`; used before/without WebGL | `PROVISIONAL`; inherits master terms gate |

### Multi-pose runtime atlases

The owner requested visible turns and limb gestures that cannot be produced honestly from one flattened frontal illustration. The existing adult identity and costume were therefore extended into matched eight-pose dark/light contact sheets. A second image-generation pass removed background effects. `scripts/prepare-avatar-pose-atlas.mjs` then performs deterministic chroma keying, matte tightening, connected-component isolation, pose re-alignment and alpha-WebP encoding. It rejects a sheet unless it finds exactly eight substantial full-body silhouettes and records per-cell alpha bounds. `scripts/bake-avatar-runtime-atlas.mjs` adds a three-pixel, cell-bounded silhouette rim before delivery. This replaces a measured 20-fetch fragment-shader outline with a deterministic build-time operation.

Pose order is fixed: `idle`, `quarter-turn`, `walk-profile`, `back-look`, `point-up`, `present`, `quick-turn`, `settle`.

| ID | Repository path and SHA-256 | Source / transformation | Status |
|---|---|---|---|
| `avatar-dark-pose-atlas-05` | `public/assets/img/observatory/signal-guide-dark-poses.webp`<br>`9C93522DBC93C89D2E43BB6E5615FA73FAEA9F3A5670B9F5109193CDC3605960` · 125,356 bytes · RGBA 1536 × 1024 · 4×2 | Cleaned chroma generation record `exec-ddc15799-73bc-4e93-84a9-e52bf5e08923.png`, SHA-256 `DA5DB80B4492FCA1030D85C176560D95CA42AD3393BEF8C0D7471217808C68C4`, 1,610,502 bytes; deterministic atlas preparation | `PROVISIONAL`; generation terms and final in-scene edge/motion review remain |
| `avatar-light-pose-atlas-05` | `public/assets/img/observatory/signal-guide-light-poses.webp`<br>`3E79110A9114A2C848D3E185404C0104912C91B03E432D4C3DFC81B91D5916EF` · 127,382 bytes · RGBA 1536 × 1024 · 4×2 | Cleaned chroma generation record `exec-a40de7cb-9867-4707-8259-9bd21582b8f0.png`, SHA-256 `3F128C2C69351864D22D6A95EC721855D657B7ACD9F4EA0F84535C26D848D73A`, 1,604,059 bytes; deterministic atlas preparation | `PROVISIONAL`; generation terms and final in-scene edge/motion review remain |
| `avatar-pose-atlas-manifest-05` | `public/assets/img/observatory/pose-atlas-manifest.json` | Records source/output hashes, dimensions, bytes, eight cell alpha populations and alpha bounds | `PROVISIONAL`; inherits both atlas gates |
| `avatar-dark-pose-runtime-06` | `public/assets/img/observatory/signal-guide-dark-poses-runtime.webp`<br>`4BD6E58F7AD02614FDFB82C8142B53EB6DA911F4352FBF3EAE6746FEC9C410E5` · 165,018 bytes · RGBA 1536 × 1024 · 4×2 | Cell-bounded alpha dilation and source-over violet rim composite derived from `avatar-dark-pose-atlas-05` | `PROVISIONAL`; inherits source terms gate |
| `avatar-light-pose-runtime-06` | `public/assets/img/observatory/signal-guide-light-poses-runtime.webp`<br>`05B975E3C21FB72424B9AA613BCC893F4FC8A0824A7DC6C7844FB71E43937AA7` · 160,810 bytes · RGBA 1536 × 1024 · 4×2 | Cell-bounded alpha dilation and source-over indigo rim composite derived from `avatar-light-pose-atlas-05` | `PROVISIONAL`; inherits source terms gate |
| `avatar-pose-runtime-manifest-06` | `public/assets/img/observatory/pose-runtime-manifest.json` | Records base/runtime hashes, dimensions, bytes, theme rim colors and deterministic outline parameters | `PROVISIONAL`; inherits both atlas gates |

Production acceptance for the avatar requires:

1. [x] true alpha or a separately reviewed binary/soft mask—no baked checkerboard;
2. [x] matched canvas, pose anchor, silhouette scale, face identity, costume construction, and signal accessories across themes;
3. [x] full-resolution master plus optimized raster fallback and runtime mesh texture;
4. [x] visual review at dark/light backgrounds and with the actual deformable-rig motion;
5. [x] updated ledger entry for every shipped derivative, including transformation tool and SHA-256;
6. [x] eight isolated, aligned silhouettes exist in both theme atlases and are checked by the deterministic pipeline;
7. [ ] visual review of pose transitions at 25%, 50% and 75% in the final WebGL scene;
8. [x] Owner/DRI confirmation that the generated imagery is authorized for this site use; underlying service/license evidence was not independently inspected.

## Original cinematic world plates

The owner rejected the earlier exposed-primitive background and requested a monumental, recognisable place. Two theme-matched 2:1 plates were generated under project direction as an original lunar crater observatory city: layered terrain, arched research districts, dish arrays, bridges, a planet and a continuous orbital truss share the same composition in both themes. They are not copied from Kage, Sylva, or any studied site. Those sites were used only to identify general spatial principles.

`scripts/prepare-world-plates.mjs` validates the source aspect ratio, performs a deterministic WebP export, and writes `world-plate-manifest.json`. `scripts/derive-world-plate-variants.mjs` creates 896 × 448 compact derivatives for mobile, reduced-motion and Save-Data delivery. The plates carry no text or semantic content. They are now fallback assets only: static/loading/reduced-motion/Save-Data/failure states may display them, while the V4 live-ready state sets their opacity to zero and is visually complete through Three.js geometry and the opaque atmospheric sky.

| ID | Repository path and SHA-256 | Source / transformation | Status |
|---|---|---|---|
| `world-plate-dark-01` | `public/assets/img/observatory/observatory-world-dark.webp`<br>`CCC9BBD7A449433BBC2C4A628603EA84B4AC1233C682AF6CDACF765AED09D250` · 194,302 bytes · 1774 × 887 | Local generation record `exec-2d8b4c62-cbf3-4049-8828-0b355bd8c07d.png`, SHA-256 `F83AC1A65EB855C61A554814D1BA492DCF62D8F4895E3F3F9E0B8DEEEBEB0156`; WebP quality 82 | `PROVISIONAL`; generation model/version and applicable service terms remain to be recorded |
| `world-plate-light-01` | `public/assets/img/observatory/observatory-world-light.webp`<br>`9B4E9CDB2AE3F463E31E5A9F4C2B60FDD36C1EE047709C39CA3F5A3687BCBEA9` · 291,022 bytes · 1774 × 887 | Local generation record `exec-3bf44cd3-a5d4-4cd3-a796-a9314f423ba8.png`, SHA-256 `455FE3243F452B6928D5501F0B491309EBA4658F42A41F6A1DBBFCBF902C6726`; WebP quality 82 | `PROVISIONAL`; inherits the same generation-terms gate |
| `world-plate-manifest-01` | `public/assets/img/observatory/world-plate-manifest.json` | Records both source/output filenames, hashes, dimensions, themes and byte counts; guarded by `tests/unit/observatory-assets.test.ts` | `PROVISIONAL`; inherits both plate gates |
| `world-plate-dark-compact-02` | `public/assets/img/observatory/observatory-world-dark-compact.webp`<br>`B84F2E534CE7C079252C8E6E897F392E21B30AC122A7D5B19CAC77D5D007D990` · 35,292 bytes · 896 × 448 | WebP quality 72 derivative of `world-plate-dark-01` | `PROVISIONAL`; inherits source terms gate |
| `world-plate-light-compact-02` | `public/assets/img/observatory/observatory-world-light-compact.webp`<br>`604525B0DE574C482AEF9978B139FBF7FE519E6E6CC7E49E097CD1D87511B17C` · 47,192 bytes · 896 × 448 | WebP quality 72 derivative of `world-plate-light-01` | `PROVISIONAL`; inherits source terms gate |
| `world-plate-variant-manifest-02` | `public/assets/img/observatory/world-plate-variant-manifest.json` | Records full/compact hashes, dimensions, byte counts and fallback purpose | `PROVISIONAL`; inherits both plate gates |

Technical acceptance requires both files to remain true WebP, approximately 2:1, hash-matched to the manifest, visually aligned across themes, free of baked UI/text, and subordinate to DOM contrast. The deterministic conditions are tested; release rights are covered by the Owner attestation above, with the underlying evidence unverified by the agent.

## Profile avatar derivative

The existing profile image had no source URL, rightsholder record, license, or permission evidence in the reviewed repository material. Its optimized derivative improves delivery and inherits the source status. The Owner release authorization above now supersedes the earlier gate for this release.

| ID | Repository path and SHA-256 | Source / transformation | Status |
|---|---|---|---|
| `profile-avatar-source-01` | `public/assets/img/profile.png`<br>`879B607062FC8CE74B583544AAFDA8875C64B0A7EA2C2B06E4F913A4BF8D6DB8` · 302,174 bytes | Pre-existing repository image; origin and rights evidence not established | `UNRESOLVED — RELEASE GATE` |
| `profile-avatar-runtime-01` | `public/assets/img/observatory/profile-avatar.webp`<br>`319AF8AB63628C7EDCD3EC3582FB2D4A099933CC39142C37AD646120D5A24BD1` · 5,010 bytes · 128 × 128 | Sharp resize/WebP derivative produced by `scripts/prepare-observatory-assets.mjs` | `UNRESOLVED — RELEASE GATE`; inherits source status |

## Existing anime hero and cover imagery

The owner explicitly chose to retain these images in the upgraded design as signal windows, memory slices, and archive projections. No source URL, rightsholder permission, license, purchase record, or required attribution was found in the reviewed repository material during the initial audit, so the rows below preserve their original `UNRESOLVED` finding. The later Owner release authorization above supersedes that release gate for the current scope without pretending that the agent inspected the private rights evidence.

### Hero images — 5 unresolved files

```text
public/assets/img/heroes/GBC-五人合照2.webp
public/assets/img/heroes/四月是你的谎言-薰和有马.webp
public/assets/img/heroes/孤独摇滚-波奇.webp
public/assets/img/heroes/败犬女主-小鞠知花.webp
public/assets/img/heroes/超时空辉夜姬壁纸-二人合照3.webp
```

Status for every file in this block: `UNRESOLVED — RELEASE GATE`.

### Optimized signal-window derivatives — inherit unresolved release gate

`scripts/prepare-observatory-assets.mjs` creates the following real WebP derivatives for the six-chapter homepage. The source files remain unchanged. Every derivative inherits its source's `UNRESOLVED` status; optimization does not resolve copyright or permission.

| Repository derivative | Source | SHA-256 · size |
|---|---|---|
| `public/assets/img/observatory/signal-bocchi.webp` | `public/assets/img/heroes/孤独摇滚-波奇.webp` | `198668B10849535A49469F8C595B172A2EE38F9C9B56D77313910D50A3C00A13` · 108,318 bytes |
| `public/assets/img/observatory/signal-april.webp` | `public/assets/img/heroes/四月是你的谎言-薰和有马.webp` | `E27E02B4D877098965F15F567DFEFEF2EC96487941C7F72A0458DBB306222BDA` · 113,118 bytes |
| `public/assets/img/observatory/signal-gbc.webp` | `public/assets/img/heroes/GBC-五人合照2.webp` | `C53F7BF940376B605162E11EE6ECB82EE13EC816727F637219D46203A39A4A76` · 165,816 bytes |
| `public/assets/img/observatory/signal-komari.webp` | `public/assets/img/heroes/败犬女主-小鞠知花.webp` | `DCE7D3244F11904981CF6C975D43622F529503ADC1E289ED377338A3A969BC3F` · 19,660 bytes |
| `public/assets/img/observatory/signal-kaguya.webp` | `public/assets/img/heroes/超时空辉夜姬壁纸-二人合照3.webp` | `0974BD723FA794BFD40EC485F824E3EB3DE1CD17EF70B2ECDD6ECD34BAAFCF0E` · 71,416 bytes |
| `public/assets/img/observatory/about-signal-loop.mp4` | `public/assets/img/banners/孤独摇滚-波奇-动态.mp4` (`1560150C18631C4716D98DA627B91B7FE87EC00AD3EBE327FAE964A34CC1300E`) | `035552F9D0AF5000642C0EB22448C24E09930AC6CB3ADE64E558052DB4EAFB8F` · 1,016,355 bytes; FFmpeg 8.1.2, H.264 1280 × 720 at 30fps, no audio, fast-start |

### Cover images — 34 unresolved files

#### Girls Band Cry / GBC

```text
public/assets/img/covers/GBC-五人合照.webp
public/assets/img/covers/GBC-五人合照3.webp
public/assets/img/covers/GBC-五人合照4.webp
public/assets/img/covers/GBC-仁菜.webp
public/assets/img/covers/GBC-仁菜2.webp
public/assets/img/covers/GBC-仁菜3.webp
public/assets/img/covers/GBC-仁菜4.webp
public/assets/img/covers/GBC-仁菜和昴.webp
public/assets/img/covers/GBC-小智和鲁帕.webp
public/assets/img/covers/GBC-昴.webp
```

#### Bocchi the Rock!

```text
public/assets/img/covers/孤独摇滚-四人合照.webp
public/assets/img/covers/孤独摇滚-四人合照2.webp
public/assets/img/covers/孤独摇滚-喜多和波奇.webp
public/assets/img/covers/孤独摇滚-山田凉.webp
public/assets/img/covers/孤独摇滚-山田凉2.webp
public/assets/img/covers/孤独摇滚-波奇2.webp
public/assets/img/covers/孤独摇滚-虹夏.webp
public/assets/img/covers/孤独摇滚-虹夏2.webp
public/assets/img/covers/孤独摇滚-虹夏与凉.webp
```

#### Makeine: Too Many Losing Heroines!

```text
public/assets/img/covers/败犬女主-八奈见1.webp
public/assets/img/covers/败犬女主-八奈见2.webp
public/assets/img/covers/败犬女主-八奈见3.webp
public/assets/img/covers/败犬女主-小鞠知花.webp
```

#### Kaguya / 超时空辉夜姬 filename group

```text
public/assets/img/covers/超时空辉夜姬壁纸-三人合照2.webp
public/assets/img/covers/超时空辉夜姬壁纸-二人合照2.webp
public/assets/img/covers/超时空辉夜姬壁纸-辉夜3.webp
```

#### My Teen Romantic Comedy SNAFU / 青春恋爱物语 filename group

```text
public/assets/img/covers/青春恋爱物语-雪乃.webp
public/assets/img/covers/青春恋爱物语-雪乃和团子.webp
```

#### Your Lie in April

```text
public/assets/img/covers/四月是你的谎言-薰.webp
public/assets/img/covers/四月是你的谎言-薰2.webp
public/assets/img/covers/四月是你的谎言-薰3.webp
public/assets/img/covers/四月是你的谎言-薰4.webp
public/assets/img/covers/四月是你的谎言-薰5.webp
public/assets/img/covers/四月是你的谎言-薰6.webp
```

Status for every file in the cover groups: `UNRESOLVED — RELEASE GATE`.

### Responsive cover derivatives — inherit source release gates

`scripts/prepare-cover-assets.mjs` uses Sharp to create content-hashed 640w and 1280w WebP variants without changing the source files. The public audit record is `public/assets/img/covers/generated/manifest.json` (SHA-256 `0F3B74BD61B31F5C6C4FA6FB8F1C358ABEEC0EA79EF81BC0E729F392FF846354`, 39,385 bytes). It records source and derivative paths, true formats, dimensions, byte counts, SHA-256 values, encoding settings, and group ownership for every entry.

Verified local summary on 2026-08-28:

| Scope | Sources | Source bytes | Derivatives | Derivative bytes | Status |
|---|---:|---:|---:|---:|---|
| `public/assets/img/covers/*` | 34 | 94,877,706 | 68 | 3,578,566 | `UNRESOLVED`; inherits each anime source gate |
| Roadmap frontmatter diagrams | 3 | 451,186 | 6 | 64,498 | `UNRESOLVED`; origin/license review remains |
| About signal poster | 1 | 108,318 | 2 | 150,756 | `UNRESOLVED`; inherits `signal-bocchi.webp` gate |
| Total | 38 | 95,437,210 | 76 | 3,801,820 | Stop-Ship until every source is cleared |

The 34-cover runtime payload is 96.23% smaller when comparing all generated variants with all original cover files. This is a delivery result, not a rights decision.

### Resolution workflow for anime imagery

For each file, the owner or reviewer must supply an authoritative source URL and one of: explicit permission, a license compatible with the site's use, an official media-kit policy, or a documented legal basis approved by the responsible human. Record required attribution and transformation restrictions. If acceptable evidence cannot be obtained, preserve the design slot but replace the image with a commissioned/original/licensed visual; do not silently mark the current screenshot as approved.

## Dependencies and future assets

- **Brand favicon**: `public/favicon.svg` is a project-authored vector rendering of the Lunar Signal orbit mark, with no imported path, font or third-party artwork. Status `APPROVED` for site icon use.
- **Three.js**: npm package `three@0.185.1`, source `https://github.com/mrdoob/three.js`, SPDX license `MIT`, installed 2026-08-28. Used as an unmodified runtime dependency for the full-realtime observatory world, environmental fields, post-processing and articulated volumetric character. `APPROVED` for this scope; retain its license through the package distribution record.
- **Sharp**: npm package `sharp@0.35.4`, source `https://github.com/lovell/sharp`, SPDX license `Apache-2.0`, installed 2026-08-28 as a development-only deterministic raster pipeline. `APPROVED` for this scope; generated files retain the source asset's provenance status.
- **Canvas UI / Magnify (Vanilla)**: upstream `https://github.com/DavidHDev/canvas-ui` at commit `cd17ebd6c4b68e38c5daaa37e037de1055c1d70f`, acquired 2026-08-28. `src/lib/canvasui/MagnifyVanilla.ts` (`0B274452C4E75CAD8E27FEAABDB46EEBCDC650E342255DED1E77BFD192132C6B`) and its `src/lib/rect-cache.ts` helper (`38293682F8D6858E5A2AFA32B7C78DD0EAF6EE98FFA29762C3151D1EFB24ABB8`) are vendored for one lazy Afterlight signal-window scanner. Upstream uses MIT plus Commons Clause; the verbatim license is retained at `src/lib/canvasui/LICENSE.canvas-ui.md` (`E8F11EF2573E88008BA35334CBA06D880B82B217650BF7255D6B60B9AD183791`). `APPROVED` for site use under the recorded terms; it is not resold as a library and is not the character or full-page renderer.
- **Environment audio**: no audio file is shipped. The opt-in ambience is synthesized at runtime with the Web Audio API after an explicit user gesture; it begins muted and therefore has no external-asset provenance or attribution obligation. Acoustic/accessibility behavior still requires final interaction review.
- **Fonts**: `BaseLayout.astro` requests Inter and Space Grotesk through `https://fonts.googleapis.com/` / `https://fonts.gstatic.com/`; no font binary is committed. Inter's official repository records SIL Open Font License 1.1 at `https://github.com/rsms/inter/blob/master/LICENSE.txt`; Space Grotesk records the same license at `https://github.com/floriankarsten/space-grotesk/blob/master/OFL.txt`. The Owner's instruction to publish accepts the existing third-party font request/privacy behavior for this release. Status `APPROVED` for use as remotely requested, unmodified web fonts; self-hosting remains a future privacy/reproducibility improvement.

## Known audit gaps

This pass did not establish per-file provenance for the legacy favicon files under `public/assets/img/favicons/`, article diagrams under `public/assets/images/`, Mermaid-generated output, or externally loaded comment content. The Owner attestation covers current repository images for this release, but detailed per-file source mapping remains backlog and must not be represented as independently verified. The site references the approved project-authored `public/favicon.svg`; Mermaid output is generated from article source, and external comment content is outside the committed release artifact.

## Release checklist

- [x] Every shipped visual class is covered by a stable ledger entry or the scoped Owner authorization record; per-file legacy mapping remains backlog.
- [x] No shipped visual remains blocked under the current release decision; historical `UNRESOLVED` rows are superseded by the Owner attestation above.
- [x] Generated avatar production files and both eight-pose atlases have real transparency and recorded hashes.
- [x] Owner/DRI accepts responsibility for satisfying any attribution conditions attached to the privately held authorization; no additional attribution requirement was supplied to the agent.
- [x] Optimized derivatives trace back to a source covered by the scoped Owner authorization and deterministic manifests.
- [x] Owner/DRI release decision and date are recorded in this file.

Current result: **Conditional Go for public release. The prior image-provenance Stop-Ship is cleared by the Owner/DRI's explicit authorization statement for this release; the underlying legal evidence remains unverified by the agent and in the Owner's custody.**
