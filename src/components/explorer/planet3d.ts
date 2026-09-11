/**
 * Procedural planet renderer. No textures - every world is drawn by a small
 * GLSL shader from a handful of parameters, so the page ships zero image bytes.
 */
import {
  WebGLRenderer, Scene, PerspectiveCamera, SphereGeometry, RingGeometry, ShaderMaterial, Mesh, Color,
  Vector3, Group, BufferGeometry, LineLoop, LineBasicMaterial, Float32BufferAttribute, AdditiveBlending,
  DoubleSide, MathUtils,
} from 'three';
import type { Visual, Moon } from '../../data/space';

/* Ashima/Stefan Gustavson 3D simplex noise (MIT). */
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
float fbm(vec3 p){ float f=0.0, a=0.5; for(int i=0;i<5;i++){ f+=a*snoise(p); p*=2.02; a*=0.5; } return f; }
`;

const PLANET_VERT = /* glsl */ `
varying vec3 vN; varying vec3 vP;
void main(){
  vN = normalize(normalMatrix * normal);
  vP = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const PLANET_FRAG = /* glsl */ `
precision highp float;
uniform float uTime; uniform int uType; uniform vec3 uA; uniform vec3 uB; uniform vec3 uC;
uniform float uBands; uniform float uScale; uniform float uTurb; uniform vec3 uLight; uniform vec3 uGlow;
varying vec3 vN; varying vec3 vP;
${NOISE}
void main(){
  vec3 p = normalize(vP);
  vec3 col;
  float n = fbm(p * uScale);
  vec3 N = normalize(vN);
  vec3 V = vec3(0.0, 0.0, 1.0);
  float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  if (uType == 0) { // sun - emissive, no lighting
    float t = uTime * 0.12;
    float g  = fbm(p * uScale + vec3(t, -t * 0.7, t * 0.3));
    float g2 = fbm(p * uScale * 2.6 - vec3(t * 0.5));
    col = mix(uB, uA, smoothstep(-0.45, 0.55, g));
    col = mix(col, uC, smoothstep(0.3, 0.8, g2) * 0.55);
    col += uGlow * pow(rim, 2.2) * 0.7;
    gl_FragColor = vec4(col, 1.0); return;
  }
  if (uType == 1) { // rocky, cratered
    float m = fbm(p * uScale * 1.7 + 3.1);
    col = mix(uB, uA, smoothstep(-0.5, 0.5, n));
    col = mix(col, uC, smoothstep(0.25, 0.7, m) * 0.5);
    float cr = smoothstep(0.03, 0.0, abs(snoise(p * uScale * 3.0 + 7.0)) - 0.015);
    col *= 1.0 - cr * 0.28 * uTurb;
  } else if (uType == 2 || uType == 4) { // gas / ice giant - bands + storms
    float warp = fbm(p * uScale + vec3(uTime * 0.02, 0.0, 0.0)) * uTurb * 0.22;
    float band = sin((p.y + warp) * uBands * 3.14159);
    col = mix(uA, uB, band * 0.5 + 0.5);
    float storm = fbm(p * uScale * 2.3 + vec3(0.0, 0.0, uTime * 0.03));
    col = mix(col, uC, smoothstep(0.3, 0.75, storm) * 0.55);
    if (uType == 4) col = mix(col, uC, 0.12);
  } else { // earth - oceans, land, ice caps, drifting clouds
    float land = smoothstep(0.02, 0.12, n);
    vec3 ground = mix(uB, uB * 0.7 + vec3(0.16, 0.11, 0.02), smoothstep(0.3, 0.6, fbm(p * uScale * 3.0 + 5.0)));
    col = mix(uA, ground, land);
    col = mix(col, uC, smoothstep(0.78, 0.9, abs(p.y)));
    float cl = fbm(p * uScale * 1.4 + vec3(uTime * 0.035, uTime * 0.008, 0.0));
    col = mix(col, vec3(1.0), smoothstep(0.15, 0.6, cl) * 0.85);
  }
  float diff = max(dot(N, normalize(uLight)), 0.0);
  col = col * (0.14 + diff * 0.98) + uGlow * rim * 0.35 * (0.3 + diff);
  gl_FragColor = vec4(col, 1.0);
}`;

const GLOW_VERT = /* glsl */ `varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const GLOW_FRAG = /* glsl */ `
precision highp float; uniform vec3 uGlow; uniform float uStrength; varying vec3 vN;
void main(){ float f = pow(1.0 - max(dot(normalize(vN), vec3(0.0,0.0,1.0)), 0.0), 3.5); gl_FragColor = vec4(uGlow, f * uStrength); }`;

const RING_VERT = /* glsl */ `varying vec2 vXY; void main(){ vXY = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const RING_FRAG = /* glsl */ `
precision highp float; uniform float uInner; uniform float uOuter; uniform vec3 uA; uniform vec3 uB; varying vec2 vXY;
${NOISE}
void main(){
  float r = length(vXY); float t = (r - uInner) / (uOuter - uInner);
  float bands = fbm(vec3(t * 22.0, 1.3, 2.7)) * 0.5 + 0.5;
  float a = smoothstep(0.0, 0.04, t) * smoothstep(1.0, 0.92, t) * (0.45 + 0.55 * bands);
  a *= 1.0 - smoothstep(0.60, 0.63, t) * smoothstep(0.69, 0.66, t) * 0.85; // Cassini division
  gl_FragColor = vec4(mix(uA, uB, bands), a * 0.92);
}`;

const TYPE = { sun: 0, rocky: 1, gas: 2, earth: 3, ice: 4 } as const;
const LIGHT = new Vector3(-0.55, 0.45, 0.75).normalize();

function planetMaterial(v: Visual) {
  return new ShaderMaterial({
    vertexShader: PLANET_VERT, fragmentShader: PLANET_FRAG,
    uniforms: {
      uTime: { value: 0 }, uType: { value: TYPE[v.type] },
      uA: { value: new Color(v.colors[0]) }, uB: { value: new Color(v.colors[1]) }, uC: { value: new Color(v.colors[2]) },
      uBands: { value: v.bands }, uScale: { value: v.scale }, uTurb: { value: v.turb },
      uLight: { value: LIGHT }, uGlow: { value: new Color(v.glow) },
    },
  });
}

export type PlanetHandle = { set(v: Visual, moons: Moon[]): void; destroy(): void };

export function mountPlanet(host: HTMLElement, labelsEl: HTMLElement, v: Visual, moons: Moon[]): PlanetHandle {
  const canvas = host.querySelector('canvas')!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  const scene = new Scene();
  const camera = new PerspectiveCamera(36, 1, 0.1, 100);
  let camDist = 5.4, camTarget = 5.4, maxR = 0;
  camera.position.set(0, 1.3, camDist); camera.lookAt(0, 0, 0);

  const user = new Group(); scene.add(user);          // user drag rotation
  const tiltG = new Group(); user.add(tiltG);         // axial tilt
  const sphere = new SphereGeometry(1, 72, 72);
  let planet = new Mesh(sphere, planetMaterial(v)); tiltG.add(planet);
  const glow = new Mesh(new SphereGeometry(1.1, 48, 48), new ShaderMaterial({
    vertexShader: GLOW_VERT, fragmentShader: GLOW_FRAG, transparent: true, depthWrite: false, blending: AdditiveBlending,
    uniforms: { uGlow: { value: new Color(v.glow) }, uStrength: { value: 0.9 } },
  })); user.add(glow);
  const extras = new Group(); user.add(extras);       // ring, moons, orbits
  type MoonRef = { mesh: Mesh; pivot: Group; period: number; label: HTMLElement; a0: number };
  let moonRefs: MoonRef[] = [];
  const moonGeo = new SphereGeometry(1, 28, 28);

  function build(v: Visual, moons: Moon[]) {
    extras.clear(); labelsEl.replaceChildren(); moonRefs = [];
    tiltG.rotation.z = MathUtils.degToRad(v.tilt);
    (glow.material as ShaderMaterial).uniforms.uGlow.value.set(v.glow);
    (glow.material as ShaderMaterial).uniforms.uStrength.value = v.type === 'sun' ? 1.6 : 0.9;
    glow.scale.setScalar(v.type === 'sun' ? 1.25 : 1.1);
    if (v.ring) {
      const rg = new RingGeometry(v.ring.inner, v.ring.outer, 160, 1);
      const rm = new ShaderMaterial({ vertexShader: RING_VERT, fragmentShader: RING_FRAG, transparent: true, side: DoubleSide, depthWrite: false,
        uniforms: { uInner: { value: v.ring.inner }, uOuter: { value: v.ring.outer }, uA: { value: new Color(v.ring.colors[0]) }, uB: { value: new Color(v.ring.colors[1]) } } });
      const ring = new Mesh(rg, rm); ring.rotation.x = Math.PI / 2; ring.rotation.y = 0;
      const rp = new Group(); rp.rotation.z = MathUtils.degToRad(v.tilt); rp.add(ring); extras.add(rp);
    }
    maxR = 0;
    moons.forEach((m, i) => {
      maxR = Math.max(maxR, m.r);
      const pivot = new Group(); pivot.rotation.x = MathUtils.degToRad(m.tilt); extras.add(pivot);
      // orbit line
      const pts: number[] = []; for (let k = 0; k <= 96; k++) { const a = (k / 96) * Math.PI * 2; pts.push(Math.cos(a) * m.r, 0, Math.sin(a) * m.r); }
      const og = new BufferGeometry(); og.setAttribute('position', new Float32BufferAttribute(pts, 3));
      pivot.add(new LineLoop(og, new LineBasicMaterial({ color: 0x6b7987, transparent: true, opacity: 0.45 })));
      const c = new Color(m.color);
      const mat = planetMaterial({ type: 'rocky', colors: [m.color, '#' + c.clone().multiplyScalar(0.55).getHexString(), '#' + c.clone().lerp(new Color('#ffffff'), 0.3).getHexString()], bands: 0, scale: 5, turb: 1, tilt: 0, spin: 0, glow: m.color });
      const mesh = new Mesh(moonGeo, mat); mesh.scale.setScalar(m.size); pivot.add(mesh);
      const label = document.createElement('div'); label.className = 'moon-label'; label.innerHTML = `<b>${m.bn}</b><span>${m.en}</span>`; labelsEl.appendChild(label);
      moonRefs.push({ mesh, pivot, period: m.period, label, a0: (i / Math.max(moons.length, 1)) * Math.PI * 2 });
    });
  }
  build(v, moons);

  // pointer drag with inertia
  let dragging = false, lx = 0, ly = 0, vx = 0, vy = 0, yaw = 0, pitch = 0, idle = 0;
  host.addEventListener('pointerdown', (e) => { dragging = true; lx = e.clientX; ly = e.clientY; vx = vy = 0; host.setPointerCapture(e.pointerId); host.classList.add('dragging'); });
  host.addEventListener('pointermove', (e) => { if (!dragging) return; vx = (e.clientX - lx) * 0.006; vy = (e.clientY - ly) * 0.006; lx = e.clientX; ly = e.clientY; yaw += vx; pitch = MathUtils.clamp(pitch + vy, -1.1, 1.1); idle = 0; });
  const up = () => { dragging = false; host.classList.remove('dragging'); };
  host.addEventListener('pointerup', up); host.addEventListener('pointercancel', up);

  let spin = v.spin, w = 0, h = 0, visible = true, raf = 0, last = performance.now(), t = 0, popStart = performance.now();
  function resize() { const r = host.getBoundingClientRect(); w = Math.max(1, r.width); h = Math.max(1, r.height); renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  new ResizeObserver(resize).observe(host); resize();

  const tmp = new Vector3();
  function frame(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
    if (!dragging) { yaw += vx; pitch = MathUtils.clamp(pitch + vy, -1.1, 1.1); vx *= 0.92; vy *= 0.92; idle += dt; }
    user.rotation.set(pitch, yaw, 0);
    if (!reduced || dragging) planet.rotation.y += spin * dt * (idle > 4 ? 1 : 0.6);
    camTarget = 5.2 + maxR * (w < 700 ? 0.22 : 0.5); // phones: keep the planet big, let moons roam off-canvas
    camDist += (camTarget - camDist) * 0.06; camera.position.set(0, camDist * 0.24, camDist); camera.lookAt(0, 0, 0);
    const pop = Math.min(1, (now - popStart) / 500); const s = 1 - Math.pow(1 - pop, 3); planet.scale.setScalar(s); glow.scale.setScalar((planet.material as ShaderMaterial).uniforms.uType.value === 0 ? 1.25 * s : 1.1 * s);
    (planet.material as ShaderMaterial).uniforms.uTime.value = t;
    for (const m of moonRefs) {
      const a = m.a0 + (reduced ? 0 : t * (Math.PI * 2) / m.period);
      const r = (m.pivot.children[0] as LineLoop).geometry.boundingSphere?.radius ?? 1;
      m.mesh.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      m.mesh.rotation.y = t * 0.3;
      m.mesh.getWorldPosition(tmp); const behind = tmp.z < 0 && tmp.length() < 1.05 * s ? true : (tmp.z < -0.2 && Math.hypot(tmp.x, tmp.y) < 1.0 * s);
      tmp.project(camera);
      m.label.style.transform = `translate(${((tmp.x + 1) / 2) * w}px, ${((1 - tmp.y) / 2) * h}px)`;
      m.label.style.opacity = behind ? '0' : '1';
    }
    renderer.render(scene, camera);
    raf = (visible && !document.hidden) ? requestAnimationFrame(frame) : 0;
  }
  for (const m of moonRefs) (m.pivot.children[0] as LineLoop).geometry.computeBoundingSphere();
  const start = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) start(); }); io.observe(host);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) start(); });
  start();

  return {
    set(nv, nm) {
      planet.material.dispose(); planet.material = planetMaterial(nv); spin = nv.spin; popStart = performance.now();
      build(nv, nm); for (const m of moonRefs) (m.pivot.children[0] as LineLoop).geometry.computeBoundingSphere();
      start();
    },
    destroy() { cancelAnimationFrame(raf); io.disconnect(); renderer.dispose(); },
  };
}
