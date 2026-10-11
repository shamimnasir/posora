# Sitewide animation and learning audit (12 October 2026)

## What was checked

- All 11 world routes at mobile and desktop sizes: WebGL mounted, navigation and available controls were exercised.
- Space selection at mobile and desktop sizes: Earth and the other 10 bodies exposed reading, statistics and detail controls.
- Nine generic worlds: one object in each of 74 categories was opened, with a matching fact panel and working return control. The remaining items have records checked by the content audit, but were not individually visually reviewed.
- Food pilot at mobile, tablet and desktop sizes: all eight first-category items, selection, detail and calorie controls, with no page errors. The Food visual acceptance gate in `evidence/food-93e5f02c.md` remains open.
- Public SEO crawl: 264 sitemap URLs, 298 internal links and 573 images; no missing resources reported by the automated crawl.

These automated passes establish that the interfaces respond. They do not establish photorealistic quality or claim-by-claim scientific accuracy.

## Findings fixed in this pass

1. World introductions still described an old product blueprint, including interactions that the current pages do not offer. All 11 descriptions now describe available learning paths and tools.
2. The amphibian item in Life displayed a turtle. It now has a frog figure. The neem item displayed a mango tree; it now has its own tree silhouette.
3. An unknown collection figure silently displayed an unrelated face. It now uses a neutral marker, and the content audit fails if a static mapping names a missing figure, category or item.

## Remaining quality gap and execution order

The shared collection scene still presents many subjects as small primitive-built figures. Changing lighting alone will not make those shapes look like real objects. The work is an asset and scene-authoring program, with a separate accuracy pass for each subject.

1. **Finish the Food pilot.** Review the eight object close-ups on a real mobile device and desktop. Approve silhouette, material, touch targets, scene framing, loading time and whether the detail label points at the visible part. Record license and source for each external asset. Fix failed items before calling the visual system reusable.
2. **Create a repeatable scene contract.** Each subject gets one verified title and fact record, a visible selected state, a close-up camera target, optional reveal stages only where the geometry truly supports them, a return path, a text and image fallback, and reduced-motion behavior. Capture front/side/detail evidence at phone and desktop sizes.
3. **Prioritize high-visibility subjects.** Life trees and animals, Nature landscapes and weather, Space planetary interiors, Food ingredients, Physics machines, Chemistry molecules. These need subject-specific geometry or licensed models; a generic figure with a different color is not enough.
4. **Move through the remaining worlds.** Math, Money, Language, Social and Discovery should use precise teaching manipulatives, readable diagrams and authored interactions. Photorealism is useful for tangible objects, but can obscure abstract ideas such as fractions or feelings.
5. **Review claims with the actual visual.** Check the intro, on-screen cue, every selectable label, the model, fact panel, units, image alternative text and linked article together. A fact that is correct in isolation can still teach the wrong thing when attached to the wrong shape.
6. **Release per world after visual acceptance.** Require captures at 360px, tablet and desktop widths, keyboard and touch selection, reduced motion, WebGL fallback, link and image checks, and a real-device performance check. Record unresolved limitations in the world evidence note.

The current automated suites cover interaction regressions. A full editorial and visual review of every individual lesson and 3D subject remains a separate, substantial task and has not been certified by this pass.
