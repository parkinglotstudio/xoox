# body_front*.py 안에서 exec. 총 두 자루 (재조형 뒤 좌표로 만든다 — 재조형의 높이 압축에 짜부라지지 않게).
#   gun   = 기관총 (쏘기 루프·쏘며 걷기·총 들고 걷기). 약 40cm
#   rifle = 단발 큰 총 (총쏘기2). 약 66cm
# 표준 좌표: 손잡이 = 원점(손), 총열 = +Y, 윗면 = +Z, 옆 = X.
# 쉴 때 손은 아래를 보므로 총열 = 뼈 방향(아래), 윗면 = 앞(-Y) → 팔을 앞으로 들면 윗면이 위로 온다.
# 어두운 몸통 + 청록 발광: 흰 털·크림 옷 위에서 총이 묻히지 않게.

COL.update({
    "gun_dark": "#2c3542",
    "gun_mid": "#56657a",
    "gun_teal": "#2fb9b0",
    "gun_glow": "#7dffee",
    "gun_warn": "#ff9a3c",
    "bomb": "#39c6b8",
})

PROP_M4 = {}      # 소품 → 표준 좌표 → 월드(쉴 때)
PROP_GRIP = {     # 왼손이 잡는 곳 (표준 좌표)
    "gun": Vector((0.0, 0.1, -0.03)),
    "rifle": Vector((0.0, 0.08, -0.04)),
}


PROP_SCALE = {"gun": 1.25, "rifle": 1.15}  # 읽히는 크기 (기관총 약 50cm, 단발 약 76cm)


def _prop_frame(bone):
    h, t, _ = BONES[bone]
    H, T = Vector(h), Vector(t)
    a = (T - H).normalized()                 # 총열
    up = Vector((0, -1, 0))                  # 윗면(쉴 때 앞)
    up = (up - a * up.dot(a)).normalized()
    s = a.cross(up).normalized()             # X = Y × Z
    m = Matrix((
        (s.x, a.x, up.x, H.x),
        (s.y, a.y, up.y, H.y),
        (s.z, a.z, up.z, H.z),
        (0, 0, 0, 1),
    ))
    return m @ Matrix.Scale(PROP_SCALE.get(bone, 1.0), 4)


def _place(objs, m):
    for o in objs:
        o.matrix_world = m @ o.matrix_world


def build_machine_gun():
    parts = [
        rbox("mg_grip", (0, 0.0, -0.01), (0.042, 0.05, 0.085), "gun_dark", bevel=0.3),
        rbox("mg_body", (0, 0.07, 0.055), (0.075, 0.27, 0.085), "gun_mid", bevel=0.3),
        rbox("mg_rail", (0, 0.07, 0.103), (0.022, 0.22, 0.014), "gun_glow", bevel=0.3),
        rbox("mg_stock", (0, -0.065, 0.045), (0.05, 0.06, 0.06), "gun_dark", bevel=0.3),
        ellipsoid("mg_drum", (0, 0.12, -0.015), (0.045, 0.05, 0.05), "gun_teal", seg=14),
        taper("mg_barrel", (0, 0.2, 0.06), (0, 0.36, 0.06), 0.024, 0.02, "gun_dark", seg=12),
        torus("mg_ring", (0, 0.3, 0.06), 0.028, 0.008, "gun_glow", rot=(math.radians(90), 0, 0)),
        ellipsoid("mg_tip", (0, 0.365, 0.06), (0.024, 0.014, 0.024), "gun_glow", seg=12),
        rbox("mg_warn", (0.039, 0.02, 0.055), (0.004, 0.05, 0.03), "gun_warn", bevel=0.2),
    ]
    # torus는 XY 평면 고리 → 총열(Y)을 감싸게 X축으로 90° 돌린다(rot)
    bpy.context.view_layer.update()
    m = _prop_frame("gun")
    PROP_M4["gun"] = m
    _place(parts, m)
    return [(o, "gun") for o in parts]


def build_rifle():
    parts = [
        rbox("rf_grip", (0, 0.0, -0.015), (0.046, 0.055, 0.095), "gun_dark", bevel=0.3),
        rbox("rf_body", (0, 0.1, 0.06), (0.085, 0.34, 0.1), "gun_mid", bevel=0.3),
        rbox("rf_stock", (0, -0.1, 0.045), (0.06, 0.1, 0.085), "gun_dark", bevel=0.3),
        rbox("rf_fore", (0, 0.08, -0.03), (0.04, 0.05, 0.07), "gun_dark", bevel=0.3),
        ellipsoid("rf_cell", (0, 0.2, 0.01), (0.05, 0.07, 0.04), "gun_teal", seg=14),
        taper("rf_scope", (0, 0.0, 0.145), (0, 0.19, 0.145), 0.03, 0.03, "gun_dark", seg=12),
        ellipsoid("rf_lens", (0, 0.195, 0.145), (0.026, 0.01, 0.026), "gun_glow", seg=12),
        taper("rf_barrel", (0, 0.27, 0.07), (0, 0.56, 0.07), 0.03, 0.025, "gun_dark", seg=12),
        rbox("rf_brake", (0, 0.575, 0.07), (0.07, 0.05, 0.06), "gun_mid", bevel=0.3),
        ellipsoid("rf_tip", (0, 0.605, 0.07), (0.028, 0.014, 0.028), "gun_glow", seg=12),
        rbox("rf_warn", (0.044, 0.02, 0.06), (0.004, 0.07, 0.035), "gun_warn", bevel=0.2),
        rbox("rf_stripe", (0, 0.12, 0.112), (0.024, 0.28, 0.012), "gun_glow", bevel=0.3),
    ]
    for i, y in enumerate((0.34, 0.41, 0.48)):
        parts.append(torus(f"rf_coil{i}", (0, y, 0.07), 0.034, 0.009, "gun_glow", rot=(math.radians(90), 0, 0)))
    bpy.context.view_layer.update()
    m = _prop_frame("rifle")
    PROP_M4["rifle"] = m
    _place(parts, m)
    return [(o, "rifle") for o in parts]


def build_bomb():
    h = Vector(BONES["bomb"][0])
    return [
        (ellipsoid("bomb_ball", h + Vector((0, -0.01, -0.03)), (0.06, 0.06, 0.06), "bomb", seg=16), "bomb"),
        (torus("bomb_band", h + Vector((0, -0.01, -0.03)), 0.061, 0.009, "cream"), "bomb"),
    ]


def build_props():
    return build_machine_gun() + build_rifle() + build_bomb()
