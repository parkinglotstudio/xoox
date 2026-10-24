import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = "data/tools/unit_lab/installed";
const sources = JSON.parse(
  await readFile("data/tools/unit_lab/units_free/_sources_quaternius.json", "utf8"),
);
const title = new Map(sources.map((s) => [s.file.replace(/\.glb$/, ""), s.title]));

function nice(file) {
  return file
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const groups = [
  ["td", "케니 타워디펜스"],
  ["factory", "케니 공장"],
  ["survival", "케니 생존"],
  ["monsters", "몬스터 원본"],
];

const out = { groups: [] };
for (const [id, name] of groups) {
  const files = (await readdir(path.join(root, id))).filter((f) => f.endsWith(".glb")).sort();
  out.groups.push({
    name,
    dir: `/tools/unit_lab/installed/${id}`,
    items: files.map((f) => {
      const stem = f.slice(0, -4);
      return { file: stem, name: title.get(stem) || nice(stem) };
    }),
  });
  const seen = new Map();
  for (const item of out.groups.at(-1).items) seen.set(item.name, (seen.get(item.name) ?? 0) + 1);
  for (const item of out.groups.at(-1).items) {
    if ((seen.get(item.name) ?? 0) > 1) item.name = `${item.name} · ${item.file}`;
  }
}

await writeFile(path.join(root, "manifest.json"), JSON.stringify(out, null, 1));
console.log(out.groups.map((g) => `${g.name} ${g.items.length}`).join(" | "));
