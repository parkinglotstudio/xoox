import bpy,sys
bpy.ops.object.select_all(action="SELECT"); bpy.ops.object.delete()
bpy.ops.import_scene.gltf(filepath=r"C:/수스이미지 생성/2026-09-24-unit-lab/free/quaternius_monsters/pink_slime.glb")
for o in bpy.data.objects:
    if o.type=="MESH":
        print("OBJ",o.name,[s.material.name if s.material else None for s in o.material_slots],[a.name for a in o.data.color_attributes])
for m in bpy.data.materials:
    if not m.use_nodes: continue
    b=next((n for n in m.node_tree.nodes if n.type=="BSDF_PRINCIPLED"),None)
    if not b: print("MAT",m.name,"noBSDF"); continue
    i=b.inputs["Base Color"]
    print("MAT",m.name,tuple(round(x,3) for x in i.default_value[:3]), i.is_linked and (i.links[0].from_node.type, [ (x.name, x.is_linked, tuple(round(v,3) for v in x.default_value[:3]) if hasattr(x.default_value,'__len__') else x.default_value) for x in i.links[0].from_node.inputs]))
