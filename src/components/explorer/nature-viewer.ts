import { WebGLRenderer, Scene, PerspectiveCamera, Vector2, Raycaster, Object3D, Box3, Vector3, AmbientLight, DirectionalLight, ACESFilmicToneMapping, SRGBColorSpace, PCFShadowMap, PMREMGenerator } from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { natureChapters } from '../../data/nature-cinema';
import { buildNatureScene, type NatureScene } from './nature-scenes';
import { CinematicCamera } from './cinematic-camera';
import type { HeroHandle, HeroSpec, HeroItem } from './heroes';

export function mountHero(host: HTMLElement, spec:HeroSpec, onFrame?:(info:{yawDeg:number;auto:boolean})=>void, onPick?:(index:number)=>void):HeroHandle {
  const shell=host.closest('.scene')!;const $=<T extends HTMLElement>(s:string)=>shell.querySelector<T>(s)!;
  const canvas=host.querySelector('canvas')!;
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  let reduced=media.matches,playing=!reduced,visible=true,disposed=false,time=0,last=0,raf=0;
  let category=Number(spec.v)||0,item=0,selected=0,depth=0,param=.4,items:HeroItem[]=[];
  const renderer=new WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'default'});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.25));renderer.outputColorSpace=SRGBColorSpace;
  renderer.toneMapping=ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=PCFShadowMap;
  const scene=new Scene();const camera=new PerspectiveCamera(36,1,.05,150);camera.position.set(8,7,11);
  const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.09;controls.enablePan=false;
  controls.maxPolarAngle=Math.PI*.49;controls.minPolarAngle=.2;controls.enableZoom=false;
  // Wheel scrolling belongs to the page. Deliberate close-up buttons own zoom.
  const cameraRig=new CinematicCamera(camera,controls,()=>reduced);
  controls.addEventListener('start',()=>cameraRig.cancel());
  scene.add(new AmbientLight('#dce9e0',.4));
  const key=new DirectionalLight('#fff2d6',3);key.position.set(-4,8,5);key.castShadow=true;
  key.shadow.mapSize.set(1536,1536);key.shadow.camera.left=-6;key.shadow.camera.right=6;key.shadow.camera.top=6;key.shadow.camera.bottom=-6;key.shadow.normalBias=.03;key.shadow.bias=-.0003;scene.add(key);
  const fill=new DirectionalLight('#bdd8f0',1.2);fill.position.set(4,3,-5);scene.add(fill);
  const pmrem=new PMREMGenerator(renderer),room=new RoomEnvironment();const environment=pmrem.fromScene(room,.04);scene.environment=environment.texture;scene.environmentIntensity=.42;room.dispose();pmrem.dispose();
  let model:NatureScene;
  let visibility=new Map<Object3D,boolean>();
  let isolated:Set<Object3D>|null=null;
  const topic=$<HTMLSelectElement>('#nc-topic');
  const caption=$('#nc-caption');const chapter=()=>natureChapters[category];
  const targetButtons=$('#nc-targets');
  const overview=$<HTMLButtonElement>('#nc-overview'),close=$<HTMLButtonElement>('#nc-close'),detail=$<HTMLButtonElement>('#nc-detail');
  const listeners: (()=>void)[]=[];
  function listen(target:EventTarget,type:string,fn:EventListener){target.addEventListener(type,fn);listeners.push(()=>target.removeEventListener(type,fn));}
  function syncUI() {
    shell.setAttribute('data-nature-category',String(category));shell.setAttribute('data-nature-depth',String(depth));
    $('#nc-title').textContent=chapter().title;$('#nc-kicker').textContent=chapter().kicker;
    $('.model-note').textContent=chapter().note;
    const mappedTarget=chapter().map[item]??0;
    targetButtons.querySelectorAll('button').forEach((b,i)=>{
      b.setAttribute('aria-pressed',String(i===selected&&depth>0));
      const name=i===mappedTarget&&items[item]?.label?items[item].label:chapter().targets[i];
      b.textContent=`${['১','২','৩'][i]} · ${name}`;
    });
    overview.setAttribute('aria-pressed',String(depth===0));close.setAttribute('aria-pressed',String(depth===1));detail.setAttribute('aria-pressed',String(depth===2));
    const exactItem=selected===mappedTarget?items[item]:undefined;
    caption.textContent=depth===0
      ?chapter().cue
      :`${exactItem?.label??chapter().targets[selected]} - ${exactItem?.caption??chapter().captions[selected]}`;
    if(depth===2&&category===0&&item===0&&selected===0)caption.textContent='মেঘের ক্ষুদ্র পানিকণা - এখানে অনেক বড় করে দেখানো হয়েছে। এগুলো জলীয় বাষ্প নয়।';
    if(depth===2&&category===0&&item===1&&selected===1)caption.textContent='বৃষ্টির ফোঁটা - বড় ফোঁটা পড়ার সময় কিছুটা চ্যাপ্টা হয়; সব ফোঁটার আকার এক নয়।';
    host.setAttribute('aria-label',`${chapter().title} - ${depth===0?'পুরো দৃশ্য':chapter().targets[selected]}। টেনে ঘোরাও; নিচে একই নিয়ন্ত্রণের বোতাম আছে।`);
  }
  function frame(instant=false) {
    // Context remains visible in overview. Close-up removes unrelated siblings,
    // and depth 2 focuses an actual descendant, not a label hovering above it.
    visibility.forEach((show,node)=>node.visible=show);
    let subject:Object3D=depth===0?model.root:depth===1?model.targets[selected]:model.details[selected];
    if(new Box3().setFromObject(subject).isEmpty())subject=model.targets[selected];
    isolated=null;
    if(depth>0){
      const path=new Set<Object3D>();let parent:Object3D|null=subject;while(parent){path.add(parent);parent=parent.parent;}
      subject.traverse(node=>path.add(node));isolated=path;model.root.traverse(node=>{if(!path.has(node))node.visible=false;});
      subject.visible=true;
    }
    cameraRig.frame(subject,instant);syncUI();
  }
  function build() {
    if(model){scene.remove(model.root);model.dispose();}
    model=buildNatureScene(category,item);scene.add(model.root);model.update(time,param);
    visibility=new Map();model.root.traverse(node=>visibility.set(node,node.visible));
    targetButtons.replaceChildren(...chapter().targets.map((name,i)=>{const b=document.createElement('button');b.type='button';b.textContent=`${['১','২','৩'][i]} · ${name}`;b.dataset.target=String(i);return b;}));
    frame();
  }
  function updateLighting() {
    if(category===4){key.position.set(-5+param*10,3+Math.sin(param*Math.PI)*6,5);key.intensity=1.6+Math.sin(param*Math.PI)*1.4;}
    else {key.position.set(-4,8,5);key.intensity=3;}
  }
  function focus(index:number) {
    if(index<0){depth=0;frame();return;}
    const next=Math.max(0,Math.min(items.length-1,index)),changed=next!==item;item=next;topic.value=String(item);
    selected=chapter().map[item]??0;depth=1;
    if(category===1){param=(item<6?item:Math.floor((item-6)/2))/6+.04;const slider=$<HTMLInputElement>('#ctl');slider.value=String(Math.round(param*100));}
    if(changed&&(category===0||category===4))build();else frame();
  }
  listen(topic,'change',()=>onPick?.(+topic.value));
  listen(overview,'click',()=>{depth=0;frame();});
  listen(close,'click',()=>{depth=1;frame();});
  listen(detail,'click',()=>{depth=2;frame();});
  listen(targetButtons,'click',e=>{const b=(e.target as HTMLElement).closest<HTMLButtonElement>('button[data-target]');if(b){selected=+b.dataset.target!;depth=1;frame();}});
  const ray=new Raycaster(),pointer=new Vector2();let down=[0,0];
  listen(canvas,'pointerdown',e=>{const p=e as PointerEvent;down=[p.clientX,p.clientY];});
  listen(canvas,'pointerup',e=>{
    const p=e as PointerEvent;if(Math.hypot(p.clientX-down[0],p.clientY-down[1])>6)return;
    const r=canvas.getBoundingClientRect();pointer.set((p.clientX-r.left)/r.width*2-1,-(p.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);
    const hits=ray.intersectObjects(model.targets.filter(g=>g.visible),true);
    if(!hits.length)return;let node:Object3D|null=hits[0].object;
    while(node&&!model.targets.includes(node as never))node=node.parent;
    if(node){const i=model.targets.indexOf(node as never);depth=i===selected?Math.min(2,depth+1):1;selected=i;frame();}
  });
  canvas.tabIndex=0;
  listen(canvas,'keydown',e=>{const event=e as KeyboardEvent;
    if(event.key==='Escape'){depth=0;frame();}
    if(event.key==='Enter'){depth=Math.min(2,depth+1);frame();}
    if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();selected=(selected+(event.key==='ArrowLeft'?2:1))%3;depth=1;frame();}
  });
  build();
  const resize=()=>{const r=host.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();cameraRig.resize();};
  const ro=new ResizeObserver(resize);ro.observe(host);resize();
  const tick=(now:number)=>{raf=0;if(disposed||!visible||document.hidden)return;const dt=Math.min(.05,(now-last)/1000||0);last=now;if(playing&&!reduced)time+=dt;
    model.update(time,param);updateLighting();if(isolated)model.root.traverse(node=>{if(!isolated!.has(node))node.visible=false;});controls.update();cameraRig.tick(now);renderer.render(scene,camera);onFrame?.({yawDeg:controls.getAzimuthalAngle()*180/Math.PI,auto:playing});raf=requestAnimationFrame(tick);
  };
  const start=()=>{if(!raf&&!disposed){last=performance.now();raf=requestAnimationFrame(tick);}};
  const io=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible)start();});io.observe(host);
  listen(document,'visibilitychange',()=>{if(!document.hidden)start();});
  listen(media,'change',()=>{reduced=media.matches;if(reduced)playing=false;frame(true);});
  listen(canvas,'webglcontextlost',e=>{e.preventDefault();playing=false;caption.textContent='থ্রিডি বন্ধ হয়েছে। পাতা আবার খুলে চেষ্টা করো; নিচে সব পাঠ ও কাজ পড়া যাবে।';});
  start();
  return {
    set(s){category=Math.max(0,Math.min(7,Number(s.v)||0));item=0;selected=0;depth=0;param=s.p??.4;build();return chapter().control;},
    setItems(list,active){items=list;item=Math.max(0,active);topic.replaceChildren(...items.map((v,i)=>{const option=document.createElement('option');option.value=String(i);option.textContent=v.label;return option;}));topic.value=String(item);selected=chapter().map[item]??0;depth=0;build();},
    focus,
    setParam(v){param=Math.max(0,Math.min(1,v));if(category===1){const season=Math.min(5,Math.floor(param*6));caption.textContent=`${['গ্রীষ্ম','বর্ষা','শরৎ','হেমন্ত','শীত','বসন্ত'][season]} - ${chapter().cue}`;}model.update(time,param);if(category===3||category===7)frame(true);},
    setAuto(on){playing=on;},isAuto:()=>playing,
    setExplode(){/* Nature has authored process controls, never generic mesh explosions. */},
    resetView(){depth=0;frame();},
    badgeAt(i){const node=model.targets[chapter().map[i]??0];const p=new Box3().setFromObject(node).getCenter(new Vector3()).project(camera);return{x:(p.x+1)/2*host.clientWidth,y:(1-p.y)/2*host.clientHeight};},
    destroy(){disposed=true;cancelAnimationFrame(raf);io.disconnect();ro.disconnect();listeners.forEach(off=>off());controls.dispose();model.dispose();environment.dispose();renderer.dispose();},
  };
}
