import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Box3, Vector3, PerspectiveCamera, Group, Mesh, BoxGeometry, MeshBasicMaterial } from 'three';
import { fitDistance, fitBoxDistance, visibleBounds } from '../src/components/explorer/cinematic-camera.ts';
import { natureChapters } from '../src/data/nature-cinema.ts';
import { worlds } from '../src/data/worlds.ts';

test('all eight chapters and 89 lesson mappings are covered',()=>{
  const world=worlds.find(w=>w.slug==='nature');
  assert.ok(world);
  assert.equal(natureChapters.length,world.cats.length);
  let total=0;
  world.cats.forEach((cat,i)=>{
    const chapter=natureChapters[i];assert.equal(chapter.map.length,cat.items.length,cat.n);
    chapter.map.forEach(target=>assert.ok(target>=0&&target<chapter.targets.length));
    assert.equal(chapter.targets.length,3);assert.equal(chapter.captions.length,3);
    for(const text of [chapter.cue,chapter.control,chapter.note,...chapter.captions])assert.ok(text.length>0);
    total+=cat.items.length;
  });
  assert.equal(total,89);
});

test('overview, tall subjects, flat terrain and tiny details fit portrait and landscape frames',()=>{
  const direction=new Vector3(.85,.62,1.2).normalize();
  for(const aspect of [360/460,768/560,1100/640,1440/600]) {
    for(const [width,height,depth] of [[8,5,8],[1,8,1],[8,.25,8],[.3,.1,.5],[4,1.8,2]]) {
      const box=new Box3(new Vector3(-width/2,-height/2,-depth/2),new Vector3(width/2,height/2,depth/2));
      const camera=new PerspectiveCamera(36,aspect,.01,200);
      camera.position.copy(direction).multiplyScalar(fitBoxDistance(box,direction,36,aspect));camera.lookAt(0,0,0);camera.updateMatrixWorld(true);
      for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){
        const screen=new Vector3(x,y,z).project(camera);
        assert.ok(Math.abs(screen.x)<1&&Math.abs(screen.y)<1,`${aspect}: ${width},${height},${depth}`);
      }
    }
  }
});

test('hidden detail models do not push the overview camera away',()=>{
  const root=new Group();const main=new Mesh(new BoxGeometry(2,2,2),new MeshBasicMaterial());root.add(main);
  const hidden=new Group();hidden.visible=false;const far=main.clone();far.position.set(200,200,200);hidden.add(far);root.add(hidden);
  assert.deepEqual(visibleBounds(root).getSize(new Vector3()).toArray(),[2,2,2]);
  assert.ok(fitDistance(1,36,.5)>fitDistance(1,36,2));
});
