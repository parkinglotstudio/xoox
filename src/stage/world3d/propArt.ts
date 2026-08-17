/**
 * 프롭 절차 아트 — 아트가 나오기 전까지 세로 구조물을 캔버스로 그린다.
 *
 * 둠식 빌보드는 실루엣과 위아래 명암만 맞아도 깊이가 읽힌다.
 * 진짜 아트가 들어오면 WorldProp.art에 URL을 주고 이 파일은 폴백으로만 남는다.
 */
import * as THREE from "three";
import type { PropKind } from "./types";

/** kind → 기본 높이(m) · 가로세로비 (캐릭터 키 1m 기준) */
/**
 * 구조물은 전부 2D 세움판이다. 카메라를 따라 돌아야 옆에서 얇아지지 않는다
 * (둠 원조 방식). 고정 벽이 필요해지면 WorldProp.billboard = false 로 한 장만 뺀다.
 */
export const PROP_DEFAULTS: Record<PropKind, { hM: number; aspect: number; billboard: boolean }> = {
  building: { hM: 12.5, aspect: 0.72, billboard: true },
  tower: { hM: 14.0, aspect: 0.48, billboard: true },
  fence: { hM: 1.15, aspect: 2.44, billboard: true },
  sign: { hM: 2.2, aspect: 0.64, billboard: true },
  crate: { hM: 0.72, aspect: 0.96, billboard: true },
  barrel: { hM: 0.95, aspect: 0.68, billboard: true },
  pole: { hM: 2.6, aspect: 0.35, billboard: true },
  tree: { hM: 6.4, aspect: 0.65, billboard: true },
  bush: { hM: 1.35, aspect: 1.3, billboard: true },
  debris: { hM: 0.9, aspect: 1.89, billboard: true },
};

const V = "v=4";

/** 컨셉 청록 지붕 · 세움판 스티커. 집은 4종만. 나무보다 크게. */
export const HOUSE_STICKERS = [
  { art: `/art/props/sticker/prop_sticker_house_01.png?${V}`, hM: 13.0, aspect: 0.65 },
  { art: `/art/props/sticker/prop_sticker_house_02.png?${V}`, hM: 12.0, aspect: 0.89 },
  { art: `/art/props/sticker/prop_sticker_house_03.png?${V}`, hM: 12.5, aspect: 1.33 },
  { art: `/art/props/sticker/prop_sticker_house_04.png?${V}`, hM: 14.0, aspect: 1.5 },
] as const;

export const PROP_STICKER: Record<PropKind, string> = {
  building: HOUSE_STICKERS[0].art,
  tower: `/art/props/sticker/prop_sticker_tower.png?${V}`,
  fence: `/art/props/sticker/prop_sticker_fence.png?${V}`,
  sign: `/art/props/sticker/prop_sticker_sign.png?${V}`,
  crate: `/art/props/sticker/prop_sticker_crate.png?${V}`,
  barrel: `/art/props/sticker/prop_sticker_barrel.png?${V}`,
  pole: `/art/props/sticker/prop_sticker_pole.png?${V}`,
  tree: `/art/props/sticker/prop_sticker_tree.png?${V}`,
  bush: `/art/props/sticker/prop_sticker_bush.png?${V}`,
  debris: `/art/props/sticker/prop_sticker_debris.png?${V}`,
};

const SMALL: PropKind[] = ["bush", "crate", "barrel", "pole", "sign", "debris"];

/** 컨셉에서 뜯은 자리 → 스티커 종류. 집은 4종 순환. */
export function stickerForDraft(
  d: { hFrac: number; aspect: number },
  i: number,
): { kind: PropKind; art: string; hM: number; aspect: number } {
  const area = d.hFrac * d.hFrac * d.aspect;
  if (area >= 0.01) {
    if (d.aspect < 0.72 && d.hFrac > 0.1) {
      return { kind: "tower", art: PROP_STICKER.tower, ...PROP_DEFAULTS.tower };
    }
    const house = HOUSE_STICKERS[i % HOUSE_STICKERS.length]!;
    return { kind: "building", art: house.art, hM: house.hM, aspect: house.aspect };
  }
  if (d.aspect >= 2 || d.aspect <= 0.35) {
    return { kind: "fence", art: PROP_STICKER.fence, ...PROP_DEFAULTS.fence };
  }
  if (area >= 0.0028) {
    return { kind: "tree", art: PROP_STICKER.tree, ...PROP_DEFAULTS.tree };
  }
  const kind = SMALL[i % SMALL.length]!;
  return { kind, art: PROP_STICKER[kind], ...PROP_DEFAULTS[kind] };
}

const cache = new Map<string, THREE.Texture>();
const loader = new THREE.TextureLoader();

export function stickerTexture(kind: PropKind): THREE.Texture {
  const url = PROP_STICKER[kind];
  const hit = cache.get(url);
  if (hit) return hit;
  const tex = loader.load(url);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  cache.set(url, tex);
  return tex;
}

export function propTexture(kind: PropKind, tint?: string): THREE.Texture {
  const key = `${kind}|${tint ?? ""}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const tex = new THREE.CanvasTexture(paint(kind, tint));
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  cache.set(key, tex);
  return tex;
}

export function disposePropTextures(): void {
  for (const t of cache.values()) t.dispose();
  cache.clear();
}

function paint(kind: PropKind, tint?: string): HTMLCanvasElement {
  const def = PROP_DEFAULTS[kind];
  const H = 512;
  const W = Math.max(32, Math.round(H * def.aspect));
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  const base = tint ?? DEFAULT_TINT[kind];

  switch (kind) {
    case "building":
    case "tower":
      paintBuilding(ctx, W, H, base);
      break;
    case "fence":
      paintFence(ctx, W, H, base);
      break;
    case "sign":
      paintSign(ctx, W, H, base);
      break;
    case "crate":
    case "barrel":
      paintCrate(ctx, W, H, base);
      break;
    case "pole":
      paintPole(ctx, W, H, base);
      break;
    case "tree":
    case "bush":
      paintTree(ctx, W, H, base);
      break;
    case "debris":
      paintDebris(ctx, W, H, base);
      break;
  }
  return c;
}

const DEFAULT_TINT: Record<PropKind, string> = {
  building: "#7a6a58",
  tower: "#6a5a48",
  fence: "#8a6a44",
  sign: "#b8894a",
  crate: "#9a7a52",
  barrel: "#8a6a44",
  pole: "#5d6570",
  tree: "#4d6a52",
  bush: "#4a6a44",
  debris: "#6b6f78",
};

function shade(hex: string, mul: number): string {
  const c = new THREE.Color(hex).multiplyScalar(mul);
  return `#${c.getHexString()}`;
}

/** 위는 밝고 아래는 어둡게 — 서 있는 물체로 읽히게 하는 최소 조건 */
function verticalFill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  base: string,
): void {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, shade(base, 1.25));
  g.addColorStop(0.55, base);
  g.addColorStop(1, shade(base, 0.62));
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}

function paintBuilding(ctx: CanvasRenderingContext2D, W: number, H: number, base: string): void {
  const roofH = H * 0.26;
  // 지붕
  ctx.fillStyle = shade(base, 0.72);
  ctx.beginPath();
  ctx.moveTo(W * 0.02, roofH);
  ctx.lineTo(W * 0.5, H * 0.02);
  ctx.lineTo(W * 0.98, roofH);
  ctx.closePath();
  ctx.fill();

  // 몸통
  const bodyY = roofH;
  const bodyH = H - roofH;
  verticalFill(ctx, W * 0.08, bodyY, W * 0.84, bodyH, base);
  ctx.strokeStyle = shade(base, 0.45);
  ctx.lineWidth = 4;
  ctx.strokeRect(W * 0.08, bodyY, W * 0.84, bodyH);

  // 문
  const dw = W * 0.22;
  const dh = bodyH * 0.44;
  ctx.fillStyle = shade(base, 0.32);
  ctx.fillRect(W * 0.5 - dw / 2, H - dh, dw, dh);

  // 창 — 안개 속에서 유일하게 밝은 점이라 거리감이 잘 읽힌다
  ctx.fillStyle = "rgba(255, 226, 160, 0.82)";
  const ww = W * 0.15;
  const wh = bodyH * 0.2;
  ctx.fillRect(W * 0.18, bodyY + bodyH * 0.18, ww, wh);
  ctx.fillRect(W * 0.67, bodyY + bodyH * 0.18, ww, wh);
}

function paintFence(ctx: CanvasRenderingContext2D, W: number, H: number, base: string): void {
  const posts = 6;
  const pw = W / (posts * 2.1);
  for (let i = 0; i < posts; i++) {
    const x = (i + 0.5) * (W / posts) - pw / 2;
    verticalFill(ctx, x, H * 0.06, pw, H * 0.94, base);
  }
  // 가로대
  ctx.fillStyle = shade(base, 0.85);
  ctx.fillRect(0, H * 0.28, W, H * 0.11);
  ctx.fillRect(0, H * 0.62, W, H * 0.11);
}

function paintSign(ctx: CanvasRenderingContext2D, W: number, H: number, base: string): void {
  // 기둥
  verticalFill(ctx, W * 0.44, H * 0.35, W * 0.12, H * 0.65, shade(base, 0.7));
  // 판
  const bw = W * 0.92;
  const bh = H * 0.36;
  const bx = (W - bw) / 2;
  verticalFill(ctx, bx, H * 0.04, bw, bh, base);
  ctx.strokeStyle = shade(base, 0.4);
  ctx.lineWidth = 6;
  ctx.strokeRect(bx, H * 0.04, bw, bh);
  // 글씨 자리 — 읽히지 않아도 되는 흔적선
  ctx.fillStyle = "rgba(30, 22, 14, 0.55)";
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(bx + bw * 0.12, H * 0.1 + i * bh * 0.24, bw * (0.76 - i * 0.14), bh * 0.11);
  }
}

function paintCrate(ctx: CanvasRenderingContext2D, W: number, H: number, base: string): void {
  verticalFill(ctx, W * 0.06, H * 0.08, W * 0.88, H * 0.92, base);
  ctx.strokeStyle = shade(base, 0.42);
  ctx.lineWidth = 8;
  ctx.strokeRect(W * 0.06, H * 0.08, W * 0.88, H * 0.92);
  ctx.beginPath();
  ctx.moveTo(W * 0.06, H * 0.08);
  ctx.lineTo(W * 0.94, H);
  ctx.moveTo(W * 0.94, H * 0.08);
  ctx.lineTo(W * 0.06, H);
  ctx.stroke();
}

function paintPole(ctx: CanvasRenderingContext2D, W: number, H: number, base: string): void {
  verticalFill(ctx, 0, 0, W, H, base);
  ctx.fillStyle = "rgba(255, 240, 190, 0.85)";
  ctx.beginPath();
  ctx.arc(W / 2, H * 0.06, W * 0.9, 0, Math.PI * 2);
  ctx.fill();
}

function paintTree(ctx: CanvasRenderingContext2D, W: number, H: number, base: string): void {
  // 줄기
  verticalFill(ctx, W * 0.42, H * 0.45, W * 0.16, H * 0.55, "#5a4530");
  // 수관 — 원 3개로 실루엣
  ctx.fillStyle = base;
  const blobs: [number, number, number][] = [
    [0.5, 0.24, 0.42],
    [0.28, 0.4, 0.3],
    [0.72, 0.4, 0.3],
  ];
  for (const [cx, cy, r] of blobs) {
    ctx.beginPath();
    ctx.arc(W * cx, H * cy, W * r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = shade(base, 1.3);
  ctx.beginPath();
  ctx.arc(W * 0.42, H * 0.2, W * 0.2, 0, Math.PI * 2);
  ctx.fill();
}

function paintDebris(ctx: CanvasRenderingContext2D, W: number, H: number, base: string): void {
  ctx.fillStyle = base;
  ctx.beginPath();
  ctx.moveTo(W * 0.04, H);
  ctx.lineTo(W * 0.22, H * 0.3);
  ctx.lineTo(W * 0.46, H * 0.62);
  ctx.lineTo(W * 0.68, H * 0.18);
  ctx.lineTo(W * 0.94, H * 0.7);
  ctx.lineTo(W * 0.98, H);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = shade(base, 1.4);
  ctx.lineWidth = 5;
  ctx.stroke();
}
