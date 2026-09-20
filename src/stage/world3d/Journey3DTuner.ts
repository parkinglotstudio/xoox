/**
 * 3D 여정 뷰 튜너 — 미리보기 + 다이얼 패널 한 벌.
 *
 * 레이아웃 에디터와 fpv-tool이 **같은 모듈을 마운트한다.**
 * 슬라이더를 두 곳에 각각 두면 반드시 어긋나므로, 컨트롤 정의를 한 군데로 모았다.
 *
 * 조절 → 즉시 미리보기 반영 → 저장하면 data/ui/layout/journey3d_layout.json에 남고
 * 본편(Journey3DView)이 그 파일을 읽는다.
 */
import { loadCsv, type Row } from "../../csv";
import { pillarForTrigger } from "../../explore";
import { JourneyStage3D } from "./JourneyStage3D";
import { spawnPctInArea } from "../spawnStart";
import { loadActorSprite } from "./spriteSheet";
import {
  JOURNEY3D_DEFAULTS,
  loadJourney3DConfig,
  saveJourney3DConfig,
  type Journey3DConfig,
} from "./journey3dConfig";
import { loadPurifyRaidConfig } from "./purifyRaidConfig";
import { csvRowToWorldProp } from "./propFromCsv";
import type { Pillar, WorldNode } from "./types";

interface SectorScale {
  sectors?: Record<string, { label?: string; map?: string; map_before?: string }>;
}

/** 하나의 다이얼 정의 — 컨트롤 목록이 곧 편집 가능한 값의 목록이다 */
type Dial =
  | {
      kind: "range";
      key: NumericKey;
      label: string;
      min: number;
      max: number;
      step: number;
      digits: number;
      group: string;
    }
  | { kind: "color"; key: "fog_color"; label: string; group: string }
  | {
      kind: "select";
      key: "turn_mode" | "view_mode";
      label: string;
      options: { value: string; label: string }[];
      group: string;
    };

/** 숫자 필드만 골라낸다 — `-?`로 옵셔널(note)이 undefined로 섞이는 걸 막는다 */
type NumericKey = {
  [K in keyof Journey3DConfig]-?: Journey3DConfig[K] extends number ? K : never;
}[keyof Journey3DConfig];

const DIALS: Dial[] = [
  // 시점 — 참고 이미지의 어깨너머 구도를 만드는 값들
  {
    kind: "select",
    key: "view_mode",
    label: "기본 시점",
    group: "시점",
    options: [
      { value: "tps", label: "3인칭 배후" },
      { value: "fps", label: "1인칭" },
    ],
  },
  {
    kind: "select",
    key: "turn_mode",
    label: "좌우 키",
    group: "시점",
    options: [
      { value: "strafe", label: "A/D 게걸음 (←/→ 회전)" },
      { value: "turn", label: "A/D 회전 (Shift+ 게걸음)" },
    ],
  },
  { kind: "range", key: "tps_distance_mul", label: "카메라 거리(키 배수)", min: 0.6, max: 8, step: 0.05, digits: 2, group: "시점" },
  { kind: "range", key: "tps_height_mul", label: "카메라 높이(키 배수)", min: 0.3, max: 6, step: 0.05, digits: 2, group: "시점" },
  { kind: "range", key: "tps_look_ahead_mul", label: "앞을 보는 정도", min: 0, max: 10, step: 0.1, digits: 1, group: "시점" },
  { kind: "range", key: "fov_deg", label: "시야각", min: 45, max: 110, step: 1, digits: 0, group: "시점" },

  { kind: "range", key: "world_m", label: "섹터 한 변(m)", min: 25, max: 360, step: 5, digits: 0, group: "월드 스케일" },
  { kind: "range", key: "char_height_m", label: "캐릭터 키(m)", min: 0.6, max: 3, step: 0.05, digits: 2, group: "월드 스케일" },
  { kind: "range", key: "detail_tile_m", label: "지면 타일(m)", min: 0.5, max: 12, step: 0.25, digits: 2, group: "월드 스케일" },
  { kind: "range", key: "detail_strength", label: "지면 질감", min: 0, max: 1, step: 0.05, digits: 2, group: "월드 스케일" },

  { kind: "range", key: "move_speed_mps", label: "이동 속도(m/s)", min: 1, max: 16, step: 0.2, digits: 1, group: "이동" },
  { kind: "range", key: "turn_speed_deg", label: "회전 속도(°/s)", min: 30, max: 300, step: 5, digits: 0, group: "이동" },
  { kind: "range", key: "bob_amp_m", label: "걷기 흔들림(m)", min: 0, max: 0.3, step: 0.005, digits: 3, group: "이동" },
  { kind: "range", key: "bob_hz", label: "흔들림 빠르기(Hz)", min: 0.5, max: 4, step: 0.1, digits: 1, group: "이동" },

  { kind: "range", key: "fog_vision_m", label: "시야 거리(m)", min: 3, max: 80, step: 1, digits: 0, group: "안개" },
  { kind: "range", key: "fog_far_mul", label: "닫히는 배수", min: 1, max: 10, step: 0.1, digits: 1, group: "안개" },
  { kind: "color", key: "fog_color", label: "안개·하늘 색", group: "안개" },

  { kind: "range", key: "resolution_scale", label: "해상도 배율", min: 0.15, max: 1, step: 0.05, digits: 2, group: "연출" },
  { kind: "range", key: "node_height_mul", label: "노드 크기(키 배수)", min: 0.3, max: 3, step: 0.05, digits: 2, group: "연출" },
  { kind: "range", key: "approach_radius_m", label: "노드 접근 반경(m)", min: 1, max: 14, step: 0.2, digits: 1, group: "연출" },
  { kind: "range", key: "prop_density", label: "구조물 밀도", min: 0, max: 300, step: 4, digits: 0, group: "연출" },
];

export interface Journey3DTunerOptions {
  /** 상태 문구를 툴 상단 바에 흘려보낸다 */
  onStatus?: (text: string, kind?: "" | "ok" | "err") => void;
  /** 값이 바뀌었을 때 — 툴이 dirty 표시를 붙일 수 있게 */
  onDirty?: () => void;
  /** 걸을 때마다 — 툴이 좌표를 표시하거나 미니맵을 붙일 수 있게 */
  onMove?: (xPct: number, yPct: number, yawDeg: number) => void;
  onNodeNear?: (node: WorldNode | null) => void;
  onNodeActivate?: (node: WorldNode) => void;
  /** 섹터를 갈아 끼운 뒤 — 미니맵 배경 등을 다시 그릴 자리 */
  onSectorApplied?: (areaId: string, floorUrl: string, nodes: WorldNode[]) => void;
}

export class Journey3DTuner {
  private stage: JourneyStage3D;
  private cfg: Journey3DConfig = { ...JOURNEY3D_DEFAULTS };
  private scale: SectorScale = {};
  private npcRows: Row[] = [];
  private propRows: Row[] = [];
  private areaRows: Row[] = [];
  private areaId = "area_i21";
  private useAfterArt = false;
  private ready = false;
  private stepPurifyBusy = false;
  private stepPurifyDone = new Set<string>();

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly panelHost: HTMLElement,
    private readonly opts: Journey3DTunerOptions = {},
  ) {
    this.stage = new JourneyStage3D(canvas, {
      onMove: (x, y, yaw) => this.opts.onMove?.(x, y, yaw),
      onNodeNear: (n) => {
        this.opts.onNodeNear?.(n);
        void this.tryStepPurify(n);
      },
      onNodeActivate: (n) => this.opts.onNodeActivate?.(n),
      onViewModeChange: () => {
        this.cfg.view_mode = this.stage.getViewMode();
        this.syncPanel();
      },
    });
    this.stage.setInputEnabled(true);
  }

  getStage(): JourneyStage3D {
    return this.stage;
  }

  /** 데이터·설정을 읽고 첫 구역을 세운다 */
  async init(): Promise<void> {
    const [cfg, scale, npcRows, propRows, areaRows, raid] = await Promise.all([
      loadJourney3DConfig(),
      this.loadScale(),
      loadCsv("area_npc_config"),
      loadCsv("area_prop_config"),
      loadCsv("area_config"),
      loadPurifyRaidConfig().catch(() => null),
    ]);
    this.cfg = cfg;
    this.scale = scale;
    this.npcRows = npcRows;
    this.propRows = propRows;
    this.areaRows = areaRows;

    this.stage.applyConfig(this.cfg);
    if (raid) this.stage.applyStoneThrowConfig(raid);
    const sprite = await loadActorSprite("wanderer", "/ui/lobby/lobby_actor_idle.png");
    await this.stage.setPlayerSprite(sprite);

    this.renderPanel();
    this.ready = true;
    await this.applySector(this.areaId);
    this.resize();
  }

  private async loadScale(): Promise<SectorScale> {
    try {
      const res = await fetch(`/ui/layout/sector_scale.json?t=${Date.now()}`);
      return res.ok ? ((await res.json()) as SectorScale) : {};
    } catch {
      return {};
    }
  }

  // ── 구역 ──────────────────────────────────────────────────────

  sectorIds(): string[] {
    const fromCsv = this.areaRows
      .filter((r) => this.scale.sectors?.[r.area_id])
      .map((r) => r.area_id);
    return fromCsv.length ? fromCsv : Object.keys(this.scale.sectors ?? { area_i21: {} });
  }

  sectorLabel(id: string): string {
    return this.scale.sectors?.[id]?.label ?? id;
  }

  currentSector(): string {
    return this.areaId;
  }

  setArtVariant(after: boolean): void {
    this.useAfterArt = after;
    void this.applySector(this.areaId);
  }

  /** 지금 바닥에 깔린 아트 주소 — 미니맵 배경으로 쓰라고 내준다 */
  floorUrl(): string {
    const s = this.scale.sectors?.[this.areaId];
    const url = this.useAfterArt ? (s?.map ?? s?.map_before) : (s?.map_before ?? s?.map);
    return url ?? `/ui/journey/sector_${this.areaId.replace("area_", "")}_before.png`;
  }

  nodes(): WorldNode[] {
    return this.nodesOf(this.areaId);
  }

  async applySector(areaId: string): Promise<void> {
    this.areaId = areaId;
    const url = this.floorUrl();
    const nodes = this.nodesOf(areaId);
    const spawn = this.spawnOf(areaId);
    const at = this.stage.pctToWorld(spawn.xPct, spawn.yPct);
    const foci = this.useAfterArt
      ? [{ x: at.x, z: at.z, r: this.stage.getWorldScale() * 0.34 }]
      : [];
    try {
      await this.stage.setFloor(url, { polluted: true, foci });
    } catch (err) {
      console.warn("setFloor", err);
      this.status(`바닥 아트 로드 실패: ${err instanceof Error ? err.message : url}`, "err");
    }
    this.stage.setNodes(nodes);
    this.stage.setNodeHeightMul(this.cfg.node_height_mul);
    this.stage.setPlayer(spawn.xPct, spawn.yPct, 0);
    this.stage.syncSkyFromFoci(true);
    const propN = this.propRows.filter((r) => r.area_id === areaId).length;
    try {
      this.refreshProps();
      await this.stage.waitPropsReady();
      this.status(
        `${this.sectorLabel(areaId)} · spawn ${spawn.xPct.toFixed(1)},${spawn.yPct.toFixed(1)} · 프롭 ${propN}개`,
        "ok",
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.status(`프롭 로드 실패: ${msg}`, "err");
    }
    this.opts.onSectorApplied?.(areaId, url, nodes);
  }

  private nodesOf(areaId: string): WorldNode[] {
    return this.npcRows
      .filter((r) => r.area_id === areaId && (r.appear_condition || "ALWAYS") === "ALWAYS")
      .filter(
        (r) =>
          !((r.trigger_type || "").toUpperCase() === "PURIFY" && (this.stepPurifyDone.has(r.npc_id) || this.useAfterArt)),
      )
      .map((r) => ({
        id: r.npc_id,
        icon: r.icon || "❔",
        label: r.label || "",
        xPct: Number(r.x_pct) || 50,
        yPct: Number(r.y_pct) || 60,
        pillar: pillarForTrigger(r.trigger_type || "") as Pillar,
        noMarker: true,
      }));
  }

  private async tryStepPurify(node: WorldNode | null): Promise<void> {
    if (!node || this.stepPurifyBusy || this.stepPurifyDone.has(node.id) || this.useAfterArt) return;
    const row = this.npcRows.find((r) => r.npc_id === node.id);
    if ((row?.trigger_type || "").toUpperCase() !== "PURIFY") return;
    this.stepPurifyBusy = true;
    this.stage.setFrozen(true);
    try {
      this.stage.stampPurifyDiskPct(node.xPct, node.yPct);
      const at = this.stage.pctToWorld(node.xPct, node.yPct);
      const r = this.stage.getWorldScale() * 0.34;
      await this.stage.playPurifyStandWave({
        xPct: node.xPct,
        yPct: node.yPct,
        radiusM: r,
        durationMs: 2600,
        skyWave: true,
        holdWave: true,
      });
      this.stepPurifyDone.add(node.id);
      this.useAfterArt = true;
      const me = this.stage.getPlayer();
      await this.stage.setFloor(this.floorUrl(), { polluted: true, foci: [{ x: at.x, z: at.z, r }] });
      this.stage.clearPurifyWaves();
      this.stage.removeNode(node.id);
      this.stage.setPlayer(me.xPct, me.yPct, me.yawDeg);
      this.stage.syncSkyFromFoci(true);
      this.status("정화 발판 · 들판이 되살아났다", "ok");
    } finally {
      this.stepPurifyBusy = false;
      this.stage.setFrozen(false);
    }
  }

  private refreshProps(): void {
    const props = this.propRows
      .filter((r) => r.area_id === this.areaId)
      .map((r) => csvRowToWorldProp(r));
    this.stage.setProps(props);
  }

  // ── 패널 ──────────────────────────────────────────────────────

  private renderPanel(): void {
    const groups = [...new Set(DIALS.map((d) => d.group))];
    this.panelHost.innerHTML = groups
      .map((g) => {
        const rows = DIALS.filter((d) => d.group === g).map((d) => this.dialHtml(d)).join("");
        return `<h2>${g}</h2>${rows}`;
      })
      .join("");

    for (const d of DIALS) {
      const el = this.panelHost.querySelector<HTMLInputElement | HTMLSelectElement>(
        `[data-key="${d.key}"]`,
      );
      if (!el) continue;
      el.addEventListener("input", () => this.readDial(d, el));
      el.addEventListener("change", () => this.readDial(d, el));
    }
  }

  private dialHtml(d: Dial): string {
    const id = `j3d_${d.key}`;
    if (d.kind === "select") {
      const opts = d.options
        .map(
          (o) =>
            `<option value="${o.value}"${this.cfg[d.key] === o.value ? " selected" : ""}>${o.label}</option>`,
        )
        .join("");
      return `<div class="j3d-row">
        <label for="${id}">${d.label}</label>
        <select id="${id}" data-key="${d.key}">${opts}</select>
      </div>`;
    }
    if (d.kind === "color") {
      return `<div class="j3d-row">
        <label for="${id}">${d.label}</label>
        <input id="${id}" type="color" data-key="${d.key}" value="${this.cfg.fog_color}" />
      </div>`;
    }
    const v = this.cfg[d.key];
    return `<div class="j3d-row">
      <label for="${id}">${d.label} <b data-out="${d.key}">${v.toFixed(d.digits)}</b></label>
      <input id="${id}" type="range" data-key="${d.key}"
             min="${d.min}" max="${d.max}" step="${d.step}" value="${v}" />
    </div>`;
  }

  private readDial(d: Dial, el: HTMLInputElement | HTMLSelectElement): void {
    if (d.kind === "range") {
      const v = Number(el.value);
      (this.cfg[d.key] as number) = v;
      const out = this.panelHost.querySelector<HTMLElement>(`[data-out="${d.key}"]`);
      if (out) out.textContent = v.toFixed(d.digits);
    } else if (d.kind === "color") {
      this.cfg.fog_color = el.value;
    } else {
      (this.cfg[d.key] as string) = el.value;
    }
    this.stage.applyConfig(this.cfg);
    // 구조물 개수는 다시 뿌려야 반영된다 (나머지는 applyConfig가 즉시 처리)
    if (d.kind === "range" && d.key === "prop_density") this.refreshProps();
    this.opts.onDirty?.();
  }

  private syncPanel(): void {
    for (const d of DIALS) {
      const el = this.panelHost.querySelector<HTMLInputElement | HTMLSelectElement>(
        `[data-key="${d.key}"]`,
      );
      if (!el) continue;
      if (d.kind === "range") {
        el.value = String(this.cfg[d.key]);
        const out = this.panelHost.querySelector<HTMLElement>(`[data-out="${d.key}"]`);
        if (out) out.textContent = (this.cfg[d.key] as number).toFixed(d.digits);
      } else if (d.kind === "color") {
        el.value = this.cfg.fog_color;
      } else {
        el.value = String(this.cfg[d.key]);
      }
    }
  }

  // ── 저장 · 되돌리기 ────────────────────────────────────────────

  async save(): Promise<boolean> {
    const res = await saveJourney3DConfig(this.cfg);
    this.status(res.message, res.ok ? "ok" : "err");
    return res.ok;
  }

  async reload(): Promise<void> {
    this.cfg = await loadJourney3DConfig();
    this.stage.applyConfig(this.cfg);
    this.syncPanel();
    this.refreshProps();
    this.status("저장된 값으로 되돌림", "ok");
  }

  resetToDefaults(): void {
    this.cfg = { ...JOURNEY3D_DEFAULTS };
    this.stage.applyConfig(this.cfg);
    this.syncPanel();
    this.refreshProps();
    this.status("기본값 · 저장하지 않으면 반영되지 않는다");
    this.opts.onDirty?.();
  }

  config(): Journey3DConfig {
    return { ...this.cfg };
  }

  // ── 기타 ──────────────────────────────────────────────────────

  toggleViewMode(): void {
    this.stage.toggleViewMode();
    this.cfg.view_mode = this.stage.getViewMode();
    this.syncPanel();
  }

  resetPlayer(): void {
    const spawn = this.spawnOf(this.areaId);
    this.stage.setPlayer(spawn.xPct, spawn.yPct, 0);
  }

  private spawnOf(areaId: string) {
    return spawnPctInArea(
      this.npcRows.map((r) => ({
        npc_id: r.npc_id || "",
        area_id: r.area_id || "",
        x_pct: Number(r.x_pct) || 50,
        y_pct: Number(r.y_pct) || 88,
        trigger_type: r.trigger_type || "",
      })),
      areaId,
    );
  }

  /** 안개 시야를 미니맵에 같은 비율로 그리기 위한 값 */
  visionPct(): number {
    return (this.cfg.fog_vision_m / this.cfg.world_m) * 100;
  }

  getPlayer() {
    return this.stage.getPlayer();
  }

  resize(): void {
    const r = this.canvas.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) {
      this.stage.resize(Math.round(r.width), Math.round(r.height));
    }
  }

  setInputEnabled(on: boolean): void {
    this.stage.setInputEnabled(on);
  }

  isReady(): boolean {
    return this.ready;
  }

  dispose(): void {
    this.stage.dispose();
    this.panelHost.innerHTML = "";
  }

  private status(text: string, kind: "" | "ok" | "err" = ""): void {
    this.opts.onStatus?.(text, kind);
  }
}
