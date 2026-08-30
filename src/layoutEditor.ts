/**
 * 레이아웃 에디터 — 전체 월드 + 비추는 화면(뷰포트) + 픽 리사이즈
 * URL: /layout-editor.html
 *
 * - lobby     : 팬 월드(world_w_pct) · 뷰포트 프레임 · 드래그/리사이즈 → lobby_layout*.json
 * - journey3d : 3D 튜너 → journey3d_layout.json
 */
import type { LayoutAspect, LayoutItem, LayoutVAnchor, SceneLayout } from "./layoutTypes";
import {
  DEFAULT_WORLD_W_PCT,
  RUNTIME_LOBBY_ASPECT,
  clampPct,
  itemVAnchor,
  layoutItemStyle,
  layoutUsesPan,
  layoutWorldWPct,
  lobbyLayoutSavePath,
  lobbyLayoutUrl,
  viewportWidthPct,
} from "./layoutTypes";
import { Journey3DTuner } from "./stage/world3d/Journey3DTuner";

const stage = document.querySelector<HTMLElement>("#stage")!;
const stageBg = document.querySelector<HTMLImageElement>("#stageBg")!;
const stageItems = document.querySelector<HTMLElement>("#stageItems")!;
const stageGrid = document.querySelector<HTMLElement>("#stageGrid")!;
const stageViewport = document.querySelector<HTMLElement>("#stageViewport")!;
const itemList = document.querySelector<HTMLElement>("#itemList")!;
const statusEl = document.querySelector<HTMLElement>("#status")!;
const fId = document.querySelector<HTMLInputElement>("#fId")!;
const fLabel = document.querySelector<HTMLInputElement>("#fLabel")!;
const fX = document.querySelector<HTMLInputElement>("#fX")!;
const fY = document.querySelector<HTMLInputElement>("#fY")!;
const fW = document.querySelector<HTMLInputElement>("#fW")!;
const fAction = document.querySelector<HTMLInputElement>("#fAction")!;
const fAnchor = document.querySelector<HTMLSelectElement>("#fAnchor")!;
const fYLabel = document.querySelector<HTMLElement>("#fYLabel")!;
const fWorldW = document.querySelector<HTMLInputElement>("#fWorldW")!;
const helpLobby = document.querySelector<HTMLElement>("#helpLobby")!;

const sceneSelect = document.querySelector<HTMLSelectElement>("#sceneSelect")!;
const selAspect = document.querySelector<HTMLSelectElement>("#selAspect")!;
const sideLobby = document.querySelector<HTMLElement>("#sideLobby")!;
const side3d = document.querySelector<HTMLElement>("#side3d")!;
const stage3d = document.querySelector<HTMLElement>("#stage3d")!;
const j3dCanvas = document.querySelector<HTMLCanvasElement>("#j3dCanvas")!;
const j3dDials = document.querySelector<HTMLElement>("#j3dDials")!;
const j3dSector = document.querySelector<HTMLSelectElement>("#j3dSector")!;
const btnGrid = document.querySelector<HTMLButtonElement>("#btnGrid")!;
const btnJ3dPurified = document.querySelector<HTMLButtonElement>("#btnJ3dPurified")!;
const btnJ3dView = document.querySelector<HTMLButtonElement>("#btnJ3dView")!;
const btnJ3dReset = document.querySelector<HTMLButtonElement>("#btnJ3dReset")!;

type SceneId = "lobby" | "journey3d";
type Handle = "e" | "w";

let scene: SceneId = "lobby";
let boardAspect: LayoutAspect = RUNTIME_LOBBY_ASPECT;
let tuner: Journey3DTuner | null = null;

let layout: SceneLayout | null = null;
let selectedId: string | null = null;
let dirty = false;
/** 뷰포트 왼쪽 가장자리 — 월드 % (0 ~ 100 - vpW) */
let viewLeftPct = 0;

type Drag =
  | {
      mode: "move";
      id: string;
      startX: number;
      startY: number;
      origX: number;
      origY: number;
      vAnchor: LayoutVAnchor;
    }
  | {
      mode: "resize";
      id: string;
      handle: Handle;
      startX: number;
      origX: number;
      origW: number;
    }
  | {
      mode: "pan";
      startX: number;
      origView: number;
    }
  | null;
let drag: Drag = null;

function setStatus(text: string, kind: "" | "ok" | "err" = "") {
  statusEl.textContent = text;
  statusEl.className = `status${kind ? ` ${kind}` : ""}`;
}

function markDirty(on = true) {
  dirty = on;
  if (on) setStatus("수정됨 · 저장하세요", "");
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function yAxisLabel(v: LayoutVAnchor) {
  return v === "top" ? "y_pct (상단↓)" : "y_pct (하단↑)";
}

function listYHint(i: LayoutItem) {
  const v = itemVAnchor(i);
  return v === "top"
    ? `top↓ ${i.y_bottom_pct.toFixed(1)}`
    : `bot↑ ${i.y_bottom_pct.toFixed(1)}`;
}

function worldW(): number {
  return layout ? layoutWorldWPct(layout) : 100;
}

function vpW(): number {
  return viewportWidthPct(worldW());
}

function clampViewLeft(n: number): number {
  return clampPct(n, 0, Math.max(0, 100 - vpW()));
}

function syncBoardChrome() {
  const pan = layout ? layoutUsesPan(layout) : boardAspect === "9:16";
  const ww = worldW();
  stage.classList.toggle("portrait", boardAspect === "9:16");
  stage.classList.toggle("pan-world", pan);
  stage3d.classList.toggle("portrait", boardAspect === "9:16");
  if (pan) {
    /* 월드 보드 비율 = (뷰포트 가로 * worldW/100) : 뷰포트 세로 */
    const aw = boardAspect === "9:16" ? 9 : 16;
    const ah = boardAspect === "9:16" ? 16 : 9;
    stage.style.aspectRatio = `${(aw * ww) / 100} / ${ah}`;
  } else {
    stage.style.aspectRatio = boardAspect === "9:16" ? "9 / 16" : "16 / 9";
  }
  if (fWorldW) fWorldW.value = String(ww);
  if (helpLobby) {
    const file = boardAspect === "9:16" ? "lobby_layout_portrait.json" : "lobby_layout.json";
    helpLobby.innerHTML =
      `<b>전체 월드</b>에 픽을 두고, <b>비추는 화면</b> 프레임을 밀어 본편 팬을 미리본다.<br />` +
      `빈곳/프레임 드래그 = 팬 · 픽 드래그 = 이동 · 모서리 = 크기<br />` +
      `저장 → <code>data/ui/layout/${file}</code>`;
  }
  syncViewport();
}

function syncViewport() {
  const pan = layout ? layoutUsesPan(layout) : false;
  stageViewport.hidden = !pan;
  if (!pan) {
    stageViewport.style.left = "0";
    stageViewport.style.width = "100%";
    return;
  }
  viewLeftPct = clampViewLeft(viewLeftPct);
  stageViewport.style.left = `${viewLeftPct}%`;
  stageViewport.style.width = `${vpW()}%`;
}

async function loadLayout() {
  const res = await fetch(`${lobbyLayoutUrl(boardAspect)}?t=${Date.now()}`);
  if (!res.ok) throw new Error(`load failed ${res.status}`);
  layout = (await res.json()) as SceneLayout;
  layout.aspect = boardAspect;
  if (!layout.world_w_pct) {
    layout.world_w_pct = boardAspect === "9:16" ? DEFAULT_WORLD_W_PCT : 100;
  }
  selectedId = layout.items[0]?.id ?? null;
  viewLeftPct = 0;
  dirty = false;
  syncBoardChrome();
  renderAll();
  setStatus(boardAspect === "9:16" ? "세로 월드 불러옴" : "가로 보드 불러옴", "ok");
}

function selectedItem(): LayoutItem | null {
  if (!layout || !selectedId) return null;
  return layout.items.find((i) => i.id === selectedId) ?? null;
}

function renderAll() {
  if (!layout) return;
  stageBg.src = layout.bg;
  renderList();
  renderItems();
  syncFields();
  syncViewport();
}

function renderList() {
  if (!layout) return;
  itemList.innerHTML = layout.items
    .map(
      (i) =>
        `<button type="button" data-id="${i.id}" class="${i.id === selectedId ? "on" : ""}">
          ${i.label}${itemVAnchor(i) === "top" ? " · TOP" : ""}
          <span>${i.id} · x ${i.x_pct.toFixed(1)} · ${listYHint(i)} · w ${i.w_pct}</span>
        </button>`,
    )
    .join("");
  itemList.querySelectorAll<HTMLButtonElement>("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedId = btn.dataset.id ?? null;
      renderAll();
    });
  });
}

function applyItemPos(el: HTMLElement, item: LayoutItem) {
  el.setAttribute("style", layoutItemStyle(item));
  el.classList.toggle("anchor-top", itemVAnchor(item) === "top");
}

function mountHandles(host: HTMLElement) {
  for (const h of ["w", "e"] as Handle[]) {
    const el = document.createElement("i");
    el.className = `le-handle ${h}`;
    el.dataset.handle = h;
    el.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      const id = host.dataset.id;
      if (!id || !layout) return;
      const item = layout.items.find((x) => x.id === id);
      if (!item) return;
      selectedId = id;
      drag = {
        mode: "resize",
        id,
        handle: h,
        startX: e.clientX,
        origX: item.x_pct,
        origW: item.w_pct,
      };
      el.setPointerCapture(e.pointerId);
      renderAll();
      e.preventDefault();
    });
    host.appendChild(el);
  }
}

function renderItems() {
  if (!layout) return;
  stageItems.innerHTML = "";
  for (const item of layout.items) {
    const el = document.createElement("button");
    el.type = "button";
    el.className = `le-item${item.id === selectedId ? " selected" : ""}`;
    el.dataset.id = item.id;
    applyItemPos(el, item);
    el.innerHTML = `<span class="tag">${item.label}</span><img src="${item.art}" alt="" draggable="false" />`;
    el.addEventListener("pointerdown", (e) => onItemDown(e, item.id));
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      selectedId = item.id;
      renderAll();
    });
    stageItems.appendChild(el);
    if (item.id === selectedId) mountHandles(el);
  }
}

function syncFields() {
  const item = selectedItem();
  if (!item) {
    fId.value = "";
    fLabel.value = "";
    fX.value = "";
    fY.value = "";
    fW.value = "";
    fAction.value = "";
    fAnchor.value = "bottom";
    fYLabel.textContent = yAxisLabel("bottom");
    return;
  }
  const v = itemVAnchor(item);
  fId.value = item.id;
  fLabel.value = item.label;
  fX.value = String(round1(item.x_pct));
  fY.value = String(round1(item.y_bottom_pct));
  fW.value = String(round1(item.w_pct));
  fAction.value = String(item.action);
  fAnchor.value = v;
  fYLabel.textContent = yAxisLabel(v);
}

function applyFieldsToItem() {
  const item = selectedItem();
  if (!item) return;
  item.label = fLabel.value.trim() || item.label;
  item.x_pct = clampPct(Number(fX.value) || 0);
  item.y_bottom_pct = clampPct(Number(fY.value) || 0);
  item.w_pct = clampPct(Number(fW.value) || 8, 2, 80);
  item.action = fAction.value.trim() || "NONE";
  item.v_anchor = (fAnchor.value as LayoutVAnchor) === "top" ? "top" : "bottom";
  if (item.v_anchor === "bottom") delete item.v_anchor;
  markDirty();
  renderItems();
  renderList();
  syncFields();
}

function applyWorldW() {
  if (!layout) return;
  const n = Math.round(Number(fWorldW.value) || 100);
  layout.world_w_pct = clampPct(n, 100, 300);
  viewLeftPct = clampViewLeft(viewLeftPct);
  markDirty();
  syncBoardChrome();
  renderAll();
}

function onItemDown(e: PointerEvent, id: string) {
  if (!layout) return;
  if ((e.target as HTMLElement).classList.contains("le-handle")) return;
  const item = layout.items.find((i) => i.id === id);
  if (!item) return;
  selectedId = id;
  drag = {
    mode: "move",
    id,
    startX: e.clientX,
    startY: e.clientY,
    origX: item.x_pct,
    origY: item.y_bottom_pct,
    vAnchor: itemVAnchor(item),
  };
  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  renderAll();
  e.preventDefault();
  e.stopPropagation();
}

function onStagePanDown(e: PointerEvent) {
  if (!layout || !layoutUsesPan(layout)) return;
  const t = e.target as HTMLElement;
  if (t.closest(".le-item")) return;
  drag = { mode: "pan", startX: e.clientX, origView: viewLeftPct };
  stage.setPointerCapture(e.pointerId);
  e.preventDefault();
}

function onPointerMove(e: PointerEvent) {
  if (!drag || !layout) return;
  const d = drag;
  const rect = stage.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return;

  if (d.mode === "pan") {
    const dx = ((e.clientX - d.startX) / rect.width) * 100;
    viewLeftPct = clampViewLeft(d.origView + dx);
    syncViewport();
    return;
  }

  if (d.mode === "resize") {
    const item = layout.items.find((i) => i.id === d.id);
    if (!item) return;
    const dx = ((e.clientX - d.startX) / rect.width) * 100;
    if (d.handle === "e") {
      item.w_pct = round1(clampPct(d.origW + dx * 2, 2, 80));
    } else {
      const nextW = round1(clampPct(d.origW - dx * 2, 2, 80));
      const dw = nextW - d.origW;
      item.w_pct = nextW;
      item.x_pct = round1(clampPct(d.origX - dw / 2));
    }
    markDirty();
    const el = stageItems.querySelector<HTMLElement>(`[data-id="${item.id}"]`);
    if (el) applyItemPos(el, item);
    if (selectedId === item.id) {
      fX.value = String(item.x_pct);
      fW.value = String(item.w_pct);
    }
    return;
  }

  const item = layout.items.find((i) => i.id === d.id);
  if (!item) return;
  const dx = ((e.clientX - d.startX) / rect.width) * 100;
  const dyScreen = ((e.clientY - d.startY) / rect.height) * 100;
  const dy = d.vAnchor === "top" ? dyScreen : -dyScreen;
  item.x_pct = round1(clampPct(d.origX + dx));
  item.y_bottom_pct = round1(clampPct(d.origY + dy));
  markDirty();
  const el = stageItems.querySelector<HTMLElement>(`[data-id="${item.id}"]`);
  if (el) applyItemPos(el, item);
  if (selectedId === item.id) {
    fX.value = String(item.x_pct);
    fY.value = String(item.y_bottom_pct);
  }
}

function onPointerUp() {
  if (!drag) return;
  const was = drag.mode;
  drag = null;
  if (was === "move" || was === "resize") renderList();
}

async function saveLayout() {
  if (!layout) return;
  layout.aspect = boardAspect;
  layout.anchor = "bottom-left";
  layout.world_w_pct = layoutWorldWPct(layout);
  layout.note =
    boardAspect === "9:16"
      ? "세로 셸 · 팬 월드(world_w_pct). 지면·캐릭·배는 하단 기준. 에디터: /layout-editor.html 보드=세로"
      : "지면·캐릭·배는 하단 기준. 상단 HUD/푯말은 v_anchor=top. 에디터: /layout-editor.html";
  const savePath = lobbyLayoutSavePath(boardAspect);
  const downloadName = boardAspect === "9:16" ? "lobby_layout_portrait.json" : "lobby_layout.json";
  try {
    const res = await fetch("/__layout_save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: savePath, json: layout }),
    });
    const data = (await res.json()) as { ok: boolean; error?: string; path?: string };
    if (!res.ok || !data.ok) throw new Error(data.error || `HTTP ${res.status}`);
    dirty = false;
    setStatus(`저장됨 → ${data.path}`, "ok");
  } catch (e) {
    const blob = new Blob([JSON.stringify(layout, null, 2) + "\n"], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = downloadName;
    a.click();
    URL.revokeObjectURL(a.href);
    setStatus(`서버 저장 실패 · JSON 다운로드함 (${String(e)})`, "err");
  }
}

async function ensureTuner(): Promise<Journey3DTuner> {
  if (tuner) return tuner;
  setStatus("3D 뷰 준비 중…");
  const t = new Journey3DTuner(j3dCanvas, j3dDials, {
    onStatus: (text, kind) => setStatus(text, kind),
    onDirty: () => markDirty(),
  });
  tuner = t;
  await t.init();
  j3dSector.innerHTML = t
    .sectorIds()
    .map(
      (id) =>
        `<option value="${id}"${id === t.currentSector() ? " selected" : ""}>${t.sectorLabel(id)}</option>`,
    )
    .join("");
  return t;
}

async function setScene(next: SceneId) {
  scene = next;
  const on3d = next === "journey3d";
  stage.hidden = on3d;
  stage3d.hidden = !on3d;
  sideLobby.hidden = on3d;
  side3d.hidden = !on3d;
  btnGrid.hidden = on3d;
  selAspect.hidden = on3d;
  for (const b of [j3dSector, btnJ3dPurified, btnJ3dView, btnJ3dReset]) b.hidden = !on3d;

  if (!on3d) {
    tuner?.setInputEnabled(false);
    setStatus("lobby 씬");
    return;
  }
  const t = await ensureTuner();
  t.setInputEnabled(true);
  t.resize();
}

sceneSelect.addEventListener("change", () => {
  void setScene(sceneSelect.value === "journey3d" ? "journey3d" : "lobby").catch((e) =>
    setStatus(String(e), "err"),
  );
});

selAspect.addEventListener("change", () => {
  if (dirty && !confirm("저장하지 않은 변경이 있습니다. 보드를 바꿀까요?")) {
    selAspect.value = boardAspect;
    return;
  }
  boardAspect = selAspect.value === "16:9" ? "16:9" : "9:16";
  void loadLayout().catch((e) => setStatus(String(e), "err"));
});

document.querySelector("#btnReload")!.addEventListener("click", () => {
  if (scene === "journey3d") {
    void tuner?.reload();
    return;
  }
  void loadLayout().catch((e) => setStatus(String(e), "err"));
});
document.querySelector("#btnSave")!.addEventListener("click", () => {
  if (scene === "journey3d") {
    void tuner?.save().then((ok) => {
      if (ok) dirty = false;
    });
    return;
  }
  void saveLayout();
});
btnGrid.addEventListener("click", () => {
  stageGrid.style.display = stageGrid.style.display === "none" ? "" : "none";
});

j3dSector.addEventListener("change", () => {
  void tuner?.applySector(j3dSector.value);
});
btnJ3dPurified.addEventListener("click", () => {
  const on = btnJ3dPurified.classList.toggle("primary");
  btnJ3dPurified.textContent = on ? "오염 전 아트" : "정화 후 아트";
  tuner?.setArtVariant(on);
});
btnJ3dView.addEventListener("click", () => {
  tuner?.toggleViewMode();
  btnJ3dView.textContent = tuner?.config().view_mode === "fps" ? "3인칭 전환" : "1인칭 전환";
});
btnJ3dReset.addEventListener("click", () => {
  tuner?.resetToDefaults();
});

window.addEventListener("resize", () => {
  if (scene === "journey3d") tuner?.resize();
});

for (const el of [fLabel, fX, fY, fW, fAction, fAnchor]) {
  el.addEventListener("change", applyFieldsToItem);
  el.addEventListener("keydown", (e) => {
    if ((e as KeyboardEvent).key === "Enter") applyFieldsToItem();
  });
}
fWorldW?.addEventListener("change", applyWorldW);

stage.addEventListener("pointerdown", onStagePanDown);
window.addEventListener("pointermove", onPointerMove);
window.addEventListener("pointerup", onPointerUp);
window.addEventListener("pointercancel", onPointerUp);
window.addEventListener("beforeunload", (e) => {
  if (dirty) {
    e.preventDefault();
    e.returnValue = "";
  }
});

selAspect.value = boardAspect;
syncBoardChrome();
void loadLayout().catch((e) => setStatus(String(e), "err"));
