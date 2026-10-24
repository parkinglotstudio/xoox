// Development-only reproducible visual fixtures. Not an entry in the release build.
import { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import World from "./World";
import Minimap from "./Minimap";
import RescueObjective from "./RescueObjective";
import "./style.css";
import "./ui-scale.css";
import "./expansion.css";
import "./rescue.css";
import { Game, CHARACTERS, type Input } from "./engine";
import { AudioSystem } from "./audio";
const appearanceScenes = [
  "강하나 외형",
  "박도윤 외형",
  "서유진 외형",
  "화염병 비행",
  "화염병 착지",
  "냉각 펄스",
];
function QA() {
  const appearanceOnly = new URLSearchParams(location.search).has("appearance");
  const game = useMemo(() => new Game(9), []);
  useEffect(() => {
    game.retain();
    return () => game.release();
  }, [game]);
  const audio = useMemo(() => new AudioSystem(), []);
  const input = useRef<Input>({ x: 0, y: 0, dash: false, pulse: false });
  const [scene, setScene] = useState("");
  const load = (scenario: string) => {
    game.start(CHARACTERS[0], "normal");
    game.phase = "paused";
    game.invincible = 0;
    game.time = 90;
    game.player = { x: 10, z: 10 };
    game.spawnEnemy("elite", 8, 7);
    game.spawnEnemy("boss", 5, 5, 1);
    game.enemies.forEach((e) => {
      e.hp = e.maxHp * 0.65;
    });
    game.spawnEnemy("runner", 22, 22);
    game.addDrops({ id: 5000, x: 8, z: 9, type: "chest", value: 1, age: 0 });
    if (scenario === "안개 기억") {
      game.player = { x: -12, z: 10 };
      game.updateVision();
      game.player = { x: 10, z: 10 };
    }
    if (scenario === "탄환 비교") {
      game.player = { x: 0, z: 0 };
      game.enemies = [];
      game.drops = [];
      for (let i = 0; i < 5; i++) {
        game.addBullets({
          id: 6000 + i,
          x: -3,
          z: -4 + i * 1.4,
          vx: 0,
          vz: 1,
          life: 1,
          damage: 23,
          radius: 0.17,
          pierceChance: 0,
          type: "pistol",
          hit: new Set(),
        });
        game.addBullets({
          id: 7000 + i,
          x: 3,
          z: -4 + i * 1.4,
          vx: 0,
          vz: 1,
          life: 1,
          damage: 14,
          radius: 0.2,
          pierceChance: 0,
          type: "shotgun",
          hit: new Set(),
        });
      }
    }
    if (scenario === "비가림 캐릭터") {
      game.player = { x: 0, z: 0 };
      game.enemies = [];
      game.drops = [];
      game.spawnEnemy("elite", 3, 0);
      game.spawnEnemy("walker", -3, 0);
    }
    if (scenario === "차량 화재" || scenario === "차량 소각") {
      game.player = { x: -4, z: 8 };
      game.enemies = [];
      game.drops = [];
      const car = game.vehicles[0];
      game.damageBuilding(car, car.maxHp);
      if (scenario === "차량 소각") {
        car.burnedAt = game.time + 12;
        game.time += 13;
        game.buildingsVersion++;
      }
      game.effects = [];
    }
    if (scenario === "건물 붕괴") {
      const building = game.buildings.find((b) => b.x === 18 && b.z === 18)!;
      game.damageBuilding(building, building.maxHp);
      game.time += 1;
      game.effects = [];
    }
    if (scenario === "맵 봉쇄선") {
      game.player = { x: 60, z: 0 };
      game.enemies = [];
      game.drops = [];
    }
    if (scenario === "자석 회수") {
      game.player = { x: 0, z: 0 };
      game.enemies = [];
      game.drops = [];
      game.weapons = {};
      game.invincible = 1e6;
      game.nextXp = 1e6;
      for (let i = 0; i < 80; i++) {
        const a = i * 2.39996,
          r = 8 + (i % 8) * 4;
        game.addDrops({
          id: 10000 + i,
          type: "xp",
          value: 1,
          age: 0,
          x: Math.sin(a) * r,
          z: Math.cos(a) * r,
        });
      }
      // Freeze mid-flight to inspect trails. Resume with the play button.
      game.addDrops({
        id: 11000,
        type: "magnet",
        value: 1,
        age: 0,
        x: 0,
        z: 0,
      });
      game.phase = "playing";
      for (let i = 0; i < 14; i++) game.update(0.05, input.current);
      game.phase = "paused";
    }
    if (["카타나", "저격 조준", "화염 연소"].includes(scenario)) {
      game.enemies = [];
      game.drops = [];
      game.invincible = 1e6;
      game.nextXp = 1e6;
      game.player = scenario === "화염 연소" ? { x: -4, z: 8 } : { x: 0, z: 0 };
      const point =
        scenario === "화염 연소" ? { x: -4, z: 20 } : { x: 20, z: 0 };
      game.weapons =
        scenario === "카타나"
          ? { katana: 4 }
          : scenario === "저격 조준"
            ? { sniper: 4 }
            : { flamethrower: 4 };
      for (let i = 0; i < 4; i++) {
        game.spawnEnemy(
          "brute",
          scenario === "화염 연소" ? -6 + i : 2 + i * 0.4,
          scenario === "화염 연소" ? 10 : (i - 1.5) * 1.2,
        );
        const e = game.enemies.at(-1)!;
        e.hp = e.maxHp = 10000;
        e.speed = 0;
      }
      game.phase = "playing";
      for (let i = 0; i < (scenario === "화염 연소" ? 20 : 2); i++)
        game.update(0.05, { ...input.current, aim: point });
      game.phase = "paused";
    }
    if (appearanceScenes.includes(scenario)) {
      const index =
        scenario === "강하나 외형"
          ? 0
          : scenario === "서유진 외형" || scenario === "냉각 펄스"
            ? 2
            : 1;
      game.start(CHARACTERS[index], "normal");
      game.enemies = [];
      game.drops = [];
      game.player = { x: 0, z: 0 };
      game.invincible = 0;
      game.facing = Math.PI / 2;
      input.current = { x: 0, y: 0, dash: false, pulse: false };
      (game as any).spawnClock = 1e9;
      (game as any).eliteClock = 1e9;
      if (scenario.endsWith("외형")) {
        game.weapons = {};
      } else {
        game.weapons = scenario === "냉각 펄스" ? { frost: 2 } : { molotov: 1 };
        for (
          let i = 0;
          i <
          (scenario === "화염병 착지"
            ? 16
            : scenario === "화염병 비행"
              ? 6
              : 5);
          i++
        ) {
          game.update(0.05, {
            x: 0,
            y: 0,
            dash: false,
            pulse: false,
            aim: { x: 6, z: 0 },
          });
        }
      }
      game.phase = "paused";
    }
    game.updateVision();
    setScene(scenario);
  };
  useEffect(() => {
    if (scene !== "안개 이동") return;
    let raf = 0,
      start = performance.now();
    const step = (now: number) => {
      const t = (now - start) / 1000;
      game.player = { x: Math.sin(t * 0.5) * 14, z: 0 };
      game.updateVision();
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [scene, game]);
  return (
    <main style={{ position: "fixed", inset: 0, background: "#000" }}>
      <World
        game={game}
        input={input}
        audio={audio}
        quality="high"
        reduced={false}
        inspectionZoom={
          scene.endsWith("외형")
            ? 100
            : appearanceScenes.includes(scene)
              ? 42
              : undefined
        }
      />
      <style>{`@media (max-width: 700px) { .qa-reference { display: none; } .qa-nav { left: 12px !important; top: 12px !important; gap: 6px !important; } .qa-nav button { padding: 10px !important; font-size: 13px; } }`}</style>
      {appearanceScenes.includes(scene) && (
        <aside
          className="qa-reference"
          style={{
            position: "absolute",
            top: 135,
            right: 30,
            width: 240,
            color: "#eee8d3",
            fontFamily: "sans-serif",
            background: "#142525",
            padding: 12,
          }}
        >
          <b>{game.character.name} · 일러스트 기준</b>
          <div
            role="img"
            aria-label={`${game.character.name} 원본 일러스트`}
            style={{
              marginTop: 12,
              width: 240,
              height: 440,
              backgroundImage: 'url("/portraits/survivors-v14.png")',
              backgroundSize: "300% auto",
              backgroundPosition: `${CHARACTERS.indexOf(game.character) * 50}% top`,
            }}
          />
          <p style={{ marginBottom: 0, fontSize: 13 }}>
            왼쪽: 실제 게임 인스턴스 모델
          </p>
        </aside>
      )}
      <nav
        className="qa-nav"
        style={{
          position: "absolute",
          left: 20,
          top: 20,
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        {(appearanceOnly
          ? appearanceScenes
          : [
              "가림 외곽선",
              "비가림 캐릭터",
              "안개 기억",
              "안개 이동",
              "건물 붕괴",
              "차량 화재",
              "차량 소각",
              "탄환 비교",
              "맵 봉쇄선",
              "카타나",
              "저격 조준",
              "화염 연소",
              "자석 회수",
              ...appearanceScenes,
            ]
        ).map((name) => (
          <button
            key={name}
            onClick={() => load(name)}
            style={{
              padding: "12px 18px",
              background: "#16352d",
              color: "#f5e4bf",
              border: "1px solid #687b66",
              borderRadius: 4,
            }}
          >
            {name}
          </button>
        ))}
        {scene === "자석 회수" && (
          <button
            onClick={() => {
              game.phase = "playing";
            }}
            style={{
              padding: "12px 18px",
              background: "#16352d",
              color: "#f5e4bf",
              border: "1px solid #687b66",
            }}
          >
            회수 재생
          </button>
        )}
      </nav>
      <p
        style={{
          position: "absolute",
          left: 20,
          bottom: 12,
          right: 20,
          fontSize: 13,
          color: "#cfdbbf",
          fontFamily: "sans-serif",
        }}
      >
        {scene} · 개발 검증 화면 ·{" "}
        {appearanceOnly
          ? "실제 게임 모델과 투사체 · 비행/착지 시점 고정"
          : "청록: 생존자 / 주황: 적 / 노랑: 보급 · 시야 밖 적은 외곽선도 숨김"}
      </p>
    </main>
  );
}
function RescuePreview() {
  const game = useMemo(() => new Game(64), []);
  const audio = useMemo(() => new AudioSystem(), []);
  const input = useRef<Input>({ x: 0, y: 0, dash: false, pulse: false });
  const [scene, setScene] = useState("치료");
  const [, tick] = useState(0);
  const load = (name: string) => {
    game.start(CHARACTERS[0], "normal");
    game.weapons = {};
    game.nextRescueAt = 1e9;
    game.nextXp = 1e9;
    game.invincible = 0;
    (game as any).spawnClock = 1e9;
    (game as any).eliteClock = 1e9;
    game.enemies = [];
    game.drops = [];
    const survivor = game.spawnSurvivor()!;
    survivor.x = 3;
    survivor.z = 0;
    survivor.hp = 72;
    game.player = { x: 1, z: 0 };
    game.time = 65;
    game.stage = 1;
    if (name === "방향") {
      survivor.x = 60;
      survivor.z = -60;
      survivor.hp = 15;
    }
    if (name === "출혈") {
      game.player = { x: -2, z: -2 };
      survivor.hp = 32;
    }
    if (name === "탈출") {
      survivor.hp = 100;
      survivor.state = "escaping";
      survivor.routeVersion = -1;
      game.rescued = 1;
      game.addDrops({ id: 80000, x: 3, z: 0, type: "chest", value: 1, age: 0 });
    }
    survivor.healing = game.canHealSurvivor(survivor);
    game.phase = "paused";
    game.updateVision();
    setScene(name);
  };
  useEffect(() => {
    game.retain();
    load("치료");
    const id = setInterval(() => tick((n) => n + 1), 100);
    return () => {
      clearInterval(id);
      game.release();
    };
  }, [game]);
  return (
    <main className="app">
      <World
        game={game}
        input={input}
        audio={audio}
        quality="high"
        reduced={false}
      />
      <aside className="field-panel">
        <Minimap game={game} />
        <RescueObjective game={game} />
      </aside>
      <nav
        style={{
          position: "absolute",
          left: 12,
          bottom: 36,
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          maxWidth: "calc(100% - 24px)",
          zIndex: 10,
        }}
      >
        {[
          ["치료", "치료"],
          ["출혈", "출혈"],
          ["방향", "미니맵 방향"],
          ["탈출", "탈출·보급"],
        ].map(([id, label]) => (
          <button className="secondary" key={id} onClick={() => load(id)}>
            {label}
          </button>
        ))}
        <button
          className="primary"
          onClick={() => {
            game.phase = game.phase === "playing" ? "paused" : "playing";
          }}
        >
          재생 / 정지
        </button>
      </nav>
      <p
        style={{
          position: "absolute",
          left: 16,
          top: 16,
          color: "#eee8d3",
          fontSize: 16,
        }}
      >
        생존자 구조 ·{" "}
        {scene === "치료"
          ? "치료 범위 3m · 초록 십자가"
          : scene === "출혈"
            ? "범위 밖 출혈"
            : scene === "방향"
              ? "시야·미니맵 밖 구조 신호"
              : "구출 후 달려서 탈출 · 보급상자"}{" "}
        · 개발 검증 장면
      </p>
    </main>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(
  new URLSearchParams(location.search).has("rescue") ? (
    <RescuePreview />
  ) : (
    <QA />
  ),
);
if (import.meta.hot) import.meta.hot.dispose(() => root.unmount());
