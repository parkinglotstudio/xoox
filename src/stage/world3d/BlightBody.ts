/**
 * 본편 오염 크리쳐 — 점구름 한 덩어리. 다른 에이전트는 이 파일만 보면 됨.
 *
 * 한글        코드        툴 버튼
 * 얼룩        stain      동그라미 · 얼룩
 * 오염물질    matter     오염물질
 * 물방울      droplet    물방울
 * 오염 벌레   bug        세모 · 오염 벌레
 * 원흉        culprit    네모 · 원흉
 * 인간 원흉   human      인간 원흉
 *
 * 행동 (크리쳐 수명)
 * spawn()  리젠 — 땅에서 올라오기
 * hit()    피격 — 번쩍 + 알갱이 살짝 풀림
 * die()    죽음 — 퍼지기
 * blight() 정화전
 * purify() 정화후
 * tick(dt) 매 프레임
 *
 *   const body = await BlightBody.create("culprit", { scale: 1.1 });
 *   stage.addOverlay(body.group);
 *   body.setWorld(x, z);
 *   body.spawn();
 *   body.hit();
 *   body.die();
 *   body.tick(dt);
 */
import { CulpritCloud, loadBugVolume, loadCulpritGlobe, loadHumanCulprit, loadPollutant, loadStainDroplet, loadWaterDroplet, petFit, type CulpritForm } from "./CulpritCloud";

export type BlightKind = "stain" | "matter" | "droplet" | "bug" | "culprit" | "human";

export const BLIGHT_KIND_KO: Record<BlightKind, string> = {
  stain: "얼룩",
  matter: "오염물질",
  droplet: "물방울",
  bug: "오염 벌레",
  culprit: "원흉",
  human: "인간 원흉",
};

function formOf(kind: BlightKind): CulpritForm {
  if (kind === "stain") return "stain";
  if (kind === "matter") return "matter";
  if (kind === "droplet") return "droplet";
  if (kind === "bug") return "bug";
  if (kind === "human") return "human";
  return "culprit";
}

async function loadKind(kind: BlightKind): Promise<number> {
  if (kind === "stain") return loadStainDroplet();
  if (kind === "matter") return loadPollutant();
  if (kind === "droplet") return loadWaterDroplet();
  if (kind === "culprit") return loadCulpritGlobe();
  if (kind === "human") return loadHumanCulprit();
  if (kind === "bug") return loadBugVolume();
  return loadCulpritGlobe();
}

export class BlightBody {
  readonly kind: BlightKind;
  readonly cloud: CulpritCloud;

  private constructor(kind: BlightKind, cloud: CulpritCloud) {
    this.kind = kind;
    this.cloud = cloud;
  }

  get group() {
    return this.cloud.group;
  }

  static async create(kind: BlightKind, opts?: { scale?: number }): Promise<BlightBody> {
    await loadKind(kind);
    const fit = petFit();
    const cap =
      kind === "human" || kind === "matter"
        ? 36000
        : kind === "bug"
          ? 22000
          : kind === "stain"
            ? 36000
            : 14000;
    const scale = opts?.scale ?? 1;
    const countBase = Math.min(cap, Math.max(kind === "bug" ? 2400 : 800, fit.count));
    const cloud = new CulpritCloud({
      form: formOf(kind),
      count: kind === "stain" ? Math.min(cap, Math.floor(countBase * 2)) : countBase,
      size: fit.size,
    });
    cloud.group.scale.setScalar(scale);
    // Points size는 부모 scale에 안 따라가서 따로 맞춤
    if (kind === "matter") {
      cloud.setSize(Math.max(0.03, fit.size * Math.max(1, scale * 0.9) * 0.5));
    } else if (kind === "stain") {
      cloud.setSize(Math.max(0.025, fit.size * 0.62));
    } else if (kind === "bug") {
      cloud.setSize(Math.max(0.035, fit.size * 0.95));
    }
    cloud.gather = 1;
    cloud.gatherTo = 1;
    cloud.purify = kind === "stain" || kind === "culprit" || kind === "human" || kind === "matter" || kind === "bug" ? 0 : 1;
    cloud.purifyTo = cloud.purify;
    cloud.rise = 1;
    cloud.riseTo = 1;
    return new BlightBody(kind, cloud);
  }

  setWorld(x: number, z: number): void {
    this.cloud.setWorld(x, z);
  }

  /** 리젠 */
  spawn(): void {
    this.cloud.spawn();
  }

  /** 피격 */
  hit(): void {
    this.cloud.hit();
  }

  /** 죽음 */
  die(): void {
    this.cloud.die();
  }

  blight(): void {
    this.cloud.playBeforePurify();
  }

  purify(): void {
    this.cloud.playAfterPurify();
  }

  tick(dt: number): void {
    this.cloud.tick(dt);
  }

  dispose(): void {
    this.cloud.dispose();
  }
}
