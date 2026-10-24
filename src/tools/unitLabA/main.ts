import * as THREE from 'three';
import { WeaponMuzzleFx } from '../unitLabTool/WeaponMuzzleFx';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { softenAFaceShadows } from './FaceShadows';
import { createReferenceLighting, REFERENCE_EXPOSURE } from './ReferenceLighting';
const base = '/tools/unit_lab/character/A';
const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const canvas = el<HTMLCanvasElement>('modelCanvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setClearColor(0x030c19);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = REFERENCE_EXPOSURE;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .01, 40);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.minDistance = 1;
controls.maxDistance = 20;
controls.minZoom = .55;
controls.maxZoom = 4;
const {studio,detail:detailLight}=createReferenceLighting();scene.add(studio);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(20,20), new THREE.ShadowMaterial({opacity:.18}));
ground.rotation.x=-Math.PI/2;ground.position.y=-.004;ground.receiveShadow=true;scene.add(ground);
let renderFrame={x:0,y:0,width:1,height:1};
let current='front', silhouette=false, model:THREE.Group|undefined;
let mixer:THREE.AnimationMixer|undefined, playing=true, activeClip='rest', hairMotion=true;
const actions=new Map<string,THREE.AnimationAction>();
let weaponFx:WeaponMuzzleFx|undefined;
const hairBones:{bone:THREE.Object3D;rest:THREE.Quaternion}[]=[];
detailLight.visible=true;
const clock=new THREE.Clock();
function play(name:string){weaponFx?.reset();activeClip=name;model?.traverse(o=>{if(/^A_prop_/.test(o.name))o.visible=name!=='rest';});if(mixer){mixer.stopAllAction();const a=actions.get(name);if(a){const once=/^(draw|holster)/.test(name);a.reset().setLoop(once?THREE.LoopOnce:THREE.LoopRepeat,once?1:Infinity);a.clampWhenFinished=once;a.play();}mixer.update(0);}el<HTMLSelectElement>('animSelect').value=name;}
function seek(name:string,seconds:number){play(name);playing=false;el('pause').textContent='재생';mixer?.update(seconds);}
el<HTMLSelectElement>('animSelect').onchange=e=>{play((e.target as HTMLSelectElement).value);playing=true;el('pause').textContent='일시정지';};
el('pause').onclick=()=>{playing=!playing;el('pause').textContent=playing?'일시정지':'재생';};
el<HTMLInputElement>('hairMotion').onchange=e=>{hairMotion=(e.target as HTMLInputElement).checked;};
el<HTMLInputElement>('detailLight').onchange=e=>{detailLight.visible=(e.target as HTMLInputElement).checked;};
el<HTMLInputElement>('lightStrength').oninput=e=>{detailLight.intensity=2.2*Number((e.target as HTMLInputElement).value)/100;};
const sourceMaterials = new Map<THREE.Mesh,THREE.Material|THREE.Material[]>();
const silhouetteMaterial = new THREE.MeshBasicMaterial({color:0xdfd7c5});
function resize(){
 const box=el('viewport').getBoundingClientRect();
 renderer.setSize(box.width,box.height,false);
 const close=current==='face'||current==='costume';
 const aspect=close?1:2/3;
 const width=Math.min(box.width,box.height*aspect),height=width/aspect;
 renderFrame={x:(box.width-width)/2,y:(box.height-height)/2,width,height};
 const span=current==='face'?1.08:current==='costume'?.9024:2.304;
 camera.top=span/2;camera.bottom=-span/2;camera.left=-span*aspect/2;camera.right=span*aspect/2;camera.updateProjectionMatrix();
}
function setView(name:string){
 current=name;controls.autoRotate=false;el('rotate').classList.remove('active');camera.zoom=1;
 const face=name==='face', costume=name==='costume'; const angles:Record<string,number>={front:0,threequarter:28,back:180,side:-90,face:0,costume:0};
 const a=THREE.MathUtils.degToRad(angles[name]??0);
 studio.rotation.y=a;
 controls.target.set(0,face?1.23:costume?.4608:.928,-.07);
 camera.position.copy(controls.target).add(new THREE.Vector3(Math.sin(a)*6,.42,Math.cos(a)*6));
 controls.update();resize();
 const ref=el<HTMLImageElement>('reference'); ref.src=`${base}/reference_${name === "side" ? "front" : name}.png`;
 ref.style.display=name==='side'?'none':'';el('missing').style.display=name==='side'?'block':'none';
 document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
}
document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view!));
el('reset').onclick=()=>setView(current);
el('rotate').onclick=()=>{controls.autoRotate=!controls.autoRotate;el('rotate').classList.toggle('active',controls.autoRotate)};
el('silhouette').onclick=()=>{
 silhouette=!silhouette;el('silhouette').classList.toggle('active',silhouette);
 sourceMaterials.forEach((m,mesh)=>mesh.material=silhouette?silhouetteMaterial:m);
};
new ResizeObserver(resize).observe(el('viewport'));
const requestedView=new URLSearchParams(location.search).get('view');
setView(requestedView && ['front','threequarter','back','side','face','costume'].includes(requestedView)?requestedView:'front');
async function boot(){
 try{
 const gltf=await new GLTFLoader().loadAsync(`${base}/wanderer_A.glb?v=A02-crown`);
 model=gltf.scene;scene.add(model);mixer=new THREE.AnimationMixer(model);
 const names:Record<string,string>={idle:'대기 · 6초 루프',walk:'걷기',run:'뛰기',shoot:'쌍권총 연사',shoot2:'바주카 단발',throw:'던지기',walk_shoot:'쏘며 걷기',walk_throw:'던지며 걷기',walk_gun:'쌍권총 들고 걷기',draw:'쌍권총 발도',holster:'쌍권총 납도',draw_launcher:'바주카 꺼내기',holster_launcher:'바주카 등 거치',blink:'눈 깜박임',squint:'눈 찡그리기',bow:'고개 숙여 인사',wave:'손 흔들기',victory:'승리 · 두 번 폴짝'};
 const selector=el<HTMLSelectElement>('animSelect');
 for(const clip of gltf.animations){actions.set(clip.name,mixer.clipAction(clip));const option=document.createElement('option');option.value=clip.name;option.textContent=names[clip.name]??clip.name;selector.appendChild(option);}
 model.traverse(o=>{if(o.name.startsWith('tip_hair_'))hairBones.push({bone:o,rest:o.quaternion.clone()});});
 play('rest');
 softenAFaceShadows(model);
 model.traverse(o=>{if((o as THREE.Mesh).isMesh){const m=o as THREE.Mesh;m.castShadow=true;m.receiveShadow=true;sourceMaterials.set(m,m.material);}});
 weaponFx=new WeaponMuzzleFx(model);
 const response=await fetch(`${base}/metrics.json`);const metrics=await response.json();
 el('status').textContent=`루온 · 기존 비율 · ${metrics.triangles.toLocaleString()} 삼각형 · ${metrics.animations.length}개 동작 · 끝머리 미세 움직임`;
 }catch(e){el('status').textContent=`불러오기 실패: ${(e as Error).message}`;console.error(e)}
}
void boot();
function draw(){const dt=Math.min(.05,clock.getDelta());if(playing)mixer?.update(dt);if(!hairMotion)for(const h of hairBones)h.bone.quaternion.copy(h.rest);weaponFx?.update(silhouette?undefined:actions.get(activeClip));controls.update();renderer.setScissorTest(false);renderer.clear();renderer.setViewport(renderFrame.x,renderFrame.y,renderFrame.width,renderFrame.height);renderer.setScissor(renderFrame.x,renderFrame.y,renderFrame.width,renderFrame.height);renderer.setScissorTest(true);renderer.render(scene,camera);requestAnimationFrame(draw)}draw();

(window as unknown as {__aLab:unknown}).__aLab={scene,camera,renderer,controls,play,seek,get model(){return model;},get mixer(){return mixer;},actions,hairBones,detailLight,get weaponFx(){return weaponFx;}};
