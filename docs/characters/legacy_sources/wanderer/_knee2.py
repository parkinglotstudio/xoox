import bpy, math
arm = bpy.data.objects["Wanderer"]; arm.animation_data.action = None
for tr in arm.animation_data.nla_tracks: tr.mute = True
W = lambda b, e="head": arm.matrix_world @ getattr(arm.pose.bones[b], e)
def setp(n, v):
    rx, ry, rz = v
    if n.startswith(("thigh", "shin", "foot")): rx, rz = -rx, -rz
    arm.pose.bones[n].rotation_euler = (math.radians(rx), math.radians(ry), math.radians(rz))
for th, sh in ((0, 0), (12, 0), (0, -24), (12, -24), (20, -40)):
    for pb in arm.pose.bones: pb.rotation_euler = (0, 0, 0); pb.location = (0, 0, 0)
    setp("thigh.L", (th, 0, 0)); setp("shin.L", (sh, 0, 0)); bpy.context.view_layer.update()
    h, k, a = W("thigh.L"), W("shin.L"), W("foot.L")
    print(f"K th={th} sh={sh}: 엉덩 ({h.y:+.3f},{h.z:.3f}) 무릎 ({k.y:+.3f},{k.z:.3f}) 발목 ({a.y:+.3f},{a.z:.3f})")
