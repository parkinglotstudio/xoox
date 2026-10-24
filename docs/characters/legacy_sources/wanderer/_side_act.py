# blender -b out/wanderer.blend -P _side_act.py -- <action> <frames> <out_prefix> t1 t2 ...
import bpy, math, sys
argv = sys.argv[sys.argv.index("--") + 1:]
act, frames, outp, ts = argv[0], int(argv[1]), argv[2], [float(x) for x in argv[3:]]
arm = bpy.data.objects["Wanderer"]; scn = bpy.context.scene
for tr in arm.animation_data.nla_tracks: tr.mute = True
arm.animation_data.action = bpy.data.actions[act]
scn.render.engine = "BLENDER_EEVEE"; scn.view_settings.view_transform = "Standard"
try: scn.eevee.taa_render_samples = 4
except Exception: pass
w = bpy.data.worlds.new("w"); scn.world = w; w.use_nodes = True
w.node_tree.nodes["Background"].inputs[0].default_value = (0.1, 0.12, 0.16, 1); w.node_tree.nodes["Background"].inputs[1].default_value = 1.6
ld = bpy.data.lights.new("k", "SUN"); ld.energy = 3; lo = bpy.data.objects.new("k", ld); scn.collection.objects.link(lo); lo.rotation_euler = (math.radians(50), 0, math.radians(-120))
cd = bpy.data.cameras.new("c"); cd.type = "ORTHO"; cd.ortho_scale = 2.2
cam = bpy.data.objects.new("c", cd); scn.collection.objects.link(cam); scn.camera = cam
cam.location = (-5.2, 0, 1.0); cam.rotation_euler = (math.radians(90), 0, math.radians(-90))
scn.render.resolution_x = 240; scn.render.resolution_y = 300
W = lambda b, e="head": arm.matrix_world @ getattr(arm.pose.bones[b], e)
for i, t in enumerate(ts):
    scn.frame_set(1 + round(t * frames))
    print(f"SIDE t={t}: 엉덩이 z={W('hips').z:.3f} 머리 z={W('head','tail').z:.3f} 발목 z={W('foot.L').z:.3f} 가슴숙임 y={W('head','tail').y:+.3f} 총끝 z={W('gun','tail').z:.3f}")
    scn.render.filepath = f"{outp}_{i}.png"; bpy.ops.render.render(write_still=True)
