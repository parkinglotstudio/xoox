import type {
  GameData,
  PlayerState,
  GradeDef,
  ContentTypeDef,
  DailyPoolRow,
  LocationDef,
  BranchDef,
  SkillDef,
  MinigameRewardRow,
} from "./types";
import { weightedPick, randInt } from "./rng";

export function createInitialState(data: GameData): PlayerState {
  const lvl1 = data.levelups.find((l) => l.level === 1);
  return {
    day: 0,
    level: 1,
    exp: 0,
    expToNext: lvl1?.exp_to_next ?? 100,
    hp: 22000,
    maxHp: 22000,
    atk: 3900,
    def: 1050,
    gold: 0,
    starFragment: 0,
    feed: 0,
    victoryFlag: 0,
    ancientSuccession: 0,
    gaugeCounts: {},
    learnedSkills: [],
    seenLocations: new Set(),
    finalBossDefeated: false,
  };
}

export function pickPhase(data: GameData, day: number) {
  return (
    data.phases.find((p) => day >= p.day_start && day <= p.day_end) ??
    data.phases[data.phases.length - 1]
  );
}

export function rollIsCombat(data: GameData, day: number): boolean {
  const phase = pickPhase(data, day);
  return Math.random() * 100 < phase.combat_weight;
}

export function rollContentType(data: GameData): ContentTypeDef {
  return weightedPick(data.contentTypes, (t) => t.weight);
}

export function rollGrade(data: GameData): GradeDef {
  return weightedPick(data.grades, (g) => g.weight);
}

export function rollDailyEntry(data: GameData, gradeId: string): DailyPoolRow | null {
  const pool = data.dailyPool.filter((p) => p.grade_id === gradeId);
  if (pool.length === 0) return null;
  return weightedPick(pool, (p) => p.weight);
}

export function getBonusEffectIds(data: GameData, poolId: string): string[] {
  return data.poolBonusEffects.filter((b) => b.pool_id === poolId).map((b) => b.effect_id);
}

export function pickUngradedText(data: GameData) {
  const pool = data.texts.filter((t) => t.category === "UNGRADED");
  return pool[randInt(0, pool.length - 1)];
}

export function pickLocation(data: GameData, state: PlayerState): LocationDef {
  const unseen = data.locations.filter((l) => !state.seenLocations.has(l.location_id));
  const pool = unseen.length > 0 ? unseen : data.locations.filter((l) => l.repeatable);
  return pool[randInt(0, pool.length - 1)];
}

export const FINAL_CHALLENGE_BRANCH_ID = "b_challenger";
export const FINAL_CHALLENGE_MIN_DAY = 24;

export function pickBranch(data: GameData, day: number, finalBossDefeated: boolean): BranchDef {
  const pool = data.branches.filter((b) => {
    if (b.branch_id !== FINAL_CHALLENGE_BRANCH_ID) return true;
    return day >= FINAL_CHALLENGE_MIN_DAY && !finalBossDefeated;
  });
  return pool[randInt(0, pool.length - 1)];
}

export function pickCombat(data: GameData, tier: string = "NORMAL") {
  const pool = data.combats.filter((c) => c.tier === tier);
  return pool[randInt(0, pool.length - 1)];
}

export function textFor(data: GameData, textId: string) {
  return data.texts.find((t) => t.text_id === textId)?.body ?? "";
}

export interface EffectResult {
  lines: string[];
  learnedSkill?: SkillDef;
}

export function applyEffectId(data: GameData, state: PlayerState, effectId: string): EffectResult {
  const effect = data.effects.find((e) => e.effect_id === effectId);
  if (!effect) return { lines: [] };
  const lines: string[] = [];
  let learnedSkill: SkillDef | undefined;

  switch (effect.effect_type) {
    case "STAT_PCT": {
      const pct = effect.value / 100;
      if (effect.target === "HP") {
        state.hp = Math.max(1, Math.min(state.maxHp, state.hp + state.maxHp * pct));
        lines.push(`HP ${effect.value > 0 ? "+" : ""}${effect.value}% 회복`);
      } else if (effect.target === "MAX_HP") {
        const before = state.maxHp;
        state.maxHp = Math.max(1, Math.round(state.maxHp * (1 + pct)));
        state.hp = Math.min(state.maxHp, Math.max(1, state.hp + (state.maxHp - before)));
        lines.push(`최대 HP ${effect.value > 0 ? "+" : ""}${effect.value}%`);
      } else if (effect.target === "ATK") {
        state.atk = Math.max(1, Math.round(state.atk * (1 + pct)));
        lines.push(`공격력 ${effect.value > 0 ? "+" : ""}${effect.value}%`);
      } else if (effect.target === "DEF") {
        state.def = Math.max(1, Math.round(state.def * (1 + pct)));
        lines.push(`방어력 ${effect.value > 0 ? "+" : ""}${effect.value}%`);
      }
      break;
    }
    case "STAT_ABS": {
      if (effect.target === "MAX_HP") {
        state.maxHp = Math.max(1000, state.maxHp + effect.value);
        state.hp = Math.min(state.hp, state.maxHp);
        lines.push(`최대 HP ${effect.value > 0 ? "+" : ""}${effect.value}`);
      }
      break;
    }
    case "CURRENCY": {
      const map: Record<string, keyof PlayerState> = {
        GOLD: "gold",
        EXP: "exp",
        STAR_FRAGMENT: "starFragment",
        FEED: "feed",
        VICTORY_FLAG: "victoryFlag",
        ANCIENT_SUCCESSION: "ancientSuccession",
      };
      const key = map[effect.target];
      if (key) {
        (state[key] as number) += effect.value;
        const label: Record<string, string> = {
          GOLD: "골드",
          EXP: "EXP",
          STAR_FRAGMENT: "별조각",
          FEED: "사료",
          VICTORY_FLAG: "승리의 깃발",
          ANCIENT_SUCCESSION: "고대 계승",
        };
        lines.push(`${label[effect.target]} +${effect.value}`);
      }
      break;
    }
    case "SKILL_GRANT":
    case "SKILL_UPGRADE": {
      const wantUpgrade = effect.effect_type === "SKILL_UPGRADE";
      const directSkill = effect.skill_id.startsWith("POOL_")
        ? undefined
        : data.skills.find((s) => s.skill_id === effect.skill_id);
      if (directSkill) {
        learnedSkill = directSkill;
        if (!state.learnedSkills.includes(directSkill.skill_id)) {
          state.learnedSkills.push(directSkill.skill_id);
        }
        lines.push(`스킬 ${directSkill.skill_name} 학습`);
        break;
      }
      const tier = effect.skill_id === "POOL_LEGEND" ? "전설" : effect.skill_id === "POOL_MYTH" ? "신화" : "일반";
      let pool = data.skills.filter((s) => s.tier === tier && s.is_upgrade === wantUpgrade);
      if (!wantUpgrade) pool = pool.filter((s) => !state.learnedSkills.includes(s.skill_id));
      if (pool.length === 0) pool = data.skills.filter((s) => s.is_upgrade === wantUpgrade);
      if (pool.length > 0) {
        learnedSkill = pool[randInt(0, pool.length - 1)];
        state.learnedSkills.push(learnedSkill.skill_id);
        lines.push(`스킬 ${learnedSkill.skill_name} 학습`);
      }
      break;
    }
  }
  return { lines, learnedSkill };
}

export interface LevelUpResult {
  newLevel: number;
  hpHealPct: number;
  skillGrantMode: "CHOICE_3" | "AUTO";
  skillPoolTier: string;
}

export function checkLevelUp(data: GameData, state: PlayerState): LevelUpResult | null {
  if (state.exp < state.expToNext) return null;
  state.exp -= state.expToNext;
  state.level += 1;
  const lastKnown = data.levelups[data.levelups.length - 1];
  const cfg = data.levelups.find((l) => l.level === state.level) ?? {
    level: state.level,
    skill_grant_mode: "AUTO" as const,
    skill_pool_tier: "미확인",
    hp_heal_pct: lastKnown?.hp_heal_pct ?? 5,
    exp_to_next: Math.round((lastKnown?.exp_to_next ?? state.expToNext) * 1.35),
  };
  state.expToNext = cfg.exp_to_next;
  state.hp = Math.min(state.maxHp, state.hp + state.maxHp * (cfg.hp_heal_pct / 100));
  return {
    newLevel: state.level,
    hpHealPct: cfg.hp_heal_pct,
    skillGrantMode: cfg.skill_grant_mode,
    skillPoolTier: cfg.skill_pool_tier,
  };
}

export function grantSkillFromTier(data: GameData, state: PlayerState, tier: string): SkillDef | null {
  let pool = data.skills.filter((s) => s.tier === tier && !s.is_upgrade && !state.learnedSkills.includes(s.skill_id));
  if (pool.length === 0) pool = data.skills.filter((s) => !s.is_upgrade && !state.learnedSkills.includes(s.skill_id));
  if (pool.length === 0) return null;
  const skill = pool[randInt(0, pool.length - 1)];
  state.learnedSkills.push(skill.skill_id);
  return skill;
}

export function pickSkillChoices(
  data: GameData,
  state: PlayerState,
  tier: string,
  count = 3,
  wantUpgrade = false
): SkillDef[] {
  const primary = data.skills.filter(
    (s) => s.tier === tier && s.is_upgrade === wantUpgrade && !state.learnedSkills.includes(s.skill_id)
  );
  let pool = primary;
  if (pool.length < count) {
    const rest = data.skills.filter(
      (s) => s.is_upgrade === wantUpgrade && !state.learnedSkills.includes(s.skill_id) && !primary.includes(s)
    );
    pool = [...primary, ...rest];
  }
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function incrementGauge(data: GameData, state: PlayerState, gradeId: string) {
  const gauge = data.gauges.find((g) => g.grade_id === gradeId);
  if (!gauge) return null;
  const current = (state.gaugeCounts[gauge.gauge_id] ?? 0) + 1;
  state.gaugeCounts[gauge.gauge_id] = current;
  if (current >= gauge.cap) {
    state.gaugeCounts[gauge.gauge_id] = 0;
    return { gauge, filled: true };
  }
  return { gauge, filled: false };
}

export function gaugeValue(data: GameData, state: PlayerState, gaugeId: string) {
  const gauge = data.gauges.find((g) => g.gauge_id === gaugeId)!;
  return { current: state.gaugeCounts[gaugeId] ?? 0, cap: gauge.cap };
}

export function spinMinigame(data: GameData, minigameId: string): MinigameRewardRow | null {
  const pool = data.minigameRewards.filter((r) => r.minigame_id === minigameId);
  if (pool.length === 0) return null;
  const picked = weightedPick(pool, (r) => r.weight);
  return picked.effect_id ? picked : null;
}
