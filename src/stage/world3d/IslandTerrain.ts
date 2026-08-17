/**
 * 9칸 평평한 섬 바닥 — 물 위에 육지 5칸.
 * 맵 프로토와 본편 Journey3D가 같이 쓴다. 렌더러·카메라는 호출 쪽이 가진다.
 *
 * 컨셉 PNG에서 집·나무·울타리를 걷어 낸 뒤, 풀/흙/나무/판석 타일을 부드럽게 섞는다.
 * 집·노드는 올리지 않는다.
 */
import * as THREE from "three";
import type { WorldProp } from "./types";
import { stickerForDraft } from "./propArt";

export const SECTOR_M = 333;
const LAND_IDS = ["i01", "i10", "i11", "i12", "i21"] as const;
/** 정화 전 — 타일 색을 죽이고 탁한 청회색으로. 흰색 곱하기는 풀색이 그대로 남는다 */
const POLLUTED_TINT = 0xffffff;

/** 컨셉 분류 해상도. 이 위에서 오브젝트 마스크·가중치를 만든다. */
const SPLAT_SRC = 320;
/** 타일 샘플을 찍어 내는 최종 텍스처. */
const SPLAT_OUT = 768;
const TILE_SAMPLE = 128;
const TILE_REPEAT = 16;
const MASK_SIZE = 512;
const INPAINT_PASSES = 28;
const ROOF_DILATE = 16;

export const LAND_SECTORS: readonly string[] = LAND_IDS;

export function sectorIdOf(areaId: string): string {
  return areaId.replace(/^area_/, "");
}

export function sectorOrigin(areaId: string, cellM = SECTOR_M): { x: number; z: number } {
  const id = sectorIdOf(areaId);
  const row = Number(id[1]);
  const col = Number(id[2]);
  return {
    x: (col - 1) * cellM,
    z: (row - 1) * cellM,
  };
}

export function areaToWorld(areaId: string, xPct: number, yPct: number, cellM = SECTOR_M): { x: number; z: number } {
  const o = sectorOrigin(areaId, cellM);
  return {
    x: o.x + (xPct / 100 - 0.5) * cellM,
    z: o.z + (yPct / 100 - 0.5) * cellM,
  };
}

export function worldToAreaId(x: number, z: number, cellM = SECTOR_M): string {
  const col = Math.floor((x + cellM / 2) / cellM) + 1;
  const row = Math.floor((z + cellM / 2) / cellM) + 1;
  if (row < 0 || row > 2 || col < 0 || col > 2) return "";
  return `i${row}${col}`;
}

function looksLikeWater(r: number, g: number, b: number): boolean {
  return b > 70 && b + 8 >= g && b > r + 10 && b - r > 16;
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`image load failed: ${src}`));
    img.src = src;
  });
}

function canvasColorTex(c: HTMLCanvasElement): THREE.Texture {
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

function canvasToMaskTex(c: HTMLCanvasElement): THREE.Texture {
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.NoColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
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

/** 물 위의 배·연잎처럼 떨어진 작은 육지는 바다로 돌려 섬만 남긴다. */
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

type StickerDraft = { xPct: number; yPct: number; hFrac: number; aspect: number };

function extractStickerDrafts(
  _concept: HTMLImageElement,
  obj: Uint8Array,
  S: number,
): StickerDraft[] {
  const seen = new Uint8Array(S * S);
  const drafts: StickerDraft[] = [];
  const stack: number[] = [];
  for (let i = 0; i < obj.length; i++) {
    if (!obj[i] || seen[i]) continue;
    stack.length = 0;
    stack.push(i);
    seen[i] = 1;
    let x0 = S;
    let y0 = S;
    let x1 = 0;
    let y1 = 0;
    let sx = 0;
    let sy = 0;
    let n = 0;
    while (stack.length) {
      const p = stack.pop()!;
      const x = p % S;
      const y = (p / S) | 0;
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
      sx += x;
      sy += y;
      n++;
      const tryN = (nx: number, ny: number) => {
        if (nx < 0 || ny < 0 || nx >= S || ny >= S) return;
        const j = ny * S + nx;
        if (!obj[j] || seen[j]) return;
        seen[j] = 1;
        stack.push(j);
      };
      tryN(x + 1, y);
      tryN(x - 1, y);
      tryN(x, y + 1);
      tryN(x, y - 1);
    }
    if (n < 28 || drafts.length >= 18) continue;
    const bw = x1 - x0 + 1;
    const bh = y1 - y0 + 1;
    drafts.push({
      xPct: (sx / n / S) * 100,
      yPct: (sy / n / S) * 100,
      hFrac: bh / S,
      aspect: Math.max(0.35, bw / Math.max(1, bh)),
    });
  }
  return drafts;
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

function maskFromSea(sea: Uint8Array, srcS: number, outS: number): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = outS;
  c.height = outS;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(outS, outS);
  const p = img.data;
  for (let y = 0; y < outS; y++) {
    const sy = Math.min(srcS - 1, ((y * srcS) / outS) | 0);
    for (let x = 0; x < outS; x++) {
      const sx = Math.min(srcS - 1, ((x * srcS) / outS) | 0);
      const v = sea[sy * srcS + sx] ? 0 : 255;
      const o = (y * outS + x) * 4;
      p[o] = v;
      p[o + 1] = v;
      p[o + 2] = v;
      p[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvasToMaskTex(c);
}

function wirePolluteShader(mat: THREE.MeshBasicMaterial) {
  const uPolluted = { value: 0 };
  const uWaveActive = { value: 0 };
  const uWaveCenter = { value: new THREE.Vector2(0, 0) };
  const uWaveR = { value: 0 };
  const uCellM = { value: 333 };
  mat.userData.uPolluted = uPolluted;
  mat.userData.uWaveActive = uWaveActive;
  mat.userData.uWaveCenter = uWaveCenter;
  mat.userData.uWaveR = uWaveR;
  mat.userData.uCellM = uCellM;
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uPolluted = uPolluted;
    shader.uniforms.uWaveActive = uWaveActive;
    shader.uniforms.uWaveCenter = uWaveCenter;
    shader.uniforms.uWaveR = uWaveR;
    shader.uniforms.uCellM = uCellM;
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
uniform float uPolluted;
uniform float uWaveActive;
uniform vec2 uWaveCenter;
uniform float uWaveR;
uniform float uCellM;`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        if (uPolluted > 0.5) {
          vec3 baseColor = diffuseColor.rgb;
          vec2 uv = vMapUv;
          vec2 px = vec2(0.0016, 0.0016);
          float g = dot(baseColor, vec3(0.30, 0.32, 0.22));
          float l1 = dot(texture2D(map, uv + vec2(px.x, 0.0)).rgb, vec3(0.30, 0.32, 0.22));
          float l2 = dot(texture2D(map, uv - vec2(px.x, 0.0)).rgb, vec3(0.30, 0.32, 0.22));
          float l3 = dot(texture2D(map, uv + vec2(0.0, px.y)).rgb, vec3(0.30, 0.32, 0.22));
          float l4 = dot(texture2D(map, uv - vec2(0.0, px.y)).rgb, vec3(0.30, 0.32, 0.22));
          float edge = clamp(length(vec2(l1 - l2, l3 - l4)) * 3.4, 0.0, 1.0);
          float inkAmt = clamp(edge + (1.0 - g) * 0.18, 0.0, 1.0);
          vec3 paper = vec3(0.98, 0.97, 0.94);
          vec3 ink = vec3(0.20, 0.20, 0.22);
          vec3 sketch = mix(paper, ink, inkAmt);
          if (uWaveActive > 0.5) {
            vec2 local = vec2((uv.x - 0.5) * uCellM, (0.5 - uv.y) * uCellM);
            float d = length(local - uWaveCenter);
            float soft = max(1.5, uCellM * 0.012);
            float reveal = 1.0 - smoothstep(uWaveR - soft, uWaveR + soft * 0.35, d);
            diffuseColor.rgb = mix(sketch, baseColor, reveal);
          } else {
            diffuseColor.rgb = sketch;
          }
        }`,
      );
  };
  mat.customProgramCacheKey = () => "island-pollute-v5-wave";
}

export interface IslandTerrainOpts {
  cellSize?: number;
  anisotropy?: number;
  /** true면 현재 섹터가 원점에 오도록 그룹을 민다(본편). false면 절대 좌표(맵 프로토). */
  centerOnFocus?: boolean;
}

type TilePix = { data: Uint8ClampedArray; size: number };

export class IslandTerrain {
  readonly group = new THREE.Group();
  readonly ready: Promise<void>;

  private cellM: number;
  private anisotropy: number;
  private centerOnFocus: boolean;
  private land: Record<string, THREE.Mesh> = {};
  private water: THREE.Mesh | null = null;
  private purified = new Set<string>();
  private tintFromPurify = false;
  private tileOverride: string | "auto" = "auto";
  private focusId = "i21";
  private tileCache = new Map<string, HTMLImageElement>();
  private tilePix = new Map<string, TilePix>();
  private conceptCache = new Map<string, HTMLImageElement>();
  private stickerDrafts = new Map<string, StickerDraft[]>();
  private disposed = false;
  /** 정화 파도 — 플레이어 주변에서 바깥으로 컬러 공개 */
  private wave: { x: number; z: number; r: number } | null = null;

  constructor(opts: IslandTerrainOpts = {}) {
    this.cellM = opts.cellSize ?? SECTOR_M;
    this.anisotropy = opts.anisotropy ?? 1;
    this.centerOnFocus = opts.centerOnFocus ?? false;
    this.ready = this.build();
  }

  setCellSize(m: number): void {
    if (m <= 0 || m === this.cellM) return;
    this.cellM = m;
    this.layout();
  }

  setFocus(areaId: string): void {
    this.focusId = sectorIdOf(areaId);
    this.layout();
  }

  setPurified(areaIds: string[]): void {
    this.tintFromPurify = true;
    const next = new Set(areaIds.map(sectorIdOf));
    if (next.size === this.purified.size && [...next].every((id) => this.purified.has(id))) {
      this.applyTints();
      return;
    }
    this.purified = next;
    this.applyTints();
  }

  /**
   * 정화 파도(미터). focus 섹터 로컬 xz(= 플레이어 world xz, centerOnFocus 시).
   * null이면 파도 종료.
   */
  setPurifyWave(wave: { x: number; z: number; r: number } | null): void {
    this.wave = wave;
    this.applyTints();
  }

  backgroundProps(areaId: string): WorldProp[] {
    const id = sectorIdOf(areaId);
    const drafts = this.stickerDrafts.get(id) ?? [];
    return drafts.map((d, i) => {
      const pick = stickerForDraft(d, i);
      return {
        id: `bg_${id}_${i}`,
        xPct: d.xPct,
        yPct: d.yPct,
        kind: pick.kind,
        hM: pick.hM,
        aspect: pick.aspect,
        art: pick.art,
        billboard: true,
        collide: true,
      };
    });
  }

  setTileOverride(file: string | "auto"): void {
    const next = file === "auto" ? "auto" : file;
    if (next === this.tileOverride) return;
    this.tileOverride = next;
    void this.refreshLandMaps();
  }

  raycastMeshes(): THREE.Object3D[] {
    const out: THREE.Object3D[] = [];
    if (this.water) out.push(this.water);
    for (const id of LAND_IDS) {
      const m = this.land[id];
      if (m) out.push(m);
    }
    return out;
  }

  dispose(): void {
    this.disposed = true;
    this.group.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.geometry.dispose();
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.map?.dispose();
      mat.alphaMap?.dispose();
      mat.dispose();
    });
  }

  private layout(): void {
    const cell = this.cellM;
    const waterSpan = cell * 8;
    if (this.water) {
      this.water.scale.set(waterSpan, waterSpan, 1);
    }
    for (const id of LAND_IDS) {
      const mesh = this.land[id];
      if (!mesh) continue;
      const o = sectorOrigin(id, cell);
      mesh.scale.set(cell * 1.01, cell * 1.01, 1);
      mesh.position.set(o.x, 0.02, o.z);
    }
    if (this.centerOnFocus) {
      const at = sectorOrigin(this.focusId, cell);
      this.group.position.set(-at.x, 0, -at.z);
    } else {
      this.group.position.set(0, 0, 0);
    }
  }

  private applyTints(): void {
    const waveOn = this.wave != null;
    for (const id of LAND_IDS) {
      const mesh = this.land[id];
      if (!mesh) continue;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      const polluted = this.tintFromPurify && !this.purified.has(id);
      const focusWave = waveOn && id === this.focusId;
      mat.color.setHex(POLLUTED_TINT);
      if (mat.userData.uPolluted) mat.userData.uPolluted.value = polluted || focusWave ? 1 : 0;
      if (mat.userData.uWaveActive) mat.userData.uWaveActive.value = focusWave ? 1 : 0;
      if (mat.userData.uCellM) mat.userData.uCellM.value = this.cellM;
      if (mat.userData.uWaveCenter && this.wave) {
        mat.userData.uWaveCenter.value.set(this.wave.x, this.wave.z);
      }
      if (mat.userData.uWaveR) mat.userData.uWaveR.value = this.wave?.r ?? 0;
    }
    if (this.water) {
      const focusDirty =
        (this.tintFromPurify && !this.purified.has(this.focusId)) || waveOn;
      (this.water.material as THREE.MeshBasicMaterial).color.setHex(focusDirty ? 0xe8e4dc : 0xffffff);
    }
  }

  private async build(): Promise<void> {
    const waterImg = await this.tileImage("floor_water_deep.png");
    const waterTex = new THREE.Texture(waterImg);
    waterTex.colorSpace = THREE.SRGBColorSpace;
    waterTex.wrapS = THREE.RepeatWrapping;
    waterTex.wrapT = THREE.RepeatWrapping;
    waterTex.repeat.set(20, 20);
    waterTex.generateMipmaps = true;
    waterTex.minFilter = THREE.LinearMipmapLinearFilter;
    waterTex.magFilter = THREE.LinearFilter;
    waterTex.anisotropy = this.anisotropy;
    waterTex.needsUpdate = true;
    const waterMat = new THREE.MeshBasicMaterial({ map: waterTex, fog: true });
    this.water = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), waterMat);
    this.water.rotation.x = -Math.PI / 2;
    this.water.position.y = 0;
    this.group.add(this.water);

    await this.preloadTiles();
    await Promise.all(LAND_IDS.map((id) => this.addLand(id)));
    this.layout();
    this.applyTints();
  }

  private async addLand(areaId: string): Promise<void> {
    const painted = await this.paintLand(areaId);
    painted.map.anisotropy = this.anisotropy;
    const mat = new THREE.MeshBasicMaterial({
      map: painted.map,
      alphaMap: painted.mask,
      transparent: true,
      alphaTest: 0.35,
      depthWrite: false,
      fog: true,
    });
    wirePolluteShader(mat);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.renderOrder = 0;
    mesh.userData.areaId = areaId;
    this.group.add(mesh);
    this.land[areaId] = mesh;
  }

  private async paintLand(areaId: string): Promise<{ map: THREE.Texture; mask: THREE.Texture }> {
    if (this.tileOverride !== "auto") {
      const img = await this.conceptImage(areaId);
      const mask = img ? this.maskFromConcept(img) : this.fallbackMask();
      return { map: this.stampUniform(await this.tileImage(this.tileOverride)), mask };
    }
    const concept = await this.conceptImage(areaId);
    if (!concept) {
      const file = this.purified.has(areaId)
        ? "floor_grass_flower.png"
        : areaId === "i21"
          ? "floor_wood_plank.png"
          : "floor_grass.png";
      return { map: this.stampUniform(await this.tileImage(file)), mask: this.fallbackMask() };
    }
    return this.splatFromConcept(areaId, concept);
  }

  private splatFromConcept(areaId: string, concept: HTMLImageElement): { map: THREE.Texture; mask: THREE.Texture } {
    const src = drawToSize(concept, SPLAT_SRC);
    const waterish = new Uint8Array(SPLAT_SRC * SPLAT_SRC);
    for (let i = 0; i < waterish.length; i++) {
      const o = i * 4;
      waterish[i] = looksLikeWater(src.data[o], src.data[o + 1], src.data[o + 2]) ? 1 : 0;
    }
    const sea = floodSea(waterish, SPLAT_SRC);
    keepLargestLand(sea, SPLAT_SRC);
    const obj = objectMask(src.data, sea, SPLAT_SRC);
    const rgb = inpaintFloor(src.data, sea, obj, SPLAT_SRC);
    this.stickerDrafts.set(areaId, extractStickerDrafts(concept, obj, SPLAT_SRC));

    const c = document.createElement("canvas");
    c.width = SPLAT_OUT;
    c.height = SPLAT_OUT;
    const ctx = c.getContext("2d")!;
    const out = ctx.createImageData(SPLAT_OUT, SPLAT_OUT);
    const p = out.data;
    const scale = SPLAT_SRC / SPLAT_OUT;
    for (let y = 0; y < SPLAT_OUT; y++) {
      const sy = Math.min(SPLAT_SRC - 1, ((y + 0.5) * scale) | 0);
      for (let x = 0; x < SPLAT_OUT; x++) {
        const sx = Math.min(SPLAT_SRC - 1, ((x + 0.5) * scale) | 0);
        const i = sy * SPLAT_SRC + sx;
        const o = (y * SPLAT_OUT + x) * 4;
        p[o] = rgb[i * 3];
        p[o + 1] = rgb[i * 3 + 1];
        p[o + 2] = rgb[i * 3 + 2];
        p[o + 3] = 255;
      }
    }
    ctx.putImageData(out, 0, 0);
    return { map: canvasColorTex(c), mask: maskFromSea(sea, SPLAT_SRC, MASK_SIZE) };
  }

  private maskFromConcept(img: HTMLImageElement): THREE.Texture {
    const src = drawToSize(img, SPLAT_SRC);
    const waterish = new Uint8Array(SPLAT_SRC * SPLAT_SRC);
    for (let i = 0; i < waterish.length; i++) {
      const o = i * 4;
      waterish[i] = looksLikeWater(src.data[o], src.data[o + 1], src.data[o + 2]) ? 1 : 0;
    }
    const sea = floodSea(waterish, SPLAT_SRC);
    keepLargestLand(sea, SPLAT_SRC);
    return maskFromSea(sea, SPLAT_SRC, MASK_SIZE);
  }

  private stampUniform(tile: HTMLImageElement): THREE.Texture {
    const n = 24;
    const s = 48;
    const c = document.createElement("canvas");
    c.width = n * s;
    c.height = n * s;
    const ctx = c.getContext("2d")!;
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) ctx.drawImage(tile, x * s, y * s, s, s);
    }
    return canvasColorTex(c);
  }

  private async refreshLandMaps(): Promise<void> {
    if (this.disposed) return;
    await this.preloadTiles();
    for (const id of LAND_IDS) {
      const mesh = this.land[id];
      if (!mesh) continue;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      const painted = await this.paintLand(id);
      painted.map.anisotropy = this.anisotropy;
      const oldMap = mat.map;
      const oldMask = mat.alphaMap;
      mat.map = painted.map;
      mat.alphaMap = painted.mask;
      oldMap?.dispose();
      oldMask?.dispose();
      mat.needsUpdate = true;
    }
  }

  private async preloadTiles(): Promise<void> {
    const files = [
      "floor_grass.png",
      "floor_grass_flower.png",
      "floor_dirt.png",
      "floor_cobble.png",
      "floor_wood_plank.png",
      "floor_water_deep.png",
    ];
    await Promise.all(files.map((f) => this.tileImage(f)));
    for (const f of files) this.ensureTilePix(f);
  }

  private fallbackMask(): THREE.Texture {
    const c = document.createElement("canvas");
    c.width = 8;
    c.height = 8;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, 8, 8);
    return canvasToMaskTex(c);
  }

  private async tileImage(file: string): Promise<HTMLImageElement> {
    const hit = this.tileCache.get(file);
    if (hit) return hit;
    const img = await loadImage(`/art/tiles/floor/${file}`);
    this.tileCache.set(file, img);
    return img;
  }

  private async conceptImage(areaId: string): Promise<HTMLImageElement | null> {
    const hit = this.conceptCache.get(areaId);
    if (hit) return hit;
    try {
      const img = await loadImage(`/ui/journey/sector_${areaId}_after.png`);
      this.conceptCache.set(areaId, img);
      return img;
    } catch {
      return null;
    }
  }

  private ensureTilePix(file: string): TilePix {
    const hit = this.tilePix.get(file);
    if (hit) return hit;
    const img = this.tileCache.get(file);
    if (!img) throw new Error(`tile not preloaded: ${file}`);
    const c = document.createElement("canvas");
    c.width = TILE_SAMPLE;
    c.height = TILE_SAMPLE;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(img, 0, 0, TILE_SAMPLE, TILE_SAMPLE);
    const pix = { data: ctx.getImageData(0, 0, TILE_SAMPLE, TILE_SAMPLE).data, size: TILE_SAMPLE };
    this.tilePix.set(file, pix);
    return pix;
  }

  private pixFor(file: string): TilePix {
    return this.ensureTilePix(file);
  }
}
