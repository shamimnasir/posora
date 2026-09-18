import { Box3, Object3D, PerspectiveCamera, Sphere, Vector3 } from 'three';
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/** Subject-relative camera choreography. No fixed percentage zoom or CSS scaling.
 * A sphere-fit remains safe at any orbit angle and portrait aspect ratio. */
export function fitDistance(radius: number, verticalFov: number, aspect: number, margin = 1.13) {
  const vertical = verticalFov * Math.PI / 360;
  const horizontal = Math.atan(Math.tan(vertical) * aspect);
  return Math.max(0.5, radius) * margin / Math.sin(Math.min(vertical, horizontal));
}
export function fitBoxDistance(box:Box3, direction:Vector3, verticalFov:number, aspect:number, margin=1.14) {
  const centre=box.getCenter(new Vector3());
  const right=new Vector3().crossVectors(new Vector3(0,1,0),direction).normalize();
  const up=new Vector3().crossVectors(direction,right).normalize();
  const tanV=Math.tan(verticalFov*Math.PI/360),tanH=tanV*aspect;
  let distance=.3;
  for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]) {
    const p=new Vector3(x,y,z).sub(centre);
    distance=Math.max(distance,p.dot(direction)+Math.max(Math.abs(p.dot(right))/tanH,Math.abs(p.dot(up))/tanV)*margin);
  }
  return distance;
}
export function visibleBounds(subject:Object3D) {
  const box=new Box3();
  subject.updateWorldMatrix(true,true);
  subject.traverseVisible(node=>{
    if('geometry' in node) box.union(new Box3().setFromObject(node));
  });
  return box;
}

export class CinematicCamera {
  private from = new Vector3();
  private to = new Vector3();
  private fromAim = new Vector3();
  private aim = new Vector3();
  private started = 0;
  private moving = false;
  private subject: Object3D | null = null;
  private direction = new Vector3(0.85, 0.62, 1.2).normalize();
  constructor(private camera: PerspectiveCamera, private controls: OrbitControls, private reduced: () => boolean) {}
  frame(subject: Object3D, instant = false) {
    this.subject = subject;
    subject.updateWorldMatrix(true, true);
    const box = visibleBounds(subject);
    const sphere = box.getBoundingSphere(new Sphere());
    if (!Number.isFinite(sphere.radius) || sphere.radius === 0) return;
    this.from.copy(this.camera.position);
    this.fromAim.copy(this.controls.target);
    this.aim.copy(sphere.center);
    const distance = fitBoxDistance(box,this.direction,this.camera.fov,this.camera.aspect);
    this.to.copy(this.direction).multiplyScalar(distance).add(this.aim);
    this.controls.minDistance = distance;
    this.controls.maxDistance = distance * 1.65;
    this.camera.near = Math.max(0.01, distance / 200);
    this.camera.far = Math.max(100, distance * 6);
    this.camera.updateProjectionMatrix();
    this.started = performance.now(); this.moving = true;
    if (instant || this.reduced()) this.tick(this.started + 1000);
  }
  resize() { if (this.subject) this.frame(this.subject, true); }
  cancel() { this.moving = false; }
  tick(now: number) {
    if (!this.moving) return;
    const t = this.reduced() ? 1 : Math.min(1, (now - this.started) / 950);
    const e = t * t * t * (t * (t * 6 - 15) + 10);
    this.camera.position.lerpVectors(this.from, this.to, e);
    this.controls.target.lerpVectors(this.fromAim, this.aim, e);
    this.camera.lookAt(this.controls.target);
    if (t === 1) this.moving = false;
  }
}
