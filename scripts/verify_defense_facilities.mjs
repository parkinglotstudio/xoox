import fs from 'node:fs';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
const out='docs/reports/assets/20261004_방어진지와시설동작_Codex';
const result=await build({stdin:{contents:"export * from './src/tools/forestPlay/DefenseFacilityRig.ts';export * as THREE from 'three';",resolveDir:process.cwd()},bundle:true,write:false,platform:'node',format:'esm'});
const {DefenseTurretRig,DefenseTrapRig,towerParts,THREE}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
function glb(id){
 const file=fs.readFileSync('data/tools/unit_lab/kenney_parts/'+id+'.glb'),len=file.readUInt32LE(12),g=JSON.parse(file.subarray(20,20+len).toString()),binary=file.subarray(28+len);
 const read=(index)=>{const a=g.accessors[index],view=g.bufferViews[a.bufferView],n={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type],bytes={5121:1,5123:2,5125:4,5126:4}[a.componentType],values=[];
  for(let i=0;i<a.count;i++)for(let j=0;j<n;j++){const at=(view.byteOffset??0)+(a.byteOffset??0)+i*(view.byteStride??n*bytes)+j*bytes;values.push(a.componentType===5126?binary.readFloatLE(at):a.componentType===5123?binary.readUInt16LE(at):a.componentType===5125?binary.readUInt32LE(at):binary.readUInt8(at));}return {values,n};};
 const nodes=g.nodes.map(node=>{let obj;
  if(node.mesh!==undefined){const p=g.meshes[node.mesh].primitives[0],geo=new THREE.BufferGeometry();for(const [src,dst]of [['POSITION','position'],['NORMAL','normal'],['TEXCOORD_0','uv']])if(p.attributes[src]!==undefined){const a=read(p.attributes[src]);geo.setAttribute(dst,new THREE.Float32BufferAttribute(a.values,a.n));}if(p.indices!==undefined)geo.setIndex(read(p.indices).values);
   const m=g.materials?.[p.material],factor=m?.pbrMetallicRoughness?.baseColorFactor??[1,1,1,1];obj=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:new THREE.Color().fromArray(factor),roughness:.8}));geo.userData.textured=!!m?.pbrMetallicRoughness?.baseColorTexture;
  }else obj=new THREE.Group();obj.name=node.name??'';if(node.translation)obj.position.fromArray(node.translation);if(node.rotation)obj.quaternion.fromArray(node.rotation);if(node.scale)obj.scale.fromArray(node.scale);return obj;});
 g.nodes.forEach((node,i)=>node.children?.forEach(c=>nodes[i].add(nodes[c])));const root=new THREE.Group();g.scenes[g.scene??0].nodes.forEach(i=>root.add(nodes[i]));return root;
}
const frames=[];
function snapshot(root,name,kind,state){root.updateMatrixWorld(true);const meshes=[];root.traverse(o=>{if(!o.isMesh||!o.visible)return;const p=o.geometry.getAttribute('position'),positions=[];for(let i=0;i<p.count;i++){const v=new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);positions.push(v.x,v.y,v.z);}const col=o.material.color??new THREE.Color(.7,.7,.7);meshes.push({positions,indices:o.geometry.index?Array.from(o.geometry.index.array):Array.from({length:p.count},(_,i)=>i),color:[col.r,col.g,col.b],uv:o.geometry.userData.textured?Array.from(o.geometry.getAttribute('uv').array):null});});frames.push({name,kind,state,meshes});}
const tests=[];
for(const kind of ['tower_gun','tower_ballista','tower_throw','tower_cannon','tower_catapult']){
 const parts=Object.fromEntries(towerParts(kind).map(id=>[id,glb(id)])),rig=DefenseTurretRig.fromParts(kind,parts),target=new THREE.Vector3(20,0,40);rig.aim(target,0,true);
 const forward=new THREE.Vector3(0,0,1).applyQuaternion(rig.yaw.getWorldQuaternion(new THREE.Quaternion())).normalize(),wanted=target.clone().normalize();assert.ok(forward.dot(wanted)>.999999);
 // Use front orientation for the offline asset sheet.
 rig.aim(new THREE.Vector3(0,0,100),0,true);const rest=rig.muzzleWorld(),restZ=rig.barrel.position.z;snapshot(rig.root,kind+' idle',kind,'待機');
 if(kind==='tower_catapult'||kind==='tower_throw'){rig.prepare(.55);rig.tick(.25);assert.ok(rig.barrel.rotation.x<0);rig.fire();const fired=rig.muzzleWorld();assert.ok(fired.y>rest.y+.5,'Cup must rise, not swing into ground');snapshot(rig.root,kind+' release',kind,'発射');rig.tick(1.2);assert.ok(Math.abs(rig.barrel.rotation.x)<1e-7);}
 else{rig.fire();rig.tick(.02);assert.ok(rig.barrel.position.z<restZ);snapshot(rig.root,kind+' recoil',kind,'発射');rig.tick(1.2);assert.ok(Math.abs(rig.barrel.position.z-restZ)<1e-7);}
 assert.equal(rig.phase,'대기');snapshot(rig.root,kind+' reset',kind,'復帰');tests.push({kind,aimDot:forward.dot(wanted),muzzleHeight:rest.y,returnsToRest:true});rig.dispose();
}
for(const kind of ['slow','bind','spikes','mine']){
 const rig=new DefenseTrapRig(kind);snapshot(rig.root,kind+' ready',kind,'待機');rig.activate(1);rig.tick(.5,8);if(kind!=='mine')assert.ok(rig.moving.position.y>0);snapshot(rig.root,kind+' active',kind,'作動');rig.tick(2,0);assert.equal(rig.moving.position.y,0);snapshot(rig.root,kind+' reset',kind,'復帰');tests.push({kind,animationReturnsToRest:true});rig.dispose();
}
fs.writeFileSync(out+'/facility_animation_checks.json',JSON.stringify({revision:'DEF15-03',actualGLBNodes:true,tests},null,2));fs.writeFileSync(out+'/facility_pose_geometry.json',JSON.stringify(frames));
console.log('PASS: 5 turret real GLB pivots, aiming, barrel recoil, cup lift, recovery; 4 trap activation and recovery.');
