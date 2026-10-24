import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/dmaxd/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out='C:/xoox/docs/reports/assets/20260927_루온리아_유닛랩정리_Codex';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const results={errors:[],bad:[],screenshots:[]};
try{
 const p=await browser.newPage({viewport:{width:1500,height:1000}});
 p.on('pageerror',e=>results.errors.push(e.message));
 p.on('response',r=>{if(r.status()>=400)results.bad.push({url:r.url(),status:r.status()})});
 await p.routeWebSocket(/.*/,ws=>ws.close());
 const shot=async name=>{await p.waitForTimeout(160);await p.screenshot({path:out+'/'+name+'.png'});results.screenshots.push(name+'.png')};
 await p.goto('http://localhost:5179/wanderer-d-sprite-tool.html',{waitUntil:'domcontentloaded',timeout:60000});
 await p.waitForFunction(()=>window.__characterCompare?.ready,null,{timeout:90000});
 results.legacyRedirect=p.url().includes('character-compare-tool.html');
 assert(results.legacyRedirect);
 for(const family of ['RIA','RUON']){
   await p.locator('[data-family="'+family+'"]').click();
   for(const view of ['front','back']){
     await p.evaluate(({family,view})=>{const a=window.__characterCompare;a.setFamily(family);a.setView(view);a.seek('idle',0)},{family,view});
     await shot(family+'_'+view);
   }
 }
 await p.evaluate(()=>{const a=window.__characterCompare;a.setView('quarter');a.seek('shoot2',.08)});
 await shot('RUON_bazooka');
 results.models=await p.evaluate(async()=>{
   const a=window.__characterCompare,T=await import('/node_modules/three/build/three.module.js');
   const models=[];
   for(const [key,r] of a.rigs){
     const clips=[...r.actions].map(([name,action])=>({name,duration:action.getClip().duration,morphTracks:action.getClip().tracks.filter(t=>t.name.includes('morphTargetInfluences')).length}));
     let finite=true;const samples=[];
     if(key==='RUON_35')for(const {name,duration}of clips){
       let minY=Infinity,maxY=-Infinity;
       for(let i=0;i<=8;i++){
         a.seek(name,duration*i/8);r.model.updateMatrixWorld(true);
         r.model.traverse(o=>{
           if(!o.isSkinnedMesh||o.name.startsWith('A_prop_'))return;
           o.skeleton.update();
           for(let j=0;j<o.geometry.attributes.position.count;j+=Math.max(1,Math.floor(o.geometry.attributes.position.count/160))){
             const v=o.getVertexPosition(j,new T.Vector3()).applyMatrix4(o.matrixWorld);
             finite&&=[v.x,v.y,v.z].every(Number.isFinite);minY=Math.min(minY,v.y);maxY=Math.max(maxY,v.y);
           }
         });
       }
       samples.push({name,minY,maxY});
     }
     a.seek('idle',0);r.model.updateMatrixWorld(true);
     const bounds=new T.Box3();let bones=0,hairBones=0;
     r.model.traverse(o=>{if(o.isBone){bones++;if(o.name.startsWith('tip_hair_'))hairBones++;}if(o.isMesh&&!/^[AD]_prop_/.test(o.name))bounds.expandByObject(o,true)});
     models.push({key,clips,finite,samples,bones,hairBones,bounds:{min:bounds.min.toArray(),max:bounds.max.toArray(),size:bounds.getSize(new T.Vector3()).toArray()}});
   }
   return models;
 });
 assert.equal(results.models.length,4);
 for(const m of results.models){assert.equal(m.clips.length,18);assert(m.finite);assert(m.clips.every(c=>c.morphTracks>=3));assert(m.samples.every(s=>s.minY>-.003));}
 console.log('Comparison + 18 male clips verified');
 await p.goto('http://localhost:5179/unit-lab-tool.html?character=RIA',{waitUntil:'domcontentloaded',timeout:60000});
 await p.waitForFunction(()=>window.__unitLab?.charView?.clips?.length===18,null,{timeout:90000});
 results.activeChoices=await p.locator('[data-cvar]').evaluateAll(bs=>bs.map(b=>b.dataset.cvar));
 assert.deepEqual(results.activeChoices,['RUON','RUON_35','RIA','RIA_35']);
 results.unit=[];
 for(const key of ['RIA','RIA_35','RUON','RUON_35']){
   await p.locator('[data-cvar="'+key+'"]').click();
   await p.waitForFunction(k=>document.querySelector('[data-cvar="'+k+'"]').classList.contains('on')&&window.__unitLab.charView?.clips.length===18,key,{timeout:60000});
   await p.locator('[data-face="front"]').click();
   await p.locator('[data-anim="idle"]').click();
   await p.waitForTimeout(450);await p.locator('#charPause').click();
   await shot('unit_'+key);
   const item=await p.evaluate(()=>{
     const cv=window.__unitLab.charView;
     const skeleton=()=>{const vals=[];cv.blocks.traverse(o=>{if(o.isBone)vals.push(...o.quaternion.toArray(),...o.position.toArray())});return vals};
     return {clips:cv.clips.map(c=>c.name),native:cv.nativeBlocks,paused:document.getElementById('charPause').textContent==='재생',bones:skeleton(),title:document.getElementById('characterTitle').textContent};
   });
   await p.waitForTimeout(220);
   const after=await p.evaluate(()=>{const vals=[];window.__unitLab.charView.blocks.traverse(o=>{if(o.isBone)vals.push(...o.quaternion.toArray(),...o.position.toArray())});return vals});
   item.pauseStable=JSON.stringify(item.bones)===JSON.stringify(after);delete item.bones;
   assert(item.pauseStable);assert(item.native);results.unit.push({key,...item});
 }
 await p.locator('#charPanel details').filter({hasText:'전투'}).locator('summary').click();
 await p.locator('[data-anim="shoot"]').click();
 await p.waitForFunction(()=>window.__unitLab.charView.current==='shoot');
 await p.locator('[data-face="back"]').click();
 await shot('unit_RUON35_shoot_back');
 await p.locator('#charPanel details').filter({hasText:'표정·인사'}).locator('summary').click();
 await p.locator('[data-anim="victory"]').click();
 await p.waitForFunction(()=>window.__unitLab.charView.current==='victory');
 results.unitActions={shoot:true,victory:true};
 await p.locator('[data-section="units"]').click();
 await p.waitForFunction(()=>document.body.dataset.mode==='units'&&window.__unitLab.hero);
 await p.locator('#assetGroup').selectOption('enemy');
 await p.locator('.unit-search').fill('cat');
 results.filteredEnemies=await p.locator('#unitList .unit-btn').evaluateAll(bs=>bs.filter(b=>b.dataset.group?.startsWith('enemy')&&b.style.display!=='none').map(b=>b.dataset.id));
 assert(results.filteredEnemies.length>0);
 await shot('unit_asset_browser');
 results.mapControls=await p.evaluate(()=>['blockMapSector','blockMapState','blockMapActors','blockMapReload'].every(id=>!!document.getElementById(id)));
 assert(results.mapControls);
 await p.locator('[data-section="characters"]').click();
 await p.waitForFunction(()=>document.body.dataset.mode==='character'&&document.getElementById('characterTitle').textContent.includes('루온'));
 results.returnToCharacter=true;
 await p.setViewportSize({width:1024,height:768});
 await p.locator('[data-cvar="RIA"]').click();
 await p.waitForFunction(()=>document.querySelector('[data-cvar="RIA"]').classList.contains('on'));
 await p.locator('[data-anim="idle"]').click();
 await shot('unit_compact');
 results.horizontalOverflow=await p.evaluate(()=>document.body.scrollWidth>innerWidth);
 assert(!results.horizontalOverflow);
 assert.equal(results.errors.length,0);assert.equal(results.bad.length,0);
 results.ok=true;
} catch(e){results.failure=e.stack;process.exitCode=1;}
finally{await fs.writeFile(out+'/checks.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));await browser.close();}
