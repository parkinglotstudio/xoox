import bpy
a = bpy.data.objects["Wanderer"]
for s in "LR":
    u, f = a.data.bones[f"upperarm.{s}"], a.data.bones[f"forearm.{s}"]
    print(f"AR {s}: 어깨 {tuple(round(v,3) for v in u.head_local)} 위팔 {u.length:.3f} 팔뚝 {f.length:.3f} 손 {tuple(round(v,3) for v in f.tail_local)}")
print("AR chest", tuple(round(v,3) for v in a.data.bones["chest"].head_local))
