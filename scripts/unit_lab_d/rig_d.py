"""D-specific skeleton, skin weights and nine clips. Codex, 2026-09-26.
Legacy gait/timing is reused as read-only snapshots; hand targets fit D proportions.
"""
import bpy,math,json
from pathlib import Path
from mathutils import Vector,Matrix
S=math.sin;C=math.cos;TAU=math.tau;HIDE=.001
exec(Path(__file__).with_name('legacy_gait.py').read_text(encoding='utf8'))
exec(Path(__file__).with_name('legacy_actions.py').read_text(encoding='utf8'))
def d_idle_pose(t):
 # Six seconds: two gentle breaths and one relaxed weight shift, fully periodic.
 ph=TAU*t;b=.5-.5*C(2*ph);sway=S(ph);lag=S(ph-.32)
 return {
  'root':(0,0,0,0),'hips':(0,0,.60*sway,0),
  'spine':(-.65*b,0,-.45*sway),
  'chest':(-1.25*b,.65*S(ph+.2),.40*sway),
  'head':(1.7*b,1.2*S(ph-.18),-.65*S(ph+.14)),
  'pack':(.7*b,0,.3*lag),
  'upperarm.L':(1.0*b+.55*lag,0,5+.9*b+.35*sway),
  'upperarm.R':(1.0*b-.55*lag,0,-5-.9*b+.35*sway),
  'forearm.L':(-6-1.0*b,0,.35*lag),'forearm.R':(-6-1.0*b,0,.35*lag),
  'thigh.L':(0,0,1),'thigh.R':(0,0,-1),
  'shin.L':(0,0,0),'shin.R':(0,0,0),'foot.L':(0,0,0),'foot.R':(0,0,0)}


def gesture_envelope(t,a,b,c,d):return smoothstep(a,b,t)*(1-smoothstep(c,d,t))
def d_social_pose(kind,t):
 p=d_idle_pose(0);g=gesture_envelope(t,.08,.28,.73,.98)
 if kind=='bow':
  g=gesture_envelope(t,.08,.33,.47,.91)
  p.update({'spine':(7*g,0,0),'chest':(13*g,0,0),'head':(10*g,0,0),
   'upperarm.L':(-3*g,0,5),'upperarm.R':(-3*g,0,-5)})
 elif kind=='squint':
  p['head']=(2*g,0,1.8*g);p['chest']=(-1.2*g,0,0)
 elif kind=='wave':
  p['head']=(0,-3*g,3*g);p['chest']=(0,-2*g,-1*g)
 elif kind=='victory':
  crouch=gesture_envelope(t,.02,.12,.15,.21)+.75*gesture_envelope(t,.37,.42,.44,.49)+.65*gesture_envelope(t,.69,.75,.79,.90)
  p['chest']=(7*crouch,0,0);p['head']=(-4*g,0,0)
  for side,sign in [('L',1),('R',-1)]:
   p['thigh.'+side]=(24*crouch,0,sign);p['shin.'+side]=(-46*crouch,0,0);p['foot.'+side]=(22*crouch,0,0)
 return p

def victory_height(t):
 for a,b,h in [(.18,.40,.135),(.46,.72,.175)]:
  if a<t<b:
   u=(t-a)/(b-a);return 4*h*u*(1-u)
 return 0

U=.0032
PROFILES={'idle':.55,'walk':1.15,'run':2.1,'shoot':.65,'shoot2':1.15,'throw':1.6,'walk_shoot':1.15,'walk_throw':1.65,'walk_gun':1.1}
CLIPS=[('idle',180,d_idle_pose),('walk',30,walk_pose),('run',22,run_pose),('shoot',8,shoot_pose),('shoot2',15,shoot2_pose),('throw',33,throw_pose),('walk_shoot',30,walk_shoot_pose),('walk_throw',33,walk_throw_pose),('walk_gun',30,walk_gun_pose)]

PROFILES.update(draw=.9,holster=.9,draw_launcher=1.1,holster_launcher=1.1,blink=.35,squint=.4,bow=.7,wave=1.1,victory=2.2)
CLIPS.extend([(name,36,idle_pose) for name in ('draw','holster','draw_launcher','holster_launcher')])
CLIPS.extend([(name,frames,lambda t,k=name:d_social_pose(k,t)) for name,frames in [('blink',54),('squint',72),('bow',84),('wave',96),('victory',96)]])

def xyz(x,d,y):return ((x-248)*U,d*U,(650-y)*U)
def smoothstep(a,b,x):
 t=max(0,min(1,(x-a)/(b-a)));return t*t*(3-2*t)

def skeleton(hair_parts):
 b={
 'root':((0,0,0),(0,0,.15),None),
 'hips':((0,0,.46),(0,0,.57),'root'),
 'spine':((0,0,.57),(0,0,.69),'hips'),
 'chest':((0,0,.69),(0,0,.84),'spine'),
 'head':((0,0,.86),(0,0,1.43),'chest'),
 'pack':((0,.12,.69),(0,.12,.84),'chest')}
 for side,sign in [('L',1),('R',-1)]:
  b['upperarm.'+side]=((sign*.204,0,.735),(sign*.265,0,.568),'chest')
  b['forearm.'+side]=((sign*.265,0,.568),(sign*.317,-.032,.406),'upperarm.'+side)
  b['thigh.'+side]=((sign*.137,0,.46),(sign*.137,0,.238),'hips')
  b['shin.'+side]=((sign*.137,0,.238),(sign*.137,.01,.103),'thigh.'+side)
  b['foot.'+side]=((sign*.137,.01,.103),(sign*.137,-.13,.054),'shin.'+side)
 for name in ('gun','gunL','rifle','bomb'):
  b[name]=((-.317,-.032,.406),(-.317,-.032,.306),'forearm.R' if name=='bomb' else 'root')
 for i in range(3):b['sling_'+str(i)]=((0,0,0),(0,1,0),'root')
 hair={}
 for name in hair_parts:
  part=name.removeprefix('D_');bone='tip_'+part
  if part=='hair_cap':continue
  if part.startswith('hair_back_'):
   j=int(part.rsplit('_',1)[1]);a=math.radians(-83+j*16.6)
   h=xyz(248+130*S(a),36+107*C(a),352);t=xyz(248+139*S(a),34+114*C(a),448)
   start,end=345,445
  elif part.startswith('hair_bang_'):
   k=int(part[-1]);x=[246,175,301][k];h=xyz(x,-85,238);t=xyz(x,-91,[307,282,269][k]);start,end=240,[307,282,269][k]
  elif part=='hair_sprout':
   h=xyz(221,31,110);t=xyz(248,31,62);start,end=105,62
  else:
   sign=int(part.rsplit('_',1)[1]);offset=105 if 'side' in part or 'inner' in part else 143
   y0=263 if 'wisp' in part else 330;y1=288 if 'wisp' in part else 435
   h=xyz(248+sign*offset,-45 if 'side' in part else 18,y0);t=xyz(248+sign*(offset+4),-42 if 'side' in part else 20,y1)
   start,end=y0,y1
  b[bone]=(h,t,'head');hair[name]=(bone,start,end)
 ad=bpy.data.armatures.new('D_Rig');arm=bpy.data.objects.new('D_Armature',ad);bpy.context.collection.objects.link(arm)
 bpy.context.view_layer.objects.active=arm;arm.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
 for name,(h,t,p) in b.items():
  eb=ad.edit_bones.new(name);eb.head=h;eb.tail=t;eb.roll=0
  if p:eb.parent=ad.edit_bones[p]
 bpy.ops.object.mode_set(mode='OBJECT')
 for pb in arm.pose.bones:pb.rotation_mode='XYZ'
 for name in hair:
  arm.data.bones[hair[name][0]]['hairTip']=True
 return arm,hair

def region_weights(name,p,hair):
 x,y,z=p;side='L' if x>=0 else 'R'
 if name in hair:
  bone,a,b=hair[name];py=650-z/U
  w=smoothstep(a,b,py) if b>a else smoothstep(-a,-b,-py)
  return {'head':1-w,bone:w}
 if name.startswith('D_hair') or name in ('D_head_clean','D_ears','D_pin','D_brooch_detail'):return {'head':1}
 if name=='D_face_detail' and z>.82:return {'head':1}
 if name=='D_expression_marks':return {'head':1}
 if name=='D_neck_bridge':
  w=smoothstep(.84,.90,z);return {'chest':1-w,'head':w}
 if name.startswith('D_mantle_'):
  w=1-smoothstep(.54,.61,z);return {'upperarm.'+side:1-w,'forearm.'+side:w}
 if name.startswith('D_arm'):
  w=1-smoothstep(.54,.61,z);return {'upperarm.'+side:1-w,'forearm.'+side:w}
 if name.startswith('D_hand'):return {'forearm.'+side:1}
 if name.startswith('D_leg'):
  w=1-smoothstep(.22,.27,z);return {'thigh.'+side:1-w,'shin.'+side:w}
 if name.startswith('D_shorts') or (name=='D_face_detail' and z<.44):return {'thigh.'+side:1}
 if name.startswith('D_boot') or name.startswith('D_sock'):
  w=smoothstep(.12,.17,z);return {'foot.'+side:1-w,'shin.'+side:w}
 if name=='D_costume_details':
  if z<.18:return {'foot.'+side:1}
  if z<.44:return {'thigh.'+side:1}
  if z>.72:return {'upperarm.'+side:1}
 if name in ('D_hips','D_belt','D_buckle','D_pouch'):return {'hips':1}
 w=smoothstep(.49,.73,z)
 return {'hips':1-w,'chest':w}

def bind(ob,arm,weights):
 ob.parent=arm
 groups={}
 for v in ob.data.vertices:
  ws=weights(v.co)
  for bone,w in ws.items():
   if w<1e-6:continue
   if bone not in groups:groups[bone]=ob.vertex_groups.new(name=bone)
   groups[bone].add([v.index],w,'REPLACE')
 mod=ob.modifiers.new('D_skin','ARMATURE');mod.object=arm
 ob['nativeBlocks']=True

PROP_M4={}
def props(arm,make_mesh):
 import importlib.util
 spec=importlib.util.spec_from_file_location('weapons_d',str(Path(__file__).with_name('weapons_d.py')));module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
 result=[]
 for name in ('gun','gunL','rifle','bomb'):
  bone=arm.data.bones[name];h=bone.head_local
  y=(bone.tail_local-h).normalized();z=Vector((0,-1,0));x=y.cross(z).normalized()
  M=Matrix((x,y,z)).transposed().to_4x4();M.translation=h;PROP_M4[name]=M
  ob=module.make_weapon(name,M,make_mesh);bind(ob,arm,lambda p,n=name:{n:1});ob['prop']=name;result.append(ob)
 # A narrow carrying sling makes the rear mount and equip arc visibly attached.
 for i in range(3):
  name='sling_'+str(i);v=[(-.010,0,-.004),(.010,0,-.004),(.010,1,-.004),(-.010,1,-.004),(-.010,0,.004),(.010,0,.004),(.010,1,.004),(-.010,1,.004)]
  f=[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]
  ob=make_mesh('D_prop_'+name,v,f,[(152,114,65)]*6);bind(ob,arm,lambda p,n=name:{n:1});result.append(ob)
 return result


def set_body(arm,pose):
 for pb in arm.pose.bones:
  pb.rotation_euler=(0,0,0);pb.location=(0,0,0);pb.scale=(1,1,1)
 for name in ('gun','gunL','rifle','bomb','sling_0','sling_1','sling_2'):arm.pose.bones[name].scale=(HIDE,)*3
 for name,v in pose.items():
  if name not in arm.pose.bones:continue
  rx,ry,rz=v[:3]
  if name.startswith(('upperarm.','thigh.','shin.','foot.')):rx,rz=-rx,-rz
  elif name.startswith('forearm.'):rz=-rz
  pb=arm.pose.bones[name];pb.rotation_euler=tuple(math.radians(a) for a in (rx,ry,rz))
  if len(v)>3:pb.location.y=v[3]*.60
  if len(v)>4:pb.scale=(v[4],)*3
 bpy.context.view_layer.update()

def solve_arm(arm,side,target,pole,previous):
 return solve_chain(arm,'upperarm.'+side,'forearm.'+side,target,pole,previous)

def solve_chain(arm,upper,lower,target,pole,previous):
 ub=arm.pose.bones[upper];fb=arm.pose.bones[lower];sh=ub.head.copy()
 l1=ub.length;l2=fb.length;delta=Vector(target)-sh;distance=max(.02,min(delta.length,l1+l2-.001));axis=delta.normalized()
 target=sh+axis*distance;pole=Vector(pole);bend=(pole-axis*axis.dot(pole)).normalized()
 along=(l1*l1-l2*l2+distance*distance)/(2*distance);height=math.sqrt(max(0,l1*l1-along*along))
 elbow=sh+axis*along+bend*height
 for pb,a,b in [(ub,sh,elbow),(fb,elbow,target)]:
  rest=pb.bone.matrix_local.to_3x3();ry=rest.col[1].normalized();direction=(b-a).normalized()
  rot=ry.rotation_difference(direction).to_matrix()@rest;mat=rot.to_4x4();mat.translation=a
  local=arm.convert_space(pose_bone=pb,matrix=mat,from_space='POSE',to_space='LOCAL')
  e=local.to_euler('XYZ',previous[pb.name]) if pb.name in previous else local.to_euler('XYZ')
  previous[pb.name]=e.copy();pb.rotation_euler=e;bpy.context.view_layer.update()
 return (fb.tail-Vector(target)).length

def idle_detail(arm,t,previous):
 ph=TAU*t;b=.5-.5*C(2*ph)
 # Slight hips translation with both ankles held fixed: no whole-body pogo motion.
 arm.pose.bones['hips'].location.x=.009*S(ph)
 arm.pose.bones['chest'].location.y=.004*b
 bpy.context.view_layer.update()
 for side in ('L','R'):
  foot=arm.pose.bones['foot.'+side];target=foot.bone.head_local.copy();target.z-=.001
  solve_chain(arm,'thigh.'+side,'shin.'+side,target,(0,-1,0),previous)
  mat=foot.bone.matrix_local.copy();mat.translation=target
  local=arm.convert_space(pose_bone=foot,matrix=mat,from_space='POSE',to_space='LOCAL')
  foot.location,q,foot.scale=local.decompose();foot.rotation_euler=q.to_euler('XYZ')
  bpy.context.view_layer.update()


def aim_prop(arm,name,direction):
 pb=arm.pose.bones[name];localframe=pb.bone.matrix_local.inverted()@PROP_M4[name]
 y=Vector(direction).normalized();up=Vector((0,0,1));z=(up-y*up.dot(y)).normalized();x=y.cross(z)
 rot=Matrix((x,y,z)).transposed()@localframe.to_3x3().inverted();mat=rot.to_4x4();mat.translation=pb.head
 pb.rotation_euler=arm.convert_space(pose_bone=pb,matrix=mat,from_space='POSE',to_space='LOCAL').to_euler('XYZ');bpy.context.view_layer.update()

def grip(arm,name):
 pb=arm.pose.bones[name];return pb.matrix@pb.bone.matrix_local.inverted()@PROP_M4[name]@Vector((0,.05,-.035))

def local_point(arm,bone,p):
 pb=arm.pose.bones[bone];return pb.matrix@pb.bone.matrix_local.inverted()@Vector(p)

def weapon_matrix(position,direction,up=(0,0,1)):
 y=Vector(direction).normalized();up=Vector(up);z=(up-y*up.dot(y)).normalized();x=y.cross(z)
 mat=Matrix((x,y,z)).transposed().to_4x4();mat.translation=Vector(position);return mat

def place_weapon(arm,name,mat):
 pb=arm.pose.bones[name];localframe=pb.bone.matrix_local.inverted()@PROP_M4[name]
 target=mat@localframe.inverted()
 local=arm.convert_space(pose_bone=pb,matrix=target,from_space='POSE',to_space='LOCAL')
 pb.location,quat,pb.scale=local.decompose();pb.rotation_euler=quat.to_euler('XYZ');bpy.context.view_layer.update()

def grip_matrix(arm,name):
 pb=arm.pose.bones[name];return pb.matrix@pb.bone.matrix_local.inverted()@PROP_M4[name]

def blend_matrix(a,b,k):
 q=a.to_quaternion().slerp(b.to_quaternion(),k);m=q.to_matrix().to_4x4();m.translation=a.translation.lerp(b.translation,k);return m

def weapon_pose(arm,name,t,previous):
 # D07: lower diagonal rack sits behind the upper back instead of the head center.
 mounted=arm.pose.bones['chest'].matrix@arm.pose.bones['chest'].bone.matrix_local.inverted()@weapon_matrix((-.05,.36,.65),(.67,.36,.65),(0,1,0))
 place_weapon(arm,'rifle',mounted)
 for side,prop,sign in [('R','gun',-1),('L','gunL',1)]:
  pos=local_point(arm,'hips',(sign*.277,-.012,.445));place_weapon(arm,prop,weapon_matrix(pos,(0,0,-1),(0,-1,0)))
 shift=arm.pose.bones['chest'].head-arm.data.bones['chest'].head_local
 error=0
 if name in ('shoot','walk_shoot','walk_gun','draw','holster'):
  transition=name in ('draw','holster');u=t if name=='draw' else 1-t if name=='holster' else 1
  lift=smoothstep(.18,.88,u)
  for side,prop,sign in [('R','gun',-1),('L','gunL',1)]:
   recoil=max(0,S(TAU*t*(2 if name=='shoot' else 4)+(0 if sign<0 else math.pi)))**5 if name in ('shoot','walk_shoot') else 0
   holster=local_point(arm,'hips',(sign*.277,-.012,.445))
   aim=Vector((sign*.225,-.26+.018*recoil,.73+.012*recoil))+shift
   if name=='walk_gun':aim=Vector((sign*.27,-.13,.52))+shift
   start=local_point(arm,'chest',(sign*.317,-.032,.406))
   target=start.lerp(holster,smoothstep(0,.18,u)) if transition and u<.18 else holster.lerp(aim,lift) if transition else aim
   error=max(error,solve_arm(arm,side,target,(sign*.8,.25,-.8),previous))
   wrist=arm.pose.bones['forearm.'+side].tail
   down=weapon_matrix(holster,(0,0,-1),(0,-1,0));aimmat=weapon_matrix(wrist,(0,-1,.02+.14*recoil))
   mat=blend_matrix(down,aimmat,lift) if transition else aimmat
   if not transition or u>=.18:mat.translation=wrist
   place_weapon(arm,prop,mat)
 elif name in ('shoot2','draw_launcher','holster_launcher'):
  transition=name!='shoot2';u=t if name=='draw_launcher' else 1-t if name=='holster_launcher' else 1
  kick=max(0,1-abs(t-.09)/.11) if name=='shoot2' else 0
  # Short body stays ahead of the face; second grip is offset toward the left palm.
  target=Vector((-.155,-.21+.025*kick,.66+.027*kick))+shift
  if transition:
   # Hand traces the right shoulder edge while the back-mounted weapon swings out.
   target=catmull([(0,tuple(local_point(arm,'chest',(-.317,-.032,.406)))),(.3,(-.43,.09,.75)),(.5,(-.44,-.03,.80)),(.8,tuple(target)),(1,tuple(target))],u)
  error=max(error,solve_arm(arm,'R',target,(-.8,.2,-.8),previous))
  wrist=arm.pose.bones['forearm.R'].tail.copy()
  held=weapon_matrix(wrist,(0,-1,.16*kick))
  # The launcher is grasped at the side before completing the forward swing.
  if transition:
   outer=weapon_matrix((-.72,.60,.64),(0,0,1),(-1,0,0))
   forward=weapon_matrix((-.56,-.35,.63),(0,-1,.10))
   waypoints=[(.20,mounted),(.46,outer),(.69,forward),(.91,held)]
   mat=held
   if u<=.20:mat=mounted
   else:
    for (a,ma),(b,mb) in zip(waypoints,waypoints[1:]):
     if u<=b:mat=blend_matrix(ma,mb,smoothstep(a,b,u));break
  else:mat=held
  place_weapon(arm,'rifle',mat)
  left=mat@Vector((.12,.024,.012))
  if transition:left=local_point(arm,'chest',(.317,-.032,.406)).lerp(left,smoothstep(.48,.88,u))
  error=max(error,solve_arm(arm,'L',left,(.7,.1,-.8),previous))
 elif name in ('throw','walk_throw'):
  keys=[(0,(-.317,-.04,.406)),(.11,(-.40,.10,.52)),(.19,(-.47,.08,.71)),(.28,(-.47,.02,.85)),(.36,(-.43,-.01,.95)),(.44,(-.10,-.31,.90)),(.53,(.025,-.25,.59)),(.82,(-.02,-.25,.54)),(1,(-.317,-.04,.406))]
  error=max(error,solve_arm(arm,'R',Vector(catmull(keys,t))+shift,(-.5,.4,-.7),previous))
  error=max(error,solve_arm(arm,'L',Vector((.32,-.14,.59+.08*S(t*math.pi)))+shift,(.8,.3,-.8),previous))
 # The hand catches the sling before the short launcher swings around the hair.
 mount=grip_matrix(arm,'rifle').translation
 shoulder=local_point(arm,'chest',(-.205,.075,.765))
 elbow=local_point(arm,'chest',(-.35,.23,.71))
 mid=mount+Vector((-.035,-.15,-.10))
 if name in ('draw_launcher','holster_launcher'):
  u=t if name=='draw_launcher' else 1-t
  if .10<u<.91:elbow=arm.pose.bones['forearm.R'].tail.copy()
 pts=[shoulder,elbow,mid,mount]
 for i,(a,b) in enumerate(zip(pts,pts[1:])):
  pb=arm.pose.bones['sling_'+str(i)];direction=b-a
  rot=Vector((0,1,0)).rotation_difference(direction.normalized()).to_matrix().to_4x4();rot.translation=a
  local=arm.convert_space(pose_bone=pb,matrix=rot,from_space='POSE',to_space='LOCAL')
  pb.location,q,_=local.decompose();pb.rotation_euler=q.to_euler('XYZ');pb.scale=(1,direction.length,1)
 return error


def rest_pose(arm):
 if arm.animation_data:
  arm.animation_data.action=None
  for tr in arm.animation_data.nla_tracks:tr.mute=True
 set_body(arm,{})
 bpy.context.scene.frame_set(0);bpy.context.view_layer.update()

def build_rig(objects,model,make_mesh,expressions=None,faces=()):
 bpy.context.scene.render.fps=30
 hairparts=[o.name for o in objects if o.name.startswith('D_hair')]
 arm,hair=skeleton(hairparts);arm.parent=model
 for ob in objects:bind(ob,arm,lambda p,n=ob.name:region_weights(n,p,hair))
 objects.extend(props(arm,make_mesh))
 rig_results={};names=[]
 for name,frames,fn in CLIPS:
  rest_pose(arm);act=bpy.data.actions.new(name);arm.animation_data_create();arm.animation_data.action=act
  if expressions:expressions.begin_expression_clip(faces,name)
  previous={};max_error=0;min_foot=1;max_foot=-1
  for f in range(frames+1):
   t=f/frames;bpy.context.scene.frame_set(f+1);set_body(arm,fn(t))
   if name=='idle':idle_detail(arm,t,previous)
   elif name in ('blink','squint','bow','wave'):idle_detail(arm,0,previous)
   if expressions:expressions.key_expression(faces,name,t,frames,f)
   # Plant the support foot; running allows a small airborne interval.
   lows=[]
   for side,sgn in [('L',1),('R',-1)]:
    pb=arm.pose.bones['foot.'+side];mat=pb.matrix@pb.bone.matrix_local.inverted()
    for yy in (-.165,.092):
     for xx in (-.075,.075):lows.append((mat@Vector((sgn*.137+xx,yy,0))).z)
   lift=.025*max(0,S(TAU*t)**2-.2) if name=='run' else .001+victory_height(t) if name=='victory' else .001
   arm.pose.bones['root'].location.y+=lift-min(lows);bpy.context.view_layer.update()
   min_foot=min(min_foot,lift);max_foot=max(max_foot,lift)
   max_error=max(max_error,weapon_pose(arm,name,t,previous))
   if name in ('wave','victory'):
    g=gesture_envelope(t,.06,.27,.75,.98)
    for side,sign in ([('R',-1)] if name=='wave' else [('R',-1),('L',1)]):
     rest=local_point(arm,'chest',(sign*.317,-.032,.406))
     pulse=S(TAU*3*(t-.27)/.48)*gesture_envelope(t,.26,.32,.67,.74) if name=='wave' else 0
     target=local_point(arm,'chest',(sign*(.46+.035*pulse),-.13,.90+.025*pulse))
     max_error=max(max_error,solve_arm(arm,side,rest.lerp(target,g),(sign*.9,.3,-.5),previous))
   for j,(mesh,(bone,a,b)) in enumerate(hair.items()):
    phase=j*.73;cycles=2 if name in ('walk','run','walk_gun','walk_shoot','walk_throw','shoot') else 1
    wave=(S(TAU*t*cycles+phase)+.25*S(TAU*t*cycles*2+phase*.5))/1.25
    if name in ('throw','shoot2'):wave*=S(math.pi*t)**2
    if name in ('blink','squint','bow','wave','victory'):wave*=S(math.pi*t)**2
    amp=math.radians(PROFILES[name]);amp*=.7 if 'bang' in bone else 1.0
    pb=arm.pose.bones[bone];pb.rotation_euler=(amp*wave,amp*.25*S(TAU*t+phase),amp*.38*S(TAU*t*cycles+phase+1.3))
   for pb in arm.pose.bones:
    pb.keyframe_insert('rotation_euler',frame=f+1);pb.keyframe_insert('location',frame=f+1);pb.keyframe_insert('scale',frame=f+1)
  if expressions:expressions.end_expression_clip(faces,name,frames)
  act.use_fake_user=True
  tr=arm.animation_data.nla_tracks.new();tr.name=name;strip=tr.strips.new(name,1,act);strip.action_frame_end=frames+1;strip.extrapolation='NOTHING';tr.mute=True
  arm.animation_data.action=None;names.append(name)
  rig_results[name]={'duration':frames/30,'arm_solver_error_m':max_error,'support_foot_height_m':[min_foot,max_foot],'hair_peak_degrees':PROFILES[name]}
  print('D_CLIP',name,frames,'arm_error',max_error,flush=True)
 rest_pose(arm)
 if expressions:expressions.finish_expressions(faces)
 for tr in arm.animation_data.nla_tracks:tr.mute=False
 bpy.context.scene.frame_set(0)
 return arm,names,{'bones':len(arm.data.bones),'hair_tip_bones':len(hair),'clips':rig_results}


def merge_draw_groups(objects):
    # All parts share the same skin palette. Join by display role, retaining groups.
    buckets={}
    for ob in objects:
        name=ob.name
        key=name if ob.data.shape_keys else 'D_prop_sling' if name.startswith('D_prop_sling_') else name if name.startswith('D_prop_') else 'D_hair_all' if name.startswith('D_hair') else 'D_head_all' if name in ('D_head_clean','D_ears','D_brooch_detail') else 'D_body_all'
        buckets.setdefault(key,[]).append(ob)
    merged=[]
    for name,parts in buckets.items():
        bpy.ops.object.select_all(action='DESELECT')
        for ob in parts:ob.select_set(True)
        bpy.context.view_layer.objects.active=parts[0]
        if len(parts)>1:bpy.ops.object.join()
        ob=bpy.context.view_layer.objects.active;ob.name=name;ob['nativeBlocks']=True;merged.append(ob)
    return merged
