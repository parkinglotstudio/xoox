"""D-SP01: keep D08 source intact; retarget its form and 18 clips to sprite anatomy."""
import bpy, math, json, hashlib, types, argparse, sys
from pathlib import Path
from mathutils import Vector, Matrix
ROOT=Path(r'C:\xoox')
LOCAL_SOURCE=ROOT/'data/tools/unit_lab/character/D/source/wanderer_D.blend'
SOURCE=Path(r'C:\수스이미지 생성\2026-09-26-wanderer-D08\wanderer_D.blend')
SOURCE=LOCAL_SOURCE if LOCAL_SOURCE.exists() else SOURCE
parser=argparse.ArgumentParser();parser.add_argument('--head-units',type=float,choices=[3.5,4.4],default=4.4)
args=parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
IS_35=args.head_units==3.5
VARIANT='D-35' if IS_35 else 'D-SP01'
BASENAME='wanderer_D_35' if IS_35 else 'wanderer_D_sprite'
OUT=ROOT/'data/tools/unit_lab/character'/('D_35' if IS_35 else 'D_sprite')
OUT.mkdir(parents=True,exist_ok=True)
SOURCE_GLB=ROOT/'data/tools/unit_lab/character/D/wanderer_D.glb'
source_hash=hashlib.sha256(SOURCE_GLB.read_bytes()).hexdigest()
# Head unit = crown to chin, excludes the separate sprout strand.
HEAD_SCALE=1.9/(2.5*.8448+1.0124) if IS_35 else .49
CHIN_HEIGHT=2.5*.8448*HEAD_SCALE if IS_35 else 1.40
BODY_HEIGHT_SCALE=CHIN_HEIGHT/1.40
LANDMARKS=[(0,0),(.103,.16),(.238,.44),(.46,.75),(.568,.995),(.69,1.18),(.735,1.26),(.86,1.388),(.8832,1.40)]
LANDMARKS=[(old,new*BODY_HEIGHT_SCALE) for old,new in LANDMARKS]
def body_point(p):
    x,y,z=p
    if z>=LANDMARKS[-1][0]:nz=CHIN_HEIGHT+(z-.8832)*HEAD_SCALE
    else:
        a,b=LANDMARKS[0],LANDMARKS[1]
        for a,b in zip(LANDMARKS,LANDMARKS[1:]):
            if z<=b[0]:break
        nz=a[1]+(z-a[0])*(b[1]-a[1])/(b[0]-a[0])
    return Vector((x*.92,y*.90,nz))
def head_point(p):
    return Vector((p[0]*HEAD_SCALE,p[1]*HEAD_SCALE,CHIN_HEIGHT+(p[2]-.8832)*HEAD_SCALE))
def reach_point(p):
    q=body_point(p);q.y=p[1]*1.40
    return q

def load_rig():
    path=ROOT/'scripts/unit_lab_d/rig_d.py'
    src=path.read_text(encoding='utf8')
    replacements={
      "weapon_matrix((-.05,.36,.65),": "weapon_matrix((-.046,.205,body_point((0,0,.65)).z),",
      "aim=Vector((sign*.225,-.26+.018*recoil,.73+.012*recoil))+shift": "aim=reach_point((sign*.225,-.26+.018*recoil,.73+.012*recoil))+shift",
      "aim=Vector((sign*.27,-.13,.52))+shift": "aim=reach_point((sign*.27,-.13,.52))+shift",
      "target=Vector((-.155,-.21+.025*kick,.66+.027*kick))+shift": "target=reach_point((-.155,-.27+.025*kick,.66+.027*kick))+shift",
      "(.3,(-.43,.09,.75)),(.5,(-.44,-.03,.80))": "(.3,tuple(reach_point((-.43,.09,.75)))),(.5,tuple(reach_point((-.44,-.03,.80))))",
      "weapon_matrix((-.72,.60,.64),": "weapon_matrix(body_point((-.72,.40,.64)),",
      "weapon_matrix((-.56,-.35,.63),": "weapon_matrix(reach_point((-.56,-.35,.63)),",
      "Vector(catmull(keys,t))+shift": "reach_point(catmull(keys,t))+shift",
      "Vector((.32,-.14,.59+.08*S(t*math.pi)))+shift": "reach_point((.32,-.14,.59+.08*S(t*math.pi)))+shift",
      "Vector((sgn*.137+xx,yy,0))": "body_point((sgn*.137+xx,yy,0))",
    }
    for old,new in replacements.items():
        assert src.count(old)==1,(old,src.count(old));src=src.replace(old,new)
    rig=types.ModuleType('d_sprite_rig');rig.__file__=str(path)
    rig.__dict__.update(body_point=body_point,reach_point=reach_point)
    exec(compile(src,str(path),'exec'),rig.__dict__)
    oldlocal=rig.local_point
    rig.local_point=lambda arm,bone,p:oldlocal(arm,bone,body_point(p))
    return rig

bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
rig=load_rig()
arm=next(o for o in bpy.data.objects if o.type=='ARMATURE')
model=bpy.data.objects['D_reference_form']
rig.rest_pose(arm)
objects=[o for o in bpy.data.objects if o.type=='MESH' and o.get('nativeBlocks')]
oldbones={b.name:(b.head_local.copy(),b.tail_local.copy()) for b in arm.data.bones}
hair={}
for name,(h,t) in oldbones.items():
    if name.startswith('tip_'):
        hair['D_'+name[4:]]=(name,650-h.z/.0032,650-t.z/.0032)
oldprop={}
for name in ('gun','gunL','rifle','bomb'):
    h,t=oldbones[name];y=(t-h).normalized();z=Vector((0,-1,0));x=y.cross(z).normalized()
    m=Matrix((x,y,z)).transposed().to_4x4();m.translation=h;oldprop[name]=m
    new=m.copy();new.translation=body_point(h);rig.PROP_M4[name]=new
for ob in objects:
    weights=[]
    for v in ob.data.vertices:
        weights.append(sum(g.weight for g in v.groups if ob.vertex_groups[g.group].name=='head' or ob.vertex_groups[g.group].name.startswith('tip_hair_')))
    prop=ob.get('prop')
    def deform(p,index):
        if ob.name.startswith('D_prop_sling'):return p.copy()
        if prop in oldprop:return rig.PROP_M4[prop]@oldprop[prop].inverted()@p
        w=weights[index];q=body_point(p).lerp(head_point(p),w)
        # A belt buckle is rigid hardware, not anatomy: keep its square aspect.
        px=p.x/.0032+248;py=650-p.z/.0032
        if w<.01 and 237<=px<=268 and 475<=py<=502 and p.y<-.145:
            center=(650-488.5)*.0032;q.z=body_point((0,0,center)).z+(p.z-center)*.92
        return q
    if ob.data.shape_keys:
        for key in ob.data.shape_keys.key_blocks:
            for i,v in enumerate(key.data):v.co=deform(v.co,i)
        for i,v in enumerate(ob.data.vertices):v.co=ob.data.shape_keys.key_blocks[0].data[i].co
    else:
        for i,v in enumerate(ob.data.vertices):v.co=deform(v.co,i)
    ob['proportionVariant']=VARIANT
    ob.data.update()
arm.animation_data_clear()
bpy.context.view_layer.objects.active=arm
bpy.ops.object.mode_set(mode='EDIT')
for bone in arm.data.edit_bones:
    h,t=oldbones[bone.name]
    if bone.name=='root' or bone.name.startswith('sling_'):continue
    transform=head_point if bone.name=='head' or bone.name.startswith('tip_hair_') else body_point
    bone.head=transform(h);bone.tail=transform(t)
bpy.ops.object.mode_set(mode='OBJECT')
bpy.context.view_layer.update()
rig.skeleton=lambda _: (arm,hair)
rig.bind=lambda *args:None
rig.props=lambda *args:[]
# IK baking uses bone transforms only. Avoid evaluating 92k triangles on every solve.
for ob in objects:ob.hide_viewport=True
arm,names,rig_metrics=rig.build_rig(objects,model,None)
for ob in objects:ob.hide_viewport=False
bpy.context.view_layer.update()
# Existing facial morph tracks remain compatible: all key shapes were transformed equally.
for ob in objects:
    keys=ob.data.shape_keys
    if keys and keys.animation_data:
        keys.animation_data.action=None
        for tr in keys.animation_data.nla_tracks:tr.mute=False
model['stage']=VARIANT+' separate body-proportion variant'
model['proportionVariant']=VARIANT
model['headScaleFromD']=HEAD_SCALE
model['reference']='ui/actor/wanderer/ingame_idle/ingame_idle_sheet.png frame 0'
bpy.ops.object.select_all(action='DESELECT')
for ob in [model,arm,*objects]:ob.select_set(True)
bpy.context.view_layer.objects.active=model
bpy.ops.export_scene.gltf(filepath=str(OUT/(BASENAME+'.glb')),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_anim_slide_to_zero=True,export_force_sampling=True,export_extras=True,export_apply=False)
rig.rest_pose(arm)
# Editable source: new file only. Keep the source D and its animations untouched.
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/(BASENAME+'.blend')))
metrics={'variant':VARIANT,'head_units':1+CHIN_HEIGHT/(.8448*HEAD_SCALE),'chin_height_m':CHIN_HEIGHT,'source_glb_sha256':source_hash,'head_scale_from_D':HEAD_SCALE,'body_width_scale':.92,'body_depth_scale':.90,'body_landmarks_m':LANDMARKS,'reference_pixels':{'feet_y':499,'crown_y':75,'chin_y':171,'head_width':122,'body_height_without_sprout':424,'head_units':424/96},'animations':names,'rig':rig_metrics,'triangles':sum(len(p.vertices)-2 for o in objects for p in o.data.polygons),'file_bytes':(OUT/(BASENAME+'.glb')).stat().st_size}
(OUT/'metrics.json').write_text(json.dumps(metrics,indent=2),encoding='utf8')
assert hashlib.sha256(SOURCE_GLB.read_bytes()).hexdigest()==source_hash
print('D_SPRITE_COMPLETE',json.dumps(metrics),flush=True)