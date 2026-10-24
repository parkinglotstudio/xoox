import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { Game, CHARACTERS, type Enemy } from "./engine";
const games: Game[] = [];
function setup(kind: "spitter" | "boss", index = 0, enraged = false) {
  const game = new Game(24);
  games.push(game);
  game.start(CHARACTERS[0], "normal");
  game.weapons = {};
  game.structures = [];
  game.invincible = 1e9;
  game.spawnEnemy(kind, 0, 8, index);
  const enemy = game.enemies[0];
  enemy.speed = 0;
  enemy.attack = 0;
  if (enraged) enemy.hp = enemy.maxHp * 0.4;
  return { game, enemy };
}
function step(game: Game, seconds: number) {
  for (let i = 0; i < Math.round(seconds / 0.05); i++) {
    game.time += 0.05;
    (game as any).updateEnemySystem(0.05);
  }
}
afterEach(() => {
  games.forEach((game) => game.dispose());
  games.length = 0;
});

test("spitter bullets have a smaller hit radius and repeat at 7.2 seconds", () => {
  const { game, enemy } = setup("spitter");
  step(game, 0.05);
  assert.equal(game.bullets.length, 1);
  const bullet = game.bullets[0];
  assert.equal(bullet.type, "acid");
  assert.equal(bullet.radius, 0.18);
  assert.equal(bullet.damage, enemy.damage * 0.65);
  assert.equal(bullet.life, 5);
  assert.ok(Math.abs(Math.hypot(bullet.vx, bullet.vz) - 9) < 1e-7);
  assert.equal(enemy.attack, 7.2);
  game.bullets = [];
  step(game, 7.15);
  assert.equal(game.bullets.length, 0);
  step(game, 0.05);
  assert.equal(game.bullets.length, 1);
});

test("all non-charge bosses double normal and enraged volley intervals, preserving patterns", () => {
  for (const index of [0, 1, 3, 4])
    for (const enraged of [false, true]) {
      const { game, enemy } = setup("boss", index, enraged);
      step(game, 0.05);
      const count = Math.min(38, 12 + index * 5),
        interval = enraged ? 3.7 : 5.6;
      assert.equal(game.bullets.length, count);
      assert.equal(enemy.attack, interval);
      assert.ok(
        game.bullets.every(
          (b) =>
            b.radius === 0.18 &&
            b.damage === enemy.damage * 0.65 &&
            b.life === 5,
        ),
      );
      assert.ok(
        game.bullets.every((b) => Math.abs(Math.hypot(b.vx, b.vz) - 8) < 1e-7),
      );
      game.bullets = [];
      step(game, interval - 0.05);
      assert.equal(game.bullets.length, 0);
      step(game, 0.05);
      assert.equal(game.bullets.length, count);
    }
});

test("charge bosses keep their charge cycle but fire only on alternate charges", () => {
  for (const index of [2, 5]) {
    const { game, enemy } = setup("boss", index);
    const count = Math.min(38, 12 + index * 5);
    const charges: number[] = [];
    let previousCharge = 0;
    for (let i = 0; i < 240; i++) {
      step(game, 0.05);
      if (enemy.chargeTime > 0 && previousCharge <= 0) charges.push(game.time);
      previousCharge = enemy.chargeTime;
      if (game.time > 5.7 && game.time < 10.9)
        assert.equal(game.bullets.length, count);
    }
    assert.equal(charges.length, 3);
    assert.ok(
      charges[1] - charges[0] >= 5.5 - 1e-7 &&
        charges[1] - charges[0] <= 5.55 + 1e-7,
    );
    assert.ok(
      charges[2] - charges[1] >= 5.5 - 1e-7 &&
        charges[2] - charges[1] <= 5.55 + 1e-7,
    );
    assert.equal(game.bullets.length, count * 2);
    assert.ok(game.bullets.every((b) => b.radius === 0.18));
    assert.ok((enemy as Enemy).rangedCooldown! > 0);
  }
});
