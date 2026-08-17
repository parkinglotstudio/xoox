/**
 * 스프라이트 시트 매니페스트 로더.
 *
 * `docs/art/sprites/<char>/engine/<anim>/<anim>.json` 포맷을 그대로 읽는다.
 * (cols / rows / frame_count / frames[].duration_ms / sheet / loop)
 *
 * 아트 파이프라인이 이미 그 포맷으로 굽고 있으므로 규약을 새로 만들지 않는다.
 * 게임에서 쓰려면 시트가 Vite publicDir(`data/`) 아래에 있어야 한다 —
 * 그래서 런타임 경로는 `/ui/actor/<char>/<anim>/<anim>.json` 규약을 쓴다.
 */
import type { SpriteAnimSheet } from "./types";

interface RawManifest {
  id?: string;
  cols?: number;
  rows?: number;
  frame_count?: number;
  sheet?: string;
  loop?: boolean;
  frames?: { index?: number; duration_ms?: number }[];
}

/** 캐릭터 스프라이트 루트 — 아트가 들어오면 이 아래에 <char>/<anim>/ 로 넣는다 */
export const ACTOR_SPRITE_ROOT = "/ui/actor";

function dirOf(url: string): string {
  const i = url.lastIndexOf("/");
  return i < 0 ? "" : url.slice(0, i);
}

/** 매니페스트 URL → 시트. 실패하면 null (호출측이 정지 PNG로 폴백) */
export async function loadSpriteSheet(manifestUrl: string): Promise<SpriteAnimSheet | null> {
  try {
    const res = await fetch(`${manifestUrl}?v=${Date.now()}`);
    if (!res.ok) return null;
    const m = (await res.json()) as RawManifest;

    const cols = Math.max(1, Math.floor(m.cols ?? 1));
    const rows = Math.max(1, Math.floor(m.rows ?? 1));
    const sheetName = m.sheet || `${m.id ?? "sheet"}_sheet.png`;
    const url = sheetName.startsWith("/") ? sheetName : `${dirOf(manifestUrl)}/${sheetName}`;

    const rawFrames = Array.isArray(m.frames) ? m.frames : [];
    const count = rawFrames.length || Math.max(1, m.frame_count ?? cols * rows);
    const frames = rawFrames.length
      ? rawFrames.map((f, i) => ({
          index: f.index ?? i,
          durationMs: Math.max(16, f.duration_ms ?? 120),
        }))
      : Array.from({ length: count }, (_, i) => ({ index: i, durationMs: 120 }));

    return { url, cols, rows, frames, loop: m.loop !== false };
  } catch {
    return null;
  }
}

/**
 * 캐릭터의 idle/move 세트를 불러온다.
 * 매니페스트가 없으면 `fallbackIdle` 정지 PNG로 대체해 게임이 멈추지 않게 한다.
 */
export async function loadActorSprite(
  charId: string,
  fallbackIdle: string,
  opts?: { idleAnim?: string; moveAnim?: string; root?: string },
): Promise<{ idle: SpriteAnimSheet | string; move?: SpriteAnimSheet | string }> {
  const root = opts?.root ?? ACTOR_SPRITE_ROOT;
  const idleId = opts?.idleAnim ?? "ingame_idle";
  const moveId = opts?.moveAnim ?? "move";

  const [idle, move] = await Promise.all([
    loadSpriteSheet(`${root}/${charId}/${idleId}/${idleId}.json`),
    loadSpriteSheet(`${root}/${charId}/${moveId}/${moveId}.json`),
  ]);

  return {
    idle: idle ?? fallbackIdle,
    move: move ?? undefined,
  };
}
