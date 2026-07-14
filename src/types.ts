export interface EffectDef {
  effect_id: string;
  effect_type: "STAT_PCT" | "STAT_ABS" | "CURRENCY" | "SKILL_GRANT" | "SKILL_UPGRADE";
  target: string;
  value: number;
  value_type: "PERCENT" | "ABSOLUTE";
  skill_id: string;
  icon: string;
  description: string;
}

export interface GradeDef {
  grade_id: string;
  grade_name: string;
  weight: number;
  banner_color: string;
  card_bg_color: string;
  counter_cap: number | null;
  is_negative: boolean;
}

export interface TextDef {
  text_id: string;
  category: string;
  grade_id: string;
  body: string;
}

export interface DailyPoolRow {
  pool_id: string;
  grade_id: string;
  text_id: string;
  effect_id: string;
  weight: number;
}

export interface PoolBonusEffectRow {
  pool_id: string;
  effect_id: string;
}

export interface LocationDef {
  location_id: string;
  name: string;
  text_id: string;
  entry_path: "DIRECT" | "BRANCH_ROUTE";
  grade_id: string;
  repeatable: boolean;
  linked_effect_id: string;
  linked_minigame_id: string;
  milestone_id: string;
}

export interface BranchDef {
  branch_id: string;
  subtype: string;
  text_id: string;
  option_a_label: string;
  option_a_effect_id: string;
  option_a_prob: number | null;
  option_b_label: string;
  option_b_effect_id: string;
  option_b_prob: number | null;
  cost_effect_id: string;
}

export interface MinigameDef {
  minigame_id: string;
  minigame_name: string;
  type: string;
  attempt_limit: number | null;
}

export interface MinigameRewardRow {
  reward_id: string;
  minigame_id: string;
  effect_id: string;
  weight: number;
  label: string;
  color: string;
  action: string;
}

export interface CombatDef {
  combat_id: string;
  tier: string;
  text_id: string;
  gold_min: number;
  gold_max: number;
  exp_min: number;
  exp_max: number;
}

export interface LevelupDef {
  level: number;
  skill_grant_mode: "CHOICE_3" | "AUTO";
  skill_pool_tier: string;
  hp_heal_pct: number;
  exp_to_next: number;
}

export interface SkillDef {
  skill_id: string;
  skill_name: string;
  tier: string;
  is_upgrade: boolean;
  base_skill_id: string;
  icon: string;
  effect_text: string;
}

export interface GaugeDef {
  gauge_id: string;
  grade_id: string;
  cap: number;
  icon: string;
  reward_minigame_id: string;
}

export interface PhaseDef {
  phase_id: string;
  day_start: number;
  day_end: number;
  combat_weight: number;
  content_weight: number;
}

export interface ContentTypeDef {
  type_id: string;
  type_name: string;
  weight: number;
}

export interface MilestoneDef {
  milestone_id: string;
  milestone_name: string;
  currency: string;
  cap: number;
  tier1_effect: string;
  tier1_at: number;
  tier2_effect: string;
  tier2_at: number;
}

export interface CurrencyDef {
  currency_id: string;
  state_key: string;
  icon: string;
  label: string;
  always_show: boolean;
}

export interface PassiveItemDef {
  item_id: string;
  item_name: string;
  icon: string;
  effect_type: string;
  effect_value: string;
  owned_at_start: boolean;
  description: string;
}

export interface GameData {
  effects: EffectDef[];
  grades: GradeDef[];
  texts: TextDef[];
  dailyPool: DailyPoolRow[];
  poolBonusEffects: PoolBonusEffectRow[];
  locations: LocationDef[];
  branches: BranchDef[];
  minigames: MinigameDef[];
  minigameRewards: MinigameRewardRow[];
  combats: CombatDef[];
  levelups: LevelupDef[];
  skills: SkillDef[];
  gauges: GaugeDef[];
  phases: PhaseDef[];
  contentTypes: ContentTypeDef[];
  milestones: MilestoneDef[];
  currencies: CurrencyDef[];
  passives: PassiveItemDef[];
  uiTexts: Record<string, string>;
}

export interface PlayerState {
  day: number;
  level: number;
  exp: number;
  expToNext: number;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  gold: number;
  starFragment: number;
  feed: number;
  victoryFlag: number;
  ancientSuccession: number;
  gaugeCounts: Record<string, number>;
  learnedSkills: string[];
  seenLocations: Set<string>;
  finalBossDefeated: boolean;
  claimedMilestones: Set<string>;
  ownedPassives: Set<string>;
}
