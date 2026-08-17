import {
  TOOLS,
  TOOLS_HUB_TITLE,
  TOOL_GROUP_LABEL,
  openToolWindow,
  type ToolEntry,
  type ToolGroup,
} from "./toolsCatalog";

const ORDER: ToolGroup[] = ["map", "scenario", "layout", "art", "proto", "other"];

function groupTools(list: ToolEntry[]): Map<ToolGroup, ToolEntry[]> {
  const map = new Map<ToolGroup, ToolEntry[]>();
  for (const t of list) {
    const arr = map.get(t.group) ?? [];
    arr.push(t);
    map.set(t.group, arr);
  }
  return map;
}

function cardHtml(t: ToolEntry): string {
  const npm = t.npm ? `<div class="meta">npm run <code>${t.npm}</code></div>` : "";
  return `
    <article class="card" data-id="${t.id}">
      <h3>${t.name}</h3>
      <p>${t.blurb}</p>
      ${npm}
      <div class="actions">
        <button type="button" data-open="${t.href}" data-name="${t.id}">새 창</button>
        <a href="${t.href}">이 탭에서</a>
      </div>
    </article>`;
}

function render() {
  const root = document.getElementById("hub");
  if (!root) return;
  const grouped = groupTools(TOOLS);

  const sections = ORDER.map((g) => {
    const items = grouped.get(g);
    if (!items?.length) return "";
    return `
      <section class="group">
        <h2>${TOOL_GROUP_LABEL[g]}</h2>
        <div class="grid">${items.map(cardHtml).join("")}</div>
      </section>`;
  }).join("");

  root.innerHTML = `
    <header>
      <div>
        <h1>🛠 ${TOOLS_HUB_TITLE}</h1>
        <p class="sub">
          새 툴은 <code>src/tools/toolsCatalog.ts</code>에 등록하면 여기·메인창 상단에 같이 뜹니다.
        </p>
      </div>
      <a class="game-link" href="/" target="_blank" rel="noopener">🎮 게임 열기</a>
    </header>
    <p class="hint">
      <strong>맵</strong>은 「맵 배치」 하나 — NPC 자리·정화 전후·동선. 데코 그림은 아직 아트 작업.
      상단 바에는 실험 프로토를 숨긴다. <strong>새 창</strong>이면 게임과 나란히 둘 수 있다.
    </p>
    ${sections || `<p class="empty">등록된 툴이 없습니다.</p>`}
  `;

  root.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("button[data-open]");
    if (!btn) return;
    openToolWindow(btn.dataset.open!, btn.dataset.name || "xoox-tool");
  });
}

render();
