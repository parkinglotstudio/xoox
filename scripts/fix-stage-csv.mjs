import fs from "fs";

const stageRows = [
  ["mode_id", "title", "subtitle", "icon", "bg_class", "show_enemy", "note"],
  ["IDLE", "\uBAA8\uD5D8 \uB300\uAE30", "\uBC84\uD2BC\uC744 \uB20C\uB7EC \uB2E4\uC74C \uD558\uB8E8\uB85C \uC9C4\uD589\uD569\uB2C8\uB2E4", "\uD83C\uDFD5\uFE0F", "stage-idle", "FALSE", "\uB300\uAE30"],
  ["MOVING", "\uC774\uB3D9 \uC911", "\uAE38\uC744 \uB530\uB77C \uC774\uB3D9\uD558\uACE0 \uC788\uC2B5\uB2C8\uB2E4\u2026", "\uD83D\uDEB6", "stage-moving", "FALSE", "\uC774\uB3D9 \uC5F0\uCD9C"],
  ["COMBAT", "\uC804\uD22C \uC911", "\uC0C1\uB2E8\uC5D0\uC11C \uC804\uD22C\uAC00 \uC9C4\uD589\uB429\uB2C8\uB2E4", "\u2694\uFE0F", "stage-combat", "TRUE", "\uC804\uD22C \uB85C\uADF8"],
  ["SKILL", "\uC2A4\uD0AC \uC120\uD0DD \uC911", "\uC544\uB798\uC5D0\uC11C \uAE30\uC220\uC744 \uC120\uD0DD\uD558\uC138\uC694", "\u2728", "stage-skill", "FALSE", "\uC2A4\uD0AC \uD328\uB110"],
  ["LOCATION_FIND", "\uC601\uC9C0 \uBC1C\uACAC", "\uC0C8\uB85C\uC6B4 \uC7A5\uC18C\uB97C \uBC1C\uACAC\uD588\uC2B5\uB2C8\uB2E4", "\uD83D\uDDFA\uFE0F", "stage-location", "FALSE", "\uBC1C\uACAC"],
  ["LOCATION_ARRIVE", "\uC601\uC9C0 \uB3C4\uCC29", "\uC601\uC9C0\uC5D0 \uB3C4\uCC29\uD588\uC2B5\uB2C8\uB2E4", "\uD83C\uDFE0", "stage-location", "FALSE", "\uB3C4\uCC29"],
];

const enemyRows = [
  ["combat_id", "enemy_name", "enemy_icon", "enemy_hp", "enemy_atk", "enemy_def"],
  ["c_normal", "\uD574\uACE8\uBCD1\uC0AC", "\uD83D\uDC80", "7200", "1100", "180"],
  ["c_normal2", "\uACE0\uBE14\uB9B0", "\uD83D\uDC7A", "6800", "1050", "160"],
  ["c_normal3", "\uC2AC\uB77C\uC784", "\uD83D\uDFE2", "6500", "980", "140"],
  ["c_normal4", "\uB098\uBB34\uBAAC\uB465\uC774", "\uD83E\uDEB5", "7000", "1080", "170"],
  ["c_normal5", "\uD314\uB77C\uB518", "\uD83D\uDEE1\uFE0F", "9000", "1250", "280"],
  ["c_normal6", "\uC608\uD2F0", "\u2744\uFE0F", "9500", "1300", "260"],
  ["c_normal7", "\uC30D\uB450\uAD34", "\uD83D\uDC79", "11000", "1450", "300"],
  ["c_normal8", "\uC9C4\uD759\uC778\uD615", "\uD83D\uDDFF", "7500", "1120", "220"],
  ["c_normal9", "\uB124\uD06C\uB85C\uB9E8\uC11C", "\uD83E\uDDB4", "10000", "1400", "240"],
  ["c_normal10", "\uB291\uB300\uC18C\uAD74", "\uD83D\uDC3A", "8500", "1280", "200"],
  ["c_miniboss", "\uC554\uD751\uAE30\uC0AC", "\u265E", "18000", "1800", "420"],
  ["c_finalboss", "\uC218\uD638\uC790", "\uD83D\uDC51", "32000", "2400", "550"],
  ["c_normal_2", "\uD574\uACE8\uBCD1\uC0AC", "\uD83D\uDC80", "7800", "1180", "190"],
  ["c_normal2_2", "\uACE0\uBE14\uB9B0", "\uD83D\uDC7A", "7400", "1120", "170"],
  ["c_normal3_2", "\uC2AC\uB77C\uC784", "\uD83D\uDFE2", "7000", "1050", "150"],
  ["c_normal4_2", "\uB098\uBB34\uBAAC\uB465\uC774", "\uD83E\uDEB5", "7600", "1150", "180"],
  ["c_normal5_2", "\uD314\uB77C\uB518", "\uD83D\uDEE1\uFE0F", "9800", "1320", "300"],
  ["c_normal6_2", "\uC608\uD2F0", "\u2744\uFE0F", "10200", "1380", "280"],
  ["c_normal7_2", "\uC30D\uB450\uAD34", "\uD83D\uDC79", "11800", "1520", "320"],
  ["c_normal8_2", "\uC9C4\uD759\uC778\uD615", "\uD83D\uDDFF", "8200", "1200", "240"],
  ["c_normal9_2", "\uB124\uD06C\uB85C\uB9E8\uC11C", "\uD83E\uDDB4", "10800", "1480", "260"],
  ["c_normal10_2", "\uB291\uB300\uC18C\uAD74", "\uD83D\uDC3A", "9200", "1350", "220"],
  ["c_miniboss_2", "\uC554\uD751\uAE30\uC0AC", "\u265E", "20000", "1950", "450"],
  ["c_finalboss_2", "\uC218\uD638\uC790", "\uD83D\uDC51", "36000", "2600", "600"],
];

const tuningRows = [
  ["key", "value", "note"],
  ["max_turns", "15", "\uC804\uD22C \uCD5C\uB300 \uD134(\uC774\uB0B4 \uC885\uB8CC)"],
  ["atk_def_factor", "0.35", "\uD53C\uD574 = atk - def\u00D7\uACC4\uC218 (\uCD5C\uC18C 1)"],
  ["dmg_variance_pct", "18", "\uD53C\uD574 \uB79C\uB364 \u00B1%"],
  ["turn_delay_ms", "280", "\uC0C1\uB2E8 \uB85C\uADF8 \uD55C \uC904 \uAC04\uACA9(ms)"],
  ["player_icon", "\uD83E\uDDA6", "\uC0C1\uB2E8 \uC8FC\uC778\uACF5 \uC544\uC774\uCF58"],
];

function writeCsv(path, rows) {
  fs.writeFileSync(path, rows.map((r) => r.join(",")).join("\n") + "\n", "utf8");
}

writeCsv("C:/chatsystem/data/stage_mode_config.csv", stageRows);
writeCsv("C:/chatsystem/data/combat_enemy_config.csv", enemyRows);
writeCsv("C:/chatsystem/data/combat_tuning.csv", tuningRows);

const stage = fs.readFileSync("C:/chatsystem/data/stage_mode_config.csv", "utf8");
console.log(stage.split("\n")[2]);
console.log("stage ok", /이동 중/.test(stage));
