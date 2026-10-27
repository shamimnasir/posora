# Model versus teaching-diagram policy

Posora contains 223 learning objects. “Coverage” does not mean forcing all 223 into decorative 3D. It means choosing the visual form that teaches each object most accurately.

## Use an exact or disclosed-example 3D model when

- the child is learning the form of a physical animal, plant, food, tool, organ or object;
- rotation, scale, surface, assembly or an exploded view reveals something meaningful;
- the identity and license can be verified; and
- mobile performance remains acceptable.

## Use an accurate interactive teaching diagram when

- the subject is a process, force, relationship, quantity, language idea, emotion or social situation;
- real scale is impossible or misleading (solar system, atoms, cells, weather systems);
- the lesson needs comparison, sequencing or cause-and-effect more than surface realism; or
- no responsible exact asset exists.

These diagrams must disclose that scale or distance is not proportional where relevant. They still need interaction, explanatory facts and keyboard/reduced-motion fallbacks; “diagram” is not permission for an unlabeled primitive.

## Never do

- label a relative, domestic breed or generic mesh as the target species;
- turn a paid, editorial-only or unclear-license asset into a production dependency;
- use a realistic image that contradicts the lesson text;
- load a large 3D runtime on initial mobile paint merely to decorate the page; or
- count a visual as covered when clicking it produces no explanation.

## Quality tiers (enforced)

`src/data/model-quality.ts` classifies every licensed or authored figure as `exact-licensed`, `accurate-authored`, `disclosed-comparison`, `teaching-diagram` or `replacement-required`, and gives every procedurally drawn item in a mixed lesson an explicit reason. `npm run audit:model-coverage` fails when an exact-object lesson uses a `replacement-required` figure, is drawn procedurally, or shows a comparison/teaching illustration without an exact reference photograph on disk. A model that merely loads is not counted as satisfactory.

The automated model-coverage audit is the inventory. The exact-species registry is the replacement queue. Together they make every item either a verified physical model, a clearly disclosed example/comparison, or an intentional teaching diagram.
