/**
 * XOOX 개발 툴 목록 (SSoT)
 *
 * 맵 좌표·NPC 동선은 **맵 배치** 하나.
 * 레이아웃·HUD·시나리오·전투는 그대로 분리.
 *
 * href는 Vite 루트 기준 경로 (예: `/sector-editor.html`)
 */
export type ToolGroup = "map" | "scenario" | "layout" | "art" | "proto" | "other";

export interface ToolEntry {
  id: string;
  name: string;
  short: string;
  href: string;
  blurb: string;
  group: ToolGroup;
  /** npm script 별칭 (있으면 허브에 표시) */
  npm?: string;
  /** false면 게임 상단 바에서 숨기고 허브에만 둔다 */
  inBar?: boolean;
}

export const TOOLS_HUB_HREF = "/tools.html";
export const TOOLS_HUB_TITLE = "XOOX 툴 허브";

export const TOOL_GROUP_LABEL: Record<ToolGroup, string> = {
  map: "맵",
  scenario: "시나리오",
  layout: "레이아웃·셸",
  art: "아트·무대",
  proto: "실험 (허브만)",
  other: "기타",
};

export const TOOLS: ToolEntry[] = [
  {
    id: "sector",
    name: "맵 배치",
    short: "맵",
    href: "/sector-editor.html",
    blurb: "섬 분위기 · NPC 자리 · 정화 전후 · 미리보기 · 동선. 배치는 NPC만 (데코 아트는 별도).",
    group: "map",
    npm: "dev:map",
  },
  {
    id: "layout",
    name: "레이아웃 에디터",
    short: "레이아웃",
    href: "/layout-editor.html",
    blurb: "셸·로비 UI 슬롯. 맵 NPC 좌표가 아님.",
    group: "layout",
    npm: "dev:layout",
  },
  {
    id: "hud-layout",
    name: "HUD 배치",
    short: "HUD",
    href: "/hud-layout-tool.html",
    blurb: "필러 위젯 크기·노출. 맵 좌표가 아님.",
    group: "layout",
    npm: "dev:hud",
  },
  {
    id: "scenario",
    name: "시나리오 체인",
    short: "시나리오",
    href: "/scenario-tool.html",
    blurb: "체인 저작 · 규칙 검증 · 갈래 시뮬",
    group: "scenario",
    npm: "dev:scn",
  },
  {
    id: "kit",
    name: "지역 무대 키트",
    short: "키트",
    href: "/region-kit-tool.html",
    blurb: "이동 무대 · 지역 키트 시뮬",
    group: "art",
    npm: "dev:kit",
  },
  {
    id: "fpv",
    name: "3D 여정 뷰",
    short: "3D뷰",
    href: "/fpv-tool.html",
    blurb: "3인칭/1인칭 카메라·안개 놀이터. NPC 배치는 맵 툴.",
    group: "art",
    npm: "dev:fpv",
  },
  {
    id: "purify-raid",
    name: "정화 습격 프로토",
    short: "습격",
    href: "/purify-raid-tool.html",
    blurb: "정화 총 · 땅 칠 · 웨이브 손맛",
    group: "art",
    npm: "dev:raid",
  },
  {
    id: "play-log",
    name: "플레이 로그",
    short: "로그",
    href: "/play-log-tool.html",
    blurb: "플레이·전투 종류 한 줄 로그 · 5000자마다 파일 저장",
    group: "other",
    npm: "dev:log",
  },
  {
    id: "map-proto",
    name: "맵·이동 프로토 (구)",
    short: "맵프로토",
    href: "/map-proto.html",
    blurb: "본게임 동선과 별개 실험. 맵 보기·NPC·동선은 「맵 배치」를 쓴다.",
    group: "proto",
    inBar: false,
  },
  {
    id: "filler-proto",
    name: "필러·버튼 프로토",
    short: "필러",
    href: "/filler-proto.html",
    blurb: "필러 카드 13종 · 갈래 60일 통주행",
    group: "proto",
    inBar: false,
  },
];

export function toolsInBar(): ToolEntry[] {
  return TOOLS.filter((t) => t.inBar !== false);
}

export function openToolWindow(href: string, name = "xoox-tool"): Window | null {
  const w = Math.min(1280, Math.max(900, window.screen.availWidth - 80));
  const h = Math.min(820, Math.max(560, window.screen.availHeight - 80));
  return window.open(
    href,
    name.replace(/[^\w-]/g, "-"),
    `noopener,noreferrer,width=${w},height=${h}`
  );
}
