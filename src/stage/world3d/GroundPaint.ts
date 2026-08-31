/**
 * 바닥 칠 — 청록(정화)과 보라(오염)가 서로를 덮는다.
 *
 * 그림은 원형 데칼, 판정은 거친 격자. 격자만으로 거점 주변 %를 센다.
 */
import * as THREE from "three";
import type { JourneyStage3D } from "./JourneyStage3D";

export type PaintKind = "teal" | "blight";

const GRID = 52;
const MAX_STAMPS = 220;

interface Stamp {
  mesh: THREE.Mesh;
  used: boolean;
}

export class GroundPaint {
  private cells: Uint8Array;
  private stamps: Stamp[] = [];
  private cursor = 0;
  private tealTex: THREE.Texture;
  private blightTex: THREE.Texture;
  private geo: THREE.CircleGeometry;

  constructor(
    private readonly stage: JourneyStage3D,
    private radiusM: number,
  ) {
    this.cells = new Uint8Array(GRID * GRID);
    this.tealTex = makeSplatTexture("#2de0d0", "#7ff0c0");
    this.blightTex = makeSplatTexture("#6b3aa8", "#c090ff");
    this.geo = new THREE.CircleGeometry(1, 20);
    const group = stage.getPaintGroup();
    for (let i = 0; i < MAX_STAMPS; i++) {
      const mat = new THREE.MeshBasicMaterial({
        map: this.tealTex,
        transparent: true,
        depthWrite: false,
        fog: true,
        opacity: 0.9,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      });
      const mesh = new THREE.Mesh(this.geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.visible = false;
      mesh.renderOrder = 4;
      group.add(mesh);
      this.stamps.push({ mesh, used: false });
    }
  }

  setRadius(m: number): void {
    this.radiusM = Math.max(0.3, m);
  }

  at(x: number, z: number): PaintKind | null {
    const i = this.indexAt(x, z);
    if (i < 0) return null;
    const v = this.cells[i];
    if (v === 1) return "teal";
    if (v === 2) return "blight";
    return null;
  }

  stamp(x: number, z: number, kind: PaintKind, overwrite = 1, scaleMul = 1): void {
    const half = this.stage.getWorldScale() / 2;
    if (Math.abs(x) > half - 0.4 || Math.abs(z) > half - 0.4) return;
    const mul = Math.max(0.2, scaleMul);
    this.paintCells(x, z, kind, overwrite, this.radiusM * mul);
    this.placeStamp(x, z, kind, scaleMul);
  }

  /** 그 자리의 오염 데칼을 남기지 않고 걷는다 */
  eraseNear(x: number, z: number, radiusM?: number): void {
    const r = Math.max(this.radiusM, radiusM ?? this.radiusM);
    this.eraseCells(x, z, r);
    for (const s of this.stamps) {
      if (!s.used) continue;
      if (Math.hypot(s.mesh.position.x - x, s.mesh.position.z - z) > r * 1.35) continue;
      const mat = s.mesh.material as THREE.MeshBasicMaterial;
      if (mat.map !== this.blightTex) continue;
      s.used = false;
      s.mesh.visible = false;
    }
  }

  /** 거점 주변 칸 중 청록 비율 0..1 */
  tealRatioNear(cx: number, cz: number, radiusM: number): number {
    const world = this.stage.getWorldScale();
    const cell = world / GRID;
    const r = Math.max(cell, radiusM);
    let tot = 0;
    let teal = 0;
    for (let i = 0; i < this.cells.length; i++) {
      const gx = i % GRID;
      const gz = Math.floor(i / GRID);
      const x = (gx / GRID - 0.5) * world + cell / 2;
      const z = (gz / GRID - 0.5) * world + cell / 2;
      if (Math.hypot(x - cx, z - cz) > r) continue;
      tot += 1;
      if (this.cells[i] === 1) teal += 1;
    }
    return tot <= 0 ? 0 : teal / tot;
  }

  /** 미니맵용 — 쓰인 칸만 */
  samples(limit = 80): { xPct: number; yPct: number; kind: PaintKind }[] {
    const out: { xPct: number; yPct: number; kind: PaintKind }[] = [];
    const world = this.stage.getWorldScale();
    const step = Math.max(1, Math.floor((GRID * GRID) / limit));
    for (let i = 0; i < this.cells.length; i += step) {
      const v = this.cells[i];
      if (v === 0) continue;
      const gx = i % GRID;
      const gz = Math.floor(i / GRID);
      const x = (gx / GRID - 0.5) * world;
      const z = (gz / GRID - 0.5) * world;
      const p = this.stage.worldToPct(x, z);
      out.push({ xPct: p.xPct, yPct: p.yPct, kind: v === 1 ? "teal" : "blight" });
    }
    return out;
  }

  clear(): void {
    this.cells.fill(0);
    for (const s of this.stamps) {
      s.used = false;
      s.mesh.visible = false;
    }
    this.cursor = 0;
  }

  dispose(): void {
    this.clear();
    this.tealTex.dispose();
    this.blightTex.dispose();
    this.geo.dispose();
    for (const s of this.stamps) {
      (s.mesh.material as THREE.Material).dispose();
      this.stage.getPaintGroup().remove(s.mesh);
    }
    this.stamps = [];
  }

  private eraseCells(x: number, z: number, r: number): void {
    const world = this.stage.getWorldScale();
    const cell = world / GRID;
    const minX = Math.max(0, Math.floor(((x - r) / world) * GRID + GRID / 2));
    const maxX = Math.min(GRID - 1, Math.floor(((x + r) / world) * GRID + GRID / 2));
    const minZ = Math.max(0, Math.floor(((z - r) / world) * GRID + GRID / 2));
    const maxZ = Math.min(GRID - 1, Math.floor(((z + r) / world) * GRID + GRID / 2));
    for (let gz = minZ; gz <= maxZ; gz++) {
      for (let gx = minX; gx <= maxX; gx++) {
        const cx = (gx / GRID - 0.5) * world + cell / 2;
        const cz = (gz / GRID - 0.5) * world + cell / 2;
        if (Math.hypot(cx - x, cz - z) > r) continue;
        this.cells[gz * GRID + gx] = 0;
      }
    }
  }

  private paintCells(x: number, z: number, kind: PaintKind, overwrite: number, radiusM = this.radiusM): void {
    const world = this.stage.getWorldScale();
    const cell = world / GRID;
    const r = radiusM;
    const code = kind === "teal" ? 1 : 2;
    const minX = Math.max(0, Math.floor((x - r) / world * GRID + GRID / 2));
    const maxX = Math.min(GRID - 1, Math.floor((x + r) / world * GRID + GRID / 2));
    const minZ = Math.max(0, Math.floor((z - r) / world * GRID + GRID / 2));
    const maxZ = Math.min(GRID - 1, Math.floor((z + r) / world * GRID + GRID / 2));
    for (let gz = minZ; gz <= maxZ; gz++) {
      for (let gx = minX; gx <= maxX; gx++) {
        const cx = (gx / GRID - 0.5) * world + cell / 2;
        const cz = (gz / GRID - 0.5) * world + cell / 2;
        if (Math.hypot(cx - x, cz - z) > r) continue;
        const i = gz * GRID + gx;
        const cur = this.cells[i] ?? 0;
        if (cur === 0 || cur === code || overwrite >= 0.5) this.cells[i] = code;
      }
    }
  }

  private placeStamp(x: number, z: number, kind: PaintKind, scaleMul = 1): void {
    const s = this.stamps[this.cursor % this.stamps.length];
    if (!s) return;
    this.cursor += 1;
    s.used = true;
    s.mesh.visible = true;
    s.mesh.position.set(x, 0.04, z);
    const mul = Math.max(0.2, scaleMul);
    s.mesh.scale.setScalar(this.radiusM * mul);
    const mat = s.mesh.material as THREE.MeshBasicMaterial;
    mat.map = kind === "teal" ? this.tealTex : this.blightTex;
    // 오염 바닥 원(핵)은 반투명 — 시안/보라 데칼이 너무 진하지 않게
    // 타이어마크(작은 스케일)는 더 옅게
    mat.opacity = mul < 0.7 ? 0.55 : 0.9;
    mat.needsUpdate = true;
  }

  private indexAt(x: number, z: number): number {
    const world = this.stage.getWorldScale();
    const gx = Math.floor((x / world + 0.5) * GRID);
    const gz = Math.floor((z / world + 0.5) * GRID);
    if (gx < 0 || gz < 0 || gx >= GRID || gz >= GRID) return -1;
    return gz * GRID + gx;
  }
}

function makeSplatTexture(inner: string, outer: string): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 8, 64, 64, 62);
  g.addColorStop(0, inner);
  g.addColorStop(0.55, outer);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}
