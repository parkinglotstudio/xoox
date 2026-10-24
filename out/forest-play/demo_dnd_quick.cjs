const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', e => console.log('PAGEERR', String(e)));
  await page.goto('http://127.0.0.1:5179/forest-play-tool.html', { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForFunction(() => window.forestPlayDebug && window.forestPlayDebug.revision, null, { timeout: 120000 });
  await page.waitForTimeout(2000);
  await page.evaluate(() => window.forestPlayDebug.clearBuild());
  const r = await page.evaluate(async () => {
    window.forestPlayDebug.teleport(56.5, 28);
    await new Promise(r => setTimeout(r, 800));
    const p = window.forestPlayDebug.projectSlot('1-tower');
    const drop = p && p.inView
      ? await window.forestPlayDebug.dropCatalog('tower_gun', p.clientX, p.clientY)
      : await window.forestPlayDebug.dropCatalogOnSlot('tower_gun', '1-tower');
    const drop2 = await pageOrDrop();
    async function pageOrDrop() {
      window.forestPlayDebug.teleport(76.5, 80);
      await new Promise(r => setTimeout(r, 800));
      return await window.forestPlayDebug.dropCatalogOnSlot('tower_cannon', '3-tower');
    }
    return { p, drop, drop2, towers: window.forestPlayDebug.buildPlacedKinds };
  });
  console.log(JSON.stringify(r, null, 2));
  await page.screenshot({ path: 'C:/xoox/out/forest-play/50_dnd_place.png', fullPage: false });
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
