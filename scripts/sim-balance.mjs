/**
 * 전투 밸런스 간이 시뮬 (CSV 직접 파싱, 엔진과 동일 공식 근사)
 * node scripts/sim-balance.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const cols = line.split(",");
    const o = {};
    headers.forEach((h, i) => (o[h] = cols[i]));
    return o;
  });
}

function readCsv(name) {
  return parseCsv(fs.readFileSync(path.join(root, "data", name), "utf8"));
}

const maps = readCsv("stage_map_config.csv");
const enemies = readCsv("combat_enemy_config.csv");
const tuningRows = readCsv("combat_tuning.csv");
const playerRows = readCsv("player_base_stat_config.csv");
const tuning = Object.fromEntries(tuningRows.map((r) => [r.key, Number(r.value)]));
const player = Object.fromEntries(playerRows.map((r) => [r.key, Number(r.value)]));

function mapForDay(day) {
  return maps.find((m) => day >= +m.day_start && day <= +m.day_end) ?? maps[maps.length - 1];
}

function rollDmg(atk, def, variance) {
  const defFactor = tuning.atk_def_factor ?? 0.35;
  const base = Math.max(1, Math.round(atk - def * defFactor));
  const jitter = 1 + (Math.random() * 2 - 1) * variance;
  return Math.max(1, Math.round(base * jitter));
}

function simFight({ day, combatId, playerHp, skills = 0, runLv = 1, trials = 40 }) {
  const map = mapForDay(day);
  const enemy = enemies.find((e) => e.combat_id === combatId) ?? enemies[0];
  const forgiving = map.balance_tag === "CLEAR" || map.balance_tag === "FORGIVING";
  const edgeBoss =
    map.balance_tag === "EDGE" &&
    day >= +map.day_end - 2 &&
    (combatId.includes("miniboss") || combatId.includes("finalboss"));
  const hpM = +map.enemy_hp_mult * (edgeBoss ? 1.35 : 1);
  const atkM = +map.enemy_atk_mult * (edgeBoss ? 1.22 : 1);
  const defM = +map.enemy_def_mult * (edgeBoss ? 1.12 : 1);
  const variance = (tuning.dmg_variance_pct ?? 18) / 100;
  const playerDmgScale = tuning.player_dmg_scale ?? 0.32;
  const enemyDmgScale = forgiving
    ? tuning.forgiving_enemy_dmg_scale ?? 0.42
    : tuning.enemy_dmg_scale ?? 0.55;
  const skillMult = 1 + skills * ((tuning.skill_per_skill_base ?? 0.02) + (runLv - 1) * (tuning.skill_per_run_level ?? 0.008));
  const maxTurns = tuning.max_turns ?? 15;
  const pAtk = player.base_atk;
  const pDef = player.base_def;
  const maxHp = player.base_max_hp;

  let wins = 0;
  let hpSum = 0;
  let turnSum = 0;

  for (let t = 0; t < trials; t++) {
    let php = playerHp ?? maxHp;
    let ehp = Math.round(+enemy.enemy_hp * hpM * (tuning.enemy_hp_scale ?? 1));
    const baseEhp = ehp;
    const eAtk = Math.round(+enemy.enemy_atk * atkM);
    const eDef = Math.round(+enemy.enemy_def * defM);
    let turns = 0;
    let won = false;

    for (let turn = 1; turn <= maxTurns; turn++) {
      turns = turn;
      // player basic only (approx without skills/shield)
      const pd = Math.max(1, Math.round(rollDmg(pAtk, eDef, variance) * skillMult * playerDmgScale));
      ehp = Math.max(0, ehp - pd);
      if (ehp <= 0) {
        won = true;
        break;
      }
      const ed = Math.max(1, Math.round(rollDmg(eAtk, pDef, variance) * enemyDmgScale));
      php = Math.max(0, php - ed);
      if (php <= 0) {
        won = false;
        break;
      }
    }
    if (php > 0 && ehp > 0) {
      won = false;
    }
    if (php <= 0) won = false;
    if (won) wins++;
    hpSum += php;
    turnSum += turns;
  }

  return {
    day,
    map: map.display_name,
    tag: map.balance_tag,
    combatId,
    enemy: enemy.enemy_name,
    winRate: wins / trials,
    avgHp: Math.round(hpSum / trials),
    avgTurns: +(turnSum / trials).toFixed(1),
  };
}

const scenarios = [
  { day: 6, combatId: "c_normal", skills: 0, runLv: 1 },
  { day: 15, combatId: "c_miniboss", skills: 1, runLv: 3 },
  { day: 19, combatId: "c_normal5", skills: 2, runLv: 4 },
  { day: 25, combatId: "c_miniboss", skills: 3, runLv: 5 },
  { day: 30, combatId: "c_miniboss", skills: 3, runLv: 6 },
  { day: 35, combatId: "c_normal7", skills: 4, runLv: 7 },
  { day: 38, combatId: "c_normal9", skills: 4, runLv: 8 },
  { day: 40, combatId: "c_normal9", skills: 4, runLv: 8 },
  { day: 48, combatId: "c_normal7_2", skills: 5, runLv: 9 },
  { day: 50, combatId: "c_normal7_2", skills: 5, runLv: 10 },
  { day: 56, combatId: "c_miniboss_2", skills: 5, runLv: 11 },
  { day: 60, combatId: "c_finalboss", skills: 6, runLv: 12 },
];

console.log("day | map | fight | win% | avgHP | turns");
for (const s of scenarios) {
  const r = simFight({ ...s, trials: 80 });
  console.log(
    `${String(r.day).padStart(2)} | ${r.map} (${r.tag}) | ${r.enemy} | ${(r.winRate * 100).toFixed(0)}% | ${r.avgHp} | ${r.avgTurns}`
  );
}
