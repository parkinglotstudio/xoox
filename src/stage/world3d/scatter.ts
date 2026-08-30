/**
 * 구조물 임시 배치 — 구역 시드 고정.
 * NPC 원과 겹치지 않게 피한다. CSV(area_prop_config)가 있으면 그쪽이 우선.
 */
import type { PropKind, WorldProp } from "./types";

const KINDS: PropKind[] = ["crate", "barrel", "fence", "tree", "bush", "debris"];

export type AvoidDisk = { xPct: number; yPct: number; rPct: number };

export function scatterProps(
  areaId: string,
  count: number,
  avoid: AvoidDisk[] = [],
): WorldProp[] {
  if (count <= 0) return [];
  const cap = Math.min(count, 48);
  const rand = seeded(hashString(areaId));
  const out: WorldProp[] = [];
  let guard = 0;
  while (out.length < cap && guard++ < cap * 40) {
    const xPct = 10 + rand() * 80;
    const yPct = 12 + rand() * 76;
    if (hitsAvoid(xPct, yPct, avoid)) continue;
    const kind = KINDS[Math.floor(rand() * KINDS.length)]!;
    out.push({
      id: `prop_${areaId}_${out.length}`,
      xPct,
      yPct,
      kind,
      yawDeg: rand() * 360,
      collide: true,
    });
  }
  return out;
}

function hitsAvoid(x: number, y: number, avoid: AvoidDisk[]): boolean {
  for (const a of avoid) {
    if (Math.hypot(x - a.xPct, y - a.yPct) < a.rPct) return true;
  }
  return false;
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seeded(seed: number): () => number {
  let s = seed || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}
