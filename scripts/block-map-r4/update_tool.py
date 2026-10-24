from pathlib import Path
p=Path(__file__).parent
source=Path('C:/xoox/src/tools/unitLabTool/main.ts').read_text(encoding='utf-8-sig')
source=source.replace('import { MapView, MAP_CAMS, bl } from "./MapLab";', '''import { MapView, bl, loadBlockMap, readBlockMapManifest, type BlockMapManifest, type BlockMapState, type BlockMapSector } from "../../maps/blockMap/BlockMap";''')
source=source.replace('let mapLoading: Promise<MapView> | null = null;', '''let mapRequest = 0;
let mapManifest: BlockMapManifest | null = null;
let mapSector: BlockMapSector = new URLSearchParams(location.search).get("mapSector") === "i11" ? "i11" : "i21";
let mapState: BlockMapState = new URLSearchParams(location.search).get("mapState") === "polluted" ? "polluted" : "purified";
let mapActors = new URLSearchParams(location.search).get("mapActors") === "1";
let mapBusy = false;''')
start=source.index('function setMapCam(');end=source.index('\nfunction hideCombat()',start)
source=source[:start]+'''function setMapCam(id: string) {
  const c = mapManifest?.sectors[mapSector].cameras[id];
  if (!c) return;
  camera.position.copy(bl(...c.pos)); controls.target.copy(bl(...c.target)); controls.update();
  document.querySelectorAll<HTMLButtonElement>("[data-mapcam]").forEach(b => b.classList.toggle("on", b.dataset.mapcam === id));
}

async function showMap(preserveCamera = false) {
  const request = ++mapRequest;
  hideCharacter(); hideCombat(); current = MAP_ID;
  hero?.dispose(); hero = null; heroMesh?.removeFromParent(); heroMesh = null;
  $("sideLabels").style.display = "none";
  $("mapPanel").style.display = "";
  $("status").textContent = `블록 맵 ${mapSector} 불러오는 중…`;
  mapBusy = true;
  try {
    const result = await loadBlockMap({sector: mapSector, state: mapState, actors: mapActors});
    if (request !== mapRequest || current !== MAP_ID) { result.view.dispose(); return; }
    mapView?.dispose(); mapView = result.view; mapManifest = result.manifest;
    scene.add(mapView.root);
    ground.visible = false; grid.visible = false;
    renderer.setClearColor(result.mood.sky, 1);
    scene.fog = new THREE.Fog(result.mood.fog, 95, 340);
    scene.environment = null;
    renderer.toneMapping = THREE.NoToneMapping; renderer.shadowMap.enabled = false;
    hemi.visible = sun.visible = true; fill.visible = rim.visible = false;
    referenceLighting.studio.visible = referenceLighting.detail.visible = false;
    hemi.color.set(0xf4f0ea); hemi.groundColor.set(mapState === "purified" ? 0xb8c9c2 : 0x493b55);
    hemi.intensity = result.mood.hemi; sun.intensity = result.mood.sun; sun.position.set(-40,60,40);
    camera.far = 1500; camera.updateProjectionMatrix();
    for (const b of document.querySelectorAll<HTMLButtonElement>("[data-mapcam]")) {
      b.textContent = result.entry.cameras[b.dataset.mapcam!]?.label ?? b.textContent;
    }
    $("mapPanel").querySelector("h3")!.textContent = `블록 맵 ${mapSector} · ${result.mood.label}`;
    if (!preserveCamera) setMapCam("field");
    $("status").textContent = `${mapSector} ${result.mood.label} · ${result.manifest.revision}`;
    $("unitInfo").textContent = `Blender 맵 · ${result.mood.label} · 전체 맵 ${Math.round(mapView.triangles).toLocaleString()} 삼각형 · 인스턴스 ${mapView.instances.toLocaleString()} · D + 몬스터 ${mapView.monsters} · 110m`;
    document.querySelectorAll<HTMLButtonElement>(".unit-btn").forEach(b => b.classList.toggle("on",b.dataset.id === MAP_ID));
  } catch(error) {
    if (request === mapRequest) $("status").textContent = `맵 로드 실패: ${(error as Error).message} · 다시 불러오기를 눌러 주세요`;
  } finally { if (request === mapRequest) mapBusy = false; }
}

// One small manifest request while this view is active; assets load only for a new revision.
setInterval(async () => {
  if (current !== MAP_ID || mapBusy || !mapManifest || document.hidden) return;
  try {
    const manifest = await readBlockMapManifest();
    if (manifest.revision !== mapManifest.revision) await showMap(true);
  } catch { /* Keep the last complete map if the development server is temporarily unavailable. */ }
}, 10000);
''' +source[end:]
source=source.replace('b3.textContent = new URLSearchParams(location.search).get("mapSector") === "i11" ? "맵: i11 정화후" : "맵: i21 정화후";', 'b3.textContent = "블록 맵 · 정화 전 / 후";')
source=source.replace('b3.onclick = () => void showMap();', '''b3.onclick = () => void showMap();
    const sectorSelect = $<HTMLSelectElement>("blockMapSector");
    const stateSelect = $<HTMLSelectElement>("blockMapState");
    sectorSelect.value = mapSector; stateSelect.value = mapState;
    sectorSelect.onchange = () => { mapSector = sectorSelect.value as BlockMapSector; void showMap(); };
    stateSelect.onchange = () => { mapState = stateSelect.value as BlockMapState; void showMap(true); };
    $("blockMapReload").onclick = () => void showMap(true);
    const actors = $<HTMLInputElement>("blockMapActors"); actors.checked = mapActors;
    actors.onchange = () => { mapActors = actors.checked; void showMap(true); };''')
source=source.replace('await showCharacter();\n    $("status").textContent = `유닛 ${manifest.length}개 · 무료 CC0 (Kenney · Quaternius)`;', '''if (new URLSearchParams(location.search).get("map") === "1") await showMap();
    else {
      await showCharacter();
      $("status").textContent = `유닛 ${manifest.length}개 · 무료 CC0 (Kenney · Quaternius)`;
    }''')
(p/'main.ts').write_text(source,encoding='utf-8')
html=Path('C:/xoox/unit-lab-tool.html').read_text(encoding='utf-8-sig')
html=html.replace('<h3>블록 맵 i21 · 시점</h3>', '''<h3>블록 맵 i21 · 정화 후</h3>
            <label>맵 <select id="blockMapSector"><option value="i21">i21 들판 · 선착장</option><option value="i11">i11 중앙 · 교차로</option></select></label>
            <label>상태 <select id="blockMapState"><option value="purified">정화 후</option><option value="polluted">정화 전</option></select></label>
            <label><input id="blockMapActors" type="checkbox"> 몬스터 12마리 함께 보기</label>
            <button class="fx-btn" id="blockMapReload">최신 맵 다시 불러오기</button>''')
html=html.replace('마우스로 돌려 보기 · 휠 확대. 원본: 수스이미지 생성 / 2026-09-26-map-voxel / i21','마우스로 회전 · 휠 확대. 정화 전·후는 같은 시점에서 비교합니다. 제작 업데이트는 자동 반영됩니다.')
(p/'unit-lab-tool.html').write_text(html,encoding='utf-8')
