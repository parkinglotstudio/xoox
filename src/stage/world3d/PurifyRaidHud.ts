/**
 * 본편 정화 습격 HUD — 상태·탄약만 보여 준다.
 * 발사는 자동(PurifyRaid.auto). 놀이터 원형 버튼·홀드는 쓰지 않는다.
 */
import type { RaidHud, RaidPhase } from "./PurifyRaid";

export class PurifyRaidHud {
  readonly el: HTMLElement;
  private banner: HTMLElement;
  private wave: HTMLElement;
  private teal: HTMLElement;
  private core: HTMLElement;
  private meter: HTMLElement;
  private ammoEl: HTMLElement | null = null;

  constructor(host: HTMLElement) {
    this.el = document.createElement("div");
    this.el.className = "raid-overlay in-game";
    this.el.innerHTML = `
      <div class="raid-core-meter" title="거점"><i></i></div>
      <div class="raid-banner" hidden></div>
      <div class="raid-status">
        <span class="raid-wave">대기</span>
        <span class="raid-teal">청록 0%</span>
        <span class="raid-core">거점 0%</span>
      </div>
    `;
    this.banner = this.el.querySelector(".raid-banner")!;
    this.wave = this.el.querySelector(".raid-wave")!;
    this.teal = this.el.querySelector(".raid-teal")!;
    this.core = this.el.querySelector(".raid-core")!;
    this.meter = this.el.querySelector(".raid-core-meter i")!;
    host.appendChild(this.el);
  }

  /** 메인 버튼 탄약 게이지만 연결한다 */
  attachAmmoEl(el: HTMLElement | null): void {
    this.ammoEl = el;
  }

  apply(h: RaidHud): void {
    if (h.phase === "warn") this.wave.textContent = `예고 ${h.warnLeft.toFixed(1)}초`;
    else if (h.phase === "fight") this.wave.textContent = `파 ${h.wave}/${h.waves} · ${h.alive}기`;
    else if (h.phase === "won") this.wave.textContent = "정화 성공";
    else if (h.phase === "lost") this.wave.textContent = "거점이 잠겼다";
    else this.wave.textContent = "대기";
    this.teal.textContent = `청록 ${Math.round(h.tealPct)}%`;
    this.core.textContent = `거점 ${Math.round(h.core * 100)}%`;
    this.meter.style.width = `${Math.round(h.core * 100)}%`;
    this.el.classList.toggle("danger", h.core >= 0.55 && h.phase === "fight");
    this.el.classList.toggle("warn-phase", h.phase === "warn");
    if (this.ammoEl) {
      this.ammoEl.style.setProperty("--raid-ammo", `${Math.round(h.ammo * 100)}%`);
      this.ammoEl.classList.toggle("raid-ammo-low", h.ammo < 0.22);
      this.ammoEl.classList.toggle("on", h.firing);
    }
  }

  showPhase(phase: RaidPhase): void {
    this.banner.hidden = phase !== "warn" && phase !== "won" && phase !== "lost";
    this.banner.classList.remove("warn", "won", "lost");
    if (phase === "warn") {
      this.banner.textContent = "오염이 온다";
      this.banner.classList.add("warn");
      this.banner.hidden = false;
    } else if (phase === "won") {
      this.banner.textContent = "정화 성공";
      this.banner.classList.add("won");
      this.banner.hidden = false;
    } else if (phase === "lost") {
      this.banner.textContent = "거점이 잠겼다";
      this.banner.classList.add("lost");
      this.banner.hidden = false;
    }
  }

  dispose(): void {
    this.ammoEl?.classList.remove("on", "raid-ammo-low");
    this.ammoEl?.style.removeProperty("--raid-ammo");
    this.el.remove();
  }
}
