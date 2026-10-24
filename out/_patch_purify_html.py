from pathlib import Path

html_path = Path(r'C:\xoox\forest-play-tool.html')
html = html_path.read_text(encoding='utf-8')

css = r'''
/* --- purify 3-stage dial --- */
.purify-block{margin:10px 0 14px;padding:12px;border-radius:12px;border:1px solid #6a7d4c;background:linear-gradient(160deg,#1a2818f0,#243022ee 55%,#2a2438cc);box-shadow:inset 0 0 24px #0006}
.purify-block h3{margin:0 0 8px;display:flex;align-items:center;justify-content:space-between;gap:8px}
.purify-block .hint{font-size:10px;color:#9aab7a;font-weight:500}
.purify-dial{display:grid;grid-template-columns:88px 1fr;gap:12px;align-items:center}
.purify-ring{position:relative;width:88px;height:88px}
.purify-ring svg{width:100%;height:100%;transform:rotate(-90deg)}
.purify-ring .track{fill:none;stroke:#2e3a28;stroke-width:8}
.purify-ring .arc{fill:none;stroke:#c7d589;stroke-width:8;stroke-linecap:round;stroke-dasharray:220;stroke-dashoffset:220;transition:stroke-dashoffset 1.1s cubic-bezier(.2,.8,.2,1),stroke 0.6s}
.purify-ring[data-stage="polluted"] .arc{stroke:#9a7ab8;stroke-dashoffset:146}
.purify-ring[data-stage="mid"] .arc{stroke:#d4b56a;stroke-dashoffset:73}
.purify-ring[data-stage="purified"] .arc{stroke:#8fd4a8;stroke-dashoffset:0}
.purify-ring .core{position:absolute;inset:18px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#121a12ee;border:1px solid #5a6b40;text-align:center;padding:4px;transition:box-shadow 0.5s,border-color 0.5s}
.purify-ring[data-stage="polluted"] .core{border-color:#7a5a9a;box-shadow:0 0 16px #6a4a8844}
.purify-ring[data-stage="mid"] .core{border-color:#c4a45a;box-shadow:0 0 18px #d4b56a55}
.purify-ring[data-stage="purified"] .core{border-color:#6ab888;box-shadow:0 0 18px #8fd4a866}
.purify-ring .core .stage-num{font-size:16px;font-weight:800;color:#f0e4b0;line-height:1}
.purify-ring .core .stage-name{font-size:9px;color:#c9d4a8;margin-top:2px;line-height:1.1}
.purify-steps{display:flex;flex-direction:column;gap:5px}
.purify-steps button{display:flex;align-items:center;gap:8px;width:100%;margin:0;padding:7px 9px;border-radius:8px;border:1px solid #5a6b40;background:#243422;color:#e8efc8;cursor:pointer;font:inherit;font-size:11px;text-align:left;transition:background .2s,border-color .2s,transform .15s}
.purify-steps button:hover{background:#354d2e}
.purify-steps button.active{font-weight:700;transform:translateX(2px)}
.purify-steps button[data-stage="polluted"].active{background:#3a2a48;border-color:#9a7ab8;color:#e8d8f8}
.purify-steps button[data-stage="mid"].active{background:#4a4020;border-color:#d4b56a;color:#f5e6b0}
.purify-steps button[data-stage="purified"].active{background:#2a4838;border-color:#8fd4a8;color:#d8f5e0}
.purify-steps .dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.purify-steps button[data-stage="polluted"] .dot{background:#9a7ab8}
.purify-steps button[data-stage="mid"] .dot{background:#d4b56a}
.purify-steps button[data-stage="purified"] .dot{background:#8fd4a8}
.purify-compact{display:flex;gap:4px;margin:8px 0}
.purify-compact button{flex:1;padding:8px 4px;border-radius:8px;border:1px solid #5a6b40;background:#243422;color:#d8e2b4;cursor:pointer;font:inherit;font-size:11px;font-weight:700}
.purify-compact button.active[data-stage="polluted"]{background:#3a2a48;border-color:#9a7ab8;color:#e8d8f8}
.purify-compact button.active[data-stage="mid"]{background:#4a4020;border-color:#d4b56a;color:#f5e6b0}
.purify-compact button.active[data-stage="purified"]{background:#2a4838;border-color:#8fd4a8;color:#d8f5e0}
#purifyFlash{position:fixed;inset:42px 300px 28px 0;z-index:15;pointer-events:none;opacity:0;background:radial-gradient(ellipse at 50% 40%,#fff8e0aa 0%,#c7e8ff00 65%);transition:opacity .2s}
#purifyFlash.on{opacity:1}
#statusPurify{margin-left:auto;padding:2px 10px;border-radius:999px;border:1px solid #5a6b40;font-weight:700;font-size:11px;background:#1a2618;color:#d4c88a}
#statusPurify[data-stage="polluted"]{border-color:#9a7ab8;color:#e8d8f8;background:#2a1a38}
#statusPurify[data-stage="mid"]{border-color:#d4b56a;color:#f5e6b0;background:#2a2410}
#statusPurify[data-stage="purified"]{border-color:#8fd4a8;color:#d8f5e0;background:#1a2a20}
@media(max-width:860px){#purifyFlash{inset:42px 0 42vh 0}}
'''

if '/* --- purify 3-stage dial --- */' not in html:
    html = html.replace('</style>', css + '\n</style>', 1)

if 'id="purifyFlash"' not in html:
    html = html.replace(
        '<div id="hint">',
        '<div id="purifyFlash" aria-hidden="true"></div>\n<div id="hint">',
        1,
    )

dial_html = '''
        <div class="purify-block" id="purifyBlock">
          <h3>정화 단계 <span class="hint">1 · 2 · 3 · [ ]</span></h3>
          <div class="purify-dial">
            <div class="purify-ring" id="purifyRing" data-stage="purified">
              <svg viewBox="0 0 88 88" aria-hidden="true">
                <circle class="track" cx="44" cy="44" r="35"></circle>
                <circle class="arc" cx="44" cy="44" r="35"></circle>
              </svg>
              <div class="core">
                <span class="stage-num" id="purifyStageNum">3</span>
                <span class="stage-name" id="purifyStageName">정화완료</span>
              </div>
            </div>
            <div class="purify-steps" id="purifySteps" role="group" aria-label="정화 단계">
              <button type="button" data-stage="polluted"><span class="dot"></span>오염</button>
              <button type="button" data-stage="mid"><span class="dot"></span>정화중</button>
              <button type="button" data-stage="purified" class="active"><span class="dot"></span>정화완료</button>
            </div>
          </div>
        </div>
'''

compact_html = '''
        <h3>정화 단계</h3>
        <div class="purify-compact" id="purifyCompact" role="group" aria-label="정화 단계">
          <button type="button" data-stage="polluted">오염</button>
          <button type="button" data-stage="mid">정화중</button>
          <button type="button" data-stage="purified" class="active">완료</button>
        </div>
'''

idx = html.find('id="stateSelect"')
print('stateSelect idx', idx)
if idx < 0:
    raise SystemExit('stateSelect not found')

start = html.rfind('<label', 0, idx)
end = html.find('</label>', idx) + len('</label>')
print('label slice:', repr(html[start:end][:220]))

new_inspect = dial_html + '''
        <select id="stateSelect" aria-label="맵 상태" hidden>
          <option value="polluted">오염</option>
          <option value="mid">정화중</option>
          <option value="purified" selected>정화완료</option>
        </select>
'''
html = html[:start] + new_inspect + html[end:]

marker = '<div class="char-row" id="charButtons"'
mi = html.find(marker)
if mi < 0:
    raise SystemExit('charButtons not found')
h3 = html.rfind('<h3>', 0, mi)
print('play h3 before char:', repr(html[h3:h3+40]))
if 'id="purifyCompact"' not in html:
    html = html[:h3] + compact_html + '\n' + html[h3:]

if 'id="statusPurify"' not in html:
    html = html.replace(
        '<span id="status">',
        '<span id="statusPurify" data-stage="purified">정화완료</span>\n  <span id="status">',
        1,
    )

html_path.write_text(html, encoding='utf-8', newline='\n')
print('HTML patched OK, length', len(html))
