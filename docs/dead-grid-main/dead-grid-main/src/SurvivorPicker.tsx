import {
  X,
  ArrowRight,
  Check,
  Heart,
  Footprints,
  Crosshair,
} from "lucide-react";
import { CHARACTERS, WEAPONS } from "./engine";
const dossiers = [
  {
    story:
      "정찰대를 이끌던 강하나는 도시의 모든 탈출로를 기억합니다. 빠른 발과 침착한 사격으로 포위망의 빈틈을 찾습니다.",
    tactic:
      "빠르게 경험치를 회수하고, 마우스로 퇴로의 적을 조준하세요. 카타나와 저격총으로 위험한 적을 먼저 제거하는 기동 전투에 적합합니다.",
  },
  {
    story:
      "공병 박도윤은 무너지는 검역선을 끝까지 지켰습니다. 버려진 장비와 연료로 감염체가 몰려오는 길목을 막습니다.",
    tactic:
      "화염병을 조준한 길목에 던져 접근을 차단하세요. 화염방사기로 연소를 중첩하면 무리를 동시에 제압할 수 있습니다.",
  },
  {
    story:
      "의무병 서유진은 마지막 대피 행렬과 함께 도시로 돌아왔습니다. 냉각 장비와 회복 기술로 동료들의 생존 시간을 벌어줍니다.",
    tactic:
      "냉각 펄스로 접근을 늦추고 회복할 틈을 만드세요. 사거리와 경험치 강화를 곁들여 안정적으로 성장할 수 있습니다.",
  },
];
export default function SurvivorPicker({
  selected,
  onSelect,
  onStart,
  onClose,
}: {
  selected: number;
  onSelect: (i: number) => void;
  onStart: () => void;
  onClose: () => void;
}) {
  const c = CHARACTERS[selected],
    dossier = dossiers[selected];
  const portrait = (index: number) => ({
    backgroundPosition: `${index * 50}% 15%`,
  });
  return (
    <div className="overlay survivor-overlay">
      <section
        className="survivor-picker"
        role="dialog"
        aria-modal="true"
        aria-labelledby="picker-title"
      >
        <header className="picker-heading">
          <h2 id="picker-title">생존자를 선택하세요.</h2>
          <p>각자의 방식으로, 같은 도시에서 살아남습니다.</p>
        </header>
        <div className="picker-body">
          <div className="survivor-grid" aria-label="생존자 목록">
            {CHARACTERS.map((candidate, i) => (
              <button
                key={candidate.id}
                className={`survivor-card ${selected === i ? "selected" : ""}`}
                aria-pressed={selected === i}
                onClick={() => onSelect(i)}
                aria-label={`${candidate.name} · ${candidate.role} 선택`}
              >
                <span
                  className="survivor-thumb portrait-atlas"
                  style={portrait(i)}
                  aria-hidden="true"
                />
                <span className="survivor-card-copy">
                  <small>{candidate.role}</small>
                  <strong>{candidate.name}</strong>
                  <span>{WEAPONS[candidate.weapon].name}</span>
                </span>
                {selected === i && (
                  <Check
                    size={20}
                    className="survivor-check"
                    aria-hidden="true"
                  />
                )}
              </button>
            ))}
          </div>
          <article
            className="survivor-detail"
            aria-live="polite"
            aria-atomic="true"
          >
            <div
              className="survivor-portrait portrait-atlas"
              style={portrait(selected)}
              role="img"
              aria-label={`${c.name}, ${c.role}의 복셀 일러스트`}
            />
            <div className="survivor-dossier">
              <h3>
                {c.name}
                <span>{c.role}</span>
              </h3>
              <p>{dossier.story}</p>
              <dl className="survivor-stats">
                <div>
                  <dt>
                    <Heart size={16} />
                    기본 체력
                  </dt>
                  <dd>{c.hp}</dd>
                </div>
                <div>
                  <dt>
                    <Footprints size={16} />
                    이동 속도
                  </dt>
                  <dd>
                    {c.speed.toFixed(1)}
                    <small> m/s</small>
                  </dd>
                </div>
              </dl>
              <div className="survivor-trait">
                <b>고유 특성</b>
                <span>{c.perk}</span>
              </div>
              <div className="survivor-loadout">
                <b>
                  <Crosshair size={16} />
                  시작 무기 · {WEAPONS[c.weapon].name}
                </b>
                <p>{WEAPONS[c.weapon].desc}</p>
              </div>
              <p className="survivor-tactic">{dossier.tactic}</p>
            </div>
          </article>
        </div>
        <footer className="picker-footer">
          <span>30분 작전 · 보스 6명 격파</span>
          <button className="primary" onClick={onStart}>
            {c.name} · 출격 <ArrowRight size={20} />
          </button>
        </footer>
        <button
          className="close-button icon-button"
          onClick={onClose}
          aria-label="생존자 선택 닫기"
        >
          <X size={22} />
        </button>
      </section>
    </div>
  );
}
