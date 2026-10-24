import * as T from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createReferenceLighting, REFERENCE_EXPOSURE } from '../unitLabD/ReferenceLighting';
import { softenDFaceAppearance } from '../unitLabD/FaceAppearance';
import { softenAFaceShadows } from '../unitLabA/FaceShadows';
import { WeaponMuzzleFx } from '../unitLabTool/WeaponMuzzleFx';
import { CHARACTER_CATALOG, characterLabel } from '../unitLabTool/CharacterCatalog';
const $=<E extends HTMLElement>(id:string)=>document.getElementById(id) as E;
const canvas=$<HTMLCanvasElement>('model'),renderer=new T.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setClearColor(0x030c19);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=REFERENCE_EXPOSURE;
const scene=new T.Scene(),lighting=createReferenceLighting();scene.add(lighting.studio);
const ground=new T.Mesh(new T.CircleGeometry(2,64),new T.ShadowMaterial({opacity:.18}));
ground.rotation.x=-Math.PI/2;ground.position.y=-.005;ground.receiveShadow=true;scene.add(ground);
const camera=new T.OrthographicCamera(-1,1,1.3,-1.3,.01,30);
const labels:Record<string,string>={idle:'대기',walk:'걷기',run:'뛰기',shoot:'쌍권총 연사',shoot2:'바주카 단발',throw:'던지기',walk_shoot:'쏘며 걷기',walk_throw:'던지며 걷기',walk_gun:'무기 들고 걷기',draw:'쌍권총 꺼내기',holster:'쌍권총 넣기',draw_launcher:'바주카 꺼내기',holster_launcher:'바주카 거치',blink:'눈 깜박임',squint:'눈 찡그리기',bow:'인사',wave:'손 흔들기',victory:'승리'};
type Rig={key:string;model:T.Group;mixer:T.AnimationMixer;actions:Map<string,T.AnimationAction>;fx:WeaponMuzzleFx;action?:T.AnimationAction};
const rigs=new Map<string,Rig>();
let family=new URLSearchParams(location.search).get('family')==='RUON'?'RUON':'RIA';
let current='idle',paused=false,ready=false,view='front';
function activeRigs(){return [rigs.get(family),rigs.get(family+'_35')].filter((r):r is Rig=>!!r)}
function setView(v:string){
  view=v;camera.position.set(v==='quarter'?3:0,1.08,v==='back'?-6:6);camera.lookAt(0,1,0);
  document.querySelectorAll<HTMLElement>('[data-view]').forEach(b=>b.classList.toggle('on',b.dataset.view===v));
}
function setFamily(v:string){
  if(v!=='RUON'&&v!=='RIA')return;family=v;
  document.querySelectorAll<HTMLElement>('[data-family]').forEach(b=>b.classList.toggle('on',b.dataset.family===v));
  const url=new URL(location.href);url.searchParams.set('family',family);history.replaceState(null,'',url);
  for(const [id,key] of [['labelOriginal',family],['label35',family+'_35']]){
    $(id).textContent=characterLabel(key);$<HTMLAnchorElement>(id).href='/unit-lab-tool.html?character='+key;
  }
  $<HTMLAnchorElement>('unitLink').href='/unit-lab-tool.html?character='+family;
  if(ready){$('status').textContent=(family==='RUON'?'루온':'리아')+' · 기존 비율 / 3.5등신 · 각 18개 동작';play(current);}
}
function play(name:string){
  current=name;
  for(const r of rigs.values()){
    const action=r.actions.get(name);if(!action)continue;
    r.mixer.stopAllAction();r.action=action;action.reset().setLoop(T.LoopRepeat,Infinity).play();r.mixer.update(0);r.fx.reset();
  }
  $<HTMLSelectElement>('anim').value=name;
}
function seek(name:string,time:number){
  if(current!==name)play(name);paused=true;$('pause').textContent='재생';
  for(const r of rigs.values()){if(!r.action)continue;r.action.time=Math.min(time,r.action.getClip().duration-1e-7);r.mixer.update(0);r.model.updateMatrixWorld(true);r.fx.update(r.action);}
}
async function boot(){
  await Promise.all(CHARACTER_CATALOG.map(async c=>{
    const gltf=await new GLTFLoader().loadAsync('/tools/unit_lab/character/'+c.file);
    gltf.scene.traverse(o=>{if((o as T.Mesh).isMesh){o.castShadow=true;o.receiveShadow=true;}});
    softenAFaceShadows(gltf.scene);softenDFaceAppearance(gltf.scene);
    const mixer=new T.AnimationMixer(gltf.scene),actions=new Map(gltf.animations.map(c=>[c.name,mixer.clipAction(c)]));
    rigs.set(c.key,{key:c.key,model:gltf.scene,mixer,actions,fx:new WeaponMuzzleFx(gltf.scene)});scene.add(gltf.scene);
  }));
  $<HTMLSelectElement>('anim').innerHTML=[...rigs.get('RIA')!.actions.keys()].map(n=>'<option value="'+n+'">'+(labels[n]??n)+'</option>').join('');
  ready=true;setFamily(family);setView('front');
  (window as any).__characterCompare={rigs,scene,camera,renderer,seek,play,setFamily,setView,get current(){return current},get ready(){return ready},get view(){return view},get family(){return family}};
}
$('anim').onchange=e=>{paused=false;$('pause').textContent='일시정지';play((e.target as HTMLSelectElement).value)};
$('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'재생':'일시정지'};
$('seek').oninput=e=>seek(current,Number((e.target as HTMLInputElement).value)/1000*(activeRigs()[0]?.action?.getClip().duration??1));
document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view!));
document.querySelectorAll<HTMLButtonElement>('[data-family]').forEach(b=>b.onclick=()=>setFamily(b.dataset.family!));
let previous=performance.now(),lastWidth=0,lastHeight=0;
function frame(now:number){
  const dt=Math.min(.05,(now-previous)/1000);previous=now;const w=canvas.clientWidth,h=canvas.clientHeight;
  if(w&&h){
    if(w!==lastWidth||h!==lastHeight){renderer.setSize(w,h,false);lastWidth=w;lastHeight=h;}
    camera.left=-1.3*(w/2)/h;camera.right=-camera.left;camera.updateProjectionMatrix();
    if(ready){
      const active=activeRigs();
      for(const r of active){if(!paused)r.mixer.update(dt);r.fx.update(r.action);}
      const action=active[0]!.action!;
      $<HTMLInputElement>('seek').value=String(action.time/action.getClip().duration*1000);$('time').textContent=action.time.toFixed(2)+'초';
      renderer.setScissorTest(true);
      active.forEach((r,i)=>{for(const other of rigs.values())other.model.visible=other===r;renderer.setViewport(i*w/2,0,w/2,h);renderer.setScissor(i*w/2,0,w/2,h);renderer.render(scene,camera)});
      renderer.setScissorTest(false);
    }
  }
  requestAnimationFrame(frame);
}
setFamily(family);setView('front');void boot().catch(e=>{$('status').textContent='불러오기 실패: '+String(e);console.error(e)});requestAnimationFrame(frame);
