import {createRequire} from 'node:module';
import fs from 'node:fs';
const require=createRequire(import.meta.url);const {chromium}=require('C:/Users/dmaxd/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out='C:/xoox/docs/reports/assets/20260926_블록고양이펫_BCAT02_Codex';
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},recordVideo:{dir:out+'/recordings',size:{width:1440,height:1000}}});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.routeWebSocket(/.*/,ws=>ws.close());
await page.goto('http://localhost:5179/block-cat-tool.html?revision=BCAT02-final',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__catLab?.ready);
const transitions=await page.evaluate(()=>{
 const l=window.__catLab;l.sample('idle_sit',0);l.play('stand');
 function state(){l.model.updateMatrixWorld(true);return {clip:l.current,time:l.action.time,pelvisY:l.model.getObjectByName('pelvis').getWorldPosition(l.eyeWorld[0].clone()).y};}
 const rise=[state()];for(let i=0;i<15;i++)l.mixer.update(1/30);rise.push(state());for(let i=0;i<20;i++)l.mixer.update(1/30);rise.push(state());
 l.play('idle_sit');const sit=[state()];for(let i=0;i<15;i++)l.mixer.update(1/30);sit.push(state());for(let i=0;i<20;i++)l.mixer.update(1/30);sit.push(state());return {rise,sit};
});
for(const clip of ['stand_up','sit_down']){await page.evaluate(clip=>{window.__catLab.sample(clip,.5);window.__catLab.setView('threequarter');},clip);await page.screenshot({path:`${out}/tool_${clip}_middle.png`});}
await page.evaluate(()=>{window.__catLab.sample('idle_sit',0);window.__catLab.setView('face');});await page.screenshot({path:`${out}/tool_face.png`});
await page.evaluate(()=>window.__catLab.setView('threequarter'));await page.locator('[data-clip="idle_sit"]').click();await page.waitForTimeout(700);
for(const clip of ['stand','idle_sit','walk','idle_sit']){await page.locator(`[data-clip="${clip}"]`).click();await page.waitForTimeout(1800);}
const result={transitions,errors};console.log(JSON.stringify(result,null,2));fs.writeFileSync(`${out}/transition_check.json`,JSON.stringify(result,null,2));
const video=page.video();await context.close();await video.saveAs(`${out}/sit_stand_transitions.webm`);await browser.close();
if(errors.length||transitions.rise[2].clip!=='stand'||transitions.sit[2].clip!=='idle_sit'||Math.abs(transitions.rise[1].pelvisY-transitions.rise[0].pelvisY)<.03)process.exitCode=1;