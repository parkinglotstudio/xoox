"""Four reference-authored native voxel pets. Codex, Blender 5.2.
blender -b -P scripts/unit_lab_pets4/build_pets4.py -- --render [--pet flux]
No point sampling: solid voxel volumes -> exposed greedy quads -> one skin.
"""
import bpy, math, json, sys, shutil
from pathlib import Path
from mathutils import Vector, Matrix, Quaternion

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / 'data/tools/unit_lab/pets'
ART = ROOT / 'docs/reports/assets/20261004_펫4종_Codex'
ART.mkdir(parents=True, exist_ok=True)
CELL = .02
TAU = math.tau
SPECS = {
    'nofilter': {'name': 'NoFilter', 'reference': '3NOFILTER.png',
                 'body': 'd9b35d', 'light': 'f0ce86', 'dark': '827247', 'armor': 'ad9153', 'metal': '819079', 'accent': '13eea3', 'ruff': 'e2bd74'},
    'flux': {'name': 'Flux', 'reference': 'Australian Cattle Dog1- Flux.png',
             'body': 'd865b6', 'light': 'eb91cf', 'dark': '63536b', 'armor': 'ac899f', 'metal': '756876', 'accent': 'ffe62c', 'ruff': 'f0d4a0'},
    'lumos': {'name': 'Lumos', 'reference': 'Australian Cattle Dog2- Lumos.png',
              'body': 'c2b5b2', 'light': 'e9dcce', 'dark': '544b48', 'armor': '85807c', 'metal': '6d6963', 'accent': 'f33935', 'ruff': 'd9cac0'},
    'gizmo': {'name': 'Gizmo', 'reference': 'Norwegian Forest Cat - Gizmo.png',
              'body': '6788b5', 'light': '9ac9da', 'dark': '335e75', 'armor': 'a49746', 'metal': 'b27c52', 'accent': '24eee0', 'ruff': '65bed6'},
}
def linear(h):
    a=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    return tuple(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in a)+(1,)

class Volume:
    def __init__(self, spec):
        self.spec=spec; self.cells={}
    def color(self, color): return self.spec.get(color,color)
    def shape(self, bone, center, dimensions, color, predicate, glow=False):
        grid=self.cells.setdefault(bone,{})
        lo=[math.floor((center[i]-dimensions[i]/2)/CELL) for i in range(3)]
        hi=[math.ceil((center[i]+dimensions[i]/2)/CELL) for i in range(3)]
        value=(self.color(color),glow)
        for x in range(lo[0],hi[0]):
            for y in range(lo[1],hi[1]):
                for z in range(lo[2],hi[2]):
                    p=tuple(((x,y,z)[i]+.5)*CELL-center[i] for i in range(3))
                    if predicate(p): grid[x,y,z]=value
    def box(self,bone,c,d,col,roundness=0,glow=False):
        r=min(roundness,min(d)/2-.0001)
        def hit(p):
            if r<=0:return all(abs(p[i])<=d[i]/2 for i in range(3))
            return sum(max(0,abs(p[i])-(d[i]/2-r))**2 for i in range(3))<=r*r
        self.shape(bone,c,d,col,hit,glow)
    def ell(self,bone,c,d,col,glow=False):
        self.shape(bone,c,d,col,lambda p:sum((p[i]/(d[i]/2))**2 for i in range(3))<=1,glow)
    def poly(self,bone,polygon,y,depth,col,glow=False):
        xs,zs=zip(*polygon);c=((min(xs)+max(xs))/2,y,(min(zs)+max(zs))/2)
        d=(max(xs)-min(xs),depth,max(zs)-min(zs))
        def hit(p):
            x,z=p[0]+c[0],p[2]+c[2];inside=False
            for i,(ax,az) in enumerate(polygon):
                bx,bz=polygon[i-1]
                if (az>z)!=(bz>z) and x<(bx-ax)*(z-az)/(bz-az)+ax: inside=not inside
            return inside and abs(p[1])<=depth/2
        self.shape(bone,c,d,col,hit,glow)
    def segment(self,bone,a,b,width,col,depth=None,glow=False):
        a,b=Vector(a),Vector(b);delta=b-a
        radius=width/2;c=(a+b)/2;d=tuple(abs(delta[i])+width for i in range(3))
        def hit(p):
            pos=Vector(p)+c;u=max(0,min(1,(pos-a).dot(delta)/max(1e-9,delta.length_squared)))
            q=pos-(a+delta*u)
            return q.length_squared<=radius*radius
        self.shape(bone,c,d,col,hit,glow)
    def mesh(self, name, opaque, luminous):
        vertices=[];faces=[];colors=[];matindices=[];weights={}
        for bone,grid in self.cells.items():
            weights[bone]=[]
            for axis in range(3):
                u,v=(axis+1)%3,(axis+2)%3
                for sign in (-1,1):
                    slices={}
                    for p,color in grid.items():
                        neighbor=list(p);neighbor[axis]+=sign
                        if tuple(neighbor) in grid:continue
                        plane=p[axis]+(1 if sign>0 else 0)
                        slices.setdefault(plane,{})[p[u],p[v]]=color
                    for plane,mask in slices.items():
                        while mask:
                            (a,b),color=next(iter(mask.items()));w=1
                            while mask.get((a+w,b))==color:w+=1
                            h=1
                            while all(mask.get((a+j,b+h))==color for j in range(w)):h+=1
                            for dy in range(h):
                                for dx in range(w):del mask[a+dx,b+dy]
                            base=len(vertices)
                            for px,py in [(a,b),(a+w,b),(a+w,b+h),(a,b+h)]:
                                p=[0,0,0];p[axis]=plane*CELL;p[u]=px*CELL;p[v]=py*CELL;vertices.append(p)
                            indices=(base,base+1,base+2,base+3)
                            faces.append(indices if sign>0 else tuple(reversed(indices)))
                            colors.append(linear(color[0]));matindices.append(int(color[1]));weights[bone].extend(range(base,base+4))
        me=bpy.data.meshes.new(name);me.from_pydata(vertices,[],faces);me.update()
        ob=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(ob)
        me.materials.append(opaque);me.materials.append(luminous)
        attr=me.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='CORNER')
        for poly,col,mi in zip(me.polygons,colors,matindices):
            poly.material_index=mi
            for index in poly.loop_indices:attr.data[index].color=col
        for bone,ids in weights.items():ob.vertex_groups.new(name=bone).add(ids,1,'REPLACE')
        ob['nativeBlocks']=True;ob['cellMeters']=CELL
        return ob

def make_material(name,glow=False):
    mat=bpy.data.materials.new(name);mat.use_nodes=True
    p=mat.node_tree.nodes.get('Principled BSDF');p.inputs['Roughness'].default_value=.78
    vc=mat.node_tree.nodes.new('ShaderNodeVertexColor');vc.layer_name='Color'
    mat.node_tree.links.new(vc.outputs['Color'],p.inputs['Base Color'])
    if glow:
        mat.node_tree.links.new(vc.outputs['Color'],p.inputs['Emission Color']);p.inputs['Emission Strength'].default_value=.35
    return mat

def rig_points(pet):
    R={n:Vector(p) for n,p in {'root':(0,0,0),'pelvis':(0,.30,.43),'spine':(0,.04,.46),
       'chest':(0,-.23,.46),'neck':(0,-.32,.65),'head':(0,-.40,.86),'jaw':(0,-.61,.74)}.items()}
    parents={'root':None,'pelvis':'root','spine':'pelvis','chest':'spine','neck':'chest','head':'neck','jaw':'head'}
    for side,s in [('L',1),('R',-1)]:
        R['ear.'+side]=Vector((s*.17,-.36,1.015));parents['ear.'+side]='head'
        for prefix,pts in [('front',[(s*.19,-.25,.48),(s*.19,-.17,.26),(s*.19,-.30,.075)]),
                           ('hind',[(s*.19,.31,.43),(s*.19,.47,.24),(s*.19,.37,.075)])]:
            names=[f'{prefix}_{k}.{side}' for k in ('upper','lower','paw')]
            for n,p in zip(names,pts):R[n]=Vector(p)
            parents[names[0]]='chest' if prefix=='front' else 'pelvis'
            parents[names[1]]=names[0];parents[names[2]]=names[1]
    T=[Vector(p) for p in [(0,.50,.43),(0,.61,.47),(0,.72,.54),(0,.81,.63),(0,.85,.75),
                           (0,.85,.87),(0,.80,.99),(0,.71,1.08),(0,.60,1.13)]]
    if pet=='flux':T=[Vector(p) for p in [(0,.50,.43),(0,.61,.40),(0,.73,.35),(0,.83,.30),(0,.92,.24),(0,1.00,.20),(0,1.07,.18),(0,1.13,.17),(0,1.19,.16)]]
    if pet=='gizmo':T=[T[0]+(p-T[0])*1.26 for p in T]
    for i in range(8):
        n=f'tail.{i+1:02d}';R[n]=T[i];parents[n]='pelvis' if i==0 else f'tail.{i:02d}'
    return R,parents,T

def sculpt(pet,spec,R,T):
    v=Volume(spec)
    v.ell('spine',(0,.035,.44),(.39,.66,.34),'body')
    v.ell('pelvis',(0,.31,.40),(.43,.34,.33),'body')
    v.ell('chest',(0,-.25,.48),(.43,.30,.40),'body')
    v.ell('neck',(0,-.33,.67),(.28,.25,.34),'ruff')
    v.ell('head',(0,-.395,.885),(.47,.38,.36),'ruff' if pet=='flux' else 'body')
    v.box('head',(0,-.39,1.025),(.28,.23,.07),'ruff' if pet=='flux' else 'light',.028)
    muzzle='metal' if pet=='nofilter' else 'ruff'
    if pet=='gizmo':
        # Broad cat cheeks and short muzzle, distinct from the three dogs.
        for s in (-1,1):v.ell('jaw',(s*.071,-.591,.775),(.16,.14,.13),'light')
        v.poly('jaw',[(-.045,.816),(.045,.816),(0,.775)],-.672,.055,'dark')
        v.box('jaw',(0,-.655,.753),(.07,.023,.021),'dark')
    else:
        v.ell('jaw',(0,-.603,.76),(.30,.30,.20),muzzle)
        v.ell('jaw',(0,-.735,.80),(.14,.075,.093),'344451' if pet=='nofilter' else 'dark')
        v.box('jaw',(0,-.687,.688),(.20,.027,.018),'dark',.008)
        v.box('jaw',(0,-.676,.711),(.22,.05,.028),'light',.01)
    for side,s in [('L',1),('R',-1)]:
        b='ear.'+side
        tip=1.30 if pet!='gizmo' else 1.20
        outer=[(s*.064,.995),(s*.263,.982),(s*.252,tip),(s*.207,tip+.025)]
        v.poly(b,outer,-.35,.105,'armor' if pet!='lumos' else 'ruff')
        inner=[(s*.102,1.023),(s*.232,1.009),(s*.228,tip-.045),(s*.207,tip-.008)]
        v.poly(b,inner,-.416,.027,'dark')
        for j in range(5):
            z=1.045+j*.043;cx=s*(.174+j*.007)
            if pet=='nofilter':
                v.box(b,(cx,-.438,z),(.023,.023,.044),'accent',glow=True)
                v.box(b,(s*(.208+j*.001),-.438,z),(.018,.022,.038),'accent',glow=True)
            elif pet=='flux':v.box(b,(cx,-.438,z),(.093-j*.012,.023,.025),'accent',glow=True)
            elif pet=='gizmo':
                if j<3:v.box(b,(cx,-.438,z),(.065-j*.009,.023,.032),'accent',glow=True)
            else:v.box(b,(cx,-.43,z),(.069-j*.008,.022,.032),'light')
        # Eyelids, framed sockets and inset pupils, all attached to head.
        x=s*.128;eyeZ=.886
        v.ell('head',(x,-.573,eyeZ),(.166,.078,.16),'dark')
        if pet=='nofilter':v.ell('head',(x,-.614,eyeZ),(.12,.038,.119),'accent',True)
        elif pet=='flux':v.ell('head',(x,-.615,eyeZ),(.11,.034,.09),'accent',True)
        elif pet=='lumos':
            v.box('head',(x,-.615,eyeZ),(.098,.034,.073),'dark',.01)
            for j in (-1,0,1):v.box('head',(x+j*.028,-.64,eyeZ),(.014,.026,.065),'accent',glow=True)
        else:
            v.ell('head',(x,-.613,eyeZ),(.115,.033,.12),'accent',True)
            v.box('head',(x,-.633,eyeZ),(.025,.022,.10),'d09099')
        if pet not in ('lumos','gizmo'):v.box('head',(x-s*.013,-.641,eyeZ),(.028,.022,.081),'1c3034',.005)
        v.box('head',(x-s*.023,-.657,eyeZ+.034),(.024,.022,.022),'fff3db',glow=True)
        v.box('head',(x,-.603,.979),(.18,.054,.047),'body' if pet!='gizmo' else 'armor',.019)
        # Side joints, thigh plates and armoured paws.
        for pre in ('front','hind'):
            a,bp,c=[R[f'{pre}_{k}.{side}'] for k in ('upper','lower','paw')]
            ub,lb,pb=[f'{pre}_{k}.{side}' for k in ('upper','lower','paw')]
            v.segment(ub,a,bp,.123 if pre=='front' else .15,'body')
            v.ell(ub,a+Vector((s*.025,0,-.01)),(.14,.20,.23),'armor')
            v.ell(ub,a+Vector((s*.088,0,-.01)),(.055,.15,.17),'dark')
            v.ell(ub,a+Vector((s*.113,0,-.01)),(.031,.105,.12),'light' if pet=='nofilter' else 'metal')
            v.box(ub,a+Vector((s*.136,0,-.01)),(.021,.028,.027),'dark')
            v.segment(lb,bp,c,.095,'metal' if pet!='nofilter' else 'body')
            v.box(lb,bp+Vector((0,-.061,-.067)),(.11,.043,.105),'armor',.014)
            if pet in ('flux','lumos') or (pet=='gizmo' and pre=='front'):
                for j in range(3):v.box(lb,bp+Vector((s*(j-1)*.026,-.09,-.075)),(.014,.028,.075),'dark')
            pawCol='metal' if pet=='nofilter' else 'accent'
            v.ell(pb,c+Vector((0,-.037,-.012)),(.16,.20,.115),pawCol,pet=='gizmo')
            for dx in (-.041,.041):v.box(pb,c+Vector((dx,-.121,-.01)),(.019,.024,.043),'dark')
            if pet=='flux':
                for dx in (-.045,0,.045):v.box(pb,c+Vector((dx,-.141,-.014)),(.025,.047,.039),'accent')
    # Tail segments retain caps across joints to prevent animation holes.
    for i in range(8):
        bone=f'tail.{i+1:02d}';col='accent' if pet=='nofilter' and i>=6 else 'metal' if pet in ('nofilter','lumos','gizmo') else 'ruff'
        width=.066 if pet!='flux' else .10-.006*i
        v.segment(bone,T[i],T[i+1],width,col,glow=pet=='nofilter' and i>=6)
        if pet!='flux':
            v.ell(bone,T[i],(.087,.075,.076),'dark')
            if pet in ('gizmo','lumos'):v.box(bone,T[i].lerp(T[i+1],.55)+Vector((-.036,0,0)),(.025,.043,.036),'accent',glow=True)
    if pet=='nofilter':
        # Peach visor arch, circular headphones and collar, mint chest/back energy panels.
        for s in (-1,1):
            v.segment('head',(s*.235,-.606,.853),(s*.213,-.567,1.026),.045,'efc89b')
            v.segment('head',(s*.213,-.567,1.026),(0,-.58,1.076),.045,'efc89b')
            v.ell('head',(s*.25,-.345,.864),(.13,.22,.23),'dark')
            v.ell('head',(s*.31,-.345,.864),(.035,.17,.18),'armor')
            v.box('head',(s*.332,-.345,.864),(.026,.035,.11),'dark')
        v.box('neck',(0,-.347,.64),(.30,.23,.053),'dfa98d',.02)
        v.box('chest',(0,-.408,.464),(.19,.047,.18),'dark',.02)
        v.box('chest',(0,-.44,.464),(.14,.029,.13),'accent',.02,True)
        v.box('spine',(0,.055,.61),(.31,.44,.055),'metal',.015)
        for y in (-.09,.13):v.box('spine',(0,y,.651),(.18,.16,.037),'accent',.012,True)
        for s in (-1,1):v.box('spine',(s*.207,.055,.37),(.042,.32,.17),'536b39',.015)
    if pet=='flux':
        # Cream ruff surrounding the neck and magenta crest.
        for j in range(14):
            a=TAU*j/14;x=.22*math.cos(a);z=.64+.19*math.sin(a)
            v.ell('neck',(x,-.323,z),(.13,.20,.16),'ruff')
            v.segment('neck',(x,-.31,z),(x*1.21,-.32,z-.067),.084,'ruff')
        v.poly('head',[(-.045,1.03),(.045,1.03),(.04,1.29),(0,1.38),(-.04,1.17)],-.36,.076,'body')
        v.box('jaw',(0,-.705,.775),(.14,.105,.16),'metal',.034)
        v.box('jaw',(0,-.77,.785),(.09,.035,.05),'dark')
        for dx in (-.065,-.026,.026,.065):v.box('jaw',(dx,-.729,.697),(.020,.041,.032),'accent')
        for y in (-.06,.18):
            v.box('spine',(0,y,.568),(.45,.20,.13),'armor',.025)
            v.box('spine',(0,y,.648),(.10,.17,.034),'accent',glow=True)
            for s in (-1,1):
                for j in range(3):v.segment('spine',(s*.237,y-.065+j*.058,.54),(s*.27,y-.085+j*.059,.32),.025,'dark')
        for s in (-1,1):
            for j in range(3):v.box('pelvis',(s*.235,.26+j*.05,.46),(.030,.030,.092),'accent')
    if pet=='lumos':
        # Asymmetric viewer-left cyber assembly; natural opposite ear remains visible.
        v.box('head',(-.145,-.61,.97),(.22,.091,.24),'metal',.056)
        v.ell('head',(-.148,-.67,.925),(.158,.043,.158),'dark')
        for j in range(8):
            a=TAU*j/8
            v.segment('head',(-.148+math.cos(a)*.065,-.686,.925+math.sin(a)*.065),(-.148+math.cos(a)*.10,-.652,.925+math.sin(a)*.10),.027,'armor')
        for j in range(4):v.box('head',(-.20+j*.035,-.702,.925),(.021,.026,.104),'accent',glow=True)
        for j in range(3):v.segment('head',(-.225,-.36,1.025+j*.045),(-.35,-.30,1.08+j*.075),.035,'metal')
        v.box('head',(-.24,-.408,1.145),(.046,.045,.13),'accent',glow=True)
        v.segment('head',(.06,-.606,.98),(.21,-.601,.812),.022,'dark')
        for s in (-1,1):
            for j in range(5):v.ell('neck',(s*(.13+.018*(j%2)),-.31,.55+j*.055),(.17,.20,.14),'ruff')
        for j in range(5):v.ell('spine',(0,-.02+j*.11,.588),(.29,.16,.057),'light')
        # Front sleeve is visibly segmented steel with red feet.
        for side in ('L','R'):
            p=R['front_lower.'+side]
            v.box('front_lower.'+side,p+Vector((0,-.062,-.07)),(.12,.049,.15),'metal',.01)
            for x in (-.035,0,.035):v.box('front_lower.'+side,p+Vector((x,-.098,-.07)),(.014,.023,.11),'dark')
    if pet=='gizmo':
        # Long layered chest/side mane. Avoid a dog-shaped short ruff.
        for s in (-1,1):
            for j in range(7):
                x=s*(.09+j*.033);z=.74-j*.043
                v.segment('neck',(x,-.30,z+.06),(x*1.12,-.33,z-.20),.10,'ruff' if j%3 else 'light')
                v.segment('neck',(x*1.10,-.34,z),(x*1.24,-.37,z-.18),.044,'light')
            for j in range(4):v.segment('head',(s*.22,-.31,.95-j*.06),(s*.31,-.28,.87-j*.065),.078,'ruff')
        v.poly('head',[(-.23,.97),(-.20,1.076),(.20,1.076),(.23,.97),(.07,.887),(-.07,.887)],-.537,.045,'armor')
        for x,z in [(-.17,1.06),(-.08,1.08),(.08,1.08),(.17,1.06),(0,1.00)]:
            v.poly('head',[(x-.022,z),(x+.022,z),(x,z+.062)],-.58,.03,'accent',True)
        v.box('spine',(0,.045,.617),(.31,.31,.15),'armor',.019)
        for x in (-.09,0,.09):
            v.box('spine',(x,.055,.705),(.062,.17,.045),'dark')
            v.box('spine',(x,.055,.733),(.043,.13,.028),'accent',glow=True)
        for s in (-1,1):
            v.box('front_lower.'+('L' if s>0 else 'R'),(s*.19,-.27,.15),(.18,.21,.16),'metal',.022)
            for j in range(3):v.box('front_lower.'+('L' if s>0 else 'R'),(s*.19,-.39,.11+j*.036),(.11,.029,.020),'accent',glow=True)
            v.box('ear.'+('L' if s>0 else 'R'),(s*.23,-.34,1.165),(.105,.11,.077),'dark',.015)
            v.box('ear.'+('L' if s>0 else 'R'),(s*.23,-.34,1.215),(.08,.09,.042),'accent',.01,True)
        for j in range(6):v.ell('pelvis',(0,.22+j*.041,.51-j*.018),(.46,.12,.17),'body')
    return v

def make_rig(R,parents):
    ad=bpy.data.armatures.new('PetRig');arm=bpy.data.objects.new('PetRig',ad);bpy.context.collection.objects.link(arm)
    bpy.context.view_layer.objects.active=arm;arm.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
    for name,p in R.items():
        b=ad.edit_bones.new(name);b.head=p;b.tail=p+Vector((0,0,.05))
        if parents[name]:b.parent=ad.edit_bones[parents[name]]
    bpy.ops.object.mode_set(mode='OBJECT')
    for pb in arm.pose.bones:pb.rotation_mode='QUATERNION'
    return arm

def smooth(t):
    t=max(0,min(1,t));return t*t*(3-2*t)
def ik(a,c,l1,l2,bend):
    d=c-a;dist=max(1e-5,d.length);direction=d/dist;dist=min(dist,l1+l2-1e-5)
    along=(l1*l1-l2*l2+dist*dist)/(2*dist);perp=Vector((0,-direction.z,direction.y))*bend
    return a+direction*along+perp*math.sqrt(max(0,l1*l1-along*along))
def aim(a,b,c,d):return (b-a).normalized().rotation_difference((d-c).normalized())

def animator(arm,R,parents,T):
    rest={b.name:b.matrix_local.copy() for b in arm.data.bones};I=Quaternion((1,0,0,0))
    def deformation(name,p,q=I):return Matrix.Translation(p)@q.to_matrix().to_4x4()@Matrix.Translation(-R[name])
    def pose(clip,t):
        seated=clip in ('idle_sit','idle_look')
        transition=clip in ('stand_up','sit_down');locomotion=clip in ('walk','run')
        sit=1 if seated else 1-smooth(t) if clip=='stand_up' else smooth(t) if clip=='sit_down' else 0
        phase=TAU*t;bob=(.012 if clip=='run' else .004)*math.cos(phase*2) if locomotion else 0 if transition else .0025*math.sin(phase)
        pelvis=R['pelvis']+Vector((0,-.07*sit,-.22*sit+bob))
        chest=R['chest']+Vector((0,.025*sit,bob))
        pitch=math.atan2(pelvis.z-chest.z,pelvis.y-chest.y)-math.atan2(R['pelvis'].z-R['chest'].z,R['pelvis'].y-R['chest'].y)
        bodyQ=Quaternion((1,0,0),pitch);spine=chest.lerp(pelvis,.52)
        yaw=.19*math.sin(phase) if clip=='idle_look' else .008*math.sin(phase)
        nod=.022*math.cos(phase*2) if clip=='run' else .012*math.cos(phase) if clip=='walk' else .005*math.sin(phase)
        recoil=max(0,1-abs(t-.42)/.14)*.05 if clip=='attack_laser' else 0
        hq=Quaternion((0,0,1),yaw)@Quaternion((1,0,0),nod+recoil)
        head=R['head']+Vector((0,.025*sit,bob))
        mats={'root':Matrix.Identity(4),'pelvis':deformation('pelvis',pelvis,bodyQ),'spine':deformation('spine',spine,bodyQ),'chest':deformation('chest',chest),
              'head':deformation('head',head,hq),'neck':deformation('neck',R['neck']+head-R['head'],Quaternion((1,0,0),pitch*.22))}
        mats['jaw']=mats['head']
        for side,s in [('L',1),('R',-1)]:
            ear='ear.'+side;eq=hq@Quaternion((0,1,0),s*(.045 if clip=='run' else .018)*math.sin(phase-.5+s*.4))
            mats[ear]=deformation(ear,mats['head']@R[ear],eq)
            for pre in ('front','hind'):
                names=[f'{pre}_{k}.{side}' for k in ('upper','lower','paw')];a0,b0,c0=[R[n] for n in names]
                a=chest+(a0-R['chest']) if pre=='front' else pelvis+(a0-R['pelvis']);c=c0.copy()
                if pre=='hind':
                    c.y-=.19*sit
                    if transition:
                        ft=max(0,min(1,(t-(.08 if side=='L' else .33))/.48));fs=1-smooth(ft) if clip=='stand_up' else smooth(ft)
                        c.y=c0.y-.19*fs;c.z+=.027*math.sin(math.pi*ft)
                if locomotion:
                    ph=phase+(0 if side=='L' else math.pi)+(math.pi if pre=='hind' else 0)
                    if clip=='run':ph=phase+(.30 if side=='R' else 0)+(math.pi if pre=='hind' else 0)
                    c.y+=(.115 if clip=='run' else .066)*math.cos(ph);c.z+=(.077 if clip=='run' else .038)*max(0,math.sin(ph))
                b=ik(a,c,(b0-a0).length,(c0-b0).length,1 if pre=='front' else -1)
                mats[names[0]]=deformation(names[0],a,aim(a0,b0,a,b));mats[names[1]]=deformation(names[1],b,aim(b0,c0,b,c));mats[names[2]]=deformation(names[2],c)
        tailpts=[mats['pelvis']@T[0]]
        for i in range(8):
            d=(T[i+1]-T[i]).normalized();side=Vector((-.80,-.15,0 if T[-1].z<T[0].z else -.20)).normalized()
            d=d.lerp(side,.72*sit).normalized()
            angle=(.10 if clip=='run' else .055 if clip=='walk' else .035)*math.sin(phase-i*.35)*(i/7)**2
            d=Quaternion((0,0,1),angle)@d;length=(T[i+1]-T[i]).length
            if tailpts[-1].z+d.z*length<.085:
                dz=max(-.99,min(.99,(.085-tailpts[-1].z)/length));horizontal=Vector((d.x,d.y,0)).normalized()*math.sqrt(1-dz*dz);d=Vector((horizontal.x,horizontal.y,dz))
            tailpts.append(tailpts[-1]+d*length)
            n=f'tail.{i+1:02d}';mats[n]=deformation(n,tailpts[i],aim(T[i],T[i+1],tailpts[i],tailpts[i+1]))
        for name in R:
            desired=mats[name]@rest[name];pn=parents[name]
            basis=rest[name].inverted()@desired if pn is None else rest[name].inverted()@rest[pn]@(mats[pn]@rest[pn]).inverted()@desired
            loc,q,scale=basis.decompose();pb=arm.pose.bones[name];pb.location=loc;pb.rotation_quaternion=q;pb.scale=scale
        return mats
    return pose

CLIPS={'idle_stand':4.,'idle_sit':4.,'idle_look':5.,'walk':1.,'run':.6,'attack_laser':.7,'stand_up':1.1,'sit_down':1.1}
def bake(arm,pose):
    for name,seconds in CLIPS.items():
        arm.animation_data_create();act=bpy.data.actions.new(name);arm.animation_data.action=act;frames=round(seconds*30)
        for f in range(frames+1):
            bpy.context.scene.frame_set(f+1);pose(name,f/frames)
            for pb in arm.pose.bones:
                pb.keyframe_insert('location',frame=f+1);pb.keyframe_insert('rotation_quaternion',frame=f+1);pb.keyframe_insert('scale',frame=f+1)
        act.use_fake_user=True;track=arm.animation_data.nla_tracks.new();track.name=name
        strip=track.strips.new(name,1,act);strip.action_frame_end=frames+1;strip.extrapolation='NOTHING';track.mute=True;arm.animation_data.action=None
        print('PET_CLIP',name,frames,flush=True)

def validate(arm,body,pose):
    checks={};maxloop=0.;maxseam=0.;minz=100;deps=bpy.context.evaluated_depsgraph_get()
    for clip in CLIPS:
        first=pose(clip,0)
        last=pose(clip,1)
        if clip not in ('stand_up','sit_down','attack_laser'):
            delta=max(abs(first[n][i][j]-last[n][i][j]) for n in first for i in range(4) for j in range(4));maxloop=max(maxloop,delta)
            checks[clip]={'loop_matrix_error':delta}
        for t in (0,.125,.25,.375,.5,.625,.75,.875,1):
            pose(clip,t);bpy.context.view_layer.update();ev=body.evaluated_get(deps)
            minz=min(minz,min((ev.matrix_world@v.co).z for v in ev.data.vertices))
            for side in ('L','R'):
                for pre in ('front','hind'):
                    for segment,next_segment in [('upper','lower'),('lower','paw')]:
                        pb=arm.pose.bones[f'{pre}_{segment}.{side}'];next_bone=arm.pose.bones[f'{pre}_{next_segment}.{side}']
                        endpoint=pb.matrix@pb.bone.matrix_local.inverted()@next_bone.bone.head_local
                        maxseam=max(maxseam,(endpoint-next_bone.head).length)
    def delta(a,b):return max(abs(a[n][i][j]-b[n][i][j]) for n in a for i in range(4) for j in range(4))
    checks['sit_down_start_error']=delta(pose('sit_down',0),pose('idle_stand',0))
    checks['sit_down_end_error']=delta(pose('sit_down',1),pose('idle_sit',0))
    checks['stand_up_start_error']=delta(pose('stand_up',0),pose('idle_sit',0))
    checks['stand_up_end_error']=delta(pose('stand_up',1),pose('idle_stand',0))
    checks['minimum_vertex_z']=minz;checks['max_loop_matrix_error']=maxloop;checks['maximum_leg_joint_gap']=maxseam
    if maxloop>1e-5:raise RuntimeError('loop discontinuity '+str(maxloop))
    if maxseam>.001:raise RuntimeError('leg joint gap '+str(maxseam))
    if minz<-.005:raise RuntimeError('floor penetration '+str(minz))
    return checks

def review_setup():
    sc=bpy.context.scene;sc.render.engine='CYCLES';sc.cycles.samples=20;sc.cycles.use_denoising=True;sc.cycles.max_bounces=4
    sc.render.resolution_x=840;sc.render.resolution_y=840;sc.render.resolution_percentage=100
    sc.view_settings.view_transform='Standard';sc.world.use_nodes=True
    sc.world.node_tree.nodes['Background'].inputs[0].default_value=(.18,.22,.28,1);sc.world.node_tree.nodes['Background'].inputs[1].default_value=.40
    for name,pos,energy,size in [('key',(-2,-3,4),190,3),('fill',(3,-1,2),85,3),('rim',(1,3,3),150,2)]:
        ld=bpy.data.lights.new(name,'AREA');ld.energy=energy;ld.shape='DISK';ld.size=size
        ob=bpy.data.objects.new(name,ld);bpy.context.collection.objects.link(ob);ob.location=pos;ob.rotation_euler=(Vector((0,0,.6))-ob.location).to_track_quat('-Z','Y').to_euler()
    bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.002));floor=bpy.context.object;floor.name='Review_floor'
    mat=bpy.data.materials.new('Review_floor');mat.use_nodes=True;p=mat.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(.022,.037,.055,1);p.inputs['Roughness'].default_value=1;floor.data.materials.append(mat)
    cd=bpy.data.cameras.new('Review_camera');cam=bpy.data.objects.new('Review_camera',cd);bpy.context.collection.objects.link(cam);sc.camera=cam;cd.type='ORTHO';cd.ortho_scale=1.9
    return sc,cam

def build(pet):
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    for collection in (bpy.data.meshes,bpy.data.materials,bpy.data.armatures,bpy.data.actions):
        for item in list(collection):
            if item.users==0:collection.remove(item)
    bpy.context.scene.render.fps=30
    spec=SPECS[pet];out=DATA/pet;out.mkdir(parents=True,exist_ok=True);(out/'source').mkdir(exist_ok=True)
    shutil.copy2(Path('C:/Users/dmaxd/Downloads')/spec['reference'],out/'reference.png')
    R,parents,T=rig_points(pet);volume=sculpt(pet,spec,R,T)
    body=volume.mesh(spec['name']+'_voxel_body',make_material('Pet_matte'),make_material('Pet_energy',True))
    arm=make_rig(R,parents);body.parent=arm;mod=body.modifiers.new('Voxel_skin','ARMATURE');mod.object=arm
    body['petId']='pet_'+pet;arm['petId']='pet_'+pet;arm['reference']=spec['reference']
    arm['eyeSockets']={s:list(arm.data.bones['head'].matrix_local.inverted()@Vector((x,-.664,.886))) for s,x in [('L',.128),('R',-.128)]}
    pose=animator(arm,R,parents,T);bake(arm,pose)
    for tr in arm.animation_data.nla_tracks:tr.mute=True
    checks=validate(arm,body,pose)
    for pb in arm.pose.bones:pb.location=(0,0,0);pb.rotation_quaternion=(1,0,0,0);pb.scale=(1,1,1)
    for tr in arm.animation_data.nla_tracks:tr.mute=False
    bpy.context.scene.frame_set(0);bpy.ops.object.select_all(action='DESELECT');arm.select_set(True);body.select_set(True);bpy.context.view_layer.objects.active=arm
    bpy.ops.export_scene.gltf(filepath=str(out/(pet+'.glb')),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_force_sampling=True,export_anim_slide_to_zero=True,export_extras=True,export_apply=False,export_vertex_color='NAME',export_vertex_color_name='Color')
    metrics={'id':'pet_'+pet,'name':spec['name'],'revision':'PET04-02','reference':spec['reference'],'cell_meters':CELL,
      'triangles':sum(len(p.vertices)-2 for p in body.data.polygons),'vertices':len(body.data.vertices),'bones':len(R),'materials':2,
      'voxels':sum(len(g) for g in volume.cells.values()),'bytes':(out/(pet+'.glb')).stat().st_size,'animations':CLIPS,
      'eye_sockets_head_local':{s:list(p) for s,p in arm['eyeSockets'].items()},'laser':{'start':.18,'end':.30,'range':2.2,'cooldown':3,'color':'#'+spec['accent']},
      'locomotion':{'walk_mps':1.3,'run_mps':3.8},'validation':checks,'palette':{k:v for k,v in spec.items() if k not in ('name','reference')}}
    (out/'manifest.json').write_text(json.dumps(metrics,ensure_ascii=False,indent=2),encoding='utf8')
    for tr in arm.animation_data.nla_tracks:tr.mute=True
    arm.animation_data.action=None;pose('idle_stand',0);bpy.context.view_layer.update();sc,cam=review_setup()
    cam.location=(2,-3,1.75);cam.rotation_euler=(Vector((0,.1,.67))-cam.location).to_track_quat('-Z','Y').to_euler()
    bpy.ops.wm.save_as_mainfile(filepath=str(out/('source/'+pet+'.blend')))
    if '--render' in sys.argv:
        shots=[('front','idle_stand',0,(0,-3,1.05)),('threequarter','idle_stand',0,(2,-3,1.75)),('back','idle_stand',0,(1,3,1.6)),
               ('sit','idle_sit',0,(2,-3,1.75)),('transition','sit_down',.5,(2,-3,1.75)),('run','run',.25,(2,-3,1.75))]
        for name,clip,t,pos in shots:
            pose(clip,t);bpy.context.view_layer.update();cam.location=pos;cam.rotation_euler=(Vector((0,.1,.67))-cam.location).to_track_quat('-Z','Y').to_euler()
            sc.render.filepath=str(ART/(pet+'_'+name+'.png'));bpy.ops.render.render(write_still=True)
    print('PET_COMPLETE',json.dumps(metrics),flush=True)
    return metrics

selected=sys.argv[sys.argv.index('--pet')+1] if '--pet' in sys.argv else None
summaries=[build(p) for p in SPECS if selected is None or p in selected.split(',')]
(ART/('metrics_'+selected+'.json' if selected else 'metrics.json')).write_text(json.dumps(summaries,ensure_ascii=False,indent=2),encoding='utf8')
