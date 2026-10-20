import { readFile, writeFile } from 'node:fs/promises';
import { MeshoptSimplifier } from 'meshoptimizer';

const [inputPath, outputPath, triangleCountArg = '120000'] = process.argv.slice(2);
if (!inputPath || !outputPath) {
  throw new Error('Usage: node scripts/convert-binary-stl-to-glb.mjs input.stl output.glb [target-triangles]');
}
const targetTriangles = Number(triangleCountArg);
if (!Number.isInteger(targetTriangles) || targetTriangles < 1000) throw new Error('target-triangles must be an integer >= 1000');

const source = await readFile(inputPath);
if (source.length < 84) throw new Error('Input is too short to be binary STL');
const triangleCount = source.readUInt32LE(80);
if (84 + triangleCount * 50 !== source.length) throw new Error('Input is not a complete binary STL file');

const sourcePositions = new Float32Array(triangleCount * 9);
const view = new DataView(source.buffer, source.byteOffset, source.byteLength);
const min = [Infinity, Infinity, Infinity];
const max = [-Infinity, -Infinity, -Infinity];
let cursor = 84;
for (let triangle = 0; triangle < triangleCount; triangle += 1) {
  // Binary STL records have a 12-byte normal, 36 bytes of positions and a 2-byte attribute word.
  for (let corner = 0; corner < 3; corner += 1) {
    for (let axis = 0; axis < 3; axis += 1) {
      const value = view.getFloat32(cursor + 12 + (corner * 3 + axis) * 4, true);
      sourcePositions[triangle * 9 + corner * 3 + axis] = value;
      min[axis] = Math.min(min[axis], value);
      max[axis] = Math.max(max[axis], value);
    }
  }
  cursor += 50;
}

const dimensions = max.map((value, axis) => value - min[axis]);
const longest = Math.max(...dimensions);
if (!Number.isFinite(longest) || longest <= 0) throw new Error('STL has invalid bounds');
const scale = 1.7 / longest;
for (let vertex = 0; vertex < sourcePositions.length / 3; vertex += 1) {
  for (let axis = 0; axis < 3; axis += 1) {
    sourcePositions[vertex * 3 + axis] = (sourcePositions[vertex * 3 + axis] - (min[axis] + max[axis]) * 0.5) * scale;
  }
}

await MeshoptSimplifier.ready;
const pointCount = sourcePositions.length / 3;
const positionsRemap = MeshoptSimplifier.generatePositionRemap(sourcePositions, 3);
const indices = new Uint32Array(pointCount);
for (let index = 0; index < pointCount; index += 1) indices[index] = positionsRemap[index];
const requestedIndices = Math.min(indices.length, targetTriangles * 3);
const [simplifiedIndices, simplificationError] = MeshoptSimplifier.simplifySloppy(
  indices,
  sourcePositions,
  3,
  null,
  requestedIndices,
  0.01,
);
const [compactRemap, uniqueCount] = MeshoptSimplifier.compactMesh(simplifiedIndices);

const positions = new Float32Array(uniqueCount * 3);
const assigned = new Uint8Array(uniqueCount);
for (let oldVertex = 0; oldVertex < pointCount; oldVertex += 1) {
  const weldedVertex = positionsRemap[oldVertex];
  const newVertex = compactRemap[weldedVertex];
  if (newVertex >= uniqueCount || assigned[newVertex]) continue;
  positions.set(sourcePositions.subarray(oldVertex * 3, oldVertex * 3 + 3), newVertex * 3);
  assigned[newVertex] = 1;
}

const normals = new Float32Array(uniqueCount * 3);
for (let index = 0; index < simplifiedIndices.length; index += 3) {
  const a = simplifiedIndices[index] * 3;
  const b = simplifiedIndices[index + 1] * 3;
  const c = simplifiedIndices[index + 2] * 3;
  const abx = positions[b] - positions[a], aby = positions[b + 1] - positions[a + 1], abz = positions[b + 2] - positions[a + 2];
  const acx = positions[c] - positions[a], acy = positions[c + 1] - positions[a + 1], acz = positions[c + 2] - positions[a + 2];
  const nx = aby * acz - abz * acy, ny = abz * acx - abx * acz, nz = abx * acy - aby * acx;
  for (const vertex of [a, b, c]) {
    normals[vertex] += nx;
    normals[vertex + 1] += ny;
    normals[vertex + 2] += nz;
  }
}
for (let index = 0; index < normals.length; index += 3) {
  const length = Math.hypot(normals[index], normals[index + 1], normals[index + 2]) || 1;
  normals[index] /= length;
  normals[index + 1] /= length;
  normals[index + 2] /= length;
}

const positionsMin = [Infinity, Infinity, Infinity], positionsMax = [-Infinity, -Infinity, -Infinity];
for (let index = 0; index < positions.length; index += 3) for (let axis = 0; axis < 3; axis += 1) {
  positionsMin[axis] = Math.min(positionsMin[axis], positions[index + axis]);
  positionsMax[axis] = Math.max(positionsMax[axis], positions[index + axis]);
}
const maxIndex = uniqueCount - 1;
const indexArray = maxIndex <= 65535 ? new Uint16Array(simplifiedIndices) : simplifiedIndices;
const indexComponentType = indexArray instanceof Uint16Array ? 5123 : 5125;
const indexMax = maxIndex;
const align4 = (number) => (number + 3) & ~3;
const positionBytes = Buffer.from(positions.buffer, positions.byteOffset, positions.byteLength);
const normalBytes = Buffer.from(normals.buffer, normals.byteOffset, normals.byteLength);
const indexBytes = Buffer.from(indexArray.buffer, indexArray.byteOffset, indexArray.byteLength);
const positionOffset = 0;
const normalOffset = align4(positionBytes.length);
const indexOffset = align4(normalOffset + normalBytes.length);
const binaryLength = align4(indexOffset + indexBytes.length);
const binary = Buffer.alloc(binaryLength);
positionBytes.copy(binary, positionOffset);
normalBytes.copy(binary, normalOffset);
indexBytes.copy(binary, indexOffset);

const gltf = {
  asset: { version: '2.0', generator: 'Posora binary STL converter; Meshoptimizer simplification' },
  scene: 0,
  scenes: [{ nodes: [0] }],
  nodes: [{ mesh: 0, name: 'Ganges river dolphin skeleton museum scan' }],
  meshes: [{ name: 'Ganges river dolphin skeleton', primitives: [{ attributes: { POSITION: 0, NORMAL: 1 }, indices: 2, material: 0, mode: 4 }] }],
  materials: [{ name: 'Museum bone scan', pbrMetallicRoughness: { baseColorFactor: [0.88, 0.83, 0.72, 1], metallicFactor: 0, roughnessFactor: 0.88 }, doubleSided: true }],
  buffers: [{ byteLength: binary.length }],
  bufferViews: [
    { buffer: 0, byteOffset: positionOffset, byteLength: positionBytes.length, target: 34962 },
    { buffer: 0, byteOffset: normalOffset, byteLength: normalBytes.length, target: 34962 },
    { buffer: 0, byteOffset: indexOffset, byteLength: indexBytes.length, target: 34963 },
  ],
  accessors: [
    { bufferView: 0, componentType: 5126, count: uniqueCount, type: 'VEC3', min: positionsMin, max: positionsMax },
    { bufferView: 1, componentType: 5126, count: uniqueCount, type: 'VEC3' },
    { bufferView: 2, componentType: indexComponentType, count: indexArray.length, type: 'SCALAR', min: [0], max: [indexMax] },
  ],
};
const json = Buffer.from(JSON.stringify(gltf));
const jsonLength = align4(json.length);
const totalLength = 12 + 8 + jsonLength + 8 + binary.length;
const glb = Buffer.alloc(totalLength);
glb.writeUInt32LE(0x46546c67, 0);
glb.writeUInt32LE(2, 4);
glb.writeUInt32LE(totalLength, 8);
glb.writeUInt32LE(jsonLength, 12);
glb.writeUInt32LE(0x4e4f534a, 16);
json.copy(glb, 20);
glb.fill(0x20, 20 + json.length, 20 + jsonLength);
const binaryHeader = 20 + jsonLength;
glb.writeUInt32LE(binary.length, binaryHeader);
glb.writeUInt32LE(0x004e4942, binaryHeader + 4);
binary.copy(glb, binaryHeader + 8);
await writeFile(outputPath, glb);

console.log(JSON.stringify({
  sourceTriangles: triangleCount,
  outputTriangles: simplifiedIndices.length / 3,
  outputVertices: uniqueCount,
  simplificationError,
  sourceDimensions: dimensions,
  normalizedLongestDimension: 1.7,
  outputBytes: glb.length,
}, null, 2));
