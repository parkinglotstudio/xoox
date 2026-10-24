from pathlib import Path
h = Path(r'C:\xoox\forest-play-tool.html').read_text(encoding='utf-8')
print('purifyRing', 'purifyRing' in h)
print('mid option', 'value="mid"' in h)
i = h.find('purifySteps')
print(h[i:i+500].encode('unicode_escape').decode())
