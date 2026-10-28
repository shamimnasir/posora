# Exact-species replacement registry

Last reviewed: 2026-10-28

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

## Posora-authored teaching illustrations (2026-10-28 queue)

These 23 items are drawn by Posora's own generators (`scripts/generate-original-*.mjs`, generation 2) and are classified `teaching-diagram` in `src/data/model-quality.ts`. Each shows an exact Wikimedia Commons photograph beside the model (`src/data/reference-photos.ts`, evidence in `evidence/reference-photo-licenses.json`). Replace a row only through the acceptance gate below.

| Learning object | Search result (Sketchfab downloadable API, Wikimedia Commons, Smithsonian Open Access) |
| --- | --- |
| তাল (*Borassus flabellifer*) | **Imported 2026-10-28 as a supplement:** Sketchfab “Palmyra” by P.S.Thng (@MidNoon), CC BY 4.0 (licence checked via the public API; evidence in `evidence/sketchfab-cc-by-licenses.json`). The source is the palmyra **fruit** (one cut open to show the kernels) on a wooden board, not the tree, so the board was removed and the fruit sits beside the whole-palm teaching figure (`public/models/palmyra_fruit_01/`). The tree itself remains a teaching diagram with a reference photo. |
| ভাত ও ডাল | **Downloaded and held back 2026-10-28:** Sketchfab “Dal bhat scans with iPhone12 Pro” by seirogan, CC BY 4.0. It is a phone LiDAR scan of a *Nepali* dal bhat thali (rice, dal and three curries in a steel compartment plate) with noisy surfaces. It would turn an accurate Bangladeshi plate (rice with dal in a bowl) into a comparison, so the Posora teaching model and its Bangladeshi reference photo stay (owner decision, 2026-10-28). The importer keeps the entry behind `SKETCHFAB_INCLUDE_HELD=1`. |
| মিষ্টি | **Imported 2026-10-28:** Sketchfab “GULAB JAMUN” by seirogan (uid 46e246f1…), CC BY 4.0: three textured গোলাপজাম in syrup in a glass bowl (`public/models/gulab_jamun_01/`, 0.7 MB). Exact for one kind of মিষ্টি; the credit says রসগোল্লা, চমচম and সন্দেশ look different, and the কালোজাম reference photo stays below. The second upload (uid 4ba688af…) was not needed. |
| সুন্দরী, গোলপাতা (whole plant), পাট, কদম, হিজল, এলাচ গাছ, থানকুনি | No free downloadable exact model found. Generic “mangrove” models are *Rhizophora* or unidentified and were rejected. |
| খিচুড়ি, ভর্তা, পিঠা, পায়েস, হালিম, ইফতার, পান্তা ভাত | No free exact model found; Sketchfab “Khichadi Express” (4k faces) was too crude to accept. |
| জিরা, ধনে, তেজপাতা, সরিষা, মেথি, গরম মশলা | Only non-commercial (CC BY-NC-SA) coriander scans and an AI-generated fenugreek plant were found; all rejected. |

## Mixed-lesson replacement backlog

Reported (not failing) by `npm run audit:model-coverage`: ছাপাখানা and বাষ্পীয় ইঞ্জিন still use stand-in figures (no free exact model found on Sketchfab, Poly Haven, Smithsonian 3D or Wikimedia Commons STL). চাকা (a bullock-cart wheel) and খনিজ (a quartz cluster) are now `accurate-authored` Posora models built from the object's construction and crystal geometry (`scripts/generate-original-wheel-mineral-models.mjs`). The 1903 Wright Flyer (উড়োজাহাজ), a *Triceratops horridus* skeleton (ডাইনোসর) and a *Poliella prima* trilobite (জীবাশ্ম) were replaced on 2026-10-28 with Smithsonian Open Access CC0 scans via `scripts/import-smithsonian-cc0-models.mjs`.

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
