import "./style.css";
import { loadGameData } from "./data";
import { installPlayLog, playLog } from "./dev/playLog";
import {
  applyFailContinue,
  captureFailCheckpoint,
  hasFailCheckpoint,
  peekFailRetry,
  restoreFailCheckpoint,
  type FailKind,
} from "./dev/failFlow";
import { mountToolsBar } from "./tools/mountToolsBar";
import { applyJourneyHudLayout, clearJourneyHudLayout, loadJourneyHudLayout } from "./hud/journeyHudLayout";
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
  simulatePurifyCombat,
  grantPurifyReward,
  forceUnlockFinaleMemory,
  memoryBattleWinsNeeded,
  getCombatEnemy,
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
  runIslandDispatch,
  listAdventureMaps,
  runAdventurePatrol,
  tryApplyPurify,
  rebuildPurifyFoci,
  type IslandDispatchResult,
  type PurifyCombatResult,
  type PartyMemberJoinResult,
} from "./engine";
import { scrambleReveal, rollCardTextSlot, sleep } from "./effects";
import {
  addPurifyAmmo,
  ammoCost,
  ammoCostForBlight,
  ammoCostForCombatTier,
  ammoFullMsg,
  ammoHaveMsg,
  ammoShortMsg,
  ammoSpendMsg,
  currentAmmoNeed,
  fillAmountForNode,
  spendPurifyAmmo,
} from "./dev/purifyAmmo";
import { ExploreView, pillarForTrigger } from "./explore";
import { Journey3DView } from "./stage/world3d/Journey3DView";
import type { RaidHud } from "./stage/world3d/PurifyRaid";
import { LobbyView } from "./lobby";
import { setAppScene, bindSceneHost } from "./scene";
import { randInt } from "./rng";
import type { GameData, PlayerState, GradeDef, BranchDef, SkillDef, MinigameRewardRow, EnemySkillDef, PartyMemberDef, RescueAnimalDef, AreaNpcDef, PathJudgmentDef, PathTravelMode } from "./types";
import type { CombatSimResult } from "./engine";

const app = document.getElementById("app")!;
app.innerHTML = `
  <div class="phone" id="phoneRoot" data-scene="boot">
    <header class="shell-header" id="shellHeader">
      <div class="brand-block">
        <button type="button" class="shell-brand" id="shellBrandBtn" aria-label="무지개섬으로 돌아가기" title="무지개섬 로비로">
          <span class="shell-brand-mark" aria-hidden="true">🌈</span>
          <span class="shell-brand-text">무지개섬</span>
        </button>
        <div class="area-chip" id="shellAreaChip">
          <span class="area-label">현재 지역</span>
          <span class="area-name" id="shellAreaName">—</span>
        </div>
      </div>
      <div class="day-roadmap" id="dayRoadmap"></div>
      <div class="shell-top-res" id="shellTopRes">
        <div class="shell-top-chip shell-top-hp">
          <span class="shell-top-ico" aria-hidden="true">❤</span>
          <span class="shell-top-val" id="shellTopHp">0/0</span>
        </div>
        <div class="shell-top-chip shell-top-gold">
          <span class="shell-top-ico" aria-hidden="true">💎</span>
          <span class="shell-top-val" id="shellTopGold">0</span>
        </div>
      </div>
    </header>
    <div class="game-row shell-body" id="gameRow">
    <div class="main-area" id="mainArea">
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
    </div>
    <aside class="party-hud" id="partyHud" aria-label="파티"></aside>
    <div class="activity-toast" id="activityToast" aria-live="polite">
      <div class="tag">현재 활동</div>
      <div class="title" id="shellActivityTitle"></div>
      <div class="sub" id="shellActivitySub"></div>
    </div>
    <aside class="shell-log" id="shellLog" aria-label="구조 로그">
      <div class="shell-log-title">구조 로그</div>
      <div class="feed" id="feed"></div>
    </aside>
    </div>
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
      <p class="victory-hint" id="victoryHint" style="display:none"></p>
      <div class="victory-actions" id="victoryActions">
        <button type="button" class="mg-action-btn" id="failContinueBtn" style="display:none">이어서 하기</button>
        <button type="button" class="mg-action-btn victory-btn-retry" id="failRetryBtn" style="display:none">이 전투 다시</button>
        <button type="button" class="mg-action-btn" id="restartBtn"></button>
      </div>
    </div>
    <div class="controls shell-footer" id="shellFooter">
      <section class="shell-panel status shell-host-hidden" aria-hidden="true">
        <div class="statbar" id="statbar">
          <div class="stat-chip"><span class="label" id="statLvLabel"></span><span class="value" id="statLevel">1</span></div>
          <div class="hp-bar-wrap">
            <div class="hp-bar-track"><div class="hp-bar-fill" id="hpFill" style="width:100%"></div></div>
            <span id="hpText"></span>
          </div>
          <div class="stat-chip"><span class="label" id="statAtkLabel"></span><span class="value" id="statAtk">0</span></div>
          <div class="stat-chip"><span class="label" id="statDefLabel"></span><span class="value" id="statDef">0</span></div>
          <div class="stat-chip"><span class="label" id="statGoldLabel"></span><span class="value" id="statGold">0</span></div>
        </div>
        <div class="currency-bar" id="currencyBar"></div>
      </section>
      <section class="shell-panel action" aria-label="행동">
        <div class="action-rail" id="actionRail" data-count="1">
          <div class="controls-center">
            <div class="gauge jackpot">
              <div class="gauge-icon" id="gaugeJackpotIcon"></div>
              <div class="gauge-meta">
                <div class="gauge-label" id="gaugeJackpotLabel"></div>
                <div class="gauge-count" id="gaugeJackpot"></div>
              </div>
            </div>
            <button class="island-btn" id="islandBtn" type="button" title="무지개섬으로" style="display:none">🏝️</button>
            <button class="main-btn shell-btn idle" id="mainBtn"></button>
            <div class="choice-buttons" id="choiceButtons" style="display:none;"></div>
            <div class="gauge mid">
              <div class="gauge-icon" id="gaugeMidIcon"></div>
              <div class="gauge-meta">
                <div class="gauge-label" id="gaugeMidLabel"></div>
                <div class="gauge-count" id="gaugeMid"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
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
      <div class="intro-actions">
        <button class="intro-start-btn" id="introStartBtn" type="button">게임 스타트</button>
        <button class="intro-skip-btn" id="introSkipBtn" type="button">🏝️ 로비로 이동</button>
      </div>
    </div>
    <div class="scrapbook-panel" id="scrapbookPanel" style="display:none">
      <div class="scrapbook-sheet">
        <div class="scrapbook-head">
          <div class="scrapbook-title">📖 기억의 스크랩북</div>
          <div class="scrapbook-count" id="scrapbookCount"></div>
        </div>
        <div class="scrapbook-grid" id="scrapbookGrid"></div>
        <div class="scrapbook-detail" id="scrapbookDetail"></div>
        <button type="button" class="scrapbook-close" id="scrapbookClose">닫기</button>
      </div>
    </div>
    <button type="button" class="scrapbook-fab" id="scrapbookFab" style="display:none">
      <span class="scrapbook-fab-icon">📖</span><span class="scrapbook-fab-badge" id="scrapbookBadge"></span>
    </button>
    <div class="catalyst-hud" id="catalystHud" style="display:none" title="정화제"></div>
    <div class="cutscene-overlay" id="cutsceneOverlay" style="display:none">
      <button type="button" class="cutscene-skip-btn" id="cutsceneSkipBtn">스킵 ▶▶</button>
      <div class="cutscene-chapter" id="cutsceneChapter"></div>
      <div class="cutscene-box" id="cutsceneBox">
        <div class="cutscene-speaker" id="cutsceneSpeaker"></div>
        <div class="cutscene-line" id="cutsceneLine"></div>
        <div class="cutscene-tap">▼ 탭하여 계속</div>
      </div>
    </div>
  </div>
`;

mountToolsBar(document.body);

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
const islandBtn = document.getElementById("islandBtn") as HTMLButtonElement;
const shellBrandBtn = document.getElementById("shellBrandBtn") as HTMLButtonElement;
const phoneEl = document.getElementById("phoneRoot") as HTMLElement;
const shellHeader = document.getElementById("shellHeader")!;
const shellTopRes = document.getElementById("shellTopRes")!;
bindSceneHost(phoneEl);
const choiceButtons = document.getElementById("choiceButtons")!;
const gaugeJackpotEl = document.getElementById("gaugeJackpot")!;
const gaugeMidEl = document.getElementById("gaugeMid")!;
const victoryPanel = document.getElementById("victoryPanel")!;
const victoryIcon = document.getElementById("victoryIcon")!;
const victoryTitle = document.getElementById("victoryTitle")!;
const victorySub = document.getElementById("victorySub")!;
const victoryLoot = document.getElementById("victoryLoot")!;
const victoryHint = document.getElementById("victoryHint")!;
const failContinueBtn = document.getElementById("failContinueBtn") as HTMLButtonElement;
const failRetryBtn = document.getElementById("failRetryBtn") as HTMLButtonElement;
const restartBtn = document.getElementById("restartBtn") as HTMLButtonElement;

function ui(key: string, vars?: Record<string, string | number>): string {
  return uiText(data, key, vars);
}

let data: GameData;
let state: PlayerState;
/** 탐방 뷰(Phase 2). 지역 데이터가 없으면 null로 남는다. */
let explore: ExploreView | null = null;
/**
 * 3D 여정 뷰 — 무대의 주연. 탑뷰(explore)는 미니맵으로 내려간다.
 * null이면 3D를 끈 상태(탑뷰 단독)로 예전처럼 동작한다.
 */
let journey3d: Journey3DView | null = null;
let use3dView = true;
/** 무지개섬 로비 — docs/gdd/35 S1 */
let lobby: LobbyView | null = null;
/** 최상위 모드: 로비(집) / 여정(지금 메인 루프) */
let appMode: "lobby" | "journey" = "lobby";
/** 여정을 한 번이라도 시작했는지(첫 외출 부트스트랩용) */
let journeyBootstrapped = false;
/** 첫 외출 부트스트랩(스킬선택 등) 진행 중 — 섬 귀환/재외출 잠금 */
let journeyBootstrapping = false;
/** 스테이지(구역) 넘어갈 때 소프트 귀환 예약 */
let pendingLobbyReturn = false;
let lastStageMapId: string | null = null;
/** 최근 파견 보고(로비 보드) */
let lastDispatchReport: IslandDispatchResult[] = [];
let lastDayShown = 0;
let combatPending: { tier: string; combatId?: string } | null = null;
/** 3D 정화 습격 중 — 메인 버튼은 발사, 다음날 진행은 막는다 */
let raidLive = false;
/** 여정 하단 버튼 — 다음날 / 다가가기 / 줍기 */
type JourneyIdleAction = "next" | "find" | "pick";
let journeyAction: JourneyIdleAction = "next";
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
  playLog("SKILL", res.upgraded ? "강화" : "습득", res.skill.skill_id, res.skill.skill_name);
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
let lastStageLogKey = "";

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

let activityToastTimer = 0;

function syncShellActivity(title?: string | null, subtitle?: string | null) {
  const actTitle = document.getElementById("shellActivityTitle");
  const actSub = document.getElementById("shellActivitySub");
  const toast = document.getElementById("activityToast");
  let changed = false;
  if (actTitle && title != null && actTitle.textContent !== title) {
    actTitle.textContent = title;
    changed = true;
  } else if (actTitle && title != null) {
    actTitle.textContent = title;
  }
  if (actSub && subtitle != null && actSub.textContent !== subtitle) {
    actSub.textContent = subtitle;
    changed = true;
  } else if (actSub && subtitle != null) {
    actSub.textContent = subtitle;
  }
  if (toast && (title != null || subtitle != null)) {
    toast.classList.add("show");
    window.clearTimeout(activityToastTimer);
    activityToastTimer = window.setTimeout(() => toast.classList.remove("show"), changed ? 3200 : 2200);
  }
}

function syncPartyHud() {
  const hud = document.getElementById("partyHud");
  if (!hud) return;
  const hpPct = Math.round((state.hp / Math.max(1, state.maxHp)) * 100);
  const mates = state.joinedPartyMembers
    .map((id) => data.partyMembers.find((m) => m.member_id === id))
    .filter((m): m is PartyMemberDef => !!m)
    .slice(0, 3);
  const selfCard = `
    <div class="party-card self">
      <div class="party-face">🦫</div>
      <div class="party-meta">
        <div class="party-name">모험가 (나)</div>
        <div class="party-bar"><i style="width:${hpPct}%"></i></div>
        <div class="party-stats">ATK ${formatStat(state.atk)} · DEF ${formatStat(state.def)}</div>
      </div>
    </div>`;
  const mateCards = mates
    .map(
      (m) => `
    <div class="party-card">
      <div class="party-face">${m.icon || "🐾"}</div>
      <div class="party-meta">
        <div class="party-name">${m.display_name}</div>
        <div class="party-bar"><i style="width:100%"></i></div>
        <div class="party-stats">${m.description || m.note || ""}</div>
      </div>
    </div>`
    )
    .join("");
  hud.innerHTML = selfCard + mateCards;
}

function syncShellAreaChip() {
  const nameEl = document.getElementById("shellAreaName");
  const chip = document.getElementById("shellAreaChip");
  if (!nameEl) return;
  const map = getStageMapForDay(data, Math.max(1, state.day));
  const next = map?.display_name || "—";
  if (nameEl.textContent !== next) {
    nameEl.textContent = next;
    if (chip) {
      chip.classList.remove("arrive");
      void (chip as HTMLElement).offsetWidth;
      chip.classList.add("arrive");
      window.setTimeout(() => chip.classList.remove("arrive"), 1400);
    }
  }
}

function syncActionRailCount() {
  const rail = document.getElementById("actionRail");
  if (!rail) return;
  const choosing = document.querySelector(".controls")?.classList.contains("choosing-mode");
  if (!choosing) {
    rail.dataset.count = "1";
    return;
  }
  const n = choiceButtons.querySelectorAll(".choice-btn").length;
  rail.dataset.count = String(Math.max(1, Math.min(3, n || 2)));
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
  // className 통째 교체는 explore-on을 지워 맵↔상황창 깜빡임을 만든다 → 클래스만 토글
  const keepExploreOn =
    visualStage.classList.contains("explore-on") || (appMode === "journey" && !!explore);
  for (const c of [...visualStage.classList]) {
    if (c === "visual-stage" || c === "explore-on" || c === "has-stage-bg") continue;
    if (c.startsWith("stage-") || c.startsWith("combat-tier")) {
      visualStage.classList.remove(c);
    }
  }
  if (mode?.bg_class) {
    for (const token of mode.bg_class.split(/\s+/).filter(Boolean)) {
      visualStage.classList.add(token);
    }
  }
  visualStage.classList.toggle("has-stage-bg", !!stageBgLoaded);
  if (keepExploreOn) visualStage.classList.add("explore-on");

  const title = opts?.title ?? mode?.title ?? modeId;
  const subtitle = opts?.subtitle ?? mode?.subtitle ?? "";
  const icon = opts?.icon ?? mode?.icon ?? "";
  stageModeIcon.textContent = icon;
  stageTitle.textContent = title;
  stageSub.textContent = subtitle;
  syncShellActivity(title, subtitle);
  // 주인공은 이모지가 아니라 방랑자 SVG로 1회 렌더(setStageMode마다 덮어쓰면 애니메이션이 끊긴다)
  ensureWandererHero();
  currentStageModeId = modeId;

  const showEnemy = mode?.show_enemy ?? false;
  stageEnemy.style.display = showEnemy ? "" : "none";
  stageVs.style.display = showEnemy ? "" : "none";
  stageBars.style.display = showEnemy ? "flex" : "none";
  // 구조 조우 전용 레이어는 RESCUE 모드에서만 노출 — 다른 모드 전환 시 반드시 숨긴다.
  if (modeId !== "RESCUE") rescueStage.style.display = "none";
  // 정화 전투 바는 playPurifyCombatOnStage가 켠다. 다른 모드로 나가면 반드시 끈다.
  if (modeId !== "COMBAT") {
    purifyBars.style.display = "none";
    visualStage.classList.remove("stage-purify");
    statbarEl.style.display = "";
  }
  if (showEnemy && opts?.enemyIcon) stageEnemy.textContent = opts.enemyIcon;
  if (!showEnemy) clearEnemySkillIcons();
  if (opts?.clearLog !== false && modeId !== "COMBAT") clearStageLog();
  if (modeId === "COMBAT" && opts?.clearLog !== false) clearStageLog();
  renderStageSkillIcons();

  if (opts?.remember !== false && modeId !== "MOVING" && modeId !== "IDLE") {
    lastStageScene = { modeId, title, subtitle, icon };
  }

  // 여정 중 맵은 모드와 무관하게 유지 — 연출은 오버랩만
  syncExploreVisibility(modeId);

  // 31 F4-b: 전투 중 채팅은 조연(디밍). 턴 로그 주연은 상단 stage-log.
  feedEl.classList.toggle("feed-combat-dim", modeId === "COMBAT" || modeId === "COMBAT_WAIT");

  // 상단 창 높이 변경(전투 확대 등) 후 피드 하단 끝점 유지
  scrollFeedToBottom({ anticipatePx: 12 });

  if (modeId !== "IDLE") {
    const key = `${modeId}|${title}|${subtitle}`;
    if (key !== lastStageLogKey) {
      lastStageLogKey = key;
      playLog("STAGE", modeId, title, subtitle || undefined);
    }
  }
}

/** 전체화면 패널 퇴장 — 31 §2-1 (등장 220ms에 맞춘 160ms 페이드아웃) */
const FULLSCREEN_OUT_MS = 160;

function showFullscreen(el: HTMLElement) {
  el.classList.remove("fullscreen-out");
  el.style.display = "flex";
}

function hideFullscreen(el: HTMLElement): Promise<void> {
  return new Promise((resolve) => {
    if (el.style.display === "none") {
      resolve();
      return;
    }
    el.classList.add("fullscreen-out");
    window.setTimeout(() => {
      el.style.display = "none";
      el.classList.remove("fullscreen-out");
      resolve();
    }, FULLSCREEN_OUT_MS);
  });
}

/**
 * 여정 중에는 모드와 무관하게 맵을 끄지 않는다 — 연출은 전부 오버랩.
 * (과거 화이트리스트 참고: IDLE, MOVING, EVENT, LOCATION_*, BRANCH, SKILL, RESCUE, COMBAT, COMBAT_WAIT)
 */

/** S4.1 — 맵/여정 카드에 기둥 한 단어만 붙인다 */
function formatNodeCard(npc: { icon: string; label: string; trigger_type: string; flavor_text: string }): string {
  const pillar = pillarForTrigger(npc.trigger_type);
  const flavor = (npc.flavor_text || "").trim();
  return flavor
    ? `[${pillar}] ${npc.icon} ${npc.label}\n${flavor}`
    : `[${pillar}] ${npc.icon} ${npc.label}`;
}

/**
 * S4.3 — 맵 콘텐츠 종료 후 여정(IDLE)으로 복귀.
 * 맵은 이미 켜져 있으므로 fade/펄스로 깜빡이지 않는다.
 */
function returnToJourneyIdle(opts?: { subtitle?: string }) {
  setStageMode("IDLE", {
    subtitle: opts?.subtitle ?? mapIdleSubtitle(),
    clearLog: false,
  });
  // 노드 하나를 치른 뒤 클리어·정화 표시를 3D 쪽에도 반영한다
  journey3d?.refreshNodes();
  void journey3d?.refreshFloor();
}

function npcAreaId(npc: { area_id?: string; npc_id?: string }): string {
  if (npc.area_id) return npc.area_id;
  const row = npc.npc_id ? data.areaNpcs.find((n) => n.npc_id === npc.npc_id) : undefined;
  return row?.area_id || explore?.areaId || "";
}

function areaUnlocked(areaId: string): boolean {
  return !!areaId && state.purifiedAreas.includes(areaId);
}

async function grantFillPickup(npc: {
  npc_id: string;
  label: string;
  icon: string;
  trigger_type: string;
  trigger_ref: string;
  flavor_text: string;
  area_id?: string;
  x_pct?: number;
  y_pct?: number;
}): Promise<void> {
  if (state.clearedNodes.includes(npc.npc_id)) return;
  if (journey3d?.isOn()) {
    const row = data.areaNpcs.find((n) => n.npc_id === npc.npc_id);
    await journey3d.playPickupGather({
      label: `${npc.icon} ${npc.label}`,
      lookXPct: row?.x_pct ?? npc.x_pct ?? 50,
      lookYPct: row?.y_pct ?? npc.y_pct ?? 80,
    });
  }
  const amount = fillAmountForNode(data, npc.trigger_type, npc.trigger_ref);
  addPurifyAmmo(state, amount);
  const areaId = npcAreaId(npc);
  const have = state.purifyAmmo ?? 0;
  const need = currentAmmoNeed(data, state, areaId);
  const full = need > 0 && have >= need;
  playLog("AMMO", "획득", ammoHaveMsg(have, need), `+${amount}`, npc.npc_id);
  if (full) playLog("AMMO", "완료", ammoFullMsg(), `${have}/${need}`);
  renderCatalystHud();
  await appendCard({
    body: `[정화] ${npc.icon} ${npc.label}\n${npc.flavor_text || "정화제를 주웠다."}`,
    effectLines: full ? [ammoFullMsg(), `${have}/${need}`] : [ammoHaveMsg(have, need), `+${amount}`],
    syncStage: false,
  });
}

async function meltBlightNode(npcId: string, blightName: string): Promise<void> {
  const row = data.areaNpcs.find((n) => n.npc_id === npcId);
  const xPct = row?.x_pct ?? 50;
  const yPct = row?.y_pct ?? 50;
  playLog("BLIGHT", "녹이기", blightName, npcId);
  if (journey3d?.isOn()) {
    // 상황 문구는 필러 카드에만 — 3D 위 모달 라벨은 쓰지 않는다
    await journey3d.runPurifyMelt({ xPct, yPct, label: blightName });
  } else {
    await sleep(800);
  }
}

/**
 * 맵 노드 실행 — 탐방 중 노드를 밟았을 때 기존 콘텐츠 시스템으로 넘긴다(30 · 31 · 35 S4).
 *
 * 하단 버튼(자동 진행)의 기존 시나리오는 **건드리지 않는다**(29번 §0-1 확정).
 * 여기서 실행되는 건 어디까지나 플레이어가 직접 찾아간 결과다.
 *
 * @returns 클리어로 기록할지 여부
 */
async function runMapNode(npc: {
  npc_id: string;
  label: string;
  icon: string;
  trigger_type: string;
  trigger_ref: string;
  flavor_text: string;
}): Promise<boolean> {
  const ref = npc.trigger_ref;
  let cleared = false;
  playLog("NODE", "시작", npc.trigger_type, npc.npc_id, ref || "-", npc.label);

  try {
    switch (npc.trigger_type) {
      case "COMBAT":
      case "MINIBOSS":
      case "BOSS": {
        const areaId = npcAreaId(npc);
        if (!areaUnlocked(areaId)) {
          const need = currentAmmoNeed(data, state, areaId);
          playLog("AMMO", "잠금", npc.trigger_type, npc.npc_id, ammoHaveMsg(state.purifyAmmo ?? 0, need));
          await appendCard({
            body: `[정화] ${npc.icon} ${npc.label}\n아직 이 지역을 되돌리지 못했다.\n먼저 탁한 물웅덩이를 정화하자.`,
            effectLines: [ammoHaveMsg(state.purifyAmmo ?? 0, need)],
          });
          cleared = false;
          break;
        }
        const tier =
          npc.trigger_type === "BOSS" ? "FINALBOSS" : npc.trigger_type === "MINIBOSS" ? "MINIBOSS" : "NORMAL";
        await appendCard({ body: formatNodeCard(npc) });
        await appendCommentary("COMBAT_START");
        // 43 — 관문·최종 앞에서는 리더들이 한마디씩 주고받는다
        if (npc.trigger_type === "MINIBOSS") await fireDialogue("NODE_KIND", "MINIBOSS");
        else if (npc.trigger_type === "BOSS") await fireDialogue("NODE_KIND", "BOSS");
        const enemy = getCombatEnemy(data, ref);
        const combatRow = data.combats.find((c) => c.combat_id === ref);
        feedEl.classList.remove("feed-combat-dim");
        if ((combatRow?.tier || "").toUpperCase() === "PURIFY_FINAL") {
          cleared = await runMemoryBattleFlow(ref);
        } else if (journey3d?.isOn()) {
          /** 전투 = 오염을 푸는 연출. 턴 시뮬·VS 무대를 열지 않는다. */
          cleared = await playRaidUntilResolved({
            label: npc.label,
            icon: npc.icon,
            tier,
            combatId: ref,
          });
        } else if (enemy?.combat_mode === "PURIFY") {
          const pSim = await playPurifyCombatOnStage(ref, tier.startsWith("PURIFY") ? tier : "PURIFY_WAVE1");
          cleared = await settlePurifyAftermath(pSim, ref);
        } else {
          captureFailCheckpoint(state, {
            mode: "turn",
            label: npc.label,
            icon: npc.icon,
            tier,
            combatId: ref,
          });
          for (;;) {
            const sim = await playCombatOnStage(ref, tier);
            await appendBattleLogCard(sim, sim.enemyName || npc.label);
            const settled = await settleCombatAftermath(sim, tier, ref);
            if (settled === "retry") continue;
            cleared = settled === true;
            break;
          }
        }
        break;
      }
      /**
       * 경쟁 미니게임 — 전투를 대신하는 콘텐츠 축.
       *
       * 상대 종류는 arena_config.csv가 정한다(CLOCK·BLIGHT를 번갈아, SCAVENGER를 간혹).
       * 3D 뷰가 붙어 있으면 **그 자리에서** 겨루고, 탑뷰 단독일 때는 판을 열 무대가
       * 없으므로 노드 카드만 남기고 넘어간다.
       */
      case "ARENA": {
        const arena = data.arenas.find((a) => a.arena_id === ref);
        if (!arena) {
          await appendCard({ body: `${formatNodeCard(npc)}\n겨룰 상대 정보가 없다.` });
          cleared = false;
          break;
        }
        if (!journey3d || !journey3d.isOn()) {
          await appendCard({
            body: `${formatNodeCard(npc)}\n${arena.flavor_text}`,
            effectLines: ["지금은 겨룰 자리가 아니다"],
          });
          cleared = false;
          break;
        }
        await appendCard({ body: `[도전] ${npc.icon} ${npc.label}\n${arena.flavor_text}` });
        playLog("ARENA", "시작", arena.arena_id, arena.rival_kind, arena.display_name);
        const bout = await journey3d.runArena(arena);
        if (bout.gaveUp) {
          playLog("ARENA", "물러남", arena.arena_id, arena.rival_kind);
          await appendCard({ body: `${arena.display_name} — 물러났다.`, mood: "sad" });
          cleared = false;
          break;
        }
        if (!bout.won) {
          playLog("ARENA", "패", arena.arena_id, arena.rival_kind, `${bout.score}/${arena.goal}`);
          await appendCard({ body: `[도전] ${arena.lose_text}`, mood: "sad" });
          await appendCommentary("COMBAT_LOSE");
          /**
           * 상대 종류가 판돈을 정한다.
           * 시간·오염에 지면 다시 올 수 있지만, **라이벌에게 지면 그가 들고 가 버린다.**
           * 노드를 소진시켜 재도전을 막는 것이 이 상대만의 무게다.
           */
          cleared = arena.rival_kind === "SCAVENGER";
          if (cleared) {
            await appendCard({
              body: `${arena.rival_icon} ${arena.rival_label}이(가) 먼저 챙겨 갔다.\n이제 여기엔 아무것도 남아 있지 않다.`,
              mood: "sad",
              effectLines: ["기회를 놓쳤다"],
            });
          }
          break;
        }
        const gain = arena.reward_effect_id
          ? applyEffectId(data, state, arena.reward_effect_id)
          : null;
        refreshStatbar();
        playLog("ARENA", "승", arena.arena_id, arena.rival_kind, `${bout.score}/${arena.goal}`, arena.display_name);
        await appendCard({
          body: `[도전] ${arena.win_text}`,
          mood: "joy",
          effectLines: [`${arena.display_name} ${bout.score}/${arena.goal}`, ...(gain?.lines ?? [])],
        });
        cleared = true;
        break;
      }

      case "MINIGAME": {
        const loc = data.locations.find((l) => l.location_id === ref);
        const mgId = loc?.linked_minigame_id?.trim();
        if (!mgId) {
          await appendCard({ body: `${formatNodeCard(npc)}\n지금은 아무 일도 일어나지 않았다.` });
          cleared = false;
          break;
        }
        await appendCard({ body: formatNodeCard(npc) });
        await launchLinkedMinigame(mgId);
        cleared = true;
        break;
      }
      case "LOCATION":
        // resolveLocation이 내러티브 카드를 씀 — 접근 카드는 기둥만 짧게
        await appendCard({ body: `[${pillarForTrigger("LOCATION")}] ${npc.icon} ${npc.label}` });
        await resolveLocation(ref);
        cleared = true;
        break;
      case "NPC": {
        const branch = data.branches.find((b) => b.branch_id === ref);
        if (!branch) {
          await appendCard({ body: formatNodeCard(npc) });
          cleared = false;
          break;
        }
        await showBranchPrompt(branch);
        cleared = true;
        break;
      }
      case "REST": {
        const loc = data.locations.find((l) => l.location_id === ref);
        const res = loc?.linked_effect_id ? applyEffectId(data, state, loc.linked_effect_id) : null;
        refreshStatbar();
        await appendCard({
          body: formatNodeCard(npc),
          effectLines: res?.lines ?? [],
        });
        cleared = false; // 쉼터는 반복 이용 가능 — 소진시키지 않는다
        break;
      }
      case "FILL":
      case "CATALYST": {
        await grantFillPickup(npc);
        cleared = true;
        break;
      }
      case "BLIGHT": {
        // AREA/LIFE: 정화제를 선불하고 그 자리 게이지를 녹인다. 턴 VS는 열지 않는다.
        const blight = data.purifyBlights.find((b) => b.blight_id === ref);
        if (!blight) {
          await appendCard({ body: `[정화] ${npc.icon} ${npc.label}\n오염 데이터가 없다.` });
          cleared = false;
          break;
        }
        playLog("BLIGHT", blight.blight_id, blight.target_kind, blight.display_name);
        if (state.purifiedBlights.includes(ref)) {
          await appendCard({ body: `[정화] ${blight.icon} ${blight.display_name}\n이미 되돌렸다.` });
          cleared = false;
          break;
        }
        const need = ammoCostForBlight(data, blight);
        const have = state.purifyAmmo ?? 0;
        if (have < need) {
          playLog("AMMO", "부족", ammoHaveMsg(have, need), blight.blight_id);
          await appendCard({
            body: `[정화] ${blight.icon} ${blight.display_name}\n${npc.flavor_text || "오염이 짙다."}`,
            effectLines: [ammoShortMsg(have, need)],
          });
          renderCatalystHud();
          cleared = false;
          break;
        }

        spendPurifyAmmo(state, need);
        playLog("AMMO", "소모", ammoSpendMsg(need), blight.target_kind, blight.blight_id);
        renderCatalystHud();
        await appendCard({
          body: `[정화] ${blight.icon} ${blight.display_name}\n${ammoSpendMsg(need)} · 정화 시작`,
          purposeText: blight.purpose_text || undefined,
          effectLines: [ammoHaveMsg(state.purifyAmmo ?? 0, currentAmmoNeed(data, state, npcAreaId(npc)))],
          syncStage: false,
        });
        // AREA 3D는 파도 연출이 본편 — melt 모달은 3D와 겹치므로 생략
        if (!(journey3d?.isOn() && blight.target_kind === "AREA")) {
          await meltBlightNode(npc.npc_id, blight.display_name);
        }
        const result = tryApplyPurify(data, state, ref, { skipCatalyst: true });
        if (!result.ok) {
          await appendCard({
            body: `[정화] ${blight.icon} ${blight.display_name}\n적용할 수 없다.`,
          });
          cleared = false;
          break;
        }

        if (blight.target_kind === "LIFE") {
          playLog("BLIGHT", "생명정화", blight.blight_id, blight.target_ref);
          if (blight.success_flavor) {
            await appendCard({
              body: `[정화] ${blight.success_flavor}`,
              purposeText: blight.purpose_text,
              mood: "joy",
              syncStage: false,
            });
          }
          const join = grantPurifyReward(data, state, blight.target_ref);
          if (join) {
            await playSpiritfarerWelcome(join);
            await appendCard({
              body: join.joinedTeam
                ? `[정화] ${join.member.icon} ${join.member.display_name} 합류!\n${join.member.description}`
                : `[정화] ${join.member.icon} ${join.member.display_name}\n섬 기록에 남겼다.`,
            });
          }
          renderCatalystHud();
          explore?.refreshCurrentArea();
          cleared = true;
          break;
        }

        playLog("BLIGHT", "지역정화", blight.blight_id, blight.display_name);
        journey3d?.setNeedAnim("003");
        await appendCard({
          body: `[정화] ${blight.icon} ${blight.display_name}\n${blight.success_flavor}`,
          purifyBloom: true,
          mood: "joy",
          effectLines: [ammoSpendMsg(need), "지역이 열렸다"],
          syncStage: false,
        });
        await fireDialogue("AREA_PURIFY", blight.target_ref);
        await fireDialogueByPurify(islandPurifyPct().pct);
        journey3d?.setNeedAnim(null);
        if (journey3d?.isOn()) {
          const me = journey3d.getPlayer();
          await journey3d.playPurifyRevealWave({
            xPct: me.xPct,
            yPct: me.yPct,
          });
          const left = journey3d.residualLeft();
          if (left > 0) {
            await appendCard({
              body: `[정화] 파도가 지나갔다.\n스케치로 남은 자리 ${left}곳 — 가까이 가서 칼라 총으로 칠하자.`,
              mood: "joy",
              syncStage: false,
            });
          } else {
            await appendCard({
              body: `[정화] 이 지역의 스케치가 모두 색을 되찾았다.`,
              mood: "joy",
              syncStage: false,
            });
          }
        }
        renderCatalystHud();
        explore?.refreshCurrentArea();
        cleared = true;
        break;
      }
      /* 43 S1 — 구조 조우가 지도에 자리를 갖는다. 확률 스폰(rollIsRescue)은 폐기. */
      case "RESCUE": {
        const areaId = npcAreaId(npc);
        if (!areaUnlocked(areaId)) {
          const need = currentAmmoNeed(data, state, areaId);
          playLog("AMMO", "잠금", "RESCUE", npc.npc_id, ammoHaveMsg(state.purifyAmmo ?? 0, need));
          await appendCard({
            body: `[정화] ${npc.icon} ${npc.label}\n아직 이 지역을 되돌리지 못했다.\n먼저 탁한 물웅덩이를 정화하자.`,
            effectLines: [ammoHaveMsg(state.purifyAmmo ?? 0, need)],
          });
          cleared = false;
          break;
        }
        const animal = data.rescueAnimals.find((a) => a.animal_id === ref);
        if (!animal) {
          await appendCard({ body: `[정화] ${npc.icon} ${npc.label}\n구조 대상 데이터가 없다.` });
          cleared = false;
          break;
        }
        if (state.rescuedAnimals.includes(animal.animal_id)) {
          await appendCard({ body: `[정화] ${animal.icon} ${animal.name}\n이미 함께 가고 있다.` });
          cleared = true;
          break;
        }
        const go = await askRescueApproachOnNode(animal);
        if (!go) {
          playLog("RESCUE", "지나침", animal.animal_id, animal.name);
          // 지나치면 노드는 남는다 — 되돌아와 다시 시도할 수 있다
          await appendCard({
            body: `${animal.icon} ${animal.name}을(를) 지나쳤다. 언젠가 다시 마주칠지도 모른다.`,
            mood: "sad",
          });
          await appendCommentary("RESCUE_PASS");
          cleared = false;
          break;
        }
        await playRescueEncounter(animal);
        cleared = state.rescuedAnimals.includes(animal.animal_id);
        break;
      }

      /* 등급 뽑기 3종 — 시스템은 동일, 이름·연출만 구분 (룰렛 대체) */
      case "DAILY":
      case "TRACE":
      case "FILTER": {
        await resolveGradeFindNode(npc, npc.trigger_type as "DAILY" | "TRACE" | "FILTER");
        cleared = true;
        break;
      }

      /* 43 S1 — 정기를 주기적으로 공급하는 자리. 시작 스킬 3택 대체. */
      case "SKILL": {
        await appendCard({ body: `[탐구] ${npc.icon} ${npc.label}\n${npc.flavor_text}` });
        const tierRow = data.skillTiers.find((t) => t.tier_id === ref);
        const tierName = tierRow?.tier_name || tuningStr(data, "skill_node_default_tier", "일반");
        await grantLevelSkill("CHOICE_3", tierName);
        cleared = true;
        break;
      }

      /**
       * 기억 조각 — 예전에는 ExploreView 안에서만 처리해서 탑뷰로 밟을 때만 주워졌다.
       * 3D 뷰가 같은 노드를 실행하면서 default로 빠져 수집이 안 되던 자리다.
       * 수집 규칙을 여기로 올려 두 뷰가 하나의 경로를 쓴다.
       */
      case "MEMORY": {
        const mem = data.tigonMemories.find((m) => m.memory_id === ref);
        if (!mem) {
          await appendCard({ body: formatNodeCard(npc) });
          cleared = false;
          break;
        }
        if (state.collectedMemories.includes(mem.memory_id)) {
          await appendCard({ body: `[탐구] ✨ ${npc.label}\n이미 품고 있는 기억이다.` });
          cleared = true;
          break;
        }
        state.collectedMemories.push(mem.memory_id);
        renderScrapbookBadge();
        const total = data.tigonMemories.length;
        const got = state.collectedMemories.length;
        await appendCard({
          body: `[탐구] ✨ 희미한 기억 (${got}/${total})\n${mem.scenario_text}`,
          effectLines: [`기억 조각 ${got}/${total}`],
        });
        if (mem.reactor && mem.reaction_text) {
          await appendCard({ body: `— ${mem.reactor}: ${mem.reaction_text}` });
        }
        cleared = true;
        break;
      }

      case "MEMO": {
        // 41 §4 — 전망대는 섬 전체 정화도를 읽는 자리. 그 외 흔적은 플레이버만.
        if (npc.npc_id === "i11_lookout") {
          const p = islandPurifyPct();
          const reached = ISLAND_PURIFY_STEPS.filter((s) => p.pct >= s.pct);
          const next = ISLAND_PURIFY_STEPS.find((s) => p.pct < s.pct);
          await appendCard({
            body: `[탐구] ${npc.icon} ${npc.label}\n${npc.flavor_text}`,
            effectLines: [
              `💧 섬 정화도 ${p.pct}% (${p.done}/${p.total})`,
              ...reached.map((s) => `✔ ${s.label}`),
              ...(next ? [`다음 ${next.pct}% — ${next.label}`] : []),
              `🗓️ 배까지 ${Math.max(0, voyageDays() - state.day)}일`,
            ],
          });
          cleared = false; // 전망대는 언제든 다시 볼 수 있다
          break;
        }
        await appendCard({ body: formatNodeCard(npc) });
        cleared = true;
        break;
      }
      default:
        await appendCard({ body: formatNodeCard(npc) });
        cleared = false;
    }
  } finally {
    playLog("NODE", cleared ? "클리어" : "미클리어", npc.trigger_type, npc.npc_id, npc.label);
    if (cleared && !state.clearedNodes.includes(npc.npc_id)) {
      state.clearedNodes.push(npc.npc_id);
    }
    if (npc.trigger_type !== "FILL" && npc.trigger_type !== "CATALYST") {
      returnToJourneyIdle({
        subtitle: cleared ? `${npc.label} · 길을 이었다` : mapIdleSubtitle(),
      });
    } else {
      journey3d?.refreshNodes();
      explore?.refreshCurrentArea({ animate: false });
    }
  }

  return cleared;
}

// ── 스크랩북(Tigon 기억 조각 열람) ──────────────────────────────────────
// 22번 문서 데이터 + 탐방 맵에서 주운 조각을 펼쳐본다. 메인 진행과 무관한 수집 콘텐츠.

const scrapbookPanel = document.getElementById("scrapbookPanel")!;
const scrapbookGrid = document.getElementById("scrapbookGrid")!;
const scrapbookDetail = document.getElementById("scrapbookDetail")!;
const scrapbookCount = document.getElementById("scrapbookCount")!;
const scrapbookFab = document.getElementById("scrapbookFab")!;
const scrapbookBadge = document.getElementById("scrapbookBadge")!;
const catalystHud = document.getElementById("catalystHud")!;

/** 정화제 탄창 HUD — 여정에서 항상 `정화제 획득 n/need` */
function renderCatalystHud() {
  if (!data || !state) return;
  if (appMode !== "journey") {
    catalystHud.style.display = "none";
    catalystHud.innerHTML = "";
    return;
  }
  const areaId = explore?.areaId || "";
  const have = state.purifyAmmo ?? 0;
  const need = currentAmmoNeed(data, state, areaId);
  const full = need > 0 && have >= need;
  const title = full ? ammoFullMsg() : ammoHaveMsg(have, need);
  const pct = need > 0 ? Math.min(100, Math.round((have / Math.max(1, need)) * 100)) : 0;
  catalystHud.style.display = "flex";
  catalystHud.innerHTML = `
    <span class="ammo-chip${full ? " full" : ""}">
      <span class="ammo-title">${title}</span>
      ${full ? `<span class="ammo-frac">${have}/${need}</span>` : ""}
      <span class="ammo-bar"><i style="width:${pct}%"></i></span>
    </span>`;
}

/**
 * 스크랩 배지 — S3: 주 진입은 로비 단말기.
 * 여정 FAB는 “섬 기록으로” 바로가기(배지만 유지, 패널 직접 오픈 안 함).
 */
function renderScrapbookBadge() {
  if (!data?.tigonMemories?.length) return;
  const got = state.collectedMemories.length;
  // 로비에선 FAB 숨김 · 여정에서만 축소 FAB
  const showFab = got > 0 && appMode === "journey";
  scrapbookFab.style.display = showFab ? "flex" : "none";
  scrapbookBadge.textContent = `${got}`;
  scrapbookFab.title = "섬 기록(단말기)에서 보기";
  refreshLobbyHud();
}

/** 단말기 스크랩 앱 — 로비 우측 패널에 렌더 (S3) */
function renderScrapbookInto(pane: HTMLElement) {
  const mems = data.tigonMemories;
  const got = state.collectedMemories.length;
  pane.innerHTML = `
    <div class="term-scrap">
      <div class="term-scrap-count">${got} / ${mems.length}</div>
      <div class="term-scrap-grid"></div>
      <div class="term-scrap-detail"><div class="scrapbook-hint">조각을 눌러 펼쳐 보세요.</div></div>
    </div>
  `;
  const grid = pane.querySelector(".term-scrap-grid")!;
  const detail = pane.querySelector(".term-scrap-detail")!;
  grid.innerHTML = mems
    .map((m, i) => {
      const owned = state.collectedMemories.includes(m.memory_id);
      return `<button type="button" class="scrapbook-slot${owned ? " owned" : ""}" data-mem="${m.memory_id}" ${owned ? "" : "disabled"}>
        <span class="scrapbook-slot-no">${i + 1}</span>
        <span class="scrapbook-slot-mark">${owned ? "✨" : "?"}</span>
      </button>`;
    })
    .join("");
  grid.querySelectorAll<HTMLElement>(".scrapbook-slot.owned").forEach((el) => {
    el.addEventListener("click", () => {
      const m = mems.find((x) => x.memory_id === el.dataset.mem);
      if (!m) return;
      grid.querySelectorAll(".scrapbook-slot").forEach((s) => s.classList.remove("sel"));
      el.classList.add("sel");
      detail.innerHTML =
        `<div class="scrapbook-text">${m.scenario_text}</div>` +
        (m.reactor ? `<div class="scrapbook-reaction">— ${m.reactor}: ${m.reaction_text}</div>` : "");
    });
  });
}

/** @deprecated S3 — 전체화면 스크랩 대신 로비 단말기 사용 */
function openScrapbook() {
  if (appMode !== "lobby") {
    enterLobby({ note: "기록은 섬 단말기에서 펼쳐요." });
  }
  lobby?.openTerminal("scrapbook");
}

/** S8 — 도감: 스탯표가 아니라 캐릭터 파일(합류·영구·구조 기록) */
function renderDexInto(pane: HTMLElement) {
  const ids = new Set<string>([
    ...state.joinedPartyMembers,
    ...state.permanentPartyMembers,
  ]);
  for (const animalId of state.rescuedAnimals) {
    const a = data.rescueAnimals.find((x) => x.animal_id === animalId);
    if (a?.reward_member_id) ids.add(a.reward_member_id);
  }
  // 정화 전투로 합류한 멤버도 combat_enemy redeems 경로로 joined에 들어감
  const members = data.partyMembers.filter((m) => ids.has(m.member_id));
  if (members.length === 0) {
    pane.innerHTML = `<div class="lobby-term-stub">아직 파일에 남은 아이가 없어요.\n여정에서 구조·정화하면 여기에 쌓여요.</div>`;
    return;
  }
  pane.innerHTML = `
    <div class="term-dex">
      <div class="term-dex-count">${members.length}명 · 캐릭터 파일</div>
      <div class="term-dex-list"></div>
      <div class="term-dex-detail"><div class="scrapbook-hint">이름을 눌러 파일을 펼쳐 보세요.</div></div>
    </div>`;
  const list = pane.querySelector(".term-dex-list")!;
  const detail = pane.querySelector(".term-dex-detail")!;
  list.innerHTML = members
    .map((m) => {
      const scope =
        m.roster_scope === "PERMANENT" || state.permanentPartyMembers.includes(m.member_id)
          ? "영구"
          : state.joinedPartyMembers.includes(m.member_id)
            ? "동행"
            : "기록";
      return `<button type="button" class="term-dex-row" data-mid="${m.member_id}">
        <span class="term-dex-icon">${m.icon}</span>
        <span class="term-dex-name">${m.display_name}</span>
        <span class="term-dex-scope">${scope}</span>
      </button>`;
    })
    .join("");
  list.querySelectorAll<HTMLButtonElement>(".term-dex-row").forEach((btn) => {
    btn.addEventListener("click", () => {
      const m = members.find((x) => x.member_id === btn.dataset.mid);
      if (!m) return;
      list.querySelectorAll(".term-dex-row").forEach((r) => r.classList.remove("sel"));
      btn.classList.add("sel");
      const animal = data.rescueAnimals.find((a) => a.reward_member_id === m.member_id);
      const lore = animal?.hint_text || m.description || "섬에 남은 아이.";
      detail.innerHTML =
        `<div class="term-file-head">${m.icon} ${m.display_name}</div>` +
        `<div class="term-file-body">${lore}</div>` +
        `<div class="term-file-note">${m.note || compactEffectLabel(m)}</div>`;
    });
  });
}

/** S8 — 구조 일지: 성공 목록 + 아직 풀에 남은(재조우 가능) */
function renderJournalInto(pane: HTMLElement) {
  const done = state.rescuedAnimals
    .map((id) => data.rescueAnimals.find((a) => a.animal_id === id))
    .filter((a): a is NonNullable<typeof a> => !!a);
  const waiting = data.rescueAnimals.filter((a) => !state.rescuedAnimals.includes(a.animal_id));
  const curMap = getStageMapForDay(data, Math.max(1, state.day));
  const waitingHere = waiting.filter((a) => a.stage_map_id === (curMap?.stage_map_id ?? ""));
  const waitingLater = waiting.filter((a) => a.stage_map_id !== (curMap?.stage_map_id ?? ""));

  const row = (a: { icon: string; name: string }, tag: string, cls: string) =>
    `<div class="term-journal-row ${cls}"><span>${a.icon} ${a.name}</span><span class="term-journal-tag">${tag}</span></div>`;

  pane.innerHTML = `
    <div class="term-journal">
      <div class="term-journal-sec">
        <div class="term-journal-h">구조 성공 · ${done.length}</div>
        ${
          done.length
            ? done.map((a) => row(a, "완료", "ok")).join("")
            : `<div class="term-journal-empty">아직 구조 기록이 없어요.</div>`
        }
      </div>
      <div class="term-journal-sec">
        <div class="term-journal-h">이 구역에서 만날 수 있음 · ${waitingHere.length}</div>
        ${
          waitingHere.length
            ? waitingHere.map((a) => row(a, `재조우 ${a.reencounter_chance}%`, "wait")).join("")
            : `<div class="term-journal-empty">이 구역 풀은 비었거나 아직 없어요.</div>`
        }
      </div>
      <div class="term-journal-sec">
        <div class="term-journal-h">다른 구역 · ${waitingLater.length}</div>
        ${
          waitingLater.length
            ? waitingLater
                .slice(0, 8)
                .map((a) => row(a, a.stage_map_id, "later"))
                .join("") +
              (waitingLater.length > 8 ? `<div class="term-journal-empty">…외 ${waitingLater.length - 8}</div>` : "")
            : `<div class="term-journal-empty">없음</div>`
        }
      </div>
    </div>`;
}

/** S8 — 여정 지도: 스테이지 진행 + 구역 정화(색 회복) */
function renderMapInto(pane: HTMLElement) {
  const cur = getStageMapForDay(data, Math.max(1, state.day));
  const maps = [...data.stageMaps].sort((a, b) => a.map_order - b.map_order);
  const rows = maps
    .map((m) => {
      const areas = data.areas.filter((a) => a.stage_map_id === m.stage_map_id);
      const purified = areas.filter((a) => state.purifiedAreas.includes(a.area_id)).length;
      const areaBlights = data.purifyBlights.filter(
        (b) => b.target_kind === "AREA" && areas.some((a) => a.area_id === b.target_ref)
      );
      const healMax = Math.max(areaBlights.length, areas.length ? 1 : 0);
      const isCur = cur?.stage_map_id === m.stage_map_id;
      const cleared = cur ? m.map_order < cur.map_order : false;
      const status = isCur ? "현재" : cleared ? "지남" : "앞";
      const healPct = healMax > 0 ? Math.round((purified / healMax) * 100) : purified > 0 ? 100 : 0;
      const tone = purified > 0 ? "healed" : isCur ? "current" : cleared ? "past" : "locked";
      return `<div class="term-map-row ${tone}">
        <div class="term-map-name">${m.display_name}</div>
        <div class="term-map-meta">Day ${m.day_start}–${m.day_end} · ${status}</div>
        <div class="term-map-heal">
          <div class="term-map-heal-bar"><i style="width:${healPct}%"></i></div>
          <span>색 회복 ${purified}/${healMax || "—"}</span>
        </div>
      </div>`;
    })
    .join("");

  const blightLife = data.purifyBlights.filter((b) => b.target_kind === "LIFE");
  const lifeDone = blightLife.filter((b) => state.purifiedBlights.includes(b.blight_id)).length;

  pane.innerHTML = `
    <div class="term-map">
      <div class="term-map-summary">
        정화 구역 ${state.purifiedAreas.length} · 생명 정화 ${lifeDone}/${blightLife.length || 0}
        ${state.finalBossDefeated ? " · 여정 완결" : ""}
      </div>
      ${rows}
    </div>`;
}

/**
 * 탐방 뷰 초기화 — 무대 안쪽 레이어로 마운트한다.
 * 지역 데이터가 비어 있으면(아직 CSV 미작성) 조용히 건너뛴다.
 */
function initExplore() {
  if (!data.areas.length) return;
  rebuildPurifyFoci(data, state);
  explore = new ExploreView(visualStage, data, {
    log: (body) => void appendCard({ body }),
    hasMemory: (id) => state.collectedMemories.includes(id),
    collectMemory: (id) => {
      if (!state.collectedMemories.includes(id)) state.collectedMemories.push(id);
      renderScrapbookBadge();
    },
    isNodeCleared: (nodeId) => state.clearedNodes.includes(nodeId),
    isAreaPurified: (areaId) => state.purifiedAreas.includes(areaId),
    isBlightPurified: (blightId) => state.purifiedBlights.includes(blightId),
    isCatalystGone: (npcId) => state.clearedNodes.includes(npcId),
    getPurifyFoci: (areaId) => (state.purifyFoci ?? []).filter((f) => f.areaId === areaId),
    getIslandPurify: () => islandPurifyPct(),
    // 43 — 섹터에 처음 들어서면 장(章) 헤더 + 그 자리의 대화
    onAreaChange: (area) => {
      ensureChapterHeader(area.area_id);
      void fireDialogue("AREA_ENTER", area.area_id);
      // 두 뷰가 같은 구역을 보고 있어야 한다
      void journey3d?.enter(area.area_id, {
        xPct: explore?.pos.x,
        yPct: explore?.pos.y,
      });
      renderCatalystHud();
    },
    // 41 §1-1 — 섹터 이동도 하루
    onSectorTravel: async () => {
      const ended = await advanceDay();
      refreshStatbar();
      return ended;
    },
    runNode: (npc) => runMapNode(npc),
  });
  // 시작 구역 = 부두(남중 i21). CSV 첫 행이 스폰.
  const startArea = data.areas.find((a) => a.is_spawn) ?? data.areas[0];
  if (startArea) explore.enter(startArea.area_id, { silent: true });
  if (use3dView) initJourney3D(startArea?.area_id);
  (window as unknown as { __explore: () => void }).__explore = () => {
    if (!explore) return;
    if (explore.isOn()) {
      explore.hide();
      visualStage.classList.remove("explore-on");
    } else {
      explore.show();
      visualStage.classList.add("explore-on");
    }
  };
  // 타일 원형 해금 미리보기 — 중앙 focus 토글
  (window as unknown as { __islandWarp: (id: string) => void }).__islandWarp = (id: string) => {
    if (!explore) return;
    const area = data.areas.find((a) => a.area_id === id || a.area_id === `area_${id}`);
    if (!area) {
      console.warn("unknown area", id, data.areas.map((a) => a.area_id));
      return;
    }
    explore.show();
    visualStage.classList.add("explore-on");
    explore.enter(area.area_id);
  };
  (window as unknown as { __islandList: () => void }).__islandList = () => {
    console.table(
      data.areas.map((a) => ({
        id: a.area_id,
        name: a.display_name,
        exits: data.areaConnections
          .filter((c) => c.from_area_id === a.area_id || (c.bidirectional && c.to_area_id === a.area_id))
          .map((c) =>
            c.from_area_id === a.area_id
              ? `${c.exit_point}→${c.to_area_id}`
              : `←${c.from_area_id}`
          )
          .join(" "),
      }))
    );
  };
  (window as unknown as { __purifyTile: () => void }).__purifyTile = () => {
    if (!explore || !state) return;
    const id = "area_i21";
    if (!state.purifyFoci) state.purifyFoci = [];
    const demoId = "blight_s1_pool";
    const existing = state.purifyFoci.findIndex((f) => f.blightId === demoId);
    if (existing >= 0) {
      state.purifyFoci.splice(existing, 1);
      const bi = state.purifiedBlights.indexOf(demoId);
      if (bi >= 0) state.purifiedBlights.splice(bi, 1);
      const ai = state.purifiedAreas.indexOf(id);
      if (ai >= 0 && !state.purifyFoci.some((f) => f.areaId === id)) {
        state.purifiedAreas.splice(ai, 1);
      }
    } else {
      const blight = data.purifyBlights.find((b) => b.blight_id === demoId);
      const npc = data.areaNpcs.find((n) => n.trigger_ref === demoId);
      state.purifyFoci.push({
        blightId: demoId,
        areaId: id,
        xPct: npc?.x_pct ?? 58,
        yPct: npc?.y_pct ?? 52,
        radiusPct: blight?.reveal_radius_pct ?? 34,
      });
      if (!state.purifiedBlights.includes(demoId)) state.purifiedBlights.push(demoId);
      if (!state.purifiedAreas.includes(id)) state.purifiedAreas.push(id);
    }
    explore.refreshCurrentArea({ animate: true });
  };
  /** 첫 지역(부두) 정화 데모: 탐방 켜고 → 촉매 지급 → 웅덩이 정화 → 원형 색 회복 */
  (window as unknown as { __demoPurifyFirst: () => void }).__demoPurifyFirst = () => {
    if (!explore || !state || !data) return;
    if (appMode !== "journey") void enterJourney();
    explore.show();
    visualStage.classList.add("explore-on");
    explore.enter("area_i21");
    state.purifyFoci = (state.purifyFoci ?? []).filter((f) => f.blightId !== "blight_s1_pool");
    state.purifiedBlights = state.purifiedBlights.filter((id) => id !== "blight_s1_pool");
    state.purifiedAreas = state.purifiedAreas.filter((id) => id !== "area_i21");
    state.clearedNodes = state.clearedNodes.filter((id) => id !== "s1_blight_pool" && id !== "s1_catalyst");
    state.purifyAmmo = ammoCost(data, "AREA", 3);
    const result = tryApplyPurify(data, state, "blight_s1_pool", { skipCatalyst: true });
    if (result.ok) spendPurifyAmmo(state, ammoCost(data, "AREA", 3));
    if (!state.clearedNodes.includes("s1_blight_pool")) state.clearedNodes.push("s1_blight_pool");
    if (!state.clearedNodes.includes("s1_catalyst")) state.clearedNodes.push("s1_catalyst");
    explore.refreshCurrentArea({ animate: true });
    void appendCard({
      body: result.ok
        ? `[정화 데모] 탁한 물웅덩이\n캐릭터 주변=스포트라이트 · 웅덩이 주변=색 회복 원`
        : `[정화 데모] 실패: ${result.reason ?? "unknown"}`,
    });
    renderCatalystHud();
  };
}

/**
 * 3D 여정 뷰를 무대에 올린다 — 탑뷰는 같은 순간 미니맵으로 내려간다.
 *
 * 이동은 3D가 만들고 탑뷰는 좌표를 받기만 한다.
 * 전투 노드는 정화 습격 연출로 이어진다.
 */
function initJourney3D(startAreaId?: string) {
  if (journey3d || !data.areas.length) return;

  // 걸을 때마다 탑뷰 DOM을 다시 그리면 무거우므로 일정 거리 이상 움직였을 때만 밀어 넣는다
  let syncedX = -999;
  let syncedY = -999;
  let syncedYaw = 0;

  journey3d = new Journey3DView(visualStage, data, {
    isNodeCleared: (id) => state.clearedNodes.includes(id),
    isNodeRevealed: (npc) => explore?.isRevealedAt(npc.area_id, npc.x_pct, npc.y_pct) ?? true,
    isAreaPurified: (areaId) => state.purifiedAreas.includes(areaId),
    isPropPurified: (id) => (state.purifiedProps ?? []).includes(id),
    onPropPurified: (id) => {
      if (!state.purifiedProps) state.purifiedProps = [];
      if (!state.purifiedProps.includes(id)) state.purifiedProps.push(id);
      playLog("PROP", "잔여정화", id);
    },
    runNode: (npc) => runMapNode(npc),
    getLearnedSkills: () => state.learnedSkills,
    onMove: (x, y, yaw) => {
      const moved = Math.abs(x - syncedX) >= 0.25 || Math.abs(y - syncedY) >= 0.25;
      if (!moved && Math.abs(yaw - syncedYaw) < 2) return;
      if (moved) {
        syncedX = x;
        syncedY = y;
        journey3d?.refreshFogVisibility();
      }
      syncedYaw = yaw;
      explore?.syncFrom3D(x, y, yaw);
      syncJourneyActionBtn();
    },
    onNearChange: () => syncJourneyActionBtn(),
  });

  explore?.setMinimapMode(true);
  if (startAreaId) void journey3d.enter(startAreaId);

  // 3D를 끄고 예전 탑뷰 단독으로 되돌리는 비상구
  (window as unknown as { __view3d: () => void }).__view3d = () => {
    if (!journey3d) return;
    use3dView = !use3dView;
    if (use3dView) {
      explore?.setMinimapMode(true);
      journey3d.show();
      setView3dLayout(true);
    } else {
      journey3d.hide();
      explore?.setMinimapMode(false);
      setView3dLayout(false);
    }
  };
  (window as unknown as { __fps: () => void }).__fps = () => journey3d?.toggleViewMode();
  (window as unknown as { __retro: (s: number) => void }).__retro = (s: number) =>
    journey3d?.setRetro(s);
}

/**
 * 3D가 주연일 때 셸 배치를 갈아 끼운다.
 * 상단 마일스톤 → 좌하단, 헤더는 3D 위에 겹쳐 방위 띠가 가운데를 차지한다.
 */
function setView3dLayout(on: boolean) {
  phoneEl.classList.toggle("view-3d", on);
  if (on) {
    if (dayRoadmap.parentElement !== visualStage) visualStage.appendChild(dayRoadmap);
    dayRoadmap.classList.add("dock-bl");
    void mountJourneyHudLayout();
  } else {
    dayRoadmap.classList.remove("dock-bl");
    if (dayRoadmap.parentElement !== shellHeader) {
      shellHeader.insertBefore(dayRoadmap, shellTopRes);
    }
  }
}

async function mountJourneyHudLayout() {
  if (appMode !== "journey") return;
  const hud = await loadJourneyHudLayout();
  applyJourneyHudLayout(hud, phoneEl);
}

function syncExploreVisibility(_modeId?: string) {
  if (journey3d) {
    // 3D 뷰도 탑뷰와 같은 규칙으로 붙었다 떨어진다
    const on = appMode === "journey" && use3dView;
    if (on) journey3d.show();
    else journey3d.hide();
    setView3dLayout(on);
  }
  if (!explore) return;
  // 로비에 있을 때만 탐방 숨김
  if (appMode === "lobby") {
    explore.hide();
    visualStage.classList.remove("explore-on");
    return;
  }
  // 여정 중: 모드와 무관하게 맵 유지 (BRANCH/SKILL/RESCUE/COMBAT 포함) — 연출은 오버랩
  if (appMode === "journey") {
    if (!explore.isOn()) explore.show();
    visualStage.classList.add("explore-on");
    return;
  }
  // boot/intro 등
  explore.hide();
  visualStage.classList.remove("explore-on");
}

function refreshLobbyHud() {
  if (!lobby || !data || !state) return;
  const map = getStageMapForDay(data, Math.max(1, state.day));
  const slots = getPartySlots(data, Math.max(1, state.day));
  lobby.refresh({
    day: Math.max(1, state.day),
    zoneName: map?.display_name ?? "여정 준비",
    partyCount: state.joinedPartyMembers.length,
    partySlots: slots,
    memoryCount: state.collectedMemories.length,
    memoryTotal: data.tigonMemories.length,
    hasDeparted: journeyBootstrapped,
    purifiedCount: state.purifiedAreas.length,
    partyIcons: state.joinedPartyMembers
      .map((id) => data.partyMembers.find((m) => m.member_id === id)?.icon)
      .filter((x): x is string => !!x),
  });
}

function syncGotoLobbyBtn() {
  // 여정 중: 무지개섬 브랜드가 로비 복귀
  const show = appMode === "journey";
  shellBrandBtn.classList.toggle("is-lobby-link", show);
  shellBrandBtn.title = show ? "무지개섬 로비로" : "무지개섬";
  islandBtn.style.display = "none";
}

function enterLobby(opts?: { note?: string }) {
  if (journeyBootstrapping) return;
  renderCatalystHud();
  appMode = "lobby";
  // 여정을 먼저 숨긴 뒤 로비를 켠다(아래 화면 비침 방지)
  setAppScene("lobby");
  clearJourneyHudLayout(phoneEl);
  refreshLobbyHud();
  lobby?.show();
  islandBtn.style.display = "none";
  scrapbookFab.style.display = "none";
  syncGotoLobbyBtn();
  syncExploreVisibility(currentStageModeId);
  const note =
    opts?.note ??
    (lastDispatchReport.length
      ? `파견 보고 ${lastDispatchReport.length}건이 도착했어요.`
      : undefined);
  if (note) lobby?.flashNote(note);
}

async function enterJourney() {
  if (journeyBootstrapping) return;
  if (appMode === "journey" && journeyBootstrapped && lobby && !lobby.isOn()) {
    setIdle();
    return;
  }

  playLog("GAME", journeyBootstrapped ? "여정 복귀" : "여정 시작", `day${state?.day ?? 1}`);

  appMode = "journey";
  // 로비를 끄기 전에 여정 씬을 켠다(빈 깜빡임·이전 화면 비침 방지)
  setAppScene("journey");
  lobby?.hide();
  islandBtn.style.display = "none";
  syncGotoLobbyBtn();
  renderScrapbookBadge();
  renderCatalystHud();
  syncExploreVisibility(currentStageModeId);
  void mountJourneyHudLayout();

  if (!journeyBootstrapped) {
    journeyBootstrapping = true;
    islandBtn.style.display = "none";
    try {
      setStageMode("IDLE");
      // 43 — 장 헤더 → 도착 카드 → 리더 대화 + 방랑자 독백
      ensureChapterHeader(spawnAreaId());
      await appendCard({ body: textFor(data, "t_hometown") });
      await fireDialogue("JOURNEY_START");
      ensureDayHeader(1);
      state.day = 1;
      lastStageMapId = getStageMapForDay(data, 1)?.stage_map_id ?? null;
      /*
       * 43 S3 — 「모험가 훈장 미리보기 → 시작 스킬 3택」 제거.
       * 지시자: 초반에 스킬이 배워지는 옛 시퀀스는 뺀다.
       * 정기는 이제 맵의 SKILL 노드(`area_npc_config`, trigger_ref=티어)에서만 나온다.
       * 남긴 것: startSkillTier()는 훈장 시스템 구현 시 다시 쓸 수 있어 함수는 보존.
       */
      journeyBootstrapped = true;
      setIdle();
    } finally {
      journeyBootstrapping = false;
      islandBtn.style.display = "none";
    }
    return;
  }
  setIdle();
}

function formatDispatchBoard(): string {
  if (!lastDispatchReport.length) {
    const slots = getPartySlots(data, Math.max(1, state.day));
    const overflow = Math.max(0, state.joinedPartyMembers.length - slots);
    if (state.joinedPartyMembers.length === 0) {
      return "아직 섬에 남은 아이가 없어요.\n여정에서 구조하면 파견이 시작돼요.";
    }
    if (overflow === 0) {
      return "지금은 모두가 여정에 동행 중이에요.\n슬롯이 가득 차면 남은 아이들이 섬에서 일해요.";
    }
    return "아직 오늘의 파견 보고가 없어요.\n「다음날」을 넘기면 아이들이 일해 와요.";
  }
  const lines = lastDispatchReport.map((r) => `· ${r.line}`);
  const gold = lastDispatchReport.reduce((s, r) => s + r.gold, 0);
  const exp = lastDispatchReport.reduce((s, r) => s + r.exp, 0);
  lines.push("");
  lines.push(`합계 🪙${gold} · ✨${exp}`);
  return lines.join("\n");
}

function initLobby() {
  lobby = new LobbyView(phoneEl, {
    onDepart: () => {
      void enterJourney();
    },
    onRenderScrapbook: (pane) => {
      renderScrapbookInto(pane);
    },
    onRenderDex: (pane) => {
      renderDexInto(pane);
    },
    onRenderJournal: (pane) => {
      renderJournalInto(pane);
    },
    onRenderMap: (pane) => {
      renderMapInto(pane);
    },
    onOpenDispatch: () => {
      lobby?.showDispatchBoard(formatDispatchBoard());
    },
    onOpenAdventure: () => {
      openAdventureBoard();
    },
    onAdventurePick: (stageMapId) => {
      void runLobbyAdventure(stageMapId);
    },
    onOpenParty: () => {
      const n = state.joinedPartyMembers.length;
      const slots = getPartySlots(data, Math.max(1, state.day));
      lobby?.flashNote(n === 0 ? "아직 함께할 아이가 없어요. 여정에서 구조해 보세요." : `협동 ${n}명 · 전투 슬롯 ${slots}`);
    },
  });

/** S5 — 로비 모험 보드. 지난 스테이지만 목록. */
function openAdventureBoard() {
  const maps = listAdventureMaps(data, state);
  if (maps.length === 0) {
    lobby?.showAdventureBoard(
      `<div class="lobby-adv-empty">아직 지난 구역이 없어요.<br/>여정으로 다음 스테이지를 열면,<br/>여기로 돌아와 편하게 순찰할 수 있어요.</div>`
    );
    return;
  }
  const rows = maps
    .map(
      (m) =>
        `<button type="button" class="lobby-adv-row" data-map="${m.stage_map_id}">
          <span class="lobby-adv-name">${m.display_name}</span>
          <span class="lobby-adv-meta">Day ${m.day_start}–${m.day_end} · 자동 순찰</span>
          <span class="lobby-adv-go">보내기</span>
        </button>`
    )
    .join("");
  lobby?.showAdventureBoard(
    `<div class="lobby-adv-hint">[도전 · 모험] 스토리는 밀리지 않아요. 골드·경험만 소량.</div>${rows}`
  );
}

/** S5 — 모험 1회 실행. 정화/기억/관문 없음. */
async function runLobbyAdventure(stageMapId: string) {
  const result = runAdventurePatrol(data, state, stageMapId);
  if (!result) {
    lobby?.flashNote("그 구역은 아직 모험할 수 없어요.");
    return;
  }
  lobby?.hideBoard();
  refreshStatbar();
  refreshCurrencyBar();
  const lvl = checkLevelUp(data, state);
  lobby?.flashNote(`모험 완료 · 🪙${result.gold} · ✨${result.exp}`);
  // 여정 로그에도 짧게 한 장(로비에서 외출 후 보이게)
  if (appMode === "lobby") {
    lobby?.showAdventureBoard(
      `<div class="lobby-adv-result">
        <div class="lobby-adv-result-title">순찰 보고</div>
        <div class="lobby-adv-result-body">${result.flavor}</div>
        <div class="lobby-adv-result-loot">🪙 골드 +${result.gold} · ✨ 경험치 +${result.exp}${
          lvl ? ` · Lv.${lvl.newLevel}` : ""
        }</div>
        <button type="button" class="lobby-adv-again" data-map="${stageMapId}">한 번 더</button>
      </div>`
    );
  }
}
  islandBtn.addEventListener("click", () => {
    if (appMode !== "journey") return;
    if (journeyBootstrapping) return;
    if (
      currentStageModeId === "COMBAT" ||
      currentStageModeId === "COMBAT_WAIT" ||
      currentStageModeId === "RESCUE" ||
      currentStageModeId === "SKILL"
    ) {
      return;
    }
    enterLobby({ note: "무지개섬으로 돌아왔어요." });
  });
  // 상단 「무지개섬」 = 로비 복귀
  shellBrandBtn.addEventListener("click", () => {
    if (journeyBootstrapping) return;
    if (appMode !== "journey") return;
    enterLobby({ note: "무지개섬으로 돌아왔어요." });
  });
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
      syncShellActivity(null, stageSub.textContent);
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

function updatePurifyBars(playerHp: number, playerMax: number, corruption: number, corruptionMax: number) {
  const pMax = Math.max(1, playerMax);
  const cMax = Math.max(1, corruptionMax);
  purifyPlayerFill.style.width = `${Math.max(0, Math.min(100, (playerHp / pMax) * 100))}%`;
  purifyPlayerValue.textContent = `${Math.round(playerHp)}/${Math.round(playerMax)}`;
  purifyEnemyFill.style.width = `${Math.max(0, Math.min(100, (corruption / cMax) * 100))}%`;
  purifyEnemyValue.textContent = `${Math.round(corruption)}/${Math.round(corruptionMax)}`;
}

/**
 * S6b / 18 — 정화 전투 스테이지 연출.
 * 액션 전투와 분리: purify-bars · 펫 아이콘 위 · 하단 액션 스탯바 숨김 · 턴 로그는 상단.
 */
async function playPurifyCombatOnStage(
  combatId: string | undefined,
  tier = "PURIFY_WAVE1"
): Promise<PurifyCombatResult> {
  const enemyRow = combatId ? getCombatEnemy(data, combatId) : undefined;
  const previewName = enemyRow?.enemy_name ?? "오염된 존재";
  const previewIcon = enemyRow?.enemy_icon && enemyRow.enemy_icon !== "🌫️" ? enemyRow.enemy_icon : "🐾";
  await playCombatVsIntro({
    tier,
    enemyName: previewName,
    enemyIcon: previewIcon,
  });

  const hpBefore = state.purifyHp;
  const sim = simulatePurifyCombat(data, state, combatId);
  state.purifyHp = hpBefore;

  const map = getStageMapForDay(data, state.day);
  setStageMode("COMBAT", {
    title: "정화",
    subtitle: [map?.display_name, previewName].filter(Boolean).join(" · "),
    enemyIcon: previewIcon,
    clearLog: true,
  });
  visualStage.classList.add("stage-purify");
  stageBars.style.display = "none";
  purifyBars.style.display = "flex";
  statbarEl.style.display = "none";
  setGaugesVisible(false);
  stageEnemy.classList.remove("elite", "boss");
  clearEnemySkillIcons();
  renderPartyRow();
  updatePurifyBars(state.purifyHp, state.purifyMaxHp, sim.corruptionGaugeMax, sim.corruptionGaugeMax);
  appendStageLogLine(`정화를 시작한다 — ${previewName}`, "hit-buff");
  playLog("COMBAT", "턴정화 시작", tier, combatId || "-", previewName);

  const delayHit = tuningNum(data, "hit_delay_ms", 780);
  const delaySkill = Math.round(tuningNum(data, "skill_delay_ms", 520) * 0.85);
  const delayWin = tuningNum(data, "win_delay_ms", 1000);

  for (const log of sim.logs) {
    state.purifyHp = log.purifyHp;
    updatePurifyBars(log.purifyHp, log.purifyMaxHp, log.corruptionRemaining, sim.corruptionGaugeMax);
    appendStageLogLine(
      `T${log.turn} 정화 −${Math.round(log.purifyDealt)} → 타락 ${Math.round(log.corruptionRemaining)}`,
      "hit-player"
    );
    if (log.regen > 0) {
      appendStageLogLine(`오염이 되살아난다 (+${Math.round(log.regen)})`, "hit-phase");
    }
    for (const sk of log.skillLogs) {
      appendStageLogLine(sk, "hit-skill");
      await sleep(delaySkill);
    }
    playCombatStrikeFx({ attacker: "player", skill: true });
    await sleep(Math.round(delayHit * 0.55));
    clearCombatActorFx();
  }

  state.purifyHp = Math.max(0, sim.logs[sim.logs.length - 1]?.purifyHp ?? state.purifyHp);
  if (sim.won) {
    updatePurifyBars(state.purifyHp, state.purifyMaxHp, 0, sim.corruptionGaugeMax);
    appendStageLogLine("정화 완료 — 오염이 걷혔다", "hit-win");
    playLog("COMBAT", "턴정화 성공", tier, combatId || "-", previewName);
    await sleep(delayWin);
  } else {
    appendStageLogLine("정화 실패 — 아직 오염이 짙다", "hit-timeout");
    playLog("COMBAT", "턴정화 실패", tier, combatId || "-", previewName);
    await sleep(delayWin);
  }

  purifyBars.style.display = "none";
  visualStage.classList.remove("stage-purify");
  statbarEl.style.display = "";
  setGaugesVisible(true);
  refreshStatbar();
  return sim;
}

/** Spiritfarer식 짧은 환영/완결 비트 — 이름 콜 + 아이콘 펀치인 */
async function playSpiritfarerWelcome(join: PartyMemberJoinResult) {
  const m = join.member;
  revealIcon.innerHTML = petHeadMarkup(m.icon, petNeonColor(m.member_id), 56);
  revealName.textContent = m.display_name;
  revealDesc.textContent = join.joinedTeam
    ? `${m.description} · 이번 여정을 함께해요`
    : `${m.description} · 섬에서 기다려 줄게요`;
  stageRevealPanel.classList.add("expanded", "welcome-bit");
  stageRevealPanel.style.display = "flex";
  await sleep(1600);
  stageRevealPanel.classList.remove("expanded", "welcome-bit");
  await sleep(220);
  stageRevealPanel.style.display = "none";
  revealIcon.textContent = "🐾";
  renderPartyRow();
}

/**
 * S7 — Memory Battle (60일 / PURIFY_FINAL).
 * 게이지 전투 대신 대화 2지선다. 직전 마지막 기억 강제 언락(`22` §2-3).
 * 승리 시 열두 PERMANENT + 소프트 로비 귀환(하드 victory 패널 생략).
 */
async function runMemoryBattleFlow(combatId = "c_purify_final"): Promise<boolean> {
  mainBtn.disabled = true;
  mainBtn.classList.remove("btn-slide-in");
  setMainBtnLabel(ui("ui_btn_combat_active"), true);
  setMainBtnClass('combat', 'combat-busy');

  const forced = forceUnlockFinaleMemory(data, state);
  if (forced) {
    const n = state.collectedMemories.length;
    const total = data.tigonMemories.length;
    await appendCard({
      body: `✨ 마지막 기억 조각 (${n}/${total})\n${forced.scenario_text}`,
    });
    if (forced.reactor && forced.reaction_text) {
      await appendCard({ body: `— ${forced.reactor}: ${forced.reaction_text}` });
    }
    renderScrapbookBadge();
  }

  const enemy = getCombatEnemy(data, combatId);
  const enemyName = enemy?.enemy_name ?? "오염된 열두";
  const enemyIcon = enemy?.enemy_icon && enemy.enemy_icon !== "🌫️" ? enemy.enemy_icon : "🐾";
  playLog("COMBAT", "기억전투 시작", combatId, enemyName);

  await playCombatVsIntro({ tier: "PURIFY_FINAL", enemyName, enemyIcon });

  const map = getStageMapForDay(data, state.day);
  setStageMode("COMBAT", {
    title: "Memory Battle",
    subtitle: [map?.display_name, "대화로 정화"].filter(Boolean).join(" · "),
    enemyIcon,
    clearLog: true,
  });
  visualStage.classList.add("stage-memory-battle");
  stageBars.style.display = "none";
  purifyBars.style.display = "none";
  statbarEl.style.display = "none";
  setGaugesVisible(false);
  stageEnemy.classList.add("boss");
  clearEnemySkillIcons();
  renderPartyRow();
  appendStageLogLine("칼이 아니라 기억으로 다가간다", "hit-buff");

  await appendCard({
    body: `[Memory Battle] ${enemyIcon} ${enemyName}\n오염 너머의 이름을 부른다.`,
  });

  const rounds = [...(data.memoryBattleRounds ?? [])].sort((a, b) => a.round_order - b.round_order);
  const need = memoryBattleWinsNeeded(data, state);
  let wins = 0;

  for (const round of rounds) {
    appendStageLogLine(`R${round.round_order}`, "hit-phase");
    await appendCard({ body: round.prompt });
    const tag = await awaitApproachChoice(
      { tag: "good", label: round.opt_good },
      { tag: "bad", label: round.opt_bad }
    );
    if (tag === "good") {
      wins += 1;
      let line = round.good_line;
      if (round.memory_boost_id && state.collectedMemories.includes(round.memory_boost_id)) {
        line += "\n(모은 기억 조각이 빛난다)";
      }
      await appendCard({ body: line });
      appendStageLogLine("마음이 열린다", "hit-buff");
    } else {
      await appendCard({ body: round.bad_line });
      appendStageLogLine("오염이 꿈틀거린다", "hit-timeout");
    }
    await sleep(360);
  }

  visualStage.classList.remove("stage-memory-battle");
  stageBars.style.display = "";
  purifyBars.style.display = "none";
  statbarEl.style.display = "";
  setGaugesVisible(true);
  choiceButtons.style.display = "none";
  choiceButtons.innerHTML = "";
  mainBtn.style.display = "";
  refreshStatbar();

  const won = wins >= need;
  if (!won) {
    await appendCard({
      body: `[Memory Battle] 아직 열두의 기억이 닫혀 있다. (${wins}/${need})`,
      effectLines: ["다시 다가갈 수 있다"],
    });
    combatPending = { tier: "PURIFY_FINAL", combatId };
    mainBtn.classList.remove("combat-busy");
    mainBtn.classList.add("combat-pulse");
    setMainBtnLabel("다시 다가가기", false);
    mainBtn.disabled = false;
    syncStageWithLog({
      modeId: "EVENT",
      title: "Memory Battle",
      subtitle: "아직 닫혀 있다",
      clearLog: false,
    });
    playLog("COMBAT", "기억전투 미완", combatId, enemyName);
    return false;
  }

  const combat = data.combats.find((c) => c.combat_id === combatId);
  const gold = combat ? randInt(combat.gold_min || 200, combat.gold_max || 400) : 400;
  const exp = combat ? randInt(combat.exp_min || 60, combat.exp_max || 100) : 200;
  state.gold += gold;
  state.exp += exp;
  refreshStatbar();
  refreshCurrencyBar();

  await appendCard({
    body: `[Memory Battle] 오염이 걷히고, 이름이 돌아온다.`,
    effectLines: [ui("ui_chip_exp", { exp }), ui("ui_chip_gold", { gold }), `공감 ${wins}/${rounds.length}`],
  });

  const join = grantPurifyReward(data, state, combatId);
  state.finalBossDefeated = true;
  combatPending = null;
  mainBtn.classList.remove("combat-pulse", "combat-busy");

  if (join) {
    await playSpiritfarerWelcome(join);
    await appendCard({
      body: `[결말] ${join.member.icon} ${join.member.display_name}\n섬에 영구히 남는다. 네가 기억하면, 나는 여기 있어.`,
    });
  }

  const lvl = checkLevelUp(data, state);
  if (lvl) {
    await appendCard({ body: ui("ui_levelup", { lv: lvl.newLevel }) });
  }

  const prev = readMeta();
  localStorage.setItem(META_CHAPTER_KEY, String(prev.chapter + 1));
  localStorage.setItem(META_BEST_KEY, String(Math.max(prev.best, state.day)));

  syncStageWithLog({
    modeId: "EVENT",
    title: "여정 완결",
    subtitle: "열두가 돌아왔다",
    clearLog: false,
  });

  await sleep(900);
  playLog("COMBAT", "기억전투 완결", combatId, enemyName);
  enterLobby({ note: "열두가 섬에 남았다. 여정이 한 바퀴 돌았어요." });
  return true;
}

async function settlePurifyAftermath(sim: PurifyCombatResult, combatId?: string): Promise<boolean> {
  state.gold += sim.goldEarned;
  state.exp += sim.expEarned;
  refreshStatbar();
  refreshCurrencyBar();
  combatPending = null;
  mainBtn.classList.remove("combat-pulse", "combat-busy");

  if (!sim.won) {
    await appendCard({
      body: `[정화] 아직 오염이 걷히지 않았다.`,
      effectLines: sim.wiped ? ["모험가가 지쳤다"] : ["타락이 남았다"],
    });
    return false;
  }

  await appendCard({
    body: `[정화] 오염이 걷히고 존재가 돌아온다.`,
    effectLines: [
      ui("ui_chip_exp", { exp: sim.expEarned }),
      ui("ui_chip_gold", { gold: sim.goldEarned }),
    ],
  });
  const join = grantPurifyReward(data, state, combatId);
  if (join) {
    await playSpiritfarerWelcome(join);
    await appendCard({
      body: join.joinedTeam
        ? `[정화] ${join.member.icon} ${join.member.display_name} 합류!\n${join.member.description}`
        : `[정화] ${join.member.icon} ${join.member.display_name}\n섬 기록에 남겼다.`,
    });
  }
  const lvl = checkLevelUp(data, state);
  if (lvl) {
    await appendCard({ body: ui("ui_levelup", { lv: lvl.newLevel }) });
  }
  return true;
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
      b.className = "choice-btn shell-btn rescue-choice" + (secondary ? " secondary" : "");
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
/**
 * 43 S1 — 노드에서 만난 아이에게 다가갈지 고른다.
 * 옛 `presentRescueApproach`는 `finishTurn`을 불러 주사위 루프에 묶여 있어 노드에서 못 쓴다.
 * 여기서는 **결과만 돌려주고** 흐름은 `runMapNode`가 쥔다.
 */
function askRescueApproachOnNode(animal: RescueAnimalDef): Promise<boolean> {
  return new Promise((resolve) => {
    const mk = (label: string, secondary: boolean) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "choice-btn shell-btn rescue-approach" + (secondary ? " secondary" : "");
      b.textContent = label;
      return b;
    };
    const approach = mk("🐾 다가가기", false);
    const pass = mk("🚶 지나친다", true);
    const done = (v: boolean) => {
      choiceButtons.style.display = "none";
      choiceButtons.innerHTML = "";
      mainBtn.style.display = "";
      setGaugesVisible(true);
      resolve(v);
    };
    approach.onclick = async () => {
      await playActivate(approach);
      done(true);
    };
    pass.onclick = async () => {
      await playActivate(pass);
      done(false);
    };
    choiceButtons.innerHTML = "";
    choiceButtons.appendChild(approach);
    choiceButtons.appendChild(pass);
    choiceButtons.style.display = "flex";
    mainBtn.style.display = "none";
    setGaugesVisible(false);
    slideIn(choiceButtons);
  });
}

function presentRescueApproach(animal: RescueAnimalDef) {
  const mk = (label: string, secondary: boolean) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "choice-btn shell-btn rescue-approach" + (secondary ? " secondary" : "");
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
  setMainBtnClass('combat', 'combat-busy');
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
  // 41 §4-2 · 75% — 섬이 밝아지면 아이들이 경계를 덜 한다(시작 정화도 보너스)
  const islandP = islandPurifyPct();
  const headStart = islandP.pct >= 75 ? Math.round(goal * 0.15) : 0;
  let pct = headStart;
  rescueAnimal.innerHTML = ""; // 이전 동물 실루엣 제거 → 새 동물로 재주입
  renderRescueStage(animal, pct, maxTurns, 0);
  rescueSituation.textContent = animal.hint_text;
  appendStageLogLine(`${animal.icon} ${animal.name} 조우 — ${animal.hint_text}`, "hit-turn");
  playLog("RESCUE", "시작", animal.animal_id, animal.name, `목표${goal}`, `턴${maxTurns}`);
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
    const firstEver = state.rescuedAnimals.length === 0;
    const res = grantRescueReward(data, state, animal);
    // 43 — 합류는 기쁨의 결
    await appendCard({
      body: `${animal.name} 정화 성공! 무사히 구조했다.`,
      mood: "joy",
      effectLines: [`🪙 골드 +${animal.gold}`, `✨ 경험치 +${animal.exp}`],
    });
    await appendCommentary("RESCUE_WIN");
    // 43 — 첫 아이는 리더들이 한 번 주고받는다
    if (firstEver) await fireDialogue("FIRST_RESCUE");
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
    playLog("RESCUE", "구조", animal.animal_id, animal.name);
  } else {
    await appendCard({ body: `${animal.name}이(가) 겁을 먹고 달아났다. 언젠가 다시 마주칠지도 모른다.` });
    await appendCommentary("RESCUE_FAIL");
    refreshStatbar();
    setStageMode("EVENT", { title: "구조 실패…", subtitle: stageHeadline(`${animal.name} 놓침`), clearLog: false });
    playLog("RESCUE", "실패", animal.animal_id, animal.name);
  }
}

function slideIn(el: HTMLElement) {
  el.classList.remove("btn-slide-in");
  void el.offsetWidth;
  el.classList.add("btn-slide-in");
}

function setGaugesVisible(visible: boolean) {
  document.querySelectorAll<HTMLElement>(".controls .gauge").forEach((g) => {
    if (g.classList.contains("hud-layout-hidden")) {
      g.style.display = "none";
      return;
    }
    g.style.display = visible ? "" : "none";
  });
  document.querySelector(".controls")?.classList.toggle("choosing-mode", !visible);
  syncActionRailCount();
}

function setMainBtnClass(...parts: string[]) {
  mainBtn.className = ["main-btn", "shell-btn", ...parts].filter(Boolean).join(" ");
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
  const goldChip =
    (document.querySelector(".shell-top-gold") as HTMLElement | null) ||
    (goldEl?.closest(".stat-chip") as HTMLElement | null);
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
  const topGold = document.getElementById("shellTopGold");
  if (topGold) animateCountText(topGold, fromGold, toGold, 650, formatStat);
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
  const topHp = document.getElementById("shellTopHp");
  const topGold = document.getElementById("shellTopGold");
  if (topHp) {
    topHp.textContent = `${formatStat(next.hp)}/${formatStat(state.maxHp)}`;
  }
  if (topGold && (first || next.gold <= prevStatSnap.gold)) {
    topGold.textContent = formatStat(next.gold);
  }

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
  syncPartyHud();
  syncShellAreaChip();
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
  if (!controls || controls.offsetParent === null) return 110;
  const h = controls.getBoundingClientRect().height;
  // 가로 모드에서 도크가 낮아졌으므로 하한도 함께 낮춤(세로 시절 120)
  return Math.max(72, Math.ceil(h));
}

/**
 * 도크 높이를 CSS 변수로 노출 — `.main-area`가 이 값만큼 하단 여백을 잡아
 * statbar/currency-bar가 도크에 가리지 않는다.
 *
 * 가로 모드 전환(2026-08-04) 이후 도크는 메인 영역 폭(right:35%)까지만 덮으므로
 * 채팅 패널(.feed)에는 더 이상 큰 하단 여백이 필요 없다.
 */
function syncFeedBottomPad(extra = 0) {
  const h = getControlsOverlayHeight() + extra;
  feedEl.style.paddingBottom = "12px";
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
    // 2) 타깃 카드가 패널 하단을 넘치면 추가 보정
    //    (가로 모드: 도크는 메인 영역만 덮으므로 채팅 패널엔 가림이 없음)
    if (target && feedEl.contains(target)) {
      const feedRect = feedEl.getBoundingClientRect();
      const visibleBottom = feedRect.bottom;
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
  /**
   * 43 — 감정 톤. 등급(대박/중박/…)과 **별개 축**이다.
   * sad = 잃음·아픈 기억 · joy = 합류·되찾음. 지정 안 하면 기존 동작 그대로.
   */
  mood?: "sad" | "joy";
  /** 43 — 정화 카드: 흑백에서 색이 돌아온다 */
  purifyBloom?: boolean;
  /** 43 — 왜 정화하는가 한 줄 (purify_blight_config.purpose_text) */
  purposeText?: string;
  /**
   * false면 상단 무대 상황창(stage-caption)에 동기하지 않는다.
   * 3D 정화/정화제처럼 필러만 쓸 때.
   */
  syncStage?: boolean;
}

/* ══════════ 43 · 필러 신규 카드 종류 ══════════
   기존 카드(appendCard)·레이아웃·CSS는 건드리지 않는다.
   여기 넷은 필러에 **화자와 결**을 넣기 위한 추가 종류다.
   - 방랑자 독백 : 주인공 목소리가 필러에 없었다
   - 리더 채팅   : appendCommentary는 1줄뿐이라 주고받는 대화가 없었다
   - 장(章) 헤더 : 일차 헤더 위 단계
   - 전투 요약   : 턴 로그가 상단 무대에만 있어 필러에 안 남았다
   ══════════════════════════════════════════════ */

/** 방랑자 독백 — 박스 없는 한 줄. 하루를 쓰지 않는다(같은 날의 결) */
async function appendMonologue(line: string): Promise<void> {
  if (!line) return;
  const el = document.createElement("div");
  el.className = "filler-mono";
  el.innerHTML = highlightKeywords(data, line);
  feedEl.appendChild(el);
  scrollFeedToBottom({ el, anticipatePx: 12 });
  await sleep(620);
}

/**
 * 43 S2 — **트리거로** 대화를 찾는다. 코드에 dialogue_id를 박지 않는다.
 * 같은 트리거가 여러 묶음이면 조건이 맞는 첫 묶음 하나만 나온다.
 */
const firedDialogues = new Set<string>();
async function fireDialogue(trigger: string, ref?: string): Promise<void> {
  const rows = (data.dialogues ?? []).filter(
    (d) => d.trigger === trigger && (!d.trigger_ref || !ref || d.trigger_ref === ref)
  );
  if (!rows.length) return;
  const id = rows[0].dialogue_id;
  if (firedDialogues.has(id)) return; // 한 판에 한 번
  firedDialogues.add(id);
  await appendDialogue(id);
}

/** 정화도 임계선을 넘었을 때만 해당 묶음을 튼다 (PURIFY_PCT) */
async function fireDialogueByPurify(pct: number): Promise<void> {
  const rows = (data.dialogues ?? []).filter((d) => d.trigger === "PURIFY_PCT");
  const ids = [...new Set(rows.map((r) => r.dialogue_id))];
  for (const id of ids) {
    const need = Number(rows.find((r) => r.dialogue_id === id)?.trigger_ref ?? "0");
    if (pct >= need && !firedDialogues.has(id)) {
      firedDialogues.add(id);
      await appendDialogue(id);
    }
  }
}

/** 리더 채팅 — dialogue_config의 한 묶음을 순서대로 흘린다 */
async function appendDialogue(dialogueId: string): Promise<void> {
  const lines = (data.dialogues ?? []).filter((d) => d.dialogue_id === dialogueId);
  if (!lines.length) return;
  let wrap: HTMLElement | null = null;
  for (const d of lines) {
    if (d.style === "MONO") {
      wrap = null; // 독백이 끼면 말풍선 묶음을 끊는다
      await appendMonologue(d.line);
      continue;
    }
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.className = "filler-chat card";
      // .card의 배경/보더를 쓰지 않도록 최소만 무력화 (인라인 · 기존 CSS 불변)
      wrap.style.background = "none";
      wrap.style.border = "0";
      wrap.style.padding = "0";
      wrap.style.boxShadow = "none";
      wrap.style.clipPath = "none";
      feedEl.appendChild(wrap);
    }
    const b = document.createElement("div");
    b.className = "filler-bub" + (d.style === "ME" ? " me" : "");
    b.innerHTML =
      `<span class="filler-bub-who">${d.icon} ${d.speaker}</span>` +
      `<span class="filler-bub-line">${highlightKeywords(data, d.line)}</span>`;
    wrap.appendChild(b);
    scrollFeedToBottom({ el: b, anticipatePx: 14 });
    await sleep(520);
  }
  await sleep(120);
}

/** 장(章) 헤더 — 섹터에 처음 들어설 때 한 번만 */
const shownChapters = new Set<string>();
function ensureChapterHeader(areaId: string) {
  const ch = (data.chapters ?? []).find((c) => c.area_id === areaId);
  if (!ch || shownChapters.has(ch.chapter_id)) return;
  shownChapters.add(ch.chapter_id);
  const el = document.createElement("div");
  el.className = "chapter-header";
  el.innerHTML =
    `<span class="chapter-title">${ch.title}</span>` +
    (ch.subtitle ? `<span class="chapter-sub">${ch.subtitle}</span>` : "");
  feedEl.appendChild(el);
  scrollFeedToBottom({ el, anticipatePx: 12 });
}

/** 전투 요약 카드 — 상단 무대에서 지나간 턴을 필러에 남긴다 */
async function appendBattleLogCard(sim: CombatSimResult, enemyName: string): Promise<void> {
  const turns = (sim.logs ?? []).slice(0, 8);
  if (!turns.length) return;
  const card = document.createElement("div");
  card.className = "card";
  const head = document.createElement("div");
  head.className = "card-body";
  head.innerHTML = `<div class="card-line">${highlightKeywords(
    data,
    `⚔ ${enemyName} — ${sim.won ? "이겼다" : "밀렸다"} (${turns.length}턴)`
  )}</div>`;
  card.appendChild(head);

  const bars = document.createElement("div");
  bars.className = "filler-battle-bars";
  bars.innerHTML =
    `<div class="filler-battle-bar" style="background:rgba(0,0,0,.25)"><i style="width:100%;background:#6ddea0"></i></div>` +
    `<div class="filler-battle-bar" style="background:rgba(0,0,0,.25)"><i style="width:100%;background:#e05555"></i></div>`;
  card.appendChild(bars);
  const meBar = bars.children[0].firstElementChild as HTMLElement;
  const foeBar = bars.children[1].firstElementChild as HTMLElement;

  const log = document.createElement("div");
  log.className = "filler-battle-log";
  card.appendChild(log);
  feedEl.appendChild(card);
  watchFeedCardGrowth(card, 400 + turns.length * 300);
  scrollFeedToBottom({ el: card, anticipatePx: 48 });

  // 결과에 최대 HP가 없으므로 로그 최고값을 기준으로 삼는다
  const meMax = Math.max(1, ...(sim.logs ?? []).map((l) => l.playerHp));
  const foeMax = Math.max(1, ...(sim.logs ?? []).map((l) => l.enemyHp));

  for (const t of turns) {
    const d = document.createElement("div");
    // 게임이 이미 쓰는 전투 문구를 그대로 재사용 — 없으면 피해량으로
    const arrow = t.side === "enemy" ? "◂" : "▸";
    d.textContent = t.text
      ? `T${t.turn} ${arrow} ${t.text}`
      : `T${t.turn} ${arrow} ${t.dmg != null ? formatStat(t.dmg) : t.kind}`;
    log.appendChild(d);
    await sleep(40);
    d.classList.add("in");
    foeBar.style.width = `${Math.max(0, Math.min(100, (t.enemyHp / foeMax) * 100))}%`;
    meBar.style.width = `${Math.max(0, Math.min(100, (t.playerHp / meMax) * 100))}%`;
    scrollFeedToBottom({ el: card, anticipatePx: 20 });
    await sleep(280);
  }
  await sleep(140);
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
    (isJackpotSlot ? " jackpot-slotting" : "") +
    // 43 — 감정 톤 · 정화 블룸 (새 클래스만 추가 · 기존 규칙 미변경)
    (opts.mood === "sad" ? " mood-sad" : "") +
    (opts.mood === "joy" ? " mood-joy" : "") +
    (opts.purifyBloom ? " purify-bloom" : "");
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

  // 43 — 기쁨: 반짝임 몇 개 · 정화: 흑백 → 색 · 목적 한 줄
  if (opts.mood === "joy") {
    for (let i = 0; i < 6; i++) {
      const s = document.createElement("span");
      s.className = "filler-spark";
      s.textContent = i % 2 ? "✨" : "·";
      s.style.left = `${14 + Math.random() * 72}%`;
      s.style.top = "62%";
      s.style.setProperty("--spark-dx", `${Math.random() * 36 - 18}px`);
      card.appendChild(s);
      window.setTimeout(() => s.remove(), 1000);
    }
  }
  if (opts.purposeText) {
    const p = document.createElement("div");
    p.className = "filler-purpose";
    p.textContent = opts.purposeText;
    card.appendChild(p);
  }
  if (opts.purifyBloom) {
    await sleep(260);
    card.classList.add("bloomed");
    await sleep(600);
  }

  if (opts.effectLines && opts.effectLines.length > 0) {
    await revealEffectChips(card, opts.effectLines);
  } else {
    await sleep(isImpact ? 220 : 160);
  }

  scrollFeedToBottom({ el: card, anticipatePx: 16 });
  refreshStatbar();

  // 하단 카드 ↔ 상단 상황창 동기 (전투 중·전투 대기·구조 조우 제외 — 각자 전용 상단 연출 유지)
  // 3D 여정·syncStage:false 는 필러만 (상황 모달이 3D와 겹치지 않게)
  const allowStageSync =
    opts.syncStage !== false &&
    !journey3d?.isOn() &&
    currentStageModeId !== "COMBAT" &&
    currentStageModeId !== "COMBAT_WAIT" &&
    currentStageModeId !== "RESCUE";
  if (allowStageSync) {
    const bodyHead = stageHeadline(opts.body, 40);
    if (currentStageModeId === "LOCATION_ARRIVE" || currentStageModeId === "LOCATION_FIND") {
      // 도착/발견 타이틀은 유지하고, 부제만 로그 본문으로
      stageSub.textContent = bodyHead;
      syncShellActivity(null, bodyHead);
      if (lastStageScene) lastStageScene = { ...lastStageScene, subtitle: bodyHead };
    } else if (currentStageModeId === "BRANCH") {
      stageSub.textContent = bodyHead;
      syncShellActivity(null, bodyHead);
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
    setMainBtnClass('idle');
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
      void hideFullscreen(minigamePanel).then(() => resolve());
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
    leaveBtn.className = "choice-btn shell-btn secondary";
    leaveBtn.textContent = ui("ui_mg_leave_btn");
    const playBtn = document.createElement("button");
    playBtn.type = "button";
    playBtn.className = "choice-btn shell-btn";
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
    await hideFullscreen(minigamePanel);
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
  await hideFullscreen(minigamePanel);
  if (modal) {
    await showRewardModal(modal);
  } else {
    await sleep(400);
  }
  refreshStatbar();
  // 패널/대기 중 바뀐 메인 버튼 문구 복구 (finishTurn 전에도 멈춤 방지)
  setMainBtnLabel(ui("ui_btn_next"));
  mainBtn.disabled = false;
  setMainBtnClass('idle');
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
    await hideFullscreen(minigamePanel);
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
  await hideFullscreen(minigamePanel);
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
  options: ChoiceCardOption[],
  openNow = false
): Promise<number | null> {
  return new Promise((resolve) => {
    if (options.length === 0) {
      resolve(null);
      return;
    }
    mainBtn.textContent = buttonLabel;
    setMainBtnClass('choosing');
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
          await hideFullscreen(skillChoicePanel);
          resolve(idx);
        };
        skillChoiceCards.appendChild(card);
        slideIn(card);
      });
      showFullscreen(skillChoicePanel);
    };
    if (openNow) {
      const open = pendingSkillChoice;
      pendingSkillChoice = null;
      open?.();
    }
  });
}

async function presentSkillChoice(
  title: string,
  subtitle: string,
  candidates: SkillDef[],
  openNow = false
): Promise<SkillDef | null> {
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
    }),
    openNow
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

/**
 * 정화 습격 연출이 끝난 뒤, 기존 전투 보상 정산이 받을 결과 껍데기.
 * HP·턴 시뮬은 쓰지 않는다 — 장면이 성공했는지 여부만 넘긴다.
 */
function raidPresentationSim(won: boolean, name: string, icon: string): CombatSimResult {
  return {
    won,
    turns: 1,
    logs: [],
    playerHpAfter: state.hp,
    enemyName: name,
    enemyIcon: icon,
    shieldAfter: 0,
    enemyShieldAfter: 0,
    enemyKitSkills: [],
    patternId: "PURIFY_RAID",
  };
}

function raidHudTitle(h: RaidHud): string {
  if (h.phase === "warn") return "오염이 온다";
  if (h.phase === "won") return "정화 성공";
  if (h.phase === "lost") return "거점이 잠겼다";
  return `파 ${h.wave}/${h.waves}`;
}

function raidHudSub(h: RaidHud): string {
  if (h.phase === "warn") return `${h.warnLeft.toFixed(1)}초 뒤 습격`;
  if (h.phase === "fight") return `청록 ${Math.round(h.tealPct)}% · 거점 ${Math.round(h.core * 100)}%`;
  if (h.phase === "won") return "오염이 걷혔다";
  if (h.phase === "lost") return "아직 오염이 짙다";
  return "정화 총을 들어";
}

function paintRaidFireBtn(h: RaidHud) {
  const ammo = Math.round(h.ammo * 100);
  const hint =
    h.phase === "warn"
      ? `예고 ${h.warnLeft.toFixed(1)}초`
      : h.phase === "fight"
        ? `탄약 ${ammo}% · 자동`
        : h.phase === "won"
          ? "정화 성공"
          : h.phase === "lost"
            ? "거점 잠김"
            : "자동 정화";
  const fill = mainBtn.querySelector(".raid-ammo-fill");
  const label = mainBtn.querySelector(".btn-main-label");
  const hintEl = mainBtn.querySelector(".raid-fire-hint");
  if (!fill || !label || !hintEl) {
    mainBtn.innerHTML =
      `<span class="raid-ammo-fill" aria-hidden="true"></span>` +
      `<span class="btn-main-label">정화</span>` +
      `<small class="raid-fire-hint">${hint}</small>`;
    return;
  }
  hintEl.textContent = hint;
}

/**
 * 3D 여정 전투 — 턴 무대 대신 정화 습격을 셸에 붙인다.
 * 카메라·사거리·발사는 자동. 메인 버튼은 탄약 게이지만 보여 준다.
 */
async function playPurifyRaidOnStage(opts: {
  label: string;
  icon: string;
  tier: string;
}): Promise<{ won: boolean }> {
  if (!journey3d?.isOn()) return { won: false };

  raidLive = true;
  phoneEl.classList.add("raid-live");
  feedEl.classList.remove("feed-combat-dim");
  setGaugesVisible(false);
  playLog("RAID", "시작", opts.tier, opts.label);
  setStageMode("EVENT", {
    title: "정화 습격",
    subtitle: `${opts.icon} ${opts.label}`,
    icon: opts.icon || "♻️",
    clearLog: false,
  });
  mainBtn.disabled = true;
  setMainBtnClass("combat", "raid-firing");
  paintRaidFireBtn({
    phase: "warn",
    warnLeft: 0,
    wave: 0,
    waves: 1,
    alive: 0,
    core: 0,
    tealPct: 0,
    ammo: 1,
    purified: 0,
    firing: false,
  });

  try {
    let lastPhase = "";
    let lastWave = -1;
    const bout = await journey3d.runPurifyRaid({
      fireEl: mainBtn,
      tier: opts.tier,
      prepaid: true,
      onHud: (h) => {
        paintRaidFireBtn(h);
        const phaseChanged = h.phase !== lastPhase;
        const waveChanged = h.wave !== lastWave;
        if (phaseChanged) {
          lastPhase = h.phase;
          syncShellActivity(raidHudTitle(h), raidHudSub(h));
        }
        if (phaseChanged || waveChanged) {
          lastWave = h.wave;
          playLog(
            "RAID",
            h.phase,
            `w${h.wave}/${h.waves}`,
            `녹${Math.round(h.tealPct)}`,
            `오염${h.alive}`,
            `코어${Math.round(h.core)}`,
          );
        }
      },
    });
    playLog("RAID", bout.won ? "코어지킴" : "코어붕괴", opts.tier, opts.label);
    return bout;
  } finally {
    raidLive = false;
    phoneEl.classList.remove("raid-live");
    mainBtn.disabled = true;
    mainBtn.classList.remove("raid-firing", "on", "raid-ammo-low");
    mainBtn.style.removeProperty("--raid-ammo");
  }
}

/** 습격 한 판 + 실패 시 이어하기/재도전. 이기면 정산까지. */
async function playRaidUntilResolved(opts: {
  label: string;
  icon: string;
  tier: string;
  combatId?: string;
}): Promise<boolean> {
  const need = ammoCostForCombatTier(data, opts.tier);
  const have = state.purifyAmmo ?? 0;
  if (have < need) {
    playLog("AMMO", "부족", ammoHaveMsg(have, need), opts.tier, opts.label);
    await appendCard({
      body: `${opts.icon} ${opts.label}\n${ammoShortMsg(have, need)}`,
      effectLines: [ammoHaveMsg(have, need)],
    });
    renderCatalystHud();
    return false;
  }
  spendPurifyAmmo(state, need);
  playLog("AMMO", "소모", ammoSpendMsg(need), opts.tier, opts.label);
  renderCatalystHud();
  await appendCard({
    body: `${opts.icon} ${opts.label}\n${ammoSpendMsg(need)} · 정화 시작`,
  });

  captureFailCheckpoint(state, {
    mode: "raid",
    label: opts.label,
    icon: opts.icon,
    tier: opts.tier,
    combatId: opts.combatId,
  });
  for (;;) {
    const bout = await playPurifyRaidOnStage({
      label: opts.label,
      icon: opts.icon,
      tier: opts.tier,
    });
    if (bout.won) {
      const settled = await settleCombatAftermath(
        raidPresentationSim(true, opts.label, opts.icon),
        opts.tier,
        opts.combatId,
      );
      return settled === true;
    }
    await appendCard({
      body: `${opts.icon} ${opts.label}\n정화가 끝나지 않았다. 오염이 아직 짙다.`,
      mood: "sad",
    });
    const pick = await presentFailFlow({
      kind: "RAID",
      cause: "코어가 붕괴했다.",
      detail: `${opts.tier} ${opts.label}`,
    });
    if (pick === "retry") continue;
    return false;
  }
}

/**
 * 액션 전투 결과 정산 — 일차 「전투」버튼과 맵 노드(S4.3)가 공유.
 * 스테이지 모드 전환은 호출측(resolveCombat=EVENT, runMapNode=IDLE).
 * @returns 클리어로 칠지. 실패 화면에서 재도전을 고르면 "retry"
 */
async function settleCombatAftermath(
  sim: CombatSimResult,
  tier: string,
  combatIdHint?: string
): Promise<boolean | "retry"> {
  const map = getStageMapForDay(data, state.day);
  const combat =
    (combatIdHint ? data.combats.find((c) => c.combat_id === combatIdHint) : undefined) ??
    pickCombat(data, tier, lastCombatId ?? undefined);
  if (combat) lastCombatId = combat.combat_id;

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
    } else {
      state.hp = 0;
      // 43 — 쓰러짐은 슬픔의 결
      await appendCard({ body: ui("ui_combat_lose"), mood: "sad" });
      combatPending = null;
      mainBtn.classList.remove("combat-pulse", "combat-busy");
      const pick = await presentFailFlow({
        kind: "RUN",
        cause: "오염된 잔재에 쓰러졌다.",
        detail: `${tier} ${combat?.combat_id ?? ""}`.trim(),
      });
      return pick === "retry" ? "retry" : false;
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
  }
  if (combat?.tier === "MINIBOSS" || tier === "MINIBOSS") {
    await appendCard({ body: ui("ui_miniboss_chest") });
    await showChestIntro();
    const candidates = pickSkillChoices(data, state, "신화", 3);
    const chosen = await presentSkillChoice(ui("ui_chest_title"), ui("ui_skill_sub"), candidates);
    if (chosen) {
      const got = applyLearnedSkill(chosen.skill_id);
      if (got) await presentSkillLearnedFeedback(got);
    }
  } else if (combat?.tier === "FINALBOSS" || tier === "FINALBOSS") {
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
  return true;
}

/** 일차 버튼 전투 — 정산 후 EVENT 모드(여정 피드 주연). 맵 노드는 runMapNode. */
async function resolveCombat(tier: string, combatIdHint?: string) {
  mainBtn.disabled = true;
  mainBtn.classList.remove("btn-slide-in");
  setMainBtnLabel(ui("ui_btn_combat_active"), true);
  setMainBtnClass('combat', 'combat-busy');

  const combat =
    (combatIdHint ? data.combats.find((c) => c.combat_id === combatIdHint) : undefined) ??
    pickCombat(data, tier, lastCombatId ?? undefined);
  if (combat) lastCombatId = combat.combat_id;

  const enemy = combat ? getCombatEnemy(data, combat.combat_id) : undefined;
  const resolvedTier = (combat?.tier || tier || "").toUpperCase();
  const isMemoryBattle = resolvedTier === "PURIFY_FINAL";
  const isPurify =
    !isMemoryBattle &&
    (enemy?.combat_mode === "PURIFY" || resolvedTier.startsWith("PURIFY"));

  await appendCommentary("COMBAT_START");

  if (isMemoryBattle) {
    await runMemoryBattleFlow(combat?.combat_id ?? "c_purify_final");
    return;
  }

  if (journey3d?.isOn()) {
    const name = enemy?.enemy_name || "오염된 잔재";
    const icon = enemy?.enemy_icon || "♻️";
    const won = await playRaidUntilResolved({
      label: name,
      icon,
      tier,
      combatId: combat?.combat_id,
    });
    if (won) {
      syncStageWithLog({
        modeId: "EVENT",
        title: "정화 성공",
        subtitle: "오염이 걷혔다",
        clearLog: false,
      });
    }
    return;
  }

  if (isPurify) {
    const pSim = await playPurifyCombatOnStage(combat?.combat_id, combat?.tier || tier);
    const ok = await settlePurifyAftermath(pSim, combat?.combat_id);
    syncStageWithLog({
      modeId: "EVENT",
      title: ok ? "정화 성공" : "정화 실패",
      subtitle: ok ? "오염이 걷혔다" : "아직 오염이 짙다",
      clearLog: false,
    });
    return;
  }

  captureFailCheckpoint(state, {
    mode: "turn",
    label: enemy?.enemy_name || "잔재",
    icon: enemy?.enemy_icon || "♻️",
    tier,
    combatId: combat?.combat_id,
  });
  let settled: boolean | "retry" = "retry";
  while (settled === "retry") {
    const sim = await playCombatOnStage(combat?.combat_id, tier);
    settled = await settleCombatAftermath(sim, tier, combat?.combat_id);
  }

  if (!settled) {
    syncStageWithLog({
      modeId: "EVENT",
      title: ui("ui_stage_combat_lose_title"),
      subtitle: stageHeadline(ui("ui_combat_lose")),
      clearLog: false,
    });
    return;
  }

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

/**
 * ── 41 · 39 · 항해 시스템 ─────────────────────────────────────────────
 * 39 §2: 배가 60일 뒤에 온다. 중간 귀환 없음.
 * 41 §1-1: 섹터 이동도 하루.
 * 39 §4: 실패 = 그 판에서 구조한 아이 전부 상실.
 */

/** 39 §2 — 배가 오는 날 */
/**
 * 43 S2 — 상수를 데이터로.
 * 폴백만 코드에 두고 실제 값은 CSV에서 읽는다.
 */
const VOYAGE_DAYS_FALLBACK = 60;
/** 배가 오는 날 — `combat_tuning.voyage_days` */
function voyageDays(): number {
  return tuningNum(data, "voyage_days", VOYAGE_DAYS_FALLBACK);
}
/** 외출 스폰 섹터 — `area_config.is_spawn` */
function spawnAreaId(): string {
  return data.areas.find((a) => a.is_spawn)?.area_id ?? data.areas[0]?.area_id ?? "";
}
/** 항해가 끝났으면 더 이상 하루가 흐르지 않는다 */
let voyageOver = false;

/** 파견(정찰) 정산 — 하루가 흐르는 모든 경로에서 공통으로 쓴다 */
async function settleIslandDispatch(): Promise<void> {
  const report = runIslandDispatch(data, state);
  if (!report.length) return;
  lastDispatchReport = report;
  refreshStatbar();
  const preview = report.slice(0, 2).map((r) => r.line).join("\n");
  const more = report.length > 2 ? `\n…외 ${report.length - 2}건 (로비 기록에서 전체 보기)` : "";
  // 39 §5-1 — 무대는 무지개섬이 아니라 신비의 섬 안. 아이들은 정찰을 나간다.
  await appendCard({ body: `🐾 정찰 보고\n${preview}${more}` });
}

/** 41 §4-2 — 섬 정화도 구간. 효과는 그 판 안에서만 유효(39 §3) */
const ISLAND_PURIFY_STEPS = [
  { pct: 25, label: "섬이 숨을 쉰다" },
  { pct: 50, label: "색이 반쯤 돌아온다" },
  { pct: 75, label: "아이들이 경계를 풀다" },
  { pct: 100, label: "섬이 완전히 깨어난다" },
];

/** 41 §4 — 섬 전체 정화도(%). AREA 오염만 센다(LIFE는 구조로 별도 집계) */
function islandPurifyPct(): { done: number; total: number; pct: number } {
  const areaBlights = data.purifyBlights.filter((b) => b.target_kind === "AREA");
  const total = areaBlights.length;
  const done = areaBlights.filter((b) => state.purifiedBlights.includes(b.blight_id)).length;
  return { done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
}

/**
 * 41 §1-1 — 하루를 흘린다. 섹터 이동·「다음날」이 함께 쓰는 단일 경로.
 * 배가 오는 날에 닿으면 항해를 끝낸다.
 */
async function advanceDay(): Promise<boolean> {
  if (voyageOver) return false;
  state.day += 1;
  const p = islandPurifyPct();
  playLog("DAY", state.day, `정화${p.pct}%`, `아이${state.rescuedAnimals.length}`, `노드${state.clearedNodes.length}`);
  ensureDayHeader(state.day);
  refreshTimeline();
  await settleIslandDispatch();
  if (state.day >= voyageDays()) {
    await showVoyageEndScreen();
    return true;
  }
  return false;
}

/** 39 §2 — 60일째. 배가 왔다. 아이들을 데리고 귀환한다. */
async function showVoyageEndScreen() {
  voyageOver = true;
  // 43 — 배가 오는 소리 · 방랑자가 세어본다
  await fireDialogue("VOYAGE_END");
  const kids = state.rescuedAnimals.length;
  const purify = islandPurifyPct();
  const cleared = state.finalBossDefeated;
  playLog("GAME", "항해종료", `${state.day}일`, `아이${kids}`, `정화${purify.pct}%`, cleared ? "열두완" : "열두미완");

  victoryIcon.textContent = cleared ? "⛵" : "🌊";
  victoryTitle.textContent = cleared ? "배가 왔다 — 모두 데리고" : "배가 왔다";
  victorySub.textContent = cleared
    ? `${state.day}일 · 아이 ${kids}명 · 섬 정화도 ${purify.pct}%\n열두를 되찾아 함께 돌아간다.`
    : `${state.day}일 · 아이 ${kids}명 · 섬 정화도 ${purify.pct}%\n열두는 아직 섬에 남았다. 아이들만이라도 데리고 간다.`;
  victoryLoot.innerHTML =
    `<span class="effect-chip">🐾 아이 ${kids}명 생환</span>` +
    `<span class="effect-chip">💧 정화 ${purify.done}/${purify.total}</span>`;
  restartBtn.textContent = "무지개섬으로";
  restartBtn.onclick = () => window.location.reload();
  hideFailChoiceButtons();
  mainBtn.style.display = "none";
  choiceButtons.style.display = "none";
  victoryPanel.style.display = "flex";
}

/**
 * 39 §4 — 쓰러졌다. 프로토에선 이어하기·재도전을 열어 테스트를 끊지 않는다.
 * 정식 상실(아이 청산)은 「처음부터」를 고를 때만 적용한다.
 */
function hideFailChoiceButtons() {
  failContinueBtn.style.display = "none";
  failRetryBtn.style.display = "none";
  victoryHint.style.display = "none";
  victoryPanel.classList.remove("is-fail");
}

function hideFailPanel() {
  victoryPanel.style.display = "none";
  hideFailChoiceButtons();
  mainBtn.style.display = "";
}

function refreshAfterFailContinue() {
  voyageOver = false;
  combatPending = null;
  raidLive = false;
  phoneEl.classList.remove("raid-live");
  mainBtn.disabled = false;
  refreshStatbar();
  refreshCurrencyBar();
  renderPartyRow();
  renderCatalystHud();
  renderScrapbookBadge();
  journey3d?.refreshNodes();
  void journey3d?.refreshFloor();
  returnToJourneyIdle({ subtitle: "다시 일어섰다" });
}

function presentFailFlow(opts: {
  kind: FailKind;
  cause: string;
  detail?: string;
}): Promise<"continue" | "retry"> {
  const kids = state.rescuedAnimals.length;
  const purify = islandPurifyPct();
  const retry = peekFailRetry();
  playLog("FAIL", opts.kind, opts.cause, opts.detail, `${state.day}일`, `아이${kids}`, `정화${purify.pct}%`);

  voyageOver = false;
  victoryPanel.classList.add("is-fail");
  victoryIcon.textContent = opts.kind === "RAID" ? "♻️" : "🌑";
  victoryTitle.textContent = opts.kind === "RAID" ? "정화 실패" : "쓰러졌다";
  victorySub.textContent = `${state.day}일 · ${opts.cause}\n${
    kids > 0 ? `정식이면 아이 ${kids}명을 잃는다.` : "아직 구한 아이가 없다."
  }`;
  victoryLoot.innerHTML =
    `<span class="effect-chip">🐾 아이 ${kids}명</span>` +
    `<span class="effect-chip">💧 정화 ${purify.done}/${purify.total}</span>`;
  victoryHint.style.display = "";
  victoryHint.textContent = "프로토 · 이어서 하면 진행을 지킵니다. 이 전투 다시는 직전 상태로 되돌립니다.";
  failContinueBtn.style.display = "";
  failRetryBtn.style.display = hasFailCheckpoint() && retry ? "" : "none";
  restartBtn.textContent = "처음부터";
  mainBtn.style.display = "none";
  choiceButtons.style.display = "none";
  victoryPanel.style.display = "flex";

  return new Promise((resolve) => {
    failContinueBtn.onclick = () => {
      playLog("FAIL", "선택", "이어하기", opts.kind, opts.detail);
      applyFailContinue(state);
      hideFailPanel();
      refreshAfterFailContinue();
      resolve("continue");
    };
    failRetryBtn.onclick = () => {
      playLog("FAIL", "선택", "재도전", opts.kind, retry?.mode, retry?.label);
      restoreFailCheckpoint(state);
      hideFailPanel();
      voyageOver = false;
      combatPending = null;
      refreshStatbar();
      refreshCurrencyBar();
      renderPartyRow();
      resolve("retry");
    };
    restartBtn.onclick = () => {
      playLog("FAIL", "선택", "처음부터", opts.kind, `${state.day}일`);
      state.joinedPartyMembers = [];
      state.permanentPartyMembers = [];
      state.rescuedAnimals = [];
      voyageOver = true;
      window.location.reload();
    };
  });
}

async function showRunFailScreen(cause: string) {
  await presentFailFlow({ kind: "RUN", cause });
}

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
  hideFailChoiceButtons();
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
    b.className = "choice-btn shell-btn" + (secondary ? " secondary" : "");
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
  applyJourneyIdleAction(computeJourneyIdleAction());
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
    if (journey3d?.isOn()) {
      const pending = combatPending;
      refreshStatbar();
      void kickPendingCombat(pending);
      return;
    }
    setGaugesVisible(true);
    mainBtn.disabled = false;
    setMainBtnLabel(ui("ui_btn_combat"));
    setMainBtnClass("combat");
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
  } else if (pendingLobbyReturn) {
    pendingLobbyReturn = false;
    setIdle();
    enterLobby({ note: "새 구역으로 이어지기 전, 섬에 잠깐 들렀어요." });
  } else {
    setIdle();
  }
  refreshStatbar();
}

/** 3D 여정은 전투 대기를 건너뛰고 바로 정화한다 */
async function kickPendingCombat(pending: { tier: string; combatId?: string }) {
  if (raidLive) return;
  mainBtn.disabled = true;
  await resolveCombat(pending.tier, pending.combatId);
  finishTurn();
}

async function playMovingPhase() {
  mainBtn.disabled = true;
  mainBtn.classList.remove("btn-slide-in");
  setMainBtnLabel(ui("ui_btn_moving"), true);
  setMainBtnClass('combat');
  setStageMode("MOVING", {
    title: ui("ui_stage_moving_day", { day: state.day }),
    clearLog: true,
    remember: false,
  });
  /*
   * 노드 동선이 실제 걷기를 담당한다 (`stepToNextNode` → walkTo).
   * 옛 `explore.journey()`는 위로 가짜 전진(맨 위면 y=88로 되돌아감)이라
   * 「갔다가 돌아온다」처럼 보였다 — 쓰지 않는다.
   */
  await sleep(700);
}

async function resolveDirectReward() {
  const grade = rollGrade(data);
  await presentGradeReward(grade);
}

/**
 * 등급 뽑기 노드 3종 — 속통은 같고(대박·중박·운빨·보너스) **이름만 확실히 구분**.
 * - DAILY  하루의 발견
 * - TRACE  버려진 흔적
 * - FILTER 탁한 물 거르기
 * (옛 룰렛 MINIGAME 대체)
 */
async function resolveGradeFindNode(
  npc: { icon: string; flavor_text: string },
  kind: "DAILY" | "TRACE" | "FILTER"
): Promise<void> {
  const meta: Record<
    typeof kind,
    { title: string; defaultLine: string; pillar: string; mood?: "joy" | "sad" }
  > = {
    DAILY: {
      title: "하루의 발견",
      defaultLine: "길 위에서 오늘만의 일이 생긴다.",
      pillar: "탐구",
    },
    TRACE: {
      title: "버려진 흔적",
      defaultLine: "누가 두고 간 흔적이다. 살펴본다.",
      pillar: "탐구",
    },
    FILTER: {
      title: "탁한 물 거르기",
      defaultLine: "손으로 걸러 본다. 무엇이 남을까.",
      pillar: "정화",
    },
  };
  const m = meta[kind];
  await appendCard({
    body: `[${m.pillar}] ${npc.icon} ${m.title}`,
    bodyLine2: npc.flavor_text?.trim() || m.defaultLine,
  });
  await resolveDirectReward();
}

/** 이미 뽑힌 등급으로 대박·중박·운빨·보너스 카드·게이지·미니게임을 연다. */
async function presentGradeReward(grade: GradeDef) {
  const entry = rollDailyEntry(data, grade.grade_id);
  if (!entry) {
    await Promise.all([playGradeBanner(grade), appendCard({ body: ui("ui_nothing"), grade })]);
    return;
  }
  const lines = textLinesFor(data, entry.text_id);
  const linkedMg = entry.linked_minigame_id?.trim() || "";
  const hasLinkedMg = !!linkedMg;

  if (grade.is_jackpot) {
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
  if (raidLive) return;

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

  const idleAct = computeJourneyIdleAction();
  if (appMode === "journey" && !rescuePending && !combatPending && (idleAct === "pick" || idleAct === "find")) {
    mainBtn.disabled = true;
    await playActivate(mainBtn);
    if (idleAct === "pick") {
      await journey3d?.pickupNear();
      finishTurn();
      return;
    }
    playLog("AMMO", "다가가기");
    await journey3d?.walkToNearestFill();
    mainBtn.disabled = false;
    applyJourneyIdleAction(computeJourneyIdleAction());
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
    if (!journey3d?.isOn()) await playMovingPhase();
    await resolveCombat(combatPending.tier, combatPending.combatId);
    finishTurn();
    return;
  }

  // 해금할 정화제가 없으면 웅덩이로 다시 보내지 않는다. 같은 날 걸어 모은다.
  const gatherHold = purifyGatherHold();
  if (gatherHold) {
    playLog("AMMO", "모으는중", ammoHaveMsg(gatherHold.have, gatherHold.need), gatherHold.name);
    await appendCard({
      body: `[정화] ${gatherHold.name}\n${ammoShortMsg(gatherHold.have, gatherHold.need)}`,
    });
    renderCatalystHud();
    finishTurn();
    return;
  }

  // 41 §1-1 — 하루는 advanceDay 단일 경로. 줍기만 같은 날이고, 「다음날」은 항상 하루가 간다.
  try {
    if (await advanceDay()) return;
    // 스테이지(구역)가 바뀌면 하루 처리 후 소프트 로비 귀환(33 권고안 A)
    {
      const map = getStageMapForDay(data, state.day);
      const mapId = map?.stage_map_id ?? null;
      if (lastStageMapId && mapId && mapId !== lastStageMapId) {
        pendingLobbyReturn = true;
      }
      if (mapId) lastStageMapId = mapId;
    }
    await playMovingPhase();

    /*
     * 43 S3 — 「다음날」이 주사위를 굴리지 않는다.
     *
     * 폐기: rollIsCombat / rollIsRescue / rollContentType
     *   전투 → COMBAT·MINIBOSS·BOSS 노드
     *   구조 → RESCUE 노드
     *   등급 뽑기 → DAILY 노드
     *   정기 → SKILL 노드
     * 이제 방랑자가 **밟은 자리**가 그날의 사건이다(38 규칙2).
     */
    if (await stepToNextNode()) {
      if (pendingPathJudgment) {
        pendingPathJudgment = null;
        await presentPathJudgment("mid");
        return;
      }
      finishTurn();
      return;
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

    /*
     * 길 판정 — 섹터 사이클이 끝났다.
     * 등급이 「갈림길(수동) vs 자동 랜덤」과 부가 효과를 함께 정한다.
     */
    await presentPathJudgment("sector_end");
  } catch (err) {
    console.error("[다음날]", err);
    finishTurn();
  }
}

/**
 * 길 판정 — 등급이 곧 이동 모드다.
 * 대박/중박 → 갈림길(수동) · 보너스/운빨망함 → 자동 랜덤(안전/험함).
 * 동시에 등급 보상(대박·중박 카드·게이지)이 열려 판마다 동선이 갈라진다.
 */
type PathJudgeReason = "sector_end" | "mid";
/** B3·B5 종료 후 중간 길 판정이 예약됐을 때 */
let pendingPathJudgment: PathJudgeReason | null = null;

function pathJudgmentFor(gradeId: string): PathJudgmentDef {
  const row = (data.pathJudgments ?? []).find((p) => p.grade_id === gradeId);
  if (row) return row;
  return {
    grade_id: gradeId,
    travel_mode: "FORK_GOOD",
    body: "어디로 갈까.",
    body_line2: "섹터를 넘으면 하루가 간다.",
    choice_cost_effect_id: "",
    note: "fallback",
  };
}

/** 이웃 섹터 위험/안전 점수 — 높을수록 안전(클리어 많음·잔여 전투 적음) */
function scoreNeighborArea(areaId: string): number {
  const npcs = data.areaNpcs.filter((n) => n.area_id === areaId);
  let cleared = 0;
  let danger = 0;
  let blightLeft = 0;
  for (const n of npcs) {
    if (state.clearedNodes.includes(n.npc_id)) cleared += 1;
    if (!isNodeLive(n)) continue;
    if (n.trigger_type === "COMBAT" || n.trigger_type === "MINIBOSS" || n.trigger_type === "BOSS") {
      danger += n.trigger_type === "BOSS" ? 5 : n.trigger_type === "MINIBOSS" ? 3 : 2;
    }
    if (n.trigger_type === "BLIGHT") blightLeft += 2;
  }
  return cleared * 3 - danger - blightLeft;
}

function pickScoredNeighbor(
  open: { to: string; side: string; locked: boolean; gateLabel: string }[],
  mode: "safe" | "bad"
) {
  if (!open.length) return null;
  const ranked = [...open].sort((a, b) => {
    const sa = scoreNeighborArea(a.to);
    const sb = scoreNeighborArea(b.to);
    return mode === "safe" ? sb - sa : sa - sb;
  });
  // 동점이면 상위권 안에서 랜덤 — 완전 결정적이지 않게
  const topScore = scoreNeighborArea(ranked[0]!.to);
  const tier = ranked.filter((o) => scoreNeighborArea(o.to) === topScore);
  return tier[randInt(0, tier.length - 1)]!;
}

async function travelToSector(toAreaId: string): Promise<boolean> {
  if (!explore) return false;
  const moved = await explore.goToSector(toAreaId);
  if (moved) beatCursors.delete(toAreaId);
  return moved;
}

async function presentPathJudgment(reason: PathJudgeReason): Promise<void> {
  if (!explore) return finishTurn();
  const opts = explore.neighbors();
  const open = opts.filter((o) => !o.locked);

  if (!open.length) {
    const gate = opts.find((o) => o.locked);
    await appendCard({
      body: reason === "mid" ? "길이 흔들렸지만, 갈 곳이 없다." : "이 구역에서 할 일은 다 했다.",
      bodyLine2: gate ? `${gate.gateLabel}을(를) 넘지 않으면 더 갈 수 없다.` : "더 갈 곳이 없다.",
    });
    return finishTurn();
  }

  const grade = rollGrade(data);
  const judge = pathJudgmentFor(grade.grade_id);
  let mode: PathTravelMode = judge.travel_mode;

  /*
   * 갈림길 체감 복구:
   * - 출구 2개 이상 = 진짜 갈림길 → 기본은 플레이어 선택.
   *   등급의 RANDOM_*는 path_force_random_pct%만 자동 끌림으로 남긴다.
   * - 출구 1개(부두→중앙 등) = 선택할 길이 없음 → 연출 후 그쪽으로 이동.
   */
  const realFork = open.length >= 2;
  if (realFork) {
    const forceRandom = randInt(1, 100) <= tuningNum(data, "path_force_random_pct", 25);
    if (!forceRandom) {
      mode = grade.is_negative || judge.travel_mode === "FORK_COSTLY" ? "FORK_COSTLY" : "FORK_GOOD";
    } else if (mode === "FORK_GOOD" || mode === "FORK_COSTLY") {
      mode = grade.is_negative ? "RANDOM_BAD" : "RANDOM_SAFE";
    }
  } else {
    // 외길 — 갈림길 UI를 띄우지 않음
    mode = "RANDOM_SAFE";
  }

  // 등급 보상 먼저 — 대박·중박·운빨이 동선 판정과 같이 무대에 선다
  await presentGradeReward(grade);

  const areaName = (id: string) =>
    (data.areas.find((a) => a.area_id === id)?.display_name ?? id).replace(/^무지개섬\s*[·・]\s*/, "");
  const arrow: Record<string, string> = { TOP: "▲", BOTTOM: "▼", LEFT: "◀", RIGHT: "▶" };

  if (!realFork) {
    const only = open[0]!;
    await appendCard({
      body: reason === "mid" ? "발길이 다음 구역으로 이어진다." : "이 구역에서 할 일은 다 했다.",
      bodyLine2: `다음 — ${arrow[only.side] ?? "·"} ${areaName(only.to)}`,
      grade,
    });
    if (reason === "mid" && explore.areaId) beatCursors.delete(explore.areaId);
    await travelToSector(only.to);
    return finishTurn();
  }

  await appendCard({
    body:
      mode === "RANDOM_SAFE" || mode === "RANDOM_BAD"
        ? judge.body || "발이 먼저 움직인다."
        : "갈림길이다. 어디로 갈까.",
    bodyLine2:
      mode === "RANDOM_SAFE" || mode === "RANDOM_BAD"
        ? judge.body_line2 || "선택이 없다. 운이 길을 정한다."
        : "섹터를 넘으면 하루가 간다.",
    grade,
  });

  if (mode === "RANDOM_SAFE" || mode === "RANDOM_BAD") {
    const pick = pickScoredNeighbor(open, mode === "RANDOM_SAFE" ? "safe" : "bad");
    if (!pick) return finishTurn();
    await appendCard({
      body: mode === "RANDOM_SAFE" ? "비교적 무난한 쪽으로 끌려간다." : "원치 않는 쪽으로 발이 끌린다.",
      bodyLine2: `${arrow[pick.side] ?? "·"} ${areaName(pick.to)}`,
      grade,
      mood: mode === "RANDOM_BAD" ? "sad" : undefined,
    });
    if (reason === "mid" && explore.areaId) beatCursors.delete(explore.areaId);
    await travelToSector(pick.to);
    return finishTurn();
  }

  // FORK_GOOD / FORK_COSTLY — 플레이어가 고른다 (출구 2+)
  choiceButtons.innerHTML = "";
  for (const o of opts) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "choice-btn" + (o.locked ? " secondary" : "");
    const costHint = !o.locked && mode === "FORK_COSTLY" && judge.choice_cost_effect_id ? " · 대가" : "";
    b.textContent = o.locked
      ? `🔒 ${areaName(o.to)} — ${o.gateLabel} 필요`
      : `${arrow[o.side] ?? "·"} ${areaName(o.to)}${costHint}`;
    b.disabled = o.locked;
    b.onclick = async () => {
      await playActivate(b);
      choiceButtons.style.display = "none";
      choiceButtons.innerHTML = "";
      mainBtn.style.display = "";
      setGaugesVisible(true);
      if (mode === "FORK_COSTLY" && judge.choice_cost_effect_id) {
        const cost = applyEffectId(data, state, judge.choice_cost_effect_id);
        if (cost.lines.length) {
          await appendCard({ body: "선택에는 대가가 따른다.", effectLines: cost.lines, grade });
          refreshStatbar();
        }
      }
      if (reason === "mid" && explore?.areaId) beatCursors.delete(explore.areaId);
      await travelToSector(o.to);
      finishTurn();
    };
    choiceButtons.appendChild(b);
  }
  choiceButtons.style.display = "flex";
  mainBtn.style.display = "none";
  setGaugesVisible(false);
  slideIn(choiceButtons);
}

/**
 * 43 S3 — 「다음날」의 본체. 이 섹터에서 **아직 안 밟은 노드**로 걸어가 그 자리의 사건을 연다.
 *
 * 진행 순서 = `y_pct` 내림차순(아래→위). 42 스케일에서 섹터는 화면보다 크므로
 * 걷기는 3D가 켜져 있으면 `journey3d.walkTo`, 아니면 `explore.walkTo`가 처리한다.
 * 밟을 게 없으면 false — 호출측이 「구역 종료」를 안내한다.
 */
/** 43 S4 — 섹터별 비트 진행 상태. 판 안에서만 산다(귀환하면 사라짐) */
interface BeatCursor {
  /** sectorBeats 인덱스 */
  idx: number;
  /** 이 비트를 몇 번 더 밟을지 (진입 시 min~max 랜덤) — L2 */
  left: number;
  /** B1에서 고른 오염 — B3가 같은 자리로 돌아간다 */
  blightNodeId: string;
}
const beatCursors = new Map<string, BeatCursor>();

function beatCursorFor(areaId: string): BeatCursor {
  let c = beatCursors.get(areaId);
  if (!c) {
    c = { idx: 0, left: 0, blightNodeId: "" };
    beatCursors.set(areaId, c);
  }
  return c;
}

function isFillEvent(npc: { trigger_type: string }): boolean {
  const t = npc.trigger_type.toUpperCase();
  return t === "FILL" || t === "CATALYST";
}

function computeJourneyIdleAction(): JourneyIdleAction {
  if (appMode !== "journey" || raidLive || !journey3d?.isOn()) return "next";
  const near = journey3d.getNearNpc();
  if (near && isFillEvent(near) && !state.clearedNodes.includes(near.npc_id)) return "pick";
  if (purifyGatherHold() && journey3d.nearestFill()) return "find";
  return "next";
}

function applyJourneyIdleAction(next: JourneyIdleAction) {
  journeyAction = next;
  if (next === "pick") {
    setMainBtnLabel(ui("ui_btn_pickup"));
    setMainBtnClass("pick");
    return;
  }
  if (next === "find") {
    setMainBtnLabel(ui("ui_btn_find"));
    setMainBtnClass("find");
    return;
  }
  setMainBtnLabel(ui("ui_btn_next"));
  setMainBtnClass("idle");
}

function syncJourneyActionBtn() {
  if (appMode !== "journey" || raidLive) return;
  if (pendingMainAction || pendingSkillChoice || rescuePending || combatPending) return;
  if (mainBtn.disabled) return;
  if (choiceButtons.style.display === "flex") return;
  const next = computeJourneyIdleAction();
  const cls = next === "next" ? "idle" : next;
  if (next === journeyAction && mainBtn.classList.contains(cls)) return;
  applyJourneyIdleAction(next);
}

/** 해금·생명 비트인데 정화제가 모자라면 「다음날」로 다시 끌지 않는다 */
function purifyGatherHold(): { have: number; need: number; name: string } | null {
  const areaId = explore?.areaId;
  if (!areaId) return null;
  const beats = data.sectorBeats ?? [];
  const cur = beatCursorFor(areaId);
  const beat = beats[cur.idx];
  if (!beat || (beat.beat_id !== "B3" && beat.beat_id !== "B3b")) return null;

  const here = data.areaNpcs.filter((n) => n.area_id === areaId);
  const npc =
    beat.beat_id === "B3"
      ? here.find((n) => n.npc_id === cur.blightNodeId) ||
        here.find((n) => {
          const b = data.purifyBlights.find((x) => x.blight_id === n.trigger_ref);
          return n.trigger_type === "BLIGHT" && b?.target_kind === "AREA";
        })
      : here.find((n) => n.trigger_type === "BLIGHT" && isNodeLive(n));
  if (!npc) return null;
  const blight = data.purifyBlights.find((b) => b.blight_id === npc.trigger_ref);
  if (!blight || state.purifiedBlights.includes(blight.blight_id)) return null;
  const need = ammoCostForBlight(data, blight);
  const have = state.purifyAmmo ?? 0;
  if (have >= need) return null;
  return { have, need, name: blight.display_name };
}

/** 이 노드가 아직 남아 있나 (소진·클리어 제외) */
function isNodeLive(n: AreaNpcDef): boolean {
  if (state.clearedNodes.includes(n.npc_id)) return false;
  if (n.trigger_type === "MEMORY" && state.collectedMemories.includes(n.trigger_ref)) return false;
  if (n.trigger_type === "BLIGHT" && state.purifiedBlights.includes(n.trigger_ref)) return false;
  if (n.trigger_type === "RESCUE" && state.rescuedAnimals.includes(n.trigger_ref)) return false;
  return true;
}

/**
 * L1 후보 선택.
 * - 비트에 맞는 **원(zone)** 안의 후보를 우선
 * - 그중 가까운 쪽(1등 50% · 2등 30% · 3등 20%)
 * - 원 후보가 없으면 전체에서 가까운 쪽 (북진 강제 없음)
 */
function pickNearNode(
  candidates: AreaNpcDef[],
  fromX: number,
  fromY: number,
  opts?: { areaId?: string; beatId?: string },
): AreaNpcDef {
  if (candidates.length === 1) return candidates[0]!;
  let pool = candidates;
  const areaId = opts?.areaId;
  const beatId = opts?.beatId;
  if (areaId && beatId) {
    const zones = (data.areaZones ?? []).filter(
      (z) => z.area_id === areaId && zoneMatchesBeat(z.beat_id, beatId),
    );
    if (zones.length) {
      const inZone = candidates.filter((n) => npcInZones(n, zones));
      if (inZone.length) pool = inZone;
    }
  }
  const scored = pool
    .map((n) => ({
      n,
      d: Math.hypot(n.x_pct - fromX, n.y_pct - fromY),
    }))
    .sort((a, b) => a.d - b.d);
  const top = scored.slice(0, Math.min(3, scored.length));
  const roll = randInt(1, 100);
  if (roll <= 50) return top[0]!.n;
  if (roll <= 80) return (top[1] ?? top[0]!).n;
  return top[top.length - 1]!.n;
}

function zoneMatchesBeat(zoneBeat: string, beatId: string): boolean {
  if (zoneBeat === beatId) return true;
  // B3 해금은 B1 웅덩이 원으로 귀환
  if (beatId === "B3" && zoneBeat === "B1") return true;
  return false;
}

function npcInZones(n: AreaNpcDef, zones: { zone_id: string; x_pct: number; y_pct: number; r_pct: number }[]): boolean {
  if (n.zone_id && zones.some((z) => z.zone_id === n.zone_id)) return true;
  return zones.some((z) => Math.hypot(n.x_pct - z.x_pct, n.y_pct - z.y_pct) <= z.r_pct + 0.5);
}

/**
 * 43 S4 — 「다음날」의 본체. **섹터 사이클 비트**를 따라 한 걸음 나아간다.
 *
 * 순서(B1 만나기 → B2 채우기 → B3 해금 → B3r 잔여칠 → B3b 생명 → B3c 탐방 → B4 구조 → B5 관문)는
 * `sector_beat_config.csv`가 정하고 **절대 흔들리지 않는다.**
 * 흔들리는 것은 셋뿐이다 —
 *   L1 어느 노드를 밟을지(후보 중 랜덤) · L2 몇 번 반복할지(min~max) · L3 갈림길(플레이어).
 *
 * 「정화가 되어야 그 지역에 뭐가 있는지 안다」 — 가시성 판정은 explore가 소유하므로
 * 후보에서 `explore.isNodeRevealed()`로 걸러 **안 보이는 자리로는 걸어가지 않는다.**
 *
 * 구조(B4)는 시퀀스에 두되, 잔여 오브·필러 맞춤이 우선. 구조 퍼즐 개편은 별도.
 */
async function stepToNextNode(): Promise<boolean> {
  if (!explore) return false;
  const areaId = explore.areaId;
  if (!areaId) return false;

  const beats = data.sectorBeats ?? [];
  if (!beats.length) return false;
  const cur = beatCursorFor(areaId);
  const here = data.areaNpcs.filter((n) => n.area_id === areaId);

  // 비트를 훑어 밟을 수 있는 자리를 찾는다. 후보가 없으면 다음 비트로 넘어간다.
  for (let guard = 0; guard < beats.length + 2; guard++) {
    if (cur.idx >= beats.length) return false; // 이 섹터 사이클 종료
    const beat = beats[cur.idx];

    if (cur.left <= 0) {
      cur.left = randInt(Math.max(1, beat.min_count), Math.max(beat.min_count, beat.max_count)); // L2
    }

    // B3r — 잔여 스케치 오브 칼라 총 (NPC 아님)
    if (beat.node_types.includes("PROP_PURIFY")) {
      if (!journey3d?.isOn() || !state.purifiedAreas.includes(areaId)) {
        cur.idx += 1;
        cur.left = 0;
        continue;
      }
      if (journey3d.residualLeft() <= 0) {
        cur.idx += 1;
        cur.left = 0;
        continue;
      }
      if (!explore.isOn()) {
        explore.show();
        visualStage.classList.add("explore-on");
      }
      await appendCard({
        body: `[정화] 파도가 남긴 스케치가 있다.\n7m에서 일어서고, 5m에서 칼라 총으로 칠한다.`,
      });
      await journey3d.runResidualHunt();
      if (journey3d.residualLeft() <= 0) {
        await appendCard({
          body: `[정화] 이 지역의 잔여 스케치를 모두 되살렸다.\n이제 탐방·관문으로 이어진다.`,
          mood: "joy",
        });
      }
      cur.left = 0;
      cur.idx += 1;
      explore.refreshCurrentArea();
      return true;
    }

    let pool: AreaNpcDef[];
    if (beat.node_types.includes("BLIGHT_APPLY")) {
      // B3 — B1에서 본 그 오염 자리로 돌아간다(38 규칙4: 귀환도 하루)
      const target = here.find((n) => n.npc_id === cur.blightNodeId);
      pool = target && !state.purifiedBlights.includes(target.trigger_ref) ? [target] : [];
    } else {
      pool = here.filter((n) => beat.node_types.includes(n.trigger_type) && isNodeLive(n));
    }

    // 안개에 안 드러난 자리는 후보에서 뺀다 — 가시성은 explore 소유
    const visible = pool.filter((n) => explore!.isNodeRevealed(n.npc_id));
    const candidates = visible.length ? visible : pool;

    if (!candidates.length) {
      cur.idx += 1;
      cur.left = 0;
      continue;
    }

    // L1 — 완전 난입이 아니라 **가까운 후보를 우선**. 시나리오 밴드 안에서도 화면 밖으로 튀지 않게.
    const here3d = journey3d?.isOn() ? journey3d.getPlayer() : null;
    const next = pickNearNode(
      candidates,
      here3d?.xPct ?? explore.pos.x,
      here3d?.yPct ?? explore.pos.y,
      { areaId, beatId: beat.beat_id },
    );
    if (beat.node_types.includes("BLIGHT") && !beat.node_types.includes("BLIGHT_APPLY")) {
      cur.blightNodeId = next.npc_id; // B1이 고른 자리를 B3가 기억한다
    }

    if (!explore.isOn()) {
      explore.show();
      visualStage.classList.add("explore-on");
    }
    const walkX = next.x_pct;
    // FILL은 남쪽에 서서 오브가 앞에 오게. 나머지는 살짝 아래.
    const walkY =
      next.trigger_type === "FILL" || next.trigger_type === "CATALYST"
        ? Math.min(96, next.y_pct + 5)
        : Math.min(94, next.y_pct + 7);
    // 3D가 주연이면 미니맵은 좌표만 받는다. 탑뷰 walkTo만 부르면 FPS/3인칭 캐릭터가 그대로 선다.
    if (journey3d?.isOn()) {
      await journey3d.walkTo(walkX, walkY);
    } else {
      await explore.walkTo(walkX, walkY);
    }

    const cleared = await runMapNode(next);
    if (cleared && !state.clearedNodes.includes(next.npc_id)) {
      state.clearedNodes.push(next.npc_id);
    }
    // 해금·생명 녹이기가 모자라면 그 비트에 머문다. 「다음날」은 이미 하루가 갔다.
    if (!cleared && (beat.beat_id === "B3" || beat.beat_id === "B3b")) {
      explore.refreshCurrentArea();
      return true;
    }
    cur.left -= 1;
    if (cur.left <= 0) {
      const finishedId = beat.beat_id;
      cur.idx += 1;
      cur.left = 0;
      // B3(해금 후)·B5(관문 후) — 가끔 중간 길 판정(등급→갈림길/자동)
      if (
        !pendingPathJudgment &&
        (finishedId === "B3" || finishedId === "B5") &&
        randInt(1, 100) <= tuningNum(data, "path_judge_mid_chance_pct", 40)
      ) {
        pendingPathJudgment = "mid";
      }
    }
    explore.refreshCurrentArea();
    return true;
  }
  return false;
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

/** 테스트용 — 초반 인트로/컷신 스킵 (?skip=1 또는 세션 플래그) */
const SKIP_OPENING_KEY = "xoox_skip_opening";

function wantsSkipOpening(): boolean {
  try {
    const q = new URLSearchParams(window.location.search);
    if (q.get("skip") === "1" || q.get("skipIntro") === "1") return true;
    if (sessionStorage.getItem(SKIP_OPENING_KEY) === "1") return true;
  } catch {
    /* ignore */
  }
  return false;
}

function markSkipOpening() {
  try {
    sessionStorage.setItem(SKIP_OPENING_KEY, "1");
  } catch {
    /* ignore */
  }
}

function clearSkipOpening() {
  try {
    sessionStorage.removeItem(SKIP_OPENING_KEY);
  } catch {
    /* ignore */
  }
}

/** 게임 실행 인트로 — 원본 이미지(data/xoox_intro.png). 파일 없으면 재현 아트로 폴백. "게임 스타트" 클릭 시 입장. */
function playIntroSplash(): Promise<void> {
  return new Promise((resolve) => {
    const el = document.getElementById("introSplash");
    if (!el) {
      setAppScene("boot");
      resolve();
      return;
    }

    if (wantsSkipOpening()) {
      setAppScene("boot");
      resolve();
      return;
    }

    setAppScene("intro");
    const img = document.getElementById("introImg") as HTMLImageElement | null;
    const fb = document.getElementById("introFallback");
    if (img && fb) {
      img.addEventListener("error", () => {
        img.style.display = "none";
        fb.style.display = "flex";
      });
    }
    let entered = false;
    const enter = (skipScenario: boolean) => {
      if (entered) return;
      entered = true;
      if (skipScenario) markSkipOpening();
      else clearSkipOpening();
      // 페이드로 아래 여정이 비치지 않게 — 즉시 boot(불투명)로 전환
      setAppScene("boot");
      resolve();
    };
    document.getElementById("introStartBtn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      enter(false);
    });
    document.getElementById("introSkipBtn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      enter(true);
    });
    // 배경 탭 = 일반 시작(컷신 유지). 스킵은 버튼만.
    el.addEventListener("click", () => enter(false));
  });
}

/** 진입 컷신 — 4리더 도입 대사 순차 재생 → 챕터 자막 → 게임. 탭으로 진행. */
function playCutscene(sceneId: string): Promise<void> {
  return new Promise((resolve) => {
    const lines = data.cutscenes.filter((c) => c.scene_id === sceneId);
    if (lines.length === 0 || wantsSkipOpening()) {
      setAppScene("boot");
      resolve();
      return;
    }

    setAppScene("cutscene");
    cutsceneBox.style.display = "";
    cutsceneChapter.classList.remove("show");
    cutsceneOverlay.classList.remove("out");
    let i = -1;
    let finished = false;
    const stageName = getStageMapForDay(data, 1)?.display_name ?? "";
    const chapterTimer: { id: number | null } = { id: null };

    const finish = (fast: boolean) => {
      if (finished) return;
      finished = true;
      cutsceneOverlay.onclick = null;
      if (chapterTimer.id) window.clearTimeout(chapterTimer.id);
      cutsceneBox.style.display = "none";
      cutsceneChapter.classList.remove("show");
      if (fast) {
        setAppScene("boot");
        resolve();
        return;
      }
      cutsceneChapter.textContent = `구역 01 — ${stageName}`;
      cutsceneChapter.classList.add("show");
      chapterTimer.id = window.setTimeout(() => {
        setAppScene("boot");
        resolve();
      }, 1100);
    };

    const advance = () => {
      if (finished) return;
      i++;
      if (i >= lines.length) {
        finish(false);
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

    const skipBtn = document.getElementById("cutsceneSkipBtn");
    skipBtn?.addEventListener(
      "click",
      (e) => {
        e.stopPropagation();
        markSkipOpening();
        finish(true);
      },
      { once: true }
    );

    cutsceneOverlay.onclick = advance;
    advance();
  });
}

async function init() {
  installPlayLog();
  playLog("GAME", "부트");
  bindSceneHost(phoneEl);
  setAppScene(wantsSkipOpening() ? "boot" : "intro");
  const introDone = playIntroSplash();
  data = await loadGameData();
  await introDone;
  await playCutscene("intro");
  state = createInitialState(data);
  state.day = 1;
  bindStaticUi();
  // S3: FAB = 로비 단말기로 안내 (전체화면 스크랩 직접 오픈 안 함)
  scrapbookFab.addEventListener("click", () => {
    enterLobby({ note: "기억 조각을 단말기에서 펼쳐보세요." });
    lobby?.openTerminal("scrapbook");
  });
  document.getElementById("scrapbookClose")!.addEventListener("click", () => {
    void hideFullscreen(scrapbookPanel);
  });
  scrapbookPanel.addEventListener("click", (e) => {
    if (e.target === scrapbookPanel) void hideFullscreen(scrapbookPanel);
  });
  renderScrapbookBadge();
  initExplore();
  initLobby();
  ensureWandererHero();
  applyStageBackground();
  refreshStatbar();
  setStageMode("IDLE");
  lastStageMapId = getStageMapForDay(data, 1)?.stage_map_id ?? null;
  // S1: 인트로 후 로비(집)부터 — 여정은 「외출하기」로
  enterLobby({
    note: wantsSkipOpening()
      ? "테스트 진입 · 시나리오 스킵됨. 바로 외출해도 돼요."
      : "여기는 무지개섬. 준비되면 외출해요.",
  });
  (window as unknown as { __lobby: () => void }).__lobby = () => {
    if (appMode === "lobby") void enterJourney();
    else enterLobby();
  };
  (window as unknown as { __skipOpening: () => void }).__skipOpening = () => {
    markSkipOpening();
    window.location.href = `${window.location.pathname}?skip=1`;
  };
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
/** S7 Memory Battle 바로 미리보기 */
(window as any).__memoryBattle = () => void runMemoryBattleFlow("c_purify_final");
/** 41 — 항해 상태 한눈에 (일차 · 배까지 · 섬 정화도 · 아이 수) */
(window as any).__voyage = () => {
  const p = islandPurifyPct();
  const info = {
    day: state.day,
    daysLeft: Math.max(0, voyageDays() - state.day),
    islandPurify: `${p.pct}% (${p.done}/${p.total})`,
    kids: state.rescuedAnimals.length,
    party: state.joinedPartyMembers.length,
    heldCatalysts: [...state.heldCatalysts],
    purifyAmmo: state.purifyAmmo,
    area: explore?.areaId ?? "-",
    voyageOver,
  };
  console.table([info]);
  return info;
};
/** 41 — 임의 일차로 점프(검증용). 배가 오는 날을 넘기면 귀환 화면. */
(window as any).__setDay = (d: number) => {
  state.day = Math.max(1, Math.floor(d));
  ensureDayHeader(state.day);
  refreshTimeline();
  refreshStatbar();
  return (window as any).__voyage();
};
/** 39 §2 — 배가 오는 날 강제(귀환 화면) */
(window as any).__endVoyage = () => void showVoyageEndScreen();
/** 39 §4 — 판 실패 화면(프로토 이어하기) */
(window as any).__failRun = () => void showRunFailScreen("검증용 강제 실패.");
