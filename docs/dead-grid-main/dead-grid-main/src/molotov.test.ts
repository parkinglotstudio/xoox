import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { Game, CHARACTERS, molotovHeight } from "./engine";
import { createVehicles, createBarriers } from "./terrain";
const games = new Set<Game>();
const idle = { x: 0, y: 0, dash: false, pulse: false };
function arena() {
  const g = new Game(202);
  games.add(g);
  g.start(CHARACTERS[1], "normal");
  g.structures = [];
  g.buildings = [];
  g.vehicles = [];
  g.props = [];
  g.boundary = [];
  g.invincible = 1e6;
  g.enemies = [];
  (g as any).spawnClock = 1e9;
  (g as any).eliteClock = 1e9;
  return g;
}
afterEach(() => {
  for (const g of games) g.dispose();
  games.clear();
});
function launch(g: Game, x = 8, z = 0) {
  g.aim = { x, z };
  (g as any).fire("molotov");
  g.weapons = {};
  return g.bullets.filter((b) => b.type === "molotov");
}
function advance(g: Game, seconds: number) {
  for (let i = 0; i < Math.ceil(seconds / 0.05); i++) g.update(0.05, idle);
}
test("molotov travels above the ground without contact damage, then creates exactly one fire zone at its locked target", () => {
  const g = arena();
  g.spawnEnemy("brute", 8, 0);
  const enemy = g.enemies[0];
  enemy.speed = 0;
  enemy.hp = enemy.maxHp = 10000;
  const [bottle] = launch(g);
  assert.equal(g.effects.length, 0);
  assert.equal(bottle.x, 0);
  const startHeight = molotovHeight(bottle.flight!);
  advance(g, 0.35);
  assert.ok(bottle.x > 0 && bottle.x < 8);
  assert.ok(molotovHeight(bottle.flight!) > startHeight + 0.5);
  assert.equal(enemy.hp, enemy.maxHp);
  assert.ok(!g.effects.some((e) => e.type === "fire"));
  g.aim = { x: -20, z: 0 };
  advance(g, 0.65);
  const fires = g.effects.filter((e) => e.type === "fire");
  assert.equal(fires.length, 1);
  assert.equal(fires[0].x, 8);
  assert.ok(Math.abs(fires[0].z) < 1e-8);
  assert.equal(molotovHeight(bottle.flight!), 0.16);
  assert.ok(enemy.hp < enemy.maxHp);
  assert.ok(!g.bullets.some((b) => b.id === bottle.id));
});
test("molotov flights and delayed fire freeze through upgrade/pause, and restarting destroys in-flight bottles", () => {
  const g = arena();
  const [b] = launch(g);
  advance(g, 0.2);
  const state = { x: b.x, z: b.z, life: b.life, elapsed: b.flight!.elapsed };
  for (const phase of ["paused", "upgrade"] as const) {
    g.phase = phase;
    advance(g, 2);
    assert.deepEqual(
      { x: b.x, z: b.z, life: b.life, elapsed: b.flight!.elapsed },
      state,
    );
    assert.ok(!g.effects.some((e) => e.type === "fire"));
  }
  g.phase = "playing";
  advance(g, 0.8);
  assert.equal(g.effects.filter((e) => e.type === "fire").length, 1);
  launch(g);
  g.start(CHARACTERS[0], "normal");
  assert.equal(g.bullets.length, 0);
  assert.equal(g.effects.length, 0);
});
test("flying molotovs impact shared cover hulls before their destination, and their fire never hits behind intact cover", () => {
  for (const kind of ["vehicle", "barrier"] as const) {
    const g = arena();
    const wall = {
      ...(kind === "vehicle" ? createVehicles()[0] : createBarriers()[0]),
      x: 3,
      z: 0,
      rotation: 0,
      w: 0.5,
      d: 8,
    };
    g.structures = [wall];
    g.spawnEnemy("brute", 4, 0);
    const e = g.enemies[0];
    e.speed = 0;
    e.hp = e.maxHp = 10000;
    const [b] = launch(g);
    advance(g, 0.5);
    assert.ok(b.life === 0);
    const fire = g.effects.find((e) => e.type === "fire")!;
    assert.ok(fire && fire.x < 2.75 && fire.x > 2.5);
    assert.equal(e.hp, e.maxHp);
    assert.equal(g.bullets.filter((b) => b.type === "molotov").length, 0);
    assert.ok(
      kind === "barrier" ? wall.hp === wall.maxHp : wall.hp < wall.maxHp,
    );
  }
});
test("range, area, evolution and extra projectiles apply to flights and are snapshotted at launch", () => {
  const g = arena();
  g.weapons = { molotov: 6 };
  g.evolved.add("molotov");
  g.passiveStrength = { range: 2, area: 1.5, multishot: 2, power: 1.5 };
  const expectedDamage = g.weaponDamage("molotov"),
    radius = g.molotovRadius();
  const bottles = launch(g, 50);
  assert.equal(bottles.length, 5);
  assert.ok(
    Math.abs(
      Math.hypot(bottles[2].flight!.end.x, bottles[2].flight!.end.z) - 13.52,
    ) < 1e-8,
  );
  assert.ok(
    bottles.every(
      (b) => b.damage === expectedDamage && b.flight!.fireRadius === radius,
    ),
  );
  g.passiveStrength.area = 5;
  g.passiveStrength.power = 5;
  advance(g, 1.5);
  const fires = g.effects.filter((e) => e.type === "fire");
  assert.equal(fires.length, 5);
  assert.ok(
    fires.every((f) => f.damage === expectedDamage && f.radius === radius),
  );
});
test("molotov attacks survive ordinary bullet and cosmetic saturation, and a point-blank throw has a finite landing", () => {
  const g = arena();
  g.bullets = Array.from({ length: 700 }, (_, i) => ({
    id: 90000 + i,
    x: -20,
    z: -20,
    vx: 0,
    vz: 0,
    life: 5,
    damage: 1,
    radius: 0.1,
    pierceChance: 0,
    type: "pistol" as const,
    hit: new Set<number>(),
  }));
  g.effects = Array.from({ length: 250 }, (_, i) => ({
    id: 80000 + i,
    x: 0,
    z: 0,
    type: "spark" as const,
    life: 5,
    maxLife: 5,
    radius: 1,
    damage: 0,
    tick: 0,
    color: "#fff",
  }));
  const [b] = launch(g, 0, 0);
  assert.ok(b.flight!.duration > 0);
  assert.ok(Number.isFinite(molotovHeight(b.flight!)));
  advance(g, 0.4);
  assert.equal(g.effects.filter((e) => e.type === "fire").length, 1);
  assert.ok(Number.isFinite(b.x) && Number.isFinite(b.z));
});
test("frost emits only the original damaging projectiles without a secondary inner particle ring", () => {
  const g = arena();
  g.weapons = { frost: 2 };
  (g as any).fire("frost");
  assert.equal(g.bullets.filter((b) => b.type === "frost").length, 12);
  assert.equal(g.effects.length, 0);
  assert.ok(g.bullets.every((b) => b.damage > 0));
});
