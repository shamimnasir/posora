/** Exact-object licensed models. The key is a figure identity, never a vague category. */
export const LICENSED_FIGURES: Record<string, { url: string; height: number }> = {
  bulb: { url: '/models/lightbulb_led/lightbulb_led_1k.gltf', height: 1.45 },
  // The Food pilot's CC0 Barramundi is also a faithful model for generic fish
  // examples. Species-specific figures such as ইলিশ remain distinct.
  fishSmall: { url: '/models/remake/food-93e5f02c/barramundi-fish-1024-webp.glb', height: 1.15 },
};
