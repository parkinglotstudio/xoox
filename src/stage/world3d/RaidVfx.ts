/**
 * 습격 VFX — play(id, x, z). 스프라이트 없이 절차적 구.
 */
import * as THREE from "three";
import type { JourneyStage3D } from "./JourneyStage3D";
import { vfxById, type RaidTables } from "./raidTables";

interface Particle {
  mesh: THREE.Mesh;
  vx: number;
  vz: number;
  vy: number;
  life: number;
  maxLife: number;
}

export class RaidVfx {
  private parts: Particle[] = [];

  constructor(
    private readonly stage: JourneyStage3D,
    private readonly tables: RaidTables,
  ) {}

  play(id: string, x: number, z: number): void {
    const cfg = vfxById(this.tables, id);
    if (!cfg) return;
    const n = Math.max(1, cfg.particle_count);
    for (let i = 0; i < n; i++) {
      const size = cfg.size_min + Math.random() * Math.max(0.01, cfg.size_max - cfg.size_min);
      const geo = new THREE.SphereGeometry(size, 6, 6);
      const mat = new THREE.MeshBasicMaterial({
        color: cfg.color_hex,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        fog: true,
      });
      const mesh = new THREE.Mesh(geo, mat);
      const ang = Math.random() * Math.PI * 2;
      const sp = cfg.spread_m * (0.3 + Math.random());
      mesh.position.set(x, 0.4 + Math.random() * 0.5, z);
      this.stage.addOverlay(mesh);
      this.parts.push({
        mesh,
        vx: Math.cos(ang) * sp,
        vz: Math.sin(ang) * sp,
        vy: 1.2 + Math.random() * 1.6,
        life: cfg.life_sec,
        maxLife: cfg.life_sec,
      });
    }
  }

  tick(dt: number): void {
    const keep: Particle[] = [];
    for (const p of this.parts) {
      p.life -= dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.z += p.vz * dt;
      p.mesh.position.y += p.vy * dt;
      p.vy -= 4 * dt;
      const mat = p.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, p.life / p.maxLife);
      if (p.life <= 0) {
        this.stage.removeOverlay(p.mesh);
        p.mesh.geometry.dispose();
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
      p.mesh.geometry.dispose();
      (p.mesh.material as THREE.Material).dispose();
    }
    this.parts = [];
  }
}
