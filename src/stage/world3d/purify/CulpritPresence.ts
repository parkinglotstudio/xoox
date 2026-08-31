/**
 * 원흉 존재감 — A 큰 오염 구름 + B 낮은 안개·밝은 핵
 * 얼룩용: cloudOnly + idlePulse (핵·안개 없이 점구름만 숨쉼)
 */
import * as THREE from "three";
import { CulpritCloud, type CulpritForm } from "../CulpritCloud";

function fogTex(): THREE.CanvasTexture {
  const s = 256;
  const c = document.createElement("canvas");
  c.width = s;
  c.height = s;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  grd.addColorStop(0, "rgba(48, 14, 56, 0.62)");
  grd.addColorStop(0.4, "rgba(30, 10, 42, 0.38)");
  grd.addColorStop(0.75, "rgba(14, 6, 24, 0.14)");
  grd.addColorStop(1, "rgba(0, 0, 0, 0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

function coreTex(): THREE.CanvasTexture {
  const s = 128;
  const c = document.createElement("canvas");
  c.width = s;
  c.height = s;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  grd.addColorStop(0, "rgba(255, 245, 255, 1)");
  grd.addColorStop(0.18, "rgba(255, 160, 255, 0.95)");
  grd.addColorStop(0.4, "rgba(220, 70, 240, 0.75)");
  grd.addColorStop(0.7, "rgba(100, 30, 160, 0.28)");
  grd.addColorStop(1, "rgba(0, 0, 0, 0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

export type CulpritPresenceOpts = {
  scale?: number;
  count?: number;
  size?: number;
  form?: CulpritForm;
  /** true면 안개·밝은 핵 없이 점구름만 */
  cloudOnly?: boolean;
  /** 점구름 idle — 커졌다 작아졌다 */
  idlePulse?: boolean;
  /** 점구름만 추가 배율 (핵·안개는 bodyScale 유지) */
  cloudScaleMul?: number;
  /** 공기중 잔알갱이 안개(공포) — 본체 키우지 않고 주변에 떠 있음 */
  horrorMist?: boolean;
};

export class CulpritPresence {
  readonly group = new THREE.Group();
  readonly cloud: CulpritCloud;
  private readonly mist: CulpritCloud | null = null;
  private readonly fogMats: THREE.MeshBasicMaterial[] = [];
  private readonly fogMeshes: THREE.Mesh[] = [];
  private readonly coreMats: THREE.MeshBasicMaterial[] = [];
  private readonly coreMeshes: THREE.Mesh[] = [];
  private readonly fogMap: THREE.CanvasTexture | null = null;
  private readonly coreMap: THREE.CanvasTexture | null = null;
  private readonly fogGeo: THREE.PlaneGeometry | null = null;
  private readonly coreGeo: THREE.PlaneGeometry | null = null;
  private readonly bodyScale: number;
  private readonly cloudScaleMul: number;
  private readonly idlePulse: boolean;
  private time = 0;
  private releasing = false;

  constructor(opts?: CulpritPresenceOpts) {
    this.bodyScale = opts?.scale ?? 14;
    this.cloudScaleMul = opts?.cloudScaleMul ?? 1;
    this.idlePulse = !!opts?.idlePulse;
    const cloudOnly = !!opts?.cloudOnly;
    const cloudScale = this.bodyScale * this.cloudScaleMul;

    // A — 큰 오염 구름 (원흉=cloud · 인간 원흉=human)
    this.cloud = new CulpritCloud({
      form: opts?.form ?? "cloud",
      count: opts?.count ?? 2800,
      size: opts?.size ?? 0.17,
      palette: "blight",
    });
    this.cloud.group.scale.setScalar(cloudScale);
    this.group.add(this.cloud.group);

    // 공포 안개 — 본체보다 넓게, 아주 작은 알갱이가 공기중에 떠 있음
    if (opts?.horrorMist) {
      this.mist = new CulpritCloud({
        form: "cloud",
        count: 5200,
        size: Math.max(0.028, (opts?.size ?? 0.17) * 0.22),
        palette: "dread",
      });
      this.mist.group.scale.setScalar(this.bodyScale * 2.4);
      this.mist.gather = 0.55;
      this.mist.gatherTo = 0.55;
      this.mist.rise = 1;
      this.mist.riseTo = 1;
      this.group.add(this.mist.group);
    }

    if (cloudOnly) return;

    // B — 낮은 안개
    this.fogMap = fogTex();
    this.fogGeo = new THREE.PlaneGeometry(1, 1);
    for (let i = 0; i < 3; i++) {
      const mat = new THREE.MeshBasicMaterial({
        map: this.fogMap,
        transparent: true,
        opacity: 0.78 - i * 0.12,
        depthTest: false,
        depthWrite: false,
        fog: false,
        blending: THREE.AdditiveBlending,
      });
      const mesh = new THREE.Mesh(this.fogGeo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = 0.28 + i * 0.14;
      const s = this.bodyScale * (1.2 + i * 0.25);
      mesh.scale.set(s, s, 1);
      mesh.renderOrder = 16;
      mesh.frustumCulled = false;
      this.group.add(mesh);
      this.fogMats.push(mat);
      this.fogMeshes.push(mesh);
    }

    // B — 밝은 핵 (십자 카드)
    this.coreMap = coreTex();
    this.coreGeo = new THREE.PlaneGeometry(1, 1);
    for (let i = 0; i < 2; i++) {
      const mat = new THREE.MeshBasicMaterial({
        map: this.coreMap,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(this.coreGeo, mat);
      mesh.rotation.y = (i * Math.PI) / 2;
      mesh.position.y = 1.35;
      const w = this.bodyScale * 0.48;
      const h = this.bodyScale * 0.62;
      mesh.scale.set(w, h, 1);
      mesh.renderOrder = 11;
      this.group.add(mesh);
      this.coreMats.push(mat);
      this.coreMeshes.push(mesh);
    }
  }

  setWorld(x: number, z: number, y = 0): void {
    this.group.position.set(x, y, z);
    this.cloud.setWorld(0, 0);
    this.mist?.setWorld(0, 0);
  }

  get purifyTo(): number {
    return this.cloud.purifyTo;
  }
  set purifyTo(v: number) {
    this.cloud.purifyTo = v;
    if (this.mist) this.mist.purifyTo = Math.min(1, v * 0.85);
  }

  playRise(): void {
    this.cloud.playRise();
    this.mist?.playRise();
  }
  playBeforePurify(): void {
    this.cloud.playBeforePurify();
    this.mist?.playBeforePurify();
  }
  playGather(): void {
    this.cloud.playGather();
    if (this.mist) {
      this.mist.gatherTo = 0.55;
      this.mist.playGather();
    }
  }
  /** 퍼지기 — 순간이동·숨쉬기용 (죽기 연출보다 약하게) */
  playSpread(): void {
    this.cloud.gatherTo = 0.22;
    this.cloud.purifyTo = this.cloud.purify;
    this.cloud.pulseHit();
    if (this.mist) this.mist.gatherTo = 0.14;
  }
  /** 완전 퍼짐 — 피격 후 사라질 때 */
  playFullSpread(): void {
    this.cloud.playSpread();
    if (this.mist) this.mist.playSpread();
  }
  /** 넓게 흩어졌다가(텔레포트용) — 확실히 퍼짐 */
  playTeleportOut(): void {
    this.cloud.gather = Math.min(this.cloud.gather, 0.28);
    this.cloud.gatherTo = 0;
    this.cloud.purifyTo = this.cloud.purify;
    this.cloud.pulseHit();
    if (this.mist) {
      this.mist.gather = Math.min(this.mist.gather, 0.22);
      this.mist.gatherTo = 0;
    }
  }
  pulseHit(): void {
    this.cloud.pulseHit();
    this.mist?.pulseHit();
  }
  setVisible(on: boolean): void {
    this.cloud.group.visible = on;
    if (this.mist) this.mist.group.visible = on;
  }
  hitPurify(): void {
    this.releasing = true;
    this.cloud.hitPurify();
    this.mist?.hitPurify();
  }

  tick(dt: number): void {
    this.time += dt;
    this.cloud.tick(dt);
    if (this.mist) {
      this.mist.tick(dt);
      if (!this.releasing) {
        const drift = 1 + Math.sin(this.time * 0.7) * 0.06;
        this.mist.group.scale.setScalar(this.bodyScale * 2.4 * drift);
        this.mist.group.rotation.y += dt * 0.08;
      }
    }

    // 점구름 idle — 숨쉬듯 커졌다 작아졌다 (핵·안개 크기는 건드리지 않음)
    if (this.idlePulse && !this.releasing) {
      const breath = 1 + Math.sin(this.time * 1.55) * 0.12;
      this.cloud.group.scale.setScalar(this.bodyScale * this.cloudScaleMul * breath);
    }

    for (let i = 0; i < this.fogMeshes.length; i++) {
      const mesh = this.fogMeshes[i]!;
      const mat = this.fogMats[i]!;
      mesh.rotation.z += dt * (0.04 + i * 0.025);
      if (this.releasing) {
        mat.opacity = Math.max(0, mat.opacity - dt * 0.85);
        mesh.scale.x *= 1 + dt * 1.6;
        mesh.scale.y *= 1 + dt * 1.6;
      } else {
        mat.opacity = 0.55 - i * 0.1 + 0.12 * Math.sin(this.time * 1.3 + i);
      }
    }

    const pulse = 0.85 + 0.15 * Math.sin(this.time * 3.4);
    const bob = 1.2 + Math.sin(this.time * 2.2) * 0.18;
    for (let i = 0; i < this.coreMeshes.length; i++) {
      const mesh = this.coreMeshes[i]!;
      const mat = this.coreMats[i]!;
      mesh.position.y = bob;
      if (this.releasing) {
        mat.opacity = Math.max(0, mat.opacity - dt * 1.1);
        mesh.scale.multiplyScalar(1 + dt * 2.2);
      } else {
        mat.opacity = pulse;
        const w = this.bodyScale * 0.48 * (0.94 + 0.08 * Math.sin(this.time * 2.8 + i));
        const h = this.bodyScale * 0.62 * (0.94 + 0.08 * Math.sin(this.time * 2.5));
        mesh.scale.set(w, h, 1);
      }
    }
  }

  dispose(): void {
    this.cloud.dispose();
    this.mist?.dispose();
    this.fogMap?.dispose();
    this.coreMap?.dispose();
    this.fogGeo?.dispose();
    this.coreGeo?.dispose();
    for (const m of this.fogMats) m.dispose();
    for (const m of this.coreMats) m.dispose();
    this.group.removeFromParent();
  }
}
