/**
 * 앱 씬 매니저 — 한 번에 하나의 화면만 보이게 한다.
 * 이전 화면이 페이드로 비치는 플리커를 막기 위해,
 * 전환은 opacity 크로스페이드가 아니라 data-scene 배타 표시로 처리한다.
 */
import { playLog } from "./dev/playLog";

export type AppScene = "boot" | "intro" | "cutscene" | "lobby" | "journey";

let phoneEl: HTMLElement | null = null;
let current: AppScene = "boot";

export function bindSceneHost(phone: HTMLElement) {
  phoneEl = phone;
  phoneEl.dataset.scene = current;
}

export function getAppScene(): AppScene {
  return current;
}

/** 배타 씬 전환 — 이전 씬은 CSS로 완전 숨김(아래가 비치지 않음) */
export function setAppScene(next: AppScene) {
  if (!phoneEl) {
    phoneEl = document.getElementById("phoneRoot");
  }
  if (current !== next) playLog("SCENE", next);
  current = next;
  if (phoneEl) phoneEl.dataset.scene = next;
  if (next !== "journey") {
    document.getElementById("dayRoadmap")?.classList.remove("roadmap-suppressed");
    document.getElementById("activityToast")?.classList.remove("show");
  }
}
