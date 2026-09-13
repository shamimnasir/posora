/**
 * The look.
 *
 * Every scene on this site was drawn with correct geometry and no rendering
 * craft on top of it, and the difference between those two things is the
 * difference between a model and a picture. There were no shadows, so nothing
 * sat on anything; no tone mapping, so bright greens clipped to a flat slab;
 * and no environment, so `MeshStandardMaterial` had nothing to reflect and
 * every surface came out as the same matte plastic. A player recognises that
 * instantly as placeholder art, and they are right to.
 *
 * What this does NOT do is chase photorealism. No downloaded models, no
 * texture files, nothing that would not survive a cheap tablet on a Bangladeshi
 * mobile connection - the whole site is still primitives generated in the
 * browser. The aim is the other kind of good: a stylised world that is
 * *deliberate*, lit and composed on purpose, the register of Monument Valley
 * rather than of a screenshot. Low poly because it is a style, not because
 * nobody tried.
 *
 * Four things buy nearly all of it:
 *   1. A shadow-casting key light, so objects touch the ground.
 *   2. ACES filmic tone mapping, so saturated colour rolls off instead of
 *      clipping, and the greens stop looking like paint chips.
 *   3. A generated sky/ground environment, so every material has something to
 *      reflect and picks up warmth from above and cool from below.
 *   4. Fog, so depth reads.
 */
import {
  ACESFilmicToneMapping, PCFShadowMap, SRGBColorSpace, PMREMGenerator,
  Scene, Mesh, BoxGeometry, MeshBasicMaterial, BackSide, Color, Fog,
  AmbientLight, DirectionalLight, WebGLRenderer, Object3D, CircleGeometry,
  MeshStandardMaterial, DoubleSide, Texture,
} from 'three';

/** Cheap devices exist, and a 4K shadow map on one is a slideshow. */
const lowPower = () =>
  (navigator.hardwareConcurrency ?? 8) <= 4 || /Android [4-9]\./.test(navigator.userAgent);

/**
 * A sky and a ground, blurred into an environment map.
 *
 * Three's own RoomEnvironment is a room, which is the wrong light for a mango
 * tree. This is twenty lines and gives warm light from above, cool bounce from
 * below, and the horizon line that makes a curved surface read as curved.
 */
function skyEnvironment(renderer: WebGLRenderer): Texture {
  const pmrem = new PMREMGenerator(renderer);
  const s = new Scene();
  const shell = (color: string, y: number, h: number) => {
    const m = new Mesh(new BoxGeometry(12, h, 12), new MeshBasicMaterial({ color, side: BackSide }));
    m.position.y = y;
    s.add(m);
  };
  shell('#dfeaf6', 3, 6);   // sky, cool and bright
  shell('#8d9a86', -3, 6);  // ground bounce, green-grey and dim
  // one warm patch standing in for the sun, which is what puts a highlight on
  // anything round
  const sun = new Mesh(new BoxGeometry(3.2, 0.1, 3.2), new MeshBasicMaterial({ color: '#fff4d6' }));
  sun.position.set(2.2, 5.6, 1.6);
  s.add(sun);
  const env = pmrem.fromScene(s, 0.04).texture;
  pmrem.dispose();
  s.traverse((o) => {
    const m = o as Mesh;
    if (m.geometry) m.geometry.dispose();
    const mat = m.material as MeshBasicMaterial | undefined;
    if (mat?.dispose) mat.dispose();
  });
  return env;
}

export type Stage = {
  /** Drop this under the scene to catch the key light's shadow. */
  ground: Mesh;
  env: Texture;
  key: DirectionalLight;
  dispose(): void;
};

/**
 * Configure a renderer and light a scene the same way everywhere, so the
 * shelf, the heroes and anything added later cannot drift apart.
 *
 * `groundY` is where the shadow catcher sits; `radius` roughly how wide the
 * scene is, which sets the shadow camera.
 */
export function dressScene(
  renderer: WebGLRenderer,
  scene: Scene,
  opts: { groundY?: number; radius?: number; fog?: string; exposure?: number } = {},
): Stage {
  const { groundY = -0.56, radius = 4, fog, exposure = 1.06 } = opts;
  const weak = lowPower();

  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = exposure;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, weak ? 1.5 : 2));
  renderer.shadowMap.enabled = true;
  /**
   * PCF, not PCF-soft.
   *
   * three still exports the `PCFSoftShadowMap` constant, so asking for it
   * compiles and typechecks cleanly, but 0.186 removed the implementation:
   * `WebGLShadowMap.render` quietly rewrites the type to PCFShadowMap and
   * warns, once per scene mount, which was eighteen console warnings on a
   * world page. PCFShadowMap is already the default, so this line is really a
   * statement of intent - the softness now has to come from the map size and
   * the normal bias below, not from the filter.
   */
  renderer.shadowMap.type = PCFShadowMap;

  const env = skyEnvironment(renderer);
  scene.environment = env;
  if (fog) scene.fog = new Fog(new Color(fog).getHex(), radius * 2.2, radius * 6);

  // The ambient is low on purpose: the environment map is doing that job now,
  // and leaving the old flat 0.55 on top of it washes every shadow out.
  scene.add(new AmbientLight('#ffffff', 0.18));

  const key = new DirectionalLight('#fff6e2', 2.1);
  key.position.set(3.2, 6.4, 3.6);
  key.castShadow = true;
  key.shadow.mapSize.set(weak ? 1024 : 2048, weak ? 1024 : 2048);
  key.shadow.bias = -0.0012;
  key.shadow.normalBias = 0.02;
  const c = key.shadow.camera;
  c.left = -radius; c.right = radius; c.top = radius; c.bottom = -radius;
  c.near = 0.5; c.far = radius * 4;
  c.updateProjectionMatrix();
  scene.add(key);

  // A cool fill from the opposite side keeps the shadow side from going dead,
  // and a rim from behind separates the figure from the background.
  const fill = new DirectionalLight('#cfe2ff', 0.35);
  fill.position.set(-4, 2.2, -2.4);
  scene.add(fill);
  const rim = new DirectionalLight('#ffe8c2', 0.5);
  rim.position.set(-2.4, 2.6, -5);
  scene.add(rim);

  /**
   * The old ground was a flat half-transparent disc, which reads as a grey
   * sticker under the objects. This one is nearly invisible by itself and
   * exists to take the shadow, which is what actually makes something look
   * like it is standing somewhere.
   */
  const ground = new Mesh(
    new CircleGeometry(radius * 1.25, 64),
    new MeshStandardMaterial({ color: '#8fa08c', roughness: 0.95, metalness: 0, transparent: true, opacity: 0.28, side: DoubleSide }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = groundY;
  ground.receiveShadow = true;

  return {
    ground, env, key,
    dispose() { env.dispose(); ground.geometry.dispose(); (ground.material as MeshStandardMaterial).dispose(); },
  };
}

/**
 * Let every mesh in a built object cast and receive. Applied after a figure is
 * built rather than inside each builder, so one call covers all ninety-odd of
 * them and a new one cannot forget.
 */
export function castShadows(root: Object3D): void {
  root.traverse((o) => {
    const m = o as Mesh;
    if (!m.isMesh) return;
    const mat = m.material as MeshStandardMaterial | MeshStandardMaterial[] | undefined;
    // Glows and haloes are transparent helpers; a shadow from one is a smudge.
    const clear = Array.isArray(mat) ? mat.some((x) => x.transparent) : !!mat?.transparent;
    m.castShadow = !clear;
    m.receiveShadow = !clear;
  });
}
