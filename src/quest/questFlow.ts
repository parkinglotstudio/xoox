import type { GameData, QuestSpotDef, QuestStepDef } from "../types";

/** 활성 체인의 enabled 스텝. sort_order 순. stage는 나중에 필터. */
export function listQuestSteps(data: GameData, areaId: string): QuestStepDef[] {
  const chain = data.questChains.find((c) => c.active && c.area_id === areaId);
  if (!chain) return [];
  return data.questSteps
    .filter((s) => s.chain_id === chain.chain_id && s.enabled)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function spotsForStep(data: GameData, stepId: string): QuestSpotDef[] {
  return data.questSpots.filter((s) => s.step_id === stepId).sort((a, b) => a.sort_order - b.sort_order);
}

export function orderSearchSpots(spots: QuestSpotDef[], rand: () => number = Math.random): QuestSpotDef[] {
  const bag: QuestSpotDef[] = [];
  for (const s of spots) {
    const n = Math.max(1, s.weight || 1);
    for (let i = 0; i < n; i++) bag.push(s);
  }
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const t = bag[i];
    bag[i] = bag[j];
    bag[j] = t;
  }
  const seen = new Set<string>();
  const out: QuestSpotDef[] = [];
  for (const s of bag) {
    if (seen.has(s.spot_id)) continue;
    seen.add(s.spot_id);
    out.push(s);
  }
  return out;
}
