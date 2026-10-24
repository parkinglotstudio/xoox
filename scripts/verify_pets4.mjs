// Exported-asset checks using the same GLTFLoader and AnimationMixer as the tool.
// This reads local GLBs in Node. It does not open a browser or render the tool.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';

const root=process.cwd(),ids=['nofilter','flux','lumos','gizmo'];
const expected=['idle_stand','idle_sit','idle_look','walk','run','attack_laser','stand_up','sit_down'];
const loader=new GLTFLoader(),results=[];
for(const id of ids){
 const base=path.join(root,'data/tools/unit_lab/pets',id),buffer=await fs.readFile(path.join(base,id+'.glb'));
 const metrics=JSON.parse(await fs.readFile(path.join(base,'manifest.json'),'utf8'));
 const g=await loader.parseAsync(buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength),'');
 assert.deepEqual(g.animations.map(c=>c.name).sort(),expected.slice().sort(),id+' clips');
 let tris=0,skins=0;const materials=new Set();g.scene.traverse(o=>{if(o.isMesh){tris+=o.geometry.index.count/3;(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));if(o.isSkinnedMesh){skins++;assert.equal(o.skeleton.bones.length,29);const w=o.geometry.attributes.skinWeight;for(let i=0;i<w.count;i++)assert.ok(Math.abs(w.getX(i)+w.getY(i)+w.getZ(i)+w.getW(i)-1)<1e-5);}}});
 assert.equal(tris,metrics.triangles,id+' triangles');assert.equal(materials.size,2);assert.ok(skins<=2);
 const mixer=new THREE.AnimationMixer(g.scene);let minY=Infinity;const sampled={};
 for(const name of expected){
  mixer.stopAllAction();const clip=g.animations.find(c=>c.name===name),a=mixer.clipAction(clip);a.setLoop(THREE.LoopOnce,1);a.clampWhenFinished=true;a.play();
  const poses=[];
  for(const f of [0,.25,.5,.75,1]){
   a.time=f*clip.duration;mixer.update(0);g.scene.updateMatrixWorld(true);const p=g.scene.getObjectByName('front_pawL').getWorldPosition(new THREE.Vector3());poses.push(p.toArray());
   g.scene.traverse(o=>{if(o.isSkinnedMesh){o.skeleton.update();o.computeBoundingBox();const b=o.boundingBox.clone().applyMatrix4(o.matrixWorld);assert.ok(Number.isFinite(b.min.y)&&Number.isFinite(b.max.y));minY=Math.min(minY,b.min.y);}});
  }
  sampled[name]={duration:clip.duration,paw_samples:poses};
  if(['idle_stand','idle_sit','idle_look','walk','run'].includes(name))assert.ok(new THREE.Vector3().fromArray(poses[0]).distanceTo(new THREE.Vector3().fromArray(poses[4]))<1e-4,id+' loop '+name);
 }
 assert.ok(minY>-.01,id+' floor penetration '+minY);
 const walkStride=Math.abs(sampled.walk.paw_samples[0][2]-sampled.walk.paw_samples[2][2]),runStride=Math.abs(sampled.run.paw_samples[0][2]-sampled.run.paw_samples[2][2]);
 assert.ok(runStride>walkStride*1.4,id+' run stride');assert.ok(sampled.run.duration<sampled.walk.duration,id+' run cadence');
 assert.ok(metrics.validation.max_loop_matrix_error<1e-5);assert.ok(metrics.validation.sit_down_start_error<1e-5&&metrics.validation.sit_down_end_error<1e-5);
 const head=g.scene.getObjectByName('head');const sockets={};for(const side of ['L','R'])sockets[side]=head.localToWorld(new THREE.Vector3().fromArray(metrics.eye_sockets_head_local[side])).toArray();
 await fs.access(path.join(base,'reference.png'));await fs.access(path.join(base,'source',id+'.blend'));
 results.push({id,triangles:tris,bones:29,materials:materials.size,skin_primitives:skins,bytes:buffer.length,min_y:minY,walk_stride:walkStride,run_stride:runStride,sockets,sampled});
 console.log(`${id}: ${tris} triangles, ${buffer.length} bytes, 8 clips, run stride ${runStride.toFixed(3)}m, floor ${minY.toFixed(6)}m`);
}
await fs.writeFile(path.join(root,'docs/reports/assets/20261004_펫4종_Codex/export_checks.json'),JSON.stringify({passed:true,results},null,2));
