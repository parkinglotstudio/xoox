const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = 'C:\\xoox\\out\\forest-play\\purify3';
const COPY = 'C:\\Users\\dmaxd\\xoox-map-concepts\\out\\forest-play\\purify3';
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(COPY, { recursive: true });

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--ignore-gpu-blocklist'],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push('console: ' + m.text());
  });

  await page.goto('http://127.0.0.1:5179/forest-play-tool.html', { waitUntil: 'networkidle', timeout: 120000 });
  // wait for ready status
  await page.waitForFunction(() => {
    const s = document.getElementById('status');
    return s && /준비|FPS|정화|revision|forest150/i.test(s.textContent || '');
  }, { timeout: 120000 }).catch(() => {});
  await page.waitForTimeout(2500);

  // Switch to inspect panel so dial is visible in some shots; also take full canvas shots
  const switchStage = async (stage) => {
    await page.evaluate(async (st) => {
      const dbg = window.forestPlayDebug;
      // click button
      const btn = document.querySelector(`#purifyCompact button[data-stage="${st}"]`)
        || document.querySelector(`#purifySteps button[data-stage="${st}"]`);
      if (btn) btn.click();
      else if (dbg && typeof dbg.setStage === 'function') await dbg.setStage(st);
    }, stage);
    await page.waitForTimeout(1800);
  };

  // expose nothing - use UI
  // ensure play mode shows compact control
  await page.click('button.mode-btn[data-mode="play"]').catch(() => {});
  await page.waitForTimeout(400);

  const stages = [
    ['polluted', '01_polluted'],
    ['mid', '02_mid'],
    ['purified', '03_purified'],
  ];

  for (const [stage, name] of stages) {
    await switchStage(stage);
    await page.waitForTimeout(800);
    const shot = path.join(OUT, name + '.png');
    await page.screenshot({ path: shot, fullPage: false });
    fs.copyFileSync(shot, path.join(COPY, name + '.png'));
    console.log('shot', name, 'stage=', await page.evaluate(() => window.forestPlayDebug?.state));
  }

  // Also inspect panel dial shot on mid
  await page.click('button.mode-btn[data-mode="inspect"]').catch(() => {});
  await page.waitForTimeout(500);
  await switchStage('mid');
  const dialShot = path.join(OUT, '04_inspect_dial_mid.png');
  await page.screenshot({ path: dialShot, fullPage: false });
  fs.copyFileSync(dialShot, path.join(COPY, '04_inspect_dial_mid.png'));

  const status = await page.evaluate(() => ({
    state: window.forestPlayDebug?.state,
    status: document.getElementById('status')?.textContent,
    badge: document.getElementById('statusPurify')?.textContent,
    errors: (window.__errs || []),
  }));
  console.log('FINAL', JSON.stringify(status));
  if (errors.length) {
    console.log('PAGE_ERRORS', errors.slice(0, 20).join('\n'));
  } else {
    console.log('NO_PAGE_ERRORS');
  }
  await browser.close();
})().catch((e) => {
  console.error('FAIL', e);
  process.exit(1);
});
