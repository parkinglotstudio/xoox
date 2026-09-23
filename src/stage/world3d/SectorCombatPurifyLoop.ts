/**
 * 들판 combat_loop — 툴 연출(캐스팅·띠·벌레·원흉)을 **기존 본편 규칙** 위에 얹음.
 * - 기본 공격: 1차 정화제 던지기(곡선) → 이후 총쏘기2(직선)
 * - 스킬: 보상/이벤트 3택1 → learnedSkills → huntTune (사거리·이속·스플래시)
 * - Space / multi·boom·chain 수동 슬롯 없음 (그건 프로토 툴 전용)
 */
import * as THREE from "three";
import { GroundPaint } from "./GroundPaint";
import type { JourneyStage3D } from "./JourneyStage3D";
import { loadPurifyRaidConfig, type PurifyRaidConfig } from "./purifyRaidConfig";
import { RaidVfx } from "./RaidVfx";
import { loadRaidTables, emptyRaidTables } from "./raidTables";
import { THROW_FORWARD_DEG } from "./StoneThrow";
import { loadPurifySkillBalance, type PurifySkillBalance, type TintStep } from "./purifySkillBalance";
import { CombatPurifyHud } from "./CombatPurifyHud";
import { BurnRim } from "./purify/BurnRim";
import { CulpritPresence } from "./purify/CulpritPresence";
import { SandBug } from "./purify/SandBug";
import { SoftBlightOctet } from "./purify/SoftBlightOctet";
import type { SectorLoopHooks } from "./SectorPurifyLoop";

type CombatPhase =
  | "gather"
  | "casting"
  | "purify"
  | "bugs"
  | "culprit"
  | "need_cast"
  | "done"
  | "fail";

const STOP_DIRS: { name: string; ang: number }[] = [
  { name: "동", ang: 0 },
  { name: "서", ang: Math.PI },
  { name: "남", ang: Math.PI / 2 },
];

interface AmmoPickup {
  mesh: THREE.Mesh;
  x: number;
  z: number;
  taken: boolean;
}

function liveTune(hooks: SectorLoopHooks) {
  return (
    hooks.huntTune?.() ?? {
      rangeAdd: 0,
      speedMul: 1,
      splashMul: 1,
      eatMul: 1,
      invadeMul: 1,
      missileMul: 1,
    }
  );
}

export class SectorCombatPurifyLoop {
  private bal!: PurifySkillBalance;
  private raidCfg!: PurifyRaidConfig;
  private paint!: GroundPaint;
  private vfx!: RaidVfx;

  private phase: CombatPhase = "gather";
  private core = { x: 0, z: 0 };
  private stopGate = { x: 0, z: 0 };
  private stopDirName = "동";
  private circleR = 12;
  private castingStep: TintStep = 1;
  private castPct = 0;
  private waveIn = 0;
  private waveStopped = false;
  private shrinkActive = false;
  private gaugeMax = 6;
  private gaugeLeft = 6;
  private hud: CombatPurifyHud | null = null;
  private bugs: SandBug[] = [];
  private bugSpawned = 0;
  private bugAcc = 0;
  private bugWavesDone = 0;
  private culprit: CulpritPresence | null = null;
  private culpritHp = 20;
  private blightDots: SoftBlightOctet | null = null;
  private burnRim: BurnRim | null = null;
  private pickups: AmmoPickup[] = [];
  private pickupGeo = new THREE.SphereGeometry(0.35, 10, 10);
  private bound = false;
  private running = false;
  private talking = false;
  private failed = false;
  private resolveWait: (() => void) | null = null;
  private waitPred: (() => boolean) | null = null;
  private huntLock: { kind: "stop" | "bug" | "culprit"; bug?: SandBug } | null = null;

  constructor(
    private readonly stage: JourneyStage3D,
    private readonly hooks: SectorLoopHooks,
    private readonly areaId: string,
  ) {}

  async run(): Promise<{ won: boolean }> {
    this.bal = await loadPurifySkillBalance();
    this.raidCfg = await loadPurifyRaidConfig();
    this.paint = new GroundPaint(this.stage, this.raidCfg.paint_radius_m);
    const tables = await loadRaidTables().catch(() => emptyRaidTables());
    this.vfx = new RaidVfx(this.stage, tables);

    const me = this.stage.getPlayerWorld();
    this.core = { x: me.x, z: me.z };
    this.circleR = this.bal.circleR;
    this.setStopDir(0);
    this.gaugeMax = this.bal.stopHits;
    this.gaugeLeft = this.bal.stopHits;
    this.culpritHp = this.bal.culpritHp;

    const have = this.readAmmo();
    if (have < this.bal.ammoStart) {
      this.hooks.addCombatAmmo?.(this.bal.ammoStart - have);
    }

    if (this.hooks.combatHudHost) {
      this.hud = new CombatPurifyHud(this.hooks.combatHudHost);
    }

    this.stage.setPurifyColorAmt(0);
    this.stage.setPurifyFoci([{ x: this.core.x, z: this.core.z, r: 0 }]);
    this.stage.applyStoneThrowConfig(this.raidCfg);
    this.stage.setOnStoneLand((x, z) => this.onLand(x, z));
    this.stage.setFrozen(false);
    this.stage.setInputEnabled(true);
    this.bind(true);
    this.running = true;

    try {
      await this.filler("arrive");
      await this.filler("ammo_need");
      this.spawnPickups();
      this.hooks.onHud?.(`발사체 ${this.readAmmo()} · 모은 뒤 1차 정화`);
      await this.filler("ammo_got");

      await this.filler("cast1_start");
      await this.runCastWave(1, 0);
      if (this.failed) {
        await this.filler("fail_pollute");
        return { won: false };
      }

      await this.filler("bugs_clear");
      await this.filler("gather_again");
      if (this.readAmmo() < this.bal.minAmmoHint) await this.filler("ammo_low_rush");
      this.spawnPickups();
      await this.filler("cast2_start");
      await this.runCastWave(2, 1);
      if (this.failed) {
        await this.filler("fail_pollute");
        return { won: false };
      }

      await this.filler("bugs_clear");
      await this.filler("gather_again");
      if (this.readAmmo() < this.bal.minAmmoHint) await this.filler("ammo_low_rush");
      this.spawnPickups();
      await this.filler("cast3_start");
      await this.runCastWave(3, 2);
      if (this.failed) {
        await this.filler("fail_pollute");
        return { won: false };
      }

      await this.filler("bugs_clear");
      await this.filler("culprit_in");
      await this.runCulprit();
      await this.filler("culprit_down");
      await this.filler("need_final_cast");
      await this.runFinalCast();
      await this.filler("done");
      this.hooks.onHud?.("완료");
      return { won: true };
    } finally {
      this.running = false;
      this.bind(false);
      this.stage.setOnStoneLand(null);
      this.hud?.dispose();
      this.hud = null;
      this.cleanup();
      this.stage.setFrozen(true);
    }
  }

  private readAmmo(): number {
    return this.hooks.getCombatAmmo?.() ?? 0;
  }

  private setStopDir(waveIndex: number): void {
    const d = STOP_DIRS[Math.min(waveIndex, STOP_DIRS.length - 1)]!;
    this.stopDirName = d.name;
    this.stopGate = {
      x: this.core.x + Math.cos(d.ang) * this.circleR * 0.98,
      z: this.core.z + Math.sin(d.ang) * this.circleR * 0.98,
    };
  }

  private async filler(key: string): Promise<void> {
    const id = this.bal.dialogues[key];
    if (!id) return;
    this.talking = true;
    try {
      await this.hooks.onFiller(id);
    } catch {
      /* ignore */
    } finally {
      this.talking = false;
    }
  }

  private async runCastWave(step: TintStep, dirIndex: number): Promise<void> {
    this.castingStep = step;
    this.castPct = 0;
    this.phase = "casting";
    this.setStopDir(dirIndex);
    this.hooks.onHud?.(`${step}차 정화 시도 중`);
    this.hooks.onBeat?.(step === 1 ? "tint1" : "tint2");
    await this.waitUntil(() => this.castPct >= 1);
    this.phase = "purify";

    this.gaugeLeft = this.bal.stopHits;
    this.gaugeMax = this.bal.stopHits;
    this.waveIn = 0;
    this.waveStopped = false;
    this.shrinkActive = false;
    this.clearBugs();
    await this.expandAfterCast(step);
    this.setStopDir(dirIndex);
    this.shrinkActive = true;
    this.spawnPickups();
    await this.filler(step === 1 ? "cast1_done" : step === 2 ? "cast2_done" : "cast3_done");
    await this.filler("band_warn");
    this.hooks.onHud?.(`오염 · ${this.stopDirName}쪽 멈춤 · 탄 ${this.readAmmo()}`);
    void this.stage.walkTo(...this.pctNearStop());

    await this.waitUntil(() => this.phase === "bugs" || this.failed);
    if (this.failed) return;

    await this.filler("band_stop");
    await this.filler("bugs_in");
    this.hooks.onHud?.(`벌레 · 탄 ${this.readAmmo()}`);
    await this.waitUntil(() => this.phase === "gather" || this.failed);
  }

  private async runCulprit(): Promise<void> {
    this.clearBugs();
    this.shrinkActive = false;
    this.phase = "culprit";
    this.culpritHp = this.bal.culpritHp;
    this.spawnCulprit();
    this.hooks.onHud?.(`원흉 · 탄 ${this.readAmmo()}`);
    this.hooks.onBeat?.("king");
    this.culprit?.playRise();
    this.culprit?.playBeforePurify();
    await sleep(900);
    this.culprit?.playGather();
    await this.waitUntil(() => this.phase === "need_cast" || this.failed);
  }

  private async runFinalCast(): Promise<void> {
    this.castingStep = 3;
    this.castPct = 0;
    this.phase = "casting";
    this.hooks.onHud?.("최종 정화 시도 중");
    await this.waitUntil(() => this.castPct >= 1);
    await this.expandAfterCast(3);
    this.stage.setPurifyColorAmt(1);
    this.phase = "done";
    this.hooks.onBeat?.("done");
  }

  private bind(on: boolean): void {
    if (on === this.bound) return;
    this.bound = on;
    this.stage.setOnTick(on ? (dt) => this.tick(dt) : null);
  }

  private tick(dt: number): void {
    if (!this.running) return;
    this.vfx.tick(dt);
    this.blightDots?.tick(dt);
    this.burnRim?.tick(dt);
    this.culprit?.tick(dt);
    for (const b of this.bugs) if (!b.dead) b.tick(dt);
    this.tickPickups();

    if (this.talking) {
      this.emitHud();
      return;
    }

    if (this.phase === "casting") {
      this.castPct = Math.min(1, this.castPct + dt / this.bal.castSec);
      if (this.castPct >= 1) this.notifyWait();
      this.emitHud();
      return;
    }

    if (this.phase === "purify" && this.shrinkActive && !this.waveStopped) {
      this.waveIn = Math.min(1, this.waveIn + dt / this.bal.shrinkSec);
      this.applyCircleRadius(Math.max(0.4, this.bal.circleR * (1 - this.waveIn)));
      if (this.waveIn >= 1) {
        this.failed = true;
        this.phase = "fail";
        this.shrinkActive = false;
        this.notifyWait();
      }
    }

    if (this.phase === "bugs") {
      this.bugAcc += dt;
      while (this.bugSpawned < this.bal.bugCount && this.bugAcc >= 0.85) {
        this.bugAcc -= 0.85;
        this.spawnOneBug();
      }
      this.moveBugs(dt);
      this.checkBugsCleared();
    }

    this.autoHunt(dt);
    if (this.waitPred?.()) this.notifyWait();
    this.emitHud();
  }

  /** 기존 섹터와 동일: 자동 조준·자동 투척 */
  private autoHunt(dt: number): void {
    if (this.talking) return;
    if (this.phase !== "purify" && this.phase !== "bugs" && this.phase !== "culprit") return;
    if (this.phase === "purify" && this.waveStopped) return;
    if (this.stage.isThrowBusy()) return;

    const target = this.pickAutoTarget();
    if (!target) {
      this.huntLock = null;
      return;
    }

    this.stage.turnToward(target.x, target.z, dt);
    const tune = liveTune(this.hooks);
    const reach = Math.max(0.5, this.raidCfg.gun_range_m + tune.rangeAdd);
    const me = this.stage.getPlayerWorld();
    const dist = Math.hypot(target.x - me.x, target.z - me.z);
    if (dist > reach) {
      this.stage.nudgeToward(target.x, target.z, dt, 2.8 * tune.speedMul);
      return;
    }
    if (!this.stage.inForwardCone(target.x, target.z, THROW_FORWARD_DEG)) return;
    if (this.stage.isThrowing()) return;

    const mag: "adsorb" | "culprit" = this.phase === "culprit" ? "culprit" : "adsorb";
    const spent = this.hooks.onThrowSpend
      ? this.hooks.onThrowSpend("adsorb")
      : this.readAmmo() > 0;
    if (!spent) {
      this.hooks.onHud?.(mag === "culprit" ? "정화제가 모자라" : "발사체가 없다 · 청록 구슬을 모아");
      return;
    }

    this.stage.applyStoneThrowConfig({
      ...this.raidCfg,
      paint_radius_m: this.raidCfg.paint_radius_m * tune.splashMul,
    });
    const useGun = this.phase === "bugs" || this.phase === "culprit";
    if (useGun) this.stage.shootAt(target.x, target.z);
    else this.stage.throwAt(target.x, target.z);
  }

  private pickAutoTarget(): { x: number; z: number } | null {
    if (this.phase === "purify" && this.shrinkActive && !this.waveStopped) {
      this.huntLock = { kind: "stop" };
      return { ...this.stopGate };
    }
    if (this.phase === "culprit") {
      this.huntLock = { kind: "culprit" };
      return { ...this.core };
    }
    if (this.phase === "bugs") {
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
      if (!best) return null;
      this.huntLock = { kind: "bug", bug: best };
      return { x: best.x, z: best.z };
    }
    return null;
  }

  private onLand(x: number, z: number): void {
    if (!this.running) return;
    const tune = liveTune(this.hooks);
    const r = Math.max(0.4, this.raidCfg.paint_radius_m * tune.splashMul);
    this.applyImpact(x, z, 1, r);
    this.huntLock = null;
  }

  private applyImpact(x: number, z: number, dmg: number, splash: number): void {
    if (this.phase === "purify" && this.shrinkActive && !this.waveStopped) {
      if (Math.hypot(x - this.stopGate.x, z - this.stopGate.z) <= Math.max(4.2, splash)) {
        this.gaugeLeft = Math.max(0, this.gaugeLeft - dmg);
        this.vfx.play("skill_spread", this.stopGate.x, this.stopGate.z);
        if (this.gaugeLeft <= 0) {
          this.waveStopped = true;
          this.shrinkActive = false;
          this.phase = "bugs";
          this.bugAcc = 0;
          this.notifyWait();
        }
      }
    }

    for (const b of this.bugs) {
      if (b.dead) continue;
      const d = Math.hypot(b.x - x, b.z - z);
      if (d <= Math.max(4.2, splash)) {
        b.hp -= dmg;
        if (b.hp <= 0) {
          b.hitPurify();
          this.vfx.playReleaseBurst(b.x, b.z, "bug");
          window.setTimeout(() => {
            this.stage.removeOverlay(b.group);
            b.dispose();
          }, 400);
        }
      }
    }
    this.checkBugsCleared();

    if (this.phase === "culprit" && this.culprit) {
      if (Math.hypot(x - this.core.x, z - this.core.z) <= Math.max(7, splash + 2)) {
        this.culpritHp = Math.max(0, this.culpritHp - dmg);
        this.culprit.purifyTo = 1 - this.culpritHp / this.bal.culpritHp;
        this.vfx.play("skill_spread", this.core.x, this.core.z);
        if (this.culpritHp <= 0) {
          this.culprit.hitPurify();
          this.vfx.playReleaseBurst(this.core.x, this.core.z, "culprit");
          this.phase = "need_cast";
          this.notifyWait();
        }
      }
    }
  }

  private checkBugsCleared(): void {
    if (this.phase !== "bugs") return;
    if (this.bugSpawned < this.bal.bugCount) return;
    if (!this.bugs.every((b) => b.dead)) return;
    this.bugWavesDone += 1;
    this.vfx.playReleaseBurst(this.core.x, this.core.z, "wave");
    this.phase = "gather";
    this.notifyWait();
  }

  private async expandAfterCast(step: TintStep): Promise<void> {
    this.stage.setPurifyColorAmt(step === 1 ? 0.22 : step === 2 ? 0.55 : 0.85);
    this.clearRim();
    this.burnRim = new BurnRim(step);
    this.burnRim.setWorld(this.core.x, this.core.z, 0.8);
    this.stage.addOverlay(this.burnRim.mesh);
    this.blightDots = new SoftBlightOctet(step);
    this.blightDots.setOnCircle(this.core.x, this.core.z, 0.8);
    this.stage.addOverlay(this.blightDots.group);
    const t0 = performance.now();
    await new Promise<void>((resolve) => {
      const tick = () => {
        const u = Math.min(1, (performance.now() - t0) / 1400);
        this.applyCircleRadius(0.8 + (this.bal.circleR - 0.8) * u);
        if (u < 1) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
    this.applyCircleRadius(this.bal.circleR);
  }

  private applyCircleRadius(r: number): void {
    this.circleR = Math.max(0.4, r);
    const d = STOP_DIRS.find((x) => x.name === this.stopDirName) ?? STOP_DIRS[0]!;
    this.stopGate = {
      x: this.core.x + Math.cos(d.ang) * this.circleR * 0.98,
      z: this.core.z + Math.sin(d.ang) * this.circleR * 0.98,
    };
    this.stage.setPurifyFoci([{ x: this.core.x, z: this.core.z, r: this.circleR }]);
    this.blightDots?.setOnCircle(this.core.x, this.core.z, this.circleR);
    this.burnRim?.setWorld(this.core.x, this.core.z, this.circleR);
    this.burnRim?.setIntensity(1.05 + this.waveIn * 0.4);
  }

  private spawnOneBug(): void {
    const slot = this.bugSpawned % this.bal.bugCount;
    const ang = (slot / this.bal.bugCount) * Math.PI * 2;
    const r = Math.max(5, this.circleR) * 0.96;
    const x = this.core.x + Math.cos(ang) * r;
    const z = this.core.z + Math.sin(ang) * r;
    const bug = new SandBug(x, z, this.bal.bugHp);
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
      b.setWorld(b.x + (dx / d) * 0.09 * dt, b.z + (dz / d) * 0.09 * dt);
    }
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
    const p = new CulpritPresence({
      scale: this.bal.culpritScale,
      count: this.bal.culpritCount,
      size: this.bal.culpritSize,
    });
    p.setWorld(this.core.x, this.core.z);
    this.stage.addOverlay(p.group);
    this.culprit = p;
  }

  private clearCulprit(): void {
    if (!this.culprit) return;
    this.stage.removeOverlay(this.culprit.group);
    this.culprit.dispose();
    this.culprit = null;
  }

  private spawnPickups(): void {
    this.clearPickups();
    for (let i = 0; i < this.bal.pickupCount; i++) {
      const ang = (i / this.bal.pickupCount) * Math.PI * 2 + 0.4;
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
      this.stage.addOverlay(mesh);
      this.pickups.push({ mesh, x, z, taken: false });
    }
  }

  private tickPickups(): void {
    const me = this.stage.getPlayerWorld();
    for (const p of this.pickups) {
      if (p.taken) continue;
      p.mesh.rotation.y += 0.04;
      if (Math.hypot(me.x - p.x, me.z - p.z) < 1.6) {
        p.taken = true;
        this.hooks.addCombatAmmo?.(this.bal.pickupGrant);
        this.stage.removeOverlay(p.mesh);
        (p.mesh.material as THREE.Material).dispose();
        this.hooks.onHud?.(`발사체 +${this.bal.pickupGrant} · ${this.readAmmo()}`);
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

  private clearRim(): void {
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

  private cleanup(): void {
    this.clearRim();
    this.clearBugs();
    this.clearCulprit();
    this.clearPickups();
    this.vfx.dispose();
    this.paint.dispose();
    this.pickupGeo.dispose();
    this.stage.setPurifyFoci([]);
    this.stage.clearPurifyWaves();
  }

  private pctNearStop(): [number, number] {
    const dx = this.core.x - this.stopGate.x;
    const dz = this.core.z - this.stopGate.z;
    const len = Math.hypot(dx, dz) || 1;
    const x = this.stopGate.x + (dx / len) * 5.5;
    const z = this.stopGate.z + (dz / len) * 5.5;
    const p = this.stage.worldToPctPublic(x, z);
    return [p.xPct, p.yPct];
  }

  private emitHud(): void {
    const ammo = this.readAmmo();
    const urgency: 0 | 1 | 2 =
      this.phase === "purify" && !this.waveStopped
        ? this.waveIn >= 0.75
          ? 2
          : this.waveIn >= 0.5
            ? 1
            : 0
        : 0;
    const shrinkLeft = Math.max(0, (1 - this.waveIn) * this.bal.shrinkSec);
    const bugsAlive = this.bugs.filter((b) => !b.dead).length;

    let phaseLabel = "—";
    if (this.phase === "casting") phaseLabel = `정화 시도 ${Math.round(this.castPct * 100)}%`;
    else if (this.phase === "purify")
      phaseLabel = this.waveStopped
        ? `벌레 ${bugsAlive}/${this.bal.bugCount}`
        : `오염 ${Math.round(this.waveIn * 100)}% · ${this.stopDirName} 멈춤`;
    else if (this.phase === "bugs") phaseLabel = `벌레 ${bugsAlive}/${this.bal.bugCount}`;
    else if (this.phase === "culprit") phaseLabel = `원흉 ${this.culpritHp}/${this.bal.culpritHp}`;
    else if (this.phase === "gather") phaseLabel = `모으기 · 탄 ${ammo}`;
    else if (this.phase === "need_cast") phaseLabel = "최종 캐스팅";
    else if (this.phase === "done") phaseLabel = "클리어";

    this.hooks.onHud?.(phaseLabel);
    this.hud?.apply({
      phaseLabel,
      ammo,
      urgency,
      showCast: this.phase === "casting",
      castPct: this.castPct,
      showPollute: this.phase === "purify" && !this.waveStopped,
      pollutionPct: this.waveIn,
      shrinkLeftSec: shrinkLeft,
      showCombat:
        (this.phase === "purify" && !this.waveStopped) ||
        this.phase === "bugs" ||
        this.phase === "culprit",
      stopLeft: this.gaugeLeft,
      stopMax: this.gaugeMax,
      stopDir: this.stopDirName,
      bugsAlive: this.phase === "bugs" ? bugsAlive : undefined,
      bugsTotal: this.phase === "bugs" ? this.bal.bugCount : undefined,
      culpritHp: this.phase === "culprit" ? this.culpritHp : undefined,
      culpritMax: this.phase === "culprit" ? this.bal.culpritHp : undefined,
    });
  }

  private waitUntil(pred: () => boolean): Promise<void> {
    if (pred()) return Promise.resolve();
    return new Promise((resolve) => {
      this.waitPred = pred;
      this.resolveWait = resolve;
    });
  }

  private notifyWait(): void {
    if (this.waitPred && !this.waitPred()) return;
    const r = this.resolveWait;
    this.resolveWait = null;
    this.waitPred = null;
    r?.();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
