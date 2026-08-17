/**
 * 정화 유탄총 — 미사일 타입.
 * 누르고 있으면 시선 앞을 향해 곡선형 미사일을 쏜다.
 * 착탄 지점에 청록이 번진다.
 */
import type { JourneyStage3D } from "./JourneyStage3D";
import type { GroundPaint } from "./GroundPaint";
import type { PurifyRaidConfig } from "./purifyRaidConfig";
import { PurifyMissilePool, type MissileImpact } from "./PurifyMissile";

export type GunHit = MissileImpact;

export class PurifyGun {
  ammo: number;
  regenMult = 1;
  private firing = false;
  private cool = 0;
  private aim: { x: number; z: number } | null = null;
  private missiles: PurifyMissilePool;
  /** 기본 공격이 실제로 나갔을 때 — 수리검/콤보 추가타 */
  onLaunch: ((x: number, z: number) => void) | null = null;

  constructor(
    private readonly stage: JourneyStage3D,
    private readonly paint: GroundPaint,
    private cfg: PurifyRaidConfig,
  ) {
    this.ammo = cfg.gun_ammo_max;
    this.missiles = new PurifyMissilePool(stage);
  }

  applyConfig(cfg: PurifyRaidConfig): void {
    this.cfg = cfg;
    this.ammo = Math.min(this.ammo, cfg.gun_ammo_max);
  }

  setFiring(on: boolean): void {
    this.firing = on;
  }

  isFiring(): boolean {
    return this.firing;
  }

  /** 자동 조준점. 없으면 카메라 정면 바닥 */
  setAim(x: number, z: number): void {
    this.aim = { x, z };
  }

  clearAim(): void {
    this.aim = null;
  }

  /**
   * 발사 + 비행. 이번 틱에 떨어진 착탄점들.
   */
  tick(dt: number, onTeal: boolean): GunHit[] {
    if (onTeal) {
      this.ammo = Math.min(this.cfg.gun_ammo_max, this.ammo + this.cfg.gun_regen_on_teal * this.regenMult * dt);
    }
    this.cool = Math.max(0, this.cool - dt);
    if (this.firing && this.cool <= 0 && this.ammo >= 1) {
      if (this.tryLaunch()) {
        this.ammo -= 1;
        this.cool = 1 / Math.max(0.4, this.cfg.gun_ammo_per_sec);
      }
    }
    const hits = this.missiles.tick(dt);
    for (const h of hits) {
      this.paint.stamp(h.x, h.z, "teal", this.cfg.paint_overwrite);
    }
    return hits;
  }

  /** 스킬 추가 투사체 — 탄약 소모 없음 */
  launchAt(tx: number, tz: number, spreadDeg = 0): void {
    const me = this.stage.getPlayerWorld();
    const dx = tx - me.x;
    const dz = tz - me.z;
    const dist = Math.hypot(dx, dz);
    const range = this.cfg.gun_range_m;
    const nx = dist > 0.01 ? dx / dist : -Math.sin(me.yaw);
    const nz = dist > 0.01 ? dz / dist : -Math.cos(me.yaw);
    const reach = Math.min(Math.max(dist, 1.2), range);
    const jitter = Math.tan(((spreadDeg || 0) * Math.PI) / 180 / 2) * reach;
    const x = me.x + nx * reach + (Math.random() * 2 - 1) * jitter;
    const z = me.z + nz * reach + (Math.random() * 2 - 1) * jitter;
    this.fireTo(x, z, reach, range, nx, nz);
  }

  clear(): void {
    this.missiles.clear();
    this.cool = 0;
  }

  dispose(): void {
    this.missiles.dispose();
  }

  ratio(): number {
    return this.cfg.gun_ammo_max <= 0 ? 0 : this.ammo / this.cfg.gun_ammo_max;
  }

  private tryLaunch(): boolean {
    const aim = this.aim ?? this.stage.aimFloor();
    const me = this.stage.getPlayerWorld();
    const dx = aim.x - me.x;
    const dz = aim.z - me.z;
    const dist = Math.hypot(dx, dz);
    const range = this.cfg.gun_range_m;
    const nx = dist > 0.01 ? dx / dist : -Math.sin(me.yaw);
    const nz = dist > 0.01 ? dz / dist : -Math.cos(me.yaw);
    const reach = Math.min(Math.max(dist, 1.2), range);
    const jitter = Math.tan(((this.cfg.gun_spread_deg || 0) * Math.PI) / 180 / 2) * reach;
    const tx = me.x + nx * reach + (Math.random() * 2 - 1) * jitter;
    const tz = me.z + nz * reach + (Math.random() * 2 - 1) * jitter;
    this.fireTo(tx, tz, reach, range, nx, nz);
    this.onLaunch?.(tx, tz);
    return true;
  }

  private fireTo(tx: number, tz: number, reach: number, range: number, nx: number, nz: number): void {
    const me = this.stage.getPlayerWorld();
    const muzzle = 0.45;
    const arc = this.cfg.missile_arc_m * (0.45 + 0.55 * (reach / range));
    this.missiles.launch(
      { x: me.x + nx * muzzle, y: 0.85, z: me.z + nz * muzzle },
      { x: tx, z: tz },
      arc,
      this.cfg.missile_speed_mps,
    );
  }
}
