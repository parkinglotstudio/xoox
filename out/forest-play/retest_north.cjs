const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto('http://127.0.0.1:5179/forest-play-tool.html', { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForFunction(() => window.forestPlayDebug && window.forestPlayDebug.revision, null, { timeout: 120000 });
  await page.waitForTimeout(2500);
  const r = await page.evaluate(() => {
    const d = window.forestPlayDebug;
    d.teleport(75, 40);
    const y0 = d.setYaw(Math.PI);
    const n = d.combatSpawn();
    const mobs = d.combatMobs || [];
    const avgY = mobs.reduce((s, m) => s + m.y, 0) / Math.max(1, mobs.length);
    return {
      y0,
      yaw: d.yaw,
      n,
      avgY,
      avgDy: avgY - d.player.y,
      ranks: [...new Set(mobs.map((m) => m.rank))],
      sample: mobs.slice(0, 4),
      allStand: mobs.every((m) => d.canStandAt(m.x, m.y, 0.65)),
    };
  });
  console.log(JSON.stringify(r, null, 2));
  await page.screenshot({ path: 'C:/Users/dmaxd/xoox-map-concepts/out/forest-play/combat_nav/08_pack_north_fixed.png' });
  const fs = require('fs');
  fs.copyFileSync(
    'C:/Users/dmaxd/xoox-map-concepts/out/forest-play/combat_nav/08_pack_north_fixed.png',
    'C:/xoox/out/forest-play/combat_nav/08_pack_north_fixed.png',
  );
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
