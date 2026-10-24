import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/dmaxd/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {createServer}=await import('file:///C:/Users/dmaxd/CodexPack_20260927/node_modules/vite/dist/node/index.js');
const pack='C:/Users/dmaxd/CodexPack_20260927',out='C:/xoox/docs/reports/assets/20260927_CodexPack_캐릭터복사검증_Codex';
const server=await createServer({configFile:false,root:pack,publicDir:pack+'/data',cacheDir:'C:/Users/dmaxd/AppData/Local/Temp/codex-pack-verify-vite-cache',server:{host:'127.0.0.1',port:5287,strictPort:true},logLevel:'error'});
const result={scope:'pack only; temporary server; no original xoox asset fallback',steps:[],errors:[],bad:[],navigation:[],normalModels:[]};
let browser,page,phase='start';
try{
 await server.listen();browser=await chromium.launch({channel:'chrome',headless:true});page=await browser.newPage({viewport:{width:1500,height:1000}});
 await page.routeWebSocket(/.*/,ws=>ws.close());
 page.on('pageerror',e=>result.errors.push({phase,message:e.message}));page.on('response',r=>{if(r.status()>=400)result.bad.push({phase,status:r.status(),url:r.url()})});
 const base='http://127.0.0.1:5287';
 for(const key of ['RUON','RUON_35','RIA','RIA_35']){
  phase=key;await page.goto(base+'/tools/unit-lab-tool.html?character='+key,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__unitLab?.charView?.clips?.length===18,null,{timeout:60000});
  const item=await page.evaluate(()=>{
   const v=window.__unitLab.charView;let finite=true;
   const sampled=[];
   for(const c of v.clips){v.play(c.name);for(let i=0;i<4;i++){v.tick(c.duration/4,i*c.duration/4);v.blocks.updateMatrixWorld(true);v.blocks.traverse(o=>{if(!o.matrixWorld.elements.every(Number.isFinite))finite=false})}sampled.push(c.name)}
   v.play('idle');v.tick(.25,0);return {clips:sampled,native:v.nativeBlocks,finite};
  });
  assert(item.finite&&item.native);result.normalModels.push({key,...item});
  await page.screenshot({path:out+'/pack_'+key+'.png'});console.log('PACK_LOADED',key,item.clips.length);
 }
 phase='sprite_toggle';await page.locator('#charPanel details').filter({hasText:'보기·조명'}).locator('summary').click();
 await page.locator('#referenceChk').check();await page.waitForTimeout(350);
 result.spriteVisible=await page.locator('#spriteBox').isVisible();await page.screenshot({path:out+'/pack_missing_sprite.png'});
 phase='compare';await page.goto(base+'/tools/character-compare-tool.html?family=RUON',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__characterCompare?.ready,null,{timeout:60000});
 result.compareModels=await page.evaluate(()=>[...window.__characterCompare.rigs.keys()]);
 const dynamic=await page.locator('#unitLink').getAttribute('href');
 result.navigation.push({name:'compare_to_unit',href:dynamic});
 await page.locator('#unitLink').click();await page.waitForTimeout(250);
 result.navigation[0].actualUrl=page.url();result.navigation[0].characterLoaded=await page.evaluate(()=>!!window.__unitLab?.charView);
 phase='cat';await page.goto(base+'/tools/block-cat-tool.html',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__catLab?.ready,null,{timeout:60000});
 result.cat=await page.evaluate(()=>{const a=window.__catLab;for(const c of a.clips)a.sample(c.name,c.duration*.5);a.sample('idle_sit',.1);return a.clips.map(c=>c.name)});
 assert.equal(result.cat.length,6);await page.screenshot({path:out+'/pack_cat.png'});
 for(const variant of ['a','d']){
  phase='reference_'+variant;await page.goto(base+'/tools/wanderer-'+variant+'-tool.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(v=>window['__'+v+'Lab']?.model!=null,variant,{timeout:60000});
  const item=await page.evaluate(v=>{const a=window['__'+v+'Lab'];return {variant:v,actions:a.actions.size,images:[...document.images].map(i=>({src:i.src,ok:i.complete&&i.naturalWidth>0}))}},variant);
  result.steps.push(item);await page.screenshot({path:out+'/pack_reference_'+variant+'.png'});
 }
 result.completed=true;
}catch(e){result.failure={phase,message:e.stack};process.exitCode=1}
finally{await fs.writeFile(out+'/runtime_audit.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));await browser?.close();await server.close();}
