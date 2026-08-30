/**
 * 들판(i21) 정화 루프 — 30m 원 · 색 3단 · 시나리오 콘텐츠를 종류마다 한 번씩.
 */
import { BlightWave } from "./BlightWave";
import { CulpritCloud } from "./CulpritCloud";
import { GroundPaint } from "./GroundPaint";
import type { JourneyStage3D } from "./JourneyStage3D";
import { THROW_FORWARD_DEG } from "./StoneThrow";
import { loadPurifyRaidConfig, type PurifyRaidConfig } from "./purifyRaidConfig";
import { orderSearchSpots } from "../../quest/questFlow";
import {
  loopRunAddBugs,
  loopRunBegin,
  loopRunEnd,
  loopRunLine,
  loopRunLive,
  loopRunNoteUnlucky,
  loopRunTakeBugs,
  loopRunTickDay,
  type LoopRunSnap,
} from "../../quest/loopRun";
import type { QuestSpotDef, QuestStepDef } from "../../types";

export type LoopBeat =
  | "arrive"
  | "mission"
  | "aside"
  | "tint1"
  | "invade"
  | "tint2"
  | "king"
  | "done";

/** 한 원에 한 번씩 도는 시나리오 콘텐츠. 1·2판이 같은 룰 슬롯. */
export type LoopContentKind =
  | "catalyst"
  | "inhibit"
  | "life"
  | "life2"
  | "filter"
  | "trace"
  | "daily"
  | "daily_jackpot"
  | "daily_mid"
  | "daily_bad"
  | "commentary"
  | "branch"
  | "skill"
  | "memory"
  | "memo"
  | "location"
  | "npc"
  | "rest"
  | "rescue"
  | "minigame_gold"
  | "minigame_square"
  | "minigame_myth"
  | "minigame_dig"
  | "minigame_circle"
  | "arena";

export interface SectorLoopHooks {
  onFiller: (dialogueId: string) => Promise<void>;
  onContent: (kind: LoopContentKind, at?: { xPct: number; yPct: number }) => Promise<void>;
  onBeat?: (beat: LoopBeat) => void;
  onHud?: (label: string) => void;
  onThrowSpend?: (kind: "adsorb" | "inhibit" | "culprit") => boolean;
  onStainCleared?: () => Promise<void>;
  huntTune?: () => {
    rangeAdd: number;
    speedMul: number;
    splashMul: number;
    eatMul?: number;
    invadeMul?: number;
  };
  /** 원흉 대화. pass=물질 제거로, abort=원 실패 */
  onCulprit?: () => Promise<"pass" | "abort">;
  onCondFill?: (kind: "stain" | "rescue" | "memory") => void;
  /** CSV 퀘스트. 있으면 하드코딩 비트 대신 이 순서로 돈다. */
  questSteps?: QuestStepDef[];
  questSpots?: QuestSpotDef[];
  onQuestText?: (textId: string) => Promise<void>;
  /** 갈림길. A=빠름 B=느림 */
  onBranch?: (branchId: string) => Promise<"A" | "B">;
  /** 모으기 연타. 자리 앞에서 게이지 */
  onMashCollect?: (label: string, at?: { xPct: number; yPct: number }) => Promise<void>;
  /** 행동 1개가 끝난 뒤 — 원본처럼 등급 보상 필러 */
  onActionReward?: (step: QuestStepDef) => Promise<void>;
  /** 칸을 닫았을 때 필러 한 줄 */
  onRunEnd?: (rec: LoopRunSnap, line: string) => Promise<void>;
}

function liveHuntTune(hooks: SectorLoopHooks) {
  return (
    hooks.huntTune?.() ?? {
      rangeAdd: 0,
      speedMul: 1,
      splashMul: 1,
      eatMul: 1,
      invadeMul: 1,
    }
  );
}

interface LoopCfg {
  area_id: string;
  radius_m: number;
  color_steps: number[];
  difficulty: "easy" | "hard";
  mission_count: number;
  mission_min_r: number;
  mission_max_r: number;
  invade_count: number;
  invade_min_r: number;
  invade_max_r: number;
  invade_speed_mps: number;
  king_hp: number;
  king_r: number;
  eat_revert_sec: number;
  arrive_dialogue_id: string;
  mission_dialogue_id: string;
  adsorb_need_dialogue_id: string;
  adsorb_use_dialogue_id: string;
  inhibit_need_dialogue_id: string;
  inhibit_use_dialogue_id: string;
  skill_use_dialogue_id: string;
  tint1_dialogue_id: string;
  tint2_dialogue_id: string;
  invade_dialogue_id: string;
  done_dialogue_id: string;
  showcase_kinds: LoopContentKind[];
}

function loopJsonUrl(areaId: string): string {
  const key = areaId.replace(/^area_/, "");
  return `/ui/layout/sector_loop_${key}.json`;
}

async function loadLoopCfg(areaId: string): Promise<LoopCfg> {
  const fallback: LoopCfg = {
    area_id: areaId || "area_i21",
    radius_m: 30,
    color_steps: [0.22, 0.85, 1],
    difficulty: "easy",
    mission_count: 7,
    mission_min_r: 12,
    mission_max_r: 24,
    invade_count: 8,
    invade_min_r: 22,
    invade_max_r: 28,
    invade_speed_mps: 0.28,
    king_hp: 3,
    king_r: 16,
    eat_revert_sec: 4,
    arrive_dialogue_id: "dlg_i21_arrive",
    mission_dialogue_id: "dlg_i21_mission",
    adsorb_need_dialogue_id: "dlg_i21_adsorb_need",
    adsorb_use_dialogue_id: "dlg_i21_adsorb_use",
    inhibit_need_dialogue_id: "dlg_i21_inhibit",
    inhibit_use_dialogue_id: "dlg_i21_inhibit_use",
    skill_use_dialogue_id: "dlg_i21_skill_use",
    tint1_dialogue_id: "dlg_i21_tint1",
    tint2_dialogue_id: "dlg_i21_tint2",
    invade_dialogue_id: "dlg_i21_invade",
    done_dialogue_id: "dlg_i21_done",
    showcase_kinds: [],
  };
  try {
    const res = await fetch(`${loopJsonUrl(areaId)}?t=${Date.now()}`);
    if (!res.ok) throw new Error("no json");
    const raw = (await res.json()) as Partial<LoopCfg>;
    return {
      ...fallback,
      ...raw,
      difficulty: raw.difficulty === "hard" ? "hard" : "easy",
      color_steps: raw.color_steps?.length ? raw.color_steps : fallback.color_steps,
      showcase_kinds: Array.isArray(raw.showcase_kinds)
        ? (raw.showcase_kinds as LoopContentKind[])
        : fallback.showcase_kinds,
    };
  } catch {
    return fallback;
  }
}

export class SectorPurifyLoop {
  private cfg!: LoopCfg;
  private raidCfg!: PurifyRaidConfig;
  private paint!: GroundPaint;
  private wave!: BlightWave;
  private beat: LoopBeat = "arrive";
  private huntLock: { id: number } | null = null;
  private eatAcc = 0;
  private bound = false;
  private running = false;
  private core = { x: 0, z: 0 };
  private waitClear: (() => void) | null = null;
  private waitGoal: number | "empty" | null = null;
  private pauseHunt = false;
  private talking = false;
  private pickupCloud: CulpritCloud | null = null;
  private nextSearchSkipFakes = false;

  constructor(
    private readonly stage: JourneyStage3D,
    private readonly hooks: SectorLoopHooks,
    private readonly areaId: string,
  ) {}

  async run(): Promise<{ won: boolean }> {
    this.cfg = await loadLoopCfg(this.areaId);
    this.raidCfg = await loadPurifyRaidConfig();
    this.raidCfg = { ...this.raidCfg, blight_speed_mps: this.cfg.invade_speed_mps };
    const p = this.stage.getPlayerWorld();
    this.core = { x: p.x, z: p.z };
    this.paint = new GroundPaint(this.stage, this.raidCfg.paint_radius_m);
    this.wave = new BlightWave(this.stage, this.paint, this.raidCfg, this.core);
    this.wave.useLegacyWaves = false;
    this.wave.dripPaint = false;
    this.stage.setFrozen(true);
    this.stage.applyStoneThrowConfig(this.raidCfg);
    this.stage.setOnStoneLand((x, z) => this.onLand(x, z));
    this.stage.setPurifyColorAmt(0);
    this.stage.setPurifyFoci([{ x: this.core.x, z: this.core.z, r: 0 }]);
    this.bind(true);
    this.running = true;
    loopRunBegin();
    try {
      const steps = this.hooks.questSteps ?? [];
      if (steps.length) {
        const verdict = await this.playQuestSteps(steps);
        const rec = loopRunEnd();
        if (verdict !== "pass") {
          this.stage.setPurifyColorAmt(0);
          return { won: false };
        }
        this.setBeat("done");
        const label = this.areaId.includes("i11") ? "우물" : "들판";
        await this.hooks.onRunEnd?.(rec, loopRunLine(label));
        return { won: true };
      }
      const hard = this.cfg.difficulty === "hard";
      await this.playArrive();
      await this.playMission();
      this.hooks.onCondFill?.("stain");
      await this.playTint(1);
      await this.playShowcase();
      if (hard) {
        await this.playLesson("inhibit");
        await this.playInvade();
        await this.aside("memory");
      }
      await this.playTint(2);
      const verdict = await this.playCulprit();
        if (verdict !== "pass") {
          this.stage.setPurifyColorAmt(0);
          loopRunEnd();
          return { won: false };
        }
        await this.playTint(3);
        if (this.cfg.done_dialogue_id) await this.hooks.onFiller(this.cfg.done_dialogue_id);
        this.setBeat("done");
        {
          const rec = loopRunEnd();
          const label = this.areaId.includes("i11") ? "우물" : "들판";
          await this.hooks.onRunEnd?.(rec, loopRunLine(label));
        }
        return { won: true };
    } finally {
      if (loopRunLive()) loopRunEnd();
      this.running = false;
      this.clearPickup();
      this.bind(false);
      this.stage.setOnStoneLand(null);
      this.stage.applyStoneThrowConfig(this.raidCfg);
      this.stage.setFrozen(false);
      this.wave.dispose();
      this.paint.dispose();
    }
  }

  private setBeat(b: LoopBeat): void {
    this.beat = b;
    this.hooks.onBeat?.(b);
  }

  private usingQuest(): boolean {
    return (this.hooks.questSteps?.length ?? 0) > 0;
  }

  private async playQuestSteps(steps: QuestStepDef[]): Promise<"pass" | "abort"> {
    for (const step of steps) {
      loopRunTickDay();
      this.hooks.onHud?.(step.hud_label || step.title);
      this.talking = true;
      try {
        if (step.receive_text_id) await this.hooks.onQuestText?.(step.receive_text_id);
        if (step.prep_text_id) await this.hooks.onQuestText?.(step.prep_text_id);
        if (step.tip_dialogue_id) await this.hooks.onFiller(step.tip_dialogue_id);
      } finally {
        this.talking = false;
      }
      const r = await this.execQuestStep(step);
      if (r === "abort") return "abort";
      this.talking = true;
      try {
        if (step.reward_text_id) await this.hooks.onQuestText?.(step.reward_text_id);
      } finally {
        this.talking = false;
      }
      await this.hooks.onActionReward?.(step);
    }
    return "pass";
  }

  private async execQuestStep(step: QuestStepDef): Promise<"pass" | "abort" | void> {
    if (step.kind !== "SEARCH") await this.goPlace(step.place);
    switch (step.kind) {
      case "FILLER":
        return;
      case "SEARCH":
        await this.playSearch(step);
        return;
      case "CONTENT":
        if (step.content_kind) await this.aside(step.content_kind as LoopContentKind);
        return;
      case "BRANCH":
        await this.playBranch(step.content_kind || "br_i21_path_adsorb");
        return;
      case "APPLY_STAINS":
        await this.mashAt("장전", this.placePct(step.place || "center"));
        await this.playStainHunt();
        this.hooks.onCondFill?.("stain");
        return;
      case "TINT": {
        const n = step.tint_step === 2 ? 2 : step.tint_step === 3 ? 3 : 1;
        await this.playTint(n);
        return;
      }
      case "INVADE":
        await this.playInvade(step);
        return;
      case "CULPRIT":
        return this.playCulprit();
      default:
        return;
    }
  }

  private async playSearch(step: QuestStepDef): Promise<void> {
    const pickup: "catalyst" | "inhibit" = step.content_kind === "inhibit" ? "inhibit" : "catalyst";
    let spots = orderSearchSpots((this.hooks.questSpots ?? []).filter((s) => s.step_id === step.step_id));
    if (this.nextSearchSkipFakes) {
      spots = spots.filter((s) => s.is_real);
      this.nextSearchSkipFakes = false;
    }
    if (!spots.length) {
      await this.playPickup(pickup, this.placePct("east"));
      await this.maybeUnluckyExtraBug(pickup);
      return;
    }
    for (const spot of spots) {
      await this.goPlace(spot.place);
      this.talking = true;
      try {
        if (spot.flavor_text_id) await this.hooks.onQuestText?.(spot.flavor_text_id);
      } finally {
        this.talking = false;
      }
      if (spot.is_real) {
        await this.playPickup(pickup, this.placePct(spot.place || "east"));
        await this.maybeUnluckyExtraBug(pickup);
        return;
      }
      loopRunTickDay();
      await this.mashAt("거르기", this.placePct(spot.place || "west"));
      if (spot.content_kind) await this.aside(spot.content_kind as LoopContentKind);
    }
    await this.playPickup(pickup, this.placePct("east"));
    await this.maybeUnluckyExtraBug(pickup);
  }

  /** 꽝 하나 — 흡착을 찾은 뒤 가끔 벌레 +1. 재료는 안 지움. */
  private async maybeUnluckyExtraBug(pickup: "catalyst" | "inhibit"): Promise<void> {
    if (pickup !== "catalyst") return;
    if (Math.random() >= 0.32) return;
    loopRunNoteUnlucky();
    this.hooks.onHud?.("꽝 · 벌레 +1");
    this.talking = true;
    try {
      await this.hooks.onQuestText?.("t_q_unlucky_bug");
    } finally {
      this.talking = false;
    }
  }

  private async playPickup(kind: "catalyst" | "inhibit", at?: { xPct: number; yPct: number }): Promise<void> {
    this.setBeat("aside");
    this.hooks.onHud?.(kind === "catalyst" ? "정화제 줍기" : "퇴치제 줍기");
    const drop = at ?? this.placePct("east");
    this.spawnPickup(kind, drop);
    try {
      await this.mashAt(kind === "catalyst" ? "모으기" : "퇴치제", drop);
      await this.hooks.onContent(kind, drop);
    } finally {
      this.clearPickup();
    }
  }

  private async mashAt(label: string, at?: { xPct: number; yPct: number }): Promise<void> {
    if (!this.hooks.onMashCollect) return;
    this.hooks.onHud?.(`${label} · 연속으로 누르세요`);
    const me = this.stage.getPlayer();
    await this.hooks.onMashCollect(label, at ?? { xPct: me.xPct, yPct: me.yPct });
  }

  private async playBranch(branchId: string): Promise<void> {
    this.setBeat("aside");
    this.hooks.onHud?.("갈림길");
    const pick = (await this.hooks.onBranch?.(branchId)) ?? "A";
    if (branchId.includes("adsorb")) {
      this.nextSearchSkipFakes = pick === "A";
      return;
    }
    if (branchId.includes("hunt")) {
      if (pick === "B") {
        loopRunAddBugs(2);
        loopRunTickDay();
      }
      return;
    }
    if (branchId.includes("culprit") && pick === "B") {
      await this.aside("location");
    }
  }

  private async playStainHunt(): Promise<void> {
    this.setBeat("mission");
    this.hooks.onHud?.("찾은 걸로 해결");
    this.wave.resetPool();
    this.wave.stationary = true;
    this.wave.scatterAround(this.cfg.mission_count, this.cfg.mission_min_r, this.cfg.mission_max_r);
    this.huntLock = null;
    await this.waitUntilEmpty();
  }

  private dropAt(): { xPct: number; yPct: number } {
    const d = this.wave.lastDeaths[0];
    if (d) return this.stage.worldToPct(d.x, d.z);
    return this.placePct("center");
  }

  private placeWorld(place: string): { x: number; z: number } {
    const r = Math.min(16, this.cfg.radius_m * 0.52);
    if (place === "south") return { x: this.core.x, z: this.core.z + r };
    if (place === "north") return { x: this.core.x, z: this.core.z - r };
    if (place === "west") return { x: this.core.x - r, z: this.core.z };
    if (place === "east") return { x: this.core.x + r, z: this.core.z };
    return { x: this.core.x, z: this.core.z + 1.4 };
  }

  private placePct(place: string): { xPct: number; yPct: number } {
    const w = this.placeWorld(place);
    return this.stage.worldToPct(w.x, w.z);
  }

  private async goPlace(place: string): Promise<void> {
    if (!place) return;
    const w = this.placeWorld(place);
    const stand = this.stage.frontStandPct(w.x, w.z, 2.6);
    const me = this.stage.getPlayerWorld();
    const dest = this.stage.pctToWorld(stand.xPct, stand.yPct);
    if (Math.hypot(me.x - dest.x, me.z - dest.z) < 0.4) {
      this.stage.lookAtWorld(w.x, w.z);
      return;
    }
    this.pauseHunt = true;
    try {
      await this.stage.walkTo(stand.xPct, stand.yPct);
      this.stage.lookAtWorld(w.x, w.z);
    } finally {
      this.pauseHunt = false;
    }
  }

  private async aside(kind: LoopContentKind): Promise<void> {
    const hunt = this.beat;
    this.setBeat("aside");
    this.hooks.onHud?.(kind);
    const me = this.stage.getPlayer();
    await this.hooks.onContent(kind, { xPct: me.xPct, yPct: me.yPct });
    if (hunt !== "aside") this.beat = hunt;
  }

  private async playShowcase(): Promise<void> {
    for (const k of this.cfg.showcase_kinds) {
      if (
        k === "minigame_dig" ||
        k === "minigame_square" ||
        k === "minigame_myth" ||
        k === "minigame_circle" ||
        k === "branch" ||
        k === "life" ||
        k === "life2"
      ) {
        continue;
      }
      await this.aside(k);
      if (k === "skill" && this.cfg.skill_use_dialogue_id) {
        await this.hooks.onFiller(this.cfg.skill_use_dialogue_id);
      }
    }
  }

  private async playArrive(): Promise<void> {
    this.setBeat("arrive");
    this.hooks.onHud?.("원인 규명");
    if (this.cfg.arrive_dialogue_id) await this.hooks.onFiller(this.cfg.arrive_dialogue_id);
  }

  /** 설명 → 보이는 오브젝트 → 걸어가 획득 → 사용 설명 */
  private async playLesson(kind: "catalyst" | "inhibit"): Promise<void> {
    const need =
      kind === "catalyst" ? this.cfg.adsorb_need_dialogue_id : this.cfg.inhibit_need_dialogue_id;
    const use =
      kind === "catalyst" ? this.cfg.adsorb_use_dialogue_id : this.cfg.inhibit_use_dialogue_id;
    this.setBeat("aside");
    this.hooks.onHud?.(kind === "catalyst" ? "해결책 찾기 · 흡착" : "해결책 찾기 · 억제");
    if (need) await this.hooks.onFiller(need);
    await this.playPickup(kind, this.placePct("east"));
    this.hooks.onHud?.("사용 설명");
    if (use) await this.hooks.onFiller(use);
  }

  private spawnPickup(kind: "catalyst" | "inhibit", at: { xPct: number; yPct: number }): void {
    this.clearPickup();
    const form = kind === "catalyst" ? "circle" : "triangle";
    const cloud = new CulpritCloud({ form, count: kind === "catalyst" ? 160 : 120, size: 0.2 });
    cloud.playGather();
    cloud.purify = kind === "catalyst" ? 0.92 : 0.38;
    cloud.purifyTo = cloud.purify;
    const w = this.stage.pctToWorld(at.xPct, at.yPct);
    cloud.setWorld(w.x, w.z);
    cloud.group.scale.setScalar(kind === "catalyst" ? 1.7 : 1.45);
    this.stage.addOverlay(cloud.group);
    this.pickupCloud = cloud;
  }

  private clearPickup(): void {
    if (!this.pickupCloud) return;
    this.stage.removeOverlay(this.pickupCloud.group);
    this.pickupCloud.dispose();
    this.pickupCloud = null;
  }

  private async playMission(): Promise<void> {
    this.setBeat("mission");
    this.hooks.onHud?.("얼룩 정화");
    await this.playLesson("catalyst");
    this.setBeat("mission");
    this.hooks.onHud?.("찾은 걸로 해결");
    this.wave.resetPool();
    this.wave.stationary = true;
    this.wave.scatterAround(this.cfg.mission_count, this.cfg.mission_min_r, this.cfg.mission_max_r);
    this.huntLock = null;
    await this.waitUntilEmpty();
  }

  private async playTint(step: 1 | 2 | 3): Promise<void> {
    const steps = this.cfg.color_steps;
    const amt = steps[step - 1] ?? (step === 1 ? 0.22 : step === 2 ? 0.85 : 1);
    const radiusM =
      step === 1 ? this.cfg.radius_m * 0.36 : step === 2 ? this.cfg.radius_m * 0.95 : this.cfg.radius_m;
    if (step === 1) this.setBeat("tint1");
    else if (step === 2) this.setBeat("tint2");
    this.hooks.onHud?.(step === 1 ? "1단계 정화" : step === 2 ? "2단계 정화" : "3단계 정화");
    this.stage.setPurifyColorAmt(amt);
    const me = this.stage.getPlayer();
    await this.stage.playPurifyStandWave({
      xPct: me.xPct,
      yPct: me.yPct,
      radiusM,
      durationMs: step === 1 ? 1400 : step === 2 ? 2000 : 2800,
      skyWave: step === 3,
      holdWave: true,
    });
    this.stage.setPurifyFoci([{ x: this.core.x, z: this.core.z, r: radiusM }]);
    this.stage.setPurifyColorAmt(amt);
    this.stage.clearPurifyWaves();
    if (!this.usingQuest()) {
      if (step === 1 && this.cfg.tint1_dialogue_id) await this.hooks.onFiller(this.cfg.tint1_dialogue_id);
      else if (step === 2 && this.cfg.tint2_dialogue_id) await this.hooks.onFiller(this.cfg.tint2_dialogue_id);
    }
  }

  private async playInvade(step?: QuestStepDef): Promise<void> {
    this.setBeat("invade");
    this.hooks.onHud?.(step?.hud_label || "침입 · 느린 오염");
    if (!this.usingQuest() && this.cfg.invade_dialogue_id) await this.hooks.onFiller(this.cfg.invade_dialogue_id);
    const origin = this.placeWorld(step?.place || "center");
    this.wave.resetPool();
    this.wave.stationary = false;
    this.eatAcc = 0;
    const n = step?.hunt_count && step.hunt_count > 0 ? step.hunt_count : Math.max(1, this.cfg.invade_count);
    const bugs = n + loopRunTakeBugs();
    for (let i = 0; i < bugs; i++) {
      const pos = this.wave.pickScatterNear(origin.x, origin.z, 4.8, 11.5);
      this.wave.spawnTyped({
        x: pos.x,
        z: pos.z,
        hp: 1,
        role: "runner",
        speed_mult: 1,
        eat_mult: 1,
        scale: 2.05,
        color: 0xff99ee,
        look: "bug",
      });
    }
    this.huntLock = null;
    await this.waitUntilEmpty();
  }

  private async playCulprit(): Promise<"pass" | "abort"> {
    this.setBeat("king");
    this.hooks.onHud?.("원흉");
    if (this.hooks.onCulprit) {
      const talk = await this.hooks.onCulprit();
      if (talk !== "pass") return "abort";
    }
    await this.playCulpritMatter();
    return "pass";
  }

  /** 대화 통과 뒤 — 점구름 원흉을 정화제로 걷는다 */
  private async playCulpritMatter(): Promise<void> {
    this.hooks.onHud?.("원흉 · 정화제");
    this.wave.resetPool();
    this.wave.stationary = true;
    const well = this.areaId.includes("i11");
    this.wave.spawnTyped({
      x: this.core.x,
      z: this.core.z - 1.6,
      hp: Math.max(1, this.cfg.king_hp),
      role: "boss",
      speed_mult: 0,
      eat_mult: 0,
      scale: well ? 1.15 : 1,
      color: 0xffffff,
      is_boss: true,
      look: "boss",
    });
    this.huntLock = null;
    await this.waitUntilEmpty();
  }

  private waitUntilEmpty(): Promise<void> {
    return this.waitUntilGoal("empty");
  }

  private waitUntilAtMost(n: number): Promise<void> {
    return this.waitUntilGoal(n);
  }

  private waitUntilGoal(goal: number | "empty"): Promise<void> {
    return new Promise((resolve) => {
      this.waitGoal = goal;
      this.waitClear = resolve;
    });
  }

  private bind(on: boolean): void {
    if (on === this.bound) return;
    this.bound = on;
    this.stage.setOnTick(on ? (dt) => this.tick(dt) : null);
  }

  private tick(dt: number): void {
    if (!this.running) return;
    const tune = liveHuntTune(this.hooks);
    this.raidCfg.blight_speed_mps = this.cfg.invade_speed_mps * (tune.invadeMul ?? 1);
    this.stage.keepInsideDisk(this.core.x, this.core.z, this.cfg.radius_m);
    this.wave.tick(dt);
    this.pickupCloud?.tick(dt);
    if (this.beat === "invade" || this.beat === "king") {
      if (this.wave.eatingCount() > 0) {
        this.eatAcc += dt;
        if (this.eatAcc >= this.cfg.eat_revert_sec * (tune.eatMul ?? 1)) {
          this.eatAcc = 0;
          this.stage.setPurifyColorAmt(0);
          this.hooks.onHud?.("원이 다시 흐려졌다");
        }
      } else {
        this.eatAcc = 0;
      }
    }
    this.autoHunt(dt);
    if (!this.waitClear) return;
    if (this.talking || this.pauseHunt) return;
    if (this.beat !== "mission" && this.beat !== "invade" && this.beat !== "king") return;
    const alive = this.wave.huntAliveCount;
    const ok =
      this.waitGoal === "empty"
        ? alive === 0
        : typeof this.waitGoal === "number" && alive <= this.waitGoal;
    if (!ok) return;
    const done = this.waitClear;
    this.waitClear = null;
    this.waitGoal = null;
    done();
  }

  private autoHunt(dt: number): void {
    if (this.pauseHunt || this.talking) return;
    if (this.beat !== "mission" && this.beat !== "invade" && this.beat !== "king") return;
    if (this.stage.isThrowBusy()) return;
    const units = this.wave.huntUnits;
    if (!units.length) {
      this.huntLock = null;
      return;
    }
    const me = this.stage.getPlayerWorld();
    if (!this.huntLock || !units.some((u) => u.id === this.huntLock?.id)) {
      const next = nearest(units, me.x, me.z);
      if (!next) return;
      this.huntLock = { id: next.id };
    }
    const target = units.find((u) => u.id === this.huntLock?.id);
    if (!target) return;
    this.stage.turnToward(target.x, target.z, dt);
    const tune = liveHuntTune(this.hooks);
    const reach = Math.max(0.5, this.raidCfg.gun_range_m + tune.rangeAdd);
    const dist = Math.hypot(target.x - me.x, target.z - me.z);
    if (dist > reach) {
      this.stage.nudgeToward(target.x, target.z, dt, 2.8 * tune.speedMul);
      return;
    }
    if (!this.stage.inForwardCone(target.x, target.z, THROW_FORWARD_DEG)) return;
    if (this.stage.isThrowing()) return;
    const mag: "adsorb" | "inhibit" | "culprit" =
      this.beat === "mission" ? "adsorb" : this.beat === "king" ? "culprit" : "inhibit";
    const spent = this.hooks.onThrowSpend
      ? this.hooks.onThrowSpend(mag) || (mag === "culprit" && this.hooks.onThrowSpend("adsorb"))
      : true;
    if (!spent) {
      this.hooks.onHud?.(mag === "culprit" ? "원흉 처치제가 모자라" : "정화제가 비었다");
      return;
    }
    this.stage.applyStoneThrowConfig({
      ...this.raidCfg,
      paint_radius_m: this.raidCfg.paint_radius_m * tune.splashMul,
    });
    this.stage.throwAt(target.x, target.z);
  }

  private onLand(x: number, z: number): void {
    if (!this.running) return;
    const tune = liveHuntTune(this.hooks);
    const r = Math.max(0.4, this.raidCfg.paint_radius_m * tune.splashMul);
    this.wave.hitSplash(x, z, r, 1, { stamp: false });
    this.huntLock = null;
    if (this.beat === "mission" && this.wave.lastStainKills > 0 && this.hooks.onStainCleared) {
      this.talking = true;
      void this.hooks.onStainCleared().finally(() => {
        this.talking = false;
      });
    }
  }
}

function nearest(
  units: { id: number; x: number; z: number }[],
  x: number,
  z: number,
): { id: number; x: number; z: number } | null {
  let best: { id: number; x: number; z: number } | null = null;
  let bestD = Infinity;
  for (const u of units) {
    const d = Math.hypot(u.x - x, u.z - z);
    if (d >= bestD) continue;
    bestD = d;
    best = u;
  }
  return best;
}
