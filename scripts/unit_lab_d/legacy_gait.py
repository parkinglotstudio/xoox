def idle_pose(t):
    # 숨쉬기: 들숨에 가슴·어깨가 오르고 배낭이 한 박자 늦게 따라온다 (스프라이트 13컷, 가운데 길게 멈춤)
    b = (1 - C(t * TAU)) / 2  # 0→1→0
    lag = (1 - C((t - 0.08) * TAU)) / 2
    return {
        "root": (0, 0, 0, 0),
        "hips": (0, 0, 0, 0.004 * b),
        "spine": (-1.2 * b, 0, 0),
        "chest": (-1.8 * b, 0, 0.6 * S(t * TAU)),
        "head": (2.0 * b, 0, -1.0 * S(t * TAU)),
        "pack": (1.5 * lag, 0, 0),
        "upperarm.L": (2 * b, 0, 5 + 1.5 * b),
        "upperarm.R": (2 * b, 0, -5 - 1.5 * b),
        "forearm.L": (-6, 0, 0),
        "forearm.R": (-6, 0, 0),
        "thigh.L": (0, 0, 1),
        "thigh.R": (0, 0, -1),
        "shin.L": (0, 0, 0),
        "shin.R": (0, 0, 0),
        "foot.L": (0, 0, 0),
        "foot.R": (0, 0, 0),
    }

def gait(t, stride, knee, arm_sw, elbow, bob, lean, lift):
    """걷기·뛰기 공통 보행. t: 0..1 한 사이클(왼발 → 오른발)."""
    ph = t * TAU
    sL = S(ph)          # 왼 다리 앞(+) / 뒤(-)
    sR = S(ph + math.pi)
    # 무릎: 다리가 뒤에서 앞으로 넘어올 때 크게 굽힌다
    kL = knee * max(0.0, S(ph + math.pi * 0.35)) + 6
    kR = knee * max(0.0, S(ph + math.pi * 1.35)) + 6
    up = bob * abs(S(ph))  # 한 사이클에 두 번 튄다
    return {
        "root": (0, 0, 0, 0),
        "hips": (0, 0, 4 * sL, up),
        "spine": (lean * 0.5, 0, -3 * sL),
        "chest": (lean * 0.5, 0, -5 * sL),
        "head": (-lean * 0.8, 0, 3 * sL),
        "pack": (2 * abs(S(ph)), 0, 2 * sL),
        # 다리: 뼈가 아래를 향하므로 X 회전 +는 발이 앞(-Y)으로
        "thigh.L": (stride * sL + lift * max(0, sL), 0, 1),
        "thigh.R": (stride * sR + lift * max(0, sR), 0, -1),
        "shin.L": (-kL, 0, 0),
        "shin.R": (-kR, 0, 0),
        "foot.L": (0.35 * kL - 8 * sL, 0, 0),
        "foot.R": (0.35 * kR - 8 * sR, 0, 0),
        # 팔은 반대 다리와 함께 (왼팔 = 오른다리)
        "upperarm.L": (arm_sw * sR, 0, 7),
        "upperarm.R": (arm_sw * sL, 0, -7),
        "forearm.L": (-elbow - 0.3 * elbow * max(0, sR), 0, 0),
        "forearm.R": (-elbow - 0.3 * elbow * max(0, sL), 0, 0),
    }

def walk_pose(t):
    return gait(t, stride=24, knee=34, arm_sw=20, elbow=18, bob=0.018, lean=3, lift=4)

def run_pose(t):
    # 스프라이트 move: 몸을 숙이고 무릎을 높이, 팔꿈치 90도 가까이 굽혀 크게 흔든다
    return gait(t, stride=40, knee=118, arm_sw=50, elbow=80, bob=0.045, lean=14, lift=22)
