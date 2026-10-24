import {
  createWorld,
  createQuery,
  trait,
  type Entity,
  type World,
  type Trait,
  type Query,
} from "koota";
import type { Enemy, Bullet, Drop, Effect, Vec, BurnStatus } from "./engine";
import type { Building } from "./terrain";
import type { InjuredSurvivor } from "./rescue";

// Mutable AoS records intentionally preserve contact/burn references and the
// existing instanced renderer. These are the authoritative Koota stores, not
// a mirror synchronized from a second simulation. Scalar world time uses SoA.
export const EnemyState = trait(() => ({}) as Enemy);
export const ProjectileState = trait(() => ({}) as Bullet);
export const PickupState = trait(() => ({}) as Drop);
export const EffectState = trait(() => ({}) as Effect);
export const StructureState = trait(() => ({}) as Building);
export const SurvivorState = trait(() => ({}) as InjuredSurvivor);
export const survivorQuery = createQuery(SurvivorState);
export const PlayerPosition = trait(() => ({ x: 0, z: 0 }));
export const SimulationTime = trait({ delta: 0, elapsed: 0 });
export const IsActor = trait();
export const EnemyBurn = trait(() => ({}) as BurnStatus<Enemy>);
export const enemyQuery = createQuery(EnemyState);
export const projectileQuery = createQuery(ProjectileState);
export const pickupQuery = createQuery(PickupState);
export const effectQuery = createQuery(EffectState);
export const structureQuery = createQuery(StructureState);
export const enemyBurnQuery = createQuery(EnemyState, EnemyBurn);

/** Stable, zero-copy projection of query membership for collision and R3F.
 * Koota add/remove events own membership; callers cannot push into this view.
 * Removal is compacted at system barriers so deaths never skip the next actor.
 */
export class ActorPool<T extends { id: number }> {
  private rows: T[] = [];
  private byRecord = new Map<T, Entity>();
  private byEntity = new Map<Entity, T>();
  private removed = new Set<T>();
  private unsubscribe: (() => void)[];
  constructor(
    readonly world: World,
    readonly state: Trait<() => T>,
    readonly query: Query<[Trait<() => T>]>,
  ) {
    this.unsubscribe = [
      world.onAdd(state, (entity) => {
        const record = entity.get(state)!;
        this.byRecord.set(record, entity);
        this.byEntity.set(entity, record);
        this.rows.push(record);
      }),
      world.onChange(state, (entity) => {
        const previous = this.byEntity.get(entity);
        const record = entity.get(state)!;
        if (!previous || record === previous) return;
        const index = this.rows.indexOf(previous);
        if (index >= 0) this.rows[index] = record;
        this.byRecord.delete(previous);
        this.byRecord.set(record, entity);
        this.byEntity.set(entity, record);
      }),
      world.onRemove(state, (entity) => {
        const record = this.byEntity.get(entity);
        if (!record) return;
        this.removed.add(record);
        this.byRecord.delete(record);
        this.byEntity.delete(entity);
      }),
    ];
  }
  read(): readonly T[] {
    this.compact();
    return this.rows;
  }
  add(...records: T[]) {
    for (const record of records) {
      if (this.byRecord.has(record))
        throw new Error("Actor already belongs to this ECS pool");
      this.world.spawn(IsActor, this.state(record));
    }
  }
  entity(record: T) {
    return this.byRecord.get(record);
  }
  remove(record: T) {
    this.byRecord.get(record)?.destroy();
  }
  replace(records: readonly T[]) {
    // A caller may pass a filtered view of the current records.
    const next = records === this.rows ? [...records] : records;
    this.clear();
    this.add(...next);
  }
  clear() {
    const entities = this.world.query(this.query);
    for (let i = entities.length - 1; i >= 0; i--) entities[i].destroy();
    this.rows.length = 0;
    this.removed.clear();
  }
  private compact() {
    if (!this.removed.size) return;
    let write = 0;
    for (let i = 0; i < this.rows.length; i++) {
      const row = this.rows[i];
      if (!this.removed.has(row)) this.rows[write++] = row;
    }
    this.rows.length = write;
    this.removed.clear();
  }
  prune(keep: (record: T) => boolean) {
    this.world.query(this.query).useStores(([store], entities) => {
      // Structural changes are safe: query results are a snapshot and the
      // stable render projection only compacts after this batch completes.
      for (let i = entities.length - 1; i >= 0; i--) {
        const entity = entities[i];
        if (!keep(store[entity.id()])) entity.destroy();
      }
    });
    this.compact();
  }
  dispose() {
    this.unsubscribe.forEach((unsubscribe) => unsubscribe());
    this.rows.length = 0;
    this.byRecord.clear();
    this.byEntity.clear();
    this.removed.clear();
  }
}
const aliveEnemy = (record: Enemy) => record.hp > 0;
const aliveProjectile = (record: Bullet) => record.life > 0;
const aliveEffect = (record: Effect) => record.life > 0;

export class GameECS {
  readonly world = createWorld(PlayerPosition, SimulationTime);
  readonly enemies = new ActorPool(this.world, EnemyState, enemyQuery);
  readonly projectiles = new ActorPool(
    this.world,
    ProjectileState,
    projectileQuery,
  );
  readonly pickups = new ActorPool(this.world, PickupState, pickupQuery);
  readonly effects = new ActorPool(this.world, EffectState, effectQuery);
  readonly structures = new ActorPool(
    this.world,
    StructureState,
    structureQuery,
  );
  readonly survivors = new ActorPool(this.world, SurvivorState, survivorQuery);
  private position = this.world.get(PlayerPosition)!;
  private unsubscribePosition = this.world.onChange(PlayerPosition, () => {
    this.position = this.world.get(PlayerPosition)!;
  });
  private disposed = false;
  get player() {
    return this.position;
  }
  set player(position: Vec) {
    this.world.set(PlayerPosition, position);
    this.position = this.world.get(PlayerPosition)!;
  }
  cleanup() {
    this.effects.prune(aliveEffect);
    this.projectiles.prune(aliveProjectile);
    this.enemies.prune(aliveEnemy);
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.unsubscribePosition();
    this.enemies.dispose();
    this.projectiles.dispose();
    this.pickups.dispose();
    this.effects.dispose();
    this.structures.dispose();
    this.survivors.dispose();
    this.world.destroy();
  }
}
