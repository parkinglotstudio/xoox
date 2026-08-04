/**
 * CapGo식 이동 무대 시뮬 (본게임 ❌ · 키트/착지 포즈 검수).
 * RegionBackdrop 공용 — 캐릭 왼쪽 · 집 오른쪽 대각선 착지.
 */
import { RegionBackdrop } from "../../stage/region/RegionBackdrop";
import type { RegionKitRuntime } from "../../stage/region/types";
import { DEFAULT_KIT_SPEEDS } from "../../stage/region/types";

const bust = `t=${Date.now()}`;
/** 이동 포즈(투명) · 발 피벗으로 땅 위에 세움 */
const ACTOR_URL = `./art/stage/actor/hyanga_idle.png?${bust}`;

function kitUrls(regionId: string): RegionKitRuntime {
  return {
    regionId,
    far: `./art/stage/regions/${regionId}/far.png?${bust}`,
    near: `./art/stage/regions/${regionId}/near.png?${bust}`,
    obj: `./art/stage/regions/${regionId}/obj.png?${bust}`,
    ...DEFAULT_KIT_SPEEDS,
    loopFar: true,
    loopNear: true,
  };
}

const canvas = document.querySelector<HTMLCanvasElement>("#stage")!;
const statusEl = document.querySelector<HTMLElement>("#status")!;
const exportEl = document.querySelector<HTMLElement>("#export")!;
const guideEl = document.getElementById("guide")!;

const backdrop = new RegionBackdrop(canvas, {
  showPlaceholderActor: true,
  clearColor: 0x87b8e0,
  autoTick: true,
});
(window as unknown as { __regionBackdrop: RegionBackdrop }).__regionBackdrop = backdrop;

const state = {
  regionId: "region_ws_01",
  farUrl: "" as string,
  nearUrl: "" as string,
  objUrl: "" as string,
  farObjectUrl: "",
  nearObjectUrl: "",
  simulating: false,
  guideOn: false,
};

function $(id: string): HTMLInputElement {
  return document.getElementById(id) as HTMLInputElement;
}

function setLabel(id: string, text: string): void {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function syncExport(): void {
  const s = backdrop.getSpeeds();
  const L = backdrop.getLandingLayout();
  exportEl.textContent = [
    `# CapGo식 착지 포즈 (시뮬)`,
    `region_id,${state.regionId}`,
    `speed_far,${s.speedFar.toFixed(2)}`,
    `speed_near,${s.speedNear.toFixed(2)}`,
    `actor_x_frac,${L.actorXFrac.toFixed(2)}`,
    `actor_h_frac,${L.actorHFrac.toFixed(2)}`,
    `actor_foot_frac,${L.actorFootFrac.toFixed(2)}`,
    `party_lift,${L.partyLift.toFixed(2)}`,
    `content_x_frac,${L.contentXFrac.toFixed(2)}`,
    `content_y_lift,${L.contentYLift.toFixed(2)}`,
    `content_h_frac,${L.contentHFrac.toFixed(2)}`,
    `# party: lead + pet↑ + pet↓ (.party-move)`,
  ].join("\n");
}

function applyLandingFromSliders(): void {
  backdrop.setLandingLayout({
    actorXFrac: Number($("actorX").value),
    actorHFrac: Number($("actorH").value),
    actorFootFrac: Number($("actorFoot").value),
    partyLift: Number($("partyLift").value),
    contentXFrac: Number($("houseX").value),
    contentYLift: Number($("houseY").value),
    contentHFrac: Number($("houseH").value),
  });
  setLabel("actorXLabel", Number($("actorX").value).toFixed(2));
  setLabel("actorHLabel", Number($("actorH").value).toFixed(2));
  setLabel("actorFootLabel", Number($("actorFoot").value).toFixed(2));
  setLabel("partyLiftLabel", Number($("partyLift").value).toFixed(2));
  setLabel("houseXLabel", Number($("houseX").value).toFixed(2));
  setLabel("houseYLabel", Number($("houseY").value).toFixed(2));
  setLabel("houseHLabel", Number($("houseH").value).toFixed(2));
  syncExport();
  updateGuideMarks();
}

function updateGuideMarks(): void {
  if (!state.guideOn) return;
  const L = backdrop.getLandingLayout();
  // 폰 좌표계: 중앙=50%, xFrac -1~1 → 왼쪽0 오른쪽100
  const actorPctX = 50 + L.actorXFrac * 50;
  const housePctX = 50 + L.contentXFrac * 50;
  const actorPctY = 100 - (L.actorFootFrac + L.partyLift) * 100;
  const housePctY = 100 - (L.actorFootFrac + L.partyLift + L.contentYLift) * 100;
  const markA = document.getElementById("markActor")!;
  const markH = document.getElementById("markHouse")!;
  const labA = document.getElementById("labelActor")!;
  const labH = document.getElementById("labelHouse")!;
  const line = document.getElementById("guideLine")!;
  markA.style.left = `${actorPctX}%`;
  markA.style.top = `${actorPctY}%`;
  markH.style.left = `${housePctX}%`;
  markH.style.top = `${housePctY}%`;
  labA.style.left = `${actorPctX + 2}%`;
  labA.style.top = `${actorPctY - 6}%`;
  labH.style.left = `${housePctX + 2}%`;
  labH.style.top = `${housePctY - 6}%`;
  const x1 = Math.min(actorPctX, housePctX);
  const x2 = Math.max(actorPctX, housePctX);
  const y1 = Math.min(actorPctY, housePctY);
  const y2 = Math.max(actorPctY, housePctY);
  line.style.left = `${x1}%`;
  line.style.top = `${y1}%`;
  line.style.width = `${x2 - x1}%`;
  line.style.height = `${Math.max(2, y2 - y1)}%`;
}

async function applyKit(): Promise<void> {
  statusEl.textContent = "키트 로딩…";
  try {
    const base = kitUrls(state.regionId);
    await backdrop.swapKit({
      ...base,
      far: state.farUrl || base.far,
      near: state.nearUrl || base.near,
      obj: state.objUrl || base.obj,
      speedFar: Number($("speedFar").value),
      speedNear: Number($("speedNear").value),
      speedObj: Number($("speedNear").value),
    });
    applyLandingFromSliders();
    statusEl.textContent = `미리보기 · ${state.regionId}`;
  } catch (e) {
    console.error(e);
    statusEl.textContent = `로드 실패: ${e instanceof Error ? e.message : String(e)}`;
  }
}

function propUrl(): string {
  const id = (document.getElementById("contentProp") as HTMLSelectElement).value;
  return `./art/stage/props/${id}.png?${bust}`;
}

async function playMoveSim(): Promise<void> {
  if (state.simulating) return;
  state.simulating = true;
  const btn = document.getElementById("btnSimPlay") as HTMLButtonElement;
  btn.disabled = true;
  try {
    applyLandingFromSliders();
    // 본편과 동일: 퇴장 → 이동 후반 집 진입 → 끝에서 스크롤·집 동시 착지
    backdrop.dismissContent();
    backdrop.setScrolling(true);
    statusEl.textContent = "이동 중…";
    await sleep(700);
    statusEl.textContent = "이동 중 · 집 진입";
    await backdrop.spawnContent(propUrl(), { approach: true });
    const t0 = performance.now();
    while (backdrop.isContentApproaching() && performance.now() - t0 < 900) {
      await sleep(40);
    }
    backdrop.stopContent();
    backdrop.setScrolling(false);
    statusEl.textContent = "착지 · 집·배경 같이 정지";
    (document.getElementById("btnPlay") as HTMLButtonElement).textContent = "스크롤만 ▶";
  } finally {
    state.simulating = false;
    btn.disabled = false;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => window.setTimeout(r, ms));
}

function onFile(slot: "far" | "near", file: File | undefined): void {
  if (!file) return;
  const key = slot === "far" ? "farObjectUrl" : "nearObjectUrl";
  if (state[key]) URL.revokeObjectURL(state[key]);
  const url = URL.createObjectURL(file);
  state[key] = url;
  if (slot === "far") state.farUrl = url;
  else state.nearUrl = url;
  void applyKit();
}

function bindUi(): void {
  const mapSel = document.getElementById("mapSelect") as HTMLSelectElement;
  mapSel.addEventListener("change", () => {
    state.regionId = mapSel.value;
    state.farUrl = "";
    state.nearUrl = "";
    void applyKit();
  });

  for (const id of ["actorX", "actorH", "actorFoot", "partyLift", "houseX", "houseY", "houseH"]) {
    $(id).addEventListener("input", applyLandingFromSliders);
  }

  $("fileFar").addEventListener("change", (e) => {
    onFile("far", (e.target as HTMLInputElement).files?.[0]);
  });
  $("fileNear").addEventListener("change", (e) => {
    onFile("near", (e.target as HTMLInputElement).files?.[0]);
  });

  const wireSpeed = (id: string, labelId: string, apply: (v: number) => void) => {
    const el = $(id);
    const bump = () => {
      const v = Number(el.value);
      setLabel(labelId, v.toFixed(2));
      apply(v);
      syncExport();
    };
    el.addEventListener("input", bump);
    bump();
  };
  wireSpeed("speedFar", "speedFarLabel", (v) => {
    const s = backdrop.getSpeeds();
    backdrop.setSpeeds(v, s.speedNear, s.speedObj);
  });
  wireSpeed("speedNear", "speedNearLabel", (v) => {
    const s = backdrop.getSpeeds();
    backdrop.setSpeeds(s.speedFar, v, v);
  });
  wireSpeed("globalSpeed", "globalSpeedLabel", (v) => backdrop.setGlobalSpeed(v));

  const syncVis = () => {
    backdrop.setSlotVisible("far", $("visFar").checked);
    backdrop.setSlotVisible("near", $("visNear").checked);
    backdrop.setSlotVisible("obj", $("visObj").checked);
    backdrop.setSlotVisible("content", $("visContent").checked);
    backdrop.setSlotVisible("actor", $("visActor").checked);
  };
  for (const id of ["visFar", "visNear", "visObj", "visContent", "visActor"]) {
    $(id).addEventListener("change", syncVis);
  }

  document.getElementById("btnSimPlay")!.addEventListener("click", () => {
    void playMoveSim();
  });
  document.getElementById("btnSimStop")!.addEventListener("click", () => {
    backdrop.stopContent();
    backdrop.setScrolling(false);
    statusEl.textContent = "강제 착지";
  });
  document.getElementById("btnSimClear")!.addEventListener("click", () => {
    backdrop.clearContent();
    backdrop.setScrolling(false);
    statusEl.textContent = "초기화";
  });
  document.getElementById("btnGuide")!.addEventListener("click", () => {
    state.guideOn = !state.guideOn;
    guideEl.classList.toggle("on", state.guideOn);
    (document.getElementById("btnGuide") as HTMLButtonElement).textContent = state.guideOn
      ? "가이드 OFF"
      : "가이드 ON";
    updateGuideMarks();
  });

  document.getElementById("btnPlay")!.addEventListener("click", () => {
    backdrop.setScrolling(!backdrop.isScrolling());
    (document.getElementById("btnPlay") as HTMLButtonElement).textContent = backdrop.isScrolling()
      ? "스크롤 ⏸"
      : "스크롤만 ▶";
  });

  document.getElementById("btnCopy")!.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(exportEl.textContent || "");
      statusEl.textContent = "값 복사됨";
    } catch {
      statusEl.textContent = "복사 실패 — 텍스트를 직접 복사해 주세요";
    }
  });
}

function onResize(): void {
  const wrap = document.getElementById("stageWrap")!;
  const w = wrap.clientWidth;
  const h = wrap.clientHeight;
  if (w > 0 && h > 0) backdrop.resize(w, h);
  updateGuideMarks();
}

bindUi();
window.addEventListener("resize", onResize);
onResize();

void (async () => {
  backdrop.setScrolling(false);
  // kit OBJ는 희미/빈 장 — 시뮬에선 CONTENT·캐릭만 강조
  $("visObj").checked = false;
  await applyKit();
  try {
    await backdrop.setActorSprite(ACTOR_URL);
    backdrop.setSlotVisible("actor", true);
    backdrop.setSlotVisible("obj", false);
    applyLandingFromSliders();
    onResize();
    statusEl.textContent = "준비됨 · 무대 36% · 캐릭 작음 · 「이동 시뮬」";
  } catch (e) {
    console.warn("[kit] actor sprite 실패", e);
    statusEl.textContent = "캐릭 로드 실패 — 플레이스홀더";
  }
})();
