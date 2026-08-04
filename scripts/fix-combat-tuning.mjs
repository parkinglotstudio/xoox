import fs from "fs";
const rows = [
  ["key", "value", "note"],
  ["max_turns", "15", "\uC804\uD22C \uCD5C\uB300 \uD134(\uC774\uB0B4 \uC885\uB8CC)"],
  ["atk_def_factor", "0.35", "\uD53C\uD574 = atk - def\u00D7\uACC4\uC218 (\uCD5C\uC18C 1)"],
  ["dmg_variance_pct", "18", "\uD53C\uD574 \uB79C\uB364 \u00B1%"],
  ["turn_delay_ms", "280", "\uC0C1\uB2E8 \uB85C\uADF8 \uD55C \uC904 \uAC04\uACA9(ms)"],
  ["player_icon", "\uD83E\uDDA6", "\uC0C1\uB2E8 \uC8FC\uC778\uACF5 \uC544\uC774\uCF58"],
  ["skill_per_skill_base", "0.02", "\uC2A4\uD0AC 1\uAC1C\uB2F9 \uAE30\uBCF8 \uC804\uD22C \uBC30\uC728"],
  ["skill_per_run_level", "0.008", "\uB7F0\uB808\uBCA8 1\uB2F9 \uC2A4\uD0AC \uBC30\uC728 \uCD94\uAC00"],
];
fs.writeFileSync("C:/chatsystem/data/combat_tuning.csv", rows.map((r) => r.join(",")).join("\n") + "\n", "utf8");
console.log(fs.readFileSync("C:/chatsystem/data/combat_tuning.csv", "utf8"));
