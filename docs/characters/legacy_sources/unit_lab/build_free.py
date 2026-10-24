"""
무료 CC0 모델 → 점구름 원본 (유닛 랩 v2). Blender 5.2 배치.

소스:
  free/kenney_td/Models/GLB format/*.glb      Kenney Tower Defense Kit (CC0)
  free/quaternius_monsters/*.glb             Quaternius Ultimate Monsters (CC0, poly.pizza)

실행:
  blender -b -P build_free.py -- <출력폴더>

하는 일:
  1) glb를 불러와 메시를 합치고, 분류별 기준 크기로 맞춘다(바닥 중심 0).
  2) 면적 비례로 점을 뽑고, 점마다 원래 색(재질 색 × 텍스처)을 읽는다.
  3) units/<id>.json (pos, col[sRGB 0..255], zone) + units/<id>.glb(크기 맞춘 참고 메시)를 쓴다.
  4) 타워 2개는 Kenney 부품을 쌓아 조립한다 (총 탑 / 던지기 탑).
"""
import bpy
import json
import math
import os
import random
import sys

import numpy as np
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[0] if argv else os.path.dirname(os.path.abspath(__file__))
HERE = os.path.dirname(os.path.abspath(__file__))
KEN = os.path.join(HERE, "free", "kenney_td", "Models", "GLB format")
QUA = os.path.join(HERE, "free", "quaternius_monsters")
UNIT_DIR = os.path.join(OUT, "units_free")
os.makedirs(UNIT_DIR, exist_ok=True)
random.seed(924)


def lin2srgb(c):
    c = max(0.0, min(1.0, c))
    return c * 12.92 if c <= 0.0031308 else 1.055 * (c ** (1 / 2.4)) - 0.055


def clear():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for coll in (bpy.data.meshes, bpy.data.materials, bpy.data.images, bpy.data.armatures, bpy.data.actions):
        for b in list(coll):
            try:
                coll.remove(b)
            except Exception:
                pass


def import_glb(path, offset=(0, 0, 0)):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    new = [o for o in bpy.data.objects if o not in before]
    for o in new:
        if o.parent is None:
            o.location = Vector(o.location) + Vector(offset)
    return new


def bake_meshes(objs):
    """아마추어 포즈(휴식 자세)까지 반영해 메시 하나로 굳힌다."""
    dg = bpy.context.evaluated_depsgraph_get()
    meshes = [o for o in objs if o.type == "MESH"]
    # 재질 없는 보조 도형(Quaternius glb의 Icosphere 등)은 뺀다
    with_mat = [o for o in meshes if any(s.material for s in o.material_slots)]
    if with_mat:
        meshes = with_mat
    baked = []
    for o in meshes:
        ev = o.evaluated_get(dg)
        me = bpy.data.meshes.new_from_object(ev, preserve_all_data_layers=True, depsgraph=dg)
        me.transform(o.matrix_world)
        nob = bpy.data.objects.new(o.name + "_b", me)
        bpy.context.collection.objects.link(nob)
        baked.append(nob)
    for o in objs:
        bpy.data.objects.remove(o, do_unlink=True)
    bpy.ops.object.select_all(action="DESELECT")
    for o in baked:
        o.select_set(True)
    bpy.context.view_layer.objects.active = baked[0]
    if len(baked) > 1:
        bpy.ops.object.join()
    ob = bpy.context.view_layer.objects.active
    return ob


def normalize(ob, rule, size):
    """rule: 'h'=높이를 size로, 'w'=가로 최대를 size로, 'keep'=그대로. 바닥 중심을 원점으로."""
    me = ob.data
    co = np.array([v.co[:] for v in me.vertices])
    lo, hi = co.min(0), co.max(0)
    dims = hi - lo
    if rule == "h":
        k = size / max(1e-6, dims[2])
    elif rule == "w":
        k = size / max(1e-6, max(dims[0], dims[1]))
    else:
        k = 1.0
    cx, cy = (lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2
    for v in me.vertices:
        v.co = Vector(((v.co.x - cx) * k, (v.co.y - cy) * k, (v.co.z - lo[2]) * k))
    me.update()


class ColorSampler:
    """재질 색 × 베이스 컬러 텍스처(있으면)."""

    def __init__(self, ob):
        self.mats = []
        for slot in ob.material_slots:
            m = slot.material
            base = (0.8, 0.8, 0.8)
            img = None
            if m and m.use_nodes:
                bsdf = next((n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED"), None)
                if bsdf:
                    inp = bsdf.inputs["Base Color"]
                    base = tuple(inp.default_value[:3])
                    if inp.is_linked:
                        src = inp.links[0].from_node
                        # 곱하기 노드 등을 한 단계만 따라간다
                        if src.type != "TEX_IMAGE":
                            for i in src.inputs:
                                if i.is_linked and i.links[0].from_node.type == "TEX_IMAGE":
                                    src = i.links[0].from_node
                                    break
                        if src.type == "TEX_IMAGE" and src.image:
                            img = src.image
                            base = (1.0, 1.0, 1.0)
            px = None
            if img is not None:
                w, h = img.size
                if w > 0 and h > 0:
                    arr = np.empty(w * h * 4, dtype=np.float32)
                    img.pixels.foreach_get(arr)
                    px = (arr.reshape(h, w, 4), w, h)
            self.mats.append((base, px))
        if not self.mats:
            self.mats.append(((0.8, 0.8, 0.8), None))

    def color(self, mi, uv):
        base, px = self.mats[min(mi, len(self.mats) - 1)]
        if px is None:
            return tuple(lin2srgb(c) for c in base)
        arr, w, h = px
        u = uv[0] % 1.0
        v = uv[1] % 1.0
        x = min(w - 1, int(u * w))
        y = min(h - 1, int(v * h))
        c = arr[y, x]
        # 텍스처 픽셀은 저장값(sRGB) 그대로
        return (float(c[0]), float(c[1]), float(c[2]))


def sample(ob, count):
    me = ob.data
    me.calc_loop_triangles()
    uvl = me.uv_layers.active.data if me.uv_layers.active else None
    cs = ColorSampler(ob)
    tris, total = [], 0.0
    for lt in me.loop_triangles:
        if lt.area <= 0:
            continue
        total += lt.area
        tris.append((total, lt))
    cum = np.array([t[0] for t in tris])
    pos, col, nrm = [], [], []
    for _ in range(count):
        i = int(np.searchsorted(cum, random.random() * total))
        lt = tris[min(i, len(tris) - 1)][1]
        a, b, c = (me.vertices[k].co for k in lt.vertices)
        u, v = random.random(), random.random()
        if u + v > 1:
            u, v = 1 - u, 1 - v
        p = a + (b - a) * u + (c - a) * v
        if uvl:
            ua, ub, uc = (Vector(uvl[k].uv) for k in lt.loops)
            uv = ua + (ub - ua) * u + (uc - ua) * v
        else:
            uv = (0.5, 0.5)
        rgb = cs.color(lt.material_index, uv)
        pos += [round(p.x, 4), round(p.z, 4), round(-p.y, 4)]
        col += [int(max(0, min(255, round(x * 255)))) for x in rgb]
        n = lt.normal
        nrm += [round(n.x, 2), round(n.z, 2), round(-n.y, 2)]
    return pos, col, nrm


def dense_export(ob, uid, dense=30000):
    """블록용 촘촘한 표면 샘플 → <id>.dense.bin (툴이 원하는 블록 크기로 쌓는다).
    형식: Int16 x,y,z (bbox 기준 양자화) × n, 그다음 Uint8 r,g,b × n. 양자화 값은 목록(json)에 둔다."""
    pos, col, _n = sample(ob, dense)
    p = np.array(pos, dtype=np.float32).reshape(-1, 3)
    lo = p.min(0)
    hi = p.max(0)
    q = float(max(1e-6, (hi - lo).max()) / 32000.0)
    qi = np.round((p - lo) / q).astype(np.int16)
    c = np.array(col, dtype=np.uint8).reshape(-1, 3)
    with open(os.path.join(UNIT_DIR, uid + ".dense.bin"), "wb") as f:
        f.write(qi.tobytes())
        f.write(c.tobytes())
    return {"dense": int(p.shape[0]), "dense_lo": [round(float(x), 5) for x in lo], "dense_q": q,
            "span": round(float((hi - lo).max()), 4)}


def export(uid, name, group, ob, count, src, licence):
    dmeta = dense_export(ob, uid)
    pos, col, nrm = sample(ob, count)
    ys = pos[1::3]
    h = max(ys) - min(ys)
    data = {"id": uid, "name": name, "group": group, "count": count, "height_m": round(h, 3),
            "pos": pos, "col": col, "nrm": nrm, "zone": [0] * count, "tone": [1] * count,
            "source": src, "licence": licence}
    with open(os.path.join(UNIT_DIR, uid + ".json"), "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.export_scene.gltf(filepath=os.path.join(UNIT_DIR, uid + ".glb"), export_format="GLB",
                              use_selection=True, export_apply=True)
    return {"id": uid, "name": name, "group": group, "count": count, "height_m": round(h, 3),
            "color": True, "base": "units_free", **dmeta}


def one(uid, name, group, path, rule, size, count, src, lic):
    clear()
    objs = import_glb(path)
    ob = bake_meshes(objs)
    normalize(ob, rule, size)
    return export(uid, name, group, ob, count, src, lic)


def stack(uid, name, group, parts, size, count, src, lic):
    """Kenney 탑 부품을 아래에서 위로 쌓는다. 무기는 맨 위에 얹는다."""
    clear()
    z = 0.0
    all_objs = []
    for p in parts:
        objs = import_glb(os.path.join(KEN, p + ".glb"))
        ob = bake_meshes(objs)
        me = ob.data
        co = np.array([v.co[:] for v in me.vertices])
        lo, hi = co.min(0), co.max(0)
        for v in me.vertices:
            v.co.z += z - lo[2]
        me.update()
        z += hi[2] - lo[2]
        all_objs.append(ob)
    bpy.ops.object.select_all(action="DESELECT")
    for o in all_objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = all_objs[0]
    bpy.ops.object.join()
    ob = bpy.context.view_layer.objects.active
    normalize(ob, "h", size)
    return export(uid, name, group, ob, count, src, lic)


KEN_SRC = "Kenney Tower Defense Kit (kenney.nl)"
KEN_LIC = "CC0 1.0"

# Kenney: (파일, 이름, 분류, 규칙, 크기m, 점수)
KENNEY = [
    ("weapon-turret", "터렛", "building", "w", 1.2, 2200),
    ("weapon-cannon", "대포", "building", "w", 1.2, 2200),
    ("weapon-catapult", "투석기", "building", "w", 1.3, 2400),
    ("weapon-ballista", "발리스타", "building", "w", 1.3, 2400),
    ("enemy-ufo-a", "UFO A", "enemy_ufo", "w", 1.0, 1400),
    ("enemy-ufo-b", "UFO B", "enemy_ufo", "w", 1.0, 1400),
    ("enemy-ufo-c", "UFO C", "enemy_ufo", "w", 1.0, 1400),
    ("enemy-ufo-d", "UFO D", "enemy_ufo", "w", 1.0, 1400),
    ("tile", "바닥 타일", "tile", "w", 2.4, 2000),
    ("tile-spawn", "스폰 타일", "tile", "w", 2.4, 2200),
    ("tile-straight", "길 타일", "tile", "w", 2.4, 2200),
    ("tile-crossing", "교차 타일", "tile", "w", 2.4, 2200),
    ("tile-tree", "나무 타일", "tile", "w", 2.4, 2600),
    ("tile-crystal", "크리스탈 타일", "tile", "w", 2.4, 2600),
    ("selection-a", "선택 표식 A", "marker", "w", 2.4, 900),
    ("selection-b", "선택 표식 B", "marker", "w", 2.4, 900),
    ("detail-tree", "나무", "detail", "h", 1.6, 1400),
    ("detail-rocks", "바위", "detail", "w", 1.0, 1000),
    ("detail-crystal", "크리스탈", "detail", "h", 1.0, 1000),
    ("weapon-ammo-bullet", "총알", "missile", "w", 0.25, 120),
    ("weapon-ammo-cannonball", "대포알", "missile", "w", 0.3, 160),
    ("weapon-ammo-boulder", "돌덩이", "missile", "w", 0.35, 200),
]

TOWERS = [
    ("tower_gun", "총 탑 (조립)", "building",
     ["tower-square-bottom-a", "tower-square-middle-a", "tower-square-top-a", "weapon-turret"], 2.2, 3600),
    ("tower_throw", "던지기 탑 (조립)", "building",
     ["tower-round-bottom-a", "tower-round-middle-a", "tower-round-top-a", "weapon-catapult"], 2.2, 3600),
]


def main():
    man = []
    for fn, name, grp, rule, size, n in KENNEY:
        man.append(one("k_" + fn.replace("-", "_"), name, grp, os.path.join(KEN, fn + ".glb"), rule, size, n,
                       KEN_SRC + " / " + fn + ".glb", KEN_LIC))
        print("OK", fn)
    for uid, name, grp, parts, size, n in TOWERS:
        man.append(stack(uid, name, grp, parts, size, n, KEN_SRC + " / " + "+".join(parts), KEN_LIC))
        print("OK", uid)
    srcs = json.load(open(os.path.join(QUA, "_sources.json"), encoding="utf-8"))
    for s in srcs:
        slug = s["file"][:-4]
        man.append(one("q_" + slug, s["title"], "enemy_monster", os.path.join(QUA, s["file"]), "h", 1.0, 1600,
                       "Quaternius Ultimate Monsters / " + s["source"], s["licence"]))
        print("OK", slug)
    with open(os.path.join(OUT, "units_free.json"), "w", encoding="utf-8") as f:
        json.dump({"version": 2, "units": man}, f, ensure_ascii=False, indent=1)
    print("FREE_DONE", len(man))


main()
