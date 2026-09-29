# Food pilot review record — 2026-09-29

## Current disposition

**Pilot implementation in progress; not accepted for sitewide replication.** Desktop, tablet and mobile browser captures now show the CC0 barramundi resting on the platter without mesh deformation, plus a progressive eye/gill close-up at the deepest reveal. These are meaningful improvements, not full Food-world acceptance.

## Changes in this iteration

- Replaced the deformed fish contact pose with the intact licensed scan. The platter's opaque surface hides the lowest fin tips while the ventral body meets the ceramic.
- Added a progressive third fish reveal: whole-fish view, then a closer study, then an eye/gill macro with an explanatory note.
- Tuned the fish view for mobile, tablet and desktop to keep the complete silhouette and clear the controls at the whole-fish detail stage; adjusted the phone-only macro target so the eye, gill cover and snout remain visible.
- Kept the overview fish and macro-study fish as separate instances of the same CC0 asset.
- Reduced the exposed rice support mound, added a deterministic subtle rice micro-pattern, increased visible rice grains from 2,300 to 3,400 and reduced the macro saucer.
- Expanded Food browser coverage to 360×800, 768×1024 and 1440×900 CSS-pixel viewports, including a low-angle platter-contact capture.
- Made the sticky header opaque against page content after production-build screenshots showed underlying copy bleeding through it. Updated the screenshot harness to account for the sticky-header offset, then visually rechecked the clean mobile macro capture.
- Added project-generated guava and cucumber skin maps with provenance and hashes; centered the guava cut-face macro and refined the salt crystal size/placement after the first visual review exposed an off-frame guava and oversized salt chunks.
- Expanded close-up coverage to the six renderable supporting ingredients (oil, guava, salt, water and cucumber; rice/fish are captured in their dedicated stages) and checked their return-to-table controls at all three viewports. This is functional coverage; detailed visual approval remains open for each supporting-food macro.
- Tuned medium/landscape detail scale separately from portrait after review found the guava cropped on mobile, then oil/water/cucumber cropped or overwhelmed the controls on wider screens. Current 57-image capture set was visually checked for centered guava, recognizable oil/water vessels, and the full cucumber cut end at mobile/tablet/desktop widths.
- Rebuilt the water close-up as a translucent liquid volume with a surface and horizontal glass rim; the prior macro showed a front-facing ring and nearly empty vessel. The new desktop capture confirms the fill line and rim read correctly.

## Verification evidence

Canonical captures in this directory cover overview, focus, whole-fish detail, deep eye/gill macro, rice detail, low-angle contact, and focus/detail captures for each supporting ingredient at mobile/tablet/desktop sizes. The browser smoke harness hides only its transient celebration canvas in screenshots so completed-item confetti does not obscure composition; production behavior is unchanged.

`SMOKE_BASE=http://127.0.0.1:8787 npm run test:food` passed against the production build served by local Wrangler with local bindings only. It verified all eight lesson labels, scene initialization, the licensed fish asset, selection/detail/return/calorie controls, the eye/gill macro explanation, no horizontal overflow and zero page errors at all three viewports. The run uses headless Chrome with SwiftShader; it is not physical-device performance or touch testing. The final captures are in this directory.

`npm run check` passed (219 files, zero diagnostics), `npm run audit` passed, `npm run build` passed, and local `npm run test:interaction` passed keyboard, reduced-motion, WebGL fallback, quiz and payment-boundary checks. Build still reports the existing >500 kB chunk warning.

Against the final local Worker build, `npm run test:interaction` passed keyboard, reduced-motion, WebGL fallback, quiz and payment-boundary checks; serial `npm run test:smoke` passed 17 routes × 3 viewports. An earlier parallel smoke attempt failed due navigation-context destruction and a `/space/` timeout while multiple browsers were running, so final route validation was run serially. Build still reports the existing >500 kB chunk warning.

## Open acceptance gates

- Independent art-direction review of the final non-deformed contact pose and macro. The available reviewer reached its usage limit before reviewing the final screenshots; current visual approval is internal, not independent.
- Real-device tablet/mobile touch and performance QA, including reduced-motion and WebGL context-loss lifecycle behavior.
- Authored detail/process endpoints and visual QA for the other six food items, plus accurate conceptual calorie/fiber representations.
- Final visual pass on the newly corrected guava close-up after its enlargement, plus final visual review of the oil, salt, water and cucumber close-ups on tablet and desktop (not only the mobile captures).
- Shared animation runtime contract and reference/asset provenance records before broad sitewide replication.
