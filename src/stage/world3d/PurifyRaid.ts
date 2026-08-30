/**
 * 정화 습격 한 판 — 예고 → 웨이브 → 거점 게이지 → 승/패.
 *
 * 본편은 auto: 카메라·이동·사거리·발사가 자동. 스킬은 여정에서 얻은 것만.
 * 툴은 수동 발사로 손맛을 맞춘다.
 */
import * as THREE from "three";
import { AutoPilot } from "./AutoPilot";
import { bearingDeg } from "./CompassHud";
import { BlightDirector } from "./BlightDirector";
import { BlightWave } from "./BlightWave";
import { GroundPaint } from "./GroundPaint";
import type { JourneyStage3D } from "./JourneyStage3D";
import { THROW_FORWARD_DEG } from "./StoneThrow";
import { PurifyGun } from "./PurifyGun";
import type { PurifyRaidConfig } from "./purifyRaidConfig";
import { PURIFY_RAID_DEFAULTS } from "./purifyRaidConfig";
import { RaidBossRuntime } from "./RaidBossRuntime";
import { RaidSkillRuntime } from "./RaidSkillRuntime";
import { RaidVfx } from "./RaidVfx";
import { emptyRaidTables, type RaidTables } from "./raidTables";
import type { SkillEffectRow } from "../../types";

export type RaidPhase = "idle" | "warn" | "fight" | "won" | "lost";

export interface RaidHud {
  phase: RaidPhase;
  warnLeft: number;
  wave: number;
  waves: number;
  alive: number;
  core: number;
  tealPct: number;
  ammo: number;
  purified: number;
  firing: boolean;
}

export interface PurifyRaidHooks {
  onHud?: (hud: RaidHud) => void;
  onPhase?: (phase: RaidPhase) => void;
}

export type RaidMode = "raid" | "stillHunt";

export interface PurifyRaidOptions {
  /** true면 카메라·사거리·발사가 자동. 본편 기본. 툴은 끈다. */
  auto?: boolean;
  /** stillHunt = 제자리 리젠 · 찾아서 던지기. raid = 기존 웨이브 */
  mode?: RaidMode;
  learnedSkills?: string[];
  skillEffects?: SkillEffectRow[];
  tables?: RaidTables;
  tier?: string;
}

const STILL_HUNT = {
  count: 8,
  minR: 7,
  maxR: 20,
  regenSec: 1.05,
  rangeM: 10,
  walkMps: 2.8,
};

const CORE_R = 3.4;

export class PurifyRaid {
  private cfg: PurifyRaidConfig;
  private paint: GroundPaint;
  private gun: PurifyGun;
  private wave: BlightWave;
  private director: BlightDirector;
  private vfx: RaidVfx;
  private skills: RaidSkillRuntime | null = null;
  private boss: RaidBossRuntime;
  private pilot: AutoPilot | null = null;
  private phase: RaidPhase = "idle";
  private warnLeft = 0;
  private core = 0;
  private purified = 0;
  private coreX = 0;
  private coreZ = 0;
  private ring: THREE.Mesh;
  private bound = false;
  private auto = false;
  private mode: RaidMode = "raid";
  private tables: RaidTables;
  private tier = "NORMAL";
  private coreHitAcc = 0;
  private regenLeft = 0;
  private huntTarget = STILL_HUNT.count;
  private huntLock: { id: number } | null = null;

  constructor(
    private readonly stage: JourneyStage3D,
    private readonly hooks: PurifyRaidHooks = {},
    cfg: PurifyRaidConfig = { ...PURIFY_RAID_DEFAULTS },
    opts: PurifyRaidOptions = {},
  ) {
    this.cfg = cfg;
    this.auto = !!opts.auto;
    this.mode = opts.mode ?? "raid";
    this.tables = opts.tables ?? emptyRaidTables();
    this.tier = opts.tier || "NORMAL";
    const spawn = stage.getPlayerWorld();
    this.coreX = spawn.x;
    this.coreZ = spawn.z;
    this.paint = new GroundPaint(stage, cfg.paint_radius_m);
    this.gun = new PurifyGun(stage, this.paint, cfg);
    this.wave = new BlightWave(stage, this.paint, cfg, { x: this.coreX, z: this.coreZ });
    this.vfx = new RaidVfx(stage, this.tables);
    this.director = new BlightDirector(this.wave, this.tables);
    this.boss = new RaidBossRuntime(this.wave, this.tables, this.vfx);
    if (this.auto) {
      this.pilot = new AutoPilot(stage, this.gun, cfg, { x: this.coreX, z: this.coreZ });
      this.skills = new RaidSkillRuntime(
        this.gun,
        this.wave,
        this.tables,
        cfg,
        this.vfx,
        opts.learnedSkills ?? [],
        opts.skillEffects ?? [],
      );
    }
    this.ring = makeCoreRing();
    this.ring.position.set(this.coreX, 0.03, this.coreZ);
    stage.addOverlay(this.ring);
    this.bindTick(true);
  }

  applyConfig(cfg: PurifyRaidConfig): void {
    this.cfg = cfg;
    this.paint.setRadius(cfg.paint_radius_m);
    this.gun.applyConfig(cfg);
    this.wave.applyConfig(cfg);
    this.stage.applyStoneThrowConfig(cfg);
  }

  setFiring(on: boolean): void {
    this.gun.setFiring(on);
  }

  start(): void {
    this.resetState();
    const p = this.stage.getPlayerWorld();
    this.coreX = p.x;
    this.coreZ = p.z;
    this.ring.position.set(this.coreX, 0.03, this.coreZ);
    this.ring.visible = this.mode !== "stillHunt";
    this.wave.setCore(this.coreX, this.coreZ);
    this.pilot?.setCore(this.coreX, this.coreZ);
    this.stage.applyStoneThrowConfig(this.cfg);
    if (this.mode === "stillHunt") {
      this.stage.setFrozen(true);
      this.stage.setOnStoneLand((x, z) => this.onThrowLand(x, z));
      this.wave.scatterAround(STILL_HUNT.count, STILL_HUNT.minR, STILL_HUNT.maxR);
      this.regenLeft = 0;
      this.huntTarget = STILL_HUNT.count;
      this.huntLock = null;
      this.phase = "fight";
      this.hooks.onPhase?.("fight");
      this.emit();
      return;
    }
    this.paint.stamp(this.coreX, this.coreZ, "teal", 1);
    this.phase = "warn";
    this.warnLeft = this.cfg.warn_sec;
    this.hooks.onPhase?.("warn");
    this.emit();
  }

  stop(): void {
    this.stage.setOnStoneLand(null);
    this.stage.setFrozen(false);
    this.huntLock = null;
    this.wave.clear();
    this.phase = "idle";
    this.hooks.onPhase?.("idle");
    this.emit();
  }

  reset(): void {
    this.stage.setOnStoneLand(null);
    this.stage.setFrozen(false);
    this.huntLock = null;
    this.wave.clear();
    this.paint.clear();
    this.gun.ammo = this.cfg.gun_ammo_max;
    this.gun.clear();
    this.core = 0;
    this.purified = 0;
    this.regenLeft = 0;
    this.phase = "idle";
    this.hooks.onPhase?.("idle");
    this.emit();
  }

  getHud(): RaidHud {
    return this.snapshot();
  }

  paintSamples() {
    return this.paint.samples();
  }

  blightBearings(): { bearing: number; icon: string }[] {
    const me = this.stage.getPlayer();
    return this.wave.units.map((u) => {
      const p = this.stage.worldToPct(u.x, u.z);
      return { bearing: bearingDeg(me.xPct, me.yPct, p.xPct, p.yPct), icon: u.is_boss ? "♞" : "◉" };
    });
  }

  blightDots(): { xPct: number; yPct: number }[] {
    return this.wave.units.map((u) => this.stage.worldToPct(u.x, u.z));
  }

  corePct(): { xPct: number; yPct: number } {
    return this.stage.worldToPct(this.coreX, this.coreZ);
  }

  dispose(): void {
    this.bindTick(false);
    this.stage.setOnStoneLand(null);
    this.stage.setFrozen(false);
    this.gun.onLaunch = null;
    this.wave.dispose();
    this.paint.dispose();
    this.gun.dispose();
    this.vfx.dispose();
    this.stage.removeOverlay(this.ring);
    (this.ring.material as THREE.Material).dispose();
    this.ring.geometry.dispose();
  }

  private resetState(): void {
    this.wave.clear();
    this.paint.clear();
    this.gun.ammo = this.cfg.gun_ammo_max;
    this.gun.clear();
    this.core = 0;
    this.purified = 0;
  }

  private bindTick(on: boolean): void {
    if (on === this.bound) return;
    this.bound = on;
    this.stage.setOnTick(on ? (dt) => this.tick(dt) : null);
  }

  private tick(dt: number): void {
    this.vfx.tick(dt);
    if (this.mode === "stillHunt") {
      this.tickStillHunt(dt);
      return;
    }
    if (this.phase === "warn") {
      this.warnLeft -= dt;
      if (this.warnLeft <= 0) {
        this.phase = "fight";
        this.director.begin(this.tier);
        this.boss.begin(this.tier, this.coreX, this.coreZ);
        this.skills?.onFightStart();
        this.hooks.onPhase?.("fight");
      }
      this.emit();
      return;
    }
    if (this.phase !== "fight") {
      this.gun.setFiring(false);
      this.gun.clearAim();
      this.emit();
      return;
    }

    this.director.tick(dt);
    this.boss.tick(dt, !this.director.wavesComplete);
    this.wave.tick(dt);

    const me = this.stage.getPlayerWorld();
    if (this.auto) {
      this.pilot?.tick(dt, this.wave.units);
      this.skills?.tick(dt, me, { x: this.coreX, z: this.coreZ }, this.core);
    }

    const onTeal = this.paint.at(me.x, me.z) === "teal";
    const hits = this.gun.tick(dt, onTeal);
    const splashR = this.cfg.paint_radius_m * 1.15;
    for (const h of hits) {
      this.purified += this.wave.hitSplash(h.x, h.z, splashR);
      this.vfx.play("hit", h.x, h.z);
      for (const d of this.wave.lastDeaths) this.vfx.play("death", d.x, d.z);
    }

    const eaters = this.wave.eatingWeight();
    if (eaters > 0) {
      const eat = this.cfg.core_eat_per_sec * eaters * (this.skills?.coreEatMult ?? 1) * dt;
      this.core = Math.min(1, this.core + eat);
      this.coreHitAcc += dt;
      if (this.coreHitAcc > 0.4) {
        this.coreHitAcc = 0;
        this.vfx.play("core_hit", this.coreX, this.coreZ);
      }
    }
    const teal = this.paint.tealRatioNear(this.coreX, this.coreZ, CORE_R) * 100;
    const winByPaint = teal >= this.cfg.win_teal_pct;
    const winByWaves = this.director.done && !this.boss.alive();
    if (this.core >= 1) {
      this.phase = "lost";
      this.gun.setFiring(false);
      this.hooks.onPhase?.("lost");
    } else if (winByWaves || winByPaint) {
      this.phase = "won";
      this.gun.setFiring(false);
      this.wave.clear();
      this.hooks.onPhase?.("won");
    }
    this.emit();
  }

  private tickStillHunt(dt: number): void {
    if (this.phase !== "fight") {
      this.emit();
      return;
    }
    this.wave.tick(dt);
    if (this.wave.aliveCount < this.huntTarget) {
      this.regenLeft -= dt;
      if (this.regenLeft <= 0) {
        const pos = this.wave.pickScatterPos(STILL_HUNT.minR, STILL_HUNT.maxR);
        this.wave.spawnStationaryAt(pos.x, pos.z);
        this.regenLeft = STILL_HUNT.regenSec;
      }
    } else {
      this.regenLeft = STILL_HUNT.regenSec;
    }
    this.autoHunt(dt);
    this.emit();
  }

  private autoHunt(dt: number): void {
    if (this.stage.isThrowBusy()) return;
    const units = this.wave.units;
    if (!units.length) {
      this.huntLock = null;
      return;
    }
    const me = this.stage.getPlayerWorld();
    if (!this.huntLock || !units.some((u) => u.id === this.huntLock?.id)) {
      const next = nearestBlight(units, me.x, me.z);
      if (!next) return;
      this.huntLock = { id: next.id };
    }
    const lock = this.huntLock;
    const target = lock ? units.find((u) => u.id === lock.id) : undefined;
    if (!lock || !target) return;
    this.stage.turnToward(target.x, target.z, dt);
    const reach = Math.max(0.5, this.cfg.gun_range_m || STILL_HUNT.rangeM);
    const dist = Math.hypot(target.x - me.x, target.z - me.z);
    if (dist > reach) {
      this.stage.nudgeToward(target.x, target.z, dt, STILL_HUNT.walkMps);
      return;
    }
    if (!this.stage.inForwardCone(target.x, target.z, THROW_FORWARD_DEG)) return;
    if (!this.stage.isThrowing()) this.stage.throwAt(target.x, target.z);
  }

  private onThrowLand(x: number, z: number): void {
    if (this.mode !== "stillHunt" || this.phase !== "fight") return;
    const r = Math.max(0.4, this.cfg.paint_radius_m);
    const n = this.wave.hitSplash(x, z, r, 1, { stamp: false });
    this.purified += n;
    for (const d of this.wave.lastDeaths) this.vfx.play("death", d.x, d.z);
    this.huntLock = null;
    this.regenLeft = STILL_HUNT.regenSec;
    this.emit();
  }

  private emit(): void {
    this.hooks.onHud?.(this.snapshot());
  }

  private snapshot(): RaidHud {
    return {
      phase: this.phase,
      warnLeft: Math.max(0, this.warnLeft),
      wave: this.mode === "stillHunt" ? 0 : this.director.currentWave,
      waves: this.mode === "stillHunt" ? 0 : this.director.totalWaves,
      alive: this.wave.units.length,
      core: this.core,
      tealPct: this.paint.tealRatioNear(this.coreX, this.coreZ, CORE_R) * 100,
      ammo: this.gun.ratio(),
      purified: this.purified,
      firing: this.gun.isFiring(),
    };
  }
}

function nearestBlight(
  units: { id: number; x: number; z: number }[],
  x: number,
  z: number,
): { id: number; x: number; z: number } | null {
  let best: { id: number; x: number; z: number } | null = null;
  let bestD = Infinity;
  for (const u of units) {
    const d = Math.hypot(u.x - x, u.z - z);
    if (d >= bestD) continue;
    bestD = d;
    best = u;
  }
  return best;
}

function makeCoreRing(): THREE.Mesh {
  const geo = new THREE.RingGeometry(1.15, 1.45, 40);
  const mat = new THREE.MeshBasicMaterial({
    color: 0x2de0d0,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
    depthWrite: false,
    fog: true,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}
