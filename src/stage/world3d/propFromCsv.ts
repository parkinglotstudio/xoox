import type { AreaPropDef } from "../../types";
import type { PropKind, WorldProp } from "./types";
import { aspectForPropArt } from "./stickerTrees";

const KINDS = new Set<string>([
  "building",
  "tower",
  "fence",
  "sign",
  "crate",
  "barrel",
  "pole",
  "tree",
  "bush",
  "debris",
]);

export function csvPropToWorld(p: AreaPropDef): WorldProp {
  const kind = (KINDS.has(p.kind) ? p.kind : "crate") as PropKind;
  const art = p.art?.trim()
    ? p.art.startsWith("/")
      ? p.art
      : `/art/props/sticker/${p.art}`
    : undefined;
  return {
    id: p.prop_id,
    xPct: p.x_pct,
    yPct: p.y_pct,
    kind,
    yawDeg: p.yaw_deg,
    hM: p.h_m > 0 ? p.h_m : undefined,
    collide: p.collide,
    purifyTarget: p.purify_target,
    lifeBlightId: p.life_blight_id || undefined,
    art,
    aspect: aspectForPropArt(art),
    groupId: p.group_id || undefined,
    collideR:
      p.group_id === "sea_wall" ? (art?.includes("tree_07") ? 2.6 : 2.05) : undefined,
  };
}

export function csvRowToWorldProp(r: Record<string, string>): WorldProp {
  return csvPropToWorld({
    prop_id: r.prop_id || "",
    area_id: r.area_id || "",
    kind: (r.kind || "crate").toLowerCase(),
    x_pct: Number(r.x_pct) || 50,
    y_pct: Number(r.y_pct) || 50,
    yaw_deg: Number(r.yaw_deg) || 0,
    h_m: Number(r.h_m) || 0,
    group_id: r.group_id || "",
    collide: r.collide === undefined || r.collide === "" ? true : isCsvTrue(r.collide),
    purify_target: isCsvTrue(r.purify_target),
    life_blight_id: (r.life_blight_id || "").trim(),
    art: (r.art || "").trim(),
    note: r.note || "",
  });
}

function isCsvTrue(v: string | undefined): boolean {
  const s = (v || "").trim().toUpperCase();
  return s === "TRUE" || s === "1" || s === "YES";
}
