/**
 * 맵 배치 — 섬 개요 · NPC 자리 · 정화 전후 · 동선
 * npm run dev:map → /sector-editor.html
 * 배치는 NPC(area_npc_config)만. 데코 아트는 별도.
 */
import { paintSectorFloorUrl, SPLAT_LAND_IDS } from "./stage/world3d/islandFloorSplat";
import { spawnPctInArea } from "./stage/spawnStart";
type ScaleConfig = {
  character_height_m: number;
  island_world_m: number;
  island_usable_land_m?: number;
  sector_world_h_m: number;
  sector_world_w_m: number;
  viewport_world_h_m: number;
  viewport_world_w_m: number;
  map_actor_h_px: number;
  sectors?: Record<
    string,
    { label: string; map: string; map_before?: string; world_h_pct: number }
  >;
};

type NpcRow = {
  npc_id: string;
  area_id: string;
  x_pct: number;
  y_pct: number;
  icon: string;
  label: string;
  trigger_type: string;
  trigger_ref: string;
  appear_condition: string;
  flavor_text: string;
  zone_id: string;
  raw: string[];
};

type ZoneRow = {
  zone_id: string;
  area_id: string;
  x_pct: number;
  y_pct: number;
  r_pct: number;
  beat_id: string;
  label: string;
};

type ConnRow = {
  from: string;
  to: string;
};

const CSV_PATH = "data/area_npc_config.csv";
const CONN_URL = "/area_connection_config.csv";
const ZONE_URL = "/area_zone_config.csv";
const SCALE_URL = "/ui/layout/sector_scale.json";
const ISLAND_MAP = "/ui/journey/island_overview_1km.png";
/** 원본 컨셉 · 정화전(타일+하얗게) · 정화후(타일) */
type ArtMode = "concept" | "polluted" | "purified";
let artMode: ArtMode = "polluted";
let artBust = Date.now();
const floorUrls = new Map<string, string>();
let floorBusy = false;
const AREA_ORDER = [
  "area_i00",
  "area_i01",
  "area_i02",
  "area_i10",
  "area_i11",
  "area_i12",
  "area_i20",
  "area_i21",
  "area_i22",
];

const mapBg = document.querySelector<HTMLImageElement>("#mapBg")!;
const mapStage = document.querySelector<HTMLElement>("#mapStage")!;
const mapOverlay = document.querySelector<HTMLElement>("#mapOverlay")!;
const phoneStage = document.querySelector<HTMLElement>("#phoneStage")!;
const phoneBgHost = document.querySelector<HTMLElement>("#phoneBgHost")!;
const phoneNodes = document.querySelector<HTMLElement>("#phoneNodes")!;
const phoneChar = document.querySelector<HTMLElement>("#phoneChar")!;
const phoneSub = document.querySelector<HTMLElement>("#phoneSub")!;
const artModeSel = document.querySelector<HTMLSelectElement>("#artMode")!;
const nodeList = document.querySelector<HTMLElement>("#nodeList")!;
const nodeCount = document.querySelector<HTMLElement>("#nodeCount")!;
const scaleBox = document.querySelector<HTMLElement>("#scaleBox")!;
const infoCard = document.querySelector<HTMLElement>("#infoCard")!;
const statusEl = document.querySelector<HTMLElement>("#status")!;
const fId = document.querySelector<HTMLInputElement>("#fId")!;
const fArea = document.querySelector<HTMLSelectElement>("#fArea")!;
const fX = document.querySelector<HTMLInputElement>("#fX")!;
const fY = document.querySelector<HTMLInputElement>("#fY")!;
const sizeSlider = document.querySelector<HTMLInputElement>("#sizeSlider")!;
const sizeVal = document.querySelector<HTMLElement>("#sizeVal")!;
const showPathEl = document.querySelector<HTMLInputElement>("#showPath")!;

let scale: ScaleConfig | null = null;
let header = "";
let rows: NpcRow[] = [];
let zones: ZoneRow[] = [];
let connections: ConnRow[] = [];
let selectedId: string | null = null;
let dirty = false;
let actorHpx = 36;
/** 뷰포트 왼쪽·위 (섬 %) */
let viewXPct = 44;
let viewYPct = 70;

type Drag =
  | { kind: "view"; startX: number; startY: number; origX: number; origY: number }
  | { kind: "phone-node"; id: string; startX: number; startY: number; origLX: number; origLY: number };
let drag: Drag | null = null;

function setStatus(text: string, kind: "" | "ok" | "err" = "") {
  statusEl.textContent = text;
  statusEl.className = `status${kind ? ` ${kind}` : ""}`;
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function parseArea(area: string): { row: number; col: number } | null {
  const m = /^area_i(\d)(\d)$/.exec(area);
  if (!m) return null;
  return { row: Number(m[1]), col: Number(m[2]) };
}

function areaFromRC(row: number, col: number) {
  return `area_i${row}${col}`;
}

function toIsland(area: string, xPct: number, yPct: number) {
  const rc = parseArea(area);
  if (!rc) return { ix: xPct / 3, iy: yPct / 3 };
  return {
    ix: ((rc.col + xPct / 100) / 3) * 100,
    iy: ((rc.row + yPct / 100) / 3) * 100,
  };
}

function fromIsland(ix: number, iy: number) {
  const col = Math.min(2, Math.max(0, Math.floor((ix / 100) * 3)));
  const row = Math.min(2, Math.max(0, Math.floor((iy / 100) * 3)));
  const xPct = ((ix / 100) * 3 - col) * 100;
  const yPct = ((iy / 100) * 3 - row) * 100;
  return {
    area_id: areaFromRC(row, col),
    x_pct: round1(Math.min(100, Math.max(0, xPct))),
    y_pct: round1(Math.min(100, Math.max(0, yPct))),
  };
}

function viewportSizePct() {
  if (!scale) return { w: 11.9, h: 6.7 };
  const island = scale.island_world_m || 1000;
  return {
    w: ((scale.viewport_world_w_m || 119) / island) * 100,
    h: ((scale.viewport_world_h_m || 67) / island) * 100,
  };
}

/** 섬 좌표 → 모바일 패널 로컬 % (뷰포트 기준) */
function islandToLocal(ix: number, iy: number) {
  const vp = viewportSizePct();
  return {
    lx: ((ix - viewXPct) / vp.w) * 100,
    ly: ((iy - viewYPct) / vp.h) * 100,
  };
}

function localToIsland(lx: number, ly: number) {
  const vp = viewportSizePct();
  return {
    ix: viewXPct + (lx / 100) * vp.w,
    iy: viewYPct + (ly / 100) * vp.h,
  };
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      if (q && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else q = !q;
      continue;
    }
    if (ch === "," && !q) {
      cells.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  cells.push(cur);
  return cells;
}

function escapeCsv(v: string): string {
  if (/[",\n\r]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

function parseCsv(text: string) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim().length);
  const head = lines[0] ?? "";
  const cols = head.split(",").map((c) => c.trim());
  const zi = cols.indexOf("zone_id");
  const out: NpcRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const raw = splitCsvLine(lines[i]!);
    if (raw.length < 10) continue;
    out.push({
      npc_id: raw[0]!,
      area_id: raw[1]!,
      x_pct: Number(raw[2]),
      y_pct: Number(raw[3]),
      icon: raw[4]!,
      label: raw[5]!,
      trigger_type: raw[6]!,
      trigger_ref: raw[7]!,
      appear_condition: raw[8]!,
      flavor_text: raw[9] ?? "",
      zone_id: zi >= 0 ? (raw[zi] ?? "").trim() : (raw[10] ?? "").trim(),
      raw,
    });
  }
  const headerOut = cols.includes("zone_id") ? head : `${head},zone_id`;
  return { header: headerOut, rows: out };
}

function parseZoneCsv(text: string): ZoneRow[] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim().length);
  const out: ZoneRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const raw = splitCsvLine(lines[i]!);
    if (raw.length < 5) continue;
    out.push({
      zone_id: raw[0]!,
      area_id: raw[1]!,
      x_pct: Number(raw[2]),
      y_pct: Number(raw[3]),
      r_pct: Number(raw[4]),
      beat_id: raw[5] ?? "",
      label: raw[6] ?? "",
    });
  }
  return out;
}

function serializeCsv(): string {
  const lines = [header.includes("zone_id") ? header : `${header},zone_id`];
  for (const r of rows) {
    const cells = [...r.raw];
    while (cells.length < 11) cells.push("");
    cells[0] = r.npc_id;
    cells[1] = r.area_id;
    cells[2] = String(round1(r.x_pct));
    cells[3] = String(round1(r.y_pct));
    cells[4] = r.icon;
    cells[5] = r.label;
    cells[6] = r.trigger_type;
    cells[7] = r.trigger_ref;
    cells[8] = r.appear_condition;
    cells[9] = r.flavor_text;
    cells[10] = r.zone_id || "";
    lines.push(cells.map(escapeCsv).join(","));
  }
  return lines.join("\n") + "\n";
}

function nodesInView(): NpcRow[] {
  const vp = viewportSizePct();
  return rows.filter((r) => {
    const { ix, iy } = toIsland(r.area_id, r.x_pct, r.y_pct);
    return ix >= viewXPct && ix <= viewXPct + vp.w && iy >= viewYPct && iy <= viewYPct + vp.h;
  });
}

function parseConnCsv(text: string): ConnRow[] {
  const lines = text.replace(/^\uFEFF/, "").trim().split(/\r?\n/);
  const out: ConnRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line?.trim()) continue;
    const cells = line.split(",");
    const from = cells[1]?.trim();
    const to = cells[2]?.trim();
    if (from && to) out.push({ from, to });
  }
  return out;
}

function areaCenter(areaId: string): { ix: number; iy: number } {
  const rc = parseArea(areaId);
  if (!rc) return { ix: 50, iy: 50 };
  return {
    ix: ((rc.col + 0.5) / 3) * 100,
    iy: ((rc.row + 0.5) / 3) * 100,
  };
}

function svgEl(name: string, attrs: Record<string, string>): SVGElement {
  const el = document.createElementNS("http://www.w3.org/2000/svg", name);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

/** 원(zone) + 섹터 연결 + 비트 순 원→원 점선 */
function paintPathLayer(host: HTMLElement) {
  host.querySelector(".path-layer")?.remove();
  if (!showPathEl?.checked) return;

  const svg = svgEl("svg", {
    class: "path-layer",
    viewBox: "0 0 100 100",
    preserveAspectRatio: "none",
  });
  const defs = svgEl("defs", {});
  const marker = svgEl("marker", {
    id: "pathArrow",
    markerWidth: "4",
    markerHeight: "4",
    refX: "3",
    refY: "2",
    orient: "auto",
  });
  marker.appendChild(svgEl("path", { d: "M0,0 L4,2 L0,4 Z", fill: "#5ec8ff" }));
  defs.appendChild(marker);
  svg.appendChild(defs);

  for (const c of connections) {
    const a = areaCenter(c.from);
    const b = areaCenter(c.to);
    svg.appendChild(
      svgEl("line", {
        class: "sector-link",
        x1: String(round1(a.ix)),
        y1: String(round1(a.iy)),
        x2: String(round1(b.ix)),
        y2: String(round1(b.iy)),
      }),
    );
  }

  for (const z of zones) {
    const { ix, iy } = toIsland(z.area_id, z.x_pct, z.y_pct);
    const rc = parseArea(z.area_id);
    const rIsland = rc ? (z.r_pct / 3) : z.r_pct / 3;
    svg.appendChild(
      svgEl("circle", {
        class: "quest-zone",
        cx: String(round1(ix)),
        cy: String(round1(iy)),
        r: String(round1(Math.max(0.8, rIsland))),
      }),
    );
  }

  const byArea = new Map<string, ZoneRow[]>();
  for (const z of zones) {
    const list = byArea.get(z.area_id) ?? [];
    list.push(z);
    byArea.set(z.area_id, list);
  }
  const beatRank = (b: string) => {
    const order = ["B0", "B1", "B3", "B3b", "B3c", "B4", "B5"];
    const i = order.indexOf(b);
    return i < 0 ? 99 : i;
  };
  for (const list of byArea.values()) {
    const ordered = [...list].sort((a, b) => beatRank(a.beat_id) - beatRank(b.beat_id));
    if (ordered.length < 2) continue;
    const pts = ordered
      .map((z) => {
        const { ix, iy } = toIsland(z.area_id, z.x_pct, z.y_pct);
        return `${round1(ix)},${round1(iy)}`;
      })
      .join(" ");
    svg.appendChild(svgEl("polyline", { class: "npc-path", points: pts }));
  }

  host.appendChild(svg);
}

function focusOnStart() {
  const spawn = spawnPctInArea(rows, "area_i21");
  const { ix, iy } = toIsland("area_i21", spawn.xPct, spawn.yPct);
  const vp = viewportSizePct();
  viewXPct = round1(Math.min(100 - vp.w, Math.max(0, ix - vp.w / 2)));
  viewYPct = round1(Math.min(100 - vp.h, Math.max(0, iy - vp.h * 0.72)));
}

async function loadAll() {
  const [scaleRes, csvRes, connRes, zoneRes] = await Promise.all([
    fetch(`${SCALE_URL}?t=${Date.now()}`),
    fetch(`/area_npc_config.csv?t=${Date.now()}`),
    fetch(`${CONN_URL}?t=${Date.now()}`),
    fetch(`${ZONE_URL}?t=${Date.now()}`),
  ]);
  if (!scaleRes.ok) throw new Error(`scale ${scaleRes.status}`);
  if (!csvRes.ok) throw new Error(`csv ${csvRes.status}`);
  scale = (await scaleRes.json()) as ScaleConfig;
  const parsed = parseCsv(await csvRes.text());
  header = parsed.header;
  rows = parsed.rows;
  connections = connRes.ok ? parseConnCsv(await connRes.text()) : [];
  zones = zoneRes.ok ? parseZoneCsv(await zoneRes.text()) : [];
  dirty = false;
  actorHpx = scale.map_actor_h_px || 36;
  sizeSlider.value = String(actorHpx);
  artBust = Date.now();
  clearFloorUrls();
  fillAreaSelect();
  mapBg.src = ISLAND_MAP;
  focusOnStart();
  renderScale();
  renderAll();
  if (artMode !== "concept") {
    await ensureFloorArts();
    renderAll();
    setStatus(
      `불러옴 · 노드 ${rows.length}개 · 원 ${zones.length}개 · ${artMode === "polluted" ? "정화전" : "정화후"}`,
      "ok",
    );
  } else {
    setStatus(`불러옴 · 노드 ${rows.length}개 · 원 ${zones.length}개 · 원본 컨셉`, "ok");
  }
}

function sectorArtUrl(areaId: string): string | null {
  if (artMode === "polluted" || artMode === "purified") return floorUrls.get(areaId) ?? null;
  const s = scale?.sectors?.[areaId];
  if (!s?.map) return null;
  return `${s.map}?t=${artBust}`;
}

function clearFloorUrls() {
  for (const url of floorUrls.values()) URL.revokeObjectURL(url);
  floorUrls.clear();
}

async function ensureFloorArts(): Promise<void> {
  if (floorUrls.size > 0 || floorBusy || !scale) return;
  floorBusy = true;
  setStatus("타일 바닥 생성 중…");
  try {
    await Promise.all(
      SPLAT_LAND_IDS.map(async (id) => {
        const areaId = `area_${id}`;
        const src = scale?.sectors?.[areaId]?.map;
        if (!src) return;
        const url = await paintSectorFloorUrl(src);
        floorUrls.set(areaId, url);
      }),
    );
  } finally {
    floorBusy = false;
  }
}

/** 시야 중심이 속한 섹터 + 시야를 그 섹터 %로 변환 */
function viewportInSector() {
  const vp = viewportSizePct();
  const cx = viewXPct + vp.w / 2;
  const cy = viewYPct + vp.h / 2;
  const center = fromIsland(cx, cy);
  const localW = vp.w * 3;
  const localH = vp.h * 3;
  const localX = round1(center.x_pct - localW / 2);
  const localY = round1(center.y_pct - localH / 2);
  return {
    area_id: center.area_id,
    localX,
    localY,
    localW,
    localH,
    art: sectorArtUrl(center.area_id),
  };
}

function fillAreaSelect() {
  const ids = new Set<string>([...AREA_ORDER, ...rows.map((r) => r.area_id)]);
  fArea.innerHTML = [...ids]
    .sort()
    .map((id) => `<option value="${id}">${id.replace("area_", "")}</option>`)
    .join("");
}

function renderScale() {
  if (!scale) return;
  const island = scale.island_world_m || 1000;
  const vh = scale.viewport_world_h_m || 67;
  const vw = scale.viewport_world_w_m || 119;
  scaleBox.innerHTML = `
    섬 <b>~${island}m</b> · 사람 <b>${scale.character_height_m}m</b><br/>
    섹터 <b>~${scale.sector_world_h_m}m</b> × 9<br/>
    모바일 ≈ <b>${vw.toFixed(0)}×${vh.toFixed(0)}m</b>
    (섬의 <b>${((vh / island) * 100).toFixed(1)}%</b>)
  `;
  sizeVal.textContent = `${actorHpx}px`;
  phoneChar.style.height = `${(actorHpx / 720) * 100}%`;
}

function renderAll() {
  renderIsland();
  renderPhone();
  renderList();
  syncInfo();
}

function renderIsland() {
  mapOverlay.innerHTML = "";
  mapStage.classList.toggle("is-tiles", artMode !== "concept");
  const vp = viewportSizePct();

  // 섹터 아트가 있는 칸에 페인팅 오버레이 (개요 스키마 위에)
  for (const areaId of AREA_ORDER) {
    const url = sectorArtUrl(areaId);
    if (!url) continue;
    const rc = parseArea(areaId);
    if (!rc) continue;
    const cell = document.createElement("div");
    const cls = ["sector-art-cell"];
    if (artMode !== "concept") cls.push("is-tiles");
    if (artMode === "polluted") cls.push("is-polluted");
    cell.className = cls.join(" ");
    cell.style.left = `${(rc.col / 3) * 100}%`;
    cell.style.top = `${(rc.row / 3) * 100}%`;
    cell.style.width = `${100 / 3}%`;
    cell.style.height = `${100 / 3}%`;
    const img = document.createElement("img");
    img.className = "sector-art";
    img.alt = areaId;
    img.src = url;
    cell.appendChild(img);
    mapOverlay.appendChild(cell);
  }

  const frame = document.createElement("div");
  frame.className = "viewport-frame";
  frame.style.left = `${viewXPct}%`;
  frame.style.top = `${viewYPct}%`;
  frame.style.width = `${vp.w}%`;
  frame.style.height = `${vp.h}%`;
  frame.innerHTML = `<span>모바일 시야</span>`;
  frame.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    drag = { kind: "view", startX: e.clientX, startY: e.clientY, origX: viewXPct, origY: viewYPct };
    frame.setPointerCapture?.(e.pointerId);
  });
    mapOverlay.appendChild(frame);

  paintPathLayer(mapOverlay);

  for (const r of rows) {
    const { ix, iy } = toIsland(r.area_id, r.x_pct, r.y_pct);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `node-icon${r.npc_id === selectedId ? " selected" : ""}`;
    btn.style.left = `${ix}%`;
    btn.style.top = `${iy}%`;
    btn.dataset.id = r.npc_id;
    btn.textContent = r.icon;
    btn.title = r.label;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      selectedId = r.npc_id;
      // 선택하면 시야를 노드 쪽으로 살짝 맞춤
      const halfW = vp.w / 2;
      const halfH = vp.h / 2;
      viewXPct = round1(Math.min(100 - vp.w, Math.max(0, ix - halfW)));
      viewYPct = round1(Math.min(100 - vp.h, Math.max(0, iy - halfH)));
      renderAll();
    });
    mapOverlay.appendChild(btn);
  }
}

function renderPhone() {
  if (!scale) return;
  const vp = viewportSizePct();
  const sec = viewportInSector();
  phoneBgHost.innerHTML = "";
  phoneStage.classList.toggle("is-tiles", artMode !== "concept");
  phoneStage.classList.toggle("is-polluted", artMode === "polluted");

  const paintBg = (url: string, sizeX: number, sizeY: number, posX: number, posY: number, label: string) => {
    const size = `${sizeX}% ${sizeY}%`;
    const pos = `${posX}% ${posY}%`;
    const el = document.createElement("div");
    el.className = "phone-bg";
    el.id = "phoneBg";
    el.style.backgroundImage = `url("${url}")`;
    el.style.backgroundSize = size;
    el.style.backgroundPosition = pos;
    phoneBgHost.appendChild(el);
    phoneSub.textContent = label;
  };

  if (sec.art) {
    const lx = Math.min(100 - sec.localW, Math.max(0, sec.localX));
    const ly = Math.min(100 - sec.localH, Math.max(0, sec.localY));
    const sizeX = 100 / (sec.localW / 100);
    const sizeY = 100 / (sec.localH / 100);
    const denomX = Math.max(0.001, 100 - sec.localW);
    const denomY = Math.max(0.001, 100 - sec.localH);
    const modeLabel =
      artMode === "polluted" ? "정화전" : artMode === "purified" ? "정화후" : "원본";
    paintBg(
      sec.art,
      sizeX,
      sizeY,
      (lx / denomX) * 100,
      (ly / denomY) * 100,
      `${sec.area_id.replace("area_", "")} · ${modeLabel} · 노드 ${nodesInView().length}개 · 여기서 드래그`
    );
  } else {
    const sizeX = 100 / (vp.w / 100);
    const sizeY = 100 / (vp.h / 100);
    const denomX = Math.max(0.001, 100 - vp.w);
    const denomY = Math.max(0.001, 100 - vp.h);
    paintBg(
      ISLAND_MAP,
      sizeX,
      sizeY,
      (viewXPct / denomX) * 100,
      (viewYPct / denomY) * 100,
      `시야 (${viewXPct.toFixed(1)}, ${viewYPct.toFixed(1)}) · 아트 없음 · 노드 ${nodesInView().length}개`
    );
  }

  phoneNodes.innerHTML = "";
  for (const z of zones.filter((zz) => zz.area_id === sec.area_id)) {
    const { ix, iy } = toIsland(z.area_id, z.x_pct, z.y_pct);
    const { lx, ly } = islandToLocal(ix, iy);
    const el = document.createElement("div");
    el.className = "phone-zone";
    el.style.left = `${lx}%`;
    el.style.top = `${ly}%`;
    const diamW = (z.r_pct * 2 * 100) / Math.max(0.001, sec.localW);
    const diamH = (z.r_pct * 2 * 100) / Math.max(0.001, sec.localH);
    el.style.width = `${diamW}%`;
    el.style.height = `${diamH}%`;
    el.title = `${z.label || z.zone_id} · ${z.beat_id}`;
    el.innerHTML = `<span>${z.label || z.zone_id}</span>`;
    phoneNodes.appendChild(el);
  }
  for (const r of nodesInView()) {
    const { ix, iy } = toIsland(r.area_id, r.x_pct, r.y_pct);
    const { lx, ly } = islandToLocal(ix, iy);
    const el = document.createElement("button");
    el.type = "button";
    el.className = `phone-node${r.npc_id === selectedId ? " selected" : ""}`;
    el.style.left = `${lx}%`;
    el.style.top = `${ly}%`;
    el.dataset.id = r.npc_id;
    el.innerHTML = `<span class="ico">${r.icon}</span>${r.label}`;
    el.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      selectedId = r.npc_id;
      drag = {
        kind: "phone-node",
        id: r.npc_id,
        startX: e.clientX,
        startY: e.clientY,
        origLX: lx,
        origLY: ly,
      };
      el.setPointerCapture?.(e.pointerId);
      syncInfo();
      renderList();
      renderIsland();
    });
    el.addEventListener("click", () => {
      selectedId = r.npc_id;
      syncInfo();
      renderList();
      renderIsland();
    });
    phoneNodes.appendChild(el);
  }

  const spawn = spawnPctInArea(rows, sec.area_id);
  const { ix, iy } = toIsland(sec.area_id, spawn.xPct, spawn.yPct);
  const local = islandToLocal(ix, iy);
  phoneChar.style.left = `${local.lx}%`;
  phoneChar.style.top = `${local.ly}%`;
  phoneChar.style.bottom = "auto";
  phoneChar.style.transform = "translate(-50%, -80%)";
}

function renderList() {
  nodeCount.textContent = String(rows.length);
  nodeList.innerHTML = rows
    .map((r) => {
      const short = r.area_id.replace("area_", "");
      return `<button type="button" data-id="${r.npc_id}" class="${r.npc_id === selectedId ? "on" : ""}">
        ${r.icon} ${r.label}
        <span>${short} · ${r.x_pct.toFixed(1)}, ${r.y_pct.toFixed(1)}</span>
      </button>`;
    })
    .join("");
  nodeList.querySelectorAll<HTMLButtonElement>("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedId = btn.dataset.id ?? null;
      const r = rows.find((x) => x.npc_id === selectedId);
      if (r) {
        const { ix, iy } = toIsland(r.area_id, r.x_pct, r.y_pct);
        const vp = viewportSizePct();
        viewXPct = round1(Math.min(100 - vp.w, Math.max(0, ix - vp.w / 2)));
        viewYPct = round1(Math.min(100 - vp.h, Math.max(0, iy - vp.h / 2)));
      }
      renderAll();
    });
  });
}

function syncInfo() {
  const r = rows.find((x) => x.npc_id === selectedId);
  if (!r) {
    infoCard.textContent = "섬 위 아이콘을 클릭하세요.";
    fId.value = "";
    fX.value = "";
    fY.value = "";
    return;
  }
  infoCard.innerHTML = `
    <span class="big">${r.icon}</span>
    <strong>${r.label}</strong><br/>
    id: <code>${r.npc_id}</code><br/>
    구역: <code>${r.area_id}</code><br/>
    타입: ${r.trigger_type}${r.trigger_ref ? ` → ${r.trigger_ref}` : ""}<br/>
    ${r.flavor_text ? r.flavor_text : "<i>설명 없음</i>"}
  `;
  fId.value = r.npc_id;
  fArea.value = r.area_id;
  fX.value = String(round1(r.x_pct));
  fY.value = String(round1(r.y_pct));
}

function onPointerMove(e: PointerEvent) {
  if (!drag) return;

  if (drag.kind === "view") {
    const rect = mapStage.getBoundingClientRect();
    if (rect.width <= 0) return;
    const dx = ((e.clientX - drag.startX) / rect.width) * 100;
    const dy = ((e.clientY - drag.startY) / rect.height) * 100;
    const vp = viewportSizePct();
    viewXPct = Math.min(100 - vp.w, Math.max(0, round1(drag.origX + dx)));
    viewYPct = Math.min(100 - vp.h, Math.max(0, round1(drag.origY + dy)));
    renderIsland();
    renderPhone();
    return;
  }

  if (drag.kind !== "phone-node") return;
  const nodeDrag = drag;
  const rect = phoneStage.getBoundingClientRect();
  if (rect.width <= 0) return;
  const dx = ((e.clientX - nodeDrag.startX) / rect.width) * 100;
  const dy = ((e.clientY - nodeDrag.startY) / rect.height) * 100;
  const lx = Math.min(100, Math.max(0, round1(nodeDrag.origLX + dx)));
  const ly = Math.min(100, Math.max(0, round1(nodeDrag.origLY + dy)));
  const { ix, iy } = localToIsland(lx, ly);
  const next = fromIsland(ix, iy);
  const r = rows.find((x) => x.npc_id === nodeDrag.id);
  if (!r) return;
  r.area_id = next.area_id;
  r.x_pct = next.x_pct;
  r.y_pct = next.y_pct;
  dirty = true;
  setStatus("수정됨 · 저장하세요", "");
  const el = phoneNodes.querySelector<HTMLElement>(`.phone-node[data-id="${r.npc_id}"]`);
  if (el) {
    el.style.left = `${lx}%`;
    el.style.top = `${ly}%`;
  }
  const islandIcon = mapOverlay.querySelector<HTMLElement>(`.node-icon[data-id="${r.npc_id}"]`);
  if (islandIcon) {
    islandIcon.style.left = `${ix}%`;
    islandIcon.style.top = `${iy}%`;
  }
  paintPathLayer(mapOverlay);
  syncInfo();
}

function onPointerUp() {
  if (drag?.kind === "phone-node") renderList();
  drag = null;
}

async function saveCsv() {
  const res = await fetch("/__data_save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: CSV_PATH, text: serializeCsv() }),
  });
  const body = (await res.json()) as { ok?: boolean; error?: string };
  if (!res.ok || !body.ok) {
    setStatus(body.error ?? "저장 실패", "err");
    return;
  }
  dirty = false;
  setStatus(`저장됨 · ${CSV_PATH}`, "ok");
}

fX.addEventListener("change", () => {
  const r = rows.find((x) => x.npc_id === selectedId);
  if (!r) return;
  r.x_pct = Math.min(100, Math.max(0, Number(fX.value) || 0));
  dirty = true;
  renderAll();
});
fY.addEventListener("change", () => {
  const r = rows.find((x) => x.npc_id === selectedId);
  if (!r) return;
  r.y_pct = Math.min(100, Math.max(0, Number(fY.value) || 0));
  dirty = true;
  renderAll();
});
fArea.addEventListener("change", () => {
  const r = rows.find((x) => x.npc_id === selectedId);
  if (!r) return;
  r.area_id = fArea.value;
  dirty = true;
  renderAll();
});
sizeSlider.addEventListener("input", () => {
  actorHpx = Number(sizeSlider.value) || 36;
  sizeVal.textContent = `${actorHpx}px`;
  phoneChar.style.height = `${(actorHpx / 720) * 100}%`;
});

document.querySelector("#btnReload")!.addEventListener("click", () => void loadAll());
document.querySelector("#btnSave")!.addEventListener("click", () => void saveCsv());
showPathEl.addEventListener("change", () => renderIsland());
artModeSel.addEventListener("change", () => {
  const v = artModeSel.value;
  artMode = v === "purified" ? "purified" : v === "concept" ? "concept" : "polluted";
  if (artMode !== "concept") {
    void ensureFloorArts().then(() => {
      renderAll();
      setStatus(artMode === "polluted" ? "보기: 정화전 (타일+하얗게)" : "보기: 정화후 (타일)", "ok");
    });
    return;
  }
  renderAll();
  setStatus("보기: 원본 (컨셉)", "ok");
});

/** 섬 ↔ 모바일 / 사이드 폭 — 드래그 조절 · localStorage 유지 */
const LS_PHONE = "xoox.sectorEditor.phoneH";
const LS_SIDE = "xoox.sectorEditor.sideW";
const workspaceEl = document.querySelector<HTMLElement>("#workspace")!;
const mainCol = document.querySelector<HTMLElement>("#mainCol")!;
const splitY = document.querySelector<HTMLElement>("#splitY")!;
const splitX = document.querySelector<HTMLElement>("#splitX")!;

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

function applyLayout(phoneHpct?: number, sideWpx?: number) {
  const storedPhone = Number(localStorage.getItem(LS_PHONE));
  const storedSide = Number(localStorage.getItem(LS_SIDE));
  const phone = clamp(phoneHpct ?? (Number.isFinite(storedPhone) ? storedPhone : 42), 18, 75);
  const side = clamp(sideWpx ?? (Number.isFinite(storedSide) ? storedSide : 300), 200, 520);
  workspaceEl.style.setProperty("--phone-h", `${phone}%`);
  workspaceEl.style.setProperty("--side-w", `${side}px`);
}

applyLayout();

type SplitDrag =
  | { kind: "y"; startY: number; startPct: number }
  | { kind: "x"; startX: number; startW: number };
let splitDrag: SplitDrag | null = null;

splitY.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  const cur = Number(getComputedStyle(workspaceEl).getPropertyValue("--phone-h").replace("%", "")) || 42;
  splitDrag = { kind: "y", startY: e.clientY, startPct: cur };
  splitY.classList.add("dragging");
  splitY.setPointerCapture?.(e.pointerId);
});

splitX.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  e.stopPropagation();
  const cur = Number(getComputedStyle(workspaceEl).getPropertyValue("--side-w").replace("px", "")) || 300;
  splitDrag = { kind: "x", startX: e.clientX, startW: cur };
  splitX.classList.add("dragging");
  splitX.setPointerCapture?.(e.pointerId);
});

window.addEventListener("pointermove", (e) => {
  if (!splitDrag) return;
  if (splitDrag.kind === "y") {
    const h = mainCol.getBoundingClientRect().height;
    if (h <= 0) return;
    // 아래로 끌면 모바일↑ (phone % 증가)
    const dy = e.clientY - splitDrag.startY;
    const next = splitDrag.startPct - (dy / h) * 100;
    applyLayout(next, undefined);
    localStorage.setItem(LS_PHONE, String(clamp(next, 18, 75)));
  } else {
    const dx = e.clientX - splitDrag.startX;
    // 왼쪽으로 끌면 사이드↑
    const next = splitDrag.startW - dx;
    applyLayout(undefined, next);
    localStorage.setItem(LS_SIDE, String(clamp(next, 200, 520)));
  }
});

window.addEventListener("pointerup", () => {
  if (!splitDrag) return;
  splitY.classList.remove("dragging");
  splitX.classList.remove("dragging");
  splitDrag = null;
});

window.addEventListener("pointermove", onPointerMove);
window.addEventListener("pointerup", onPointerUp);
window.addEventListener("pointercancel", onPointerUp);
mapBg.addEventListener("load", () => renderAll());

void loadAll().catch((e) => setStatus(String(e), "err"));
