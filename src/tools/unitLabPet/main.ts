import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';

const $=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
const canvas=$<HTMLCanvasElement>('canvas'),host=canvas.parentElement!;
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.NeutralToneMapping;renderer.toneMappingExposure=1;
const scene=new THREE.Scene();scene.background=new THREE.Color('#0c1721');scene.fog=new THREE.Fog('#0c1721',4,12);
const camera=new THREE.PerspectiveCamera(32,1,.02,100);camera.position.set(.75,.95,3.1);
const controls=new OrbitControls(camera,canvas);controls.target.set(0,.32,0);controls.enableDamping=true;controls.minDistance=.5;controls.maxDistance=5;
scene.add(new THREE.HemisphereLight(0xd9eefb,0x3b4b50,1.5));
const key=new THREE.DirectionalLight(0xfff3e4,2.5);key.position.set(-2,4,3);key.castShadow=true;
key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-1.6,right:1.6,top:1.6,bottom:-1.6,near:.1,far:10});key.shadow.normalBias=.004;key.shadow.bias=-.0002;scene.add(key);
const rim=new THREE.DirectionalLight(0xb3e8ff,1.5);rim.position.set(2,2,-3);scene.add(rim);const fill=new THREE.DirectionalLight(0xe2eeff,.9);fill.position.set(2,1,4);scene.add(fill);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.MeshStandardMaterial({color:0x122430,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.001;floor.receiveShadow=true;scene.add(floor);
const ring=new THREE.Mesh(new THREE.RingGeometry(.67,.672,100),new THREE.MeshBasicMaterial({color:0x254755,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.001;scene.add(ring);
const resize=()=>{const {width,height}=host.getBoundingClientRect();renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();};new ResizeObserver(resize).observe(host);resize();
const labels:Record<string,string>={idle_sit:'앉아서 쉬는 중',walk:'가볍게 걷기',idle_look:'주변 둘러보기',attack_laser:'눈 레이저 · 짧은 보조 공격',stand:'서 있는 기본 자세',stand_up:'일어서는 중',sit_down:'앉는 중'};
let model:THREE.Object3D,mixer:THREE.AnimationMixer,action:THREE.AnimationAction;
let clips:THREE.AnimationClip[]=[];let current='idle_sit',paused=false,speed=1,attackWait=0;let pending:string|null=null;let faceZoom=false;
let metrics:{triangles:number;bones:number;bytes:number},head:THREE.Object3D;
const eyes:THREE.Vector3[]=[];const eyeWorld=[new THREE.Vector3(),new THREE.Vector3()];
const markers=[0,1].map(()=>{const o=new THREE.Mesh(new THREE.SphereGeometry(.008,8,6),new THREE.MeshBasicMaterial({color:0x83ffe7,depthTest:false}));o.visible=false;o.renderOrder=20;scene.add(o);return o;});
const fx=new THREE.Group();fx.visible=false;scene.add(fx);
const beamGeo=new THREE.BoxGeometry(1,1,1);
const beams=[0,1].map(()=>{
 const outer=new THREE.Mesh(beamGeo,new THREE.MeshBasicMaterial({color:0xff254e,transparent:true,opacity:.55,depthWrite:false,blending:THREE.AdditiveBlending}));
 const core=new THREE.Mesh(beamGeo,new THREE.MeshBasicMaterial({color:0xffd5dd}));fx.add(outer,core);return {outer,core};
});
const target=new THREE.Vector3(.16,.38,1.35);
const spot=new THREE.Mesh(new THREE.BoxGeometry(.045,.045,.045),new THREE.MeshBasicMaterial({color:0xff6280}));spot.position.copy(target);fx.add(spot);
const sparks=[...Array(6)].map(()=>{const o=new THREE.Mesh(new THREE.BoxGeometry(.012,.012,.012),new THREE.MeshBasicMaterial({color:0xff5271}));fx.add(o);return o;});
const yAxis=new THREE.Vector3(0,1,0),dir=new THREE.Vector3();
function updateFx(){
 if(!head||!action)return;
 model.updateMatrixWorld(true);
 eyes.forEach((p,i)=>{eyeWorld[i].copy(p);head.localToWorld(eyeWorld[i]);markers[i].position.copy(eyeWorld[i]);markers[i].visible=$<HTMLInputElement>('sockets').checked;});
 const time=action.time;const active=current==='attack_laser'&&time>=.18&&time<=.30;
 fx.visible=current==='attack_laser'&&time>=.18&&time<=.48;
 beams.forEach(({outer,core},i)=>{
  outer.visible=core.visible=active;
  dir.subVectors(target,eyeWorld[i]);const length=Math.min(2.2,dir.length());dir.normalize();
  for(const [o,w] of [[outer,.028],[core,.009]] as const){o.position.copy(eyeWorld[i]).addScaledVector(dir,length/2);o.quaternion.setFromUnitVectors(yAxis,dir);o.scale.set(w,length,w);}
 });
 const age=Math.max(0,time-.18);spot.scale.setScalar(Math.max(.05,1-age*3));
 sparks.forEach((s,i)=>{const a=i*Math.PI*2/6;s.position.copy(target).add(new THREE.Vector3(Math.cos(a)*age*.30,Math.sin(a)*age*.3+age*.08,-age*.1));s.scale.setScalar(Math.max(0,1-age/.3));});
}
const isSeated=(name:string)=>name==='idle_sit'||name==='idle_look'||name==='sit_down';
const isTransition=(name:string)=>name==='stand_up'||name==='sit_down';
function startClip(name:string,immediate=false){
 const actual=name==='stand'?'attack_laser':name;
 const clip=clips.find(c=>c.name===actual);if(!clip||!mixer)return;
 const previous=action,next=mixer.clipAction(clip);
 if(immediate||previous===next)mixer.stopAllAction();
 else if(previous)previous.fadeOut(.18);
 action=next;action.reset();action.enabled=true;action.setEffectiveWeight(1);
 action.setLoop(actual==='attack_laser'||isTransition(actual)?THREE.LoopOnce:THREE.LoopRepeat,actual==='attack_laser'||isTransition(actual)?1:Infinity);
 action.clampWhenFinished=true;action.play();if(previous&&!immediate&&previous!==next)action.fadeIn(.18);
 if(name==='stand'){action.time=0;action.paused=true;}
 current=name;attackWait=0;
 const refIndex=name==='walk'?2:(name==='stand'||name==='attack_laser'||name==='stand_up')?1:0;
 $('reference').style.transform=faceZoom?'translate(-11.4%,14%)':'translateX('+(-refIndex*100/3)+'%)';$('clipLabel').textContent=labels[name];
 document.querySelectorAll<HTMLButtonElement>('[data-clip]').forEach(b=>b.classList.toggle('active',b.dataset.clip===(pending??name)));
 mixer.update(0);updateFx();
}
function play(name:string,immediate=false){
 if(immediate){pending=null;startClip(name,true);return;}
 if(action&&!isTransition(name)&&isSeated(current)!==isSeated(name)){
  pending=name;startClip(isSeated(name)?'sit_down':'stand_up');
 }else{pending=null;startClip(name);}
}
function setView(name:string){faceZoom=name==='face';
 const v:Record<string,number[]>={front:[0,.75,3.1],threequarter:[.75,.95,3.1],side:[3.1,.8,0],back:[0,.9,-3.1],face:[0,.80,2.0]};
 const p=v[name]??v.threequarter;camera.position.set(p[0],p[1],p[2]);controls.target.set(0,faceZoom?.65:.32,faceZoom?.25:0);controls.update();
 $('reference').style.width=faceZoom?'600%':'300%';
 if(faceZoom)$('reference').style.transform='translate(-11.4%,14%)';
 else $('reference').style.transform='translateX('+(-(current==='walk'?2:(current==='stand'||current==='attack_laser')?1:0)*100/3)+'%)';
 document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
}
function setPause(value:boolean){paused=value;$('pause').textContent=paused?'재생':'일시정지';}
document.querySelectorAll<HTMLButtonElement>('[data-clip]').forEach(b=>b.onclick=()=>{setPause(false);play(b.dataset.clip!);});
document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view!));
$('pause').onclick=()=>setPause(!paused);
$('speed').onchange=()=>speed=Number($<HTMLSelectElement>('speed').value);
$('wire').onchange=()=>model?.traverse(o=>{if((o as THREE.Mesh).isMesh){const m=(o as THREE.Mesh).material;for(const mat of Array.isArray(m)?m:[m])(mat as THREE.MeshStandardMaterial).wireframe=$<HTMLInputElement>('wire').checked;}});
$('seek').oninput=()=>{if(!action)return;setPause(true);action.paused=false;action.time=Number($<HTMLInputElement>('seek').value)*action.getClip().duration;mixer.update(0);updateFx();};
let last=performance.now(),sum=0,count=0;
function render(now:number){requestAnimationFrame(render);const dt=Math.min((now-last)/1000,.05);last=now;
 if(mixer&&!paused){
  if(current==='attack_laser'){attackWait+=dt*speed;if(attackWait>=3){action.reset().play();attackWait=0;}}
  mixer.update(dt*speed);
 }
 controls.update();updateFx();renderer.render(scene,camera);
 if(action){$<HTMLInputElement>('seek').value=String(action.time/action.getClip().duration);$('clock').textContent=action.time.toFixed(2)+' s';}
 sum+=dt;count++;if(sum>=1&&metrics){$('status').textContent=`BCAT-02 · 블록 고양이 · ${metrics.triangles.toLocaleString()} 삼각형 · ${metrics.bones} 본 · ${(metrics.bytes/1048576).toFixed(2)} MiB · ${Math.round(count/sum)} fps`;sum=0;count=0;}
}
requestAnimationFrame(render);
async function init(){
 const base='/tools/unit_lab/pets/block_cat/';
 const [g,m]=await Promise.all([new GLTFLoader().loadAsync(base+'block_cat.glb?v=BCAT02'),fetch(base+'manifest.json').then(r=>{if(!r.ok)throw new Error('manifest '+r.status);return r.json();})]);
 metrics=m;model=g.scene;clips=g.animations;scene.add(model);$('status').textContent='BCAT-02 · '+metrics.triangles.toLocaleString()+' 삼각형 · '+metrics.bones+' 본 · '+(metrics.bytes/1048576).toFixed(2)+' MiB';
 model.traverse(o=>{if((o as THREE.Mesh).isMesh){const mesh=o as THREE.Mesh;mesh.castShadow=true;mesh.receiveShadow=true;}});
 head=model.getObjectByName('head')!;if(!head)throw new Error('고양이 머리 본을 찾지 못했습니다.');
 eyes.push(new THREE.Vector3().fromArray(m.eye_sockets_head_local.L),new THREE.Vector3().fromArray(m.eye_sockets_head_local.R));
 mixer=new THREE.AnimationMixer(model);
 mixer.addEventListener('finished',e=>{if(e.action===action&&isTransition(current)){const next=pending??(current==='stand_up'?'stand':'idle_sit');pending=null;startClip(next);}});
 play('idle_sit',true);
 (window as any).__catLab={scene,model,mixer,clips,camera,renderer,metrics,eyeWorld,fx,play,setView,setPause,
  sample(name:string,time:number){play(name,true);setPause(true);action.time=time;mixer.update(0);updateFx();renderer.render(scene,camera);},
  get current(){return current;},get action(){return action;},get ready(){return true;}};
}
if(location.protocol==='file:')$('error').textContent='이 툴은 Vite로 실행해야 합니다. http://localhost:5179/block-cat-tool.html';
else init().catch(e=>{$('error').textContent='모델을 불러오지 못했습니다.\n'+String(e);console.error(e);});