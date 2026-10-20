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
const cases = [
  { world: 'food', selector: '#world .rail-list [data-i="3"]', expected: ['food_lychee_01/food_lychee_01.glb'], shot: 'food-fruit-wheel.png' },
  { world: 'food', selector: '#world .rail-list [data-i="5"]', expected: ['food_ginger_01/food_ginger_01.glb'], shot: 'food-ginger.png' },
  { world: 'food', selector: '#world .rail-list [data-i="5"]', category: 'মশলার জগৎ', itemIndex: 1, expected: ['turmeric_root_scan_01/turmeric-root.glb'], shot: 'food-turmeric.png' },
  { world: 'food', selector: '#world .rail-list [data-i="5"]', category: 'মশলার জগৎ', itemIndex: 6, expected: ['cinnamon_stick_scan_01/cinnamon-stick.glb'], shot: 'food-cinnamon.png' },
  { world: 'food', selector: '#world .rail-list [data-i="5"]', category: 'মশলার জগৎ', itemIndex: 4, expected: ['red_chilli_scan_01/red-chilli.glb'], shot: 'food-red-chilli.png' },
  { world: 'food', selector: '#world .rail-list [data-i="4"]', category: 'বাংলার খাবার', itemIndex: 1, expected: ['ikan_goreng_01/ikan-goreng.glb'], shot: 'food-fried-fish-photogrammetry.png' },
  { world: 'life', selector: 'button.grow:has-text("বাংলাদেশের প্রাণী")', category: 'বাংলাদেশের প্রাণী', itemIndex: 6, expected: ['white_throated_kingfisher_01/white-throated-kingfisher.glb'], shot: 'life-white-throated-kingfisher.png' },
  { world: 'life', selector: 'button.grow:has-text("বাংলাদেশের প্রাণী")', category: 'বাংলাদেশের প্রাণী', itemIndex: 4, expected: ['ganges_dolphin_skeleton_01/ganges-dolphin-skeleton.glb'], shot: 'life-ganges-dolphin-skeleton.png' },
  { world: 'life', selector: 'button.grow:has-text("বাংলাদেশের প্রাণী")', category: 'বাংলাদেশের প্রাণী', itemIndex: 3, expected: ['asian_elephant_01/asian-elephant.glb'], shot: 'life-asian-elephant.png' },
  { world: 'life', selector: 'button.grow:has-text("বাংলাদেশের প্রাণী")', category: 'বাংলাদেশের প্রাণী', itemIndex: 11, expected: ['realistic_bee_01/bee.glb'], shot: 'life-bangladesh-honeybee.png' },
  { world: 'life', selector: 'button.grow:has-text("বাংলাদেশের প্রাণী")', category: 'বাংলাদেশের প্রাণী', itemIndex: 10, expected: ['green_sea_turtle_01/green-sea-turtle.glb'], shot: 'life-green-sea-turtle.png' },
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
  { world: 'life', selector: 'button.grow:has-text("ঔষধি")', category: 'ঔষধি ও মশলা গাছ', itemIndex: 7, expected: ['mint_leaves_01/mint-leaves.glb'], shot: 'life-mint-leaves.png' },
  { world: 'life', selector: 'button.grow:has-text("বাংলাদেশের গাছপালা")', category: 'বাংলাদেশের গাছপালা', itemIndex: 0, expected: ['mango_tree_01/mango_tree.glb'], shot: 'life-mango-tree.png' },
  { world: 'life', selector: 'button.grow:has-text("বাংলাদেশের গাছপালা")', category: 'বাংলাদেশের গাছপালা', itemIndex: 1, expected: ['jackfruit_risd_scan_01/jackfruit-pod.glb'], shot: 'life-jackfruit-pod.png' },
  { world: 'life', selector: 'button.grow:has-text("বাংলাদেশের গাছপালা")', category: 'বাংলাদেশের গাছপালা', itemIndex: 2, expected: ['banyan_gunawan_01/banyan-tree.glb'], shot: 'life-banyan.png' },
  { world: 'life', selector: 'button.grow:has-text("বাংলাদেশের গাছপালা")', category: 'বাংলাদেশের গাছপালা', itemIndex: 8, expected: ['bamboo_botany_01/bamboo.glb'], shot: 'life-bamboo.png' },
  { world: 'life', selector: 'button.grow:has-text("বাংলাদেশের গাছপালা")', category: 'বাংলাদেশের গাছপালা', itemIndex: 9, expected: ['rice_oryza_sativa_01/oryza-sativa.glb'], shot: 'life-paddy-rice.png' },
  { world: 'life', selector: 'button.grow:has-text("বাংলাদেশের গাছপালা")', category: 'বাংলাদেশের গাছপালা', itemIndex: 11, expected: ['water_lily_nymphaea_01/water-lily.glb'], shot: 'life-shapla-water-lily.png' },
  { world: 'life', selector: 'button.grow:has-text("বাংলাদেশের গাছপালা")', category: 'বাংলাদেশের গাছপালা', itemIndex: 5, expected: ['krishnachura_delonix_01/krishnachura.glb'], shot: 'life-krishnachura.png' },
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
const worldCases = process.env.MODEL_SMOKE_ONLY
  ? cases.filter((test) => test.world === process.env.MODEL_SMOKE_ONLY)
  : cases;
const activeCases = process.env.MODEL_SMOKE_CASE
  ? worldCases.filter((test) => test.shot === process.env.MODEL_SMOKE_CASE)
  : worldCases;
if (!activeCases.length) throw new Error(`No licensed-model smoke cases for ${process.env.MODEL_SMOKE_ONLY}`);
// Keep each world's model cases together. Reopening the same world after
// several WebGL-heavy pages increases software-renderer pressure and made the
// long desktop/mobile suite intermittently fail during a category transition.
activeCases.sort((a, b) => a.world.localeCompare(b.world));

try {
  const viewports = [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'mobile', width: 390, height: 844 },
  ];
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
        await page.locator('#hero-host').waitFor({ state: 'attached', timeout: 15000 });
        if (viewport.name === 'mobile') {
          // The server-rendered CTA appears before its external module has
          // attached the tap handler. Wait for the explicit hydration marker
          // so this verifies the mobile opt-in instead of racing it.
          await page.waitForFunction(() => document.querySelector('#world-start')?.getAttribute('data-interactive') === 'true', null, { timeout: 15000 });
          const start = page.locator('#world-start');
          if (await start.count() && await start.isVisible()) await start.click();
        }
        // The canvas element is server-rendered even before Three.js mounts.
        // Three.js sets data-engine only after successfully creating a WebGL
        // renderer, so this cannot mistake an empty canvas for a working scene.
        await page.waitForFunction(() => {
          return !!document.querySelector('#hero-host canvas')?.getAttribute('data-engine');
        }, null, { timeout: 30000 });
        // The island can replace the host during initial hydration; scroll the
        // current node from page context instead of retaining a stale locator.
        await page.evaluate(() => document.querySelector('#hero-host')?.scrollIntoView({ block: 'center' }));
      }
    if (test.category) {
      const currentCategory = await page.locator('#crumb-cat').textContent();
      if (currentCategory?.trim() !== test.category) {
        // Use a real locator click so mobile scrolls the category into view and
        // exercises the same pointer path as a learner. A synthetic DOM click
        // could fire while the previous heavy WebGL scene was still settling,
        // then leave the next item assertion on the stale category.
        await page.locator(test.selector).click({ timeoutMs: 15000 });
        await page.waitForFunction((name) => document.querySelector('#crumb-cat')?.textContent?.trim() === name, test.category, { timeout: 15000 });
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
      await page.locator('.chip[data-di="1"]').evaluate((element) => { if (element instanceof HTMLElement) element.click(); });
    }
    if (test.shot === 'life-ginger.png') {
      await page.locator('.chip[data-di="3"]').evaluate((element) => { if (element instanceof HTMLElement) element.click(); });
    }
    if (test.shot === 'discovery-instruments.png') {
      await page.locator('.chip[data-di="3"]').evaluate((element) => { if (element instanceof HTMLElement) element.click(); });
    }
    if (test.shot === 'discovery-telephone.png') {
      await page.locator('.chip[data-di="6"]').evaluate((element) => { if (element instanceof HTMLElement) element.click(); });
    }
    if (test.shot === 'language-fruit.png') {
      await page.locator('.chip[data-di="2"]').evaluate((element) => { if (element instanceof HTMLElement) element.click(); });
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
        await item.waitFor({ state: 'visible', timeout: 10000 });
        await item.evaluate((element) => { if (element instanceof HTMLElement) element.click(); });
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
      }, null, { timeout: 10000 });
      const credit = await page.locator('#model-credit-banyan').innerText();
      check(credit.includes('Jimmy Gunawan') && credit.includes('CC BY 4.0') && credit.includes('পুরো গাছ নয়') && credit.includes('নির্দিষ্ট বাংলাদেশি গাছ'), `${test.world}: banyan creator/license/model-scope/geographic limitation credit is incomplete`);
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
      }, null, { timeout: 10000 });
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
      }, null, { timeout: 10000 });
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
      // Hydration can briefly show a disabled CTA while the canvas is being
      // recreated. Wait until the CTA is truly actionable before using it;
      // a missing CTA means this scene has already been activated.
      await page.waitForFunction(() => {
        const button = document.querySelector('#world-start');
        return !button || !button.hasAttribute('disabled');
      }, null, { timeout: 8000 }).catch(() => {});
      if (await sceneStart.count() && await sceneStart.isVisible() && await sceneStart.isEnabled()) {
        await sceneStart.click({ timeout: 5000 }).catch(() => {});
      }
    }
    await page.waitForFunction(() => {
      return !!document.querySelector('#hero-host canvas')?.getAttribute('data-engine');
    }, null, { timeout: 30000 });
    // Let the GLTF parser finish attaching the successful response before the
    // visual capture; an HTTP 200 alone does not prove the scene can use it.
    // GLTFLoader must parse the GLB and its image textures after the transfer;
    // give that asynchronous attachment a visible frame before screenshotting.
    for (const asset of test.expected) {
      const url = `/models/${asset}`;
      try {
        await page.waitForFunction((path) => window.__posoraLoadedModels.some((value) => new URL(value, location.href).pathname === path), url, { timeout: 12000 });
      } catch { /* the assertion below reports the model and world together */ }
      const loaded = await page.evaluate((path) => window.__posoraLoadedModels.some((value) => new URL(value, location.href).pathname === path), url);
      const status = assetResponses.get(url);
      if (!loaded) {
        const selection = await page.locator('#crumb-cat, #crumb-item').allTextContents();
        console.error(`MODEL DEBUG ${viewport.name} ${selection.join(' / ')}: ${url} HTTP=${status ?? 'not observed'}; warnings=${errors.join(' | ') || 'none'}`);
      }
      check(loaded && (status === undefined || status === 200), `${test.world}: ${asset} was not successfully parsed and attached to its scene`);
      if (asset === 'bamboo_botany_01/bamboo.glb') {
        const clips = await page.evaluate((path) => window.__posoraModelAnimations[path] ?? [], url);
        check(clips.includes('Sway'), `${viewport.name}: bamboo's authored Sway clip was not activated`);
        const playing = await page.evaluate((path) => window.__posoraPlayingAnimations[path] === true, url);
        check(playing, `${viewport.name}: bamboo's authored animation is not playing (or reduced-motion was incorrectly detected)`);
      }
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
      await page.waitForTimeout(1000);
      const canvas = page.locator('#hero-host canvas');
      check(await canvas.count() === 1, `${viewport.name} /${test.world}: focused scene canvas missing after selecting ${test.selector}`);
      await canvas.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
      if (process.env.MODEL_SMOKE_SCREENSHOTS === '1') {
        await page.screenshot({
          path: path.join(evidenceDir, `${viewport.name}-${test.shot}`),
          fullPage: false,
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
