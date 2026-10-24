# blender -b <wanderer_X_eye.blend> -P render_face.py -- <out_prefix> expr:blink[,expr:blink...]
# 머리 클로즈업: 앞 · 3/4 · 옆. 얼굴 판은 고른 표정만, 눈꺼풀·속눈썹 모양 키 blink 값 적용.
import bpy, math, sys
from mathutils import Vector
argv = sys.argv[sys.argv.index("--") + 1:]
OUTP, states = argv[0], [s.split(":") for s in argv[1].split(",")]
scn = bpy.context.scene
arm = bpy.data.objects.get("Wanderer")
if arm and arm.animation_data:
    arm.animation_data.action = None
    for tr in arm.animation_data.nla_tracks: tr.mute = True
for o in bpy.data.objects:
    if o.type == "MESH" and any(k in o.name for k in ("mg_", "rf_", "bomb")):
        o.hide_render = True
scn.render.engine = "BLENDER_EEVEE"; scn.view_settings.view_transform = "Standard"
try: scn.eevee.taa_render_samples = 16
except Exception: pass
w = bpy.data.worlds.new("w"); scn.world = w; w.use_nodes = True
w.node_tree.nodes["Background"].inputs[0].default_value = (0.12, 0.14, 0.18, 1); w.node_tree.nodes["Background"].inputs[1].default_value = 1.3
for nm, rot, en in (("key", (math.radians(50), 0, math.radians(-35)), 3.2), ("fill", (math.radians(60), 0, math.radians(140)), 1.0), ("rim", (math.radians(75), 0, math.radians(180)), 1.2)):
    ld = bpy.data.lights.new(nm, "SUN"); ld.energy = en
    lo = bpy.data.objects.new(nm, ld); scn.collection.objects.link(lo); lo.rotation_euler = rot
head = [o for o in bpy.data.objects if o.type == "MESH" and o.parent_bone == "head"]
dg = bpy.context.evaluated_depsgraph_get()
zs = [(o.matrix_world @ Vector(c)).z for o in head for c in o.bound_box]
hc = Vector((0, 0, (min(zs) + max(zs)) / 2 - 0.05))
cd = bpy.data.cameras.new("c"); cd.type = "ORTHO"; cd.ortho_scale = (max(zs) - min(zs)) * 0.95
cam = bpy.data.objects.new("c", cd); scn.collection.objects.link(cam); scn.camera = cam
scn.render.resolution_x = 420; scn.render.resolution_y = 420
for expr, blink in states:
    for o in bpy.data.objects:
        if o.name.startswith("face_"):
            o.hide_render = o.name != f"face_{expr}"
        if o.name.startswith(("eye3d_lid", "eye3d_lash")) and o.data.shape_keys:
            o.data.shape_keys.key_blocks["blink"].value = float(blink)
    for i, az in enumerate((0, 32, 75)):
        a = math.radians(az); d = 6
        cam.location = hc + Vector((math.sin(a) * d, -math.cos(a) * d, 0.35))
        cam.rotation_euler = (math.radians(86.7), 0, a)
        scn.render.filepath = f"{OUTP}_{expr}_{blink}_{i}.png"
        bpy.ops.render.render(write_still=True)
print("FACE_DONE")
