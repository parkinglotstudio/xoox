/**
 * event_text_pool 에 body_line2 컬럼 추가.
 * 원작 대박: 슬롯=1줄(body) → 종료 후 2줄(body + body_line2) 펼침.
 */
import fs from "fs";
import path from "path";

const DATA = path.resolve("data");
const file = path.join(DATA, "event_text_pool.csv");
const raw = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
const lines = raw.trimEnd().split(/\r?\n/);
const header = lines[0].split(",");

if (header.includes("body_line2")) {
  console.log("body_line2 already present");
  process.exit(0);
}

const bodyIdx = header.indexOf("body");
const rows = lines.slice(1).filter(Boolean).map((line) => {
  const cols = line.split(",");
  const fixed = {};
  header.slice(0, -1).forEach((h, i) => {
    fixed[h] = cols[i] ?? "";
  });
  fixed.body = cols.slice(bodyIdx).join(",");
  return fixed;
});

/** 대박/대박성 텍스트 2줄째 (원작 느낌 임시 카피) */
const LINE2 = {
  t_ruin: "고대 마물 문명은 몹시 찬란했던 것 같습니다.",
  t_luckybox: "상자 안에서 눈부신 빛이 퍼져 나왔습니다.",
  t_waterblessing: "축복의 물결이 몸을 감싸 힘이 솟아오릅니다.",
  t_ruin_2: "고대 마물 문명은 몹시 찬란했던 것 같습니다.",
  t_luckybox_2: "상자 안에서 눈부신 빛이 퍼져 나왔습니다.",
  t_waterblessing_2: "축복의 물결이 몸을 감싸 힘이 솟아오릅니다.",
  t_treasuremap: "지도에 표시된 장소로 향할 준비가 되었습니다.",
  t_treasuremap_2: "지도에 표시된 장소로 향할 준비가 되었습니다.",
};

// 대박 _2 본문에서 [임시] 접두를 슬롯 1줄용으로 정리
const CLEAN_BODY = {
  t_ruin_2: "마물 고대종이 원고 드래곤족과의 전투 유적을 또 발견했습니다.",
  t_luckybox_2: "운빨이 정말 좋으시네요! 행운의 보물을 또 발견하셨습니다.",
  t_waterblessing_2: "물의 여신 오케아니데스를 다시 만나 축복을 받았습니다.",
  t_treasuremap_2: "루드비히의 보물지도를 또 손에 넣어 보물을 찾으러 가기로 했습니다.",
};

const outHeader = ["text_id", "category", "grade_id", "body", "body_line2"];
const out = [outHeader.join(",")];
for (const r of rows) {
  const id = r.text_id;
  const body = CLEAN_BODY[id] ?? r.body;
  const line2 = LINE2[id] ?? "";
  out.push([id, r.category, r.grade_id, body, line2].join(","));
}
fs.writeFileSync(file, out.join("\n") + "\n", "utf8");
console.log("updated", rows.length, "rows; jackpot line2 count", Object.keys(LINE2).length);
