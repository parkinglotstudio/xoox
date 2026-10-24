import {createRequire} from 'node:module';import fs from 'node:fs/promises';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/dmaxd/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out='C:/xoox/docs/reports/assets/20260926_D_얼굴색그림자';const b=await chromium.launch({channel:'chrome',headless:true});const errors=[];
try{const p=await b.newPage({viewport:{width:1500,height:1120}});await p.routeWebSocket(/.*/,ws=>ws.close());p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!m.text().includes('404'))errors.push(m.text());});await p.goto('http://127.0.0.1:5179/wanderer-d-tool.html?view=face&revision=D-face-color');await p.waitForFunction(()=>window.__dLab?.model?.getObjectByName('D_head_clean')?.material?.userData?.dSkinGain);await p.evaluate(()=>window.__dLab.seek('idle',0));
for(const [name,gain] of [['shadow_only',[1,1,1]],['tone_1',[1.75,1.25,1.50]],['tone_2',[2.8,1.4,1.6]]]){
 await p.evaluate(gain=>window.__dLab.model.traverse(o=>{if(/^D_head_(clean|all)$/.test(o.name))o.material.userData.dSkinGain.value.set(...gain);}),gain);await p.waitForTimeout(200);await p.screenshot({path:out+'/'+name+'.png'});
}console.log(JSON.stringify({errors}));}finally{await b.close();}
