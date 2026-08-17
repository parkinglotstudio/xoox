/**
 * 프로토 실패 플로우 — 테스트 중 판이 끝나도 이어하기 / 재도전이 되게 한다.
 *
 * 정식 로그라이크는 「처음부터」만 남긴다. 지금은 기획 테스트용.
 * 체크포인트는 전투·습격 직전 스냅샷이다.
 */
import type { PlayerState } from "../types";

export type FailKind = "RUN" | "RAID";
export type FailChoice = "continue" | "retry";

export type FailRetry = {
  mode: "raid" | "turn";
  label: string;
  icon: string;
  tier: string;
  combatId?: string;
};

export function clonePlayerState(s: PlayerState): PlayerState {
  return {
    ...s,
    inventory: { ...s.inventory },
    gaugeCounts: { ...s.gaugeCounts },
    learnedSkills: [...s.learnedSkills],
    seenLocations: new Set(s.seenLocations),
    claimedMilestones: new Set(s.claimedMilestones),
    ownedPassives: new Set(s.ownedPassives),
    joinedPartyMembers: [...s.joinedPartyMembers],
    permanentPartyMembers: [...s.permanentPartyMembers],
    collectedMemories: [...s.collectedMemories],
    clearedNodes: [...s.clearedNodes],
    rescuedAnimals: [...s.rescuedAnimals],
    heldCatalysts: [...s.heldCatalysts],
    purifiedAreas: [...s.purifiedAreas],
    purifiedBlights: [...s.purifiedBlights],
    purifiedProps: [...(s.purifiedProps ?? [])],
    purifyFoci: s.purifyFoci.map((f) => ({ ...f })),
  };
}

export function applyPlayerState(target: PlayerState, src: PlayerState): void {
  const c = clonePlayerState(src);
  (Object.keys(c) as (keyof PlayerState)[]).forEach((k) => {
    (target as unknown as Record<string, unknown>)[k] = c[k];
  });
}

/** 이어하기 — 진행(아이·노드·일차)은 두고 체력만 다시 채운다 */
export function applyFailContinue(s: PlayerState): void {
  s.hp = Math.max(1, s.maxHp);
  s.purifyHp = Math.max(1, s.purifyMaxHp);
}

let checkpoint: PlayerState | null = null;
let retry: FailRetry | null = null;

export function captureFailCheckpoint(state: PlayerState, nextRetry: FailRetry | null): void {
  checkpoint = clonePlayerState(state);
  retry = nextRetry;
}

export function hasFailCheckpoint(): boolean {
  return checkpoint !== null;
}

export function peekFailRetry(): FailRetry | null {
  return retry;
}

export function restoreFailCheckpoint(state: PlayerState): boolean {
  if (!checkpoint) return false;
  applyPlayerState(state, checkpoint);
  return true;
}
