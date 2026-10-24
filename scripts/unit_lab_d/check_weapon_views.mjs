import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
const require=createRequire(import.meta.url);const{chromium}=require('C:/Users/dmaxd/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out='C:/xoox/docs/reports/assets/20260926_D06_무기조명';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{const page=await browser.newPage({viewport:{width:1500,height:1120}});await page.goto('http://127.0.0.1:5179/wanderer-d-tool.html',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__dLab?.actions?.size===13);
for(const [view,clip,t] of [['back','idle',.3],['threequarter','shoot',.07],['threequarter','shoot2',.04],['side','shoot2',.1],['threequarter','throw',.38],['back','draw_launcher',.5],['side','draw_launcher',.65],['threequarter','draw_launcher',.85]]){await page.locator(`[data-view="${view}"]`).click();await page.evaluate(({clip,t})=>window.__dLab.seek(clip,t),{clip,t});await page.waitForTimeout(100);await page.screenshot({path:`${out}/qa_${view}_${clip}_${t}.png`});}
}finally{await browser.close()}
