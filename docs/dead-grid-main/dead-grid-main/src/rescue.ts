import {
  contains,
  segmentHit,
  MAP_LIMIT,
  type Building,
  type Vec,
} from "./terrain";

export const RESCUE_RADIUS = 3;
export const RESCUE_MAX_HP = 100;
export const RESCUE_BLEED_RATE = 50 / 60;
export const RESCUE_HEAL_RATE = RESCUE_BLEED_RATE * 2;
export const RESCUE_FIRST_SPAWN = 45;
export const RESCUE_INTERVAL_MIN = 100;
export const RESCUE_INTERVAL_MAX = 150;
export interface InjuredSurvivor extends Vec {
  id: number;
  hp: number;
  maxHp: number;
  state: "wounded" | "escaping" | "dead";
  healing: boolean;
  appearance: number;
  angle: number;
  changedAt: number;
  route: Vec[];
  routeIndex: number;
  routeVersion: number;
}

export function rescueSecondsRemaining(
  survivor: Pick<InjuredSurvivor, "hp" | "maxHp" | "healing">,
) {
  const seconds =
    Math.max(0, survivor.healing ? survivor.maxHp - survivor.hp : survivor.hp) /
    (survivor.healing ? RESCUE_HEAL_RATE : RESCUE_BLEED_RATE);
  // Accumulated health ticks must not add a spurious second at whole boundaries.
  return Math.max(0, Math.ceil(seconds - 1e-7));
}

// A small static street graph, rebuilt only when a hull collapses/burns away.
// Cardinal links use the same swept, padded hulls as gameplay collision.
const STEP = 2,
  EDGE = MAP_LIMIT - 3,
  WIDTH = (EDGE * 2) / STEP + 1;
export class RescueNavigation {
  private points: (Vec | undefined)[] = [];
  private links: number[][] = [];
  private version = -1;
  private structures: readonly Building[] = [];
  refresh(structures: readonly Building[], version: number) {
    if (this.version === version && this.structures === structures) return;
    this.version = version;
    this.structures = structures;
    this.points = Array.from({ length: WIDTH * WIDTH }, (_, i) => {
      const p = {
        x: -EDGE + (i % WIDTH) * STEP,
        z: -EDGE + Math.floor(i / WIDTH) * STEP,
      };
      return structures.some((b) => contains(b, p, 0.65)) ? undefined : p;
    });
    this.links = this.points.map((p, i) => {
      if (!p) return [];
      const neighbors = [i - WIDTH, i + WIDTH];
      if (i % WIDTH > 0) neighbors.push(i - 1);
      if (i % WIDTH < WIDTH - 1) neighbors.push(i + 1);
      return neighbors.filter((j) => {
        const q = this.points[j];
        return q && !structures.some((b) => segmentHit(p, q, b, 0.55) !== null);
      });
    });
  }
  private nearest(p: Vec) {
    let result = -1,
      distance = Infinity;
    for (let i = 0; i < this.points.length; i++) {
      const q = this.points[i];
      if (!q) continue;
      const d = (q.x - p.x) ** 2 + (q.z - p.z) ** 2;
      if (
        d >= distance ||
        this.structures.some((b) => segmentHit(p, q, b, 0.45) !== null)
      )
        continue;
      result = i;
      distance = d;
    }
    return result;
  }
  private flood(start: number) {
    const parent = new Int32Array(this.points.length).fill(-1);
    const queue: number[] = [];
    if (start < 0) return { parent, queue };
    parent[start] = start;
    queue.push(start);
    for (let head = 0; head < queue.length; head++)
      for (const next of this.links[queue[head]])
        if (parent[next] === -1) {
          parent[next] = queue[head];
          queue.push(next);
        }
    return { parent, queue };
  }
  spawnPoint(player: Vec, random: () => number, occupied: readonly Vec[]) {
    const { queue } = this.flood(this.nearest(player));
    // A rescue point must belong to a street component with an extraction edge.
    if (
      !queue.some((i) => {
        const p = this.points[i]!;
        return Math.abs(p.x) === EDGE || Math.abs(p.z) === EDGE;
      })
    )
      return undefined;
    const candidates = queue.filter((i) => {
      const p = this.points[i]!;
      const d = Math.hypot(p.x - player.x, p.z - player.z);
      return (
        d >= 20 &&
        d <= 48 &&
        occupied.every((q) => Math.hypot(p.x - q.x, p.z - q.z) > 8) &&
        !this.structures.some(
          (b) =>
            b.kind === "vehicle" &&
            b.burningAt >= 0 &&
            b.burnedAt < 0 &&
            Math.hypot(p.x - b.x, p.z - b.z) < 4,
        )
      );
    });
    if (!candidates.length) return undefined;
    return {
      ...this.points[
        candidates[
          Math.min(
            candidates.length - 1,
            Math.floor(random() * candidates.length),
          )
        ]
      ]!,
    };
  }
  escapeRoute(origin: Vec): Vec[] {
    const start = this.nearest(origin);
    const { parent, queue } = this.flood(start);
    const end = queue.find((i) => {
      const p = this.points[i]!;
      return Math.abs(p.x) === EDGE || Math.abs(p.z) === EDGE;
    });
    if (end === undefined) return [];
    const route: Vec[] = [];
    let i = end;
    while (i !== start) {
      route.push({ ...this.points[i]! });
      i = parent[i];
    }
    route.push({ ...this.points[start]! });
    route.reverse();
    const p = this.points[end]!;
    // Reach the street edge first; extraction then crosses the perimeter fence.
    route.push(
      Math.abs(p.x) === EDGE
        ? { x: Math.sign(p.x) * (MAP_LIMIT + 8), z: p.z }
        : { x: p.x, z: Math.sign(p.z) * (MAP_LIMIT + 8) },
    );
    return route;
  }
}

export function rescueMapMarker(player: Vec, target: Vec) {
  const dx = target.x - player.x,
    dz = target.z - player.z;
  const x = (dx - dz) * Math.SQRT1_2 * 1.55,
    y = (dx + dz) * Math.SQRT1_2 * 1.55;
  const length = Math.hypot(x, y),
    edge = length > 50,
    k = edge ? 50 / length : 1;
  return {
    x: 70 + x * k,
    y: 70 + y * k,
    edge,
    angle: (Math.atan2(y, x) * 180) / Math.PI,
    distance: Math.round(Math.hypot(dx, dz)),
  };
}
