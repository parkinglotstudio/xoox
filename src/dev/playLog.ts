/**
 * 개발용 플레이 로그 — 상황·전투 종류를 한 줄로 남긴다.
 *
 * 5000자가 넘으면 현재 파트를 저장하고 다음 파일로 넘긴다.
 * 파일: data/dev_logs/play_YYYYMMDD_HHMMSS_001.txt
 * 라이브 뷰어: BroadcastChannel('xoox-play-log') + /play-log-tool.html
 */

export const PLAY_LOG_LIMIT = 5000;
export const PLAY_LOG_CHANNEL = "xoox-play-log";

export type PlayLogKind =
  | "GAME"
  | "SCENE"
  | "STAGE"
  | "AREA"
  | "NODE"
  | "RAID"
  | "ARENA"
  | "RESCUE"
  | "BLIGHT"
  | "COMBAT"
  | "SKILL"
  | "DAY"
  | "FAIL"
  | "AMMO";

export type PlayLogMsg =
  | { t: "line"; line: string; part: number; chars: number; file: string }
  | { t: "saved"; file: string; part: number; chars: number }
  | { t: "dump"; text: string; part: number; chars: number; file: string; session: string }
  | { t: "status"; session: string; part: number; chars: number; file: string }
  | { t: "flush" }
  | { t: "wipe" }
  | { t: "wiped" }
  | { t: "ping" };

const KIND_W = 7;
const LINE_MAX = 160;
export const PLAY_LOG_STORE_KEY = "xoox.playLog";

let session = "";
let part = 1;
let buf = "";
let flushChain: Promise<void> = Promise.resolve();
let channel: BroadcastChannel | null = null;

function pad3(n: number): string {
  return String(n).padStart(3, "0");
}

function stamp(): string {
  const d = new Date();
  const p = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function clock(): string {
  const d = new Date();
  const p = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${p(d.getMilliseconds(), 3)}`;
}

export function playLogFileName(sess: string, p: number): string {
  return `play_${sess}_${pad3(p)}.txt`;
}

function currentFile(): string {
  return session ? playLogFileName(session, part) : "";
}

function headerLine(): string {
  return `# xoox play ${session} part ${pad3(part)}`;
}

function getChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === "undefined") return null;
  if (!channel) {
    channel = new BroadcastChannel(PLAY_LOG_CHANNEL);
    channel.addEventListener("message", (ev: MessageEvent<PlayLogMsg>) => {
      const msg = ev.data;
      if (!msg || typeof msg !== "object") return;
      if (msg.t === "ping") postStatus(true);
      if (msg.t === "flush") void flush({ next: true });
      if (msg.t === "wipe") wipePlayLog();
    });
  }
  return channel;
}

function post(msg: PlayLogMsg): void {
  try {
    getChannel()?.postMessage(msg);
  } catch {
    /* ignore */
  }
}

function postStatus(withDump: boolean): void {
  if (!session) {
    post({ t: "status", session: "", part: 1, chars: 0, file: "" });
    return;
  }
  const file = currentFile();
  post({ t: "status", session, part, chars: buf.length, file });
  if (withDump) post({ t: "dump", text: buf, part, chars: buf.length, file, session });
}

function readStore(): { session: string; part: number; buf: string } | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(PLAY_LOG_STORE_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw) as { session?: unknown; part?: unknown; buf?: unknown };
    if (typeof j.session !== "string" || !j.session) return null;
    if (typeof j.buf !== "string") return null;
    const p = typeof j.part === "number" && j.part > 0 ? j.part : 1;
    return { session: j.session, part: p, buf: j.buf };
  } catch {
    return null;
  }
}

function writeStore(): void {
  if (typeof localStorage === "undefined") return;
  try {
    if (!session) {
      localStorage.removeItem(PLAY_LOG_STORE_KEY);
      return;
    }
    localStorage.setItem(PLAY_LOG_STORE_KEY, JSON.stringify({ session, part, buf }));
  } catch {
    /* quota */
  }
}

function ensureSession(): void {
  if (session) return;
  const prev = readStore();
  if (prev) {
    session = prev.session;
    part = prev.part;
    buf = prev.buf.endsWith("\n") || prev.buf === "" ? prev.buf : `${prev.buf}\n`;
  } else {
    session = stamp();
    part = 1;
    buf = `${headerLine()}\n`;
    writeStore();
  }
  getChannel();
  postStatus(true);
}

async function persistKeep(): Promise<void> {
  if (!session || !hasLogLines(buf)) return;
  const file = currentFile();
  const ok = await persist(file, buf);
  if (ok) post({ t: "saved", file, part, chars: buf.length });
  postStatus(false);
}

async function persist(file: string, text: string): Promise<boolean> {
  try {
    const r = await fetch("/__play_log_save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file, text }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

function hasLogLines(text: string): boolean {
  return text.split("\n").some((l) => l.trim() && !l.startsWith("#"));
}

async function persistCurrent(next: boolean): Promise<void> {
  if (!hasLogLines(buf)) return;
  const file = currentFile();
  const text = buf;
  const ok = await persist(file, text);
  if (!ok) return;
  post({ t: "saved", file, part, chars: text.length });
  const extra = buf.startsWith(text) ? buf.slice(text.length) : "";
  if (next) {
    part += 1;
    buf = `${headerLine()}\n${extra}`;
  } else {
    buf = extra;
  }
  writeStore();
  postStatus(false);
}

export function flush(opts?: { next?: boolean }): Promise<void> {
  const next = opts?.next !== false;
  flushChain = flushChain.then(() => persistCurrent(next)).catch(() => undefined);
  return flushChain;
}

function bitsToText(bits: Array<string | number | null | undefined>): string {
  return bits
    .filter((b) => b !== null && b !== undefined && b !== "")
    .map(String)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, LINE_MAX);
}

/** 한 줄 기록. 상황·콘텐츠가 보이게 짧게. */
export function playLog(kind: PlayLogKind | string, ...bits: Array<string | number | null | undefined>): void {
  installPlayLog();
  ensureSession();
  const text = bitsToText(bits);
  const line = `${clock()} ${String(kind).toUpperCase().padEnd(KIND_W)} ${text}`.trimEnd();
  buf += `${line}\n`;
  writeStore();
  post({ t: "line", line, part, chars: buf.length, file: currentFile() });
  if (buf.length >= PLAY_LOG_LIMIT) void flush({ next: true });
}

export function playLogStatus(): { session: string; part: number; chars: number; file: string; limit: number } {
  return { session, part, chars: buf.length, file: currentFile(), limit: PLAY_LOG_LIMIT };
}

let installed = false;

export function wipePlayLog(): void {
  session = "";
  part = 1;
  buf = "";
  writeStore();
  post({ t: "wiped" });
  post({ t: "status", session: "", part: 1, chars: 0, file: "" });
  void fetch("/__play_log_wipe", { method: "POST" }).catch(() => undefined);
}

/** 본편에서 한 번. 툴 페이지는 호출하지 않는다. */
export function installPlayLog(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;
  getChannel();
  const prev = readStore();
  if (prev) {
    session = prev.session;
    part = prev.part;
    buf = prev.buf.endsWith("\n") || prev.buf === "" ? prev.buf : `${prev.buf}\n`;
    postStatus(true);
  }
  window.addEventListener("beforeunload", () => {
    writeStore();
    void persistKeep();
  });
  (window as unknown as { __playLog: unknown }).__playLog = {
    log: playLog,
    flush: () => flush({ next: true }),
    wipe: wipePlayLog,
    status: playLogStatus,
  };
}
