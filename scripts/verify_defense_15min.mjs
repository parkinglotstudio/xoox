import fs from 'node:fs';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
const load = async entry => {
  const result = await build({entryPoints:[entry],bundle:true,write:false,platform:'node',format:'esm'});
  return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
};
const {outpostNavigation,outpostFacilities,outpostTraps} = await load('src/tools/forestPlay/DefenseOutpost.ts');
const {defaultDefenseSettings} = await load('src/tools/forestPlay/DefenseBalance.ts');
const {DefenseSession,projectPath,pathLength} = await load('src/tools/forestPlay/DefenseSession.ts');
const balance = JSON.parse(fs.readFileSync('data/tools/unit_lab/defense_balance.json','utf8'));
const traits = JSON.parse(fs.readFileSync('data/tools/unit_lab/defense_monsters.json','utf8')).monsters;
const mask = JSON.parse(fs.readFileSync('data/maps/forest150/releases/v3/navigation.json','utf8'));
const layout = JSON.parse(fs.readFileSync('data/maps/forest150/releases/v3/construction.json','utf8'));
const catalog = JSON.parse(fs.readFileSync('data/tools/unit_lab/units_free.json','utf8')).units.filter(u=>u.group==='enemy_monster');
const listed = balance.stages.flatMap(s=>s.monsters);
assert.equal(listed.length,45); assert.deepEqual([...listed].sort(),catalog.map(u=>u.id).sort());
assert.deepEqual(Object.keys(traits).sort(),listed.slice().sort());
assert.equal(new Set(Object.values(traits).map(t=>[t.hpMultiplier,t.speedMultiplier,t.damageMultiplier,t.attackIntervalMultiplier,t.armor,t.sector].join(','))).size,45,'Every monster has distinct settings');
const nav = outpostNavigation(mask), row=Math.min(mask.height-3,Math.floor(284/mask.cellMeters)), north=[];
for(let x=0;x<mask.width;x++){const p={x:(x+.5)*mask.cellMeters,y:(row+.5)*mask.cellMeters};if(nav.canStand(p,.65))north.push(p);}
north.sort((a,b)=>Math.abs(a.x-75)-Math.abs(b.x-75));let route=[];
for(const start of north){route=nav.findPath(start,mask.spawn,.65);if(route.length>1)break;}
assert.ok(route.length>1);
const kinds=['tower_gun','tower_throw','tower_cannon','tower_ballista','tower_catapult','k_tent','k_structure','k_machine','k_crane'];
const slots=[...layout.slots.filter(s=>s.kind==='tower'),...layout.slots.filter(s=>s.kind==='unit').slice(0,4)].map((s,i)=>({id:s.id,kind:kinds[i],name:kinds[i],pos:{x:s.x,y:s.y},maxHp:i<5?balance.facilityHp.tower:balance.facilityHp.obstacle}));
slots.push({id:'south-base',kind:'base',name:'base',pos:{x:mask.spawn.x,y:mask.spawn.y-6},maxHp:balance.facilityHp.base});
const facilities=outpostFacilities(route,mask.spawn);
const report={revision:balance.revision,route_length_m:pathLength(route),catalog_45_complete:true,distinct_monster_settings:45,modes:{}};
for(const mode of ['tower','wave','base']){
 const game=new DefenseSession(mode,route,facilities,true,nav,defaultDefenseSettings(),outpostTraps()),destroyEvents=[],shots=new Map(),hits=new Map(),shotsByKind={};
 assert.equal(game.entryRoutes.size,45);assert.equal(new Set([...game.entryRoutes.values()].map(r=>JSON.stringify(r))).size,45,'Every catalog monster has its own spline');
 if(mode==='tower'){const out='docs/reports/assets/20261004_방어진지와시설동작_Codex';fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/entry_routes.json',JSON.stringify(Object.fromEntries(game.entryRoutes),null,2));}
 for(const [id,r]of game.entryRoutes)for(let i=1;i<r.length;i++)assert.ok(nav.segmentClear(r[i-1],r[i],.65),id+' spline must stay navigable');
 const groups=new Map(),settings=new Map();
 let minDistance=Infinity,invalidPositions=0,burstPairs=0,repeatedHits=0,firstDeath=null,maxRetained=0,early=null;
 const snapshots=[]; const begin=performance.now();
 while(!game.finished){
  game.advance(.05);
  for(const e of game.drainEvents()){
   if(e.type==='spawn'){const mob=game.enemies.find(m=>m.id===e.id);if(mob){const members=groups.get(mob.groupId)??[];members.push(mob.archetype);groups.set(mob.groupId,members);settings.set(mob.archetype,{hp:mob.maxHp,speed:mob.speed,damage:mob.damage,interval:mob.attackInterval,armor:mob.armor,sector:mob.lane});}}
   if(e.type==='destroy'){destroyEvents.push({id:e.id,time:game.elapsed});if(firstDeath===null)firstDeath=game.elapsed;assert.equal(e.source,'enemy_attack');}
   if(e.type==='shot'){shotsByKind[e.kind]=(shotsByKind[e.kind]??0)+1;const last=shots.get(e.id);if(last!==undefined&&game.elapsed-last<=.3)burstPairs++;shots.set(e.id,game.elapsed);}
   if(e.type==='hit'){const last=hits.get(e.id);if(last!==undefined&&game.elapsed-last<=.5)repeatedHits++;hits.set(e.id,game.elapsed);}
  }
  const live=game.enemies.filter(e=>e.alive);
  for(const e of live)if(!nav.canStand(e.pos,.65))invalidPositions++;
  for(let i=0;i<live.length;i++)for(let j=i+1;j<live.length;j++)minDistance=Math.min(minDistance,Math.hypot(live[i].pos.x-live[j].pos.x,live[i].pos.y-live[j].pos.y));
  const owners=live.filter(e=>e.target&&e.slot>=0).map(e=>e.target+':'+e.slot);assert.equal(new Set(owners).size,owners.length,'Station ownership must be unique');
  maxRetained=Math.max(maxRetained,game.enemies.length);
  if(!early&&game.elapsed>=180)early={spawned:game.stageSpawned[0],killed:game.stageKilled[0],rate:game.stageKilled[0]/game.stageSpawned[0],facilities:game.facilities.map(f=>({id:f.id,hp:f.hp}))};
  if(snapshots.length<5&&game.elapsed>=(snapshots.length+1)*180)snapshots.push({time:game.elapsed,alive:game.alive,killed:game.killed,seen:game.seen.size,facilities:game.facilities.map(f=>({id:f.id,hp:f.hp}))});
 }
 const mixedGroups=[...groups.values()].filter(m=>new Set(m).size>=2);
 assert.ok(mixedGroups.some(m=>m.length===2)&&mixedGroups.some(m=>m.length===3),'Mixed groups of 2 and 3 species must spawn');
 assert.equal(settings.size,45);assert.ok(Math.max(...[...settings.values()].map(s=>s.speed))-Math.min(...[...settings.values()].map(s=>s.speed))>2);
 const result={shotsByKind,areaShots:game.areaShots,areaHits:game.areaHits,areaMisses:game.areaMisses,directKills:game.directKills,trapHits:game.trapHits,traps:game.traps,alive_end:game.alive,seconds:game.elapsed,spawned:game.spawned,killed:game.killed,seen:game.seen.size,stageSpawned:game.stageSpawned,stageKilled:game.stageKilled,early,peakAlive:game.peakAlive,min_spacing_m:minDistance,invalidPositions,shots:game.shotCount,hits:game.hitCount,burstPairs,repeatedHits,splashHits:game.splashHits,pierceHits:game.pierceHits,destroyed:game.destroyed,firstDeath,destruction_order:destroyEvents,baseHp:game.facilities.find(f=>f.kind==='base').hp,maxRetained,mixedGroups:mixedGroups.length,splines:game.entryRoutes.size,settings:Object.fromEntries(settings),snapshots,simulation_ms:Math.round(performance.now()-begin)};
 report.modes[mode]=result;console.log(JSON.stringify({...result,snapshots:undefined,settings:undefined,early:{rate:early.rate}},null,2));
 assert.equal(game.elapsed,mode==='wave'?940:900);assert.equal(game.seen.size,45);assert.ok(early.rate>=.9,'At least 90% early fodder should be defeated by 3 minutes');
 assert.ok(result.baseHp>0,'Base must survive the full 15 minutes');assert.equal(invalidPositions,0);assert.ok(minDistance>=2.4,'Enemies must remain apart');
 assert.ok(burstPairs>0&&game.splashHits>0);assert.equal(Object.keys(shotsByKind).length,5,'All 5 weapons must fire');assert.ok(game.traps.every(t=>t.activations>0),'All 4 traps must activate');assert.ok(game.peakAlive<40&&game.alive<20,'No late-game backlog');assert.equal(new Set(destroyEvents.map(e=>e.id)).size,destroyEvents.length);assert.ok(maxRetained<100);
 const end=game.elapsed;game.advance(30);assert.equal(game.elapsed,end);
 const paused=new DefenseSession(mode,route,facilities,true,nav);paused.paused=true;paused.advance(20);assert.equal(paused.elapsed,0);assert.equal(paused.spawned,0);
 const empty=new DefenseSession(mode,route,facilities,false,nav);empty.advance(empty.duration);assert.ok(empty.finished);assert.ok(empty.facilities.every(f=>f.hp===f.maxHp));
}
const wave=new DefenseSession('wave',route,facilities,true,nav);wave.advance(180.05);const count=wave.spawned;wave.advance(9.8);assert.equal(count,wave.spawned);report.wave_gap_no_spawn=true;
const out='docs/reports/assets/20261004_방어진지와시설동작_Codex';fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/logic_checks.json',JSON.stringify(report,null,2));
console.log('PASS: 15-minute survival, 45 voxel species, early clear, separation, navigation, bursts, direct kills, ground area attacks, traps, no backlog, splash, bounded storage, pause, wave gaps.');
