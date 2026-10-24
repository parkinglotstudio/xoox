import {createRequire} from 'node:module';
import fs from 'node:fs';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/dmaxd/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out='C:/xoox/docs/reports/assets/20260926_블록고양이펫_BCAT02_Codex';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1,recordVideo:{dir:out+'/recordings',size:{width:1440,height:1000}}});
const page=await context.newPage();const errors=[],badResources=[];
page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)badResources.push({url:r.url(),status:r.status()});});
await page.routeWebSocket(/.*/,ws=>ws.close());
await page.goto('http://localhost:5179/block-cat-tool.html?revision=BCAT02-final',{waitUntil:'networkidle'});
try{await page.waitForFunction(()=>window.__catLab?.ready,{timeout:30000});}catch(e){console.log(JSON.stringify({errors,badResources,body:await page.locator('body').innerText()}));throw e;}
const checks=await page.evaluate(()=>{
 const lab=window.__catLab;const samples=[];
 for(const clip of lab.clips){
  let minY=Infinity,maxY=-Infinity,nonfinite=0;
  for(let f=0;f<9;f++){
   lab.sample(clip.name,f*clip.duration/9);lab.model.updateMatrixWorld(true);
   lab.model.traverse(o=>{if(!o.isSkinnedMesh)return;const v=lab.eyeWorld[0].clone();for(let i=0;i<o.geometry.attributes.position.count;i++){o.getVertexPosition(i,v);v.applyMatrix4(o.matrixWorld);if(!Number.isFinite(v.x+v.y+v.z))nonfinite++;minY=Math.min(minY,v.y);maxY=Math.max(maxY,v.y);}});
  }
  let loopDelta=0;
  if(['walk','idle_sit','idle_look'].includes(clip.name))for(const track of clip.tracks){const size=track.getValueSize(),v=track.values;for(let k=0;k<size;k++)loopDelta=Math.max(loopDelta,Math.abs(v[k]-v[v.length-size+k]));}
  samples.push({clip:clip.name,duration:clip.duration,minY,maxY,nonfinite,loopDelta});
 }
 const laser=[.1,.23,.6].map(t=>{lab.sample('attack_laser',t);return {time:t,visible:lab.fx.visible};});
 lab.sample('idle_sit',0);const clearAfterSwitch=!lab.fx.visible;
 return {samples,laser,clearAfterSwitch,metrics:lab.metrics};
});
for(const [clip,t] of [['idle_sit',0],['walk',.15],['idle_look',1.1],['attack_laser',.23]]){
 await page.evaluate(([clip,t])=>window.__catLab.sample(clip,t),[clip,t]);await page.screenshot({path:`${out}/tool_${clip}.png`});
}
for(const view of ['front','side','back','face']){
 await page.evaluate(view=>{window.__catLab.sample('idle_sit',0);window.__catLab.setView(view);},view);
 await page.screenshot({path:`${out}/tool_${view}.png`});
}
await page.evaluate(()=>{window.__catLab.setView('threequarter');window.__catLab.play('idle_sit');window.__catLab.setPause(false);});
for(const [clip,ms] of [['idle_sit',4200],['walk',3200],['idle_look',5200],['attack_laser',3300]]){
 await page.locator(`[data-clip="${clip}"]`).click();await page.waitForTimeout(ms);
}
await page.locator('#pause').click();const before=await page.evaluate(()=>window.__catLab.action.time);await page.waitForTimeout(150);const after=await page.evaluate(()=>window.__catLab.action.time);
checks.pauseDelta=Math.abs(before-after);
checks.finalStats=await page.evaluate(()=>({calls:window.__catLab.renderer.info.render.calls,triangles:window.__catLab.renderer.info.render.triangles,status:document.getElementById('status').textContent}));
checks.errors=errors;checks.badResources=badResources;
fs.writeFileSync(`${out}/browser_check.json`,JSON.stringify(checks,null,2));console.log(JSON.stringify(checks,null,2));
const video=page.video();await context.close();await video.saveAs(`${out}/cat_four_clips.webm`);await browser.close();
if(errors.length||badResources.length||checks.samples.some(s=>s.nonfinite||s.minY<-.01||s.loopDelta>.001)||!checks.clearAfterSwitch||checks.pauseDelta>.001)process.exitCode=1;