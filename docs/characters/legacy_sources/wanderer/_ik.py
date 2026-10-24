# blender -b out/wanderer.blend -P _ik.py -- <spec.json> <out.json>
# spec = [{name, base:{bone:[rx,ry,rz,(lz)]}, goals:[{arm, hand, elbow}]}]
# 블렌더 IK(목표+팔꿈치 폴)로 팔을 맞추고, 결과를 actions.py 포즈 값 규약(도, FLIP 반영)으로 돌려준다.
# 오일러는 앞 키와 이어지게(compat) 뽑아 키 사이 보간이 튀지 않게 한다.
import bpy, math, sys, json
from mathutils import Vector, Euler
argv = sys.argv[sys.argv.index("--") + 1:]
specs = json.loads(open(argv[0], encoding="utf-8").read())
arm = bpy.data.objects["Wanderer"]
arm.animation_data.action = None
for tr in arm.animation_data.nla_tracks: tr.mute = True
FLIP_XZ = {"upperarm.L", "upperarm.R", "thigh.L", "thigh.R", "shin.L", "shin.R", "foot.L", "foot.R"}
FLIP_Z = {"forearm.L", "forearm.R"}
def to_blender(n, v):
    rx, ry, rz = v[0], v[1], v[2]
    if n in FLIP_XZ: rx, rz = -rx, -rz
    elif n in FLIP_Z: rz = -rz
    return rx, ry, rz
def to_pose(n, e):
    rx, ry, rz = (math.degrees(a) for a in e)
    if n in FLIP_XZ: rx, rz = -rx, -rz
    elif n in FLIP_Z: rz = -rz
    return [round(rx, 1), round(ry, 1), round(rz, 1)]
def setp(n, v):
    pb = arm.pose.bones[n]
    pb.rotation_euler = tuple(math.radians(a) for a in to_blender(n, v))
    pb.location = (0, v[3], 0) if len(v) > 3 else (0, 0, 0)
scn = bpy.context.scene
def empty(name):
    o = bpy.data.objects.new(name, None); scn.collection.objects.link(o); return o
tgt = {s: empty(f"ik_t{s}") for s in "LR"}
pole = {s: empty(f"ik_p{s}") for s in "LR"}
cons = {}
for s in "LR":
    c = arm.pose.bones[f"forearm.{s}"].constraints.new("IK")
    c.target = tgt[s]; c.pole_target = pole[s]; c.chain_count = 2
    cons[s] = c
W = lambda b, e="tail": arm.matrix_world @ getattr(arm.pose.bones[b], e)
prev = {}
out = []
for sp in specs:
    for pb in arm.pose.bones: pb.rotation_euler = (0, 0, 0); pb.location = (0, 0, 0)
    for n, v in sp["base"].items(): setp(n, v)
    pose = {k: list(v) for k, v in sp["base"].items()}
    for g in sp["goals"]:
        s = g["arm"]
        tgt[s].location = Vector(g["hand"])
        elbow = Vector(g["elbow"])
        # 폴은 팔꿈치 방향으로 멀리
        bpy.context.view_layer.update()
        sh = W(f"upperarm.{s}", "head"); hand = Vector(g["hand"])
        mid = (sh + hand) / 2
        pole[s].location = elbow + (elbow - mid).normalized() * 0.5
        best = None
        for pa in range(-180, 180, 10):
            cons[s].pole_angle = math.radians(pa)
            bpy.context.view_layer.update()
            d = (W(f"upperarm.{s}") - elbow).length + 2 * (W(f"forearm.{s}") - hand).length
            if best is None or d < best[0]: best = (d, pa)
        for pa in [best[1] + k for k in range(-9, 10)]:
            cons[s].pole_angle = math.radians(pa)
            bpy.context.view_layer.update()
            d = (W(f"upperarm.{s}") - elbow).length + 2 * (W(f"forearm.{s}") - hand).length
            if d < best[0]: best = (d, pa)
        cons[s].pole_angle = math.radians(best[1]); bpy.context.view_layer.update()
        print(f"IK {sp.get('name')} {s}: 손 오차 {(W(f'forearm.{s}') - hand).length:.3f} 팔꿈치 오차 {(W(f'upperarm.{s}') - elbow).length:.3f}")
    bpy.context.view_layer.update()
    # 제약 결과 → 로컬(basis) 회전
    for g in sp["goals"]:
        s = g["arm"]
        for b in (f"upperarm.{s}", f"forearm.{s}"):
            pb = arm.pose.bones[b]
            loc = arm.convert_space(pose_bone=pb, matrix=pb.matrix, from_space="POSE", to_space="LOCAL")
            e = loc.to_euler("XYZ", prev[b]) if b in prev else loc.to_euler("XYZ")
            prev[b] = e.copy()
            pose[b] = to_pose(b, e)
    out.append(pose)
# 검증: 제약 끄고 값만으로 같은 손 위치가 나오는지
for c in cons.values(): c.mute = True
for sp, pose in zip(specs, out):
    for pb in arm.pose.bones: pb.rotation_euler = (0, 0, 0); pb.location = (0, 0, 0)
    for n, v in pose.items(): setp(n, v)
    bpy.context.view_layer.update()
    for g in sp["goals"]:
        s = g["arm"]
        print(f"CHECK {sp.get('name')} {s}: 값만으로 손 오차 {(W(f'forearm.{s}') - Vector(g['hand'])).length:.3f}  {pose[f'upperarm.{s}']} {pose[f'forearm.{s}']}")
open(argv[1], "w", encoding="utf-8").write(json.dumps(out))
