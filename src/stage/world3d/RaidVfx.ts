/**
 * 습격 VFX — 모래식 grit burst/erosion (구 sphere 대체).
 */
import type { JourneyStage3D } from "./JourneyStage3D";
import { GritBurst } from "./fx/GritBurst";
import { vfxById, type RaidTables } from "./raidTables";

/** death / boss 계열은 erosion, 나머지는 burst */
function modeFor(id: string): "burst" | "erosion" {
  if (id.includes("death") || id.includes("boss")) return "erosion";
  return "burst";
}

export class RaidVfx {
  private grit: GritBurst;

  constructor(
    private readonly stage: JourneyStage3D,
    private readonly tables: RaidTables,
  ) {
    this.grit = new GritBurst(stage);
  }

  play(id: string, x: number, z: number): void {
    const cfg = vfxById(this.tables, id);
    if (!cfg) return;
    const mode = modeFor(id);
    this.grit.emit({
      x,
      z,
      count: Math.max(4, cfg.particle_count),
      mode,
      spreadM: Math.max(0.25, cfg.spread_m),
      lifeSec: Math.max(0.25, cfg.life_sec),
      sizeMin: Math.max(0.03, cfg.size_min),
      sizeMax: Math.max(0.05, cfg.size_max * 1.2),
      palette: "teal",
    });
  }

  tick(dt: number): void {
    this.grit.tick(dt);
  }

  dispose(): void {
    this.grit.dispose();
  }
}
