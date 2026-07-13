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
  grantSkillFromTier,
  pickSkillChoices,
  incrementGauge,
  gaugeValue,
  spinMinigame,
  getBonusEffectIds,
} from "./engine";
import { scrambleReveal, rollBanner, sleep, type BannerCandidate } from "./effects";
import { randInt } from "./rng";
import type { GameData, PlayerState, GradeDef, BranchDef, SkillDef } from "./types";

const app = document.getElementById("app")!;
app.innerHTML = `
  <div class="phone">
    <div class="statbar">
      <div class="stat-chip"><span class="label">LV</span><span class="value" id="statLevel">1</span></div>
      <div class="hp-bar-wrap">
        <div class="hp-bar-track"><div class="hp-bar-fill" id="hpFill" style="width:100%"></div></div>
        <span id="hpText" style="font-size:10px;color:#e8b8b8;">HP 22000/22000</span>
      </div>
      <div class="stat-chip"><span class="label">ATK</span><span class="value" id="statAtk">0</span></div>
      <div class="stat-chip"><span class="label">DEF</span><span class="value" id="statDef">0</span></div>
      <div class="stat-chip"><span class="label">GOLD</span><span class="value" id="statGold">0</span></div>
    </div>
    <div class="feed" id="feed"></div>
    <div class="banner-overlay" id="bannerOverlay" style="display:none">
      <div class="banner-text" id="bannerText"></div>
    </div>
    <div class="splash-overlay" id="splashOverlay" style="display:none">
      <div class="splash-title" id="splashTitle">BONUS GAME</div>
    </div>
    <div class="minigame-panel" id="minigamePanel" style="display:none">
      <div class="title" id="minigameTitle"></div>
      <div class="result" id="minigameResult"></div>
    </div>
    <div class="skill-choice-panel" id="skillChoicePanel" style="display:none">
      <div class="skill-choice-title" id="skillChoiceTitle">스킬 선택</div>
      <div class="skill-choice-sub" id="skillChoiceSub">아래에서 기술을 선택하세요</div>
      <div id="skillChoiceCards" style="width:100%;display:flex;flex-direction:column;align-items:center;gap:10px;"></div>
    </div>
    <div class="victory-panel" id="victoryPanel" style="display:none">
      <div class="victory-crown">👑</div>
      <div class="victory-title">승리</div>
      <div class="victory-sub" id="victorySub"></div>
      <div class="victory-loot" id="victoryLoot"></div>
    </div>
    <div class="controls">
      <div class="gauge jackpot">
        <div class="gauge-icon">🎉</div>
        <div class="gauge-count" id="gaugeJackpot">0/7</div>
        <div class="gauge-label">대박</div>
      </div>
      <button class="main-btn idle" id="mainBtn">다음날</button>
      <div class="choice-buttons" id="choiceButtons" style="display:none;"></div>
      <div class="gauge mid">
        <div class="gauge-icon">🌀</div>
        <div class="gauge-count" id="gaugeMid">0/12</div>
        <div class="gauge-label">중박</div>
      </div>
    </div>
  </div>
`;

const feedEl = document.getElementById("feed")!;
const bannerOverlay = document.getElementById("bannerOverlay")!;
const bannerText = document.getElementById("bannerText")!;
const splashOverlay = document.getElementById("splashOverlay")!;
const splashTitle = document.getElementById("splashTitle")!;
const minigamePanel = document.getElementById("minigamePanel")!;
const minigameTitle = document.getElementById("minigameTitle")!;
const minigameResult = document.getElementById("minigameResult")!;
const skillChoicePanel = document.getElementById("skillChoicePanel")!;
const skillChoiceTitle = document.getElementById("skillChoiceTitle")!;
const skillChoiceSub = document.getElementById("skillChoiceSub")!;
const skillChoiceCards = document.getElementById("skillChoiceCards")!;
const mainBtn = document.getElementById("mainBtn") as HTMLButtonElement;
const choiceButtons = document.getElementById("choiceButtons")!;
const gaugeJackpotEl = document.getElementById("gaugeJackpot")!;
const gaugeMidEl = document.getElementById("gaugeMid")!;
const victoryPanel = document.getElementById("victoryPanel")!;
const victorySub = document.getElementById("victorySub")!;
const victoryLoot = document.getElementById("victoryLoot")!;

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
  document.getElementById("hpText")!.textContent = `HP ${Math.round(state.hp)}/${Math.round(state.maxHp)}`;
  (document.getElementById("hpFill") as HTMLElement).style.width = `${(state.hp / state.maxHp) * 100}%`;
  const gj = gaugeValue(data, state, "gz_jackpot");
  const gm = gaugeValue(data, state, "gz_mid");
  gaugeJackpotEl.textContent = `${gj.current}/${gj.cap}`;
  gaugeMidEl.textContent = `${gm.current}/${gm.cap}`;
}

function scrollFeedToBottom() {
  feedEl.scrollTop = feedEl.scrollHeight;
}

function ensureDayHeader(day: number) {
  if (day === lastDayShown) return;
  lastDayShown = day;
  const el = document.createElement("div");
  el.className = "day-header";
  el.textContent = `${day}일차`;
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
  const isImpact = opts.grade?.grade_name === "운빨망함" || (opts.effectLines?.some((l) => /-/.test(l)) ?? false);
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

async function runMinigame(minigameId: string) {
  const mg = data.minigames.find((m) => m.minigame_id === minigameId)!;
  await playSplash("BONUS GAME");
  minigamePanel.style.display = "flex";
  minigameTitle.textContent = mg.minigame_name;
  minigameResult.textContent = "돌리는 중...";
  await sleep(900);
  const reward = spinMinigame(data, minigameId);
  if (!reward) {
    minigameResult.textContent = "아무 일도 없었습니다";
  } else {
    const res = applyEffectId(data, state, reward.effect_id);
    minigameResult.textContent = res.lines.join(" · ") || "보상 획득";
  }
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
    "스킬 선택",
    title,
    subtitle,
    candidates.map((s) => ({ badge: s.tier, badgeClass: `tier-${s.tier}`, name: s.skill_name, desc: s.effect_text }))
  );
  return idx === null ? null : candidates[idx];
}

async function grantLevelSkill(mode: "CHOICE_3" | "AUTO", tier: string) {
  if (mode === "CHOICE_3") {
    const candidates = pickSkillChoices(data, state, tier, 3);
    const chosen = await presentSkillChoice("스킬 선택", "아래에서 기술을 선택하세요", candidates);
    if (!chosen) return;
    state.learnedSkills.push(chosen.skill_id);
    await appendCard({ body: `스킬 [${chosen.skill_name}] 학습했습니다. (3택1 중 선택)` });
    return;
  }
  const skill = grantSkillFromTier(data, state, tier === "미확인" ? "미확인" : tier);
  if (!skill) return;
  await appendCard({ body: `스킬 [${skill.skill_name}] 학습했습니다. (자동학습)` });
}

async function resolveCombat(tier: string) {
  mainBtn.textContent = "전투중...";
  mainBtn.className = "main-btn combat";
  await sleep(900);
  const combat = pickCombat(data, tier);
  const gold = combat ? randInt(combat.gold_min, combat.gold_max) : 300;
  const exp = combat ? randInt(combat.exp_min, combat.exp_max) : 60;
  state.gold += gold;
  state.exp += exp;
  await appendCard({ body: "전투 승리", effectLines: [`EXP +${exp}`, `골드 +${gold}`] });
  const lvl = checkLevelUp(data, state);
  if (lvl) {
    await appendCard({ body: `Lv.${lvl.newLevel}로 상승했습니다.` });
    await appendCard({ body: "레벨업 시 HP 회복", effectLines: [`HP +${lvl.hpHealPct}%`] });
    await grantLevelSkill(lvl.skillGrantMode, lvl.skillPoolTier);
  }
  if (combat?.tier === "MINIBOSS") {
    await appendCard({ body: "정예를 처치하고 황금 보물상자를 발견했습니다." });
    const candidates = pickSkillChoices(data, state, "신화", 3);
    const chosen = await presentSkillChoice("획득 성공", "아래에서 기술을 선택하세요", candidates);
    if (chosen) {
      state.learnedSkills.push(chosen.skill_id);
      await appendCard({ body: `스킬 [${chosen.skill_name}] 학습했습니다.` });
    }
  } else if (combat?.tier === "FINALBOSS") {
    const hasRevive = state.learnedSkills.includes("sk_revival");
    if (hasRevive && Math.random() < 0.6) {
      await appendCard({ body: "격전 끝에 체력이 모두 소진되어 쓰러졌습니다..." });
      await sleep(700);
      state.hp = state.maxHp;
      await appendCard({
        body: "신화 스킬 [부활]이 발동하여 체력을 모두 회복하고 다시 일어섰습니다!",
        effectLines: ["HP 100% 회복"],
      });
    }
    const res = applyEffectId(data, state, "e_ancient_succession");
    await appendCard({ body: "수호자를 쓰러뜨려 고대 계승을 획득했습니다.", effectLines: res.lines });
    const candidates = pickSkillChoices(data, state, "전설", 3);
    const chosen = await presentSkillChoice("획득 성공", "아래에서 기술을 선택하세요", candidates);
    if (chosen) {
      state.learnedSkills.push(chosen.skill_id);
      await appendCard({ body: `스킬 [${chosen.skill_name}] 학습했습니다.` });
    }
    state.finalBossDefeated = true;
  }
  combatPending = null;
  if (state.finalBossDefeated) {
    await showVictoryScreen();
  }
}

async function showVictoryScreen() {
  victorySub.textContent = `생존 일수 ${state.day}일 · 최고 여정 ${state.day}일`;
  victoryLoot.innerHTML = `<span class="effect-chip">골드 x${Math.round(state.gold)}</span>`;
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
    await appendCard({ body: `"${label}" 선택`, effectLines: costRes.lines });
  } else {
    await appendCard({ body: `"${label}" 선택` });
  }

  if (prob !== null && prob !== undefined) {
    const success = Math.random() * 100 < prob;
    if (branch.subtype === "BETTING") {
      const mine = fighterNameFromLabel(label);
      const other = fighterNameFromLabel(otherLabel);
      if (success) {
        await appendCard({ body: `${mine}이(가) 정확한 공격으로 ${other}을(를) 쓰러뜨렸습니다. 당신이 베팅에서 이겼습니다.` });
      } else {
        await appendCard({ body: `${other}이(가) ${mine}을(를) 쓰러뜨렸습니다. 당신이 베팅에서 졌습니다.` });
        return;
      }
    } else if (!success) {
      await appendCard({ body: `시도가 실패로 돌아갔습니다. (성공확률 ${prob}%)` });
      return;
    } else {
      await appendCard({ body: `성공했습니다! (성공확률 ${prob}%)` });
    }
  }

  if (!effectId) {
    await appendCard({ body: "조용히 지나갔습니다." });
    return;
  }
  if (effectId.startsWith("COMBAT_TRIGGER")) {
    const tier = effectId.includes(":") ? effectId.split(":")[1] : "NORMAL";
    const text = tier === "FINALBOSS" ? "최후의 결전이 시작됩니다." : "전방에 적이 나타났습니다.";
    await appendCard({ body: text });
    combatPending = { tier };
    await playMovingPhase();
    return;
  }
  if (effectId.startsWith("MINIGAME:")) {
    await runMinigame(effectId.split(":")[1]);
    return;
  }
  const res = applyEffectId(data, state, effectId);
  await appendCard({ body: "보상을 획득했습니다.", effectLines: res.lines });
}

async function showBranchPrompt(branch: BranchDef) {
  const promptBody = textFor(data, branch.text_id);
  await appendCard({ body: promptBody });

  if (branch.subtype === "STAT_CHOICE") {
    const options = [
      {
        name: branch.option_a_label,
        desc: data.effects.find((e) => e.effect_id === branch.option_a_effect_id)?.description ?? "",
      },
      {
        name: branch.option_b_label,
        desc: data.effects.find((e) => e.effect_id === branch.option_b_effect_id)?.description ?? "",
      },
    ];
    const idx = await presentChoicePanel("축복 선택", "천사의 축복", "아래에서 하나를 선택하세요", options);
    if (idx !== null) {
      const label = idx === 0 ? branch.option_a_label : branch.option_b_label;
      const effectId = idx === 0 ? branch.option_a_effect_id : branch.option_b_effect_id;
      const res = applyEffectId(data, state, effectId);
      await appendCard({ body: `"${label}" 선택`, effectLines: res.lines });
    }
    finishTurn();
    return;
  }

  const costPreview = branch.cost_effect_id
    ? data.effects.find((e) => e.effect_id === branch.cost_effect_id)?.description ?? ""
    : "";

  const makeBtn = (label: string, cost: string, prob: number | null, secondary: boolean) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "choice-btn" + (secondary ? " secondary" : "");
    b.innerHTML = `${label}${cost ? `<small>${cost}</small>` : ""}${prob !== null ? `<small>성공확률 ${prob}%</small>` : ""}`;
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
  mainBtn.textContent = "다음날";
  mainBtn.className = "main-btn idle";
  slideIn(mainBtn);
}

function finishTurn() {
  if (combatPending) {
    mainBtn.disabled = false;
    mainBtn.textContent = "전투";
    mainBtn.className = "main-btn combat";
    slideIn(mainBtn);
  } else {
    setIdle();
  }
  refreshStatbar();
}

async function playMovingPhase() {
  mainBtn.disabled = true;
  mainBtn.textContent = "이동 중";
  mainBtn.className = "main-btn combat";
  slideIn(mainBtn);
  await sleep(900);
}

async function resolveDirectReward() {
  const grade = rollGrade(data);
  const entry = rollDailyEntry(data, grade.grade_id);
  if (!entry) {
    await Promise.all([playGradeBanner(grade), appendCard({ body: "특별한 일이 없었습니다.", grade })]);
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
    const text = combat ? textFor(data, combat.text_id) : "적이 나타났습니다.";
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

const HAS_ADVENTURER_BADGE = false;

async function init() {
  data = await loadGameData();
  state = createInitialState(data);
  refreshStatbar();
  await appendCard({
    body: "인간과 마수가 당신의 고향을 습격했습니다. 당신은 유일한 생존자로서 무기를 들고 모험의 여정을 떠나기로 했습니다.",
  });
  ensureDayHeader(1);
  state.day = 1;
  const startTier = HAS_ADVENTURER_BADGE ? "전설" : "일반";
  if (HAS_ADVENTURER_BADGE) {
    await appendCard({ body: "모험가 훈장을 보유하고 있어 스킬 1개를 선택할 수 있습니다." });
  } else {
    await appendCard({ body: "배울 수 있는 스킬 1개를 선택할 수 있습니다." });
  }
  const startCandidates = pickSkillChoices(data, state, startTier, 3);
  const startSkill = await presentSkillChoice("스킬 선택", "아래에서 기술을 선택하세요", startCandidates);
  if (startSkill) {
    state.learnedSkills.push(startSkill.skill_id);
    await appendCard({ body: `스킬 [${startSkill.skill_name}] 학습했습니다.` });
  }
  setIdle();
}

init();
