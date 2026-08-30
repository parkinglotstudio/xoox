/**
 * 프롭 배치 — 지금은 나무 스티커 3종만.
 * 마스크 존(숲 속 / 숲·들판 가장자리 / 들판)에 개수를 나눠 심고
 * data/area_prop_config.csv 로 저장한다.
 */
import { ISLAND_MASK, ISLAND_OVERVIEW_URL } from "../island/islandMapShared";
import { MASTER_CELL_IDS, WALK_SECTORS, type MaskDoc } from "../mapMaskTool/types";
import { STICKER_TREES, type StickerTreeId } from "../stage/world3d/stickerTrees";
import {
  DEFAULT_PLANT_COUNTS,
  npcAvoidFromRows,
  plantStickerTrees,
  type PlantCounts,
  type PlantedTree,
} from "./plantTrees";
import { isGameplayKeepRow, PROP_CSV_PATH, treesToCsv } from "./propCsv";
import { parseCsv } from "../csv";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const canvas = $<HTMLCanvasElement>("preview");
const statusEl = $<HTMLElement>("status");
const statsEl = $<HTMLElement>("stats");
const seedInp = $<HTMLInputElement>("seed");
const btnPlant = $<HTMLButtonElement>("btnPlant");
const btnSave = $<HTMLButtonElement>("btnSave");
const btnClear = $<HTMLButtonElement>("btnClear");

const counts: PlantCounts = { ...DEFAULT_PLANT_COUNTS };
let trees: PlantedTree[] = [];
let keepLines: string[] = [];
let overview: HTMLImageElement | null = null;
let planted = false;

function setStatus(text: string, kind: "" | "ok" | "err" = "") {
  statusEl.textContent = text;
  statusEl.className = `status ${kind}`;
}

function bindSliders() {
  for (const t of STICKER_TREES) {
    const inp = $<HTMLInputElement>(`n_${t.id}`);
    const out = $<HTMLElement>(`nv_${t.id}`);
    inp.value = String(counts[t.id]);
    out.textContent = String(counts[t.id]);
    inp.addEventListener("input", () => {
      counts[t.id] = Math.max(0, Math.min(80, Number(inp.value) || 0));
      out.textContent = String(counts[t.id]);
    });
  }
}

async function loadMask(): Promise<MaskDoc> {
  const url = `${ISLAND_MASK.loadMasterUrl}/${ISLAND_MASK.masterFile}?t=${Date.now()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`마스크 로드 실패 ${res.status}`);
  return (await res.json()) as MaskDoc;
}

async function loadOverview() {
  const img = new Image();
  img.src = `${ISLAND_OVERVIEW_URL}?t=${Date.now()}`;
  await img.decode();
  overview = img;
}

async function loadKeepRows() {
  const res = await fetch(`/area_prop_config.csv?t=${Date.now()}`);
  if (!res.ok) return;
  const text = await res.text();
  keepLines = text.split(/\r?\n/).filter(isGameplayKeepRow);
}

function draw() {
  const g = canvas.getContext("2d")!;
  const w = canvas.width;
  const h = canvas.height;
  g.fillStyle = "#05080d";
  g.fillRect(0, 0, w, h);
  if (overview) g.drawImage(overview, 0, 0, w, h);
  else {
    g.fillStyle = "#1a2430";
    g.fillRect(0, 0, w, h);
  }

  g.strokeStyle = "rgba(45,224,208,0.28)";
  g.lineWidth = 1;
  for (let i = 1; i < 3; i++) {
    g.beginPath();
    g.moveTo((i * w) / 3, 0);
    g.lineTo((i * w) / 3, h);
    g.moveTo(0, (i * h) / 3);
    g.lineTo(w, (i * h) / 3);
    g.stroke();
  }
  g.fillStyle = "rgba(232,238,248,0.55)";
  g.font = "11px sans-serif";
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const id = MASTER_CELL_IDS[r]![c]!;
      g.fillText(id, c * (w / 3) + 6, r * (h / 3) + 16);
    }
  }

  const byId = Object.fromEntries(STICKER_TREES.map((t) => [t.id, t]));
  for (const t of trees) {
    const spec = byId[t.group_id];
    if (!spec) continue;
    const sid = t.area_id.replace(/^area_/, "");
    let row = -1;
    let col = -1;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (MASTER_CELL_IDS[r]![c] === sid) {
          row = r;
          col = c;
        }
      }
    }
    if (row < 0) continue;
    const x = ((col + t.x_pct / 100) * w) / 3;
    const y = ((row + t.y_pct / 100) * h) / 3;
    const rad = spec.zone === "forest" ? 3.2 : spec.zone === "edge" ? 3.8 : 4.4;
    g.fillStyle = spec.color;
    g.beginPath();
    g.arc(x, y, rad, 0, Math.PI * 2);
    g.fill();
  }
}

function renderStats() {
  const byType: Record<string, number> = { tree_01: 0, tree_02: 0, tree_03: 0 };
  const bySec: Record<string, number> = {};
  for (const s of WALK_SECTORS) bySec[s] = 0;
  for (const t of trees) {
    byType[t.group_id] = (byType[t.group_id] ?? 0) + 1;
    const sid = t.area_id.replace(/^area_/, "");
    bySec[sid] = (bySec[sid] ?? 0) + 1;
  }
  const typeLine = STICKER_TREES.map((t) => `${t.name} ${byType[t.id] ?? 0}`).join(" · ");
  const secLine = WALK_SECTORS.map((s) => `${s} ${bySec[s] ?? 0}`).join(" · ");
  statsEl.innerHTML = `<div>${typeLine}</div><div class="muted">${secLine || "아직 안 심음"}</div>`;
}

async function plant() {
  btnPlant.disabled = true;
  setStatus("마스크 읽고 심는 중…");
  try {
    const [doc, npcText] = await Promise.all([
      loadMask(),
      fetch(`/area_npc_config.csv?t=${Date.now()}`).then((r) => r.text()),
    ]);
    const npcRows = parseCsv(npcText);
    const seed = Number(seedInp.value) || 1;
    trees = await plantStickerTrees({
      doc,
      counts: { ...counts },
      seed,
      avoid: npcAvoidFromRows(npcRows),
    });
    planted = true;
    draw();
    renderStats();
    setStatus(`심음 ${trees.length}그루 · 저장해야 게임에 반영`, "ok");
  } catch (e) {
    setStatus(String(e), "err");
  } finally {
    btnPlant.disabled = false;
  }
}

async function save() {
  if (!planted && trees.length === 0) {
    setStatus("먼저 심기를 눌러라", "err");
    return;
  }
  const text = treesToCsv(trees, keepLines);
  const res = await fetch("/__data_save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: PROP_CSV_PATH, text }),
  });
  const body = (await res.json()) as { ok?: boolean; error?: string };
  if (!res.ok || !body.ok) {
    setStatus(body.error || `저장 실패 ${res.status}`, "err");
    return;
  }
  setStatus(`저장됨 → ${PROP_CSV_PATH} · 나무 ${trees.length} · 게임플레이 행 ${keepLines.length}`, "ok");
}

function clearPreview() {
  trees = [];
  planted = true;
  draw();
  renderStats();
  setStatus("미리보기만 비움 · 저장하면 CSV도 나무 없이 남음");
}

async function boot() {
  bindSliders();
  btnPlant.addEventListener("click", () => void plant());
  btnSave.addEventListener("click", () => void save());
  btnClear.addEventListener("click", clearPreview);
  try {
    await Promise.all([loadOverview(), loadKeepRows()]);
    draw();
    renderStats();
    setStatus("마스크 기준 · 나무 3종만. 심기 → 저장.");
    await plant();
  } catch (e) {
    setStatus(String(e), "err");
  }
}

void boot();
