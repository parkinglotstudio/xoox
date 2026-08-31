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

  /** 착탄 스킬 연출 — 정화제(teal) / 퇴치제(blight) 확실히 구분 */
  playSkillHit(x: number, z: number, kind: "purify" | "exterminate"): void {
    const purify = kind === "purify";
    this.grit.emit({
      x,
      z,
      y: 0.12,
      count: purify ? 28 : 34,
      mode: "burst",
      spreadM: purify ? 1.35 : 1.1,
      lifeSec: 0.7,
      sizeMin: 0.06,
      sizeMax: purify ? 0.2 : 0.18,
      palette: purify ? "teal" : "blight",
    });
    this.grit.emit({
      x,
      z,
      y: 0.05,
      count: purify ? 18 : 22,
      mode: "erosion",
      spreadM: purify ? 1.8 : 1.5,
      lifeSec: 0.85,
      sizeMin: 0.05,
      sizeMax: 0.14,
      palette: purify ? "life" : "blight",
    });
  }

  /**
   * 대폭발 — 기본 skill_spread의 약 3배, 바닥에서 터짐
   */
  playGroundBoom(x: number, z: number): void {
    const cfg = vfxById(this.tables, "skill_spread");
    const baseCount = cfg?.particle_count ?? 12;
    const baseSpread = cfg?.spread_m ?? 0.7;
    const baseLife = cfg?.life_sec ?? 0.45;
    const sizeMin = cfg?.size_min ?? 0.06;
    const sizeMax = cfg?.size_max ?? 0.14;
    // 바닥 코어
    this.grit.emit({
      x,
      z,
      y: 0.08,
      count: Math.round(baseCount * 3),
      mode: "burst",
      spreadM: baseSpread * 3,
      lifeSec: baseLife * 1.35,
      sizeMin: sizeMin * 1.6,
      sizeMax: sizeMax * 2.4,
      palette: "teal",
    });
    // 바닥 침식 링 (수제비 아닌 넓은 바닥 충격)
    this.grit.emit({
      x,
      z,
      y: 0.05,
      count: Math.round(baseCount * 2),
      mode: "erosion",
      spreadM: baseSpread * 3.2,
      lifeSec: baseLife * 1.5,
      sizeMin: sizeMin * 1.2,
      sizeMax: sizeMax * 2,
      palette: "life",
    });
  }

  /**
   * 연쇄 수제비 — 한 점이 바닥에 톡, 잔물결처럼 퍼짐
   */
  playWaterDumpling(x: number, z: number, scale = 1): void {
    const cfg = vfxById(this.tables, "skill_bolt");
    const baseCount = cfg?.particle_count ?? 8;
    const baseSpread = cfg?.spread_m ?? 0.4;
    this.grit.emit({
      x,
      z,
      y: 0.06,
      count: Math.max(6, Math.round(baseCount * 1.4 * scale)),
      mode: "burst",
      spreadM: baseSpread * 1.6 * scale,
      lifeSec: 0.5,
      sizeMin: 0.05,
      sizeMax: 0.14 * scale,
      palette: "teal",
    });
    this.grit.emit({
      x,
      z,
      y: 0.04,
      count: Math.max(5, Math.round(baseCount * scale)),
      mode: "erosion",
      spreadM: baseSpread * 2.2 * scale,
      lifeSec: 0.55,
      sizeMin: 0.04,
      sizeMax: 0.11 * scale,
      palette: "life",
    });
  }

  /**
   * 해제·정화 성공 — 팍 퍼지며 “죽인 게 아니라 풀렸다” 느낌
   */
  playReleaseBurst(x: number, z: number, kind: "bug" | "wave" | "culprit" = "wave"): void {
    const mul = kind === "culprit" ? 2.4 : kind === "wave" ? 1.7 : 0.85;
    const count = Math.round((kind === "culprit" ? 48 : kind === "wave" ? 36 : 14) * 1);
    // 바닥에서 밖으로 확
    this.grit.emit({
      x,
      z,
      y: 0.06,
      count,
      mode: "burst",
      spreadM: 1.1 * mul,
      lifeSec: 0.75 + mul * 0.15,
      sizeMin: 0.07,
      sizeMax: 0.22 * Math.min(mul, 1.8),
      palette: "teal",
    });
    this.grit.emit({
      x,
      z,
      y: 0.04,
      count: Math.round(count * 0.7),
      mode: "erosion",
      spreadM: 1.6 * mul,
      lifeSec: 0.9,
      sizeMin: 0.05,
      sizeMax: 0.16 * mul,
      palette: "life",
    });
    // 수제비처럼 한 번 더 바깥 링
    if (kind !== "bug") {
      window.setTimeout(() => {
        this.grit.emit({
          x,
          z,
          y: 0.05,
          count: Math.round(18 * mul),
          mode: "erosion",
          spreadM: 2.4 * mul,
          lifeSec: 0.7,
          sizeMin: 0.06,
          sizeMax: 0.14,
          palette: "teal",
        });
      }, 120);
      window.setTimeout(() => {
        this.grit.emit({
          x,
          z,
          y: 0.05,
          count: Math.round(14 * mul),
          mode: "burst",
          spreadM: 3.2 * mul,
          lifeSec: 0.55,
          sizeMin: 0.05,
          sizeMax: 0.12,
          palette: "life",
        });
      }, 260);
    }
  }

  tick(dt: number): void {
    this.grit.tick(dt);
  }

  dispose(): void {
    this.grit.dispose();
  }
}
