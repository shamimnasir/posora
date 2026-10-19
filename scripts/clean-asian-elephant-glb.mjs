import { readFile, writeFile } from 'node:fs/promises';

// The downloaded Sketchfab scene embeds three unrelated Scots-pine rigs beside
// the elephant. Detach those exact named roots while retaining the original
// elephant geometry, textures, rig, and animation clips.
const file = new URL('../public/models/asian_elephant_01/asian-elephant.glb', import.meta.url);
const bytes = await readFile(file);
if (bytes.toString('ascii', 0, 4) !== 'glTF' || bytes.readUInt32LE(4) !== 2) {
  throw new Error('Expected a binary glTF 2.0 file');
}
const jsonLength = bytes.readUInt32LE(12);
const json = JSON.parse(bytes.toString('utf8', 20, 20 + jsonLength).trim());
const unwanted = new Set(json.nodes
  .map((node, index) => ({ node, index }))
  .filter(({ node }) => /^ScotsPineTypeA(?: \(\d+\))?$/.test(node.name ?? ''))
  .map(({ index }) => index));
if (unwanted.size !== 3) throw new Error(`Expected 3 unrelated pine roots; found ${unwanted.size}`);

for (const node of json.nodes) {
  if (node.children) node.children = node.children.filter((child) => !unwanted.has(child));
}
for (const index of unwanted) {
  const node = json.nodes[index];
  if (node.mesh !== undefined) {
    throw new Error(`Refusing to detach a pine root that unexpectedly contains a mesh at ${index} (${node.name})`);
  }
}
const remainingReachable = new Set();
const visit = (index) => {
  if (remainingReachable.has(index)) return;
  remainingReachable.add(index);
  for (const child of json.nodes[index]?.children ?? []) visit(child);
};
for (const index of json.scenes[json.scene ?? 0].nodes) visit(index);
if ([...unwanted].some((index) => remainingReachable.has(index))) {
  throw new Error('Unrelated pine content is still reachable from the active scene');
}

const jsonBytes = Buffer.from(JSON.stringify(json));
const paddedJsonLength = Math.ceil(jsonBytes.length / 4) * 4;
const paddedJson = Buffer.alloc(paddedJsonLength, 0x20);
jsonBytes.copy(paddedJson);
const binaryChunkOffset = 20 + jsonLength;
const binaryChunkLength = bytes.readUInt32LE(binaryChunkOffset);
const binaryChunkType = bytes.readUInt32LE(binaryChunkOffset + 4);
const binaryChunk = bytes.subarray(binaryChunkOffset + 8, binaryChunkOffset + 8 + binaryChunkLength);
const output = Buffer.alloc(12 + 8 + paddedJsonLength + 8 + binaryChunk.length);
output.write('glTF', 0, 4, 'ascii');
output.writeUInt32LE(2, 4);
output.writeUInt32LE(output.length, 8);
output.writeUInt32LE(paddedJsonLength, 12);
output.writeUInt32LE(0x4e4f534a, 16);
paddedJson.copy(output, 20);
const binOffset = 20 + paddedJsonLength;
output.writeUInt32LE(binaryChunkLength, binOffset);
output.writeUInt32LE(binaryChunkType, binOffset + 4);
binaryChunk.copy(output, binOffset + 8);
await writeFile(file, output);
console.log(`Detached ${unwanted.size} unrelated pine rigs; preserved ${json.meshes.length} original mesh records and ${json.animations?.length ?? 0} clips.`);
