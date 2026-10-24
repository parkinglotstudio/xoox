import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  Game,
  CHARACTERS,
  PASSIVES,
  WEAPONS,
  type Upgrade,
  type Weapon,
} from "./engine";

const games = new Set<Game>();
afterEach(() => {
  for (const game of games) game.dispose();
  games.clear();
});
function start(index = 2, seed = 101) {
  const g = new Game(seed);
  games.add(g);
  g.start(CHARACTERS[index], "normal");
  return g;
}
function offer(g: Game) {
  (g as any).offerUpgrades();
  return g.choices;
}
function eligible(g: Game): Upgrade[] {
  return (g as any).eligible();
}

test("all survivors can take six alternative upgrades without their starting weapon being forced into the first slot", () => {
  for (let i = 0; i < CHARACTERS.length; i++) {
    const g = start(i);
    const first: string[] = [];
    for (let n = 0; n < 6; n++) {
      const cards = offer(g);
      first.push(cards[0].id);
      let alternativeIndex = cards.findIndex((u) => u.id in PASSIVES);
      if (alternativeIndex < 0)
        alternativeIndex = cards.findIndex(
          (u) => u.id !== CHARACTERS[i].weapon,
        );
      assert.ok(alternativeIndex >= 0);
      g.choose(alternativeIndex);
    }
    assert.ok(
      new Set(first).size > 1,
      `${CHARACTERS[i].name} repeats ${first[0]} in every first slot`,
    );
    assert.equal(g.weapons[CHARACTERS[i].weapon], 1);
  }
});

test("medic offers sample every eligible candidate uniformly, with no reserved weapon or passive slots", () => {
  const g = start();
  const pool = eligible(g);
  const counts = [
    new Map<string, number>(),
    new Map<string, number>(),
    new Map<string, number>(),
  ];
  const sampleCount = 6000;
  let missingStarter = 0;
  for (let i = 0; i < sampleCount; i++) {
    const cards = offer(g);
    assert.equal(cards.length, 3);
    assert.equal(new Set(cards.map((c) => c.id)).size, 3);
    if (!cards.some((c) => c.id === "frost")) missingStarter++;
    cards.forEach((card, index) => {
      assert.ok(
        pool.some(
          (c) =>
            c.id === card.id &&
            c.level === card.level &&
            c.evolution === card.evolution,
        ),
      );
      counts[index].set(card.id, (counts[index].get(card.id) || 0) + 1);
      if (card.id in PASSIVES) {
        assert.ok(card.rarity);
        if (card.id === "multishot") assert.equal(card.rarity, "rare");
      }
    });
  }
  const expected = sampleCount / pool.length;
  for (const slot of counts) {
    assert.equal(
      slot.size,
      pool.length,
      "every candidate should be able to appear in every position",
    );
    for (const count of slot.values()) {
      assert.ok(
        count > expected * 0.75 && count < expected * 1.25,
        `slot frequency ${count} is biased away from ${expected}`,
      );
    }
  }
  assert.ok(
    missingStarter > sampleCount * 0.7,
    "a starter weapon is eligible, not guaranteed in every offer",
  );
});

test("random choices remain deterministic for a seed and respect full slots, rank limits and evolution prerequisites", () => {
  const a = start(2, 321);
  const b = start(2, 321);
  for (const g of [a, b]) {
    g.weapons = {
      pistol: 6,
      shotgun: 1,
      orbit: 6,
      molotov: 6,
      frost: 5,
      lightning: 6,
    };
    g.passives = {
      power: 3,
      armor: 2,
      vitality: 3,
      boots: 3,
      magnet: 3,
      multishot: 3,
      experience: 5,
    };
    g.evolved.add("lightning");
  }
  for (let i = 0; i < 100; i++) {
    assert.deepEqual(offer(a), offer(b));
    for (const c of a.choices) {
      assert.ok(
        ![
          "katana",
          "sniper",
          "flamethrower",
          "multishot",
          "experience",
          "lightning",
          "orbit",
        ].includes(c.id),
      );
      if (c.id === "frost") assert.equal(c.evolution, false);
      if (c.id === "pistol" || c.id === "molotov")
        assert.equal(c.evolution, true);
    }
  }
});

test("exhausted pools still provide recovery and the sole remaining upgrade keeps its rarity and selection behavior", () => {
  const g = start();
  g.weapons = Object.fromEntries(
    (Object.keys(WEAPONS) as Weapon[]).slice(0, 6).map((w) => [w, 6]),
  );
  for (const w of Object.keys(g.weapons) as Weapon[]) g.evolved.add(w);
  g.passives = Object.fromEntries(Object.keys(PASSIVES).map((p) => [p, 5]));
  g.passives.multishot = 3;
  assert.equal(eligible(g).length, 0);
  assert.equal(offer(g)[0].id, "heal");
  g.hp = 10;
  g.choose(0);
  assert.equal(g.hp, 50);
  g.passives.multishot = 2;
  const cards = offer(g);
  assert.equal(cards[0].id, "multishot");
  assert.equal(cards[0].rarity, "rare");
  assert.equal(cards[1].id, "heal");
  g.choose(0);
  assert.equal(g.passives.multishot, 3);
});
