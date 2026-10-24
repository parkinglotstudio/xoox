# blender -b out/wanderer.blend -P _solve.py -- <spec.json>
# spec: {"base": {bone: [rx,ry,rz]}, "goals": [{"arm":"R","hand":[x,y,z],"elbow":[x,y,z]|null,"w_elbow":0.3}], "gun_dir":[x,y,z]|null}
# 포즈 값 규약(actions.py와 같음)으로 팔 각도를 찾아 출력.
import bpy, math, sys, json
from mathutils import Vector
argv = sys.argv[sys.argv.index("--") + 1:]
spec = json.loads(open(argv[0], encoding="utf-8").read())
arm = bpy.data.objects["Wanderer"]
arm.animation_data.action = None
for tr in arm.animation_data.nla_tracks: tr.mute = True
FLIP_XZ = {"upperarm.L", "upperarm.R", "thigh.L", "thigh.R", "shin.L", "shin.R", "foot.L", "foot.R"}
FLIP_Z = {"forearm.L", "forearm.R"}
def setp(n, v):
    rx, ry, rz = v[0], v[1], v[2]
    if n in FLIP_XZ: rx, rz = -rx, -rz
    elif n in FLIP_Z: rz = -rz
    arm.pose.bones[n].rotation_euler = (math.radians(rx), math.radians(ry), math.radians(rz))
    if len(v) > 3: arm.pose.bones[n].location = (0, v[3], 0)
def solve_one(spec):
    for pb in arm.pose.bones: pb.rotation_euler = (0, 0, 0); pb.location = (0, 0, 0)
    pose = {k: list(v) for k, v in spec["base"].items()}
    for n, v in pose.items(): setp(n, v)
    W = lambda b, e="tail": arm.matrix_world @ getattr(arm.pose.bones[b], e)
    for g in spec["goals"]:
        s = g["arm"]; ua, fa = f"upperarm.{s}", f"forearm.{s}"
        x = list(pose.get(ua, [0, 0, 0]))[:3] + [min(0, pose.get(fa, [0, 0, 0])[0]), 0, 0]  # 6 값: ua xyz, fa xyz
        T = Vector(g["hand"]); E = Vector(g["elbow"]) if g.get("elbow") else None
        def cost(x):
            setp(ua, x[0:3]); setp(fa, x[3:6]); bpy.context.view_layer.update()
            c = (W(fa) - T).length
            if E: c += g.get("w_elbow", 0.3) * (W(ua) - E).length
            c += 0.0004 * (x[1] ** 2 + x[4] ** 2) / 100  # 비틀기는 적게
            return c
        best = cost(x); step = 20.0
        idx = [0, 1, 2, 3]  # 팔뚝은 굽힘(X)만
        while step > 0.3:
            moved = False
            for i in idx:
                for d in (step, -step):
                    y = x[:]; y[i] += d
                    c = cost(y)
                    if c < best - 1e-6: x, best, moved = y, c, True
            if not moved: step *= 0.5
        cost(x)
        pose[ua], pose[fa] = [round(v, 1) for v in x[0:3]], [round(v, 1) for v in x[3:6]]
        print(f"SOLVE {s}: err={best:.3f} 손={tuple(round(v,2) for v in W(fa))} 팔꿈치={tuple(round(v,2) for v in W(ua))}")
    if spec.get("gun_dir"):
        D = Vector(spec["gun_dir"]).normalized(); gx = [0.0, 0.0, 0.0]
        def gc(v):
            setp("gun", v); bpy.context.view_layer.update()
            return -((W("gun") - W("gun", "head")).normalized().dot(D))
        best = gc(gx); step = 30.0
        while step > 0.5:
            moved = False
            for i in (0, 1, 2):
                for d in (step, -step):
                    y = gx[:]; y[i] += d; c = gc(y)
                    if c < best - 1e-6: gx, best, moved = y, c, True
            if not moved: step *= 0.5
        gc(gx); pose["gun"] = [round(v, 1) for v in gx]
        print(f"SOLVE gun: dot={-best:.3f} 끝={tuple(round(v,2) for v in W('gun'))}")
    return pose


specs = spec if isinstance(spec, list) else [spec]
res = []
ARMS = ("upperarm.R", "forearm.R", "upperarm.L", "forearm.L")
for sp in specs:
    if res:  # 앞 키의 팔 각도에서 출발 → 키 사이 각도가 튀지 않게
        for b in ARMS:
            sp["base"].setdefault(b, res[-1][b])
    res.append(solve_one(sp))
print("POSES", json.dumps(res))
if len(argv) > 1: open(argv[1], "w", encoding="utf-8").write(json.dumps(res))
