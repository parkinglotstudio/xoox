const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const outDir = 'C:/xoox/out/forest-play';
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push('console:' + msg.text());
  });

  await page.goto('http://127.0.0.1:5179/forest-play-tool.html', { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForFunction(() => window.forestPlayDebug && window.forestPlayDebug.revision, null, { timeout: 120000 });
  await page.waitForTimeout(2500);

  await page.evaluate(() => {
    window.forestPlayDebug.clearBuild();
    document.querySelector('.panel-tab[data-panel="units"]')?.click();
  });
  await page.waitForTimeout(400);

  // Direct slot DnD (install + spawn FX)
  await page.evaluate(() => window.forestPlayDebug.teleport(56.5, 40));
  await page.waitForTimeout(900);

  const towerDrop = await page.evaluate(async () => {
    return await window.forestPlayDebug.dropCatalogOnSlot('tower_cannon', '1-tower');
  });
  // Capture FX mid-burst
  await page.waitForTimeout(280);
  await page.screenshot({ path: path.join(outDir, '50_dnd_place.png'), fullPage: false });

  const unitDrop = await page.evaluate(async () => {
    window.forestPlayDebug.teleport(76.5, 88);
    await new Promise((r) => setTimeout(r, 600));
    return await window.forestPlayDebug.dropCatalogOnSlot('k_tent', '2-unit');
  });
  await page.waitForTimeout(280);
  await page.screenshot({ path: path.join(outDir, '51_dnd_unit_fx.png'), fullPage: false });

  // Raycast DnD path with widened snap (project slot → dropCatalog)
  const rayDrop = await page.evaluate(async () => {
    window.forestPlayDebug.teleport(73, 150);
    await new Promise((r) => setTimeout(r, 700));
    const p = window.forestPlayDebug.projectSlot('3-tower');
    if (!p) return { ok: false, mode: 'no_project' };
    return { ...(await window.forestPlayDebug.dropCatalog('tower_gun', p.clientX, p.clientY)), project: p };
  });
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(outDir, '52_dnd_ray_tower.png'), fullPage: false });

  // Free prop + FX
  const propDrop = await page.evaluate(async () => {
    window.forestPlayDebug.teleport(90, 40);
    await new Promise((r) => setTimeout(r, 600));
    const rect = document.getElementById('gameCanvas').getBoundingClientRect();
    return await window.forestPlayDebug.dropCatalog('monster_mushnub', rect.left + rect.width * 0.72, rect.top + rect.height * 0.58);
  });
  await page.waitForTimeout(280);
  await page.screenshot({ path: path.join(outDir, '53_dnd_prop_fx.png'), fullPage: false });

  // HTML5 DragEvent → 4-tower
  const html5 = await page.evaluate(async () => {
    window.forestPlayDebug.teleport(84, 200);
    await new Promise((r) => setTimeout(r, 700));
    let target = window.forestPlayDebug.projectSlot('4-tower');
    for (let i = 0; i < 6 && (!target || !target.inView); i++) {
      await new Promise((r) => setTimeout(r, 250));
      target = window.forestPlayDebug.projectSlot('4-tower');
    }
    if (!target || !target.inView) return { ok: false, reason: 'not in view', target };
    const canvas = document.getElementById('gameCanvas');
    const btn = document.querySelector('#unitCatalogList button') || document.body;
    const raw = JSON.stringify({
      id: 'tower_ballista',
      name: 'ballista',
      group: 'tower',
      source: 'units_free',
      url: '/tools/unit_lab/units_free/tower_ballista.glb',
    });
    const dt = new DataTransfer();
    dt.setData('application/x-forest-unit', raw);
    dt.setData('text/plain', 'tower_ballista');
    btn.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: dt }));
    canvas.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt, clientX: target.clientX, clientY: target.clientY }));
    canvas.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt, clientX: target.clientX, clientY: target.clientY }));
    btn.dispatchEvent(new DragEvent('dragend', { bubbles: true, cancelable: true, dataTransfer: dt }));
    await new Promise((r) => setTimeout(r, 500));
    return { ok: true, target, towers: window.forestPlayDebug.buildPlacedKinds };
  });
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(outDir, '54_dnd_html5.png'), fullPage: false });

  // Keep click-picker alive: click a free tower pad
  const picker = await page.evaluate(() => {
    window.forestPlayDebug.teleport(66.5, 250);
  });
  await page.waitForTimeout(800);
  const pickClick = await page.evaluate(() => {
    const p = window.forestPlayDebug.projectSlot('5-tower');
    if (!p) return { ok: false };
    const canvas = document.getElementById('gameCanvas');
    const rect = canvas.getBoundingClientRect();
    // synthesize click via pick path: dispatch pointer events
    canvas.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: p.clientX, clientY: p.clientY, button: 0 }));
    canvas.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: p.clientX, clientY: p.clientY, button: 0 }));
    return { project: p, selected: window.forestPlayDebug.buildSelected, pickerShown: getComputedStyle(document.getElementById('slotPicker')).display !== 'none' };
  });

  const placed = await page.evaluate(() => ({
    towers: window.forestPlayDebug.buildPlacedKinds,
    units: window.forestPlayDebug.unitPlacedKinds,
    props: window.forestPlayDebug.placedPropCount,
    catalog: window.forestPlayDebug.unitCatalogCount,
    status: document.getElementById('status')?.textContent || '',
  }));

  const summary = {
    towerDrop, unitDrop, rayDrop, propDrop, html5, pickClick, placed,
    errors: errors.slice(0, 40),
    shots: ['50_dnd_place.png', '51_dnd_unit_fx.png', '52_dnd_ray_tower.png', '53_dnd_prop_fx.png', '54_dnd_html5.png'],
  };
  fs.writeFileSync(path.join(outDir, 'run_summary_dnd.json'), JSON.stringify(summary, null, 2), 'utf8');
  console.log(JSON.stringify(summary, null, 2));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
