/**
 * 여정 입장·칸 이동 연출.
 * 페이드 아웃 → 맵·나무 준비 → 페이드 인. 로딩 UI는 쓰지 않는다.
 */
function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

const FADE_MS = 420;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function playMapTitleTypography(
  host: HTMLElement,
  title: string,
): Promise<void> {
  const el = document.createElement("div");
  el.className = "journey-enter-title";
  el.setAttribute("aria-hidden", "true");
  el.innerHTML = `<span class="journey-enter-title-text">${escapeHtml(title)}</span>`;
  host.appendChild(el);
  void el.offsetWidth;
  el.classList.add("in");
  await wait(1100);
  el.classList.add("out");
  el.classList.remove("in");
  await wait(700);
  el.remove();
}

function ensureFade(host: HTMLElement): HTMLElement {
  host.querySelectorAll(".journey-shutter").forEach((el) => el.remove());
  let el = host.querySelector<HTMLElement>(".journey-scene-fade");
  if (!el) {
    el = document.createElement("div");
    el.className = "journey-scene-fade";
    el.setAttribute("aria-hidden", "true");
    host.appendChild(el);
  }
  el.replaceChildren();
  return el;
}

/** 이미 검은 화면으로 시작 — 첫 입장 */
export function fadeHold(host: HTMLElement): void {
  const el = ensureFade(host);
  el.classList.add("on", "held");
}

/** 게임 화면 페이드 아웃 */
export async function fadeOut(host: HTMLElement): Promise<void> {
  const el = ensureFade(host);
  el.classList.remove("held");
  el.classList.add("on");
  void el.offsetWidth;
  await wait(FADE_MS);
}

/** 맵·나무 준비된 뒤 페이드 인 */
export async function fadeIn(host: HTMLElement): Promise<void> {
  const el = host.querySelector<HTMLElement>(".journey-scene-fade");
  if (!el) return;
  el.classList.remove("held");
  void el.offsetWidth;
  el.classList.remove("on");
  await wait(FADE_MS);
}

export const shutterHold = fadeHold;
export const shutterClose = fadeOut;
export const shutterOpen = fadeIn;
