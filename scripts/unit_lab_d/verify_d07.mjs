import {createRequire} from 'node:module';import fs from 'node:fs/promises';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/dmaxd/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out='C:/xoox/docs/reports/assets/20260926_D07_등거치대기';await fs.mkdir(out,{recursive:true});
const b=await chromium.launch({channel:'chrome',headless:true});
try{
const p=await b.newPage({viewport:{width:1500,height:1120}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.goto('http://127.0.0.1:5179/wanderer-d-tool.html',{waitUntil:'domcontentloaded',timeout:60000});
await p.waitForFunction(()=>window.__dLab?.actions?.get('idle')?.getClip().duration===6,{timeout:60000});
const result=await p.evaluate(async()=>{
 const T=await import('/node_modules/three/build/three.module.js'),a=window.__dLab;
 const sample=t=>{a.seek('idle',0);const act=a.actions.get('idle');act.setLoop(T.LoopOnce,1);act.clampWhenFinished=true;a.mixer.update(t);a.model.updateMatrixWorld(true);const snap={};a.model.traverse(o=>{if(o.isBone)snap[o.name]=o.matrixWorld.toArray()});return snap;};
 const snapshots=Array.from({length:25},(_,i)=>sample(i*.25)),first=snapshots[0],last=snapshots[24];
 let loopError=0,footDrift=0;
 for(const [bone,mat] of Object.entries(first)){for(let k=0;k<16;k++)loopError=Math.max(loopError,Math.abs(mat[k]-last[bone][k]));if(bone.startsWith('foot'))for(const s of snapshots)for(let k=0;k<16;k++)footDrift=Math.max(footDrift,Math.abs(mat[k]-s[bone][k]));}
 let rifle;a.model.traverse(o=>{if(o.name==='D_prop_rifle')rifle=o;});rifle.geometry.computeBoundingBox();
 const hipsX=snapshots.map(s=>s.hips[12]);
 return {duration:6,loopMatrixError:loopError,footMatrixDrift:footDrift,hipSideRange:Math.max(...hipsX)-Math.min(...hipsX),barrelLengthM:rifle.userData.barrelLengthM,lengthRatio:rifle.userData.lengthRatioD06,geometryExtent:rifle.geometry.boundingBox.getSize(new T.Vector3()).toArray(),snapshots};
});
for(const [view,clip,t] of [['back','idle',0],['back','idle',3],['side','idle',0],['threequarter','idle',0],['front','idle',1.5],['front','idle',4.5],['threequarter','shoot2',.04],['side','draw_launcher',.65]]){await p.locator(`[data-view="${view}"]`).click();await p.evaluate(({clip,t})=>window.__dLab.seek(clip,t),{clip,t});await p.waitForTimeout(180);await p.screenshot({path:`${out}/${view}_${clip}_${t}.png`});}
await p.locator('[data-view="threequarter"]').click();await p.evaluate(()=>window.__dLab.seek('idle',0));
const video=await p.evaluate(async()=>{document.querySelector('#pause').click();const stream=document.querySelector('#modelCanvas').captureStream(30),type=MediaRecorder.isTypeSupported('video/webm;codecs=vp9')?'video/webm;codecs=vp9':'video/webm';const rec=new MediaRecorder(stream,{mimeType:type,videoBitsPerSecond:1800000});const chunks=[];rec.ondataavailable=e=>chunks.push(e.data);const done=new Promise(resolve=>rec.onstop=resolve);rec.start();await new Promise(r=>setTimeout(r,12500));rec.stop();await done;stream.getTracks().forEach(t=>t.stop());const buf=new Uint8Array(await new Blob(chunks).arrayBuffer());let str='';for(let i=0;i<buf.length;i+=8192)str+=String.fromCharCode(...buf.subarray(i,i+8192));return btoa(str);});
await fs.writeFile(`${out}/idle_loop.webm`,Buffer.from(video,'base64'));
await p.goto('http://127.0.0.1:5179/unit-lab-tool.html?variant=D',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.__unitLab?.charView?.clips?.find(c=>c.name==='idle')?.duration===6);
const unit=await p.evaluate(()=>({clips:window.__unitLab.charView.clips.map(c=>({name:c.name,duration:c.duration})),current:window.__unitLab.charView.current}));
await p.waitForFunction(()=>document.querySelector('[data-anim="idle"]')?.textContent.includes('6초') && window.__unitLab.renderer.info.render.calls>0);await p.waitForTimeout(300);await p.screenshot({path:`${out}/unit_D07.png`});
const final={...result,unit,errors};await fs.writeFile(`${out}/checks.json`,JSON.stringify(final,null,2));delete final.snapshots;console.log(JSON.stringify(final));
if(result.loopMatrixError>1e-4||result.footMatrixDrift>1e-4||errors.length||Math.abs(result.barrelLengthM-.696)>1e-5||unit.clips.length!==13)process.exitCode=1;
}finally{await b.close()}
