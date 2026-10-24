"""원본 모델(매끈) 앞·3/4·뒤 세 컷. blender -b -P render_views.py -- <glb> <out_prefix> [face]
face = default|smile|determined|surprised (face_* 판 중 그것만 보이게). 총·폭탄 숨김."""
import bpy, math, sys
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:]
GLB, OUT = argv[0], argv[1]
FACE = argv[2] if len(argv) > 2 else "default"
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete()
bpy.ops.import_scene.gltf(filepath=GLB)
for o in bpy.data.objects:
    n = o.name.lower()
    if o.type == "MESH" and (n.startswith("gun") or n.startswith("bomb") or (n.startswith("face_") and not n.startswith(f"face_{FACE}"))):
        o.hide_render = True
bpy.context.scene.frame_set(0)
dg = bpy.context.evaluated_depsgraph_get()
pts = []
for o in bpy.data.objects:
    if o.type == "MESH" and not o.hide_render:
        ev = o.evaluated_get(dg)
        me = ev.to_mesh()
        pts += [ev.matrix_world @ v.co for v in me.vertices]
        ev.to_mesh_clear()
zmax = max(p.z for p in pts)
H = zmax
scn = bpy.context.scene
scn.render.engine = "BLENDER_EEVEE"
scn.view_settings.view_transform = "Standard"
w = bpy.data.worlds.new("w"); scn.world = w; w.use_nodes = True
w.node_tree.nodes["Background"].inputs[0].default_value = (0.1, 0.12, 0.16, 1)
w.node_tree.nodes["Background"].inputs[1].default_value = 1.3
for nm, rot, en in (("key", (math.radians(40), 0, math.radians(-30)), 3.0), ("fill", (math.radians(60), 0, math.radians(150)), 1.2)):
    ld = bpy.data.lights.new(nm, "SUN"); ld.energy = en
    lo = bpy.data.objects.new(nm, ld); bpy.context.collection.objects.link(lo); lo.rotation_euler = rot
cd = bpy.data.cameras.new("c"); cd.type = "ORTHO"; cd.ortho_scale = 2.35
cam = bpy.data.objects.new("c", cd); bpy.context.collection.objects.link(cam); scn.camera = cam
scn.render.resolution_x = 300; scn.render.resolution_y = 340
c = Vector((0, 0, 1.08))
for i, az in enumerate((0, 35, 180)):  # 앞 · 3/4 · 뒤
    a = math.radians(az)
    cam.location = c + Vector((math.sin(a) * 6, -math.cos(a) * 6, 0.5))
    cam.rotation_euler = (math.radians(85.2), 0, a)
    scn.render.filepath = f"{OUT}_{i}.png"
    bpy.ops.render.render(write_still=True)
print("VIEWS_DONE", round(H, 3))
