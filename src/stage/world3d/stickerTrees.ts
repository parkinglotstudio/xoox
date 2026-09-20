/**
 * 여정 월드에 심는 나무 스티커 3종 — 배치 툴·CSV 런타임이 같은 수치를 쓴다.
 * 픽셀 비율은 data/art/props/sticker 팩 실측(높이 1048).
 */
export const STICKER_TREES = [
  {
    id: "tree_01",
    file: "prop_sticker_tree_01.png",
    name: "우산 수관",
    hM: 5.6,
    aspect: 761 / 1048,
    zone: "meadow",
    defaultCount: 25,
    color: "#c8e86a",
  },
  {
    id: "tree_02",
    file: "prop_sticker_tree_02.png",
    name: "키 큰 수관",
    hM: 6.8,
    aspect: 716 / 1048,
    zone: "forest",
    defaultCount: 25,
    color: "#1f6b3a",
  },
  {
    id: "tree_03",
    file: "prop_sticker_tree_03.png",
    name: "낮은 뭉치",
    hM: 4.4,
    aspect: 1769 / 1048,
    zone: "edge",
    defaultCount: 24,
    color: "#6a9a3a",
  },
] as const;

export type StickerTreeId = (typeof STICKER_TREES)[number]["id"];
export type StickerTreeZone = (typeof STICKER_TREES)[number]["zone"];

export function stickerTreeById(id: string) {
  return STICKER_TREES.find((t) => t.id === id);
}

export function aspectForPropArt(art: string | undefined): number | undefined {
  if (!art) return undefined;
  if (art.includes("prop_sticker_tree_07")) return 1536 / 630;
  if (art.includes("prop_sticker_tree_06")) return 618 / 1536;
  if (art.includes("prop_sticker_tree_05")) return 716 / 1048;
  if (art.includes("prop_sticker_tree_04")) return 761 / 1048;
  for (const t of STICKER_TREES) {
    if (art.includes(t.file) || art.includes(t.id)) return t.aspect;
  }
  if (art.includes("life_mecha_dog")) return 985 / 900;
  if (art.includes("grass_short_a") || art.includes("grass_short_d")) return 764 / 532;
  if (art.includes("grass_short_b") || art.includes("grass_short_e")) return 803 / 580;
  if (art.includes("grass_short_c")) return 784 / 283;
  if (art.includes("prop_sticker_grass_03")) return 784 / 283;
  if (art.includes("prop_sticker_grass_02")) return 803 / 580;
  if (art.includes("prop_sticker_grass_01")) return 764 / 532;
  return undefined;
}
