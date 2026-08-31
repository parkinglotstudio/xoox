/**
 * 들판(i21) 정화 루프 — 30m 원 · 색 3단 · 시나리오 콘텐츠를 종류마다 한 번씩.
 * combat_loop=true 여도 **퀘스트/정화제/얼룩/틴트 반경은 기존 유지**.
 * 추가분만: 틴트 전 캐스팅 · 틴트 후 띠 축소·방향 멈춤 · 원흉 A+B 비주얼 · 해제 연출.
 */
import * as THREE from "three";
import { BlightWave } from "./BlightWave";
import { BlightBody } from "./BlightBody";
import { CulpritCloud, loadStainDroplet, loadWaterDroplet, petFit, type FieldPetId } from "./CulpritCloud";
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
  loopRunTickDay,
  type LoopRunSnap,
} from "../../quest/loopRun";
import { CombatPurifyHud } from "./CombatPurifyHud";
import { BurnRim } from "./purify/BurnRim";
import { SoftBlightOctet } from "./purify/SoftBlightOctet";
import { loadPurifySkillBalance, type PurifySkillBalance, type TintStep } from "./purifySkillBalance";
import { RaidVfx } from "./RaidVfx";
import { emptyRaidTables, loadRaidTables } from "./raidTables";
import type { QuestSpotDef, QuestStepDef } from "../../types";

export type LoopBeat =
  | "arrive"
  | "mission"
  | "aside"
  | "tint1"
  | "invade"
  | "tint2"
  | "king"
  | "done"
  | "casting"
  | "band";

const COMBAT_STOP_DIRS: { name: string; ang: number }[] = [
  { name: "동", ang: 0 },
  { name: "서", ang: Math.PI },
  { name: "남", ang: Math.PI / 2 },
];

/** 루프 조우 — 벌레 2 · 오염물질 1 (랜덤 없음) */
const LOOP_BUG_ENCOUNTER_SLOTS = 2;
const LOOP_MATTER_ENCOUNTER_SLOTS = 1;
const LOOP_BUG_ENCOUNTER_PETS: readonly FieldPetId[] = ["Tobby", "Bolinha"];
const LOOP_MATTER_ENCOUNTER_PET: FieldPetId = "Vrum";

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
  onContent: (kind: LoopContentKind, at?: { xPct: number; yPct: number }) => Promise<number | void>;
  onBeat?: (beat: LoopBeat) => void;
  onHud?: (label: string) => void;
  onThrowSpend?: (kind: "adsorb" | "inhibit" | "culprit") => boolean;
  onStainCleared?: () => Promise<void>;
  /** 벌레 퇴치 — 펫 파편 조우 (월드 좌표·펫 ID 고정) */
  onBugPetEncounter?: (at: {
    xPct: number;
    yPct: number;
    x: number;
    z: number;
    petId: FieldPetId;
  }) => Promise<void>;
  huntTune?: () => {
    rangeAdd: number;
    speedMul: number;
    splashMul: number;
    eatMul?: number;
    invadeMul?: number;
    missileMul?: number;
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
  /** 행동 1개가 끝난 뒤 — 원본처럼 등급 보상 필러 */
  onActionReward?: (step: QuestStepDef) => Promise<void>;
  /** 칸을 닫았을 때 필러 한 줄 */
  onRunEnd?: (rec: LoopRunSnap, line: string) => Promise<void>;
  /** 흡착 탄약 동기 (기존 throwAdsorb) */
  getCombatAmmo?: () => number;
  /** 퇴치제(억제) 잔량 — 벌레 웨이브 전 확인 */
  getInhibitAmmo?: () => number;
  spendCombatAmmo?: (n: number) => boolean;
  addCombatAmmo?: (n: number) => void;
  /** 퇴치제 하한 보충 — 레슨 후에도 0이면 강제 지급 */
  addInhibitAmmo?: (n: number) => void;
  /** 전투 오버레이 HUD 호스트 (stage3d-layer) — 캐스팅·띠 게이지만 */
  combatHudHost?: HTMLElement | null;
}

function liveHuntTune(hooks: SectorLoopHooks) {
  return (
    hooks.huntTune?.() ?? {
      rangeAdd: 0,
      speedMul: 1,
      splashMul: 1,
      eatMul: 1,
      invadeMul: 1,
      missileMul: 1,
    }
  );
}

interface LoopCfg {
  area_id: string;
  radius_m: number;
  color_steps: number[];
  difficulty: "easy" | "hard";
  mission_count: number;
  /** 1차 후 오염물질 수 (본세팅) */
  matter_count: number;
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
  band_warn_dialogue_id?: string;
  band_stop_dialogue_id?: string;
  showcase_kinds: LoopContentKind[];
  /** true면 기존 루프 위에 캐스팅·띠·멈춤·원흉 A+B만 추가 (전체 교체 금지) */
  combat_loop?: boolean;
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
    matter_count: 5,
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
    combat_loop: false,
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
  private pickupCountSpr: THREE.Sprite | null = null;
  /** 정화제/퇴치제 바닥 표시 — 밝은 원판(위치 안내용) */
  private pickupFloorMark: THREE.Mesh | null = null;
  private nextSearchSkipFakes = false;
  /** APPLY_STAINS 직후 이미 1차 틴트 했으면 퀘스트 TINT 1 스킵 */
  private tint1Done = false;

  /** combat_loop 오버레이 (기존 루프 위에만) */
  private combatBal: PurifySkillBalance | null = null;
  private combatHud: CombatPurifyHud | null = null;
  private combatVfx: RaidVfx | null = null;
  private burnRim: BurnRim | null = null;
  private blightDots: SoftBlightOctet | null = null;
  /** 원흉 위 — 툴 네모 원흉 (BlightBody = 본편 검증 경로) */
  private kingBody: BlightBody | null = null;
  /** 원흉 밑바닥 — 툴 동그라미 얼룩 */
  private kingStain: CulpritCloud | null = null;
  private kingHitBusy = false;
  private kingTeleportBusy = false;
  private castPct = 0;
  private casting = false;
  private bandActive = false;
  private bandWaveIn = 0;
  private bandRadius = 0;
  private bandFullR = 0;
  private stopGate = { x: 0, z: 0 };
  private stopDirName = "동";
  private stopLeft = 0;
  private stopMax = 6;
  private bandResolve: (() => void) | null = null;
  private castResolve: (() => void) | null = null;
  private bandFailed = false;
  /** 1차 후 오염물질 방어(5분) */
  private polluteDefend = false;
  private polluteLeftSec = 0;
  private polluteMaxSec = 300;
  /** 벌레 침입 — HUD용 */
  private invadeActive = false;
  private invadeBugsTotal = 0;
  private invadeLeftSec = 0;
  private invadeMaxSec = 120;
  private ammoRefillBusy = false;
  /** 착탄·결과 연출이 끝날 때까지 이동 잠금(초) */
  private throwSettleLeft = 0;
  /** 원흉 — 마지막 피격 후 경과(재생용) */
  private kingSinceHit = 0;
  /** 원흉 HP 리젠 누적 — 1 이상일 때만 정수로 회복 (소수 UI 깨짐 방지) */
  private kingRegenAcc = 0;
  /** 원흉 — 자리 유지 시간(초 후 순간이동) */
  private kingStayAcc = 0;
  /** 연속 피격 수 — 일정 대마다 강제 도주 */
  private kingHitStreak = 0;
  /** 가드 전멸 연출 1회 */
  private kingGuardsClearedFx = false;
  private kingBossId: number | null = null;
  private lootBusy = false;
  /** 벌레 처치 → 펫 구출 연출 (전투 루프가 끝날 때까지 대기) */
  private petEncounterWait: Promise<void> | null = null;
  /** 남은 고정 조우 — 벌레 2 · 오염물질 1 */
  private bugEncountersLeft = LOOP_BUG_ENCOUNTER_SLOTS;
  private matterEncountersLeft = LOOP_MATTER_ENCOUNTER_SLOTS;

  constructor(
    private readonly stage: JourneyStage3D,
    private readonly hooks: SectorLoopHooks,
    private readonly areaId: string,
  ) {}

  async run(): Promise<{ won: boolean }> {
    this.cfg = await loadLoopCfg(this.areaId);
    await loadStainDroplet();
    this.raidCfg = await loadPurifyRaidConfig();
    this.raidCfg = { ...this.raidCfg, blight_speed_mps: this.cfg.invade_speed_mps };
    if (this.cfg.combat_loop) {
      this.combatBal = await loadPurifySkillBalance();
      const tables = await loadRaidTables().catch(() => emptyRaidTables());
      this.combatVfx = new RaidVfx(this.stage, tables);
      if (this.hooks.combatHudHost) {
        this.combatHud = new CombatPurifyHud(this.hooks.combatHudHost);
      }
    }
    const p = this.stage.getPlayerWorld();
    this.core = { x: p.x, z: p.z };
    this.paint = new GroundPaint(this.stage, this.raidCfg.paint_radius_m);
    this.wave = new BlightWave(this.stage, this.paint, this.raidCfg, this.core);
    this.wave.useLegacyWaves = false;
    this.wave.dripPaint = false;
    this.wave.bugTireMarks = true;
    // 처음부터 얼룩이 깔려 있게 — 하나씩 모이며 리젠
    await this.preSpawnStains();
    this.stage.setFrozen(true);
    this.stage.applyStoneThrowConfig(this.raidCfg);
    this.stage.setOnStoneLand((x, z) => this.onLand(x, z));
    this.stage.setPurifyColorAmt(0);
    this.stage.setPurifyFoci([{ x: this.core.x, z: this.core.z, r: 0 }]);
    // 루프 시작 = 오염 하늘로 리셋 (입장 sync·이전 foci로 풀개방된 상태 방지)
    this.stage.setSkyPurifyAmount(0);
    this.bind(true);
    this.running = true;
    loopRunBegin();
    this.resetEncounterSlots();
    try {
      const steps = this.hooks.questSteps ?? [];
      // combat_loop=본세팅 타임어택 루프. 퀘스트 장문은 combat 꺼진 칸만.
      if (steps.length && !this.cfg.combat_loop) {
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
      // 타임어택 직전 갈림 — 더 모은다(발사체) / 바로 간다
      await this.playGatherFork();
      await this.playMission();
      this.hooks.onCondFill?.("stain");
      // playMission 끝 = 얼룩 클리어 → 바로 1차 (중복 playTint 방지)
      if (!this.tint1Done) {
        await this.playTint(1);
        this.tint1Done = true;
      }
      await this.playShowcase();
      // combat_loop도 벌레 웨이브 포함 (easy여도 본세팅 벌레 수)
      if (this.cfg.combat_loop || hard) {
        await this.playInvade();
        if (hard) await this.aside("memory");
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
      this.clearPickupImmediate();
      this.clearCombatFx();
      this.combatHud?.dispose();
      this.combatHud = null;
      this.combatVfx?.dispose();
      this.combatVfx = null;
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
        // 연타(장전) 없음 — 가운데 도착 후 바로 얼룩 사냥
        this.hooks.onHud?.(step.hud_label || "정화");
        await this.playStainHunt();
        this.hooks.onCondFill?.("stain");
        // 얼룩 전멸 직후 바로 1차 정화
        await this.playTint(1);
        this.tint1Done = true;
        return;
      case "TINT": {
        const n = step.tint_step === 2 ? 2 : step.tint_step === 3 ? 3 : 1;
        if (n === 1 && this.tint1Done) return;
        await this.playTint(n);
        if (n === 1) this.tint1Done = true;
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
      // 가짜 자리 — 연타(거르기) 없이 콘텐츠만
      loopRunTickDay();
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
    const drop = at ?? this.placePct("east");
    this.hooks.onHud?.(kind === "catalyst" ? "정화제 위치" : "퇴치제 위치");
    // 1) 바닥에 밝은 물방울 표식 → 2) 그쪽으로 걸어감 → 3) 슬롯 획득
    this.spawnPickup(kind, drop);
    const w = this.stage.pctToWorld(drop.xPct, drop.yPct);
    const stand = this.stage.frontStandPct(w.x, w.z, 2.4);
    this.pauseHunt = true;
    try {
      await this.stage.walkTo(stand.xPct, stand.yPct);
      this.stage.lookAtWorld(w.x, w.z);
      this.hooks.onHud?.(kind === "catalyst" ? "정화제 발견" : "퇴치제 발견");
      await sleep(220);
      // 1) 물방울 모으기 → 2) 터짐 → 3) 보상 → 4) 퍼지기(clearPickup)
      this.pickupCloud?.playGather();
      await (this.pickupCloud?.waitGatherDone() ?? sleep(650));
      this.pickupCloud?.pulseHit();
      this.stage.playPickupBurst(w.x, w.z);
      await sleep(420);
      const granted = await this.hooks.onContent(kind, drop);
      const n = typeof granted === "number" ? granted : 0;
      if (n > 0) {
        await this.flashPickupAmount(n, drop);
      } else {
        await sleep(320);
      }
    } finally {
      this.pauseHunt = false;
      await this.clearPickup();
    }
  }

  /** 획득 개수 표기 — 모인 뒤 잠깐 보여주고 흩어짐과 함께 사라짐 */
  private async flashPickupAmount(n: number, at: { xPct: number; yPct: number }): Promise<void> {
    this.clearPickupCountSpr();
    const w = this.stage.pctToWorld(at.xPct, at.yPct);
    const spr = makePickupCountSprite(`+${n}`);
    spr.position.set(w.x, 1.8, w.z);
    this.stage.addOverlay(spr);
    this.pickupCountSpr = spr;
    this.hooks.onHud?.(n > 0 ? `획득 +${n}` : "획득");
    await sleep(720);
    this.clearPickupCountSpr();
  }

  private clearPickupCountSpr(): void {
    if (!this.pickupCountSpr) return;
    this.stage.removeOverlay(this.pickupCountSpr);
    const mat = this.pickupCountSpr.material as THREE.SpriteMaterial;
    mat.map?.dispose();
    mat.dispose();
    this.pickupCountSpr = null;
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

  /** 타임어택 직전: 더 모은다(발사체) / 바로 간다. 본 시계는 줄이지 않음. */
  private async playGatherFork(): Promise<void> {
    this.setBeat("aside");
    this.hooks.onHud?.("더 모을까, 바로 갈까");
    const pick = (await this.hooks.onBranch?.("br_i21_gather_or_go")) ?? "B";
    if (pick === "A") {
      this.hooks.onHud?.("발사체 확보");
      await this.playLesson("catalyst");
      if ((this.hooks.getInhibitAmmo?.() ?? 0) <= 0) {
        await this.playLesson("inhibit");
      }
    }
  }

  /** 루프 시작 시 얼룩 미리 리젠 (하나씩 모이며) */
  private async preSpawnStains(): Promise<void> {
    this.wave.resetPool();
    this.wave.stationary = true;
    await this.wave.scatterAround(this.cfg.mission_count, this.cfg.mission_min_r, this.cfg.mission_max_r);
  }

  private async playStainHunt(): Promise<void> {
    this.setBeat("mission");
    this.hooks.onHud?.("얼룩 정화");
    this.wave.stationary = true;
    // 미리 깔린 얼룩 없으면(클리어된 뒤 등)만 다시 스폰
    if (this.wave.huntAliveCount <= 0) {
      this.wave.resetPool();
      await this.wave.scatterAround(this.cfg.mission_count, this.cfg.mission_min_r, this.cfg.mission_max_r);
    }
    this.huntLock = null;
    const stainTotal = Math.max(this.wave.huntAliveCount, this.cfg.mission_count);
    this.invadeBugsTotal = stainTotal;
    this.emitCombatHud();
    while (this.running && this.wave.huntAliveCount > 0) {
      if ((this.hooks.getCombatAmmo?.() ?? 0) <= 0 && !this.ammoRefillBusy) {
        this.ammoRefillBusy = true;
        this.pauseHunt = true;
        this.hooks.onHud?.("정화제 부족 · 다시 구한다");
        await this.playLesson("catalyst");
        this.setBeat("mission");
        this.pauseHunt = false;
        this.ammoRefillBusy = false;
        this.hooks.onHud?.("얼룩 정화");
      }
      this.emitCombatHud();
      await sleep(120);
    }
    this.invadeBugsTotal = 0;
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
    this.hooks.onHud?.(kind === "catalyst" ? "정화제 찾기" : "퇴치제 찾기");
    if (need) await this.hooks.onFiller(need);
    // 획득 위치는 원에서 떨어진 자리 — 걸어가서 줍는다
    const side = Math.random() < 0.5 ? "east" : "west";
    await this.playPickup(kind, this.placePct(side));
    this.hooks.onHud?.("사용 설명");
    if (use) await this.hooks.onFiller(use);
  }

  private spawnPickup(kind: "catalyst" | "inhibit", at: { xPct: number; yPct: number }): void {
    void this.clearPickupImmediate();
    const w = this.stage.pctToWorld(at.xPct, at.yPct);
    // 흡착=밝은 파랑 · 억제=분홍 — 바닥에서 잘 보이게
    const tint: [number, number, number] =
      kind === "inhibit" ? [1.15, 0.22, 1.05] : [0.12, 0.62, 2.35];
    loadWaterDroplet();
    const fit = petFit();
    const count = Math.min(16000, Math.max(4000, fit.count));
    const cloud = new CulpritCloud({ form: "droplet", count, size: Math.max(fit.size, 0.09) });
    cloud.purify = 1;
    cloud.purifyTo = 1;
    cloud.rise = 1;
    cloud.riseTo = 1;
    cloud.tintMul(tint);
    // 바닥에 찍힌 표식 — 모이기 전에 먼저 보이게
    cloud.gather = 0.92;
    cloud.gatherTo = 0.92;
    cloud.setWorld(w.x, w.z);
    cloud.group.scale.setScalar(kind === "catalyst" ? 2.05 : 1.75);
    // 바닥 y를 살짝 올려 안개·지형에 안 묻히게
    cloud.group.position.y = 0.12;
    this.stage.addOverlay(cloud.group);
    this.pickupCloud = cloud;
    this.spawnPickupFloorMark(w.x, w.z, kind);
  }

  private spawnPickupFloorMark(x: number, z: number, kind: "catalyst" | "inhibit"): void {
    this.clearPickupFloorMark();
    const geo = new THREE.CircleGeometry(1.55, 28);
    const mat = new THREE.MeshBasicMaterial({
      color: kind === "inhibit" ? 0xff66ee : 0x33bbff,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.05, z);
    this.stage.addOverlay(mesh);
    this.pickupFloorMark = mesh;
  }

  private clearPickupFloorMark(): void {
    if (!this.pickupFloorMark) return;
    this.stage.removeOverlay(this.pickupFloorMark);
    this.pickupFloorMark.geometry.dispose();
    (this.pickupFloorMark.material as THREE.Material).dispose();
    this.pickupFloorMark = null;
  }

  /** 정화제(물방울)는 퍼지기 연출 후 제거 */
  private async clearPickup(): Promise<void> {
    this.clearPickupFloorMark();
    const cloud = this.pickupCloud;
    if (!cloud) return;
    this.pickupCloud = null;
    if (cloud.form === "droplet") {
      cloud.playSpread();
      const t0 = performance.now();
      await new Promise<void>((resolve) => {
        const tick = () => {
          if (cloud.gather < 0.08 || performance.now() - t0 > 1100) {
            resolve();
            return;
          }
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }
    this.stage.removeOverlay(cloud.group);
    cloud.dispose();
  }

  private clearPickupImmediate(): void {
    this.clearPickupCountSpr();
    this.clearPickupFloorMark();
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
    this.wave.stationary = true;
    if (this.wave.huntAliveCount <= 0) {
      this.wave.resetPool();
      await this.wave.scatterAround(this.cfg.mission_count, this.cfg.mission_min_r, this.cfg.mission_max_r);
    }
    this.huntLock = null;
    this.emitCombatHud();
    while (this.running && this.wave.huntAliveCount > 0) {
      if ((this.hooks.getCombatAmmo?.() ?? 0) <= 0 && !this.ammoRefillBusy) {
        this.ammoRefillBusy = true;
        this.pauseHunt = true;
        this.hooks.onHud?.("정화제 부족 · 다시 구한다");
        await this.playLesson("catalyst");
        this.setBeat("mission");
        this.pauseHunt = false;
        this.ammoRefillBusy = false;
        this.hooks.onHud?.("얼룩 정화");
      }
      this.emitCombatHud();
      await sleep(120);
    }
  }

  private async playTint(step: 1 | 2 | 3): Promise<void> {
    const steps = this.cfg.color_steps;
    // 3차는 마지막 단계(보통 1)까지 — 하늘·바닥 완전 정화
    const amt =
      step === 3
        ? (steps[steps.length - 1] ?? 1)
        : (steps[step - 1] ?? (step === 1 ? 0.22 : 0.55));
    /** 프로토: 1차 = 섹터 원 전체(radius_m). 2·3차는 기존 비율. */
    const halfWorld = this.stage.getWorldScale() / 2 - 2;
    const loopR = Math.min(this.cfg.radius_m, halfWorld);
    const radiusM =
      step === 1 ? loopR : step === 2 ? Math.min(loopR * 0.95, halfWorld) : loopR;
    if (step === 1) this.setBeat("tint1");
    else if (step === 2) this.setBeat("tint2");
    this.hooks.onHud?.(step === 1 ? "1단계 정화" : step === 2 ? "2단계 정화" : "3단계 정화");

    if (this.cfg.combat_loop) {
      await this.combatCastAtCore(step);
    }

    this.stage.setPurifyColorAmt(amt);
    const skyFrom = this.stage.getSkyPurifyAmount();
    this.stage.setPurifyFoci([{ x: this.core.x, z: this.core.z, r: 0 }]);
    const me = this.stage.getPlayer();
    await this.stage.playPurifyStandWave({
      xPct: me.xPct,
      yPct: me.yPct,
      radiusM,
      durationMs: step === 1 ? 3600 : step === 2 ? 4200 : 5600,
      skyWave: true,
      skyAmountFrom: skyFrom,
      skyAmountTo: amt,
      fociWave: { x: this.core.x, z: this.core.z, maxR: radiusM },
      holdWave: true,
    });
    this.stage.setPurifyFoci([{ x: this.core.x, z: this.core.z, r: radiusM }]);
    this.stage.setPurifyColorAmt(amt);
    this.stage.clearPurifyWaves();
    this.stage.setSkyPurifyAmount(amt);
    if (step === 3 || amt >= 0.95) this.stage.setSkyPurified(true);
    this.stage.syncSkyFromFoci(true);

    if (this.cfg.combat_loop && step === 1) {
      await this.combatPollutionDefend(radiusM);
    }

    if (!this.usingQuest()) {
      if (step === 1 && this.cfg.tint1_dialogue_id) await this.hooks.onFiller(this.cfg.tint1_dialogue_id);
      else if (step === 2 && this.cfg.tint2_dialogue_id) await this.hooks.onFiller(this.cfg.tint2_dialogue_id);
    }
  }

  /** 지점 캐스팅만 추가 — 반경/색은 기존 playTint가 담당 */
  private async combatCastAtCore(step: 1 | 2 | 3): Promise<void> {
    const bal = this.combatBal;
    if (!bal) return;
    this.setBeat("casting");
    this.casting = true;
    this.castPct = 0;
    this.hooks.onHud?.(step === 1 ? "1차 정화 시도" : step === 2 ? "2차 정화 시도" : "최종 정화 시도");
    const castId =
      step === 1
        ? bal.dialogues.cast1_start
        : step === 2
          ? bal.dialogues.cast2_start
          : bal.dialogues.cast3_start;
    if (castId) {
      this.talking = true;
      try {
        await this.hooks.onFiller(castId);
      } finally {
        this.talking = false;
      }
    }
    await new Promise<void>((resolve) => {
      this.castResolve = resolve;
    });
    this.casting = false;
    this.castResolve = null;
    this.emitCombatHud();
  }

  /** 1차 정화 직후 — 5분 안에 큰 오염물질을 하나씩 퍼뜨려 해제 */
  private async combatPollutionDefend(radiusM: number): Promise<void> {
    const bal = this.combatBal;
    if (!bal) return;
    this.bandFailed = false;
    this.bandFullR = radiusM;
    this.stage.setPurifyFoci([{ x: this.core.x, z: this.core.z, r: radiusM }]);
    this.polluteMaxSec = bal.shrinkSec > 0 ? bal.shrinkSec : 300;
    this.polluteLeftSec = this.polluteMaxSec;
    this.polluteDefend = true;
    this.setBeat("mission");
    this.hooks.onHud?.("오염물질 · 하나씩 해제");
    this.spawnCombatRim(1, radiusM);
    this.burnRim?.setIntensity(0.9);
    const warnId = this.cfg.band_warn_dialogue_id || bal.dialogues.band_warn;
    if (warnId) {
      this.talking = true;
      try {
        await this.hooks.onFiller(warnId);
      } finally {
        this.talking = false;
      }
    }
    const n = Math.max(1, this.cfg.matter_count ?? this.combatBal?.bugCount ?? 5);
    const hp = Math.max(2, bal.bugHp);
    const minR = Math.max(8, radiusM * 0.28);
    const maxR = Math.max(minR + 4, radiusM * 0.82);
    this.wave.resetPool();
    await this.wave.scatterBigPollution(n, minR, maxR, hp);
    this.huntLock = null;
    this.invadeBugsTotal = n;
    this.emitCombatHud();
    // 탄 부족하면 획득 필러 → 물방울 위치로 걸어가 채운 뒤 복귀
    while (this.running && this.polluteDefend && !this.bandFailed && this.wave.huntAliveCount > 0) {
      if ((this.hooks.getCombatAmmo?.() ?? 0) <= 0 && !this.ammoRefillBusy) {
        this.ammoRefillBusy = true;
        this.pauseHunt = true;
        this.hooks.onHud?.("정화제 부족 · 다시 구한다");
        await this.playLesson("catalyst");
        this.setBeat("mission");
        this.pauseHunt = false;
        this.ammoRefillBusy = false;
        this.hooks.onHud?.("오염물질 · 하나씩 해제");
      }
      this.emitCombatHud();
      await sleep(120);
    }
    this.polluteDefend = false;
    this.clearCombatRim();
    if (this.bandFailed) {
      this.stage.setPurifyColorAmt(0);
      const failId = bal.dialogues.fail_pollute;
      if (failId) await this.hooks.onFiller(failId);
      this.hooks.onHud?.("오염이 원을 삼켰다");
      return;
    }
    this.combatVfx?.playReleaseBurst(this.core.x, this.core.z, "wave");
    const stopId = this.cfg.band_stop_dialogue_id || bal.dialogues.band_stop;
    if (stopId) {
      this.talking = true;
      try {
        await this.hooks.onFiller(stopId);
      } finally {
        this.talking = false;
      }
    }
    this.stage.setPurifyFoci([{ x: this.core.x, z: this.core.z, r: radiusM }]);
    this.stage.setPurifyColorAmt(this.cfg.color_steps[0] ?? 0.22);
    this.emitCombatHud();
  }

  /** @deprecated 방향 멈춤 게이지 — 프로토는 combatPollutionDefend 사용 */
  private async combatBandShrinkStop(step: 1 | 2 | 3, radiusM: number): Promise<void> {
    await this.combatPollutionDefend(radiusM);
  }

  private spawnCombatRim(step: TintStep, radiusM: number): void {
    this.clearCombatRim();
    this.burnRim = new BurnRim(step);
    this.burnRim.setWorld(this.core.x, this.core.z, radiusM);
    this.stage.addOverlay(this.burnRim.mesh);
    this.blightDots = new SoftBlightOctet(step);
    this.blightDots.setOnCircle(this.core.x, this.core.z, radiusM);
    this.stage.addOverlay(this.blightDots.group);
  }

  private applyCombatBandRadius(r: number): void {
    this.bandRadius = Math.max(0.4, r);
    const dir = COMBAT_STOP_DIRS.find((d) => d.name === this.stopDirName) ?? COMBAT_STOP_DIRS[0]!;
    this.stopGate = {
      x: this.core.x + Math.cos(dir.ang) * this.bandRadius * 0.98,
      z: this.core.z + Math.sin(dir.ang) * this.bandRadius * 0.98,
    };
    // 본편 정화색 구역은 틴트 반경 유지 (툴 circle 12m / 띠 축소와 분리)
    this.stage.setPurifyFoci([{ x: this.core.x, z: this.core.z, r: this.bandFullR }]);
    this.blightDots?.setOnCircle(this.core.x, this.core.z, this.bandRadius);
    this.burnRim?.setWorld(this.core.x, this.core.z, this.bandRadius);
    this.burnRim?.setIntensity(0.85 + this.bandWaveIn * 0.2);
  }

  private clearCombatRim(): void {
    if (this.burnRim) {
      this.stage.removeOverlay(this.burnRim.mesh);
      this.burnRim.dispose();
      this.burnRim = null;
    }
    if (this.blightDots) {
      this.stage.removeOverlay(this.blightDots.group);
      this.blightDots.dispose();
      this.blightDots = null;
    }
  }

  private clearCombatFx(): void {
    this.clearCombatRim();
    this.disposeKingVisuals();
  }

  private pctNearStop(): [number, number] {
    const dx = this.core.x - this.stopGate.x;
    const dz = this.core.z - this.stopGate.z;
    const len = Math.hypot(dx, dz) || 1;
    const x = this.stopGate.x + (dx / len) * 5.5;
    const z = this.stopGate.z + (dz / len) * 5.5;
    const p = this.stage.worldToPctPublic(x, z);
    return [p.xPct, p.yPct];
  }

  private emitCombatHud(): void {
    if (!this.combatHud) return;
    const ammo = this.hooks.getCombatAmmo?.() ?? 0;
    const alive = this.wave.huntAliveCount;
    const invadeHud = this.invadeActive && this.beat === "invade";
    const kingHud = this.beat === "king" && (!!this.kingBody || !!this.kingStain);
    const pollutePct = this.polluteDefend && this.polluteMaxSec > 0
      ? 1 - this.polluteLeftSec / this.polluteMaxSec
      : invadeHud && this.invadeMaxSec > 0
        ? 1 - this.invadeLeftSec / this.invadeMaxSec
        : this.bandWaveIn;
    const timed = this.polluteDefend || this.bandActive || invadeHud;
    const urgency: 0 | 1 | 2 = timed
      ? pollutePct >= 0.75
        ? 2
        : pollutePct >= 0.5
          ? 1
          : 0
      : 0;
    const shrinkLeft = this.polluteDefend
      ? this.polluteLeftSec
      : invadeHud
        ? this.invadeLeftSec
        : this.combatBal
          ? Math.max(0, (1 - this.bandWaveIn) * this.combatBal.shrinkSec)
          : 0;
    const boss = kingHud
      ? this.wave.huntUnits.find((u) => u.is_boss || u.role === "boss")
      : undefined;
    let phaseLabel = "—";
    if (this.casting) phaseLabel = "정화 시도";
    else if (invadeHud) phaseLabel = `벌레 퇴치 ${alive}/${this.invadeBugsTotal}`;
    else if (kingHud) {
      phaseLabel = "원흉";
    }
    else if (this.polluteDefend) phaseLabel = `오염 제거 ${alive}`;
    else if (this.bandActive) phaseLabel = `${this.stopDirName} 멈춤`;
    else if (this.beat === "mission") phaseLabel = `얼룩 정화 ${alive}/${Math.max(alive, this.invadeBugsTotal || alive)}`;

    const missionHud = this.beat === "mission" && !this.casting && alive > 0;
    this.combatHud.apply({
      phaseLabel,
      ammo,
      urgency,
      showCast: this.casting,
      castPct: this.castPct,
      showPollute: this.polluteDefend || this.bandActive || invadeHud,
      pollutionPct: pollutePct,
      shrinkLeftSec: shrinkLeft,
      showCombat: this.polluteDefend || this.bandActive || invadeHud || kingHud || missionHud,
      stopLeft: this.polluteDefend ? alive : this.stopLeft,
      stopMax: this.polluteDefend ? Math.max(alive, 1) : this.stopMax,
      stopDir: this.polluteDefend ? "오염" : this.stopDirName,
      bugsAlive: invadeHud || this.polluteDefend || missionHud ? alive : undefined,
      bugsTotal: invadeHud
        ? this.invadeBugsTotal
        : missionHud
          ? Math.max(alive, this.invadeBugsTotal)
          : this.polluteDefend
            ? Math.max(alive, this.invadeBugsTotal || this.combatBal?.bugCount || 1)
            : undefined,
      culpritHp: boss ? Math.max(0, Math.floor(boss.hp + 1e-6)) : undefined,
      culpritMax: boss ? Math.round(boss.maxHp) : kingHud ? this.cfg.king_hp : undefined,
    });
  }

  /** 퇴치제 레슨 후에도 0이면 하한 지급 — 무한 줍기 루프 방지 */
  private async ensureInhibitAmmo(min = 8): Promise<void> {
    const need = Math.max(1, Math.floor(min));
    let guard = 0;
    while ((this.hooks.getInhibitAmmo?.() ?? 0) < need && guard++ < 3) {
      const before = this.hooks.getInhibitAmmo?.() ?? 0;
      await this.playLesson("inhibit");
      this.setBeat("invade");
      if ((this.hooks.getInhibitAmmo?.() ?? 0) <= before) {
        this.hooks.addInhibitAmmo?.(Math.max(need, 8));
        break;
      }
    }
    if ((this.hooks.getInhibitAmmo?.() ?? 0) <= 0) {
      this.hooks.addInhibitAmmo?.(8);
    }
  }

  private async playInvade(step?: QuestStepDef): Promise<void> {
    this.setBeat("invade");
    this.hooks.onHud?.(step?.hud_label || "벌레 퇴치");
    // 퇴치제 없으면 침입 전에 줍기 (+하한)
    if ((this.hooks.getInhibitAmmo?.() ?? 0) <= 0) {
      await this.ensureInhibitAmmo(8);
      this.setBeat("invade");
      this.hooks.onHud?.(step?.hud_label || "벌레 퇴치");
    }
    if (!this.usingQuest() && this.cfg.invade_dialogue_id) await this.hooks.onFiller(this.cfg.invade_dialogue_id);
    this.wave.resetPool();
    this.wave.stationary = false;
    this.eatAcc = 0;
    const bugs = Math.max(
      1,
      this.cfg.invade_count || this.combatBal?.bugCount || 12,
    );
    const bugHp = Math.max(2, this.combatBal?.bugHp ?? 3);
    const order = Array.from({ length: bugs }, (_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = order[i]!;
      order[i] = order[j]!;
      order[j] = t;
    }
    for (const i of order) {
      // 360° 고르게 — 오염 자리 뭉침 방지
      const ang = (i / Math.max(1, bugs)) * Math.PI * 2 + Math.random() * 0.35;
      const rMin = Math.max(6, this.cfg.invade_min_r);
      const rMax = Math.max(rMin + 2, this.cfg.invade_max_r);
      const r = rMin + Math.random() * (rMax - rMin);
      const pos = {
        x: this.core.x + Math.cos(ang) * r,
        z: this.core.z + Math.sin(ang) * r,
      };
      this.wave.spawnTyped({
        x: pos.x,
        z: pos.z,
        hp: bugHp,
        role: "runner",
        speed_mult: 1,
        eat_mult: 1,
        scale: 1.85 * 0.7, // -30%
        color: 0xff99ee,
        look: "bug",
        showHp: true,
      });
      await sleep(200 + Math.random() * 360);
    }
    this.huntLock = null;
    this.setBeat("invade");
    this.invadeActive = true;
    this.invadeBugsTotal = bugs;
    this.invadeMaxSec = Math.max(60, Math.min(180, this.combatBal?.shrinkSec ?? 120));
    this.invadeLeftSec = this.invadeMaxSec;
    this.emitCombatHud();
    // 재료 부족·펫 조우를 기다리며 전멸 대기
    let stuckAcc = 0;
    while (this.running && this.wave.huntAliveCount > 0) {
      if (this.petEncounterWait) {
        // 펫 조우가 영원히 안 끝나면 전투가 멈춤 — 20초 상한
        await Promise.race([this.petEncounterWait, sleep(20000)]);
        this.petEncounterWait = null;
        this.talking = false;
        this.pauseHunt = false;
        this.lootBusy = false;
        this.setBeat("invade");
      }
      if ((this.hooks.getInhibitAmmo?.() ?? 0) <= 0 && !this.ammoRefillBusy) {
        this.ammoRefillBusy = true;
        this.pauseHunt = true;
        this.hooks.onHud?.("퇴치제 부족 · 다시 구한다");
        await this.ensureInhibitAmmo(8);
        this.setBeat("invade");
        this.pauseHunt = false;
        this.ammoRefillBusy = false;
        this.hooks.onHud?.(step?.hud_label || "벌레 퇴치");
      }
      // pause/대화/탄0으로 진행이 막힌 시간만 누적 (정상 전투는 제외)
      if (this.pauseHunt || this.talking || this.ammoRefillBusy || (this.hooks.getInhibitAmmo?.() ?? 0) <= 0) {
        stuckAcc += 0.12;
      } else {
        stuckAcc = 0;
      }
      // 25초 동안 막혀 있으면 플래그 강제 해제 + 탄 보급
      if (stuckAcc > 25) {
        this.talking = false;
        this.pauseHunt = false;
        this.lootBusy = false;
        this.ammoRefillBusy = false;
        if ((this.hooks.getInhibitAmmo?.() ?? 0) <= 0) this.hooks.addInhibitAmmo?.(12);
        this.setBeat("invade");
        stuckAcc = 0;
        this.hooks.onHud?.("퇴치 재개");
      }
      this.emitCombatHud();
      await sleep(120);
    }
    if (this.petEncounterWait) {
      await Promise.race([this.petEncounterWait, sleep(5000)]);
      this.petEncounterWait = null;
      this.talking = false;
      this.pauseHunt = false;
      this.lootBusy = false;
    }
    this.invadeActive = false;
    this.emitCombatHud();
    if (this.cfg.combat_loop) {
      this.combatVfx?.playReleaseBurst(this.core.x, this.core.z, "wave");
    }
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

  /** 대화 통과 뒤 — 멀리 등장 → 가드 → 밑 얼룩+위 네모 · 같이 이동 */
  private async playCulpritMatter(): Promise<void> {
    this.hooks.onHud?.("원흉이 멀리서 꿈틀거린다");
    this.wave.resetPool();
    this.wave.stationary = false;
    const spawn = this.pickKingSpawnFar();
    const kingHp = Math.max(1, Math.round(this.cfg.king_hp || this.combatBal?.culpritHp || 10));
    // 원흉 직전 정화제 하한 3발
    let ammoGuard = 0;
    while ((this.hooks.getCombatAmmo?.() ?? 0) < 3 && ammoGuard++ < 3) {
      this.hooks.onHud?.("원흉 전 · 정화제 확보");
      const before = this.hooks.getCombatAmmo?.() ?? 0;
      await this.playLesson("catalyst");
      if ((this.hooks.getCombatAmmo?.() ?? 0) <= before) {
        this.hooks.addCombatAmmo?.(Math.max(1, 3 - before));
        break;
      }
    }

    // 밑: 동그라미 얼룩 — 멀리서 퍼진 채로 등장
    await loadStainDroplet();
    const stainFit = petFit();
    this.kingStain = new CulpritCloud({
      form: "stain",
      count: Math.min(16000, Math.max(6000, stainFit.count)),
      size: Math.max(0.04, stainFit.size),
    });
    const stainScale = Math.max(5.5, (this.combatBal?.culpritScale ?? 28) * 0.22);
    this.kingStain.group.scale.setScalar(stainScale);
    this.kingStain.purify = 0;
    this.kingStain.purifyTo = 0;
    this.kingStain.rise = 1;
    this.kingStain.riseTo = 1;
    this.kingStain.gather = 0.12;
    this.kingStain.gatherTo = 0.12;
    this.kingStain.setWorld(spawn.x, spawn.z);
    this.kingStain.tick(0);
    this.stage.addOverlay(this.kingStain.group);

    // 위: 네모 원흉
    this.kingBody = await BlightBody.create("culprit", {
      scale: Math.max(2.6, 2.2),
    });
    this.kingBody.cloud.setSize(Math.max(0.06, petFit().size * 1.15));
    this.kingBody.cloud.gather = 0.08;
    this.kingBody.cloud.gatherTo = 0.08;
    this.kingBody.cloud.purify = 0;
    this.kingBody.cloud.purifyTo = 0;
    this.kingBody.cloud.rise = 1;
    this.kingBody.cloud.riseTo = 1;
    this.syncKingVisuals(spawn.x, spawn.z);
    this.kingBody.cloud.tick(0);
    this.stage.addOverlay(this.kingBody.group);

    // 등장: 퍼짐 → 모임 (멀리서 보이게)
    this.kingStain.playSpread();
    this.kingBody.cloud.playSpread();
    this.combatVfx?.playReleaseBurst(spawn.x, spawn.z, "culprit");
    await sleep(700);
    if (!this.running) return;
    this.kingStain.gather = 0.05;
    this.kingStain.playGather();
    this.kingBody.cloud.gather = 0.05;
    this.kingBody.cloud.playGather();
    await sleep(900);
    if (!this.running) return;

    // 가드 — 얼룩만 2개(오염물질 소환 금지). 원흉은 가드와 무관하게 유효타.
    await this.spawnKingGuards(spawn.x, spawn.z);
    this.hooks.onHud?.("원흉 · 정화제");

    const boss = this.wave.spawnTyped({
      x: spawn.x,
      z: spawn.z,
      hp: kingHp,
      role: "boss",
      speed_mult: 0,
      eat_mult: 0.35,
      scale: 1.2,
      color: 0xffffff,
      is_boss: true,
      look: "boss",
      noCloud: true,
      showHp: true,
    });
    this.kingBossId = boss.id;
    this.kingSinceHit = 0;
    this.kingStayAcc = 0;
    this.kingHitStreak = 0;
    this.kingGuardsClearedFx = false;
    this.kingHitBusy = false;
    this.kingTeleportBusy = false;
    this.huntLock = null;
    this.emitCombatHud();
    while (this.running && this.wave.huntAliveCount > 0) {
      if (this.petEncounterWait) {
        await this.petEncounterWait;
        this.petEncounterWait = null;
      }
      if ((this.hooks.getCombatAmmo?.() ?? 0) <= 0 && !this.ammoRefillBusy) {
        this.ammoRefillBusy = true;
        this.pauseHunt = true;
        this.hooks.onHud?.("정화제 부족 · 다시 구한다");
        await this.playLesson("catalyst");
        this.setBeat("king");
        this.pauseHunt = false;
        this.ammoRefillBusy = false;
        this.hooks.onHud?.("원흉 · 정화제");
      }
      this.emitCombatHud();
      await sleep(120);
    }
    if (this.petEncounterWait) {
      await this.petEncounterWait;
      this.petEncounterWait = null;
    }
    if (this.cfg.combat_loop) {
      this.kingBody?.die();
      this.kingStain?.playSpread();
      const bossPos = this.wave.lastDeaths[0] ?? spawn;
      this.combatVfx?.playReleaseBurst(bossPos.x, bossPos.z, "culprit");
      const downId = this.combatBal?.dialogues.culprit_down;
      if (downId) {
        this.talking = true;
        try {
          await this.hooks.onFiller(downId);
        } finally {
          this.talking = false;
        }
      }
      const needId = this.combatBal?.dialogues.need_final_cast;
      if (needId) {
        this.talking = true;
        try {
          await this.hooks.onFiller(needId);
        } finally {
          this.talking = false;
        }
      }
    }
    this.disposeKingVisuals();
    this.kingBossId = null;
  }

  private disposeKingVisuals(): void {
    if (this.kingBody) {
      this.stage.removeOverlay(this.kingBody.group);
      this.kingBody.dispose();
      this.kingBody = null;
    }
    if (this.kingStain) {
      this.stage.removeOverlay(this.kingStain.group);
      this.kingStain.dispose();
      this.kingStain = null;
    }
  }

  /** 밑 얼룩 + 위 네모 — 같은 xz */
  private syncKingVisuals(x: number, z: number): void {
    this.kingStain?.setWorld(x, z);
    if (!this.kingBody) return;
    this.kingBody.setWorld(x, z);
    // 얼룩 바로 위
    this.kingBody.group.position.y = Math.max(1.1, this.kingBody.group.scale.y * 0.45);
  }

  /** 피격 — 움찔 → 살짝 퍼짐 → 다시 모임 */
  private playKingHitFx(): void {
    if (!this.kingBody || this.kingHitBusy || this.kingTeleportBusy) return;
    this.kingHitBusy = true;
    void (async () => {
      try {
        const body = this.kingBody;
        if (!body) return;
        this.kingStain?.pulseHit();
        body.hit();
        this.combatVfx?.playSkillHit(
          body.group.position.x,
          body.group.position.z,
          "purify",
        );
        await sleep(280);
        if (!this.kingBody) return;
        body.cloud.playSpread();
        await sleep(400);
        if (!this.kingBody) return;
        body.cloud.gather = 0.1;
        body.cloud.playGather();
      } finally {
        this.kingHitBusy = false;
      }
    })();
  }

  /** 원흉 스폰 — 플레이어에서 멀고 원 가장자리 쪽 */
  private pickKingSpawnFar(): { x: number; z: number } {
    const me = this.stage.getPlayerWorld();
    const maxR = Math.max(12, this.cfg.radius_m - 3);
    const want = Math.max(18, Math.min(maxR * 0.88, this.cfg.radius_m * 0.58));
    let best = { x: this.core.x, z: this.core.z + want };
    let bestScore = -1;
    for (let i = 0; i < 20; i++) {
      const ang = (i / 20) * Math.PI * 2 + Math.random() * 0.25;
      const r = want * (0.82 + Math.random() * 0.18);
      const x = this.core.x + Math.cos(ang) * r;
      const z = this.core.z + Math.sin(ang) * r;
      const dMe = Math.hypot(x - me.x, z - me.z);
      // 플레이어와 거리 + 원 바깥쪽 가산
      const score = dMe + Math.hypot(x - this.core.x, z - this.core.z) * 0.15;
      if (dMe >= want * 0.65 && score > bestScore) {
        bestScore = score;
        best = { x, z };
      }
    }
    return best;
  }

  /** 원흉 주변 가드 — 얼룩만 (오염물질 소환 금지) */
  private async spawnKingGuards(ox: number, oz: number): Promise<void> {
    this.hooks.onHud?.("원흉 주변 · 얼룩");
    const spots: { r: number; hp: number; scale: number }[] = [
      { r: 3.4, hp: 1, scale: 1 },
      { r: 4.6, hp: 1, scale: 1.05 },
    ];
    for (let i = 0; i < spots.length; i++) {
      const s = spots[i]!;
      const ang = (i / spots.length) * Math.PI * 2 + Math.random() * 0.4;
      const pos = {
        x: ox + Math.cos(ang) * s.r,
        z: oz + Math.sin(ang) * s.r,
      };
      this.wave.spawnTyped({
        x: pos.x,
        z: pos.z,
        hp: s.hp,
        role: "runner",
        speed_mult: 0,
        eat_mult: 0,
        scale: s.scale,
        color: 0xc090ff,
        look: "stain",
        showHp: false,
      });
      await sleep(100 + Math.random() * 160);
    }
  }

  /** 플레이어와 사거리 안(약 7.5m) 유지 — 18m면 총이 안 닿아 원흉이 안 깎임 */
  private teleportKingBoss(boss: { id: number; x: number; z: number }): void {
    if (this.kingTeleportBusy || this.kingHitBusy) return;
    const me = this.stage.getPlayerWorld();
    const hold = 7.5;
    const maxR = Math.max(6, this.cfg.radius_m - 2);
    let best: { x: number; z: number } | null = null;
    let bestScore = -1;
    for (let i = 0; i < 12; i++) {
      const ang = Math.random() * Math.PI * 2;
      let x = me.x + Math.cos(ang) * hold;
      let z = me.z + Math.sin(ang) * hold;
      const dx = x - this.core.x;
      const dz = z - this.core.z;
      const distCore = Math.hypot(dx, dz) || 1;
      if (distCore > maxR) {
        const s = maxR / distCore;
        x = this.core.x + dx * s;
        z = this.core.z + dz * s;
      }
      // 플레이어와 거리 재보정 (원 밖으로 밀린 경우)
      const dMe = Math.hypot(x - me.x, z - me.z) || 1;
      if (dMe < hold * 0.85 || dMe > hold * 1.25) {
        const ux = (x - me.x) / dMe;
        const uz = (z - me.z) / dMe;
        x = me.x + ux * hold;
        z = me.z + uz * hold;
        const dx2 = x - this.core.x;
        const dz2 = z - this.core.z;
        const dc2 = Math.hypot(dx2, dz2) || 1;
        if (dc2 > maxR) {
          x = this.core.x + (dx2 / dc2) * maxR;
          z = this.core.z + (dz2 / dc2) * maxR;
        }
      }
      const jump = Math.hypot(x - boss.x, z - boss.z);
      if (jump > bestScore) {
        bestScore = jump;
        best = { x, z };
      }
    }
    if (!best || bestScore < 2.5) return;
    const dest = best;
    const bossId = boss.id;
    this.kingTeleportBusy = true;
    this.hooks.onHud?.("원흉이 자리를 옮긴다");
    void (async () => {
      try {
        // 1) 확실히 퍼짐 — 밑 얼룩 + 위 네모 같이
        if (this.kingStain) {
          this.kingStain.gather = Math.min(this.kingStain.gather, 0.35);
          this.kingStain.playSpread();
        }
        if (this.kingBody) {
          this.kingBody.cloud.gather = Math.min(this.kingBody.cloud.gather, 0.28);
          this.kingBody.cloud.playSpread();
        }
        await sleep(620);
        if (!this.running || this.beat !== "king") return;
        // 2) 같이 이동
        this.wave.setUnitWorld(bossId, dest.x, dest.z);
        this.syncKingVisuals(dest.x, dest.z);
        // 3) 확실히 모임
        if (this.kingStain) {
          this.kingStain.gather = 0.05;
          this.kingStain.playGather();
        }
        if (this.kingBody) {
          this.kingBody.cloud.gather = 0.05;
          this.kingBody.cloud.playGather();
        }
        await sleep(680);
        // 가드·오염물질 리젠 없음 (지시: 오염물질 소환 금지)
      } finally {
        this.kingTeleportBusy = false;
      }
    })();
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
    // 얼룩 출현 = 실제 사거리와 동기
    this.wave.setEmergeRange(this.raidCfg.gun_range_m + tune.rangeAdd);
    this.stage.keepInsideDisk(this.core.x, this.core.z, this.cfg.radius_m);
    this.wave.tick(dt);
    this.pickupCloud?.tick(dt);
    this.burnRim?.tick(dt);
    this.blightDots?.tick(dt);
    this.kingBody?.tick(dt);
    this.kingStain?.tick(dt);
    this.combatVfx?.tick(dt);
    if (this.throwSettleLeft > 0) {
      this.throwSettleLeft = Math.max(0, this.throwSettleLeft - dt);
    }

    if (this.casting) {
      // 대화 중에도 게이지는 진행 (talking에 막혀 다음 단계로 못 가는 문제 방지)
      if (!this.talking) {
        const sec = Math.max(0.4, this.combatBal?.castSec ?? 3.6);
        this.castPct = Math.min(1, this.castPct + dt / sec);
        this.emitCombatHud();
        if (this.castPct >= 1 && this.castResolve) {
          const r = this.castResolve;
          this.castResolve = null;
          r();
        }
      }
      return;
    }

    if (this.polluteDefend && !this.talking && !this.ammoRefillBusy) {
      this.polluteLeftSec = Math.max(0, this.polluteLeftSec - dt);
      if (this.burnRim && this.polluteMaxSec > 0) {
        const u = 1 - this.polluteLeftSec / this.polluteMaxSec;
        this.burnRim.setIntensity(0.85 + u * 0.25);
      }
      this.emitCombatHud();
      if (this.polluteLeftSec <= 0) {
        this.bandFailed = true;
        this.polluteDefend = false;
        this.wave.clear();
        const done = this.waitClear;
        this.waitClear = null;
        this.waitGoal = null;
        done?.();
        return;
      }
    }

    if (this.bandActive && !this.talking) {
      const sec = this.combatBal?.shrinkSec ?? 180;
      this.bandWaveIn = Math.min(1, this.bandWaveIn + dt / sec);
      this.applyCombatBandRadius(Math.max(0.4, this.bandFullR * (1 - this.bandWaveIn)));
      if (this.bandWaveIn >= 1) {
        this.bandFailed = true;
        const r = this.bandResolve;
        this.bandResolve = null;
        r?.();
        this.emitCombatHud();
        return;
      }
      this.autoHuntBand(dt);
      this.emitCombatHud();
      return;
    }

    if (this.invadeActive && this.beat === "invade" && !this.talking && !this.ammoRefillBusy) {
      this.invadeLeftSec = Math.max(0, this.invadeLeftSec - dt);
      this.emitCombatHud();
      if (this.invadeLeftSec <= 0) {
        this.hooks.onHud?.("시간 초과 · 벌레가 원을 흐린다");
        this.stage.setPurifyColorAmt(0);
        this.invadeLeftSec = this.invadeMaxSec;
      }
    }

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
    if ((this.kingBody || this.kingStain) && this.beat === "king") {
      const boss = this.wave.huntUnits.find((u) => u.is_boss || u.role === "boss");
      if (boss) {
        if (!this.kingTeleportBusy) {
          this.syncKingVisuals(boss.x, boss.z);
        }
        if (boss.maxHp > 0 && this.kingBody) {
          this.kingBody.cloud.purifyTo =
            1 - Math.max(0, boss.hp) / Math.max(1, boss.maxHp);
        }
        if (!this.talking && !this.pauseHunt && !this.kingHitBusy && !this.kingTeleportBusy) {
          const me = this.stage.getPlayerWorld();
          const dMe = Math.hypot(boss.x - me.x, boss.z - me.z);
          // 붙어도 도망 거의 안 함 — 예전에 10m 도주+사거리9m로 원흉이 안 맞았음
          if (dMe < 2.2) {
            this.kingStayAcc = 0;
            this.teleportKingBoss(boss);
          } else {
            this.kingStayAcc += dt;
            // 16초마다 자리만 살짝 이동 (사거리 안)
            if (this.kingStayAcc >= 16) {
              this.kingStayAcc = 0;
              this.teleportKingBoss(boss);
            }
          }
        }
        // 가드 전멸 직후 1회 — 원흉이 드러나는 연출
        if (
          !this.kingGuardsClearedFx &&
          this.wave.guardAliveCount() <= 0 &&
          !this.kingTeleportBusy
        ) {
          this.kingGuardsClearedFx = true;
          this.hooks.onHud?.("원흉이 드러난다");
          this.kingStain?.playSpread();
          this.kingBody?.cloud.playSpread();
          void (async () => {
            await sleep(450);
            if (!this.running || this.beat !== "king") return;
            this.kingStain?.playGather();
            this.kingBody?.cloud.playGather();
          })();
        }
        // HP 재생 끔 — 프로토에선 원흉이 안 깎이던 체감 방지
        this.kingSinceHit += dt;
      }
      this.emitCombatHud();
    }
    this.autoHunt(dt);
    if (!this.waitClear) return;
    if (this.pauseHunt) return;
    if (this.beat !== "mission" && this.beat !== "invade" && this.beat !== "king") return;
    const alive = this.wave.huntAliveCount;
    const ok =
      this.waitGoal === "empty"
        ? alive === 0
        : typeof this.waitGoal === "number" && alive <= this.waitGoal;
    if (!ok) return;
    // 전멸이면 필러 대화(talking) 중이어도 다음 단계로 — 막힘 방지
    const done = this.waitClear;
    this.waitClear = null;
    this.waitGoal = null;
    done();
  }

  /** 띠 멈춤 게이지 — 기존 자동 투척으로 방향 지점만 */
  private autoHuntBand(dt: number): void {
    if (this.pauseHunt || this.talking) return;
    if (this.throwSettleLeft > 0) return;
    if (this.stage.isThrowBusy()) return;
    this.stage.turnToward(this.stopGate.x, this.stopGate.z, dt);
    const tune = liveHuntTune(this.hooks);
    const reach = Math.max(0.5, this.raidCfg.gun_range_m + tune.rangeAdd);
    const me = this.stage.getPlayerWorld();
    const dist = Math.hypot(this.stopGate.x - me.x, this.stopGate.z - me.z);
    if (dist > reach) {
      this.stage.nudgeToward(this.stopGate.x, this.stopGate.z, dt, 2.8 * tune.speedMul);
      return;
    }
    if (!this.stage.inForwardCone(this.stopGate.x, this.stopGate.z, THROW_FORWARD_DEG)) return;
    if (this.stage.isThrowing()) return;
    const spent = this.hooks.onThrowSpend ? this.hooks.onThrowSpend("adsorb") : true;
    if (!spent) {
      this.hooks.onHud?.("정화제가 비었다");
      return;
    }
    this.stage.applyStoneThrowConfig({
      ...this.raidCfg,
      paint_radius_m: this.raidCfg.paint_radius_m * tune.splashMul,
    });
    this.stage.throwAt(this.stopGate.x, this.stopGate.z);
  }

  private autoHunt(dt: number): void {
    if (this.pauseHunt || this.talking) return;
    if (this.throwSettleLeft > 0) return;
    if (this.beat !== "mission" && this.beat !== "invade" && this.beat !== "king") return;
    if (this.stage.isThrowBusy()) return;
    const units = this.wave.huntUnits;
    if (!units.length) {
      this.huntLock = null;
      return;
    }
    const me = this.stage.getPlayerWorld();
    // 원흉전: 원흉을 우선 타격 (가드 때문에 원흉이 안 깎이던 문제 제거)
    const pool = units;
    if (!this.huntLock || !pool.some((u) => u.id === this.huntLock?.id)) {
      const preferBoss =
        this.beat === "king"
          ? pool.find((u) => u.is_boss || u.role === "boss")
          : null;
      const next = preferBoss ?? nearest(pool, me.x, me.z);
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
    // 발사체 2종: 정화제(adsorb) · 퇴치제(inhibit). 원흉도 정화제.
    const mag: "adsorb" | "inhibit" = this.beat === "invade" ? "inhibit" : "adsorb";
    // 잔량만 먼저 확인 — throw 실패 시 탄 낭비 방지
    if (mag === "inhibit") {
      if ((this.hooks.getInhibitAmmo?.() ?? 0) <= 0) {
        this.hooks.onHud?.("퇴치제가 없다");
        return;
      }
    } else if ((this.hooks.getCombatAmmo?.() ?? 0) <= 0) {
      this.hooks.onHud?.("정화제가 비었다");
      return;
    }
    this.stage.applyStoneThrowConfig({
      ...this.raidCfg,
      paint_radius_m: this.raidCfg.paint_radius_m * tune.splashMul,
      missile_speed_mps: this.raidCfg.missile_speed_mps * (tune.missileMul ?? 1),
    });
    const launched = this.stage.throwAt(target.x, target.z);
    if (!launched) return;
    const spent = this.hooks.onThrowSpend ? this.hooks.onThrowSpend(mag) : true;
    if (!spent) {
      this.hooks.onHud?.(mag === "inhibit" ? "퇴치제가 없다" : "정화제가 비었다");
    }
  }

  private resetEncounterSlots(): void {
    this.bugEncountersLeft = LOOP_BUG_ENCOUNTER_SLOTS;
    this.matterEncountersLeft = LOOP_MATTER_ENCOUNTER_SLOTS;
  }

  private beginPetEncounter(
    spot: { x: number; z: number },
    pct: { xPct: number; yPct: number },
    petId: FieldPetId,
  ): void {
    if (!this.hooks.onBugPetEncounter) return;
    this.lootBusy = true;
    this.pauseHunt = true;
    this.talking = true;
    this.hooks.onHud?.("반려동물…?");
    this.petEncounterWait = this.hooks
      .onBugPetEncounter({ xPct: pct.xPct, yPct: pct.yPct, x: spot.x, z: spot.z, petId })
      .finally(() => {
        this.talking = false;
        this.pauseHunt = false;
        this.lootBusy = false;
        if (this.invadeActive) this.setBeat("invade");
        else if (this.beat === "king") this.setBeat("king");
      });
  }

  private onLand(x: number, z: number): void {
    if (!this.running) return;
    // 착탄 후 결과(HP·이펙트)가 보일 때까지 이동 텀
    this.throwSettleLeft = Math.max(this.throwSettleLeft, 0.48);
    const tune = liveHuntTune(this.hooks);
    const r = Math.max(0.4, this.raidCfg.paint_radius_m * tune.splashMul);

    if (this.bandActive) {
      if (Math.hypot(x - this.stopGate.x, z - this.stopGate.z) <= Math.max(4.2, r)) {
        this.stopLeft = Math.max(0, this.stopLeft - 1);
        this.combatVfx?.play("skill_spread", this.stopGate.x, this.stopGate.z);
        this.combatVfx?.playSkillHit(this.stopGate.x, this.stopGate.z, "purify");
        if (this.stopLeft <= 0 && this.bandResolve) {
          const done = this.bandResolve;
          this.bandResolve = null;
          done();
        }
      }
      this.emitCombatHud();
      return;
    }

    // 스킬 착탄 연출 — 정화제 / 퇴치제
    const skillKind = this.beat === "invade" ? "exterminate" : "purify";
    this.combatVfx?.playSkillHit(x, z, skillKind);

    const skipBoss = false;
    const beforeBossHp =
      this.beat === "king"
        ? this.wave.huntUnits.find((u) => u.is_boss || u.role === "boss")?.hp
        : undefined;
    const lockedLook = this.huntLock ? this.wave.lookOf(this.huntLock.id) : null;

    // 오염물질·얼룩: 락된 하나만 깎음 (한 대마다 타겟 안 바뀜)
    if (this.polluteDefend && this.huntLock) {
      this.wave.hitLocked(this.huntLock.id, 1);
    } else if (this.beat === "mission" && this.huntLock) {
      const splash = Math.max(r, 3.2);
      this.wave.hitSplash(x, z, splash, 1, { stamp: false, onlyId: this.huntLock.id });
    } else if (this.beat === "king" && this.huntLock) {
      this.wave.hitSplash(x, z, r, 1, {
        stamp: false,
        onlyId: this.huntLock.id,
        skipBoss,
      });
    } else if (this.beat === "invade" && this.huntLock) {
      this.wave.hitSplash(x, z, r, 1, { stamp: false, onlyId: this.huntLock.id });
    } else {
      this.wave.hitSplash(x, z, r, 1, { stamp: false, skipBoss });
    }

    if (this.beat === "king") {
      const after = this.wave.huntUnits.find((u) => u.is_boss || u.role === "boss")?.hp;
      if (
        beforeBossHp != null &&
        (after == null || after < beforeBossHp)
      ) {
        this.kingSinceHit = 0;
        this.kingHitStreak += 1;
        this.playKingHitFx();
        // 8대마다만 자리 이동 (예전 3대는 너무 잦음)
        if (this.kingHitStreak >= 8) {
          this.kingHitStreak = 0;
          this.kingStayAcc = 0;
          const bossU = this.wave.huntUnits.find((u) => u.is_boss || u.role === "boss");
          if (bossU) this.teleportKingBoss(bossU);
        }
      }
    }

    const deaths = this.wave.lastDeaths;
    if (deaths.length > 0 && !this.lootBusy && !this.talking && !this.pauseHunt) {
      const spot = deaths[0]!;
      const pct = this.stage.worldToPctPublic(spot.x, spot.z);
      const bugKill = lockedLook === "bug";
      const matterKill = lockedLook === "matter" || this.polluteDefend;
      if (bugKill && this.bugEncountersLeft > 0) {
        const petId = LOOP_BUG_ENCOUNTER_PETS[LOOP_BUG_ENCOUNTER_SLOTS - this.bugEncountersLeft]!;
        this.bugEncountersLeft -= 1;
        this.beginPetEncounter(spot, pct, petId);
      } else if (matterKill && this.matterEncountersLeft > 0) {
        this.matterEncountersLeft -= 1;
        this.beginPetEncounter(spot, pct, LOOP_MATTER_ENCOUNTER_PET);
      }
    }

    if (this.wave.lastStainKills > 0 || (this.beat === "invade" && this.wave.lastDeaths.length)) {
      for (const d of this.wave.lastDeaths) {
        this.combatVfx?.playReleaseBurst(d.x, d.z, this.beat === "invade" ? "bug" : "wave");
      }
    }
    // 죽은 뒤에만 락 해제 → 다음 가까운 걸로
    if (this.huntLock && !this.wave.huntUnits.some((u) => u.id === this.huntLock?.id)) {
      this.huntLock = null;
    }
    if (this.beat === "mission" && this.wave.lastStainKills > 0 && this.hooks.onStainCleared && !this.polluteDefend) {
      this.talking = true;
      void this.hooks.onStainCleared().finally(() => {
        this.talking = false;
      });
    }
    if (this.polluteDefend || this.beat === "king") this.emitCombatHud();
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

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function makePickupCountSprite(label: string): THREE.Sprite {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 128;
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, c.width, c.height);
  g.font = "900 64px Pretendard, sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.lineWidth = 10;
  g.strokeStyle = "rgba(8, 24, 28, 0.92)";
  g.strokeText(label, 128, 64);
  g.fillStyle = "#7fffea";
  g.fillText(label, 128, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const spr = new THREE.Sprite(mat);
  spr.scale.set(2.4, 1.2, 1);
  spr.renderOrder = 40;
  return spr;
}
