import {
  Group, Mesh, MeshStandardMaterial, MeshPhysicalMaterial, CylinderGeometry, SphereGeometry,
  BoxGeometry, ConeGeometry, TorusGeometry, CircleGeometry, BufferGeometry, Float32BufferAttribute, ShaderMaterial,
  Color, CanvasTexture, RepeatWrapping, SRGBColorSpace, DoubleSide, InstancedMesh, Object3D,
  Vector3, TubeGeometry, CatmullRomCurve3, Points, PointsMaterial,
} from 'three';

export type NatureScene = {
  root: Group; targets: Group[]; details: Object3D[];
  update(time: number, parameter: number): void;
  dispose(): void;
};

// Original deterministic geometry and textures. No downloaded/licensed model dependencies.
function random(seed: number) { let s = seed; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const noise = (x: number, z: number) => Math.sin(x * 2.17 + Math.cos(z * 1.7)) * .5 + Math.sin(z * 4.3 + x * 3.1) * .22 + Math.sin(x * 11.2 - z * 7.8) * .08;
const mat = (color: string, roughness = .83) => new MeshStandardMaterial({ color, roughness, metalness: 0 });
function mesh(parent: Group, geometry: BufferGeometry, material: MeshStandardMaterial, x = 0, y = 0, z = 0) {
  const m = new Mesh(geometry, material); m.position.set(x,y,z); m.castShadow = m.receiveShadow = true; parent.add(m); return m;
}
function texture(kind: 'bark' | 'rock') {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const cx = c.getContext('2d')!; const rng = random(76);
  const im = cx.createImageData(256,256);
  for (let y=0;y<256;y++) for (let x=0;x<256;x++) {
    const n = kind === 'bark' ? Math.sin(x*.38 + Math.sin(y*.03)*2)*28 + Math.sin(x*1.3)*15 : noise(x*.1,y*.1)*35;
    const i=(y*256+x)*4, v=126+n+rng()*32;
    im.data[i]=v; im.data[i+1]=v; im.data[i+2]=v; im.data[i+3]=255;
  }
  cx.putImageData(im,0,0); const t=new CanvasTexture(c); t.wrapS=t.wrapT=RepeatWrapping; t.repeat.set(3,2); return t;
}
function branch(parent: Group, start: Vector3, end: Vector3, radius: number, material: MeshStandardMaterial) {
  const d=end.clone().sub(start); const m=mesh(parent,new CylinderGeometry(radius*.4,radius,d.length(),9,3),material);
  m.position.copy(start).addScaledVector(d,.5); m.quaternion.setFromUnitVectors(new Vector3(0,1,0),d.normalize()); return m;
}

/** Curved lanceolate leaves with a raised central vein, rather than foliage balls. */
function leafGeometry() {
  const pos:number[]=[], uv:number[]=[], ix:number[]=[];
  for(let y=0;y<=12;y++) for(let x=0;x<3;x++) {
    const t=y/12, side=x-1; pos.push(side*Math.sin(t*Math.PI)*.14,t*.64,Math.sin(t*Math.PI)*.07*(1-Math.abs(side)) + t*t*.09);
    uv.push(x/2,t);
  }
  for(let y=0;y<12;y++) for(let x=0;x<2;x++) { const i=y*3+x; ix.push(i,i+1,i+3,i+1,i+4,i+3); }
  const g=new BufferGeometry(); g.setAttribute('position',new Float32BufferAttribute(pos,3)); g.setAttribute('uv',new Float32BufferAttribute(uv,2)); g.setIndex(ix); g.computeVertexNormals(); return g;
}
function leafTexture() {
  const c=document.createElement('canvas');c.width=128;c.height=256;const cx=c.getContext('2d')!;
  const grad=cx.createLinearGradient(0,0,128,0);grad.addColorStop(0,'#85984a');grad.addColorStop(.47,'#d2d9a7');grad.addColorStop(.5,'#edf0c9');grad.addColorStop(.53,'#b9c68b');grad.addColorStop(1,'#718c43');cx.fillStyle=grad;cx.fillRect(0,0,128,256);
  cx.strokeStyle='#adb977';cx.lineWidth=1.3;
  for(let y=20;y<250;y+=18){cx.beginPath();cx.moveTo(64,y);cx.lineTo(0,y-35);cx.moveTo(64,y);cx.lineTo(128,y-35);cx.stroke();}
  const t=new CanvasTexture(c);t.colorSpace=SRGBColorSpace;return t;
}
function tree(parent: Group, x: number, y: number, z: number, scale = 1, mangrove = false) {
  const g=new Group(); g.position.set(x,y,z); g.scale.setScalar(scale); parent.add(g);
  const bark=mat('#695342'); bark.bumpMap=texture('bark'); bark.bumpScale=.075;
  branch(g,new Vector3(0,0,0),new Vector3(.08,1.9,0),.14,bark);
  const rng=random(218); const leafMat=mat('#8bab64',.73); leafMat.side=DoubleSide;leafMat.map=leafTexture();
  const leaves=new InstancedMesh(leafGeometry(),leafMat,1040); leaves.castShadow=true; leaves.receiveShadow=true; g.add(leaves);
  const dummy=new Object3D(); let index=0;
  for(let j=0;j<13;j++) {
    const a=j*2.399, h=.65+j*.095;
    const end=new Vector3(Math.cos(a)*(.7+rng()*.45),h+.65+rng()*.3,Math.sin(a)*(.7+rng()*.45));
    const start=new Vector3(.06,h,0); branch(g,start,end,.038,bark);
    for(let k=0;k<80;k++) {
      const t=.25+rng()*.85; dummy.position.copy(start).lerp(end,t);
      dummy.position.x+=(rng()-.5)*.5; dummy.position.y+=(rng()-.3)*.48; dummy.position.z+=(rng()-.5)*.5;
      dummy.rotation.set(rng()*2.8,rng()*Math.PI*2,rng()*Math.PI*2); dummy.scale.setScalar(.28+rng()*.4); dummy.updateMatrix();
      leaves.setMatrixAt(index,dummy.matrix); leaves.setColorAt(index++,new Color().setHSL(.21+rng()*.06,.3+rng()*.2,.36+rng()*.22));
    }
  }
  const roots=new Group(); g.add(roots);
  for(let j=0;j<12;j++) {
    const a=j*2.4; const r=.3+rng()*.6;
    branch(roots,new Vector3(Math.cos(a)*r,-.12,Math.sin(a)*r),new Vector3(mangrove?Math.cos(a)*r:0,mangrove?.25:.5,mangrove?Math.sin(a)*r:0),.025,bark);
  }
  return {group:g,leaves,roots};
}

function terrain(parent: Group, mode: 'mountain'|'wetland'|'coast'|'field' = 'mountain') {
  const land=new Group(); parent.add(land);
  const ring=72, rows=48, pos:number[]=[], colors:number[]=[], ix:number[]=[];
  const height=(x:number,z:number) => {
    const r=Math.hypot(x,z)/3.7;
    const peak=(Math.exp(-((x+1.6)**2/1.1+(z+1.05)**2/2.7))*2.1 + Math.exp(-((x-.7)**2/.85+(z+1.75)**2/1.4))*1.45)*(1+noise(x*2,z*2)*.28);
    const channel=Math.abs(x-Math.sin(z*1.1)*.55);
    const bank=Math.min(1,channel/ .63);
    const base=mode==='mountain' ? .27+peak+noise(x,z)*.14 : mode==='field' ? .25+noise(x,z)*.06 : .15+noise(x,z)*.1;
    return (base*bank-.06)*(Math.min(1,Math.max(0,(1-r)*7))) - Math.max(0,(r-.91)*3.2);
  };
  for(let r=0;r<=rows;r++) for(let a=0;a<=ring;a++) {
    const angle=a/ring*Math.PI*2, rad=r/rows*3.7;
    const x=Math.cos(angle)*rad,z=Math.sin(angle)*rad,y=height(x,z);
    pos.push(x,y,z);
    const c=new Color(y>.9?'#787b67': mode==='coast'?'#cfbe8c':'#658449');
    if(y>1.75)c.lerp(new Color('#c6c9b7'),Math.min(1,(y-1.75)*1.3));
    if(y<.08)c.set('#b7a377');
    c.multiplyScalar(.86+noise(x*3,z*3)*.12); colors.push(c.r,c.g,c.b);
  }
  for(let r=0;r<rows;r++) for(let a=0;a<ring;a++){const i=r*(ring+1)+a;ix.push(i,i+1,i+ring+1,i+1,i+ring+2,i+ring+1);}
  const geo=new BufferGeometry();geo.setAttribute('position',new Float32BufferAttribute(pos,3));geo.setAttribute('color',new Float32BufferAttribute(colors,3));geo.setIndex(ix);geo.computeVertexNormals();
  const material=mat('#ffffff');material.vertexColors=true;material.bumpMap=texture('rock');material.bumpScale=.13;
  mesh(land,geo,material);
  const layers=new Group();parent.add(layers);
  const strata=['#796952','#88765c','#62665b'];
  const slabs=strata.map((c,i)=>{const m=mat(c);m.bumpMap=texture('rock');m.bumpScale=.15;return mesh(layers,new CylinderGeometry(3.66-i*.03,3.64-i*.03,.23,88,2),m,0,-.38-i*.23,0);});
  return {land,layers,slabs,height};
}
function water(parent: Group) {
  const g=new Group();parent.add(g);
  const m=new MeshPhysicalMaterial({color:'#237e89',roughness:.21,metalness:.18,clearcoat:.8,clearcoatRoughness:.15,transparent:true,opacity:.86});
  const geo=new CircleGeometry(3.74,128);geo.rotateX(-Math.PI/2);
  const sea=mesh(g,geo,m,0,.035,0);sea.castShadow=false;
  const p=geo.getAttribute('position');
  return {group:g,sea,update(t:number){for(let i=0;i<p.count;i++)p.setY(i,Math.sin(p.getX(i)*5+t*.8)*.009+Math.cos(p.getZ(i)*7-t*.7)*.006);p.needsUpdate=true;geo.computeVertexNormals();}};
}
function cloud(parent: Group, x=0,y=3.3,z=-.7) {
  const group=new Group();parent.add(group);group.position.set(x,y,z);
  const material=new ShaderMaterial({transparent:true,depthWrite:false,
    vertexShader:`varying vec3 point; varying vec3 origin; void main(){point=position; origin=(inverse(modelMatrix)*vec4(cameraPosition,1.)).xyz; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`precision highp float; varying vec3 point; varying vec3 origin;
    float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
    float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
    void main(){vec3 dir=normalize(point-origin),p=point+dir*.005;vec4 sum=vec4(0.);for(int i=0;i<48;i++){
      if(any(greaterThan(abs(p),vec3(2.,.9,1.))))break;
      float shape=1.-length(p/vec3(1.9,.78,.88));
      float n=noise(p*3.6)*.55+noise(p*8.8)*.24+noise(p*18.)*.11;
      float density=max(0.,shape-n*.4+.04)*.42;
      vec3 col=mix(vec3(.38,.48,.52),vec3(1.,.99,.94),smoothstep(-.8,.6,p.y));
      sum.rgb+=(1.-sum.a)*density*col;sum.a+=(1.-sum.a)*density;
      if(sum.a>.97)break;p+=dir*.075;
    }if(sum.a<.015)discard; gl_FragColor=vec4(sum.rgb/max(sum.a,.001),sum.a);}`});
  group.add(new Mesh(new BoxGeometry(4,1.8,2),material));
  return group;
}
function waterMicro(parent:Group, rain=false) {
  const g=new Group();parent.add(g);g.visible=false;g.position.set(0,2.5,0);
  const material=new MeshPhysicalMaterial({color:'#b2edf4',roughness:.05,metalness:.15,clearcoat:1,clearcoatRoughness:.05});
  for(let i=0;i<(rain?3:15);i++){
    const a=i*2.399,r=rain?i*.65:Math.sqrt(i)*.24;
    const drop=mesh(g,new SphereGeometry(rain?.22:.07+(i%3)*.025,24,16),material,Math.cos(a)*r,Math.sin(a)*r*.6,(i%3)*.16);
    if(rain)drop.scale.y=.82;
  }return g;
}
function leafMicro(parent:Group) {
  const g=new Group();parent.add(g);g.visible=false;
  const material=mat('#90b267',.58);material.map=leafTexture();material.side=DoubleSide;
  const blade=mesh(g,leafGeometry(),material);blade.scale.setScalar(3.5);blade.rotation.x=-.55;
  const drops=new MeshPhysicalMaterial({color:'#bfebd8',roughness:.03,metalness:.12,clearcoat:1,transparent:true,opacity:.88});
  for(let i=0;i<8;i++)mesh(g,new SphereGeometry(.045+(i%3)*.015,20,12),drops,(i%2?-.16:.19),.4+i*.18,-.04-i*.04);
  return g;
}
function precipitation(parent: Group, count=320) {
  const g=new Group();parent.add(g);const a=new Float32Array(count*3), rng=random(41);
  for(let i=0;i<count;i++){a[i*3]=(rng()-.5)*3.2;a[i*3+1]=rng()*2.8;a[i*3+2]=(rng()-.5)*2;}
  const geo=new BufferGeometry();geo.setAttribute('position',new Float32BufferAttribute(a,3));
  const pts=new Points(geo,new PointsMaterial({color:'#bee9ed',size:.035,transparent:true,opacity:.8,depthWrite:false}));g.add(pts);
  return {group:g,update(t:number,p:number){pts.visible=p>.05;geo.setDrawRange(0,Math.floor(count*p));const pos=geo.getAttribute('position');for(let i=0;i<count;i++)pos.setY(i,3-((a[i*3+1]+t*1.8)%3));pos.needsUpdate=true;}};
}
function house(parent:Group,x:number,z:number) {
  const g=new Group();g.position.set(x,.4,z);parent.add(g);
  const cement=mat('#dedcc9'),wood=mat('#47655b');
  for(const a of [-.55,.55]) for(const b of [-.4,.4]) mesh(g,new CylinderGeometry(.055,.055,.7,8),cement,a,.1,b);
  mesh(g,new BoxGeometry(1.4,.12,1.1),cement,0,.5,0);
  mesh(g,new BoxGeometry(1.24,.8,.9),cement,0,.95,0);
  const roof=mesh(g,new ConeGeometry(1.02,.5,4),mat('#5b706c'),0,1.57,0);roof.rotation.y=Math.PI/4;roof.scale.z=.82;
  mesh(g,new BoxGeometry(.26,.52,.04),wood,.25,.84,.46);
  for(const a of [-.4,.35]) mesh(g,new BoxGeometry(.26,.22,.04),mat('#284e57'),a,1.11,.46);
  for(let i=0;i<5;i++)mesh(g,new BoxGeometry(.4,.1,.18),cement,.25,.05+i*.1,.95-i*.09);
  return g;
}
function fish(parent:Group,x:number,z:number) {
  const g=new Group();parent.add(g);g.position.set(x,.14,z);
  const b=mesh(g,new SphereGeometry(.19,20,12),mat('#c4a66e',.38));b.scale.set(1,.48,.4);
  const tail=mesh(g,new ConeGeometry(.11,.16,3),mat('#b3864c'),-.23,0,0);tail.rotation.z=-Math.PI/2;
  mesh(g,new SphereGeometry(.025,8,6),mat('#111d1e'),.13,.035,.065);
  return g;
}
function mushrooms(parent:Group,x:number,y:number,z:number) {
  const g=new Group();g.position.set(x,y,z);parent.add(g);
  for(let i=0;i<7;i++){const a=i*2.4,r=.15+i*.04,h=.13+i*.025;
    mesh(g,new CylinderGeometry(.023,.03,h,8),mat('#cfc5a9'),Math.cos(a)*r,h/2,Math.sin(a)*r);
    const cap=mesh(g,new SphereGeometry(.11,16,10,0,Math.PI*2,0,Math.PI/2),mat('#a57145'),Math.cos(a)*r,h,Math.sin(a)*r);cap.scale.y=.5;
  }return g;
}
function bag(parent:Group) {
  const g=new Group();parent.add(g);g.position.set(1.8,.65,.7);
  const b=mesh(g,new BoxGeometry(.65,.82,.32,2,2,2),mat('#b66d3e'));b.geometry.computeVertexNormals();
  mesh(g,new BoxGeometry(.53,.34,.10),mat('#c68850'),0,-.15,.2);
  const handle=mesh(g,new TorusGeometry(.17,.027,8,20,Math.PI),mat('#604b36'),0,.41,0);
  const supplies=new Group();g.add(supplies);
  mesh(supplies,new CylinderGeometry(.08,.08,.32,16),new MeshPhysicalMaterial({color:'#8fdae0',roughness:.2,metalness:.1}),-.27,.15,.34);
  mesh(supplies,new BoxGeometry(.28,.19,.11),mat('#ece8cb'),.18,.05,.38);
  mesh(supplies,new CylinderGeometry(.06,.075,.3,12),mat('#384d50'),.3,.2,.26).rotation.z=.4;
  mesh(supplies,new BoxGeometry(.09,.03,.012),mat('#b74732'),.18,.05,.443);
  mesh(supplies,new BoxGeometry(.03,.09,.012),mat('#b74732'),.18,.05,.443);
  return {group:g,supplies,handle};
}

export function buildNatureScene(category:number,item:number):NatureScene {
  const root=new Group(); const updates:((t:number,p:number)=>void)[]=[];
  const targetGroups=[new Group(),new Group(),new Group()];targetGroups.forEach(g=>root.add(g));
  const [a,b,c]=targetGroups; const details:Object3D[]=[];
  const geography=category===4;
  const mode = geography ? ([0,3,6].includes(item)?'wetland':[1,2,7].includes(item)?'coast':'mountain') : category===1||category===6||category===7?'field':category===5?'wetland':'mountain';
  const tr=terrain(category===3?a:c,mode);
  const wa=water(category===2||category===6?b:category===3?b:c); updates.push(t=>wa.update(t));
  const canopy=new Group();a.add(canopy);
  const treePositions: [number,number,number][]=[[-1.85,1.1,.85],[1.8,1.2,-.4],[-2.4,.7,-.1],[2.4,.65,1.1]];
  const trees=treePositions.map(([x,s,z])=>tree(canopy,x,tr.height(x,z),z,s*(geography&&item===4?.4:category===7?.55:.65),geography&&item===0));
  details[0]=trees[0].group; details[1]=wa.sea; details[2]=tr.layers;
  // Tiny growth and wind, not whole-scene bobbing. Animation can be paused completely.
  updates.push(t=>trees.forEach((tree,i)=>{tree.leaves.rotation.z=Math.sin(t*.6+i)*.014;}));
  if(category===0) {
    a.remove(canopy);c.add(canopy);
    cloud(a);const rain=precipitation(b);updates.push((t,p)=>rain.update(t,item===1||item===3?Math.max(.5,p):p*.7));
    const leaf=tree(c,1.8,.8,1.8,.7).group; details[0]=waterMicro(a);details[1]=waterMicro(b,true);details[2]=leafMicro(c);
    const dropMat=new MeshPhysicalMaterial({color:'#a4e5e6',roughness:.06,metalness:.15,clearcoat:1,transparent:true,opacity:.85});
    for(let i=0;i<9;i++)mesh(leaf,new SphereGeometry(.022+i*.003,12,8),dropMat,.14+i*.045,1.35+i*.015,.16);
    if([7,8].includes(item)) {
      const spiral=new Group();a.add(spiral);
      for(let i=0;i<18;i++){const r=.16+i*.048;const ring=mesh(spiral,new TorusGeometry(r,.013,5,60),mat('#96a6a6'),0,.5+i*.11,0);ring.rotation.x=Math.PI/2;ring.scale.z=.55;}
      updates.push(t=>spiral.rotation.y=t*.35);details[0]=spiral;
    }
    if(item===3) (rain.group.children[0] as Points).material=new PointsMaterial({color:'#ffffff',size:.085});
    if(item===4){const fog=cloud(a,0,.45,0);fog.scale.set(1.5,.35,1);}
  } else if(category===1) {
    const cl=cloud(c,0,3,-1.4);const rain=precipitation(c);
    const field=new Group();b.add(field);const grains:Mesh[]=[];
    for(let i=0;i<84;i++) {const x=.9+(i%12)*.11,z=.65+Math.floor(i/12)*.13;
      grains.push(mesh(field,new ConeGeometry(.025,.37,4),mat('#afaa4f'),x,tr.height(x,z)+.17,z));}
    const seasonColors=['#6f963d','#39713d','#649a4f','#82974e','#6d7952','#579047'];
    updates.push((t,p)=>{const s=Math.min(5,Math.floor(p*6));trees.forEach(tree=>(tree.leaves.material as MeshStandardMaterial).color.set(seasonColors[s]));rain.update(t,s===1?.7:0);cl.visible=s===1||s===2;grains.forEach(g=>g.material instanceof MeshStandardMaterial&&g.material.color.set(s===3?'#c6a44c':'#7d9a48'));});
    details[1]=field;details[2]=cl;
  } else if(category===2) {
    // Reparent real teaching subjects so each focus isolates one process.
    a.remove(canopy);c.add(canopy); a.add(wa.group);cloud(b);const rain=precipitation(b);
    const path=new CatmullRomCurve3([new Vector3(0,.15,2),new Vector3(2.3,1.6,1),new Vector3(1.2,3.3,-.6),new Vector3(-1,3.2,-1),new Vector3(-1,.7,-1),new Vector3(0,.14,2)]);
    const travelers=new Group();a.add(travelers);
    for(let i=0;i<18;i++)mesh(travelers,new SphereGeometry(.027,8,6),new MeshStandardMaterial({color:'#c8eee6',emissive:'#80cabb',emissiveIntensity:.7}));
    updates.push((t,p)=>{travelers.children.forEach((o,i)=>o.position.copy(path.getPointAt((i/18+t*.025+p*.3)%1)));rain.update(t,.35);});
    details[0]=wa.group;details[1]=waterMicro(b);details[2]=tr.layers;
  } else if(category===3) {
    // Layer separation is an authored geological cutaway, not an arbitrary mesh explosion.
    c.add(tr.layers);details[0]=tr.land;details[1]=wa.group;details[2]=tr.layers;
    updates.push((_t,p)=>tr.slabs.forEach((m,i)=>m.position.y=-.38-i*.23-p*(i+1)*.3));
  } else if(category===4) {
    b.add(wa.group);c.add(tr.land);c.add(tr.layers);
    if([1,2,3,7].includes(item)) canopy.visible=item===3;
    if(item===4) for(let r=0;r<4;r++) for(let j=0;j<6;j++){const x=-2+j*.5,z=.1+r*.45;tree(a,x,tr.height(x,z),z,.18);}
    if(item===7){const bridge=new Group();c.add(bridge);mesh(bridge,new BoxGeometry(5.2,.12,.5),mat('#9eaaab'),0,.65,.6);for(let i=0;i<8;i++)mesh(bridge,new CylinderGeometry(.07,.09,.72,8),mat('#bfc2b6'),-2.3+i*.65,.28,.6);details[2]=bridge;}
    details[0]=canopy;details[1]=wa.group;
  } else if(category===5) {
    b.add(wa.group);const fishes=[fish(b,0,1.4),fish(b,.2,.65),fish(b,-.15,2.1)];
    const fungi=mushrooms(c,-1.4,.25,2);details[1]=fishes[0];details[2]=fungi;
    updates.push((t,p)=>fishes.forEach((f,i)=>{f.position.z=.8+i*.4+Math.sin(t*(.2+p*.4)+i)*.3;f.rotation.y=Math.cos(t*.3+i)*.4;}));
  } else if(category===6) {
    const solar=new Group();c.add(solar);solar.position.set(-1.35,.55,1.6);
    const panel=mesh(solar,new BoxGeometry(1.1,.055,.7),mat('#1c3e58',.28));panel.rotation.x=-.35;
    for(let i=0;i<5;i++)mesh(solar,new BoxGeometry(.012,.009,.65),mat('#95b2bc'),-.45+i*.22,.065,0).rotation.x=-.35;
    const rubbish=new Group();b.add(rubbish);
    for(let i=0;i<14;i++){const bottle=mesh(rubbish,new CylinderGeometry(.035,.07,.23,10),mat(i%2?'#a2bec1':'#bc9361',.4),Math.sin(i)*.35,.14,Math.cos(i*2)*2.7);bottle.rotation.z=1.2;}
    updates.push((_t,p)=>rubbish.children.forEach((o,i)=>o.visible=i/14>p));details[1]=rubbish;details[2]=solar;
  } else if(category===7) {
    canopy.scale.setScalar(.65);const home=house(a,-1.15,0); const pack=bag(b);
    const route=new CatmullRomCurve3([new Vector3(2,.29,2.1),new Vector3(1,.3,2),new Vector3(-1,.45,1.3),new Vector3(-.9,.9,.8)]);
    const road=mesh(c,new TubeGeometry(route,32,.09,8,false),mat('#d4b777'));
    updates.push((_t,p)=>{pack.supplies.position.y=p*.9;});details[0]=home;details[1]=pack.supplies;details[2]=road;
  }
  root.updateMatrixWorld(true);
  return {root,targets:targetGroups,details,
    update(t,p){for(const update of updates)update(t,p);},
    dispose(){const geometries=new Set<BufferGeometry>(),materials=new Set<MeshStandardMaterial>(),textures=new Set<CanvasTexture>();root.traverse(o=>{
      const m=o as Mesh;if(m.geometry)geometries.add(m.geometry);if(m.material)for(const material of Array.isArray(m.material)?m.material:[m.material]){materials.add(material as MeshStandardMaterial);for(const v of Object.values(material))if(v instanceof CanvasTexture)textures.add(v);}
    });geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());},
  };
}
