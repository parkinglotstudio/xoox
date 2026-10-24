import { chromium } from 'playwright';
import fs from 'fs';
const out = 'C:/xoox/out/forest-play/preview_fix';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
await page.goto('http://127.0.0.1:5179/forest-play-tool.html', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);
const state = await page.evaluate(() => {
  const chip = document.getElementById('previewChip');
  const gp = document.getElementById('gamePreview');
  const frame = document.getElementById('previewFrame');
  const flash = document.getElementById('purifyFlash');
  const info = (el) => el ? { exists:true, hidden:el.hasAttribute('hidden'), className:el.className, display:getComputedStyle(el).display, pointerEvents:getComputedStyle(el).pointerEvents, zIndex:getComputedStyle(el).zIndex, rect:(() => { const r=el.getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height}; })(), tag:el.tagName } : {exists:false};
  return { chip: info(chip), gamePreview: info(gp), frame: info(frame), flash: info(flash), bodyClass: document.body.className, title: document.title };
});
await page.screenshot({ path: out + '/before.png', fullPage: false });
let clickError = null;
try { await page.locator('#previewChip').click({ timeout: 3000 }); } catch (e) { clickError = String(e); }
await page.waitForTimeout(150);
const after = await page.evaluate(() => {
  const chip = document.getElementById('previewChip');
  const gp = document.getElementById('gamePreview');
  const frame = document.getElementById('previewFrame');
  const info = (el) => el ? { hidden:el.hasAttribute('hidden'), className:el.className, display:getComputedStyle(el).display, pointerEvents:getComputedStyle(el).pointerEvents, rect:(() => { const r=el.getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height}; })() } : null;
  return { chip: info(chip), gamePreview: info(gp), frame: info(frame), bodyClass: document.body.className };
});
await page.screenshot({ path: out + '/after.png', fullPage: false });
console.log(JSON.stringify({state, after, clickError, errors}, null, 2));
await browser.close();
