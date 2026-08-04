/**
 * 임시: 시나리오 풀(직접/무등급/지역/분기/전투)을 2배로 늘린다.
 * 효과(effect_id)는 재사용하고, 텍스트·ID만 변형 복제한다.
 */
import fs from "fs";
import path from "path";

const DATA = path.resolve("data");

function readCsv(name) {
  const raw = fs.readFileSync(path.join(DATA, name), "utf8").replace(/^\uFEFF/, "");
  const lines = raw.trimEnd().split(/\r?\n/);
  const headers = lines[0].split(",");
  const rows = lines.slice(1).filter(Boolean).map((line) => {
    const cols = line.split(",");
    const obj = {};
    if (headers[headers.length - 1] === "body" && cols.length >= headers.length) {
      headers.slice(0, -1).forEach((h, i) => {
        obj[h] = cols[i] ?? "";
      });
      obj.body = cols.slice(headers.length - 1).join(",");
    } else {
      headers.forEach((h, i) => {
        obj[h] = cols[i] ?? "";
      });
    }
    return obj;
  });
  return { headers, rows };
}

function writeCsv(name, headers, rows) {
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(headers.map((h) => (r[h] ?? "")).join(","));
  }
  fs.writeFileSync(path.join(DATA, name), lines.join("\n") + "\n", "utf8");
}

const texts = readCsv("event_text_pool.csv");
const daily = readCsv("daily_roll_pool.csv");
const ungraded = readCsv("ungraded_pool.csv");
const locations = readCsv("location_config.csv");
const branches = readCsv("branch_config.csv");
const combats = readCsv("combat_trigger_config.csv");
const bonuses = readCsv("daily_pool_bonus_effects.csv");

const textById = new Map(texts.rows.map((r) => [r.text_id, r]));

function variantBody(body, kind, idx) {
  const prefixes = {
    DAILY: "[임시] ",
    UNGRADED: "[임시] ",
    LOCATION: "[임시] ",
    BRANCH: "[임시] ",
    COMBAT: "[임시] ",
  };
  const tips = [
    "다른 길에서 비슷한 일이 벌어졌습니다. ",
    "조금 다른 버전의 이야기입니다. ",
    "옆 계곡에서도 같은 소문이 돌았습니다. ",
    "또 다른 모험에서 마주친 일입니다. ",
  ];
  const tip = tips[idx % tips.length];
  return `${prefixes[kind] ?? "[임시] "}${tip}${body}`;
}

function ensureText(baseTextId, newTextId, kind, idx) {
  if (textById.has(newTextId)) return;
  const base = textById.get(baseTextId);
  if (!base) {
    console.warn("missing text", baseTextId);
    return;
  }
  const row = {
    text_id: newTextId,
    category: base.category || kind,
    grade_id: base.grade_id ?? "",
    body: variantBody(base.body, kind, idx),
  };
  texts.rows.push(row);
  textById.set(newTextId, row);
}

// --- daily ---
const dailyExtras = [];
daily.rows.forEach((r, i) => {
  const pool_id = `${r.pool_id}_2`;
  const text_id = `${r.text_id}_2`;
  ensureText(r.text_id, text_id, "DAILY", i);
  dailyExtras.push({ ...r, pool_id, text_id });
});
daily.rows.push(...dailyExtras);

// --- bonus links for new jackpot pools ---
const bonusExtras = [];
for (const r of bonuses.rows) {
  bonusExtras.push({ pool_id: `${r.pool_id}_2`, effect_id: r.effect_id });
}
bonuses.rows.push(...bonusExtras);

// --- ungraded ---
const ungradedExtras = [];
ungraded.rows.forEach((r, i) => {
  const pool_id = `${r.pool_id}_2`;
  const text_id = `${r.text_id}_2`;
  ensureText(r.text_id, text_id, "UNGRADED", i);
  ungradedExtras.push({ ...r, pool_id, text_id });
});
ungraded.rows.push(...ungradedExtras);

// --- locations ---
const locExtras = [];
locations.rows.forEach((r, i) => {
  const location_id = `${r.location_id}_2`;
  const text_id = `${r.text_id}_2`;
  ensureText(r.text_id, text_id, "LOCATION", i);
  locExtras.push({
    ...r,
    location_id,
    name: `${r.name}(임시)`,
    text_id,
    entry_path: r.entry_path,
    milestone_id: r.milestone_id || "",
  });
});
locations.rows.push(...locExtras);

// --- branches ---
const branchExtras = [];
branches.rows.forEach((r, i) => {
  const branch_id = `${r.branch_id}_2`;
  const text_id = `${r.text_id}_2`;
  ensureText(r.text_id, text_id, "BRANCH", i);
  let option_a_effect_id = r.option_a_effect_id;
  let option_b_effect_id = r.option_b_effect_id;
  if (option_b_effect_id.startsWith("LOCATION:")) {
    const loc = option_b_effect_id.slice("LOCATION:".length);
    option_b_effect_id = `LOCATION:${loc}_2`;
  }
  if (option_a_effect_id.startsWith("LOCATION:")) {
    const loc = option_a_effect_id.slice("LOCATION:".length);
    option_a_effect_id = `LOCATION:${loc}_2`;
  }
  branchExtras.push({
    ...r,
    branch_id,
    text_id,
    option_a_effect_id,
    option_b_effect_id,
  });
});
branches.rows.push(...branchExtras);

// --- combat ---
const combatExtras = [];
combats.rows.forEach((r, i) => {
  const combat_id = `${r.combat_id}_2`;
  const text_id = `${r.text_id}_2`;
  ensureText(r.text_id, text_id, "COMBAT", i);
  combatExtras.push({ ...r, combat_id, text_id });
});
combats.rows.push(...combatExtras);

writeCsv("event_text_pool.csv", texts.headers, texts.rows);
writeCsv("daily_roll_pool.csv", daily.headers, daily.rows);
writeCsv("ungraded_pool.csv", ungraded.headers, ungraded.rows);
writeCsv("location_config.csv", locations.headers, locations.rows);
writeCsv("branch_config.csv", branches.headers, branches.rows);
writeCsv("combat_trigger_config.csv", combats.headers, combats.rows);
writeCsv("daily_pool_bonus_effects.csv", bonuses.headers, bonuses.rows);

console.log(
  JSON.stringify(
    {
      texts: texts.rows.length,
      daily: daily.rows.length,
      ungraded: ungraded.rows.length,
      locations: locations.rows.length,
      branches: branches.rows.length,
      combats: combats.rows.length,
      bonuses: bonuses.rows.length,
    },
    null,
    2
  )
);
