/**
 * 3D 여정 뷰 프로토 툴 — 전체 화면 놀이터.
 *
 * 판단 기준 하나: **위에서 그린 항공 지도를 바닥에 눕혔을 때 납득되는 그림인가.**
 *
 * 다이얼과 미리보기는 Journey3DTuner가 들고 있다(레이아웃 에디터와 같은 모듈).
 * 이 파일은 그 위에 넓은 화면·미니맵·HUD만 얹는다. 저장하면 본편이 읽는
 * `data/ui/layout/journey3d_layout.json` 이 갱신된다.
 *
 * SSoT는 건드리지 않는다 — area_config / area_npc_config / sector_scale.json 은 읽기만.
 */
import { Journey3DTuner } from "../../stage/world3d/Journey3DTuner";
import type { JourneyStage3D } from "../../stage/world3d/JourneyStage3D";
import type { WorldNode } from "../../stage/world3d/types";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const canvas = $<HTMLCanvasElement>("fpvCanvas");
const miniCanvas = $<HTMLCanvasElement>("miniCanvas");
const statusEl = $<HTMLElement>("status");
const hudPos = $<HTMLElement>("hudPos");
const hudNear = $<HTMLElement>("hudNear");
const sectorSel = $<HTMLSelectElement>("sectorSel");
const artSel = $<HTMLSelectElement>("artSel");
const dials = $<HTMLElement>("dials");

function setStatus(msg: string, kind: "" | "ok" | "err" = "") {
  statusEl.textContent = msg;
  statusEl.classList.toggle("err", kind === "err");
  statusEl.classList.toggle("ok", kind === "ok");
}

// ── 미니맵 ──────────────────────────────────────────────────────
// 본편에서는 explore.ts가 이 자리를 차지한다. 여기서는 좌표 동기화가
// 맞는지만 확인하는 최소 렌더다.

const miniCtx = miniCanvas.getContext("2d")!;
let miniBg: HTMLImageElement | null = null;
let miniNodes: WorldNode[] = [];

function loadMiniBg(url: string) {
  const img = new Image();
  img.onload = () => {
    miniBg = img;
    drawMini(50, 88, 0);
  };
  img.src = url;
}

function drawMini(xPct: number, yPct: number, yawDeg: number) {
  const S = miniCanvas.width;
  miniCtx.clearRect(0, 0, S, S);
  miniCtx.fillStyle = "#070c12";
  miniCtx.fillRect(0, 0, S, S);
  if (miniBg) {
    miniCtx.globalAlpha = 0.75;
    miniCtx.drawImage(miniBg, 0, 0, S, S);
    miniCtx.globalAlpha = 1;
  }

  for (const n of miniNodes) {
    miniCtx.fillStyle = "rgba(255, 210, 122, 0.9)";
    miniCtx.beginPath();
    miniCtx.arc((n.xPct / 100) * S, (n.yPct / 100) * S, 3.5, 0, Math.PI * 2);
    miniCtx.fill();
  }

  const px = (xPct / 100) * S;
  const py = (yPct / 100) * S;
  // 시야 원 — 3D 안개와 같은 반경
  const r = (tuner.visionPct() / 100) * S;
  const g = miniCtx.createRadialGradient(px, py, 0, px, py, r);
  g.addColorStop(0, "rgba(0, 255, 230, 0.35)");
  g.addColorStop(1, "rgba(0, 255, 230, 0)");
  miniCtx.fillStyle = g;
  miniCtx.beginPath();
  miniCtx.arc(px, py, r, 0, Math.PI * 2);
  miniCtx.fill();

  // 진행 방향 삼각형
  miniCtx.save();
  miniCtx.translate(px, py);
  miniCtx.rotate((yawDeg * Math.PI) / 180);
  miniCtx.fillStyle = "#ffffff";
  miniCtx.beginPath();
  miniCtx.moveTo(0, -9);
  miniCtx.lineTo(6, 6);
  miniCtx.lineTo(-6, 6);
  miniCtx.closePath();
  miniCtx.fill();
  miniCtx.restore();
}

// ── 부팅 ────────────────────────────────────────────────────────

const tuner = new Journey3DTuner(canvas, dials, {
  onStatus: setStatus,
  onMove: (x, y, yaw) => {
    hudPos.textContent = `x ${x.toFixed(1)} · y ${y.toFixed(1)} · ${Math.round(((yaw % 360) + 360) % 360)}°`;
    drawMini(x, y, yaw);
  },
  onNodeNear: (n) => {
    hudNear.textContent = n ? `▶ ${n.icon} ${n.label} — Enter` : "";
  },
  onNodeActivate: (n) => setStatus(`노드 실행(프로토): ${n.label} [${n.id}]`),
  onSectorApplied: (_areaId, floorUrl, nodes) => {
    miniNodes = nodes;
    loadMiniBg(floorUrl);
  },
});

async function boot() {
  await tuner.init();
  (window as unknown as { __stage3d: JourneyStage3D }).__stage3d = tuner.getStage();

  sectorSel.innerHTML = tuner
    .sectorIds()
    .map(
      (id) =>
        `<option value="${id}"${id === tuner.currentSector() ? " selected" : ""}>${tuner.sectorLabel(id)} (${id})</option>`,
    )
    .join("");

  sectorSel.addEventListener("change", () => void tuner.applySector(sectorSel.value));
  artSel.addEventListener("change", () => tuner.setArtVariant(artSel.value === "after"));
  let propsStanding = false;
  $("btnPropsStand").addEventListener("click", () => {
    propsStanding = !propsStanding;
    tuner.getStage().setPropsKeepStanding(propsStanding);
    $("btnPropsStand").textContent = propsStanding ? "프롭 기립 ON" : "프롭 전부 기립";
    setStatus(propsStanding ? "프롭 전부 기립 (거리 무시)" : "프롭 기립 거리 복귀");
  });
  $("btnReset").addEventListener("click", () => {
    tuner.resetPlayer();
    drawMini(50, 88, 0);
  });
  $("btnSave").addEventListener("click", () => void tuner.save());
  $("btnRevert").addEventListener("click", () => void tuner.reload());
  $("btnDefaults").addEventListener("click", () => tuner.resetToDefaults());

  const fit = () => tuner.resize();
  window.addEventListener("resize", fit);
  new ResizeObserver(fit).observe($<HTMLElement>("stageFrame"));
  fit();
}

void boot();
