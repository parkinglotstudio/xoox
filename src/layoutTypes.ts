/** UI 레이아웃 에디터 · 로비/인게임 공통 스키마 (가로·세로 보드) */

export type LayoutAction =
  | "NONE"
  | "DEPART"
  | "DISPATCH"
  | "TERMINAL"
  | "PARTY"
  | "ADVENTURE";

export type LayoutItemKind = "sign" | "prop" | "actor" | "decor" | "hotspot";

/** 세로 정렬 기준 — 지면/캐릭은 bottom, 상단 HUD·푯말은 top */
export type LayoutVAnchor = "bottom" | "top";

export type LayoutAspect = "16:9" | "9:16";

export interface LayoutItem {
  id: string;
  kind: LayoutItemKind;
  label: string;
  art: string;
  /** 요소 중심 X (0~100, 월드 왼쪽 기준) */
  x_pct: number;
  /**
   * 세로 거리 %.
   * v_anchor=bottom → 하단에서 위로 (발/밑 고정)
   * v_anchor=top → 상단에서 아래로 (매달린 푯말/HUD)
   */
  y_bottom_pct: number;
  /** 가로 폭 % (월드 폭 기준) */
  w_pct: number;
  action: LayoutAction | string;
  /** 기본 bottom. 무지개섬 등 상단 UI는 top */
  v_anchor?: LayoutVAnchor;
}

export interface SceneLayout {
  id: string;
  label: string;
  aspect: LayoutAspect;
  /** 씬 기본 앵커(아이템별 v_anchor가 우선) */
  anchor: "bottom-left";
  note?: string;
  bg: string;
  /**
   * 팬 월드 가로 폭 = 뷰포트 폭의 %. 100이면 팬 없음.
   * 세로 셸 기본 155 (가로 아트를 밀어 본다).
   */
  world_w_pct?: number;
  items: LayoutItem[];
}

export const LAYOUT_SAVE_PATH = "data/ui/layout/lobby_layout.json";
export const LAYOUT_URL = "/ui/layout/lobby_layout.json";
export const LAYOUT_PORTRAIT_SAVE_PATH = "data/ui/layout/lobby_layout_portrait.json";
export const LAYOUT_PORTRAIT_URL = "/ui/layout/lobby_layout_portrait.json";

/** 본편 기본 셸 — 세로 로비 JSON */
export const RUNTIME_LOBBY_ASPECT: LayoutAspect = "9:16";

/** 세로 팬 월드 기본 폭(뷰포트 대비 %) */
export const DEFAULT_WORLD_W_PCT = 155;

const LAYOUT_URL_BY_ASPECT: Record<LayoutAspect, string> = {
  "16:9": LAYOUT_URL,
  "9:16": LAYOUT_PORTRAIT_URL,
};

const LAYOUT_SAVE_BY_ASPECT: Record<LayoutAspect, string> = {
  "16:9": LAYOUT_SAVE_PATH,
  "9:16": LAYOUT_PORTRAIT_SAVE_PATH,
};

export function lobbyLayoutUrl(aspect: LayoutAspect = RUNTIME_LOBBY_ASPECT): string {
  return LAYOUT_URL_BY_ASPECT[aspect];
}

export function lobbyLayoutSavePath(aspect: LayoutAspect = RUNTIME_LOBBY_ASPECT): string {
  return LAYOUT_SAVE_BY_ASPECT[aspect];
}

export function clampPct(n: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, n));
}

export function itemVAnchor(item: LayoutItem): LayoutVAnchor {
  return item.v_anchor === "top" ? "top" : "bottom";
}

/** 월드 폭 %. 100 이하면 팬 없음 */
export function layoutWorldWPct(layout: Pick<SceneLayout, "world_w_pct" | "aspect">): number {
  const n = Number(layout.world_w_pct);
  if (Number.isFinite(n) && n >= 100) return Math.min(300, Math.round(n));
  return layout.aspect === "9:16" ? DEFAULT_WORLD_W_PCT : 100;
}

export function layoutUsesPan(layout: Pick<SceneLayout, "world_w_pct" | "aspect">): boolean {
  return layoutWorldWPct(layout) > 100;
}

/** 뷰포트가 월드에서 차지하는 가로 % */
export function viewportWidthPct(worldWPct: number): number {
  return Math.min(100, (100 / Math.max(100, worldWPct)) * 100);
}

/** CSS 인라인 — 하단/상단 앵커 (월드 % 기준) */
export function layoutItemStyle(item: LayoutItem): string {
  const v = itemVAnchor(item);
  const yRule = v === "top" ? `top:${item.y_bottom_pct}%` : `bottom:${item.y_bottom_pct}%`;
  return [`left:${item.x_pct}%`, yRule, `width:${item.w_pct}%`].join(";");
}
