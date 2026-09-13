/**
 * The zoomable cosmos: one scene, three depths.
 *
 *   system  - the whole solar system turning around the sun, every body clickable
 *   body    - one body filling the view, its moons in orbit, all clickable
 *   moon    - the camera flies to a moon and rides along with it
 *
 * Everything is procedural (GLSL noise, no textures, no models), so the whole
 * thing costs one shader and a handful of spheres. Clicks are raycast against
 * the real meshes, so what you click is what you get.
 */
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, MeshBasicMaterial, Color, Vector2, Vector3, MathUtils,
  SphereGeometry, RingGeometry, ShaderMaterial, BufferGeometry, Float32BufferAttribute,
  LineLoop, LineBasicMaterial, Points, PointsMaterial, AdditiveBlending, DoubleSide, Raycaster,
  SRGBColorSpace, ACESFilmicToneMapping,
} from 'three';
import type { Visual, Moon, Body } from '../../data/space';
import { FACTS, EARTH_DIAMETER_KM } from '../../data/space';

/* ---------- shaders (Ashima simplex noise, MIT) ---------- */
const NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
float fbm(vec3 p){ float f=0.0, a=0.5; for(int i=0;i<5;i++){ f+=a*snoise(p); p*=2.02; a*=0.5; } return f; }`;

const PLANET_VERT = /* glsl */ `
varying vec3 vN; varying vec3 vP;
void main(){ vN = normalize(normalMatrix * normal); vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

const PLANET_FRAG = /* glsl */ `
precision highp float;
uniform float uTime; uniform int uType; uniform vec3 uA; uniform vec3 uB; uniform vec3 uC;
uniform float uBands; uniform float uScale; uniform float uTurb; uniform vec3 uLight; uniform vec3 uGlow;
varying vec3 vN; varying vec3 vP;
${NOISE}
void main(){
  vec3 p = normalize(vP); vec3 col; float n = fbm(p * uScale);
  vec3 N = normalize(vN); vec3 V = vec3(0.0, 0.0, 1.0);
  float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  bool star = uType == 0;
  if (star) {
    float t = uTime * 0.12;
    float g  = fbm(p * uScale + vec3(t, -t * 0.7, t * 0.3));
    float g2 = fbm(p * uScale * 2.6 - vec3(t * 0.5));
    col = mix(uB, uA, smoothstep(-0.45, 0.55, g));
    col = mix(col, uC, smoothstep(0.3, 0.8, g2) * 0.55);
    // Pushed well past 1.0 on purpose. A star is the brightest thing in the
    // frame and it used to be clamped to the same ceiling as Mars; with the
    // filmic curve on the tail of this shader, over-bright values roll off
    // into a hot white core instead of clipping to a flat orange disc.
    col *= 1.5;
    col += uGlow * pow(rim, 2.2) * 1.5;
  } else if (uType == 1) {
    float m = fbm(p * uScale * 1.7 + 3.1);
    col = mix(uB, uA, smoothstep(-0.5, 0.5, n));
    col = mix(col, uC, smoothstep(0.25, 0.7, m) * 0.5);
    float cr = smoothstep(0.03, 0.0, abs(snoise(p * uScale * 3.0 + 7.0)) - 0.015);
    col *= 1.0 - cr * 0.28 * uTurb;
  } else if (uType == 2 || uType == 4) {
    float warp = fbm(p * uScale + vec3(uTime * 0.02, 0.0, 0.0)) * uTurb * 0.22;
    float band = sin((p.y + warp) * uBands * 3.14159);
    col = mix(uA, uB, band * 0.5 + 0.5);
    float storm = fbm(p * uScale * 2.3 + vec3(0.0, 0.0, uTime * 0.03));
    col = mix(col, uC, smoothstep(0.3, 0.75, storm) * 0.55);
    if (uType == 4) col = mix(col, uC, 0.12);
  } else {
    float land = smoothstep(0.02, 0.12, n);
    vec3 ground = mix(uB, uB * 0.7 + vec3(0.16, 0.11, 0.02), smoothstep(0.3, 0.6, fbm(p * uScale * 3.0 + 5.0)));
    col = mix(uA, ground, land);
    col = mix(col, uC, smoothstep(0.78, 0.9, abs(p.y)));
    float cl = fbm(p * uScale * 1.4 + vec3(uTime * 0.035, uTime * 0.008, 0.0));
    col = mix(col, vec3(1.0), smoothstep(0.15, 0.6, cl) * 0.85);
  }
  if (!star) {
    float diff = max(dot(N, normalize(uLight)), 0.0);
    col = col * (0.14 + diff * 0.98) + uGlow * rim * 0.35 * (0.3 + diff);
  }
  gl_FragColor = vec4(col, 1.0);
  /**
   * The two chunks every built-in three material ends with, and which a
   * hand-written ShaderMaterial has to ask for.
   *
   * Without <colorspace_fragment> the shader's linear result was written
   * straight into an sRGB framebuffer with no conversion, so every planet
   * rendered darker and more contrasty than its own palette says: the colours
   * arrive here already linear, because three converts a hex through
   * ColorManagement on the way into the uniform. Without <tonemapping_fragment>
   * anything over 1.0 clips flat, which is the whole surface of the sun.
   * WebGLProgram injects toneMapping() and linearToOutputTexel() into the
   * fragment prefix for us, so these two lines are all it takes.
   */
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

const GLOW_VERT = /* glsl */ `varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const GLOW_FRAG = /* glsl */ `
precision highp float; uniform vec3 uGlow; uniform float uStrength; uniform float uFall; varying vec3 vN;
void main(){
  float f = pow(1.0 - max(dot(normalize(vN), vec3(0.0,0.0,1.0)), 0.0), uFall);
  gl_FragColor = vec4(uGlow, f * uStrength);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

const RING_VERT = /* glsl */ `varying vec2 vXY; void main(){ vXY = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const RING_FRAG = /* glsl */ `
precision highp float; uniform float uInner; uniform float uOuter; uniform vec3 uA; uniform vec3 uB; varying vec2 vXY;
${NOISE}
void main(){
  float r = length(vXY); float t = (r - uInner) / (uOuter - uInner);
  float bands = fbm(vec3(t * 22.0, 1.3, 2.7)) * 0.5 + 0.5;
  float a = smoothstep(0.0, 0.04, t) * smoothstep(1.0, 0.92, t) * (0.45 + 0.55 * bands);
  a *= 1.0 - smoothstep(0.60, 0.63, t) * smoothstep(0.69, 0.66, t) * 0.85;
  gl_FragColor = vec4(mix(uA, uB, bands), a * 0.92);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

const TYPE = { sun: 0, rocky: 1, gas: 2, earth: 3, ice: 4 } as const;
/**
 * Where the light comes from for a body shown on its own, in WORLD space.
 *
 * This used to be the value of `uLight` for every body at every level, and
 * `vN` is a view-space normal, so it was a light welded to the camera: orbit
 * the planet and the terminator came with you, and in the system view all
 * eight planets were lit from the upper left at once, including the ones on
 * the far side of the sun. A solar system whose sun lights nothing is the
 * first thing anyone notices. `setLight` now writes a per-body direction each
 * frame, taken from the real sun in the system view and from this constant
 * when a body is alone in frame.
 */
const BODY_LIGHT = new Vector3(-0.55, 0.45, 0.75).normalize();

function planetMaterial(v: Visual) {
  return new ShaderMaterial({
    vertexShader: PLANET_VERT, fragmentShader: PLANET_FRAG,
    uniforms: {
      uTime: { value: 0 }, uType: { value: TYPE[v.type] },
      uA: { value: new Color(v.colors[0]) }, uB: { value: new Color(v.colors[1]) }, uC: { value: new Color(v.colors[2]) },
      uBands: { value: v.bands }, uScale: { value: v.scale }, uTurb: { value: v.turb },
      uLight: { value: BODY_LIGHT.clone() }, uGlow: { value: new Color(v.glow) },
    },
  });
}
/** The rim shell used for atmospheres and the sun's corona. */
function glowMaterial(color: Color | string, strength: number, fall = 3.5) {
  return new ShaderMaterial({
    vertexShader: GLOW_VERT, fragmentShader: GLOW_FRAG, transparent: true, depthWrite: false, blending: AdditiveBlending,
    uniforms: { uGlow: { value: new Color(color) }, uStrength: { value: strength }, uFall: { value: fall } },
  });
}

export type Level = 'system' | 'body' | 'moon';
export type Pick =
  | { kind: 'body'; id: string }
  | { kind: 'moon'; index: number }
  | { kind: 'self' };

export type CosmosHandle = {
  /** Park a true-to-scale Earth beside the focused body. */
  compareEarth(on: boolean): void;
  showSystem(): void;
  focusBody(id: string): void;
  focusMoon(index: number): void;
  /** Frame a sub-topic: rings edge-on, a close push-in, or a moon. */
  frame(focus: 'body' | 'ring' | 'close' | 'moon', moonIndex?: number): void;
  level(): Level;
  destroy(): void;
};

type Handlers = { onPick(p: Pick): void; onLevel(l: Level): void };

export function mountCosmos(
  host: HTMLElement,
  labelsEl: HTMLElement,
  all: Body[],
  startId: string,
  handlers: Handlers,
): CosmosHandle {
  const canvas = host.querySelector('canvas')!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  // The same filmic curve the world stages use, so a planet looks like it
  // belongs to the same site as a mango tree. The shaders opt in at their tail.
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  const scene = new Scene();
  const camera = new PerspectiveCamera(38, 1, 0.05, 400);
  const ray = new Raycaster();
  const ndc = new Vector2();

  /* ---------- starfield: the thing that makes it feel vast ---------- */
  /**
   * Two layers, and every star its own colour.
   *
   * One layer of 1800 identical white dots at one size and one opacity is a
   * texture, not a sky: real stars span an enormous brightness range and a
   * narrow but visible colour range, and it is the handful of bright ones
   * that make the rest read as distance. PointsMaterial has no per-point
   * size, so the bright few are a second, sparser draw; brightness within
   * each layer comes from vertex colours, which cost nothing.
   */
  const stars = new Group(); scene.add(stars);
  const COOL = new Color('#bcd2ff'), WARM = new Color('#ffd7b0'), tint = new Color();
  function starLayer(n: number, size: number, opacity: number, minBright: number) {
    const geo = new BufferGeometry();
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = 90 + Math.random() * 120, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th); pos[i * 3 + 1] = r * Math.cos(ph); pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
      // most stars are faint; a few are not, which is what the curve does
      const b = minBright + (1 - minBright) * Math.pow(Math.random(), 2.2);
      tint.copy(COOL).lerp(WARM, Math.random()).multiplyScalar(b);
      col[i * 3] = tint.r; col[i * 3 + 1] = tint.g; col[i * 3 + 2] = tint.b;
    }
    geo.setAttribute('position', new Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new Float32BufferAttribute(col, 3));
    stars.add(new Points(geo, new PointsMaterial({ size, sizeAttenuation: true, transparent: true, opacity, vertexColors: true, depthWrite: false })));
  }
  starLayer(1700, 0.5, 0.8, 0.25);   // the field
  starLayer(90, 1.15, 0.95, 0.75);   // the bright few

  const user = new Group(); scene.add(user);              // drag-orbit
  const systemG = new Group(); user.add(systemG);         // level: system
  const bodyG = new Group(); user.add(bodyG);             // level: body / moon

  /* ---------- asteroid belt: the real gap between Mars and Jupiter ---------- */
  const beltGeo = new BufferGeometry();
  {
    const N = 900, pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const r = 10.2 + Math.random() * 3.4, a = Math.random() * Math.PI * 2;
      pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = (Math.random() - 0.5) * 0.5; pos[i * 3 + 2] = Math.sin(a) * r;
    }
    beltGeo.setAttribute('position', new Float32BufferAttribute(pos, 3));
  }
  const belt = new Points(beltGeo, new PointsMaterial({ color: 0xa89a86, size: 0.11, sizeAttenuation: true, transparent: true, opacity: 0.75 }));
  systemG.add(belt);

  /* ---------- a comet on a stretched orbit, tail always pointing away from the sun ---------- */
  const comet = new Group(); systemG.add(comet);
  const cometHead = new Mesh(new SphereGeometry(0.16, 12, 12), new MeshBasicMaterial({ color: 0xdfefff }));
  comet.add(cometHead);
  const tailGeo = new BufferGeometry();
  {
    // A tail thins and fades as it goes: the old one was 26 evenly spaced dots
    // of one colour, which reads as a dotted line drawn beside the comet.
    const N = 44, pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
    const head = new Color('#dff0ff'), far = new Color('#5b7fd0');
    for (let i = 0; i < N; i++) {
      const k = i / (N - 1);
      pos[i * 3] = k * k * 9.5 + k * 1.2;                       // bunched near the head
      pos[i * 3 + 1] = (Math.random() - 0.5) * k * 0.9;          // and spreading behind it
      pos[i * 3 + 2] = (Math.random() - 0.5) * k * 0.9;
      const c = head.clone().lerp(far, k).multiplyScalar(1 - k * 0.85);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    tailGeo.setAttribute('position', new Float32BufferAttribute(pos, 3));
    tailGeo.setAttribute('color', new Float32BufferAttribute(col, 3));
  }
  const cometTail = new Points(tailGeo, new PointsMaterial({ size: 0.17, sizeAttenuation: true, transparent: true, opacity: 0.75, vertexColors: true, depthWrite: false }));
  comet.add(cometTail);

  /* ---------- system view ---------- */
  // Real order, log-compressed distance so Neptune is reachable and Mercury isn't inside the sun.
  const planets = all.filter((b) => b.au !== null && b.id !== 'sun').sort((a, b) => (a.au ?? 0) - (b.au ?? 0));
  const sunBody = all.find((b) => b.id === 'sun');
  type SysRef = { mesh: Mesh; id: string; r: number; a0: number; speed: number; label: HTMLElement };
  const sysRefs: SysRef[] = [];
  const sysGeo = new SphereGeometry(1, 32, 32);
  if (sunBody) {
    const sun = new Mesh(sysGeo, planetMaterial(sunBody.visual));
    sun.scale.setScalar(2.5); sun.userData = { kind: 'body', id: 'sun' };
    systemG.add(sun);
    /**
     * Two shells, not one. A single tight halo gave the sun a hard edge with a
     * thin ring round it, which reads as a painted disc. The inner shell is
     * the bright chromosphere hugging the surface; the outer one is a wide,
     * slow falloff standing in for the corona, and it is the thing that makes
     * a star look like it is pouring light into the space around it.
     */
    systemG.add(new Mesh(new SphereGeometry(3.4, 32, 32), glowMaterial(sunBody.visual.glow, 1.6, 3.2)));
    systemG.add(new Mesh(new SphereGeometry(7.0, 32, 32), glowMaterial('#ffd9a0', 0.38, 1.5)));
  }
  planets.forEach((b, i) => {
    const r = 4.5 + Math.log10((b.au ?? 0.4) + 1) * 11;
    const pts: number[] = [];
    for (let k = 0; k <= 128; k++) { const a = (k / 128) * Math.PI * 2; pts.push(Math.cos(a) * r, 0, Math.sin(a) * r); }
    const og = new BufferGeometry(); og.setAttribute('position', new Float32BufferAttribute(pts, 3));
    systemG.add(new LineLoop(og, new LineBasicMaterial({ color: 0x8695a8, transparent: true, opacity: 0.3 })));
    const m = new Mesh(sysGeo, planetMaterial(b.visual));
    // Sized for a camera that now stands back far enough to hold Pluto's
    // orbit, which is roughly twice as far out as the old hardcoded distance:
    // at the previous sizes every planet was a two-pixel speck out there.
    const size = b.id === 'jupiter' ? 1.5 : b.id === 'saturn' ? 1.35 : b.id === 'uranus' || b.id === 'neptune' ? 1.12 : b.id === 'earth' || b.id === 'venus' ? 0.8 : 0.68;
    m.scale.setScalar(size); m.userData = { kind: 'body', id: b.id };
    systemG.add(m);
    const label = document.createElement('button');
    label.type = 'button'; label.className = 'sky-label'; label.dataset.id = b.id;
    label.innerHTML = `<b>${b.bn}</b>`;
    labelsEl.appendChild(label);
    sysRefs.push({ mesh: m, id: b.id, r, a0: (i / planets.length) * Math.PI * 2 + i, speed: 0.06 / Math.sqrt(r / 4.5), label });
  });
  /** The outermost orbit, which is what the system view has to fit. */
  const maxOrbit = sysRefs.reduce((a, s) => Math.max(a, s.r), 4.5);

  /* ---------- body view ---------- */
  const tiltG = new Group(); bodyG.add(tiltG);
  const sphere = new SphereGeometry(1, 72, 72);
  let planet = new Mesh(sphere, planetMaterial(all[0].visual));
  planet.userData = { kind: 'self' };
  tiltG.add(planet);
  const glow = new Mesh(new SphereGeometry(1.1, 48, 48), glowMaterial('#ffffff', 0.9));
  bodyG.add(glow);
  const extras = new Group(); bodyG.add(extras);

  /* ---------- the size comparison: a true-to-scale Earth parked beside it ---------- */
  const cmpG = new Group(); cmpG.visible = false; bodyG.add(cmpG);
  const earthBody = all.find((b) => b.id === 'earth');
  const cmpEarth = new Mesh(new SphereGeometry(1, 40, 40), planetMaterial(earthBody?.visual ?? all[0].visual));
  cmpG.add(cmpEarth);
  const cmpLabel = document.createElement('div');
  cmpLabel.className = 'cmp-label'; cmpLabel.innerHTML = '<b>পৃথিবী</b>';
  labelsEl.appendChild(cmpLabel);
  let cmpOn = false;
  type MoonRef = { mesh: Mesh; period: number; r: number; a0: number; label: HTMLElement; tilt: number };
  let moonRefs: MoonRef[] = [];
  const moonGeo = new SphereGeometry(1, 28, 28);
  let curId = startId, maxR = 0, spin = 0, glowBase = 1.045;

  /**
   * Point a body's light at something real.
   *
   * `vN` is a view-space normal, so `uLight` has to be a view-space direction:
   * we take the direction in world space and push it through the camera's view
   * matrix every frame. That is the whole difference between a sun that lights
   * the system and a lamp bolted to the camera.
   */
  const lightTmp = new Vector3();
  function setLight(m: Mesh, worldDir: Vector3) {
    const mat = m.material as ShaderMaterial;
    if (!mat.uniforms?.uLight) return;
    lightTmp.copy(worldDir).transformDirection(camera.matrixWorldInverse);
    (mat.uniforms.uLight.value as Vector3).copy(lightTmp);
  }

  function layoutCompare(b: Body) {
    // Both drawn from real mean diameters: this body is radius 1, Earth scales against it.
    const d = FACTS[b.id]?.diameterKm ?? EARTH_DIAMETER_KM;
    const rel = EARTH_DIAMETER_KM / d;
    const r = Math.max(0.012, rel);          // keep Earth visible even beside the Sun
    cmpEarth.scale.setScalar(r);
    cmpEarth.position.set(1 + r + Math.max(0.35, r * 0.5), 0, 0);
  }

  function buildBody(b: Body) {
    extras.clear();
    for (const m of moonRefs) m.label.remove();
    moonRefs = [];
    planet.material.dispose(); planet.material = planetMaterial(b.visual);
    tiltG.rotation.z = MathUtils.degToRad(b.visual.tilt);
    spin = b.visual.spin;
    const gm = glow.material as ShaderMaterial;
    const isStar = b.visual.type === 'sun';
    gm.uniforms.uGlow.value.set(b.visual.glow);
    gm.uniforms.uStrength.value = isStar ? 1.5 : 0.45;
    // a star's light falls off slowly; a thin atmosphere hugs the limb
    gm.uniforms.uFall.value = isStar ? 2.0 : 3.5;
    glowBase = isStar ? 1.3 : 1.045;
    glow.scale.setScalar(glowBase);
    if (b.visual.ring) {
      const rg = new RingGeometry(b.visual.ring.inner, b.visual.ring.outer, 160, 1);
      const rm = new ShaderMaterial({
        vertexShader: RING_VERT, fragmentShader: RING_FRAG, transparent: true, side: DoubleSide, depthWrite: false,
        uniforms: { uInner: { value: b.visual.ring.inner }, uOuter: { value: b.visual.ring.outer }, uA: { value: new Color(b.visual.ring.colors[0]) }, uB: { value: new Color(b.visual.ring.colors[1]) } },
      });
      const ring = new Mesh(rg, rm); ring.rotation.x = Math.PI / 2;
      const rp = new Group(); rp.rotation.z = MathUtils.degToRad(b.visual.tilt); rp.add(ring); extras.add(rp);
    }
    layoutCompare(b);
    maxR = 0;
    b.moons.forEach((m: Moon, i: number) => {
      maxR = Math.max(maxR, m.r);
      const pivot = new Group(); pivot.rotation.x = MathUtils.degToRad(m.tilt); extras.add(pivot);
      const pts: number[] = [];
      for (let k = 0; k <= 96; k++) { const a = (k / 96) * Math.PI * 2; pts.push(Math.cos(a) * m.r, 0, Math.sin(a) * m.r); }
      const og = new BufferGeometry(); og.setAttribute('position', new Float32BufferAttribute(pts, 3));
      pivot.add(new LineLoop(og, new LineBasicMaterial({ color: 0x6b7987, transparent: true, opacity: 0.45 })));
      const c = new Color(m.color);
      const mesh = new Mesh(moonGeo, planetMaterial({
        type: 'rocky', colors: [m.color, '#' + c.clone().multiplyScalar(0.55).getHexString(), '#' + c.clone().lerp(new Color('#ffffff'), 0.3).getHexString()],
        bands: 0, scale: 5, turb: 1, tilt: 0, spin: 0, glow: m.color,
      }));
      mesh.scale.setScalar(m.size); mesh.userData = { kind: 'moon', index: i };
      pivot.add(mesh);
      const label = document.createElement('button');
      label.type = 'button'; label.className = 'moon-label'; label.dataset.moon = String(i);
      label.innerHTML = `<b>${m.bn}</b><span>${m.en}</span>`;
      labelsEl.appendChild(label);
      moonRefs.push({ mesh, period: m.period, r: m.r, a0: (i / Math.max(b.moons.length, 1)) * Math.PI * 2, label, tilt: m.tilt });
    });
  }

  /* ---------- camera state ---------- */
  let level: Level = 'system';
  let camDist = 30, camWant = 30, pitchWant = 0.25;
  let yaw = 0, pitch = 0.25, vx = 0, vy = 0, idle = 0;
  const camTarget = new Vector3(), camTargetWant = new Vector3();
  let followMoon = -1, popStart = performance.now();

  function setLevel(l: Level) { if (l !== level) { level = l; handlers.onLevel(l); } }

  function showSystem() {
    setLevel('system'); followMoon = -1;
    systemG.visible = true; bodyG.visible = false;
    /**
     * Fit the real outermost orbit, rather than a hardcoded 30.
     *
     * Neptune's ring sits at radius 21 and Pluto's at 22, and at distance 30
     * this camera only reaches about 13 across: the view called সৌরজগৎ was
     * showing the solar system out to Jupiter, with four orbit rings running
     * off the edge of the frame and their planets invisible unless you
     * happened to catch them swinging through the corner.
     */
    camDist = Math.min(camDist, 12); camWant = fitDistance(maxOrbit);
    camTargetWant.set(0, 0, 0); pitchWant = 0.35;
  }
  /** Distance at which the outermost orbit still fits on screen, from the real frustum. */
  function fitDistance(radius: number): number {
    const vHalf = Math.tan(MathUtils.degToRad(camera.fov / 2));
    const hHalf = vHalf * Math.min(camera.aspect, 2.2);
    const need = (radius * 1.22) / Math.max(hHalf, 0.2);
    return Math.max(3.4, need);
  }

  function focusBody(id: string) {
    const b = all.find((x) => x.id === id); if (!b) return;
    curId = id; buildBody(b); popStart = performance.now();
    setLevel('body'); followMoon = -1;
    systemG.visible = false; bodyG.visible = true;
    camDist = Math.max(camDist, 18); camWant = fitDistance(Math.max(maxR, 1.35));
    camTargetWant.set(0, 0, 0); pitchWant = 0.24;
  }
  function focusMoon(i: number) {
    if (!moonRefs[i]) return;
    setLevel('moon'); followMoon = i;
    camWant = Math.max(0.55, moonRefs[i].mesh.scale.x * 4.2); pitchWant = 0.12;
  }
  function frame(focus: 'body' | 'ring' | 'close' | 'moon', moonIndex = 0) {
    if (focus === 'moon') { focusMoon(moonIndex); return; }
    followMoon = -1; setLevel('body'); camTargetWant.set(0, 0, 0);
    if (focus === 'ring') { camWant = 3.4 + maxR * 0.3; pitchWant = 0.06; }
    else if (focus === 'close') { camWant = 2.1; pitchWant = 0.3; }
    else { camWant = fitDistance(Math.max(maxR, 1.35)); pitchWant = 0.24; }
  }

  /* ---------- input: drag to orbit, click to dive ---------- */
  let dragging = false, moved = 0, lx = 0, ly = 0;
  host.addEventListener('pointerdown', (e) => {
    dragging = true; moved = 0; lx = e.clientX; ly = e.clientY; vx = vy = 0;
    host.setPointerCapture(e.pointerId); host.classList.add('dragging');
  });
  host.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lx, dy = e.clientY - ly;
    moved += Math.abs(dx) + Math.abs(dy);
    vx = dx * 0.006; vy = dy * 0.006; lx = e.clientX; ly = e.clientY;
    yaw += vx; pitch = MathUtils.clamp(pitch + vy, -1.1, 1.1); pitchWant = pitch; idle = 0;
  });
  function endDrag(e: PointerEvent) {
    if (!dragging) return;
    dragging = false; host.classList.remove('dragging');
    if (moved < 6) pick(e.clientX, e.clientY);
  }
  host.addEventListener('pointerup', endDrag);
  host.addEventListener('pointercancel', () => { dragging = false; host.classList.remove('dragging'); });

  function pick(clientX: number, clientY: number) {
    const r = host.getBoundingClientRect();
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const targets = level === 'system' ? systemG.children : bodyG.children;
    const hits = ray.intersectObjects(targets, true);
    for (const h of hits) {
      const d = h.object.userData as { kind?: string; id?: string; index?: number };
      if (d?.kind === 'body' && d.id) { handlers.onPick({ kind: 'body', id: d.id }); return; }
      if (d?.kind === 'moon' && d.index !== undefined) { handlers.onPick({ kind: 'moon', index: d.index }); return; }
      if (d?.kind === 'self') { handlers.onPick({ kind: 'self' }); return; }
    }
  }
  // HTML labels are real buttons - clicking one is the same as clicking the object.
  labelsEl.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-id],[data-moon]');
    if (!b) return;
    if (b.dataset.id) handlers.onPick({ kind: 'body', id: b.dataset.id });
    else if (b.dataset.moon) handlers.onPick({ kind: 'moon', index: +b.dataset.moon });
  });

  /* ---------- loop ---------- */
  let w = 1, h = 1, visible = true, raf = 0, last = performance.now(), t = 0;
  function resize() {
    const r = host.getBoundingClientRect(); w = Math.max(1, r.width); h = Math.max(1, r.height);
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    // refit on resize, or a narrow window silently crops the outer orbits again
    if (level === 'system') camWant = fitDistance(maxOrbit);
    else if (level === 'body' && cmpOn) camWant = fitDistance(Math.max((cmpEarth.position.x + cmpEarth.scale.x + 1) / 2, 1.35));
    else if (level === 'body') camWant = fitDistance(Math.max(maxR, 1.35));
  }
  new ResizeObserver(resize).observe(host); resize();

  const tmp = new Vector3(), moonWorld = new Vector3(), sunWorld = new Vector3(), lightDir = new Vector3();
  const LABEL_PAD = 34; // keep the pill fully inside, not just its anchor point
  /**
   * Take a label off screen. The pointer-events half matters as much as the
   * opacity: these labels are real buttons, so a transparent one left at
   * `auto` goes on swallowing clicks aimed at the planet behind it.
   */
  function hideLabel(elm: HTMLElement) {
    elm.style.opacity = '0';
    elm.style.pointerEvents = 'none';
  }
  function project(v: Vector3, elm: HTMLElement, hide: boolean) {
    tmp.copy(v).project(camera);
    const px = ((tmp.x + 1) / 2) * w, py = ((1 - tmp.y) / 2) * h;
    const inside = px > LABEL_PAD && px < w - LABEL_PAD && py > LABEL_PAD && py < h - 12;
    const on = !hide && tmp.z < 1 && inside;
    elm.style.opacity = on ? '1' : '0';
    elm.style.pointerEvents = on ? 'auto' : 'none';
    elm.style.transform = `translate(${px}px, ${py}px)`;
  }

  function frameLoop(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
    if (!dragging) { yaw += vx; pitch = MathUtils.clamp(pitch + vy, -1.1, 1.1); vx *= 0.92; vy *= 0.92; idle += dt; }
    if (!reduced && !dragging && Math.abs(vx) < 0.002) yaw += dt * (level === 'system' ? 0.05 : 0.12);
    pitch += (pitchWant - pitch) * 0.05;
    user.rotation.set(pitch, yaw, 0);
    stars.rotation.y = t * 0.005;

    // system bodies on their orbits
    if (systemG.visible) {
      belt.rotation.y = t * 0.02;
      const ca = t * 0.16;
      const cx = Math.cos(ca) * 17, cz = Math.sin(ca) * 9;     // stretched, comet-ish orbit
      comet.position.set(cx, Math.sin(ca * 0.5) * 1.6, cz);
      comet.lookAt(0, 0, 0); comet.rotateY(Math.PI);            // tail points away from the sun
      systemG.getWorldPosition(sunWorld);          // the sun sits at this group's origin
      for (const s of sysRefs) {
        const a = s.a0 + (reduced ? 0 : t * s.speed);
        s.mesh.position.set(Math.cos(a) * s.r, 0, Math.sin(a) * s.r);
        s.mesh.rotation.y += dt * 0.2;
        s.mesh.getWorldPosition(moonWorld);
        // lit by the actual sun in the middle of the actual scene
        setLight(s.mesh, lightDir.subVectors(sunWorld, moonWorld).normalize());
        // the bands and storms only ever advanced on the focused body, so a
        // gas giant sat frozen for as long as you looked at the whole system
        (s.mesh.material as ShaderMaterial).uniforms.uTime.value = t;
        project(moonWorld, s.label, false);
      }
    } else {
      for (const s of sysRefs) hideLabel(s.label);
    }

    // focused body + moons
    if (bodyG.visible) {
      if (cmpOn) { cmpEarth.rotation.y += dt * 0.25; setLight(cmpEarth, BODY_LIGHT); cmpEarth.getWorldPosition(moonWorld); project(moonWorld, cmpLabel, false); }
      else hideLabel(cmpLabel);
      if (!reduced || dragging) planet.rotation.y += spin * dt * (idle > 4 ? 1 : 0.6);
      const pop = Math.min(1, (now - popStart) / 500); const sc = 1 - Math.pow(1 - pop, 3);
      planet.scale.setScalar(sc);
      glow.scale.setScalar(glowBase * sc);
      (planet.material as ShaderMaterial).uniforms.uTime.value = t;
      // A body alone in frame has no sun in the scene, so the direction is the
      // art-directed one - but still pushed through the view matrix, so the
      // terminator now stays put in space while the camera orbits around it.
      setLight(planet, BODY_LIGHT);
      moonRefs.forEach((m, i) => {
        const a = m.a0 + (reduced ? 0 : t * (Math.PI * 2) / m.period);
        m.mesh.position.set(Math.cos(a) * m.r, 0, Math.sin(a) * m.r);
        m.mesh.rotation.y = t * 0.3;
        setLight(m.mesh, BODY_LIGHT);   // a moon is lit from where its planet is
        m.mesh.getWorldPosition(moonWorld);
        if (followMoon === i) camTargetWant.copy(moonWorld);
        const behind = moonWorld.z < -0.2 && Math.hypot(moonWorld.x, moonWorld.y) < 1.0;
        project(moonWorld, m.label, behind || level === 'moon' && followMoon === i);
      });
    } else {
      for (const m of moonRefs) hideLabel(m.label);
      hideLabel(cmpLabel);
    }

    // eased camera - this is the "zoom"
    camDist += (camWant - camDist) * 0.07;
    camTarget.lerp(camTargetWant, 0.09);
    camera.position.set(
      camTarget.x,
      camTarget.y + camDist * 0.24,
      camTarget.z + camDist,
    );
    camera.lookAt(camTarget);
    renderer.render(scene, camera);
    raf = visible && !document.hidden ? requestAnimationFrame(frameLoop) : 0;
  }
  const start = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frameLoop); } };
  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) start(); });
  io.observe(host);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) start(); });

  focusBody(startId);
  camDist = camWant; // no zoom-from-space on first paint, just be there
  // Place the camera before the first frame runs. setLight reads
  // `camera.matrixWorldInverse`, and an unplaced camera leaves it as the
  // identity, which would light the opening frame from nowhere in particular.
  camera.position.set(camTarget.x, camTarget.y + camDist * 0.24, camTarget.z + camDist);
  camera.lookAt(camTarget);
  camera.updateMatrixWorld();
  start();

  return {
    /**
     * Park a true-to-scale Earth beside this body and frame the pair.
     *
     * The camera looks at the origin, which is the middle of the *focused*
     * body, while the pair straddles it: Earth sits out to the right and next
     * to Mars it is nearly twice the size, so the old hand-rolled distance
     * pulled back far enough in total but never moved the centre of interest,
     * and Earth's right half hung off the edge of the picture. Aim at the
     * midpoint of the two and fit their combined half-width.
     */
    compareEarth(on: boolean) {
      cmpOn = on; cmpG.visible = on;
      const b = all.find((x) => x.id === curId); if (b) layoutCompare(b);
      if (on) {
        const right = cmpEarth.position.x + cmpEarth.scale.x;
        camTargetWant.set((right - 1) / 2, 0, 0);
        camWant = fitDistance(Math.max((right + 1) / 2, 1.35));
      } else {
        camTargetWant.set(0, 0, 0);
        camWant = fitDistance(Math.max(maxR, 1.35));
      }
      start();
    },
    showSystem() { showSystem(); start(); },
    focusBody(id) { focusBody(id); start(); },
    focusMoon(i) { focusMoon(i); start(); },
    frame(f, i) { frame(f, i); start(); },
    level: () => level,
    destroy() { cancelAnimationFrame(raf); io.disconnect(); renderer.dispose(); },
  };
}
