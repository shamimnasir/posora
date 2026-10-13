/** Exact-object licensed models. The key is a figure identity, never a vague category. */
export const LICENSED_FIGURES: Record<string, { url: string; height: number }> = {
  bulb: { url: '/models/lightbulb_led/lightbulb_led_1k.gltf', height: 1.45 },
  // The Food pilot's CC0 Barramundi is also a faithful model for generic fish
  // examples. Species-specific figures such as ইলিশ remain distinct.
  fishSmall: { url: '/models/remake/food-93e5f02c/barramundi-fish-1024-webp.glb', height: 1.15 },
  // Shown as a concrete fruit example for the generic vitamin-rich fruit tile.
  greenFruit: { url: '/models/avocado/avocado.glb', height: 1.05 },
  // Exact CC0 specimens used in the Food and Life collections and fruit wheel.
  bananaFruit: { url: '/models/bananas/bananas.glb', height: 1.05 },
  lycheeFruit: { url: '/models/food_lychee_01/food_lychee_01.glb', height: 0.95 },
  gingerRoot: { url: '/models/food_ginger_01/food_ginger_01.glb', height: 0.82 },
  rock: { url: '/models/rock_07/rock_07.glb', height: 1.35 },
  microscope: { url: '/models/industrial_microscope/industrial_microscope.glb', height: 1.5 },
  compass: { url: '/models/seadogs_compass/seadogs_compass.glb', height: 0.72 },
  clockFace: { url: '/models/alarm_clock_01/alarm_clock_01.glb', height: 0.9 },
  telephone: { url: '/models/korean_public_payphone_01/korean_public_payphone_01.glb', height: 1.5 },
};
