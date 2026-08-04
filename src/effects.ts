function randomHangul(): string {
  const code = 0xac00 + Math.floor(Math.random() * (0xd7a3 - 0xac00));
  return String.fromCharCode(code);
}

export function scrambleReveal(
  el: HTMLElement,
  finalText: string,
  durationMs = 650,
  toHtml?: (plain: string) => string
): Promise<void> {
  return new Promise((resolve) => {
    const chars = Array.from(finalText);
    const start = Date.now();
    const stepMs = 40;
    const timer = window.setInterval(() => {
      const progress = Math.min(1, (Date.now() - start) / durationMs);
      const lockedCount = Math.floor(progress * chars.length);
      let out = "";
      for (let i = 0; i < chars.length; i++) {
        if (chars[i] === " " || chars[i] === "\n") {
          out += chars[i];
        } else if (i < lockedCount) {
          out += chars[i];
        } else {
          out += randomHangul();
        }
      }
      el.textContent = out;
      if (progress >= 1) {
        window.clearInterval(timer);
        if (toHtml) el.innerHTML = toHtml(finalText);
        else el.textContent = finalText;
        resolve();
      }
    }, stepMs);
  });
}

export interface BannerCandidate {
  name: string;
  color: string;
  cssKey?: string;
}

/**
 * 슬롯머신형 등급 배너. 니어미스 후 최종 확정 시 글로우 강화.
 */
export function rollBanner(el: HTMLElement, sequence: BannerCandidate[], totalMs = 2800): Promise<void> {
  return new Promise((resolve) => {
    const final = sequence[sequence.length - 1];
    const nearMiss = sequence.length > 1 ? sequence[sequence.length - 2] : null;
    el.classList.remove("banner-lock", "banner-mid", "banner-jackpot", "banner-bad", "banner-bonus");
    const paint = (pick: BannerCandidate, glow: boolean) => {
      el.textContent = pick.name;
      el.style.color = pick.color;
      el.style.textShadow = glow ? `0 0 36px ${pick.color}, 0 0 18px ${pick.color}` : `0 0 14px ${pick.color}`;
    };

    const spinMs = Math.round(totalMs * 0.55);
    const nearMissMs = nearMiss ? Math.round(totalMs * 0.22) : 0;
    const lockMs = Math.max(280, totalMs - spinMs - nearMissMs);

    const start = Date.now();
    const spinTimer = window.setInterval(() => {
      const elapsed = Date.now() - start;
      if (elapsed >= spinMs) {
        window.clearInterval(spinTimer);
        const finish = () => {
          paint(final, true);
          el.classList.add("banner-lock");
          const key = final.cssKey || "";
          if (key === "grade-mid") el.classList.add("banner-mid");
          else if (key === "grade-jp") el.classList.add("banner-jackpot");
          else if (key === "grade-bad") el.classList.add("banner-bad");
          else if (key === "grade-bonus") el.classList.add("banner-bonus");
          window.setTimeout(resolve, lockMs);
        };
        if (nearMiss) {
          paint(nearMiss, true);
          window.setTimeout(finish, nearMissMs);
        } else {
          finish();
        }
        return;
      }
      const stepInterval = 55 + (elapsed / spinMs) * 160;
      const pick = sequence[Math.floor(elapsed / stepInterval) % sequence.length];
      paint(pick, false);
    }, 45);
  });
}

/**
 * 로그 카드 본문용 세로 슬롯 (setInterval).
 * 후보 문구가 아래에서 위로 연속 스크롤 → 감속 정지 → 살짝 강조.
 * maskPadY: 마스크가 item보다 클 때 중앙 정렬용 (예: mask 66 / item 44 → 11)
 */
export function rollCardTextSlot(
  track: HTMLElement,
  candidates: string[],
  finalText: string,
  totalMs = 3000,
  itemHeight = 44,
  toHtml?: (plain: string) => string,
  maskPadY = 11
): Promise<void> {
  return new Promise((resolve) => {
    const pool = candidates.length > 0 ? candidates : [finalText];
    const spins = 22 + Math.floor(Math.random() * 10);
    const items: string[] = [];
    for (let i = 0; i < spins; i++) {
      items.push(pool[i % pool.length]);
    }
    items.push(finalText);

    const esc = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    track.innerHTML = items
      .map((t) => `<div class="card-slot-item" style="height:${itemHeight}px">${esc(t)}</div>`)
      .join("");
    track.style.transform = `translateY(${maskPadY}px)`;
    track.classList.add("card-slot-spinning");

    const finalIndex = items.length - 1;
    const startY = maskPadY;
    const endY = -(finalIndex * itemHeight) + maskPadY;
    const travel = startY - endY;
    const start = Date.now();
    const tickMs = 33;

    const timer = window.setInterval(() => {
      const elapsed = Date.now() - start;
      const t = Math.min(1, elapsed / totalMs);
      // 초반 빠르게 아래에서 위로 → 후반 감속 안착
      const eased = 1 - Math.pow(1 - t, 3.2);
      const y = startY - eased * travel;
      track.style.transform = `translateY(${y}px)`;

      if (t >= 1) {
        window.clearInterval(timer);
        track.style.transform = `translateY(${endY}px)`;
        track.classList.remove("card-slot-spinning");
        track.classList.add("card-slot-locked");
        const last = track.querySelector(".card-slot-item:last-child") as HTMLElement | null;
        if (last) {
          if (toHtml) last.innerHTML = toHtml(finalText);
          else last.textContent = finalText;
          last.classList.add("card-slot-lock-emphasize");
        }
        window.setTimeout(resolve, 360);
      }
    }, tickMs);
  });
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
