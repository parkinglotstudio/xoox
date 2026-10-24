# build_wanderer.py 안에서 exec. 총·던지기 동작 (GDD 52 §7 슬롯).
# 참고 스프라이트: aim_fire(2컷 60ms) · throw(14컷 약 1.1초) · aim_walk_f · walk_gun.
# 뼈 방향: 팔·다리는 아래(-Z)를 향한다 → X+ = 앞으로 든다, 왼팔 Z+ / 오른팔 Z- = 바깥으로 벌린다.
#          몸통·머리는 위(+Z) → Y = 몸 비틀기.
# 오른손잡이: 총·폭탄은 오른손(R, 캐릭터 기준 오른쪽).


def ease(x):
    x = max(0.0, min(1.0, x))
    return x * x * (3 - 2 * x)


def blend_keys(t, keys):
    """keys: [(시각, {뼈: 값튜플})] 사이를 부드럽게 잇는다."""
    for (t0, p0), (t1, p1) in zip(keys, keys[1:]):
        if t <= t1:
            k = ease((t - t0) / max(1e-6, t1 - t0))
            out = {}
            for b in set(p0) | set(p1):
                a = p0.get(b, (0, 0, 0))
                c = p1.get(b, (0, 0, 0))
                n = max(len(a), len(c))
                a = tuple(a) + (0,) * (n - len(a))
                c = tuple(c) + (0,) * (n - len(c))
                out[b] = tuple(a[i] + (c[i] - a[i]) * k for i in range(n))
            return out
    return dict(keys[-1][1])


def base_stand():
    p = idle_pose(0.0)
    p["thigh.L"] = (0, 0, 3)
    p["thigh.R"] = (0, 0, -3)
    return p


SHOW = 1.0


def mg_recoil(t, shots):
    return abs(S(t * TAU * shots)) ** 3


# 기관총 (원본 aim_fire): 오른팔을 머리 높이까지 들고 팔꿈치는 옆으로 — 총이 머리 옆으로 보인다.
# 왼손은 가슴 앞에서 받친다(팔 길이 0.54m라 총 앞 손잡이까지는 닿지 않음).
MG_HAND_R = (-0.40, -0.27, 1.27)
MG_HAND_L = (-0.13, -0.33, 1.15)


def mg_hands(r):
    return {
        "R": ((MG_HAND_R[0], MG_HAND_R[1] + 0.03 * r, MG_HAND_R[2] + 0.012 * r), (-1.0, 0.25, -0.55)),
        "L": ((MG_HAND_L[0], MG_HAND_L[1] + 0.025 * r, MG_HAND_L[2] + 0.01 * r), (0.5, 0.2, -1.0)),
        "aim": {"gun": (0.04, -1.0, 0.02 + 0.09 * r)},
    }


def mg_upper(r):
    return {
        "chest": (-2 * r, -8, 0),
        "head": (-4, 8, 0),
        "gun": (0, 0, 0, 0, SHOW),
    }


def shoot_pose(t):
    # 기관총 루프: 한 루프에 반동 두 번 (끝없이 반복)
    p = base_stand()
    p.update(mg_upper(mg_recoil(t, 2)))
    p["spine"] = (0, -4, 0)
    return p


def shoot_hands(t):
    return mg_hands(mg_recoil(t, 2))


def catmull(keys, t, step_idx=()):
    """keys: [(시각, 값튜플|dict)] 을 캣멀롬 곡선으로 잇는다 (키에서 멈추지 않고 흐른다).
    dict면 뼈마다. step_idx = 보간하지 않고 앞 키 값을 쓰는 성분 번호(소품 보이기 등)."""
    n = len(keys)
    i = 0
    while i < n - 2 and t > keys[i + 1][0]:
        i += 1
    t0, t1 = keys[i][0], keys[i + 1][0]
    u = max(0.0, min(1.0, (t - t0) / max(1e-6, t1 - t0)))
    k0, k1, k2, k3 = keys[max(0, i - 1)][1], keys[i][1], keys[i + 1][1], keys[min(n - 1, i + 2)][1]

    def cr(p0, p1, p2, p3):
        m = max(len(p0), len(p1), len(p2), len(p3))
        f = lambda v: tuple(v) + (0,) * (m - len(v))
        p0, p1, p2, p3 = f(p0), f(p1), f(p2), f(p3)
        out = []
        for j in range(m):
            if j in step_idx:
                out.append(p1[j] if u < 1.0 else p2[j])
                continue
            a0, a1, a2, a3 = p0[j], p1[j], p2[j], p3[j]
            out.append(0.5 * (2 * a1 + (-a0 + a2) * u + (2 * a0 - 5 * a1 + 4 * a2 - a3) * u * u + (-a0 + 3 * a1 - 3 * a2 + a3) * u ** 3))
        return tuple(out)

    if isinstance(k1, dict):
        bones = set(k0) | set(k1) | set(k2) | set(k3)
        z = (0, 0, 0)
        return {bn: cr(k0.get(bn, k1.get(bn, z)), k1.get(bn, z), k2.get(bn, z), k3.get(bn, k2.get(bn, z))) for bn in bones}
    return cr(k0, k1, k2, k3)


# ── 던지기 (원본 throw 14컷, 약 1.1초). 등 뒤에서 본 흐름:
#   0~1 서 있음 → 2 오른팔을 옆·뒤로 낮게 뺌 → 3 옆으로 수평 → 4 팔꿈치 어깨 높이·주먹이 어깨 위
#   → 5 폭탄을 머리 위 옆까지 → 6 몸을 왼쪽으로 확 틀며 앞으로 놓음 → 7~13 팔로스루 유지(오른어깨가 앞으로, 왼팔은 비스듬히 아래)
# 몸통 Y+ = 오른어깨가 앞으로(실측). 손 위치는 월드(서 있는 자세, 캐릭터는 -Y를 봄, 오른쪽 = -X).
THROW_T = (0.0, 0.11, 0.19, 0.28, 0.36, 0.44, 0.53, 0.82, 1.0)
THROW_BODY = [
    {"chest": (0, 0, 0), "spine": (0, 0, 0), "head": (0, 0, 0)},
    {"chest": (0, -18, 0), "spine": (0, -8, 0), "head": (0, 16, 0)},
    {"chest": (-2, -24, 0), "spine": (0, -10, 0), "head": (0, 20, 0)},
    {"chest": (-4, -24, 0), "spine": (-2, -10, 0), "head": (0, 18, 0)},
    {"chest": (-7, -18, 0), "spine": (-4, -8, 0), "head": (-4, 14, 0)},
    {"chest": (10, 22, 0), "spine": (6, 10, 0), "head": (-6, -14, 0)},
    {"chest": (12, 30, 0), "spine": (6, 12, 0), "head": (-4, -18, 0)},
    {"chest": (9, 26, 0), "spine": (4, 10, 0), "head": (-2, -14, 0)},
    {"chest": (0, 0, 0), "spine": (0, 0, 0), "head": (0, 0, 0)},
]
# 디딤: 들어 올릴 때 오른발에 무게, 놓을 때 왼발을 앞으로 디딤 (다리 벌림 ±6)
THROW_LEGS = [
    {"thigh.L": (0, 0, 3), "thigh.R": (0, 0, -3), "hips": (0, 0, 0, 0)},
    {"thigh.L": (-3, 0, 6), "thigh.R": (3, 0, -6), "hips": (0, 0, 0, -0.005)},
    {"thigh.L": (-5, 0, 7), "thigh.R": (5, 0, -6), "shin.R": (-6, 0, 0), "hips": (0, 0, 0, -0.01)},
    {"thigh.L": (-6, 0, 7), "thigh.R": (6, 0, -6), "shin.R": (-10, 0, 0), "hips": (0, 0, 0, -0.012)},
    {"thigh.L": (-4, 0, 7), "thigh.R": (6, 0, -6), "shin.R": (-10, 0, 0), "hips": (0, 0, 0, -0.012)},
    {"thigh.L": (18, 0, 7), "shin.L": (-8, 0, 0), "thigh.R": (-12, 0, -6), "shin.R": (-18, 0, 0), "hips": (0, 0, 0, -0.03)},
    {"thigh.L": (16, 0, 7), "shin.L": (-8, 0, 0), "thigh.R": (-10, 0, -6), "shin.R": (-14, 0, 0), "hips": (0, 0, 0, -0.025)},
    {"thigh.L": (12, 0, 6), "shin.L": (-6, 0, 0), "thigh.R": (-8, 0, -5), "shin.R": (-10, 0, 0), "hips": (0, 0, 0, -0.018)},
    {"thigh.L": (0, 0, 3), "thigh.R": (0, 0, -3), "hips": (0, 0, 0, 0)},
]
# (손 위치, 팔꿈치 방향)
THROW_HANDS = [
    {"R": ((-0.39, -0.12, 0.66), (-0.3, 0.6, 0.0)), "L": ((0.39, -0.12, 0.66), (0.3, 0.6, 0.0))},
    {"R": ((-0.46, 0.14, 0.84), (-0.2, 0.4, -1.0)), "L": ((0.30, -0.16, 0.80), (0.5, 1.0, -0.3))},
    {"R": ((-0.62, 0.18, 1.06), (0.0, 0.4, -1.0)), "L": ((0.40, -0.20, 0.90), (0.6, 1.0, -0.3))},
    {"R": ((-0.52, 0.20, 1.38), (-0.5, 0.1, -1.0)), "L": ((0.58, -0.14, 1.04), (0.0, 0.4, -1.0))},
    {"R": ((-0.48, 0.22, 1.52), (-0.6, -0.1, -1.0)), "L": ((0.62, -0.06, 1.08), (0.0, 0.4, -1.0))},
    {"R": ((-0.06, -0.50, 1.28), (-1.0, 0.0, -0.5)), "L": ((0.48, 0.12, 0.80), (0.3, 1.0, 0.0))},
    {"R": ((0.10, -0.36, 0.92), (-0.8, -0.2, -0.4)), "L": ((0.50, 0.12, 0.78), (0.3, 1.0, 0.0))},
    {"R": ((0.06, -0.34, 0.88), (-0.8, -0.2, -0.4)), "L": ((0.48, 0.10, 0.76), (0.3, 1.0, 0.0))},
    {"R": ((-0.39, -0.12, 0.66), (-0.3, 0.6, 0.0)), "L": ((0.39, -0.12, 0.66), (0.3, 0.6, 0.0))},
]
THROW_RELEASE = 0.44  # 이 순간 폭탄이 손을 떠난다
THROW_RELOAD = 0.96   # 다음 폭탄이 손에 잡힘


def throw_bomb(t):
    return (0, 0, 0, 0, HIDE if THROW_RELEASE <= t < THROW_RELOAD else SHOW)


def throw_hands(t):
    out = {}
    for s in ("R", "L"):
        h = catmull([(tt, k[s][0]) for tt, k in zip(THROW_T, THROW_HANDS)], t)
        d = catmull([(tt, k[s][1]) for tt, k in zip(THROW_T, THROW_HANDS)], t)
        out[s] = (h, d)
    return out


def throw_pose(t):
    p = base_stand()
    p.update(catmull(list(zip(THROW_T, THROW_BODY)), t))
    p.update(catmull(list(zip(THROW_T, THROW_LEGS)), t))
    p["bomb"] = throw_bomb(t)
    return p


def shoot2_keys():
    """총쏘기2 (원본 test_clips/shoot, 6컷 약 0.5초 단발). 큰 단발총을 두 팔을 앞으로 뻗어 가슴 높이에 든다.
    쏜 직후: 총구가 튀고 상체가 뒤로 → 무릎을 굽혀 반동을 받아 냄(엉덩이 5cm, 발은 바닥에) → 다시 조준.
    팔은 IK(shoot2_hands), 여기는 몸·다리만."""
    def legs(a, drop):
        # 무릎 굽힘 a도: 허벅지 앞 a, 정강이 뒤 2a, 발 a(바닥과 평행). drop = 발이 뜨지 않게 내리는 엉덩이(실측)
        return {"thigh.L": (a, 0, 8), "thigh.R": (a, 0, -8), "shin.L": (-2 * a, 0, 0), "shin.R": (-2 * a, 0, 0),
                "foot.L": (a, 0, 0), "foot.R": (a, 0, 0), "hips": (0, 0, 0, -drop)}
    aim = {"chest": (4, -10, 0), "spine": (2, -4, 0), "head": (4, 8, 0), "rifle": (0, 0, 0, 0, SHOW)}
    aim.update(legs(5, 0.003))
    kick = dict(aim)
    kick.update({"chest": (-12, -13, 0), "spine": (-5, -4, 0), "head": (-6, 8, 0)})
    kick.update(legs(9, 0.009))
    squat = dict(aim)
    squat.update({"chest": (10, -10, 0), "spine": (5, -4, 0), "head": (10, 8, 0)})
    squat.update(legs(22, 0.048))
    return [(0.0, aim), (0.06, kick), (0.2, squat), (0.3, squat), (0.62, aim), (1.0, aim)]


# 손(월드, 서 있는 자세 기준)과 총열 방향 — 같은 시각표
SHOOT2_HANDS = [
    (0.0, {"R": (-0.07, -0.35, 1.06), "d": (0.03, -1.0, 0.0)}),
    (0.06, {"R": (-0.07, -0.29, 1.11), "d": (0.03, -1.0, 0.28)}),
    (0.2, {"R": (-0.07, -0.36, 1.04), "d": (0.03, -1.0, -0.04)}),
    (0.3, {"R": (-0.07, -0.36, 1.04), "d": (0.03, -1.0, -0.04)}),
    (0.62, {"R": (-0.07, -0.35, 1.06), "d": (0.03, -1.0, 0.0)}),
    (1.0, {"R": (-0.07, -0.35, 1.06), "d": (0.03, -1.0, 0.0)}),
]


def shoot2_pose(t):
    p = base_stand()
    p.update(blend_keys(t, shoot2_keys()))
    return p


def shoot2_hands(t):
    k = blend_keys(t, SHOOT2_HANDS)
    return {
        "R": (k["R"], (-1.0, 0.3, -0.8)),
        "L": ("grip:rifle", (0.6, 0.0, -1.0)),
        "aim": {"rifle": k["d"]},
    }


UPPER = ("upperarm.L", "upperarm.R", "forearm.L", "forearm.R", "chest", "head", "gun", "rifle", "bomb")


def walk_upper(t, upper):
    """아래는 걷기, 위는 upper 포즈. 걷기의 몸통 흔들림은 반만 남긴다."""
    p = walk_pose(t)
    for b, v in upper.items():
        if b in UPPER:
            p[b] = v
    s = p["spine"]
    p["spine"] = (s[0], s[1] + upper.get("spine", (0, 0, 0))[1], s[2] * 0.5)
    return p


def walk_shoot_pose(t):
    # 걸으며 기관총: 한 걸음 사이클(1.0초)에 반동 네 번
    return walk_upper(t, mg_upper(mg_recoil(t, 4)))


def walk_shoot_hands(t):
    return mg_hands(mg_recoil(t, 4))


def walk_throw_pose(t):
    upper = catmull(list(zip(THROW_T, THROW_BODY)), t)
    upper = {k: tuple(v2 * 0.7 for v2 in v) for k, v in upper.items()}  # 걸으며 던질 땐 몸 비틀기를 줄인다
    upper["bomb"] = throw_bomb(t)
    return walk_upper(t, upper)


def walk_gun_pose(t):
    # 총을 오른손에 낮게 들고 걷기 (쏘지 않음)
    p = walk_pose(t)
    p["upperarm.R"] = (18, 0, -8)
    p["forearm.R"] = (-40, 0, 0)
    p["gun"] = (0, 0, 0, 0, SHOW)
    return p
