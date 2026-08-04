/**
 * 스킬 재기획 스모크: CSV 커버리지 + 전투 시뮬 로그 검증
 */
import { readFileSync } from "fs";
import { pathToFileURL } from "url";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

globalThis.fetch = async (url: string | URL) => {
  const s = String(url);
  const m = s.match(/\/([A-Za-z0-9_]+)\.csv/);
  if (!m) throw new Error(`bad fetch ${s}`);
  const text = readFileSync(join(root, "data", `${m[1]}.csv`), "utf8");
  return { ok: true, text: async () => text } as Response;
};

const { loadGameData } = await import("../src/data.ts");
const { createInitialState, learnSkill, simulateCombat, resolveSkillCombatMods } = await import(
  "../src/engine.ts"
);

function parseSkills() {
  const text = readFileSync(join(root, "data", "skill_config.csv"), "utf8");
  const lines = text.trim().split(/\r?\n/).slice(1);
  return lines.map((l) => {
    const p = l.split(",");
    return { id: p[0], name: p[1], tier: p[2], upgrade: p[3] === "TRUE", text: p[6] };
  });
}

function parseEffects() {
  const text = readFileSync(join(root, "data", "skill_effect_config.csv"), "utf8");
  const lines = text.trim().split(/\r?\n/).slice(1);
  const map = new Map<string, string[]>();
  for (const l of lines) {
    const p = l.split(",");
    const id = p[1];
    const note = `${p[2]}/${p[9]}/${p[4]}`;
    if (!map.has(id)) map.set(id, []);
    map.get(id)!.push(note);
  }
  return map;
}

const skills = parseSkills();
const effects = parseEffects();
console.log("=== CSV 커버리지 ===");
let missing = 0;
for (const s of skills) {
  const rows = effects.get(s.id);
  if (!rows) {
    console.log(`MISS ${s.id} ${s.name}`);
    missing++;
  }
}
console.log(`skills=${skills.length} withEffects=${skills.length - missing} missing=${missing}`);

const data = await loadGameData();
const combatId = data.combatEnemies[0]?.combat_id;

function runWith(skillIds: string[], label: string) {
  const state = createInitialState(data);
  for (const id of skillIds) {
    const r = learnSkill(data, state, id);
    if (!r) console.log(`  WARN learn fail ${id}`);
  }
  state.hp = state.maxHp;
  const sim = simulateCombat(data, state, combatId);
  const kinds = new Map<string, number>();
  for (const l of sim.logs) kinds.set(l.kind, (kinds.get(l.kind) ?? 0) + 1);
  const sample = sim.logs
    .filter(
      (l) =>
        l.side === "player" &&
        (l.kind === "skill" ||
          l.kind === "rage" ||
          l.kind === "shield" ||
          l.kind === "buff" ||
          l.kind === "volley")
    )
    .slice(0, 8)
    .map((l) => l.text);
  console.log(`\n=== ${label} ===`);
  console.log(`turns=${sim.turns} won=${sim.won} kinds=${JSON.stringify(Object.fromEntries(kinds))}`);
  for (const t of sample) console.log(`  · ${t}`);
  return sim;
}

// 얼음가시 + 동결
runWith(["sk_ice_shard_normal", "sk_renta"], "얼음가시+연타");
// 화염방패(피격 화염) + 분노 화염파
runWith(["sk_flame_shield", "sk_rage_firewave", "sk_rage_shield"], "화염방패+분노화염+분노실드");
// 번개+ (2발 볼리) + 수리검+
runWith(["sk_lightning_plus", "sk_shuriken_plus"], "번개+·수리검+ 볼리");
// 폭죽 기절
runWith(["sk_firecracker"], "폭죽");
// 빈사 보호막 + 회피
runWith(["sk_critical_shield", "sk_dodge_boost", "sk_counter_light"], "빈사실드+회피+반격");
// 크라운 스탯
{
  const state = createInitialState(data);
  learnSkill(data, state, "sk_crown");
  const mods = resolveSkillCombatMods(data, state);
  console.log(`\n=== 왕관 스탯 === atkMult=${mods.atkMult} defMult=${mods.defMult} maxHpMult=${mods.maxHpMult}`);
}

console.log("\n=== 전 스킬 목록 ===");
for (const s of skills) {
  const rows = effects.get(s.id);
  const status = rows ? "OK" : "NO_EFFECT";
  console.log(`[${status}] ${s.id} | ${s.name} | ${s.tier}${s.upgrade ? "+" : ""} | ${s.text}`);
  if (rows) console.log(`         → ${rows.join(" · ")}`);
}

console.log("\nSMOKE_DONE");
