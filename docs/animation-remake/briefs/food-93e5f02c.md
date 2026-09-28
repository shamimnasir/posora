# Food pilot direction: খাদ্যের ছয় উপাদান

## Record and status

- Task: `food-93e5f02c`; world: `food`; category index: `0`.
- Exact category title: `খাদ্যের ছয় উপাদান`. Retain the title and all eight items, including fiber and calories.
- Catalog digest inspected: `d02af22025dca29cc41fb7978416a0a1039023b8d8600d5fd1b305599a1b4f28`.
- Source revision inspected: `0d6062ed4aa76ec8b940a083211e064f76dfc6f3`.
- Role: Astra director. Status: **direction authored; visual acceptance pending**. This brief approves the proposed subject, shot and learning design for a bounded prototype; it does not accept a finished scene or validate device budgets.
- Dependencies before a finished build: root-owned runtime contract, reference/rights records, reproducible baseline, and representative rice geometry review. A prototype may expose missing reference/geometry information but must not be presented as accepted work.
- Evidence available to this author: repository source, catalog packet and project direction documents. No new browser screenshot was captured or inspected by this author. Screen appearance, actual control overlap, route availability and device timing remain unverified here.
- Required review record: `docs/animation-remake/evidence/food-93e5f02c.md`; reference/provenance records belong under `public/models/remake/food-93e5f02c/`.

## What the source establishes

`src/data/worlds.ts` supplies the eight labels and `src/data/food-explorer.ts` supplies eight corresponding learning records in matching order. `src/data/heroes.ts` dispatches category 0 to `collection`; `src/data/collections.ts` supplies the figure mappings below. Preserve lesson, mission, progress and deep-link indices through the new adapter.

`open: false` is a catalog fact, **not evidence that Food is inaccessible**. `src/pages/[world]/index.astro` explicitly renders generic worlds when `w.open` is false and rejects `w.open` true because those worlds have bespoke explorers. Root must verify `/food/` in the browser and select the exact visible category; do not invent a category query parameter or change route availability. The generated packet's “closed-world” wording does not override the actual route code.

Concrete source findings:

| Source | Established finding | Implication, to verify in captures |
| --- | --- | --- |
| `figures.ts`, `riceBowl` | Foot cylinder, closed tapered cylinder body, torus rim, flattened sphere mound, seven separate grains | Inner bowl structure and rice surface need rebuilding; enlarging this mesh cannot add missing grain structure. |
| `figures.ts`, `fish` / registry `fishSmall` | Scaled sphere body and belly, triangular cone fins/tail, torus gill cover, separate eyes; green body | Some anatomical cues already exist. The issue is reference-correct connected form and materials, not literally an absent tail or absent fins. No supported species identity is established. |
| `figures.ts`, `std` and `render.ts`, `stylise` | Standard helper uses roughness 0.6, metallic 0, an environment term, height tint and emissive rim | Existing rice, skin and ceramic share much of the same surface treatment; the new materials must bypass stylized tint/rim. A plastic appearance is a hypothesis until viewed. |
| `figures.ts`, `crystal` | Salt mapping uses pointed six-sided prisms with some metalness | Do not retain this as table-salt detail. Author a small salt dish and reference-supported grain close-up. The source comment is not scientific evidence. |
| `heroes.ts`, `collection` | Arc placement, fixed anchor at local y=0.55, selected figure translates/scales and rotates with time; siblings sway | Existing selection is a generic figure presentation, not a still kitchen composition or food process. |
| `heroes.ts`, `badgeSprite` / `labelSprite` / `pick` | Sprites use `depthTest: false`; pointer picking tests badge/name sprites | The source permits annotations to cover geometry. Actual overlap must be measured. New direct object picking must be implemented, not claimed to exist already. |
| `heroes.ts`, explosion and `HeroHandle` | Generic explosion separates meshes; existing API has no semantic food-detail method | Food detail needs an explicit state adapter; an exploding ceramic bowl or scattered fish parts is not the learning reveal. |
| `[world]/index.astro` | DOM chips already call `selectItem`, update reading/progress, and call hero focus; controls overlay the absolute-positioned host | Reuse the selection path and preserve progress behavior. Measure the unobscured canvas rectangle against actual DOM bounds. |
| `render.ts`, `dressScene` | Sets renderer DPR after the caller; low-power decision uses CPU/user-agent hints | Requested DPR is not proof of the actual drawing buffer or GPU capability. Root must enforce and report effective quality. |

These are source observations, not a scored “before” image. Do not describe improvements as visually verified until before/after images have been opened.

## Learning objective and subject choice

The learner connects each existing label to a recognizable food example or clearly identified energy concept, then discovers a physical feature or explanatory relationship. One food can contain several nutrients. Keep that idea visible in the learning panel; the staging is not a food classification into mutually exclusive boxes and not a recommended meal or serving size.

Use a close kitchen preparation tabletop relevant to everyday Bangladeshi food: cooked rice in a simple ceramic bowl, a whole food fish resting on a separate ceramic platter, guava, skin-on cucumber, a small oil bottle, a salt dish and a clear water tumbler. It is a preparation still life, not a ready-to-eat meal. The whole fish is a **generic example** until a reference sheet supports a named species. Do not call it hilsa or rohu based on color or a generic scan. The fish remains motionless on the plate, with no swimming or breathing loop.

The whole guava and cucumber are distinct food examples for distinct selection targets, not assertions that vitamins occur only in guava or fiber only in cucumber. Keep produce naturally varied in size and form; do not reuse differently colored spheres. Calories live in a labeled DOM teaching diagram alongside the scene. An optional plain card in the tableau may mark that diagram's location, but it is not a literal calorie object and must not substitute for the explanation.

### Immutable target and lesson mapping

Store the following item IDs explicitly; indices preserve the existing catalog order. IDs are not generated from mutable Bengali labels. Verify exactly one mapping per index on every build.

| Index / item ID | Exact catalog label | Existing figure | New named target | Focus and authored detail | Process / learning behavior |
| --- | --- | --- | --- | --- | --- |
| 0 / `food-nutrients-carbohydrate` | শর্করা | `riceBowl` | `rice` | Frame bowl plus mound. Detail presents a small group of distinct cooked grains and the lip, with the bowl still identifiable. Optional starch relationship is a separate labeled conceptual diagram, never a literal visible interior of rice. | Rice portion comparison: two authored visible fills in the same fixed bowl, continuously blended if geometry permits. Caption states this is an illustrative comparison, with no grams, calories or recommended portion. |
| 1 / `food-nutrients-protein` | আমিষ | `fishSmall` | `fish` | Frame complete fish and contact with platter, including head, attached fins and tail. Detail uses an authored head/gill/fin region and explains fish as one food source of protein; anatomy is not “visible protein.” | Optional protein-to-building-block relationship is a labeled conceptual diagram. No swimming, generic mesh explosion or digestive timing claim. |
| 2 / `food-nutrients-fat` | স্নেহ | `oilDrop` | `oil` | Bottle has base, neck, rim and visible contained liquid. Detail distinguishes vessel from oil and shows the meniscus; no giant freestanding tear. | Two fill levels are an observation of quantity only. Caption says more/less of the same oil, not a daily intake target. No numerical energy claim unless separately reviewed. |
| 3 / `food-nutrients-vitamin` | ভিটামিন | `greenFruit` | `guava` | Whole guava plus an authored cut piece with skin, flesh and seed distribution derived from reference. Detail shows the cut face. | Whole/cut comparison explains that visible flesh is food structure, not visible vitamins. Keep the existing lesson connection; no vitamin particles inside the fruit. |
| 4 / `food-nutrients-minerals` | খনিজ লবণ | `salt` | `salt` | A small ceramic dish with a low granular salt heap. Detail uses an enlarged, explicitly not-to-scale salt-grain example. | Explanation identifies table salt as one mineral-containing example, not all minerals. Do not imply sodium chloride contains every mineral or label unverified salt as iodized. |
| 5 / `food-nutrients-water` | পানি | `glassWater` | `water` | Clear tumbler with wall/base thickness and a readable colorless water surface. Detail frames rim, meniscus and glass/water boundary. | Low/high fill comparison keeps vessel shape fixed. Caption describes volume changing; it does not state how much a child should drink. |
| 6 / `food-nutrients-fiber` | আঁশ | `shrubPale` | `cucumber` | Recognizable skin-on cucumber and section with cut face. Detail shows skin/flesh/seed region, then a separately labeled illustrative plant-structure diagram if supplied. | Whole/cut reveal explains food structure without pretending a macroscopic string is all dietary fiber. Fiber explanation remains connected to existing lesson text. No shrub. |
| 7 / `food-nutrients-energy` | ক্যালরি | `sunDisc` | `energyDiagram` | DOM diagram titled with the exact label. Retain a small scene context view of rice; move keyboard focus to the energy panel on explicit diagram entry. | Compare a smaller and larger illustrated quantity of the same food with qualitative “less/more energy” captions. Mark “ধারণা বোঝানোর চিত্র”; no calorie totals, timed exercise equivalences, recommended intake, numerical axes or visually precise proportional bars without sourced quantities. No sun. |

Existing lesson prose is retained by this task, not certified as a new nutrition reference. A content reviewer should separately review existing simplified claims before adding more specific biology or nutrient values. No worker may invent percentages to decorate a meter.

## Reference and asset direction

The asset packet must record direct source URLs and what each reference supports, separate from reusable file licenses. No reference photographs or licensed scans were inspected by this brief author. The following is the required shot/research list, not an assertion that references have been acquired:

| Subject | Required reference observations | Production decision |
| --- | --- | --- |
| Rice and ceramic | Bowl side profile, top/inside and three-quarter filled view; grain length/width, clumps and translucency; wall/lip/foot thickness | Original lathed bowl with true inner/outer wall; original deterministic instanced grain geometry is permitted. Rice surface must be modeled from observed shape and clustering, with a hidden bulk core. It must pass the grayscale silhouette gate before texture polish. |
| Generic whole food fish | Side, top and head/fin detail of one consistent reference fish; pose on platter and contact; no mixed-species anatomy | Bespoke continuous body mesh or permissively licensed scan with traceable identity. A skilled modeling pass is required if the candidate still reads as an ellipsoid with attached cones. Procedural construction is permitted only when it actually authors body cross-sections and attached fin profiles. A missing suitable asset is reported; it is not replaced by the old figure while claiming completion. |
| Guava and cucumber | Whole silhouette, actual cut face and surface close-up, identified produce | Authored organic meshes with cut-face assets or a licensed scan; no sphere recolor. Model silhouette/major cut structures; use roughness/normal detail for pores and tiny seeds where appropriate. |
| Oil, glass and salt dish | Side and oblique views showing thickness, liquid surface and vessel proportions; salt grain detail | Original profile-based vessel geometry and instanced salt grains are appropriate. Photograph reuse as texture requires separate permission. |
| Tabletop | Matte wood or neutral preparation surface with scale/context | Original or permissively licensed material, low contrast and no busy graphic beneath food. |

All external assets require creator, original URL, license, attribution/modification obligations, download date, SHA-256, byte size, texture dimensions, color-space intent and low-tier variant. Do not add compression before root verifies decoder support. Do not claim “CC0” for an original asset without an explicit rights record; label authored procedural assets as original project work with source ownership.

Use one scene unit = one meter for internal layout. Initial **design dimensions**, to be corrected against references: bowl outer diameter 0.18 m, height 0.08 m; fish length 0.25 m; platter 0.30 m; tumbler height 0.12 m; oil bottle 0.16 m; guava diameter 0.08 m; cucumber length 0.18 m. These are staging conventions, not specimen measurements. No automatic per-object normalization to equal size. Enlarged details disclose their change in scale.

## Geometry and material gates

The first visual gate is **rice in ceramic at 360 CSS px viewport width**, in neutral lighting with labels hidden. Bowl must expose an inner wall, lip thickness and a contact-bearing foot. Use deterministic surface-grain instances with varied orientation and clustered placement; avoid systematic rings or a sparse sprinkling over an exposed smooth dome. Grain coverage must survive both overview and close views. A lower-detail rice representation may reduce hidden instances but retain the mound's grain-scale silhouette and readable surface.

Fish geometry must maintain a connected tapered body profile, integrated head transition, eye placement supported by the chosen reference, attached gill cover, thin shaped fins and a coherent forked tail. Fin rays belong in normal detail unless they materially affect silhouette. The platter supports the fish visibly; no hovering and no dish intersecting the belly. Fish detail must reveal newly authored anatomy or surface information, not just a larger old mesh.

Use distinct physical materials and inspect them under the same neutral light before the final scene:

- Ceramic: warm off-white glaze, controlled soft reflections, darker unglazed foot if referenced; geometry supplies thickness.
- Rice: dielectric, off-white rather than pure clipped white, subtle moist response and visible grain boundaries. No metallic rice and no baked bright highlight painted on every grain.
- Fish: dielectric skin with directional scale/roughness variation and restrained wetness. Surface iridescence is optional only when referenced and affordable; metallic glitter is a rejection.
- Produce: skin/flesh differences, nonuniform coloration at believable texel scale, cut surface detail without plastic clear-coat on everything.
- Glass/water/oil: separate surfaces, readable interface, conservative transparency with verified sorting. Low tier may use a simpler reflection/opacity approximation but must still distinguish empty glass from contained liquid.
- Salt/table: salt stays granular and pale without pointed gem-cluster staging; table is matte enough to separate ceramic contact shadows.

Initial final lighting: broad warm window-like key from upper camera-left, neutral fill, soft contact shadow and a calm background. Keep rice white values and bowl lip highlights unclipped. Avoid bloom, depth of field and fake emissive rims in this pilot. Lock exposure for each capture set; neither material nor final-light screenshots may hide missing form in darkness. “Warm window” is an artistic lighting intention, not a calibrated color-temperature measurement.

## Composition and shot contract

Overview is a stable still life: rice front-left and fish angled across front-right, with supporting vessels/produce behind at plausible scale and distinct heights. The eight lesson entries remain accessible in the DOM; they do not need eight equal objects arranged in one row. On portrait screens recompose the arrangement in depth so bowl and fish remain distinct; do not achieve fit by shrinking everything into a distant cluster. No idle spin, bob or scale pulsing. Selection moves the camera, not food across the table.

Root must provide the camera's **usable rectangle** in canvas-local CSS coordinates. Start with the host bounding rectangle, subtract the occupied breadcrumb/header strip and bottom control/caption strip, and exclude any overlapping side panel. Compute these values from measured DOM bounds on mount, resize and expanded-control changes. Inset the resulting contiguous rectangle by 12 CSS px. If insufficient space remains, move controls/caption into document flow. Do not count the whole 360 × 800 page as available canvas space. Record the resulting x/y/width/height in evidence.

Subject focus bounds are explicit named meshes; exclude tabletop, hidden detail meshes, annotation cards and distant siblings. Aim for the focused object's longest projected dimension to occupy 45–80% of its corresponding usable-rectangle dimension. Use actual projected bounds and essential-feature masks to evaluate this, not a camera distance alone. Allow 12 CSS px minimum margin on every selected subject edge. Desktop uses the same design target; do not use a 1440 px screenshot to excuse an unreadable mobile subject.

| Shot / state | Authored framing and visible context | Fit target / essential feature | Transition | Reduced motion |
| --- | --- | --- | --- | --- |
| `overview` | Three-quarter table view, initial elevation about 32–38 degrees, rice and fish lead; all physical examples discoverable | Scene's meaningful objects, not table perimeter; rice surface/lip and full fish silhouette identifiable | On fresh scene entry: immediate stable pose | Same immediate pose |
| `focus-rice` | Higher three-quarter view, bowl mouth visible, background fish/produce quiet | Bowl including foot and full mound; grain surface and lip clear | 650 ms eased camera move | Immediate |
| `detail-rice` | Oblique macro composition includes authored grain cluster plus a piece of bowl rim for context | Detail patch plus context; grain shapes separated | 450 ms; lazy-detail loading announced separately | Immediate after ready |
| `focus-fish` | Side-biased three-quarter view with sufficient height to see resting contact | Entire fish, all outer fins/tail plus platter contact | 650 ms | Immediate |
| `detail-fish` | Head/gill and attached pectoral region; retain small full-fish context view or explicit return control | Authored detail mesh; detail may crop whole fish only because it is clearly a named detail state | 450 ms | Immediate |
| `focus-support` | Individually authored view of oil, guava, salt, water or cucumber; no generic fixed-height anchor | Whole selected target, including supporting vessel as relevant | 600 ms | Immediate |
| `detail-support` | Meniscus, guava cut face, salt grain example, glass boundary or cucumber cut face as the selected row defines | Named physical feature or explicitly labeled scale-changed detail | 450 ms | Immediate |
| `energy` | DOM comparison fills available learning panel; scene remains quiet context | Diagram and its accessible text; no fabricated 3D interior | Panel reveal up to 200 ms, no camera sweep needed | Immediate |
| `process` | Hold the corresponding focus/detail camera while a defined quantity/stage changes | Same fixed reference vessel or diagram; caption tracks state | Direct manipulation; no long trailing animation | Direct deterministic updates |
| `return` / `reset` | Return to previous named shot / initial overview | Recompute its explicit target after resize | 550 ms maximum | Immediate |

All durations are proposed maximums, not measurements. A manually started orbit cancels an in-progress camera transition immediately. Keep the camera above the tabletop and prevent orbit positions that look through support surfaces. Camera movement must not introduce clipping mid-transition. Wheel scrolling must remain usable.

## Interaction and state behavior

Canonical visual state is `{ selectedItemId, view, parameter }`, separate from existing lesson progress. Required views are overview → focus → detail → process → return. Root owns adapting this to the existing page and `HeroHandle`; the category builder supplies named targets/details and semantic state hooks.

1. Fresh visual entry starts in overview. The existing reading panel may retain its current catalog item without awarding extra progress; a retained reading selection is not an instruction to auto-enter detail. Restored explicit selection may open its focus shot if root's existing resume behavior requires it.
2. DOM chip, keyboard activation and direct object pick resolve through the same existing `selectItem(index)` path. Update the selected button immediately, then transition the camera. Do not change selection by sweeping an unrelated scene parameter. Selection of a new item resets its view to focus and its illustrative parameter to the documented default.
3. Clicking the already selected object holds focus; a visible “খুঁটিনাটি” action enters authored detail. This avoids accidental drill-down during touch picking. Dragging beyond a small threshold cancels the pending pick; touch interaction must distinguish page scroll from intended orbit.
4. Each detail states whether it is an enlarged physical feature or a conceptual diagram. A separate “করে দেখো” action exposes a process only where the row defines one. Do not show a universal “খুলে দেখো” explosion for this scene.
5. Process parameters use normalized internal 0–1 values but display semantic Bengali endpoint labels. Rice defaults to midpoint fill; oil/water default to midpoint fill; whole/cut reveals default to whole; energy comparison defaults to smaller illustrated quantity. No raw 0–100 control is labeled as nutrient percentage.
6. Back from process returns to detail (or focus if entered there); back from detail returns to focus; back from focus returns to overview. Preserve the read item and progress during back. Category breadcrumb can invoke overview in the scene without changing category/lesson history.
7. Reset returns the visual scene to overview, restores all illustrative parameters, cancels pending motion, removes the active callout and restores authored camera/visibility. It does not erase lesson progress or trigger an extra completion award.
8. At most one active restrained callout, outside essential features, may use a leader line. All eight exact labels remain in DOM controls with at least 44 × 44 CSS px hit targets. Suppress the callout if edge-safe placement without overlap is unavailable. Essential-feature overlap tolerance is zero.
9. Screen-reader state exposes selected item, view, parameter meaning and loading/failure status. Tab/Enter/Space work through normal controls; Escape backs out of detail/process where it does not override an existing dialog. Focus remains stable through camera motion. Reduced motion gives equivalent content via immediate state changes.

Quest picking, if active, must route the same named target to the original lesson index. The calorie diagram receives an accessible clickable teaching target; lack of a literal calorie mesh must not make that item unreachable. No worker changes scoring, persistence or mission logic to make the scene easier to integrate.

## Asset failure, lifecycle and quality

Keep lesson text, all eight selections and navigation usable with no WebGL or a failed required asset. Show an honest Bengali loading/failure message and a retry control; an explanatory DOM diagram or clearly labeled simplified fallback may stand in temporarily. Do not silently render the old collection and count it as successful pilot art. Capture failure separately; fallback evidence cannot pass primary geometry/material gates.

Root owns a single active renderer, stale-load cancellation/ownership, disposal, offscreen/background pause, capped frame delta, resize and quality selection. Category-owned meshes/materials expose explicit disposal ownership; shared cache resources are not disposed per instance. No arbitrary nearest-mesh pedagogical anchors. Lower detail preserves named targets, essential silhouettes and identical learning state behavior.

## Budgets and evidence gates

These are initial targets taken from the direction guide. No performance result is established by this brief. Baseline target is a real 4 GB Android phone; also review a weaker available phone and desktop. Record model, OS, browser, power/thermal conditions, viewport, device DPR, effective rendering DPR, quality tier and build SHA.

| Quantity | Baseline mobile target | Desktop comparison |
| --- | --- | --- |
| 30-second warmed interaction interval | Median ≤33.3 ms; p95 ≤40 ms | Record the same metrics; initial engineering target ≤16.7/20 ms, a proposed desktop extension rather than a guide measurement |
| Selection feedback / settle | ≤100 ms feedback; declared camera move ≤1 s | Same interaction targets |
| Cold selected scene payload | Overview ≤3 MiB; optional detail ≤2 MiB on demand | Initially use the same assets and caps; no separate desktop download increase without measured benefit |
| First usable scene | ≤5 s at declared 10 Mbps / 100 ms RTT | Same controlled network comparison; report native desktop conditions separately |
| Visible complexity | ≤150k rendered triangles, ≤100 main-pass draw calls | Start with same cap; report shadow/multipass work separately |
| Estimated decoded scene textures | Aim ≤64 MiB, including mipmaps | Same initial cap |
| Pixels / shadows | Effective DPR ≤1.25, one 1024² shadow caster initially | Start with same validation tier; higher tier is optional and must be reported separately |
| Teardown | No rising resource/listener trend over 20 swaps/revisits | Same test; distinguish bounded shared cache from leak |

Required images: 1440 × 900 overview; 360 × 800 overview, rice focus/detail, fish focus/detail, active annotation, and parameter minimum/maximum; 768 × 1024 layout; neutral-material and final-light pairs; required-asset failure fallback. Capture scene crop **and** full page. Also capture each of the remaining six mapped item targets and their detail/diagram states at mobile size to prove coverage. Open every image used as acceptance evidence.

Each capture record includes seed, build SHA, route and visible category title, item index/ID, view, parameter, viewport, usable camera rectangle, drawing buffer, quality, reduced-motion flag, loading/asset-ready state and console/network result. Save baseline and candidate at identical framing where possible, plus the newly authored composition. Record projected subject bounding box and masks for rice surface, bowl lip, fish head, fins and tail. Add a short motion sequence or timed frames covering selection, orbit, detail, resize and return.

Director acceptance requires explicit pass/fail for: identity/geometry, materials/light, composition/annotations, eight-item learning truth, keyboard/touch/reduced-motion behavior, lifecycle/runtime and measured device budgets. No build-only, image-only or desktop-only acceptance. A pending device gate stays pending. Highest-priority rejection corrections are: exposed smooth rice mound or false bowl thickness; unsupported fish anatomy/material; annotations or camera clipping that obscure an essential feature. Wrong item mapping or a false explanatory diagram is an independent blocker regardless of appearance.

Runtime changes require `npm run check`, `npm run build` and relevant existing camera/mapping tests (`npm run test:nature`) plus focused new mapping/state/lifecycle checks as the contract appears. `scripts/browser-smoke.mjs` runs with GPU disabled and cannot establish visual realism or phone GPU performance. This documentation-only brief does not justify running compilation as substitute evidence.

## Packet ownership and handoff

| Packet | Owned paths | Dependency / acceptance |
| --- | --- | --- |
| Director brief | `docs/animation-remake/briefs/food-93e5f02c.md` | This file; later acceptance is based on actual evidence, not this plan alone |
| Asset/reference worker | `public/models/remake/food-93e5f02c/` | Reference and provenance inventory, hero identity, asset sizes/LOD, explicit gaps; no shared loader edits |
| Category builder | `src/components/explorer/remake/food/food-93e5f02c.ts` | Approved root contract; explicit named targets, eight IDs, original geometry/materials, shot/detail/process hooks and disposal ownership |
| Independent reviewer | `docs/animation-remake/evidence/food-93e5f02c.md` and its indexed evidence assets | Real opened images, mapping/access/runtime review, measured checks and unresolved gates |
| Root integration | `src/components/explorer/heroes.ts`, `render.ts`, `figures.ts`, `cinematic-camera.ts`, `model-loader.ts`, `src/data/heroes.ts`, `src/data/collections.ts`, `src/pages/[world]/index.astro`, any shared contract modules | Single owner; route/adapter, annotations, lifecycle/camera, progress/quest compatibility, browser/device checks and release |

Do not replace global `riceBowl`/`fishSmall` shelf builders to complete this pilot. They are reused elsewhere. New category geometry stays isolated; requests for shared changes go to root. Do not create a new contract module or alter shared types concurrently without root ownership. The category worker cannot claim review acceptance, commit, push or deploy.

Next dependency: root records the actual baseline and accepts the adapter contract; asset worker supplies reference/rights records; builder produces the rice silhouette prototype. Director inspects that representative object before accepting final hero geometry or expanding conventions to other worlds.
