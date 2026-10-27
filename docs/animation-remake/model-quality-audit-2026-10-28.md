# Model quality audit — 2026-10-28

The previous audit counted 98 "exact" mappings because every URL loaded. A visual review showed that 23 of them were Posora-generated primitives (polygon-blob crowns, cylinder sweets, pill-shaped rice). This pass reclassified, rebuilt and re-tested them.

## Inventory (223 learning objects)

| Tier | Count | Meaning |
| --- | --- | --- |
| exact-licensed | 78 | Scan or high-detail licensed model of the named object/species or its clearly named example |
| disclosed-comparison | 5 | ইলিশ, দোয়েল, চিতা বিড়াল, বানর, শকুন — labelled comparisons with exact photographs |
| teaching-diagram | 52 | 23 Posora-authored physical illustrations (each with an exact photograph) and 29 reasoned procedural designations in mixed lessons |
| replacement-required | 4 | চাকা, ছাপাখানা, বাষ্পীয় ইঞ্জিন, খনিজ (mixed lesson; reported backlog) |
| procedural concept | 84 | Items in teaching-diagram lessons (processes, emotions, money, places) |

## What changed

- **Botany (8):** rebuilt with `scripts/lib/procedural-kit.mjs`: shaped two-tone leaf blades, tapered curved branches, vertex shading and merged meshes. Diagnostic features now visible: সুন্দরী pneumatophores, buttresses and silvery leaf undersides; কদম tiered branches and golden ball flowers with styles; হিজল crooked trunk in water with hanging red racemes; tossa পাট stand with serrate tailed leaves, flowers and pods; থানকুনি stolons with reniform crenate leaves; তাল fan leaves on toothed petioles and fruit bunches; গোলপাতা stemless fronds (real fruit-head scan moved to mud level); এলাচ two-ranked leaves and prostrate fruiting panicles.
- **Dishes (9) and spices (6):** rebuilt as grain-level rice mounds, liquid dal with tempering, flecked bhorta, four named pitha, roshogolla/kalojam/chomchom/sandesh, haleem with birista, Bangladeshi iftar plate, panta in a clay sanki; slender ridged cumin, ribbed coriander, trinerved tejpata (*Cinnamomum tamala*), mustard, grooved fenugreek, Bengali gorom moshla.
- **Size:** a compact GLB writer (int16 positions, int8 normals, byte colours, meshopt) keeps each authored model at 15–760 KiB.
- **Exact reference photographs:** 23 new Wikimedia Commons photos (CC0, CC BY, CC BY-SA, public domain), most taken in Bangladesh, shown beside the model with author and licence links.
- **New exact scans:** Smithsonian CC0 1903 Wright Flyer, *Triceratops horridus* skeleton and *Poliella prima* trilobite replace a flying bird, a cartoon dinosaur and a primitive fossil.
- **Framing:** the collection stage now fits the selected subject's measured extent (posed bounds for rigged animals), looks down on flat subjects such as plates and creeping herbs, keeps the badge on screen at 390 px, and frames the single visible item at rest (the oversized rock no longer overflows).

## Evidence

Desktop (1440×900) and mobile (390×844) screenshots for every model state: `evidence/licensed-models/`. Photo licences: `evidence/reference-photo-licenses.json`. Smithsonian records: each model folder's `SOURCE-LICENSE.md`.

## Not done

- Sketchfab candidates for তাল, ভাত ও ডাল and গোলাপজাম need a signed-in Sketchfab session to download; they are recorded in the replacement registry, not integrated.
- The authored models are illustrations, not photorealistic or exact specimens, and are labelled as such.
