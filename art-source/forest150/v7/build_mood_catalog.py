import bpy,sys,json,math,struct
from pathlib import Path
from collections import defaultdict
from mathutils import Matrix,Vector
ROOT=Path('C:/xoox');OUT=Path(__file__).parent/'release';(OUT/'catalog').mkdir(parents=True,exist_ok=True)
ns={'__file__':str(ROOT/'scripts/block-map-r4/map_common.py'),'__name__':'helpers'}
exec((ROOT/'scripts/block-map-r4/map_common.py').read_text(encoding='utf-8-sig').rsplit('\nmain()',1)[0],ns)
source=(ROOT/'scripts/block-map-r4/build_release.py').read_text(encoding='utf-8-sig')
exec(source[source.index('def export_glb'):source.index('\nstats={}')].replace("kind.startswith(('tuft','flower'))","kind.startswith(('tuft','flower','tree','shrub','rock'))").replace('loc.x//20','loc.x//30').replace('loc.z//20','loc.z//30'),globals())
lin=ns['lin'];catalog={};stats={};geometryChecks={}
layout=json.loads((ROOT/'data/maps/forest150/releases/v3/construction.json').read_text())
tree_names=['넓은 활엽수','흰 줄기 수목','청록 침엽수','퍼지는 수목','밝은 연두 수목','황갈색 수목']
def category(name):
    if name.startswith('tree'):return '수목'
    if 'relic' in name or 'relay' in name:return '유물 시설'
    if name in ('tower','unit'):return '건설 건물'
    if name.startswith('rock') and not any(q in name for q in ('log','stump')):return '바위'
    return '식생·소품'
names={'shrub':'관목','rock':'작은 바위','flower0':'흰 꽃','flower1':'분홍 꽃','flower2':'노랑 꽃','tuft_fern':'양치식물','flower_mushroom':'버섯','rock_stump':'그루터기','rock_outcrop':'큰 바위군','rock_log':'쓰러진 나무','tower':'유물 방어 포탑','unit':'유물 유닛 시설'}
def name_for(n):
    if n.startswith('tree') and n[4:].isdigit():return tree_names[int(n[4:])]
    if n.startswith('rock_boss_relic_'):return '보스존 유물 시설 '+str(int(n.rsplit('_',1)[1])+1)
    return names.get(n,n)
def retint(scene,green):
    seen=set()
    for ob in scene.objects:
        if ob.type!='MESH' or ob.data in seen:continue
        seen.add(ob.data);attr=ob.data.color_attributes.get('Col')
        if not attr:continue
        for d in attr.data:
            r,g,b,a=d.color
            if green:
                if ob.name.startswith('rock_boss'):r,g,b=r*.98,g*1.14,b*1.24
                else:r,g,b=r*.99,g*1.05,b*1.15
            else:
                lum=.2126*r+.7152*g+.0722*b
                r,g,b=lum*.68+.014,lum*.65+.012,lum*1.18+.033
            d.color=(min(r,1),min(g,1),min(b,1),a)
def lighting(scene,green):
    bg=scene.world.node_tree.nodes.get('Background');bg.inputs[0].default_value=(.55,.63,.68,1) if green else (.22,.20,.34,1);bg.inputs[1].default_value=.42 if green else .48
    light=next(o.data for o in scene.objects if o.type=='LIGHT' and o.data.type=='SUN');light.energy=2.5 if green else .85;light.color=(1,.86,.74) if green else (.59,.64,1)
    scene.render.engine='CYCLES';scene.cycles.samples=12;scene.cycles.use_denoising=True;scene.render.resolution_x=1200;scene.render.resolution_y=800;scene.render.resolution_percentage=100;scene.view_settings.view_transform='Standard'
def new_building(kind,green,mat):
    cells=[]
    def box(x,y,z,w,d,h,c):cells.append(((x,y,z),(w,d,h),lin(c)))
    stone='#486E70' if green else '#4B475D';trim='#C3B49A' if green else '#797187';teal='#74D9C7' if green else '#987AD0';pink='#DE9FBD' if green else '#704C98';moss='#819855' if green else '#514760'
    if kind=='tower':
        box(0,0,.22,5.6,5.6,.44,trim);box(0,0,.6,4.5,4.5,.32,stone);box(0,0,1.65,2.5,2.5,1.8,stone)
        for x in (-1.8,1.8):
            for y in (-1.8,1.8):box(x,y,1,.7,.7,1.4,stone);box(x,y,1.75,.72,.72,.15,moss)
        box(0,0,2.55,3.7,3.7,.4,trim);box(0,0,3.05,2.4,2.3,.8,stone)
        box(0,1.35,3.35,.72,2.55,.6,teal);box(0,2.53,3.35,1,.28,.95,stone);box(0,2.69,3.35,.48,.08,.4,pink)
        box(-.8,-.4,3.75,.28,.65,.8,pink);box(.8,-.4,3.75,.28,.65,.8,teal)
        for x in (-1.27,1.27):box(x,0,1.65,.08,1.1,.8,teal)
    else:
        box(0,0,.2,7.6,7.6,.4,trim);box(0,0,.6,6.5,6.5,.4,stone)
        for x in (-2.5,2.5):
            for y in (-2.5,2.5):box(x,y,1.8,.85,.85,2.4,stone);box(x,y,3.05,1.15,1.15,.3,trim);box(x,y,3.5,.3,.3,.6,teal)
        box(0,2.5,2.65,5.8,.75,.6,stone);box(-2.5,0,2.65,.75,5.8,.6,stone);box(2.5,0,2.65,.75,5.8,.6,stone)
        box(0,0,1.05,3.1,3.1,.5,trim);box(0,0,1.8,1.7,1.7,1,teal);box(0,0,2.4,.8,.8,.4,pink)
        for x in (-1,1):box(x,-2.9,.5,.8,1.2,.2,moss)
    ob=ns['cubes_mesh'](kind,cells,mat);bpy.context.scene.collection.objects.link(ob);return ob
def register(ob,key,label,group,state,asset_scene,source_revision='v7'):
    previous=bpy.context.window.scene;bpy.context.window.scene=asset_scene
    dup=ob.copy();dup.data=ob.data.copy();dup.name=key;asset_scene.collection.objects.link(dup);dup.matrix_world=Matrix.Identity(4)
    pts=[v.co for v in dup.data.vertices];lo=Vector(tuple(min(v[i] for v in pts) for i in range(3)));hi=Vector(tuple(max(v[i] for v in pts) for i in range(3)))
    pivot=Vector(((lo.x+hi.x)/2,(lo.y+hi.y)/2,lo.z));dup.data.transform(Matrix.Translation(-pivot))
    file=f'{key}_{state}.glb';info=export_glb(OUT/'catalog'/file)
    entry=catalog.setdefault(key,{'id':key,'name':label,'category':group,'sourceRevision':source_revision,'pivot':'bottom-center','units':'metres','variants':{},'boundsMeters':{}})
    entry['variants'][state]='/maps/forest150/releases/v7/catalog/'+file;entry['boundsMeters'][state]=list(hi-lo)
    bpy.data.objects.remove(dup,do_unlink=True);bpy.context.window.scene=previous
for state in ['purified','polluted']:
    bpy.ops.wm.open_mainfile(filepath=str(ROOT/f'art-source/forest150/v6/forest_{state}.blend'))
    scene=bpy.context.scene;green=state=='purified'
    before={o.name:(len(o.data.vertices),tuple(o.matrix_world)) for o in scene.objects if o.type=='MESH'}
    retint(scene,green);lighting(scene,green)
    after={o.name:(len(o.data.vertices),tuple(o.matrix_world)) for o in scene.objects if o.type=='MESH'}
    assert before==after;geometryChecks[state]=True
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/f'forest_{state}.blend'));stats[state]=export_glb(OUT/f'forest_{state}.glb')
    assets=bpy.data.scenes.new('AssetCatalog');seen=set()
    for ob in list(scene.objects):
        if ob.type!='MESH' or ob.name.startswith(('terrain','build_pad')) or ob.data in seen:continue
        seen.add(ob.data);key=ob.name.split('.')[0];register(ob,key,name_for(key),category(key),state,assets)
    mat=ns['flat_material']('construction_vertex');models={}
    for kind in ('tower','unit'):
        ob=new_building(kind,green,mat);register(ob,kind,name_for(kind),'건설 건물',state,assets);models[kind]=ob
        ob['map_preview_only']=True
        q=next(s for s in layout['slots'] if s['site']==1 and s['kind']==kind);ob.location=(q['x'],q['y'],0)
    cam=scene.camera;cam.data.type='PERSP';cam.data.lens=32
    for label,pos,target in [('boss',(78,225,14),(78,287,14)),('entry',(75,16,25),(66,58,1)),('tower_close',(67,41,8),(56.5,53,2))]:
        cam.location=pos;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(OUT/f'{label}_{state}.png');bpy.ops.render.render(write_still=True)
    # Original newly authored building meshes remain available in the source file, preview-only.
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/f'construction_study_{state}.blend'))
    # Register retired relay and tree versions for placement authors, without placing them.
    for rev,prefixes in [('v5',('rock_relay_',)),('v3',('tree',))]:
        with bpy.data.libraries.load(str(ROOT/f'art-source/forest150/{rev}/forest_{state}.blend'),link=False) as (src,dst):dst.objects=[n for n in src.objects if n.startswith(prefixes)]
        done=set()
        for ob in dst.objects:
            key=ob.name.split('.')[0]
            if ob.data in done:continue
            done.add(ob.data);register(ob,f'legacy_{rev}_{key}',f'이전 {rev} '+name_for(key),'이전 버전',state,assets,rev)
    for kind in ('tower','unit'):
        with bpy.data.libraries.load(str(ROOT/f'art-source/forest150/v3/{kind}_prototype.blend'),link=False) as (src,dst):dst.objects=[n for n in src.objects if n.startswith(kind)]
        for ob in dst.objects:
            if ob.type=='MESH':register(ob,f'legacy_v3_{kind}',f'이전 v3 {kind} 임시 모델','이전 버전',state,assets,'v3')
(OUT/'catalog.json').write_text(json.dumps({'schemaVersion':1,'revision':'forest150x300-v7','placementEnabled':False,'items':list(catalog.values())},ensure_ascii=False,indent=2),encoding='utf-8')
(OUT/'validation.json').write_text(json.dumps({'geometryAndPlacementUnchanged':geometryChecks,'catalogItems':len(catalog),'stats':stats},indent=2))
print('COMPLETE',len(catalog),stats)
