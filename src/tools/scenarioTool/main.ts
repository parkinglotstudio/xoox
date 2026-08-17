/**
 * 시나리오 체인 툴 (본게임 ❌ · 저작·검증용).
 *
 * 기획 SSoT: docs/gdd/38_시나리오_작성룰.md
 *   규칙1 하루 = 노드 하나
 *   규칙2 사건은 날짜가 아니라 노드에 붙는다
 *   규칙3 사건은 체인으로 쓴다 (발단 → 조사 → 해결(A|B) → 귀환)
 *   규칙4 되돌아가는 것도 하루다
 *   규칙5 노드는 항상 존재, 정체만 조건부 공개
 *
 * 연출·전투 연산·보상 수치는 **일부러 뺐다.** 걸음 순서가 말이 되는지만 본다.
 * 애니메이션 규칙(rAF 금지)은 이 툴엔 해당 없음 — 애니메이션 자체가 없다.
 */
import { loadCsv, type Row } from "../../csv";
import { buildPreset } from "./preset";
import {
  buildSectors,
  enumerateRoutes,
  thresholdsReached,
  PURIFY_THRESHOLDS,
  DAY_BUDGET,
  type RouteOption,
  type SectorInfo,
} from "./journey";

// ── 모델 ────────────────────────────────────────────────────────────────

type StepKind = "발단" | "조사" | "해결" | "귀환" | "자유";

const STEP_KINDS: StepKind[] = ["발단", "조사", "해결", "귀환", "자유"];

/** 각 단계가 기본으로 하는 일 — 편집기 안내문 */
const KIND_HINT: Record<StepKind, string> = {
  발단: "오염·문제를 발견한다. 아직 못 고친다.",
  조사: "주변을 찾아본다. 단서 둘을 동시에 연다(갈림길의 근거).",
  해결: "고른 쪽으로 가서 처리한다. 여기서 열쇠를 얻는다.",
  귀환: "발단 지점으로 되돌아가 적용한다. = 정화(운반).",
  자유: "체인에 속하지 않는 낱개 걸음(구조 조우·기억·관문 등).",
};

interface Step {
  kind: StepKind;
  nodeId: string;
  /** 해결 단계의 B 갈래. 비어 있으면 갈림길 없음 */
  nodeIdB: string;
  labelA: string;
  labelB: string;
  /** 이 걸음에서 얻는 것 (열쇠 id 또는 자유 텍스트) */
  gives: string;
  /** 이 걸음에 필요한 것 */
  needs: string;
}

interface Chain {
  id: string;
  areaId: string;
  title: string;
  steps: Step[];
}

interface NodeDef {
  npc_id: string;
  area_id: string;
  x_pct: number;
  y_pct: number;
  icon: string;
  label: string;
  trigger_type: string;
  flavor_text: string;
}

interface AreaDef {
  area_id: string;
  display_name: string;
}

// ── 상태 ────────────────────────────────────────────────────────────────

const SAVE_KEY = "xoox.scenarioTool.v1";

let areas: AreaDef[] = [];
let nodes: NodeDef[] = [];
let chains: Chain[] = [];
let sectors: SectorInfo[] = [];
let routes: RouteOption[] = [];
let totalBlights = 0;
let currentAreaId = "";
let selectedChainId = "";
let outMode: "chain" | "step" | "beat" = "chain";

// ── DOM ─────────────────────────────────────────────────────────────────

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

const areaSelect = $<HTMLSelectElement>("areaSelect");
const areaStats = $("areaStats");
const loadHint = $("loadHint");
const chainList = $("chainList");
const chainEditor = $("chainEditor");
const checksEl = $("checks");
const simHud = $("simHud");
const simLog = $("simLog");
const simChoice = $("simChoice");
const outBox = $("outBox");

// ── 유틸 ────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] ?? c));
}

/** CSV 셀 이스케이프 — 쉼표/따옴표가 있으면 감싼다 */
function csvCell(s: string): string {
  const v = s ?? "";
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

function areaNodes(areaId: string): NodeDef[] {
  // y가 클수록 아래(시작) — 진행 순서는 y 내림차순
  return nodes.filter((n) => n.area_id === areaId).sort((a, b) => b.y_pct - a.y_pct);
}

function nodeById(id: string): NodeDef | undefined {
  return nodes.find((n) => n.npc_id === id);
}

function nodeLabel(id: string): string {
  const n = nodeById(id);
  if (!n) return id || "(미배정)";
  return `${n.icon} ${n.label}`;
}

function areaChains(areaId: string): Chain[] {
  return chains.filter((c) => c.areaId === areaId);
}

function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ chains, currentAreaId }));
  } catch {
    /* 저장 실패는 무시 — 작업은 계속된다 */
  }
}

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as { chains?: Chain[]; currentAreaId?: string };
    if (Array.isArray(parsed.chains)) chains = parsed.chains;
    if (parsed.currentAreaId) currentAreaId = parsed.currentAreaId;
  } catch {
    /* 깨진 저장본은 버린다 */
  }
}

function newStep(kind: StepKind): Step {
  return { kind, nodeId: "", nodeIdB: "", labelA: "", labelB: "", gives: "", needs: "" };
}

function makeChain(areaId: string): Chain {
  const n = areaChains(areaId).length + 1;
  return {
    id: `ch_${areaId.replace(/^area_/, "")}_${String(n).padStart(2, "0")}`,
    areaId,
    title: `체인 ${n}`,
    steps: [newStep("발단"), newStep("조사"), newStep("해결"), newStep("귀환")],
  };
}

// ── 렌더: 구역 ──────────────────────────────────────────────────────────

function renderAreaStats() {
  const list = areaNodes(currentAreaId);
  const cs = areaChains(currentAreaId);
  // 밟는 칸 = 걸음 수(갈림길은 한쪽만 밟음) · 소비 노드 = 배정된 노드 총수
  const walked = cs.reduce((s, c) => s + c.steps.length, 0);
  const used = new Set<string>();
  cs.forEach((c) =>
    c.steps.forEach((s) => {
      if (s.nodeId) used.add(s.nodeId);
      if (s.nodeIdB) used.add(s.nodeIdB);
    })
  );
  areaStats.innerHTML = [
    { n: list.length, l: "배치된 노드" },
    { n: cs.length, l: "체인" },
    { n: walked, l: "밟는 칸(=일수)" },
    { n: used.size, l: "쓰인 노드" },
    { n: Math.max(0, list.length - used.size), l: "남은 노드" },
  ]
    .map((s) => `<div class="stat"><div class="n">${s.n}</div><div class="l">${s.l}</div></div>`)
    .join("");
}

// ── 렌더: 체인 목록 ─────────────────────────────────────────────────────

function renderChainList() {
  const cs = areaChains(currentAreaId);
  if (!cs.length) {
    chainList.innerHTML = `<div class="hint" style="margin:0">아직 체인이 없습니다. 아래 「체인 추가」를 누르세요.</div>`;
    return;
  }
  chainList.innerHTML = cs
    .map(
      (c) => `
      <div class="chain-item${c.id === selectedChainId ? " on" : ""}" data-chain="${esc(c.id)}">
        <span>${esc(c.title)}</span>
        <span class="cid">${esc(c.id)}</span>
        <span class="steps">${c.steps.length}걸음</span>
      </div>`
    )
    .join("");
  chainList.querySelectorAll<HTMLElement>(".chain-item").forEach((el) => {
    el.addEventListener("click", () => {
      selectedChainId = el.dataset.chain ?? "";
      renderAll();
    });
  });
}

// ── 렌더: 걸음 편집 ─────────────────────────────────────────────────────

function nodeOptions(selected: string): string {
  const list = areaNodes(currentAreaId);
  const opts = list
    .map(
      (n) =>
        `<option value="${esc(n.npc_id)}"${n.npc_id === selected ? " selected" : ""}>${esc(
          `${n.icon} ${n.label} · ${n.trigger_type}`
        )}</option>`
    )
    .join("");
  return `<option value=""${selected ? "" : " selected"}>— 미배정 —</option>${opts}`;
}

function renderEditor() {
  const chain = chains.find((c) => c.id === selectedChainId);
  if (!chain) {
    chainEditor.innerHTML = `<div class="hint" style="margin:0">위에서 체인을 고르면 걸음을 편집합니다.</div>`;
    return;
  }

  const head = `
    <label>체인 제목
      <input type="text" id="chTitle" value="${esc(chain.title)}" />
    </label>
    <label>체인 ID
      <input type="text" id="chId" value="${esc(chain.id)}" />
    </label>`;

  const steps = chain.steps
    .map((s, i) => {
      const fork =
        s.kind === "해결"
          ? `<div class="fork-box">
               <div class="ft">갈림길 (비우면 단일 경로)</div>
               <label>A 선택지 문구
                 <input type="text" data-f="labelA" data-i="${i}" value="${esc(s.labelA)}" placeholder="곰의 소행을 쫓는다" />
               </label>
               <label>B 노드
                 <select data-f="nodeIdB" data-i="${i}">${nodeOptions(s.nodeIdB)}</select>
               </label>
               <label>B 선택지 문구
                 <input type="text" data-f="labelB" data-i="${i}" value="${esc(s.labelB)}" placeholder="호랑이의 소행을 쫓는다" />
               </label>
             </div>`
          : "";

      return `
      <div class="step-row">
        <div class="step-head">
          <span class="no">${i + 1}</span>
          <select class="kind" data-f="kind" data-i="${i}">
            ${STEP_KINDS.map((k) => `<option value="${k}"${k === s.kind ? " selected" : ""}>${k}</option>`).join("")}
          </select>
          <span class="sp">
            <button type="button" class="ghost" data-act="up" data-i="${i}">▲</button>
            <button type="button" class="ghost" data-act="down" data-i="${i}">▼</button>
            <button type="button" class="danger" data-act="del" data-i="${i}">✕</button>
          </span>
        </div>
        <div class="hint" style="margin-top:5px">${esc(KIND_HINT[s.kind])}</div>
        <label>${s.kind === "해결" ? "A 노드" : "노드"}
          <select data-f="nodeId" data-i="${i}">${nodeOptions(s.nodeId)}</select>
        </label>
        ${fork}
        <div class="two">
          <label>얻는 것 (열쇠)
            <input type="text" data-f="gives" data-i="${i}" value="${esc(s.gives)}" placeholder="곰의 이빨" />
          </label>
          <label>필요한 것
            <input type="text" data-f="needs" data-i="${i}" value="${esc(s.needs)}" placeholder="곰의 이빨" />
          </label>
        </div>
      </div>`;
    })
    .join("");

  chainEditor.innerHTML = `${head}${steps}
    <div class="btns">
      <button type="button" id="btnAddStep">+ 걸음 추가</button>
      <button type="button" class="danger" id="btnDelChain">이 체인 삭제</button>
    </div>`;

  // 제목 / ID
  $<HTMLInputElement>("chTitle").addEventListener("input", (e) => {
    chain.title = (e.target as HTMLInputElement).value;
    save();
    renderChainList();
    renderOut();
  });
  $<HTMLInputElement>("chId").addEventListener("change", (e) => {
    const v = (e.target as HTMLInputElement).value.trim();
    if (!v) return;
    chain.id = v;
    selectedChainId = v;
    save();
    renderAll();
  });

  // 필드 편집
  chainEditor.querySelectorAll<HTMLElement>("[data-f]").forEach((el) => {
    const evt = el.tagName === "SELECT" ? "change" : "input";
    el.addEventListener(evt, () => {
      const i = Number((el as HTMLElement).dataset.i);
      const f = (el as HTMLElement).dataset.f as keyof Step;
      const step = chain.steps[i];
      if (!step) return;
      const val = (el as HTMLInputElement | HTMLSelectElement).value;
      (step[f] as string) = val;
      save();
      if (f === "kind") renderAll();
      else {
        renderAreaStats();
        renderChecks();
        renderOut();
      }
    });
  });

  // 걸음 순서 / 삭제
  chainEditor.querySelectorAll<HTMLElement>("[data-act]").forEach((el) => {
    el.addEventListener("click", () => {
      const i = Number(el.dataset.i);
      const act = el.dataset.act;
      if (act === "del") chain.steps.splice(i, 1);
      else if (act === "up" && i > 0) {
        const [s] = chain.steps.splice(i, 1);
        if (s) chain.steps.splice(i - 1, 0, s);
      } else if (act === "down" && i < chain.steps.length - 1) {
        const [s] = chain.steps.splice(i, 1);
        if (s) chain.steps.splice(i + 1, 0, s);
      }
      save();
      renderAll();
    });
  });

  $("btnAddStep").addEventListener("click", () => {
    chain.steps.push(newStep("자유"));
    save();
    renderAll();
  });
  $("btnDelChain").addEventListener("click", () => {
    chains = chains.filter((c) => c.id !== chain.id);
    selectedChainId = "";
    save();
    renderAll();
  });
}

// ── 검증 ────────────────────────────────────────────────────────────────

interface Check {
  level: "ok" | "warn" | "bad";
  text: string;
}

function runChecks(): Check[] {
  const out: Check[] = [];
  const cs = areaChains(currentAreaId);
  const list = areaNodes(currentAreaId);

  if (!cs.length) {
    out.push({ level: "warn", text: "이 구역에 체인이 없습니다. 체인을 하나 만들면 검증이 시작됩니다." });
    return out;
  }

  // 규칙 1 — 수량
  const walked = cs.reduce((s, c) => s + c.steps.length, 0);
  /** 갈림길 하나당 안 밟는 칸 하나 */
  const forks = cs.reduce((s, c) => s + c.steps.filter((st) => st.kind === "해결" && st.nodeIdB).length, 0);
  const used = new Set<string>();
  const dup: string[] = [];
  cs.forEach((c) => {
    const startNode = c.steps.find((s) => s.kind === "발단")?.nodeId ?? "";
    c.steps.forEach((s) => {
      // 규칙4 — 귀환은 발단 자리로 되돌아간다. 의도된 재방문이므로 중복이 아니다.
      const isPlannedReturn = s.kind === "귀환" && !!startNode && s.nodeId === startNode;
      [isPlannedReturn ? "" : s.nodeId, s.nodeIdB].forEach((id) => {
        if (!id) return;
        if (used.has(id)) dup.push(id);
        used.add(id);
      });
    });
  });

  out.push({
    level: used.size <= list.length ? "ok" : "bad",
    text: `<b>규칙1 수량</b> — 배치 ${list.length}개 중 ${used.size}개 사용, ${walked}걸음(=${walked}일). ${
      forks > 0 ? `갈림길 ${forks}개 → 가지 않은 길 ${forks}칸.` : "갈림길 없음 — 가지 않은 길이 생기지 않습니다."
    }`,
  });

  if (used.size > list.length) {
    out.push({ level: "bad", text: `<b>노드 부족</b> — 배치된 노드보다 많이 쓰고 있습니다. <code>area_npc_config.csv</code>에 노드를 더 넣어야 합니다.` });
  }

  // 미배정
  const unassigned = cs.reduce(
    (n, c) => n + c.steps.filter((s) => !s.nodeId || (s.kind === "해결" && s.labelA && !s.nodeIdB)).length,
    0
  );
  out.push({
    level: unassigned === 0 ? "ok" : "warn",
    text:
      unassigned === 0
        ? "<b>노드 배정</b> — 모든 걸음에 노드가 붙었습니다."
        : `<b>노드 배정</b> — 미배정 ${unassigned}걸음. 시뮬은 돌지만 실제 데이터로는 못 씁니다.`,
  });

  // 중복
  if (dup.length) {
    out.push({
      level: "bad",
      text: `<b>노드 중복</b> — ${dup.map((d) => esc(nodeLabel(d))).join(", ")} 이(가) 두 번 이상 쓰였습니다. 한 노드는 한 걸음만 담습니다(규칙1).`,
    });
  }

  // 체인별 구조
  cs.forEach((c) => {
    const kinds = c.steps.map((s) => s.kind);
    const start = c.steps.find((s) => s.kind === "발단");
    const back = c.steps.find((s) => s.kind === "귀환");
    const solve = c.steps.find((s) => s.kind === "해결");

    // 전부 「자유」인 묶음은 체인이 아니다(기억·전투·관문 낱개) — 운반 검사 대상 아님
    const looseOnly = c.steps.length > 0 && c.steps.every((s) => s.kind === "자유");
    if (!looseOnly && (!kinds.includes("발단") || !kinds.includes("귀환"))) {
      out.push({ level: "warn", text: `<b>${esc(c.title)}</b> — 발단/귀환이 빠졌습니다. 운반(정화)이 성립하지 않습니다.` });
    }

    // 규칙 4 — 귀환은 발단 자리로
    if (start && back && start.nodeId && back.nodeId && start.nodeId !== back.nodeId) {
      out.push({
        level: "warn",
        text: `<b>${esc(c.title)}</b> — 귀환 노드가 발단과 다릅니다(${esc(nodeLabel(back.nodeId))} ≠ ${esc(
          nodeLabel(start.nodeId)
        )}). 되돌아가는 게 아니라 새 장소로 갑니다.`,
      });
    }

    // 갈림길의 근거
    if (solve?.nodeIdB && !kinds.includes("조사")) {
      out.push({ level: "warn", text: `<b>${esc(c.title)}</b> — 조사 걸음 없이 갈림길이 있습니다. 선택의 근거가 없어 억지로 보입니다.` });
    }
    if (solve && solve.nodeIdB && solve.nodeId === solve.nodeIdB) {
      out.push({ level: "bad", text: `<b>${esc(c.title)}</b> — 갈림길 A와 B가 같은 노드입니다. 갈림길이 아닙니다.` });
    }

    // 열쇠 흐름
    if (back?.needs) {
      const supplied = c.steps.some((s) => s.gives && s.gives === back.needs);
      if (!supplied) {
        out.push({
          level: "bad",
          text: `<b>${esc(c.title)}</b> — 귀환에 필요한 「${esc(back.needs)}」를 아무 걸음도 주지 않습니다. 체인이 끊깁니다.`,
        });
      }
    } else if (back) {
      out.push({ level: "warn", text: `<b>${esc(c.title)}</b> — 귀환에 「필요한 것」이 비었습니다. 그냥 다시 걸어간 것과 구분되지 않습니다.` });
    }

    if (solve && solve.nodeIdB && !solve.gives) {
      out.push({ level: "warn", text: `<b>${esc(c.title)}</b> — 해결에서 얻는 게 없습니다. 어느 쪽을 골라도 결과가 같아집니다.` });
    }
  });

  // 남은 노드
  const leftover = list.filter((n) => !used.has(n.npc_id));
  if (leftover.length) {
    out.push({
      level: "warn",
      text: `<b>남은 노드 ${leftover.length}개</b> — ${leftover
        .slice(0, 6)
        .map((n) => esc(n.label))
        .join(", ")}${leftover.length > 6 ? " 외" : ""}. 체인에 안 들어간 노드는 자유 걸음이 되거나, 정체가 안 열려 흘려집니다(규칙5).`,
    });
  }

  return out;
}

function renderChecks() {
  const cs = runChecks();
  checksEl.innerHTML = cs
    .map(
      (c) =>
        `<div class="chk ${c.level}"><span class="ic">${
          c.level === "ok" ? "✔" : c.level === "warn" ? "!" : "✕"
        }</span><span>${c.text}</span></div>`
    )
    .join("");
}

// ── 여정 갈래 (섹터 간) ─────────────────────────────────────────────────

const routeTable = $("routeTable");
const purifyLadder = $("purifyLadder");

function sectorName(id: string): string {
  return (areas.find((a) => a.area_id === id)?.display_name ?? id).replace(/^무지개섬\s*·\s*/, "");
}

function renderRoutes() {
  if (!routes.length) {
    routeTable.innerHTML = `<div class="hint" style="margin:0">루트를 만들 수 없습니다 — <code>area_connection_config.csv</code>를 확인하세요.</div>`;
    purifyLadder.innerHTML = "";
    return;
  }

  routeTable.innerHTML = routes
    .map((r, i) => {
      const cls = r.overBudget ? "over" : r.days >= DAY_BUDGET - 2 ? "tight" : "best";
      const verdict = r.overBudget
        ? `초과 +${r.days - DAY_BUDGET}일`
        : `여유 ${DAY_BUDGET - r.days}일`;
      return `<div class="route-row ${cls}">
        <span>${esc(r.label)}</span>
        <span class="d">${r.days}일 <span style="color:#8aa094;font-weight:400">(이동 ${r.moves})</span></span>
        <span class="p">정화 ${r.purifyPct}%</span>
        <button type="button" data-route="${i}">읽기</button>
      </div>
      <div class="hint" style="margin:2px 0 0 3px">${esc(verdict)} · ${esc(
        r.visited.map(sectorName).join(" → ")
      )}</div>`;
    })
    .join("");

  routeTable.querySelectorAll<HTMLButtonElement>("[data-route]").forEach((b) => {
    b.addEventListener("click", () => {
      const r = routes[Number(b.dataset.route)];
      if (r) runRouteSim(r);
    });
  });

  purifyLadder.innerHTML =
    `<div class="ladder">` +
    PURIFY_THRESHOLDS.map(
      (t) => `<div class="ladder-row"><span class="lp">${t.pct}%</span><span><b>${esc(
        t.label
      )}</b> — ${esc(t.effect)}</span></div>`
    ).join("") +
    `</div>`;
}

/**
 * 루트 하나를 60일 전체로 읽어준다 — 갈래를 사람이 외우지 않게.
 * 갈림길은 A쪽으로 진행하고 안 간 길을 함께 적는다(비트 시트 성격).
 */
function runRouteSim(route: RouteOption) {
  sim = freshSim();
  simChoice.innerHTML = "";
  simLog.innerHTML = "";

  logRow("d", `── 여정 시뮬 · ${route.label} ──`);
  logRow("", `예산 ${DAY_BUDGET}일 · 예상 ${route.days}일 · 섬 정화도 ${route.purifyPct}%`);

  let day = 0;
  const done = new Set<string>();
  const held: string[] = [];

  route.visited.forEach((sid, i) => {
    if (i > 0) {
      day += 1;
      logRow("fk", `[${day}일] 🚶 이동 — ${esc(sectorName(route.visited[i - 1]!))} → ${esc(sectorName(sid))}`);
    }
    if (done.has(sid)) {
      logRow("", `   (지나온 구역 · 할 일 없음)`);
      return;
    }
    done.add(sid);
    logRow("d", `── ${esc(sectorName(sid))} ──`);

    const cs = chains.filter((c) => c.areaId === sid);
    if (!cs.length) {
      logRow("er", `   ! 체인이 없습니다 — 이 섹터는 통과만 합니다.`);
      return;
    }
    for (const c of cs) {
      for (const s of c.steps) {
        day += 1;
        if (s.kind === "해결" && s.nodeIdB) {
          logRow("d", `[${day}일] 갈림길 — ${esc(s.labelA || nodeLabel(s.nodeId))}`);
          logRow("", `   (안 간 길: ${esc(s.labelB || nodeLabel(s.nodeIdB))})`);
        } else {
          logRow("d", `[${day}일] ${esc(s.kind)} — ${esc(nodeLabel(s.nodeId))}`);
        }
        if (s.needs) {
          const idx = held.indexOf(s.needs);
          if (idx < 0) logRow("er", `   ✕ 「${esc(s.needs)}」 없음 — 체인 끊김`);
          else {
            held.splice(idx, 1);
            logRow("st", `   → 「${esc(s.needs)}」 사용 · ${esc(s.kind === "귀환" ? "정화 완료" : "적용")}`);
          }
        }
        if (s.gives) {
          held.push(s.gives);
          logRow("st", `   → 「${esc(s.gives)}」 획득`);
        }
      }
      logRow("fin", `   ■ ${esc(c.title)} 완결`);
    }
  });

  logRow("fin", `── 총 ${day}일 / 예산 ${DAY_BUDGET}일 ──`);
  if (day > DAY_BUDGET) logRow("er", `   ✕ ${day - DAY_BUDGET}일 초과 — 배를 놓칩니다`);
  else logRow("st", `   ✔ 여유 ${DAY_BUDGET - day}일`);
  const reached = thresholdsReached(route.purifyPct);
  if (reached.length) {
    logRow("st", `   정화 보상: ${esc(reached.map((t) => `${t.pct}% ${t.label}`).join(" · "))}`);
  }
  if (held.length) logRow("er", `   ! 안 쓴 열쇠: ${esc(held.join(", "))}`);
  sim.done = true;
  renderHud();
}

// ── 시뮬 ────────────────────────────────────────────────────────────────

interface SimState {
  day: number;
  ci: number;
  si: number;
  held: string[];
  revealed: Set<string>;
  fork: { step: Step; chain: Chain } | null;
  done: boolean;
}

let sim: SimState = freshSim();

function freshSim(): SimState {
  return { day: 0, ci: 0, si: 0, held: [], revealed: new Set(), fork: null, done: false };
}

function logRow(cls: string, text: string) {
  const div = document.createElement("div");
  div.className = "row";
  div.innerHTML = `<span class="${cls}">${text}</span>`;
  simLog.appendChild(div);
  simLog.scrollTop = simLog.scrollHeight;
}

function renderHud() {
  const cs = areaChains(currentAreaId);
  const total = cs.reduce((s, c) => s + c.steps.length, 0);
  const chips: string[] = [
    `<span class="hud-chip">일차 <b>${sim.day}</b> / ${total}</span>`,
    `<span class="hud-chip">공개된 노드 <b>${sim.revealed.size}</b></span>`,
  ];
  if (sim.held.length) {
    chips.push(`<span class="hud-chip hold">소지 <b>${esc(sim.held.join(" · "))}</b></span>`);
  } else {
    chips.push(`<span class="hud-chip">소지 <b>없음</b></span>`);
  }
  simHud.innerHTML = chips.join("");
}

function resetSim() {
  sim = freshSim();
  simLog.innerHTML = "";
  simChoice.innerHTML = "";
  const cs = areaChains(currentAreaId);
  if (!cs.length) {
    logRow("er", "체인이 없습니다. 먼저 체인을 만드세요.");
  } else {
    const area = areas.find((a) => a.area_id === currentAreaId);
    logRow("d", `── ${area?.display_name ?? currentAreaId} · 시뮬 시작 ──`);
    logRow("", "「다음 날」을 누르면 한 걸음씩 진행합니다. 연출은 없습니다.");
  }
  renderHud();
}

/** 한 걸음(=하루) 진행. 갈림길이면 선택 대기로 멈춘다. */
function simNext(pick?: "A" | "B") {
  const cs = areaChains(currentAreaId);
  if (!cs.length || sim.done) return;

  // 갈림길 대기 중
  if (sim.fork && !pick) return;

  if (sim.fork && pick) {
    const { step, chain } = sim.fork;
    sim.fork = null;
    simChoice.innerHTML = "";
    const nid = pick === "A" ? step.nodeId : step.nodeIdB;
    const lbl = pick === "A" ? step.labelA : step.labelB;
    sim.day += 1;
    logRow("d", `[${sim.day}일] ${esc(lbl || (pick === "A" ? "A" : "B"))} — ${esc(nodeLabel(nid))}`);
    if (step.gives) {
      sim.held.push(step.gives);
      logRow("st", `   → 「${esc(step.gives)}」 획득`);
    }
    const other = pick === "A" ? step.nodeIdB : step.nodeId;
    if (other) logRow("", `   (가지 않은 길: ${esc(nodeLabel(other))})`);
    advance(chain);
    renderHud();
    return;
  }

  const chain = cs[sim.ci];
  if (!chain) {
    finish();
    return;
  }
  const step = chain.steps[sim.si];
  if (!step) {
    sim.ci += 1;
    sim.si = 0;
    simNext();
    return;
  }

  // 갈림길 제시
  if (step.kind === "해결" && step.nodeIdB) {
    sim.fork = { step, chain };
    logRow("fk", `   갈림길 — 어느 쪽으로?`);
    simChoice.innerHTML = `
      <button type="button" data-pick="A">${esc(step.labelA || nodeLabel(step.nodeId))}</button>
      <button type="button" data-pick="B">${esc(step.labelB || nodeLabel(step.nodeIdB))}</button>`;
    simChoice.querySelectorAll<HTMLButtonElement>("[data-pick]").forEach((b) => {
      b.addEventListener("click", () => simNext(b.dataset.pick as "A" | "B"));
    });
    return;
  }

  sim.day += 1;
  const nid = step.nodeId;
  const n = nodeById(nid);
  sim.revealed.add(nid);

  logRow("d", `[${sim.day}일] ${esc(step.kind)} — ${esc(nodeLabel(nid))}`);
  if (n?.flavor_text) logRow("", `   ${esc(n.flavor_text)}`);

  if (step.kind === "조사" && chain) {
    const solve = chain.steps.find((s) => s.kind === "해결");
    if (solve) {
      const opened: string[] = [];
      if (solve.nodeId) {
        sim.revealed.add(solve.nodeId);
        opened.push(nodeLabel(solve.nodeId));
      }
      if (solve.nodeIdB) {
        sim.revealed.add(solve.nodeIdB);
        opened.push(nodeLabel(solve.nodeIdB));
      }
      if (opened.length) logRow("st", `   → 단서 공개: ${esc(opened.join(" / "))} (규칙5 · 정체가 열림)`);
      if (opened.length < 2) logRow("er", `   ! 단서가 하나뿐입니다 — 갈림길의 근거가 약합니다.`);
    }
  }

  if (step.needs) {
    const idx = sim.held.indexOf(step.needs);
    if (idx < 0) {
      logRow("er", `   ✕ 「${esc(step.needs)}」가 없어 실패. 체인이 끊겼습니다.`);
    } else {
      sim.held.splice(idx, 1);
      logRow("st", `   → 「${esc(step.needs)}」 사용 · ${esc(step.kind === "귀환" ? "정화 완료" : "적용")}`);
    }
  }
  if (step.gives) {
    sim.held.push(step.gives);
    logRow("st", `   → 「${esc(step.gives)}」 획득`);
  }

  advance(chain);
  renderHud();
}

function advance(chain: Chain) {
  sim.si += 1;
  if (sim.si >= chain.steps.length) {
    logRow("fin", `   ■ ${esc(chain.title)} 완결`);
    sim.ci += 1;
    sim.si = 0;
  }
  const cs = areaChains(currentAreaId);
  if (sim.ci >= cs.length) finish();
}

function finish() {
  if (sim.done) return;
  sim.done = true;
  logRow("fin", `── 구역 종료 · 총 ${sim.day}일 ──`);
  if (sim.held.length) logRow("er", `   ! 안 쓴 열쇠가 남았습니다: ${esc(sim.held.join(", "))}`);
}

// ── 내보내기 ────────────────────────────────────────────────────────────

function buildChainCsv(): string {
  const head = "chain_id,area_id,title,step_count,note";
  const rows = chains.map((c) =>
    [csvCell(c.id), csvCell(c.areaId), csvCell(c.title), String(c.steps.length), ""].join(",")
  );
  return [head, ...rows].join("\n");
}

function buildStepCsv(): string {
  const head = "chain_id,step_no,kind,node_id,node_id_b,label_a,label_b,gives,needs";
  const rows: string[] = [];
  chains.forEach((c) => {
    c.steps.forEach((s, i) => {
      rows.push(
        [
          csvCell(c.id),
          String(i + 1),
          csvCell(s.kind),
          csvCell(s.nodeId),
          csvCell(s.nodeIdB),
          csvCell(s.labelA),
          csvCell(s.labelB),
          csvCell(s.gives),
          csvCell(s.needs),
        ].join(",")
      );
    });
  });
  return [head, ...rows].join("\n");
}

/** 비트 시트 — 기획자가 읽는 형태 */
function buildBeatSheet(): string {
  const out: string[] = ["# 시나리오 비트 시트", "", "> 시나리오 체인 툴 자동 생성 · 연출 제외", ""];
  areas.forEach((a) => {
    const cs = areaChains(a.area_id);
    if (!cs.length) return;
    let day = 0;
    out.push(`## ${a.display_name} (\`${a.area_id}\`)`, "");
    out.push("| 일차 | 단계 | 노드 | 내용 |", "|---|---|---|---|");
    cs.forEach((c) => {
      c.steps.forEach((s) => {
        day += 1;
        if (s.kind === "해결" && s.nodeIdB) {
          out.push(
            `| ${day} | **갈림길** | ${nodeLabel(s.nodeId)} / ${nodeLabel(s.nodeIdB)} | ${
              s.labelA || "A"
            } · ${s.labelB || "B"}${s.gives ? ` → 「${s.gives}」` : ""} |`
          );
        } else {
          const bits: string[] = [];
          if (s.needs) bits.push(`「${s.needs}」 사용`);
          if (s.gives) bits.push(`「${s.gives}」 획득`);
          out.push(`| ${day} | ${s.kind} | ${nodeLabel(s.nodeId)} | ${bits.join(" · ") || "—"} |`);
        }
      });
    });
    out.push("", `**총 ${day}일 · 체인 ${cs.length}개**`, "");
  });
  return out.join("\n");
}

function renderOut() {
  outBox.textContent =
    outMode === "chain" ? buildChainCsv() : outMode === "step" ? buildStepCsv() : buildBeatSheet();
}

// ── 초기화 ──────────────────────────────────────────────────────────────

function renderAll() {
  renderAreaStats();
  renderChainList();
  renderEditor();
  renderChecks();
  renderRoutes();
  renderOut();
  resetSim();
}

function bindStatic() {
  areaSelect.addEventListener("change", () => {
    currentAreaId = areaSelect.value;
    selectedChainId = areaChains(currentAreaId)[0]?.id ?? "";
    save();
    renderAll();
  });

  // 현재 시나리오(33 §3-3 거시 아크)를 체인으로 옮긴 초안을 통째로 불러온다
  $("btnPreset").addEventListener("click", () => {
    chains = buildPreset().map((c) => ({
      id: c.id,
      areaId: c.areaId,
      title: c.title,
      steps: c.steps.map((s) => ({ ...s })),
    }));
    selectedChainId = areaChains(currentAreaId)[0]?.id ?? "";
    save();
    renderAll();
  });

  $("btnAddChain").addEventListener("click", () => {
    const c = makeChain(currentAreaId);
    chains.push(c);
    selectedChainId = c.id;
    save();
    renderAll();
  });

  // 남은 노드를 진행 순서(y 내림차순)대로 미배정 걸음에 꽂는다
  $("btnAutoFill").addEventListener("click", () => {
    const cs = areaChains(currentAreaId);
    const used = new Set<string>();
    cs.forEach((c) =>
      c.steps.forEach((s) => {
        if (s.nodeId) used.add(s.nodeId);
        if (s.nodeIdB) used.add(s.nodeIdB);
      })
    );
    const free = areaNodes(currentAreaId).filter((n) => !used.has(n.npc_id));
    let k = 0;
    cs.forEach((c) => {
      const start = c.steps.find((s) => s.kind === "발단");
      c.steps.forEach((s) => {
        // 귀환은 발단과 같은 노드여야 한다(규칙4)
        if (s.kind === "귀환" && start?.nodeId) {
          s.nodeId = start.nodeId;
          return;
        }
        if (!s.nodeId && free[k]) {
          s.nodeId = free[k]!.npc_id;
          k += 1;
        }
        if (s.kind === "해결" && !s.nodeIdB && free[k]) {
          s.nodeIdB = free[k]!.npc_id;
          k += 1;
        }
      });
    });
    save();
    renderAll();
  });

  $("btnSimNext").addEventListener("click", () => simNext());
  $("btnSimRun").addEventListener("click", () => {
    // 갈림길을 만나면 멈춘다 — 선택은 사람이 한다
    let guard = 0;
    while (!sim.done && !sim.fork && guard < 400) {
      simNext();
      guard += 1;
    }
  });
  $("btnSimReset").addEventListener("click", resetSim);

  document.querySelectorAll<HTMLButtonElement>("[data-out]").forEach((b) => {
    b.addEventListener("click", () => {
      document.querySelectorAll<HTMLButtonElement>("[data-out]").forEach((x) => x.classList.remove("on"));
      b.classList.add("on");
      outMode = b.dataset.out as "chain" | "step" | "beat";
      renderOut();
    });
  });

  $("btnCopy").addEventListener("click", () => {
    void navigator.clipboard.writeText(outBox.textContent ?? "");
  });

  $("btnDownload").addEventListener("click", () => {
    const name =
      outMode === "chain"
        ? "scenario_chain_config.csv"
        : outMode === "step"
          ? "scenario_chain_step_config.csv"
          : "scenario_beatsheet.md";
    const blob = new Blob([outBox.textContent ?? ""], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  });

  $("btnWipe").addEventListener("click", () => {
    chains = [];
    selectedChainId = "";
    save();
    renderAll();
  });
}

async function init() {
  try {
    const [areaRows, npcRows, connRows, blightRows] = await Promise.all([
      loadCsv("area_config"),
      loadCsv("area_npc_config"),
      loadCsv("area_connection_config"),
      loadCsv("purify_blight_config"),
    ]);

    areas = (areaRows as Row[]).map((r) => ({
      area_id: r.area_id ?? "",
      display_name: r.display_name ?? r.area_id ?? "",
    }));
    nodes = (npcRows as Row[]).map((r) => ({
      npc_id: r.npc_id ?? "",
      area_id: r.area_id ?? "",
      x_pct: Number(r.x_pct ?? 0),
      y_pct: Number(r.y_pct ?? 0),
      icon: r.icon ?? "•",
      label: r.label ?? r.npc_id ?? "",
      trigger_type: r.trigger_type ?? "",
      flavor_text: r.flavor_text ?? "",
    }));

    const connections = (connRows as Row[]).map((r) => ({
      from_area_id: r.from_area_id ?? "",
      to_area_id: r.to_area_id ?? "",
      bidirectional: (r.bidirectional ?? "").trim().toUpperCase() === "TRUE",
    }));
    const blights = (blightRows as Row[]).map((r) => ({
      target_ref: r.target_ref ?? "",
      target_kind: r.target_kind ?? "",
    }));
    totalBlights = blights.filter((b) => b.target_kind === "AREA").length;
    sectors = buildSectors({ areas, nodes, blights, connections });
    routes = enumerateRoutes(sectors, totalBlights);

    areaSelect.innerHTML = areas
      .map((a) => `<option value="${esc(a.area_id)}">${esc(a.display_name)}</option>`)
      .join("");

    load();
    if (!currentAreaId || !areas.some((a) => a.area_id === currentAreaId)) {
      currentAreaId = areas[0]?.area_id ?? "";
    }
    areaSelect.value = currentAreaId;
    selectedChainId = areaChains(currentAreaId)[0]?.id ?? "";

    loadHint.innerHTML = `구역 ${areas.length}개 · 노드 ${nodes.length}개 로드됨. 진행 순서는 <b>y좌표 내림차순</b>(아래→위)입니다.`;

    bindStatic();
    renderAll();
  } catch (e) {
    loadHint.innerHTML = `<span style="color:#ff8a7a">CSV 로드 실패 — <code>npm run dev</code>로 띄웠는지 확인하세요. (${esc(
      String(e)
    )})</span>`;
  }
}

void init();
