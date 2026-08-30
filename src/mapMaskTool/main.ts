/**
 * 맵 마스크 툴
 * - 섬 마스터: Phase 0~4 단계로 레이아웃 → 구역 → 미리보기
 * - 섹터: 칸별 세부 레이어
 * npm run dev:mapmask → /map-mask-tool.html
 * 스펙: docs/superpowers/specs/2026-08-23-island-zone-placement.md
 */
import {
  emptyDoc,
  ACTIVE_LAYERS,
  LAYER_IDS,
  MASK_SIZE,
  MASTER_SIZE,
  MASTER_ID,
  MASTER_CELLS,
  MASTER_CELL_IDS,
  WALK_SECTORS,
  MASK_PHASES,
  ZONE_CELL_GUIDE,
  layerDef,
  type LayerId,
  type LayerDef,
  type MaskDoc,
  type MaskPhaseId,
  type MaskPhaseDef,
} from "./types";
import { ISLAND_MASK } from "../island/islandMapShared";
import { renderNeonPreview } from "./neonPreview";
import { renderImpressionPreview } from "./impressionPreview";
import { applyMemoryVeil } from "./memoryVeil";

const paint = document.querySelector<HTMLCanvasElement>("#paint")!;
const preview = document.querySelector<HTMLCanvasElement>("#preview")!;
const layerList = document.querySelector<HTMLElement>("#layerList")!;
const sectorSel = document.querySelector<HTMLSelectElement>("#sectorId")!;
const brushSize = document.querySelector<HTMLInputElement>("#brushSize")!;
const brushVal = document.querySelector<HTMLElement>("#brushVal")!;
const modeSel = document.querySelector<HTMLSelectElement>("#previewMode")!;
const statusEl = document.querySelector<HTMLElement>("#status")!;
const eraseToggle = document.querySelector<HTMLInputElement>("#erase")!;
const hintEl = document.querySelector<HTMLElement>("#toolHint")!;
const layerHint = document.querySelector<HTMLElement>("#layerHint")!;
const phaseBar = document.querySelector<HTMLElement>("#phaseBar")!;
const checklistEl = document.querySelector<HTMLElement>("#phaseChecklist")!;
const cellGuideEl = document.querySelector<HTMLElement>("#cellGuide")!;
const btnFillLand = document.querySelector<HTMLButtonElement>("#btnFillLand");

const SECTORS = ["i00", "i01", "i02", "i10", "i11", "i12", "i20", "i21", "i22"];

let active: LayerId = "land";
const layerCvs: Partial<Record<LayerId, HTMLCanvasElement>> = {};
let drawing = false;
let dirty = false;
let canvasSize = MASTER_SIZE;
let phaseId: MaskPhaseId = 0;

/** 틴트용 재사용 버퍼 (매 스트로크 createElement 금지) */
let tintBuf: HTMLCanvasElement | null = null;
/** 활성 레이어 제외 배경 캐시 */
let bgCache: HTMLCanvasElement | null = null;
let bgCacheKey = "";
let paintRaf = 0;
/** Phase 브러시 클립: rim / workzone 마스크 */
let rimClipCvs: HTMLCanvasElement | null = null;
let wzClipCvs: HTMLCanvasElement | null = null;
let clipKey = "";
/** 브러시 스탬프(클립용) */
let stampCvs: HTMLCanvasElement | null = null;

function isMaster(): boolean {
  return sectorSel.value === MASTER_ID;
}

function currentPhase(): MaskPhaseDef {
  return MASK_PHASES.find((p) => p.id === phaseId) ?? MASK_PHASES[0]!;
}

function editableLayers(): LayerDef[] {
  if (!isMaster()) return ACTIVE_LAYERS;
  return currentPhase()
    .edit.map((id) => layerDef(id))
    .filter((L): L is LayerDef => !!L);
}

function saveDir(): string {
  return isMaster() ? ISLAND_MASK.saveMasterFs : ISLAND_MASK.saveSectorFs;
}

function loadBase(): string {
  return isMaster() ? ISLAND_MASK.loadMasterUrl : ISLAND_MASK.loadSectorUrl;
}

function setStatus(t: string, kind: "" | "ok" | "err" = "") {
  statusEl.textContent = t;
  statusEl.className = `status${kind ? ` ${kind}` : ""}`;
}

function resizeCanvases(size: number) {
  canvasSize = size;
  paint.width = size;
  paint.height = size;
  preview.width = size;
  preview.height = size;
  paint.style.width = size > 512 ? "min(100%, 720px)" : "min(100%, 520px)";
  preview.style.width = paint.style.width;
  for (const id of LAYER_IDS) {
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    layerCvs[id] = c;
  }
  tintBuf = document.createElement("canvas");
  tintBuf.width = size;
  tintBuf.height = size;
  bgCache = document.createElement("canvas");
  bgCache.width = size;
  bgCache.height = size;
  bgCacheKey = "";
  rimClipCvs = document.createElement("canvas");
  rimClipCvs.width = size;
  rimClipCvs.height = size;
  wzClipCvs = document.createElement("canvas");
  wzClipCvs.width = size;
  wzClipCvs.height = size;
  stampCvs = document.createElement("canvas");
  stampCvs.width = size;
  stampCvs.height = size;
  clipKey = "";
}

function ensureLayers() {
  for (const id of LAYER_IDS) {
    if (layerCvs[id] && layerCvs[id]!.width === canvasSize) continue;
    const c = document.createElement("canvas");
    c.width = canvasSize;
    c.height = canvasSize;
    layerCvs[id] = c;
  }
}

function rebuildPhaseUi() {
  phaseBar.innerHTML = "";
  if (!isMaster()) {
    phaseBar.hidden = true;
    return;
  }
  phaseBar.hidden = false;
  for (const p of MASK_PHASES) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `phase-btn${p.id === phaseId ? " on" : ""}`;
    btn.textContent = p.label;
    btn.addEventListener("click", () => setPhase(p.id));
    phaseBar.appendChild(btn);
  }
}

function rebuildChecklist() {
  if (!isMaster()) {
    checklistEl.innerHTML = "<li>섹터 모드 — 마스터 Phase로 구역을 먼저 잡으세요.</li>";
    cellGuideEl.innerHTML = "";
    return;
  }
  const p = currentPhase();
  checklistEl.innerHTML = p.checklist.map((c) => `<li>${c}</li>`).join("");
  cellGuideEl.innerHTML = Object.entries(ZONE_CELL_GUIDE)
    .map(([id, text]) => `<div class="cell-row"><b>${id}</b> ${text}</div>`)
    .join("");
}

function setPhase(id: MaskPhaseId) {
  phaseId = id;
  const p = currentPhase();
  const edits = editableLayers();
  if (!edits.some((L) => L.id === active)) {
    active = edits[0]?.id ?? "land";
  }
  modeSel.disabled = isMaster() ? !p.previewModes : false;
  if (btnFillLand) btnFillLand.hidden = !(isMaster() && phaseId === 0);
  paint.style.cursor = p.paint ? "crosshair" : "default";
  rebuildPhaseUi();
  rebuildLayerUi();
  rebuildChecklist();
  hintEl.textContent = isMaster()
    ? phaseHint(p)
    : hintEl.textContent;
  invalidateBgCache();
  compositePaint({ heavyPreview: false });
}

function phaseHint(p: MaskPhaseDef): string {
  if (p.id === 1) return "Phase 1 · 외곽 숲/산 (밖만)";
  if (p.id === 2) return "Phase 2 · 숲 칠하면 그 자리 들판은 지워짐 · 저장 필수";
  if (p.id === 3) return "Phase 3 · 소프트 · 숲은 유지되고 위에 꽃/잔해만";
  if (p.id === 4) return "Phase 4 · 미리보기";
  return `마스터 · ${p.label}`;
}

function rebuildLayerUi() {
  layerList.innerHTML = "";
  const layers = editableLayers();
  if (!layers.some((L) => L.id === active) && layers.length) {
    active = layers[0]!.id;
  }
  for (const L of layers) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `layer-btn${L.id === active ? " on" : ""}`;
    btn.innerHTML = `<span class="swatch" style="background:${L.brush}"></span>${L.label}`;
    btn.addEventListener("click", () => {
      active = L.id;
      invalidateBgCache();
      rebuildLayerUi();
      compositePaint({ heavyPreview: false });
    });
    layerList.appendChild(btn);
  }
  if (!layers.length) {
    layerHint.textContent = "이 Phase는 편집 없음 · 미리보기만.";
  } else if (isMaster() && phaseId === 2) {
    layerHint.textContent = "숲 고르고 칠하면 들판은 자동으로 지워짐. 끝나면 저장.";
  } else if (isMaster() && phaseId === 1) {
    layerHint.textContent = "Phase 1 = 외곽(미니맵)만. 숲/산은 코너·테두리.";
  } else if (isMaster() && phaseId === 3) {
    layerHint.textContent = "소프트만 칠함. 숲은 그대로 보임(들판이 덮지 않음).";
  } else if (isMaster()) {
    layerHint.textContent = `${currentPhase().label}: 레이어 고른 뒤 드래그로 칠하세요.`;
  } else {
    layerHint.textContent = "섹터 세부 레이어. 마스터 Phase로 구역을 먼저.";
  }
}

function drawGrid(ctx: CanvasRenderingContext2D, size: number) {
  const cell = size / MASTER_CELLS;
  ctx.save();
  ctx.strokeStyle = "rgba(45, 224, 208, 0.55)";
  ctx.lineWidth = Math.max(1, size / 800);
  for (let i = 1; i < MASTER_CELLS; i++) {
    ctx.beginPath();
    ctx.moveTo(i * cell, 0);
    ctx.lineTo(i * cell, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * cell);
    ctx.lineTo(size, i * cell);
    ctx.stroke();
  }
  ctx.font = `bold ${Math.max(12, size / 64)}px monospace`;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const id = MASTER_CELL_IDS[row]![col]!;
      const walk = (WALK_SECTORS as readonly string[]).includes(id);
      ctx.fillStyle = walk ? "rgba(45,224,208,0.9)" : "rgba(140,160,180,0.75)";
      ctx.fillText(walk ? id : `${id}·미니맵`, col * cell + 10, row * cell + 22);
    }
  }
  ctx.restore();
}

function drawTintedLayer(
  ctx: CanvasRenderingContext2D,
  src: HTMLCanvasElement,
  color: string,
  alpha: number,
  size: number,
) {
  if (!tintBuf || tintBuf.width !== size) {
    tintBuf = document.createElement("canvas");
    tintBuf.width = size;
    tintBuf.height = size;
  }
  const t = tintBuf.getContext("2d")!;
  t.clearRect(0, 0, size, size);
  t.globalCompositeOperation = "source-over";
  t.drawImage(src, 0, 0);
  t.globalCompositeOperation = "source-in";
  t.fillStyle = color;
  t.fillRect(0, 0, size, size);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(tintBuf, 0, 0);
  ctx.restore();
}

/** 아래→위 표시/우선순위 (스펙: path > 수역 > rock > forest > flower) */
const DRAW_ORDER: LayerId[] = [
  "land",
  "walk",
  "flower",
  "forest",
  "rock",
  "pond",
  "lake",
  "debris",
  "blight",
  "path",
  "node",
  "village",
  "dock",
  "farm",
  "poi",
];

/** 칠할 때 같이 지울 아래 레이어 (숲이 들판을 덮게) */
const CLEAR_UNDER: Partial<Record<LayerId, LayerId[]>> = {
  path: ["rock", "forest", "flower", "debris", "blight", "lake", "pond"],
  lake: ["rock", "forest", "flower", "debris", "blight", "pond"],
  pond: ["rock", "forest", "flower", "debris", "blight"],
  rock: ["forest", "flower", "debris", "blight"],
  forest: ["flower", "debris", "blight"],
  flower: ["debris"],
  blight: ["debris", "flower"],
  debris: [],
};

function visibleLayerIds(includeActive: boolean): LayerId[] {
  if (!isMaster()) {
    return ACTIVE_LAYERS.map((L) => L.id).filter((id) => includeActive || id !== active);
  }
  const p = currentPhase();
  const ids = [...new Set([...p.ghost, ...p.edit])];
  const filtered = includeActive ? ids : ids.filter((id) => id !== active);
  return filtered.sort((a, b) => DRAW_ORDER.indexOf(a) - DRAW_ORDER.indexOf(b));
}

function rebuildBgCache() {
  const size = canvasSize;
  if (!bgCache || bgCache.width !== size) {
    bgCache = document.createElement("canvas");
    bgCache.width = size;
    bgCache.height = size;
  }
  const ctx = bgCache.getContext("2d")!;
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, size, size);
  for (const id of visibleLayerIds(false)) {
    const L = layerDef(id);
    const c = layerCvs[id];
    if (!L || !c) continue;
    const alpha = isMaster()
      ? currentPhase().ghost.includes(id)
        ? id === "land"
          ? 0.35
          : 0.28
        : 0.55
      : 0.4;
    drawTintedLayer(ctx, c, L.brush, alpha, size);
  }
  bgCacheKey = `${isMaster() ? "m" : "s"}:${phaseId}:${active}:${size}`;
}

function invalidateBgCache() {
  bgCacheKey = "";
}

function ensureClipMasks() {
  const size = canvasSize;
  const key = `${size}`;
  if (clipKey === key && rimClipCvs && wzClipCvs) return;
  if (!rimClipCvs || rimClipCvs.width !== size) {
    rimClipCvs = document.createElement("canvas");
    rimClipCvs.width = size;
    rimClipCvs.height = size;
  }
  if (!wzClipCvs || wzClipCvs.width !== size) {
    wzClipCvs = document.createElement("canvas");
    wzClipCvs.width = size;
    wzClipCvs.height = size;
  }
  const land = layerCvs.land;
  const walk = layerCvs.walk;
  const rim = rimClipCvs.getContext("2d")!;
  const wz = wzClipCvs.getContext("2d")!;
  rim.clearRect(0, 0, size, size);
  wz.clearRect(0, 0, size, size);
  if (land) {
    rim.drawImage(land, 0, 0);
    if (walk) {
      rim.globalCompositeOperation = "destination-out";
      rim.drawImage(walk, 0, 0);
      rim.globalCompositeOperation = "source-over";
    }
    wz.drawImage(land, 0, 0);
    if (walk) {
      wz.globalCompositeOperation = "destination-in";
      wz.drawImage(walk, 0, 0);
      wz.globalCompositeOperation = "source-over";
    } else {
      wz.clearRect(0, 0, size, size);
    }
  }
  clipKey = key;
}

function invalidateClipMasks() {
  clipKey = "";
}

function clipCanvasForPhase(): HTMLCanvasElement | null {
  if (!isMaster()) return null;
  const mode = currentPhase().paintClip;
  if (mode === "none") return null;
  ensureClipMasks();
  return mode === "rim" ? rimClipCvs : wzClipCvs;
}

function stampOntoLayer(x: number, y: number, rad: number, erase: boolean) {
  const c = layerCvs[active]!;
  const lctx = c.getContext("2d")!;
  const clip = erase ? null : clipCanvasForPhase();

  if (!clip) {
    lctx.save();
    if (erase) {
      lctx.globalCompositeOperation = "destination-out";
      lctx.fillStyle = "#fff";
    } else {
      lctx.globalCompositeOperation = "source-over";
      lctx.fillStyle = "#ffffff";
    }
    lctx.beginPath();
    lctx.arc(x, y, rad, 0, Math.PI * 2);
    lctx.fill();
    lctx.restore();
  } else {
    const size = canvasSize;
    if (!stampCvs || stampCvs.width !== size) {
      stampCvs = document.createElement("canvas");
      stampCvs.width = size;
      stampCvs.height = size;
    }
    const pad = Math.ceil(rad) + 2;
    const x0 = Math.max(0, Math.floor(x - pad));
    const y0 = Math.max(0, Math.floor(y - pad));
    const x1 = Math.min(size, Math.ceil(x + pad));
    const y1 = Math.min(size, Math.ceil(y + pad));
    const w = x1 - x0;
    const h = y1 - y0;
    if (w <= 0 || h <= 0) return;

    const s = stampCvs.getContext("2d")!;
    s.clearRect(x0, y0, w, h);
    s.fillStyle = "#ffffff";
    s.beginPath();
    s.arc(x, y, rad, 0, Math.PI * 2);
    s.fill();
    s.globalCompositeOperation = "destination-in";
    s.drawImage(clip, x0, y0, w, h, x0, y0, w, h);
    s.globalCompositeOperation = "source-over";

    lctx.drawImage(stampCvs, x0, y0, w, h, x0, y0, w, h);
  }

  // 숲 등 칠하면 아래 레이어(들판 등)를 같은 자리에서 지움 → 소프트/미리보기에서 안 덮임
  if (!erase) clearUnderBrush(x, y, rad, clip);
}

function clearUnderBrush(x: number, y: number, rad: number, clip: HTMLCanvasElement | null) {
  const victims = CLEAR_UNDER[active];
  if (!victims?.length) return;
  const size = canvasSize;
  if (!stampCvs || stampCvs.width !== size) {
    stampCvs = document.createElement("canvas");
    stampCvs.width = size;
    stampCvs.height = size;
  }
  const pad = Math.ceil(rad) + 2;
  const x0 = Math.max(0, Math.floor(x - pad));
  const y0 = Math.max(0, Math.floor(y - pad));
  const x1 = Math.min(size, Math.ceil(x + pad));
  const y1 = Math.min(size, Math.ceil(y + pad));
  const w = x1 - x0;
  const h = y1 - y0;
  if (w <= 0 || h <= 0) return;

  const s = stampCvs.getContext("2d")!;
  s.clearRect(x0, y0, w, h);
  s.fillStyle = "#ffffff";
  s.beginPath();
  s.arc(x, y, rad, 0, Math.PI * 2);
  s.fill();
  if (clip) {
    s.globalCompositeOperation = "destination-in";
    s.drawImage(clip, x0, y0, w, h, x0, y0, w, h);
    s.globalCompositeOperation = "source-over";
  }

  for (const id of victims) {
    const c = layerCvs[id];
    if (!c) continue;
    const g = c.getContext("2d")!;
    g.save();
    g.globalCompositeOperation = "destination-out";
    g.drawImage(stampCvs, x0, y0, w, h, x0, y0, w, h);
    g.restore();
  }
}

function compositePaint(opts?: { heavyPreview?: boolean }) {
  ensureLayers();
  const size = canvasSize;
  const ctx = paint.getContext("2d")!;
  const wantKey = `${isMaster() ? "m" : "s"}:${phaseId}:${active}:${size}`;
  if (bgCacheKey !== wantKey) rebuildBgCache();

  ctx.clearRect(0, 0, size, size);
  if (bgCache) ctx.drawImage(bgCache, 0, 0);

  // Phase 2: 작업구역을 밝게 표시 (어디를 칠하는지 보이게)
  if (isMaster() && phaseId === 2 && layerCvs.walk) {
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = "#2de0d0";
    ctx.globalCompositeOperation = "source-over";
    // walk ∩ land
    ensureClipMasks();
    if (wzClipCvs) ctx.drawImage(wzClipCvs, 0, 0);
    ctx.restore();
  }

  const L = layerDef(active);
  const c = layerCvs[active];
  if (L && c) drawTintedLayer(ctx, c, L.brush, 1, size);

  if (isMaster()) drawGrid(ctx, size);
  refreshPreview({ heavy: !!opts?.heavyPreview });
}

const conceptRef = document.querySelector<HTMLImageElement>("#conceptRef");
const conceptRefCap = document.querySelector<HTMLElement>("#conceptRefCap");

const CONCEPT_REFS: Record<string, { src: string; cap: string }> = {
  after: {
    src: "/map_mask_tool/refs/after_island_master_v4.png",
    cap: "정화후 v4. 마스크→미리보기는 구역 검증용. 확정 아트는 생성 폴더.",
  },
  before_neon: {
    src: "/map_mask_tool/refs/soos_minimap_neon_black.png",
    cap: "정화전 1 · 네온 미니맵. 나중에 1 vs 3 중 확정.",
  },
  before_veil: {
    src: "/map_mask_tool/refs/purify_before_A_memory_veil.png",
    cap: "정화전 3 · 물빛 베일. after에 필터(별도 18장 아님). 나중에 1 vs 3 중 확정.",
  },
};

function syncConceptRef() {
  const key = modeSel.value in CONCEPT_REFS ? modeSel.value : "after";
  const r = CONCEPT_REFS[key]!;
  if (conceptRef) conceptRef.src = r.src;
  if (conceptRefCap) conceptRefCap.textContent = r.cap;
}

function refreshPreview(opts?: { heavy?: boolean }) {
  const size = canvasSize;
  const ctx = preview.getContext("2d")!;
  if (preview.width !== size || preview.height !== size) {
    preview.width = size;
    preview.height = size;
  }

  if (drawing || !opts?.heavy) {
    ctx.drawImage(paint, 0, 0);
    return;
  }

  const mode = modeSel.value;
  const wantFancy =
    (!isMaster() || currentPhase().previewModes) &&
    (mode === "before_neon" || mode === "after" || mode === "before_veil");
  if (!wantFancy) {
    ctx.drawImage(paint, 0, 0);
    syncConceptRef();
    return;
  }

  if (mode === "before_neon") {
    renderNeonPreview(preview, layerCvs as Record<LayerId, HTMLCanvasElement>, {
      label: isMaster() ? "ISLAND MASTER" : `SECTOR ${sectorSel.value}`,
    });
  } else {
    renderImpressionPreview(preview, layerCvs as Record<LayerId, HTMLCanvasElement>);
    if (mode === "before_veil") applyMemoryVeil(preview);
  }
  syncConceptRef();
}

function brushAt(clientX: number, clientY: number) {
  if (isMaster() && !currentPhase().paint) return;
  if (isMaster() && !currentPhase().edit.includes(active)) return;
  const rect = paint.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * canvasSize;
  const y = ((clientY - rect.top) / rect.height) * canvasSize;
  const r = Number(brushSize.value) * (isMaster() ? 1.4 : 1);
  const rad = active === "path" ? Math.max(2, r * 0.45) : active === "walk" ? Math.max(4, r) : r;
  const erase = eraseToggle.checked;

  stampOntoLayer(x, y, rad, erase);
  dirty = true;
  if (active === "land" || active === "walk") invalidateClipMasks();

  const L = layerDef(active);
  const pctx = paint.getContext("2d")!;
  pctx.save();
  if (erase) {
    pctx.restore();
    if (!paintRaf) {
      paintRaf = requestAnimationFrame(() => {
        paintRaf = 0;
        compositePaint({ heavyPreview: false });
      });
    }
    return;
  }
  if (L) {
    const clip = clipCanvasForPhase();
    if (!clip) {
      pctx.globalCompositeOperation = "source-over";
      pctx.fillStyle = L.brush;
      pctx.beginPath();
      pctx.arc(x, y, rad, 0, Math.PI * 2);
      pctx.fill();
    } else {
      const size = canvasSize;
      if (!stampCvs || stampCvs.width !== size) {
        stampCvs = document.createElement("canvas");
        stampCvs.width = size;
        stampCvs.height = size;
      }
      const pad = Math.ceil(rad) + 2;
      const x0 = Math.max(0, Math.floor(x - pad));
      const y0 = Math.max(0, Math.floor(y - pad));
      const x1 = Math.min(size, Math.ceil(x + pad));
      const y1 = Math.min(size, Math.ceil(y + pad));
      const w = x1 - x0;
      const h = y1 - y0;
      if (w > 0 && h > 0) {
        const s = stampCvs.getContext("2d")!;
        s.clearRect(x0, y0, w, h);
        s.fillStyle = L.brush;
        s.beginPath();
        s.arc(x, y, rad, 0, Math.PI * 2);
        s.fill();
        s.globalCompositeOperation = "destination-in";
        s.drawImage(clip, x0, y0, w, h, x0, y0, w, h);
        s.globalCompositeOperation = "source-over";
        pctx.drawImage(stampCvs, x0, y0, w, h, x0, y0, w, h);
      }
    }
    preview.getContext("2d")!.drawImage(paint, 0, 0);
  }
  pctx.restore();
}

function pointerDown(e: PointerEvent) {
  if (isMaster() && !currentPhase().paint) return;
  drawing = true;
  paint.setPointerCapture(e.pointerId);
  // 스트로크 시작 시 배경+활성 1회 맞춤
  compositePaint({ heavyPreview: false });
  brushAt(e.clientX, e.clientY);
}
function pointerMove(e: PointerEvent) {
  if (!drawing) return;
  brushAt(e.clientX, e.clientY);
}
function pointerUp() {
  if (!drawing) return;
  drawing = false;
  if (paintRaf) {
    cancelAnimationFrame(paintRaf);
    paintRaf = 0;
  }
  invalidateBgCache();
  compositePaint({ heavyPreview: false });
}

/** 외곽선(또는 부분 면) → 닫힌 섬 면: 바깥 flood 후 나머지를 land로 */
function fillLandInterior() {
  const c = layerCvs.land!;
  const g = c.getContext("2d")!;
  const { width: w, height: h } = c;
  const img = g.getImageData(0, 0, w, h);
  const d = img.data;
  const solid = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) solid[i] = d[i * 4 + 3]! > 20 ? 1 : 0;

  const exterior = new Uint8Array(w * h);
  const stack: number[] = [];
  const push = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = y * w + x;
    if (exterior[i] || solid[i]) return;
    exterior[i] = 1;
    stack.push(i);
  };
  for (let x = 0; x < w; x++) {
    push(x, 0);
    push(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    push(0, y);
    push(w - 1, y);
  }
  while (stack.length) {
    const i = stack.pop()!;
    const x = i % w;
    const y = (i / w) | 0;
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }

  let filled = 0;
  for (let i = 0; i < w * h; i++) {
    if (!exterior[i]) {
      const o = i * 4;
      d[o] = 255;
      d[o + 1] = 255;
      d[o + 2] = 255;
      d[o + 3] = 255;
      filled++;
    } else if (!solid[i]) {
      d[i * 4 + 3] = 0;
    }
  }
  g.putImageData(img, 0, 0);
  dirty = true;
  invalidateClipMasks();
  invalidateBgCache();
  compositePaint({ heavyPreview: false });
  setStatus(`육지 면 채움 · ${filled.toLocaleString()}px (닫히지 않은 선이면 구멍이 남음)`, "ok");
}

async function onScopeChange() {
  const master = isMaster();
  resizeCanvases(master ? MASTER_SIZE : MASK_SIZE);
  brushSize.max = master ? "96" : "48";
  if (Number(brushSize.value) > Number(brushSize.max)) brushSize.value = brushSize.max;
  brushVal.textContent = brushSize.value;
  if (!master) {
    modeSel.disabled = false;
    if (btnFillLand) btnFillLand.hidden = true;
    hintEl.textContent = "섹터 칸 편집. 세부 타일 레이어.";
  }
  await loadDoc();
  setPhase(master ? phaseId : 0);
}

async function loadDoc() {
  ensureLayers();
  const id = sectorSel.value;
  const url = `${loadBase()}/${id}.mask.json?t=${Date.now()}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("없음");
    const doc = (await res.json()) as MaskDoc;
    for (const lid of LAYER_IDS) {
      const c = layerCvs[lid]!;
      const g = c.getContext("2d")!;
      g.clearRect(0, 0, canvasSize, canvasSize);
      const src = doc.layers[lid];
      if (!src) continue;
      await drawDataUrl(c, src);
    }
    dirty = false;
    setStatus(`로드됨 · ${id} (${canvasSize}px)`, "ok");
  } catch {
    for (const lid of LAYER_IDS) {
      layerCvs[lid]!.getContext("2d")!.clearRect(0, 0, canvasSize, canvasSize);
    }
    dirty = false;
    setStatus(`새 마스크 · ${id}`);
  }
  invalidateClipMasks();
  invalidateBgCache();
  compositePaint({ heavyPreview: false });
}

function drawDataUrl(c: HTMLCanvasElement, dataUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const g = c.getContext("2d")!;
      g.clearRect(0, 0, c.width, c.height);
      g.drawImage(img, 0, 0, c.width, c.height);
      resolve();
    };
    img.onerror = () => reject(new Error("img"));
    img.src = dataUrl;
  });
}

function exportDoc(): MaskDoc {
  const doc = emptyDoc(sectorSel.value, canvasSize);
  doc.note = isMaster()
    ? "섬 마스터. land=면, walk=작업구역(타일). 밖=미니맵·숲/산. 스펙: 2026-08-23-island-zone-placement"
    : doc.note;
  for (const lid of LAYER_IDS) {
    const c = layerCvs[lid]!;
    const g = c.getContext("2d")!;
    const data = g.getImageData(0, 0, canvasSize, canvasSize).data;
    let any = false;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i]! > 8) {
        any = true;
        break;
      }
    }
    if (any) doc.layers[lid] = c.toDataURL("image/png");
  }
  return doc;
}

function countLayerPixels(id: LayerId): number {
  const c = layerCvs[id];
  if (!c) return 0;
  const data = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
  let n = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i]! > 8) n++;
  return n;
}

async function saveDoc() {
  const doc = exportDoc();
  const path = `${saveDir()}/${doc.sector_id}.mask.json`;
  try {
    const res = await fetch("/__data_save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, text: JSON.stringify(doc, null, 2) + "\n" }),
    });
    const body = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok || !body.ok) throw new Error(body.error || `HTTP ${res.status}`);
    dirty = false;
    const forestPx = countLayerPixels("forest");
    setStatus(`저장됨 → ${path} · 숲 ${forestPx.toLocaleString()}px`, "ok");
  } catch (e) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" }));
    a.download = `${doc.sector_id}.mask.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setStatus(`서버 저장 실패 · JSON 내려받음 (${String(e)})`, "err");
  }
}

function clearActive() {
  if (isMaster() && !currentPhase().paint) return;
  if (isMaster() && !currentPhase().edit.includes(active)) return;
  layerCvs[active]!.getContext("2d")!.clearRect(0, 0, canvasSize, canvasSize);
  dirty = true;
  invalidateBgCache();
  compositePaint({ heavyPreview: false });
}

// boot
sectorSel.innerHTML =
  `<option value="${MASTER_ID}">★ 섬 마스터 (9등분)</option>` +
  SECTORS.map((s) => `<option value="${s}">${s}</option>`).join("");
sectorSel.value = MASTER_ID;

brushVal.textContent = brushSize.value;
brushSize.addEventListener("input", () => {
  brushVal.textContent = brushSize.value;
});
modeSel.addEventListener("change", () => {
  syncConceptRef();
  refreshPreview({ heavy: true });
});
sectorSel.addEventListener("change", () => void onScopeChange());
paint.addEventListener("pointerdown", pointerDown);
paint.addEventListener("pointermove", pointerMove);
paint.addEventListener("pointerup", pointerUp);
paint.addEventListener("pointercancel", pointerUp);
document.querySelector("#btnSave")!.addEventListener("click", () => void saveDoc());
document.querySelector("#btnLoad")!.addEventListener("click", () => void loadDoc());
document.querySelector("#btnClear")!.addEventListener("click", clearActive);
document.querySelector("#btnLand")?.addEventListener("click", () => {
  if (isMaster() && phaseId !== 0) setPhase(0);
  active = "land";
  invalidateBgCache();
  rebuildLayerUi();
  setStatus("섬 육지(면) 레이어");
  compositePaint({ heavyPreview: false });
});
btnFillLand?.addEventListener("click", fillLandInterior);
document.querySelector("#btnPreview")!.addEventListener("click", () => {
  invalidateBgCache();
  compositePaint({ heavyPreview: false });
  refreshPreview({ heavy: true });
});

void onScopeChange().then(() => {
  syncConceptRef();
});
window.addEventListener("beforeunload", (e) => {
  if (dirty) e.preventDefault();
});
