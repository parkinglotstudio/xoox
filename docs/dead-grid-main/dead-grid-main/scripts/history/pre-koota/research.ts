export type ResearchId =
  | "protocol"
  | "pulse"
  | "dash"
  | "damage"
  | "pickup"
  | "experience"
  | "movement";
export type ResearchLevels = Partial<Record<ResearchId, number>>;
export const RESEARCH = {
  protocol: {
    name: "생존 프로토콜",
    desc: "단계당 최대 체력 +5 · 피해 +2.5%",
    icon: "shield",
    max: 10,
    base: 10,
    step: 6,
  },
  pulse: {
    name: "충격파 제어",
    desc: "단계당 Q 쿨다운 6% 감소",
    icon: "zap",
    max: 5,
    base: 10,
    step: 6,
  },
  dash: {
    name: "회피 훈련",
    desc: "단계당 Space 쿨다운 6% 감소",
    icon: "footprints",
    max: 5,
    base: 12,
    step: 8,
  },
  damage: {
    name: "무기 정비",
    desc: "단계당 모든 무기 피해 +3%",
    icon: "swords",
    max: 5,
    base: 10,
    step: 6,
  },
  pickup: {
    name: "회수 센서",
    desc: "단계당 경험치 획득 반경 +0.5m",
    icon: "magnet",
    max: 5,
    base: 8,
    step: 5,
  },
  experience: {
    name: "전투 분석",
    desc: "단계당 경험치 획득량 +5%",
    icon: "experience",
    max: 5,
    base: 10,
    step: 6,
  },
  movement: {
    name: "기동 훈련",
    desc: "단계당 이동 속도 +3%",
    icon: "footprints",
    max: 5,
    base: 8,
    step: 5,
  },
} as const;
export function normalizeResearch(raw: unknown, legacy = 0): ResearchLevels {
  const source =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const levels: ResearchLevels = {};
  for (const id of Object.keys(RESEARCH) as ResearchId[]) {
    const value = source[id] ?? (id === "protocol" ? legacy : 0);
    levels[id] =
      typeof value === "number" && Number.isFinite(value)
        ? Math.min(RESEARCH[id].max, Math.max(0, Math.floor(value)))
        : 0;
  }
  return levels;
}
export const researchCost = (id: ResearchId, rank: number) =>
  RESEARCH[id].base + rank * RESEARCH[id].step;
export const researchTotal = (levels: ResearchLevels) =>
  Object.values(levels).reduce((sum, n) => sum + (n || 0), 0);
export function purchaseResearch(
  credits: number,
  levels: ResearchLevels,
  id: ResearchId,
) {
  const rank = levels[id] || 0,
    cost = researchCost(id, rank);
  if (rank >= RESEARCH[id].max || credits < cost) return null;
  return { credits: credits - cost, researches: { ...levels, [id]: rank + 1 } };
}
