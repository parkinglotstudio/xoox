import {createRequire} from 'node:module';import fs from 'node:fs/promises';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/dmaxd/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out='C:/xoox/docs/reports/assets/20260926_총구FX';const b=await chromium.launch({channel:'chrome',headless:true});
const errors=[];const counts={};
try{const p=await b.newPage({viewport:{width:1500,height:1120}});await p.routeWebSocket(/.*/,ws=>ws.close());p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!m.text().includes('404'))errors.push(m.text());});
for(const v of (process.argv.includes('--unit-only')?[]:['A','D'])){
 await p.goto(`http://127.0.0.1:5179/wanderer-${v.toLowerCase()}-tool.html?revision=muzzle-fx-large`);await p.waitForFunction(v=>window[`__${v.toLowerCase()}Lab`]?.weaponFx,v);
 for(const [clip,t]of[['shoot',.018],['shoot',.085],['shoot2',.05],['walk_shoot',.145]]){
  for(const view of ['back','threequarter']){
   await p.locator(`[data-view="${view}"]`).click();
   const state=await p.evaluate(({v,clip,t})=>{const a=window[`__${v.toLowerCase()}Lab`];a.camera.zoom=.9;a.camera.updateProjectionMatrix();a.seek(clip,t);a.weaponFx.enabled=true;a.weaponFx.update(a.actions.get(clip));return a.weaponFx.emitters.map(e=>({weapon:e.weapon,glow:e.glow.count,smoke:e.smoke.count}));},{v,clip,t});counts[`${v}_${clip}_${t}`]=state;
   await p.waitForTimeout(180);await p.screenshot({path:`${out}/${v}_large_${view}_${clip}_${t}.png`});
   if(view==='back'){
    await p.evaluate(v=>window[`__${v.toLowerCase()}Lab`].weaponFx.enabled=false,v);await p.waitForTimeout(120);await p.screenshot({path:`${out}/${v}_off_${view}_${clip}_${t}.png`});
   }
  }
 }
 await p.locator('[data-view="back"]').click();
 for(const clip of ['shoot','shoot2']){
  const encoded=await p.evaluate(async({v,clip})=>{const a=window[`__${v.toLowerCase()}Lab`];a.camera.zoom=.9;a.camera.updateProjectionMatrix();a.weaponFx.enabled=true;a.seek(clip,0);document.querySelector('#pause').click();const stream=a.renderer.domElement.captureStream(30);const mime=MediaRecorder.isTypeSupported('video/webm;codecs=vp9')?'video/webm;codecs=vp9':'video/webm';const rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:1600000});const chunks=[];rec.ondataavailable=e=>chunks.push(e.data);const stopped=new Promise(r=>rec.onstop=r);rec.start();await new Promise(r=>setTimeout(r,3000));rec.stop();await stopped;stream.getTracks().forEach(t=>t.stop());const data=new Uint8Array(await new Blob(chunks).arrayBuffer());let s='';for(let i=0;i<data.length;i+=8192)s+=String.fromCharCode(...data.subarray(i,i+8192));return btoa(s);},{v,clip});
  await fs.writeFile(`${out}/${v}_rear_${clip}.webm`,Buffer.from(encoded,'base64'));
 }
 console.log(v+'_REAR_CAPTURED');
}
await p.goto('http://127.0.0.1:5179/unit-lab-tool.html?variant=A&revision=muzzle-fx-large');await p.waitForFunction(()=>window.__unitLab?.charView?.muzzleFx?.length===2);
await p.locator('[data-face="back"]').click();
for(const v of['A','D']){
 await p.locator(`[data-cvar="${v}"]`).click();await p.waitForFunction(v=>window.__unitLab?.charView?.smooth?.getObjectByName(v+'_Armature'),v);
 for(const clip of['shoot','shoot2']){
  await p.locator(`[data-anim="${clip}"]`).click();await p.waitForTimeout(400);
  await p.evaluate(clip=>{const cv=window.__unitLab.charView;cv.play(clip);cv.speed=0;for(const acts of cv.actions)for(const a of acts){a.stopFading();a.setEffectiveWeight(a.getClip().name===clip?1:0);}cv.mixers.forEach(m=>m.update(clip==='shoot'?.018:.05));cv.tick(0,0);},clip);
  await p.waitForTimeout(150);await p.screenshot({path:`${out}/${v}_unit_rear_${clip}.png`});
 }
}
await fs.writeFile(out+'/rear_checks.json',JSON.stringify({counts,errors},null,2));console.log(JSON.stringify({errors}));if(errors.length)process.exitCode=1;
}finally{await b.close();}
