"""레퍼런스·방랑자 머리 비교 렌더. blender -b -P render_ref.py -- <glb> <out.png> [height_m]
앞 · 3/4 · 옆 세 컷을 한 장으로 (머리 중심 크롭)."""
import bpy, math, os, sys
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:]
GLB, OUT = argv[0], argv[1]
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete()
if GLB.endswith(".blend"):
    with bpy.data.libraries.load(GLB) as (src, dst):
        dst.objects = src.objects
    for o in dst.objects:
        if o is not None:
            bpy.context.collection.objects.link(o)
else:
    bpy.ops.import_scene.gltf(filepath=GLB)
# 무기·소품 숨김 (KayKit: 손에 든 것)
for o in bpy.data.objects:
    if o.type == "MESH" and any(k in o.name.lower() for k in ("sword", "shield", "axe", "dagger", "crossbow", "knife", "mug", "gun", "bomb")):
        o.hide_render = True
dg = bpy.context.evaluated_depsgraph_get()
pts = []
for o in bpy.data.objects:
    if o.type == "MESH" and not o.hide_render:
        ev = o.evaluated_get(dg)
        me = ev.to_mesh()
        pts += [ev.matrix_world @ v.co for v in me.vertices]
        ev.to_mesh_clear()
zmax = max(p.z for p in pts)
zmin = min(p.z for p in pts)
H = zmax - zmin
head_c = Vector((0, 0, zmax - H * 0.17))
scn = bpy.context.scene
scn.render.engine = "BLENDER_EEVEE"
scn.view_settings.view_transform = "Standard"
w = bpy.data.worlds.new("w"); scn.world = w; w.use_nodes = True
w.node_tree.nodes["Background"].inputs[0].default_value = (0.1, 0.12, 0.16, 1)
w.node_tree.nodes["Background"].inputs[1].default_value = 1.2
for nm, rot, en in (("key", (math.radians(40), 0, math.radians(-30)), 3.0), ("fill", (math.radians(60), 0, math.radians(150)), 1.0)):
    ld = bpy.data.lights.new(nm, "SUN"); ld.energy = en
    lo = bpy.data.objects.new(nm, ld); bpy.context.collection.objects.link(lo); lo.rotation_euler = rot
cd = bpy.data.cameras.new("c"); cd.type = "ORTHO"; cd.ortho_scale = H * 0.5
cam = bpy.data.objects.new("c", cd); bpy.context.collection.objects.link(cam); scn.camera = cam
scn.render.resolution_x = 360; scn.render.resolution_y = 360
paths = []
for i, az in enumerate((0, 35, 90)):  # 앞(-Y 방향에서 봄) · 3/4 · 옆
    a = math.radians(az)
    d = 6.0
    cam.location = head_c + Vector((math.sin(a) * d, -math.cos(a) * d, 0.3))
    cam.rotation_euler = (math.radians(87), 0, a)
    p = OUT.replace(".png", f"_{i}.png"); scn.render.filepath = p
    bpy.ops.render.render(write_still=True); paths.append(p)
print("REF_DONE", H)
