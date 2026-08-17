/**
 * 컨셉 PNG → 바닥 타일 스플랫. Three와 섹터 에디터가 같이 쓴다.
 * 에디터 floor 모드는 흙길만 그린다.
 */

export const SPLAT_LAND_IDS = ["i01", "i10", "i11", "i12", "i21"] as const;

const SRC = 280;
const OUT = 512;
const TILE = 128;
const REPEAT = 14;
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
  dirt: Float32Array;
  wood: Float32Array;
  cobble: Float32Array;
} {
  const n = S * S;
  const grass = new Float32Array(n);
  const dirt = new Float32Array(n);
  const wood = new Float32Array(n);
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
    let d =
      clamp01((v - 118) / 50) *
      clamp01((r - 145) / 50) *
      clamp01((210 - b) / 90) *
      clamp01((g - r * 0.52) / 50);
    if (v > 150 && r > 175 && g > 125 && b < 120) d = Math.max(d, 0.95);
    let w =
      clamp01((r - g - 12) / 40) *
      clamp01((g - b) / 35) *
      clamp01((160 - v) / 45) *
      clamp01((r - 85) / 55);
    if (v > 150) w *= 0.28;
    const c = sat < 0.26 && v > 72 && v < 175 ? ((0.26 - sat) / 0.26) * 0.55 : 0;
    let gr = clamp01((95 - Math.abs(g - r)) / 95) * clamp01((155 - v) / 70 + 0.35);
    gr = clamp01(gr + 0.25 * clamp01((g - r + 8) / 30));
    const sum = d + w + c + gr + 1e-6;
    dirt[i] = d / sum;
    wood[i] = w / sum;
    cobble[i] = c / sum;
    grass[i] = gr / sum;
  }
  return { grass, dirt, wood, cobble };
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

/** 컨셉에서 오브젝트를 걷고 풀·흙·덱·판석 타일을 섞은 정화후 바닥. */
export function paintSectorFloorCanvas(
  concept: HTMLImageElement,
  tiles: { grass: HTMLImageElement; dirt: HTMLImageElement; wood: HTMLImageElement; cobble: HTMLImageElement },
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
  const dirtW = blurFloat(w.dirt, SRC, 2);
  const woodW = blurFloat(w.wood, SRC, 2);
  const cobbleW = blurFloat(w.cobble, SRC, 2);
  const grass = tilePixels(tiles.grass, TILE);
  const dirt = tilePixels(tiles.dirt, TILE);
  const wood = tilePixels(tiles.wood, TILE);
  const cobble = tilePixels(tiles.cobble, TILE);
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
      const dW = sampleBilinear(dirtW, SRC, u, v);
      const woW = sampleBilinear(woodW, SRC, u, v);
      const cW = sampleBilinear(cobbleW, SRC, u, v);
      const g = wrapSample(grass, TILE, tx, ty);
      const d = wrapSample(dirt, TILE, tx, ty);
      const wo = wrapSample(wood, TILE, tx, ty);
      const cb = wrapSample(cobble, TILE, tx, ty);
      const o = (y * OUT + x) * 4;
      const sx = Math.min(SRC - 1, ((x * SRC) / OUT) | 0);
      const sy = Math.min(SRC - 1, ((y * SRC) / OUT) | 0);
      if (sea[sy * SRC + sx]) {
        p[o] = 78;
        p[o + 1] = 138;
        p[o + 2] = 158;
        p[o + 3] = 255;
        continue;
      }
      p[o] = g[0] * gW + d[0] * dW + wo[0] * woW + cb[0] * cW;
      p[o + 1] = g[1] * gW + d[1] * dW + wo[1] * woW + cb[1] * cW;
      p[o + 2] = g[2] * gW + d[2] * dW + wo[2] * woW + cb[2] * cW;
      p[o + 3] = 255;
    }
  }
  ctx.putImageData(out, 0, 0);
  return c;
}

export async function paintSectorFloorUrl(conceptUrl: string): Promise<string> {
  const [concept, grass, dirt, wood, cobble] = await Promise.all([
    loadSplatImage(conceptUrl),
    loadSplatImage("/art/tiles/floor/floor_grass_flower.png"),
    loadSplatImage("/art/tiles/floor/floor_dirt.png"),
    loadSplatImage("/art/tiles/floor/floor_wood_plank.png"),
    loadSplatImage("/art/tiles/floor/floor_cobble.png"),
  ]);
  return canvasToUrl(paintSectorFloorCanvas(concept, { grass, dirt, wood, cobble }));
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
