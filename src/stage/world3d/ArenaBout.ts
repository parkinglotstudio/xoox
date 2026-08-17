/**
 * 제자리 경쟁 미니게임 — 3D 뷰 **안에서** 진행된다.
 *
 * 지시자 확정 두 가지가 설계를 결정한다.
 * 1. 전투를 별도 화면으로 띄우지 않는다. 서 있던 자리에서 그대로 겨룬다.
 * 2. 상대는 한 종류가 아니다. CLOCK·BLIGHT를 번갈아 주고 SCAVENGER를 간혹 섞는다.
 *    그래서 상대 종류는 arena_config.csv가 정하고 여기는 규칙만 실행한다.
 *
 * 공통 규칙: 목표 수(goal)를 **상대보다 먼저** 채우면 승리.
 * - CLOCK      상대 게이지 = 남은 시간. 시간이 다하면 패배.
 * - BLIGHT     상대 게이지 = 퍼지는 오염. 오염이 먼저 차면 패배.
 * - SCAVENGER  상대 게이지 = 라이벌의 수집량. 라이벌이 먼저 채우면 패배(자원을 빼앗긴다).
 *
 * 애니메이션은 이 파일이 소유한 setInterval 하나로 돈다.
 * (프로젝트 원칙의 rAF 금지를 지킨다 — 게이지는 DOM이다)
 */
import type { ArenaDef } from "../../types";

export interface ArenaResult {
  won: boolean;
  /** 플레이어가 모은 수 */
  score: number;
  /** 상대 진행도 0..1 */
  rivalProgress: number;
  /** 사용자가 도중에 물러났는지 */
  gaveUp: boolean;
}

const TICK_MS = 50;
/** 한 번 입력에 채워지는 양 — 목표 대비 1칸 */
const HIT_PER_INPUT = 1;
/** 연타 방지 — 이보다 빠른 입력은 무시한다(버튼 뭉개기로 이기는 걸 막는다) */
const INPUT_COOLDOWN_MS = 110;

const KIND_TONE: Record<string, { accent: string; rivalName: string }> = {
  CLOCK: { accent: "#ffd27a", rivalName: "남은 시간" },
  BLIGHT: { accent: "#a98bff", rivalName: "오염 확산" },
  SCAVENGER: { accent: "#ff8b6b", rivalName: "라이벌" },
};

/**
 * 한 판을 띄우고 끝날 때까지 기다린다.
 *
 * @param host 3D 레이어(stage3d-layer) — 오버레이가 무대 안에 머물러야 "제자리"가 된다
 */
export function runArenaBout(host: HTMLElement, arena: ArenaDef): Promise<ArenaResult> {
  return new Promise<ArenaResult>((resolve) => {
    const tone = KIND_TONE[arena.rival_kind] ?? KIND_TONE.CLOCK!;
    const goal = Math.max(1, arena.goal);

    const root = document.createElement("div");
    root.className = `arena-bout kind-${arena.rival_kind.toLowerCase()}`;
    root.style.setProperty("--arena-accent", tone.accent);
    root.innerHTML = `
      <div class="arena-rival">
        <span class="arena-rival-icon">${arena.rival_icon}</span>
        <span class="arena-rival-label">${arena.rival_label || tone.rivalName}</span>
      </div>
      <div class="arena-bars">
        <div class="arena-row arena-row-rival">
          <span class="arena-row-name">${arena.rival_label || tone.rivalName}</span>
          <div class="arena-track"><div class="arena-fill arena-fill-rival"></div></div>
        </div>
        <div class="arena-row arena-row-me">
          <span class="arena-row-name">나</span>
          <div class="arena-track"><div class="arena-fill arena-fill-me"></div></div>
          <span class="arena-count">0/${goal}</span>
        </div>
      </div>
      <button type="button" class="arena-act">모으기 <b>SPACE</b></button>
      <button type="button" class="arena-give-up">물러난다</button>
    `;
    host.appendChild(root);

    const fillMe = root.querySelector<HTMLElement>(".arena-fill-me")!;
    const fillRival = root.querySelector<HTMLElement>(".arena-fill-rival")!;
    const countEl = root.querySelector<HTMLElement>(".arena-count")!;
    const actBtn = root.querySelector<HTMLButtonElement>(".arena-act")!;
    const giveUpBtn = root.querySelector<HTMLButtonElement>(".arena-give-up")!;

    let score = 0;
    let rival = 0;
    let lastInput = 0;
    let done = false;
    let timer = 0;

    /** 상대가 초당 채우는 비율 — CLOCK은 제한시간에서 역산한다 */
    const rivalRate =
      arena.rival_kind === "CLOCK"
        ? arena.duration_sec > 0
          ? 1 / arena.duration_sec
          : 1 / 15
        : Math.max(0.01, arena.rival_speed) / goal;

    const paint = () => {
      fillMe.style.width = `${Math.min(100, (score / goal) * 100)}%`;
      fillRival.style.width = `${Math.min(100, rival * 100)}%`;
      countEl.textContent = `${score}/${goal}`;
    };

    const finish = (won: boolean, gaveUp = false) => {
      if (done) return;
      done = true;
      window.clearInterval(timer);
      window.removeEventListener("keydown", onKey);
      root.classList.add(won ? "won" : "lost");
      // 결과를 0.5초 보여준 뒤 걷는다 — 즉시 사라지면 이겼는지 알 수 없다
      window.setTimeout(() => {
        root.remove();
        resolve({ won, score, rivalProgress: rival, gaveUp });
      }, 520);
    };

    const hit = () => {
      if (done) return;
      const now = performance.now();
      if (now - lastInput < INPUT_COOLDOWN_MS) return;
      lastInput = now;
      score = Math.min(goal, score + HIT_PER_INPUT);
      actBtn.classList.remove("pulse");
      // 클래스를 다시 붙여 애니메이션을 재시작한다
      void actBtn.offsetWidth;
      actBtn.classList.add("pulse");
      paint();
      if (score >= goal) finish(true);
    };

    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        hit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        finish(false, true);
      }
    };

    actBtn.addEventListener("click", hit);
    giveUpBtn.addEventListener("click", () => finish(false, true));
    window.addEventListener("keydown", onKey);

    paint();
    timer = window.setInterval(() => {
      if (done) return;
      rival = Math.min(1, rival + rivalRate * (TICK_MS / 1000));
      paint();
      if (rival >= 1) finish(false);
    }, TICK_MS);
  });
}
