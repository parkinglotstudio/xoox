"""
설치 건물 추가 (유닛 랩 v3). Blender 5.2 배치.
build_free.py의 함수(불러오기·크기 맞추기·표면 샘플·조립)를 그대로 쓰고, 건물 목록만 따로 둔다.

소스 (전부 CC0):
  free/kenney_td/Models/GLB format            Tower Defense Kit  → 부품 조립 탑
  free/kenney_survival-kit/Models/GLB format  Survival Kit       → 캠프 설치물
  free/kenney_factory-kit/Models/GLB format   Factory Kit        → 기계 설치물

실행:  blender -b -P build_buildings.py -- <출력폴더>
출력:  units_free/<id>.{json,glb,dense.bin} + units_free.json 에 합침(같은 id는 교체)
"""
import os
import sys
import json

HERE = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(HERE, "build_free.py"), encoding="utf-8").read()
src = src[: src.rindex("\nmain()")]  # 무료 모델 전체 빌드는 돌리지 않는다
exec(src)

SUR = os.path.join(HERE, "free", "kenney_survival-kit", "Models", "GLB format")
FAC = os.path.join(HERE, "free", "kenney_factory-kit", "Models", "GLB format")
LIC = "CC0 1.0"

# 조립 탑: (id, 이름, 부품들(아래→위), 높이m)
TOWERS2 = [
    ("tower_cannon", "대포 탑", ["tower-square-bottom-b", "tower-square-middle-b", "tower-square-top-b", "weapon-cannon"], 2.2),
    ("tower_ballista", "발리스타 탑", ["tower-square-bottom-c", "tower-square-middle-c", "tower-square-top-c", "weapon-ballista"], 2.2),
    ("tower_crystal", "크리스탈 탑", ["tower-round-bottom-b", "tower-round-middle-b", "tower-round-crystals"], 2.2),
    ("tower_roof", "지붕 망루", ["tower-round-bottom-c", "tower-round-middle-c", "tower-round-top-c", "tower-round-roof-a"], 2.4),
    ("tower_wood", "목조 망루", ["wood-structure-high", "weapon-turret"], 2.0),
    ("tower_catapult", "투석기 탑", ["tower-square-bottom-a", "tower-square-middle-b", "weapon-catapult"], 1.9),
]

# 단품: (폴더, 파일, 이름, 분류, 규칙, 크기m, 점수)
SINGLES = [
    # 캠프 (Survival)
    (SUR, "campfire-stand", "모닥불 (거치대)", "building_camp", "w", 1.2),
    (SUR, "campfire-pit", "모닥불 (구덩이)", "building_camp", "w", 1.1),
    (SUR, "tent", "텐트", "building_camp", "w", 1.8),
    (SUR, "tent-canvas", "천막", "building_camp", "w", 1.8),
    (SUR, "workbench", "작업대", "building_camp", "w", 1.3),
    (SUR, "workbench-anvil", "모루 작업대", "building_camp", "w", 1.3),
    (SUR, "workbench-grind", "숫돌 작업대", "building_camp", "w", 1.3),
    (SUR, "fence-fortified", "방책", "building_camp", "w", 1.6),
    (SUR, "chest", "보물 상자", "building_camp", "w", 0.9),
    (SUR, "barrel", "통", "building_camp", "h", 0.9),
    (SUR, "signpost", "표지판", "building_camp", "h", 1.5),
    (SUR, "structure", "오두막 뼈대", "building_camp", "w", 2.2),
    (SUR, "structure-metal", "철제 창고", "building_camp", "w", 2.2),
    # 기계 (Factory)
    (FAC, "machine", "기계", "building_machine", "w", 1.4),
    (FAC, "machine-fortified", "강화 기계", "building_machine", "w", 1.4),
    (FAC, "machine-window", "창 달린 기계", "building_machine", "w", 1.4),
    (FAC, "hopper-high-round", "원형 호퍼", "building_machine", "h", 2.0),
    (FAC, "robot-arm-a", "로봇팔 A", "building_machine", "h", 1.8),
    (FAC, "robot-arm-b", "로봇팔 B", "building_machine", "h", 1.8),
    (FAC, "scanner-high", "스캐너", "building_machine", "h", 2.0),
    (FAC, "crane", "크레인", "building_machine", "h", 2.4),
    (FAC, "piston-round", "피스톤", "building_machine", "h", 1.4),
    (FAC, "pipe-glass-large-valve", "유리관 밸브", "building_machine", "w", 1.4),
    (FAC, "screen-wide", "대형 화면", "building_machine", "w", 1.6),
]


def main2():
    man = []
    for uid, name, parts, size in TOWERS2:
        man.append(stack(uid, name, "building_tower", parts, size, 3600,
                         KEN_SRC + " / " + "+".join(parts), LIC))
        print("OK", uid)
    for folder, fn, name, grp, rule, size in SINGLES:
        kit = "Kenney Survival Kit" if folder == SUR else "Kenney Factory Kit"
        uid = "k_" + fn.replace("-", "_")
        man.append(one(uid, name, grp, os.path.join(folder, fn + ".glb"), rule, size, 2600,
                       f"{kit} (kenney.nl) / {fn}.glb", LIC))
        print("OK", uid)
    path = os.path.join(OUT, "units_free.json")
    cur = json.load(open(path, encoding="utf-8")) if os.path.exists(path) else {"version": 2, "units": []}
    ids = {m["id"] for m in man}
    cur["units"] = [u for u in cur["units"] if u["id"] not in ids] + man
    json.dump(cur, open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("BUILDINGS_DONE", len(man), "total", len(cur["units"]))


main2()
