import fs from "fs";

const base = [
  ["key", "value", "note"],
  ["base_hp", "500", "시작 HP (밸런스용 축소 스케일)"],
  ["base_max_hp", "500", "시작 최대 HP"],
  ["base_atk", "80", "시작 공격력"],
  ["base_def", "30", "시작 방어력"],
];

const enemies = [
  ["combat_id", "enemy_name", "enemy_icon", "enemy_hp", "enemy_atk", "enemy_def"],
  ["c_normal", "해골병사", "💀", "220", "42", "8"],
  ["c_normal2", "고블린", "👺", "200", "40", "7"],
  ["c_normal3", "슬라임", "🟢", "180", "36", "6"],
  ["c_normal4", "나무몽둥이", "🪵", "210", "41", "8"],
  ["c_normal5", "팔라딘", "🛡️", "280", "48", "14"],
  ["c_normal6", "예티", "❄️", "300", "50", "12"],
  ["c_normal7", "쌍두괴", "👹", "340", "55", "14"],
  ["c_normal8", "진흙인형", "🗿", "240", "44", "10"],
  ["c_normal9", "네크로맨서", "🦴", "320", "52", "11"],
  ["c_normal10", "늑대소굴", "🐺", "260", "49", "9"],
  ["c_miniboss", "암흑기사", "♞", "720", "70", "22"],
  ["c_finalboss", "수호자", "👑", "1400", "95", "30"],
  ["c_normal_2", "해골병사", "💀", "240", "45", "9"],
  ["c_normal2_2", "고블린", "👺", "220", "43", "8"],
  ["c_normal3_2", "슬라임", "🟢", "200", "39", "7"],
  ["c_normal4_2", "나무몽둥이", "🪵", "230", "44", "9"],
  ["c_normal5_2", "팔라딘", "🛡️", "310", "52", "15"],
  ["c_normal6_2", "예티", "❄️", "330", "54", "13"],
  ["c_normal7_2", "쌍두괴", "👹", "370", "58", "15"],
  ["c_normal8_2", "진흙인형", "🗿", "260", "47", "11"],
  ["c_normal9_2", "네크로맨서", "🦴", "350", "56", "12"],
  ["c_normal10_2", "늑대소굴", "🐺", "290", "52", "10"],
  ["c_miniboss_2", "암흑기사", "♞", "820", "78", "24"],
  ["c_finalboss_2", "수호자", "👑", "1600", "105", "34"],
];

function esc(s) {
  // write via unicode for korean safety
  return s;
}

function writeUnicodeCsv(path, rows) {
  const body =
    rows
      .map((r) =>
        r
          .map((cell) => {
            if (typeof cell !== "string") return String(cell);
            return Array.from(cell)
              .map((ch) => {
                const c = ch.codePointAt(0);
                if (c > 127) return `\\u${c.toString(16).toUpperCase().padStart(4, "0")}`;
                return ch;
              })
              .join("");
          })
          .join(",")
      )
      .join("\n") + "\n";
  // evaluate unicode escapes
  const decoded = body.replace(/\\u([0-9A-F]{4})/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
  fs.writeFileSync(path, decoded, "utf8");
}

// Build with explicit unicode for Korean columns
const baseRows = [
  ["key", "value", "note"],
  ["base_hp", "500", "\uC2DC\uC791 HP (\uBC1C\uB780\uC2A4\uC6A9 \uCD95\uC18C \uC2A4\uCF00\uC77C)"],
  ["base_max_hp", "500", "\uC2DC\uC791 \uCD5C\uB300 HP"],
  ["base_atk", "80", "\uC2DC\uC791 \uACF5\uACA9\uB825"],
  ["base_def", "30", "\uC2DC\uC791 \uBC29\uC5B4\uB825"],
];

const enemyRows = [
  ["combat_id", "enemy_name", "enemy_icon", "enemy_hp", "enemy_atk", "enemy_def"],
  ["c_normal", "\uD574\uACE8\uBCD1\uC0AC", "\uD83D\uDC80", "220", "42", "8"],
  ["c_normal2", "\uACE0\uBE14\uB9B0", "\uD83D\uDC7A", "200", "40", "7"],
  ["c_normal3", "\uC2AC\uB77C\uC784", "\uD83D\uDFE2", "180", "36", "6"],
  ["c_normal4", "\uB098\uBB34\uBAAC\uB465\uC774", "\uD83E\uDEB5", "210", "41", "8"],
  ["c_normal5", "\uD314\uB77C\uB518", "\uD83D\uDEE1\uFE0F", "280", "48", "14"],
  ["c_normal6", "\uC608\uD2F0", "\u2744\uFE0F", "300", "50", "12"],
  ["c_normal7", "\uC30D\uB450\uAD34", "\uD83D\uDC79", "340", "55", "14"],
  ["c_normal8", "\uC9C4\uD759\uC778\uD615", "\uD83D\uDDFF", "240", "44", "10"],
  ["c_normal9", "\uB124\uD06C\uB85C\uB9E8\uC11C", "\uD83E\uDDB4", "320", "52", "11"],
  ["c_normal10", "\uB291\uB300\uC18C\uAD74", "\uD83D\uDC3A", "260", "49", "9"],
  ["c_miniboss", "\uC554\uD751\uAE30\uC0AC", "\u265E", "720", "70", "22"],
  ["c_finalboss", "\uC218\uD638\uC790", "\uD83D\uDC51", "1400", "95", "30"],
  ["c_normal_2", "\uD574\uACE8\uBCD1\uC0AC", "\uD83D\uDC80", "240", "45", "9"],
  ["c_normal2_2", "\uACE0\uBE14\uB9B0", "\uD83D\uDC7A", "220", "43", "8"],
  ["c_normal3_2", "\uC2AC\uB77C\uC784", "\uD83D\uDFE2", "200", "39", "7"],
  ["c_normal4_2", "\uB098\uBB34\uBAAC\uB465\uC774", "\uD83E\uDEB5", "230", "44", "9"],
  ["c_normal5_2", "\uD314\uB77C\uB518", "\uD83D\uDEE1\uFE0F", "310", "52", "15"],
  ["c_normal6_2", "\uC608\uD2F0", "\u2744\uFE0F", "330", "54", "13"],
  ["c_normal7_2", "\uC30D\uB450\uAD34", "\uD83D\uDC79", "370", "58", "15"],
  ["c_normal8_2", "\uC9C4\uD759\uC778\uD615", "\uD83D\uDDFF", "260", "47", "11"],
  ["c_normal9_2", "\uB124\uD06C\uB85C\uB9E8\uC11C", "\uD83E\uDDB4", "350", "56", "12"],
  ["c_normal10_2", "\uB291\uB300\uC18C\uAD74", "\uD83D\uDC3A", "290", "52", "10"],
  ["c_miniboss_2", "\uC554\uD751\uAE30\uC0AC", "\u265E", "820", "78", "24"],
  ["c_finalboss_2", "\uC218\uD638\uC790", "\uD83D\uDC51", "1600", "105", "34"],
];

function write(path, rows) {
  const text = rows.map((r) => r.join(",")).join("\n") + "\n";
  fs.writeFileSync(path, text, "utf8");
}

write("C:/chatsystem/data/player_base_stat_config.csv", baseRows);
write("C:/chatsystem/data/combat_enemy_config.csv", enemyRows);
console.log("player", fs.readFileSync("C:/chatsystem/data/player_base_stat_config.csv", "utf8"));
console.log("enemy ok", /해골병사/.test(fs.readFileSync("C:/chatsystem/data/combat_enemy_config.csv", "utf8")));
