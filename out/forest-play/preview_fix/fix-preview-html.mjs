import fs from 'fs';
const p = 'C:/xoox/forest-play-tool.html';
const s = fs.readFileSync(p, 'utf8');
const lines = s.split(/(\r?\n)/);
const index = lines.findIndex((line) => line.includes('<div id="previewFrame"'));
if (index < 0) throw new Error('previewFrame line not found');
const oldLine = lines[index];
if (oldLine.includes('aria-label="') && !oldLine.includes('aria-label=""')) {
  const fixed = oldLine.replace(/><\/div>\s*$/, '"></div>');
  if (fixed === oldLine) throw new Error('previewFrame line did not match expected malformed closing');
  lines[index] = fixed;
  fs.writeFileSync(p, lines.join(''), 'utf8');
  console.log(`fixed line ${Math.floor(index / 2) + 1}`);
} else {
  throw new Error('previewFrame line already fixed or unexpected');
}
