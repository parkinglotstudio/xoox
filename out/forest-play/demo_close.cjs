const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const outDir = 'C:/xoox/out/forest-play';
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://127.0.0.1:5179/forest-play-tool.html', { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForFunction(() => window.forestPlayDebug && window.forestPlayDebug.revision, null, { timeout: 120000 });
  await page.waitForTimeout(2500);
  await page.evaluate(() => {
    window.forestPlayDebug.demoUnits();
    window.forestPlayDebug.demoFive();
    document.querySelector('.panel-tab[data-panel="build"]')?.click();
  });
  await page.waitForTimeout(2000);

  // Close to 1-unit (unit_map) — stand south, look north
  await page.evaluate(async () => {
    window.forestPlayDebug.teleport(56.5, 33);
    // nudge camera yaw via UI if present
    const yaw = document.getElementById('camYaw');
    if (yaw) { yaw.value = '0'; yaw.dispatchEvent(new Event('input', { bubbles: true })); }
    const dist = document.getElementById('camDist');
    if (dist) { dist.value = '14'; dist.dispatchEvent(new Event('input', { bubbles: true })); }
  });
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(outDir, '44_close_unit1_map.png') });

  // Close to 2-unit tent
  await page.evaluate(() => {
    window.forestPlayDebug.teleport(76.5, 84);
    window.forestPlayDebug.selectBuildSlot('2-unit');
  });
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(outDir, '45_close_unit2_tent.png') });

  // Close to 5-unit crane
  await page.evaluate(() => {
    window.forestPlayDebug.teleport(66.5, 242);
    window.forestPlayDebug.selectBuildSlot('5-unit');
  });
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(outDir, '46_close_unit5_crane.png') });

  const check = await page.evaluate(() => window.forestPlayDebug.unitPlacedKinds);
  fs.writeFileSync(path.join(outDir, 'unit_close_check.json'), JSON.stringify(check, null, 2));
  console.log(JSON.stringify(check, null, 2));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
