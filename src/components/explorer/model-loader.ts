import { AnimationMixer, Group, Object3D, Box3, Vector3, Mesh, Material, Color } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);

/**
 * Load a licensed model without making a scene depend on the network.
 * The caller keeps its procedural fallback; a failed or cancelled request is
 * intentionally a no-op.
 */
export function loadLicensedModel(
  url: string,
  parent: Object3D,
  options: { height?: number; fitAxis?: 'x' | 'y' | 'z' | 'longest'; position?: Vector3; rotationX?: number; rotationY?: number; rotationZ?: number; colorBoost?: number; colorTint?: string; leafShadows?: boolean; centerOnFloor?: boolean; playAnimations?: boolean; animationClip?: string; accept?: () => boolean } = {},
): Promise<Group | null> {
  return new Promise((resolve) => {
    loader.load(url, (gltf) => {
      const model = gltf.scene;
      if (options.accept && !options.accept()) { resolve(null); return; }
      // Apply the presentation orientation before measuring. That way a
      // sideways museum scan is fitted and grounded in its final pose rather
      // than being centered correctly and then rotated through the floor.
      if (options.rotationX) model.rotation.x = options.rotationX;
      if (options.rotationY) model.rotation.y = options.rotationY;
      if (options.rotationZ) model.rotation.z = options.rotationZ;
      const box = new Box3().setFromObject(model);
      const size = box.getSize(new Vector3());
      const targetHeight = options.height ?? 2;
      const fitAxis = options.fitAxis ?? 'y';
      const dimension = fitAxis === 'longest'
        ? Math.max(size.x, size.y, size.z)
        : size[fitAxis];
      if (dimension > 0) model.scale.setScalar(targetHeight / dimension);
      model.position.copy(options.position ?? new Vector3());
      if (options.centerOnFloor) {
        const fitted = new Box3().setFromObject(model);
        model.position.x -= (fitted.min.x + fitted.max.x) / 2;
        model.position.y -= fitted.min.y;
        model.position.z -= (fitted.min.z + fitted.max.z) / 2;
      }
      const colorBoost = options.colorBoost ?? 1;
      const colorTint = options.colorTint ? new Color(options.colorTint) : null;
      model.traverse((node) => {
        const mesh = node as Mesh;
        if (mesh.isMesh) {
          // Dense alpha-card canopies self-shadow into near-black masses.
          // Keep that treatment opt-in and restricted to named leaf meshes;
          // trunks and every other asset retain full contact shadows.
          const leafMesh = options.leafShadows === false && /leaf|leaves|foliage/i.test(mesh.name);
          mesh.castShadow = !leafMesh;
          mesh.receiveShadow = !leafMesh;
          if (colorBoost !== 1 || colorTint) {
            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            materials.forEach((material) => {
              const color = (material as Material & { color?: Color }).color;
              if (!color?.isColor) return;
              if (colorTint) color.multiply(colorTint);
              if (colorBoost !== 1) color.multiplyScalar(colorBoost);
            });
          }
        }
      });
      parent.add(model);
      model.userData.posoraLicensedModel = url;
      const availableClips = options.playAnimations ? gltf.animations : [];
      const clips = options.animationClip
        ? availableClips.filter((clip) => clip.name === options.animationClip)
        : availableClips;
      model.userData.posoraAnimationClips = clips.map((clip) => clip.name);
      const animationsPlaying = clips.length > 0 && !matchMedia('(prefers-reduced-motion: reduce)').matches;
      model.userData.posoraAnimationsPlaying = animationsPlaying;
      if (animationsPlaying) {
        const mixer = new AnimationMixer(model);
        clips.forEach((clip) => mixer.clipAction(clip).play());
        let lastFrame = performance.now();
        const animate = (now: number) => {
          // Stop the per-model loop when its owning scene removes the asset.
          if (!model.parent) {
            mixer.stopAllAction();
            mixer.uncacheRoot(model);
            return;
          }
          mixer.update(Math.min((now - lastFrame) / 1000, 0.05));
          lastFrame = now;
          requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }
      window.dispatchEvent(new CustomEvent('posora:licensed-model-loaded', {
        detail: { url, animations: model.userData.posoraAnimationClips, animationsPlaying },
      }));
      resolve(model);
    }, undefined, (error) => {
      console.warn(`[Posora 3D] Could not load ${url}`, error);
      resolve(null);
    });
  });
}
