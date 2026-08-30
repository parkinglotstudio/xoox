/**
 * 육지 5칸 로드 순서.
 * 현재 컨셉: i21 = 남쪽 들판 스폰 (부두 아님). 코너 바다는 여기 없음.
 */
export const LAND_SECTOR_IDS = ["i01", "i10", "i11", "i12", "i21"] as const;

export type LandSectorId = (typeof LAND_SECTOR_IDS)[number];

const LAND = new Set<string>(LAND_SECTOR_IDS);

export function isLandSector(id: string): boolean {
  return LAND.has(id);
}

/** 격자 상하좌우 중 육지만. */
export function landNeighbors(id: string): string[] {
  if (id.length < 3) return [];
  const row = Number(id[1]);
  const col = Number(id[2]);
  if (!Number.isFinite(row) || !Number.isFinite(col)) return [];
  return [`i${row - 1}${col}`, `i${row + 1}${col}`, `i${row}${col - 1}`, `i${row}${col + 1}`].filter((n) =>
    LAND.has(n),
  );
}

/**
 * 스폰 칸 → 이웃 BFS → 남은 칸.
 * 기본 스폰은 들판 i21 이라서 i21 → i11 → 나머지.
 */
export function landLoadOrder(spawnId: string, landIds: readonly string[] = LAND_SECTOR_IDS): string[] {
  const land = landIds.filter((id) => LAND.has(id));
  if (!land.length) return [];
  const spawn = land.includes(spawnId) ? spawnId : land.includes("i21") ? "i21" : land[0];
  const seen = new Set<string>();
  const order: string[] = [];
  const q: string[] = [spawn];
  while (q.length) {
    const id = q.shift()!;
    if (seen.has(id) || !land.includes(id)) continue;
    seen.add(id);
    order.push(id);
    for (const n of landNeighbors(id)) {
      if (!seen.has(n) && land.includes(n)) q.push(n);
    }
  }
  for (const id of land) {
    if (!seen.has(id)) order.push(id);
  }
  return order;
}
