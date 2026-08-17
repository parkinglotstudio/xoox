/**
 * 관문/보스 패턴. TITAN 메시는 쓰지 않는다.
 */
import type { BlightUnit, BlightWave } from "./BlightWave";
import type { RaidVfx } from "./RaidVfx";
import { blightTypeByRole, bossForTier, type RaidBossPattern, type RaidTables } from "./raidTables";

export class RaidBossRuntime {
  private cfg: RaidBossPattern | null = null;
  private unit: BlightUnit | null = null;
  private timer = 0;
  private core = { x: 0, z: 0 };

  constructor(
    private readonly wave: BlightWave,
    private readonly tables: RaidTables,
    private readonly vfx: RaidVfx,
  ) {}

  begin(tier: string, coreX: number, coreZ: number): void {
    this.cfg = bossForTier(this.tables, tier);
    this.core = { x: coreX, z: coreZ };
    this.unit = null;
    this.timer = 0;
    if (!this.cfg) return;
    const pos = this.wave.ringPos();
    this.unit = this.wave.spawnTyped({
      x: pos.x,
      z: pos.z,
      hp: this.cfg.hp,
      role: "boss",
      speed_mult: this.cfg.speed_mult,
      eat_mult: 2.2,
      scale: this.cfg.scale,
      color: this.cfg.color_hex,
      is_boss: true,
    });
    this.vfx.play("boss_intro", pos.x, pos.z);
    this.timer = this.cfg.cycle_sec * 0.4;
  }

  alive(): boolean {
    return !!this.unit && this.unit.hp > 0 && this.wave.bossAlive();
  }

  tick(dt: number, spawnMinions = true): void {
    if (!this.cfg || !this.unit || this.unit.hp <= 0) return;
    this.timer -= dt;
    if (this.timer > 0) return;
    this.timer = this.cfg.cycle_sec;
    if (this.cfg.kind === "moving") this.charge();
    else if (spawnMinions) this.artillery();
  }

  private charge(): void {
    if (!this.unit || !this.cfg) return;
    const dx = this.core.x - this.unit.x;
    const dz = this.core.z - this.unit.z;
    const dist = Math.hypot(dx, dz) || 1;
    const step = Math.min(dist, this.cfg.param_a || 7);
    this.unit.x += (dx / dist) * step;
    this.unit.z += (dz / dist) * step;
    this.vfx.play("core_hit", this.unit.x, this.unit.z);
  }

  private artillery(): void {
    if (!this.cfg) return;
    const n = Math.max(1, Math.round(this.cfg.param_a || 3));
    const t = blightTypeByRole(this.tables, "runner");
    for (let i = 0; i < n; i++) {
      const pos = this.wave.ringPos();
      this.wave.spawnTyped({
        x: pos.x,
        z: pos.z,
        hp: t?.hp ?? 2,
        role: "runner",
        speed_mult: (t?.speed_mult ?? 1) * 1.1,
        eat_mult: t?.eat_mult ?? 1,
        scale: t?.scale ?? 0.9,
        color: t?.color_hex ?? 0x7b48b8,
      });
    }
    if (this.unit) this.vfx.play("skill_spread", this.unit.x, this.unit.z);
  }
}
