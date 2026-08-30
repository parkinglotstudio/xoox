/**
 * 오염 웨이브 — 얼룩·벌레·원흉은 점구름.
 * 얼룩을 걷으면 그 자리에서 동그라미 벌레가 나오고, 벌레가 쓰러지면 바닥 오염이 걷힌다.
 */
import * as THREE from "three";
import type { JourneyStage3D } from "./JourneyStage3D";
import type { GroundPaint } from "./GroundPaint";
import type { PurifyRaidConfig } from "./purifyRaidConfig";
import { CulpritCloud } from "./CulpritCloud";

export type BlightLook = "stain" | "bug" | "boss";

const HATCH_BUGS = 3;

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
  panel?: THREE.Mesh;
  mat?: THREE.MeshBasicMaterial;
  ring?: THREE.Mesh;
  ringMat?: THREE.MeshBasicMaterial;
  drip: number;
  look: BlightLook;
  bob: number;
  hitSpin: number;
  dying: number;
  w: number;
  h: number;
  dots?: CulpritCloud;
}

let uid = 1;

export class BlightWave {
  private live: Live[] = [];
  private glowTex?: THREE.Texture;
  private ringGeo?: THREE.CircleGeometry;
  private waveIndex = 0;
  private spawnLeft = 0;
  private spawnAcc = 0;
  private finished = false;
  lastDeaths: { x: number; z: number }[] = [];
  lastStainKills = 0;
  /** false면 디렉터가 스폰·종료를 맡는다 */
  useLegacyWaves = true;
  /** true면 리젠만. 거점으로 안 달려온다 */
  stationary = false;
  /** false면 걸을 때 발밑 보라 데칼을 안 찍는다 */
  dripPaint = true;

  constructor(
    private readonly stage: JourneyStage3D,
    private readonly paint: GroundPaint,
    private cfg: PurifyRaidConfig,
    private core: { x: number; z: number },
  ) {}

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

  get huntUnits(): BlightUnit[] {
    return this.live.filter((l) => l.unit.hp > 0 && l.dying <= 0).map((l) => l.unit);
  }

  get huntAliveCount(): number {
    return this.live.filter((l) => l.unit.hp > 0 || l.dying > 0).length;
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

  /** 착탄에 가장 가까운 오염 하나만 정화한다. 맞으면 1, 아니면 0 */
  hitNearest(cx: number, cz: number, radiusM: number): number {
    const r2 = radiusM * radiusM;
    let best: Live | null = null;
    let bestD = r2;
    for (const l of this.live) {
      const dx = l.unit.x - cx;
      const dz = l.unit.z - cz;
      const d = dx * dx + dz * dz;
      if (d > bestD) continue;
      bestD = d;
      best = l;
    }
    if (!best) {
      this.lastDeaths = [];
      return 0;
    }
    return this.killLive(best);
  }

  hitId(id: number): number {
    const hit = this.live.find((l) => l.unit.id === id);
    if (!hit) return 0;
    return this.killLive(hit);
  }

  private killLive(l: Live): number {
    this.lastStainKills = l.look === "stain" ? 1 : 0;
    const hx = l.unit.x;
    const hz = l.unit.z;
    const stain = l.look === "stain";
    this.finishKill(l, true);
    this.lastDeaths = [{ x: hx, z: hz }];
    if (stain) this.hatchBugsAt(hx, hz);
    this.reap();
    return 1;
  }

  /** 원을 각도로 나눠 뿌린다. 한쪽에 몰리지 않게. */
  scatterAround(count: number, minR: number, maxR: number): void {
    this.clear();
    this.stationary = true;
    this.useLegacyWaves = false;
    this.finished = false;
    const n = Math.max(1, count);
    const spin = Math.random() * Math.PI * 2;
    const half = this.stage.getWorldScale() / 2 - 1;
    for (let i = 0; i < n; i++) {
      const ang = spin + (i / n) * Math.PI * 2;
      const r = minR + (maxR - minR) * 0.55 + (Math.random() - 0.5) * 2.4;
      const x = clamp(this.core.x + Math.cos(ang) * r, -half, half);
      const z = clamp(this.core.z + Math.sin(ang) * r, -half, half);
      this.spawnTyped({
        x,
        z,
        hp: 1,
        role: "runner",
        speed_mult: 0,
        eat_mult: 0,
        scale: 1.55,
        color: 0xd8a8ff,
        look: "stain",
      });
      this.paint.stamp(x, z, "blight", 0.85);
    }
  }

  spawnStationaryAt(x: number, z: number): BlightUnit {
    this.stationary = true;
    this.useLegacyWaves = false;
    return this.spawnTyped({
      x,
      z,
      hp: 1,
      role: "runner",
      speed_mult: 0,
      eat_mult: 0,
      scale: 1.55,
      color: 0xd8a8ff,
      look: "stain",
    });
  }

  pickScatterPos(minR: number, maxR: number): { x: number; z: number } {
    const half = this.stage.getWorldScale() / 2 - 1;
    const minSep = 3.2;
    for (let i = 0; i < 18; i++) {
      const ang = Math.random() * Math.PI * 2;
      const r = minR + Math.random() * Math.max(0.5, maxR - minR);
      const x = clamp(this.core.x + Math.cos(ang) * r, -half, half);
      const z = clamp(this.core.z + Math.sin(ang) * r, -half, half);
      const ok = this.live.every((l) => Math.hypot(l.unit.x - x, l.unit.z - z) >= minSep);
      if (ok) return { x, z };
    }
    const fallback = (minR + maxR) * 0.5;
    return {
      x: clamp(this.core.x + fallback, -half, half),
      z: clamp(this.core.z, -half, half),
    };
  }

  pickScatterNear(ox: number, oz: number, minR: number, maxR: number): { x: number; z: number } {
    const half = this.stage.getWorldScale() / 2 - 1;
    const minSep = 2.4;
    for (let i = 0; i < 18; i++) {
      const ang = Math.random() * Math.PI * 2;
      const r = minR + Math.random() * Math.max(0.5, maxR - minR);
      const x = clamp(ox + Math.cos(ang) * r, -half, half);
      const z = clamp(oz + Math.sin(ang) * r, -half, half);
      const ok = this.live.every((l) => Math.hypot(l.unit.x - x, l.unit.z - z) >= minSep);
      if (ok) return { x, z };
    }
    return { x: clamp(ox + minR, -half, half), z: clamp(oz, -half, half) };
  }

  /** 착탄 반경 안의 적을 깎는다. 쓰러진 수를 돌려준다 */
  hitSplash(cx: number, cz: number, radiusM: number, dmg = 1, opts?: { stamp?: boolean }): number {
    const r2 = radiusM * radiusM;
    const stamp = opts?.stamp !== false;
    let down = 0;
    this.lastDeaths = [];
    this.lastStainKills = 0;
    const hatches: { x: number; z: number }[] = [];
    for (const l of this.live) {
      const dx = l.unit.x - cx;
      const dz = l.unit.z - cz;
      if (dx * dx + dz * dz > r2) continue;
      if (l.dying > 0) continue;
      l.unit.hp -= dmg;
      l.hitSpin = Math.PI * 0.95;
      if (l.unit.hp <= 0) {
        this.lastDeaths.push({ x: l.unit.x, z: l.unit.z });
        down += 1;
        if (l.look === "stain") {
          this.lastStainKills += 1;
          hatches.push({ x: l.unit.x, z: l.unit.z });
        }
        this.finishKill(l, stamp);
      }
    }
    for (const h of hatches) this.hatchBugsAt(h.x, h.z);
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

  private finishKill(l: Live, stampTeal: boolean): void {
    l.unit.hp = 0;
    l.dying = l.dots ? 0.95 : 0.18;
    l.dots?.hitPurify();
    if (l.look === "bug") {
      this.paint.eraseNear(l.unit.x, l.unit.z, this.cfg.paint_radius_m * 2.6);
    } else if (l.look !== "stain" && stampTeal) {
      this.paint.stamp(l.unit.x, l.unit.z, "teal", 1);
    }
  }

  private hatchBugsAt(x: number, z: number): void {
    const spin = Math.random() * Math.PI * 2;
    for (let i = 0; i < HATCH_BUGS; i++) {
      const ang = spin + (i / HATCH_BUGS) * Math.PI * 2;
      this.spawnTyped({
        x: x + Math.cos(ang) * 0.75,
        z: z + Math.sin(ang) * 0.75,
        hp: 1,
        role: "runner",
        speed_mult: 1,
        eat_mult: 1,
        scale: 1.35,
        color: 0xff99ee,
        look: "bug",
      });
    }
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
      if (l.look === "stain" || l.unit.speed_mult <= 0) {
        l.unit.eating = false;
        if (l.dying > 0) l.dying -= dt;
        this.placeLive(l, dt);
        continue;
      }
      if (l.unit.stun_left > 0) {
        l.unit.stun_left -= dt;
        this.placeLive(l, 0);
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
      this.placeLive(l, dt);
      if (l.dying > 0) l.dying -= dt;
      l.drip += dt;
      if (this.dripPaint && !l.dots && l.drip > 0.45) {
        l.drip = 0;
        this.paint.stamp(l.unit.x, l.unit.z, "blight", 0.7);
      }
    }
    this.reap();
  }

  clear(): void {
    for (const l of this.live) this.disposeLive(l);
    this.live = [];
    this.spawnLeft = 0;
    this.spawnAcc = 0;
    this.stationary = false;
  }

  dispose(): void {
    this.clear();
    this.glowTex?.dispose();
    this.ringGeo?.dispose();
  }

  private ensureGlowArt(): void {
    if (this.glowTex) return;
    this.ringGeo ??= new THREE.CircleGeometry(1, 28);
    this.glowTex = makeFloorMarkTexture(
      "rgba(200, 255, 255, 0.95)",
      "rgba(15, 190, 199, 0.75)",
      "rgba(209, 88, 188, 0.5)",
    );
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
    this.spawnTyped({
      x: pos.x,
      z: pos.z,
      hp: this.cfg.blight_hits,
      role: "runner",
      speed_mult: 1,
      eat_mult: 1,
      scale: 1.8,
      color: 0xff88dd,
      look: "bug",
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
    look?: BlightLook;
  }): BlightUnit {
    const pos = opts.x != null && opts.z != null ? { x: opts.x, z: opts.z } : this.pickSpawnAroundCore();
    const look: BlightLook = opts.look ?? (opts.is_boss ? "boss" : "bug");
    const s = Math.max(0.6, opts.scale);
    const w = (look === "stain" ? 0.7 : look === "boss" ? 1.45 : 1.05) * s;
    const h = (look === "stain" ? 0.85 : look === "boss" ? 2.2 : 1.45) * s;
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
    const live: Live = {
      unit,
      drip: 0,
      look,
      bob: Math.random() * Math.PI * 2,
      hitSpin: 0,
      dying: 0,
      w,
      h,
    };
    this.live.push(live);

    const form = look === "boss" ? "square" : "circle";
    const count = look === "boss" ? 1200 : look === "stain" ? 140 : 180;
    live.dots = new CulpritCloud({ form, count, size: look === "boss" ? 0.1 : look === "bug" ? 0.13 : 0.09 });
    live.dots.group.scale.setScalar(look === "boss" ? 1.05 * s : look === "stain" ? 0.55 * s : 0.72 * s);
    this.stage.addOverlay(live.dots.group);
    if (look === "boss") live.dots.playRise();
    else live.dots.playGather();
    if (look === "bug" || look === "stain") {
      this.ensureGlowArt();
      const ringMat = new THREE.MeshBasicMaterial({
        map: this.glowTex,
        color: 0xffffff,
        transparent: true,
        depthWrite: false,
        fog: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        polygonOffset: true,
        polygonOffsetFactor: -4,
        polygonOffsetUnits: -4,
      });
      const ring = new THREE.Mesh(this.ringGeo!, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.scale.setScalar(look === "bug" ? 1.9 : 1.5);
      ring.renderOrder = 5;
      ring.frustumCulled = false;
      this.stage.getPaintGroup().add(ring);
      live.ring = ring;
      live.ringMat = ringMat;
    }
    this.placeLive(live, 0);
    return unit;
  }

  private placeLive(l: Live, dt: number): void {
    l.bob += dt * (l.look === "bug" || l.look === "boss" ? 5.2 : 1.6);
    if (l.hitSpin !== 0) {
      l.hitSpin *= Math.exp(-dt * 7);
      if (Math.abs(l.hitSpin) < 0.02) l.hitSpin = 0;
    }
    const hover =
      l.look === "stain"
        ? 0.08
        : l.look === "boss"
          ? 0.12 + Math.sin(l.bob) * 0.08
          : 0.1 + Math.sin(l.bob) * 0.08;
    if (l.panel) {
      l.panel.position.set(l.unit.x, hover, l.unit.z);
      const cam = this.stage.getCamera().position;
      l.panel.lookAt(cam.x, l.panel.position.y + l.h * 0.5, cam.z);
      l.panel.rotateY(l.hitSpin);
    }
    if (l.ring) {
      l.ring.position.set(l.unit.x, 0.055, l.unit.z);
      const pulse = 1 + Math.sin(l.bob * 0.85) * 0.08;
      const base = l.look === "bug" ? 1.9 : 1.5;
      const dyingBoost = l.dying > 0 ? 1.45 : 1;
      l.ring.scale.setScalar(base * pulse * dyingBoost);
      if (l.ringMat && l.dying > 0) l.ringMat.opacity = 0.55 + (1 - l.dying) * 0.45;
    }
    if (l.dots) {
      l.dots.setWorld(l.unit.x, l.unit.z);
      l.dots.tick(dt);
    }
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
      if (l.unit.hp > 0 || l.dying > 0) {
        keep.push(l);
        continue;
      }
      this.disposeLive(l);
    }
    this.live = keep;
  }

  private disposeLive(l: Live): void {
    if (l.panel) this.stage.removeOverlay(l.panel);
    if (l.ring) this.stage.getPaintGroup().remove(l.ring);
    l.mat?.dispose();
    l.ringMat?.dispose();
    l.dots?.dispose();
  }
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function makeFloorMarkTexture(inner: string, mid: string, rim: string): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = 160;
  c.height = 160;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, 160, 160);
  const g = ctx.createRadialGradient(80, 80, 6, 80, 80, 76);
  g.addColorStop(0, inner);
  g.addColorStop(0.42, mid);
  g.addColorStop(0.72, rim);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 160, 160);
  ctx.strokeStyle = rim;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(80, 80, 58, 0, Math.PI * 2);
  ctx.stroke();
  return canvasTex(c);
}

function canvasTex(c: HTMLCanvasElement): THREE.Texture {
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}
