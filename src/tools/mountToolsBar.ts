import { toolsInBar, TOOLS_HUB_HREF, TOOLS_HUB_TITLE, openToolWindow } from "./toolsCatalog";

function fillToolList(list: HTMLElement): void {
  list.replaceChildren();
  for (const t of toolsInBar()) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "xoox-tools-item";
    b.title = `${t.name}\n${t.blurb}`;
    b.textContent = t.short;
    b.addEventListener("click", () => openToolWindow(t.href, `xoox-tool-${t.id}`));
    list.appendChild(b);
  }
}

/** 메인 게임 상단에 툴 런처 바를 붙인다. 이미 있으면 목록만 다시 채운다. */
export function mountToolsBar(host: HTMLElement = document.body): void {
  const existing = document.getElementById("xooxToolsBar");
  if (existing) {
    const list = existing.querySelector<HTMLElement>(".xoox-tools-list");
    if (list) fillToolList(list);
    return;
  }

  const bar = document.createElement("nav");
  bar.id = "xooxToolsBar";
  bar.className = "xoox-tools-bar";
  bar.setAttribute("aria-label", "개발 툴");

  const hubBtn = document.createElement("button");
  hubBtn.type = "button";
  hubBtn.className = "xoox-tools-hub";
  hubBtn.title = TOOLS_HUB_TITLE;
  hubBtn.textContent = "🛠 툴";
  hubBtn.addEventListener("click", () => openToolWindow(TOOLS_HUB_HREF, "xoox-tools-hub"));

  const list = document.createElement("div");
  list.className = "xoox-tools-list";
  fillToolList(list);

  const allBtn = document.createElement("button");
  allBtn.type = "button";
  allBtn.className = "xoox-tools-all";
  allBtn.title = "툴 허브 페이지 (목록·설명)";
  allBtn.textContent = "전체";
  allBtn.addEventListener("click", () => openToolWindow(TOOLS_HUB_HREF, "xoox-tools-hub"));

  bar.append(hubBtn, list, allBtn);
  host.appendChild(bar);
}
