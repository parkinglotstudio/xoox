import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/dmaxd/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out='C:/xoox/docs/reports/assets/20260925_D안_턱목옷깃';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
 const page=await browser.newPage({viewport:{width:1400,height:1040},deviceScaleFactor:1});
 const errors=[];const failed=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400 && !r.url().endsWith('/favicon.ico')) failed.push([r.status(),r.url()])});
 await page.goto('http://127.0.0.1:5179/wanderer-d-tool.html',{waitUntil:'networkidle'});
 await page.locator('#status').filter({hasText:'삼각형'}).waitFor({timeout:30000});
 const status=await page.locator('#status').innerText();
 const views=[];
 for(const name of ['front','threequarter','back','side','face','costume']){
   await page.locator(`[data-view="${name}"]`).click();
   if(name!=='side')await page.locator('#reference').evaluate(img=>img.decode());
   await page.waitForTimeout(500);
   await page.screenshot({path:`${out}/tool_${name}.png`});
   views.push(name);
 }
 await page.locator('[data-view="front"]').click();
 await page.locator('#silhouette').click();
 await page.screenshot({path:`${out}/tool_silhouette.png`});
 await page.locator('#silhouette').click();
 await page.locator('#rotate').click();
 const rotationActive=await page.locator('#rotate').evaluate(b=>b.classList.contains('active'));
 await page.locator('#reset').click();
 const resetStopped=await page.locator('#rotate').evaluate(b=>!b.classList.contains('active'));
 const glb=await page.request.get('http://127.0.0.1:5179/tools/unit_lab/character/D/wanderer_D.glb');
 const bytes=await glb.body();
 const result={status,views,rotationActive,resetStopped,glbStatus:glb.status(),glbMagic:bytes.subarray(0,4).toString(),bytes:bytes.length,errors,failed};
 await fs.writeFile(`${out}/browser_check.json`,JSON.stringify(result,null,2));
 console.log(JSON.stringify(result));
 if(errors.length || failed.length || result.glbMagic!=='glTF' || !rotationActive || !resetStopped)process.exitCode=1;
}finally{await browser.close();}
