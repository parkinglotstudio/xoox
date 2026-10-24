# blender -b out/wanderer.blend -P _probe.py -- <out.png> <json poses list>
import bpy, math, sys, json
from mathutils import Vector
argv = sys.argv[sys.argv.index("--") + 1:]
OUT, POSES = argv[0], json.loads(open(argv[1], encoding="utf-8").read())
arm = bpy.data.objects["Wanderer"]
arm.animation_data.action = None
for tr in arm.animation_data.nla_tracks: tr.mute = True
FLIP_XZ = {"upperarm.L", "upperarm.R", "thigh.L", "thigh.R", "shin.L", "shin.R", "foot.L", "foot.R"}
FLIP_Z = {"forearm.L", "forearm.R"}
scn = bpy.context.scene
scn.render.engine = "BLENDER_EEVEE"; scn.view_settings.view_transform = "Standard"
w = bpy.data.worlds.new("w"); scn.world = w; w.use_nodes = True
w.node_tree.nodes["Background"].inputs[0].default_value = (0.1, 0.12, 0.16, 1); w.node_tree.nodes["Background"].inputs[1].default_value = 1.4
for nm, rot, en in (("key", (math.radians(50), 0, math.radians(160)), 3.2), ("fill", (math.radians(60), 0, math.radians(-20)), 1.2)):
    ld = bpy.data.lights.new(nm, "SUN"); ld.energy = en
    lo = bpy.data.objects.new(nm, ld); scn.collection.objects.link(lo); lo.rotation_euler = rot
cd = bpy.data.cameras.new("pc"); cd.type = "ORTHO"; cd.ortho_scale = 2.4
cam = bpy.data.objects.new("pc", cd); scn.collection.objects.link(cam); scn.camera = cam
VIEW = argv[2] if len(argv) > 2 else "back"
if VIEW == "back":
    cam.location = (0, 5.2, 1.7); cam.rotation_euler = (math.radians(80), 0, math.radians(180))
else:  # side: 캐릭터 오른쪽(-X)에서
    cam.location = (-5.2, 0, 1.2); cam.rotation_euler = (math.radians(88), 0, math.radians(-90))
scn.render.resolution_x = 300; scn.render.resolution_y = 360
for i, pose in enumerate(POSES):
    for pb in arm.pose.bones:
        pb.rotation_euler = (0, 0, 0); pb.location = (0, 0, 0)
    for n, v in pose.items():
        rx, ry, rz = v[0], v[1], v[2]
        if n in FLIP_XZ: rx, rz = -rx, -rz
        elif n in FLIP_Z: rz = -rz
        arm.pose.bones[n].rotation_euler = (math.radians(rx), math.radians(ry), math.radians(rz))
        if len(v) > 3: arm.pose.bones[n].location = (0, v[3], 0)
        if len(v) > 4: arm.pose.bones[n].scale = (v[4],) * 3
    bpy.context.view_layer.update()
    W = lambda b, e="tail": arm.matrix_world @ (getattr(arm.pose.bones[b], e))
    for s in ("R", "L"):
        sh, el, ha = W(f"upperarm.{s}", "head"), W(f"upperarm.{s}"), W(f"forearm.{s}")
        print(f"PROBE {i} {s}: 어깨 z={sh.z:.2f} 팔꿈치 x={el.x:+.2f} y={el.y:+.2f} z={el.z:.2f}  손 x={ha.x:+.2f} y={ha.y:+.2f} z={ha.z:.2f}")
    g0, g1 = W("gun", "head"), W("gun")
    print(f"PROBE {i} gun: 뿌리 ({g0.x:+.2f},{g0.y:+.2f},{g0.z:.2f}) 끝 ({g1.x:+.2f},{g1.y:+.2f},{g1.z:.2f}) 머리끝 z={W('head').z:.2f}")
    scn.render.filepath = OUT.replace(".png", f"_{i}.png")
    bpy.ops.render.render(write_still=True)
