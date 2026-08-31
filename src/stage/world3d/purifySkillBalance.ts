/**
 * 정화 스킬 전투 밸런스 SSoT — data/ui/layout/purify_skill_balance.json
 */
export type TintStep = 1 | 2 | 3;

export interface PurifySkillBalance {
  circleR: number;
  castSec: number;
  shrinkSec: number;
  stopHits: number;
  bugCount: number;
  bugHp: number;
  culpritHp: number;
  ammoStart: number;
  pickupGrant: number;
  pickupCount: number;
  costBasic: number;
  costMulti: number;
  costBoom: number;
  costChain: number;
  minAmmoHint: number;
  culpritScale: number;
  culpritCount: number;
  culpritSize: number;
  dialogues: Record<string, string>;
}

const FALLBACK: PurifySkillBalance = {
  circleR: 12,
  castSec: 3.6,
  shrinkSec: 300,
  stopHits: 6,
  bugCount: 5,
  bugHp: 4,
  culpritHp: 10,
  ammoStart: 14,
  pickupGrant: 8,
  pickupCount: 5,
  costBasic: 1,
  costMulti: 3,
  costBoom: 2,
  costChain: 2,
  minAmmoHint: 10,
  culpritScale: 28,
  culpritCount: 4200,
  culpritSize: 0.2,
  dialogues: {
    arrive: "dlg_i21_arrive",
    ammo_need: "dlg_i21_ammo_need",
    ammo_got: "dlg_i21_ammo_got",
    ammo_low_rush: "dlg_i21_ammo_low_rush",
    cast1_start: "dlg_i21_cast1",
    cast1_done: "dlg_i21_tint1",
    band_warn: "dlg_i21_band_warn",
    band_stop: "dlg_i21_band_stop",
    bugs_in: "dlg_i21_invade",
    bugs_clear: "dlg_i21_bugs_clear",
    gather_again: "dlg_i21_gather_again",
    cast2_start: "dlg_i21_cast2",
    cast2_done: "dlg_i21_tint2",
    cast3_start: "dlg_i21_cast3",
    cast3_done: "dlg_i21_tint3",
    culprit_in: "dlg_i21_king",
    culprit_down: "dlg_i21_culprit_down",
    need_final_cast: "dlg_i21_need_final",
    done: "dlg_i21_done",
    fail_pollute: "dlg_i21_fail_pollute",
  },
};

let cached: PurifySkillBalance | null = null;

export function defaultPurifySkillBalance(): PurifySkillBalance {
  return { ...FALLBACK, dialogues: { ...FALLBACK.dialogues } };
}

export async function loadPurifySkillBalance(): Promise<PurifySkillBalance> {
  if (cached) return cached;
  try {
    const res = await fetch(`/ui/layout/purify_skill_balance.json?t=${Date.now()}`);
    if (!res.ok) throw new Error("no balance");
    const raw = (await res.json()) as {
      timing?: { cast_sec?: number; shrink_sec?: number };
      hp?: { stop_hits?: number; bug_count?: number; bug_hp?: number; culprit_hp?: number };
      ammo?: {
        start?: number;
        pickup_grant?: number;
        pickup_count?: number;
        cost_basic?: number;
        cost_multi?: number;
        cost_boom?: number;
        cost_chain?: number;
        min_before_next_cast_hint?: number;
      };
      culprit_visual?: { scale?: number; count?: number; particle_size?: number };
      circle_r_m?: number;
      dialogues?: Record<string, string>;
    };
    cached = {
      circleR: raw.circle_r_m ?? FALLBACK.circleR,
      castSec: raw.timing?.cast_sec ?? FALLBACK.castSec,
      shrinkSec: raw.timing?.shrink_sec ?? FALLBACK.shrinkSec,
      stopHits: raw.hp?.stop_hits ?? FALLBACK.stopHits,
      bugCount: raw.hp?.bug_count ?? FALLBACK.bugCount,
      bugHp: raw.hp?.bug_hp ?? FALLBACK.bugHp,
      culpritHp: raw.hp?.culprit_hp ?? FALLBACK.culpritHp,
      ammoStart: raw.ammo?.start ?? FALLBACK.ammoStart,
      pickupGrant: raw.ammo?.pickup_grant ?? FALLBACK.pickupGrant,
      pickupCount: raw.ammo?.pickup_count ?? FALLBACK.pickupCount,
      costBasic: raw.ammo?.cost_basic ?? FALLBACK.costBasic,
      costMulti: raw.ammo?.cost_multi ?? FALLBACK.costMulti,
      costBoom: raw.ammo?.cost_boom ?? FALLBACK.costBoom,
      costChain: raw.ammo?.cost_chain ?? FALLBACK.costChain,
      minAmmoHint: raw.ammo?.min_before_next_cast_hint ?? FALLBACK.minAmmoHint,
      culpritScale: raw.culprit_visual?.scale ?? FALLBACK.culpritScale,
      culpritCount: raw.culprit_visual?.count ?? FALLBACK.culpritCount,
      culpritSize: raw.culprit_visual?.particle_size ?? FALLBACK.culpritSize,
      dialogues: { ...FALLBACK.dialogues, ...(raw.dialogues ?? {}) },
    };
    return cached;
  } catch {
    cached = defaultPurifySkillBalance();
    return cached;
  }
}

export function clearPurifySkillBalanceCache(): void {
  cached = null;
}
