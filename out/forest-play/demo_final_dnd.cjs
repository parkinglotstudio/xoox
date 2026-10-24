const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
(async () => {
  const outDir = 'C:/xoox/out/forest-play';
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('http://127.0.0.1:5179/forest-play-tool.html', { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForFunction(() => window.forestPlayDebug?.revision, null, { timeout: 120000 });
  await page.waitForTimeout(2000);
  await page.evaluate(() => {
    window.forestPlayDebug.clearBuild();
    document.querySelector('.panel-tab[data-panel="units"]')?.click();
  });
  await page.fill('#unitCatalogSearch', 'tower_ballista');
  await page.waitForTimeout(400);

  await page.evaluate(() => window.forestPlayDebug.teleport(84, 200));
  await page.waitForTimeout(900);

  const html5 = await page.evaluate(async () => {
    const target = window.forestPlayDebug.projectSlot('4-tower');
    if (!target?.inView) return { ok: false, reason: 'not in view', target };
    const btn = [...document.querySelectorAll('#unitCatalogList button')].find(b => (b.dataset.unitId||'').includes('tower_ballista'));
    const canvas = document.getElementById('gameCanvas');
    if (!btn || !canvas) return { ok: false, reason: 'no btn' };
    const entry = { id: 'tower_ballista', name: 'ballista', group: 'tower', source: 'units_free', url: '/tools/unit_lab/units_free/tower_ballista.glb' };
    const raw = JSON.stringify(entry);
    const dt = new DataTransfer();
    dt.setData('application/x-forest-unit', raw);
    dt.setData('text/plain', 'tower_ballista');
    btn.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: dt }));
    // multiple dragovers to set highlight
    for (let i = 0; i < 3; i++) {
      canvas.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt, clientX: target.clientX, clientY: target.clientY }));
    }
    canvas.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt, clientX: target.clientX, clientY: target.clientY }));
    btn.dispatchEvent(new DragEvent('dragend', { bubbles: true, cancelable: true, dataTransfer: dt }));
    await new Promise(r => setTimeout(r, 1000));
    return { towers: window.forestPlayDebug.buildPlacedKinds, props: window.forestPlayDebug.placedPropCount, status: document.getElementById('status')?.textContent, selected: window.forestPlayDebug.buildSelected };
  });
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(outDir, '54_dnd_html5.png') });

  // Final hero shot: clear, install cannon with FX
  await page.evaluate(() => window.forestPlayDebug.clearBuild());
  await page.evaluate(() => window.forestPlayDebug.teleport(56.5, 40));
  await page.waitForTimeout(700);
  const final = await page.evaluate(async () => {
    const a = await window.forestPlayDebug.dropCatalogOnSlot('tower_cannon', '1-tower');
    return a;
  });
  await page.waitForTimeout(220);
  await page.screenshot({ path: path.join(outDir, '50_dnd_place.png') });

  const summary = { html5, final, errors, shots: ['50_dnd_place.png', '51_dnd_unit_fx.png', '52_dnd_ray_tower.png', '53_dnd_prop_fx.png', '54_dnd_html5.png'] };
  fs.writeFileSync(path.join(outDir, 'run_summary_dnd.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
