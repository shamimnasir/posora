# Exact plant-model sourcing pass — 2026-10-16

## Outcome

One general bamboo specimen was imported in this pass. It is a useful, licensed
replacement for the bamboo entry, but it is low-poly and is not visually
photorealistic; mobile/desktop captures confirm that it reads as bamboo while
also showing the quality gap that remains across the Life scene. It is not
claimed to represent a specific Bangladeshi bamboo species. Other candidates
were rejected where exact identity, commercial rights, or download permission
could not be verified.

The supplied mango-tree asset remains the only exact named tree specimen in
`life:বাংলাদেশের গাছপালা`; its CC BY 4.0 attribution and local copy are already
recorded with the asset. The shared Poly Haven inventory contains generic tree
models, but none of the catalog IDs is a named Bangladeshi species such as
jackfruit, banyan, palmyra palm, silk-cotton, sundari, golpata, paddy, jute,
water lily, kadam, or hijol. The bamboo lesson is now backed by an explicitly
general-purpose bamboo model; it does not close the paddy/rice-plant entry.

## Candidates checked

| Lesson subject | Candidate | Decision |
| --- | --- | --- |
| Jackfruit tree (`Artocarpus heterophyllus`) | [Sketchfab — Jackfruit Tree 3D Model](https://sketchfab.com/3d-models/jackfruit-tree-3d-model-ee10cbb8ae864ae7a2b11654957bc986) | Page search shows about 780k triangles; license was not verifiable from the accessible listing. Do not download or map until the creator’s license and the downloadable file are verified. |
| Jackfruit tree | [ArtStation — Jackfruit Tree 3D Model](https://www.artstation.com/marketplace/p/w2OBo/jackfruit-tree-3d-model) | Commercial use is available under a paid Standard License limited to one commercial project and sales/views caps; Extended Commercial License is paid. No purchase was made, and redistribution/embedding terms need review before acquisition. |
| Banyan (`Ficus benghalensis`) | [Sketchfab — Xfrog Ficus benghalensis](https://sketchfab.com/3d-models/as06-ficus-benghalensis-banyan-dd3c04d489b14663ac92063b3d235063) | Exact species, but CC BY-NC-ND is not suitable for this commercial site. Rejected. |
| Banyan-like tree | [Sketchfab — Chinese Banyan (`Ficus microcarpa`)](https://sketchfab.com/3d-models/chinese-banyan-ficus-microcarpa-2a0dbcdf8f5d48f5ad79987c7a8170ce) | CC BY allows commercial use with attribution, but this is a different species from the lesson’s banyan. Rejected as an exact educational mapping. |
| Generic tropical tree | [Poly Haven catalog](https://polyhaven.com/models) | CC0 assets such as `tree_small_02` can support neutral scenery, but do not identify a local species and cannot close a species-specific lesson gap. |
| General bamboo specimen | [Pixor — Bamboo](https://pixor.art/en/library/trees/bamboo/) | CC0 GLB; imported at `public/models/bamboo_botany_01/bamboo.glb`. 2,348 triangles, 380.6 KB, includes a sway clip. The authored clip now plays in the Life world and is suppressed for reduced-motion users. Good enough to replace the bamboo procedural figure; intentionally not described as a specific regional species or as photorealistic. |
| Rice plant (`Oryza sativa`) | [Sketchfab — Rice, Oryza sativa](https://sketchfab.com/3d-models/cc0-rice-oryza-sativa-c6715ec94cee4abfb6edbfaaa4390bea) | Listing says CC0 and is the exact crop, but its official download endpoint returned HTTP 401 without authentication. No access gate was bypassed and no asset was imported. |
| Bengal tiger | [3DAssets.dev — Bengal tiger, prowling](https://3dassets.dev/assets/exotic-wildlife-hd-bengal-tiger-prowling-b1de9790) | Search-indexed listing describes the model as CC0 and links to a hosted GLB, but the source and CDN were unavailable to this environment during this pass (503/DNS failure). The file and visual quality therefore remain unverified; do not map it until both are independently checked. |

## Next acquisition brief

For the next asset, prefer a locally recognizable whole plant with leaf, bark,
and fruit/flower details useful at close range. Require:

- exact botanical identity confirmed by the source or a curator;
- CC0 or explicit commercial reuse rights compatible with embedding in a
  commercial website (not a license that only permits rendering the model in a
  finished image/video);
- a downloadable GLB/glTF with permission to redistribute as part of a web
  experience, or written permission from the creator;
- a mobile-friendly optimized version, with original source retained and a
  record of any geometry/texture modifications;
- visual acceptance captures at 360×800 and 1440×900, including intact and
  close-up states, plus a measured asset payload.

Do not purchase a candidate, treat a missing license label as permission, or
reuse an expiring signed download URL as the source record. If a licensed model
is not available, keep that lesson explicitly on the needs-assets list rather
than presenting a different species as the answer.

## Verification in this pass

- `npm run audit:model-coverage`: reports 36/223 licensed object/example
  mappings and 65 exact-object entries still awaiting a suitable licensed
  model.
- `npm run check`: passed with 0 errors, warnings, or hints.
- `npm run test:licensed-models`: passed 30 registered model states at mobile
  and desktop; each expected asset parsed and attached to its scene.
- `npm run test:world-render`: passed all 11 worlds at mobile and desktop; the
  WebGL canvas mounted and tested controls ran.
- Bamboo visual captures: `licensed-models/desktop-life-bamboo.png` and
  `licensed-models/mobile-life-bamboo.png`. The model loads and is identifiable,
  but should be considered an interim coverage improvement, not a final
  photorealism-quality acceptance.

These checks establish loader/render health for registered models. They do not
mean all real-world objects have exact models or that every model has passed
human visual acceptance.

## Follow-up: animal-class specimens — 2026-10-17

Added distinct, source-documented GLBs for the broad **bird**, **reptile**, and
**amphibian** classification lessons, alongside the previously added red-fox
mammal example. These are not substitutions in `life:বাংলাদেশের প্রাণী`; that
country-specific list remains unchanged because a nonlocal species must not be
shown as Bangladeshi wildlife.

| Lesson example | Model and source | License / role | Visual and content limits |
| --- | --- | --- | --- |
| Mammal | [Red Fox — 1DesignTool](https://1designtool.com/3d/models/red-fox) | Commercial website embedding permitted by [1DesignTool terms](https://1designtool.com/3d/license); representative class specimen only | Static, generated geometry/textures with fur cards; not photogrammetry; described explicitly as not a Bangladesh-fauna claim. |
| Reptile / cold-blooded example | [Panther Chameleon — 1DesignTool](https://1designtool.com/3d/models/panther-chameleon) | Same terms; class specimen only | Static, code-built PBR model; not photogrammetry; explicitly non-Bangladeshi. Its independent-eye fact links to the [Smithsonian National Zoo](https://nationalzoo.si.edu/animals/news/new-zoo-meet-mellers-chameleon). |
| Bird | [Indian Peafowl — 1DesignTool](https://1designtool.com/3d/models/indian-peacock) | Same terms; general bird-class example, not the local Doel | Static, generated geometry/textures; mobile framing needs continued monitoring because the creator warns that the display fan may crop at 390 px. Eyespot fact links to [San Diego Zoo](https://animals.sandiegozoo.org/animals/peafowl). |
| Amphibian | [Axolotl — 1DesignTool](https://1designtool.com/3d/models/axolotl) | Same terms; general amphibian-class example only | Static, generated geometry/textures; source notes seams and a flat translucent fin; explicitly not a Bangladesh-fauna example. External-gill fact links to [San Diego Zoo](https://animals.sandiegozoo.org/animals/axolotl). |

The source's commercial license allows models embedded in websites/products but
prohibits standalone file or model-pack redistribution. The site exposes the
model/source note only when that specimen is selected; no model is included in
the paid printable download.

The Khronos low-poly fox and mosquito-in-amber candidate were removed from the
public model directory after visual testing: the first did not meet the target
quality, and the second rendered as an opaque/milky amber mass with no readable
insect. Their rejected candidate files were moved outside the repository and
the obsolete download script/credit were removed.

### Verification in this follow-up

- `npm run audit:model-coverage`: 40/223 licensed exact-object/example mappings;
  61 concrete exact-object mappings remain. This is not a claim of sitewide
  realism: the exact Bangladesh-wildlife list and most local plants, spices,
  Bengali dishes, insects, and measurement tools still need their own assets.
- `npm run audit:model-rights`: 49 GLB/glTF files have local source/license
  records.
- `npm run check`: 0 errors, 0 warnings, 0 hints.
- `npm run build`: passed; a fresh Wrangler preview was started from the build.
- `npm run test:licensed-models` against that preview: passed 34 registered
  model states at desktop (1440×900) and mobile (390×844), including the
  fox, peafowl, chameleon, and axolotl selection/fact checks.
- Desktop and mobile captures of the rotated axolotl were reviewed. The animal
  now reads side-on rather than as an end-on pink shape; it remains small in the
  wide overview because the shared scene keeps surrounding examples visible.
- Rice-model candidate: the listing claims CC0, but the CDN lookup failed with
  DNS resolution errors in this environment. It was not downloaded, mapped, or
  counted; the unusable acquisition script was removed. This preserves the
  existing 40/223 coverage count rather than silently accepting an unverified
  model.

These results prove the currently registered assets render and the four new
animal-class examples display their documented facts. They do not complete the
61 exact-object gaps or meet the requested sitewide realism target. In
particular, the Bangladesh animal list, most named local plants, spices, and
Bangladeshi dishes remain without exact licensed models. The external listing
for a CC0 Bengal tiger was inspected, but its source CDN was also unavailable;
it remains a candidate, not an integrated asset.

### Follow-up: source recheck — 2026-10-17

Rechecked open collections and the currently available browser session before
adding any more files. This follow-up did not add or map an asset: each exact
candidate was either the wrong object, gated, unverified, or below the
photorealism bar.

| Candidate | Evidence found | Decision |
| --- | --- | --- |
| [Sketchfab — Rice, *Oryza sativa*](https://sketchfab.com/3d-models/cc0-rice-oryza-sativa-c6715ec94cee4abfb6edbfaaa4390bea) | The page identifies the species and CC0; its viewer reports 95.7k triangles. Selecting the download action presents a Sketchfab login form in the available Chrome session. | Do not bypass the account gate or reuse a guessed download endpoint. Keep as a high-priority exact rice-plant candidate; resume after the owner restores the signed-in Sketchfab session or supplies a permitted file. |
| [Smithsonian — *Elephas maximus*](https://3d.si.edu/object/3d/elephas-maximus%3Aebcd7a7d-4f5b-4daa-807b-e384c56ea286) | Smithsonian search metadata offers GLB derivatives, and its page describes Open Access reuse. The official medium preview depicts an isolated ridged, tooth-like specimen, not a whole living elephant. | Reject for the Bangladesh animal tile. The taxon title alone is not enough to claim that the file depicts a whole elephant. |
| [3DAssets.dev — Jungle and Rainforest Animals](https://3dassets.dev/packs/rainforest-and-jungle-fauna) | Search listing advertises a CC0 pack and says all 40 files were AI-assisted; the tiger is listed around 5.5k triangles. A direct check of the source page returned HTTP 503. | Not integrated: the source file and visual quality cannot be verified, and the listing does not meet the requested realism bar on its own. |
| [Pixabay — Jackfruit, Fruit, Tropical](https://pixabay.com/3d-models/jackfruit-fruit-tropical-botanical-1803/) | Listing identifies a GLB under Pixabay’s Content License and says it is AI-generated. Visual preview is a cut fruit with a simplified radial interior; it is a fruit model, not a jackfruit tree. | Reject for this realism pass: it does not meet the requested realistic look and cannot close the jackfruit plant/tree mapping. |
| [Free3D Online — Bengal tiger](https://free3d.online/model/5868572-realistic-bengal-tiger-3d-model-with-detailed-textures) | Search listing advertises direct formats but does not expose a verifiable rights grant for embedding in Posora. | Reject until the asset-specific license and creator rights are clearly established. |

The Smithsonian API search also returned unrelated specimens for broad text
queries such as “banyan,” “mangrove,” and “Bengal tiger”; those are not treated
as matches. The direct model preview was visually checked rather than trusting
the taxon/title field alone. The official Smithsonian 3D API documentation is
at <https://3d-api.si.edu/api-docs/>; the institution’s Open Access FAQ states
that assets marked CC0 can be used, transformed, and shared, while asset-level
rights metadata should still be checked.

### Current verified state

- `npm run audit:model-coverage` currently reports **40/223** licensed exact
  object/example mappings and **61** exact-object mappings still awaiting a
  suitable asset. Earlier 36/223 and 65-entry figures in this document are
  historical snapshots, not the current count.
- The remaining exact-object backlog still spans named Bangladesh plants and
  wildlife, medicinal plants/spices, food spices and Bengali dishes, and four
  measurement instruments. No new candidate above closes those gaps.
- Current Chrome shows a Sketchfab login gate for the CC0 rice model. I did not
  enter credentials, trigger third-party sign-in, or download through an
  alternate endpoint.

### Follow-up: supplied rice model and class-example verification — 2026-10-17

The owner subsequently supplied the exact CC0 *Oryza sativa* GLB. It is now
recorded under `public/models/rice_oryza_sativa_01/` and mapped to the paddy
plant and agriculture lessons, not to cooked rice. Its own README and manifest
contain the source, license, hash, and technical details. Desktop/mobile
captures and the licensed-model smoke pass verified both placements.

Three broad classification tiles now reuse already licensed, clearly identified
examples: red fox for vertebrate, panther chameleon for cold-blooded animal,
and Indian peafowl for warm-blooded animal. Their lesson copy says explicitly
that these are examples rather than depictions of an entire animal class, and
the selected-object source notes now appear for these tiles too. A browser test
initially caught the hidden fox credit; the credit conditions were fixed and
the Life smoke suite then passed all 11 registered model states at desktop and
mobile sizes.

`npm run audit:model-coverage` now reports **45/223** licensed exact-object or
example mappings and **57** concrete exact-object gaps. The latter are not
closed by changing labels: Bangladesh wildlife, most named plants, spices,
instruments, and Bengali dishes still require accurate, rights-cleared assets.
Sketchfab's official download API requires a signed-in account; the available
Chrome session displayed a login gate during this pass. Smithsonian Open Access
was queried for the remaining terms, but its results were either absent or
specimens/objects different from the whole lesson subject. No new unsuitable
model was mapped merely to increase the coverage count.

The public Sketchfab metadata search surfaced candidates worth inspecting
*after* authenticated access is restored. A search result is not proof that
the geometry depicts the correct whole subject or meets the visual bar:

| Lesson candidate | Public listing | Metadata evidence | Remaining gate |
| --- | --- | --- | --- |
| Kingfisher | [White-throated Kingfisher](https://sketchfab.com/3d-models/white-throated-kingfisher-eb654151f2d54b3a89169af96da09f89) | CC BY 4.0; creator describes a scanned *Halcyon smyrnensis*, 499k faces | Completed below; displayed as a taxidermy specimen scan, not a live bird. |
| Aloe vera | [Aloe vera plant](https://sketchfab.com/3d-models/aloe-vera-plant-66c6699e50ab4863989777f920a981dd) | Downloadable listing, CC BY, about 219k faces | Inspect visual fidelity and actual botanical identity; retain creator attribution. |
| Turmeric root | [Turmeric root (*Curcuma longa*)](https://sketchfab.com/3d-models/turmeric-root-curcuma-longa-d0755c2c95194946925c45993e8339c9) | Downloadable listing, CC BY, about 92k faces | Inspect geometry and ensure the root is not presented as a whole growing plant. |
| Neem | [Neem Tree](https://sketchfab.com/3d-models/neem-tree-03edef8009d942d3a3db6fa64cecbe56) | Downloadable listing, CC BY, about 256k faces | Verify species and mobile performance; source may be too dense. |

The official [Sketchfab Download API documentation](https://sketchfab.com/developers/download-api/downloading-models)
states that the downloading user must be signed in; creator, source and
license attribution is required under its [guidelines](https://sketchfab.com/developers/download-api/guidelines).

### Follow-up: signed-in source acquisition — 2026-10-18

The owner's Sketchfab account was signed in and the site offered its normal
licensed downloads. I inspected each source page and visual preview before
using a file. Two CC BY 4.0 scans were optimized, attributed on the lesson
page, and tested at desktop and mobile sizes:

| Lesson | Source | Web derivative | Test result |
| --- | --- | --- | --- |
| Life → ঔষধি ও মশলা গাছ → অ্যালোভেরা | [matousekfoto, Aloe vera plant](https://sketchfab.com/3d-models/aloe-vera-plant-66c6699e50ab4863989777f920a981dd) | `public/models/aloe_vera_scan_01/aloe-vera.glb`, 4.03 MB | Licensed-model smoke passed at 1440×900 and 390×844; both screenshots inspected. |
| Food → মশলার জগৎ → হলুদ | [Keeszify, Turmeric root](https://sketchfab.com/3d-models/turmeric-root-curcuma-longa-d0755c2c95194946925c45993e8339c9) | `public/models/turmeric_root_scan_01/turmeric-root.glb`, 2.28 MB | Licensed-model smoke passed at 1440×900 and 390×844; both screenshots inspected. The lesson explicitly calls it a raw rhizome, not a plant or powder. |

Each asset directory has its own source/license manifest and original/download
hashes. `npm run audit:model-coverage` now reports **47/223** licensed exact
object/example mappings and **55** exact-object gaps. The other 176 tiles
include teaching diagrams and broad examples; that count must not be used to
claim they all need literal whole-object scans.

The [Neem Tree](https://sketchfab.com/3d-models/neem-tree-03edef8009d942d3a3db6fa64cecbe56)
is CC BY but 2.3 million triangles and the source viewer itself warns that it
is too heavy for the device, so it remains unmapped.

One additional instrument is now mapped: [mantledmoon, Soviet Stopwatch](https://sketchfab.com/3d-models/soviet-stopwatch-ba815c83278e4271a92fcc018188664c),
a CC BY 4.0 1K GLB at 3.11 MB, appears in Discovery → পরিমাপের যন্ত্র →
স্টপওয়াচ. Initial desktop/mobile rendering exposed its flat-on-floor
orientation; a per-model X rotation was added to the shared licensed-model
loader and propagated through the collection/hero callers. Rebuilt desktop
and mobile screenshots now show the dial facing the viewer; visible attribution
and both responsive smoke cases pass. The site describes it as an older
mechanical example, not the only form of stopwatch. Current coverage is
**48/223**, with **54** concrete exact-object gaps remaining.

The next Food spice candidate is [sfsen, 3d scanned Cinnamon stick](https://sketchfab.com/3d-models/3d-scanned-cinnamon-stick-013e3d5b3dd0483ba74e7abc1343a7d8),
CC BY 4.0. Its 1K GLB was simplified from 82,562 to about 33,024
triangles (3.13 MB to 1.33 MB), retaining the embedded texture. It is mapped
only to Food → মশলার জগৎ → দারুচিনি as a *dried stick*, not the living tree,
leaf, or ground powder. The lesson has visible creator/license/identity credit;
desktop and 390px mobile screenshots were inspected and the model loaded in
both. The rights record and both file hashes are in
`public/models/cinnamon_stick_scan_01/`. The coverage audit now reports
**49/223** licensed exact-object/example mappings and **53** concrete
exact-object gaps.

[Muhammad Azim's red-chili photogrammetry scan](https://sketchfab.com/3d-models/red-chilli-3d-scan-agisoftnaturechallenge-92b1bb0824ab4a238c5ec899729067b8)
was also licensed CC BY 4.0 and mapped to Food → মশলার জগৎ → মরিচ.
Eight source textures were reduced from 1K to 512px to lower compressed
transfer from 2.44 MB to 0.99 MB and reduce mobile GPU texture demand.
The detailed dried red pepper reads clearly in both desktop and 390px mobile
screenshots; both targeted smoke cases passed with visible attribution. This
is explicitly a fruit specimen, not a living plant. Current coverage is
**50/223** licensed exact-object/example mappings with **52** concrete
exact-object gaps remaining.

### Follow-up: white-throated kingfisher — 2026-10-18

The RISD Nature Lab [White-throated Kingfisher](https://sketchfab.com/3d-models/white-throated-kingfisher-eb654151f2d54b3a89169af96da09f89)
scan is now mapped to Life → বাংলাদেশের প্রাণী → মাছরাঙা. The source is an
Artec Spider scan of a taxidermy specimen, CC BY 4.0; it is not presented as a
live bird. The 55.46 MB, roughly 499k-face source had little response to mesh
simplification, so the web derivative preserves the scan geometry, downsizes
textures to 512px, and uses Meshopt compression (9.42 MB). The source creator,
RISD Nature Lab, license, and specimen caveat are shown beside the interactive
view. Desktop and 390px mobile captures were visually inspected. A targeted
smoke test confirms the asset parses and attaches at both breakpoints. This
also required `wasm-unsafe-eval` in the mirrored CSP policies for WebAssembly
Meshopt decoding; JavaScript `eval` remains disallowed. The full 45-state
desktop/mobile licensed-model smoke suite passed; the kingfisher's desktop and
mobile captures were inspected, and the focused test confirms selecting its
close-up exposes the item-specific explanation and fun fact. Current coverage
is **51/223** licensed
exact-object/example mappings with **51** concrete exact-object gaps remaining.

The [Banyan Tree of NCKU](https://sketchfab.com/3d-models/banyan-tree-of-ncku-692965e4f7e54f57abffb60ba6b3fb27)
was inspected as a possible exact banyan replacement (CC BY, 189.5k triangles).
It was rejected: the source page provides no species/identity notes beyond its
title, its viewer reports the model as too heavy, and its rendered tree is a
tiny fragment in a wide scene. A technically licensable file is not enough to
meet the identity and presentation bar.

Two more animal candidates were rejected after local desktop/mobile renders.
The first WebP/specular-glossiness derivative of Pasha's [Realistic bee](https://sketchfab.com/3d-models/realistic-bee-0ea8f5f4a2a5496aa177faf637868443)
rendered pale and undersized against the other specimens. Cleo3D's
[Honey Bee](https://sketchfab.com/3d-models/honey-bee-aec20ef738a04b4284782443ccdcd0c5)
has 1.3M triangles, and its creator says it is a sculpture made without
textures; that candidate is not a good fit for a clear, child-friendly
natural-history example. The Pasha model is revisited below with a corrected
PBR pipeline and browser-verified source colors.

The supplied [Collared kingfisher](https://sketchfab.com/3d-models/collared-kingfisher-5eb8eefc6f6d44959b750ecccf43d413)
GLB has sound CC BY metadata and identifies *Todiramphus chloris*, but the
local render placed the horizontal specimen directly on the floor, where it
read as a fallen bird rather than a clear specimen. It was not shipped. The
existing peafowl remains the stronger generic bird-class visual; the separate
white-throated kingfisher remains the Bangladesh-fauna example. These checks
prevented three licensed-but-poorly-presented assets from becoming regressions.

### Follow-up: browser-corrected animated bee — 2026-10-18

Reprocessed the Pasha/Irfan CC BY bee from the downloaded 1K GLB after visual
testing exposed that its specular-glossiness + WebP output appeared white in
Three.js. Converting the source materials to metallic/roughness PBR, using
512px PNG maps, and keeping Meshopt-compressed geometry/animation produces a
1.66 MB derivative with the original black/yellow markings intact. Desktop and
390px mobile browser captures verify the markings, selected-object fact, and
both creator credits. The model is still used only as a generic insect example,
never as the Bangladesh-specific honeybee. The separately reviewed Cleo3D
sculpture remains rejected because its author notes the lack of textures.

Other candidates were not forced into mismatched slots: the RISD Nature Lab
jackfruit pod is an accurate fruit scan but not a jackfruit-tree model, while a
Natural History Museum Vienna jackfruit scan is CC BY-NC and unsuitable for the
site's commercial context. The current coverage audit reports **54/223**
licensed exact-object/example mappings and **48** concrete exact-object gaps;
the detailed live list comes from `npm run audit:model-coverage`.

### Follow-up: neem tree and tulsi candidates — 2026-10-18

Added Rohit Pawar's [Neem Tree](https://sketchfab.com/3d-models/neem-tree-03edef8009d942d3a3db6fa64cecbe56),
which the Sketchfab page labels CC BY 4.0 and identifies in the creator's
description. The signed-in download is a 152 MB 1K GLB. It was reduced to a
444,908-byte web derivative with four mesh definitions, GPU-instanced canopy
geometry, Meshopt geometry compression, and a 512×512 WebP texture. It replaces
only the neem object in Life → ঔষধি ও মশলা গাছ and carries visible creator and
license credit. The new desktop/mobile captures are
`licensed-models/desktop-life-neem-tree.png` and
`licensed-models/mobile-life-neem-tree.png`. The 46-state licensed-model suite
passed at desktop/mobile; an additional focused test confirms the Neem
close-up's description/fact and the visible credit at both sizes.

Two Tulsi candidates were reviewed but not mapped. Anandjha2499's [“a cloesup
shot of tulsi plant”](https://sketchfab.com/3d-models/a-cloesup-shot-of-tulsi-plant-cfa1d5a4e84e4094937c79cd2e7c2c9d)
is explicitly AI-generated, so the plant's species-specific morphology could
not be treated as verified. Teju1's [“Tulsi plant”](https://sketchfab.com/3d-models/tulsi-plant-1c97b112900b4203bd30db4cf88447ce)
has a CC BY 4.0 listing but no identity or geometry notes; the creator's page
comment asks for someone to add color, and its preview was unavailable in the
active viewer. It does not meet the visual/identity acceptance bar. Neither
model is used.

### Follow-up: oral thermometer — 2026-10-18

Added Medical.Gallery Graphics' [Thermometer](https://sketchfab.com/3d-models/thermometer-5ef4251b270c4997aca6931a094f9621)
to Discovery → পরিমাপের যন্ত্র → থার্মোমিটার. Sketchfab labels it a
“Non-digital oral thermometer,” reports about 3,000 triangles/1,600 vertices,
and the download dialog confirms CC BY 4.0 with commercial use allowed when
credited. Used the 1K GLB converted file (99 KB; source hash recorded in its
asset manifest); no further processing was needed for the web budget. The
visible Bengali attribution explicitly says this is a clinical/oral example,
not a weather or digital thermometer.

Focused Playwright WebGL smoke passed on 1440×900 desktop and 390×844 mobile;
the item loaded its local asset, attribution was visible, and opening the
detail slider revealed the thermometer-specific explanation and fact. Visual
captures are `licensed-models/desktop-discovery-oral-thermometer.png` and
`licensed-models/mobile-discovery-oral-thermometer.png`; both were reviewed.

### Follow-up: animated insect example — 2026-10-18

Added Pasha's [Realistic bee](https://sketchfab.com/3d-models/realistic-bee-0ea8f5f4a2a5496aa177faf637868443)
to Life → প্রাণীর শ্রেণি → পতঙ্গ only. Its description links the original
[Bee by Irfan](https://sketchfab.com/3d-models/bee-7a43e360d7ac4f9a8006733b0589c9a4),
which independently shows CC BY 4.0; both listings are linked/credited in the
UI. The model remains a general insect example—not a claim about Bangladesh's
specific honeybee species. Its 1K converted GLB is 1.66 MB after reducing
geometry, converting specular/glossiness to metallic/roughness PBR, and keeping
four 512px PNG maps plus Meshopt-compressed geometry/animation. The earlier
682 KB WebP derivative rendered white in the actual Three.js scene; desktop and
mobile captures now show the source's yellow/black markings. All three authored
clips remain available, while Posora selects only `_bee_hover`, rather than
blending its mutually exclusive idle and take-off animations.

`npm run audit:model-coverage` now reports **52/223** licensed exact-object or
example mappings and **50** concrete exact-object gaps. The detailed list is
generated by the command; the earlier counts above remain historical snapshots.

### Follow-up: octopus specimen — 2026-10-18

Added rayleighsyafiq's [Octopus](https://sketchfab.com/3d-models/octopus-d08195133942442dae870ede04e3d7f1)
as an explicitly general invertebrate specimen in Life → প্রাণীর শ্রেণি →
অমেরুদণ্ডী. The Sketchfab page identifies CC BY and permits commercial use
with attribution. The 1K source GLB was converted from specular/glossiness to
metallic/roughness PBR, resized to 512px WebP maps, then visually checked in
Three.js. The optimized derivative is 1.39 MB (58,912 triangles); its source
and derivative hashes, author, license, processing, and limitations are in
`public/models/octopus_scan_01/asset-manifest.json`. The UI credits the creator,
states that this is an example and not a Bangladesh-specific species claim,
and links Smithsonian Ocean for the eight-arm/sucker fact. Focused desktop and
390px mobile smoke tests passed; the red/brown specimen and attribution panel
were visually inspected in both captures. The coverage audit now reports
**55/223** exact-object/example mappings and **47** remaining concrete gaps.

The first 2.8 MB Meshopt derivative of the CC0 [Water Lily, Nymphaea cv.](https://sketchfab.com/3d-models/cc0-water-lily-nymphaea-cv-e7830f486a0248b6b894f3e7a63b8c16)
was rejected after its output showed scan debris and a flower too small to read.
That rejection applied to that derivative, not the source model forever. On
2026-10-19 a fresh derivative was produced from the owner's 84.18 MB downloaded
GLB, rebuilt with the source textures resized and encoded for the web, then tested
again at desktop and mobile. The current 8.27 MB asset is accepted as a genus-level
visual example for শাপলা, with a visible credit stating that it is not a verified
local Bangladesh cultivar. The current file, processing details, and SHA-256 are
recorded in `public/models/water_lily_nymphaea_01/asset-manifest.json`; desktop and
mobile smoke evidence is in `evidence/licensed-models/`.

Additional candidates reviewed during this follow-up were rejected rather than
imported: Sketchfab's 2M-triangle Turmeric preview renders as a tiny speck and
has no model description; the downloadable NCKU banyan scan is actually a
campus-scale multi-tree scene; another CC BY banyan listing is visibly a
simplified flat-canopy figure; the jackfruit-tree Sketchfab listing did not
show a free-download control or a confirmed open license; and the available
hilsa search results were generic fish or paid/editorial assets. None meets
the exact-object, visual-quality, and redistribution checks together. The
evidence for these listings is their current source page, not an assertion that
they are unusable for every purpose.
## Tulsi candidate review — 2026-10-19

- Candidate: [Sketchfab — “a cloesup shot of tulsi plant”](https://sketchfab.com/3d-models/a-cloesup-shot-of-tulsi-plant-cfa1d5a4e84e4094937c79cd2e7c2c9d), by anandjha2499; CC BY 4.0, commercial use permitted with attribution. The listing identifies it as generated with Meshy AI.
- Downloaded converted 1K GLB (1,404,184 bytes; 9,783 triangles) and tested it using the site's licensed-model smoke test at desktop (1440×900) and mobile (390×844). Both parsers attached the model and produced captures.
- Rejected after visual review. The pale yellow-green geometry is spindly and visually inconsistent, with distracting foliage clusters and poor separation from surrounding objects. The small file size does not resolve the source viewer's “too heavy” warning, and the resulting appearance does not meet the realism target.
- Decision: did not integrate. Existing Tulsi presentation remains unchanged until a visually reviewed, botanically credible candidate is found.

## Tiger candidate — 2026-10-19

- Candidate: [Sketchfab — Running Tiger](https://sketchfab.com/3d-models/running-tiger-fc2c7fd74dd04e39935803b884c77258), by Amil (francescolima74), CC BY 4.0. The source viewer shows a textured, animated tiger and lists a 1-second “Run” clip.
- The converted 1K GLB is 1,996,448 bytes with an embedded 1024×1024 texture and about 4.7k triangles. It is integrated as an animated tiger example, not represented as a verified Bengal subspecies; the visible credit says so.
- Posora desktop/mobile screenshots were reviewed after the smoke test passed at 1440×900 and 390×844. The tiger is clearly visible in both layouts; the 1-second run cycle changes pose in the live browser. Accepted as an illustrative tiger model, with the source's subspecies limitation disclosed in the visible credit. It must not be used as evidence that this particular scan is a verified Bengal tiger.

## Collared kingfisher candidate review — 2026-10-19

- Candidate: [Sketchfab — Collared kingfisher](https://sketchfab.com/3d-models/collared-kingfisher-5eb8eefc6f6d44959b750ecccf43d413), by itsmerolfzurc, CC BY 4.0. The downloaded GLB embeds the same author, source, title, and license metadata; Bangladesh Forest Department's bird Red List confirms the species is present in Bangladesh.
- Desktop and 390px mobile model-smoke tests confirmed parsing and attachment. Visual review rejected it: the source's orientation/pose placed the bird flat across the stage; a runtime rotation made the image foreshortened and unclear. It does not meet the usable educational-pose bar, so the existing upright white-throated kingfisher remains in use.
- Evidence remains in `evidence/licensed-models/desktop-life-collared-kingfisher.png` and `mobile-life-collared-kingfisher.png`. The test asset was removed from the production bundle; the original download in the owner's Downloads folder was not changed.

## Asian elephant candidate review — 2026-10-19

- Candidate: [Sketchfab — “elephant 3d model”](https://sketchfab.com/3d-models/elephant-3d-model-ce31a3a272c04287ae95bae738de67c9), by grodan; Sketchfab marks it CC BY 4.0 and the download panel explicitly permits commercial use with attribution. The creator identifies it as an AI-generated female Asian elephant (*Elephas maximus*).
- The source viewer reports 860k triangles and warns that the model is too heavy for the current device; its visible render is a very small, distant figure. Although the species is a plausible broad match for the Bangladesh elephant lesson, the page preview alone is insufficient to judge texture/anatomical quality after optimization.
- Decision: not integrated. It needs a local optimized desktop/mobile review before acceptance; this entry records a candidate, not an approved asset or a claim that the downloaded file is in the repository.

## Jackfruit tree candidate review — 2026-10-19

- Candidate: [Sketchfab — “Jackfruit Tree 3D Model”](https://sketchfab.com/3d-models/jackfruit-tree-3d-model-ee10cbb8ae864ae7a2b11654957bc986), by hkhalif. The model description claims a detailed tropical jackfruit tree with trunk, foliage and fruit; the viewer reports about 780k triangles.
- The signed-in model page exposes no download action or license statement. Without a clear redistribution/embedding license and accessible source file, it cannot be used in Posora even if its subject appears suitable.
- Decision: not integrated. Treat the jackfruit gap as open; do not infer permission from “free” or from a model page being publicly viewable.

## Asian elephant accepted model — 2026-10-19

- Candidate: [Sketchfab — Asian Elephant](https://sketchfab.com/3d-models/asian-elephant-2a7007e8bd2f45b89d1cc6ff75c5fed4), by planeta-elefante. The signed-in download dialog identifies CC BY 4.0 and explicitly permits commercial use with attribution.
- The 1K converted GLB arrived with three unrelated Scots-pine rigs included in the scene. Their bounds shrank the elephant to a tiny speck in Posora. `scripts/clean-asian-elephant-glb.mjs` detaches those three named scene branches while preserving the elephant meshes, textures, rig, and clips; the edit is recorded in the local model manifest and visible site credit.
- Integrated as Life → বাংলাদেশের প্রাণী → হাতি. It is identified as an Asian elephant (*Elephas maximus*), not a specific Bangladesh subspecies. Posora plays the authored `Idle` clip; movement and spray clips are not presented as happening in the lesson.
- The focused Playwright test passed at 1440×900 desktop and 390×844 mobile: the GLB parsed, the idle clip played, credit appeared, and opening the exploded-view slider showed the elephant-specific explanation and matriarchal-group fact. Desktop and mobile captures were visually reviewed at `licensed-models/desktop-life-asian-elephant.png` and `mobile-life-asian-elephant.png`.
- Rejected alternative: NHMW Vienna's [Jackfruit model scan](https://sketchfab.com/3d-models/jackfruit-nhmw-afw-ding-0046-010-93e723616eb244a5a7142038615e74d5) is CC BY-NC and therefore not suitable for Posora's commercial product. A CC BY “Stylized Fruit Lowpoly Free Pack” lists jackfruit among its contents, but its stated low-poly/stylized presentation fails the realism requirement. Jackfruit remains an open gap.

## Additional candidate review — 2026-10-19

- [Prakash.Chatterjee — Tulsi Tree on a cement tub](https://sketchfab.com/3d-models/tulsi-tree-on-a-cement-tub-29e20a3ac415461fa12930d04282163c) is listed CC BY 4.0; the signed-in download panel says commercial use is allowed with attribution. The listing reports 86.9k triangles. Its preview showed a very sparse, thin plant in a cement tub, and the Sketchfab viewer warned it was too heavy to render on the current device. It does not provide a strong, legible close-up Tulsi specimen for the lesson, so it was not integrated.
- [Pixabay — Jackfruit, Fruit, Tropical](https://pixabay.com/3d-models/jackfruit-fruit-tropical-botanical-1803/) is downloadable as GLB under the [Pixabay Content License](https://pixabay.com/service/license-summary/), but the listing marks it AI-generated and describes it as a cut fruit. The rendered cut surface has regular citrus-like radial segmentation rather than recognizable jackfruit bulbs and fibrous core. It is rejected as a misleading jackfruit representation; its title and permissive content license do not establish biological accuracy.
- [Natural History Museum Vienna — Jackfruit scan](https://sketchfab.com/3d-models/jackfruit-nhmw-afw-ding-0046-010-93e723616eb244a5a7142038615e74d5) remains unsuitable because its license is CC BY-NC, which does not permit this commercial use.

No Tulsi or jackfruit mapping was changed in that pass. Its figures are historical. The current source-of-truth count is generated by `npm run audit:model-coverage`.

## Life plant-part models and current audit — 2026-10-19

- The accepted water-lily visual example is mapped to Life → বাংলাদেশের গাছপালা → শাপলা. Focused smoke checks confirmed the GLB request, attached model, visible source/license and local-cultivar caveat, and item-specific fact panel at desktop (1440×900) and mobile (390×844).
- The existing CC BY 4.0 turmeric-root and cinnamon-stick scans are now also used in Life → ঔষধি ও মশলা গাছ, because those lesson entries explicitly teach the rhizome and bark/spice parts. Visible credits and model manifests explicitly say these are harvested plant parts, not whole living plants. Focused checks confirmed the rendered assets, visible attribution, and item-specific exploded-view explanations at desktop and mobile.
- Visual evidence: `evidence/licensed-models/desktop-life-shapla-water-lily.png`, `mobile-life-shapla-water-lily.png`, `desktop-life-turmeric-rhizome.png`, `mobile-life-turmeric-rhizome.png`, `desktop-life-cinnamon-bark.png`, and `mobile-life-cinnamon-bark.png`.
- Historical audit after these mappings: **61/222** licensed exact-object/example mappings; **41** concrete exact-object gaps. `npm run audit:model-rights` passed for 63 local GLB/glTF assets at that time. These checks do not mean all world assets are complete, and they are not a deployment sign-off.

## Krishnachura tree specimen — 2026-10-19

- Candidate: [PlantCatalog — Realistic HD Royal poinciana (15/40)](https://sketchfab.com/3d-models/realistic-hd-royal-poinciana-1540-9d44b435434942e283adb0754e5403dd), identified by the creator as *Delonix regia*. The signed-in Sketchfab download panel lists CC BY 4.0 and explicitly says commercial use is allowed with creator credit. The source describes an old, thriving 5.1 m specimen exported at 40% mesh resolution and 394.3k triangles.
- Accepted as the species-specific visual example for Life → বাংলাদেশের গাছপালা → কৃষ্ণচূড়া. This is a static model from PlantCatalog, not a photogrammetry scan or an animated specimen; the lesson credit discloses that limitation. The source's spring flowering state is not asserted as year-round appearance.
- The 1K source GLB was 26.82 MB and produced a “too heavy” warning in Sketchfab's browser viewer. Local processing simplified its mesh to a 0.35 target ratio with 0.001 error tolerance, resized textures to 512 px/WebP, quantized geometry, and applied `EXT_meshopt_compression`, reducing it to 3.32 MB. The site already configures Three.js `MeshoptDecoder`.
- `gltf-transform validate` reported no errors or warnings for the quantized intermediate; smoke testing the final Meshopt asset passed at 1440×900 desktop and 390×844 mobile. Both screenshots were visually reviewed: the red-orange flowering canopy and branching trunk remain legible inside the scene, and the visible source/license note fits on mobile.
- Evidence: `evidence/licensed-models/desktop-life-krishnachura.png` and `mobile-life-krishnachura.png`; source and derivative hashes/modifications are in `public/models/krishnachura_delonix_01/asset-manifest.json`.
- Historical generated audit after this mapping: **62/222** licensed exact-object/example mappings; **40** concrete exact-object gaps remained. This is progress only, not a complete-world or deployment sign-off.

## Balance scale specimen — 2026-10-19

- Source: [Jean-Francois.Bonin — Balance Scale](https://sketchfab.com/3d-models/balance-scale-c880997ff2b3438c8e26600b57cf406b). The signed-in Sketchfab download panel identifies CC BY 4.0 and explicitly permits commercial use with attribution. The creator calls the object a “Legal Scale”; Posora uses it as an illustrative two-pan balance, not a calibrated instrument.
- Added to Discovery → পরিমাপের যন্ত্র → দাঁড়িপাল্লা. Its item-specific facts describe equal-arm balance and explicitly avoid implying precision or calibration.
- The 14.92 MB source was simplified toward a 0.45 mesh ratio, then Meshopt-compressed; final local GLB is 2.93 MB. Source/derivative hashes, transformations, and attribution are recorded in `public/models/balance_scale_01/asset-manifest.json`.
- Focused browser test passed at 1440×900 and 390×844, including model attachment, visible credit, and the balance-specific fact panel. Both images were visually reviewed: `evidence/licensed-models/desktop-discovery-balance-scale.png` and `mobile-discovery-balance-scale.png`.
- Historical generated audit after the balance mapping: **63/222** licensed exact-object/example mappings; **39** concrete exact-object gaps remained. The site is not ready for a “complete” or deployment claim while those gaps remained.

## Fried-fish scan candidate rejected — 2026-10-19

- Candidate: [wox080xow — Ikan Goreng](https://sketchfab.com/3d-models/ikan-goreng-833b9c3ec4284047ac0b4b5cc35e9928), CC BY 4.0 with commercial use and attribution. The author identifies it as Indonesian Ikan Goreng, not a Bangladeshi fish species or recipe.
- The optimized scan was rendered in Posora at desktop and mobile. Both captures showed a fragmented, very small tray-like object with the food split into unclear shapes. It failed the readability/close-up bar and was removed from the production mapping; the original download in Downloads was not changed.
- Evidence: `evidence/licensed-models/desktop-food-fried-fish-scan.png` and `mobile-food-fried-fish-scan.png`. The fried-fish gap remains open; do not count this candidate as an approved replacement.

## Banyan candidates rejected — 2026-10-19

- [National Cheng Kung University Museum — Banyan Tree of NCKU](https://sketchfab.com/3d-models/banyan-tree-of-ncku-692965e4f7e54f57abffb60ba6b3fb27) is CC BY 4.0 and downloadable, but its page preview is a broad campus/landscape scan with many trees rather than one legible banyan specimen; Sketchfab warns that the 189.5k-triangle model is too heavy to render on the current device.
- [eternatrees24 — Banyan Tree (1)](https://sketchfab.com/3d-models/banyan-tree-1-640252b028b341fda7c5569b2e5b5682) is CC BY 4.0 and downloadable, but its 191.4k-triangle preview is a tiny, low-detail stylized tree; Sketchfab also warns it is too heavy to render on the current device.
- [Dmytro Dokunov — Banyan Tree Goa](https://sketchfab.com/3d-models/banyan-tree-goa-c2c6d55237284c098fe6aa8504795cb5) is a scan of a bare cut trunk with no canopy, not a representative whole-tree specimen. No download control/license was available in the signed-in page.
- All three were rejected; the banyan gap remains open.

## Tulsi AI-generated model candidate rejected — 2026-10-19

- [anandjha2499 — “a cloesup shot of tulsi plant”](https://sketchfab.com/3d-models/a-cloesup-shot-of-tulsi-plant-cfa1d5a4e84e4094937c79cd2e7c2c9d) is downloadable under CC BY 4.0. The creator discloses it was generated with Meshy AI.
- Its Sketchfab preview shows a tiny sparse sprig without enough leaf/stem detail to teach Tulsi identification. It also receives a “too heavy” warning in Sketchfab despite only 9.8k triangles, making source preview quality suspect. The downloaded copy in Downloads was inspected but not integrated; the Tulsi gap remains open.

## Current audited state after candidate rejections — 2026-10-19

- `npm run audit:model-coverage`: **63/222** licensed exact-object/example mappings; **38** exact-object gaps remain. Rejected Ikan Goreng and Tulsi candidates are not counted.
- `npm run audit:model-rights`: passes for **65** local GLB/glTF files with source/license evidence.
- Build and Food pilot smoke pass. This remains an unfinished model-replacement backlog, not a sitewide deployment sign-off.

## Additional exact-object source checks — 2026-10-19

- **Cardamom bowl:** [go3452 — Cardamom Bowl](https://sketchfab.com/3d-models/cardamom-bowl-7e84837fa85c4b56b751f51dccb5aee0) is CC BY 4.0 and permits commercial use with attribution. The creator says it is Meshy AI generated; the viewer reports 240k triangles and displays a warning that it is too heavy to render on the current device. The source did not render sufficiently for a visual acceptance review, so it was not integrated or counted.
- **Bengal banyan:** [vivasm — Banyan Tree](https://www.meshy.ai/posts/019f2802-00dd-7aa4-b66d-aeb61da0f02c) is marked CC0 and the page preview shows a whole canopy with aerial roots. The geometry reports 1,178,256 faces. Download opens a Meshy account-creation prompt and requires continuing under its Terms of Use; no account was created or terms accepted. It remains a candidate, not a local asset.
- **Palmyra palm:** [PANDORAland — Borassus flabellifer](https://www.turbosquid.com/3d-models/3d-new-plant-high-detail-borassus-flabellifer-decorative-garden-2183034) is an exact-species four-tree scene and offers GLTF, but is listed at $5. No purchase was made; the exact Palmyra asset remains open pending an authorized purchase or free permissive source.
- **3D Warehouse:** its current official FAQ says that incorporating Warehouse models into a website for members is impermissible aggregation. The exact [Palmyra Palm (Borassus flabellifer)](https://embed-3dwarehouse-classic.sketchup.com/model/c09686f0b41de786693afe255d42a62a/Palmyra-Palm-Borassus-flabellifer) listing therefore was not used. See [SketchUp's FAQ](https://help.sketchup.com/cs/3d-warehouse/3d-warehouse-terms-use-faq#) (section “Can I incorporate models from 3D Warehouse into my website for use by my members?”).
- Exact searches for CC0/CC-BY GLBs for hilsa, doel, Ganges river dolphin, estuarine crocodile, Borassus, Sundari (*Heritiera fomes*), and nipa palm did not identify a verifiable free model suitable to integrate in this pass. Results without an actual downloadable model and compatible rights are not treated as assets.

The audited backlog is unchanged at **63/222** licensed exact-object/example mappings and **38** concrete gaps. `npm run audit:model-rights` still covers 65 local model files. No asset was added from the candidates above, so the prior build/smoke evidence remains the last code verification; this research pass does not authorize a deploy.

## Tulsi file recheck — 2026-10-19

The local download `/Users/shamim/Downloads/a_cloesup_shot_of_tulsi_plant.glb`
was rechecked against its embedded Sketchfab metadata (creator anandjha2499,
source URL, CC BY 4.0). A temporary integration confirmed that it parses and
renders, but the desktop/mobile captures still show the sparse, pale
AI-generated sprig described above. Technical load success is not visual or
botanical acceptance, so the temporary mapping and bundled copy were removed.
The inspection captures remain at `licensed-models/desktop-life-tulsi.png` and
`mobile-life-tulsi.png`; the asset in Downloads was left untouched. Tulsi stays
an open exact-object gap and is not counted as covered.

This recheck leaves the verified baseline at **63/222** licensed exact-object or
example mappings, **38** exact-object gaps, and **65** rights-recorded local
models. The temporary candidate run passed the general rendering smoke but is
not part of the production test matrix. This remains an unfinished backlog, not
a sitewide deployment sign-off.

## Final source check in this pass — 2026-10-19

- A public listing for an [aneroid barometer by 3DAssets.dev](https://3dassets.dev/assets/abandoned-weather-station-and-storm-shelter-aneroid-ba-b151829e)
  advertises CC0 and describes a static model with a dial and pointer. Its
  linked CDN could not be resolved in the local environment, and the publisher
  page could not be opened in the connected browser, so no file or geometry was
  verified and it remains a candidate only.
- A second [Tulsi listing by KISHORE KUMAR G](https://sketchfab.com/3d-models/tulsi-tree-9683aa7f8d1440bdae47adc6f5bee585)
  names *Ocimum tenuiflorum*, but the public listing did not show a license or
  downloadable model in the accessible search result. It is not integrated.
- The open-source search returned only generic fish for the Hilsa query and
  unrelated/insufficiently licensed food objects for the Bangladeshi-dish
  query. Generic fish cannot substitute for Hilsa; those searches close none of
  the remaining mappings.

No deployment was made. The remaining source availability and rights gaps still
need an exact licensed file, or an owner-approved paid source/account workflow,
before the sitewide asset replacement can be completed.

## Continuation — 2026-10-19

- Rechecked the exact [Jackfruit Tree 3D Model by hkhalif](https://sketchfab.com/3d-models/jackfruit-tree-3d-model-ee10cbb8ae864ae7a2b11654957bc986) while signed in. Its model inspector exposes a **Standard** paid license and a 239 MB download; the page reports 779.9k triangles, 36 materials, 45 textures, no PBR, and Sketchfab warns it is too heavy to render on this device. Do not download or use without an owner-approved purchase and an explicit review of the license/redistribution terms.
- Rechecked the exact [Borassus flabellifer male plant](https://free3d.com/3d-model/borassus_flabellifer_male-plant-4681.html) listing. It costs $16 and offers Maya/OBJ rather than a web-ready GLB; no purchase was made.
- The exact [Palmyra Palm in 3D Warehouse](https://embed-3dwarehouse-classic.sketchup.com/model/c09686f0b41de786693afe255d42a62a/Palmyra-Palm-Borassus-flabellifer) is 216 KB, but the previously checked official 3D Warehouse terms prohibit embedding member models as a website aggregation. It remains unusable for Posora.
- A fresh Sketchfab search for downloadable “Hilsa”/“ilish” surfaced generic fish, not a species-identified *Tenualosa ilisha* specimen. A generic fish remains an inaccurate replacement for the local species lesson.
- The downloaded [Ikan Goreng scan](https://sketchfab.com/3d-models/ikan-goreng-833b9c3ec4284047ac0b4b5cc35e9928) was temporarily mapped and run through the desktop/mobile smoke matrix (58 states passed technical loading), then visually rejected: both captures show a broken, hard-to-read scan too small to teach from. The temporary mapping and bundled derivative were removed; rejected visual captures are retained at `evidence/licensed-models/desktop-food-fried-fish.png`, `desktop-food-fried-fish-scan.png`, and `mobile-food-fried-fish-scan.png`. The original download remains untouched. This is a repeat of the earlier rejection, not new accepted coverage.

No new model was accepted in this continuation. Coverage remains **63/222**,
with **38** exact-object gaps and **65** rights-recorded local model files.

## Continuation — 2026-10-19 (follow-up)

- Rechecked the owner-provided Sketchfab-named GLB `c6715ec94cee4abfb6edbfaaa4390bea.glb` in Downloads. Its embedded metadata identifies it as the CC0 `Oryza sativa` rice-plant model from ffish.asia / floraZia.com. Its byte size and SHA-256 match `public/models/rice_oryza_sativa_01/oryza-sativa.glb`; it is already integrated only for paddy/crop examples. No duplicate was added, and it must not be presented as cooked rice or a rice dish.
- The [Natural History Museum, University of Pisa Ganges River Dolphin scan](https://sketchfab.com/3d-models/ganges-river-dolphin-c5fbdf0ace47481eb25646a9c13debb5) is an exact-species skeleton scan, not a living dolphin model. Its listing reports 2.5 million triangles, a 94 MB OBJ source, no textures/PBR, and no animation; the viewer displays a device-too-heavy warning. The corresponding [Wikimedia Commons file](https://commons.wikimedia.org/wiki/File:Platanista_gangetica_3d_scan_Natural_History_Museum_University_of_Pisa_C_272.stl) is CC BY-SA 4.0 and is a 119.21 MB STL. It could only be considered as a separately labeled skeletal-anatomy layer after an optimized desktop/mobile visual test and with share-alike attribution; it is not an acceptable living-animal replacement, and was not downloaded or integrated in this pass.
- A [1DesignTool spice-sacks model](https://1designtool.com/3d/models/silk-road-caravanserai-spice-sacks) was also checked. Although its library license permits embedded commercial use, the asset is explicitly static and low-poly, depicts saffron/sumac in market sacks rather than the Bengali spices in the lesson, and is not an accurate substitute for cumin, coriander, cardamom, bay leaf, mustard, fenugreek, or garam masala.
- The exact rice file is already counted; none of these follow-up candidates closes a coverage gap. After the fish-scan rollback, `npm run test:licensed-models` passed **57 model states** across desktop and mobile. This verifies parsing, attachment, and test assertions—not a fresh visual review of every screenshot.

Current coverage remains **63/222**, with **38** exact-object gaps and **65** local model files carrying source/license evidence. No source was added, so the model backlog remains unfinished.

## Green sea turtle specimen accepted — 2026-10-19

- Source: [jgrabo20 — Green Sea Turtle](https://sketchfab.com/3d-models/green-sea-turtle-d3dc6a6a4ff74465a59105fd7c66b32b), CC BY 4.0. The downloaded GLB embeds the author, source, title, and license metadata; the local copy is 4.4 MB and retains the original geometry and textures.
- Integrated as a species example in Life → বাংলাদেশের প্রাণী → কচ্ছপ. The visible attribution explicitly says it is not a scan of a particular Bangladeshi animal. The GLB's `Turtle_idle_2` clip plays in the model scene.
- Replaced the overgeneralized claim that all turtles retract their limbs: sea turtles cannot pull their head and flippers into the shell. The item now identifies *Chelonia mydas*, gives the Bangladesh Forest Department's dated 2014 assessment caveat, and links the Bangladesh Red List and NOAA Fisheries references.
- Focused browser test passed at 1440×900 and 390×844, checking the GLB parses and attaches, the authored idle clip plays, the attribution appears, and the item-specific exploded fact is shown. The same focused test passed against production after deployment.
- `npm run check`, content audit, SEO audit (264/264 sitemap routes; zero warnings/failures), model-rights audit, production route smoke (17 routes × 3 viewports), all-world render smoke (11 worlds × 2 viewports), interaction smoke, and exploded-facts smoke (74 objects) passed. Build/deploy retains the pre-existing >500 kB Three.js bundle warning.
- Commit `90c1e77` is pushed to `main` and live on `posora.com`; Cloudflare version `dcd96f12-3cea-4827-a343-a7bcaf9b77d7`. Live GLB returned HTTP 200 with the expected 4,582,936-byte response.

Current generated audit after this accepted mapping: **67/223** licensed exact-object/example mappings; **35** concrete exact-object gaps remain; **70** local GLB/glTF files have source/license records. The broader model-replacement task is still unfinished. Do not describe this single-world increment as sitewide completion.

## Additional licensed-asset search — 2026-10-19

- The signed-in Sketchfab search with Downloadable enabled returned **no results** for “hilsa”. Fresh web searches also did not expose a verifiable free downloadable *Tenualosa ilisha* model. Generic fish, unrelated search matches, and genome datasets are not acceptable substitutes for the Hilsa lesson.
- Cardamom searches surfaced a commercial cardamom model (Royalty Free, not a permissive public license) and a Meshy-generated Sketchfab model whose page reports roughly 696k triangles and a device-too-heavy warning. Neither was integrated. Cumin/coriander/fenugreek results were recipes, datasets, or paid assets rather than verified, suitable CC0/CC BY GLBs.
- Innerscene lists a CC0 “Palm, detailed” asset, but its own description calls it a species-inspired pinnate palm and makes no botanical identity claim. That is not a valid stand-in for Bangladesh’s fan-leaved Palmyra palm (*Borassus flabellifer*), nor for the locally listed mangrove species.

No new model was accepted in this search. The audit remains **67/223** licensed exact-object/example mappings, **35** exact-object gaps, and **70** local GLB/glTF files with source/license records. Keep paid assets, account-gated assets, nonmatching species, and technically unsuitable models out of the coverage count until a suitable source has been reviewed and visually tested.

## Free-only source search follow-up — 2026-10-19

- A Sketchfab search result titled “Cat (leopard cat)” resolves to a model page that labels the asset AI-generated and sends buyers to a paid Fab listing; the page does not offer a free licensed download. It is also not verified as *Prionailurus bengalensis*. Rejected for the leopard-cat lesson.
- A Fab listing for a photorealistic *Neolamarckia cadamba* (Kadam) tree has species-specific botanical details and a GLB format, but is a paid asset with license selection at checkout. The owner confirmed free sources only, so it was not acquired.
- Rhesus macaque candidates surfaced in this search are skull/mandible museum scans or paid models, not a free living-animal model suitable to replace the monkey figure. Vulture results were unrelated king-vulture skulls, a horror-styled bird, or unidentified models; none verifies a Bangladesh-relevant vulture specimen.
- Searches for a free jute plant, *Corchorus olitorius*, and *Barringtonia acutangula* (Hijol) surfaced no verifiable downloadable CC0/CC BY whole-plant GLB in this pass. Search results without a matching species, download rights, and previewable geometry remain leads only.

No production model mapping changed. The current audited count remains **67/223** licensed exact-object/example mappings, **35** concrete exact-object gaps, and **70** local GLB/glTF files with source/license evidence. Per the owner's instruction, paid candidates are excluded from the acquisition path; continue searching permissive sources and do not substitute unrelated living species or skeletal study objects for the intended subject.

Additional source checks on 2026-10-19:

- [Sketchfab — CC0 Malayan banyan (*Ficus microcarpa*)](https://sketchfab.com/3d-models/cc0-malayan-banyan-ficus-microcarpa-038bae6f4bfe4a4f804b63efa2155481) is a downloadable CC0 model, but it is *F. microcarpa*, not the lesson's Bengal banyan (*F. benghalensis*), and its page reports 2.4M triangles. It is not mapped as the exact Bengal banyan.
- [Meshy — Banyan Tree](https://www.meshy.ai/3d-models/Banyan-Tree-v2-019f1a8a-3d3e-7b93-8e59-300670b05369) is marked CC0 but appears AI-generated and stylized/low-poly, so it does not meet the realistic specimen bar.
- [Sketchfab — Fish](https://sketchfab.com/3d-models/fish-5a2b7976ef5c44658de22e98bf381277) is downloadable under CC BY and includes four animated fish, but its author describes a generic low-poly fish set; it does not identify hilsa (*Tenualosa ilisha*) and cannot substantiate a hilsa label.
- [Sketchfab — Spices Asset Pack](https://sketchfab.com/3d-models/spices-asset-pack-0c62dfd291a045e0b3869e860ee02a54) is offered as a free download under Sketchfab's Free Standard license, not CC0. The listing describes a small generic spice collection and salt bowl, not a verified set of the seven spices in the lesson; no mapping was changed. Sketchfab states that downloadable models are offered under their displayed Creative Commons terms or platform license; check the asset-specific terms and embedding/redistribution limits before using any Free Standard file.
- [Innerscene CC0 bowl set](https://www.innerscene.com/tools/library/3d-parts/bowl-set-large-original-tableware-and-food-prop-0cbe8c89) is a useful prop, but it is tableware without the food it would need to represent. It cannot replace a dish model by itself.
- A [TurboSquid Ilish (*Tenualosa ilisha*) model](https://www.turbosquid.com/it/3d-models/3d-ilish-female-model-2338480) is species-specific, but costs US$59 and has no free source license. It was not purchased, per the owner's free-only constraint.
- Additional Sketchfab rice-bowl searches found a Korean heritage vessel, a Malaysian vegetarian rice bowl, an undescribed generic bowl, and a low-poly healthy-food prop pack. The vessel is an empty serving object; the prepared dish examples are not Bangladeshi rice-and-dal, and the healthy-food pack is low-poly. None is being mapped as a precise Bengali meal.
- A free3D “Mint 3” listing advertises legacy `.gsm`/`.3ds` files, not a verified GLB/glTF, and places automated download behind its paid AI-access API; it is not a usable free source for this task. Meshy's mint search describes CC0 gallery assets and lists a “Mint Plant in Pot”, but download requires a free account and the search listing alone does not establish that particular model's species or visual quality; treat it as an unverified lead, not a production asset.
- A Wikimedia Commons photograph of a cardamom plant is free-licensed media, not a 3D model, so it does not close the GLB/model gap. Searches for free downloadable exact cardamom-plant, fenugreek and mustard-seed GLBs returned no verified candidate in this pass; paid mint and cardamom listings were excluded.
- A free [1DesignTool river-delta tile](https://1designtool.com/3d/models/river-delta-river-tiles) includes nipa-palm clumps within a complete low-poly riverbank environment, but it is a static, stylized terrain tile rather than a separable realistic *Nypa fruticans* specimen. It is not used as a plant replacement.
- A [RISD Nature Lab macaque skull](https://sketchfab.com/3d-models/macaque-skull-a7795095f1654a88b0d103c2a6f47343) is downloadable CC BY and taxonomically identifies *Macaca mulatta*, but represents a skull, not the living monkey depicted in the lesson. The discovered Ganges dolphin file is a skeleton scan in STL form rather than a living animal, and is not suitable for the learner-facing dolphin figure. Searches for downloadable *Heritiera fomes* specimens produced no verifiable model in this pass.

These are research leads/rejections only, not production assets. The generated coverage audit remains the sole source of counts.

## Free-source review — 2026-10-20

- Rechecked free Sketchfab Banyan results through the signed-in Chrome session. `BANYAN TREE` by Jimmy Gunawan is CC BY 4.0 and downloadable, but the 50k-face scan triggers Sketchfab's “too heavy to render” warning on this device. `Banyan Tree 001` by lawrencetrigg1989 is only 3.2k triangles and has no creator description or species tags, so it is not accepted as a realistic, verifiable *Ficus benghalensis* specimen. Neither is mapped.
- Inspected the apparently relevant free CC BY 4.0 [Palmyra model by P.S.Thng](https://sketchfab.com/3d-models/palmyra-675c51ed065348ac846fe52098868a0b), including its signed-in download dialog and 1K GLB. The actual preview is a set of Palmyra fruits/seeds on a board, not a palm tree, so it cannot replace the “তাল” tree in Life. Its original file remains in Downloads; the temporary optimized copy was removed from the project. No candidate was promoted to production.
- During this review, found and corrected a separate unsafe Life claim that planting tall Palmyra trees protects people from lightning. The updated learner copy now says an isolated tall tree is not safe shelter and advises going indoors when thunder is heard. This matches [U.S. National Weather Service lightning guidance](https://www.weather.gov/safety/lightning-tips), which says never to shelter under an isolated tree and to move to a substantial enclosed building or hard-topped vehicle.
- `npm run audit:model-coverage` remains the source of truth: **69/223** licensed exact-object/example mappings and **33** exact-object gaps. No new model was accepted; this pass improves content accuracy but does not reduce the model backlog.

## Jackfruit scan accepted — 2026-10-20

- Source: [RISD Nature Lab — Jackfruit Pod](https://sketchfab.com/3d-models/jackfruit-pod-35bc5ca4e80c42cea328b9a3f0fd725f), downloadable CC BY 4.0. The signed-in model page identifies the scanned subject as Jackfruit, credits RISD Nature Lab, and states commercial use is allowed with attribution. The source is a 1M-triangle museum specimen and warns it is too heavy for some devices.
- Downloaded the source's 1K GLB through the normal Sketchfab download control, retained the source file in Downloads, and made a 4.45 MB web derivative. Optimization: weld, simplify to target ratio 0.2 with error 0.003, keep 1024px texture dimensions, convert to WebP quality 85, and quantize vertex attributes. The source/derivative SHA-256 values and triangle/texture details are in `public/models/jackfruit_risd_scan_01/asset-manifest.json`.
- Replaced the AI-generated Pixabay illustration in Language → শব্দভাণ্ডার → ফল with the real scan. Attribution is visible in the page's model-credit area; it explicitly describes this as a fruit specimen, not a tree. The old unused Pixabay GLB and its asset record were removed from the repository.
- Focused visual smoke passed on desktop (1440×900) and mobile (390×844): GLB parsed and attached, the expected local asset returned successfully, and the attribution/specimen limitation appeared. Both captures were visually reviewed at `licensed-models/desktop-language-jackfruit.png` and `licensed-models/mobile-language-jackfruit.png`.
- This replaces an illustrative asset rather than closing one of the exact-object backlog rows. `npm run audit:model-coverage` remains **69/223** licensed exact-object/example mappings with **33** exact-object gaps.

## Banyan candidate rejected — 2026-10-20

- Inspected and downloaded the 1K CC BY 4.0 [Banyan Tree of NCKU](https://sketchfab.com/3d-models/banyan-tree-of-ncku-692965e4f7e54f57abffb60ba6b3fb27) by National Cheng Kung University Museum. The download panel confirms attribution is required and commercial use is allowed.
- The optimized file parsed and attached in desktop/mobile browser tests, but visual review showed that it is a broad aerial campus/landscape scan rather than an individual banyan tree model. It was rejected and is not included in the site. Review evidence: `licensed-models/rejected-banyan-ncku-desktop.png` and `licensed-models/rejected-banyan-ncku-mobile.png`.
- The banyan remains an open exact-object gap; a title/license match alone is insufficient without the pictured object matching the teaching subject.

## Banyan root/trunk scan accepted — 2026-10-20

- Source: [BANYAN TREE by Jimmy Gunawan](https://sketchfab.com/3d-models/banyan-tree-704d83ff28c84dd487ef7dbfdbcdf2fb). The signed-in model page identifies the object as a banyan, describes 12-photo photogrammetry, tags it “banyan,” and lists 50k triangles. Its download panel confirms CC BY 4.0, required creator attribution, and commercial use allowed.
- The 1K GLB is 6.11 MB; after welding, converting textures to 1024px WebP quality 85 and quantizing supported vertex attributes, the site asset is 1.73 MB with the original 50k-triangle geometry retained.
- Replaced the procedural “বট” figure in Life → বাংলাদেশের গাছপালা. The scan is a lower-trunk/aerial-root close-up rather than a whole tree; that limitation and the lack of source geolocation/species identification are disclosed next to the model so it is not presented as a Bangladesh-specific tree or complete canopy.
- Focused browser smoke passed at desktop (1440×900) and mobile (390×844); both captures were visually reviewed at `licensed-models/desktop-life-banyan.png` and `licensed-models/mobile-life-banyan.png`. The asset parsed, attached, and showed its visible creator/license/scope disclosure.
- `npm run audit:model-coverage` reports **70/223** licensed exact-object/example mappings and **32** remaining exact-object gaps after this replacement.

## Cumin seed scan checked — 2026-10-20

- Inspected [Cumin seed by Benoît Rogez](https://sketchfab.com/3d-models/cumin-seed-3b2e7aba040a487bb4e767f9ecb0a971), a photogrammetric scan described as one approximately 5 mm seed made from 82 photographs. The subject itself is an accurate cumin seed specimen.
- Rejected for production: the signed-in public page exposes no download control or license terms, and the viewer warns that the model is too heavy for the device. Its 60.3k triangles are also excessive for a single seed in this scene. A visible model and a plausible scan do not establish reuse rights or acceptable runtime cost.
- No collection mapping changed. Continue looking for a downloadable, permissively licensed, optimized cumin specimen or a small group of seeds.

## Site-wide licensed model smoke — 2026-10-20

- Ran `MODEL_SMOKE_SCREENSHOTS=1 npm run test:licensed-models`. All **64 model/device states** passed across desktop and mobile: every tested asset parsed and attached in its actual world page, with no failed GLB requests or load errors.
- Reviewed the fresh desktop/mobile captures for the banyan scan, the green sea turtle, and representative Food and Social models. They rendered in-frame; the banyan scan's lower-trunk-only limitation remains visible beside the scene. Full-suite output is an integration/render smoke, not a claim that every legacy object is already realistic or every teaching diagram should be replaced.
- The test refreshed the pre-existing screenshot files because the scene animation is time-dependent. Those transient rewrites are not product changes and are not being treated as a visual redesign; retain the prior stable evidence set and add only the previously missing green-sea-turtle pair.

## Mint leaf specimen accepted — 2026-10-20

- Source: [Mint Leaves by Zinaida.Kovrova](https://sketchfab.com/3d-models/mint-leaves-25837c82537c46e3ade674e0b8e99864). Its signed-in download dialog confirms the file is free, CC BY 4.0, commercial use is allowed with attribution, and a 382 kB GLB is available. The listing identifies a mint-leaf cluster and reports 1.4k triangles, 847 vertices, and a 256px texture.
- Integrated the source GLB unchanged in Life → ঔষধি ও মশলা গাছ → পুদিনা. The model is intentionally described as a leaf specimen, not a whole plant or a Bangladesh-specific cultivar. Creator, source and CC BY attribution are visible alongside the selected model.
- Focused `MODEL_SMOKE_CASE=life-mint-leaves.png MODEL_SMOKE_SCREENSHOTS=1 npm run test:licensed-models` passed at desktop (1440×900) and mobile (390×844). The GLB parsed and attached; the test verifies the visible source/license/scope note and the expanded mint fact panel. Both captures were visually reviewed: `licensed-models/desktop-life-mint-leaves.png` and `licensed-models/mobile-life-mint-leaves.png`.
- This adds one licensed/example mapping: the generated audit now reports **71/223** mappings and **31** concrete exact-object gaps. The low-poly leaf-only scope is deliberately disclosed; it is not counted as a complete mint plant.

## Free-source follow-up — 2026-10-20

- Rechecked the Pixabay [AI-generated jackfruit cut-fruit model](https://pixabay.com/3d-models/jackfruit-fruit-tropical-botanical-1803/). The listing permits use under Pixabay's Content License, but the rendered cross-section has regular citrus-like radial segments rather than recognizable jackfruit bulbs and fibrous core. It is not a tree model and remains rejected; its license does not make its inaccurate anatomy suitable for the lesson.
- Searched Sketchfab's signed-in downloadable listings for `jute plant`; it returned no results. Web searches for a free downloadable *Artocarpus heterophyllus* tree, *Borassus flabellifer* model, *Heritiera fomes* model, and *Tenualosa ilisha* fish did not surface a candidate with both verified free commercial rights and a usable downloadable GLB. The exact Palmyra item found in 3D Warehouse remains unusable because of the previously documented website-aggregation restriction; paid exact-species alternatives remain excluded under the owner's free-only decision.
- No candidate from this search was added or counted. Keep the 31-item exact-object backlog unchanged until an exact, freely reusable model passes source, rights, technical, and visual review.

## Jackfruit fruit specimen integrated in the Life collection — 2026-10-20

- Reused the already-held [RISD Nature Lab Jackfruit Pod scan](https://sketchfab.com/3d-models/jackfruit-pod-35bc5ca4e80c42cea328b9a3f0fd725f), CC BY 4.0, for Life → বাংলাদেশের গাছপালা → কাঁঠাল. This is explicitly a scan of a fruit specimen, not a whole tree or a Bangladesh-grown cultivar; the adjacent attribution note says so. No unrelated tree species is being relabeled as jackfruit.
- Rotated the long axis upright for the selected-object view and used the collection scene's existing focus framing. The selected item still retains the existing fact panel about the fruit and the visible author/license/source note.
- Focused browser smoke passed at desktop (1440×900) and mobile (390×844): the local GLB parsed and attached, the correct “কাঁঠাল” item was selected, the source/license/scope note was visible, and opening the detail control showed the jackfruit facts. Captures: `licensed-models/desktop-life-jackfruit-pod.png` and `licensed-models/mobile-life-jackfruit-pod.png`; both were visually reviewed. The scan is narrow and should not be presented as the full jackfruit tree.
- Generated audits now report **72/223** licensed exact-object/example mappings and **30** concrete exact-object gaps. The Jackfruit-tree gap itself remains open; this increment covers the fruit specimen only. `npm run audit:model-rights` still validates the local source/license record.

## Free-source follow-up — 2026-10-20 (continued)

- Rechecked several current candidates for the remaining Life/Food exact-object gaps. The exact female *Tenualosa ilisha* model listed by [TurboSquid](https://www.turbosquid.com/it/3d-models/3d-ilish-female-model-2338480) costs US$59, so it was excluded under the free-only constraint.
- The [Sketchfab Cardamom Pod](https://sketchfab.com/3d-models/cardamom-pod-0be3232c36ef4de39947640767e6ab15) is AI-generated, has no public download control/license evidence on its page, and reports about 696k triangles. It is not a usable production source. A separate [Cardamom Bowl](https://sketchfab.com/3d-models/cardamom-bowl-7e84837fa85c4b56b751f51dccb5aee0) is free CC BY 4.0 and commercial use is allowed, but the listing identifies it as AI-generated, its 240k-triangle preview warns it is too heavy for this device, and the visible preview only establishes a group of green pods in a dish—not sufficiently inspectable cardamom anatomy. It remains a lead, not an integrated model.
- A [3D Warehouse Palmyra Palm](https://embed-3dwarehouse-classic.sketchup.com/model/c09686f0b41de786693afe255d42a62a/Palmyra-Palm-Borassus-flabellifer) is an exact species match, but 3D Warehouse's [General Model License](https://3dwarehouse.sketchup.com/tou) restricts aggregating its models for redistribution. Since Posora serves the GLB itself, it does not meet the required reusable asset terms. The CC0 [Smithsonian *Borassus flabellifer* photograph](https://commons.wikimedia.org/wiki/File:Borassus_flabellifer_174906.jpg) is only a 2D photo, not a downloadable 3D model.
- The [Smithsonian *Corchorus olitorius* record](https://www.si.edu/object/corchorus-olitorius-l%3Anmnhbotany_2059105) identifies a CC0 herbarium specimen from Mexico, not a 3D model and not evidence of Bangladeshi plant morphology. The [Smithsonian *Tenualosa ilisha* record](https://www.si.edu/object/nmnhvz_5251666) is a CC0 taxonomic specimen record, but no downloadable 3D fish asset is provided there. Neither closes a model gap.
- The cardamom bowl's visible Sketchfab download dialog confirms a free 11 MB original GLB and CC BY attribution, but its browser viewer fails to render the mesh as too heavy. Without a usable local file and a visual check of the optimized derivative, promoting it would be premature; the current procedural cardamom depiction is unchanged.
- No collection mapping changed in this research pass. The generated model-coverage audit remains authoritative at **72/223** mapped examples and **30** concrete exact-object gaps; these source checks narrow the next search rather than count as model integrations.

## Local visual rejection and new exact-species lead — 2026-10-20

- Downloaded the free 1K GLB for the CC BY 4.0 [Cardamom Bowl by go3452](https://sketchfab.com/3d-models/cardamom-bowl-7e84837fa85c4b56b751f51dccb5aee0) from Sketchfab and rendered it in the local Three.js preview at desktop size. The scene is a bowl of oversized smooth oval green objects. It does not show the clearly ridged capsules expected of cardamom, so despite the license and technical loadability it is rejected for both Life → এলাচ and Food → এলাচ. The downloaded source remains in the user's Downloads folder; the temporary project copy and preview route were not retained.
- Found an exact-species *Bombax ceiba* / শিমুল candidate: [Bombax ceiba L Roadsite Tree by Yu Kai Him Otto](https://sketchfab.com/3d-models/bombax-ceiba-l-roadsite-tree-c00ae9fe9369441289d295400c363ae0). The Sketchfab page and download dialog identify CC BY 4.0, free, commercial use permitted with attribution; the available GLB is 30 MB and the listing reports 1.1M vertices but **0 triangles**. The viewer itself reports that the model is too heavy to render on this device. This indicates a point-cloud asset rather than a practical solid tree mesh; it is not integrated. A free model without usable mobile geometry does not meet the production requirement.
- Tested whether the *Bombax ceiba* scan could be made web-suitable by uniform random sampling within each source point cluster. A temporary local Three.js preview confirmed 1,140,029 source points reduced to 91,229 points and 2.5 MB. At desktop size, the crown and trunk are identifiable, but the scan includes a large roadside slab/foreground debris and remains visibly noisy. At a 390×844 mobile viewport, the crown is cropped and the scene is dominated by the point-cloud texture. This is a stronger technical read than the source viewer, but still fails the visual bar and is rejected rather than counted.
- Rechecked *Barringtonia acutangula* / হিজল. Search surfaced several exact-species marketplace models, all paid, and a 3D Warehouse result described as a 2D tree with only two polygons. The paid items are excluded by the owner's free-only constraint; the billboard result is not a realistic 3D specimen. No replacement is accepted.
- Inspected Meshy's [Centella asiatica plant](https://www.meshy.ai/3d-models/Centella-Asiatica-plant-v2-01965748-b845-7a7d-9067-3bc9654afcea) candidate for থানকুনি. The page explicitly labels it CC0 and the browser preview shows a 9,997-face model, but the leaf edges are smooth and uneven rather than recognizably scalloped, and the small leaf count does not establish the plant's creeping stolons. The visible “download” control opens an account-registration gate. I closed it without signing in, transmitting the owner's Google account, or accepting Meshy's terms. This candidate is not integrated; a CC0 label alone does not establish botanical accuracy or visual suitability.
- A search for *Nypa fruticans*, *Heritiera fomes*, *Bombax ceiba*, and *Neolamarckia cadamba* likewise surfaced either paid models, image/specimen records, or the previously rejected point-cloud/billboard assets. No new accepted free GLB was found in this pass.
- Continued the free-source search in Sketchfab's signed-in model browser. Search results for `pitha`, `coriander plant`, `bay leaf`, `leopard cat`, and `rhesus macaque` returned no models. The `coriander seeds` results did expose a downloadable scan by carldove2, but its page identifies **CC BY-NC-SA 4.0**, reports 228k triangles, and its viewer warns that it is too heavy for this device. It is therefore not usable on Posora's commercial site. A separate single-seed model by Jayden Allen is non-downloadable and also triggers the device warning. No coriander model was integrated.
- Checked 3DAssets.dev's public model library as a possible no-account CC0 fallback. During this pass both the page and its advertised JSON API returned `no available server`; its assets cannot be downloaded or visually verified while the service is unavailable, so none was treated as usable.
- No mapping changed. The authoritative `npm run audit:model-coverage` remains at **72/223** mapped examples and **30** concrete exact-object gaps. This pass records two visually verified rejections and prioritizes searching for a low-complexity real mesh rather than high-resolution point clouds or AI-shaped lookalikes.

## Free catalog cross-check — 2026-10-20

- Checked Poly Haven's first-party [Food & Kitchen model catalog](https://polyhaven.com/models?c=food) and its public assets API. Poly Haven confirms its models are CC0 and allows commercial use, but the catalog exposes no exact Bangladeshi dish or target spice-seed models for the remaining Food gaps. Its available ginger model is realistic but does not match any of the 30 currently uncovered exact-object rows.
- Searched the signed-in Sketchfab downloadable model search for mustard seeds. It returned no results. A search-engine result titled “mustard seed” opened as a Sketchfab 404, so it is not a usable candidate.
- Inspected a search result titled [Cat (leopard cat)](https://sketchfab.com/models/52e8f0b7b1af4e0498ac40b771bd5cb4). The Sketchfab page shows it is AI-generated and directs buyers to a Fab listing; it provides no visible downloadable control or reusable license terms. It is excluded rather than treated as free or cleared.
- The present blocker is source availability, not implementation: for each remaining exact-object slot we require a free-to-use model, explicit commercial rights, a verifiable subject match, manageable geometry, and a successful desktop/mobile render. Generic lookalikes, noncommercial files, paywalled files, and scans that fail mobile rendering do not satisfy that bar.
- No mapping changed in this cross-check. `npm run audit:model-coverage` remains **72/223** mapped examples and **30** exact-object gaps; no runtime change or deployment is claimed.

## Broad free-catalog screening — 2026-10-20

- Checked the [CodeLove GLB catalog](https://models.codelove.in/developers/), which states that its direct GLBs are free for commercial use under per-model MIT, CC0, public-domain, or CC BY terms. I searched its public 6,792-model JSON index against the remaining exact-object labels.
- Near matches include generic palm-tree kit assets, a 918-triangle cube-pet monkey, a 233-triangle generic fish, and a 104-triangle “rice ball.” These are stylized low-poly stand-ins, not realistic *Borassus* / *Nypa* / local species, *Tenualosa ilisha*, or a bowl of cooked rice. They are rejected for the requested visual and subject-accuracy bar.
- No exact target among the remaining 30 gaps was present in the catalog. This provides another catalog-wide check but does not change model coverage; `npm run audit:model-coverage` remains **72/223** mapped examples with **30** exact-object gaps. No asset or runtime mapping was changed.
- Ran a separate exact-spice source check for cardamom, coriander, fenugreek, and cumin. Results surfaced a commercial cardamom marketplace collection, a royalty-free coriander-seed listing with paid basic/extended licenses, and a CC0 image of cardamom pods (2D only); no verified, free-to-download realistic GLB candidate was found. Existing Sketchfab candidates remain excluded for the previously recorded licensing, performance, or fidelity reasons.
## Full desktop/mobile licensed-model verification and source sweep — 2026-10-20

- Re-ran `MODEL_SMOKE_SCREENSHOTS=1 npm run test:licensed-models` against the local site. It passed all **70 model states at desktop and mobile**; the run covered the 47 unique collection assets. `npm run audit:model-test-coverage` reports 47/47 unique mapped assets represented in the desktop/mobile suite, and `npm run audit:model-rights` passes for 74 GLB/glTF files.
- `npm run test:world-render` passed all **11 worlds × 2 viewports** with WebGL mounted and available controls exercised; `npm run check` passed for 246 Astro files with zero errors or warnings.
- Refreshed the current visual evidence in `licensed-models/` for each state. Manually inspected desktop/mobile captures for the Life mango tree and Food fried-fish scan. The mango model is a full specimen but its dense, very dark canopy needs further presentation review; the fried-fish scan does load, but at collection scale reads as a low, fragmented plate rather than a clear fish specimen. The model is generic fried fish, not an ilish or a Bangladeshi recipe; its attribution and scope note remain visible.
- Checked Sketchfab’s public downloadable-model API for the remaining exact-object backlog under commercial-friendly CC BY and CC0 filters. Exact queries covered the missing Bangladeshi plants, local wildlife, spice ingredients, and Bengali dishes. Most targets had no downloadable result under those licenses. The few results were unsuitable: rhesus macaque skulls rather than a living monkey, non-local vulture species, and a cardamom-themed composition rather than the spice. These are not candidates for the page.
- One Nypa fruticans listing was visually inspected in Sketchfab: [Nypa fruticans by zefruitlivingbeingidk](https://sketchfab.com/3d-models/nypa-fruticans-bb6dfbb59cb447cb83b29a48a3fe9b64), downloadable CC BY 4.0. The visible model is a dense fruit cluster (998.7k triangles), not a whole nipa/golpata plant, and Sketchfab reports that it is too heavy to render on this device. It is therefore not substituted for the plant canvas.
- The direct API sweep narrowed the next action toward non-Sketchfab open biodiversity/museum sources or explicitly scoped component specimens; it did not establish any new model as production-suitable. No runtime mapping changed in this verification pass.

## Scoped Golpata fruit model integration — 2026-10-20

- Added the free CC BY 4.0 Sketchfab model [Nypa fruticans by zefruitlivingbeingidk](https://sketchfab.com/3d-models/nypa-fruticans-bb6dfbb59cb447cb83b29a48a3fe9b64) as a supplemental fruit-cluster specimen. Kew describes Nypa's female flowers as a densely packed head and its fruits as angular from mutual compression; that matches the model's clustered, angular fruits. It is **not** a whole-plant model and does not close the whole-Golpata model gap.
- Optimized the supplied 51 MB 1K GLB to a 3.3 MB web derivative (5% target vertex ratio; 512 px textures, WebP quality 80). The authored palm teaching figure remains in place; this model supplies the fruiting-head detail only.
- Corrected the Golpata sap statement in `life-explorer.ts`: sugary sap is collected from the inflorescence/flower-cluster stalk, not directly from the fruits. Kew source: [Plants of the World Online — Nypa fruticans](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:668507-1/general-information).
- Added creator/license/scope credit and a screenshot test for the actual `/life/` interaction. The first browser run caught an unbound asset-loaded callback; fixed it, then reran successfully on desktop and mobile. Manually inspected `licensed-models/desktop-life-golpata-fruit-cluster.png` and `licensed-models/mobile-life-golpata-fruit-cluster.png` in the rendered Posora page.
- Coverage remains **72/223 exact-object mappings with 30 whole-object gaps**; this is an additional scoped component example and is not counted as a whole-Golpata replacement.
