/**
 * 맵 프로토 무대에 평평한 9칸 섬 바닥을 붙인다.
 */
import { IslandFloor, type IslandFloorApi } from "./IslandFloor";

declare global {
  interface Window {
    __islandFloor?: IslandFloorApi;
    __mapProtoOnFloorReady?: () => void;
  }
}

const canvas = document.querySelector<HTMLCanvasElement>("#islandFloor");
const stage = document.getElementById("stage");
if (!canvas || !stage) {
  throw new Error("map-proto: #islandFloor / #stage 없음");
}

const floorCanvas = canvas;
const stageEl = stage;
const floor = new IslandFloor(floorCanvas);
window.__islandFloor = floor;

function size(): void {
  const r = stageEl.getBoundingClientRect();
  const w = Math.max(1, Math.round(r.width));
  const h = Math.max(1, Math.round(r.height));
  floorCanvas.style.width = `${w}px`;
  floorCanvas.style.height = `${h}px`;
  floor.resize(w, h);
}

new ResizeObserver(size).observe(stageEl);
size();

void floor.ready.then(() => {
  size();
  stageEl.classList.add("island-3d");
  window.__mapProtoOnFloorReady?.();
});
