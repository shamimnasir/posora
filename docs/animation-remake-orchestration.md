# Orchestrating the world-animation remakes

## Status and scope

This is a repeatable planning and handoff system, not an animation implementation. The current catalog contains 11 worlds, 87 categories and 833 item entries. The catalog marks only Space as `open: true`; confirm actual route behavior before browser work, and do not enable closed routes as a side effect of scene work. The inventory command derives jobs and item labels from `src/data/worlds.ts` and existing collection mappings. It makes no model or network calls and does not prove visual quality.

The aspiration is cinematic, tactile educational 3D—not a promise to match a feature-film studio or a request to copy a studio's protected characters, models, textures, or signature designs. Translate “movie-like” into verifiable craft: strong silhouettes, researched forms, differentiated physically based materials, motivated lighting, considered camera composition, subject-specific motion and clear educational reveals.

## Model roles

- **GPT-6 Astra — director:** approve subject research, learning truth, shot design, visual/material direction, shared architecture decisions, high-risk exceptions and final evidence-based acceptance. Use high reasoning for the pilot and broad architecture; reserve xhigh for a difficult cross-world review that demonstrably needs it.
- **GPT-6 Luna — scoped work:** prepare asset/provenance packets, build isolated category scenes after their contract is accepted, and independently review implementation against the checklist. Keep tasks narrow, with named files and explicit dependencies. Use medium reasoning for a bounded build/review; lower effort is appropriate for mechanical edits.
- **GPT-6 Sol — escalation:** after two blocked or rejected attempts, ask Sol to diagnose the specific issue and propose a bounded correction. It does not bypass Astra's direction or acceptance.
- **Root coordinator:** owns shared runtime contracts, integrations, dependency sequencing, browser/device verification and release. Never allow workers to edit shared runtime files concurrently.

These assignments describe the intended workflow, not a guarantee that a model/API is available to a script or at a particular price. The generator prints suggested model IDs and prompts only; the coordinator dispatches them through Codex collaboration tools, reviews their output, and maintains status/evidence. See [OpenAI's model-selection guidance](https://developers.openai.com/api/docs/guides/model-selection) for current role-selection guidance.

## Generate the inventory and work packets

From the repository root:

```sh
node --experimental-strip-types scripts/animation-remake.mjs inventory
node --experimental-strip-types scripts/animation-remake.mjs task food 0 director
node --experimental-strip-types scripts/animation-remake.mjs task food 0 assets
node --experimental-strip-types scripts/animation-remake.mjs task food 0 builder
node --experimental-strip-types scripts/animation-remake.mjs task food 0 reviewer
```

The category index is zero-based and must be refreshed against the printed inventory when the catalog changes. Each task packet includes exact Bengali item labels, existing entry points and mapped figure IDs where available, proposed owned paths, world route state, implementation dependencies and a role-specific prompt. Do not treat a proposed path as permission to refactor a shared module. Preserve existing lesson/index mappings. A changed catalog digest invalidates packets generated from an earlier snapshot.

The `task` command is a prompt generator, not an agent dispatcher, renderer, asset downloader, billing system, approval tracker or completion tracker. It performs no automatic API calls. The root coordinator records results and evidence outside the generated prompt; generated `status: planned` must not be mistaken for current implementation status.

## Order of work

1. **Capture the real baseline.** Start the local site, verify the route/category and current selection behavior, and capture desktop and mobile screenshots plus console/network state. For routes marked closed, document that fact and keep implementation planning separate from enabling the route.
2. **Direct the Food pilot.** Begin with `food`, category index `0`, `খাদ্যের ছয় উপাদান`. Preserve its eight current item labels: `শর্করা`, `আমিষ`, `স্নেহ`, `ভিটামিন`, `খনিজ লবণ`, `পানি`, `আঁশ`, and `ক্যালরি`. Its title names six nutrient kinds, but the lesson also lists fiber and calories. Do not “correct” that apparent mismatch by dropping catalog items; have the content reviewer decide whether a later copy change is justified. The current mappings include `riceBowl`, `fishSmall`, `oilDrop`, `greenFruit`, `salt`, `glassWater`, `shrubPale`, and `sunDisc`; fiber and calories need an honest teaching representation rather than polishing an unrelated shrub or sun into a false physical object.
3. **Approve references and asset rights.** The director identifies each species/object and required views; the asset worker records direct source URLs, license/attribution, modification terms, file hash, dimensions, transfer size and fallback. A reference image is not automatically reusable as a texture. If a suitable permissive asset is not available, present an original procedural/commissioned option for approval—do not fabricate provenance.
4. **Agree the shared runtime contract.** Root and Astra define lifecycle/cancellation, named educational targets, scene states, quality tiers, annotation/accessibility behavior, camera framing and asset ownership. No broad parallel scene build before this contract is accepted.
5. **Build and review the complete pilot.** Luna implements only its owned paths. Another reviewer checks the scene independently against native-size screenshots, states, reduced motion, keyboard/touch behavior and mobile resource measurements. Astra accepts or rejects with evidence. A build passing is not a realism pass.
6. **Prove one representative scene per world.** Sequence Nature, Life, Space, Physics, Chemistry, Discovery, Math, Money, Language and Social after Food establishes reusable contracts. Space's bespoke explorer and Nature's separate viewer must be adapted explicitly. The order expresses migration priority, not route availability.
7. **Expand by category, then reconcile.** Generate all remaining packets from the current catalog. Reconcile every category and item to a truthful target/explanation, audit for duplicate or missing IDs, test every route actually in scope, and collect device evidence before claiming a world complete.
8. **Integrate and release.** Root merges accepted isolated work, runs project checks and browser/device verification, reviews the deployment diff, then performs the already-authorized commit, push and deploy workflow. A model worker never releases directly.

## Packet and status discipline

For each category, retain: stable task ID; catalog digest; world slug and route state; zero-based category index and exact title; all item IDs/labels; director brief and reference records; worker-owned files; dependency IDs; asset provenance; scene states; viewport/device/build evidence; performance budget and measurements; reviewer findings; rejection reasons; and status.

Use explicit states: `planned`, `blocked-on-direction`, `ready-to-build`, `implementing`, `awaiting-review`, `rejected`, `accepted`, and `integrated`. Only the director may mark `accepted`, and only with visual, interaction, learning-content and device evidence. Only the root coordinator may mark `integrated`. A generated prompt, source edit, successful compiler run, or uninspected screenshot is not acceptance. Preserve rejected attempts and notes so the same failure is not repeated.

## Release gates

Use the detailed visual and technical contract in [animation-remake-direction.md](animation-remake-direction.md). At minimum, every accepted scene must demonstrate:

- Recognizable subject identity at a 360 px mobile viewport before reading labels; no merely recolored primitive as the hero.
- Overview, selected-object close-up, and a meaningful authored detail/process view; the deeper view teaches something new.
- No essential feature clipped or obscured by UI; Bengali labels remain readable and accessible outside the object silhouette.
- Exact mapping of every current item to an honest object, model or labeled diagram; simplifications and scale distortions are disclosed.
- Pointer/touch, DOM keyboard controls, reset/back behavior, and reduced-motion equivalent.
- Native-size screenshots and a motion sequence, plus actual measurements on the declared baseline phone. Record the model, OS, browser, build SHA, viewport, DPR and test conditions.
- No uncaught runtime errors or failed required assets, and no stale asynchronous model load attached to a replaced scene.

Run `npm run check`, `npm run build`, and relevant existing mapping/camera tests when runtime code changes. Use the browser smoke script as route/layout coverage only; it launches with GPU disabled and is not evidence of cinematic rendering or real GPU performance. Report incomplete device evidence honestly.

## Role prompt files

The role templates live in `docs/animation-remake/prompts/`:

- `director.md` — research, learning/visual brief and acceptance gates.
- `assets.md` — sourcing and license/provenance record.
- `builder.md` — isolated implementation with file ownership.
- `reviewer.md` — independent screenshot, interaction and evidence audit.

The detailed direction guide documents the current code's distinct animation systems, Food pilot, architecture migration, proposed performance budgets, per-world art direction and completion criteria. Update that guide when a measured baseline or accepted contract changes; do not edit target budgets to make a failed measurement appear to pass.
