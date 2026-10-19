# Animated bee specimen

- Current model page: [Pasha — Realistic bee](https://sketchfab.com/3d-models/realistic-bee-0ea8f5f4a2a5496aa177faf637868443)
- Original model page explicitly linked by the uploader: [Irfan — Bee](https://sketchfab.com/3d-models/bee-7a43e360d7ac4f9a8006733b0589c9a4)
- License: both Sketchfab listings show [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/). Both creators are credited in the visible UI note.
- Use: Life → প্রাণীর শ্রেণি → পতঙ্গ. It is one bee/insect specimen, not a verified Bangladesh honeybee species; it is not used for the specific মধুমক্ষিকা entry.
- Download: Sketchfab converted GLB 1K texture, original SHA-256 `4cb0fa903961ef74b44eab677404c4bb1c820e76151952457c7ccb74be564cb7`.
- Web derivative: `bee.glb`, 1,660,000 bytes; SHA-256 `d9f47ba8950eda9edcb2df344f003afe1c07c554ab09b6ac017df7a54079d5c1`.
- Optimization: glTF Transform CLI 4.3.0, specular/glossiness converted to metallic/roughness PBR, mesh simplification to 55% with 0.002 error tolerance, 512px PNG maps, and Meshopt geometry/animation compression. PNG/PBR conversion is intentional: the earlier WebP/spec-gloss derivative rendered white in Three.js, while the corrected derivative restores the bee’s yellow/black markings in browser captures. Three authored clips remain in the file; Posora plays only `_bee_hover` so mutually exclusive idle/takeoff clips are not blended together. This is an authored hover animation, not real insect movement data.
