"""i21 블렌드 → 유닛 랩용 glb. blender -b i21_purified.blend -P export_i21.py -- <out.glb>
- 풀·꽃 파티클은 실제 오브젝트로 풀되, 같은 원본을 쓰는 것끼리 메시를 공유 → glTF GPU 인스턴싱(EXT_mesh_gpu_instancing)
- 사람(B2 방랑자)·카메라·조명은 빼고 내보낸다 (툴이 조명·캐릭터를 따로 둔다)
- 지형 블록 결(칸 흔들림·모서리 음영)은 Blender 노드라 glTF로 안 간다 → 툴 셰이더가 같은 식으로 그린다(COLOR_0 사용)
"""
import bpy, sys, os
argv = sys.argv[sys.argv.index("--") + 1:]
OUT = argv[0]

scn = bpy.context.scene
# 사람·카메라·조명 제거
for o in list(bpy.data.objects):
    if o.type in ("CAMERA", "LIGHT", "ARMATURE") or (o.parent and o.parent.type == "ARMATURE") \
            or any(o.name.startswith(k) for k in ("Wanderer", "mg_", "rf_", "bomb")):
        bpy.data.objects.remove(o, do_unlink=True)
for c in list(bpy.data.collections):
    if c.name.startswith("glTF_not_exported"):
        bpy.data.collections.remove(c)

# 원본 모음을 잠깐 켜서 파티클 인스턴스를 실제 오브젝트로
lc = scn.view_layers[0].layer_collection
for ch in lc.children:
    if ch.name in ("protos", "grass_set", "flowers_set"):
        ch.exclude = False
emit = bpy.data.objects["grass_emit"]
bpy.ops.object.select_all(action="DESELECT")
emit.select_set(True)
bpy.context.view_layer.objects.active = emit
bpy.ops.object.duplicates_make_real(use_base_parent=False, use_hierarchy=False)
made = [o for o in bpy.context.selected_objects if o is not emit]
print("EXPORT realized", len(made))
# 방출 면 제거, 원본 모음 제거(원점에 원본이 남지 않게)
bpy.data.objects.remove(emit, do_unlink=True)
for name in ("protos", "grass_set", "flowers_set"):
    c = bpy.data.collections.get(name)
    if c:
        for o in list(c.objects):
            c.objects.unlink(o)
            if o.users == 0:
                bpy.data.objects.remove(o)
        bpy.data.collections.remove(c)
# 풀·꽃 인스턴스는 한 모음에
gc = bpy.data.collections.new("grass_inst")
scn.collection.children.link(gc)
for o in made:
    for c in list(o.users_collection):
        c.objects.unlink(o)
    gc.objects.link(o)

bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(
    filepath=OUT,
    export_format="GLB",
    use_selection=False,
    export_apply=True,
    export_gpu_instances=True,
    export_vertex_color="ACTIVE",
    export_animations=False,
    export_cameras=False,
    export_lights=False,
)
print("EXPORT_DONE", OUT, os.path.getsize(OUT))
