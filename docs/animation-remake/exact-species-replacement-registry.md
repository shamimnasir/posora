# Exact-species replacement registry

Last reviewed: 2026-10-26

This registry prevents a visually attractive comparison model from silently becoming a false species claim. Posora may temporarily use a comparison only when the interface says plainly that it is not the target species and shows an exact-species reference photograph beside it.

## Open replacement queue

| Learning object | Current 3D comparison | Exact reference now shown | Free exact exterior 3D search result |
| --- | --- | --- | --- |
| ইলিশ (*Tenualosa ilisha*) | Pacific herring (*Clupea pallasii*), CC0 | Wikimedia Commons photo, CC BY-SA 4.0 | No downloadable permissively licensed exact exterior model found by scientific/common-name search |
| দোয়েল (*Copsychus saularis*) | European robin, CC BY 4.0 | Wikimedia Commons photo, CC BY-SA 3.0 | No downloadable permissively licensed exact exterior model found |
| চিতা বিড়াল (*Prionailurus bengalensis*) | Domestic Bengal cat, CC BY 4.0 | Sundarban photo on Wikimedia Commons, CC BY-SA 4.0 | No downloadable permissively licensed exact exterior model found |
| রেসাস বানর (*Macaca mulatta*) | Japanese macaque, CC BY 4.0 | Wikimedia Commons photo, CC BY-SA 4.0 | An exact CC BY-SA museum skeleton scan exists, but it is not an exterior animal model and is unsuitable as the primary visual |
| সাদা-পিঠ শকুন (*Gyps bengalensis*) | Griffon vulture (*Gyps fulvus*), CC BY 4.0 | Bangladesh photo on Wikimedia Commons, CC BY-SA 4.0 | No downloadable permissively licensed exact exterior model found |

Searches covered scientific names and common names on Sketchfab, Wikimedia Commons, Smithsonian/Open Access discovery pages and general web search. A paid Hilsa model was excluded because the project currently permits free sources only.

## Acceptance gate for a replacement

A candidate replaces a comparison only when all of the following pass:

1. The creator or collection explicitly identifies the same species, ideally with a scientific name.
2. The license permits reuse, derivatives and website delivery (CC0, CC BY or compatible CC BY-SA); attribution is stored next to the asset.
3. It is an exterior specimen or reconstruction appropriate to the lesson—not a skeleton, prey/carcass scan, generic relative or AI guess presented as exact.
4. GLB/glTF loads without external missing files, has usable UV/material data, and is optimized for mobile delivery.
5. Desktop and 360px visual tests confirm framing, focus, explosion behavior and fallback.
6. The source link, author, license and any scientific uncertainty remain visible in the product.

## Upgrade procedure

When an exact model appears, replace only the asset mapping, credit and comparison copy; keep the exact photograph as a recognition aid. Run `npm run audit:model-rights`, `npm run audit:model-coverage`, `npm run test:licensed-models`, `npm run test:world-render` and the production build before release.
