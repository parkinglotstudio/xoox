"""Reproducible Blender map release: low block groundcover, stepped props, two moods."""
import bpy, sys, os, math, random, json, struct, importlib.util
from pathlib import Path
from collections import defaultdict
from mathutils import Matrix, Vector

HERE = Path(__file__).parent
args = sys.argv[sys.argv.index('--')+1:]
OUT = Path(args[0]); OUT.mkdir(parents=True, exist_ok=True)
source = (HERE/'map_common.py').read_text(encoding='utf-8-sig')
source = source.rsplit('\nmain()',1)[0]
(HERE/'map_common.py').write_text(source,encoding='utf-8')

def configure(m, sector):
    m.PAL.update(mint='#ADDACB', mint_lo='#91C7B3', mint_hi='#C0E5D5',
                 mint_side='#90BFAB', leaf1='#80C8A4', leaf2='#62AD8A',
                 leaf3='#A0D9B4', leaf4='#559574', path='#E0CFAC', path_edge='#E8DABC', path_worn='#D6C19B')
    m.mint_at=lambda y:m.lin(m.PAL['mint'])
    def tree(scale=1, variant=0):
        cells=[((0,0,.68),(.48,.48,1.36),m.c('wood'))]
        # Broad tiered crown: readable 30cm blocks and a visible solid trunk.
        for z,n in ((1.48,3),(1.78,6),(2.08,6),(2.38,4),(2.68,4),(2.98,2)):
            for a in range(n):
                for b in range(n):
                    if n==6 and a in (0,5) and b in (0,5): continue
                    cells.append((((a-(n-1)/2)*.3,(b-(n-1)/2)*.3,z),(.3,.3,.3),
                                  m.c('leaf3' if z>2.3 else ('leaf1' if z>1.7 else 'leaf2'),.035)))
        return cells
    def rock(n=None):
        cells=[]
        for x,y,s in ((0,0,.60),(.52,.06,.45),(-.42,.18,.45),(.1,.49,.30),(-.3,-.3,.30)):
            cells.append(((x,y,s/2),(s,s,s),m.c(random.choice(('rock1','rock2','rock3')),.025)))
        cells.append(((0,0,.75),(.30,.30,.30),m.c('rock1',.025)))
        return cells
    def tuft(name,variant,mat):
        r=random.Random(200+variant)
        cells=[]
        for k in range(5+variant%3):
            x,y=r.uniform(-.22,.22),r.uniform(-.22,.22)
            h=r.choice((.075,.105,.15,.18)); w=r.choice((.09,.12,.15))
            cells.append(((x,h/2,-y),(w,h,w),m.lin(m.PAL[r.choice(('leaf1','leaf2','mint_lo'))])))
        return m.cubes_mesh(name,cells,mat)
    def flower(v):
        cells=[]; r=random.Random(v+20)
        for k in range(2):
            x,y=r.uniform(-.18,.18),r.uniform(-.18,.18); h=.15+k*.035
            cells.extend([((x,y,h/2),(.055,.055,h),m.c('leaf2')),
                          ((x+.07,y,.06),(.13,.12,.10),m.c('leaf1'))])
            for dx,dy in ((.06,0),(-.06,0),(0,.06),(0,-.06)):
                cells.append(((x+dx,y+dy,h),(.065,.065,.06),m.lin(m.PAL[('fl_white','fl_white','fl_pink','fl_yellow')[v%4]])))
            cells.append(((x,y,h+.015),(.06,.06,.065),m.lin(m.PAL['fl_yellow'])))
        return cells
    grid=m.build_grid
    def build_grid():
        lev,srf=grid(); m.release_grid=(lev,srf); return lev,srf
    def scatter(emitter,name,protos,count,size=1,size_rand=.3):
        lev,srf=m.release_grid
        col=bpy.data.collections.new(name+'_set'); bpy.context.scene.collection.children.link(col)
        dest=bpy.data.collections.get('cover') or bpy.data.collections.new('cover')
        if dest.name not in bpy.context.scene.collection.children: bpy.context.scene.collection.children.link(dest)
        rnd=random.Random((21 if sector=='i21' else 11)+(0 if name=='grass' else 90))
        centers=[]
        for _ in range(80 if sector=='i21' else 35):
            x,y=rnd.uniform(3,107),rnd.uniform(3,107)
            if srf[int(x/m.B)][int(y/m.B)]=='mint': centers.append((x,y))
        target=(1800 if sector=='i21' else 650) if name=='grass' else (260 if sector=='i21' else 230)
        made=0
        for _ in range(target*5):
            if made>=target or not centers: break
            cx,cy=rnd.choice(centers); spread=1.7 if name=='grass' else .7
            x,y=cx+rnd.gauss(0,spread),cy+rnd.gauss(0,spread)
            if not (1<x<109 and 1<y<109):continue
            if srf[int(x/m.B)][int(y/m.B)]!='mint':continue
            p=rnd.choice(protos[:3] if name=='grass' else protos[:4]); ob=p.copy(); ob.data=p.data; dest.objects.link(ob)
            yaw=rnd.random()*math.tau; s=rnd.uniform(.8,1.2)
            ob.matrix_world=Matrix.Translation((x,y,m.top_z(lev,x,y))) @ Matrix.Rotation(yaw,4,'Z') @ Matrix.Rotation(math.pi/2,4,'X') @ Matrix.Scale(s,4)
            made+=1
        print('COVER',sector,name,made)
        return col
    m.make_tree=tree; m.make_rock=rock; m.tuft_mesh=tuft; m.make_flower=flower
    m.build_grid=build_grid; m.scatter_particles=scatter
    m.build_groundcover=lambda *a:None

def export_glb(path):
    C=Matrix.Rotation(-math.pi/2,4,'X'); Ci=C.inverted()
    data={'asset':{'version':'2.0','generator':'XOOX Blender block-map r4'},'scene':0,'scenes':[{'nodes':[]}],
          'nodes':[],'meshes':[],'materials':[{'name':'vertex_color','pbrMetallicRoughness':{'baseColorFactor':[1,1,1,1],'metallicFactor':0,'roughnessFactor':.9}}],
          'buffers':[{'byteLength':0}],'bufferViews':[],'accessors':[], 'extensionsUsed':['EXT_mesh_gpu_instancing'],'extensionsRequired':['EXT_mesh_gpu_instancing']}
    blob=bytearray()
    def acc(rows,width,bounds=False):
        while len(blob)%4:blob.append(0)
        offset=len(blob)
        for row in rows: blob.extend(struct.pack('<'+'f'*width,*row))
        view=len(data['bufferViews']);data['bufferViews'].append({'buffer':0,'byteOffset':offset,'byteLength':len(blob)-offset})
        a={'bufferView':view,'componentType':5126,'count':len(rows),'type':{3:'VEC3',4:'VEC4'}[width]}
        if bounds:a.update(min=[min(r[k] for r in rows) for k in range(width)],max=[max(r[k] for r in rows) for k in range(width)])
        data['accessors'].append(a);return len(data['accessors'])-1
    meshes={}; groups=defaultdict(list); tri_total=0
    for o in bpy.context.scene.objects:
        if o.type!='MESH' or o.name=='grass_emit' or o.get('map_preview_only') or not o.visible_get():continue
        geo=o.data
        if geo not in meshes:
            geo.calc_loop_triangles(); col=geo.color_attributes.get('Col'); pos=[]; normals=[]; colors=[]
            for t in geo.loop_triangles:
                normal=C.to_3x3()@t.normal
                for loop_id in t.loops:
                    loop=geo.loops[loop_id]; p=C@geo.vertices[loop.vertex_index].co
                    pos.append(tuple(p));normals.append(tuple(normal));colors.append(tuple(col.data[loop_id if col.domain=='CORNER' else loop.vertex_index].color) if col else (1,1,1,1))
            if not pos:continue
            meshes[geo]=len(data['meshes'])
            data['meshes'].append({'name':geo.name,'primitives':[{'attributes':{'POSITION':acc(pos,3,True),'NORMAL':acc(normals,3),'COLOR_0':acc(colors,4)},'material':0}]})
        matrix=C@o.matrix_world@Ci
        loc,rot,scale=matrix.decompose()
        kind=o.name.split('.')[0]
        chunk=(int(loc.x//20),int(loc.z//20)) if kind.startswith(('tuft','flower')) else (0,0)
        groups[(meshes[geo],kind,chunk)].append((tuple(loc),(rot.x,rot.y,rot.z,rot.w),tuple(scale)))
        tri_total+=len(geo.loop_triangles)
    for (mesh,kind,chunk),items in groups.items():
        node={'name':('inst_' if len(items)>1 else '')+kind+'_'+str(chunk),'mesh':mesh}
        if len(items)>1:
            node['extensions']={'EXT_mesh_gpu_instancing':{'attributes':{'TRANSLATION':acc([i[0] for i in items],3),'ROTATION':acc([i[1] for i in items],4),'SCALE':acc([i[2] for i in items],3)}}}
        else:node.update(translation=items[0][0],rotation=items[0][1],scale=items[0][2])
        data['scenes'][0]['nodes'].append(len(data['nodes']));data['nodes'].append(node)
    data['buffers'][0]['byteLength']=len(blob)
    js=json.dumps(data,separators=(',',':')).encode();js+=b' '*((-len(js))%4);blob+=b'\0'*((-len(blob))%4)
    path.write_bytes(struct.pack('<4sII',b'glTF',2,28+len(js)+len(blob))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(blob),0x004e4942)+blob)
    print('EXPORT',path.name,'bytes',path.stat().st_size,'triangles',tri_total,'nodes',len(data['nodes']))
    return {'triangles':tri_total,'drawNodes':len(data['nodes']),'bytes':path.stat().st_size}

stats={}
for sector in ('i21','i11'):
    spec=importlib.util.spec_from_file_location('build_'+sector,HERE/('map_common.py' if sector=='i21' else 'build_i11.py'))
    mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
    m=mod if sector=='i21' else mod.m
    configure(m,sector)
    if sector=='i11':
        mod.build_grid=m.build_grid;mod.groundcover=lambda *a:None
    # i21 preview actor is loaded separately in the tool; omit it from the Blender build.
    original_exists=os.path.exists
    os.path.exists=lambda p:False if str(p).endswith('wanderer_D.glb') else original_exists(p)
    mod.build_scene();os.path.exists=original_exists
    m.setup_render(bpy.context.scene)
    for state in ('purified','polluted'):
        if state=='polluted':
            dead=[]
            for z in range(8):dead.append(((0,0,.15+z*.3),(.3,.3,.3),m.lin('#44394B')))
            for sign in (-1,1):
                for k in range(4):dead.append(((sign*(.25+k*.18),0,1.1+k*.3),(.24,.24,.3),m.lin('#514057')))
            proto=m.cubes_mesh('dead_tree',dead,m.flat_material('dead_tree_mat'))
            for ob in list(bpy.context.scene.objects):
                if ob.name.startswith('tree'):ob.data=proto.data
                if ob.name.startswith(('flower','tuft')):
                    ob.hide_render=True
                    if ob.name in bpy.context.view_layer.objects: ob.hide_set(True)
            processed=set()
            for ob in bpy.context.scene.objects:
                if ob.type!='MESH' or ob.data in processed or ob.name.startswith('tree'):continue
                processed.add(ob.data); attr=ob.data.color_attributes.get('Col')
                if not attr:continue
                low=Vector(m.lin('#211D30'));hi=Vector(m.lin('#695078'))
                for d in attr.data:
                    c=d.color; lum=.2126*c[0]+.7152*c[1]+.0722*c[2]
                    v=low.lerp(hi,max(0,min(1,lum*.9)))
                    if ob.name.startswith('spark'):v=Vector(m.lin('#A56CCE'))
                    d.color=(*v,1)
        bpy.ops.wm.save_as_mainfile(filepath=str(OUT/f'{sector}_{state}_r4.blend'))
        stats[f'{sector}_{state}']=export_glb(OUT/f'{sector}_{state}_r4.glb')
(OUT/'build_stats.json').write_text(json.dumps(stats,indent=2))
