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
def walk(x,y):return 0<=x<150 and 0<=y<300 and nav['walkable'][int(y*2)*300+int(x*2)]
placements=[]
for y,side in [(53,-1),(100,1),(151,-1),(201,1),(259,-1)]:
    row=nav['walkable'][y*2*300:(y*2+1)*300]; xs=[i*.5 for i,v in enumerate(row) if v]
    x=min(xs)-5.5 if side<0 else max(xs)+5.5
    while any(walk(x+dx*.5,y+dy*.5) for dx in range(-8,9) for dy in range(-8,9)):x+=side*.5
    assert 5<x<145
    placements.append((x,y))
stats={}
for state in ['purified','polluted']:
    bpy.ops.wm.open_mainfile(filepath=str(ROOT/f'art-source/forest150/v4/forest_{state}.blend'))
    green=state=='purified';mat=ns['flat_material']('relic_vertex');lin=ns['lin']
    # Clear only tree trunks at the new fixed, non-walkable footprints.
    for ob in list(bpy.context.scene.objects):
        if ob.type=='MESH' and ob.name.startswith('tree') and any(math.hypot(ob.location.x-x,ob.location.y-y)<4.5 for x,y in placements):bpy.data.objects.remove(ob,do_unlink=True)
    for i,(x,y) in enumerate(placements):
        cells=[]
        def box(dx,dy,z,w,d,h,col):cells.append(((x+dx,y+dy,z),(w,d,h),lin(col)))
        stone='#435F61' if green else '#383747';trim='#8C9575' if green else '#5C5364';glow='#63C9B5' if green else '#A559AD';moss='#798D44' if green else '#493D53'
        box(0,0,.35,5,4,.7,trim);box(0,0,1,4,3.2,.65,stone)
        # Narrow stepped former relay tower, with an asymmetrical broken side pier.
        for j in range(5):
            box(0,0,1.6+j*1.15,2.7-j*.37,2.5-j*.33,1.15,stone)
            box(-.1,-(2.5-j*.33)/2-.035,1.6+j*1.15,.18,.09,.7,glow)
        box(0,0,7.6,.3,.3,2.2,trim)
        box(1.9,.3,1.7,.7,.9,2,stone);box(-1.8,.5,.9,.7,1.1,.8,stone)
        for dx,dy,z in [(-1.7,-1,.8),(1.6,1,.8),(.7,.3,3.4),(-.5,.5,5.7)]:box(dx,dy,z,.8,.65,.23,moss)
        box(0,-1.6,1.8,.8,.12,.35,'#C39C77' if green else '#775A81')
        ob=ns['cubes_mesh']('rock_relay_'+str(i),cells,mat);bpy.context.scene.collection.objects.link(ob)
    scene=bpy.context.scene
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/f'forest_{state}.blend'))
    stats[state]=export_glb(OUT/f'forest_{state}.glb')
    scene.render.resolution_x=1200;scene.render.resolution_y=800;scene.cycles.samples=16
    cam=scene.camera;cam.data.type='PERSP';cam.data.lens=34
    for label,i in [('south_relay',0),('middle_relay',3)]:
        x,y=placements[i];side=-1 if i%2==0 else 1
        cam.location=(x-side*16,y-17,10);cam.rotation_euler=(Vector((x,y,3))-cam.location).to_track_quat('-Z','Y').to_euler()
        scene.render.filepath=str(OUT/f'{label}_{state}.png');bpy.ops.render.render(write_still=True)
(OUT/'relics.json').write_text(json.dumps({'placements':placements,'allOutsideWalkable':True,'stats':stats},indent=2))
print('COMPLETE',stats)
