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
  await page.waitForTimeout(3000);

  const before = await page.evaluate(() => ({
    rev: window.forestPlayDebug.revision,
    state: window.forestPlayDebug.state,
    buildInstalled: window.forestPlayDebug.buildInstalled,
  }));

  const madeUnits = await page.evaluate(() => window.forestPlayDebug.demoUnits());
  await page.waitForTimeout(2000);

  const madeTowers = await page.evaluate(() => window.forestPlayDebug.demoFive());
  await page.waitForTimeout(1500);

  const placed = await page.evaluate(() => ({
    units: window.forestPlayDebug.unitPlacedKinds,
    towers: window.forestPlayDebug.buildPlacedKinds,
    buildInfo: document.getElementById('buildInfo')?.textContent || '',
    installed: window.forestPlayDebug.buildInstalled,
    unitKinds: window.forestPlayDebug.unitKinds,
    unitBtnCount: document.querySelectorAll('#unitKindButtons button').length,
  }));

  await page.evaluate(() => {
    document.querySelector('.panel-tab[data-panel="build"]')?.click();
  });
  await page.waitForTimeout(400);

  await page.evaluate(() => { window.forestPlayDebug.teleport(56.5, 28); });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, '40_unit_slot1_facility.png'), fullPage: false });

  await page.evaluate(() => { window.forestPlayDebug.teleport(73, 130); });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, '41_unit_slot3_mid.png'), fullPage: false });

  await page.evaluate(() => { window.forestPlayDebug.teleport(66.5, 235); });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, '42_unit_slot5_north.png'), fullPage: false });

  await page.evaluate(() => {
    window.forestPlayDebug.selectBuildSlot('2-unit');
    window.forestPlayDebug.teleport(76.5, 80);
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outDir, '43_build_panel_unit_kinds.png'), fullPage: false });

  const summary = {
    before,
    madeUnits,
    madeTowers,
    placed,
    errors: errors.slice(0, 40),
    shots: [
      '40_unit_slot1_facility.png',
      '41_unit_slot3_mid.png',
      '42_unit_slot5_north.png',
      '43_build_panel_unit_kinds.png',
    ],
  };
  fs.writeFileSync(path.join(outDir, 'run_summary_units.json'), JSON.stringify(summary, null, 2), 'utf8');
  console.log(JSON.stringify(summary, null, 2));
  await browser.close();
})().catch((e) => {
  console.error('FAIL', e);
  process.exit(1);
});
