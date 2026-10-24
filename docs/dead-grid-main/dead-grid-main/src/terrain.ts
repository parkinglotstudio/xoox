export interface Vec {
  x: number;
  z: number;
}
export interface Building extends Vec {
  id: number;
  kind: "building" | "vehicle" | "barrier" | "barrel" | "boundary";
  rotation: number;
  burningAt: number;
  burnedAt: number;
  w: number;
  d: number;
  height: number;
  hp: number;
  maxHp: number;
  flash: number;
  collapsedAt: number;
  siegeDamage: number;
}

// The render mesh, navigation, projectile collision and vision share this hull.
export const BUILDING_LAYOUT = [-48, -18, 18, 48].flatMap((x, xi) =>
  [-48, -18, 18, 48].map((z, zi) => ({
    id: xi * 4 + zi,
    kind: "building" as const,
    rotation: 0,
    x,
    z,
    w: 12.8,
    d: 12.8,
    height: 5 + ((xi * 3 + zi * 7) % 6),
    maxHp: 1800 + ((xi + zi) % 3) * 200,
  })),
);
export const createBuildings = (): Building[] =>
  BUILDING_LAYOUT.map((b) => ({
    ...b,
    hp: b.maxHp,
    burningAt: -1,
    burnedAt: -1,
    flash: 0,
    collapsedAt: -1,
    siegeDamage: 0,
  }));
export const VEHICLE_BURN_SECONDS = 12;
export const VEHICLE_LAYOUT = [
  [-4, 12, 0],
  [-10, -4, Math.PI / 2],
  [5, -13, 0.08],
  [12, 5, Math.PI / 2],
  [-5, -18, -0.1],
  [32, 4, Math.PI / 2],
  [-31, -4, Math.PI / 2],
  [5, 32, 0],
  [-4, -31, 0],
].map(([x, z, rotation], i) => ({
  id: 100 + i,
  kind: "vehicle" as const,
  x,
  z,
  rotation,
  w: 2.15,
  d: 4.5,
  height: 1.8,
  maxHp: 380,
}));
export const PROP_LAYOUT = [
  ...[
    [-14, 3],
    [14, -3],
    [1, 16],
    [-1, -16],
  ].map(([x, z], i) => ({
    id: 200 + i,
    kind: "barrier" as const,
    x,
    z,
    rotation: 0,
    w: 3.1,
    d: 0.85,
    height: 1.2,
    maxHp: 440,
  })),
  ...[
    [9, 2],
    [-9, -6],
    [2, 11],
    [-12, 12],
    [14, -10],
    [-2, -11],
  ].map(([x, z], i) => ({
    id: 210 + i,
    kind: "barrel" as const,
    x,
    z,
    rotation: 0,
    w: 0.8,
    d: 0.8,
    height: 1,
    maxHp: 120,
  })),
];
// Inner faces sit at the same ±65m limit used by navigation.
export const MAP_LIMIT = 65;
export const BOUNDARY_LAYOUT = [
  {
    id: 300,
    kind: "boundary" as const,
    x: 0,
    z: -66,
    rotation: 0,
    w: 134,
    d: 2,
    height: 2.5,
    maxHp: 1,
  },
  {
    id: 301,
    kind: "boundary" as const,
    x: 0,
    z: 66,
    rotation: 0,
    w: 134,
    d: 2,
    height: 2.5,
    maxHp: 1,
  },
  {
    id: 302,
    kind: "boundary" as const,
    x: -66,
    z: 0,
    rotation: 0,
    w: 2,
    d: 130,
    height: 2.5,
    maxHp: 1,
  },
  {
    id: 303,
    kind: "boundary" as const,
    x: 66,
    z: 0,
    rotation: 0,
    w: 2,
    d: 130,
    height: 2.5,
    maxHp: 1,
  },
];
export const isDestructible = (b: Building) =>
  b.kind === "building" || b.kind === "vehicle";
const createProps = (
  layout: typeof VEHICLE_LAYOUT | typeof PROP_LAYOUT | typeof BOUNDARY_LAYOUT,
): Building[] =>
  layout.map((b) => ({
    ...b,
    hp: b.maxHp,
    flash: 0,
    collapsedAt: -1,
    siegeDamage: 0,
    burningAt: -1,
    burnedAt: -1,
  }));
export const createVehicles = () => createProps(VEHICLE_LAYOUT);
export const createBarriers = () => createProps(PROP_LAYOUT);
export const createBoundary = () => createProps(BOUNDARY_LAYOUT);
export const isSolid = (b: Building) =>
  !isDestructible(b) ||
  b.hp > 0 ||
  (b.kind === "vehicle" && b.burningAt >= 0 && b.burnedAt < 0);
export const toLocal = (p: Vec, b: Building): Vec => ({
  x: (p.x - b.x) * Math.cos(b.rotation) - (p.z - b.z) * Math.sin(b.rotation),
  z: (p.x - b.x) * Math.sin(b.rotation) + (p.z - b.z) * Math.cos(b.rotation),
});
export const toWorld = (p: Vec, b: Building): Vec => ({
  x: b.x + p.x * Math.cos(b.rotation) + p.z * Math.sin(b.rotation),
  z: b.z - p.x * Math.sin(b.rotation) + p.z * Math.cos(b.rotation),
});
// Nearest surface/inside point on the same rotated hull used by collision.
export function closestPoint(b: Building, p: Vec): Vec {
  const local = toLocal(p, b);
  return toWorld(
    {
      x: Math.max(-b.w / 2, Math.min(b.w / 2, local.x)),
      z: Math.max(-b.d / 2, Math.min(b.d / 2, local.z)),
    },
    b,
  );
}
export function pushOut(b: Building, p: Vec, r: number) {
  const q = toLocal(p, b);
  const candidates = [
    { x: -b.w / 2 - r - 0.002, z: q.z },
    { x: b.w / 2 + r + 0.002, z: q.z },
    { x: q.x, z: -b.d / 2 - r - 0.002 },
    { x: q.x, z: b.d / 2 + r + 0.002 },
  ];
  candidates.sort(
    (a, c) =>
      (a.x - q.x) ** 2 +
      (a.z - q.z) ** 2 -
      ((c.x - q.x) ** 2 + (c.z - q.z) ** 2),
  );
  return toWorld(candidates[0], b);
}
export const FOG_MIN = -74;
export const FOG_CELL = 2;
export const FOG_SIZE = 74;
export const SIGHT_RADIUS = 17;
export const fogIndex = (p: Vec) => {
  const x = Math.floor((p.x - FOG_MIN) / FOG_CELL);
  const z = Math.floor((p.z - FOG_MIN) / FOG_CELL);
  return x >= 0 && z >= 0 && x < FOG_SIZE && z < FOG_SIZE
    ? z * FOG_SIZE + x
    : -1;
};
// Rotated hull coefficients are cached by identity and invalidated if a
// fixture/editor changes geometry. Solidity always reads live health/fire state.
interface HullCache {
  x: number;
  z: number;
  w: number;
  d: number;
  rotation: number;
  c: number;
  s: number;
  ex: number;
  ez: number;
}
const hulls = new WeakMap<Building, HullCache>();
function hull(b: Building) {
  let h = hulls.get(b);
  if (
    !h ||
    h.x !== b.x ||
    h.z !== b.z ||
    h.w !== b.w ||
    h.d !== b.d ||
    h.rotation !== b.rotation
  ) {
    const c = Math.cos(b.rotation),
      s = Math.sin(b.rotation);
    h = {
      x: b.x,
      z: b.z,
      w: b.w,
      d: b.d,
      rotation: b.rotation,
      c,
      s,
      ex: (Math.abs(c) * b.w) / 2 + (Math.abs(s) * b.d) / 2,
      ez: (Math.abs(s) * b.w) / 2 + (Math.abs(c) * b.d) / 2,
    };
    hulls.set(b, h);
  }
  return h;
}
export function contains(b: Building, p: Vec, radius = 0) {
  if (!isSolid(b)) return false;
  const h = hull(b),
    dx = p.x - b.x,
    dz = p.z - b.z;
  return (
    Math.abs(dx * h.c - dz * h.s) < b.w / 2 + radius &&
    Math.abs(dx * h.s + dz * h.c) < b.d / 2 + radius
  );
}
// Allocation-free broad phase followed by the same padded local OBB slab test.
// The epsilon makes the broad phase conservative at rotated/tangent boundaries.
export function segmentHit(
  a: Vec,
  end: Vec,
  b: Building,
  padding = 0,
): number | null {
  if (!isSolid(b)) return null;
  const h = hull(b),
    margin = padding * (Math.abs(h.c) + Math.abs(h.s)) + 1e-10;
  if (
    Math.min(a.x, end.x) > b.x + h.ex + margin ||
    Math.max(a.x, end.x) < b.x - h.ex - margin ||
    Math.min(a.z, end.z) > b.z + h.ez + margin ||
    Math.max(a.z, end.z) < b.z - h.ez - margin
  )
    return null;
  const ax = a.x - b.x,
    az = a.z - b.z,
    bx = end.x - b.x,
    bz = end.z - b.z;
  const sx = ax * h.c - az * h.s,
    sz = ax * h.s + az * h.c,
    fx = bx * h.c - bz * h.s,
    fz = bx * h.s + bz * h.c;
  let near = 0,
    far = 1;
  for (let axis = 0; axis < 2; axis++) {
    const start = axis === 0 ? sx : sz,
      finish = axis === 0 ? fx : fz,
      half = (axis === 0 ? b.w : b.d) / 2 + padding,
      delta = finish - start;
    if (Math.abs(delta) < 1e-8) {
      if (start < -half || start > half) return null;
    } else {
      let t0 = (-half - start) / delta,
        t1 = (half - start) / delta;
      if (t0 > t1) {
        const tmp = t0;
        t0 = t1;
        t1 = tmp;
      }
      near = Math.max(near, t0);
      far = Math.min(far, t1);
      if (near > far) return null;
    }
  }
  return near <= 1 && far >= 0 ? near : null;
}

export function lineOfSight(
  a: Vec,
  end: Vec,
  buildings: readonly Building[],
  revealBuilding = false,
) {
  for (const b of buildings) {
    if (revealBuilding && contains(b, end)) continue;
    const t = segmentHit(a, end, b);
    if (t !== null && t < 0.999) return false;
  }
  return true;
}

export function segmentCircleHit(
  a: Vec,
  end: Vec,
  center: Vec,
  radius: number,
): number | null {
  const x = a.x - center.x,
    z = a.z - center.z,
    dx = end.x - a.x,
    dz = end.z - a.z;
  const c = x * x + z * z - radius * radius;
  if (c <= 0) return 0;
  const aa = dx * dx + dz * dz;
  if (aa < 1e-10) return null;
  const bb = 2 * (x * dx + z * dz),
    disc = bb * bb - 4 * aa * c;
  if (disc < 0) return null;
  const t = (-bb - Math.sqrt(disc)) / (2 * aa);
  return t >= 0 && t <= 1 ? t : null;
}
