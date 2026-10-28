/** Exact-object licensed models. The key is a figure identity, never a vague category. */
export const LICENSED_FIGURES: Record<string, { url: string; height: number; fitAxis?: 'x' | 'y' | 'z' | 'longest'; focusY?: number; rotationX?: number; rotationY?: number; rotationZ?: number; colorBoost?: number; colorTint?: string; leafShadows?: boolean; playAnimations?: boolean; animationClip?: string }> = {
  bulb: { url: '/models/lightbulb_led/lightbulb_led_1k.gltf', height: 1.45 },
  // The Food pilot's CC0 Barramundi is also a faithful model for generic fish
  // examples. Species-specific figures such as ইলিশ remain distinct.
  fishSmall: { url: '/models/remake/food-93e5f02c/barramundi-fish-1024-webp.glb', height: 1.15 },
  // Museum scan of a Ganges river dolphin skeleton, not a living animal model.
  // The UI shows that limitation beside the model and preserves CC BY-SA attribution.
  // The source scan is displayed mounted upright; roll it onto its side for
  // the natural horizontal swimming/anatomy pose used by this stage.
  gangesDolphinSkeleton: { url: '/models/ganges_dolphin_skeleton_01/ganges-dolphin-skeleton.glb', height: 1.25, fitAxis: 'longest', rotationZ: -Math.PI / 2 },
  // CC BY 4.0 photogrammetry scan of a whole fried fish. This is a generic
  // fried-fish example, not a Bangladesh recipe- or species-specific claim.
  friedFishScan: { url: '/models/ikan_goreng_01/ikan-goreng.glb', height: 1.25, fitAxis: 'longest' },
  // Broad-class specimens are explicitly named; neither is presented as local fauna.
  mammalSpecimen: { url: '/models/realistic_red_fox_01/red-fox.glb', height: 1.28 },
  reptileSpecimen: { url: '/models/realistic_panther_chameleon_01/panther-chameleon.glb', height: 2.1, fitAxis: 'longest' },
  birdSpecimen: { url: '/models/realistic_indian_peafowl_01/indian-peafowl.glb', height: 0.95, fitAxis: 'longest' },
  amphibianSpecimen: { url: '/models/realistic_axolotl_01/axolotl.glb', height: 1.25, fitAxis: 'longest', rotationY: Math.PI / 2 },
  // Shown as a concrete fruit example for the generic vitamin-rich fruit tile.
  greenFruit: { url: '/models/avocado/avocado.glb', height: 1.05 },
  // RISD Nature Lab museum scan of one jackfruit pod. It is a fruit specimen,
  // not a growing tree or a claim that every jackfruit has the same shape.
  // The source scan lies on its side; rotate the elongated fruit upright so
  // it reads like the tree-hanging jackfruit specimen rather than a slab.
  jackfruitScan: { url: '/models/jackfruit_risd_scan_01/jackfruit-pod.glb', height: 0.88, fitAxis: 'longest', rotationY: Math.PI / 2, rotationZ: Math.PI / 2 },
  // 12-photo photogrammetry of a banyan tree by Jimmy Gunawan; no location or
  // scientific species is claimed because the source does not specify either.
  banyanTreeScan: { url: '/models/banyan_gunawan_01/banyan-tree.glb', height: 1.55, fitAxis: 'longest' },
  // Photogrammetry of Bombax ceiba; the scan retains a small amount of its
  // roadside setting, so show it as a real place/specimen rather than a cutout.
  bombaxCeibaScan: { url: '/models/bombax_ceiba_scan_01/bombax-ceiba.glb', height: 1.45, fitAxis: 'y', leafShadows: false },
  // Exact CC0 specimens used in the Food and Life collections and fruit wheel.
  bananaFruit: { url: '/models/bananas/bananas.glb', height: 1.05 },
  lycheeFruit: { url: '/models/food_lychee_01/food_lychee_01.glb', height: 0.95 },
  gingerRoot: { url: '/models/food_ginger_01/food_ginger_01.glb', height: 0.82 },
  // Free CC BY scan of a mint-leaf cluster; depict the leaf specimen, not a
  // whole mint plant. The 256px texture and low polygon count keep it light.
  mintLeavesSpecimen: { url: '/models/mint_leaves_01/mint-leaves.glb', height: 1.15, fitAxis: 'longest' },
  // CC BY 4.0 photogrammetry specimen of Tulsi in its cement planter.
  tulsiSpecimen: { url: '/models/tulsi_tree_01/tulsi.glb', height: 1.08, fitAxis: 'longest', focusY: 0.2 },
  rock: { url: '/models/rock_07/rock_07.glb', height: 1.35 },
  microscope: { url: '/models/industrial_microscope/industrial_microscope.glb', height: 1.5 },
  compass: { url: '/models/seadogs_compass/seadogs_compass.glb', height: 0.72 },
  clockFace: { url: '/models/alarm_clock_01/alarm_clock_01.glb', height: 0.9 },
  telephone: { url: '/models/korean_public_payphone_01/korean_public_payphone_01.glb', height: 1.5 },
  // Poly Haven CC0 1K glTF specimens. Collection mappings use distinct keys
  // so a real model can never silently imply a different exact species/object.
  polyBinoculars: { url: '/models/binoculars/binoculars_1k.gltf', height: 0.62 },
  polyLaptop: { url: '/models/classic_laptop/classic_laptop_1k.gltf', height: 0.62 },
  polyCashRegister: { url: '/models/CashRegister_01/CashRegister_01_1k.gltf', height: 0.82 },
  polyGamepad: { url: '/models/gamepad/gamepad_1k.gltf', height: 0.2 },
  polyCalathea: { url: '/models/calathea_orbifolia_01/calathea_orbifolia_01_1k.gltf', height: 0.9 },
  polySweetPotato: { url: '/models/sweet_potato/sweet_potato_1k.gltf', height: 0.3 },
  polyApple: { url: '/models/food_apple_01/food_apple_01_1k.gltf', height: 0.48 },
  polyKiwi: { url: '/models/food_kiwi_01/food_kiwi_01_1k.gltf', height: 0.42 },
  polyPomegranate: { url: '/models/food_pomegranate_01/food_pomegranate_01_1k.gltf', height: 0.48 },
  polyAsianPear: { url: '/models/food_pears_asian_01/food_pears_asian_01_1k.gltf', height: 0.52 },
  polyOnion: { url: '/models/yellow_onion/yellow_onion_1k.gltf', height: 0.42 },
  polyCroissant: { url: '/models/croissant/croissant_1k.gltf', height: 0.28 },
  polyAnthurium: { url: '/models/anthurium_botany_01/anthurium_botany_01_1k.gltf', height: 1.05 },
  polyFern: { url: '/models/fern_02/fern_02_1k.gltf', height: 1.05 },
  polyPottedPlant: { url: '/models/potted_plant_01/potted_plant_01_1k.gltf', height: 1.05 },
  polySchoolChair: { url: '/models/SchoolChair_01/SchoolChair_01_1k.gltf', height: 0.9 },
  polySchoolDesk: { url: '/models/SchoolDesk_01/SchoolDesk_01_1k.gltf', height: 0.8 },
  // Lies flat: fit its length, not its thickness, or the binder balloons.
  polyNotebook: { url: '/models/binder_notebook/binder_notebook_1k.gltf', height: 0.9, fitAxis: 'longest' },
  polyMeasuringTape: { url: '/models/measuring_tape_01/measuring_tape_01_1k.gltf', height: 0.38 },
  polyRuler: { url: '/models/ruler/ruler.glb', height: 1.25, fitAxis: 'longest' },
  polyMagnifier: { url: '/models/magnifying_glass_01/magnifying_glass_01_1k.gltf', height: 0.48 },
  polyCamera: { url: '/models/Camera_01/Camera_01_1k.gltf', height: 0.55 },
  polyGameConsole: { url: '/models/gaming_console/gaming_console_1k.gltf', height: 0.5 },
  // The selected-object camera magnifies licensed figures. Keep the pot below
  // the control shelf, while the pan's long handle needs a larger long-axis fit.
  polyEnamelPot: { url: '/models/pot_enamel_01/pot_enamel_01_1k.gltf', height: 0.68, focusY: 0.2 },
  // A cooked-rice bowl specimen for the carbohydrate example; not a rice-and-dal meal.
  riceBowlScan: { url: '/models/rice_in_bowl_01/rice-in-bowl.glb', height: 0.72, fitAxis: 'longest' },
  polyBrassPan: { url: '/models/brass_pan_01/brass_pan_01_1k.gltf', height: 1.02, fitAxis: 'longest', rotationY: Math.PI / 2 },
  polyMedicalBox: { url: '/models/medical_box/medical_box_1k.gltf', height: 1.12, fitAxis: 'longest' },
  polyPantryFoods: { url: '/models/long_life_food/long_life_food_1k.gltf', height: 0.88, fitAxis: 'longest' },
  polyLemon: { url: '/models/lemon/lemon_1k.gltf', height: 0.52 },
  polyChemistrySet: { url: '/models/chemistry_set/chemistry_set_1k.gltf', height: 0.72 },
  // The source is laid flat; fit its longest axis so the tiny case thickness
  // cannot be mistaken for the model's height and inflate the band to meters.
  polyDigitalWatch: { url: '/models/digital_wrist_watch/digital_wrist_watch_1k.gltf', height: 0.36, fitAxis: 'longest' },
  polyLime: { url: '/models/food_lime_01/food_lime_01_1k.gltf', height: 0.42 },
  // CC0 Nymphaea cultivar scan; used as a clearly disclosed genus-level
  // water-lily example, not claimed to be the exact local শাপলা cultivar.
  waterLilySpecimen: { url: '/models/water_lily_nymphaea_01/water-lily.glb', height: 1.15, fitAxis: 'longest', focusY: 0.12 },
  // Exact mango-tree specimen; CC BY 4.0 credit is recorded with the asset.
  mango: { url: '/models/mango_tree_01/mango_tree.glb', height: 1.3, colorBoost: 1.22, leafShadows: false },
  // A CC0 date-palm comparison only. Its feather-shaped fronds are visibly
  // different from Tal's fan-shaped leaves; never present it as a Tal specimen.
  datePalmAnalogy: { url: '/models/date_palm_analogy_01/date-palm.glb', height: 1.5, fitAxis: 'longest', leafShadows: false },
  talPalm: { url: '/models/posora_tal_palm_01/tal-palmyra-palm.glb', height: 1.5, fitAxis: 'y', leafShadows: false },
  sundari: { url: '/models/posora_sundari_01/sundari-mangrove.glb', height: 1.62, fitAxis: 'y', leafShadows: false },
  golpata: { url: '/models/posora_golpata_01/golpata-nypa-palm.glb', height: 1.38, fitAxis: 'longest', leafShadows: false },
  jute: { url: '/models/posora_jute_01/jute-stand.glb', height: 1.48, fitAxis: 'y', leafShadows: false },
  kodom: { url: '/models/posora_kadam_01/kadam-tree.glb', height: 1.56, fitAxis: 'y', leafShadows: false },
  hijol: { url: '/models/posora_hijal_01/hijal-tree.glb', height: 1.54, fitAxis: 'y', leafShadows: false },
  cardamom: { url: '/models/posora_cardamom_plant_01/cardamom-plant.glb', height: 1.52, fitAxis: 'y', leafShadows: false },
  thanakuni: { url: '/models/posora_thanakuni_01/thanakuni-creeper.glb', height: 1.28, fitAxis: 'longest', leafShadows: false },
  // CC BY 4.0 bowl of green cardamom pods; source marks this model as AI-generated.
  // It illustrates the spice product only, never a cardamom plant or harvest scan.
  cardamomBowl: { url: '/models/cardamom_bowl_01/cardamom-bowl.glb', height: 0.82, fitAxis: 'longest' },
  // Detailed Delonix regia specimen (CC BY 4.0); height-fit keeps its wide crown inside the canvas.
  krishnachura: { url: '/models/krishnachura_delonix_01/krishnachura.glb', height: 1.45, fitAxis: 'y', leafShadows: false },
  // Neem tree scan by Rohit Pawar (CC BY 4.0); optimized to a small mobile GLB.
  neem: { url: '/models/neem_tree_scan_01/neem-tree.glb', height: 1.42, leafShadows: false },
  // Animated, textured Sketchfab tiger. The source identifies the animal only
  // as a tiger, so the visible credit explicitly avoids claiming a verified
  // Bengal subspecies.
  runningTiger: { url: '/models/running_tiger_01/running-tiger.glb', height: 1.7, fitAxis: 'longest', playAnimations: true },
  // No exact, high-detail, permissively licensed public models were found for
  // these five named Bangladesh animals. Use visibly disclosed close-form
  // comparisons instead of the earlier sphere/cylinder teaching figures.
  // None of these records may be described as a scan of the lesson species.
  hilsa: { url: '/models/hilsa_herring_reference_01/pacific-herring.glb', height: 1.2, fitAxis: 'longest' },
  // The rig's skinned vertices extend well beyond its static bounding box;
  // a conservative fitted height keeps the complete head, tail and feet in
  // the inspection frame instead of magnifying the torso past the viewport.
  doel: { url: '/models/doel_robin_reference_01/european-robin.glb', height: 0.82, fitAxis: 'y' },
  leopardCat: { url: '/models/leopard_cat_bengal_reference_01/bengal-cat.glb', height: 1.5, fitAxis: 'y' },
  monkey: { url: '/models/monkey_macaque_reference_01/japanese-macaque.glb', height: 1.85, fitAxis: 'y', colorTint: '#c49372', colorBoost: 1.08 },
  vulture: { url: '/models/vulture_gyps_reference_01/griffon-vulture.glb', height: 1.75, fitAxis: 'y' },
  // CC0 bamboo canes with named cane/leaf materials and an authored sway clip.
  bamboo: { url: '/models/bamboo_botany_01/bamboo.glb', height: 1.35, playAnimations: true },
  // Exact Oryza sativa specimen for paddy plants; it must not stand in for
  // processed rice grains or cooked rice elsewhere in the Food world.
  paddyPlant: { url: '/models/rice_oryza_sativa_01/oryza-sativa.glb', height: 1.55, fitAxis: 'longest' },
  aloeVeraScan: { url: '/models/aloe_vera_scan_01/aloe-vera.glb', height: 1.25, fitAxis: 'longest' },
  turmericRootScan: { url: '/models/turmeric_root_scan_01/turmeric-root.glb', height: 0.92, fitAxis: 'longest' },
  // The scan is a slender, dark bark stick; boost size and base color so it
  // remains legible in the multi-item Life canvas without changing the source.
  cinnamonStickScan: { url: '/models/cinnamon_stick_scan_01/cinnamon-stick.glb', height: 1.2, fitAxis: 'longest', colorBoost: 1.45 },
  redChilliScan: { url: '/models/red_chilli_scan_01/red-chilli.glb', height: 0.84, fitAxis: 'longest' },
  // Posora-original CC0 PBR teaching specimens. These represent the dried
  // culinary products named by the Food lesson, not living plants or scans.
  cumin: { url: '/models/posora_cumin_01/cumin-seeds.glb', height: 0.86, fitAxis: 'longest' },
  coriander: { url: '/models/posora_coriander_01/coriander-seeds.glb', height: 0.86, fitAxis: 'longest' },
  bayLeaf: { url: '/models/posora_bay_leaf_01/bay-leaves.glb', height: 0.95, fitAxis: 'longest' },
  mustard: { url: '/models/posora_mustard_01/mustard-seeds.glb', height: 0.86, fitAxis: 'longest' },
  fenugreek: { url: '/models/posora_fenugreek_01/fenugreek-seeds.glb', height: 0.86, fitAxis: 'longest' },
  garamMasala: { url: '/models/posora_garam_masala_01/garam-masala.glb', height: 0.96, fitAxis: 'longest' },
  // Posora-original CC0 Bengali-dish illustrations. Each is deliberately
  // scoped to one representative serving; recipes and presentation vary.
  riceDal: { url: '/models/posora_rice_dal_01/rice-and-dal.glb', height: 0.96, fitAxis: 'longest' },
  bhorta: { url: '/models/posora_bhorta_01/bhorta-assortment.glb', height: 0.94, fitAxis: 'longest' },
  khichuri: { url: '/models/posora_khichuri_01/vegetable-khichuri.glb', height: 0.93, fitAxis: 'longest' },
  pitha: { url: '/models/posora_pitha_01/pitha-assortment.glb', height: 0.96, fitAxis: 'longest' },
  payesh: { url: '/models/posora_payesh_01/rice-payesh.glb', height: 0.93, fitAxis: 'longest' },
  sweet: { url: '/models/posora_sweets_01/bangla-sweets.glb', height: 0.96, fitAxis: 'longest' },
  // Sketchfab CC BY food by seirogan: textured গোলাপজাম in syrup, one real
  // kind of মিষ্টি.
  gulabJamunScan: { url: '/models/gulab_jamun_01/gulab-jamun.glb', height: 0.9, fitAxis: 'longest' },
  haleem: { url: '/models/posora_haleem_01/haleem.glb', height: 0.93, fitAxis: 'longest' },
  dateBowl: { url: '/models/posora_iftar_01/iftar-assortment.glb', height: 0.98, fitAxis: 'longest' },
  panta: { url: '/models/posora_panta_01/panta-rice.glb', height: 0.93, fitAxis: 'longest' },
  whiteThroatedKingfisherScan: { url: '/models/white_throated_kingfisher_01/white-throated-kingfisher.glb', height: 1.05, fitAxis: 'longest', rotationY: Math.PI / 2 },
  // Saltwater crocodile listed as native to India’s east coast/Southeast Asia;
  // the lesson identifies it as the Sundarbans example, not a local specimen scan.
  saltwaterCrocodileScan: { url: '/models/saltwater_crocodile_01/saltwater-crocodile.glb', height: 1.55, fitAxis: 'longest', focusY: 0.14 },
  // Asian elephant specimen by planeta-elefante (CC BY 4.0). Its idle clip is
  // used for the selected fauna figure; the source provides walk and spray
  // clips too, but those are not implied as an interaction or behavior fact.
  asianElephant: { url: '/models/asian_elephant_01/asian-elephant.glb', height: 1.9, fitAxis: 'longest', focusY: 0.55, playAnimations: true, animationClip: 'Idle' },
  analogStopwatch: { url: '/models/soviet_stopwatch_01/stopwatch.glb', height: 0.9, fitAxis: 'longest', rotationX: Math.PI / 2 },
  // Vintage Soviet aneroid barometer, CC BY 4.0; sourced as a complete object.
  barometer: { url: '/models/soviet_barometer_01/barometer.glb', height: 0.92, fitAxis: 'longest', focusY: 0.42 },
  // Licensed CC BY balance-scale example; meshopt-compressed for mobile delivery.
  balanceScale: { url: '/models/balance_scale_01/balance-scale.glb', height: 1.05, fitAxis: 'longest', leafShadows: false },
  // Medical.Gallery Graphics' CC BY oral thermometer, shown as one concrete
  // example of a temperature instrument (not as a weather/digital device).
  thermometer: { url: '/models/clinical_thermometer_01/oral-thermometer.glb', height: 1.15, fitAxis: 'longest' },
  // Pasha's CC BY animated bee, based on Irfan's CC BY original. Use only as
  // one visually concrete insect example, not as a verified local bee species.
  beeSpecimen: { url: '/models/realistic_bee_01/bee.glb', height: 0.72, fitAxis: 'longest', playAnimations: true, animationClip: '_bee_hover' },
  // Animated green sea turtle specimen, CC BY 4.0. This is a species example,
  // not a scan of a turtle observed in Bangladesh.
  greenSeaTurtle: { url: '/models/green_sea_turtle_01/green-sea-turtle.glb', height: 1.85, fitAxis: 'longest', focusY: 0.38, playAnimations: true, animationClip: 'Turtle_idle_2' },
  // CC BY 4.0 octopus specimen used as one example of an invertebrate; it is
  // not presented as a Bangladesh species or as a stand-in for coral.
  octopusSpecimen: { url: '/models/octopus_scan_01/octopus.glb', height: 1.22, fitAxis: 'longest' },
  // Smithsonian Open Access CC0 scans. The aeroplane is the actual 1903
  // Wright Flyer; the dinosaur is a fossil skeleton, not a living animal.
  wrightFlyer1903: { url: '/models/wright_flyer_1903_si_01/wright-flyer-1903.glb', height: 1.7, fitAxis: 'longest' },
  triceratopsSkeleton: { url: '/models/triceratops_si_01/triceratops-skeleton.glb', height: 1.8, fitAxis: 'longest', rotationY: Math.PI / 2, rotationZ: Math.PI / 2 },
  // Posora-authored CC0 models of objects defined by their construction:
  // a bullock-cart wheel and a quartz cluster (six-sided prisms with tips).
  cartWheel: { url: '/models/posora_bullock_cart_wheel_01/bullock-cart-wheel.glb', height: 1.25, fitAxis: 'longest' },
  quartzCluster: { url: '/models/posora_quartz_cluster_01/quartz-cluster.glb', height: 1.0, fitAxis: 'longest' },
  trilobiteFossil: { url: '/models/trilobite_poliella_si_01/trilobite-poliella-prima.glb', height: 0.95, fitAxis: 'longest' },
};

/** Scoped real-model additions that supplement, rather than replace, a teaching figure. */
export const LICENSED_FIGURE_SUPPLEMENTS: Record<string, { url: string; height: number; position: [number, number, number]; fitAxis?: 'x' | 'y' | 'z' | 'longest' }> = {
  // Golpata is a sprawling palm with an underground stem; the free source is
  // only its fruiting head, so keep the whole-plant teaching figure and attach
  // the model as a clearly disclosed fruit-cluster specimen. The head sits at
  // mud level beside the fronds, which is where nipa fruit actually forms.
  golpata: { url: '/models/nypa_fruit_01/nypa-fruit-cluster.glb', height: 0.4, position: [0.32, 0.02, 0.3], fitAxis: 'longest' },
  // Life's Elachi entry teaches the plant, while the free licensed model is
  // specifically a bowl of dried fruits/seeds. Keep the plant diagram and show
  // the real spice product separately rather than mislabel the bowl as a plant.
  // Tal (Borassus flabellifer): the free source is the palmyra fruit, one cut
  // open to show the jelly kernels (তালশাঁস), not the tree. It sits on the
  // ground beside the whole-palm teaching figure, where fallen fruit lies.
  talPalm: { url: '/models/palmyra_fruit_01/palmyra-fruit.glb', height: 0.5, position: [0.42, 0.02, 0.36], fitAxis: 'longest' },
  cardamom: { url: '/models/cardamom_bowl_01/cardamom-bowl.glb', height: 0.78, position: [0.78, 0.08, 0.18], fitAxis: 'longest' },
};
