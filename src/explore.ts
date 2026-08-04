/**
 * 탐방 뷰 — 지역을 걸어다니며 둘러보는 화면.
 *
 * 설계 근거: docs/gdd/25 §4(탐방 뷰) · 27(지역 이동 구조) · 26 §3
 * - Cozy Grove식 "정적 배경 + 탭한 지점으로 이동"(좌우 스크롤 러너 아님 — 카피바라고와 겹침 회피)
 * - 지역·연결·이벤트 지점은 전부 CSV 구동(area_config / area_connection_config / area_npc_config)
 * - 배경 아트가 없으므로 CSV의 색으로 플레이스홀더를 그린다. background_asset이 채워지면 그쪽 우선.
 *
 * 애니메이션 규칙(프로젝트 원칙): rAF 금지. CSS transition/keyframes + setTimeout만 사용.
 */
import type { GameData, AreaDef, AreaNpcDef } from "./types";

export interface ExploreHooks {
  /** 로그(채팅) 패널에 한 줄 남긴다 */
  log: (body: string) => void;
  /** 지역이 바뀌었을 때 상단 캡션 등을 갱신하고 싶을 때 */
  onAreaChange?: (area: AreaDef) => void;
}

/** 걷는 속도 — px/초. 거리에 비례해 이동 시간을 정한다(먼 곳일수록 오래 걷는다). */
const WALK_SPEED_PX_PER_SEC = 165;
const WALK_MIN_MS = 260;
const WALK_MAX_MS = 1500;
/** 지역 전환 페이드 한쪽 길이(ms) */
const FADE_MS = 320;

export class ExploreView {
  private data: GameData;
  private hooks: ExploreHooks;
  private root: HTMLElement;

  private layer!: HTMLElement;
  private sky!: HTMLElement;
  private ground!: HTMLElement;
  private propLayer!: HTMLElement;
  private actor!: HTMLElement;
  private actorInner!: HTMLElement;
  private fade!: HTMLElement;
  private nameTag!: HTMLElement;

  private currentAreaId = "";
  /** 배우의 가로 위치(지역 폭 기준 %) */
  private actorXPct = 30;
  private facing: 1 | -1 = 1;
  private walkTimer: number | null = null;
  private busy = false;

  constructor(root: HTMLElement, data: GameData, hooks: ExploreHooks) {
    this.root = root;
    this.data = data;
    this.hooks = hooks;
    this.build();
  }

  // ── DOM 구성 ──────────────────────────────────────────────────────────
  private build() {
    const layer = document.createElement("div");
    layer.className = "explore-layer";
    layer.innerHTML = `
      <div class="explore-sky"></div>
      <div class="explore-ground"></div>
      <div class="explore-props"></div>
      <div class="explore-actor"><div class="explore-actor-inner"></div></div>
      <div class="explore-name"></div>
      <div class="explore-fade"></div>
    `;
    this.root.appendChild(layer);

    this.layer = layer;
    this.sky = layer.querySelector(".explore-sky")!;
    this.ground = layer.querySelector(".explore-ground")!;
    this.propLayer = layer.querySelector(".explore-props")!;
    this.actor = layer.querySelector(".explore-actor")!;
    this.actorInner = layer.querySelector(".explore-actor-inner")!;
    this.nameTag = layer.querySelector(".explore-name")!;
    this.fade = layer.querySelector(".explore-fade")!;

    // 땅을 탭하면 그 지점으로 걸어간다
    this.ground.addEventListener("click", (e) => {
      const rect = this.layer.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      void this.walkTo(pct);
    });
  }

  // ── 지역 진입 ─────────────────────────────────────────────────────────
  enter(areaId: string, opts?: { fromPct?: number; silent?: boolean }) {
    const area = this.data.areas.find((a) => a.area_id === areaId);
    if (!area) {
      console.warn("[explore] 알 수 없는 지역:", areaId);
      return;
    }
    this.currentAreaId = areaId;

    // 배경 — 아트가 있으면 이미지, 없으면 CSV 색 플레이스홀더
    if (area.background_asset) {
      this.sky.style.background = `center/cover no-repeat url("${area.background_asset}")`;
    } else {
      this.sky.style.background = `linear-gradient(180deg, ${area.sky_top} 0%, ${area.sky_bottom} 100%)`;
    }
    this.ground.style.height = `${area.ground_h_pct}%`;
    this.ground.style.background = `linear-gradient(180deg, ${area.ground_color} 0%, ${shade(area.ground_color, -18)} 100%)`;

    this.nameTag.textContent = area.display_name;
    this.nameTag.classList.remove("show");
    void this.nameTag.offsetWidth; // 리플로우로 애니메이션 재시작
    this.nameTag.classList.add("show");

    this.renderProps(area);

    this.actorXPct = opts?.fromPct ?? 22;
    this.applyActorX(false);

    if (!opts?.silent) this.hooks.onAreaChange?.(area);
  }

  /** 이벤트 지점 + 출구 표식을 그린다 */
  private renderProps(area: AreaDef) {
    this.propLayer.innerHTML = "";

    for (const npc of this.data.areaNpcs.filter((n) => n.area_id === area.area_id)) {
      if (npc.appear_condition !== "ALWAYS") continue;
      const el = document.createElement("button");
      el.type = "button";
      el.className = "explore-poi";
      el.style.left = `${npc.x_pct}%`;
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
      el.className = `explore-exit ${conn.side === "LEFT" ? "left" : "right"}`;
      const target = this.data.areas.find((a) => a.area_id === conn.to);
      el.innerHTML = `<span class="explore-exit-arrow">${conn.side === "LEFT" ? "◀" : "▶"}</span><span class="explore-exit-label">${target?.display_name ?? conn.to}</span>`;
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        void this.travel(conn.to, conn.side);
      });
      this.propLayer.appendChild(el);
    }
  }

  /** 이 지역에서 나갈 수 있는 통로 목록 (bidirectional이면 역방향도 포함) */
  private exitsOf(areaId: string): { to: string; side: "LEFT" | "RIGHT" }[] {
    const out: { to: string; side: "LEFT" | "RIGHT" }[] = [];
    for (const c of this.data.areaConnections) {
      if (c.unlock_condition) continue; // 조건부 통로는 아직 미지원
      if (c.from_area_id === areaId) {
        out.push({ to: c.to_area_id, side: c.exit_point });
      } else if (c.bidirectional && c.to_area_id === areaId) {
        // 역방향은 반대편 가장자리로 나간다
        out.push({ to: c.from_area_id, side: c.exit_point === "RIGHT" ? "LEFT" : "RIGHT" });
      }
    }
    return out;
  }

  // ── 움직임 ────────────────────────────────────────────────────────────

  /** 목표 지점까지 걸어간다. 거리에 비례한 시간 + 방향 전환 + 걷기 모션. */
  walkTo(targetPct: number, opts?: { force?: boolean }): Promise<void> {
    if (this.busy && !opts?.force) return Promise.resolve();
    const clamped = Math.max(6, Math.min(94, targetPct));
    const deltaPct = clamped - this.actorXPct;
    if (Math.abs(deltaPct) < 0.6) return Promise.resolve();

    // 방향 전환
    const nextFacing: 1 | -1 = deltaPct >= 0 ? 1 : -1;
    if (nextFacing !== this.facing) {
      this.facing = nextFacing;
      this.actor.classList.add("turning");
      window.setTimeout(() => this.actor.classList.remove("turning"), 180);
    }

    const widthPx = this.layer.getBoundingClientRect().width || 600;
    const distPx = (Math.abs(deltaPct) / 100) * widthPx;
    const ms = Math.round(
      Math.max(WALK_MIN_MS, Math.min(WALK_MAX_MS, (distPx / WALK_SPEED_PX_PER_SEC) * 1000))
    );

    this.actorXPct = clamped;
    this.actor.classList.add("walking");
    this.actor.style.transitionDuration = `${ms}ms`;
    this.applyActorX(true);

    return new Promise((resolve) => {
      if (this.walkTimer) window.clearTimeout(this.walkTimer);
      this.walkTimer = window.setTimeout(() => {
        this.actor.classList.remove("walking");
        // 도착 스쿼시
        this.actorInner.classList.add("landing");
        window.setTimeout(() => this.actorInner.classList.remove("landing"), 260);
        resolve();
      }, ms);
    });
  }

  private applyActorX(animated: boolean) {
    if (!animated) this.actor.style.transitionDuration = "0ms";
    this.actor.style.left = `${this.actorXPct}%`;
    this.actor.style.setProperty("--facing", String(this.facing));
  }

  /** 이벤트 지점까지 걸어간 뒤 반응 */
  private async approach(npc: AreaNpcDef) {
    if (this.busy) return;
    this.busy = true;
    try {
      // 지점 바로 옆에 서도록 살짝 비켜서 멈춘다
      const stopAt = npc.x_pct + (npc.x_pct > this.actorXPct ? -7 : 7);
      await this.walkTo(stopAt, { force: true });

      const poi = this.propLayer.querySelector<HTMLElement>(`.explore-poi[style*="${npc.x_pct}%"]`);
      poi?.classList.add("found");
      window.setTimeout(() => poi?.classList.remove("found"), 700);

      // 살펴보는 반응(제자리 홉)
      this.actorInner.classList.add("react");
      window.setTimeout(() => this.actorInner.classList.remove("react"), 520);

      const text = npc.flavor_text || `${npc.icon} ${npc.label}`;
      this.hooks.log(`${npc.icon} ${npc.label}\n${text}`);
    } finally {
      this.busy = false;
    }
  }

  /** 다른 지역으로 이동 — 가장자리로 걸어나가고 반대편에서 들어온다 */
  private async travel(toAreaId: string, side: "LEFT" | "RIGHT") {
    if (this.busy) return;
    this.busy = true;
    try {
      await this.walkTo(side === "LEFT" ? 6 : 94, { force: true });
      await fadeTo(this.fade, 1, FADE_MS);
      this.enter(toAreaId, { fromPct: side === "LEFT" ? 92 : 8 });
      // 들어온 뒤 안쪽으로 몇 걸음
      await fadeTo(this.fade, 0, FADE_MS);
      await this.walkTo(side === "LEFT" ? 74 : 26, { force: true });
      const area = this.data.areas.find((a) => a.area_id === toAreaId);
      if (area) this.hooks.log(`🚶 ${area.display_name}에 들어섰다.`);
    } finally {
      this.busy = false;
    }
  }

  // ── 표시 제어 ─────────────────────────────────────────────────────────
  show() {
    this.layer.classList.add("on");
    if (!this.currentAreaId) {
      const first = this.data.areas[0];
      if (first) this.enter(first.area_id, { silent: true });
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

function fadeTo(el: HTMLElement, opacity: number, ms: number): Promise<void> {
  el.style.transitionDuration = `${ms}ms`;
  el.style.opacity = String(opacity);
  el.style.pointerEvents = opacity > 0 ? "auto" : "none";
  return new Promise((r) => window.setTimeout(r, ms));
}

/** #rrggbb 를 amt% 만큼 밝게(+)/어둡게(-) */
function shade(hex: string, amt: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v + (amt / 100) * 255)));
  const r = f((n >> 16) & 255);
  const g = f((n >> 8) & 255);
  const b = f(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
