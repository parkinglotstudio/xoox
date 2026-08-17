/**
 * 지역/생명 오염을 녹이는 짧은 연출.
 * 습격(PurifyRaid)을 열지 않는다. 해당 물체 게이지가 100→0으로 닳는다.
 */
import type { JourneyStage3D } from "./JourneyStage3D";
import { RaidVfx } from "./RaidVfx";
import { loadRaidTables } from "./raidTables";

export async function playPurifyMelt(opts: {
  stage: JourneyStage3D;
  host: HTMLElement;
  xPct: number;
  yPct: number;
  label: string;
  seconds?: number;
  /** true면 라벨·중앙 게이지를 숨기고 VFX만 (상황 설명은 필러) */
  hideChrome?: boolean;
}): Promise<void> {
  const seconds = Math.max(1.2, opts.seconds ?? 3);
  const overlay = document.createElement("div");
  overlay.className = "melt-overlay" + (opts.hideChrome ? " melt-quiet" : "");
  overlay.innerHTML = opts.hideChrome
    ? `<div class="melt-meter melt-meter-quiet" title="오염" aria-hidden="true"><i></i></div>`
    : `
    <div class="melt-label">${escapeHtml(opts.label)}</div>
    <div class="melt-meter" title="오염"><i></i></div>
    <div class="melt-pct">100%</div>
  `;
  const fill = overlay.querySelector("i") as HTMLElement;
  const pctEl = overlay.querySelector(".melt-pct") as HTMLElement | null;
  opts.host.appendChild(overlay);

  const world = opts.stage.pctToWorld(opts.xPct, opts.yPct);
  let vfx: RaidVfx | null = null;
  try {
    vfx = new RaidVfx(opts.stage, await loadRaidTables());
  } catch {
    vfx = null;
  }

  const t0 = performance.now();
  let last = t0;
  let shotAcc = 0;
  fill.style.width = "100%";

  await new Promise<void>((resolve) => {
    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const elapsed = now - t0;
      const remain = Math.max(0, 1 - elapsed / (seconds * 1000));
      fill.style.width = `${remain * 100}%`;
      if (pctEl) pctEl.textContent = `${Math.round(remain * 100)}%`;

      shotAcc += dt;
      if (vfx && shotAcc >= 0.16) {
        shotAcc = 0;
        vfx.play(remain > 0.12 ? "hit" : "death", world.x, world.z);
      }
      vfx?.tick(dt);

      if (remain <= 0) {
        vfx?.play("death", world.x, world.z);
        window.setTimeout(resolve, 220);
        return;
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });

  vfx?.dispose();
  overlay.remove();
}

/** 바닥 정화제를 줍는 게이지. 캐릭터 머리 위에 작게 · HP 칩 자리. */
export async function playPickupGauge(opts: {
  host: HTMLElement;
  label: string;
  seconds?: number;
  /** 매 프레임 머리 스크린 좌표. null이면 숨김 */
  anchor?: () => { x: number; y: number } | null;
}): Promise<void> {
  const seconds = Math.max(1.2, opts.seconds ?? 3);
  const overlay = document.createElement("div");
  overlay.className = "melt-overlay pick-overlay pick-head";
  overlay.innerHTML = `
    <div class="pick-head-box">
      <div class="pick-need">001 동작 필요</div>
      <div class="melt-label">${escapeHtml(opts.label)}</div>
      <div class="melt-meter pick-meter" title="줍기"><i></i></div>
      <div class="melt-pct">0%</div>
    </div>
  `;
  const box = overlay.querySelector(".pick-head-box") as HTMLElement;
  const fill = overlay.querySelector("i") as HTMLElement;
  const pctEl = overlay.querySelector(".melt-pct") as HTMLElement;
  opts.host.appendChild(overlay);
  fill.style.width = "0%";

  const place = () => {
    if (!opts.anchor) return;
    const p = opts.anchor();
    if (!p) {
      box.style.opacity = "0";
      return;
    }
    box.style.opacity = "1";
    box.style.left = `${p.x}px`;
    box.style.top = `${p.y}px`;
  };
  place();

  const t0 = performance.now();
  await new Promise<void>((resolve) => {
    const step = (now: number) => {
      place();
      const t = Math.min(1, (now - t0) / (seconds * 1000));
      fill.style.width = `${t * 100}%`;
      pctEl.textContent = `${Math.round(t * 100)}%`;
      if (t >= 1) {
        window.setTimeout(resolve, 160);
        return;
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
  overlay.remove();
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
