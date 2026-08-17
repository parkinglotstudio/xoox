/**
 * 여정 전체(60일) 루트 시뮬 — 갈래를 사람이 외우지 않게 툴이 들고 있는다.
 *
 * 근거: docs/gdd/41_섬여정_갈래설계.md · 40 §3-1(3×3 십자) · 39(60일 한 판) · 38(규칙 1·4)
 *
 * 규칙
 *  - 노드 하나 = 하루 (38 규칙1)
 *  - **섹터 이동도 하루** (지시자 확정) — 십자 구조라 중앙을 계속 되돌아가므로 비용이 크다
 *  - 60일은 제한 시간. 초과하면 그 루트는 성립하지 않는다
 */

export interface SectorInfo {
  id: string;
  name: string;
  nodeCount: number;
  blightCount: number;
  degree: number;
}

export interface RouteOption {
  key: string;
  label: string;
  /** 방문 순서 (스폰 → … → 목표) */
  visited: string[];
  /** 섹터 이동 횟수 = 소모 일수 */
  moves: number;
  /** 노드 일수 */
  nodeDays: number;
  /** 총 일수 */
  days: number;
  blights: number;
  purifyPct: number;
  overBudget: boolean;
}

/** 40 §3-1 — 외출 스폰은 부두, 최종 보스는 북부 */
export const SPAWN_ID = "area_i21";
export const GOAL_ID = "area_i01";
/** 39 — 배가 60일 뒤에 온다 */
export const DAY_BUDGET = 60;

/** 섬 전체 정화도 구간 효과 (41 §4) — 그 판 안에서만 유효, 귀환 시 소멸 */
export const PURIFY_THRESHOLDS = [
  { pct: 25, label: "섬이 숨을 쉰다", effect: "정화한 지역의 촉매 노드가 1회 재생" },
  { pct: 50, label: "색이 반쯤 돌아온다", effect: "정찰조 산출 증가" },
  { pct: 75, label: "아이들이 경계를 풀다", effect: "구조 조우 성공 판정 완화" },
  { pct: 100, label: "섬이 완전히 깨어난다", effect: "최종 보스 타락 게이지 감소" },
];

export interface JourneyInput {
  areas: { area_id: string; display_name: string }[];
  nodes: { npc_id: string; area_id: string }[];
  blights: { target_ref: string; target_kind: string }[];
  connections: { from_area_id: string; to_area_id: string; bidirectional: boolean }[];
}

export function buildSectors(input: JourneyInput): SectorInfo[] {
  const degreeOf = (id: string) =>
    input.connections.filter((c) => c.from_area_id === id || (c.bidirectional && c.to_area_id === id))
      .length;

  return input.areas
    .map((a) => ({
      id: a.area_id,
      name: a.display_name,
      nodeCount: input.nodes.filter((n) => n.area_id === a.area_id).length,
      // AREA 오염만 섬 정화도에 센다(LIFE는 생명 정화로 별도 집계)
      blightCount: input.blights.filter((b) => b.target_ref === a.area_id && b.target_kind === "AREA")
        .length,
      degree: degreeOf(a.area_id),
    }))
    // 연결이 없는 칸(바다 코너)은 여정에서 제외
    .filter((s) => s.degree > 0 || s.nodeCount > 0);
}

/** 연결이 가장 많은 칸 = 허브(중앙) */
export function findHub(sectors: SectorInfo[]): SectorInfo | undefined {
  return [...sectors].sort((a, b) => b.degree - a.degree)[0];
}

function permutations<T>(arr: T[]): T[][] {
  if (arr.length <= 1) return [arr];
  const out: T[][] = [];
  arr.forEach((x, i) => {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    permutations(rest).forEach((p) => out.push([x, ...p]));
  });
  return out;
}

function subsets<T>(arr: T[]): T[][] {
  return arr.reduce<T[][]>((acc, x) => [...acc, ...acc.map((s) => [...s, x])], [[]]);
}

/**
 * 가능한 루트 열거.
 * 십자(별) 구조 전제 — 선택 섹터는 허브에서 왕복하므로 이동 2회씩.
 * 이동 = 1(스폰→허브) + 2×선택수 + 1(허브→목표)
 */
export function enumerateRoutes(sectors: SectorInfo[], totalBlights: number): RouteOption[] {
  const hub = findHub(sectors);
  if (!hub) return [];

  const optional = sectors.filter((s) => s.id !== SPAWN_ID && s.id !== GOAL_ID && s.id !== hub.id);
  const spawn = sectors.find((s) => s.id === SPAWN_ID);
  const goal = sectors.find((s) => s.id === GOAL_ID);
  if (!spawn || !goal) return [];

  const fixedNodes = spawn.nodeCount + hub.nodeCount + goal.nodeCount;
  const fixedBlights = spawn.blightCount + hub.blightCount + goal.blightCount;

  const routes: RouteOption[] = [];
  for (const sub of subsets(optional)) {
    const orders = sub.length <= 1 ? [sub] : permutations(sub);
    for (const order of orders) {
      const nodeDays = fixedNodes + order.reduce((s, x) => s + x.nodeCount, 0);
      const moves = 1 + order.length * 2 + 1;
      const blights = fixedBlights + order.reduce((s, x) => s + x.blightCount, 0);
      const days = nodeDays + moves;
      const visited = [spawn.id, hub.id, ...order.flatMap((o) => [o.id, hub.id]), goal.id];
      routes.push({
        key: [spawn.id, ...order.map((o) => o.id), goal.id].join(">"),
        label:
          order.length === 0
            ? "최단 — 갈래 생략"
            : order.map((o) => o.name.replace(/^무지개섬\s*·\s*/, "")).join(" → "),
        visited,
        moves,
        nodeDays,
        days,
        blights,
        purifyPct: totalBlights > 0 ? Math.round((blights / totalBlights) * 100) : 0,
        overBudget: days > DAY_BUDGET,
      });
    }
  }
  return routes.sort((a, b) => a.days - b.days);
}

export function thresholdsReached(pct: number) {
  return PURIFY_THRESHOLDS.filter((t) => pct >= t.pct);
}
