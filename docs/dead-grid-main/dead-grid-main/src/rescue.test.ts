import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { Game as EngineGame, CHARACTERS } from "./engine";
import { SurvivorState } from "./ecs";
import { contains, segmentHit, MAP_LIMIT, type Building } from "./terrain";
import {
  RESCUE_RADIUS,
  RESCUE_HEAL_RATE,
  rescueSecondsRemaining,
  RescueNavigation,
  rescueMapMarker,
  type InjuredSurvivor,
} from "./rescue";
import { getSave, storeSave, recordRescue } from "./save";
const games: EngineGame[] = [];
const idle = { x: 0, y: 0, dash: false, pulse: false };
function game(seed = 42) {
  const g = new EngineGame(seed);
  games.push(g);
  g.start(CHARACTERS[0], "normal");
  g.weapons = {};
  g.nextXp = 1e9;
  g.invincible = 1e9;
  g.nextRescueAt = 1e9;
  return g;
}
function casualty(g: EngineGame, x = 2, z = 0) {
  const s = g.spawnSurvivor()!;
  assert.ok(s);
  s.x = x;
  s.z = z;
  return s;
}
function tick(g: EngineGame, seconds: number) {
  for (let i = 0; i < Math.round(seconds / 0.05); i++) {
    g.time += 0.05;
    (g as any).updateRescueSystem(0.05);
  }
}
afterEach(() => {
  games.forEach((g) => g.dispose());
  games.length = 0;
});

test("random casualties use Koota, reachable streets and a bounded objective pool", () => {
  const positions = new Set<string>();
  for (let seed = 1; seed <= 16; seed++) {
    const g = game(seed),
      s = casualty(g);
    // Inspect the actual spawn rather than the repositioned fixture.
    g.survivors = [];
    const p = g.spawnSurvivor()!;
    const d = Math.hypot(p.x - g.player.x, p.z - g.player.z);
    assert.ok(d >= 20 && d <= 48);
    assert.equal(p.hp, p.maxHp * 0.5);
    assert.ok(!g.structures.some((b) => contains(b, p, 0.65)));
    assert.equal(g.ecs.survivors.entity(p)!.get(SurvivorState), p);
    assert.equal(g.spawnSurvivor(), undefined);
    assert.equal(g.survivors.length, 1);
    positions.add(`${p.x},${p.z}`);
    const nav = new RescueNavigation();
    nav.refresh(g.structures, g.buildingsVersion);
    assert.ok(nav.escapeRoute(p).length > 1);
    assert.ok(s.id > 0);
  }
  assert.ok(positions.size > 8);
});

test("50 percent hemorrhage reaches zero in exactly sixty simulation seconds", () => {
  const g = game(),
    s = casualty(g, 30, 0);
  assert.equal(rescueSecondsRemaining(s), 60);
  tick(g, 59.95);
  assert.ok(s.hp > 0 && s.hp < 0.05);
  assert.equal(s.state, "wounded");
  tick(g, 0.05);
  assert.equal(s.hp, 0);
  assert.equal(s.state, "dead");
  assert.equal(g.survivorsLost, 1);
  assert.equal(g.rescued, 0);
  assert.equal(g.drops.length, 0);
  tick(g, 8);
  assert.equal(g.survivors.length, 0);
});

test("thirty seconds of proximity healing rescues once, drops one crate and runs off map", () => {
  const g = game(),
    s = casualty(g);
  let signals = 0;
  g.onRescue = () => signals++;
  s.healing = true;
  assert.equal(rescueSecondsRemaining(s), 30);
  tick(g, 29.95);
  assert.ok(s.hp < 100 && s.hp > 99.9);
  assert.equal(s.state, "wounded");
  tick(g, 0.05);
  assert.equal(s.state, "escaping");
  assert.equal(s.hp, 100);
  assert.equal(s.healing, false);
  assert.equal(g.rescued, 1);
  assert.equal(signals, 1);
  assert.equal(g.drops.length, 1);
  const chest = g.drops[0];
  assert.equal(chest.type, "chest");
  assert.equal(chest.value, 1);
  assert.equal(chest.x, 2);
  assert.equal(chest.z, 0);
  const initial = { x: s.x, z: s.z };
  tick(g, 1);
  assert.notDeepEqual({ x: s.x, z: s.z }, initial);
  tick(g, 30);
  assert.equal(g.survivors.length, 0);
  assert.equal(g.rescued, 1);
  assert.equal(signals, 1);
  assert.equal(g.drops.length, 1);
  assert.ok(Math.abs(s.x) > MAP_LIMIT + 5 || Math.abs(s.z) > MAP_LIMIT + 5);
});

test("healing reverses smoothly, pauses at barriers, and lower health needs longer care", () => {
  const g = game(),
    s = casualty(g);
  s.hp = 10;
  s.healing = true;
  assert.equal(rescueSecondsRemaining(s), 54);
  tick(g, 30);
  assert.ok(Math.abs(s.hp - 60) < 1e-6);
  assert.equal(g.rescued, 0);
  g.player = { x: -10, z: 0 };
  tick(g, 12);
  assert.ok(Math.abs(s.hp - 50) < 1e-6);
  assert.equal(s.healing, false);
  assert.equal(rescueSecondsRemaining(s), 60);
  g.player = { x: 0, z: 0 };
  tick(g, 30);
  assert.equal(g.rescued, 1);
});

test("three metre range includes the edge and requires line of sight through all solid hulls", () => {
  const g = game(),
    s = casualty(g, RESCUE_RADIUS, 0);
  assert.equal(g.canHealSurvivor(s), true);
  s.x += 0.01;
  assert.equal(g.canHealSurvivor(s), false);
  s.x = 2;
  const wall: Building = { ...g.props[0], x: 1, z: 0, w: 0.5, d: 4 };
  g.structures = [wall];
  tick(g, 1);
  assert.equal(s.healing, false);
  assert.ok(s.hp < 50);
  wall.kind = "vehicle";
  wall.hp = 0;
  wall.burningAt = g.time;
  wall.burnedAt = -1;
  assert.equal(g.canHealSurvivor(s), false);
  wall.burnedAt = g.time;
  assert.equal(g.canHealSurvivor(s), true);
});

test("pause, upgrade, death and victory stop rescue clocks and restart clears the ECS actors", () => {
  const g = game(),
    s = casualty(g);
  g.nextRescueAt = g.time;
  for (const phase of [
    "paused",
    "upgrade",
    "dead",
    "victory",
    "menu",
  ] as const) {
    g.phase = phase;
    const time = g.time,
      hp = s.hp,
      next = g.nextRescueAt;
    g.update(0.05, idle);
    assert.equal(g.time, time);
    assert.equal(s.hp, hp);
    assert.equal(g.nextRescueAt, next);
  }
  g.phase = "playing";
  g.update(0.05, idle);
  assert.ok(s.hp > 50);
  g.start(CHARACTERS[1], "normal");
  assert.equal(g.survivors.length, 0);
  assert.equal(g.ecs.world.query(SurvivorState).length, 0);
  assert.equal(g.rescued, 0);
  assert.equal(g.nextRescueAt, 45);
});

test("integration spawns at 45 seconds and intervals are independent of kills", () => {
  const g = game();
  g.nextRescueAt = 45;
  g.time = 44.9;
  g.update(0.05, idle);
  assert.equal(g.survivors.length, 0);
  g.update(0.05, idle);
  assert.equal(g.survivors.length, 1);
  const scheduled = g.nextRescueAt;
  assert.ok(scheduled >= 145 && scheduled <= 195);
  g.kills = 100000;
  g.time = scheduled - 0.05;
  g.update(0.05, idle);
  assert.equal(g.survivors.filter((s) => s.state === "wounded").length, 1);
  assert.ok(g.nextRescueAt > scheduled);
});

test("escape route obeys rotated vehicles, props and intact buildings until perimeter extraction", () => {
  const g = game(),
    nav = new RescueNavigation();
  nav.refresh(g.structures, g.buildingsVersion);
  for (let i = 0; i < 8; i++) {
    const p = nav.spawnPoint(g.player, () => i / 8, [])!;
    const route = nav.escapeRoute(p);
    let previous = p;
    for (const waypoint of route.slice(0, -1)) {
      assert.ok(
        !g.structures.some(
          (b) => segmentHit(previous, waypoint, b, 0.45) !== null,
        ),
      );
      previous = waypoint;
    }
    const final = route.at(-1)!;
    assert.ok(Math.abs(final.x) > MAP_LIMIT || Math.abs(final.z) > MAP_LIMIT);
  }
  const s = casualty(g);
  s.hp = 100;
  s.state = "escaping";
  tick(g, 0.05);
  const version = s.routeVersion;
  g.damageBuilding(g.buildings[0], g.buildings[0].maxHp);
  tick(g, 0.05);
  assert.ok(s.routeVersion > version);
  assert.equal(s.routeVersion, g.buildingsVersion);
});

test("signals remain directionally correct inside and outside minimap, even in unexplored regions", () => {
  const g = game(),
    s = casualty(g, 60, -60);
  assert.equal(g.canSee(s), false);
  let p = rescueMapMarker(g.player, s);
  assert.equal(p.edge, true);
  assert.ok(Math.abs(Math.hypot(p.x - 70, p.y - 70) - 50) < 1e-6);
  assert.ok(p.x > 70);
  assert.equal(p.y, 70);
  p = rescueMapMarker({ x: 60, z: -60 }, s);
  assert.equal(p.edge, false);
  assert.equal(p.x, 70);
  assert.equal(p.y, 70);
  assert.equal(p.distance, 0);
  p = rescueMapMarker({ x: 0, z: 0 }, { x: -60, z: 60 });
  assert.ok(p.x < 70);
  assert.equal(p.y, 70);
  p = rescueMapMarker({ x: 0, z: 0 }, { x: 60, z: 60 });
  assert.equal(p.x, 70);
  assert.ok(p.y > 70);
});

test("saved rescue totals migrate old saves and persist immediately without run result double counting", () => {
  let raw = JSON.stringify({ best: 523, credits: 80, runs: 2, research: 2 });
  const storage = {
    getItem: () => raw,
    setItem: (_: string, value: string) => {
      raw = value;
    },
  };
  let save = getSave(storage);
  assert.equal(save.rescued, 0);
  assert.equal(save.best, 523);
  assert.equal(save.research, 2);
  const g = game(),
    s = casualty(g);
  g.onRescue = () => {
    save = recordRescue(save);
    storeSave(save, storage);
  };
  s.hp = 100 - RESCUE_HEAL_RATE * 0.05;
  tick(g, 0.05);
  assert.equal(getSave(storage).rescued, 1);
  tick(g, 2);
  assert.equal(getSave(storage).rescued, 1);
  assert.equal(getSave(storage).runs, 2);
  g.phase = "dead";
  g.start(CHARACTERS[0], "normal");
  assert.equal(g.rescued, 0);
  assert.equal(getSave(storage).rescued, 1);
  const second = casualty(g);
  second.hp = 100;
  tick(g, 0.05);
  assert.equal(getSave(storage).rescued, 2);
  raw = JSON.stringify({ rescued: -3 });
  assert.equal(getSave(storage).rescued, 0);
  raw = "bad json";
  assert.equal(getSave(storage).rescued, 0);
  assert.doesNotThrow(() =>
    storeSave(save, {
      setItem: () => {
        throw Error("disabled");
      },
    }),
  );
});

test("completed rescue crate remains a real collectible upgrade even with saturated XP", () => {
  const g = game(),
    s = casualty(g, 1.2, 0);
  s.hp = 100;
  g.drops = Array.from({ length: 910 }, (_, i) => ({
    id: 900000 + i,
    x: 50,
    z: 0,
    type: "xp" as const,
    value: 1,
    age: 0,
  }));
  g.update(0.05, idle);
  assert.equal(g.rescued, 1);
  assert.equal(g.drops.filter((d) => d.type === "chest").length, 1);
  for (let i = 0; i < 5; i++) g.update(0.05, idle);
  assert.equal(g.crates, 1);
  assert.equal(g.phase, "upgrade");
  assert.equal(g.choices.length, 3);
  const hp = s.hp,
    t = g.time;
  g.update(0.05, idle);
  assert.equal(s.hp, hp);
  assert.equal(g.time, t);
});

test("no reachable extraction or three existing actors suppresses unsafe new objectives", () => {
  const g = game();
  g.structures = [{ ...g.buildings[0], x: 0, z: 0, w: 130, d: 130 }];
  g.buildingsVersion++;
  assert.equal(g.spawnSurvivor(), undefined);
  assert.equal(g.survivors.length, 0);
  g.start(CHARACTERS[0], "normal");
  const s = casualty(g);
  s.state = "escaping";
  g.survivors = [
    s,
    { ...s, id: 8888, x: -5, route: [] },
    { ...s, id: 8889, x: 5, route: [] },
  ];
  assert.equal(g.spawnSurvivor(), undefined);
  assert.equal(g.survivors.length, 3);
});

test("unavailable browser storage falls back without throwing or losing in-memory rescue count", () => {
  assert.equal(
    getSave({
      getItem: () => {
        throw Error("unavailable");
      },
    }).rescued,
    0,
  );
  assert.equal(
    getSave({ getItem: () => JSON.stringify({ rescued: 3.8 }) }).rescued,
    3,
  );
  assert.doesNotThrow(() => getSave());
  assert.doesNotThrow(() => storeSave(recordRescue(getSave())));
});
