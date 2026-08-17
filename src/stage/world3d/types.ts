/**
 * 3D 여정 무대 공용 타입.
 *
 * 좌표는 탑뷰 explore와 **같은 % 좌표**를 쓴다. 두 뷰가 같은 CSV(area_npc_config)를
 * 읽고 같은 좌표계를 공유해야 미니맵 동기화에 변환 계층이 끼지 않는다.
 */

/** 3인칭 배후 / 1인칭 */
export type ViewMode = "tps" | "fps";

/** A/D를 게걸음으로 쓸지, 둠처럼 회전으로 쓸지 */
export type TurnMode = "strafe" | "turn";

export type Pillar = "탐구" | "도전" | "정화";

export interface WorldNode {
  id: string;
  icon: string;
  label: string;
  xPct: number;
  yPct: number;
  pillar?: Pillar;
  cleared?: boolean;
  /** 안개에 가려 아직 못 본 노드 */
  hidden?: boolean;
  /** 이벤트 줍기 — 안개 너머에서도 실루엣이 보이게 */
  pierceFog?: boolean;
}

/** 절차 생성 프롭 종류 — 아직 아트가 없어 캔버스로 그린다 */
export type PropKind =
  | "building"
  | "tower"
  | "fence"
  | "sign"
  | "crate"
  | "barrel"
  | "pole"
  | "tree"
  | "bush"
  | "debris";

export interface WorldProp {
  id: string;
  xPct: number;
  yPct: number;
  kind: PropKind;
  /** 높이(m). 없으면 kind 기본값 */
  hM?: number;
  /** 가로/세로. 배경 크롭 스티커용 */
  aspect?: number;
  /** 이미지 URL. 있으면 kind 대신 사용 */
  art?: string;
  /**
   * true(기본)면 항상 카메라를 향한다 — 2D 세움판이 옆에서 사라지지 않게.
   * false면 yawDeg 방향으로 고정된 평면. 기본은 kind 기본값(지금은 전부 true).
   */
  billboard?: boolean;
  yawDeg?: number;
  tint?: string;
  /** 자동 이동·WASD 충돌. false면 통과 */
  collide?: boolean;
  /** 충돌 반경(m). 없으면 kind 기본 */
  collideR?: number;
  /**
   * AREA 파도 후에도 스케치로 남는 개별 정화 타깃.
   * 7m에서 기립 → 5m에서 칼라 총으로 칠한다.
   */
  purifyTarget?: boolean;
  /** 생명 뭉치 — 칠하면 해당 blight 보상(동반) */
  lifeBlightId?: string;
}

/**
 * 스프라이트 시트 애니메이션.
 * docs/art/sprites/**\/engine/<anim>/<anim>.json 포맷(cols/rows/frames/duration_ms)을 그대로 받는다.
 */
export interface SpriteAnimSheet {
  url: string;
  cols: number;
  rows: number;
  frames: { index: number; durationMs: number }[];
  loop: boolean;
}

export interface PlayerSprite {
  idle: SpriteAnimSheet | string;
  move?: SpriteAnimSheet | string;
}

/** 시트가 아니라 단일 PNG일 때 1프레임 시트로 감싼다 */
export function asSheet(src: SpriteAnimSheet | string): SpriteAnimSheet {
  if (typeof src !== "string") return src;
  return {
    url: src,
    cols: 1,
    rows: 1,
    frames: [{ index: 0, durationMs: 1000 }],
    loop: true,
  };
}
