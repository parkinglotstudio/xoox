import type { PlantedTree } from "./plantTrees";

export const PROP_CSV_HEADER =
  "prop_id,area_id,kind,x_pct,y_pct,yaw_deg,h_m,group_id,collide,purify_target,life_blight_id,art,note";

export const PROP_CSV_PATH = "data/area_prop_config.csv";

const LIFE_BUNDLE =
  "p_i21_life_bundle,area_i21,debris,32,54,0,2.4,g_life_bundle,TRUE,FALSE,,prop_sticker_life_mecha_dog.png,생명 뭉치 — 스케치→총 정화→동반";

export function isGameplayKeepRow(line: string): boolean {
  if (!line.trim() || line.startsWith("prop_id")) return false;
  return (
    line.startsWith("p_i21_life_bundle,") ||
    /,(TRUE|true),(TRUE|true),/.test(line) ||
    /life_mecha_dog|g_life_bundle/.test(line)
  );
}

export function treesToCsv(trees: PlantedTree[], keepLines: string[] = []): string {
  const keep = keepLines.filter((l) => l.trim() && !l.startsWith("prop_id"));
  const hasLife = keep.some((l) => l.startsWith("p_i21_life_bundle,"));
  const extras = hasLife ? keep : [LIFE_BUNDLE, ...keep];
  const rows = trees.map((t) =>
    [
      t.prop_id,
      t.area_id,
      t.kind,
      t.x_pct,
      t.y_pct,
      t.yaw_deg,
      t.h_m,
      t.group_id,
      t.collide ? "TRUE" : "FALSE",
      t.purify_target ? "TRUE" : "FALSE",
      t.life_blight_id,
      t.art,
      csvCell(t.note),
    ].join(","),
  );
  return [PROP_CSV_HEADER, ...extras, ...rows].join("\n") + "\n";
}

function csvCell(s: string): string {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
