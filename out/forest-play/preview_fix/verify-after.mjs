import { chromium } from 'playwright';
const out = 'C:/xoox/out/forest-play/preview_fix';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
await page.goto('http://127.0.0.1:5179/forest-play-tool.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
const initial = await page.evaluate(() => ({
  chip: !!document.getElementById('previewChip'), gamePreview: !!document.getElementById('gamePreview'), frame: !!document.getElementById('previewFrame'),
  scriptCount: document.querySelectorAll('script[type="module"]').length,
  initialClass: document.body.className,
  initialDisplay: getComputedStyle(document.getElementById('gamePreview')).display,
  initialHidden: document.getElementById('previewChip').hasAttribute('hidden')
}));
await page.locator('#previewChip').click({ timeout: 3000 });
await page.waitForTimeout(120);
const opened = await page.evaluate(() => {
 const gp=document.getElementById('gamePreview'), chip=document.getElementById('previewChip'), frame=document.getElementById('previewFrame');
 const r=frame.getBoundingClientRect();
 return {bodyClass:document.body.className, previewClass:gp.className, previewDisplay:getComputedStyle(gp).display, chipHidden:chip.hasAttribute('hidden'), frameRect:{x:r.x,y:r.y,w:r.width,h:r.height}, previewZ:getComputedStyle(gp).zIndex};
});
await page.screenshot({ path: out + '/after.png', fullPage: false });
await page.locator('#previewCollapse').click({ timeout: 3000 });
await page.waitForTimeout(80);
const closed = await page.evaluate(() => ({ bodyClass:document.body.className, previewClass:document.getElementById('gamePreview').className, chipHidden:document.getElementById('previewChip').hasAttribute('hidden') }));
console.log(JSON.stringify({initial, opened, closed, errors}, null, 2));
await browser.close();
