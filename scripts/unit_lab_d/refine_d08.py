import bpy,json,shutil
from pathlib import Path
art=Path(r'C:\수스이미지 생성\2026-09-26-wanderer-D08');out=Path(r'C:\xoox\data\tools\unit_lab\character\D')
bpy.ops.wm.open_mainfile(filepath=str(art/'wanderer_D.blend'))
ob=bpy.data.objects['D_expression_marks'];keys=ob.data.shape_keys
# First 24 vertices are the three mirrored Blink lid segments; keep them hidden in Squint.
for i in range(24):keys.key_blocks['Squint'].data[i].co=keys.key_blocks['Basis'].data[i].co.copy()
bpy.ops.object.select_all(action='DESELECT')
for ob in bpy.data.objects:
 if ob.name=='D_reference_form' or ob.type=='ARMATURE' or (ob.type=='MESH' and ob.get('nativeBlocks')):ob.select_set(True)
bpy.context.view_layer.objects.active=bpy.data.objects['D_reference_form']
for ob in bpy.data.objects:
 if ob.type=='ARMATURE' and ob.animation_data:
  for tr in ob.animation_data.nla_tracks:tr.mute=False
glb=art/'wanderer_D.glb'
bpy.ops.export_scene.gltf(filepath=str(glb),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_anim_slide_to_zero=True,export_force_sampling=True,export_extras=True,export_apply=False)
shutil.copy2(glb,out/'wanderer_D.glb')
p=out/'metrics.json';m=json.loads(p.read_text(encoding='utf8'));m['file_bytes']=glb.stat().st_size;p.write_text(json.dumps(m,indent=2),encoding='utf8')
bpy.ops.wm.save_as_mainfile(filepath=str(art/'wanderer_D.blend'))
print('D08_REFINE_COMPLETE',flush=True)
