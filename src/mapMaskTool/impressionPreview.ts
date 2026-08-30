/**
 * 마스크 → 인상주의(점묘) 미니맵 프리뷰.
 * 최종 아트가 아니라 톤·구역 검증용. 기하학은 마스크와 동일.
 */
import type { LayerId } from "./types";
import { MASK_SIZE } from "./types";

export function renderImpressionPreview(
  out: HTMLCanvasElement,
  layerCanvases: Partial<Record<LayerId, HTMLCanvasElement>>,
): void {
  const size = resolveSize(layerCanvases);
  out.width = size;
  out.height = size;
  const ctx = out.getContext("2d")!;

  // 바다 — 울트라마린·보라 점
  fillPointillism(ctx, null, size, ["#1a2a6c", "#2d1b4e", "#0d3b66", "#3d2a6b"], 1);
  shimmerColumns(ctx, size);

  const land = layerCanvases.land;
  if (land) {
    paintMaskedPointillism(ctx, land, ["#3a7a3a", "#5a9a40", "#c9a227", "#7cb342", "#2e5a2e"], 2.2);
  }
  if (layerCanvases.forest) {
    paintMaskedPointillism(ctx, layerCanvases.forest, ["#1b5e20", "#33691e", "#558b2f", "#004d40"], 2.4);
  }
  if (layerCanvases.flower) {
    paintMaskedPointillism(ctx, layerCanvases.flower, ["#f48fb1", "#fce4ec", "#ffe082", "#ce93d8", "#ff8a65"], 1.8);
  }
  if (layerCanvases.farm) {
    paintMaskedPointillism(ctx, layerCanvases.farm, ["#c9a227", "#d4b84a", "#a1887f", "#bfa06a"], 1.7);
  }
  if (layerCanvases.pond) {
    paintMaskedPointillism(ctx, layerCanvases.pond, ["#1565c0", "#0277bd", "#4fc3f7", "#81d4fa"], 2.0);
  }
  if (layerCanvases.lake) {
    paintMaskedPointillism(ctx, layerCanvases.lake, ["#0d47a1", "#1565c0", "#0277bd", "#4fc3f7"], 2.2);
  }
  // path = 정보용 마스크. 인상주의(아트) 이미지에는 그리지 않음.
  if (layerCanvases.village) {
    paintMaskedPointillism(ctx, layerCanvases.village, ["#c62828", "#ef6c00", "#d84315", "#ff8a65"], 2.0);
  }
  if (layerCanvases.dock) {
    paintMaskedPointillism(ctx, layerCanvases.dock, ["#0277bd", "#0288d1", "#4fc3f7", "#81d4fa"], 1.8);
  }
  if (layerCanvases.rock) {
    paintMaskedPointillism(ctx, layerCanvases.rock, ["#5d4e37", "#6d4c41", "#8d6e63", "#a1887f"], 1.8);
  }
  if (layerCanvases.debris) {
    paintMaskedPointillism(ctx, layerCanvases.debris, ["#6d4c41", "#5d4037", "#8d6e63", "#4e342e"], 1.6);
  }
  if (layerCanvases.blight) {
    paintMaskedPointillism(ctx, layerCanvases.blight, ["#4a148c", "#6a1b9a", "#8e24aa", "#ce93d8"], 2.0);
  }

  stampCenters(ctx, layerCanvases.poi, "#c6ff00", Math.max(4, size / 128));

  ctx.fillStyle = "rgba(255,240,200,0.85)";
  ctx.font = `${Math.max(11, size / 110)}px Georgia, serif`;
  ctx.fillText("AFTER · Impressionist preview (from mask)", 12, size - 14);
}

function resolveSize(layers: Partial<Record<LayerId, HTMLCanvasElement>>): number {
  for (const c of Object.values(layers)) {
    if (c && c.width > 0) return c.width;
  }
  return MASK_SIZE;
}

function shimmerColumns(ctx: CanvasRenderingContext2D, size: number): void {
  const colors = ["#ffcc80", "#ffe082", "#f8bbd0", "#fff59d"];
  for (const x of [size * 0.22, size * 0.78]) {
    for (let y = 0; y < size; y += 3) {
      ctx.fillStyle = colors[(y / 3) % colors.length]!;
      ctx.globalAlpha = 0.15 + Math.random() * 0.2;
      ctx.fillRect(x + (Math.random() - 0.5) * 18, y, 2 + Math.random() * 2, 3);
    }
  }
  ctx.globalAlpha = 1;
}

function fillPointillism(
  ctx: CanvasRenderingContext2D,
  _mask: HTMLCanvasElement | null,
  size: number,
  palette: string[],
  radius: number,
): void {
  for (let i = 0; i < 9000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.fillStyle = palette[(Math.random() * palette.length) | 0]!;
    ctx.beginPath();
    ctx.arc(x, y, radius * (0.6 + Math.random()), 0, Math.PI * 2);
    ctx.fill();
  }
}

function paintMaskedPointillism(
  ctx: CanvasRenderingContext2D,
  mask: HTMLCanvasElement,
  palette: string[],
  radius: number,
): void {
  const outSize = mask.width || MASK_SIZE;
  const w = 128;
  const h = 128;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  g.drawImage(mask, 0, 0, w, h);
  const data = g.getImageData(0, 0, w, h).data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3]! < 40) continue;
      const n = 2 + ((x + y) % 2);
      for (let k = 0; k < n; k++) {
        const px = ((x + Math.random()) / w) * outSize;
        const py = ((y + Math.random()) / h) * outSize;
        ctx.fillStyle = palette[(Math.random() * palette.length) | 0]!;
        ctx.beginPath();
        ctx.arc(px, py, radius * (0.5 + Math.random() * 0.8), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function stampCenters(
  ctx: CanvasRenderingContext2D,
  mask: HTMLCanvasElement | undefined,
  color: string,
  r: number,
): void {
  if (!mask) return;
  const outSize = mask.width || MASK_SIZE;
  const w = 24;
  const h = 24;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  g.drawImage(mask, 0, 0, w, h);
  const data = g.getImageData(0, 0, w, h).data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3]! < 100) continue;
      const px = ((x + 0.5) / w) * outSize;
      const py = ((y + 0.5) / h) * outSize;
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}
