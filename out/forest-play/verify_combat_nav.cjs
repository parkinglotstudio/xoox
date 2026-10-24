const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const outDir = 'C:/Users/dmaxd/xoox-map-concepts/out/forest-play/combat_nav';
  const mirror = 'C:/xoox/out/forest-play/combat_nav';
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(mirror, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', (e) => console.error('PAGEERROR', e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') console.error('CONSERR', m.text());
  });

  await page.goto('http://127.0.0.1:5179/forest-play-tool.html', {
    waitUntil: 'networkidle',
    timeout: 120000,
  });
  await page.waitForFunction(() => window.forestPlayDebug && window.forestPlayDebug.revision, null, {
    timeout: 120000,
  });
  await page.waitForTimeout(2800);

  // Ensure character + build panel
  await page.evaluate(() => {
    document.querySelector('.panel-tab[data-panel="build"]')?.click();
    document.querySelector('.panel-tab[data-panel="combat"]')?.click();
  });

  // Teleport near tower pad 1-tower (56.5, 53), install gun turret
  const setup = await page.evaluate(() => {
    const d = window.forestPlayDebug;
    d.teleport(56.5, 46);
    d.setYaw?.(0); // face north (+y)
    const ok = d.installTurret('1-tower', 'tower_gun');
    d.syncNav?.();
    const pad = { x: 56.5, y: 53 };
    return {
      ok,
      installed: d.buildInstalled,
      padBlocked: !d.canStandAt(pad.x, pad.y, 0.7),
      nearPadBlocked: !d.canStandAt(56.5, 53, 1.5),
      edgeWalk: d.canStandAt(56.5, 46, 0.6),
      pathAcross: d.findPath(50, 53, 63, 53, 0.65),
      pathAround: d.findPath(50, 46, 63, 46, 0.65),
      player: d.player,
    };
  });

  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outDir, '01_tower_pad_blocker.png') });

  // Spawn 2-rank pack ahead
  const pack = await page.evaluate(() => {
    const d = window.forestPlayDebug;
    d.teleport(75, 40);
    d.setYaw?.(0);
    const n = d.combatSpawn();
    const mobs = d.combatMobs || [];
    const ranks = [...new Set(mobs.map((m) => m.rank))].sort((a, b) => a - b);
    const front = mobs.filter((m) => m.rank === 0);
    const avgFront =
      front.reduce((s, m) => s + Math.hypot(m.x - d.player.x, m.y - d.player.y), 0) /
      Math.max(1, front.length);
    return {
      n,
      alive: d.combatAlive,
      ranks,
      sample: mobs.slice(0, 6),
      avgFrontDist: avgFront,
      allStand: mobs.every((m) => d.canStandAt(m.x, m.y, 0.65)),
    };
  });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, '02_pack_2rank_spawn.png') });

  // Let mobs path a bit
  await page.waitForTimeout(2000);
  const afterMove = await page.evaluate(() => {
    const d = window.forestPlayDebug;
    return {
      mobs: (d.combatMobs || []).slice(0, 4),
      playing: d.combatPlaying,
    };
  });
  await page.screenshot({ path: path.join(outDir, '03_pack_advancing.png') });

  // STOP freezes
  const stopped = await page.evaluate(() => {
    const d = window.forestPlayDebug;
    const before = (d.combatMobs || []).map((m) => ({ id: m.id, x: m.x, y: m.y }));
    d.combatStop();
    return { before, playing: d.combatPlaying, alive: d.combatAlive };
  });
  await page.waitForTimeout(800);
  const afterStop = await page.evaluate(() => {
    const d = window.forestPlayDebug;
    return (d.combatMobs || []).map((m) => ({ id: m.id, x: m.x, y: m.y }));
  });
  await page.screenshot({ path: path.join(outDir, '04_stop_freeze.png') });

  // Straight shot: face a mob, fire; also test tree miss if possible
  const shot = await page.evaluate(() => {
    const d = window.forestPlayDebug;
    d.combatPlay();
    const mobs = d.combatMobs || [];
    if (!mobs.length) {
      d.combatSpawn();
    }
    const m = (d.combatMobs || [])[0];
    if (!m) return { ok: false };
    // Face mob
    const yaw = Math.atan2(m.x - d.player.x, -(m.y - d.player.y));
    d.setYaw(yaw);
    const los = d.segmentClear(d.player.x, d.player.y, m.x, m.y, 0.15);
    d.combatFire();
    // Off-angle miss: yaw away from pack
    d.setYaw(yaw + Math.PI);
    d.combatFire();
    return {
      ok: true,
      target: m,
      los,
      yaw,
      aliveAfter: d.combatAlive,
      hpSample: (d.combatMobs || []).slice(0, 3),
    };
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, '05_straight_shot.png') });

  // Tree / blocker LOS sample near pad
  const losPad = await page.evaluate(() => {
    const d = window.forestPlayDebug;
    // Line through tower pad center should fail segmentClear
    return {
      throughPad: d.segmentClear(56.5, 46, 56.5, 60, 0.15),
      openLane: d.segmentClear(50, 46, 50, 60, 0.15),
    };
  });

  const summary = {
    url: 'http://127.0.0.1:5179/forest-play-tool.html',
    setup,
    pack,
    afterMove,
    stop: {
      playing: stopped.playing,
      alive: stopped.alive,
      movedWhileStopped: stopped.before.some((b, i) => {
        const a = afterStop[i];
        if (!a) return false;
        return Math.hypot(a.x - b.x, a.y - b.y) > 0.05;
      }),
    },
    shot,
    losPad,
    fooderduckRef: 'C:\\Users\\dmaxd\\Downloads\\6170245215383724202.mp4',
    ts: new Date().toISOString(),
  };

  fs.writeFileSync(path.join(outDir, 'run_summary.json'), JSON.stringify(summary, null, 2));
  // Mirror key outputs
  for (const f of fs.readdirSync(outDir)) {
    fs.copyFileSync(path.join(outDir, f), path.join(mirror, f));
  }
  console.log(JSON.stringify(summary, null, 2));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
