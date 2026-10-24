import bpy
arm = bpy.data.objects["Wanderer"]
scn = bpy.context.scene
def at(act, t, frames):
    for tr in arm.animation_data.nla_tracks: tr.mute = True
    arm.animation_data.action = bpy.data.actions[act]
    scn.frame_set(1 + round(t * frames)); bpy.context.view_layer.update()
def P(b, end="tail"):
    pb = arm.pose.bones[b]; return arm.matrix_world @ (pb.tail if end == "tail" else pb.head)
at("shoot", 0.0, 8)
h, s = P("forearm.R"), P("upperarm.R", "head")
print(f"VERIFY shoot: 오른손 y={h.y:+.2f} (앞이면 -) z={h.z:.2f} 어깨 z={s.z:.2f}")
at("run", 0.25, 22)
print(f"VERIFY run: 머리 y={P('head').y:+.2f} 엉덩이 y={P('hips','head').y:+.2f} (숙이면 머리가 더 -)")
for t in (0.0, 0.25, 0.5, 0.75):
    at("run", t, 22)
    kl, fl = P("thigh.L"), P("shin.L")
    print(f"VERIFY run t={t}: 왼무릎 y={kl.y:+.2f} 왼발목 y={fl.y:+.2f} (무릎 굽히면 발목이 무릎보다 +)  왼손 y={P('forearm.L').y:+.2f}")
at("throw", 0.28, 33); print(f"VERIFY throw lift: 오른손 y={P('forearm.R').y:+.2f} x={P('forearm.R').x:+.2f} (뒤·바깥이면 y+ x-)")
at("throw", 0.45, 33); print(f"VERIFY throw release: 오른손 y={P('forearm.R').y:+.2f} z={P('forearm.R').z:.2f} (앞·위면 y- z 큼)")
at("idle", 0.0, 45); print(f"VERIFY idle: 왼손 x={P('forearm.L').x:+.2f} 오른손 x={P('forearm.R').x:+.2f} (몸 밖으로 ±0.3 근처)")
