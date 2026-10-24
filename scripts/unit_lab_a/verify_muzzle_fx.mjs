import {createRequire} from 'node:module';import fs from 'node:fs/promises';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/dmaxd/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out='C:/xoox/docs/reports/assets/20260926_총구FX';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});const checks={errors:[],variants:{}};
try{
 const p=await browser.newPage({viewport:{width:1500,height:1120}});await p.routeWebSocket(/.*/,ws=>ws.close());
 p.on('pageerror',e=>checks.errors.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!m.text().includes('404'))checks.errors.push(m.text());});
 for(const v of ['A','D']){
  await p.goto(`http://127.0.0.1:5179/wanderer-${v.toLowerCase()}-tool.html?revision=muzzle-fx`);
  await p.waitForFunction(v=>!!window[`__${v.toLowerCase()}Lab`]?.weaponFx,v);
  const validation=await p.evaluate(async v=>{
   const a=window[`__${v.toLowerCase()}Lab`],T=await import('/node_modules/three/build/three.module.js');
   const align=[],events=[];
   for(const [clip,t]of [['shoot',.015],['shoot',.085],['walk_shoot',.145],['shoot2',.035],['shoot2',.19]]){
    a.seek(clip,t);a.weaponFx.update(a.actions.get(clip));a.model.updateMatrixWorld(true);
    const sample=[];
    for(const e of a.weaponFx.emitters){
     const m=e.mesh,index=m.skeleton.bones.findIndex(b=>b.name===e.weapon);m.skeleton.update();
     const p=m.geometry.attributes.position,rest=new T.Vector3(),mean=new T.Vector3(),posed=new T.Vector3();let n=0;
     for(let i=0;i<p.count;i++){
      rest.fromBufferAttribute(p,i).applyMatrix4(m.bindMatrix).applyMatrix4(m.skeleton.boneInverses[index]);
      if(Math.abs(rest.y-m.userData.muzzleLocal[1])>1e-5)continue;
      m.getVertexPosition(i,posed);mean.add(posed.applyMatrix4(m.matrixWorld));n++;
     }
     if(n)mean.divideScalar(n);
     const actual=e.anchor.getWorldPosition(new T.Vector3());
     align.push({clip,t,weapon:e.weapon,rimVertices:n,error:n?mean.distanceTo(actual):999});
     sample.push({weapon:e.weapon,active:e.anchor.visible,age:e.age,glow:e.glow.count,smoke:e.smoke.count});
    }
    events.push({clip,t,emitters:sample});
   }
   const off={};for(const name of ['idle','walk_gun','draw','holster','draw_launcher','holster_launcher','throw','blink']){a.seek(name,.05);a.weaponFx.update(a.actions.get(name));off[name]=a.weaponFx.emitters.every(e=>!e.anchor.visible&&e.glow.count===0&&e.smoke.count===0);}
   a.seek('shoot',.035);a.weaponFx.update(a.actions.get('shoot'));const first=a.weaponFx.emitters.map(e=>[e.age,e.glow.count,e.smoke.count]);for(let i=0;i<20;i++)a.weaponFx.update(a.actions.get('shoot'));const paused=JSON.stringify(first)===JSON.stringify(a.weaponFx.emitters.map(e=>[e.age,e.glow.count,e.smoke.count]));
   return {align,events,off,paused};
  },v);
  checks.variants[v]=validation;
  for(const [view,clip,t]of [['threequarter','shoot',.015],['threequarter','shoot',.085],['side','shoot',.015],['threequarter','shoot2',.035],['side','shoot2',.035],['threequarter','shoot2',.19],['threequarter','walk_shoot',.145]]){
   await p.locator(`[data-view="${view}"]`).click();await p.evaluate(({v,clip,t})=>window[`__${v.toLowerCase()}Lab`].seek(clip,t),{v,clip,t});await p.waitForTimeout(160);await p.screenshot({path:`${out}/${v}_${view}_${clip}_${t}.png`});
  }
 }
 await p.goto('http://127.0.0.1:5179/unit-lab-tool.html?variant=A&revision=muzzle-fx');
 await p.waitForFunction(()=>window.__unitLab?.charView?.muzzleFx?.length===2);
 for(const v of ['A','D']){
  await p.locator(`[data-cvar="${v}"]`).click();await p.waitForFunction(v=>window.__unitLab?.charView?.smooth?.getObjectByName(v+'_Armature'),v);
  const result=await p.evaluate(()=>{const cv=window.__unitLab.charView;cv.speed=0;const sampled=[];for(const [clip,t]of[['shoot',.015],['walk_shoot',.145],['shoot2',.035],['idle',.1]]){cv.play(clip);for(const acts of cv.actions)for(const action of acts){action.stopFading();action.setEffectiveWeight(action.getClip().name===clip?1:0);}cv.mixers.forEach(m=>m.update(t));cv.tick(0,0);sampled.push({clip,emitters:cv.muzzleFx.map(fx=>fx.emitters.map(e=>({weapon:e.weapon,active:e.anchor.visible,glow:e.glow.count,smoke:e.smoke.count})))});}return sampled;});
  checks.variants[v].unit=result;
  await p.locator('[data-anim="shoot2"]').click();await p.evaluate(()=>{const cv=window.__unitLab.charView;cv.speed=0;cv.play('shoot2');for(const acts of cv.actions)for(const action of acts){action.stopFading();action.setEffectiveWeight(action.getClip().name==='shoot2'?1:0);}cv.mixers.forEach(m=>m.update(.035));cv.tick(0,0);});await p.waitForTimeout(200);await p.screenshot({path:`${out}/${v}_unit_bazooka.png`});
 }
 await fs.writeFile(out+'/checks.json',JSON.stringify(checks,null,2));
 const result=Object.fromEntries(Object.entries(checks.variants).map(([v,c])=>[v,{maxAlignmentError:Math.max(...c.align.map(x=>x.error)),off:c.off,paused:c.paused,unitCopies:c.unit[0].emitters.length}]));console.log(JSON.stringify({result,errors:checks.errors}));
 if(checks.errors.length||Object.values(checks.variants).some(c=>c.align.some(x=>x.error>.0001)||!c.paused||Object.values(c.off).some(x=>!x)))process.exitCode=1;
}finally{await browser.close();}
