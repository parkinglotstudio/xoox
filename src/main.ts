import "./style.css";
import { loadGameData } from "./data";
import {
  createInitialState,
  rollIsCombat,
  rollContentType,
  rollGrade,
  rollDailyEntry,
  pickUngradedText,
  pickLocation,
  pickBranch,
  pickCombat,
  textFor,
  applyEffectId,
  checkLevelUp,
  checkMilestones,
  grantSkillFromTier,
  pickSkillChoices,
  incrementGauge,
  gaugeValue,
  spinMinigameRow,
  getMinigamePool,
  rewardRowLabel,
  getBonusEffectIds,
  uiText,
  effectLine,
} from "./engine";
import { scrambleReveal, rollBanner, sleep, type BannerCandidate } from "./effects";
import { randInt } from "./rng";
import type { GameData, PlayerState, GradeDef, BranchDef, SkillDef, MinigameRewardRow } from "./types";

const app = document.getElementById("app")!;
app.innerHTML = `
  <div class="phone">
    <div class="statbar">
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
    </div>
    <div class="victory-panel" id="victoryPanel" style="display:none">
      <div class="victory-crown" id="victoryIcon"></div>
      <div class="victory-title" id="victoryTitle"></div>
      <div class="victory-sub" id="victorySub"></div>
      <div class="victory-loot" id="victoryLoot"></div>
      <button class="mg-action-btn" id="restartBtn"></button>
    </div>
    <div class="controls">
      <div class="gauge jackpot">
        <div class="gauge-icon" id="gaugeJackpotIcon"></div>
        <div class="gauge-count" id="gaugeJackpot"></div>
        <div class="gauge-label" id="gaugeJackpotLabel"></div>
      </div>
      <button class="main-btn idle" id="mainBtn"></button>
      <div class="choice-buttons" id="choiceButtons" style="display:none;"></div>
      <div class="gauge mid">
        <div class="gauge-icon" id="gaugeMidIcon"></div>
        <div class="gauge-count" id="gaugeMid"></div>
        <div class="gauge-label" id="gaugeMidLabel"></div>
      </div>
    </div>
  </div>
`;

const feedEl = document.getElementById("feed")!;
const currencyBar = document.getElementById("currencyBar")!;
const bannerOverlay = document.getElementById("bannerOverlay")!;
const bannerText = document.getElementById("bannerText")!;
const splashOverlay = document.getElementById("splashOverlay")!;
const splashTitle = document.getElementById("splashTitle")!;
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
let combatPending: { tier: string } | null = null;
let pendingSkillChoice: (() => void) | null = null;

function slideIn(el: HTMLElement) {
  el.classList.remove("btn-slide-in");
  void el.offsetWidth;
  el.classList.add("btn-slide-in");
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
  if (day >= 60) return "FINALBOSS";
  if (Math.random() < 0.12) return "MINIBOSS";
  return "NORMAL";
}

function refreshStatbar() {
  document.getElementById("statLevel")!.textContent = String(state.level);
  document.getElementById("statAtk")!.textContent = String(Math.round(state.atk));
  document.getElementById("statDef")!.textContent = String(Math.round(state.def));
  document.getElementById("statGold")!.textContent = String(Math.round(state.gold));
  document.getElementById("hpText")!.textContent = ui("ui_stat_hp_format", {
    hp: Math.round(state.hp),
    max: Math.round(state.maxHp),
  });
  (document.getElementById("hpFill") as HTMLElement).style.width = `${(state.hp / state.maxHp) * 100}%`;
  const gj = gaugeValue(data, state, "gz_jackpot");
  const gm = gaugeValue(data, state, "gz_mid");
  gaugeJackpotEl.textContent = `${gj.current}/${gj.cap}`;
  gaugeMidEl.textContent = `${gm.current}/${gm.cap}`;
  refreshCurrencyBar();
}

function refreshCurrencyBar() {
  // 골드는 상단 스탯바에 이미 있으므로 재화바에는 그 외 재화만 노출
  const shown = data.currencies.filter((c) => {
    if (c.state_key === "gold") return false;
    const amount = (state as unknown as Record<string, number>)[c.state_key] ?? 0;
    return c.always_show || amount > 0;
  });
  currencyBar.style.display = shown.length > 0 ? "flex" : "none";
  currencyBar.innerHTML = shown
    .map((c) => {
      const amount = (state as unknown as Record<string, number>)[c.state_key] ?? 0;
      return `<span class="currency-chip" title="${c.label}">${c.icon} ${Math.round(amount)}</span>`;
    })
    .join("");
}

function scrollFeedToBottom() {
  feedEl.scrollTop = feedEl.scrollHeight;
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
  body: string;
  grade?: GradeDef | null;
  effectLines?: string[];
  scramble?: boolean;
}

async function appendCard(opts: CardOptions): Promise<HTMLElement> {
  const isImpact = (opts.grade?.is_negative ?? false) || (opts.effectLines?.some((l) => /-/.test(l)) ?? false);
  const card = document.createElement("div");
  card.className =
    "card" + (opts.grade ? ` grade-${opts.grade.grade_name}` : "") + (isImpact ? " impact" : "");
  const bodyEl = document.createElement("div");
  card.appendChild(bodyEl);

  if (opts.grade) {
    const tag = document.createElement("div");
    tag.className = `card-tag tag-${opts.grade.grade_name}`;
    tag.textContent = opts.grade.grade_name;
    card.appendChild(tag);
  }

  feedEl.appendChild(card);
  scrollFeedToBottom();

  if (opts.scramble) {
    await scrambleReveal(bodyEl, opts.body, 550);
  } else {
    bodyEl.textContent = opts.body;
  }

  if (opts.effectLines && opts.effectLines.length > 0) {
    const chipWrap = document.createElement("div");
    opts.effectLines.forEach((line) => {
      const chip = document.createElement("span");
      const isNeg = /-/.test(line);
      chip.className = "effect-chip" + (isNeg ? " neg" : "");
      chip.textContent = line;
      chipWrap.appendChild(chip);
    });
    card.appendChild(chipWrap);
  }

  scrollFeedToBottom();
  refreshStatbar();
  return card;
}

const GRADE_TIER_ORDER = ["g_bad", "g_mid", "g_jackpot"];
function toBannerCandidate(g: GradeDef): BannerCandidate {
  return { name: g.grade_name, color: g.banner_color };
}
function pickNearMissGradeId(finalGradeId: string): string | null {
  const idx = GRADE_TIER_ORDER.indexOf(finalGradeId);
  return idx > 0 ? GRADE_TIER_ORDER[idx - 1] : null;
}

async function playGradeBanner(grade: GradeDef) {
  bannerOverlay.style.display = "flex";
  const others = data.grades.filter((g) => g.grade_id !== grade.grade_id);
  const shuffled = [...others].sort(() => Math.random() - 0.5).map(toBannerCandidate);
  const nearMissId = pickNearMissGradeId(grade.grade_id);
  const nearMissGrade = nearMissId ? data.grades.find((g) => g.grade_id === nearMissId) : null;
  const sequence: BannerCandidate[] = [...shuffled];
  if (nearMissGrade) sequence.push(toBannerCandidate(nearMissGrade));
  sequence.push(toBannerCandidate(grade));
  await rollBanner(bannerText, sequence, 2800);
  bannerOverlay.style.display = "none";
}

async function playSplash(title: string, ms = 1100) {
  splashTitle.textContent = title;
  splashOverlay.style.display = "flex";
  await sleep(ms);
  splashOverlay.style.display = "none";
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

async function renderCardMatch(pool: MinigameRewardRow[], winIndex: number) {
  const win = rewardRowLabel(data, pool[winIndex]);
  const legend = pool
    .map((r) => {
      const l = rewardRowLabel(data, r);
      return `<div class="card-legend-row"><span class="card-legend-icons">${l.icon}${l.icon}${l.icon}</span><span>${l.text}</span></div>`;
    })
    .join("");
  const total = 12;
  const winCells = shuffle([...Array(total).keys()]).slice(0, 3);
  const fillerIcons = pool.filter((_, i) => i !== winIndex).map((r) => rewardRowLabel(data, r).icon);
  const cells: { icon: string; win: boolean }[] = [];
  for (let i = 0; i < total; i++) {
    if (winCells.includes(i)) cells.push({ icon: win.icon, win: true });
    else cells.push({ icon: fillerIcons[Math.floor(Math.random() * fillerIcons.length)] || "🪙", win: false });
  }
  minigameStage.innerHTML = `<div class="card-legend">${legend}</div><div class="card-grid">${cells
    .map((_, i) => `<button class="match-card" id="mc${i}" disabled><span class="match-card-face">❔</span></button>`)
    .join("")}</div>`;
  await sleep(300);
  const order = shuffle([...Array(total).keys()]);
  for (const idx of order) {
    const el = document.getElementById("mc" + idx) as HTMLElement;
    el.classList.add("flipped");
    el.querySelector(".match-card-face")!.textContent = cells[idx].icon;
    await sleep(130);
  }
  await sleep(300);
  for (const idx of winCells) {
    document.getElementById("mc" + idx)!.classList.add("matched");
  }
  await sleep(600);
}

async function runSkillSwap() {
  const owned = state.learnedSkills
    .map((id) => data.skills.find((s) => s.skill_id === id))
    .filter((s): s is SkillDef => !!s && !s.is_upgrade);
  if (owned.length === 0) {
    await appendCard({ body: ui("ui_skillswap_none") });
    return;
  }
  const destroyed = owned[randInt(0, owned.length - 1)];
  state.learnedSkills = state.learnedSkills.filter((id) => id !== destroyed.skill_id);
  await appendCard({ body: ui("ui_skillswap_destroy", { name: destroyed.skill_name }) });

  const candidates = data.skills.filter((s) => !s.is_upgrade && !state.learnedSkills.includes(s.skill_id));
  if (candidates.length === 0) return;
  const newSkill = candidates[randInt(0, candidates.length - 1)];

  minigamePanel.style.display = "flex";
  minigameTitle.textContent = ui("ui_skillswap_title");
  minigameSub.textContent = "";
  minigameResult.textContent = "";
  const allIcons = candidates.map((s) => s.icon || "🎁");
  minigameStage.innerHTML = `<div class="slot-machine"><div class="slot-reel" id="ssReel">❔</div></div>`;
  const reel = document.getElementById("ssReel") as HTMLElement;
  const timer = window.setInterval(() => {
    reel.textContent = allIcons[Math.floor(Math.random() * allIcons.length)];
  }, 80);
  await sleep(1700);
  window.clearInterval(timer);
  reel.textContent = newSkill.icon || "🎁";
  reel.classList.add("slot-lock");
  minigameResult.textContent = `${newSkill.icon} ${newSkill.skill_name}`;
  await sleep(1200);
  minigamePanel.style.display = "none";
  state.learnedSkills.push(newSkill.skill_id);
  await appendCard({ body: ui("ui_skill_learned", { name: newSkill.skill_name }) });
}

function showChestIntro(): Promise<void> {
  return new Promise((resolve) => {
    minigamePanel.style.display = "flex";
    minigameTitle.textContent = ui("ui_chest_found");
    minigameSub.textContent = "";
    minigameResult.textContent = "";
    minigameStage.innerHTML = `<div class="chest-box">🎁</div>`;
    minigameActionBtn.style.display = "";
    minigameActionBtn.textContent = ui("ui_mg_open_btn");
    minigameActionBtn.onclick = () => {
      minigameActionBtn.style.display = "none";
      minigamePanel.style.display = "none";
      resolve();
    };
  });
}

async function runMinigame(minigameId: string) {
  const mg = data.minigames.find((m) => m.minigame_id === minigameId)!;
  const pool = getMinigamePool(data, minigameId);
  await playSplash(ui("ui_mg_splash"));
  minigamePanel.style.display = "flex";
  minigameTitle.textContent = mg.minigame_name;
  minigameSub.textContent = mg.type === "CARD_MATCH" ? ui("ui_mg_card_sub") : "";
  minigameResult.textContent = "";

  const maxSpins = mg.attempt_limit ?? 1;
  let spinsUsed = 0;
  let finalRow: MinigameRewardRow | null = null;
  const appliedLines: string[] = [];

  while (spinsUsed < maxSpins) {
    spinsUsed++;
    if (mg.type === "SLOT" && mg.attempt_limit) {
      minigameSub.textContent = ui("ui_mg_spins_left", { n: maxSpins - spinsUsed });
    }
    const win = spinMinigameRow(data, minigameId);
    if (!win) break;
    const winIndex = pool.indexOf(win);
    if (mg.type === "CARD_MATCH") await renderCardMatch(pool, winIndex);
    else if (mg.type === "SLOT") await renderSlot(pool, winIndex);
    else await renderWheel(pool, winIndex);
    minigameResult.textContent = rewardRowLabel(data, win).text;
    if (win.action === "RESPIN" && spinsUsed < maxSpins) {
      await sleep(650);
      continue;
    }
    finalRow = win;
    break;
  }

  if (finalRow && finalRow.effect_id) {
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
      skillChoiceTitle.textContent = title;
      skillChoiceSub.textContent = subtitle;
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
    candidates.map((s) => ({
      badge: s.tier,
      badgeClass: `tier-${s.tier}`,
      name: s.icon ? `${s.icon} ${s.skill_name}` : s.skill_name,
      desc: s.effect_text,
    }))
  );
  return idx === null ? null : candidates[idx];
}

async function grantLevelSkill(mode: "CHOICE_3" | "AUTO", tier: string) {
  if (mode === "CHOICE_3") {
    const candidates = pickSkillChoices(data, state, tier, 3);
    const chosen = await presentSkillChoice(ui("ui_btn_skill_choice"), ui("ui_skill_sub"), candidates);
    if (!chosen) return;
    state.learnedSkills.push(chosen.skill_id);
    await appendCard({ body: ui("ui_skill_learned_choice", { name: chosen.skill_name }) });
    return;
  }
  const skill = grantSkillFromTier(data, state, tier === "미확인" ? "미확인" : tier);
  if (!skill) return;
  await appendCard({ body: ui("ui_skill_learned_auto", { name: skill.skill_name }) });
}

async function resolveCombat(tier: string) {
  mainBtn.textContent = ui("ui_btn_combat_active");
  mainBtn.className = "main-btn combat";
  await sleep(900);
  const combat = pickCombat(data, tier);
  const gold = combat ? randInt(combat.gold_min, combat.gold_max) : 300;
  const exp = combat ? randInt(combat.exp_min, combat.exp_max) : 60;
  state.gold += gold;
  state.exp += exp;
  await appendCard({
    body: ui("ui_combat_win"),
    effectLines: [ui("ui_chip_exp", { exp }), ui("ui_chip_gold", { gold })],
  });
  const lvl = checkLevelUp(data, state);
  if (lvl) {
    await appendCard({ body: ui("ui_levelup", { lv: lvl.newLevel }) });
    await appendCard({ body: ui("ui_levelup_heal"), effectLines: [ui("ui_chip_hp_heal", { pct: lvl.hpHealPct })] });
    await grantLevelSkill(lvl.skillGrantMode, lvl.skillPoolTier);
  }
  if (combat?.tier === "MINIBOSS") {
    await appendCard({ body: ui("ui_miniboss_chest") });
    await showChestIntro();
    const candidates = pickSkillChoices(data, state, "신화", 3);
    const chosen = await presentSkillChoice(ui("ui_chest_title"), ui("ui_skill_sub"), candidates);
    if (chosen) {
      state.learnedSkills.push(chosen.skill_id);
      await appendCard({ body: ui("ui_skill_learned", { name: chosen.skill_name }) });
    }
  } else if (combat?.tier === "FINALBOSS") {
    const hasRevive = state.learnedSkills.includes("sk_revival");
    if (hasRevive && Math.random() < 0.6) {
      await appendCard({ body: ui("ui_revive_down") });
      await sleep(700);
      state.hp = state.maxHp;
      await appendCard({ body: ui("ui_revive_up"), effectLines: [ui("ui_chip_full_heal")] });
    }
    const res = applyEffectId(data, state, "e_ancient_succession");
    await appendCard({ body: ui("ui_finalboss_reward"), effectLines: res.lines });
    await showChestIntro();
    const candidates = pickSkillChoices(data, state, "전설", 3);
    const chosen = await presentSkillChoice(ui("ui_chest_title"), ui("ui_skill_sub"), candidates);
    if (chosen) {
      state.learnedSkills.push(chosen.skill_id);
      await appendCard({ body: ui("ui_skill_learned", { name: chosen.skill_name }) });
    }
    state.finalBossDefeated = true;
  }
  combatPending = null;
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

  if (branch.cost_effect_id) {
    const costRes = applyEffectId(data, state, branch.cost_effect_id);
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
  if (effectId.startsWith("COMBAT_TRIGGER")) {
    const tier = effectId.includes(":") ? effectId.split(":")[1] : "NORMAL";
    const text = tier === "FINALBOSS" ? ui("ui_final_encounter") : ui("ui_enemy_appear");
    await appendCard({ body: text });
    combatPending = { tier };
    await playMovingPhase();
    return;
  }
  if (effectId.startsWith("MINIGAME:")) {
    await runMinigame(effectId.split(":")[1]);
    return;
  }
  if (effectId === "SKILL_SWAP") {
    await runSkillSwap();
    return;
  }
  const res = applyEffectId(data, state, effectId);
  await appendCard({ body: ui("ui_reward_get"), effectLines: res.lines });
}

async function showBranchPrompt(branch: BranchDef) {
  const promptBody = textFor(data, branch.text_id);
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

  const costEffect = branch.cost_effect_id
    ? data.effects.find((e) => e.effect_id === branch.cost_effect_id)
    : undefined;
  const costPreview = costEffect ? effectLine(costEffect) : "";

  const makeBtn = (label: string, cost: string, prob: number | null, secondary: boolean) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "choice-btn" + (secondary ? " secondary" : "");
    b.innerHTML = `${label}${cost ? `<small>${cost}</small>` : ""}${prob !== null ? `<small>${ui("ui_prob_label", { prob })}</small>` : ""}`;
    return b;
  };

  const btnA = makeBtn(branch.option_a_label, costPreview, branch.option_a_prob, true);
  const btnB = makeBtn(branch.option_b_label, costPreview, branch.option_b_prob, false);

  const choose = async (btn: HTMLButtonElement, side: "A" | "B") => {
    await playActivate(btn);
    choiceButtons.style.display = "none";
    choiceButtons.innerHTML = "";
    mainBtn.style.display = "";
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
  choiceButtons.style.display = "flex";
  slideIn(choiceButtons);
}

function setIdle() {
  mainBtn.disabled = false;
  mainBtn.textContent = ui("ui_btn_next");
  mainBtn.className = "main-btn idle";
  slideIn(mainBtn);
}

function finishTurn() {
  if (combatPending) {
    mainBtn.disabled = false;
    mainBtn.textContent = ui("ui_btn_combat");
    mainBtn.className = "main-btn combat";
    slideIn(mainBtn);
  } else {
    setIdle();
  }
  refreshStatbar();
}

async function playMovingPhase() {
  mainBtn.disabled = true;
  mainBtn.textContent = ui("ui_btn_moving");
  mainBtn.className = "main-btn combat";
  slideIn(mainBtn);
  await sleep(900);
}

async function resolveDirectReward() {
  const grade = rollGrade(data);
  const entry = rollDailyEntry(data, grade.grade_id);
  if (!entry) {
    await Promise.all([playGradeBanner(grade), appendCard({ body: ui("ui_nothing"), grade })]);
    return;
  }
  const text = textFor(data, entry.text_id);
  const res = applyEffectId(data, state, entry.effect_id);
  const bonusLines: string[] = [];
  for (const bonusEffectId of getBonusEffectIds(data, entry.pool_id)) {
    bonusLines.push(...applyEffectId(data, state, bonusEffectId).lines);
  }
  await Promise.all([
    playGradeBanner(grade),
    appendCard({ body: text, grade, effectLines: [...res.lines, ...bonusLines], scramble: true }),
  ]);
  const gaugeRes = incrementGauge(data, state, grade.grade_id);
  refreshStatbar();
  if (gaugeRes?.filled) {
    await runMinigame(gaugeRes.gauge.reward_minigame_id);
  }
}

async function resolveLocation() {
  const loc = pickLocation(data, state);
  state.seenLocations.add(loc.location_id);
  const text = textFor(data, loc.text_id);
  const grade = loc.grade_id ? data.grades.find((g) => g.grade_id === loc.grade_id) ?? null : null;
  const lines: string[] = [];
  if (loc.linked_effect_id) {
    const res = applyEffectId(data, state, loc.linked_effect_id);
    lines.push(...res.lines);
  }
  if (grade) {
    await Promise.all([playGradeBanner(grade), appendCard({ body: text, grade, effectLines: lines })]);
  } else {
    await appendCard({ body: text, grade, effectLines: lines });
  }
  if (loc.linked_minigame_id) {
    await runMinigame(loc.linked_minigame_id);
  }
  if (grade) {
    const gaugeRes = incrementGauge(data, state, grade.grade_id);
    if (gaugeRes?.filled) await runMinigame(gaugeRes.gauge.reward_minigame_id);
  }
  await flushMilestones();
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
  const text = pickUngradedText(data);
  const effectId = text.text_id === "t_rest_zone" ? "e_hp60" : Math.random() < 0.5 ? "e_exp33" : "e_exp22";
  const res = applyEffectId(data, state, effectId);
  await appendCard({ body: text.body, effectLines: res.lines });
}

async function onMainBtnClick() {
  if (state.finalBossDefeated) return;
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

  if (combatPending) {
    await resolveCombat(combatPending.tier);
    finishTurn();
    return;
  }

  state.day += 1;
  ensureDayHeader(state.day);

  if (rollIsCombat(data, state.day)) {
    const tier = decideCombatTier(state.day);
    const combat = pickCombat(data, tier);
    const text = combat ? textFor(data, combat.text_id) : ui("ui_enemy_appear");
    await appendCard({ body: text });
    combatPending = { tier };
    await playMovingPhase();
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

async function init() {
  data = await loadGameData();
  state = createInitialState(data);
  bindStaticUi();
  refreshStatbar();
  await appendCard({ body: textFor(data, "t_hometown") });
  ensureDayHeader(1);
  state.day = 1;
  const { tier: startTier, hasBadge } = startSkillTier();
  await appendCard({ body: ui(hasBadge ? "ui_start_badge" : "ui_start_nobadge") });
  const startCandidates = pickSkillChoices(data, state, startTier, 3);
  const startSkill = await presentSkillChoice(ui("ui_btn_skill_choice"), ui("ui_skill_sub"), startCandidates);
  if (startSkill) {
    state.learnedSkills.push(startSkill.skill_id);
    await appendCard({ body: ui("ui_skill_learned", { name: startSkill.skill_name }) });
  }
  setIdle();
}

init();

// 개발용 미니게임 프리뷰 훅 (콘솔에서 __mg("mg_circle") 등으로 호출)
(window as any).__mg = (id: string) => runMinigame(id);
