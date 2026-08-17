/**
 * FPS 방위 띠 — 화면 상단 가운데.
 *
 * 맵은 북쪽 고정, 이 띠만 시선을 따라 미끄러진다.
 * yaw 0 = 북. 눈금 한 칸이 15°, N/E/S/W 가 큰 글씨다.
 * 드러난 노드는 방위 위에 아이콘으로 올라와 어디를 보면 닿는지 알려 준다.
 */
export interface CompassMark {
  bearing: number;
  icon: string;
  label?: string;
  kind?: string;
}

const PX_PER_DEG = 2.4;

export class CompassHud {
  readonly el: HTMLElement;
  private tape: HTMLElement;
  private marksEl: HTMLElement;
  private yaw = 0;

  constructor(host: HTMLElement) {
    this.el = document.createElement("div");
    this.el.className = "fps-compass";
    this.el.setAttribute("aria-hidden", "true");
    this.el.innerHTML = `
      <div class="fps-compass-window">
        <div class="fps-compass-tape"></div>
        <div class="fps-compass-marks"></div>
      </div>
      <div class="fps-compass-needle"></div>
    `;
    this.tape = this.el.querySelector(".fps-compass-tape")!;
    this.marksEl = this.el.querySelector(".fps-compass-marks")!;
    this.tape.innerHTML = buildTape();
    host.appendChild(this.el);
    this.setYaw(0);
  }

  setYaw(deg: number): void {
    this.yaw = ((deg % 360) + 360) % 360;
    // 띠를 세 바퀴 이어 붙여 끊김 없이 돌린다. 가운데 칸이 현재 시선.
    const x = -(this.yaw + 360) * PX_PER_DEG;
    this.tape.style.transform = `translateX(${x}px)`;
    this.marksEl.style.transform = `translateX(${x}px)`;
  }

  setMarks(marks: CompassMark[]): void {
    // 눈금 띠와 같이 세 바퀴를 그려 0°/360°에서 끊기지 않게 한다
    this.marksEl.innerHTML = marks
      .flatMap((m) => {
        const b = ((m.bearing % 360) + 360) % 360;
        return [-360, 0, 360].map((base) => {
          const left = (b + base + 360) * PX_PER_DEG;
          return `<span class="fps-compass-poi${m.kind ? ` ${m.kind}` : ""}" style="left:${left}px">${m.icon}${m.label ? `<b>${m.label}</b>` : ""}</span>`;
        });
      })
      .join("");
  }

  dispose(): void {
    this.el.remove();
  }
}

function buildTape(): string {
  // -360 · 0 · +360 세 구간. 같은 눈금을 반복해 360에서 0으로 넘어갈 때 점프가 없다.
  const chunks: string[] = [];
  for (const base of [-360, 0, 360]) {
    for (let d = 0; d < 360; d += 15) {
      const deg = base + d;
      const abs = ((d % 360) + 360) % 360;
      const label = abs === 0 ? "N" : abs === 90 ? "E" : abs === 180 ? "S" : abs === 270 ? "W" : "";
      const major = label !== "";
      const left = (deg + 360) * PX_PER_DEG;
      chunks.push(
        `<span class="fps-compass-tick${major ? " major" : ""}" style="left:${left}px">` +
          `<i></i>${label ? `<b>${label}</b>` : ""}</span>`,
      );
    }
  }
  return chunks.join("");
}

/** 플레이어 → 목표의 방위(도). 0=북, 시계방향. 탑뷰 % 좌표와 같은 축 */
export function bearingDeg(fromX: number, fromY: number, toX: number, toY: number): number {
  const dx = toX - fromX;
  const dy = toY - fromY;
  // y_pct 가 커질수록 남쪽. 북 = -Y.
  const rad = Math.atan2(dx, -dy);
  return ((rad * 180) / Math.PI + 360) % 360;
}
