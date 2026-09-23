/**
 * 정화 미사일 — 유탄총처럼 살짝 곡선을 그리며 날아간다.
 * 착탄하면 땅을 칠하고, 근처 오염을 맞춘다.
 */
import * as THREE from "three";
import type { JourneyStage3D } from "./JourneyStage3D";

export const PURIFY_WEAPON_MISSILE = "missile" as const;
export type PurifyWeaponType = typeof PURIFY_WEAPON_MISSILE;

const Y_UP = new THREE.Vector3(0, 1, 0);

export interface MissileImpact {
  x: number;
  z: number;
}

interface LiveMissile {
  mesh: THREE.Group;
  x0: number;
  y0: number;
  z0: number;
  x1: number;
  y1: number;
  z1: number;
  arc: number;
  t: number;
  dur: number;
}

export class PurifyMissilePool {
  private live: LiveMissile[] = [];
  private idle: THREE.Group[] = [];
  private bodyGeo: THREE.CylinderGeometry;
  private noseGeo: THREE.ConeGeometry;
  private bodyMat: THREE.MeshBasicMaterial;
  private noseMat: THREE.MeshBasicMaterial;
  private glowMat: THREE.MeshBasicMaterial;
  private glowGeo: THREE.SphereGeometry;
  private vel = new THREE.Vector3();

  constructor(private readonly stage: JourneyStage3D) {
    this.bodyGeo = new THREE.CylinderGeometry(0.07, 0.09, 0.38, 8);
    this.noseGeo = new THREE.ConeGeometry(0.09, 0.18, 8);
    this.glowGeo = new THREE.SphereGeometry(0.16, 8, 8);
    this.bodyMat = new THREE.MeshBasicMaterial({
      color: 0x2de0d0,
      fog: true,
    });
    this.noseMat = new THREE.MeshBasicMaterial({
      color: 0xffe08a,
      fog: true,
    });
    this.glowMat = new THREE.MeshBasicMaterial({
      color: 0x7ff8e8,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
      fog: false,
    });
  }

  launch(from: { x: number; y: number; z: number }, to: { x: number; z: number }, arc: number, speed: number): void {
    const dx = to.x - from.x;
    const dz = to.z - from.z;
    const dist = Math.hypot(dx, dz);
    const mesh = this.takeMesh();
    const dur = Math.max(0.28, dist / Math.max(4, speed));
    mesh.visible = true;
    mesh.position.set(from.x, from.y, from.z);
    this.stage.addOverlay(mesh);
    this.live.push({
      mesh,
      x0: from.x,
      y0: from.y,
      z0: from.z,
      x1: to.x,
      y1: 0.08,
      z1: to.z,
      arc,
      t: 0,
      dur,
    });
  }

  isFlying(): boolean {
    return this.live.length > 0;
  }

  /** 이번 틱에 떨어진 착탄점 */
  tick(dt: number): MissileImpact[] {
    const hits: MissileImpact[] = [];
    const keep: LiveMissile[] = [];
    for (const m of this.live) {
      m.t += dt / m.dur;
      if (m.t >= 1) {
        hits.push({ x: m.x1, z: m.z1 });
        this.recycle(m);
        continue;
      }
      this.place(m);
      keep.push(m);
    }
    this.live = keep;
    return hits;
  }

  clear(): void {
    for (const m of this.live) this.recycle(m);
    this.live = [];
  }

  dispose(): void {
    this.clear();
    for (const mesh of this.idle) this.disposeMesh(mesh);
    this.idle = [];
    this.bodyGeo.dispose();
    this.noseGeo.dispose();
    this.glowGeo.dispose();
    this.bodyMat.dispose();
    this.noseMat.dispose();
    this.glowMat.dispose();
  }

  private place(m: LiveMissile): void {
    const u = m.t;
    const x = m.x0 + (m.x1 - m.x0) * u;
    const z = m.z0 + (m.z1 - m.z0) * u;
    const y = m.y0 + (m.y1 - m.y0) * u + 4 * m.arc * u * (1 - u);
    const u2 = Math.min(1, u + 0.04);
    const x2 = m.x0 + (m.x1 - m.x0) * u2;
    const z2 = m.z0 + (m.z1 - m.z0) * u2;
    const y2 = m.y0 + (m.y1 - m.y0) * u2 + 4 * m.arc * u2 * (1 - u2);
    this.vel.set(x2 - x, y2 - y, z2 - z);
    if (this.vel.lengthSq() < 1e-6) this.vel.set(0, -1, 0);
    else this.vel.normalize();
    m.mesh.position.set(x, y, z);
    m.mesh.quaternion.setFromUnitVectors(Y_UP, this.vel);
    m.mesh.rotateX(u * 8);
  }

  private takeMesh(): THREE.Group {
    const reused = this.idle.pop();
    if (reused) return reused;
    const g = new THREE.Group();
    const body = new THREE.Mesh(this.bodyGeo, this.bodyMat);
    const nose = new THREE.Mesh(this.noseGeo, this.noseMat);
    nose.position.y = 0.26;
    const glow = new THREE.Mesh(this.glowGeo, this.glowMat);
    glow.position.y = -0.06;
    g.add(body, nose, glow);
    g.renderOrder = 8;
    return g;
  }

  private recycle(m: LiveMissile): void {
    m.mesh.visible = false;
    this.stage.removeOverlay(m.mesh);
    this.idle.push(m.mesh);
  }

  private disposeMesh(mesh: THREE.Group): void {
    this.stage.removeOverlay(mesh);
    mesh.removeFromParent();
  }
}
