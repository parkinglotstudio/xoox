import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

type Metrics={name?:string;revision:string;triangles:number;bones:number;bytes:number;cell_meters?:number;animations:Record<string,number>;palette?:Record<string,string>;eye_sockets_head_local:Record<string,number[]>;laser:{start:number;end:number;range:number;cooldown:number;color?:string}};
const $=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
const canvas=$<HTMLCanvasElement>('canvas'),host=canvas.parentElement!;
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.NeutralToneMapping;renderer.toneMappingExposure=1;
const scene=new THREE.Scene();scene.background=new THREE.Color('#0c1721');scene.fog=new THREE.Fog('#0c1721',5,16);
const camera=new THREE.PerspectiveCamera(33,1,.02,100),controls=new OrbitControls(camera,canvas);
controls.enableDamping=true;controls.minDistance=.6;controls.maxDistance=7;
scene.add(new THREE.HemisphereLight(0xe2f0ff,0x4c5754,1.3));
const key=new THREE.DirectionalLight(0xfff2dc,2.1);key.position.set(-2,4,3);key.castShadow=true;
key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-2,right:2,top:2,bottom:-2,near:.1,far:10});key.shadow.normalBias=.004;key.shadow.bias=-.0002;scene.add(key);
const rim=new THREE.DirectionalLight(0xc0e8ff,1.0);rim.position.set(2,3,-3);scene.add(rim);
const fill=new THREE.DirectionalLight(0xe8f1ff,.65);fill.position.set(3,1,4);scene.add(fill);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.MeshStandardMaterial({color:0x152a38,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.005;floor.receiveShadow=true;scene.add(floor);
const ring=new THREE.Mesh(new THREE.RingGeometry(.92,.925,100),new THREE.MeshBasicMaterial({color:0x345563,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.001;scene.add(ring);
new ResizeObserver(()=>{const {width,height}=host.getBoundingClientRect();renderer.setSize(width,height,false);camera.aspect=width/Math.max(1,height);camera.updateProjectionMatrix();}).observe(host);

const labels:Record<string,string>={idle_stand:'자연스러운 서기 · 루프',idle_sit:'앉아서 쉬기 · 루프',idle_look:'주변 둘러보기 · 루프',walk:'걷기 · 대각선 보행',run:'달리기 · 짧은 주기와 큰 보폭',attack_laser:'눈 레이저 · 3초 간격',stand_up:'앉기 → 서기',sit_down:'서기 → 앉기'};
const notes:Record<string,string>={nofilter:'황금 몸체 · 민트 눈/귀 슬릿 · 회색 주둥이 · 복숭아색 바이저와 목줄',flux:'분홍 장갑 · 크림 갈기 · 노란 귀 슬랫/발톱 · 옆면 배선',lumos:'흰 털 · 왼쪽 기계 얼굴/붉은 슬롯 · 비대칭 귀 · 금속 앞다리',gizmo:'청록색 긴 갈기 · 황동 이마 장식 · 파란 발광부 · 긴 기계 꼬리',block_cat:'기존 BCAT-02 리소스 · 달리기 클립 없음 · 원본 보존'};
let model:THREE.Object3D|null=null,head:THREE.Object3D|null=null,mixer:THREE.AnimationMixer|null=null,action:THREE.AnimationAction|null=null;
let clips:THREE.AnimationClip[]=[],metrics:Metrics|null=null,pet='nofilter',current='idle_stand',pending:string|null=null,paused=false,speed=1,token=0,attackElapsed=0,view='threequarter';
const eyes=[new THREE.Vector3(),new THREE.Vector3()],worldEyes=[new THREE.Vector3(),new THREE.Vector3()];
const cube=new THREE.BoxGeometry(1,1,1),outerMat=new THREE.MeshBasicMaterial({color:0x35eec1,transparent:true,opacity:.48,depthWrite:false,blending:THREE.AdditiveBlending}),coreMat=new THREE.MeshBasicMaterial({color:0xe5fff3});
const fx=new THREE.Group();scene.add(fx);fx.visible=false;
const beams=[0,1].map(()=>{const outer=new THREE.Mesh(cube,outerMat),core=new THREE.Mesh(cube,coreMat);fx.add(outer,core);return {outer,core};});
const spot=new THREE.Mesh(cube,outerMat);fx.add(spot);spot.scale.setScalar(.06);
const sparks=[...Array(8)].map(()=>{const o=new THREE.Mesh(cube,outerMat);o.scale.setScalar(.015);fx.add(o);return o;});
const markers=[0,1].map(()=>{const o=new THREE.Mesh(cube,coreMat);o.scale.setScalar(.012);o.visible=false;scene.add(o);return o;});
const direction=new THREE.Vector3(),axis=new THREE.Vector3(0,1,0),target=new THREE.Vector3();
const seated=(name:string)=>['idle_sit','idle_look','sit_down'].includes(name);
const transition=(name:string)=>name==='stand_up'||name==='sit_down';

function updateFx(){
 if(!model||!head||!metrics||!action)return;
 model.updateMatrixWorld(true);eyes.forEach((p,i)=>{worldEyes[i].copy(p);head!.localToWorld(worldEyes[i]);markers[i].position.copy(worldEyes[i]);markers[i].visible=$<HTMLInputElement>('sockets').checked;});
 target.copy(worldEyes[0]).lerp(worldEyes[1],.5).add(new THREE.Vector3(0,-.15,1.65));
 const time=action.time,{start,end,range}=metrics.laser,active=current==='attack_laser'&&time>=start&&time<=end;
 fx.visible=current==='attack_laser'&&time>=start&&time<=end+.18;
 beams.forEach(({outer,core},i)=>{outer.visible=core.visible=active;direction.subVectors(target,worldEyes[i]);const length=Math.min(range,direction.length());direction.normalize();for(const [o,w] of [[outer,.036],[core,.012]] as const){o.position.copy(worldEyes[i]).addScaledVector(direction,length/2);o.quaternion.setFromUnitVectors(axis,direction);o.scale.set(w,length,w);}});
 const age=Math.max(0,time-start);spot.position.copy(target);spot.scale.setScalar(.07*Math.max(.05,1-age*3));
 sparks.forEach((s,i)=>{const a=i*TAU/8;s.position.copy(target).add(new THREE.Vector3(Math.cos(a)*age*.4,Math.sin(a)*age*.4,-age*.12));s.scale.setScalar(.015*Math.max(0,1-age/.3));});
}
const TAU=Math.PI*2;
function markButtons(){document.querySelectorAll<HTMLButtonElement>('[data-clip]').forEach(b=>b.classList.toggle('active',b.dataset.clip===(pending??current)));}
function startClip(name:string,immediate=false){
 if(!mixer)return;const actual=pet==='block_cat'&&name==='idle_stand'?'attack_laser':name,clip=clips.find(c=>c.name===actual);if(!clip)return;
 const previous=action,next=mixer.clipAction(clip);if(immediate||previous===next)mixer.stopAllAction();else previous?.fadeOut(.16);
 action=next;action.reset().setEffectiveWeight(1).setLoop(transition(name)||name==='attack_laser'?THREE.LoopOnce:THREE.LoopRepeat,transition(name)||name==='attack_laser'?1:Infinity);action.clampWhenFinished=true;action.play();
 if(previous&&!immediate&&previous!==next)action.fadeIn(.16);
 if(pet==='block_cat'&&name==='idle_stand'){action.time=0;action.paused=true;}
 current=name;attackElapsed=0;$('clipLabel').textContent=labels[name];markButtons();mixer.update(0);updateFx();
}
function play(name:string,immediate=false){
 if(!mixer)return;
 if(transition(current)&&!immediate&&!transition(name)){pending=name;markButtons();return;}
 if(!immediate&&!transition(name)&&action&&seated(current)!==seated(name)){
  pending=name;startClip(seated(name)?'sit_down':'stand_up');
 }else{pending=null;startClip(name,immediate);}
}
function setView(name:string){
 view=name;const small=pet==='block_cat',height=small?.36:.65;
 const positions:Record<string,number[]>={front:[0,height+.35,3.8],threequarter:[2,height+.9,3.6],side:[3.8,height+.35,0],back:[0,height+.5,-3.8],face:[0,small?.72:.91,1.7]};
 const p=positions[name]??positions.threequarter;camera.position.set(p[0],p[1],p[2]);controls.target.set(0,name==='face'?(small?.66:.92):height,name==='face'?.40:0);controls.update();
 document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
}
function setPause(value:boolean){paused=value;$('pause').textContent=value?'재생':'일시정지';}
function dispose(root:THREE.Object3D){root.traverse(o=>{const mesh=o as THREE.Mesh;if(!mesh.isMesh)return;mesh.geometry.dispose();for(const mat of Array.isArray(mesh.material)?mesh.material:[mesh.material]){const m=mat as THREE.MeshStandardMaterial;m.map?.dispose();m.dispose();}});}
async function load(id:string){
 const request=++token;pet=id;pending=null;fx.visible=false;markers.forEach(m=>m.visible=false);$('error').textContent='';$('status').textContent='모델과 동작을 준비하고 있습니다.';
 document.querySelectorAll<HTMLButtonElement>('[data-clip]').forEach(b=>b.disabled=true);
 const base=`/tools/unit_lab/pets/${id}/`;$<HTMLImageElement>('reference').src=base+'reference.png';
 try{
  const [g,m]=await Promise.all([new GLTFLoader().loadAsync(base+id+'.glb?revision=PET04-02'),fetch(base+'manifest.json').then(r=>{if(!r.ok)throw new Error('manifest '+r.status);return r.json() as Promise<Metrics>;})]);
  if(request!==token){dispose(g.scene);return;}
  mixer?.stopAllAction();if(model){scene.remove(model);dispose(model);}model=g.scene;clips=g.animations;metrics=m;action=null;scene.add(model);
  model.traverse(o=>{if((o as THREE.Mesh).isMesh){const mesh=o as THREE.Mesh;mesh.castShadow=true;mesh.receiveShadow=false;for(const mat of Array.isArray(mesh.material)?mesh.material:[mesh.material])(mat as THREE.MeshStandardMaterial).wireframe=$<HTMLInputElement>('wire').checked;}});
  head=model.getObjectByName('head')??null;if(!head)throw new Error('머리 본을 찾지 못했습니다.');
  eyes[0].fromArray(m.eye_sockets_head_local.L);eyes[1].fromArray(m.eye_sockets_head_local.R);outerMat.color.set(m.laser.color??'#fc3654');
  mixer=new THREE.AnimationMixer(model);mixer.addEventListener('finished',e=>{if(e.action===action&&transition(current)){const next=pending??(current==='stand_up'?'idle_stand':'idle_sit');pending=null;startClip(next);}});
  $('petName').textContent=m.name??'BCAT 고양이';$('notes').textContent=notes[id];$('palette').replaceChildren();
  for(const h of Object.values(m.palette??{})){const i=document.createElement('i');i.style.background='#'+h;$('palette').append(i);}
  document.querySelectorAll<HTMLButtonElement>('[data-clip]').forEach(b=>b.disabled=!clips.some(c=>c.name===b.dataset.clip)&&!(id==='block_cat'&&b.dataset.clip==='idle_stand'));
  const q=new URL(location.href);q.searchParams.set('pet',id);history.replaceState(null,'',q);setPause(false);setView(view);play('idle_stand',true);
 }catch(error){if(request===token){$('error').textContent='불러오기 실패: '+String(error);$('status').textContent='모델 경로를 확인해주세요.';}console.error(error);}
}
document.querySelectorAll<HTMLButtonElement>('[data-clip]').forEach(b=>b.onclick=()=>{setPause(false);play(b.dataset.clip!);});
document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view!));
$('pet').onchange=()=>{void load($<HTMLSelectElement>('pet').value);};$('pause').onclick=()=>setPause(!paused);
$('speed').onchange=()=>speed=Number($<HTMLSelectElement>('speed').value);
$('seek').oninput=()=>{if(!action||!mixer)return;setPause(true);action.paused=false;action.time=Number($<HTMLInputElement>('seek').value)*action.getClip().duration;mixer.update(0);updateFx();};
$('wire').onchange=()=>model?.traverse(o=>{const mesh=o as THREE.Mesh;if(mesh.isMesh)for(const m of Array.isArray(mesh.material)?mesh.material:[mesh.material])(m as THREE.MeshStandardMaterial).wireframe=$<HTMLInputElement>('wire').checked;});
let last=performance.now(),sum=0,count=0;
function render(now:number){requestAnimationFrame(render);const dt=Math.min((now-last)/1000,.05);last=now;
 if(mixer&&!paused){if(current==='attack_laser'){attackElapsed+=dt*speed;if(attackElapsed>=(metrics?.laser.cooldown??3)){action?.reset().play();attackElapsed=0;}}mixer.update(dt*speed);}
 controls.update();updateFx();renderer.render(scene,camera);
 if(action){$<HTMLInputElement>('seek').value=String(action.time/action.getClip().duration);$('clock').textContent=`${action.time.toFixed(2)} / ${action.getClip().duration.toFixed(2)} s`;}
 sum+=dt;count++;if(sum>=1&&metrics){$('status').textContent=`${metrics.revision} · ${metrics.triangles.toLocaleString()} 삼각형 · ${metrics.bones} 본 · ${(metrics.bytes/1048576).toFixed(2)} MiB · ${clips.length} 동작 · ${Math.round(count/sum)} fps`;sum=0;count=0;}
}
setView('threequarter');requestAnimationFrame(render);
const requested=new URLSearchParams(location.search).get('pet'),valid=['nofilter','flux','lumos','gizmo','block_cat'];const initial=requested&&valid.includes(requested)?requested:'nofilter';$<HTMLSelectElement>('pet').value=initial;
if(location.protocol==='file:')$('error').textContent='Vite 서버로 실행해주세요: http://localhost:5179/pet-pack-tool.html';else void load(initial);
