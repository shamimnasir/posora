/**
 * Shared kit for Posora-authored teaching models.
 *
 * The first generation of these models was built from hundreds of separate
 * spheres, cones and flat cards. They loaded, but read as primitives: every
 * leaf the same flat polygon, every grain its own draw call, every surface one
 * uniform colour. This kit keeps the models deterministic and CC0 while giving
 * them the cues a child actually reads an object by:
 *
 * - leaf blades with a real outline (margin teeth, cordate bases, reniform
 *   lobes), a folded midrib, an arched tip and different upper/lower colours;
 * - tapered, curved branches and stems instead of straight cylinders;
 * - per-vertex shading (bark fissures, ripening gradients, browned edges);
 * - one merged mesh per material, so a plant is a handful of draw calls.
 */
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  BufferAttribute, BufferGeometry, CatmullRomCurve3, Color, Euler, Float32BufferAttribute, FrontSide, DoubleSide, Group,
  Matrix4, Mesh, MeshPhysicalMaterial, Quaternion, TubeGeometry, Vector3,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

class NodeFileReader {
  result = null; onloadend = null; onerror = null;
  async readAsArrayBuffer(blob) { try { this.result = await blob.arrayBuffer(); this.onloadend?.({ target: this }); } catch (error) { this.onerror?.(error); } }
  async readAsDataURL(blob) { try { const bytes = Buffer.from(await blob.arrayBuffer()); this.result = `data:${blob.type || 'application/octet-stream'};base64,${bytes.toString('base64')}`; this.onloadend?.({ target: this }); } catch (error) { this.onerror?.(error); } }
}
globalThis.FileReader ??= NodeFileReader;

export function seeded(seed) {
  let s = seed >>> 0;
  return (min = 0, max = 1) => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return min + (s / 0x100000000) * (max - min); };
}

/** Smooth 3D value noise in [-1, 1]; deterministic and dependency-free. */
export function noise3(x, y, z) {
  const hash = (i, j, k) => { let h = Math.imul(i, 374761393) ^ Math.imul(j, 668265263) ^ Math.imul(k, 2147483647); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 0xffffffff; };
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const f = (t) => t * t * (3 - 2 * t);
  const u = f(x - xi), v = f(y - yi), w = f(z - zi);
  const l = (a, b, t) => a + (b - a) * t;
  const c = (i, j, k) => hash(xi + i, yi + j, zi + k);
  return l(l(l(c(0, 0, 0), c(1, 0, 0), u), l(c(0, 1, 0), c(1, 1, 0), u), v), l(l(c(0, 0, 1), c(1, 0, 1), u), l(c(0, 1, 1), c(1, 1, 1), u), v), w) * 2 - 1;
}
export const fbm = (x, y, z, octaves = 3) => { let sum = 0, amp = 0.5, freq = 1; for (let i = 0; i < octaves; i += 1) { sum += amp * noise3(x * freq, y * freq, z * freq); amp *= 0.5; freq *= 2.03; } return sum; };

export const material = (name, { roughness = 0.8, clearcoat = 0, sheen = 0, transmission = 0, side = FrontSide, opacity = 1 } = {}) => {
  const value = new MeshPhysicalMaterial({ name, color: new Color('#ffffff'), vertexColors: true, roughness, metalness: 0, clearcoat, clearcoatRoughness: 0.6, sheen, side });
  if (transmission) value.transmission = transmission;
  if (opacity < 1) { value.transparent = true; value.opacity = opacity; }
  return value;
};
export { DoubleSide };

/**
 * Collects geometry per material and merges it on `build()`. Colours are
 * written per vertex (linear), so `paint` can shade fissures or gradients.
 */
export class Batch {
  constructor() { this.parts = new Map(); }
  /**
   * @param {string} key material key
   * @param {BufferGeometry} geometry
   * @param {Matrix4 | null} matrix
   * @param {string | Color | ((p: Vector3, i: number, geometry: BufferGeometry) => Color)} paint
   */
  add(key, geometry, matrix, paint) {
    let g = geometry.index ? geometry : geometry.setIndex([...Array(geometry.attributes.position.count).keys()]);
    for (const name of Object.keys(g.attributes)) if (name !== 'position' && name !== 'normal' && name !== 'color') g.deleteAttribute(name);
    if (!g.attributes.normal) g.computeVertexNormals();
    const position = g.attributes.position, colors = new Float32Array(position.count * 3);
    const fixed = typeof paint === 'function' ? null : new Color(paint);
    const p = new Vector3();
    for (let i = 0; i < position.count; i += 1) {
      p.fromBufferAttribute(position, i);
      const c = fixed ?? paint(p, i, g);
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }
    if (!g.attributes.color) g.setAttribute('color', new Float32BufferAttribute(colors, 3));
    else g.attributes.color.array.set(colors);
    if (matrix) g.applyMatrix4(matrix);
    if (!this.parts.has(key)) this.parts.set(key, []);
    this.parts.get(key).push(g);
    return g;
  }
  /** Add geometry that already carries a colour attribute. */
  addColored(key, geometry, matrix) {
    let g = geometry.index ? geometry : geometry.setIndex([...Array(geometry.attributes.position.count).keys()]);
    for (const name of Object.keys(g.attributes)) if (name !== 'position' && name !== 'normal' && name !== 'color') g.deleteAttribute(name);
    if (matrix) g.applyMatrix4(matrix);
    if (!this.parts.has(key)) this.parts.set(key, []);
    this.parts.get(key).push(g);
    return g;
  }
  build(name, materials) {
    const root = new Group(); root.name = name;
    for (const [key, list] of this.parts) {
      const merged = mergeGeometries(list, false);
      if (!merged) throw new Error(`Could not merge ${key}`);
      // Quantised colour: a quarter of the bytes and visually identical.
      const color = merged.attributes.color, packed = new Uint8Array(color.count * 3);
      for (let i = 0; i < color.count * 3; i += 1) packed[i] = Math.round(Math.min(1, Math.max(0, color.array[i])) * 255);
      merged.setAttribute('color', new BufferAttribute(packed, 3, true));
      const mesh = new Mesh(merged, materials[key]); mesh.name = key; root.add(mesh);
    }
    return root;
  }
}
/** Colour from hex; three.js stores it linear, which is what glTF expects. */
export const col = (hex) => new Color(hex);
export const mix = (a, b, t) => a.clone().lerp(b, Math.min(1, Math.max(0, t)));

export const compose = (position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1], order = 'XYZ') => {
  const q = new Quaternion().setFromEuler(new Euler(rotation[0], rotation[1], rotation[2], order));
  return new Matrix4().compose(new Vector3(...position), q, new Vector3(...(Array.isArray(scale) ? scale : [scale, scale, scale])));
};
/** Matrix placing local +Y along `dir` at `origin`, with a roll about it. */
export const alongY = (origin, dir, roll = 0, scale = 1) => {
  const q = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), dir.clone().normalize());
  q.multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), roll));
  return new Matrix4().compose(origin.clone(), q, new Vector3(scale, scale, scale));
};

/**
 * A tapered tube through `points`. `radius(u)` gives the radius at 0..1.
 * `paint(u, angle, worldPoint)` returns a colour, so bark can be fissured.
 */
export function taperedTube(points, radius, { tubular = 16, radial = 8, paint, closeEnds = true } = {}) {
  const curve = new CatmullRomCurve3(points.map((p) => (p.isVector3 ? p : new Vector3(...p))));
  const tube = new TubeGeometry(curve, tubular, 1, radial, false);
  const pos = tube.attributes.position, centre = new Vector3(), v = new Vector3();
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i <= tubular; i += 1) {
    const u = i / tubular; curve.getPointAt(u, centre); const r = radius(u);
    for (let j = 0; j <= radial; j += 1) {
      const k = i * (radial + 1) + j;
      v.fromBufferAttribute(pos, k).sub(centre).multiplyScalar(r).add(centre);
      pos.setXYZ(k, v.x, v.y, v.z);
      const c = paint ? paint(u, j / radial, v) : new Color('#ffffff');
      colors[k * 3] = c.r; colors[k * 3 + 1] = c.g; colors[k * 3 + 2] = c.b;
    }
  }
  tube.deleteAttribute('uv');
  tube.setAttribute('color', new Float32BufferAttribute(colors, 3));
  tube.computeVertexNormals();
  if (!closeEnds) return { geometry: tube, curve };
  // Cap the tip with a small fan so cut branch ends are never see-through.
  const end = curve.getPointAt(1), ringStart = tubular * (radial + 1);
  const capPos = [], capCol = [], capIdx = [];
  const tipColor = paint ? paint(1, 0, end) : new Color('#ffffff');
  capPos.push(end.x, end.y, end.z); capCol.push(tipColor.r, tipColor.g, tipColor.b);
  for (let j = 0; j <= radial; j += 1) { v.fromBufferAttribute(pos, ringStart + j); capPos.push(v.x, v.y, v.z); capCol.push(colors[(ringStart + j) * 3], colors[(ringStart + j) * 3 + 1], colors[(ringStart + j) * 3 + 2]); }
  for (let j = 1; j <= radial; j += 1) capIdx.push(0, j, j + 1);
  const cap = new BufferGeometry(); cap.setAttribute('position', new Float32BufferAttribute(capPos, 3)); cap.setAttribute('color', new Float32BufferAttribute(capCol, 3)); cap.setIndex(capIdx); cap.computeVertexNormals();
  return { geometry: mergeGeometries([tube, cap], false), curve };
}

/**
 * A leaf blade in its own frame: base at the origin, midrib along +Z, upper
 * surface facing +Y. `halfWidth(u)` is the half width at 0..1 along the
 * midrib. Returns separate upper and lower surfaces so the two faces can be
 * coloured differently (sundari's silvery underside, for one).
 */
export function blade({ length = 1, halfWidth, segments = 14, across = 4, fold = 0.18, arch = 0.18, twist = 0, upper, lower, edge = null, rib = null, thickness = 0.004 }) {
  const build = (side) => {
    const positions = [], colors = [], index = [];
    for (let i = 0; i <= segments; i += 1) {
      const u = i / segments, w = Math.max(0, halfWidth(u)) * length, z = u * length;
      // the tip droops along a parabola and the blade twists slightly
      const droop = -arch * length * u * u, rot = twist * u;
      for (let j = -across; j <= across; j += 1) {
        const s = j / across, x0 = s * w;
        // V-fold about the midrib: the lamina rises toward its margins
        const y0 = Math.abs(s) * w * fold + droop + (side < 0 ? -thickness : 0);
        const x = x0 * Math.cos(rot) - y0 * Math.sin(rot), y = x0 * Math.sin(rot) + y0 * Math.cos(rot);
        positions.push(x, y, z);
        let c = side > 0 ? upper.clone() : lower.clone();
        if (rib && Math.abs(s) < 0.5 / across) c = mix(c, rib, 0.55 * (1 - u * 0.5));
        if (edge) c = mix(c, edge, Math.pow(Math.abs(s), 3) * 0.6 + Math.pow(u, 6) * 0.4);
        colors.push(c.r, c.g, c.b);
      }
    }
    const row = across * 2 + 1;
    for (let i = 0; i < segments; i += 1) for (let j = 0; j < row - 1; j += 1) {
      const a = i * row + j, b = a + row;
      if (side > 0) index.push(a, b, a + 1, a + 1, b, b + 1); else index.push(a, a + 1, b, a + 1, b + 1, b);
    }
    const g = new BufferGeometry(); g.setAttribute('position', new Float32BufferAttribute(positions, 3)); g.setAttribute('color', new Float32BufferAttribute(colors, 3)); g.setIndex(index); g.computeVertexNormals();
    return g;
  };
  return { upper: build(1), lower: build(-1) };
}

/**
 * A blade built in polar form around its petiole attachment, for reniform
 * (thankuni) and palmate/fan (tal) leaves. `radius(theta)` gives the margin
 * distance for theta in [-PI, PI], 0 pointing along +Z.
 */
export function polarBlade({ radius, rings = 6, spokes = 36, cup = 0.12, pleat = 0, pleats = 0, upper, lower, edge = null, thickness = 0.004, span = Math.PI }) {
  const build = (side) => {
    const positions = [], colors = [], index = [];
    for (let i = 0; i <= rings; i += 1) {
      const t = i / rings;
      for (let j = 0; j <= spokes; j += 1) {
        const theta = -span + (2 * span * j) / spokes, r = radius(theta) * t;
        const x = Math.sin(theta) * r, z = Math.cos(theta) * r;
        const folds = pleats ? Math.cos(theta * pleats) * pleat * t : 0;
        const y = cup * t * t + folds + (side < 0 ? -thickness : 0);
        positions.push(x, y, z);
        let c = side > 0 ? upper.clone() : lower.clone();
        if (edge) c = mix(c, edge, Math.pow(t, 5) * 0.5);
        if (pleats) c = mix(c, side > 0 ? upper.clone().multiplyScalar(0.72) : lower, (Math.cos(theta * pleats) * 0.5 + 0.5) * 0.35 * t);
        colors.push(c.r, c.g, c.b);
      }
    }
    const row = spokes + 1;
    for (let i = 0; i < rings; i += 1) for (let j = 0; j < spokes; j += 1) {
      const a = i * row + j, b = a + row;
      if (side > 0) index.push(a, b, a + 1, a + 1, b, b + 1); else index.push(a, a + 1, b, a + 1, b + 1, b);
    }
    const g = new BufferGeometry(); g.setAttribute('position', new Float32BufferAttribute(positions, 3)); g.setAttribute('color', new Float32BufferAttribute(colors, 3)); g.setIndex(index); g.computeVertexNormals();
    return g;
  };
  return { upper: build(1), lower: build(-1) };
}

/** Displace a sphere/blob outward by fractal noise: mounds, buns, fruit. */
export function displace(geometry, amount, frequency, seed = 0) {
  const pos = geometry.attributes.position, v = new Vector3(), n = new Vector3();
  geometry.computeVertexNormals();
  const normal = geometry.attributes.normal;
  for (let i = 0; i < pos.count; i += 1) {
    v.fromBufferAttribute(pos, i); n.fromBufferAttribute(normal, i);
    const d = fbm(v.x * frequency + seed, v.y * frequency, v.z * frequency - seed) * amount;
    pos.setXYZ(i, v.x + n.x * d, v.y + n.y * d, v.z + n.z * d);
  }
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Encode a flat group of meshes as a compact GLB: positions quantised to
 * int16 (KHR_mesh_quantization, dequantised by the node transform), normals
 * to int8, colours to bytes, every buffer meshopt-compressed. Posora's loader
 * registers the Meshopt decoder, so a 2 MB plant becomes a few hundred KB.
 */
export async function exportGlb(root) {
  const { MeshoptEncoder } = await import('meshoptimizer');
  await MeshoptEncoder.ready;
  const json = {
    asset: { version: '2.0', generator: 'Posora procedural kit' }, scene: 0, scenes: [{ name: root.name, nodes: [0] }],
    nodes: [{ name: root.name, children: [] }], meshes: [], materials: [], accessors: [], bufferViews: [],
    buffers: [{ byteLength: 0 }, { byteLength: 0, extensions: { EXT_meshopt_compression: { fallback: true } } }],
    extensionsUsed: ['EXT_meshopt_compression', 'KHR_mesh_quantization'], extensionsRequired: ['EXT_meshopt_compression', 'KHR_mesh_quantization'],
  };
  const chunks = []; let compressedLength = 0, rawLength = 0;
  const view = (bytes, count, stride, mode, target) => {
    const encoded = MeshoptEncoder.encodeGltfBuffer(bytes, count, stride, mode);
    const pad = (n) => (n + 3) & ~3;
    const bv = { buffer: 1, byteOffset: rawLength, byteLength: bytes.byteLength, target, extensions: { EXT_meshopt_compression: { buffer: 0, byteOffset: compressedLength, byteLength: encoded.byteLength, byteStride: stride, count, mode } } };
    if (mode === 'ATTRIBUTES') bv.byteStride = stride;
    chunks.push(encoded, new Uint8Array(pad(encoded.byteLength) - encoded.byteLength));
    compressedLength += pad(encoded.byteLength); rawLength += pad(bytes.byteLength);
    json.bufferViews.push(bv); return json.bufferViews.length - 1;
  };
  const materialIndex = new Map();
  for (const mesh of root.children) {
    if (!mesh.isMesh) continue;
    const m = mesh.material;
    if (!materialIndex.has(m)) {
      const def = { name: m.name, pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, m.opacity ?? 1], metallicFactor: 0, roughnessFactor: m.roughness } };
      if (m.side === DoubleSide) def.doubleSided = true;
      if (m.transparent) def.alphaMode = 'BLEND';
      if (m.clearcoat > 0) {
        def.extensions = { KHR_materials_clearcoat: { clearcoatFactor: m.clearcoat, clearcoatRoughnessFactor: m.clearcoatRoughness } };
        if (!json.extensionsUsed.includes('KHR_materials_clearcoat')) json.extensionsUsed.push('KHR_materials_clearcoat');
      }
      json.materials.push(def); materialIndex.set(m, json.materials.length - 1);
    }
    const g = mesh.geometry, pos = g.attributes.position, nor = g.attributes.normal, colr = g.attributes.color;
    const indices = new Uint32Array(g.index.array);
    const [remap, unique] = MeshoptEncoder.reorderMesh(indices, true, true);
    const count = unique;
    g.computeBoundingBox();
    const box = g.boundingBox, centre = new Vector3(), size = new Vector3(); box.getCenter(centre); box.getSize(size);
    const scale = Math.max(size.x, size.y, size.z, 1e-6) / 2 / 32767;
    const qp = new Int16Array(count * 4), qn = new Int8Array(count * 4), qc = new Uint8Array(count * 4);
    const qmin = [32767, 32767, 32767], qmax = [-32767, -32767, -32767];
    for (let i = 0; i < pos.count; i += 1) {
      const k = remap[i]; if (k === 0xffffffff) continue;
      const q = [Math.round((pos.getX(i) - centre.x) / scale), Math.round((pos.getY(i) - centre.y) / scale), Math.round((pos.getZ(i) - centre.z) / scale)];
      for (let a = 0; a < 3; a += 1) { qp[k * 4 + a] = q[a]; qmin[a] = Math.min(qmin[a], q[a]); qmax[a] = Math.max(qmax[a], q[a]); }
      const nx = nor.getX(i), ny = nor.getY(i), nz = nor.getZ(i), len = Math.hypot(nx, ny, nz) || 1;
      qn[k * 4] = Math.round((nx / len) * 127); qn[k * 4 + 1] = Math.round((ny / len) * 127); qn[k * 4 + 2] = Math.round((nz / len) * 127);
      const toByte = (v) => (colr.normalized && colr.array instanceof Uint8Array ? v * 255 : Math.min(1, Math.max(0, v)) * 255);
      qc[k * 4] = Math.round(toByte(colr.getX(i))); qc[k * 4 + 1] = Math.round(toByte(colr.getY(i))); qc[k * 4 + 2] = Math.round(toByte(colr.getZ(i))); qc[k * 4 + 3] = 255;
    }
    const wide = count > 65535, idx = wide ? indices : Uint16Array.from(indices);
    const attributes = {};
    json.accessors.push({ bufferView: view(new Uint8Array(qp.buffer), count, 8, 'ATTRIBUTES', 34962), componentType: 5122, count, type: 'VEC3', min: qmin, max: qmax });
    attributes.POSITION = json.accessors.length - 1;
    json.accessors.push({ bufferView: view(new Uint8Array(qn.buffer), count, 4, 'ATTRIBUTES', 34962), componentType: 5120, normalized: true, count, type: 'VEC3' });
    attributes.NORMAL = json.accessors.length - 1;
    json.accessors.push({ bufferView: view(qc, count, 4, 'ATTRIBUTES', 34962), componentType: 5121, normalized: true, count, type: 'VEC3' });
    attributes.COLOR_0 = json.accessors.length - 1;
    json.accessors.push({ bufferView: view(new Uint8Array(idx.buffer, idx.byteOffset, idx.byteLength), idx.length, wide ? 4 : 2, 'TRIANGLES', 34963), componentType: wide ? 5125 : 5123, count: idx.length, type: 'SCALAR' });
    json.meshes.push({ name: mesh.name, primitives: [{ attributes, indices: json.accessors.length - 1, material: materialIndex.get(m), mode: 4 }] });
    json.nodes.push({ name: mesh.name, mesh: json.meshes.length - 1, translation: [centre.x, centre.y, centre.z], scale: [scale, scale, scale] });
    json.nodes[0].children.push(json.nodes.length - 1);
  }
  json.buffers[0].byteLength = compressedLength; json.buffers[1].byteLength = rawLength;
  const bin = Buffer.concat(chunks.map((c) => Buffer.from(c.buffer, c.byteOffset, c.byteLength)));
  let text = Buffer.from(JSON.stringify(json));
  text = Buffer.concat([text, Buffer.alloc(((text.length + 3) & ~3) - text.length, 0x20)]);
  const header = Buffer.alloc(12), jsonHeader = Buffer.alloc(8), binHeader = Buffer.alloc(8);
  header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4); header.writeUInt32LE(12 + 8 + text.length + 8 + bin.length, 8);
  jsonHeader.writeUInt32LE(text.length, 0); jsonHeader.writeUInt32LE(0x4e4f534a, 4);
  binHeader.writeUInt32LE(bin.length, 0); binHeader.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, jsonHeader, text, binHeader, bin]);
}

export const countTriangles = (root) => { let n = 0; root.traverse((node) => { if (node.isMesh) n += (node.geometry.index?.count ?? node.geometry.attributes.position.count) / 3; }); return Math.round(n); };

/** Write a GLB with a manifest, license record and README beside it. */
export async function writeAsset({ directory, filename, scene, manifest, license, readme }) {
  const out = path.resolve('public/models', directory);
  await mkdir(out, { recursive: true });
  const bytes = await exportGlb(scene);
  await writeFile(path.join(out, filename), bytes);
  const full = { ...manifest, localMainFile: filename, format: 'glTF 2.0 GLB', triangles: countTriangles(scene), files: [{ path: filename, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') }] };
  await writeFile(path.join(out, 'asset-manifest.json'), `${JSON.stringify(full, null, 2)}\n`);
  await writeFile(path.join(out, 'SOURCE-LICENSE.md'), license);
  await writeFile(path.join(out, 'README.md'), readme);
  console.log(`${directory}/${filename}: ${(bytes.length / 1024).toFixed(0)} KiB, ${full.triangles} triangles`);
  return bytes.length;
}
