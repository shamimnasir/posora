# Posora accuracy and experience audit

## Goal

Make every public claim traceable, every displayed number either computed or sourced, and every animation teach a relationship instead of merely decorating the page.

This is a corpus audit, not a single-page review. The site currently contains 833 learning items, 87 labs, 89 missions, public marketing pages, printables, and shared 3D engines. A reliable audit therefore needs repeatable checks as well as manual review.

## Current confirmed corrections

1. Saturn's moon count was 146. NASA's current page lists 293 confirmed moons as of August 2026. The shared Saturn record now says 293, so the homepage demo, explorer statistics, comparisons, and generated content all update together.
2. The homepage said every learning item had its own 3D model. The implementation has one live procedural 3D scene per category. Public and machine-readable copy now makes that distinction.
3. The homepage said all printable material was free. The free printable sheets are free, while complete world worksheet packs are a membership feature. The FAQ now distinguishes them.
4. The machine-readable description said there were three missions per world. The actual count is computed and varies by world. It now reports the computed total.

## Audit method

### 1. Build a claim register

- Extract every sentence containing a measurement, date, count, superlative, health recommendation, historical assertion, or current-status claim.
- Group claims by subject and volatility.
- Mark each claim as computed, sourced and stable, sourced and time-sensitive, qualitative, or unsupported.
- Treat child health, food safety, emergency guidance, money, and current astronomy as high-risk.

### 2. Verify facts against primary sources

- Astronomy: NASA, IAU, ESA and mission pages.
- Health and nutrition: WHO, UNICEF, FAO and Bangladesh government guidance.
- Bangladesh geography, population, climate and economy: BBS, Bangladesh Bank, BMD, BWDB and relevant ministries.
- Physics, chemistry and mathematics: standards bodies, textbooks, reference datasets and original equations.
- History and biography: museums, archives, universities and primary institutional biographies.
- Store the source URL, verification date and scope beside volatile source data.
- Replace false precision with a range or plain explanation when the evidence does not support one exact number.

### 3. Audit every interactive model

- Trace each slider, graph, comparison and animation to its input data and formula.
- Label conceptual scenes as conceptual and not to scale.
- Label scale models with the exact dimension that is to scale.
- Remove decorative meters that imply measurement.
- Check units, rounding, limits, zero cases and impossible combinations.
- Test all 87 labs and all seven mission engines with boundary values and repeated seeds.

### 4. Audit child-facing UX

- Test at 360, 768, 1024 and 1440 pixel widths, at 200 percent text zoom, and with keyboard-only navigation.
- Test reduced motion, dark mode, slow device behavior and WebGL failure.
- Check that every first screen offers one obvious action and no wall of instructions.
- Check touch targets, focus order, focus visibility, Bengali line breaks and screen-reader names.
- Test with clean storage, existing progress, a stale member cookie and empty local D1.

### 5. Add permanent safeguards

- Add a content-lint command that rejects unsourced volatile figures, forbidden em dashes, duplicate item icons, and hand-written coverage counts.
- Add formula tests for every computed lab kind.
- Add screenshot checks for the shared world shell, space shell, lab shell and mission overlay.
- Add an accuracy review date to current-status datasets such as moon counts and mission status.
- Re-run the claim register before every public release.

## UI and interaction plan

### Priority 1: make the activity the lesson

- Replace long introductory paragraphs with one short observation, one action, and one result.
- Keep the three reading depths, but show the smallest explanation only after the learner changes or selects something.
- Move the most important relationship into the model. Example: instead of explaining orbital period in a paragraph, let the learner run Earth and the selected planet side by side and stop after one orbit.
- Use progressive disclosure for sources, derivations and advanced context.

### Priority 2: make motion explanatory

- Every animation should answer one question: what moved, why it moved, and what changed because of the learner's action.
- Prefer direct manipulation over autoplay. Autoplay can demonstrate once, then stop and wait.
- Preserve state before and after a change so the learner can compare.
- Use consistent motion language: rotation for cycles, translation for movement, growth for quantity, and color only for category or state.
- Never animate a quantity without showing its value and unit.

### Priority 3: reduce cognitive load

- Show one primary action per viewport and move secondary controls behind a clearly named menu or next step.
- Replace repeated explanatory copy with visible affordances and short labels.
- Keep persistent progress, XP and streak UI out of the main learning stage unless it changes the next action.
- Break long reading into observation, explanation, evidence and try-it sections.
- Keep body text at least 16 pixels and ordinary control labels at least 14 pixels.

### Priority 4: improve low-end phone behavior

- Pause all render loops when the canvas is outside the viewport or the tab is hidden.
- Cap device pixel ratio and reduce geometry and effects on slow devices.
- Load the 3D engine only when the stage is near the viewport.
- Provide a useful static or 2D fallback with the same lesson, not merely an error message.
- Avoid simultaneous background animation, auto-rotating comparisons and celebratory effects.

## Definition of done

- Every extracted high-risk claim has a primary source or is removed.
- Every time-sensitive claim has a verification date.
- Every model is explicitly marked conceptual or to scale.
- Every computed output has a formula test and sane boundary behavior.
- All site routes build successfully with zero errors.
- The shared shells pass keyboard, reduced-motion, mobile, 200 percent zoom and stale-cookie checks.
- The public copy never claims more coverage or functionality than the implementation provides.

## Implemented shared-shell improvements

- Every category now opens with a short action cue directly on the model stage.
- Progress, streak and XP controls are collapsed under `আমার অগ্রগতি` so they do not compete with the lesson.
- Every procedural model states when its geometry, scale or distance is conceptual.
- Idle turntable motion demonstrates for six seconds and then stops. Explicitly starting it keeps it running.
- Auto-changing comparison charts advance once and stop instead of cycling forever.
- Mobile action bars scroll horizontally and preserve 44-pixel touch targets.
- 3D rendering is capped at 1.5 device pixels per CSS pixel and remains paused outside the viewport or in a hidden tab.
- A failed WebGL load now leaves the reading and activities usable and explains the fallback.
- `npm run audit` rejects known stale claims, forbidden em dashes and the specific overclaims corrected in this audit.
