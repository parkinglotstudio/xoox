import fs from "fs";

/** 장비 풀장착 가정 베이스 (원작 스케일). 스킬은 ATK에 가산하지 않음. */
const playerRows = [
  ["key", "value", "note"],
  ["base_hp", "18000", "\uD480\uC7A5\uCC29 \uAC00\uC815 \uC2DC\uC791 HP"],
  ["base_max_hp", "18000", "\uD480\uC7A5\uCC29 \uAC00\uC815 \uCD5C\uB300 HP"],
  ["base_atk", "3200", "\uD480\uC7A5\uCC29 \uAC00\uC815 \uACF5\uACA9\uB825"],
  ["base_def", "900", "\uD480\uC7A5\uCC29 \uAC00\uC815 \uBC29\uC5B4\uB825"],
];

const enemyRows = [
  ["combat_id", "enemy_name", "enemy_icon", "enemy_hp", "enemy_atk", "enemy_def"],
  ["c_normal", "\uD574\uACE8\uBCD1\uC0AC", "\uD83D\uDC80", "6500", "980", "160"],
  ["c_normal2", "\uACE0\uBE14\uB9B0", "\uD83D\uDC7A", "6000", "920", "150"],
  ["c_normal3", "\uC2AC\uB77C\uC784", "\uD83D\uDFE2", "5600", "860", "130"],
  ["c_normal4", "\uB098\uBB34\uBAAC\uB465\uC774", "\uD83E\uDEB5", "6200", "950", "155"],
  ["c_normal5", "\uD314\uB77C\uB518", "\uD83D\uDEE1\uFE0F", "8200", "1100", "260"],
  ["c_normal6", "\uC608\uD2F0", "\u2744\uFE0F", "8800", "1180", "240"],
  ["c_normal7", "\uC30D\uB450\uAD34", "\uD83D\uDC79", "10000", "1300", "280"],
  ["c_normal8", "\uC9C4\uD759\uC778\uD615", "\uD83D\uDDFF", "7000", "1000", "200"],
  ["c_normal9", "\uB124\uD06C\uB85C\uB9E8\uC11C", "\uD83E\uDDB4", "9200", "1250", "220"],
  ["c_normal10", "\uB291\uB300\uC18C\uAD74", "\uD83D\uDC3A", "7800", "1150", "180"],
  ["c_miniboss", "\uC554\uD751\uAE30\uC0AC", "\u265E", "16000", "1600", "380"],
  ["c_finalboss", "\uC218\uD638\uC790", "\uD83D\uDC51", "28000", "2100", "500"],
  ["c_normal_2", "\uD574\uACE8\uBCD1\uC0AC", "\uD83D\uDC80", "7200", "1050", "170"],
  ["c_normal2_2", "\uACE0\uBE14\uB9B0", "\uD83D\uDC7A", "6800", "1000", "160"],
  ["c_normal3_2", "\uC2AC\uB77C\uC784", "\uD83D\uDFE2", "6200", "940", "140"],
  ["c_normal4_2", "\uB098\uBB34\uBAAC\uB465\uC774", "\uD83E\uDEB5", "7000", "1020", "165"],
  ["c_normal5_2", "\uD314\uB77C\uB518", "\uD83D\uDEE1\uFE0F", "9000", "1200", "280"],
  ["c_normal6_2", "\uC608\uD2F0", "\u2744\uFE0F", "9600", "1280", "260"],
  ["c_normal7_2", "\uC30D\uB450\uAD34", "\uD83D\uDC79", "11000", "1400", "300"],
  ["c_normal8_2", "\uC9C4\uD759\uC778\uD615", "\uD83D\uDDFF", "7800", "1100", "220"],
  ["c_normal9_2", "\uB124\uD06C\uB85C\uB9E8\uC11C", "\uD83E\uDDB4", "10000", "1350", "240"],
  ["c_normal10_2", "\uB291\uB300\uC18C\uAD74", "\uD83D\uDC3A", "8600", "1220", "200"],
  ["c_miniboss_2", "\uC554\uD751\uAE30\uC0AC", "\u265E", "18000", "1750", "420"],
  ["c_finalboss_2", "\uC218\uD638\uC790", "\uD83D\uDC51", "32000", "2300", "560"],
];

/** 런레벨당 스킬 전투 보정 (ATK 스탯과 무관) */
const tuningExtra = [
  ["skill_per_skill_base", "0.02", "\uC2A4\uD0AC 1\uAC1C\uB2F9 \uAE30\uBCF8 \uC804\uD22C \uBC30\uC728"],
  ["skill_per_run_level", "0.008", "\uB7F0\uB808\uBCA8 1\uB2F9 \uC2A4\uD0AC \uBC30\uC728 \uCD94\uAC00"],
];

function write(path, rows) {
  fs.writeFileSync(path, rows.map((r) => r.join(",")).join("\n") + "\n", "utf8");
}

write("C:/chatsystem/data/player_base_stat_config.csv", playerRows);
write("C:/chatsystem/data/combat_enemy_config.csv", enemyRows);

const tuningPath = "C:/chatsystem/data/combat_tuning.csv";
let tuning = fs.readFileSync(tuningPath, "utf8").trimEnd();
for (const row of tuningExtra) {
  if (!tuning.includes(row[0] + ",")) tuning += "\n" + row.join(",");
}
fs.writeFileSync(tuningPath, tuning + "\n", "utf8");

console.log(fs.readFileSync("C:/chatsystem/data/player_base_stat_config.csv", "utf8"));
console.log("enemy", /6500/.test(fs.readFileSync("C:/chatsystem/data/combat_enemy_config.csv", "utf8")));
