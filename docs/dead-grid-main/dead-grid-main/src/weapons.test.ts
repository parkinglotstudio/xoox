import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  Game,
  CHARACTERS,
  WEAPONS,
  type Weapon,
  type Upgrade,
  type Effect,
} from "./engine";
import { createVehicles, createBarriers, type Building } from "./terrain";

const games = new Set<Game>();
const idle = { x: 0, y: 0, dash: false, pulse: false };
const weapons = Object.keys(WEAPONS) as Weapon[];
afterEach(() => {
  for (const g of games) g.dispose();
  games.clear();
});
function arena() {
  const g = new Game(101);
  games.add(g);
  g.start(CHARACTERS[0], "normal");
  g.structures = [];
  g.buildings = [];
  g.vehicles = [];
  g.props = [];
  g.boundary = [];
  g.enemies = [];
  g.weapons = {};
  g.invincible = 1e6;
  (g as any).spawnClock = 1e9;
  (g as any).eliteClock = 1e9;
  return g;
}
function target(g: Game, x: number, z: number) {
  g.spawnEnemy("brute", x, z);
  const enemy = g.enemies.at(-1)!;
  enemy.speed = 0;
  enemy.hp = enemy.maxHp = 100000;
  return enemy;
}
function fire(g: Game, w: Weapon) {
  (g as any).rebuildGrid();
  (g as any).fire(w);
}
function eligible(g: Game): Upgrade[] {
  return (g as any).eligible();
}
function choose(g: Game, card: Upgrade) {
  g.phase = "upgrade";
  g.choices = [card];
  g.choose(0);
}
function cover(kind: "vehicle" | "barrier", changes: Partial<Building> = {}) {
  return {
    ...(kind === "vehicle" ? createVehicles()[0] : createBarriers()[0]),
    x: 3,
    z: 0,
    rotation: 0,
    w: 0.5,
    d: 8,
    ...changes,
  };
}

for (const w of weapons) {
  test(`${w}: every acquisition, rank and evolution is equipped and deals actual damage`, () => {
    const g = arena();
    // The same eligibility guard must apply to every weapon, including full slots.
    g.weapons = Object.fromEntries(
      weapons
        .filter((x) => x !== w)
        .slice(0, 6)
        .map((x) => [x, 1]),
    );
    g.passives = { [WEAPONS[w].partner]: 5 };
    assert.ok(!eligible(g).some((u) => u.id === w));
    choose(g, {
      id: w,
      title: "invalid",
      description: "",
      level: 7,
      evolution: true,
    });
    assert.equal(g.evolved.has(w), false);
    assert.equal(g.weapons[w], undefined);
    g.weapons = {};
    g.passives = {};
    for (let rank = 1; rank <= 6; rank++) {
      const card = eligible(g).find((u) => u.id === w)!;
      assert.equal(card.level, rank);
      assert.equal(card.evolution, false);
      choose(g, card);
      assert.equal(g.weapons[w], rank);
      g.enemies = [];
      g.bullets = [];
      g.effects = [];
      g.enemyBurns.clear();
      const e =
        w === "orbit"
          ? target(g, 0, 2.4 + rank * 0.13)
          : w === "frost"
            ? target(g, 0, 3)
            : target(g, w === "katana" ? 2 : 6, 0);
      g.time = 0;
      g.aim = { x: 6, z: 0 };
      fire(g, w);
      g.weapons = {};
      for (let i = 0; i < 20; i++)
        g.update(0.05, { ...idle, aim: { x: 6, z: 0 } });
      assert.ok(e.hp < e.maxHp, `${w} rank ${rank} never dealt damage`);
      g.weapons = { [w]: rank };
    }
    g.passives = { [WEAPONS[w].partner]: 2 };
    assert.ok(!eligible(g).some((u) => u.id === w && u.evolution));
    g.passives = { [WEAPONS[w].partner]: 3 };
    const evolution = eligible(g).find((u) => u.id === w && u.evolution)!;
    assert.ok(evolution);
    choose(g, evolution);
    assert.equal(g.weapons[w], 6);
    assert.equal(g.evolved.has(w), true);
    assert.ok(!eligible(g).some((u) => u.id === w));
    g.enemies = [];
    g.bullets = [];
    g.effects = [];
    const e =
      w === "orbit"
        ? target(g, 0, 3.18)
        : w === "frost"
          ? target(g, 0, 3)
          : target(g, w === "katana" ? 2 : 6, 0);
    // Reset rotation time so circular weapons face the test target.
    g.time = 0;
    fire(g, w);
    g.weapons = {};
    for (let i = 0; i < 20; i++) g.update(0.05, idle);
    assert.ok(e.hp < e.maxHp, `${w} evolution never dealt damage`);
  });
}

test("Tesla selects an unblocked first target and chains stop at vehicles and props", () => {
  for (const kind of ["vehicle", "barrier"] as const) {
    const g = arena();
    g.weapons = { lightning: 1 };
    const blocked = target(g, 6, 0);
    const visible = target(g, 0, 7);
    g.structures = [cover(kind)];
    fire(g, "lightning");
    assert.equal(
      blocked.hp,
      blocked.maxHp,
      "initial/chain target behind cover must not take Tesla damage",
    );
    assert.ok(
      visible.hp < visible.maxHp,
      "an unblocked target should be selected",
    );
  }
});

test("orbit blades never damage enemies across vehicles or props", () => {
  for (const kind of ["vehicle", "barrier"] as const) {
    const g = arena();
    g.weapons = { orbit: 1 };
    const e = target(g, 0, 2.53);
    g.structures = [cover(kind, { x: 0, z: 1.3, w: 8, d: 0.4 })];
    fire(g, "orbit");
    assert.equal(e.hp, e.maxHp);
    g.structures = [];
    fire(g, "orbit");
    assert.ok(e.hp < e.maxHp);
  }
});

test("molotov fire cannot hit enemies through a vehicle or indestructible prop", () => {
  for (const kind of ["vehicle", "barrier"] as const) {
    const g = arena();
    g.weapons = { molotov: 1 };
    g.aim = { x: 8, z: 0 };
    const e = target(g, 4, 0);
    g.structures = [cover(kind)];
    fire(g, "molotov");
    g.weapons = {};
    for (let i = 0; i < 12; i++) g.update(0.05, idle);
    assert.ok(g.effects.some((fx) => fx.type === "fire"));
    assert.equal(e.hp, e.maxHp);
    g.structures = [];
    (g as any).fireClock = 0;
    g.update(0.05, idle);
    assert.ok(e.hp < e.maxHp, "the same fire hits when the cover is removed");
  }
});

test("molotov structure damage follows rotated hulls and occlusion rather than an axis-aligned box", () => {
  const g = arena();
  // The long axis rotates into x: the actual near face is only 1m away.
  const near = cover("vehicle", {
    x: 4,
    z: 0,
    w: 1,
    d: 6,
    rotation: Math.PI / 2,
  });
  g.structures = [near];
  (g as any).effect("fire", { x: 0, z: 0 }, 2, 5, "#ff9900", 100);
  g.update(0.05, idle);
  assert.ok(near.hp < near.maxHp, "near rotated hull is inside the radius");
  // Move fire to the narrow end of a rotated hull which lies outside its circle.
  const g2 = arena();
  const outside = cover("vehicle", {
    x: 0,
    z: 4,
    w: 1,
    d: 6,
    rotation: Math.PI / 2,
  });
  g2.structures = [outside];
  (g2 as any).effect("fire", { x: 0, z: 0 }, 3, 5, "#ff9900", 100);
  g2.update(0.05, idle);
  assert.equal(
    outside.hp,
    outside.maxHp,
    "the rotated hull is outside the fire circle",
  );
  const g3 = arena();
  const shielded = cover("vehicle", { x: 3, z: 0 });
  g3.structures = [cover("barrier", { x: 1, z: 0 }), shielded];
  (g3 as any).effect("fire", { x: 0, z: 0 }, 5, 5, "#ff9900", 100);
  g3.update(0.05, idle);
  assert.equal(
    shielded.hp,
    shielded.maxHp,
    "indestructible cover shields destructible structures too",
  );
});

test("cosmetic saturation never suppresses a molotov damage zone or rewrites an old melee/flame effect", () => {
  const g = arena();
  g.effects = Array.from({ length: 250 }, (_, i): Effect => ({
    id: 90000 + i,
    x: 0,
    z: 0,
    type: i === 249 ? "slash" : "spark",
    life: 2,
    maxLife: 2,
    radius: 1,
    damage: 0,
    tick: 0,
    color: "#fff",
    angle: 0.25,
    arc: 0.4,
  }));
  const oldSlash = g.effects.at(-1)!;
  g.weapons = { katana: 1 };
  g.aim = { x: 8, z: 0 };
  fire(g, "katana");
  assert.equal(
    oldSlash.angle,
    0.25,
    "dropped slash must not retarget an earlier effect",
  );
  assert.equal(oldSlash.arc, 0.4);
  g.weapons = { molotov: 1 };
  const e = target(g, 8, 0);
  fire(g, "molotov");
  assert.ok(g.bullets.some((b) => b.type === "molotov"));
  g.weapons = {};
  for (let i = 0; i < 20; i++) g.update(0.05, idle);
  assert.ok(
    g.effects.some((e) => e.type === "fire"),
    "gameplay fire survives the cosmetic budget after landing",
  );
  assert.ok(e.hp < e.maxHp);
});

test("Tesla never chains from a reachable target across cover, but resumes after a vehicle burns away", () => {
  const g = arena();
  g.weapons = { lightning: 1 };
  const front = target(g, 2, 0);
  const back = target(g, 5, 0);
  const wall = cover("vehicle");
  g.structures = [wall];
  fire(g, "lightning");
  assert.ok(front.hp < front.maxHp);
  assert.equal(back.hp, back.maxHp);
  wall.hp = 0;
  wall.burningAt = 0;
  fire(g, "lightning");
  assert.equal(back.hp, back.maxHp, "burning wreck still blocks the chain");
  wall.burnedAt = 12;
  fire(g, "lightning");
  assert.ok(back.hp < back.maxHp);
});

test("flame effects dropped at the cosmetic limit cannot rewrite a previous cone", () => {
  const g = arena();
  g.effects = Array.from({ length: 250 }, (_, i): Effect => ({
    id: 80000 + i,
    x: 0,
    z: 0,
    type: i === 249 ? "flamecone" : "spark",
    life: 2,
    maxLife: 2,
    radius: 1,
    damage: 0,
    tick: 0,
    color: "#fff",
    angle: 0.25,
    arc: 0.4,
  }));
  const cone = g.effects.at(-1)!;
  g.weapons = { flamethrower: 1 };
  g.aim = { x: 10, z: 0 };
  const enemy = target(g, 4, 0);
  fire(g, "flamethrower");
  assert.equal(cone.angle, 0.25);
  assert.equal(cone.arc, 0.4);
  assert.ok(
    enemy.hp < enemy.maxHp,
    "actual damage is independent of the cosmetic budget",
  );
  assert.ok(g.enemyBurns.has(enemy.id));
});

test("all four projectile weapons stop at vehicle and prop cover, including evolution with maximum pierce", () => {
  for (const w of ["pistol", "shotgun", "sniper", "frost"] as const) {
    for (const kind of ["vehicle", "barrier"] as const) {
      const g = arena();
      g.weapons = { [w]: 6 };
      g.evolved.add(w);
      g.passives = { pierce: 5 };
      g.passiveStrength = { pierce: 7.5 };
      g.aim = { x: 20, z: 0 };
      const enemy = w === "frost" ? target(g, 0, 5) : target(g, 5, 0);
      g.structures = [
        w === "frost" ? cover(kind, { x: 0, z: 3, w: 8, d: 0.5 }) : cover(kind),
      ];
      fire(g, w);
      g.weapons = {};
      for (let i = 0; i < 20; i++) g.update(0.05, idle);
      assert.equal(enemy.hp, enemy.maxHp, `${w} must stop at ${kind} cover`);
    }
  }
});

test("orbit and molotov hit a large boss at the edge of damage radius across a spatial cell boundary", () => {
  const orbit = arena();
  orbit.player = { x: 3, z: 0 };
  orbit.weapons = { orbit: 1 };
  orbit.spawnEnemy("boss", 5.1, 2.53, 0);
  const boss = orbit.enemies[0];
  boss.speed = 0;
  fire(orbit, "orbit");
  assert.ok(
    boss.hp < boss.maxHp,
    "the boss hull overlaps a blade even when its center is in the next grid cell",
  );
  const molotov = arena();
  molotov.spawnEnemy("boss", 10.1, 0, 0);
  const fireBoss = molotov.enemies[0];
  fireBoss.speed = 0;
  (molotov as any).effect("fire", { x: 6, z: 0 }, 2.63, 5, "#ff9900", 100);
  molotov.update(0.05, idle);
  assert.ok(
    fireBoss.hp < fireBoss.maxHp,
    "boss radius must be included in the fire-zone broad phase",
  );
});
