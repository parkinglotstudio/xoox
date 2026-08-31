export interface EffectDef {
  effect_id: string;
  effect_type:
    | "STAT_PCT"
    | "STAT_ABS"
    | "CURRENCY"
    | "SKILL_GRANT"
    | "SKILL_UPGRADE"
    | "CONTENT_LINK"
    | "TEAM_JOIN";
  target: string;
  value: number;
  value_type: "PERCENT" | "ABSOLUTE";
  /** SKILL_GRANT skill/pool id · CONTENT_LINK 시 ref (location_id / minigame_id / combat tier) · TEAM_JOIN 시 party_member_config.member_id */
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
  /** CSS 배너 클래스 키 (grade-jp 등) */
  css_key: string;
  banner_ms: number;
  is_jackpot: boolean;
  /** 로그 카드 class (grade-대박 등) */
  card_css_class: string;
}

export interface TextDef {
  text_id: string;
  category: string;
  grade_id: string;
  /** 슬롯/기본 표시 1줄 (원작 대박 슬롯 구간) */
  body: string;
  /** 슬롯 종료 후 펼쳐지는 2줄째. 없으면 빈 문자열 */
  body_line2: string;
}

export interface DailyPoolRow {
  pool_id: string;
  grade_id: string;
  text_id: string;
  effect_id: string;
  weight: number;
  linked_minigame_id: string;
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
  scenario_id: string;
  /** TRUE면 미니게임 전 떠나기/돌리기 선택 */
  offer_leave: boolean;
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
  /** 양쪽 공통 입장료(아레나 등). PREVIEW_DECLINE 거절에는 쓰지 않음. */
  cost_effect_id: string;
  option_a_cost_effect_id: string;
  option_b_cost_effect_id: string;
  weight: number;
}

export interface MinigameDef {
  minigame_id: string;
  minigame_name: string;
  type: string;
  attempt_limit: number | null;
  /** MYTH_SLOT 천사 스택 상한 (원작 화면 기준 기본 4) */
  angel_stack_cap: number;
  /** MYTH_SLOT 악마 스택 상한 (원작 화면 기준 기본 3) */
  devil_stack_cap: number;
}

/** 미니게임 진입 경로 SSoT (분기점 검증용) */
export interface MinigameEntryDef {
  entry_id: string;
  minigame_id: string;
  source_kind: string;
  source_id: string;
  note: string;
}

export interface MinigameRewardRow {
  reward_id: string;
  minigame_id: string;
  effect_id: string;
  weight: number;
  label: string;
  color: string;
  action: string;
  /** myth slot: angel | devil | empty */
  side: string;
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

/** 상단 스테이지 상황 모드 (stage_mode_config) */
export interface StageModeDef {
  mode_id: string;
  title: string;
  subtitle: string;
  icon: string;
  bg_class: string;
  show_enemy: boolean;
  note: string;
}

/** 전투 적 스탯 (combat_enemy_config) — combat_id FK */
export interface CombatEnemyDef {
  combat_id: string;
  enemy_name: string;
  enemy_icon: string;
  enemy_hp: number;
  enemy_atk: number;
  enemy_def: number;
  pattern_id: string;
  rage_max: number;
  rage_per_turn: number;
  /** ACTION(기본, 액션 전투) | PURIFY(XOOX 정화 전투 — enemy_hp를 타락 게이지로 재해석) */
  combat_mode: "ACTION" | "PURIFY";
  /** PURIFY 전용: 이 적을 정화하면 지급되는 party_member_config.member_id (없으면 빈 문자열) */
  redeems_to_member_id: string;
}

/**
 * XOOX 팀 구성원 마스터 (party_member_config) — 정화로 구조해 합류하는 동료.
 * 【확정, 2026-07-17, 18_XOOX_정화전투_연출.md §2】 모호한 %버프 대신 명확한 효과 3종 중 하나만 갖는다.
 * 전투 유닛은 모험가 1명 그대로 — 펫은 고정 스탯 증가 또는 스킬(주기/조건 발동)로만 기여한다.
 */
export interface PartyMemberDef {
  member_id: string;
  display_name: string;
  icon: string;
  /** FLAT_HP(최대체력 증가) | FLAT_ATK(공격력 증가) | PERIODIC_HEAL(주기 회복 스킬) | EXECUTE_BURST(조건 발동 피니셔) */
  effect_type: "FLAT_HP" | "FLAT_ATK" | "PERIODIC_HEAL" | "EXECUTE_BURST";
  /** FLAT_HP: 최대체력 증가량 | FLAT_ATK: 공격력 증가량 | PERIODIC_HEAL: 회복 %(체력 기준) | EXECUTE_BURST: 추가 정화량 */
  effect_value: number;
  /** PERIODIC_HEAL: 몇 턴마다 발동 | EXECUTE_BURST: 타락 게이지 몇 % 이하일 때 발동(0=해당없음) */
  trigger_value: number;
  /** UI 툴팁에 그대로 노출되는 설명(예: "체력 +15 (고정)") */
  description: string;
  skill_id: string;
  /** PERMANENT(도감 영구, 이후 스테이지에도 유지) | RESIDENT(이 스테이지 한정, 종료 후 정착) */
  roster_scope: "PERMANENT" | "RESIDENT";
  note: string;
}

/**
 * XOOX 구조 조우 — 액션/정화 "전투"와 완전히 분리된 별개 시스템(rescue_*_config).
 * 마주 보는 VS가 아니라, 오염된 동물 한 마리를 5턴 안에 정화(정화도 100%)해서 구조하는 단판 퍼즐.
 * 동물마다 좋아하는/싫어하는 접근(태그)이 달라 공략법이 있고, 그걸 힌트로 읽어내는 재미(카피바라고식).
 */
export interface RescueApproachDef {
  /** 접근 태그(GENTLE/BOLD/WAIT/…) — animal의 liked/disliked_tags와 매칭 */
  tag: string;
  /** 2지선다 버튼에 그대로 노출되는 문구 */
  label: string;
  /** SOFT | BOLD | TREAT | PLAY — 대비되는 2지선다 페어 구성 참고용 */
  cluster: string;
  note: string;
}

export interface RescueAnimalDef {
  animal_id: string;
  type: "DOG" | "CAT";
  name: string;
  icon: string;
  /** 이 동물이 등장하는 스테이지(stage_map_config.stage_map_id) */
  stage_map_id: string;
  /** 정화도가 오르는 접근 태그들 */
  liked_tags: string[];
  /** 정화도가 깎이는 접근 태그들 */
  disliked_tags: string[];
  /** 조우 시 공략법을 귀띔하는 연출 텍스트 */
  hint_text: string;
  /** 정화도 목표(기본 100) */
  purify_goal: number;
  /** 단판 최대 턴(기본 5) */
  max_turns: number;
  /** 구조 성공 시 합류하는 party_member_config.member_id */
  reward_member_id: string;
  /** 실패 후 다시 조우할 확률(%) — 스폰 가중 참고용 */
  reencounter_chance: number;
  gold: number;
  exp: number;
  note: string;
}

/** 접근 결과 반응 텍스트 풀 (rescue_reaction_config) — outcome: GOOD | BAD | NEUTRAL */
export interface RescueReactionDef {
  outcome: string;
  text: string;
}

/** 정화도 구간별 동물 상태 라벨 (rescue_state_config) */
export interface RescueStateDef {
  min_pct: number;
  label: string;
  mood_icon: string;
  note: string;
}

/** 진입 컷신 대사 (cutscene_config) — speaker 비면 나레이션(가운데) */
export interface CutsceneLineDef {
  scene_id: string;
  order: number;
  speaker: string;
  icon: string;
  line: string;
}

/** 리더 코멘터리 (commentary_config) — 구조/전투/이벤트 순간의 실시간 반응 대사 */
export interface CommentaryDef {
  /** RESCUE_START | RESCUE_WIN | RESCUE_FAIL | RESCUE_PASS | RESCUE_SWAP | COMBAT_START | COMBAT_WIN | LEVELUP | DAY_EVENT */
  trigger: string;
  speaker: string;
  icon: string;
  line: string;
}

/** Day 고정 필러 이벤트 (day_event_config) — 정착 구간 텍스트를 코드에 안 박고 데이터로 관리 */
export interface DayEventDef {
  day: number;
  /** TEAM_LOCK — 이후 동료 합류 중단 선언(state.teamLocked=true) */
  event_type: "NARRATIVE" | "BUFF" | "DEBUFF" | "RECOVERY" | "CHOICE" | "TEAM_LOCK";
  /** PURIFY_POWER(정화력 버프 % 누적) | HP(모험가 purifyHp, 자기 purifyMaxHp 기준 %) */
  stat_field: string;
  value_pct: number;
  /** CHOICE 전용 공감 게이지 누적치 */
  empathy_gain: number;
  flavor_text: string;
}

/** 적 스킬 카탈로그 (enemy_skill_config) */
export interface EnemySkillDef {
  enemy_skill_id: string;
  skill_name: string;
  icon: string;
  /** BASIC | COMBO | THROW | START | SHIELD | RAGE */
  action_slot: string;
  effect_text: string;
  show_icon: boolean;
  note: string;
}

/** 패턴 → 스킬 배치 (enemy_pattern_config) */
export interface EnemyPatternRow {
  pattern_id: string;
  enemy_skill_id: string;
  chance_pct: number;
  value: number;
  /** FLAT | ATK_RATIO */
  value_type: string;
  /** 적 HP% 이하일 때 활성 (100=항상, 60=페이즈2…) */
  hp_below_pct: number;
  sort_order: number;
  enabled: boolean;
  note: string;
}

/** 30일 단위 맵 스테이지 (stage_map_config) — 밸런스 구간 */
export interface StageMapDef {
  stage_map_id: string;
  map_order: number;
  display_name: string;
  day_start: number;
  day_end: number;
  enemy_hp_mult: number;
  enemy_atk_mult: number;
  enemy_def_mult: number;
  drop_gold_mult: number;
  drop_exp_mult: number;
  /** CLEAR | EDGE | MID | EARLY (구 FORGIVING | TIGHT 호환) */
  balance_tag: string;
  /** 이 스테이지에서의 활성 동료 슬롯 수(성장형 로스터) — 꽉 차면 교체 */
  party_slots: number;
  note: string;
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
  skill_category: string;
  grant_source: string;
  description: string;
}

export interface SkillLevelDef {
  skill_id: string;
  level: number;
  combat_power_scale: number;
  note: string;
}

export interface SkillEffectRow {
  effect_row_id: string;
  skill_id: string;
  trigger: string;
  trigger_value: number;
  target: string;
  op: string;
  value: number;
  value_type: string;
  enabled: boolean;
  /** PASSIVE | START | THROW | ACTIVE | AFTER_ATTACK | ON_HIT | RAGE | SHIELD */
  action_slot: string;
  note: string;
}

export interface LevelupRuleConfig {
  card_count: number;
  upgrade_offer_min: number;
  upgrade_first_in_list: boolean;
  allow_same_skill_upgrade: boolean;
}

export interface SkillTierDef {
  tier_id: string;
  tier_name: string;
  sort_order: number;
  color: string;
  description: string;
}

export interface ItemDef {
  item_id: string;
  item_name: string;
  icon: string;
  /** CURRENCY | EVENT_CURRENCY | PASSIVE | MATERIAL | SYSTEM */
  category: string;
  /** effect_config.target 과 매칭 (GOLD, VICTORY_FLAG, ARROW…) */
  effect_target: string;
  /** PlayerState 필드명. inventory 이면 state.inventory[item_id] */
  state_key: string;
  stackable: boolean;
  show_in_bar: boolean;
  always_show: boolean;
  event_id: string;
  passive_effect_type: string;
  passive_effect_value: string;
  owned_at_start: boolean;
  description: string;
  sort_order: number;
}

export interface EventDef {
  event_id: string;
  event_name: string;
  item_id: string;
  cap: number;
  milestone_id: string;
  description: string;
  active: boolean;
}

export interface ScenarioStepDef {
  scenario_id: string;
  step_order: number;
  text_id: string;
  grade_id: string;
  linked_effect_ids: string[];
  card_style: string;
  location_id: string;
  branch_id: string;
  description: string;
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
  event_id: string;
  item_id: string;
  currency: string;
  cap: number;
  tier1_effect: string;
  tier1_at: number;
  tier2_effect: string;
  tier2_at: number;
}

export interface CurrencyDef {
  currency_id: string;
  item_id: string;
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

export interface UngradedPoolRow {
  pool_id: string;
  text_id: string;
  effect_id: string;
  weight: number;
}

export interface CombatDayScheduleRow {
  day: number;
  force_combat: boolean;
  tier: string;
  marker: string;
  label: string;
}

export interface KeywordHighlightDef {
  keyword: string;
  color: string;
}

/** Entity 허브: 플레이어/적 유닛 마스터 */
export interface EntityDef {
  entity_id: string;
  display_name: string;
  icon: string;
  side: "PLAYER" | "ENEMY";
  combat_id: string;
  base_stat_profile: string;
  note: string;
}

/** Skill 허브 서브: POOL_* → 티어 */
export interface SkillPoolDef {
  pool_id: string;
  tier_name: string;
  want_upgrade: boolean;
  note: string;
}

/** Effect 허브 보조: 분기 의사링크 타입 선언 */
export interface ContentLinkDef {
  link_key: string;
  link_type: string;
  ref_id: string;
  note: string;
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
  minigameEntries: MinigameEntryDef[];
  minigameRewards: MinigameRewardRow[];
  combats: CombatDef[];
  levelups: LevelupDef[];
  skills: SkillDef[];
  skillTiers: SkillTierDef[];
  skillLevels: SkillLevelDef[];
  skillEffects: SkillEffectRow[];
  skillPools: SkillPoolDef[];
  levelupRules: LevelupRuleConfig;
  gauges: GaugeDef[];
  phases: PhaseDef[];
  contentTypes: ContentTypeDef[];
  milestones: MilestoneDef[];
  items: ItemDef[];
  events: EventDef[];
  scenarioSteps: ScenarioStepDef[];
  currencies: CurrencyDef[];
  passives: PassiveItemDef[];
  ungradedPool: UngradedPoolRow[];
  combatSchedule: CombatDayScheduleRow[];
  keywords: KeywordHighlightDef[];
  uiTexts: Record<string, string>;
  stageModes: StageModeDef[];
  entities: EntityDef[];
  combatEnemies: CombatEnemyDef[];
  enemySkills: EnemySkillDef[];
  enemyPatterns: EnemyPatternRow[];
  contentLinks: ContentLinkDef[];
  /** combat_tuning key → number|string */
  combatTuning: Record<string, string>;
  stageMaps: StageMapDef[];
  /** player_base_stat_config key → value */
  playerBaseStats: Record<string, string>;
  partyMembers: PartyMemberDef[];
  dayEvents: DayEventDef[];
  rescueApproaches: RescueApproachDef[];
  rescueAnimals: RescueAnimalDef[];
  rescueReactions: RescueReactionDef[];
  rescueStates: RescueStateDef[];
  commentary: CommentaryDef[];
  cutscenes: CutsceneLineDef[];
  areas: AreaDef[];
  areaConnections: AreaConnectionDef[];
  areaNpcs: AreaNpcDef[];
  /** 퀘스트 원 구역 — 비트·동선 */
  areaZones: AreaZoneDef[];
  /** 배경 오브(집·소품) 고정 배치 */
  areaProps: AreaPropDef[];
  tigonMemories: TigonMemoryDef[];
  /** 무지개섬 파견 작업 풀 — 슬롯 밖 동료 day tick */
  islandTasks: IslandTaskDef[];
  /** S8 — 로비 섬 탭무브 핫스팟 */
  islandSpots: IslandSpotDef[];
  /** 정화제 탄창 필요량 (해금·감옥·습격) */
  purifyAmmoCosts: PurifyAmmoCostDef[];
  /** 36 정화 촉매 */
  purifyCatalysts: PurifyCatalystDef[];
  /** 36 오염 지점(지역/생명) */
  purifyBlights: PurifyBlightDef[];
  /** S7 Memory Battle 라운드 */
  memoryBattleRounds: MemoryBattleRoundDef[];
  /** 43 — 필러 대화(리더 채팅 · 방랑자 독백) */
  dialogues: DialogueLineDef[];
  /** 43 — 장(章) 헤더 */
  chapters: ChapterDef[];
  /** 지역 퀘스트 — CSV로 넣고 뺌 */
  questChains: QuestChainDef[];
  questSteps: QuestStepDef[];
  questSpots: QuestSpotDef[];
  /** 43 S4 — 섹터 사이클 비트 */
  sectorBeats: SectorBeatDef[];
  /** 길 판정 — 등급 → 이동 모드 */
  pathJudgments: PathJudgmentDef[];
  /** 3D 뷰 제자리 경쟁 미니게임 — 전투를 대신하는 콘텐츠 축 */
  arenas: ArenaDef[];
  /** 섹터 원흉 — 대화 통과 후 물질 제거 */
  culprits: CulpritDef[];
  culpritConds: CulpritCondDef[];
  culpritTalks: CulpritTalkDef[];
  /** 한 판 — 원 수 = 도전 횟수 */
  islandRun: IslandRunDef;
}

export interface IslandRunDef {
  run_id: string;
  circle_count: number;
  attempt_count: number;
}

/** S8 — 무지개섬 탭무브 지점 */
export interface IslandSpotDef {
  spot_id: string;
  x_pct: number;
  y_pct: number;
  icon: string;
  label: string;
  flavor_text: string;
  /** GREET | TERMINAL | DEPART | DISPATCH | PARTY | ADVENTURE | NONE */
  action: string;
  note: string;
}

/** 섹터 원흉 — 대화로 열고 정화제로 걷는다 */
export interface CulpritDef {
  culprit_id: string;
  area_id: string;
  display_name: string;
  first_line: string;
  fail_kind: "talk_retry" | "circle_reset";
  difficulty: "easy" | "hard";
  loop_npc_id: string;
  talk_fail_line: string;
}

export interface CulpritCondDef {
  culprit_id: string;
  cond_id: string;
  hud_label: string;
  fill_kind: "stain" | "rescue" | "memory";
}

export interface CulpritTalkDef {
  culprit_id: string;
  step_order: number;
  prompt: string;
  pass_label: string;
  fail_label: string;
  need_cond_id: string;
  pass_line: string;
  fail_line: string;
}

/** S7 — 60일 결말 대화 정화 라운드 */
export interface MemoryBattleRoundDef {
  round_order: number;
  prompt: string;
  opt_good: string;
  opt_bad: string;
  good_line: string;
  bad_line: string;
  /** 보유 시 이 라운드 성공 시 추가 여운(선택 자체는 동일) */
  memory_boost_id: string;
  note: string;
}

/** 정화제 탄창 필요량 — purify_ammo_cost.csv */
export interface PurifyAmmoCostDef {
  sink_id: string;
  need: number;
  label: string;
}

/** 정화 촉매 — 탐구로 줍고 오염에 적용 (36) */
export interface PurifyCatalystDef {
  catalyst_id: string;
  display_name: string;
  icon: string;
  flavor_text: string;
  note: string;
}

/** 오염 지점 — AREA=지역 정화 · LIFE=생명 정화 (36) */
export interface PurifyBlightDef {
  blight_id: string;
  display_name: string;
  icon: string;
  needs_catalyst_id: string;
  /** AREA | LIFE */
  target_kind: "AREA" | "LIFE";
  target_ref: string;
  success_flavor: string;
  /** AREA일 때 맵 밝기 강도 0~1 (레거시/지도용) */
  area_tint: number;
  /** Cozy식 원형 색 회복 반지름 — 맵 짧은 변 기준 % */
  reveal_radius_pct: number;
  /** 43 — 왜 정화하는가. 정화 카드에 한 줄로 붙는다(목적이 안 보이면 그냥 청소가 된다) */
  purpose_text: string;
  note: string;
}

/**
 * 43 — 필러 대화. 코멘터리(1줄)와 달리 **여러 줄이 주고받는다.**
 * style: BUBBLE(리더 왼쪽) · ME(방랑자 오른쪽) · MONO(박스 없는 독백)
 */
export interface DialogueLineDef {
  dialogue_id: string;
  /**
   * 43 S2 — 언제 나올지를 **데이터가** 정한다(코드에 ID를 박지 않는다).
   * JOURNEY_START · FIRST_RESCUE · AREA_ENTER · NODE_KIND · PURIFY_PCT · VOYAGE_END
   */
  trigger: string;
  /** AREA_ENTER=area_id · NODE_KIND=trigger_type · PURIFY_PCT=임계값(%) */
  trigger_ref: string;
  step_order: number;
  speaker: string;
  icon: string;
  style: "BUBBLE" | "ME" | "MONO";
  line: string;
}

/**
 * 43 S4 — 섹터 사이클 비트. 시나리오·필러의 뼈대.
 * 순서(order)는 고정, **안의 대상·횟수는 랜덤**이다(지시자 확정).
 * `node_types`가 `BLIGHT_APPLY`면 B1에서 고른 오염 자리로 되돌아간다.
 */
export interface SectorBeatDef {
  beat_order: number;
  beat_id: string;
  label: string;
  /** `|` 구분 trigger_type 목록 */
  node_types: string[];
  min_count: number;
  max_count: number;
  /** 갈림길 비트 — 플레이어가 다음 섹터를 고른다 */
  is_fork: boolean;
  note: string;
}

/**
 * 길 판정 — 등급이 곧 「갈림길(수동) vs 자동 랜덤」이다.
 * 로그라이크 동선: 유저마다 길이 달라지게 하는 핵심 축.
 */
export type PathTravelMode = "FORK_GOOD" | "FORK_COSTLY" | "RANDOM_SAFE" | "RANDOM_BAD";

export interface PathJudgmentDef {
  grade_id: string;
  travel_mode: PathTravelMode;
  body: string;
  body_line2: string;
  /** FORK_COSTLY에서 선택 시 적용 (없으면 대가 없음) */
  choice_cost_effect_id: string;
  note: string;
}

/**
 * 경쟁 미니게임의 상대 종류.
 *
 * 지시자 확정: **한 종류만 두지 않는다.** CLOCK·BLIGHT를 번갈아 주고,
 * SCAVENGER를 간혹 스파이크로 섞는다. 그래서 상대를 코드에 박지 않고 데이터로 둔다.
 * - CLOCK: 상대 없이 제한시간과 경쟁
 * - BLIGHT: 퍼지는 오염 속도와 경쟁 (정화 톤과 가장 잘 붙는다)
 * - SCAVENGER: 같은 걸 노리는 라이벌 수집꾼 NPC. 지면 그 자원을 빼앗긴다
 */
export type ArenaRivalKind = "CLOCK" | "BLIGHT" | "SCAVENGER";

/** 3D 뷰 안에서 제자리 진행되는 경쟁 미니게임 정의 (arena_config.csv) */
export interface ArenaDef {
  arena_id: string;
  display_name: string;
  rival_kind: ArenaRivalKind;
  rival_icon: string;
  rival_label: string;
  /** 이겨야 하는 수집 횟수 */
  goal: number;
  /** CLOCK 제한시간(초). 0이면 시간 제한 없음 */
  duration_sec: number;
  /** 상대가 초당 채우는 양 — BLIGHT는 확산 속도, SCAVENGER는 수집 속도 */
  rival_speed: number;
  /** 승리 보상 — 기존 effect_config를 그대로 쓴다 */
  reward_effect_id: string;
  flavor_text: string;
  win_text: string;
  lose_text: string;
  note: string;
}

/** 43 S2 — 스폰 섹터를 코드가 아니라 데이터가 정한다 */
export interface AreaSpawnFlag {
  is_spawn: boolean;
}

/** 43 — 장(章) 헤더. 일차 헤더 위 단계로, 섹터에 들어설 때 한 번 */
export interface ChapterDef {
  chapter_id: string;
  area_id: string;
  title: string;
  subtitle: string;
  note: string;
}

/** 퀘스트 체인 한 지역. 넣고 빼기는 step.enabled */
export interface QuestChainDef {
  chain_id: string;
  area_id: string;
  title: string;
  active: boolean;
  note: string;
}

export type QuestStepKind =
  | "FILLER"
  | "SEARCH"
  | "CONTENT"
  | "BRANCH"
  | "APPLY_STAINS"
  | "TINT"
  | "INVADE"
  | "CULPRIT";

/** 한 칸 정화 퀘스트 스텝. stage는 나중에 1·2·3으로 나눈다. */
export interface QuestStepDef {
  step_id: string;
  chain_id: string;
  stage: number;
  sort_order: number;
  enabled: boolean;
  kind: QuestStepKind;
  content_kind: string;
  tint_step: number;
  /** south west east center north. 빈 값이면 안 걷는다 */
  place: string;
  /** INVADE 마리 수. 0이면 기본 2 */
  hunt_count: number;
  title: string;
  hud_label: string;
  receive_text_id: string;
  prep_text_id: string;
  reward_text_id: string;
  tip_dialogue_id: string;
  note: string;
}

/** SEARCH 가짜/진짜 후보. 진짜는 스텝당 최소 1 */
export interface QuestSpotDef {
  spot_id: string;
  step_id: string;
  sort_order: number;
  is_real: boolean;
  content_kind: string;
  flavor_text_id: string;
  weight: number;
  place: string;
  note: string;
}

/** 36 — 탐방 맵에 쌓인 색 회복 원(거점). 비주얼 SSoT. */
export interface PurifyFocus {
  blightId: string;
  areaId: string;
  xPct: number;
  yPct: number;
  radiusPct: number;
}

/** 파견 작업 한 줄 (island_task_config) */
export interface IslandTaskDef {
  task_id: string;
  /** rescue liked_tags와 매칭. 비면 폴백 후보 */
  liked_tag_hint: string;
  /** %s = 펫 이름 */
  flavor_text: string;
  gold: number;
  exp: number;
  note: string;
}

/**
 * Tigon 기억 조각 — 탐방 맵에 숨겨진 선택적 수집물(29번 문서 §0-1: 수동 탐방=숨은 콘텐츠).
 * 메인 진행에는 관여하지 않는다. 다 모으면 Tigon의 서사가 완성된다.
 */
export interface TigonMemoryDef {
  memory_id: string;
  order: number;
  /** MAP_FIND = 맵에서 발견(현재 유일) · 이후 DAY/STAGE 등으로 확장 가능 */
  unlock_trigger: string;
  unlock_value: string;
  scenario_text: string;
  /** 이 조각을 보고 반응할 리더 */
  reactor: string;
  reaction_text: string;
}

/**
 * 탐방 지역 — 위에서 내려다보는(탑뷰) 한 구역.
 * 화면보다 세로로 긴 "월드"를 두고, 플레이어가 위로 전진하면 카메라가 따라 올라간다.
 * 배경 아트 전까지는 색으로 플레이스홀더를 그린다(`background_asset`이 있으면 그쪽 우선).
 */
export interface AreaDef {
  area_id: string;
  display_name: string;
  /** 월드 위쪽(멀리) 색 */
  ground_top: string;
  /** 월드 아래쪽(가까이) 색 */
  ground_bottom: string;
  /** 가운데 길 색 */
  path_color: string;
  /** 월드 높이 = 화면 높이의 몇 % (200이면 두 화면 분량) */
  world_h_pct: number;
  background_asset: string;
  stage_map_id: string;
  /** 43 S2 — 외출 스폰 섹터. 코드에 "area_i21"을 박지 않는다 */
  is_spawn: boolean;
  note: string;
}

/** 지역 간 통로. 한 섬 3×3 격자 — TOP/BOTTOM/LEFT/RIGHT. */
export interface AreaConnectionDef {
  connection_id: string;
  from_area_id: string;
  to_area_id: string;
  /** 월드의 어느 끝으로 나가는지 */
  exit_point: "TOP" | "BOTTOM" | "LEFT" | "RIGHT";
  bidirectional: boolean;
  unlock_condition: string;
}

/** 지역 안에 놓인 상호작용 지점(이벤트·구조 조우 등의 진입점) */
export interface AreaNpcDef {
  npc_id: string;
  area_id: string;
  /** 월드 가로폭 기준 위치(%) */
  x_pct: number;
  /** 월드 세로 기준 위치(%) — 0=맨 위, 100=맨 아래 */
  y_pct: number;
  icon: string;
  label: string;
  /** MEMO=플레이버 텍스트만 · 이후 RESCUE/EVENT 등으로 확장 */
  trigger_type: string;
  trigger_ref: string;
  appear_condition: string;
  flavor_text: string;
  /** 퀘스트 원 — area_zone_config.zone_id */
  zone_id?: string;
}

/** 섹터 안 퀘스트 원 — 서로 안 겹치게 배치 */
export interface AreaZoneDef {
  zone_id: string;
  area_id: string;
  x_pct: number;
  y_pct: number;
  r_pct: number;
  beat_id: string;
  label: string;
  note: string;
}

/** 배경 오브젝트(집·나무·소품) — NPC와 분리 */
export interface AreaPropDef {
  prop_id: string;
  area_id: string;
  kind: string;
  x_pct: number;
  y_pct: number;
  yaw_deg: number;
  h_m: number;
  group_id: string;
  collide: boolean;
  /** AREA 파도 후에도 스케치로 남아 총으로 칠하는 타깃 */
  purify_target: boolean;
  /** 있으면 생명 뭉치 — 총 정화 후 동반 합류 (purify_blight LIFE) */
  life_blight_id: string;
  /** 스티커 PNG (/art/...) — 배경 제거본. 있으면 kind 폴백 대신 사용 */
  art: string;
  note: string;
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
  /** item_id → 수량 (state_key=inventory 인 아이템) */
  inventory: Record<string, number>;
  gaugeCounts: Record<string, number>;
  learnedSkills: string[];
  seenLocations: Set<string>;
  finalBossDefeated: boolean;
  claimedMilestones: Set<string>;
  ownedPassives: Set<string>;
  /** 신화 부활 1회 소모 */
  revivalUsed: boolean;
  /** XOOX 정화 전투 전용 HP — 액션 전투 hp/atk/def와는 별개 축. 전투 유닛은 모험가 1명(합류 동료는 버프만 부여). */
  purifyHp: number;
  purifyMaxHp: number;
  /** Day20류 "이제부터 동료 합류 없음" 선언 이후 true */
  teamLocked: boolean;
  /** 정화력 버프 %(day_event PURIFY_POWER + 동료 합류 purify_buff_pct 동일 축에 누적) */
  purifyBuffPct: number;
  /** 지금까지 합류한 동료(버프 소스) member_id 목록 — 비주얼 배지·도감용 */
  joinedPartyMembers: string[];
  /** roster_scope=PERMANENT로 영구 소장된 member_id 목록(도감) */
  permanentPartyMembers: string[];
  /** 탐방 맵에서 주운 Tigon 기억 조각 memory_id 목록(스크랩북) */
  collectedMemories: string[];
  /** 탐방 맵에서 클리어한 노드 npc_id 목록(관문 잠금·소진 표시용) */
  clearedNodes: string[];
  /** 구조 조우로 정화 성공(구조 완료)한 animal_id 목록 — 스테이지 풀에서 제외됨 */
  rescuedAnimals: string[];
  /** 필드에서 만난 점구름 펫 id (Tobby·Bolinha·Vrum) — 로비 배 위 표시 */
  fieldPets: string[];
  /** 정화제 탄창 — 해금·감옥·습격이 같이 씀 */
  purifyAmmo: number;
  /** 들판 루프 투척 — 흡착(얼룩) */
  throwAdsorb: number;
  throwAdsorbCap: number;
  /** 들판 루프 투척 — 억제(벌레) */
  throwInhibit: number;
  throwInhibitCap: number;
  /** 들판 루프 투척 — 원흉 처치제(희소 재산) */
  throwCulprit: number;
  throwCulpritCap: number;
  /** 36 — 소지 중인 정화 촉매 catalyst_id */
  heldCatalysts: string[];
  /** 36 — 지역 정화된 area_id */
  purifiedAreas: string[];
  /** 36 — 적용 완료한 blight_id */
  purifiedBlights: string[];
  /** AREA 후에도 남은 스케치 오브 — 칼라 총으로 칠한 prop_id */
  purifiedProps: string[];
  /** 36 — Cozy식 원형 색 회복 거점(맵 마스크) */
  purifyFoci: PurifyFocus[];
  /** 한 판 도전 남은 횟수 · 상한(원 수) */
  purifyAttemptsLeft: number;
  purifyAttemptCap: number;
  /** 칸 클리어 기록 — 스크랩·도감과 다른 칸 */
  areaClearRecords: AreaClearRecord[];
}

/** 한 칸을 닫은 시간 어택. 낮을수록 빠르다. */
export interface AreaClearRecord {
  areaId: string;
  days: number;
  unlucky: number;
  mashOk: number;
  mashSlow: number;
  bestDays: number;
}
