// CPU simulation + the visibility predicates used by the instanced renderer.
// GPU/draw calls are deliberately excluded. Baseline is the exact 4987254 source.
import { performance } from "node:perf_hooks";
import os from "node:os";
import { writeFileSync } from "node:fs";
import { Game, CHARACTERS } from "../src/engine.ts";
import { Game as Baseline } from "./history/pre-koota/engine.ts";

type Sim = Game | Baseline;
const scenarios = [
  { name: "game-cap", enemies: 520, bullets: 700, drops: 900, effects: 250 },
  {
    name: "stress-4x",
    enemies: 2080,
    bullets: 2800,
    drops: 3600,
    effects: 1000,
  },
];
let sequence = 1_000_000;
function add(
  g: Sim,
  kind: "enemies" | "bullets" | "drops" | "effects",
  records: any[],
) {
  if (g instanceof Game) {
    const method = {
      enemies: "addEnemies",
      bullets: "addBullets",
      drops: "addDrops",
      effects: "addEffects",
    }[kind];
    (g as any)[method](...records);
  } else (g[kind] as any[]).push(...records);
}
function create(
  C: typeof Game | typeof Baseline,
  s: (typeof scenarios)[number],
) {
  sequence = 1_000_000;
  const g = new C(808);
  g.start(CHARACTERS[0], "normal");
  g.time = 1500;
  g.bossesSpawned = 6;
  g.nextXp = 1e12;
  (g as any).spawnClock = 1e9;
  (g as any).eliteClock = 1e9;
  g.weapons = {
    pistol: 6,
    shotgun: 6,
    frost: 6,
    katana: 6,
    sniper: 6,
    flamethrower: 6,
  };
  g.passives = { power: 5, haste: 5, pierce: 5, range: 5, multishot: 3 };
  g.enemies = [];
  const enemies = [];
  for (let i = 0; i < s.enemies; i++) {
    if (!i) g.spawnEnemy("walker", 30, 30);
    const template = g.enemies[0];
    const angle = i * 2.399963,
      r = 5 + (i % 50);
    enemies.push({
      ...template,
      id: sequence++,
      x: Math.sin(angle) * r,
      z: Math.cos(angle) * r,
      hp: 1e8,
      maxHp: 1e8,
      attack: 1e8,
    });
  }
  g.enemies = [];
  add(g, "enemies", enemies);
  add(
    g,
    "drops",
    Array.from({ length: s.drops }, (_, i) => ({
      id: sequence++,
      x: 35 + (i % 20),
      z: -55 + (i % 30),
      type: "xp",
      value: 1,
      age: 0,
    })),
  );
  return g;
}
function refill(g: Sim, s: (typeof scenarios)[number]) {
  const bullets = [];
  for (let i = g.bullets.length; i < s.bullets; i++) {
    const a = i * 2.399963;
    bullets.push({
      id: sequence++,
      x: Math.sin(a) * 12,
      z: Math.cos(a) * 12,
      vx: Math.sin(a) * 27,
      vz: Math.cos(a) * 27,
      life: 1.3,
      damage: 0.01,
      radius: 0.17,
      pierceChance: 0.75,
      type: "pistol",
      hit: new Set<number>(),
    });
  }
  if (bullets.length) add(g, "bullets", bullets);
  const effects = [];
  for (let i = g.effects.length; i < s.effects; i++)
    effects.push({
      id: sequence++,
      x: (i % 40) - 20,
      z: (i % 30) - 15,
      type: "spark",
      life: 0.4,
      maxLife: 0.4,
      radius: 0.4,
      damage: 0,
      tick: 0,
      color: "#b6d074",
    });
  if (effects.length) add(g, "effects", effects);
}
function frame(g: Sim, s: (typeof scenarios)[number], i: number) {
  refill(g, s);
  g.invincible = 1;
  g.update(1 / 60, {
    x: 0,
    y: 0,
    dash: false,
    pulse: false,
    aim: { x: 20, z: 12 },
  });
  while (g.phase === "upgrade") g.choose(0);
  // Visibility is real engine work invoked by World.tsx, not synthetic math.
  let visible = 0;
  for (const e of g.enemies) if (g.canSee(e)) visible++;
  for (const b of g.bullets) if (g.canSee(b)) visible++;
  for (const d of g.drops) if (g.canSee(d)) visible++;
  return visible + i * 0;
}
const percentile = (a: number[], p: number) =>
  a[Math.min(a.length - 1, Math.floor(a.length * p))];
const label = process.argv[2] || "comparison";
const results: any[] = [];
for (const scenario of scenarios) {
  const rows: Record<string, number[]> = { baseline: [], koota: [] };
  const checksums: Record<string, number[]> = { baseline: [], koota: [] };
  // Alternating runs avoid giving either implementation all of the cold/early runs.
  for (let repeat = 0; repeat < 3; repeat++)
    for (const name of repeat % 2
      ? ["koota", "baseline"]
      : ["baseline", "koota"]) {
      const g = create(name === "baseline" ? Baseline : Game, scenario);
      for (let i = 0; i < 90; i++) frame(g, scenario, i);
      let visible = 0;
      for (let i = 0; i < 240; i++) {
        const start = performance.now();
        visible = frame(g, scenario, i);
        rows[name].push(performance.now() - start);
      }
      checksums[name].push(visible);
      if (g instanceof Game) g.dispose();
    }
  const stats = (values: number[]) => {
    const a = values.toSorted((a, b) => a - b);
    return {
      meanMs: values.reduce((a, b) => a + b, 0) / values.length,
      p50Ms: percentile(a, 0.5),
      p95Ms: percentile(a, 0.95),
      frames: a.length,
    };
  };
  const baseline = stats(rows.baseline),
    koota = stats(rows.koota);
  const result = {
    scenario,
    baseline,
    koota,
    reductionPercent: (1 - koota.p50Ms / baseline.p50Ms) * 100,
    checksums,
  };
  results.push(result);
  console.log(JSON.stringify(result));
}
writeFileSync(
  `scripts/performance-${label}.json`,
  JSON.stringify(
    {
      date: "2026-10-04",
      baselineCommit: "4987254",
      koota: "0.6.6",
      node: process.version,
      cpu: os.cpus()[0].model,
      platform: process.platform,
      method:
        "3 alternating runs, 90 warmup + 240 sampled frames each, 1/60s simulation; includes spawn churn and renderer visibility predicates; no GPU",
      results,
    },
    null,
    2,
  ) + "\n",
);
