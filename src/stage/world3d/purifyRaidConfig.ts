/**
 * 정화 습격 튜닝 값 — 단일 출처.
 *
 * 총·땅·웨이브 수치는 눈으로 맞춰야 하므로 툴에서 저장하고 본편이 읽는다.
 * 저장: `data/ui/layout/purify_raid_layout.json`
 * 편집: /purify-raid-tool.html
 *
 * 저장은 Vite dev 미들웨어(`POST /__layout_save`)를 쓴다.
 */

export type PurifyWeaponType = "missile";

export interface PurifyRaidConfig {
  version: number;

  /** 지금은 미사일(유탄)만. 나중에 분사 등을 붙일 자리 */
  weapon_type: PurifyWeaponType;

  gun_range_m: number;
  gun_spread_deg: number;
  gun_ammo_per_sec: number;
  gun_ammo_max: number;
  gun_regen_on_teal: number;
  /** 포물선 최고점 높이(m) */
  missile_arc_m: number;
  /** 수평 속도(m/s) — 클수록 빨리 떨어진다 */
  missile_speed_mps: number;

  paint_radius_m: number;
  /** 청록이 보라를 덮을 때 한 방에 지우는 세기 0..1 */
  paint_overwrite: number;

  wave_count: number;
  wave_size: number;
  blight_speed_mps: number;
  blight_hits: number;

  /** 거점이 잠기는 속도(초당 0..1). 적이 코어에 붙어 있을 때만 찬다 */
  core_eat_per_sec: number;
  /** 거점 주변이 이 % 이상 청록이면 승리(웨이브를 다 막지 못해도) */
  win_teal_pct: number;
  warn_sec: number;

  note?: string;
}

export const PURIFY_RAID_CONFIG_URL = "/ui/layout/purify_raid_layout.json";
export const PURIFY_RAID_CONFIG_SAVE_PATH = "data/ui/layout/purify_raid_layout.json";

export const PURIFY_RAID_DEFAULTS: PurifyRaidConfig = {
  version: 1,
  weapon_type: "missile",
  gun_range_m: 10,
  gun_spread_deg: 8,
  gun_ammo_per_sec: 2.4,
  gun_ammo_max: 24,
  gun_regen_on_teal: 6,
  missile_arc_m: 2.3,
  missile_speed_mps: 11,
  paint_radius_m: 1.15,
  paint_overwrite: 0.85,
  wave_count: 3,
  wave_size: 6,
  blight_speed_mps: 2.4,
  blight_hits: 3,
  core_eat_per_sec: 0.12,
  win_teal_pct: 55,
  warn_sec: 3,
};

function num(v: unknown, fallback: number): number {
  const n = typeof v === "string" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : fallback;
}

export function normalizePurifyRaidConfig(raw: unknown): PurifyRaidConfig {
  const r = (raw ?? {}) as Partial<Record<keyof PurifyRaidConfig, unknown>>;
  const d = PURIFY_RAID_DEFAULTS;
  return {
    version: num(r.version, d.version),
    weapon_type: r.weapon_type === "missile" ? "missile" : d.weapon_type,
    gun_range_m: num(r.gun_range_m, d.gun_range_m),
    gun_spread_deg: num(r.gun_spread_deg, d.gun_spread_deg),
    gun_ammo_per_sec: num(r.gun_ammo_per_sec, d.gun_ammo_per_sec),
    gun_ammo_max: num(r.gun_ammo_max, d.gun_ammo_max),
    gun_regen_on_teal: num(r.gun_regen_on_teal, d.gun_regen_on_teal),
    missile_arc_m: num(r.missile_arc_m, d.missile_arc_m),
    missile_speed_mps: num(r.missile_speed_mps, d.missile_speed_mps),
    paint_radius_m: num(r.paint_radius_m, d.paint_radius_m),
    paint_overwrite: num(r.paint_overwrite, d.paint_overwrite),
    wave_count: num(r.wave_count, d.wave_count),
    wave_size: num(r.wave_size, d.wave_size),
    blight_speed_mps: num(r.blight_speed_mps, d.blight_speed_mps),
    blight_hits: num(r.blight_hits, d.blight_hits),
    core_eat_per_sec: num(r.core_eat_per_sec, d.core_eat_per_sec),
    win_teal_pct: num(r.win_teal_pct, d.win_teal_pct),
    warn_sec: num(r.warn_sec, d.warn_sec),
    note: typeof r.note === "string" ? r.note : undefined,
  };
}

/**
 * 본편 티어에 맞춰 툴 수치를 살짝 키운다.
 * NORMAL은 툴 값 그대로. 관문·보스는 파·체력만 얹는다.
 */
export function scaleRaidForTier(cfg: PurifyRaidConfig, tier = "NORMAL"): PurifyRaidConfig {
  const t = (tier || "NORMAL").toUpperCase();
  const out = { ...cfg };
  if (t === "MINIBOSS") {
    out.wave_count += 1;
    out.wave_size += 2;
    out.blight_hits += 1;
    out.blight_speed_mps = Math.round(out.blight_speed_mps * 112) / 100;
    out.warn_sec = Math.max(2, out.warn_sec - 0.5);
  } else if (t === "FINALBOSS" || t === "BOSS") {
    out.wave_count += 2;
    out.wave_size += 3;
    out.blight_hits += 2;
    out.blight_speed_mps = Math.round(out.blight_speed_mps * 122) / 100;
    out.core_eat_per_sec = Math.round(out.core_eat_per_sec * 1150) / 1000;
    out.warn_sec = Math.max(1.5, out.warn_sec - 1);
  }
  return out;
}

export async function loadPurifyRaidConfig(): Promise<PurifyRaidConfig> {
  try {
    const res = await fetch(`${PURIFY_RAID_CONFIG_URL}?t=${Date.now()}`);
    if (!res.ok) return { ...PURIFY_RAID_DEFAULTS };
    return normalizePurifyRaidConfig(await res.json());
  } catch {
    return { ...PURIFY_RAID_DEFAULTS };
  }
}

export interface PurifyRaidSaveResult {
  ok: boolean;
  downloaded: boolean;
  message: string;
}

export async function savePurifyRaidConfig(cfg: PurifyRaidConfig): Promise<PurifyRaidSaveResult> {
  const json: PurifyRaidConfig = {
    ...cfg,
    version: 1,
    note: "정화 습격 튜닝. 편집: /purify-raid-tool.html",
  };
  try {
    const res = await fetch("/__layout_save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: PURIFY_RAID_CONFIG_SAVE_PATH, json }),
    });
    const body = (await res.json()) as { ok?: boolean; error?: string; path?: string };
    if (!res.ok || !body.ok) throw new Error(body.error || `HTTP ${res.status}`);
    return { ok: true, downloaded: false, message: `저장됨 → ${body.path}` };
  } catch (e) {
    const blob = new Blob([JSON.stringify(json, null, 2) + "\n"], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "purify_raid_layout.json";
    a.click();
    URL.revokeObjectURL(a.href);
    return {
      ok: false,
      downloaded: true,
      message: `서버 저장 실패 · JSON 내려받음 (${String(e)})`,
    };
  }
}
