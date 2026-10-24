const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path'),ts=require('C:/xoox/node_modules/typescript');
const dir=process.argv[2]||path.join(__dirname,'release');
function load(file,imports={}){const scope={exports:{},require:p=>imports[p]};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,scope);return scope.exports;}
const navModule=load('C:/xoox/src/maps/forest150/ForestNavigation.ts');
const defenseFile=process.argv[3]||path.join(__dirname,'ForestDefense.ts');
const {ForestDefense}=load(defenseFile,{'./ForestNavigation':navModule});
const base=JSON.parse(fs.readFileSync(path.join(dir,'navigation.json'))),layout=JSON.parse(fs.readFileSync(path.join(dir,'construction.json')));
assert.equal(layout.sites.length,5);assert.equal(layout.slots.length,10);assert.equal(base.width,300);assert.equal(base.height,600);
const game=new ForestDefense(base,layout),start=base.spawn,end={x:78,y:281};
let minWidth=Infinity,maxWidth=0;for(let y=32;y<564;y++){const row=base.walkable.slice(y*300,(y+1)*300),first=row.indexOf(1),last=row.lastIndexOf(1);assert(first>=0);assert(row.slice(first,last+1).every(Boolean));minWidth=Math.min(minWidth,(last-first+1)*.5);maxWidth=Math.max(maxWidth,(last-first+1)*.5);}
assert(minWidth>=35);
for(const s of layout.slots){for(let x=s.x-s.reserveWidth/2;x<=s.x+s.reserveWidth/2;x+=.5)for(let y=s.y-s.reserveDepth/2;y<=s.y+s.reserveDepth/2;y+=.5)assert(game.nav.canStand({x,y},.15),'Reserved plot must fit meadow: '+s.id);}
assert.equal(game.buildMany(layout.slots.map(s=>s.id)).length,10);
for(const s of layout.slots)assert(!game.nav.canStand(s,.6));
let route=game.nav.findPath(start,end,.6);assert(route.length>=2,'Ten buildings must not block forward route');
for(let i=1;i<route.length;i++)assert(game.nav.segmentClear(route[i-1],route[i],.6));
for(const s of layout.slots){const goal={x:s.x,y:s.y+s.depth/2+1.3};assert(game.nav.findPath(start,goal,.65).length,'Access to '+s.id);}
game.clear();assert(game.nav.canStand(layout.slots[0],.6));assert(!game.build('1-tower',[layout.slots[0]]),'Cannot build on an actor');
assert(game.build('1-unit'));let seed=2;const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/2**32};assert.equal(game.spawnAhead('1-unit',3,random),3);
const hitEvents=[];for(let i=0;i<800&&game.building('1-unit').built;i++){game.tick(.1);hitEvents.push(...game.drainEvents());for(const e of game.enemies)assert(game.nav.canStand(e.pos,.65));}
assert(hitEvents.some(e=>e.type==='hit'));assert(hitEvents.some(e=>e.type==='destroyed'));assert(!game.building('1-unit').built);assert(game.nav.canStand(layout.slots.find(s=>s.id==='1-unit'),.65));
assert(game.build('1-unit'));for(let i=0;i<20;i++)game.tick(.1);assert(game.enemies.some(e=>e.target==='1-unit'));
game.clear();game.build('2-tower');game.spawnAhead('2-tower',3,random);let shots=0,kills=0;
for(let i=0;i<700&&game.enemies.length;i++){game.tick(.1);for(const e of game.drainEvents()){if(e.type==='shot')shots++;if(e.type==='enemyDown')kills++;}}
assert(shots>0);assert(kills>0);
const report={passed:true,dimensions:[150,300],slots:10,sites:5,widthRangeM:[minWidth,maxWidth],areaM2:base.walkable.reduce((a,b)=>a+b,0)*.25,allBuiltForwardPath:route.length,buildingDamageAndDestruction:true,collisionRestoredAfterDestruction:true,retargetAfterRebuild:true,turretShots:shots,enemyKills:kills};
fs.writeFileSync(path.join(dir,'validation.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
