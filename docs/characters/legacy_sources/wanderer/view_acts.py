# blender -b <blend> -P view_acts.py -- <out.png> <view back|side|q34> action:frames:t1,t2,... [...]
# 동작 여러 개의 몇 컷을 한 장으로 (행 = 동작). 총·팔 확인용 빠른 렌더(EEVEE 샘플 4).
import bpy, math, sys, os
argv = sys.argv[sys.argv.index("--") + 1:]
OUT, VIEW, specs = argv[0], argv[1], argv[2:]
arm = bpy.data.objects["Wanderer"]; scn = bpy.context.scene
for tr in arm.animation_data.nla_tracks: tr.mute = True
scn.render.engine = "BLENDER_EEVEE"; scn.view_settings.view_transform = "Standard"
try: scn.eevee.taa_render_samples = 4
except Exception: pass
w = bpy.data.worlds.new("w"); scn.world = w; w.use_nodes = True
w.node_tree.nodes["Background"].inputs[0].default_value = (0.1, 0.12, 0.16, 1); w.node_tree.nodes["Background"].inputs[1].default_value = 1.6
for nm, rot, en in (("k", (math.radians(50), 0, math.radians(160)), 3.0), ("f", (math.radians(55), 0, math.radians(-30)), 1.5)):
    ld = bpy.data.lights.new(nm, "SUN"); ld.energy = en; lo = bpy.data.objects.new(nm, ld); scn.collection.objects.link(lo); lo.rotation_euler = rot
cd = bpy.data.cameras.new("c"); cd.type = "ORTHO"; cd.ortho_scale = 2.7
cam = bpy.data.objects.new("c", cd); scn.collection.objects.link(cam); scn.camera = cam
# az 0 = 앞(캐릭터는 -Y를 봄), 180 = 등 뒤, -90 = 오른쪽, 215 = 뒤 오른쪽 사선(쿼터뷰 느낌)
az = {"back": 180, "side": -90, "q34": 215, "front": 0, "fq": -35}[VIEW]
a = math.radians(az); d = 6
cam.location = (math.sin(a) * d, -math.cos(a) * d, 1.3)
cam.rotation_euler = (math.radians(86), 0, a)
scn.render.resolution_x = 220; scn.render.resolution_y = 290
tiles = []
for sp in specs:
    name, frames, ts = sp.split(":")
    arm.animation_data.action = bpy.data.actions[name]
    row = []
    for i, t in enumerate(float(x) for x in ts.split(",")):
        scn.frame_set(1 + round(t * int(frames)))
        p = OUT.replace(".png", f"_{name}_{i}.png"); scn.render.filepath = p
        bpy.ops.render.render(write_still=True); row.append(p)
    tiles.append((name, row))
print("VIEW_TILES", repr(tiles))
