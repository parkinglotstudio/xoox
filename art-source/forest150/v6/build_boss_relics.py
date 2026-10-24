import bpy,sys,json,math,struct
from pathlib import Path
from collections import defaultdict
from mathutils import Matrix,Vector
ROOT=Path('C:/xoox');OUT=Path(__file__).parent/'release';OUT.mkdir(exist_ok=True)
ns={'__file__':str(ROOT/'scripts/block-map-r4/map_common.py'),'__name__':'helpers'}
exec((ROOT/'scripts/block-map-r4/map_common.py').read_text(encoding='utf-8-sig').rsplit('\nmain()',1)[0],ns)
source=(ROOT/'scripts/block-map-r4/build_release.py').read_text(encoding='utf-8-sig')
exec(source[source.index('def export_glb'):source.index('\nstats={}')].replace("kind.startswith(('tuft','flower'))","kind.startswith(('tuft','flower','tree','shrub','rock'))").replace('loc.x//20','loc.x//30').replace('loc.z//20','loc.z//30'),globals())
nav=json.loads((ROOT/'data/maps/forest150/releases/v3/navigation.json').read_text())
construction=json.loads((ROOT/'data/maps/forest150/releases/v3/construction.json').read_text())
def safe(x,y,w):
    rx=3*w+.25;ry=2.5*w+.25
    if x-rx<0 or x+rx>150 or y-ry<0 or y+ry>300:return False
    for gy in range(math.floor((y-ry)*2),math.ceil((y+ry)*2)):
        for gx in range(math.floor((x-rx)*2),math.ceil((x+rx)*2)):
            if nav['walkable'][gy*300+gx]:return False
    for q in construction['slots']:
        if abs(x-q['x'])<rx+q['reserveWidth']/2 and abs(y-q['y'])<ry+q['reserveDepth']/2:return False
    return True
placements=[]
for y,side,w,h in [(53,-1,1.15,1.35),(100,1,1.3,1.5),(151,-1,1.4,1.8),(193,1,1.5,2.0),(218,-1,1.6,2.1),(233,1,1.7,2.3),(248,-1,1.8,2.5),(263,1,1.9,2.7),(277,-1,2,2.9),(279,1,2,3.1)]:
    xs=[i*.5 for i,v in enumerate(nav['walkable'][y*2*300:(y*2+1)*300]) if v]
    x=min(xs)-3*w-1 if side<0 else max(xs)+3*w+1
    for attempt in range(90):
        if safe(x,y,w):break
        x+=side*.5
    assert safe(x,y,w),(x,y,w)
    placements.append({'x':x,'y':y,'widthScale':w,'heightScale':h,'kind':'relay'})
for x,w,h in [(28,1.8,2.8),(53,1.8,3.1),(78,1.8,4.3),(103,1.8,3.2),(128,1.8,2.8)]:
    assert safe(x,294,w)
    placements.append({'x':x,'y':294,'widthScale':w,'heightScale':h,'kind':'boss_spire' if x==78 else 'sentinel'})
for i,a in enumerate(placements):
    for b in placements[i+1:]:
        assert abs(a['x']-b['x'])>=3*(a['widthScale']+b['widthScale']) or abs(a['y']-b['y'])>=2.5*(a['widthScale']+b['widthScale']),('overlap',a,b)
stats={}
for state in ['purified','polluted']:
    bpy.ops.wm.open_mainfile(filepath=str(ROOT/f'art-source/forest150/v5/forest_{state}.blend'))
    green=state=='purified';mat=ns['flat_material']('boss_relic_vertex');lin=ns['lin']
    for ob in list(bpy.context.scene.objects):
        if ob.type!='MESH':continue
        if ob.name.startswith('rock_relay_') or (ob.name.startswith(('tree','shrub')) and any(abs(ob.location.x-q['x'])<3*q['widthScale']+2 and abs(ob.location.y-q['y'])<2.5*q['widthScale']+2 for q in placements)):
            bpy.data.objects.remove(ob,do_unlink=True)
    for i,q in enumerate(placements):
        x,y,w,h=q['x'],q['y'],q['widthScale'],q['heightScale'];cells=[]
        def box(dx,dy,z,sx,sy,sz,col):cells.append(((x+dx*w,y+dy*w,z*h),(sx*w,sy*w,sz*h),lin(col)))
        stone='#39565C' if green else '#353341';trim='#88947C' if green else '#60546A';glow='#67C8BB' if green else '#9A62B7';pink='#C98BAA' if green else '#815799';moss='#778C48' if green else '#493D53'
        box(0,0,.25,6,5,.5,trim);box(0,0,.7,4.4,3.7,.4,stone)
        for j in range(5):
            wide=2.7-j*.37;deep=2.5-j*.33
            box(0,0,1.6+j*1.15,wide,deep,1.15,stone)
            box(-.3,-deep/2-.04,1.6+j*1.15,.14,.1,.76,glow)
            box(.3,-deep/2-.04,1.6+j*1.15,.1,.1,.55,pink)
            box(0,0,2.12+j*1.15,wide+.2,deep+.2,.09,trim)
        box(0,0,7.6,.28,.28,2.2,trim)
        for sign in (-1,1):
            box(sign*1.9,.25,1.5,.65,1.0,2.2,stone)
            box(sign*1.9,.25,2.9,.3,.35,.7,glow)
        for dx,dy,z in [(-1.7,-1,.6),(1.6,1,.6),(.7,.3,3.4),(-.5,.5,5.7)]:box(dx,dy,z,.75,.7,.2,moss)
        if q['kind']=='boss_spire':
            for sign in (-1,1):
                box(sign*1.7,.45,3.2,.6,.7,4.2,stone);box(sign*1.7,.45,5.75,.2,.25,1.1,pink)
            box(0,-1.32,2.9,.8,.14,.75,pink);box(0,-1.42,2.9,.32,.07,.4,glow)
        ob=ns['cubes_mesh']('rock_boss_relic_'+str(i),cells,mat);bpy.context.scene.collection.objects.link(ob)
    scene=bpy.context.scene
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/f'forest_{state}.blend'))
    stats[state]=export_glb(OUT/f'forest_{state}.glb')
    scene.render.resolution_x=1400;scene.render.resolution_y=900;scene.cycles.samples=12
    cam=scene.camera;cam.data.type='PERSP';cam.data.lens=32
    for label,pos,target in [('boss_approach',(78,225,14),(78,287,14)),('boss_overview',(141,223,65),(76,273,8))]:
        cam.location=pos;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
        scene.render.filepath=str(OUT/f'{label}_{state}.png');bpy.ops.render.render(write_still=True)
result={'revision':'forest150x300-v6','placements':placements,'count':len(placements),'northCount':sum(q['y']>=218 for q in placements),'allOutsideWalkableAndConstruction':True,'noFacilityOverlap':True,'heightRange':[min(q['heightScale']*8.7 for q in placements),max(q['heightScale']*8.7 for q in placements)],'stats':stats}
(OUT/'boss_relics.json').write_text(json.dumps(result,indent=2));print('COMPLETE',result)
