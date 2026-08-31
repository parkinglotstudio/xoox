/**
 * 라인 띠 안 희미한 오염원 — 1보라 · 2파랑 · 3초록 (테두리 8개 · 구름형)
 */
import * as THREE from "three";

export type TintStep = 1 | 2 | 3;

export const TINT_LINE: Record<
  TintStep,
  { center: string; mid: string; edge: string; deep: string; label: string }
> = {
  1: {
    label: "1차 · 보라",
    center: "rgba(210, 140, 230, 0.62)",
    mid: "rgba(150, 55, 200, 0.48)",
    edge: "rgba(90, 25, 140, 0.26)",
    deep: "rgba(35, 8, 60, 0)",
  },
  2: {
    label: "2차 · 파랑",
    center: "rgba(70, 130, 230, 0.58)",
    mid: "rgba(35, 95, 200, 0.46)",
    edge: "rgba(18, 48, 140, 0.28)",
    deep: "rgba(6, 18, 55, 0)",
  },
  3: {
    label: "3차 · 초록",
    center: "rgba(55, 180, 95, 0.58)",
    mid: "rgba(28, 140, 60, 0.46)",
    edge: "rgba(14, 85, 35, 0.28)",
    deep: "rgba(6, 40, 16, 0)",
  },
};

/** 괴기스러운 구름 얼룩 (원·네모가 아닌 들쭉날쭉한 덩어리) */
function softTex(step: TintStep): THREE.CanvasTexture {
  const pal = TINT_LINE[step];
  const s = 160;
  const c = document.createElement("canvas");
  c.width = s;
  c.height = s;
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, s, s);

  const lobes: { x: number; y: number; r: number }[] = [
    { x: 0.5, y: 0.48, r: 0.34 },
    { x: 0.32, y: 0.4, r: 0.26 },
    { x: 0.68, y: 0.42, r: 0.24 },
    { x: 0.44, y: 0.62, r: 0.22 },
    { x: 0.6, y: 0.58, r: 0.2 },
    { x: 0.38, y: 0.55, r: 0.18 },
    { x: 0.55, y: 0.32, r: 0.16 },
  ];

  for (const lobe of lobes) {
    const cx = lobe.x * s;
    const cy = lobe.y * s;
    const rr = lobe.r * s;
    const grd = g.createRadialGradient(cx, cy, 0, cx, cy, rr);
    grd.addColorStop(0, pal.center);
    grd.addColorStop(0.35, pal.mid);
    grd.addColorStop(0.72, pal.edge);
    grd.addColorStop(1, pal.deep);
    g.fillStyle = grd;
    g.beginPath();
    // 들쭉날쭉한 윤곽
    const spikes = 9;
    for (let i = 0; i <= spikes; i++) {
      const t = (i / spikes) * Math.PI * 2;
      const wobble = 0.72 + 0.28 * Math.sin(i * 2.3 + lobe.x * 11);
      const px = cx + Math.cos(t) * rr * wobble;
      const py = cy + Math.sin(t) * rr * wobble * 0.88;
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.closePath();
    g.fill();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

/** 원 둘레에 8등분 */
const EVEN_8 = Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2);

export class SoftBlightOctet {
  readonly group = new THREE.Group();
  private readonly meshes: THREE.Mesh[] = [];
  private tex: THREE.CanvasTexture;
  private readonly geo: THREE.PlaneGeometry;
  private time = 0;
  private step: TintStep = 1;

  constructor(step: TintStep = 1) {
    this.step = step;
    this.tex = softTex(step);
    this.geo = new THREE.PlaneGeometry(1, 1);
    for (let i = 0; i < 8; i++) {
      const mat = new THREE.MeshBasicMaterial({
        map: this.tex,
        transparent: true,
        opacity: 0.55,
        depthTest: false,
        depthWrite: false,
        fog: false,
        blending: THREE.NormalBlending,
      });
      const mesh = new THREE.Mesh(this.geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.renderOrder = 17;
      mesh.frustumCulled = false;
      this.group.add(mesh);
      this.meshes.push(mesh);
    }
  }

  setTint(step: TintStep): void {
    if (step === this.step) return;
    this.step = step;
    const next = softTex(step);
    for (const m of this.meshes) {
      const mat = m.material as THREE.MeshBasicMaterial;
      mat.map = next;
      mat.needsUpdate = true;
    }
    this.tex.dispose();
    this.tex = next;
  }

  setOnCircle(cx: number, cz: number, radiusM: number): void {
    const r = Math.max(0.6, radiusM);
    // 이전 대비 약 2배
    const size = Math.max(2.8, Math.min(4.8, r * 0.32));
    for (let i = 0; i < 8; i++) {
      const a = EVEN_8[i]!;
      const mesh = this.meshes[i]!;
      mesh.position.set(cx + Math.cos(a) * r, 0.38, cz + Math.sin(a) * r);
      // 개체마다 살짝 다른 찌그러짐
      const sx = size * (0.92 + (i % 3) * 0.08);
      const sz = size * (0.85 + (i % 4) * 0.07);
      mesh.scale.set(sx, sz, 1);
      mesh.rotation.z = (i * 0.37) % (Math.PI * 2);
    }
  }

  tick(dt: number): void {
    this.time += dt;
    for (let i = 0; i < this.meshes.length; i++) {
      const mesh = this.meshes[i]!;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.42 + 0.1 * Math.sin(this.time * 1.5 + i * 0.85);
      mesh.rotation.z += dt * (0.08 + (i % 3) * 0.03);
    }
  }

  dispose(): void {
    this.geo.dispose();
    this.tex.dispose();
    for (const m of this.meshes) {
      (m.material as THREE.Material).dispose();
    }
    this.group.removeFromParent();
  }
}
