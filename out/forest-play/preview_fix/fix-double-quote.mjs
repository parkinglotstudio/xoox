import fs from 'fs';
const p='C:/xoox/forest-play-tool.html';
const s=fs.readFileSync(p,'utf8');
const lines=s.split(/(\r?\n)/); const i=lines.findIndex(x=>x.includes('<div id="previewFrame"'));
if(i<0) throw Error('previewFrame missing');
const old=lines[i]; const fixed=old.replace(/""(>\s*<\/div>\s*)$/, '"$1');
if(fixed===old) throw Error('expected double quote not found'); lines[i]=fixed; fs.writeFileSync(p,lines.join(''),'utf8'); console.log(lines[i]);
