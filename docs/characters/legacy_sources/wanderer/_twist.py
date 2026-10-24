import bpy, math
arm = bpy.data.objects["Wanderer"]; arm.animation_data.action = None
for tr in arm.animation_data.nla_tracks: tr.mute = True
W = lambda b, e="head": arm.matrix_world @ getattr(arm.pose.bones[b], e)
for bone in ("chest", "spine", "hips"):
    for v in (0, 30):
        for pb in arm.pose.bones: pb.rotation_euler = (0, 0, 0); pb.location = (0,0,0)
        arm.pose.bones[bone].rotation_euler = (0, math.radians(v), 0); bpy.context.view_layer.update()
        print(f"TW {bone} Y={v}: 오른어깨 y={W('upperarm.R').y:+.3f} 왼어깨 y={W('upperarm.L').y:+.3f}")
for v in (0, -0.06):
    for pb in arm.pose.bones: pb.rotation_euler = (0, 0, 0); pb.location = (0,0,0)
    arm.pose.bones["hips"].location = (0, v, 0); bpy.context.view_layer.update()
    print(f"TW hips loc {v}: 엉덩이 z={W('hips').z:.3f} 발 z={W('foot.L','tail').z:.3f}")
