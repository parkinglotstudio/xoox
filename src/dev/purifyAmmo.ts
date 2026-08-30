/**
 * 정화제 탄창 — 지역 해금·생명 감옥·습격 입장이 같은 잔량을 쓴다.
 * 숫자는 data/purify_ammo_cost.csv 가 SSoT.
 */
import type { GameData, PlayerState, PurifyBlightDef } from "../types";

export function ammoHaveMsg(have: number, need: number): string {
  if (need <= 0) return `정화제 획득 ${have}`;
  return `정화제 획득 ${have}/${need}`;
}

export function ammoFullMsg(): string {
  return `정화제 모두 획득 완료`;
}

export function ammoShortMsg(have: number, need: number): string {
  return `정화제 부족 ${have}/${need} — 근처에서 더 모으자`;
}

export function ammoSpendMsg(need: number): string {
  return `정화제 ${need} 소모`;
}

export function ammoCost(data: GameData, sinkId: string, fallback = 0): number {
  const row = data.purifyAmmoCosts.find((r) => r.sink_id === sinkId);
  const n = row?.need ?? fallback;
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function ammoCostLabel(data: GameData, sinkId: string): string {
  return data.purifyAmmoCosts.find((r) => r.sink_id === sinkId)?.label ?? sinkId;
}

export function ammoCostForBlight(data: GameData, blight: PurifyBlightDef): number {
  return ammoCost(data, blight.target_kind === "LIFE" ? "LIFE" : "AREA", blight.target_kind === "LIFE" ? 5 : 3);
}

export function ammoCostForCombatTier(data: GameData, tier: string): number {
  const t = (tier || "NORMAL").toUpperCase();
  if (t === "MINIBOSS") return ammoCost(data, "COMBAT_MINIBOSS", 7);
  if (t === "BOSS" || t === "FINALBOSS") return ammoCost(data, "COMBAT_FINALBOSS", 7);
  return ammoCost(data, "COMBAT_NORMAL", 4);
}

export function fillAmountForNode(data: GameData, triggerType: string, triggerRef: string): number {
  const parsed = Number(triggerRef);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  const t = triggerType.toUpperCase();
  if (t === "CATALYST_ADSORB") {
    const cap = ammoCost(data, "THROW_ADSORB", 100);
    return Math.max(12, Math.round(cap * 0.4));
  }
  if (t === "CATALYST_INHIBIT") {
    const cap = ammoCost(data, "THROW_INHIBIT", 80);
    return Math.max(8, Math.round(cap * 0.4));
  }
  if (t === "CATALYST_CULPRIT") return 1;
  if (t === "CATALYST") return ammoCost(data, "CATALYST", 2);
  return ammoCost(data, "FILL", 1);
}

export type ThrowMagKind = "THROW_ADSORB" | "THROW_INHIBIT" | "THROW_CULPRIT";

export function grantThrowMag(state: PlayerState, kind: ThrowMagKind, amount: number, cap: number): number {
  const n = Math.max(0, Math.floor(amount));
  const bag = Math.max(1, Math.floor(cap));
  if (kind === "THROW_ADSORB") {
    state.throwAdsorbCap = Math.max(state.throwAdsorbCap ?? 0, bag);
    state.throwAdsorb = Math.min(state.throwAdsorbCap, (state.throwAdsorb ?? 0) + n);
    return state.throwAdsorb;
  }
  if (kind === "THROW_CULPRIT") {
    state.throwCulpritCap = Math.max(state.throwCulpritCap ?? 0, bag);
    state.throwCulprit = Math.min(state.throwCulpritCap, (state.throwCulprit ?? 0) + n);
    return state.throwCulprit;
  }
  state.throwInhibitCap = Math.max(state.throwInhibitCap ?? 0, bag);
  state.throwInhibit = Math.min(state.throwInhibitCap, (state.throwInhibit ?? 0) + n);
  return state.throwInhibit;
}

export function spendThrowMag(state: PlayerState, kind: ThrowMagKind, saveChance = 0): boolean {
  if (saveChance > 0 && Math.random() < saveChance) return true;
  if (kind === "THROW_ADSORB") {
    if ((state.throwAdsorb ?? 0) <= 0) return false;
    state.throwAdsorb -= 1;
    return true;
  }
  if (kind === "THROW_CULPRIT") {
    if ((state.throwCulprit ?? 0) <= 0) return false;
    state.throwCulprit -= 1;
    return true;
  }
  if ((state.throwInhibit ?? 0) > 0) {
    state.throwInhibit -= 1;
    return true;
  }
  return false;
}

export function refillThrowMags(state: PlayerState, frac = 0.25): void {
  const aCap = state.throwAdsorbCap ?? 0;
  const iCap = state.throwInhibitCap ?? 0;
  if (aCap > 0) state.throwAdsorb = Math.min(aCap, (state.throwAdsorb ?? 0) + Math.round(aCap * frac));
  if (iCap > 0) state.throwInhibit = Math.min(iCap, (state.throwInhibit ?? 0) + Math.round(iCap * frac));
}

export function addPurifyAmmo(state: PlayerState, amount: number): number {
  state.purifyAmmo = Math.max(0, (state.purifyAmmo ?? 0) + Math.max(0, amount));
  return state.purifyAmmo;
}

export function spendPurifyAmmo(state: PlayerState, amount: number): boolean {
  const need = Math.max(0, amount);
  if ((state.purifyAmmo ?? 0) < need) return false;
  state.purifyAmmo -= need;
  return true;
}

function blightAreaId(data: GameData, blight: PurifyBlightDef): string {
  if (blight.target_kind === "AREA") return blight.target_ref;
  const npc = data.areaNpcs.find((n) => n.trigger_type === "BLIGHT" && n.trigger_ref === blight.blight_id);
  return npc?.area_id ?? "";
}

/** 지금 이 지역에서 HUD에 보여줄 필요량 — 해금 → 생명 → 관문 순 */
export function currentAmmoNeed(data: GameData, state: PlayerState, areaId: string): number {
  if (!areaId) return 0;
  if (!state.purifiedAreas.includes(areaId)) return ammoCost(data, "AREA", 3);

  const life = data.purifyBlights.find(
    (b) =>
      b.target_kind === "LIFE" &&
      blightAreaId(data, b) === areaId &&
      !state.purifiedBlights.includes(b.blight_id),
  );
  if (life) return ammoCostForBlight(data, life);

  const gate = data.areaNpcs.find(
    (n) =>
      n.area_id === areaId &&
      (n.trigger_type === "MINIBOSS" || n.trigger_type === "BOSS") &&
      !state.clearedNodes.includes(n.npc_id),
  );
  if (gate) {
    return ammoCostForCombatTier(data, gate.trigger_type === "BOSS" ? "FINALBOSS" : "MINIBOSS");
  }

  const combat = data.areaNpcs.find(
    (n) => n.area_id === areaId && n.trigger_type === "COMBAT" && !state.clearedNodes.includes(n.npc_id),
  );
  if (combat) return ammoCostForCombatTier(data, "NORMAL");
  return 0;
}
