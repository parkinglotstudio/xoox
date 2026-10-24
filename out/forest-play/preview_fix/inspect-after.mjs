import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors=[]; page.on('pageerror',e=>errors.push(e.message)); page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
const resp=await page.goto('http://127.0.0.1:5179/forest-play-tool.html',{waitUntil:'networkidle'});
await page.waitForTimeout(500);
const data=await page.evaluate(()=>({url:location.href,ids:['previewChip','gamePreview','previewFrame','previewCollapse','layout','gameCanvas','purifyFlash'].map(id=>[id,!!document.getElementById(id)]),scripts:[...document.scripts].map(s=>({src:s.src,type:s.type,text:s.textContent?.slice(0,30)})),bodyText:document.body?.innerText?.slice(0,100),bodyHtml:document.body?.innerHTML?.slice(-1000)}));
console.log(JSON.stringify({status:resp?.status(),data,errors},null,2)); await browser.close();
