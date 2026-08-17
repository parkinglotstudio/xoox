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
import type { AreaDef, AreaNpcDef, AreaPropDef, ArenaDef, GameData } from "../../types";
import { pillarForTrigger } from "../../explore";
import { runArenaBout, type ArenaResult } from "./ArenaBout";
import { bearingDeg, CompassHud } from "./CompassHud";
import { JourneyStage3D } from "./JourneyStage3D";
import { PurifyRaid, type RaidHud } from "./PurifyRaid";
import { PurifyRaidHud } from "./PurifyRaidHud";
import { playPickupGauge, playPurifyMelt } from "./PurifyMelt";
import { loadPurifyRaidConfig, scaleRaidForTier } from "./purifyRaidConfig";
import { loadRaidTables } from "./raidTables";
import { loadActorSprite } from "./spriteSheet";
import { scatterProps } from "./scatter";
import { spawnPctInArea } from "../spawnStart";
import { ResidualColorHunt } from "./ResidualColorHunt";
import {
  JOURNEY3D_DEFAULTS,
  loadJourney3DConfig,
  type Journey3DConfig,
} from "./journey3dConfig";
import type { Pillar, PropKind, ViewMode, WorldNode, WorldProp } from "./types";

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
  /** 정화된 구역인지 — 바닥 아트를 탑뷰와 같은 규칙으로 흑백/색 전환한다 */
  isAreaPurified: (areaId: string) => boolean;
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
  /** 구역 밖으로 나가려 할 때(경계 도달) — 아직은 알림만 */
  onEdge?: (area: AreaDef) => void;
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
  private on = false;
  /** 이번 접근에서 이미 자동으로 연 전투 노드 — 떠나기 전엔 다시 안 연다 */
  private visitArmedId: string | null = null;
  private markX = -999;
  private markY = -999;
  private needCode: string | null = null;
  private needRaf = 0;
  private needEl!: HTMLElement;
  private lootEl!: HTMLElement;
  /**
   * 카메라·안개·스케일 값. 기본값으로 시작해 저장된 JSON이 오면 갈아 끼운다.
   * 툴(/layout-editor.html 씬 journey3d · /fpv-tool.html)에서 조절해 저장한 값이다.
   */
  private cfg: Journey3DConfig = { ...JOURNEY3D_DEFAULTS };
  private residualHunt!: ResidualColorHunt;

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
    this.layer.append(this.canvas, this.prompt, this.needEl, this.lootEl);
    this.compass = new CompassHud(this.layer);
    host.appendChild(this.layer);

    this.stage = new JourneyStage3D(this.canvas, {
      worldM: this.cfg.world_m,
      fogVisionM: this.cfg.fog_vision_m,
      charHeightM: this.cfg.char_height_m,
      onMove: (x, y, yaw) => {
        this.compass.setYaw(yaw);
        if (Math.hypot(x - this.markX, y - this.markY) > 0.45) {
          this.markX = x;
          this.markY = y;
          this.refreshCompassMarks();
        }
        this.hooks.onMove?.(x, y, yaw);
        this.syncNeedAnim();
      },
      onNodeNear: (node) => this.showPrompt(node),
      onNodeActivate: () => void this.activateNear(),
      onTick: (dt) => this.residualHunt?.tick(dt),
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
    if (this.currentAreaId) {
      this.refreshNodes();
      this.scatterForArea(this.currentAreaId);
    }
  }

  private async loadSprite() {
    // 3인칭용 뒷모습 시트. 없으면 로비 정면 PNG로 폴백된다
    const sprite = await loadActorSprite("wanderer", "/ui/lobby/lobby_actor_idle.png");
    await this.stage.setPlayerSprite(sprite);
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
  }

  hide() {
    this.on = false;
    this.layer.classList.remove("on");
    this.stage.setInputEnabled(false);
    this.hidePrompt();
    this.setNeedAnim(null);
  }

  isOn() {
    return this.on;
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
      this.stage.setPlayer(opts?.xPct ?? spawn.xPct, opts?.yPct ?? spawn.yPct, 0);
    }
    this.fit();
  }

  /**
   * 9칸 타일 섬 바닥. 정화된 섹터는 본색, 나머지는 오염 틴트.
   */
  private async loadFloor(area: AreaDef) {
    const id = area.area_id;
    const purifiedIds = this.data.areas
      .filter((a) => this.hooks.isAreaPurified(a.area_id))
      .map((a) => a.area_id);
    try {
      await this.stage.setIslandFloor(id, { purifiedIds });
    } catch (err) {
      console.warn("[3d] 섬 바닥 로드 실패", id, err);
    }
    this.stage.setSkyPurified(this.hooks.isAreaPurified(id));
  }

  /** 정화로 아트가 바뀌었을 때 — 프롭은 다시 안 뿌림(기립 유지) */
  async refreshFloor() {
    const area = this.data.areas.find((a) => a.area_id === this.currentAreaId);
    if (area) await this.loadFloor(area);
  }

  /** 클리어·안개 상태가 바뀐 뒤 노드 표시를 다시 맞춘다 */
  refreshNodes() {
    const npcs = this.npcsOf(this.currentAreaId).filter(
      (n) => !(this.isGroundPickup(n) && this.hooks.isNodeCleared(n.npc_id)),
    );
    const nodes: WorldNode[] = npcs.map((n) => ({
      id: n.npc_id,
      icon: n.icon || "❔",
      label: n.label || "",
      xPct: n.x_pct,
      yPct: n.y_pct,
      pillar: pillarForTrigger(n.trigger_type) as Pillar,
      cleared: this.hooks.isNodeCleared(n.npc_id),
      hidden: this.isGroundPickup(n) ? false : !this.hooks.isNodeRevealed(n),
      pierceFog: this.isGroundPickup(n),
    }));
    this.stage.setNodes(nodes);
    this.refreshCompassMarks();
  }

  /** 배경 CSV + 크롭 + 스캐터. NPC 원과 겹치지 않음. */
  private scatterForArea(areaId: string) {
    const npcs = this.npcsOf(areaId);
    const avoid = npcs.map((n) => ({ xPct: n.x_pct, yPct: n.y_pct, rPct: 7 }));
    const fromCsv = (this.data.areaProps ?? [])
      .filter((p) => p.area_id === areaId)
      .filter((p) => !avoid.some((a) => Math.hypot(p.x_pct - a.xPct, p.y_pct - a.yPct) < a.rPct))
      .map((p) => csvPropToWorld(p));
    const bg = this.stage
      .backgroundStickers(areaId)
      .filter((p) => !avoid.some((a) => Math.hypot(p.xPct - a.xPct, p.yPct - a.yPct) < a.rPct))
      .map((p) => ({ ...p, collide: true as const }));
    const needScatter = Math.max(0, this.cfg.prop_density - fromCsv.length - Math.min(12, bg.length));
    const extra = scatterProps(areaId, needScatter, avoid);
    // CSV 집이 있으면 배경 크롭 집은 줄여 중복을 막는다
    const merged = fromCsv.length ? [...fromCsv, ...extra] : [...bg, ...fromCsv, ...extra];
    this.stage.setProps(merged);
    const colored = merged
      .filter((p) => p.purifyTarget && this.hooks.isPropPurified?.(p.id))
      .map((p) => p.id);
    this.stage.syncResidualState(colored);
    if (this.hooks.isAreaPurified(areaId)) {
      this.stage.setPropsKeepStanding(true);
      void this.stage.playPurifyStandWave({ radiusM: 80, durationMs: 1, skipFloorWave: true });
      if (this.residualLeft() > 0) {
        void this.residualHunt.ensureReady().then(() => this.residualHunt.start());
      }
    } else {
      this.stage.setPropsKeepStanding(false);
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
    const others = this.data.areas
      .filter((a) => a.area_id !== this.currentAreaId && this.hooks.isAreaPurified(a.area_id))
      .map((a) => a.area_id);
    await this.stage.setIslandFloor(this.currentAreaId, { purifiedIds: others });
    this.stage.setSkyPurified(false);
    await this.stage.playPurifyStandWave({
      xPct,
      yPct,
      radiusM: 50,
      durationMs: 2600,
    });
    await this.refreshFloor();
    if (this.residualLeft() > 0) {
      await this.residualHunt.ensureReady();
      this.residualHunt.start();
    }
  }

  /** 안개만 갱신 — 걸을 때마다 노드를 다시 만들면 텍스처를 매번 다시 굽는다 */
  refreshFogVisibility() {
    for (const n of this.npcsOf(this.currentAreaId)) {
      this.stage.setNodeHidden(n.npc_id, this.isGroundPickup(n) ? false : !this.hooks.isNodeRevealed(n));
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

  /** 드러난 노드 + 이벤트 정화제를 방위 띠 위에 올린다 */
  private refreshCompassMarks() {
    const me = this.stage.getPlayer();
    const marks = this.npcsOf(this.currentAreaId)
      .filter((n) => !this.hooks.isNodeCleared(n.npc_id) && (this.isGroundPickup(n) || this.hooks.isNodeRevealed(n)))
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
   * 정화제 쪽으로 다가가 바라본다.
   * 고정 남쪽이 아니라 **지금 선 쪽에서** 한 걸음 앞에 선다 — 우회·카메라 끊김을 줄인다.
   */
  async walkToFillFront(xPct: number, yPct: number): Promise<void> {
    const me = this.stage.getPlayer();
    const dx = me.xPct - xPct;
    const dy = me.yPct - yPct;
    const dist = Math.hypot(dx, dy) || 1;
    const stand = 4.5;
    if (dist >= 2.8 && dist <= 7.5) {
      this.stage.setYaw(bearingDeg(me.xPct, me.yPct, xPct, yPct));
      return;
    }
    let ax: number;
    let ay: number;
    if (dist < 2.8) {
      // 너무 붙었으면 살짝 뒤로 (플레이어→오브 반대, 없으면 남쪽)
      const bx = dist > 0.15 ? dx / dist : 0;
      const by = dist > 0.15 ? dy / dist : 1;
      ax = xPct + bx * stand;
      ay = yPct + by * stand;
    } else {
      ax = xPct + (dx / dist) * stand;
      ay = yPct + (dy / dist) * stand;
    }
    ax = Math.max(2, Math.min(98, ax));
    ay = Math.max(2, Math.min(98, ay));
    await this.walkTo(ax, ay);
    const after = this.stage.getPlayer();
    this.stage.setYaw(bearingDeg(after.xPct, after.yPct, xPct, yPct));
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
    if (npc && this.isGroundPickup(npc)) {
      this.hidePrompt();
      return;
    }
    if (npc && this.willAutoStart(npc)) {
      this.hidePrompt();
      if (this.visitArmedId === npc.npc_id) return;
      this.visitArmedId = npc.npc_id;
      void this.activateNear();
      return;
    }
    this.prompt.textContent = `${node.icon} ${node.label} 확인`;
    this.prompt.classList.add("on");
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
        if (this.isGroundPickup(npc)) this.stage.removeNode(npc.npc_id);
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

  /** 다가가면 「확인」 없이 바로 실행 — 전투 습격 + 겨루기. 정화제는 하단 줍기 */
  private willAutoStart(npc: AreaNpcDef): boolean {
    if (this.stage.isAutoWalking()) return false;
    if (npc.trigger_type === "ARENA") return true;
    return this.willRunRaid(npc);
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
      this.stage.setOnTick((dt) => this.residualHunt.tick(dt));
      this.refreshCompassMarks();
    }
  }

  /**
   * 경쟁 미니게임 한 판을 **이 레이어 안에서** 연다.
   * 화면을 갈아치우지 않으므로 서 있던 자리가 계속 보인다 — 지시자 확정 사항.
   */
  async runArena(arena: ArenaDef): Promise<ArenaResult> {
    this.setFrozen(true);
    try {
      return await runArenaBout(this.layer, arena);
    } finally {
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
   * 줍기 게이지 — 정화제를 앞에 두고 바라본 뒤, 머리 위에 작게 표시.
   * 그동안 상단 HP 칩은 숨긴다.
   */
  async playPickupGather(opts: {
    label: string;
    lookXPct: number;
    lookYPct: number;
    seconds?: number;
  }): Promise<void> {
    this.hidePrompt();
    const me = this.stage.getPlayer();
    const dist = Math.hypot(me.xPct - opts.lookXPct, me.yPct - opts.lookYPct);
    if (dist > 7.5) {
      await this.walkToFillFront(opts.lookXPct, opts.lookYPct);
    } else {
      this.stage.setYaw(bearingDeg(me.xPct, me.yPct, opts.lookXPct, opts.lookYPct));
    }
    const phone = document.getElementById("phoneRoot");
    phone?.classList.add("pickup-gauge-live");
    try {
      await playPickupGauge({
        host: this.layer,
        label: opts.label,
        seconds: opts.seconds ?? 3,
        anchor: () => this.stage.playerHeadScreen(),
      });
    } finally {
      phone?.classList.remove("pickup-gauge-live");
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
    const me = this.stage.getPlayer();
    this.stage.setYaw(bearingDeg(me.xPct, me.yPct, opts.xPct, opts.yPct));
    this.setNeedAnim("002");
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
      this.setNeedAnim(null);
    }
  }

  dispose() {
    this.setNeedAnim(null);
    if (this.needRaf) cancelAnimationFrame(this.needRaf);
    this.residualHunt.dispose();
    this.resizeObs.disconnect();
    this.compass.dispose();
    this.stage.dispose();
    this.layer.remove();
  }
}

function waitMs(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function csvPropToWorld(p: AreaPropDef): WorldProp {
  const kinds = new Set([
    "building",
    "tower",
    "fence",
    "sign",
    "crate",
    "barrel",
    "pole",
    "tree",
    "bush",
    "debris",
  ]);
  const kind = (kinds.has(p.kind) ? p.kind : "crate") as PropKind;
  const art = p.art?.trim()
    ? p.art.startsWith("/")
      ? p.art
      : `/art/props/sticker/${p.art}`
    : undefined;
  return {
    id: p.prop_id,
    xPct: p.x_pct,
    yPct: p.y_pct,
    kind,
    yawDeg: p.yaw_deg,
    hM: p.h_m > 0 ? p.h_m : undefined,
    collide: p.collide,
    purifyTarget: p.purify_target,
    lifeBlightId: p.life_blight_id || undefined,
    art,
    aspect: art?.includes("life_mecha_dog") ? 985 / 900 : undefined,
  };
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
