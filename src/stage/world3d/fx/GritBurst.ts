/**
 * 모래엔진 burst / erosion 운동 → Three.js 알갱이 (박스).
 * ParticleSystem·EntitySystem 복사 없음. 수식만.
 */
import * as THREE from "three";
import type { JourneyStage3D } from "../JourneyStage3D";
import { PURIFY_GRIT } from "./sandDissolve";

export type GritMode = "burst" | "erosion";

export interface GritEmitOpts {
  x: number;
  z: number;
  y?: number;
  count?: number;
  mode?: GritMode;
  /** 반경(m) — burst 수평 퍼짐 / erosion 시작 박스 */
  spreadM?: number;
  lifeSec?: number;
  sizeMin?: number;
  sizeMax?: number;
  /** 정화(teal) vs 오염(blight) vs 폭단 생명색. 기본 teal */
  palette?: "teal" | "blight" | "life";
}

interface Grit {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  gravity: number;
  drag: number;
}

const sharedGeo = new THREE.BoxGeometry(1, 1, 1);

export class GritBurst {
  private parts: Grit[] = [];

  constructor(private readonly stage: JourneyStage3D) {}

  emit(opts: GritEmitOpts): void {
    const n = Math.max(1, Math.floor(opts.count ?? 14));
    const mode = opts.mode ?? "burst";
    const spread = opts.spreadM ?? 0.55;
    const lifeBase = opts.lifeSec ?? 0.45;
    const y0 = opts.y ?? 0.45;
    const colors =
      opts.palette === "blight"
        ? PURIFY_GRIT.blight
        : opts.palette === "life"
          ? PURIFY_GRIT.life
          : PURIFY_GRIT.teal;
    const sizeMin = opts.sizeMin ?? 0.04;
    const sizeMax = opts.sizeMax ?? 0.09;

    for (let i = 0; i < n; i++) {
      const size = sizeMin + Math.random() * Math.max(0.01, sizeMax - sizeMin);
      const hex = colors[i % colors.length]!;
      const mat = new THREE.MeshBasicMaterial({
        color: hex,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        fog: true,
      });
      const mesh = new THREE.Mesh(sharedGeo, mat);
      mesh.scale.setScalar(size);
      mesh.renderOrder = 6;

      let vx: number;
      let vy: number;
      let vz: number;
      let gravity: number;
      let drag: number;

      if (mode === "erosion") {
        const ox = (Math.random() * 2 - 1) * spread * 0.45;
        const oz = (Math.random() * 2 - 1) * spread * 0.45;
        mesh.position.set(opts.x + ox, y0 + Math.random() * 0.35, opts.z + oz);
        const len = Math.hypot(ox, oz) || 1;
        const spd = 0.8 + Math.random() * 2.2;
        vx = (ox / len) * spd + (Math.random() - 0.5) * 0.6;
        vz = (oz / len) * spd + (Math.random() - 0.5) * 0.6;
        vy = 0.6 + Math.random() * 1.4;
        gravity = 6;
        drag = 1.5;
      } else {
        const ang = Math.random() * Math.PI * 2;
        const spd = spread * (0.9 + Math.random() * 2.4);
        mesh.position.set(opts.x, y0 + Math.random() * 0.25, opts.z);
        vx = Math.cos(ang) * spd;
        vz = Math.sin(ang) * spd;
        vy = 1.0 + Math.random() * 1.8;
        gravity = 5;
        drag = 2;
      }

      this.stage.addOverlay(mesh);
      const life = lifeBase * (0.65 + Math.random() * 0.5);
      this.parts.push({ mesh, vx, vy, vz, life, maxLife: life, gravity, drag });
    }
  }

  tick(dt: number): void {
    if (!this.parts.length) return;
    const keep: Grit[] = [];
    for (const p of this.parts) {
      p.life -= dt;
      p.vx *= 1 - dt * p.drag;
      p.vz *= 1 - dt * p.drag;
      p.vy -= p.gravity * dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      const mat = p.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, (p.life / p.maxLife) * 0.95);
      if (p.life <= 0 || p.mesh.position.y < -0.2) {
        this.stage.removeOverlay(p.mesh);
        mat.dispose();
        continue;
      }
      keep.push(p);
    }
    this.parts = keep;
  }

  dispose(): void {
    for (const p of this.parts) {
      this.stage.removeOverlay(p.mesh);
      (p.mesh.material as THREE.Material).dispose();
    }
    this.parts = [];
  }
}
