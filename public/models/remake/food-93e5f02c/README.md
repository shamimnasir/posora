# Food pilot asset record

This folder tracks rights and evidence for the bounded Food animation pilot.

## Generated fish-skin texture

- File: `/textures/fish-scale-albedo.jpg`
- Creator/tool: original texture generated for this project with Codex ImageGen on 2026-09-25, then resized to 768 × 768 and converted to JPEG quality 86 for delivery.
- Source URL / external creator / license: none; no third-party asset is embedded. Do not describe this generated image as CC0, a photographed specimen, or a scientific reference.
- SHA-256: `f03ed549958676ad9d8311789bdbd5926c89f0cbbc3d353806bc3ef5e0f62d9c`
- Size: 315,524 bytes; 768 × 768 px; sRGB albedo use.
- Use: close-up fish head material only. The repeating pattern is decorative surface detail; it does not establish fish species or anatomy.
- Generation prompt: “Use case: scientific-educational. Asset type: seamless albedo texture for a real-time 3D fish head in a children's interactive learning scene. Primary request: create a seamless, tileable square texture showing natural freshwater fish skin scales only. Style/medium: photorealistic PBR texture scan, restrained documentary realism, not an illustration. Composition/framing: flat orthographic texture map, evenly filled edge-to-edge, consistent scale size throughout. Lighting/mood: neutral diffuse studio illumination with no directional highlights or cast shadows. Color palette: muted silver-grey with subtle sage/blue undertones and faint warm cream variation. Materials/textures: fine overlapping small fish scales with delicate darker scale edges and restrained iridescence; believable organic variation, crisp at close range, matte-satin wet skin rather than metallic. Constraints: every edge must tile seamlessly; no face, eye, gills, fins, body outline, plate, props, background, labels, symbols, text, border, watermark, vignette or perspective; suitable as a repeating UV albedo color map, neutral even lighting.”

### Updated generated materials

- `/textures/fish-scale-albedo-v2.jpg` — generated for this project with Codex ImageGen on 2026-09-25; 768 × 768 px JPEG, 282,624 bytes, sRGB; SHA-256 `a511e233d2a55c9a90202565d5b813f8d6f57b61c4b938431257bb9d67d24401`. Prompt: “A seamless tileable square close-up of natural freshwater fish flank scales, silver-grey with restrained muted olive/pearl undertone; small overlapping scales with subtle directional variation; neutral diffuse, no perspective, no focal point, no cast shadows, highlights, text, eye, gills, fins, cartoon style or obvious large repeated diamonds.” This is generated art, not a species reference.
- `/textures/food-board-albedo-v1.jpg` — generated for this project with Codex ImageGen on 2026-09-25; 768 × 768 px JPEG, 134,870 bytes, sRGB; SHA-256 `29d77d8536c2f9e158e7863bd0bec7f25506bdc142e5fff817e31467251cc022`. Prompt: “Seamless square albedo texture of pale warm maple/beech, subtle long grain, low contrast fine pores, flat diffuse scan, no perspective, edges, shadows, lettering, stains, knots or graphic stripes.” It is a material concept, not a verified wood species. The first fish texture remains archived at `/textures/fish-scale-albedo.jpg` but is no longer referenced by the Food scene.
- `/textures/guava-skin-albedo-v1.jpg` — generated for this project with Codex ImageGen on 2026-09-29; 768 × 768 px JPEG, 282,500 bytes, sRGB; SHA-256 `a28cae7a463ddf2855aa525af55796534b31a93e7c7c72a0f185dad990c61d86`. Prompt synopsis: seamless restrained green guava peel with fine natural pores and diffuse neutral lighting; texture-only, no fruit silhouette, seeds, text or props. Original generated texture, not a photographed sample or botanical reference.
- `/textures/cucumber-skin-albedo-v1.jpg` — generated for this project with Codex ImageGen on 2026-09-29; 768 × 768 px JPEG, 321,491 bytes, sRGB; SHA-256 `a2fbb309e6afc9664b1026a5da7384ecb5191bcf31522e0bbcde653cba74328d`. Prompt synopsis: seamless longitudinal cucumber skin with restrained mottling and fine natural variation under diffuse neutral lighting; texture-only, no cucumber silhouette, cut face, text or props. Original generated texture, not a photographed sample or cultivar identification.

## Remaining references / asset gaps

- `barramundi-fish-1024-webp.glb` is the Food pilot's anatomical fish source for both overview and detail. Source: Khronos Group glTF Sample Assets, `Models/BarramundiFish`; creator/legal record: © 2017, Public, released under CC0 1.0 Universal. The unchanged upstream license is stored in `BARRAMUNDI-LICENSE.md`.
- Upstream GLB: 12,488,144 bytes. This project derivative was processed with glTF-Transform 4.5.0 using its standard geometry cleanup and 1024 px WebP textures, with geometry compression disabled for broad Three.js compatibility. Output: 405,712 bytes, 2,147 uploaded vertices, 11,388 rendered vertices for one pass, three 1024 px textures. No anatomy or texture content was generated during optimization.
- Upstream record: https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/BarramundiFish
- The previous procedural fish remains only as a loading/failure fallback. It is not the accepted primary fish and must not be used as visual acceptance evidence.
- The source identifies the specimen as barramundi, but learner-facing copy continues to say only “fish”; the nutrient lesson does not require a species claim.
- The official [Kenney Food Kit](https://kenney.nl/assets/food-kit) is CC0, but its previewed fish prop is deliberately low-poly and was not added to production because it would not meet the requested visual direction.
