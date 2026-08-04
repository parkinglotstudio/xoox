import fs from "fs";

const levelupRule = [
  ["key", "value", "note"],
  ["card_count", "3", "\uC2A4\uD0AC \uC120\uD0DD \uCE74\uB4DC \uC218"],
  ["upgrade_offer_min", "1", "\uAC00\uB2A5\uD558\uBA74 \uC5C5\uADF8\uB808\uC774\uB4DC(+) \uCE74\uB4DC \uCD5C\uC18C N\uC7A5"],
  ["upgrade_first_in_list", "1", "1=\uC5C5\uADF8\uB808\uC774\uB4DC \uCE74\uB4DC\uB97C \uC55E\uC5D0 \uBC30\uCE58"],
  ["allow_same_skill_upgrade", "1", "1=\uB3D9\uC77C \uBCA0\uC774\uC2A4 \uBC30\uC6B0\uBA74 + \uB85C \uC2B9\uAE09"],
];

const skillLevel = [
  ["skill_id", "level", "combat_power_scale", "note"],
];

// Generate level 1-2 for all non-upgrade skills; plus skills are level 2 of base
const skillCsv = fs.readFileSync("C:/chatsystem/data/skill_config.csv", "utf8").trim().split(/\r?\n/).slice(1);
const bases = [];
const plusByBase = {};
for (const line of skillCsv) {
  const [id, name, tier, isUp, baseId] = line.split(",");
  if (String(isUp).toUpperCase() === "TRUE") {
    plusByBase[baseId] = id;
  } else {
    bases.push(id);
  }
}
for (const id of bases) {
  skillLevel.push([id, "1", "1.0", "base"]);
  if (plusByBase[id]) {
    skillLevel.push([plusByBase[id], "2", "1.35", "upgrade +"]);
  }
}

const skillEffect = [
  ["effect_row_id", "skill_id", "trigger", "trigger_value", "target", "op", "value", "value_type", "enabled", "note"],
  ["se_skinharden_dr", "sk_skinharden", "ALWAYS", "0", "DMG_TAKEN_MULT", "MUL", "0.92", "RATIO", "TRUE", "\uD53C\uBD80 \uACBD\uD654"],
  ["se_skinharden_p_dr", "sk_skinharden_plus", "ALWAYS", "0", "DMG_TAKEN_MULT", "MUL", "0.85", "RATIO", "TRUE", "\uD53C\uBD80 \uACBD\uD654+"],
  ["se_defense_max", "sk_defense_max", "ALWAYS", "0", "DMG_TAKEN_MULT", "MUL", "0.88", "RATIO", "TRUE", "\uBC29\uC5B4 \uB05D\uD310\uC655"],
  ["se_lifedeath_atk", "sk_lifedeath", "ALWAYS", "0", "SKILL_DMG_MULT", "ADD", "0.12", "RATIO", "TRUE", "\uACB0\uC0AC\uC758 \uC77C\uC804 \uC784\uC2DC"],
  ["se_combo2", "sk_combo2", "ALWAYS", "0", "SKILL_DMG_MULT", "ADD", "0.1", "RATIO", "TRUE", "\uCF64\uBCF4 X2 \uC784\uC2DC"],
  ["se_tough", "sk_tough", "ALWAYS", "0", "DMG_TAKEN_MULT", "MUL", "0.95", "RATIO", "TRUE", "\uAC15\uC778"],
  ["se_dodge", "sk_dodge", "ALWAYS", "0", "DMG_TAKEN_MULT", "MUL", "0.9", "RATIO", "TRUE", "\uBE48\uC0AC\uC2DC \uD68C\uD53C"],
];

function write(path, rows) {
  fs.writeFileSync(path, rows.map((r) => r.join(",")).join("\n") + "\n", "utf8");
}

write("C:/chatsystem/data/levelup_rule_config.csv", levelupRule);
write("C:/chatsystem/data/skill_level_config.csv", skillLevel);
write("C:/chatsystem/data/skill_effect_config.csv", skillEffect);

// Ensure more + upgrade rows for common skills missing plus
let skills = fs.readFileSync("C:/chatsystem/data/skill_config.csv", "utf8");
const extraPlus = [
  ["sk_shuriken_plus", "\uC218\uB9AC\uAC80+", "\uC77C\uBC18", "TRUE", "sk_shuriken", "\uD83C\uDF00", "\uD22C\uCCA8 \uACF5\uACA9 \uCD94\uAC00 \uAC15\uD654", "ATTACK", "UPGRADE", "\uC218\uB9AC\uAC80 \uAC15\uD654"],
  ["sk_renta_plus", "\uC5F0\uD0C0+", "\uC77C\uBC18", "TRUE", "sk_renta", "\uD83D\uDC4A", "\uC5F0\uD0C0 \uD655\uB960\u00B7\uC704\uB825 \uC0C1\uC2B9", "ATTACK", "UPGRADE", "\uC5F0\uD0C0 \uAC15\uD654"],
  ["sk_normal_shield_plus", "\uC77C\uBC18 \uACF5\uACA9 \uBCF4\uD638\uB9C9+", "\uC77C\uBC18", "TRUE", "sk_normal_shield", "\uD83D\uDEE1\uFE0F", "\uD3C9\uD0C0 \uBCF4\uD638\uB9C9 \uAC15\uD654", "DEFENSE", "UPGRADE", "\uD3C9\uD0C0 \uBCF4\uD638\uB9C9 \uAC15\uD654"],
  ["sk_rage_firewave_plus", "\uBD84\uB178 \uACF5\uACA9 \uD654\uC5FC\uD30C+", "\uC77C\uBC18", "TRUE", "sk_rage_firewave", "\uD83D\uDD25", "\uBD84\uB178 \uD654\uC5FC\uD30C \uAC15\uD654", "ATTACK", "UPGRADE", "\uD654\uC5FC\uD30C \uAC15\uD654"],
  ["sk_lightning_plus", "\uBC88\uAC1C \uC288\uB808\uB354+", "\uC77C\uBC18", "TRUE", "sk_lightning", "\u26A1", "\uBC88\uAC1C \uD53C\uD574 \uCD94\uAC00", "ATTACK", "UPGRADE", "\uBC88\uAC1C \uC288\uB808\uB354 \uAC15\uD654"],
];
for (const row of extraPlus) {
  if (!skills.includes(row[0] + ",")) {
    skills = skills.trimEnd() + "\n" + row.join(",");
  }
}
// Rename sk_lightning display toward video name if still 천뢰
skills = skills.replace(
  "sk_lightning,\uCC9C\uB8B0,",
  "sk_lightning,\uBC88\uAC1C \uC288\uB808\uB354,"
);
if (!skills.includes("sk_lightning,번개 슈레더,") && skills.includes("sk_lightning,천뢰,")) {
  skills = skills.replace("sk_lightning,천뢰,", "sk_lightning,번개 슈레더,");
}
fs.writeFileSync("C:/chatsystem/data/skill_config.csv", skills.endsWith("\n") ? skills : skills + "\n", "utf8");

console.log("level rows", skillLevel.length - 1);
console.log("skills has plus", /sk_shuriken_plus/.test(fs.readFileSync("C:/chatsystem/data/skill_config.csv", "utf8")));
console.log("lightning", fs.readFileSync("C:/chatsystem/data/skill_config.csv", "utf8").split("\n").find((l) => l.startsWith("sk_lightning,")));
