/**
 * 외출 시작 좌표.
 * 「여정의 시작」NPC가 있으면 그 자리. 없으면 들판 기본 스폰(코드 폴백).
 */
export type SpawnNpc = {
  npc_id: string;
  area_id: string;
  x_pct: number;
  y_pct: number;
  trigger_type: string;
};

/** area_i21 들판 남단 — 시작 NPC를 두지 않을 때 */
const DEFAULT_SPAWN: Record<string, { xPct: number; yPct: number }> = {
  area_i21: { xPct: 51.3, yPct: 75.9 },
};

export function startNpcInArea(npcs: SpawnNpc[], areaId: string): SpawnNpc | null {
  const here = npcs.filter((n) => n.area_id === areaId);
  return here.find((n) => n.npc_id === "s1_start") ?? null;
}

export function spawnPctInArea(
  npcs: SpawnNpc[],
  areaId: string,
): { xPct: number; yPct: number } {
  const n = startNpcInArea(npcs, areaId);
  if (n) return { xPct: n.x_pct, yPct: n.y_pct };
  return DEFAULT_SPAWN[areaId] ?? { xPct: 50, yPct: 88 };
}
