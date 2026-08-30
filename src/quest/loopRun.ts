/**
 * 들판 한 칸 런 기록 — 날·꽝·연타. 재산과 별개.
 * 루프가 살아 있을 때만 센다. 객체 할당을 늘리지 않는다.
 */
import type { AreaClearRecord } from "../types";
export type LoopRunSnap = {
  days: number;
  unlucky: number;
  mashOk: number;
  mashSlow: number;
};

const snap: LoopRunSnap = { days: 0, unlucky: 0, mashOk: 0, mashSlow: 0 };
let live = false;
let pendingBugs = 0;
let skills = 0;
const LOOP_SKILL_MAX = 5;

export function loopRunBegin(): void {
  live = true;
  snap.days = 0;
  snap.unlucky = 0;
  snap.mashOk = 0;
  snap.mashSlow = 0;
  pendingBugs = 0;
  skills = 0;
}

export function loopRunEnd(): LoopRunSnap {
  live = false;
  return { ...snap };
}

export function loopRunLive(): boolean {
  return live;
}

export function loopRunTickDay(n = 1): void {
  if (live) snap.days += n;
}

export function loopRunNoteUnlucky(): void {
  if (!live) return;
  snap.unlucky += 1;
  pendingBugs += 1;
}

export function loopRunNoteMash(sluggish: boolean): void {
  if (!live) return;
  if (sluggish) {
    snap.mashSlow += 1;
    pendingBugs += 1;
  } else {
    snap.mashOk += 1;
  }
}

export function loopRunAddBugs(n: number): void {
  if (live) pendingBugs += n;
}

export function loopRunTakeBugs(): number {
  const n = pendingBugs;
  pendingBugs = 0;
  return n;
}

export function loopRunCanSkill(): boolean {
  return live && skills < LOOP_SKILL_MAX;
}

export function loopRunNoteSkill(): void {
  if (live && skills < LOOP_SKILL_MAX) skills += 1;
}

export function loopRunLine(areaLabel: string): string {
  return `${areaLabel} ${Math.max(1, snap.days)}날 · 연타 ${snap.mashOk}`;
}

export function commitAreaClear(list: AreaClearRecord[], areaId: string, rec: LoopRunSnap): AreaClearRecord {
  const days = Math.max(1, rec.days);
  const prev = list.find((r) => r.areaId === areaId);
  const row: AreaClearRecord = {
    areaId,
    days,
    unlucky: rec.unlucky,
    mashOk: rec.mashOk,
    mashSlow: rec.mashSlow,
    bestDays: prev ? Math.min(prev.bestDays, days) : days,
  };
  const next = list.filter((r) => r.areaId !== areaId);
  next.push(row);
  list.length = 0;
  list.push(...next);
  return row;
}
