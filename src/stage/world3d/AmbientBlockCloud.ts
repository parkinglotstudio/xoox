/**
 * 필드 대기 점구름 — InstancedMesh 작은 큐브.
 * 스프라이트 Points가 아니라 블록. 휴식점으로 스프링, 근처 걸으면 밀침, 착탄이면 흩어짐.
 *
 * i21 해안은 sea_wall 나무 자리를 읽어 「해안 소금 티끌」만 얇게 얹는다.
 * 나무 InstancedMesh는 그대로 둔다.
 */
import * as THREE from "three";
import { purifyAmountAt, type PurifyFocusWorld } from "./IslandTerrain";
import type { WorldProp } from "./types";

export interface AmbientBlockSpec {
  x: number;
  y: number;
  z: number;
  s: number;
  hex: number;
}

export interface AmbientCloudTick {
  dt: number;
  px: number;
  py: number;
  pz: number;
  streamR: number;
  foci: readonly PurifyFocusWorld[];
  shooting?: boolean;
  aim?: { x: number; z: number } | null;
}

const COAST_COOL = 0xc5d2dc;
const COAST_WHITE = 0xe8f1f6;
const PURE_A = 0x7fe0d8;
const PURE_B = 0xb8fff4;

const SPRING = 6;
const DAMP = 4.2;
const PUSH_R = 1.55;
const PUSH_F = 16;
const SHOCK_R = 1.6;
const SHOCK_F = 28;
const SHOCK_LIFE = 0.55;
const SHOT_PULSE = 0.2;

interface Shock {
  x: number;
  y: number;
  z: number;
  life: number;
}

function hash(i: number, salt: number): number {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function hashStr(s: string, salt: number): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

function hexRgb(hex: number): [number, number, number] {
  return [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255];
}

/**
 * 해안 방벽 안쪽(들판) 방향.
 * WorldProp에 note가 없어서 % 자리로 south/west/east 이중 열을 읽는다.
 */
export function inlandAxis(xPct: number, yPct: number): { ix: number; iz: number; tx: number; tz: number } {
  if (yPct >= 88) return { ix: 0, iz: -1, tx: 1, tz: 0 };
  if (xPct <= 12) return { ix: 1, iz: 0, tx: 0, tz: 1 };
  if (xPct >= 88) return { ix: -1, iz: 0, tx: 0, tz: 1 };
  if (yPct <= 12) return { ix: 0, iz: 1, tx: 1, tz: 0 };
  const dx = 50 - xPct;
  const dz = 50 - yPct;
  const len = Math.hypot(dx, dz) || 1;
  const ix = dx / len;
  const iz = dz / len;
  return { ix, iz, tx: -iz, tz: ix };
}

/** 안쪽 열(들판 쪽). 바깥 열은 충돌 반경 안에 있어 걷기 밀침이 안 닿는다. */
function isInnerWall(xPct: number, yPct: number): boolean {
  if (yPct >= 88) return yPct < 95;
  if (xPct <= 12) return xPct > 5;
  if (xPct >= 88) return xPct < 95;
  return true;
}

/** sea_wall 나무마다 성긴 저층 큐브. 밀도는 미리보기 fillCoast보다 훨씬 얇다. */
export function placeCoastSaltMist(
  walls: readonly WorldProp[],
  pctToWorld: (xPct: number, yPct: number) => { x: number; z: number },
): AmbientBlockSpec[] {
  const out: AmbientBlockSpec[] = [];
  for (const p of walls) {
    if (p.groupId !== "sea_wall") continue;
    const inner = isInnerWall(p.xPct, p.yPct);
    const skip = hashStr(p.id, 3);
    if (inner ? skip < 0.18 : skip < 0.55) continue;
    const pos = pctToWorld(p.xPct, p.yPct);
    const axis = inlandAxis(p.xPct, p.yPct);
    const n = inner ? 4 + Math.floor(hashStr(p.id, 5) * 3) : 2 + Math.floor(hashStr(p.id, 5) * 2);
    for (let k = 0; k < n; k++) {
      const i = Math.floor(hashStr(p.id, 11) * 1e6) + k * 97;
      // 안쪽 열은 나무 collideR(2.05~2.6) 바깥, 바깥 열은 두 줄 사이
      const inland = inner ? 2.35 + hash(i, 1) * 1.9 : 0.45 + hash(i, 1) * 1.35;
      const along = (hash(i, 2) - 0.5) * (inner ? 2.6 : 1.8);
      const x = pos.x + axis.ix * inland + axis.tx * along;
      const z = pos.z + axis.iz * inland + axis.tz * along;
      const y = 0.16 + hash(i, 4) * 0.55 + (hash(i, 8) > 0.88 ? 0.22 : 0);
      const s = 0.16 + hash(i, 5) * 0.18;
      const hex = hash(i, 6) > 0.35 ? COAST_WHITE : COAST_COOL;
      out.push({ x, y, z, s, hex });
    }
  }
  return out;
}

export class AmbientBlockCloud {
  readonly group = new THREE.Group();
  private mesh: THREE.InstancedMesh | null = null;
  private geo: THREE.BoxGeometry;
  private mat: THREE.MeshBasicMaterial;
  private dummy = new THREE.Object3D();
  private color = new THREE.Color();
  private rest: Float32Array = new Float32Array(0);
  private pos: Float32Array = new Float32Array(0);
  private vel: Float32Array = new Float32Array(0);
  private scale: Float32Array = new Float32Array(0);
  private baseCol: Float32Array = new Float32Array(0);
  private live = new Uint8Array(0);
  private count = 0;
  private shocks: Shock[] = [];
  private shotAcc = 0;
  private time = 0;

  constructor() {
    this.geo = new THREE.BoxGeometry(1, 1, 1);
    // 무대는 무광 MeshBasic. Standard는 라이트 없이 안개색에 묻힌다.
    this.mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      fog: true,
    });
    this.group.name = "ambient-block-cloud";
  }

  blockCount(): number {
    return this.count;
  }

  rebuild(blocks: readonly AmbientBlockSpec[]): void {
    this.clearMesh();
    this.count = blocks.length;
    if (this.count === 0) return;
    this.rest = new Float32Array(this.count * 3);
    this.pos = new Float32Array(this.count * 3);
    this.vel = new Float32Array(this.count * 3);
    this.scale = new Float32Array(this.count);
    this.baseCol = new Float32Array(this.count * 3);
    this.live = new Uint8Array(this.count);
    const mesh = new THREE.InstancedMesh(this.geo, this.mat, this.count);
    mesh.name = "coast-salt-mist";
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.renderOrder = 3;
    for (let i = 0; i < this.count; i++) {
      const b = blocks[i]!;
      const o = i * 3;
      this.rest[o] = b.x;
      this.rest[o + 1] = b.y;
      this.rest[o + 2] = b.z;
      this.pos[o] = b.x;
      this.pos[o + 1] = b.y;
      this.pos[o + 2] = b.z;
      this.scale[i] = b.s;
      const rgb = hexRgb(b.hex);
      this.baseCol[o] = rgb[0];
      this.baseCol[o + 1] = rgb[1];
      this.baseCol[o + 2] = rgb[2];
      this.dummy.position.set(b.x, b.y, b.z);
      this.dummy.scale.setScalar(b.s);
      this.dummy.rotation.set(0, 0, 0);
      this.dummy.updateMatrix();
      mesh.setMatrixAt(i, this.dummy.matrix);
      this.color.setHex(b.hex);
      mesh.setColorAt(i, this.color);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
    this.mesh = mesh;
    this.group.add(mesh);
  }

  shockAt(x: number, y: number, z: number): void {
    this.shocks.push({ x, y, z, life: SHOCK_LIFE });
  }

  tick(opts: AmbientCloudTick): void {
    const mesh = this.mesh;
    if (!mesh || this.count === 0) return;
    const dt = Math.min(0.033, opts.dt);
    this.time += dt;
    const t = this.time;
    const streamR = opts.streamR;
    const drop = streamR * 1.25;
    const px = opts.px;
    const py = opts.py;
    const pz = opts.pz;

    if (opts.shooting && opts.aim) {
      this.shotAcc -= dt;
      if (this.shotAcc <= 0) {
        this.shotAcc = SHOT_PULSE;
        this.shockAt(opts.aim.x, 0.48, opts.aim.z);
      }
    } else {
      this.shotAcc = 0;
    }

    for (const s of this.shocks) s.life -= dt;
    this.shocks = this.shocks.filter((s) => s.life > 0);

    const foci = opts.foci;
    let dirty = false;
    let colorDirty = false;
    for (let i = 0; i < this.count; i++) {
      const o = i * 3;
      const rx = this.rest[o]!;
      const rz = this.rest[o + 2]!;
      const dPlayer = Math.hypot(rx - px, rz - pz);
      if (dPlayer > drop) {
        if (this.live[i]) {
          this.pos[o] = rx;
          this.pos[o + 1] = this.rest[o + 1]!;
          this.pos[o + 2] = rz;
          this.vel[o] = 0;
          this.vel[o + 1] = 0;
          this.vel[o + 2] = 0;
          this.writeMatrix(mesh, i, t);
          this.live[i] = 0;
          dirty = true;
        }
        continue;
      }
      if (dPlayer > streamR && !this.live[i]) continue;

      this.live[i] = 1;
      const p = this.pos;
      const v = this.vel;
      const ry = this.rest[o + 1]!;
      v[o] += (rx - p[o]!) * SPRING * dt;
      v[o + 1] += (ry - p[o + 1]!) * SPRING * dt;
      v[o + 2] += (rz - p[o + 2]!) * SPRING * dt;

      const dx = p[o]! - px;
      const dy = p[o + 1]! - py;
      const dz = p[o + 2]! - pz;
      const d2 = dx * dx + dy * dy + dz * dz;
      if (d2 < PUSH_R * PUSH_R && d2 > 1e-4) {
        const d = Math.sqrt(d2);
        const f = (1 - d / PUSH_R) * PUSH_F;
        v[o] += (dx / d) * f * dt;
        v[o + 1] += (dy / d) * f * 0.45 * dt;
        v[o + 2] += (dz / d) * f * dt;
      }

      for (const s of this.shocks) {
        const sx = p[o]! - s.x;
        const sy = p[o + 1]! - s.y;
        const sz = p[o + 2]! - s.z;
        const sd2 = sx * sx + sy * sy + sz * sz;
        if (sd2 >= SHOCK_R * SHOCK_R || sd2 <= 1e-4) continue;
        const d = Math.sqrt(sd2);
        const f = (1 - d / SHOCK_R) * SHOCK_F * (s.life / SHOCK_LIFE);
        v[o] += (sx / d) * f * dt;
        v[o + 1] += (sy / d) * f * 0.7 * dt;
        v[o + 2] += (sz / d) * f * dt;
      }

      const damp = Math.exp(-DAMP * dt);
      v[o] *= damp;
      v[o + 1] *= damp;
      v[o + 2] *= damp;
      p[o] += v[o]! * dt;
      p[o + 1] += v[o + 1]! * dt;
      p[o + 2] += v[o + 2]! * dt;
      this.writeMatrix(mesh, i, t);

      const pu = foci.length ? purifyAmountAt(rx, rz, foci) : 0;
      if (pu > 0.02) {
        const pure = hexRgb(hash(i, 9) > 0.5 ? PURE_A : PURE_B);
        this.color.setRGB(
          this.baseCol[o]! + (pure[0] - this.baseCol[o]!) * pu,
          this.baseCol[o + 1]! + (pure[1] - this.baseCol[o + 1]!) * pu,
          this.baseCol[o + 2]! + (pure[2] - this.baseCol[o + 2]!) * pu,
        );
        mesh.setColorAt(i, this.color);
        colorDirty = true;
      }
      dirty = true;
    }
    if (dirty) mesh.instanceMatrix.needsUpdate = true;
    if (colorDirty && mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }

  dispose(): void {
    this.clearMesh();
    this.geo.dispose();
    this.mat.dispose();
    this.group.removeFromParent();
  }

  private writeMatrix(mesh: THREE.InstancedMesh, i: number, t: number): void {
    const o = i * 3;
    this.dummy.position.set(this.pos[o]!, this.pos[o + 1]!, this.pos[o + 2]!);
    this.dummy.scale.setScalar(this.scale[i]!);
    this.dummy.rotation.set(0, t * 0.15 + i * 0.01, 0);
    this.dummy.updateMatrix();
    mesh.setMatrixAt(i, this.dummy.matrix);
  }

  private clearMesh(): void {
    if (!this.mesh) return;
    this.group.remove(this.mesh);
    this.mesh.dispose();
    this.mesh = null;
    this.count = 0;
    this.shocks = [];
    this.live = new Uint8Array(0);
  }
}
