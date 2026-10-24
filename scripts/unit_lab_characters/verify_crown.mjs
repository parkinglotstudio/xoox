import {createRequire} from 'node:module';import fs from 'node:fs/promises';import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/dmaxd/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out='C:/xoox/docs/reports/assets/20260927_루온머리_제작문서_Codex';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});const result={errors:[],bad:[],clips:[]};
try{
const p=await browser.newPage({viewport:{width:1400,height:900}});await p.routeWebSocket(/.*/,ws=>ws.close());
p.on('pageerror',e=>result.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)result.bad.push(r.url())});
await p.goto('http://localhost:5179/character-compare-tool.html?family=RUON',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.__characterCompare?.ready,null,{timeout:90000});
result.clips=await p.evaluate(async()=>{
const a=window.__characterCompare,T=await import('/node_modules/three/build/three.module.js'),{GLTFLoader}=await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js'),{softenAFaceShadows}=await import('/src/tools/unitLabA/FaceShadows.ts');
window.__crownOriginal=new Map(a.rigs);window.__crownBefore=new Map();const audit=[];
for(const key of ['RUON','RUON_35']){
 const g=await new GLTFLoader().loadAsync('/docs/asset_backups/20260927_RuonCrown_Codex/'+key+'.glb');
 g.scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});softenAFaceShadows(g.scene);g.scene.visible=false;a.scene.add(g.scene);
 const mixer=new T.AnimationMixer(g.scene),actions=new Map(g.animations.map(c=>[c.name,mixer.clipAction(c)]));
 const r={key,model:g.scene,mixer,actions,fx:{reset(){},update(){}}};window.__crownBefore.set(key,r);
 const now=a.rigs.get(key);let maxError=0;
 for(const c of g.animations){const newClip=now.actions.get(c.name).getClip();if(newClip.tracks.length!==c.tracks.length)throw Error('Track count changed');
  for(const tr of c.tracks){const nt=newClip.tracks.find(t=>t.name===tr.name);if(!nt||nt.values.length!==tr.values.length)throw Error('Track mismatch '+tr.name);for(let j=0;j<tr.values.length;j++)maxError=Math.max(maxError,Math.abs(nt.values[j]-tr.values[j]));}
 }
 audit.push({key,clips:now.actions.size,maxAnimationValueDifference:maxError});
}
return audit;
});
for(const key of ['RUON','RUON_35']){
 await p.evaluate(key=>{const a=window.__characterCompare;for(const r of [...window.__crownOriginal.values(),...window.__crownBefore.values()])r.model.visible=false;
 a.rigs.set('RUON',window.__crownBefore.get(key));a.rigs.set('RUON_35',window.__crownOriginal.get(key));a.setFamily('RUON');a.seek('idle',0);
 document.getElementById('labelOriginal').textContent='수정 전';document.getElementById('label35').textContent='윗머리 보정';
 document.getElementById('status').textContent='루온 · '+(key==='RUON'?'기존 비율':'3.5등신')+' · 동일 조명·각도';
 },key);
 for(const view of ['high','front','back']){
  await p.evaluate(({key,view})=>{const a=window.__characterCompare,y=key==='RUON'?1.4:1.60;a.camera.zoom=key==='RUON'?1.6:2.3;a.camera.position.set(view==='high'?3:0,y+(view==='high'?3:0.15),view==='back'?-6:6);a.camera.lookAt(0,y,0);a.camera.updateProjectionMatrix();},{key,view});
  await p.waitForTimeout(180);await p.screenshot({path:out+'/'+key+'_'+view+'_compare.png'});
 }
}
for(const c of result.clips){assert.equal(c.clips,18);assert(c.maxAnimationValueDifference<1e-5)}
assert.equal(result.errors.length,0);assert.equal(result.bad.length,0);result.ok=true;
}finally{await fs.writeFile(out+'/crown_checks.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));await browser.close();}
