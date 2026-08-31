/**
 * 벌레 — 모래알 3D 점 무리. 크기는 방랑자 키(~1.7m) 급.
 */
import * as THREE from "three";
import { PURIFY_GRIT } from "../fx/sandDissolve";

const sharedGeo = new THREE.BoxGeometry(1, 1, 1);
/** JourneyStage3D charHeightM 기본과 맞춤 */
const BUG_H = 1.7;

export class SandBug {
  readonly group = new THREE.Group();
  x: number;
  z: number;
  hp: number;
  maxHp: number;
  dead = false;
  private readonly grains: THREE.Mesh[] = [];
  private bob = Math.random() * Math.PI * 2;

  constructor(x: number, z: number, hp = 2) {
    this.x = x;
    this.z = z;
    this.hp = Math.max(1, hp);
    this.maxHp = this.hp;
    const n = 28 + Math.floor(Math.random() * 10);
    for (let i = 0; i < n; i++) {
      const hex = PURIFY_GRIT.blight[i % PURIFY_GRIT.blight.length]!;
      const mat = new THREE.MeshBasicMaterial({
        color: hex,
        transparent: true,
        opacity: 0.92,
        depthWrite: false,
        fog: true,
      });
      const mesh = new THREE.Mesh(sharedGeo, mat);
      const s = 0.12 + Math.random() * 0.18;
      mesh.scale.setScalar(s);
      const h = Math.random();
      mesh.position.set(
        (Math.random() - 0.5) * 0.85,
        0.15 + h * (BUG_H - 0.2),
        (Math.random() - 0.5) * 0.85,
      );
      this.group.add(mesh);
      this.grains.push(mesh);
    }
    this.group.position.set(x, 0, z);
  }

  setWorld(x: number, z: number): void {
    this.x = x;
    this.z = z;
    this.group.position.set(x, 0, z);
  }

  tick(dt: number): void {
    if (this.dead) return;
    this.bob += dt * 4.2;
    for (let i = 0; i < this.grains.length; i++) {
      const g = this.grains[i]!;
      const baseY = 0.15 + (i / this.grains.length) * (BUG_H - 0.25);
      g.position.y = baseY + Math.sin(this.bob + i * 0.55) * 0.08;
      g.rotation.y += dt * (0.9 + (i % 4) * 0.35);
    }
  }

  hitPurify(): void {
    this.dead = true;
    for (const g of this.grains) {
      const mat = g.material as THREE.MeshBasicMaterial;
      mat.color.setHex(PURIFY_GRIT.teal[0]!);
      mat.opacity = 0.55;
    }
  }

  dispose(): void {
    for (const g of this.grains) {
      (g.material as THREE.Material).dispose();
    }
    this.group.removeFromParent();
  }
}
