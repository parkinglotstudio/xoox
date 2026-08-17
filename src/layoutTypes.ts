/** UI 레이아웃 에디터 · 로비/인게임 공통 스키마 (16:9) */

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

export interface LayoutItem {
  id: string;
  kind: LayoutItemKind;
  label: string;
  art: string;
  /** 요소 중심 X (0~100, 왼쪽 기준) */
  x_pct: number;
  /**
   * 세로 거리 %.
   * v_anchor=bottom → 하단에서 위로 (발/밑 고정)
   * v_anchor=top → 상단에서 아래로 (매달린 푯말/HUD)
   */
  y_bottom_pct: number;
  /** 가로 폭 % */
  w_pct: number;
  action: LayoutAction | string;
  /** 기본 bottom. 무지개섬 등 상단 UI는 top */
  v_anchor?: LayoutVAnchor;
}

export interface SceneLayout {
  id: string;
  label: string;
  aspect: "16:9";
  /** 씬 기본 앵커(아이템별 v_anchor가 우선) */
  anchor: "bottom-left";
  note?: string;
  bg: string;
  items: LayoutItem[];
}

export const LAYOUT_SAVE_PATH = "data/ui/layout/lobby_layout.json";
export const LAYOUT_URL = "/ui/layout/lobby_layout.json";

export function clampPct(n: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, n));
}

export function itemVAnchor(item: LayoutItem): LayoutVAnchor {
  return item.v_anchor === "top" ? "top" : "bottom";
}

/** CSS 인라인 — 하단/상단 앵커 */
export function layoutItemStyle(item: LayoutItem): string {
  const v = itemVAnchor(item);
  const yRule = v === "top" ? `top:${item.y_bottom_pct}%` : `bottom:${item.y_bottom_pct}%`;
  return [`left:${item.x_pct}%`, yRule, `width:${item.w_pct}%`].join(";");
}
