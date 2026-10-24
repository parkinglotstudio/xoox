import bpy, math
arm = bpy.data.objects["Wanderer"]; arm.animation_data.action = None
for tr in arm.animation_data.nla_tracks: tr.mute = True
W = lambda b, e="head": arm.matrix_world @ getattr(arm.pose.bones[b], e)
def setp(n, v):
    rx, ry, rz = v
    if n.startswith(("thigh", "shin", "foot")): rx, rz = -rx, -rz
    arm.pose.bones[n].rotation_euler = (math.radians(rx), math.radians(ry), math.radians(rz))
for a in (12, 20):
  for sg in (1, -1):
    best = None
    for d in [x / 1000 for x in range(0, 80)]:
        for pb in arm.pose.bones: pb.rotation_euler = (0, 0, 0); pb.location = (0, 0, 0)
        arm.pose.bones["hips"].location = (0, -d, 0)
        for s in "LR":
            setp(f"thigh.{s}", (a, 0, 0)); setp(f"shin.{s}", (-2 * a * sg, 0, 0)); setp(f"foot.{s}", (a * sg, 0, 0))
        bpy.context.view_layer.update()
        fz = W("foot.L").z
        if best is None or abs(fz - 0.07) < best[0]: best = (abs(fz - 0.07), d, fz, W("foot.L", "tail").z, W("shin.L").y, W("thigh.L","tail").y)
    print(f"KNEE a={a} sg={sg}: 내림 {best[1]:.3f} 발목 z={best[2]:.3f} 발끝 z={best[3]:.3f} 발목 y={best[4]:+.3f} 무릎 y={best[5]:+.3f}")
