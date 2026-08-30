/**
 * 여정 인게임 HUD 배치 — 필러(공간) 안에 위젯을 넣고, 크기·노출·겹침을 저장한다.
 *
 * 편집: /hud-layout-tool.html
 * 저장: data/ui/layout/journey_hud_layout.json
 * 본편은 applyJourneyHudLayout()이 CSS 변수(cqw/cqh)로 입힌다.
 */

export type HudAspect = "16:9" | "9:16";

export const HUD_LAYOUT_URL = "/ui/layout/journey_hud_layout.json";
export const HUD_LAYOUT_SAVE_PATH = "data/ui/layout/journey_hud_layout.json";
export const HUD_LAYOUT_PORTRAIT_URL = "/ui/layout/journey_hud_layout_portrait.json";
export const HUD_LAYOUT_PORTRAIT_SAVE_PATH = "data/ui/layout/journey_hud_layout_portrait.json";

export const HUD_ASPECT_URL: Record<HudAspect, string> = {
  "16:9": HUD_LAYOUT_URL,
  "9:16": HUD_LAYOUT_PORTRAIT_URL,
};
export const HUD_ASPECT_SAVE_PATH: Record<HudAspect, string> = {
  "16:9": HUD_LAYOUT_SAVE_PATH,
  "9:16": HUD_LAYOUT_PORTRAIT_SAVE_PATH,
};

/** 본편 기본 셸 — 세로는 portrait JSON */
export const RUNTIME_HUD_ASPECT: HudAspect = "9:16";

export type HudFlow = "fill" | "overlay" | "row" | "stack";

export interface HudPillar {
  id: string;
  label: string;
  visible: boolean;
  x_pct: number;
  y_pct: number;
  w_pct: number;
  h_pct: number;
  z: number;
  flow: HudFlow;
}

export interface HudWidget {
  id: string;
  /** null이면 화면 자유 배치 */
  pillar_id: string | null;
  visible: boolean;
  /** false면 에디터에서 다른 상자 위로 못 올린다 */
  overlap: boolean;
  lock: boolean;
  /** 16:9 화면에서 시각적으로 정사각 */
  keep_square?: boolean;
  z: number;
  /** 자유 배치면 화면 %, 필러+overlay면 필러 안 % */
  x_pct: number;
  y_pct: number;
  w_pct: number;
  h_pct: number;
}

export interface JourneyHudLayout {
  id: "journey_hud";
  version: number;
  aspect: HudAspect;
  note: string;
  snap: number;
  /**
   * 세로 셸만 — 상단 3D 연출 칸 높이 %. 나머지 = 필러.
   * 가로 보드에서는 무시(100).
   */
  stage_h_pct?: number;
  /**
   * 세로 셸만 — 연출/필러 경계 아치(시안 라인+보울).
   * y_pct 기본값은 stage_h_pct 와 같다.
   */
  seam?: HudSeam;
  pillars: HudPillar[];
  widgets: HudWidget[];
}

/** 세로 아치 구분선 — 폰 전체 % 기준 */
export interface HudSeam {
  /** 아치 기준선(연출 하단). 기본 = stage_h_pct */
  y_pct: number;
  /** 아치 그래픽 높이(폰 %) */
  h_pct: number;
  /** SVG viewBox 곡선 깊이(클수록 아래로 깊게). 24~68 */
  curve: number;
  /** 시안 스트로크 두께 */
  stroke_w: number;
}

/** 세로 연출 칸 기본·클램프 */
export const DEFAULT_STAGE_H_PCT = 60;
export const STAGE_H_MIN = 35;
export const STAGE_H_MAX = 85;

export const DEFAULT_SEAM: HudSeam = {
  y_pct: DEFAULT_STAGE_H_PCT,
  h_pct: 8,
  curve: 56,
  stroke_w: 3.2,
};
export const SEAM_H_MIN = 4;
export const SEAM_H_MAX = 18;
export const SEAM_CURVE_MIN = 24;
export const SEAM_CURVE_MAX = 68;
export const SEAM_STROKE_MIN = 1.5;
export const SEAM_STROKE_MAX = 6;

export function layoutStageHPct(layout: Pick<JourneyHudLayout, "aspect" | "stage_h_pct">): number {
  if (layout.aspect !== "9:16") return 100;
  const n = Number(layout.stage_h_pct);
  if (!Number.isFinite(n)) return DEFAULT_STAGE_H_PCT;
  return clampPct(n, STAGE_H_MIN, STAGE_H_MAX);
}

export interface WidgetDef {
  id: string;
  label: string;
  hint: string;
  selector: string;
  keep_square?: boolean;
  /** 에디터에서 제목 줄을 생략 — 칩·게이지처럼 한 덩어리로 보이게 */
  compact?: boolean;
  tone: string;
}

export interface ResolvedRect {
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  visible: boolean;
  overlap: boolean;
}

/** 본편 DOM에 붙는 HUD 조각. id는 레이아웃 JSON과 같다. */
export const WIDGET_DEFS: WidgetDef[] = [
  { id: "header_brand", label: "무지개섬", hint: "로비 복귀 칩", selector: ".phone[data-scene='journey'] .shell-brand", tone: "#3d6a78", compact: true },
  { id: "header_area", label: "현재 지역", hint: "스테이지 칩", selector: ".phone[data-scene='journey'] #shellAreaChip", tone: "#2a5a58", compact: true },
  { id: "header_hp", label: "정화%", hint: "상단 섬 정화 기록", selector: ".phone[data-scene='journey'] .shell-top-hp", tone: "#2a5a58", compact: true },
  { id: "header_gold", label: "보석", hint: "상단 재화 칩", selector: ".phone[data-scene='journey'] .shell-top-gold", tone: "#3d4a6a", compact: true },
  { id: "compass", label: "방위 띠", hint: "FPS/3인칭 나침반", selector: ".phone.view-3d .fps-compass", tone: "#2a5a6a" },
  { id: "party", label: "파티 정보", hint: "모험가 카드", selector: ".phone[data-scene='journey'] #partyHud", tone: "#1a4a44" },
  { id: "minimap", label: "미니맵", hint: "탑뷰 축소", selector: ".phone.view-3d .explore-layer.minimap", tone: "#1a3048", keep_square: true },
  { id: "log", label: "구조 로그", hint: "오른쪽 필러", selector: ".phone[data-scene='journey'] #shellLog", tone: "#143038" },
  { id: "talk_them", label: "상대 대사", hint: "상단 연출 · 왼쪽 (올마스·파이퍼 등)", selector: ".phone.view-3d[data-scene='journey'] #stageFeedThem", tone: "#2a3a58" },
  { id: "talk_me", label: "방랑자 대사", hint: "상단 연출 · 오른쪽", selector: ".phone.view-3d[data-scene='journey'] #stageFeedMe", tone: "#3a2a48" },
  { id: "activity", label: "현재 활동", hint: "가운데 토스트", selector: ".phone[data-scene='journey'] #activityToast", tone: "#2a2848" },
  { id: "prompt", label: "확인 프롬프트", hint: "노드 근접 「○○ 확인」", selector: ".phone.view-3d .stage3d-prompt", tone: "#4a3a18", compact: true },
  { id: "roadmap", label: "일차 로드맵", hint: "3D일 때 좌하단", selector: ".phone.view-3d .day-roadmap", tone: "#243820" },
  { id: "catalyst", label: "촉매", hint: "정화 촉매 칩", selector: ".phone[data-scene='journey'] #catalystHud", tone: "#3a2a18" },
  { id: "gauge_jackpot", label: "대박", hint: "메인 버튼 왼쪽", selector: ".phone[data-scene='journey'] .gauge.jackpot", tone: "#4a3a10", compact: true },
  { id: "main_btn", label: "메인 버튼", hint: "다음날 / 선택", selector: ".phone[data-scene='journey'] #mainBtn", tone: "#0e3a34", compact: true },
  { id: "gauge_mid", label: "중박", hint: "메인 버튼 오른쪽", selector: ".phone[data-scene='journey'] .gauge.mid", tone: "#3a2040", compact: true },
];

export function widgetDef(id: string): WidgetDef | undefined {
  return WIDGET_DEFS.find((d) => d.id === id);
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function clampPct(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, n));
}

/** 현재 보드 비율에서 가로 w% 와 같은 픽셀의 세로 % */
export function squareH(wPct: number, aspect: HudAspect = "16:9"): number {
  const [aw, ah] = aspect === "9:16" ? [9, 16] : [16, 9];
  return round1(wPct * (aw / ah));
}

export function squareW(hPct: number, aspect: HudAspect = "16:9"): number {
  const [aw, ah] = aspect === "9:16" ? [9, 16] : [16, 9];
  return round1(hPct * (ah / aw));
}

export const HUD_LAYOUT_DEFAULTS: JourneyHudLayout = {
  id: "journey_hud",
  version: 1,
  aspect: "16:9",
  note: "여정 HUD. 필러=공간, 위젯=그 안에 넣는 UI. 편집: /hud-layout-tool.html",
  snap: 0.5,
  pillars: [
    { id: "p_brand", label: "무지개섬 칸", visible: true, x_pct: 0.8, y_pct: 0.6, w_pct: 11, h_pct: 5.2, z: 8, flow: "fill" },
    { id: "p_area", label: "지역 칸", visible: true, x_pct: 12.4, y_pct: 0.6, w_pct: 14, h_pct: 5.2, z: 8, flow: "fill" },
    { id: "p_hp", label: "HP 칸", visible: true, x_pct: 58, y_pct: 0.6, w_pct: 11, h_pct: 5.2, z: 8, flow: "fill" },
    { id: "p_gold", label: "보석 칸", visible: true, x_pct: 69.5, y_pct: 0.6, w_pct: 6.5, h_pct: 5.2, z: 8, flow: "fill" },
    { id: "p_party", label: "파티 칸", visible: true, x_pct: 0.8, y_pct: 6.4, w_pct: 16, h_pct: 18, z: 6, flow: "fill" },
    { id: "p_compass", label: "방위 칸", visible: true, x_pct: 28, y_pct: 0.5, w_pct: 28, h_pct: 5, z: 9, flow: "fill" },
    { id: "p_minimap", label: "미니맵 칸", visible: true, x_pct: 84, y_pct: 1, w_pct: 15, h_pct: 18, z: 7, flow: "fill" },
    { id: "p_log", label: "로그 필러", visible: true, x_pct: 76.5, y_pct: 33, w_pct: 23.5, h_pct: 55, z: 5, flow: "fill" },
    { id: "p_talk_them", label: "상대 대사 칸", visible: false, x_pct: 1, y_pct: 18, w_pct: 22, h_pct: 16, z: 20, flow: "fill" },
    { id: "p_talk_me", label: "방랑자 대사 칸", visible: false, x_pct: 52, y_pct: 18, w_pct: 22, h_pct: 16, z: 20, flow: "fill" },
    { id: "p_toast", label: "활동 칸", visible: true, x_pct: 22, y_pct: 38, w_pct: 40, h_pct: 14, z: 8, flow: "fill" },
    { id: "p_prompt", label: "확인 프롬프트 칸", visible: true, x_pct: 32, y_pct: 72, w_pct: 36, h_pct: 7, z: 40, flow: "fill" },
    { id: "p_jackpot", label: "대박 칸", visible: true, x_pct: 28, y_pct: 88.5, w_pct: 7.5, h_pct: 10.5, z: 11, flow: "fill" },
    { id: "p_main", label: "메인 버튼 칸", visible: true, x_pct: 36.5, y_pct: 89.2, w_pct: 27, h_pct: 8.8, z: 11, flow: "fill" },
    { id: "p_mid", label: "중박 칸", visible: true, x_pct: 64.5, y_pct: 88.5, w_pct: 7.5, h_pct: 10.5, z: 11, flow: "fill" },
  ],
  widgets: [
    { id: "header_brand", pillar_id: "p_brand", visible: true, overlap: true, lock: false, z: 8, x_pct: 0, y_pct: 0, w_pct: 100, h_pct: 100 },
    { id: "header_area", pillar_id: "p_area", visible: true, overlap: true, lock: false, z: 8, x_pct: 0, y_pct: 0, w_pct: 100, h_pct: 100 },
    { id: "header_hp", pillar_id: "p_hp", visible: true, overlap: true, lock: false, z: 8, x_pct: 0, y_pct: 0, w_pct: 100, h_pct: 100 },
    { id: "header_gold", pillar_id: "p_gold", visible: true, overlap: true, lock: false, z: 8, x_pct: 0, y_pct: 0, w_pct: 100, h_pct: 100 },
    { id: "compass", pillar_id: "p_compass", visible: true, overlap: true, lock: false, z: 9, x_pct: 0, y_pct: 0, w_pct: 100, h_pct: 100 },
    { id: "party", pillar_id: "p_party", visible: true, overlap: true, lock: false, z: 6, x_pct: 0, y_pct: 0, w_pct: 100, h_pct: 100 },
    { id: "minimap", pillar_id: "p_minimap", visible: true, overlap: true, lock: false, keep_square: true, z: 7, x_pct: 0, y_pct: 0, w_pct: 100, h_pct: 100 },
    { id: "log", pillar_id: "p_log", visible: true, overlap: true, lock: false, z: 5, x_pct: 0, y_pct: 0, w_pct: 100, h_pct: 100 },
    { id: "talk_them", pillar_id: "p_talk_them", visible: false, overlap: true, lock: false, z: 20, x_pct: 0, y_pct: 0, w_pct: 100, h_pct: 100 },
    { id: "talk_me", pillar_id: "p_talk_me", visible: false, overlap: true, lock: false, z: 20, x_pct: 0, y_pct: 0, w_pct: 100, h_pct: 100 },
    { id: "activity", pillar_id: "p_toast", visible: true, overlap: true, lock: false, z: 8, x_pct: 0, y_pct: 0, w_pct: 100, h_pct: 100 },
    { id: "prompt", pillar_id: "p_prompt", visible: true, overlap: true, lock: false, z: 40, x_pct: 0, y_pct: 0, w_pct: 100, h_pct: 100 },
    { id: "roadmap", pillar_id: null, visible: true, overlap: true, lock: false, z: 8, x_pct: 0.8, y_pct: 78, w_pct: 28, h_pct: 8 },
    { id: "catalyst", pillar_id: null, visible: true, overlap: true, lock: false, z: 12, x_pct: 1, y_pct: 48, w_pct: 16, h_pct: 10 },
    { id: "gauge_jackpot", pillar_id: "p_jackpot", visible: true, overlap: true, lock: false, z: 11, x_pct: 0, y_pct: 0, w_pct: 100, h_pct: 100 },
    { id: "main_btn", pillar_id: "p_main", visible: true, overlap: true, lock: false, z: 11, x_pct: 0, y_pct: 0, w_pct: 100, h_pct: 100 },
    { id: "gauge_mid", pillar_id: "p_mid", visible: true, overlap: true, lock: false, z: 11, x_pct: 0, y_pct: 0, w_pct: 100, h_pct: 100 },
  ],
};

/** 세로 기본 — JSON과 동기. 툴 보드 전환·로드 실패 시 폴백 */
export const HUD_LAYOUT_PORTRAIT_DEFAULTS: JourneyHudLayout = {
  id: "journey_hud",
  version: 1,
  aspect: "9:16",
  note: "세로 · 위 연출(지도·정보·마일스톤·팝업) / 아래 필러(로그만)+푸터",
  snap: 0.5,
  stage_h_pct: DEFAULT_STAGE_H_PCT,
  pillars: [
    { id: "p_compass", label: "방위 칸", visible: true, x_pct: 22, y_pct: 1, w_pct: 56, h_pct: 4.5, z: 9, flow: "fill" },
    { id: "p_area", label: "지역 칸", visible: true, x_pct: 58, y_pct: 5.5, w_pct: 40, h_pct: 3.5, z: 8, flow: "fill" },
    { id: "p_hp", label: "HP 칸", visible: true, x_pct: 2, y_pct: 5.5, w_pct: 30, h_pct: 3.5, z: 8, flow: "fill" },
    { id: "p_brand", label: "무지개섬 칸", visible: false, x_pct: 2, y_pct: 20, w_pct: 28, h_pct: 3.5, z: 8, flow: "fill" },
    { id: "p_gold", label: "보석 칸", visible: false, x_pct: 32, y_pct: 5, w_pct: 18, h_pct: 3.5, z: 8, flow: "fill" },
    { id: "p_party", label: "파티 칸", visible: true, x_pct: 1, y_pct: 5.5, w_pct: 38, h_pct: 15, z: 6, flow: "fill" },
    { id: "p_minimap", label: "미니맵 칸", visible: true, x_pct: 89, y_pct: 5.5, w_pct: 9, h_pct: 5, z: 7, flow: "fill" },
    { id: "p_toast", label: "활동 칸", visible: true, x_pct: 40, y_pct: 20.5, w_pct: 42, h_pct: 6, z: 10, flow: "fill" },
    { id: "p_prompt", label: "확인 프롬프트 칸", visible: true, x_pct: 18, y_pct: 54, w_pct: 64, h_pct: 4.5, z: 40, flow: "fill" },
    { id: "p_log", label: "로그 필러", visible: true, x_pct: 0, y_pct: 60, w_pct: 100, h_pct: 28, z: 45, flow: "fill" },
    { id: "p_talk_them", label: "상대 대사 칸", visible: false, x_pct: 1, y_pct: 32, w_pct: 36, h_pct: 16, z: 20, flow: "fill" },
    { id: "p_talk_me", label: "방랑자 대사 칸", visible: false, x_pct: 63, y_pct: 32, w_pct: 36, h_pct: 16, z: 20, flow: "fill" },
    { id: "p_jackpot", label: "대박 칸", visible: true, x_pct: 4, y_pct: 90, w_pct: 18, h_pct: 8, z: 11, flow: "fill" },
    { id: "p_main", label: "메인 버튼 칸", visible: true, x_pct: 18, y_pct: 61.5, w_pct: 64, h_pct: 8.5, z: 42, flow: "fill" },
    { id: "p_mid", label: "중박 칸", visible: true, x_pct: 78, y_pct: 90, w_pct: 18, h_pct: 8, z: 11, flow: "fill" },
  ],
  widgets: [
    { id: "header_brand", pillar_id: "p_brand", visible: true, overlap: true, lock: false, z: 8, x_pct: 0, y_pct: 0, w_pct: 100, h_pct: 100 },
    { id: "header_area", pillar_id: "p_area", visible: true, overlap: true, lock: false, z: 8, x_pct: 0, y_pct: 0, w_pct: 100, h_pct: 100 },
    { id: "header_hp", pillar_id: "p_hp", visible: true, overlap: true, lock: false, z: 8, x_pct: 0, y_pct: 0, w_pct: 100, h_pct: 100 },
    { id: "header_gold", pillar_id: "p_gold", visible: true, overlap: true, lock: false, z: 8, x_pct: 0, y_pct: 0, w_pct: 100, h_pct: 100 },
    { id: "compass", pillar_id: "p_compass", visible: true, overlap: true, lock: false, z: 9, x_pct: 0, y_pct: 0, w_pct: 100, h_pct: 100 },
    { id: "party", pillar_id: "p_party", visible: true, overlap: true, lock: false, z: 6, x_pct: 0, y_pct: 0, w_pct: 100, h_pct: 100 },
    { id: "minimap", pillar_id: "p_minimap", visible: true, overlap: true, lock: false, keep_square: true, z: 7, x_pct: 0, y_pct: 0, w_pct: 100, h_pct: 100 },
    { id: "log", pillar_id: "p_log", visible: true, overlap: true, lock: false, z: 45, x_pct: 0, y_pct: 0, w_pct: 100, h_pct: 100 },
    { id: "talk_them", pillar_id: "p_talk_them", visible: false, overlap: true, lock: false, z: 20, x_pct: 0, y_pct: 0, w_pct: 100, h_pct: 100 },
    { id: "talk_me", pillar_id: "p_talk_me", visible: false, overlap: true, lock: false, z: 20, x_pct: 0, y_pct: 0, w_pct: 100, h_pct: 100 },
    { id: "activity", pillar_id: "p_toast", visible: true, overlap: true, lock: false, z: 10, x_pct: 0, y_pct: 0, w_pct: 100, h_pct: 100 },
    { id: "prompt", pillar_id: "p_prompt", visible: true, overlap: true, lock: false, z: 40, x_pct: 0, y_pct: 0, w_pct: 100, h_pct: 100 },
    { id: "roadmap", pillar_id: null, visible: true, overlap: true, lock: false, z: 8, x_pct: 28, y_pct: 48, w_pct: 70, h_pct: 10 },
    { id: "catalyst", pillar_id: null, visible: true, overlap: true, lock: false, z: 12, x_pct: 1, y_pct: 21.5, w_pct: 32, h_pct: 9 },
    { id: "gauge_jackpot", pillar_id: "p_jackpot", visible: true, overlap: true, lock: false, z: 11, x_pct: 0, y_pct: 0, w_pct: 100, h_pct: 100 },
    { id: "main_btn", pillar_id: "p_main", visible: true, overlap: true, lock: false, z: 42, x_pct: 0, y_pct: 0, w_pct: 100, h_pct: 100 },
    { id: "gauge_mid", pillar_id: "p_mid", visible: true, overlap: true, lock: false, z: 11, x_pct: 0, y_pct: 0, w_pct: 100, h_pct: 100 },
  ],
};

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

export function normalizeHudLayout(raw: unknown, aspectHint?: HudAspect): JourneyHudLayout {
  const want: HudAspect =
    aspectHint === "9:16" || aspectHint === "16:9"
      ? aspectHint
      : raw && typeof raw === "object" && (raw as { aspect?: string }).aspect === "9:16"
        ? "9:16"
        : "16:9";
  const d = clone(want === "9:16" ? HUD_LAYOUT_PORTRAIT_DEFAULTS : HUD_LAYOUT_DEFAULTS);
  if (!raw || typeof raw !== "object") return d;
  const r = raw as Partial<JourneyHudLayout>;
  const out: JourneyHudLayout = {
    ...d,
    aspect: want,
    snap: typeof r.snap === "number" ? r.snap : d.snap,
    note: typeof r.note === "string" ? r.note : d.note,
    version: 1,
    stage_h_pct:
      want === "9:16"
        ? clampPct(
            Number.isFinite(Number(r.stage_h_pct)) ? Number(r.stage_h_pct) : (d.stage_h_pct ?? DEFAULT_STAGE_H_PCT),
            STAGE_H_MIN,
            STAGE_H_MAX,
          )
        : undefined,
  };
  if (Array.isArray(r.pillars) && r.pillars.length) {
    const drop = new Set(["p_header", "p_footer"]);
    const saved = r.pillars
      .map((p) => ({
        id: String(p.id || ""),
        label: String(p.label || p.id || "필러"),
        visible: p.visible !== false,
        x_pct: clampPct(Number(p.x_pct) || 0),
        y_pct: clampPct(Number(p.y_pct) || 0),
        w_pct: clampPct(Number(p.w_pct) || 10, 2, 100),
        h_pct: clampPct(Number(p.h_pct) || 10, 2, 100),
        z: Number(p.z) || 1,
        flow: (["fill", "overlay", "row", "stack"] as HudFlow[]).includes(p.flow as HudFlow)
          ? (p.flow as HudFlow)
          : "fill",
      }))
      .filter((p) => p.id && !drop.has(p.id));
    const ids = new Set(saved.map((p) => p.id));
    out.pillars = [...saved, ...d.pillars.filter((p) => !ids.has(p.id))];
  }
  const byId = new Map(d.widgets.map((w) => [w.id, w]));
  if (Array.isArray(r.widgets)) {
    for (const w of r.widgets) {
      const base = byId.get(w.id);
      if (!base) continue;
      const stale = w.pillar_id === "p_header" || w.pillar_id === "p_footer";
      byId.set(w.id, stale
        ? { ...base }
        : {
            ...base,
            pillar_id: w.pillar_id === undefined ? base.pillar_id : w.pillar_id,
            visible: w.visible !== false,
            overlap: w.overlap !== false,
            lock: !!w.lock,
            keep_square: w.keep_square ?? base.keep_square,
            z: Number(w.z) || base.z,
            x_pct: clampPct(Number(w.x_pct) ?? base.x_pct),
            y_pct: clampPct(Number(w.y_pct) ?? base.y_pct),
            w_pct: clampPct(Number(w.w_pct) || base.w_pct, 1, 100),
            h_pct: clampPct(Number(w.h_pct) || base.h_pct, 1, 100),
          });
    }
  }
  out.widgets = WIDGET_DEFS.map((def) => byId.get(def.id)!);
  return out;
}

function pillarRel(p: HudPillar, w: HudWidget): ResolvedRect {
  return {
    x: round1(p.x_pct + (p.w_pct * w.x_pct) / 100),
    y: round1(p.y_pct + (p.h_pct * w.y_pct) / 100),
    w: round1((p.w_pct * w.w_pct) / 100),
    h: round1((p.h_pct * w.h_pct) / 100),
    z: w.z,
    visible: true,
    overlap: w.overlap,
  };
}

/** 필러·위젯을 화면 % 상자로 푼다. 본편 CSS와 에디터 미리보기가 같이 쓴다. */
export function resolveRects(layout: JourneyHudLayout): Map<string, ResolvedRect> {
  const map = new Map<string, ResolvedRect>();
  for (const w of layout.widgets) {
    if (!w.visible) {
      map.set(w.id, { x: 0, y: 0, w: 0, h: 0, z: w.z, visible: false, overlap: w.overlap });
      continue;
    }
    if (w.pillar_id) {
      const pillar = layout.pillars.find((p) => p.id === w.pillar_id);
      if (!pillar || !pillar.visible) {
        // 필러에 넣은 위젯은 칸이 꺼지면 같이 숨는다. 화면 한가운데로 풀리지 않는다.
        map.set(w.id, { x: 0, y: 0, w: 0, h: 0, z: w.z, visible: false, overlap: w.overlap });
        continue;
      }
      const siblings = layout.widgets.filter((s) => s.visible && s.pillar_id === pillar.id);
      if (pillar.flow === "row" && siblings.length > 1) {
        const i = siblings.findIndex((s) => s.id === w.id);
        const slice = 100 / siblings.length;
        map.set(w.id, {
          x: round1(pillar.x_pct + (pillar.w_pct * i * slice) / 100),
          y: pillar.y_pct,
          w: round1((pillar.w_pct * slice) / 100),
          h: pillar.h_pct,
          z: w.z,
          visible: true,
          overlap: w.overlap,
        });
        continue;
      }
      if (pillar.flow === "stack" && siblings.length > 1) {
        const i = siblings.findIndex((s) => s.id === w.id);
        const slice = 100 / siblings.length;
        map.set(w.id, {
          x: pillar.x_pct,
          y: round1(pillar.y_pct + (pillar.h_pct * i * slice) / 100),
          w: pillar.w_pct,
          h: round1((pillar.h_pct * slice) / 100),
          z: w.z,
          visible: true,
          overlap: w.overlap,
        });
        continue;
      }
      if (pillar.flow === "fill") {
        map.set(w.id, {
          x: pillar.x_pct,
          y: pillar.y_pct,
          w: pillar.w_pct,
          h: pillar.h_pct,
          z: w.z,
          visible: true,
          overlap: w.overlap,
        });
        continue;
      }
      map.set(w.id, pillarRel(pillar, w));
      continue;
    }
    let ww = w.w_pct;
    let hh = w.h_pct;
    if (w.keep_square) hh = squareH(ww, layout.aspect);
    map.set(w.id, {
      x: w.x_pct,
      y: w.y_pct,
      w: ww,
      h: hh,
      z: w.z,
      visible: true,
      overlap: w.overlap,
    });
  }
  return map;
}

export function boxesOverlap(a: ResolvedRect, b: ResolvedRect, pad = 0.4): boolean {
  if (!a.visible || !b.visible) return false;
  return !(
    a.x + a.w <= b.x + pad ||
    b.x + b.w <= a.x + pad ||
    a.y + a.h <= b.y + pad ||
    b.y + b.h <= a.y + pad
  );
}

const cachedByAspect: Partial<Record<HudAspect, JourneyHudLayout>> = {};

export async function loadJourneyHudLayout(opts?: {
  force?: boolean;
  aspect?: HudAspect;
}): Promise<JourneyHudLayout> {
  const aspect = opts?.aspect ?? RUNTIME_HUD_ASPECT;
  if (cachedByAspect[aspect] && !opts?.force) return cachedByAspect[aspect]!;
  const fallback = aspect === "9:16" ? HUD_LAYOUT_PORTRAIT_DEFAULTS : HUD_LAYOUT_DEFAULTS;
  try {
    const res = await fetch(`${HUD_ASPECT_URL[aspect]}?t=${Date.now()}`);
    if (!res.ok) {
      cachedByAspect[aspect] = clone(fallback);
      return cachedByAspect[aspect]!;
    }
    cachedByAspect[aspect] = normalizeHudLayout(await res.json(), aspect);
    return cachedByAspect[aspect]!;
  } catch {
    cachedByAspect[aspect] = clone(fallback);
    return cachedByAspect[aspect]!;
  }
}

/** 로비 대기 중 미리 받아 두면 여정 입장 FOUC가 없다 */
export async function preloadJourneyHudLayout(aspect: HudAspect = RUNTIME_HUD_ASPECT): Promise<JourneyHudLayout> {
  return loadJourneyHudLayout({ aspect });
}

export function getCachedJourneyHudLayout(aspect: HudAspect = RUNTIME_HUD_ASPECT): JourneyHudLayout | null {
  return cachedByAspect[aspect] ?? null;
}

export interface HudSaveResult {
  ok: boolean;
  downloaded: boolean;
  message: string;
}

export async function saveJourneyHudLayout(layout: JourneyHudLayout): Promise<HudSaveResult> {
  const aspect: HudAspect = layout.aspect === "9:16" ? "9:16" : "16:9";
  const stageH = layoutStageHPct({ ...layout, aspect });
  const json: JourneyHudLayout = {
    ...layout,
    id: "journey_hud",
    version: 1,
    aspect,
    stage_h_pct: aspect === "9:16" ? stageH : undefined,
    note:
      aspect === "9:16"
        ? `세로 여정 HUD · stage_h_pct=${stageH}. 편집: /hud-layout-tool.html 보드=세로`
        : "여정 HUD. 필러=공간, 위젯=그 안에 넣는 UI. 편집: /hud-layout-tool.html",
  };
  cachedByAspect[aspect] = normalizeHudLayout(json, aspect);
  const savePath = HUD_ASPECT_SAVE_PATH[aspect];
  const downloadName = aspect === "9:16" ? "journey_hud_layout_portrait.json" : "journey_hud_layout.json";
  try {
    const res = await fetch("/__layout_save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: savePath, json }),
    });
    const body = (await res.json()) as { ok?: boolean; error?: string; path?: string };
    if (!res.ok || !body.ok) throw new Error(body.error || `HTTP ${res.status}`);
    return { ok: true, downloaded: false, message: `저장됨 → ${body.path}` };
  } catch (e) {
    const blob = new Blob([JSON.stringify(json, null, 2) + "\n"], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = downloadName;
    a.click();
    URL.revokeObjectURL(a.href);
    return {
      ok: false,
      downloaded: true,
      message: `서버 저장 실패 · JSON 내려받음 (${String(e)})`,
    };
  }
}

const STYLE_ID = "journeyHudLayoutCss";

function cssBoxCq(sel: string, r: ResolvedRect, opts?: { keepTransform?: boolean }): string {
  if (!r.visible) return `${sel}{display:none!important}`;
  return (
    `${sel}{` +
    `position:absolute!important;` +
    `left:${r.x.toFixed(1)}cqw!important;` +
    `top:${r.y.toFixed(1)}cqh!important;` +
    `width:${r.w.toFixed(1)}cqw!important;` +
    `height:${r.h.toFixed(1)}cqh!important;` +
    `right:auto!important;` +
    `bottom:auto!important;` +
    `max-width:none!important;` +
    `max-height:none!important;` +
    `z-index:${r.z}!important;` +
    (opts?.keepTransform ? "" : `transform:none!important;`) +
    `}`
  );
}

/** 헤더/하단바처럼 이미 필러 자리로 옮긴 부모 안에서는 % 로 다시 잰다 */
function cssBoxInHost(sel: string, r: ResolvedRect, host: HudPillar): string {
  if (!r.visible) return `${sel}{display:none!important}`;
  const lx = host.w_pct ? ((r.x - host.x_pct) / host.w_pct) * 100 : 0;
  const ly = host.h_pct ? ((r.y - host.y_pct) / host.h_pct) * 100 : 0;
  const lw = host.w_pct ? (r.w / host.w_pct) * 100 : 100;
  const lh = host.h_pct ? (r.h / host.h_pct) * 100 : 100;
  return (
    `${sel}{` +
    `position:absolute!important;` +
    `left:${lx.toFixed(1)}%!important;` +
    `top:${ly.toFixed(1)}%!important;` +
    `width:${lw.toFixed(1)}%!important;` +
    `height:${lh.toFixed(1)}%!important;` +
    `right:auto!important;` +
    `bottom:auto!important;` +
    `max-width:none!important;` +
    `max-height:none!important;` +
    `z-index:${r.z}!important;` +
    `transform:none!important;` +
    `}`
  );
}

const HEADER_WIDGETS = new Set(["header_brand", "header_area", "header_hp", "header_gold"]);
const FOOTER_WIDGETS = new Set(["gauge_jackpot", "gauge_mid", "main_btn"]);

function unionHost(rects: Map<string, ResolvedRect>, ids: Set<string>): HudPillar | null {
  let x1 = 100;
  let y1 = 100;
  let x2 = 0;
  let y2 = 0;
  let any = false;
  for (const id of ids) {
    const r = rects.get(id);
    if (!r?.visible) continue;
    any = true;
    x1 = Math.min(x1, r.x);
    y1 = Math.min(y1, r.y);
    x2 = Math.max(x2, r.x + r.w);
    y2 = Math.max(y2, r.y + r.h);
  }
  if (!any) return null;
  return {
    id: "_host",
    label: "",
    visible: true,
    x_pct: round1(x1),
    y_pct: round1(y1),
    w_pct: round1(Math.max(2, x2 - x1)),
    h_pct: round1(Math.max(2, y2 - y1)),
    z: 1,
    flow: "overlay",
  };
}

/**
 * 저장된 배치를 본편 폰에 입힌다.
 * .phone 을 컨테이너로 삼아 cqw/cqh 로 좌표를 맞춘다.
 */
export function applyJourneyHudLayout(layout: JourneyHudLayout, phone: HTMLElement): void {
  phone.classList.add("hud-laid-out");
  phone.style.containerType = "size";
  const stageH = layoutStageHPct(layout);
  if (layout.aspect === "9:16") {
    phone.style.setProperty("--stage-h", `${stageH}%`);
    phone.style.setProperty("--pillar-h", `${100 - stageH}%`);
  } else {
    phone.style.removeProperty("--stage-h");
    phone.style.removeProperty("--pillar-h");
  }
  let tag = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!tag) {
    tag = document.createElement("style");
    tag.id = STYLE_ID;
    document.head.appendChild(tag);
  }
  const rects = resolveRects(layout);
  const parts = [
    `.phone.hud-laid-out{container-type:size}`,
    layout.aspect === "9:16"
      ? `.phone.shell-portrait.hud-laid-out{--stage-h:${stageH}%;--pillar-h:${100 - stageH}%}`
      : "",
    `.phone.hud-laid-out .shell-header{position:absolute!important;inset:auto!important;left:0;top:0;width:100%;z-index:9;pointer-events:none;background:transparent}`,
    `.phone.hud-laid-out .shell-header .shell-brand,.phone.hud-laid-out .shell-header .area-chip,.phone.hud-laid-out .shell-header .shell-top-chip{pointer-events:auto}`,
    `.phone.hud-laid-out .controls.shell-footer{position:absolute!important;z-index:12;overflow:visible;padding:0!important;min-height:0!important}`,
    `.phone.hud-laid-out #actionRail,.phone.hud-laid-out #actionRail .controls-center{position:absolute!important;inset:0!important;width:auto!important;height:auto!important;display:block!important;grid-template:none!important;min-height:0!important}`,
    `.phone.hud-laid-out #actionRail .island-btn{display:none!important}`,
    `.phone.hud-laid-out #choiceButtons{position:absolute!important;inset:0}`,
    `.phone.hud-laid-out .brand-block,.phone.hud-laid-out .shell-top-res{display:contents!important}`,
    `.phone.hud-laid-out .gauge{flex-direction:column;align-items:center;justify-content:center;gap:2px;overflow:visible}`,
    `.phone.hud-laid-out .gauge-meta{position:static!important;transform:none!important;width:auto!important;min-height:0!important}`,
    `.phone.hud-laid-out .hud-layout-hidden{display:none!important}`,
  ].filter(Boolean);
  const header = unionHost(rects, HEADER_WIDGETS);
  if (header) {
    parts.push(
      `.phone.hud-laid-out .shell-header{` +
        `left:${header.x_pct.toFixed(1)}cqw!important;` +
        `top:${header.y_pct.toFixed(1)}cqh!important;` +
        `width:${header.w_pct.toFixed(1)}cqw!important;` +
        `height:${header.h_pct.toFixed(1)}cqh!important;` +
        `}`,
    );
  }
  const footer = unionHost(rects, FOOTER_WIDGETS);
  if (footer) {
    parts.push(
      `.phone.hud-laid-out .controls.shell-footer{` +
        `left:${footer.x_pct.toFixed(1)}cqw!important;` +
        `top:${footer.y_pct.toFixed(1)}cqh!important;` +
        `width:${footer.w_pct.toFixed(1)}cqw!important;` +
        `height:${footer.h_pct.toFixed(1)}cqh!important;` +
        `right:auto!important;` +
        `bottom:auto!important;` +
        `}`,
    );
  }
  for (const def of WIDGET_DEFS) {
    const r = rects.get(def.id);
    if (!r) continue;
    if (HEADER_WIDGETS.has(def.id) && header && r.visible) {
      parts.push(cssBoxInHost(def.selector, r, header));
    } else if (FOOTER_WIDGETS.has(def.id) && footer && r.visible) {
      parts.push(cssBoxInHost(def.selector, r, footer));
    } else if (def.id === "minimap" && r.visible) {
      /* 탭 선반 CSS보다 특이도 높게 · docked transform은 유지 */
      const box = { ...r, z: Math.max(r.z, 20) };
      parts.push(cssBoxCq(".phone.hud-laid-out.view-3d .explore-layer.minimap", box, { keepTransform: true }));
      parts.push(
        cssBoxCq(".phone.hud-laid-out.view-3d .explore-layer.minimap.minimap-tab-mode", box, {
          keepTransform: true,
        }),
      );
    } else if (def.id === "activity" && r.visible) {
      /* 토스트 show 애니(transform) 유지 */
      parts.push(cssBoxCq(def.selector, r, { keepTransform: true }));
    } else if (def.id === "prompt" && r.visible) {
      /* 등장 애니는 opacity만 — left/top 은 레이아웃 박스 */
      parts.push(cssBoxCq(def.selector, r));
      parts.push(
        `${def.selector}{transform:none!important;bottom:auto!important;` +
          `white-space:nowrap;display:none}` +
          `${def.selector}.on{display:flex!important;align-items:center;justify-content:center}` +
          `${def.selector}.hud-layout-hidden{display:none!important}`,
      );
    } else if (def.id === "talk_me" || def.id === "talk_them") {
      parts.push(`${def.selector}{display:none!important}`);
    } else {
      parts.push(cssBoxCq(def.selector, r));
    }
    document.querySelectorAll(def.selector).forEach((el) => {
      el.classList.toggle("hud-layout-hidden", !r.visible);
    });
  }
  tag.textContent = parts.join("\n");
}

export function clearJourneyHudLayout(phone: HTMLElement): void {
  phone.classList.remove("hud-laid-out");
  phone.style.removeProperty("--stage-h");
  phone.style.removeProperty("--pillar-h");
  document.getElementById(STYLE_ID)?.remove();
}
