// A maximum-loadout damage probe. Invulnerability isolates weapon damage;
// this is not a survival or human-skill result.
import { Game, CHARACTERS, BOSS_SCHEDULE, type Weapon } from "../src/engine.ts";
for (let index = 0; index < 6; index++) {
  const g = new Game(24);
  g.start(CHARACTERS[0], "normal");
  g.time = BOSS_SCHEDULE[index];
  // Empty arena isolates boss damage from cover and changing line of sight.
  g.buildings = [];
  g.vehicles = [];
  g.props = [];
  g.structures = [];
  g.stage = Math.floor(g.time / 60);
  g.bossesSpawned = 6;
  g.spawnClock = 1e9;
  g.eliteClock = 1e9;
  g.level = 40;
  for (const w of [
    "pistol",
    "shotgun",
    "lightning",
    "katana",
    "sniper",
    "flamethrower",
  ] as Weapon[]) {
    g.weapons[w] = 6;
    g.evolved.add(w);
  }
  g.passives = {
    range: 5,
    area: 5,
    experience: 5,
    multishot: 3,
    pierce: 5,
    power: 5,
    haste: 5,
    armor: 5,
    boots: 5,
    magnet: 5,
    vitality: 5,
  };
  g.spawnEnemy("boss", 4, 0, index);
  const boss = g.enemies[0];
  const start = g.time;
  let atFive = 0;
  for (let frame = 0; frame < 6000 && boss.hp > 0; frame++) {
    g.invincible = 1;
    while (g.phase === "upgrade") g.choose(0);
    g.update(0.05, {
      x: 0,
      y: 0,
      dash: false,
      pulse: false,
      aim: { x: boss.x, z: boss.z },
    });
    if (frame === 99) atFive = boss.hp;
  }
  console.log(
    JSON.stringify({
      boss: index,
      mode: "normal",
      scenario:
        "six evolved weapons + common passives + rare multishot; mouse aims at boss; stationary; open arena; boss and its summons only; invulnerable; no abilities",
      hp: boss.maxHp,
      hpAfterFive: Math.round(atFive),
      killSeconds: Math.round((g.time - start) * 10) / 10,
      killed: boss.hp <= 0,
    }),
  );
  g.dispose();
}
