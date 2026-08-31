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
  EnemySkillDef,
  PartyMemberDef,
  DayEventDef,
  RescueAnimalDef,
  RescueApproachDef,
  RescueStateDef,
  PurifyBlightDef,
  PurifyCatalystDef,
  TigonMemoryDef,
} from "./types";
import { weightedPick, randInt } from "./rng";

/** BLIGHT 노드에서 blight_id에 해당하는 맵 좌표를 찾는다. */
export function findBlightNpc(
  data: GameData,
  blightId: string
): { areaId: string; xPct: number; yPct: number } | undefined {
  const npc = data.areaNpcs.find(
    (n) => n.trigger_type.toUpperCase() === "BLIGHT" && n.trigger_ref === blightId
  );
  if (!npc) return undefined;
  return { areaId: npc.area_id, xPct: npc.x_pct, yPct: npc.y_pct };
}

/** 세이브에 foci가 비어 있어도 purifiedBlights로부터 원을 복구 */
export function rebuildPurifyFoci(data: GameData, state: PlayerState) {
  if (!state.purifyFoci) state.purifyFoci = [];
  for (const blightId of state.purifiedBlights) {
    if (state.purifyFoci.some((f) => f.blightId === blightId)) continue;
    const blight = data.purifyBlights.find((b) => b.blight_id === blightId);
    if (!blight) continue;
    const spot = findBlightNpc(data, blightId);
    const areaId =
      spot?.areaId ||
      (blight.target_kind === "AREA" ? blight.target_ref : "") ||
      "";
    if (!areaId) continue;
    state.purifyFoci.push({
      blightId,
      areaId,
      xPct: spot?.xPct ?? 50,
      yPct: spot?.yPct ?? 50,
      radiusPct: blight.reveal_radius_pct || (blight.target_kind === "LIFE" ? 18 : 28),
    });
  }
}

export function createInitialState(data: GameData): PlayerState {
  const lvl1 = data.levelups.find((l) => l.level === 1);
  const base = (key: string, fallback: number) => {
    const v = data.playerBaseStats?.[key];
    if (v === undefined || v === "") return fallback;
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };
  const maxHp = base("base_max_hp", 18000);
  const hp = base("base_hp", maxHp);
  const circles = data.areaNpcs.filter((n) => n.trigger_type.toUpperCase() === "PURIFY").length;
  const cap = circles > 0 ? circles : (data.islandRun?.attempt_count ?? 2);
  return {
    day: 0,
    level: 1,
    exp: 0,
    expToNext: lvl1?.exp_to_next ?? 100,
    hp,
    maxHp,
    atk: base("base_atk", 3200),
    def: base("base_def", 900),
    gold: 0,
    starFragment: 0,
    feed: 0,
    victoryFlag: 0,
    ancientSuccession: 0,
    inventory: {},
    gaugeCounts: {},
    learnedSkills: [],
    seenLocations: new Set(),
    finalBossDefeated: false,
    claimedMilestones: new Set(),
    ownedPassives: new Set(data.passives.filter((p) => p.owned_at_start).map((p) => p.item_id)),
    revivalUsed: false,
    purifyHp: base("base_purify_hp", 80),
    purifyMaxHp: base("base_purify_hp", 80),
    teamLocked: false,
    purifyBuffPct: 0,
    joinedPartyMembers: [],
    permanentPartyMembers: [],
    collectedMemories: [],
    clearedNodes: [],
    rescuedAnimals: [],
    fieldPets: [],
    purifyAmmo: 0,
    throwAdsorb: 0,
    throwAdsorbCap: 0,
    throwInhibit: 0,
    throwInhibitCap: 0,
    throwCulprit: 0,
    throwCulpritCap: 0,
    heldCatalysts: [],
    purifiedAreas: [],
    purifiedBlights: [],
    purifiedProps: [],
    purifyFoci: [],
    purifyAttemptCap: cap,
    purifyAttemptsLeft: cap,
    areaClearRecords: [],
  };
}

/** 36 — 촉매 줍기 */
export function collectCatalyst(data: GameData, state: PlayerState, catalystId: string): boolean {
  const cat = data.purifyCatalysts.find((c) => c.catalyst_id === catalystId);
  if (!cat) return false;
  if (state.heldCatalysts.includes(catalystId)) return false;
  state.heldCatalysts.push(catalystId);
  return true;
}

export interface PurifyApplyResult {
  ok: boolean;
  reason?: "missing_blight" | "already" | "need_catalyst" | "wrong_catalyst";
  blight?: PurifyBlightDef;
  catalyst?: PurifyCatalystDef;
  consumedId?: string;
}

/** 36 — 오염에 촉매 적용. 성공 시 촉매 1개 소모 · Cozy 원형 focus push. */
export function tryApplyPurify(
  data: GameData,
  state: PlayerState,
  blightId: string,
  opts?: { skipCatalyst?: boolean },
): PurifyApplyResult {
  const blight = data.purifyBlights.find((b) => b.blight_id === blightId);
  if (!blight) return { ok: false, reason: "missing_blight" };
  if (state.purifiedBlights.includes(blightId)) return { ok: false, reason: "already", blight };

  const need = blight.needs_catalyst_id;
  let heldIdx = -1;
  if (!opts?.skipCatalyst) {
    heldIdx = state.heldCatalysts.indexOf(need);
    if (heldIdx < 0) {
      const hasAny = state.heldCatalysts.length > 0;
      return {
        ok: false,
        reason: hasAny ? "wrong_catalyst" : "need_catalyst",
        blight,
        catalyst: data.purifyCatalysts.find((c) => c.catalyst_id === need),
      };
    }
    state.heldCatalysts.splice(heldIdx, 1);
  }
  state.purifiedBlights.push(blightId);
  if (blight.target_kind === "AREA" && blight.target_ref && !state.purifiedAreas.includes(blight.target_ref)) {
    state.purifiedAreas.push(blight.target_ref);
  }

  // 맵 비주얼 SSoT — NPC 좌표에 원형 색 회복 거점
  if (!state.purifyFoci) state.purifyFoci = [];
  if (!state.purifyFoci.some((f) => f.blightId === blightId)) {
    const spot = findBlightNpc(data, blightId);
    const areaId =
      spot?.areaId ||
      (blight.target_kind === "AREA" ? blight.target_ref : "") ||
      "";
    if (areaId) {
      state.purifyFoci.push({
        blightId,
        areaId,
        xPct: spot?.xPct ?? 50,
        yPct: spot?.yPct ?? 50,
        radiusPct: blight.reveal_radius_pct || (blight.target_kind === "LIFE" ? 18 : 28),
      });
    }
  }

  return {
    ok: true,
    blight,
    catalyst: data.purifyCatalysts.find((c) => c.catalyst_id === need),
    consumedId: opts?.skipCatalyst ? undefined : need,
  };
}

/**
 * XOOX 정화 전투 — 전투 유닛은 모험가 1명뿐(hp 공유 풀 없음, 배열도 없음).
 * 공격이 아니라 corruption_gauge를 0으로 만들면 승리.
 * 【확정, 2026-07-17, 18_XOOX_정화전투_연출.md §2】 합류 동료는 모호한 %버프가 아니라
 * FLAT_HP(고정 스탯, 합류 즉시 1회 적용) / PERIODIC_HEAL(주기 스킬) / EXECUTE_BURST(조건 스킬) 중 하나로 기여한다.
 */
export interface PurifyTurnLog {
  turn: number;
  purifyDealt: number;
  corruptionRemaining: number;
  regen: number;
  purifyHp: number;
  purifyMaxHp: number;
  /** 이 턴에 발동한 동료 스킬 텍스트(없으면 빈 배열) — UI가 로그에 강조 표시 */
  skillLogs: string[];
}

export interface PurifyCombatResult {
  won: boolean;
  wiped: boolean;
  turns: number;
  logs: PurifyTurnLog[];
  corruptionGaugeMax: number;
  goldEarned: number;
  expEarned: number;
}

export function simulatePurifyCombat(
  data: GameData,
  state: PlayerState,
  combatId: string | undefined
): PurifyCombatResult {
  const enemy = combatId ? data.combatEnemies.find((e) => e.combat_id === combatId) : undefined;
  const trigger = combatId ? data.combats.find((c) => c.combat_id === combatId) : undefined;
  const maxTurns = 200;
  const corruptionMax = enemy?.enemy_hp ?? 100;
  let corruption = corruptionMax;
  const contactDmg = enemy?.enemy_atk ?? 5;
  const isMiniboss = combatId?.includes("miniboss");
  const basePurify = (() => {
    const v = Number(data.playerBaseStats?.["base_purify"]);
    return Number.isFinite(v) ? v : 18;
  })();
  const purifyPower = basePurify * (1 + state.purifyBuffPct / 100);

  const joinedMembers = state.joinedPartyMembers
    .map((id) => data.partyMembers.find((m) => m.member_id === id))
    .filter((m): m is PartyMemberDef => !!m);
  const periodicHealers = joinedMembers.filter((m) => m.effect_type === "PERIODIC_HEAL");
  const executeBursters = joinedMembers.filter((m) => m.effect_type === "EXECUTE_BURST");
  const burstFired = new Set<string>(); // 조건 스킬은 한 전투당 1회만

  const logs: PurifyTurnLog[] = [];
  let turn = 0;
  while (corruption > 0 && state.purifyHp > 0 && turn < maxTurns) {
    turn += 1;
    const skillLogs: string[] = [];
    corruption = Math.max(0, corruption - purifyPower);

    let regen = 0;
    if (isMiniboss && turn % 3 === 0) {
      regen = Math.round(corruptionMax * 0.15);
      corruption = Math.min(corruptionMax, corruption + regen);
    }

    state.purifyHp = Math.max(0, state.purifyHp - contactDmg);

    // PERIODIC_HEAL — 주기마다 자동 회복
    for (const m of periodicHealers) {
      if (m.trigger_value > 0 && turn % m.trigger_value === 0) {
        const healAmt = (state.purifyMaxHp * m.effect_value) / 100;
        state.purifyHp = Math.min(state.purifyMaxHp, state.purifyHp + healAmt);
        skillLogs.push(`💚 ${m.display_name} 치유 발동! 체력 +${m.effect_value}%`);
      }
    }

    // EXECUTE_BURST — 타락 게이지가 기준 % 이하로 떨어지면 1회 발동
    for (const m of executeBursters) {
      if (!burstFired.has(m.member_id) && corruption > 0 && corruption <= (corruptionMax * m.trigger_value) / 100) {
        corruption = Math.max(0, corruption - m.effect_value);
        burstFired.add(m.member_id);
        skillLogs.push(`🔥 ${m.display_name} 피니셔 발동! 추가 정화 -${m.effect_value}`);
      }
    }

    logs.push({
      turn,
      purifyDealt: purifyPower,
      corruptionRemaining: corruption,
      regen,
      purifyHp: Math.round(state.purifyHp),
      purifyMaxHp: state.purifyMaxHp,
      skillLogs,
    });

    if (corruption <= 0) break;
    if (state.purifyHp <= 0) break;
  }

  const won = corruption <= 0;
  return {
    won,
    wiped: !won,
    turns: turn,
    logs,
    corruptionGaugeMax: corruptionMax,
    goldEarned: won ? randInt(trigger?.gold_min ?? 0, trigger?.gold_max ?? 0) : 0,
    expEarned: won ? randInt(trigger?.exp_min ?? 0, trigger?.exp_max ?? 0) : 0,
  };
}

export interface PartyMemberJoinResult {
  member: PartyMemberDef;
  joinedTeam: boolean;
}

/** 정화 성공 시 동료 합류 처리(redeems_to_member_id) — 이름/순서 추론 없이 combat_enemy_config가 SSoT. */
export function grantPurifyReward(data: GameData, state: PlayerState, combatId: string | undefined): PartyMemberJoinResult | null {
  const enemy = combatId ? data.combatEnemies.find((e) => e.combat_id === combatId) : undefined;
  if (!enemy?.redeems_to_member_id) return null;
  const member = data.partyMembers.find((m) => m.member_id === enemy.redeems_to_member_id);
  if (!member) return null;

  const isFinal = enemy.combat_id.includes("final");
  const joined = !isFinal && !state.teamLocked;
  const alreadyJoined = state.joinedPartyMembers.includes(member.member_id);
  if ((joined || member.roster_scope === "PERMANENT") && !alreadyJoined) {
    state.joinedPartyMembers.push(member.member_id);
    if (member.effect_type === "FLAT_HP") {
      state.purifyMaxHp += member.effect_value;
      state.purifyHp += member.effect_value;
    }
    // PERIODIC_HEAL/EXECUTE_BURST는 simulatePurifyCombat이 state.joinedPartyMembers를 매 턴 조회해 처리한다.
  }
  if (member.roster_scope === "PERMANENT" && !state.permanentPartyMembers.includes(member.member_id)) {
    state.permanentPartyMembers.push(member.member_id);
  }
  return { member, joinedTeam: joined };
}

/** Day 필러 이벤트 적용 — stat_field: PURIFY_POWER(버프 누적) | HP(모험가 purifyHp, purifyMaxHp 기준 %) */
export function applyDayEvent(state: PlayerState, event: DayEventDef): void {
  switch (event.event_type) {
    case "BUFF":
    case "DEBUFF":
      if (event.stat_field === "PURIFY_POWER") {
        state.purifyBuffPct += event.value_pct;
      } else if (event.stat_field === "HP") {
        state.purifyHp = Math.max(0, Math.min(state.purifyMaxHp, state.purifyHp + (state.purifyMaxHp * event.value_pct) / 100));
      }
      break;
    case "RECOVERY":
      state.purifyHp = Math.max(0, Math.min(state.purifyMaxHp, state.purifyHp + (state.purifyMaxHp * event.value_pct) / 100));
      break;
    case "TEAM_LOCK":
      state.teamLocked = true;
      break;
    case "CHOICE":
    case "NARRATIVE":
    default:
      break;
  }
}

export function getDayEvent(data: GameData, day: number): DayEventDef | undefined {
  return data.dayEvents.find((e) => e.day === day);
}

export interface MilestoneReward {
  milestoneName: string;
  atCount: number;
  effectId: string;
}

/** effect_config.target ? item_config ?? */
export function itemByEffectTarget(data: GameData, target: string) {
  return data.items.find((i) => i.effect_target === target);
}

export function getItemAmount(data: GameData, state: PlayerState, itemId: string): number {
  const item = data.items.find((i) => i.item_id === itemId);
  if (!item) return 0;
  if (!item.state_key || item.state_key === "inventory") {
    return state.inventory[item.item_id] ?? 0;
  }
  return (state[item.state_key as keyof PlayerState] as number) ?? 0;
}

export function addItemAmount(data: GameData, state: PlayerState, itemId: string, amount: number) {
  const item = data.items.find((i) => i.item_id === itemId);
  if (!item) return;
  if (!item.state_key || item.state_key === "inventory") {
    state.inventory[item.item_id] = (state.inventory[item.item_id] ?? 0) + amount;
    return;
  }
  const key = item.state_key as keyof PlayerState;
  (state[key] as number) = ((state[key] as number) ?? 0) + amount;
}

export function checkMilestones(data: GameData, state: PlayerState): MilestoneReward[] {
  const out: MilestoneReward[] = [];
  for (const m of data.milestones) {
    let amount = 0;
    if (m.item_id) {
      amount = getItemAmount(data, state, m.item_id);
    } else {
      const item = itemByEffectTarget(data, m.currency);
      if (item) amount = getItemAmount(data, state, item.item_id);
    }
    const tiers: [string, number][] = [
      [m.tier1_effect, m.tier1_at],
      [m.tier2_effect, m.tier2_at],
    ];
    for (let i = 0; i < tiers.length; i++) {
      const [effectId, at] = tiers[i];
      const claimKey = `${m.milestone_id}:${i}`;
      if (effectId && at > 0 && amount >= at && !state.claimedMilestones.has(claimKey)) {
        state.claimedMilestones.add(claimKey);
        out.push({ milestoneName: m.milestone_name, atCount: at, effectId });
      }
    }
  }
  return out;
}

export function pickPhase(data: GameData, day: number) {
  return (
    data.phases.find((p) => day >= p.day_start && day <= p.day_end) ??
    data.phases[data.phases.length - 1]
  );
}

export function scheduleForDay(data: GameData, day: number) {
  return data.combatSchedule.find((s) => s.day === day) ?? null;
}

export function rollIsCombat(data: GameData, day: number): boolean {
  // ??? SSoT: ?? ?? ?? ?? ??/???. ? ? ??? ???(??) ?.
  const sched = scheduleForDay(data, day);
  if (sched) return sched.force_combat;
  return false;
}

export function decideCombatTierFromData(data: GameData, day: number): string {
  const sched = scheduleForDay(data, day);
  if (sched?.tier) return sched.tier;
  // ??? ???(60?)?. ? ? ?? ????.
  if (Math.random() < 0.1) return "MINIBOSS";
  return "NORMAL";
}

/** ?? ?? ?? ??? ?? ???? ?? (??? ?? ??) */
export function timelineMarks(data: GameData, currentDay: number, count = 5) {
  return data.combatSchedule
    .filter((s) => s.day >= currentDay && s.marker)
    .slice(0, count);
}

export function highlightKeywords(data: GameData, text: string): string {
  if (!text || data.keywords.length === 0) return escapeHtml(text);
  type Piece = { start: number; end: number; color: string };
  const hits: Piece[] = [];
  for (const kw of data.keywords) {
    let from = 0;
    while (from < text.length) {
      const idx = text.indexOf(kw.keyword, from);
      if (idx < 0) break;
      const end = idx + kw.keyword.length;
      const overlap = hits.some((h) => idx < h.end && end > h.start);
      if (!overlap) hits.push({ start: idx, end, color: kw.color });
      from = end;
    }
  }
  hits.sort((a, b) => a.start - b.start);
  let out = "";
  let cursor = 0;
  for (const h of hits) {
    if (h.start > cursor) out += escapeHtml(text.slice(cursor, h.start));
    out += `<span class="hl" style="color:${h.color}">${escapeHtml(text.slice(h.start, h.end))}</span>`;
    cursor = h.end;
  }
  if (cursor < text.length) out += escapeHtml(text.slice(cursor));
  return out;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function formatStat(n: number): string {
  const v = Math.round(n);
  if (Math.abs(v) >= 10000) return `${(v / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(v);
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

export function rollUngradedEntry(data: GameData) {
  if (data.ungradedPool.length === 0) return null;
  return weightedPick(data.ungradedPool, (p) => p.weight);
}

/** DIRECT ??? ?? ?. BRANCH_ROUTE? ?? effect LOCATION:id ?? ??. */
export function pickLocation(data: GameData, state: PlayerState): LocationDef {
  const direct = data.locations.filter((l) => l.entry_path === "DIRECT");
  const unseen = direct.filter((l) => !state.seenLocations.has(l.location_id));
  const pool = unseen.length > 0 ? unseen : direct.filter((l) => l.repeatable);
  return pool[randInt(0, pool.length - 1)];
}

export function getLocationById(data: GameData, locationId: string): LocationDef | undefined {
  return data.locations.find((l) => l.location_id === locationId);
}

export const FINAL_CHALLENGE_BRANCH_ID = "b_challenger";

export function pickBranch(data: GameData, day: number, finalBossDefeated: boolean): BranchDef {
  const minDay = tuningNum(data, "final_challenge_min_day", 55);
  const pool = data.branches.filter((b) => {
    if (b.subtype !== "FINAL_CHALLENGE") return true;
    return day >= minDay && !finalBossDefeated;
  });
  return weightedPick(pool, (b) => b.weight || 10);
}

export function pickCombat(data: GameData, tier: string = "NORMAL", avoidId?: string) {
  let pool = data.combats.filter((c) => c.tier === tier);
  if (avoidId && pool.length > 1) {
    const filtered = pool.filter((c) => c.combat_id !== avoidId);
    if (filtered.length > 0) pool = filtered;
  }
  return pool[randInt(0, pool.length - 1)];
}

export function getCombatEnemy(data: GameData, combatId: string) {
  return data.combatEnemies.find((e) => e.combat_id === combatId);
}

/** 22 §2-3 — Memory Battle 직전, 마지막 기억 조각을 강제 언락 */
export function forceUnlockFinaleMemory(
  data: GameData,
  state: PlayerState
): TigonMemoryDef | null {
  const mems = [...(data.tigonMemories ?? [])].sort((a, b) => a.order - b.order);
  const last = mems[mems.length - 1];
  if (!last) return null;
  if (state.collectedMemories.includes(last.memory_id)) return null;
  state.collectedMemories.push(last.memory_id);
  return last;
}

export function memoryBattleWinsNeeded(data: GameData, state: PlayerState): number {
  const rounds = data.memoryBattleRounds?.length ?? 3;
  const got = state.collectedMemories.length;
  const total = data.tigonMemories?.length ?? 8;
  // 기억을 많이 모을수록 통과선이 살짝 낮아짐(2/3 → 기억 충분하면 2 유지, 적으면 3)
  if (got >= total) return Math.max(2, rounds - 1);
  if (got >= Math.ceil(total * 0.5)) return 2;
  return Math.min(rounds, 3);
}

/**
 * S5 모험 — 이미 지난 스테이지 맵만 (현재 맵보다 map_order가 작은 것).
 * 스토리 day를 밀지 않음. 관문/정화/기억 없음.
 */
export function listAdventureMaps(data: GameData, state: PlayerState) {
  const cur = getStageMapForDay(data, state.day);
  const curOrder = cur?.map_order ?? 1;
  return [...data.stageMaps]
    .filter((m) => m.map_order < curOrder)
    .sort((a, b) => a.map_order - b.map_order);
}

export interface AdventurePatrolResult {
  stageMapId: string;
  displayName: string;
  gold: number;
  exp: number;
  flavor: string;
}

/** 로비 모험 1회 — 경량 파밍 롤(풀 전투 시뮬 생략). 골드/EXP만. */
export function runAdventurePatrol(
  data: GameData,
  state: PlayerState,
  stageMapId: string
): AdventurePatrolResult | null {
  const allowed = listAdventureMaps(data, state);
  const map = allowed.find((m) => m.stage_map_id === stageMapId);
  if (!map) return null;

  const mult = tuningNum(data, "adventure_reward_mult", 0.4);
  const baseG = tuningNum(data, "adventure_gold_base", 90);
  const baseE = tuningNum(data, "adventure_exp_base", 28);
  const gold = Math.max(1, Math.round(baseG * (map.drop_gold_mult || 1) * mult));
  const exp = Math.max(1, Math.round(baseE * (map.drop_exp_mult || 1) * mult));
  state.gold += gold;
  state.exp += exp;

  const flavors = [
    `${map.display_name}을 다시 훑었다. 오염 잔재만 조금 걷어냈다.`,
    `${map.display_name} 순찰. 싸울 일은 거의 없었고, 쓸 만한 조각만 주웠다.`,
    `지난 ${map.display_name} 길. 익숙한 공기 속에서 소량 보급을 챙겼다.`,
  ];
  const flavor = flavors[Math.floor(Math.random() * flavors.length)]!;

  return {
    stageMapId: map.stage_map_id,
    displayName: map.display_name,
    gold,
    exp,
    flavor,
  };
}

export function getStageMapForDay(data: GameData, day: number) {
  const maps = [...data.stageMaps].sort((a, b) => a.map_order - b.map_order);
  const hit = maps.find((m) => day >= m.day_start && day <= m.day_end);
  return hit ?? maps[maps.length - 1] ?? null;
}

// ─────────────────────────────────────────────────────────────────────────
// XOOX 구조 조우(rescue) — 전투 파이프라인과 완전히 분리된 별개 시스템.
// 스테이지 풀에 남은(아직 구조 못 한) 동물을 랜덤 스폰 → 5턴 2지선다 정화 퍼즐.
// ─────────────────────────────────────────────────────────────────────────

/** 현재 스테이지에서 아직 구조하지 못한 동물 풀 */
export function rescuePoolForStage(data: GameData, state: PlayerState, day: number): RescueAnimalDef[] {
  const map = getStageMapForDay(data, day);
  if (!map) return [];
  return data.rescueAnimals.filter(
    (a) => a.stage_map_id === map.stage_map_id && !state.rescuedAnimals.includes(a.animal_id)
  );
}

/** 이 날 구조 조우가 스폰되는지 — 풀에 남으면, 첫 조우 보장일이면 100%, 아니면 rescue_spawn_chance(%) */
export function rollIsRescue(data: GameData, state: PlayerState, day: number): boolean {
  if (rescuePoolForStage(data, state, day).length === 0) return false;
  // 첫 구조 조우 보장 — 아직 한 마리도 구조 못 했고 지정 일차면 무조건 스폰(튜토리얼 겸)
  const guaranteedDay = tuningNum(data, "rescue_guaranteed_day", 0);
  if (guaranteedDay > 0 && day === guaranteedDay && state.rescuedAnimals.length === 0) return true;
  const chance = tuningNum(data, "rescue_spawn_chance", 55);
  return Math.random() * 100 < chance;
}

/** 풀에서 랜덤으로 한 마리(재조우 확률로 가중 — 아직 시도 안 한 동물이 우선 등장하도록 기본 가중 100) */
export function pickRescueAnimal(data: GameData, state: PlayerState, day: number): RescueAnimalDef | null {
  const pool = rescuePoolForStage(data, state, day);
  if (pool.length === 0) return null;
  return pool[randInt(0, pool.length - 1)];
}

/** 트리거에 맞는 리더 코멘터리 한 줄(없으면 null) */
export function rollCommentary(data: GameData, trigger: string): { speaker: string; icon: string; line: string } | null {
  const pool = data.commentary.filter((c) => c.trigger === trigger);
  if (pool.length === 0) return null;
  const c = pool[randInt(0, pool.length - 1)];
  return { speaker: c.speaker, icon: c.icon, line: c.line };
}

/** 정화도(%) → 동물 상태 라벨 */
export function rescueStateFor(data: GameData, pct: number): RescueStateDef {
  const states = data.rescueStates.length
    ? data.rescueStates
    : [{ min_pct: 0, label: "", mood_icon: "", note: "" }];
  let hit = states[0];
  for (const s of states) if (pct >= s.min_pct) hit = s;
  return hit;
}

export type RescueOutcome = "GOOD" | "BAD" | "NEUTRAL";

export interface RescueChoiceOption {
  tag: string;
  label: string;
  /** 이 태그가 이 동물에게 어떤 성향인지(내부용, UI엔 노출 안 함) */
  outcome: RescueOutcome;
}

function approachByTag(data: GameData, tag: string): RescueApproachDef | undefined {
  return data.rescueApproaches.find((a) => a.tag === tag);
}

function outcomeOfTag(animal: RescueAnimalDef, tag: string): RescueOutcome {
  if (animal.liked_tags.includes(tag)) return "GOOD";
  if (animal.disliked_tags.includes(tag)) return "BAD";
  return "NEUTRAL";
}

function optionFor(data: GameData, animal: RescueAnimalDef, tag: string): RescueChoiceOption {
  return { tag, label: approachByTag(data, tag)?.label ?? tag, outcome: outcomeOfTag(animal, tag) };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * 한 턴에 보여줄 2지선다 구성 — 무작위처럼 보이되 항상 "의미 있는" 페어가 되도록,
 * 좋아하는/싫어하는/무난한 태그를 섞어 대비되는 두 선택지를 만든다.
 */
export function buildRescueOptions(data: GameData, animal: RescueAnimalDef): [RescueChoiceOption, RescueChoiceOption] {
  const allTags = data.rescueApproaches.map((a) => a.tag);
  const liked = shuffle(animal.liked_tags.filter((t) => allTags.includes(t)));
  const disliked = shuffle(animal.disliked_tags.filter((t) => allTags.includes(t)));
  const neutral = shuffle(allTags.filter((t) => !animal.liked_tags.includes(t) && !animal.disliked_tags.includes(t)));

  const roll = Math.random();
  let a: string | undefined;
  let b: string | undefined;
  if (roll < 0.5 && liked.length && disliked.length) {
    a = liked[0];
    b = disliked[0];
  } else if (roll < 0.8 && liked.length && neutral.length) {
    a = liked[0];
    b = neutral[0];
  } else if (disliked.length && neutral.length) {
    a = disliked[0];
    b = neutral[0];
  }
  // 폴백: 어떤 이유로든 못 채우면 서로 다른 두 태그 아무거나
  if (!a || !b || a === b) {
    const pool = shuffle(allTags);
    a = pool[0];
    b = pool.find((t) => t !== a);
  }
  const opts = shuffle([optionFor(data, animal, a!), optionFor(data, animal, b || allTags[0])]);
  return [opts[0], opts[1]];
}

export interface RescueChoiceResult {
  outcome: RescueOutcome;
  purifyDelta: number;
  reaction: string;
}

/** 선택 태그 → 정화도 증감 + 반응 텍스트 */
export function resolveRescueChoice(data: GameData, animal: RescueAnimalDef, tag: string): RescueChoiceResult {
  const outcome = outcomeOfTag(animal, tag);
  const base =
    outcome === "GOOD"
      ? tuningNum(data, "rescue_good_purify", 28)
      : outcome === "BAD"
      ? tuningNum(data, "rescue_bad_purify", -8)
      : tuningNum(data, "rescue_neutral_purify", 10);
  const variance = tuningNum(data, "rescue_purify_variance", 3);
  const delta = base + randInt(-variance, variance);
  const pool = data.rescueReactions.filter((r) => r.outcome === outcome);
  const reaction = pool.length ? pool[randInt(0, pool.length - 1)].text : "";
  return { outcome, purifyDelta: delta, reaction };
}

/** 이 날(스테이지)의 활성 동료 슬롯 수 */
export function getPartySlots(data: GameData, day: number): number {
  const map = getStageMapForDay(data, day);
  return map?.party_slots ?? 3;
}

export interface IslandDispatchResult {
  memberId: string;
  name: string;
  icon: string;
  line: string;
  gold: number;
  exp: number;
}

/**
 * 무지개섬 파견 day tick — 전투 슬롯을 넘는 합류 동료가 섬에서 소량 보상을 벌어온다.
 * 기획: docs/gdd/23 · 33 · 34 · 35 S2
 */
export function runIslandDispatch(data: GameData, state: PlayerState): IslandDispatchResult[] {
  const slots = getPartySlots(data, Math.max(1, state.day));
  const overflowIds = state.joinedPartyMembers.slice(slots);
  if (!overflowIds.length) return [];

  const tasks = data.islandTasks ?? [];
  const fallbacks = tasks.filter((t) => !t.liked_tag_hint);
  const results: IslandDispatchResult[] = [];

  for (const memberId of overflowIds) {
    const member = data.partyMembers.find((m) => m.member_id === memberId);
    if (!member) continue;
    const animal = data.rescueAnimals.find((a) => a.reward_member_id === memberId);
    const tags = animal?.liked_tags ?? [];
    let pool = tasks.filter((t) => t.liked_tag_hint && tags.includes(t.liked_tag_hint));
    if (!pool.length) pool = fallbacks.length ? fallbacks : tasks;
    if (!pool.length) continue;
    const task = pool[randInt(0, pool.length - 1)]!;
    const line = task.flavor_text.replace(/%s/g, member.display_name);
    state.gold += task.gold;
    state.exp += task.exp;
    results.push({
      memberId,
      name: member.display_name,
      icon: member.icon,
      line: `${member.icon} ${line}`,
      gold: task.gold,
      exp: task.exp,
    });
  }
  return results;
}

/** 지금 활성 로스터가 준 전투 스탯 총합 */
export function partyStatBonuses(data: GameData, state: PlayerState): { hp: number; atk: number } {
  let hp = 0;
  let atk = 0;
  for (const id of state.joinedPartyMembers) {
    const m = data.partyMembers.find((p) => p.member_id === id);
    if (!m) continue;
    if (m.effect_type === "FLAT_HP") hp += m.effect_value;
    else if (m.effect_type === "FLAT_ATK") atk += m.effect_value;
  }
  return { hp, atk };
}

/**
 * 모험가 스탯 = 기본 + 활성 로스터 합. 로스터가 바뀔 때마다(합류/교체) 전부 재계산한다.
 * 가산 방식이라 중복·누락 없이 항상 정확하고, 기존 전투 공식은 안 무너진다.
 */
export function recomputeAdventurerStats(data: GameData, state: PlayerState): void {
  const base = (key: string, fb: number) => {
    const v = data.playerBaseStats?.[key];
    const n = v === undefined || v === "" ? NaN : Number(v);
    return Number.isFinite(n) ? n : fb;
  };
  const baseMaxHp = base("base_max_hp", 18000);
  const baseAtk = base("base_atk", 3200);
  const { hp: addHp, atk: addAtk } = partyStatBonuses(data, state);
  const newMax = baseMaxHp + addHp;
  const delta = newMax - state.maxHp;
  state.maxHp = newMax;
  // 늘어난 만큼은 회복으로 채워주고, 줄면 상한으로 클램프
  state.hp = Math.max(0, Math.min(newMax, state.hp + Math.max(0, delta)));
  state.atk = baseAtk + addAtk;
}

export interface RescueRewardResult {
  member: PartyMemberDef;
  /** 활성 로스터에 바로 합류했는가 */
  joined: boolean;
  /** 슬롯이 꽉 차 교체 결정이 필요한가(도감엔 이미 등록됨) */
  needsSwap: boolean;
}

/**
 * 구조 성공 처리 — 도감(rescuedAnimals) 등록은 항상. 활성 로스터는 슬롯 상한까지만.
 * 슬롯 여유 → 즉시 합류 + 스탯 재계산. 꽉 참 → needsSwap 반환(UI가 교체를 물음).
 */
export function grantRescueReward(data: GameData, state: PlayerState, animal: RescueAnimalDef): RescueRewardResult | null {
  if (!state.rescuedAnimals.includes(animal.animal_id)) {
    state.rescuedAnimals.push(animal.animal_id);
  }
  const member = data.partyMembers.find((m) => m.member_id === animal.reward_member_id);
  if (!member) return null;

  if (state.joinedPartyMembers.includes(member.member_id)) {
    return { member, joined: true, needsSwap: false };
  }
  const slots = getPartySlots(data, state.day);
  if (state.joinedPartyMembers.length < slots && !state.teamLocked) {
    state.joinedPartyMembers.push(member.member_id);
    if (member.roster_scope === "PERMANENT" && !state.permanentPartyMembers.includes(member.member_id)) {
      state.permanentPartyMembers.push(member.member_id);
    }
    recomputeAdventurerStats(data, state);
    return { member, joined: true, needsSwap: false };
  }
  return { member, joined: false, needsSwap: true };
}

/** 교체 — outId 방출, inId 합류 후 스탯 재계산 */
export function swapPartyMember(data: GameData, state: PlayerState, outId: string, inId: string): void {
  const i = state.joinedPartyMembers.indexOf(outId);
  if (i >= 0) state.joinedPartyMembers.splice(i, 1);
  if (!state.joinedPartyMembers.includes(inId)) state.joinedPartyMembers.push(inId);
  recomputeAdventurerStats(data, state);
}

export function getUpgradeSkill(data: GameData, baseSkillId: string): SkillDef | undefined {
  return data.skills.find((s) => s.is_upgrade && s.base_skill_id === baseSkillId);
}

export function getSkillBaseId(skill: SkillDef): string {
  return skill.is_upgrade && skill.base_skill_id ? skill.base_skill_id : skill.skill_id;
}

export function isFullyUpgraded(data: GameData, state: PlayerState, baseSkillId: string): boolean {
  const plus = getUpgradeSkill(data, baseSkillId);
  if (!plus) return state.learnedSkills.includes(baseSkillId);
  return state.learnedSkills.includes(plus.skill_id);
}

export interface LearnSkillResult {
  skill: SkillDef;
  upgraded: boolean;
  replacedId?: string;
}

/** ? ?? ??/????? ?? ??. ??? ??? ?? +?? ? ???+ ??. */
export function learnSkill(data: GameData, state: PlayerState, skillId: string): LearnSkillResult | null {
  let skill = data.skills.find((s) => s.skill_id === skillId);
  if (!skill) return null;

  const allowUpgrade = data.levelupRules?.allow_same_skill_upgrade !== false;
  const baseId = getSkillBaseId(skill);
  const plus = getUpgradeSkill(data, baseId);
  const hasBase = state.learnedSkills.includes(baseId);
  const hasPlus = plus ? state.learnedSkills.includes(plus.skill_id) : false;

  if (hasPlus) return null;

  if (!skill.is_upgrade && hasBase && allowUpgrade && plus) {
    skill = plus;
  }

  if (skill.is_upgrade) {
    if (hasPlus) return null;
    const replaced = hasBase ? baseId : undefined;
    state.learnedSkills = state.learnedSkills.filter((id) => id !== baseId && id !== skill!.skill_id);
    state.learnedSkills.push(skill.skill_id);
    return { skill, upgraded: true, replacedId: replaced };
  }

  if (state.learnedSkills.includes(skill.skill_id)) return null;
  state.learnedSkills.push(skill.skill_id);
  return { skill, upgraded: false };
}

export function getSkillLevelRow(data: GameData, skillId: string) {
  const rows = data.skillLevels.filter((r) => r.skill_id === skillId);
  if (rows.length === 0) return undefined;
  return rows.sort((a, b) => b.level - a.level)[0];
}

/**
 * ??? ATK/DEF ??? ??? ??.
 * skill_level ?? + ??? ??.
 */
export function skillRunLevelCombatMult(data: GameData, state: PlayerState): number {
  const perLevel = tuningNum(data, "skill_per_run_level", 0.008);
  let scale = 1;
  let count = 0;
  for (const id of state.learnedSkills) {
    count++;
    const lv = getSkillLevelRow(data, id);
    scale += (lv?.combat_power_scale ?? 1) - 1;
  }
  if (count <= 0) return 1;
  return Math.max(1, scale + Math.max(0, state.level - 1) * perLevel * count);
}

export function resolveSkillCombatMods(data: GameData, state: PlayerState): {
  skillDmgMult: number;
  dmgTakenMult: number;
  atkMult: number;
  defMult: number;
  maxHpMult: number;
  comboRate: number;
  counterRate: number;
  dodgeRate: number;
  critRate: number;
  healBonusPct: number;
  lightSpearMult: number;
  roundDrAdd: number;
  glassCannonHp: number;
  killHealPct: number;
  comboMax: number;
  comboAtkStack: number;
  rageGainLock: boolean;
  reviveHpPct: number;
} {
  let skillDmgMult = skillRunLevelCombatMult(data, state);
  let dmgTakenMult = 1;
  let atkMult = 1;
  let defMult = 1;
  let maxHpMult = 1;
  let comboRate = 0;
  let counterRate = 0;
  let dodgeRate = 0;
  let critRate = 0;
  let healBonusPct = 0;
  let lightSpearMult = 1;
  let roundDrAdd = 0;
  let glassCannonHp = 0;
  let killHealPct = 0;
  let comboMax = 1;
  let comboAtkStack = 0;
  let rageGainLock = false;
  let reviveHpPct = 0.3;

  for (const id of state.learnedSkills) {
    const rows = (data.skillEffects ?? []).filter(
      (e) => e.skill_id === id && e.enabled && e.trigger === "ALWAYS"
    );
    for (const e of rows) {
      if (e.target === "SKILL_DMG_MULT" && e.op === "ADD") skillDmgMult += e.value;
      if (e.target === "DMG_TAKEN_MULT" && e.op === "MUL") dmgTakenMult *= e.value;
      if (e.target === "ATK_MULT" && e.op === "ADD") atkMult += e.value;
      if (e.target === "DEF_MULT" && e.op === "ADD") defMult += e.value;
      if (e.target === "MAX_HP_MULT" && e.op === "ADD") maxHpMult += e.value;
      if (e.target === "COMBO_RATE" && e.op === "ADD") comboRate += e.value;
      if (e.target === "COUNTER_RATE" && e.op === "ADD") counterRate += e.value;
      if (e.target === "DODGE_RATE" && e.op === "ADD") {
        // HP ?? ??(Critical Dodge)? ?? ? ?? ??
        if (!(e.trigger_value > 0)) dodgeRate += e.value;
      }
      if (e.target === "CRIT_RATE" && e.op === "ADD") critRate += e.value;
      if (e.target === "HEAL_BONUS_PCT" && e.op === "ADD") healBonusPct += e.value;
      if (e.target === "LIGHT_SPEAR_MULT" && e.op === "ADD") lightSpearMult += e.value;
      if (e.target === "ROUND_DR_ADD" && e.op === "ADD") roundDrAdd += e.value;
      if (e.target === "GLASS_CANNON") glassCannonHp = e.trigger_value > 0 ? e.trigger_value : 30;
      if (e.target === "KILL_HEAL_PCT" && e.op === "ADD") killHealPct += e.value;
      if (e.target === "COMBO_MAX" && e.op === "SET") comboMax = Math.max(1, Math.round(e.value));
      if (e.target === "COMBO_ATK_STACK" && e.op === "ADD") comboAtkStack += e.value;
      if (e.target === "RAGE_GAIN_LOCK") rageGainLock = true;
      if (e.target === "REVIVE_HP_PCT") reviveHpPct = e.value;
    }
  }
  return {
    skillDmgMult: Math.max(0.4, skillDmgMult),
    dmgTakenMult: Math.max(0.25, Math.min(1.5, dmgTakenMult)),
    atkMult,
    defMult,
    maxHpMult,
    comboRate: Math.max(0, Math.min(100, comboRate)),
    counterRate: Math.max(0, Math.min(100, counterRate)),
    dodgeRate: Math.max(0, Math.min(90, dodgeRate)),
    critRate: Math.max(0, Math.min(100, critRate)),
    healBonusPct,
    lightSpearMult: Math.max(0.5, lightSpearMult),
    roundDrAdd,
    glassCannonHp,
    killHealPct,
    comboMax,
    comboAtkStack,
    rageGainLock,
    reviveHpPct,
  };
}

export function skillTierCombatBonus(data: GameData, state: PlayerState) {
  const mods = resolveSkillCombatMods(data, state);
  return {
    atkMult: mods.atkMult,
    defMult: mods.defMult,
    atkFlat: 0,
    defFlat: 0,
    dmgTakenMult: mods.dmgTakenMult,
    skillDmgMult: mods.skillDmgMult,
  };
}

/** ?? ATK/DEF = ??? ? ??? ? ?? ??. */
export function getEffectiveCombatStats(data: GameData, state: PlayerState): {
  atk: number;
  def: number;
  maxHp: number;
  skillDmgMult: number;
  dmgTakenMult: number;
  mods: ReturnType<typeof resolveSkillCombatMods>;
} {
  const mods = resolveSkillCombatMods(data, state);
  return {
    atk: Math.max(1, Math.round(state.atk * mods.atkMult)),
    def: Math.max(1, Math.round(state.def * mods.defMult)),
    maxHp: Math.max(1, Math.round(state.maxHp * mods.maxHpMult)),
    skillDmgMult: mods.skillDmgMult,
    dmgTakenMult: mods.dmgTakenMult,
    mods,
  };
}

export type LoopHuntTune = {
  rangeAdd: number;
  speedMul: number;
  splashMul: number;
  eatMul: number;
  invadeMul: number;
  /** 투척 미사일 속도 배율 */
  missileMul: number;
};

function playerBaseNum(data: GameData, key: string, fallback: number): number {
  const v = data.playerBaseStats?.[key];
  if (v === undefined || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/** 대박·운빨로 쌓인 HP/ATK/DEF → 원 루프용 숨·흡착·억제 배율 */
export function loopStatMods(data: GameData, state: PlayerState): {
  adsorb: number;
  inhibit: number;
  breath: number;
} {
  const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
  const adsorb = clamp(state.atk / Math.max(1, playerBaseNum(data, "base_atk", 3200)), 0.72, 1.8);
  const inhibit = clamp(state.def / Math.max(1, playerBaseNum(data, "base_def", 900)), 0.72, 1.8);
  const fill = state.hp / Math.max(1, state.maxHp);
  const breath = clamp(
    (state.maxHp / Math.max(1, playerBaseNum(data, "base_max_hp", 18000))) * (0.5 + 0.5 * fill),
    0.5,
    1.8,
  );
  return { adsorb, inhibit, breath };
}

/** 원 스킬(보폭·거리·확산) × 숨·흡착·억제. 서로 곱해서 같이 간다. */
export function composeLoopHuntTune(
  skills: { range: boolean; stride: boolean; spread: boolean; speed?: boolean },
  mods: { adsorb: number; inhibit: number; breath: number },
): LoopHuntTune {
  return {
    // 기본 사거리는 raid layout(9). 사거리 스킬은 살짝만 가산
    rangeAdd: (skills.range ? 1.6 : 0) + (mods.adsorb - 1) * 1.2,
    speedMul: (skills.stride ? 1.22 : 1) * (0.9 + mods.breath * 0.1),
    splashMul: (skills.spread ? 1.35 : 1) * mods.adsorb,
    eatMul: mods.inhibit * (0.65 + mods.breath * 0.35),
    invadeMul: 1 / Math.max(0.55, mods.inhibit),
    missileMul: skills.speed ? 1.35 : 1,
  };
}

export function getReviveHpPct(data: GameData, state: PlayerState): number {
  const mods = resolveSkillCombatMods(data, state);
  return mods.reviveHpPct > 0 ? mods.reviveHpPct : 0.3;
}

export function tuningNum(data: GameData, key: string, fallback: number): number {
  const v = data.combatTuning[key];
  if (v === undefined || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function tuningStr(data: GameData, key: string, fallback: string): string {
  const v = data.combatTuning[key];
  return v !== undefined && v !== "" ? v : fallback;
}

export function getBranchCostEffectId(branch: BranchDef, side: "A" | "B"): string {
  const specific = side === "A" ? branch.option_a_cost_effect_id : branch.option_b_cost_effect_id;
  if (specific) return specific;
  // ??(A)?? ?? ??? ??? ??
  if (branch.subtype === "PREVIEW_DECLINE" && side === "A") return "";
  return branch.cost_effect_id || "";
}

function skillEffectsFor(
  data: GameData,
  state: PlayerState,
  trigger: string,
  actionSlot?: string
): { skill: SkillDef; row: (typeof data.skillEffects)[0] }[] {
  const out: { skill: SkillDef; row: (typeof data.skillEffects)[0] }[] = [];
  for (const id of state.learnedSkills) {
    const skill = data.skills.find((s) => s.skill_id === id);
    if (!skill) continue;
    const rows = (data.skillEffects ?? []).filter(
      (e) =>
        e.skill_id === id &&
        e.enabled &&
        e.trigger === trigger &&
        (!actionSlot || (e.action_slot || "PASSIVE") === actionSlot)
    );
    for (const row of rows) out.push({ skill, row });
  }
  return out;
}

function applyShieldOp(shield: number, op: string, value: number): number {
  if (op === "SET") return Math.max(0, value);
  if (op === "ADD") return Math.max(0, shield + value);
  if (op === "MUL") return Math.max(0, Math.round(shield * value));
  return shield;
}

/** ?? ??/???: ?? ?????? ?? */
export function getSkillCombatHints(data: GameData, skillId: string): string[] {
  const rows = (data.skillEffects ?? []).filter((e) => e.skill_id === skillId && e.enabled);
  const hints: string[] = [];
  for (const r of rows) {
    const slot = r.action_slot || "PASSIVE";
    const chance = r.trigger_value > 0 && r.trigger_value < 100 ? `${r.trigger_value}%` : "";
    if (r.trigger === "ON_RAGE") {
      hints.push(uiText(data, "ui_skill_hint_rage"));
      continue;
    }
    if (r.trigger === "ON_HP_FIRST_BELOW") {
      hints.push(uiText(data, "ui_skill_hint_hp_first", { pct: r.trigger_value || 30 }));
      continue;
    }
    if (r.trigger === "ON_HIT_CHANCE") {
      hints.push(
        chance ? uiText(data, "ui_skill_hint_onhit_chance", { pct: chance }) : uiText(data, "ui_skill_hint_onhit")
      );
      continue;
    }
    if (r.trigger === "ON_COUNTER") {
      hints.push(uiText(data, "ui_skill_hint_counter"));
      continue;
    }
    if (r.target === "VOLLEY_COUNT") {
      hints.push(uiText(data, "ui_skill_hint_volley", { n: Math.round(r.value) }));
      continue;
    }
    if (r.trigger === "EVERY_N_ROUNDS") {
      hints.push(uiText(data, "ui_skill_hint_every_n", { n: r.trigger_value || 2 }));
      continue;
    }
    if (r.trigger === "ON_COMBO") {
      hints.push(uiText(data, "ui_skill_hint_combo"));
      continue;
    }
    if (r.target === "COMBO_RATE") {
      hints.push(uiText(data, "ui_skill_hint_combo_rate", { pct: r.value }));
      continue;
    }
    if (r.target === "DODGE_RATE") {
      hints.push(
        r.trigger_value > 0
          ? uiText(data, "ui_skill_hint_dodge_hp", { pct: r.trigger_value, rate: r.value })
          : uiText(data, "ui_skill_hint_dodge", { rate: r.value })
      );
      continue;
    }
    if (slot === "PASSIVE") hints.push(uiText(data, "ui_skill_hint_passive"));
    else if (slot === "START") hints.push(uiText(data, "ui_skill_hint_start"));
    else if (slot === "THROW" || slot === "DAGGER") hints.push(uiText(data, "ui_skill_hint_throw"));
    else if (slot === "BOLT" || slot === "FIREWAVE" || slot === "SPEAR")
      hints.push(uiText(data, "ui_skill_hint_volley_slot"));
    else if (slot === "ACTIVE")
      hints.push(chance ? uiText(data, "ui_skill_hint_active_chance", { pct: chance }) : uiText(data, "ui_skill_hint_active"));
    else if (slot === "AFTER_ATTACK")
      hints.push(chance ? uiText(data, "ui_skill_hint_after_chance", { pct: chance }) : uiText(data, "ui_skill_hint_after"));
    else if (slot === "ON_HIT")
      hints.push(
        r.trigger_value > 0
          ? uiText(data, "ui_skill_hint_onhit_hp", { pct: r.trigger_value })
          : uiText(data, "ui_skill_hint_onhit")
      );
  }
  return [...new Set(hints)];
}

export interface CombatTurnLog {
  turn: number;
  kind:
    | "player"
    | "enemy"
    | "win"
    | "timeout"
    | "skill"
    | "shield"
    | "buff"
    | "enemy_skill"
    | "enemy_shield"
    | "rage"
    | "phase"
    | "side"
    | "bolt"
    | "volley";
  side?: "player" | "enemy" | "system";
  dmg?: number;
  playerHp: number;
  enemyHp: number;
  shield?: number;
  shieldMax?: number;
  enemyShield?: number;
  enemyShieldMax?: number;
  playerRage?: number;
  enemyRage?: number;
  text?: string;
  skillId?: string;
  /** ?? ??: ?? ?? (1-based) */
  hitIndex?: number;
  /** ?? ??: ? ?? */
  hitTotal?: number;
}

export interface CombatSimResult {
  won: boolean;
  turns: number;
  logs: CombatTurnLog[];
  playerHpAfter: number;
  enemyName: string;
  enemyIcon: string;
  shieldAfter: number;
  enemyShieldAfter: number;
  /** ?? ?? ??? (show_icon) */
  enemyKitSkills: EnemySkillDef[];
  patternId: string;
}

/** ???: ???? THROW?BASIC?ACTIVE????RAGE / ? THROW?BASIC?COMBO????RAGE */
export function simulateCombat(
  data: GameData,
  state: PlayerState,
  combatId: string | undefined
): CombatSimResult {
  const maxTurns = tuningNum(data, "max_turns", 15);
  const defFactor = tuningNum(data, "atk_def_factor", 0.35);
  const variance = tuningNum(data, "dmg_variance_pct", 18) / 100;
  const enemy = combatId ? getCombatEnemy(data, combatId) : undefined;
  const map = getStageMapForDay(data, state.day);
  /** CLEAR? ? ?? ??. ?? ??(HP1 ????? ??)? ?? ??. */
  const clearEase = map?.balance_tag === "CLEAR" || map?.balance_tag === "FORGIVING";
  // EDGE: ? ?? ??? ?? ?? (?????? combat_tuning)
  const nearDays = tuningNum(data, "edge_near_end_days", 2);
  const nearMapEnd = !!map && state.day >= map.day_end - nearDays;
  const edgeBoss =
    map?.balance_tag === "EDGE" &&
    nearMapEnd &&
    !!combatId &&
    (combatId.includes("miniboss") || combatId.includes("finalboss"));
  const hpM = (map?.enemy_hp_mult ?? 1) * (edgeBoss ? tuningNum(data, "edge_boss_hp_mult", 1.35) : 1);
  const atkM = (map?.enemy_atk_mult ?? 1) * (edgeBoss ? tuningNum(data, "edge_boss_atk_mult", 1.22) : 1);
  const defM = (map?.enemy_def_mult ?? 1) * (edgeBoss ? tuningNum(data, "edge_boss_def_mult", 1.12) : 1);
  const eff = getEffectiveCombatStats(data, state);
  const mods = eff.mods;

  let playerHp = Math.min(state.hp, eff.maxHp);
  const combatMaxHp = eff.maxHp;
  const hpScale = tuningNum(data, "enemy_hp_scale", 1);
  const baseEnemyHp = Math.round(
    (enemy?.enemy_hp ?? tuningNum(data, "fallback_enemy_hp", 6500)) * hpM * hpScale
  );
  let enemyHp = baseEnemyHp;
  const enemyAtk = Math.round((enemy?.enemy_atk ?? tuningNum(data, "fallback_enemy_atk", 980)) * atkM);
  const enemyDef = Math.round((enemy?.enemy_def ?? tuningNum(data, "fallback_enemy_def", 160)) * defM);
  const enemyName = enemy?.enemy_name ?? tuningStr(data, "fallback_enemy_name", "?");
  const enemyIcon = enemy?.enemy_icon ?? tuningStr(data, "fallback_enemy_icon", "??");
  const patternId = enemy?.pattern_id || tuningStr(data, "fallback_pattern_id", "N_SWARM");
  const isNormalEnemy = !combatId || (!combatId.includes("miniboss") && !combatId.includes("finalboss"));
  const rageMax = Math.max(1, enemy?.rage_max ?? 100);
  const ragePerTurn = enemy?.rage_per_turn ?? 12;
  const rageHitGain = tuningNum(data, "rage_hit_gain", 8);
  let enemyRage = 0;

  const playerRageMax = Math.max(1, tuningNum(data, "player_rage_max", 100));
  const playerRagePerTurn = tuningNum(data, "player_rage_per_turn", 14);
  const playerRageHitGain = tuningNum(data, "player_rage_hit_gain", 10);
  const playerRageFallbackRatio = tuningNum(data, "player_rage_fallback_atk_ratio", 1.35);
  let playerRage = 0;
  const hpFirstBelowFired = new Set<string>();

  let playerAtk = eff.atk; // ???(?? ATK_MULT ??). ???? state.atk?.
  const playerDef = eff.def;
  let skillDmgMult = eff.skillDmgMult;
  let dmgTakenMult = eff.dmgTakenMult ?? 1;
  let comboRate = mods.comboRate;
  let counterRate = mods.counterRate;
  let critRate = mods.critRate;
  const comboMax = mods.comboMax;
  const comboAtkStackPer = mods.comboAtkStack;
  let comboAtkBonus = 0;
  /** ?? ? ?? ATK% (COMBAT_ATK_BUFF). ?? state.atk? ??. */
  let combatAtkBuffPct = 0;
  let combatAtkBuffRounds = 0;
  const liveAtk = () => playerAtk * (1 + comboAtkBonus) * (1 + combatAtkBuffPct);
  const lightSpearMult = mods.lightSpearMult;
  const healBonusPct = mods.healBonusPct;
  const roundDrAdd = mods.roundDrAdd;
  const glassHp = mods.glassCannonHp;
  const killHealPct = mods.killHealPct;
  const rageGainLock = mods.rageGainLock;
  let roundDrStacks = 0;
  let critRecoverRounds = 0;
  let critRecoverHealPct = 0.1;
  let enemyBurn = 0;
  let enemyPoison = 0;
  let enemyFreeze = 0;
  let enemyStun = 0;

  const playerDmgScale = tuningNum(data, "player_dmg_scale", 1);
  const enemyDmgScale = clearEase
    ? tuningNum(data, "forgiving_enemy_dmg_scale", 0.4)
    : tuningNum(data, "enemy_dmg_scale", 0.62);

  let shield = 0;
  let shieldMax = 0;
  let enemyShield = 0;
  let enemyShieldMax = 0;
  const logs: CombatTurnLog[] = [];
  let won = false;
  let turns = 0;
  let lastPhase = 1;

  const skillById = (id: string) => data.enemySkills.find((s) => s.enemy_skill_id === id);

  const patternRows = data.enemyPatterns
    .filter((p) => p.pattern_id === patternId && p.enabled)
    .sort((a, b) => a.sort_order - b.sort_order);

  const enemyKitSkills: EnemySkillDef[] = (() => {
    const seen = new Set<string>();
    const out: EnemySkillDef[] = [];
    for (const row of patternRows) {
      if (seen.has(row.enemy_skill_id)) continue;
      seen.add(row.enemy_skill_id);
      const sk = skillById(row.enemy_skill_id);
      if (sk?.show_icon) out.push(sk);
    }
    return out;
  })();

  const snap = () => ({
    playerHp,
    enemyHp,
    shield,
    shieldMax,
    enemyShield,
    enemyShieldMax,
    playerRage,
    enemyRage,
  });

  const applyCombatAtkBuff = (pct: number, rounds: number, skillName: string, turn: number) => {
    combatAtkBuffPct = Math.max(combatAtkBuffPct, pct);
    combatAtkBuffRounds = rounds <= 0 ? 999 : Math.max(combatAtkBuffRounds, rounds);
    logs.push({
      turn,
      kind: "skill",
      side: "player",
      text: uiText(data, "ui_stage_atk_buff", { name: skillName, pct: Math.round(pct * 100) }),
      ...snap(),
    });
  };

  const enemyHpPct = () => (enemyHp / Math.max(1, baseEnemyHp)) * 100;
  const playerHpPct = () => (playerHp / Math.max(1, combatMaxHp)) * 100;

  const liveDodgeRate = () => {
    let r = mods.dodgeRate;
    for (const id of state.learnedSkills) {
      for (const e of (data.skillEffects ?? []).filter(
        (x) => x.skill_id === id && x.enabled && x.trigger === "ALWAYS" && x.target === "DODGE_RATE"
      )) {
        if (e.trigger_value > 0 && playerHpPct() <= e.trigger_value) r += e.value;
      }
    }
    return Math.max(0, Math.min(90, r));
  };

  const glassActive = () => glassHp > 0 && playerHpPct() <= glassHp;

  const rollDmg = (atk: number, def: number) => {
    const base = Math.max(1, Math.round(atk - def * defFactor));
    const jitter = 1 + (Math.random() * 2 - 1) * variance;
    return Math.max(1, Math.round(base * jitter));
  };

  const chanceOk = (pct: number) => {
    if (pct <= 0) return false;
    return Math.random() * 100 < pct;
  };

  const healPlayer = (raw: number) => {
    const bonus = Math.round(combatMaxHp * (healBonusPct / 100));
    const amt = Math.max(0, Math.round(raw + bonus));
    playerHp = Math.min(combatMaxHp, playerHp + amt);
    return amt;
  };

  const resolveSkillValue = (row: { value: number; value_type: string; target?: string }) => {
    const vt = (row.value_type || "FLAT").toUpperCase();
    const spear =
      row.target === "BONUS_DMG_FLAT" && false
        ? 1
        : 1;
    void spear;
    let atkNow = liveAtk();
    if (glassActive()) atkNow *= 1.5;
    if (vt === "MAX_HP_PCT") return Math.max(1, Math.round(combatMaxHp * row.value));
    if (vt === "ATK_RATIO") {
      let v = Math.max(1, Math.round(atkNow * row.value * playerDmgScale * skillDmgMult));
      return v;
    }
    return Math.max(0, Math.round(row.value));
  };

  const resolveSpearValue = (row: { value: number; value_type: string }) => {
    let atkNow = liveAtk();
    if (glassActive()) atkNow *= 1.5;
    return Math.max(
      1,
      Math.round(atkNow * row.value * lightSpearMult * playerDmgScale * skillDmgMult)
    );
  };

  const applyEnemyStatus = (
    turn: number,
    kind: "BURN" | "POISON" | "FREEZE" | "STUN",
    skillName: string,
    icon: string
  ) => {
    if (kind === "BURN") enemyBurn = Math.min(3, enemyBurn + 1);
    if (kind === "POISON") enemyPoison = Math.min(3, enemyPoison + 1);
    if (kind === "FREEZE") enemyFreeze = Math.max(enemyFreeze, 1);
    if (kind === "STUN") enemyStun = Math.max(enemyStun, 1);
    logs.push({
      turn,
      kind: "buff",
      side: "player",
      text: uiText(data, "ui_stage_status_apply", {
        icon: icon || "?",
        name: skillName,
        status: uiText(data, `ui_status_${kind.toLowerCase()}`),
      }),
      ...snap(),
    });
  };

  const tickEnemyDots = (turn: number) => {
    if (enemyBurn > 0 && enemyHp > 0) {
      const dmg = Math.max(1, Math.round(playerAtk * 0.2 * enemyBurn * playerDmgScale));
      dealToEnemy(dmg, turn);
      logs.push({
        turn,
        kind: "skill",
        side: "player",
        dmg,
        text: uiText(data, "ui_stage_burn_tick", { n: enemyBurn, dmg }),
        ...snap(),
      });
    }
    if (enemyPoison > 0 && enemyHp > 0) {
      const dmg = Math.max(1, Math.round(playerAtk * 0.2 * enemyPoison * playerDmgScale));
      dealToEnemy(dmg, turn);
      logs.push({
        turn,
        kind: "skill",
        side: "player",
        dmg,
        text: uiText(data, "ui_stage_poison_tick", { n: enemyPoison, dmg }),
        ...snap(),
      });
    }
  };

  const gainPlayerShield = (
    turn: number,
    skill: { skill_id: string; skill_name: string; icon: string },
    row: { op: string; value: number; value_type: string; trigger_value: number },
    kind: CombatTurnLog["kind"] = "shield"
  ) => {
    const add = resolveSkillValue(row);
    const before = shield;
    shield = applyShieldOp(shield, row.op, add);
    shieldMax = Math.max(shieldMax, shield);
    if (shield > before) {
      logs.push({
        turn,
        kind,
        side: "player",
        text: uiText(data, "ui_stage_shield_proc", {
          icon: skill.icon || "???",
          name: skill.skill_name,
          n: Math.round(shield - before),
          pct: row.trigger_value > 0 && row.trigger_value < 100 ? String(row.trigger_value) : "",
        }),
        skillId: skill.skill_id,
        ...snap(),
      });
    }
  };

  /** HP ?? ?? 1? (Critical Shield / Critical Recovery) */
  const checkHpFirstBelow = (turn: number) => {
    const pct = playerHpPct();
    for (const { skill, row } of skillEffectsFor(data, state, "ON_HP_FIRST_BELOW")) {
      if (hpFirstBelowFired.has(`${skill.skill_id}:${row.target}`)) continue;
      const need = row.trigger_value > 0 ? row.trigger_value : 30;
      if (pct > need) continue;
      hpFirstBelowFired.add(`${skill.skill_id}:${row.target}`);
      if (row.target === "SHIELD_FLAT") {
        gainPlayerShield(turn, skill, row);
      } else if (row.target === "CRIT_RECOVER") {
        critRecoverRounds = Math.max(critRecoverRounds, Math.round(row.value));
        logs.push({
          turn,
          kind: "buff",
          side: "player",
          text: uiText(data, "ui_stage_crit_recover", { name: skill.skill_name, n: critRecoverRounds }),
          skillId: skill.skill_id,
          ...snap(),
        });
      } else if (row.target === "HEAL_MAX_HP_PCT") {
        critRecoverHealPct = row.value;
      }
    }
  };

  /** ?? ? Fire Guard ? */
  const procOnHitChance = (turn: number) => {
    const bySkill = new Map<string, { skill: SkillDef; rows: typeof data.skillEffects }>();
    for (const { skill, row } of skillEffectsFor(data, state, "ON_HIT_CHANCE", "ON_HIT")) {
      const cur = bySkill.get(skill.skill_id) ?? { skill, rows: [] };
      cur.rows.push(row);
      bySkill.set(skill.skill_id, cur);
    }
    for (const { skill, rows } of bySkill.values()) {
      const dmgRows = rows.filter((r) => r.target === "BONUS_DMG_FLAT");
      const statusRows = rows.filter((r) => r.target.startsWith("STATUS_"));
      // ?? ?? ??? ? ??? ?? ??, ??? ??? ?? ?
      if (dmgRows.length > 0) {
        const gate = dmgRows[0].trigger_value > 0 ? dmgRows[0].trigger_value : 100;
        if (!chanceOk(gate)) continue;
        for (const row of dmgRows) {
          const planned = resolveSkillValue(row);
          dealToEnemy(planned, turn);
          logs.push({
            turn,
            kind: "skill",
            side: "player",
            text: uiText(data, "ui_stage_skill_dmg", {
              icon: skill.icon || "??",
              name: skill.skill_name,
              dmg: planned,
            }),
            skillId: skill.skill_id,
            dmg: planned,
            ...snap(),
          });
        }
        for (const row of statusRows) {
          if (!chanceOk(row.trigger_value > 0 ? row.trigger_value : 100)) continue;
          const st = row.target.replace("STATUS_", "") as "BURN" | "POISON" | "FREEZE" | "STUN";
          applyEnemyStatus(turn, st, skill.skill_name, skill.icon);
        }
      } else {
        for (const row of statusRows) {
          if (!chanceOk(row.trigger_value > 0 ? row.trigger_value : 100)) continue;
          const st = row.target.replace("STATUS_", "") as "BURN" | "POISON" | "FREEZE" | "STUN";
          applyEnemyStatus(turn, st, skill.skill_name, skill.icon);
        }
      }
    }
  };

  /** ?? ??? ? ? ??(DAGGER/FIREWAVE) ? (??? ??) ? STATUS ? SHIELD
   *  ? fireVolley? ???? ?????, ??? ? ??(?? ??)??? ? */
  let fireVolleyRef: ((trigger: string, slot: string, turn: number) => number) | null = null;

  const tryCastPlayerRage = (t: number) => {
    if (playerRage < playerRageMax) return;
    playerRage = 0;
    logs.push({
      turn: t,
      kind: "rage",
      side: "player",
      text: uiText(data, "ui_stage_player_rage"),
      ...snap(),
    });

    const fv = fireVolleyRef;
    let volleyHits = 0;
    if (fv) {
      volleyHits += fv("ON_RAGE", "DAGGER", t);
      if (won) return;
      volleyHits += fv("ON_RAGE", "FIREWAVE", t);
      if (won) return;
    }

    if (volleyHits === 0) {
      let rageHit = false;
      for (const { skill, row } of skillEffectsFor(data, state, "ON_RAGE", "RAGE")) {
        if (!chanceOk(row.trigger_value > 0 ? row.trigger_value : 100)) continue;
        if (row.target !== "BONUS_DMG_FLAT") continue;
        const planned = resolveSkillValue(row);
        dealToEnemy(planned, t);
        rageHit = true;
        logs.push({
          turn: t,
          kind: "rage",
          side: "player",
          text: uiText(data, "ui_stage_player_rage_skill", {
            icon: skill.icon || "??",
            name: skill.skill_name,
            dmg: planned,
          }),
          skillId: skill.skill_id,
          dmg: planned,
          ...snap(),
        });
        if (enemyHp <= 0) {
          pushWin(t);
          return;
        }
      }
      if (!rageHit) {
        const planned = Math.max(
          1,
          Math.round(liveAtk() * playerRageFallbackRatio * playerDmgScale * skillDmgMult)
        );
        dealToEnemy(planned, t);
        logs.push({
          turn: t,
          kind: "rage",
          side: "player",
          text: uiText(data, "ui_stage_player_rage_basic", { dmg: planned }),
          dmg: planned,
          ...snap(),
        });
        if (enemyHp <= 0) {
          pushWin(t);
          return;
        }
      }
    }

    // ?? ? ?? ATK ?? (??? ??)
    for (const { skill, row } of skillEffectsFor(data, state, "ON_RAGE", "RAGE")) {
      if (row.target !== "COMBAT_ATK_BUFF") continue;
      if (!chanceOk(row.trigger_value > 0 ? row.trigger_value : 100)) continue;
      const pct = row.value_type === "RATIO" ? row.value : row.value / 100;
      applyCombatAtkBuff(pct, 0, skill.skill_name, t);
    }

    for (const { skill, row } of skillEffectsFor(data, state, "ON_RAGE", "RAGE")) {
      if (row.target.startsWith("STATUS_")) {
        if (!chanceOk(row.trigger_value > 0 ? row.trigger_value : 100)) continue;
        const st = row.target.replace("STATUS_", "") as "BURN" | "POISON" | "FREEZE" | "STUN";
        applyEnemyStatus(t, st, skill.skill_name, skill.icon);
      }
    }

    for (const { skill, row } of skillEffectsFor(data, state, "ON_RAGE", "SHIELD")) {
      if (!chanceOk(row.trigger_value > 0 ? row.trigger_value : 100)) continue;
      if (row.target === "SHIELD_FLAT") {
        gainPlayerShield(t, skill, row, "shield");
      }
    }
  };

  /** ?? ???? hp_below? ?? ???? ?? */
  const activePattern = (slot: string) => {
    const pct = enemyHpPct();
    const matched = patternRows.filter((r) => {
      const sk = skillById(r.enemy_skill_id);
      return sk?.action_slot === slot && pct <= r.hp_below_pct;
    });
    if (matched.length === 0) return [];
    const best = Math.min(...matched.map((m) => m.hp_below_pct));
    return matched.filter((m) => m.hp_below_pct === best);
  };

  const resolveEnemyValue = (row: (typeof patternRows)[0], atkRatioFallback = 1) => {
    if (row.value_type === "ATK_RATIO") {
      return Math.max(1, Math.round(enemyAtk * row.value * enemyDmgScale));
    }
    return Math.max(0, Math.round(row.value));
  };

  const applyEnemyShieldAbsorb = (turn: number, incoming: number) => {
    let dmg = Math.max(0, Math.round(incoming));
    if (enemyShield > 0 && dmg > 0) {
      const absorbed = Math.min(enemyShield, dmg);
      enemyShield -= absorbed;
      dmg -= absorbed;
      logs.push({
        turn,
        kind: "enemy_shield",
        side: "enemy",
        text: uiText(data, "ui_stage_enemy_shield_absorb", { ename: enemyName, n: absorbed }),
        dmg: absorbed,
        ...snap(),
      });
      if (enemyShield <= 0) {
        logs.push({
          turn,
          kind: "enemy_shield",
          side: "enemy",
          text: uiText(data, "ui_stage_enemy_shield_break", { ename: enemyName }),
          ...snap(),
        });
      }
    }
    if (dmg > 0) enemyHp = Math.max(0, enemyHp - dmg);
    if (enemyHp <= 0 && killHealPct > 0) {
      const healed = healPlayer(Math.round(combatMaxHp * killHealPct));
      if (healed > 0) {
        logs.push({
          turn,
          kind: "skill",
          side: "player",
          text: uiText(data, "ui_stage_skill_heal", { n: healed }),
          ...snap(),
        });
      }
    }
    return dmg;
  };

  const dealToEnemy = (raw: number, turn: number) => applyEnemyShieldAbsorb(turn, raw);

  const applyPlayerShieldAbsorb = (turn: number, incoming: number) => {
    let eDmg = Math.max(0, Math.round(incoming));
    if (shield > 0 && eDmg > 0) {
      const absorbed = Math.min(shield, eDmg);
      shield -= absorbed;
      eDmg -= absorbed;
      logs.push({
        turn,
        kind: "shield",
        side: "player",
        text: uiText(data, "ui_stage_shield_absorb", { n: absorbed }),
        dmg: absorbed,
        ...snap(),
      });
      if (shield <= 0) {
        logs.push({
          turn,
          kind: "shield",
          side: "player",
          text: uiText(data, "ui_stage_shield_break"),
          ...snap(),
        });
      }
    }
    return eDmg;
  };

  const maybePhaseBanner = (turn: number) => {
    const pct = enemyHpPct();
    let phase = 1;
    const p3 = tuningNum(data, "boss_phase3_hp_pct", 30);
    const p2 = tuningNum(data, "boss_phase2_hp_pct", 60);
    if (pct <= p3) phase = 3;
    else if (pct <= p2) phase = 2;
    if (phase > lastPhase && patternId.startsWith("B_")) {
      lastPhase = phase;
      logs.push({
        turn,
        kind: "phase",
        side: "system",
        text: uiText(data, "ui_stage_phase", { n: phase }),
        ...snap(),
      });
    }
  };

  const pushWin = (t: number) => {
    if (won) return;
    won = true;
    logs.push({ turn: t, kind: "win", side: "system", ...snap(), enemyHp: 0 });
  };

  /** ? HP 0?? ?? ?? ?? (?? ???DoT ??? ?? ??) */
  const checkEnemyDown = (t: number): boolean => {
    if (enemyHp > 0) return false;
    pushWin(t);
    return true;
  };

  const defaultVolleyRatio = (slot: string) => {
    if (slot === "BOLT") return tuningNum(data, "bolt_atk_ratio", 0.3);
    if (slot === "DAGGER") return tuningNum(data, "dagger_atk_ratio", 0.45);
    if (slot === "FIREWAVE") return tuningNum(data, "firewave_atk_ratio", 0.4);
    if (slot === "SPEAR") return tuningNum(data, "spear_atk_ratio", 0.3);
    return 0.3;
  };

  /**
   * ?? ?? ??: N??? N? ?? ????? (?? ??).
   * VOLLEY_COUNT / VOLLEY_RATIO ? action_slot = BOLT|DAGGER|FIREWAVE|SPEAR
   * @returns ??? ??? ?? (0?? ?? ?? ?? ??)
   */
  const fireVolley = (trigger: string, slot: string, turn: number): number => {
    let count = 0;
    let ratio = defaultVolleyRatio(slot);
    let skill: SkillDef | null = null;
    for (const { skill: sk, row } of skillEffectsFor(data, state, trigger, slot)) {
      if (row.target === "VOLLEY_COUNT") {
        count += Math.max(0, Math.round(row.value));
        skill = sk;
      } else if (row.target === "VOLLEY_RATIO") {
        ratio = row.value;
        skill = sk;
      }
    }
    if (count <= 0 || !skill) return 0;
    const labelKey =
      slot === "BOLT"
        ? "ui_volley_bolt"
        : slot === "DAGGER"
          ? "ui_volley_dagger"
          : slot === "FIREWAVE"
            ? "ui_volley_firewave"
            : slot === "SPEAR"
              ? "ui_volley_spear"
              : "";
    const label = labelKey ? uiText(data, labelKey) : skill.skill_name;
    let fired = 0;
    for (let i = 1; i <= count; i++) {
      let planned = Math.max(
        1,
        Math.round(liveAtk() * ratio * playerDmgScale * skillDmgMult)
      );
      if (slot === "SPEAR") planned = Math.round(planned * lightSpearMult);
      if (glassActive()) planned = Math.round(planned * 1.5);
      dealToEnemy(planned, turn);
      fired = i;
      logs.push({
        turn,
        kind: "volley",
        side: "player",
        text: uiText(data, "ui_stage_volley", {
          icon: skill.icon || "?",
          name: label,
          i,
          n: count,
          dmg: planned,
        }),
        skillId: skill.skill_id,
        dmg: planned,
        hitIndex: i,
        hitTotal: count,
        ...snap(),
      });
      if (enemyHp <= 0) {
        pushWin(turn);
        return fired;
      }
    }
    return fired;
  };
  fireVolleyRef = fireVolley;

  // PASSIVE? ???. START (?????)
  for (const { skill, row } of skillEffectsFor(data, state, "COMBAT_START", "START")) {
    if (row.target === "SHIELD_FLAT") {
      const add = resolveSkillValue(row);
      shield = applyShieldOp(shield, row.op, add);
      shieldMax = Math.max(shieldMax, shield);
      logs.push({
        turn: 0,
        kind: "shield",
        side: "player",
        text: `${skill.icon || "???"} ${skill.skill_name}! ${uiText(data, "ui_stage_shield_gain", { n: add })}`,
        skillId: skill.skill_id,
        ...snap(),
      });
    } else if (row.target === "STATUS_STUN") {
      applyEnemyStatus(0, "STUN", skill.skill_name, skill.icon);
    }
  }
  checkHpFirstBelow(0);

  // ? START ??
  for (const row of activePattern("START")) {
    const sk = skillById(row.enemy_skill_id);
    if (!sk) continue;
    const add = resolveEnemyValue(row);
    enemyShield = applyShieldOp(enemyShield, "ADD", add);
    enemyShieldMax = Math.max(enemyShieldMax, enemyShield);
    logs.push({
      turn: 0,
      kind: "enemy_shield",
      side: "enemy",
      text: uiText(data, "ui_stage_enemy_shield_gain", {
        icon: sk.icon || "???",
        ename: enemyName,
        name: sk.skill_name,
        n: add,
      }),
      skillId: sk.enemy_skill_id,
      ...snap(),
    });
  }

  for (let t = 1; t <= maxTurns; t++) {
    turns = t;
    // ?? ATK ?? ??? ??
    if (combatAtkBuffRounds > 0 && combatAtkBuffRounds < 999) {
      combatAtkBuffRounds -= 1;
      if (combatAtkBuffRounds <= 0) {
        combatAtkBuffPct = 0;
        combatAtkBuffRounds = 0;
      }
    }
    maybePhaseBanner(t);

    // Battle-Hardened ?? DR
    if (roundDrAdd > 0) {
      roundDrStacks = Math.min(0.75, roundDrStacks + roundDrAdd);
      dmgTakenMult = Math.max(0.25, (eff.dmgTakenMult ?? 1) * (1 - roundDrStacks));
    }

    // Critical Recovery ?? ??
    if (critRecoverRounds > 0) {
      const healed = healPlayer(Math.round(combatMaxHp * critRecoverHealPct));
      critRecoverRounds -= 1;
      logs.push({
        turn: t,
        kind: "skill",
        side: "player",
        text: uiText(data, "ui_stage_crit_recover_tick", { n: healed, left: critRecoverRounds }),
        ...snap(),
      });
    }

    tickEnemyDots(t);
    if (enemyHp <= 0) {
      pushWin(t);
      break;
    }

    // Frozen Touch: every N rounds
    for (const { skill, row } of skillEffectsFor(data, state, "EVERY_N_ROUNDS")) {
      const every = row.trigger_value > 0 ? row.trigger_value : 2;
      if (t % every !== 0) continue;
      if (row.target === "BONUS_DMG_FLAT") {
        const planned = resolveSkillValue(row);
        dealToEnemy(planned, t);
        logs.push({
          turn: t,
          kind: "skill",
          side: "player",
          text: uiText(data, "ui_stage_skill_dmg", {
            icon: skill.icon || "??",
            name: skill.skill_name,
            dmg: planned,
          }),
          skillId: skill.skill_id,
          dmg: planned,
          ...snap(),
        });
      } else if (row.target === "EXECUTE_PCT" && isNormalEnemy && enemyHp > 0) {
        if (chanceOk(row.value)) {
          enemyHp = 0;
          logs.push({
            turn: t,
            kind: "skill",
            side: "player",
            text: uiText(data, "ui_stage_execute", { name: skill.skill_name, ename: enemyName }),
            skillId: skill.skill_id,
            ...snap(),
          });
        }
      }
      if (enemyHp <= 0) {
        pushWin(t);
        break;
      }
    }
    if (won) break;

    logs.push({
      turn: t,
      kind: "side",
      side: "system",
      text: uiText(data, "ui_stage_round_banner", { turn: t, max: maxTurns }),
      ...snap(),
    });
    logs.push({
      turn: t,
      kind: "side",
      side: "player",
      text: uiText(data, "ui_stage_side_player"),
      ...snap(),
    });

    // ?? ????: DAGGER?? ? BASIC ? COMBO ? BOLT?? ? ACTIVE ? AFTER_ATTACK ? RAGE ??
    if (fireVolley("ON_PLAYER_TURN", "DAGGER", t) > 0 && won) break;

    const doPlayerBasic = (labelKind: "player" | "skill", comboLabel?: string) => {
      let planned = Math.max(
        1,
        Math.round(rollDmg(liveAtk(), enemyDef) * skillDmgMult * playerDmgScale)
      );
      if (glassActive()) planned = Math.round(planned * 1.5);
      const isCrit = chanceOk(critRate);
      if (isCrit) planned = Math.round(planned * 1.5);
      dealToEnemy(planned, t);
      logs.push({
        turn: t,
        kind: labelKind,
        side: "player",
        dmg: planned,
        text: comboLabel
          ? uiText(data, "ui_stage_combo", { dmg: planned, name: enemyName })
          : uiText(data, "ui_stage_basic_hit", { dmg: planned, name: enemyName }),
        ...snap(),
      });
    };

    doPlayerBasic("player");
    if (enemyHp <= 0) {
      pushWin(t);
      break;
    }

    // ?? (combo_rate)
    let combosDone = 0;
    while (combosDone < comboMax && chanceOk(comboRate) && enemyHp > 0) {
      combosDone++;
      doPlayerBasic("skill", "combo");
      comboAtkBonus += comboAtkStackPer;
      for (const { skill, row } of skillEffectsFor(data, state, "ON_COMBO", "COMBO")) {
        if (row.target === "COMBO_EXTRA_HIT") {
          const planned = resolveSkillValue(row);
          dealToEnemy(planned, t);
          logs.push({
            turn: t,
            kind: "skill",
            side: "player",
            text: uiText(data, "ui_stage_skill_dmg", {
              icon: skill.icon || "??",
              name: skill.skill_name,
              dmg: planned,
            }),
            skillId: skill.skill_id,
            dmg: planned,
            ...snap(),
          });
          if (checkEnemyDown(t)) break;
        }
      }
      if (won) break;
    }
    if (enemyHp <= 0) {
      pushWin(t);
      break;
    }

    // ?? ? BOLT ?? ? ?? ???? ? ??
    if (fireVolley("ALWAYS", "BOLT", t) > 0 && won) break;

    for (const { skill, row } of skillEffectsFor(data, state, "ON_PLAYER_TURN", "ACTIVE")) {
      if (!chanceOk(row.trigger_value > 0 ? row.trigger_value : 100)) continue;
      if (row.target === "BONUS_DMG_FLAT") {
        const planned = resolveSkillValue(row);
        dealToEnemy(planned, t);
        logs.push({
          turn: t,
          kind: "skill",
          side: "player",
          text: uiText(data, "ui_stage_skill_dmg", {
            icon: skill.icon || "?",
            name: skill.skill_name,
            dmg: planned,
          }),
          skillId: skill.skill_id,
          dmg: planned,
          ...snap(),
        });
        if (enemyHp <= 0) {
          pushWin(t);
          break;
        }
      }
    }
    if (won) break;

    // AFTER_ATTACK: ??? ?? (?? ?? ?? ? ?? ?)
    {
      const bySkill = new Map<string, { skill: SkillDef; rows: typeof data.skillEffects }>();
      for (const { skill, row } of skillEffectsFor(data, state, "ON_PLAYER_TURN", "AFTER_ATTACK")) {
        const cur = bySkill.get(skill.skill_id) ?? { skill, rows: [] };
        cur.rows.push(row);
        bySkill.set(skill.skill_id, cur);
      }
      for (const { skill, rows } of bySkill.values()) {
        const dmgRow = rows.find((r) => r.target === "BONUS_DMG_FLAT");
        const shieldRow = rows.find((r) => r.target === "SHIELD_FLAT");
        const statusRows = rows.filter((r) => r.target.startsWith("STATUS_"));
        if (dmgRow) {
          if (!chanceOk(dmgRow.trigger_value > 0 ? dmgRow.trigger_value : 100)) continue;
          const planned = resolveSkillValue(dmgRow);
          dealToEnemy(planned, t);
          logs.push({
            turn: t,
            kind: "skill",
            side: "player",
            text: uiText(data, "ui_stage_skill_dmg", {
              icon: skill.icon || "??",
              name: skill.skill_name,
              dmg: planned,
            }),
            skillId: skill.skill_id,
            dmg: planned,
            ...snap(),
          });
          for (const row of statusRows) {
            if (!chanceOk(row.trigger_value > 0 ? row.trigger_value : 100)) continue;
            const st = row.target.replace("STATUS_", "") as "BURN" | "POISON" | "FREEZE" | "STUN";
            applyEnemyStatus(t, st, skill.skill_name, skill.icon);
          }
        } else if (shieldRow) {
          if (!chanceOk(shieldRow.trigger_value > 0 ? shieldRow.trigger_value : 100)) continue;
          gainPlayerShield(t, skill, shieldRow);
        } else {
          for (const row of statusRows) {
            if (!chanceOk(row.trigger_value > 0 ? row.trigger_value : 100)) continue;
            const st = row.target.replace("STATUS_", "") as "BURN" | "POISON" | "FREEZE" | "STUN";
            applyEnemyStatus(t, st, skill.skill_name, skill.icon);
          }
        }
        if (enemyHp <= 0) {
          pushWin(t);
          break;
        }
      }
    }
    if (won) break;

    if (!rageGainLock) {
      playerRage = Math.min(playerRageMax, playerRage + playerRageHitGain + playerRagePerTurn);
      tryCastPlayerRage(t);
    }
    if (won) break;

    // ?? ? ?? ??
    logs.push({
      turn: t,
      kind: "side",
      side: "enemy",
      text: uiText(data, "ui_stage_side_enemy", { name: enemyName }),
      ...snap(),
    });

    if (enemyFreeze > 0 || enemyStun > 0) {
      const kind = enemyFreeze > 0 ? "freeze" : "stun";
      if (enemyFreeze > 0) enemyFreeze -= 1;
      if (enemyStun > 0) enemyStun -= 1;
      logs.push({
        turn: t,
        kind: "buff",
        side: "enemy",
        text: uiText(data, kind === "freeze" ? "ui_stage_freeze_skip" : "ui_stage_stun_skip", {
          ename: enemyName,
        }),
        ...snap(),
      });
      continue;
    }

    let hitTakenMult = dmgTakenMult;
    if (glassActive()) hitTakenMult *= 1.3;

    const hitPlayer = (planned: number, kind: CombatTurnLog["kind"], text: string, skillId?: string) => {
      if (chanceOk(liveDodgeRate())) {
        logs.push({
          turn: t,
          kind: "skill",
          side: "player",
          text: uiText(data, "ui_stage_dodge"),
          ...snap(),
        });
        return;
      }
      const shown = Math.max(1, Math.round(planned * hitTakenMult));
      const eDmg = applyPlayerShieldAbsorb(t, shown);
      if (eDmg > 0) playerHp = Math.max(0, playerHp - eDmg);
      logs.push({
        turn: t,
        kind,
        side: "enemy",
        dmg: shown,
        text,
        skillId,
        ...snap(),
      });
      if (!rageGainLock) enemyRage = Math.min(rageMax, enemyRage + rageHitGain);
      checkHpFirstBelow(t);
      procOnHitChance(t);
      checkEnemyDown(t);
    };

    for (const row of activePattern("THROW")) {
      if (won || playerHp <= 0 || enemyHp <= 0) break;
      if (!chanceOk(row.chance_pct)) continue;
      const sk = skillById(row.enemy_skill_id);
      if (!sk) continue;
      const planned = resolveEnemyValue(row);
      const shown = Math.round(planned * hitTakenMult);
      hitPlayer(
        planned,
        "enemy_skill",
        uiText(data, "ui_stage_enemy_skill_dmg", {
          icon: sk.icon || "?",
          ename: enemyName,
          name: sk.skill_name,
          dmg: shown,
        }),
        sk.enemy_skill_id
      );
      if (playerHp <= 0 || won) break;
    }

    if (playerHp > 0 && !won && enemyHp > 0) {
      const basicE = Math.round(rollDmg(enemyAtk, playerDef) * enemyDmgScale);
      const shown = Math.round(basicE * hitTakenMult);
      hitPlayer(
        basicE,
        "enemy",
        uiText(data, "ui_stage_enemy_basic", {
          icon: enemyIcon,
          ename: enemyName,
          dmg: shown,
        })
      );
    }

    if (playerHp > 0 && !won && enemyHp > 0) {
      for (const row of activePattern("COMBO")) {
        if (!chanceOk(row.chance_pct)) continue;
        const sk = skillById(row.enemy_skill_id);
        if (!sk) continue;
        const planned = resolveEnemyValue(row);
        const shown = Math.round(planned * hitTakenMult);
        hitPlayer(
          planned,
          "enemy_skill",
          uiText(data, "ui_stage_enemy_combo", {
            icon: sk.icon || "??",
            ename: enemyName,
            name: sk.skill_name,
            dmg: shown,
          }),
          sk.enemy_skill_id
        );
        if (playerHp <= 0 || won) break;
      }
    }

    if (playerHp > 0 && !won && enemyHp > 0) {
      for (const row of activePattern("SHIELD")) {
        if (!chanceOk(row.chance_pct)) continue;
        const sk = skillById(row.enemy_skill_id);
        if (!sk) continue;
        const add = resolveEnemyValue(row);
        const before = enemyShield;
        enemyShield = applyShieldOp(enemyShield, "ADD", add);
        enemyShieldMax = Math.max(enemyShieldMax, enemyShield);
        if (enemyShield > before) {
          logs.push({
            turn: t,
            kind: "enemy_shield",
            side: "enemy",
            text: uiText(data, "ui_stage_enemy_shield_gain", {
              icon: sk.icon || "???",
              ename: enemyName,
              name: sk.skill_name,
              n: Math.round(enemyShield - before),
            }),
            skillId: sk.enemy_skill_id,
            ...snap(),
          });
        }
      }
    }

    if (!won && enemyHp > 0) {
      enemyRage = Math.min(rageMax, enemyRage + ragePerTurn);
    }

    if (playerHp > 0 && !won && enemyHp > 0 && enemyRage >= rageMax) {
      const rageRows = activePattern("RAGE");
      const row = rageRows[0];
      if (row) {
        const sk = skillById(row.enemy_skill_id);
        if (sk) {
          const planned = resolveEnemyValue(row);
          const shown = Math.round(planned * hitTakenMult);
          enemyRage = 0;
          hitPlayer(
            planned,
            "rage",
            uiText(data, "ui_stage_enemy_rage", {
              ename: enemyName,
              name: sk.skill_name,
              dmg: shown,
            }),
            sk.enemy_skill_id
          );
        }
      } else {
        enemyRage = 0;
      }
    }

    // ??: counter_rate ?? ? ON_COUNTER ?? ? (SPEAR ??)
    if (!won && counterRate > 0 && chanceOk(counterRate) && enemyHp > 0 && playerHp > 0) {
      fireVolley("ON_COUNTER", "SPEAR", t);
    }
    if (checkEnemyDown(t) || won) break;

    if (playerHp <= 0) {
      won = false;
      break;
    }
  }

  if (playerHp > 0 && enemyHp > 0) {
    // ? ??: ?? ????? ??? ?? (HP ?? ?? ?? ??)
    won = false;
    logs.push({ turn: turns, kind: "timeout", side: "system", ...snap() });
  }

  // HP 0?? ?? ??? ?? ??
  if (playerHp <= 0) won = false;

  return {
    won,
    turns,
    logs,
    playerHpAfter: Math.max(0, playerHp),
    enemyName,
    enemyIcon,
    shieldAfter: shield,
    enemyShieldAfter: enemyShield,
    enemyKitSkills,
    patternId,
  };
}

export function textFor(data: GameData, textId: string) {
  return data.texts.find((t) => t.text_id === textId)?.body ?? "";
}

/** ?? ???: 1? + ??? 2? (?? ?? ?? ? ??) */
export function textLinesFor(data: GameData, textId: string): { line1: string; line2: string } {
  const t = data.texts.find((x) => x.text_id === textId);
  return { line1: t?.body ?? "", line2: t?.body_line2 ?? "" };
}

const UI_TEXT_FALLBACKS: Record<string, string> = {};

export function uiText(data: GameData, key: string, vars?: Record<string, string | number>): string {
  let text = data.uiTexts?.[key];
  if (text === undefined || text === "" || text === key) {
    text = UI_TEXT_FALLBACKS[key] ?? key;
  }
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.split(`{${k}}`).join(String(v));
    }
  }
  return text;
}

export function effectLine(effect: { icon: string; description: string }): string {
  return effect.icon ? `${effect.icon} ${effect.description}` : effect.description;
}

export interface EffectResult {
  lines: string[];
  learnedSkill?: SkillDef;
  /** CONTENT_LINK: main?? ??/????/?? ?? */
  contentLink?: { kind: string; ref: string };
}

export function applyEffectId(data: GameData, state: PlayerState, effectId: string): EffectResult {
  const effect = data.effects.find((e) => e.effect_id === effectId);
  if (!effect) return { lines: [] };
  const lines: string[] = [];
  let learnedSkill: SkillDef | undefined;
  let contentLink: { kind: string; ref: string } | undefined;

  switch (effect.effect_type) {
    case "CONTENT_LINK": {
      contentLink = { kind: effect.target, ref: effect.skill_id || "" };
      if (effect.description) lines.push(effectLine(effect));
      break;
    }
    case "STAT_PCT": {
      const pct = effect.value / 100;
      if (effect.target === "HP") {
        state.hp = Math.max(1, Math.min(state.maxHp, state.hp + state.maxHp * pct));
      } else if (effect.target === "MAX_HP") {
        const before = state.maxHp;
        state.maxHp = Math.max(1, Math.round(state.maxHp * (1 + pct)));
        state.hp = Math.min(state.maxHp, Math.max(1, state.hp + (state.maxHp - before)));
      } else if (effect.target === "ATK") {
        state.atk = Math.max(1, Math.round(state.atk * (1 + pct)));
      } else if (effect.target === "DEF") {
        state.def = Math.max(1, Math.round(state.def * (1 + pct)));
      }
      lines.push(effectLine(effect));
      break;
    }
    case "STAT_ABS": {
      if (effect.target === "MAX_HP") {
        state.maxHp = Math.max(1000, state.maxHp + effect.value);
        state.hp = Math.min(state.hp, state.maxHp);
      }
      lines.push(effectLine(effect));
      break;
    }
    case "CURRENCY": {
      const item = itemByEffectTarget(data, effect.target);
      if (item) {
        addItemAmount(data, state, item.item_id, effect.value);
        lines.push(effectLine(effect));
      }
      break;
    }
    case "SKILL_GRANT":
    case "SKILL_UPGRADE": {
      const wantUpgrade = effect.effect_type === "SKILL_UPGRADE";
      const poolRow = data.skillPools.find((p) => p.pool_id === effect.skill_id);
      const directSkill = effect.skill_id.startsWith("POOL_")
        ? undefined
        : data.skills.find((s) => s.skill_id === effect.skill_id);
      if (directSkill) {
        const res = learnSkill(data, state, directSkill.skill_id);
        if (res) {
          learnedSkill = res.skill;
          lines.push(
            uiText(data, res.upgraded ? "ui_skill_upgrade_line" : "ui_skill_grant_line", {
              name: res.skill.skill_name,
            })
          );
        }
        break;
      }
      const tier = poolRow?.tier_name || "??";
      const forceUpgrade = wantUpgrade || !!poolRow?.want_upgrade;
      if (forceUpgrade) {
        const upgradePool = data.skills.filter(
          (s) =>
            s.is_upgrade &&
            s.tier === tier &&
            state.learnedSkills.includes(s.base_skill_id) &&
            !state.learnedSkills.includes(s.skill_id)
        );
        if (upgradePool.length > 0) {
          const pick = upgradePool[randInt(0, upgradePool.length - 1)];
          const res = learnSkill(data, state, pick.skill_id);
          if (res) {
            learnedSkill = res.skill;
            lines.push(uiText(data, "ui_skill_upgrade_line", { name: res.skill.skill_name }));
          }
        }
        break;
      }
      let pool = data.skills.filter((s) => s.tier === tier && !s.is_upgrade);
      pool = pool.filter((s) => !isFullyUpgraded(data, state, s.skill_id));
      if (pool.length === 0) pool = data.skills.filter((s) => !s.is_upgrade && !isFullyUpgraded(data, state, s.skill_id));
      if (pool.length > 0) {
        const pick = pool[randInt(0, pool.length - 1)];
        const res = learnSkill(data, state, pick.skill_id);
        if (res) {
          learnedSkill = res.skill;
          lines.push(
            uiText(data, res.upgraded ? "ui_skill_upgrade_line" : "ui_skill_grant_line", {
              name: res.skill.skill_name,
            })
          );
        }
      }
      break;
    }
    case "TEAM_JOIN": {
      // 콘텐츠(분기·지역 등)에서 직접 동료를 합류시키는 경로. 전투 정화 보상은 grantPurifyReward가 처리.
      const member = data.partyMembers.find((m) => m.member_id === effect.skill_id);
      if (member && !state.teamLocked && !state.joinedPartyMembers.includes(member.member_id)) {
        state.joinedPartyMembers.push(member.member_id);
        if (member.effect_type === "FLAT_HP") {
          state.purifyMaxHp += member.effect_value;
          state.purifyHp += member.effect_value;
        }
        if (member.roster_scope === "PERMANENT" && !state.permanentPartyMembers.includes(member.member_id)) {
          state.permanentPartyMembers.push(member.member_id);
        }
        lines.push(effect.description || `${member.display_name} 합류!`);
      }
      break;
    }
  }
  return { lines, learnedSkill, contentLink };
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
    skill_pool_tier: "???",
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
  let pool = data.skills.filter(
    (s) => s.tier === tier && !s.is_upgrade && !isFullyUpgraded(data, state, s.skill_id)
  );
  if (pool.length === 0) {
    pool = data.skills.filter((s) => !s.is_upgrade && !isFullyUpgraded(data, state, s.skill_id));
  }
  if (pool.length === 0) return null;
  const skill = pool[randInt(0, pool.length - 1)];
  const res = learnSkill(data, state, skill.skill_id);
  return res?.skill ?? null;
}

export function pickSkillChoices(
  data: GameData,
  state: PlayerState,
  tier: string,
  count = 3,
  _wantUpgrade = false
): SkillDef[] {
  const n = data.levelupRules?.card_count || count;
  const upgradeMin = data.levelupRules?.upgrade_offer_min ?? 1;
  const upgradeFirst = data.levelupRules?.upgrade_first_in_list !== false;

  const upgrades = data.skills.filter(
    (s) =>
      s.is_upgrade &&
      state.learnedSkills.includes(s.base_skill_id) &&
      !state.learnedSkills.includes(s.skill_id) &&
      (s.tier === tier || true)
  );
  const tierUpgrades = upgrades.filter((s) => s.tier === tier);
  const upgradePool = tierUpgrades.length > 0 ? tierUpgrades : upgrades;

  const fresh = data.skills.filter(
    (s) => s.tier === tier && !s.is_upgrade && !state.learnedSkills.includes(s.skill_id) && !isFullyUpgraded(data, state, s.skill_id)
  );
  let freshPool = fresh;
  if (freshPool.length < n) {
    const rest = data.skills.filter(
      (s) =>
        !s.is_upgrade &&
        !state.learnedSkills.includes(s.skill_id) &&
        !isFullyUpgraded(data, state, s.skill_id) &&
        !fresh.includes(s)
    );
    freshPool = [...fresh, ...rest];
  }

  const picked: SkillDef[] = [];
  const shuffledUp = [...upgradePool].sort(() => Math.random() - 0.5);
  const takeUp = Math.min(upgradeMin, shuffledUp.length, n);
  for (let i = 0; i < takeUp; i++) picked.push(shuffledUp[i]);

  const shuffledFresh = [...freshPool].sort(() => Math.random() - 0.5);
  for (const s of shuffledFresh) {
    if (picked.length >= n) break;
    if (picked.some((p) => getSkillBaseId(p) === getSkillBaseId(s))) continue;
    picked.push(s);
  }

  if (upgradeFirst && takeUp > 0) {
    const ups = picked.filter((s) => s.is_upgrade);
    const rest = picked.filter((s) => !s.is_upgrade);
    return [...ups, ...rest].slice(0, n);
  }
  return picked.slice(0, n);
}

export function incrementGauge(data: GameData, state: PlayerState, gradeId: string) {
  const gauge = data.gauges.find((g) => g.grade_id === gradeId);
  if (!gauge) return null;
  const current = (state.gaugeCounts[gauge.gauge_id] ?? 0) + 1;
  state.gaugeCounts[gauge.gauge_id] = current;
  if (current >= gauge.cap) {
    state.gaugeCounts[gauge.gauge_id] = 0;
    return { gauge, filled: true, gained: true };
  }
  return { gauge, filled: false, gained: true };
}

export function gaugeValue(data: GameData, state: PlayerState, gaugeId: string) {
  const gauge = data.gauges.find((g) => g.gauge_id === gaugeId)!;
  return { current: state.gaugeCounts[gaugeId] ?? 0, cap: gauge.cap };
}

export function getMinigamePool(data: GameData, minigameId: string): MinigameRewardRow[] {
  return data.minigameRewards.filter((r) => r.minigame_id === minigameId);
}

export function spinMinigameRow(data: GameData, minigameId: string): MinigameRewardRow | null {
  const pool = getMinigamePool(data, minigameId);
  if (pool.length === 0) return null;
  return weightedPick(pool, (r) => r.weight);
}

export function spinMinigame(data: GameData, minigameId: string): MinigameRewardRow | null {
  const picked = spinMinigameRow(data, minigameId);
  return picked && picked.effect_id ? picked : null;
}

export function rewardLabel(data: GameData, effectId: string): { icon: string; text: string } {
  if (!effectId) return { icon: "?", text: "?" };
  const e = data.effects.find((x) => x.effect_id === effectId);
  if (!e) return { icon: "??", text: "??" };
  return { icon: e.icon || "??", text: e.description };
}

export function rewardRowLabel(
  data: GameData,
  row: MinigameRewardRow
): { icon: string; text: string; color: string } {
  const effect = row.effect_id ? data.effects.find((x) => x.effect_id === row.effect_id) : undefined;
  const icon = row.action === "RESPIN" ? "??" : effect?.icon || (row.effect_id ? "??" : "?");
  return { icon, text: row.label, color: row.color };
}
