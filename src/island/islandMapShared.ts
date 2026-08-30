/**
 * 섬 맵 SSoT — 맵 배치 · 인게임 3D · 마스크 툴이 같은 경로·설정을 쓴다.
 * sector_scale.json = 컨셉 아트 URL
 * map_mask_tool/master/island_master.mask.json = 구역 마스크
 */

export const ISLAND_SCALE_URL = "/ui/layout/sector_scale.json";
export const ISLAND_OVERVIEW_URL = "/ui/journey/island_overview_1km.png";

/** Vite dev 저장·정적 로드 공통 */
export const ISLAND_MASK = {
  masterId: "island_master",
  masterFile: "island_master.mask.json",
  saveMasterFs: "data/map_mask_tool/master",
  loadMasterUrl: "/map_mask_tool/master",
  saveSectorFs: "data/map_mask_tool/masks",
  loadSectorUrl: "/map_mask_tool/masks",
  refsUrl: "/map_mask_tool/refs",
} as const;

export type SectorScaleConfig = {
  island_overview_map?: string;
  sectors?: Record<
    string,
    { label?: string; map?: string; map_before?: string; world_h_pct?: number }
  >;
};

let scaleCache: SectorScaleConfig | null = null;

export function sectorIdOf(areaOrSector: string): string {
  return areaOrSector.replace(/^area_/, "");
}

export function areaIdOf(sectorOrArea: string): string {
  return sectorOrArea.startsWith("area_") ? sectorOrArea : `area_${sectorOrArea}`;
}

export async function loadSectorScale(force = false): Promise<SectorScaleConfig> {
  if (scaleCache && !force) return scaleCache;
  const res = await fetch(`${ISLAND_SCALE_URL}?t=${Date.now()}`);
  if (!res.ok) throw new Error(`sector_scale load failed: ${res.status}`);
  scaleCache = (await res.json()) as SectorScaleConfig;
  return scaleCache;
}

export function invalidateSectorScaleCache(): void {
  scaleCache = null;
}

/** purified=true → 정화후(map), false → 정화전(map_before) */
export function conceptUrlFor(
  scale: SectorScaleConfig,
  areaOrSector: string,
  purified: boolean,
): string | null {
  const areaId = areaIdOf(areaOrSector);
  const sec = scale.sectors?.[areaId];
  if (!sec) return null;
  if (purified) return sec.map ?? sec.map_before ?? null;
  return sec.map_before ?? sec.map ?? null;
}

export function maskDocUrl(sectorId: string, master = sectorId === ISLAND_MASK.masterId): string {
  const base = master ? ISLAND_MASK.loadMasterUrl : ISLAND_MASK.loadSectorUrl;
  const file = master ? ISLAND_MASK.masterFile : `${sectorId}.mask.json`;
  return `${base}/${file}`;
}

export function maskSaveFsPath(sectorId: string, master = sectorId === ISLAND_MASK.masterId): string {
  const dir = master ? ISLAND_MASK.saveMasterFs : ISLAND_MASK.saveSectorFs;
  const file = master ? ISLAND_MASK.masterFile : `${sectorId}.mask.json`;
  return `${dir}/${file}`;
}
