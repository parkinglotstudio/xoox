"""새 설치 건물 30개를 격자로 놓고 한 장 렌더 (확인용). blender -b -P render_grid.py -- <출력폴더>"""
import bpy, json, math, os, sys
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[0]
HERE = os.path.dirname(os.path.abspath(__file__))
man = json.load(open(os.path.join(HERE, "units_free.json"), encoding="utf-8"))["units"]
units = [u for u in man if u["group"] in ("building_tower", "building_camp", "building_machine")]

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete()
COLS, GAP = 6, 3.8
for i, u in enumerate(units):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(HERE, "units_free", u["id"] + ".glb"))
    new = [o for o in bpy.data.objects if o not in before]
    x = (i % COLS) * GAP
    y = -(i // COLS) * GAP
    for o in new:
        if o.parent is None:
            o.location = Vector(o.location) + Vector((x, y, 0))
    # 이름 표지
    bpy.ops.object.text_add(location=(x - 1.1, y - 1.25, 0.01))
    t = bpy.context.active_object
    t.data.body = u["id"].replace("k_", "").replace("tower_", "tower ")[:18]
    t.data.size = 0.28

scn = bpy.context.scene
scn.render.engine = "BLENDER_EEVEE"
scn.view_settings.view_transform = "Standard"
w = bpy.data.worlds.new("w")
scn.world = w
w.use_nodes = True
w.node_tree.nodes["Background"].inputs[0].default_value = (0.05, 0.07, 0.1, 1)
w.node_tree.nodes["Background"].inputs[1].default_value = 1.3
ld = bpy.data.lights.new("sun", "SUN")
ld.energy = 3.0
lo = bpy.data.objects.new("sun", ld)
bpy.context.collection.objects.link(lo)
lo.rotation_euler = (math.radians(45), 0, math.radians(30))
cd = bpy.data.cameras.new("cam")
cd.type = "ORTHO"
cd.ortho_scale = 24
cam = bpy.data.objects.new("cam", cd)
bpy.context.collection.objects.link(cam)
cx, cy = (COLS - 1) * GAP / 2, -((len(units) - 1) // COLS) * GAP / 2
cam.location = (cx, cy - 12, 16)
cam.rotation_euler = (math.radians(40), 0, 0)
scn.camera = cam
scn.render.resolution_x = 1800
scn.render.resolution_y = 1500
scn.render.filepath = os.path.join(OUT, "buildings_grid.png")
bpy.ops.render.render(write_still=True)
print("GRID_DONE", len(units))
