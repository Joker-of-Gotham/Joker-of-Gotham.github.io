# Selene Meridian asset provenance

Verified on 2026-08-29 for the continuous Three.js world implementation.

## License

Every binary listed below comes directly from Poly Haven. Poly Haven states that all of its HDRIs, textures, and 3D models are released under **CC0** and may be used, modified, and redistributed without attribution. Attribution is retained here for traceability.

- License: https://polyhaven.com/license
- CC0 summary: https://creativecommons.org/publicdomain/zero/1.0/
- Texture technical standard and `arm` convention: https://docs.polyhaven.com/en/technical-standards/textures
- Poly Haven API used to resolve the exact 1K downloads: `https://api.polyhaven.com/files/{asset_id}`

Poly Haven documents `arm` as packed **Ambient, Roughness, Metallic** data. The local ARM JPEGs therefore use R = ambient occlusion, G = roughness, and B = metalness. Base-color maps must be sampled as sRGB; OpenGL normal and ARM maps must be sampled as non-color data.

## PBR texture sets

No image data was converted, resampled, color-adjusted, or recompressed. Files were downloaded at Poly Haven's published 1K JPG resolution and only renamed locally.

| Local file | Poly Haven asset / author | Downloaded map | Original download URL | Bytes | API MD5 |
| --- | --- | --- | --- | ---: | --- |
| `public/assets/three/selene-meridian/materials/regolith/basecolor-1k.jpg` | [Moon 01](https://polyhaven.com/a/moon_01) (`moon_01`) / Greg Zaal, Rico Cilliers, Jenelle van Heerden, Dario Barresi | Diffuse JPG, 1K | https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/moon_01/moon_01_diff_1k.jpg | 328,631 | `edaf25012d783909bfc93946ee0b9628` |
| `public/assets/three/selene-meridian/materials/regolith/normal-gl-1k.jpg` | [Moon 01](https://polyhaven.com/a/moon_01) (`moon_01`) / Greg Zaal, Rico Cilliers, Jenelle van Heerden, Dario Barresi | OpenGL normal JPG, 1K | https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/moon_01/moon_01_nor_gl_1k.jpg | 1,298,713 | `accb58c64b6bd429ebdec8b41d358dbf` |
| `public/assets/three/selene-meridian/materials/regolith/arm-1k.jpg` | [Moon 01](https://polyhaven.com/a/moon_01) (`moon_01`) / Greg Zaal, Rico Cilliers, Jenelle van Heerden, Dario Barresi | Packed AO/roughness/metalness JPG, 1K | https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/moon_01/moon_01_arm_1k.jpg | 756,990 | `deadbce2c5e38f00d6a25a05b958f59f` |
| `public/assets/three/selene-meridian/materials/concrete/basecolor-1k.jpg` | [Concrete](https://polyhaven.com/a/concrete) (`concrete`) / Rob Tuytel | Diffuse JPG, 1K | https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/concrete/concrete_diff_1k.jpg | 543,902 | `795b1fbb460fb38d29c5859ff2c4b5d4` |
| `public/assets/three/selene-meridian/materials/concrete/normal-gl-1k.jpg` | [Concrete](https://polyhaven.com/a/concrete) (`concrete`) / Rob Tuytel | OpenGL normal JPG, 1K | https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/concrete/concrete_nor_gl_1k.jpg | 114,447 | `17d4bd534e153db3ff469fdfc4484355` |
| `public/assets/three/selene-meridian/materials/concrete/arm-1k.jpg` | [Concrete](https://polyhaven.com/a/concrete) (`concrete`) / Rob Tuytel | Packed AO/roughness/metalness JPG, 1K | https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/concrete/concrete_arm_1k.jpg | 123,414 | `e53e32dabc5ba580141ed8221654d4c0` |
| `public/assets/three/selene-meridian/materials/metal/basecolor-1k.jpg` | [Metal Plate 02](https://polyhaven.com/a/metal_plate_02) (`metal_plate_02`) / Rob Tuytel | Diffuse JPG, 1K | https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/metal_plate_02/metal_plate_02_diff_1k.jpg | 625,917 | `531b7e067dc537e0b3c7962175e04ffd` |
| `public/assets/three/selene-meridian/materials/metal/normal-gl-1k.jpg` | [Metal Plate 02](https://polyhaven.com/a/metal_plate_02) (`metal_plate_02`) / Rob Tuytel | OpenGL normal JPG, 1K | https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/metal_plate_02/metal_plate_02_nor_gl_1k.jpg | 183,264 | `ce8198004fd9409f592a7f024be0c01e` |
| `public/assets/three/selene-meridian/materials/metal/arm-1k.jpg` | [Metal Plate 02](https://polyhaven.com/a/metal_plate_02) (`metal_plate_02`) / Rob Tuytel | Packed AO/roughness/metalness JPG, 1K | https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/metal_plate_02/metal_plate_02_arm_1k.jpg | 1,075,839 | `ff6e0499763d76c76b1568b16f5f93f6` |

Intended material roles:

- `regolith`: continuous terrain, crater walls, exposed rock, and dust-covered retaining earthwork. This is Poly Haven's dedicated laboratory-captured lunar-regolith material, not an Earth landscape texture.
- `concrete`: sintered-regolith concrete, cut walls, plinths, and protected interior shells.
- `metal`: limited trim, maintenance panels, antenna hardware, and weathered structural accents. It is deliberately not the default building surface.

## Natural geometry

| Local file | Poly Haven asset | Local use | Bytes | Modification |
| --- | --- | --- | ---: | --- |
| `public/assets/three/selene-meridian/models/moon-rock-01/moon-rock-01.gltf` | [Moon Rock 01](https://polyhaven.com/a/moon_rock_01) (`moon_rock_01`) | LOD2/LOD3 geometry manifest | 5,981 | Removed material, image, sampler, and texture references so the geometry-only loader never requests redundant maps. Mesh/accessor data is unchanged. |
| `public/assets/three/selene-meridian/models/moon-rock-01/moon-rock-01.bin` | [Moon Rock 01](https://polyhaven.com/a/moon_rock_01) (`moon_rock_01`) | Source LOD geometry buffer | 448,168 | Unmodified upstream binary. |

At runtime, 36 deterministic transforms of the LOD2/LOD3 photogrammetry geometry are merged into one static `BufferGeometry` and rendered with the existing regolith PBR material. This adds at most one draw call. Low quality draws 18 rocks, standard draws 30, enhanced draws all 36, and poster mode draws none; quality changes only adjust visibility and the precomputed index draw range. No asset geometry or transforms are rebuilt per frame.

## HDR environments

Both files are original Poly Haven Radiance HDR downloads. They were renamed only. Use them through `RGBELoader` plus `PMREMGenerator` for image-based lighting; the authored lunar sky remains the visible background so terrestrial horizons and clouds are not presented as lunar scenery.

| Local file | Poly Haven asset / author | Role | Original download URL | Bytes | API MD5 |
| --- | --- | --- | --- | ---: | --- |
| `public/assets/three/selene-meridian/environment/rogland-clear-night-1k.hdr` | [Rogland Clear Night](https://polyhaven.com/a/rogland_clear_night) (`rogland_clear_night`) / Greg Zaal | Primary night reflection/fill environment | https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/rogland_clear_night_1k.hdr | 1,694,136 | `509bf6a02213f0bf068ebf7fc56d45b1` |
| `public/assets/three/selene-meridian/environment/klippad-sunrise-2-1k.hdr` | [Klippad Sunrise 2](https://polyhaven.com/a/klippad_sunrise_2) (`klippad_sunrise_2`) / Greg Zaal | Optional light-theme / Afterlight reflection environment, late-loaded | https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/klippad_sunrise_2_1k.hdr | 1,559,412 | `15f104a3bccf3b80cd6e4c0b0570de80` |

## Integrity and budget verification

- 9 JPEG maps: each is a valid JPEG (`FF D8 FF`) at 1024 × 1024.
- 2 environments: each is a valid Radiance HDR (`#?RADIANCE`) at 1024 × 512.
- All 11 downloaded files match the MD5 values returned by the Poly Haven API.
- Total transfer size on disk including natural geometry: **8,758,814 bytes (8.353 MiB)**.
- The optional sunrise HDR accounts for 1,559,412 bytes; omitting its late-load path reduces the night-first asset set to 6,745,253 bytes.
- No displacement maps were included. Macro terrain relief remains geometry-driven; normal maps provide micro-relief without the vertex/tessellation cost of runtime displacement.

## Local SHA-256 ledger

| Local file | SHA-256 |
| --- | --- |
| `environment/klippad-sunrise-2-1k.hdr` | `ab36ba8538ffa9a4ae90497b76eeab4bd7cd2233f7572c295381ecfaff1de6bb` |
| `environment/rogland-clear-night-1k.hdr` | `3cc2486bdf545b1b3358ba8f2fa1ebb13211d2c6b45a376f39b8d3217ec7c028` |
| `materials/concrete/arm-1k.jpg` | `98bd4ffb8ec52620b1053f6f576f1154caf20ee7a8786721724ea169b16582e0` |
| `materials/concrete/basecolor-1k.jpg` | `046c0e2aebe31e6043a6bc074e779f6a345f1d823d0ca1c69446c5cabadefa8a` |
| `materials/concrete/normal-gl-1k.jpg` | `298a0e93040c9d76d239a894bdf28a9787755ea5f22baa068ffa8075369ee428` |
| `materials/metal/arm-1k.jpg` | `e099a8385d53f4a515b7e0ce94f85d88657fcac49c23979474f5394b22dd550b` |
| `materials/metal/basecolor-1k.jpg` | `6e80877d0e9d5973d96298c6091df7ace906b0a6760afc4f3592e4855f3f1d4c` |
| `materials/metal/normal-gl-1k.jpg` | `58736fbb8aa4fc6690cf8152b174db65caf22a766375b625fb0087e1bc955bc7` |
| `materials/regolith/arm-1k.jpg` | `96c3c6fe0d387e728b8df1b7bafa146979c328e4a1599bb856fdb59a5e3fb79c` |
| `materials/regolith/basecolor-1k.jpg` | `ebe99635c8babc05620fb532eba8459b9168b5b09f9704e320938c231900ed62` |
| `materials/regolith/normal-gl-1k.jpg` | `cd0f110d7a5079fa2ae3739f91cad85480b5314fd2b414998a08f1f444c6a110` |
| `models/moon-rock-01/moon-rock-01.bin` | `c6671327046efd27ab1a97c4c716412f209a063184e65f0376e3be6583e8f52a` |
| `models/moon-rock-01/moon-rock-01.gltf` | `b2c739b46f0817c420b632578d9872136c615b4d1d970187cb1fd5a93a763834` |
