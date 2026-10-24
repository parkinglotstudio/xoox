import fs from 'fs';
const p='C:/xoox/src/tools/forestPlay/main.ts';
const s=fs.readFileSync(p,'utf8');
const old="if (previewToggleBtn) previewToggleBtn.onclick = () => setPreviewExpanded(true);";
const next="if (previewToggleBtn) {\n  // PlayCamera captures pointerdown on the viewport; keep the chip's click target intact.\n  previewToggleBtn.addEventListener('pointerdown', (e) => e.stopPropagation());\n  previewToggleBtn.onclick = () => setPreviewExpanded(true);\n}";
if(!s.includes(old)) throw Error('preview toggle binding not found');
fs.writeFileSync(p,s.replace(old,next),'utf8');
console.log('updated preview chip pointer guard');
