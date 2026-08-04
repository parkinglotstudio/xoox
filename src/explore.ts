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
import type { GameData, AreaDef, AreaNpcDef } from "./types";

export interface ExploreHooks {
  log: (body: string) => void;
  onAreaChange?: (area: AreaDef) => void;
}

/** 걷는 속도(px/초) — 이동 거리에 비례해 소요시간을 정한다 */
const WALK_SPEED_PX_PER_SEC = 150;
const WALK_MIN_MS = 260;
const WALK_MAX_MS = 2000;
const FADE_MS = 320;
/** 카메라가 배우를 화면 세로 어디에 두는지(0=위, 1=아래) */
const CAM_ANCHOR = 0.66;

export class ExploreView {
  private data: GameData;
  private hooks: ExploreHooks;
  private root: HTMLElement;

  private layer!: HTMLElement;
  private camera!: HTMLElement;
  private world!: HTMLElement;
  private propLayer!: HTMLElement;
  private actor!: HTMLElement;
  private actorInner!: HTMLElement;
  private fade!: HTMLElement;
  private nameTag!: HTMLElement;

  private currentAreaId = "";
  private xPct = 50;
  private yPct = 88;
  private worldHPct = 240;
  private facing: 1 | -1 = 1;
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

  constructor(root: HTMLElement, data: GameData, hooks: ExploreHooks) {
    this.root = root;
    this.data = data;
    this.hooks = hooks;
    this.build();
  }

  // ── DOM ───────────────────────────────────────────────────────────────
  private build() {
    const layer = document.createElement("div");
    layer.className = "explore-layer";
    layer.innerHTML = `
      <div class="explore-camera">
        <div class="explore-world">
          <div class="explore-path"></div>
          <div class="explore-props"></div>
          <div class="explore-actor"><div class="explore-actor-inner"></div></div>
        </div>
      </div>
      <div class="explore-name"></div>
      <div class="explore-fade"></div>
    `;
    this.root.appendChild(layer);

    this.layer = layer;
    this.camera = layer.querySelector(".explore-camera")!;
    this.world = layer.querySelector(".explore-world")!;
    this.propLayer = layer.querySelector(".explore-props")!;
    this.actor = layer.querySelector(".explore-actor")!;
    this.actorInner = layer.querySelector(".explore-actor-inner")!;
    this.nameTag = layer.querySelector(".explore-name")!;
    this.fade = layer.querySelector(".explore-fade")!;

    // 월드를 탭하면 그 지점으로 걸어간다
    this.world.addEventListener("click", (e) => {
      const wr = this.world.getBoundingClientRect();
      const x = ((e.clientX - wr.left) / wr.width) * 100;
      const y = ((e.clientY - wr.top) / wr.height) * 100;
      void this.walkTo(x, y);
    });
  }

  // ── 지역 진입 ─────────────────────────────────────────────────────────
  enter(areaId: string, opts?: { fromEdge?: "TOP" | "BOTTOM"; silent?: boolean }) {
    const area = this.data.areas.find((a) => a.area_id === areaId);
    if (!area) {
      console.warn("[explore] 알 수 없는 지역:", areaId);
      return;
    }
    this.currentAreaId = areaId;
    this.worldHPct = area.world_h_pct;

    this.world.style.height = `${area.world_h_pct}%`;
    if (area.background_asset) {
      this.world.style.background = `center/cover no-repeat url("${area.background_asset}")`;
    } else {
      this.world.style.background = `linear-gradient(180deg, ${area.ground_top} 0%, ${area.ground_bottom} 100%)`;
    }
    const path = this.world.querySelector<HTMLElement>(".explore-path")!;
    path.style.background = `linear-gradient(90deg, transparent 0%, ${area.path_color} 18%, ${area.path_color} 82%, transparent 100%)`;

    this.nameTag.textContent = area.display_name;
    this.nameTag.classList.remove("show");
    void this.nameTag.offsetWidth;
    this.nameTag.classList.add("show");

    this.renderProps(area);

    // 위에서 내려왔으면 월드 위쪽에서, 아니면 아래쪽에서 시작
    this.xPct = 50;
    this.yPct = opts?.fromEdge === "TOP" ? 10 : 88;
    this.applyActor(false);
    this.applyCamera(false);

    if (!opts?.silent) this.hooks.onAreaChange?.(area);
  }

  private renderProps(area: AreaDef) {
    this.propLayer.innerHTML = "";

    for (const npc of this.data.areaNpcs.filter((n) => n.area_id === area.area_id)) {
      if (npc.appear_condition !== "ALWAYS") continue;
      const el = document.createElement("button");
      el.type = "button";
      el.className = "explore-poi";
      el.style.left = `${npc.x_pct}%`;
      el.style.top = `${npc.y_pct}%`;
      el.dataset.npc = npc.npc_id;
      el.innerHTML = `<span class="explore-poi-icon">${npc.icon}</span><span class="explore-poi-label">${npc.label}</span>`;
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        void this.approach(npc);
      });
      this.propLayer.appendChild(el);
    }

    for (const conn of this.exitsOf(area.area_id)) {
      const el = document.createElement("button");
      el.type = "button";
      el.className = `explore-exit ${conn.side === "TOP" ? "top" : "bottom"}`;
      const target = this.data.areas.find((a) => a.area_id === conn.to);
      el.innerHTML = `<span class="explore-exit-arrow">${conn.side === "TOP" ? "▲" : "▼"}</span><span class="explore-exit-label">${target?.display_name ?? conn.to}</span>`;
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        void this.travel(conn.to, conn.side);
      });
      this.propLayer.appendChild(el);
    }
  }

  /** 이 지역에서 나갈 수 있는 통로 (bidirectional이면 역방향은 반대쪽 끝) */
  private exitsOf(areaId: string): { to: string; side: "TOP" | "BOTTOM" }[] {
    const out: { to: string; side: "TOP" | "BOTTOM" }[] = [];
    for (const c of this.data.areaConnections) {
      if (c.unlock_condition) continue;
      if (c.from_area_id === areaId) {
        out.push({ to: c.to_area_id, side: c.exit_point });
      } else if (c.bidirectional && c.to_area_id === areaId) {
        out.push({ to: c.from_area_id, side: c.exit_point === "TOP" ? "BOTTOM" : "TOP" });
      }
    }
    return out;
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
        window.setTimeout(() => this.actor.classList.remove("turning"), 180);
      }
    }

    const wr = this.world.getBoundingClientRect();
    const distPx = Math.hypot((dx / 100) * wr.width, (dy / 100) * wr.height);
    const ms =
      opts?.durationMs ??
      Math.round(clamp((distPx / WALK_SPEED_PX_PER_SEC) * 1000, WALK_MIN_MS, WALK_MAX_MS));

    this.xPct = nx;
    this.yPct = ny;
    this.actor.classList.add("walking");
    this.actor.style.transitionDuration = `${ms}ms`;
    this.camera.style.transitionDuration = `${ms}ms`;
    this.applyActor(true);
    this.applyCamera(true);

    return new Promise((resolve) => {
      this.cancelPendingWalk(); // 이전 걷기를 정리(Promise도 반드시 해제)
      this.walkResolve = resolve;
      this.walkTimer = window.setTimeout(() => {
        this.walkTimer = null;
        this.walkResolve = null;
        this.actor.classList.remove("walking");
        this.actorInner.classList.add("landing");
        window.setTimeout(() => this.actorInner.classList.remove("landing"), 260);
        resolve();
      }, ms);
    });
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
    if (!animated) this.actor.style.transitionDuration = "0ms";
    this.actor.style.left = `${this.xPct}%`;
    this.actor.style.top = `${this.yPct}%`;
    this.actor.style.setProperty("--facing", String(this.facing));
    // 위로 갈수록(멀어질수록) 아주 살짝 작게 — 얕은 원근
    const scale = 0.88 + (this.yPct / 100) * 0.2;
    this.actor.style.setProperty("--depth-scale", scale.toFixed(3));
  }

  /** 배우가 화면 CAM_ANCHOR 위치에 오도록 월드를 세로 이동 */
  private applyCamera(animated: boolean) {
    if (!animated) this.camera.style.transitionDuration = "0ms";
    const viewH = this.layer.getBoundingClientRect().height || 300;
    const worldH = viewH * (this.worldHPct / 100);
    const actorY = (this.yPct / 100) * worldH;
    const offset = clamp(actorY - viewH * CAM_ANCHOR, 0, Math.max(0, worldH - viewH));
    this.camera.style.transform = `translateY(${-offset}px)`;
  }

  /**
   * 하루를 넘길 때의 이동 연출 — 위로 한 구간 전진한다.
   * 맨 위에 닿아 있으면 아래로 되돌아가 다시 올라갈 여지를 만든다.
   */
  async journey(ms = 1200): Promise<void> {
    if (!this.isOn()) return;
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

      this.hooks.log(`${npc.icon} ${npc.label}\n${npc.flavor_text || npc.label}`);
    } finally {
      this.setBusy(false);
    }
  }

  /** 다른 구역으로 — 끝까지 걸어간 뒤 페이드, 반대쪽 끝에서 들어온다 */
  private async travel(toAreaId: string, side: "TOP" | "BOTTOM") {
    if (this.busy) return;
    this.setBusy(true);
    try {
      await this.walkTo(this.xPct, side === "TOP" ? 4 : 94, { force: true });
      await fadeTo(this.fade, 1, FADE_MS);
      // 위로 나갔으면 새 구역의 아래쪽에서 시작
      this.enter(toAreaId, { fromEdge: side === "TOP" ? "BOTTOM" : "TOP" });
      await fadeTo(this.fade, 0, FADE_MS);
      await this.walkTo(this.xPct, side === "TOP" ? 76 : 20, { force: true });
      const area = this.data.areas.find((a) => a.area_id === toAreaId);
      if (area) this.hooks.log(`🚶 ${area.display_name}에 들어섰다.`);
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
}

// ── 유틸 ────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function fadeTo(el: HTMLElement, opacity: number, ms: number): Promise<void> {
  el.style.transitionDuration = `${ms}ms`;
  el.style.opacity = String(opacity);
  el.style.pointerEvents = opacity > 0 ? "auto" : "none";
  return new Promise((r) => window.setTimeout(r, ms));
}
