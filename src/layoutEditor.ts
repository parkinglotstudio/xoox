/**
 * 레이아웃 에디터 — 16:9 · 하단/상단 앵커 · 드래그 저장
 * URL: /layout-editor.html
 *
 * 씬은 둘이다.
 * - lobby     : 무지개섬 아트 슬롯을 드래그로 배치 → lobby_layout.json
 * - journey3d : 3D 여정 뷰를 걸어 다니며 카메라·안개·스케일을 맞춤 → journey3d_layout.json
 *
 * 3D 쪽 다이얼은 Journey3DTuner가 통째로 들고 있다(fpv-tool과 공유).
 * 여기서는 씬을 갈아 끼우고 저장 버튼만 나눠 준다.
 */
import type { LayoutItem, LayoutVAnchor, SceneLayout } from "./layoutTypes";
import { LAYOUT_URL, clampPct, itemVAnchor, layoutItemStyle } from "./layoutTypes";
import { Journey3DTuner } from "./stage/world3d/Journey3DTuner";

const stage = document.querySelector<HTMLElement>("#stage")!;
const stageBg = document.querySelector<HTMLImageElement>("#stageBg")!;
const stageItems = document.querySelector<HTMLElement>("#stageItems")!;
const stageGrid = document.querySelector<HTMLElement>("#stageGrid")!;
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

const sceneSelect = document.querySelector<HTMLSelectElement>("#sceneSelect")!;
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
let scene: SceneId = "lobby";
let tuner: Journey3DTuner | null = null;

let layout: SceneLayout | null = null;
let selectedId: string | null = null;
let dirty = false;

type DragState = {
  id: string;
  startX: number;
  startY: number;
  origX: number;
  origY: number;
  vAnchor: LayoutVAnchor;
};
let drag: DragState | null = null;

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

async function loadLayout() {
  const res = await fetch(`${LAYOUT_URL}?t=${Date.now()}`);
  if (!res.ok) throw new Error(`load failed ${res.status}`);
  layout = (await res.json()) as SceneLayout;
  selectedId = layout.items[0]?.id ?? null;
  dirty = false;
  renderAll();
  setStatus("불러옴", "ok");
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
}

function renderList() {
  if (!layout) return;
  itemList.innerHTML = layout.items
    .map(
      (i) =>
        `<button type="button" data-id="${i.id}" class="${i.id === selectedId ? "on" : ""}">
          ${i.label}${itemVAnchor(i) === "top" ? " · TOP" : ""}
          <span>${i.id} · x ${i.x_pct.toFixed(1)} · ${listYHint(i)} · w ${i.w_pct}</span>
        </button>`
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
    el.addEventListener("pointerdown", (e) => onPointerDown(e, item.id));
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      selectedId = item.id;
      renderAll();
    });
    stageItems.appendChild(el);
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
  if (item.v_anchor === "bottom") delete item.v_anchor; // 기본값 생략
  markDirty();
  renderItems();
  renderList();
  syncFields();
}

function onPointerDown(e: PointerEvent, id: string) {
  if (!layout) return;
  const item = layout.items.find((i) => i.id === id);
  if (!item) return;
  selectedId = id;
  drag = {
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
}

function onPointerMove(e: PointerEvent) {
  if (!drag || !layout) return;
  const item = layout.items.find((i) => i.id === drag!.id);
  if (!item) return;
  const rect = stage.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return;
  const dx = ((e.clientX - drag.startX) / rect.width) * 100;
  // bottom: 위로 드래그 = y 증가 / top: 아래로 드래그 = y 증가
  const dyScreen = ((e.clientY - drag.startY) / rect.height) * 100;
  const dy = drag.vAnchor === "top" ? dyScreen : -dyScreen;
  item.x_pct = round1(clampPct(drag.origX + dx));
  item.y_bottom_pct = round1(clampPct(drag.origY + dy));
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
  drag = null;
  renderList();
}

async function saveLayout() {
  if (!layout) return;
  layout.note =
    "지면·캐릭·배는 하단 기준. 상단 HUD/푯말은 v_anchor=top. 에디터: /layout-editor.html";
  layout.aspect = "16:9";
  layout.anchor = "bottom-left";
  try {
    const res = await fetch("/__layout_save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "data/ui/layout/lobby_layout.json",
        json: layout,
      }),
    });
    const data = (await res.json()) as { ok: boolean; error?: string; path?: string };
    if (!res.ok || !data.ok) throw new Error(data.error || `HTTP ${res.status}`);
    dirty = false;
    setStatus(`저장됨 → ${data.path}`, "ok");
  } catch (e) {
    const blob = new Blob([JSON.stringify(layout, null, 2) + "\n"], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "lobby_layout.json";
    a.click();
    URL.revokeObjectURL(a.href);
    setStatus(`서버 저장 실패 · JSON 다운로드함 (${String(e)})`, "err");
  }
}

// ── 씬 전환 ────────────────────────────────────────────────────────

/**
 * 3D 튜너는 WebGL 컨텍스트를 쥐므로 journey3d 씬을 처음 열 때만 만든다.
 * 로비만 만지는 사람에겐 3D 비용이 전혀 들지 않는다.
 */
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
  for (const b of [j3dSector, btnJ3dPurified, btnJ3dView, btnJ3dReset]) b.hidden = !on3d;

  if (!on3d) {
    // 배경에서 계속 키 입력을 먹지 않도록 3D를 재운다
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

// ── 상단 바 — 씬에 따라 갈라진다 ────────────────────────────────────

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

window.addEventListener("pointermove", onPointerMove);
window.addEventListener("pointerup", onPointerUp);
window.addEventListener("pointercancel", onPointerUp);
window.addEventListener("beforeunload", (e) => {
  if (dirty) {
    e.preventDefault();
    e.returnValue = "";
  }
});

void loadLayout().catch((e) => setStatus(String(e), "err"));
