/**
 * XOOX 개발 툴 목록 (SSoT)
 *
 * 플레이 바닥은 숲. 예전 섬 맵 툴(맵 배치·마스크·맵 프로토)은 허브에서 뺐다.
 * 레이아웃·HUD·시나리오·전투는 그대로 분리.
 *
 * href는 Vite 루트 기준 경로 (예: `/forest-play-tool.html`)
 */
export type ToolGroup = "forest" | "scenario" | "layout" | "art" | "proto" | "other";

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
  forest: "숲",
  scenario: "시나리오",
  layout: "레이아웃·셸",
  art: "아트·무대",
  proto: "실험 (허브만)",
  other: "기타",
};

export const TOOLS: ToolEntry[] = [
  {
    id: "forest-play",
    name: "숲 플레이",
    short: "숲플레이",
    href: "/forest-play-tool.html",
    blurb: "숲 디펜스 · 배치 · 캐릭터 · 포탑. 본편 외출과 같은 맵.",
    group: "forest",
  },
  {
    id: "object-tool",
    name: "오브젝트",
    short: "오브젝트",
    href: "/object-tool.html",
    blurb: "예전 연출 · 케니 팩 · 복셀 몬스터 · 숲 프롭을 한 목록에서 본다.",
    group: "forest",
  },
  { id: "forest150", name: "150×300m 정화 숲", short: "정화 숲", href: "/forest-map-tool.html", blurb: "Blender 정화 전후 · 넓은 공터 · 이동 마스크 · 몬스터 리젠/경로 확인", group: "forest", inBar: false },
  { id: "island-coast", name: "섬 외곽 · 정화 후", short: "섬", href: "/island-coast-tool.html", blurb: "가장자리 나무, 가운데 풀밭, 새로 그린 절벽과 바다.", group: "forest", inBar: false },
  { id: "forest-prop", name: "숲 프롭", short: "프롭", href: "/forest-prop-tool.html", blurb: "숲맵 프랍 카탈로그. 정화 전후 미리보기.", group: "forest", inBar: false },
  { id: "unit-lab", name: "유닛랩", short: "유닛랩", href: "/unit-lab-tool.html", blurb: "복셀 몬스터·유닛·포탑 사격. 점구름 펫은 여기 대상이 아니다.", group: "forest", inBar: false },
  { id: "combat-skill", name: "전투 스킬 테스트", short: "스킬", href: "/combat-skill-tool.html", blurb: "장판·로켓·유도·속사·산탄·드론을 종류별로 쏘아 본다. 본편과 분리.", group: "forest", inBar: false },
  { id: "pet-pack", name: "펫 4종", short: "펫", href: "/pet-pack-tool.html", blurb: "복셀 펫 NoFilter · Flux · Lumos · Gizmo.", group: "forest", inBar: false },
  { id: "block-cat", name: "블록 고양이", short: "캣", href: "/block-cat-tool.html", blurb: "BCAT02 블록 고양이.", group: "forest", inBar: false },
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
    id: "play-log",
    name: "플레이 로그",
    short: "로그",
    href: "/play-log-tool.html",
    blurb: "플레이·전투 종류 한 줄 로그 · 5000자마다 파일 저장",
    group: "other",
    npm: "dev:log",
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
