/**
 * 원흉·얼룩·벌레용 점구름.
 * 오염 = 어두운 마젠타·네이비. 정화 = 시안 주 + 마젠타·옐로 점.
 * 연출 4박자: 모으기 → 정화전 → 정화후 → 퍼지기
 * 도형: 원(얼룩) · 세모(벌레) · 네모(원흉)
 */
import * as THREE from "three";

export type CulpritForm = "cloud" | "bug" | "stain" | "circle" | "triangle" | "square";

export type CulpritShell = "cloud" | "circle" | "triangle" | "square";

const BLIGHT: { hex: number; w: number }[] = [
  { hex: 0x2a0e28, w: 18 },
  { hex: 0x4a1848, w: 22 },
  { hex: 0xa7439d, w: 28 },
  { hex: 0x6b2a62, w: 16 },
  { hex: 0x19314a, w: 12 },
  { hex: 0x5a4a12, w: 4 },
];

const PURE: { hex: number; w: number }[] = [
  { hex: 0x0fbec7, w: 36 },
  { hex: 0x0ed3d9, w: 20 },
  { hex: 0x9ff0ff, w: 10 },
  { hex: 0x106f83, w: 8 },
  { hex: 0xd158bc, w: 14 },
  { hex: 0xd1c51d, w: 10 },
  { hex: 0xe0d43b, w: 2 },
];

const LOBES: { x: number; y: number; z: number; r: number }[] = [
  { x: 0, y: 1.12, z: 0, r: 1.52 },
  { x: -1.38, y: 1.42, z: 0.18, r: 1.12 },
  { x: 1.28, y: 1.38, z: -0.22, r: 1.08 },
  { x: 0.12, y: 2.18, z: 0.06, r: 1.02 },
  { x: -0.58, y: 1.82, z: -0.88, r: 0.86 },
  { x: 0.72, y: 1.72, z: 0.92, r: 0.82 },
  { x: 0.02, y: 0.52, z: 0.08, r: 1.38 },
];

function hash(i: number, salt: number): number {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function hexRgb(hex: number): [number, number, number] {
  return [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255];
}

function pickWeighted(list: { hex: number; w: number }[], i: number, salt: number): number {
  const sum = list.reduce((a, r) => a + r.w, 0);
  let t = hash(i, salt) * sum;
  for (const row of list) {
    t -= row.w;
    if (t <= 0) return row.hex;
  }
  return list[0]!.hex;
}

export function shellOf(form: CulpritForm): CulpritShell {
  if (form === "stain" || form === "circle") return "circle";
  if (form === "bug" || form === "triangle") return "triangle";
  if (form === "square") return "square";
  return "cloud";
}

function sampleShell(shell: CulpritShell, i: number): { x: number; y: number; z: number } {
  if (shell === "circle") {
    const ang = hash(i, 2) * Math.PI * 2;
    const r = Math.sqrt(hash(i, 1)) * 1.28;
    return {
      x: Math.cos(ang) * r,
      y: 0.1 + hash(i, 3) * 0.32,
      z: Math.sin(ang) * r,
    };
  }
  if (shell === "triangle") {
    let u = hash(i, 1);
    let v = hash(i, 2);
    if (u + v > 1) {
      u = 1 - u;
      v = 1 - v;
    }
    const w = 1 - u - v;
    return {
      x: u * -1.2 + v * 1.2,
      y: 0.08 + hash(i, 3) * 0.22,
      z: w * 1.65 + u * -0.72 + v * -0.72,
    };
  }
  if (shell === "square") {
    const face = Math.floor(hash(i, 9) * 6);
    const a = hash(i, 1) * 2 - 1;
    const b = hash(i, 2) * 2 - 1;
    const d = 1.08;
    if (face === 0) return { x: d, y: 0.2 + (a * 0.5 + 0.5) * 1.7, z: b * d };
    if (face === 1) return { x: -d, y: 0.2 + (a * 0.5 + 0.5) * 1.7, z: b * d };
    if (face === 2) return { x: a * d, y: 1.9, z: b * d };
    if (face === 3) return { x: a * d, y: 0.18, z: b * d };
    if (face === 4) return { x: a * d, y: 0.2 + (b * 0.5 + 0.5) * 1.7, z: d };
    return { x: a * d, y: 0.2 + (b * 0.5 + 0.5) * 1.7, z: -d };
  }
  const lobes = LOBES;
  const weights = lobes.map((l) => l.r * l.r * l.r);
  const wSum = weights.reduce((s, n) => s + n, 0);
  if (hash(i, 9) < 0.16) {
    const bands = 13;
    const lat = ((Math.floor(hash(i, 2) * bands) + 0.5) / bands) * Math.PI;
    const lon = hash(i, 3) * Math.PI * 2;
    const rr = 2.05 + hash(i, 4) * 0.18;
    return {
      x: rr * Math.sin(lat) * Math.cos(lon),
      y: 1.15 + rr * 0.55 * Math.cos(lat),
      z: rr * Math.sin(lat) * Math.sin(lon),
    };
  }
  let pick = hash(i, 1) * wSum;
  let lobe = lobes[0]!;
  for (let li = 0; li < lobes.length; li++) {
    pick -= weights[li]!;
    if (pick <= 0) {
      lobe = lobes[li]!;
      break;
    }
  }
  let ux = 0;
  let uy = 0;
  let uz = 0;
  for (let t = 0; t < 8; t++) {
    ux = hash(i, 11 + t) * 2 - 1;
    uy = hash(i, 21 + t) * 2 - 1;
    uz = hash(i, 31 + t) * 2 - 1;
    if (ux * ux + uy * uy + uz * uz <= 1) break;
  }
  const fall = 0.55 + hash(i, 5) * 0.45;
  return {
    x: lobe.x + ux * lobe.r * fall,
    y: lobe.y + uy * lobe.r * fall * 0.72,
    z: lobe.z + uz * lobe.r * fall,
  };
}

let sharedDot: THREE.CanvasTexture | null = null;

function makeDotMap(): THREE.CanvasTexture {
  if (sharedDot) return sharedDot;
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 30);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.32, "rgba(255,255,255,0.88)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  sharedDot = new THREE.CanvasTexture(c);
  sharedDot.needsUpdate = true;
  return sharedDot;
}

export type CulpritCloudOpts = {
  count?: number;
  size?: number;
  form?: CulpritForm;
};

export class CulpritCloud {
  readonly group = new THREE.Group();
  form: CulpritForm;
  private points: THREE.Points;
  private geo: THREE.BufferGeometry;
  private mat: THREE.PointsMaterial;
  private rest: Float32Array;
  private scatter: Float32Array;
  private blight: Float32Array;
  private pure: Float32Array;
  private colors: Float32Array;
  private count: number;
  private time = 0;
  private spreadDelay = 0;
  gather = 1;
  purify = 0;
  rise = 1;
  gatherTo = 1;
  purifyTo = 0;
  riseTo = 1;

  constructor(opts: CulpritCloudOpts = {}) {
    this.form = opts.form ?? "cloud";
    this.count = Math.max(80, Math.floor(opts.count ?? defaultCount(this.form)));
    this.geo = new THREE.BufferGeometry();
    this.rest = new Float32Array(this.count * 3);
    this.scatter = new Float32Array(this.count * 3);
    this.blight = new Float32Array(this.count * 3);
    this.pure = new Float32Array(this.count * 3);
    this.colors = new Float32Array(this.count * 3);
    this.fillCloud();
    this.geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(this.count * 3), 3));
    this.geo.setAttribute("color", new THREE.BufferAttribute(this.colors, 3));
    this.mat = new THREE.PointsMaterial({
      size: opts.size ?? defaultSize(this.form),
      map: makeDotMap(),
      vertexColors: true,
      transparent: true,
      opacity: 0.96,
      depthWrite: false,
      blending: THREE.NormalBlending,
      sizeAttenuation: true,
    });
    this.points = new THREE.Points(this.geo, this.mat);
    this.points.frustumCulled = false;
    this.group.add(this.points);
    this.writeFrame(0);
  }

  setSize(px: number): void {
    this.mat.size = Math.max(0.03, px);
  }

  setWorld(x: number, z: number): void {
    this.group.position.set(x, 0, z);
  }

  setForm(form: CulpritForm): void {
    this.form = form;
    this.rebuild(this.count);
  }

  rebuild(count: number): void {
    this.count = Math.max(80, Math.floor(count));
    this.geo.dispose();
    this.geo = new THREE.BufferGeometry();
    this.rest = new Float32Array(this.count * 3);
    this.scatter = new Float32Array(this.count * 3);
    this.blight = new Float32Array(this.count * 3);
    this.pure = new Float32Array(this.count * 3);
    this.colors = new Float32Array(this.count * 3);
    this.fillCloud();
    this.geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(this.count * 3), 3));
    this.geo.setAttribute("color", new THREE.BufferAttribute(this.colors, 3));
    this.points.geometry = this.geo;
    this.writeFrame(0);
  }

  /** 땅에서 올라오며 모인다 */
  playRise(): void {
    this.rise = 0;
    this.gather = 0.12;
    this.riseTo = 1;
    this.gatherTo = 1;
    this.spreadDelay = 0;
  }

  /** 1. 모으기 — 흩어진 점이 도형으로 */
  playGather(): void {
    this.gather = 0.08;
    this.gatherTo = 1;
    this.purifyTo = 0;
    this.spreadDelay = 0;
  }

  /** 2. 정화전 — 도형이 오염색으로 붙어 있음 */
  playBeforePurify(): void {
    this.gatherTo = 1;
    this.purifyTo = 0;
    this.spreadDelay = 0;
  }

  /** 3. 정화후 — 같은 도형이 시안으로 */
  playAfterPurify(): void {
    this.gatherTo = 1;
    this.purifyTo = 1;
    this.spreadDelay = 0;
  }

  /** 4. 퍼지기 — 정화된 점이 흩어지며 사라짐 */
  playSpread(): void {
    this.gatherTo = 0;
    this.spreadDelay = 0;
  }

  /** 맞으면 정화후 → 잠시 뒤 퍼지기 */
  hitPurify(): void {
    this.purifyTo = 1;
    this.gatherTo = 1;
    this.spreadDelay = 0.32;
  }

  tick(dt: number): void {
    this.time += dt;
    if (this.spreadDelay > 0) {
      this.spreadDelay -= dt;
      if (this.spreadDelay <= 0) this.gatherTo = 0;
    }
    const k = 1 - Math.exp(-dt * 2.4);
    this.gather += (this.gatherTo - this.gather) * k;
    this.purify += (this.purifyTo - this.purify) * k;
    this.rise += (this.riseTo - this.rise) * (1 - Math.exp(-dt * 1.6));
    this.writeFrame(this.time);
  }

  dispose(): void {
    this.geo.dispose();
    this.mat.dispose();
    this.group.removeFromParent();
  }

  private fillCloud(): void {
    const shell = shellOf(this.form);
    const scatterR = shell === "cloud" ? 8 : shell === "square" ? 5.2 : shell === "triangle" ? 2.6 : 2.0;
    for (let i = 0; i < this.count; i++) {
      const p = sampleShell(shell, i);
      const o = i * 3;
      this.rest[o] = p.x;
      this.rest[o + 1] = p.y;
      this.rest[o + 2] = p.z;
      const ang = hash(i, 6) * Math.PI * 2;
      const elev = (hash(i, 7) - 0.5) * Math.PI;
      const dist = scatterR * (0.7 + hash(i, 8) * 0.9);
      this.scatter[o] = Math.cos(ang) * Math.cos(elev) * dist;
      this.scatter[o + 1] = p.y + Math.sin(elev) * dist * 0.4;
      this.scatter[o + 2] = Math.sin(ang) * Math.cos(elev) * dist;
      const b = hexRgb(pickWeighted(BLIGHT, i, 40));
      const pu = hexRgb(pickWeighted(PURE, i, 41));
      this.blight[o] = b[0];
      this.blight[o + 1] = b[1];
      this.blight[o + 2] = b[2];
      this.pure[o] = pu[0];
      this.pure[o + 1] = pu[1];
      this.pure[o + 2] = pu[2];
    }
  }

  private writeFrame(t: number): void {
    const pos = this.geo.getAttribute("position") as THREE.BufferAttribute;
    const col = this.geo.getAttribute("color") as THREE.BufferAttribute;
    const g = this.gather;
    const pu = this.purify;
    const shell = shellOf(this.form);
    const rise = shell === "cloud" || shell === "square" ? this.rise : 1;
    const arr = pos.array as Float32Array;
    const ca = col.array as Float32Array;
    const crawl = shell === "triangle" ? Math.sin(t * 3.2) * 0.04 : 0;
    for (let i = 0; i < this.count; i++) {
      const o = i * 3;
      const breath = Math.sin(t * 0.7 + i * 0.013) * 0.045;
      const rx = this.rest[o]! * (1 + breath);
      const ry = this.rest[o + 1]! + Math.sin(t * 0.55 + i * 0.02) * 0.06;
      const rz = this.rest[o + 2]! * (1 + breath) + crawl;
      const sx = this.scatter[o]!;
      const sy = this.scatter[o + 1]!;
      const sz = this.scatter[o + 2]!;
      arr[o] = sx + (rx - sx) * g;
      arr[o + 1] = (sy + (ry - sy) * g) * rise + (1 - rise) * -2.4;
      arr[o + 2] = sz + (rz - sz) * g;
      ca[o] = this.blight[o]! + (this.pure[o]! - this.blight[o]!) * pu;
      ca[o + 1] = this.blight[o + 1]! + (this.pure[o + 1]! - this.blight[o + 1]!) * pu;
      ca[o + 2] = this.blight[o + 2]! + (this.pure[o + 2]! - this.blight[o + 2]!) * pu;
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;
  }
}

function defaultCount(form: CulpritForm): number {
  const shell = shellOf(form);
  if (shell === "triangle") return 320;
  if (shell === "circle") return 240;
  if (shell === "square") return 2400;
  return 5200;
}

function defaultSize(form: CulpritForm): number {
  const shell = shellOf(form);
  if (shell === "triangle") return 0.09;
  if (shell === "circle") return 0.11;
  if (shell === "square") return 0.1;
  return 0.11;
}
