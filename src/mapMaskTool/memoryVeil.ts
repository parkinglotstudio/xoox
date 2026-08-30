/**
 * 정화전 컨셉 3 — 물빛 기억 베일.
 * 같은 after 합성 위에 채도↓ + 청록 안개 (별도 아트 아님).
 */
export function applyMemoryVeil(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext("2d")!;
  const { width: w, height: h } = canvas;
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i]!;
    const g = d[i + 1]!;
    const b = d[i + 2]!;
    const a = d[i + 3]!;
    if (a < 8) continue;
    // 채도 낮추기
    const gray = 0.3 * r + 0.59 * g + 0.11 * b;
    let nr = gray * 0.55 + r * 0.45;
    let ng = gray * 0.55 + g * 0.45;
    let nb = gray * 0.55 + b * 0.45;
    // 차가운 청록 베일
    nr = nr * 0.72 + 40 * 0.28;
    ng = ng * 0.72 + 90 * 0.28;
    nb = nb * 0.72 + 110 * 0.28;
    // 약간 어둡게
    nr *= 0.82;
    ng *= 0.85;
    nb *= 0.9;
    d[i] = Math.min(255, nr | 0);
    d[i + 1] = Math.min(255, ng | 0);
    d[i + 2] = Math.min(255, nb | 0);
  }
  ctx.putImageData(img, 0, 0);

  // 가장자리 안개 링
  const g = ctx.createRadialGradient(w / 2, h / 2, w * 0.25, w / 2, h / 2, w * 0.72);
  g.addColorStop(0, "rgba(45,120,140,0)");
  g.addColorStop(0.55, "rgba(30,90,110,0.12)");
  g.addColorStop(1, "rgba(12,40,55,0.45)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "rgba(180,230,240,0.85)";
  ctx.font = `${Math.max(11, w / 110)}px Georgia, serif`;
  ctx.fillText("BEFORE · Memory Veil (filter on after)", 12, h - 14);
}
