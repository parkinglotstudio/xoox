import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/dmaxd/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out='C:/xoox/docs/reports/assets/20260927_루온머리_제작문서_Codex';
const browser=await chromium.launch({channel:'chrome',headless:true});
const result={errors:[],bad:[],models:[]};
try{
 const p=await browser.newPage({viewport:{width:1500,height:1000}});
 await p.routeWebSocket(/.*/,ws=>ws.close());
 p.on('pageerror',e=>result.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)result.bad.push(r.url())});
 for(const key of ['RUON','RUON_35']){
  await p.goto('http://localhost:5179/unit-lab-tool.html?character='+key,{waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.__unitLab?.charView?.clips?.length===18,null,{timeout:90000});
  const m=await p.evaluate(()=>{
   const c=window.__unitLab.charView;let bones=0,hairBones=0,crown=false,finite=true;
   c.blocks.traverse(o=>{if(o.isBone){bones++;if(o.name.startsWith('tip_hair_'))hairBones++}
    if(o.userData.crownRevision==='RUON-CROWN-02')crown=true;
    if(o.isMesh){const a=o.geometry.attributes.position.array;for(let i=0;i<a.length;i++)if(!Number.isFinite(a[i]))finite=false}
   });
   return {native:c.nativeBlocks,clips:c.clips.length,bones,hairBones,crown,finite};
  });
  assert(m.native&&m.crown&&m.finite);assert.equal(m.clips,18);assert.equal(m.bones,46);assert.equal(m.hairBones,23);
  for(const anim of ['walk','run']){
   await p.locator('[data-anim="'+anim+'"]').click();
   await p.waitForFunction(n=>window.__unitLab.charView.current===n,anim);
  }
  await p.locator('#charPanel details').filter({hasText:'전투'}).locator('summary').click();
  await p.locator('[data-anim="shoot2"]').click();
  await p.waitForFunction(()=>window.__unitLab.charView.current==='shoot2');
  await p.locator('[data-anim="idle"]').click();await p.waitForTimeout(350);await p.locator('#charPause').click();
  await p.evaluate(key=>{
   const a=window.__unitLab,y=key==='RUON'?1.32:1.55;
   a.controls.target.set(0,y,0);a.camera.position.set(3,y+3,6);a.camera.zoom=key==='RUON'?1.8:2.8;
   a.camera.updateProjectionMatrix();a.controls.update();
  },key);
  await p.waitForTimeout(200);await p.screenshot({path:out+'/'+key+'_unit_final.png'});
  result.models.push({key,...m});
 }
 assert.equal(result.errors.length,0);assert.equal(result.bad.length,0);result.ok=true;
}catch(e){result.failure=e.stack;process.exitCode=1}
finally{await fs.writeFile(out+'/handoff_checks.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));await browser.close()}
