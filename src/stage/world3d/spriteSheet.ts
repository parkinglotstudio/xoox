/**
 * 스프라이트 시트 매니페스트 로더.
 *
 * `docs/art/sprites/<char>/engine/<anim>/<anim>.json` 포맷을 그대로 읽는다.
 * (cols / rows / frame_count / frames[].duration_ms / sheet / loop)
 *
 * 아트 파이프라인이 이미 그 포맷으로 굽고 있으므로 규약을 새로 만들지 않는다.
 * 게임에서 쓰려면 시트가 Vite publicDir(`data/`) 아래에 있어야 한다 —
 * 그래서 런타임 경로는 `/ui/actor/<char>/<anim>/<anim>.json` 규약을 쓴다.
 *
 * 방랑자(wanderer)만 테스트 7클립(`/ui/wanderer/test_clips`)이 있으면
 * idle/run/shoot/pickup/throw/victory/fail 을 필드 슬롯에 덮어쓴다.
 * 생산 시트 `data/ui/actor/wanderer/` 는 그대로 두고, 클립이 없을 때만 폴백한다.
 */
import type { PlayerSprite, SpriteAnimSheet } from "./types";

interface RawManifest {
  id?: string;
  cols?: number;
  rows?: number;
  cell_w?: number;
  cell_h?: number;
  frame_count?: number;
  sheet?: string;
  loop?: boolean;
  muzzle_uv?: unknown;
  foot_anchor?: unknown;
  frames?: { index?: number; duration_ms?: number }[];
}

/** 캐릭터 스프라이트 루트 — 아트가 들어오면 이 아래에 <char>/<anim>/ 로 넣는다 */
export const ACTOR_SPRITE_ROOT = "/ui/actor";

/** 방랑자 테스트 7클립 — 생산 actor 경로와 별도 */
export const WANDERER_TEST_CLIPS_ROOT = "/ui/wanderer/test_clips";

const TEST_CLIP_IDS = ["idle", "shoot", "run", "pickup", "throw", "victory", "fail"] as const;
type TestClipId = (typeof TEST_CLIP_IDS)[number];

function dirOf(url: string): string {
  const i = url.lastIndexOf("/");
  return i < 0 ? "" : url.slice(0, i);
}

function readFootAnchor(raw: unknown): [number, number] | undefined {
  if (Array.isArray(raw) && raw.length >= 2) {
    const x = Number(raw[0]);
    const y = Number(raw[1]);
    if (Number.isFinite(x) && Number.isFinite(y)) return [x, y];
    return undefined;
  }
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as { x?: unknown; y?: unknown };
  const x = Number(o.x);
  const y = Number(o.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return undefined;
  return [x, y];
}

function readPositiveInt(raw: unknown): number | undefined {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return n;
}

/** 매니페스트 URL → 시트. 실패하면 null (호출측이 정지 PNG로 폴백) */
export async function loadSpriteSheet(manifestUrl: string): Promise<SpriteAnimSheet | null> {
  try {
    const res = await fetch(`${manifestUrl}?v=${Date.now()}`);
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("text/html")) return null;
    const text = await res.text();
    const trimmed = text.trimStart();
    if (!trimmed || trimmed.startsWith("<")) return null;
    const m = JSON.parse(text) as RawManifest;

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

    const uv = Array.isArray(m.muzzle_uv) ? m.muzzle_uv : null;
    const muzzleUv =
      uv && uv.length >= 2 && Number.isFinite(Number(uv[0])) && Number.isFinite(Number(uv[1]))
        ? ([Number(uv[0]), Number(uv[1])] as [number, number])
        : undefined;

    return {
      url,
      cols,
      rows,
      frames,
      loop: m.loop !== false,
      cellW: readPositiveInt(m.cell_w),
      cellH: readPositiveInt(m.cell_h),
      footAnchor: readFootAnchor(m.foot_anchor),
      muzzleUv,
    };
  } catch {
    return null;
  }
}

export type WandererTestClips = Partial<Record<TestClipId, SpriteAnimSheet>>;

let testClipsOnce: Promise<WandererTestClips> | null = null;

/** 테스트 7클립을 한 번만 읽는다. 없는 id 는 빠진다. */
export function loadWandererTestClips(root = WANDERER_TEST_CLIPS_ROOT): Promise<WandererTestClips> {
  if (!testClipsOnce) {
    testClipsOnce = Promise.all(
      TEST_CLIP_IDS.map(async (id) => {
        const sheet = await loadSpriteSheet(`${root}/${id}/${id}.json`);
        return [id, sheet] as const;
      }),
    ).then((pairs) => {
      const out: WandererTestClips = {};
      for (const [id, sheet] of pairs) {
        if (sheet) out[id] = sheet;
      }
      return out;
    });
  }
  return testClipsOnce;
}

/**
 * 방랑자만 테스트 뱅크를 필드 슬롯에 덮어쓴다.
 * 다른 캐릭·로비 PNG 경로는 그대로.
 *
 * 매핑:
 *   idle → idle
 *   run → move
 *   shoot → shoot + aimFire (발사)
 *   throw → throw
 *   pickup / victory / fail → 신규 슬롯
 *
 * 테스트 클립이 하나라도 있으면 생산 조준·홀스터·옆걸음 시트는 빼서
 * 512×512 / 512×640 발 디딤이 섞이지 않게 한다. 옆·뒤 걷기는 run 으로 폴백.
 */
export async function applyWandererTestClips(
  charId: string,
  sprite: PlayerSprite,
  root = WANDERER_TEST_CLIPS_ROOT,
): Promise<PlayerSprite> {
  if (charId !== "wanderer") return sprite;
  const test = await loadWandererTestClips(root);
  if (!Object.keys(test).length) return sprite;

  const next: PlayerSprite = {
    ...sprite,
    idle: test.idle ?? sprite.idle,
    move: test.run ?? sprite.move,
    throw: test.throw ?? sprite.throw,
    shoot: test.shoot ?? sprite.shoot,
    aimFire: test.shoot ?? sprite.aimFire,
    pickup: test.pickup ?? sprite.pickup,
    victory: test.victory ?? sprite.victory,
    fail: test.fail ?? sprite.fail,
  };

  // 발 디딤이 다른 생산 extras 를 끼우지 않는다
  delete next.drawHolster;
  delete next.holster;
  delete next.aimWalkF;
  delete next.aimWalkB;
  delete next.aimWalkL;
  delete next.aimWalkR;
  delete next.walkL;
  delete next.walkR;
  delete next.moveBack;
  return next;
}

/**
 * 캐릭터의 idle/move 세트를 불러온다.
 * 매니페스트가 없으면 `fallbackIdle` 정지 PNG로 대체해 게임이 멈추지 않게 한다.
 * extras=false 면 걷기만 — 조준·투척은 loadActorSpriteExtras.
 */
export async function loadActorSprite(
  charId: string,
  fallbackIdle: string,
  opts?: { idleAnim?: string; moveAnim?: string; root?: string; extras?: boolean },
): Promise<PlayerSprite> {
  const root = opts?.root ?? ACTOR_SPRITE_ROOT;
  const idleId = opts?.idleAnim ?? "ingame_idle";
  const moveId = opts?.moveAnim ?? "move";

  const [idle, move] = await Promise.all([
    loadSpriteSheet(`${root}/${charId}/${idleId}/${idleId}.json`),
    loadSpriteSheet(`${root}/${charId}/${moveId}/${moveId}.json`),
  ]);

  const core: PlayerSprite = {
    idle: idle ?? fallbackIdle,
    move: move ?? undefined,
  };
  if (opts?.extras === false) return applyWandererTestClips(charId, core);
  const extra = await loadActorSpriteExtras(charId, { root });
  return applyWandererTestClips(charId, { ...core, ...extra });
}

/** 조준·홀스터·옆걸음 등 — 들판에서 걷기 시작한 뒤에 이어서 붙인다. */
export async function loadActorSpriteExtras(
  charId: string,
  opts?: { root?: string },
): Promise<Omit<PlayerSprite, "idle" | "move">> {
  const root = opts?.root ?? ACTOR_SPRITE_ROOT;
  const [
    aimFire,
    drawHolster,
    holster,
    aimWalkF,
    aimWalkB,
    aimWalkL,
    aimWalkR,
    throwSheet,
    walkL,
    walkR,
    moveBack,
  ] = await Promise.all([
    loadSpriteSheet(`${root}/${charId}/aim_fire/aim_fire.json`),
    loadSpriteSheet(`${root}/${charId}/draw_holster/draw_holster.json`),
    loadSpriteSheet(`${root}/${charId}/holster/holster.json`),
    loadSpriteSheet(`${root}/${charId}/aim_walk_f/aim_walk_f.json`),
    loadSpriteSheet(`${root}/${charId}/aim_walk_b/aim_walk_b.json`),
    loadSpriteSheet(`${root}/${charId}/aim_walk_l/aim_walk_l.json`),
    loadSpriteSheet(`${root}/${charId}/aim_walk_r/aim_walk_r.json`),
    loadSpriteSheet(`${root}/${charId}/throw/throw.json`),
    loadSpriteSheet(`${root}/${charId}/walk_l/walk_l.json`),
    loadSpriteSheet(`${root}/${charId}/walk_r/walk_r.json`),
    loadSpriteSheet(`${root}/${charId}/move_back/move_back.json`),
  ]);

  return {
    aimFire: aimFire ?? undefined,
    drawHolster: drawHolster ?? undefined,
    holster: holster ?? undefined,
    aimWalkF: aimWalkF ?? undefined,
    aimWalkB: aimWalkB ?? undefined,
    aimWalkL: aimWalkL ?? undefined,
    aimWalkR: aimWalkR ?? undefined,
    throw: throwSheet ?? undefined,
    walkL: walkL ?? undefined,
    walkR: walkR ?? undefined,
    moveBack: moveBack ?? undefined,
  };
}
