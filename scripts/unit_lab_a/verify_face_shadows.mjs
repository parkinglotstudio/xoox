import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/dmaxd/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out='C:/xoox/docs/reports/assets/20260926_A_얼굴그림자';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
 const p=await browser.newPage({viewport:{width:1500,height:1120}});
 await p.routeWebSocket(/.*/,ws=>ws.close());
 const errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 p.on('console',m=>{if(m.type()==='error'&&!m.text().includes('404'))errors.push(m.text());});
 await p.goto('http://127.0.0.1:5179/wanderer-a-tool.html?revision=A01-face-shadow');
 await p.waitForFunction(()=>window.__aLab?.model);
 await p.evaluate(()=>window.__aLab.seek('rest',0));
 const counts={};
 for(const view of ['face','front','threequarter']){
  await p.locator(`[data-view="${view}"]`).click();
  for(const [label,strength] of [['before',1],['after',.18]]){
   counts[view]=await p.evaluate(value=>{let n=0;window.__aLab.model.traverse(o=>{for(const m of (Array.isArray(o.material)?o.material:[o.material]))if(m?.userData.aFaceShadowStrength){m.userData.aFaceShadowStrength.value=value;n++;}});return n;},strength);
   await p.waitForTimeout(300);
   await p.screenshot({path:`${out}/${view}_${label}.png`});
  }
 }
 await p.goto('http://127.0.0.1:5179/unit-lab-tool.html?variant=A&revision=A01-face-shadow');
 await p.waitForFunction(()=>window.__unitLab?.charView?.smooth?.getObjectByName('A_Armature'));
 await p.waitForTimeout(500);
 const unit=await p.evaluate(()=>{const cv=window.__unitLab.charView,result=[];for(const root of [cv.smooth,cv.blocks])root.traverse(o=>{for(const m of(Array.isArray(o.material)?o.material:[o.material]))if(m?.userData.aFaceShadowStrength)result.push({mesh:o.name,strength:m.userData.aFaceShadowStrength.value});});cv.play('blink');return result;});
 await p.waitForTimeout(500);
 await p.screenshot({path:out+'/unit_A_after.png'});
 await p.locator('[data-cvar="D"]').click();
 await p.waitForFunction(()=>window.__unitLab?.charView?.smooth?.getObjectByName('D_Armature'));
 const dPatched=await p.evaluate(()=>{let n=0;const cv=window.__unitLab.charView;for(const root of[cv.smooth,cv.blocks])root.traverse(o=>{for(const m of(Array.isArray(o.material)?o.material:[o.material]))if(m?.userData.aFaceShadowStrength)n++;});return n;});
 const result={counts,unit,dPatched,errors};
 await fs.writeFile(out+'/checks.json',JSON.stringify(result,null,2));
 console.log(JSON.stringify(result));
 if(errors.length||Object.values(counts).some(n=>n!==3)||unit.length!==6||dPatched)process.exitCode=1;
}finally{await browser.close();}
