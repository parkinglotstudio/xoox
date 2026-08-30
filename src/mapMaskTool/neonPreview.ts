/**
 * 마스크 → 네온 미니맵 프리뷰.
 * 기준작: soos_minimap_neon_black (검정 + 시안 길 + 핑크 노드 + 라임 숲/POI + 호박 건물 + 보라 해안)
 */
import type { LayerId } from "./types";
import { MASK_SIZE } from "./types";

/** 미리 로드된 레이어 캔버스 맵으로 네온 합성 */
export function renderNeonPreview(
  out: HTMLCanvasElement,
  layerCanvases: Partial<Record<LayerId, HTMLCanvasElement>>,
  opts?: { label?: string },
): void {
  const size = resolveSize(layerCanvases);
  out.width = size;
  out.height = size;
  const ctx = out.getContext("2d")!;
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, size, size);

  // 미세 그리드
  ctx.strokeStyle = "rgba(45, 224, 208, 0.08)";
  ctx.lineWidth = 1;
  const step = Math.max(24, Math.round(size / 48));
  for (let i = 0; i <= size; i += step) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }

  const land = layerCanvases.land;
  if (land) {
    fillMasked(ctx, land, "#0a1210");
    // 해안은 얇고 어두운 회보라 — 바위·노드 핑크와 구분
    strokeMaskEdge(ctx, land, "#6a5a78", 2.2, 0.7);
    strokeMaskEdge(ctx, land, "#8a7a9a", 1.0, 0.35);
  }

  paintForestDots(ctx, layerCanvases.forest);
  paintFlowerField(ctx, layerCanvases.flower);
  paintFarmRows(ctx, layerCanvases.farm);
  paintPond(ctx, layerCanvases.pond);
  paintPond(ctx, layerCanvases.lake);
  paintDebris(ctx, layerCanvases.debris);
  paintBlight(ctx, layerCanvases.blight);
  // walk = 작업 구역(타일) (시안 반투명)
  if (layerCanvases.walk) {
    fillMasked(ctx, layerCanvases.walk, "rgba(45,224,208,0.18)");
  }
  paintVillageBlocks(ctx, layerCanvases.village);
  paintRocks(ctx, layerCanvases.rock);
  // path/node = 레이아웃·이동 정보. 이미지(아트) 합성에서는 생략.
  paintDock(ctx, layerCanvases.dock);
  paintPois(ctx, layerCanvases.poi, size);

  // HUD 라벨
  ctx.fillStyle = "#2de0d0";
  ctx.font = `bold ${Math.max(12, size / 110)}px monospace`;
  ctx.fillText((opts?.label || "SECTOR").toUpperCase(), 14, 24);
  ctx.font = `${Math.max(10, size / 140)}px monospace`;
  ctx.fillStyle = "rgba(45,224,208,0.75)";
  ctx.fillText("MASK → NEON PREVIEW", 14, 40);
  ctx.fillText("N", size - 28, size - 16);
}

function resolveSize(layers: Partial<Record<LayerId, HTMLCanvasElement>>): number {
  for (const c of Object.values(layers)) {
    if (c && c.width > 0) return c.width;
  }
  return MASK_SIZE;
}

function fillMasked(ctx: CanvasRenderingContext2D, mask: HTMLCanvasElement, color: string): void {
  const w = mask.width;
  const h = mask.height;
  const tmp = document.createElement("canvas");
  tmp.width = w;
  tmp.height = h;
  const t = tmp.getContext("2d")!;
  t.drawImage(mask, 0, 0);
  t.globalCompositeOperation = "source-in";
  t.fillStyle = color;
  t.fillRect(0, 0, w, h);
  ctx.drawImage(tmp, 0, 0);
}

function strokeMaskEdge(
  ctx: CanvasRenderingContext2D,
  mask: HTMLCanvasElement,
  color: string,
  width: number,
  alpha: number,
): void {
  const tmp = document.createElement("canvas");
  tmp.width = mask.width;
  tmp.height = mask.height;
  const t = tmp.getContext("2d")!;
  t.drawImage(mask, 0, 0);
  t.globalCompositeOperation = "source-in";
  t.fillStyle = color;
  t.fillRect(0, 0, tmp.width, tmp.height);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  // 살짝 부풀려 윤곽
  for (const [dx, dy] of [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ] as const) {
    ctx.drawImage(tmp, dx * width * 0.35, dy * width * 0.35);
  }
  ctx.globalAlpha = alpha * 0.85;
  ctx.drawImage(tmp, 0, 0);
  ctx.restore();
}

function paintForestDots(ctx: CanvasRenderingContext2D, mask?: HTMLCanvasElement): void {
  if (!mask) return;
  const { data, w, h } = sampleMask(mask, 4);
  ctx.fillStyle = "#3dff6a";
  ctx.shadowColor = "#3dff6a";
  ctx.shadowBlur = 4;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3]! < 40) continue;
      if (((x * 17 + y * 31) % 7) !== 0) continue;
      const px = (x / w) * MASK_SIZE;
      const py = (y / h) * MASK_SIZE;
      ctx.beginPath();
      ctx.arc(px, py, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.shadowBlur = 0;
}

function paintFlowerField(ctx: CanvasRenderingContext2D, mask?: HTMLCanvasElement): void {
  if (!mask) return;
  const { data, w, h } = sampleMask(mask, 3);
  const colors = ["#ff6ad5", "#ff9ecd", "#ffe066", "#ff7a9a", "#cc99ff"];
  ctx.shadowBlur = 3;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3]! < 40) continue;
      if (((x * 13 + y * 7) % 5) !== 0) continue;
      const px = (x / w) * MASK_SIZE;
      const py = (y / h) * MASK_SIZE;
      const c = colors[(x + y) % colors.length]!;
      ctx.fillStyle = c;
      ctx.shadowColor = c;
      ctx.beginPath();
      ctx.arc(px, py, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.shadowBlur = 0;
}

function paintFarmRows(ctx: CanvasRenderingContext2D, mask?: HTMLCanvasElement): void {
  if (!mask) return;
  const { data, w, h } = sampleMask(mask, 2);
  ctx.strokeStyle = "#e6c35c";
  ctx.shadowColor = "#e6c35c";
  ctx.shadowBlur = 4;
  ctx.lineWidth = 1;
  // 가로 고랑
  for (let y = 0; y < h; y += 2) {
    let run: number | null = null;
    for (let x = 0; x <= w; x++) {
      const on = x < w && data[(y * w + x) * 4 + 3]! > 40;
      if (on && run == null) run = x;
      if (!on && run != null) {
        ctx.beginPath();
        ctx.moveTo((run / w) * MASK_SIZE, (y / h) * MASK_SIZE);
        ctx.lineTo((x / w) * MASK_SIZE, (y / h) * MASK_SIZE);
        ctx.stroke();
        run = null;
      }
    }
  }
  ctx.shadowBlur = 0;
}

function paintPond(ctx: CanvasRenderingContext2D, mask?: HTMLCanvasElement): void {
  if (!mask) return;
  fillMasked(ctx, mask, "#0a2040");
  strokeMaskEdge(ctx, mask, "#3d8cff", 2.0, 0.9);
  strokeMaskEdge(ctx, mask, "#7ec8ff", 1.0, 0.45);
}

function paintVillageBlocks(ctx: CanvasRenderingContext2D, mask?: HTMLCanvasElement): void {
  if (!mask) return;
  const { data, w, h } = sampleMask(mask, 8);
  ctx.strokeStyle = "#ffb84d";
  ctx.shadowColor = "#ffb84d";
  ctx.shadowBlur = 6;
  ctx.lineWidth = 1.5;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3]! < 50) continue;
      const px = (x / w) * MASK_SIZE;
      const py = (y / h) * MASK_SIZE;
      const s = 4 + ((x + y) % 3);
      ctx.strokeRect(px - s / 2, py - s / 2, s, s);
    }
  }
  ctx.shadowBlur = 0;
}

function paintRocks(ctx: CanvasRenderingContext2D, mask?: HTMLCanvasElement): void {
  if (!mask) return;
  // 채움: 어두운 슬레이트 (분홍 면 제거)
  fillMasked(ctx, mask, "#1c1824");
  // 윤곽: 얇은 회보라만
  strokeMaskEdge(ctx, mask, "#7a6a88", 1.4, 0.75);
  strokeMaskEdge(ctx, mask, "#9a8aaa", 0.7, 0.4);
}

function paintDebris(ctx: CanvasRenderingContext2D, mask?: HTMLCanvasElement): void {
  if (!mask) return;
  fillMasked(ctx, mask, "#3e2723");
  strokeMaskEdge(ctx, mask, "#8d6e63", 1.2, 0.6);
}

function paintBlight(ctx: CanvasRenderingContext2D, mask?: HTMLCanvasElement): void {
  if (!mask) return;
  fillMasked(ctx, mask, "#2a1038");
  strokeMaskEdge(ctx, mask, "#ce93d8", 2.0, 0.85);
  strokeMaskEdge(ctx, mask, "#ea80fc", 1.0, 0.45);
}

function paintPathGlow(ctx: CanvasRenderingContext2D, mask?: HTMLCanvasElement): void {
  if (!mask) return;
  const w = mask.width;
  const h = mask.height;
  const tint = (color: string, blur: number, alpha: number) => {
    const tmp = document.createElement("canvas");
    tmp.width = w;
    tmp.height = h;
    const t = tmp.getContext("2d")!;
    t.drawImage(mask, 0, 0);
    t.globalCompositeOperation = "source-in";
    t.fillStyle = color;
    t.fillRect(0, 0, w, h);
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = blur;
    ctx.globalAlpha = alpha;
    ctx.drawImage(tmp, 0, 0);
    ctx.restore();
  };
  // 네온 레퍼런스: 넓은 시안 글로우 + 밝은 코어
  tint("rgba(45,224,208,0.55)", Math.max(12, w / 80), 0.55);
  tint("#2de0d0", Math.max(6, w / 160), 0.95);
  tint("#b8fff8", Math.max(2, w / 400), 1);
}

function paintDock(ctx: CanvasRenderingContext2D, mask?: HTMLCanvasElement): void {
  if (!mask) return;
  const w = mask.width;
  const h = mask.height;
  const tmp = document.createElement("canvas");
  tmp.width = w;
  tmp.height = h;
  const t = tmp.getContext("2d")!;
  t.drawImage(mask, 0, 0);
  t.globalCompositeOperation = "source-in";
  t.fillStyle = "#5ec8ff";
  t.fillRect(0, 0, w, h);
  ctx.save();
  ctx.shadowColor = "#5ec8ff";
  ctx.shadowBlur = 8;
  ctx.drawImage(tmp, 0, 0);
  ctx.restore();
}

function paintNodes(ctx: CanvasRenderingContext2D, mask?: HTMLCanvasElement, size = MASK_SIZE): void {
  if (!mask) return;
  const { data, w, h } = sampleMask(mask, 16);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3]! < 80) continue;
      const px = (x / w) * size;
      const py = (y / h) * size;
      drawDiamond(ctx, px, py, Math.max(4, size / 220), "#ff4dd2");
    }
  }
}

function paintPois(ctx: CanvasRenderingContext2D, mask?: HTMLCanvasElement, size = MASK_SIZE): void {
  if (!mask) return;
  const { data, w, h } = sampleMask(mask, 20);
  ctx.strokeStyle = "#b8ff4d";
  ctx.shadowColor = "#b8ff4d";
  ctx.shadowBlur = 8;
  ctx.lineWidth = Math.max(1.2, size / 1000);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3]! < 80) continue;
      const px = (x / w) * size;
      const py = (y / h) * size;
      const r = Math.max(5, size / 180);
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(px - r * 1.3, py);
      ctx.lineTo(px + r * 1.3, py);
      ctx.moveTo(px, py - r * 1.3);
      ctx.lineTo(px, py + r * 1.3);
      ctx.stroke();
    }
  }
  ctx.shadowBlur = 0;
}

function drawDiamond(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(x, y, 1.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function sampleMask(
  mask: HTMLCanvasElement,
  cell: number,
): { data: Uint8ClampedArray; w: number; h: number } {
  const w = Math.max(1, Math.floor(mask.width / cell));
  const h = Math.max(1, Math.floor(mask.height / cell));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  g.drawImage(mask, 0, 0, w, h);
  return { data: g.getImageData(0, 0, w, h).data, w, h };
}
