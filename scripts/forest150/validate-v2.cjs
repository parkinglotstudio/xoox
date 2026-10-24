const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const ts=require('C:/xoox/node_modules/typescript');
const source=fs.readFileSync('C:/xoox/src/maps/forest150/ForestNavigation.ts','utf8');
const output=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const scope={exports:{}};vm.runInNewContext(output,scope);
const directory=process.argv[2]||path.join(__dirname,'release');
const d=JSON.parse(fs.readFileSync(path.join(directory,'navigation.json'))),nav=new scope.exports.ForestNavigation(d);
assert.equal(d.width,300);assert.equal(d.height,600);assert(nav.canStand(d.spawn));
const seedIndex=Math.floor(d.spawn.y/.5)*d.width+Math.floor(d.spawn.x/.5),seen=new Uint8Array(d.walkable.length),queue=[seedIndex];seen[seedIndex]=1;
for(let h=0;h<queue.length;h++){const i=queue[h];for(const j of [i-1,i+1,i-d.width,i+d.width])if(j>=0&&j<seen.length&&!seen[j]&&d.walkable[j]&&Math.abs(i%d.width-j%d.width)+Math.abs(Math.floor(i/d.width)-Math.floor(j/d.width))===1){seen[j]=1;queue.push(j);}}
assert.equal(queue.length,d.walkable.reduce((a,b)=>a+b,0));
let minWidth=Infinity,maxWidth=0;
for(let y=30;y<566;y++){const row=d.walkable.slice(y*d.width,(y+1)*d.width),first=row.indexOf(1),last=row.lastIndexOf(1);assert(first>=0);assert(row.slice(first,last+1).every(Boolean),'No disconnected lateral pockets');const width=(last-first+1)*.5;minWidth=Math.min(minWidth,width);maxWidth=Math.max(maxWidth,width);}
assert(minWidth>=20,'Keep wide forward passage');
let segments=0;const end={x:78,y:281};for(const goal of [...d.zones,end]){const route=nav.findPath(d.spawn,goal,.6);assert(route.length>=2);for(let i=1;i<route.length;i++){assert(nav.segmentClear(route[i-1],route[i],.6));segments++;}}
let state=927;const random=()=>{state=(1664525*state+1013904223)>>>0;return state/2**32};
const points=nav.spawnPoints(12,{radius:.65,awayFrom:d.spawn,minDistance:14,random});assert.equal(points.length,12);assert(points.some(p=>p.y>150));
for(const p of points){assert(nav.canStand(p,1.65));const route=nav.findPath(p,end,.65);assert(route.length);for(let j=1;j<route.length;j++)assert(nav.segmentClear(route[j-1],route[j],.65));}
for(let i=0;i<60;i++){const p=points[i%points.length],moved=nav.move(p,{x:random()*200-25,y:random()*350-25},.6);assert(nav.canStand(moved,.6));}
assert(!nav.canStand({x:149.9,y:200}));assert(!nav.canStand({x:80,y:300}));
const report={passed:true,dimensions:[150,300],cells:[d.width,d.height],connectedCells:queue.length,walkableAreaM2:queue.length*.25,corridorWidthRangeM:[minWidth,maxWidth],verifiedRouteSegments:segments,monsterRoutes:12,sweptMoves:60};
fs.writeFileSync(path.join(directory,'validation.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
