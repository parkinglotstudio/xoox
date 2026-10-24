import bpy
from mathutils import Vector
dg = bpy.context.evaluated_depsgraph_get()
pts = []
for o in bpy.data.objects:
    if o.type == "MESH" and o.parent_bone == "head":
        ev = o.evaluated_get(dg); me = ev.to_mesh()
        pts += [ev.matrix_world @ v.co for v in me.vertices]; ev.to_mesh_clear()
for k, i in (("x", 0), ("y", 1), ("z", 2)):
    print(f"HB {k}: {min(p[i] for p in pts):+.3f} ~ {max(p[i] for p in pts):+.3f}")
# 얼굴 앞면: z 1.1~1.4 구간의 최소 y
for z0 in (1.15, 1.25, 1.35):
    ys = [p.y for p in pts if abs(p.z - z0) < 0.03 and abs(p.x) < 0.15]
    print(f"HB z={z0}: 앞면 y={min(ys) if ys else None}")
