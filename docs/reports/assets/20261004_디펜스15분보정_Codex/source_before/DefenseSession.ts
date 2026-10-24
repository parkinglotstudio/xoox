import type { Point } from '../../maps/forest150/ForestNavigation';

export type DefenseMode = 'tower' | 'wave' | 'base';
export type FacilityKind = 'tower_gun' | 'tower_throw' | 'tower_cannon' | 'tower_ballista' | 'tower_catapult' | 'k_tent' | 'k_structure' | 'k_machine' | 'k_crane' | 'base';
export const MODE_SECONDS: Record<DefenseMode, number> = { tower: 45, wave: 70, base: 60 };
export const MODE_LABEL: Record<DefenseMode, string> = { tower: '타워 디펜스', wave: '웨이브 디펜스', base: '기지 방어' };
export interface Facility { id: string; kind: FacilityKind; name: string; pos: Point; maxHp: number; hp: number; routeS: number; approach: Point[]; cooldown: number; }
export interface DefenderEnemy { id: number; hp: number; s: number; branchS: number; target: string | null; phase: 'road' | 'approach' | 'attack' | 'return'; cooldown: number; speed: number; lane: number; pos: Point; alive: boolean; }
export interface DefenseEvent { type: 'shot' | 'hit' | 'bite' | 'destroy' | 'down' | 'spawn'; id: number | string; target?: number | string; from?: Point; to?: Point; damage?: number; source?: 'enemy_attack' | 'tower_shot'; kind?: FacilityKind; }
interface Flight { target: number; time: number; damage: number; }
const GUN: Partial<Record<FacilityKind, { damage: number; interval: number; range: number; velocity: number }>> = {
 tower_gun: { damage: 10, interval: .45, range: 30, velocity: 65 },
 tower_throw: { damage: 18, interval: 1.3, range: 27, velocity: 25 },
 tower_cannon: { damage: 30, interval: 1.7, range: 32, velocity: 38 },
 tower_ballista: { damage: 22, interval: 1.1, range: 34, velocity: 60 },
 tower_catapult: { damage: 36, interval: 2.1, range: 35, velocity: 22 },
};
export function pathLength(path: Point[]): number { let n = 0; for (let i = 1; i < path.length; i++) n += Math.hypot(path[i].x-path[i-1].x,path[i].y-path[i-1].y); return n; }
export function onPath(path: Point[], s: number): Point {
 if (!path.length) return { x: 75, y: 26 };
 for (let i=1;i<path.length;i++) { const a=path[i-1],b=path[i],d=Math.hypot(b.x-a.x,b.y-a.y); if (s<=d) { const t=d?Math.max(0,s/d):0;return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t}; } s-=d; }
 return {...path[path.length-1]};
}
export function projectPath(path: Point[], p: Point): { s: number; point: Point; distance: number } {
 let total=0,best={s:0,point:{...path[0]},distance:Infinity};
 for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),t=d?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(d*d))):0,q={x:a.x+dx*t,y:a.y+dy*t},distance=Math.hypot(p.x-q.x,p.y-q.y);if(distance<best.distance)best={s:total+d*t,point:q,distance};total+=d;}
 return best;
}
/** One enemy list and one damage authority. Time never damages facilities. */
export class DefenseSession {
 readonly facilities: Facility[];
 readonly enemies: DefenderEnemy[]=[];
 readonly mode: DefenseMode;
 elapsed=0; finished=false; paused=false; killed=0; spawned=0; biteCount=0;
 private events: DefenseEvent[]=[];private flights: Flight[]=[];private nextSpawn=0;private serial=0;
 private accumulator=0;private waveTag=-1;
 constructor(mode:DefenseMode,readonly route:Point[],facilities:Facility[],readonly spawnEnabled=true){
  if(route.length<2)throw new Error('Defense route requires two points');
  this.mode=mode;this.facilities=facilities.map(f=>({...f,pos:{...f.pos},approach:f.approach.map(p=>({...p})),hp:f.maxHp,cooldown:0})).sort((a,b)=>a.routeS-b.routeS);
 }
 get duration(){return MODE_SECONDS[this.mode];}
 get remaining(){return Math.max(0,this.duration-this.elapsed);}
 get alive(){return this.enemies.filter(e=>e.alive).length;}
 get destroyed(){return this.facilities.filter(f=>f.hp<=0).length;}
 get phaseLabel(){if(this.finished)return '시간 종료 · 관찰 완료';if(this.mode!=='wave')return '방어 진행';const t=this.elapsed;return t<20?'웨이브 1 / 3':t<25?'다음 웨이브까지':t<45?'웨이브 2 / 3':t<50?'다음 웨이브까지':'웨이브 3 / 3';}
 get focus(){const f=this.facilities.find(f=>f.hp>0);return f?{...f.pos}:onPath(this.route,pathLength(this.route));}
 drainEvents(){const out=this.events;this.events=[];return out;}
 advance(dt:number){if(!Number.isFinite(dt)||dt<=0||this.paused||this.finished)return;this.accumulator+=dt;while(this.accumulator>=.05&&!this.finished){this.step(.05);this.accumulator-=.05;}}
 private step(dt:number){
  const before=this.elapsed;this.elapsed=Math.min(this.duration,this.elapsed+dt);
  if(this.spawnEnabled){const segment=this.mode==='wave'?(before<20?0:before<25?-1:before<45?1:before<50?-1:2):0;if(segment!==this.waveTag){this.waveTag=segment;this.nextSpawn=0;}
   if(segment>=0){this.nextSpawn-=dt;if(this.nextSpawn<=0&&this.alive<32){this.spawn();this.nextSpawn+=this.mode==='base'?.32:this.mode==='wave'?.42:.55;}}}
  for(const flight of this.flights)flight.time-=dt;
  const pending:Flight[]=[];for(const f of this.flights){if(f.time>0){pending.push(f);continue;}const e=this.enemies.find(e=>e.id===f.target&&e.alive);if(e){e.hp=Math.max(0,e.hp-f.damage);this.events.push({type:'hit',id:e.id,damage:f.damage,source:'tower_shot',to:{...e.pos}});if(!e.hp){e.alive=false;this.killed++;this.events.push({type:'down',id:e.id,to:{...e.pos}});}}}this.flights=pending;
  for(const e of this.enemies){if(!e.alive)continue;e.cooldown-=dt;
   let f=e.target?this.facilities.find(f=>f.id===e.target):undefined;
   if((e.phase==='approach'||e.phase==='attack')&&(!f||f.hp<=0))e.phase='return';
   if(e.phase==='road'){
    const next=this.facilities.find(f=>f.hp>0&&f.routeS>=e.s-.01);
    e.s+=e.speed*dt;
    if(next&&e.s>=next.routeS){e.s=next.routeS;e.target=next.id;e.branchS=0;e.phase='approach';f=next;}
    else if(e.s>=pathLength(this.route)){e.alive=false;continue;}
    e.pos=onPath(this.route,e.s);
   }
   if(e.phase==='approach'&&f){e.branchS=Math.min(pathLength(f.approach),e.branchS+e.speed*dt);e.pos=onPath(f.approach,e.branchS);if(e.branchS>=pathLength(f.approach)-.01)e.phase='attack';}
   if(e.phase==='attack'&&f&&f.hp>0&&e.cooldown<=0){
    e.cooldown=.8;const damage=26;f.hp=Math.max(0,f.hp-damage);this.biteCount++;
    this.events.push({type:'bite',id:e.id,target:f.id,from:{...e.pos},to:{...f.pos},damage,source:'enemy_attack'});
    if(f.hp===0)this.events.push({type:'destroy',id:f.id,to:{...f.pos},source:'enemy_attack'});
   }
   if(e.phase==='return'){if(f&&e.branchS>0){e.branchS=Math.max(0,e.branchS-e.speed*dt);e.pos=onPath(f.approach,e.branchS);}if(!f||e.branchS===0){e.phase='road';e.target=null;e.pos=onPath(this.route,e.s);}}
  }
  for(const f of this.facilities){const gun=GUN[f.kind];if(!gun||f.hp<=0)continue;f.cooldown-=dt;if(f.cooldown>0)continue;
   const targets=this.enemies.filter(e=>e.alive&&Math.hypot(e.pos.x-f.pos.x,e.pos.y-f.pos.y)<=gun.range).sort((a,b)=>b.s-a.s||a.id-b.id),e=targets[0];
   if(e){f.cooldown=gun.interval;this.flights.push({target:e.id,time:Math.hypot(e.pos.x-f.pos.x,e.pos.y-f.pos.y)/gun.velocity,damage:gun.damage});this.events.push({type:'shot',id:f.id,target:e.id,from:{...f.pos},to:{...e.pos},kind:f.kind});}
  }
  if(this.elapsed>=this.duration-1e-8){this.elapsed=this.duration;this.finished=true;}
 }
 private spawn(){const id=++this.serial,e:DefenderEnemy={id,hp:65+(id%3)*12,s:0,branchS:0,target:null,phase:'road',cooldown:0,speed:12+(id%3),lane:id%2?.7:-.7,pos:onPath(this.route,0),alive:true};this.enemies.push(e);this.spawned++;this.events.push({type:'spawn',id,to:{...e.pos}});}
}
