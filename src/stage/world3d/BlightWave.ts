/**
 * 오염 웨이브 — 얼룩·벌레·원흉은 점구름.
 * 얼룩을 걷으면 그 자리에서 동그라미 벌레가 나오고, 벌레가 쓰러지면 바닥 오염이 걷힌다.
 */
import * as THREE from "three";
import type { JourneyStage3D } from "./JourneyStage3D";
import type { GroundPaint } from "./GroundPaint";
import type { PurifyRaidConfig } from "./purifyRaidConfig";
import { BlightBody, type BlightKind } from "./BlightBody";
import { loadBugVolume, loadPollutant, type CulpritCloud } from "./CulpritCloud";
import { CulpritPresence } from "./purify/CulpritPresence";
import { defaultPurifySkillBalance } from "./purifySkillBalance";

export type BlightLook = "stain" | "matter" | "bug" | "boss";

const HATCH_BUGS = 3;
/** 벌레 이동 궤적 — 바닥 오염 데칼·격자 반경 배율 (기본 0.38 → 3배) */
const BUG_TIRE_MARK_SCALE = 1.14;

/** 프로토 툴 원흉 점구름 → 얼룩. 핵·안개 제외 · 알갱이 2배 · scale만 필드용 축소 */
const STAIN_FROM_CULPRIT = (() => {
  const bal = defaultPurifySkillBalance();
  return {
    scale: bal.culpritScale * 0.28,
    count: bal.culpritCount * 2,
    size: bal.culpritSize,
  };
})();

export interface BlightUnit {
  id: number;
  x: number;
  z: number;
  hp: number;
  maxHp: number;
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
  hpBar?: THREE.Sprite;
  drip: number;
  look: BlightLook;
  bob: number;
  hitSpin: number;
  dying: number;
  w: number;
  h: number;
  dots?: CulpritCloud;
  /** 얼룩 — 프로토 원흉(CulpritPresence)과 동일 비주얼 */
  presence?: CulpritPresence;
  /** 오염물질 — 살짝 피하며 움직임 */
  skitter?: boolean;
  skitterPhase?: number;
  homeX?: number;
  homeZ?: number;
  /** 오염물질 — 개체마다 다른 좌우 흔들림 폭(m) */
  wanderAmpX?: number;
  wanderAmpZ?: number;
  /** 벌레 — 가운데 도착 후 다음 목표 */
  wanderTx?: number;
  wanderTz?: number;
  /** 벌레 — 가운데에 한 번 닿았는지 */
  reachedCore?: boolean;
  /** 벌레 — 이동 방향에 맞춘 yaw (머리=-X → +π/2) */
  faceYaw?: number;
  /** 얼룩 — 플레이어 접근 시 땅에서 올라옴 */
  emerged?: boolean;
  /** 정화 확산용 시작 스케일 */
  dieSpreadFrom?: number;
  dieSpreadDur?: number;
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
  /** 오염물질 스폰/처치 자리 — 이후 벌레 스폰 기준 */
  pollutionSites: { x: number; z: number }[] = [];
  /** false면 디렉터가 스폰·종료를 맡는다 */
  useLegacyWaves = true;
  /** true면 리젠만. 거점으로 안 달려온다 */
  stationary = false;
  /** false면 걸을 때 발밑 보라 데칼을 안 찍는다 */
  dripPaint = true;
  /** 벌레 이동 시 타이어마크(점구름색 바닥칠) */
  bugTireMarks = true;
  /** 얼룩이 땅에서 올라오기 시작하는 거리(사거리와 맞춤) */
  emergeRangeM = 12;

  constructor(
    private readonly stage: JourneyStage3D,
    private readonly paint: GroundPaint,
    private cfg: PurifyRaidConfig,
    private core: { x: number; z: number },
  ) {
    void loadBugVolume();
    void loadPollutant();
  }

  /** 사거리(+보정)에 맞춰 얼룩 출현 거리 */
  setEmergeRange(rangeM: number): void {
    this.emergeRangeM = Math.max(4, rangeM);
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

  get huntUnits(): BlightUnit[] {
    return this.live.filter((l) => l.unit.hp > 0 && l.dying <= 0).map((l) => l.unit);
  }

  /** 원흉 가드(얼룩·오염)만 — 보스 제외 */
  get guardUnits(): BlightUnit[] {
    return this.live
      .filter((l) => l.unit.hp > 0 && l.dying <= 0 && !l.unit.is_boss && (l.look === "stain" || l.look === "matter"))
      .map((l) => l.unit);
  }

  guardAliveCount(): number {
    return this.guardUnits.length;
  }

  lookOf(id: number): BlightLook | null {
    return this.live.find((l) => l.unit.id === id)?.look ?? null;
  }

  isBossId(id: number): boolean {
    const l = this.live.find((x) => x.unit.id === id);
    return !!l && (l.unit.is_boss || l.look === "boss");
  }

  healBoss(amount: number): void {
    for (const l of this.live) {
      if (!l.unit.is_boss && l.look !== "boss") continue;
      if (l.dying > 0 || l.unit.hp <= 0) continue;
      l.unit.hp = Math.min(l.unit.maxHp, l.unit.hp + amount);
    }
  }

  /** 원흉 순간이동 — 유닛 좌표만 옮김 */
  setUnitWorld(id: number, x: number, z: number): void {
    const l = this.live.find((v) => v.unit.id === id);
    if (!l || l.dying > 0 || l.unit.hp <= 0) return;
    l.unit.x = x;
    l.unit.z = z;
    this.placeLive(l, 0);
  }

  /** 살아 있는 오염물질 수 */
  matterAliveCount(): number {
    return this.live.filter((l) => l.look === "matter" && l.unit.hp > 0 && l.dying <= 0).length;
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
    this.finishKill(l, true);
    this.lastDeaths = [{ x: hx, z: hz }];
    // 얼룩은 퍼져 사라지고 끝 — 벌레 부화 없음 (클리어 → 1차 정화)
    this.reap();
    return 1;
  }

  /** 원을 각도로 나눠 뿌린다. 랜덤 순서로 하나씩 모이며 리젠 */
  async scatterAround(count: number, minR: number, maxR: number): Promise<void> {
    this.clear();
    this.stationary = true;
    this.useLegacyWaves = false;
    this.finished = false;
    const n = Math.max(1, count);
    const spin = Math.random() * Math.PI * 2;
    const half = this.stage.getWorldScale() / 2 - 1;
    const spots: { x: number; z: number }[] = [];
    for (let i = 0; i < n; i++) {
      const ang = spin + (i / n) * Math.PI * 2;
      const r = minR + (maxR - minR) * 0.55 + (Math.random() - 0.5) * 2.4;
      spots.push({
        x: clamp(this.core.x + Math.cos(ang) * r, -half, half),
        z: clamp(this.core.z + Math.sin(ang) * r, -half, half),
      });
    }
    shuffleInPlace(spots);
    for (const spot of spots) {
      this.spawnTyped({
        x: spot.x,
        z: spot.z,
        hp: 1,
        role: "runner",
        speed_mult: 0,
        eat_mult: 0,
        scale: 1,
        color: 0xd8a8ff,
        look: "stain",
      });
      const prevR = this.cfg.paint_radius_m;
      this.paint.setRadius(1);
      this.paint.stamp(spot.x, spot.z, "blight", 0.85);
      this.paint.setRadius(prevR);
      await delayMs(180 + Math.random() * 320);
    }
  }

  /** 1차 정화 후 — 오염물질. 랜덤 순서로 하나씩 모이며 리젠 */
  async scatterBigPollution(count: number, minR: number, maxR: number, hp: number): Promise<void> {
    this.clear();
    this.stationary = true;
    this.useLegacyWaves = false;
    this.finished = false;
    this.pollutionSites = [];
    const n = Math.max(1, count);
    const spin = Math.random() * Math.PI * 2;
    const half = this.stage.getWorldScale() / 2 - 1;
    const spots: { x: number; z: number }[] = [];
    for (let i = 0; i < n; i++) {
      const ang = spin + (i / n) * Math.PI * 2;
      const r = minR + (maxR - minR) * (0.45 + (i % 3) * 0.18);
      const x = clamp(this.core.x + Math.cos(ang) * r, -half, half);
      const z = clamp(this.core.z + Math.sin(ang) * r, -half, half);
      spots.push({ x, z });
      this.pollutionSites.push({ x, z });
    }
    shuffleInPlace(spots);
    for (const spot of spots) {
      this.spawnTyped({
        x: spot.x,
        z: spot.z,
        hp: Math.max(1, hp),
        role: "tank",
        speed_mult: 0.55,
        eat_mult: 0,
        scale: 2.475,
        color: 0xd8a8ff,
        look: "matter",
        showHp: true,
        skitter: true,
      });
      this.paint.stamp(spot.x, spot.z, "blight", 1.35);
      await delayMs(220 + Math.random() * 380);
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
      scale: 1,
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
  hitSplash(cx: number, cz: number, radiusM: number, dmg = 1, opts?: { stamp?: boolean; onlyId?: number; skipBoss?: boolean }): number {
    const r2 = radiusM * radiusM;
    const stamp = opts?.stamp !== false;
    let down = 0;
    this.lastDeaths = [];
    this.lastStainKills = 0;
    for (const l of this.live) {
      if (opts?.onlyId != null && l.unit.id !== opts.onlyId) continue;
      if (opts?.skipBoss && (l.unit.is_boss || l.look === "boss")) continue;
      const dx = l.unit.x - cx;
      const dz = l.unit.z - cz;
      if (dx * dx + dz * dz > r2) continue;
      if (l.dying > 0) continue;
      l.unit.hp -= dmg;
      l.hitSpin = Math.PI * 0.95;
      l.dots?.pulseHit();
      if (l.unit.hp <= 0) {
        this.lastDeaths.push({ x: l.unit.x, z: l.unit.z });
        down += 1;
        if (l.look === "stain") this.lastStainKills += 1;
        this.finishKill(l, stamp);
      }
    }
    this.reap();
    return down;
  }

  /** 락된 한 개체만 깎기 (오염물질 순차 격파) */
  hitLocked(id: number, dmg = 1): number {
    const l = this.live.find((x) => x.unit.id === id);
    if (!l || l.dying > 0 || l.unit.hp <= 0) return 0;
    this.lastDeaths = [];
    this.lastStainKills = 0;
    l.unit.hp -= dmg;
    l.hitSpin = Math.PI * 0.95;
    l.dots?.pulseHit();
    if (l.unit.hp <= 0) {
      this.lastDeaths.push({ x: l.unit.x, z: l.unit.z });
      if (l.look === "stain") this.lastStainKills += 1;
      this.finishKill(l, false);
      this.reap();
      return 1;
    }
    return 0;
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
    if (l.look === "stain") {
      l.dying = 2.15;
      l.dieSpreadDur = 2.15;
      if (l.presence) {
        l.dieSpreadFrom = STAIN_FROM_CULPRIT.scale;
        l.presence.hitPurify();
      } else if (l.dots) {
        l.dieSpreadFrom = l.dots.group.scale.x;
        l.dots.playDiffuse();
      }
    } else if (l.look === "bug") {
      // 벌레 — 퍼지기 대기 없이 즉시 제거
      l.dying = 0;
      this.removeLiveVisual(l);
    } else {
      l.dying = l.dots ? 0.95 : 0.18;
      l.dots?.die();
    }
    // 바닥 오염 링/데칼 즉시 제거 (얼룩·오염물질·벌레)
    this.paint.eraseNear(
      l.unit.x,
      l.unit.z,
      l.look === "stain"
        ? Math.max(this.cfg.paint_radius_m * 4.2, (l.w || 2) * 1.6)
        : this.cfg.paint_radius_m * 2.6,
    );
    if (l.ring) {
      this.stage.getPaintGroup().remove(l.ring);
      l.ringMat?.dispose();
      l.ring = undefined;
      l.ringMat = undefined;
    }
    if (l.hpBar) l.hpBar.visible = false;
    if (l.look !== "stain" && l.look !== "bug" && stampTeal) {
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
      if (l.look === "stain" || l.look === "matter") {
        l.unit.eating = false;
        if (l.dying > 0) {
          l.dying -= dt;
          this.placeLive(l, dt);
          continue;
        }
        if (l.dots && l.look === "stain") {
          // 처음부터 지상에 고정 — 접근할 때 올라오면 캐릭을 따라다니는 느낌 남
          l.emerged = true;
          l.dots.rise = 1;
          l.dots.riseTo = 1;
        } else if (l.dots && l.look === "matter" && l.dying <= 0) {
          // 살아 있을 때만 공 형태 유지. 죽으면 퍼지기
          l.dots.gatherTo = 1;
        }
        if (l.skitter) {
          l.skitterPhase = (l.skitterPhase ?? 0) + dt * 1.7;
          const homeX = l.homeX ?? l.unit.x;
          const homeZ = l.homeZ ?? l.unit.z;
          // 제자리 좌우 흔들림만 — 플레이어 근처 회피는 따라다니는 느낌이라 제거
          const ax = l.look === "matter" ? (l.wanderAmpX ?? 3) : 0.35;
          const az = l.look === "matter" ? (l.wanderAmpZ ?? 0.8) : 0.35;
          l.unit.x = homeX + Math.cos(l.skitterPhase * 0.7) * ax;
          l.unit.z = homeZ + Math.sin(l.skitterPhase * 0.55) * az;
        }
        this.placeLive(l, dt);
        continue;
      }
      if (l.unit.speed_mult <= 0) {
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
      const sp = speed * l.unit.speed_mult * l.unit.slow_mult;
      if (l.look === "bug") {
        this.tickBugMove(l, dt, sp);
        this.placeLive(l, dt);
        if (l.dying > 0) l.dying -= dt;
        continue;
      }
      const dx = this.core.x - l.unit.x;
      const dz = this.core.z - l.unit.z;
      const dist = Math.hypot(dx, dz) || 1;
      const hold = l.unit.role === "spitter" ? 4.2 : 1.35;
      l.unit.eating = dist < (l.unit.role === "spitter" ? 4.4 : 1.35);
      if (dist > hold) {
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

  /** 벌레 — 가운데로 → 도착하면 다른 방향으로 계속 이동 */
  private tickBugMove(l: Live, dt: number, sp: number): void {
    const hold = 1.45;
    const dx = this.core.x - l.unit.x;
    const dz = this.core.z - l.unit.z;
    const distCore = Math.hypot(dx, dz) || 1;
    l.unit.eating = distCore < hold * 1.15;

    if (!l.reachedCore) {
      if (distCore > hold) {
        this.stepBug(l, dx / distCore, dz / distCore, sp, dt);
        return;
      }
      l.reachedCore = true;
      this.pickBugWanderAway(l);
    }

    if (l.wanderTx == null || l.wanderTz == null) {
      this.pickBugWanderAway(l);
    }
    const tx = l.wanderTx ?? this.core.x;
    const tz = l.wanderTz ?? this.core.z;
    const wx = tx - l.unit.x;
    const wz = tz - l.unit.z;
    const wd = Math.hypot(wx, wz) || 1;
    if (wd < 1.3) {
      this.pickBugWanderAway(l);
      return;
    }
    this.stepBug(l, wx / wd, wz / wd, sp, dt);
  }

  private pickBugWanderAway(l: Live): void {
    const fromAng = Math.atan2(l.unit.z - this.core.z, l.unit.x - this.core.x);
    // 지금 방향과 다르게 — 90~270도 쪽으로 꺾기
    const turn = (Math.random() < 0.5 ? 1 : -1) * (Math.PI * 0.55 + Math.random() * Math.PI * 0.7);
    const ang = fromAng + turn;
    const r = 7 + Math.random() * 12;
    l.wanderTx = this.core.x + Math.cos(ang) * r;
    l.wanderTz = this.core.z + Math.sin(ang) * r;
  }

  private stepBug(l: Live, nx: number, nz: number, sp: number, dt: number): void {
    const px = l.unit.x;
    const pz = l.unit.z;
    l.unit.x += nx * sp * dt;
    l.unit.z += nz * sp * dt;
    // Bug_blight 옆보기: 머리(앞면)가 이미지 왼쪽 = 로컬 -X → 이동 방향으로 +π/2
    if (nx * nx + nz * nz > 1e-8) {
      l.faceYaw = Math.atan2(nx, nz) + Math.PI * 0.5;
    }
    if (this.bugTireMarks) {
      const moved = Math.hypot(l.unit.x - px, l.unit.z - pz);
      l.drip += moved;
      if (l.drip > 0.28) {
        l.drip = 0;
        this.paint.stamp(l.unit.x, l.unit.z, "blight", 0.55, BUG_TIRE_MARK_SCALE);
      }
    }
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
    showHp?: boolean;
    skitter?: boolean;
    /** true면 점구름 본체 없이 HP/히트박스만 */
    noCloud?: boolean;
  }): BlightUnit {
    const pos = opts.x != null && opts.z != null ? { x: opts.x, z: opts.z } : this.pickSpawnAroundCore();
    const look: BlightLook = opts.look ?? (opts.is_boss ? "boss" : "bug");
    const s = Math.max(0.6, opts.scale);
    const stainHit = STAIN_FROM_CULPRIT.scale * 0.55;
    const w =
      look === "stain"
        ? stainHit
        : (look === "matter" ? 1.15 : look === "boss" ? 1.45 : 1.05) * s;
    const h =
      look === "stain"
        ? stainHit * 1.1
        : (look === "matter" ? 1.85 : look === "boss" ? 2.2 : 1.45) * s;
    const maxHp = Math.max(1, opts.hp);
    const unit: BlightUnit = {
      id: uid++,
      x: pos.x,
      z: pos.z,
      hp: maxHp,
      maxHp,
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
      skitter: !!opts.skitter,
      skitterPhase: Math.random() * Math.PI * 2,
      homeX: pos.x,
      homeZ: pos.z,
      // 좌우 ±(1~5)m · 앞뒤는 더 작게 — 개체마다 제각각
      wanderAmpX: look === "matter" ? 1 + Math.random() * 4 : undefined,
      wanderAmpZ: look === "matter" ? 0.4 + Math.random() * 1.2 : undefined,
    };
    this.live.push(live);

    if (look === "matter") {
      // 이전 상태: 입체 오염물질 (납작 원반 실험 되돌림)
      this.attachBlight(live, "matter", Math.max(1.4, 0.95 * s));
      if (opts.showHp || maxHp > 1) {
        live.hpBar = makeHpSprite();
        this.stage.addOverlay(live.hpBar);
        syncHpSprite(live.hpBar, 1);
      }
      this.placeLive(live, 0);
      return unit;
    }

    if (look === "stain") {
      // 프로토 툴 원흉(CulpritPresence) 비주얼을 얼룩에 사용
      this.attachStainPresence(live);
      if (opts.showHp || maxHp > 1) {
        live.hpBar = makeHpSprite();
        this.stage.addOverlay(live.hpBar);
        syncHpSprite(live.hpBar, 1);
      }
      this.placeLive(live, 0);
      return unit;
    }

    if (look === "boss") {
      // 네모 원흉 점구름 (크기 유지) — noCloud면 외부 연출만 씀
      if (!opts.noCloud) {
        this.attachBlight(live, "culprit", Math.max(2.2, 1.9 * s));
      }
      live.hpBar = makeHpSprite();
      this.stage.addOverlay(live.hpBar);
      syncHpSprite(live.hpBar, 1);
      this.placeLive(live, 0);
      return unit;
    }

    // 벌레 — 바닥 링 없이 점구름만 (링만 보이던 문제). 기본 대비 ~30% 축소 스케일은 호출측
    this.attachBlight(live, "bug", Math.max(0.6, 0.72 * s));
    if (opts.showHp || maxHp > 1) {
      live.hpBar = makeHpSprite();
      this.stage.addOverlay(live.hpBar);
      syncHpSprite(live.hpBar, 1);
    }
    this.placeLive(live, 0);
    return unit;
  }

  /** 얼룩 — purify_skill_balance.json 원흉 비주얼(A 구름+B 안개·핵) */
  private attachStainPresence(live: Live): void {
    const presence = new CulpritPresence({
      scale: STAIN_FROM_CULPRIT.scale,
      count: STAIN_FROM_CULPRIT.count,
      size: STAIN_FROM_CULPRIT.size,
      // 가운데 핵·안개는 그대로 · 점구름만 2배
      cloudScaleMul: 2,
      idlePulse: true,
    });
    live.presence = presence;
    live.dots = presence.cloud;
    live.emerged = true;
    // 모이며 리젠
    presence.cloud.purify = 0;
    presence.cloud.purifyTo = 0;
    presence.cloud.playRise();
    presence.cloud.playGather();
    this.stage.addOverlay(presence.group);
  }

  /** 얼룩·벌레·원흉 — BlightBody 한 길로 생성 후 리젠 */
  private attachBlight(
    live: Live,
    kind: BlightKind,
    scale: number,
    opts?: { flatten?: number },
  ): void {
    void BlightBody.create(kind, { scale }).then((body) => {
      if (!this.live.includes(live) || live.unit.hp <= 0) {
        body.dispose();
        return;
      }
      live.dots = body.cloud;
      if (opts?.flatten != null && opts.flatten > 0) {
        const f = opts.flatten;
        body.group.scale.set(scale, scale * f, scale);
      }
      this.stage.addOverlay(body.group);
      if (kind === "stain") {
        // 처음부터 지상에 보이게 (접근 상승 연출 제거)
        live.emerged = true;
        body.cloud.gather = 1;
        body.cloud.gatherTo = 1;
        body.cloud.rise = 1;
        body.cloud.riseTo = 1;
        body.cloud.purify = 0;
        body.cloud.purifyTo = 0;
        body.cloud.tick(0);
      } else if (kind === "bug") {
        // 처음부터 바닥에 붙은 채 — rise로 공중에 뜨지 않음
        body.cloud.purify = 0;
        body.cloud.purifyTo = 0;
        body.cloud.rise = 1;
        body.cloud.riseTo = 1;
        body.cloud.gather = 1;
        body.cloud.gatherTo = 1;
        body.cloud.tick(0);
        const dx = this.core.x - live.unit.x;
        const dz = this.core.z - live.unit.z;
        if (dx * dx + dz * dz > 1e-6) {
          live.faceYaw = Math.atan2(dx, dz) + Math.PI * 0.5;
        }
      } else if (kind === "matter" || kind === "human") {
        // 흩어진 상태에서 모이며 올라옴
        body.cloud.purify = 0;
        body.cloud.purifyTo = 0;
        body.cloud.playRise();
        body.cloud.playGather();
      } else {
        body.spawn();
      }
      this.placeLive(live, 0);
    });
  }

  private placeLive(l: Live, dt: number): void {
    l.bob += dt * (l.look === "bug" || l.look === "boss" ? 5.2 : 1.6);
    if (l.hitSpin !== 0) {
      l.hitSpin *= Math.exp(-dt * 7);
      if (Math.abs(l.hitSpin) < 0.02) l.hitSpin = 0;
    }
    const hover =
      l.look === "stain"
        ? 0.04
        : l.look === "matter"
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
      const base =
        l.look === "stain"
          ? Math.max(3, (l.w || 2) * 1.9)
          : l.look === "bug"
            ? 0.85
            : 1.9;
      const dyingBoost = l.dying > 0 ? 1.25 : 1;
      l.ring.scale.setScalar(base * pulse * dyingBoost);
      if (l.ringMat && l.dying > 0) l.ringMat.opacity = 0.55 + (1 - l.dying) * 0.45;
    }
    if (l.presence) {
      l.presence.setWorld(l.unit.x, l.unit.z);
      if (l.look === "stain" && l.dying > 0 && l.dieSpreadFrom != null) {
        const dur = Math.max(0.2, l.dieSpreadDur ?? 2.15);
        const u = 1 - Math.max(0, Math.min(1, l.dying / dur));
        const s = l.dieSpreadFrom * (1 + u * 1.35);
        l.presence.group.scale.setScalar(s / STAIN_FROM_CULPRIT.scale);
      }
      l.presence.tick(dt);
    } else if (l.dots) {
      l.dots.setWorld(l.unit.x, l.unit.z);
      if (l.look === "bug" && l.faceYaw != null) {
        l.dots.group.rotation.y = l.faceYaw;
      }
      if (l.look === "stain" && l.dying > 0 && l.dieSpreadFrom != null) {
        const dur = Math.max(0.2, l.dieSpreadDur ?? 2.15);
        const u = 1 - Math.max(0, Math.min(1, l.dying / dur));
        // 정화 — 바깥으로 확산되며 옅어짐
        l.dots.group.scale.setScalar(l.dieSpreadFrom * (1 + u * 2.4));
      }
      l.dots.tick(dt);
    }
    if (l.hpBar) {
      const lift =
        l.look === "matter"
          ? Math.max(2.4, (l.h || 2) * 0.55)
          : l.look === "stain"
            ? 2.6
            : l.look === "boss"
              ? 3.2
              : l.look === "bug"
                ? Math.max(2.35, (l.h || 2) * 1.15) // 머리 위
                : 1.35;
      l.hpBar.position.set(l.unit.x, lift, l.unit.z);
      const ratio = l.unit.maxHp > 0 ? Math.max(0, l.unit.hp) / l.unit.maxHp : 0;
      syncHpSprite(l.hpBar, l.dying > 0 ? 0 : ratio);
      l.hpBar.visible = l.dying <= 0 && l.unit.hp > 0;
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

  private removeLiveVisual(l: Live): void {
    if (l.hpBar) {
      this.stage.removeOverlay(l.hpBar);
      const mat = l.hpBar.material as THREE.SpriteMaterial;
      mat.map?.dispose();
      mat.dispose();
      l.hpBar = undefined;
    }
    if (l.presence) {
      this.stage.removeOverlay(l.presence.group);
      l.presence.dispose();
      l.presence = undefined;
      l.dots = undefined;
    } else if (l.dots) {
      this.stage.removeOverlay(l.dots.group);
      l.dots.dispose();
      l.dots = undefined;
    }
  }

  private disposeLive(l: Live): void {
    if (l.panel) this.stage.removeOverlay(l.panel);
    if (l.ring) this.stage.getPaintGroup().remove(l.ring);
    this.removeLiveVisual(l);
    l.mat?.dispose();
    l.ringMat?.dispose();
  }
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function shuffleInPlace<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = t;
  }
}

function delayMs(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function makeHpSprite(): THREE.Sprite {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 24;
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const spr = new THREE.Sprite(mat);
  spr.scale.set(2.8, 0.45, 1);
  spr.renderOrder = 30;
  spr.userData.hpCanvas = c;
  return spr;
}

function syncHpSprite(spr: THREE.Sprite, ratio: number): void {
  const c = spr.userData.hpCanvas as HTMLCanvasElement | undefined;
  if (!c) return;
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, c.width, c.height);
  g.fillStyle = "rgba(0,0,0,0.55)";
  g.fillRect(4, 6, 120, 12);
  g.fillStyle = ratio > 0.45 ? "#6ddea0" : ratio > 0.2 ? "#ffd27a" : "#ff6b6b";
  g.fillRect(4, 6, Math.max(0, 120 * ratio), 12);
  g.strokeStyle = "rgba(255,255,255,0.45)";
  g.strokeRect(4, 6, 120, 12);
  const mat = spr.material as THREE.SpriteMaterial;
  if (mat.map) mat.map.needsUpdate = true;
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
