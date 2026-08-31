/**
 * 탐방 뷰 (탑뷰) — 위에서 내려다본 구역을 걸어다니며 **위로 전진**한다.
 *
 * 설계 근거: docs/gdd/25 §4 · 27(지역 이동) · 26 §3
 * - 화면보다 세로로 긴 "월드"를 두고, 플레이어가 위로 갈수록 **카메라가 따라 올라간다**.
 * - 좌우 횡스크롤 아님(카피바라고 원작 러너와 겹침 회피). 지시자 확정: "맵이 위로 스크롤되는 탑뷰".
 * - 지역·연결·이벤트 지점은 전부 CSV 구동(area_config / area_connection_config / area_npc_config).
 *
 * 좌표계: x=월드 가로 %(0~100), y=월드 세로 %(0=맨 위 ... 100=맨 아래).
 *        플레이어는 아래(y≈88)에서 시작해 위(y≈6)로 향한다.
 * 애니메이션 규칙(프로젝트 원칙): rAF 금지. CSS transition/keyframes + setTimeout만.
 */
import type { GameData, AreaDef, AreaNpcDef, PurifyFocus } from "./types";
import { spawnPctInArea } from "./stage/spawnStart";

export interface ExploreHooks {
  log: (body: string) => void;
  onAreaChange?: (area: AreaDef) => void;
  /** 이미 주운 기억 조각인지 */
  hasMemory: (memoryId: string) => boolean;
  /** 기억 조각 획득 — 저장은 호출측(main)이 담당 */
  collectMemory: (memoryId: string) => void;
  /** 이미 클리어한 노드인지 */
  isNodeCleared: (nodeId: string) => boolean;
  /** 36 — 지역 정화 여부 (지도·레거시) */
  isAreaPurified?: (areaId: string) => boolean;
  /** 36 — 오염 지점 이미 정화했는지 */
  isBlightPurified?: (blightId: string) => boolean;
  /** 36 — 촉매를 이미 주웠거나 소진한 노드인지(노드 id) */
  isCatalystGone?: (npcId: string) => boolean;
  /** 36 — Cozy 원형 색 회복 거점(해당 구역) */
  getPurifyFoci?: (areaId: string) => PurifyFocus[];
  /**
   * 41 §1-1 — **섹터 이동도 하루.** 십자 구조라 중앙을 계속 되돌아가므로 거리가 곧 비용이다.
   * true를 반환하면 항해가 끝난 것(배가 옴) → 이동을 중단한다.
   */
  onSectorTravel?: (fromAreaId: string, toAreaId: string) => Promise<boolean>;
  /** 41 §4 — 섬 전체 정화도(전망대 표시용) */
  getIslandPurify?: () => { done: number; total: number; pct: number };
  /**
   * 노드 콘텐츠 실행 — 전투·미니게임·지역·분기 등 기존 시스템으로 넘긴다.
   * 실행이 정상 종료되면 true(=클리어 기록). 취소·미지원이면 false.
   */
  runNode: (npc: AreaNpcDef) => Promise<boolean>;
}

/** 걷는 속도(px/초) — 이동 거리에 비례해 소요시간을 정한다 */
const WALK_SPEED_PX_PER_SEC = 150;
const WALK_MIN_MS = 260;
const WALK_MAX_MS = 2600;
/**
 * 거리를 그대로 시간에 비례시키면 세로 497% 월드에서 한 번 걷는 데 10초가 넘고,
 * 상한으로 잘라내면 그 지점부터 속도가 튀어 순간이동처럼 보인다.
 * 지수로 눌러 상한에 부드럽게 수렴시킨다(1초 구간은 값이 그대로 유지되도록 정규화).
 */
const WALK_DIST_EXP = 0.78;
/** 방향 전환(scaleX 반전)은 걷기 길이와 무관하게 짧게 — CSS transition-duration 3번째 값 */
const TURN_MS = 180;
const FADE_MS = 320;
/** 카메라가 배우를 화면 세로 어디에 두는지(0=위, 1=아래) */
const CAM_ANCHOR = 0.66;

export type ExitSide = "TOP" | "BOTTOM" | "LEFT" | "RIGHT";

export function flipExitSide(s: ExitSide): ExitSide {
  return s === "TOP" ? "BOTTOM" : s === "BOTTOM" ? "TOP" : s === "LEFT" ? "RIGHT" : "LEFT";
}

/** CSV 연결 — 3D 가장자리 이동과 탑뷰 출구가 같은 표를 쓴다 */
export function areaExits(
  data: GameData,
  areaId: string,
): { to: string; side: ExitSide; requires?: string }[] {
  const out: { to: string; side: ExitSide; requires?: string }[] = [];
  for (const c of data.areaConnections) {
    const requires = c.unlock_condition.startsWith("NODE:")
      ? c.unlock_condition.slice(5)
      : undefined;
    if (c.from_area_id === areaId) {
      out.push({ to: c.to_area_id, side: c.exit_point as ExitSide, requires });
    } else if (c.bidirectional && c.to_area_id === areaId) {
      out.push({ to: c.from_area_id, side: flipExitSide(c.exit_point as ExitSide) });
    }
  }
  return out;
}

/**
 * 맵 노드 종류 라벨.
 * `_2` 접미사 콘텐츠는 "같은 장소의 재방문"으로 묶여 후반 구역에 배치된다(30번 문서).
 * 실행은 main.runMapNode 연결됨(S4). 기둥 배지 = 33 4기둥 · 31 §2-5.
 */
const NODE_KIND_LABEL: Record<string, string> = {
  REST: "쉼터",
  LOCATION: "지역",
  MINIGAME: "미니게임",
  NPC: "만남",
  COMBAT: "전투",
  MINIBOSS: "관문",
  BOSS: "보스",
  MEMORY: "기억",
  MEMO: "흔적",
  DAILY: "하루의 발견",
  TRACE: "버려진 흔적",
  FILTER: "탁한 물 거르기",
  FILL: "정화제",
  SKILL: "정기",
  RESCUE: "구조",
  CATALYST: "촉매",
  BLIGHT: "오염",
  ARENA: "겨루기",
};

/** 33 4기둥 — POI당 배지 1개만 (아이콘 스팸 금지) */
export type JourneyPillar = "탐구" | "도전" | "정화";

export function pillarForTrigger(triggerType: string): JourneyPillar {
  const t = triggerType.toUpperCase();
  // ARENA = 3D 뷰 제자리 경쟁 미니게임. 전투를 대신하는 축이라 같은 기둥에 둔다.
  if (t === "COMBAT" || t === "MINIBOSS" || t === "BOSS" || t === "MINIGAME" || t === "ARENA") {
    return "도전";
  }
  // FILTER = 정화 미션 중 손맛 · TRACE/DAILY = 탐구 발견
  if (t === "BLIGHT" || t === "RESCUE" || t === "PURIFY" || t === "FILTER" || t === "FILL" || t === "CATALYST" || t === "PROP_PURIFY") {
    return "정화";
  }
  return "탐구";
}

function pillarClass(pillar: JourneyPillar): string {
  if (pillar === "도전") return "pillar-challenge";
  if (pillar === "정화") return "pillar-purify";
  return "pillar-explore";
}

export class ExploreView {
  private data: GameData;
  private hooks: ExploreHooks;
  private root: HTMLElement;

  private layer!: HTMLElement;
  private camera!: HTMLElement;
  private world!: HTMLElement;
  private worldBase!: HTMLElement;
  private worldTrail!: HTMLElement;
  private worldLit!: HTMLElement;
  private worldColor!: HTMLElement;
  private visionFx!: HTMLElement;
  private propLayer!: HTMLElement;
  private actor!: HTMLElement;
  private actorInner!: HTMLElement;
  private fade!: HTMLElement;
  private nameTag!: HTMLElement;
  private minimapTabBtn!: HTMLButtonElement;
  private navPad!: HTMLElement;

  private currentAreaId = "";
  private xPct = 50;
  private yPct = 88;
  private worldHPct = 240;
  /** 타일 아트 모드(world≈100% · BG PNG) — 세로 러너 패스 숨김 */
  private artMode = false;
  private facing: 1 | -1 = 1;
  /** 3D 시선(도, 0=북). 미니맵 부채꼴이 이 값을 따라 돈다 */
  private yawDeg = 0;
  private actorArt = "/ui/lobby/lobby_actor_idle.png";
  /** 섹터 안 탐방 안개 — areaId → 발자국 % */
  private fogStamps = new Map<string, { x: number; y: number }[]>();
  private sectorWorldM = 333;
  private fogVisionM = 10;
  private fogTrailM = 8;
  private fogTick: number | null = null;
  private fogWalkX = 0;
  private fogWalkY = 0;
  private usingFogWalk = false;
  /** 마스크 성장 연출용 — blightId → 현재 표시 반지름% */
  private maskDisplayR = new Map<string, number>();
  private maskAnimTimers: number[] = [];
  private walkTimer: number | null = null;
  /**
   * 진행 중인 걷기의 resolve. 새 걷기가 시작되면 **반드시 먼저 호출**해야 한다.
   * (타이머만 취소하면 이전 Promise가 영원히 미해결로 남아,
   *  그것을 await 하던 journey/approach/travel의 busy가 true로 고착된다 — 실제 발생했던 버그)
   */
  private walkResolve: (() => void) | null = null;
  private busy = false;
  /** busy 고착 방지용 안전 타이머 */
  private busyGuard: number | null = null;
  /** 3D 뷰가 주연이면 탑뷰는 미니맵으로 내려간다 — 조작을 받지 않고 섹터 전체를 보여준다 */
  private minimapMode = false;
  /** 3D→미니맵 첫 동기화 — 큰 점프를 transition 없이 스냅 */
  private minimapSyncedOnce = false;
  /** 자동이동 피크 전에 탭으로 접혀 있었는지 */
  private minimapTravelFromDock = false;
  /** 콘텐츠 피크 — 새 발동이 오면 타이머를 연장한다 */
  private minimapPeekGen = 0;

  constructor(root: HTMLElement, data: GameData, hooks: ExploreHooks) {
    this.root = root;
    this.data = data;
    this.hooks = hooks;
    this.build();
    void this.loadMapActorScale();
  }

  /** docs/gdd/42 · sector_scale.json — 맵 배우 크기 + 탐방 안개(m) */
  private async loadMapActorScale() {
    try {
      const res = await fetch(`/ui/layout/sector_scale.json?t=${Date.now()}`);
      if (!res.ok) return;
      const j = (await res.json()) as {
        map_actor_h_px?: number;
        sector_world_h_m?: number;
        sector_world_w_m?: number;
        fog_vision_m?: number;
        fog_trail_m?: number;
      };
      if (j.map_actor_h_px && j.map_actor_h_px > 0) {
        this.layer.style.setProperty("--map-actor-h", `${j.map_actor_h_px}px`);
      }
      if (j.sector_world_w_m && j.sector_world_w_m > 0) this.sectorWorldM = j.sector_world_w_m;
      else if (j.sector_world_h_m && j.sector_world_h_m > 0) this.sectorWorldM = j.sector_world_h_m;
      if (j.fog_vision_m && j.fog_vision_m > 0) this.fogVisionM = j.fog_vision_m;
      if (j.fog_trail_m && j.fog_trail_m > 0) this.fogTrailM = j.fog_trail_m;
      this.loadFogFromStorage();
      if (this.artMode && this.currentAreaId) this.refreshFog();
    } catch {
      /* ignore */
    }
  }

  private visionPct(): number {
    return (this.fogVisionM / this.sectorWorldM) * 100;
  }

  private trailPct(): number {
    return (this.fogTrailM / this.sectorWorldM) * 100;
  }

  private fogStorageKey(areaId: string) {
    return `xoox.exploreFog.${areaId}`;
  }

  private loadFogFromStorage() {
    for (const a of this.data.areas) {
      try {
        const raw = sessionStorage.getItem(this.fogStorageKey(a.area_id));
        if (!raw) continue;
        const pts = JSON.parse(raw) as { x: number; y: number }[];
        if (Array.isArray(pts) && pts.length) this.fogStamps.set(a.area_id, pts);
      } catch {
        /* ignore */
      }
    }
  }

  private saveFog(areaId: string) {
    const pts = this.fogStamps.get(areaId) ?? [];
    try {
      sessionStorage.setItem(this.fogStorageKey(areaId), JSON.stringify(pts.slice(-400)));
    } catch {
      /* ignore */
    }
  }

  private stampsOf(areaId: string) {
    let pts = this.fogStamps.get(areaId);
    if (!pts) {
      pts = [];
      this.fogStamps.set(areaId, pts);
    }
    return pts;
  }

  /** 지나온 자리 찍기 — 복카시가 길어서 발자국은 조금 더 촘촘히 */
  private stampFog(areaId: string, x: number, y: number) {
    const pts = this.stampsOf(areaId);
    const minGap = this.trailPct() * 0.28;
    const last = pts[pts.length - 1];
    if (last && Math.hypot(last.x - x, last.y - y) < minGap) return;
    pts.push({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
    if (pts.length > 400) pts.splice(0, pts.length - 400);
    this.saveFog(areaId);
  }

  private stampFogPath(areaId: string, x0: number, y0: number, x1: number, y1: number) {
    const dist = Math.hypot(x1 - x0, y1 - y0);
    const step = Math.max(0.8, this.trailPct() * 0.4);
    const n = Math.max(1, Math.ceil(dist / step));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      this.stampFog(areaId, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t);
    }
  }

  private fogDistPct(ax: number, ay: number, bx: number, by: number) {
    return Math.hypot(ax - bx, ay - by);
  }

  /** 시야 안이거나 지나온 발자국 근처면 보임 */
  /**
   * 43 S4 — 지금 섹터에서 갈 수 있는 이웃 (갈림길 UI용).
   * 관문이 잠긴 쪽도 `locked`로 함께 돌려준다 — 왜 못 가는지 보여야 하므로.
   */
  neighbors(): { to: string; side: "TOP" | "BOTTOM" | "LEFT" | "RIGHT"; locked: boolean; gateLabel: string }[] {
    if (!this.currentAreaId) return [];
    return this.exitsOf(this.currentAreaId).map((c) => {
      const locked = !!c.requires && !this.hooks.isNodeCleared(c.requires);
      const gate = c.requires ? this.data.areaNpcs.find((n) => n.npc_id === c.requires) : undefined;
      return { to: c.to, side: c.side, locked, gateLabel: gate?.label ?? "관문" };
    });
  }

  /**
   * 43 S4 — 갈림길에서 고른 섹터로 옮긴다.
   * `travel`이 걷기·페이드·도착 걸음·`onSectorTravel`(하루 소모)까지 쥐고 있으므로 그대로 태운다.
   */
  async goToSector(toAreaId: string): Promise<boolean> {
    const c = this.neighbors().find((n) => n.to === toAreaId);
    if (!c || c.locked) return false;
    await this.travel(toAreaId, c.side);
    return true;
  }

  /**
   * 43 S4 — 이 노드가 지금 안개에서 드러나 있나.
   * 가시성 판정의 소유권은 explore에 있고, main은 **후보를 고를 때 물어보기만** 한다.
   */
  isNodeRevealed(npcId: string): boolean {
    if (!this.artMode) return true;
    const npc = this.data.areaNpcs.find((n) => n.npc_id === npcId);
    if (!npc) return false;
    return this.isRevealed(npc.area_id, npc.x_pct, npc.y_pct);
  }

  private isRevealed(areaId: string, x: number, y: number): boolean {
    if (!this.artMode) return true;
    const vx = this.usingFogWalk ? this.fogWalkX : this.xPct;
    const vy = this.usingFogWalk ? this.fogWalkY : this.yPct;
    const v = this.visionPct();
    if (this.fogDistPct(x, y, vx, vy) <= v * 1.05) return true;
    const t = this.trailPct();
    for (const p of this.stampsOf(areaId)) {
      if (this.fogDistPct(x, y, p.x, p.y) <= t * 1.05) return true;
    }
    return false;
  }

  /** 화면에서 진짜 원이 되도록 반지름은 px (월드는 세로로 길어서 %면 타원) */
  private radialMaskPx(xPct: number, yPct: number, rPct: number, softMul = 1.35): string {
    const wr = this.world.getBoundingClientRect();
    const short = Math.min(wr.width || 400, wr.height || 300);
    const rPx = Math.max(10, (short * rPct) / 100);
    const softPx = rPx * softMul;
    return `radial-gradient(circle ${softPx}px at ${xPct}% ${yPct}%, #000 0px, #000 ${rPx * 0.78}px, transparent ${softPx}px)`;
  }

  /**
   * 지나온 길 마스크 — 좌우 복카시(서서히 어두워짐)를 길게.
   * 코어는 좁게, 바깥으로 긴 페이드.
   */
  private trailMaskPx(xPct: number, yPct: number, rPct: number): string {
    const wr = this.world.getBoundingClientRect();
    const short = Math.min(wr.width || 400, wr.height || 300);
    const rPx = Math.max(12, (short * rPct) / 100);
    const softPx = rPx * 2.75;
    return (
      `radial-gradient(circle ${softPx}px at ${xPct}% ${yPct}%,` +
      `#000 0px,` +
      `#000 ${rPx * 0.28}px,` +
      `rgba(0,0,0,0.72) ${rPx * 0.55}px,` +
      `rgba(0,0,0,0.4) ${rPx * 0.95}px,` +
      `rgba(0,0,0,0.16) ${rPx * 1.55}px,` +
      `transparent ${softPx}px)`
    );
  }

  private refreshFog() {
    if (!this.artMode || !this.currentAreaId) return;
    const areaId = this.currentAreaId;
    const stamps = this.stampsOf(areaId);
    const trailR = this.trailPct();
    const visionR = this.visionPct();

    // 지나온 길 — 좌우 긴 복카시
    const trailMask =
      stamps.length === 0
        ? "none"
        : stamps.map((p) => this.trailMaskPx(p.x, p.y, trailR)).join(",");
    this.worldTrail.style.webkitMaskImage = trailMask;
    this.worldTrail.style.maskImage = trailMask;
    this.worldTrail.style.webkitMaskComposite = "source-over";
    (this.worldTrail.style as CSSStyleDeclaration & { maskComposite?: string }).maskComposite = "add";
    this.worldTrail.style.webkitMaskRepeat = "no-repeat";
    this.worldTrail.style.maskRepeat = "no-repeat";
    this.worldTrail.style.webkitMaskSize = "100% 100%";
    this.worldTrail.style.maskSize = "100% 100%";

    // 현재 시야 — 노드 판정은 visionR, 비주얼은 살짝 넓게 + px 진원
    const vx = this.usingFogWalk ? this.fogWalkX : this.xPct;
    const vy = this.usingFogWalk ? this.fogWalkY : this.yPct;
    const litR = visionR * 1.35;
    const lit = this.radialMaskPx(vx, vy, litR, 1.55);
    this.worldLit.style.webkitMaskImage = lit;
    this.worldLit.style.maskImage = lit;
    this.worldLit.style.webkitMaskRepeat = "no-repeat";
    this.worldLit.style.maskRepeat = "no-repeat";
    this.worldLit.style.webkitMaskSize = "100% 100%";
    this.worldLit.style.maskSize = "100% 100%";
    this.worldLit.style.webkitMaskPosition = "0 0";
    this.worldLit.style.maskPosition = "0 0";

    // 캐릭터 주변 네온 시야 링 — 같은 px 기준으로 진원
    if (this.visionFx) {
      const wr = this.world.getBoundingClientRect();
      const short = Math.min(wr.width || 400, wr.height || 300);
      const dPx = Math.max(48, (short * litR * 1.55 * 2) / 100);
      this.visionFx.style.left = `${vx}%`;
      this.visionFx.style.top = `${vy}%`;
      this.visionFx.style.width = `${dPx}px`;
      this.visionFx.style.height = `${dPx}px`;
      this.visionFx.style.setProperty("--look", `${this.yawDeg}deg`);
      this.visionFx.classList.add("on");
    }

    this.syncNodeFogVisibility();
  }

  private syncNodeFogVisibility() {
    if (!this.artMode) return;
    const areaId = this.currentAreaId;
    for (const el of this.propLayer.querySelectorAll<HTMLElement>(".explore-poi")) {
      const id = el.dataset.npc;
      if (!id) continue;
      const npc = this.data.areaNpcs.find((n) => n.npc_id === id);
      if (!npc) continue;
      const show = this.isRevealed(areaId, npc.x_pct, npc.y_pct);
      el.classList.toggle("fog-hidden", !show);
      el.style.pointerEvents = show ? "auto" : "none";
    }
  }

  // ── DOM ───────────────────────────────────────────────────────────────
  private build() {
    const layer = document.createElement("div");
    layer.className = "explore-layer";
    layer.innerHTML = `
      <div class="explore-camera">
        <div class="explore-world">
          <div class="explore-world-base cyber-fog-stack" aria-hidden="true">
            <div class="cyber-plate cyber-base"></div>
            <div class="cyber-plate cyber-edge"></div>
            <div class="cyber-plate cyber-chroma"></div>
            <div class="cyber-tint"></div>
          </div>
          <div class="explore-world-trail cyber-fog-stack" aria-hidden="true">
            <div class="cyber-plate cyber-base"></div>
            <div class="cyber-plate cyber-edge"></div>
            <div class="cyber-plate cyber-chroma"></div>
            <div class="cyber-tint"></div>
          </div>
          <div class="explore-world-lit cyber-fog-stack cyber-fog-lit" aria-hidden="true">
            <div class="cyber-plate cyber-base"></div>
            <div class="cyber-plate cyber-edge"></div>
            <div class="cyber-plate cyber-chroma"></div>
            <div class="cyber-tint"></div>
            <div class="cyber-scan"></div>
            <div class="cyber-grid"></div>
          </div>
          <div class="explore-world-color" aria-hidden="true"></div>
          <div class="explore-path"></div>
          <div class="explore-props"></div>
          <div class="explore-vision" id="exploreVision" aria-hidden="true">
            <div class="explore-vision-boost"></div>
            <div class="explore-vision-cone"></div>
            <div class="explore-vision-ring"></div>
            <div class="explore-vision-core"></div>
          </div>
          <div class="explore-actor"><div class="explore-actor-inner"></div></div>
        </div>
      </div>
      <div class="explore-nav" aria-label="섹터 이동"></div>
      <div class="explore-name"></div>
      <div class="explore-fade"></div>
      <button type="button" class="minimap-tab-btn" aria-label="지도" aria-expanded="false" hidden>지도</button>
    `;
    this.root.appendChild(layer);

    this.layer = layer;
    this.camera = layer.querySelector(".explore-camera")!;
    this.world = layer.querySelector(".explore-world")!;
    this.worldBase = layer.querySelector(".explore-world-base")!;
    this.worldTrail = layer.querySelector(".explore-world-trail")!;
    this.worldLit = layer.querySelector(".explore-world-lit")!;
    this.worldColor = layer.querySelector(".explore-world-color")!;
    this.visionFx = layer.querySelector(".explore-vision")!;
    this.propLayer = layer.querySelector(".explore-props")!;
    this.actor = layer.querySelector(".explore-actor")!;
    this.actorInner = layer.querySelector(".explore-actor-inner")!;
    this.navPad = layer.querySelector(".explore-nav")!;
    this.nameTag = layer.querySelector(".explore-name")!;
    this.fade = layer.querySelector(".explore-fade")!;
    this.minimapTabBtn = layer.querySelector(".minimap-tab-btn")!;
    this.applyActorSprite(this.actorArt);

    this.minimapTabBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleMinimapShelf();
    });

    // 월드를 탭하면 그 지점으로 걸어간다 · 가장자리면 인접 섹터로 이동
    this.world.addEventListener("click", (e) => {
      const wr = this.world.getBoundingClientRect();
      const x = ((e.clientX - wr.left) / wr.width) * 100;
      const y = ((e.clientY - wr.top) / wr.height) * 100;
      void this.handleWorldTap(x, y);
    });
  }

  /** 탭: 가장자리(출구 존)면 travel, 아니면 walk */
  private async handleWorldTap(x: number, y: number) {
    // 미니맵일 땐 이동 주도권이 3D 뷰에 있다
    if (this.busy || this.minimapMode) return;
    const edge = this.edgeExitAt(x, y);
    if (edge) {
      void this.travel(edge.to, edge.side);
      return;
    }
    await this.walkTo(x, y);
  }

  /** 탭/도착 좌표가 출구 가장자리면 해당 연결 반환 (육지 연결만 CSV에 있음) */
  private edgeExitAt(
    x: number,
    y: number
  ): { to: string; side: "TOP" | "BOTTOM" | "LEFT" | "RIGHT" } | null {
    const EDGE = 14;
    const exits = this.exitsOf(this.currentAreaId).filter((e) => !e.requires);
    if (!exits.length) return null;
    type Side = "TOP" | "BOTTOM" | "LEFT" | "RIGHT";
    const hit: { side: Side; dist: number }[] = [];
    // 열린 출구가 있는 변만 감지 — 바다 쪽 가장자리는 연결이 없어 무시
    for (const ex of exits) {
      if (ex.side === "TOP" && y <= EDGE) hit.push({ side: "TOP", dist: y });
      if (ex.side === "BOTTOM" && y >= 100 - EDGE) hit.push({ side: "BOTTOM", dist: 100 - y });
      if (ex.side === "LEFT" && x <= EDGE) hit.push({ side: "LEFT", dist: x });
      if (ex.side === "RIGHT" && x >= 100 - EDGE) hit.push({ side: "RIGHT", dist: 100 - x });
    }
    hit.sort((a, b) => a.dist - b.dist);
    if (!hit.length) return null;
    const ex = exits.find((e) => e.side === hit[0].side);
    return ex ? { to: ex.to, side: ex.side } : null;
  }

  // ── 지역 진입 ─────────────────────────────────────────────────────────
  enter(areaId: string, opts?: { fromEdge?: "TOP" | "BOTTOM" | "LEFT" | "RIGHT"; silent?: boolean }) {
    const area = this.data.areas.find((a) => a.area_id === areaId);
    if (!area) {
      console.warn("[explore] 알 수 없는 지역:", areaId);
      return;
    }
    this.currentAreaId = areaId;
    this.minimapSyncedOnce = false;
    this.worldHPct = area.world_h_pct;
    this.artMode = !!area.background_asset;

    this.world.style.height = `${area.world_h_pct}%`;
    this.world.classList.toggle("has-art", this.artMode);
    this.layer.classList.toggle("has-art", this.artMode);
    this.applyBackground(area);

    const path = this.world.querySelector<HTMLElement>(".explore-path")!;
    if (this.artMode) {
      path.style.background = "transparent";
    } else {
      path.style.background = `linear-gradient(90deg, transparent 0%, ${area.path_color} 18%, ${area.path_color} 82%, transparent 100%)`;
    }

    this.nameTag.textContent = area.display_name;
    this.nameTag.classList.remove("show");
    void this.nameTag.offsetWidth;
    this.nameTag.classList.add("show");

    this.renderProps(area);
    this.applyPurifyLook(area.area_id, { animate: !opts?.silent });

    const edge = opts?.fromEdge;
    if (edge) {
      if (this.artMode) {
        this.xPct = edge === "LEFT" ? 28 : edge === "RIGHT" ? 72 : 50;
        this.yPct = edge === "TOP" ? 30 : edge === "BOTTOM" ? 70 : 50;
      } else {
        this.xPct = edge === "LEFT" ? 22 : edge === "RIGHT" ? 78 : 50;
        this.yPct = edge === "TOP" ? 18 : edge === "BOTTOM" ? 82 : 88;
      }
    } else {
      const spawn = spawnPctInArea(this.data.areaNpcs, areaId);
      this.xPct = spawn.xPct;
      this.yPct = spawn.yPct;
    }
    this.applyActor(false);
    this.applyCamera(false);
    if (this.artMode) {
      this.stampFog(areaId, this.xPct, this.yPct);
      this.refreshFog();
    }

    if (!opts?.silent) this.hooks.onAreaChange?.(area);
  }

  /**
   * 36 — Cozy식 색 회복.
   * 아트 모드: before 위에 after를 원형 마스크로 드러냄.
   * 비아트: 기존 saturate 필터(구역 단위).
   */
  applyPurifyLook(areaId: string, opts?: { animate?: boolean }) {
    const area = this.data.areas.find((a) => a.area_id === areaId);
    const foci = this.hooks.getPurifyFoci?.(areaId) ?? [];
    const on = foci.length > 0 || !!this.hooks.isAreaPurified?.(areaId);
    this.world.classList.toggle("area-purified", on);
    this.layer.classList.toggle("area-purified", on);
    if (area) this.applyBackground(area);
    this.syncPurifyMask(areaId, { animate: opts?.animate ?? true });

    const blight = this.data.purifyBlights?.find(
      (b) => b.target_kind === "AREA" && b.target_ref === areaId
    );
    if (area?.background_asset) {
      this.world.style.setProperty("--purify-tint", foci.length ? "0.12" : "0");
    } else {
      const tint = on ? blight?.area_tint ?? 0.55 : 0;
      this.world.style.setProperty("--purify-tint", String(tint));
    }
    if (foci.length > 0) {
      this.world.classList.add("area-purified-glow");
    } else {
      this.world.classList.remove("area-purified-glow");
    }
  }

  /** 원형 마스크 재계산 · animate 시 0→target 스텝 성장 */
  syncPurifyMask(areaId: string, opts?: { animate?: boolean }) {
    if (!this.artMode || !this.worldColor) return;
    const foci = this.hooks.getPurifyFoci?.(areaId) ?? [];
    const animate = opts?.animate ?? false;

    this.clearMaskAnim();

    if (foci.length === 0) {
      this.maskDisplayR.clear();
      this.paintMask([]);
      this.worldColor.classList.remove("revealed");
      return;
    }

    this.worldColor.classList.add("revealed");

    if (!animate) {
      for (const f of foci) this.maskDisplayR.set(f.blightId, f.radiusPct);
      this.paintMask(foci);
      return;
    }

    // 새 focus만 0에서 키우고, 기존은 유지
    const steps = [0, 0.35, 0.7, 1];
    for (const f of foci) {
      if (!this.maskDisplayR.has(f.blightId)) this.maskDisplayR.set(f.blightId, 0);
    }
    // 사라진 focus 정리
    for (const id of [...this.maskDisplayR.keys()]) {
      if (!foci.some((f) => f.blightId === id)) this.maskDisplayR.delete(id);
    }

    let stepIdx = 0;
    const tick = () => {
      const t = steps[Math.min(stepIdx, steps.length - 1)];
      for (const f of foci) {
        const prev = this.maskDisplayR.get(f.blightId) ?? 0;
        // 이미 목표에 가까운 건 유지, 새 것만 성장
        if (prev >= f.radiusPct * 0.95) this.maskDisplayR.set(f.blightId, f.radiusPct);
        else this.maskDisplayR.set(f.blightId, f.radiusPct * t);
      }
      this.paintMask(foci);
      stepIdx += 1;
      if (stepIdx < steps.length) {
        this.maskAnimTimers.push(window.setTimeout(tick, 140));
      } else {
        for (const f of foci) this.maskDisplayR.set(f.blightId, f.radiusPct);
        this.paintMask(foci);
      }
    };
    tick();
  }

  private clearMaskAnim() {
    for (const t of this.maskAnimTimers) window.clearTimeout(t);
    this.maskAnimTimers = [];
  }

  private paintMask(foci: PurifyFocus[]) {
    if (!this.worldColor) return;
    if (foci.length === 0) {
      this.worldColor.style.opacity = "0";
      this.worldColor.style.webkitMaskImage = "none";
      this.worldColor.style.maskImage = "none";
      return;
    }
    this.worldColor.style.opacity = "1";
    const wr = this.world.getBoundingClientRect();
    const short = Math.min(wr.width || 400, wr.height || 300);
    const grads = foci.map((f) => {
      const rPct = this.maskDisplayR.get(f.blightId) ?? f.radiusPct;
      const rPx = Math.max(8, (short * rPct) / 100);
      const softPx = rPx * 1.35;
      return `radial-gradient(circle ${softPx}px at ${f.xPct}% ${f.yPct}%, #000 0px, #000 ${rPx * 0.72}px, transparent ${softPx}px)`;
    });
    const mask = grads.join(", ");
    this.worldColor.style.webkitMaskImage = mask;
    this.worldColor.style.maskImage = mask;
    this.worldColor.style.webkitMaskComposite = "source-over";
    this.worldColor.style.maskComposite = "add";
    this.worldColor.style.webkitMaskRepeat = "no-repeat";
    this.worldColor.style.maskRepeat = "no-repeat";
    this.worldColor.style.webkitMaskSize = "100% 100%";
    this.worldColor.style.maskSize = "100% 100%";
  }

  /** CSV background_asset — after PNG + 첫 스케치 필터(오염) · color=정화 after */
  private applyBackground(area: AreaDef) {
    const base = area.background_asset?.trim();
    if (!base) {
      this.world.classList.remove("cyber-fog");
      this.world.style.background = `linear-gradient(180deg, ${area.ground_top} 0%, ${area.ground_bottom} 100%)`;
      this.clearCyberStacks();
      this.worldColor.style.background = "none";
      this.worldColor.style.opacity = "0";
      if (this.visionFx) this.visionFx.classList.remove("on");
      return;
    }
    const before = base.includes("_after") ? base.replace("_after", "_before") : base;
    const after = before.includes("_before") ? before.replace("_before", "_after") : before;
    // 오염 = after + 연필 스케치/시안 (네온 와이어 → 첫 스케치로 복귀)
    this.world.style.background = "#000";
    this.world.classList.add("cyber-fog");
    const plateCss = `center / 100% 100% no-repeat url("${after}")`;
    this.paintCyberStack(this.worldBase, plateCss);
    this.paintCyberStack(this.worldTrail, plateCss);
    this.paintCyberStack(this.worldLit, plateCss);
    this.worldColor.style.background = `center / 100% 100% no-repeat url("${after}")`;
    this.refreshFog();
  }

  private paintCyberStack(stack: HTMLElement, plateCss: string) {
    stack.querySelectorAll<HTMLElement>(".cyber-plate").forEach((el) => {
      el.style.background = plateCss;
    });
  }

  private clearCyberStacks() {
    for (const stack of [this.worldBase, this.worldTrail, this.worldLit]) {
      stack.querySelectorAll<HTMLElement>(".cyber-plate").forEach((el) => {
        el.style.background = "none";
      });
    }
  }

  /** @deprecated 안개 시야로 대체 — applyActor 호환용 */
  private updateActorSpotlight(_animated: boolean) {
    this.refreshFog();
  }

  private applyActorSprite(src: string) {
    this.actorArt = src;
    this.actor.classList.add("has-sprite");
    this.actorInner.style.backgroundImage = `url("${src}")`;
  }

  /** 정화 후 노드/톤 즉시 갱신 */
  refreshCurrentArea(opts?: { animate?: boolean }) {
    if (!this.currentAreaId) return;
    const area = this.data.areas.find((a) => a.area_id === this.currentAreaId);
    if (!area) return;
    this.renderProps(area);
    this.applyPurifyLook(area.area_id, { animate: opts?.animate ?? true });
  }

  private renderProps(area: AreaDef) {
    this.propLayer.innerHTML = "";

    for (const npc of this.data.areaNpcs.filter((n) => n.area_id === area.area_id)) {
      if (npc.appear_condition !== "ALWAYS") continue;
      // 이미 주운 기억 조각은 표시하지 않는다(수집형이므로 소진됨)
      if (npc.trigger_type === "MEMORY" && this.hooks.hasMemory(npc.trigger_ref)) continue;
      if ((npc.trigger_type === "CATALYST" || npc.trigger_type === "FILL") && this.hooks.isCatalystGone?.(npc.npc_id)) continue;
      if (npc.trigger_type === "BLIGHT" && this.hooks.isBlightPurified?.(npc.trigger_ref)) continue;
      if (
        npc.trigger_type.toUpperCase() === "PURIFY" &&
        this.hooks.isNodeCleared(npc.npc_id)
      ) {
        continue;
      }
      /* START 스폰 좌표 — 미니맵에도 깃발 안 찍음 */
      if (npc.trigger_type.toUpperCase() === "START") continue;
      /* 정화 발판은 루프가 맡김 — 미니맵에 핀 안 찍음 */
      if (npc.trigger_type.toUpperCase() === "PURIFY") continue;
      const el = document.createElement("button");
      el.type = "button";
      // 노드 타입별 외형 구분 — 전투/보스는 위협, 거점은 안전, NPC/지역은 평범
      const cleared = this.hooks.isNodeCleared(npc.npc_id) ? " cleared" : "";
      const pillar = pillarForTrigger(npc.trigger_type);
      el.className = `explore-poi node-${npc.trigger_type.toLowerCase()} ${pillarClass(pillar)}${cleared}`;
      el.style.left = `${npc.x_pct}%`;
      el.style.top = `${npc.y_pct}%`;
      el.dataset.npc = npc.npc_id;
      el.dataset.pillar = pillar;
      el.innerHTML =
        `<span class="explore-poi-pillar">${pillar}</span>` +
        `<span class="explore-poi-icon">${npc.icon}</span>` +
        `<span class="explore-poi-label">${npc.label}</span>`;
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        if (this.minimapMode) return;
        void this.approach(npc);
      });
      this.propLayer.appendChild(el);
    }

    this.renderExits(area);
  }

  /**
   * 섹터 이동 UI — 맵 좌하단 십자 패드.
   * 오른쪽 필러/채팅과 겹치지 않게 화면 우측에 절대 배치하지 않는다.
   */
  private renderExits(area: AreaDef) {
    this.propLayer.querySelectorAll(".explore-exit").forEach((e) => e.remove());
    this.navPad.innerHTML = "";

    const arrow: Record<string, string> = { TOP: "▲", BOTTOM: "▼", LEFT: "◀", RIGHT: "▶" };
    const exits = this.exitsOf(area.area_id);
    if (!exits.length) {
      this.navPad.classList.remove("on");
      return;
    }
    this.navPad.classList.add("on");

    const shortName = (full: string) =>
      full.replace(/^무지개섬\s*[·・]\s*/, "").trim() || full;

    for (const conn of exits) {
      const el = document.createElement("button");
      el.type = "button";
      const locked = !!conn.requires && !this.hooks.isNodeCleared(conn.requires);
      el.className = `explore-nav-btn side-${conn.side.toLowerCase()}${locked ? " locked" : ""}`;
      const target = this.data.areas.find((a) => a.area_id === conn.to);
      const name = shortName(target?.display_name ?? conn.to);
      el.title = locked ? "관문 필요" : name;
      el.innerHTML = locked
        ? `<span class="explore-nav-arrow">🔒</span>`
        : `<span class="explore-nav-arrow">${arrow[conn.side] ?? "·"}</span><span class="explore-nav-label">${name}</span>`;
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        if (locked) {
          const gate = this.data.areaNpcs.find((n) => n.npc_id === conn.requires);
          this.hooks.log(
            `🔒 도전 — ${gate?.label ?? "관문"}을(를) 넘지 않으면 이쪽으로는 갈 수 없다.`
          );
          return;
        }
        void this.travel(conn.to, conn.side);
      });
      this.navPad.appendChild(el);
    }
  }

  /**
   * 이 지역에서 나갈 수 있는 통로 (bidirectional이면 역방향은 반대쪽 끝).
   * `unlock_condition`이 `NODE:<node_id>` 형식이면 그 노드를 클리어해야 열린다 —
   * **앞으로 나갈 때만** 잠그고, 되돌아가는 방향은 항상 열어 둔다(막다른 길 방지).
   */
  private exitsOf(
    areaId: string
  ): { to: string; side: ExitSide; requires?: string }[] {
    return areaExits(this.data, areaId);
  }

  // ── 움직임 ────────────────────────────────────────────────────────────

  /** (x%, y%)로 걸어간다. 2D 거리에 비례한 시간 + 방향 전환 + 걷기 모션 + 카메라 추적. */
  walkTo(targetX: number, targetY: number, opts?: { force?: boolean; durationMs?: number }): Promise<void> {
    if (this.busy && !opts?.force) return Promise.resolve();
    const nx = clamp(targetX, 8, 92);
    const ny = clamp(targetY, 4, 94);
    const dx = nx - this.xPct;
    const dy = ny - this.yPct;
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return Promise.resolve();

    // 좌우 성분이 뚜렷할 때만 방향을 바꾼다(위로만 갈 땐 유지)
    if (Math.abs(dx) > 1.5) {
      const next: 1 | -1 = dx >= 0 ? 1 : -1;
      if (next !== this.facing) {
        this.facing = next;
        this.actor.classList.add("turning");
        window.setTimeout(() => this.actor.classList.remove("turning"), TURN_MS);
      }
    }

    const wr = this.world.getBoundingClientRect();
    const distPx = Math.hypot((dx / 100) * wr.width, (dy / 100) * wr.height);
    const ms = opts?.durationMs ?? walkDurationMs(distPx);

    const ox = this.xPct;
    const oy = this.yPct;
    if (this.artMode && this.currentAreaId) {
      this.stampFogPath(this.currentAreaId, ox, oy, nx, ny);
    }

    this.xPct = nx;
    this.yPct = ny;
    this.actor.classList.add("walking");
    // CSS transition-property 순서는 left, top, transform.
    // 단일 값을 주면 transform까지 걷기 길이로 늘어나 scaleX 반전이 천천히 진행되고,
    // 그 사이 캐릭터가 납작해졌다 돌아온다.
    this.actor.style.transitionDuration = `${ms}ms, ${ms}ms, ${TURN_MS}ms`;
    this.camera.style.transitionDuration = `${ms}ms`;
    this.applyActor(true);
    this.applyCamera(true);
    this.startFogWalkReveal(ox, oy, nx, ny, ms);

    return new Promise((resolve) => {
      this.cancelPendingWalk(); // 이전 걷기를 정리(Promise도 반드시 해제)
      this.walkResolve = resolve;
      this.walkTimer = window.setTimeout(() => {
        this.walkTimer = null;
        this.walkResolve = null;
        this.stopFogWalkReveal();
        this.refreshFog();
        this.actor.classList.remove("walking");
        this.actorInner.classList.add("landing");
        window.setTimeout(() => this.actorInner.classList.remove("landing"), 260);
        resolve();
      }, ms);
    });
  }

  /** 걷는 동안 시야 원이 경로를 따라가게 (setInterval · rAF 금지) */
  private startFogWalkReveal(x0: number, y0: number, x1: number, y1: number, ms: number) {
    this.stopFogWalkReveal();
    if (!this.artMode) return;
    this.usingFogWalk = true;
    const t0 = Date.now();
    const tickMs = 50;
    this.fogWalkX = x0;
    this.fogWalkY = y0;
    this.fogTick = window.setInterval(() => {
      const t = Math.min(1, (Date.now() - t0) / Math.max(1, ms));
      this.fogWalkX = x0 + (x1 - x0) * t;
      this.fogWalkY = y0 + (y1 - y0) * t;
      this.refreshFog();
      if (t >= 1) this.stopFogWalkReveal();
    }, tickMs);
  }

  private stopFogWalkReveal() {
    if (this.fogTick) {
      window.clearInterval(this.fogTick);
      this.fogTick = null;
    }
    this.usingFogWalk = false;
  }

  /**
   * busy 설정 — 켤 때 안전 타이머를 걸어, 어떤 이유로든 해제가 누락돼도
   * 조작이 영구히 먹통이 되지 않게 한다.
   */
  private setBusy(v: boolean) {
    this.busy = v;
    if (this.busyGuard) {
      window.clearTimeout(this.busyGuard);
      this.busyGuard = null;
    }
    if (v) {
      this.busyGuard = window.setTimeout(() => {
        this.busy = false;
        this.busyGuard = null;
      }, 6000);
    }
  }

  /** 진행 중인 걷기를 취소하고, 대기 중이던 Promise를 해제한다 */
  private cancelPendingWalk() {
    this.stopFogWalkReveal();
    if (this.walkTimer) {
      window.clearTimeout(this.walkTimer);
      this.walkTimer = null;
    }
    if (this.walkResolve) {
      const r = this.walkResolve;
      this.walkResolve = null;
      r();
    }
  }

  private applyActor(animated: boolean) {
    if (!animated) this.actor.style.transitionDuration = "0ms, 0ms, 0ms";
    this.actor.style.left = `${this.xPct}%`;
    this.actor.style.top = `${this.yPct}%`;
    this.actor.style.setProperty("--facing", String(this.facing));
    // 위로 갈수록(멀어질수록) 아주 살짝 작게 — 얕은 원근
    const scale = 0.88 + (this.yPct / 100) * 0.2;
    this.actor.style.setProperty("--depth-scale", scale.toFixed(3));
    this.updateActorSpotlight(animated);
  }

  /** 배우가 화면 CAM_ANCHOR 위치에 오도록 월드를 세로 이동 */
  private applyCamera(animated: boolean) {
    if (!animated) this.camera.style.transitionDuration = "0ms";
    const viewH = this.layer.getBoundingClientRect().height || 300;
    const worldH = viewH * (this.worldHPct / 100);
    const actorY = (this.yPct / 100) * worldH;
    const offset = clamp(actorY - viewH * CAM_ANCHOR, 0, Math.max(0, worldH - viewH));
    this.camera.style.transform = `translateY(${-offset}px)`;
    this.world.style.transform = "none";
  }

  /**
   * 하루를 넘길 때의 이동 연출 — 위로 한 구간 전진한다.
   * 맨 위에 닿아 있으면 아래로 되돌아가 다시 올라갈 여지를 만든다.
   */
  async journey(ms = 1200): Promise<void> {
    if (!this.isOn() || this.minimapMode) return;
    this.setBusy(true);
    try {
      const nextY = this.yPct <= 14 ? 88 : Math.max(8, this.yPct - 26);
      const nextX = clamp(this.xPct + (Math.random() * 30 - 15), 20, 80);
      await this.walkTo(nextX, nextY, { force: true, durationMs: ms });
    } finally {
      this.setBusy(false);
    }
  }

  /** 이벤트 지점까지 걸어가 살펴본다 */
  private async approach(npc: AreaNpcDef) {
    if (this.busy) return;
    this.setBusy(true);
    try {
      // 지점 살짝 아래에 서도록
      await this.walkTo(npc.x_pct, Math.min(94, npc.y_pct + 7), { force: true });

      const poi = this.propLayer.querySelector<HTMLElement>(`[data-npc="${npc.npc_id}"]`);
      poi?.classList.add("found");
      window.setTimeout(() => poi?.classList.remove("found"), 700);

      this.actorInner.classList.add("react");
      window.setTimeout(() => this.actorInner.classList.remove("react"), 520);

      // MEMORY·MEMO 포함 전부 main으로 넘긴다.
      // 기억 조각을 여기서만 처리하면 3D 뷰로 밟았을 때 수집이 누락된다.
      const cleared = await this.hooks.runNode(npc);
      if (cleared) {
        this.markCleared(npc.npc_id);
        if (npc.trigger_type === "MEMORY") poi?.remove(); // 주운 조각은 맵에서 사라진다
      }
    } finally {
      this.setBusy(false);
    }
  }

  /** 클리어한 노드를 흐리게 표시하고, 잠겨 있던 통로가 열렸는지 다시 그린다 */
  private markCleared(nodeId: string) {
    const el = this.propLayer.querySelector<HTMLElement>(`[data-npc="${nodeId}"]`);
    el?.classList.add("cleared");
    const area = this.data.areas.find((a) => a.area_id === this.currentAreaId);
    if (area) this.renderExits(area);
  }

  /* 기억 조각 수집은 main.runMapNode의 MEMORY case로 옮겼다 —
     탑뷰와 3D 뷰가 같은 경로를 타야 어느 쪽으로 밟아도 수집된다. */

  /** 다른 구역으로 — 끝까지 걸어간 뒤 페이드, 반대쪽 끝에서 들어온다 */
  private async travel(toAreaId: string, side: "TOP" | "BOTTOM" | "LEFT" | "RIGHT") {
    if (this.busy) return;
    this.setBusy(true);
    // enter()가 currentAreaId를 덮으므로 출발지를 먼저 잡아둔다
    const fromAreaId = this.currentAreaId;
    try {
      const edgeX = side === "LEFT" ? 10 : side === "RIGHT" ? 90 : this.xPct;
      const edgeY = side === "TOP" ? 10 : side === "BOTTOM" ? 90 : this.yPct;
      await this.walkTo(edgeX, edgeY, { force: true });
      await fadeTo(this.fade, 1, FADE_MS);
      const fromEdge =
        side === "TOP" ? "BOTTOM" : side === "BOTTOM" ? "TOP" : side === "LEFT" ? "RIGHT" : "LEFT";
      this.enter(toAreaId, { fromEdge });
      await fadeTo(this.fade, 0, FADE_MS);
      // 도착 후 육지 안쪽으로 한 걸음
      const inlandX = fromEdge === "LEFT" ? 35 : fromEdge === "RIGHT" ? 65 : this.xPct;
      const inlandY = fromEdge === "TOP" ? 35 : fromEdge === "BOTTOM" ? 65 : this.yPct;
      await this.walkTo(inlandX, inlandY, { force: true });
      const area = this.data.areas.find((a) => a.area_id === toAreaId);
      if (area) this.hooks.log(`🚶 ${area.display_name}에 들어섰다.`);
      // 41 §1-1 — 섹터를 넘으면 하루가 간다. 배가 오는 날이면 여기서 판이 끝난다.
      if (this.hooks.onSectorTravel) {
        await this.hooks.onSectorTravel(fromAreaId, toAreaId);
      }
    } finally {
      this.setBusy(false);
    }
  }

  // ── 표시 제어 ─────────────────────────────────────────────────────────
  show() {
    this.layer.classList.add("on");
    if (!this.currentAreaId) {
      const first = this.data.areas[0];
      if (first) this.enter(first.area_id, { silent: true });
    } else {
      // 숨어 있는 동안 크기가 바뀌었을 수 있으므로 카메라 재계산
      this.applyCamera(false);
      this.refreshFog();
    }
  }

  hide() {
    this.layer.classList.remove("on");
  }

  isOn() {
    return this.layer.classList.contains("on");
  }

  get areaId() {
    return this.currentAreaId;
  }

  /** 현재 발 위치(%) — 다음 노드 후보를 고를 때 가까운 쪽 우선용 */
  get pos() {
    return { x: this.xPct, y: this.yPct };
  }

  // ── 미니맵 모드 (3D 뷰가 주연일 때) ────────────────────────────────────

  /**
   * 탑뷰를 미니맵으로 격하한다.
   * 카메라 추적을 끄고 섹터 한 장을 통째로 보여주며, 탭·걷기 조작을 받지 않는다.
   * 이동의 주도권은 3D 뷰가 갖고, 여기는 좌표를 **받기만** 한다.
   */
  setMinimapMode(on: boolean) {
    if (on === this.minimapMode) return;
    this.minimapMode = on;
    this.layer.classList.toggle("minimap", on);
    if (on) {
      this.cancelPendingWalk();
      this.camera.style.transitionDuration = "0ms";
      this.camera.style.transform = "none";
      this.enableMinimapTabShelf();
    } else {
      this.layer.classList.remove(
        "minimap-tab-mode",
        "minimap-docked",
        "minimap-open",
        "minimap-travel-active",
        "minimap-travel-offscreen",
      );
      this.minimapTabBtn.hidden = true;
      this.applyCamera(false);
    }
    this.refreshFog();
  }

  isMinimapMode() {
    return this.minimapMode;
  }

  isMinimapSuppressed(): boolean {
    return this.layer.classList.contains("minimap-suppressed");
  }

  /** 부두처럼 아직 원흉 원이 아니면 지도를 숨긴다. */
  suppressMinimap(on: boolean): void {
    this.layer.classList.toggle("minimap-suppressed", on);
    if (on) this.layer.classList.remove("minimap-intro", "minimap-travel-active");
  }

  /** HUD 칸에 작은 미니맵을 둔다. */
  showMinimapDocked(): void {
    this.suppressMinimap(false);
    this.layer.classList.remove("minimap-intro", "minimap-travel-active", "minimap-travel-offscreen");
    this.enableMinimapTabShelf();
  }

  /** 원흉 원 첫 도달 — 가운데에 크게, 그다음 호출측에서 지역 알림. */
  async playCulpritMapIntro(holdMs = 2200): Promise<void> {
    if (!this.minimapMode) this.setMinimapMode(true);
    this.suppressMinimap(false);
    this.layer.classList.remove("minimap-docked", "minimap-travel-active", "minimap-travel-offscreen");
    this.layer.classList.add("minimap-tab-mode", "minimap-intro");
    this.minimapTabBtn.hidden = true;
    await new Promise<void>((r) => window.setTimeout(r, holdMs));
    this.layer.classList.remove("minimap-intro");
  }

  /** 미니맵/탐방 레이어 DOM — HUD 배치 시 폰으로 옮길 때 사용 */
  getLayer(): HTMLElement {
    return this.layer;
  }

  /**
   * 탐방 레이어를 다른 루트에 붙인다.
   * 세로 3D: 스테이지 overflow에 안 잘리게 폰으로 올린다.
   */
  setHost(root: HTMLElement): void {
    if (this.root === root && this.layer.parentElement === root) return;
    this.root = root;
    if (this.layer.parentElement !== root) root.appendChild(this.layer);
  }

  /**
   * 3D 주연일 때 지도는 접혀 숨긴다.
   * 콘텐츠가 발동할 때만 오른쪽에서 잠깐 나온다(peekMinimapContent).
   */
  enableMinimapTabShelf(_opts?: { open?: boolean }): void {
    if (!this.minimapMode) return;
    this.layer.classList.add("minimap-tab-mode", "minimap-docked");
    this.layer.classList.remove("minimap-open", "hud-layout-hidden");
    this.minimapTabBtn.hidden = true;
    this.minimapTabBtn.setAttribute("aria-expanded", "false");
  }

  /** 탭 클릭 — 펼침 ↔ 접힘 */
  toggleMinimapShelf(): void {
    if (!this.minimapMode || !this.layer.classList.contains("minimap-tab-mode")) return;
    if (this.layer.classList.contains("minimap-travel-active")) return;
    const open = !this.layer.classList.contains("minimap-open");
    this.layer.classList.toggle("minimap-open", open);
    this.layer.classList.toggle("minimap-docked", !open);
    this.minimapTabBtn.setAttribute("aria-expanded", open ? "true" : "false");
  }

  isMinimapShelfOpen(): boolean {
    return this.layer.classList.contains("minimap-open");
  }

  /**
   * 오른쪽에서 슬라이드 인/아웃. 콘텐츠 발동 피크용.
   * 이미 나와 있으면 인 연출은 건너뛴다.
   */
  async setMinimapTravelPeek(show: boolean): Promise<void> {
    if (!this.minimapMode) return;
    const SLIDE_MS = 480;
    if (show) {
      this.minimapTravelFromDock = true;
      this.layer.classList.remove("hud-layout-hidden", "minimap-open");
      this.layer.classList.add("minimap-tab-mode", "minimap-docked");
      this.minimapTabBtn.hidden = true;
      if (this.layer.classList.contains("minimap-travel-active") &&
          !this.layer.classList.contains("minimap-travel-offscreen")) {
        return;
      }
      this.layer.classList.add("minimap-travel-active", "minimap-travel-offscreen");
      void this.layer.offsetWidth;
      this.layer.classList.remove("minimap-travel-offscreen");
      await new Promise<void>((r) => window.setTimeout(r, SLIDE_MS));
      return;
    }
    if (!this.layer.classList.contains("minimap-travel-active")) return;
    this.layer.classList.add("minimap-travel-offscreen");
    await new Promise<void>((r) => window.setTimeout(r, SLIDE_MS));
    this.layer.classList.remove("minimap-travel-active", "minimap-travel-offscreen");
    this.layer.classList.add("minimap-docked");
    this.layer.classList.remove("minimap-open");
    this.minimapTabBtn.hidden = true;
    this.minimapTabBtn.setAttribute("aria-expanded", "false");
    this.layer.classList.remove("hud-layout-hidden");
  }

  /** 지도가 오른쪽에서 나와 3초 머물다 다시 들어간다. 연속 발동이면 타이머를 다시 잰다. */
  peekMinimapContent(holdMs = 3000): void {
    if (!this.minimapMode) return;
    this.minimapPeekGen += 1;
    const gen = this.minimapPeekGen;
    void (async () => {
      await this.setMinimapTravelPeek(true);
      await new Promise<void>((r) => window.setTimeout(r, holdMs));
      if (gen !== this.minimapPeekGen) return;
      await this.setMinimapTravelPeek(false);
    })();
  }

  /**
   * 3D 뷰의 좌표·시선을 그대로 받는다.
   * 맵은 북쪽 고정, 시야 부채꼴만 yaw를 따라 돈다.
   * 제자리 회전이면 위치는 그대로 두고 부채꼴만 돌린다.
   */
  syncFrom3D(xPct: number, yPct: number, yawDeg: number) {
    const nx = clamp(xPct, 0, 100);
    const ny = clamp(yPct, 0, 100);
    const ox = this.xPct;
    const oy = this.yPct;
    const moved = Math.abs(nx - ox) >= 0.05 || Math.abs(ny - oy) >= 0.05;
    this.yawDeg = ((yawDeg % 360) + 360) % 360;

    // 첫 동기화 또는 큰 점프: 걷기 transition 끄고 즉시 스냅 (미니맵 튐 방지)
    const jump = !this.minimapSyncedOnce || Math.hypot(nx - ox, ny - oy) >= 4;
    if (jump) {
      this.minimapSyncedOnce = true;
      this.actor.classList.remove("walking");
      this.xPct = nx;
      this.yPct = ny;
      this.applyActor(false);
      if (!this.minimapMode) this.applyCamera(false);
      this.refreshFog();
      return;
    }

    if (moved) {
      if (this.artMode && this.currentAreaId) {
        this.stampFogPath(this.currentAreaId, ox, oy, nx, ny);
      }
      this.xPct = nx;
      this.yPct = ny;
      const east = -Math.sin((this.yawDeg * Math.PI) / 180);
      if (Math.abs(east) > 0.35) this.facing = east >= 0 ? 1 : -1;
      this.applyActor(false);
      if (!this.minimapMode) this.applyCamera(true);
    }

    this.refreshFog();
  }

  /** 3D 뷰에서 노드를 클리어했을 때 탑뷰 표시도 맞춘다 */
  markNodeCleared(nodeId: string) {
    this.markCleared(nodeId);
  }

  /**
   * 3D 뷰가 안개 판정을 물어볼 때 — 판정 규칙을 두 뷰가 공유해야
   * 미니맵에서 보이는 노드와 3D에서 보이는 노드가 어긋나지 않는다.
   */
  isRevealedAt(areaId: string, xPct: number, yPct: number): boolean {
    return this.isRevealed(areaId, xPct, yPct);
  }
}

// ── 유틸 ────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function walkDurationMs(distPx: number): number {
  const linearMs = Math.max(0, (distPx / WALK_SPEED_PX_PER_SEC) * 1000);
  const eased = Math.pow(linearMs, WALK_DIST_EXP) * Math.pow(1000, 1 - WALK_DIST_EXP);
  return Math.round(clamp(eased, WALK_MIN_MS, WALK_MAX_MS));
}

function fadeTo(el: HTMLElement, opacity: number, ms: number): Promise<void> {
  el.style.transitionDuration = `${ms}ms`;
  el.style.opacity = String(opacity);
  el.style.pointerEvents = opacity > 0 ? "auto" : "none";
  return new Promise((r) => window.setTimeout(r, ms));
}
