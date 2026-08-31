/**
 * 여정 3D 뷰 — 본편 무대에 올라가는 껍데기.
 *
 * JourneyStage3D(렌더러)와 게임 데이터(GameData / area_npc_config) 사이의 접착층이다.
 * ExploreView와 같은 (host, data, hooks) 형태를 지켜 main.ts에서 대칭으로 쓴다.
 *
 * 역할 분담:
 * - **이동의 주도권은 여기 있다.** 좌표를 만들어 ExploreView(미니맵)로 밀어 넣는다.
 * - **콘텐츠 실행은 기존 경로를 그대로 쓴다.** 전투·겨루기는 다가가면 바로 시작하고,
 *   대화·촉매 같은 나머지 노드만 「확인」을 남긴다. 전투는 별도 시뮬이 아니라
 *   **그 자리에서 오염을 푸는 연출**(정화 습격)이다.
 */
import { playLog } from "../../dev/playLog";
import type { AreaDef, AreaNpcDef, ArenaDef, GameData, PurifyFocus } from "../../types";
import { pillarForTrigger, areaExits, flipExitSide, type ExitSide } from "../../explore";
import { runArenaBout, type ArenaResult } from "./ArenaBout";
import { bearingDeg, CompassHud } from "./CompassHud";
import { JourneyStage3D } from "./JourneyStage3D";
import { sectorIdOf, areaToWorld, sectorOrigin, type PurifyFocusWorld } from "./IslandTerrain";
import { PurifyRaid, type RaidHud } from "./PurifyRaid";
import { PurifyRaidHud } from "./PurifyRaidHud";
import { playPickupGauge, playPurifyMelt, type MashCollectResult } from "./PurifyMelt";
import { loadPurifyRaidConfig, scaleRaidForTier } from "./purifyRaidConfig";
import { loadRaidTables } from "./raidTables";
import { loadActorSprite, loadActorSpriteExtras } from "./spriteSheet";
import { spawnPctInArea } from "../spawnStart";
import { ResidualColorHunt } from "./ResidualColorHunt";
import { SectorPurifyLoop, type SectorLoopHooks } from "./SectorPurifyLoop";
import { shutterClose, shutterOpen } from "./journeyEnterFx";
import {
  JOURNEY3D_DEFAULTS,
  loadJourney3DConfig,
  type Journey3DConfig,
} from "./journey3dConfig";
import type { Pillar, ViewMode, WorldNode } from "./types";
import { csvPropToWorld } from "./propFromCsv";

export interface PurifyRaidRunOpts {
  /** 탄약 게이지를 입힐 셸 단추(발사 입력은 아님) */
  fireEl?: HTMLElement;
  /** NORMAL / MINIBOSS / FINALBOSS */
  tier?: string;
  /** 입장 때 이미 정화제를 선불함 — 연출이 탄 고갈로 멈추지 않게 장전 */
  prepaid?: boolean;
  onHud?: (h: RaidHud) => void;
  learnedSkills?: string[];
}

export interface Journey3DHooks {
  isNodeCleared: (nodeId: string) => boolean;
  /** 안개에 아직 가려진 노드인지 — 탑뷰의 안개 판정을 그대로 빌린다 */
  isNodeRevealed: (npc: AreaNpcDef) => boolean;
  /** 정화된 구역인지 — 노드 해금 등 논리. 바닥 색은 foci가 담당 */
  isAreaPurified: (areaId: string) => boolean;
  /** Cozy 원형 정화 거점 */
  getPurifyFoci?: () => PurifyFocus[];
  /** AREA 잔여 스케치 오브 — 칼라 총으로 칠했는지 */
  isPropPurified?: (propId: string) => boolean;
  /** 잔여 오브 칠 완료 */
  onPropPurified?: (propId: string) => void;
  /** 노드 콘텐츠 실행 — 기존 runMapNode로 그대로 넘어간다 */
  runNode: (npc: AreaNpcDef) => Promise<boolean>;
  /** 이동할 때마다 — 미니맵 좌표 동기화 */
  onMove?: (xPct: number, yPct: number, yawDeg: number) => void;
  /** 노드에 닿거나 떨어질 때 — 하단 줍기/다가가기 버튼 */
  onNearChange?: (npc: AreaNpcDef | null) => void;
  /** 겨루기 모으기 — 하단 필러 버튼에 연타를 붙인다. null이면 해제 */
  onArenaMash?: (hit: (() => void) | null, label?: string) => void;
  mashPressHint?: string;
  mashUntilHint?: string;
  /** 3D가 이웃 칸으로 넘어간 뒤 — 미니맵·장 헤더만 맞춘다(다시 enter 하지 말 것) */
  onAreaCross?: (fromAreaId: string, toAreaId: string, fromEdge: ExitSide) => void;
  /** 페이드 인이 끝난 뒤 — 활동칸 맵이름 */
  onAreaShown?: (areaId: string) => void;
  /** 습격에 실을 보유 스킬 */
  getLearnedSkills?: () => string[];
}

export class Journey3DView {
  private layer: HTMLElement;
  private canvas: HTMLCanvasElement;
  private prompt: HTMLButtonElement;
  private compass: CompassHud;
  private stage: JourneyStage3D;
  private resizeObs: ResizeObserver;

  private currentAreaId = "";
  private nearNpcId: string | null = null;
  private running = false;
  /** 원 루프 동안 맵 정화제 판넬을 숨긴다 — 스폰 발치에 겹치면 획득처럼 보이는데 안 지워진다 */
  private sectorLoopLive = false;
  private on = false;
  /** 이번 접근에서 이미 자동으로 연 전투 노드 — 떠나기 전엔 다시 안 연다 */
  private visitArmedId: string | null = null;
  private markX = -999;
  private markY = -999;
  private needCode: string | null = null;
  private needRaf = 0;
  private needEl!: HTMLElement;
  private lootEl!: HTMLElement;
  private headOverlay!: HTMLElement;
  private headBox!: HTMLElement;
  private headNeed!: HTMLElement;
  private headLabelEl!: HTMLElement;
  private headFill!: HTMLElement;
  private headPctEl!: HTMLElement;
  private headMash = false;
  private headHint = "상태";
  private headText = "탐색중";
  private headRaf = 0;
  /**
   * 카메라·안개·스케일 값. 기본값으로 시작해 저장된 JSON이 오면 갈아 끼운다.
   * 툴(/layout-editor.html 씬 journey3d · /fpv-tool.html)에서 조절해 저장한 값이다.
   */
  private cfg: Journey3DConfig = { ...JOURNEY3D_DEFAULTS };
  private residualHunt!: ResidualColorHunt;
  /** 아치 — 3D 레이어 안에 두어 확인버튼(z40) 아래에 깔리게 */
  private seamEl: HTMLElement | null = null;
  private seamHome: HTMLElement | null = null;
  private crossing = false;

  constructor(
    private readonly host: HTMLElement,
    private readonly data: GameData,
    private readonly hooks: Journey3DHooks,
  ) {
    this.layer = document.createElement("div");
    this.layer.className = "stage3d-layer";
    this.canvas = document.createElement("canvas");
    this.canvas.className = "stage3d-canvas";
    this.prompt = document.createElement("button");
    this.prompt.type = "button";
    this.prompt.className = "stage3d-prompt";
    this.prompt.addEventListener("click", () => void this.activateNear());
    this.needEl = document.createElement("div");
    this.needEl.className = "actor-need-anim";
    this.needEl.setAttribute("aria-hidden", "true");
    this.lootEl = document.createElement("div");
    this.lootEl.className = "loot-paper";
    // 폰 HUD(#actorStatusHud)에 상태 칩을 붙인다 — HUD 툴로 위치 조절
    const statusHud = document.getElementById("actorStatusHud");
    this.headOverlay = document.createElement("div");
    this.headOverlay.className = "melt-overlay pick-overlay pick-head actor-head-status mash-catcher";
    this.headOverlay.setAttribute("aria-hidden", "true");
    if (statusHud) {
      this.headBox = statusHud;
      this.headNeed = statusHud.querySelector(".pick-need") as HTMLElement;
      this.headLabelEl = statusHud.querySelector(".melt-label") as HTMLElement;
      this.headFill = statusHud.querySelector("i") as HTMLElement;
      this.headPctEl = statusHud.querySelector(".melt-pct") as HTMLElement;
      this.headBox.classList.add("actor-status-hud", "pick-head-box");
    } else {
      this.headOverlay.innerHTML = `
      <div class="pick-head-box" id="actorStatusHudFallback">
        <div class="pick-need">상태</div>
        <div class="melt-label">탐색중</div>
        <div class="melt-meter pick-meter" title="상태"><i></i></div>
        <div class="melt-pct">0%</div>
      </div>
    `;
      this.headBox = this.headOverlay.querySelector(".pick-head-box") as HTMLElement;
      this.headNeed = this.headOverlay.querySelector(".pick-need") as HTMLElement;
      this.headLabelEl = this.headOverlay.querySelector(".melt-label") as HTMLElement;
      this.headFill = this.headOverlay.querySelector("i") as HTMLElement;
      this.headPctEl = this.headOverlay.querySelector(".melt-pct") as HTMLElement;
    }
    this.layer.append(this.canvas, this.prompt, this.needEl, this.lootEl, this.headOverlay);
    this.compass = new CompassHud(this.layer);
    /* 아치를 레이어로 옮겨 캔버스 위·확인버튼 아래 스택에 넣는다 */
    const seam = document.getElementById("journeySeam");
    if (seam) {
      this.seamEl = seam;
      this.seamHome = seam.parentElement;
      this.layer.appendChild(seam);
    }
    host.appendChild(this.layer);

    const spawnArea = this.data.areas.find((a) => a.is_spawn)?.area_id ?? "area_i21";
    this.stage = new JourneyStage3D(this.canvas, {
      worldM: this.cfg.world_m,
      fogVisionM: this.cfg.fog_vision_m,
      charHeightM: this.cfg.char_height_m,
      initialFocus: sectorIdOf(spawnArea),
      onMove: (x, y, yaw) => {
        this.compass.setYaw(yaw);
        if (Math.hypot(x - this.markX, y - this.markY) > 0.45) {
          this.markX = x;
          this.markY = y;
          this.refreshCompassMarks();
        }
        this.hooks.onMove?.(x, y, yaw);
        this.syncNeedAnim();
        this.syncHeadBox();
      },
      onNodeNear: (node) => this.showPrompt(node),
      onNodeActivate: () => void this.activateNear(),
      onTick: (dt) => {
        this.residualHunt?.tick(dt);
        this.syncHeadBox();
      },
      onCellEdge: (side) => void this.tryCrossEdge(side),
    });
    this.residualHunt = new ResidualColorHunt(this.stage);
    this.residualHunt.setOnColored((id) => this.hooks.onPropPurified?.(id));
    this.residualHunt.setOnNeedAnim((code) => this.setNeedAnim(code));

    this.resizeObs = new ResizeObserver(() => this.fit());
    this.resizeObs.observe(this.layer);

    (window as unknown as { __stage3d: JourneyStage3D }).__stage3d = this.stage;

    void this.loadSprite();
    void this.loadConfig();
  }

  /**
   * 저장된 튜닝 값을 적용한다. JSON이 없으면 기본값 그대로라 조용히 지나간다.
   * 노드는 이미 놓여 있을 수 있으니 크기까지 다시 잰다.
   */
  private async loadConfig() {
    this.cfg = await loadJourney3DConfig();
    this.stage.applyConfig(this.cfg);
    const raid = await loadPurifyRaidConfig().catch(() => null);
    if (raid) this.stage.applyStoneThrowConfig(raid);
    if (this.currentAreaId) {
      this.refreshNodes();
      this.scatterForArea(this.currentAreaId);
    }
  }

  private async loadSprite() {
    const core = await loadActorSprite("wanderer", "/ui/lobby/lobby_actor_idle.png", { extras: false });
    await this.stage.setPlayerSprite(core);
    const extra = await loadActorSpriteExtras("wanderer");
    await this.stage.setPlayerSprite({ ...core, ...extra });
  }

  private fit() {
    const r = this.layer.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) this.stage.resize(Math.round(r.width), Math.round(r.height));
  }

  // ── 표시 ──────────────────────────────────────────────────────

  show() {
    this.on = true;
    this.layer.classList.add("on");
    this.stage.setInputEnabled(true);
    this.fit();
    this.setHeadStatus("상태", "탐색중");
    if (this.headBox.id === "actorStatusHud") this.headBox.classList.remove("hud-layout-hidden");
    this.kickHeadLoop();
  }

  hide() {
    this.on = false;
    this.layer.classList.remove("on");
    this.stage.setInputEnabled(false);
    this.hidePrompt();
    this.setNeedAnim(null);
    this.headOverlay.style.display = "none";
    this.headMash = false;
    this.headBox.classList.remove("mash", "mash-hint");
  }

  isOn() {
    return this.on;
  }

  /** 필드 연출용 오버레이 (펫 파편 등) */
  addOverlay(obj: import("three").Object3D): void {
    this.stage.addOverlay(obj);
  }

  removeOverlay(obj: import("three").Object3D): void {
    this.stage.removeOverlay(obj);
  }

  /** 원 루프·노드 실행·자동 걷기 중 — 하단 「정화 지역 찾기」를 다시 누르면 안 된다 */
  isBusy(): boolean {
    return this.running || this.sectorLoopLive || this.stage.isAutoWalking();
  }

  setViewMode(mode: ViewMode) {
    this.stage.setViewMode(mode);
  }

  toggleViewMode() {
    this.stage.toggleViewMode();
  }

  getViewMode(): ViewMode {
    return this.stage.getViewMode();
  }

  /** 둠식 저해상도 — 1이면 원해상도 */
  setRetro(scale: number) {
    this.stage.setResolutionScale(scale);
  }

  // ── 구역 ──────────────────────────────────────────────────────

  async enter(areaId: string, opts?: { keepPosition?: boolean; xPct?: number; yPct?: number }) {
    const area = this.data.areas.find((a) => a.area_id === areaId);
    if (!area) return;
    this.currentAreaId = areaId;
    playLog("AREA", areaId, area.display_name, this.hooks.isAreaPurified(area.area_id) ? "정화됨" : "오염");

    await this.loadFloor(area);
    this.refreshNodes();
    this.scatterForArea(areaId);
    if (!opts?.keepPosition) {
      const spawn = spawnPctInArea(this.data.areaNpcs, areaId);
      const facing = this.stage.getPlayer().yawDeg;
      this.stage.setPlayer(opts?.xPct ?? spawn.xPct, opts?.yPct ?? spawn.yPct, facing);
    } else if (opts.xPct != null && opts.yPct != null) {
      this.stage.setPlayer(opts.xPct, opts.yPct);
    }
    this.fit();
    await this.stage.waitPropsReady();
  }

  /** 바닥에 핀 없이 이 칸 원흉 루프를 연다. */
  async tryStartSectorLoop(): Promise<void> {
    if (!this.on) return;
    if (this.running) return;
    const row = this.data.culprits.find((c) => c.area_id === this.currentAreaId);
    if (!row) return;
    const npc = this.data.areaNpcs.find((n) => n.npc_id === row.loop_npc_id);
    if (!npc || this.hooks.isNodeCleared(npc.npc_id)) return;
    this.running = true;
    try {
      await this.hooks.runNode(npc);
    } finally {
      this.running = false;
      this.stage.setFrozen(false);
    }
  }

  get areaId(): string {
    return this.currentAreaId;
  }

  /** 가장자리 → 열린 이웃 칸. 바다 쪽은 CSV에 연결이 없어 그냥 막힌다. */
  private async tryCrossEdge(side: ExitSide): Promise<void> {
    if (this.crossing || this.running || !this.currentAreaId) return;
    const hit = areaExits(this.data, this.currentAreaId).find((e) => {
      if (e.side !== side) return false;
      if (e.requires && !this.hooks.isNodeCleared(e.requires)) return false;
      return true;
    });
    if (!hit) return;
    this.crossing = true;
    this.stage.setFrozen(true);
    try {
      await this.performCross(hit.to, side);
    } finally {
      this.stage.setFrozen(false);
      this.crossing = false;
    }
  }

  /**
   * 「정화 지역 찾기」 — 워프 없이 가장자리까지 걸어 이웃 칸으로 넘는다.
   * 가장자리 센서가 먼저 타지 않게 crossing을 잠근 뒤 걷는다.
   */
  async walkToNeighborArea(toAreaId: string): Promise<boolean> {
    if (!this.on || this.crossing || this.running || !this.currentAreaId) return false;
    const hit = areaExits(this.data, this.currentAreaId).find((e) => {
      if (e.to !== toAreaId) return false;
      if (e.requires && !this.hooks.isNodeCleared(e.requires)) return false;
      return true;
    });
    if (!hit) return false;
    this.crossing = true;
    this.stage.setFrozen(true);
    try {
      const me = this.stage.getPlayer();
      const edgeX =
        hit.side === "LEFT" ? 8 : hit.side === "RIGHT" ? 92 : clampPct(me.xPct, 18, 82);
      const edgeY =
        hit.side === "TOP" ? 8 : hit.side === "BOTTOM" ? 92 : clampPct(me.yPct, 18, 82);
      await this.walkTo(edgeX, edgeY);
      await this.performCross(hit.to, hit.side);
      return true;
    } finally {
      this.stage.setFrozen(false);
      this.crossing = false;
    }
  }

  private async performCross(toAreaId: string, side: ExitSide): Promise<void> {
    await shutterClose(this.layer);
    const from = this.currentAreaId;
    const fromEdge = flipExitSide(side);
    const me = this.stage.getPlayer();
    const xPct =
      fromEdge === "LEFT" ? 14 : fromEdge === "RIGHT" ? 86 : clampPct(me.xPct, 18, 82);
    const yPct =
      fromEdge === "TOP" ? 14 : fromEdge === "BOTTOM" ? 86 : clampPct(me.yPct, 18, 82);
    await this.enter(toAreaId, { keepPosition: true, xPct, yPct });
    this.hooks.onAreaCross?.(from, toAreaId, fromEdge);
    await shutterOpen(this.layer);
    this.hooks.onAreaShown?.(toAreaId);
  }

  /**
   * 첫 외출 입장 — 맵이름은 활동칸이 띄운다.
   */
  async playEnterReveal(_opts?: { title?: string; host?: HTMLElement }): Promise<void> {
    // 타임어택 루프 전 입장은 오염 하늘 유지 (이전 정화량/sync로 풀개방되지 않게)
    if ((this.hooks.getPurifyFoci?.() ?? []).length === 0) {
      this.stage.setPurifyColorAmt(0);
      this.stage.setSkyPurifyAmount(0);
    } else {
      this.stage.syncSkyFromFoci(true);
    }
    this.stage.setFrozen(false);
    this.stage.setInputEnabled(true);
  }

  /**
   * 9칸 타일 섬 바닥. 정화는 섹터가 아니라 Cozy 원.
   */
  private async loadFloor(area: AreaDef) {
    const id = area.area_id;
    const foci = this.fociToWorld();
    try {
      await this.stage.setIslandFloor(id, { polluted: true, foci });
    } catch (err) {
      console.warn("[3d] 섬 바닥 로드 실패", id, err);
    }
    // 입장 기본은 오염 하늘. 이미 클리어된 cozy 원만 정화량 반영.
    if (foci.length > 0) {
      this.stage.setPurifyColorAmt(1);
      this.stage.syncSkyFromFoci(true);
    } else {
      this.stage.setPurifyColorAmt(0);
      this.stage.setSkyPurifyAmount(0);
    }
  }

  private fociToWorld(): PurifyFocusWorld[] {
    const foci = this.hooks.getPurifyFoci?.() ?? [];
    const cell = this.stage.getWorldScale();
    const focusId = sectorIdOf(this.currentAreaId);
    const origin = sectorOrigin(focusId, cell);
    return foci.map((f) => {
      const abs = areaToWorld(f.areaId, f.xPct, f.yPct, cell);
      return {
        x: abs.x - origin.x,
        z: abs.z - origin.z,
        r: (f.radiusPct / 100) * cell,
      };
    });
  }

  /** 정화로 아트가 바뀌었을 때 — 프롭은 다시 안 뿌림(기립 유지) */
  async refreshFloor() {
    const area = this.data.areas.find((a) => a.area_id === this.currentAreaId);
    if (area) await this.loadFloor(area);
  }

  /** 클리어·안개 상태가 바뀐 뒤 노드 표시를 다시 맞춘다 */
  refreshNodes() {
    const npcs = this.npcsOf(this.currentAreaId).filter(
      (n) =>
        !(
          (this.isGroundPickup(n) && (this.sectorLoopLive || this.hooks.isNodeCleared(n.npc_id))) ||
          (this.isStepPurify(n) && this.hooks.isNodeCleared(n.npc_id))
        ),
    );
    const nodes: WorldNode[] = npcs
      .filter((n) => {
        const t = n.trigger_type.toUpperCase();
        return t !== "START" && t !== "PURIFY";
      })
      .map((n) => ({
      id: n.npc_id,
      icon: n.icon || "❔",
      label: n.label || "",
      xPct: n.x_pct,
      yPct: n.y_pct,
      pillar: pillarForTrigger(n.trigger_type) as Pillar,
      cleared: this.hooks.isNodeCleared(n.npc_id),
      /* START는 스폰 자리 — 깃발 마커만 숨기고 근접 확인은 유지 */
      /* 월드 펫말(기둥 간판)은 안 심는다. 근접만 유지 */
      noMarker: true,
      hidden:
        n.trigger_type.toUpperCase() === "START"
          ? false
          : this.isGroundPickup(n) || this.isStepPurify(n)
            ? false
            : !this.hooks.isNodeRevealed(n),
      pierceFog: this.isGroundPickup(n) || this.isStepPurify(n),
    }));
    this.stage.setNodes(nodes);
    this.refreshCompassMarks();
  }

  /** 프롭은 area_prop_config만. 비면 맵에 안 둔다. */
  private scatterForArea(areaId: string) {
    const fromCsv = (this.data.areaProps ?? [])
      .filter((p) => p.area_id === areaId && p.kind !== "sign" && p.kind !== "pole")
      .map((p) => csvPropToWorld(p));
    const merged = fromCsv;
    this.stage.setProps(merged);
    const colored = merged
      .filter((p) => p.purifyTarget && this.hooks.isPropPurified?.(p.id))
      .map((p) => p.id);
    this.stage.syncResidualState(colored);
    const foci = this.fociToWorld();
    this.stage.setPurifyFoci(foci);
    this.stage.setPropsKeepStanding(false);
    if (foci.length > 0 && this.residualLeft() > 0) {
      void this.residualHunt.ensureReady().then(() => this.residualHunt.start());
    } else if (foci.length === 0) {
      this.residualHunt.stop();
    }
  }

  residualLeft(): number {
    return this.stage.listResidualProps().filter((p) => p.pending).length;
  }

  /** AREA 뒤 잔여 스케치 — 5m 사격으로 전부 칠할 때까지 */
  async runResidualHunt(): Promise<void> {
    await this.residualHunt.ensureReady();
    await this.residualHunt.runAutoClear();
  }

  /** 정화 파도: 플레이어 주변 50m — 바닥 컬러 + 배경 기립 (잔여 타깃 제외) */
  async playPurifyRevealWave(opts?: { xPct?: number; yPct?: number }): Promise<void> {
    const me = this.stage.getPlayer();
    const xPct = opts?.xPct ?? me.xPct;
    const yPct = opts?.yPct ?? me.yPct;
    this.stage.stampPurifyDiskPct(xPct, yPct);
    const at = this.stage.pctToWorld(xPct, yPct);
    const foci = this.fociToWorld();
    const hit = foci.reduce<{ r: number; d: number } | null>((best, f) => {
      const d = Math.hypot(f.x - at.x, f.z - at.z);
      if (!best || d < best.d) return { r: f.r, d };
      return best;
    }, null);
    const radiusM = Math.max(8, hit?.r ?? this.cfg.world_m * 0.28);
    await this.stage.setIslandFloor(this.currentAreaId, { polluted: true, foci });
    this.stage.setSkyPurified(false);
    await this.stage.playPurifyStandWave({
      xPct,
      yPct,
      radiusM,
      durationMs: 2600,
      skyWave: true,
      holdWave: true,
    });
    await this.refreshFloor();
    this.stage.setPurifyColorAmt(1);
    this.stage.clearPurifyWaves();
    this.stage.syncSkyFromFoci(true);
    if (this.residualLeft() > 0) {
      await this.residualHunt.ensureReady();
      this.residualHunt.start();
    }
  }

  /** 안개만 갱신 — 걸을 때마다 노드를 다시 만들면 텍스처를 매번 다시 굽는다 */
  refreshFogVisibility() {
    for (const n of this.npcsOf(this.currentAreaId)) {
      if (this.isGroundPickup(n) || this.isStepPurify(n)) {
        this.stage.setNodeHidden(n.npc_id, false);
        continue;
      }
      this.stage.setNodeHidden(n.npc_id, !this.hooks.isNodeRevealed(n));
    }
  }

  private npcsOf(areaId: string): AreaNpcDef[] {
    return this.data.areaNpcs.filter(
      (n) => n.area_id === areaId && (n.appear_condition || "ALWAYS") === "ALWAYS",
    );
  }

  getPlayer() {
    return this.stage.getPlayer();
  }

  getPlayerWorld(): { x: number; z: number } {
    return this.stage.getPlayerWorld();
  }

  /** 드러난 노드 + 이벤트 정화제를 방위 띠 위에 올린다 */
  private refreshCompassMarks() {
    const me = this.stage.getPlayer();
    const marks = this.npcsOf(this.currentAreaId)
      .filter(
        (n) =>
          !this.hooks.isNodeCleared(n.npc_id) &&
          (this.isGroundPickup(n) || this.isStepPurify(n) || this.hooks.isNodeRevealed(n)),
      )
      .map((n) => {
        const fill = this.isGroundPickup(n);
        return {
          bearing: bearingDeg(me.xPct, me.yPct, n.x_pct, n.y_pct),
          icon: n.icon || "•",
          label: fill ? n.label || "정화제" : undefined,
          kind: fill ? "fill" : undefined,
        };
      });
    this.compass.setMarks(marks);
  }

  setPlayer(xPct: number, yPct: number, yawDeg?: number) {
    this.stage.setPlayer(xPct, yPct, yawDeg);
  }

  /** 「다음날」처럼 목적지로 걸어가게. 미니맵은 onMove로 따라온다. */
  walkTo(xPct: number, yPct: number, durationMs?: number): Promise<void> {
    if (!this.on) return Promise.resolve();
    return this.stage.walkTo(xPct, yPct, durationMs);
  }

  getNearNpc(): AreaNpcDef | null {
    const node = this.stage.getNearNode();
    if (!node) return null;
    return this.data.areaNpcs.find((n) => n.npc_id === node.id) ?? null;
  }

  nearestFill(): AreaNpcDef | null {
    const me = this.stage.getPlayer();
    const fills = this.npcsOf(this.currentAreaId).filter(
      (n) => this.isGroundPickup(n) && !this.hooks.isNodeCleared(n.npc_id),
    );
    let best: AreaNpcDef | null = null;
    let bestD = Infinity;
    for (const f of fills) {
      const d = Math.hypot(f.x_pct - me.xPct, f.y_pct - me.yPct);
      if (d < bestD) {
        bestD = d;
        best = f;
      }
    }
    return best;
  }

  /** 가장 가까운 정화제를 기준으로 앞/왼쪽/오른쪽/뒤 */
  fillRelDir(): "앞" | "왼쪽" | "오른쪽" | "뒤" | null {
    const f = this.nearestFill();
    if (!f) return null;
    const me = this.stage.getPlayer();
    const yaw = ((me.yawDeg % 360) + 360) % 360;
    const b = bearingDeg(me.xPct, me.yPct, f.x_pct, f.y_pct);
    const d = ((b - yaw + 540) % 360) - 180;
    const ad = Math.abs(d);
    if (ad <= 35) return "앞";
    if (ad >= 145) return "뒤";
    return d > 0 ? "오른쪽" : "왼쪽";
  }

  /** 가장 가까운 정화제 앞까지 걸어 정면을 맞춘다 */
  async walkToNearestFill(): Promise<boolean> {
    const f = this.nearestFill();
    if (!f) return false;
    await this.walkToFillFront(f.x_pct, f.y_pct);
    return true;
  }

  /**
   * 채취물 앞에 선 뒤 정면을 맞춘다.
   * 이미 위에 있으면 한 걸음 뒤로 빠져 바라본다.
   */
  async walkToFillFront(xPct: number, yPct: number): Promise<void> {
    const w = this.stage.pctToWorld(xPct, yPct);
    const me = this.stage.getPlayerWorld();
    if (Math.hypot(me.x - w.x, me.z - w.z) < 0.5) {
      const ahead = this.stage.aheadPct(2.6);
      const aw = this.stage.pctToWorld(ahead.xPct, ahead.yPct);
      this.stage.lookAtWorld(aw.x, aw.z);
      return;
    }
    const stand = this.stage.frontStandPct(w.x, w.z, 2.6);
    const dest = this.stage.pctToWorld(stand.xPct, stand.yPct);
    if (Math.hypot(me.x - dest.x, me.z - dest.z) > 0.35) {
      await this.walkTo(stand.xPct, stand.yPct);
    }
    this.stage.lookAtWorld(w.x, w.z);
  }

  /**
   * 오염 표(눈에 보이는 웅덩이) 앞까지 걸어간 뒤, 정화 원을 연다.
   * 버튼 「정화 지역 찾기」용 — WASD로 마지막 몇 걸음을 남기지 않는다.
   */
  async walkToAndActivate(npc: AreaNpcDef, opts?: { onArrived?: () => void }): Promise<void> {
    if (!this.on) return;
    const start = this.purifyStepFor(npc) ?? npc;
    const stand = this.blightVisualOf(start) ?? start;
    await this.walkToFillFront(stand.x_pct, stand.y_pct);
    opts?.onArrived?.();
    if (this.hooks.isNodeCleared(start.npc_id) || this.running) return;
    this.nearNpcId = start.npc_id;
    await this.activateNear();
  }

  /** 획득한 정화제 판넬을 즉시 지운다. 루프용 가짜 id면 맵 노드가 없어서 no-op. */
  dismissPickup(npcId: string): void {
    this.stage.removeNode(npcId);
    this.refreshNodes();
  }

  needsConfirm(npc: AreaNpcDef): boolean {
    if (this.hooks.isNodeCleared(npc.npc_id)) return false;
    if (this.sectorLoopLive || this.running) return false;
    return !this.willAutoStart(npc);
  }

  async confirmNear(): Promise<boolean> {
    const npc = this.getNearNpc();
    if (!npc || !this.needsConfirm(npc)) return false;
    this.nearNpcId = npc.npc_id;
    await this.activateNear();
    return true;
  }

  async pickupNear(): Promise<boolean> {
    const npc = this.getNearNpc();
    if (!npc || !this.isGroundPickup(npc) || this.hooks.isNodeCleared(npc.npc_id)) return false;
    this.nearNpcId = npc.npc_id;
    await this.activateNear();
    return true;
  }

  // ── 노드 실행 ──────────────────────────────────────────────────

  private showPrompt(node: WorldNode | null) {
    if (!node) {
      this.nearNpcId = null;
      this.visitArmedId = null;
      this.hidePrompt();
      this.hooks.onNearChange?.(null);
      return;
    }
    this.nearNpcId = node.id;
    const npc = this.data.areaNpcs.find((n) => n.npc_id === node.id) ?? null;
    this.hooks.onNearChange?.(npc);
    if (this.running) {
      this.hidePrompt();
      return;
    }
    const start = npc ? this.purifyStepFor(npc) ?? npc : null;
    if (start && this.willAutoStart(npc ?? start)) {
      this.hidePrompt();
      if (this.visitArmedId === start.npc_id) return;
      this.visitArmedId = start.npc_id;
      this.nearNpcId = start.npc_id;
      void this.activateNear();
      return;
    }
    this.hidePrompt();
  }

  private hidePrompt() {
    this.prompt.classList.remove("on");
  }

  /**
   * 가까운 노드를 기존 콘텐츠 경로로 넘긴다.
   * 카드·대화가 흐르는 동안은 이동을 잠근다.
   * 정화 습격은 그 자리에서 쏘는 연출이라 잠그지 않는다.
   */
  private async activateNear(): Promise<void> {
    if (this.running || !this.nearNpcId) return;
    const npc = this.data.areaNpcs.find((n) => n.npc_id === this.nearNpcId);
    if (!npc) return;

    this.running = true;
    this.hidePrompt();
    const freeze = !this.willRunRaid(npc);
    if (freeze) this.stage.setFrozen(true);
    try {
      const cleared = await this.hooks.runNode(npc);
      if (cleared) {
        this.stage.setNodeCleared(npc.npc_id, true);
        if (this.isGroundPickup(npc) || this.isLootPanel(npc) || this.isStepPurify(npc)) {
          this.stage.removeNode(npc.npc_id);
        }
      }
    } finally {
      this.running = false;
      this.stage.setFrozen(false);
      // 실행 도중 다른 노드로 옮겨간 게 아니라면 프롬프트를 되살린다
      const near = this.stage.getNearNode();
      this.showPrompt(near);
    }
  }

  private isGroundPickup(npc: AreaNpcDef): boolean {
    return npc.trigger_type === "FILL" || npc.trigger_type === "CATALYST";
  }

  private isLootPanel(npc: AreaNpcDef): boolean {
    const t = npc.trigger_type.toUpperCase();
    return t === "FILTER" || t === "TRACE" || t === "DAILY" || t === "SKILL";
  }

  /** 다가가면 바로 실행 — 정화 발판·오염 표·겨루기·습격. 줍기는 하단 「모으기」 */
  private willAutoStart(npc: AreaNpcDef): boolean {
    if (this.stage.isAutoWalking()) return false;
    if (this.sectorLoopLive) return false;
    if (this.isStepPurify(npc)) return !this.hooks.isNodeCleared(npc.npc_id);
    if (npc.trigger_type === "BLIGHT" && this.purifyStepFor(npc)) return true;
    if (npc.trigger_type === "ARENA") return true;
    return this.willRunRaid(npc);
  }

  /** 같은 오염에 묶인 정화 발판 — 눈에 보이는 웅덩이(BLIGHT)에서 원을 연다 */
  private purifyStepFor(npc: AreaNpcDef): AreaNpcDef | null {
    if (this.isStepPurify(npc)) return this.hooks.isNodeCleared(npc.npc_id) ? null : npc;
    if (npc.trigger_type !== "BLIGHT") return null;
    const step = this.data.areaNpcs.find(
      (n) =>
        n.area_id === npc.area_id &&
        this.isStepPurify(n) &&
        n.trigger_ref === npc.trigger_ref &&
        !this.hooks.isNodeCleared(n.npc_id),
    );
    return step ?? null;
  }

  private blightVisualOf(npc: AreaNpcDef): AreaNpcDef | null {
    const step = this.isStepPurify(npc) ? npc : this.purifyStepFor(npc);
    if (!step) return null;
    return (
      this.data.areaNpcs.find(
        (n) =>
          n.area_id === step.area_id &&
          n.trigger_type === "BLIGHT" &&
          n.trigger_ref === step.trigger_ref,
      ) ?? null
    );
  }

  private isStepPurify(npc: AreaNpcDef): boolean {
    return npc.trigger_type.toUpperCase() === "PURIFY";
  }

  private willRunRaid(npc: AreaNpcDef): boolean {
    if (npc.trigger_type !== "COMBAT" && npc.trigger_type !== "MINIBOSS" && npc.trigger_type !== "BOSS") {
      return false;
    }
    const row = this.data.combats.find((c) => c.combat_id === npc.trigger_ref);
    return (row?.tier || "").toUpperCase() !== "PURIFY_FINAL";
  }

  /** 미니게임처럼 3D 안에서 진행되는 콘텐츠가 이동을 잠글 때 */
  setFrozen(on: boolean) {
    this.stage.setFrozen(on);
    if (on) this.hidePrompt();
  }

  /**
   * 정화 습격 — 자동 전투 연출.
   * 카메라가 오는 오염을 보고, 사거리 안에서 알아서 쏜다.
   * 탄약 게이지만 셸에 보여 준다.
   */
  async runPurifyRaid(opts: PurifyRaidRunOpts = {}): Promise<{ won: boolean }> {
    this.hidePrompt();
    this.stage.setFrozen(true);
    this.stage.setTurnMode("turn");

    const raw = scaleRaidForTier(await loadPurifyRaidConfig(), opts.tier);
    const cfg = opts.prepaid
      ? {
          ...raw,
          gun_ammo_max: Math.max(raw.gun_ammo_max, Math.ceil(raw.gun_ammo_max * 3)),
          gun_regen_on_teal: Math.max(raw.gun_regen_on_teal, raw.gun_regen_on_teal * 2),
        }
      : raw;
    const tables = await loadRaidTables();
    const hud = new PurifyRaidHud(this.layer);
    hud.attachAmmoEl(opts.fireEl ?? null);
    let raid!: PurifyRaid;
    const done = new Promise<{ won: boolean }>((resolve) => {
      raid = new PurifyRaid(
        this.stage,
        {
          onHud: (h) => {
            hud.apply(h);
            this.compass.setMarks(raid.blightBearings());
            opts.onHud?.(h);
          },
          onPhase: (phase) => {
            hud.showPhase(phase);
            if (phase === "won" || phase === "lost") {
              window.setTimeout(() => resolve({ won: phase === "won" }), 800);
            }
          },
        },
        cfg,
        {
          auto: true,
          tables,
          tier: opts.tier,
          learnedSkills: opts.learnedSkills ?? this.hooks.getLearnedSkills?.() ?? [],
          skillEffects: this.data.skillEffects,
        },
      );
    });
    raid.start();

    try {
      return await done;
    } finally {
      raid.setFiring(false);
      raid.dispose();
      hud.dispose();
      this.stage.setFrozen(false);
      this.stage.setTurnMode(this.cfg.turn_mode);
      this.stage.setOnTick((dt) => {
        this.residualHunt.tick(dt);
        this.syncHeadBox();
      });
      this.refreshCompassMarks();
    }
  }

  /**
   * 한 칸 정화 루프 — 원흉 대화 후 물질 제거.
   */
  async runSectorLoop(opts: SectorLoopHooks): Promise<{ won: boolean }> {
    this.hidePrompt();
    this.stage.setFrozen(true);
    this.sectorLoopLive = true;
    this.refreshNodes();
    this.setHeadStatus("상태", "찾는중");
    const loop = new SectorPurifyLoop(
      this.stage,
      {
        ...opts,
        onHud: (label) => {
          this.applyHudLabel(label);
          opts.onHud?.(label);
        },
        onBeat: (beat) => {
          if (beat === "mission") this.setHeadStatus("상태", "찾는중");
          else if (beat === "tint1" || beat === "tint2") this.setHeadStatus("상태", "정화중");
          else if (beat === "invade" || beat === "king") this.setHeadStatus("상태", "정화중");
          else if (beat === "aside") this.setHeadStatus("상태", "대화중");
          else if (beat === "arrive") this.setHeadStatus("상태", "도착");
          else if (beat === "done") this.setHeadStatus("상태", "완료");
          opts.onBeat?.(beat);
        },
        combatHudHost: document.getElementById("combatPurifyHudHost") ?? this.layer,
      },
      this.currentAreaId,
    );
    try {
      return await loop.run();
    } finally {
      this.sectorLoopLive = false;
      this.stage.setFrozen(false);
      this.stage.setTurnMode(this.cfg.turn_mode);
      this.stage.setOnTick((dt) => {
        this.residualHunt.tick(dt);
        this.syncHeadBox();
      });
      this.refreshNodes();
      this.setHeadStatus("상태", "탐색중");
    }
  }

  /**
   * 경쟁 미니게임 한 판을 **이 레이어 안에서** 연다.
   * 화면을 갈아치우지 않으므로 서 있던 자리가 계속 보인다 — 지시자 확정 사항.
   */
  async runArena(arena: ArenaDef): Promise<ArenaResult> {
    this.setFrozen(true);
    try {
      return await runArenaBout(this.layer, arena, {
        onMash: (hit) => this.hooks.onArenaMash?.(hit),
        pressHint: this.hooks.mashPressHint,
        untilHint: this.hooks.mashUntilHint,
      });
    } finally {
      this.hooks.onArenaMash?.(null);
      this.setFrozen(false);
      this.showPrompt(this.stage.getNearNode());
    }
  }

  /**
   * 시트가 없는 동작 — 머리 위에 `001 동작 필요`.
   * 그림이 들어오면 이 문구를 끈다.
   */
  setNeedAnim(code: string | null) {
    this.needCode = code;
    if (!code) {
      this.needEl.classList.remove("on");
      this.needEl.textContent = "";
      return;
    }
    this.needEl.textContent = `${code} 동작 필요`;
    this.needEl.classList.add("on");
    this.syncNeedAnim();
    this.kickNeedLoop();
  }

  private kickNeedLoop() {
    if (this.needRaf) return;
    const step = () => {
      this.needRaf = 0;
      if (!this.needCode) return;
      this.syncNeedAnim();
      this.needRaf = requestAnimationFrame(step);
    };
    this.needRaf = requestAnimationFrame(step);
  }

  private syncNeedAnim() {
    if (!this.needCode) return;
    const p = this.stage.playerHeadScreen();
    if (!p) {
      this.needEl.style.opacity = "0";
      return;
    }
    this.needEl.style.opacity = "1";
    this.needEl.style.left = `${p.x}px`;
    this.needEl.style.top = `${p.y}px`;
  }

  /**
   * 머리 위 상태 창. 모으기 창과 같은 껍데기.
   * 힌트(상태/선택) + 지금 하는 일 + 게이지.
   */
  setHeadStatus(hint: string, label: string): void {
    this.headHint = hint || "상태";
    this.headText = label || "탐색중";
    this.paintHead();
  }

  /** 갈림길·스킬에서 고른 것 */
  setHeadChoice(label: string): void {
    this.setHeadStatus("선택", label || "골랐다");
  }

  private paintHead(): void {
    if (this.headMash) return;
    const moving = this.stage.isMoving();
    const hint = moving ? "상태" : this.headHint;
    const label = moving ? "이동중" : this.headText;
    this.headNeed.textContent = hint;
    this.headLabelEl.textContent = label;
    this.headNeed.classList.toggle("choice", hint === "선택");
    this.headNeed.classList.toggle("mash-hint", false);
    if (!moving) {
      this.headFill.style.width = "0%";
      this.headPctEl.textContent = "0%";
    }
  }

  private kickHeadLoop(): void {
    if (this.headRaf) return;
    const step = () => {
      this.headRaf = 0;
      if (!this.on) return;
      this.syncHeadBox();
      this.headRaf = requestAnimationFrame(step);
    };
    this.headRaf = requestAnimationFrame(step);
  }

  private isHudLaidOut(): boolean {
    return !!document.getElementById("phoneRoot")?.classList.contains("hud-laid-out");
  }

  /** 파티 카드 바로 오른쪽 — 레이아웃 없을 때 폴백 */
  private partyStatusAnchor(): { x: number; y: number } | null {
    const party = document.getElementById("partyHud");
    if (!party) return null;
    const layerRect = this.layer.getBoundingClientRect();
    const pr = party.getBoundingClientRect();
    if (pr.width < 2 || pr.height < 2) return null;
    return {
      x: pr.right - layerRect.left + 10,
      y: pr.top - layerRect.top + Math.min(12, pr.height * 0.15),
    };
  }

  private syncHeadBox(): void {
    if (!this.on) return;
    this.headOverlay.style.display = this.headMash ? "" : "none";
    if (!this.headMash) this.paintHead();
    this.headBox.classList.toggle("mash", !!this.headMash);
    this.headOverlay.classList.toggle("mash", !!this.headMash);
    this.headBox.style.opacity = "1";
    // HUD 툴 레이아웃이 있으면 left/top 은 CSS가 맡김
    if (this.isHudLaidOut() && this.headBox.id === "actorStatusHud") {
      this.headBox.style.left = "";
      this.headBox.style.top = "";
      this.headBox.style.transform = "";
      return;
    }
    const dock = this.partyStatusAnchor();
    if (dock) {
      // 폴백: 레이어 기준 좌표 (박스만 레이어 안일 때)
      if (this.headBox.parentElement === this.headOverlay) {
        this.headBox.style.left = `${dock.x}px`;
        this.headBox.style.top = `${dock.y}px`;
        this.headBox.style.transform = "none";
      }
      return;
    }
    const p = this.stage.playerHeadScreen();
    if (!p) {
      this.headBox.style.opacity = "0";
      return;
    }
    if (this.headBox.parentElement === this.headOverlay) {
      this.headBox.style.left = `${p.x}px`;
      this.headBox.style.top = `${p.y}px`;
    }
  }

  private applyHudLabel(raw: string): void {
    const t = (raw || "").trim();
    if (!t) return;
    if (/갈림|고르/.test(t)) this.setHeadStatus("선택", "고르는중");
    else if (/줍기|모으|장전|거르기|퇴치제/.test(t)) this.setHeadStatus("상태", t.split("·")[0]!.trim() || "모으는중");
    else if (/얼룩|정화|장전|침입|원흉/.test(t)) this.setHeadStatus("상태", "정화중");
    else if (/찾/.test(t)) this.setHeadStatus("상태", "찾는중");
    else if (/도착/.test(t)) this.setHeadStatus("상태", "도착");
    else this.setHeadStatus("상태", t.length > 8 ? `${t.slice(0, 8)}…` : t);
  }

  async playPickupGather(opts: {
    label: string;
    lookXPct: number;
    lookYPct: number;
    seconds?: number;
    /** 연타/버튼마다 */
    onHit?: () => void;
  }): Promise<MashCollectResult> {
    this.hidePrompt();
    await this.walkToFillFront(opts.lookXPct, opts.lookYPct);
    const phone = document.getElementById("phoneRoot");
    phone?.classList.add("pickup-gauge-live");
    this.headMash = true;
    this.headNeed.classList.add("mash-hint");
    try {
      return await playPickupGauge({
        host: this.layer,
        label: opts.label,
        seconds: opts.seconds ?? 6.2,
        anchor: this.isHudLaidOut() && this.headBox.id === "actorStatusHud"
          ? undefined
          : () => this.partyStatusAnchor() ?? this.stage.playerHeadScreen(),
        onBindHit: (hit) => {
          if (!hit) {
            this.hooks.onArenaMash?.(null);
            return;
          }
          this.hooks.onArenaMash?.(() => {
            hit();
          }, opts.label);
        },
        onPress: () => opts.onHit?.(),
        reuse: {
          overlay: this.headOverlay,
          box: this.headBox,
          fill: this.headFill,
          pctEl: this.headPctEl,
          needEl: this.headNeed,
          labelEl: this.headLabelEl,
        },
      });
    } finally {
      this.headMash = false;
      this.headNeed.classList.remove("mash-hint");
      this.hooks.onArenaMash?.(null);
      phone?.classList.remove("pickup-gauge-live");
      this.setHeadStatus("상태", "탐색중");
    }
  }

  /** RPG 쪽지 — 떴다가 내려가며 사라질 때 획득으로 읽힌다 */
  async playFindLoot(opts: { title: string; sub: string; needCode?: string }): Promise<void> {
    if (opts.needCode) this.setNeedAnim(opts.needCode);
    this.lootEl.innerHTML = `<b>${escapeHtml(opts.title)}</b><span>${escapeHtml(opts.sub).replace(/\n/g, "<br>")}</span>`;
    this.lootEl.classList.remove("out");
    this.lootEl.classList.add("on");
    await waitMs(900);
    this.lootEl.classList.add("out");
    await waitMs(380);
    this.lootEl.classList.remove("on", "out");
    if (opts.needCode) this.setNeedAnim(null);
  }

  /**
   * 지역/생명 오염을 그 자리에서 녹인다. 습격 판을 열지 않는다.
   * 물체 게이지가 100→0으로 닳는 게 핵심이다.
   */
  async runPurifyMelt(opts: { xPct: number; yPct: number; label: string; seconds?: number }): Promise<void> {
    this.hidePrompt();
    await this.walkToFillFront(opts.xPct, opts.yPct);
    this.setNeedAnim(this.stage.hasAimSheet() ? null : "002");
    this.stage.setAiming(true);
    try {
      await playPurifyMelt({
        stage: this.stage,
        host: this.layer,
        xPct: opts.xPct,
        yPct: opts.yPct,
        label: opts.label,
        seconds: opts.seconds,
        /** 3D에서는 상황 문구를 필러에만 두고, 게이지만 짧게 쓴다 */
        hideChrome: true,
      });
    } finally {
      this.stage.setAiming(false);
      this.setNeedAnim(null);
    }
  }

  boostMoveSpeed(mul: number): void {
    this.stage.setMoveSpeed(4.6 * Math.max(0.5, mul));
  }

  setTimeScale(mul: number): void {
    this.stage.setTimeScale(mul);
  }

  getTimeScale(): number {
    return this.stage.getTimeScale();
  }

  dispose() {
    this.setNeedAnim(null);
    if (this.needRaf) cancelAnimationFrame(this.needRaf);
    this.residualHunt.dispose();
    this.resizeObs.disconnect();
    this.compass.dispose();
    this.stage.dispose();
    if (this.seamEl && this.seamHome) this.seamHome.appendChild(this.seamEl);
    this.seamEl = null;
    this.seamHome = null;
    this.layer.remove();
  }
}

function waitMs(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function clampPct(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
