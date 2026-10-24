/**
 * 정화 숲의 걸어다니는 길과 건설 자리.
 * navigation.json · construction.json 이 정본이다. 좌표를 여기서 새로 만들지 않는다.
 */

export type ForestPad = {
  id: string;
  site: number;
  name: string;
  kind: "tower" | "unit";
  x: number;
  y: number;
};

export type ForestCourse = {
  walkableAt(x: number, y: number): boolean;
  path(ax: number, ay: number, bx: number, by: number): Array<{ x: number; y: number }>;
  pads: ForestPad[];
  pad(site: number, kind: "tower" | "unit"): ForestPad | null;
  /** 그 높이에서 걸어갈 수 있는 길의 한가운데 */
  centerX(y: number): number | null;
  /** 길 한가운데에 count개를 북쪽 순서로 깐다. 전부 걸어갈 수 있는 칸 */
  along(count: number, fromY: number): Array<{ x: number; y: number }>;
  /** 지금보다 북쪽(y가 큰 쪽)의 다음 유닛 자리. 없으면 null */
  nextUnit(y: number): ForestPad | null;
};

type NavFile = {
  cellMeters: number;
  width: number;
  height: number;
  walkable: number[];
};

type ConFile = {
  sites: Array<{ id: number; name: string }>;
  slots: Array<{ id: string; site: number; kind: string; x: number; y: number }>;
};

const PLACE_URL = "/ui/layout/forest_construction.json";

async function loadConstruction(fallbackUrl: string): Promise<ConFile> {
  try {
    const over = await fetch(PLACE_URL, { cache: "no-store" });
    if (over.ok) {
      const saved = (await over.json()) as ConFile;
      if (saved?.slots?.length) return saved;
    }
  } catch {
    /* 저장본이 없으면 숲에 들어 있는 자리를 쓴다 */
  }
  const r = await fetch(fallbackUrl, { cache: "no-store" });
  if (!r.ok) throw new Error(fallbackUrl + " " + r.status);
  return r.json() as Promise<ConFile>;
}

let pending: Promise<ForestCourse | null> | null = null;

export function loadForestCourse(navUrl: string, constructionUrl: string): Promise<ForestCourse | null> {
  if (pending) return pending;
  pending = (async () => {
    try {
      const [nav, con] = await Promise.all([
        fetch(navUrl, { cache: "no-store" }).then((r) => r.json() as Promise<NavFile>),
        loadConstruction(constructionUrl),
      ]);
      return buildCourse(nav, con);
    } catch (e) {
      console.warn("forest course load failed", e);
      pending = null;
      return null;
    }
  })();
  return pending;
}

function buildCourse(nav: NavFile, con: ConFile): ForestCourse {
  const cell = nav.cellMeters;
  const width = nav.width;
  const height = nav.height;
  const walk = nav.walkable;
  const names = new Map(con.sites.map((s) => [s.id, s.name]));
  const pads: ForestPad[] = con.slots
    .filter((s) => s.kind === "tower" || s.kind === "unit")
    .map((s) => ({
      id: s.id,
      site: s.site,
      name: names.get(s.site) ?? s.id,
      kind: s.kind as "tower" | "unit",
      x: s.x,
      y: s.y,
    }))
    .sort((a, b) => a.y - b.y || a.x - b.x);

  const walkableAt = (x: number, y: number) => {
    const ix = Math.floor(x / cell);
    const iy = Math.floor(y / cell);
    if (ix < 0 || iy < 0 || ix >= width || iy >= height) return false;
    return !!walk[iy * width + ix];
  };

  const path = (ax: number, ay: number, bx: number, by: number) => {
    if (walkableAt(bx, by) && clearLine(walkableAt, ax, ay, bx, by)) return [{ x: bx, y: by }];
    return simplify(search(walkableAt, ax, ay, bx, by), walkableAt);
  };

  return {
    walkableAt,
    path,
    pads,
    pad(site, kind) {
      return pads.find((p) => p.site === site && p.kind === kind) ?? null;
    },
    centerX(y) {
      return spanCenter(walkableAt, y);
    },
    along(count, fromY) {
      const gap = count > 18 ? 8 : 12;
      const pts: Array<{ x: number; y: number }> = [];
      for (let y = fromY + 8; y < 290 && pts.length < count; y += 2) {
        const x = spanCenter(walkableAt, y);
        if (x == null || !walkableAt(x, y) || !walkableAt(x - 3, y) || !walkableAt(x + 3, y)) continue;
        const prev = pts[pts.length - 1];
        if (prev && y - prev.y < gap) continue;
        pts.push({ x, y });
      }
      return pts;
    },
    nextUnit(y) {
      return pads.find((p) => p.kind === "unit" && p.y > y + 6) ?? null;
    },
  };
}

function spanCenter(walk: (x: number, y: number) => boolean, y: number): number | null {
  let best: [number, number] | null = null;
  let start = -1;
  for (let x = 20; x <= 131; x++) {
    const on = x < 131 && walk(x, y);
    if (on && start < 0) start = x;
    if (!on && start >= 0) {
      if (!best || x - start > best[1] - best[0]) best = [start, x - 1];
      start = -1;
    }
  }
  if (!best) return null;
  const mid = (best[0] + best[1]) / 2;
  return walk(mid, y) ? mid : best[0];
}

function clearLine(walk: (x: number, y: number) => boolean, ax: number, ay: number, bx: number, by: number) {
  const dist = Math.hypot(bx - ax, by - ay);
  const steps = Math.max(1, Math.ceil(dist));
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    if (!walk(ax + (bx - ax) * t, ay + (by - ay) * t)) return false;
  }
  return true;
}

/** 남북으로 긴 초지. y를 따라가며 그 줄에서 걸어갈 수 있는 x를 고른다. */
function search(
  walk: (x: number, y: number) => boolean,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): Array<{ x: number; y: number }> {
  const step = 4;
  const dir = by >= ay ? 1 : -1;
  const pts: Array<{ x: number; y: number }> = [];
  let x = ax;
  for (let y = ay; dir > 0 ? y < by - 0.5 : y > by + 0.5; y += step * dir) {
    let best = x;
    let bestD = 1e9;
    for (let ix = 30; ix <= 120; ix += 1) {
      if (!walk(ix, y)) continue;
      const d = Math.abs(ix - x) + Math.abs(ix - bx) * 0.2;
      if (d < bestD) {
        bestD = d;
        best = ix;
      }
    }
    if (bestD > 1e8) continue;
    x = best;
    pts.push({ x, y });
  }
  if (walk(bx, by)) pts.push({ x: bx, y: by });
  return pts;
}

function simplify(
  pts: Array<{ x: number; y: number }>,
  walk: (x: number, y: number) => boolean,
): Array<{ x: number; y: number }> {
  if (pts.length < 3) return pts;
  const out = [pts[0]!];
  let anchor = 0;
  for (let i = 2; i < pts.length; i++) {
    if (!clearLine(walk, pts[anchor]!.x, pts[anchor]!.y, pts[i]!.x, pts[i]!.y)) {
      out.push(pts[i - 1]!);
      anchor = i - 1;
    }
  }
  out.push(pts[pts.length - 1]!);
  return out;
}
