/**
 * 배경 오브젝트 원형 충돌을 피하는 짧은 경로.
 * 그리드 A* — 자동 walkTo / 다가가기용.
 */

export type PathObstacle = { x: number; z: number; r: number };

export function findWorldPath(
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  obstacles: PathObstacle[],
  opts?: { cell?: number; half?: number; pad?: number },
): { x: number; z: number }[] {
  const cell = opts?.cell ?? 2.2;
  const half = opts?.half ?? 48;
  const pad = opts?.pad ?? 0.35;
  const blocked = (x: number, z: number) => {
    for (const o of obstacles) {
      if (Math.hypot(x - o.x, z - o.z) < o.r + pad) return true;
    }
    return false;
  };
  if (blocked(x1, z1)) {
    const nudged = nudgeOut(x1, z1, obstacles, pad + 0.2);
    x1 = nudged.x;
    z1 = nudged.z;
  }
  if (!blocked(x0, z0) && clearSegment(x0, z0, x1, z1, obstacles, pad)) {
    return [{ x: x1, z: z1 }];
  }

  const key = (gx: number, gz: number) => `${gx},${gz}`;
  const toG = (v: number) => Math.round(v / cell);
  const fromG = (g: number) => g * cell;
  const g0x = toG(x0);
  const g0z = toG(z0);
  const g1x = toG(x1);
  const g1z = toG(z1);
  const gHalf = Math.ceil(half / cell);

  type Node = { gx: number; gz: number; g: number; f: number; px: number; pz: number };
  const open: Node[] = [];
  const best = new Map<string, number>();
  const came = new Map<string, { px: number; pz: number }>();
  const h = (gx: number, gz: number) => Math.hypot(gx - g1x, gz - g1z);
  const push = (n: Node) => {
    open.push(n);
    open.sort((a, b) => a.f - b.f);
  };
  push({ gx: g0x, gz: g0z, g: 0, f: h(g0x, g0z), px: g0x, pz: g0z });
  best.set(key(g0x, g0z), 0);

  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ];
  let found: { gx: number; gz: number } | null = null;
  let guard = 0;
  while (open.length && guard++ < 4000) {
    const cur = open.shift()!;
    if (cur.gx === g1x && cur.gz === g1z) {
      found = cur;
      break;
    }
    for (const [dx, dz] of dirs) {
      const nx = cur.gx + dx!;
      const nz = cur.gz + dz!;
      if (Math.abs(nx) > gHalf || Math.abs(nz) > gHalf) continue;
      const wx = fromG(nx);
      const wz = fromG(nz);
      if (blocked(wx, wz)) continue;
      const step = dx !== 0 && dz !== 0 ? 1.414 : 1;
      const ng = cur.g + step;
      const k = key(nx, nz);
      if (best.has(k) && (best.get(k) as number) <= ng) continue;
      best.set(k, ng);
      came.set(k, { px: cur.gx, pz: cur.gz });
      push({ gx: nx, gz: nz, g: ng, f: ng + h(nx, nz), px: cur.gx, pz: cur.gz });
    }
  }

  if (!found) {
    const nudged = nudgeOut(x1, z1, obstacles, pad + 0.5);
    return [{ x: nudged.x, z: nudged.z }];
  }

  const rev: { x: number; z: number }[] = [];
  let cx = found.gx;
  let cz = found.gz;
  for (let i = 0; i < 500; i++) {
    rev.push({ x: fromG(cx), z: fromG(cz) });
    const k = key(cx, cz);
    const p = came.get(k);
    if (!p || (p.px === cx && p.pz === cz)) break;
    if (cx === g0x && cz === g0z) break;
    cx = p.px;
    cz = p.pz;
  }
  rev.reverse();
  if (!rev.length) return [{ x: x1, z: z1 }];
  rev[rev.length - 1] = { x: x1, z: z1 };
  return simplify(rev, obstacles, pad);
}

function clearSegment(
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  obstacles: PathObstacle[],
  pad: number,
): boolean {
  const steps = Math.max(4, Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 1.2));
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = x0 + (x1 - x0) * t;
    const z = z0 + (z1 - z0) * t;
    for (const o of obstacles) {
      if (Math.hypot(x - o.x, z - o.z) < o.r + pad) return false;
    }
  }
  return true;
}

function nudgeOut(x: number, z: number, obstacles: PathObstacle[], pad: number): { x: number; z: number } {
  let ox = x;
  let oz = z;
  for (let n = 0; n < 8; n++) {
    let hit = false;
    for (const o of obstacles) {
      const d = Math.hypot(ox - o.x, oz - o.z);
      const need = o.r + pad;
      if (d < need && d > 1e-4) {
        const s = need / d;
        ox = o.x + (ox - o.x) * s;
        oz = o.z + (oz - o.z) * s;
        hit = true;
      } else if (d < need) {
        ox = o.x + need;
        oz = o.z;
        hit = true;
      }
    }
    if (!hit) break;
  }
  return { x: ox, z: oz };
}

function simplify(
  pts: { x: number; z: number }[],
  obstacles: PathObstacle[],
  pad: number,
): { x: number; z: number }[] {
  if (pts.length <= 2) return pts;
  const out: { x: number; z: number }[] = [pts[0]!];
  let i = 0;
  while (i < pts.length - 1) {
    let j = pts.length - 1;
    while (j > i + 1) {
      if (clearSegment(pts[i]!.x, pts[i]!.z, pts[j]!.x, pts[j]!.z, obstacles, pad)) break;
      j--;
    }
    out.push(pts[j]!);
    i = j;
  }
  return out;
}

/** 플레이어 한 걸음을 장애원에서 밀어낸다 */
export function resolveCircleMove(
  x: number,
  z: number,
  dx: number,
  dz: number,
  obstacles: PathObstacle[],
  pad: number,
): { x: number; z: number } {
  let nx = x + dx;
  let nz = z + dz;
  for (let n = 0; n < 4; n++) {
    let moved = false;
    for (const o of obstacles) {
      const d = Math.hypot(nx - o.x, nz - o.z);
      const need = o.r + pad;
      if (d < need && d > 1e-5) {
        const s = need / d;
        nx = o.x + (nx - o.x) * s;
        nz = o.z + (nz - o.z) * s;
        moved = true;
      }
    }
    if (!moved) break;
  }
  return { x: nx, z: nz };
}
