/**
 * 오염 리젠 — 티어별 웨이브 CSV. 고리 스폰 + alive cap + 종류 비율.
 */
import type { BlightWave } from "./BlightWave";
import {
  blightTypeByRole,
  pickBlightRole,
  wavesForTier,
  type RaidTables,
  type RaidWaveRow,
} from "./raidTables";

export class BlightDirector {
  private waves: RaidWaveRow[] = [];
  private elapsed = 0;
  private spawned = new Set<number>();
  private queue: { left: number; gap: number; acc: number; wave: RaidWaveRow } | null = null;
  private ended = false;

  constructor(
    private readonly wave: BlightWave,
    private readonly tables: RaidTables,
  ) {}

  get currentWave(): number {
    if (!this.waves.length) return this.wave.wave;
    const started = [...this.spawned];
    return started.length ? Math.max(...started) : 1;
  }

  get totalWaves(): number {
    return this.waves.length || this.wave.totalWaves;
  }

  get wavesComplete(): boolean {
    if (!this.waves.length) return this.wave.done;
    return this.ended && !this.queue;
  }

  get done(): boolean {
    if (!this.waves.length) return this.wave.done;
    return this.wavesComplete && this.wave.aliveCount === 0 && !this.wave.bossAlive();
  }

  begin(tier: string): void {
    this.waves = wavesForTier(this.tables, tier);
    this.elapsed = 0;
    this.spawned.clear();
    this.queue = null;
    this.ended = false;
    this.wave.resetPool();
    if (this.waves.length) this.wave.useLegacyWaves = false;
    else {
      this.wave.useLegacyWaves = true;
      this.wave.begin();
    }
  }

  tick(dt: number): void {
    if (!this.waves.length) return;
    this.elapsed += dt;
    for (const w of this.waves) {
      if (this.spawned.has(w.wave_index)) continue;
      if (this.elapsed < w.start_sec) continue;
      this.spawned.add(w.wave_index);
      this.wave.setWaveIndex(w.wave_index);
      this.queue = { left: w.count, gap: w.spawn_gap_sec, acc: 0, wave: w };
    }
    if (this.queue) {
      this.queue.acc += dt;
      while (this.queue.left > 0 && this.queue.acc >= this.queue.gap) {
        if (this.wave.aliveCount >= this.queue.wave.alive_cap) break;
        this.queue.acc -= this.queue.gap;
        this.queue.left -= 1;
        this.spawnOne(this.queue.wave);
      }
      if (this.queue.left <= 0) this.queue = null;
    }
    if (this.spawned.size >= this.waves.length && !this.queue) this.ended = true;
    if (this.ended) this.wave.markFinished();
  }

  private spawnOne(wave: RaidWaveRow): void {
    const role = pickBlightRole(wave);
    const t = blightTypeByRole(this.tables, role);
    if (!t) return;
    this.wave.spawnTyped({
      hp: t.hp,
      role: t.role,
      speed_mult: t.speed_mult,
      eat_mult: t.eat_mult,
      scale: t.scale,
      color: t.color_hex,
    });
  }
}
