import fs from 'node:fs';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
const compiled=await build({stdin:{contents:"export * from './src/tools/forestPlay/DefenseSession.ts';export * from './src/tools/forestPlay/DefenseBalance.ts';export * from './src/tools/forestPlay/DefenseOutpost.ts'",resolveDir:process.cwd()},bundle:true,write:false,platform:'node',format:'esm'});
const {DefenseSession,defaultDefenseSettings,DEFENSE_BALANCE:B,traitsFor,outpostNavigation}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const route=[{x:0,y:100},{x:0,y:-100}];
const facility=kind=>({id:'test',kind,name:'test',pos:{x:0,y:0},maxHp:2500,hp:2500,routeS:100,approach:[],cooldown:0});
const enemy=(id,pos,hp=10000)=>({id,archetype:'q_green_blob',stage:0,maxHp:hp,hp,s:80,target:null,phase:'attack',cooldown:0,speed:0,baseSpeed:0,lane:0,roadS:80,groupId:1,pos:{...pos},facing:{x:0,y:-1},alive:true,deadAt:-1,damage:10,armor:0,attackInterval:1,slot:-1,path:[],waypoint:0,slowUntil:0,slowMultiplier:1,stunUntil:0});
const fixture=(kind,adjust=()=>{})=>{const settings=defaultDefenseSettings();settings.weapons=kind?{[kind]:settings.weapons[kind]}:{};adjust(settings);return new DefenseSession('tower',route,kind?[facility(kind)]:[],false,undefined,settings);};
let oneHit=0;
for(const kind of ['tower_gun','tower_ballista'])for(let stage=0;stage<5;stage++)for(const id of B.stages[stage].monsters){
 const game=fixture(kind),t=traitsFor(id),mob=enemy(1,{x:0,y:20},Math.round(B.stages[stage].hp*t.hpMultiplier));mob.archetype=id;mob.stage=stage;mob.armor=t.armor;game.enemies.push(mob);
 let hits=0;for(let n=0;n<30&&mob.alive;n++){game.advance(.05);hits+=game.drainEvents().filter(e=>e.type==='hit').length;}
 assert.equal(hits,1,kind+' '+id+' first hit');assert.equal(mob.alive,false);assert.equal(game.directKills,1);oneHit++;
}
const area=[];
for(const kind of ['tower_throw','tower_cannon','tower_catapult']){
 const game=fixture(kind,s=>s.weapons[kind].interval=15),radius=game.settings.weapons[kind].splash;
 const primary=enemy(1,{x:0,y:20}),near=enemy(2,{x:3,y:20}),edge=enemy(3,{x:radius-.1,y:20}),outside=enemy(4,{x:radius+3,y:20});game.enemies.push(primary,near,edge,outside);
 let shot;for(let n=0;n<30&&!shot;n++){game.advance(.05);shot=game.drainEvents().find(e=>e.type==='shot');}assert.ok(shot);assert.equal(shot.attack,'area');assert.deepEqual(shot.to,{x:0,y:20});
 primary.pos={x:30,y:20};const center=enemy(5,{x:0,y:20});game.enemies.push(center);
 game.advance(shot.flightSeconds+.1);const events=game.drainEvents(),impact=events.find(e=>e.type==='impact');assert.deepEqual(impact.to,shot.to,'Landing point must remain fixed');
 assert.equal(primary.hp,primary.maxHp,'Target escaped the area, no direct-hit shortcut');assert.equal(outside.hp,outside.maxHp,'Outside radius is safe');
 assert.ok(center.hp<near.hp&&near.hp<edge.hp&&edge.hp<edge.maxHp,'Center damage > edge damage');assert.equal(game.areaHits,3);area.push({kind,radius,damageCenter:center.maxHp-center.hp,damageEdge:edge.maxHp-edge.hp,fixedPoint:impact.to,escapeUndamaged:true});
}
const trapChecks=[];
for(const kind of ['slow','bind','spikes','mine']){
 const game=fixture(null),trap={id:'trap',kind,pos:{x:0,y:20},cooldown:0,activations:0};game.traps.push(trap);const mob=enemy(1,{x:0,y:20});mob.baseSpeed=4;game.enemies.push(mob);game.advance(.05);
 const firstDamage=mob.maxHp-mob.hp,p=game.settings.traps[kind];assert.equal(trap.activations,1);assert.ok(game.drainEvents().some(e=>e.type==='trap'));
 if(kind==='slow')assert.equal(mob.speed,4*p.slowMultiplier);if(kind==='bind')assert.equal(mob.speed,0);if(kind==='spikes'||kind==='mine')assert.equal(firstDamage,p.damage);
 mob.pos={x:30,y:20};game.advance(Math.max(p.duration,p.cooldown)+.1);assert.equal(mob.speed,4);assert.equal(trap.activations,1);
 mob.pos={x:0,y:20};game.advance(.05);assert.equal(trap.activations,2,'Trap rearms after cooldown');trapChecks.push({kind,firstDamage,rearmed:true,statusExpires:true});
}
// Bind blocks a real attack station, rather than only changing a speed label.
{
 const settings=defaultDefenseSettings();settings.weapons={};const f=facility('base'),g=new DefenseSession('tower',route,[f],false,undefined,settings);
 const spot=g.stations.get('test')[0],mob=enemy(1,spot.pos);mob.target='test';mob.slot=0;spot.owner=1;g.enemies.push(mob);
 g.traps.push({id:'bind',kind:'bind',pos:{...spot.pos},cooldown:0,activations:0});g.advance(.05);assert.equal(g.biteCount,0);
 g.traps[0].pos={x:100,y:100};g.advance(settings.traps.bind.duration+.1);assert.ok(g.biteCount>0);
}
// Adjustable settings affect the damage authority, with no modification to defaults.
{
 const g=fixture('tower_gun',s=>{s.weapons.tower_gun.damage=1;s.weapons.tower_gun.burst=1;s.weapons.tower_gun.interval=1;});const mob=enemy(1,{x:0,y:20},100);g.enemies.push(mob);g.advance(.8);assert.equal(mob.hp,99);g.advance(.5);assert.equal(mob.hp,98);assert.equal(defaultDefenseSettings().weapons.tower_gun.damage,600);
 const g2=fixture('tower_catapult',s=>{s.weapons.tower_catapult.windup=2;s.weapons.tower_catapult.interval=.1;});g2.enemies.push(enemy(1,{x:0,y:20}));g2.advance(1.5);assert.equal(g2.preparations.length,1,'No overlapping windups');
}
assert.ok(Math.min(...Object.values(B.weapons).filter(w=>w.attack==='area').map(w=>w.interval))>Math.max(...Object.values(B.weapons).filter(w=>w.attack==='direct').map(w=>w.interval))*5);
{
 const mask=JSON.parse(fs.readFileSync('data/maps/forest150/releases/v3/navigation.json','utf8')),before=JSON.stringify(mask),nav=outpostNavigation(mask),p={x:66,y:242};
 const c=mask.cellMeters,i=Math.floor(p.y/c)*mask.width+Math.floor(p.x/c);assert.equal(mask.walkable[i],1);assert.equal(nav.canStand(p,.65),false);assert.equal(nav.canStand({x:75,y:242},.65),true,'Central passage remains open');
 nav.removeObstacle('wall-left');assert.equal(nav.canStand(p,.65),true);nav.reset();assert.equal(nav.canStand(p,.65),false);assert.equal(JSON.stringify(mask),before,'Original map data remains unchanged');
 const s=defaultDefenseSettings();s.weapons={};let removed;
 const g=new DefenseSession('tower',route,[{...facility('k_fence_fortified'),maxHp:1}],false,{canStand:()=>true,move:(_a,b)=>b,findPath:(a,b)=>[a,b],removeObstacle:id=>removed=id},s);
 const spot=g.stations.get('test')[0],mob=enemy(1,spot.pos);mob.target='test';mob.slot=0;spot.owner=1;g.enemies.push(mob);g.advance(.05);assert.equal(removed,'test');assert.equal(g.destroyed,1);
}
const result={revision:B.revision,first_hit_kill_cases:oneHit,area,traps:trapChecks,bind_prevents_attacks:true,settings_change_actual_damage:true,no_overlapping_windups:true,wall_collision_release_and_replay_reset:true,original_navigation_unchanged:true};
fs.writeFileSync('docs/reports/assets/20261004_방어진지와시설동작_Codex/attack_role_checks.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
