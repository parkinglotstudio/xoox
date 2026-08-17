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
  if (triggerType.toUpperCase() === "CATALYST") return ammoCost(data, "CATALYST", 2);
  return ammoCost(data, "FILL", 1);
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
