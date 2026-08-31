/**
 * 원흉·얼룩·벌레용 점구름.
 * 오염 = 어두운 마젠타·네이비. 정화 = 시안 주 + 마젠타·옐로 점.
 * 연출 4박자: 모으기 → 정화전 → 정화후 → 퍼지기
 * 도형: 원(얼룩) · 세모(오염 벌레) · 네모(원흉) · 반려동물(Tobby · Bolinha · Vrum)
 */
import * as THREE from "three";

export type CulpritForm = "cloud" | "bug" | "stain" | "matter" | "droplet" | "culprit" | "human" | "circle" | "triangle" | "square" | "pet";

export type CulpritShell = "cloud" | "circle" | "triangle" | "square" | "pet" | "bug" | "culprit" | "human" | "stain" | "matter" | "droplet";

type PetSample = { x: number; y: number; z: number; r: number; g: number; b: number };
export type SampleOpts = { feather?: boolean; flat?: boolean; paleBg?: boolean; volume?: boolean; voidBlack?: boolean; round?: boolean; orb?: boolean };
let petSamples: PetSample[] = [];
let petPixelStep = 0.02;
let petFeathered = false;
let petVolume = false;
const petCache = new Map<string, { samples: PetSample[]; pixelStep: number }>();
let stainDecalTex: THREE.CanvasTexture | null = null;
const STAIN_SPAN = 4.8;

export function petSampleCount(): number {
  return petSamples.length;
}

export function petFit(): { count: number; size: number } {
  const mul = petFeathered || petVolume ? 3.1 : 1.18;
  return {
    count: Math.max(80, petSamples.length),
    size: Math.max(petVolume ? 0.042 : 0.01, petPixelStep * mul),
  };
}

export async function loadPetImage(url: string, opts?: SampleOpts): Promise<number> {
  const key = `${url}|f=${opts?.feather ? 1 : 0}|flat=${opts?.flat ? 1 : 0}|pale=${opts?.paleBg ? 1 : 0}|vol=${opts?.volume ? 1 : 0}|blk=${opts?.voidBlack ? 1 : 0}|rd=${opts?.round ? 1 : 0}|orb=${opts?.orb ? 1 : 0}|v=21`;
  const hit = petCache.get(key);
  petFeathered = !!opts?.feather;
  petVolume = !!opts?.volume;
  if (hit) {
    petSamples = hit.samples;
    petPixelStep = hit.pixelStep;
    return petSamples.length;
  }
  const img = await loadImage(url);
  petSamples = opts?.round && opts?.flat ? sampleFloorStain(img) : samplePetImage(img, opts ?? {});
  petCache.set(key, { samples: petSamples, pixelStep: petPixelStep });
  return petSamples.length;
}

export type FieldPetId = "Tobby" | "Bolinha" | "Vrum";

const FIELD_PETS: { id: FieldPetId; image: string }[] = [
  { id: "Tobby", image: "/art/culprit/Tobby_keyvisual_v1.png" },
  { id: "Bolinha", image: "/art/culprit/Bolinha_keyvisual_v1.png" },
  { id: "Vrum", image: "/art/culprit/Vrum_keyvisual_v1.png" },
];

export function pickFieldPetId(): FieldPetId {
  return FIELD_PETS[Math.floor(Math.random() * FIELD_PETS.length)]!.id;
}

export function fieldPetImage(id: FieldPetId): string {
  return FIELD_PETS.find((p) => p.id === id)?.image ?? FIELD_PETS[0]!.image;
}

/** 필드 벌레 처치 후 펫 — 원흉 점구름 툴(showPet)과 동일 로딩 */
export async function loadFieldPet(id?: FieldPetId): Promise<{ id: FieldPetId; count: number; size: number }> {
  const pet = FIELD_PETS.find((p) => p.id === id) ?? FIELD_PETS[Math.floor(Math.random() * FIELD_PETS.length)]!;
  // 툴: loadPetImage(pet.image) — feather/volume 없음 → petFit()이 다이얼 값
  await loadPetImage(pet.image);
  const fit = petFit();
  return { id: pet.id, count: fit.count, size: fit.size };
}

export async function loadHumanCulprit(): Promise<number> {
  return loadPetImage("/art/culprit/Human_culprit_v1.jpg", {
    feather: true,
    paleBg: true,
    volume: true,
  });
}

export async function loadBugVolume(): Promise<number> {
  const key = "bug-solid|v=3";
  const hit = petCache.get(key);
  petFeathered = true;
  petVolume = true;
  if (hit) {
    petSamples = hit.samples;
    petPixelStep = hit.pixelStep;
    return petSamples.length;
  }
  const img = await loadImage("/art/culprit/Bug_blight_v1.png");
  petSamples = sampleBugSolid(img);
  petCache.set(key, { samples: petSamples, pixelStep: petPixelStep });
  return petSamples.length;
}

/** 오염물질 — Matter_blight 공. 실패 시 기존 얼룩 입체로 폴백 */
export async function loadPollutant(): Promise<number> {
  const key = "matter-globe|v=4";
  const hit = petCache.get(key);
  petFeathered = true;
  petVolume = true;
  if (hit) {
    petSamples = hit.samples;
    petPixelStep = hit.pixelStep;
    return petSamples.length;
  }
  try {
    const img = await loadImage("/art/culprit/Matter_blight_v1.png");
    petSamples = sampleMatterGlobe(img);
    if (petSamples.length < 200) throw new Error("matter sample empty");
  } catch {
    // 리소스 실패 시에도 공 형태로 보이게
    return loadPetImage("/art/culprit/Stain_blight_v1.jpg", {
      feather: true,
      volume: true,
      voidBlack: true,
    });
  }
  petCache.set(key, { samples: petSamples, pixelStep: petPixelStep });
  return petSamples.length;
}

/** 테두리에서 이어진 검정말은 배경. 가운데 어두운 바위·연기는 남긴다. */
function isVoidPixel(r: number, g: number, b: number, a: number): boolean {
  if (a < 10) return true;
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  if (r - g > 16 && r > 24) return false;
  if (b - g > 14 && b > 22) return false;
  if (g - mn > 22 && g > 32) return false;
  if (mx < 14) return true;
  return mx < 26 && mx - mn < 18;
}

function isBlackVoidPixel(r: number, g: number, b: number, a: number): boolean {
  if (a < 10) return true;
  return Math.max(r, g, b) < 10;
}

/** 밝은 시안 하늘은 배경. 어두운 파란 피부·주황 눈·TRUST ME 글자는 남긴다. */
function isPaleVoidPixel(r: number, g: number, b: number, a: number): boolean {
  if (a < 10) return true;
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const lum = (r + g + b) / 3;
  const sat = mx - mn;
  if (r > 165 && g > 70 && r > b + 8) return false;
  if (r > 190 && g > 115 && b < 165) return false;
  if (lum > 198 && r > 200 && g > 195 && sat < 80) return false;
  if (r < 85 && lum < 110 && b < 148) return false;
  if (b > 155 && g > 125 && lum > 100 && r < 200) return true;
  if (g > 145 && b > 170 && lum > 108) return true;
  return false;
}

function floodVoid(data: Uint8ClampedArray, w: number, h: number, mode: "dark" | "pale" | "black" = "dark"): Uint8Array {
  const voided = new Uint8Array(w * h);
  const stack: number[] = [];
  const tryPush = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = y * w + x;
    if (voided[i]) return;
    const o = i * 4;
    const r = data[o]!;
    const g = data[o + 1]!;
    const b = data[o + 2]!;
    const a = data[o + 3]!;
    const cut =
      mode === "pale"
        ? isPaleVoidPixel(r, g, b, a)
        : mode === "black"
          ? isBlackVoidPixel(r, g, b, a)
          : isVoidPixel(r, g, b, a);
    if (!cut) return;
    voided[i] = 1;
    stack.push(i);
  };
  for (let x = 0; x < w; x++) {
    tryPush(x, 0);
    tryPush(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    tryPush(0, y);
    tryPush(w - 1, y);
  }
  while (stack.length) {
    const i = stack.pop()!;
    const x = i % w;
    const y = (i / w) | 0;
    tryPush(x - 1, y);
    tryPush(x + 1, y);
    tryPush(x, y - 1);
    tryPush(x, y + 1);
  }
  return voided;
}

function chamfer(mask: Uint8Array, w: number, h: number): Float32Array {
  const inf = 1e6;
  const d = new Float32Array(w * h);
  for (let i = 0; i < d.length; i++) d[i] = mask[i] ? inf : 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!mask[i]) continue;
      if (x > 0) d[i] = Math.min(d[i]!, d[i - 1]! + 1);
      if (y > 0) d[i] = Math.min(d[i]!, d[i - w]! + 1);
      if (x > 0 && y > 0) d[i] = Math.min(d[i]!, d[i - w - 1]! + 1.414);
      if (x < w - 1 && y > 0) d[i] = Math.min(d[i]!, d[i - w + 1]! + 1.414);
    }
  }
  for (let y = h - 1; y >= 0; y--) {
    for (let x = w - 1; x >= 0; x--) {
      const i = y * w + x;
      if (!mask[i]) continue;
      if (x < w - 1) d[i] = Math.min(d[i]!, d[i + 1]! + 1);
      if (y < h - 1) d[i] = Math.min(d[i]!, d[i + w]! + 1);
      if (x < w - 1 && y < h - 1) d[i] = Math.min(d[i]!, d[i + w + 1]! + 1.414);
      if (x > 0 && y < h - 1) d[i] = Math.min(d[i]!, d[i + w - 1]! + 1.414);
    }
  }
  return d;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const el = new Image();
    el.crossOrigin = "anonymous";
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error(`pet image failed: ${url}`));
    el.src = url;
  });
}

/** 얼룩 = 바닥 면. 검은 배경은 알파 0, 잘린 원본 테두리는 패딩 안에서 빠진다. */
export async function loadStainDecal(url: string): Promise<void> {
  const img = await loadImage(url);
  const maxSide = 1024;
  const scale = maxSide / Math.max(img.width, img.height);
  const w = Math.max(8, Math.round(img.width * scale));
  const h = Math.max(8, Math.round(img.height * scale));
  const src = document.createElement("canvas");
  src.width = w;
  src.height = h;
  const sg = src.getContext("2d", { willReadFrequently: true })!;
  sg.drawImage(img, 0, 0, w, h);
  const srcPix = sg.getImageData(0, 0, w, h);
  const sdata = srcPix.data;
  const voided = floodVoid(sdata, w, h);
  const mask = new Uint8Array(w * h);
  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  for (let i = 0; i < w * h; i++) {
    mask[i] = voided[i] ? 0 : 1;
    if (!mask[i]) continue;
    const x = i % w;
    const y = (i / w) | 0;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  const dist = chamfer(mask, w, h);
  const inv = new Uint8Array(w * h);
  for (let i = 0; i < inv.length; i++) inv[i] = mask[i] ? 0 : 1;
  const toFg = chamfer(inv, w, h);
  const fadePx = Math.max(48, Math.round(Math.min(w, h) * 0.22));
  const hitL = minX <= 2;
  const hitR = maxX >= w - 3;
  const hitT = minY <= 2;
  const hitB = maxY >= h - 3;
  const pad = fadePx + 8;
  const cw = w + pad * 2;
  const ch = h + pad * 2;
  const c = document.createElement("canvas");
  c.width = cw;
  c.height = ch;
  const g = c.getContext("2d")!;
  const pix = g.createImageData(cw, ch);
  const data = pix.data;
  const smooth = (t: number) => {
    const u = Math.max(0, Math.min(1, t));
    return u * u * (3 - 2 * u);
  };
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const o = (y * cw + x) * 4;
      const px = x - pad;
      const py = y - pad;
      if (px < 0 || py < 0 || px >= w || py >= h) {
        const cx = Math.max(0, Math.min(w - 1, px));
        const cy = Math.max(0, Math.min(h - 1, py));
        const dOut = toFg[cy * w + cx]! + Math.hypot(px - cx, py - cy);
        if (dOut > fadePx) continue;
        const fade = (1 - dOut / fadePx) ** 3 * 0.35;
        data[o] = Math.round(90 * fade);
        data[o + 1] = Math.round(28 * fade);
        data[o + 2] = Math.round(110 * fade);
        data[o + 3] = Math.round(255 * fade);
        continue;
      }
      const i = py * w + px;
      const so = i * 4;
      if (mask[i]) {
        let fade = smooth(dist[i]! / fadePx);
        if (hitL) fade *= smooth(px / fadePx);
        if (hitR) fade *= smooth((w - 1 - px) / fadePx);
        if (hitT) fade *= smooth(py / fadePx);
        if (hitB) fade *= smooth((h - 1 - py) / fadePx);
        if (fade < 0.02) continue;
        fade *= fade;
        data[o] = Math.round(sdata[so]! * fade);
        data[o + 1] = Math.round(sdata[so + 1]! * fade);
        data[o + 2] = Math.round(sdata[so + 2]! * fade);
        data[o + 3] = Math.round(255 * fade);
        continue;
      }
      const dOut = toFg[i]!;
      if (dOut > fadePx || dOut <= 0) continue;
      const fade = (1 - dOut / fadePx) ** 3 * 0.4;
      if (fade < 0.03) continue;
      data[o] = Math.round(sdata[so]! * 0.35 + 90 * 0.65);
      data[o + 1] = Math.round(sdata[so + 1]! * 0.35 + 28 * 0.65);
      data[o + 2] = Math.round(sdata[so + 2]! * 0.35 + 110 * 0.65);
      data[o + 3] = Math.round(255 * fade);
    }
  }
  g.putImageData(pix, 0, 0);
  stainDecalTex?.dispose();
  stainDecalTex = new THREE.CanvasTexture(c);
  stainDecalTex.colorSpace = THREE.SRGBColorSpace;
  stainDecalTex.premultiplyAlpha = true;
  stainDecalTex.needsUpdate = true;
}

/** 얼룩 — 오염물질과 같은 그림, 바닥에 붙은 동그란 덩어리. */
export async function loadStainDroplet(): Promise<number> {
  return loadPetImage("/art/culprit/Stain_blight_v1.jpg", {
    feather: true,
    flat: true,
    voidBlack: true,
    round: true,
  });
}

export function loadWaterDroplet(): number {
  petFeathered = true;
  petSamples = sampleWaterDrop();
  return petSamples.length;
}

/** 오염물질 — 물방울과 같은 속 채운 공. 색은 지구 그림. */
function sampleMatterGlobe(img: HTMLImageElement): PetSample[] {
  const size = 280;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const g = c.getContext("2d", { willReadFrequently: true })!;
  const side = Math.min(img.width, img.height);
  const sx = (img.width - side) * 0.5;
  const sy = (img.height - side) * 0.5;
  g.drawImage(img, sx, sy, side, side, 0, 0, size, size);
  const data = g.getImageData(0, 0, size, size).data;
  const readCol = (u: number, v: number): [number, number, number] => {
    const px = Math.max(0, Math.min(size - 1, Math.floor(u * (size - 1))));
    const py = Math.max(0, Math.min(size - 1, Math.floor(v * (size - 1))));
    const o = (py * size + px) * 4;
    return [data[o]! / 255, data[o + 1]! / 255, data[o + 2]! / 255];
  };

  const R = 1.42;
  // 바닥에서 살짝 띄워 아래쪽이 땅에 묻혀 보이지 않게
  const y0 = 0.18;
  const out: PetSample[] = [];
  petPixelStep = 0.022;
  const ga = Math.PI * (3 - Math.sqrt(5));
  const colorAt = (nx: number, ny: number, nz: number): [number, number, number] => {
    const u = 0.5 + nx * 0.36;
    const v = 0.5 - ny * 0.36;
    const col = readCol(u, v);
    if (nz >= -0.08) return col;
    const t = fbm2(nx * 2.4 + 1.1, ny * 2.8);
    return [
      Math.min(1, col[0] * 0.45 + 0.42 + t * 0.28),
      Math.min(1, col[1] * 0.35 + 0.08 + t * 0.1),
      Math.min(1, col[2] * 0.45 + 0.38 + t * 0.22),
    ];
  };

  const nShell = 20000;
  for (let i = 0; i < nShell; i++) {
    const t = (i + 0.5) / nShell;
    const ny = 1 - 2 * t;
    const rad = Math.sqrt(Math.max(0, 1 - ny * ny));
    const th = ga * i;
    const nx = Math.cos(th) * rad;
    const nz = Math.sin(th) * rad;
    const u = 0.9 + hash(i, 4) * 0.12;
    const fade = u < 0.97 ? 1 : Math.max(0.2, 1 - (u - 0.97) / 0.12);
    if (hash(i, 19) > 0.08 + fade * 0.92) continue;
    const col = colorAt(nx, ny, nz);
    out.push({
      x: nx * R * u,
      y: ny * R * u + R + y0,
      z: nz * R * u,
      r: Math.min(1, col[0] * fade),
      g: Math.min(1, col[1] * fade),
      b: Math.min(1, col[2] * fade),
    });
  }

  const nIn = 9000;
  for (let i = 0; i < nIn; i++) {
    let nx = 0;
    let ny = 0;
    let nz = 0;
    for (let k = 0; k < 8; k++) {
      nx = hash(i, 21 + k) * 2 - 1;
      ny = hash(i, 31 + k) * 2 - 1;
      nz = hash(i, 41 + k) * 2 - 1;
      if (nx * nx + ny * ny + nz * nz <= 1) break;
    }
    const len = Math.hypot(nx, ny, nz) || 1;
    const u = (len > 1 ? 1 / len : 1) * (0.1 + hash(i, 8) * 0.78);
    nx *= u;
    ny *= u;
    nz *= u;
    if (hash(i, 9) > 0.72) continue;
    const col = colorAt(nx, ny, nz);
    const shade = 0.55 + u * 0.4;
    out.push({
      x: nx * R,
      y: ny * R + R + y0,
      z: nz * R,
      r: Math.min(1, col[0] * shade),
      g: Math.min(1, col[1] * shade),
      b: Math.min(1, col[2] * shade),
    });
  }
  return out;
}

/**
 * 오염 벌레 — 옆보기 실루엣을 슬라이스가 아니라 속 채운 입체로.
 * 각 픽셀의 두께는 가장자리까지 거리(원형 단면). Z는 촘촘히 채워 층이 안 보이게.
 */
function sampleBugSolid(img: HTMLImageElement): PetSample[] {
  const targetW = 380;
  const scale = targetW / Math.max(1, img.width);
  const w = Math.max(8, Math.round(img.width * scale));
  const h = Math.max(8, Math.round(img.height * scale));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d", { willReadFrequently: true })!;
  g.imageSmoothingEnabled = true;
  g.drawImage(img, 0, 0, w, h);
  const data = g.getImageData(0, 0, w, h).data;
  // 검정 배경만 제거 — 어두운 마디를 잘르면 슬라이드처럼 갈라짐
  const voided = floodVoid(data, w, h, "black");
  const mask = new Uint8Array(w * h);
  for (let i = 0; i < mask.length; i++) mask[i] = voided[i] ? 0 : 1;
  const filled = new Uint8Array(mask);
  for (let py = 1; py < h - 1; py++) {
    for (let px = 1; px < w - 1; px++) {
      const i = py * w + px;
      if (filled[i]) continue;
      let n = 0;
      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          if (ox === 0 && oy === 0) continue;
          if (mask[(py + oy) * w + (px + ox)]) n += 1;
        }
      }
      if (n >= 5) filled[i] = 1;
    }
  }
  for (let i = 0; i < mask.length; i++) mask[i] = filled[i]!;

  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      if (!mask[py * w + px]) continue;
      if (px < minX) minX = px;
      if (py < minY) minY = py;
      if (px > maxX) maxX = px;
      if (py > maxY) maxY = py;
    }
  }
  if (maxX < minX) {
    petPixelStep = 0.02;
    return [];
  }

  const dist = chamfer(mask, w, h);
  let maxD = 1;
  for (let py = minY; py <= maxY; py++) {
    for (let px = minX; px <= maxX; px++) {
      const i = py * w + px;
      if (mask[i] && dist[i]! > maxD) maxD = dist[i]!;
    }
  }

  const worldSpan = 2.72;
  const bw = maxX - minX + 1;
  const bh = maxY - minY + 1;
  const step = worldSpan / bh;
  petPixelStep = step;
  const yBase = 0.08;
  const cx = minX + bw * 0.5;
  const colT = new Int32Array(w);
  const colB = new Int32Array(w);
  colT.fill(h);
  colB.fill(-1);
  for (let py = minY; py <= maxY; py++) {
    for (let px = minX; px <= maxX; px++) {
      if (!mask[py * w + px]) continue;
      if (py < colT[px]!) colT[px] = py;
      if (py > colB[px]!) colB[px] = py;
    }
  }
  const out: PetSample[] = [];

  for (let py = minY; py <= maxY; py++) {
    for (let px = minX; px <= maxX; px++) {
      const i = py * w + px;
      if (!mask[i]) continue;
      const d = dist[i]!;
      if (d < 0.35) continue;
      const fade = d < 2.2 ? Math.min(1, 0.5 + d / 3.2) : 1;
      const o = i * 4;
      const cr = data[o]! / 255;
      const cg = data[o + 1]! / 255;
      const cb = data[o + 2]! / 255;
      const halfCol = Math.max(1, (colB[px]! - colT[px]! + 1) * 0.5);
      const dyCol = py - (colT[px]! + colB[px]!) * 0.5;
      const zSausage = Math.sqrt(Math.max(0, halfCol * halfCol - dyCol * dyCol)) * step;
      const zMax = Math.max(step * 0.55, d * step * 1.45, zSausage * 0.95);
      const x = (px - cx) * step;
      const y = yBase + (maxY - py) * step;
      const id = px + py * 97;
      const keep = d < 2.6 ? 0.88 : 0.52;
      if (hash(id, 17) > keep) continue;
      const jx = (hash(id, 5) - 0.5) * step * 0.32;
      const jy = (hash(id, 7) - 0.5) * step * 0.26;
      const push = (z: number, shade: number, salt: number) => {
        out.push({
          x: x + jx + (hash(id + salt, 5) - 0.5) * step * 0.18,
          y: y + jy + (hash(id + salt, 7) - 0.5) * step * 0.14,
          z,
          r: Math.min(1, cr * shade * fade),
          g: Math.min(1, cg * shade * fade),
          b: Math.min(1, cb * shade * fade),
        });
      };
      // 면 카드 없이, 두께 안에서만 점을 뿌려 한 덩어리로
      const nFill = Math.max(2, Math.round((zMax / step) * 1.35));
      for (let k = 0; k < nFill; k++) {
        if (hash(id + k * 17, 29) > 0.62) continue;
        const z = (hash(id + k * 9, 31) * 2 - 1) * zMax;
        const u = Math.abs(z) / Math.max(1e-4, zMax);
        const shade = (z >= 0 ? 1 : 0.52) * (0.62 + 0.38 * (1 - u * 0.4));
        push(z, shade, 40 + k);
      }
    }
  }
  return out;
}

export function loadCulpritGlobe(): number {
  petFeathered = true;
  petSamples = sampleMoltenCulprit();
  return petSamples.length;
}

function vnoise(x: number, y: number, salt: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash(ix + iy * 113, salt);
  const b = hash(ix + 1 + iy * 113, salt);
  const c = hash(ix + (iy + 1) * 113, salt);
  const d = hash(ix + 1 + (iy + 1) * 113, salt);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function fbm2(x: number, y: number): number {
  return (
    vnoise(x, y, 11) * 0.5 +
    vnoise(x * 2.13, y * 2.13, 12) * 0.28 +
    vnoise(x * 4.27, y * 4.27, 13) * 0.14 +
    vnoise(x * 8.1, y * 8.1, 14) * 0.08
  );
}

/** 바닥에 앉은 동그란 얼룩. 껍질+속+바깥 불꽃. 가장자리는 밀도로 빠진다. */
function samplePlanetStain(): PetSample[] {
  const R = 1.28;
  const y0 = 0.05;
  const out: PetSample[] = [];
  petPixelStep = 0.03;
  const ga = Math.PI * (3 - Math.sqrt(5));

  const tintAt = (nx: number, ny: number, nz: number): [number, number, number] => {
    const lon = Math.atan2(nz, nx);
    const n = fbm2(lon * 1.55 + 2.1, ny * 3.4);
    const n2 = fbm2(lon * 3.2, ny * 2.5 + 4.2);
    const swirl = fbm2(lon * 2.4 + ny, ny * 1.9);
    const land = n * 0.62 + n2 * 0.38 > 0.5;
    if (land) {
      return [0.98, 0.42 + n * 0.28, 0.07 + swirl * 0.08];
    }
    return [0.62 + swirl * 0.28, 0.07 + swirl * 0.1, 0.78 + swirl * 0.18];
  };

  const push = (x: number, y: number, z: number, fade: number, col: [number, number, number], i: number) => {
    if (fade < 0.05) return;
    if (hash(i, 19) > 0.08 + fade * 0.92) return;
    out.push({
      x,
      y: Math.max(0.04, y),
      z,
      r: Math.min(1, col[0] * fade),
      g: Math.min(1, col[1] * fade),
      b: Math.min(1, col[2] * fade),
    });
  };

  const nShell = 16000;
  for (let i = 0; i < nShell; i++) {
    const t = (i + 0.5) / nShell;
    const y = 1 - 2 * t;
    const rad = Math.sqrt(Math.max(0, 1 - y * y));
    const th = ga * i;
    const x = Math.cos(th) * rad;
    const z = Math.sin(th) * rad;
    const u = 0.72 + hash(i, 4) * 0.38;
    const fade =
      u < 0.9 ? 1 : Math.max(0, 1 - (u - 0.9) / 0.22);
    const col = tintAt(x, y, z);
    push(x * R * u, y * R * u + R + y0, z * R * u, fade, col, i);
  }

  const nIn = 6000;
  for (let i = 0; i < nIn; i++) {
    let x = 0;
    let y = 0;
    let z = 0;
    for (let k = 0; k < 6; k++) {
      x = hash(i, 21 + k) * 2 - 1;
      y = hash(i, 31 + k) * 2 - 1;
      z = hash(i, 41 + k) * 2 - 1;
      if (x * x + y * y + z * z <= 1) break;
    }
    const len = Math.hypot(x, y, z) || 1;
    const u = (len > 1 ? 1 / len : 1) * (0.15 + hash(i, 8) * 0.7);
    const nx = x * u;
    const ny = y * u;
    const nz = z * u;
    const col = tintAt(nx, ny, nz);
    const fade = 0.55 + hash(i, 9) * 0.35;
    push(nx * R, ny * R + R + y0, nz * R, fade, col, i + 90000);
  }

  const nHalo = 5000;
  for (let i = 0; i < nHalo; i++) {
    const t = (i + 0.5) / nHalo;
    const y = 1 - 2 * t;
    const rad = Math.sqrt(Math.max(0, 1 - y * y));
    const th = ga * i + 0.7;
    const x = Math.cos(th) * rad;
    const z = Math.sin(th) * rad;
    const u = 1.02 + hash(i, 6) * 0.42;
    const fade = (1 - (u - 1.02) / 0.42) ** 2 * 0.42;
    const fire = hash(i, 7) > 0.45;
    const col: [number, number, number] = fire
      ? [0.95, 0.32 + hash(i, 8) * 0.28, 0.06]
      : [0.7, 0.1, 0.82];
    push(x * R * u, y * R * u + R + y0, z * R * u, fade, col, i + 180000);
  }
  return out;
}

/** 바닥에 앉은 시안 물방울. 껍질이 진하고 속은 밝게. */
function teardropSD(px: number, py: number): number {
  const bulbY = -0.34;
  const bulbR = 0.5;
  const tipY = 0.98;
  const dBulb = Math.hypot(px, py - bulbY) - bulbR;
  if (py <= bulbY) return dBulb;
  const t = Math.max(0, Math.min(1, (py - bulbY) / (tipY - bulbY)));
  const halfW = bulbR * Math.pow(1 - t, 0.82);
  const dBody = Math.abs(px) - Math.max(0.014, halfW);
  return Math.min(dBulb, dBody);
}

function sampleWaterDrop(): PetSample[] {
  const H = 2.18;
  const yBase = 0.05;
  const res = 56;
  const out: PetSample[] = [];
  petPixelStep = H / 100;
  let i = 0;
  for (let iy = 0; iy < res; iy++) {
    for (let ix = 0; ix < res; ix++) {
      for (let iz = 0; iz < res; iz++) {
        const nx = (ix / (res - 1) - 0.5) * 2;
        const nz = (iz / (res - 1) - 0.5) * 2;
        const ny = (iy / (res - 1)) * 2 - 1;
        const rad = Math.hypot(nx, nz);
        if (rad > 1.12) {
          i += 1;
          continue;
        }
        const sd = teardropSD(rad, ny);
        const feather = 0.08;
        if (sd > feather) {
          i += 1;
          continue;
        }
        const inside = Math.max(0, -sd);
        if (inside > 0.22 && hash(i, 3) > 0.26) {
          i += 1;
          continue;
        }
        let fade = sd < 0 ? Math.min(1, 0.32 + inside / 0.11) : (1 - sd / feather) * 0.4;
        fade = Math.min(1, fade);
        if (fade < 0.08) {
          i += 1;
          continue;
        }
        if (hash(i, 5) > 0.1 + fade * 0.9) {
          i += 1;
          continue;
        }
        const x = nx * (H * 0.47);
        const y = yBase + (ny + 1) * 0.5 * H;
        const z = nz * (H * 0.47);
        const spec1 = Math.exp(-((nx + 0.2) ** 2 * 30 + (ny + 0.08) ** 2 * 42 + nz * nz * 30));
        const spec2 = Math.exp(-((nx - 0.16) ** 2 * 55 + (ny + 0.52) ** 2 * 62 + nz * nz * 55));
        const core = Math.min(1, inside / 0.38);
        const fresnel = Math.min(1, Math.max(0, 1 - inside / 0.15));
        // 더 파란 물방울 — 시안 기운 줄이고 순파랑 쪽
        let r = 0.06 + 0.28 * core + 0.05 * fresnel;
        let g = 0.38 + 0.42 * core + 0.08 * fresnel;
        let b = 0.92 + 0.2 * core + 0.06 * fresnel;
        r += spec1 * 0.55 + spec2 * 0.4;
        g += spec1 * 0.72 + spec2 * 0.58;
        b += spec1 * 1.05 + spec2 * 0.95;
        out.push({
          x,
          y,
          z,
          r: Math.min(1, r * fade),
          g: Math.min(1, g * fade),
          b: Math.min(1, b * fade),
        });
        i += 1;
      }
    }
  }
  return out;
}

/** 원흉 — 검은 껍질 + 주황 용암 금. 바닥에 앉은 공. */
function sampleMoltenCulprit(): PetSample[] {
  const R = 1.52;
  const y0 = 0.05;
  const out: PetSample[] = [];
  petPixelStep = 0.02;
  const ga = Math.PI * (3 - Math.sqrt(5));

  const landAt = (lon: number, ny: number): number => {
    const na = Math.exp(-((lon + 1.55) ** 2 * 1.35 + (ny - 0.22) ** 2 * 3.4));
    const sa = Math.exp(-((lon + 1.12) ** 2 * 2.15 + (ny + 0.48) ** 2 * 2.7));
    const noise = fbm2(lon * 1.8 + 1.2, ny * 3.5);
    return Math.max(na, sa * 0.95) * 0.72 + noise * 0.38;
  };

  const tintAt = (nx: number, ny: number, nz: number): [number, number, number] => {
    const lon = Math.atan2(nz, nx);
    const mix = landAt(lon, ny);
    const land = mix > 0.46;
    const coast = 1 - Math.min(1, Math.abs(mix - 0.46) / 0.055);
    const crack = fbm2(lon * 11.2, ny * 12.4);
    const vein = crack > 0.74 ? Math.min(1, (crack - 0.74) / 0.18) : 0;
    if (land) {
      const glow = Math.max(coast * 0.7, vein);
      return [
        0.035 + glow * 0.95,
        0.02 + glow * 0.32,
        0.012 + glow * 0.03,
      ];
    }
    const deep = 0.01 + mix * 0.015;
    const seam = Math.max(0, coast - 0.35) * 0.85;
    return [deep + seam * 0.9, deep * 0.55 + seam * 0.28, deep * 0.4];
  };

  const push = (x: number, y: number, z: number, fade: number, col: [number, number, number], i: number) => {
    if (fade < 0.05) return;
    if (hash(i, 19) > 0.06 + fade * 0.94) return;
    out.push({
      x,
      y: Math.max(0.04, y),
      z,
      r: Math.min(1, col[0] * fade),
      g: Math.min(1, col[1] * fade),
      b: Math.min(1, col[2] * fade),
    });
  };

  const nShell = 22000;
  for (let i = 0; i < nShell; i++) {
    const t = (i + 0.5) / nShell;
    const y = 1 - 2 * t;
    const rad = Math.sqrt(Math.max(0, 1 - y * y));
    const th = ga * i;
    const x = Math.cos(th) * rad;
    const z = Math.sin(th) * rad;
    const u = 0.92 + hash(i, 4) * 0.1;
    const fade = 1;
    const col = tintAt(x, y, z);
    const lon = Math.atan2(z, x);
    const lift = landAt(lon, y) > 0.46 ? 1.04 : 0.99;
    push(x * R * u * lift, y * R * u * lift + R + y0, z * R * u * lift, fade, col, i);
  }

  const nHalo = 2800;
  for (let i = 0; i < nHalo; i++) {
    const t = (i + 0.5) / nHalo;
    const y = 1 - 2 * t;
    const rad = Math.sqrt(Math.max(0, 1 - y * y));
    const th = ga * i + 1.1;
    const x = Math.cos(th) * rad;
    const z = Math.sin(th) * rad;
    const u = 1.04 + hash(i, 6) * 0.18;
    const fade = (1 - (u - 1.04) / 0.18) ** 2 * 0.32;
    const ember = hash(i, 7) > 0.55;
    const col: [number, number, number] = ember
      ? [0.95, 0.38 + hash(i, 8) * 0.22, 0.04]
      : [0.16, 0.07, 0.04];
    push(x * R * u, y * R * u + R + y0, z * R * u, fade, col, i + 180000);
  }

  // 노랑·밝은 노랑 알갱이 — 기존 용암색 위에 점점이
  const nYellow = 1600;
  for (let i = 0; i < nYellow; i++) {
    const t = (i + 0.5) / nYellow;
    const y = 1 - 2 * t;
    const rad = Math.sqrt(Math.max(0, 1 - y * y));
    const th = ga * i + 2.3;
    const x = Math.cos(th) * rad;
    const z = Math.sin(th) * rad;
    const u = 0.72 + hash(i, 21) * 0.42;
    const bright = hash(i, 22) > 0.42;
    const col: [number, number, number] = bright
      ? [1, 0.94, 0.28 + hash(i, 23) * 0.22]
      : [0.98, 0.72, 0.08 + hash(i, 24) * 0.12];
    const fade = 0.55 + hash(i, 25) * 0.45;
    push(x * R * u, y * R * u + R + y0, z * R * u, fade, col, i + 420000);
  }
  return out;
}

/** 얼룩 색만 그림에서 가져온다. 오염물질 입체 샘플러는 건드리지 않는다. */
function sampleFloorStain(img: HTMLImageElement): PetSample[] {
  const savedStep = petPixelStep;
  const plate = samplePetImage(img, { feather: true, voidBlack: true });
  petPixelStep = savedStep;
  const hot: PetSample[] = [];
  const rock: PetSample[] = [];
  for (let i = 0; i < plate.length; i++) {
    const s = plate[i]!;
    const chroma = Math.max(s.r, s.b) - s.g;
    if (s.r > 0.25 && chroma > 0.08) hot.push(s);
    else rock.push(s);
  }
  const fallback: PetSample = { x: 0, y: 0, z: 0, r: 0.62, g: 0.16, b: 0.5 };
  const pick = (list: PetSample[], i: number): PetSample =>
    list.length > 0 ? list[i % list.length]! : plate[i % Math.max(1, plate.length)] ?? fallback;
  const R = 2.12;
  const n = 24000;
  const ga = Math.PI * (3 - Math.sqrt(5));
  const out: PetSample[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    // 면적 균등 원반 — 예전엔 중심을 거의 버려서 링처럼만 보였음
    const u = Math.sqrt(t);
    const rad = u * R;
    const th = ga * i;
    const x = Math.cos(th) * rad;
    const z = Math.sin(th) * rad;
    const edge = 1 - u * u;
    // 중심도 남기고, 가장자리만 살짝 더 듬성
    if (hash(i, 19) > 0.62 + edge * 0.22) continue;
    const useHot = hash(i, 7) < 0.38 + (1 - u) * 0.22;
    const src = useHot ? pick(hot, i) : pick(rock, i + 97);
    const r = useHot
      ? Math.min(1, src.r * 1.22 + 0.05)
      : Math.min(1, src.r * 0.72 + 0.3);
    const g = useHot
      ? Math.min(1, src.g * 0.92)
      : Math.min(1, src.g * 0.55 + 0.08);
    const b = useHot
      ? Math.min(1, src.b * 1.14 + 0.03)
      : Math.min(1, src.b * 0.65 + 0.24);
    out.push({
      x: x + (hash(i, 5) - 0.5) * 0.04,
      y: 0.05 + edge * 0.12,
      z: z + (hash(i, 6) - 0.5) * 0.04,
      r,
      g,
      b,
    });
  }
  petPixelStep = 0.02;
  return out;
}

function samplePetImage(img: HTMLImageElement, opts: SampleOpts = {}): PetSample[] {
  const targetW = 420;
  const scale = targetW / Math.max(1, img.width);
  const w = Math.max(8, Math.round(img.width * scale));
  const h = Math.max(8, Math.round(img.height * scale));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d", { willReadFrequently: true })!;
  g.imageSmoothingEnabled = true;
  g.drawImage(img, 0, 0, w, h);
  const data = g.getImageData(0, 0, w, h).data;
  const mask = new Uint8Array(w * h);
  if (opts.orb) {
    const ocx = w * 0.5;
    const ocy = h * 0.5;
    const orad = Math.min(w, h) * 0.4;
    const orad2 = orad * orad;
    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        const i = py * w + px;
        const dx = px - ocx;
        const dy = py - ocy;
        if (dx * dx + dy * dy > orad2) continue;
        const o = i * 4;
        const mx = Math.max(data[o]!, data[o + 1]!, data[o + 2]!);
        if (data[o + 3]! > 8 && mx > 10) mask[i] = 1;
      }
    }
  } else if (opts.feather) {
    const voided = floodVoid(
      data,
      w,
      h,
      opts.voidBlack ? "black" : opts.paleBg ? "pale" : "dark",
    );
    for (let i = 0; i < w * h; i++) mask[i] = voided[i] ? 0 : 1;
  } else {
    for (let i = 0; i < w * h; i++) {
      const o = i * 4;
      const mx = Math.max(data[o]!, data[o + 1]!, data[o + 2]!);
      mask[i] = data[o + 3]! > 8 && mx > 6 ? 1 : 0;
    }
  }
  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      if (!mask[py * w + px]) continue;
      if (px < minX) minX = px;
      if (py < minY) minY = py;
      if (px > maxX) maxX = px;
      if (py > maxY) maxY = py;
    }
  }
  if (maxX < minX) {
    petPixelStep = 0.02;
    return [];
  }
  const minDim = Math.min(maxX - minX + 1, maxY - minY + 1);
  const fadePx = opts.feather
    ? Math.max(
        opts.flat ? 12 : opts.paleBg || opts.voidBlack ? 8 : 28,
        Math.round(minDim * (opts.flat ? 0.1 : opts.paleBg || opts.voidBlack ? 0.07 : 0.26)),
      )
    : 0;
  const halo = opts.feather && !opts.volume
    ? Math.round(fadePx * (opts.flat ? 1.55 : 1.05))
    : 0;
  const pad = 2 + halo;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(w - 1, maxX + pad);
  maxY = Math.min(h - 1, maxY + pad);
  const bw = maxX - minX + 1;
  const bh = maxY - minY + 1;
  const dist = chamfer(mask, w, h);
  const inv = new Uint8Array(w * h);
  for (let i = 0; i < inv.length; i++) inv[i] = mask[i] ? 0 : 1;
  const toFg = opts.feather ? chamfer(inv, w, h) : dist;
  let maxD = 1;
  for (let py = minY; py <= maxY; py++) {
    for (let px = minX; px <= maxX; px++) {
      const i = py * w + px;
      if (mask[i] && dist[i]! > maxD) maxD = dist[i]!;
    }
  }
  const worldSpan = opts.flat ? 4.5 : 2.72;
  const step = worldSpan / (opts.flat ? Math.max(bw, bh) : bh);
  petPixelStep = step;
  const yBase = 0.08;
  const cx = minX + bw * 0.5;
  const cz = minY + bh * 0.5;
  const out: PetSample[] = [];
  const rowL = new Int32Array(h);
  const rowR = new Int32Array(h);
  if (opts.volume && !opts.flat) {
    rowL.fill(w);
    rowR.fill(-1);
    for (let py = minY; py <= maxY; py++) {
      for (let px = minX; px <= maxX; px++) {
        if (!mask[py * w + px]) continue;
        if (px < rowL[py]!) rowL[py] = px;
        if (px > rowR[py]!) rowR[py] = px;
      }
    }
  }

  const push = (x: number, y: number, z: number, r: number, gg: number, b: number, layers: boolean) => {
    out.push({ x, y, z, r, g: gg, b });
    if (!layers || opts.flat) return;
    out.push({ x, y, z: -z, r, g: gg, b });
    if (z > 0.1) {
      out.push({ x, y, z: 0, r, g: gg, b });
      if (z > 0.22) {
        out.push({ x, y, z: z * 0.5, r, g: gg, b });
        out.push({ x, y, z: -z * 0.5, r, g: gg, b });
      }
    }
  };

  for (let py = minY; py <= maxY; py++) {
    for (let px = minX; px <= maxX; px++) {
      const i = py * w + px;
      const x = (px - cx) * step;
      const y = opts.flat ? 0.06 : yBase + (maxY - py) * step;
      const zFloor = opts.flat ? (py - cz) * step : 0;
      if (mask[i]) {
        let fade = 1;
        if (opts.feather && fadePx > 0) {
          const sil = Math.min(1, dist[i]! / fadePx);
          const silT = sil * sil * (3 - 2 * sil);
          if (opts.flat) {
            fade = silT;
          } else {
            const frame = Math.min(px, py, w - 1 - px, h - 1 - py);
            const frameT = Math.min(1, frame / Math.max(18, fadePx * 0.55));
            fade = silT * (frameT * frameT * (3 - 2 * frameT));
          }
          if (fade < 0.07) continue;
          if (hash(px + py * 97, 17) > 0.08 + fade * 0.92) continue;
        }
        const o = i * 4;
        const lift = opts.flat ? 1.22 : 1;
        const r = Math.min(1, (data[o]! / 255) * fade * lift);
        const gg = Math.min(1, (data[o + 1]! / 255) * fade * lift);
        const b = Math.min(1, (data[o + 2]! / 255) * fade * lift);
        const thick = opts.flat
          ? zFloor
          : Math.min(0.42, (dist[i]! / maxD) * 0.46);
        if (opts.volume && !opts.flat) {
          if (hash(px + py * 97, 17) > 0.78) continue;
          const left = rowL[py]!;
          const right = rowR[py]!;
          const halfPx = Math.max(1, (right - left + 1) * 0.5);
          const mid = (left + right) * 0.5;
          const dxPx = px - mid;
          const radPx = Math.sqrt(Math.max(0, halfPx * halfPx - dxPx * dxPx));
          let zMax = radPx * step * 1.05;
          zMax = Math.min(Math.max(zMax, 0.12), worldSpan * 0.4);
          const jx = (hash(px, 5) - 0.5) * step * 0.25;
          out.push({ x: x + jx, y, z: zMax * 0.9, r, g: gg, b });
          const layers: [number, number][] = [
            [0.55, 0.82],
            [0.15, 0.68],
            [-0.35, 0.52],
            [-0.78, 0.4],
          ];
          for (let k = 0; k < layers.length; k++) {
            const [u, shade] = layers[k]!;
            if (hash(px * 3 + py * 11 + k * 19, 23) > 0.58) continue;
            out.push({
              x: x + (hash(px + k, 7) - 0.5) * step * 0.35,
              y,
              z: u * zMax,
              r: Math.min(1, r * shade),
              g: Math.min(1, gg * shade),
              b: Math.min(1, b * shade),
            });
          }
          continue;
        }
        push(x, y, thick, r, gg, b, fade > 0.62);
        continue;
      }
      if (!opts.feather || halo <= 0) continue;
      const dOut = toFg[i]!;
      if (dOut > halo || dOut <= 0) continue;
      const t = 1 - dOut / halo;
      const fade = t * t * t;
      if (fade < 0.04) continue;
      if (hash(px * 3 + py * 11, 23) > fade * 0.38) continue;
      const tint = opts.paleBg ? [0.12, 0.42, 0.84] : opts.flat ? [0.52, 0.16, 0.58] : [0.26, 0.18, 0.12];
      const o = i * 4;
      const r = (data[o]! / 255 * 0.4 + tint[0]! * 0.6) * fade * 0.55;
      const gg = (data[o + 1]! / 255 * 0.4 + tint[1]! * 0.6) * fade * 0.5;
      const b = (data[o + 2]! / 255 * 0.4 + tint[2]! * 0.6) * fade * 0.55;
      push(x, y, opts.flat ? zFloor : 0.05, r, gg, b, false);
    }
  }
  return out;
}

const BLIGHT: { hex: number; w: number }[] = [
  { hex: 0x2a0e28, w: 18 },
  { hex: 0x4a1848, w: 22 },
  { hex: 0xa7439d, w: 28 },
  { hex: 0x6b2a62, w: 16 },
  { hex: 0x19314a, w: 12 },
  { hex: 0x5a4a12, w: 4 },
];

/** 원흉 공포 — 검은 점 비중 큼 */
const BLIGHT_DREAD: { hex: number; w: number }[] = [
  { hex: 0x030303, w: 48 },
  { hex: 0x0a0a0c, w: 30 },
  { hex: 0x140810, w: 18 },
  { hex: 0x1e0c1c, w: 12 },
  { hex: 0x3a1438, w: 8 },
  { hex: 0x5a2460, w: 5 },
  { hex: 0x8a3a90, w: 3 },
];

const PURE: { hex: number; w: number }[] = [
  { hex: 0x0fbec7, w: 36 },
  { hex: 0x0ed3d9, w: 20 },
  { hex: 0x9ff0ff, w: 10 },
  { hex: 0x106f83, w: 8 },
  { hex: 0xd158bc, w: 14 },
  { hex: 0xd1c51d, w: 10 },
  { hex: 0xe0d43b, w: 2 },
];

const LOBES: { x: number; y: number; z: number; r: number }[] = [
  { x: 0, y: 1.12, z: 0, r: 1.52 },
  { x: -1.38, y: 1.42, z: 0.18, r: 1.12 },
  { x: 1.28, y: 1.38, z: -0.22, r: 1.08 },
  { x: 0.12, y: 2.18, z: 0.06, r: 1.02 },
  { x: -0.58, y: 1.82, z: -0.88, r: 0.86 },
  { x: 0.72, y: 1.72, z: 0.92, r: 0.82 },
  { x: 0.02, y: 0.52, z: 0.08, r: 1.38 },
];

function hash(i: number, salt: number): number {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function hexRgb(hex: number): [number, number, number] {
  return [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255];
}

function pickWeighted(list: { hex: number; w: number }[], i: number, salt: number): number {
  const sum = list.reduce((a, r) => a + r.w, 0);
  let t = hash(i, salt) * sum;
  for (const row of list) {
    t -= row.w;
    if (t <= 0) return row.hex;
  }
  return list[0]!.hex;
}

export function shellOf(form: CulpritForm): CulpritShell {
  if (form === "stain") return "stain";
  if (form === "matter") return "matter";
  if (form === "droplet") return "droplet";
  if (form === "circle") return "circle";
  if (form === "triangle") return "triangle";
  if (form === "bug") return "bug";
  if (form === "human") return "human";
  if (form === "culprit") return "culprit";
  if (form === "square") return "square";
  if (form === "pet") return "pet";
  return "cloud";
}

function isImageShell(shell: CulpritShell): boolean {
  return shell === "pet" || shell === "bug" || shell === "human" || shell === "culprit" || shell === "stain" || shell === "matter" || shell === "droplet";
}

function sampleShell(shell: CulpritShell, i: number): { x: number; y: number; z: number } {
  if (shell === "circle") {
    const ang = hash(i, 2) * Math.PI * 2;
    const r = Math.sqrt(hash(i, 1)) * 1.28;
    return {
      x: Math.cos(ang) * r,
      y: 0.1 + hash(i, 3) * 0.32,
      z: Math.sin(ang) * r,
    };
  }
  if (shell === "triangle") {
    let u = hash(i, 1);
    let v = hash(i, 2);
    if (u + v > 1) {
      u = 1 - u;
      v = 1 - v;
    }
    const w = 1 - u - v;
    return {
      x: u * -1.2 + v * 1.2,
      y: 0.08 + hash(i, 3) * 0.22,
      z: w * 1.65 + u * -0.72 + v * -0.72,
    };
  }
  if (shell === "square") {
    const face = Math.floor(hash(i, 9) * 6);
    const a = hash(i, 1) * 2 - 1;
    const b = hash(i, 2) * 2 - 1;
    const d = 1.08;
    if (face === 0) return { x: d, y: 0.2 + (a * 0.5 + 0.5) * 1.7, z: b * d };
    if (face === 1) return { x: -d, y: 0.2 + (a * 0.5 + 0.5) * 1.7, z: b * d };
    if (face === 2) return { x: a * d, y: 1.9, z: b * d };
    if (face === 3) return { x: a * d, y: 0.18, z: b * d };
    if (face === 4) return { x: a * d, y: 0.2 + (b * 0.5 + 0.5) * 1.7, z: d };
    return { x: a * d, y: 0.2 + (b * 0.5 + 0.5) * 1.7, z: -d };
  }
  const lobes = LOBES;
  const weights = lobes.map((l) => l.r * l.r * l.r);
  const wSum = weights.reduce((s, n) => s + n, 0);
  if (hash(i, 9) < 0.16) {
    const bands = 13;
    const lat = ((Math.floor(hash(i, 2) * bands) + 0.5) / bands) * Math.PI;
    const lon = hash(i, 3) * Math.PI * 2;
    const rr = 2.05 + hash(i, 4) * 0.18;
    return {
      x: rr * Math.sin(lat) * Math.cos(lon),
      y: 1.15 + rr * 0.55 * Math.cos(lat),
      z: rr * Math.sin(lat) * Math.sin(lon),
    };
  }
  let pick = hash(i, 1) * wSum;
  let lobe = lobes[0]!;
  for (let li = 0; li < lobes.length; li++) {
    pick -= weights[li]!;
    if (pick <= 0) {
      lobe = lobes[li]!;
      break;
    }
  }
  let ux = 0;
  let uy = 0;
  let uz = 0;
  for (let t = 0; t < 8; t++) {
    ux = hash(i, 11 + t) * 2 - 1;
    uy = hash(i, 21 + t) * 2 - 1;
    uz = hash(i, 31 + t) * 2 - 1;
    if (ux * ux + uy * uy + uz * uz <= 1) break;
  }
  const fall = 0.55 + hash(i, 5) * 0.45;
  return {
    x: lobe.x + ux * lobe.r * fall,
    y: lobe.y + uy * lobe.r * fall * 0.72,
    z: lobe.z + uz * lobe.r * fall,
  };
}

let sharedDot: THREE.CanvasTexture | null = null;
let sharedPetDot: THREE.CanvasTexture | null = null;
let sharedFeatherDot: THREE.CanvasTexture | null = null;

function makeDotMap(): THREE.CanvasTexture {
  if (sharedDot) return sharedDot;
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 30);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.32, "rgba(255,255,255,0.88)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  sharedDot = new THREE.CanvasTexture(c);
  sharedDot.needsUpdate = true;
  return sharedDot;
}

function makeFeatherDotMap(): THREE.CanvasTexture {
  if (sharedFeatherDot) return sharedFeatherDot;
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 30);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.42, "rgba(255,255,255,0.9)");
  grd.addColorStop(0.78, "rgba(255,255,255,0.22)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  sharedFeatherDot = new THREE.CanvasTexture(c);
  sharedFeatherDot.needsUpdate = true;
  return sharedFeatherDot;
}

function makePetDotMap(): THREE.CanvasTexture {
  if (sharedPetDot) return sharedPetDot;
  const c = document.createElement("canvas");
  c.width = 32;
  c.height = 32;
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, 32, 32);
  g.fillStyle = "#ffffff";
  g.beginPath();
  g.arc(16, 16, 14.2, 0, Math.PI * 2);
  g.fill();
  sharedPetDot = new THREE.CanvasTexture(c);
  sharedPetDot.needsUpdate = true;
  return sharedPetDot;
}

export type CulpritCloudOpts = {
  count?: number;
  size?: number;
  form?: CulpritForm;
  /** blight=일반 오염 · dread=원흉(검은 점 다수) */
  palette?: "blight" | "dread";
};

export class CulpritCloud {
  readonly group = new THREE.Group();
  form: CulpritForm;
  private points: THREE.Points;
  private stainMesh: THREE.Mesh;
  private geo: THREE.BufferGeometry;
  private mat: THREE.PointsMaterial;
  private rest: Float32Array;
  private scatter: Float32Array;
  private blight: Float32Array;
  private pure: Float32Array;
  private colors: Float32Array;
  private count: number;
  private palette: "blight" | "dread";
  private time = 0;
  private spreadDelay = 0;
  private hitPulse = 0;
  private stainAspect = 1;
  private source: PetSample[] = [];
  private sourceStep = 0.02;
  gather = 1;
  purify = 0;
  rise = 1;
  gatherTo = 1;
  purifyTo = 0;
  riseTo = 1;

  constructor(opts: CulpritCloudOpts = {}) {
    this.form = opts.form ?? "cloud";
    this.palette = opts.palette ?? "blight";
    this.captureSource();
    this.count = Math.max(80, Math.floor(opts.count ?? defaultCount(this.form)));
    this.geo = new THREE.BufferGeometry();
    this.rest = new Float32Array(this.count * 3);
    this.scatter = new Float32Array(this.count * 3);
    this.blight = new Float32Array(this.count * 3);
    this.pure = new Float32Array(this.count * 3);
    this.colors = new Float32Array(this.count * 3);
    this.fillCloud();
    this.geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(this.count * 3), 3));
    this.geo.setAttribute("color", new THREE.BufferAttribute(this.colors, 3));
    this.mat = new THREE.PointsMaterial({
      size: opts.size ?? defaultSize(this.form),
      map: makeDotMap(),
      vertexColors: true,
      transparent: true,
      opacity: 0.96,
      depthWrite: false,
      blending: THREE.NormalBlending,
      sizeAttenuation: true,
    });
    this.points = new THREE.Points(this.geo, this.mat);
    this.points.frustumCulled = false;
    this.group.add(this.points);
    this.stainMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(STAIN_SPAN, STAIN_SPAN),
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 1,
        premultipliedAlpha: true,
        depthWrite: false,
        depthTest: false,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -4,
        polygonOffsetUnits: -4,
        fog: true,
      }),
    );
    this.stainMesh.rotation.x = -Math.PI * 0.5;
    this.stainMesh.position.y = 0.04;
    this.stainMesh.visible = false;
    this.stainMesh.frustumCulled = false;
    this.stainMesh.renderOrder = 2;
    this.group.add(this.stainMesh);
    this.syncLook();
    this.writeFrame(0);
  }

  private captureSource(): void {
    this.source = petSamples.slice();
    this.sourceStep = petPixelStep;
  }

  private syncLook(): void {
    const shell = shellOf(this.form);
    const img = isImageShell(shell);
    const isStain = shell === "stain";
    const isDrop = shell === "droplet";
    const isHuman = shell === "human";
    const isMatter = shell === "matter";
    const isBug = shell === "bug" || shell === "pet";
    const isCulprit = shell === "culprit" || shell === "square";
    const soft = shell === "culprit" || isStain || isDrop || isHuman || isMatter || isBug;
    this.points.visible = true;
    this.stainMesh.visible = false;
    // 바닥(land/paint renderOrder 0~4)보다 앞 — 오염물질이 묻혀 보이던 문제
    this.points.renderOrder = isMatter ? 22 : isStain ? 12 : isDrop ? 24 : isBug || isCulprit ? 20 : soft ? 16 : 0;
    this.mat.map = img && !soft ? makePetDotMap() : soft ? makeFeatherDotMap() : makeDotMap();
    this.mat.alphaTest = img && !soft ? 0.45 : 0;
    this.mat.depthWrite = false;
    // 얼룩은 depth로 캐릭에 가려지게 · 오염물질·물방울·벌레·원흉은 포그에 안 묻히게
    this.mat.depthTest = isMatter || isDrop || isBug || isCulprit ? false : true;
    this.mat.fog = !(isStain || isDrop || isMatter || isBug || isCulprit);
    this.mat.opacity = isBug || isCulprit ? 1 : soft ? 0.96 : img ? 1 : 0.96;
    this.mat.needsUpdate = true;
    if (img) {
      const mul = isStain ? 7.2 : isDrop ? 1.9 : isMatter ? 2.0 : isHuman ? 2.6 : isBug ? 2.85 : shell === "culprit" ? 1.15 : soft ? 1.72 : 1.18;
      this.mat.size = Math.max(0.04, this.sourceStep * mul);
    }
  }

  setSize(px: number): void {
    const floor = isImageShell(shellOf(this.form)) ? 0.01 : 0.03;
    this.mat.size = Math.max(floor, px);
  }

  setWorld(x: number, z: number): void {
    // 오염물질 공 — 바닥·페인트보다 확실히 위
    // 벌레 — 발(로컬 y≈0)이 바닥에 닿게. 공중 부양 없음
    const shell = shellOf(this.form);
    const y =
      shell === "matter"
        ? Math.max(0.55, 0.28 * this.group.scale.y)
        : shell === "stain"
          ? 0.06
          : shell === "bug"
            ? -0.02 * Math.max(1, this.group.scale.y)
            : shell === "pet"
              ? -Math.max(0.12, this.group.scale.y * 0.18)
              : 0;
    this.group.position.set(x, y, z);
  }

  setForm(form: CulpritForm): void {
    this.form = form;
    this.captureSource();
    this.syncLook();
    this.rebuild(this.count);
  }

  rebuild(count: number): void {
    this.count = Math.max(80, Math.floor(count));
    this.geo.dispose();
    this.geo = new THREE.BufferGeometry();
    this.rest = new Float32Array(this.count * 3);
    this.scatter = new Float32Array(this.count * 3);
    this.blight = new Float32Array(this.count * 3);
    this.pure = new Float32Array(this.count * 3);
    this.colors = new Float32Array(this.count * 3);
    this.fillCloud();
    this.geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(this.count * 3), 3));
    this.geo.setAttribute("color", new THREE.BufferAttribute(this.colors, 3));
    this.points.geometry = this.geo;
    this.syncLook();
    this.writeFrame(0);
  }

  /** 리젠 — 땅에서 올라오며 모인다 */
  spawn(): void {
    this.playRise();
    this.playBeforePurify();
    this.writeFrame(this.time);
  }

  /** 피격 — 번쩍 + 알갱이 살짝 풀림 */
  hit(): void {
    this.pulseHit();
  }

  /** 죽음 — 모이지 않고 바로 퍼지며 사라짐 */
  die(): void {
    this.playSpread();
  }

  /** 땅에서 올라오며 모인다 */
  playRise(): void {
    this.rise = 0;
    this.gather = 0.12;
    this.riseTo = 1;
    this.gatherTo = 1;
    this.spreadDelay = 0;
  }

  /** 1. 모으기 — 흩어진 점이 도형으로 */
  playGather(): void {
    this.gather = 0.08;
    this.gatherTo = 1;
    this.purifyTo = 0;
    this.spreadDelay = 0;
  }

  /** 2. 정화전 — 도형이 오염색으로 붙어 있음 */
  playBeforePurify(): void {
    this.gatherTo = 1;
    this.purifyTo = 0;
    this.spreadDelay = 0;
  }

  /** 3. 정화후 — 같은 도형이 시안으로 */
  playAfterPurify(): void {
    this.gatherTo = 1;
    this.purifyTo = 1;
    this.spreadDelay = 0;
  }

  /** 4. 퍼지기 · 죽음 — 점이 흩어지며 사라짐. 모으기 없음 */
  playSpread(): void {
    this.purifyTo = this.purify;
    this.gatherTo = 0;
    this.spreadDelay = 0;
    this.hitPulse = Math.max(this.hitPulse, 0.28);
  }

  /** 얼룩 정화 — 형태가 풀리며 바깥으로 확산 */
  playDiffuse(): void {
    this.playSpread();
  }

  /** 피격 클리어 — 모이지 않고 바로 퍼져 사라짐 */
  hitClear(): void {
    this.playSpread();
  }

  /** 맞았을 때 짧은 펄스 (아직 안 죽을 때) — 번쩍 + 점이 살짝 흩어짐 */
  pulseHit(): void {
    this.hitPulse = Math.max(this.hitPulse, 1);
    this.gather = Math.min(this.gather, 0.88);
    this.gatherTo = 1;
    this.writeFrame(this.time);
  }

  /** 맞으면 정화후 → 잠시 뒤 퍼지기 (벌레·원흉용) */
  hitPurify(): void {
    this.purifyTo = 1;
    this.gatherTo = 1;
    this.spreadDelay = 0.18;
    // 한 박자 모인 뒤 확 풀어짐 (해제감)
    window.setTimeout(() => {
      this.gatherTo = 0;
    }, 220);
  }

  tick(dt: number): void {
    this.time += dt;
    if (this.spreadDelay > 0) {
      this.spreadDelay -= dt;
      if (this.spreadDelay <= 0) this.gatherTo = 0;
    }
    const shell = shellOf(this.form);
    const spreading = this.gatherTo < this.gather - 0.02;
    const k =
      shell === "stain" && spreading
        ? 1 - Math.exp(-dt * 1.05)
        : 1 - Math.exp(-dt * 2.4);
    this.gather += (this.gatherTo - this.gather) * k;
    this.purify += (this.purifyTo - this.purify) * k;
    this.rise += (this.riseTo - this.rise) * (1 - Math.exp(-dt * (shell === "stain" ? 1.15 : 1.6)));
    if (this.hitPulse > 0) {
      this.hitPulse = Math.max(0, this.hitPulse - dt * 3.6);
    }
    this.writeFrame(this.time);
    this.syncStainMesh(this.time);
    const idle = shell === "stain" ? 1 + Math.sin(this.time * 1.85) * 0.07 : 1;
    const pop = 1 + this.hitPulse * 0.1;
    // 죽음은 형태를 모으거나 축소하지 않고, 점이 바깥으로 퍼지며 투명해짐
    this.points.scale.setScalar(idle * pop);
    this.mat.opacity = Math.max(0, Math.min(1, this.gather * 0.96));
  }

  /** 바닥 얼룩 면 — idle 커졌다 작아졌다 + gather로 퍼져 사라짐 */
  private syncStainMesh(t: number): void {
    if (!this.stainMesh.visible) return;
    const idle = 1 + Math.sin(t * 1.85) * 0.07;
    const hit = 1 + this.hitPulse * 0.22;
    const g = Math.max(0, this.gather);
    const sx = g * idle * hit;
    this.stainMesh.scale.set(sx, this.stainAspect * sx, 1);
    const sm = this.stainMesh.material as THREE.MeshBasicMaterial;
    sm.opacity = Math.max(0, Math.min(1, g * (0.92 + this.hitPulse * 0.08)));
  }

  /**
   * 물방울·점구름 색을 탄종 톤으로 덮는다.
   * mul ≈ 목표 RGB(0~1+). 밝기는 유지하고 색만 옮긴다.
   */
  tintMul(mul: [number, number, number]): void {
    const remap = (arr: Float32Array) => {
      for (let i = 0; i < this.count; i++) {
        const o = i * 3;
        const lum = arr[o]! * 0.3 + arr[o + 1]! * 0.5 + arr[o + 2]! * 0.2;
        arr[o] = Math.min(1, Math.max(0, lum * mul[0] * 1.55));
        arr[o + 1] = Math.min(1, Math.max(0, lum * mul[1] * 1.55));
        arr[o + 2] = Math.min(1, Math.max(0, lum * mul[2] * 1.55));
      }
    };
    remap(this.pure);
    remap(this.blight);
    this.writeFrame(this.time);
  }

  dispose(): void {
    this.geo.dispose();
    this.mat.dispose();
    this.stainMesh.geometry.dispose();
    (this.stainMesh.material as THREE.Material).dispose();
    this.group.removeFromParent();
  }

  private fillCloud(): void {
    const shell = shellOf(this.form);
    if (shell === "pet" || shell === "bug" || shell === "human" || shell === "culprit" || shell === "stain" || shell === "matter" || shell === "droplet") {
      this.fillPet();
      return;
    }
    const scatterR = shell === "cloud" ? 8 : shell === "square" ? 5.2 : shell === "triangle" ? 2.6 : 2.0;
    for (let i = 0; i < this.count; i++) {
      const p = sampleShell(shell, i);
      const o = i * 3;
      this.rest[o] = p.x;
      this.rest[o + 1] = p.y;
      this.rest[o + 2] = p.z;
      const ang = hash(i, 6) * Math.PI * 2;
      const elev = (hash(i, 7) - 0.5) * Math.PI;
      const dist = scatterR * (0.7 + hash(i, 8) * 0.9);
      this.scatter[o] = Math.cos(ang) * Math.cos(elev) * dist;
      this.scatter[o + 1] = p.y + Math.sin(elev) * dist * 0.4;
      this.scatter[o + 2] = Math.sin(ang) * Math.cos(elev) * dist;
      const b = hexRgb(pickWeighted(this.palette === "dread" ? BLIGHT_DREAD : BLIGHT, i, 40));
      const pu = hexRgb(pickWeighted(PURE, i, 41));
      this.blight[o] = b[0];
      this.blight[o + 1] = b[1];
      this.blight[o + 2] = b[2];
      this.pure[o] = pu[0];
      this.pure[o + 1] = pu[1];
      this.pure[o + 2] = pu[2];
    }
  }

  private fillPet(): void {
    const src = this.source.length > 0 ? this.source : petSamples;
    const n = src.length;
    const scatterR = 4.8;
    for (let i = 0; i < this.count; i++) {
      // 등간격 슬라이스면 세로 줄무늬(슬라이드)로 갈라짐 → 해시로 고르게 뽑음
      const s = n > 0
        ? src[Math.floor(hash(i, 11) * n) % n]!
        : { x: 0, y: 1, z: 0, r: 0.85, g: 0.4, b: 0.7 };
      const o = i * 3;
      this.rest[o] = s.x;
      this.rest[o + 1] = s.y;
      this.rest[o + 2] = s.z;
      const ang = hash(i, 6) * Math.PI * 2;
      const elev = (hash(i, 7) - 0.5) * Math.PI;
      const dist = scatterR * (0.7 + hash(i, 8) * 0.9);
      this.scatter[o] = Math.cos(ang) * Math.cos(elev) * dist;
      this.scatter[o + 1] = s.y + Math.sin(elev) * dist * 0.4;
      this.scatter[o + 2] = Math.sin(ang) * Math.cos(elev) * dist;
      if (shellOf(this.form) === "stain" || shellOf(this.form) === "culprit" || shellOf(this.form) === "human" || shellOf(this.form) === "matter" || shellOf(this.form) === "bug") {
        this.blight[o] = s.r;
        this.blight[o + 1] = s.g;
        this.blight[o + 2] = s.b;
        const lum = s.r * 0.28 + s.g * 0.5 + s.b * 0.22;
        this.pure[o] = Math.min(1, lum * 0.45);
        this.pure[o + 1] = Math.min(1, lum * 0.92);
        this.pure[o + 2] = Math.min(1, lum * 1.05);
      } else {
        this.blight[o] = s.r * 0.28 + 0.1;
        this.blight[o + 1] = s.g * 0.12;
        this.blight[o + 2] = s.b * 0.22 + 0.06;
        this.pure[o] = s.r;
        this.pure[o + 1] = s.g;
        this.pure[o + 2] = s.b;
      }
    }
  }

  private writeFrame(t: number): void {
    const pos = this.geo.getAttribute("position") as THREE.BufferAttribute;
    const col = this.geo.getAttribute("color") as THREE.BufferAttribute;
    const g = Math.max(0, this.gather * (1 - this.hitPulse * 0.2));
    const pu = this.purify;
    const hit = this.hitPulse;
    const shell = shellOf(this.form);
    const rise = shell === "cloud" || shell === "square" || isImageShell(shell) ? this.rise : 1;
    const arr = pos.array as Float32Array;
    const ca = col.array as Float32Array;
    const crawl = 0; // 벌레 idle 크롤 없음
    const breathAmt = isImageShell(shell) ? 0 : 0.045;
    const bob = isImageShell(shell) ? 0 : 0.06;
    for (let i = 0; i < this.count; i++) {
      const o = i * 3;
      const breath = Math.sin(t * 0.7 + i * 0.013) * breathAmt;
      const rx = this.rest[o]! * (1 + breath);
      const ry = this.rest[o + 1]! + Math.sin(t * 0.55 + i * 0.02) * bob;
      const rz = this.rest[o + 2]! * (1 + breath) + crawl;
      const sx = this.scatter[o]!;
      const sy = this.scatter[o + 1]!;
      const sz = this.scatter[o + 2]!;
      const spark = hit * (hash(i, 9) > 0.8 ? 0.28 : 0.08);
      const gg = Math.max(0, g - spark);
      arr[o] = sx + (rx - sx) * gg;
      arr[o + 1] = (sy + (ry - sy) * gg) * rise + (1 - rise) * -2.4;
      arr[o + 2] = sz + (rz - sz) * gg;
      const cr = this.blight[o]! + (this.pure[o]! - this.blight[o]!) * pu;
      const cg = this.blight[o + 1]! + (this.pure[o + 1]! - this.blight[o + 1]!) * pu;
      const cb = this.blight[o + 2]! + (this.pure[o + 2]! - this.blight[o + 2]!) * pu;
      ca[o] = Math.min(1, cr + (1 - cr) * hit * 0.9);
      ca[o + 1] = Math.min(1, cg + (0.78 - cg) * hit * 0.75);
      ca[o + 2] = Math.min(1, cb + (0.22 - cb) * hit * 0.4);
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;
  }
}

function defaultCount(form: CulpritForm): number {
  const shell = shellOf(form);
  if (shell === "bug") return petSamples.length || 20000;
  if (shell === "human") return petSamples.length || 20000;
  if (shell === "culprit") return petSamples.length || 20000;
  if (shell === "stain") return petSamples.length || 20000;
  if (shell === "matter") return petSamples.length || 20000;
  if (shell === "droplet") return petSamples.length || 20000;
  if (shell === "square") return 2400;
  if (shell === "pet") return petSamples.length || 20000;
  return 5200;
}

function defaultSize(form: CulpritForm): number {
  const shell = shellOf(form);
  if (shell === "bug") return petFit().size;
  if (shell === "human") return petFit().size;
  if (shell === "culprit") return petFit().size;
  if (shell === "stain") return petFit().size;
  if (shell === "matter") return petFit().size;
  if (shell === "droplet") return petFit().size;
  if (shell === "square") return 0.1;
  if (shell === "pet") return petFit().size;
  return 0.11;
}
