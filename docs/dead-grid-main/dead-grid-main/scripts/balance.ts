import { Game, CHARACTERS, type Weapon, type Input } from "../src/engine.ts";
import { contains } from "../src/terrain.ts";
for (const mode of ["normal", "relaxed"] as const)
  for (const char of CHARACTERS) {
    const g = new Game(817 + char.hp);
    g.start(char, mode);
    const history = [];
    const abilities = !process.argv.includes("--no-abilities");
    let minute = -1;
    const fights: { index: number; spawned: number; died?: number }[] = [];
    let seenBosses = 0,
      killedBosses = 0;
    let last = { x: 1, z: 0 };
    for (
      let f = 0;
      f < 45000 && g.phase !== "dead" && g.phase !== "victory";
      f++
    ) {
      if (g.phase === "upgrade") {
        const score = (u: (typeof g.choices)[number]) => {
          if (u.evolution) return 200;
          const w = u.id as Weapon;
          return (
            (w === char.weapon
              ? 100
              : [
                  "power",
                  "haste",
                  "pierce",
                  "sniper",
                  "katana",
                  "flamethrower",
                  "multishot",
                  "experience",
                  "range",
                  "area",
                  "orbit",
                  "lightning",
                  "vitality",
                  "armor",
                  "magnet",
                  "frost",
                  "shotgun",
                  "boots",
                  "molotov",
                ].indexOf(u.id) *
                  -5 +
                70) +
            u.level * 3
          );
        };
        let best = 0;
        g.choices.forEach((u, i) => {
          if (score(u) > score(g.choices[best])) best = i;
        });
        g.choose(best);
        continue;
      }
      const p = g.player;
      let target = {
        x: Math.cos(g.time * 0.18) * 10,
        z: Math.sin(g.time * 0.18) * 10,
      };
      let d = 900;
      for (const drop of g.drops.filter((d) => g.canSee(d))) {
        const ds = (drop.x - p.x) ** 2 + (drop.z - p.z) ** 2;
        if (ds < d) {
          d = ds;
          target = drop;
        }
      }
      const boss = g.enemies.find((e) => e.kind === "boss");
      if (boss && Math.hypot(boss.x - p.x, boss.z - p.z) > 12) target = boss;

      let best = -Infinity,
        dir = last,
        close = 0;
      for (const e of g.enemies.filter((e) => g.canSee(e)))
        if ((e.x - p.x) ** 2 + (e.z - p.z) ** 2 < 16) close++;
      for (let i = 0; i < 24; i++) {
        const a = (i * Math.PI * 2) / 24,
          x = Math.cos(a),
          z = Math.sin(a),
          next = { x: p.x + x * 2, z: p.z + z * 2 };
        let score =
          -Math.hypot(next.x - target.x, next.z - target.z) * 0.9 +
          (x * last.x + z * last.z) * 0.4;
        if (Math.abs(next.x) > 62 || Math.abs(next.z) > 62) score -= 100;
        for (const o of g.structures) {
          const legacy = process.argv.includes("--legacy-obstacle-policy");
          if (
            legacy
              ? o.hp > 0 &&
                Math.abs(next.x - o.x) < o.w / 2 + 1 &&
                Math.abs(next.z - o.z) < o.d / 2 + 1
              : contains(o, next, 1)
          )
            score -= 100;
          if (
            !process.argv.includes("--legacy-obstacle-policy") &&
            o.kind === "vehicle" &&
            o.burningAt >= 0 &&
            o.burnedAt < 0 &&
            Math.hypot(next.x - o.x, next.z - o.z) < 4
          )
            score -= 50;
        }
        for (const e of g.enemies.filter((e) => g.canSee(e))) {
          const ds = (e.x - next.x) ** 2 + (e.z - next.z) ** 2;
          if (ds < 36) score -= 7 / (ds + 0.25);
        }
        for (const effect of g.effects)
          if (effect.type === "warning" && effect.damage > 0) {
            const ds = (effect.x - next.x) ** 2 + (effect.z - next.z) ** 2;
            if (ds < (effect.radius + 1.5) ** 2) score -= 20 / (ds + 0.2);
          }
        for (const b of g.bullets)
          if (b.type === "acid") {
            const ds =
              (b.x + b.vx * 0.15 - next.x) ** 2 +
              (b.z + b.vz * 0.15 - next.z) ** 2;
            if (ds < 9) score -= 8 / (ds + 0.3);
          }
        if (score > best) {
          best = score;
          dir = { x, z };
        }
      }
      last = dir;
      const incoming = g.bullets.filter(
        (b) =>
          b.type === "acid" &&
          Math.hypot(b.x + b.vx * 0.22 - p.x, b.z + b.vz * 0.22 - p.z) < 2.5,
      ).length;
      const hazard = g.effects.some(
        (e) =>
          e.type === "warning" &&
          e.damage > 0 &&
          e.life < 0.4 &&
          Math.hypot(e.x - p.x, e.z - p.z) < e.radius + 0.5,
      );
      const aimTarget = g.enemies
        .filter((e) => e.hp > 0 && g.canSee(e))
        .sort(
          (a, b) =>
            Number(b.kind === "boss") - Number(a.kind === "boss") ||
            Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z),
        )[0];
      const input: Input = {
        aim: aimTarget ? { x: aimTarget.x, z: aimTarget.z } : undefined,
        x: (dir.x - dir.z) * Math.SQRT1_2,
        y: (dir.x + dir.z) * Math.SQRT1_2,
        dash: abilities && (close >= 3 || incoming > 0 || hazard),
        pulse: abilities && (close >= 3 || incoming >= 2),
      };
      g.update(0.05, input);
      if (g.bossesSpawned > seenBosses) {
        fights.push({ index: seenBosses, spawned: g.time });
        seenBosses = g.bossesSpawned;
      }
      if (g.bossKills > killedBosses) {
        const f = fights.find(
          (f) => f.died === undefined && g.defeatedBosses.has(f.index),
        );
        if (f) f.died = g.time;
        killedBosses = g.bossKills;
      }
      if (Math.floor(g.time / 60) !== minute) {
        minute = Math.floor(g.time / 60);
        history.push({
          minute,
          hp: Math.round(g.hp),
          level: g.level,
          kills: g.kills,
          enemies: g.enemies.length,
          maxWeapons: Object.values(g.weapons).filter((l) => l === 6).length,
          crates: g.crates,
        });
      }
    }
    console.log(
      JSON.stringify({
        mode,
        obstaclePolicy: process.argv.includes("--legacy-obstacle-policy")
          ? "legacy-axis-aligned"
          : "rotated-hulls-and-fire",
        abilities,
        char: char.id,
        time: Math.round(g.time),
        phase: g.phase,
        bosses: g.bossKills,
        level: g.level,
        kills: g.kills,
        weapons: g.weapons,
        passives: g.passives,
        evolved: [...g.evolved],
        supplies: g.suppliesSpawned,
        heals: g.healsDropped,
        damageTaken: Math.round(g.damageTaken),
        dashes: g.dashesUsed,
        pulses: g.pulsesUsed,
        collapsed: g.buildings.filter((b) => b.hp <= 0).length,
        fights: fights.map((f) => ({
          ...f,
          duration: f.died ? Math.round(f.died - f.spawned) : null,
        })),
        history,
      }),
    );
    g.dispose();
  }
