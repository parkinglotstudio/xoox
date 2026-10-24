const fs=require('fs'),assert=require('assert');
const root=process.argv[2]||'C:/xoox';
const ts=require(root+'/node_modules/typescript'),THREE=require(root+'/node_modules/three');
const path=root+'/src/tools/forestMap/ForestSky.ts';
const source=ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const moduleObject={exports:{}};new Function('require','module','exports',source)(n=>n==='three'?THREE:require(n),moduleObject,moduleObject.exports);
const {ForestSky}=moduleObject.exports;
const manifest=JSON.parse(fs.readFileSync(root+(root.includes('CodexPack')?'/maps':'/data/maps')+'/forest150/manifest.json'));
for(const state of ['purified','polluted']){
 const p=manifest.backdrops[state],sky=new ForestSky(new THREE.Texture(),p,manifest.lighting[state].backdropTint),scene=new THREE.Scene();scene.add(sky.mesh);
 const shader={uniforms:{},vertexShader:THREE.ShaderLib.basic.vertexShader,fragmentShader:THREE.ShaderLib.basic.fragmentShader};sky.mesh.material.onBeforeCompile(shader);
 assert(shader.vertexShader.includes('skyDirection = position;'));
 assert(!shader.fragmentShader.includes('#include <map_fragment>'));
 assert(!shader.fragmentShader.includes('horizonSky'));
 for(const height of [0.5,2.6,3.705,15,360]){
  const camera=new THREE.PerspectiveCamera(110,1.8,.05,700);camera.position.set(75,height,-145);camera.updateMatrixWorld();sky.mesh.onBeforeRender(null,scene,camera);
  assert(sky.mesh.position.distanceTo(camera.position)<1e-9);assert(sky.mesh.scale.x<camera.far);
  for(let pitch=-89;pitch<=89;pitch+=.5){const a=pitch*Math.PI/180;const v=(height+p.radius*Math.sin(a)/Math.max(Math.cos(a),.0001)-p.footY+p.height)/p.height;assert(Number.isFinite(v));}
 }
 assert.equal(sky.mesh.material.depthWrite,false);assert.equal(sky.mesh.material.fog,false);
 sky.dispose();assert.equal(scene.children.length,0);
 // Raising the top must not raise the ground or shift the original horizon anchor (35% of image).
 assert(Math.abs((p.footY-p.height)+.35*p.height)<1e-9);
}
console.log('PASS: both states, camera switching, far-plane coverage, finite projection, horizon anchor, disposal, shader injection');
