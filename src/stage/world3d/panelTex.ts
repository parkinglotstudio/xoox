/**
 * 2D 세움판 텍스처 — 흑바탕 키비주얼의 검정은 알파로 뺀다.
 */
import * as THREE from "three";

const cache = new Map<string, Promise<THREE.Texture>>();

export function loadPanelTexture(url: string): Promise<THREE.Texture> {
  const hit = cache.get(url);
  if (hit) return hit;
  const p = new Promise<THREE.Texture>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.naturalWidth || img.width;
      c.height = img.naturalHeight || img.height;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      knockBlack(ctx, c.width, c.height);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.needsUpdate = true;
      resolve(tex);
    };
    img.onerror = () => reject(new Error(`panel tex ${url}`));
    img.src = url;
  });
  cache.set(url, p);
  return p;
}

function knockBlack(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const data = ctx.getImageData(0, 0, w, h);
  const px = data.data;
  for (let i = 0; i < px.length; i += 4) {
    const r = px[i];
    const g = px[i + 1];
    const b = px[i + 2];
    if (r < 18 && g < 18 && b < 18) px[i + 3] = 0;
  }
  ctx.putImageData(data, 0, 0);
}
