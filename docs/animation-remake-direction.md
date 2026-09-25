# Posora cinematic scene remake: direction and acceptance contract

Status: implementation guide, not a completed scene remake. This document defines the visual standard and migration work for all 11 worlds. It does not establish that current scenes meet the standard, that assets have been produced, or that device budgets have passed. GPT 6 Astra directs and reviews; GPT 6 Luna implements bounded packets. A model name, a successful build, and a cinematic camera alone are not evidence of visual quality.

## What the current code actually supplies

| Existing component | Useful foundation | Migration issue |
| --- | --- | --- |
| `src/data/worlds.ts` | The authoritative 11 world slugs, category order, item labels, mission/category mappings and lab links | Preserve coverage and Bengali content. `open` distinguishes bespoke route handling; do not interpret `open: false` as a missing world. |
| `src/data/heroes.ts` | Category-index dispatch via `heroFor`, with collections resolved from `src/data/collections.ts` | Many unrelated lessons reuse a generic builder. Space is handled separately and is absent from this map. |
| `src/components/explorer/heroes.ts` | `HeroHandle`, parameter control, focus, picking, teardown, procedural fallback | A large builder registry couples geometry, camera and interactions. Badges and labels use sprites with `depthTest: false`; generic anchoring can assign meaning to arbitrary geometry; generic explosion separates meshes rather than teaching a process. |
| `src/components/explorer/figures.ts` | Named figures used by collections and shelves | Upgrading a shared figure can affect multiple worlds and the collection shelf. Current `riceBowl` uses a cylinder bowl and a flattened sphere mound with seven separate grains. Lighting cannot supply missing food structure. |
| `src/components/explorer/render.ts` | ACES tone mapping, environment lighting, key shadows, scene disposal | `stylise()` adds world-height tint and emissive rim to standard materials. Its own stated goal is stylized primitives. Photographic materials need an explicit untinted path. `dressScene` sets DPR after the caller sets it, so the effective DPR must be measured. |
| `src/components/explorer/nature-scenes.ts` | Deterministic procedural terrain, instanced leaves, authored scene targets and details | It remains a diorama implementation. Repeated primitive assets and thin water surfaces need scene-specific improvement. Water recomputes normals during updates; the cloud shader performs up to 48 steps per fragment. Profile their cost before extending them. |
| `src/components/explorer/nature-viewer.ts` and `src/data/nature-cinema.ts` | Three target groups, overview/close/detail, captions, DOM controls, reduced motion, offscreen pause and cleanup | This is a useful interaction prototype. Its separate lighting setup and three-target assumption should become explicit scene configuration, not another global default. |
| `src/components/explorer/cinematic-camera.ts` | Visible-bounds fitting, portrait support, eased camera movement, manual-control cancellation | Current direction and 950 ms move are shared. Author shot direction, target bounds, occlusion exclusions and contextual framing per scene. Bounds fit prevents clipping; it does not establish composition. |
| `src/components/explorer/model-loader.ts` and `public/models/README.md` | glTF loading and one recorded CC0 Anthurium asset | The loader has no cancellation token, ownership cache or late-result guard; a successful late load can attach to an obsolete parent. Compression and texture decoding are not configured here. Add lifecycle support before widespread asset loading. |
| `src/components/explorer/SpaceExplorer.astro` and `cosmos.ts` | Bespoke Space explorer | Audit and adapt this route separately; updating `mountHero` alone cannot remake all worlds. |

Source-code comments sometimes describe an earlier state. The imported model loader and Nature textures already contradict a blanket claim that the entire application ships no models or textures. Verify runtime behavior, not comments, when making acceptance claims.

## Visual direction

Build a tactile educational documentary: recognizable objects, believable scale relationships, meaningful motion, restrained composition and Bengali teaching content. Bangladesh should appear through relevant species, cookware, crops, landscapes, architecture and everyday objects, selected from documented references. Do not use a generic tropical asset as evidence of a specific local species or place.

Each scene needs a reference sheet before implementation: three or more reference views when shape warrants them, the exact subject, observed scale, material notes, silhouette, distinctive parts and one sentence explaining what the learner will discover. Record reference URLs and asset licenses separately. A reference photograph is not automatically licensed for reuse as a texture. The director must approve the target, shot list and learning behavior before the worker builds details.

Geometry comes first. Approve an untextured silhouette at the actual mobile display size before material work. Hero objects need modeled rims, thickness, natural asymmetry, joints, fin profiles, veins or grain clusters where those features explain identity. Tiny details belong in normal/roughness maps or a separate close-up asset. Repeated elements should use instances or merged geometry. A high polygon count without correct silhouette is a rejection.

Materials must distinguish ceramic, cooked rice, fish skin, bark, leaf, metal, water, glass, cloth and paper. Use physically based base-color, normal and roughness detail with consistent texel scale and correct color-space treatment; inspect maps in the renderer. Ordinary food and skin are dielectric materials, not metallic surfaces. Avoid baked directional highlights in base color and applying the global stylized rim to realistic assets. Use translucency or subsurface approximations only where visible and affordable; evaluate against reference under neutral light before scene lighting.

Lighting needs a motivated source, contact with supporting surfaces and readable shadow-side detail. Compose warm window light for a tabletop, outdoor sky and sun for a field, controlled illumination for a lab, and purposeful lighting for space. Preserve highlights on white rice and glazed bowls. Optional bloom, depth of field and atmospheric effects must earn their measured cost and must not conceal weak modeling, reduce label readability or blur the feature being taught.

Motion must follow the subject. Fish bend and move fins; leaves bend around attachments; a pendulum moves around its pivot; water follows a declared illustrative process. Do not animate all objects with the same spin, sine-wave bob or scaling pulse. State when time, scale or process has been simplified. Default overview composition should remain stable long enough to inspect it.

## Pilot: Food, “খাদ্যের ছয় উপাদান”

This is the acceptance pilot for the reported rice-bowl/fish/plastic appearance and icons blocking objects. Scope is Food category index 0, “খাদ্যের ছয় উপাদান”; despite its six-nutrient title, it currently contains eight lesson items, all of which remain in scope. The reported screenshot is the issue description; this guide has not itself captured or scored a new browser screenshot. Capture the actual baseline before work. Existing collection mappings are `শর্করা → riceBowl`, `আমিষ → fishSmall`, `স্নেহ → oilDrop`, `ভিটামিন → greenFruit`, `খনিজ লবণ → salt`, `পানি → glassWater`, `আঁশ → shrubPale`, and `ক্যালরি → sunDisc`. Those last two stand-ins need explicit teaching designs, not visual polishing of an unrelated shrub or sun.

Create a close, natural tabletop composition with a ceramic rice bowl, an accurately identified fish or prepared fish dish, produce, an oil container, salt and drinking water. Represent fiber through a recognizable food and a separate explanatory detail; represent calories with a clearly labeled energy comparison diagram in the learning layer. Do not imply one food contains only one nutrient. Preserve the existing eight item labels and lesson connections.

Required deliverables:

1. **Rice:** a bowl with inner wall, lip, foot and believable thickness; a mound formed by clustered rice with visible grain structure at the intended close view. Instance surface grains over a concealed bulk shape, use deterministic variation, and supply a lower-detail overview representation. No exposed smooth white hemisphere standing in for the rice.
2. **Fish:** reference-correct body profile, head, eye placement, gill cover, fin attachment and tail silhouette. Specify species or describe it as a generic example. A prepared dish must look prepared; a fish on a plate must not swim. Skin needs scale/roughness variation without glittering metal or a uniformly shiny toy surface.
3. **Supporting materials:** glazed ceramic, subtle wetness where appropriate, fibrous cut produce, and a readable water surface. Check them first with neutral lighting. Stronger reflections are not a universal realism fix.
4. **Composition:** rice and fish remain legible in a 360 px wide viewport. Overview establishes the collection; selection takes the camera to a named object; detail reveals a newly authored physical or explanatory feature. The default hero should not become eight equal toy objects in a distant row.
5. **Annotations:** remove solid emoji discs from the hero's silhouette. Keep selectable item buttons in a DOM rail or panel. At most the active item's restrained callout appears near the object, using a leader line and an edge-safe position. If a marker would overlap an important feature, suppress or relocate it. Keyboard and touch selection must remain available.
6. **Learning action:** selecting carbohydrate frames rice; a detail action reveals the grain/food explanation; the process control changes a documented portion or stage and updates the corresponding explanation. Selecting protein frames the fish. Do not silently turn a portion slider into a nutritional recommendation or invent quantities.

For repeatable pilot checks, record the selected object's projected bounding box and director-marked essential-feature regions (rice surface, bowl lip, fish head, fins and tail). Require zero annotation overlap with those feature regions, no selected-subject clipping, and at least 12 CSS px of safe margin from the canvas edge in focus shots. Start with the focus subject's longest projected dimension occupying 45–80% of the available canvas dimension; justify a different composition with the actual capture. These are proposed acceptance thresholds, not current measurements. The neutral-light and final-light captures must both retain observable grain boundaries, bowl thickness, fin silhouettes and distinct food/ceramic roughness.

Pilot blocker examples: bowl reads as a solid cylinder, rice still reads as a dome, fish silhouette remains a ball with a triangle, captions conceal the food, assets fail and silently show the old placeholder while claiming success, a close-up only enlarges the same crude mesh, or the scene is attractive but the selected lesson points at the wrong object.

## Direction across the 11 worlds

These are proposed anchor scenes and material languages, not a claim that every category is implemented. Category and item coverage must be generated from `worlds.ts`; each category receives its own shot and interaction record. Shared scenes are acceptable only where each mapped item has a truthful target or a clearly identified diagram.

| World | Anchor scene and material direction | Required learning reveal |
| --- | --- | --- |
| Space (`space`) | Detailed planet limb, terrain/albedo features, atmosphere where applicable, restrained stars and believable terminator | Surface → cutaway or orbit relationship. Mark distance/size/time distortions. Planet interior and orbit guides are explanatory layers. |
| Physics (`physics`) | Workshop apparatus with metal axles, wood grain, glass optics and grounded contact | Manipulate one defined variable; expose force/path/energy overlays tied to the apparatus. Preserve machine and light lab links. |
| Chemistry (`chemistry`) | Glass vessels, meniscus, plausible liquid appearance and a carefully lit bench | Macroscopic change → explicitly illustrative particle model. Do not depict atoms as literal visible colored balls in a photographed beaker. |
| Life (`life`) | Reference-led local plants/animals with actual leaf, bark and anatomical structure | Whole organism → functional part → cellular or anatomical explanatory detail. Correct identity and attachment outweigh density. |
| Nature (`nature`) | Riverbank/wetland/forest compositions with connected terrain, water depth cues and layered foliage | Place → process → physical detail such as leaf or soil. Retain the authored category/item mapping, improve specific subjects and controls. |
| Food (`food`) | Pilot tabletop, then field, market, kitchen and seasonal produce | Food → source or structure → relevant process. Build all eight categories after the pilot passes. |
| Math (`math`) | Tactile manipulatives, accurate measuring tools and clean diagrams on real surfaces | Object → quantity/relationship → symbolic representation. Keep geometric clarity; do not add texture that obscures counts or edges. |
| Business & Money (`money`) | Believable local shop, ledger, containers and teaching currency | Concrete transaction → visible budget/stock/goal change. Numbers must come from lesson state; do not replace financial reasoning with decorative coins. |
| Language (`language`) | Paper, ink, printing type and contextual objects with precise Bengali glyphs | Letter form → stroke or joining sequence → word in context. Typography stays crisp and correct; 3D extrusion cannot substitute for handwriting instruction. |
| Social Skills (`social`) | Carefully posed, age-appropriate human interactions in recognizable spaces | Context → gesture/expression → learner choice and consequence. Avoid unsettling near-real faces and repetitive emoji stand-ins; character design needs dedicated review. |
| Discovery (`discovery`) | Workbench experiments, geological samples and authentic instruments | Observe → predict → change a variable → measure. Historical and scientific references require source review; inventing a device is not a substitute for research. |

## Architecture migration

Introduce the new path beside existing scene builders. Do not rewrite every world at once or globally replace shelf figures while piloting one scene. Keep the current `HeroHandle` boundary initially so page selection, progress, lab links and missions keep working. Extend it only with a deliberate compatibility plan; Nature currently supplies a no-op `setExplode`, which illustrates why every scene should not promise the same action.

The director should approve these proposed boundaries before Luna packets implement them:

- **Scene manifest:** stable world/category/item IDs mapped back to existing indices; asset dependencies; one learning objective; named targets; overview/focus/detail shot descriptions; parameter meaning, units and range; quality variants; fallback identity. IDs must not silently depend on mutable Bengali display text.
- **Scene runtime:** `root`, named target objects, authored detail objects, `update(time, dt, state)`, and `dispose()`. Targets explicitly connect lesson IDs to real objects. Do not generate pedagogical anchors by selecting the nearest arbitrary mesh.
- **Asset service:** same-origin assets with provenance, version/hash, estimated transfer size, texture dimensions and LOD definitions. Track owners; cache shared resources; invalidate stale scene loads; dispose an obsolete result instead of attaching it. Configure and verify any chosen compression decoder before introducing compressed assets. Existing glTF support does not prove decoder support.
- **Material and lighting presets:** select by scene purpose and quality tier; preserve color management. Existing procedural fallback can retain `stylise`, while realistic assets bypass it. Do not multiply artistic lighting terms into assets indiscriminately.
- **Camera rig:** reuse fit math while authoring a per-shot direction and framing target. Exclude hidden details, labels, atmosphere shells and irrelevant scenery from focus bounds. Test safe areas with the real UI. Manual orbit cancels scripted movement; resize recomposes the current shot. Default movement is a short, eased move; reduced motion jumps directly.
- **Annotation layer:** DOM controls and caption accessibility, projected anchors, active-label placement and occlusion handling. Hit targets are at least 44 × 44 CSS px even if the visible marker is smaller. Object picking and rail selection resolve to the same lesson ID.
- **Lifecycle and quality controller:** one active hero renderer, lazy category assets, offscreen/background pause, capped frame delta and resize handling. Low quality reduces detail, pixels and effect cost while keeping the same learning interaction and recognizable silhouette. Collect measurements before adapting; CPU thread count alone is not a GPU benchmark.

Layered interaction is a state machine: **overview → selected subject → authored detail → process experiment → return**. A detail can be a cutaway, mechanism, microscopic diagram or contextual comparison, but it must add information. Define which sibling geometry remains for context, what becomes hidden, what changes the camera, and what caption/control becomes available in each state. Reset returns to a documented state. Generic mesh explosion is only acceptable for an assembly that truly separates that way.

Implement in this order: baseline capture and scene inventory; Food reference sheet and geometry prototype; lifecycle/asset adapter and annotation contract; finished Food pilot; acceptance review; one representative scene per world; remaining category packets; all-item coverage audit and integration review. The pilot must pass visual and interaction review before workers replicate its conventions.

## Performance targets and evidence

The following are initial engineering budgets to validate, not measurements of the current site or guarantees of every phone. Record the exact phone model, OS, browser, build SHA, viewport, DPR, quality tier and power mode. Use a real 4 GB Android phone as the baseline class, a weaker available phone for fallback review, and a desktop browser. CPU/network emulation supplements device evidence; it cannot establish GPU performance.

| Quantity | Initial baseline-mobile target | Measurement |
| --- | --- | --- |
| Steady animation | Median frame interval ≤ 33.3 ms; p95 ≤ 40 ms during a 30 s interaction sequence after warmup | Record frame intervals during overview, orbit, selection and parameter changes; report jank and thermal conditions. |
| Selection feedback | Visible pressed/selection response ≤ 100 ms; camera settles within its declared ≤ 1 s duration | Timestamp input and state/animation completion. A fresh uncached detail download reports loading separately. |
| Cold selected-scene transfer | ≤ 3 MiB for baseline overview including its models/textures; optional detail ≤ 2 MiB, fetched on demand | Network trace, cache disabled; report shared JS/environment cost separately and total route cost as well. |
| First usable scene | ≤ 5 s under a declared 10 Mbps / 100 ms RTT test profile | Record navigation-to-usable timestamp, with browser cache state. Loading feedback should appear immediately; do not count a blank canvas as usable. |
| Visible complexity | ≤ 150k rendered triangles and ≤ 100 main-pass draw calls initially | Instrument `renderer.info`; account for shadow/multipass costs separately. Exceptions require a measured benefit and device pass. |
| Resident textures | Aim ≤ 64 MiB estimated decoded texture memory for active scene | Inventory dimensions/formats/mipmaps; do not infer this from compressed download size or claim it is a precise GPU-memory measurement. |
| Pixel/shadow cost | Baseline DPR cap 1.25; one shadow caster at 1024² initially | Report actual drawing-buffer dimensions and shadow maps, not just configuration values. |
| Teardown | No increasing resource trend after 20 category swaps and revisits | Compare renderer geometry/texture counts after settling, listeners and detached objects; distinguish bounded shared caches from leaks. |

Use lower texture resolution, authored LODs, fewer instances, baked static surface detail, lower DPR and simpler atmosphere before sacrificing the essential subject. Do not preload all 11 worlds. A missing WebGL context or failed asset must leave lesson text and navigation usable, with an honest fallback state. A fallback screenshot cannot pass the primary visual gate.

## Screenshot and interaction acceptance

Capture reproducibly: same seed, build SHA, route/category/item, viewport, quality tier, camera shot, slider state, reduced-motion setting and asset-ready status. Keep before/after at identical framing, plus a new intended composition. Store an image index and the corresponding measurements with each packet. No one may claim to have inspected an image they have not opened.

Required pilot images: desktop overview (1440 × 900), mobile overview (360 × 800), mobile rice focus/detail, mobile fish focus/detail, parameter minimum/maximum, annotation active, and asset-failure fallback. Add a 768 × 1024 layout check. Capture the scene and full page; a crop can hide overlap and navigation problems. Record a short motion sequence or multiple timed frames to reveal clipping, motion discontinuity and labels crossing the subject. Still images alone cannot validate animation.

Director gates, each with explicit pass/fail and evidence:

1. **Identity and geometry:** recognizable without labels; Food rice grains and fish anatomy survive the actual mobile viewing size; no primitive stand-in remains for the selected hero.
2. **Materials and light:** distinct surfaces, contact shadows, retained highlight detail, no uniform plastic sheen. Inspect both neutral-material test and final scene lighting.
3. **Composition and labels:** subject is intentionally framed, no important part clipped, no label or icon covers the selected feature, Bengali text and controls stay readable at all required sizes.
4. **Learning truth:** every existing item resolves to its intended target/explanation; a deeper layer reveals more information; controls change a defined concept; diagram scale and simplifications are identified.
5. **Interaction and access:** direct pick, DOM button and keyboard reach the same state; back/reset work; wheel scroll remains usable; reduced motion is respected; touch dragging does not accidentally select.
6. **Runtime and device evidence:** no relevant console/network failures; stale loads cannot enter the current scene; target device budgets pass or the exception is documented and rejected/accepted by the director.

Use `npm run check`, `npm run build` and relevant existing camera/mapping tests (`npm run test:nature`) when runtime code changes. Add focused contract coverage for manifests, stale asset loads and state transitions as those systems appear. Existing `scripts/browser-smoke.mjs` checks general route health and layout, launches with `--disable-gpu`, and includes API requests; it is not a visual realism or GPU performance test. Run appropriate checks against an explicit local base. Do not label a compile-only result “cinematic QA passed.”

## Astra direction and Luna work packets

Astra owns subject research, shot and material decisions, asset exceptions, architecture contracts, cross-world coherence and final visual/learning judgment. Luna receives narrow, implementable packets with explicit file ownership, dependency inputs and acceptance captures. A worker reports uncertainty or a missing asset rather than inventing a successful render. High-cost director review occurs at concept approval, pilot approval and completed-world review; routine code implementation stays in worker packets.

The companion `scripts/animation-remake.mjs` is an offline inventory/prompt generator, not a scene renderer or paid API execution service. The coordinating Codex agent dispatches approved work through `spawn_agent`, using the configured director and worker model IDs. Generating prompts does not launch workers or demonstrate completed implementation. Keep shared runtime contracts under a single owner; dispatch independent asset/category packets only after their dependencies are accepted.

Each task record should retain world slug, category index plus exact title, all item indices/labels, immutable task ID, role/model, owned files, dependency IDs, input references, expected assets, required states, evidence paths, budget tier, status and rejection reasons. Status should distinguish planned, implementing, awaiting review, rejected and accepted; only a director evidence review changes a task to accepted. A stable mapping audit should fail on missing, duplicated or out-of-range items. Regenerating prompts must not silently overwrite accepted evidence or advance task status.

Suggested director system instruction:

> You are Posora's scene director and integration reviewer. Inspect the named code and baseline images. Define the exact subject, references, geometry requirements, materials, lighting, learning states and camera shots. Assign bounded implementation packets with owned files. Require actual image inspection and device measurements before accepting visual or performance claims. Reject placeholder silhouettes, arbitrary explanatory anchors, obstructive labels and merely recolored primitives. Preserve Bengali lessons, category/item coverage and accessible controls. Keep reports clear about implemented, captured, verified and pending work.

Suggested worker packet template:

> Implement only [world/category/scene ID] in [owned files] against [approved manifest/contract]. Inputs: [reference sheet, approved geometry/shot direction, asset records]. Required states: [overview/focus/detail/process/reset]. Required objects and material differences: [explicit list]. Existing lesson mappings and APIs to preserve: [list]. Budget: [tier limits]. Deliver code/assets, provenance changes, exact commands/results, screenshots for [states/viewports], actual resource/timing measurements, and unresolved limitations. Do not change shared contracts outside ownership, claim realism from build success, commit or deploy unless the coordinator explicitly authorizes it. If the asset or reference cannot support the intended subject, report the specific gap with a concrete alternative for review.

Suggested visual-review prompt:

> Open the baseline and candidate images at their native display sizes. For each gate above, record pass/fail, the observed feature and the exact image/state. Inspect motion evidence and lesson mapping separately. Name the three highest-impact corrections with owned files or asset targets and reproducible acceptance shots. Approve the scene only when no blocker remains; do not average a failed educational or accessibility gate into an attractive overall score.

World completion requires all its categories and items to be mapped, all intended scene states to be implemented, visual reviews to pass, and measured budgets to pass on the recorded baseline device. Repository-wide completion requires this evidence for all 11 worlds, including Space's separate explorer. A manifest, guide, prompt generator, placeholder model or one successful pilot is progress toward that outcome, not the outcome itself.
