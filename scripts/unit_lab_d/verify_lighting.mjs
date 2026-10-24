import {createRequire} from 'node:module';import fs from 'node:fs/promises';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/dmaxd/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out='C:/xoox/docs/reports/assets/20260926_D06_무기조명';const browser=await chromium.launch({channel:'chrome',headless:true});
try{
const results=[];
for(const kind of ['reference','animation','blocks']){
 const page=await browser.newPage({viewport:{width:1440,height:1080}});
 await page.goto(`http://127.0.0.1:5179/${kind==='reference'?'wanderer-d':'unit-lab'}-tool.html`,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(k=>k==='reference'?window.__dLab?.actions?.size===13:window.__unitLab?.charView?.clips?.length===13,kind);
 const result=await page.evaluate(async kind=>{
  const T=await import('/node_modules/three/build/three.module.js');
  let scene,renderer,model;
  if(kind==='reference'){const a=window.__dLab;a.seek('idle',0);scene=a.scene;renderer=a.renderer;model=a.model;}
  else{const a=window.__unitLab,c=a.charView;c.speed=0;scene=a.scene;renderer=a.renderer;
   c.mixers.forEach((m,j)=>{m.stopAllAction();const action=c.actions[j][0];action.reset().stopFading().setEffectiveWeight(1).play();m.update(0)});
   c.smooth.position.set(0,0,0);c.blocks.position.set(0,0,0);c.smooth.visible=kind==='animation';c.blocks.visible=kind==='blocks';model=kind==='animation'?c.smooth:c.blocks;c.fx.tick(0,0);
  }
  for(const o of scene.children)if(o.isMesh||o.isLineSegments)o.visible=false;
  const camera=new T.OrthographicCamera(-.54,.54,.54,-.54,.01,40);camera.position.set(0,1.65,5.93);camera.lookAt(0,1.23,-.07);
  renderer.setSize(512,512,false);renderer.setScissorTest(false);renderer.setViewport(0,0,512,512);renderer.clear();renderer.render(scene,camera);
  const lights=[];scene.traverseVisible(o=>{if(o.isLight)lights.push({type:o.type,color:o.color.getHex(),intensity:o.intensity,position:o.position.toArray()})});
  return {kind,png:renderer.domElement.toDataURL().split(',')[1],exposure:renderer.toneMappingExposure,environment:!!scene.environment,lights,calls:renderer.info.render.calls};
 },kind);
 await fs.writeFile(`${out}/color_${kind}.png`,Buffer.from(result.png,'base64'));delete result.png;results.push(result);await page.close();
}
await fs.writeFile(`${out}/lighting.json`,JSON.stringify(results,null,2));console.log(JSON.stringify(results));
}finally{await browser.close()}
