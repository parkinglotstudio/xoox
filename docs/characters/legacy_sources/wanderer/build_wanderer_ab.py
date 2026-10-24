"""
방랑자 3D (로우폴리 · 입체) — Blender 5.2 배치 스크립트.

참고: data/ui/actor/wanderer/{ingame_idle,move,walk_l}/ 스프라이트 (뒷모습 3인칭).
방식: 액션 피규어처럼 부위(머리·몸통·팔 위/아래·손·허벅지·정강이·발·배낭)를 둥근 메시로 만들고
      각 부위를 뼈에 붙인다(스키닝 없음 → glTF에서 뼈 노드의 자식). 관절은 옷·커프가 덮는다.
애니: idle(1.5초 숨쉬기) · walk(1.0초) · run(0.72초, 스프라이트 12컷×60ms).

실행:  blender -b -P build_wanderer.py -- <출력폴더>
출력:  wanderer.glb (애니 3개) · wanderer.blend · compare_<anim>.png (스프라이트와 나란히)

좌표: Blender Z-up, 캐릭터 앞 = -Y, 등 = +Y (여정 카메라는 등 뒤 +Y에서 본다). 키 1.7m.
"""
import bpy
import bmesh
import math
import os
import random
import sys
from mathutils import Matrix, Vector, Euler

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[0] if argv else os.path.dirname(os.path.abspath(__file__))
# A/B 재디자인 (그룩봇 지시 1): blender -b -P build_wanderer_ab.py -- <출력폴더> A|B [render]
VARIANT = (argv[1] if len(argv) > 1 else "A").upper()
DO_RENDER = "render" in argv[2:]
EYES3D = "eyes3d" in argv[2:]  # 입체 눈 + 고해상도 얼굴 (eyes_3d.py) → 파일 이름 끝 _eye
SUFFIX = "_eye" if EYES3D else ""
os.makedirs(OUT, exist_ok=True)
random.seed(7)

FPS = 30
HIDE = 0.001

# ─── 색 (스프라이트에서 뽑은 sRGB) ──────────────────────
COL = {
    "skin": "#f2c7a2",
    "hair": "#eee8e2",
    "hair_shadow": "#cfc6c0",
    "coat": "#e0782f",
    "coat_dark": "#b95a1f",
    "cream": "#f3e7cf",
    "fur": "#f6f1ea",
    "glove": "#3a2a24",
    "belt": "#6a4128",
    "pouch": "#7b4c2c",
    "shorts": "#4a3428",
    "patch": "#efe9dc",
    "leaf": "#6aa77a",
    "sock": "#1f5d6a",
    "boot": "#5a3a26",
    "sole": "#2f211a",
    "pack": "#5a3d2b",
    "pack_dark": "#3e2a1f",
    "strap": "#6b4a33",
    "clasp": "#43b7b0",
    "roll": "#efe3c8",
    "roll_band": "#8a6446",
    "eye": "#2a2230",
}


def srgb_to_lin(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


MATS = {}


def mat(name):
    if name in MATS:
        return MATS[name]
    h = COL[name].lstrip("#")
    rgb = [srgb_to_lin(int(h[i:i + 2], 16) / 255) for i in (0, 2, 4)]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*rgb, 1)
    b.inputs["Roughness"].default_value = 0.8
    m.diffuse_color = (*rgb, 1)
    MATS[name] = m
    return m


def clear():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for coll in (bpy.data.meshes, bpy.data.materials, bpy.data.armatures, bpy.data.actions, bpy.data.cameras, bpy.data.lights):
        for b in list(coll):
            coll.remove(b)


def link(ob):
    bpy.context.collection.objects.link(ob)
    return ob


def finish(ob, material, subsurf=2, smooth=True):
    ob.data.materials.append(mat(material))
    if subsurf:
        md = ob.modifiers.new("sub", "SUBSURF")
        md.levels = subsurf
        md.render_levels = subsurf
    if smooth:
        for p in ob.data.polygons:
            p.use_smooth = True
    return ob


def from_bm(name, bm):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    return link(bpy.data.objects.new(name, me))


def ellipsoid(name, loc, rad, material, seg=16, rot=(0, 0, 0), subsurf=1):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=max(8, seg // 2), radius=1.0)
    bmesh.ops.scale(bm, vec=Vector(rad), verts=bm.verts)
    bmesh.ops.rotate(bm, matrix=Euler(rot).to_matrix(), verts=bm.verts)
    bmesh.ops.translate(bm, vec=Vector(loc), verts=bm.verts)
    return finish(from_bm(name, bm), material, subsurf)


def rbox(name, loc, size, material, rot=(0, 0, 0), bevel=0.3, subsurf=2):
    """둥근 모서리 상자: 큐브 + 모서리 베벨 + 서브디비전."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.bevel(bm, geom=list(bm.edges), offset=bevel * 0.5, segments=2, affect="EDGES", profile=0.6)
    bmesh.ops.scale(bm, vec=Vector(size), verts=bm.verts)
    bmesh.ops.rotate(bm, matrix=Euler(rot).to_matrix(), verts=bm.verts)
    bmesh.ops.translate(bm, vec=Vector(loc), verts=bm.verts)
    return finish(from_bm(name, bm), material, subsurf)


def taper(name, top, bottom, r_top, r_bot, material, seg=14, squash=(1, 1), subsurf=1, cap=True):
    """두 점 사이 원뿔대(팔·다리·몸통). squash = 단면 (x,y) 비율."""
    a, b = Vector(top), Vector(bottom)
    d = a - b
    L = d.length
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=cap, segments=seg, radius1=r_bot, radius2=r_top, depth=L)
    bmesh.ops.scale(bm, vec=Vector((squash[0], squash[1], 1)), verts=bm.verts)
    q = Vector((0, 0, 1)).rotation_difference(d.normalized())
    bmesh.ops.rotate(bm, matrix=q.to_matrix(), verts=bm.verts)
    bmesh.ops.translate(bm, vec=(a + b) / 2, verts=bm.verts)
    return finish(from_bm(name, bm), material, subsurf)


def torus(name, loc, R, r, material, scale=(1, 1, 1), rot=(0, 0, 0), seg=24):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, major_segments=seg, minor_segments=8,
                                     location=(0, 0, 0))
    ob = bpy.context.active_object
    ob.name = name
    ob.scale = scale
    ob.rotation_euler = rot
    ob.location = loc
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    return finish(ob, material, 1)


def zigzag_band(name, cz, R, height, teeth, material, squash=(1, 1), thick=0.006):
    """옷단 지그재그 무늬 띠 (원통 둘레)."""
    bm = bmesh.new()
    n = teeth * 2
    top, bot = [], []
    for i in range(n + 1):
        a = i / n * math.tau
        z = cz + (height if i % 2 == 0 else 0)
        x, y = math.cos(a) * R * squash[0], math.sin(a) * R * squash[1]
        top.append(bm.verts.new((x, y, z + 0.012)))
        bot.append(bm.verts.new((x, y, z - 0.012)))
    for i in range(n):
        bm.faces.new((bot[i], bot[i + 1], top[i + 1], top[i]))
    ob = from_bm(name, bm)
    s = ob.modifiers.new("th", "SOLIDIFY")
    s.thickness = thick
    s.offset = 1
    return finish(ob, material, 0)


# ─── 뼈대 ─────────────────────────────────────────────
# 이름: (머리, 꼬리, 부모)
BONES = {
    "root": ((0, 0, 0), (0, 0, 0.15), None),
    "hips": ((0, 0, 0.70), (0, 0, 0.82), "root"),
    "spine": ((0, 0, 0.82), (0, 0, 0.98), "hips"),
    "chest": ((0, 0, 0.98), (0, 0, 1.10), "spine"),
    "head": ((0, 0, 1.10), (0, 0, 1.45), "chest"),
    "pack": ((0, 0.16, 0.96), (0, 0.16, 1.12), "chest"),
    "upperarm.L": ((0.19, 0, 1.04), (0.25, 0, 0.84), "chest"),
    "forearm.L": ((0.25, 0, 0.84), (0.285, -0.02, 0.58), "upperarm.L"),
    "upperarm.R": ((-0.19, 0, 1.04), (-0.25, 0, 0.84), "chest"),
    "forearm.R": ((-0.25, 0, 0.84), (-0.285, -0.02, 0.58), "upperarm.R"),
    "thigh.L": ((0.1, 0, 0.70), (0.11, 0, 0.42), "hips"),
    "shin.L": ((0.11, 0, 0.42), (0.11, 0.01, 0.10), "thigh.L"),
    "foot.L": ((0.11, 0.01, 0.10), (0.11, -0.12, 0.05), "shin.L"),
    "thigh.R": ((-0.1, 0, 0.70), (-0.11, 0, 0.42), "hips"),
    "shin.R": ((-0.11, 0, 0.42), (-0.11, 0.01, 0.10), "thigh.R"),
    "foot.R": ((-0.11, 0.01, 0.10), (-0.11, -0.12, 0.05), "shin.R"),
    # 소품: 오른손에 쥔다. 필요한 동작에서만 크기 1 (나머지는 0에 가깝게 숨김)
    "gun": ((-0.285, -0.02, 0.58), (-0.285, -0.02, 0.48), "forearm.R"),
    "rifle": ((-0.285, -0.02, 0.58), (-0.285, -0.02, 0.48), "forearm.R"),
    "bomb": ((-0.285, -0.03, 0.56), (-0.285, -0.03, 0.46), "forearm.R"),
}


def build_armature():
    ad = bpy.data.armatures.new("WandererRig")
    arm = link(bpy.data.objects.new("Wanderer", ad))
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode="EDIT")
    eb = {}
    for name, (h, t, p) in BONES.items():
        b = ad.edit_bones.new(name)
        b.head = h
        b.tail = t
        b.roll = 0
        if p:
            b.parent = eb[p]
            b.use_connect = False
        eb[name] = b
    bpy.ops.object.mode_set(mode="OBJECT")
    for pb in arm.pose.bones:
        pb.rotation_mode = "XYZ"
    return arm


def attach(ob, arm, bone):
    """월드 위치를 유지한 채 뼈에 붙인다."""
    mw = ob.matrix_world.copy()
    ob.parent = arm
    ob.parent_type = "BONE"
    ob.parent_bone = bone
    b = arm.data.bones[bone]
    pm = arm.matrix_world @ b.matrix_local @ Matrix.Translation((0, b.length, 0))
    ob.matrix_parent_inverse = pm.inverted()
    ob.matrix_world = mw


# ─── 몸 ──────────────────────────────────────────────
def build_body(arm):
    P = []  # (object, bone)

    # 머리
    P.append((ellipsoid("head", (0, 0, 1.33), (0.235, 0.225, 0.245), "skin", seg=24), "head"))
    for sx in (1, -1):
        P.append((ellipsoid(f"ear{sx}", (0.225 * sx, 0.01, 1.32), (0.03, 0.045, 0.05), "skin", seg=10), "head"))
        P.append((ellipsoid(f"eye{sx}", (0.075 * sx, -0.205, 1.31), (0.03, 0.02, 0.042), "eye", seg=10), "head"))
    P.append((ellipsoid("nose", (0, -0.235, 1.28), (0.018, 0.015, 0.015), "skin", seg=8), "head"))

    # 머리카락: 두피 덮개 + 삐친 덩어리
    P.append((ellipsoid("hair_cap", (0, 0.02, 1.38), (0.25, 0.245, 0.235), "hair", seg=20), "head"))
    for i in range(46):
        # 위·뒤·옆으로 고르게, 앞머리는 이마 위
        u = random.random()
        az = random.uniform(-math.pi, math.pi)
        el = math.radians(random.uniform(5, 80)) if u > 0.2 else math.radians(random.uniform(-25, 10))
        if abs(az + math.pi / 2) < 0.9 and el < math.radians(20):
            el = math.radians(random.uniform(28, 60))  # 얼굴 앞은 가리지 않게
        d = Vector((math.cos(el) * math.cos(az), math.cos(el) * math.sin(az), math.sin(el)))
        base = Vector((0, 0.02, 1.38)) + Vector((d.x * 0.235, d.y * 0.235, d.z * 0.225))
        tipdir = (d + Vector((0, 0.25, -0.35 if el < 0.6 else 0.15))).normalized()
        L = random.uniform(0.09, 0.16)
        P.append((taper(f"hair{i}", base, base + tipdir * L, 0.006, random.uniform(0.045, 0.065),
                        "hair" if i % 5 else "hair_shadow", seg=8, subsurf=1), "head"))

    # 목
    P.append((taper("neck", (0, 0, 1.13), (0, 0, 1.05), 0.055, 0.06, "skin", seg=10), "chest"))

    # 상의(주황): 가슴 · 배 두 덩어리 + 옷단 지그재그
    P.append((taper("coat_chest", (0, 0, 1.09), (0, 0, 0.92), 0.16, 0.175, "coat", seg=18, squash=(1, 0.78)), "chest"))
    P.append((taper("coat_belly", (0, 0, 0.93), (0, 0, 0.74), 0.175, 0.19, "coat", seg=18, squash=(1, 0.8)), "spine"))
    P.append((zigzag_band("coat_zigzag", 0.79, 0.192, 0.035, 11, "cream", squash=(1, 0.8)), "spine"))
    P.append((torus("coat_hem", (0, 0, 0.745), 0.19, 0.018, "cream", scale=(1, 0.8, 1)), "spine"))
    P.append((torus("collar", (0, 0, 1.09), 0.12, 0.028, "coat_dark", scale=(1, 0.85, 1)), "chest"))

    # 벨트 · 파우치
    P.append((torus("belt", (0, 0, 0.72), 0.185, 0.022, "belt", scale=(1, 0.8, 1)), "hips"))
    for sx in (1, -1):
        P.append((rbox(f"pouch{sx}", (0.19 * sx, 0.02, 0.69), (0.06, 0.09, 0.08), "pouch", bevel=0.4), "hips"))

    # 반바지(풍성) · 패치
    P.append((ellipsoid("shorts_seat", (0, 0.01, 0.66), (0.18, 0.15, 0.1), "shorts", seg=18), "hips"))
    for sx, side in ((1, "L"), (-1, "R")):
        P.append((ellipsoid(f"shorts_{side}", (0.1 * sx, 0.005, 0.56), (0.115, 0.125, 0.14), "shorts", seg=18),
                  f"thigh.{side}"))
        # 등 쪽(+Y) 마름모 패치 + 잎
        P.append((rbox(f"patch_{side}", (0.105 * sx, 0.128, 0.55), (0.07, 0.012, 0.07), "patch",
                       rot=(math.radians(-10), math.radians(45), 0), bevel=0.2, subsurf=1), f"thigh.{side}"))
        P.append((ellipsoid(f"leaf_{side}", (0.105 * sx, 0.136, 0.55), (0.012, 0.004, 0.022), "leaf", seg=8,
                            subsurf=0), f"thigh.{side}"))
        # 앞쪽 패치도
        P.append((rbox(f"patchf_{side}", (0.11 * sx, -0.118, 0.54), (0.06, 0.012, 0.06), "patch",
                       rot=(math.radians(10), math.radians(45), 0), bevel=0.2, subsurf=1), f"thigh.{side}"))

        # 정강이(청록 스타킹)
        P.append((taper(f"shin_{side}", (0.11 * sx, 0.005, 0.46), (0.11 * sx, 0.01, 0.2), 0.052, 0.045, "sock",
                        seg=12), f"shin.{side}"))
        # 부츠: 털 커프 + 몸통 + 앞코 + 밑창
        P.append((torus(f"boot_fur_{side}", (0.11 * sx, 0.01, 0.23), 0.058, 0.03, "fur"), f"shin.{side}"))
        P.append((taper(f"boot_{side}", (0.11 * sx, 0.01, 0.22), (0.11 * sx, 0.01, 0.06), 0.06, 0.068, "boot",
                        seg=14), f"shin.{side}"))
        P.append((ellipsoid(f"toe_{side}", (0.11 * sx, -0.07, 0.055), (0.065, 0.1, 0.055), "boot", seg=14),
                  f"foot.{side}"))
        P.append((rbox(f"sole_{side}", (0.11 * sx, -0.035, 0.014), (0.13, 0.24, 0.028), "sole", bevel=0.5),
                  f"foot.{side}"))

        # 팔: 소매(주황) · 털 커프 · 장갑 팔뚝 · 손
        P.append((ellipsoid(f"shoulder_{side}", (0.175 * sx, 0, 1.04), (0.075, 0.075, 0.07), "coat", seg=14),
                  f"upperarm.{side}"))
        P.append((taper(f"sleeve_{side}", (0.2 * sx, 0, 1.02), (0.245 * sx, 0, 0.86), 0.06, 0.068, "coat", seg=12),
                  f"upperarm.{side}"))
        P.append((zigzag_band(f"sleeve_zz_{side}", 0.0, 0.069, 0.02, 6, "cream"), f"upperarm.{side}"))
        P.append((torus(f"cuff_{side}", (0.248 * sx, 0, 0.855), 0.058, 0.026, "fur",
                        rot=(0, math.radians(-12 * sx), 0)), f"forearm.{side}"))
        P.append((taper(f"forearm_{side}", (0.25 * sx, 0, 0.85), (0.275 * sx, -0.015, 0.7), 0.04, 0.034, "glove",
                        seg=10), f"forearm.{side}"))
        P.append((ellipsoid(f"hand_{side}", (0.282 * sx, -0.02, 0.655), (0.042, 0.038, 0.05), "skin", seg=12),
                  f"forearm.{side}"))
        P.append((ellipsoid(f"glove_back_{side}", (0.282 * sx, -0.005, 0.67), (0.043, 0.03, 0.035), "glove",
                            seg=10), f"forearm.{side}"))

    # 소매 지그재그 위치 보정 (띠를 소매 끝으로)
    for side, sx in (("L", 1), ("R", -1)):
        z = bpy.data.objects[f"sleeve_zz_{side}"]
        z.location = (0.244 * sx, 0, 0.88)

    # 배낭: 몸통 · 뚜껑 · 주머니 2 · 청록 버클 · 끈 · 침낭
    P.append((rbox("pack_body", (0, 0.2, 0.95), (0.34, 0.17, 0.36), "pack", bevel=0.35), "pack"))
    P.append((rbox("pack_lid", (0, 0.215, 1.11), (0.35, 0.18, 0.08), "pack_dark", bevel=0.4), "pack"))
    P.append((rbox("pack_pocket_top", (0, 0.29, 1.0), (0.2, 0.05, 0.1), "pack_dark", bevel=0.4), "pack"))
    P.append((rbox("pack_pocket_bot", (0, 0.29, 0.86), (0.24, 0.06, 0.12), "pack_dark", bevel=0.4), "pack"))
    P.append((rbox("clasp_top", (0, 0.318, 1.02), (0.035, 0.012, 0.045), "clasp", bevel=0.3, subsurf=1), "pack"))
    P.append((rbox("clasp_bot", (0, 0.322, 0.89), (0.035, 0.012, 0.045), "clasp", bevel=0.3, subsurf=1), "pack"))
    for sx in (1, -1):
        P.append((rbox(f"pack_side{sx}", (0.18 * sx, 0.2, 0.9), (0.04, 0.12, 0.16), "pack_dark", bevel=0.4), "pack"))
        P.append((rbox(f"strap{sx}", (0.1 * sx, -0.1, 1.0), (0.04, 0.02, 0.2), "strap",
                       rot=(math.radians(-8), 0, 0), bevel=0.3, subsurf=1), "chest"))
        P.append((rbox(f"strap_top{sx}", (0.1 * sx, 0.03, 1.1), (0.045, 0.2, 0.025), "strap", bevel=0.3, subsurf=1),
                  "chest"))
    roll = taper("bedroll", (0.2, 0.2, 1.19), (-0.2, 0.2, 1.19), 0.062, 0.062, "roll", seg=18, subsurf=1)
    P.append((roll, "pack"))
    for sx in (1, -1):
        P.append((torus(f"roll_band{sx}", (0.1 * sx, 0.2, 1.19), 0.064, 0.01, "roll_band",
                        rot=(0, math.radians(90), 0)), "pack"))

    for ob, bone in P:
        attach(ob, arm, bone)
    return [o for o, _ in P]


# 앞모습(로비)을 반영한 몸으로 덮어쓴다
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "body_front_ab.py"), encoding="utf-8").read())


# ─── 애니 ────────────────────────────────────────────
FLIP_XZ = {"upperarm.L", "upperarm.R", "thigh.L", "thigh.R", "shin.L", "shin.R", "foot.L", "foot.R"}
# 몸통·머리: 실측상 X+ = 앞으로 숙임 → 그대로 둔다
FLIP_X = set()
# 팔뚝: 포즈 값 X-(=팔꿈치 굽힘)가 실제로도 앞으로 굽는 방향 → Z만 맞춘다
FLIP_Z = {"forearm.L", "forearm.R"}


def key_pose(arm, frame, pose):
    """pose: {bone: (rx, ry, rz, [lz])}  각도는 도, lz는 위치 z 오프셋(m)."""
    for name, v in pose.items():
        pb = arm.pose.bones[name]
        rx, ry, rz = v[0], v[1], v[2]
        # 포즈 값의 뜻: X+ = 앞으로(팔·다리) / 앞으로 숙임(몸통), 왼팔 Z+ = 바깥으로.
        # 실측(_axis.py): 아래를 향한 뼈는 X+가 뒤(+Y), 오른팔 Z-가 안쪽 → 여기서 부호를 맞춘다.
        if name in FLIP_XZ:
            rx, rz = -rx, -rz
        elif name in FLIP_X:
            rx = -rx
        elif name in FLIP_Z:
            rz = -rz
        pb.rotation_euler = (math.radians(rx), math.radians(ry), math.radians(rz))
        pb.keyframe_insert("rotation_euler", frame=frame)
        if len(v) > 3:
            pb.location = (0, v[3], 0)  # 뼈 로컬 Y = 뼈 방향. root/hips는 위쪽(+Z)이라 Y가 위
            pb.keyframe_insert("location", frame=frame)
        if len(v) > 4:
            pb.scale = (v[4], v[4], v[4])  # 소품 보이기/숨기기
            pb.keyframe_insert("scale", frame=frame)


def make_action(arm, name, frames, pose_fn):
    act = bpy.data.actions.new(name)
    arm.animation_data_create()
    arm.animation_data.action = act
    for pb in arm.pose.bones:
        pb.rotation_euler = (0, 0, 0)
        pb.location = (0, 0, 0)
    for f in range(frames + 1):
        t = f / frames
        pose = pose_fn(t)
        # 모든 동작에 소품 채널을 넣어야 동작을 바꿔도 이전 소품이 남지 않는다
        pose.setdefault("gun", (0, 0, 0, 0, HIDE))
        pose.setdefault("bomb", (0, 0, 0, 0, HIDE))
        pose.setdefault("rifle", (0, 0, 0, 0, HIDE))
        key_pose(arm, f + 1, pose)
    for fc in act.fcurves if hasattr(act, "fcurves") else []:
        for kp in fc.keyframe_points:
            kp.interpolation = "BEZIER"
    act.use_fake_user = True
    # glTF 내보내기용 NLA 트랙
    tr = arm.animation_data.nla_tracks.new()
    tr.name = name
    st = tr.strips.new(name, 1, act)
    st.action_frame_start = 1
    st.action_frame_end = frames + 1
    arm.animation_data.action = None
    return act


exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "rig_ik.py"), encoding="utf-8").read())


S = math.sin
C = math.cos
TAU = math.tau


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


# 총·던지기 동작
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "actions.py"), encoding="utf-8").read())


# ─── 비교 렌더 ────────────────────────────────────────
def setup_render(back=True):
    scn = bpy.context.scene
    scn.render.engine = "BLENDER_EEVEE"
    try:
        scn.eevee.taa_render_samples = 16
    except Exception:
        pass
    scn.view_settings.view_transform = "Standard"
    world = bpy.data.worlds.new("w") if not scn.world else scn.world
    scn.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    bg.inputs[0].default_value = (0.045, 0.06, 0.09, 1)
    bg.inputs[1].default_value = 1.4
    # 키 라이트(등 뒤 위) · 앞 보조 · 옆 림
    for nm, rot, en in (("key", (math.radians(50), 0, math.radians(160)), 3.2),
                        ("fill", (math.radians(60), 0, math.radians(-20)), 1.2),
                        ("rim", (math.radians(80), 0, math.radians(90)), 1.0)):
        ld = bpy.data.lights.new(nm, "SUN")
        ld.energy = en
        lo = link(bpy.data.objects.new(nm, ld))
        lo.rotation_euler = rot
    scn.render.resolution_x = 256
    scn.render.resolution_y = 300
    scn.render.film_transparent = False
    cd = bpy.data.cameras.new("cam")
    cam = link(bpy.data.objects.new("cam", cd))
    # 스프라이트처럼 등 뒤 약간 위에서
    cam.location = (0, 5.2, 1.7)
    cam.rotation_euler = (math.radians(80), 0, math.radians(180))
    cd.type = "ORTHO"
    cd.ortho_scale = 2.15
    scn.camera = cam
    return cam


def render_action(arm, act_name, frames, n_out, prefix):
    scn = bpy.context.scene
    act = bpy.data.actions[act_name]
    arm.animation_data.action = act
    # NLA 끄고 액션만
    for tr in arm.animation_data.nla_tracks:
        tr.mute = True
    paths = []
    for i in range(n_out):
        f = 1 + round(i * frames / n_out)
        scn.frame_set(f)
        p = os.path.join(OUT, f"_r_{prefix}_{i:02d}.png")
        scn.render.filepath = p
        bpy.ops.render.render(write_still=True)
        paths.append(p)
    for tr in arm.animation_data.nla_tracks:
        tr.mute = False
    arm.animation_data.action = None
    return paths


def main():
    clear()
    scn = bpy.context.scene
    scn.render.fps = FPS
    arm = build_armature()
    parts = build_body(arm)

    # 키 1.7m 확인용
    top = max((o.matrix_world @ Vector(c)).z for o in parts for c in o.bound_box)
    print("HEIGHT", round(top, 3))

    acts = {
        "idle": (make_action(arm, "idle", 45, idle_pose), 45),
        "walk": (make_action(arm, "walk", 30, walk_pose), 30),
        "run": (make_action(arm, "run", 22, run_pose), 22),
        "shoot": (make_ik_action(arm, "shoot", 8, shoot_pose, shoot_hands), 8),
        "shoot2": (make_ik_action(arm, "shoot2", 15, shoot2_pose, shoot2_hands), 15),
        "throw": (make_ik_action(arm, "throw", 33, throw_pose, throw_hands), 33),
        "walk_shoot": (make_ik_action(arm, "walk_shoot", 30, walk_shoot_pose, walk_shoot_hands), 30),
        "walk_throw": (make_ik_action(arm, "walk_throw", 33, walk_throw_pose, throw_hands), 33),
        "walk_gun": (make_action(arm, "walk_gun", 30, walk_gun_pose), 30),
    }
    scn.frame_start = 1
    scn.frame_end = 46

    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, f"wanderer_{VARIANT}{SUFFIX}.blend"))

    # glTF (애니 3개)
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(
        filepath=os.path.join(OUT, f"wanderer_{VARIANT}{SUFFIX}.glb"),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_animations=True,
        export_animation_mode="NLA_TRACKS",
        export_force_sampling=True,
        export_frame_range=False,
        export_extras=True,
    )

    # 얼굴 판: 기본만 보이게 (툴에서 표정 교체)
    print("FACE_PLANES", [o.name for o in parts if o.name.startswith("face_")])
    if not DO_RENDER:
        print("WANDERER_DONE")
        return
    setup_render()
    # 스프라이트 컷 수에 맞춰 뽑는다
    counts = {"idle": 13, "walk": 9, "run": 12, "shoot": 4, "shoot2": 6, "throw": 14, "walk_shoot": 8, "walk_throw": 14, "walk_gun": 8}
    for name, (act, frames) in acts.items():
        render_action(arm, name, frames, counts[name], name)
    print("WANDERER_DONE")


main()
