/**
 * Visual-quality classification of every 3D figure Posora can load, and an
 * explicit designation for every learning item still drawn procedurally.
 *
 * Loading is not the standard. Earlier audits counted a model as covered the
 * moment its URL resolved, which made a handful of primitive trees look as
 * finished as a museum scan. Each record here states what the figure actually
 * is, so the coverage audit can fail an exact-object lesson that still relies
 * on something marked `replacement-required`.
 *
 * - exact-licensed: a scan or high-detail licensed model of the exact object
 *   or species the lesson names (or of the clearly named example it shows).
 * - accurate-authored: an authored model detailed enough to stand as the
 *   object itself without a photograph beside it.
 * - disclosed-comparison: a related species/object, visibly labelled as a
 *   comparison and paired with an exact reference photograph.
 * - teaching-diagram: an honest illustration (Posora-authored or procedural)
 *   that teaches the identifying features; it is never called a scan or
 *   photorealistic, and physical subjects carry an exact reference photograph.
 * - replacement-required: visibly inadequate for the physical thing it shows;
 *   kept only until a rights-cleared replacement is found.
 */
export type ModelQuality = 'exact-licensed' | 'accurate-authored' | 'disclosed-comparison' | 'teaching-diagram' | 'replacement-required';

const tier = (quality: ModelQuality, keys: string[]) => Object.fromEntries(keys.map((key) => [key, quality]));

/** Every key of LICENSED_FIGURES must appear here (the audit enforces it). */
export const LICENSED_FIGURE_QUALITY: Record<string, ModelQuality> = {
  ...tier('exact-licensed', [
    // photogrammetry and museum scans
    'gangesDolphinSkeleton', 'friedFishScan', 'jackfruitScan', 'banyanTreeScan', 'bombaxCeibaScan', 'mintLeavesSpecimen', 'tulsiSpecimen',
    'rock', 'riceBowlScan', 'aloeVeraScan', 'turmericRootScan', 'cinnamonStickScan', 'redChilliScan', 'neem', 'whiteThroatedKingfisherScan',
    'wrightFlyer1903', 'triceratopsSkeleton', 'trilobiteFossil',
    // Poly Haven CC0 scanned or high-detail objects and produce
    'bulb', 'microscope', 'compass', 'clockFace', 'telephone', 'polyBinoculars', 'polyLaptop', 'polyCashRegister', 'polyGamepad', 'polyCalathea',
    'polySweetPotato', 'polyApple', 'polyKiwi', 'polyPomegranate', 'polyAsianPear', 'polyOnion', 'polyCroissant', 'polyAnthurium', 'polyFern',
    'polyPottedPlant', 'polySchoolChair', 'polySchoolDesk', 'polyNotebook', 'polyMeasuringTape', 'polyRuler', 'polyMagnifier', 'polyCamera',
    'polyGameConsole', 'polyEnamelPot', 'polyBrassPan', 'polyMedicalBox', 'polyPantryFoods', 'polyLemon', 'polyChemistrySet', 'polyDigitalWatch',
    'polyLime', 'bananaFruit', 'lycheeFruit', 'gingerRoot', 'greenFruit',
    // high-detail licensed species and object models, each with a scoped credit
    'fishSmall', 'mammalSpecimen', 'reptileSpecimen', 'birdSpecimen', 'amphibianSpecimen', 'waterLilySpecimen', 'mango', 'cardamomBowl',
    'krishnachura', 'runningTiger', 'bamboo', 'paddyPlant', 'saltwaterCrocodileScan', 'asianElephant', 'analogStopwatch', 'barometer',
    'balanceScale', 'thermometer', 'beeSpecimen', 'greenSeaTurtle', 'octopusSpecimen',
  ]),
  // Authored from the object's own construction or crystal geometry.
  ...tier('accurate-authored', ['cartWheel', 'quartzCluster']),
  ...tier('disclosed-comparison', ['hilsa', 'doel', 'leopardCat', 'monkey', 'vulture', 'datePalmAnalogy']),
  // Posora-authored generation-2 illustrations (2026-10-28). No free exact
  // model was found for any of them; each is paired with an exact photograph.
  ...tier('teaching-diagram', [
    'talPalm', 'sundari', 'golpata', 'jute', 'kodom', 'hijol', 'cardamom', 'thanakuni',
    'cumin', 'coriander', 'bayLeaf', 'mustard', 'fenugreek', 'garamMasala',
    'riceDal', 'bhorta', 'khichuri', 'pitha', 'payesh', 'sweet', 'haleem', 'dateBowl', 'panta',
  ]),
};

/**
 * Procedurally drawn items in exact-object and mixed-example lessons. A
 * teaching-diagram designation needs a reason; a replacement-required item
 * stays on the visible backlog until a free exact model is found.
 */
export const PROCEDURAL_ITEM_DESIGNATIONS: Record<string, { quality: Extract<ModelQuality, 'teaching-diagram' | 'replacement-required'>; reason: string }> = {
  'food:খাদ্যের ছয় উপাদান/স্নেহ': { quality: 'teaching-diagram', reason: 'A nutrient class, shown as a symbolic oil drop; the lesson names the foods that contain it.' },
  'food:খাদ্যের ছয় উপাদান/খনিজ লবণ': { quality: 'teaching-diagram', reason: 'A nutrient class (minerals), not table salt as an object.' },
  'food:খাদ্যের ছয় উপাদান/পানি': { quality: 'teaching-diagram', reason: 'Water as a nutrient; a glass is a symbol, not a specimen.' },
  'food:খাদ্যের ছয় উপাদান/আঁশ': { quality: 'teaching-diagram', reason: 'Dietary fibre is a component, not one object.' },
  'food:খাদ্যের ছয় উপাদান/ক্যালরি': { quality: 'teaching-diagram', reason: 'Energy is an abstract quantity.' },
  'food:রান্নার বিজ্ঞান/বাষ্পে রান্না': { quality: 'teaching-diagram', reason: 'A cooking process (steam).' },
  'food:রান্নার বিজ্ঞান/খামির ফোলা': { quality: 'teaching-diagram', reason: 'A process (fermentation rising).' },
  'food:রান্নার বিজ্ঞান/দই জমা': { quality: 'teaching-diagram', reason: 'A process (milk setting into yoghurt).' },
  'food:রান্নার বিজ্ঞান/ক্যারামেল': { quality: 'teaching-diagram', reason: 'A chemical change (sugar browning).' },
  'food:রান্নার বিজ্ঞান/আচার সংরক্ষণ': { quality: 'teaching-diagram', reason: 'A preservation process.' },
  'food:রান্নার বিজ্ঞান/হিমায়িত রাখা': { quality: 'teaching-diagram', reason: 'A preservation process (freezing).' },
  'discovery:আবিষ্কার ও আবিষ্কারক/কাগজ': { quality: 'teaching-diagram', reason: 'A sheet of paper is accurately a sheet; the lesson is the invention.' },
  'discovery:আবিষ্কার ও আবিষ্কারক/টিকা': { quality: 'teaching-diagram', reason: 'Vaccination is a medical idea; a vial symbolises it.' },
  'discovery:আবিষ্কার ও আবিষ্কারক/পেনিসিলিন': { quality: 'teaching-diagram', reason: 'A discovered substance; a lab vial symbolises it.' },
  'discovery:আবিষ্কার ও আবিষ্কারক/ইন্টারনেট': { quality: 'teaching-diagram', reason: 'A network, not an object.' },
  'discovery:আবিষ্কার ও আবিষ্কারক/ছাপাখানা': { quality: 'replacement-required', reason: 'Shown as a book; needs a free model of a hand printing press.' },
  'discovery:আবিষ্কার ও আবিষ্কারক/বাষ্পীয় ইঞ্জিন': { quality: 'replacement-required', reason: 'Shown as a gear; needs a free model of a steam engine.' },
  'discovery:পৃথিবী ও ভূতত্ত্ব/বরফযুগ': { quality: 'teaching-diagram', reason: 'A geological period.' },
  'discovery:পৃথিবী ও ভূতত্ত্ব/মাটির স্তর': { quality: 'teaching-diagram', reason: 'A cross-section is clearer than any single specimen.' },
  'discovery:পৃথিবী ও ভূতত্ত্ব/কয়লা ও তেল': { quality: 'teaching-diagram', reason: 'Fossil-fuel formation is a process.' },
  'discovery:পৃথিবী ও ভূতত্ত্ব/মহাদেশের সরণ': { quality: 'teaching-diagram', reason: 'A planetary process; real scale is impossible.' },
  'language:শব্দভাণ্ডার/ছবি ও শব্দ': { quality: 'teaching-diagram', reason: 'A word category.' },
  'language:শব্দভাণ্ডার/রং': { quality: 'teaching-diagram', reason: 'Colour words; swatches are exact for colour.' },
  'language:শব্দভাণ্ডার/প্রাণী': { quality: 'teaching-diagram', reason: 'A word category; the Life world teaches the species.' },
  'language:শব্দভাণ্ডার/পরিবার': { quality: 'teaching-diagram', reason: 'Kinship words.' },
  'language:শব্দভাণ্ডার/শরীরের অংশ': { quality: 'teaching-diagram', reason: 'A word category; the body world teaches anatomy.' },
  'language:শব্দভাণ্ডার/পোশাক': { quality: 'teaching-diagram', reason: 'A word category, not a garment specimen.' },
  'language:শব্দভাণ্ডার/যানবাহন': { quality: 'teaching-diagram', reason: 'A word category, not a vehicle specimen.' },
  'language:শব্দভাণ্ডার/বিপরীত শব্দ': { quality: 'teaching-diagram', reason: 'A grammatical relation.' },
  'language:শব্দভাণ্ডার/সমার্থক শব্দ': { quality: 'teaching-diagram', reason: 'A grammatical relation.' },
  'language:শব্দভাণ্ডার/ধ্বনি-শব্দ': { quality: 'teaching-diagram', reason: 'A sound category.' },
};
