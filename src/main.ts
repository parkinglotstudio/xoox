import "./style.css";
import { loadGameData } from "./data";
import {
  createInitialState,
  rollIsCombat,
  rollContentType,
  rollGrade,
  rollDailyEntry,
  rollUngradedEntry,
  pickLocation,
  getLocationById,
  pickBranch,
  pickCombat,
  textFor,
  textLinesFor,
  applyEffectId,
  checkLevelUp,
  checkMilestones,
  grantSkillFromTier,
  pickSkillChoices,
  learnSkill,
  getSkillBaseId,
  getSkillLevelRow,
  getUpgradeSkill,
  getBranchCostEffectId,
  getSkillCombatHints,
  incrementGauge,
  gaugeValue,
  spinMinigameRow,
  getMinigamePool,
  rewardRowLabel,
  getBonusEffectIds,
  uiText,
  effectLine,
  decideCombatTierFromData,
  timelineMarks,
  highlightKeywords,
  formatStat,
  simulateCombat,
  tuningNum,
  tuningStr,
  getStageMapForDay,
  getEffectiveCombatStats,
  getReviveHpPct,
  applyDayEvent,
  getDayEvent,
  rollIsRescue,
  pickRescueAnimal,
  buildRescueOptions,
  resolveRescueChoice,
  rescueStateFor,
  grantRescueReward,
  swapPartyMember,
  getPartySlots,
  rollCommentary,
} from "./engine";
import { scrambleReveal, rollCardTextSlot, sleep } from "./effects";
import { randInt } from "./rng";
import type { GameData, PlayerState, GradeDef, BranchDef, SkillDef, MinigameRewardRow, EnemySkillDef, PartyMemberDef, RescueAnimalDef } from "./types";

const app = document.getElementById("app")!;
app.innerHTML = `
  <div class="phone">
    <div class="day-roadmap" id="dayRoadmap"></div>
    <div class="visual-stage" id="visualStage">
      <div class="stage-sky" id="stageSky"></div>
      <div class="stage-skills" id="stageSkills"></div>
      <div class="stage-enemy-skills" id="stageEnemySkills"></div>
      <div class="stage-skill-tip" id="stageSkillTip" style="display:none" role="tooltip"></div>
      <div class="stage-actors">
        <div class="stage-hero-col">
          <div class="stage-party-row" id="stagePartyRow" style="display:none"></div>
          <div class="stage-hero" id="stageHero">🦫</div>
        </div>
        <div class="stage-vs" id="stageVs" style="display:none">VS</div>
        <div class="stage-enemy" id="stageEnemy" style="display:none">👾</div>
      </div>
      <div class="stage-bars" id="stageBars" style="display:none">
        <div class="stage-bar-col">
          <div class="stage-bar player"><span id="stagePlayerHp"></span><div class="stage-bar-track"><div class="stage-bar-fill" id="stagePlayerFill"></div></div></div>
          <div class="stage-bar player-shield" id="stageShieldBar" style="display:none"><span id="stageShieldHp"></span><div class="stage-bar-track"><div class="stage-bar-fill shield" id="stageShieldFill"></div></div></div>
          <div class="stage-bar player-rage" id="stagePlayerRageBar"><span id="stagePlayerRageText"></span><div class="stage-bar-track"><div class="stage-bar-fill rage" id="stagePlayerRageFill"></div></div></div>
        </div>
        <div class="stage-bar-col enemy-col">
          <div class="stage-bar enemy"><span id="stageEnemyHp"></span><div class="stage-bar-track"><div class="stage-bar-fill enemy" id="stageEnemyFill"></div></div></div>
          <div class="stage-bar enemy-shield" id="stageEnemyShieldBar" style="display:none"><span id="stageEnemyShieldHp"></span><div class="stage-bar-track"><div class="stage-bar-fill shield" id="stageEnemyShieldFill"></div></div></div>
          <div class="stage-bar enemy-rage" id="stageEnemyRageBar"><span id="stageEnemyRageText"></span><div class="stage-bar-track"><div class="stage-bar-fill rage enemy-rage-fill" id="stageEnemyRageFill"></div></div></div>
        </div>
      </div>
      <div class="purify-bars" id="purifyBars" style="display:none">
        <div class="purify-bar-row">
          <div class="purify-bar-label">모험가</div>
          <div class="purify-bar-track"><div class="purify-bar-fill player" id="purifyPlayerFill"></div></div>
          <div class="purify-bar-value" id="purifyPlayerValue"></div>
        </div>
        <div class="purify-bar-row">
          <div class="purify-bar-label">타락 게이지</div>
          <div class="purify-bar-track"><div class="purify-bar-fill enemy" id="purifyEnemyFill"></div></div>
          <div class="purify-bar-value" id="purifyEnemyValue"></div>
        </div>
      </div>
      <div class="stage-party-tip" id="stagePartyTip" style="display:none"></div>
      <div class="stage-reveal-panel" id="stageRevealPanel">
        <div class="reveal-icon" id="revealIcon">🐾</div>
        <div class="reveal-name" id="revealName"></div>
        <div class="reveal-desc" id="revealDesc"></div>
      </div>
      <div class="rescue-stage" id="rescueStage" style="display:none">
        <div class="rescue-animal-wrap">
          <svg class="rescue-ring" viewBox="0 0 120 120" aria-hidden="true">
            <circle class="rescue-ring-bg" cx="60" cy="60" r="52"></circle>
            <circle class="rescue-ring-fill" id="rescueRingFill" cx="60" cy="60" r="52"></circle>
          </svg>
          <div class="rescue-animal" id="rescueAnimal">🐾</div>
        </div>
        <div class="rescue-meta">
          <div class="rescue-pct" id="rescuePct">정화도 0%</div>
          <div class="rescue-state" id="rescueState"><span class="rescue-mood" id="rescueMood"></span><span id="rescueStateLabel"></span></div>
          <div class="rescue-turnpips" id="rescueTurnPips"></div>
        </div>
        <div class="rescue-situation" id="rescueSituation"></div>
      </div>
      <div class="stage-caption">
        <div class="stage-mode-icon" id="stageModeIcon">🏕️</div>
        <div class="stage-title" id="stageTitle"></div>
        <div class="stage-sub" id="stageSub"></div>
      </div>
      <div class="stage-log" id="stageLog"></div>
    </div>
    <div class="statbar" id="statbar">
      <div class="stat-chip"><span class="label" id="statLvLabel"></span><span class="value" id="statLevel">1</span></div>
      <div class="hp-bar-wrap">
        <div class="hp-bar-track"><div class="hp-bar-fill" id="hpFill" style="width:100%"></div></div>
        <span id="hpText" style="font-size:10px;color:#e8b8b8;"></span>
      </div>
      <div class="stat-chip"><span class="label" id="statAtkLabel"></span><span class="value" id="statAtk">0</span></div>
      <div class="stat-chip"><span class="label" id="statDefLabel"></span><span class="value" id="statDef">0</span></div>
      <div class="stat-chip"><span class="label" id="statGoldLabel"></span><span class="value" id="statGold">0</span></div>
    </div>
    <div class="currency-bar" id="currencyBar"></div>
    <div class="feed" id="feed"></div>
    <div class="banner-overlay" id="bannerOverlay" style="display:none">
      <div class="banner-text" id="bannerText"></div>
    </div>
    <div class="splash-overlay" id="splashOverlay" style="display:none">
      <div class="splash-title" id="splashTitle">BONUS GAME</div>
    </div>
    <div class="vs-overlay" id="vsOverlay" style="display:none" aria-hidden="true">
      <div class="vs-panel">
        <div class="vs-side vs-player">
          <div class="vs-frame blue"><span class="vs-icon" id="vsPlayerIcon">🦫</span></div>
          <div class="vs-name" id="vsPlayerName">모험가</div>
        </div>
        <div class="vs-center">
          <div class="vs-tier" id="vsTierBadge">일반</div>
          <div class="vs-mark">VS</div>
        </div>
        <div class="vs-side vs-foe">
          <div class="vs-frame red"><span class="vs-icon" id="vsEnemyIcon">👾</span></div>
          <div class="vs-name" id="vsEnemyName">적</div>
        </div>
      </div>
    </div>
    <div class="petbuff-overlay" id="petBuffOverlay" style="display:none" aria-hidden="true">
      <div class="petbuff-panel">
        <div class="petbuff-title">🐾 동료들의 힘</div>
        <div class="petbuff-sub">전투에 함께한다</div>
        <div class="petbuff-row" id="petBuffRow"></div>
      </div>
    </div>
    <div class="reward-modal" id="rewardModal" style="display:none">
      <div class="reward-modal-glow"></div>
      <div class="reward-modal-sparks" id="rewardModalSparks" aria-hidden="true"></div>
      <div class="reward-modal-card">
        <div class="reward-modal-ribbon" id="rewardModalTitle">보상</div>
        <div class="reward-modal-body">
          <div class="reward-item-tile" id="rewardModalTile">
            <div class="reward-item-icon" id="rewardModalIcon">🪙</div>
            <div class="reward-item-qty" id="rewardModalQty">x0</div>
          </div>
          <div class="reward-item-desc" id="rewardModalDesc" style="display:none"></div>
        </div>
      </div>
    </div>
    <div class="swap-modal" id="swapModal" style="display:none">
      <div class="swap-panel">
        <div class="swap-title">🐾 동료가 가득 찼다</div>
        <div class="swap-sub">교체할 동료를 고르거나, 이대로 보낼 수 있다</div>
        <div class="swap-new" id="swapNew"></div>
        <div class="swap-arrow">⟱ 교체 ⟱</div>
        <div class="swap-roster" id="swapRoster"></div>
        <button class="swap-decline" id="swapDecline" type="button">교체 안 함 · 도감에만 기록</button>
      </div>
    </div>
    <div class="devil-modal" id="devilModal" style="display:none" aria-hidden="true">
      <div class="devil-modal-panel" id="devilModalPanel">
        <div class="devil-mascot" id="devilMascot" aria-hidden="true">😈</div>
        <div class="devil-banner" id="devilBanner"></div>
        <div class="devil-ask" id="devilAsk"></div>
        <div class="devil-cost" id="devilCost"></div>
        <div class="devil-skill" id="devilSkill"></div>
        <div class="devil-actions">
          <button type="button" class="devil-btn refuse" id="devilRefuseBtn"></button>
          <button type="button" class="devil-btn accept" id="devilAcceptBtn"></button>
        </div>
      </div>
    </div>
    <div class="minigame-panel" id="minigamePanel" style="display:none">
      <div class="mg-title" id="minigameTitle"></div>
      <div class="mg-sub" id="minigameSub"></div>
      <div class="mg-stage" id="minigameStage"></div>
      <div class="result" id="minigameResult"></div>
      <button class="mg-action-btn" id="minigameActionBtn" style="display:none"></button>
    </div>
    <div class="skill-choice-panel" id="skillChoicePanel" style="display:none">
      <div class="skill-choice-title" id="skillChoiceTitle">스킬 선택</div>
      <div class="skill-choice-sub" id="skillChoiceSub">아래에서 기술을 선택하세요</div>
      <div id="skillChoiceCards" style="width:100%;display:flex;flex-direction:column;align-items:center;gap:10px;"></div>
      <button type="button" class="learned-skills-fab" id="learnedSkillsBtn"></button>
    </div>
    <div class="learned-skills-modal" id="learnedSkillsModal" style="display:none">
      <div class="learned-skills-sheet">
        <div class="learned-skills-title" id="learnedSkillsTitle"></div>
        <div class="learned-skills-list" id="learnedSkillsList"></div>
        <button class="mg-action-btn" id="learnedSkillsClose"></button>
      </div>
    </div>
    <div class="victory-panel" id="victoryPanel" style="display:none">
      <div class="victory-crown" id="victoryIcon"></div>
      <div class="victory-title" id="victoryTitle"></div>
      <div class="victory-sub" id="victorySub"></div>
      <div class="victory-loot" id="victoryLoot"></div>
      <button class="mg-action-btn" id="restartBtn"></button>
    </div>
    <div class="controls">
      <div class="controls-dock">
        <div class="gauge jackpot">
          <div class="gauge-icon" id="gaugeJackpotIcon"></div>
          <div class="gauge-meta">
            <div class="gauge-count" id="gaugeJackpot"></div>
            <div class="gauge-label" id="gaugeJackpotLabel"></div>
          </div>
        </div>
        <div class="controls-center">
          <button class="main-btn idle" id="mainBtn"></button>
          <div class="choice-buttons" id="choiceButtons" style="display:none;"></div>
        </div>
        <div class="gauge mid">
          <div class="gauge-icon" id="gaugeMidIcon"></div>
          <div class="gauge-meta">
            <div class="gauge-count" id="gaugeMid"></div>
            <div class="gauge-label" id="gaugeMidLabel"></div>
          </div>
        </div>
      </div>
    </div>
    <div class="intro-splash" id="introSplash">
      <img class="intro-img" id="introImg" src="/xoox_intro.png" alt="XOOX" />
      <div class="intro-fallback" id="introFallback">
        <div class="intro-grid"></div>
        <div class="intro-glow"></div>
        <div class="intro-pack" id="introPack"></div>
        <div class="intro-logo" aria-label="XOOX">
          <span>X</span><span>O</span><span>O</span><span>X</span>
        </div>
        <div class="intro-tag">RAINBOW ISLAND · 무지개섬 구조대</div>
      </div>
      <button class="intro-start-btn" id="introStartBtn" type="button">게임 스타트</button>
    </div>
    <div class="cutscene-overlay" id="cutsceneOverlay" style="display:none">
      <div class="cutscene-chapter" id="cutsceneChapter"></div>
      <div class="cutscene-box" id="cutsceneBox">
        <div class="cutscene-speaker" id="cutsceneSpeaker"></div>
        <div class="cutscene-line" id="cutsceneLine"></div>
        <div class="cutscene-tap">▼ 탭하여 계속</div>
      </div>
    </div>
  </div>
`;

// 인트로 스플래시 — 사이버펑크 반려견묘 군상 실루엣을 로고 뒤에 흩뿌린다(느낌만 흉내).
const PET_HEAD_SVG = `<svg viewBox="0 0 44 40" class="intro-pet-svg" aria-hidden="true"><path d="M9 15 L4 2 L19 11 Z" fill="currentColor"/><path d="M35 15 L40 2 L25 11 Z" fill="currentColor"/><ellipse cx="22" cy="24" rx="15" ry="14" fill="currentColor"/></svg>`;
(() => {
  const pack = document.getElementById("introPack");
  if (!pack) return;
  // [색, x%, y%, 크기, 회전deg, 등장딜레이s]
  const pets: [string, number, number, number, number, number][] = [
    ["#ff3fa8", 50, 6, 92, 0, 0.15],
    ["#8b5cf6", 82, 30, 74, 14, 0.3],
    ["#f59e0b", 16, 26, 76, -14, 0.3],
    ["#22d3c7", 78, 62, 70, 10, 0.5],
    ["#f43f5e", 24, 60, 70, -10, 0.5],
    ["#38bdf8", 62, 82, 64, 8, 0.7],
    ["#a3e635", 36, 84, 64, -8, 0.7],
  ];
  pack.innerHTML = pets
    .map(
      ([c, x, y, s, r, d]) =>
        `<span class="intro-pet" style="left:${x}%;top:${y}%;width:${s}px;color:${c};transform:translate(-50%,-50%) rotate(${r}deg);animation-delay:${d}s">${PET_HEAD_SVG}</span>`
    )
    .join("");
})();

const feedEl = document.getElementById("feed")!;
const dayRoadmap = document.getElementById("dayRoadmap")!;
const currencyBar = document.getElementById("currencyBar")!;
const bannerOverlay = document.getElementById("bannerOverlay")!;
const visualStage = document.getElementById("visualStage")!;
const stageHero = document.getElementById("stageHero")!;
const stageEnemy = document.getElementById("stageEnemy")!;
const stageVs = document.getElementById("stageVs")!;
const stageBars = document.getElementById("stageBars")!;
const stagePlayerHp = document.getElementById("stagePlayerHp")!;
const stageEnemyHp = document.getElementById("stageEnemyHp")!;
const stagePlayerFill = document.getElementById("stagePlayerFill")!;
const stageEnemyFill = document.getElementById("stageEnemyFill")!;
const stageShieldBar = document.getElementById("stageShieldBar")!;
const stageShieldHp = document.getElementById("stageShieldHp")!;
const stageShieldFill = document.getElementById("stageShieldFill")!;
const stageEnemyShieldBar = document.getElementById("stageEnemyShieldBar")!;
const stageEnemyShieldHp = document.getElementById("stageEnemyShieldHp")!;
const stageEnemyShieldFill = document.getElementById("stageEnemyShieldFill")!;
const stagePlayerRageBar = document.getElementById("stagePlayerRageBar")!;
const stagePlayerRageText = document.getElementById("stagePlayerRageText")!;
const stagePlayerRageFill = document.getElementById("stagePlayerRageFill")!;
const stageEnemyRageBar = document.getElementById("stageEnemyRageBar")!;
const stageEnemyRageText = document.getElementById("stageEnemyRageText")!;
const stageEnemyRageFill = document.getElementById("stageEnemyRageFill")!;
const stageModeIcon = document.getElementById("stageModeIcon")!;
const stagePartyRow = document.getElementById("stagePartyRow")!;
const stagePartyTip = document.getElementById("stagePartyTip")!;
const statbarEl = document.getElementById("statbar")!;
// XOOX 정화 전투 전용 바 — 액션전투(stageBars/실드/분노)와 완전 독립된 DOM(공유 없음).
const purifyBars = document.getElementById("purifyBars")!;
const purifyPlayerFill = document.getElementById("purifyPlayerFill")!;
const purifyPlayerValue = document.getElementById("purifyPlayerValue")!;
const purifyEnemyFill = document.getElementById("purifyEnemyFill")!;
const purifyEnemyValue = document.getElementById("purifyEnemyValue")!;
const stageTitle = document.getElementById("stageTitle")!;
const stageSub = document.getElementById("stageSub")!;
const stageLog = document.getElementById("stageLog")!;
const stageSkills = document.getElementById("stageSkills")!;
const stageEnemySkills = document.getElementById("stageEnemySkills")!;
const stageSkillTip = document.getElementById("stageSkillTip")!;
const bannerText = document.getElementById("bannerText")!;
const splashOverlay = document.getElementById("splashOverlay")!;
const splashTitle = document.getElementById("splashTitle")!;
const vsOverlay = document.getElementById("vsOverlay")!;
const vsPlayerIcon = document.getElementById("vsPlayerIcon")!;
const vsPlayerName = document.getElementById("vsPlayerName")!;
const vsEnemyIcon = document.getElementById("vsEnemyIcon")!;
const vsEnemyName = document.getElementById("vsEnemyName")!;
const vsTierBadge = document.getElementById("vsTierBadge")!;
const stageRevealPanel = document.getElementById("stageRevealPanel")!;
const revealIcon = document.getElementById("revealIcon")!;
const revealName = document.getElementById("revealName")!;
const revealDesc = document.getElementById("revealDesc")!;
const petBuffOverlay = document.getElementById("petBuffOverlay")!;
const petBuffRow = document.getElementById("petBuffRow")!;
const swapModal = document.getElementById("swapModal")!;
const swapNew = document.getElementById("swapNew")!;
const swapRoster = document.getElementById("swapRoster")!;
const swapDecline = document.getElementById("swapDecline") as HTMLButtonElement;
const cutsceneOverlay = document.getElementById("cutsceneOverlay")!;
const cutsceneChapter = document.getElementById("cutsceneChapter")!;
const cutsceneBox = document.getElementById("cutsceneBox")!;
const cutsceneSpeaker = document.getElementById("cutsceneSpeaker")!;
const cutsceneLine = document.getElementById("cutsceneLine")!;
const rescueStage = document.getElementById("rescueStage")!;
const rescueRingFill = document.getElementById("rescueRingFill") as unknown as SVGCircleElement;
const rescueAnimal = document.getElementById("rescueAnimal")!;
const rescuePctEl = document.getElementById("rescuePct")!;
const rescueMood = document.getElementById("rescueMood")!;
const rescueStateLabel = document.getElementById("rescueStateLabel")!;
const rescueTurnPips = document.getElementById("rescueTurnPips")!;
const rescueSituation = document.getElementById("rescueSituation")!;
const rewardModal = document.getElementById("rewardModal")!;
const rewardModalTitle = document.getElementById("rewardModalTitle")!;
const rewardModalIcon = document.getElementById("rewardModalIcon")!;
const rewardModalQty = document.getElementById("rewardModalQty")!;
const rewardModalDesc = document.getElementById("rewardModalDesc")!;
const rewardModalSparks = document.getElementById("rewardModalSparks")!;
const devilModal = document.getElementById("devilModal")!;
const devilModalPanel = document.getElementById("devilModalPanel")!;
const devilMascot = document.getElementById("devilMascot")!;
const devilBanner = document.getElementById("devilBanner")!;
const devilAsk = document.getElementById("devilAsk")!;
const devilCost = document.getElementById("devilCost")!;
const devilSkill = document.getElementById("devilSkill")!;
const devilRefuseBtn = document.getElementById("devilRefuseBtn") as HTMLButtonElement;
const devilAcceptBtn = document.getElementById("devilAcceptBtn") as HTMLButtonElement;
const minigamePanel = document.getElementById("minigamePanel")!;
const minigameTitle = document.getElementById("minigameTitle")!;
const minigameSub = document.getElementById("minigameSub")!;
const minigameStage = document.getElementById("minigameStage")!;
const minigameResult = document.getElementById("minigameResult")!;
const minigameActionBtn = document.getElementById("minigameActionBtn") as HTMLButtonElement;
const skillChoicePanel = document.getElementById("skillChoicePanel")!;
const skillChoiceTitle = document.getElementById("skillChoiceTitle")!;
const skillChoiceSub = document.getElementById("skillChoiceSub")!;
const skillChoiceCards = document.getElementById("skillChoiceCards")!;
const learnedSkillsBtn = document.getElementById("learnedSkillsBtn") as HTMLButtonElement;
const learnedSkillsModal = document.getElementById("learnedSkillsModal")!;
const learnedSkillsTitle = document.getElementById("learnedSkillsTitle")!;
const learnedSkillsList = document.getElementById("learnedSkillsList")!;
const learnedSkillsClose = document.getElementById("learnedSkillsClose") as HTMLButtonElement;
const mainBtn = document.getElementById("mainBtn") as HTMLButtonElement;
const choiceButtons = document.getElementById("choiceButtons")!;
const gaugeJackpotEl = document.getElementById("gaugeJackpot")!;
const gaugeMidEl = document.getElementById("gaugeMid")!;
const victoryPanel = document.getElementById("victoryPanel")!;
const victoryIcon = document.getElementById("victoryIcon")!;
const victoryTitle = document.getElementById("victoryTitle")!;
const victorySub = document.getElementById("victorySub")!;
const victoryLoot = document.getElementById("victoryLoot")!;
const restartBtn = document.getElementById("restartBtn") as HTMLButtonElement;

function ui(key: string, vars?: Record<string, string | number>): string {
  return uiText(data, key, vars);
}

let data: GameData;
let state: PlayerState;
let lastDayShown = 0;
let combatPending: { tier: string; combatId?: string } | null = null;
let rescuePending: RescueAnimalDef | null = null;
/** 연출 화면 배경 이미지(data/xoox_stage_bg.png) 로드 성공 여부 — 성공 시 스테이지 배경으로 사용 */
let stageBgLoaded = false;
let pendingSkillChoice: (() => void) | null = null;
/** 메인 버튼 한 번 대기 (오픈/돌리기 등) */
let pendingMainAction: (() => void) | null = null;
let lastCombatId: string | null = null;
let stageEnemyMaxHp = 1;
let stageShieldMax = 1;
let stageEnemyShieldMax = 1;
let stageEnemyRageMax = 100;
let currentEnemyKit: EnemySkillDef[] = [];
let pinnedEnemySkillId: string | null = null;
let pinnedSkillTipId: string | null = null;

function hideSkillTip() {
  pinnedSkillTipId = null;
  pinnedEnemySkillId = null;
  stageSkillTip.style.display = "none";
  stageSkillTip.innerHTML = "";
  stageSkillTip.classList.remove("enemy-tip");
  stageSkills.querySelectorAll(".stage-skill-icon.active").forEach((el) => el.classList.remove("active"));
  stageEnemySkills.querySelectorAll(".stage-skill-icon.active").forEach((el) => el.classList.remove("active"));
}

function buildSkillTipHtml(skill: SkillDef): string {
  const lv = getSkillLevelRow(data, skill.skill_id);
  const scale = lv?.combat_power_scale ?? 1;
  const status = skill.is_upgrade
    ? ui("ui_skill_tip_status_plus")
    : getUpgradeSkill(data, getSkillBaseId(skill))
      ? ui("ui_skill_tip_status_base")
      : ui("ui_skill_tip_status_max");
  const powerPct = Math.round(scale * 100);
  const desc = skill.description || skill.effect_text || "";
  const hints = getSkillCombatHints(data, skill.skill_id);
  return `
    <div class="sst-head">
      <span class="sst-icon">${skill.icon || "✦"}</span>
      <div class="sst-titles">
        <div class="sst-name">${skill.skill_name}</div>
        <div class="sst-meta">
          <span class="skill-tier-badge ${skill.is_upgrade ? "tier-upgrade" : `tier-${skill.tier}`}">${
            skill.is_upgrade ? ui("ui_skill_upgrade_badge") : skill.tier
          }</span>
        </div>
      </div>
    </div>
    <div class="sst-row">${status}</div>
    <div class="sst-row">${ui("ui_skill_tip_power", { pct: String(powerPct) })}</div>
    ${hints.map((h) => `<div class="sst-row sst-hint">${h}</div>`).join("")}
    <div class="sst-label">${ui("ui_skill_tip_ability")}</div>
    <div class="sst-ability">${skill.effect_text || desc}</div>
    ${desc && desc !== skill.effect_text ? `<div class="sst-note">${desc}</div>` : ""}
  `;
}

function showSkillTip(skillId: string, opts?: { pin?: boolean; toggle?: boolean }) {
  const skill = data.skills.find((s) => s.skill_id === skillId);
  if (!skill) return;
  const pin = opts?.pin ?? false;
  const toggle = opts?.toggle ?? false;
  if (pin && toggle && pinnedSkillTipId === skillId) {
    hideSkillTip();
    return;
  }
  if (pin) pinnedSkillTipId = skillId;
  pinnedEnemySkillId = null;
  stageSkillTip.classList.remove("enemy-tip");
  stageSkillTip.innerHTML = buildSkillTipHtml(skill);
  stageSkillTip.style.display = "block";
  stageEnemySkills.querySelectorAll(".stage-skill-icon.active").forEach((el) => el.classList.remove("active"));
  stageSkills.querySelectorAll(".stage-skill-icon").forEach((el) => {
    el.classList.toggle("active", (el as HTMLElement).dataset.skillId === skillId);
  });
}

function renderStageSkillIcons() {
  const keepPin = pinnedSkillTipId;
  stageSkills.innerHTML = "";
  for (const id of state.learnedSkills) {
    const s = data.skills.find((x) => x.skill_id === id);
    if (!s) continue;
    const el = document.createElement("button");
    el.type = "button";
    el.className = `stage-skill-icon${s.is_upgrade ? " upgraded" : ""}`;
    el.dataset.skillId = s.skill_id;
    el.setAttribute("aria-label", s.skill_name);
    el.innerHTML = `<span class="ssi-emoji">${s.icon || "✦"}</span>${
      s.is_upgrade ? `<span class="ssi-plus">+</span>` : ""
    }`;
    el.addEventListener("mouseenter", () => {
      if (!pinnedSkillTipId) showSkillTip(s.skill_id);
    });
    el.addEventListener("mouseleave", () => {
      if (!pinnedSkillTipId) hideSkillTip();
    });
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      showSkillTip(s.skill_id, { pin: true, toggle: true });
    });
    stageSkills.appendChild(el);
  }
  if (keepPin && state.learnedSkills.includes(keepPin)) {
    showSkillTip(keepPin, { pin: true });
  } else if (keepPin) {
    hideSkillTip();
  }
}

function buildEnemySkillTipHtml(skill: EnemySkillDef): string {
  return `
    <div class="sst-head">
      <span class="sst-icon">${skill.icon || "✦"}</span>
      <div class="sst-titles">
        <div class="sst-name">${skill.skill_name}</div>
        <div class="sst-meta"><span class="skill-tier-badge tier-enemy">적</span></div>
      </div>
    </div>
    <div class="sst-row">${ui("ui_stage_enemy_skill_tip_slot", { slot: skill.action_slot })}</div>
    <div class="sst-label">${ui("ui_skill_tip_ability")}</div>
    <div class="sst-ability">${skill.effect_text || ""}</div>
  `;
}

function showEnemySkillTip(skillId: string, opts?: { pin?: boolean; toggle?: boolean }) {
  const skill = currentEnemyKit.find((s) => s.enemy_skill_id === skillId);
  if (!skill) return;
  const pin = opts?.pin ?? false;
  if (opts?.toggle && pinnedEnemySkillId === skillId) {
    hideSkillTip();
    return;
  }
  pinnedSkillTipId = null;
  if (pin) pinnedEnemySkillId = skillId;
  stageSkillTip.classList.add("enemy-tip");
  stageSkillTip.innerHTML = buildEnemySkillTipHtml(skill);
  stageSkillTip.style.display = "block";
  stageSkills.querySelectorAll(".stage-skill-icon.active").forEach((el) => el.classList.remove("active"));
  stageEnemySkills.querySelectorAll(".stage-skill-icon").forEach((el) => {
    el.classList.toggle("active", (el as HTMLElement).dataset.skillId === skillId);
  });
}

function renderEnemySkillIcons(kit: EnemySkillDef[]) {
  currentEnemyKit = kit;
  const keepPin = pinnedEnemySkillId;
  stageEnemySkills.innerHTML = "";
  for (const s of kit) {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "stage-skill-icon enemy-kit";
    el.dataset.skillId = s.enemy_skill_id;
    el.setAttribute("aria-label", s.skill_name);
    el.innerHTML = `<span class="ssi-emoji">${s.icon || "✦"}</span>`;
    el.addEventListener("mouseenter", () => {
      if (!pinnedEnemySkillId && !pinnedSkillTipId) showEnemySkillTip(s.enemy_skill_id);
    });
    el.addEventListener("mouseleave", () => {
      if (!pinnedEnemySkillId) hideSkillTip();
    });
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      showEnemySkillTip(s.enemy_skill_id, { pin: true, toggle: true });
    });
    stageEnemySkills.appendChild(el);
  }
  if (keepPin && kit.some((k) => k.enemy_skill_id === keepPin)) {
    showEnemySkillTip(keepPin, { pin: true });
  } else if (keepPin) {
    pinnedEnemySkillId = null;
  }
}

function clearEnemySkillIcons() {
  currentEnemyKit = [];
  pinnedEnemySkillId = null;
  stageEnemySkills.innerHTML = "";
  if (stageSkillTip.classList.contains("enemy-tip")) hideSkillTip();
}

function applyLearnedSkill(skillId: string): { name: string; upgraded: boolean } | null {
  const res = learnSkill(data, state, skillId);
  if (!res) return null;
  refreshStatbar();
  renderStageSkillIcons();
  return { name: res.skill.skill_name, upgraded: res.upgraded };
}

function clearStageLog() {
  stageLog.innerHTML = "";
}

function appendStageLogLine(text: string, cls = "") {
  const line = document.createElement("div");
  line.className = `stage-log-line ${cls}`.trim();
  line.textContent = text;
  stageLog.appendChild(line);
  stageLog.scrollTop = stageLog.scrollHeight;
}

/** 직전 상단 장면 — IDLE로 돌아갈 때 하단 로그와 맞추기 위해 유지 */
let lastStageScene: { modeId: string; title: string; subtitle: string; icon: string } | null = null;
let currentStageModeId = "IDLE";

/** 하단 로그 한 줄 → 상단 짧은 헤드라인 */
function stageHeadline(text: string, max = 26): string {
  const one = text
    .replace(/\s+/g, " ")
    .trim()
    .split(/[.。!！?\n]/)[0]
    ?.trim() || text.trim();
  if (one.length <= max) return one;
  return `${one.slice(0, Math.max(1, max - 1))}…`;
}

function mapIdleSubtitle(): string {
  const map = getStageMapForDay(data, Math.max(1, state.day));
  const mapLabel = map
    ? `${map.display_name} · ${map.day_start}~${map.day_end}${ui("ui_day_unit")}`
    : "";
  return ui("ui_stage_idle_continue", { map: mapLabel || ui("ui_btn_next") });
}

function setStageMode(
  modeId: string,
  opts?: {
    title?: string;
    subtitle?: string;
    icon?: string;
    enemyIcon?: string;
    clearLog?: boolean;
    /** false면 lastStageScene 갱신 안 함 (대기 복귀용) */
    remember?: boolean;
  }
) {
  const mode = data.stageModes.find((m) => m.mode_id === modeId);
  visualStage.className = (`visual-stage ${mode?.bg_class ?? ""}`.trim() + (stageBgLoaded ? " has-stage-bg" : "")).trim();
  const title = opts?.title ?? mode?.title ?? modeId;
  const subtitle = opts?.subtitle ?? mode?.subtitle ?? "";
  const icon = opts?.icon ?? mode?.icon ?? "";
  stageModeIcon.textContent = icon;
  stageTitle.textContent = title;
  stageSub.textContent = subtitle;
  // 주인공은 이모지가 아니라 방랑자 SVG로 1회 렌더(setStageMode마다 덮어쓰면 애니메이션이 끊긴다)
  ensureWandererHero();
  currentStageModeId = modeId;

  const showEnemy = mode?.show_enemy ?? false;
  stageEnemy.style.display = showEnemy ? "" : "none";
  stageVs.style.display = showEnemy ? "" : "none";
  stageBars.style.display = showEnemy ? "flex" : "none";
  // 구조 조우 전용 레이어는 RESCUE 모드에서만 노출 — 다른 모드 전환 시 반드시 숨긴다.
  if (modeId !== "RESCUE") rescueStage.style.display = "none";
  if (showEnemy && opts?.enemyIcon) stageEnemy.textContent = opts.enemyIcon;
  if (!showEnemy) clearEnemySkillIcons();
  if (opts?.clearLog !== false && modeId !== "COMBAT") clearStageLog();
  if (modeId === "COMBAT" && opts?.clearLog !== false) clearStageLog();
  renderStageSkillIcons();

  if (opts?.remember !== false && modeId !== "MOVING" && modeId !== "IDLE") {
    lastStageScene = { modeId, title, subtitle, icon };
  }

  // 상단 창 높이 변경(전투 확대 등) 후 피드 하단 끝점 유지
  scrollFeedToBottom({ anticipatePx: 12 });
}

/**
 * 하단 피드 카드와 상단 캡션을 맞춤.
 * 전투 연출 중(COMBAT)에는 건드리지 않음.
 */
function syncStageWithLog(opts: {
  modeId?: string;
  title: string;
  subtitle?: string;
  icon?: string;
  clearLog?: boolean;
}) {
  if (currentStageModeId === "COMBAT") return;
  setStageMode(opts.modeId ?? "EVENT", {
    title: opts.title,
    subtitle: opts.subtitle ?? mapIdleSubtitle(),
    icon: opts.icon,
    clearLog: opts.clearLog ?? false,
  });
}

function updateStageHpBars(
  playerHp: number,
  enemyHp: number,
  shield = 0,
  shieldMax = 0,
  enemyShield = 0,
  enemyShieldMax = 0,
  playerRage = 0,
  enemyRage = 0
) {
  stagePlayerHp.textContent = ui("ui_stage_hp", {
    cur: Math.round(playerHp),
    max: Math.round(state.maxHp),
  });
  stageEnemyHp.textContent = ui("ui_stage_hp", {
    cur: Math.round(enemyHp),
    max: Math.round(stageEnemyMaxHp),
  });
  stagePlayerFill.style.width = `${Math.max(0, Math.min(100, (playerHp / state.maxHp) * 100))}%`;
  stageEnemyFill.style.width = `${Math.max(0, Math.min(100, (enemyHp / stageEnemyMaxHp) * 100))}%`;

  const showShield = shieldMax > 0 || shield > 0;
  stageShieldBar.style.display = showShield ? "" : "none";
  if (showShield) {
    const max = Math.max(1, shieldMax || stageShieldMax || shield);
    stageShieldMax = max;
    stageShieldHp.textContent = ui("ui_stage_shield", { cur: Math.round(shield), max: Math.round(max) });
    stageShieldFill.style.width = `${Math.max(0, Math.min(100, (shield / max) * 100))}%`;
  }

  const showEShield = enemyShieldMax > 0 || enemyShield > 0;
  stageEnemyShieldBar.style.display = showEShield ? "" : "none";
  if (showEShield) {
    const max = Math.max(1, enemyShieldMax || stageEnemyShieldMax || enemyShield);
    stageEnemyShieldMax = max;
    stageEnemyShieldHp.textContent = ui("ui_stage_shield", {
      cur: Math.round(enemyShield),
      max: Math.round(max),
    });
    stageEnemyShieldFill.style.width = `${Math.max(0, Math.min(100, (enemyShield / max) * 100))}%`;
  }

  const pRageMax = Math.max(1, tuningNum(data, "player_rage_max", 100));
  stagePlayerRageText.textContent = ui("ui_stage_rage", {
    cur: Math.round(playerRage),
    max: Math.round(pRageMax),
  });
  stagePlayerRageFill.style.width = `${Math.max(0, Math.min(100, (playerRage / pRageMax) * 100))}%`;

  const eMax = Math.max(1, stageEnemyRageMax);
  stageEnemyRageText.textContent = ui("ui_stage_rage", {
    cur: Math.round(enemyRage),
    max: Math.round(eMax),
  });
  stageEnemyRageFill.style.width = `${Math.max(0, Math.min(100, (enemyRage / eMax) * 100))}%`;
}

function clearCombatActorFx() {
  for (const el of [stageHero, stageEnemy]) {
    el.classList.remove("stage-act-hit", "stage-act-hurt", "stage-act-skill");
  }
}

function bumpActorClass(el: HTMLElement, cls: string) {
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}

/** 원작식: 공격자가 상대에게 붙고, 피격/스킬 시 흔들림 */
function playCombatStrikeFx(opts: { attacker: "player" | "enemy"; skill?: boolean }) {
  clearCombatActorFx();
  const atk = opts.attacker === "player" ? stageHero : stageEnemy;
  const def = opts.attacker === "player" ? stageEnemy : stageHero;
  bumpActorClass(atk, opts.skill ? "stage-act-skill" : "stage-act-hit");
  bumpActorClass(def, "stage-act-hurt");
}

async function playCombatOnStage(combatId: string | undefined, tier = "NORMAL") {
  const hpBefore = state.hp;
  const enemyRow = data.combatEnemies.find((e) => e.combat_id === combatId);
  const previewName = enemyRow?.enemy_name ?? "적";
  const previewIcon = enemyRow?.enemy_icon ?? "👾";
  await playCombatVsIntro({
    tier,
    enemyName: previewName,
    enemyIcon: previewIcon,
  });

  const sim = simulateCombat(data, state, combatId);
  const map = getStageMapForDay(data, state.day);
  const baseHp = enemyRow?.enemy_hp ?? tuningNum(data, "fallback_enemy_hp", 6500);
  const hpScale = tuningNum(data, "enemy_hp_scale", 1);
  stageEnemyMaxHp = Math.round(baseHp * (map?.enemy_hp_mult ?? 1) * hpScale);
  stageShieldMax = 1;
  stageEnemyShieldMax = 1;
  stageEnemyRageMax = Math.max(1, enemyRow?.rage_max ?? 100);
  const tierLabel = combatTierLabel(tier);
  setStageMode("COMBAT", {
    subtitle: [map?.display_name, `[${tierLabel}]`, sim.enemyName].filter(Boolean).join(" · "),
    enemyIcon: sim.enemyIcon,
    clearLog: true,
  });
  visualStage.classList.remove("combat-tier-normal", "combat-tier-elite", "combat-tier-boss");
  visualStage.classList.add(
    tier === "MINIBOSS"
      ? "combat-tier-elite"
      : tier === "FINALBOSS"
        ? "combat-tier-boss"
        : "combat-tier-normal"
  );
  stageEnemy.classList.toggle("elite", tier === "MINIBOSS");
  stageEnemy.classList.toggle("boss", tier === "FINALBOSS");
  renderEnemySkillIcons(sim.enemyKitSkills);
  state.hp = hpBefore;
  updateStageHpBars(state.hp, stageEnemyMaxHp, 0, 0, 0, 0, 0, 0);
  refreshStatbar();
  // VS 이후, 전투 시작 전 — 동료들의 힘이 HP/ATK/주인공으로 빨려 들어가는 연출
  await playPetBuffIntro();
  const delaySkill = tuningNum(data, "skill_delay_ms", 520);
  const delayEnemySkill = tuningNum(data, "enemy_skill_delay_ms", 540);
  const delayRage = tuningNum(data, "rage_delay_ms", 620);
  const delayShield = tuningNum(data, "shield_delay_ms", 480);
  const delayHit = tuningNum(data, "hit_delay_ms", 780);
  const delayGap = tuningNum(data, "turn_gap_ms", 320);
  const delaySide = tuningNum(data, "side_gap_ms", 720);
  const delayWin = tuningNum(data, "win_delay_ms", 1000);
  const delayDefault = tuningNum(data, "turn_delay_ms", 650);
  const delayBuff = Math.round(delaySkill * 0.75);
  const delayVolley = tuningNum(data, "volley_delay_ms", 380);

  let lastSide: string | null = null;
  for (const log of sim.logs) {
    const shield = log.shield ?? 0;
    const shieldMax = log.shieldMax ?? stageShieldMax;
    if ((log.shieldMax ?? 0) > stageShieldMax) stageShieldMax = log.shieldMax!;
    const eShield = log.enemyShield ?? 0;
    const eShieldMax = log.enemyShieldMax ?? stageEnemyShieldMax;
    if ((log.enemyShieldMax ?? 0) > stageEnemyShieldMax) stageEnemyShieldMax = log.enemyShieldMax!;

    state.hp = Math.max(0, log.playerHp);

    if (log.kind === "side") {
      if (lastSide && log.side && lastSide !== log.side) await sleep(delaySide);
      const sideLabel =
        log.side === "player"
          ? ui("ui_stage_side_player")
          : log.side === "enemy"
            ? ui("ui_stage_side_enemy", { name: sim.enemyName })
            : ui("ui_stage_round_banner", {
                turn: log.turn,
                max: tuningNum(data, "max_turns", 15),
              });
      appendStageLogLine(
        sideLabel,
        log.side === "player" ? "hit-side-player" : log.side === "enemy" ? "hit-side-enemy" : "hit-turn"
      );
      if (log.side === "system") {
        stageSub.textContent = [
          map?.display_name,
          `[${combatTierLabel(tier)}]`,
          sim.enemyName,
          ui("ui_stage_turn", { turn: log.turn }),
        ]
          .filter(Boolean)
          .join(" · ");
      } else if (log.side === "player") {
        stageSub.textContent = ui("ui_stage_side_player");
      } else if (log.side === "enemy") {
        stageSub.textContent = ui("ui_stage_side_enemy", { name: sim.enemyName });
      }
      lastSide = log.side ?? lastSide;
      await sleep(delaySide);
      updateStageHpBars(
        log.playerHp,
        log.enemyHp,
        shield,
        shieldMax,
        eShield,
        eShieldMax,
        log.playerRage ?? 0,
        log.enemyRage ?? 0
      );
      refreshStatbar();
      continue;
    }

    // 같은 쪽 연계 타격은 짧게, 상대 쪽으로 넘어갈 때는 side 배너가 여운을 줌
    if (log.side && lastSide && log.side !== lastSide && log.side !== "system") {
      await sleep(Math.round(delayGap * 0.5));
    }
    if (log.side && log.side !== "system") lastSide = log.side;

    if (log.kind === "buff") {
      appendStageLogLine(log.text ?? "", "hit-buff");
      await sleep(delayBuff);
    } else if (log.kind === "phase") {
      appendStageLogLine(log.text ?? "", "hit-phase");
      await sleep(delayBuff);
    } else if (log.kind === "skill") {
      appendStageLogLine(log.text ?? "", "hit-skill");
      playCombatStrikeFx({ attacker: "player", skill: true });
      await sleep(delaySkill);
      clearCombatActorFx();
    } else if (log.kind === "volley" || log.kind === "bolt") {
      appendStageLogLine(log.text ?? "", "hit-skill");
      playCombatStrikeFx({ attacker: "player", skill: true });
      await sleep(delayVolley);
      clearCombatActorFx();
    } else if (log.kind === "shield") {
      appendStageLogLine(log.text ?? "", "hit-shield");
      await sleep(delayShield);
    } else if (log.kind === "enemy_shield") {
      appendStageLogLine(log.text ?? "", "hit-enemy-shield");
      await sleep(delayShield);
    } else if (log.kind === "enemy_skill") {
      appendStageLogLine(log.text ?? "", "hit-enemy-skill");
      playCombatStrikeFx({ attacker: "enemy", skill: true });
      await sleep(delayEnemySkill);
      clearCombatActorFx();
    } else if (log.kind === "rage") {
      appendStageLogLine(log.text ?? "", "hit-rage");
      playCombatStrikeFx({
        attacker: log.side === "player" ? "player" : "enemy",
        skill: true,
      });
      await sleep(delayRage);
      clearCombatActorFx();
    } else if (log.kind === "player") {
      appendStageLogLine(
        log.text ?? ui("ui_stage_basic_hit", { name: sim.enemyName, dmg: log.dmg ?? 0 }),
        "hit-player"
      );
      playCombatStrikeFx({ attacker: "player" });
      await sleep(delayHit);
      clearCombatActorFx();
    } else if (log.kind === "enemy") {
      appendStageLogLine(
        log.text ?? ui("ui_stage_enemy_hit", { name: sim.enemyName, dmg: log.dmg ?? 0 }),
        "hit-enemy"
      );
      playCombatStrikeFx({ attacker: "enemy" });
      await sleep(delayHit);
      clearCombatActorFx();
    } else if (log.kind === "win") {
      appendStageLogLine(ui("ui_stage_player_win", { name: sim.enemyName }), "hit-win");
      await sleep(delayWin);
      updateStageHpBars(
        log.playerHp,
        0,
        shield,
        shieldMax,
        eShield,
        eShieldMax,
        log.playerRage ?? 0,
        log.enemyRage ?? 0
      );
      refreshStatbar();
      break;
    } else if (log.kind === "timeout") {
      appendStageLogLine(ui("ui_stage_timeout"), "hit-timeout");
      await sleep(delayDefault);
      break;
    } else {
      await sleep(delayDefault);
    }
    updateStageHpBars(
      log.playerHp,
      log.enemyHp,
      shield,
      shieldMax,
      eShield,
      eShieldMax,
      log.playerRage ?? 0,
      log.enemyRage ?? 0
    );
    refreshStatbar();
  }

  state.hp = Math.max(0, Math.round(sim.playerHpAfter));
  const last = sim.logs[sim.logs.length - 1];
  updateStageHpBars(
    state.hp,
    Math.max(0, last?.enemyHp ?? 0),
    sim.shieldAfter,
    stageShieldMax,
    sim.enemyShieldAfter,
    stageEnemyShieldMax,
    last?.playerRage ?? 0,
    last?.enemyRage ?? 0
  );
  refreshStatbar();
  return sim;
}

/** 아이콘 밑에 상시 노출할 짧은 효과 표시(탭 없이도 바로 읽힘) — 전체 설명은 탭 툴팁·입장 연출에서. */
// 네온 반려견묘 실루엣 — 인트로와 같은 톤. 펫(동료/구조동물) 아이콘을 이모지 대신 이걸로 통일.
const PET_NEON_COLORS = ["#ff3fa8", "#8b5cf6", "#f59e0b", "#22d3c7", "#f43f5e", "#38bdf8", "#a3e635", "#ff8a3c", "#c084fc", "#4ade80"];
function petNeonColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return PET_NEON_COLORS[h % PET_NEON_COLORS.length];
}
function isCatIcon(icon: string): boolean {
  return /🐈|🐱/u.test(icon);
}
/** 네온 펫 실루엣 마크업 — 고양이는 뾰족귀, 개는 접힌귀. 색은 시드로 결정. */
function petHeadMarkup(icon: string, color: string, size = 30): string {
  const ears = isCatIcon(icon)
    ? `<path d="M9 15 L4 2 L19 11 Z" fill="${color}"/><path d="M35 15 L40 2 L25 11 Z" fill="${color}"/>`
    : `<path d="M11 18 Q3 8 12 5 Q17 7 16 17 Z" fill="${color}"/><path d="M33 18 Q41 8 32 5 Q27 7 28 17 Z" fill="${color}"/>`;
  return `<svg class="pet-head" viewBox="0 0 44 40" style="width:${size}px;height:auto;color:${color}">${ears}<ellipse cx="22" cy="24" rx="15" ry="14" fill="${color}"/></svg>`;
}

function compactEffectLabel(m: PartyMemberDef): string {
  if (m.effect_type === "FLAT_HP") return `❤+${m.effect_value}`;
  if (m.effect_type === "FLAT_ATK") return `⚔+${m.effect_value}`;
  if (m.effect_type === "PERIODIC_HEAL") return `♻${m.trigger_value}T`;
  return `💥${m.trigger_value}%`; // EXECUTE_BURST
}

// ─────────────────────────────────────────────────────────────────────────
// 전투 진입 전 동료 강화 연출 — VS 이후, 각 펫 효과가 해당 수치로 "빨려 들어가는" 모달.
// HP펫→HP바 / ATK펫→ATK칩 / 그 외(안 보이는 속성)→주인공 캐릭터로 흡수.
// (실제 스탯 가산은 grantRescueReward에서 합류 즉시 반영됨 — 이 연출은 그 힘을 시각화)
// ─────────────────────────────────────────────────────────────────────────

/** 흡수 대상 엘리먼트 — FLAT_HP→HP바, FLAT_ATK→ATK칩, 그 외→주인공 */
function buffAbsorbTarget(m: PartyMemberDef): HTMLElement {
  if (m.effect_type === "FLAT_HP") return (document.querySelector(".hp-bar-wrap") as HTMLElement) ?? stageHero;
  if (m.effect_type === "FLAT_ATK") {
    const atk = document.getElementById("statAtk");
    return (atk?.closest(".stat-chip") as HTMLElement) ?? stageHero;
  }
  return stageHero;
}

function buffPopupText(m: PartyMemberDef): string {
  if (m.effect_type === "FLAT_HP") return `HP +${m.effect_value}`;
  if (m.effect_type === "FLAT_ATK") return `ATK +${m.effect_value}`;
  if (m.effect_type === "PERIODIC_HEAL") return `♻ ${m.trigger_value}턴 회복`;
  return `💥 피니셔`;
}

function buffColor(m: PartyMemberDef): string {
  if (m.effect_type === "FLAT_HP") return "#ff7a86";
  if (m.effect_type === "FLAT_ATK") return "#ffb648";
  return "#c8a6ff";
}

/** 아이콘이 fromEl에서 toEl로 날아가 흡수되고, 도착 지점에 +효과 팝업 + 타깃 펄스 */
function flyAbsorb(fromEl: HTMLElement, toEl: HTMLElement, iconHtml: string, popupText: string, color: string): Promise<void> {
  return new Promise((resolve) => {
    const f = fromEl.getBoundingClientRect();
    const t = toEl.getBoundingClientRect();
    const fx = f.left + f.width / 2;
    const fy = f.top + f.height / 2;
    const tx = t.left + t.width / 2;
    const ty = t.top + t.height / 2;
    const token = document.createElement("div");
    token.className = "buff-fly-token";
    token.innerHTML = iconHtml;
    token.style.left = `${fx}px`;
    token.style.top = `${fy}px`;
    document.body.appendChild(token);
    const dx = tx - fx;
    const dy = ty - fy;
    const anim = token.animate(
      [
        { transform: "translate(-50%,-50%) scale(1)", opacity: 1 },
        { transform: `translate(calc(-50% + ${dx * 0.5}px), calc(-50% + ${dy * 0.5}px)) scale(1.3)`, opacity: 1, offset: 0.55 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.15)`, opacity: 0.15 },
      ],
      { duration: 640, easing: "cubic-bezier(0.55,0,0.7,0.2)" }
    );
    anim.onfinish = () => {
      token.remove();
      toEl.classList.remove("buff-hit");
      void toEl.offsetWidth;
      toEl.classList.add("buff-hit");
      window.setTimeout(() => toEl.classList.remove("buff-hit"), 640);
      const pop = document.createElement("div");
      pop.className = "buff-popup";
      pop.textContent = popupText;
      pop.style.color = color;
      pop.style.left = `${tx}px`;
      pop.style.top = `${t.top}px`;
      document.body.appendChild(pop);
      pop
        .animate(
          [
            { transform: "translate(-50%,4px)", opacity: 0 },
            { transform: "translate(-50%,-8px)", opacity: 1, offset: 0.3 },
            { transform: "translate(-50%,-28px)", opacity: 0 },
          ],
          { duration: 950, easing: "ease-out" }
        )
        .addEventListener("finish", () => pop.remove());
      resolve();
    };
  });
}

/** VS 이후 전투 진입 전 동료 강화 연출. 합류 동료가 없으면 아무 것도 안 함. */
async function playPetBuffIntro() {
  const members = state.joinedPartyMembers
    .map((id) => data.partyMembers.find((m) => m.member_id === id))
    .filter((m): m is NonNullable<typeof m> => !!m);
  if (members.length === 0) return;

  petBuffRow.innerHTML = "";
  const tiles = members.map((m) => {
    const tile = document.createElement("div");
    tile.className = "petbuff-tile";
    tile.innerHTML = `<span class="petbuff-icon">${petHeadMarkup(m.icon, petNeonColor(m.member_id), 34)}</span><span class="petbuff-eff">${m.description}</span>`;
    petBuffRow.appendChild(tile);
    return tile;
  });

  petBuffOverlay.style.display = "flex";
  petBuffOverlay.setAttribute("aria-hidden", "false");
  void petBuffOverlay.offsetWidth;
  petBuffOverlay.classList.add("in");
  await sleep(520);

  for (let i = 0; i < members.length; i++) {
    const m = members[i];
    const iconEl = tiles[i].querySelector(".petbuff-icon") as HTMLElement;
    tiles[i].classList.add("active");
    await sleep(200);
    await flyAbsorb(iconEl, buffAbsorbTarget(m), petHeadMarkup(m.icon, petNeonColor(m.member_id), 30), buffPopupText(m), buffColor(m));
    tiles[i].classList.add("done");
    await sleep(130);
  }

  await sleep(340);
  petBuffOverlay.classList.remove("in");
  await sleep(280);
  petBuffOverlay.style.display = "none";
  petBuffOverlay.setAttribute("aria-hidden", "true");
}

/**
 * XOOX 동행 아이콘 행 — 모험가 초상 바로 위에 작게 배치(18_XOOX_정화전투_연출.md §3, 지시자 피드백 "펫들을 위로").
 * 아이콘 밑에 짧은 효과 표시를 상시 노출(탭 안 해도 보임) + 탭하면 stagePartyTip에 전체 설명. HP바는 없음.
 */
function renderPartyRow() {
  const members = state.joinedPartyMembers
    .map((id) => data.partyMembers.find((m) => m.member_id === id))
    .filter((m): m is NonNullable<typeof m> => !!m);
  stagePartyRow.innerHTML = members
    .map(
      (m, i) => `<div class="stage-party-icon" data-idx="${i}">
        <div class="icon">${petHeadMarkup(m.icon, petNeonColor(m.member_id), 24)}</div>
        <div class="tag">${compactEffectLabel(m)}</div>
      </div>`
    )
    .join("");
  stagePartyRow.style.display = members.length ? "flex" : "none";
  stagePartyRow.querySelectorAll<HTMLElement>(".stage-party-icon").forEach((el) => {
    el.onclick = () => {
      const m = members[Number(el.dataset.idx)];
      if (!m) return;
      stagePartyTip.textContent = `${m.icon} ${m.display_name} — ${m.description}`;
      stagePartyTip.style.display = "block";
      window.setTimeout(() => {
        stagePartyTip.style.display = "none";
      }, 2400);
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────
// XOOX 구조 조우(rescue) — 전투(VS)와 완전히 분리된 단판 5턴 2지선다 정화 퍼즐.
// 동물마다 좋아하는/싫어하는 접근이 달라, 힌트를 읽고 맞는 접근을 골라 정화도 100%를 채우면 구조.
// ─────────────────────────────────────────────────────────────────────────

const RESCUE_RING_CIRC = 2 * Math.PI * 52;

function rescueApproachLabel(tag: string): string {
  return data.rescueApproaches.find((a) => a.tag === tag)?.label ?? tag;
}

/** 스테이지 상단 구조 연출 갱신 — 정화도 링/동물 밝기/상태 라벨/턴 pip */
function renderRescueStage(animal: RescueAnimalDef, pct: number, maxTurns: number, usedTurns: number) {
  const goal = animal.purify_goal || 100;
  const frac = Math.max(0, Math.min(1, pct / goal));
  // 첫 렌더에만 실루엣 주입(매 턴 innerHTML 재설정하면 필터 트랜지션이 끊긴다)
  if (!rescueAnimal.querySelector(".pet-head")) {
    rescueAnimal.innerHTML = petHeadMarkup(animal.icon, petNeonColor(animal.animal_id), 58);
  }
  // 정화가 진행될수록 오염(어둡고 채도 없음)이 걷히고 원래 색으로 밝아진다.
  rescueAnimal.style.filter = `grayscale(${(1 - frac).toFixed(2)}) brightness(${(0.55 + 0.45 * frac).toFixed(2)})`;
  rescueRingFill.style.strokeDasharray = String(RESCUE_RING_CIRC);
  rescueRingFill.style.strokeDashoffset = String(RESCUE_RING_CIRC * (1 - frac));
  const pctInt = Math.round(frac * 100);
  rescuePctEl.textContent = `정화도 ${pctInt}%`;
  const st = rescueStateFor(data, pctInt);
  rescueMood.textContent = st.mood_icon;
  rescueStateLabel.textContent = st.label;
  rescueTurnPips.innerHTML = Array.from(
    { length: maxTurns },
    (_, i) => `<span class="rescue-pip${i < usedTurns ? " used" : ""}"></span>`
  ).join("");
}

/** 2지선다 접근 선택 — choiceButtons 재사용. 고른 접근의 tag를 resolve */
function awaitApproachChoice(
  optA: { tag: string; label: string },
  optB: { tag: string; label: string }
): Promise<string> {
  return new Promise((resolve) => {
    const mk = (opt: { tag: string; label: string }, secondary: boolean) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "choice-btn rescue-choice" + (secondary ? " secondary" : "");
      b.textContent = opt.label;
      b.onclick = async () => {
        await playActivate(b);
        choiceButtons.style.display = "none";
        choiceButtons.innerHTML = "";
        resolve(opt.tag);
      };
      return b;
    };
    choiceButtons.innerHTML = "";
    choiceButtons.appendChild(mk(optA, true));
    choiceButtons.appendChild(mk(optB, false));
    mainBtn.style.display = "none";
    setGaugesVisible(false);
    choiceButtons.style.display = "flex";
    slideIn(choiceButtons);
  });
}

/** 구조 조우 대기 — 「다가가기 / 지나친다」 선택. 지나치면 풀에 남아 다시 조우 가능. */
function presentRescueApproach(animal: RescueAnimalDef) {
  const mk = (label: string, secondary: boolean) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "choice-btn rescue-approach" + (secondary ? " secondary" : "");
    b.textContent = label;
    return b;
  };
  const approach = mk("🐾 다가가기", false);
  const pass = mk("🚶 지나친다", true);
  const cleanup = () => {
    choiceButtons.style.display = "none";
    choiceButtons.innerHTML = "";
    mainBtn.style.display = "";
    setGaugesVisible(true);
  };
  approach.onclick = async () => {
    await playActivate(approach);
    cleanup();
    mainBtn.disabled = true;
    await playMovingPhase();
    await playRescueEncounter(animal);
    finishTurn();
  };
  pass.onclick = async () => {
    await playActivate(pass);
    cleanup();
    rescuePending = null; // 구조하지 않음 → 풀에 남아 나중에 다시 마주칠 수 있음
    await appendCard({ body: `${animal.icon} ${animal.name}을(를) 지나쳤다. 언젠가 다시 마주칠지도 모른다.` });
    await appendCommentary("RESCUE_PASS");
    finishTurn();
  };
  choiceButtons.innerHTML = "";
  choiceButtons.appendChild(approach);
  choiceButtons.appendChild(pass);
  mainBtn.style.display = "none";
  setGaugesVisible(false);
  choiceButtons.style.display = "flex";
  slideIn(choiceButtons);
}

/** 리더 코멘터리 — 구조/전투/이벤트 순간에 Piper·Nashui·Olmas 반응을 로그에 한 줄 띄운다. */
async function appendCommentary(trigger: string) {
  const c = rollCommentary(data, trigger);
  if (!c) return;
  const card = document.createElement("div");
  card.className = "card commentary";
  card.innerHTML =
    `<span class="commentary-speaker">${c.icon} ${c.speaker}</span>` +
    `<span class="commentary-line">${highlightKeywords(data, c.line)}</span>`;
  feedEl.appendChild(card);
  watchFeedCardGrowth(card, 600);
  scrollFeedToBottom({ el: card, anticipatePx: 16 });
  await sleep(300);
}

/** 구조 조우 본편 — 인트로(힌트) → 최대 5턴 2지선다 → 성공(합류) / 실패(도주) */
async function playRescueEncounter(animal: RescueAnimalDef) {
  mainBtn.disabled = true;
  mainBtn.classList.remove("btn-slide-in");
  mainBtn.className = "main-btn combat combat-busy";
  mainBtn.style.display = "none";

  setStageMode("RESCUE", {
    subtitle: animal.name,
    clearLog: true,
  });
  purifyBars.style.display = "none";
  rescueStage.style.display = "flex";
  renderPartyRow();

  const goal = animal.purify_goal || 100;
  const maxTurns = animal.max_turns || 5;
  let pct = 0;
  rescueAnimal.innerHTML = ""; // 이전 동물 실루엣 제거 → 새 동물로 재주입
  renderRescueStage(animal, pct, maxTurns, 0);
  rescueSituation.textContent = animal.hint_text;
  appendStageLogLine(`${animal.icon} ${animal.name} 조우 — ${animal.hint_text}`, "hit-turn");
  await appendCard({ body: `${animal.icon} ${animal.name}\n${animal.hint_text}` });
  await appendCommentary("RESCUE_START");

  const delay = tuningNum(data, "rescue_turn_delay_ms", 620);
  let won = false;

  for (let turn = 1; turn <= maxTurns; turn++) {
    const [optA, optB] = buildRescueOptions(data, animal);
    const tag = await awaitApproachChoice(optA, optB);
    const res = resolveRescueChoice(data, animal, tag);
    pct = Math.max(0, Math.min(goal, pct + res.purifyDelta));
    renderRescueStage(animal, pct, maxTurns, turn);
    const sign = res.purifyDelta >= 0 ? `+${res.purifyDelta}` : `${res.purifyDelta}`;
    rescueSituation.textContent = `${res.reaction} · 정화도 ${sign}`;
    appendStageLogLine(
      `T${turn} ${rescueApproachLabel(tag)} → ${res.reaction} (정화 ${sign})`,
      res.outcome === "GOOD" ? "hit-buff" : res.outcome === "BAD" ? "hit-enemy-skill" : "hit-skill"
    );
    await sleep(delay);
    if (pct >= goal) {
      won = true;
      break;
    }
  }

  rescueStage.style.display = "none";
  choiceButtons.style.display = "none";
  choiceButtons.innerHTML = "";
  rescuePending = null;
  mainBtn.classList.remove("combat-pulse", "combat-busy");

  if (won) {
    state.gold += animal.gold;
    state.exp += animal.exp;
    const res = grantRescueReward(data, state, animal);
    await appendCard({ body: `${animal.name} 정화 성공! 무사히 구조했다.`, effectLines: [`🪙 골드 +${animal.gold}`, `✨ 경험치 +${animal.exp}`] });
    await appendCommentary("RESCUE_WIN");
    if (res) {
      if (res.needsSwap) {
        // 활성 슬롯이 꽉 참 — 교체 결정
        const outId = await presentPartySwap(res.member);
        if (outId) {
          swapPartyMember(data, state, outId, res.member.member_id);
          refreshStatbar();
          renderPartyRow();
          await showPetAcquiredModal(res.member);
          await appendCard({ body: `🔁 ${res.member.display_name}(으)로 교체! ${res.member.description}` });
          await appendCommentary("RESCUE_SWAP");
        } else {
          await appendCard({ body: `📖 ${res.member.display_name}은(는) 도감에만 기록했다. 로스터는 그대로 둔다.` });
        }
      } else {
        refreshStatbar();
        renderPartyRow();
        await showPetAcquiredModal(res.member);
        await appendCard({
          body: `🐾 ${res.member.display_name} 합류! ${res.member.description}`,
        });
      }
    }
    const lvl = checkLevelUp(data, state);
    if (lvl) {
      await appendCard({ body: ui("ui_levelup", { lv: lvl.newLevel }) });
      await appendCard({ body: ui("ui_levelup_heal"), effectLines: [ui("ui_chip_hp_heal", { pct: lvl.hpHealPct })] });
    }
    refreshStatbar();
    setStageMode("EVENT", { title: "구조 성공!", subtitle: stageHeadline(`${animal.name} 구조 완료`), clearLog: false });
  } else {
    await appendCard({ body: `${animal.name}이(가) 겁을 먹고 달아났다. 언젠가 다시 마주칠지도 모른다.` });
    await appendCommentary("RESCUE_FAIL");
    refreshStatbar();
    setStageMode("EVENT", { title: "구조 실패…", subtitle: stageHeadline(`${animal.name} 놓침`), clearLog: false });
  }
}

function slideIn(el: HTMLElement) {
  el.classList.remove("btn-slide-in");
  void el.offsetWidth;
  el.classList.add("btn-slide-in");
}

function setGaugesVisible(visible: boolean) {
  document.querySelectorAll<HTMLElement>(".controls .gauge").forEach((g) => {
    g.style.display = visible ? "" : "none";
  });
  document.querySelector(".controls")?.classList.toggle("choosing-mode", !visible);
}

function setMainBtnLabel(label: string, withDots = false) {
  if (withDots) {
    mainBtn.innerHTML = `<span class="btn-main-label">${label}</span><span class="btn-progress-dots" aria-hidden="true"><span></span><span></span><span></span></span>`;
  } else {
    mainBtn.textContent = label;
  }
}

function playActivate(el: HTMLElement): Promise<void> {
  return new Promise((resolve) => {
    el.classList.add("btn-activating");
    window.setTimeout(() => {
      el.classList.remove("btn-activating");
      resolve();
    }, 520);
  });
}

function decideCombatTier(day: number): string {
  return decideCombatTierFromData(data, day);
}

function markerIcon(marker: string): string {
  if (marker === "SWORD") return "⚔";
  if (marker === "SKULL") return "☠";
  if (marker === "SKULL_FINAL") return "👑";
  if (marker === "QUEST") return "?";
  return "•";
}

function combatTierLabel(tier: string): string {
  if (tier === "MINIBOSS" || tier === "PURIFY_MINIBOSS") return ui("ui_tier_elite");
  if (tier === "FINALBOSS" || tier === "PURIFY_FINAL") return ui("ui_tier_boss");
  if (tier === "PURIFY_WAVE1" || tier === "PURIFY_WAVE2") return "정화전";
  return ui("ui_tier_normal");
}

function combatTierClass(tier: string): string {
  if (tier === "MINIBOSS") return "tier-elite";
  if (tier === "FINALBOSS") return "tier-boss";
  return "tier-normal";
}

function refreshTimeline() {
  const marks = timelineMarks(data, Math.max(1, state.day), 5);
  if (marks.length === 0) {
    dayRoadmap.innerHTML = `<div class="road-track"><span class="road-day current">${state.day}일</span></div>`;
    return;
  }
  const nodes = marks
    .map((m) => {
      const cur = m.day === state.day ? " current" : m.day < state.day ? " past" : "";
      const kind =
        m.marker === "SKULL"
          ? " mark-elite"
          : m.marker === "SKULL_FINAL"
            ? " mark-boss"
            : m.marker === "SWORD"
              ? " mark-combat"
              : m.marker === "QUEST"
                ? " mark-quest"
                : "";
      return `<div class="road-node${cur}${kind}" title="${m.label || ""}"><span class="road-icon">${markerIcon(
        m.marker
      )}</span><span class="road-day">${m.day}</span><span class="road-label">${m.label || ""}</span></div>`;
    })
    .join('<span class="road-line" aria-hidden="true"></span>');
  dayRoadmap.innerHTML = `<div class="road-track">${nodes}</div>`;
}

/** 스탯바 연출용 직전 값 */
let prevStatSnap = { hp: -1, atk: -1, def: -1, gold: -1, level: -1 };
let goldAnimToken = 0;

function pulseStatEl(el: HTMLElement | null, up: boolean) {
  if (!el) return;
  el.classList.remove("stat-pulse-up", "stat-pulse-down");
  void el.offsetWidth;
  el.classList.add(up ? "stat-pulse-up" : "stat-pulse-down");
  window.setTimeout(() => {
    el.classList.remove("stat-pulse-up", "stat-pulse-down");
  }, 400);
}

function animateCountText(
  el: HTMLElement,
  from: number,
  to: number,
  ms: number,
  format: (n: number) => string
) {
  const token = ++goldAnimToken;
  const start = performance.now ? performance.now() : Date.now();
  const step = () => {
    if (token !== goldAnimToken) return;
    const now = performance.now ? performance.now() : Date.now();
    const t = Math.min(1, (now - start) / ms);
    const eased = 1 - Math.pow(1 - t, 2);
    const cur = Math.round(from + (to - from) * eased);
    el.textContent = format(cur);
    if (t < 1) window.setTimeout(step, 32);
    else el.textContent = format(to);
  };
  step();
}

/** 골드 증가 시 코인이 스탯바 GOLD로 날아감 */
function playGoldFly(fromGold: number, toGold: number) {
  const phone = document.querySelector(".phone") as HTMLElement | null;
  const goldEl = document.getElementById("statGold");
  const goldChip = goldEl?.closest(".stat-chip") as HTMLElement | null;
  if (!phone || !goldEl || !goldChip) {
    goldEl && (goldEl.textContent = formatStat(toGold));
    return;
  }

  const phoneRect = phone.getBoundingClientRect();
  const targetRect = goldChip.getBoundingClientRect();
  const endX = targetRect.left - phoneRect.left + targetRect.width / 2 - 9;
  const endY = targetRect.top - phoneRect.top + targetRect.height / 2 - 9;
  const delta = Math.max(0, toGold - fromGold);
  const count = Math.min(14, Math.max(6, Math.ceil(delta / 80) + 4));

  for (let i = 0; i < count; i++) {
    const coin = document.createElement("div");
    coin.className = "fly-coin";
    coin.textContent = "🪙";
    const startX = phoneRect.width * (0.18 + Math.random() * 0.64);
    const startY = phoneRect.height * (0.32 + Math.random() * 0.28);
    coin.style.left = `${startX}px`;
    coin.style.top = `${startY}px`;
    phone.appendChild(coin);
    const dx = endX - startX;
    const dy = endY - startY;
    window.setTimeout(() => {
      coin.style.transform = `translate(${dx}px, ${dy}px) scale(0.35)`;
      coin.style.opacity = "0.15";
    }, 30 + i * 45);
    window.setTimeout(() => coin.remove(), 780 + i * 45);
  }

  window.setTimeout(() => {
    goldChip.classList.remove("gold-catch");
    void goldChip.offsetWidth;
    goldChip.classList.add("gold-catch");
    window.setTimeout(() => goldChip.classList.remove("gold-catch"), 360);
  }, 420);

  animateCountText(goldEl, fromGold, toGold, 650, formatStat);
  pulseStatEl(goldEl, true);
}

function refreshStatbar() {
  // 스탯바 ATK/DEF = 이벤트·베이스만. 스킬 ATK_MULT(크라운 등)는 전투 피해에만 반영.
  const atkEl = document.getElementById("statAtk")!;
  const defEl = document.getElementById("statDef")!;
  const goldEl = document.getElementById("statGold")!;
  const levelEl = document.getElementById("statLevel")!;
  const hpTextEl = document.getElementById("hpText")!;
  const hpWrap = document.querySelector(".hp-bar-wrap") as HTMLElement | null;

  const next = {
    hp: state.hp,
    atk: state.atk,
    def: state.def,
    gold: state.gold,
    level: state.level,
  };
  const first = prevStatSnap.hp < 0;

  levelEl.textContent = String(next.level);
  atkEl.textContent = formatStat(next.atk);
  defEl.textContent = formatStat(next.def);
  hpTextEl.textContent = ui("ui_stat_hp_format", {
    hp: formatStat(next.hp),
    max: formatStat(state.maxHp),
  });
  (document.getElementById("hpFill") as HTMLElement).style.width = `${(state.hp / Math.max(1, state.maxHp)) * 100}%`;

  if (!first) {
    if (next.gold > prevStatSnap.gold) {
      playGoldFly(prevStatSnap.gold, next.gold);
    } else {
      goldEl.textContent = formatStat(next.gold);
      if (next.gold < prevStatSnap.gold) pulseStatEl(goldEl, false);
    }
    if (next.atk !== prevStatSnap.atk) pulseStatEl(atkEl, next.atk > prevStatSnap.atk);
    if (next.def !== prevStatSnap.def) pulseStatEl(defEl, next.def > prevStatSnap.def);
    if (Math.round(next.hp) !== Math.round(prevStatSnap.hp)) {
      pulseStatEl(hpTextEl, next.hp > prevStatSnap.hp);
      if (hpWrap) {
        hpWrap.classList.remove("stat-pulse-up", "stat-pulse-down");
        void hpWrap.offsetWidth;
        hpWrap.classList.add(next.hp > prevStatSnap.hp ? "stat-pulse-up" : "stat-pulse-down");
        window.setTimeout(() => hpWrap.classList.remove("stat-pulse-up", "stat-pulse-down"), 400);
      }
    }
    if (next.level !== prevStatSnap.level) pulseStatEl(levelEl, next.level > prevStatSnap.level);
  } else {
    goldEl.textContent = formatStat(next.gold);
  }

  prevStatSnap = next;

  const gj = gaugeValue(data, state, "gz_jackpot");
  const gm = gaugeValue(data, state, "gz_mid");
  gaugeJackpotEl.textContent = `${gj.current}/${gj.cap}`;
  gaugeMidEl.textContent = `${gm.current}/${gm.cap}`;
  refreshCurrencyBar();
  refreshTimeline();
}

function refreshCurrencyBar() {
  // 골드는 상단 스탯바에 이미 있으므로 재화바에는 그 외만 노출 (item_config 기준)
  const shown = data.currencies.filter((c) => {
    if (c.state_key === "gold") return false;
    const amount = currencyAmount(c);
    return c.always_show || amount > 0;
  });
  currencyBar.style.display = shown.length > 0 ? "flex" : "none";
  currencyBar.innerHTML = shown
    .map((c) => {
      const amount = currencyAmount(c);
      return `<span class="currency-chip" title="${c.label}">${c.icon} ${Math.round(amount)}</span>`;
    })
    .join("");
}

function currencyAmount(c: { state_key: string }): number {
  if (c.state_key.startsWith("inv:")) {
    return state.inventory[c.state_key.slice(4)] ?? 0;
  }
  return (state as unknown as Record<string, number>)[c.state_key] ?? 0;
}

function getControlsOverlayHeight(): number {
  const controls = document.querySelector(".controls") as HTMLElement | null;
  if (!controls || controls.offsetParent === null) return 148;
  const h = controls.getBoundingClientRect().height;
  return Math.max(120, Math.ceil(h));
}

/** 하단 도크에 가리지 않도록 feed 패딩을 실제 높이로 맞춤 */
function syncFeedBottomPad(extra = 20) {
  const h = getControlsOverlayHeight() + extra;
  feedEl.style.paddingBottom = `${h}px`;
  document.documentElement.style.setProperty("--controls-overlay-h", `${h}px`);
}

/**
 * 최신 로그가 하단 버튼 위에 완전히 보이도록 스크롤.
 * 정렬 기준 = 하단 끝점 (채팅처럼 항상 바닥 고정).
 */
function scrollFeedToBottom(opts?: { el?: HTMLElement | null; anticipatePx?: number }) {
  syncFeedBottomPad();
  const target =
    opts?.el ??
    (feedEl.lastElementChild instanceof HTMLElement ? feedEl.lastElementChild : null);
  const anticipate = Math.max(0, opts?.anticipatePx ?? 0);

  const align = () => {
    syncFeedBottomPad();
    // 1) 먼저 바닥으로 (상단 창 확대로 clientHeight가 줄어도 하단 유지)
    const maxScroll = Math.max(0, feedEl.scrollHeight - feedEl.clientHeight);
    feedEl.scrollTop = maxScroll;
    // 2) 타깃 카드가 도크에 가리면 추가 보정
    if (target && feedEl.contains(target)) {
      const feedRect = feedEl.getBoundingClientRect();
      const overlay = getControlsOverlayHeight();
      const visibleBottom = feedRect.bottom - overlay;
      const tRect = target.getBoundingClientRect();
      const overflow = tRect.bottom + anticipate - visibleBottom;
      if (overflow > 0) {
        feedEl.scrollTop += overflow + 10;
      }
    }
  };

  align();
  requestAnimationFrame(() => {
    align();
    requestAnimationFrame(align);
  });
  window.setTimeout(align, 60);
  window.setTimeout(align, 220);
  window.setTimeout(align, 420);
}

/** 카드가 커지는 동안(칩 출현 등) 계속 따라 올리기 */
function watchFeedCardGrowth(card: HTMLElement, ms = 900) {
  const ro = new ResizeObserver(() => {
    scrollFeedToBottom({ el: card, anticipatePx: 28 });
  });
  ro.observe(card);
  window.setTimeout(() => ro.disconnect(), ms);
}

/** 상단 스테이지 높이 변화 → 피드 하단 재정렬 */
let feedLayoutGuardBound = false;
function bindFeedLayoutGuards() {
  if (feedLayoutGuardBound) return;
  feedLayoutGuardBound = true;
  const ro = new ResizeObserver(() => {
    scrollFeedToBottom({ anticipatePx: 10 });
  });
  ro.observe(feedEl);
  ro.observe(visualStage);
  visualStage.addEventListener("transitionend", (e) => {
    if (e.propertyName === "height" || e.propertyName === "max-height") {
      scrollFeedToBottom({ anticipatePx: 12 });
    }
  });
}

function ensureDayHeader(day: number) {
  if (day === lastDayShown) return;
  lastDayShown = day;
  const el = document.createElement("div");
  el.className = "day-header";
  el.textContent = ui("ui_day_header", { day });
  feedEl.appendChild(el);
  scrollFeedToBottom();
}

interface CardOptions {
  /** 슬롯/기본 1줄 */
  body: string;
  /** 슬롯 종료 후 펼쳐지는 2줄째 (원작 대박 구조) */
  bodyLine2?: string;
  grade?: GradeDef | null;
  effectLines?: string[];
  scramble?: boolean;
  /** 대박: 로그 카드 본문이 슬롯처럼 3초 회전 후 확정 */
  jackpotSlot?: boolean;
}

/** 대박 카드 슬롯에 돌릴 후보 스토리 1줄 */
function jackpotSlotCandidates(finalText: string): string[] {
  const labels: string[] = [];
  const seen = new Set<string>();
  for (const row of data.dailyPool) {
    if (row.grade_id !== "g_jackpot" && row.grade_id !== "g_mid" && row.grade_id !== "g_bonus") {
      continue;
    }
    const t = textFor(data, row.text_id);
    if (!t || t === finalText || seen.has(t)) continue;
    seen.add(t);
    labels.push(t);
  }
  return shuffle(labels);
}

function paintCardLines(line1: string, line2?: string): string {
  const l1 = `<div class="card-line">${highlightKeywords(data, line1)}</div>`;
  if (line2 && line2.trim()) {
    return `${l1}<div class="card-line card-line2">${highlightKeywords(data, line2)}</div>`;
  }
  return l1;
}

/** 텍스트 종료 후 효과칩을 하나씩 타격감 있게 출현 (전역 공통) */
async function revealEffectChips(card: HTMLElement, lines: string[]) {
  if (lines.length === 0) return;
  watchFeedCardGrowth(card, 400 + lines.length * 400);
  await sleep(220);
  const wrap = document.createElement("div");
  wrap.className = "effect-chip-wrap";
  card.appendChild(wrap);
  scrollFeedToBottom({ el: card, anticipatePx: 48 });

  for (const line of lines) {
    const skillParsed = parseSkillRewardLine(line);
    if (skillParsed) {
      const sk = data.skills.find((s) => s.skill_name === skillParsed.name);
      const row = buildSkillRewardRow(skillParsed.name, sk?.icon || "✦", skillParsed.upgraded);
      wrap.appendChild(row);
      void row.offsetWidth;
      row.classList.add("skill-reward-in");
      renderStageSkillIcons();
      scrollFeedToBottom({ el: card, anticipatePx: 40 });
      await sleep(360);
      continue;
    }
    const chip = document.createElement("div");
    const isNeg = /-/.test(line);
    chip.className = "effect-chip" + (isNeg ? " neg" : "");
    const m = line.match(/^(\S+)\s+(.+)$/u);
    if (m) {
      chip.innerHTML = `<span class="effect-chip-icon" aria-hidden="true">${m[1]}</span><span class="effect-chip-label">${m[2]}</span>`;
    } else {
      chip.innerHTML = `<span class="effect-chip-label">${line}</span>`;
    }
    wrap.appendChild(chip);
    void chip.offsetWidth;
    chip.classList.add("effect-chip-in");
    scrollFeedToBottom({ el: card, anticipatePx: 40 });
    await sleep(320);
  }
  await sleep(120);
  scrollFeedToBottom({ el: card, anticipatePx: 12 });
}

/** 원작: 「보상을 획득했습니다.」+ 세로「스킬」+ 원형아이콘 + 「이름 학습」칩 */
function parseSkillRewardLine(line: string): { name: string; upgraded: boolean } | null {
  const up = line.match(/^스킬\s+(.+)\s+강화\(\+\)$/u);
  if (up) return { name: up[1], upgraded: true };
  const learn = line.match(/^스킬\s+(.+)\s+학습$/u);
  if (learn) return { name: learn[1], upgraded: false };
  return null;
}

function buildSkillRewardRow(name: string, icon: string, upgraded: boolean): HTMLElement {
  const row = document.createElement("div");
  row.className = "skill-reward-row";
  const kind = document.createElement("span");
  kind.className = "skill-reward-kind";
  kind.textContent = ui("ui_skill_kind_label");
  const iconEl = document.createElement("span");
  iconEl.className = "skill-reward-icon";
  iconEl.setAttribute("aria-hidden", "true");
  iconEl.textContent = icon || "✦";
  const chip = document.createElement("span");
  chip.className = "skill-reward-chip" + (upgraded ? " upgraded" : "");
  chip.textContent = ui(upgraded ? "ui_skill_upgrade_chip" : "ui_skill_learn_chip", { name });
  row.appendChild(kind);
  row.appendChild(iconEl);
  row.appendChild(chip);
  return row;
}

async function appendSkillLearnReward(opts: {
  name: string;
  icon?: string;
  upgraded?: boolean;
}): Promise<HTMLElement> {
  const card = document.createElement("div");
  card.className = "card skill-reward-card";
  const title = document.createElement("div");
  title.className = "skill-reward-title";
  title.textContent = ui("ui_reward_get");
  const row = buildSkillRewardRow(opts.name, opts.icon || "✦", !!opts.upgraded);
  card.appendChild(title);
  card.appendChild(row);
  feedEl.appendChild(card);
  watchFeedCardGrowth(card, 700);
  scrollFeedToBottom({ el: card, anticipatePx: 36 });
  await sleep(80);
  void row.offsetWidth;
  row.classList.add("skill-reward-in");
  scrollFeedToBottom({ el: card, anticipatePx: 16 });
  await sleep(420);
  return card;
}

async function presentSkillLearnedFeedback(got: { name: string; upgraded: boolean; icon?: string }) {
  const sk = data.skills.find((s) => s.skill_name === got.name);
  await appendSkillLearnReward({
    name: got.name,
    icon: got.icon || sk?.icon || "✦",
    upgraded: got.upgraded,
  });
}

async function appendCard(opts: CardOptions): Promise<HTMLElement> {
  const isBad = opts.grade?.is_negative ?? false;
  const isImpact = isBad || (opts.effectLines?.some((l) => /-/.test(l)) ?? false);
  const isJackpotSlot = !!opts.jackpotSlot;
  const card = document.createElement("div");
  const gradeCardClass = opts.grade?.card_css_class || (opts.grade ? `grade-${opts.grade.grade_name}` : "");
  card.className =
    "card" +
    (gradeCardClass ? ` ${gradeCardClass}` : "") +
    (isImpact ? " impact" : "") +
    (isBad ? " torn" : "") +
    (isJackpotSlot ? " jackpot-slotting" : "");
  const bodyEl = document.createElement("div");
  bodyEl.className = "card-body" + (isJackpotSlot ? " card-slot-mask" : "");
  card.appendChild(bodyEl);

  if (opts.grade) {
    const tag = document.createElement("div");
    tag.className = `card-tag tag-${opts.grade.grade_name}`;
    tag.textContent = opts.grade.grade_name;
    card.appendChild(tag);
  }

  feedEl.appendChild(card);
  watchFeedCardGrowth(card, 1400);
  scrollFeedToBottom({ el: card, anticipatePx: opts.effectLines?.length ? 72 : 24 });

  const paintPlain = (plain: string) => highlightKeywords(data, plain);
  if (isJackpotSlot) {
    /*
      원작 대박 구조:
      1) 슬롯 중 = body(1줄)만 회전
      2) 종료 = body + body_line2 펼침 + 창 살짝 축소→원복
      3) 효과칩 차례 출현 (타격감)
    */
    const track = document.createElement("div");
    track.className = "card-slot-track";
    bodyEl.appendChild(track);
    const candidates = jackpotSlotCandidates(opts.body);
    const slotMs = tuningNum(data, "jackpot_slot_ms", 3200);
    const slotStep = tuningNum(data, "jackpot_slot_step_ms", 44);
    await rollCardTextSlot(track, candidates, opts.body, slotMs, slotStep, paintPlain);
    card.classList.remove("jackpot-slotting");
    bodyEl.className = "card-body";
    bodyEl.innerHTML = paintCardLines(opts.body, opts.bodyLine2);
    void card.offsetWidth;
    card.classList.add("jackpot-slot-pop");
    await sleep(380);
    card.classList.remove("jackpot-slot-pop");
    card.classList.add("jackpot-slot-done");
  } else if (opts.scramble) {
    await scrambleReveal(bodyEl, opts.body, 550, (plain) => paintCardLines(plain, opts.bodyLine2));
  } else {
    bodyEl.innerHTML = paintCardLines(opts.body, opts.bodyLine2);
    if (opts.bodyLine2?.trim()) {
      await sleep(120);
    }
  }

  if (opts.effectLines && opts.effectLines.length > 0) {
    await revealEffectChips(card, opts.effectLines);
  } else {
    await sleep(isImpact ? 220 : 160);
  }

  scrollFeedToBottom({ el: card, anticipatePx: 16 });
  refreshStatbar();

  // 하단 카드 ↔ 상단 상황창 동기 (전투 중·전투 대기·구조 조우 제외 — 각자 전용 상단 연출 유지)
  if (currentStageModeId !== "COMBAT" && currentStageModeId !== "COMBAT_WAIT" && currentStageModeId !== "RESCUE") {
    const bodyHead = stageHeadline(opts.body, 40);
    if (currentStageModeId === "LOCATION_ARRIVE" || currentStageModeId === "LOCATION_FIND") {
      // 도착/발견 타이틀은 유지하고, 부제만 로그 본문으로
      stageSub.textContent = bodyHead;
      if (lastStageScene) lastStageScene = { ...lastStageScene, subtitle: bodyHead };
    } else if (currentStageModeId === "BRANCH") {
      stageSub.textContent = bodyHead;
      if (lastStageScene) lastStageScene = { ...lastStageScene, subtitle: bodyHead };
    } else {
      const gradeName = opts.grade?.grade_name;
      syncStageWithLog({
        modeId: "EVENT",
        title: gradeName ? ui("ui_stage_reward_title", { grade: gradeName }) : stageHeadline(opts.body),
        subtitle: gradeName ? bodyHead : opts.bodyLine2?.trim() || mapIdleSubtitle(),
        clearLog: false,
      });
    }
  }

  return card;
}

function gradeBannerClass(grade: GradeDef): string {
  return grade.css_key || "";
}

async function playGradeBanner(grade: GradeDef) {
  // 버튼 위 등급 워드아트 (원작식 임팩트 타이포)
  const gradeClass = gradeBannerClass(grade);
  const name = grade.grade_name;
  bannerOverlay.style.display = "flex";
  bannerOverlay.className = `banner-overlay banner-dock ${gradeClass}`;
  bannerText.style.color = "";
  bannerText.style.textShadow = "";
  bannerText.className = `banner-text banner-pop-in ${gradeClass}`;
  bannerText.innerHTML = `<span class="banner-stroke" aria-hidden="true">${name}</span><span class="banner-shine" aria-hidden="true">${name}</span><span class="banner-fill">${name}</span>`;
  void bannerText.offsetWidth;
  await sleep(grade.banner_ms || (grade.is_jackpot ? 3200 : 1400));
  bannerOverlay.style.display = "none";
  bannerOverlay.className = "banner-overlay";
  bannerText.className = "banner-text";
  bannerText.innerHTML = "";
}

async function playSplash(title: string, ms = 1100) {
  splashTitle.textContent = title;
  splashOverlay.style.display = "flex";
  await sleep(ms);
  splashOverlay.style.display = "none";
}

/** FULL 영상: 좌(청) / 우(적) 프레임 + VS + 등급 배지 */
async function playCombatVsIntro(opts: {
  tier: string;
  enemyName: string;
  enemyIcon: string;
}) {
  const tierLabel = combatTierLabel(opts.tier);
  const tierCls = combatTierClass(opts.tier);
  vsPlayerIcon.textContent = tuningStr(data, "player_icon", "🦫");
  vsPlayerName.textContent = ui("ui_vs_player");
  vsEnemyIcon.textContent = opts.enemyIcon || "👾";
  vsEnemyName.textContent = opts.enemyName;
  vsTierBadge.textContent = tierLabel;
  vsTierBadge.className = `vs-tier ${tierCls}`;
  vsOverlay.className = `vs-overlay ${tierCls}`;
  vsOverlay.style.display = "flex";
  vsOverlay.setAttribute("aria-hidden", "false");
  await sleep(tuningNum(data, "vs_intro_ms", 1400));
  vsOverlay.style.display = "none";
  vsOverlay.setAttribute("aria-hidden", "true");
  vsOverlay.className = "vs-overlay";
}

/** 슬롯/미니게임 종료 후 「보상」팝업 (탭해서 닫기) */
function showRewardModal(opts: { icon: string; qtyLabel: string; title?: string; desc?: string; iconHtml?: string }): Promise<void> {
  return new Promise((resolve) => {
    rewardModalTitle.textContent = opts.title || ui("ui_reward_modal_title");
    if (opts.iconHtml) rewardModalIcon.innerHTML = opts.iconHtml;
    else rewardModalIcon.textContent = opts.icon || "🪙";
    rewardModalQty.textContent = opts.qtyLabel;
    if (opts.desc) {
      rewardModalDesc.textContent = opts.desc;
      rewardModalDesc.style.display = "block";
    } else {
      rewardModalDesc.style.display = "none";
    }
    rewardModalSparks.innerHTML = Array.from({ length: 10 }, (_, i) => {
      const left = 8 + ((i * 37) % 84);
      const top = 10 + ((i * 53) % 70);
      const delay = (i % 5) * 0.12;
      return `<span class="reward-spark" style="left:${left}%;top:${top}%;animation-delay:${delay}s"></span>`;
    }).join("");
    rewardModal.style.display = "flex";
    void rewardModal.offsetWidth;
    rewardModal.classList.add("reward-modal-in");

    const close = () => {
      rewardModal.removeEventListener("click", close);
      rewardModal.classList.remove("reward-modal-in");
      rewardModal.style.display = "none";
      resolve();
    };
    rewardModal.addEventListener("click", close);
  });
}

/** XOOX 동료 합류 — 화려한 스파크 연출로 획득(기존 보상 모달 재사용) + 효과 설명 표시. */
/** 슬롯이 꽉 찼을 때 교체 결정 — 방출할 동료의 member_id 반환(거절 시 null) */
function presentPartySwap(newMember: PartyMemberDef): Promise<string | null> {
  return new Promise((resolve) => {
    const petBlock = (m: PartyMemberDef, size: number) =>
      `<div class="swap-pet-icon">${petHeadMarkup(m.icon, petNeonColor(m.member_id), size)}</div>` +
      `<div class="swap-pet-name">${m.display_name}</div>` +
      `<div class="swap-pet-eff">${m.description}</div>`;
    swapNew.innerHTML = `<div class="swap-pet new">${petBlock(newMember, 44)}</div>`;
    const roster = state.joinedPartyMembers
      .map((id) => data.partyMembers.find((m) => m.member_id === id))
      .filter((m): m is PartyMemberDef => !!m);
    swapRoster.innerHTML = roster
      .map((m) => `<button type="button" class="swap-pet slot" data-id="${m.member_id}">${petBlock(m, 38)}</button>`)
      .join("");
    const close = () => {
      swapModal.style.display = "none";
    };
    swapRoster.querySelectorAll<HTMLButtonElement>("button[data-id]").forEach((btn) => {
      btn.onclick = async () => {
        await playActivate(btn);
        close();
        resolve(btn.dataset.id ?? null);
      };
    });
    swapDecline.onclick = async () => {
      await playActivate(swapDecline);
      close();
      resolve(null);
    };
    swapModal.style.display = "flex";
    void swapModal.offsetWidth;
    swapModal.classList.add("in");
    window.setTimeout(() => swapModal.classList.remove("in"), 50);
  });
}

async function showPetAcquiredModal(member: { member_id?: string; icon: string; display_name: string; description: string }): Promise<void> {
  await showRewardModal({
    icon: member.icon,
    iconHtml: petHeadMarkup(member.icon, petNeonColor(member.member_id ?? member.display_name), 56),
    qtyLabel: member.display_name,
    title: "🐾 동료 합류!",
    desc: member.description,
  });
}

function rewardModalFromEffect(effectId: string): { icon: string; qtyLabel: string } | null {
  const effect = data.effects.find((e) => e.effect_id === effectId);
  if (!effect) return null;
  if (effect.effect_type === "CURRENCY" && effect.target === "GOLD") {
    return { icon: effect.icon || "🪙", qtyLabel: `x${Math.round(effect.value)}` };
  }
  if (effect.effect_type === "CURRENCY") {
    return { icon: effect.icon || "🎁", qtyLabel: `x${Math.round(Math.abs(effect.value))}` };
  }
  return { icon: effect.icon || "🎁", qtyLabel: effect.description || ui("ui_mg_reward") };
}

function previewDeclineTheme(branch: BranchDef): "devil" | "medusa" | "generic" {
  if (branch.branch_id.includes("devil")) return "devil";
  if (branch.branch_id.includes("medusa")) return "medusa";
  return "generic";
}

function formatPreviewCost(effectId: string): { html: string } | null {
  const ef = data.effects.find((e) => e.effect_id === effectId);
  if (!ef) return null;
  if (ef.target === "MAX_HP" && ef.effect_type === "STAT_ABS") {
    const n = Math.abs(Math.round(ef.value));
    return {
      html: `<span class="devil-cost-max">${ui("ui_devil_cost_max")}</span><span class="devil-cost-heart">❤️</span><span class="devil-cost-text">${ui(
        "ui_devil_cost_hp",
        { n }
      )}</span>`,
    };
  }
  return {
    html: `<span class="devil-cost-heart">${ef.icon || "💔"}</span><span class="devil-cost-text">${ef.description}</span>`,
  };
}

function previewRewardSkillHtml(effectId: string): string {
  const ef = data.effects.find((e) => e.effect_id === effectId);
  if (!ef) return "";
  const direct =
    ef.skill_id && !ef.skill_id.startsWith("POOL_")
      ? data.skills.find((s) => s.skill_id === ef.skill_id)
      : undefined;
  if (direct) {
    const tierClass = `tier-${direct.tier}`;
    return `<div class="devil-skill-card">
      <div class="devil-skill-badge ${tierClass}">${direct.tier}</div>
      <div class="devil-skill-icon">${direct.icon || "⚔️"}</div>
      <div class="devil-skill-meta">
        <div class="devil-skill-name">${direct.skill_name}</div>
        <div class="devil-skill-desc">${direct.effect_text}</div>
      </div>
    </div>`;
  }
  return `<div class="devil-skill-card plain">
    <div class="devil-skill-icon">${ef.icon || "🎁"}</div>
    <div class="devil-skill-meta">
      <div class="devil-skill-name">${ef.description}</div>
    </div>
  </div>`;
}

/** PREVIEW_DECLINE: 원작형 계약/응시 모달 → A 거절 / B 수락 */
function presentPreviewDeclineModal(branch: BranchDef): Promise<"A" | "B"> {
  return new Promise((resolve) => {
    const theme = previewDeclineTheme(branch);
    devilModalPanel.className = `devil-modal-panel theme-${theme}`;
    devilMascot.textContent = theme === "medusa" ? "📷" : theme === "devil" ? "🧳" : "❔";

    if (theme === "devil") {
      devilBanner.textContent = ui("ui_devil_banner");
      const hl = `<em>${ui("ui_devil_ask_hl")}</em>`;
      devilAsk.innerHTML = ui("ui_devil_ask", { hl });
    } else if (theme === "medusa") {
      devilBanner.textContent = ui("ui_medusa_banner");
      devilAsk.textContent = ui("ui_medusa_ask");
    } else {
      devilBanner.textContent = stageHeadline(textFor(data, branch.text_id), 24);
      devilAsk.textContent = textFor(data, branch.text_id);
    }

    const costId = getBranchCostEffectId(branch, "B");
    const cost = costId ? formatPreviewCost(costId) : null;
    devilCost.style.display = cost ? "" : "none";
    devilCost.innerHTML = cost?.html ?? "";

    const rewardId = branch.option_b_effect_id;
    devilSkill.innerHTML = rewardId ? previewRewardSkillHtml(rewardId) : "";

    devilRefuseBtn.textContent = branch.option_a_label || ui("ui_preview_refuse");
    devilAcceptBtn.textContent = branch.option_b_label || ui("ui_preview_accept");

    mainBtn.style.display = "none";
    setGaugesVisible(false);
    choiceButtons.style.display = "none";

    devilModal.style.display = "flex";
    devilModal.setAttribute("aria-hidden", "false");
    void devilModal.offsetWidth;
    devilModal.classList.add("devil-modal-in");

    const finish = async (side: "A" | "B", btn: HTMLButtonElement) => {
      devilRefuseBtn.onclick = null;
      devilAcceptBtn.onclick = null;
      await playActivate(btn);
      devilModal.classList.remove("devil-modal-in");
      devilModal.style.display = "none";
      devilModal.setAttribute("aria-hidden", "true");
      mainBtn.style.display = "";
      setGaugesVisible(true);
      resolve(side);
    };
    devilRefuseBtn.onclick = () => finish("A", devilRefuseBtn);
    devilAcceptBtn.onclick = () => finish("B", devilAcceptBtn);
  });
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildWheelSvg(pool: MinigameRewardRow[]): string {
  const N = pool.length;
  const cx = 120,
    cy = 120,
    r = 112;
  let s = "";
  for (let i = 0; i < N; i++) {
    const { icon, text, color } = rewardRowLabel(data, pool[i]);
    const a0 = ((i * 360) / N - 90) * (Math.PI / 180);
    const a1 = (((i + 1) * 360) / N - 90) * (Math.PI / 180);
    const x0 = cx + r * Math.cos(a0),
      y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1),
      y1 = cy + r * Math.sin(a1);
    const large = 360 / N > 180 ? 1 : 0;
    s += `<path d="M${cx},${cy} L${x0.toFixed(1)},${y0.toFixed(1)} A${r},${r} 0 ${large} 1 ${x1.toFixed(1)},${y1.toFixed(1)} Z" fill="${color}" stroke="#1b1b2a" stroke-width="2"/>`;
    const am = (((i + 0.5) * 360) / N - 90) * (Math.PI / 180);
    const lr = r * 0.66;
    const lx = cx + lr * Math.cos(am),
      ly = cy + lr * Math.sin(am);
    const rot = ((i + 0.5) * 360) / N;
    s += `<g transform="rotate(${rot.toFixed(1)} ${lx.toFixed(1)} ${ly.toFixed(1)})"><text x="${lx.toFixed(
      1
    )}" y="${(ly - 5).toFixed(1)}" font-size="17" text-anchor="middle">${icon}</text><text x="${lx.toFixed(
      1
    )}" y="${(ly + 10).toFixed(1)}" font-size="8" fill="#1b1b2a" font-weight="700" text-anchor="middle">${text}</text></g>`;
  }
  return `<svg viewBox="0 0 240 240" width="240" height="240">${s}</svg>`;
}

async function renderWheel(pool: MinigameRewardRow[], winIndex: number) {
  const N = pool.length;
  minigameStage.innerHTML = `<div class="wheel-wrap"><div class="wheel-pointer"></div><div class="wheel-spin" id="wheelSpin">${buildWheelSvg(
    pool
  )}</div><div class="wheel-hub"></div></div>`;
  const spinEl = document.getElementById("wheelSpin") as HTMLElement;
  spinEl.style.transform = "rotate(0deg)";
  await sleep(60);
  const target = 360 * 5 - ((winIndex + 0.5) * 360) / N;
  spinEl.style.transition = "transform 3.4s cubic-bezier(0.15,0.72,0.15,1)";
  spinEl.style.transform = `rotate(${target}deg)`;
  await sleep(3600);
}

async function renderSlot(pool: MinigameRewardRow[], winIndex: number) {
  const winIcon = rewardRowLabel(data, pool[winIndex]).icon;
  const allIcons = pool.map((r) => rewardRowLabel(data, r).icon);
  minigameStage.innerHTML = `<div class="slot-machine"><div class="slot-reel" id="sr0">❔</div><div class="slot-reel" id="sr1">❔</div><div class="slot-reel" id="sr2">❔</div></div>`;
  const reels = [0, 1, 2].map((i) => document.getElementById("sr" + i) as HTMLElement);
  const timers = reels.map((el) =>
    window.setInterval(() => {
      el.textContent = allIcons[Math.floor(Math.random() * allIcons.length)];
    }, 80)
  );
  for (let i = 0; i < 3; i++) {
    await sleep(650 + i * 450);
    window.clearInterval(timers[i]);
    reels[i].textContent = winIcon;
    reels[i].classList.add("slot-lock");
  }
  await sleep(450);
}

/** 보물 파내기 티어 아이콘 (0=상·1=중·2=하) */
function digTreasureHtml(tier: number): string {
  const t = Math.min(2, Math.max(0, tier));
  if (t === 0) {
    return `<span class="dt dt-top" aria-hidden="true"><i></i><em>★</em></span>`;
  }
  if (t === 1) {
    return `<span class="dt dt-mid" aria-hidden="true"><i></i></span>`;
  }
  return `<span class="dt dt-low" aria-hidden="true"><i></i></span>`;
}

function digDirtBurstHtml(): string {
  return `<span class="dig-dirt" aria-hidden="true">${Array.from(
    { length: 6 },
    (_, i) => `<b style="--i:${i}"></b>`
  ).join("")}</span>`;
}

/** 원작 보물 파내기: 구멍 클릭 → 공개, 같은 아이템 3개 선착 보상(상/중/하) */
async function playCardMatchDig(pool: MinigameRewardRow[]): Promise<MinigameRewardRow> {
  const types = pool.slice(0, 3);
  while (types.length < 3) types.push(pool[pool.length - 1] ?? pool[0]);

  const cells: { typeIdx: number }[] = [];
  for (let t = 0; t < 3; t++) {
    for (let n = 0; n < 4; n++) cells.push({ typeIdx: t });
  }
  const board = shuffle(cells);

  const legend = types
    .map((r, i) => {
      return `<div class="dig-legend-row" data-type="${i}">
        <div class="dig-legend-head">
          <span class="dig-legend-icons" aria-hidden="true">
            <i class="off">${digTreasureHtml(i)}</i>
            <i class="off">${digTreasureHtml(i)}</i>
            <i class="off">${digTreasureHtml(i)}</i>
          </span>
          <span class="dig-legend-count" data-count>0/3</span>
        </div>
        <span class="dig-legend-label">${r.label}</span>
      </div>`;
    })
    .join("");

  minigameActionBtn.style.display = "none";
  minigameStage.innerHTML = `<div class="dig-shell">
    <div class="dig-ribbon"><span>${ui("ui_mg_dig_title")}</span></div>
    <div class="dig-map">
      <p class="dig-hint">${ui("ui_mg_card_sub")}</p>
      <div class="dig-board">
        <div class="dig-legend">${legend}</div>
        <div class="dig-grid" role="grid" aria-label="${ui("ui_mg_card_sub")}">
          ${board
            .map(
              (_, i) =>
                `<button type="button" class="dig-hole" data-idx="${i}" aria-label="${ui("ui_mg_dig_tap")}">
                  <span class="dig-hole-lid" aria-hidden="true">
                    <span class="dig-hole-glyph">⚔</span>
                  </span>
                </button>`
            )
            .join("")}
        </div>
      </div>
    </div>
  </div>`;

  const updateLegend = (typeIdx: number, count: number) => {
    const row = minigameStage.querySelector(`.dig-legend-row[data-type="${typeIdx}"]`);
    if (!row) return;
    const countEl = row.querySelector("[data-count]");
    if (countEl) countEl.textContent = `${Math.min(3, count)}/3`;
    row.querySelectorAll(".dig-legend-icons > i").forEach((el, i) => {
      el.classList.toggle("on", i < count);
      el.classList.toggle("off", i >= count);
    });
    if (count > 0) row.classList.add("active");
  };

  return new Promise((resolve) => {
    const counts = [0, 0, 0];
    const revealedIdx: number[][] = [[], [], []];
    let finished = false;
    let busy = false;

    minigameStage.querySelectorAll<HTMLButtonElement>(".dig-hole").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (finished || busy || btn.classList.contains("revealed")) return;
        busy = true;
        const idx = Number(btn.dataset.idx);
        const cell = board[idx];

        btn.classList.add("digging");
        btn.insertAdjacentHTML("beforeend", digDirtBurstHtml());
        await sleep(160);
        btn.disabled = true;
        btn.classList.remove("digging");
        btn.classList.add("revealed", "dig-pop");
        btn.innerHTML = `<span class="dig-hole-item" aria-hidden="true">${digTreasureHtml(
          cell.typeIdx
        )}</span>`;

        counts[cell.typeIdx] += 1;
        revealedIdx[cell.typeIdx].push(idx);
        updateLegend(cell.typeIdx, counts[cell.typeIdx]);
        busy = false;

        if (counts[cell.typeIdx] < 3) return;

        finished = true;
        minigameStage.querySelector(".dig-map")?.classList.add("dig-won");
        minigameStage.querySelectorAll<HTMLButtonElement>(".dig-hole").forEach((b) => {
          b.disabled = true;
          if (!b.classList.contains("revealed")) b.classList.add("dimmed");
        });
        for (const hit of revealedIdx[cell.typeIdx].slice(0, 3)) {
          minigameStage.querySelector(`.dig-hole[data-idx="${hit}"]`)?.classList.add("matched");
        }
        minigameStage
          .querySelector(`.dig-legend-row[data-type="${cell.typeIdx}"]`)
          ?.classList.add("won");
        const hint = minigameStage.querySelector(".dig-hint");
        if (hint) hint.textContent = ui("ui_mg_dig_found", { name: types[cell.typeIdx].label });
        window.setTimeout(() => resolve(types[cell.typeIdx]), 980);
      });
    });
  });
}

async function runSkillSwap() {
  // 스킬은 룰렛이 아니라 선택 UI (원작: 교체 후에도 카드 선택). +강화본도 파괴 대상.
  const owned = state.learnedSkills
    .map((id) => data.skills.find((s) => s.skill_id === id))
    .filter((s): s is SkillDef => !!s);
  if (owned.length === 0) {
    await appendCard({ body: ui("ui_skillswap_none") });
    return;
  }
  const destroyed = owned[randInt(0, owned.length - 1)];
  state.learnedSkills = state.learnedSkills.filter((id) => id !== destroyed.skill_id);
  renderStageSkillIcons();
  refreshStatbar();
  await appendCard({ body: ui("ui_skillswap_destroy", { name: destroyed.skill_name }) });

  const candidates = pickSkillChoices(data, state, "일반", 3);
  if (candidates.length === 0) return;
  const chosen = await presentSkillChoice(ui("ui_btn_skill_choice"), ui("ui_skill_sub"), candidates);
  if (!chosen) return;
  const got = applyLearnedSkill(chosen.skill_id);
  if (!got) return;
  await presentSkillLearnedFeedback(got);
}

function waitMainButton(label: string): Promise<void> {
  return new Promise((resolve) => {
    setMainBtnLabel(label);
    mainBtn.disabled = false;
    mainBtn.className = "main-btn idle";
    slideIn(mainBtn);
    pendingMainAction = () => {
      pendingMainAction = null;
      mainBtn.disabled = true;
      resolve();
    };
  });
}

/** 미니게임 패널 위 액션 버튼 대기 (패널이 메인 버튼을 가리므로 GOLD_SLOT 등에서 사용) */
function waitMinigameAction(label: string): Promise<void> {
  return new Promise((resolve) => {
    minigameActionBtn.style.display = "";
    minigameActionBtn.disabled = false;
    minigameActionBtn.textContent = label;
    minigameActionBtn.onclick = () => {
      minigameActionBtn.onclick = null;
      minigameActionBtn.disabled = true;
      minigameActionBtn.style.display = "none";
      resolve();
    };
  });
}

function showChestIntro(): Promise<void> {
  return new Promise((resolve) => {
    minigamePanel.style.display = "flex";
    minigameTitle.textContent = ui("ui_chest_found");
    minigameSub.textContent = "";
    minigameResult.textContent = "";
    minigameStage.innerHTML = `<div class="chest-box chest-glow">🎁</div>`;
    minigameActionBtn.style.display = "";
    minigameActionBtn.textContent = ui("ui_btn_pickup");
    minigameActionBtn.onclick = () => {
      minigameActionBtn.style.display = "none";
      minigamePanel.style.display = "none";
      resolve();
    };
  });
}

/** 골드 슬롯 티어 1~4 → 동전 1·2·3 / 대박주머니 */
const LUCKY_CELL_H = 78;

function luckyCoinHtml(tier: number): string {
  const t = Math.min(4, Math.max(1, tier));
  if (t === 1) return `<span class="lc lc-1" aria-hidden="true"><i></i></span>`;
  if (t === 2) return `<span class="lc lc-2" aria-hidden="true"><i></i><i></i></span>`;
  if (t === 3) return `<span class="lc lc-3" aria-hidden="true"><i></i><i></i><i></i></span>`;
  return `<span class="lc lc-bag" aria-hidden="true"><i></i><i></i><i></i><em>★</em></span>`;
}

function luckyCellHtml(tierOrQ: number | "q"): string {
  if (tierOrQ === "q") {
    return `<div class="lucky-cell lucky-q">${ui("ui_mg_lucky_hidden")}</div>`;
  }
  return `<div class="lucky-cell">${luckyCoinHtml(tierOrQ)}</div>`;
}

function setLuckyTicker(text: string) {
  const el = document.querySelector(".lucky-ticker");
  if (el) el.textContent = text;
}

function setupGoldSlotIdle() {
  const title = ui("ui_mg_lucky_title");
  const sub = ui("ui_mg_lucky_sub");
  minigameStage.innerHTML = `<div class="lucky-treasure">
    <div class="lucky-ribbon"><span>${title}</span></div>
    <div class="lucky-machine">
      <span class="lucky-ear left" aria-hidden="true"></span>
      <span class="lucky-ear right" aria-hidden="true"></span>
      <div class="lucky-ticker">${sub}</div>
      <div class="lucky-reels">
        ${[0, 1, 2]
          .map(
            (i) => `<div class="lucky-reel${i === 2 ? " is-final" : ""}" id="gr${i}">
            <div class="lucky-window">
              <div class="lucky-strip" id="gs${i}">${luckyCellHtml("q")}</div>
            </div>
          </div>`
          )
          .join("")}
      </div>
      <div class="lucky-sparkles" aria-hidden="true"></div>
    </div>
  </div>`;
}

/** 한 릴: 세로 스트립을 durationMs 동안 돌려 finalTier에 맞춤 */
function spinLuckyReel(idx: number, finalTier: number, durationMs: number): Promise<void> {
  return new Promise((resolve) => {
    const strip = document.getElementById("gs" + idx) as HTMLElement | null;
    const reel = document.getElementById("gr" + idx);
    if (!strip) {
      resolve();
      return;
    }
    reel?.classList.remove("locked", "reveal");
    reel?.classList.add("spinning");
    const pad = idx === 2 ? 22 : 12 + idx * 2;
    const seq: Array<number | "q"> = [];
    for (let i = 0; i < pad; i++) seq.push(1 + Math.floor(Math.random() * 4));
    seq.push(finalTier);
    strip.innerHTML = seq.map((t) => luckyCellHtml(t)).join("");
    strip.style.transition = "none";
    strip.style.transform = "translateY(0px)";
    void strip.offsetWidth;
    const targetY = -(seq.length - 1) * LUCKY_CELL_H;
    const ease = idx === 2 ? "cubic-bezier(0.08, 0.88, 0.12, 1)" : "cubic-bezier(0.15, 0.75, 0.2, 1)";
    strip.style.transition = `transform ${durationMs}ms ${ease}`;
    strip.style.transform = `translateY(${targetY}px)`;
    window.setTimeout(() => {
      reel?.classList.remove("spinning");
      reel?.classList.add("locked");
      if (idx === 2) reel?.classList.add("reveal");
      resolve();
    }, durationMs + 30);
  });
}

/**
 * 3슬롯: 앞 2칸은 당첨 모양으로 먼저 확정, 마지막 1칸만 오래 돌다 히든 공개.
 * (원작: 같은 모양 3개 매칭, 3번째가 결과 연출)
 */
async function renderGoldSlot(_pool: MinigameRewardRow[], winIndex: number) {
  const winTier = Math.min(Math.max(0, winIndex), 3) + 1;
  if (!document.querySelector(".lucky-machine")) setupGoldSlotIdle();
  setLuckyTicker(ui("ui_mg_spinning"));
  document.querySelector(".lucky-machine")?.classList.remove("lucky-win");

  // 1·2번 먼저 멈추고, 3번은 길게 긴장
  const p0 = spinLuckyReel(0, winTier, 820);
  await sleep(160);
  const p1 = spinLuckyReel(1, winTier, 980);
  await sleep(200);
  const p2 = spinLuckyReel(2, winTier, 2400);
  await Promise.all([p0, p1, p2]);

  setLuckyTicker(ui("ui_mg_lucky_match"));
  const machine = document.querySelector(".lucky-machine");
  machine?.classList.add("lucky-win");
  const sparks = document.querySelector(".lucky-sparkles");
  if (sparks) {
    sparks.innerHTML = Array.from({ length: 12 }, (_, i) => {
      const left = 6 + ((i * 29) % 88);
      const delay = (i % 6) * 0.05;
      return `<span style="left:${left}%;animation-delay:${delay}s"></span>`;
    }).join("");
  }
  await sleep(620);
}

/** 대박 혜택: 오픈 → 슬롯 패널 → 돌리기 → 골드 */
async function runLuckyTreasureFlow(minigameId: string) {
  await waitMainButton(ui("ui_mg_open_btn"));
  await runMinigame(minigameId);
}

/** linked_minigame_id 공통 런처 — 타입별 플로우 분기 */
async function launchLinkedMinigame(minigameId: string) {
  const mg = data.minigames.find((m) => m.minigame_id === minigameId);
  if (!mg) return;
  if (mg.type === "GOLD_SLOT") await runLuckyTreasureFlow(minigameId);
  else await runMinigame(minigameId);
}

/** 지역 offer_leave: 떠나기 vs 돌리기 */
async function offerLeaveOrPlay(): Promise<"LEAVE" | "PLAY"> {
  return new Promise((resolve) => {
    choiceButtons.innerHTML = "";
    const leaveBtn = document.createElement("button");
    leaveBtn.type = "button";
    leaveBtn.className = "choice-btn secondary";
    leaveBtn.textContent = ui("ui_mg_leave_btn");
    const playBtn = document.createElement("button");
    playBtn.type = "button";
    playBtn.className = "choice-btn";
    playBtn.textContent = ui("ui_mg_spin_btn");
    const finish = async (side: "LEAVE" | "PLAY", btn: HTMLButtonElement) => {
      await playActivate(btn);
      choiceButtons.style.display = "none";
      choiceButtons.innerHTML = "";
      mainBtn.style.display = "";
      setGaugesVisible(true);
      resolve(side);
    };
    leaveBtn.onclick = () => finish("LEAVE", leaveBtn);
    playBtn.onclick = () => finish("PLAY", playBtn);
    choiceButtons.appendChild(leaveBtn);
    choiceButtons.appendChild(playBtn);
    mainBtn.style.display = "none";
    setGaugesVisible(false);
    choiceButtons.style.display = "flex";
    slideIn(choiceButtons);
  });
}

async function runGoldSlotGame(minigameId: string) {
  const mg = data.minigames.find((m) => m.minigame_id === minigameId);
  if (!mg) return;
  const pool = getMinigamePool(data, minigameId);

  minigamePanel.style.display = "flex";
  minigamePanel.classList.add("lucky-mode");
  minigameTitle.textContent = "";
  minigameSub.textContent = "";
  minigameResult.textContent = "";
  setupGoldSlotIdle();

  // 패널이 메인 버튼을 덮음 → 패널 안 「돌리기」로 진행
  setMainBtnLabel(ui("ui_mg_spinning"));
  mainBtn.disabled = true;
  minigameActionBtn.classList.add("lucky-spin-btn");
  await waitMinigameAction(ui("ui_mg_spin_btn"));
  minigameActionBtn.classList.remove("lucky-spin-btn");

  const win = spinMinigameRow(data, minigameId);
  if (!win) {
    minigamePanel.classList.remove("lucky-mode");
    minigamePanel.style.display = "none";
    return;
  }
  const winIndex = Math.max(0, pool.indexOf(win));
  await renderGoldSlot(pool, winIndex);

  if (win.effect_id) {
    applyEffectId(data, state, win.effect_id);
  }
  refreshStatbar();

  // 슬롯 확정 직후 → 「보상」모달
  const modal = win.effect_id ? rewardModalFromEffect(win.effect_id) : null;
  minigamePanel.classList.remove("lucky-mode");
  minigamePanel.style.display = "none";
  if (modal) {
    await showRewardModal(modal);
  } else {
    await sleep(400);
  }
  refreshStatbar();
  // 패널/대기 중 바뀐 메인 버튼 문구 복구 (finishTurn 전에도 멈춤 방지)
  setMainBtnLabel(ui("ui_btn_next"));
  mainBtn.disabled = false;
  mainBtn.className = "main-btn idle";
}

function mythStackCaps(mgId = "mg_slot") {
  const mg = data.minigames.find((m) => m.minigame_id === mgId);
  return {
    angel: Math.max(1, mg?.angel_stack_cap ?? 4),
    devil: Math.max(1, mg?.devil_stack_cap ?? 3),
  };
}

function mythStackHtml(angel: number, devil: number, caps?: { angel: number; devil: number }): string {
  const c = caps ?? mythStackCaps();
  const dots = (n: number, cap: number, filled: string) =>
    Array.from({ length: cap }, (_, i) => `<span class="myth-dot${i < n ? " on " + filled : ""}"></span>`).join(
      ""
    );
  return `<div class="myth-heads">
    <div class="myth-side angel"><div class="myth-face">😇</div><div class="myth-name">${ui(
      "ui_mg_myth_angel"
    )}</div><div class="myth-dots">${dots(angel, c.angel, "angel")}</div></div>
    <div class="myth-side devil"><div class="myth-face">😈</div><div class="myth-name">${ui(
      "ui_mg_myth_devil"
    )}</div><div class="myth-dots">${dots(devil, c.devil, "devil")}</div></div>
  </div>`;
}

async function renderMythSlot(
  pool: MinigameRewardRow[],
  win: MinigameRewardRow,
  angel: number,
  devil: number,
  caps: { angel: number; devil: number }
) {
  minigameStage.innerHTML = `${mythStackHtml(angel, devil, caps)}
    <div class="myth-reel-wrap"><div class="myth-reel" id="mythReel">❔</div></div>`;
  const reel = document.getElementById("mythReel") as HTMLElement;
  const labels = pool.map((r) => rewardRowLabel(data, r).text);
  const timer = window.setInterval(() => {
    reel.textContent = labels[Math.floor(Math.random() * labels.length)];
  }, 70);
  await sleep(1600);
  window.clearInterval(timer);
  reel.textContent = rewardRowLabel(data, win).text;
  reel.classList.add("slot-lock");
  await sleep(350);
  minigameStage.innerHTML = `${mythStackHtml(angel, devil, caps)}
    <div class="myth-reel-wrap"><div class="myth-reel slot-lock">${rewardRowLabel(data, win).text}</div></div>`;
}

async function runMinigame(minigameId: string) {
  const mg = data.minigames.find((m) => m.minigame_id === minigameId);
  if (!mg) return;

  // 대박 골드 슬롯: 오픈은 호출측(runLuckyTreasureFlow), 여기서는 돌리기~결과
  if (mg.type === "GOLD_SLOT") {
    await runGoldSlotGame(minigameId);
    return;
  }

  const pool = getMinigamePool(data, minigameId);
  await playSplash(ui("ui_mg_splash"));
  minigamePanel.style.display = "flex";
  minigameTitle.textContent = mg.minigame_name;
  minigameSub.textContent = mg.type === "CARD_MATCH" ? ui("ui_mg_card_sub") : "";
  minigameResult.textContent = "";
  minigameActionBtn.style.display = "none";

  if (mg.type === "CARD_MATCH") {
    minigamePanel.classList.add("dig-mode");
    minigameTitle.textContent = "";
    minigameSub.textContent = "";
    const win = await playCardMatchDig(pool);
    if (win.effect_id) {
      applyEffectId(data, state, win.effect_id);
    }
    refreshStatbar();
    const modal = win.effect_id ? rewardModalFromEffect(win.effect_id) : null;
    minigamePanel.classList.remove("dig-mode");
    minigamePanel.style.display = "none";
    if (modal) {
      await showRewardModal({
        ...modal,
        title: win.label || ui("ui_reward_modal_title"),
      });
    } else {
      await sleep(500);
    }
    refreshStatbar();
    return;
  }

  const maxSpins = mg.attempt_limit ?? 1;
  let spinsUsed = 0;
  let finalRow: MinigameRewardRow | null = null;
  const appliedLines: string[] = [];
  let angelStacks = 0;
  let devilStacks = 0;
  let mythGranted = false;
  const mythCaps = mythStackCaps(minigameId);

  while (spinsUsed < maxSpins) {
    spinsUsed++;
    if ((mg.type === "SLOT" || mg.type === "MYTH_SLOT") && mg.attempt_limit) {
      minigameSub.textContent = ui("ui_mg_spins_left", { n: Math.max(0, maxSpins - spinsUsed) });
    }

    const win = spinMinigameRow(data, minigameId);
    if (!win) break;
    const winIndex = pool.indexOf(win);

    if (mg.type === "MYTH_SLOT") {
      if (win.side === "angel") angelStacks = Math.min(mythCaps.angel, angelStacks + 1);
      else if (win.side === "devil") devilStacks = Math.min(mythCaps.devil, devilStacks + 1);
      await renderMythSlot(pool, win, angelStacks, devilStacks, mythCaps);
      minigameResult.textContent = rewardRowLabel(data, win).text || ui("ui_mg_nothing");
      if (!win.effect_id) {
        await sleep(700);
        if (spinsUsed < maxSpins) continue;
        break;
      }
      if ((angelStacks >= mythCaps.angel || devilStacks >= mythCaps.devil) && !mythGranted) {
        const res = applyEffectId(data, state, win.effect_id);
        appliedLines.push(...res.lines);
        mythGranted = true;
        finalRow = win;
        break;
      }
      await sleep(650);
      continue;
    } else if (mg.type === "SLOT") await renderSlot(pool, winIndex);
    else await renderWheel(pool, winIndex);

    minigameResult.textContent = rewardRowLabel(data, win).text;
    if (win.action === "RESPIN" && spinsUsed < maxSpins) {
      await sleep(650);
      continue;
    }
    finalRow = win;
    break;
  }

  if (mg.type === "MYTH_SLOT" && !mythGranted && (angelStacks > 0 || devilStacks > 0)) {
    const side =
      angelStacks >= mythCaps.angel
        ? "angel"
        : devilStacks >= mythCaps.devil
          ? "devil"
          : angelStacks >= devilStacks
            ? "angel"
            : "devil";
    const row = pool.find((r) => r.side === side);
    if (row?.effect_id) {
      const res = applyEffectId(data, state, row.effect_id);
      appliedLines.push(...res.lines);
      finalRow = row;
    }
  } else if (finalRow && finalRow.effect_id && mg.type !== "MYTH_SLOT") {
    const res = applyEffectId(data, state, finalRow.effect_id);
    appliedLines.push(...res.lines);
  }

  minigameResult.textContent =
    appliedLines.join(" · ") || (finalRow ? finalRow.label : ui("ui_mg_nothing"));
  await sleep(1300);
  minigamePanel.style.display = "none";
  refreshStatbar();
}

interface ChoiceCardOption {
  badge?: string;
  badgeClass?: string;
  name: string;
  desc: string;
}

function openLearnedSkillsModal() {
  learnedSkillsTitle.textContent = ui("ui_learned_skills_title");
  learnedSkillsClose.textContent = ui("ui_learned_skills_close");
  learnedSkillsList.innerHTML = "";
  const skills = state.learnedSkills
    .map((id) => data.skills.find((s) => s.skill_id === id))
    .filter((s): s is SkillDef => !!s);
  if (skills.length === 0) {
    const empty = document.createElement("div");
    empty.className = "learned-skills-empty";
    empty.textContent = ui("ui_learned_skills_empty");
    learnedSkillsList.appendChild(empty);
  } else {
    for (const s of skills) {
      const row = document.createElement("div");
      row.className = "learned-skill-row";
      const badge = s.is_upgrade
        ? `<div class="skill-tier-badge tier-upgrade">${ui("ui_skill_upgrade_badge")}</div>`
        : `<div class="skill-tier-badge tier-${s.tier}">${s.tier}</div>`;
      row.innerHTML = `
        ${badge}
        <div class="learned-skill-name">${s.icon ? `${s.icon} ` : ""}${s.skill_name}</div>
        <div class="learned-skill-desc">${s.effect_text}</div>
      `;
      learnedSkillsList.appendChild(row);
    }
  }
  learnedSkillsModal.style.display = "flex";
}

function presentChoicePanel(
  buttonLabel: string,
  title: string,
  subtitle: string,
  options: ChoiceCardOption[]
): Promise<number | null> {
  return new Promise((resolve) => {
    if (options.length === 0) {
      resolve(null);
      return;
    }
    mainBtn.textContent = buttonLabel;
    mainBtn.className = "main-btn choosing";
    mainBtn.disabled = false;
    slideIn(mainBtn);
    pendingSkillChoice = () => {
      pendingSkillChoice = null;
      mainBtn.disabled = true;
      setStageMode("SKILL", {
        title: title,
        subtitle: subtitle,
        clearLog: false,
      });
      skillChoiceTitle.textContent = title;
      skillChoiceSub.textContent = subtitle;
      learnedSkillsBtn.textContent = `📖 ${ui("ui_btn_learned_skills")}`;
      learnedSkillsBtn.onclick = () => openLearnedSkillsModal();
      skillChoiceCards.innerHTML = "";
      options.forEach((opt, idx) => {
        const card = document.createElement("button");
        card.type = "button";
        card.className = "skill-card";
        card.innerHTML = `
          ${opt.badge ? `<div class="skill-tier-badge ${opt.badgeClass ?? ""}">${opt.badge}</div>` : ""}
          <div class="skill-card-name">${opt.name}</div>
          <div class="skill-card-desc">${opt.desc}</div>
        `;
        card.onclick = async () => {
          await playActivate(card);
          learnedSkillsModal.style.display = "none";
          skillChoicePanel.style.display = "none";
          resolve(idx);
        };
        skillChoiceCards.appendChild(card);
        slideIn(card);
      });
      skillChoicePanel.style.display = "flex";
    };
  });
}

async function presentSkillChoice(title: string, subtitle: string, candidates: SkillDef[]): Promise<SkillDef | null> {
  const idx = await presentChoicePanel(
    ui("ui_btn_skill_choice"),
    title,
    subtitle,
    candidates.map((s) => {
      const hints = getSkillCombatHints(data, s.skill_id);
      const hintLine = hints.length ? `\n${hints.join(" · ")}` : "";
      return {
        badge: s.is_upgrade ? ui("ui_skill_upgrade_badge") : s.tier,
        badgeClass: s.is_upgrade ? "tier-upgrade" : `tier-${s.tier}`,
        name: s.icon ? `${s.icon} ${s.skill_name}` : s.skill_name,
        desc: s.is_upgrade
          ? `${ui("ui_skill_upgrade_desc", { name: s.skill_name, text: s.effect_text })}${hintLine}`
          : `${s.effect_text}${hintLine}`,
      };
    })
  );
  return idx === null ? null : candidates[idx];
}

async function grantLevelSkill(mode: "CHOICE_3" | "AUTO", tier: string) {
  if (mode === "CHOICE_3") {
    const candidates = pickSkillChoices(data, state, tier, 3);
    const chosen = await presentSkillChoice(ui("ui_btn_skill_choice"), ui("ui_skill_sub"), candidates);
    if (!chosen) return;
    const got = applyLearnedSkill(chosen.skill_id);
    if (!got) return;
    await presentSkillLearnedFeedback(got);
    return;
  }
  const skill = grantSkillFromTier(data, state, tier === "미확인" ? "미확인" : tier);
  if (!skill) return;
  renderStageSkillIcons();
  refreshStatbar();
  await presentSkillLearnedFeedback({
    name: skill.skill_name,
    icon: skill.icon,
    upgraded: skill.is_upgrade,
  });
}

/** XOOX 정화 전투 결과 처리 — resolveCombat(액션)과 분리된 별도 경로. 공격 승패가 아니라 정화 성공/전멸. */
async function resolveCombat(tier: string, combatIdHint?: string) {
  mainBtn.disabled = true;
  mainBtn.classList.remove("btn-slide-in");
  setMainBtnLabel(ui("ui_btn_combat_active"), true);
  mainBtn.className = "main-btn combat combat-busy";

  const combat =
    (combatIdHint ? data.combats.find((c) => c.combat_id === combatIdHint) : undefined) ??
    pickCombat(data, tier, lastCombatId ?? undefined);
  if (combat) lastCombatId = combat.combat_id;

  await appendCommentary("COMBAT_START");
  const sim = await playCombatOnStage(combat?.combat_id, tier);
  const map = getStageMapForDay(data, state.day);
  // 실승패만 반영 (예전 FORGIVING soft-clear / HP1 강제 승리는 제거)
  const won = sim.won;
  state.hp = Math.max(0, Math.round(sim.playerHpAfter));

  if (!won) {
    const reviveId = tuningStr(data, "revival_skill_id", "sk_revival");
    const hasRevive = state.learnedSkills.includes(reviveId) && !state.revivalUsed;
    if (hasRevive) {
      await appendCard({ body: ui("ui_revive_down") });
      await sleep(700);
      state.hp = Math.max(1, Math.round(state.maxHp * getReviveHpPct(data, state)));
      state.revivalUsed = true;
      await appendCard({
        body: ui("ui_revive_up"),
        effectLines: [ui("ui_chip_hp_heal", { pct: Math.round(getReviveHpPct(data, state) * 100) })],
      });
      // 부활 시 보상은 계속 지급(런 유지). 1회 소모.
    } else {
      state.hp = Math.max(0, state.hp);
      await appendCard({ body: ui("ui_combat_lose") });
      combatPending = null;
      mainBtn.classList.remove("combat-pulse", "combat-busy");
      syncStageWithLog({
        modeId: "EVENT",
        title: ui("ui_stage_combat_lose_title"),
        subtitle: stageHeadline(ui("ui_combat_lose")),
        clearLog: false,
      });
      return;
    }
  }

  const goldMult = map?.drop_gold_mult ?? 1;
  const expMult = map?.drop_exp_mult ?? 1;
  const gold = Math.round(
    (combat ? randInt(combat.gold_min || 200, combat.gold_max || 400) : 300) * goldMult
  );
  const exp = Math.round(
    (combat ? randInt(combat.exp_min || 60, combat.exp_max || 100) : 60) * expMult
  );
  state.gold += gold;
  state.exp += exp;
  await appendCard({
    body: ui("ui_combat_win"),
    effectLines: [ui("ui_chip_exp", { exp }), ui("ui_chip_gold", { gold })],
  });
  await appendCommentary("COMBAT_WIN");
  const lvl = checkLevelUp(data, state);
  if (lvl) {
    await appendCard({ body: ui("ui_levelup", { lv: lvl.newLevel }) });
    await appendCard({ body: ui("ui_levelup_heal"), effectLines: [ui("ui_chip_hp_heal", { pct: lvl.hpHealPct })] });
    // FULL 영상 기준: 일반 사냥 후 스킬 학습 없음. 스킬은 상자·이벤트만.
  }
  if (combat?.tier === "MINIBOSS") {
    await appendCard({ body: ui("ui_miniboss_chest") });
    await showChestIntro();
    const candidates = pickSkillChoices(data, state, "신화", 3);
    const chosen = await presentSkillChoice(ui("ui_chest_title"), ui("ui_skill_sub"), candidates);
    if (chosen) {
      const got = applyLearnedSkill(chosen.skill_id);
      if (got) await presentSkillLearnedFeedback(got);
    }
  } else if (combat?.tier === "FINALBOSS") {
    const res = applyEffectId(data, state, "e_ancient_succession");
    await appendCard({ body: ui("ui_finalboss_reward"), effectLines: res.lines });
    await showChestIntro();
    const candidates = pickSkillChoices(data, state, "전설", 3);
    const chosen = await presentSkillChoice(ui("ui_chest_title"), ui("ui_skill_sub"), candidates);
    if (chosen) {
      const got = applyLearnedSkill(chosen.skill_id);
      if (got) await presentSkillLearnedFeedback(got);
    }
    state.finalBossDefeated = true;
  }
  combatPending = null;
  mainBtn.classList.remove("combat-pulse", "combat-busy");
  syncStageWithLog({
    modeId: "EVENT",
    title: ui("ui_stage_combat_win_title"),
    subtitle: stageHeadline(ui("ui_combat_win")),
    clearLog: false,
  });
  if (state.finalBossDefeated) {
    await showVictoryScreen();
  }
}

const META_CHAPTER_KEY = "capy_chapter";
const META_BEST_KEY = "capy_best_days";

function readMeta(): { chapter: number; best: number } {
  const chapter = Number(localStorage.getItem(META_CHAPTER_KEY) ?? "0");
  const best = Number(localStorage.getItem(META_BEST_KEY) ?? "0");
  return { chapter: isNaN(chapter) ? 0 : chapter, best: isNaN(best) ? 0 : best };
}

async function showVictoryScreen() {
  const prev = readMeta();
  const chapter = prev.chapter + 1;
  const best = Math.max(prev.best, state.day);
  localStorage.setItem(META_CHAPTER_KEY, String(chapter));
  localStorage.setItem(META_BEST_KEY, String(best));

  victoryIcon.textContent = ui("ui_victory_icon");
  victoryTitle.textContent = ui("ui_victory_title");
  victorySub.textContent = ui("ui_victory_sub", { ch: chapter, day: state.day, best });
  victoryLoot.innerHTML = `<span class="effect-chip">${ui("ui_victory_loot", { gold: Math.round(state.gold) })}</span>`;
  restartBtn.textContent = ui("ui_restart_btn");
  restartBtn.onclick = () => window.location.reload();
  mainBtn.style.display = "none";
  choiceButtons.style.display = "none";
  victoryPanel.style.display = "flex";
}

function fighterNameFromLabel(label: string): string {
  return label.replace(/에게\s*베팅!?/, "").trim();
}

async function resolveBranch(branch: BranchDef, choice: "A" | "B") {
  const label = choice === "A" ? branch.option_a_label : branch.option_b_label;
  const otherLabel = choice === "A" ? branch.option_b_label : branch.option_a_label;
  const effectId = choice === "A" ? branch.option_a_effect_id : branch.option_b_effect_id;
  const prob = choice === "A" ? branch.option_a_prob : branch.option_b_prob;
  const costId = getBranchCostEffectId(branch, choice);

  if (costId) {
    const costRes = applyEffectId(data, state, costId);
    await appendCard({ body: ui("ui_branch_pick", { label }), effectLines: costRes.lines });
  } else {
    await appendCard({ body: ui("ui_branch_pick", { label }) });
  }

  if (prob !== null && prob !== undefined) {
    const success = Math.random() * 100 < prob;
    if (branch.subtype === "BETTING") {
      const mine = fighterNameFromLabel(label);
      const other = fighterNameFromLabel(otherLabel);
      if (success) {
        await appendCard({ body: ui("ui_bet_win", { mine, other }) });
      } else {
        await appendCard({ body: ui("ui_bet_lose", { mine, other }) });
        return;
      }
    } else if (!success) {
      await appendCard({ body: ui("ui_try_fail", { prob }) });
      return;
    } else {
      await appendCard({ body: ui("ui_try_success", { prob }) });
    }
  }

  if (!effectId) {
    await appendCard({ body: ui("ui_pass_quiet") });
    return;
  }

  // CONTENT_LINK effect FK (우선) · 레거시 접두어 호환
  const linkRes = applyEffectId(data, state, effectId);
  if (linkRes.contentLink) {
    await runContentLink(linkRes.contentLink.kind, linkRes.contentLink.ref);
    return;
  }
  if (effectId.startsWith("COMBAT_TRIGGER")) {
    const tier = effectId.includes(":") ? effectId.split(":")[1] : "NORMAL";
    await runContentLink("COMBAT", tier);
    return;
  }
  if (effectId.startsWith("MINIGAME:")) {
    await runContentLink("MINIGAME", effectId.split(":")[1]);
    return;
  }
  if (effectId.startsWith("LOCATION:")) {
    await runContentLink("LOCATION", effectId.split(":")[1]);
    return;
  }
  if (effectId === "SKILL_SWAP") {
    await runContentLink("SKILL_SWAP", "");
    return;
  }
  await appendCard({ body: ui("ui_reward_get"), effectLines: linkRes.lines });
}

async function runContentLink(kind: string, ref: string) {
  if (kind === "COMBAT") {
    const tier = ref || "NORMAL";
    const combat = pickCombat(data, tier, lastCombatId ?? undefined);
    if (combat) lastCombatId = combat.combat_id;
    const enemy = combat ? data.combatEnemies.find((e) => e.combat_id === combat.combat_id) : undefined;
    const text =
      tier === "FINALBOSS"
        ? ui("ui_final_encounter")
        : ui("ui_enemy_appear_named", {
            tier: combatTierLabel(tier),
            name: enemy?.enemy_name ?? ui("ui_enemy_generic"),
          });
    await appendCard({ body: text });
    combatPending = { tier, combatId: combat?.combat_id };
    return;
  }
  if (kind === "MINIGAME") {
    await runMinigame(ref);
    return;
  }
  if (kind === "LOCATION") {
    await resolveLocation(ref);
    return;
  }
  if (kind === "SKILL_SWAP") {
    await runSkillSwap();
  }
}

async function showBranchPrompt(branch: BranchDef) {
  const promptBody = textFor(data, branch.text_id);
  setStageMode("BRANCH", {
    title: ui("ui_stage_branch_title"),
    subtitle: stageHeadline(promptBody, 40),
    clearLog: false,
  });
  await appendCard({ body: promptBody });

  if (branch.subtype === "STAT_CHOICE") {
    const effectA = data.effects.find((e) => e.effect_id === branch.option_a_effect_id);
    const effectB = data.effects.find((e) => e.effect_id === branch.option_b_effect_id);
    const options = [
      { name: effectA?.icon ? `${effectA.icon} ${branch.option_a_label}` : branch.option_a_label, desc: effectA?.description ?? "" },
      { name: effectB?.icon ? `${effectB.icon} ${branch.option_b_label}` : branch.option_b_label, desc: effectB?.description ?? "" },
    ];
    const idx = await presentChoicePanel(ui("ui_btn_blessing"), ui("ui_angel_title"), ui("ui_angel_sub"), options);
    if (idx !== null) {
      const label = idx === 0 ? branch.option_a_label : branch.option_b_label;
      const effectId = idx === 0 ? branch.option_a_effect_id : branch.option_b_effect_id;
      const res = applyEffectId(data, state, effectId);
      await appendCard({ body: ui("ui_branch_pick", { label }), effectLines: res.lines });
    }
    finishTurn();
    return;
  }

  if (branch.subtype === "PREVIEW_DECLINE") {
    const side = await presentPreviewDeclineModal(branch);
    await resolveBranch(branch, side);
    finishTurn();
    return;
  }

  const costPreviewA = (() => {
    const id = getBranchCostEffectId(branch, "A");
    const ef = id ? data.effects.find((e) => e.effect_id === id) : undefined;
    return ef ? effectLine(ef) : "";
  })();
  const costPreviewB = (() => {
    const id = getBranchCostEffectId(branch, "B");
    const ef = id ? data.effects.find((e) => e.effect_id === id) : undefined;
    return ef ? effectLine(ef) : "";
  })();

  const makeBtn = (label: string, cost: string, prob: number | null, secondary: boolean) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "choice-btn" + (secondary ? " secondary" : "");
    b.innerHTML = `${label}${cost ? `<small>${cost}</small>` : ""}${prob !== null ? `<small>${ui("ui_prob_label", { prob })}</small>` : ""}`;
    return b;
  };

  const btnA = makeBtn(branch.option_a_label, costPreviewA, branch.option_a_prob, true);
  const btnB = makeBtn(branch.option_b_label, costPreviewB, branch.option_b_prob, false);

  const choose = async (btn: HTMLButtonElement, side: "A" | "B") => {
    await playActivate(btn);
    choiceButtons.style.display = "none";
    choiceButtons.innerHTML = "";
    mainBtn.style.display = "";
    setGaugesVisible(true);
    mainBtn.disabled = true;
    await resolveBranch(branch, side);
    finishTurn();
  };
  btnA.onclick = () => choose(btnA, "A");
  btnB.onclick = () => choose(btnB, "B");

  choiceButtons.innerHTML = "";
  choiceButtons.appendChild(btnA);
  choiceButtons.appendChild(btnB);
  mainBtn.style.display = "none";
  setGaugesVisible(false);
  choiceButtons.style.display = "flex";
  slideIn(choiceButtons);
}

function setIdle() {
  setGaugesVisible(true);
  mainBtn.style.display = "";
  choiceButtons.style.display = "none";
  choiceButtons.innerHTML = "";
  mainBtn.disabled = false;
  setMainBtnLabel(ui("ui_btn_next"));
  mainBtn.className = "main-btn idle";
  mainBtn.classList.remove("combat-pulse", "combat-busy");
  const hint = mapIdleSubtitle();
  // 직전 장면(도착·보상·조우 등) 타이틀을 유지해 하단 로그와 맞춤
  if (lastStageScene && lastStageScene.modeId !== "IDLE" && lastStageScene.modeId !== "MOVING") {
    setStageMode("IDLE", {
      title: lastStageScene.title,
      subtitle: hint,
      icon: lastStageScene.icon,
      clearLog: false,
      remember: false,
    });
  } else {
    setStageMode("IDLE", { subtitle: hint, clearLog: false });
  }
  slideIn(mainBtn);
}

function pulseGauge(gradeId: string) {
  const el =
    gradeId === "g_jackpot"
      ? document.querySelector(".gauge.jackpot")
      : gradeId === "g_mid"
        ? document.querySelector(".gauge.mid")
        : null;
  if (!el) return;
  el.classList.remove("gauge-pulse");
  void (el as HTMLElement).offsetWidth;
  el.classList.add("gauge-pulse");
  window.setTimeout(() => el.classList.remove("gauge-pulse"), 700);
}

function finishTurn() {
  choiceButtons.style.display = "none";
  choiceButtons.innerHTML = "";
  mainBtn.style.display = "";
  if (rescuePending) {
    setStageMode("COMBAT_WAIT", {
      title: "구조 조우",
      subtitle: `${rescuePending.icon} ${rescuePending.name} · 다가갈까?`,
      icon: "🐾",
      clearLog: false,
    });
    presentRescueApproach(rescuePending);
    refreshStatbar();
    return;
  }
  if (combatPending) {
    setGaugesVisible(true);
    mainBtn.disabled = false;
    setMainBtnLabel(ui("ui_btn_combat"));
    mainBtn.className = "main-btn combat";
    const enemy = combatPending.combatId
      ? data.combatEnemies.find((e) => e.combat_id === combatPending!.combatId)
      : undefined;
    const ename = enemy?.enemy_name || ui("ui_enemy_generic");
    setStageMode("COMBAT_WAIT", {
      title: ui("ui_stage_combat_wait_title"),
      subtitle: ui("ui_stage_combat_wait_sub", { name: ename }),
      icon: enemy?.enemy_icon || "⚔️",
      clearLog: false,
    });
    slideIn(mainBtn);
  } else {
    setIdle();
  }
  refreshStatbar();
}

async function playMovingPhase() {
  mainBtn.disabled = true;
  mainBtn.classList.remove("btn-slide-in");
  setMainBtnLabel(ui("ui_btn_moving"), true);
  mainBtn.className = "main-btn combat";
  setStageMode("MOVING", {
    title: ui("ui_stage_moving_day", { day: state.day }),
    clearLog: true,
    remember: false,
  });
  await sleep(1200);
}

async function resolveDirectReward() {
  const grade = rollGrade(data);
  const entry = rollDailyEntry(data, grade.grade_id);
  if (!entry) {
    await Promise.all([playGradeBanner(grade), appendCard({ body: ui("ui_nothing"), grade })]);
    return;
  }
  const lines = textLinesFor(data, entry.text_id);
  const linkedMg = entry.linked_minigame_id?.trim() || "";
  const hasLinkedMg = !!linkedMg;

  if (grade.is_jackpot) {
    // linked 미니게임(보물/신화 등): 로그만 먼저 → 타입별 플로우. 그 외 대박은 즉시 효과.
    const effectLines: string[] = [];
    if (!hasLinkedMg && entry.effect_id) {
      effectLines.push(...applyEffectId(data, state, entry.effect_id).lines);
      for (const bonusEffectId of getBonusEffectIds(data, entry.pool_id)) {
        effectLines.push(...applyEffectId(data, state, bonusEffectId).lines);
      }
    }
    await Promise.all([
      playGradeBanner(grade),
      appendCard({
        body: lines.line1,
        bodyLine2: lines.line2,
        grade,
        effectLines,
        jackpotSlot: true,
      }),
    ]);
  } else {
    const res = applyEffectId(data, state, entry.effect_id);
    const bonusLines: string[] = [];
    for (const bonusEffectId of getBonusEffectIds(data, entry.pool_id)) {
      bonusLines.push(...applyEffectId(data, state, bonusEffectId).lines);
    }
    await Promise.all([
      playGradeBanner(grade),
      appendCard({
        body: lines.line1,
        bodyLine2: lines.line2,
        grade,
        effectLines: [...res.lines, ...bonusLines],
        scramble: true,
      }),
    ]);
  }

  const gaugeRes = incrementGauge(data, state, grade.grade_id);
  refreshStatbar();
  if (gaugeRes?.gained) pulseGauge(grade.grade_id);

  // 일일 linked 미니게임 (행운의 보물 / 신화 슬롯 등)
  if (hasLinkedMg) {
    await launchLinkedMinigame(linkedMg);
  } else if (gaugeRes?.filled && gaugeRes.gauge.reward_minigame_id) {
    await launchLinkedMinigame(gaugeRes.gauge.reward_minigame_id);
  }
}

async function resolveLocation(forcedLocationId?: string) {
  const loc = forcedLocationId
    ? getLocationById(data, forcedLocationId)
    : pickLocation(data, state);
  if (!loc) return;
  state.seenLocations.add(loc.location_id);

  setStageMode("LOCATION_FIND", {
    title: ui("ui_stage_loc_find", { name: loc.name }),
    subtitle: stageHeadline(textLinesFor(data, loc.text_id).line1 || loc.name, 40),
    clearLog: true,
  });
  await sleep(700);
  setStageMode("LOCATION_ARRIVE", {
    title: ui("ui_stage_loc_arrive", { name: loc.name }),
    subtitle: stageHeadline(textLinesFor(data, loc.text_id).line1 || loc.name, 40),
    clearLog: false,
  });

  if (loc.scenario_id) {
    await playScenario(loc.scenario_id);
  } else {
    const lines = textLinesFor(data, loc.text_id);
    const grade = loc.grade_id ? data.grades.find((g) => g.grade_id === loc.grade_id) ?? null : null;
    const effectLines: string[] = [];
    if (loc.linked_effect_id) {
      const res = applyEffectId(data, state, loc.linked_effect_id);
      effectLines.push(...res.lines);
    }
    if (grade) {
      const isJackpot = grade.is_jackpot;
      await Promise.all([
        playGradeBanner(grade),
        appendCard({
          body: lines.line1,
          bodyLine2: lines.line2,
          grade,
          effectLines,
          jackpotSlot: isJackpot,
        }),
      ]);
    } else {
      await appendCard({ body: lines.line1, bodyLine2: lines.line2, grade, effectLines });
    }
    if (grade) {
      const gaugeRes = incrementGauge(data, state, grade.grade_id);
      refreshStatbar();
      if (gaugeRes?.gained) pulseGauge(grade.grade_id);
      if (gaugeRes?.filled && gaugeRes.gauge.reward_minigame_id) {
        await launchLinkedMinigame(gaugeRes.gauge.reward_minigame_id);
      }
    }
  }

  if (loc.linked_minigame_id) {
    if (loc.offer_leave) {
      const choice = await offerLeaveOrPlay();
      if (choice === "LEAVE") {
        await appendCard({ body: ui("ui_mg_left") });
      } else {
        await launchLinkedMinigame(loc.linked_minigame_id);
      }
    } else {
      await launchLinkedMinigame(loc.linked_minigame_id);
    }
  }
  await flushMilestones();
}

/** 보너스 영지 등 다단계 시나리오 (scenario_step_config) */
async function playScenario(scenarioId: string) {
  const steps = data.scenarioSteps
    .filter((s) => s.scenario_id === scenarioId)
    .sort((a, b) => a.step_order - b.step_order);
  let lastGradeId = "";
  for (const step of steps) {
    const lines = textLinesFor(data, step.text_id);
    const grade = step.grade_id ? data.grades.find((g) => g.grade_id === step.grade_id) ?? null : null;
    const effectLines: string[] = [];
    for (const eid of step.linked_effect_ids) {
      effectLines.push(...applyEffectId(data, state, eid).lines);
    }
    if (grade) {
      lastGradeId = grade.grade_id;
      await Promise.all([
        playGradeBanner(grade),
        appendCard({
          body: lines.line1,
          bodyLine2: lines.line2,
          grade,
          effectLines,
        }),
      ]);
    } else {
      await appendCard({ body: lines.line1, bodyLine2: lines.line2, effectLines });
    }
  }
  if (lastGradeId) {
    const gaugeRes = incrementGauge(data, state, lastGradeId);
    refreshStatbar();
    if (gaugeRes?.gained) pulseGauge(lastGradeId);
    if (gaugeRes?.filled && gaugeRes.gauge.reward_minigame_id) {
      await launchLinkedMinigame(gaugeRes.gauge.reward_minigame_id);
    }
  }
}

async function flushMilestones() {
  for (const reward of checkMilestones(data, state)) {
    const res = applyEffectId(data, state, reward.effectId);
    await appendCard({
      body: ui("ui_milestone_reached", { name: reward.milestoneName, at: reward.atCount }),
      effectLines: res.lines,
    });
  }
}

async function resolveUngraded() {
  const entry = rollUngradedEntry(data);
  if (!entry) return;
  const body = textFor(data, entry.text_id);
  const res = applyEffectId(data, state, entry.effect_id);
  await appendCard({ body, effectLines: res.lines });
}

async function onMainBtnClick() {
  if (state.finalBossDefeated) return;

  // 오픈 / 돌리기 등 대기 액션 우선
  if (pendingMainAction) {
    const act = pendingMainAction;
    pendingMainAction = null;
    mainBtn.disabled = true;
    await playActivate(mainBtn);
    act();
    return;
  }

  if (pendingSkillChoice) {
    const openPanel = pendingSkillChoice;
    pendingSkillChoice = null;
    mainBtn.disabled = true;
    await playActivate(mainBtn);
    openPanel();
    return;
  }

  mainBtn.disabled = true;
  await playActivate(mainBtn);

  if (rescuePending) {
    await playMovingPhase();
    await playRescueEncounter(rescuePending);
    finishTurn();
    return;
  }

  if (combatPending) {
    await playMovingPhase();
    await resolveCombat(combatPending.tier, combatPending.combatId);
    finishTurn();
    return;
  }

  state.day += 1;
  ensureDayHeader(state.day);
  await playMovingPhase();

  if (rollIsCombat(data, state.day)) {
    const tier = decideCombatTier(state.day);
    const combat = pickCombat(data, tier, lastCombatId ?? undefined);
    if (combat) lastCombatId = combat.combat_id;
    const enemy = combat ? data.combatEnemies.find((e) => e.combat_id === combat.combat_id) : undefined;
    const text = combat
      ? `${textFor(data, combat.text_id)}\n${ui("ui_enemy_tier_line", {
          tier: combatTierLabel(tier),
          name: enemy?.enemy_name ?? "",
        })}`
      : ui("ui_enemy_appear");
    await appendCard({ body: text });
    combatPending = { tier, combatId: combat?.combat_id };
    finishTurn();
    return;
  }

  // 구조 조우 — 이 스테이지 풀에 남은 동물이 있으면 확률적으로 등장(전투와 별개, 주 콘텐츠).
  if (rollIsRescue(data, state, state.day)) {
    const animal = pickRescueAnimal(data, state, state.day);
    if (animal) {
      rescuePending = animal;
      await appendCard({
        body: `${animal.icon} 오염된 ${animal.type === "CAT" ? "고양이" : "강아지"}의 기척이 느껴진다…`,
      });
      finishTurn();
      return;
    }
  }

  const dayEvent = getDayEvent(data, state.day);
  if (dayEvent) {
    applyDayEvent(state, dayEvent);
    refreshStatbar();
    const effectLines: string[] = [];
    if (dayEvent.event_type === "BUFF" || dayEvent.event_type === "DEBUFF") {
      const isPurify = dayEvent.stat_field === "PURIFY_POWER";
      const icon = isPurify ? "💧" : "❤";
      const label = isPurify ? "정화력" : "체력";
      effectLines.push(`${icon} ${label} ${dayEvent.value_pct > 0 ? "+" : ""}${dayEvent.value_pct}%`);
    } else if (dayEvent.event_type === "RECOVERY") {
      effectLines.push(`❤ 체력 +${dayEvent.value_pct}%`);
    } else if (dayEvent.event_type === "CHOICE") {
      effectLines.push(`💛 공감 +${dayEvent.empathy_gain}`);
    }
    await appendCard({ body: dayEvent.flavor_text, effectLines });
    finishTurn();
    return;
  }

  const contentType = rollContentType(data);
  if (contentType.type_id === "ct_direct") {
    await resolveDirectReward();
  } else if (contentType.type_id === "ct_location") {
    await resolveLocation();
  } else if (contentType.type_id === "ct_branch") {
    await showBranchPrompt(pickBranch(data, state.day, state.finalBossDefeated));
    return;
  } else {
    await resolveUngraded();
  }

  finishTurn();
}

mainBtn.addEventListener("click", onMainBtnClick);

/**
 * 시작 스킬 등급.
 *
 * [훈장 시스템 TODO — 확률 콘텐츠 아님]
 * - 원작: 게임 진행 후 훈장(모험가 훈장 등)을 받아야 시작 스킬 선택 혜택이 생긴다.
 * - 현재: 첫 입장에서 "이런 혜택이 있다"는 미리보기로 스킬 선택을 열어 둔다.
 * - owned_at_start=FALSE (item_config / item_adventurer_badge). 훈장 시스템 개발 시 보유 여부로 분기하고
 *   실제 보유 문구는 ui_start_medal_owned 를 쓴다.
 */
function startSkillTier(): { tier: string; hasBadge: boolean } {
  const tierPassive = data.passives.find(
    (p) => p.effect_type === "START_SKILL_TIER" && state.ownedPassives.has(p.item_id)
  );
  return { tier: tierPassive ? tierPassive.effect_value : "일반", hasBadge: !!tierPassive };
}

function bindStaticUi() {
  document.getElementById("statLvLabel")!.textContent = ui("ui_stat_lv");
  document.getElementById("statAtkLabel")!.textContent = ui("ui_stat_atk");
  document.getElementById("statDefLabel")!.textContent = ui("ui_stat_def");
  document.getElementById("statGoldLabel")!.textContent = ui("ui_stat_gold");
  syncFeedBottomPad();
  bindFeedLayoutGuards();
  window.addEventListener("resize", () => {
    syncFeedBottomPad();
    scrollFeedToBottom({ anticipatePx: 12 });
  });
  learnedSkillsClose.onclick = () => {
    learnedSkillsModal.style.display = "none";
  };
  learnedSkillsModal.addEventListener("click", (e) => {
    if (e.target === learnedSkillsModal) learnedSkillsModal.style.display = "none";
  });
  document.addEventListener("click", (e) => {
    const t = e.target as Node;
    if (stageSkills.contains(t) || stageEnemySkills.contains(t) || stageSkillTip.contains(t)) return;
    if (pinnedSkillTipId || pinnedEnemySkillId) hideSkillTip();
  });
  const gaugeIds: [string, string, string][] = [
    ["gz_jackpot", "gaugeJackpotIcon", "gaugeJackpotLabel"],
    ["gz_mid", "gaugeMidIcon", "gaugeMidLabel"],
  ];
  for (const [gaugeId, iconElId, labelElId] of gaugeIds) {
    const gauge = data.gauges.find((g) => g.gauge_id === gaugeId);
    if (!gauge) continue;
    const grade = data.grades.find((g) => g.grade_id === gauge.grade_id);
    document.getElementById(iconElId)!.textContent = gauge.icon;
    document.getElementById(labelElId)!.textContent = grade?.grade_name ?? "";
  }
}

// 방랑자(모험가) — 단순·유려한 흰 고양이. 이모지 대신 SVG로 그려 걷기/전투 연출을 태운다.
const WANDERER_SVG = `<svg class="wanderer" viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg" aria-label="방랑자">
  <g class="wnd-tail"><path d="M84 106 q33 8 28 -25 q-4 -17 -18 -13 q13 5 11 20 q-3 15 -23 11 z" fill="#eef3f9" stroke="#242433" stroke-width="2.6" stroke-linejoin="round"/></g>
  <g class="wnd-body">
    <path d="M60 62 c -22 0 -34 16 -34 37 c 0 20 14 31 34 31 c 20 0 34 -11 34 -31 c 0 -21 -12 -37 -34 -37 z" fill="#ffffff" stroke="#242433" stroke-width="2.8" stroke-linejoin="round"/>
    <path d="M60 74 c -13 0 -21 10 -21 25 c 0 13 9 21 21 21 c 12 0 21 -8 21 -21 c 0 -15 -8 -25 -21 -25 z" fill="#eef3f9"/>
    <ellipse cx="49" cy="127" rx="9.5" ry="6" fill="#ffffff" stroke="#242433" stroke-width="2.6"/>
    <ellipse cx="71" cy="127" rx="9.5" ry="6" fill="#ffffff" stroke="#242433" stroke-width="2.6"/>
    <path d="M60 122 l-3 6 M60 122 l3 6" stroke="#242433" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M45 96 q15 9 30 0" fill="none" stroke="#242433" stroke-width="2.4" stroke-linecap="round"/>
    <circle cx="52" cy="99" r="5" fill="#ffffff" stroke="#242433" stroke-width="2.4"/>
    <circle cx="68" cy="99" r="5" fill="#ffffff" stroke="#242433" stroke-width="2.4"/>
  </g>
  <g class="wnd-head">
    <path d="M37 34 L31 9 L55 25 Z" fill="#ffffff" stroke="#242433" stroke-width="2.6" stroke-linejoin="round"/>
    <path d="M83 34 L89 9 L65 25 Z" fill="#ffffff" stroke="#242433" stroke-width="2.6" stroke-linejoin="round"/>
    <path d="M37 28 L34 16 L46 24 Z" fill="#f6944e"/>
    <path d="M83 28 L86 16 L74 24 Z" fill="#f6944e"/>
    <circle cx="60" cy="45" r="29" fill="#ffffff" stroke="#242433" stroke-width="2.8"/>
    <ellipse cx="50" cy="47" rx="6.4" ry="8.6" fill="#eaf3fb"/>
    <ellipse cx="70" cy="47" rx="6.4" ry="8.6" fill="#eaf3fb"/>
    <circle cx="50.5" cy="48" r="4.6" fill="#3a9fe0"/><circle cx="69.5" cy="48" r="4.6" fill="#3a9fe0"/>
    <circle cx="50.5" cy="48" r="2.2" fill="#16222e"/><circle cx="69.5" cy="48" r="2.2" fill="#16222e"/>
    <circle cx="52" cy="46" r="1.3" fill="#ffffff"/><circle cx="71" cy="46" r="1.3" fill="#ffffff"/>
    <path d="M43 38 q7 -3 13 1" fill="none" stroke="#242433" stroke-width="2.3" stroke-linecap="round"/>
    <path d="M77 38 q-7 -3 -13 1" fill="none" stroke="#242433" stroke-width="2.3" stroke-linecap="round"/>
    <path d="M57 54 L63 54 L60 58 Z" fill="#f2915b" stroke="#242433" stroke-width="1.2" stroke-linejoin="round"/>
    <path d="M60 58 q-3 3 -6 1 M60 58 q3 3 6 1" fill="none" stroke="#242433" stroke-width="1.8" stroke-linecap="round"/>
  </g>
</svg>`;

function ensureWandererHero() {
  if (!stageHero.querySelector(".wanderer")) {
    stageHero.innerHTML = WANDERER_SVG;
    stageHero.classList.add("has-wanderer");
  }
}

/** 연출 화면 배경 이미지 적용 — data/xoox_stage_bg.png 가 있으면 스테이지 배경으로. 없으면 기존 그라디언트 유지. */
function applyStageBackground() {
  const url = "/xoox_stage_bg.png";
  const probe = new Image();
  probe.onload = () => {
    stageBgLoaded = true;
    visualStage.style.backgroundImage = `url(${url})`;
    visualStage.classList.add("has-stage-bg");
  };
  probe.src = url;
}

/** 게임 실행 인트로 — 원본 이미지(data/xoox_intro.png). 파일 없으면 재현 아트로 폴백. "게임 스타트" 클릭 시 입장. */
function playIntroSplash(): Promise<void> {
  return new Promise((resolve) => {
    const el = document.getElementById("introSplash");
    if (!el) return resolve();
    const img = document.getElementById("introImg") as HTMLImageElement | null;
    const fb = document.getElementById("introFallback");
    if (img && fb) {
      // 원본 파일이 없으면(로드 실패) 재현 아트로 대체
      img.addEventListener("error", () => {
        img.style.display = "none";
        fb.style.display = "flex";
      });
    }
    let entered = false;
    const enter = () => {
      if (entered) return;
      entered = true;
      el.classList.add("out");
      window.setTimeout(() => {
        el.style.display = "none";
        resolve();
      }, 720);
    };
    document.getElementById("introStartBtn")?.addEventListener("click", enter);
    el.addEventListener("click", enter);
  });
}

/** 진입 컷신 — 4리더 도입 대사 순차 재생 → 챕터 자막 → 게임. 탭으로 진행. */
function playCutscene(sceneId: string): Promise<void> {
  return new Promise((resolve) => {
    const lines = data.cutscenes.filter((c) => c.scene_id === sceneId);
    if (lines.length === 0) return resolve();
    cutsceneBox.style.display = "";
    cutsceneChapter.classList.remove("show");
    cutsceneOverlay.style.display = "flex";
    let i = -1;
    const stageName = getStageMapForDay(data, 1)?.display_name ?? "";
    const advance = () => {
      i++;
      if (i >= lines.length) {
        cutsceneBox.style.display = "none";
        cutsceneChapter.textContent = `구역 01 — ${stageName}`;
        cutsceneChapter.classList.add("show");
        cutsceneOverlay.onclick = null;
        window.setTimeout(() => {
          cutsceneOverlay.classList.add("out");
          window.setTimeout(() => {
            cutsceneOverlay.style.display = "none";
            cutsceneOverlay.classList.remove("out");
            resolve();
          }, 600);
        }, 1500);
        return;
      }
      const l = lines[i];
      if (l.speaker) {
        cutsceneSpeaker.textContent = `${l.icon} ${l.speaker}`;
        cutsceneSpeaker.style.display = "";
        cutsceneBox.classList.remove("narration");
      } else {
        cutsceneSpeaker.style.display = "none";
        cutsceneBox.classList.add("narration");
      }
      cutsceneLine.textContent = l.line;
      cutsceneBox.classList.remove("line-in");
      void cutsceneBox.offsetWidth;
      cutsceneBox.classList.add("line-in");
    };
    cutsceneOverlay.onclick = advance;
    advance();
  });
}

async function init() {
  const introDone = playIntroSplash();
  data = await loadGameData();
  await introDone;
  await playCutscene("intro");
  state = createInitialState(data);
  bindStaticUi();
  ensureWandererHero();
  applyStageBackground();
  refreshStatbar();
  setStageMode("IDLE");
  await appendCard({ body: textFor(data, "t_hometown") });
  ensureDayHeader(1);
  state.day = 1;
  const { tier: startTier, hasBadge } = startSkillTier();
  // 첫 입장: 훈장 미보유여도 미리보기 문구(ui_start_badge). 실제 보유 시 ui_start_medal_owned.
  await appendCard({ body: ui(hasBadge ? "ui_start_medal_owned" : "ui_start_badge") });
  const startCandidates = pickSkillChoices(data, state, startTier, 3);
  const startSkill = await presentSkillChoice(ui("ui_btn_skill_choice"), ui("ui_skill_sub"), startCandidates);
  if (startSkill) {
    const got = applyLearnedSkill(startSkill.skill_id);
    if (got) await presentSkillLearnedFeedback(got);
  }
  setIdle();
}

init();

// 개발용 미니게임 프리뷰 훅 (콘솔에서 __mg("mg_circle") 등으로 호출)
(window as any).__mg = (id: string) => launchLinkedMinigame(id);
/** 신화 스킬 룰렛 바로 미리보기 */
(window as any).__myth = () => runMinigame("mg_slot");
/** 행운의 룰렛 바로 미리보기 */
(window as any).__roulette = () => runMinigame("mg_square");
/** 악마 계약 모달 미리보기 */
(window as any).__devil = async () => {
  const b = data.branches.find((x) => x.branch_id === "b_devil");
  if (!b) return;
  const side = await presentPreviewDeclineModal(b);
  await resolveBranch(b, side);
  finishTurn();
};
/** 행운의 보물 슬롯만 바로 미리보기 (오픈 대기 생략) */
(window as any).__lucky = () => runGoldSlotGame("mg_lucky_treasure");
/** 보물 파내기 바로 미리보기 */
(window as any).__dig = () => runMinigame("mg_card_match");
