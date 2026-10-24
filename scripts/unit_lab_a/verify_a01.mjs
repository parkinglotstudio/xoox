import {createRequire} from 'node:module';import fs from 'node:fs/promises';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/dmaxd/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out='C:/xoox/docs/reports/assets/20260926_시안A_D수준제작';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
const p=await browser.newPage({viewport:{width:1500,height:1120}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.routeWebSocket(/.*/,ws=>ws.close());
await p.goto('http://127.0.0.1:5179/wanderer-a-tool.html?revision=A01',{waitUntil:'domcontentloaded',timeout:60000});await p.waitForFunction(()=>window.__aLab?.actions?.has('victory'),null,{timeout:60000});
const checks=await p.evaluate(async()=>{
 const a=window.__aLab,T=await import('/node_modules/three/build/three.module.js');
 const sample=(name,t)=>{a.seek(name,0);const action=a.actions.get(name);action.setLoop(T.LoopOnce,1);action.clampWhenFinished=true;a.mixer.update(t);a.model.updateMatrixWorld(true);const bones={},morphs={};a.model.traverse(o=>{if(o.isBone)bones[o.name]=o.matrixWorld.toArray();if(o.morphTargetInfluences)morphs[o.name]={dictionary:o.morphTargetDictionary,weights:o.morphTargetInfluences.slice()};});return{bones,morphs};};
 const clips=Array.from(a.actions,([name,action])=>({name,duration:action.getClip().duration,weightTracks:action.getClip().tracks.filter(t=>t.name.includes('morphTargetInfluences')).length}));
 const idle=Array.from({length:61},(_,i)=>sample('idle',i*.1));let loopError=0,footDrift=0;
 for(const [bone,mat]of Object.entries(idle[0].bones)){for(let k=0;k<16;k++)loopError=Math.max(loopError,Math.abs(mat[k]-idle[60].bones[bone][k]));if(bone.startsWith('foot'))for(const s of idle)for(let k=0;k<16;k++)footDrift=Math.max(footDrift,Math.abs(mat[k]-s.bones[bone][k]));}
 const victory=Array.from({length:97},(_,i)=>{const s=sample('victory',i/30);return {t:i/30,footL:s.bones.footL?.[13]??s.bones['foot.L']?.[13],footR:s.bones.footR?.[13]??s.bones['foot.R']?.[13]};});
 const blink=sample('blink',.60),squint=sample('squint',1.1),neutral=sample('idle',0);
 const rifle=a.model.getObjectByName('A_prop_rifle');
 return{clips,loopError,footDrift,victory,blink:blink.morphs,squint:squint.morphs,neutral:neutral.morphs,bazookaLength:rifle.userData.barrelLengthM,bazookaRatio:rifle.userData.lengthRatioD06};
});
for(const [view,clip,t]of [['front','rest',0],['threequarter','rest',0],['back','rest',0],['side','rest',0],['costume','rest',0],['face','idle',0],['face','blink',.60],['face','blink',.52],['face','squint',1.1],['front','bow',1.0],['side','bow',1.0],['front','wave',1.4],['threequarter','wave',1.4],['front','victory',.96],['side','victory',1.90],['back','idle',0],['side','idle',0],['front','shoot',.05],['threequarter','shoot2',.1],['side','throw',.40],['threequarter','walk',.3],['threequarter','run',.2],['threequarter','draw_launcher',.7]]){
 await p.locator(`[data-view="${view}"]`).click();await p.evaluate(({clip,t})=>window.__aLab.seek(clip,t),{clip,t});await p.waitForTimeout(180);await p.screenshot({path:`${out}/${view}_${clip}_${t}.png`});
}
await p.locator('[data-view="front"]').click();
for(const clip of (process.argv.includes('--quick')?[]:['idle','bow','wave','victory'])){
 await p.evaluate(clip=>window.__aLab.seek(clip,0),clip);
 const video=await p.evaluate(async clip=>{document.querySelector('#pause').click();const a=window.__aLab,duration=a.actions.get(clip).getClip().duration;const stream=document.querySelector('#modelCanvas').captureStream(30),type=MediaRecorder.isTypeSupported('video/webm;codecs=vp9')?'video/webm;codecs=vp9':'video/webm';const rec=new MediaRecorder(stream,{mimeType:type,videoBitsPerSecond:1600000}),parts=[];rec.ondataavailable=e=>parts.push(e.data);const end=new Promise(resolve=>rec.onstop=resolve);rec.start();await new Promise(r=>setTimeout(r,(duration*2+.15)*1000));rec.stop();await end;stream.getTracks().forEach(t=>t.stop());const buf=new Uint8Array(await new Blob(parts).arrayBuffer());let str='';for(let i=0;i<buf.length;i+=8192)str+=String.fromCharCode(...buf.subarray(i,i+8192));return btoa(str);},clip);
 await fs.writeFile(`${out}/${clip}.webm`,Buffer.from(video,'base64'));
}
await p.goto('http://127.0.0.1:5179/unit-lab-tool.html?variant=A&revision=A01',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.__unitLab?.charView?.clips?.some(c=>c.name==='victory'),null,{timeout:60000});
await p.waitForFunction(()=>!document.querySelector('[data-anim="victory"]').disabled && window.__unitLab.renderer.info.render.calls>0);
for(const name of ['blink','squint','bow','wave','victory']){await p.locator(`[data-anim="${name}"]`).click();await p.waitForTimeout(name==='blink'?570:1000);await p.screenshot({path:`${out}/unit_${name}.png`});}
const unit=await p.evaluate(()=>({clips:window.__unitLab.charView.clips.map(c=>c.name),current:window.__unitLab.charView.current,meshes:(()=>{const r=[];window.__unitLab.charView.blocks.traverse(o=>{if(o.morphTargetInfluences)r.push({name:o.name,dictionary:o.morphTargetDictionary,weights:o.morphTargetInfluences})});return r;})()}));
await p.locator('[data-anim="idle"]').click();await p.waitForTimeout(300);await p.screenshot({path:`${out}/unit_A01.png`});
let hops=0,air=false;const ground=checks.victory[0].footL;for(const f of checks.victory){const lifted=f.footL-ground>.01;if(lifted&&!air)hops++;air=lifted;}checks.hopCount=hops;checks.jumpHeight=Math.max(...checks.victory.map(f=>f.footL))-ground;checks.unit=unit;checks.errors=errors;await fs.writeFile(`${out}/checks.json`,JSON.stringify(checks,null,2));console.log(JSON.stringify({...checks,victory:checks.victory.filter((_,i)=>i%8===0)}));
if(checks.hopCount!==2||checks.jumpHeight<.16||errors.length||checks.clips.length!==18||checks.clips.some(c=>c.weightTracks<3)||checks.loopError>1e-4||checks.footDrift>1e-4)process.exitCode=1;
}finally{await browser.close();}
