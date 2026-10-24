"""
수스 유닛 랩 v1 — Blender 5.2 배치 스크립트.

블록 메시를 만들고, 메시에서 점을 뽑아 점구름 원본(JSON)으로 내보낸다.
점구름은 게임/툴에서 GPU 셰이더로 연출(모임·퍼짐·피격·정화·솟기)한다.

실행:
  blender -b -P build_units.py -- <출력폴더>

출력:
  units/<id>.json   점 원본 (pos, zone, tone)
  units/<id>.glb    참고용 메시
  units.json        목록
  unit_lab_v1.blend 전체 씬
  lineup.png        한 줄 미리보기

단위: 미터. 방랑자 키 1.7m (journey3dConfig.char_height_m).
색은 넣지 않는다. zone 번호만 넣고, 색은 툴의 팔레트 데이터가 정한다.
"""
import bpy
import bmesh
import json
import math
import os
import random
import sys
from mathutils import Vector
from mathutils.bvhtree import BVHTree

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[0] if argv else os.path.dirname(os.path.abspath(__file__))
UNIT_DIR = os.path.join(OUT, "units")
os.makedirs(UNIT_DIR, exist_ok=True)

random.seed(20260924)

# zone: 0=몸, 1=색면/코어(발광), 2=테두리/어두운 면, 3=머리·피부(방랑자)
ZONE_BODY, ZONE_ACCENT, ZONE_EDGE, ZONE_SKIN = 0, 1, 2, 3


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for block in (bpy.data.meshes, bpy.data.materials):
        for b in list(block):
            block.remove(b)


def new_obj(name, bm):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    return ob


def join(name, objs):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    ob = bpy.context.view_layer.objects.active
    ob.name = name
    ob.data.name = name
    return ob


def tag_faces(ob, zone):
    """면마다 zone을 정수 속성으로 남긴다."""
    me = ob.data
    attr = me.attributes.get("zone") or me.attributes.new("zone", "INT", "FACE")
    for i in range(len(me.polygons)):
        attr.data[i].value = zone


def cube(name, size, loc=(0, 0, 0), zone=ZONE_BODY):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=Vector(size), verts=bm.verts)
    bmesh.ops.translate(bm, vec=Vector(loc), verts=bm.verts)
    ob = new_obj(name, bm)
    tag_faces(ob, zone)
    return ob


def ico(name, radius, subdiv=3, loc=(0, 0, 0), zone=ZONE_BODY, lumpy=0.0):
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=subdiv, radius=radius)
    if lumpy > 0:
        for v in bm.verts:
            n = v.co.normalized()
            wob = (math.sin(n.x * 5.1) * math.cos(n.y * 4.3) + math.sin(n.z * 6.7)) * 0.5
            v.co += n * wob * lumpy * radius
    bmesh.ops.translate(bm, vec=Vector(loc), verts=bm.verts)
    ob = new_obj(name, bm)
    tag_faces(ob, zone)
    return ob


def cyl(name, radius, depth, loc=(0, 0, 0), zone=ZONE_BODY, segs=32, ring=None):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=segs, radius1=radius, radius2=radius, depth=depth)
    if ring:
        # 가운데 구멍: 안쪽 원통을 빼는 대신, 윗면 안쪽 원을 zone만 다르게 둔다(가볍게)
        pass
    bmesh.ops.translate(bm, vec=Vector(loc), verts=bm.verts)
    ob = new_obj(name, bm)
    tag_faces(ob, zone)
    return ob


def ring(name, r_out, r_in, depth, loc=(0, 0, 0), zone=ZONE_ACCENT, segs=48):
    bm = bmesh.new()
    verts_top_o, verts_top_i, verts_bot_o, verts_bot_i = [], [], [], []
    for i in range(segs):
        a = i / segs * math.tau
        c, s = math.cos(a), math.sin(a)
        verts_top_o.append(bm.verts.new((c * r_out, s * r_out, depth / 2)))
        verts_top_i.append(bm.verts.new((c * r_in, s * r_in, depth / 2)))
        verts_bot_o.append(bm.verts.new((c * r_out, s * r_out, -depth / 2)))
        verts_bot_i.append(bm.verts.new((c * r_in, s * r_in, -depth / 2)))
    for i in range(segs):
        j = (i + 1) % segs
        bm.faces.new((verts_top_o[i], verts_top_o[j], verts_top_i[j], verts_top_i[i]))
        bm.faces.new((verts_bot_i[i], verts_bot_i[j], verts_bot_o[j], verts_bot_o[i]))
        bm.faces.new((verts_bot_o[i], verts_bot_o[j], verts_top_o[j], verts_top_o[i]))
        bm.faces.new((verts_top_i[i], verts_top_i[j], verts_bot_i[j], verts_bot_i[i]))
    bmesh.ops.translate(bm, vec=Vector(loc), verts=bm.verts)
    ob = new_obj(name, bm)
    tag_faces(ob, zone)
    return ob


# ─── 유닛 정의 ───────────────────────────────────────────────

def build_enemy_orb():
    """52 §3 적: 작은 원형 구름 하나. 역할은 색만 다르다. 코어가 살짝 밝다."""
    body = ico("enemy_body", 0.42, subdiv=4, loc=(0, 0, 0.5), lumpy=0.12)
    core = ico("enemy_core", 0.16, subdiv=2, loc=(0, 0, 0.52), zone=ZONE_ACCENT)
    return join("enemy_orb", [body, core])


def block(name, face_zone_top=True):
    """52 §4 건물: 네모 블록 + 색면. 1.2m 정육면체, 윗면 안쪽 판이 색면."""
    base = cube(name + "_base", (1.2, 1.2, 1.1), loc=(0, 0, 0.55))
    plate = cube(name + "_plate", (0.86, 0.86, 0.06), loc=(0, 0, 1.13), zone=ZONE_ACCENT)
    skirt = cube(name + "_skirt", (1.32, 1.32, 0.12), loc=(0, 0, 0.06), zone=ZONE_EDGE)
    return join(name, [base, plate, skirt])


def build_block_gun():
    ob = block("block_gun")
    # 앞면(진행 방향 +Y) 가로 띠 = 총구 방향 표시
    stripe = cube("gun_stripe", (0.9, 0.04, 0.16), loc=(0, 0.62, 0.78), zone=ZONE_ACCENT)
    return join("block_gun", [ob, stripe])


def build_block_throw():
    ob = block("block_throw")
    # 윗면 가운데 둥근 홈 느낌 = 던지는 쪽
    bowl = cyl("throw_bowl", 0.26, 0.08, loc=(0, 0, 1.19), zone=ZONE_ACCENT)
    return join("block_throw", [ob, bowl])


def build_floor_tile():
    """설치 칸 바닥. 2.4m 판 + 테두리."""
    slab = cube("tile_slab", (2.4, 2.4, 0.04), loc=(0, 0, 0.02), zone=ZONE_BODY)
    edges = [
        cube("tile_e1", (2.4, 0.1, 0.06), loc=(0, 1.15, 0.03), zone=ZONE_ACCENT),
        cube("tile_e2", (2.4, 0.1, 0.06), loc=(0, -1.15, 0.03), zone=ZONE_ACCENT),
        cube("tile_e3", (0.1, 2.4, 0.06), loc=(1.15, 0, 0.03), zone=ZONE_ACCENT),
        cube("tile_e4", (0.1, 2.4, 0.06), loc=(-1.15, 0, 0.03), zone=ZONE_ACCENT),
    ]
    return join("floor_tile", [slab] + edges)


def build_rescue_mark():
    """아이 구출 바닥 표식 (비전투에서만 보임). 원 두 겹."""
    outer = ring("mark_outer", 0.75, 0.62, 0.04, loc=(0, 0, 0.02), zone=ZONE_ACCENT)
    inner = cyl("mark_inner", 0.22, 0.04, loc=(0, 0, 0.02), zone=ZONE_BODY)
    return join("rescue_mark", [outer, inner])


def build_wanderer_ref():
    """방랑자 크기 기준 블록 (1.7m). 그림 대체가 아니라 공간감 비교용."""
    legs = cube("w_legs", (0.34, 0.22, 0.72), loc=(0, 0, 0.36), zone=ZONE_EDGE)
    torso = cube("w_torso", (0.46, 0.28, 0.56), loc=(0, 0, 1.0))
    head = cube("w_head", (0.34, 0.32, 0.32), loc=(0, 0, 1.46), zone=ZONE_SKIN)
    pack = cube("w_pack", (0.38, 0.24, 0.44), loc=(0, -0.26, 1.02), zone=ZONE_EDGE)
    lamp = cube("w_lamp", (0.08, 0.08, 0.12), loc=(0.3, 0.06, 0.62), zone=ZONE_ACCENT)
    return join("wanderer_ref", [legs, torso, head, pack, lamp])


def build_shot():
    """기관총 한 점."""
    return cube("shot_gun", (0.07, 0.3, 0.07), loc=(0, 0, 0), zone=ZONE_ACCENT)


def build_bomb():
    """기본 폭탄 한 발."""
    b = ico("bomb_body", 0.16, subdiv=2)
    c = ico("bomb_core", 0.07, subdiv=1, zone=ZONE_ACCENT)
    return join("bomb", [b, c])


UNITS = [
    # id, 이름, 분류, 빌더, 점 수, 안쪽 채움 비율
    ("enemy_orb", "적 구름", "enemy", build_enemy_orb, 1200, 0.35),
    ("block_gun", "총 블록", "building", build_block_gun, 2600, 0.0),
    ("block_throw", "던지기 블록", "building", build_block_throw, 2600, 0.0),
    ("floor_tile", "설치 칸", "marker", build_floor_tile, 1400, 0.0),
    ("rescue_mark", "구출 표식", "marker", build_rescue_mark, 700, 0.0),
    ("wanderer_ref", "방랑자 기준", "ally", build_wanderer_ref, 1800, 0.15),
    ("shot_gun", "기관총 탄", "missile", build_shot, 60, 0.0),
    ("bomb", "기본 폭탄", "missile", build_bomb, 160, 0.3),
]


# ─── 점 샘플링 ──────────────────────────────────────────────

def sample_points(ob, count, interior_ratio):
    me = ob.data
    me.calc_loop_triangles()
    zone_attr = me.attributes.get("zone")
    tris = []
    total = 0.0
    for lt in me.loop_triangles:
        a, b, c = (me.vertices[i].co for i in lt.vertices)
        area = lt.area
        if area <= 0:
            continue
        z = zone_attr.data[lt.polygon_index].value if zone_attr else 0
        total += area
        tris.append((total, a.copy(), b.copy(), c.copy(), z))

    def pick_tri(r):
        lo, hi = 0, len(tris) - 1
        while lo < hi:
            mid = (lo + hi) // 2
            if tris[mid][0] < r:
                lo = mid + 1
            else:
                hi = mid
        return tris[lo]

    n_in = int(count * interior_ratio)
    n_surf = count - n_in
    pts = []
    for _ in range(n_surf):
        _, a, b, c, z = pick_tri(random.random() * total)
        u, v = random.random(), random.random()
        if u + v > 1:
            u, v = 1 - u, 1 - v
        p = a + (b - a) * u + (c - a) * v
        pts.append((p, z))

    if n_in > 0:
        bvh = BVHTree.FromObject(ob, bpy.context.evaluated_depsgraph_get())
        lo = Vector(ob.bound_box[0])
        hi = Vector(ob.bound_box[6])
        tries = 0
        while len(pts) < count and tries < count * 60:
            tries += 1
            p = Vector((random.uniform(lo.x, hi.x), random.uniform(lo.y, hi.y), random.uniform(lo.z, hi.z)))
            hits, origin = 0, p.copy()
            d = Vector((0.31, 0.47, 0.83)).normalized()
            for _ in range(8):
                h = bvh.ray_cast(origin, d)
                if h[0] is None:
                    break
                hits += 1
                origin = h[0] + d * 1e-4
            if hits % 2 == 1:
                # 안쪽 점: 가장 가까운 면의 zone을 물려받는다
                loc, _n, idx, _dist = bvh.find_nearest(p)
                z = zone_attr.data[idx].value if (zone_attr and idx is not None and idx < len(zone_attr.data)) else 0
                pts.append((p, z))
    random.shuffle(pts)
    return pts


def export_unit(uid, name, group, ob, count, interior):
    pts = sample_points(ob, count, interior)
    zmin = min(p.z for p, _ in pts)
    zmax = max(p.z for p, _ in pts)
    h = max(1e-6, zmax - zmin)
    pos, zone, tone = [], [], []
    for p, z in pts:
        # 블렌더 Z-up → three Y-up : (x, z, -y)
        pos += [round(p.x, 4), round(p.z, 4), round(-p.y, 4)]
        zone.append(int(z))
        # tone: 아래는 어둡고 위는 밝게 + 약한 무작위 (점묘 결)
        tone.append(round(0.55 + 0.35 * (p.z - zmin) / h + random.uniform(-0.12, 0.12), 3))
    data = {
        "id": uid,
        "name": name,
        "group": group,
        "count": len(pts),
        "height_m": round(h, 3),
        "pos": pos,
        "zone": zone,
        "tone": tone,
    }
    with open(os.path.join(UNIT_DIR, uid + ".json"), "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))

    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.export_scene.gltf(
        filepath=os.path.join(UNIT_DIR, uid + ".glb"),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
    )
    return {"id": uid, "name": name, "group": group, "count": len(pts), "height_m": round(h, 3)}


def render_lineup(objs):
    x = 0.0
    for ob in objs:
        w = ob.dimensions.x
        ob.location.x = x + w / 2
        x += w + 0.6
    cam_data = bpy.data.cameras.new("cam")
    cam = bpy.data.objects.new("cam", cam_data)
    bpy.context.collection.objects.link(cam)
    cam.location = (x / 2 - 0.3, -10.5, 4.6)
    cam.rotation_euler = (math.radians(68), 0, 0)
    cam_data.lens = 20
    scn = bpy.context.scene
    scn.camera = cam
    scn.render.engine = "BLENDER_WORKBENCH"
    scn.display.shading.light = "STUDIO"
    scn.display.shading.color_type = "RANDOM"
    scn.display.shading.show_cavity = True
    scn.display.shading.background_type = "VIEWPORT"
    scn.display.shading.background_color = (0.02, 0.05, 0.09)
    scn.render.resolution_x = 1600
    scn.render.resolution_y = 600
    scn.render.filepath = os.path.join(OUT, "lineup.png")
    bpy.ops.render.render(write_still=True)


def main():
    clear_scene()
    manifest = []
    objs = []
    for uid, name, group, fn, count, interior in UNITS:
        ob = fn()
        ob.location = (0, 0, 0)
        manifest.append(export_unit(uid, name, group, ob, count, interior))
        objs.append(ob)
    with open(os.path.join(OUT, "units.json"), "w", encoding="utf-8") as f:
        json.dump({"version": 1, "units": manifest}, f, ensure_ascii=False, indent=2)
    render_lineup(objs)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "unit_lab_v1.blend"))
    print("UNIT_LAB_DONE", len(manifest))


main()
