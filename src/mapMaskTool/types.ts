/** 섬 타일 마스크 레이어 — docs/superpowers/specs/2026-08-22-island-tile-pipeline.md */

export const LAYER_IDS = [
  "land",
  "walk",
  "path",
  "forest",
  "flower",
  "pond",
  "lake",
  "rock",
  "debris",
  "blight",
  "farm",
  "village",
  "dock",
  "node",
  "poi",
] as const;

export type LayerId = (typeof LAYER_IDS)[number];

export interface LayerDef {
  id: LayerId;
  label: string;
  brush: string;
  neon: string;
  enabled?: boolean;
}

export const LAYERS: LayerDef[] = [
  { id: "land", label: "섬 육지(면)", brush: "#2a4a40", neon: "#0a1210" },
  /** id `walk` 유지(저장 호환). 의미 = 인게임 타일 작업 구역 */
  { id: "walk", label: "작업 구역(타일)", brush: "#2de0d0", neon: "#2de0d0" },
  { id: "path", label: "길(정보)", brush: "#5eead4", neon: "#2de0d0" },
  { id: "forest", label: "숲", brush: "#3dff6a", neon: "#3dff6a" },
  { id: "flower", label: "들판·꽃", brush: "#ff6ad5", neon: "#ff6ad5" },
  { id: "pond", label: "웅덩이", brush: "#3d8cff", neon: "#3d8cff" },
  { id: "lake", label: "호수", brush: "#1e88e5", neon: "#29b6f6" },
  { id: "rock", label: "산·바위", brush: "#6a5a78", neon: "#7a6a88" },
  { id: "debris", label: "잔해", brush: "#8d6e63", neon: "#a1887f" },
  { id: "blight", label: "오염핵", brush: "#7b1fa2", neon: "#ce93d8" },
  { id: "farm", label: "밭(보관)", brush: "#e6c35c", neon: "#e6c35c", enabled: false },
  { id: "village", label: "마을(보관)", brush: "#ffb84d", neon: "#ffb84d", enabled: false },
  { id: "dock", label: "부두(보관)", brush: "#5ec8ff", neon: "#5ec8ff", enabled: false },
  { id: "node", label: "노드", brush: "#ff4dd2", neon: "#ff4dd2" },
  { id: "poi", label: "POI", brush: "#b8ff4d", neon: "#b8ff4d" },
];

export const ACTIVE_LAYERS: LayerDef[] = LAYERS.filter((L) => L.enabled !== false);

/** @deprecated Phase 스텝 사용 — 호환용 */
export const MASTER_EDIT_LAYERS: LayerDef[] = LAYERS.filter((L) => L.id === "land" || L.id === "walk");

export type MaskPhaseId = 0 | 1 | 2 | 3 | 4;

/** 브러시가 먹는 범위 — Phase마다 다름 */
export type PaintClip = "none" | "rim" | "workzone";

export interface MaskPhaseDef {
  id: MaskPhaseId;
  label: string;
  /** 이 단계에서 브러시로 편집 */
  edit: LayerId[];
  /** 배경으로만 보이는 이전 단계 레이어 */
  ghost: LayerId[];
  paint: boolean;
  previewModes: boolean;
  /** none=제한없음 · rim=작업구역 밖·육지 · workzone=작업구역 안 */
  paintClip: PaintClip;
  checklist: string[];
}

/** 마스터 Phase — docs/superpowers/specs/2026-08-23-island-zone-placement.md */
export const MASK_PHASES: MaskPhaseDef[] = [
  {
    id: 0,
    label: "0 레이아웃",
    edit: ["land", "walk"],
    ghost: [],
    paint: true,
    previewModes: false,
    paintClip: "none",
    checklist: [
      "land = 닫힌 섬 면 (선이면 ‘면 채움’)",
      "walk = 작업 구역(인게임 타일 범위, 십자)",
      "코너 i00·i02·i20·i22에 작업 구역 없음",
      "작업 구역 밖은 인게임 비표시·미니맵만",
    ],
  },
  {
    id: 1,
    label: "1 외곽(미니맵)",
    edit: ["forest", "rock"],
    ghost: ["land", "walk"],
    paint: true,
    previewModes: true,
    paintClip: "rim",
    checklist: [
      "작업구역 밖만 칠됨 (안쪽은 안 먹음)",
      "코너·해안 = 숲/산 · 미니맵용",
      "i01 북 / i10 서 / i12 동 / i21 해안",
    ],
  },
  {
    id: 2,
    label: "2 작업구역(안)",
    edit: ["path", "forest", "rock", "flower", "lake", "pond"],
    ghost: ["land", "walk"],
    paint: true,
    previewModes: true,
    paintClip: "none",
    checklist: [
      "숲 칠하면 들판은 그 자리에서 지워짐 (덮어쓰기)",
      "길·숲·산·들·물 — 드래그 후 저장",
      "큰 숲 · 산≠길 · 숲속 호수+길(i01)",
    ],
  },
  {
    id: 3,
    label: "3 소프트",
    edit: ["flower", "debris", "blight", "path"],
    ghost: ["land", "walk", "forest", "rock", "lake", "pond"],
    paint: true,
    previewModes: true,
    paintClip: "none",
    checklist: [
      "숲은 그대로 보임 (들판이 숲을 덮지 않음)",
      "꽃·잔해·오염만 추가 칠하기",
      "길 보정도 가능",
    ],
  },
  {
    id: 4,
    label: "4 미리보기",
    edit: ["path"],
    ghost: ["land", "walk", "forest", "rock", "lake", "pond", "flower", "debris", "blight"],
    paint: true,
    previewModes: true,
    paintClip: "none",
    checklist: [
      "네온/인상주의는 참고 · 길만 살짝 보정",
      "숲·들·물이 네 마스크대로면 OK",
      "완성 아트·프로젝트 카피 금지",
    ],
  },
];

export const ZONE_CELL_GUIDE: Record<string, string> = {
  i21: "들판·스폰 — 길↑ · 꽃/잔해 · 밖 해안바위+숲",
  i11: "허브 — 십자 길 · 호수 · 들/꽃 · 수풀",
  i01: "큰 숲 — 숲속 호수+길 비네트 · 산≠길 · 밖 산밀림",
  i10: "서 큰숲↔들 — 길→허브 · 연못 · 밖 산숲",
  i12: "동 산·들 — 산≠길 · 들판 · 밖 바위숲",
  i00: "미니맵만 — 산+밀림",
  i02: "미니맵만 — 밀림(+바위)",
  i20: "미니맵만 — 숲+바위",
  i22: "미니맵만 — 숲",
};

export function layerDef(id: LayerId): LayerDef | undefined {
  return LAYERS.find((L) => L.id === id);
}
export const MASK_SIZE = 512;
export const MASTER_CELLS = 3;
export const MASTER_SIZE = MASK_SIZE * MASTER_CELLS;
export const MASTER_ID = "island_master";

/** 작업 구역(타일)이 있는 십자 칸 — 저장 키 호환로 이름 유지 */
export const WALK_SECTORS = ["i01", "i10", "i11", "i12", "i21"] as const;

/** 9칸 라벨 row×col */
export const MASTER_CELL_IDS: string[][] = [
  ["i00", "i01", "i02"],
  ["i10", "i11", "i12"],
  ["i20", "i21", "i22"],
];

export interface MaskDoc {
  version: 1;
  sector_id: string;
  size: number;
  note: string;
  layers: Partial<Record<LayerId, string>>;
}

export function emptyDoc(sectorId: string, size = MASK_SIZE): MaskDoc {
  return {
    version: 1,
    sector_id: sectorId,
    size,
    note: "섬 타일 마스크. 스펙: 2026-08-22-island-tile-pipeline",
    layers: {},
  };
}
