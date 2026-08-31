/**
 * 정화 스킬 프로토 툴 — 모은다→캐스팅→멈춤→벌레→다시 모은다
 */
import { loadCsv, type Row } from "../../csv";
import { JourneyStage3D } from "../../stage/world3d/JourneyStage3D";
import { loadJourney3DConfig } from "../../stage/world3d/journey3dConfig";
import { loadRaidTables } from "../../stage/world3d/raidTables";
import { loadActorSprite } from "../../stage/world3d/spriteSheet";
import { ProtoLoop, type ProtoHud, type ProtoPhase, type SkillId } from "./ProtoLoop";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const canvas = $<HTMLCanvasElement>("protoCanvas");
const statusEl = $<HTMLElement>("status");
const banner = $<HTMLElement>("banner");
const hudPhase = $<HTMLElement>("hudPhase");
const hudSkill = $<HTMLElement>("hudSkill");
const hudTarget = $<HTMLElement>("hudTarget");
const gaugeLabel = $<HTMLElement>("gaugeLabel");
const gaugeVal = $<HTMLElement>("gaugeVal");
const gaugeFill = $<HTMLElement>("gaugeFill");
const btnFire = $<HTMLButtonElement>("btnFire");
const btnStart = $<HTMLButtonElement>("btnStart");
const btnBugs = $<HTMLButtonElement>("btnBugs");
const btnCulprit = $<HTMLButtonElement>("btnCulprit");
const btnReset = $<HTMLButtonElement>("btnReset");
const steps = $<HTMLElement>("steps");

interface SectorScale {
  sectors?: Record<string, { label?: string; map?: string; map_before?: string }>;
}

const SKILL_LABEL: Record<SkillId, string> = {
  basic: "기본",
  multi: "다연발",
  boom: "대폭발",
  chain: "연쇄",
};

const PHASE_LABEL: Record<ProtoPhase, string> = {
  idle: "대기",
  gather: "발사체 수집",
  casting: "정화 시도 중",
  purify: "띠 · 시간 압박",
  bugs: "벌레 퇴치",
  culprit: "원흉",
  need_cast: "최종 캐스팅 대기",
  done: "클리어",
};

function setStatus(msg: string, kind: "" | "ok" | "err" = "") {
  statusEl.textContent = msg;
  statusEl.classList.toggle("err", kind === "err");
  statusEl.classList.toggle("ok", kind === "ok");
}

function showBanner(text: string, kind: "warn" | "ok" = "warn") {
  if (!text) {
    banner.classList.remove("on", "warn", "ok");
    banner.textContent = "";
    return;
  }
  banner.textContent = text;
  banner.classList.remove("warn", "ok");
  banner.classList.add("on", kind);
  window.setTimeout(() => banner.classList.remove("on"), 1800);
}

function applyHud(h: ProtoHud) {
  hudPhase.textContent = PHASE_LABEL[h.phase];
  hudSkill.textContent = `스킬 · ${SKILL_LABEL[h.skill]}`;
  hudTarget.textContent = h.targetLabel;

  const ammoEl = $("hudAmmo");
  if (ammoEl) {
    ammoEl.textContent = `탄 ${h.ammo ?? 0}`;
    ammoEl.classList.toggle("low", (h.ammo ?? 0) < 10);
  }

  const box = $("gaugeBox");
  const showGauge =
    h.phase !== "idle" && h.phase !== "done" && h.phase !== "gather" && h.phase !== "need_cast";
  box.style.display = showGauge ? "grid" : "none";
  box.classList.toggle("urgent", h.urgency === 1);
  box.classList.toggle("critical", h.urgency === 2);

  const polluteRow = $("polluteRow");
  const stopRow = $("stopRow");
  const castRow = $("castRow");
  const gauge = h.combatGauge ?? "none";

  castRow.style.display = gauge === "cast" ? "block" : "none";
  polluteRow.style.display = h.phase === "purify" && (gauge === "stop" || gauge === "bugs") ? "block" : "none";
  stopRow.style.display = gauge === "stop" || gauge === "bugs" || gauge === "culprit" ? "block" : "none";

  if (gauge === "cast") {
    $("castVal").textContent = `${Math.round(h.castPct * 100)}%`;
    $("castFill").style.transform = `scaleX(${h.castPct})`;
  } else if (gauge === "stop") {
    const pct = Math.round((h.pollutionPct ?? 0) * 100);
    const left = Math.max(0, Math.floor(h.shrinkLeftSec ?? 0));
    const m = Math.floor(left / 60);
    const s = left % 60;
    const urg = h.urgency === 2 ? " · 위험!" : h.urgency === 1 ? " · 서두르세요" : "";
    $("polluteVal").textContent = `${pct}% · ${m}:${String(s).padStart(2, "0")}${urg}`;
    $("polluteFill").style.transform = `scaleX(${h.pollutionPct ?? 0})`;
    gaugeLabel.textContent = "동쪽 멈춤";
    gaugeVal.textContent = `${h.gaugeLeft} / ${h.gaugeMax}`;
    gaugeFill.style.transform = `scaleX(${h.gaugeMax ? h.gaugeLeft / h.gaugeMax : 0})`;
  } else if (gauge === "bugs") {
    if (h.phase === "purify") {
      const pct = Math.round((h.pollutionPct ?? 0) * 100);
      const left = Math.max(0, Math.floor(h.shrinkLeftSec ?? 0));
      const m = Math.floor(left / 60);
      const s = left % 60;
      $("polluteVal").textContent = `${pct}% · ${m}:${String(s).padStart(2, "0")}`;
      $("polluteFill").style.transform = `scaleX(${h.pollutionPct ?? 0})`;
    }
    gaugeLabel.textContent = "벌레";
    gaugeVal.textContent = `${h.bugsAlive} / ${h.bugsTotal}`;
    gaugeFill.style.transform = `scaleX(${h.bugsTotal ? h.bugsAlive / h.bugsTotal : 0})`;
  } else if (gauge === "culprit") {
    gaugeLabel.textContent = "원흉 HP";
    gaugeVal.textContent = `${h.culpritHp} / ${h.culpritMax}`;
    gaugeFill.style.transform = `scaleX(${h.culpritMax ? h.culpritHp / h.culpritMax : 0})`;
  }

  const canFire =
    h.phase === "purify" || h.phase === "bugs" || h.phase === "culprit";
  btnFire.disabled = !canFire || (h.ammo ?? 0) <= 0;
  btnBugs.disabled = h.phase === "idle" || h.phase === "casting";
  btnCulprit.disabled = h.phase === "idle" || h.phase === "casting" || h.phase === "gather";

  const btnCast2 = $("btnCast2") as HTMLButtonElement | null;
  const btnCast3 = $("btnCast3") as HTMLButtonElement | null;
  const btnFinal = $("btnFinalCast") as HTMLButtonElement | null;
  if (btnCast2) btnCast2.disabled = !(h.phase === "gather" || h.phase === "idle");
  if (btnCast3) btnCast3.disabled = !(h.phase === "gather" || h.phase === "idle");
  if (btnFinal) btnFinal.disabled = h.phase !== "need_cast";

  for (const el of steps.querySelectorAll<HTMLElement>("[data-step]")) {
    const step = el.dataset.step!;
    el.classList.toggle(
      "on",
      h.phase === step ||
        (step === "gather" && (h.phase === "gather" || h.phase === "need_cast")) ||
        (step === "purify" && (h.phase === "casting" || h.phase === "purify")),
    );
    el.classList.toggle(
      "done",
      (step === "gather" &&
        (h.phase === "casting" ||
          h.phase === "purify" ||
          h.phase === "bugs" ||
          h.phase === "culprit" ||
          h.phase === "done")) ||
        (step === "purify" &&
          (h.phase === "bugs" || h.phase === "culprit" || h.phase === "need_cast" || h.phase === "done")) ||
        (step === "bugs" &&
          (h.phase === "culprit" || h.phase === "need_cast" || h.phase === "done" || h.phase === "gather")) ||
        (step === "culprit" && (h.phase === "need_cast" || h.phase === "done")),
    );
  }
}

const stage = new JourneyStage3D(canvas, {});
stage.setInputEnabled(true);

let loop: ProtoLoop | null = null;

function selectSkill(id: SkillId) {
  loop?.setSkill(id);
  for (const btn of document.querySelectorAll<HTMLButtonElement>(".skill")) {
    btn.classList.toggle("on", btn.dataset.skill === id);
  }
  setStatus(`스킬 · ${SKILL_LABEL[id]}`, "ok");
}

async function boot() {
  setStatus("로딩…");
  try {
    const [scale, viewCfg, tables, areaRows] = await Promise.all([
      fetch(`/ui/layout/sector_scale.json?t=${Date.now()}`)
        .then((r) => (r.ok ? (r.json() as Promise<SectorScale>) : ({} as SectorScale)))
        .catch(() => ({} as SectorScale)),
      loadJourney3DConfig(),
      loadRaidTables(),
      loadCsv("area_config").catch(() => [] as Row[]),
    ]);

    const areaId =
      areaRows.find((r) => r.area_id === "area_i21")?.area_id ??
      Object.keys(scale.sectors ?? {})[0] ??
      "area_i21";
    const sec = scale.sectors?.[areaId];
    const floor = sec?.map_before ?? sec?.map ?? `/ui/journey/sector_i21_before.png`;

    await stage.setFloor(floor, { polluted: true });
    if (viewCfg) {
      stage.applyConfig(viewCfg);
      stage.setNodeHeightMul(viewCfg.node_height_mul);
    }
    try {
      const sprite = await loadActorSprite("wanderer", "/ui/lobby/lobby_actor_idle.png");
      await stage.setPlayerSprite(sprite);
    } catch {
      /* optional */
    }
    stage.setPlayer(50, 72, 0);

    loop = new ProtoLoop(
      stage,
      {
        onHud: applyHud,
        onBanner: showBanner,
        onPhase: (p) => setStatus(PHASE_LABEL[p], p === "done" ? "ok" : ""),
      },
      tables,
    );
    applyHud({
      phase: "idle",
      skill: "basic",
      tintStep: 1,
      castPct: 0,
      gaugeMax: 6,
      gaugeLeft: 6,
      pollutionPct: 0,
      shrinkLeftSec: 180,
      waveIn: 0,
      bugsAlive: 0,
      bugsTotal: 12,
      culpritHp: 20,
      culpritMax: 20,
      combatGauge: "none",
      ammo: 14,
      urgency: 0,
      nextCastReady: true,
      targetLabel: "—",
    });
    setStatus("들판 · 모은다 → 캐스팅 정화", "ok");
  } catch (e) {
    setStatus(`로드 실패: ${e instanceof Error ? e.message : String(e)}`, "err");
  }
}

btnStart.addEventListener("click", () => {
  loop?.beginGather();
  setStatus("발사체 수집", "ok");
});
$("btnCast1")?.addEventListener("click", () => {
  loop?.startCast(1);
  setStatus("1차 정화 시도", "ok");
});
btnBugs.addEventListener("click", () => {
  loop?.startBugs();
  setStatus("벌레", "ok");
});
btnCulprit.addEventListener("click", () => {
  loop?.startCulprit();
  setStatus("원흉", "ok");
});
$("btnCast2")?.addEventListener("click", () => {
  loop?.startCast(2);
  setStatus("2차 정화 시도", "ok");
});
$("btnCast3")?.addEventListener("click", () => {
  loop?.startCast(3);
  setStatus("3차 정화 시도", "ok");
});
$("btnFinalCast")?.addEventListener("click", () => {
  loop?.beginFinalCast();
  setStatus("최종 정화 캐스팅", "ok");
});
btnReset.addEventListener("click", () => {
  loop?.reset();
  setStatus("리셋", "ok");
});

for (const btn of document.querySelectorAll<HTMLButtonElement>(".skill")) {
  btn.addEventListener("click", () => {
    const id = btn.dataset.skill as SkillId;
    selectSkill(id);
    const p = loop?.getPhase();
    if (p === "purify" || p === "bugs" || p === "culprit") loop?.fireOnce();
  });
}

btnFire.addEventListener("pointerdown", () => {
  loop?.setFiring(true);
  loop?.fireOnce();
});
btnFire.addEventListener("pointerup", () => loop?.setFiring(false));
btnFire.addEventListener("pointerleave", () => loop?.setFiring(false));

window.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    loop?.fireOnce();
  }
  if (e.key === "1") selectSkill("basic");
  if (e.key === "2") selectSkill("multi");
  if (e.key === "3") selectSkill("boom");
  if (e.key === "4") selectSkill("chain");
});

void boot();
