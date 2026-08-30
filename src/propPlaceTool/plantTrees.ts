/**
 * 섬 마스터 마스크 → 나무 3종 예술 배치.
 * 균일 난수가 아니라 숲 속·가장자리·들판 클러스터로 나눈다.
 */
import { MASTER_CELL_IDS, MASTER_SIZE, WALK_SECTORS } from "../mapMaskTool/types";
import type { MaskDoc } from "../mapMaskTool/types";
import { STICKER_TREES, type StickerTreeId } from "../stage/world3d/stickerTrees";

export type PlantCounts = Record<StickerTreeId, number>;

export interface AvoidDisk {
  areaId: string;
  xPct: number;
  yPct: number;
  rPct: number;
}

export interface PlantedTree {
  prop_id: string;
  area_id: string;
  kind: "tree";
  x_pct: number;
  y_pct: number;
  yaw_deg: number;
  h_m: number;
  group_id: StickerTreeId;
  collide: boolean;
  purify_target: boolean;
  life_blight_id: string;
  art: string;
  note: string;
}

export interface PlantInput {
  doc: MaskDoc;
  counts: PlantCounts;
  seed: number;
  avoid: AvoidDisk[];
}

interface Pix {
  i: number;
  x: number;
  y: number;
  score: number;
}

const WALK = new Set<string>(WALK_SECTORS);
const ALPHA = 12;
/** 섹터 한 변 512px 기준. world_m 70 → 약 1px ≈ 0.14m */
const NPC_R_PCT = 6.5;
const START_R_PCT = 16;
const I21_START = { xPct: 51.3, yPct: 75.9 };

export const DEFAULT_PLANT_COUNTS: PlantCounts = {
  tree_01: 25,
  tree_02: 25,
  tree_03: 24,
};

export async function decodeMaskAlphas(doc: MaskDoc): Promise<Record<string, Uint8Array>> {
  const size = doc.size || MASTER_SIZE;
  const out: Record<string, Uint8Array> = {};
  const ids = ["land", "walk", "path", "forest", "flower", "pond", "lake", "rock", "blight"] as const;
  await Promise.all(
    ids.map(async (id) => {
      const src = doc.layers[id];
      out[id] = src ? await dataUrlToAlpha(src, size) : new Uint8Array(size * size);
    }),
  );
  return out;
}

export function plantTreesFromAlphas(
  alphas: Record<string, Uint8Array>,
  size: number,
  counts: PlantCounts,
  seed: number,
  avoid: AvoidDisk[],
): PlantedTree[] {
  const rng = seeded(seed >>> 0 || 1);
  const land = alphas.land ?? empty(size);
  const forest = alphas.forest ?? empty(size);
  const flower = alphas.flower ?? empty(size);
  const path = alphas.path ?? empty(size);
  const lake = alphas.lake ?? empty(size);
  const pond = alphas.pond ?? empty(size);
  const rock = alphas.rock ?? empty(size);
  const blight = alphas.blight ?? empty(size);

  const block = orMasks(size, path, lake, pond, rock, blight);
  const forestDist = distToOff(forest, size);
  const flowerNear = dilate(flower, size, 14);

  const disks = masterDisks(avoid, size);

  const forestPix: Pix[] = [];
  const edgePix: Pix[] = [];
  const meadowPix: Pix[] = [];

  for (let y = 0; y < size; y += 2) {
    for (let x = 0; x < size; x += 2) {
      const i = y * size + x;
      if (!land[i] || block[i]) continue;
      const cell = cellOf(x, y, size);
      if (!cell || !WALK.has(cell.sector)) continue;
      if (hitsDisks(x, y, disks)) continue;
      if (isStartField(cell.sector, cell.xPct, cell.yPct)) continue;

      if (forest[i]) {
        const dEdge = forestDist[i]!;
        if (dEdge >= 16) {
          forestPix.push({ i, x, y, score: dEdge + rng() * 6 });
        }
        if (dEdge < 18 && flowerNear[i]) {
          edgePix.push({ i, x, y, score: 18 - Math.abs(dEdge - 8) + rng() * 4 });
        }
      } else if (flower[i] && forestDist[i]! >= 10) {
        meadowPix.push({ i, x, y, score: Math.min(40, forestDist[i]!) + rng() * 8 });
      }
    }
  }

  const occupied: { x: number; y: number }[] = [];
  const trees: PlantedTree[] = [];
  const seq: Record<StickerTreeId, number> = { tree_01: 0, tree_02: 0, tree_03: 0 };

  const forestPts = placeGroves(forestPix, counts.tree_02, occupied, 18, rng, 3);
  for (const p of forestPts) {
    trees.push(toTree("tree_02", p, size, rng, seq));
  }

  const edgePts = placeAlong(edgePix, counts.tree_03, occupied, 20, rng);
  for (const p of edgePts) {
    trees.push(toTree("tree_03", p, size, rng, seq));
  }

  const meadowPts = placeOddClusters(meadowPix, counts.tree_01, occupied, rng);
  for (const p of meadowPts) {
    trees.push(toTree("tree_01", p, size, rng, seq));
  }

  return trees.sort((a, b) => a.prop_id.localeCompare(b.prop_id));
}

export async function plantStickerTrees(input: PlantInput): Promise<PlantedTree[]> {
  const size = input.doc.size || MASTER_SIZE;
  const alphas = await decodeMaskAlphas(input.doc);
  return plantTreesFromAlphas(alphas, size, input.counts, input.seed, input.avoid);
}

export function npcAvoidFromRows(rows: { area_id?: string; x_pct?: string; y_pct?: string }[]): AvoidDisk[] {
  const out: AvoidDisk[] = rows
    .filter((r) => (r.area_id || "").startsWith("area_"))
    .map((r) => ({
      areaId: r.area_id || "",
      xPct: Number(r.x_pct) || 50,
      yPct: Number(r.y_pct) || 50,
      rPct: NPC_R_PCT,
    }));
  out.push({
    areaId: "area_i21",
    xPct: I21_START.xPct,
    yPct: I21_START.yPct,
    rPct: START_R_PCT,
  });
  return out;
}

function toTree(
  id: StickerTreeId,
  p: { x: number; y: number },
  size: number,
  rng: () => number,
  seq: Record<StickerTreeId, number>,
): PlantedTree {
  const spec = STICKER_TREES.find((t) => t.id === id)!;
  const cell = cellOf(p.x, p.y, size)!;
  seq[id] += 1;
  const n = String(seq[id]).padStart(2, "0");
  return {
    prop_id: `p_${cell.sector}_${id}_${n}`,
    area_id: `area_${cell.sector}`,
    kind: "tree",
    x_pct: round1(cell.xPct),
    y_pct: round1(cell.yPct),
    yaw_deg: Math.round(rng() * 360),
    h_m: spec.hM,
    group_id: id,
    collide: true,
    purify_target: false,
    life_blight_id: "",
    art: spec.file,
    note: spec.name,
  };
}

function placeGroves(
  cands: Pix[],
  count: number,
  occupied: { x: number; y: number }[],
  minDist: number,
  rng: () => number,
  groveN: number,
): { x: number; y: number }[] {
  if (count <= 0 || cands.length === 0) return [];
  const ranked = [...cands].sort((a, b) => b.score - a.score);
  const seeds: Pix[] = [];
  const seedSep = 90;
  for (const p of ranked) {
    if (seeds.length >= groveN * 6) break;
    if (seeds.some((s) => hypot(s.x - p.x, s.y - p.y) < seedSep)) continue;
    seeds.push(p);
  }
  if (!seeds.length) return placeAlong(cands, count, occupied, minDist, rng);

  const nGroves = Math.max(3, Math.min(seeds.length, Math.round(count / 4) + groveN));
  const groves = seeds.slice(0, nGroves);
  const per = splitCount(count, groves.length, rng);
  const out: { x: number; y: number }[] = [];
  groves.forEach((g, gi) => {
    const local = cands
      .filter((p) => hypot(p.x - g.x, p.y - g.y) < 70 + rng() * 40)
      .sort((a, b) => hypot(a.x - g.x, a.y - g.y) - hypot(b.x - g.x, b.y - g.y));
    const picked = takeSpaced(local, per[gi]!, occupied, minDist, rng);
    out.push(...picked);
  });
  if (out.length < count) {
    out.push(...takeSpaced(ranked, count - out.length, occupied, minDist, rng));
  }
  return out.slice(0, count);
}

function placeAlong(
  cands: Pix[],
  count: number,
  occupied: { x: number; y: number }[],
  minDist: number,
  rng: () => number,
): { x: number; y: number }[] {
  if (count <= 0 || cands.length === 0) return [];
  const ranked = [...cands].sort((a, b) => b.score - a.score);
  return takeSpaced(ranked, count, occupied, minDist, rng);
}

function placeOddClusters(
  cands: Pix[],
  count: number,
  occupied: { x: number; y: number }[],
  rng: () => number,
): { x: number; y: number }[] {
  if (count <= 0 || cands.length === 0) return [];
  const ranked = [...cands].sort((a, b) => b.score - a.score);
  const out: { x: number; y: number }[] = [];
  let left = count;
  const centerSep = 48;
  const centers: Pix[] = [];
  for (const p of ranked) {
    if (centers.length >= Math.max(4, Math.ceil(count / 2))) break;
    if (centers.some((c) => hypot(c.x - p.x, c.y - p.y) < centerSep)) continue;
    if (occupied.some((o) => hypot(o.x - p.x, o.y - p.y) < 22)) continue;
    centers.push(p);
  }
  for (const c of centers) {
    if (left <= 0) break;
    const odd = left === 2 ? 1 : left >= 5 && rng() < 0.22 ? 5 : left >= 3 && rng() < 0.62 ? 3 : 1;
    const n = Math.min(odd, left);
    const around = cands
      .filter((p) => hypot(p.x - c.x, p.y - c.y) < 8 + n * 5)
      .sort((a, b) => hypot(a.x - c.x, a.y - c.y) - hypot(b.x - c.x, b.y - c.y));
    const got = takeSpaced(around.length ? around : [c], n, occupied, 14, rng);
    out.push(...got);
    left -= got.length;
  }
  if (left > 0) out.push(...takeSpaced(ranked, left, occupied, 22, rng));
  return out.slice(0, count);
}

function takeSpaced(
  ranked: Pix[],
  count: number,
  occupied: { x: number; y: number }[],
  minDist: number,
  rng: () => number,
): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  const jitter = () => (rng() - 0.5) * 3;
  for (const p of ranked) {
    if (out.length >= count) break;
    const x = p.x + jitter();
    const y = p.y + jitter();
    if (occupied.some((o) => hypot(o.x - x, o.y - y) < minDist)) continue;
    occupied.push({ x, y });
    out.push({ x, y });
  }
  return out;
}

function splitCount(total: number, n: number, rng: () => number): number[] {
  const w = Array.from({ length: n }, () => 0.55 + rng());
  const sum = w.reduce((a, b) => a + b, 0);
  const raw = w.map((x) => Math.floor((x / sum) * total));
  let used = raw.reduce((a, b) => a + b, 0);
  let i = 0;
  while (used < total) {
    raw[i % n]! += 1;
    used += 1;
    i += 1;
  }
  return raw;
}

function cellOf(x: number, y: number, size: number) {
  const cell = size / 3;
  const col = Math.min(2, Math.floor(x / cell));
  const row = Math.min(2, Math.floor(y / cell));
  const sector = MASTER_CELL_IDS[row]?.[col];
  if (!sector) return null;
  const xPct = ((x - col * cell) / cell) * 100;
  const yPct = ((y - row * cell) / cell) * 100;
  return { sector, row, col, xPct, yPct };
}

function masterDisks(avoid: AvoidDisk[], size: number) {
  const cell = size / 3;
  return avoid
    .map((a) => {
      const sid = a.areaId.replace(/^area_/, "");
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
      if (row < 0) return null;
      return {
        x: col * cell + (a.xPct / 100) * cell,
        y: row * cell + (a.yPct / 100) * cell,
        r: (a.rPct / 100) * cell,
      };
    })
    .filter((d): d is { x: number; y: number; r: number } => !!d);
}

function hitsDisks(x: number, y: number, disks: { x: number; y: number; r: number }[]): boolean {
  for (const d of disks) {
    if (hypot(x - d.x, y - d.y) < d.r) return true;
  }
  return false;
}

/** i21 남쪽 시작 들판 — 원 밖이어도 가로로 비워 둔다 */
function isStartField(sector: string, xPct: number, yPct: number): boolean {
  if (sector !== "i21") return false;
  return yPct >= 68 && Math.abs(xPct - I21_START.xPct) < 18;
}

function dataUrlToAlpha(dataUrl: string, size: number): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = size;
      c.height = size;
      const g = c.getContext("2d")!;
      g.clearRect(0, 0, size, size);
      g.drawImage(img, 0, 0, size, size);
      const data = g.getImageData(0, 0, size, size).data;
      const out = new Uint8Array(size * size);
      for (let i = 0, p = 0; i < out.length; i++, p += 4) {
        out[i] = data[p + 3]! > ALPHA ? 1 : 0;
      }
      resolve(out);
    };
    img.onerror = () => reject(new Error("mask layer image"));
    img.src = dataUrl;
  });
}

function empty(size: number): Uint8Array {
  return new Uint8Array(size * size);
}

function orMasks(size: number, ...masks: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(size * size);
  for (let i = 0; i < out.length; i++) {
    for (const m of masks) {
      if (m[i]) {
        out[i] = 1;
        break;
      }
    }
  }
  return out;
}

function distToOff(on: Uint8Array, size: number): Float32Array {
  const n = size * size;
  const dist = new Float32Array(n);
  dist.fill(1e6);
  const q = new Int32Array(n);
  let head = 0;
  let tail = 0;
  for (let i = 0; i < n; i++) {
    if (!on[i]) {
      dist[i] = 0;
      q[tail++] = i;
    }
  }
  while (head < tail) {
    const i = q[head++]!;
    const x = i % size;
    const d0 = dist[i]! + 1;
    if (x + 1 < size) relax(i + 1);
    if (x > 0) relax(i - 1);
    if (i + size < n) relax(i + size);
    if (i - size >= 0) relax(i - size);
    function relax(j: number) {
      if (d0 < dist[j]!) {
        dist[j] = d0;
        q[tail++] = j;
      }
    }
  }
  return dist;
}

function dilate(on: Uint8Array, size: number, radius: number): Uint8Array {
  const d = distToOff(invert(on), size);
  const out = new Uint8Array(on.length);
  for (let i = 0; i < out.length; i++) out[i] = d[i]! <= radius ? 1 : 0;
  return out;
}

function invert(on: Uint8Array): Uint8Array {
  const out = new Uint8Array(on.length);
  for (let i = 0; i < on.length; i++) out[i] = on[i] ? 0 : 1;
  return out;
}

function hypot(dx: number, dy: number): number {
  return Math.hypot(dx, dy);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function seeded(seed: number): () => number {
  let s = seed || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}
