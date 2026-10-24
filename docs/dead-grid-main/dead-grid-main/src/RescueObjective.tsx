import { HeartPulse, Heart } from "lucide-react";
import type { Game } from "./engine";
import { rescueSecondsRemaining } from "./rescue";
export default function RescueObjective({ game }: { game: Game }) {
  const survivor = game.survivors.find((s) => s.state === "wounded");
  if (!survivor)
    return (
      <div className="rescue-objective rescue-idle">
        <Heart size={16} />
        <span>구출 {game.rescued}명</span>
      </div>
    );
  const distance = Math.round(
    Math.hypot(survivor.x - game.player.x, survivor.z - game.player.z),
  );
  const seconds = rescueSecondsRemaining(survivor);
  return (
    <section
      className={`rescue-objective ${survivor.healing ? "is-healing" : survivor.hp < 20 ? "is-urgent" : ""}`}
      aria-label="생존자 구조 목표"
    >
      <div>
        <HeartPulse size={18} />
        <b>{survivor.healing ? "치료 중" : "구조 신호"}</b>
        <span>{distance}m</span>
      </div>
      <div
        className="rescue-health"
        role="progressbar"
        aria-label="부상 생존자 체력"
        aria-valuenow={Math.round(survivor.hp)}
        aria-valuemin={0}
        aria-valuemax={survivor.maxHp}
      >
        <i style={{ transform: `scaleX(${survivor.hp / survivor.maxHp})` }} />
      </div>
      <p>
        {Math.ceil(survivor.hp)}% ·{" "}
        {survivor.healing ? `구출까지 ${seconds}초` : `출혈 ${seconds}초`}
      </p>
      <small>
        {survivor.healing ? "범위 안에 머무르세요" : "3m 이내 접근해 치료"}
      </small>
    </section>
  );
}
