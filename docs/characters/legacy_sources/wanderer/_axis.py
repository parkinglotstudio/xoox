import bpy, math
arm = bpy.data.objects["Wanderer"]
def tip(bone):
    pb = arm.pose.bones[bone]
    return (arm.matrix_world @ pb.tail)
def test(bone, rot, probe):
    for pb in arm.pose.bones:
        pb.rotation_euler = (0, 0, 0); pb.location = (0, 0, 0); pb.scale = (1, 1, 1)
    arm.animation_data.action = None
    for tr in arm.animation_data.nla_tracks: tr.mute = True
    bpy.context.view_layer.update()
    a = tip(probe).copy()
    arm.pose.bones[bone].rotation_euler = tuple(math.radians(r) for r in rot)
    bpy.context.view_layer.update()
    b = tip(probe)
    print(f"AXIS {bone} rot{rot} -> {probe} dY={b.y-a.y:+.3f} dZ={b.z-a.z:+.3f} dX={b.x-a.x:+.3f}")
test("upperarm.R", (84, 0, 0), "forearm.R")
test("upperarm.L", (84, 0, 0), "forearm.L")
test("upperarm.R", (0, 0, -30), "forearm.R")
test("thigh.L", (40, 0, 0), "shin.L")
test("shin.L", (-60, 0, 0), "foot.L")
test("chest", (0, 20, 0), "upperarm.R")
test("chest", (20, 0, 0), "head")
