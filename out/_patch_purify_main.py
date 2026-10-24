from pathlib import Path
import re

path = Path(r'C:\xoox\src\tools\forestPlay\main.ts')
src = path.read_text(encoding='utf-8')

# --- 1) Insert stage helpers after Manifest type / before $ ---
helper = r'''
const PURIFY_STAGES = ['polluted', 'mid', 'purified'] as const;
type PurifyStage = (typeof PURIFY_STAGES)[number];
const PURIFY_LABELS: Record<PurifyStage, string> = {
  polluted: '오염',
  mid: '정화중',
  purified: '정화완료',
};
const PURIFY_NUM: Record<PurifyStage, number> = { polluted: 1, mid: 2, purified: 3 };

function isPurifyStage(v: string): v is PurifyStage {
  return (PURIFY_STAGES as readonly string[]).includes(v);
}
function normalizeStage(v: string): PurifyStage {
  if (isPurifyStage(v)) return v;
  return v === 'polluted' ? 'polluted' : 'purified';
}
/** Mid / purified share building assets; only polluted uses polluted variants. */
function buildMapState(state: string): 'purified' | 'polluted' {
  return state === 'polluted' ? 'polluted' : 'purified';
}
function hexLerp(a: string, b: string, t: number): string {
  const ca = new THREE.Color(a);
  const cb = new THREE.Color(b);
  return '#' + ca.lerp(cb, t).getHexString();
}
function lerpLighting(a: Lighting, b: Lighting, t: number): Lighting {
  const u = Math.min(1, Math.max(0, t));
  return {
    sky: hexLerp(a.sky, b.sky, u),
    sun: hexLerp(a.sun, b.sun, u),
    sunIntensity: a.sunIntensity + (b.sunIntensity - a.sunIntensity) * u,
    hemiSky: hexLerp(a.hemiSky, b.hemiSky, u),
    hemiGround: hexLerp(a.hemiGround, b.hemiGround, u),
    hemiIntensity: a.hemiIntensity + (b.hemiIntensity - a.hemiIntensity) * u,
    fogColor: hexLerp(a.fogColor ?? a.sky, b.fogColor ?? b.sky, u),
    fogNear: (a.fogNear ?? 90) + ((b.fogNear ?? 90) - (a.fogNear ?? 90)) * u,
    fogFar: (a.fogFar ?? 300) + ((b.fogFar ?? 300) - (a.fogFar ?? 300)) * u,
    backdropTint: hexLerp(a.backdropTint ?? '#ffffff', b.backdropTint ?? '#ffffff', u),
  };
}
function applyMoodLighting(light: Lighting, skyHex?: string): void {
  scene.background = new THREE.Color(skyHex ?? light.sky);
  hemi.color.set(light.hemiSky);
  hemi.groundColor.set(light.hemiGround);
  hemi.intensity = light.hemiIntensity;
  sun.color.set(light.sun);
  sun.intensity = light.sunIntensity;
  moodFog = light.fogColor
    ? new THREE.Fog(light.fogColor, light.fogNear ?? 90, light.fogFar ?? 300)
    : null;
}

type MoodTransition = {
  from: Lighting;
  to: Lighting;
  toSky?: string;
  t0: number;
  dur: number;
  swapped: boolean;
};
let moodTransition: MoodTransition | null = null;
let activeLighting: Lighting | null = null;
let purifyBusy = false;

'''

if 'const PURIFY_STAGES' not in src:
    marker = 'const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;'
    if marker not in src:
        raise SystemExit('marker $ not found')
    src = src.replace(marker, helper + marker, 1)
    print('inserted helpers')
else:
    print('helpers already present')

# --- 2) Replace loadMood function entirely ---
load_mood_new = r'''
function syncPurifyUi(state: PurifyStage): void {
  const sel = document.getElementById('stateSelect') as HTMLSelectElement | null;
  if (sel && sel.value !== state) sel.value = state;
  const ring = document.getElementById('purifyRing');
  if (ring) ring.setAttribute('data-stage', state);
  const num = document.getElementById('purifyStageNum');
  if (num) num.textContent = String(PURIFY_NUM[state]);
  const name = document.getElementById('purifyStageName');
  if (name) name.textContent = PURIFY_LABELS[state];
  const badge = document.getElementById('statusPurify');
  if (badge) {
    badge.setAttribute('data-stage', state);
    badge.textContent = PURIFY_LABELS[state];
  }
  document.querySelectorAll<HTMLButtonElement>('#purifySteps button, #purifyCompact button').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.stage === state);
  });
}

function pulsePurifyFlash(): void {
  const el = document.getElementById('purifyFlash');
  if (!el) return;
  el.classList.add('on');
  window.setTimeout(() => el.classList.remove('on'), 420);
}

function tickMoodTransition(now = performance.now()): void {
  if (!moodTransition) return;
  const { from, to, toSky, t0, dur } = moodTransition;
  const u = Math.min(1, (now - t0) / dur);
  // Ease in-out
  const e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
  const lit = lerpLighting(from, to, e);
  // Soft bloom-ish pulse mid-transition
  const pulse = Math.sin(Math.PI * e) * 0.35;
  lit.sunIntensity += pulse * 0.55;
  lit.hemiIntensity += pulse * 0.12;
  applyMoodLighting(lit, e > 0.35 ? toSky ?? to.sky : undefined);
  activeLighting = lit;
  if (u >= 1) {
    applyMoodLighting(to, toSky ?? to.sky);
    activeLighting = to;
    moodTransition = null;
    updateShadow(true);
  }
}

async function loadMood(state: string, opts: { animate?: boolean } = {}) {
  if (!manifest) return;
  const stage = normalizeStage(state);
  const animate = opts.animate !== false && ready && !!activeLighting;
  const token = ++request;
  loading = true;
  loadError = '';
  const prevState = currentState;
  currentState = stage;
  syncPurifyUi(stage);
  statusEl().textContent = `정화 단계: ${PURIFY_LABELS[stage]} 불러오는 중…`;
  const fromLight =
    activeLighting ??
    manifest.lighting[normalizeStage(prevState)] ??
    manifest.lighting.purified;
  try {
    const background = manifest.backdrops?.[stage];
    const light = manifest.lighting[stage];
    if (!light) throw new Error('missing lighting for ' + stage);
    const glbUrl = (manifest.states[stage] ?? manifest.states.purified) + '?rev=' + manifest.revision;
    const next = await MapView.load(
      glbUrl,
      manifest.person,
      undefined,
      undefined,
      {
        blockM: 0.5,
        personM: 1.5,
        stand: { x: player.x, y: player.y, z: 0, yaw: 0 },
        backdrop: background ?? { radius: 420, height: 360, footY: 255 },
      },
    );
    let nextSky: ForestSky | null = null;
    try {
      if (background) nextSky = await ForestSky.load(background, light.backdropTint);
    } catch (e) {
      next.dispose();
      throw e;
    }
    if (token !== request) {
      next.dispose();
      nextSky?.dispose();
      return;
    }
    // Swap sky + map
    forestSky?.dispose();
    forestSky = nextSky;
    if (forestSky) scene.add(forestSky.mesh);
    view?.dispose();
    view = next;
    const mushroomCount = applyForestPlayMushroomScale(view.root);
    console.info(`[forest-play] mushroom scale override: ${FOREST_PLAY_MUSHROOM_SCALE} (${mushroomCount} instances)`);
    view.grassFar = 58;
    scene.add(view.root);
    syncPersonVisibility();
    void playBuild.setMapState(buildMapState(stage));
    $('mapInfo').textContent = [
      '리비전: ' + manifest.revision,
      '정화 단계: ' + PURIFY_LABELS[stage] + ' (' + stage + ')',
      '스폰: ' + player.x.toFixed(1) + ', ' + player.y.toFixed(1) + ' m',
      '맵: 150 × 300 m',
      '카탈로그: ' + catalogItems.length + '종',
    ].join('\n');
    if (selectedObjectId) selectCatalogItem(selectedObjectId);
    else renderObjectList();

    if (animate && fromLight) {
      pulsePurifyFlash();
      moodTransition = {
        from: { ...fromLight },
        to: { ...light },
        toSky: background?.sky ?? light.sky,
        t0: performance.now(),
        dur: 1200,
        swapped: true,
      };
      // Start from previous lighting; tick will ease toward target
      applyMoodLighting(fromLight);
      activeLighting = fromLight;
    } else {
      moodTransition = null;
      applyMoodLighting(light, background?.sky ?? light.sky);
      activeLighting = { ...light };
      updateShadow(true);
    }
    statusEl().textContent = `정화 단계: ${PURIFY_LABELS[stage]}`;
  } catch (e) {
    loadError = (e as Error).message;
    statusEl().textContent = '로드 실패: ' + loadError;
    console.error(e);
  } finally {
    if (token === request) loading = false;
  }
}

async function setPurifyStage(state: string): Promise<void> {
  const stage = normalizeStage(state);
  if (purifyBusy) return;
  if (stage === currentState && view && !loadError) {
    syncPurifyUi(stage);
    return;
  }
  purifyBusy = true;
  try {
    await loadMood(stage, { animate: true });
  } finally {
    purifyBusy = false;
  }
}

function stepPurifyStage(delta: number): void {
  const idx = PURIFY_STAGES.indexOf(normalizeStage(currentState));
  const next = PURIFY_STAGES[Math.min(PURIFY_STAGES.length - 1, Math.max(0, idx + delta))];
  if (next) void setPurifyStage(next);
}

'''

# Find and replace old loadMood
m = re.search(r'async function loadMood\(state: string\) \{', src)
if not m:
    raise SystemExit('loadMood not found')
# Find the matching closing brace of the function - naive brace count from start
start = m.start()
i = m.end() - 1
depth = 0
end = None
for j in range(start, len(src)):
    ch = src[j]
    if ch == '{':
        depth += 1
    elif ch == '}':
        depth -= 1
        if depth == 0:
            end = j + 1
            break
if end is None:
    raise SystemExit('could not find end of loadMood')
print('replacing loadMood', start, end, 'len', end-start)
src = src[:start] + load_mood_new + src[end:]

# --- 3) Replace stateSelect onchange / reloadMap ---
old_bind = '''($('stateSelect') as HTMLSelectElement).onchange = () => {
  void loadMood(($('stateSelect') as HTMLSelectElement).value);
};
$('reloadMap').onclick = () => {
  void loadMood(($('stateSelect') as HTMLSelectElement).value);
};'''

new_bind = '''($('stateSelect') as HTMLSelectElement).onchange = () => {
  void setPurifyStage(($('stateSelect') as HTMLSelectElement).value);
};
$('reloadMap').onclick = () => {
  void loadMood(($('stateSelect') as HTMLSelectElement).value, { animate: false });
};
document.querySelectorAll<HTMLButtonElement>('#purifySteps button, #purifyCompact button').forEach((btn) => {
  btn.addEventListener('click', () => {
    const stage = btn.dataset.stage;
    if (stage) void setPurifyStage(stage);
  });
});'''

if old_bind in src:
    src = src.replace(old_bind, new_bind, 1)
    print('replaced stateSelect binds')
else:
    print('WARN: old_bind not found exactly')
    # try softer
    if "($('stateSelect') as HTMLSelectElement).onchange" in src:
        src = src.replace(
            "void loadMood(($('stateSelect') as HTMLSelectElement).value);",
            "void setPurifyStage(($('stateSelect') as HTMLSelectElement).value);",
            1,
        )
        print('soft-replaced onchange')

# --- 4) Keyboard 1/2/3 and [ ] ---
old_key = '''addEventListener('keydown', (e) => {
  if ((e.target as HTMLElement).matches('input,select,textarea,button,a')) return;
  if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
    e.preventDefault();
    keys.add(e.code);
  }
  if (e.code === 'KeyF') {
    e.preventDefault();
    playCombat.manualFire();
    refreshCombatInfo();
  }
});'''

new_key = '''addEventListener('keydown', (e) => {
  if ((e.target as HTMLElement).matches('input,select,textarea,button,a')) return;
  if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
    e.preventDefault();
    keys.add(e.code);
  }
  if (e.code === 'KeyF') {
    e.preventDefault();
    playCombat.manualFire();
    refreshCombatInfo();
  }
  if (e.code === 'Digit1' || e.code === 'Numpad1') {
    e.preventDefault();
    void setPurifyStage('polluted');
  } else if (e.code === 'Digit2' || e.code === 'Numpad2') {
    e.preventDefault();
    void setPurifyStage('mid');
  } else if (e.code === 'Digit3' || e.code === 'Numpad3') {
    e.preventDefault();
    void setPurifyStage('purified');
  } else if (e.code === 'BracketLeft') {
    e.preventDefault();
    stepPurifyStage(-1);
  } else if (e.code === 'BracketRight') {
    e.preventDefault();
    stepPurifyStage(1);
  }
});'''

if old_key in src:
    src = src.replace(old_key, new_key, 1)
    print('replaced keydown')
else:
    print('WARN: keydown block not found')

# --- 5) Init: sync UI + loadMood ---
src = src.replace(
    "($('stateSelect') as HTMLSelectElement).value = 'purified';\n  await loadMood('purified');",
    "($('stateSelect') as HTMLSelectElement).value = 'purified';\n  syncPurifyUi('purified');\n  await loadMood('purified', { animate: false });",
    1,
)

# --- 6) Tick: mood transition + status label ---
if 'tickMoodTransition()' not in src:
    src = src.replace(
        '    scene.fog = moodFog;',
        '    tickMoodTransition();\n    scene.fog = moodFog;',
        1,
    )
    print('added tickMoodTransition')

# Status text: show Korean label
old_stat = '`${manifest.revision} · ${currentState} · ${fps} FPS · ${player.x.toFixed(1)}, ${player.y.toFixed(1)}m${charBit}${combatBit}${petBit}`;'
new_stat = '`${manifest.revision} · ${PURIFY_LABELS[normalizeStage(currentState)]} · ${fps} FPS · ${player.x.toFixed(1)}, ${player.y.toFixed(1)}m${charBit}${combatBit}${petBit}`;'
if old_stat in src:
    src = src.replace(old_stat, new_stat, 1)
    print('updated status label')
else:
    print('WARN: status template not found')

path.write_text(src, encoding='utf-8', newline='\n')
print('main.ts patched, lines', src.count(chr(10))+1)
