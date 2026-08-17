/**
 * 오염 웨이브 — 가장자리에서 거점으로 달려오는 2D 세움판.
 * 맞으면 체력이 깎이고, 0이면 정화되어 사라진다. 발밑은 보라로 칠한다.
 */
import * as THREE from "three";
import type { JourneyStage3D } from "./JourneyStage3D";
import type { GroundPaint } from "./GroundPaint";
import type { PurifyRaidConfig } from "./purifyRaidConfig";

export interface BlightUnit {
  id: number;
  x: number;
  z: number;
  hp: number;
  eating: boolean;
  role: "runner" | "tank" | "spitter" | "boss";
  speed_mult: number;
  eat_mult: number;
  stun_left: number;
  slow_mult: number;
  is_boss: boolean;
}

interface Live {
  unit: BlightUnit;
  sprite: THREE.Sprite;
  mat: THREE.SpriteMaterial;
  drip: number;
}

let uid = 1;

export class BlightWave {
  private live: Live[] = [];
  private tex: THREE.Texture;
  private waveIndex = 0;
  private spawnLeft = 0;
  private spawnAcc = 0;
  private finished = false;
  lastDeaths: { x: number; z: number }[] = [];
  /** false면 디렉터가 스폰·종료를 맡는다 */
  useLegacyWaves = true;

  constructor(
    private readonly stage: JourneyStage3D,
    private readonly paint: GroundPaint,
    private cfg: PurifyRaidConfig,
    private core: { x: number; z: number },
  ) {
    this.tex = makeBlightTexture();
  }

  applyConfig(cfg: PurifyRaidConfig): void {
    this.cfg = cfg;
  }

  setCore(x: number, z: number): void {
    this.core = { x, z };
  }

  begin(): void {
    this.clear();
    this.waveIndex = 0;
    this.finished = false;
    this.queueWave();
  }

  /** 디렉터가 스폰을 맡을 때 — 웨이브 큐는 열지 않는다 */
  resetPool(): void {
    this.clear();
    this.waveIndex = 0;
    this.finished = false;
  }

  markFinished(): void {
    this.finished = true;
  }

  setWaveIndex(n: number): void {
    this.waveIndex = n;
  }

  get aliveCount(): number {
    return this.live.length;
  }

  bossAlive(): boolean {
    return this.live.some((l) => l.unit.is_boss && l.unit.hp > 0);
  }

  stunAll(sec: number): void {
    for (const l of this.live) l.unit.stun_left = Math.max(l.unit.stun_left, sec);
  }

  applyStatusNear(x: number, z: number, radiusM: number, status: string): void {
    const r2 = radiusM * radiusM;
    for (const l of this.live) {
      const dx = l.unit.x - x;
      const dz = l.unit.z - z;
      if (dx * dx + dz * dz > r2) continue;
      if (status === "stun") l.unit.stun_left = Math.max(l.unit.stun_left, 0.7);
      if (status === "burn" || status === "poison") l.unit.slow_mult = Math.min(l.unit.slow_mult, 0.55);
      if (status === "freeze") l.unit.stun_left = Math.max(l.unit.stun_left, 0.45);
    }
  }

  get units(): BlightUnit[] {
    return this.live.map((l) => l.unit);
  }

  get wave(): number {
    return this.waveIndex;
  }

  get totalWaves(): number {
    return this.cfg.wave_count;
  }

  get done(): boolean {
    return this.finished && this.live.length === 0;
  }

  eatingCount(): number {
    return this.live.filter((l) => l.unit.eating).length;
  }

  /** 착탄 반경 안의 적을 깎는다. 쓰러진 수를 돌려준다 */
  hitSplash(cx: number, cz: number, radiusM: number, dmg = 1): number {
    const r2 = radiusM * radiusM;
    let down = 0;
    this.lastDeaths = [];
    for (const l of this.live) {
      const dx = l.unit.x - cx;
      const dz = l.unit.z - cz;
      if (dx * dx + dz * dz > r2) continue;
      l.unit.hp -= dmg;
      if (l.unit.hp <= 0) {
        this.paint.stamp(l.unit.x, l.unit.z, "teal", 1);
        this.lastDeaths.push({ x: l.unit.x, z: l.unit.z });
        down += 1;
      }
    }
    this.reap();
    return down;
  }

  /** @deprecated 미사일 착탄은 hitSplash */
  hitCone(inCone: (x: number, z: number) => boolean): number {
    let down = 0;
    for (const l of this.live) {
      if (!inCone(l.unit.x, l.unit.z)) continue;
      l.unit.hp -= 1;
      if (l.unit.hp <= 0) {
        this.paint.stamp(l.unit.x, l.unit.z, "teal", 1);
        down += 1;
      }
    }
    this.reap();
    return down;
  }

  eatingWeight(): number {
    return this.live.reduce((s, l) => s + (l.unit.eating ? l.unit.eat_mult : 0), 0);
  }

  tick(dt: number): void {
    if (this.useLegacyWaves && this.spawnLeft > 0) {
      this.spawnAcc += dt;
      const gap = 0.38;
      while (this.spawnLeft > 0 && this.spawnAcc >= gap) {
        this.spawnAcc -= gap;
        this.spawnOne();
        this.spawnLeft -= 1;
      }
    } else if (this.useLegacyWaves && this.live.length === 0 && !this.finished) {
      if (this.waveIndex >= this.cfg.wave_count) this.finished = true;
      else this.queueWave();
    }

    const speed = this.cfg.blight_speed_mps;
    for (const l of this.live) {
      if (l.unit.stun_left > 0) {
        l.unit.stun_left -= dt;
        l.sprite.position.set(l.unit.x, 0.02, l.unit.z);
        continue;
      }
      const dx = this.core.x - l.unit.x;
      const dz = this.core.z - l.unit.z;
      const dist = Math.hypot(dx, dz) || 1;
      const hold = l.unit.role === "spitter" ? 4.2 : 1.35;
      l.unit.eating = dist < (l.unit.role === "spitter" ? 4.4 : 1.35);
      if (dist > hold) {
        const sp = speed * l.unit.speed_mult * l.unit.slow_mult;
        l.unit.x += (dx / dist) * sp * dt;
        l.unit.z += (dz / dist) * sp * dt;
      }
      l.sprite.position.set(l.unit.x, 0.02, l.unit.z);
      l.drip += dt;
      if (l.drip > 0.45) {
        l.drip = 0;
        this.paint.stamp(l.unit.x, l.unit.z, "blight", 0.7);
      }
    }
  }

  clear(): void {
    for (const l of this.live) this.disposeLive(l);
    this.live = [];
    this.spawnLeft = 0;
    this.spawnAcc = 0;
  }

  dispose(): void {
    this.clear();
    this.tex.dispose();
  }

  private queueWave(): void {
    this.waveIndex += 1;
    this.spawnLeft = this.cfg.wave_size;
    this.spawnAcc = 0;
  }

  /**
   * 섹터 가장자리가 아니라 **거점(플레이어) 바깥 고리**에 떨어뜨린다.
   * 맵 끝에서 스폰하면 관문처럼 가장자리에 서 있을 때 적이 바로 붙어 거점을 먹거나,
   * 반대로 사거리 밖에서 탄약만 낭비한다.
   */
  private spawnOne(): void {
    const pos = this.pickSpawnAroundCore();
    const x = pos.x;
    const z = pos.z;
    const mat = new THREE.SpriteMaterial({
      map: this.tex,
      transparent: true,
      depthWrite: false,
      fog: true,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.center.set(0.5, 0);
    sprite.scale.set(0.95, 1.2, 1);
    sprite.position.set(x, 0.02, z);
    this.stage.addOverlay(sprite);
    this.live.push({
      unit: {
        id: uid++,
        x,
        z,
        hp: this.cfg.blight_hits,
        eating: false,
        role: "runner",
        speed_mult: 1,
        eat_mult: 1,
        stun_left: 0,
        slow_mult: 1,
        is_boss: false,
      },
      sprite,
      mat,
      drip: 0,
    });
  }

  spawnTyped(opts: {
    x?: number;
    z?: number;
    hp: number;
    role: BlightUnit["role"];
    speed_mult: number;
    eat_mult: number;
    scale: number;
    color: number;
    is_boss?: boolean;
  }): BlightUnit {
    const pos = opts.x != null && opts.z != null ? { x: opts.x, z: opts.z } : this.pickSpawnAroundCore();
    const mat = new THREE.SpriteMaterial({
      map: this.tex,
      color: opts.color,
      transparent: true,
      depthWrite: false,
      fog: true,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.center.set(0.5, 0);
    const s = Math.max(0.6, opts.scale);
    sprite.scale.set(0.95 * s, 1.2 * s, 1);
    sprite.position.set(pos.x, 0.02, pos.z);
    this.stage.addOverlay(sprite);
    const unit: BlightUnit = {
      id: uid++,
      x: pos.x,
      z: pos.z,
      hp: opts.hp,
      eating: false,
      role: opts.role,
      speed_mult: opts.speed_mult,
      eat_mult: opts.eat_mult,
      stun_left: 0,
      slow_mult: 1,
      is_boss: !!opts.is_boss,
    };
    this.live.push({ unit, sprite, mat, drip: 0 });
    return unit;
  }

  ringPos(): { x: number; z: number } {
    return this.pickSpawnAroundCore();
  }

  private pickSpawnAroundCore(): { x: number; z: number } {
    const half = this.stage.getWorldScale() / 2 - 1;
    const ring = Math.max(6, this.cfg.gun_range_m * 1.35);
    const minDist = 2.8;
    for (let i = 0; i < 10; i++) {
      const ang = Math.random() * Math.PI * 2;
      const r = ring * (0.9 + Math.random() * 0.2);
      const x = clamp(this.core.x + Math.cos(ang) * r, -half, half);
      const z = clamp(this.core.z + Math.sin(ang) * r, -half, half);
      if (Math.hypot(x - this.core.x, z - this.core.z) >= minDist) return { x, z };
    }
    const fallback = Math.min(ring, Math.max(minDist, half * 0.35));
    return {
      x: clamp(this.core.x + fallback, -half, half),
      z: clamp(this.core.z, -half, half),
    };
  }

  private reap(): void {
    const keep: Live[] = [];
    for (const l of this.live) {
      if (l.unit.hp > 0) {
        keep.push(l);
        continue;
      }
      this.disposeLive(l);
    }
    this.live = keep;
  }

  private disposeLive(l: Live): void {
    this.stage.removeOverlay(l.sprite);
    l.mat.dispose();
  }
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function makeBlightTexture(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = 160;
  c.height = 200;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, 160, 200);
  ctx.fillStyle = "#4a2878";
  ctx.beginPath();
  ctx.ellipse(80, 128, 38, 52, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#7b48b8";
  ctx.beginPath();
  ctx.ellipse(80, 78, 44, 40, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#c090ff";
  ctx.beginPath();
  ctx.ellipse(68, 70, 10, 12, 0, 0, Math.PI * 2);
  ctx.ellipse(94, 72, 8, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1a1028";
  ctx.beginPath();
  ctx.ellipse(68, 72, 4, 5, 0, 0, Math.PI * 2);
  ctx.ellipse(94, 74, 3.5, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}
