import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  Game as EngineGame,
  CHARACTERS,
  WEAPONS,
  BURN_MAX_STACKS,
  BURN_DURATION,
  BURN_TICK_INTERVAL,
  inCone,
  type Weapon,
  BOSS_SCHEDULE,
  timeText,
  PASSIVES,
  RARITIES,
  rollRarity,
  passiveGainDescription,
  MAGNET_DROP_INTERVAL,
  MEDKIT_HEAL_FRACTION,
  type Passive,
  type Rarity,
  type Bullet,
} from "./engine";
const testGames = new Set<EngineGame>();
class Game extends EngineGame {
  constructor(seed?: number) {
    super(seed);
    testGames.add(this);
  }
}
afterEach(() => {
  for (const game of testGames) game.dispose();
  testGames.clear();
});
const idle = { x: 0, y: 0, dash: false, pulse: false };
test("pause and upgrade choices freeze the survival clock", () => {
  const g = new Game(1);
  g.start(CHARACTERS[0], "normal");
  g.phase = "paused";
  g.update(0.05, idle);
  assert.equal(g.time, 0);
  g.phase = "playing";
  g.addDrops({ id: 998, x: 0, z: 0, type: "xp", value: 100, age: 0 });
  g.update(0.05, idle);
  assert.equal(g.phase, "upgrade");
  const t = g.time;
  g.update(0.05, idle);
  assert.equal(g.time, t);
  assert.equal(g.choices.length, 3);
  let count = 0;
  while (g.phase === "upgrade") {
    g.choose(0);
    count++;
    assert.ok(count < 10);
  }
  assert.ok(count >= 2);
});
test("dash and pulse give escape windows, then respect cooldowns", () => {
  const g = new Game(2);
  g.start(CHARACTERS[0], "normal");
  g.update(0.05, { x: 1, y: 0, dash: true, pulse: true });
  assert.equal(g.dashCooldown, 3);
  assert.equal(g.pulseCooldown, 18);
  assert.ok(g.invincible > 0);
  const d = g.dashCooldown;
  g.update(0.05, { ...idle, dash: true, pulse: true });
  assert.ok(g.dashCooldown < d);
  assert.ok(g.pulseCooldown < 18);
});
test("evolution requires a level 6 weapon and level 3 partner", () => {
  const g = new Game(4);
  g.start(CHARACTERS[0], "normal");
  g.weapons.pistol = 6;
  g.passives.power = 3;
  g.weapons.shotgun = 6;
  g.weapons.orbit = 6;
  g.weapons.molotov = 6;
  g.weapons.lightning = 6;
  g.weapons.frost = 6;
  g.passives.haste = 5;
  g.passives.boots = 5;
  g.passives.magnet = 5;
  g.passives.armor = 5;
  g.passives.vitality = 5;
  g.addDrops({ id: 998, x: 0, z: 0, type: "chest", value: 1, age: 0 });
  g.update(0.05, idle);
  assert.ok(g.choices.some((c) => c.evolution));
  const index = g.choices.findIndex((c) => c.evolution);
  const chosen = g.choices[index];
  g.choose(index);
  assert.ok(g.evolved.has(chosen.id as Weapon));
});
test("late bosses must spawn even when the ordinary enemy pool is full", () => {
  const g = new Game(8);
  g.start(CHARACTERS[0], "normal");
  g.time = 299.99;
  for (let i = 0; i < 520; i++) g.spawnEnemy("walker", 20, 20);
  g.update(0.05, idle);
  assert.equal(g.enemies.filter((e) => e.kind === "boss").length, 1);
  assert.equal(g.bossesSpawned, 1);
});
test("a full 1800-second encounter schedule runs with bounded entity pools", () => {
  const g = new Game(71);
  g.start(CHARACTERS[0], "relaxed");
  for (const w of Object.keys(WEAPONS) as Weapon[]) g.weapons[w] = 6;
  g.passives = {
    pierce: 5,
    power: 5,
    haste: 5,
    armor: 5,
    boots: 5,
    vitality: 5,
    magnet: 5,
  };
  const stages = new Set<number>();
  let maxEnemies = 0,
    maxBullets = 0,
    maxDrops = 0;
  // Invulnerability isolates content scheduling from a human movement skill test.
  for (let frame = 0; frame < 36100; frame++) {
    g.invincible = 1;
    if (g.phase === "upgrade") {
      g.choose(
        g.choices.findIndex((c) => c.evolution) >= 0
          ? g.choices.findIndex((c) => c.evolution)
          : 0,
      );
    }
    g.update(0.05, {
      x: Math.cos(g.time * 0.23),
      y: Math.sin(g.time * 0.23),
      dash: false,
      pulse: true,
    });
    stages.add(g.stage);
    maxEnemies = Math.max(maxEnemies, g.enemies.length);
    maxBullets = Math.max(maxBullets, g.bullets.length);
    maxDrops = Math.max(maxDrops, g.drops.length);
    assert.ok(Number.isFinite(g.player.x) && Number.isFinite(g.hp));
  }
  assert.ok(g.time >= 1800);
  assert.equal(g.bossesSpawned, 6);
  assert.equal(g.suppliesSpawned, 15);
  assert.ok(g.healsDropped <= 31);
  assert.ok(BOSS_SCHEDULE.every((t) => stages.has(t / 60)));
  assert.ok(g.kills > 1000);
  assert.ok(maxEnemies <= 521);
  assert.ok(maxBullets <= 700);
  assert.ok(maxDrops < 1200);
  console.log(
    JSON.stringify({
      seconds: Math.round(g.time),
      kills: g.kills,
      bossKills: g.bossKills,
      maxEnemies,
      maxBullets,
      maxDrops,
      level: g.level,
    }),
  );
});
test("30 minutes starts final combat; only all six boss deaths clear the stage", () => {
  const g = new Game(42);
  g.start(CHARACTERS[0], "normal");
  g.weapons = {};
  g.time = 1799.95;
  g.bossesSpawned = 5;
  for (let i = 0; i < 5; i++) g.defeatedBosses.add(i);
  g.bossKills = 5;
  g.update(0.05, idle);
  assert.equal(g.bossesSpawned, 6);
  assert.equal(g.phase, "playing");
  const boss = g.enemies.find((e) => e.kind === "boss" && e.bossIndex === 5)!;
  assert.ok(boss && boss.hp > 0);
  g.time = 1850;
  g.update(0.05, idle);
  assert.equal(g.phase, "playing", "overtime cannot end a living final boss");
  g.hit(boss, boss.hp + 1, 0, "pistol");
  g.update(0.05, idle);
  assert.equal(g.phase, "victory");
  g.start(CHARACTERS[0], "normal");
  assert.equal(g.defeatedBosses.size, 0);
});
test("each of six bosses spawns at its exact five-minute boundary, once", () => {
  const g = new Game(22);
  g.start(CHARACTERS[0], "normal");
  g.weapons = {};
  for (const [i, t] of BOSS_SCHEDULE.entries()) {
    g.enemies = [];
    g.time = t - 0.1;
    g.invincible = 1;
    g.update(0.05, idle);
    assert.equal(g.bossesSpawned, i);
    assert.equal(
      g.enemies.some((e) => e.kind === "boss"),
      false,
    );
    g.update(0.05, idle);
    assert.equal(g.bossesSpawned, i + 1);
    const boss = g.enemies.find((e) => e.kind === "boss")!;
    assert.equal(boss.bossIndex, i);
    assert.equal(boss.spawnedAt, t);
    g.update(0.05, idle);
    assert.equal(g.enemies.filter((e) => e.kind === "boss").length, 1);
  }
});
test("every character can start fresh after a failed or completed run", () => {
  const g = new Game(99);
  for (const c of CHARACTERS) {
    g.start(c, "normal", 2);
    assert.equal(g.hp, c.hp + 10);
    assert.equal(g.weapons[c.weapon], 1);
    g.phase = "dead";
    g.kills = 20;
    g.evolved.add(c.weapon);
  }
  g.start(CHARACTERS[0], "normal");
  assert.equal(g.kills, 0);
  assert.equal(g.bossesSpawned, 0);
  assert.equal(g.evolved.size, 0);
});

test("fatal contact ends the frame before a supply chest can revive the player", () => {
  const g = new Game(17);
  g.start(CHARACTERS[0], "normal");
  g.hp = 1;
  g.invincible = 0;
  g.spawnEnemy("walker", 0, 0);
  g.addDrops({ id: 999, x: 0, z: 0, type: "chest", value: 1, age: 0 });
  g.update(0.05, idle);
  assert.equal(g.phase, "dead");
  assert.equal(g.hp, 0);
  assert.equal(g.crates, 0);
});

const worldInput = (x: number, z: number, dash = false) => ({
  x: (x - z) * Math.SQRT1_2,
  y: (x + z) * Math.SQRT1_2,
  dash,
  pulse: false,
});
test("a dash stops at the entry wall instead of tunnelling into or across a building", () => {
  const g = new Game(33);
  g.start(CHARACTERS[0], "normal");
  g.weapons = {};
  const b = g.buildings.find((b) => b.x === 18 && b.z === 18)!;
  g.player = { x: b.x - b.w / 2 - 0.6, z: b.z };
  g.update(0.05, worldInput(1, 0, true));
  assert.ok(g.player.x <= b.x - b.w / 2 - 0.45 + 0.001);
  for (let i = 0; i < 50; i++) g.update(0.05, worldInput(1, 0));
  assert.ok(g.player.x <= b.x - b.w / 2 - 0.45 + 0.001);
  g.damageBuilding(b, b.maxHp);
  for (let i = 0; i < 35; i++) g.update(0.05, worldInput(1, 0));
  assert.ok(
    g.player.x > b.x + b.w / 2,
    "collapsed structure must open the passage",
  );
});
test("swept friendly and hostile projectiles stop at intact buildings", () => {
  for (const type of ["pistol", "acid"] as const) {
    const g = new Game(41);
    g.start(CHARACTERS[0], "normal");
    g.weapons = {};
    g.player = { x: 30, z: 18 };
    g.invincible = 0;
    g.spawnEnemy("brute", 26, 18);
    const enemy = g.enemies[0],
      hp = enemy.hp;
    const building = g.buildings.find((b) => b.x === 18 && b.z === 18)!;
    g.addBullets({
      id: 9000,
      x: 10,
      z: 18,
      vx: 400,
      vz: 0,
      life: 1,
      damage: 100,
      radius: 0.2,
      pierceChance: 1,
      type,
      hit: new Set(),
    });
    g.update(0.05, idle);
    assert.equal(enemy.hp, hp);
    assert.equal(g.hp, g.maxHp);
    assert.ok(building.hp < building.maxHp);
    assert.ok(!g.bullets.some((b) => b.id === 9000));
  }
});
test("fog distinguishes unseen, remembered and visible terrain; collapse opens sight", () => {
  const g = new Game(62);
  g.start(CHARACTERS[0], "normal");
  g.player = { x: 10, z: 18 };
  g.updateVision();
  const beyond = { x: 25, z: 18 };
  assert.equal(g.canSee(beyond), false);
  assert.equal(g.hasExplored(beyond), false);
  const b = g.buildings.find((b) => b.x === 18 && b.z === 18)!;
  g.damageBuilding(b, b.maxHp);
  g.updateVision();
  assert.equal(g.canSee(beyond), true);
  assert.equal(g.hasExplored(beyond), true);
  g.player = { x: -30, z: 0 };
  g.updateVision();
  assert.equal(g.canSee(beyond), false);
  assert.equal(g.hasExplored(beyond), true);
  g.start(CHARACTERS[0], "normal");
  assert.equal(g.hasExplored(beyond), false);
  assert.equal(g.buildings.find((c) => c.id === b.id)!.hp, b.maxHp);
});
test("mouse-directed fire never auto-targets an enemy hidden behind cover", () => {
  const g = new Game(10);
  g.start(CHARACTERS[0], "normal");
  g.player = { x: 10, z: 18 };
  g.spawnEnemy("boss", 26, 18, 1);
  const e = g.enemies[0];
  g.weapons = { pistol: 6, lightning: 6, molotov: 6 };
  g.update(0.05, { ...idle, aim: { x: 10, z: 35 } });
  assert.equal(e.hp, e.maxHp);
  assert.ok(g.bullets.length > 0);
  assert.ok(g.bullets.every((b) => Math.abs(b.vx) < 4));
});
test("elite kills give no supply chest and collecting a chest gives no free health", () => {
  const g = new Game(81);
  g.start(CHARACTERS[0], "normal");
  g.weapons = {};
  g.level = 40;
  g.spawnEnemy("elite", 2, 0);
  g.update(0.05, { ...idle, pulse: true });
  assert.ok(g.kills >= 1);
  assert.equal(g.drops.filter((d) => d.type === "chest").length, 0);
  g.hp = 50;
  g.phase = "playing";
  g.addDrops({
    id: 8888,
    x: g.player.x,
    z: g.player.z,
    age: 0,
    type: "chest",
    value: 1,
  });
  g.update(0.05, idle);
  assert.equal(g.hp, 50);
  assert.equal(g.crates, 1);
});
test("fully evolved gear cannot erase the ten-minute boss in five seconds", () => {
  const g = new Game(24);
  g.start(CHARACTERS[0], "normal");
  g.time = 600;
  g.stage = 10;
  g.bossesSpawned = 2;
  for (const w of Object.keys(WEAPONS) as Weapon[]) {
    g.weapons[w] = 6;
    g.evolved.add(w);
  }
  g.passives = {
    pierce: 5,
    power: 5,
    haste: 5,
    armor: 5,
    boots: 5,
    magnet: 5,
    vitality: 5,
  };
  g.spawnEnemy("boss", 4, 0, 1);
  const boss = g.enemies[0];
  for (let i = 0; i < 100; i++) {
    g.invincible = 1;
    if (g.phase === "upgrade") g.choose(0);
    g.update(0.05, idle);
  }
  assert.ok(
    boss.hp > boss.maxHp * 0.25,
    `boss has ${boss.hp}/${boss.maxHp} HP after five seconds`,
  );
});

test("overlapping fire patches use the strongest burn rather than multiply boss DPS", () => {
  const run = (patches: number) => {
    const g = new Game(51);
    g.start(CHARACTERS[0], "normal");
    g.weapons = {};
    g.spawnEnemy("brute", 4, 0);
    const target = g.enemies[0];
    target.hp = 100000;
    for (let i = 0; i < patches; i++)
      g.addEffects({
        id: 5000 + i,
        x: 4,
        z: 0,
        type: "fire",
        life: 5,
        maxLife: 5,
        radius: 5,
        damage: 40,
        tick: 0,
        color: "#f80",
      });
    g.update(0.05, idle);
    return 100000 - target.hp;
  };
  assert.equal(run(1), 40);
  assert.equal(run(8), 40);
});
test("pulse clears nearby acid projectiles as well as pushing enemies", () => {
  const g = new Game(37);
  g.start(CHARACTERS[0], "normal");
  g.weapons = {};
  g.addBullets({
    id: 9991,
    x: 6,
    z: 0,
    vx: -9,
    vz: 0,
    life: 5,
    damage: 40,
    radius: 0.3,
    pierceChance: 0,
    type: "acid",
    hit: new Set(),
  });
  g.update(0.05, { ...idle, pulse: true });
  assert.ok(!g.bullets.some((b) => b.id === 9991));
  assert.equal(g.pulsesUsed, 1);
});
test("zombies attack cover without walking through it and siege damage is bounded", () => {
  const g = new Game(14);
  g.start(CHARACTERS[0], "normal");
  g.weapons = {};
  g.invincible = 100;
  g.player = { x: 10, z: 18 };
  const wall = g.buildings.find((b) => b.x === 18 && b.z === 18)!;
  for (let i = 0; i < 80; i++) g.spawnEnemy("walker", 25, 18);
  for (let i = 0; i < 80; i++) g.update(0.05, idle);
  assert.ok(wall.hp < wall.maxHp);
  assert.ok(wall.hp > wall.maxHp - 120);
  for (const e of g.enemies)
    assert.ok(
      !(
        Math.abs(e.x - wall.x) < wall.w / 2 &&
        Math.abs(e.z - wall.z) < wall.d / 2
      ),
    );
});

import { contains, segmentHit, toWorld, VEHICLE_BURN_SECONDS } from "./terrain";
import { BattlefieldFog } from "./fog";
test("rotated cars block swept movement and shots, burn, then open their hull", () => {
  const g = new Game(87);
  g.start(CHARACTERS[0], "normal");
  g.weapons = {};
  for (const car of g.vehicles) {
    const from = toWorld({ x: -4, z: 0 }, car),
      to = toWorld({ x: 4, z: 0 }, car);
    assert.ok(segmentHit(from, to, car, 0.2)! > 0);
    assert.ok(contains(car, car));
  }
  const car = g.vehicles[0];
  g.player = toWorld({ x: -car.w / 2 - 0.6, z: 0 }, car);
  const before = g.player.x;
  g.update(0.05, worldInput(1, 0, true));
  assert.ok(g.player.x < car.x - car.w / 2 - 0.44);
  assert.ok(g.player.x >= before);
  g.addBullets({
    id: 9876,
    x: car.x - 4,
    z: car.z,
    vx: 160,
    vz: 0,
    life: 1,
    damage: 50,
    radius: 0.17,
    pierceChance: 1,
    type: "pistol",
    hit: new Set(),
  });
  g.update(0.05, idle);
  assert.ok(car.hp < car.maxHp);
  assert.equal(
    g.bullets.some((b) => b.id === 9876),
    false,
  );
  g.damageBuilding(car, car.maxHp);
  assert.equal(car.hp, 0);
  assert.ok(car.burningAt >= 0);
  assert.equal(car.burnedAt, -1);
  assert.ok(
    segmentHit({ x: car.x - 4, z: car.z }, { x: car.x + 4, z: car.z }, car)! >
      0,
  );
  g.time = car.burningAt + VEHICLE_BURN_SECONDS - 0.1;
  g.invincible = 1;
  g.update(0.05, idle);
  assert.equal(car.burnedAt, -1);
  g.update(0.05, idle);
  assert.ok(car.burnedAt >= 0);
  assert.equal(
    segmentHit({ x: car.x - 4, z: car.z }, { x: car.x + 4, z: car.z }, car),
    null,
  );
  const hull = car;
  g.start(CHARACTERS[0], "normal");
  assert.equal(g.vehicles[0].hp, g.vehicles[0].maxHp);
  assert.notEqual(g.vehicles[0], hull);
});
test("fog display eases in and out, retains exploration and resets per run", () => {
  const g = new Game(65);
  g.start(CHARACTERS[0], "normal");
  const fog = new BattlefieldFog();
  const pixels = fog.texture.image.data as Uint8Array;
  const i = g.visible.findIndex((v) => v === 255);
  fog.update(g, 0.05);
  assert.ok(pixels[i * 4 + 1] > 0 && pixels[i * 4 + 1] < 255);
  for (let n = 0; n < 40; n++) fog.update(g, 0.05);
  assert.ok(pixels[i * 4 + 1] >= 253);
  g.visible[i] = 0;
  fog.update(g, 0.05);
  assert.ok(pixels[i * 4 + 1] > 0 && pixels[i * 4 + 1] < 253);
  for (let n = 0; n < 80; n++) fog.update(g, 0.05);
  assert.equal(pixels[i * 4 + 1], 0);
  assert.equal(pixels[i * 4], 255);
  g.start(CHARACTERS[0], "normal");
  g.visible.fill(0);
  g.explored.fill(0);
  fog.update(g, 0.05);
  assert.equal(pixels[i * 4], 0);
  fog.dispose();
});
test("street props retain their collision hull under unlimited damage", () => {
  const g = new Game(12);
  g.start(CHARACTERS[0], "normal");
  for (const prop of g.props) {
    assert.ok(contains(prop, prop));
    g.damageBuilding(prop, prop.maxHp);
    assert.equal(prop.hp, prop.maxHp);
    assert.equal(prop.collapsedAt, -1);
    assert.equal(contains(prop, prop), true);
  }
});

test("clock text agrees with exact schedule boundaries despite floating point drift", () => {
  for (const t of BOSS_SCHEDULE) {
    assert.equal(timeText(t - 1e-9), `${String(t / 60).padStart(2, "0")}:00`);
    assert.equal(
      timeText(t - 0.05),
      `${String(t / 60 - 1).padStart(2, "0")}:59`,
    );
  }
});

// Isolated fixtures exercise contact semantics without AI, automatic firing or spawning.
function arena() {
  const g = new Game(101);
  g.start(CHARACTERS[0], "normal");
  g.weapons = {};
  g.enemies = [];
  g.structures = [];
  g.buildings = [];
  g.vehicles = [];
  g.props = [];
  g.boundary = [];
  g.invincible = 1e6;
  g.spawnClock = 1e9;
  g.eliteClock = 1e9;
  g.nextXp = 1e6;
  return g;
}
function bullet(chance: number): Bullet {
  return {
    id: 99000,
    x: 0,
    z: 0,
    vx: 240,
    vz: 0,
    life: 2,
    radius: 0.17,
    damage: 5,
    type: "pistol",
    pierceChance: chance,
    hit: new Set(),
  };
}
function passiveChoice(g: Game, p: Passive, rarity: Rarity) {
  g.phase = "upgrade";
  g.choices = [
    {
      id: p,
      title: PASSIVES[p].name,
      description: passiveGainDescription(p, rarity),
      rarity,
      level: (g.passives[p] || 0) + 1,
      evolution: false,
    },
  ];
  g.choose(0);
}
test("all friendly projectiles including evolutions start at zero penetration", () => {
  const g = arena();
  g.spawnEnemy("brute", 5, 0);
  g.rebuildGrid();
  g.updateVision();
  for (const w of ["pistol", "shotgun", "frost"] as Weapon[]) {
    g.weapons[w] = 6;
    g.evolved.add(w);
    g.fire(w);
  }
  assert.ok(g.bullets.length > 10);
  assert.ok(g.bullets.every((b) => b.pierceChance === 0));
  passiveChoice(g, "pierce", "common");
  assert.equal(g.pierceChance(), 0.1);
  for (let i = 1; i < 5; i++) passiveChoice(g, "pierce", "common");
  assert.equal(g.pierceChance(), 0.5);
  g.start(CHARACTERS[0], "normal");
  assert.equal(g.pierceChance(), 0);
  for (let i = 0; i < 5; i++) passiveChoice(g, "pierce", "rare");
  assert.equal(g.pierceChance(), 0.75);
  assert.equal(g.passives.pierce, 5);
  g.projectile(g.player, 0, 20, 10, 0.2, 2, "acid");
  assert.equal(g.bullets.at(-1)!.pierceChance, 0);
});
test("zero penetration hits only the first enemy, regardless of insertion order", () => {
  const g = arena();
  g.spawnEnemy("brute", 8, 0);
  g.spawnEnemy("brute", 4, 0);
  const [far, near] = g.enemies;
  far.speed = near.speed = 0;
  g.addBullets(bullet(0));
  g.update(0.05, idle);
  assert.equal(near.hp, near.maxHp - 5);
  assert.equal(far.hp, far.maxHp);
  assert.equal(g.bullets.length, 0);
});
test("penetration rolls again at each contact and cannot hit the same enemy twice", () => {
  for (const roll of [0.09, 0.11]) {
    const g = arena();
    g.random = () => roll;
    for (const x of [4, 8]) {
      g.spawnEnemy("brute", x, 0);
      g.enemies.at(-1)!.speed = 0;
    }
    g.addBullets(bullet(0.1));
    g.update(0.05, idle);
    assert.equal(g.enemies[0].hp, g.enemies[0].maxHp - 5);
    assert.equal(g.enemies[1].hp, g.enemies[1].maxHp - (roll < 0.1 ? 5 : 0));
  }
  const g = arena();
  g.spawnEnemy("brute", 4, 0);
  const e = g.enemies[0];
  e.speed = 0;
  const b = bullet(1);
  g.addBullets(b);
  g.update(0.05, idle);
  b.x = 0;
  g.update(0.05, idle);
  assert.equal(e.hp, e.maxHp - 5);
});
test("passive rarity distribution and weighted effects agree with displayed bonuses", () => {
  const counts = { common: 0, uncommon: 0, rare: 0 };
  for (let i = 0; i < 10000; i++) counts[rollRarity((i + 0.5) / 10000)]++;
  assert.deepEqual(counts, { common: 7000, uncommon: 2500, rare: 500 });
  const g = arena();
  const hp = g.maxHp;
  passiveChoice(g, "vitality", "rare");
  assert.equal(g.maxHp, hp + 45);
  passiveChoice(g, "power", "uncommon");
  assert.equal(g.passiveValue("power"), 1.25);
  assert.equal(g.passives.power, 1);
  assert.match(passiveGainDescription("pierce", "uncommon"), /12.5%p/);
  assert.match(passiveGainDescription("power", "rare"), /30%/);
  assert.deepEqual(
    Object.values(RARITIES).map((r) => r.name),
    ["일반", "고급", "희귀"],
  );
  g.weapons.pistol = 6;
  g.passives.power = 2;
  g.passiveStrength.power = 3;
  assert.ok(
    !g.eligible().some((u) => u.id === "pistol" && u.evolution),
    "stronger rarity does not bypass three upgrade levels",
  );
  g.offerUpgrades();
  assert.ok(g.choices.every((u) => u.id in PASSIVES === !!u.rarity));
});
test("four continuous boundary walls stop movement, dash and penetrative bullets", () => {
  const g = new Game(52);
  g.start(CHARACTERS[0], "normal");
  g.weapons = {};
  assert.equal(g.boundary.length, 4);
  for (const [x, z] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]) {
    g.player = { x: x * 64, z: z * 64 };
    g.dashCooldown = 0;
    for (let i = 0; i < 20; i++) g.update(0.05, worldInput(x, z, i === 0));
    assert.ok(Math.abs(g.player.x) <= 64.551 && Math.abs(g.player.z) <= 64.551);
  }
  for (const wall of g.boundary) {
    g.damageBuilding(wall, 1e9);
    assert.equal(wall.hp, wall.maxHp);
  }
  g.player = { x: 60, z: 0 };
  const b = bullet(1);
  b.x = 60;
  g.addBullets(b);
  g.update(0.05, idle);
  assert.ok(!g.bullets.some((b) => b.id === 99000));
});
test("magnet pickup starts flight across walls, preserving XP until absorption", () => {
  const g = new Game(52);
  g.start(CHARACTERS[0], "normal");
  g.weapons = {};
  g.nextXp = 1e6;
  g.invincible = 1e6;
  g.player = { x: 10, z: 18 };
  const orb = {
    id: 40000,
    x: 40,
    z: 18,
    type: "xp" as const,
    value: 31,
    age: 0,
  };
  g.addDrops(orb, {
    id: 40001,
    x: 10,
    z: 18,
    type: "magnet",
    value: 1,
    age: 0,
  });
  g.update(0.05, idle);
  assert.equal(g.xp, 0);
  assert.equal(orb.attracted, true);
  assert.equal(
    orb.x,
    40,
    "pickup marks existing orbs without teleporting them",
  );
  const future = {
    id: 40002,
    x: -40,
    z: -18,
    type: "xp" as const,
    value: 7,
    age: 0,
  };
  g.addDrops(future);
  g.update(0.05, idle);
  assert.ok(orb.x < 40);
  const x = orb.x;
  g.phase = "paused";
  g.update(0.05, idle);
  assert.equal(orb.x, x);
  g.phase = "playing";
  for (let i = 0; i < 70; i++) g.update(0.05, idle);
  assert.equal(g.xp, 31);
  assert.ok(!g.drops.includes(orb));
  assert.ok(g.drops.includes(future));
  assert.ok(!future.attracted);
});
test("magnetic flight clamps high speeds instead of overshooting the player", () => {
  const g = arena();
  g.drops = [
    {
      id: 90001,
      x: 1,
      z: 0,
      type: "xp",
      value: 17,
      age: 0,
      attracted: true,
      pullSpeed: 60,
    },
  ];
  g.update(0.05, idle);
  assert.equal(g.xp, 17);
  assert.equal(g.drops.length, 0);
});
test("enemy kills drop magnets by chance with a cooldown and at most two active", () => {
  const g = arena();
  g.random = () => 0;
  const kill = () => {
    g.enemies = [];
    g.spawnEnemy("walker", 20, 0);
    const e = g.enemies[0];
    g.hit(e, e.hp + 1);
  };
  kill();
  assert.equal(g.drops.filter((d) => d.type === "magnet").length, 1);
  for (let i = 0; i < 100; i++) kill();
  assert.equal(g.drops.filter((d) => d.type === "magnet").length, 1);
  g.time = MAGNET_DROP_INTERVAL;
  kill();
  assert.equal(g.drops.filter((d) => d.type === "magnet").length, 2);
  g.time += MAGNET_DROP_INTERVAL;
  kill();
  assert.equal(g.drops.filter((d) => d.type === "magnet").length, 2);
  g.drops = [];
  g.random = () => 0.99;
  kill();
  assert.equal(g.drops.filter((d) => d.type === "magnet").length, 0);
});
test("XP merging never adds future kills to an already magnetized orb", () => {
  const g = arena();
  for (let i = 0; i < 901; i++)
    g.addDrops({
      id: 50000 + i,
      x: 30,
      z: 0,
      type: "xp",
      value: 1,
      age: 0,
      attracted: true,
    });
  g.drop({ x: 30, z: 0 }, "xp", 3);
  g.drop({ x: 30, z: 0 }, "xp", 7);
  assert.equal(
    g.drops.filter((d) => d.attracted).reduce((a, d) => a + d.value, 0),
    901,
  );
  assert.equal(
    g.drops.filter((d) => !d.attracted).reduce((a, d) => a + d.value, 0),
    10,
  );
});

import {
  RESEARCH,
  normalizeResearch,
  researchCost,
  purchaseResearch,
} from "./research";
test("directional weapons follow mouse aim rather than a closer enemy or movement", () => {
  const g = arena();
  g.weapons = { pistol: 1, shotgun: 1, sniper: 1 };
  g.spawnEnemy("brute", -4, 0);
  g.update(0.05, { ...worldInput(-1, 0), aim: { x: 30, z: 0 } });
  const friendly = g.bullets.filter((b) => b.type !== "acid");
  assert.ok(friendly.length >= 7);
  assert.ok(friendly.every((b) => b.vx > 0));
  assert.ok(Math.abs(g.facing - Math.PI / 2) < 0.01);
  g.aim = undefined;
  g.facing = Math.PI;
  g.bullets = [];
  g.fire("pistol");
  assert.ok(g.bullets.every((b) => b.vz < 0));
});
test("katana hits the front arc, shows a sweep and respects intact cover", () => {
  const g = arena();
  g.weapons = { katana: 1 };
  for (const [x, z] of [
    [2, 0],
    [-2, 0],
    [8, 0],
  ]) {
    g.spawnEnemy("brute", x, z);
    g.enemies.at(-1)!.speed = 0;
  }
  const [front, back, far] = g.enemies;
  g.update(0.05, { ...idle, aim: { x: 20, z: 0 } });
  assert.ok(front.hp < front.maxHp);
  assert.equal(back.hp, back.maxHp);
  assert.equal(far.hp, far.maxHp);
  assert.ok(g.effects.some((e) => e.type === "slash"));
  assert.ok(inCone({ x: 0, z: 0 }, Math.PI / 2, 4, 0.6, { x: 3, z: 0.5 }));
  const wall = { ...new Game().props[0], x: 1, z: 0, w: 0.5, d: 4 };
  g.structures = [wall];
  front.hp = front.maxHp;
  g.fire("katana");
  assert.equal(front.hp, front.maxHp);
});
test("sniper has high damage, long range, slow cadence, a blocked aim line and a bounded final step", () => {
  const g = arena();
  g.weapons = { sniper: 1 };
  g.aim = { x: 50, z: 0 };
  g.fire("sniper");
  const b = g.bullets[0];
  assert.equal(b.damage, 270);
  assert.equal(g.cooldowns.sniper, 3.8);
  assert.equal(g.sniperRange(), 45);
  assert.equal(b.life * 85, 45);
  const wall = { ...new Game().props[0], x: 9, z: 0, w: 1, d: 5 };
  g.structures = [wall];
  assert.ok(g.aimEnd(45).x < 9);
  g.structures = [];
  const last = { ...b, life: 0.01, vx: 100, vz: 0, x: 0, z: 0 };
  g.bullets = [last];
  g.update(0.05, idle);
  assert.equal(last.x, 1);
  assert.equal(g.bullets.length, 0);
  assert.equal(g.bullets.at(0), undefined);
  assert.equal(b.x, 0); // Expired copy never mutates its originating projectile.
});
test("flamethrower hits multiple enemies at a cadence, then burns on a separate tick", () => {
  const g = arena();
  g.weapons = { flamethrower: 1 };
  g.aim = { x: 20, z: 0 };
  for (const z of [-1, 1]) {
    g.spawnEnemy("brute", 4, z);
    const e = g.enemies.at(-1)!;
    e.speed = 0;
    e.hp = e.maxHp = 10000;
  }
  g.update(0.05, { ...idle, aim: g.aim });
  const [a, b] = g.enemies;
  assert.equal(a.hp, 9994);
  assert.equal(b.hp, 9994);
  assert.equal(g.enemyBurns.get(a.id)!.stacks.length, 1);
  for (let i = 0; i < 3; i++) g.update(0.05, { ...idle, aim: { x: 20, z: 0 } });
  assert.equal(a.hp, 9994, "no per-frame direct damage");
  g.update(0.05, { ...idle, aim: { x: 20, z: 0 } });
  assert.equal(a.hp, 9988);
  assert.equal(g.enemyBurns.get(a.id)!.stacks.length, 2);
  g.weapons = {};
  const hp = a.hp;
  for (let i = 0; i < 6; i++) g.update(0.05, idle);
  assert.equal(a.hp, hp - 14, "two live stacks tick together after .5 seconds");
});
test("burn stacks are capped and expire individually while pause freezes them", () => {
  const g = arena();
  g.spawnEnemy("brute", 5, 0);
  const e = g.enemies[0];
  e.speed = 0;
  e.hp = e.maxHp = 10000;
  g.addBurn(e, 7, g.enemyBurns);
  g.time = 0.4;
  g.addBurn(e, 9, g.enemyBurns);
  assert.equal(g.enemyBurns.get(e.id)!.stacks.length, 2);
  g.time = BURN_DURATION + 0.1;
  g.updateBurns();
  assert.equal(g.enemyBurns.get(e.id)!.stacks.length, 1);
  for (let i = 0; i < 20; i++) g.addBurn(e, 7, g.enemyBurns);
  assert.equal(g.enemyBurns.get(e.id)!.stacks.length, BURN_MAX_STACKS);
  const expires = g.enemyBurns.get(e.id)!.stacks[0].expiresAt;
  g.phase = "paused";
  g.update(0.05, idle);
  assert.equal(g.enemyBurns.get(e.id)!.stacks[0].expiresAt, expires);
  g.phase = "playing";
  g.time = expires + 0.01;
  g.updateBurns();
  assert.equal(g.enemyBurns.size, 0);
  g.start(CHARACTERS[0], "normal");
  assert.equal(g.enemyBurns.size, 0);
});
test("flame burns buildings and vehicles but never indestructible props or targets behind them", () => {
  const g = arena();
  const original = new Game();
  const car = { ...original.vehicles[0], x: 4, z: 0, rotation: 0, w: 1, d: 2 };
  const prop = { ...original.props[0], x: 3, z: 3, w: 1, d: 1 };
  g.structures = [car, prop];
  g.rebuildGrid();
  g.coneHit(Math.PI / 2, 6, 1, 6, "flamethrower", 7);
  assert.ok(car.hp < car.maxHp);
  assert.equal(prop.hp, prop.maxHp);
  assert.equal(g.structureBurns.size, 1);
  const hp = car.hp;
  g.time = BURN_TICK_INTERVAL;
  g.updateBurns();
  assert.ok(car.hp < hp);
  g.time = BURN_DURATION + 0.01;
  g.updateBurns();
  assert.equal(g.structureBurns.size, 0);
});
test("XP and range bonuses apply actual graded strength; extra projectiles remain integer and always rare", () => {
  const g = arena();
  g.weapons = { pistol: 1 };
  passiveChoice(g, "experience", "rare");
  g.gainXp(10);
  assert.ok(Math.abs(g.xp - 11.8) < 1e-10);
  passiveChoice(g, "range", "uncommon");
  assert.equal(g.rangeScale(), 1.1875);
  passiveChoice(g, "multishot", "rare");
  assert.equal(g.extraProjectiles(), 1);
  assert.equal(g.passiveValue("multishot"), 1);
  g.aim = { x: 30, z: 0 };
  g.weapons = { pistol: 1, shotgun: 1, sniper: 1, frost: 1 };
  for (const w of Object.keys(g.weapons) as Weapon[]) g.fire(w);
  assert.equal(g.bullets.filter((b) => b.type === "pistol").length, 2);
  assert.equal(g.bullets.filter((b) => b.type === "shotgun").length, 6);
  assert.equal(g.bullets.filter((b) => b.type === "sniper").length, 2);
  assert.equal(g.bullets.filter((b) => b.type === "frost").length, 11);
  g.passives = Object.fromEntries(Object.keys(PASSIVES).map((p) => [p, 5]));
  g.passives.multishot = 0;
  for (const w of Object.keys(WEAPONS) as Weapon[]) {
    g.weapons[w] = 6;
    g.evolved.add(w);
  }
  g.offerUpgrades();
  assert.equal(g.choices[0].id, "multishot");
  assert.equal(g.choices[0].rarity, "rare");
  g.passives.multishot = 3;
  assert.ok(!g.eligible().some((u) => u.id === "multishot"));
});
test("new weapons enter the choice pool but a six-weapon loadout keeps its upgrades", () => {
  const g = arena();
  assert.ok(
    ["katana", "sniper", "flamethrower"].every((w) =>
      g.eligible().some((u) => u.id === w),
    ),
  );
  g.weapons = {
    pistol: 1,
    shotgun: 1,
    orbit: 1,
    molotov: 1,
    lightning: 1,
    frost: 1,
  };
  assert.ok(
    !g
      .eligible()
      .some((u) => ["katana", "sniper", "flamethrower"].includes(u.id)),
  );
  assert.ok(g.eligible().some((u) => u.id === "pistol" && u.level === 2));
});
test("legacy research migrates safely, prices are lower and purchase cannot overspend or exceed caps", () => {
  const migrated = normalizeResearch(
    { dash: 99, experience: NaN, movement: -2 },
    4,
  );
  assert.equal(migrated.protocol, 4);
  assert.equal(migrated.dash, 5);
  assert.equal(migrated.experience, 0);
  assert.equal(migrated.movement, 0);
  assert.equal(researchCost("protocol", 0), 10);
  assert.ok(researchCost("protocol", 9) < 30 + 9 * 20);
  const bought = purchaseResearch(10, {}, "protocol")!;
  assert.equal(bought.credits, 0);
  assert.equal(bought.researches.protocol, 1);
  assert.equal(purchaseResearch(9, {}, "protocol"), null);
  assert.equal(
    purchaseResearch(1000, { dash: RESEARCH.dash.max }, "dash"),
    null,
  );
});
test("Q and Space research shorten cooldowns and old protocol remains compatible", () => {
  const g = arena();
  g.start(CHARACTERS[0], "normal", {
    protocol: 2,
    pulse: 5,
    dash: 5,
    experience: 2,
    damage: 3,
    movement: 2,
    pickup: 2,
  });
  assert.equal(g.maxHp, CHARACTERS[0].hp + 10);
  g.update(0.05, { ...idle, dash: true, pulse: true });
  assert.ok(Math.abs(g.dashCooldown - 2.1) < 1e-9);
  assert.ok(Math.abs(g.pulseCooldown - 12.6) < 1e-9);
  assert.equal(g.xpScale(), 1.1);
  g.start(CHARACTERS[0], "normal", 3);
  assert.equal(g.maxHp, CHARACTERS[0].hp + 15);
});

test("ordinary and boss medkits are identical and heal half the current maximum health", () => {
  const g = new Game(81);
  g.start(CHARACTERS[0], "normal");
  g.weapons = {};
  g.time = 35;
  g.random = () => 0;
  g.spawnEnemy("walker", 8, 0);
  (g as any).hit(g.enemies[0], 1e9);
  const ordinary = g.drops.find((d) => d.type === "heal")!;
  assert.ok(ordinary);
  assert.equal(ordinary.value, MEDKIT_HEAL_FRACTION);
  g.spawnEnemy("boss", 8, 0, 0);
  (g as any).hit(
    g.enemies.find((e) => e.kind === "boss"),
    1e9,
  );
  const kits = g.drops.filter((d) => d.type === "heal");
  assert.equal(kits.length, 2);
  assert.deepEqual(
    kits.map((d) => [d.type, d.value]),
    [
      ["heal", 0.5],
      ["heal", 0.5],
    ],
  );
  // The kit was dropped at 110 max HP; scale from the new max at pickup.
  g.maxHp = 300;
  g.hp = 10;
  ordinary.x = ordinary.z = 0;
  g.drops = [ordinary];
  g.update(0.05, idle);
  assert.equal(g.hp, 160);
  assert.equal(g.drops.length, 0);
});

test("medkits scale with max health, cap at full health, and never use legacy fixed values", () => {
  const g = new Game(82);
  for (const [maxHp, hp, value, expected] of [
    [110, 10, 0.5, 65],
    [200, 10, 0.5, 110],
    [400, 10, 0.5, 210],
    [201, 10, 0.5, 110.5],
    [200, 180, 0.5, 200],
    [200, 200, 0.5, 200],
    [200, 10, 18, 110],
    [200, 10, 50, 110],
  ]) {
    g.start(CHARACTERS[0], "normal");
    g.weapons = {};
    g.maxHp = maxHp;
    g.hp = hp;
    g.addDrops({ id: 99999, x: 0, z: 0, age: 0, type: "heal", value });
    g.update(0.05, idle);
    assert.equal(g.hp, expected);
    assert.equal(g.drops.length, 0);
  }
  g.maxHp = 300;
  g.hp = 10;
  g.phase = "upgrade";
  g.choices = [
    {
      id: "heal",
      title: "응급 처치",
      description: "체력 40 회복",
      level: 1,
      evolution: false,
    },
  ];
  g.choose(0);
  assert.equal(g.hp, 50);
});
