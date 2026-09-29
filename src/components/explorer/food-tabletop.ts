import {
  Box3, BufferGeometry, CatmullRomCurve3, Color, CylinderGeometry, DodecahedronGeometry, DoubleSide, Group, InstancedMesh,
  LatheGeometry, MathUtils, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, Object3D, ExtrudeGeometry,
  CanvasTexture, Float32BufferAttribute, Quaternion, RepeatWrapping, Shape, ShapeGeometry, SphereGeometry, SRGBColorSpace, TextureLoader, TorusGeometry, TubeGeometry, Vector2, Vector3,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/** Procedural, self-contained food tableau. Coordinates use metres; +Z faces the viewer. */
export type FoodTabletop = {
  anchors: Record<string, Object3D>;
  pickTargets: Object3D[];
  detailTargets: (Object3D | null)[];
  detailFocusTargets: (Object3D | null)[];
  update(t: number, dt: number, param: number): void;
  setReveal(level: number, itemIndex: number): void;
};

export const FOOD_ITEM_IDS = [
  'food-nutrients-carbohydrate', 'food-nutrients-protein', 'food-nutrients-fat',
  'food-nutrients-vitamin', 'food-nutrients-minerals', 'food-nutrients-water',
  'food-nutrients-fiber', 'food-nutrients-energy',
] as const;

const ceramic = new MeshPhysicalMaterial({ color: '#eee6d7', roughness: .36, metalness: 0, clearcoat: .12, clearcoatRoughness: .3 });
const ceramicFoot = new MeshStandardMaterial({ color: '#c9bda9', roughness: .82 });
const riceMat = new MeshPhysicalMaterial({ color: '#dccba8', roughness: .48, metalness: 0, clearcoat: .12, clearcoatRoughness: .36 });
const riceMats = [riceMat, new MeshPhysicalMaterial({ color: '#d2c09a', roughness: .52, clearcoat: .1 }), new MeshPhysicalMaterial({ color: '#eadbb9', roughness: .49, clearcoat: .11 })];
function riceCoreMaterial() {
  // The low-poly support should never read as an exposed smooth dome between
  // surface grains. This subtle, deterministic micro-pattern is only a hidden
  // fill texture; the separate instanced grains remain the real silhouette.
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;
  const ctx=canvas.getContext('2d');
  if(ctx){
    ctx.fillStyle='#dcccae';ctx.fillRect(0,0,canvas.width,canvas.height);
    let seed=0x8c214;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
    const tones=['#fff8e8','#baa77e','#f3e7cf','#cdb991'];
    for(let i=0;i<2400;i++){
      const x=rand()*canvas.width,y=rand()*canvas.height,length=5+rand()*10,width=1.2+rand()*1.8;
      ctx.save();ctx.translate(x,y);ctx.rotate((rand()-.5)*1.2);ctx.globalAlpha=.32+rand()*.3;ctx.fillStyle=tones[Math.floor(rand()*tones.length)]!;
      ctx.beginPath();ctx.ellipse(0,0,length/2,width/2,0,0,Math.PI*2);ctx.fill();ctx.restore();
    }
  }
  const map=new CanvasTexture(canvas);map.colorSpace=SRGBColorSpace;map.wrapS=RepeatWrapping;map.wrapT=RepeatWrapping;
  return new MeshStandardMaterial({color:'#fff',map,roughness:.88});
}
const fishSkin = new TextureLoader().load('/textures/fish-scale-albedo-v3.jpg'); fishSkin.colorSpace=SRGBColorSpace; fishSkin.wrapS=RepeatWrapping; fishSkin.wrapT=RepeatWrapping; fishSkin.repeat.set(1.45,.88);
const fishMat = new MeshPhysicalMaterial({ color: '#fff', map: fishSkin, vertexColors: true, roughness: .66, metalness: 0, clearcoat: .055, clearcoatRoughness: .62 });
const fishFinMat = new MeshStandardMaterial({ color: '#6d8184', roughness: .58, side: DoubleSide });
const guavaSkin = new TextureLoader().load('/textures/guava-skin-albedo-v1.jpg'); guavaSkin.colorSpace=SRGBColorSpace; guavaSkin.wrapS=RepeatWrapping; guavaSkin.wrapT=RepeatWrapping; guavaSkin.repeat.set(1.1,1);
const cucumberSkin = new TextureLoader().load('/textures/cucumber-skin-albedo-v1.jpg'); cucumberSkin.colorSpace=SRGBColorSpace; cucumberSkin.wrapS=RepeatWrapping; cucumberSkin.wrapT=RepeatWrapping; cucumberSkin.repeat.set(1.7,1);
const oilMat = new MeshPhysicalMaterial({ color: '#8c5720', roughness: .22, metalness: 0, clearcoat: .35, clearcoatRoughness: .16 });
const glassMat = new MeshPhysicalMaterial({ color: '#c7e4e2', roughness: .12, metalness: 0, transmission: .58, thickness: .028, ior: 1.46, transparent: true, opacity: .42, side: DoubleSide });
const waterMat = new MeshPhysicalMaterial({ color: '#a7d6dc', roughness: .12, transmission: .2, thickness: .018, transparent: true, opacity: .72, side: DoubleSide });
const saltMat = new MeshStandardMaterial({ color: '#f2efe7', roughness: .9 });
const boardAlbedo = new TextureLoader().load('/textures/food-board-albedo-v1.jpg');
boardAlbedo.colorSpace = SRGBColorSpace; boardAlbedo.wrapS = RepeatWrapping; boardAlbedo.wrapT = RepeatWrapping; boardAlbedo.repeat.set(2.2, 1.25);
const tableMat = new MeshStandardMaterial({ color: '#fff', map: boardAlbedo, roughness: .82 });
const fishAssetLoader = new GLTFLoader();
let fishAssetPromise: Promise<Group | null> | null = null;

function loadFishAsset() {
  fishAssetPromise ??= new Promise((resolve) => {
    fishAssetLoader.load('/models/remake/food-93e5f02c/barramundi-fish-1024-webp.glb', ({ scene }) => resolve(scene), undefined, () => resolve(null));
  });
  return fishAssetPromise;
}

function fishAssetInstance(source: Group, targetLength: number, supportY: number) {
  const model = source.clone(true);
  const sourceBox = new Box3().setFromObject(model);
  const sourceCenter = sourceBox.getCenter(new Vector3());
  const sourceSize = sourceBox.getSize(new Vector3());
  model.position.sub(sourceCenter);
  const posed = new Group();
  posed.name = 'cc0-barramundi-fish';
  posed.add(model);
  // The source stands upright on Y with length on Z. Turn its length across
  // the platter, but keep the belly-down axis vertical: rolling onto the flank
  // made a low fin tip support the model and left the body visibly suspended.
  posed.rotation.set(0,Math.PI/2,0,'XYZ');
  posed.scale.setScalar(targetLength / Math.max(.001, sourceSize.z));
  posed.updateMatrixWorld(true);
  const posedBox = new Box3().setFromObject(posed);
  posed.position.y += supportY - posedBox.min.y;
  posed.traverse((node) => {
    const rendered = node as Mesh;
    if (!rendered.isMesh) return;
    rendered.castShadow = true;
    rendered.receiveShadow = true;
  });
  return posed;
}

function mesh(parent: Object3D, geo: BufferGeometry, mat: MeshStandardMaterial | MeshPhysicalMaterial, pos: [number, number, number] = [0, 0, 0]) {
  const m = new Mesh(geo, mat); m.position.set(...pos); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
function lathe(parent: Object3D, pts: [number, number][], mat: MeshStandardMaterial | MeshPhysicalMaterial, pos: [number, number, number] = [0, 0, 0], segments = 48) {
  return mesh(parent, new LatheGeometry(pts.map(([x, y]) => new Vector2(x, y)), segments), mat, pos);
}
function dish(parent: Object3D, x: number, z: number, radius: number, height: number, depth = .012) {
  const g = new Group(); g.position.set(x, .025, z); parent.add(g);
  lathe(g, [[0,.008],[radius*.68,.008],[radius*.76,.012],[radius*.9,height*.35],[radius,height*.72],[radius*.99,height*.88],[radius*.93,height],[radius*.87,height],[radius*.83,height*.88],[radius*.82,height*.7],[radius*.73,.055],[radius*.66,.045],[0,.045]], ceramic);
  lathe(g, [[radius*.48,0],[radius*.62,0],[radius*.62,depth],[radius*.48,depth]], ceramicFoot, [0,-.002,0], 40);
  const inner = new Mesh(new CylinderGeometry(radius*.76, radius*.66, .006, 48), new MeshStandardMaterial({ color:'#e5ddcf', roughness:.48 }));
  inner.position.y = .048; g.add(inner);
  return g;
}
function instanced(parent: Object3D, geo: BufferGeometry, mat: MeshStandardMaterial, placements: {p:Vector3; s:Vector3; q?:Quaternion}[]) {
  const im = new InstancedMesh(geo, mat, placements.length); im.castShadow = true; im.receiveShadow = true;
  const dummy = new Object3D(); placements.forEach((v, i) => { dummy.position.copy(v.p); dummy.scale.copy(v.s); if (v.q) dummy.quaternion.copy(v.q); dummy.updateMatrix(); im.setMatrixAt(i, dummy.matrix); });
  im.instanceMatrix.needsUpdate = true; parent.add(im); return im;
}
function riceGeometry() {
  // Keep smooth, rounded normals while using a compact low-detail surface for
  // thousands of instances. A mild taper and bend distinguish a cooked grain
  // without turning the close view into a faceted starburst.
  const g=new SphereGeometry(1,8,6),a=g.attributes.position;
  for(let i=0;i<a.count;i++){
    const y=a.getY(i),end=Math.pow(Math.abs(y),2.4),taper=1-.27*end,bend=.014*Math.sin(y*1.3);
    a.setXYZ(i,a.getX(i)*taper+bend,y*.92,a.getZ(i)*taper);
  }
  g.computeVertexNormals();return g;
}
function riceGrainOrientation(angle:number, tilt:number, twist:number) {
  const grainAxis=new Vector3(Math.cos(angle),tilt,Math.sin(angle)).normalize();
  return new Quaternion().setFromUnitVectors(new Vector3(0,1,0),grainAxis)
    .multiply(new Quaternion().setFromAxisAngle(new Vector3(0,1,0),twist));
}
const FISH_BODY_STATIONS:[number,number,number][]=[[-.33,.025,.035],[-.27,.062,.075],[-.18,.092,.105],[-.07,.1,.11],[.04,.087,.09],[.14,.064,.067],[.22,.042,.045],[.28,.018,.024],[.31,.004,.008]];
function fishBodySurfaceZ(x:number,y:number) {
  let i=0;while(i<FISH_BODY_STATIONS.length-2&&x>FISH_BODY_STATIONS[i+1][0])i++;
  const a=FISH_BODY_STATIONS[i],b=FISH_BODY_STATIONS[i+1],t=Math.max(0,Math.min(1,(x-a[0])/(b[0]-a[0])));
  const ry=a[1]+(b[1]-a[1])*t,rz=a[2]+(b[2]-a[2])*t;
  return rz*Math.sqrt(Math.max(.025,1-(y/ry)**2));
}
function fishBody() {
  // Continuous tapered cross-sections; muted dorsal/flank/belly color changes
  // and the shared scale material keep the full fish coherent with its macro.
  const sides=24,pos:number[]=[],colors:number[]=[],uvs:number[]=[],idx:number[]=[];
  const top=new Color('#778582'),flank=new Color('#b8c1ba'),belly=new Color('#d7cfbf');
  for(const [i,[x,ry,rz]] of FISH_BODY_STATIONS.entries())for(let j=0;j<sides;j++){
    const a=j/sides*Math.PI*2,vertical=Math.cos(a);pos.push(x,vertical*ry,Math.sin(a)*rz);
    const dorsal=MathUtils.smoothstep(vertical,.12,.92),ventral=MathUtils.smoothstep(-vertical,.12,.92);
    const c=flank.clone().lerp(top,dorsal*.62).lerp(belly,ventral*.34);
    colors.push(c.r,c.g,c.b);uvs.push(i/(FISH_BODY_STATIONS.length-1),j/sides);
  }
  for(let i=0;i<FISH_BODY_STATIONS.length-1;i++)for(let j=0;j<sides;j++){const a=i*sides+j,b=i*sides+(j+1)%sides,c=(i+1)*sides+j,d=(i+1)*sides+(j+1)%sides;idx.push(a,b,c,b,d,c);}
  const geo=new BufferGeometry();geo.setAttribute('position',new Float32BufferAttribute(pos,3));geo.setAttribute('color',new Float32BufferAttribute(colors,3));geo.setAttribute('uv',new Float32BufferAttribute(uvs,2));geo.setIndex(idx);geo.computeVertexNormals();return geo;
}
const FISH_HEAD_STATIONS:[number,number,number][]=[[-.17,.048,.067],[-.12,.086,.105],[-.04,.105,.13],[.045,.102,.126],[.13,.079,.105],[.215,.055,.081],[.285,.031,.052],[.322,.008,.019]];
function fishHeadSurfaceZ(x:number,y:number) {
  let i=0;while(i<FISH_HEAD_STATIONS.length-2&&x>FISH_HEAD_STATIONS[i+1][0])i++;
  const a=FISH_HEAD_STATIONS[i],b=FISH_HEAD_STATIONS[i+1],t=Math.max(0,Math.min(1,(x-a[0])/(b[0]-a[0])));
  const ry=a[1]+(b[1]-a[1])*t,rz=a[2]+(b[2]-a[2])*t,ny=(y-.13)/ry;
  return .005+rz*Math.sqrt(Math.max(.035,1-ny*ny));
}
function fishHeadGeometry() {
  // One continuous, tapered head mesh: broad at the gill cover and narrowing
  // into the snout. The cross-section shading differentiates back, flank, and
  // underside instead of stacking same-sized glossy spheres.
  const stations:[number,number,number][]=[];
  const catmull=(p0:number,p1:number,p2:number,p3:number,t:number)=>.5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t*t+(-p0+3*p1-3*p2+p3)*t*t*t);
  for(let i=0;i<FISH_HEAD_STATIONS.length-1;i++)for(let step=0;step<6;step++){
    const p0=FISH_HEAD_STATIONS[Math.max(0,i-1)],p1=FISH_HEAD_STATIONS[i],p2=FISH_HEAD_STATIONS[i+1],p3=FISH_HEAD_STATIONS[Math.min(FISH_HEAD_STATIONS.length-1,i+2)],t=step/6;
    stations.push([catmull(p0[0],p1[0],p2[0],p3[0],t),catmull(p0[1],p1[1],p2[1],p3[1],t),catmull(p0[2],p1[2],p2[2],p3[2],t)]);
  }
  stations.push(FISH_HEAD_STATIONS.at(-1)!);
  const sides=32,pos:number[]=[],colors:number[]=[],uvs:number[]=[],idx:number[]=[];
  const top=new Color('#778582'), flank=new Color('#b8c1ba'), belly=new Color('#d7cfbf');
  for(const [i,[x,ry,rz]] of stations.entries())for(let j=0;j<sides;j++){
    const a=j/sides*Math.PI*2, vertical=Math.sin(a); pos.push(x,vertical*ry,Math.cos(a)*rz);
    const dorsal=MathUtils.smoothstep(vertical,.1,.92),ventral=MathUtils.smoothstep(-vertical,.1,.92);
    const c=flank.clone().lerp(top,dorsal*.6).lerp(belly,ventral*.32);
    colors.push(c.r,c.g,c.b);
    uvs.push(i/(stations.length-1),j/sides);
  }
  // The theta convention here is y=sin(theta), z=cos(theta), opposite to
  // fishBody's convention. Keep front-side winding outward or the visible
  // cheek/jaw/eye reads as disconnected patches under back-face culling.
  for(let i=0;i<stations.length-1;i++)for(let j=0;j<sides;j++){const a=i*sides+j,b=i*sides+(j+1)%sides,c=(i+1)*sides+j,d=(i+1)*sides+(j+1)%sides;idx.push(a,c,b,b,c,d);}
  const geo=new BufferGeometry();geo.setAttribute('position',new Float32BufferAttribute(pos,3));geo.setAttribute('color',new Float32BufferAttribute(colors,3));geo.setAttribute('uv',new Float32BufferAttribute(uvs,2));geo.setIndex(idx);geo.computeVertexNormals();return geo;
}
function fin(parent: Object3D, points: [number,number,number][], material = fishFinMat) {
  const pos=points.flat(), geo=new BufferGeometry(); geo.setAttribute('position', new Float32BufferAttribute(pos,3)); geo.setIndex([0,1,2,0,2,3]); geo.computeVertexNormals();
  return mesh(parent,geo,material);
}
function produce(parent: Object3D, color: string, scale: [number,number,number], seed: number) {
  const geo=new SphereGeometry(1,24,16), m=new MeshPhysicalMaterial({ color, roughness:.68, clearcoat:.04 });
  const fruit=mesh(parent,geo,m); fruit.scale.set(...scale); fruit.position.y=.04 + scale[1];
  // Small restrained skin pores, fixed seed and no texture dependency.
  let s=seed>>>0; const rand=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
  const dots: {p:Vector3;s:Vector3}[]=[];
  for(let i=0;i<110;i++){const y=rand()*2-1,a=rand()*Math.PI*2,r=Math.sqrt(1-y*y); dots.push({p:new Vector3(r*Math.cos(a)*scale[0]*1.002,fruit.position.y+y*scale[1]*1.002,r*Math.sin(a)*scale[2]*1.002),s:new Vector3(.0018,.0018,.0018)});}
  instanced(parent,new SphereGeometry(1,5,4),new MeshStandardMaterial({color:'#8d9b59',roughness:1}),dots);
  return fruit;
}

export function buildFoodTabletop(root: Group, compact = false, medium = false): FoodTabletop {
  const anchors: Record<string,Object3D> = {};
  const table = new Group(); root.add(table);
  const edgeMat=new MeshStandardMaterial({color:'#805a3d',roughness:.78});
  const boardShape=new Shape();
  const bw=2.22,bd=1.42,br=.13;
  boardShape.moveTo(-bw/2+br,-bd/2);boardShape.lineTo(bw/2-br,-bd/2);boardShape.quadraticCurveTo(bw/2,-bd/2,bw/2,-bd/2+br);
  boardShape.lineTo(bw/2,bd/2-br);boardShape.quadraticCurveTo(bw/2,bd/2,bw/2-br,bd/2);
  boardShape.lineTo(-bw/2+br,bd/2);boardShape.quadraticCurveTo(-bw/2,bd/2,-bw/2,bd/2-br);
  boardShape.lineTo(-bw/2,-bd/2+br);boardShape.quadraticCurveTo(-bw/2,-bd/2,-bw/2+br,-bd/2);
  const boardGeo=new ExtrudeGeometry(boardShape,{depth:.08,steps:1,bevelEnabled:true,bevelSegments:3,bevelSize:.018,bevelThickness:.018,curveSegments:8});
  const slab=new Mesh(boardGeo,[tableMat,edgeMat]);slab.rotation.x=-Math.PI/2;slab.position.y=-.04;slab.castShadow=true;slab.receiveShadow=true;table.add(slab);
  // Natural grain comes from a low-contrast, authored material texture instead
  // of the old equally spaced procedural stripes.
  const tableGrain: Mesh[]=[];

  anchors.rice=new Group(); anchors.rice.position.set(-.57,.025,.22); table.add(anchors.rice);
  const bowl=dish(anchors.rice,0,0,.31,.15,.018);
  // A low, shaded core supports the mound without swallowing the visible grains.
  // Keep the hidden support well inside the grain envelope. The old broad,
  // darker core showed through as smooth beige wedges in the desktop close-up.
  mesh(anchors.rice,new SphereGeometry(1,24,16),riceCoreMaterial(),[0,.105,0]).scale.set(.232,.06,.22);
  let seed=0x341a; const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const grains:{p:Vector3;s:Vector3;q:Quaternion}[]=[];
  for(let i=0;i<3400;i++) { const a=rand()*Math.PI*2, rr=Math.sqrt(rand())*.232, cl=.77+.23*Math.sin(a*7+rr*19); const x=Math.cos(a)*rr*cl,z=Math.sin(a)*rr*cl; const y=.103+.074*Math.sqrt(Math.max(0,1-(x*x+z*z)/(.25*.25))); grains.push({p:new Vector3(x,y,z),s:new Vector3(.006+rand()*.001,.009+rand()*.003,.0055+rand()*.001),q:riceGrainOrientation(rand()*Math.PI*2,.08+rand()*.46,rand()*Math.PI*2)}); }
  for(let i=0;i<3;i++) instanced(anchors.rice,riceGeometry(),riceMats[i],grains.filter((_,n)=>n%3===i));
  // Rice bowl geometry is a true open vessel with an inner surface and foot;
  // keeping it inside this target lets clicks on the visible ceramic pick rice.
  anchors.rice.userData.vessel=bowl;
  const riceDetail=new Group(); riceDetail.position.set(-.37,-.09,.16); table.add(riceDetail); riceDetail.visible=false;
  // The detail camera must aim at the food, not the group's origin. Otherwise
  // the plate lip dominates the macro frame and the rice sits just below it.
  const riceDetailAim=new Object3D(); riceDetailAim.position.set(0,.105,0); riceDetail.add(riceDetailAim);
  // A smaller, shallow ceramic saucer leaves the grains as the subject in the
  // macro shot instead of letting a broad plate dominate the frame.
  dish(riceDetail,0,0,.09,.05,.008);
  const riceDetailMats=[
    new MeshPhysicalMaterial({color:'#d9c6a5',roughness:.62,clearcoat:.055,clearcoatRoughness:.5,transmission:.035,thickness:.008,ior:1.33}),
    new MeshPhysicalMaterial({color:'#cbb690',roughness:.68,clearcoat:.045,clearcoatRoughness:.55,transmission:.025,thickness:.008,ior:1.33}),
    new MeshPhysicalMaterial({color:'#e5d7bc',roughness:.6,clearcoat:.065,clearcoatRoughness:.48,transmission:.04,thickness:.008,ior:1.33}),
  ];
  const rg=riceGeometry(), detailGrains:{p:Vector3;s:Vector3;q:Quaternion}[]=[]; let detailSeed=0x51a7;const detailRand=()=>{detailSeed=(detailSeed*1664525+1013904223)>>>0;return detailSeed/4294967296;};
  // Controlled small mound: enough grains for a believable serving while
  // retaining readable silhouettes at the teaching close-up.
  for(let i=0;i<220;i++){
    const a=detailRand()*Math.PI*2, r=Math.sqrt(detailRand())*.052;
    const length=.012+detailRand()*.003, width=.0038+detailRand()*.0008;
    // A gently domed, overlapping pile catches soft contact shadows and reads
    // as a serving, instead of separate grains sprinkled flat across a plate.
    const mound=Math.sqrt(Math.max(0,1-(r/.058)**2));
    const y=.06+.018*mound+detailRand()*.009;
    detailGrains.push({p:new Vector3(Math.cos(a)*r,y,Math.sin(a)*r),s:new Vector3(width,length,width*.78),q:riceGrainOrientation(detailRand()*Math.PI*2,.025+detailRand()*.17,detailRand()*Math.PI*2)});
  }
  for(let i=0;i<3;i++) instanced(riceDetail,rg,riceDetailMats[i],detailGrains.filter((_,n)=>n%3===i));

  // Seat the platter on the board surface (y=.04). The former .15 parent
  // lift made both plate and fish visibly hover even though the fish touched
  // the plate in local space.
  // Center the platter on the board depth so the belly contact sits over its
  // flat inner floor, not the rear curved shoulder that creates a hover cue.
  const fish=new Group(); fish.position.set(.43,.017,0); fish.rotation.y=.16; table.add(fish); anchors.fish=fish;
  dish(fish,0,0,.39,.055,.015);
  const fishFallback=new Group(); fishFallback.name='procedural-fish-fallback'; fish.add(fishFallback);
  mesh(fishFallback,fishBody(),fishMat,[0,.035,0]);
  // Forked tail, dorsal/pectoral/anal fins follow the resting body and remain attached.
  fin(fishFallback,[[-.27,.04,-.025],[-.43,.13,0],[-.39,.035,0],[-.43,-.065,0]]);
  fin(fishFallback,[[-.11,.11,-.01],[.03,.19,0],[.13,.11,0],[.03,.14,.005]]);
  fin(fishFallback,[[.01,-.045,.085],[.15,-.16,.12],[.17,-.06,.09],[.08,-.025,.08]]);
  fin(fishFallback,[[-.13,-.065,-.03],[.01,-.13,-.02],[.08,-.055,-.02],[-.02,-.04,-.02]]);
  const eyeMat=new MeshStandardMaterial({color:'#202321',roughness:.25});
  const wholeEyeZ=fishBodySurfaceZ(.185,.034)+.002;
  const wholeSocket=mesh(fishFallback,new SphereGeometry(.014,20,14),new MeshStandardMaterial({color:'#a6aaa1',roughness:.68}),[.185,.034,wholeEyeZ]);wholeSocket.scale.set(1,.86,.32);
  const wholeIris=mesh(fishFallback,new SphereGeometry(.009,18,12),new MeshPhysicalMaterial({color:'#403d36',roughness:.34}),[.188,.034,wholeEyeZ+.004]);wholeIris.scale.z=.42;
  const wholePupil=mesh(fishFallback,new SphereGeometry(.005,16,10),eyeMat,[.19,.034,wholeEyeZ+.007]);wholePupil.scale.z=.4;
  const wholeGillMat=new MeshStandardMaterial({color:'#687a75',roughness:.82});
  for(let g=0;g<2;g++){
    const x=.105-g*.022,pts:[number,number,number][]=[[x,.054,0],[x-.008,.025,0],[x-.008,-.012,0],[x,.005,0]];
    mesh(fishFallback,new TubeGeometry(new CatmullRomCurve3(pts.map(([px,y])=>new Vector3(px,y,fishBodySurfaceZ(px,y)+.001))),18,.0009,5,false),wholeGillMat);
  }
  const fishDetail=new Group(); fishDetail.position.set(.43,-.09,.2); table.add(fishDetail); fishDetail.visible=false;
  // The close-up's subject is the head/gill/pectoral-fin area, not the fish's
  // origin or its nose. The head points toward +X in the authored orientation.
  // Stage three moves the camera from the whole-fish study to the gill/eye
  // junction. Keep this target outside the scaled close-up group so the aim
  // point itself does not drift as the macro model grows.
  // On narrow screens the target needs to sit farther toward the fish's head:
  // the camera centers this point, which shifts the model left in the viewport.
  const fishMacroAim=new Object3D();fishMacroAim.position.set(compact?1.55:1.3,.14,.2);table.add(fishMacroAim);
  const fishDetailFallback=new Group(); fishDetailFallback.name='procedural-fish-detail-fallback'; fishDetail.add(fishDetailFallback);
  // Authored close-up: head, eye socket, gill cover/slits, jaw and attached
  // pectoral fin. It is intentionally a different view, not another tiny fish.
  // The fish-detail state has an explicit return-to-table control, so avoid a
  // second platter that visually fights the head/gill/pectoral close-up.
  const headMat=new MeshPhysicalMaterial({color:'#fff',map:fishSkin,bumpMap:fishSkin,bumpScale:.00012,vertexColors:true,roughness:.68,clearcoat:.035,clearcoatRoughness:.58});
  const cheekMat=new MeshStandardMaterial({color:'#647875',roughness:.86});
  mesh(fishDetailFallback,fishHeadGeometry(),headMat,[0,.13,.005]);
  // The gill-cover is a raised curved plate; three inset arcs make its anatomy
  // legible at the close-up scale without suggesting internal structures.
  const curveLine=(pts:[number,number,number][],radius:number,material:MeshStandardMaterial|MeshPhysicalMaterial)=>mesh(fishDetailFallback,new TubeGeometry(new CatmullRomCurve3(pts.map(p=>new Vector3(...p))),24,radius,7,false),material);
  const coverPts:[number,number,number][]=[[.035,.205,0],[.002,.174,0],[-.005,.132,0],[.004,.092,0],[.035,.07,0]];
  curveLine(coverPts.map(([x,y])=>[x,y,fishHeadSurfaceZ(x,y)+.003]) as [number,number,number][],.0024,cheekMat);
  for(let g=0;g<2;g++){
    const x=-.012-g*.024;
    const slit:[number,number,number][]=[[x,.164,0],[x-.008,.137,0],[x-.008,.111,0]];
    curveLine(slit.map(([px,y])=>[px,y,fishHeadSurfaceZ(px,y)+.0015]) as [number,number,number][],.00085,cheekMat);
  }
  // Soft, tapered fin surface starts directly at the gill line; fine rays stay
  // inside the silhouette so no detached triangle pokes through the platter.
  const finShape=new Shape();finShape.moveTo(.005,.12);finShape.quadraticCurveTo(-.075,.145,-.105,.075);finShape.quadraticCurveTo(-.08,.005,-.02,.025);finShape.quadraticCurveTo(.02,.045,.055,.095);finShape.closePath();
  const finGeo=new ShapeGeometry(finShape,24),finPositions=finGeo.attributes.position;
  for(let i=0;i<finPositions.count;i++){const oldX=finPositions.getX(i),oldY=finPositions.getY(i),x=.012+(oldX-.012)*.58,localY=.11+(oldY-.11)*.58,y=localY+.13;finPositions.setXY(i,x,localY);finPositions.setZ(i,fishHeadSurfaceZ(x,y)+.008);}
  finGeo.computeVertexNormals();
  const pectoral=mesh(fishDetailFallback,finGeo,new MeshPhysicalMaterial({color:'#899b93',roughness:.78,side:DoubleSide,transparent:true,opacity:.92}));
  pectoral.renderOrder=2;
  for(let ray=0;ray<3;ray++){
    const pts:[number,number,number][]=[[.012,.11,0],[-.02-ray*.009,.095-ray*.01,0],[-.054-ray*.005,.05+ray*.004,0]];
    curveLine(pts.map(([x,y])=>[x,y,fishHeadSurfaceZ(x,y)+.003]) as [number,number,number][],.00055,fishFinMat);
  }
  const eyeZ=fishHeadSurfaceZ(.165,.17)+.001;
  const socket=mesh(fishDetailFallback,new SphereGeometry(.019,24,16),new MeshStandardMaterial({color:'#b8b9aa',roughness:.76}),[.165,.17,eyeZ]);socket.scale.set(1,.82,.23);
  const iris=mesh(fishDetailFallback,new SphereGeometry(.009,20,14),new MeshPhysicalMaterial({color:'#49463e',roughness:.42}),[.17,.17,eyeZ+.004]);iris.scale.set(1,1,.35);
  const pupil=mesh(fishDetailFallback,new SphereGeometry(.005,18,12),eyeMat,[.174,.17,eyeZ+.006]);pupil.scale.z=.32;
  const glint=mesh(fishDetailFallback,new SphereGeometry(.0018,12,8),new MeshStandardMaterial({color:'#fff8e8',emissive:'#fff8e8',emissiveIntensity:.12,roughness:.45}),[.176,.175,eyeZ+.008]);glint.scale.z=.32;
  // Mouth and nostril sit on the measured head surface; endpoints stay within
  // the tapered snout rather than reading as detached punctuation.
  const nostrilX=.282,nostrilY=.119,nostrilZ=fishHeadSurfaceZ(nostrilX,nostrilY)+.001;
  mesh(fishDetailFallback,new SphereGeometry(.0025,10,8),cheekMat,[nostrilX,nostrilY,nostrilZ]).scale.set(1,.75,.45);
  const mouth:[[number,number,number],[number,number,number],[number,number,number]]=[[.258,.071,0],[.284,.067,0],[.307,.071,0]];
  curveLine(mouth.map(([x,y])=>[x,y,fishHeadSurfaceZ(x,y)+.001]) as [number,number,number][],.0011,cheekMat);

  // The same verified CC0 specimen supplies both views. Until it has loaded,
  // the prior procedural geometry remains visible as an explicit fallback.
  void loadFishAsset().then((source) => {
    if (!source) {
      root.userData.foodFishAsset='fallback';
      document.documentElement.dataset.foodFishAsset='fallback';
      return;
    }
    // Place the unmodified scan so its ventral body meets the platter. The
    // lowest fused pelvic-fin vertices sit slightly below the ceramic plane
    // and are naturally occluded by its opaque surface instead of being
    // flattened into an artificial straight strip.
    const overviewFish=fishAssetInstance(source,.66,.016);
    fish.add(overviewFish);
    const detailFish=fishAssetInstance(source,.66,0);
    // Align the fish's longitudinal midpoint to the detail camera target.
    // The earlier -0.09 offset left its tail outside narrow canvases.
    detailFish.position.x=.09;
    fishDetail.add(detailFish);
    fishFallback.visible=false;
    fishDetailFallback.visible=false;
    root.userData.foodFishAsset='cc0-barramundi';
    document.documentElement.dataset.foodFishAsset='ready';
    document.dispatchEvent(new CustomEvent('posora:food-fish-ready'));
  });

  const oil=new Group(); oil.position.set(-.86,.04,-.3); table.add(oil); anchors.oil=oil;
  lathe(oil,[[.035,0],[.07,0],[.075,.018],[.067,.13],[.047,.15],[.027,.15],[.027,.19],[.04,.195],[.04,.205],[.022,.205],[.022,.166],[.035,.16],[.052,.13],[.055,.03],[.035,.02]],new MeshPhysicalMaterial({color:'#967344',roughness:.38,transparent:true,opacity:.45,side:DoubleSide}));
  const oilFill=lathe(oil,[[0,.025],[.05,.025],[.052,.12],[.045,.125],[0,.125]],oilMat,[0,0,0],36);
  lathe(oil,[[.022,.166],[.024,.166],[.024,.169],[.022,.169]],new MeshStandardMaterial({color:'#d3c6a3',roughness:.7}));
  const oilDetail=new Group(); oilDetail.position.set(-.72,-.09,-.23); table.add(oilDetail); oilDetail.visible=false;
  const oilDetailBottle=new Group();
  // Reuse the complete bottle silhouette in the macro view; the old detail
  // contained only a ring and a flat disk, which read as no bottle at all.
  oil.children.forEach((part)=>{if(part!==oilFill)oilDetailBottle.add(part.clone(true));});
  oilDetail.add(oilDetailBottle);
  const oilDetailFill=lathe(oilDetailBottle,[[0,.025],[.05,.025],[.052,.12],[.045,.125],[0,.125]],oilMat,[0,0,0],36);
  const oilLevel=mesh(oilDetailBottle,new CylinderGeometry(.049,.049,.002,36),oilMat,[0,.126,0]);

  const guava=new Group(); guava.position.set(compact ? .78 : .91,0,-.36); table.add(guava); anchors.guava=guava;
  const guavaWhole=produce(guava,'#789747',[.105,.085,.091],0x1453); guavaWhole.position.set(-.07,.125,0); guavaWhole.material=new MeshPhysicalMaterial({color:'#fff',map:guavaSkin,bumpMap:guavaSkin,bumpScale:.0028,roughness:.66,clearcoat:.05,clearcoatRoughness:.58,sheen:.12,sheenColor:'#b9d178'});
  // Cut face presented as an attached segment with pale flesh and small central seeds.
  const guavaCut=new Group(); guavaCut.position.set(.085,.105,.015); guavaCut.rotation.x=Math.PI/2; guava.add(guavaCut);
  const fruitBase=mesh(guavaCut,new SphereGeometry(1,24,16),new MeshPhysicalMaterial({color:'#789746',roughness:.72})); fruitBase.scale.set(.065,.067,.054);
  const flesh=mesh(guavaCut,new SphereGeometry(1,24,16),new MeshStandardMaterial({color:'#f0dfb5',roughness:.8})); flesh.scale.set(.057,.008,.047); flesh.position.y=.058;
  const seeds:{p:Vector3;s:Vector3}[]=[]; for(let i=0;i<13;i++){const a=i*2.4,r=.014+(i%4)*.005;seeds.push({p:new Vector3(Math.cos(a)*r,.068,Math.sin(a)*r),s:new Vector3(.003,.002,.003)});}
  instanced(guavaCut,new SphereGeometry(1,6,4),new MeshStandardMaterial({color:'#b99a61',roughness:.9}),seeds);
  const guavaDetail=new Group(); guavaDetail.position.set(1.02,-.09,-.22); table.add(guavaDetail); guavaDetail.visible=false;
  // Re-center the cut section on the detail-camera target. Keeping its overview
  // offset made the enlarged cross-section drift off the right edge on phones.
  const guavaCrossSection=guavaCut.clone(true); guavaCrossSection.position.set(0,0,0); guavaDetail.add(guavaCrossSection);

  const salt=new Group(); salt.position.set(-.28,.02,-.39); table.add(salt); anchors.salt=salt;
  dish(salt,0,0,.125,.045,.009);
  const saltGrains:{p:Vector3;s:Vector3}[]=[]; for(let i=0;i<95;i++){const a=i*2.399,r=Math.sqrt((i+.5)/95)*.075,y=.049+.03*Math.sqrt(Math.max(0,1-r/.08));saltGrains.push({p:new Vector3(Math.cos(a)*r,y,Math.sin(a)*r),s:new Vector3(.004+((i*7)%3)*.001,.003,.004+((i*11)%4)*.001)});}
  instanced(salt,new SphereGeometry(1,5,4),saltMat,saltGrains);
  const saltDetail=new Group(); saltDetail.position.set(-.07,-.09,-.3); table.add(saltDetail); saltDetail.visible=false;
  dish(saltDetail,0,0,.1,.025,.006);
  // Fine, irregular crystals make the close view read as coarse salt rather
  // than a pile of oversized stones. Keep the grains above the dish's inner
  // surface so the authored quantity remains visible in the macro.
  const saltBig:{p:Vector3;s:Vector3}[]=[];for(let i=0;i<110;i++){const a=i*2.399,r=Math.sqrt((i+.5)/110)*.061;saltBig.push({p:new Vector3(Math.cos(a)*r,.081+(i%5)*.0018,Math.sin(a)*r),s:new Vector3(.0038+(i%3)*.0008,.0032+(i%2)*.0007,.0038+((i*7)%3)*.0007)});}
  const saltCrystalGeo=new DodecahedronGeometry(1,0), saltCrystalMats=['#faf9f5','#dfdfd9','#eeece4'].map((color)=>new MeshStandardMaterial({color,roughness:.84}));
  for(let i=0;i<saltCrystalMats.length;i++)instanced(saltDetail,saltCrystalGeo,saltCrystalMats[i]!,saltBig.filter((_,n)=>n%3===i));

  const water=new Group(); water.position.set(.02,.04,-.38); table.add(water); anchors.water=water;
  lathe(water,[[.048,0],[.065,0],[.065,.13],[.061,.13],[.061,.012],[.048,.012]],glassMat);
  const waterFill=mesh(water,new CylinderGeometry(.061,.061,.058,36),waterMat,[0,.078,0]);
  const meniscus=mesh(water,new CylinderGeometry(.058,.058,.0015,36),new MeshPhysicalMaterial({color:'#eaf2ef',roughness:.16,transparent:true,opacity:.34}),[0,.108,0]);
  const waterDetail=new Group();waterDetail.position.set(.2,-.09,-.32);table.add(waterDetail);waterDetail.visible=false;
  lathe(waterDetail,[[.058,0],[.075,0],[.075,.095],[.069,.095],[.069,.008],[.058,.008]],glassMat);
  const waterDetailFill=mesh(waterDetail,new CylinderGeometry(.068,.068,.055,36),waterMat,[0,.032,0]);
  const waterDetailSurface=mesh(waterDetail,new CylinderGeometry(.067,.067,.0015,36),new MeshPhysicalMaterial({color:'#eaf5f3',roughness:.16,transparent:true,opacity:.48}),[0,.06,0]);
  const waterRim=mesh(waterDetail,new TorusGeometry(.071,.002,6,36),new MeshStandardMaterial({color:'#d8e7e3',roughness:.24}),[0,.094,0]);
  waterRim.rotation.x=Math.PI/2;

  const cucumberMat=new MeshPhysicalMaterial({color:'#fff',map:cucumberSkin,bumpMap:cucumberSkin,bumpScale:.002,roughness:.7,clearcoat:.055,clearcoatRoughness:.6,sheen:.1,sheenColor:'#9ebd69'});
  const cucumber=new Group(); cucumber.position.set(compact ? -.68 : -.82,.02,.48); cucumber.rotation.y=-.35; table.add(cucumber); anchors.cucumber=cucumber;
  const body=mesh(cucumber,new SphereGeometry(1,36,24),cucumberMat,[0,.08,0]);body.scale.set(.24,.061,.063);body.rotation.z=.07;
  // Subtle lengthwise ridges and pale cut end identify a skin-on cucumber.
  for(let i=0;i<7;i++){const a=i*Math.PI*2/7;const ridge=mesh(cucumber,new CylinderGeometry(.002,.002,.38,5),new MeshStandardMaterial({color:i%2?'#587f48':'#709251',roughness:.86}),[0,.08+Math.cos(a)*.04,Math.sin(a)*.04]);ridge.rotation.z=Math.PI/2;}
  const cut=mesh(cucumber,new CylinderGeometry(.06,.06,.012,28),new MeshStandardMaterial({color:'#d4df9e',roughness:.82}),[.237,.08,0]);cut.rotation.z=Math.PI/2;
  const seedMat=new MeshStandardMaterial({color:'#f0e8c2',roughness:.9});
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5;mesh(cucumber,new SphereGeometry(.008,8,6),seedMat,[.244,.08+Math.cos(a)*.027,Math.sin(a)*.027]);}
  const cucumberDetail=new Group();cucumberDetail.position.set(1,-.09,.42);cucumberDetail.rotation.y=-.95;table.add(cucumberDetail);cucumberDetail.visible=false;
  const ctx=mesh(cucumberDetail,new SphereGeometry(1,36,24),cucumberMat);ctx.scale.set(.15,.055,.055);
  const face=mesh(cucumberDetail,new CylinderGeometry(.055,.055,.008,24),new MeshStandardMaterial({color:'#d4df9e',roughness:.82}),[.153,0,0]);face.rotation.z=Math.PI/2;
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5;mesh(cucumberDetail,new SphereGeometry(.007,8,6),seedMat,[.159,Math.cos(a)*.026,Math.sin(a)*.026]);}

  // Calories is represented only by a named, non-rendering DOM context anchor.
  const energy=new Group();energy.name='energyDiagram';energy.userData.domOnly=true;energy.userData.itemId=FOOD_ITEM_IDS[7];root.add(energy);anchors.energyDiagram=energy;

  const physical=[anchors.rice,anchors.fish,oil,guava,salt,water,cucumber];
  const details:(Object3D|null)[]=[riceDetail,fishDetail,oilDetail,guavaDetail,saltDetail,waterDetail,cucumberDetail,null];
  const detailFocusTargets:(Object3D|null)[]=[riceDetailAim,fishMacroAim,oilDetail,guavaDetail,saltDetail,waterDetail,cucumberDetail,null];
  // A portrait canvas has much less horizontal world-space than desktop. Keep
  // the anatomy close, but leave enough frame for the gill and attached
  // pectoral fin to remain visible together at the deepest reveal.
  // Tune against the canvas itself: portrait needs a closer food crop, while
  // desktop must preserve the named subject plus context without hitting the
  // bottom control band.
  // Keep the full fish silhouette inside the canvas at every breakpoint.
  // It remains a clear close-up relative to the tableau, without cropping its
  // tail on narrow mobile buffers or desktop split-pane layouts.
  // Portrait props need a stronger camera-relative scale because the scene
  // hero is deliberately smaller there. Landscape macros use separate sizes:
  // the taller viewport otherwise crops bottles/glasses and turns the cucumber
  // into an unrecognizable texture-only close-up.
  const detailScales=compact?[3.5,1.3,3.2,5,3.4,4.2,2.8]:medium?[2.2,1.05,1.5,2.2,2.2,1.8,.65]:[2.2,1.05,1.6,2.4,2,1.9,.65];
  details.forEach((d,i)=>{if(d){d.name=`${FOOD_ITEM_IDS[i]}:detail`;d.userData.itemId=FOOD_ITEM_IDS[i];}});
  physical.forEach((o,i)=>{o.name=FOOD_ITEM_IDS[i];o.userData.itemId=FOOD_ITEM_IDS[i];o.userData.itemIndex=i;});
  anchors.energyDiagram.userData.itemIndex=7;
  // Root hero lookup uses the exact catalog label; English aliases remain useful
  // to scene code and debug tooling without becoming a second mapping system.
  const labels=['শর্করা','আমিষ','স্নেহ','ভিটামিন','খনিজ লবণ','পানি','আঁশ','ক্যালরি'] as const;
  const aliases=['rice','fish','oil','guava','salt','water','cucumber','energyDiagram'] as const;
  labels.forEach((label,i)=>{anchors[label]=anchors[aliases[i]];});
  // Dimensions and seed are explicit for reproducible capture/evidence.
  root.userData.foodTabletop={seed:0x341a,itemIds:FOOD_ITEM_IDS};

  let revealIndex=-1; let reveal=0; let selected=-1;
  const homes=physical.map((o)=>({ position:o.position.clone(), scale:o.scale.clone() }));
  function update(_t:number,dt:number,param:number) {
    // The existing front slider chooses a lesson target. Food stays planted;
    // only the camera/selection changes, never a portion or intake claim.
    selected=Math.min(7,Math.max(0,Math.round(Math.max(0,Math.min(1,param))*7)));
    void dt;
    // The reveal is canonical scene state. Re-applying visibility here matters:
    // update runs every frame, so one-shot visibility writes in setReveal were
    // immediately undone and left the source platter on top of its macro view.
    const macroView=reveal>=.5 && !!details[revealIndex];
    physical.forEach((o,i)=>{const h=homes[i]!;o.position.copy(h.position);o.scale.copy(h.scale);o.visible=!macroView;});
    slab.visible=!macroView; tableGrain.forEach((line)=>{line.visible=!macroView;});
    // Whole/cut produce alternatives change only in their authored groups.
    if(revealIndex===3) guavaCut.visible=reveal>.5;
    if(revealIndex===6) cut.visible=reveal>.5;
  }
  function setReveal(level:number,itemIndex:number) {
    reveal=Math.max(0,Math.min(1,level)); revealIndex=itemIndex;
    const detailProgress=MathUtils.clamp((reveal-.5)/.5,0,1);
    details.forEach((d,i)=>{
      if (!d) return;
      d.visible=i===itemIndex && reveal>=.5;
      // The authored feature must be legible as soon as this state starts;
      // reserve only a modest final enlargement for the remaining slider travel.
      // Fish gets a third, progressive head/gill macro after the whole-fish
      // study. The other food details keep their original restrained scale.
      const fishMacroProgress=MathUtils.smoothstep(reveal,.66,1);
      const fishMacroMagnification=compact?2.65:2.15;
      const scale=i===1
        ? detailScales[i]!*(1+(fishMacroMagnification-1)*fishMacroProgress)
        : detailScales[i]!*(.9+.1*detailProgress);
      d.scale.setScalar(i===itemIndex ? scale : 1);
    });
    // As soon as the enlarged teaching model appears, remove its full-size
    // source to prevent two food silhouettes occupying the same camera ray.
    // The camera and detail scale then track the remaining slider travel.
    const macroView=reveal>=.5 && !!details[itemIndex];
    physical.forEach((o)=>{o.visible=!macroView;});
    slab.visible=!macroView; tableGrain.forEach((line)=>{line.visible=!macroView;});
    // The detail control compares low/high fill of the same fixed vessel.
    // It is not a drinking recommendation or serving-size target.
    oilFill.scale.y=.45+reveal*.5;
    oilDetailFill.scale.y=.45+reveal*.5;
    oilLevel.position.y=.025+.1*(.45+reveal*.5);
    oilLevel.scale.y=.65+reveal*.7;
    waterFill.scale.y=.48+reveal*.8; waterFill.position.y=.025+reveal*.04;
    meniscus.position.y=.054+reveal*.08;
    waterDetailFill.scale.y=.25+reveal*.7;
    waterDetailFill.position.y=.006+.0275*waterDetailFill.scale.y;
    waterDetailSurface.position.y=.006+.055*waterDetailFill.scale.y;
    // Preserve both authored alternatives and interpolate only the defined quantity examples.
    if(itemIndex===0) { /* bowl remains fixed; the grain cluster detail is the authored close view */ }
    if(itemIndex===3) guavaCut.visible=reveal>.5;
    if(itemIndex===6) cut.visible=reveal>.5;
    update(0,0,selected<0?0:selected/7);
  }
  // The tableau rests still; selection and authored detail actions animate.
  update(0,0,.5);
  return { anchors, pickTargets: physical, detailTargets: details, detailFocusTargets, update, setReveal };
}
