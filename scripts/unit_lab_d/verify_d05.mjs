import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/dmaxd/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out='C:/xoox/docs/reports/assets/20260926_D05_머리애니';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const clips=['idle','walk','run','shoot','shoot2','throw','walk_shoot','walk_throw','walk_gun'];
try{
 const page=await browser.newPage({viewport:{width:1440,height:1080},deviceScaleFactor:1});
 await page.route('**/favicon.ico',route=>route.fulfill({status:204}));
 const errors=[];const failed=[];page.on('pageerror',e=>{errors.push(e.message);console.log('PAGE_ERROR',e.message)});page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))failed.push([r.status(),r.url()])});
 await page.goto('http://127.0.0.1:5179/wanderer-d-tool.html?view=face',{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.__dLab?.actions?.size===9,{timeout:30000});
 await page.evaluate(()=>window.__dLab.seek('rest',0));await page.screenshot({path:`${out}/face_light_on.png`});
 await page.locator('#detailLight').uncheck();await page.waitForTimeout(150);await page.screenshot({path:`${out}/face_light_off.png`});await page.locator('#detailLight').check();
 for(const view of ['front','threequarter','back','side','costume']){await page.locator(`[data-view="${view}"]`).click();await page.waitForTimeout(180);await page.screenshot({path:`${out}/detail_${view}.png`});}
 await page.goto('http://127.0.0.1:5179/unit-lab-tool.html?variant=D',{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.__unitLab?.charView?.nativeBlocks && window.__unitLab.charView.clips.length===9,{timeout:45000});
 const variantChoices=await page.locator('[data-cvar]').evaluateAll(bs=>bs.map(b=>b.dataset.cvar));
 const base=await page.evaluate(()=>{const c=window.__unitLab.charView;return {height:c.height,width:c.width,native:c.nativeBlocks,clips:c.clips.map(a=>a.name)}});
 await page.locator('input[name="view"][value="mesh"]').check();
 const checks=[];
 for(const name of clips){
  await page.locator(`[data-anim="${name}"]`).click();await page.waitForTimeout(220);
  const result=await page.evaluate(({name})=>{
    const c=window.__unitLab.charView;const idx=c.clips.findIndex(x=>x.name===name);const duration=c.clips[idx].duration;
    const sample=t=>{
      for(const [mi,m] of c.mixers.entries()){m.stopAllAction();const a=c.actions[mi][idx];a.reset().setEffectiveWeight(1).play();m.update(t);}
      c.smooth.updateMatrixWorld(true);c.smooth.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update()});
    };
    const boneScales={};sample(duration*.33);c.smooth.traverse(o=>{if(['gun','rifle','bomb'].includes(o.name))boneScales[o.name]=o.scale.x;});
    const meshes=[];c.smooth.traverse(o=>{if(o.isSkinnedMesh&&o.name.startsWith('D_hair'))meshes.push(o)});
    let maxTip=0,maxRoot=0,animatedBones=0;
    for(const fraction of [.15,.35,.55,.75]){
      sample(duration*fraction);
      const before=[];
      for(const mesh of meshes){const pos=mesh.geometry.getAttribute('position'),si=mesh.geometry.getAttribute('skinIndex'),sw=mesh.geometry.getAttribute('skinWeight');for(let i=0;i<pos.count;i+=Math.max(1,Math.floor(pos.count/100))){let rootWeight=0;for(let j=0;j<4;j++){const id=si.getComponent(i,j),w=sw.getComponent(i,j);if(mesh.skeleton.bones[id]?.name==='head')rootWeight+=w;}const v=c.smooth.position.clone();mesh.getVertexPosition(i,v);before.push({mesh,i,p:v,root:rootWeight>.9999});}}
      for(const h of c.hairBones){if(h.bone.quaternion.angleTo(h.rest)>.0001)animatedBones++;h.bone.quaternion.copy(h.rest);}
      c.smooth.updateMatrixWorld(true);meshes.forEach(m=>m.skeleton.update());
      for(const r of before){const v=r.p.clone();r.mesh.getVertexPosition(r.i,v);const d=v.distanceTo(r.p);maxTip=Math.max(maxTip,d);if(r.root)maxRoot=Math.max(maxRoot,d);}
    }
    sample(duration*(name==='throw'||name==='walk_throw'?.35:name==='shoot2'?.2:.3));
    return {name,current:c.current,duration,maxTip,maxRoot,animatedBones,boneScales};
  },{name});checks.push(result);
  await page.screenshot({path:`${out}/anim_${name}.png`});
 }
 const toggles=await page.evaluate(()=>{const c=window.__unitLab.charView;c.hairMotion=false;c.tick(0,0);return {hairRest:c.hairBones.every(h=>h.bone.quaternion.toArray().every((v,i)=>Math.abs(v-h.rest.toArray()[i])<1e-7)),nativePreserved:c.nativeBlocks}});
 await page.locator('[data-anim="idle"]').click();await page.locator('input[name="view"][value="side"]').check();await page.waitForTimeout(300);await page.screenshot({path:`${out}/unit_D_pair.png`});
 await page.locator('[data-cvar="A"]').click();await page.waitForFunction(()=>window.__unitLab?.charView&&!window.__unitLab.charView.nativeBlocks);await page.waitForTimeout(300);
 const aCheck=await page.evaluate(()=>({clips:window.__unitLab.charView.clips.map(a=>a.name),native:window.__unitLab.charView.nativeBlocks}));
 await page.locator('[data-cvar="D"]').click();await page.waitForFunction(()=>window.__unitLab?.charView?.nativeBlocks);
 const result={base,checks,toggles,variantChoices,aCheck,errors,failed};await fs.writeFile(`${out}/checks.json`,JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 if(variantChoices.join(',')!=='A,D'||aCheck.clips.length!==9||errors.length||failed.length||!toggles.hairRest||checks.some(c=>c.maxRoot>1e-5||c.maxTip>.035||!c.animatedBones||c.current!==c.name))process.exitCode=1;
}finally{await browser.close();}
