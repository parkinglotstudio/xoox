function randomHangul(): string {
  const code = 0xac00 + Math.floor(Math.random() * (0xd7a3 - 0xac00));
  return String.fromCharCode(code);
}

export function scrambleReveal(el: HTMLElement, finalText: string, durationMs = 650): Promise<void> {
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
        el.textContent = finalText;
        resolve();
      }
    }, stepMs);
  });
}

export interface BannerCandidate {
  name: string;
  color: string;
}

/**
 * 슬롯머신형 등급 배너. `sequence`의 마지막 항목이 최종 결과이고,
 * 마지막 바로 앞 항목이 있으면 그걸 먼저 "근접 정착"시켰다가 최종으로 넘어가는
 * 니어미스 연출을 재현한다. 총 재생시간은 대략 totalMs.
 */
export function rollBanner(el: HTMLElement, sequence: BannerCandidate[], totalMs = 2800): Promise<void> {
  return new Promise((resolve) => {
    const final = sequence[sequence.length - 1];
    const nearMiss = sequence.length > 1 ? sequence[sequence.length - 2] : null;
    const paint = (pick: BannerCandidate, glow: boolean) => {
      el.textContent = pick.name;
      el.style.color = pick.color;
      el.style.textShadow = glow ? `0 0 28px ${pick.color}` : `0 0 14px ${pick.color}`;
    };

    const spinMs = Math.round(totalMs * 0.6);
    const nearMissMs = nearMiss ? Math.round(totalMs * 0.24) : 0;
    const lockMs = Math.max(200, totalMs - spinMs - nearMissMs);

    const start = Date.now();
    const spinTimer = window.setInterval(() => {
      const elapsed = Date.now() - start;
      if (elapsed >= spinMs) {
        window.clearInterval(spinTimer);
        if (nearMiss) {
          paint(nearMiss, true);
          window.setTimeout(() => {
            paint(final, true);
            window.setTimeout(resolve, lockMs);
          }, nearMissMs);
        } else {
          paint(final, true);
          window.setTimeout(resolve, lockMs);
        }
        return;
      }
      const stepInterval = 55 + (elapsed / spinMs) * 160;
      const pick = sequence[Math.floor(elapsed / stepInterval) % sequence.length];
      paint(pick, false);
    }, 45);
  });
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
