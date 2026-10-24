"""Replace only Ruon's hair mesh in both saved rigs; preserve non-hair mesh data and animation actions."""
import bpy,sys,json,hashlib,struct,importlib.util
from pathlib import Path
ROOT=Path(r'C:\xoox')
BACKUP=ROOT/'docs/asset_backups/20260927_RuonCrown_Codex'
sys.path.insert(0,str(ROOT/'scripts/unit_lab_a'))
import build_a as builder
import rig_a as rig

def fingerprint(ob):
    h=hashlib.sha256()
    for v in ob.data.vertices:
        h.update(struct.pack('<3f',*v.co))
        for g in v.groups:h.update(ob.vertex_groups[g.group].name.encode()+struct.pack('<f',g.weight))
    for p in ob.data.polygons:h.update(struct.pack('<%di'%len(p.vertices),*p.vertices))
    for a in ob.data.color_attributes:
        for d in a.data:h.update(struct.pack('<4f',*d.color))
    if ob.data.shape_keys:
        for k in ob.data.shape_keys.key_blocks:
            h.update(k.name.encode())
            for p in k.data:h.update(struct.pack('<3f',*p.co))
    return h.hexdigest()

audit=[]
source_hair=None
for variant,source,folder,base in [('RUON','RUON.blend','A','wanderer_A'),('RUON_35','RUON_35.blend','Ruon_35','ruon_35')]:
    bpy.ops.wm.open_mainfile(filepath=str(BACKUP/source))
    arm=next(o for o in bpy.data.objects if o.type=='ARMATURE')
    model=bpy.data.objects['A_reference_form'];rig.rest_pose(arm)
    old=next(o for o in bpy.data.objects if o.type=='MESH' and o.name.startswith('A_hair'))
    stable={o.name:fingerprint(o) for o in bpy.data.objects if o.type=='MESH' and o.get('nativeBlocks') and o!=old}
    if source_hair is None:
        source_hair={}
        for bone in arm.data.bones:
            if bone.name.startswith('tip_'):
                source_hair['A_'+bone.name[4:]]=(bone.name,650-bone.head_local.z/.0032,650-bone.tail_local.z/.0032)
    builder.MODEL=model;builder.MATERIAL=old.data.materials[0]
    oldname=old.name;dataname=old.data.name;old.name='crown_before_discard'
    builder.VOX.clear();builder.build_form()
    parts=builder.voxel_meshes(only_hair=True)
    for ob in parts:
        rig.bind(ob,arm,lambda p,n=ob.name:rig.region_weights(n,p,source_hair))
    if variant=='RUON_35':
        metrics=json.loads((BACKUP/'RUON35_metrics.json').read_text(encoding='utf8'))
        scale=metrics['head_scale_from_source'];chin=metrics['chin_height_m']
        for ob in parts:
            for v in ob.data.vertices:v.co=(v.co.x*scale,v.co.y*scale,chin+(v.co.z-.912)*scale)
    bpy.ops.object.select_all(action='DESELECT')
    for ob in parts:ob.select_set(True)
    bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join()
    hair=bpy.context.object
    bpy.data.objects.remove(old,do_unlink=True)
    hair.name=oldname;hair.data.name=dataname;hair['nativeBlocks']=True;hair['crownRevision']='RUON-CROWN-02'
    after={o.name:fingerprint(o) for o in bpy.data.objects if o.type=='MESH' and o.get('nativeBlocks') and o!=hair}
    assert stable==after,'Non-hair geometry or skin/morph data changed'
    objects=[o for o in bpy.data.objects if o.type=='MESH' and o.get('nativeBlocks')]
    out=ROOT/'data/tools/unit_lab/character'/folder;sourceout=out/'source' if variant=='RUON' else out
    sourceout.mkdir(parents=True,exist_ok=True)
    model['crownRevision']='RUON-CROWN-02'
    for tr in arm.animation_data.nla_tracks:tr.mute=False
    bpy.ops.object.select_all(action='DESELECT')
    for ob in [model,arm,*objects]:ob.select_set(True)
    bpy.context.view_layer.objects.active=model
    bpy.ops.export_scene.gltf(filepath=str(out/(base+'.glb')),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_anim_slide_to_zero=True,export_force_sampling=True,export_extras=True,export_apply=False)
    rig.rest_pose(arm);bpy.ops.wm.save_as_mainfile(filepath=str(sourceout/(base+'.blend')))
    mp=out/'metrics.json';m=json.loads(mp.read_text(encoding='utf8'))
    m.update(crown_revision='RUON-CROWN-02',triangles=sum(len(p.vertices)-2 for o in objects for p in o.data.polygons),file_bytes=(out/(base+'.glb')).stat().st_size)
    mp.write_text(json.dumps(m,indent=2),encoding='utf8')
    audit.append({'variant':variant,'non_hair_unchanged':stable==after,'preserved_mesh_hashes':stable,'hair_vertices':len(hair.data.vertices),'triangles':m['triangles'],'file_bytes':m['file_bytes']})
    print('CROWN_DONE',variant,m['triangles'],flush=True)
(BACKUP/'preservation_check.json').write_text(json.dumps(audit,indent=2),encoding='utf8')
