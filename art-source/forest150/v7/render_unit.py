import bpy
from pathlib import Path
from mathutils import Vector
p=Path(__file__).parent/'release'
for state in ('purified','polluted'):
    bpy.ops.wm.open_mainfile(filepath=str(p/f'construction_study_{state}.blend'))
    scene=bpy.context.scene;cam=scene.camera;cam.location=(69,23,11);cam.rotation_euler=(Vector((56.5,39,1.8))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.lens=36
    scene.render.filepath=str(p/f'unit_close_{state}.png');bpy.ops.render.render(write_still=True)
