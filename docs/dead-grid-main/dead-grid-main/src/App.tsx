import {
  Component,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type PointerEvent,
} from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Crosshair,
  Disc3,
  Flame,
  Zap,
  Snowflake,
  Shield,
  Heart,
  Timer,
  Magnet,
  Footprints,
  Swords,
  Volume2,
  VolumeX,
  Settings2,
  BookOpen,
  X,
  Play,
  Pause,
  ChevronRight,
  Radio,
  Target,
  Package,
  Skull,
  Move,
  CornerUpLeft,
  Maximize,
  Trophy,
  RotateCcw,
  BatteryCharging,
  ScanLine,
  GraduationCap,
  Expand,
  Layers,
  CircleDashed,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import World from "./World";
import SurvivorPicker from "./SurvivorPicker";
import {
  RESEARCH,
  researchTotal,
  researchCost,
  purchaseResearch,
  type ResearchId,
} from "./research";
import Minimap from "./Minimap";
import RescueObjective from "./RescueObjective";
import { getSave, storeSave, recordRescue } from "./save";
import "./rescue.css";
import { AudioSystem } from "./audio";
import {
  Game,
  CHARACTERS,
  WEAPONS,
  PASSIVES,
  RARITIES,
  passiveGainDescription,
  type Rarity,
  STAGES,
  BOSSES,
  BOSS_SCHEDULE,
  timeText,
  type Input,
  type Weapon,
  type Passive,
} from "./engine";
const icons: Record<string, LucideIcon> = {
  katana: Swords,
  sniper: ScanLine,
  experience: GraduationCap,
  range: Expand,
  area: CircleDashed,
  multishot: Layers,
  pierce: ArrowRight,
  crosshair: Crosshair,
  shell: Target,
  disc: Disc3,
  flame: Flame,
  zap: Zap,
  snowflake: Snowflake,
  swords: Swords,
  timer: Timer,
  footprints: Footprints,
  magnet: Magnet,
  shield: Shield,
  heart: Heart,
};
function GearIcon({ id, size = 24 }: { id: string; size?: number }) {
  const meta = WEAPONS[id as Weapon] || PASSIVES[id as Passive],
    Icon = icons[meta?.icon] || Heart;
  return <Icon size={size} strokeWidth={1.5} />;
}
class GameBoundary extends Component<
  { children: ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    if (this.state.error)
      return (
        <div className="fallback">
          <h1>도시를 불러오지 못했습니다.</h1>
          <p>
            WebGL을 지원하는 브라우저에서 하드웨어 가속을 켜고 다시
            실행해주세요.
          </p>
          <button onClick={() => location.reload()}>다시 불러오기</button>
        </div>
      );
    return this.props.children;
  }
}
function TouchControls({ input }: { input: React.RefObject<Input> }) {
  const pad = useRef<HTMLDivElement>(null),
    [knob, setKnob] = useState({ x: 0, y: 0 }),
    pointer = useRef<number | null>(null);
  const drag = (e: PointerEvent) => {
    if (pointer.current !== e.pointerId || !pad.current) return;
    const r = pad.current.getBoundingClientRect(),
      x = e.clientX - r.left - r.width / 2,
      y = e.clientY - r.top - r.height / 2,
      d = Math.hypot(x, y),
      f = d > 40 ? 40 / d : 1;
    input.current.x = (x * f) / 40;
    input.current.y = (y * f) / 40;
    setKnob({ x: x * f, y: y * f });
  };
  const release = () => {
    pointer.current = null;
    input.current.x = 0;
    input.current.y = 0;
    setKnob({ x: 0, y: 0 });
  };
  return (
    <div className="touch-controls">
      <div
        className="stick"
        ref={pad}
        onPointerDown={(e) => {
          pointer.current = e.pointerId;
          e.currentTarget.setPointerCapture(e.pointerId);
          drag(e);
        }}
        onPointerMove={drag}
        onPointerUp={release}
        onPointerCancel={release}
      >
        <span style={{ transform: `translate(${knob.x}px,${knob.y}px)` }} />
        <Move size={22} />
      </div>
      <div className="touch-actions">
        <button
          aria-label="충격파"
          onPointerDown={() => (input.current.pulse = true)}
          onPointerCancel={() => (input.current.pulse = false)}
        >
          <Zap size={24} />
        </button>
        <button
          aria-label="회피"
          onPointerDown={() => (input.current.dash = true)}
          onPointerCancel={() => (input.current.dash = false)}
        >
          <Footprints size={24} />
        </button>
      </div>
    </div>
  );
}
export default function App({ ownedGame }: { ownedGame: Game }) {
  const gameRef = useRef<Game | null>(null);
  if (!gameRef.current) {
    gameRef.current = ownedGame;
    // Reproducible UI fixtures exist only in the development server.
    if (
      import.meta.env.DEV &&
      new URLSearchParams(location.search).get("qa") === "upgrade"
    ) {
      const g = gameRef.current;
      g.start(CHARACTERS[0], "normal");
      g.weapons = {
        pistol: 6,
        shotgun: 5,
        orbit: 4,
        molotov: 3,
        lightning: 3,
        frost: 2,
      };
      g.passives = {
        power: 3,
        haste: 2,
        armor: 2,
        vitality: 2,
        magnet: 2,
        boots: 2,
      };
      g.level = 22;
      g.time = 660;
      g.bossesSpawned = 2;
      g.addDrops({
        id: 88888,
        x: 0,
        z: 0,
        type: "xp",
        value: g.nextXp + 1,
        age: 0,
      });
      g.update(0.05, { x: 0, y: 0, dash: false, pulse: false });
    }
    if (
      import.meta.env.DEV &&
      new URLSearchParams(location.search).get("qa") === "final"
    ) {
      const g = gameRef.current;
      g.start(CHARACTERS[0], "normal");
      g.weapons = {};
      g.time = 1800;
      g.bossesSpawned = 6;
      g.bossKills = 5;
      for (let i = 0; i < 5; i++) g.defeatedBosses.add(i);
      g.spawnEnemy("boss", 4, 2, 5);
      g.invincible = 1e6;
      g.stage = 30;
      g.updateVision();
      g.announce("최종 보스 · 페이션트 제로 · 나선 탄막과 연속 폭격");
    }
  }
  if (
    import.meta.env.DEV &&
    !gameRef.current.runId &&
    new URLSearchParams(location.search).get("qa") === "rarity"
  ) {
    const g = gameRef.current;
    g.start(CHARACTERS[0], "normal");
    g.level = 9;
    g.time = 180;
    g.phase = "upgrade";
    g.choices = (["common", "uncommon", "rare"] as Rarity[]).map(
      (rarity, i) => {
        const id = (["pierce", "power", "vitality"] as Passive[])[i];
        return {
          id,
          rarity,
          title: PASSIVES[id].name,
          description:
            passiveGainDescription(id, rarity) +
            (id === "pierce" ? " · 총 10%" : ""),
          level: 1,
          evolution: false,
        };
      },
    );
  }
  if (
    import.meta.env.DEV &&
    !gameRef.current.runId &&
    new URLSearchParams(location.search).get("qa") === "arsenal"
  ) {
    const g = gameRef.current;
    g.start(CHARACTERS[0], "normal");
    g.weapons = { katana: 4, sniper: 4, flamethrower: 4 };
    g.nextXp = 1e6;
    g.invincible = 1e6;
    g.announce("마우스 조준 · 카타나 / 저격총 / 화염방사기");
  }
  if (
    import.meta.env.DEV &&
    !gameRef.current.runId &&
    new URLSearchParams(location.search).get("qa") === "growth"
  ) {
    const g = gameRef.current;
    g.start(CHARACTERS[0], "normal");
    g.weapons = { pistol: 3, molotov: 1, flamethrower: 1 };
    g.passives = { area: 1 };
    g.phase = "upgrade";
    g.choices = [
      {
        id: "pistol",
        title: WEAPONS.pistol.name,
        description: g.weaponUpgradeDescription("pistol", 4),
        level: 4,
        evolution: false,
      },
      {
        id: "area",
        title: PASSIVES.area.name,
        description: passiveGainDescription("area", "uncommon"),
        level: 2,
        evolution: false,
        rarity: "uncommon",
      },
      {
        id: "katana",
        title: WEAPONS.katana.name,
        description: WEAPONS.katana.desc,
        level: 1,
        evolution: false,
      },
    ];
    g.invincible = 1e6;
    g.nextXp = 1e6;
  }
  const game = gameRef.current;
  useEffect(() => {
    game.retain();
    return () => game.release();
  }, [game]);
  const audioRef = useRef<AudioSystem | null>(null);
  if (!audioRef.current) audioRef.current = new AudioSystem();
  const audio = audioRef.current;
  const input = useRef<Input>({ x: 0, y: 0, dash: false, pulse: false });
  const keys = useRef(new Set<string>());
  const [, tick] = useState(0);
  const [selected, setSelected] = useState(0),
    [difficulty, setDifficulty] = useState<"normal" | "relaxed">("normal"),
    [modal, setModal] = useState<
      "guide" | "settings" | "research" | "survivors" | null
    >(null),
    [muted, setMuted] = useState(false),
    [quality, setQuality] = useState<"high" | "low">("high"),
    [reduced, setReduced] = useState(
      () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    ),
    [save, setSave] = useState(getSave),
    [tab, setTab] = useState<"basics" | "weapons" | "timeline">("basics");
  const resultSaved = useRef(false),
    phase = game.phase;
  useEffect(() => {
    const timer = window.setInterval(() => tick((n) => n + 1), 100);
    return () => clearInterval(timer);
  }, []);
  const resetInput = () => {
    keys.current.clear();
    input.current = { x: 0, y: 0, dash: false, pulse: false };
  };
  const start = () => {
    audio.unlock();
    resetInput();
    resultSaved.current = false;
    setModal(null);
    game.start(CHARACTERS[selected], difficulty, save.researches);
    tick((n) => n + 1);
  };
  const home = () => {
    resetInput();
    game.phase = "menu";
    game.player = { x: 0, z: 0 };
    game.time = 0;
    game.weapons = { [CHARACTERS[selected].weapon]: 1 };
    game.bullets = [];
    game.effects = [];
    game.aim = undefined;
    game.enemyBurns.clear();
    game.structureBurns.clear();
    game.survivors = [];
    game.preview();
    setModal(null);
    tick((n) => n + 1);
  };
  const pause = () => {
    resetInput();
    if (game.phase === "playing") game.phase = "paused";
    else if (game.phase === "paused") game.phase = "playing";
    tick((n) => n + 1);
  };
  const openModal = (m: "guide" | "settings" | "research" | "survivors") => {
    if (game.phase === "playing") game.phase = "paused";
    resetInput();
    setModal(m);
  };
  const toggleSound = () => {
    audio.unlock();
    audio.setMuted(!muted);
    setMuted(!muted);
  };
  useEffect(() => {
    const sync = () => {
      input.current.x =
        (keys.current.has("KeyD") || keys.current.has("ArrowRight") ? 1 : 0) -
        (keys.current.has("KeyA") || keys.current.has("ArrowLeft") ? 1 : 0);
      input.current.y =
        (keys.current.has("KeyS") || keys.current.has("ArrowDown") ? 1 : 0) -
        (keys.current.has("KeyW") || keys.current.has("ArrowUp") ? 1 : 0);
    };
    const down = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.matches("input,select,textarea")) return;
      if (
        game.phase === "playing" &&
        ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
          e.code,
        )
      )
        e.preventDefault();
      if (e.repeat) return;
      if (e.code === "Escape") {
        if (modal) setModal(null);
        else pause();
        return;
      }
      if (e.code === "KeyM") {
        toggleSound();
        return;
      }
      if (
        game.phase === "upgrade" &&
        !modal &&
        ["Digit1", "Digit2", "Digit3"].includes(e.code)
      ) {
        game.choose(Number(e.code.slice(-1)) - 1);
        tick((n) => n + 1);
        return;
      }
      if (
        e.code === "Enter" &&
        game.phase === "menu" &&
        !modal &&
        !(e.target as HTMLElement)?.closest("button")
      ) {
        e.preventDefault();
        openModal("survivors");
        return;
      }
      if (game.phase === "playing") {
        if (e.code === "Space") input.current.dash = true;
        if (e.code === "KeyQ") input.current.pulse = true;
      }
      keys.current.add(e.code);
      sync();
    };
    const up = (e: KeyboardEvent) => {
      keys.current.delete(e.code);
      sync();
    };
    const blur = () => {
      resetInput();
      if (game.phase === "playing") {
        game.phase = "paused";
        tick((n) => n + 1);
      }
    };
    const visibility = () => {
      if (document.hidden) blur();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [modal, muted, selected, difficulty, save.researches]);
  useEffect(() => {
    game.onRescue = () =>
      setSave((old) => {
        const next = recordRescue(old);
        storeSave(next);
        return next;
      });
    return () => {
      game.onRescue = undefined;
    };
  }, [game]);
  useEffect(() => {
    if ((phase === "dead" || phase === "victory") && !resultSaved.current) {
      resultSaved.current = true;
      setSave((old) => {
        const next = {
          ...old,
          best: Math.max(old.best, Math.floor(game.time)),
          kills: Math.max(old.kills, game.kills),
          runs: old.runs + 1,
          wins: old.wins + (phase === "victory" ? 1 : 0),
          credits:
            old.credits +
            Math.floor(game.kills / 15) +
            game.bossKills * 30 +
            (phase === "victory" ? 60 : 0),
        };
        storeSave(next);
        return next;
      });
    }
  }, [phase, game]);
  useEffect(() => {
    if (game.phase === "menu") {
      game.character = CHARACTERS[selected];
      game.weapons = { [CHARACTERS[selected].weapon]: 1 };
    }
  }, [selected, game]);
  useEffect(() => {
    const overlay = document.querySelector<HTMLElement>(".overlay");
    if (!overlay) return;
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const background = Array.from(
      document.querySelector<HTMLElement>(".app")!.children,
    ).filter(
      (el): el is HTMLElement => el instanceof HTMLElement && el !== overlay,
    );
    const oldInert = background.map((el) => el.inert);
    background.forEach((el) => {
      el.inert = true;
    });
    const focusable = () =>
      Array.from(
        overlay.querySelectorAll<HTMLElement>(
          'button:not(:disabled),select,a[href],[tabindex="0"]',
        ),
      ).filter((el) => el.getBoundingClientRect().width > 0);
    const first = focusable()[0];
    first?.focus();
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const items = focusable();
      if (!items.length) {
        e.preventDefault();
        return;
      }
      const first = items[0],
        last = items[items.length - 1];
      if (
        e.shiftKey &&
        (document.activeElement === first ||
          !overlay.contains(document.activeElement))
      ) {
        e.preventDefault();
        last.focus();
      } else if (
        !e.shiftKey &&
        (document.activeElement === last ||
          !overlay.contains(document.activeElement))
      ) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => {
      document.removeEventListener("keydown", trap);
      background.forEach((el, i) => {
        el.inert = oldInert[i];
      });
      if (previous?.isConnected) previous.focus();
    };
  }, [modal, phase, game.choices]);
  const fullscreen = () => {
    if (document.fullscreenElement)
      void document.exitFullscreen().catch(() => {});
    else void document.documentElement.requestFullscreen?.().catch(() => {});
  };
  const pointPointer = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
      y: 1 - ((e.clientY - rect.top) / rect.height) * 2,
    };
  };
  const overControl = (target: EventTarget) =>
    (target as HTMLElement).closest(
      "button,a,input,select,textarea,[role='dialog']",
    );
  const active = phase !== "menu";
  const boss = game.enemies.find((e) => e.kind === "boss");
  return (
    <div
      className={`app ${active ? "in-game" : "in-menu"} ${reduced ? "reduced" : ""}`}
      onPointerMove={(e) => {
        if (game.phase !== "playing" || e.pointerType !== "mouse") return;
        input.current.pointer = pointPointer(e);
      }}
      onPointerDown={(e) => {
        if (
          game.phase !== "playing" ||
          e.pointerType !== "mouse" ||
          e.button !== 2 ||
          overControl(e.target)
        )
          return;
        e.preventDefault();
        const pointer = pointPointer(e);
        input.current.pointer = pointer;
        input.current.dashPointer = { ...pointer };
        input.current.dash = true;
      }}
      onContextMenu={(e) => {
        if (game.phase === "playing" && !overControl(e.target))
          e.preventDefault();
      }}
      onPointerLeave={() => {
        input.current.pointer = undefined;
        input.current.aim = undefined;
      }}
    >
      <GameBoundary>
        <World
          game={game}
          input={input}
          audio={audio}
          quality={quality}
          reduced={reduced}
        />
      </GameBoundary>
      <div className="vignette" />
      <div className="topbar">
        <a
          href="#"
          className="brand"
          onClick={(e) => e.preventDefault()}
          aria-label="DEAD GRID"
        >
          <span className="brand-mark">
            <Crosshair size={19} />
          </span>
          <b>DG</b>
          <span className="brand-divider" />
          <span>SECTOR 07</span>
        </a>
        <div className="top-actions">
          {!active && (
            <>
              <button
                className="text-button"
                aria-label="생존 가이드"
                onClick={() => openModal("guide")}
              >
                <BookOpen size={16} />
                <span>생존 가이드</span>
              </button>
              <button
                className="text-button"
                aria-label="기지 연구"
                onClick={() => openModal("research")}
              >
                <BatteryCharging size={16} />
                <span>기지 연구</span>
                {researchTotal(save.researches) > 0 && (
                  <small>+{researchTotal(save.researches)}</small>
                )}
              </button>
            </>
          )}
          <button
            className="icon-button"
            onClick={toggleSound}
            aria-label={muted ? "소리 켜기" : "소리 끄기"}
            title="소리 (M)"
          >
            {muted ? <VolumeX size={19} /> : <Volume2 size={19} />}
          </button>
          <button
            className="icon-button"
            onClick={() => openModal("settings")}
            aria-label="설정"
          >
            <Settings2 size={19} />
          </button>
          {active && (
            <button
              className="icon-button"
              onClick={pause}
              aria-label={phase === "paused" ? "계속하기" : "일시정지"}
            >
              {phase === "paused" ? <Play size={19} /> : <Pause size={19} />}
            </button>
          )}
        </div>
      </div>
      {phase === "menu" && (
        <>
          <main className="menu-copy">
            <h1>
              <span>DEAD</span>
              <span>
                GRID<span className="title-period">.</span>
              </span>
            </h1>
            <div className="sector-tag">
              SECTOR 07 <span>/</span> QUARANTINE
            </div>
            <p className="tagline">
              마지막 30분.
              <br />
              살아서 돌아와라.
            </p>
            <div className="start-row">
              <button
                className="primary start"
                onClick={() => openModal("survivors")}
              >
                생존 시작 <ArrowUpRight size={25} />
              </button>
              <span className="enter-hint">
                <kbd>↵</kbd> ENTER
              </span>
            </div>
            <p className="menu-fine">
              공격은 자동으로. 조준과 생존은 당신의 선택으로.
            </p>
            <div className="menu-rescue-mobile">
              <Heart size={18} />
              <span>누적 생존자 구출</span>
              <b>{save.rescued.toLocaleString()}명</b>
            </div>
          </main>
          <aside className="mission">
            <div className="mission-header">
              <Radio size={15} />
              <span>OPERATION NIGHTFALL</span>
              <span className="status-dot" />
            </div>
            <div className="mission-time">
              30<span>:</span>00<small>FINAL CONTACT</small>
            </div>
            <div className="mission-stages">
              <span>01 생존</span>
              <ChevronRight size={12} />
              <span>02 진화</span>
              <ChevronRight size={12} />
              <span>03 제압</span>
            </div>
            <p>
              도시는 이미 무너졌다.
              <br />
              구조 신호가 도착할 때까지
              <br />이 거리에서 살아남아라.
            </p>
            <div className="mission-stat">
              <span>무기 시스템</span>
              <b>09</b>
            </div>
            <div className="mission-stat">
              <span>보스 교전</span>
              <b>06</b>
            </div>
            <div className="difficulty">
              <span>작전 난이도</span>
              <div>
                <button
                  className={difficulty === "normal" ? "selected" : ""}
                  onClick={() => setDifficulty("normal")}
                >
                  표준
                </button>
                <button
                  className={difficulty === "relaxed" ? "selected" : ""}
                  onClick={() => setDifficulty("relaxed")}
                >
                  탐험
                </button>
              </div>
            </div>
            {difficulty === "relaxed" && (
              <p className="difficulty-note">
                적의 체력·피해 감소. 첫 작전에 추천합니다.
              </p>
            )}
            <div className="mission-stat rescued-total">
              <Heart size={18} />
              <span>누적 생존자 구출</span>
              <b>
                {save.rescued.toLocaleString()}
                <small>명</small>
              </b>
            </div>
            <div className="best">
              <Trophy size={14} />
              <span>최장 생존</span>
              <b>{timeText(save.best)}</b>
            </div>
          </aside>
          <div className="scene-caption">
            <span className="crosshair-corner" />
            <span>
              LIVE FIELD FEED
              <br />
              <b>35.17° N / 129.06° E</b>
            </span>
          </div>
          <footer className="menu-controls">
            <span>
              <kbd>WASD</kbd> 이동
            </span>
            <span>
              <Crosshair size={15} />
              마우스 조준
            </span>
            <span>
              <kbd>SPACE / 우클릭</kbd> 회피
            </span>
            <span>
              <kbd>Q</kbd> 충격파
            </span>
          </footer>
        </>
      )}
      {active && (
        <>
          <div className="hud-top">
            <div className="survivor-hud">
              <span
                className={`hud-portrait hud-portrait--${game.character.id}`}
                role="img"
                aria-label={`${game.character.name} 얼굴 일러스트`}
              />
              <div>
                <div className="hud-name">
                  {game.character.name}
                  <small>LV. {game.level}</small>
                </div>
                <div className="health-track">
                  <span style={{ width: `${(game.hp / game.maxHp) * 100}%` }} />
                </div>
                <div className="health-label">
                  <Heart size={10} />
                  {Math.ceil(game.hp)} / {game.maxHp}
                  <span>{game.character.role}</span>
                </div>
              </div>
            </div>
            <div className="time-hud">
              <span>생존 시간</span>
              <strong>{timeText(game.time)}</strong>
              <small>
                {game.time < 1800 ? "30:00 최종 보스" : "최종 교전 중"}
              </small>
            </div>
            <div className="kill-hud">
              <Skull size={17} />
              <strong>{game.kills.toLocaleString()}</strong>
              <span>처치</span>
            </div>
          </div>
          <div className="xp-track">
            <span style={{ width: `${(game.xp / game.nextXp) * 100}%` }} />
            <small>
              LV {game.level} · {Math.floor(game.xp)} / {game.nextXp} EXP
            </small>
          </div>
          <aside className="field-panel">
            <Minimap game={game} />
            <RescueObjective game={game} />
            <div className="wave-label">
              <span>
                WAVE {String(Math.min(31, game.stage + 1)).padStart(2, "0")}
              </span>
              <b>{STAGES[game.stage][0]}</b>
            </div>
            <div className="boss-progress">
              {BOSS_SCHEDULE.map((seconds, i) => (
                <span
                  key={i}
                  className={game.defeatedBosses.has(i) ? "done" : ""}
                >
                  <Skull size={12} />
                  {game.defeatedBosses.has(i) ? "처치" : timeText(seconds)}
                </span>
              ))}
            </div>
          </aside>
          {boss && (
            <div className="boss-hud">
              <span>
                <Skull size={16} />
                {BOSSES[boss.bossIndex].name}
                <b>
                  {Math.ceil(boss.hp)} / {Math.ceil(boss.maxHp)}
                </b>
              </span>
              <div>
                <i style={{ width: `${(boss.hp / boss.maxHp) * 100}%` }} />
              </div>
            </div>
          )}
          {game.noticeTime > 0 && phase === "playing" && (
            <div className="notice" role="status">
              <Radio size={15} />
              {game.notice}
            </div>
          )}
          {game.time >= 1800 && phase === "playing" && (
            <div className="extraction-notice">
              최종 교전 · 모든 보스를 처치하면 작전 완료 (
              {game.defeatedBosses.size}/6)
            </div>
          )}
          {game.combo >= 15 && phase === "playing" && (
            <div className="combo">
              <strong>{game.combo}</strong>
              <span>KILL CHAIN</span>
            </div>
          )}
          <div className="loadout">
            <div className="weapons-row">
              {(Object.entries(game.weapons) as [Weapon, number][]).map(
                ([w, l]) => (
                  <div
                    className={`weapon-slot ${game.evolved.has(w) ? "evolved" : ""}`}
                    key={w}
                    title={`${game.evolved.has(w) ? WEAPONS[w].evolution : WEAPONS[w].name} ${l}단계`}
                  >
                    <GearIcon id={w} />
                    <span>{game.evolved.has(w) ? "EVO" : `Lv ${l}`}</span>
                    <div className="level-dots">
                      {Array.from({ length: 6 }, (_, i) => (
                        <i key={i} className={i < l ? "lit" : ""} />
                      ))}
                    </div>
                  </div>
                ),
              )}
              {Array.from(
                { length: 6 - Object.keys(game.weapons).length },
                (_, i) => (
                  <div key={i} className="weapon-slot empty">
                    <span>+</span>
                  </div>
                ),
              )}
            </div>
            <div className="passives-row">
              {Object.entries(game.passives).map(([p, l]) => (
                <span
                  key={p}
                  title={
                    PASSIVES[p as Passive].name +
                    (p === "pierce"
                      ? ` · 관통 확률 ${(game.pierceChance() * 100).toFixed(1).replace(/\.0$/, "")}%`
                      : "")
                  }
                >
                  <GearIcon id={p} size={13} />
                  {p === "pierce"
                    ? `${Number((game.pierceChance() * 100).toFixed(1))}%`
                    : l}
                </span>
              ))}
            </div>
          </div>
          <div className="ability-hud">
            <div className={game.dashCooldown === 0 ? "ready" : ""}>
              <Footprints size={18} />
              <span>
                <kbd>SPACE</kbd>
                <b>
                  {game.dashCooldown > 0
                    ? `${game.dashCooldown.toFixed(1)}s`
                    : "회피 준비"}
                </b>
              </span>
            </div>
            <div className={game.pulseCooldown === 0 ? "ready" : ""}>
              <Zap size={18} />
              <span>
                <kbd>Q</kbd>
                <b>
                  {game.pulseCooldown > 0
                    ? `${Math.ceil(game.pulseCooldown)}s`
                    : "충격파 준비"}
                </b>
              </span>
            </div>
          </div>
          {phase === "playing" && <TouchControls input={input} />}
        </>
      )}
      {phase === "upgrade" && !modal && (
        <div className="overlay">
          <section
            className="upgrade-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="upgrade-title"
          >
            <h2 id="upgrade-title">다음 생존 전략은?</h2>
            <p>장비 하나를 선택하세요. 선택하는 동안 시간은 멈춥니다.</p>
            <div className="upgrade-cards">
              {game.choices.map((u, i) => {
                const w = WEAPONS[u.id as Weapon];
                const rarity = u.rarity ? RARITIES[u.rarity] : undefined;
                return (
                  <button
                    key={`${u.id}-${i}`}
                    className={`upgrade-card ${u.evolution ? "evolution" : ""} ${u.rarity ? `rarity-${u.rarity}` : ""}`}
                    onClick={() => {
                      resetInput();
                      game.choose(i);
                      tick((n) => n + 1);
                    }}
                  >
                    <div className="upgrade-card-top">
                      <span>
                        {u.evolution
                          ? "무기 진화"
                          : u.id === "heal"
                            ? "응급 처치"
                            : u.id in WEAPONS
                              ? u.level === 1
                                ? "신규 무기"
                                : "무기 강화"
                              : `${rarity?.name || "일반"} · 패시브 강화`}
                      </span>
                      <kbd>{i + 1}</kbd>
                    </div>
                    <div
                      className="upgrade-icon"
                      style={{ color: rarity?.color || w?.color }}
                    >
                      <GearIcon id={u.id} size={38} />
                    </div>
                    <h3>{u.title}</h3>
                    <span className="upgrade-level">
                      {u.evolution
                        ? "진화 장비"
                        : `${u.level}단계${u.level === 1 ? " · 신규 획득" : ""}`}
                    </span>
                    <p>{u.description}</p>
                    {w && !u.evolution && (
                      <div className="evo-recipe">
                        <GearIcon id={w.partner} size={13} />
                        {w.name} 6 + {PASSIVES[w.partner].name} 3 →{" "}
                        {w.evolution}
                      </div>
                    )}
                    <div className="card-select">
                      선택 <ArrowRight size={17} />
                    </div>
                  </button>
                );
              })}
            </div>
            <small className="upgrade-footer">
              LEVEL {game.level} <span>키보드 1 · 2 · 3으로 빠르게 선택</span>
            </small>
          </section>
        </div>
      )}
      {phase === "paused" && !modal && (
        <div className="overlay">
          <section
            className="pause-panel"
            role="dialog"
            aria-modal="true"
            aria-label="일시정지"
          >
            <h2>잠시 숨을 고르세요.</h2>
            <p>
              {timeText(game.time)} 생존 · {game.kills} 처치 · LV {game.level}
            </p>
            <button className="primary" onClick={pause}>
              <Play size={18} /> 작전 계속
            </button>
            <button className="secondary" onClick={() => setModal("guide")}>
              <BookOpen size={17} /> 생존 가이드
            </button>
            <button className="text-button" onClick={home}>
              <CornerUpLeft size={17} /> 작전 종료 · 메인으로
            </button>
            <small>
              전투 진행은 저장되지 않습니다. 구출한 생존자 수는 유지됩니다.
            </small>
          </section>
        </div>
      )}
      {(phase === "dead" || phase === "victory") && !modal && (
        <div className="overlay result-overlay">
          <section
            className="result-panel"
            role="dialog"
            aria-modal="true"
            aria-label="작전 결과"
          >
            <h2>
              {phase === "victory" ? "살아서 돌아왔다." : "신호가 끊겼습니다."}
            </h2>
            <p>
              {phase === "victory"
                ? "30분의 공세와 마지막 보스를 제압했습니다. 생존 기록이 기지에 전송됐습니다."
                : "모든 작전은 다음 생존을 위한 경험이 됩니다."}
            </p>
            <div className="result-stats">
              <div>
                <span>생존 시간</span>
                <strong>{timeText(game.time)}</strong>
              </div>
              <div>
                <span>감염체 처치</span>
                <strong>{game.kills.toLocaleString()}</strong>
              </div>
              <div>
                <span>최종 레벨</span>
                <strong>{game.level}</strong>
              </div>
              <div>
                <span>보스 처치</span>
                <strong>
                  {game.bossKills}
                  <small> / {BOSSES.length}</small>
                </strong>
              </div>
            </div>
            <div className="rescue-result">
              <Heart size={20} />
              <span>이번 작전 구출</span>
              <b>{game.rescued}명</b>
              <span>누적 {save.rescued}명</span>
            </div>
            <div className="result-loadout">
              {Object.keys(game.weapons).map((w) => (
                <span key={w}>
                  <GearIcon id={w} />
                  {game.evolved.has(w as Weapon)
                    ? WEAPONS[w as Weapon].evolution
                    : WEAPONS[w as Weapon].name}
                </span>
              ))}
            </div>
            <div className="earned">
              <Package size={16} /> 연구 자원 +
              {Math.floor(game.kills / 15) +
                game.bossKills * 30 +
                (phase === "victory" ? 60 : 0)}
              <span>최고 기록 {timeText(save.best)}</span>
            </div>
            <div className="result-buttons">
              <button className="primary" onClick={start}>
                <RotateCcw size={18} /> 다시 출격
              </button>
              <button className="secondary" onClick={home}>
                기지로 복귀 <ArrowRight size={18} />
              </button>
            </div>
          </section>
        </div>
      )}
      {modal === "survivors" && (
        <SurvivorPicker
          selected={selected}
          onSelect={setSelected}
          onStart={start}
          onClose={() => setModal(null)}
        />
      )}
      {modal && modal !== "survivors" && (
        <div className="overlay">
          <section
            className={`modal-panel ${modal === "guide" ? "guide-panel" : ""} ${modal === "research" ? "research-panel" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-label={
              modal === "guide"
                ? "생존 가이드"
                : modal === "research"
                  ? "기지 연구"
                  : "설정"
            }
          >
            <button
              className="close-button icon-button"
              onClick={() => setModal(null)}
              aria-label="닫기"
            >
              <X size={22} />
            </button>
            <h2>
              {modal === "guide"
                ? "살아남는 법."
                : modal === "research"
                  ? "다음 작전을 준비하라."
                  : "작전 환경 설정"}
            </h2>
            {modal === "settings" && (
              <div className="settings-list">
                <div>
                  <span>
                    <strong>오디오</strong>
                    <small>절차적 앰비언스와 전투 효과음</small>
                  </span>
                  <button
                    className="toggle"
                    aria-pressed={!muted}
                    onClick={toggleSound}
                  >
                    {muted ? "꺼짐" : "켜짐"}
                  </button>
                </div>
                <div>
                  <span>
                    <strong>그래픽 품질</strong>
                    <small>높음: 실시간 그림자 · 낮음: 성능 우선</small>
                  </span>
                  <select
                    value={quality}
                    onChange={(e) =>
                      setQuality(e.target.value as "high" | "low")
                    }
                    aria-label="그래픽 품질"
                  >
                    <option value="high">높음</option>
                    <option value="low">낮음</option>
                  </select>
                </div>
                <div>
                  <span>
                    <strong>모션 줄이기</strong>
                    <small>피격 시 카메라 흔들림 제거</small>
                  </span>
                  <button
                    className="toggle"
                    aria-pressed={reduced}
                    onClick={() => setReduced(!reduced)}
                  >
                    {reduced ? "켜짐" : "꺼짐"}
                  </button>
                </div>
                <div>
                  <span>
                    <strong>전체 화면</strong>
                    <small>도시에 더 깊이 몰입하기</small>
                  </span>
                  <button className="secondary" onClick={fullscreen}>
                    <Maximize size={17} /> 전환
                  </button>
                </div>
                <p className="settings-note">
                  탭을 전환하거나 창을 벗어나면 자동으로 일시정지됩니다.
                  <br />
                  최고 기록과 연구는 이 브라우저에 저장됩니다.
                </p>
              </div>
            )}
            {modal === "research" && (
              <div className="research-body">
                <p>
                  작전에서 얻은 자원으로 모든 생존자를 강화하세요.
                  <br />
                  처치 15회당 자원 1 · 보스 처치 30 · 작전 완료 60
                </p>
                <div className="research-balance">
                  <Package size={22} />
                  <span>보유 연구 자원</span>
                  <strong>{save.credits}</strong>
                </div>
                <div className="research-catalog">
                  {(
                    Object.entries(RESEARCH) as [
                      ResearchId,
                      (typeof RESEARCH)[ResearchId],
                    ][]
                  ).map(([id, meta]) => {
                    const rank = save.researches[id] || 0,
                      cost = researchCost(id, rank),
                      Icon = icons[meta.icon] || Shield;
                    return (
                      <div className="research-row" key={id}>
                        <Icon size={28} />
                        <div>
                          <h3>
                            {meta.name}
                            <small>
                              {rank} / {meta.max}
                            </small>
                          </h3>
                          <p>{meta.desc}</p>
                          <div className="research-pips">
                            {Array.from({ length: meta.max }, (_, i) => (
                              <i key={i} className={i < rank ? "lit" : ""} />
                            ))}
                          </div>
                        </div>
                        <button
                          className="secondary"
                          disabled={rank >= meta.max || save.credits < cost}
                          aria-label={`${meta.name} 강화 · ${cost} 자원`}
                          onClick={() =>
                            setSave((old) => {
                              const purchase = purchaseResearch(
                                old.credits,
                                old.researches,
                                id,
                              );
                              if (!purchase) return old;
                              const next = {
                                ...old,
                                ...purchase,
                                research: purchase.researches.protocol || 0,
                              };
                              storeSave(next);
                              audio.unlock();
                              audio.play("level");
                              return next;
                            })
                          }
                        >
                          {rank >= meta.max ? "연구 완료" : `${cost} 자원`}
                          <ArrowRight size={17} />
                        </button>
                      </div>
                    );
                  })}
                </div>
                <p className="settings-note">
                  강화는 다음 출격부터 적용됩니다. 지금까지 {save.runs}회 출격 ·{" "}
                  {save.wins}회 작전 완료
                </p>
              </div>
            )}
            {modal === "guide" && (
              <>
                <nav className="guide-tabs">
                  {(["basics", "weapons", "timeline"] as const).map((t) => (
                    <button
                      key={t}
                      className={tab === t ? "selected" : ""}
                      onClick={() => setTab(t)}
                    >
                      {t === "basics"
                        ? "기본 조작"
                        : t === "weapons"
                          ? "무기와 진화"
                          : "30분 작전"}
                    </button>
                  ))}
                </nav>
                <div className="guide-content">
                  {tab === "basics" && (
                    <>
                      <div className="guide-intro">
                        <Crosshair size={32} />
                        <p>
                          무기는 자동 발사되며 마우스 방향을 조준합니다.
                          <br />
                          <b>계속 이동하며 청록색 경험치를 회수하세요.</b>
                        </p>
                      </div>
                      <div className="control-list">
                        <span>
                          <kbd>W A S D</kbd>
                          <b>이동</b>
                          <small>방향키도 사용 가능 · 모바일은 왼쪽 스틱</small>
                        </span>
                        <span>
                          <kbd>SPACE</kbd>
                          <b>회피</b>
                          <small>
                            우클릭: 마우스 방향 / Space: 이동 방향 · 재사용 3초
                          </small>
                        </span>
                        <span>
                          <kbd>Q</kbd>
                          <b>충격파</b>
                          <small>주변 적을 밀치고 둔화 · 재사용 18초</small>
                        </span>
                        <span>
                          <kbd>1 2 3</kbd>
                          <b>강화 선택</b>
                          <small>
                            레벨업할 때 무기나 패시브 하나 선택. 패시브는
                            일반(흰색) · 고급(초록색) · 희귀(파란색)이며, 높은
                            등급은 효과가 더 큽니다. 투사체 관통은 기본 0%로
                            관통 탄두 강화가 필요합니다.
                          </small>
                        </span>
                        <span>
                          <kbd>ESC</kbd>
                          <b>일시정지</b>
                          <small>M: 음소거 · 창을 벗어나면 자동 일시정지</small>
                        </span>
                      </div>
                      <div className="guide-callout">
                        <Package size={19} />
                        <p>
                          노란 보급 상자는 강화 1회를 제공합니다. 부상 생존자는
                          미니맵 십자가로 표시됩니다. 3m 이내에서 머무르면
                          치료하고, 체력 100%에서 구출되어 보급상자를 남깁니다.
                          치료 중에는 체력이 차고 범위를 벗어나면 출혈이 다시
                          진행됩니다. 보급은 처치 수와 무관하게 120초마다
                          투하되며, 정예 적은 상자를 드랍하지 않습니다. 하얀
                          응급키트는 최대 체력 50% 회복, 청록색 적이 가끔 자석을
                          드랍합니다. 습득하면 바닥의 모든 경험치 구슬이 벽을
                          넘어 날아와 흡수됩니다.
                        </p>
                      </div>
                      <p>
                        시야는 17m이며 건물에 막힙니다. 미방문 지역은 검게, 방문
                        후 시야 밖인 지역은 어둡게 표시됩니다. 적은 현재 보이는
                        범위에서만 표시됩니다. 방향성 무기는 마우스로 조준하며
                        모바일에서는 이동 방향을 사용합니다. 시야 안에서 건물에
                        가린 생존자·적·보급은 외곽선으로 확인하세요.
                      </p>
                      <p>
                        건물은 이동과 탄환을 막지만 감염체의 공격과 탄환에
                        피해를 받습니다. 구조물 체력이 소진되면 붕괴해 통로가
                        열립니다. 차량과 도로 차단물도 이동과 탄환을 막습니다.
                        차량은 파괴 후 12초간 불타며 접촉 피해를 주고
                        소각됩니다. 충격파는 주변 산성 탄환을 지워 위급한 순간을
                        넘기는 데 도움이 됩니다.
                      </p>
                      <p>
                        보스는 5·10·15·20·25·30분에 정확히 출현합니다. 30분이
                        되어도 전투는 끝나지 않습니다. 마지막 보스를 포함한
                        6명을 모두 처치해야 작전이 완료됩니다.
                      </p>
                    </>
                  )}
                  {tab === "weapons" && (
                    <div className="weapon-guide">
                      {(
                        Object.entries(WEAPONS) as [
                          Weapon,
                          (typeof WEAPONS)[Weapon],
                        ][]
                      ).map(([w, m]) => (
                        <div key={w}>
                          <span style={{ color: m.color }}>
                            <GearIcon id={w} size={26} />
                          </span>
                          <div>
                            <h3>
                              {m.name}
                              <small>6단계</small>
                            </h3>
                            <p>{m.desc}</p>
                            <div className="recipe">
                              {m.name} 6 + {PASSIVES[m.partner].name} 3{" "}
                              <ArrowRight size={12} />
                              <b>{m.evolution}</b>
                            </div>
                          </div>
                        </div>
                      ))}
                      <p className="guide-callout">
                        진화 조건을 달성하면 다음 레벨업 또는 보급 상자에서 진화
                        선택지가 등장할 수 있습니다.
                      </p>
                    </div>
                  )}
                  {tab === "timeline" && (
                    <div className="timeline">
                      {STAGES.map(([name, desc], i) => (
                        <div
                          key={i}
                          className={
                            [5, 10, 15, 20, 25, 30].includes(i)
                              ? "boss-event"
                              : ""
                          }
                        >
                          <time>{String(i).padStart(2, "0")}:00</time>
                          <span>
                            <b>{name}</b>
                            <small>{desc}</small>
                          </span>
                          {[5, 10, 15, 20, 25, 30].includes(i) && (
                            <Skull size={18} />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      )}
      <div className="a11y-live" aria-live="polite">
        {phase === "upgrade"
          ? "레벨업. 1, 2, 3 키로 업그레이드를 선택하세요."
          : phase === "dead"
            ? "작전 실패"
            : phase === "victory"
              ? "작전 완료"
              : ""}
      </div>
    </div>
  );
}
