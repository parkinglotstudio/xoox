import bpy
bpy.ops.object.select_all(action="SELECT"); bpy.ops.object.delete()
bpy.ops.import_scene.gltf(filepath=r"C:/수스이미지 생성/2026-09-24-unit-lab/free/quaternius_monsters/cat.glb")
for o in bpy.data.objects:
    print("OBJ", o.name, o.type, [s.material.name if s.material else None for s in o.material_slots] if o.type=="MESH" else "", tuple(round(d,2) for d in o.dimensions), o.hide_get(), o.hide_render, o.parent.name if o.parent else None, [m.type for m in o.modifiers] if o.type=="MESH" else "")
