/**
 * 무지개섬 로비 허브 — S1~S8
 * 비주얼: docs/gdd/37 · data/ui/layout/lobby_layout.json (하단 기준 · 16:9)
 * 배치 편집터: /layout-editor.html
 *
 * 배 = 외출 = 본편. 캐릭터 탭 이동 보류.
 */

import type { LayoutItem, SceneLayout } from "./layoutTypes";
import { LAYOUT_URL, layoutItemStyle } from "./layoutTypes";

export type LobbyMenuId = "dispatch" | "adventure" | "terminal" | "party";
export type TerminalAppId = "scrapbook" | "dex" | "journal" | "map";

export interface LobbyHooks {
  onDepart: () => void;
  onResumeJourney?: () => void;
  onRenderScrapbook: (pane: HTMLElement) => void;
  onRenderDex?: (pane: HTMLElement) => void;
  onRenderJournal?: (pane: HTMLElement) => void;
  onRenderMap?: (pane: HTMLElement) => void;
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
}

const FALLBACK_LAYOUT: SceneLayout = {
  id: "lobby",
  label: "무지개섬 로비",
  aspect: "16:9",
  anchor: "bottom-left",
  bg: "/ui/lobby/lobby_bg.png",
  items: [
    { id: "title", kind: "decor", label: "무지개섬", art: "/ui/lobby/lobby_title_sign.png", x_pct: 12, y_bottom_pct: 2, w_pct: 22, action: "NONE", v_anchor: "top" },
    { id: "boat", kind: "prop", label: "배", art: "/ui/lobby/lobby_boat.png", x_pct: 18, y_bottom_pct: 10.7, w_pct: 48, action: "DEPART" },
    { id: "actor", kind: "actor", label: "방랑자", art: "/ui/lobby/lobby_actor_idle.png", x_pct: 50.5, y_bottom_pct: 0.2, w_pct: 28, action: "NONE" },
    { id: "sign_depart", kind: "sign", label: "외출", art: "/ui/lobby/lobby_sign_depart.png", x_pct: 25.2, y_bottom_pct: 3.7, w_pct: 20, action: "DEPART" },
    { id: "sign_dispatch", kind: "sign", label: "파견", art: "/ui/lobby/lobby_sign_dispatch.png", x_pct: 64.5, y_bottom_pct: 5, w_pct: 14, action: "DISPATCH" },
    { id: "sign_record", kind: "sign", label: "기록", art: "/ui/lobby/lobby_sign_record.png", x_pct: 38.7, y_bottom_pct: 39.2, w_pct: 14, action: "TERMINAL" },
    { id: "sign_coop", kind: "sign", label: "협동", art: "/ui/lobby/lobby_sign_coop.png", x_pct: 64.6, y_bottom_pct: 26.4, w_pct: 14, action: "PARTY" },
    { id: "sign_adventure", kind: "sign", label: "모험", art: "/ui/lobby/lobby_sign_adventure.png", x_pct: 89.2, y_bottom_pct: 29, w_pct: 16, action: "ADVENTURE" },
  ],
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
  private terminalApp: TerminalAppId = "scrapbook";
  private on = false;
  private layout: SceneLayout = FALLBACK_LAYOUT;
  private facing: 1 | -1 = -1;

  constructor(phoneRoot: HTMLElement, hooks: LobbyHooks) {
    this.root = phoneRoot;
    this.hooks = hooks;
    this.mount();
    void this.loadLayout();
  }

  private async loadLayout() {
    try {
      const res = await fetch(`${LAYOUT_URL}?t=${Date.now()}`);
      if (!res.ok) throw new Error(String(res.status));
      this.layout = (await res.json()) as SceneLayout;
    } catch {
      this.layout = FALLBACK_LAYOUT;
    }
    this.renderLayout();
  }

  private mount() {
    const layer = document.createElement("div");
    layer.className = "lobby-layer lobby-art lobby-scene-mode";
    layer.id = "lobbyLayer";
    layer.innerHTML = `
      <div class="lobby-island">
        <div class="lobby-hud">
          <div class="lobby-meta">
            <span class="lobby-day" id="lobbyDay">Day 1</span>
            <span class="lobby-zone" id="lobbyZone">여정 준비</span>
          </div>
        </div>
        <div class="lobby-stage" id="lobbyGround"></div>
        <div class="lobby-dock">
          <div class="lobby-greet" id="lobbyGreet">배 = 본편 · 집 주변 표지판을 눌러 보세요</div>
          <span class="lobby-menu-badge" id="lobbyTerminalBadge" style="display:none" aria-hidden="true">0</span>
          <span class="lobby-party-count" id="lobbyPartySub" hidden>0</span>
          <div class="lobby-note" id="lobbyNote"></div>
        </div>
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

    this.renderLayout();

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
  }

  private renderLayout() {
    const bg = this.layout.bg || "/ui/lobby/lobby_bg.png";
    const items = this.layout.items ?? [];
    this.stageEl.innerHTML = `<img class="lobby-bg" src="${bg}" alt="" draggable="false" />`;

    for (const item of items) {
      this.stageEl.appendChild(this.createItemEl(item));
    }
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
      el.style.setProperty("--facing", String(this.facing));
      // actor keeps translateX(-50%) scaleX(facing) via CSS; top/bottom from style
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
    this.hideOverlays();
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
    this.layer.classList.toggle("lobby-color-heal", (info.purifiedCount ?? 0) > 0);
    this.greetEl.textContent = "배 = 본편 · 집 주변 나무 표지판을 눌러 보세요";

    if (info.memoryCount > 0) {
      this.terminalBadge.style.display = "flex";
      this.terminalBadge.textContent = `${info.memoryCount}`;
    } else {
      this.terminalBadge.style.display = "none";
    }
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
