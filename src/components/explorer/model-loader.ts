import { Group, Object3D, Box3, Vector3, Mesh } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

/**
 * Load a licensed model without making a scene depend on the network.
 * The caller keeps its procedural fallback; a failed or cancelled request is
 * intentionally a no-op.
 */
export function loadLicensedModel(
  url: string,
  parent: Object3D,
  options: { height?: number; position?: Vector3; rotationY?: number } = {},
): Promise<Group | null> {
  return new Promise((resolve) => {
    loader.load(url, (gltf) => {
      const model = gltf.scene;
      const box = new Box3().setFromObject(model);
      const size = box.getSize(new Vector3());
      const targetHeight = options.height ?? 2;
      if (size.y > 0) model.scale.setScalar(targetHeight / size.y);
      model.position.copy(options.position ?? new Vector3());
      if (options.rotationY) model.rotation.y = options.rotationY;
      model.traverse((node) => {
        const mesh = node as Mesh;
        if (mesh.isMesh) {
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        }
      });
      parent.add(model);
      resolve(model);
    }, undefined, () => resolve(null));
  });
}
