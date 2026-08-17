/**
 * 플레이 로그 뷰어 — 본편이 BroadcastChannel로 보내는 줄을 받아 보여 준다.
 * 저장된 파일은 GET /__play_log_list · /dev_logs/play_*.txt
 */
import { PLAY_LOG_CHANNEL, PLAY_LOG_LIMIT, PLAY_LOG_STORE_KEY, type PlayLogMsg } from "../../dev/playLog";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const logEl = $<HTMLPreElement>("log");
const statusEl = $<HTMLElement>("status");
const metaEl = $<HTMLElement>("meta");
const meterEl = $<HTMLElement>("meter");
const filesEl = $<HTMLElement>("files");
const filterEl = $<HTMLInputElement>("filter");
const btnPause = $<HTMLButtonElement>("btnPause");
const btnCopy = $<HTMLButtonElement>("btnCopy");
const btnClear = $<HTMLButtonElement>("btnClear");
const btnFlush = $<HTMLButtonElement>("btnFlush");
const btnReload = $<HTMLButtonElement>("btnReload");

const KIND_RE = /^(\d{2}:\d{2}:\d{2}\.\d{3})\s+(\S+)\s+(.*)$/;

let paused = false;
let follow = true;
let lines: string[] = [];
let chars = 0;
let part = 1;
let file = "";
let session = "";
let connected = false;

const ch = new BroadcastChannel(PLAY_LOG_CHANNEL);

function setStatus(text: string, cls: "" | "ok" | "err" = "") {
  statusEl.textContent = text;
  statusEl.className = `status ${cls}`.trim();
}

function paintMeter(): void {
  const pct = Math.min(100, Math.round((chars / PLAY_LOG_LIMIT) * 100));
  const fill = meterEl.querySelector("i") as HTMLElement;
  fill.style.width = `${pct}%`;
  meterEl.classList.toggle("hot", pct >= 80);
  metaEl.textContent = session
    ? `${file || "—"} · ${chars}/${PLAY_LOG_LIMIT}자 · part ${String(part).padStart(3, "0")}`
    : "세션 없음 — 본편을 먼저 켠다";
}

function colorLine(raw: string): string {
  const m = KIND_RE.exec(raw);
  if (!m) return escapeHtml(raw);
  const kind = m[2].trim();
  return `<span class="k-${escapeHtml(kind)}">${escapeHtml(raw)}</span>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function visible(): string[] {
  const q = filterEl.value.trim().toLowerCase();
  if (!q) return lines;
  return lines.filter((l) => l.toLowerCase().includes(q));
}

function render(): void {
  const nearBottom = logEl.scrollHeight - logEl.scrollTop - logEl.clientHeight < 48;
  logEl.innerHTML = visible().map(colorLine).join("\n") + (lines.length ? "\n" : "");
  if (follow && !paused && nearBottom) logEl.scrollTop = logEl.scrollHeight;
}

function pushLine(line: string): void {
  if (paused) return;
  lines.push(line);
  if (lines.length > 4000) lines = lines.slice(-3000);
  render();
}

function applyDump(text: string): void {
  const incoming = text.split("\n").filter((l) => l.length > 0);
  if (!incoming.length) return;
  lines = incoming;
  render();
  logEl.scrollTop = logEl.scrollHeight;
}

ch.addEventListener("message", (ev: MessageEvent<PlayLogMsg>) => {
  const msg = ev.data;
  if (!msg || typeof msg !== "object") return;
  connected = true;
  if (msg.t === "line") {
    chars = msg.chars;
    part = msg.part;
    file = msg.file;
    paintMeter();
    pushLine(msg.line);
    setStatus("수신 중", "ok");
  } else if (msg.t === "saved") {
    part = msg.part;
    file = msg.file;
    chars = msg.chars;
    paintMeter();
    pushLine(`# saved ${msg.file} (${msg.chars}자)`);
    setStatus(`저장 ${msg.file}`, "ok");
    void loadFiles();
  } else if (msg.t === "dump") {
    session = msg.session;
    part = msg.part;
    chars = msg.chars;
    file = msg.file;
    paintMeter();
    applyDump(msg.text);
    setStatus("본편 연결됨", "ok");
  } else if (msg.t === "wiped") {
    lines = [];
    chars = 0;
    part = 1;
    file = "";
    session = "";
    render();
    paintMeter();
    setStatus("로그 삭제됨", "ok");
    void loadFiles();
  } else if (msg.t === "status") {
    session = msg.session;
    part = msg.part;
    chars = msg.chars;
    file = msg.file;
    paintMeter();
    if (msg.session) setStatus("본편 연결됨", "ok");
  }
});

btnPause.addEventListener("click", () => {
  paused = !paused;
  btnPause.classList.toggle("on", paused);
  btnPause.textContent = paused ? "재개" : "일시정지";
});

btnCopy.addEventListener("click", async () => {
  const text = visible().join("\n");
  try {
    await navigator.clipboard.writeText(text);
    setStatus("복사됨", "ok");
  } catch {
    setStatus("복사 실패", "err");
  }
});

btnClear.addEventListener("click", () => {
  if (!confirm("플레이 로그를 완전히 지울까요?\n새로고침해도 복구되지 않습니다.")) return;
  try {
    localStorage.removeItem(PLAY_LOG_STORE_KEY);
  } catch {
    /* ignore */
  }
  lines = [];
  chars = 0;
  part = 1;
  file = "";
  session = "";
  render();
  paintMeter();
  ch.postMessage({ t: "wipe" } satisfies PlayLogMsg);
  void fetch("/__play_log_wipe", { method: "POST" })
    .then(() => loadFiles())
    .catch(() => undefined);
  setStatus("로그 삭제됨", "ok");
});

btnFlush.addEventListener("click", () => {
  ch.postMessage({ t: "flush" } satisfies PlayLogMsg);
  setStatus("저장 요청", "ok");
});

filterEl.addEventListener("input", () => render());

logEl.addEventListener("scroll", () => {
  follow = logEl.scrollHeight - logEl.scrollTop - logEl.clientHeight < 48;
});

type FileRow = { file: string; chars: number; mtime: string };

async function loadFiles(): Promise<void> {
  try {
    const r = await fetch("/__play_log_list");
    const j = (await r.json()) as { ok?: boolean; files?: FileRow[]; error?: string };
    if (!r.ok || !j.ok) {
      filesEl.textContent = j.error || "목록을 못 읽음 (npm run dev)";
      return;
    }
    const files = j.files ?? [];
    if (!files.length) {
      filesEl.textContent = "아직 저장된 파일 없음";
      return;
    }
    filesEl.replaceChildren(
      ...files.map((f) => {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = `${f.file}\n${f.chars}자`;
        b.addEventListener("click", () => void openFile(f.file));
        return b;
      }),
    );
  } catch {
    filesEl.textContent = "목록 실패";
  }
}

async function openFile(name: string): Promise<void> {
  try {
    const r = await fetch(`/dev_logs/${name}`);
    if (!r.ok) throw new Error(String(r.status));
    const text = await r.text();
    paused = true;
    btnPause.classList.add("on");
    btnPause.textContent = "재개";
    applyDump(text);
    setStatus(`연 파일 ${name}`, "ok");
  } catch {
    setStatus("파일 열기 실패", "err");
  }
}

btnReload.addEventListener("click", () => void loadFiles());

function restoreFromStore(): void {
  try {
    const raw = localStorage.getItem(PLAY_LOG_STORE_KEY);
    if (!raw) return;
    const j = JSON.parse(raw) as { session?: string; part?: number; buf?: string };
    if (typeof j.session !== "string" || typeof j.buf !== "string") return;
    session = j.session;
    part = typeof j.part === "number" && j.part > 0 ? j.part : 1;
    chars = j.buf.length;
    file = session ? `play_${session}_${String(part).padStart(3, "0")}.txt` : "";
    applyDump(j.buf);
    paintMeter();
    setStatus("저장된 로그 복구", "ok");
  } catch {
    /* ignore */
  }
}

restoreFromStore();
ch.postMessage({ t: "ping" } satisfies PlayLogMsg);
void loadFiles();
paintMeter();
setInterval(() => ch.postMessage({ t: "ping" } satisfies PlayLogMsg), 4000);
