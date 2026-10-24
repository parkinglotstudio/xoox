"""BCAT-01: authored block cat, four baked skeletal clips. Blender 5.2.
Run: blender -b -P scripts/unit_lab_cat/build_cat.py -- --render
Author: Codex. Independent from wanderer A/D and game code.
"""
import bpy, bmesh, math, json, random, sys
from pathlib import Path
from mathutils import Vector, Matrix, Quaternion
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'data/tools/unit_lab/pets/block_cat'
ART=ROOT/'docs/reports/assets/20260926_블록고양이펫_Codex'
for p in (OUT,OUT/'source',OUT/'textures',ART):p.mkdir(parents=True,exist_ok=True)
random.seed(19)
TAU=math.tau
C={'sky':'83c9d8','light':'a4dce5','cyan':'29b6c4','teal':'238e9b','shadow':'467884','dark':'303f49','edge':'4d616c','inner':'a8c2c9','lime':'80df32','limeDark':'58a521','red':'fc3654','pupil':'18222a','purple':'9752cc','purpleDark':'5b377e'}
def rgb(h):
 h=C.get(h,h);a=[int(h[i:i+2],16)/255 for i in (0,2,4)]
 return tuple(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in a)+(1,)
def setup():
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 sc=bpy.context.scene;sc.render.fps=30
 sc.world.color=(.12,.12,.12)
setup()
# Small baked paint wear, shared by all opaque pieces; no separate decal draw calls.
N=512
pixels=[1.0]*(N*N*4)
for _ in range(680):
 x=random.randrange(N);y=random.randrange(N);w=random.choice([1,1,2,3,5]);hh=random.choice([1,1,2])
 v=random.choice([.64,.77,.84,.91])
 for dy in range(hh):
  for dx in range(w):
   k=(((y+dy)%N)*N+(x+dx)%N)*4;pixels[k:k+3]=[v]*3
tex=bpy.data.images.new('cat_paint_wear',width=N,height=N);tex.pixels=pixels
tex.filepath_raw=str(OUT/'textures/cat_surface.png');tex.file_format='PNG';tex.save();tex.pack()
def material(name,glow=False):
 m=bpy.data.materials.new(name);m.use_nodes=True;n=m.node_tree.nodes;l=m.node_tree.links
 p=n.get('Principled BSDF');p.inputs['Roughness'].default_value=.83;p.inputs['Metallic'].default_value=0
 vc=n.new('ShaderNodeVertexColor');vc.layer_name='Color'
 if glow:
  l.new(vc.outputs['Color'],p.inputs['Base Color']);p.inputs['Emission Color'].default_value=rgb('red');p.inputs['Emission Strength'].default_value=.20
 else:
  im=n.new('ShaderNodeTexImage');im.image=tex;im.interpolation='Closest'
  mix=n.new('ShaderNodeMixRGB');mix.blend_type='MULTIPLY';mix.inputs[0].default_value=1
  l.new(vc.outputs['Color'],mix.inputs[1]);l.new(im.outputs['Color'],mix.inputs[2]);l.new(mix.outputs[0],p.inputs['Base Color'])
 return m
MAT=material('Cat_matte_paint');GLOW=material('Cat_red_eyes',True)
parts=[]
def finish(ob,name,color,bone,bev=.0013,glow=False):
 ob.name=name
 if bev:
  bm=bmesh.new();bm.from_mesh(ob.data)
  bmesh.ops.bevel(bm,geom=list(bm.edges),offset=bev,segments=1,affect='EDGES',profile=.5)
  bm.to_mesh(ob.data);bm.free()
 ob.data.materials.append(GLOW if glow else MAT)
 a=ob.data.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='CORNER');col=rgb(color)
 for d in a.data:d.color=col
 uv=ob.data.uv_layers.new(name='UVMap')
 for poly in ob.data.polygons:
  norm=poly.normal;axis=max(range(3),key=lambda i:abs(norm[i]));axes=[i for i in range(3) if i!=axis]
  for li in poly.loop_indices:
   v=ob.data.vertices[ob.data.loops[li].vertex_index].co
   uv.data[li].uv=(v[axes[0]]*2.1+.37,v[axes[1]]*2.1+.19)
 vg=ob.vertex_groups.new(name=bone);vg.add(list(range(len(ob.data.vertices))),1,'REPLACE')
 ob['nativeBlocks']=True;parts.append(ob);return ob
FACES=[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]
def box(name,c,d,color,bone,bev=.0013,rot=None,glow=False):
 c=Vector(c);r=Matrix.Identity(3) if rot is None else rot.to_matrix()
 verts=[c+r@Vector((x*d[0]/2,y*d[1]/2,z*d[2]/2)) for x,y,z in [(-1,-1,-1),(1,-1,-1),(1,1,-1),(-1,1,-1),(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]]
 me=bpy.data.meshes.new(name);me.from_pydata(verts,[],FACES);me.update()
 ob=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(ob);return finish(ob,name,color,bone,bev,glow)
def prism(name,poly,axis,lo,hi,color,bone,bev=.001):
 axes=[a for a in range(3) if a!=axis];vs=[]
 for depth in (lo,hi):
  for u,v in poly:
   p=[0,0,0];p[axis]=depth;p[axes[0]]=u;p[axes[1]]=v;vs.append(p)
 n=len(poly);faces=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
 me=bpy.data.meshes.new(name);me.from_pydata(vs,[],faces);me.update()
 bm=bmesh.new();bm.from_mesh(me);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(me);bm.free()
 ob=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(ob);return finish(ob,name,color,bone,bev)
def octagon(u,v,w,h):
 a=w/2;b=h/2;k=min(w,h)*.17
 return [(u-a+k,v-b),(u+a-k,v-b),(u+a,v-b+k),(u+a,v+b-k),(u+a-k,v+b),(u-a+k,v+b),(u-a,v+b-k),(u-a,v-b+k)]
def segment(name,a,b,w,dep,color,bone):
 a=Vector(a);b=Vector(b);q=Vector((0,0,1)).rotation_difference((b-a).normalized())
 return box(name,(a+b)*.5,(w,dep,(b-a).length+.012),color,bone,rot=q)
# Rest rig joints. Front is Blender -Y; exported front is glTF +Z.
R={'root':Vector((0,0,0)),'pelvis':Vector((0,.23,.355)),'spine':Vector((0,.05,.365)),'chest':Vector((0,-.17,.375)),'neck':Vector((0,-.24,.468)),'head':Vector((0,-.282,.612)),'jaw':Vector((0,-.42,.478))}
parent={'root':None,'pelvis':'root','spine':'pelvis','chest':'spine','neck':'chest','head':'neck','jaw':'head'}
for s,sg in [('L',1),('R',-1)]:
 R['ear.'+s]=Vector((sg*.14,-.26,.744));parent['ear.'+s]='head'
 for prefix,pts in [('front',[(sg*.169,-.222,.394),(sg*.169,-.205,.223),(sg*.169,-.26,.050)]),('hind',[(sg*.17,.249,.367),(sg*.17,.302,.207),(sg*.17,.30,.049)])]:
  for k,p in zip(['upper','lower','paw'],pts):R[f'{prefix}_{k}.{s}']=Vector(p)
  parent[f'{prefix}_upper.{s}']='chest' if prefix=='front' else 'pelvis'
  parent[f'{prefix}_lower.{s}']=f'{prefix}_upper.{s}';parent[f'{prefix}_paw.{s}']=f'{prefix}_lower.{s}'
TAIL=[Vector(p) for p in [(0,.35,.39),(0,.416,.42),(0,.48,.463),(0,.534,.522),(0,.57,.593),(0,.59,.67),(0,.581,.748),(0,.551,.822),(0,.526,.895)]]
TAIL=[TAIL[0]+(p-TAIL[0])*1.2 for p in TAIL]
for i in range(8):
 nm=f'tail.{i+1:02d}';R[nm]=TAIL[i];parent[nm]='pelvis' if i==0 else f'tail.{i:02d}'
# Box-shaped torso, visible side plates and deliberate seams.
box('Cat_ribcage',(0,.025,.358),(.302,.386,.222),'sky','spine')
box('Cat_haunch_core',(0,.24,.342),(.314,.189,.205),'sky','pelvis')
for i,y in enumerate([-.057,.055,.167,.279]):
 box('Cat_back_tile_'+str(i),(0,y,.476),(.274,.107,.038),'light' if i%2==0 else 'sky','spine' if i<3 else 'pelvis')
 for s in [-1,1]:box('Cat_flank_'+str(i)+'_'+str(s),(s*.158,y,.373),(.024,.105,.164),'sky','spine' if i<3 else 'pelvis')
box('Cat_chest_vest',(0,-.171,.367),(.329,.172,.238),'dark','chest')
box('Cat_vest_front_plate',(0,-.264,.346),(.282,.025,.137),'dark','chest')
box('Cat_belly',(0,.01,.244),(.224,.31,.035),'teal','spine')
box('Cat_neck',(0,-.25,.458),(.169,.135,.10),'dark','neck')
prism('Cat_lime_bandana',[(-.146,.456),(.146,.456),(.095,.398),(0,.356),(-.105,.414)],1,-.290,-.272,'lime','chest')
box('Cat_lime_chest',(0,-.285,.291),(.151,.018,.052),'lime','chest')
box('Cat_lime_chest_seam',(0,-.296,.291),(.003,.002,.046),'limeDark','chest',0)
for s in [-1,1]:
 box('Cat_vest_side_'+str(s),(s*.171,-.146,.362),(.034,.14,.193),'edge','chest')
# Small stepped dorsal fins.
for i,y in enumerate([.02,.17,.285]):
 prism('Cat_back_fin_'+str(i),[(y-.04,.484),(y+.04,.484),(y+.084,.554),(y+.052,.554)],0,-.025,.025,'lime' if i==2 else 'teal','spine' if i<2 else 'pelvis')
# BCAT02 landmarks: lower square eyes, taller central forehead, broader splayed ears.
box('Cat_skull',(0,-.278,.614),(.33,.266,.232),'sky','head')
box('Cat_crown_center',(0,-.264,.744),(.139,.25,.130),'sky','head')
box('Cat_crown_top',(0,-.266,.812),(.139,.245,.009),'light','head')
for s in [-1,1]:
 box('Cat_crown_step_'+str(s),(s*.106,-.279,.722),(.075,.222,.075),'sky','head')
 box('Cat_temple_cap_'+str(s),(s*.152,-.283,.691),(.043,.209,.061),'sky','head')
 box('Cat_temples_'+str(s),(s*.17,-.296,.620),(.034,.191,.181),'sky','head')
 box('Cat_eye_socket_'+str(s),(s*.103,-.420,.592),(.097,.021,.084),'dark','head')
 eye_poly=[(s*x,z) for x,z in [(.064,.558),(.134,.558),(.134,.565),(.142,.565),(.142,.626),(.077,.626),(.064,.611)]]
 eye=prism('Cat_red_eye_'+str(s),eye_poly,1,-.439,-.430,'red','head',.0005)
 eye.data.materials.clear();eye.data.materials.append(GLOW)
 prism('Cat_inner_brow_slope_'+str(s),[(s*x,z) for x,z in [(.03,.638),(.078,.638),(.059,.614),(.03,.617)]],1,-.455,-.426,'sky','head',.0005)
 box('Cat_pupil_'+str(s),(s*.10,-.4405,.593),(.009,.005,.061),'pupil','head',.0002)
 box('Cat_brow_'+str(s),(s*.105,-.427,.666),(.137,.072,.061),'sky','head')
 box('Cat_cheek_'+str(s),(s*.113,-.429,.521),(.119,.057,.066),'sky','head')
 box('Cat_outer_eye_frame_'+str(s),(s*.163,-.43,.592),(.043,.055,.136),'sky','head')
 box('Cat_muzzle_'+str(s),(s*.047,-.469,.482),(.088,.081,.062),'light','jaw')
 box('Cat_lower_face_step_'+str(s),(s*.10,-.422,.474),(.070,.052,.030),'sky','head')
prism('Cat_nose_bridge',[(-.039,.635),(.039,.635),(.033,.526),(.024,.514),(-.024,.514),(-.033,.526)],1,-.468,-.388,'sky','head',.0012)
box('Cat_forehead_plate',(0,-.455,.674),(.096,.027,.077),'edge','head')
box('Cat_chin',(0,-.446,.444),(.102,.065,.024),'sky','jaw')
prism('Cat_nose',[(-.026,.508),(.026,.508),(.021,.488),(.007,.476),(-.007,.476),(-.021,.488)],1,-.516,-.505,'dark','jaw')
box('Cat_mouth_seam',(0,-.511,.469),(.003,.004,.011),'dark','jaw',0)
# Ears: enlarged triangular pinna with segmented charcoal rims.
for side,s in [('L',1),('R',-1)]:
 b='ear.'+side
 outer=[(s*x,z) for x,z in [(.041,.741),(.224,.726),(.239,.950),(.207,.957)]]
 prism('Cat_ear_outer_'+side,outer,1,-.292,-.201,'dark',b)
 inner=[(s*x,z) for x,z in [(.085,.759),(.200,.752),(.214,.910),(.201,.920)]]
 prism('Cat_ear_inner_'+side,inner,1,-.295,-.291,'inner',b,.0004)
 for j,(x,z) in enumerate([(.144,.787),(.187,.797),(.17,.831),(.201,.854),(.189,.890),(.203,.899)]):
  box('Cat_ear_hole_'+side+str(j),(s*x,-.297,z),(.004,.002,.008),'dark',b,.0002)
 for j,z in enumerate([.758,.796,.835]):
  box('Cat_ear_rim_step_'+side+str(j),(s*(.219+.025*(z-.75)),-.269,z),(.031,.054,.028),'edge' if j==0 else 'dark',b)
 lo,hi=sorted([s*.176,s*.246]);prism('Cat_headphone_'+side,octagon(-.279,.619,.180,.212),0,lo,hi,'dark','head',.002)
 lo,hi=sorted([s*.245,s*.254]);prism('Cat_headphone_bezel_'+side,octagon(-.279,.619,.149,.177),0,lo,hi,'edge','head')
 lo,hi=sorted([s*.254,s*.258]);prism('Cat_headphone_panel_'+side,octagon(-.279,.619,.125,.151),0,lo,hi,'dark','head',.0005)
 lo,hi=sorted([s*.2585,s*.2615])
 prism('Cat_paw_logo_'+side,[(-.319,.583),(-.239,.583),(-.279,.636)],0,lo,hi,'red','head',.0002)
 for j,(y,z) in enumerate([(-.319,.637),(-.278,.663),(-.239,.637)]):
  prism('Cat_paw_toe_'+side+str(j),[(y-.008,z),(y,z+.016),(y+.008,z),(y,z-.013)],0,lo,hi,'red','head',.0002)
for ob in parts:
 if any(key in ob.name for key in ['Cat_headphone','Cat_paw_logo','Cat_paw_toe']):
  for v in ob.data.vertices:v.co.z=.592+(v.co.z-.619)*.86;v.co.y=-.279+(v.co.y+.279)*.92
# Final matching pass: connect ear roots and compact the lower face.
for side,sg in [('L',1),('R',-1)]:
 box('Cat_ear_base_'+side,(sg*.196,-.259,.714),(.063,.088,.080),'dark','ear.'+side)
for ob in parts:
 if any(k in ob.name for k in ['Cat_muzzle','Cat_nose','Cat_mouth_seam','Cat_chin']) and ob.name!='Cat_nose_bridge':
  for v in ob.data.vertices:v.co.z+=.018
 if any(k in ob.name for k in ['Cat_red_eye','Cat_eye_socket','Cat_pupil','Cat_inner_brow_slope']):
  for v in ob.data.vertices:v.co.z+=.008
 if ob.name=='Cat_nose_bridge':
  for v in ob.data.vertices:v.co.z+=.012*max(0,min(1,(.635-v.co.z)/.105))
# Limbs are square segments with broad paws; chest plates follow upper limbs.
for side,s in [('L',1),('R',-1)]:
 for pre in ['front','hind']:
  a,b,c=[R[f'{pre}_{k}.{side}'] for k in ['upper','lower','paw']]
  width=.092 if pre=='front' else .114
  segment(f'Cat_{pre}_upper_{side}',a,b,width,.098,'cyan' if pre=='front' else 'sky',f'{pre}_upper.{side}')
  segment(f'Cat_{pre}_lower_{side}',b,c,.082,.083,'cyan',f'{pre}_lower.{side}')
  box(f'Cat_{pre}_paw_{side}',c+Vector((0,-.012,-.014)),(.113,.116,.072),'sky',f'{pre}_paw.{side}')
  for dx in [-.018,.019]:box(f'Cat_{pre}_toe_seam_{side}_{dx}',c+Vector((dx,-.071,-.014)),(.0018,.001,.052),'teal',f'{pre}_paw.{side}',0)
  cy=a.y+.007;cz=a.z-.031
  lo,hi=sorted([s*.184,s*.230])
  prism(f'Cat_{pre}_joint_plate_{side}',octagon(cy,cz,.162 if pre=='front' else .189,.181 if pre=='front' else .205),0,lo,hi,'light' if pre=='front' else 'sky',f'{pre}_upper.{side}')
  lo,hi=sorted([s*.231,s*.239])
  prism(f'Cat_{pre}_joint_inset_{side}',octagon(cy,cz,.069 if pre=='front' else .093,.078 if pre=='front' else .106),0,lo,hi,'purpleDark' if pre=='front' else 'shadow',f'{pre}_upper.{side}')
  if pre=='front':
   lo,hi=sorted([s*.24,s*.248]);prism('Cat_purple_joint_'+side,octagon(cy,cz,.055,.065),0,lo,hi,'purple',f'{pre}_upper.{side}')
for i in range(8):
 width=.058 if i<7 else .071
 segment('Cat_tail_cube_'+str(i),TAIL[i],TAIL[i+1],width,width,'cyan' if i<7 else 'light',f'tail.{i+1:02d}')
# Skeleton, one skin, two material groups.
ad=bpy.data.armatures.new('CatRig');arm=bpy.data.objects.new('CatRig',ad);bpy.context.collection.objects.link(arm)
bpy.context.view_layer.objects.active=arm;arm.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
for name,p in R.items():
 eb=ad.edit_bones.new(name);eb.head=p;eb.tail=p+Vector((0,0,.05))
 if parent[name]:eb.parent=ad.edit_bones[parent[name]]
bpy.ops.object.mode_set(mode='OBJECT')
for pb in arm.pose.bones:pb.rotation_mode='QUATERNION'
bpy.ops.object.select_all(action='DESELECT')
for ob in parts:ob.select_set(True)
bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();body=bpy.context.object;body.name='Cat_block_body'
mod=body.modifiers.new('Cat_skin','ARMATURE');mod.object=arm;body.parent=arm
body['nativeBlocks']=True;body['petId']='pet_block_cat';body['reference']='03_block_poses.png'
# Socket coordinates local to head bone, explicit extras used by the preview.
arm['eyeSockets']={s:list(arm.data.bones['head'].matrix_local.inverted()@Vector((v,-.444,.600))) for s,v in [('L',.103),('R',-.103)]}
arm['petId']='pet_block_cat'
rest={b.name:b.matrix_local.copy() for b in arm.data.bones}
I=Quaternion((1,0,0,0))
def deformation(name,pos,q=I):return Matrix.Translation(pos)@q.to_matrix().to_4x4()@Matrix.Translation(-R[name])
def ik(a,c,l1,l2,bend=1):
 d=c-a;dist=max(.00001,d.length);direction=d/dist
 dist=min(dist,l1+l2-.00001);along=(l1*l1-l2*l2+dist*dist)/(2*dist)
 perp=Vector((0,-direction.z,direction.y))*bend
 return a+direction*along+perp*math.sqrt(max(0,l1*l1-along*along))
def aim(a,b,c,d):return (b-a).normalized().rotation_difference((d-c).normalized())
def smooth01(t):
 t=max(0,min(1,t));return t*t*(3-2*t)
def pose(clip,t):
 sit=1.0 if clip in ('idle_sit','idle_look') else 1-smooth01(t) if clip=='stand_up' else smooth01(t) if clip=='sit_down' else 0.0
 transition=clip in ('stand_up','sit_down');phase=TAU*t;bob=.004*math.cos(phase*2) if clip=='walk' else 0 if transition else .0015*math.sin(phase)
 pelvis=R['pelvis']+Vector((0,-.05*sit,-.182*sit+bob))
 chest=R['chest']+Vector((0,.025*sit,bob))
 pitch=math.atan2(pelvis.z-chest.z,pelvis.y-chest.y)-math.atan2(R['pelvis'].z-R['chest'].z,R['pelvis'].y-R['chest'].y)
 qbody=Quaternion((1,0,0),pitch);spine=chest.lerp(pelvis,.52)
 qhead=Quaternion((0,0,1),.22*math.sin(phase)*math.sin(math.pi*t)**2 if clip=='idle_look' else .012*math.sin(phase))
 recoil=max(0,1-abs(t-.50)/.12)*.025 if clip=='attack_laser' else 0
 qhead=qhead@Quaternion((1,0,0),recoil)
 head=R['head']+Vector((0,.025*sit,bob))
 mats={'root':Matrix.Identity(4),'pelvis':deformation('pelvis',pelvis,qbody),'spine':deformation('spine',spine,qbody),'chest':deformation('chest',chest),'head':deformation('head',head,qhead)}
 mats['neck']=deformation('neck',R['neck']+(head-R['head']),Quaternion((1,0,0),pitch*.3));mats['jaw']=mats['head']
 for side,s in [('L',1),('R',-1)]:
  ear='ear.'+side;ep=mats['head']@R[ear]
  eq=qhead@Quaternion((0,1,0),s*.02*math.sin(phase+s*.7))
  mats[ear]=deformation(ear,ep,eq)
  for pre in ['front','hind']:
   names=[f'{pre}_{k}.{side}' for k in ['upper','lower','paw']];a0,b0,c0=[R[n] for n in names]
   a=(chest+Vector((s*.169,-.052,.019))) if pre=='front' else pelvis+Vector((s*.17,.019,.012))
   c=c0.copy()
   if pre=='hind':
    c.y-=.15*sit
    if transition:
     ft=max(0,min(1,(t-(.08 if side=='L' else .36))/.42))
     fs=1-smooth01(ft) if clip=='stand_up' else smooth01(ft)
     c.y=c0.y-.15*fs;c.z+=.024*math.sin(math.pi*ft)
   if clip=='walk':
    ph=phase+(0 if side=='L' else math.pi)+(math.pi*.5 if pre=='hind' else 0)
    c.y+=.07*math.cos(ph);c.z+=.045*max(0,math.sin(ph))
   b=ik(a,c,(b0-a0).length,(c0-b0).length,1 if pre=='front' else -1)
   mats[names[0]]=deformation(names[0],a,aim(a0,b0,a,b));mats[names[1]]=deformation(names[1],b,aim(b0,c0,b,c));mats[names[2]]=deformation(names[2],c)
 tailpts=[pelvis+Vector((0,.12,.035-.058*sit))]
 sitdirs=[(-.06,.02,-.07),(-.082,0,-.026),(-.07,-.03,0),(-.066,-.04,0),(0,-.08,0),(-.005,-.08,0),(.012,-.08,0),(.036,-.07,0)]
 for i in range(8):
  d=(TAIL[i+1]-TAIL[i]).normalized().lerp(Vector(sitdirs[i]).normalized(),sit)
  d.normalize();d=Quaternion((0,0,1),.045*math.sin(phase-i*.38)*(i/7)**2)@d
  tailpts.append(tailpts[-1]+d*(TAIL[i+1]-TAIL[i]).length)
  nm=f'tail.{i+1:02d}';mats[nm]=deformation(nm,tailpts[i],aim(TAIL[i],TAIL[i+1],tailpts[i],tailpts[i+1]))
 for nm in R:
  pb=arm.pose.bones[nm];desired=mats[nm]@rest[nm];pn=parent[nm]
  basis=rest[nm].inverted()@desired if pn is None else rest[nm].inverted()@rest[pn]@(mats[pn]@rest[pn]).inverted()@desired
  loc,q,sc=basis.decompose();pb.location=loc;pb.rotation_quaternion=q;pb.scale=sc
 return mats
clips={'walk':1.0,'idle_sit':4.0,'idle_look':5.0,'attack_laser':.70,'stand_up':1.0,'sit_down':1.0}
for nm,seconds in clips.items():
 arm.animation_data_create();act=bpy.data.actions.new(nm);arm.animation_data.action=act
 frames=round(seconds*30)
 for f in range(frames+1):
  bpy.context.scene.frame_set(f+1);pose(nm,f/frames)
  for pb in arm.pose.bones:
   pb.keyframe_insert('location',frame=f+1);pb.keyframe_insert('rotation_quaternion',frame=f+1);pb.keyframe_insert('scale',frame=f+1)
 act.use_fake_user=True;tr=arm.animation_data.nla_tracks.new();tr.name=nm;strip=tr.strips.new(nm,1,act);strip.action_frame_end=frames+1;strip.extrapolation='NOTHING';tr.mute=True
 arm.animation_data.action=None
 print('CAT_CLIP',nm,frames,flush=True)
for pb in arm.pose.bones:pb.location=(0,0,0);pb.rotation_quaternion=(1,0,0,0);pb.scale=(1,1,1)
for tr in arm.animation_data.nla_tracks:tr.mute=False
bpy.context.scene.frame_set(0)
bpy.ops.object.select_all(action='DESELECT');arm.select_set(True);body.select_set(True);bpy.context.view_layer.objects.active=arm
bpy.ops.export_scene.gltf(filepath=str(OUT/'block_cat.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_force_sampling=True,export_anim_slide_to_zero=True,export_extras=True,export_apply=False,export_vertex_color='NAME',export_vertex_color_name='Color')
metrics={'id':'pet_block_cat','revision':'BCAT02','reference':'03_block_poses.png','triangles':sum(len(p.vertices)-2 for p in body.data.polygons),'bones':len(R),'materials':2,'bytes':(OUT/'block_cat.glb').stat().st_size,'animations':clips,'eye_sockets_head_local':{k:list(v) for k,v in arm['eyeSockets'].items()},'laser':{'start':.18,'end':.30,'range':2.2,'cooldown':3}}
(OUT/'manifest.json').write_text(json.dumps(metrics,indent=2),encoding='utf8')
# Save editable project, and render a proof plate on request.
sc=bpy.context.scene;sc.render.engine='CYCLES';sc.cycles.samples=24;sc.cycles.use_denoising=True;sc.cycles.max_bounces=4
sc.render.resolution_x=960;sc.render.resolution_y=960;sc.render.resolution_percentage=100
sc.view_settings.view_transform='Standard';sc.world.use_nodes=True
sc.world.node_tree.nodes['Background'].inputs[0].default_value=(.18,.22,.28,1);sc.world.node_tree.nodes['Background'].inputs[1].default_value=.45
for name,pos,energy,size in [('key',(-2,-3,4),180,3),('fill',(3,-1,2),75,3),('rim',(1,3,3),140,2)]:
 ld=bpy.data.lights.new('Cat_'+name,'AREA');ld.energy=energy;ld.shape='DISK';ld.size=size
 ob=bpy.data.objects.new('Cat_'+name,ld);bpy.context.collection.objects.link(ob);ob.location=pos;ob.rotation_euler=(Vector((0,0,.4))-ob.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.001));floor=bpy.context.object;floor.name='Cat_review_floor'
fm=bpy.data.materials.new('Cat_floor');fm.diffuse_color=(.035,.055,.073,1);fm.use_nodes=True;fm.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(.018,.029,.042,1);fm.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=1;floor.data.materials.append(fm)
camd=bpy.data.cameras.new('Cat_review');cam=bpy.data.objects.new('Cat_review',camd);bpy.context.collection.objects.link(cam);sc.camera=cam;camd.type='ORTHO';camd.ortho_scale=1.23
cam.location=(2,-3,1.65);cam.rotation_euler=(Vector((0,0,.43))-cam.location).to_track_quat('-Z','Y').to_euler()
for tr in arm.animation_data.nla_tracks:tr.mute=True
arm.animation_data.action=None;pose('idle_sit',0);bpy.context.view_layer.update()
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'source/block_cat.blend'))
if '--render' in sys.argv or '--render-sit' in sys.argv:
 for nm,t in [('idle_sit',0),('walk',.15),('attack_laser',0)]:
  if '--render-sit' in sys.argv and nm!='idle_sit':continue
  pose(nm,t);bpy.context.view_layer.update();sc.render.filepath=str(ART/(nm+'.png'));bpy.ops.render.render(write_still=True)
print('CAT_COMPLETE',json.dumps(metrics),flush=True)