import { GameECS, EnemyBurn, SimulationTime, enemyBurnQuery } from "./ecs";
import { EnemyGrid } from "./spatial";
import {
  RescueNavigation,
  RESCUE_RADIUS,
  RESCUE_BLEED_RATE,
  RESCUE_HEAL_RATE,
  RESCUE_MAX_HP,
  RESCUE_FIRST_SPAWN,
  RESCUE_INTERVAL_MIN,
  RESCUE_INTERVAL_MAX,
  type InjuredSurvivor,
} from "./rescue";
import { SURVIVOR_PALETTES } from "./survivor-model";
import { normalizeResearch, type ResearchLevels } from "./research";
import {
  BUILDING_LAYOUT,
  createBuildings,
  createVehicles,
  createBarriers,
  createBoundary,
  isDestructible,
  MAP_LIMIT,
  segmentCircleHit,
  pushOut,
  VEHICLE_BURN_SECONDS,
  contains,
  segmentHit,
  lineOfSight,
  fogIndex,
  FOG_MIN,
  FOG_CELL,
  FOG_SIZE,
  SIGHT_RADIUS,
  closestPoint,
  type Building,
} from "./terrain";
export type Weapon =
  | "pistol"
  | "shotgun"
  | "orbit"
  | "molotov"
  | "lightning"
  | "frost"
  | "katana"
  | "sniper"
  | "flamethrower";
export type Passive =
  | "power"
  | "haste"
  | "boots"
  | "magnet"
  | "armor"
  | "vitality"
  | "pierce"
  | "experience"
  | "range"
  | "area"
  | "multishot";
export type UpgradeId = Weapon | Passive;
export type Phase =
  "menu" | "playing" | "paused" | "upgrade" | "victory" | "dead";
export type EnemyKind =
  "walker" | "runner" | "brute" | "spitter" | "charger" | "elite" | "boss";
export interface Vec {
  x: number;
  z: number;
}
export interface Enemy extends Vec {
  id: number;
  kind: EnemyKind;
  hp: number;
  maxHp: number;
  speed: number;
  radius: number;
  damage: number;
  xp: number;
  attack: number;
  rangedCooldown?: number;
  slow: number;
  flash: number;
  angle: number;
  bossIndex: number;
  spawnedAt: number;
  chargeTime: number;
  chargeX: number;
  chargeZ: number;
  sieging: number;
}
export interface MolotovFlight {
  start: Vec;
  end: Vec;
  duration: number;
  elapsed: number;
  fireRadius: number;
  fireLife: number;
}
export function molotovHeight(flight: MolotovFlight) {
  const t = clamp(flight.elapsed / flight.duration, 0, 1);
  const length = Math.hypot(
    flight.end.x - flight.start.x,
    flight.end.z - flight.start.z,
  );
  return (
    0.9 * (1 - t) +
    0.16 * t +
    4 * t * (1 - t) * (1.3 + Math.min(24, length) * 0.075)
  );
}
export interface Bullet extends Vec {
  id: number;
  vx: number;
  vz: number;
  life: number;
  damage: number;
  radius: number;
  pierceChance: number;
  type: Weapon | "acid";
  hit: Set<number>;
  volleyHits?: Map<number, number>;
  flight?: MolotovFlight;
}
export interface Drop extends Vec {
  id: number;
  value: number;
  type: "xp" | "heal" | "chest" | "magnet";
  age: number;
  attracted?: boolean;
  pullSpeed?: number;
}
export interface Effect extends Vec {
  id: number;
  type:
    | "fire"
    | "blast"
    | "spark"
    | "ring"
    | "warning"
    | "damage"
    | "slash"
    | "flamecone";
  life: number;
  maxLife: number;
  radius: number;
  damage: number;
  tick: number;
  color: string;
  end?: Vec;
  angle?: number;
  arc?: number;
}
export interface Obstacle extends Vec {
  w: number;
  d: number;
}
export interface Character {
  id: string;
  name: string;
  role: string;
  desc: string;
  weapon: Weapon;
  hp: number;
  speed: number;
  color: string;
  perk: string;
}
export const CHARACTERS: Character[] = [
  {
    id: "scout",
    name: "강하나",
    role: "정찰병",
    desc: "빠른 이동으로 포위망을 돌파합니다.",
    weapon: "pistol",
    hp: 110,
    speed: 8.8,
    color: SURVIVOR_PALETTES.scout.jacket,
    perk: "이동 속도 +10%",
  },
  {
    id: "engineer",
    name: "박도윤",
    role: "공병",
    desc: "화염 지대를 만들어 무리를 차단합니다.",
    weapon: "molotov",
    hp: 130,
    speed: 7.8,
    color: SURVIVOR_PALETTES.engineer.jacket,
    perk: "체력 +20",
  },
  {
    id: "medic",
    name: "서유진",
    role: "의무병",
    desc: "적을 얼리고 생존의 틈을 만듭니다.",
    weapon: "frost",
    hp: 120,
    speed: 8,
    color: SURVIVOR_PALETTES.medic.jacket,
    perk: "초당 체력 재생 +0.4",
  },
];
export const WEAPONS: Record<
  Weapon,
  {
    name: string;
    desc: string;
    color: string;
    evolution: string;
    partner: Passive;
    icon: string;
  }
> = {
  katana: {
    name: "카타나",
    desc: "조준 방향으로 넓게 휘둘러 근접한 적을 베어냅니다.",
    color: "#dce9df",
    evolution: "월광",
    partner: "power",
    icon: "katana",
  },
  sniper: {
    name: "저격총",
    desc: "조준선을 따라 긴 사거리의 강력한 탄환을 발사합니다. 느린 재장전.",
    color: "#f1d796",
    evolution: "롱샷",
    partner: "range",
    icon: "sniper",
  },
  flamethrower: {
    name: "화염방사기",
    desc: "짧고 넓은 화염으로 다수를 타격하고 최대 8중첩 연소를 남깁니다.",
    color: "#f59b51",
    evolution: "헬파이어",
    partner: "haste",
    icon: "flame",
  },
  pistol: {
    name: "서비스 피스톨",
    desc: "마우스 방향으로 탄환을 자동 발사합니다.",
    color: "#ffbe69",
    evolution: "데드아이",
    partner: "power",
    icon: "crosshair",
  },
  shotgun: {
    name: "산탄총",
    desc: "넓은 부채꼴 사격으로 가까운 적을 밀어냅니다.",
    color: "#ed965c",
    evolution: "브리치 캐논",
    partner: "haste",
    icon: "shell",
  },
  orbit: {
    name: "회전 톱날",
    desc: "주위를 도는 톱날이 접근하는 적을 절단합니다.",
    color: "#d2dfc2",
    evolution: "아이언 헤일로",
    partner: "armor",
    icon: "disc",
  },
  molotov: {
    name: "화염병",
    desc: "조준한 방향에 화염병을 던져 지속 피해 지대를 만듭니다.",
    color: "#ef7a42",
    evolution: "지옥불",
    partner: "vitality",
    icon: "flame",
  },
  lightning: {
    name: "테슬라 코일",
    desc: "여러 적에게 연쇄하는 전기 충격을 가합니다.",
    color: "#77dfd3",
    evolution: "폭풍 회로",
    partner: "magnet",
    icon: "zap",
  },
  frost: {
    name: "냉각 펄스",
    desc: "전방위 냉기 탄환으로 적을 느리게 만듭니다.",
    color: "#a3d7ed",
    evolution: "절대영도",
    partner: "boots",
    icon: "snowflake",
  },
};
export const WEAPON_BASE_DAMAGE: Record<Weapon, number> = {
  pistol: 23,
  shotgun: 14,
  orbit: 9,
  molotov: 14,
  lightning: 31,
  frost: 23,
  katana: 54,
  sniper: 270,
  flamethrower: 6,
};
export const WEAPON_BASE_COOLDOWN: Record<Weapon, number> = {
  pistol: 0.72,
  shotgun: 1.75,
  orbit: 0.4,
  molotov: 3.4,
  lightning: 2.5,
  frost: 2.7,
  katana: 0.95,
  sniper: 3.8,
  flamethrower: 0.2,
};
export const WEAPON_EVOLUTION_DAMAGE: Record<Weapon, number> = {
  pistol: 1.35,
  shotgun: 1.25,
  orbit: 1.25,
  molotov: 1.4,
  lightning: 1.25,
  frost: 1.3,
  katana: 1.55,
  sniper: 1.5,
  flamethrower: 1,
};
export const PASSIVES: Record<
  Passive,
  { name: string; desc: string; icon: string }
> = {
  experience: {
    name: "전투 학습",
    desc: "경험치 획득량 +12%",
    icon: "experience",
  },
  range: { name: "확장 사거리", desc: "무기 사거리 +15%", icon: "range" },
  area: {
    name: "확장 범위",
    desc: "화염병 반경·화염방사기 분사각 +20%",
    icon: "area",
  },
  multishot: {
    name: "추가 투사체",
    desc: "투사체 발사 수 +1 · 항상 희귀 · 최대 3단계",
    icon: "multishot",
  },
  pierce: {
    name: "관통 탄두",
    desc: "투사체 관통 확률 +10%p · 기본 0%",
    icon: "pierce",
  },
  power: { name: "고압 탄약", desc: "모든 무기의 피해량 +20%", icon: "swords" },
  haste: { name: "퀵 리로드", desc: "공격 주기 12% 단축", icon: "timer" },
  boots: { name: "전투화", desc: "이동 속도 +10%", icon: "footprints" },
  magnet: { name: "회수 장치", desc: "경험치 획득 반경 +2m", icon: "magnet" },
  armor: {
    name: "방탄 플레이트",
    desc: "받는 피해 12% 추가 감소 · 톱날 진화 조건",
    icon: "shield",
  },
  vitality: {
    name: "생존 키트",
    desc: "최대 체력 +30 · 초당 재생 +0.4",
    icon: "heart",
  },
};
export type Rarity = "common" | "uncommon" | "rare";
export const RARITIES = {
  common: { name: "일반", color: "#f2f2f2", multiplier: 1 },
  uncommon: { name: "고급", color: "#92e0a0", multiplier: 1.25 },
  rare: { name: "희귀", color: "#80b8ff", multiplier: 1.5 },
} as const;
export const rollRarity = (roll: number): Rarity =>
  roll < 0.7 ? "common" : roll < 0.95 ? "uncommon" : "rare";
export const MEDKIT_HEAL_FRACTION = 0.5;
export const ENEMY_PROJECTILE_RADIUS = 0.18;
export const ENEMY_FIRE_INTERVAL_MULTIPLIER = 2;
export const MAGNET_DROP_CHANCE = 0.006;
export const MAGNET_DROP_INTERVAL = 75;
const amount = (n: number) => Number(n.toFixed(1)).toString();
export function passiveGainDescription(p: Passive, rarity: Rarity = "common") {
  const m = RARITIES[rarity].multiplier;
  const descriptions: Record<Passive, string> = {
    experience: `경험치 획득량 +${amount(12 * m)}%`,
    range: `무기 사거리 +${amount(15 * m)}%`,
    area: `화염병 반경·화염방사기 분사각 +${amount(20 * m)}%`,
    multishot: "투사체 발사 수 +1 · 항상 희귀 · 최대 3단계",
    power: `모든 무기의 피해량 +${amount(20 * m)}%`,
    haste: `공격 주기 ${amount((1 - Math.pow(0.88, m)) * 100)}% 단축`,
    boots: `이동 속도 +${amount(10 * m)}%`,
    magnet: `경험치 획득 반경 +${amount(2 * m)}m`,
    armor: `받는 피해 ${amount((1 - Math.pow(0.88, m)) * 100)}% 추가 감소 · 톱날 진화 조건`,
    vitality: `최대 체력 +${amount(30 * m)} · 초당 재생 +${Number((0.4 * m).toFixed(3))}`,
    pierce: `투사체 관통 확률 +${amount(10 * m)}%p`,
  };
  return descriptions[p];
}
export const BOSS_SCHEDULE = [300, 600, 900, 1200, 1500, 1800] as const;
export const OPERATION_SECONDS = 1800;
export const MAX_WEAPON_SLOTS = 6;
export const BURN_MAX_STACKS = 8;
export const BURN_DURATION = 3.2;
export const BURN_TICK_INTERVAL = 0.5;
export interface BurnStatus<T extends Enemy | Building> {
  target: T;
  stacks: { expiresAt: number; damage: number }[];
  nextTick: number;
}
// Circles intersect the cone near its edge; geometry damage uses its nearest hull point.
export function inCone(
  origin: Vec,
  angle: number,
  radius: number,
  arc: number,
  point: Vec,
  padding = 0,
) {
  const dx = point.x - origin.x,
    dz = point.z - origin.z,
    dist = Math.hypot(dx, dz);
  if (dist > radius + padding) return false;
  if (dist < 0.001) return true;
  const diff = Math.atan2(
    Math.sin(Math.atan2(dx, dz) - angle),
    Math.cos(Math.atan2(dx, dz) - angle),
  );
  return Math.abs(diff) <= arc + Math.asin(Math.min(1, padding / dist));
}

export const BOSSES = [
  {
    name: "검역소 도살자",
    hp: 15000,
    color: "#a7b16d",
    shirt: "#7a5948",
    pattern: "방사 탄환",
  },
  {
    name: "감염 군주",
    hp: 58800,
    color: "#b7bf76",
    shirt: "#694758",
    pattern: "회전 산성탄",
  },
  {
    name: "철갑 파괴자",
    hp: 119600,
    color: "#9aabb3",
    shirt: "#535e64",
    pattern: "돌진과 엄폐 파괴",
  },
  {
    name: "포자 여왕",
    hp: 204000,
    color: "#c3aa86",
    shirt: "#77576b",
    pattern: "다중 오염 지대",
  },
  {
    name: "군체 폭군",
    hp: 287500,
    color: "#beb37c",
    shirt: "#865e40",
    pattern: "교차 탄막과 차저",
  },
  {
    name: "페이션트 제로",
    hp: 416000,
    color: "#d3c0a0",
    shirt: "#814d46",
    pattern: "나선 탄막과 연속 폭격",
  },
] as const;
export const STAGES = [
  ["첫 접촉", "거리 곳곳에서 감염자가 접근합니다."],
  ["달리는 그림자", "러너가 출현합니다. 계속 이동하세요."],
  ["철문을 넘어", "중장갑 브루트가 도로를 점거합니다."],
  ["오염된 비", "스피터의 산성 탄환을 피하세요."],
  ["포위망", "05:00에 첫 보스가 출현합니다."],
  ["도살자의 거리", "보스: 검역소 도살자 · 방사 탄환"],
  ["흩어진 잔해", "돌진하는 차저가 합류합니다."],
  ["검역 실패", "적의 체력과 밀도가 증가합니다."],
  ["붉은 경보", "정예 무리가 등장합니다."],
  ["수신 두절", "10:00에 두 번째 보스가 출현합니다."],
  ["변종의 군주", "보스: 감염 군주 · 회전 산성탄"],
  ["심야의 역습", "모든 감염체가 동시에 몰려옵니다."],
  ["끝없는 행렬", "무기 진화를 준비하세요."],
  ["찢어진 도로", "차저가 보급 경로를 차단합니다."],
  ["강철 경보", "15:00에 철갑 파괴자가 출현합니다."],
  ["철갑 파괴자", "보스: 철갑 파괴자 · 엄폐를 파괴하는 돌진"],
  ["여명의 틈", "빠른 감염체가 사방에서 진입합니다."],
  ["오염 통로", "스피터가 도로를 장악합니다."],
  ["강철비", "브루트와 정예가 방어선을 밀어냅니다."],
  ["포자 경보", "20:00에 포자 여왕이 출현합니다."],
  ["포자 여왕", "보스: 포자 여왕 · 다중 오염 지대"],
  ["무너진 엄폐", "남은 구조물을 지키며 이동하세요."],
  ["사냥의 시간", "러너와 차저가 퇴로를 봉쇄합니다."],
  ["정예 군단", "중장갑 정예 무리를 돌파하세요."],
  ["군체의 부름", "25:00에 군체 폭군이 출현합니다."],
  ["군체 폭군", "보스: 군체 폭군 · 교차 탄막과 차저"],
  ["사방의 적", "모든 감염체가 다시 집결합니다."],
  ["마지막 보급", "보급을 회수하고 최후의 교전을 준비하세요."],
  ["끝없는 추격", "차저와 정예가 계속 밀려옵니다."],
  ["제로 아워", "30:00에 페이션트 제로가 출현합니다."],
  ["최후의 교전", "보스 6명을 모두 처치해야 작전이 완료됩니다."],
] as const;
const EARLY_ROSTERS: EnemyKind[][] = [
  ["walker", "walker", "walker"],
  ["walker", "walker", "runner"],
  ["walker", "runner", "walker", "brute"],
  ["walker", "runner", "spitter", "walker"],
  ["walker", "brute", "runner", "spitter", "walker"],
  ["walker", "runner", "runner", "brute"],
  ["runner", "charger", "walker", "walker"],
  ["brute", "charger", "spitter", "walker", "runner"],
  ["walker", "walker", "runner", "spitter", "brute", "elite"],
  ["runner", "runner", "charger", "spitter", "walker"],
  ["brute", "spitter", "walker", "runner", "walker"],
  ["walker", "runner", "brute", "spitter", "charger"],
  ["spitter", "spitter", "charger", "runner", "walker"],
  ["brute", "charger", "elite", "walker", "runner", "walker"],
  ["walker", "runner", "brute", "spitter", "charger", "elite", "walker"],
];
const LATE_ROSTERS: EnemyKind[][] = [
  ["brute", "charger", "walker", "runner"],
  ["runner", "runner", "charger", "walker"],
  ["spitter", "spitter", "brute", "walker"],
  ["brute", "brute", "elite", "runner", "walker"],
  ["spitter", "charger", "elite", "walker"],
  ["spitter", "runner", "brute", "walker", "charger"],
  ["brute", "elite", "walker", "charger"],
  ["runner", "runner", "charger", "charger", "walker"],
  ["elite", "brute", "elite", "walker", "runner"],
  ["spitter", "charger", "elite", "brute", "walker"],
  ["charger", "runner", "spitter", "brute", "walker"],
  ["walker", "runner", "brute", "spitter", "charger", "elite"],
  ["walker", "walker", "spitter", "runner", "brute"],
  ["charger", "charger", "elite", "walker", "runner"],
  ["brute", "spitter", "elite", "runner", "walker"],
  ["walker", "runner", "brute", "spitter", "charger", "elite", "walker"],
];
export const WAVE_ROSTERS: EnemyKind[][] = [...EARLY_ROSTERS, ...LATE_ROSTERS];
export const OBSTACLES = BUILDING_LAYOUT;
export const xpForLevel = (level: number) =>
  Math.floor(12 + level * 7 + level ** 1.7 * 1.25);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const distance2 = (a: Vec, b: Vec) => (a.x - b.x) ** 2 + (a.z - b.z) ** 2;
export const timeText = (s: number) => {
  // Match schedule-boundary tolerance; floating point drift must not show
  // 04:59 in the frame whose simulation time has reached the 05:00 event.
  const whole = Math.max(0, Math.floor(s + 1e-7));
  return `${Math.floor(whole / 60)
    .toString()
    .padStart(2, "0")}:${(whole % 60).toString().padStart(2, "0")}`;
};
export interface Input {
  x: number;
  y: number;
  dash: boolean;
  pulse: boolean;
  aim?: Vec;
  pointer?: { x: number; y: number };
  dashPointer?: { x: number; y: number };
  dashTarget?: Vec;
}
export interface Upgrade {
  id: UpgradeId | "heal";
  title: string;
  description: string;
  level: number;
  evolution: boolean;
  rarity?: Rarity;
}
export class Game {
  phase: Phase = "menu";
  time = 0;
  kills = 0;
  level = 1;
  xp = 0;
  nextXp = 12;
  hp = 110;
  maxHp = 110;
  character = CHARACTERS[0];
  readonly ecs = new GameECS();
  get player() {
    return this.ecs.player;
  }
  set player(position: Vec) {
    this.ecs.player = position;
  }
  get enemies() {
    return this.ecs.enemies.read();
  }
  set enemies(records: readonly Enemy[]) {
    this.ecs.enemies.replace(records);
  }
  get bullets() {
    return this.ecs.projectiles.read();
  }
  set bullets(records: readonly Bullet[]) {
    this.ecs.projectiles.replace(records);
  }
  get drops() {
    return this.ecs.pickups.read();
  }
  set drops(records: readonly Drop[]) {
    this.ecs.pickups.replace(records);
  }
  get effects() {
    return this.ecs.effects.read();
  }
  set effects(records: readonly Effect[]) {
    this.ecs.effects.replace(records);
  }
  addEnemies(...records: Enemy[]) {
    this.ecs.enemies.add(...records);
  }
  addBullets(...records: Bullet[]) {
    this.ecs.projectiles.add(...records);
  }
  addDrops(...records: Drop[]) {
    this.ecs.pickups.add(...records);
  }
  addEffects(...records: Effect[]) {
    this.ecs.effects.add(...records);
  }
  get survivors() {
    return this.ecs.survivors.read();
  }
  set survivors(records: readonly InjuredSurvivor[]) {
    this.ecs.survivors.replace(records);
  }
  rescued = 0;
  survivorsLost = 0;
  nextRescueAt = RESCUE_FIRST_SPAWN;
  onRescue?: () => void;
  private rescueNavigation = new RescueNavigation();
  private leases = 0;
  retain() {
    this.leases++;
  }
  release() {
    this.leases--;
    queueMicrotask(() => {
      if (this.leases === 0) this.dispose();
    });
  }
  dispose() {
    this.enemyBurns.clear();
    this.structureBurns.clear();
    this.ecs.dispose();
  }
  facing = 0;
  motion = 0;
  invincible = 0;
  dashTime = 0;
  private dashDirection?: Vec;
  dashCooldown = 0;
  pulseCooldown = 0;
  weapons: Partial<Record<Weapon, number>> = { pistol: 1 };
  passives: Partial<Record<Passive, number>> = {};
  passiveStrength: Partial<Record<Passive, number>> = {};
  evolved = new Set<Weapon>();
  choices: Upgrade[] = [];
  bossKills = 0;
  defeatedBosses = new Set<number>();
  runId = 0;
  bossesSpawned = 0;
  stage = 0;
  notice = "";
  noticeTime = 0;
  combo = 0;
  bestCombo = 0;
  comboTime = 0;
  crates = 0;
  damageDone = 0;
  difficulty: "normal" | "relaxed" = "normal";
  soundEvents: string[] = [];
  seed = 7241;
  private seq = 0;
  private spawnClock = 0;
  private lootClock = 0;
  private eliteClock = 0;
  private cooldowns: Partial<Record<Weapon, number>> = {};
  private grid = new EnemyGrid();
  private moveOld: Vec = { x: 0, z: 0 };
  private moveEnd: Vec = { x: 0, z: 0 };
  private pendingDrops: Drop[] = [];
  private fireDamage = new Map<Enemy, number>();
  private coverFireDamage = new Map<Building, number>();
  private contactPool: { e: Enemy; t: number }[] = [];
  private contacts: { e: Enemy; t: number }[] = [];
  private upgradesQueued = 0;
  private regenBonus = 0;
  research = 0;
  researchLevels: ResearchLevels = {};
  aim?: Vec;
  enemyBurns = new Map<number, BurnStatus<Enemy>>();
  structureBurns = new Map<number, BurnStatus<Building>>();
  buildings = createBuildings();
  vehicles = createVehicles();
  props = createBarriers();
  boundary = createBoundary();
  private structureInit = this.setInitialStructures();
  get structures() {
    return this.ecs.structures.read();
  }
  set structures(records: readonly Building[]) {
    this.ecs.structures.replace(records);
  }
  private setInitialStructures() {
    this.structures = [
      ...this.buildings,
      ...this.vehicles,
      ...this.props,
      ...this.boundary,
    ];
    return true;
  }
  explored = new Uint8Array(FOG_SIZE * FOG_SIZE);
  visible = new Uint8Array(FOG_SIZE * FOG_SIZE);
  visionVersion = 0;
  buildingsVersion = 0;
  suppliesSpawned = 0;
  healsDropped = 0;
  damageTaken = 0;
  dashesUsed = 0;
  pulsesUsed = 0;
  private visionClock = 0;
  private nextMagnetAt = 0;
  private nextHealAt = 35;
  private fireClock = 0;

  constructor(seed = 7241) {
    this.ecs.world.onRemove(EnemyBurn, (entity) => {
      const burn = entity.get(EnemyBurn);
      if (burn) this.enemyBurns.delete(burn.target.id);
    });
    void this.structureInit;
    this.seed = seed;
    this.preview();
  }
  random() {
    this.seed = (Math.imul(1664525, this.seed) + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }
  private id() {
    return ++this.seq;
  }
  preview() {
    this.enemies = [];
    for (let i = 0; i < 26; i++) {
      const a = this.random() * Math.PI * 2,
        r = 6 + this.random() * 18;
      this.spawnEnemy("walker", Math.cos(a) * r, Math.sin(a) * r);
    }
    this.drops = Array.from({ length: 20 }, () => ({
      id: this.id(),
      x: (this.random() - 0.5) * 30,
      z: (this.random() - 0.5) * 30,
      value: 1,
      type: "xp",
      age: 0,
    }));
  }
  start(
    character: Character,
    difficulty: "normal" | "relaxed",
    research: number | ResearchLevels = 0,
  ) {
    this.phase = "playing";
    this.runId++;
    this.character = character;
    this.difficulty = difficulty;
    this.researchLevels = normalizeResearch(
      typeof research === "number" ? {} : research,
      typeof research === "number" ? research : 0,
    );
    this.research = this.researchLevels.protocol || 0;
    this.aim = undefined;
    this.enemyBurns.clear();
    this.structureBurns.clear();
    this.time = 0;
    this.ecs.world.set(SimulationTime, { delta: 0, elapsed: 0 });
    this.kills = 0;
    this.level = 1;
    this.xp = 0;
    this.nextXp = 12;
    this.maxHp = character.hp + this.research * 5;
    this.hp = this.maxHp;
    this.player = { x: 0, z: 0 };
    this.weapons = { [character.weapon]: 1 };
    this.passives = {};
    this.passiveStrength = {};
    this.evolved.clear();
    this.enemies = [];
    this.bullets = [];
    this.drops = [];
    this.effects = [];
    this.choices = [];
    this.cooldowns = {};
    this.spawnClock = 0;
    this.lootClock = 0;
    this.eliteClock = 0;
    this.upgradesQueued = 0;
    this.bossKills = 0;
    this.defeatedBosses.clear();
    this.bossesSpawned = 0;
    this.stage = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.damageDone = 0;
    this.crates = 0;
    this.survivors = [];
    this.rescued = 0;
    this.survivorsLost = 0;
    this.nextRescueAt = RESCUE_FIRST_SPAWN;
    this.dashCooldown = 0;
    this.pulseCooldown = 0;
    this.invincible = 1;
    this.dashTime = 0;
    this.dashDirection = undefined;
    this.motion = 0;
    this.facing = 0;
    this.soundEvents = [];
    this.buildings = createBuildings();
    this.vehicles = createVehicles();
    this.props = createBarriers();
    this.boundary = createBoundary();
    this.structures = [
      ...this.buildings,
      ...this.vehicles,
      ...this.props,
      ...this.boundary,
    ];
    this.buildingsVersion++;
    this.explored.fill(0);
    this.visible.fill(0);
    this.visionClock = 0;
    this.nextHealAt = 35;
    this.nextMagnetAt = 0;
    this.fireClock = 0;
    this.suppliesSpawned = 0;
    this.healsDropped = 0;
    this.damageTaken = 0;
    this.dashesUsed = 0;
    this.pulsesUsed = 0;
    this.updateVision();
    this.regenBonus = character.id === "medic" ? 0.4 : 0;
    this.announce(STAGES[0][1]);
  }
  announce(text: string) {
    this.notice = text;
    this.noticeTime = 5;
  }
  private sound(name: string) {
    if (this.soundEvents.length < 10) this.soundEvents.push(name);
  }
  private nearby(p: Vec, r: number) {
    return this.grid.nearby(p, r);
  }
  private rebuildGrid() {
    this.grid.rebuild(this.enemies);
  }
  private nearest(p: Vec, r = 28) {
    let nearest: Enemy | undefined,
      d = r * r;
    for (const e of this.enemies) {
      if (e.hp <= 0 || !this.canSee(e) || !lineOfSight(p, e, this.structures))
        continue;
      const ds = distance2(p, e);
      if (ds < d) {
        nearest = e;
        d = ds;
      }
    }
    return nearest;
  }
  canSee(p: Vec) {
    return (
      this.phase === "menu" ||
      (distance2(this.player, p) <= SIGHT_RADIUS ** 2 &&
        lineOfSight(this.player, p, this.buildings))
    );
  }
  hasExplored(p: Vec) {
    const i = fogIndex(p);
    return i >= 0 && this.explored[i] > 0;
  }
  updateVision() {
    this.visible.fill(0);
    const cx = Math.floor((this.player.x - FOG_MIN) / FOG_CELL);
    const cz = Math.floor((this.player.z - FOG_MIN) / FOG_CELL);
    const cells = Math.ceil(SIGHT_RADIUS / FOG_CELL);
    for (
      let z = Math.max(0, cz - cells);
      z <= Math.min(FOG_SIZE - 1, cz + cells);
      z++
    ) {
      for (
        let x = Math.max(0, cx - cells);
        x <= Math.min(FOG_SIZE - 1, cx + cells);
        x++
      ) {
        const p = {
          x: FOG_MIN + (x + 0.5) * FOG_CELL,
          z: FOG_MIN + (z + 0.5) * FOG_CELL,
        };
        if (
          distance2(this.player, p) <= SIGHT_RADIUS ** 2 &&
          lineOfSight(this.player, p, this.buildings, true)
        ) {
          const i = z * FOG_SIZE + x;
          this.visible[i] = 255;
          this.explored[i] = 255;
        }
      }
    }
    this.visionVersion++;
  }
  damageBuilding(b: Building, damage: number) {
    if (!isDestructible(b) || b.hp <= 0) return;
    b.hp = Math.max(0, b.hp - damage);
    b.flash = 0.12;
    if (b.hp === 0) {
      b.collapsedAt = this.time;
      this.buildingsVersion++;
      this.visionClock = 0;
      if (b.kind === "vehicle") {
        b.burningAt = this.time;
        this.effect("warning", b, 3.4, 1.2, "#f0a35e", 18);
        this.sound("fire");
        this.announce("차량 화재 · 불타는 잔해에서 떨어지세요.");
      } else {
        this.effect("blast", b, b.kind === "building" ? 8 : 2, 0.9, "#a9987d");
        this.sound("collapse");
        if (distance2(b, this.player) < 500)
          this.announce(
            b.kind === "building"
              ? "건물 붕괴 · 엄폐와 시야 차단이 사라졌습니다."
              : "장애물 파괴 · 통로가 열렸습니다.",
          );
      }
    }
  }
  private move(p: Vec, dx: number, dz: number, r = 0.45) {
    let blocked: Building | undefined;
    // Resolve along each axis against the entry face, never the final point's
    // side. Even a long dash stops at the wall and slides along it.
    for (let i = 0; i < 2; i++) {
      const axis = i === 0 ? "x" : "z";
      const old = this.moveOld;
      old.x = p.x;
      old.z = p.z;
      const step = axis === "x" ? dx : dz;
      const end = this.moveEnd;
      end.x = p.x;
      end.z = p.z;
      end[axis] = clamp(p[axis] + step, -MAP_LIMIT + r, MAP_LIMIT - r);
      let nearest = 1;
      for (const b of this.structures) {
        if (contains(b, old, r)) {
          Object.assign(p, pushOut(b, p, r));
          return b;
        }
        const t = segmentHit(old, end, b, r);
        if (t !== null && t < nearest) {
          nearest = Math.max(0, t - 0.0001);
          blocked = b;
        }
      }
      p[axis] = old[axis] + (end[axis] - old[axis]) * nearest;
    }
    return blocked;
  }
  spawnEnemy(kind: EnemyKind, x?: number, z?: number, bossIndex = 0) {
    if (this.enemies.length >= 520) {
      if (kind !== "boss") return;
      let farthest: Enemy | undefined;
      let dist = -1;
      for (const e of this.enemies) {
        if (e.kind === "boss") continue;
        const d = distance2(e, this.player);
        if (d > dist) {
          dist = d;
          farthest = e;
        }
      }
      if (farthest) this.ecs.enemies.remove(farthest);
    }
    if (x === undefined || z === undefined) {
      const a = this.random() * Math.PI * 2,
        r = 22 + this.random() * 8;
      x = clamp(this.player.x + Math.cos(a) * r, -63, 63);
      z = clamp(this.player.z + Math.sin(a) * r, -63, 63);
    }
    const data: Record<EnemyKind, number[]> = {
      walker: [20, 1.85, 0.43, 10, 1],
      runner: [16, 4.5, 0.36, 9, 2],
      brute: [100, 1.25, 0.78, 18, 6],
      spitter: [38, 1.7, 0.45, 12, 3],
      charger: [65, 2.7, 0.55, 24, 4],
      elite: [280, 2.4, 0.85, 24, 12],
      boss: [
        BOSSES[bossIndex].hp,
        2.2 + bossIndex * 0.15,
        1.55,
        32 + bossIndex * 6,
        70,
      ],
    };
    const [health, speed, radius, damage, xp] = data[kind],
      scaling = 1 + this.time / 200 + Math.max(0, this.time - 480) / 260;
    const hp =
      health *
      (kind === "boss" ? 1 : scaling) *
      (this.difficulty === "relaxed" ? 0.8 : 1);
    const e: Enemy = {
      id: this.id(),
      x,
      z,
      kind,
      hp,
      maxHp: hp,
      speed: speed * (1 + this.time / 3600),
      radius,
      damage,
      xp,
      attack: 2 + this.random() * 3,
      slow: 0,
      flash: 0,
      angle: 0,
      bossIndex,
      spawnedAt: kind === "boss" ? BOSS_SCHEDULE[bossIndex] : this.time,
      chargeTime: 0,
      chargeX: 0,
      chargeZ: 0,
      sieging: 0,
    };
    this.move(e, 0, 0, radius);
    this.addEnemies(e);
  }
  private effect(
    type: Effect["type"],
    p: Vec,
    radius: number,
    life: number,
    color: string,
    damage = 0,
    end?: Vec,
  ) {
    // Fire zones and damaging warnings own gameplay state. A cosmetic
    // budget must never cancel an attack or a telegraphed hazard. Their
    // count is bounded by weapon cooldowns, durations and boss schedules.
    const gameplay = type === "fire" || (type === "warning" && damage > 0);
    if (this.effects.length >= 250 && !gameplay) return;
    const effect: Effect = {
      id: this.id(),
      x: p.x,
      z: p.z,
      type,
      life,
      maxLife: life,
      radius,
      damage,
      tick: 0,
      color,
      end,
    };
    this.addEffects(effect);
    return effect;
  }
  private hit(e: Enemy, damage: number, slow = 0, source?: Weapon | "pulse") {
    if (e.hp <= 0) return;
    if (
      e.kind === "boss" &&
      (source === "orbit" ||
        source === "molotov" ||
        source === "frost" ||
        source === "flamethrower")
    )
      damage *= 0.55;
    e.hp -= damage;
    e.flash = 0.12;
    e.slow = Math.max(e.slow, slow);
    this.damageDone += damage;
    if (e.hp <= 0) {
      this.kills++;
      this.combo++;
      this.comboTime = 2.5;
      this.bestCombo = Math.max(this.bestCombo, this.combo);
      this.drop(e, "xp", e.xp);
      // Elite kills give XP, not unlimited free upgrades or recovery.
      if (e.kind === "boss") {
        this.bossKills++;
        this.defeatedBosses.add(e.bossIndex);
        this.drop(e, "chest", 1);
        this.drop({ x: e.x + 1, z: e.z }, "heal", MEDKIT_HEAL_FRACTION);
        this.announce(
          `${BOSSES[e.bossIndex].name} 처치 · ${this.bossKills}/6 보스 격파`,
        );
        this.sound("boss");
      }
      if (this.time >= this.nextHealAt && this.random() < 0.025) {
        this.drop(e, "heal", MEDKIT_HEAL_FRACTION);
        this.nextHealAt = this.time + 60;
        this.healsDropped++;
      }
      if (
        this.time >= this.nextMagnetAt &&
        this.drops.filter((d) => d.type === "magnet").length < 2 &&
        this.random() < MAGNET_DROP_CHANCE
      ) {
        this.drop(e, "magnet", 1);
        this.nextMagnetAt = this.time + MAGNET_DROP_INTERVAL;
      }
      this.effect("spark", e, 0.4, 0.25, "#b6d074");
    }
  }
  private drop(p: Vec, type: Drop["type"], value: number) {
    if (this.drops.length > 900 && type === "xp") {
      const d = this.drops.find((d) => d.type === "xp" && !d.attracted);
      if (d) {
        d.value += value;
        return;
      }
    }
    this.addDrops({ id: this.id(), x: p.x, z: p.z, value, type, age: 0 });
  }
  private projectile(
    p: Vec,
    angle: number,
    speed: number,
    damage: number,
    radius: number,
    life: number,
    type: Bullet["type"],
    volleyHits?: Map<number, number>,
  ) {
    if (this.bullets.length >= 700) return;
    this.addBullets({
      id: this.id(),
      x: p.x,
      z: p.z,
      vx: Math.sin(angle) * speed,
      vz: Math.cos(angle) * speed,
      damage,
      radius,
      life,
      pierceChance: type === "acid" ? 0 : this.pierceChance(),
      type,
      hit: new Set(),
      volleyHits,
    });
  }
  passiveValue(p: Passive) {
    return this.passiveStrength[p] ?? this.passives[p] ?? 0;
  }
  pierceChance() {
    return Math.min(0.75, this.passiveValue("pierce") * 0.1);
  }
  rangeScale() {
    return 1 + this.passiveValue("range") * 0.15;
  }
  areaScale() {
    return 1 + this.passiveValue("area") * 0.2;
  }
  flameRange(level = this.weapons.flamethrower || 1) {
    return (
      (5 + level * 0.25 + (this.evolved.has("flamethrower") ? 1 : 0)) *
      this.rangeScale()
    );
  }
  flameArc() {
    return Math.min(
      Math.PI / 3,
      (this.evolved.has("flamethrower") ? 0.44 : 0.32) * this.areaScale(),
    );
  }
  molotovRadius(level = this.weapons.molotov || 1) {
    return (2.63 + (level - 1) * 0.3) * this.areaScale();
  }
  weaponDamage(w: Weapon, level = this.weapons[w] || 1) {
    return (
      WEAPON_BASE_DAMAGE[w] *
      Math.pow(1.3, level - 1) *
      this.damageScale() *
      (this.evolved.has(w) ? WEAPON_EVOLUTION_DAMAGE[w] : 1)
    );
  }
  weaponCooldown(w: Weapon, level = this.weapons[w] || 1) {
    const interval =
      WEAPON_BASE_COOLDOWN[w] *
      Math.pow(0.88, this.passiveValue("haste")) *
      Math.pow(0.94, level - 1) *
      (this.evolved.has(w) ? 0.85 : 1);
    return w === "flamethrower" ? Math.max(0.08, interval) : interval;
  }
  weaponUpgradeDescription(w: Weapon, nextLevel: number) {
    if (nextLevel === 1) return WEAPONS[w].desc;
    const before = nextLevel - 1;
    const hit = `피해 ${amount(this.weaponDamage(w, before))} → ${amount(this.weaponDamage(w, nextLevel))}`;
    const cadence = `주기 ${this.weaponCooldown(w, before).toFixed(2)} → ${this.weaponCooldown(w, nextLevel).toFixed(2)}초`;
    const changes: Partial<Record<Weapon, string>> = {
      pistol: `탄환 ${1 + Math.floor(before / 3) + this.extraProjectiles()} → ${1 + Math.floor(nextLevel / 3) + this.extraProjectiles()}발`,
      shotgun: `산탄 ${4 + before + this.extraProjectiles()} → ${4 + nextLevel + this.extraProjectiles()}발`,
      orbit: `톱날 ${2 + Math.floor(before / 2)} → ${2 + Math.floor(nextLevel / 2)}개`,
      lightning: `연쇄 ${3 + before} → ${3 + nextLevel}회`,
      frost: `냉기 ${8 + before * 2 + this.extraProjectiles()} → ${8 + nextLevel * 2 + this.extraProjectiles()}발`,
      molotov: `반경 ${amount(this.molotovRadius(before))} → ${amount(this.molotovRadius(nextLevel))}m`,
      katana: `베기 ${amount((3 + before * 0.22) * this.rangeScale())} → ${amount((3 + nextLevel * 0.22) * this.rangeScale())}m`,
      sniper: `사거리 ${amount((43 + before * 2) * this.rangeScale())} → ${amount((43 + nextLevel * 2) * this.rangeScale())}m`,
      flamethrower: `연소 ${amount(7 * Math.pow(1.3, before - 1) * this.damageScale())} → ${amount(7 * Math.pow(1.3, nextLevel - 1) * this.damageScale())}/틱`,
    };
    if (w === "pistol" && Math.floor(before / 3) === Math.floor(nextLevel / 3))
      delete changes.pistol;
    if (w === "orbit" && Math.floor(before / 2) === Math.floor(nextLevel / 2))
      delete changes.orbit;
    return [
      hit,
      ...(this.weaponCooldown(w, before) !== this.weaponCooldown(w, nextLevel)
        ? [cadence]
        : []),
      changes[w],
    ]
      .filter(Boolean)
      .join(" · ");
  }
  private passiveApplies(p: Passive) {
    if (p === "area")
      return !!(this.weapons.molotov || this.weapons.flamethrower);
    if (p === "pierce")
      return ["pistol", "shotgun", "sniper", "frost"].some(
        (w) => !!this.weapons[w as Weapon],
      );
    if (p === "multishot")
      return ["pistol", "shotgun", "sniper", "frost", "molotov"].some(
        (w) => !!this.weapons[w as Weapon],
      );
    return true;
  }
  extraProjectiles() {
    return Math.floor(this.passiveValue("multishot"));
  }
  xpScale() {
    return (
      1 +
      this.passiveValue("experience") * 0.12 +
      (this.researchLevels.experience || 0) * 0.05
    );
  }
  aimAngle() {
    return this.aim && distance2(this.aim, this.player) > 0.01
      ? Math.atan2(this.aim.x - this.player.x, this.aim.z - this.player.z)
      : this.facing;
  }
  sniperRange() {
    return (
      (43 +
        (this.weapons.sniper || 1) * 2 +
        (this.evolved.has("sniper") ? 10 : 0)) *
      this.rangeScale()
    );
  }
  private coverEnd(point: Vec, radius = 0) {
    let t = 1;
    for (const wall of this.structures) {
      const hit = segmentHit(this.player, point, wall, radius);
      if (hit !== null) t = Math.min(t, hit);
    }
    return {
      x: this.player.x + (point.x - this.player.x) * t,
      z: this.player.z + (point.z - this.player.z) * t,
    };
  }
  aimEnd(radius: number) {
    const a = this.aimAngle();
    return this.coverEnd({
      x: this.player.x + Math.sin(a) * radius,
      z: this.player.z + Math.cos(a) * radius,
    });
  }
  private addBurn<T extends Enemy | Building>(
    target: T,
    damage: number,
    pool: Map<number, BurnStatus<T>>,
  ) {
    if (target.hp <= 0) return;
    let status = pool.get(target.id);
    if (!status) {
      status = { target, stacks: [], nextTick: this.time + BURN_TICK_INTERVAL };
      pool.set(target.id, status);
      if (pool === this.enemyBurns) {
        const entity = this.ecs.enemies.entity(target as Enemy);
        entity?.add(EnemyBurn(status as BurnStatus<Enemy>));
      }
    }
    status.stacks = status.stacks.filter(
      (stack) => stack.expiresAt > this.time,
    );
    if (status.stacks.length >= BURN_MAX_STACKS) status.stacks.shift();
    status.stacks.push({ expiresAt: this.time + BURN_DURATION, damage });
  }
  private updateBurns() {
    this.ecs.world.query(enemyBurnQuery).useStores(([, burns], entities) => {
      for (const entity of entities) {
        const burn = burns[entity.id()],
          id = burn.target.id;
        burn.stacks = burn.stacks.filter((s) => s.expiresAt > this.time);
        if (
          burn.target.hp > 0 &&
          burn.stacks.length &&
          this.time + 1e-7 >= burn.nextTick
        ) {
          this.hit(
            burn.target,
            burn.stacks.reduce((sum, s) => sum + s.damage, 0),
            0,
            "flamethrower",
          );
          burn.nextTick = this.time + BURN_TICK_INTERVAL;
        }
        if (burn.target.hp <= 0 || !burn.stacks.length) {
          entity.remove(EnemyBurn);
          this.enemyBurns.delete(id);
        }
      }
    });
    for (const [id, burn] of this.structureBurns) {
      burn.stacks = burn.stacks.filter((s) => s.expiresAt > this.time);
      if (burn.target.hp <= 0 || !burn.stacks.length) {
        this.structureBurns.delete(id);
        continue;
      }
      if (this.time + 1e-7 >= burn.nextTick) {
        this.damageBuilding(
          burn.target,
          burn.stacks.reduce((sum, s) => sum + s.damage, 0) * 0.3,
        );
        burn.nextTick = this.time + BURN_TICK_INTERVAL;
      }
      if (burn.target.hp <= 0) this.structureBurns.delete(id);
    }
  }
  private coneHit(
    angle: number,
    radius: number,
    arc: number,
    damage: number,
    source: "katana" | "flamethrower",
    burnDamage = 0,
  ) {
    for (const e of this.nearby(this.player, radius + 2)) {
      if (
        e.hp <= 0 ||
        !inCone(this.player, angle, radius, arc, e, e.radius) ||
        !lineOfSight(this.player, e, this.structures)
      )
        continue;
      this.hit(e, damage, 0, source);
      if (burnDamage > 0) this.addBurn(e, burnDamage, this.enemyBurns);
    }
    for (const wall of this.structures) {
      if (!isDestructible(wall) || wall.hp <= 0) continue;
      const point = closestPoint(wall, this.player);
      if (
        !inCone(this.player, angle, radius, arc, point) ||
        !lineOfSight(this.player, point, this.structures)
      )
        continue;
      this.damageBuilding(wall, damage * 0.3);
      if (burnDamage > 0) this.addBurn(wall, burnDamage, this.structureBurns);
    }
  }
  private damagePlayer(damage: number) {
    if (this.invincible > 0 || this.phase !== "playing") return;
    const received =
      damage *
      Math.max(0.3, Math.pow(0.88, this.passiveValue("armor"))) *
      (this.difficulty === "relaxed" ? 0.65 : 1);
    this.hp -= received;
    this.damageTaken += received;
    this.invincible = 0.65;
    this.sound("hurt");
    this.effect("damage", this.player, 1, 0.3, "#f57458");
    if (this.hp <= 0) {
      this.hp = 0;
      this.phase = "dead";
      this.sound("death");
    }
  }
  private damageScale() {
    return (
      (1 +
        this.passiveValue("power") * 0.2 +
        this.research * 0.025 +
        (this.researchLevels.damage || 0) * 0.03) *
      (this.difficulty === "relaxed" ? 1.15 : 1)
    );
  }
  private fire(w: Weapon) {
    const volleyHits = new Map<number, number>();
    const lv = this.weapons[w] || 1,
      ev = this.evolved.has(w),
      damage = this.damageScale(),
      hitDamage = this.weaponDamage(w),
      range = this.rangeScale(),
      extra = this.extraProjectiles(),
      target = w === "lightning" ? this.nearest(this.player) : undefined,
      angle = this.aimAngle();
    this.cooldowns[w] = this.weaponCooldown(w);
    if (w === "pistol") {
      for (let n = 0; n < (ev ? 4 : 1 + Math.floor(lv / 3)) + extra; n++)
        this.projectile(
          this.player,
          angle +
            (n - ((ev ? 4 : 1 + Math.floor(lv / 3)) + extra - 1) / 2) * 0.1,
          27,
          hitDamage,
          0.17,
          1.3 * range,
          w,
          volleyHits,
        );
      this.sound("shot");
    }
    if (w === "shotgun") {
      const count = 4 + lv + (ev ? 3 : 0) + extra;
      for (let i = 0; i < count; i++)
        this.projectile(
          this.player,
          angle + (i - (count - 1) / 2) * 0.09,
          22,
          hitDamage,
          0.2,
          (0.48 + lv * 0.025) * range,
          w,
          volleyHits,
        );
      this.sound("shotgun");
    }
    if (w === "orbit") {
      const count = 2 + Math.floor(lv / 2) + (ev ? 3 : 0),
        r = (2.4 + lv * 0.13) * range;
      const hit = new Set<number>();
      for (let i = 0; i < count; i++) {
        const a = this.time * 2.6 + (i * Math.PI * 2) / count,
          p = {
            x: this.player.x + Math.sin(a) * r,
            z: this.player.z + Math.cos(a) * r,
          };
        if (!lineOfSight(this.player, p, this.structures)) continue;
        for (const e of this.nearby(p, this.grid.maxRadius + (ev ? 1.1 : 0.7)))
          if (
            !hit.has(e.id) &&
            lineOfSight(p, e, this.structures) &&
            this.canSee(e) &&
            distance2(p, e) < (e.radius + (ev ? 1.1 : 0.7)) ** 2
          ) {
            hit.add(e.id);
            this.hit(e, hitDamage, 0, "orbit");
          }
      }
    }
    if (w === "molotov") {
      const count = (ev ? 3 : 1 + Math.floor(lv / 4)) + extra;
      const throwRange = Math.min(
        this.aim ? Math.sqrt(distance2(this.aim, this.player)) : 8,
        (8 + lv * 0.4) * range,
      );
      for (let i = 0; i < count; i++) {
        const a = angle + (i - (count - 1) / 2) * 0.12;
        const end = {
          x: this.player.x + Math.sin(a) * throwRange,
          z: this.player.z + Math.cos(a) * throwRange,
        };
        const duration = clamp(0.18 + throwRange / 14, 0.25, 1.45);
        // Molotovs share the Koota projectile pool. Their small cooldown-bound
        // count is independent of the ordinary bullet budget so saturation
        // cannot silently cancel a fire zone.
        this.addBullets({
          id: this.id(),
          x: this.player.x,
          z: this.player.z,
          vx: (end.x - this.player.x) / duration,
          vz: (end.z - this.player.z) / duration,
          life: duration,
          damage: hitDamage,
          radius: 0.12,
          pierceChance: 0,
          type: "molotov",
          hit: new Set(),
          flight: {
            start: { ...this.player },
            end,
            duration,
            elapsed: 0,
            fireRadius: this.molotovRadius(lv),
            fireLife: 3.6 + lv * 0.25,
          },
        });
      }
      this.sound("fire");
    }
    if (w === "katana") {
      const radius = (3 + lv * 0.22 + (ev ? 1 : 0)) * range,
        arc = ev ? Math.PI * 0.65 : Math.PI * 0.48;
      this.coneHit(angle, radius, arc, hitDamage, "katana");
      const fx = this.effect("slash", this.player, radius, 0.34, "#dce9df");
      if (fx?.type === "slash") {
        fx.angle = angle;
        fx.arc = arc;
      }
      this.sound("slash");
    }
    if (w === "sniper") {
      for (let i = 0; i < 1 + extra; i++)
        this.projectile(
          this.player,
          angle + (i - extra / 2) * 0.035,
          85,
          hitDamage,
          0.14,
          this.sniperRange() / 85,
          "sniper",
          volleyHits,
        );
      this.sound("sniper");
    }
    if (w === "flamethrower") {
      const radius = this.flameRange(lv),
        arc = this.flameArc();
      this.coneHit(
        angle,
        radius,
        arc,
        hitDamage,
        "flamethrower",
        7 * Math.pow(1.3, lv - 1) * damage * (ev ? 1.3 : 1),
      );
      const fx = this.effect("flamecone", this.player, radius, 0.22, "#f9a14f");
      if (fx?.type === "flamecone") {
        fx.angle = angle;
        fx.arc = arc;
      }
      this.sound("flame");
    }
    if (w === "lightning" && target) {
      let t: Enemy | undefined = target;
      const used = new Set<number>();
      let from: Vec = this.player;
      for (let i = 0; i < 3 + lv + (ev ? 6 : 0); i++) {
        if (!t) break;
        used.add(t.id);
        this.effect("spark", from, 0.15, 0.2, "#80ede0", 0, { x: t.x, z: t.z });
        this.hit(t, hitDamage, ev ? 1 : 0, "lightning");
        from = { x: t.x, z: t.z };
        let next: Enemy | undefined,
          ds = (10 * range) ** 2;
        for (const e of this.nearby(t, 10 * range)) {
          if (
            used.has(e.id) ||
            e.hp <= 0 ||
            !this.canSee(e) ||
            !lineOfSight(t, e, this.structures)
          )
            continue;
          const d = distance2(t, e);
          if (d < ds) {
            ds = d;
            next = e;
          }
        }
        t = next;
      }
      this.sound("zap");
    }
    if (w === "frost") {
      const n = 8 + lv * 2 + (ev ? 8 : 0) + extra;
      for (let i = 0; i < n; i++)
        this.projectile(
          this.player,
          this.time * 0.4 + (i * Math.PI * 2) / n,
          13,
          hitDamage,
          0.22,
          (1.25 + lv * 0.1) * range,
          w,
          volleyHits,
        );
      this.sound("ice");
    }
  }
  private gainXp(n: number) {
    this.xp += n * this.xpScale();
    while (this.xp >= this.nextXp) {
      this.xp -= this.nextXp;
      this.level++;
      this.nextXp = xpForLevel(this.level);
      this.upgradesQueued++;
    }
    if (this.upgradesQueued > 0 && this.phase === "playing") {
      this.offerUpgrades();
    }
  }
  private eligible() {
    const candidates: Upgrade[] = [];
    for (const w of Object.keys(WEAPONS) as Weapon[]) {
      const lv = this.weapons[w] || 0,
        m = WEAPONS[w];
      if (
        lv < 6 &&
        (lv > 0 || Object.keys(this.weapons).length < MAX_WEAPON_SLOTS)
      )
        candidates.push({
          id: w,
          title: m.name,
          description: this.weaponUpgradeDescription(w, lv + 1),
          level: lv + 1,
          evolution: false,
        });
      else if (
        lv === 6 &&
        !this.evolved.has(w) &&
        (this.passives[m.partner] || 0) >= 3
      )
        candidates.push({
          id: w,
          title: m.evolution,
          description: `${m.name} 진화 · 화력과 공격 범위 대폭 증가`,
          level: 7,
          evolution: true,
        });
    }
    for (const p of Object.keys(PASSIVES) as Passive[]) {
      const lv = this.passives[p] || 0;
      if (lv < (p === "multishot" ? 3 : 5) && this.passiveApplies(p))
        candidates.push({
          id: p,
          title: PASSIVES[p].name,
          description: PASSIVES[p].desc,
          level: lv + 1,
          evolution: false,
        });
    }
    return candidates;
  }
  private offerUpgrades() {
    const pool = this.eligible();
    const picks: Upgrade[] = [];
    const select = (candidates: Upgrade[]) => {
      if (!candidates.length) return;
      const pick = candidates[Math.floor(this.random() * candidates.length)];
      pool.splice(pool.indexOf(pick), 1);
      if (pick.id in PASSIVES) {
        const p = pick.id as Passive;
        pick.rarity = p === "multishot" ? "rare" : rollRarity(this.random());
        pick.description = passiveGainDescription(p, pick.rarity);
        if (p === "pierce")
          pick.description += ` · 총 ${amount(Math.min(0.75, (this.passiveValue(p) + RARITIES[pick.rarity].multiplier) * 0.1) * 100)}%`;
      }
      picks.push(pick);
    };
    // Draw without replacement from all eligible candidates. Owned weapons
    // and passives remain eligible but never reserve a card or a position.
    while (picks.length < 3 && pool.length) select(pool);
    if (picks.length < 3)
      picks.push({
        id: "heal",
        title: "응급 처치",
        description: "체력 40 회복 · 이 강화를 회복에 사용합니다.",
        level: 1,
        evolution: false,
      });
    this.choices = picks;
    this.phase = "upgrade";
    this.sound("level");
  }
  choose(index: number) {
    const u = this.choices[index];
    if (!u || this.phase !== "upgrade") return;
    // Reject stale or malformed cards: evolutions require an equipped rank-6 weapon.
    if (
      u.id !== "heal" &&
      !this.eligible().some(
        (candidate) =>
          candidate.id === u.id &&
          candidate.level === u.level &&
          candidate.evolution === u.evolution,
      )
    )
      return;
    if (u.id === "heal") this.hp = Math.min(this.maxHp, this.hp + 40);
    else if (u.id in WEAPONS) {
      const w = u.id as Weapon;
      if (u.evolution) {
        this.evolved.add(w);
        this.announce(`${WEAPONS[w].evolution} · 무기 진화 완료`);
        this.sound("evolve");
      } else this.weapons[w] = u.level;
    } else {
      const p = u.id as Passive;
      const strength =
        p === "multishot" ? 1 : RARITIES[u.rarity ?? "common"].multiplier;
      this.passiveStrength[p] = this.passiveValue(p) + strength;
      this.passives[p] = u.level;
      if (p === "vitality") {
        this.maxHp += 30 * strength;
        this.hp = Math.min(this.maxHp, this.hp + 30 * strength);
      }
    }
    this.upgradesQueued = Math.max(0, this.upgradesQueued - 1);
    this.phase = "playing";
    this.choices = [];
    if (this.upgradesQueued > 0) this.offerUpgrades();
  }
  private collect(d: Drop) {
    if (d.type === "xp") this.gainXp(d.value);
    if (d.type === "heal") {
      // Resolve at pickup so health gained after the kit dropped also scales.
      this.hp = Math.min(
        this.maxHp,
        this.hp + this.maxHp * MEDKIT_HEAL_FRACTION,
      );
      this.sound("heal");
    }
    if (d.type === "magnet") {
      let count = 0;
      for (const orb of this.drops)
        if (orb.type === "xp") {
          orb.attracted = true;
          orb.pullSpeed = Math.max(8, orb.pullSpeed || 0);
          count++;
        }
      this.effect("ring", this.player, 4, 0.7, "#9ee8dd");
      this.announce(
        count > 0
          ? `자석 활성화 · 경험치 구슬 ${count}개 회수 중`
          : "자석 활성화 · 남은 경험치 구슬이 없습니다.",
      );
      this.sound("heal");
    }
    if (d.type === "chest") {
      this.crates++;
      // Supply upgrades no longer also provide a free heal.
      this.upgradesQueued += d.value;
      this.offerUpgrades();
      this.announce("보급 회수 · 장비 강화 1회");
    }
  }
  spawnSurvivor() {
    if (
      this.survivors.some((s) => s.state === "wounded") ||
      this.survivors.length >= 3
    )
      return;
    this.rescueNavigation.refresh(this.structures, this.buildingsVersion);
    const p = this.rescueNavigation.spawnPoint(
      this.player,
      () => this.random(),
      this.survivors,
    );
    if (!p) return;
    const survivor: InjuredSurvivor = {
      ...p,
      id: this.id(),
      hp: RESCUE_MAX_HP / 2,
      maxHp: RESCUE_MAX_HP,
      state: "wounded",
      healing: false,
      appearance: Math.floor(this.random() * 3),
      angle: this.random() * Math.PI * 2,
      changedAt: this.time,
      route: [],
      routeIndex: 0,
      routeVersion: -1,
    };
    this.ecs.survivors.add(survivor);
    this.announce("구조 신호 · 미니맵의 십자가를 따라 이동하세요.");
    this.sound("wave");
    return survivor;
  }
  canHealSurvivor(s: InjuredSurvivor) {
    return (
      s.state === "wounded" &&
      distance2(this.player, s) <= RESCUE_RADIUS ** 2 + 1e-7 &&
      lineOfSight(this.player, s, this.structures)
    );
  }
  private updateRescueSystem(dt: number) {
    if (this.time + 1e-7 >= this.nextRescueAt) {
      this.nextRescueAt =
        this.time +
        RESCUE_INTERVAL_MIN +
        this.random() * (RESCUE_INTERVAL_MAX - RESCUE_INTERVAL_MIN);
      this.spawnSurvivor();
    }
    for (const s of this.survivors) {
      if (s.state === "dead") {
        if (this.time - s.changedAt + 1e-7 >= 8) this.ecs.survivors.remove(s);
        continue;
      }
      if (s.state === "escaping") {
        if (s.routeVersion !== this.buildingsVersion) {
          this.rescueNavigation.refresh(this.structures, this.buildingsVersion);
          s.route = this.rescueNavigation.escapeRoute(s);
          s.routeIndex = 0;
          s.routeVersion = this.buildingsVersion;
        }
        const target = s.route[s.routeIndex];
        if (target) {
          const dx = target.x - s.x,
            dz = target.z - s.z,
            distance = Math.hypot(dx, dz),
            step = Math.min(distance, dt * 9);
          if (distance > 1e-7) {
            s.angle = Math.atan2(dx, dz);
            s.x += (dx / distance) * step;
            s.z += (dz / distance) * step;
          }
          if (distance - step < 1e-7) s.routeIndex++;
          if (Math.abs(s.x) > MAP_LIMIT + 5 || Math.abs(s.z) > MAP_LIMIT + 5)
            this.ecs.survivors.remove(s);
        } else if (this.time - s.changedAt > 20) this.ecs.survivors.remove(s);
        continue;
      }
      s.healing = this.canHealSurvivor(s);
      s.hp = clamp(
        s.hp + (s.healing ? RESCUE_HEAL_RATE : -RESCUE_BLEED_RATE) * dt,
        0,
        s.maxHp,
      );
      if (s.hp <= 1e-7) {
        s.hp = 0;
        s.state = "dead";
        s.healing = false;
        s.changedAt = this.time;
        this.survivorsLost++;
        this.announce("구조 신호 소실 · 생존자가 사망했습니다.");
      } else if (s.hp >= s.maxHp - 1e-7) {
        s.hp = s.maxHp;
        s.state = "escaping";
        s.healing = false;
        s.changedAt = this.time;
        this.rescued++;
        this.drop(s, "chest", 1);
        this.announce("생존자 구출 · 보급상자 확보 · 탈출 중");
        this.sound("heal");
        this.onRescue?.();
      }
    }
    this.ecs.survivors.read();
  }
  private updateEnemySystem(dt: number) {
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      e.slow = Math.max(0, e.slow - dt);
      e.flash = Math.max(0, e.flash - dt);
      const vx = this.player.x - e.x,
        vz = this.player.z - e.z,
        d = Math.hypot(vx, vz) || 0.1;
      e.angle = Math.atan2(vx, vz);
      e.attack -= dt;
      if (e.rangedCooldown !== undefined)
        e.rangedCooldown = Math.max(0, e.rangedCooldown - dt);
      let startedCharge = false;
      let sp = e.speed * (e.slow > 0 ? (e.kind === "boss" ? 0.8 : 0.38) : 1);
      if (e.kind === "spitter" && d < 11) sp = d < 6 ? -1 : 0;
      let moveX = vx / d,
        moveZ = vz / d;
      if (
        e.kind === "charger" ||
        (e.kind === "boss" && [2, 5].includes(e.bossIndex))
      ) {
        if (e.chargeTime > 0) {
          e.chargeTime -= dt;
          moveX = e.chargeX;
          moveZ = e.chargeZ;
          sp = e.speed * (e.kind === "boss" ? 5.5 : 4.6);
          e.angle = Math.atan2(moveX, moveZ);
        } else if (e.attack <= 0) {
          startedCharge = true;
          e.attack = e.kind === "boss" ? 5.5 : 4.2;
          e.chargeTime = e.kind === "boss" ? 0.9 : 0.72;
          moveX = e.chargeX;
          moveZ = e.chargeZ;
          sp = e.speed * (e.kind === "boss" ? 5.5 : 4.6);
        } else if (e.attack <= 0.65) {
          sp = 0;
          if (e.attack + dt > 0.65) {
            e.chargeX = moveX;
            e.chargeZ = moveZ;
            this.effect(
              "warning",
              { x: e.x + moveX * 6, z: e.z + moveZ * 6 },
              1.1,
              0.65,
              "#e98965",
              0,
            );
          }
        }
      }
      const wall = this.move(e, moveX * sp * dt, moveZ * sp * dt, e.radius);
      if (wall) {
        e.sieging += dt;
        // Hordes erode cover, with a per-building cap so hundreds of zombies
        // cannot delete it in one frame. Late sieges are progressively stronger.
        wall.siegeDamage +=
          (e.kind === "boss"
            ? 130
            : e.kind === "brute" || e.kind === "elite"
              ? 32
              : 10) * dt;
        if (e.chargeTime > 0) {
          this.damageBuilding(wall, e.kind === "boss" ? 650 : 110);
          e.chargeTime = 0;
        }
        // Navigate around a corner if the player is beyond it; groups remaining
        // at the wall still attack the structure rather than walking through it.
        if (e.sieging > 0.7) {
          const ax = Math.abs(e.x - wall.x) > wall.w / 2;
          const tangent = ax ? Math.sign(vz || 1) : Math.sign(vx || 1);
          this.move(
            e,
            ax ? 0 : tangent * sp * dt,
            ax ? tangent * sp * dt : 0,
            e.radius,
          );
        }
      } else e.sieging = 0;
      if (distance2(e, this.player) < (e.radius + 0.48) ** 2)
        this.damagePlayer(e.damage);
      const chargeBoss = e.kind === "boss" && [2, 5].includes(e.bossIndex);
      if (
        (e.kind === "spitter" || e.kind === "boss") &&
        (chargeBoss
          ? startedCharge && (e.rangedCooldown ?? 0) <= 1e-7
          : e.attack <= 1e-7)
      ) {
        const fireInterval =
          (e.kind === "boss"
            ? chargeBoss
              ? 5.5
              : e.hp < e.maxHp * 0.5
                ? 1.85
                : 2.8
            : 3.6) * ENEMY_FIRE_INTERVAL_MULTIPLIER;
        // Charge movement keeps its original clock. Only every other charge
        // releases a volley, so lowering bullet frequency never slows lunges.
        if (chargeBoss) e.rangedCooldown = fireInterval;
        else e.attack = fireInterval;
        const count =
          e.kind === "boss" ? Math.min(38, 12 + e.bossIndex * 5) : 1;
        for (let i = 0; i < count; i++)
          this.projectile(
            e,
            e.angle +
              (count === 1 ? 0 : (i * Math.PI * 2) / count) +
              (e.kind === "boss" && [1, 4, 5].includes(e.bossIndex)
                ? this.time * 0.4
                : 0),
            e.kind === "boss" ? 8 : 9,
            e.damage * 0.65,
            ENEMY_PROJECTILE_RADIUS,
            5,
            "acid",
          );
        if (e.kind === "boss") {
          this.effect(
            "warning",
            this.player,
            3 + e.bossIndex * 0.4,
            1.25,
            "#d67253",
            24 + e.bossIndex * 8,
          );
          if (e.bossIndex >= 3) {
            const zones = e.bossIndex === 5 ? 3 : 2;
            for (let j = 1; j < zones; j++) {
              const a = e.angle + (j * Math.PI * 2) / zones;
              this.effect(
                "warning",
                {
                  x: this.player.x + Math.sin(a) * 4,
                  z: this.player.z + Math.cos(a) * 4,
                },
                3,
                1.25 + j * 0.3,
                "#de9d6a",
                25 + e.bossIndex * 3,
              );
            }
          }
          if (e.hp < e.maxHp * 0.5 && this.enemies.length < 480)
            for (let j = 0; j < 2 + e.bossIndex; j++)
              this.spawnEnemy(
                e.bossIndex >= 2 ? "charger" : "runner",
                e.x + (this.random() - 0.5) * 4,
                e.z + (this.random() - 0.5) * 4,
              );
        }
      }
      // Recycle enemies left far behind instead of accumulating invisible entities.
      if (d > 48 && e.kind !== "boss") {
        const a = this.random() * Math.PI * 2;
        e.x = clamp(this.player.x + Math.cos(a) * 28, -62, 62);
        e.z = clamp(this.player.z + Math.sin(a) * 28, -62, 62);
        this.move(e, 0, 0, e.radius);
      }
    }
    for (const b of this.structures)
      if (b.siegeDamage > 0)
        this.damageBuilding(
          b,
          Math.min(b.siegeDamage, (22 + this.time * 0.055) * dt),
        );
    if (this.hp <= 0) return;
  }
  private updateMolotov(b: Bullet, dt: number) {
    const flight = b.flight!;
    const old = { x: b.x, z: b.z };
    flight.elapsed = Math.min(flight.duration, flight.elapsed + dt);
    const progress = flight.elapsed / flight.duration;
    const end = {
      x: flight.start.x + (flight.end.x - flight.start.x) * progress,
      z: flight.start.z + (flight.end.z - flight.start.z) * progress,
    };
    let contact: number | null = null;
    for (const wall of this.structures) {
      const t = segmentHit(old, end, wall, b.radius);
      if (t !== null && (contact === null || t < contact)) contact = t;
    }
    const step = contact === null ? 1 : Math.max(0, contact - 0.0001);
    b.x = old.x + (end.x - old.x) * step;
    b.z = old.z + (end.z - old.z) * step;
    b.life = flight.duration - flight.elapsed;
    if (contact === null && b.life > 1e-7) return;
    b.life = 0;
    // No fire or damage exists before impact. Landing uses the launch-time
    // damage/area snapshot, and never applies friendly bullet contact damage.
    this.effect(
      "fire",
      b,
      flight.fireRadius,
      flight.fireLife,
      "#ed8c43",
      b.damage,
    );
    this.effect(
      "blast",
      b,
      Math.min(1.5, flight.fireRadius * 0.45),
      0.24,
      "#ffb65e",
    );
    this.effect("spark", b, 0.4, 0.24, "#d9b071");
    this.sound("glass");
  }
  private updateProjectileSystem(dt: number) {
    for (const b of this.bullets) {
      if (b.life <= 0) continue;
      if (b.type === "molotov" && b.flight) {
        this.updateMolotov(b, dt);
        continue;
      }
      const old = { x: b.x, z: b.z };
      const travel = Math.min(dt, b.life);
      if (travel <= 0) continue;
      b.x += b.vx * travel;
      b.z += b.vz * travel;
      b.life = Math.max(0, b.life - dt);
      let stopped = false;
      let wall: Building | undefined,
        wallTime = 1;
      for (const building of this.structures) {
        const t = segmentHit(old, b, building, b.radius);
        if (t !== null && t <= wallTime) {
          wall = building;
          wallTime = t;
        }
      }
      if (wall) {
        b.x = old.x + (b.x - old.x) * wallTime;
        b.z = old.z + (b.z - old.z) * wallTime;
      }
      if (b.type === "acid") {
        if (wall) {
          this.damageBuilding(wall, b.damage);
          b.life = 0;
          continue;
        }
        if (distance2(b, this.player) < (0.45 + b.radius) ** 2) {
          this.damagePlayer(b.damage);
          b.life = 0;
        }
        continue;
      }
      const midpoint = { x: (old.x + b.x) / 2, z: (old.z + b.z) / 2 };
      const nearby = this.nearby(
        midpoint,
        Math.hypot(b.x - old.x, b.z - old.z) / 2 + 2,
      );
      const candidates = this.contacts;
      candidates.length = 0;
      for (const e of nearby) {
        if (e.hp <= 0 || b.hit.has(e.id)) continue;
        const t = segmentCircleHit(old, b, e, e.radius + b.radius);
        if (t === null) continue;
        const index = candidates.length;
        const contact =
          this.contactPool[index] ?? (this.contactPool[index] = { e, t });
        contact.e = e;
        contact.t = t;
        candidates.push(contact);
      }
      candidates.sort((a, c) => a.t - c.t);
      for (const { e } of candidates) {
        b.hit.add(e.id);
        let dealsDamage = true;
        if (e.kind === "boss" && b.volleyHits) {
          const hits = b.volleyHits.get(e.id) || 0;
          const cap =
            b.type === "sniper"
              ? 1
              : b.type === "shotgun"
                ? 3
                : b.type === "frost"
                  ? 2
                  : 3;
          dealsDamage = hits < cap;
          if (dealsDamage) b.volleyHits.set(e.id, hits + 1);
        }
        if (dealsDamage)
          this.hit(e, b.damage, b.type === "frost" ? 2.5 : 0, b.type);
        if (b.pierceChance <= 0 || this.random() >= b.pierceChance) {
          b.life = 0;
          stopped = true;
          break;
        }
      }
      if (wall && !stopped) {
        this.damageBuilding(wall, b.damage * 0.3);
        b.life = 0;
      }
    }
  }
  update(dt: number, input: Input) {
    if (this.phase !== "playing") return;
    dt = Math.min(dt, 0.05);
    this.time += dt;
    this.ecs.world.set(SimulationTime, { delta: dt, elapsed: this.time });
    this.aim = input.aim ? { ...input.aim } : undefined;
    this.noticeTime -= dt;
    this.invincible = Math.max(0, this.invincible - dt);
    this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    this.pulseCooldown = Math.max(0, this.pulseCooldown - dt);
    this.dashTime = Math.max(0, this.dashTime - dt);
    this.comboTime -= dt;
    if (this.comboTime < 0) this.combo = 0;
    this.hp = Math.min(
      this.maxHp,
      this.hp + dt * (this.regenBonus + this.passiveValue("vitality") * 0.4),
    );
    const stage = Math.min(30, Math.floor((this.time + 1e-7) / 60));
    if (stage !== this.stage) {
      this.stage = stage;
      this.announce(`${STAGES[stage][0]} · ${STAGES[stage][1]}`);
      this.sound("wave");
      if (stage < 30 && !BOSS_SCHEDULE.some((t) => t / 60 === stage)) {
        const roster = WAVE_ROSTERS[stage];
        for (let i = 0; i < 10 + stage * 2; i++)
          this.spawnEnemy(roster[Math.floor(this.random() * roster.length)]);
      }
    }
    while (
      this.bossesSpawned < BOSSES.length &&
      this.time + 1e-7 >= BOSS_SCHEDULE[this.bossesSpawned]
    ) {
      const i = this.bossesSpawned++;
      this.spawnEnemy("boss", undefined, undefined, i);
      this.announce(`보스 출현 · ${BOSSES[i].name} · ${BOSSES[i].pattern}`);
      this.sound("boss");
    }
    let ix = input.x,
      iy = input.y,
      len = Math.hypot(ix, iy);
    if (len > 1) {
      ix /= len;
      iy /= len;
    }
    const dx = (ix + iy) * Math.SQRT1_2,
      dz = (iy - ix) * Math.SQRT1_2;
    if (len > 0.1) {
      if (!this.aim) this.facing = Math.atan2(dx, dz);
      this.motion += dt * 10;
    }
    if (this.aim) this.facing = this.aimAngle();
    if (input.dash && this.dashCooldown === 0) {
      this.dashesUsed++;
      this.dashDirection = undefined;
      if (input.dashTarget) {
        const x = input.dashTarget.x - this.player.x,
          z = input.dashTarget.z - this.player.z;
        const distance = Math.hypot(x, z);
        this.dashDirection =
          distance > 0.01
            ? { x: x / distance, z: z / distance }
            : { x: Math.sin(this.facing), z: Math.cos(this.facing) };
      }
      this.dashTime = 0.22;
      this.dashCooldown = 3 * (1 - (this.researchLevels.dash || 0) * 0.06);
      this.invincible = 0.35;
      this.effect("ring", this.player, 1, 0.3, "#f3c58b");
      this.sound("dash");
    }
    const speed =
      this.character.speed *
      (1 +
        this.passiveValue("boots") * 0.1 +
        (this.researchLevels.movement || 0) * 0.03) *
      (this.dashTime > 0 ? 3.5 : 1);
    if (this.dashTime <= 0) this.dashDirection = undefined;
    const movement = this.dashDirection;
    this.move(
      this.player,
      (movement?.x ?? dx) * speed * dt,
      (movement?.z ?? dz) * speed * dt,
    );
    if (input.pulse && this.pulseCooldown === 0) {
      this.pulsesUsed++;
      this.pulseCooldown = 18 * (1 - (this.researchLevels.pulse || 0) * 0.06);
      this.invincible = 0.5;
      this.effect("blast", this.player, 7, 0.65, "#f3b268");
      for (const e of this.enemies) {
        const ds = distance2(this.player, e);
        if (ds < 64) {
          this.hit(e, (110 + this.level * 8) * this.damageScale(), 3, "pulse");
          const d = Math.sqrt(ds) || 1;
          this.move(
            e,
            ((e.x - this.player.x) / d) * 4,
            ((e.z - this.player.z) / d) * 4,
            e.radius,
          );
        }
      }
      for (const b of this.bullets)
        if (b.type === "acid" && distance2(b, this.player) < 64) b.life = 0;
      this.sound("pulse");
    }
    this.spawnClock -= dt;
    const interval = Math.max(0.055, 0.65 - this.time * 0.00063);
    if (this.spawnClock <= 0) {
      this.spawnClock += interval;
      const roster = WAVE_ROSTERS[this.stage];
      const count =
        1 +
        (this.time > 480 ? 1 : 0) +
        (this.difficulty === "normal" && this.time > 720 ? 1 : 0);
      for (let n = 0; n < count; n++)
        this.spawnEnemy(roster[Math.floor(this.random() * roster.length)]);
    }
    this.eliteClock -= dt;
    if (this.eliteClock <= 0 && this.time > 75) {
      this.eliteClock = 48;
      this.spawnEnemy("elite");
    }
    this.lootClock += dt;
    if (this.lootClock >= 120) {
      this.lootClock -= 120;
      this.suppliesSpawned++;
      const a = this.random() * Math.PI * 2;
      const p = {
        x: clamp(this.player.x + Math.cos(a) * 9, -62, 62),
        z: clamp(this.player.z + Math.sin(a) * 9, -62, 62),
      };
      this.move(p, 0, 0);
      this.drop(p, "chest", 1);
      this.announce("보급 투하 · 120초 고정 간격 · 강화 1회");
    }
    this.visionClock -= dt;
    if (this.visionClock <= 0) {
      this.visionClock = 0.12;
      this.updateVision();
    }
    for (const b of this.structures) {
      b.flash = Math.max(0, b.flash - dt);
      b.siegeDamage = 0;
    }
    for (const car of this.vehicles) {
      if (car.burningAt >= 0 && car.burnedAt < 0) {
        if (this.time - car.burningAt >= VEHICLE_BURN_SECONDS) {
          car.burnedAt = this.time;
          this.buildingsVersion++;
          this.visionClock = 0;
        } else if (distance2(car, this.player) < 8) this.damagePlayer(14);
      }
    }
    this.updateEnemySystem(dt);
    this.rebuildGrid();
    for (const w of Object.keys(this.weapons) as Weapon[]) {
      this.cooldowns[w] = (this.cooldowns[w] || 0) - dt;
      if (this.cooldowns[w]! <= 1e-7) this.fire(w);
    }
    this.updateProjectileSystem(dt);
    if (this.hp <= 0) return;
    this.fireClock -= dt;
    const fireTick = this.fireClock <= 0;
    if (fireTick) this.fireClock = 0.4;
    const burns = this.fireDamage;
    const wallBurns = this.coverFireDamage;
    burns.clear();
    wallBurns.clear();
    for (const e of this.effects) {
      e.life -= dt;
      e.tick -= dt;
      if (e.type === "fire" && fireTick && e.life > 0) {
        for (const enemy of this.nearby(e, e.radius + this.grid.maxRadius))
          if (
            distance2(e, enemy) < (e.radius + enemy.radius) ** 2 &&
            lineOfSight(e, enemy, this.structures)
          )
            burns.set(enemy, Math.max(burns.get(enemy) || 0, e.damage));
        for (const b of this.structures) {
          if (!isDestructible(b) || b.hp <= 0) continue;
          const point = closestPoint(b, e);
          if (
            distance2(e, point) < e.radius ** 2 &&
            lineOfSight(e, point, this.structures)
          )
            wallBurns.set(b, Math.max(wallBurns.get(b) || 0, e.damage * 0.15));
        }
      }
      if (e.type === "warning" && e.life <= 0) {
        if (e.damage > 0) {
          if (distance2(e, this.player) < e.radius ** 2)
            this.damagePlayer(e.damage);
          for (const b of this.structures)
            if (
              Math.abs(e.x - b.x) < b.w / 2 + e.radius &&
              Math.abs(e.z - b.z) < b.d / 2 + e.radius
            )
              this.damageBuilding(b, e.damage * 4);
          this.effect("blast", e, e.radius, 0.5, "#8bb252");
        }
      }
    }
    if (this.hp <= 0) return;
    for (const [enemy, damage] of burns) this.hit(enemy, damage, 0, "molotov");
    for (const [b, damage] of wallBurns) this.damageBuilding(b, damage);
    this.updateBurns();
    if (this.hp <= 0) return;
    this.updateRescueSystem(dt);
    this.ecs.cleanup();
    if (
      this.time + 1e-7 >= OPERATION_SECONDS &&
      this.bossesSpawned === BOSSES.length &&
      this.defeatedBosses.size === BOSSES.length
    ) {
      this.phase = "victory";
      this.sound("win");
      return;
    }
    const magnet =
      3.5 +
      this.passiveValue("magnet") * 2 +
      (this.researchLevels.pickup || 0) * 0.5;
    const pending = this.pendingDrops;
    pending.length = 0;
    for (const d of this.drops) {
      d.age += dt;
      const ds = distance2(d, this.player);
      const pulling = d.type === "xp" && d.attracted;
      if (
        pulling ||
        (ds < (d.type === "xp" ? magnet ** 2 : 2.5) &&
          lineOfSight(this.player, d, this.buildings))
      ) {
        const dist = Math.sqrt(ds);
        if (pulling) d.pullSpeed = Math.min(60, (d.pullSpeed || 8) + dt * 40);
        const step = Math.min(
          dist,
          dt * (pulling ? d.pullSpeed! : d.type === "xp" ? 13 : 9),
        );
        if (dist > 0) {
          d.x += ((this.player.x - d.x) / dist) * step;
          d.z += ((this.player.z - d.z) / dist) * step;
        }
        if (dist - step < 0.65) {
          pending.push(d);
        }
      }
    }
    for (const d of pending) this.ecs.pickups.remove(d);
    this.ecs.pickups.read();
    for (const d of pending) this.collect(d);
  }
}
