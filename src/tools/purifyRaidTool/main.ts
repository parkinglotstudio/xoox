/**
 * 정화 습격 프로토 툴 — 총·땅 칠·웨이브 손맛을 여기서 맞춘다.
 *
 * Journey3DTuner는 쓰지 않는다. 그 다이얼은 카메라 튜닝이고, 여기는 습격 수치다.
 * 바닥 아트·섹터는 fpv-tool과 같이 CSV / sector_scale.json 을 읽기만 한다.
 * 저장하면 본편이 나중에 읽을 `data/ui/layout/purify_raid_layout.json` 이 갱신된다.
 */
import { loadCsv, type Row } from "../../csv";
import { pillarForTrigger } from "../../explore";
import { CompassHud } from "../../stage/world3d/CompassHud";
import { JourneyStage3D } from "../../stage/world3d/JourneyStage3D";
import { loadJourney3DConfig, type Journey3DConfig } from "../../stage/world3d/journey3dConfig";
import { PurifyRaid, type RaidHud, type RaidPhase } from "../../stage/world3d/PurifyRaid";
import {
  loadPurifyRaidConfig,
  PURIFY_RAID_DEFAULTS,
  savePurifyRaidConfig,
  type PurifyRaidConfig,
} from "../../stage/world3d/purifyRaidConfig";
import { loadActorSprite } from "../../stage/world3d/spriteSheet";
import { csvRowToWorldProp } from "../../stage/world3d/propFromCsv";
import type { Pillar, WorldNode } from "../../stage/world3d/types";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const canvas = $<HTMLCanvasElement>("raidCanvas");
const miniCanvas = $<HTMLCanvasElement>("miniCanvas");
const statusEl = $<HTMLElement>("status");
const sectorSel = $<HTMLSelectElement>("sectorSel");
const artSel = $<HTMLSelectElement>("artSel");
const dials = $<HTMLElement>("dials");
const banner = $<HTMLElement>("banner");
const hudWave = $<HTMLElement>("hudWave");
const hudTeal = $<HTMLElement>("hudTeal");
const hudCore = $<HTMLElement>("hudCore");
const ammoFill = $<HTMLElement>("ammoFill");

interface SectorScale {
  sectors?: Record<string, { label?: string; map?: string; map_before?: string }>;
}

type NumericKey = {
  [K in keyof PurifyRaidConfig]-?: PurifyRaidConfig[K] extends number ? K : never;
}[keyof PurifyRaidConfig];

interface Dial {
  key: NumericKey;
  label: string;
  min: number;
  max: number;
  step: number;
  digits: number;
  group: string;
}

const DIALS: Dial[] = [
  { key: "gun_range_m", label: "사거리(m)", min: 2, max: 24, step: 0.5, digits: 1, group: "미사일" },
  { key: "gun_spread_deg", label: "착탄 흩어짐(°)", min: 0, max: 24, step: 1, digits: 0, group: "미사일" },
  { key: "gun_ammo_per_sec", label: "초당 발사", min: 0.4, max: 8, step: 0.2, digits: 1, group: "미사일" },
  { key: "gun_ammo_max", label: "탄약 최대", min: 4, max: 60, step: 1, digits: 0, group: "미사일" },
  { key: "gun_regen_on_teal", label: "내 땅 위 재생", min: 0, max: 24, step: 0.5, digits: 1, group: "미사일" },
  { key: "missile_arc_m", label: "포물선 높이(m)", min: 0.4, max: 6, step: 0.1, digits: 1, group: "미사일" },
  { key: "missile_speed_mps", label: "비행 속도(m/s)", min: 4, max: 28, step: 0.5, digits: 1, group: "미사일" },

  { key: "paint_radius_m", label: "데칼 반지름(m)", min: 0.4, max: 4, step: 0.05, digits: 2, group: "땅" },
  { key: "paint_overwrite", label: "청록이 보라를 덮는 세기", min: 0.2, max: 1, step: 0.05, digits: 2, group: "땅" },

  { key: "wave_count", label: "파 수", min: 1, max: 8, step: 1, digits: 0, group: "웨이브" },
  { key: "wave_size", label: "파당 마리", min: 1, max: 20, step: 1, digits: 0, group: "웨이브" },
  { key: "blight_speed_mps", label: "돌진 속도(m/s)", min: 0.6, max: 8, step: 0.1, digits: 1, group: "웨이브" },
  { key: "blight_hits", label: "체력(맞춘 횟수)", min: 1, max: 10, step: 1, digits: 0, group: "웨이브" },

  { key: "core_eat_per_sec", label: "거점 잠기는 속도", min: 0.02, max: 0.6, step: 0.01, digits: 2, group: "거점" },
  { key: "win_teal_pct", label: "승리 청록 %", min: 20, max: 90, step: 1, digits: 0, group: "거점" },
  { key: "warn_sec", label: "예고 초", min: 0.5, max: 10, step: 0.5, digits: 1, group: "거점" },
];

function setStatus(msg: string, kind: "" | "ok" | "err" = "") {
  statusEl.textContent = msg;
  statusEl.classList.toggle("err", kind === "err");
  statusEl.classList.toggle("ok", kind === "ok");
}

let raidCfg: PurifyRaidConfig = { ...PURIFY_RAID_DEFAULTS };
let viewCfg: Journey3DConfig | null = null;
let scale: SectorScale = {};
let npcRows: Row[] = [];
let propRows: Row[] = [];
let areaRows: Row[] = [];
let areaId = "area_i21";
let useAfterArt = false;
let miniBg: HTMLImageElement | null = null;
let lastX = 50;
let lastY = 88;
let lastYaw = 0;

const miniCtx = miniCanvas.getContext("2d")!;
const compass = new CompassHud($("stageFrame"));

const stage = new JourneyStage3D(canvas, {
  onMove: (x, y, yaw) => {
    lastX = x;
    lastY = y;
    lastYaw = yaw;
    compass.setYaw(yaw);
    drawMini();
  },
});
stage.setInputEnabled(true);

let raid: PurifyRaid | null = null;

function floorUrl(): string {
  const s = scale.sectors?.[areaId];
  const url = useAfterArt ? (s?.map ?? s?.map_before) : (s?.map_before ?? s?.map);
  return url ?? `/ui/journey/sector_${areaId.replace("area_", "")}_before.png`;
}

function sectorIds(): string[] {
  const fromCsv = areaRows.filter((r) => scale.sectors?.[r.area_id]).map((r) => r.area_id);
  return fromCsv.length ? fromCsv : Object.keys(scale.sectors ?? { area_i21: {} });
}

function sectorLabel(id: string): string {
  return scale.sectors?.[id]?.label ?? id;
}

function nodesOf(id: string): WorldNode[] {
  return npcRows
    .filter((r) => r.area_id === id && (r.appear_condition || "ALWAYS") === "ALWAYS")
    .map((r) => ({
      id: r.npc_id,
      icon: r.icon || "❔",
      label: r.label || "",
      xPct: Number(r.x_pct) || 50,
      yPct: Number(r.y_pct) || 60,
      pillar: pillarForTrigger(r.trigger_type || "") as Pillar,
    }));
}

async function loadScale(): Promise<SectorScale> {
  try {
    const res = await fetch(`/ui/layout/sector_scale.json?t=${Date.now()}`);
    return res.ok ? ((await res.json()) as SectorScale) : {};
  } catch {
    return {};
  }
}

function loadMiniBg(url: string) {
  const img = new Image();
  img.onload = () => {
    miniBg = img;
    drawMini();
  };
  img.src = url;
}

function visionPct(): number {
  if (!viewCfg) return 20;
  return (viewCfg.fog_vision_m / viewCfg.world_m) * 100;
}

function drawMini() {
  const S = miniCanvas.width;
  miniCtx.clearRect(0, 0, S, S);
  miniCtx.fillStyle = "#070c12";
  miniCtx.fillRect(0, 0, S, S);
  if (miniBg) {
    miniCtx.globalAlpha = 0.75;
    miniCtx.drawImage(miniBg, 0, 0, S, S);
    miniCtx.globalAlpha = 1;
  }

  if (raid) {
    const core = raid.corePct();
    miniCtx.strokeStyle = "rgba(45, 224, 208, 0.85)";
    miniCtx.lineWidth = 2;
    miniCtx.beginPath();
    miniCtx.arc((core.xPct / 100) * S, (core.yPct / 100) * S, 7, 0, Math.PI * 2);
    miniCtx.stroke();

    for (const s of raid.paintSamples()) {
      miniCtx.fillStyle = s.kind === "teal" ? "rgba(45, 224, 208, 0.7)" : "rgba(192, 144, 255, 0.75)";
      miniCtx.beginPath();
      miniCtx.arc((s.xPct / 100) * S, (s.yPct / 100) * S, 2.2, 0, Math.PI * 2);
      miniCtx.fill();
    }
    for (const b of raid.blightDots()) {
      miniCtx.fillStyle = "#c090ff";
      miniCtx.beginPath();
      miniCtx.arc((b.xPct / 100) * S, (b.yPct / 100) * S, 3.2, 0, Math.PI * 2);
      miniCtx.fill();
    }
  }

  const px = (lastX / 100) * S;
  const py = (lastY / 100) * S;
  const r = (visionPct() / 100) * S;
  const g = miniCtx.createRadialGradient(px, py, 0, px, py, r);
  g.addColorStop(0, "rgba(0, 255, 230, 0.28)");
  g.addColorStop(1, "rgba(0, 255, 230, 0)");
  miniCtx.fillStyle = g;
  miniCtx.beginPath();
  miniCtx.arc(px, py, r, 0, Math.PI * 2);
  miniCtx.fill();

  miniCtx.save();
  miniCtx.translate(px, py);
  miniCtx.rotate((lastYaw * Math.PI) / 180);
  miniCtx.fillStyle = "#ffffff";
  miniCtx.beginPath();
  miniCtx.moveTo(0, -9);
  miniCtx.lineTo(6, 6);
  miniCtx.lineTo(-6, 6);
  miniCtx.closePath();
  miniCtx.fill();
  miniCtx.restore();
}

function applyHud(h: RaidHud) {
  if (h.phase === "warn") {
    hudWave.textContent = `예고 ${h.warnLeft.toFixed(1)}초`;
  } else if (h.phase === "fight") {
    hudWave.textContent = `자동 · ${h.alive}기`;
  } else if (h.phase === "won") {
    hudWave.textContent = "승리";
  } else if (h.phase === "lost") {
    hudWave.textContent = "패배";
  } else {
    hudWave.textContent = "대기";
  }
  hudTeal.textContent = `정화 ${h.purified}`;
  hudCore.textContent = `남은 ${h.alive}`;
  ammoFill.style.width = `${Math.round(h.ammo * 100)}%`;
  compass.setMarks(raid?.blightBearings() ?? []);
  drawMini();
}

function showBanner(phase: RaidPhase) {
  banner.classList.remove("on", "warn", "won", "lost");
  if (phase === "fight") {
    banner.textContent = "자동으로 찾아 던진다 · 사거리 10m · 더 가까워도 던진다";
    banner.classList.add("on", "warn");
    window.setTimeout(() => banner.classList.remove("on"), 1600);
  } else if (phase === "warn") {
    banner.textContent = "오염이 온다";
    banner.classList.add("on", "warn");
    window.setTimeout(() => {
      if (raid?.getHud().phase === "warn") banner.classList.remove("on");
    }, 900);
  } else if (phase === "won") {
    banner.textContent = "정화 성공";
    banner.classList.add("on", "won");
  } else if (phase === "lost") {
    banner.textContent = "거점이 잠겼다";
    banner.classList.add("on", "lost");
  }
}

function attachRaid() {
  raid?.dispose();
  raid = new PurifyRaid(
    stage,
    {
      onHud: applyHud,
      onPhase: showBanner,
    },
    raidCfg,
    { mode: "stillHunt" },
  );
  applyHud(raid.getHud());
}

async function applySector(id: string) {
  areaId = id;
  const url = floorUrl();
  const nodes = nodesOf(id);
  try {
    await stage.setFloor(url, { polluted: !useAfterArt });
    stage.setNodes(nodes);
    if (viewCfg) {
      stage.setNodeHeightMul(viewCfg.node_height_mul);
      stage.setProps(
        propRows.filter((r) => r.area_id === id).map((r) => csvRowToWorldProp(r)),
      );
    }
    stage.setPlayer(50, 88, 0);
    lastX = 50;
    lastY = 88;
    lastYaw = 0;
    compass.setYaw(0);
    loadMiniBg(url);
    attachRaid();
    setStatus(`${sectorLabel(id)} · 습격 대기`, "ok");
  } catch {
    setStatus(`바닥 아트 로드 실패: ${url}`, "err");
  }
}

function renderDials() {
  const groups = [...new Set(DIALS.map((d) => d.group))];
  dials.innerHTML = groups
    .map((g) => {
      const rows = DIALS.filter((d) => d.group === g)
        .map((d) => {
          const v = raidCfg[d.key];
          return `<div class="raid-row">
            <label for="raid_${d.key}">${d.label} <b data-out="${d.key}">${v.toFixed(d.digits)}</b></label>
            <input id="raid_${d.key}" type="range" data-key="${d.key}"
                   min="${d.min}" max="${d.max}" step="${d.step}" value="${v}" />
          </div>`;
        })
        .join("");
      return `<h2>${g}</h2>${rows}`;
    })
    .join("");

  for (const d of DIALS) {
    const el = dials.querySelector<HTMLInputElement>(`[data-key="${d.key}"]`);
    if (!el) continue;
    const read = () => {
      const v = Number(el.value);
      raidCfg[d.key] = v;
      const out = dials.querySelector<HTMLElement>(`[data-out="${d.key}"]`);
      if (out) out.textContent = v.toFixed(d.digits);
      raid?.applyConfig(raidCfg);
    };
    el.addEventListener("input", read);
    el.addEventListener("change", read);
  }
}

function syncDials() {
  for (const d of DIALS) {
    const el = dials.querySelector<HTMLInputElement>(`[data-key="${d.key}"]`);
    if (!el) continue;
    el.value = String(raidCfg[d.key]);
    const out = dials.querySelector<HTMLElement>(`[data-out="${d.key}"]`);
    if (out) out.textContent = raidCfg[d.key].toFixed(d.digits);
  }
}

function resize() {
  const r = canvas.getBoundingClientRect();
  if (r.width > 0 && r.height > 0) {
    stage.resize(Math.round(r.width), Math.round(r.height));
  }
}

async function boot() {
  const [cfg, view, sc, npc, props, area] = await Promise.all([
    loadPurifyRaidConfig(),
    loadJourney3DConfig(),
    loadScale(),
    loadCsv("area_npc_config"),
    loadCsv("area_prop_config"),
    loadCsv("area_config"),
  ]);
  raidCfg = cfg;
  viewCfg = view;
  scale = sc;
  npcRows = npc;
  propRows = props;
  areaRows = area;

  stage.applyConfig(view);
  stage.setTurnMode("turn");
  const sprite = await loadActorSprite("wanderer", "/ui/lobby/lobby_actor_idle.png");
  await stage.setPlayerSprite(sprite);

  renderDials();

  sectorSel.innerHTML = sectorIds()
    .map(
      (id) =>
        `<option value="${id}"${id === areaId ? " selected" : ""}>${sectorLabel(id)} (${id})</option>`,
    )
    .join("");

  sectorSel.addEventListener("change", () => void applySector(sectorSel.value));
  artSel.addEventListener("change", () => {
    useAfterArt = artSel.value === "after";
    void applySector(areaId);
  });
  $("btnStart").addEventListener("click", () => {
    stage.setPlayer(50, 88, 0);
    lastX = 50;
    lastY = 88;
    lastYaw = 0;
    compass.setYaw(0);
    raid?.start();
    setStatus("찾기 · 제자리 오염");
  });
  $("btnReset").addEventListener("click", () => {
    raid?.reset();
    banner.classList.remove("on", "warn", "won", "lost");
    stage.setPlayer(50, 88, 0);
    lastX = 50;
    lastY = 88;
    lastYaw = 0;
    compass.setYaw(0);
    applyHud(raid?.getHud() ?? {
      phase: "idle",
      warnLeft: 0,
      wave: 0,
      waves: raidCfg.wave_count,
      alive: 0,
      core: 0,
      tealPct: 0,
      ammo: 1,
      purified: 0,
      firing: false,
    });
    setStatus("리셋");
  });
  $("btnDefaults").addEventListener("click", () => {
    raidCfg = { ...PURIFY_RAID_DEFAULTS };
    syncDials();
    raid?.applyConfig(raidCfg);
    setStatus("기본값 · 저장하지 않으면 반영되지 않는다");
  });
  $("btnSave").addEventListener("click", async () => {
    const res = await savePurifyRaidConfig(raidCfg);
    setStatus(res.message, res.ok ? "ok" : "err");
  });

  window.addEventListener("resize", resize);
  new ResizeObserver(resize).observe($("stageFrame"));

  const fireBtn = $<HTMLButtonElement>("btnFire");
  const fireOn = (on: boolean) => {
    raid?.setFiring(on);
    fireBtn.classList.toggle("on", on);
  };
  const hold = (e: PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fireBtn.setPointerCapture(e.pointerId);
    fireOn(true);
  };
  const release = (e: PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fireOn(false);
  };
  fireBtn.addEventListener("pointerdown", hold);
  fireBtn.addEventListener("pointerup", release);
  fireBtn.addEventListener("pointercancel", release);
  fireBtn.addEventListener("lostpointercapture", () => fireOn(false));
  fireBtn.addEventListener("contextmenu", (e) => e.preventDefault());


  await applySector(areaId);
  resize();
}

void boot();
