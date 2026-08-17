/**
 * 여정 HUD 배치 툴 — 필러(공간)에 위젯을 넣고 크기·노출·겹침을 조절한다.
 * URL: /hud-layout-tool.html
 */
import {
  HUD_LAYOUT_DEFAULTS,
  WIDGET_DEFS,
  boxesOverlap,
  clampPct,
  loadJourneyHudLayout,
  normalizeHudLayout,
  resolveRects,
  round1,
  saveJourneyHudLayout,
  squareH,
  widgetDef,
  type HudFlow,
  type HudPillar,
  type JourneyHudLayout,
  type ResolvedRect,
} from "../../hud/journeyHudLayout";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const stage = $<HTMLElement>("stage");
const layerPillars = $<HTMLElement>("layerPillars");
const layerWidgets = $<HTMLElement>("layerWidgets");
const stageGrid = $<HTMLElement>("stageGrid");
const pillarList = $<HTMLElement>("pillarList");
const widgetList = $<HTMLElement>("widgetList");
const inspector = $<HTMLElement>("inspector");
const statusEl = $<HTMLElement>("status");
const chkSnap = $<HTMLInputElement>("chkSnap");

type Sel = { kind: "pillar" | "widget"; id: string } | null;
type Handle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

let layout: JourneyHudLayout = JSON.parse(JSON.stringify(HUD_LAYOUT_DEFAULTS)) as JourneyHudLayout;
let sel: Sel = { kind: "pillar", id: "p_minimap" };
let dirty = false;
const undo: string[] = [];
const HANDLES: Handle[] = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];

type Drag =
  | {
      mode: "move" | "resize";
      handle?: Handle;
      kind: "pillar" | "widget";
      id: string;
      startX: number;
      startY: number;
      orig: { x: number; y: number; w: number; h: number };
    }
  | null;
let drag: Drag = null;

function setStatus(text: string, kind: "" | "ok" | "err" = "") {
  statusEl.textContent = text;
  statusEl.className = `status${kind ? ` ${kind}` : ""}`;
}

function pushUndo() {
  undo.push(JSON.stringify(layout));
  if (undo.length > 40) undo.shift();
}

function markDirty() {
  dirty = true;
  setStatus("수정됨 · 저장하세요");
}

function snap(n: number): number {
  const step = chkSnap.checked ? layout.snap || 0.5 : 0;
  if (step <= 0) return round1(n);
  return round1(Math.round(n / step) * step);
}

function boxStyle(r: { x: number; y: number; w: number; h: number; z?: number }): string {
  return `left:${r.x}%;top:${r.y}%;width:${r.w}%;height:${r.h}%;z-index:${r.z ?? 1}`;
}

function mockBody(id: string): string {
  switch (id) {
    case "party":
      return `<b>모험가 (나)</b><br />ATK 3.4K · DEF 900`;
    case "minimap":
      return `섹터 축소`;
    case "log":
      return `<b>구조 로그</b><br />라디오에 잠들었다<br />최대HP -5%`;
    case "activity":
      return `<b>현재 활동</b><br />버튼을 눌러 계속`;
    case "compass":
      return `W · N · E`;
    case "header_brand":
      return `🌈 무지개섬`;
    case "header_area":
      return `<small>현재 지역</small><b>스테이지 1</b>`;
    case "header_hp":
      return `❤ 18K/18K`;
    case "header_gold":
      return `💎 0`;
    case "main_btn":
      return `<b>다음날</b>`;
    case "gauge_jackpot":
      return `💎<b>대박</b><small>0/7</small>`;
    case "gauge_mid":
      return `🫧<b>중박</b><small>1/12</small>`;
    case "roadmap":
      return `6일차`;
    case "catalyst":
      return `촉매`;
    default:
      return widgetDef(id)?.label ?? id;
  }
}

function clashIds(rects: Map<string, ResolvedRect>): Set<string> {
  const ids = [...rects.keys()].filter((id) => rects.get(id)?.visible);
  const bad = new Set<string>();
  for (let i = 0; i < ids.length; i++) {
    const a = rects.get(ids[i])!;
    if (a.overlap) continue;
    for (let j = 0; j < ids.length; j++) {
      if (i === j) continue;
      const b = rects.get(ids[j])!;
      if (boxesOverlap(a, b)) bad.add(ids[i]);
    }
  }
  return bad;
}

function render() {
  const rects = resolveRects(layout);
  const clash = clashIds(rects);

  layerPillars.innerHTML = "";
  for (const p of layout.pillars) {
    const el = document.createElement("div");
    el.className = `hud-p${p.visible ? "" : " off"}${sel?.kind === "pillar" && sel.id === p.id ? " sel" : ""}`;
    el.dataset.kind = "pillar";
    el.dataset.id = p.id;
    el.setAttribute("style", boxStyle({ x: p.x_pct, y: p.y_pct, w: p.w_pct, h: p.h_pct, z: p.z }));
    el.innerHTML = `<span class="p-tag">${p.label}</span>`;
    el.addEventListener("pointerdown", (e) => onDown(e, "pillar", p.id));
    layerPillars.appendChild(el);
    if (sel?.kind === "pillar" && sel.id === p.id) mountHandles(el);
  }

  layerWidgets.innerHTML = "";
  for (const w of layout.widgets) {
    const def = widgetDef(w.id)!;
    const r = rects.get(w.id)!;
    if (!w.visible || !r.visible) continue;
    const el = document.createElement("div");
    el.className = `hud-w${sel?.kind === "widget" && sel.id === w.id ? " sel" : ""}${clash.has(w.id) ? " clash" : ""}${def.id === "minimap" ? " mock-map" : ""}${def.compact ? " compact" : ""}`;
    el.dataset.kind = "widget";
    el.dataset.id = w.id;
    el.setAttribute(
      "style",
      `${boxStyle(r)}background:${def.tone}`,
    );
    el.innerHTML = def.compact
      ? `<div class="w-body compact">${mockBody(w.id)}</div>`
      : `<div class="w-head">${def.label}${w.pillar_id ? "" : " · 자유"}</div><div class="w-body">${mockBody(w.id)}</div>`;
    el.addEventListener("pointerdown", (e) => onDown(e, "widget", w.id));
    layerWidgets.appendChild(el);
    if (sel?.kind === "widget" && sel.id === w.id) mountHandles(el);
  }

  renderLists();
  renderInspector();
}

function mountHandles(host: HTMLElement) {
  for (const h of HANDLES) {
    const d = document.createElement("div");
    d.className = `handle ${h}`;
    d.dataset.handle = h;
    d.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      const kind = host.dataset.kind as "pillar" | "widget";
      const id = host.dataset.id!;
      onDown(e, kind, id, h);
    });
    host.appendChild(d);
  }
}

function renderLists() {
  pillarList.innerHTML = layout.pillars
    .map((p) => {
      const n = layout.widgets.filter((w) => w.pillar_id === p.id && w.visible).length;
      return `<label class="item${sel?.kind === "pillar" && sel.id === p.id ? " on" : ""}">
        <input type="checkbox" data-pv="${p.id}" ${p.visible ? "checked" : ""} />
        <div>${p.label}<span>${p.flow} · 위젯 ${n} · ${p.w_pct.toFixed(0)}×${p.h_pct.toFixed(0)}%</span></div>
        <button type="button" data-psel="${p.id}">선택</button>
      </label>`;
    })
    .join("");
  pillarList.querySelectorAll<HTMLInputElement>("[data-pv]").forEach((c) => {
    c.addEventListener("change", () => {
      const p = layout.pillars.find((x) => x.id === c.dataset.pv);
      if (!p) return;
      pushUndo();
      p.visible = c.checked;
      markDirty();
      render();
    });
  });
  pillarList.querySelectorAll<HTMLButtonElement>("[data-psel]").forEach((b) => {
    b.addEventListener("click", () => {
      sel = { kind: "pillar", id: b.dataset.psel! };
      render();
    });
  });

  widgetList.innerHTML = layout.widgets
    .map((w) => {
      const def = widgetDef(w.id)!;
      const host = w.pillar_id
        ? layout.pillars.find((p) => p.id === w.pillar_id)?.label ?? w.pillar_id
        : "자유";
      return `<label class="item${sel?.kind === "widget" && sel.id === w.id ? " on" : ""}">
        <input type="checkbox" data-wv="${w.id}" ${w.visible ? "checked" : ""} />
        <div>${def.label}<span>${host}${w.overlap ? "" : " · 겹침금지"}</span></div>
        <button type="button" data-wsel="${w.id}">선택</button>
      </label>`;
    })
    .join("");
  widgetList.querySelectorAll<HTMLInputElement>("[data-wv]").forEach((c) => {
    c.addEventListener("change", () => {
      const w = layout.widgets.find((x) => x.id === c.dataset.wv);
      if (!w) return;
      pushUndo();
      w.visible = c.checked;
      markDirty();
      render();
    });
  });
  widgetList.querySelectorAll<HTMLButtonElement>("[data-wsel]").forEach((b) => {
    b.addEventListener("click", () => {
      sel = { kind: "widget", id: b.dataset.wsel! };
      render();
    });
  });
}

function numField(id: string, label: string, value: number, step = 0.1): string {
  return `<div class="field"><label>${label}</label><input id="${id}" type="number" step="${step}" value="${value}" /></div>`;
}

function renderInspector() {
  if (!sel) {
    inspector.innerHTML = `<div class="help">필러나 위젯을 고르세요.</div>`;
    return;
  }
  if (sel.kind === "pillar") {
    const p = layout.pillars.find((x) => x.id === sel!.id);
    if (!p) return;
    inspector.innerHTML = `
      ${numField("fX", "x %", p.x_pct)}${numField("fY", "y %", p.y_pct)}
      <div class="grid2">${numField("fW", "너비 %", p.w_pct)}${numField("fH", "높이 %", p.h_pct)}</div>
      <div class="field"><label>이름</label><input id="fLabel" value="${p.label}" /></div>
      <div class="field"><label>흐름</label>
        <select id="fFlow">
          <option value="fill"${p.flow === "fill" ? " selected" : ""}>fill · 칸을 채움</option>
          <option value="overlay"${p.flow === "overlay" ? " selected" : ""}>overlay · 칸 안 겹침</option>
          <option value="row"${p.flow === "row" ? " selected" : ""}>row · 가로 분할</option>
          <option value="stack"${p.flow === "stack" ? " selected" : ""}>stack · 세로 분할</option>
        </select>
      </div>
      <label class="chk"><input type="checkbox" id="fVis" ${p.visible ? "checked" : ""} /> 필러 보이기</label>
      <div class="row"><button type="button" id="btnDelP">이 필러 삭제</button></div>
    `;
    bindInspector();
    return;
  }
  const w = layout.widgets.find((x) => x.id === sel!.id);
  const def = w ? widgetDef(w.id) : null;
  if (!w || !def) return;
  const pillars = layout.pillars
    .map((p) => `<option value="${p.id}"${w.pillar_id === p.id ? " selected" : ""}>${p.label}</option>`)
    .join("");
  inspector.innerHTML = `
    <div class="field"><label>${def.label}</label><span style="color:var(--muted);font-size:11px">${def.hint}</span></div>
    <div class="field"><label>넣을 필러</label>
      <select id="fPillar">
        <option value="">(자유 배치)</option>
        ${pillars}
      </select>
    </div>
    ${numField("fX", "x %", w.x_pct)}${numField("fY", "y %", w.y_pct)}
    <div class="grid2">${numField("fW", "너비 %", w.w_pct)}${numField("fH", "높이 %", w.h_pct)}</div>
    <label class="chk"><input type="checkbox" id="fVis" ${w.visible ? "checked" : ""} /> 노출</label>
    <label class="chk"><input type="checkbox" id="fOver" ${w.overlap ? "checked" : ""} /> 겹침 허용</label>
    <label class="chk"><input type="checkbox" id="fLock" ${w.lock ? "checked" : ""} /> 잠금</label>
    <label class="chk"><input type="checkbox" id="fSq" ${w.keep_square ? "checked" : ""} /> 정사각 유지</label>
    ${numField("fZ", "z (앞뒤)", w.z, 1)}
  `;
  bindInspector();
}

function bindInspector() {
  const read = () => {
    if (!sel) return;
    pushUndo();
    if (sel.kind === "pillar") {
      const p = layout.pillars.find((x) => x.id === sel!.id);
      if (!p) return;
      const x = $("fX") as HTMLInputElement;
      p.x_pct = snap(clampPct(Number(x.value) || 0));
      p.y_pct = snap(clampPct(Number(($("fY") as HTMLInputElement).value) || 0));
      p.w_pct = snap(clampPct(Number(($("fW") as HTMLInputElement).value) || 4, 2, 100));
      p.h_pct = snap(clampPct(Number(($("fH") as HTMLInputElement).value) || 4, 2, 100));
      p.label = ($("fLabel") as HTMLInputElement).value.trim() || p.label;
      p.flow = ($("fFlow") as HTMLSelectElement).value as HudFlow;
      p.visible = ($("fVis") as HTMLInputElement).checked;
    } else {
      const w = layout.widgets.find((x) => x.id === sel!.id);
      if (!w) return;
      const pid = ($("fPillar") as HTMLSelectElement).value;
      w.pillar_id = pid || null;
      w.x_pct = snap(clampPct(Number(($("fX") as HTMLInputElement).value) || 0));
      w.y_pct = snap(clampPct(Number(($("fY") as HTMLInputElement).value) || 0));
      w.w_pct = snap(clampPct(Number(($("fW") as HTMLInputElement).value) || 4, 1, 100));
      w.h_pct = snap(clampPct(Number(($("fH") as HTMLInputElement).value) || 4, 1, 100));
      w.visible = ($("fVis") as HTMLInputElement).checked;
      w.overlap = ($("fOver") as HTMLInputElement).checked;
      w.lock = ($("fLock") as HTMLInputElement).checked;
      w.keep_square = ($("fSq") as HTMLInputElement).checked;
      w.z = Number(($("fZ") as HTMLInputElement).value) || 1;
      if (w.keep_square && !w.pillar_id) w.h_pct = squareH(w.w_pct);
    }
    markDirty();
    render();
  };
  inspector.querySelectorAll("input, select").forEach((el) => {
    el.addEventListener("change", read);
  });
  inspector.querySelector("#btnDelP")?.addEventListener("click", () => {
    if (!sel || sel.kind !== "pillar") return;
    const id = sel.id;
    pushUndo();
    const rects = resolveRects(layout);
    for (const w of layout.widgets) {
      if (w.pillar_id !== id) continue;
      const r = rects.get(w.id);
      w.pillar_id = null;
      if (r?.visible) {
        w.x_pct = r.x;
        w.y_pct = r.y;
        w.w_pct = r.w;
        w.h_pct = r.h;
      }
    }
    layout.pillars = layout.pillars.filter((x) => x.id !== id);
    sel = layout.pillars[0] ? { kind: "pillar", id: layout.pillars[0].id } : null;
    markDirty();
    render();
  });
}

function targetBox(kind: "pillar" | "widget", id: string): { x: number; y: number; w: number; h: number } | null {
  if (kind === "pillar") {
    const p = layout.pillars.find((x) => x.id === id);
    return p ? { x: p.x_pct, y: p.y_pct, w: p.w_pct, h: p.h_pct } : null;
  }
  const r = resolveRects(layout).get(id);
  if (!r?.visible) {
    const w = layout.widgets.find((x) => x.id === id);
    return w ? { x: w.x_pct, y: w.y_pct, w: w.w_pct, h: w.h_pct } : null;
  }
  return { x: r.x, y: r.y, w: r.w, h: r.h };
}

function writeBox(kind: "pillar" | "widget", id: string, box: { x: number; y: number; w: number; h: number }) {
  if (kind === "pillar") {
    const p = layout.pillars.find((x) => x.id === id);
    if (!p) return;
    p.x_pct = snap(clampPct(box.x));
    p.y_pct = snap(clampPct(box.y));
    p.w_pct = snap(clampPct(box.w, 2, 100));
    p.h_pct = snap(clampPct(box.h, 2, 100));
    return;
  }
  const w = layout.widgets.find((x) => x.id === id);
  if (!w || w.lock) return;
  const pillar = w.pillar_id ? layout.pillars.find((p) => p.id === w.pillar_id) : null;
  if (pillar && pillar.flow === "fill") {
    pillar.x_pct = snap(clampPct(box.x));
    pillar.y_pct = snap(clampPct(box.y));
    pillar.w_pct = snap(clampPct(box.w, 2, 100));
    pillar.h_pct = snap(clampPct(box.h, 2, 100));
    return;
  }
  if (pillar && (pillar.flow === "overlay" || pillar.flow === "row" || pillar.flow === "stack")) {
    const pw = Math.max(1, pillar.w_pct);
    const ph = Math.max(1, pillar.h_pct);
    w.x_pct = snap(clampPct(((box.x - pillar.x_pct) / pw) * 100));
    w.y_pct = snap(clampPct(((box.y - pillar.y_pct) / ph) * 100));
    w.w_pct = snap(clampPct((box.w / pw) * 100, 1, 100));
    w.h_pct = snap(clampPct((box.h / ph) * 100, 1, 100));
    return;
  }
  w.x_pct = snap(clampPct(box.x));
  w.y_pct = snap(clampPct(box.y));
  w.w_pct = snap(clampPct(box.w, 1, 100));
  w.h_pct = snap(clampPct(box.h, 1, 100));
  if (w.keep_square) w.h_pct = squareH(w.w_pct);
}

function onDown(e: PointerEvent, kind: "pillar" | "widget", id: string, handle?: Handle) {
  if ((e.target as HTMLElement).tagName === "INPUT") return;
  const w = kind === "widget" ? layout.widgets.find((x) => x.id === id) : null;
  if (w?.lock && !handle) return;
  const orig = targetBox(kind, id);
  if (!orig) return;
  sel = { kind, id };
  pushUndo();
  drag = {
    mode: handle ? "resize" : "move",
    handle,
    kind,
    id,
    startX: e.clientX,
    startY: e.clientY,
    orig: { ...orig },
  };
  (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  e.preventDefault();
  render();
}

function applyDelta(dx: number, dy: number) {
  if (!drag) return;
  const o = drag.orig;
  let x = o.x;
  let y = o.y;
  let w = o.w;
  let h = o.h;
  if (drag.mode === "move") {
    x = o.x + dx;
    y = o.y + dy;
  } else {
    const hd = drag.handle!;
    if (hd.includes("e")) w = o.w + dx;
    if (hd.includes("s")) h = o.h + dy;
    if (hd.includes("w")) {
      x = o.x + dx;
      w = o.w - dx;
    }
    if (hd.includes("n")) {
      y = o.y + dy;
      h = o.h - dy;
    }
  }
  if (w < 2) w = 2;
  if (h < 2) h = 2;
  writeBox(drag.kind, drag.id, { x, y, w, h });
}

function onMove(e: PointerEvent) {
  if (!drag) return;
  const rect = stage.getBoundingClientRect();
  if (rect.width <= 0) return;
  const dx = ((e.clientX - drag.startX) / rect.width) * 100;
  const dy = ((e.clientY - drag.startY) / rect.height) * 100;
  applyDelta(dx, dy);
  markDirty();
  render();
}

function onUp() {
  drag = null;
}

async function doSave() {
  const res = await saveJourneyHudLayout(layout);
  dirty = !res.ok;
  setStatus(res.message, res.ok ? "ok" : "err");
}

function doUndo() {
  const prev = undo.pop();
  if (!prev) return;
  layout = normalizeHudLayout(JSON.parse(prev));
  markDirty();
  render();
}

function addPillar() {
  pushUndo();
  const n = layout.pillars.length + 1;
  const p: HudPillar = {
    id: `p_user_${Date.now().toString(36)}`,
    label: `필러 ${n}`,
    visible: true,
    x_pct: 30,
    y_pct: 30,
    w_pct: 20,
    h_pct: 18,
    z: 4,
    flow: "fill",
  };
  layout.pillars.push(p);
  sel = { kind: "pillar", id: p.id };
  markDirty();
  render();
}

$("btnPillar").addEventListener("click", addPillar);
$("btnGrid").addEventListener("click", () => {
  stageGrid.style.display = stageGrid.style.display === "none" ? "" : "none";
});
$("btnUndo").addEventListener("click", doUndo);
$("btnReset").addEventListener("click", () => {
  pushUndo();
  layout = JSON.parse(JSON.stringify(HUD_LAYOUT_DEFAULTS)) as JourneyHudLayout;
  sel = { kind: "pillar", id: "p_minimap" };
  markDirty();
  render();
});
$("btnReload").addEventListener("click", () => void boot());
$("btnSave").addEventListener("click", () => void doSave());
chkSnap.addEventListener("change", () => render());

stage.addEventListener("pointermove", onMove);
window.addEventListener("pointerup", onUp);
window.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
    e.preventDefault();
    void doSave();
    return;
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
    e.preventDefault();
    doUndo();
    return;
  }
  if (!sel) return;
  const step = e.shiftKey ? 2 : 0.5;
  const box = targetBox(sel.kind, sel.id);
  if (!box) return;
  let used = true;
  if (e.key === "ArrowLeft") box.x -= step;
  else if (e.key === "ArrowRight") box.x += step;
  else if (e.key === "ArrowUp") box.y -= step;
  else if (e.key === "ArrowDown") box.y += step;
  else used = false;
  if (!used) return;
  e.preventDefault();
  pushUndo();
  writeBox(sel.kind, sel.id, box);
  markDirty();
  render();
});

async function boot() {
  layout = await loadJourneyHudLayout();
  dirty = false;
  setStatus("불러옴", "ok");
  render();
}

void boot();
