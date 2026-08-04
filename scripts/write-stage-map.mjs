import fs from "fs";

/** 30일 = 1맵. 맵1 여유 / 맵2부터 간당간당(스킬 선택 중요) */
const rows = [
  [
    "stage_map_id",
    "map_order",
    "display_name",
    "day_start",
    "day_end",
    "enemy_hp_mult",
    "enemy_atk_mult",
    "enemy_def_mult",
    "drop_gold_mult",
    "drop_exp_mult",
    "balance_tag",
    "note",
  ],
  [
    "map_1",
    "1",
    "\uB9F5 1",
    "1",
    "30",
    "1.00",
    "1.00",
    "1.00",
    "1.00",
    "1.00",
    "FORGIVING",
    "\uC5EC\uC720 \uAD6C\uAC04. \uC2A4\uD0AC \uB300\uCDA9 \uACE8\uB77C\uB3C4 \uD074\uB9AC\uC5B4 \uAC00\uB2A5",
  ],
  [
    "map_2",
    "2",
    "\uB9F5 2",
    "31",
    "60",
    "1.55",
    "1.40",
    "1.25",
    "1.15",
    "1.20",
    "TIGHT",
    "\uAC04\uB2F9\uAC04\uB2F9. \uC2A4\uD0AC\uC744 \uC798 \uACE0\uB974\uACE0 \uC120\uD0DD\uD574\uC57C \uC774\uAE40",
  ],
];

fs.writeFileSync(
  "C:/chatsystem/data/stage_map_config.csv",
  rows.map((r) => r.join(",")).join("\n") + "\n",
  "utf8"
);
const t = fs.readFileSync("C:/chatsystem/data/stage_map_config.csv", "utf8");
console.log(t);
console.log("ok", /맵 1/.test(t) && /맵 2/.test(t));
