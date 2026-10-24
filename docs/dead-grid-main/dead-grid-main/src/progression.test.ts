import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  Game as EngineGame,
  CHARACTERS,
  WEAPONS,
  PASSIVES,
  passiveGainDescription,
  type Weapon,
  type Passive,
  type Rarity,
} from "./engine";
const games = new Set<EngineGame>();
class Game extends EngineGame {
  constructor() {
    super(101);
    games.add(this);
  }
}
afterEach(() => {
  for (const g of games) g.dispose();
  games.clear();
});
const idle = { x: 0, y: 0, dash: false, pulse: false };
function arena() {
  const g = new Game();
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
function pick(g: Game, p: Passive, rarity: Rarity = "common") {
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
const fullWeapons = {
  pistol: 6,
  shotgun: 1,
  orbit: 1,
  molotov: 1,
  lightning: 1,
  frost: 1,
} as const;

test("a full loadout never offers or accepts evolution of an unowned or underleveled katana", () => {
  const g = arena();
  g.weapons = { ...fullWeapons };
  g.passives = { power: 3 };
  assert.ok(!(g as any).eligible().some((u: any) => u.id === "katana"));
  for (let i = 0; i < 25; i++) {
    (g as any).offerUpgrades();
    assert.ok(!g.choices.some((u) => u.id === "katana"));
  }
  g.choices = [
    {
      id: "katana",
      title: "월광",
      description: "진화",
      level: 7,
      evolution: true,
    },
  ];
  g.phase = "upgrade";
  g.choose(0);
  assert.equal(g.evolved.has("katana"), false);
  assert.equal(g.weapons.katana, undefined);
  delete g.weapons.frost;
  g.weapons.katana = 5;
  assert.ok(
    !(g as any).eligible().some((u: any) => u.id === "katana" && u.evolution),
  );
  g.weapons.katana = 6;
  const card = (g as any)
    .eligible()
    .find((u: any) => u.id === "katana" && u.evolution);
  assert.ok(card);
  g.phase = "upgrade";
  g.choices = [card];
  g.choose(0);
  assert.equal(g.evolved.has("katana"), true);
  g.aim = { x: 10, z: 0 };
  (g as any).fire("katana");
  assert.ok(g.effects.some((e) => e.type === "slash"));
});

test("new katana cards equip the weapon and its slash actually hits in front", () => {
  const g = arena();
  const card = (g as any).eligible().find((u: any) => u.id === "katana");
  assert.equal(card.level, 1);
  assert.equal(card.evolution, false);
  g.phase = "upgrade";
  g.choices = [card];
  g.choose(0);
  assert.equal(g.weapons.katana, 1);
  g.spawnEnemy("brute", 2, 0);
  const target = g.enemies[0];
  target.speed = 0;
  g.update(0.05, { ...idle, aim: { x: 10, z: 0 } });
  assert.ok(target.hp < target.maxHp);
  assert.ok(g.effects.some((e) => e.type === "slash"));
});

test("owned weapon growth remains in the random pool without forcing it into every choice", () => {
  const g = arena();
  g.weapons = { pistol: 3 };
  let ownedOffers = 0;
  for (let i = 0; i < 100; i++) {
    (g as any).offerUpgrades();
    if (g.choices.some((u) => u.id === "pistol" && u.level === 4))
      ownedOffers++;
    assert.equal(new Set(g.choices.map((u) => u.id)).size, g.choices.length);
  }
  assert.ok(ownedOffers > 0 && ownedOffers < 100);
});

test("directional mouse dash works from standstill, ignores WASD while dashing, and shares cooldown", () => {
  const g = arena();
  g.update(0.05, {
    ...idle,
    x: -1,
    y: -1,
    dash: true,
    dashTarget: { x: 20, z: 0 },
  });
  const first = g.player.x;
  assert.ok(first > 0);
  assert.equal(g.player.z, 0);
  assert.equal(g.dashCooldown, 3);
  g.update(0.05, { ...idle, x: -1, y: -1 });
  assert.ok(g.player.x > first);
  assert.equal(g.player.z, 0);
  g.update(0.05, { ...idle, dash: true, dashTarget: { x: 0, z: -20 } });
  assert.equal(g.dashesUsed, 1);
  assert.equal(g.player.z, 0);
  for (let i = 0; i < 5; i++) g.update(0.05, idle);
  const end = g.player.x;
  g.update(0.05, idle);
  assert.equal(g.player.x, end);
  g.dashCooldown = 0;
  g.update(0.05, { ...idle, dash: true, dashTarget: { ...g.player } });
  assert.ok(Number.isFinite(g.player.x) && Number.isFinite(g.player.z));
  g.start(CHARACTERS[0], "normal");
  assert.equal(g.dashesUsed, 0);
  assert.equal(g.dashTime, 0);
});

test("mouse dash respects collision and pause; Space continues to use movement input", () => {
  const g = arena();
  const source = new Game();
  g.structures = [{ ...source.props[0], x: 2, z: 0, w: 1, d: 12 }];
  g.update(0.05, { ...idle, dash: true, dashTarget: { x: 50, z: 0 } });
  for (let i = 0; i < 5; i++) g.update(0.05, idle);
  assert.ok(g.player.x < 1.1);
  assert.equal(g.player.z, 0);
  g.structures = [];
  g.player = { x: 0, z: 0 };
  g.dashCooldown = 0;
  g.update(0.05, { ...idle, dash: true, dashTarget: { x: 20, z: 0 } });
  g.phase = "paused";
  const before = { ...g.player };
  g.update(0.05, idle);
  assert.deepEqual(g.player, before);
  g.phase = "playing";
  g.dashTime = 0;
  g.dashCooldown = 0;
  g.player = { x: 0, z: 0 };
  g.update(0.05, { ...idle, x: -1, y: -1, dash: true });
  assert.ok(g.player.x < 0);
  assert.equal(g.player.z, 0);
});

test("area upgrades widen actual flame hits and visual cones independently of range", () => {
  const g = arena();
  g.weapons = { flamethrower: 1 };
  g.aim = { x: 20, z: 0 };
  const initialRange = g.flameRange();
  assert.equal(g.flameArc(), 0.32);
  g.spawnEnemy("brute", 4, 2.5);
  const target = g.enemies[0];
  target.hp = target.maxHp = 10000;
  target.speed = 0;
  (g as any).rebuildGrid();
  (g as any).fire("flamethrower");
  assert.equal(target.hp, 10000);
  assert.equal(g.effects.at(-1)!.arc, 0.32);
  g.effects = [];
  for (let i = 0; i < 5; i++) pick(g, "area");
  assert.equal(g.flameRange(), initialRange);
  assert.equal(g.flameArc(), 0.64);
  (g as any).fire("flamethrower");
  assert.ok(target.hp < 10000);
  assert.equal(g.effects.at(-1)!.arc, 0.64);
  pick(g, "range", "rare");
  assert.ok(g.flameRange() > initialRange);
  assert.equal(g.flameArc(), 0.64);
  g.passiveStrength.area = 7.5;
  g.evolved.add("flamethrower");
  assert.equal(g.flameArc(), Math.PI / 3);
});

test("molotov area increases fire radius and hits farther enemies, without changing throw distance", () => {
  const g = arena();
  g.weapons = { molotov: 1 };
  g.aim = { x: 5, z: 0 };
  (g as any).fire("molotov");
  (g as any).updateProjectileSystem(2);
  const original = g.effects.find((e) => e.type === "fire")!;
  assert.equal(original.radius, 2.63);
  g.effects = [];
  pick(g, "area", "uncommon");
  assert.equal(g.areaScale(), 1.25);
  (g as any).fire("molotov");
  (g as any).updateProjectileSystem(2);
  const larger = g.effects.find((e) => e.type === "fire")!;
  assert.equal(larger.x, original.x);
  assert.equal(larger.z, original.z);
  assert.equal(larger.radius, original.radius * 1.25);
  g.spawnEnemy("brute", larger.x, larger.z + 3.8);
  const target = g.enemies[0];
  target.hp = target.maxHp = 10000;
  target.speed = 0;
  g.weapons = {};
  g.effects = [original];
  g.update(0.05, idle);
  assert.equal(target.hp, 10000);
  g.effects = [larger];
  (g as any).fireClock = 0;
  g.update(0.05, idle);
  assert.ok(target.hp < 10000);
  g.start(CHARACTERS[0], "normal");
  assert.equal(g.areaScale(), 1);
});

test("irrelevant area and projectile passives are excluded while rarity bonuses remain accurate", () => {
  const g = arena();
  g.weapons = { katana: 1 };
  assert.ok(
    !(g as any)
      .eligible()
      .some((u: any) => ["area", "pierce", "multishot"].includes(u.id)),
  );
  g.weapons.flamethrower = 1;
  assert.ok((g as any).eligible().some((u: any) => u.id === "area"));
  pick(g, "area", "rare");
  assert.equal(g.areaScale(), 1.3);
  assert.match(passiveGainDescription("area", "rare"), /30%/);
  pick(g, "power");
  assert.ok(Math.abs(g.weaponDamage("katana") - 54 * 1.2) < 1e-9);
  const cadence = g.weaponCooldown("katana");
  pick(g, "haste");
  assert.ok(Math.abs(g.weaponCooldown("katana") - cadence * 0.88) < 1e-9);
  const hp = g.maxHp;
  pick(g, "vitality", "rare");
  assert.equal(g.maxHp, hp + 45);
});

test("each weapon rank improves damage by 30 percent and cadence; cards quote actual changes", () => {
  const g = arena();
  for (const w of Object.keys(WEAPONS) as Weapon[]) {
    g.weapons = { [w]: 1 };
    for (let rank = 2; rank <= 6; rank++) {
      const previous = g.weaponDamage(w, rank - 1),
        next = g.weaponDamage(w, rank);
      assert.ok(Math.abs(next / previous - 1.3) < 1e-10);
      assert.ok(g.weaponCooldown(w, rank) < g.weaponCooldown(w, rank - 1));
      const description = g.weaponUpgradeDescription(w, rank);
      assert.match(description, /피해 .* → .*주기/);
      assert.doesNotMatch(description, /undefined|NaN/);
    }
  }
  g.weapons = { pistol: 1 };
  (g as any).fire("pistol");
  assert.equal(g.bullets[0].damage, 23);
  g.bullets = [];
  g.weapons.pistol = 2;
  (g as any).fire("pistol");
  assert.ok(Math.abs(g.bullets[0].damage - 29.9) < 1e-9);
  g.bullets = [];
  g.weapons.pistol = 6;
  g.evolved.add("pistol");
  (g as any).fire("pistol");
  assert.equal(g.bullets.length, 4);
});
