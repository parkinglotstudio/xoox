/**
 * 보유 스킬 → 실시간 발사. 쿠나이 목록이 아니라 여정 sk_* 만.
 */
import type { SkillEffectRow } from "../../types";
import type { BlightUnit, BlightWave } from "./BlightWave";
import type { PurifyGun } from "./PurifyGun";
import type { PurifyRaidConfig } from "./purifyRaidConfig";
import type { RaidVfx } from "./RaidVfx";
import { pickHuntTarget } from "./AutoPilot";
import { patternBySlot, type RaidTables } from "./raidTables";

export class RaidSkillRuntime {
  private cool = new Map<string, number>();
  private comboAt = -99;
  private started = false;
  coreEatMult = 1;
  private slots = new Set<string>();
  private volley = new Map<string, number>();

  constructor(
    private readonly gun: PurifyGun,
    private readonly wave: BlightWave,
    private readonly tables: RaidTables,
    private readonly cfg: PurifyRaidConfig,
    private readonly vfx: RaidVfx,
    learnedIds: string[],
    effects: SkillEffectRow[],
  ) {
    const owned = new Set(learnedIds);
    for (const e of effects) {
      if (!e.enabled || !owned.has(e.skill_id)) continue;
      this.slots.add(e.action_slot);
      if (e.action_slot === "BOLT" || e.action_slot === "DAGGER" || e.action_slot === "FIREWAVE" || e.action_slot === "SPEAR") {
        if (e.target === "VOLLEY_COUNT") {
          this.volley.set(e.action_slot, (this.volley.get(e.action_slot) ?? 0) + e.value);
        }
      }
      if (e.target === "DMG_TAKEN_MULT" && e.op === "MUL") this.coreEatMult *= e.value;
      if (e.target === "MAX_HP_MULT" && e.op === "ADD") this.gun.regenMult *= 1 + e.value;
      if (e.target === "ATK_MULT" && e.op === "ADD") this.gun.regenMult *= 1 + e.value * 0.5;
    }
    this.gun.onLaunch = (x, z) => this.onBasicFire(x, z);
  }

  onFightStart(): void {
    if (this.started) return;
    this.started = true;
    const p = patternBySlot(this.tables, "START");
    if (p && this.slots.has("START")) this.wave.stunAll(p.stun_sec || 1.1);
  }

  tick(dt: number, me: { x: number; z: number }, core: { x: number; z: number }, corePct: number): void {
    for (const k of [...this.cool.keys()]) {
      this.cool.set(k, (this.cool.get(k) ?? 0) - dt);
    }
    const units = this.wave.units;
    this.trySlot("BOLT", me, core, units);
    if (corePct >= 0.35) this.trySlot("FIREWAVE", me, core, units);
    if (this.wave.eatingCount() > 0) this.trySlot("SPEAR", me, core, units.filter((u) => u.eating));
  }

  private onBasicFire(x: number, z: number): void {
    const now = performance.now() / 1000;
    if (this.slots.has("DAGGER")) this.firePattern("DAGGER", x, z);
    if (this.slots.has("COMBO")) {
      const p = patternBySlot(this.tables, "COMBO");
      if (p && now - this.comboAt <= p.cooldown_sec) this.firePattern("COMBO", x, z);
      this.comboAt = now;
    }
  }

  private trySlot(slot: string, me: { x: number; z: number }, core: { x: number; z: number }, units: BlightUnit[]): void {
    if (!this.slots.has(slot)) return;
    const p = patternBySlot(this.tables, slot);
    if (!p || p.fire_pattern === "mod" || p.fire_pattern === "stun") return;
    if ((this.cool.get(slot) ?? 0) > 0) return;
    const t = pickHuntTarget(units, me, core, this.cfg.gun_range_m * p.range_mult);
    if (!t) return;
    this.cool.set(slot, p.cooldown_sec);
    this.firePattern(slot, t.x, t.z);
  }

  private firePattern(slot: string, x: number, z: number): void {
    const p = patternBySlot(this.tables, slot);
    if (!p) return;
    const extra = Math.max(0, Math.round(this.volley.get(slot) ?? 0) - 1);
    const n = p.count + extra;
    if (p.fire_pattern === "spread") {
      this.vfx.play("skill_spread", x, z);
      for (let i = 0; i < n; i++) this.gun.launchAt(x, z, p.spread_deg);
      this.wave.applyStatusNear(x, z, this.cfg.paint_radius_m * 1.4, p.status);
      return;
    }
    if (p.fire_pattern === "chain") {
      this.vfx.play("skill_bolt", x, z);
      this.gun.launchAt(x, z, 0);
      const splash = this.cfg.paint_radius_m * 1.6;
      this.wave.hitSplash(x, z, splash, p.dmg);
      const next = this.wave.units.find((u) => Math.hypot(u.x - x, u.z - z) > 0.4 && Math.hypot(u.x - x, u.z - z) < splash * 2.4);
      if (next) {
        this.gun.launchAt(next.x, next.z, 0);
        this.wave.hitSplash(next.x, next.z, splash * 0.8, p.dmg);
      }
      return;
    }
    for (let i = 0; i < n; i++) this.gun.launchAt(x, z, p.spread_deg);
  }
}
