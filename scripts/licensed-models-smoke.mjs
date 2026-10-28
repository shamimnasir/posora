import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const base = (process.env.MODEL_SMOKE_BASE ?? 'http://127.0.0.1:4321').replace(/\/$/, '');
const executablePath = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await chromium.launch({
  executablePath, headless: true,
  args: ['--no-sandbox', '--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const failures = [];
const assetResponses = new Map();
const evidenceDir = path.resolve('docs/animation-remake/evidence/licensed-models');
if (process.env.MODEL_SMOKE_SCREENSHOTS === '1') await mkdir(evidenceDir, { recursive: true });
const check = (ok, message) => { if (!ok) failures.push(message); };
const installReliablePageWait = (page) => {
  // Playwright's waitForFunction can rely on renderer polling that is throttled
  // in a headless/background tab. Poll with direct protocol evaluations instead
  // so a true DOM condition is not reported as a timeout after it is already true.
  page.waitForFunction = async (predicate, arg = null, options = {}) => {
    const timeout = options.timeout ?? 30000;
    const polling = typeof options.polling === 'number' ? options.polling : 100;
    const deadline = Date.now() + timeout;
    do {
      try {
        if (await page.evaluate(predicate, arg)) return;
      } catch {
        // Navigation can briefly replace the execution context; retry until the
        // real deadline, then surface a useful timeout rather than that race.
      }
      if (Date.now() < deadline) await page.waitForTimeout(Math.max(10, polling));
    } while (Date.now() < deadline);
    throw new Error(`Page condition timed out after ${timeout}ms`);
  };
};
// A comparison model or a Posora-authored illustration must always arrive
// with the exact photograph of the real thing and its licence beside it.
const REFERENCE_IMAGES = {
  'posora_tal_palm_01/': 'tal-palmyra-dhaka.jpg', 'posora_sundari_01/': 'sundari-heritiera-fomes.jpg', 'posora_golpata_01/': 'golpata-nipa-sundarbans.jpg',
  'posora_jute_01/': 'jute-field-bangladesh.jpg', 'posora_kadam_01/': 'kadam-flower.jpg', 'posora_hijal_01/': 'hijal-flowers.jpg',
  'posora_cardamom_plant_01/': 'cardamom-plant.jpg', 'posora_thanakuni_01/': 'thankuni-centella.jpg',
  'posora_cumin_01/': 'cumin-seeds.jpg', 'posora_coriander_01/': 'coriander-seeds.jpg', 'posora_bay_leaf_01/': 'tejpata-dried.jpg',
  'posora_mustard_01/': 'mustard-seeds.jpg', 'posora_fenugreek_01/': 'fenugreek-seeds.jpg', 'posora_garam_masala_01/': 'whole-garam-masala.jpg',
  'posora_rice_dal_01/': 'rice-dal-meal.jpg', 'posora_bhorta_01/': 'tomato-bhorta.jpg', 'posora_khichuri_01/': 'vegetable-khichuri.jpg',
  'posora_pitha_01/': 'bhapa-pitha.jpg', 'posora_payesh_01/': 'payesh.jpg', 'posora_sweets_01/': 'kalojam.jpg', 'gulab_jamun_01/': 'kalojam.jpg', 'posora_haleem_01/': 'haleem-bangladesh.jpg',
  'posora_iftar_01/': 'iftar-plate-rajshahi.jpg', 'posora_panta_01/': 'panta-bhat.jpg',
  'hilsa_herring_reference_01/': 'hilsa-chandpur.jpg', 'doel_robin_reference_01/': 'doel-oriental-magpie-robin.jpg', 'leopard_cat_bengal_reference_01/': 'leopard-cat-sundarban.jpg',
  'monkey_macaque_reference_01/': 'rhesus-macaque.jpg', 'vulture_gyps_reference_01/': 'white-rumped-vulture-bangladesh.jpg',
};
const cases = [
  { world: 'food', selector: '#world .rail-list [data-i="0"]', category: 'খাদ্যের ছয় উপাদান', itemIndex: 0, expected: ['rice_in_bowl_01/rice-in-bowl.glb'], shot: 'food-cooked-rice-bowl.png' },
  { world: 'food', selector: '#world .rail-list [data-i="3"]', expected: ['food_lychee_01/food_lychee_01.glb'], shot: 'food-fruit-wheel.png' },
  { world: 'food', selector: '#world .rail-list [data-i="5"]', expected: ['food_ginger_01/food_ginger_01.glb'], shot: 'food-ginger.png' },
  { world: 'food', selector: '#world .rail-list [data-i="5"]', category: 'মশলার জগৎ', itemIndex: 1, expected: ['turmeric_root_scan_01/turmeric-root.glb'], shot: 'food-turmeric.png' },
  { world: 'food', selector: '#world .rail-list [data-i="5"]', category: 'মশলার জগৎ', itemIndex: 6, expected: ['cinnamon_stick_scan_01/cinnamon-stick.glb'], shot: 'food-cinnamon.png' },
  { world: 'food', selector: '#world .rail-list [data-i="5"]', category: 'মশলার জগৎ', itemIndex: 4, expected: ['red_chilli_scan_01/red-chilli.glb'], shot: 'food-red-chilli.png' },
  { world: 'food', selector: '#world .rail-list [data-i="5"]', category: 'মশলার জগৎ', itemIndex: 5, expected: ['cardamom_bowl_01/cardamom-bowl.glb'], shot: 'food-cardamom-bowl.png' },
  { world: 'food', selector: '#world .rail-list [data-i="5"]', category: 'মশলার জগৎ', itemIndex: 2, expected: ['posora_cumin_01/cumin-seeds.glb'], shot: 'food-cumin-seeds.png' },
  { world: 'food', selector: '#world .rail-list [data-i="5"]', category: 'মশলার জগৎ', itemIndex: 3, expected: ['posora_coriander_01/coriander-seeds.glb'], shot: 'food-coriander-seeds.png' },
  { world: 'food', selector: '#world .rail-list [data-i="5"]', category: 'মশলার জগৎ', itemIndex: 7, expected: ['posora_bay_leaf_01/bay-leaves.glb'], shot: 'food-bay-leaves.png' },
  { world: 'food', selector: '#world .rail-list [data-i="5"]', category: 'মশলার জগৎ', itemIndex: 8, expected: ['posora_mustard_01/mustard-seeds.glb'], shot: 'food-mustard-seeds.png' },
  { world: 'food', selector: '#world .rail-list [data-i="5"]', category: 'মশলার জগৎ', itemIndex: 9, expected: ['posora_fenugreek_01/fenugreek-seeds.glb'], shot: 'food-fenugreek-seeds.png' },
  { world: 'food', selector: '#world .rail-list [data-i="5"]', category: 'মশলার জগৎ', itemIndex: 10, expected: ['posora_garam_masala_01/garam-masala.glb'], shot: 'food-garam-masala.png' },
  { world: 'food', selector: '#world .rail-list [data-i="4"]', category: 'বাংলার খাবার', itemIndex: 1, expected: ['ikan_goreng_01/ikan-goreng.glb'], shot: 'food-fried-fish-photogrammetry.png' },
  { world: 'food', selector: '#world .rail-list [data-i="4"]', category: 'বাংলার খাবার', itemIndex: 0, expected: ['posora_rice_dal_01/rice-and-dal.glb'], shot: 'food-rice-and-dal.png' },
  { world: 'food', selector: '#world .rail-list [data-i="4"]', category: 'বাংলার খাবার', itemIndex: 2, expected: ['posora_bhorta_01/bhorta-assortment.glb'], shot: 'food-bhorta-assortment.png' },
  { world: 'food', selector: '#world .rail-list [data-i="4"]', category: 'বাংলার খাবার', itemIndex: 3, expected: ['posora_khichuri_01/vegetable-khichuri.glb'], shot: 'food-vegetable-khichuri.png' },
  { world: 'food', selector: '#world .rail-list [data-i="4"]', category: 'বাংলার খাবার', itemIndex: 4, expected: ['posora_pitha_01/pitha-assortment.glb'], shot: 'food-pitha-assortment.png' },
  { world: 'food', selector: '#world .rail-list [data-i="4"]', category: 'বাংলার খাবার', itemIndex: 5, expected: ['posora_payesh_01/rice-payesh.glb'], shot: 'food-rice-payesh.png' },
  { world: 'food', selector: '#world .rail-list [data-i="4"]', category: 'বাংলার খাবার', itemIndex: 6, expected: ['gulab_jamun_01/gulab-jamun.glb'], shot: 'food-gulab-jamun.png' },
  { world: 'food', selector: '#world .rail-list [data-i="4"]', category: 'বাংলার খাবার', itemIndex: 7, expected: ['posora_haleem_01/haleem.glb'], shot: 'food-haleem.png' },
  { world: 'food', selector: '#world .rail-list [data-i="4"]', category: 'বাংলার খাবার', itemIndex: 8, expected: ['posora_iftar_01/iftar-assortment.glb'], shot: 'food-iftar-assortment.png' },
  { world: 'food', selector: '#world .rail-list [data-i="4"]', category: 'বাংলার খাবার', itemIndex: 9, expected: ['posora_panta_01/panta-rice.glb'], shot: 'food-panta-rice.png' },
  { world: 'life', selector: 'button.grow:has-text("বাংলাদেশের প্রাণী")', category: 'বাংলাদেশের প্রাণী', itemIndex: 6, expected: ['white_throated_kingfisher_01/white-throated-kingfisher.glb'], shot: 'life-white-throated-kingfisher.png' },
  { world: 'life', selector: 'button.grow:has-text("বাংলাদেশের প্রাণী")', category: 'বাংলাদেশের প্রাণী', itemIndex: 4, expected: ['ganges_dolphin_skeleton_01/ganges-dolphin-skeleton.glb'], shot: 'life-ganges-dolphin-skeleton.png' },
  { world: 'life', selector: 'button.grow:has-text("বাংলাদেশের প্রাণী")', category: 'বাংলাদেশের প্রাণী', itemIndex: 3, expected: ['asian_elephant_01/asian-elephant.glb'], shot: 'life-asian-elephant.png' },
  { world: 'life', selector: 'button.grow:has-text("বাংলাদেশের প্রাণী")', category: 'বাংলাদেশের প্রাণী', itemIndex: 11, expected: ['realistic_bee_01/bee.glb'], shot: 'life-bangladesh-honeybee.png' },
  { world: 'life', selector: 'button.grow:has-text("বাংলাদেশের প্রাণী")', category: 'বাংলাদেশের প্রাণী', itemIndex: 10, expected: ['green_sea_turtle_01/green-sea-turtle.glb'], shot: 'life-green-sea-turtle.png' },
  { world: 'life', selector: 'button.grow:has-text("বাংলাদেশের প্রাণী")', category: 'বাংলাদেশের প্রাণী', itemIndex: 1, expected: ['hilsa_herring_reference_01/pacific-herring.glb'], shot: 'life-hilsa.png' },
  { world: 'life', selector: 'button.grow:has-text("বাংলাদেশের প্রাণী")', category: 'বাংলাদেশের প্রাণী', itemIndex: 2, expected: ['doel_robin_reference_01/european-robin.glb'], shot: 'life-doel.png' },
  { world: 'life', selector: 'button.grow:has-text("বাংলাদেশের প্রাণী")', category: 'বাংলাদেশের প্রাণী', itemIndex: 7, expected: ['leopard_cat_bengal_reference_01/bengal-cat.glb'], shot: 'life-leopard-cat.png' },
  { world: 'life', selector: 'button.grow:has-text("বাংলাদেশের প্রাণী")', category: 'বাংলাদেশের প্রাণী', itemIndex: 8, expected: ['monkey_macaque_reference_01/japanese-macaque.glb'], shot: 'life-monkey.png' },
  { world: 'life', selector: 'button.grow:has-text("বাংলাদেশের প্রাণী")', category: 'বাংলাদেশের প্রাণী', itemIndex: 9, expected: ['vulture_gyps_reference_01/griffon-vulture.glb'], shot: 'life-vulture.png' },
  { world: 'food', selector: '#world .rail-list [data-i="6"]', category: 'রান্নার বিজ্ঞান', itemIndex: 0, expected: ['pot_enamel_01/pot_enamel_01_1k.gltf'], shot: 'food-boiling-pot.png' },
  { world: 'food', selector: '#world .rail-list [data-i="6"]', category: 'রান্নার বিজ্ঞান', itemIndex: 1, expected: ['brass_pan_01/brass_pan_01_1k.gltf'], shot: 'food-frying-pan.png' },
  { world: 'food', selector: '#world .rail-list [data-i="7"]', category: 'নিরাপদ খাবার ও অভ্যাস', itemIndex: 1, expected: ['pot_enamel_01/pot_enamel_01_1k.gltf'], shot: 'food-safe-water-pot.png' },
  { world: 'food', selector: '#world .rail-list [data-i="7"]', category: 'নিরাপদ খাবার ও অভ্যাস', itemIndex: 2, expected: ['long_life_food/long_life_food_1k.gltf'], shot: 'food-date-labels.png' },
  { world: 'food', selector: '#world .rail-list [data-i="0"]', category: 'খাদ্যের ছয় উপাদান', itemIndex: 3, expected: ['food_lime_01/food_lime_01_1k.gltf'], shot: 'food-vitamin-lime.png' },
  { world: 'life', selector: 'button.grow:has-text("ঔষধি")', expected: ['food_ginger_01/food_ginger_01.glb'], shot: 'life-ginger.png' },
  { world: 'life', selector: 'button.grow:has-text("বাংলাদেশের প্রাণী")', category: 'বাংলাদেশের প্রাণী', itemIndex: 0, expected: ['running_tiger_01/running-tiger.glb'], shot: 'life-tiger-running.png' },
  { world: 'life', selector: 'button.grow:has-text("ঔষধি")', category: 'ঔষধি ও মশলা গাছ', itemIndex: 2, expected: ['aloe_vera_scan_01/aloe-vera.glb'], shot: 'life-aloe-vera.png' },
  { world: 'life', selector: 'button.grow:has-text("ঔষধি")', category: 'ঔষধি ও মশলা গাছ', itemIndex: 1, expected: ['neem_tree_scan_01/neem-tree.glb'], shot: 'life-neem-tree.png' },
  { world: 'life', selector: 'button.grow:has-text("ঔষধি")', category: 'ঔষধি ও মশলা গাছ', itemIndex: 0, expected: ['tulsi_tree_01/tulsi.glb'], shot: 'life-tulsi-plant.png' },
  { world: 'life', selector: 'button.grow:has-text("ঔষধি")', category: 'ঔষধি ও মশলা গাছ', itemIndex: 4, expected: ['turmeric_root_scan_01/turmeric-root.glb'], shot: 'life-turmeric-rhizome.png' },
  { world: 'life', selector: 'button.grow:has-text("ঔষধি")', category: 'ঔষধি ও মশলা গাছ', itemIndex: 5, expected: ['cinnamon_stick_scan_01/cinnamon-stick.glb'], shot: 'life-cinnamon-bark.png' },
  { world: 'life', selector: 'button.grow:has-text("ঔষধি")', category: 'ঔষধি ও মশলা গাছ', itemIndex: 6, expected: ['posora_cardamom_plant_01/cardamom-plant.glb', 'cardamom_bowl_01/cardamom-bowl.glb'], shot: 'life-cardamom-plant-and-spice.png' },
  { world: 'life', selector: 'button.grow:has-text("ঔষধি")', category: 'ঔষধি ও মশলা গাছ', itemIndex: 8, expected: ['posora_thanakuni_01/thanakuni-creeper.glb'], shot: 'life-thanakuni-creeper.png' },
  { world: 'life', selector: 'button.grow:has-text("ঔষধি")', category: 'ঔষধি ও মশলা গাছ', itemIndex: 7, expected: ['mint_leaves_01/mint-leaves.glb'], shot: 'life-mint-leaves.png' },
  { world: 'life', selector: 'button.grow:has-text("বাংলাদেশের গাছপালা")', category: 'বাংলাদেশের গাছপালা', itemIndex: 0, expected: ['mango_tree_01/mango_tree.glb'], shot: 'life-mango-tree.png' },
  { world: 'life', selector: 'button.grow:has-text("বাংলাদেশের গাছপালা")', category: 'বাংলাদেশের গাছপালা', itemIndex: 3, expected: ['posora_tal_palm_01/tal-palmyra-palm.glb', 'palmyra_fruit_01/palmyra-fruit.glb'], shot: 'life-tal-palmyra-palm.png' },
  { world: 'life', selector: 'button.grow:has-text("বাংলাদেশের গাছপালা")', category: 'বাংলাদেশের গাছপালা', itemIndex: 1, expected: ['jackfruit_risd_scan_01/jackfruit-pod.glb'], shot: 'life-jackfruit-pod.png' },
  { world: 'life', selector: 'button.grow:has-text("বাংলাদেশের গাছপালা")', category: 'বাংলাদেশের গাছপালা', itemIndex: 2, expected: ['banyan_gunawan_01/banyan-tree.glb'], shot: 'life-banyan.png' },
  { world: 'life', selector: 'button.grow:has-text("বাংলাদেশের গাছপালা")', category: 'বাংলাদেশের গাছপালা', itemIndex: 4, expected: ['bombax_ceiba_scan_01/bombax-ceiba.glb'], shot: 'life-shimul-bombax-ceiba.png' },
  { world: 'life', selector: 'button.grow:has-text("বাংলাদেশের গাছপালা")', category: 'বাংলাদেশের গাছপালা', itemIndex: 6, expected: ['posora_sundari_01/sundari-mangrove.glb'], shot: 'life-sundari-mangrove.png' },
  { world: 'life', selector: 'button.grow:has-text("বাংলাদেশের গাছপালা")', category: 'বাংলাদেশের গাছপালা', itemIndex: 7, expected: ['posora_golpata_01/golpata-nypa-palm.glb', 'nypa_fruit_01/nypa-fruit-cluster.glb'], shot: 'life-golpata-nypa-palm.png' },
  { world: 'life', selector: 'button.grow:has-text("বাংলাদেশের গাছপালা")', category: 'বাংলাদেশের গাছপালা', itemIndex: 8, expected: ['bamboo_botany_01/bamboo.glb'], shot: 'life-bamboo.png' },
  { world: 'life', selector: 'button.grow:has-text("বাংলাদেশের গাছপালা")', category: 'বাংলাদেশের গাছপালা', itemIndex: 9, expected: ['rice_oryza_sativa_01/oryza-sativa.glb'], shot: 'life-paddy-rice.png' },
  { world: 'life', selector: 'button.grow:has-text("বাংলাদেশের গাছপালা")', category: 'বাংলাদেশের গাছপালা', itemIndex: 10, expected: ['posora_jute_01/jute-stand.glb'], shot: 'life-jute-stand.png' },
  { world: 'life', selector: 'button.grow:has-text("বাংলাদেশের গাছপালা")', category: 'বাংলাদেশের গাছপালা', itemIndex: 11, expected: ['water_lily_nymphaea_01/water-lily.glb'], shot: 'life-shapla-water-lily.png' },
  { world: 'life', selector: 'button.grow:has-text("বাংলাদেশের গাছপালা")', category: 'বাংলাদেশের গাছপালা', itemIndex: 5, expected: ['krishnachura_delonix_01/krishnachura.glb'], shot: 'life-krishnachura.png' },
  { world: 'life', selector: 'button.grow:has-text("বাংলাদেশের গাছপালা")', category: 'বাংলাদেশের গাছপালা', itemIndex: 12, expected: ['posora_kadam_01/kadam-tree.glb'], shot: 'life-kadam-tree.png' },
  { world: 'life', selector: 'button.grow:has-text("বাংলাদেশের গাছপালা")', category: 'বাংলাদেশের গাছপালা', itemIndex: 13, expected: ['posora_hijal_01/hijal-tree.glb'], shot: 'life-hijal-tree.png' },
  { world: 'discovery', selector: '#world .rail-list [data-i="6"]', category: 'পরিমাপের যন্ত্র', itemIndex: 1, expected: ['balance_scale_01/balance-scale.glb'], shot: 'discovery-balance-scale.png' },
  { world: 'life', selector: 'button.grow:has-text("প্রাণীর শ্রেণি")', category: 'প্রাণীর শ্রেণি', itemIndex: 0, expected: ['realistic_red_fox_01/red-fox.glb'], shot: 'life-mammal-fox.png' },
  { world: 'life', selector: 'button.grow:has-text("প্রাণীর শ্রেণি")', category: 'প্রাণীর শ্রেণি', itemIndex: 1, expected: ['realistic_indian_peafowl_01/indian-peafowl.glb'], shot: 'life-bird-peafowl.png' },
  { world: 'life', selector: 'button.grow:has-text("প্রাণীর শ্রেণি")', category: 'প্রাণীর শ্রেণি', itemIndex: 2, expected: ['realistic_panther_chameleon_01/panther-chameleon.glb'], shot: 'life-reptile-chameleon.png' },
  { world: 'life', selector: 'button.grow:has-text("প্রাণীর শ্রেণি")', category: 'প্রাণীর শ্রেণি', itemIndex: 6, expected: ['realistic_red_fox_01/red-fox.glb'], shot: 'life-vertebrate-fox.png' },
  { world: 'life', selector: 'button.grow:has-text("প্রাণীর শ্রেণি")', category: 'প্রাণীর শ্রেণি', itemIndex: 8, expected: ['realistic_panther_chameleon_01/panther-chameleon.glb'], shot: 'life-cold-blooded-chameleon.png' },
  { world: 'life', selector: 'button.grow:has-text("প্রাণীর শ্রেণি")', category: 'প্রাণীর শ্রেণি', itemIndex: 9, expected: ['realistic_indian_peafowl_01/indian-peafowl.glb'], shot: 'life-warm-blooded-peafowl.png' },
  { world: 'life', selector: 'button.grow:has-text("প্রাণীর শ্রেণি")', category: 'প্রাণীর শ্রেণি', itemIndex: 3, expected: ['realistic_axolotl_01/axolotl.glb'], shot: 'life-amphibian-axolotl.png' },
  { world: 'life', selector: 'button.grow:has-text("প্রাণীর শ্রেণি")', category: 'প্রাণীর শ্রেণি', itemIndex: 4, expected: ['remake/food-93e5f02c/barramundi-fish-1024-webp.glb'], shot: 'life-class-fish-barramundi.png' },
  { world: 'life', selector: 'button.grow:has-text("প্রাণীর শ্রেণি")', category: 'প্রাণীর শ্রেণি', itemIndex: 5, expected: ['realistic_bee_01/bee.glb'], shot: 'life-bee-specimen.png' },
  { world: 'life', selector: 'button.grow:has-text("প্রাণীর শ্রেণি")', category: 'প্রাণীর শ্রেণি', itemIndex: 7, expected: ['octopus_scan_01/octopus.glb'], shot: 'life-invertebrate-octopus.png' },
  { world: 'life', selector: 'button.grow:has-text("বাংলাদেশের প্রাণী")', category: 'বাংলাদেশের প্রাণী', itemIndex: 5, expected: ['saltwater_crocodile_01/saltwater-crocodile.glb'], shot: 'life-saltwater-crocodile.png' },
  { world: 'discovery', selector: '#world .rail-list [data-i="2"]', expected: ['rock_07/rock_07.glb'], shot: 'discovery-rock.png' },
  { world: 'discovery', selector: '#world .rail-list [data-i="3"]', expected: ['korean_public_payphone_01/korean_public_payphone_01.glb'], shot: 'discovery-telephone.png' },
  { world: 'discovery', selector: '#world .rail-list [data-i="3"]', category: 'আবিষ্কার ও আবিষ্কারক', itemIndex: 7, expected: ['wright_flyer_1903_si_01/wright-flyer-1903.glb'], shot: 'discovery-wright-flyer-1903.png' },
  { world: 'discovery', selector: '#world .rail-list [data-i="3"]', category: 'আবিষ্কার ও আবিষ্কারক', itemIndex: 0, expected: ['posora_bullock_cart_wheel_01/bullock-cart-wheel.glb'], shot: 'discovery-cart-wheel.png' },
  { world: 'discovery', selector: '#world .rail-list [data-i="2"]', category: 'পৃথিবী ও ভূতত্ত্ব', itemIndex: 1, expected: ['posora_quartz_cluster_01/quartz-cluster.glb'], shot: 'discovery-quartz-cluster.png' },
  { world: 'discovery', selector: '#world .rail-list [data-i="2"]', category: 'পৃথিবী ও ভূতত্ত্ব', itemIndex: 2, expected: ['trilobite_poliella_si_01/trilobite-poliella-prima.glb'], shot: 'discovery-trilobite-fossil.png' },
  { world: 'discovery', selector: '#world .rail-list [data-i="2"]', category: 'পৃথিবী ও ভূতত্ত্ব', itemIndex: 3, expected: ['triceratops_si_01/triceratops-skeleton.glb'], shot: 'discovery-triceratops-skeleton.png' },
  { world: 'discovery', selector: '#world .rail-list [data-i="3"]', itemIndex: 1, expected: ['binder_notebook/binder_notebook_1k.gltf'], shot: 'discovery-notebook.png' },
  // The scientific-method chapter is a dedicated interactive chemistry
  // workspace. These stages select content in that scene; they are not a
  // collection of magnifier, bulb, or clock models.
  { world: 'discovery', selector: '#world .rail-list [data-i="0"]', category: 'বিজ্ঞানের পদ্ধতি', itemIndex: 3, expected: ['chemistry_set/chemistry_set_1k.gltf'], shot: 'discovery-observation.png' },
  { world: 'discovery', selector: '#world .rail-list [data-i="0"]', category: 'বিজ্ঞানের পদ্ধতি', itemIndex: 5, expected: ['chemistry_set/chemistry_set_1k.gltf'], shot: 'discovery-method-conclusion.png' },
  { world: 'discovery', selector: '#world .rail-list [data-i="0"]', category: 'বিজ্ঞানের পদ্ধতি', itemIndex: 6, expected: ['chemistry_set/chemistry_set_1k.gltf'], shot: 'discovery-method-repeat.png' },
  { world: 'discovery', selector: '#world .rail-list [data-i="0"]', category: 'বিজ্ঞানের পদ্ধতি', itemIndex: 2, expected: ['chemistry_set/chemistry_set_1k.gltf'], shot: 'discovery-chemistry-set.png' },
  { world: 'discovery', selector: '#world .rail-list [data-i="6"]', category: 'পরিমাপের যন্ত্র', expected: ['industrial_microscope/industrial_microscope.glb', 'seadogs_compass/seadogs_compass.glb', 'digital_wrist_watch/digital_wrist_watch_1k.gltf'], shot: 'discovery-instruments.png' },
  { world: 'social', selector: '#world .rail-list [data-i="7"]', itemIndex: 5, expected: ['classic_laptop/classic_laptop_1k.gltf'], shot: 'social-screen-time.png' },
  { world: 'social', selector: '#world .rail-list [data-i="6"]', category: 'নিরাপত্তা', itemIndex: 8, expected: ['medical_box/medical_box_1k.gltf'], shot: 'social-medicine-safety.png' },
  { world: 'language', selector: '#world .rail-list [data-i="3"]', expected: ['jackfruit_risd_scan_01/jackfruit-pod.glb'], shot: 'language-fruit.png' },
  { world: 'social', selector: '#world .rail-list [data-i="7"]', itemIndex: 6, expected: ['gamepad/gamepad_1k.gltf'], shot: 'social-gamepad.png' },
  { world: 'discovery', selector: '#world .rail-list [data-i="6"]', category: 'পরিমাপের যন্ত্র', itemIndex: 4, expected: ['binoculars/binoculars_1k.gltf'], shot: 'discovery-binoculars.png' },
  { world: 'discovery', selector: '#world .rail-list [data-i="6"]', category: 'পরিমাপের যন্ত্র', itemIndex: 2, expected: ['ruler/ruler.glb'], shot: 'discovery-ruler.png' },
  { world: 'discovery', selector: '#world .rail-list [data-i="6"]', category: 'পরিমাপের যন্ত্র', itemIndex: 6, expected: ['digital_wrist_watch/digital_wrist_watch_1k.gltf'], shot: 'discovery-digital-watch.png' },
  { world: 'discovery', selector: '#world .rail-list [data-i="6"]', category: 'পরিমাপের যন্ত্র', itemIndex: 8, expected: ['soviet_stopwatch_01/stopwatch.glb'], shot: 'discovery-stopwatch.png' },
  { world: 'discovery', selector: '#world .rail-list [data-i="6"]', category: 'পরিমাপের যন্ত্র', itemIndex: 7, expected: ['soviet_barometer_01/barometer.glb'], shot: 'discovery-barometer.png' },
  { world: 'discovery', selector: '#world .rail-list [data-i="6"]', category: 'পরিমাপের যন্ত্র', itemIndex: 0, expected: ['clinical_thermometer_01/oral-thermometer.glb'], shot: 'discovery-oral-thermometer.png' },
  { world: 'discovery', selector: '#world .rail-list [data-i="1"]', category: 'ঘরে বসে পরীক্ষা', itemIndex: 1, expected: ['lemon/lemon_1k.gltf'], shot: 'discovery-lemon-battery.png' },
  { world: 'discovery', selector: '#world .rail-list [data-i="6"]', category: 'পরিমাপের যন্ত্র', itemIndex: 9, expected: ['measuring_tape_01/measuring_tape_01_1k.gltf'], shot: 'discovery-measuring-tape-exact.png' },
  { world: 'discovery', selector: '#world .rail-list [data-i="3"]', category: 'আবিষ্কার ও আবিষ্কারক', itemIndex: 10, expected: ['classic_laptop/classic_laptop_1k.gltf'], shot: 'discovery-laptop.png' },
  { world: 'discovery', selector: '#world .rail-list [data-i="3"]', category: 'আবিষ্কার ও আবিষ্কারক', itemIndex: 5, expected: ['lightbulb_led/lightbulb_led_1k.gltf'], shot: 'discovery-history-electricity-bulb.png' },
  { world: 'money', selector: '#world .rail-list [data-i="8"]', itemIndex: 0, expected: ['CashRegister_01/CashRegister_01_1k.gltf'], shot: 'money-market-register.png' },
  { world: 'money', selector: '#world .rail-list [data-i="8"]', category: 'বাজার ও অর্থনীতি', itemIndex: 8, expected: ['rice_oryza_sativa_01/oryza-sativa.glb'], shot: 'money-agriculture-rice.png' },
  { world: 'nature', selector: '#world .rail-list [data-i="5"]', itemIndex: 2, expected: ['fern_02/fern_02_1k.gltf', 'potted_plant_01/potted_plant_01_1k.gltf'], shot: 'nature-producer.png' },
  { world: 'language', selector: '#world .rail-list [data-i="3"]', itemIndex: 3, expected: ['sweet_potato/sweet_potato_1k.gltf'], shot: 'language-vegetable.png' },
  { world: 'language', selector: '#world .rail-list [data-i="3"]', itemIndex: 2, expected: ['jackfruit_risd_scan_01/jackfruit-pod.glb'], shot: 'language-jackfruit.png' },
];
const requestedWorlds = new Set((process.env.MODEL_SMOKE_ONLY ?? '').split(',').map((world) => world.trim()).filter(Boolean));
const worldCases = requestedWorlds.size
  ? cases.filter((test) => requestedWorlds.has(test.world))
  : cases;
const activeCases = process.env.MODEL_SMOKE_CASE
  ? worldCases.filter((test) => test.shot === process.env.MODEL_SMOKE_CASE)
  : worldCases;
if (!activeCases.length) throw new Error(`No licensed-model smoke cases for ${[...requestedWorlds].join(', ') || process.env.MODEL_SMOKE_CASE || 'the selected filters'}`);
// Keep each world's model cases together. Reopening the same world after
// several WebGL-heavy pages increases software-renderer pressure and made the
// long desktop/mobile suite intermittently fail during a category transition.
activeCases.sort((a, b) => a.world.localeCompare(b.world));

try {
  const viewports = [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'mobile', width: 390, height: 844 },
  ].filter((viewport) => !process.env.MODEL_SMOKE_VIEWPORT || viewport.name === process.env.MODEL_SMOKE_VIEWPORT);
  for (const viewport of viewports) {
    const errors = [];
    let page;
    let currentWorld = '';
    for (const test of activeCases) {
    const failuresBeforeCase = failures.length;
      if (currentWorld !== test.world) {
        // A new page per world prevents WebGL-context exhaustion from making
        // later captures appear blank in a long headless visual pass.
        await page?.close();
        page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
        installReliablePageWait(page);
        assetResponses.clear();
        await page.addInitScript(() => {
          window.__posoraLoadedModels = [];
          window.__posoraModelAnimations = {};
          window.__posoraPlayingAnimations = {};
          window.addEventListener('posora:licensed-model-loaded', (event) => {
            window.__posoraLoadedModels.push(event.detail.url);
            window.__posoraModelAnimations[event.detail.url] = event.detail.animations ?? [];
            window.__posoraPlayingAnimations[event.detail.url] = event.detail.animationsPlaying ?? false;
          });
        });
        page.on('pageerror', (error) => errors.push(error.message));
        page.on('console', (message) => {
          if (message.type() === 'error' && message.text().includes('[Posora 3D]')) errors.push(message.text());
          if (message.type() === 'warning' && message.text().includes('[Posora 3D] Could not load')) errors.push(message.text());
        });
        page.on('response', (response) => {
          const pathname = new URL(response.url()).pathname;
          if (pathname.startsWith('/models/')) assetResponses.set(pathname, response.status());
        });
        currentWorld = test.world;
        await page.goto(`${base}/${currentWorld}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.locator('#hero-host').waitFor({ state: 'attached', timeout: 45000 }).catch(async (error) => {
          console.error(`HERO HOST DEBUG ${viewport.name} ${test.world}/${test.shot}: ${JSON.stringify(await page.evaluate(() => ({
            url: location.href,
            title: document.title,
            status: document.querySelector('main')?.getAttribute('data-slug') ?? null,
            body: document.body.innerText.slice(0, 600),
            hostCount: document.querySelectorAll('#hero-host').length,
          })))}`);
          throw error;
        });
        // Wait for the webfont/layout shift to settle before crossing the lazy
        // WebGL intersection boundary. Otherwise the host can move back out of
        // view between scrollIntoView() and the observer callback.
        // Astro's dev server can perform one full reload when a generated
        // asset changes just before the smoke starts. Retry this harmless
        // settling probe across that navigation instead of failing the case.
        let layoutSettled = false;
        for (let attempt = 0; attempt < 3 && !layoutSettled; attempt += 1) {
          try {
            await page.evaluate(async () => {
              await document.fonts.ready;
              await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            });
            layoutSettled = true;
          } catch (error) {
            if (!String(error).includes('Execution context was destroyed') || attempt === 2) throw error;
            await page.waitForLoadState('domcontentloaded');
            await page.locator('#hero-host').waitFor({ state: 'attached', timeout: 15000 });
          }
        }
        await page.evaluate(() => document.querySelector('#hero-host')?.scrollIntoView({ block: 'center' }));
        if (viewport.name === 'mobile') {
          // The server-rendered CTA appears before its external module has
          // attached the tap handler. Wait for the explicit hydration marker
          // so this verifies the mobile opt-in instead of racing it.
          const start = page.locator('#world-start[data-interactive="true"]');
          await start.waitFor({ state: 'attached', timeout: 15000 });
          if (await start.count() && await start.isVisible()) await start.click();
        }
        // The canvas element is server-rendered even before Three.js mounts.
        // Three.js sets data-engine only after successfully creating a WebGL
        // renderer, so this cannot mistake an empty canvas for a working scene.
        let engineReady = false;
        let engineError;
        for (let attempt = 0; attempt < 3 && !engineReady; attempt += 1) {
          if (attempt > 0) {
            await page.evaluate(() => document.querySelector('#hero-host')?.scrollIntoView({ block: 'center' }));
            await page.waitForTimeout(500);
          }
          try {
            await page.locator('#hero-host canvas[data-engine]').waitFor({
              state: 'attached', timeout: viewport.name === 'mobile' ? 30000 : 20000,
            });
            engineReady = true;
          } catch (error) {
            engineError = error;
          }
        }
        if (!engineReady) {
          const diagnostics = await page.evaluate(() => ({
            url: location.href,
            canvas: document.querySelector('#hero-host canvas')?.outerHTML.slice(0, 500) ?? null,
            fallback: document.querySelector('#hero-loading')?.textContent ?? null,
            start: document.querySelector('#world-start')?.outerHTML ?? null,
            loadedModels: window.__posoraLoadedModels,
          }));
          console.error(`SCENE DEBUG ${viewport.name}: ${JSON.stringify(diagnostics)}; warnings=${errors.join(' | ') || 'none'}`);
          throw engineError;
        }
      }
    if (test.category) {
      // Read both element presence and its label in one DOM turn: the hydrated
      // explorer may replace the breadcrumb between separate locator calls.
      const currentCategory = await page.evaluate(() => document.querySelector('#crumb-cat')?.textContent?.trim() ?? null);
      if (currentCategory?.trim() !== test.category) {
        // The fixed site header can overlap the category rail after a WebGL
        // stage scrolls into view, intercepting Playwright's pointer click.
        // Activate the actual button rather than failing this asset smoke on
        // a test-only sticky-header hit target; then wait for the UI state.
        await page.locator(test.selector).evaluate((element) => {
          if (!(element instanceof HTMLElement)) throw new Error('Category control is not an HTMLElement');
          element.click();
        });
        await page.waitForFunction((name) => document.querySelector('#crumb-cat')?.textContent?.trim() === name, test.category, { timeout: 15000 }).catch(async (error) => {
          const diagnostic = await page.evaluate(() => ({
            category: document.querySelector('#crumb-cat')?.textContent?.trim() ?? null,
            item: document.querySelector('#crumb-item')?.textContent?.trim() ?? null,
            rail: [...document.querySelectorAll('#world .rail-list [data-i]')].map((node) => ({
              index: node.getAttribute('data-i'),
              text: node.textContent?.trim(),
              pressed: node.getAttribute('aria-pressed'),
              visible: node instanceof HTMLElement && node.getBoundingClientRect().width > 0,
            })),
            chips: [...document.querySelectorAll('.chip[data-di]')].map((node) => ({
              index: node.getAttribute('data-di'), text: node.textContent?.trim(), pressed: node.getAttribute('aria-pressed'),
            })),
          }));
          console.error(`CATEGORY TRANSITION DEBUG ${viewport.name} ${test.world}/${test.category}: ${JSON.stringify(diagnostic)}`);
          throw error;
        });
      }
    } else {
      await page.locator(test.selector).evaluate((element) => { if (element instanceof HTMLElement) element.click(); });
      // A category's chips are rebuilt by the hydrated explorer. Waiting only
      // for the click to dispatch is racy on the production edge, where the
      // prior category's chip row disappears before the next one is mounted.
      const categoryIndex = test.selector.match(/data-i=["'](\d+)["']/)?.[1];
      if (categoryIndex !== undefined) {
        const expectedCategory = await page.locator('#world-data').evaluate((node, index) => {
          const categories = JSON.parse(node.textContent ?? '[]');
          return categories[Number(index)]?.n ?? '';
        }, categoryIndex);
        if (expectedCategory) {
          await page.waitForFunction((name) => document.querySelector('#crumb-cat')?.textContent?.trim() === name,
            expectedCategory, { timeout: 10000 });
        }
      }
    }
    if (test.shot === 'food-fruit-wheel.png') {
      const chip = page.locator('.chip[data-di="1"]');
      if (await chip.count()) await chip.evaluate((element) => { if (element instanceof HTMLElement) element.click(); });
    }
    if (test.shot === 'life-ginger.png') {
      const chip = page.locator('.chip[data-di="3"]');
      if (await chip.count()) await chip.evaluate((element) => { if (element instanceof HTMLElement) element.click(); });
    }
    if (test.shot === 'discovery-instruments.png') {
      const chip = page.locator('.chip[data-di="3"]');
      if (await chip.count()) await chip.evaluate((element) => { if (element instanceof HTMLElement) element.click(); });
    }
    if (test.shot === 'discovery-telephone.png') {
      const chip = page.locator('.chip[data-di="6"]');
      if (await chip.count()) await chip.evaluate((element) => { if (element instanceof HTMLElement) element.click(); });
    }
    if (test.shot === 'language-fruit.png') {
      const chip = page.locator('.chip[data-di="2"]');
      if (await chip.count()) await chip.evaluate((element) => { if (element instanceof HTMLElement) element.click(); });
    }
    if (test.itemIndex !== undefined) {
      if (test.world === 'nature') {
        // Category selection rebuilds the Nature viewer asynchronously. Wait
        // until its chapter/options are live before choosing the focused item.
        await page.waitForFunction(() => document.querySelector('.scene')?.getAttribute('data-nature-category') === '5');
        await page.locator('#nc-topic').selectOption(String(test.itemIndex));
        await page.waitForFunction(() => document.querySelector('#nc-caption')?.textContent?.includes('উৎপাদক'));
      }
      else {
        const item = page.locator(`.chip[data-di="${test.itemIndex}"]`);
        await page.waitForFunction((index) => {
          const node = document.querySelector(`.chip[data-di="${index}"]`);
          return node instanceof HTMLElement && !node.hidden && node.getBoundingClientRect().width > 0 && node.getBoundingClientRect().height > 0;
        }, test.itemIndex, { timeout: 10000 }).catch(async (error) => {
          const diagnostic = await page.evaluate(() => ({
            category: document.querySelector('#crumb-cat')?.textContent?.trim() ?? null,
            item: document.querySelector('#crumb-item')?.textContent?.trim() ?? null,
            chips: [...document.querySelectorAll('.chip[data-di]')].map((node) => ({
              index: node.getAttribute('data-di'), text: node.textContent?.trim(), visible: node instanceof HTMLElement && node.getBoundingClientRect().width > 0,
            })),
            chipRegion: document.querySelector('.chips')?.outerHTML.slice(0, 1200) ?? null,
          }));
          console.error(`ITEM SELECTION DEBUG ${viewport.name} ${test.world}/${test.shot}: ${JSON.stringify(diagnostic)}`);
          throw error;
        });
        const selected = await item.evaluate((element) => {
          if (!(element instanceof HTMLElement)) return false;
          element.click();
          // Read the exact DOM node that received the click. Re-resolving a
          // locator here races the explorer's progress/toast re-render.
          return element.getAttribute('aria-pressed') === 'true';
        });
        check(selected, `${test.world}/${test.shot}: clicked item chip did not become selected`);
      }
    }
    if (test.expected.some((asset) => asset.startsWith('mango_tree_01/'))) {
      const credit = page.locator('#model-credit');
      check(await credit.isVisible(), `${test.world}: visible CC BY attribution is missing for the mango-tree model`);
      check((await credit.innerText()).includes('stealth86') && (await credit.innerText()).includes('CC BY 4.0'), `${test.world}: mango-tree attribution is incomplete`);
    }
    if (test.expected.some((asset) => asset.startsWith('running_tiger_01/'))) {
      await page.waitForFunction(() => {
        const note = document.querySelector('#model-credit-tiger');
        return note instanceof HTMLElement && !note.hidden;
      }, null, { timeout: 10000 });
      const credit = await page.locator('#model-credit-tiger').innerText();
      check(credit.includes('francescolima74') && credit.includes('CC BY 4.0') && credit.includes('যাচাই'), `${test.world}: tiger credit or subspecies limitation is missing`);
    }
    if (test.expected.some((asset) => asset.startsWith('saltwater_crocodile_01/'))) {
      await page.waitForFunction(() => {
        const note = document.querySelector('#model-credit-crocodile');
        return note instanceof HTMLElement && !note.hidden;
      }, null, { timeout: 10000 });
      const credit = await page.locator('#model-credit-crocodile').innerText();
      check(credit.includes('VoltVeigh') && credit.includes('CC BY 4.0') && credit.includes('নির্দিষ্ট প্রাণীর স্ক্যান নয়'), `${test.world}: crocodile source, license, or limitation disclosure is incomplete`);
      await page.locator('#ctl-x').evaluate((element) => {
        if (element instanceof HTMLInputElement) {
          element.value = '55';
          element.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
      await page.waitForFunction(() => {
        const note = document.querySelector('#explode-note');
        const title = document.querySelector('#explode-note-title')?.textContent ?? '';
        const copy = document.querySelector('#explode-note-copy')?.textContent ?? '';
        const fact = document.querySelector('#explode-note-fun')?.textContent ?? '';
        return note instanceof HTMLElement && !note.hidden && title.includes('কুমির') && copy.includes('বড় সরীসৃপ শিকারি') && fact.length > 15;
      }, null, { timeout: 10000 });
    }
    if (test.expected.some((asset) => asset.startsWith('rice_oryza_sativa_01/'))) {
      const credit = page.locator('#model-credit');
      const expectedItem = test.world === 'life' ? 'ধান' : 'কৃষি';
      await page.waitForFunction((item) => document.querySelector('#crumb-item')?.textContent?.trim() === item, expectedItem, { timeout: 10000 });
      await page.waitForFunction(() => document.querySelector('#model-credit-paddy') instanceof HTMLElement && !document.querySelector('#model-credit-paddy').hidden, null, { timeout: 10000 });
      check(await credit.isVisible(), `${test.world}: visible rice-plant model credit is missing`);
      check((await credit.innerText()).includes('Oryza sativa') && (await credit.innerText()).includes('CC0 1.0'), `${test.world}: rice-plant source or license credit is incomplete`);
      await page.locator('#ctl-x').evaluate((element) => {
        if (element instanceof HTMLInputElement) {
          element.value = '55';
          element.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
      await page.waitForTimeout(150);
      const expectedDetailTerm = test.world === 'life' ? 'ধান' : 'কৃষি';
      await page.waitForFunction((term) => {
        const note = document.querySelector('#explode-note');
        const title = document.querySelector('#explode-note-title')?.textContent ?? '';
        const copy = document.querySelector('#explode-note-copy')?.textContent ?? '';
        const fact = document.querySelector('#explode-note-fun')?.textContent ?? '';
        return note instanceof HTMLElement && !note.hidden && title.includes(term) && copy.includes(term) && fact.length > 15;
      }, expectedDetailTerm, { timeout: 10000 }).catch(async () => {
        console.error(`RICE DETAIL DEBUG ${viewport.name}`, await page.locator('#crumb-cat,#crumb-item,#explode-note').allTextContents(), await page.locator('#ctl-x').inputValue());
        throw new Error(`${viewport.name}: rice-plant detail/fact did not appear when the view was opened`);
      });
    }
    if (test.expected.some((asset) => asset.startsWith('jackfruit_risd_scan_01/'))) {
      await page.waitForFunction(() => {
        const note = document.querySelector('#model-credit-jackfruit');
        return note instanceof HTMLElement && !note.hidden;
      }, null, { timeout: 10000 });
      const credit = await page.locator('#model-credit-jackfruit').innerText();
      check(credit.includes('RISD Nature Lab') && credit.includes('CC BY 4.0') && credit.includes('গাছ নয়'), `${test.world}: jackfruit creator/license/specimen limitation is incomplete`);
      if (test.world === 'life') {
        await page.locator('#ctl-x').evaluate((element) => {
          if (element instanceof HTMLInputElement) {
            element.value = '55';
            element.dispatchEvent(new Event('input', { bubbles: true }));
          }
        });
        await page.waitForFunction(() => {
          const note = document.querySelector('#explode-note');
          const title = document.querySelector('#explode-note-title')?.textContent ?? '';
          const copy = document.querySelector('#explode-note-copy')?.textContent ?? '';
          const fact = document.querySelector('#explode-note-fun')?.textContent ?? '';
          return note instanceof HTMLElement && !note.hidden && title.includes('কাঁঠাল') && copy.includes('কাঁঠাল') && fact.length > 15;
        }, null, { timeout: 10000 });
      }
    }
    if (test.expected.some((asset) => asset.startsWith('banyan_gunawan_01/'))) {
      await page.waitForFunction(() => {
        const note = document.querySelector('#model-credit-banyan');
        return note instanceof HTMLElement && !note.hidden;
      }, null, { timeout: 15000 }).catch(async (error) => {
        console.error(`BANYAN CREDIT DEBUG ${viewport.name}: ${JSON.stringify(await page.evaluate(() => ({
          category: document.querySelector('#crumb-cat')?.textContent?.trim() ?? null,
          item: document.querySelector('#crumb-item')?.textContent?.trim() ?? null,
          banyan: document.querySelector('#model-credit-banyan')?.outerHTML ?? null,
          allModelCredits: [...document.querySelectorAll('[id^="model-credit-"]')].filter((node) => node instanceof HTMLElement && !node.hidden).map((node) => node.id),
          chips: [...document.querySelectorAll('.chip[data-di]')].filter((node) => node instanceof HTMLElement && node.getAttribute('aria-pressed') === 'true').map((node) => ({ index: node.getAttribute('data-di'), text: node.textContent?.trim() })),
        })))}`);
        throw error;
      });
      const credit = await page.locator('#model-credit-banyan').innerText();
      check(credit.includes('Jimmy Gunawan') && credit.includes('CC BY 4.0') && credit.includes('পুরো গাছ নয়') && credit.includes('নির্দিষ্ট বাংলাদেশি গাছ'), `${test.world}: banyan creator/license/model-scope/geographic limitation credit is incomplete`);
    }
    if (test.expected.some((asset) => asset.startsWith('gulab_jamun_01/'))) {
      const credit = page.locator('#model-credit-gulab-jamun');
      await credit.waitFor({ state: 'visible', timeout: 10000 });
      const text = await credit.innerText();
      check(text.includes('seirogan') && text.includes('CC BY 4.0') && text.includes('একটি ধরন'), 'Mishti: gulab jamun source, license, or one-kind scope disclosure is incomplete');
    }
    if (test.expected.some((asset) => asset.startsWith('palmyra_fruit_01/'))) {
      const credit = page.locator('#model-credit-palmyra-fruit');
      await credit.waitFor({ state: 'visible', timeout: 10000 });
      const text = await credit.innerText();
      check(text.includes('MidNoon') && text.includes('CC BY 4.0') && text.includes('পুরো গাছ নয়'), 'Tal: palmyra fruit source, license, or fruit-only scope disclosure is incomplete');
    }
    if (test.expected.some((asset) => asset.startsWith('nypa_fruit_01/'))) {
      const credit = page.locator('#model-credit-nypa-fruit');
      await credit.waitFor({ state: 'visible', timeout: 10000 }).catch(async (error) => {
        console.error(`NYPA CREDIT DEBUG ${viewport.name}: ${JSON.stringify(await page.evaluate(() => ({
          category: document.querySelector('#crumb-cat')?.textContent?.trim() ?? null,
          item: document.querySelector('#crumb-item')?.textContent?.trim() ?? null,
          credit: document.querySelector('#model-credit-nypa-fruit')?.outerHTML ?? null,
          parentHidden: document.querySelector('#model-credit') instanceof HTMLElement ? document.querySelector('#model-credit').hidden : null,
          selectedChips: [...document.querySelectorAll('.chip[data-di]')].filter((node) => node.getAttribute('aria-pressed') === 'true').map((node) => ({ index: node.getAttribute('data-di'), text: node.textContent?.trim() })),
        })))}`);
        throw error;
      });
      check((await credit.innerText()).includes('zefruitlivingbeingidk') && (await credit.innerText()).includes('CC BY 4.0') && (await credit.innerText()).includes('পুরো গাছ নয়'), 'Golpata: source, license, or fruit-cluster scope disclosure is incomplete');
      await page.locator('#ctl-x').evaluate((element) => {
        if (element instanceof HTMLInputElement) { element.value = '55'; element.dispatchEvent(new Event('input', { bubbles: true })); }
      });
      await page.waitForFunction(() => {
        const note = document.querySelector('#explode-note');
        const copy = document.querySelector('#explode-note-copy')?.textContent ?? '';
        const fact = document.querySelector('#explode-note-fun')?.textContent ?? '';
        return note instanceof HTMLElement && !note.hidden && copy.includes('পাম-জাতীয়') && fact.length > 15;
      }, null, { timeout: 10000 });
    }
    if (test.expected.some((asset) => asset.startsWith('asian_elephant_01/'))) {
      await page.waitForFunction(() => {
        const note = document.querySelector('#model-credit-elephant');
        return note instanceof HTMLElement && !note.hidden;
      }, null, { timeout: 10000 });
      const credit = await page.locator('#model-credit-elephant').innerText();
      check(credit.includes('planeta-elefante') && credit.includes('CC BY 4.0'), `${test.world}: elephant credit is incomplete`);
      await page.waitForFunction(() => {
        const url = '/models/asian_elephant_01/asian-elephant.glb';
        return window.__posoraLoadedModels?.includes(url)
          && window.__posoraModelAnimations?.[url]?.includes('Idle')
          && window.__posoraPlayingAnimations?.[url] === true;
      }, null, { timeout: 15000 });
      await page.locator('#ctl-x').evaluate((element) => {
        if (element instanceof HTMLInputElement) {
          element.value = '55';
          element.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
      await page.waitForFunction(() => {
        const note = document.querySelector('#explode-note');
        const title = document.querySelector('#explode-note-title')?.textContent ?? '';
        const copy = document.querySelector('#explode-note-copy')?.textContent ?? '';
        const fact = document.querySelector('#explode-note-fun')?.textContent ?? '';
        return note instanceof HTMLElement && !note.hidden && title.includes('হাতি') && copy.includes('বড় স্থলজ প্রাণী') && fact.includes('স্ত্রী হাতির');
      }, null, { timeout: 10000 }).catch(async () => {
        console.error(`ELEPHANT DETAIL DEBUG ${viewport.name}`, await page.locator('#crumb-cat,#crumb-item,#explode-note,#ctl-x').allTextContents(), await page.locator('#explode-note-title,#explode-note-copy,#explode-note-fun,#ctl-x').evaluateAll((nodes) => nodes.map((node) => ({ text: node.textContent, hidden: node instanceof HTMLElement ? node.hidden : undefined, value: node instanceof HTMLInputElement ? node.value : undefined }))));
        throw new Error(`${viewport.name}: elephant exploded view did not show its item-specific fact`);
      });
    }
    if (test.expected.some((asset) => asset.startsWith('aloe_vera_scan_01/'))) {
      await page.waitForFunction(() => {
        const note = document.querySelector('#model-credit-aloe');
        return note instanceof HTMLElement && !note.hidden;
      }, null, { timeout: 10000 });
      const credit = await page.locator('#model-credit-aloe').innerText();
      check(credit.includes('matousekfoto') && credit.includes('CC BY 4.0'), `${test.world}: Aloe vera creator/license credit is incomplete`);
    }
    if (test.expected.some((asset) => asset.startsWith('water_lily_nymphaea_01/'))) {
      await page.waitForFunction(() => {
        const note = document.querySelector('#model-credit-water-lily');
        return note instanceof HTMLElement && !note.hidden;
      }, null, { timeout: 10000 });
      const credit = await page.locator('#model-credit-water-lily').innerText();
      check(credit.includes('ffish.asia') && credit.includes('CC0 1.0') && credit.includes('স্থানীয় জাতের স্ক্যান নয়'), `${test.world}: water-lily source/license/species caveat is incomplete`);
      await page.locator('#ctl-x').evaluate((element) => {
        if (element instanceof HTMLInputElement) {
          element.value = '55';
          element.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
      await page.waitForFunction(() => {
        const note = document.querySelector('#explode-note');
        const title = document.querySelector('#explode-note-title')?.textContent ?? '';
        const copy = document.querySelector('#explode-note-copy')?.textContent ?? '';
        const fact = document.querySelector('#explode-note-fun')?.textContent ?? '';
        return note instanceof HTMLElement && !note.hidden && title.includes('শাপলা') && copy.includes('পাতা') && fact.length > 15;
      }, null, { timeout: 10000 });
    }
    if (test.expected.some((asset) => asset.startsWith('krishnachura_delonix_01/'))) {
      await page.waitForFunction(() => {
        const note = document.querySelector('#model-credit-krishnachura');
        return note instanceof HTMLElement && !note.hidden;
      }, null, { timeout: 10000 });
      const credit = await page.locator('#model-credit-krishnachura').innerText();
      check(credit.includes('PlantCatalog') && credit.includes('CC BY 4.0') && credit.includes('স্থির'), `${test.world}: Krishnachura attribution or static-model note is incomplete`);
      await page.locator('#ctl-x').evaluate((element) => {
        if (element instanceof HTMLInputElement) {
          element.value = '55';
          element.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
      await page.waitForFunction(() => {
        const note = document.querySelector('#explode-note');
        const title = document.querySelector('#explode-note-title')?.textContent ?? '';
        const copy = document.querySelector('#explode-note-copy')?.textContent ?? '';
        const fact = document.querySelector('#explode-note-fun')?.textContent ?? '';
        return note instanceof HTMLElement && !note.hidden && title.includes('কৃষ্ণচূড়া') && copy.includes('লাল-কমলা') && fact.length > 15;
      }, null, { timeout: 10000 }).catch(async () => {
        console.error('KRISHNACHURA DETAIL DEBUG', await page.locator('#crumb-cat,#crumb-item,#explode-note,#ctl-x').allTextContents(), await page.locator('#explode-note-title,#explode-note-copy,#explode-note-fun,#ctl-x').evaluateAll((nodes) => nodes.map((node) => ({ text: node.textContent, hidden: node instanceof HTMLElement ? node.hidden : undefined, value: node instanceof HTMLInputElement ? node.value : undefined }))));
        throw new Error(`${viewport.name}: Krishnachura exploded view did not show its item-specific fact`);
      });
    }
    if (test.expected.some((asset) => asset.startsWith('balance_scale_01/'))) {
      await page.waitForFunction(() => {
        const note = document.querySelector('#model-credit-balance');
        return note instanceof HTMLElement && !note.hidden;
      }, null, { timeout: 10000 });
      const credit = await page.locator('#model-credit-balance').innerText();
      check(credit.includes('Jean-Francois.Bonin') && credit.includes('CC BY 4.0'), `${test.world}: balance-scale creator/license credit is incomplete`);
      await page.locator('#ctl-x').evaluate((element) => {
        if (element instanceof HTMLInputElement) {
          element.value = '55';
          element.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
      await page.waitForFunction(() => {
        const note = document.querySelector('#explode-note');
        const title = document.querySelector('#explode-note-title')?.textContent ?? '';
        const copy = document.querySelector('#explode-note-copy')?.textContent ?? '';
        const fact = document.querySelector('#explode-note-fun')?.textContent ?? '';
        return note instanceof HTMLElement && !note.hidden && title.includes('দাঁড়িপাল্লা') && copy.includes('ওজন') && fact.length > 15;
      }, null, { timeout: 10000 });
    }
    if (test.expected.some((asset) => asset.startsWith('neem_tree_scan_01/'))) {
      await page.waitForFunction(() => {
        const note = document.querySelector('#model-credit-neem');
        return note instanceof HTMLElement && !note.hidden;
      }, null, { timeout: 10000 });
      const credit = await page.locator('#model-credit-neem').innerText();
      check(credit.includes('Rohit Pawar') && credit.includes('CC BY 4.0') && credit.includes('ছোট'), `${test.world}: Neem creator/license/optimization note is incomplete`);
      await page.locator('#ctl-x').evaluate((element) => {
        if (element instanceof HTMLInputElement) {
          element.value = '55';
          element.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
      await page.waitForFunction(() => {
        const note = document.querySelector('#explode-note');
        const title = document.querySelector('#explode-note-title')?.textContent ?? '';
        const copy = document.querySelector('#explode-note-copy')?.textContent ?? '';
        const fact = document.querySelector('#explode-note-fun')?.textContent ?? '';
        return note instanceof HTMLElement && !note.hidden && title.includes('নিম') && copy.includes('পাতা') && fact.length > 15;
      }, null, { timeout: 10000 });
    }
    if (test.expected.some((asset) => asset.startsWith('tulsi_tree_01/'))) {
      await page.waitForFunction(() => {
        const note = document.querySelector('#model-credit-tulsi');
        return note instanceof HTMLElement && !note.hidden;
      }, null, { timeout: 10000 });
      const credit = await page.locator('#model-credit-tulsi').innerText();
      check(credit.includes('Prakash.Chatterjee') && credit.includes('CC BY 4.0'), `${test.world}: Tulsi creator/license credit is incomplete`);
      await page.locator('#ctl-x').evaluate((element) => {
        if (element instanceof HTMLInputElement) {
          element.value = '55';
          element.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
      await page.waitForFunction(() => {
        const note = document.querySelector('#explode-note');
        const title = document.querySelector('#explode-note-title')?.textContent ?? '';
        const copy = document.querySelector('#explode-note-copy')?.textContent ?? '';
        const fact = document.querySelector('#explode-note-fun')?.textContent ?? '';
        return note instanceof HTMLElement && !note.hidden && title.includes('তুলসী') && copy.includes('সুগন্ধি') && fact.length > 15;
      }, null, { timeout: 10000 });
    }
    if (test.expected.some((asset) => asset.startsWith('turmeric_root_scan_01/'))) {
      await page.waitForFunction(() => {
        const note = document.querySelector('#model-credit-turmeric');
        return note instanceof HTMLElement && !note.hidden;
      }, null, { timeout: 10000 }).catch(async (error) => {
        const diagnostic = await page.evaluate(() => ({
          category: document.querySelector('#crumb-cat')?.textContent?.trim() ?? null,
          item: document.querySelector('#crumb-item')?.textContent?.trim() ?? null,
          turmericCreditHidden: document.querySelector('#model-credit-turmeric') instanceof HTMLElement
            ? document.querySelector('#model-credit-turmeric').hidden : null,
          chips: [...document.querySelectorAll('.chip[data-di]')].map((node) => ({
            index: node.getAttribute('data-di'), text: node.textContent?.trim(), pressed: node.getAttribute('aria-pressed'),
          })),
        }));
        console.error(`TURMERIC CREDIT DEBUG ${viewport.name} ${test.shot}: ${JSON.stringify(diagnostic)}`);
        throw error;
      });
      const credit = await page.locator('#model-credit-turmeric').innerText();
      check(credit.includes('Keeszify') && credit.includes('CC BY 4.0') && (credit.includes('শিকড়') || credit.includes('রাইজোম')), `${test.world}: turmeric root identity/creator/license credit is incomplete`);
      if (test.world === 'life') {
        await page.locator('#ctl-x').evaluate((element) => {
          if (element instanceof HTMLInputElement) {
            element.value = '55';
            element.dispatchEvent(new Event('input', { bubbles: true }));
          }
        });
        await page.waitForFunction(() => {
          const note = document.querySelector('#explode-note');
          const title = document.querySelector('#explode-note-title')?.textContent ?? '';
          const copy = document.querySelector('#explode-note-copy')?.textContent ?? '';
          const fact = document.querySelector('#explode-note-fun')?.textContent ?? '';
          return note instanceof HTMLElement && !note.hidden && title.includes('হলুদ') && copy.includes('হলুদ') && fact.length > 15;
        }, null, { timeout: 10000 });
      }
    }
    if (test.expected.some((asset) => asset.startsWith('cinnamon_stick_scan_01/'))) {
      await page.waitForFunction(() => {
        const note = document.querySelector('#model-credit-cinnamon');
        return note instanceof HTMLElement && !note.hidden;
      }, null, { timeout: 10000 });
      const credit = await page.locator('#model-credit-cinnamon').innerText();
      check(credit.includes('sfsen') && credit.includes('CC BY 4.0') && (credit.includes('কাঠি') || credit.includes('ছাল')), `${test.world}: cinnamon stick identity/creator/license credit is incomplete`);
      if (test.world === 'life') {
        await page.locator('#ctl-x').evaluate((element) => {
          if (element instanceof HTMLInputElement) {
            element.value = '55';
            element.dispatchEvent(new Event('input', { bubbles: true }));
          }
        });
        await page.waitForFunction(() => {
          const note = document.querySelector('#explode-note');
          const title = document.querySelector('#explode-note-title')?.textContent ?? '';
          const copy = document.querySelector('#explode-note-copy')?.textContent ?? '';
          const fact = document.querySelector('#explode-note-fun')?.textContent ?? '';
          return note instanceof HTMLElement && !note.hidden && title.includes('দারুচিনি') && copy.includes('দারুচিনি') && fact.length > 15;
        }, null, { timeout: 10000 });
      }
    }
    if (test.expected.some((asset) => asset.startsWith('red_chilli_scan_01/'))) {
      await page.waitForFunction(() => {
        const note = document.querySelector('#model-credit-chilli');
        return note instanceof HTMLElement && !note.hidden;
      }, null, { timeout: 10000 });
      const credit = await page.locator('#model-credit-chilli').innerText();
      check(credit.includes('Muhammad Azim') && credit.includes('CC BY 4.0') && credit.includes('ফল'), `${test.world}: red chilli specimen identity/creator/license credit is incomplete`);
    }
    if (test.expected.some((asset) => asset.startsWith('white_throated_kingfisher_01/'))) {
      await page.waitForFunction(() => {
        const note = document.querySelector('#model-credit-kingfisher');
        return note instanceof HTMLElement && !note.hidden;
      }, null, { timeout: 10000 });
      const credit = await page.locator('#model-credit-kingfisher').innerText();
      check(credit.includes('RISD Nature Lab') && credit.includes('CC BY 4.0') && credit.includes('ট্যাক্সিডার্মি'), `${test.world}: kingfisher specimen identity/creator/license caveat is incomplete`);
      await page.locator('#ctl-x').evaluate((element) => {
        if (element instanceof HTMLInputElement) {
          element.value = '55';
          element.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
      await page.waitForFunction(() => {
        const note = document.querySelector('#explode-note');
        const title = document.querySelector('#explode-note-title')?.textContent ?? '';
        const copy = document.querySelector('#explode-note-copy')?.textContent ?? '';
        const fact = document.querySelector('#explode-note-fun')?.textContent ?? '';
        return note instanceof HTMLElement && !note.hidden && title.includes('মাছরাঙা') && copy.includes('মাছ') && fact.length > 15;
      }, null, { timeout: 10000 }).catch(async () => {
        console.error(`KINGFISHER DETAIL DEBUG ${viewport.name}`, await page.locator('#crumb-cat,#crumb-item,#explode-note').allTextContents());
        throw new Error(`${viewport.name}: kingfisher close-up did not show its item-specific explanation and fact`);
      });
    }
    if (test.expected.some((asset) => asset.startsWith('soviet_stopwatch_01/'))) {
      await page.waitForFunction(() => {
        const note = document.querySelector('#model-credit-stopwatch');
        return note instanceof HTMLElement && !note.hidden;
      }, null, { timeout: 10000 });
      const credit = await page.locator('#model-credit-stopwatch').innerText();
      check(credit.includes('mantledmoon') && credit.includes('CC BY 4.0') && credit.includes('যান্ত্রিক'), `${test.world}: analog stopwatch identity/creator/license credit is incomplete`);
    }
    if (test.expected.some((asset) => asset.startsWith('soviet_barometer_01/'))) {
      await page.waitForFunction(() => {
        const note = document.querySelector('#model-credit-barometer');
        return note instanceof HTMLElement && !note.hidden;
      }, null, { timeout: 10000 });
      const credit = await page.locator('#model-credit-barometer').innerText();
      check(credit.includes('darkmoral') && credit.includes('CC BY 4.0') && credit.includes('অ্যানেরয়েড'), `${test.world}: barometer identity/creator/license credit is incomplete`);
      await page.locator('#ctl-x').evaluate((element) => {
        if (element instanceof HTMLInputElement) {
          element.value = '55';
          element.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
      await page.waitForFunction(() => {
        const note = document.querySelector('#explode-note');
        const title = document.querySelector('#explode-note-title')?.textContent ?? '';
        const copy = document.querySelector('#explode-note-copy')?.textContent ?? '';
        const fact = document.querySelector('#explode-note-fun')?.textContent ?? '';
        return note instanceof HTMLElement && !note.hidden && title.includes('ব্যারোমিটার') && copy.includes('চাপ') && fact.length > 15;
      }, null, { timeout: 10000 });
    }
    if (test.expected.some((asset) => asset.startsWith('clinical_thermometer_01/'))) {
      await page.waitForFunction(() => {
        const note = document.querySelector('#model-credit-thermometer');
        return note instanceof HTMLElement && !note.hidden;
      }, null, { timeout: 10000 });
      const credit = await page.locator('#model-credit-thermometer').innerText();
      check(credit.includes('Medical.Gallery Graphics') && credit.includes('CC BY 4.0') && credit.includes('আবহাওয়া বা ডিজিটাল'), `${test.world}: oral thermometer identity/creator/license caveat is incomplete`);
      await page.locator('#ctl-x').evaluate((element) => {
        if (element instanceof HTMLInputElement) {
          element.value = '55';
          element.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
      await page.waitForFunction(() => {
        const note = document.querySelector('#explode-note');
        const title = document.querySelector('#explode-note-title')?.textContent ?? '';
        const copy = document.querySelector('#explode-note-copy')?.textContent ?? '';
        const fact = document.querySelector('#explode-note-fun')?.textContent ?? '';
        return note instanceof HTMLElement && !note.hidden && title.includes('থার্মোমিটার') && copy.includes('তাপমাত্রা') && fact.length > 15;
      }, null, { timeout: 10000 });
    }
    if (test.expected.some((asset) => asset.startsWith('realistic_bee_01/'))) {
      await page.waitForFunction(() => {
        const note = document.querySelector('#model-credit-bee');
        const url = '/models/realistic_bee_01/bee.glb';
        return note instanceof HTMLElement && !note.hidden
          && window.__posoraModelAnimations[url]?.includes('_bee_hover')
          && window.__posoraPlayingAnimations[url] === true;
      }, null, { timeout: 10000 });
      const credit = await page.locator('#model-credit-bee').innerText();
      check(credit.includes('Pasha') && credit.includes('Irfan') && credit.includes('CC BY 4.0') && credit.includes('নির্দিষ্ট মধুমক্ষিকা'), `${test.world}: bee source chain, license, or identity caveat is incomplete`);
      await page.locator('#ctl-x').evaluate((element) => {
        if (element instanceof HTMLInputElement) {
          element.value = '55';
          element.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
      await page.waitForFunction((isHoneybee) => {
        const note = document.querySelector('#explode-note');
        const title = document.querySelector('#explode-note-title')?.textContent ?? '';
        const copy = document.querySelector('#explode-note-copy')?.textContent ?? '';
        const fact = document.querySelector('#explode-note-fun')?.textContent ?? '';
        return note instanceof HTMLElement && !note.hidden
          && (isHoneybee ? title.includes('মধুমক্ষিকা') && copy.includes('মৌচাক') : title.includes('পতঙ্গ') && copy.includes('ছয়'))
          && fact.length > 15;
      }, test.category === 'বাংলাদেশের প্রাণী' && test.itemIndex === 11, { timeout: 10000 });
    }
    if (test.expected.some((asset) => asset.startsWith('green_sea_turtle_01/'))) {
      await page.waitForFunction(() => {
        const note = document.querySelector('#model-credit-green-turtle');
        const path = '/models/green_sea_turtle_01/green-sea-turtle.glb';
        return note instanceof HTMLElement && !note.hidden
          && window.__posoraModelAnimations[path]?.includes('Turtle_idle_2')
          && window.__posoraPlayingAnimations[path] === true;
      }, null, { timeout: 20000 }).catch(async (error) => {
        console.error(`TURTLE ANIMATION DEBUG ${viewport.name}: ${JSON.stringify(await page.evaluate(() => ({
          category: document.querySelector('#crumb-cat')?.textContent?.trim() ?? null,
          item: document.querySelector('#crumb-item')?.textContent?.trim() ?? null,
          credit: document.querySelector('#model-credit-green-turtle')?.hidden ?? null,
          loaded: window.__posoraLoadedModels,
          animations: window.__posoraModelAnimations['/models/green_sea_turtle_01/green-sea-turtle.glb'] ?? null,
          playing: window.__posoraPlayingAnimations['/models/green_sea_turtle_01/green-sea-turtle.glb'] ?? null,
        })))}`);
        throw error;
      });
      const credit = await page.locator('#model-credit-green-turtle').innerText();
      check(credit.includes('jgrabo20') && credit.includes('CC BY 4.0') && credit.includes('বাংলাদেশের নির্দিষ্ট'), `${viewport.name}: turtle source, license, or identity caveat is incomplete`);
      await page.locator('#ctl-x').evaluate((element) => {
        if (element instanceof HTMLInputElement) {
          element.value = '55';
          element.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
      await page.waitForFunction(() => {
        const note = document.querySelector('#explode-note');
        const title = document.querySelector('#explode-note-title')?.textContent ?? '';
        const copy = document.querySelector('#explode-note-copy')?.textContent ?? '';
        const fact = document.querySelector('#explode-note-fun')?.textContent ?? '';
        return note instanceof HTMLElement && !note.hidden && title.includes('কচ্ছপ')
          && copy.includes('সবুজ সামুদ্রিক কাছিম') && fact.includes('২০১৪ সালের');
      }, null, { timeout: 10000 });
    }
    if (test.expected.some((asset) => asset.startsWith('mint_leaves_01/'))) {
      await page.waitForFunction(() => {
        const note = document.querySelector('#model-credit-mint-leaves');
        return note instanceof HTMLElement && !note.hidden
          && window.__posoraLoadedModels?.includes('/models/mint_leaves_01/mint-leaves.glb');
      }, null, { timeout: 10000 });
      const credit = await page.locator('#model-credit-mint-leaves').innerText();
      check(credit.includes('Zinaida.Kovrova') && credit.includes('CC BY 4.0') && credit.includes('পাতার নমুনা') && credit.includes('সম্পূর্ণ পুদিনা গাছ নয়'), `${viewport.name}: mint-leaf source, license, or scope disclosure is incomplete`);
      await page.locator('#ctl-x').evaluate((element) => {
        if (element instanceof HTMLInputElement) {
          element.value = '55';
          element.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
      await page.waitForFunction(() => {
        const note = document.querySelector('#explode-note');
        const title = document.querySelector('#explode-note-title')?.textContent ?? '';
        const copy = document.querySelector('#explode-note-copy')?.textContent ?? '';
        const fact = document.querySelector('#explode-note-fun')?.textContent ?? '';
        return note instanceof HTMLElement && !note.hidden && title.includes('পুদিনা')
          && copy.includes('ঠান্ডা অনুভূতি') && fact.length > 15;
      }, null, { timeout: 10000 });
    }
    if (test.expected.some((asset) => asset.startsWith('realistic_red_fox_01/'))) {
      const credit = page.locator('#model-credit');
      check(await credit.isVisible(), `${test.world}: visible fox model credit is missing`);
      check((await credit.innerText()).includes('1DesignTool'), `${test.world}: fox source link is missing`);
    }
    if (test.expected.some((asset) => asset.startsWith('octopus_scan_01/'))) {
      const credit = page.locator('#model-credit');
      check(await credit.isVisible(), `${test.world}: visible octopus model credit is missing`);
      const text = await credit.innerText();
      check(text.includes('rayleighsyafiq') && text.includes('CC BY 4.0') && text.includes('Smithsonian Ocean') && text.includes('বাংলাদেশের নির্দিষ্ট প্রজাতি নয়'), `${test.world}: octopus source, rights, or identity caveat is incomplete`);
    }
    if (test.expected.some((asset) => asset.startsWith('realistic_panther_chameleon_01/'))) {
      const credit = page.locator('#model-credit');
      check(await credit.isVisible(), `${test.world}: visible chameleon model note is missing`);
      check((await credit.innerText()).includes('প্যান্থার গিরগিটি') && (await credit.innerText()).includes('বাংলাদেশি প্রজাতির উদাহরণ নয়'), `${test.world}: chameleon identity/local-fauna caveat is missing`);
      if (test.itemIndex === 2) {
        await page.locator('#ctl-x').evaluate((element) => {
          if (element instanceof HTMLInputElement) {
            element.value = '55';
            element.dispatchEvent(new Event('input', { bubbles: true }));
          }
        });
        await page.waitForFunction(() => {
          const note = document.querySelector('#explode-note');
          const fact = document.querySelector('#explode-note-fun')?.textContent ?? '';
          return note instanceof HTMLElement && !note.hidden && fact.includes('আলাদা দিকে');
        }, null, { timeout: 10000 });
      }
    }
    if (test.expected.some((asset) => asset.startsWith('realistic_indian_peafowl_01/'))) {
      const credit = page.locator('#model-credit');
      check(await credit.isVisible(), `${test.world}: visible peafowl model note is missing`);
      check((await credit.innerText()).includes('ভারতীয় ময়ূর') && (await credit.innerText()).includes('বাংলাদেশের পাখির তালিকার অংশ নয়'), `${test.world}: peafowl identity/local-fauna caveat is missing`);
      if (test.itemIndex === 1) {
        await page.locator('#ctl-x').evaluate((element) => {
          if (element instanceof HTMLInputElement) {
            element.value = '55';
            element.dispatchEvent(new Event('input', { bubbles: true }));
          }
        });
        await page.waitForFunction(() => {
          const note = document.querySelector('#explode-note');
          const fact = document.querySelector('#explode-note-fun')?.textContent ?? '';
          return note instanceof HTMLElement && !note.hidden && fact.includes('ocelli');
        }, null, { timeout: 10000 });
      }
    }
    if (test.expected.some((asset) => asset.startsWith('realistic_axolotl_01/'))) {
      const credit = page.locator('#model-credit');
      check(await credit.isVisible(), `${test.world}: visible axolotl model note is missing`);
      check((await credit.innerText()).includes('অ্যাক্সোলটল') && (await credit.innerText()).includes('বাংলাদেশের প্রাণী নয়'), `${test.world}: axolotl identity/local-fauna caveat is missing`);
      await page.locator('#ctl-x').evaluate((element) => {
        if (element instanceof HTMLInputElement) {
          element.value = '55';
          element.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
      await page.waitForFunction(() => {
        const note = document.querySelector('#explode-note');
        const fact = document.querySelector('#explode-note-fun')?.textContent ?? '';
        return note instanceof HTMLElement && !note.hidden && fact.includes('বাহ্যিক ফুলকা');
      }, null, { timeout: 10000 });
    }
    if (test.shot === 'food-vitamin-lime.png') {
      await page.locator('#ctl-x').evaluate((element) => {
        if (element instanceof HTMLInputElement) {
          element.value = '55';
          element.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
      await page.waitForFunction(() => {
        const note = document.querySelector('#food-detail-note');
        const copy = document.querySelector('#food-detail-copy')?.textContent ?? '';
        return note instanceof HTMLElement && !note.hidden && copy.includes('লাইম');
      }, null, { timeout: 10000 });
    }
    // Changing sections/objects can re-arm the mobile WebGL opt-in. Start the
    // stage after the selection so it renders the object this case is testing.
    const sceneStart = page.locator('#world-start');
    if (viewport.name === 'mobile') {
      // Item changes can re-arm the mobile opt-in after the selection handler
      // returns. Give that button a moment to become visible before deciding the
      // existing canvas is still active.
      if (!(await sceneStart.isVisible().catch(() => false))) {
        await sceneStart.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
      }
      if (await sceneStart.count() && await sceneStart.isVisible() && await sceneStart.isEnabled()) {
        await sceneStart.click({ timeout: 5000 }).catch(() => {});
      }
    }
    let rearmed = false;
    let rearmError;
    for (let attempt = 0; attempt < 3 && !rearmed; attempt += 1) {
      if (attempt > 0) {
        await page.evaluate(() => document.querySelector('#hero-host')?.scrollIntoView({ block: 'center' }));
        if (viewport.name === 'mobile' && await sceneStart.isVisible().catch(() => false) && await sceneStart.isEnabled()) {
          await sceneStart.click({ timeout: 5000 }).catch(() => {});
        }
        await page.waitForTimeout(500);
      }
      try {
        await page.locator('#hero-host canvas[data-engine]').waitFor({
          state: 'attached', timeout: viewport.name === 'mobile' ? 30000 : 20000,
        });
        rearmed = true;
      } catch (error) {
        rearmError = error;
      }
    }
    if (!rearmed) {
      const diagnostics = await page.evaluate(() => ({
        url: location.href,
        category: document.querySelector('#crumb-cat')?.textContent?.trim() ?? null,
        item: document.querySelector('#crumb-item')?.textContent?.trim() ?? null,
        canvas: document.querySelector('#hero-host canvas')?.outerHTML.slice(0, 500) ?? null,
        fallback: document.querySelector('#hero-loading')?.textContent ?? null,
        start: document.querySelector('#world-start')?.outerHTML ?? null,
        loadedModels: window.__posoraLoadedModels,
      }));
      console.error(`REARM DEBUG ${viewport.name} ${test.shot}: ${JSON.stringify(diagnostics)}; warnings=${errors.join(' | ') || 'none'}`);
      throw rearmError;
    }
    // Let the GLTF parser finish attaching the successful response before the
    // visual capture; an HTTP 200 alone does not prove the scene can use it.
    // GLTFLoader must parse the GLB and its image textures after the transfer;
    // give that asynchronous attachment a visible frame before screenshotting.
    for (const asset of test.expected) {
      const url = `/models/${asset}`;
      try {
        await page.waitForFunction((path) => window.__posoraLoadedModels.some((value) => new URL(value, location.href).pathname === path), url, { timeout: 30000 });
      } catch { /* the assertion below reports the model and world together */ }
      const loaded = await page.evaluate((path) => window.__posoraLoadedModels.some((value) => new URL(value, location.href).pathname === path), url);
      const status = assetResponses.get(url);
      if (!loaded) {
        const diagnostics = await page.evaluate(() => ({
          selection: [...document.querySelectorAll('#crumb-cat, #crumb-item')].map((node) => node.textContent?.trim()),
          loadedModels: window.__posoraLoadedModels,
          loadingText: document.querySelector('#hero-loading')?.textContent?.trim() ?? null,
          selectedChip: document.querySelector('.chip[aria-pressed="true"]')?.textContent?.trim() ?? null,
        }));
        console.error(`MODEL DEBUG ${viewport.name} ${diagnostics.selection.join(' / ')}: ${url} HTTP=${status ?? 'not observed'}; loaded=${JSON.stringify(diagnostics.loadedModels)}; selected=${diagnostics.selectedChip}; loading=${diagnostics.loadingText}; warnings=${errors.join(' | ') || 'none'}`);
      }
      check(loaded && (status === undefined || status === 200), `${test.world}: ${asset} was not successfully parsed and attached to its scene`);
      if (asset === 'bamboo_botany_01/bamboo.glb') {
        const clips = await page.evaluate((path) => window.__posoraModelAnimations[path] ?? [], url);
        check(clips.includes('Sway'), `${viewport.name}: bamboo's authored Sway clip was not activated`);
        const playing = await page.evaluate((path) => window.__posoraPlayingAnimations[path] === true, url);
        check(playing, `${viewport.name}: bamboo's authored animation is not playing (or reduced-motion was incorrectly detected)`);
      }
    }
    if (test.expected.some((asset) => asset.startsWith('cardamom_bowl_01/'))) {
      try {
        await page.waitForFunction(() => {
          const note = document.querySelector('#model-credit-cardamom-bowl');
          return note instanceof HTMLElement && !note.hidden;
        }, null, { timeout: 10000 });
      } catch (error) {
        const diagnostics = await page.evaluate(() => ({
          category: document.querySelector('#crumb-cat')?.textContent,
          item: document.querySelector('#crumb-item')?.textContent,
          credit: document.querySelector('#model-credit-cardamom-bowl')?.outerHTML,
          parent: document.querySelector('#model-credit')?.outerHTML,
          loaded: window.__posoraLoadedModels,
        }));
        console.error(`CARDAMOM DEBUG ${viewport.name}: ${JSON.stringify(diagnostics)}`);
        throw error;
      }
      const credit = await page.locator('#model-credit-cardamom-bowl').innerText();
      check(credit.includes('go3452') && credit.includes('CC BY 4.0') && credit.includes('AI-সহায়তায় তৈরি'), `${viewport.name}: cardamom source, license, or AI-generation disclosure is missing`);
    }
    if (test.expected.some((asset) => asset.startsWith('ikan_goreng_01/'))) {
      await page.waitForFunction(() => {
        const note = document.querySelector('#model-credit-fried-fish');
        return note instanceof HTMLElement && !note.hidden;
      }, null, { timeout: 10000 });
      const credit = await page.locator('#model-credit-fried-fish').innerText();
      check(credit.includes('wox080xow') && credit.includes('CC BY 4.0') && credit.includes('নির্দিষ্ট মাছের জাত বা রেসিপি'), `${viewport.name}: fried-fish source, license, or identity limitation is missing`);
      await page.locator('#ctl-x').evaluate((element) => {
        if (element instanceof HTMLInputElement) {
          element.value = '55';
          element.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
      await page.waitForFunction(() => {
        const note = document.querySelector('#food-detail-note');
        return note instanceof HTMLElement && !note.hidden
          && document.querySelector('#food-detail-copy')?.textContent?.includes('ভাজার আগে মাছ');
      }, null, { timeout: 10000 });
      if (process.env.MODEL_SMOKE_SCREENSHOTS === '1') {
        await page.waitForTimeout(600);
        await page.screenshot({ path: path.join(evidenceDir, `${viewport.name}-food-fried-fish-exploded.png`), fullPage: false });
      }
      await page.locator('#ctl-x').evaluate((element) => {
        if (element instanceof HTMLInputElement) {
          element.value = '0';
          element.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
    }
    if (test.expected.some((asset) => asset.startsWith('ganges_dolphin_skeleton_01/'))) {
      await page.waitForFunction(() => {
        const credit = document.querySelector('#model-credit-ganges-dolphin-skeleton');
        return credit instanceof HTMLElement && !credit.hidden;
      }, null, { timeout: 10000 });
      const credit = await page.locator('#model-credit-ganges-dolphin-skeleton').innerText();
      check(credit.includes('Patrizia17') && credit.includes('CC BY-SA 4.0') && credit.includes('কঙ্কাল, জীবন্ত শুশুক নয়'), `${viewport.name}: Ganges dolphin skeleton attribution or limitation is missing`);
      await page.locator('#ctl-x').evaluate((element) => {
        if (element instanceof HTMLInputElement) {
          element.value = '55';
          element.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
      await page.waitForFunction(() => {
        const note = document.querySelector('#explode-note');
        const title = document.querySelector('#explode-note-title')?.textContent ?? '';
        const copy = document.querySelector('#explode-note-copy')?.textContent ?? '';
        return note instanceof HTMLElement && !note.hidden && title.includes('শুশুক') && copy.includes('বাংলাদেশের নদীতে');
      }, null, { timeout: 10000 });
      // On this Chrome/SwiftShader setup, desktop page captures during the
      // moving reveal can return a solid-black frame even though the same
      // scene renders normally before/after it. Keep interaction assertions
      // on desktop; save the reveal screenshot from the mobile viewport where
      // the browser capture is stable.
      if (process.env.MODEL_SMOKE_SCREENSHOTS === '1' && viewport.name === 'mobile') {
        await page.waitForTimeout(1200);
        await page.screenshot({ path: path.join(evidenceDir, `${viewport.name}-life-ganges-dolphin-skeleton-exploded.png`), fullPage: false });
      }
      await page.locator('#ctl-x').evaluate((element) => {
        if (element instanceof HTMLInputElement) {
          element.value = '0';
          element.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
    }
      const referencePrefix = Object.keys(REFERENCE_IMAGES).find((prefix) => test.expected.some((asset) => asset.startsWith(prefix)));
      if (referencePrefix) {
        const image = REFERENCE_IMAGES[referencePrefix];
        try {
          await page.waitForFunction((name) => {
            const card = document.querySelector('#species-reference');
            const img = document.querySelector('#species-reference-image');
            return card instanceof HTMLElement && !card.hidden && img instanceof HTMLImageElement
              && img.getAttribute('src')?.endsWith(`/${name}`) && img.complete && img.naturalWidth > 0;
          }, image, { timeout: 15000 });
          const credit = await page.locator('#species-reference-credit').innerText();
          const links = await page.locator('#species-reference-credit a').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href') ?? ''));
          check(/ছবি: \S/.test(credit) && /(CC|Public domain)/.test(credit) && links.length === 2 && links.every((href) => href.startsWith('https://')),
            `${viewport.name}: ${test.shot} reference photograph credit, licence or links are incomplete (${credit})`);
        } catch {
          check(false, `${viewport.name}: ${test.shot} did not show its exact reference photograph ${image}`);
        }
      }
      await page.waitForTimeout(1000);
      await page.waitForFunction(() => !!document.querySelector('#hero-host canvas'), null, { timeout: 15000 });
      const canvasCount = await page.evaluate(() => document.querySelectorAll('#hero-host canvas').length);
      check(canvasCount === 1, `${viewport.name} /${test.world}: focused scene canvas missing after selecting ${test.selector}`);
      // The 3D scene may animate continuously, so Playwright's stability wait
      // inside scrollIntoViewIfNeeded can time out even when the canvas is
      // present and rendering. Use an immediate DOM scroll instead.
      await page.evaluate(() => document.querySelector('#hero-host canvas')?.scrollIntoView({ block: 'center', behavior: 'instant' }));
      await page.waitForTimeout(1000);
      if (process.env.MODEL_SMOKE_SCREENSHOTS === '1') {
        await page.screenshot({
          path: path.join(evidenceDir, `${viewport.name}-${test.shot}`),
          fullPage: false,
          timeout: viewport.name === 'mobile' ? 60000 : 30000,
        });
      }
      if (failures.length === failuresBeforeCase) console.log(`PASS ${viewport.name} /${test.world}/ ${test.expected.join(', ')}`);
      else console.error(`FAIL ${viewport.name} /${test.world}/ ${test.expected.join(', ')}`);
    }
    check(errors.length === 0, `${viewport.name}: uncaught page errors: ${errors.slice(0, 3).join(' | ')}`);
    await page?.close();
  }
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(`Licensed-model smoke failed (${failures.length})`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
    console.log(`Licensed-model smoke passed: ${activeCases.length} model states at desktop and mobile (parsed and attached; review visuals in a real browser).`);
}
