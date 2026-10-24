"""Blender forest island. One mask drives art, collision and navigation (metres)."""
import bpy, math, random, json, sys, struct
from pathlib import Path
from collections import defaultdict, deque
from mathutils import Matrix, Vector

OUT = Path(sys.argv[sys.argv.index('--')+1]); OUT.mkdir(parents=True, exist_ok=True)
ROOT = Path('C:/xoox')
# Reuse geometry/export helpers without running the legacy map builder.
common = (ROOT/'scripts/block-map-r4/map_common.py').read_text(encoding='utf-8-sig').rsplit('\nmain()',1)[0]
ns = {'__file__':str(ROOT/'scripts/block-map-r4/map_common.py'), '__name__':'forest_helpers'}
exec(common, ns)
export_source = (ROOT/'scripts/block-map-r4/build_release.py').read_text(encoding='utf-8-sig')
exec(export_source[export_source.index('def export_glb'):export_source.index('\nstats={}')].replace("kind.startswith(('tuft','flower'))", "kind.startswith(('tuft','flower','tree','shrub','rock'))").replace('loc.x//20','loc.x//30').replace('loc.z//20','loc.z//30'), globals())
NX=300; NY=600; CELL=.5; WIDTH=150; LENGTH=300; rng=random.Random(927300)
# A single connected upward meadow with independent, irregular left/right edges.
# Control stations specify width, not circles. Smooth interpolation avoids room/neck rings.
stations=[(14,72,38),(30,75,54),(58,66,47),(84,62,42),(108,78,54),
          (135,91,49),(162,82,40),(189,65,56),(215,69,48),(241,81,46),
          (265,83,58),(283,78,43),(287,78,34)]
def edges(y):
    for i in range(len(stations)-1):
        ya,ca,wa=stations[i];yb,cb,wb=stations[i+1]
        if ya<=y<=yb:
            t=(y-ya)/(yb-ya);t=t*t*(3-2*t)
            center=ca+(cb-ca)*t; width=wa+(wb-wa)*t
            left=center-width/2 + 1.3*math.sin(y*.39)+.8*math.sin(y*.91+.3)
            right=center+width/2 + 1.6*math.sin(y*.31+1.2)+.65*math.sin(y*1.1)
            return left,right
    return 0,0
def playable(x,y):
    if not (14<y<287):return False
    left,right=edges(y)
    return left<x<right
# Paired sites are inside the existing meadow, never on the traffic centreline.
sites=[]; slots=[]
for idx,(y,side,name) in enumerate(((46,-1,'출발 방어'),(98,1,'오른쪽 굴곡'),(150,-1,'중간 방어'),(203,1,'긴 진입 구간'),(255,-1,'마지막 공터')),1):
    samples=[edges(q) for q in range(y-14,y+15)]
    x=max(a for a,b in samples)+7 if side<0 else min(b for a,b in samples)-7
    x=round(x*2)/2
    sites.append({'id':idx,'name':name,'x':x,'y':y,'side':side})
    for kind,dy,reserve,size,hp in (('tower',7,8,6,220),('unit',-7,10,8,180)):
        slots.append({'id':f'{idx}-{kind}','site':idx,'kind':kind,'x':x,'y':y+dy,'width':size,'depth':size,'reserveWidth':reserve,'reserveDepth':reserve,'maxHp':hp,'range':28 if kind=='tower' else 0})
(OUT/'construction.json').write_text(json.dumps({'schemaVersion':1,'revision':'forest150x300-v3','sites':sites,'slots':slots},ensure_ascii=False,indent=2),encoding='utf-8')
def reserved(x,y,margin=1):
    return any(abs(x-q['x'])<q['reserveWidth']/2+margin and abs(y-q['y'])<q['reserveDepth']/2+margin for q in slots)
rooms=[(75,30,22,16),(78,108,22,20),(65,189,22,19),(83,265,24,18)]
mask=[int(playable((x+.5)*CELL,(y+.5)*CELL)) for y in range(NY) for x in range(NX)]
def at(x,y):
    return mask[int(y/CELL)*NX+int(x/CELL)] if 0<=x<WIDTH and 0<=y<LENGTH else 0
# Exact distance to the nearest blocked-cell centre through separable squared EDT.
def edt1(f):
    v=[0]*len(f); z=[-float('inf')]+[float('inf')]*len(f); k=0
    for q in range(1,len(f)):
        s=((f[q]+q*q)-(f[v[k]]+v[k]*v[k]))/(2*q-2*v[k])
        while s<=z[k]:
            k-=1; s=((f[q]+q*q)-(f[v[k]]+v[k]*v[k]))/(2*q-2*v[k])
        k+=1; v[k]=q; z[k]=s; z[k+1]=float('inf')
    k=0; d=[]
    for q in range(len(f)):
        while z[k+1]<q:k+=1
        d.append((q-v[k])**2+f[v[k]])
    return d
rows=[edt1([1e9 if mask[y*NX+x] else 0 for x in range(NX)]) for y in range(NY)]
distance=[0.]*(NX*NY)
for x in range(NX):
    col=edt1([rows[y][x] for y in range(NY)])
    for y in range(NY):distance[y*NX+x]=max(0,math.sqrt(col[y])*CELL-math.sqrt(2)*CELL/2)
def clearance(x,y):return distance[int(y/CELL)*NX+int(x/CELL)] if 0<=x<WIDTH and 0<=y<LENGTH else 0
nav={'schemaVersion':1,'revision':'forest150x300-v3','sizeMeters':WIDTH,'widthMeters':WIDTH,'lengthMeters':LENGTH,'cellMeters':CELL,'width':NX,'height':NY,
     'coordinates':'x east, y north; row 0 = south; Three.js (x,0,-y)', 'walkable':mask,
     'clearanceMeters':[round(v,3) for v in distance], 'spawn':{'x':75,'y':26},
     'zones':[{'id':str(i+1),'x':r[0],'y':r[1],'radiusX':r[2],'radiusY':r[3]} for i,r in enumerate(rooms)]}
(OUT/'navigation.json').write_text(json.dumps(nav,separators=(',',':')))
# Binary PNG: white play area, black forest; PNG top = north. Blender image API.
img=bpy.data.images.new('walkability',width=NX,height=NY,alpha=True)
img.pixels=[v for value in mask for v in (value,value,value,1)]
img.filepath_raw=str(OUT/'walkability.png');img.file_format='PNG';img.save()

# Shared placements for both moods; no collidable art intrudes onto walkable ground.
trees=[];shrubs=[];rocks=[];flowers=[]
# Landmarks interrupt the forest wall without changing the playable corridor.
outcrops=[];logs=[]
for y,side,scale in ((39,-1,2.5),(73,1,2.0),(119,1,2.7),(151,-1,2.2),(204,-1,2.6),(244,1,2.3),(278,-1,2.1)):
    edge=edges(y)[0 if side<0 else 1]
    ox=edge+side*5.5
    while any(at(ox+dx*.5,y+dy*.5) for dx in range(-int(4*scale),int(4*scale)+1) for dy in range(-int(4*scale),int(4*scale)+1)):ox+=side*.5
    outcrops.append((ox,y,scale))
for y,side in ((63,-1),(137,1),(228,-1)):
    edge=edges(y)[0 if side<0 else 1];ox=edge+side*3
    while any(at(ox+dx*.5,y+dy*.5) for dx in range(-2,3) for dy in range(-5,6)):ox+=side*.5
    logs.append((ox,y,1))
for y in range(2,299,3):
    for x in range(2,149,3):
        px=x+rng.uniform(-1.25,1.25);py=y+rng.uniform(-1.25,1.25)
        if any(math.hypot(px-ox,py-oy)<4.5 for ox,oy,_ in outcrops):continue
        if any(at(px+dx,py+dy) for dx,dy in ((0,0),(1.3,0),(-1.3,0),(0,1.3),(0,-1.3))):continue
        if rng.random()<.16:continue
        trees.append((px,py,rng.uniform(.72,1.32),rng.randrange(3)))
for _ in range(14000):
    x,y=rng.uniform(1,149),rng.uniform(1,299)
    if not any(at(x+dx,y+dy) for dx,dy in ((0,0),(1.5,0),(-1.5,0),(0,1.5),(0,-1.5),(1.1,1.1),(-1.1,1.1),(1.1,-1.1),(-1.1,-1.1))):
        if rng.random()<.12: rocks.append((x,y,rng.uniform(.5,1.1)))
        elif rng.random()<.48: shrubs.append((x,y,rng.uniform(.7,1.2)))
    elif .7<clearance(x,y)<3.2 and rng.random()<.4 and not reserved(x,y):flowers.append((x,y,rng.uniform(.7,1.1)))
# Low botanical patches around meadow edges. They are decorative, below ankle height.
for _ in range(5500):
    cx,cy=rng.uniform(5,145),rng.uniform(5,295)
    if not (.8<clearance(cx,cy)<6):continue
    for _ in range(rng.randrange(3,8)):
        x,y=cx+rng.uniform(-1.4,1.4),cy+rng.uniform(-1.4,1.4)
        if clearance(x,y)>.6 and not reserved(x,y):flowers.append((x,y,rng.uniform(.8,1.5)))
ferns=[]; mushrooms=[]; stumps=[]
for _ in range(4200):
    x,y=rng.uniform(4,146),rng.uniform(10,290)
    if reserved(x,y,2):continue
    c=clearance(x,y)
    if .8<c<7 and rng.random()<.48:ferns.append((x,y,rng.uniform(.8,1.5)))
    if .7<c<5 and rng.random()<.10:mushrooms.append((x,y,rng.uniform(.8,1.5)))
    if not at(x,y) and rng.random()<.012:stumps.append((x,y,rng.uniform(.8,1.5)))
# Six shared low-poly species, with patch-biased mixes and three age classes.
tree_rng=random.Random(927404)
species_names=['oak','birch','fir','spreading','lime','copper']
tree_records=[]
for x,y,oldscale,oldvariant in trees:
    patch=int(y//48)+int(x//35)
    weights=[4,3,2,2,3,.7]
    weights[patch%5]+=5
    species=tree_rng.choices(range(6),weights=weights)[0]
    age=tree_rng.choices(['young','mature','canopy'],[.27,.56,.17])[0]
    scale=tree_rng.uniform(*{'young':(.42,.70),'mature':(.85,1.18),'canopy':(1.40,1.75)}[age])
    # A conservative square covers every rotated crown and protects playable space.
    def crown_safe(sc):
        r=2.8*sc
        return x-r>=0 and x+r<=WIDTH and y-r>=0 and y+r<=LENGTH and not any(at(x+dx*r/4,y+dy*r/4) for dx in range(-4,5) for dy in range(-4,5))
    while scale>.35 and not crown_safe(scale):scale-=.05
    if not crown_safe(scale):continue
    tree_records.append((x,y,scale,species,age))
trees=[(x,y,sc,sp) for x,y,sc,sp,age in tree_records]
(OUT/'tree_distribution.json').write_text(json.dumps({'species':species_names,'counts':{n:sum(t[3]==i for t in trees) for i,n in enumerate(species_names)},'ageCounts':{a:sum(t[4]==a for t in tree_records) for a in ('young','mature','canopy')},'scaleRange':[min(t[2] for t in trees),max(t[2] for t in trees)],'placements':[{'x':x,'y':y,'scale':sc,'species':species_names[sp],'age':age} for x,y,sc,sp,age in tree_records]},indent=2))
stats={}
for state in ('purified','polluted'):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    green=state=='purified'; lin=ns['lin']; mat=ns['flat_material']('forest_vertex')
    def mesh(name,cubes):
        ob=ns['cubes_mesh'](name,cubes,mat);bpy.context.scene.collection.objects.link(ob);return ob
    def box(x,y,z,sx,sy,sz,color):return ((x,y,z),(sx,sy,sz),lin(color))
    # 1.5m flat ground quads. Fine block pattern is a shader, not 250,000 cubes.
    verts=[];faces=[];cols=[]
    for y in range(200):
        for x in range(100):
            px,py=x*1.5,y*1.5; k=len(verts)
            verts.extend([(px,py,0),(px+1.5,py,0),(px+1.5,py+1.5,0),(px,py+1.5,0)]);faces.append((k,k+1,k+2,k+3))
            edgeL,edgeR=edges(py+.75)
            inforest=min(abs(px+.75-edgeL),abs(px+.75-edgeR)) if not at(px+.75,py+.75) else 0
            blend=min(1,inforest/7)
            c0=lin('#A7BF61' if green else '#493B55');c1=lin('#385A32' if green else '#302938')
            c=tuple(c0[i]*(1-blend)+c1[i]*blend for i in range(3))
            factor=1+.075*math.sin(px*.21)*math.cos(py*.16)+.025*math.sin(px*.83+py*.57);cols.append(tuple(v*factor for v in c))
    ground=ns['mesh_from']('terrain_forest150',verts,faces,cols,ns['block_material']('ground',.5));bpy.context.scene.collection.objects.link(ground)
    prototypes=[]
    palettes=[('#436B32','#698F3C','#92AC50'),('#627B39','#8CA64F','#B7C879'),('#254F45','#386C56','#59896B'),('#4B6938','#718C46','#95A65B'),('#6D8739','#A5B951','#C6CC79'),('#76623A','#A58A46','#C2AA62')]
    # Block silhouettes differ in branching, width, height, crown tiers and trunk colour.
    shapes=[[(0,0,3.1,2.8,2.7,1.1),(-.85,.15,4,2.1,2.2,1.1),(.9,-.15,3.9,2.2,2.1,1.1),(0,.2,4.8,2.2,2.1,.9),(0,0,5.45,1.3,1.4,.5)],
            [(0,0,3.2,1.9,1.8,1),(.35,0,4.1,1.7,1.6,1),(-.2,.2,5,1.4,1.5,.9),(0,0,5.7,.9,1,.6)],
            [(0,0,2.5,3.2,3.2,.65),(0,0,3.25,2.65,2.65,.7),(0,0,4,2.1,2.1,.7),(0,0,4.75,1.6,1.6,.7),(0,0,5.5,1.05,1.05,.7),(0,0,6.15,.5,.5,.6)],
            [(-1,0,2.9,2.1,2.3,.9),(1,.2,3.1,2.2,2.1,.9),(0,-.5,3.7,3,2.5,.9),(-.4,.5,4.45,2.6,2.3,.7)],
            [(0,0,2.8,2.6,2.6,1),(-.5,.1,3.65,2.2,2.3,.9),(.5,0,4.4,2,2,.8),(0,0,5.05,1.4,1.3,.6)],
            [(-.7,0,3.1,2.1,2.1,.9),(.65,.25,3.7,2,2,.9),(-.25,0,4.5,1.9,2,.8),(0,0,5.1,1.2,1.2,.5)]]
    for variant in range(6):
        trunk='#CDC9AA' if variant==1 else '#786044'
        cubes=[box(0,0,1.6,.48 if variant==1 else .65,.48 if variant==1 else .65,3.2,trunk if green else '#403646')]
        for i,(x,y,z,w,d,h) in enumerate(shapes[variant]):
            col=palettes[variant][i%3] if green else ['#343141','#494050','#5B4C60'][i%3]
            # Offset blocks keep a voxel silhouette without hundreds of hidden leaf cubes.
            cubes.append(box(x,y,z,w,d,h,col))
            cubes.append(box(x+w*.32,y-d*.18,z+h*.36,w*.48,d*.65,h*.5,palettes[variant][(i+1)%3] if green else '#4C3C55'))
        if variant==1:
            for z in (.6,1.4,2.2):cubes.append(box(.245,0,z,.02,.48,.14,'#766D55' if green else '#292535'))
        if variant==3:
            cubes.extend([box(-.6,0,2,.9,.45,.45,trunk if green else '#45384C'),box(.6,.1,2.4,.9,.45,.45,trunk if green else '#45384C')])
        if not green:
            cubes=[box(0,0,1.8,.6,.6,3.6,'#403646')]
            for side in (-1,1):
                for j in range(3+variant%3):
                    cubes.append(box(side*(.3+j*.26),.18*(variant%2),2.1+j*.45,.38,.4,.6,'#534259'))
            for dx,dy in ((-.65,-.65),(.65,.65),(0,0)):
                cubes.append(box(dx,dy,.55,1,1,1.1,'#352F40'))
        prototypes.append(mesh('tree'+str(variant),cubes))
    shrub=mesh('shrub',[box(dx,dy,.3+abs(dx)*.2,.65,.65,.6,'#6D9136' if green else '#49394E') for dx,dy in ((0,0),(.45,0),(-.45,0),(0,.45),(0,-.45))])
    rock=mesh('rock',[box(0,0,.65,1.3,1.2,1.3,'#929782' if green else '#5B4B68'),box(.65,.3,.35,.8,.8,.7,'#BBC1AB' if green else '#4A3C55')])
    flower_protos=[]
    for v,col in enumerate(('#EFE9C2','#DCA2AE','#D4C451')):
        cells=[box(0,0,.10,.35,.28,.2,'#738E3B' if green else '#45374C')]
        for dx,dy in ((-.13,0),(.13,0),(0,-.13),(0,.13)):
            cells.append(box(dx,dy,.25,.14,.14,.1,col if green else '#80658C'))
        cells.append(box(0,0,.28,.12,.12,.12,'#D8BA54' if green else '#9B71AA'))
        flower_protos.append(mesh('flower'+str(v),cells))
    fern=mesh('tuft_fern',[box(dx,dy,.08,.32,.18,.16,'#819F3E' if green else '#51405D') for dx,dy in ((0,0),(.25,.1),(-.25,.1),(.40,.23),(-.4,.23),(0,.3))])
    mushroom=mesh('flower_mushroom',[box(0,0,.16,.13,.13,.32,'#D4C3A2' if green else '#77697C'),box(0,0,.34,.42,.38,.16,'#B77C65' if green else '#705181'),box(.12,.08,.43,.1,.1,.05,'#E7DCC7')])
    stump=mesh('rock_stump',[box(0,0,.5,.85,.9,1,'#755735' if green else '#4C3B50'),box(0,0,1.01,.7,.74,.05,'#C7A86E' if green else '#77617E')])
    outcrop=mesh('rock_outcrop',[box(dx,dy,h/2,w,w,h,'#A6AB94' if green else '#5C4B67') for dx,dy,w,h in ((0,0,1.4,2.4),(-1,.2,1.1,1.65),(.8,.6,1,1.9),(.6,-.8,.9,1.2),(-.9,-.8,.8,.9))])
    log=mesh('rock_log',[box(0,0,.45,.85,4.5,.9,'#8F7250' if green else '#594759'),box(0,-2.28,.45,.72,.15,.72,'#C6AE7C' if green else '#766079')])
    def place(proto,x,y,s,yaw=0):
        ob=bpy.data.objects.new(proto.name,proto.data);bpy.context.scene.collection.objects.link(ob)
        ob.location=(x,y,0);ob.scale=(s,s,s);ob.rotation_euler.z=yaw
    for x,y,s,v in trees:place(prototypes[v],x,y,s,int(x+y)%4*math.pi/2)
    for proto,points in ((shrub,shrubs),(rock,rocks),(fern,ferns),(mushroom,mushrooms),(stump,stumps)):
        for x,y,s in points:place(proto,x,y,s)
    for i,(x,y,scale) in enumerate(flowers):place(flower_protos[i%3],x,y,scale)
    for proto,points in ((outcrop,outcrops),(log,logs)):
        for x,y,s in points:place(proto,x,y,s)
    for p in prototypes+flower_protos+[shrub,rock,fern,mushroom,stump,outcrop,log]:bpy.data.objects.remove(p,do_unlink=True)
    for q in slots:
        cells=[];r=q['reserveWidth']/2
        for dx,dy in ((-r,-r),(-r,r),(r,-r),(r,r)):
            cells.append(box(q['x']+dx,q['y']+dy,.09,.65,.65,.18,'#C7B788' if green else '#85708F'))
        mesh('build_pad_'+q['id'],cells)
    scene=bpy.context.scene;scene.world=bpy.data.worlds.new('World');scene.world.use_nodes=True
    scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.50,.60,.72,1) if green else (.18,.14,.23,1)
    scene.world.node_tree.nodes['Background'].inputs[1].default_value=.35
    light=bpy.data.lights.new('Sun','SUN');light.energy=2.3 if green else 1.1;light.color=(1,.93,.77) if green else (.76,.69,1);light.angle=.13;ob=bpy.data.objects.new('Sun',light);scene.collection.objects.link(ob);ob.rotation_euler=Vector((40,35,-90)).to_track_quat('-Z','Y').to_euler()
    camdata=bpy.data.cameras.new('Overview');cam=bpy.data.objects.new('Overview',camdata);scene.collection.objects.link(cam)
    cam.location=(75,35,370);target=Vector((75,150,0));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();camdata.type='ORTHO';camdata.ortho_scale=325;scene.camera=cam
    scene.render.engine='CYCLES';scene.cycles.samples=16;scene.cycles.use_denoising=True;scene.render.resolution_x=900;scene.render.resolution_y=1650;scene.render.resolution_percentage=100
    scene.view_settings.view_transform='Standard';scene.view_settings.look='None'
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/f'forest_{state}.blend'))
    stats[state]=export_glb(OUT/f'forest_{state}.glb')
    if 'render' in sys.argv:
        scene.render.filepath=str(OUT/f'overview_{state}.png');bpy.ops.render.render(write_still=True)
        if green:
            cam.location=(75,20,36);target=Vector((69,59,0));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();camdata.type='PERSP';camdata.lens=36
            scene.render.resolution_x=1200;scene.render.resolution_y=900
            scene.render.filepath=str(OUT/'play_purified.png');bpy.ops.render.render(write_still=True)
            for label,pos,aim,lens in [('west_edge',(31,88,23),(50,115,3),40),('east_edge',(116,180,27),(98,211,3),40),('north_reverse',(82,279,38),(73,239,1),38)]:
                cam.location=pos;cam.rotation_euler=(Vector(aim)-cam.location).to_track_quat('-Z','Y').to_euler();camdata.lens=lens
                scene.render.filepath=str(OUT/(label+'_purified.png'));bpy.ops.render.render(write_still=True)

stats.update(trees=len(trees),shrubs=len(shrubs),rocks=len(rocks),flowers=len(flowers),ferns=len(ferns),mushrooms=len(mushrooms),stumps=len(stumps),constructionSlots=len(slots),walkableAreaM2=sum(mask)*CELL*CELL)
(OUT/'stats.json').write_text(json.dumps(stats,indent=2))
print('FOREST COMPLETE',stats)

# Blender-authored prototype buildings. Unit facility intentionally remains an open scaffold.
for kind in ('tower','unit'):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    mat=ns['flat_material']('building_vertex');lin=ns['lin']
    if kind=='tower':
        cubes=[box(0,0,.25,5.6,5.6,.5,'#A69C78'),box(0,0,1.35,3.4,3.4,2.2,'#7D6742'),box(0,0,2.55,4.2,4.2,.35,'#B49D68'),box(0,0,3.15,1.5,1.6,.9,'#4F6254'),box(0,1.6,3.35,.65,2.4,.6,'#374A42')]
        for x in (-1.7,1.7):
            for y in (-1.7,1.7):cubes.append(box(x,y,2.9,.4,.4,1,'#655235'))
    else:
        cubes=[box(0,0,.2,7.6,7.6,.4,'#A69C78'),box(0,0,.55,6.6,6.6,.3,'#C7B995')]
        for x in (-2.8,2.8):
            for y in (-2.8,2.8):cubes.append(box(x,y,1.65,.45,.45,2.3,'#967C51'))
        for y in (-2.8,2.8):cubes.append(box(0,y,2.75,6,.4,.4,'#B09B6A'))
        cubes.append(box(1.1,0,.9,1.4,1.6,.8,'#6D8E68'))
    mesh(kind+'_prototype',cubes)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/f'{kind}_prototype.blend'))
    export_glb(OUT/f'{kind}_prototype.glb')
