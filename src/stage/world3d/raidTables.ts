/**
 * 정화 습격 테이블 — CSV SSoT.
 * 본편·툴이 같은 fetch 경로를 쓴다. 수치를 코드에 다시 넣지 않는다.
 */
import { loadCsv } from "../../csv";

export type BlightRole = "runner" | "tank" | "spitter";
export type RaidFirePattern = "chain" | "homing" | "spread" | "extra" | "stun" | "mod";
export type RaidBossKind = "moving" | "stationary_missile";

export interface RaidBlightType {
  type_id: string;
  role: BlightRole;
  hp: number;
  speed_mult: number;
  eat_mult: number;
  scale: number;
  color_hex: number;
}

export interface RaidWaveRow {
  tier: string;
  wave_index: number;
  start_sec: number;
  count: number;
  alive_cap: number;
  rate_runner: number;
  rate_tank: number;
  rate_spitter: number;
  spawn_gap_sec: number;
}

export interface RaidSkillPattern {
  action_slot: string;
  fire_pattern: RaidFirePattern;
  cooldown_sec: number;
  range_mult: number;
  count: number;
  spread_deg: number;
  dmg: number;
  status: string;
  stun_sec: number;
}

export interface RaidBossPattern {
  tier: string;
  pattern_id: string;
  kind: RaidBossKind;
  hp: number;
  speed_mult: number;
  scale: number;
  cycle_sec: number;
  param_a: number;
  param_b: number;
  color_hex: number;
}

export interface RaidVfxRow {
  vfx_id: string;
  particle_count: number;
  size_min: number;
  size_max: number;
  life_sec: number;
  color_hex: number;
  spread_m: number;
}

export interface RaidTables {
  blightTypes: RaidBlightType[];
  waves: RaidWaveRow[];
  skillPatterns: RaidSkillPattern[];
  bosses: RaidBossPattern[];
  vfx: RaidVfxRow[];
}

function num(v: string, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function hex(v: string, fallback: number): number {
  const s = (v || "").replace("#", "").trim();
  const n = parseInt(s, 16);
  return Number.isFinite(n) ? n : fallback;
}

function roleOf(v: string): BlightRole {
  if (v === "tank" || v === "spitter") return v;
  return "runner";
}

function patternOf(v: string): RaidFirePattern {
  if (v === "chain" || v === "homing" || v === "spread" || v === "extra" || v === "stun" || v === "mod") {
    return v;
  }
  return "homing";
}

function bossKindOf(v: string): RaidBossKind {
  return v === "stationary_missile" ? "stationary_missile" : "moving";
}

export function emptyRaidTables(): RaidTables {
  return { blightTypes: [], waves: [], skillPatterns: [], bosses: [], vfx: [] };
}

export function wavesForTier(tables: RaidTables, tier: string): RaidWaveRow[] {
  const t = normalizeRaidTier(tier);
  const rows = tables.waves.filter((w) => w.tier === t).sort((a, b) => a.wave_index - b.wave_index);
  return rows.length ? rows : tables.waves.filter((w) => w.tier === "NORMAL").sort((a, b) => a.wave_index - b.wave_index);
}

export function bossForTier(tables: RaidTables, tier: string): RaidBossPattern | null {
  const t = normalizeRaidTier(tier);
  return tables.bosses.find((b) => b.tier === t) ?? null;
}

export function patternBySlot(tables: RaidTables, slot: string): RaidSkillPattern | null {
  return tables.skillPatterns.find((p) => p.action_slot === slot) ?? null;
}

export function vfxById(tables: RaidTables, id: string): RaidVfxRow | null {
  return tables.vfx.find((v) => v.vfx_id === id) ?? null;
}

export function blightTypeByRole(tables: RaidTables, role: BlightRole): RaidBlightType | null {
  return tables.blightTypes.find((t) => t.role === role) ?? tables.blightTypes[0] ?? null;
}

export function normalizeRaidTier(tier: string): string {
  const t = (tier || "NORMAL").toUpperCase();
  if (t === "BOSS" || t === "FINALBOSS") return "FINALBOSS";
  if (t === "MINIBOSS") return "MINIBOSS";
  return "NORMAL";
}

export function pickBlightRole(wave: RaidWaveRow): BlightRole {
  const r = Math.random();
  const a = wave.rate_runner;
  const b = a + wave.rate_tank;
  if (r < a) return "runner";
  if (r < b) return "tank";
  return "spitter";
}

export async function loadRaidTables(): Promise<RaidTables> {
  try {
    const [typeRows, waveRows, skillRows, bossRows, vfxRows] = await Promise.all([
      loadCsv("raid_blight_type"),
      loadCsv("raid_wave_config"),
      loadCsv("raid_skill_pattern"),
      loadCsv("raid_boss_pattern"),
      loadCsv("raid_vfx_config"),
    ]);
    return {
      blightTypes: typeRows.map((r) => ({
        type_id: r.type_id,
        role: roleOf(r.role),
        hp: num(r.hp, 3),
        speed_mult: num(r.speed_mult, 1),
        eat_mult: num(r.eat_mult, 1),
        scale: num(r.scale, 1),
        color_hex: hex(r.color_hex, 0x7b48b8),
      })),
      waves: waveRows.map((r) => ({
        tier: normalizeRaidTier(r.tier),
        wave_index: num(r.wave_index, 1),
        start_sec: num(r.start_sec),
        count: num(r.count, 5),
        alive_cap: num(r.alive_cap, 10),
        rate_runner: num(r.rate_runner, 1),
        rate_tank: num(r.rate_tank),
        rate_spitter: num(r.rate_spitter),
        spawn_gap_sec: num(r.spawn_gap_sec, 0.38),
      })),
      skillPatterns: skillRows.map((r) => ({
        action_slot: r.action_slot,
        fire_pattern: patternOf(r.fire_pattern),
        cooldown_sec: num(r.cooldown_sec),
        range_mult: num(r.range_mult, 1),
        count: Math.max(1, num(r.count, 1)),
        spread_deg: num(r.spread_deg),
        dmg: Math.max(1, num(r.dmg, 1)),
        status: r.status || "none",
        stun_sec: num(r.stun_sec),
      })),
      bosses: bossRows.map((r) => ({
        tier: normalizeRaidTier(r.tier),
        pattern_id: r.pattern_id,
        kind: bossKindOf(r.kind),
        hp: num(r.hp, 12),
        speed_mult: num(r.speed_mult, 0.5),
        scale: num(r.scale, 1.8),
        cycle_sec: num(r.cycle_sec, 4),
        param_a: num(r.param_a),
        param_b: num(r.param_b),
        color_hex: hex(r.color_hex, 0xff5577),
      })),
      vfx: vfxRows.map((r) => ({
        vfx_id: r.vfx_id,
        particle_count: num(r.particle_count, 6),
        size_min: num(r.size_min, 0.04),
        size_max: num(r.size_max, 0.1),
        life_sec: num(r.life_sec, 0.4),
        color_hex: hex(r.color_hex, 0xffffff),
        spread_m: num(r.spread_m, 0.4),
      })),
    };
  } catch {
    return emptyRaidTables();
  }
}
