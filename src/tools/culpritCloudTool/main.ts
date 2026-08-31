/**
 * 원흉 점구름 미리보기 — 도형 + 반려동물 3(Tobby · Bolinha · Vrum) + 연출 4박자.
 */
import * as THREE from "three";
import { CulpritCloud, loadBugVolume, loadCulpritGlobe, loadHumanCulprit, loadPetImage, loadPollutant, loadStainDroplet, loadWaterDroplet, petFit, type CulpritForm } from "../../stage/world3d/CulpritCloud";

type PetMemory = { id: string; name: string; image: string };
type PetRoster = { max: number; active: string; pets: PetMemory[] };

const PET_ROSTER_SRC = "/art/culprit/pets.json";

let roster: PetRoster | null = null;
let activePet: PetMemory | null = null;

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const canvas = $<HTMLCanvasElement>("cloudCanvas");
const statusEl = $<HTMLElement>("status");
const hudEl = $<HTMLElement>("hudState");

function setStatus(msg: string) {
  statusEl.textContent = msg;
}

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setClearColor(0x030d18, 1);
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x030d18, 14, 42);

const camera = new THREE.PerspectiveCamera(48, 16 / 9, 0.1, 80);
let az = Math.PI * 0.5 - 0.26;
let el = 0.16;
let dist = 6.6;
const look = new THREE.Vector3(0, 1.42, 0);

function placeCam() {
  camera.position.set(
    look.x + Math.cos(az) * Math.cos(el) * dist,
    look.y + Math.sin(el) * dist,
    look.z + Math.sin(az) * Math.cos(el) * dist,
  );
  camera.lookAt(look);
}

function frameStandCam() {
  az = Math.PI * 0.5 - 0.26;
  el = 0.16;
  dist = 6.6;
  look.set(0, 1.42, 0);
  placeCam();
}

/** 옆면 입체감이 보이게 3/4 시점 */
function frameVolumeCam() {
  az = Math.PI * 0.5 - 0.62;
  el = 0.16;
  dist = 7.1;
  look.set(0, 1.28, 0);
  placeCam();
}

/** 바닥에 붙은 둥근 얼룩이 보이게 */
function frameStainCam() {
  az = Math.PI * 0.5 - 0.42;
  el = 0.72;
  dist = 7.6;
  look.set(0, 0.18, 0);
  placeCam();
}
placeCam();

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(8, 48),
  new THREE.MeshBasicMaterial({ color: 0x071726, transparent: true, opacity: 0.92 }),
);
ground.rotation.x = -Math.PI * 0.5;
scene.add(ground);

const ring = new THREE.Mesh(
  new THREE.RingGeometry(1.35, 1.55, 48),
  new THREE.MeshBasicMaterial({ color: 0xa7439d, transparent: true, opacity: 0.55, side: THREE.DoubleSide }),
);
ring.rotation.x = -Math.PI * 0.5;
ring.position.y = 0.055;
scene.add(ring);

const cloud = new CulpritCloud({ form: "pet", count: 80, size: 0.02 });
scene.add(cloud.group);
cloud.gather = 1;
cloud.gatherTo = 1;
cloud.purify = 1;
cloud.purifyTo = 1;

let dragging = false;
let lastX = 0;
let lastY = 0;
canvas.addEventListener("pointerdown", (e) => {
  dragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener("pointerup", () => {
  dragging = false;
});
canvas.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  az += (e.clientX - lastX) * 0.008;
  el = Math.max(0.08, Math.min(1.15, el + (e.clientY - lastY) * 0.006));
  lastX = e.clientX;
  lastY = e.clientY;
  placeCam();
});
canvas.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    dist = Math.max(4.2, Math.min(18, dist + e.deltaY * 0.01));
    placeCam();
  },
  { passive: false },
);

function fit() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
new ResizeObserver(fit).observe(canvas.parentElement ?? canvas);
fit();

function setDial(count: number, size: number) {
  const countEl = $<HTMLInputElement>("dialCount");
  const sizeEl = $<HTMLInputElement>("dialSize");
  countEl.value = String(count);
  $("countVal").textContent = String(count);
  sizeEl.value = String(size);
  $("sizeVal").textContent = size.toFixed(2);
}

function applyForm(form: CulpritForm, count: number, size: number, label: string) {
  setDial(count, size);
  cloud.setForm(form);
  cloud.rebuild(count);
  cloud.setSize(size);
  if (form === "pet") {
    cloud.gather = 1;
    cloud.gatherTo = 1;
    cloud.purify = 1;
    cloud.purifyTo = 1;
    cloud.rise = 1;
    cloud.riseTo = 1;
  } else if (
    form === "bug" ||
    form === "human" ||
    form === "triangle" ||
    form === "square" ||
    form === "circle" ||
    form === "stain" ||
    form === "matter" ||
    form === "droplet" ||
    form === "culprit"
  ) {
    cloud.gather = 1;
    cloud.gatherTo = 1;
    cloud.purify = form === "stain" || form === "culprit" || form === "human" || form === "matter" || form === "bug" ? 0 : 1;
    cloud.purifyTo = cloud.purify;
    cloud.rise = 1;
    cloud.riseTo = 1;
    markPetButton("");
  } else {
    cloud.playGather();
    markPetButton("");
  }
  setStatus(label);
}

function applyPet() {
  const fit = petFit();
  const name = activePet?.name ?? "Tobby";
  applyForm("pet", fit.count, fit.size, `${name} (${fit.count}점)`);
}

function markPetButton(id: string) {
  if (!roster) return;
  for (const pet of roster.pets) {
    const btn = document.getElementById(`btnPet${pet.id}`);
    if (!btn) continue;
    btn.classList.toggle("primary", pet.id === id);
  }
}

async function showPet(id: string) {
  const pet = roster?.pets.find((p) => p.id === id);
  if (!pet) return;
  setStatus(`${pet.name} 불러오는 중…`);
  await loadPetImage(pet.image);
  activePet = pet;
  markPetButton(pet.id);
  frameStandCam();
  applyPet();
}

async function showBug() {
  setStatus("오염 벌레 불러오는 중…");
  await loadBugVolume();
  const fit = petFit();
  frameVolumeCam();
  look.set(0, 0.95, 0);
  az = Math.PI * 0.5 - 0.88;
  dist = 6.4;
  placeCam();
  applyForm("bug", Math.min(32000, fit.count), Math.max(0.045, fit.size), `오염 벌레 (${fit.count}점)`);
}

async function showHuman() {
  setStatus("인간 원흉 불러오는 중…");
  await loadHumanCulprit();
  const fit = petFit();
  frameVolumeCam();
  look.set(0, 1.42, 0);
  dist = 7.6;
  placeCam();
  applyForm("human", Math.min(36000, fit.count), Math.max(0.045, fit.size), `인간 원흉 (${fit.count}점)`);
}

async function showStain() {
  setStatus("얼룩 불러오는 중…");
  await loadStainDroplet();
  const fit = petFit();
  frameStainCam();
  applyForm("stain", Math.min(18000, fit.count), Math.max(0.05, fit.size), `얼룩 (${fit.count}점)`);
  cloud.purify = 0;
  cloud.purifyTo = 0;
}

async function showMatter() {
  setStatus("오염물질 불러오는 중…");
  await loadPollutant();
  const fit = petFit();
  frameVolumeCam();
  look.set(0, 1.28, 0);
  el = 0.16;
  dist = 8.2;
  placeCam();
  applyForm("matter", Math.min(36000, fit.count), Math.max(0.045, fit.size), `오염물질 (${fit.count}점)`);
}

async function showDroplet() {
  setStatus("물방울 불러오는 중…");
  const n = loadWaterDroplet();
  const fit = petFit();
  frameStandCam();
  look.set(0, 1.12, 0);
  el = 0.22;
  dist = 6.4;
  placeCam();
  applyForm("droplet", fit.count, fit.size, `물방울 (${n}점)`);
}

async function showCulprit() {
  setStatus("원흉 불러오는 중…");
  const n = loadCulpritGlobe();
  const fit = petFit();
  frameStainCam();
  dist = 8.2;
  look.set(0, 1.35, 0);
  placeCam();
  applyForm("culprit", fit.count, fit.size, `원흉 (${n}점)`);
  cloud.purify = 0;
  cloud.purifyTo = 0;
}

$("btnPetTobby").addEventListener("click", () => {
  void showPet("Tobby");
});
$("btnPetBolinha").addEventListener("click", () => {
  void showPet("Bolinha");
});
$("btnPetVrum").addEventListener("click", () => {
  void showPet("Vrum");
});
$("btnCircle").addEventListener("click", () => {
  void showStain();
});
$("btnMatter").addEventListener("click", () => {
  void showMatter();
});
$("btnDrop").addEventListener("click", () => {
  void showDroplet();
});
$("btnTriangle").addEventListener("click", () => {
  void showBug();
});
$("btnHuman").addEventListener("click", () => {
  void showHuman();
});
$("btnSquare").addEventListener("click", () => {
  void showCulprit();
});

$("btnRise").addEventListener("click", () => {
  cloud.spawn();
  setStatus("리젠 · 땅에서 올라오기");
});
$("btnHit").addEventListener("click", () => {
  cloud.hit();
  setStatus("히트");
});
$("btnGather").addEventListener("click", () => {
  cloud.playGather();
  setStatus("1 모으기");
});
$("btnScatter").addEventListener("click", () => {
  cloud.die();
  setStatus("죽음 · 퍼지기");
});
$("btnPurify").addEventListener("click", () => {
  cloud.playAfterPurify();
  setStatus("3 정화후");
});
$("btnBlight").addEventListener("click", () => {
  cloud.playBeforePurify();
  setStatus("2 정화전");
});

const countEl = $<HTMLInputElement>("dialCount");
const sizeEl = $<HTMLInputElement>("dialSize");
const countVal = $("countVal");
const sizeVal = $("sizeVal");

countEl.addEventListener("input", () => {
  countVal.textContent = countEl.value;
});
countEl.addEventListener("change", () => {
  cloud.rebuild(Number(countEl.value));
  setStatus(`점 ${countEl.value}개`);
});
sizeEl.addEventListener("input", () => {
  sizeVal.textContent = Number(sizeEl.value).toFixed(2);
  cloud.setSize(Number(sizeEl.value));
});

let last = performance.now();
function loop(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  cloud.tick(dt);
  const ringMat = ring.material as THREE.MeshBasicMaterial;
  ringMat.opacity = 0.25 + cloud.rise * 0.35;
  renderer.render(scene, camera);
  hudEl.textContent = `모임 ${cloud.gather.toFixed(2)} · 정화 ${cloud.purify.toFixed(2)} · 상승 ${cloud.rise.toFixed(2)}`;
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
setStatus("반려동물 불러오는 중…");

void (async () => {
  try {
    const res = await fetch(PET_ROSTER_SRC);
    roster = (await res.json()) as PetRoster;
    const first = roster.pets.find((p) => p.id === roster!.active) ?? roster.pets[0];
    if (!first) throw new Error("pets.json empty");
    const q = new URLSearchParams(location.search);
    const form = q.get("form");
    if (form === "stain") await showStain();
    else if (form === "matter") await showMatter();
    else if (form === "drop") await showDroplet();
    else if (form === "culprit") await showCulprit();
    else if (form === "bug") await showBug();
    else if (form === "human") await showHuman();
    else await showPet(first.id);
    const act = q.get("act");
    if (act === "hit") cloud.hit();
    else if (act === "spawn") cloud.spawn();
    else if (act === "die") cloud.die();
  } catch (err) {
    console.error(err);
    applyForm("cloud", 2400, 0.1, "반려동물 로드 실패 · 구름으로 대체");
  }
})();
