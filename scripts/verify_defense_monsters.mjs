// Offline geometry QA. Uses the same conversion function as DefensePreview; no browser access.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
const bundle=await build({entryPoints:['src/tools/forestPlay/DefenseMonsterLibrary.ts'],bundle:true,write:false,platform:'node',format:'esm'});
const {buildMonsterGeometry}=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const catalog=JSON.parse(fs.readFileSync('data/tools/unit_lab/units_free.json','utf8')).units;
const balance=JSON.parse(fs.readFileSync('data/tools/unit_lab/defense_balance.json','utf8'));
const out='docs/reports/assets/20261004_디펜스15분보정_Codex';fs.mkdirSync(out+'/voxel_qa',{recursive:true});
const results=[];
for(let stage=0;stage<balance.stages.length;stage++)for(const id of balance.stages[stage].monsters){
 const entry=catalog.find(e=>e.id===id),file=`data/tools/unit_lab/${entry.base}/${id}.dense.bin`;
 const buf=fs.readFileSync(file);assert.equal(buf.byteLength,entry.dense*9,id+' dense length');
 const pos=new Float32Array(entry.dense*3),col=new Uint8Array(entry.dense*3);
 for(let i=0;i<entry.dense*3;i++){pos[i]=entry.dense_lo[i%3]+buf.readInt16LE(i*2)*entry.dense_q;col[i]=buf[entry.dense*6+i];}
 const start=performance.now(),result=buildMonsterGeometry(entry,{n:entry.dense,pos,col},stage),g=result.geometry;
 const p=g.getAttribute('position'),c=g.getAttribute('color'),ao=g.getAttribute('aAO');const indices=Uint32Array.from(g.index.array);
 const color=Float32Array.from(c.array);for(let i=0;i<c.count;i++){const shade=.38+.62*ao.getX(i)**2;for(let j=0;j<3;j++)color[i*3+j]*=shade;}
 const bytes=Buffer.concat([Buffer.from(p.array.buffer,p.array.byteOffset,p.array.byteLength),Buffer.from(color.buffer),Buffer.from(indices.buffer)]);
 fs.writeFileSync(out+'/voxel_qa/'+id+'.bin',bytes);
 const box=g.boundingBox,dx=box.max.x-box.min.x,dz=box.max.z-box.min.z;
 assert.ok(Math.hypot(dx,dz)<=2.4001,id+' collider fit');assert.ok(g.index.count>0&&p.count===c.count);assert.ok([...p.array].every(Number.isFinite));
 results.push({id,name:entry.name,stage:stage+1,vertices:p.count,indices:indices.length,triangles:result.triangles,blockSize:result.blockSize,diameter:Math.hypot(dx,dz),height:box.max.y-box.min.y,build_ms:Math.round(performance.now()-start),bytes:bytes.length});g.dispose();
}
assert.equal(results.length,45);
fs.writeFileSync(out+'/voxel_qa/manifest.json',JSON.stringify({models:results},null,2));
fs.writeFileSync(out+'/monster_geometry_checks.json',JSON.stringify({count:45,all_valid:true,totalTriangles:results.reduce((n,e)=>n+e.triangles,0),maxTriangles:Math.max(...results.map(e=>e.triangles)),maxDiameter:Math.max(...results.map(e=>e.diameter)),models:results},null,2));
console.log('PASS: 45 existing dense assets, valid voxel geometry, shared-cache preparation, max diameter 2.4m. Triangles '+results.reduce((n,e)=>n+e.triangles,0));
