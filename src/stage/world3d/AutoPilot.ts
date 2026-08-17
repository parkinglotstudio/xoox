/**
 * 자동 조종 — 거점 청록 위에 머물며 위협을 보고 쏜다.
 * 습격 중 WASD는 frozen. 이동은 nudgeToward만.
 */
import type { BlightUnit } from "./BlightWave";
import type { JourneyStage3D } from "./JourneyStage3D";
import type { PurifyGun } from "./PurifyGun";
import type { PurifyRaidConfig } from "./purifyRaidConfig";

export class AutoPilot {
  constructor(
    private readonly stage: JourneyStage3D,
    private readonly gun: PurifyGun,
    private readonly cfg: PurifyRaidConfig,
    private core: { x: number; z: number },
  ) {}

  setCore(x: number, z: number): void {
    this.core = { x, z };
  }

  tick(dt: number, units: BlightUnit[]): void {
    const me = this.stage.getPlayerWorld();
    const target = pickHuntTarget(units, me, this.core, this.cfg.gun_range_m);
    this.holdCore(dt, me, !!target);
    if (!target) {
      this.gun.setFiring(false);
      this.gun.clearAim();
      return;
    }
    this.stage.turnToward(target.x, target.z, dt);
    this.gun.setAim(target.x, target.z);
    const reach = Math.hypot(target.x - me.x, target.z - me.z);
    this.gun.setFiring(reach <= this.cfg.gun_range_m && this.gun.ammo >= 1);
  }

  private holdCore(dt: number, me: { x: number; z: number }, hasThreat: boolean): void {
    const dx = me.x - this.core.x;
    const dz = me.z - this.core.z;
    const dist = Math.hypot(dx, dz);
    const home = 1.7;
    if (dist > 2.6) {
      this.stage.nudgeToward(this.core.x, this.core.z, dt, 2.4);
      return;
    }
    if (!hasThreat || dist < 0.4) return;
    const nx = -dz / (dist || 1);
    const nz = dx / (dist || 1);
    this.stage.nudgeToward(this.core.x + nx * home, this.core.z + nz * home, dt, 1.6);
  }
}

export function pickHuntTarget(
  units: BlightUnit[],
  me: { x: number; z: number },
  core: { x: number; z: number },
  range: number,
): BlightUnit | null {
  if (!units.length) return null;
  const inRange = units.filter((u) => Math.hypot(u.x - me.x, u.z - me.z) <= range);
  const pool = inRange.length ? inRange : units;
  let best = pool[0];
  let bestScore = Infinity;
  for (const u of pool) {
    const toCore = Math.hypot(u.x - core.x, u.z - core.z);
    const toMe = Math.hypot(u.x - me.x, u.z - me.z);
    const score = (u.eating ? 0 : 80) + (u.is_boss ? -30 : 0) + toCore * 2 + toMe * 0.4;
    if (score < bestScore) {
      bestScore = score;
      best = u;
    }
  }
  return best;
}
