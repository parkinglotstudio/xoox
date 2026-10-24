import {createRequire} from 'node:module';import fs from 'node:fs/promises';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/dmaxd/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out='C:/xoox/docs/reports/assets/20260926_D_얼굴색그림자';await fs.mkdir(out,{recursive:true});
const b=await chromium.launch({channel:'chrome',headless:true});try{const p=await b.newPage({viewport:{width:1500,height:1120}});await p.routeWebSocket(/.*/,ws=>ws.close());await p.goto('http://127.0.0.1:5179/wanderer-d-tool.html?view=face');await p.waitForFunction(()=>window.__dLab?.model);await p.evaluate(()=>window.__dLab.seek('idle',0));await p.waitForTimeout(250);await p.screenshot({path:out+'/before_face.png'});
console.log(await p.evaluate(()=>{const r=[];window.__dLab.model.traverse(o=>{if(o.isMesh&&!o.name.startsWith('muzzle'))r.push({name:o.name,material:Array.isArray(o.material)?'array':o.material.type,vertexColors:o.material.vertexColors});});return r;}));
}finally{await b.close();}
