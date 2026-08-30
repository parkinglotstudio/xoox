/**
 * 원흉 점구름 미리보기 — 도형(원/세모/네모) + 연출 4박자.
 */
import * as THREE from "three";
import { CulpritCloud, type CulpritForm } from "../../stage/world3d/CulpritCloud";

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
let az = 0.55;
let el = 0.38;
let dist = 9.2;
const look = new THREE.Vector3(0, 1.35, 0);

function placeCam() {
  camera.position.set(
    look.x + Math.cos(az) * Math.cos(el) * dist,
    look.y + Math.sin(el) * dist,
    look.z + Math.sin(az) * Math.cos(el) * dist,
  );
  camera.lookAt(look);
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
ring.position.y = 0.02;
scene.add(ring);

const cloud = new CulpritCloud({ form: "square", count: 2400, size: 0.1 });
scene.add(cloud.group);

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

function applyForm(form: CulpritForm, count: number, label: string) {
  const countEl = $<HTMLInputElement>("dialCount");
  countEl.value = String(count);
  $("countVal").textContent = String(count);
  cloud.setForm(form);
  cloud.rebuild(count);
  cloud.playGather();
  setStatus(label);
}

$("btnCircle").addEventListener("click", () => applyForm("circle", 280, "동그라미 · 얼룩"));
$("btnTriangle").addEventListener("click", () => applyForm("triangle", 320, "세모 · 벌레"));
$("btnSquare").addEventListener("click", () => applyForm("square", 2400, "네모 · 원흉"));

$("btnRise").addEventListener("click", () => {
  cloud.playRise();
  cloud.playBeforePurify();
  setStatus("땅에서 올라오며 모인다");
});
$("btnGather").addEventListener("click", () => {
  cloud.playGather();
  setStatus("1 모으기");
});
$("btnScatter").addEventListener("click", () => {
  cloud.playSpread();
  setStatus("4 퍼지기");
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
setStatus("네모 원흉부터. 왼쪽에서 도형·네 박자를 눌러봐");
