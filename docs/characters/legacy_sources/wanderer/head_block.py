# body_front_ab.py 안에서 exec. 블록형 큰 머리 + 픽셀 얼굴(표정 교체) + A/B 머리카락.
# 그룩봇 지시 1 (2026-09-24): 얼굴은 모델에서 뽑지 않고 머리 앞면에 16칸 픽셀로 찍는다.
#
# 격자: 얼굴 한 칸 = FACE_CELL. 머리 상자는 가로 16칸 · 세로 15칸 · 깊이 13칸.
#  유닛 랩(CharacterLab.ts)은 머리 뼈만 이 칸 크기로, 얼굴 판 모서리에 격자를 맞춰 쌓는다
#  → 얼굴 픽셀 한 칸 = 블록 한 칸 (어떤 블록 크기를 골라도 얼굴이 깨지지 않는다).
# 표정: face_default · face_smile · face_determined · face_surprised (판 4장, 툴에서 하나만 켠다)
# 좌표: 마지막(2.5등신 재조형 후) 월드 좌표로 바로 만든다 → reshape 대상 아님.

FACE_CELL = 0.045
FW, FH, FD = 16, 15, 13          # 머리 상자 칸 수 (가로·세로·깊이)
NECK_TOP = 1.2                  # 재조형 후 머리 뼈 시작 높이

HEAD_BOT = NECK_TOP + 0.05    # 턱 아래로 스카프가 보이게 살짝 올림
FACE_Y = -0.02 - FD * FACE_CELL / 2   # 얼굴 판(앞면) y. 캐릭터 앞 = -Y
HX = FW * FACE_CELL / 2
HZ0, HZ1 = HEAD_BOT, HEAD_BOT + FH * FACE_CELL
HCZ = (HZ0 + HZ1) / 2

# ── 팔레트 (4비트 양자화에도 그대로 남게 17의 배수) ─────────────
COL.update({
    "skin": "#ffddbb",
    "skin_low": "#eeccaa",
    "face_eye": "#221122",
    "face_hi": "#ffffff",
    "face_cheek": "#ff99aa",
    "face_mouth": "#aa4444",
    "face_mouth_in": "#ee7777",
})

HAIR = {
    # A안: 먹색 남색 2톤 + 청록 줄 하나
    "A": {"top": "#223355", "base": "#223344", "low": "#112233", "line": "#33aaaa"},
    # B안: 크림 → 연민트 (위에서 아래로 3톤) + 청록 잎 핀
    "B": {"top": "#ffeecc", "base": "#ddeedd", "low": "#aaddcc", "line": "#ffeecc",
          "leaf": "#22aa99", "leaf_dark": "#118877"},
}[VARIANT]
COL.update({f"hair_{k}": v for k, v in HAIR.items()})

# ── 표정 (16 × 15, 위에서부터 한 줄씩). 기호: . 투명 · K 눈 · W 하이라이트 · P 볼 · M 입 · m 입 안 · s 아래 그늘
#  맨 위 5줄은 앞머리가 덮는다. 눈 2×3, 볼 2×1, 입 2칸(웃음 3칸 느낌).
_EMPTY = "................"
FACES = {
    "default": [
        _EMPTY, _EMPTY, _EMPTY, _EMPTY, _EMPTY, _EMPTY, _EMPTY,
        "...KW......KW...",
        "...KK......KK...",
        "...KK......KK...",
        ".PP..........PP.",
        ".......MM.......",
        _EMPTY, _EMPTY,
        "ssssssssssssssss",
    ],
    "smile": [
        _EMPTY, _EMPTY, _EMPTY, _EMPTY, _EMPTY, _EMPTY, _EMPTY, _EMPTY,
        "...KK......KK...",
        "..K..K....K..K..",
        ".PP..........PP.",
        "......M..M......",
        ".......MM.......",
        _EMPTY,
        "ssssssssssssssss",
    ],
    "determined": [
        _EMPTY, _EMPTY, _EMPTY, _EMPTY, _EMPTY, _EMPTY, _EMPTY,
        "....K......K....",
        "...KK......KK...",
        "...WK......KW...",
        ".PP..........PP.",
        "......MMMM......",
        _EMPTY, _EMPTY,
        "ssssssssssssssss",
    ],
    "surprised": [
        _EMPTY, _EMPTY, _EMPTY, _EMPTY, _EMPTY, _EMPTY,
        "...KK......KK...",
        "..KWKK....KWKK..",
        "..KKKK....KKKK..",
        "...KK......KK...",
        ".PP..........PP.",
        ".......MM.......",
        ".......mm.......",
        _EMPTY,
        "ssssssssssssssss",
    ],
}
FACE_KEY = {"K": "face_eye", "W": "face_hi", "P": "face_cheek", "M": "face_mouth", "m": "face_mouth_in", "s": "skin_low"}


def _hex_rgba(h):
    h = h.lstrip("#")
    return [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)] + [1.0]


def face_image(name, rows):
    assert len(rows) == FH and all(len(r) == FW for r in rows), name
    img = bpy.data.images.new(f"face_{name}", FW, FH, alpha=True)
    px = []
    for r in reversed(rows):  # Blender 이미지는 아래 줄부터
        for ch in r:
            px += _hex_rgba(COL[FACE_KEY[ch]]) if ch in FACE_KEY else [0, 0, 0, 0]
    img.pixels = px
    img.alpha_mode = "STRAIGHT"
    out_png = os.path.join(OUT, f"face_{name}.png")
    img.filepath_raw = out_png
    img.file_format = "PNG"
    img.save()
    img.pack()
    return img


def face_material(name, img):
    m = bpy.data.materials.new(f"face_{name}")
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    b.inputs["Roughness"].default_value = 0.8
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = img
    tex.interpolation = "Closest"
    nt.links.new(tex.outputs["Color"], b.inputs["Base Color"])
    nt.links.new(tex.outputs["Alpha"], b.inputs["Alpha"])
    try:
        m.surface_render_method = "DITHERED"
    except Exception:
        pass
    try:
        m.blend_method = "CLIP"
    except Exception:
        pass
    return m


def face_plane(name):
    """머리 앞면에 붙는 얼굴 판. UV (0,0)=왼아래(Blender) → glTF에선 (0,1)=왼아래, (0,0)=왼위."""
    img = face_image(name, FACES[name])
    bm = bmesh.new()
    y = FACE_Y
    # 보는 사람 기준 왼쪽 = -X (앞에서 볼 때)
    v = [bm.verts.new(p) for p in ((-HX, y, HZ0), (HX, y, HZ0), (HX, y, HZ1), (-HX, y, HZ1))]
    f = bm.faces.new(v)  # (-X,아래)→(+X,아래)→(+X,위): 법선 = -Y (앞)
    uv = bm.loops.layers.uv.new("UVMap")
    for lp in f.loops:
        co = lp.vert.co
        lp[uv].uv = (0 if co.x < 0 else 1, 0 if co.z < HCZ else 1)
    ob = from_bm(f"face_{name}", bm)
    ob.data.materials.append(face_material(name, img))
    return ob


def hbox(name, x0, x1, y0, y1, z0, z1, material, bevel=0.18, subsurf=1):
    """칸 좌표(머리 격자)로 둥근 상자. x: -8..8 (칸), y: 0=얼굴 앞면, +는 뒤, z: 0=머리 밑."""
    c = FACE_CELL
    # 면이 격자선 위에 딱 걸리면 칸이 들쭉날쭉해진다 → 안쪽으로 살짝 민다.
    # 격자선: x·z는 정수 칸, y는 반 칸(얼굴 판이 칸 가운데)
    def safe(a, b, half):
        def f(v, inward):
            g = v - (0.5 if half else 0.0)
            return v + 0.12 * inward if abs(g - round(g)) < 0.08 else v
        return f(a, 1), f(b, -1)
    x0, x1 = safe(x0, x1, False)
    y0, y1 = safe(y0, y1, True)
    z0, z1 = safe(z0, z1, False)
    lo = Vector((x0 * c, FACE_Y + y0 * c, HZ0 + z0 * c))
    hi = Vector((x1 * c, FACE_Y + y1 * c, HZ0 + z1 * c))
    return rbox(name, tuple((lo + hi) / 2), tuple(hi - lo), material, bevel=bevel, subsurf=subsurf)


def cpt(x, y, z):
    """칸 좌표 → 월드 (x: 0=가운데, y: 0=얼굴 앞면·+뒤, z: 0=머리 밑)."""
    return Vector((x * FACE_CELL, FACE_Y + y * FACE_CELL, HZ0 + z * FACE_CELL))


def hair_shell(name, bands, center, rad, cut, thick=1.1):
    """둥근 머리카락 껍데기(타원체)를 높이 띠별 재질로 나눠 만든다.
    bands = [(z_lo, z_hi, material)] (칸) · cut(x, y, z) → True면 그 면을 지운다(얼굴 앞 등)."""
    out = []
    for k, (z0, z1, material) in enumerate(bands):
        ob = ellipsoid(f"{name}{k}", tuple(cpt(*center)), tuple(r * FACE_CELL for r in rad), material, seg=36, subsurf=0)
        bm = bmesh.new()
        bm.from_mesh(ob.data)
        kill = []
        for f in bm.faces:
            m = f.calc_center_median()
            x, y, z = m.x / FACE_CELL, (m.y - FACE_Y) / FACE_CELL, (m.z - HZ0) / FACE_CELL
            if cut(x, y, z) or not (z0 <= z < z1):
                kill.append(f)
        bmesh.ops.delete(bm, geom=kill, context="FACES")
        bm.to_mesh(ob.data)
        bm.free()
        so = ob.modifiers.new("th", "SOLIDIFY")
        so.thickness = thick * FACE_CELL
        so.offset = -1
        bpy.context.view_layer.objects.active = ob
        bpy.ops.object.modifier_move_to_index(modifier="th", index=0)
        sub = ob.modifiers.get("sub") or ob.modifiers.new("sub", "SUBSURF")
        sub.levels = 1
        sub.render_levels = 1
        out.append(ob)
    return out


def spike(name, top, tip, r, material, flat=0.45):
    """뾰족한 머리 다발 (위 굵고 끝 뾰족). flat = 두께 방향(y) 비율."""
    return taper(name, tuple(cpt(*top)), tuple(cpt(*tip)), r * FACE_CELL, 0.12 * FACE_CELL, material, seg=10,
                 squash=(1, flat), subsurf=1)


def build_head_block():
    P = []
    c = FACE_CELL
    # ── 머리 상자: 격자 경계선에 면이 걸리지 않게 0.1칸씩 안으로 · 앞면은 얼굴 판 바로 뒤(같은 칸)
    # 뒤쪽은 머리카락이 덮으니 얕게 (모서리가 머리카락 밖으로 삐져나오지 않게)
    P.append((hbox("head", -7.9, 7.9, 0.07, 7.4, 0.1, 12.9, "skin", bevel=0.2), "head"))
    P.append((taper("neck_ab", (0, 0, 1.14), (0, 0, HZ0 + 0.06), 0.07, 0.07, "skin", seg=10), "head"))

    # ── 얼굴 판 4장 (glb엔 다 들어 있고 툴에서 하나만 켠다)
    for nm in FACES:
        P.append((face_plane(nm), "head"))

    T, B_, L = "hair_top", "hair_base", "hair_low"
    # ── 머리카락 껍데기: 머리를 덮는 둥근 덩어리. 얼굴 앞(이마 아래)은 뚫는다 → 옆·뒤는 볼까지 내려와 옆머리가 된다
    def cut(x, y, z):
        front = y < 4.5
        if front and abs(x) < 8.2 and z < 10.4:
            return True   # 얼굴
        return z < (3.0 if front else 0.4)
    for ob in hair_shell("hair_shell", [(12.5, 99, T), (8.0, 12.5, B_), (-9, 8.0, L)],
                         (0, 5.8, 8.2), (10.6, 9.0, 10.0), cut):
        P.append((ob, "head"))

    # ── 앞머리: 이마를 덮는 판 + 아래로 뾰족한 톱니 (눈 위는 짧게, 사이·바깥은 길게)
    P.append((hbox("hair_bangs", -8.9, 8.9, -1.4, 3.0, 9.7, 13.6, T, bevel=0.5, subsurf=2), "head"))
    for i, (x, tip, w) in enumerate(((-7.2, 5.8, 2.4), (-4.1, 8.5, 2.5), (-1.1, 6.8, 2.5), (1.8, 8.9, 2.3), (4.6, 8.4, 2.5), (7.4, 5.2, 2.4))):
        P.append((spike(f"hair_bang{i}", (x, -1.0, 10.6), (x + (0.5 if x < 0 else -0.5), -1.1, tip), w, B_ if i % 2 else T), "head"))
    # 옆머리 끝 (볼 옆, 바깥으로 살짝)
    for sx, nm in ((1, "L"), (-1, "R")):
        P.append((spike(f"hair_side_{nm}", (8.9 * sx, 1.2, 6.0), (9.6 * sx, 0.4, 1.4), 2.2, L, flat=0.7), "head"))
        P.append((spike(f"hair_side2_{nm}", (9.6 * sx, 4.2, 5.0), (10.4 * sx, 4.8, 1.6), 2.2, L, flat=0.7), "head"))
    # 뒷머리 끝: 목덜미 쪽으로 뾰족한 다발 셋
    for i, x in enumerate((-5.0, 0.0, 5.0)):
        P.append((spike(f"hair_nape{i}", (x, 13.2, 2.6), (x * 1.1, 13.6, -1.8 if i == 1 else -0.9), 2.6, L, flat=0.6), "head"))

    # ── 큰 삐침(아호게): 정수리에서 위로 솟았다가 앞으로 꺾여 내려온다
    a0, a1, a2 = cpt(0, 5.2, 17.4), cpt(0.3, 4.2, 22.4), cpt(0.7, 1.2, 21.0)
    P.append((taper("hair_ahoge0", tuple(a1), tuple(a0), 0.9 * c, 1.2 * c, T, seg=10, squash=(1, 0.8)), "head"))
    P.append((taper("hair_ahoge1", tuple(a1 + (a1 - a2).normalized() * 0.4 * c), tuple(a2), 0.9 * c, 0.25 * c, T, seg=10, squash=(1, 0.8)), "head"))

    if VARIANT == "A":
        # 청록 줄 하나: 껍데기를 두르는 띠 (앞머리 위를 가로지른다)
        zc = 13.2
        k = math.sqrt(max(0.0, 1 - ((zc - 8.2) / 10.0) ** 2))
        P.append((torus("hair_line", tuple(cpt(0, 5.8, zc)), 1.0, 0.42 * c, "hair_line",
                        scale=(10.6 * k * c + 0.3 * c, 9.0 * k * c + 0.3 * c, 1), seg=48), "head"))
    else:
        # 청록 잎 핀: 앞머리 보는 사람 기준 오른쪽(+X) 위
        # 잎: 비스듬한 긴 타원 + 짧은 꼭지 (블록으로 쌓으면 대각선 계단 잎)
        P.append((ellipsoid("pin_leaf", tuple(cpt(4.9, -1.8, 11.9)), (2.1 * c, 0.35 * c, 0.85 * c), "hair_leaf",
                            seg=14, rot=(0, math.radians(-35), 0), subsurf=0), "head"))
        P.append((taper("pin_stem", tuple(cpt(3.0, -1.9, 10.6)), tuple(cpt(2.2, -1.9, 10.0)), 0.3 * c, 0.3 * c, "hair_leaf_dark", seg=6), "head"))
    return P
