import * as T from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createReferenceLighting,REFERENCE_EXPOSURE } from '../unitLabD/ReferenceLighting';
import { softenDFaceAppearance } from '../unitLabD/FaceAppearance';
import { WeaponMuzzleFx } from '../unitLabTool/WeaponMuzzleFx';
import { SpritePlayer } from '../unitLabTool/CharacterLab';
const $=<E extends HTMLElement>(id:string)=>document.getElementById(id) as E;
const canvas=$<HTMLCanvasElement>('model'),renderer=new T.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0x030c19);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=REFERENCE_EXPOSURE;
const scene=new T.Scene(),studio=createReferenceLighting();scene.add(studio.studio);
const ground=new T.Mesh(new T.CircleGeometry(2.0,64),new T.ShadowMaterial({opacity:.18}));ground.rotation.x=-Math.PI/2;ground.position.y=-.005;ground.receiveShadow=true;scene.add(ground);
const camera=new T.OrthographicCamera(-1,1,2.12,-.12,.01,30);
const sprite=new SpritePlayer($<HTMLCanvasElement>('sprite'));
const labels:Record<string,string>={idle:'대기',walk:'걷기',run:'뛰기',shoot:'쌍권총 연사',shoot2:'바주카 단발',throw:'던지기',walk_shoot:'쏘며 걷기',walk_throw:'던지며 걷기',walk_gun:'총 들고 걷기',draw:'쌍권총 발도',holster:'쌍권총 납도',draw_launcher:'바주카 꺼내기',holster_launcher:'바주카 거치',blink:'눈 깜박임',squint:'눈 찡그리기',bow:'인사',wave:'손 흔들기',victory:'승리'};
const sprites:Record<string,string>={idle:'ingame_idle',walk:'walk_l',run:'move',shoot:'aim_fire',shoot2:'/ui/wanderer/test_clips/shoot',throw:'throw',walk_shoot:'aim_walk_f',walk_throw:'throw',walk_gun:'walk_gun'};
type Rig={model:T.Group;mixer:T.AnimationMixer;actions:Map<string,T.AnimationAction>;fx:WeaponMuzzleFx;action?:T.AnimationAction};
const rigs:Rig[]=[];let current='idle',paused=false,view='back';
function setView(v:string){view=v;const target=new T.Vector3(0,1,0);camera.position.set(v==='front'?0:v==='back'?0:3,1.08,v==='back'?-6:6);camera.lookAt(target);document.querySelectorAll<HTMLElement>('[data-view]').forEach(b=>b.classList.toggle('on',b.dataset.view===v));}
function play(name:string){current=name;for(const r of rigs){r.mixer.stopAllAction();r.action=r.actions.get(name)!;r.action.reset().setLoop(T.LoopRepeat,Infinity).play();r.mixer.update(0);r.fx.reset();}void sprite.load(sprites[name]??'ingame_idle');$<HTMLSelectElement>('anim').value=name;}
function seek(name:string,time:number){if(current!==name)play(name);paused=true;$('pause').textContent='재생';for(const r of rigs){r.action!.time=Math.min(time,r.action!.getClip().duration-1e-7);r.mixer.update(0);r.model.updateMatrixWorld(true);r.fx.update(r.action);}}
async function boot(){for(const file of ['D/wanderer_D.glb?v=D08','D_sprite/wanderer_D_sprite.glb?v=DSP01','D_35/wanderer_D_35.glb?v=D35-01']){const gltf=await new GLTFLoader().loadAsync('/tools/unit_lab/character/'+file);gltf.scene.traverse(o=>{if((o as T.Mesh).isMesh){o.castShadow=true;o.receiveShadow=true;}});softenDFaceAppearance(gltf.scene);const mixer=new T.AnimationMixer(gltf.scene),actions=new Map(gltf.animations.map(c=>[c.name,mixer.clipAction(c)]));rigs.push({model:gltf.scene,mixer,actions,fx:new WeaponMuzzleFx(gltf.scene)});scene.add(gltf.scene);}
$<HTMLSelectElement>('anim').innerHTML=[...rigs[1]!.actions.keys()].map(n=>`<option value="${n}">${labels[n]??n}</option>`).join('');play('idle');$('status').textContent='기존 D / 약 4.4등신 / 3.5등신 · 각 18개 동작';setView('back');(window as any).__dSpriteLab={rigs,scene,camera,renderer,seek,play,setView,get current(){return current},get ready(){return true},get view(){return view}};}
$('anim').onchange=e=>{paused=false;$('pause').textContent='일시정지';play((e.target as HTMLSelectElement).value)};
$('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'재생':'일시정지'};
$('seek').oninput=e=>seek(current,Number((e.target as HTMLInputElement).value)/1000*(rigs[0]?.action?.getClip().duration??1));
document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view!));
let previous=performance.now(),lastWidth=0,lastHeight=0;function frame(now:number){const dt=Math.min(.05,(now-previous)/1000);previous=now;const w=canvas.clientWidth,h=canvas.clientHeight;if(w!==lastWidth||h!==lastHeight){renderer.setSize(w,h,false);lastWidth=w;lastHeight=h;}camera.left=-1.25*(w/3)/h;camera.right=-camera.left;camera.top=1.25;camera.bottom=-1.25;camera.updateProjectionMatrix();
if(rigs.length===3){for(const r of rigs){if(!paused)r.mixer.update(dt);r.fx.update(r.action);}sprite.tick(paused?0:dt,1);const time=rigs[0]!.action!.time,duration=rigs[0]!.action!.getClip().duration;$<HTMLInputElement>('seek').value=String(time/duration*1000);$('time').textContent=time.toFixed(2)+'초';renderer.setScissorTest(true);for(let i=0;i<3;i++){rigs.forEach((r,j)=>r.model.visible=i===j);renderer.setViewport(i*w/3,0,w/3,h);renderer.setScissor(i*w/3,0,w/3,h);renderer.render(scene,camera)}renderer.setScissorTest(false);}requestAnimationFrame(frame)}
void boot().catch(e=>{$('status').textContent='불러오기 실패: '+String(e);console.error(e)});requestAnimationFrame(frame);