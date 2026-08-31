/**
 * 정화 전투 루프 HUD
 * - 중앙: 정화 시도 캐스팅 게이지
 * - 지도 밑: 시간·남은 적 (50% 크기)
 */
export interface CombatPurifyHudState {
  phaseLabel: string;
  ammo: number;
  castPct?: number;
  pollutionPct?: number;
  shrinkLeftSec?: number;
  stopLeft?: number;
  stopMax?: number;
  stopDir?: string;
  bugsAlive?: number;
  bugsTotal?: number;
  culpritHp?: number;
  culpritMax?: number;
  urgency: 0 | 1 | 2;
  showCast?: boolean;
  showPollute?: boolean;
  showCombat?: boolean;
}

export class CombatPurifyHud {
  readonly el: HTMLElement;
  private castPanel: HTMLElement;
  private dockPanel: HTMLElement;
  private castRow: HTMLElement;
  private polluteRow: HTMLElement;
  private combatRow: HTMLElement;
  private castFill: HTMLElement;
  private polluteFill: HTMLElement;
  private combatFill: HTMLElement;
  private castVal: HTMLElement;
  private polluteClock: HTMLElement;
  private polluteWarn: HTMLElement;
  private combatLabel: HTMLElement;
  private combatVal: HTMLElement;
  private phaseEl: HTMLElement;
  private dockPhaseEl: HTMLElement;
  private prevCombatKey = "";

  constructor(host: HTMLElement) {
    this.el = document.createElement("div");
    this.el.className = "combat-purify-hud";
    this.el.innerHTML = `
      <div class="cph-cast-center" data-cast-panel>
        <div class="cph-row" data-row="cast" hidden>
          <div class="cph-label"><span>정화 시도</span><span data-cast-val>0%</span></div>
          <div class="cph-bar cast"><i data-cast-fill></i></div>
        </div>
      </div>
      <div class="cph-map-dock" data-dock-panel>
        <div class="cph-phase" data-phase>—</div>
        <div class="cph-phase cph-dock-phase" data-dock-phase>—</div>
        <div class="cph-row cph-timer-row" data-row="pollute" hidden>
          <div class="cph-timer-head">
            <span class="cph-timer-tag">남은 시간</span>
            <span class="cph-timer-clock" data-pollute-clock>0:00</span>
            <span class="cph-timer-warn" data-pollute-warn hidden></span>
          </div>
          <div class="cph-bar pollute"><i data-pollute-fill></i></div>
        </div>
        <div class="cph-row" data-row="combat" hidden>
          <div class="cph-label"><span data-combat-label>남은 적</span><span data-combat-val>0/0</span></div>
          <div class="cph-bar combat"><i data-combat-fill></i></div>
        </div>
      </div>
    `;
    host.appendChild(this.el);
    this.castPanel = this.el.querySelector("[data-cast-panel]")!;
    this.dockPanel = this.el.querySelector("[data-dock-panel]")!;
    this.castRow = this.el.querySelector('[data-row="cast"]')!;
    this.polluteRow = this.el.querySelector('[data-row="pollute"]')!;
    this.combatRow = this.el.querySelector('[data-row="combat"]')!;
    this.castFill = this.el.querySelector("[data-cast-fill]")!;
    this.polluteFill = this.el.querySelector("[data-pollute-fill]")!;
    this.combatFill = this.el.querySelector("[data-combat-fill]")!;
    this.castVal = this.el.querySelector("[data-cast-val]")!;
    this.polluteClock = this.el.querySelector("[data-pollute-clock]")!;
    this.polluteWarn = this.el.querySelector("[data-pollute-warn]")!;
    this.combatLabel = this.el.querySelector("[data-combat-label]")!;
    this.combatVal = this.el.querySelector("[data-combat-val]")!;
    this.phaseEl = this.el.querySelector("[data-phase]")!;
    this.dockPhaseEl = this.el.querySelector("[data-dock-phase]")!;
  }

  apply(h: CombatPurifyHudState): void {
    this.phaseEl.textContent = h.phaseLabel;
    this.dockPhaseEl.textContent = h.phaseLabel;
    this.el.classList.toggle("urgent", h.urgency === 1);
    this.el.classList.toggle("critical", h.urgency === 2);
    const live = !!(h.showCast || h.showPollute || h.showCombat);
    this.el.classList.toggle("live", live);
    this.castPanel.classList.toggle("on", !!h.showCast);
    this.dockPanel.classList.toggle("on", !!(h.showPollute || h.showCombat));

    this.castRow.hidden = !h.showCast;
    this.polluteRow.hidden = !h.showPollute;
    this.combatRow.hidden = !h.showCombat;

    if (h.showCast) {
      const p = h.castPct ?? 0;
      this.castVal.textContent = `${Math.round(p * 100)}%`;
      this.castFill.style.transform = `scaleX(${p})`;
    }
    if (h.showPollute) {
      const left = Math.max(0, h.shrinkLeftSec ?? 0);
      const m = Math.floor(left / 60);
      const s = Math.floor(left % 60);
      this.polluteClock.textContent = `${m}:${String(s).padStart(2, "0")}`;
      const remain = Math.max(0, Math.min(1, 1 - (h.pollutionPct ?? 0)));
      this.polluteFill.style.transform = `scaleX(${remain})`;
      if (h.urgency === 2) {
        this.polluteWarn.hidden = false;
        this.polluteWarn.textContent = "위험!";
      } else if (h.urgency === 1) {
        this.polluteWarn.hidden = false;
        this.polluteWarn.textContent = "서둘러";
      } else {
        this.polluteWarn.hidden = true;
        this.polluteWarn.textContent = "";
      }
    }
    if (h.showCombat) {
      let key = "";
      if (h.culpritMax != null) {
        // 리젠이 소수로 쌓여도 UI는 정수만 (0.xxx 로 레이아웃 깨짐 방지)
        const hp = Math.max(0, Math.floor((h.culpritHp ?? 0) + 1e-6));
        const max = Math.max(1, Math.round(h.culpritMax));
        this.combatLabel.textContent = "원흉 HP";
        this.combatVal.textContent = `${hp} / ${max}`;
        this.combatFill.style.transform = `scaleX(${Math.min(1, hp / max)})`;
        key = `c:${hp}/${max}`;
      } else if (h.bugsTotal != null) {
        this.combatLabel.textContent = h.phaseLabel.includes("얼룩")
          ? "남은 얼룩"
          : h.phaseLabel.includes("오염")
            ? "남은 오염"
            : "남은 적";
        this.combatVal.textContent = `${h.bugsAlive ?? 0} / ${h.bugsTotal}`;
        this.combatFill.style.transform = `scaleX(${h.bugsTotal ? (h.bugsAlive ?? 0) / h.bugsTotal : 0})`;
        key = `b:${h.bugsAlive}/${h.bugsTotal}`;
      } else {
        this.combatLabel.textContent = `${h.stopDir ?? ""} 멈춤`.trim();
        this.combatVal.textContent = `${h.stopLeft ?? 0} / ${h.stopMax ?? 0}`;
        this.combatFill.style.transform = `scaleX(${h.stopMax ? (h.stopLeft ?? 0) / h.stopMax : 0})`;
        key = `s:${h.stopLeft}/${h.stopMax}`;
      }
      // 카운트가 줄 때 줄어드는 피드백
      if (this.prevCombatKey && this.prevCombatKey !== key) {
        this.combatRow.classList.remove("cph-tick");
        void this.combatRow.offsetWidth;
        this.combatRow.classList.add("cph-tick");
      }
      this.prevCombatKey = key;
    } else {
      this.prevCombatKey = "";
    }
  }

  dispose(): void {
    this.el.remove();
  }
}
