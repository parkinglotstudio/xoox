/**
 * 오브젝트 목록. 예전 연출과 숲에서 만든 모델을 눌러 본다.
 * 점구름 펫(토비·볼리냐·브룸)은 넣지 않는다.
 */
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { createPurifyOrb, spinPurifyOrb } from "../../stage/world3d/fx/ThrowBurstFx";
import { GritBurst } from "../../stage/world3d/fx/GritBurst";
import { CulpritCloud, type CulpritForm } from "../../stage/world3d/CulpritCloud";
import { createMarkCore, type CulpritPresence } from "../../stage/world3d/purify/CulpritPresence";
import type { JourneyStage3D } from "../../stage/world3d/JourneyStage3D";
import { loadVoxelMonster } from "../../stage/monsters/voxelMonster";

type Kind = "orb" | "grit" | "cloud" | "core" | "glb" | "voxel" | "note";

type Entry = {
  id: string;
  name: string;
  group: string;
  kind: Kind;
  form?: CulpritForm;
  url?: string;
  voxelId?: string;
  note: string;
};

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const canvas = $<HTMLCanvasElement>("view");
const stage = canvas.parentElement!;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
scene.background = new THREE.Color("#101610");
const camera = new THREE.PerspectiveCamera(40, 1, 0.05, 80);
camera.position.set(1.8, 1.3, 2.4);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.target.set(0, 0.4, 0);
scene.add(new THREE.HemisphereLight("#d7ecff", "#243028", 1.1));
const sun = new THREE.DirectionalLight("#fff0c8", 1.4);
sun.position.set(2.2, 4, 2.4);
scene.add(sun);
const floor = new THREE.Mesh(
  new THREE.CircleGeometry(2.2, 40),
  new THREE.MeshStandardMaterial({ color: "#1c2a22", roughness: 1 }),
);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

const loader = new GLTFLoader();
const entries: Entry[] = [];
let selected = "";
let orb: THREE.Group | null = null;
let cloud: CulpritCloud | null = null;
let core: CulpritPresence | null = null;
let grit: GritBurst | null = null;
let model: THREE.Object3D | null = null;
let mixer: THREE.AnimationMixer | null = null;
let gritAcc = 0;
const clock = new THREE.Clock();

const overlay = {
  addOverlay(o: THREE.Object3D) {
    scene.add(o);
  },
  removeOverlay(o: THREE.Object3D) {
    scene.remove(o);
  },
};

function disposeObject(root: THREE.Object3D): void {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry?.dispose();
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const mat of mats) mat?.dispose();
  });
}

function clearPreview(): void {
  grit?.dispose();
  grit = null;
  if (cloud) {
    scene.remove(cloud.group);
    cloud.dispose();
    cloud = null;
  }
  if (core) {
    core.dispose();
    core = null;
  }
  if (orb) {
    scene.remove(orb);
    disposeObject(orb);
    orb = null;
  }
  if (model) {
    scene.remove(model);
    disposeObject(model);
    model = null;
    mixer = null;
  }
}

function fit(root: THREE.Object3D): void {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const h = Math.max(0.2, box.getSize(new THREE.Vector3()).y);
  root.scale.multiplyScalar(1.4 / h);
  root.updateMatrixWorld(true);
  const fitted = new THREE.Box3().setFromObject(root);
  const center = fitted.getCenter(new THREE.Vector3());
  root.position.x -= center.x;
  root.position.z -= center.z;
  root.position.y -= fitted.min.y;
  controls.target.set(0, 0.7, 0);
  camera.position.set(1.5, 1.15, 2.3);
}

async function show(entry: Entry): Promise<void> {
  clearPreview();
  controls.target.set(0, 0.45, 0);
  camera.position.set(1.8, 1.3, 2.4);
  if (entry.kind === "orb") {
    orb = createPurifyOrb();
    orb.position.y = 0.35;
    scene.add(orb);
    controls.target.set(0, 0.35, 0);
    camera.position.set(0.9, 0.7, 1.5);
    return;
  }
  if (entry.kind === "grit") {
    grit = new GritBurst(overlay as unknown as JourneyStage3D);
    grit.emit({ x: 0, z: 0, y: 0.15, count: 28, spreadM: 0.7, lifeSec: 0.9, palette: "teal" });
    return;
  }
  if (entry.kind === "core") {
    core = createMarkCore();
    scene.add(core.group);
    controls.target.set(0, 0.9, 0);
    camera.position.set(2.6, 1.7, 3.4);
    return;
  }
  if (entry.kind === "cloud") {
    cloud = new CulpritCloud({ form: entry.form ?? "stain", palette: "blight", count: 700, size: 0.07 });
    cloud.gather = 0.42;
    cloud.gatherTo = 0.42;
    cloud.group.position.y = 0.15;
    scene.add(cloud.group);
    return;
  }
  if (entry.kind === "voxel" && entry.voxelId) {
    model = await loadVoxelMonster(entry.voxelId);
    scene.add(model);
    fit(model);
    return;
  }
  if (entry.kind === "note" || !entry.url) return;
  const gltf = await loader.loadAsync(entry.url);
  model = gltf.scene;
  scene.add(model);
  fit(model);
  if (gltf.animations.length) {
    mixer = new THREE.AnimationMixer(model);
    const clip = gltf.animations.find((c) => /idle/i.test(c.name)) ?? gltf.animations[0]!;
    mixer.clipAction(clip).play();
  }
}

function renderList(): void {
  const q = ($<HTMLInputElement>("search").value || "").toLowerCase();
  const group = $<HTMLSelectElement>("group").value;
  const shown = entries.filter((e) => (!group || e.group === group) && `${e.name} ${e.id}`.toLowerCase().includes(q));
  const root = $("list");
  root.replaceChildren();
  for (const entry of shown) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = entry.name;
    if (entry.id === selected) b.setAttribute("aria-current", "true");
    b.onclick = () => {
      selected = entry.id;
      $("info").textContent = `${entry.name}\n분류: ${entry.group}\n${entry.note}`;
      renderList();
      void show(entry).catch((err) => {
        $("info").textContent = `${entry.name}\n미리보기를 열지 못했다.\n${entry.note}\n${String(err)}`;
      });
    };
    root.append(b);
  }
  $("count").textContent = `${shown.length} / ${entries.length}`;
}

function fillGroups(): void {
  const sel = $<HTMLSelectElement>("group");
  const names = [...new Set(entries.map((e) => e.group))];
  for (const name of names) {
    const o = document.createElement("option");
    o.value = o.textContent = name;
    sel.append(o);
  }
}

function pushEffect(): void {
  const clouds: Array<[CulpritForm, string, string]> = [
    ["stain", "점구름 오염 · 얼룩", "점구름으로 바닥에 흩뿌리는 오염."],
    ["bug", "점구름 오염 · 벌레", "점구름 오염 벌레."],
    ["culprit", "점구름 오염 · 원흉", "점구름 원흉."],
    ["cloud", "점구름 · 구름", "모여 있는 점구름."],
    ["matter", "점구름 · 물질", "덩어리 점구름."],
    ["droplet", "점구름 · 물방울", "물방울 점구름."],
    ["human", "점구름 · 사람 실루엣", "사람 실루엣 점구름. 펫은 넣지 않는다."],
    ["circle", "점구름 · 원", "원 점구름."],
    ["triangle", "점구름 · 삼각", "삼각 점구름."],
    ["square", "점구름 · 사각", "사각 점구름."],
  ];
  entries.push(
    {
      id: "fx-orb",
      name: "정화 구슬",
      group: "예전 연출",
      kind: "orb",
      note: "밝게 빛나는 정화 구슬. 본편에서는 포탑이 설 자리에 세워 둔다.",
    },
    {
      id: "fx-grit",
      name: "바닥 복셀",
      group: "예전 연출",
      kind: "grit",
      note: "정화할 때 바닥에서 작은 상자가 올라오는 효과.",
    },
    {
      id: "fx-core",
      name: "원흉 밝은 핵",
      group: "예전 연출",
      kind: "core",
      note: "임시 자리 표시. 포탑이 들어서기 전에 세워 두는 마젠타 불꽃.",
    },
  );
  for (const [form, name, note] of clouds) {
    entries.push({ id: `fx-${form}`, name, group: "예전 연출", kind: "cloud", form, note });
  }
}

function pushGlbs(group: string, dir: string, items: Array<[string, string]>, note: string): void {
  for (const [file, name] of items) {
    entries.push({
      id: `${group}-${file}`,
      name,
      group,
      kind: "glb",
      url: `${dir}/${file}.glb`,
      note: `${note} · ${file}`,
    });
  }
}

async function loadCatalogs(): Promise<void> {
  pushEffect();
  const manifest = (await fetch("/maps/forest150/manifest.json", { cache: "no-store" }).then((r) => r.json())) as {
    catalog?: string;
  };
  if (manifest.catalog) {
    const cat = (await fetch(manifest.catalog, { cache: "no-store" }).then((r) => r.json())) as {
      items?: Array<{ id: string; name: string; category: string; variants: Record<string, string> }>;
    };
    for (const item of cat.items ?? []) {
      const url = item.variants.purified ?? item.variants.polluted ?? Object.values(item.variants)[0];
      entries.push({
        id: `prop-${item.id}`,
        name: item.name || item.id,
        group: "숲 프롭",
        kind: url ? "glb" : "note",
        url,
        note: `${item.category} · ${item.id}`,
      });
    }
  }
  const free = (await fetch("/tools/unit_lab/units_free.json", { cache: "no-store" }).then((r) => r.json())) as {
    units?: Array<{ id: string; name: string; group: string; base?: string }>;
  };
  for (const unit of free.units ?? []) {
    if (unit.group === "enemy_monster") {
      entries.push({
        id: `vox-${unit.id}`,
        name: unit.name || unit.id,
        group: "복셀 몬스터",
        kind: "voxel",
        voxelId: unit.id,
        note: `블록으로 쌓은 몬스터 · ${unit.id}`,
      });
      continue;
    }
    const ufo = unit.group.startsWith("enemy");
    entries.push({
      id: `unit-${unit.id}`,
      name: unit.name || unit.id,
      group: ufo ? "숲 몬스터" : "숲 유닛",
      kind: "glb",
      url: `/tools/unit_lab/${unit.base || "units_free"}/${unit.id}.glb`,
      note: `${unit.group} · ${unit.id}`,
    });
  }
  pushGlbs(
    "포탑 부품",
    "/tools/unit_lab/kenney_parts",
    [
      ["tower-round-bottom-b", "둥근 탑 아래"],
      ["tower-round-middle-b", "둥근 탑 가운데"],
      ["tower-round-top-a", "둥근 탑 위"],
      ["tower-square-bottom-a", "사각 탑 아래"],
      ["tower-square-middle-a", "사각 탑 가운데"],
      ["tower-square-top-a", "사각 탑 위"],
      ["weapon-turret", "터렛 포"],
      ["weapon-cannon", "대포 포"],
      ["weapon-catapult", "투석 포"],
      ["weapon-ballista", "발리스타 포"],
      ["weapon-ammo-bullet", "탄환"],
      ["weapon-ammo-cannonball", "포탄"],
      ["weapon-ammo-boulder", "바위탄"],
      ["weapon-ammo-arrow", "화살"],
    ],
    "포탑을 조립하는 부품",
  );
  pushGlbs(
    "예전 유닛",
    "/tools/unit_lab/units",
    [
      ["block_gun", "블록 총"],
      ["block_throw", "블록 투척"],
      ["bomb", "폭탄"],
      ["enemy_orb", "적 구슬"],
      ["floor_tile", "바닥 타일"],
      ["rescue_mark", "구조 표식"],
      ["shot_gun", "산탄"],
    ],
    "유닛랩에 있던 초기 모델",
  );
  for (const pet of [
    ["nofilter", "NoFilter"],
    ["flux", "Flux"],
    ["lumos", "Lumos"],
    ["gizmo", "Gizmo"],
  ] as const) {
    entries.push({
      id: `pet-${pet[0]}`,
      name: pet[1],
      group: "펫",
      kind: "glb",
      url: `/tools/unit_lab/pets/${pet[0]}/${pet[0]}.glb`,
      note: "복셀 펫",
    });
  }
  entries.push({
    id: "pet-block-cat",
    name: "블록 고양이",
    group: "펫",
    kind: "glb",
    url: "/tools/unit_lab/pets/block_cat/block_cat.glb",
    note: "BCAT02",
  });
  const installed = (await fetch("/tools/unit_lab/installed/manifest.json", { cache: "no-store" }).then((r) => r.json())) as {
    groups?: Array<{ name: string; dir: string; items: Array<{ file: string; name: string }> }>;
  };
  for (const group of installed.groups ?? []) {
    if (group.name === "몬스터 원본") continue;
    pushGlbs(
      group.name,
      group.dir,
      group.items.map((item) => [item.file, item.name]),
      "받아 둔 원본. 게임에는 넣지 않고 이 툴에서만 본다.",
    );
  }
}

function frame(): void {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, clock.getDelta());
  const t = clock.elapsedTime;
  if (orb) spinPurifyOrb(orb, t);
  cloud?.tick(dt);
  core?.tick(dt);
  if (grit) {
    grit.tick(dt);
    gritAcc += dt;
    if (gritAcc > 0.85) {
      gritAcc = 0;
      grit.emit({ x: 0, z: 0, y: 0.12, count: 22, spreadM: 0.65, lifeSec: 0.85, palette: "teal" });
    }
  }
  mixer?.update(dt);
  controls.update();
  renderer.render(scene, camera);
}

new ResizeObserver(() => {
  const w = Math.max(1, stage.clientWidth);
  const h = Math.max(1, stage.clientHeight);
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}).observe(stage);

$<HTMLSelectElement>("group").onchange = () => renderList();
$<HTMLInputElement>("search").oninput = () => renderList();

void loadCatalogs()
  .then(() => {
    fillGroups();
    renderList();
    $("info").textContent = "왼쪽에서 고르면 여기에 나온다.";
    const first = entries[0];
    if (first) {
      selected = first.id;
      $("info").textContent = `${first.name}\n분류: ${first.group}\n${first.note}`;
      renderList();
      return show(first);
    }
  })
  .catch((err) => {
    $("info").textContent = "목록을 열지 못했다.\n" + String(err);
  });

requestAnimationFrame(frame);
