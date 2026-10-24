const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
(async () => {
  const outDir = 'C:/xoox/out/forest-play';
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('http://127.0.0.1:5179/forest-play-tool.html', { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForFunction(() => window.forestPlayDebug && window.forestPlayDebug.revision, null, { timeout: 120000 });
  await page.waitForTimeout(2000);
  await page.evaluate(() => {
    window.forestPlayDebug.clearBuild();
    document.querySelector('.panel-tab[data-panel="units"]')?.click();
  });
  await page.evaluate(() => window.forestPlayDebug.teleport(56.5, 40));
  await page.waitForTimeout(900);

  // Install with FX and shoot immediately
  const r1 = await page.evaluate(async () => window.forestPlayDebug.dropCatalogOnSlot('tower_cannon', '1-tower'));
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(outDir, '50_dnd_place.png') });

  await page.evaluate(() => window.forestPlayDebug.teleport(76.5, 88));
  await page.waitForTimeout(500);
  const r2 = await page.evaluate(async () => window.forestPlayDebug.dropCatalogOnSlot('k_tent', '2-unit'));
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(outDir, '51_dnd_unit_fx.png') });

  // HTML5 to 4-tower
  const html5 = await page.evaluate(async () => {
    window.forestPlayDebug.teleport(84, 200);
    await new Promise((r) => setTimeout(r, 800));
    const target = window.forestPlayDebug.projectSlot('4-tower');
    if (!target?.inView) return { ok: false, target };
    const canvas = document.getElementById('gameCanvas');
    const btn = document.querySelector('#unitCatalogList button');
    const raw = JSON.stringify({ id: 'tower_ballista', name: 'ballista', group: 'tower', source: 'units_free', url: '/tools/unit_lab/units_free/tower_ballista.glb' });
    const dt = new DataTransfer();
    dt.setData('application/x-forest-unit', raw);
    dt.setData('text/plain', 'tower_ballista');
    btn.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: dt }));
    canvas.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt, clientX: target.clientX, clientY: target.clientY }));
    canvas.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt, clientX: target.clientX, clientY: target.clientY }));
    btn.dispatchEvent(new DragEvent('dragend', { bubbles: true, cancelable: true, dataTransfer: dt }));
    await new Promise((r) => setTimeout(r, 400));
    return { ok: true, towers: window.forestPlayDebug.buildPlacedKinds, selected: window.forestPlayDebug.buildSelected };
  });
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(outDir, '54_dnd_html5.png') });

  const placed = await page.evaluate(() => ({
    towers: window.forestPlayDebug.buildPlacedKinds,
    units: window.forestPlayDebug.unitPlacedKinds,
    props: window.forestPlayDebug.placedPropCount,
  }));
  const summary = { r1, r2, html5, placed, errors };
  fs.writeFileSync(path.join(outDir, 'run_summary_dnd.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
