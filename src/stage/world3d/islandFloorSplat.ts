/**
 * 컨셉 PNG → 바닥 타일 스플랫. Three와 섹터 에디터가 같이 쓴다.
 * 정화후 타일 미리보기: 들판·숲·흙길·바위·물 텍스처 혼합.
 */
import { LAND_SECTOR_IDS } from "./islandLoadOrder";

export const SPLAT_LAND_IDS = LAND_SECTOR_IDS;

/**
 * 바닥 스플랫 해상도 (인게임 IslandTerrain · 맵배치 sectorEditor 공용)
 *
 * 백업 이력 (되돌릴 때 아래 숫자로):
 * - 2026-08-23 초기:     SRC=320  OUT=1024 TILE=128 REPEAT=18
 * - 2026-08-23 1차 상향: SRC=512  OUT=2048 TILE=256 REPEAT=20
 * - 2026-08-23 2차 상향: SRC=768  OUT=3072 TILE=256 REPEAT=24
 * - 2026-08-25 스트리밍: SRC=768  OUT=2048 TILE=256 REPEAT=24  ← 현재
 *   (5칸 선생성 중단 · 들판 스폰 칸 우선. 발밑이 뭉개지면 OUT만 3072)
 *
 * 소스 타일 PNG는 512×512. TILE>512는 이득 거의 없음.
 * OUT↑ = 발밑 선명 / 생성·VRAM↑.
 */
const SRC = 768;
const OUT = 2048;
const TILE = 256;
const REPEAT = 24;
const INPAINT_PASSES = 24;
const ROOF_DILATE = 14;

export function loadSplatImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`image load failed: ${src}`));
    img.src = src;
  });
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function looksLikeWater(r: number, g: number, b: number): boolean {
  return b > 70 && b + 8 >= g && b > r + 10 && b - r > 16;
}

function drawToSize(img: HTMLImageElement, size: number): ImageData {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, size, size);
  return ctx.getImageData(0, 0, size, size);
}

function floodSea(waterish: Uint8Array, S: number): Uint8Array {
  const n = S * S;
  const sea = new Uint8Array(n);
  const stack: number[] = [];
  const tryPush = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= S || y >= S) return;
    const i = y * S + x;
    if (!waterish[i] || sea[i]) return;
    sea[i] = 1;
    stack.push(i);
  };
  for (let x = 0; x < S; x++) {
    tryPush(x, 0);
    tryPush(x, S - 1);
  }
  for (let y = 0; y < S; y++) {
    tryPush(0, y);
    tryPush(S - 1, y);
  }
  while (stack.length) {
    const i = stack.pop()!;
    const x = i % S;
    const y = (i / S) | 0;
    tryPush(x + 1, y);
    tryPush(x - 1, y);
    tryPush(x, y + 1);
    tryPush(x, y - 1);
  }
  return sea;
}

function keepLargestLand(sea: Uint8Array, S: number): void {
  const n = S * S;
  const seen = new Uint8Array(n);
  let bestStart = -1;
  let bestCount = 0;
  const stack: number[] = [];
  for (let i = 0; i < n; i++) {
    if (sea[i] || seen[i]) continue;
    const start = i;
    let count = 0;
    stack.push(i);
    seen[i] = 1;
    while (stack.length) {
      const j = stack.pop()!;
      count++;
      const x = j % S;
      const y = (j / S) | 0;
      const nbs = [j + 1, j - 1, j + S, j - S];
      const ok = [x + 1 < S, x > 0, y + 1 < S, y > 0];
      for (let k = 0; k < 4; k++) {
        if (!ok[k]) continue;
        const nb = nbs[k];
        if (sea[nb] || seen[nb]) continue;
        seen[nb] = 1;
        stack.push(nb);
      }
    }
    if (count > bestCount) {
      bestCount = count;
      bestStart = start;
    }
  }
  if (bestStart < 0) return;
  const keep = new Uint8Array(n);
  stack.push(bestStart);
  keep[bestStart] = 1;
  while (stack.length) {
    const j = stack.pop()!;
    const x = j % S;
    const y = (j / S) | 0;
    const nbs = [j + 1, j - 1, j + S, j - S];
    const ok = [x + 1 < S, x > 0, y + 1 < S, y > 0];
    for (let k = 0; k < 4; k++) {
      if (!ok[k]) continue;
      const nb = nbs[k];
      if (sea[nb] || keep[nb]) continue;
      keep[nb] = 1;
      stack.push(nb);
    }
  }
  for (let i = 0; i < n; i++) {
    if (!sea[i] && !keep[i]) sea[i] = 1;
  }
}

function dilateMask(src: Uint8Array, S: number, radius: number): Uint8Array {
  const out = new Uint8Array(src);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      if (!src[y * S + x]) continue;
      const y0 = Math.max(0, y - radius);
      const y1 = Math.min(S - 1, y + radius);
      const x0 = Math.max(0, x - radius);
      const x1 = Math.min(S - 1, x + radius);
      for (let yy = y0; yy <= y1; yy++) {
        const row = yy * S;
        for (let xx = x0; xx <= x1; xx++) out[row + xx] = 1;
      }
    }
  }
  return out;
}

function objectMask(px: Uint8ClampedArray, sea: Uint8Array, S: number): Uint8Array {
  const n = S * S;
  const roof = new Uint8Array(n);
  const obj = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    if (sea[i]) continue;
    const o = i * 4;
    const r = px[o];
    const g = px[o + 1];
    const b = px[o + 2];
    const v = (r + g + b) / 3;
    const isRoof = b > 85 && g > 70 && b >= g - 15 && r < g - 8 && r < 140 && v > 60 && v < 170;
    const isTree = v < 55 && g >= r && g >= b - 5 && g > 25;
    const isLantern = b > 180 && g > 140 && r < 120;
    if (isRoof) roof[i] = 1;
    if (isRoof || isTree || isLantern) obj[i] = 1;
  }
  const nearRoof = dilateMask(roof, S, ROOF_DILATE);
  for (let i = 0; i < n; i++) {
    if (sea[i] || obj[i] || !nearRoof[i]) continue;
    const o = i * 4;
    const r = px[o];
    const g = px[o + 1];
    const b = px[o + 2];
    const v = (r + g + b) / 3;
    if (v < 62 && r > g && g >= b - 5 && r < 110) obj[i] = 1;
  }
  return obj;
}

function inpaintFloor(px: Uint8ClampedArray, sea: Uint8Array, obj: Uint8Array, S: number): Float32Array {
  const n = S * S;
  const rgb = new Float32Array(n * 3);
  const filled = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    rgb[i * 3] = px[o];
    rgb[i * 3 + 1] = px[o + 1];
    rgb[i * 3 + 2] = px[o + 2];
    if (!sea[i] && !obj[i]) filled[i] = 1;
  }
  const next = new Float32Array(rgb);
  const nextFilled = new Uint8Array(filled);
  for (let pass = 0; pass < INPAINT_PASSES; pass++) {
    next.set(rgb);
    nextFilled.set(filled);
    let left = 0;
    for (let i = 0; i < n; i++) {
      if (sea[i] || filled[i]) continue;
      const x = i % S;
      const y = (i / S) | 0;
      let sr = 0;
      let sg = 0;
      let sb = 0;
      let c = 0;
      for (let dy = -1; dy <= 1; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= S) continue;
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const xx = x + dx;
          if (xx < 0 || xx >= S) continue;
          const j = yy * S + xx;
          if (!filled[j]) continue;
          sr += rgb[j * 3];
          sg += rgb[j * 3 + 1];
          sb += rgb[j * 3 + 2];
          c++;
        }
      }
      if (!c) {
        left++;
        continue;
      }
      next[i * 3] = sr / c;
      next[i * 3 + 1] = sg / c;
      next[i * 3 + 2] = sb / c;
      nextFilled[i] = 1;
    }
    rgb.set(next);
    filled.set(nextFilled);
    if (!left) break;
  }
  for (let i = 0; i < n; i++) {
    if (sea[i] || filled[i]) continue;
    rgb[i * 3] = 90;
    rgb[i * 3 + 1] = 110;
    rgb[i * 3 + 2] = 45;
  }
  return rgb;
}

function blurFloat(src: Float32Array, S: number, radius: number): Float32Array {
  const tmp = new Float32Array(src.length);
  const out = new Float32Array(src.length);
  const k = radius * 2 + 1;
  for (let y = 0; y < S; y++) {
    const row = y * S;
    for (let x = 0; x < S; x++) {
      let acc = 0;
      for (let d = -radius; d <= radius; d++) {
        const xx = x + d < 0 ? 0 : x + d >= S ? S - 1 : x + d;
        acc += src[row + xx];
      }
      tmp[row + x] = acc / k;
    }
  }
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      let acc = 0;
      for (let d = -radius; d <= radius; d++) {
        const yy = y + d < 0 ? 0 : y + d >= S ? S - 1 : y + d;
        acc += tmp[yy * S + x];
      }
      out[y * S + x] = acc / k;
    }
  }
  return out;
}

function sampleBilinear(map: Float32Array, S: number, u: number, v: number): number {
  const x = u * (S - 1);
  const y = v * (S - 1);
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(S - 1, x0 + 1);
  const y1 = Math.min(S - 1, y0 + 1);
  const tx = x - x0;
  const ty = y - y0;
  const a = map[y0 * S + x0];
  const b = map[y0 * S + x1];
  const c = map[y1 * S + x0];
  const d = map[y1 * S + x1];
  return a * (1 - tx) * (1 - ty) + b * tx * (1 - ty) + c * (1 - tx) * ty + d * tx * ty;
}

function wrapSample(data: Uint8ClampedArray, tw: number, px: number, py: number): [number, number, number] {
  const x = ((px % tw) + tw) % tw | 0;
  const y = ((py % tw) + tw) % tw | 0;
  const o = (y * tw + x) * 4;
  return [data[o], data[o + 1], data[o + 2]];
}

/** 밝은 황토 흙길. 부두 널빤지·올리브 풀은 빼다. */
function pathWeight(r: number, g: number, b: number): number {
  const v = (r + g + b) / 3;
  if (v < 118 || r < 148 || g < 108 || b > 128) return 0;
  const yellow = g / Math.max(r, 1);
  if (yellow < 0.7 || yellow > 0.95) return 0;
  if (r - b < 48) return 0;
  return clamp01((v - 118) / 42) * clamp01((yellow - 0.7) / 0.08);
}

function floorWeights(rgb: Float32Array, sea: Uint8Array, S: number): {
  grass: Float32Array;
  forest: Float32Array;
  dirt: Float32Array;
  cobble: Float32Array;
} {
  const n = S * S;
  const grass = new Float32Array(n);
  const forest = new Float32Array(n);
  const dirt = new Float32Array(n);
  const cobble = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    if (sea[i]) continue;
    const r = rgb[i * 3];
    const g = rgb[i * 3 + 1];
    const b = rgb[i * 3 + 2];
    const v = (r + g + b) / 3;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const sat = max <= 1 ? 0 : (max - min) / max;

    // 흙·희미한 길 (황토)
    let d =
      clamp01((v - 100) / 55) *
      clamp01((r - 120) / 55) *
      clamp01((200 - b) / 90) *
      clamp01((g - r * 0.45) / 55);
    if (v > 140 && r > 160 && g > 120 && b < 130) d = Math.max(d, 0.85);

    // 바위 (저채도 회보라)
    const c =
      sat < 0.28 && v > 60 && v < 180 && Math.abs(r - b) < 35
        ? ((0.28 - sat) / 0.28) * 0.75
        : clamp01((95 - Math.abs(r - b)) / 95) * clamp01((130 - v) / 80) * 0.35;

    // 숲 (어둡고 초록 우세)
    let fo =
      clamp01((g - r) / 35) *
      clamp01((g - b) / 25) *
      clamp01((120 - v) / 70 + 0.2) *
      clamp01((g - 40) / 60);
    if (g > r + 12 && g > b + 8 && v < 110) fo = Math.max(fo, 0.8);

    // 들판·꽃 (밝고 노란/연두)
    let gr =
      clamp01((g - r + 20) / 50) *
      clamp01((v - 90) / 70) *
      clamp01((180 - Math.abs(g - 140)) / 80);
    if (r > 160 && g > 140 && b < 140 && v > 130) gr = Math.max(gr, 0.7); // flower warm
    gr = clamp01(gr);

    const sum = d + c + fo + gr + 1e-6;
    dirt[i] = d / sum;
    cobble[i] = c / sum;
    forest[i] = fo / sum;
    grass[i] = gr / sum;
  }
  return { grass, forest, dirt, cobble };
}

function tilePixels(img: HTMLImageElement, size: number): Uint8ClampedArray {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0, size, size);
  return ctx.getImageData(0, 0, size, size).data;
}

/** 컨셉에서 집·나무를 걷고 흙길만 남긴 캔버스 (나머지 투명). */
export function paintSectorPathCanvas(concept: HTMLImageElement, dirtTile: HTMLImageElement): HTMLCanvasElement {
  const src = drawToSize(concept, SRC);
  const waterish = new Uint8Array(SRC * SRC);
  for (let i = 0; i < waterish.length; i++) {
    const o = i * 4;
    waterish[i] = looksLikeWater(src.data[o], src.data[o + 1], src.data[o + 2]) ? 1 : 0;
  }
  const sea = floodSea(waterish, SRC);
  keepLargestLand(sea, SRC);
  const obj = objectMask(src.data, sea, SRC);
  const rgb = inpaintFloor(src.data, sea, obj, SRC);
  const path = new Float32Array(SRC * SRC);
  for (let i = 0; i < path.length; i++) {
    if (sea[i]) continue;
    path[i] = pathWeight(rgb[i * 3], rgb[i * 3 + 1], rgb[i * 3 + 2]);
  }
  const pathW = blurFloat(path, SRC, 2);
  const dirt = tilePixels(dirtTile, TILE);
  const c = document.createElement("canvas");
  c.width = OUT;
  c.height = OUT;
  const ctx = c.getContext("2d")!;
  const out = ctx.createImageData(OUT, OUT);
  const p = out.data;
  const scale = (REPEAT * TILE) / OUT;
  for (let y = 0; y < OUT; y++) {
    const v = (y + 0.5) / OUT;
    const ty = y * scale;
    for (let x = 0; x < OUT; x++) {
      const u = (x + 0.5) / OUT;
      const w = sampleBilinear(pathW, SRC, u, v);
      const a = w < 0.2 ? 0 : clamp01((w - 0.2) / 0.35);
      const o = (y * OUT + x) * 4;
      if (a <= 0.01) continue;
      const d = wrapSample(dirt, TILE, x * scale, ty);
      p[o] = d[0];
      p[o + 1] = d[1];
      p[o + 2] = d[2];
      p[o + 3] = Math.round(a * 255);
    }
  }
  ctx.putImageData(out, 0, 0);
  return c;
}

export async function paintSectorPathUrl(conceptUrl: string, dirtUrl: string): Promise<string> {
  const [concept, dirt] = await Promise.all([loadSplatImage(conceptUrl), loadSplatImage(dirtUrl)]);
  const canvas = paintSectorPathCanvas(concept, dirt);
  return canvasToUrl(canvas);
}

/** 컨셉에서 오브젝트를 걷고 들판·숲·흙·바위 타일을 섞은 정화후 바닥. */
export function paintSectorFloorCanvas(
  concept: HTMLImageElement,
  tiles: {
    grass: HTMLImageElement;
    forest: HTMLImageElement;
    dirt: HTMLImageElement;
    cobble: HTMLImageElement;
    water: HTMLImageElement;
  },
): HTMLCanvasElement {
  const src = drawToSize(concept, SRC);
  const waterish = new Uint8Array(SRC * SRC);
  for (let i = 0; i < waterish.length; i++) {
    const o = i * 4;
    waterish[i] = looksLikeWater(src.data[o], src.data[o + 1], src.data[o + 2]) ? 1 : 0;
  }
  const sea = floodSea(waterish, SRC);
  keepLargestLand(sea, SRC);
  const obj = objectMask(src.data, sea, SRC);
  const rgb = inpaintFloor(src.data, sea, obj, SRC);
  const w = floorWeights(rgb, sea, SRC);
  const grassW = blurFloat(w.grass, SRC, 2);
  const forestW = blurFloat(w.forest, SRC, 2);
  const dirtW = blurFloat(w.dirt, SRC, 2);
  const cobbleW = blurFloat(w.cobble, SRC, 2);
  const grass = tilePixels(tiles.grass, TILE);
  const forest = tilePixels(tiles.forest, TILE);
  const dirt = tilePixels(tiles.dirt, TILE);
  const cobble = tilePixels(tiles.cobble, TILE);
  const water = tilePixels(tiles.water, TILE);
  const c = document.createElement("canvas");
  c.width = OUT;
  c.height = OUT;
  const ctx = c.getContext("2d")!;
  const out = ctx.createImageData(OUT, OUT);
  const p = out.data;
  const scale = (REPEAT * TILE) / OUT;
  for (let y = 0; y < OUT; y++) {
    const v = (y + 0.5) / OUT;
    const ty = y * scale;
    for (let x = 0; x < OUT; x++) {
      const u = (x + 0.5) / OUT;
      const tx = x * scale;
      const gW = sampleBilinear(grassW, SRC, u, v);
      const fW = sampleBilinear(forestW, SRC, u, v);
      const dW = sampleBilinear(dirtW, SRC, u, v);
      const cW = sampleBilinear(cobbleW, SRC, u, v);
      const g = wrapSample(grass, TILE, tx, ty);
      const f = wrapSample(forest, TILE, tx, ty);
      const d = wrapSample(dirt, TILE, tx, ty);
      const cb = wrapSample(cobble, TILE, tx, ty);
      const wt = wrapSample(water, TILE, tx, ty);
      const o = (y * OUT + x) * 4;
      const sx = Math.min(SRC - 1, ((x * SRC) / OUT) | 0);
      const sy = Math.min(SRC - 1, ((y * SRC) / OUT) | 0);
      if (sea[sy * SRC + sx]) {
        p[o] = wt[0];
        p[o + 1] = wt[1];
        p[o + 2] = wt[2];
        p[o + 3] = 255;
        continue;
      }
      p[o] = g[0] * gW + f[0] * fW + d[0] * dW + cb[0] * cW;
      p[o + 1] = g[1] * gW + f[1] * fW + d[1] * dW + cb[1] * cW;
      p[o + 2] = g[2] * gW + f[2] * fW + d[2] * dW + cb[2] * cW;
      p[o + 3] = 255;
    }
  }
  ctx.putImageData(out, 0, 0);
  return c;
}

let defaultFloorTiles: {
  grass: HTMLImageElement;
  forest: HTMLImageElement;
  dirt: HTMLImageElement;
  cobble: HTMLImageElement;
  water: HTMLImageElement;
} | null = null;

async function loadDefaultFloorTiles(): Promise<{
  grass: HTMLImageElement;
  forest: HTMLImageElement;
  dirt: HTMLImageElement;
  cobble: HTMLImageElement;
  water: HTMLImageElement;
}> {
  if (defaultFloorTiles) return defaultFloorTiles;
  const [grass, forest, dirt, cobble, water] = await Promise.all([
    loadSplatImage("/art/tiles/floor/floor_grass_flower.png"),
    loadSplatImage("/art/tiles/floor/floor_forest.png"),
    loadSplatImage("/art/tiles/floor/floor_dirt.png"),
    loadSplatImage("/art/tiles/floor/floor_cobble.png"),
    loadSplatImage("/art/tiles/floor/floor_water_deep.png"),
  ]);
  defaultFloorTiles = { grass, forest, dirt, cobble, water };
  return defaultFloorTiles;
}

/** 컨셉 Image → 타일 스플랫 캔버스 (IslandTerrain·에디터 공용) */
export async function paintSectorFloorFromImage(concept: HTMLImageElement): Promise<HTMLCanvasElement> {
  const tiles = await loadDefaultFloorTiles();
  return paintSectorFloorCanvas(concept, tiles);
}

/** 인게임·맵배치 공용 — 컨셉에서 바다·오브젝트 마스크 추출 */
export function analyzeConceptMesh(concept: HTMLImageElement): {
  sea: Uint8Array;
  srcSize: number;
  objectMask: Uint8Array;
} {
  const src = drawToSize(concept, SRC);
  const waterish = new Uint8Array(SRC * SRC);
  for (let i = 0; i < waterish.length; i++) {
    const o = i * 4;
    waterish[i] = looksLikeWater(src.data[o], src.data[o + 1], src.data[o + 2]) ? 1 : 0;
  }
  const sea = floodSea(waterish, SRC);
  keepLargestLand(sea, SRC);
  const obj = objectMask(src.data, sea, SRC);
  return { sea, srcSize: SRC, objectMask: obj };
}

export async function paintSectorFloorUrl(conceptUrl: string): Promise<string> {
  const concept = await loadSplatImage(conceptUrl);
  const canvas = await paintSectorFloorFromImage(concept);
  return canvasToUrl(canvas);
}

function canvasToUrl(canvas: HTMLCanvasElement): Promise<string> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("floor canvas blob failed"));
        return;
      }
      resolve(URL.createObjectURL(blob));
    }, "image/png");
  });
}
