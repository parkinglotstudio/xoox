/**
 * 무지개섬 로비 허브
 * 시안: 캐릭 없음 · 상단 XOOX/LOBBY · 바텀 탭(안 A: 배=홈, 외출=여정)
 * 배경: 정화전/후 lobby_hub_*.png · 팬 world_w_pct
 */

import type { LayoutItem, LayoutAspect, SceneLayout } from "./layoutTypes";
import {
  lobbyLayoutUrl,
  layoutItemStyle,
  layoutUsesPan,
  layoutWorldWPct,
  RUNTIME_LOBBY_ASPECT,
} from "./layoutTypes";

export type LobbyMenuId = "dispatch" | "adventure" | "terminal" | "party";
export type TerminalAppId = "scrapbook" | "dex" | "journal" | "map" | "clear";
export type LobbyDockTab = "boat" | "depart" | "dispatch" | "party" | "record";

export interface LobbyHooks {
  onDepart: () => void;
  onResumeJourney?: () => void;
  onRenderScrapbook: (pane: HTMLElement) => void;
  onRenderDex?: (pane: HTMLElement) => void;
  onRenderJournal?: (pane: HTMLElement) => void;
  onRenderMap?: (pane: HTMLElement) => void;
  onRenderClear?: (pane: HTMLElement) => void;
  onOpenDispatch: () => void;
  onOpenAdventure: () => void;
  onAdventurePick?: (stageMapId: string) => void;
  onOpenParty: () => void;
}

export interface LobbyRefreshInfo {
  day: number;
  zoneName: string;
  partyCount: number;
  partySlots: number;
  memoryCount: number;
  memoryTotal: number;
  hasDeparted: boolean;
  purifiedCount?: number;
  partyIcons?: string[];
  gem?: number;
  stamina?: number;
  staminaMax?: number;
}

const HUB_BG_BEFORE = "/ui/lobby/lobby_hub_before.png";
const HUB_BG_AFTER = "/ui/lobby/lobby_hub_after.png";

const FALLBACK_LAYOUT: SceneLayout = {
  id: "lobby",
  label: "무지개섬 로비",
  aspect: "9:16",
  anchor: "bottom-left",
  world_w_pct: 155,
  bg: HUB_BG_BEFORE,
  items: [],
};

export class LobbyView {
  private root: HTMLElement;
  private hooks: LobbyHooks;
  private layer!: HTMLElement;
  private dayEl!: HTMLElement;
  private zoneEl!: HTMLElement;
  private partyEl!: HTMLElement;
  private greetEl!: HTMLElement;
  private stageEl!: HTMLElement;
  private noteEl!: HTMLElement;
  private boardEl!: HTMLElement;
  private boardBody!: HTMLElement;
  private terminalEl!: HTMLElement;
  private terminalPane!: HTMLElement;
  private terminalBadge!: HTMLElement;
  private gemEl!: HTMLElement;
  private staminaEl!: HTMLElement;
  private terminalApp: TerminalAppId = "scrapbook";
  private dockTab: LobbyDockTab = "boat";
  private purified = false;
  private on = false;
  private layout: SceneLayout = FALLBACK_LAYOUT;
  private aspect: LayoutAspect = RUNTIME_LOBBY_ASPECT;
  private facing: 1 | -1 = -1;
  private panX = 0;
  private panDragging = false;
  private panLastX = 0;
  private panBound = false;
  private actorIdleTimer = 0;

  constructor(phoneRoot: HTMLElement, hooks: LobbyHooks) {
    this.root = phoneRoot;
    this.hooks = hooks;
    this.mount();
    void this.loadLayout();
  }

  private async loadLayout() {
    try {
      const res = await fetch(`${lobbyLayoutUrl(this.aspect)}?t=${Date.now()}`);
      if (!res.ok) throw new Error(String(res.status));
      this.layout = (await res.json()) as SceneLayout;
      if (this.layout.aspect !== "9:16" && this.layout.aspect !== "16:9") {
        this.layout.aspect = this.aspect;
      }
    } catch {
      this.layout = { ...FALLBACK_LAYOUT, aspect: this.aspect };
    }
    this.renderLayout();
  }

  private mount() {
    const layer = document.createElement("div");
    layer.className = "lobby-layer lobby-art lobby-scene-mode lobby-hub-mode";
    layer.id = "lobbyLayer";
    layer.innerHTML = `
      <div class="lobby-island">
        <header class="lobby-hub-top">
          <div class="lobby-brand">
            <div class="lobby-brand-xoox">XOOX</div>
            <div class="lobby-brand-sub"><span></span>LOBBY<span></span></div>
          </div>
          <div class="lobby-resources">
            <div class="lobby-res-chip" title="보석">
              <span class="lobby-res-ico" aria-hidden="true">◈</span>
              <span id="lobbyGem">0</span>
              <span class="lobby-res-plus">+</span>
            </div>
            <div class="lobby-res-chip" title="스태미나">
              <span class="lobby-res-ico" aria-hidden="true">⚡</span>
              <span id="lobbyStamina">78 / 100</span>
              <span class="lobby-res-plus">+</span>
            </div>
          </div>
          <button type="button" class="lobby-settings" id="lobbySettings" aria-label="설정">⚙</button>
        </header>
        <div class="lobby-stage" id="lobbyGround"></div>
        <div class="lobby-hub-meta">
          <span class="lobby-day" id="lobbyDay">Day 1</span>
          <span class="lobby-zone" id="lobbyZone">여정 준비</span>
        </div>
        <nav class="lobby-dock-bar" aria-label="로비 메뉴">
          <button type="button" class="lobby-dock-tab on" data-tab="boat">
            <img class="lobby-dock-ico" src="/ui/lobby/dock/dock_ico_boat.png" alt="" draggable="false" />
            <span class="lobby-dock-label">배</span>
          </button>
          <button type="button" class="lobby-dock-tab" data-tab="depart">
            <img class="lobby-dock-ico" src="/ui/lobby/dock/dock_ico_depart.png" alt="" draggable="false" />
            <span class="lobby-dock-label">외출</span>
          </button>
          <button type="button" class="lobby-dock-tab" data-tab="dispatch">
            <img class="lobby-dock-ico" src="/ui/lobby/dock/dock_ico_dispatch.png" alt="" draggable="false" />
            <span class="lobby-dock-label">파견</span>
          </button>
          <button type="button" class="lobby-dock-tab" data-tab="party">
            <img class="lobby-dock-ico" src="/ui/lobby/dock/dock_ico_party.png" alt="" draggable="false" />
            <span class="lobby-dock-label">파티</span>
          </button>
          <button type="button" class="lobby-dock-tab" data-tab="record">
            <img class="lobby-dock-ico" src="/ui/lobby/dock/dock_ico_record.png" alt="" draggable="false" />
            <span class="lobby-dock-label">기록</span>
          </button>
        </nav>
        <div class="lobby-greet" id="lobbyGreet" hidden>밀어서 탐색</div>
        <span class="lobby-menu-badge" id="lobbyTerminalBadge" style="display:none" aria-hidden="true">0</span>
        <span class="lobby-party-count" id="lobbyPartySub" hidden>0</span>
        <div class="lobby-note" id="lobbyNote"></div>
      </div>
      <div class="lobby-board" id="lobbyBoard" style="display:none" role="dialog" aria-label="파견 보고">
        <div class="lobby-board-sheet">
          <div class="lobby-board-head">
            <div class="lobby-board-title">🏠 파견 보고</div>
            <button type="button" class="lobby-board-close" id="lobbyBoardClose">닫기</button>
          </div>
          <div class="lobby-board-body" id="lobbyBoardBody"></div>
        </div>
      </div>
      <div class="lobby-terminal" id="lobbyTerminal" style="display:none" role="dialog" aria-label="구조연맹 단말기">
        <div class="lobby-terminal-shell">
          <div class="lobby-terminal-rail" role="tablist">
            <button type="button" class="lobby-term-app on" data-app="scrapbook">📖<br/><span>스크랩</span></button>
            <button type="button" class="lobby-term-app" data-app="dex">🐾<br/><span>도감</span></button>
            <button type="button" class="lobby-term-app" data-app="clear">⏱<br/><span>칸 기록</span></button>
            <button type="button" class="lobby-term-app" data-app="journal">📋<br/><span>일지</span></button>
            <button type="button" class="lobby-term-app" data-app="map">🗺️<br/><span>지도</span></button>
          </div>
          <div class="lobby-terminal-main">
            <div class="lobby-terminal-bar">
              <div class="lobby-terminal-title" id="lobbyTerminalTitle">📖 기억의 스크랩북</div>
              <button type="button" class="lobby-board-close" id="lobbyTerminalClose">닫기</button>
            </div>
            <div class="lobby-terminal-pane" id="lobbyTerminalPane"></div>
          </div>
        </div>
      </div>
    `;
    this.root.appendChild(layer);
    this.layer = layer;
    this.dayEl = layer.querySelector("#lobbyDay")!;
    this.zoneEl = layer.querySelector("#lobbyZone")!;
    this.partyEl = layer.querySelector("#lobbyPartySub")!;
    this.greetEl = layer.querySelector("#lobbyGreet")!;
    this.stageEl = layer.querySelector("#lobbyGround")!;
    this.noteEl = layer.querySelector("#lobbyNote")!;
    this.boardEl = layer.querySelector("#lobbyBoard")!;
    this.boardBody = layer.querySelector("#lobbyBoardBody")!;
    this.terminalEl = layer.querySelector("#lobbyTerminal")!;
    this.terminalPane = layer.querySelector("#lobbyTerminalPane")!;
    this.terminalBadge = layer.querySelector("#lobbyTerminalBadge")!;
    this.gemEl = layer.querySelector("#lobbyGem")!;
    this.staminaEl = layer.querySelector("#lobbyStamina")!;

    this.renderLayout();
    this.bindPan();
    this.bindDock();

    layer.querySelector("#lobbyBoardClose")!.addEventListener("click", () => this.hideBoard());
    this.boardEl.addEventListener("click", (e) => {
      if (e.target === this.boardEl) this.hideBoard();
    });
    layer.querySelector("#lobbyTerminalClose")!.addEventListener("click", () => this.hideTerminal());
    this.terminalEl.addEventListener("click", (e) => {
      if (e.target === this.terminalEl) this.hideTerminal();
    });
    layer.querySelectorAll<HTMLButtonElement>(".lobby-term-app").forEach((btn) => {
      btn.addEventListener("click", () => {
        const app = btn.dataset.app as TerminalAppId;
        this.openTerminal(app);
      });
    });
    layer.querySelector("#lobbySettings")?.addEventListener("click", () => {
      this.flashNote("설정은 준비 중");
    });
  }

  private bindDock() {
    this.layer.querySelectorAll<HTMLButtonElement>(".lobby-dock-tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tab = btn.dataset.tab as LobbyDockTab;
        this.selectDock(tab);
      });
    });
  }

  private selectDock(tab: LobbyDockTab) {
    this.selectDockVisual(tab);
    if (tab === "boat") {
      this.hideOverlays();
      return;
    }
    if (tab === "depart") {
      this.depart();
      // 여정 나가면 로비가 닫힘 — 돌아올 때 boat로
      return;
    }
    if (tab === "dispatch") {
      this.hooks.onOpenDispatch();
      return;
    }
    if (tab === "party") {
      this.hooks.onOpenParty();
      return;
    }
    if (tab === "record") {
      this.openTerminal("clear");
    }
  }

  private renderLayout() {
    this.stopActorIdle();
    const bg = this.purified ? HUB_BG_AFTER : HUB_BG_BEFORE;
    const worldW = Math.max(layoutWorldWPct(this.layout), 130);
    const pan = true;
    this.stageEl.innerHTML = `<div class="lobby-pan-world" id="lobbyPanWorld" style="width:${worldW}%">
      <img class="lobby-bg" src="${bg}?t=${Date.now()}" alt="" draggable="false" />
    </div>`;
    /* 허브: 표지판·배 프롭 없음(바텀 탭). 부두 방랑자(정면 대기)만 표시 */
    const world = this.stageEl.querySelector<HTMLElement>("#lobbyPanWorld");
    const actor = this.layout.items.find((it) => it.kind === "actor");
    if (world && actor) {
      const el = this.createItemEl(actor);
      world.appendChild(el);
      void this.attachActorIdle(el, actor.art);
    }
    this.stageEl.classList.add("lobby-pan-on");
    this.syncPanHints(pan);
    this.panX = 0;
    this.applyPan();
  }

  /** 뷰포트에 고정된 좌우 팬 힌트(월드와 같이 움직이지 않음). */
  private syncPanHints(pan: boolean) {
    let hint = this.layer.querySelector<HTMLElement>(".lobby-pan-hint");
    if (!pan) {
      hint?.remove();
      return;
    }
    if (!hint) {
      hint = document.createElement("div");
      hint.className = "lobby-pan-hint";
      hint.setAttribute("aria-hidden", "true");
      hint.innerHTML = `
        <div class="lobby-pan-fade lobby-pan-fade-l"></div>
        <div class="lobby-pan-fade lobby-pan-fade-r"></div>
        <div class="lobby-pan-arrow lobby-pan-arrow-l" title="왼쪽">◀</div>
        <div class="lobby-pan-arrow lobby-pan-arrow-r" title="오른쪽">▶</div>
        <div class="lobby-pan-caption">밀어서 탐색</div>
      `;
      this.layer.appendChild(hint);
    }
  }

  /** 뷰포트 고정 · 월드 좌우 팬 (world_w_pct > 100). */
  private bindPan() {
    if (this.panBound) return;
    this.panBound = true;
    const onDown = (e: PointerEvent) => {
      if (!this.on) return;
      if ((e.target as HTMLElement).closest(".lobby-dock-tab, .lobby-settings, .lobby-board, .lobby-terminal")) return;
      if ((e.target as HTMLElement).closest(".lobby-laid[data-action]:not([data-action=NONE])")) return;
      this.panDragging = true;
      this.panLastX = e.clientX;
      this.stageEl.setPointerCapture?.(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!this.panDragging) return;
      const dx = e.clientX - this.panLastX;
      this.panLastX = e.clientX;
      this.panX += dx;
      this.applyPan();
      this.root.querySelector(".lobby-pan-hint")?.classList.add("lobby-pan-hint-dim");
      this.layer.querySelector(".lobby-pan-hint")?.classList.add("lobby-pan-hint-dim");
    };
    const onUp = () => {
      this.panDragging = false;
    };
    this.stageEl.addEventListener("pointerdown", onDown);
    this.stageEl.addEventListener("pointermove", onMove);
    this.stageEl.addEventListener("pointerup", onUp);
    this.stageEl.addEventListener("pointercancel", onUp);
  }

  private applyPan() {
    const world = this.stageEl.querySelector<HTMLElement>("#lobbyPanWorld");
    if (!world) return;
    const hostW = this.stageEl.clientWidth || 1;
    const worldW = world.offsetWidth || hostW * 1.3;
    const minX = Math.min(0, hostW - worldW);
    this.panX = Math.max(minX, Math.min(0, this.panX));
    world.style.transform = `translateX(${this.panX}px)`;
  }

  private createItemEl(item: LayoutItem): HTMLElement {
    const interactive = item.action && item.action !== "NONE";
    const el = document.createElement(interactive ? "button" : "div");
    if (interactive) (el as HTMLButtonElement).type = "button";
    el.className = `lobby-laid lobby-laid-${item.kind}`;
    el.dataset.id = item.id;
    el.dataset.action = String(item.action || "NONE");
    if (item.v_anchor === "top") el.dataset.vAnchor = "top";
    el.setAttribute("style", layoutItemStyle(item));
    if (item.kind === "actor") {
      el.style.setProperty("--facing", "1");
    }
    el.title = item.label;
    el.setAttribute("aria-label", item.label);
    el.innerHTML = `<img class="lobby-laid-img" src="${item.art}" alt="" draggable="false" />`;
    if (interactive) {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        this.greetEl.textContent = item.label;
        this.runSignAction(String(item.action));
      });
    }
    return el;
  }

  private async attachActorIdle(host: HTMLElement, art: string): Promise<void> {
    const jsonUrl = art.replace(/\.png(?:\?.*)?$/i, ".json");
    try {
      const res = await fetch(`${jsonUrl}?t=${Date.now()}`);
      if (!res.ok) return;
      const spec = (await res.json()) as {
        sheet: string;
        cols: number;
        cell_w?: number;
        cell_h?: number;
        frames: { duration_ms: number }[];
      };
      if (!spec.sheet || !spec.cols) return;
      const dir = art.replace(/[^/]+$/, "");
      const stage = document.createElement("div");
      stage.className = "lobby-laid-img lobby-actor-sheet";
      stage.setAttribute("aria-hidden", "true");
      if (spec.cell_w && spec.cell_h) {
        stage.style.aspectRatio = `${spec.cell_w} / ${spec.cell_h}`;
      }
      const strip = document.createElement("img");
      strip.className = "lobby-actor-strip";
      strip.alt = "";
      strip.draggable = false;
      strip.width = (spec.cell_w ?? 482) * spec.cols;
      strip.height = spec.cell_h ?? 1020;
      strip.style.width = `${spec.cols * 100}%`;
      strip.src = `${dir}${spec.sheet}?v=idle4`;
      stage.appendChild(strip);
      host.querySelector(".lobby-laid-img")?.replaceWith(stage);
      const play = () => this.startActorIdle(strip, spec.cols, spec.frames.map((f) => f.duration_ms));
      if (strip.complete) play();
      else strip.addEventListener("load", play, { once: true });
    } catch {
      /* 시트 없으면 정지 PNG 유지 */
    }
  }

  private startActorIdle(strip: HTMLElement, cols: number, durations: number[]): void {
    this.stopActorIdle();
    let i = 0;
    const tick = () => {
      if (!strip.isConnected) return;
      strip.style.transform = `translate3d(${(-i / cols) * 100}%, 0, 0)`;
      const ms = Math.max(40, durations[i] ?? 300);
      i = (i + 1) % cols;
      this.actorIdleTimer = window.setTimeout(tick, ms);
    };
    tick();
  }

  private stopActorIdle(): void {
    if (!this.actorIdleTimer) return;
    window.clearTimeout(this.actorIdleTimer);
    this.actorIdleTimer = 0;
  }

  private runSignAction(action: string) {
    const act = action.toUpperCase();
    if (act === "TERMINAL") this.openTerminal("scrapbook");
    else if (act === "DEPART") this.depart();
    else if (act === "DISPATCH") this.hooks.onOpenDispatch();
    else if (act === "PARTY") this.hooks.onOpenParty();
    else if (act === "ADVENTURE") this.hooks.onOpenAdventure();
  }

  private depart() {
    this.hideOverlays();
    this.hooks.onDepart();
  }

  isOn() {
    return this.on;
  }

  show() {
    this.on = true;
    this.layer.classList.add("on");
    this.root.classList.add("lobby-on");
    void this.loadLayout();
  }

  hide() {
    this.on = false;
    this.stopActorIdle();
    this.hideOverlays();
    this.layer.querySelector(".lobby-pan-hint")?.remove();
    this.root.querySelectorAll(".lobby-pan-hint").forEach((el) => el.remove());
    this.layer.classList.remove("on");
    this.root.classList.remove("lobby-on");
    this.clearNote();
  }

  showDispatchBoard(text: string) {
    this.hideTerminal();
    const title = this.boardEl.querySelector(".lobby-board-title");
    if (title) title.textContent = "🏠 파견 보고";
    this.boardBody.classList.remove("lobby-board-body-html");
    this.boardBody.textContent = text;
    this.boardEl.style.display = "flex";
  }

  showAdventureBoard(html: string) {
    this.hideTerminal();
    const title = this.boardEl.querySelector(".lobby-board-title");
    if (title) title.textContent = "🗺️ 모험 · 지난 구역";
    this.boardBody.classList.add("lobby-board-body-html");
    this.boardBody.innerHTML = html;
    this.boardEl.style.display = "flex";
    this.boardBody.querySelectorAll<HTMLButtonElement>("[data-map]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.map;
        if (id) this.hooks.onAdventurePick?.(id);
      });
    });
  }

  hideBoard() {
    this.boardEl.style.display = "none";
  }

  openTerminal(app: TerminalAppId = "scrapbook") {
    this.hideBoard();
    this.terminalApp = app;
    this.terminalEl.style.display = "flex";
    this.layer.querySelectorAll<HTMLButtonElement>(".lobby-term-app").forEach((b) => {
      b.classList.toggle("on", b.dataset.app === app);
    });
    const titles: Record<TerminalAppId, string> = {
      scrapbook: "📖 기억의 스크랩북",
      dex: "🐾 구조 도감",
      journal: "📋 구조 일지",
      map: "🗺️ 여정 지도",
      clear: "⏱ 칸 클리어 기록",
    };
    const titleEl = this.layer.querySelector("#lobbyTerminalTitle");
    if (titleEl) titleEl.textContent = titles[app];

    if (app === "scrapbook") this.hooks.onRenderScrapbook(this.terminalPane);
    else if (app === "dex") {
      if (this.hooks.onRenderDex) this.hooks.onRenderDex(this.terminalPane);
      else this.terminalPane.innerHTML = `<div class="lobby-term-stub">도감을 여는 중…</div>`;
    } else if (app === "journal") {
      if (this.hooks.onRenderJournal) this.hooks.onRenderJournal(this.terminalPane);
      else this.terminalPane.innerHTML = `<div class="lobby-term-stub">일지를 여는 중…</div>`;
    } else if (app === "map") {
      if (this.hooks.onRenderMap) this.hooks.onRenderMap(this.terminalPane);
      else this.terminalPane.innerHTML = `<div class="lobby-term-stub">지도를 여는 중…</div>`;
    } else if (app === "clear") {
      if (this.hooks.onRenderClear) this.hooks.onRenderClear(this.terminalPane);
      else this.terminalPane.innerHTML = `<div class="lobby-term-stub">칸 기록을 여는 중…</div>`;
    }
  }

  hideTerminal() {
    this.terminalEl.style.display = "none";
    this.terminalPane.innerHTML = "";
  }

  private hideOverlays() {
    this.hideBoard();
    this.hideTerminal();
  }

  refresh(info: LobbyRefreshInfo) {
    this.dayEl.textContent = `Day ${info.day}`;
    this.zoneEl.textContent = info.zoneName || "여정 준비";
    this.partyEl.textContent = `${info.partyCount}/${info.partySlots}`;
    this.purified = (info.purifiedCount ?? 0) > 0;
    this.layer.classList.toggle("lobby-color-heal", this.purified);
    const gem = info.gem ?? Math.max(0, info.memoryCount * 120 + info.day * 40);
    const sta = info.stamina ?? 78;
    const staMax = info.staminaMax ?? 100;
    this.gemEl.textContent = gem.toLocaleString("en-US");
    this.staminaEl.textContent = `${sta} / ${staMax}`;
    this.greetEl.textContent = "밀어서 탐색";
    this.selectDockVisual("boat");
    this.renderLayout();

    if (info.memoryCount > 0) {
      this.terminalBadge.style.display = "flex";
      this.terminalBadge.textContent = `${info.memoryCount}`;
    } else {
      this.terminalBadge.style.display = "none";
    }
  }

  private selectDockVisual(tab: LobbyDockTab) {
    this.dockTab = tab;
    this.layer.querySelectorAll<HTMLButtonElement>(".lobby-dock-tab").forEach((b) => {
      b.classList.toggle("on", b.dataset.tab === tab);
    });
  }

  flashNote(text: string) {
    this.noteEl.textContent = text;
    this.noteEl.classList.add("show");
    window.setTimeout(() => this.clearNote(), 2200);
  }

  private clearNote() {
    this.noteEl.textContent = "";
    this.noteEl.classList.remove("show");
  }
}
