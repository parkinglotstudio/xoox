import values from '../../../data/tools/unit_lab/defense_balance.json';
import monsterValues from '../../../data/tools/unit_lab/defense_monsters.json';

/** Preview balance is data driven; this does not alter the original monster/tower assets. */
export const DEFENSE_BALANCE = values;
export interface MonsterTraits { role: string; hpMultiplier: number; speedMultiplier: number; damageMultiplier: number; attackIntervalMultiplier: number; armor: number; sector: number; }
export function traitsFor(id: string): MonsterTraits {
  const traits = (monsterValues.monsters as Record<string, MonsterTraits>)[id];
  if (!traits) throw new Error(`몬스터 개별 설정 누락: ${id}`);
  return traits;
}
export interface WeaponSpec { damage: number; interval: number; burst: number; spacing: number; range: number; velocity: number; splash: number; pierce: number; }
export function weaponFor(kind: string): WeaponSpec | undefined {
  return (DEFENSE_BALANCE.weapons as Record<string, WeaponSpec>)[kind];
}
