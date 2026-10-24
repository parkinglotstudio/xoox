import type { Point } from '../../maps/forest150/ForestNavigation';
import { DEFENSE_BALANCE as B, weaponFor, traitsFor } from './DefenseBalance';
import { makeMonsterRoute, monsterMotion } from './DefenseRoutes';

export type DefenseMode = 'tower' | 'wave' | 'base';
export type FacilityKind = 'tower_gun' | 'tower_throw' | 'tower_cannon' | 'tower_ballista' | 'tower_catapult' | 'k_tent' | 'k_structure' | 'k_machine' | 'k_crane' | 'base';
export const MODE_SECONDS: Record<DefenseMode, number> = { tower: 900, wave: 940, base: 900 };
export const MODE_LABEL: Record<DefenseMode, string> = { tower: '타워 디펜스', wave: '웨이브 디펜스', base: '기지 방어' };
export interface Facility { id: string; kind: FacilityKind; name: string; pos: Point; maxHp: number; hp: number; routeS: number; approach: Point[]; cooldown: number; }
export interface NavigationAdapter { canStand(p: Point, radius?: number): boolean; move(a: Point, b: Point, radius?: number): Point; findPath(a: Point, b: Point, radius?: number): Point[]; }
export interface DefenderEnemy {
 id: number; archetype: string; stage: number; maxHp: number; hp: number; s: number;
 target: string | null; phase: 'road' | 'approach' | 'wait' | 'attack'; cooldown: number;
 speed: number; lane: number; roadS: number; groupId: number; pos: Point; facing: Point; alive: boolean; deadAt: number;
 damage: number; armor: number; attackInterval: number; slot: number; path: Point[]; waypoint: number;
}
export interface DefenseEvent {
 type: 'shot' | 'hit' | 'bite' | 'destroy' | 'down' | 'spawn' | 'impact'; id: number | string;
 target?: number | string; from?: Point; to?: Point; damage?: number;
 source?: 'enemy_attack' | 'tower_shot'; kind?: FacilityKind; flightSeconds?: number; splash?: number;
}
interface Flight { target: number; time: number; damage: number; splash: number; pierce: number; from: Point; to: Point; }
interface Station { pos: Point; attack: boolean; owner: number | null; }
interface Burst { remaining: number; next: number; }
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
export function pathLength(path: Point[]): number { let n = 0; for (let i = 1; i < path.length; i++) n += distance(path[i], path[i - 1]); return n; }
export function onPath(path: Point[], s: number): Point {
 if (!path.length) return { x: 75, y: 26 };
 for (let i = 1; i < path.length; i++) { const a = path[i - 1], b = path[i], d = distance(a, b); if (s <= d) { const t = d ? Math.max(0, s / d) : 0; return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }; } s -= d; }
 return { ...path[path.length - 1] };
}
export function projectPath(path: Point[], p: Point): { s: number; point: Point; distance: number } {
 let total = 0, best = { s: 0, point: { ...path[0] }, distance: Infinity };
 for (let i = 1; i < path.length; i++) { const a = path[i - 1], b = path[i], dx = b.x - a.x, dy = b.y - a.y, d = distance(a, b), t = d ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (d * d))) : 0, q = { x: a.x + dx * t, y: a.y + dy * t }, gap = distance(p, q); if (gap < best.distance) best = { s: total + d * t, point: q, distance: gap }; total += d; }
 return best;
}

/** One fixed clock, enemy list and damage authority. No time-based facility damage. */
export class DefenseSession {
 readonly facilities: Facility[]; readonly enemies: DefenderEnemy[] = []; readonly seen = new Set<string>();
 readonly entryRoutes = new Map<string, Point[]>();
 readonly stageSpawned = [0, 0, 0, 0, 0]; readonly stageKilled = [0, 0, 0, 0, 0];
 elapsed = 0; finished = false; paused = false; killed = 0; spawned = 0; biteCount = 0;
 shotCount = 0; hitCount = 0; splashHits = 0; pierceHits = 0; peakAlive = 0;
 private events: DefenseEvent[] = []; private flights: Flight[] = []; private nextSpawn = 0;
 private serial = 0; private groupSerial = 0; private accumulator = 0; private stageTag = -1; private routeLength: number;
 private stations = new Map<string, Station[]>(); private bursts = new Map<string, Burst>();
 constructor(readonly mode: DefenseMode, readonly route: Point[], facilities: Facility[], readonly spawnEnabled = true, private nav?: NavigationAdapter) {
  if (route.length < 2) throw new Error('Defense route requires two points');
  this.routeLength = pathLength(route);
  for (const id of B.stages.flatMap(s => s.monsters)) this.entryRoutes.set(id, makeMonsterRoute(route, id, nav));
  this.facilities = facilities.map(f => ({ ...f, pos: { ...f.pos }, approach: f.approach.map(p => ({ ...p })), hp: f.maxHp, cooldown: 0 })).sort((a, b) => a.routeS - b.routeS);
  for (const f of this.facilities) {
   const spots: Station[] = [];
   // Individual attack and waiting positions, never a shared approach endpoint.
   for (const [radius, count, attack] of [[5.7, 6, true], [10.2, 12, false], [14.8, 24, false]] as const) for (let i = 0; i < count; i++) {
    const angle = Math.PI / 2 + i * Math.PI * 2 / count;
    const pos = { x: f.pos.x + Math.cos(angle) * radius, y: f.pos.y + Math.sin(angle) * radius };
    if ((!this.nav || this.nav.canStand(pos, .65)) && spots.every(s => distance(s.pos, pos) >= B.bodySpacing)) spots.push({ pos, attack, owner: null });
   }
   this.stations.set(f.id, spots);
  }
 }
 get duration() { return MODE_SECONDS[this.mode]; }
 get remaining() { return Math.max(0, this.duration - this.elapsed); }
 get alive() { return this.enemies.filter(e => e.alive).length; }
 get destroyed() { return this.facilities.filter(f => f.hp <= 0).length; }
 get stage() { return Math.min(4, Math.floor((this.elapsed + 1e-7) / (B.stageSeconds + (this.mode === 'wave' ? B.waveGapSeconds : 0)))); }
 get inGap() { return this.mode === 'wave' && this.stage < 4 && (this.elapsed + 1e-7) % (B.stageSeconds + B.waveGapSeconds) >= B.stageSeconds; }
 get phaseLabel() { return this.finished ? '관찰 완료' : `${this.mode === 'wave' ? '웨이브' : '단계'} ${this.stage + 1} / 5 · ${this.inGap ? '다음 웨이브 준비' : B.stages[this.stage].name}`; }
 get focus() { const f = this.facilities.find(f => f.hp > 0); return f ? { ...f.pos } : onPath(this.route, this.routeLength); }
 drainEvents() { const out = this.events; this.events = []; return out; }
 advance(dt: number) {
  if (!Number.isFinite(dt) || dt <= 0 || this.paused || this.finished) return;
  this.accumulator += dt;
  while (this.accumulator >= .05 - 1e-9 && !this.finished) { this.step(.05); this.accumulator -= .05; }
 }
 private release(e: DefenderEnemy) {
  if (e.target) { const s = this.stations.get(e.target)?.[e.slot]; if (s?.owner === e.id) s.owner = null; }
  e.slot = -1;
 }
 private takeStation(e: DefenderEnemy, f: Facility, attackOnly = false): boolean {
  const spots = this.stations.get(f.id)!;
  const options = spots.map((s, i) => ({ s, i })).filter(({ s }) => s.owner === null && (!attackOnly || s.attack)).sort((a, b) => Number(b.s.attack) - Number(a.s.attack) || distance(e.pos, a.s.pos) - distance(e.pos, b.s.pos));
  for (const { s, i } of options) {
   const path = this.nav ? this.nav.findPath(e.pos, s.pos, .65) : [{ ...e.pos }, { ...s.pos }];
   if (!path.length) continue;
   this.release(e); s.owner = e.id; e.slot = i; e.target = f.id; e.path = path; e.waypoint = path.length > 1 ? 1 : 0; e.phase = 'approach'; return true;
  }
  return false;
 }
 private move(e: DefenderEnemy, goal: Point, dt: number) {
  const d = distance(e.pos, goal); if (d < .001) return;
  const step = Math.min(d, e.speed * dt), dx = (goal.x - e.pos.x) / d * step, dy = (goal.y - e.pos.y) / d * step;
  const previous = e.pos, hand = e.id % 2 ? 1 : -1;
  // Swept small steps plus a hard body distance: crossing splines cannot push units through each other.
  for (const angle of [0, hand * Math.PI / 3, -hand * Math.PI / 3, hand * Math.PI / 2, -hand * Math.PI / 2]) {
   const next = { x: previous.x + dx * Math.cos(angle) - dy * Math.sin(angle), y: previous.y + dx * Math.sin(angle) + dy * Math.cos(angle) };
   const candidate = this.safePosition(e, next);
   if (distance(previous, candidate) > .003) { e.pos = candidate; break; }
  }
  if (distance(previous, e.pos) > .005) e.facing = { x: e.pos.x - previous.x, y: e.pos.y - previous.y };
 }
 private safePosition(e: DefenderEnemy, next: Point): Point {
  const candidate = this.nav ? this.nav.move(e.pos, next, .65) : next;
  return this.enemies.some(other => other.alive && other !== e && distance(candidate, other.pos) < 2.6) ? e.pos : candidate;
 }
 private moveEnemy(e: DefenderEnemy, dt: number) {
  let f = e.target ? this.facilities.find(f => f.id === e.target) : undefined;
  if (f && f.hp <= 0) { this.release(e); e.target = null; e.phase = 'road'; e.s = Math.max(e.s, f.routeS + .1); f = undefined; }
  if (e.phase === 'road') {
   const next = this.facilities.find(f => f.hp > 0 && f.routeS >= e.s - 12);
   if (next && e.s >= next.routeS - 12 && this.takeStation(e, next)) f = next;
   else {
    const limit = next ? next.routeS - 4 : this.routeLength;
    const ownRoute = this.entryRoutes.get(e.archetype)!;
    const stop = projectPath(ownRoute, onPath(this.route, limit)).s;
    e.roadS = Math.max(e.roadS, projectPath(ownRoute, e.pos).s);
    this.move(e, onPath(ownRoute, Math.min(stop, e.roadS + e.speed * dt + .5)), dt);
    e.roadS = Math.max(e.roadS, projectPath(ownRoute, e.pos).s);
    e.s = Math.max(e.s, projectPath(this.route, e.pos).s);
    return;
   }
  }
  if (e.phase === 'wait' && f) this.takeStation(e, f, true);
  if ((e.phase === 'approach' || e.phase === 'wait') && f) {
   const spot = this.stations.get(f.id)?.[e.slot]; if (!spot) return;
   const goal = e.path[e.waypoint] ?? spot.pos; this.move(e, goal, dt);
   if (distance(e.pos, goal) < .18 && e.waypoint < e.path.length - 1) e.waypoint++;
   if (distance(e.pos, spot.pos) < .35) e.phase = spot.attack ? 'attack' : 'wait';
  }
  if (e.phase === 'attack' && f) {
   const spot = this.stations.get(f.id)?.[e.slot]; if (spot) this.move(e, spot.pos, dt);
   e.facing = { x: f.pos.x - e.pos.x, y: f.pos.y - e.pos.y };
  }
 }
 /** Spatial hash separation changes actual positions in every movement phase. */
 private separate() {
  const live = this.enemies.filter(e => e.alive), size = B.bodySpacing;
  for (let pass = 0; pass < 4; pass++) {
   let crowded = false;
   const grid = new Map<string, DefenderEnemy[]>();
   for (const e of live) { const key = `${Math.floor(e.pos.x / size)},${Math.floor(e.pos.y / size)}`; const cell = grid.get(key); if (cell) cell.push(e); else grid.set(key, [e]); }
   for (const e of live) {
    const x = Math.floor(e.pos.x / size), y = Math.floor(e.pos.y / size);
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (const other of grid.get(`${x + dx},${y + dy}`) ?? []) {
     if (other.id <= e.id) continue;
     const d = distance(e.pos, other.pos); if (d >= size) continue;
     if (d < 2.7) crowded = true;
     const angle = (e.id * 13 + other.id * 7) * 2.399;
     const ux = d > .001 ? (other.pos.x - e.pos.x) / d : Math.cos(angle), uy = d > .001 ? (other.pos.y - e.pos.y) / d : Math.sin(angle), push = (size - d + .01) / 2;
     const a = { x: e.pos.x - ux * push, y: e.pos.y - uy * push }, b = { x: other.pos.x + ux * push, y: other.pos.y + uy * push };
     e.pos = this.safePosition(e, a); other.pos = this.safePosition(other, b);
    }
   }
   if (!crowded) break;
  }
 }
 private damage(e: DefenderEnemy, amount: number) {
  if (!e.alive) return;
  const effective = amount * (1 - e.armor), dealt = Math.min(e.hp, effective); e.hp = Math.max(0, e.hp - effective); this.hitCount++;
  this.events.push({ type: 'hit', id: e.id, damage: dealt, source: 'tower_shot', to: { ...e.pos } });
  if (!e.hp) { e.alive = false; e.deadAt = this.elapsed; this.release(e); this.killed++; this.stageKilled[e.stage]++; this.events.push({ type: 'down', id: e.id, to: { ...e.pos } }); }
 }
 private impact(flight: Flight) {
  const direct = this.enemies.find(e => e.id === flight.target && e.alive), at = direct ? { ...direct.pos } : flight.to;
  const others = this.enemies.filter(e => e.alive && e !== direct);
  if (direct) this.damage(direct, flight.damage);
  if (flight.splash > 0) for (const e of others) if (distance(e.pos, at) <= flight.splash) { this.damage(e, flight.damage * .75); this.splashHits++; }
  if (flight.pierce > 0) {
   const dx = at.x - flight.from.x, dy = at.y - flight.from.y, length = Math.max(.01, Math.hypot(dx, dy));
   const pierced = others.filter(e => { const x = e.pos.x - flight.from.x, y = e.pos.y - flight.from.y, along = (x * dx + y * dy) / length; return along > 0 && along <= length + 8 && Math.abs(x * dy - y * dx) / length < 1.7; }).sort((a, b) => distance(a.pos, at) - distance(b.pos, at)).slice(0, flight.pierce);
   for (const e of pierced) { this.damage(e, flight.damage * .85); this.pierceHits++; }
  }
  this.events.push({ type: 'impact', id: flight.target, to: at, splash: flight.splash });
 }
 private fire(f: Facility) {
  const gun = weaponFor(f.kind); if (!gun) return false;
  const reserved = new Map<number, number>(); for (const p of this.flights) { const enemy = this.enemies.find(e => e.id === p.target); reserved.set(p.target, (reserved.get(p.target) ?? 0) + p.damage * (1 - (enemy?.armor ?? 0))); }
  const targets = this.enemies.filter(e => e.alive && e.hp - (reserved.get(e.id) ?? 0) > 0 && distance(e.pos, f.pos) <= gun.range).sort((a, b) => Number(b.phase === 'attack') - Number(a.phase === 'attack') || b.s - a.s || a.id - b.id);
  const e = targets[0]; if (!e) return false;
  const time = Math.max(.08, distance(e.pos, f.pos) / gun.velocity);
  this.flights.push({ target: e.id, time, damage: gun.damage, splash: gun.splash, pierce: gun.pierce, from: { ...f.pos }, to: { ...e.pos } }); this.shotCount++;
  this.events.push({ type: 'shot', id: f.id, target: e.id, from: { ...f.pos }, to: { ...e.pos }, kind: f.kind, flightSeconds: time, splash: gun.splash }); return true;
 }
 private step(dt: number) {
  this.elapsed = Math.min(this.duration, this.elapsed + dt);
  const stage = this.stage, spec = B.stages[stage];
  if (stage !== this.stageTag) { this.stageTag = stage; this.nextSpawn = 0; }
  if (this.spawnEnabled && !this.inGap) { this.nextSpawn -= dt; if (this.nextSpawn <= 0 && this.alive < B.maxEnemies && this.spawnGroup(stage)) this.nextSpawn = spec.spawnInterval * 2.4 * (this.mode === 'base' ? .95 : 1); }
  const pending: Flight[] = []; for (const flight of this.flights) { flight.time -= dt; if (flight.time > 0) pending.push(flight); else this.impact(flight); } this.flights = pending;
  for (const e of this.enemies) if (e.alive) { e.cooldown -= dt; this.moveEnemy(e, dt); }
  this.separate();
  for (const e of this.enemies) {
   if (!e.alive || e.phase !== 'attack' || e.cooldown > 0) continue;
   const f = this.facilities.find(f => f.id === e.target), spot = f && this.stations.get(f.id)?.[e.slot];
   if (!f || f.hp <= 0 || !spot || !spot.attack || distance(e.pos, spot.pos) > 1.1 || distance(e.pos, f.pos) > 7) continue;
   e.cooldown = e.attackInterval; f.hp = Math.max(0, f.hp - e.damage); this.biteCount++;
   this.events.push({ type: 'bite', id: e.id, target: f.id, from: { ...e.pos }, to: { ...f.pos }, damage: e.damage, source: 'enemy_attack' });
   if (!f.hp) this.events.push({ type: 'destroy', id: f.id, to: { ...f.pos }, source: 'enemy_attack' });
  }
  for (const f of this.facilities) {
   const gun = weaponFor(f.kind); if (!gun || f.hp <= 0) continue;
   f.cooldown -= dt; const burst = this.bursts.get(f.id);
   if (burst) { burst.next -= dt; if (burst.next <= 0) { if (this.fire(f)) burst.remaining--; else burst.remaining = 0; burst.next += gun.spacing; if (!burst.remaining) this.bursts.delete(f.id); } }
   else if (f.cooldown <= 0 && this.fire(f)) { f.cooldown = gun.interval; if (gun.burst > 1) this.bursts.set(f.id, { remaining: gun.burst - 1, next: gun.spacing }); }
  }
  for (let i = this.enemies.length - 1; i >= 0; i--) if (!this.enemies[i].alive && this.elapsed - this.enemies[i].deadAt > 2.5) this.enemies.splice(i, 1);
  this.peakAlive = Math.max(this.peakAlive, this.alive);
  if (this.elapsed >= this.duration - 1e-8) { this.elapsed = this.duration; this.finished = true; }
 }
 private spawnGroup(stage: number): boolean {
  const groupId = ++this.groupSerial, count = 2 + groupId % 2;
  let spawned = false;
  for (let i = 0; i < count && this.alive < B.maxEnemies; i++) spawned = this.spawn(stage, groupId) || spawned;
  return spawned;
 }
 private spawn(stage: number, groupId: number): boolean {
  const id = this.serial + 1, spec = B.stages[stage];
  const archetype = spec.monsters[this.stageSpawned[stage] % spec.monsters.length], motion = monsterMotion(archetype), ownRoute = this.entryRoutes.get(archetype)!;
  for (let n = 0; n < 7; n++) {
   const lane = motion.sector, roadS = n * 3.4, pos = onPath(ownRoute, roadS);
   if (this.enemies.some(e => e.alive && distance(e.pos, pos) < B.bodySpacing + .2)) continue;
   const traits = traitsFor(archetype), hp = Math.round(spec.hp * traits.hpMultiplier);
   this.serial = id;
   const e: DefenderEnemy = { id, archetype, stage, maxHp: hp, hp, s: projectPath(this.route,pos).s, target: null, phase: 'road', cooldown: .6, speed: spec.speed * motion.speed, lane, roadS, groupId, pos, facing: { x: 0, y: -1 }, alive: true, deadAt: -1, damage: Math.max(1, Math.round(spec.damage * traits.damageMultiplier)), armor: traits.armor, attackInterval: spec.attackInterval * traits.attackIntervalMultiplier, slot: -1, path: [], waypoint: 0 };
   this.enemies.push(e); this.spawned++; this.stageSpawned[stage]++; this.seen.add(archetype); this.events.push({ type: 'spawn', id, to: { ...pos } }); return true;
  }
  return false;
 }
}
