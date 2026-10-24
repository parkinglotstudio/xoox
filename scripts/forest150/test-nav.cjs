const fs=require('fs'),vm=require('vm'),assert=require('assert');
const ts=require('C:/xoox/node_modules/typescript');
const compiled=ts.transpileModule(fs.readFileSync(__dirname+'/../../src/maps/forest150/ForestNavigation.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const sandbox={exports:{}};vm.runInNewContext(compiled,sandbox);const {ForestNavigation}=sandbox.exports;
const data=JSON.parse(fs.readFileSync(__dirname+'/../../data/maps/forest150/releases/v1/navigation.json'));const nav=new ForestNavigation(data);
assert(nav.canStand(data.spawn));assert(!nav.canStand({x:0,y:0}));assert(!nav.canStand({x:75,y:75}));
let checks=0;for(const zone of data.zones){const goal={x:zone.x,y:zone.y};const path=nav.findPath(data.spawn,goal,.6);assert(path.length>=2);for(let i=1;i<path.length;i++){assert(nav.segmentClear(path[i-1],path[i],.6));checks++;}}
// Flood-fill all walkable cells: no unreachable accidental spawn pockets.
const visited=new Uint8Array(data.walkable.length),queue=[29*2*300+75*2];visited[queue[0]]=1;
for(let h=0;h<queue.length;h++){const i=queue[h];for(const j of [i-1,i+1,i-300,i+300])if(j>=0&&j<visited.length&&!visited[j]&&data.walkable[j]&&Math.abs(j%300-i%300)+Math.abs(Math.floor(j/300)-Math.floor(i/300))===1){visited[j]=1;queue.push(j);}}
assert.equal(queue.length,data.walkable.reduce((a,b)=>a+b,0));
let seed=41;const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/2**32;};
const spawns=nav.spawnPoints(60,{awayFrom:data.spawn,minDistance:14,random});assert.equal(spawns.length,60);
for(const p of spawns){assert(nav.canStand(p,1.65));assert(Math.hypot(p.x-data.spawn.x,p.y-data.spawn.y)>=14);const path=nav.findPath(p,data.spawn,.65);assert(path.length);for(let j=1;j<path.length;j++)assert(nav.segmentClear(path[j-1],path[j],.65));}
// A huge input cannot tunnel across forest. Circle edges must stay outside blocked cells.
for(let i=0;i<500;i++){const p=spawns[i%spawns.length],goal={x:random()*220-35,y:random()*220-35};const moved=nav.move(p,goal,.6);assert(nav.canStand(moved,.6));}
// Synthetic thin wall, corner clearance, out-of-bounds and disconnected destinations.
const tiny={schemaVersion:1,revision:'test',sizeMeters:10,cellMeters:1,width:10,height:10,walkable:Array(100).fill(1),clearanceMeters:Array(100).fill(0),spawn:{x:2,y:5},zones:[]};for(let y=0;y<10;y++)tiny.walkable[y*10+5]=0;
const wall=new ForestNavigation(tiny);assert(!wall.segmentClear({x:2,y:5},{x:8,y:5},.4));assert(wall.move({x:2,y:5},{x:8,y:5},.4).x<4.61);assert.equal(wall.findPath({x:2,y:5},{x:8,y:5},.4).length,0);assert(!wall.canStand({x:4.8,y:5},.4));assert(!wall.canStand({x:NaN,y:5}));
console.log(JSON.stringify({passed:true,walkableCells:queue.length,areaM2:queue.length*.25,roomSegments:checks,spawnRoutes:60,sweptMoves:500}));

