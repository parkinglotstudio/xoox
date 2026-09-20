/**
 * AREA 파도 뒤 남은 스케치 오브 — 7m 기립 · 5m 칼라 총 칠.
 * 약 10발에 아래→위로 색이 차오른다. 전투 습격과 같은 PurifyGun.
 */
import { GroundPaint } from "./GroundPaint";
import type { JourneyStage3D } from "./JourneyStage3D";
import { PurifyGun } from "./PurifyGun";
import { loadPurifyRaidConfig, PURIFY_RAID_DEFAULTS } from "./purifyRaidConfig";

const RISE_M = 7;
const SHOOT_M = 5;
const HIT_R = 2.4;

export class ResidualColorHunt {
  private paint: GroundPaint | null = null;
  private gun: PurifyGun | null = null;
  private active = false;
  private autoId: string | null = null;
  private doneResolve: (() => void) | null = null;
  private onColored: ((propId: string) => void) | null = null;
  private onNeedAnim: ((code: string | null) => void) | null = null;
  private firingNeed = false;
  private filterIds: Set<string> | null = null;

  constructor(private readonly stage: JourneyStage3D) {}

  async ensureReady(): Promise<void> {
    if (this.gun) return;
    const cfg = { ...(await loadPurifyRaidConfig().catch(() => ({ ...PURIFY_RAID_DEFAULTS }))) };
    cfg.gun_range_m = Math.max(cfg.gun_range_m, 8);
    // 잔여 1개 ≈ 10발 — 연사 간격을 조금 두어 차오름이 보이게
    cfg.gun_ammo_per_sec = Math.min(cfg.gun_ammo_per_sec, 3.2);
    cfg.gun_ammo_max = Math.max(cfg.gun_ammo_max, 40);
    this.paint = new GroundPaint(this.stage, cfg.paint_radius_m);
    this.gun = new PurifyGun(this.stage, this.paint, cfg);
    this.gun.ammo = cfg.gun_ammo_max;
  }

  setOnColored(cb: ((propId: string) => void) | null): void {
    this.onColored = cb;
  }

  /** 002 조준·발사 시트가 없을 때 머리 위 표시 */
  setOnNeedAnim(cb: ((code: string | null) => void) | null): void {
    this.onNeedAnim = cb;
  }

  /** 수동·자동 사냥 켜기 (AREA 이후) */
  start(): void {
    this.active = true;
  }

  stop(): void {
    this.active = false;
    this.autoId = null;
    this.setFiringNeed(false);
    this.gun?.setFiring(false);
    this.gun?.clearAim();
    if (this.doneResolve) {
      this.doneResolve();
      this.doneResolve = null;
    }
  }

  isActive(): boolean {
    return this.active;
  }

  /**
   * 남은 타깃을 순서대로: 5m까지 걷기 → 조준 사격(≈10발) → 다음.
   * filterIds가 있으면 그 id만.
   */
  async runAutoClear(filterIds?: string[] | null): Promise<void> {
    await this.ensureReady();
    this.active = true;
    this.filterIds = filterIds?.length ? new Set(filterIds) : null;
    if (this.residualLeft() <= 0) {
      this.active = false;
      this.filterIds = null;
      return;
    }
    return new Promise((resolve) => {
      this.doneResolve = resolve;
      void this.stepAuto();
    });
  }

  residualLeft(): number {
    return this.listPending().length;
  }

  private listPending(): { id: string; wx: number; wz: number; pending: boolean }[] {
    return this.stage.listResidualProps().filter((p) => {
      if (!p.pending) return false;
      if (this.filterIds && !this.filterIds.has(p.id)) return false;
      return true;
    });
  }

  private async stepAuto(): Promise<void> {
    const pending = this.listPending();
    if (!pending.length) {
      this.gun?.setFiring(false);
      this.setFiringNeed(false);
      this.active = false;
      this.filterIds = null;
      const r = this.doneResolve;
      this.doneResolve = null;
      r?.();
      return;
    }
    const t = pending.sort(
      (a, b) =>
        Math.hypot(a.wx - this.stage.getPlayerWorld().x, a.wz - this.stage.getPlayerWorld().z) -
        Math.hypot(b.wx - this.stage.getPlayerWorld().x, b.wz - this.stage.getPlayerWorld().z),
    )[0]!;
    this.autoId = t.id;
    const me = this.stage.getPlayerWorld();
    const dx = t.wx - me.x;
    const dz = t.wz - me.z;
    const dist = Math.hypot(dx, dz) || 1;
    const standX = t.wx - (dx / dist) * SHOOT_M;
    const standZ = t.wz - (dz / dist) * SHOOT_M;
    const pct = this.stage.worldToPctPublic(standX, standZ);
    await this.stage.walkTo(pct.xPct, pct.yPct);
    if (!this.active) return;
    if (this.gun) this.gun.ammo = Math.max(this.gun.ammo, 24);
    this.gun?.setAim(t.wx, t.wz);
    this.gun?.setFiring(true);
    this.setFiringNeed(true);
  }

  tick(dt: number): void {
    if (!this.active || !this.gun) return;
    const me = this.stage.getPlayerWorld();

    for (const p of this.listPending()) {
      const d = Math.hypot(p.wx - me.x, p.wz - me.z);
      if (d <= RISE_M) this.stage.setResidualRising(p.id, true);
    }

    const manual = this.stage.isShooting();
    const auto = this.autoId != null;
    if (manual || auto) {
      const aim = this.pickAim(me.x, me.z, me.yaw);
      if (aim) {
        this.gun.setAim(aim.wx, aim.wz);
        this.gun.setFiring(true);
        this.setFiringNeed(true);
      } else if (!auto) {
        this.gun.clearAim();
        if (!manual) {
          this.gun.setFiring(false);
          this.setFiringNeed(false);
        }
      }
    } else if (!auto) {
      this.gun.setFiring(false);
      this.gun.clearAim();
      this.setFiringNeed(false);
    }

    const hits = this.gun.tick(dt, false);
    for (const h of hits) {
      this.stage.shockAmbientCloud(h.x, h.z);
      for (const p of this.listPending()) {
        if (Math.hypot(p.wx - h.x, p.wz - h.z) > HIT_R) continue;
        const done = this.stage.hitResidualProp(p.id);
        if (!done) continue;
        this.onColored?.(p.id);
        if (this.autoId === p.id) {
          this.autoId = null;
          this.gun.setFiring(false);
          this.setFiringNeed(false);
          void this.stepAuto();
        }
      }
    }

    if (this.doneResolve && this.residualLeft() <= 0) {
      this.gun.setFiring(false);
      this.setFiringNeed(false);
      this.active = false;
      this.filterIds = null;
      const r = this.doneResolve;
      this.doneResolve = null;
      r();
    }
  }

  private setFiringNeed(on: boolean): void {
    if (on === this.firingNeed) return;
    this.firingNeed = on;
    if (on && !this.stage.hasAimSheet()) this.onNeedAnim?.("002");
    else this.onNeedAnim?.(null);
  }

  private pickAim(px: number, pz: number, yaw: number): { id: string; wx: number; wz: number } | null {
    const fwdX = -Math.sin(yaw);
    const fwdZ = -Math.cos(yaw);
    let best: { id: string; wx: number; wz: number; score: number } | null = null;
    for (const p of this.listPending()) {
      const d = Math.hypot(p.wx - px, p.wz - pz);
      if (d > SHOOT_M + 1.2) continue;
      const dx = (p.wx - px) / (d || 1);
      const dz = (p.wz - pz) / (d || 1);
      const facing = dx * fwdX + dz * fwdZ;
      if (facing < 0.15 && this.autoId !== p.id) continue;
      const score = d - facing * 2;
      if (!best || score < best.score) best = { id: p.id, wx: p.wx, wz: p.wz, score };
    }
    return best;
  }

  dispose(): void {
    this.stop();
    this.gun?.dispose();
    this.paint?.dispose();
    this.gun = null;
    this.paint = null;
  }
}
