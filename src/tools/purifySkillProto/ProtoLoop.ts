/**
 * 정화 스킬 프로토
 * 모은다 → 캐스팅 정화 → 띠 멈춤 → 벌레 → 다시 모은다
 * 서두르면 탄 부족. 원흉 처치 ≠ 자동 정화.
 */
import * as THREE from "three";
import { CulpritCloud } from "../../stage/world3d/CulpritCloud";
import { GroundPaint } from "../../stage/world3d/GroundPaint";
import type { JourneyStage3D } from "../../stage/world3d/JourneyStage3D";
import { PurifyGun } from "../../stage/world3d/PurifyGun";
import { PURIFY_RAID_DEFAULTS, type PurifyRaidConfig } from "../../stage/world3d/purifyRaidConfig";
import { RaidVfx } from "../../stage/world3d/RaidVfx";
import { emptyRaidTables } from "../../stage/world3d/raidTables";
import { BurnRim } from "./BurnRim";
import { CulpritPresence } from "./CulpritPresence";
import { SandBug } from "./SandBug";
import { SoftBlightOctet, TINT_LINE, type TintStep } from "./SoftBlightOctet";

export type ProtoPhase =
  | "idle"
  | "gather"
  | "casting"
  | "purify"
  | "bugs"
  | "culprit"
  | "need_cast"
  | "done";
export type SkillId = "basic" | "multi" | "boom" | "chain";
export type CombatGauge = "none" | "cast" | "stop" | "bugs" | "culprit";

/** data/ui/layout/purify_skill_balance.json 과 동기 */
const BAL = {
  circleR: 12,
  castSec: 3.6,
  shrinkSec: 180,
  stopHits: 6,
  bugCount: 12,
  bugHp: 2,
  culpritHp: 20,
  ammoStart: 14,
  pickupGrant: 8,
  pickupCount: 5,
  cost: { basic: 1, multi: 3, boom: 2, chain: 2 } as Record<SkillId, number>,
  minAmmoHint: 10,
  culpritScale: 14,
  culpritCount: 3200,
  culpritSize: 0.18,
};

export interface ProtoHud {
  phase: ProtoPhase;
  skill: SkillId;
  tintStep: TintStep;
  castPct: number;
  gaugeMax: number;
  gaugeLeft: number;
  pollutionPct: number;
  shrinkLeftSec: number;
  waveIn: number;
  bugsAlive: number;
  bugsTotal: number;
  culpritHp: number;
  culpritMax: number;
  combatGauge: CombatGauge;
  ammo: number;
  urgency: 0 | 1 | 2;
  nextCastReady: boolean;
  targetLabel: string;
  failed?: boolean;
}

export interface ProtoHooks {
  onHud?: (hud: ProtoHud) => void;
  onBanner?: (text: string, kind?: "warn" | "ok") => void;
  onPhase?: (phase: ProtoPhase) => void;
}

const WAVE_SPEED = 1 / BAL.shrinkSec;
const BUG_SPEED = 0.09;
const HIT_R = 4.2;
const FAIL_AT = 1;

function skillDmg(skill: SkillId): { shots: number; dmg: number; splash: number } {
  if (skill === "multi") return { shots: 3, dmg: 1, splash: 0 };
  if (skill === "boom") return { shots: 1, dmg: 2, splash: 13.5 };
  if (skill === "chain") return { shots: 1, dmg: 1, splash: 2.2 };
  return { shots: 1, dmg: 1, splash: 0 };
}

interface AmmoPickup {
  mesh: THREE.Mesh;
  x: number;
  z: number;
  taken: boolean;
}

export class ProtoLoop {
  private phase: ProtoPhase = "idle";
  private skill: SkillId = "basic";
  private paint: GroundPaint;
  private gun: PurifyGun;
  private vfx: RaidVfx;
  private cfg: PurifyRaidConfig = {
    ...PURIFY_RAID_DEFAULTS,
    gun_range_m: 18,
    gun_ammo_max: 99,
    gun_ammo_per_sec: 2.8,
    gun_regen_on_teal: 0,
    paint_radius_m: 1.1,
    blight_speed_mps: BUG_SPEED,
  };

  private core = { x: 0, z: 0 };
  private east = { x: 0, z: 0 };
  private blightDots: SoftBlightOctet | null = null;
  private burnRim: BurnRim | null = null;
  private eastMarker: CulpritCloud | null = null;
  private tintStep: TintStep = 1;
  private castPct = 0;
  private castingStep: TintStep = 1;
  /** 다음에 열릴 정화 차수 (원흉 후 최종 캐스팅 포함) */
  private nextCastStep: TintStep | 4 = 1;
  private bugWavesDone = 0;

  private gaugeMax = BAL.stopHits;
  private gaugeLeft = BAL.stopHits;
  private waveIn = 0;
  private waveStopped = false;
  private circleR = BAL.circleR;
  private shrinkActive = false;
  private failRestarting = false;

  private bugs: SandBug[] = [];
  private bugSpawned = 0;
  private bugAcc = 0;

  private culprit: CulpritPresence | null = null;
  private culpritHp = BAL.culpritHp;
  private bound = false;
  private firing = false;

  private ammo = BAL.ammoStart;
  private pickups: AmmoPickup[] = [];
  private pickupGeo = new THREE.SphereGeometry(0.35, 10, 10);
  private warnedLowAmmo = false;

  constructor(
    private readonly stage: JourneyStage3D,
    private readonly hooks: ProtoHooks = {},
    tables = emptyRaidTables(),
  ) {
    this.paint = new GroundPaint(stage, this.cfg.paint_radius_m);
    this.gun = new PurifyGun(stage, this.paint, this.cfg);
    this.vfx = new RaidVfx(stage, tables);
    this.bindFire();
  }

  getPhase(): ProtoPhase {
    return this.phase;
  }

  setSkill(id: SkillId): void {
    this.skill = id;
    this.emitHud();
  }

  getSkill(): SkillId {
    return this.skill;
  }

  setFiring(on: boolean): void {
    this.firing =
      on &&
      this.phase !== "idle" &&
      this.phase !== "done" &&
      this.phase !== "casting" &&
      this.phase !== "gather" &&
      this.phase !== "need_cast";
    this.gun.setFiring(false);
  }

  fireOnce(): void {
    if (
      this.phase === "idle" ||
      this.phase === "done" ||
      this.phase === "casting" ||
      this.phase === "gather" ||
      this.phase === "need_cast"
    ) {
      return;
    }
    const cost = BAL.cost[this.skill];
    if (this.ammo < cost) {
      this.hooks.onBanner?.("발사체가 없다 · 들판에서 모아와", "warn");
      return;
    }
    const aim = this.pickAim();
    if (!aim) return;
    this.ammo -= cost;
    this.warnedLowAmmo = false;
    this.gun.setAim(aim.x, aim.z);
    // 기본은 연사 경로(gun.tick)와 겹치지 않게 단발만
    if (this.skill === "basic") {
      this.gun.launchAt(aim.x, aim.z, 0);
      window.setTimeout(() => {
        this.vfx.play("skill_bolt", aim.x, aim.z);
        this.applyImpact(aim.x, aim.z, 1, 0);
      }, 180);
    } else {
      this.launchSkill(aim.x, aim.z);
    }
    this.emitHud();
  }

  /** 들판 줍기부터 시작 */
  beginGather(): void {
    this.clearCombat();
    this.placeCore();
    this.ammo = BAL.ammoStart;
    this.nextCastStep = 1;
    this.bugWavesDone = 0;
    this.spawnPickups();
    this.phase = "gather";
    this.hooks.onBanner?.("발사체를 모아 · 준비가 되면 1차 정화", "warn");
    this.hooks.onPhase?.(this.phase);
    this.emitHud();
  }

  /** 1차 정화 — 지점에서 캐스팅 */
  startPurify(): void {
    this.startCast(1);
  }

  /**
   * 정화는 무조건 캐스팅.
   * 탄이 모자란 채로 2차를 켜면 그다음 전투에서 막힌다 (의도된 리스크).
   */
  startCast(step: TintStep | 4): void {
    if (step === 4) {
      this.beginFinalCast();
      return;
    }
    if (step === 1) {
      if (this.phase === "idle") this.beginGather();
      this.clearBugs();
      this.clearCulprit();
      this.placeCore();
      if (!this.pickups.length) this.spawnPickups();
    } else {
      // 서둘러 켰을 때 경고만 — 막지는 않음
      if (this.ammo < BAL.minAmmoHint) {
        this.hooks.onBanner?.(
          `탄 ${this.ammo}발뿐 · 이대로 ${step}차면 모자랄 수 있다`,
          "warn",
        );
      }
      this.clearBugs();
    }
    this.castingStep = step;
    this.castPct = 0;
    this.phase = "casting";
    this.hooks.onBanner?.(`${step}차 정화를 시도 중입니다…`, "warn");
    this.hooks.onPhase?.(this.phase);
    this.emitHud();
    void this.stage.walkTo(...this.pctNearCore());
  }

  /** 원흉 처치 후 — 자동 정화 없음, 캐스팅으로만 끝 */
  beginFinalCast(): void {
    this.castingStep = 3;
    this.castPct = 0;
    this.phase = "casting";
    this.nextCastStep = 4;
    this.hooks.onBanner?.("원흉은 쓰러졌다 · 마지막 정화를 캐스팅한다", "warn");
    this.hooks.onPhase?.(this.phase);
    this.emitHud();
    void this.stage.walkTo(...this.pctNearCore());
  }

  startBugs(): void {
    if (this.phase === "idle" || this.phase === "gather") {
      this.startCast(1);
      return;
    }
    this.enterBugsPhase();
  }

  startCulprit(): void {
    this.clearBugs();
    this.clearEastGate();
    this.shrinkActive = false;
    this.phase = "culprit";
    this.culpritHp = BAL.culpritHp;
    this.spawnCulprit();
    this.hooks.onBanner?.("원흉 · 검은 기운이 앞을 가린다", "warn");
    this.hooks.onPhase?.(this.phase);
    this.emitHud();
    void this.playCulpritEntrance();
  }

  reset(): void {
    this.clearCombat();
    this.ammo = BAL.ammoStart;
    this.nextCastStep = 1;
    this.bugWavesDone = 0;
    this.phase = "idle";
    this.hooks.onBanner?.("");
    this.hooks.onPhase?.(this.phase);
    this.emitHud();
  }

  dispose(): void {
    this.clearCombat();
    this.pickupGeo.dispose();
    this.gun.dispose();
    this.vfx.dispose();
    this.paint.dispose();
    this.bound = false;
  }

  private bindFire(): void {
    if (this.bound) return;
    this.bound = true;
    const tick = () => {
      if (!this.bound) return;
      this.tick(1 / 60);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  private tick(dt: number): void {
    this.vfx.tick(dt);
    this.blightDots?.tick(dt);
    this.burnRim?.tick(dt);
    this.eastMarker?.tick(dt);
    this.culprit?.tick(dt);
    for (const b of this.bugs) {
      if (!b.dead) b.tick(dt);
    }
    this.tickPickups();

    if (this.phase === "casting") {
      this.castPct = Math.min(1, this.castPct + dt / BAL.castSec);
      if (this.castPct >= 1) void this.finishCast();
      this.emitHud();
      return;
    }

    if (this.phase === "purify" && this.shrinkActive && !this.waveStopped && !this.failRestarting) {
      this.waveIn = Math.min(FAIL_AT, this.waveIn + WAVE_SPEED * dt);
      const r = BAL.circleR * (1 - this.waveIn);
      this.applyCircleRadius(Math.max(0.4, r));
      if (this.waveIn >= FAIL_AT) void this.failToFirstPurify();
    }

    if (this.phase === "bugs") {
      this.bugAcc += dt;
      while (this.bugSpawned < BAL.bugCount && this.bugAcc >= 0.85) {
        this.bugAcc -= 0.85;
        this.spawnOneBug();
      }
      this.moveBugs(dt);
      this.checkBugsCleared();
    }

    const onTeal = this.paint.at(this.stage.getPlayerWorld().x, this.stage.getPlayerWorld().z) === "teal";
    void onTeal;
    const aim = this.pickAim();
    if (aim) this.gun.setAim(aim.x, aim.z);
    else this.gun.clearAim();

    if (this.firing && this.skill === "basic") {
      if (this.ammo >= BAL.cost.basic) this.gun.setFiring(true);
      else {
        this.gun.setFiring(false);
        if (!this.warnedLowAmmo) {
          this.warnedLowAmmo = true;
          this.hooks.onBanner?.("발사체가 바닥났다", "warn");
        }
      }
    } else this.gun.setFiring(false);

    // 프로토 탄약 = BAL.ammo (총기 내부 탄과 동기)
    this.gun.ammo = this.ammo;
    const hits = this.gun.tick(dt, false);
    if (this.skill === "basic" && this.firing) {
      this.ammo = this.gun.ammo;
      for (const h of hits) this.applyImpact(h.x, h.z, 1, 0);
    } else {
      // 스킬 발사체는 launchAt — 착탄 페인트만
      void hits;
    }
    this.emitHud();
  }

  private async finishCast(): Promise<void> {
    if (this.phase !== "casting") return;
    const step = this.castingStep;

    // 원흉 후 최종 캐스팅
    if (this.nextCastStep === 4 && step === 3) {
      this.tintStep = 3;
      this.hooks.onBanner?.("3차 정화 완료 · 칸이 숨 쉰다", "ok");
      await this.expandAfterCast(3);
      this.phase = "done";
      this.hooks.onPhase?.(this.phase);
      this.emitHud();
      return;
    }

    this.hooks.onBanner?.(`${step}차 정화 완료`, "ok");
    this.tintStep = step;
    this.castPct = 1;
    this.phase = "purify";
    this.gaugeMax = BAL.stopHits;
    this.gaugeLeft = BAL.stopHits;
    this.waveIn = 0;
    this.waveStopped = false;
    this.shrinkActive = false;
    this.bugSpawned = 0;
    this.bugAcc = 0;
    this.clearBugs();
    await this.expandAfterCast(step);
    if (this.phase !== "purify") return;
    this.spawnEastGate();
    this.shrinkActive = true;
    this.spawnPickups();
    this.hooks.onBanner?.("오염이 원을 먹는다 · 시간이 없다 · 동쪽을 멈춰", "warn");
    this.hooks.onPhase?.(this.phase);
    void this.stage.walkTo(...this.pctNearEast());
    this.emitHud();
  }

  private async expandAfterCast(step: TintStep): Promise<void> {
    this.stage.setPurifyColorAmt(step === 1 ? 0.22 : 0.55 + step * 0.12);
    this.clearBlightRim();
    this.spawnBlightRim(0.8, step);
    const t0 = performance.now();
    const expandMs = 1400;
    await new Promise<void>((resolve) => {
      const expandTick = () => {
        const u = Math.min(1, (performance.now() - t0) / expandMs);
        this.applyCircleRadius(0.8 + (BAL.circleR - 0.8) * u);
        if (u < 1) requestAnimationFrame(expandTick);
        else resolve();
      };
      requestAnimationFrame(expandTick);
    });
    this.stage.setPurifyFoci([{ x: this.core.x, z: this.core.z, r: BAL.circleR }]);
    this.stage.setPurifyColorAmt(0.85);
    this.applyCircleRadius(BAL.circleR);
  }

  private launchSkill(x: number, z: number): void {
    const pat = skillDmg(this.skill);

    if (this.skill === "boom") {
      this.gun.launchAt(x, z, 0);
      window.setTimeout(() => {
        this.vfx.playGroundBoom(x, z);
        this.applyImpact(x, z, pat.dmg, pat.splash);
      }, 180);
      return;
    }

    if (this.skill === "chain") {
      this.gun.launchAt(x, z, 0);
      window.setTimeout(() => {
        this.vfx.playWaterDumpling(x, z, 1.15);
        this.applyImpact(x, z, pat.dmg, pat.splash);
        const baseAng = Math.random() * Math.PI * 2;
        for (let k = 0; k < 3; k++) {
          const a = baseAng + (k / 3) * Math.PI * 2;
          const r = 2.4 + k * 0.55;
          const nx = x + Math.cos(a) * r;
          const nz = z + Math.sin(a) * r;
          window.setTimeout(() => {
            this.vfx.playWaterDumpling(nx, nz, 0.95 + k * 0.08);
            this.applyImpact(nx, nz, pat.dmg, pat.splash);
          }, 200 + k * 170);
        }
      }, 160);
      return;
    }

    if (this.skill === "multi") {
      for (let i = 0; i < pat.shots; i++) {
        const spread = 12 + i * 6;
        this.gun.launchAt(x, z, spread);
        window.setTimeout(() => {
          this.vfx.play("skill_bolt", x, z);
          this.applyImpact(x, z, pat.dmg, pat.splash);
        }, 180 + i * 90);
      }
      return;
    }

    this.gun.launchAt(x, z, 0);
    window.setTimeout(() => {
      this.vfx.play("skill_bolt", x, z);
      this.applyImpact(x, z, pat.dmg, pat.splash);
    }, 180);
  }

  private applyImpact(x: number, z: number, dmg: number, splash: number): void {
    if (this.phase === "purify" && this.shrinkActive && !this.waveStopped) {
      if (Math.hypot(x - this.east.x, z - this.east.z) <= HIT_R) {
        this.gaugeLeft = Math.max(0, this.gaugeLeft - dmg);
        this.vfx.play("skill_spread", this.east.x, this.east.z);
        if (this.eastMarker) this.eastMarker.purifyTo = Math.max(0.15, 1 - this.gaugeLeft / this.gaugeMax);
        if (this.gaugeLeft <= 0) {
          this.waveStopped = true;
          this.shrinkActive = false;
          this.hooks.onBanner?.("원이 멈췄다 · 벌레가 드러난다", "ok");
          this.enterBugsPhase();
        }
      }
    }

    for (const b of this.bugs) {
      if (b.dead) continue;
      const d = Math.hypot(b.x - x, b.z - z);
      if (d <= HIT_R || (splash > 0 && d <= splash)) {
        b.hp -= dmg;
        if (b.hp <= 0) this.killBug(b);
      }
    }
    this.checkBugsCleared();

    if (this.phase === "culprit" && this.culprit) {
      const d = Math.hypot(x - this.core.x, z - this.core.z);
      if (d <= HIT_R * 2.2 || (splash > 0 && d <= splash + 2)) {
        this.culpritHp = Math.max(0, this.culpritHp - dmg);
        this.culprit.purifyTo = 1 - this.culpritHp / BAL.culpritHp;
        this.vfx.play("skill_spread", this.core.x, this.core.z);
        if (this.culpritHp <= 0) {
          this.culprit.hitPurify();
          this.vfx.playReleaseBurst(this.core.x, this.core.z, "culprit");
          window.setTimeout(() => this.vfx.playReleaseBurst(this.core.x, this.core.z, "wave"), 180);
          this.phase = "need_cast";
          this.nextCastStep = 4;
          this.hooks.onBanner?.("원흉을 보냈다 · 정화는 캐스팅으로 끝내야 한다", "ok");
          this.hooks.onPhase?.(this.phase);
          this.spawnPickups();
        }
      }
    }
  }

  private enterBugsPhase(): void {
    this.phase = "bugs";
    this.bugAcc = 0;
    if (this.bugSpawned === 0) {
      this.hooks.onBanner?.("벌레가 원을 따라 기어 들어온다", "warn");
    }
    this.hooks.onPhase?.(this.phase);
    this.emitHud();
  }

  private checkBugsCleared(): void {
    if (this.phase !== "bugs") return;
    if (this.bugSpawned < BAL.bugCount) return;
    if (!this.bugs.every((b) => b.dead)) return;

    this.bugWavesDone += 1;
    this.phase = "gather";
    this.nextCastStep = Math.min(3, (this.tintStep + 1) as TintStep) as TintStep;
    this.vfx.playReleaseBurst(this.core.x, this.core.z, "wave");
    window.setTimeout(() => this.vfx.playReleaseBurst(this.east.x, this.east.z, "wave"), 140);
    this.spawnPickups();
    this.hooks.onBanner?.(
      this.ammo < BAL.minAmmoHint
        ? `벌레 해제 · 탄 ${this.ammo} · 더 모은 뒤 ${this.nextCastStep}차 캐스팅`
        : `벌레 해제 · 발사체를 모으고 ${this.nextCastStep}차 정화`,
      "ok",
    );
    this.hooks.onPhase?.(this.phase);
    this.emitHud();
  }

  private pickAim(): { x: number; z: number } | null {
    if (this.phase === "purify" && this.shrinkActive && !this.waveStopped) return { ...this.east };
    if (this.phase === "culprit") return { ...this.core };
    if (this.phase === "purify" || this.phase === "bugs") {
      const me = this.stage.getPlayerWorld();
      let best: SandBug | null = null;
      let bestD = 1e9;
      for (const b of this.bugs) {
        if (b.dead) continue;
        const d = Math.hypot(b.x - me.x, b.z - me.z);
        if (d < bestD) {
          bestD = d;
          best = b;
        }
      }
      return best ? { x: best.x, z: best.z } : this.phase === "purify" ? { ...this.east } : null;
    }
    return null;
  }

  private async failToFirstPurify(): Promise<void> {
    if (this.failRestarting) return;
    this.failRestarting = true;
    this.waveStopped = true;
    this.shrinkActive = false;
    this.hooks.onBanner?.("정화 지역이 다시 오염됐다 · 1차부터", "warn");
    this.emitHud();
    await new Promise((r) => setTimeout(r, 1200));
    this.failRestarting = false;
    this.ammo = Math.max(this.ammo, 6);
    this.startCast(1);
  }

  private placeCore(): void {
    const me = this.stage.getPlayerWorld();
    this.core = { x: me.x, z: me.z };
    this.east = { x: this.core.x + BAL.circleR * 0.92, z: this.core.z };
    this.circleR = BAL.circleR;
  }

  private applyCircleRadius(r: number): void {
    this.circleR = Math.max(0.4, r);
    this.east = { x: this.core.x + this.circleR * 0.98, z: this.core.z };
    this.stage.setPurifyFoci([{ x: this.core.x, z: this.core.z, r: this.circleR }]);
    this.stage.setPurifyColorAmt(0.85);
    this.blightDots?.setOnCircle(this.core.x, this.core.z, this.circleR);
    this.burnRim?.setWorld(this.core.x, this.core.z, this.circleR);
    this.burnRim?.setIntensity(1.05 + this.waveIn * 0.4);
    if (this.eastMarker) this.eastMarker.setWorld(this.east.x, this.east.z);
  }

  private pctNearCore(): [number, number] {
    const p = this.stage.worldToPctPublic(this.core.x, this.core.z + 4);
    return [p.xPct, p.yPct];
  }

  private pctNearEast(): [number, number] {
    const p = this.stage.worldToPctPublic(this.east.x - 5.5, this.east.z);
    return [p.xPct, p.yPct];
  }

  private spawnEastGate(): void {
    this.clearEastGate();
  }

  private clearEastGate(): void {
    if (!this.eastMarker) return;
    this.stage.removeOverlay(this.eastMarker.group);
    this.eastMarker.dispose();
    this.eastMarker = null;
  }

  private spawnBlightRim(r = BAL.circleR, step: TintStep = this.tintStep): void {
    this.clearBlightRim();
    this.burnRim = new BurnRim(step);
    this.burnRim.setWorld(this.core.x, this.core.z, r);
    this.burnRim.setIntensity(1.15);
    this.stage.addOverlay(this.burnRim.mesh);
    this.blightDots = new SoftBlightOctet(step);
    this.blightDots.setOnCircle(this.core.x, this.core.z, r);
    this.stage.addOverlay(this.blightDots.group);
  }

  private clearBlightRim(): void {
    if (this.burnRim) {
      this.stage.removeOverlay(this.burnRim.mesh);
      this.burnRim.dispose();
      this.burnRim = null;
    }
    if (this.blightDots) {
      this.stage.removeOverlay(this.blightDots.group);
      this.blightDots.dispose();
      this.blightDots = null;
    }
  }

  private spawnOneBug(): void {
    const slot = this.bugSpawned % BAL.bugCount;
    const ang = (slot / BAL.bugCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.12;
    const r = Math.max(5, this.circleR) * (0.94 + Math.random() * 0.06);
    const x = this.core.x + Math.cos(ang) * r;
    const z = this.core.z + Math.sin(ang) * r;
    const bug = new SandBug(x, z, BAL.bugHp);
    this.stage.addOverlay(bug.group);
    this.bugs.push(bug);
    this.bugSpawned += 1;
  }

  private moveBugs(dt: number): void {
    for (const b of this.bugs) {
      if (b.dead) continue;
      const dx = this.core.x - b.x;
      const dz = this.core.z - b.z;
      const d = Math.hypot(dx, dz) || 1;
      b.setWorld(b.x + (dx / d) * BUG_SPEED * dt, b.z + (dz / d) * BUG_SPEED * dt);
      if (d < 2.2) this.paint.stamp(b.x, b.z, "blight", 0.35);
    }
  }

  private killBug(b: SandBug): void {
    b.hitPurify();
    this.vfx.playReleaseBurst(b.x, b.z, "bug");
    window.setTimeout(() => {
      this.stage.removeOverlay(b.group);
      b.dispose();
    }, 500);
  }

  private clearBugs(): void {
    for (const b of this.bugs) {
      this.stage.removeOverlay(b.group);
      b.dispose();
    }
    this.bugs = [];
    this.bugSpawned = 0;
    this.bugAcc = 0;
  }

  private spawnCulprit(): void {
    this.clearCulprit();
    // A 큰 오염 구름 + B 낮은 안개·밝은 핵
    const presence = new CulpritPresence({
      scale: BAL.culpritScale,
      count: BAL.culpritCount,
      size: BAL.culpritSize,
    });
    presence.setWorld(this.core.x, this.core.z);
    this.stage.addOverlay(presence.group);
    this.culprit = presence;
  }

  private async playCulpritEntrance(): Promise<void> {
    if (!this.culprit) return;
    this.culprit.playRise();
    this.culprit.playBeforePurify();
    await new Promise((r) => setTimeout(r, 900));
    this.culprit?.playGather();
  }

  private clearCulprit(): void {
    if (!this.culprit) return;
    this.stage.removeOverlay(this.culprit.group);
    this.culprit.dispose();
    this.culprit = null;
  }

  private spawnPickups(): void {
    this.clearPickups();
    const n = BAL.pickupCount;
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * Math.PI * 2 + 0.4;
      const r = 6 + (i % 3) * 3.2;
      const x = this.core.x + Math.cos(ang) * r;
      const z = this.core.z + Math.sin(ang) * r;
      const mat = new THREE.MeshBasicMaterial({
        color: 0x3affe0,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(this.pickupGeo, mat);
      mesh.position.set(x, 0.55, z);
      mesh.renderOrder = 9;
      this.stage.addOverlay(mesh);
      this.pickups.push({ mesh, x, z, taken: false });
    }
  }

  private tickPickups(): void {
    if (!this.pickups.length) return;
    const me = this.stage.getPlayerWorld();
    for (const p of this.pickups) {
      if (p.taken) continue;
      p.mesh.position.y = 0.45 + Math.sin(performance.now() * 0.005 + p.x) * 0.12;
      p.mesh.rotation.y += 0.04;
      if (Math.hypot(me.x - p.x, me.z - p.z) < 1.6) {
        p.taken = true;
        this.ammo += BAL.pickupGrant;
        this.warnedLowAmmo = false;
        this.stage.removeOverlay(p.mesh);
        (p.mesh.material as THREE.Material).dispose();
        this.hooks.onBanner?.(`발사체 +${BAL.pickupGrant} · 지금 ${this.ammo}`, "ok");
      }
    }
  }

  private clearPickups(): void {
    for (const p of this.pickups) {
      if (!p.taken) {
        this.stage.removeOverlay(p.mesh);
        (p.mesh.material as THREE.Material).dispose();
      }
    }
    this.pickups = [];
  }

  private clearCombat(): void {
    this.clearEastGate();
    this.clearBlightRim();
    this.clearBugs();
    this.clearCulprit();
    this.clearPickups();
    this.gun.clear();
    this.paint.clear();
    this.stage.setPurifyFoci([]);
    this.stage.setPurifyColorAmt(0);
    this.stage.clearPurifyWaves();
    this.waveStopped = false;
    this.shrinkActive = false;
    this.failRestarting = false;
    this.warnedLowAmmo = false;
    this.waveIn = 0;
    this.castPct = 0;
    this.circleR = BAL.circleR;
    this.gaugeLeft = BAL.stopHits;
    this.culpritHp = BAL.culpritHp;
    this.tintStep = 1;
  }

  private pickCombatGauge(bugsAlive: number): CombatGauge {
    if (this.phase === "casting") return "cast";
    if (this.phase === "culprit") return "culprit";
    if (this.phase === "bugs") return "bugs";
    if (this.phase === "purify") {
      if (this.waveStopped || bugsAlive > 0) return "bugs";
      return "stop";
    }
    return "none";
  }

  private urgencyLevel(): 0 | 1 | 2 {
    if (this.phase !== "purify" || this.waveStopped) return 0;
    if (this.waveIn >= 0.75) return 2;
    if (this.waveIn >= 0.5) return 1;
    return 0;
  }

  private emitHud(): void {
    const bugsAlive = this.bugs.filter((b) => !b.dead).length;
    const shrinkLeft = Math.max(0, (1 - this.waveIn) * BAL.shrinkSec);
    const combatGauge = this.pickCombatGauge(bugsAlive);
    const urgency = this.urgencyLevel();
    const nextCastReady =
      this.phase === "gather" || this.phase === "need_cast" || this.phase === "idle";

    let targetLabel = "—";
    if (this.phase === "gather") targetLabel = `발사체 수집 · 탄 ${this.ammo}`;
    else if (this.phase === "need_cast") targetLabel = "마지막 정화 캐스팅 필요";
    else if (this.phase === "casting") targetLabel = `정화 시도 ${Math.round(this.castPct * 100)}%`;
    else if (this.phase === "purify") {
      const m = Math.floor(shrinkLeft / 60);
      const s = Math.floor(shrinkLeft % 60);
      targetLabel = this.waveStopped
        ? `벌레 ${bugsAlive}/${BAL.bugCount}`
        : `오염 ${Math.round(this.waveIn * 100)}% · ${m}:${String(s).padStart(2, "0")}`;
    } else if (this.phase === "bugs") targetLabel = `벌레 ${bugsAlive}/${BAL.bugCount}`;
    else if (this.phase === "culprit") targetLabel = `원흉 ${this.culpritHp}/${BAL.culpritHp}`;
    else if (this.phase === "done") targetLabel = "클리어";

    this.hooks.onHud?.({
      phase: this.phase,
      skill: this.skill,
      tintStep: this.tintStep,
      castPct: this.castPct,
      gaugeMax: this.gaugeMax,
      gaugeLeft: this.gaugeLeft,
      pollutionPct: this.waveIn,
      shrinkLeftSec: shrinkLeft,
      waveIn: this.waveIn,
      bugsAlive,
      bugsTotal: BAL.bugCount,
      culpritHp: this.culpritHp,
      culpritMax: BAL.culpritHp,
      combatGauge,
      ammo: this.ammo,
      urgency,
      nextCastReady,
      targetLabel,
      failed: this.failRestarting,
    });
  }
}
