"""D08 facial morphs and social motion. Original open face is the zero pose."""
import math,json,bpy
from mathutils import Vector
S=.0032

def ease(a,b,t):
 u=max(0,min(1,(t-a)/(b-a)));return u*u*(3-2*u)
def envelope(t,a,b,c,d):return ease(a,b,t)*(1-ease(c,d,t))
def blink(seconds,center,width=.22):
 # Quick closing, short hold, slower opening.
 return envelope(seconds,center-width*.5,center-width*.08,center+width*.06,center+width*.5)
def expression_values(name,t,duration):
 seconds=t*duration
 if name=='blink':return blink(seconds,.60,.30),0
 if name=='squint':return 0,envelope(t,.10,.25,.63,.87)
 if name=='idle':return max(blink(seconds,1.27,.23),blink(seconds,4.61,.27)),0
 if name=='bow':return .88*envelope(t,.20,.32,.48,.64),0
 if name=='wave':return blink(seconds,1.08,.22),0
 if name=='victory':return max(blink(seconds,.39,.19),blink(seconds,2.54,.22)),0
 return 0,0

def expression_meshes(objects,make_mesh,face_surface,inside,outer):
 head=next(o for o in objects if o.name=='D_head_clean')
 detail=next(o for o in objects if o.name=='D_face_detail')
 regions=json.loads(detail['expressionRegions'])
 for ob in (head,detail):
  ob.shape_key_add(name='Basis')
  for name in ('Blink','Squint'):ob.shape_key_add(name=name,from_mix=False)
 # Flatten just the two eye recesses. Mouth, cheeks, contour and neck are untouched.
 count=int(head['frontVertexCount'])
 for i in range(count):
  v=head.data.vertices[i].co;px=v.x/S+248;d=v.y/S
  py=650-v.z/S+6*max(0,min(1,(-d-24)/42))
  if not (inside(px,py,outer) or inside(490-px,py,outer)):continue
  dep=face_surface(px,py)
  for name in ('Blink','Squint'):
   co=head.data.shape_keys.key_blocks[name].data[i].co;co.y=dep*S
   co.z=(650-py+6*max(0,min(1,(-dep-24)/42)))*S
 for start,end,mirror,role in regions:
  for i in range(start,end):
   v=detail.data.vertices[i].co;px=v.x/S+248;d=v.y/S;py=650-v.z/S+6*max(0,min(1,(-d-24)/42))
   for name in ('Blink','Squint'):
    q=detail.data.shape_keys.key_blocks[name].data[i].co
    if role=='eye':
     y=321+(py-321)*.012
     q.z=(650-y+6*max(0,min(1,(-d-24)/42)))*S
    elif name=='Squint':
     # The green inner brow lowers very slightly, preserving its original color.
     x=490-px if mirror else px;y=py+2.0+.12*(x-179)
     q.z=(650-y+6*max(0,min(1,(-d-24)/42)))*S
 # Closed lids live flush on the face, concealed within the skin in the zero pose.
 vv=[];ff=[];cc=[];kinds=[]
 def polyline(points,kind,width=2.1):
  for (x0,y0),(x1,y1) in zip(points,points[1:]):
   dx,dy=x1-x0,y1-y0;l=math.hypot(dx,dy);nx=-dy/l*width/2;ny=dx/l*width/2
   for mirrored in (False,True):
    n=len(vv)
    for x,y in [(x0+nx,y0+ny),(x1+nx,y1+ny),(x1-nx,y1-ny),(x0-nx,y0-ny)]:
     if mirrored:x=490-x
     vv.append(((x-248)*S,-53*S,(650-y+6*max(0,min(1,(58.13-24)/42)))*S));kinds.append(kind)
    face=(n,n+1,n+2,n+3)
    # Front is -Y. Vertex layout reverses after mirroring.
    ff.append(face[::-1] if mirrored else face);cc.append((52,25,15))
 polyline([(168,319),(177,322),(197,323),(207,320)],'Blink',2.4)
 polyline([(175,304),(204,319),(175,333)],'Squint',3.7)
 mark=make_mesh('D_expression_marks',vv,ff,cc)
 mark.shape_key_add(name='Basis')
 for name in ('Blink','Squint'):
  key=mark.shape_key_add(name=name,from_mix=False)
  for i,kind in enumerate(kinds):
   if kind==name:key.data[i].co.y=-58.13*S
 mark['nativeBlocks']=True;objects.append(mark)
 return [head,detail,mark]

def begin_expression_clip(objects,name):
 for ob in objects:
  keys=ob.data.shape_keys
  if keys.animation_data:
   keys.animation_data.action=None
   for tr in keys.animation_data.nla_tracks:tr.mute=True
  for key in keys.key_blocks:key.value=0
  keys.animation_data_create();act=bpy.data.actions.new(name+'_face_'+ob.name)
  keys.animation_data.action=act

def key_expression(objects,name,t,frames,f):
 b,s=expression_values(name,t,frames/30)
 for ob in objects:
  keys=ob.data.shape_keys
  for kind,val in [('Blink',b),('Squint',s)]:
   key=keys.key_blocks[kind];key.value=val;key.keyframe_insert('value',frame=f+1)

def end_expression_clip(objects,name,frames):
 for ob in objects:
  keys=ob.data.shape_keys;act=keys.animation_data.action;act.use_fake_user=True
  tr=keys.animation_data.nla_tracks.new();tr.name=name;strip=tr.strips.new(name,1,act);strip.action_frame_end=frames+1;strip.extrapolation='NOTHING';tr.mute=True;keys.animation_data.action=None

def finish_expressions(objects):
 for ob in objects:
  keys=ob.data.shape_keys
  for key in keys.key_blocks:key.value=0
  for tr in keys.animation_data.nla_tracks:tr.mute=False
