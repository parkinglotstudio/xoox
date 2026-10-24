# build_wanderer.py · build_wanderer_ab.py 안에서 exec (make_action·key_pose 정의 뒤).
# 몸은 FK(pose_fn), 팔은 프레임마다 블렌더 IK로 풀어 FK 회전으로 굽는다.
#   hands_fn(t) = {
#       "R": (손 위치, 팔꿈치 방향),
#       "L": (손 위치 | "grip:<소품>", 팔꿈치 방향),   # grip = 그 소품의 앞 손잡이(PROP_GRIP)
#       "aim": {"<소품>": 총열 방향},                   # 오른손 IK 뒤, 소품 뼈를 돌려 총열을 이 방향으로
#   }
# 손 위치는 서 있는 자세 기준 월드 좌표. 몸이 움직이면(걷기·디딤·무릎) 가슴 뿌리 이동만큼 같이 옮긴다.
# 오일러는 프레임마다 앞 프레임과 이어지게 뽑는다 → 보간이 튀지 않는다.

IK_ARMS = ("upperarm.R", "forearm.R", "upperarm.L", "forearm.L")
PROP_BONES = ("gun", "rifle", "bomb")


def _prop_local_frame(arm, prop):
    """표준 좌표(총열 +Y, 윗면 +Z) → 소품 뼈 로컬(아마추어 공간 기준) 행렬."""
    b = arm.data.bones[prop]
    return b.matrix_local.inverted() @ arm.matrix_world.inverted() @ PROP_M4[prop]


def _aim_prop(arm, prop, direction, W):
    """소품 뼈를 돌려 총열(표준 +Y)을 direction으로, 윗면(표준 +Z)을 되도록 위로."""
    pb = arm.pose.bones[prop]
    C = _prop_local_frame(arm, prop).to_3x3().normalized()
    y = Vector(direction).normalized()
    z = Vector((0, 0, 1))
    z = (z - y * z.dot(y)).normalized()
    x = y.cross(z).normalized()
    D = Matrix((x, y, z)).transposed()          # 열 = 원하는 월드 축
    Rw = D @ C.inverted()                        # 뼈의 월드 회전
    Ra = arm.matrix_world.to_3x3().normalized().inverted() @ Rw
    head = pb.matrix.to_translation()
    Mpose = Matrix.Translation(head) @ Ra.to_4x4()
    loc = arm.convert_space(pose_bone=pb, matrix=Mpose, from_space="POSE", to_space="LOCAL")
    return loc.to_3x3().to_euler("XYZ")


def _grip_world(arm, prop):
    pb = arm.pose.bones[prop]
    g = _prop_local_frame(arm, prop) @ PROP_GRIP[prop]
    return arm.matrix_world @ pb.matrix @ g


def make_ik_action(arm, name, frames, pose_fn, hands_fn):
    scn = bpy.context.scene
    act = bpy.data.actions.new(name)
    arm.animation_data_create()
    arm.animation_data.action = act
    for pb in arm.pose.bones:
        pb.rotation_euler = (0, 0, 0)
        pb.location = (0, 0, 0)
    bpy.context.view_layer.update()
    W = lambda b, e="tail": arm.matrix_world @ getattr(arm.pose.bones[b], e)
    chest0 = W("chest", "head").copy()
    tg, po, cons = {}, {}, {}
    for s in "LR":
        tg[s] = link(bpy.data.objects.new(f"_ikt{s}", None))
        po[s] = link(bpy.data.objects.new(f"_ikp{s}", None))
        c = arm.pose.bones[f"forearm.{s}"].constraints.new("IK")
        c.target, c.pole_target, c.chain_count = tg[s], po[s], 2
        cons[s] = c
    prev = {}
    pole_angle = {}

    def solve_arm(s, hand, edir):
        sh = W(f"upperarm.{s}", "head")
        mid = (sh + hand) / 2
        d = Vector(edir).normalized()
        if s not in pole_angle:  # 이 뼈대에서 폴이 팔꿈치를 정확히 가리키는 각도 (굽힌 팔로 한 번 찾음)
            ch, cd = sh + Vector((0, -0.2, -0.1)), Vector((0.4 if s == "L" else -0.4, 0.5, -0.7)).normalized()
            tg[s].location = ch
            po[s].location = (sh + ch) / 2 + cd * 0.6
            best = None
            for pa in range(-180, 180, 5):
                cons[s].pole_angle = math.radians(pa)
                bpy.context.view_layer.update()
                e = (W(f"upperarm.{s}") - (sh + ch) / 2).normalized()
                if best is None or -e.dot(cd) < best[0]:
                    best = (-e.dot(cd), pa)
            pole_angle[s] = best[1]
            print("IK_POLE", name, s, best[1], round(-best[0], 3))
        cons[s].pole_angle = math.radians(pole_angle[s])
        tg[s].location = hand
        po[s].location = mid + d * 0.6
        bpy.context.view_layer.update()

    def bake_bone(b, f, e=None):
        pb = arm.pose.bones[b]
        if e is None:
            m = arm.convert_space(pose_bone=pb, matrix=pb.matrix, from_space="POSE", to_space="LOCAL")
            e = m.to_euler("XYZ", prev[b]) if b in prev else m.to_euler("XYZ")
        elif b in prev:
            e.make_compatible(prev[b])
        prev[b] = e.copy()
        pb.rotation_euler = e
        pb.keyframe_insert("rotation_euler", frame=f + 1)

    for f in range(frames + 1):
        t = f / frames
        scn.frame_set(f + 1)
        pose = pose_fn(t)
        for pr in PROP_BONES:
            pose.setdefault(pr, (0, 0, 0, 0, HIDE))
        for b in IK_ARMS:
            pose.pop(b, None)
        key_pose(arm, f + 1, pose)
        bpy.context.view_layer.update()
        shift = W("chest", "head") - chest0
        hands = hands_fn(t)
        # 1) 오른손
        hR, dR = hands["R"]
        solve_arm("R", Vector(hR) + shift, dR)
        bake_bone("upperarm.R", f)
        bake_bone("forearm.R", f)
        cons["R"].mute = True  # 구운 값으로 고정 (아래 소품 계산이 같은 자세를 보게)
        bpy.context.view_layer.update()
        # 2) 소품 조준
        for pr, dirv in hands.get("aim", {}).items():
            bake_bone(pr, f, _aim_prop(arm, pr, dirv, W))
        bpy.context.view_layer.update()
        # 3) 왼손 (소품 앞 손잡이 또는 위치)
        hL, dL = hands["L"]
        if isinstance(hL, str) and hL.startswith("grip:"):
            target = _grip_world(arm, hL[5:])
        else:
            target = Vector(hL) + shift
        solve_arm("L", target, dL)
        bake_bone("upperarm.L", f)
        bake_bone("forearm.L", f)
        cons["R"].mute = False
    for s in "LR":
        arm.pose.bones[f"forearm.{s}"].constraints.remove(cons[s])
        bpy.data.objects.remove(tg[s])
        bpy.data.objects.remove(po[s])
    act.use_fake_user = True
    tr = arm.animation_data.nla_tracks.new()
    tr.name = name
    st = tr.strips.new(name, 1, act)
    st.action_frame_start = 1
    st.action_frame_end = frames + 1
    arm.animation_data.action = None
    return act
